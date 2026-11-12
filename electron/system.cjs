// Operazioni reali sul PC. Gira SOLO nel processo main di Electron.
// Regole di sicurezza:
//  - il renderer manda solo ID noti, mai percorsi o comandi;
//  - si cancella solo dentro cartelle in lista bianca, senza seguire i collegamenti simbolici;
//  - i file modificati nelle ultime 24 ore non si toccano (potrebbero essere in uso);
//  - su sistemi non Windows nulla di distruttivo viene eseguito.
const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const { execFile, spawn } = require('child_process');

const IS_WIN = process.platform === 'win32';
const MIN_AGE_MS = 24 * 3600 * 1000;

/* ---------------- utilità ---------------- */
function run(cmd, args, timeout = 20000) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { windowsHide: true, timeout, maxBuffer: 8 * 1024 * 1024 }, (err, stdout) => (err ? reject(err) : resolve(String(stdout))));
  });
}
const ps = (script) => run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script]);
async function psJson(script) {
  const out = (await ps(script)).trim();
  if (!out) return null;
  return JSON.parse(out);
}

/** Vero solo se `target` sta DENTRO `root` (non uguale, non fuori, non radice di disco). */
function isInside(root, target) {
  const r = path.resolve(root), t = path.resolve(target);
  if (path.parse(r).root === r) return false; // mai una radice di disco
  const rel = path.relative(r, t);
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

/** Visita i file di una cartella senza seguire i link. Chiama cb(fullPath, stat). */
async function walk(dir, cb, stop) {
  if (stop && stop()) return;
  let entries;
  try { entries = await fsp.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (stop && stop()) return;
    const full = path.join(dir, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) await walk(full, cb, stop);
    else if (e.isFile()) { try { await cb(full, await fsp.lstat(full)); } catch { /* file sparito o bloccato */ } }
  }
}

/* ---------------- sorgenti di file inutili ---------------- */
function junkSources() {
  const env = process.env;
  const local = env.LOCALAPPDATA || '';
  const win = env.SystemRoot || 'C:\\Windows';
  const browser = (sub) => [path.join(local, sub, 'Default', 'Cache', 'Cache_Data'), path.join(local, sub, 'Default', 'Code Cache')];
  // Ogni sorgente ha uno o più "elementi" (parts): sono le caselle della terza colonna di Pulizia.
  const list = [
    { id: 'tmp', label: 'File temporanei di Windows', parts: [{ id: 'utente', label: 'Cartella temporanea dell\'utente', dirs: [os.tmpdir()] }, { id: 'windows', label: 'Cartella Temp di Windows', dirs: [path.join(win, 'Temp')] }] },
    { id: 'cache-browser', label: 'Cache dei browser', parts: [{ id: 'chrome', label: 'Cache di Google Chrome', dirs: browser('Google\\Chrome\\User Data') }, { id: 'edge', label: 'Cache di Microsoft Edge', dirs: browser('Microsoft\\Edge\\User Data') }] },
    { id: 'update', label: 'Vecchi file di aggiornamento', needsAdmin: true, parts: [{ id: 'download', label: 'Aggiornamenti di Windows già scaricati', dirs: [path.join(win, 'SoftwareDistribution', 'Download')] }] },
    { id: 'logs', label: 'Registri di errore', match: /\.(log|cab|wer|etl)$/i, parts: [{ id: 'wer', label: 'Rapporti di errore di Windows', dirs: [path.join(local, 'Microsoft', 'Windows', 'WER')] }, { id: 'cbs', label: 'Registri di aggiornamento (CBS)', dirs: [path.join(win, 'Logs', 'CBS')] }] },
    { id: 'thumbs', label: 'Miniature immagini', match: /^(thumbcache|iconcache).*\.db$/i, parts: [{ id: 'miniature', label: 'Miniature e icone di Esplora file', dirs: [path.join(local, 'Microsoft', 'Windows', 'Explorer')] }] },
  ];
  return list.map((s) => ({ ...s, dirs: s.parts.flatMap((p) => p.dirs) })).filter((s) => s.dirs.every((d) => d && path.isAbsolute(d)));
}

async function sizeOf(source) {
  let bytes = 0, count = 0;
  const now = Date.now();
  for (const dir of source.dirs) {
    await walk(dir, (f, st) => {
      if (now - st.mtimeMs < MIN_AGE_MS) return;
      if (source.match && !source.match.test(path.basename(f))) return;
      bytes += st.size; count++;
    });
  }
  return { bytes, count };
}

// Le cartelle nel Cestino risultano di dimensione 0 per la shell: si misurano sul percorso reale ($Recycle.Bin\...), e si contano gli elementi.
async function recycleBinInfo() {
  try {
    const n = await psJson("$s=(New-Object -ComObject Shell.Application).NameSpace(0xA); $t=[int64]0; $c=0; foreach($i in $s.Items()){ $c++; $b=[int64]0; try{ if($i.IsFolder -and $i.Path){ $b=[int64]((Get-ChildItem -LiteralPath $i.Path -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum) } }catch{}; if($b -le 0){ $b=[int64]$i.Size }; if($b -gt 0){ $t+=$b } }; @{bytes=$t;count=$c} | ConvertTo-Json");
    return { bytes: n?.bytes ?? 0, count: n?.count ?? 0 };
  } catch { return { bytes: 0, count: 0 }; }
}
const recycleBinBytes = async () => (await recycleBinInfo()).bytes;

async function scanJunk() {
  if (!IS_WIN) throw new Error('La pulizia reale funziona solo su Windows.');
  const out = [];
  for (const s of junkSources()) {
    const parts = [];
    for (const p of s.parts) { const r = await sizeOf({ dirs: p.dirs, match: s.match }); if (r.bytes > 0) parts.push({ id: p.id, label: p.label, bytes: r.bytes, files: r.count }); }
    const bytes = parts.reduce((a, p) => a + p.bytes, 0), count = parts.reduce((a, p) => a + p.files, 0);
    if (bytes > 0) out.push({ id: s.id, label: s.label, bytes, safe: !s.needsAdmin, note: s.needsAdmin ? 'Richiede i permessi di amministratore' : undefined, files: count, parts });
  }
  const rb = await recycleBinInfo();
  if (rb.bytes > 0 || rb.count > 0) out.push({ id: 'recycle', label: 'Cestino', bytes: rb.bytes, count: rb.count, safe: true });
  return out;
}

/** Cancella solo ID conosciuti. Restituisce i byte davvero liberati e cosa non si è riusciti a togliere. */
async function cleanJunk(ids) {
  if (!IS_WIN) throw new Error('La pulizia reale funziona solo su Windows.');
  if (!Array.isArray(ids) || ids.some((i) => typeof i !== 'string')) throw new Error('Richiesta non valida.');
  const sources = junkSources();
  let freed = 0, skipped = 0;
  const now = Date.now();
  for (const raw of [...new Set(ids)]) {
    const [id, partId] = raw.split('/');
    if (id === 'recycle' && partId === undefined) {
      const before = await recycleBinBytes();
      try { await ps('Clear-RecycleBin -Force -ErrorAction Stop'); freed += before; } catch { skipped++; }
      continue;
    }
    const s = sources.find((x) => x.id === id);
    if (!s) continue; // ID sconosciuto: ignorato
    const part = partId === undefined ? null : s.parts.find((p) => p.id === partId);
    if (partId !== undefined && !part) continue; // elemento sconosciuto: ignorato
    for (const dir of (part ? part.dirs : s.dirs)) {
      const files = [];
      await walk(dir, (f, st) => {
        if (now - st.mtimeMs < MIN_AGE_MS) return;
        if (s.match && !s.match.test(path.basename(f))) return;
        files.push([f, st.size]);
      });
      for (const [f, size] of files) {
        if (!isInside(dir, f)) continue; // doppio controllo
        try { await fsp.unlink(f); freed += size; } catch { skipped++; }
      }
      await removeEmptyDirs(dir, dir);
    }
  }
  return { freedBytes: freed, skipped };
}

async function removeEmptyDirs(root, dir) {
  let entries;
  try { entries = await fsp.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) if (e.isDirectory() && !e.isSymbolicLink()) await removeEmptyDirs(root, path.join(dir, e.name));
  if (dir !== root && isInside(root, dir)) { try { await fsp.rmdir(dir); } catch { /* non vuota: ok */ } }
}

/* ---------------- registro di Windows ---------------- */
/** Legge l'output di `reg query` in [{key, name, type, value}]. */
function parseRegQuery(text) {
  const rows = []; let key = '';
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    if (!/^\s/.test(raw)) { key = raw.trim(); continue; }
    const m = raw.trim().match(/^(.+?)\s{4}(REG_[A-Z_]+)(?:\s{4}(.*))?$/);
    if (m) rows.push({ key, name: m[1], type: m[2], value: m[3] ?? '' });
  }
  return rows;
}
async function regQuery(keyPath, extra = []) {
  try { return parseRegQuery(await run('reg.exe', ['query', keyPath, ...extra])); } catch { return []; }
}

/* ---------------- avvio automatico ---------------- */
// Stesse fonti di Gestione attività: chiavi Run (utente e computer, anche 32 bit), cartella Esecuzione automatica; lo stato sta in StartupApproved.
const WIN_CV = 'Software\\Microsoft\\Windows\\CurrentVersion';
const RUN = { user: `HKCU\\${WIN_CV}\\Run`, machine: `HKLM\\${WIN_CV}\\Run`, machine32: `HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run` };
const APPROVED = {
  user: `HKCU\\${WIN_CV}\\Explorer\\StartupApproved\\Run`, machine: `HKLM\\${WIN_CV}\\Explorer\\StartupApproved\\Run`,
  machine32: `HKLM\\${WIN_CV}\\Explorer\\StartupApproved\\Run32`, folder: `HKCU\\${WIN_CV}\\Explorer\\StartupApproved\\StartupFolder`,
};
const startupFolder = () => path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
/** Il primo byte di StartupApproved: pari = attivo (02, 06), dispari = disattivato (03, 07). Senza valore = attivo. */
function approvedEnabled(hex) {
  if (!hex) return true;
  const b = parseInt(String(hex).slice(0, 2), 16);
  return Number.isNaN(b) ? true : b % 2 === 0;
}
const exeOf = (cmd) => { const m = String(cmd).match(/^\s*"?([^"]*?\.(?:exe|bat|cmd|lnk))/i); return m ? path.win32.basename(m[1]) : ''; };

// Nomi come li mostra Gestione attività (il pacchetto ha solo un nome tecnico).
const STORE_NAMES = { MicrosoftOfficeHub: 'Microsoft 365 Copilot', YourPhone: 'Collegamento al telefono', WindowsTerminal: 'Terminale', GamingApp: 'Xbox', MSTeams: 'Microsoft Teams',
  IntelGraphicsExperience: 'Intel Graphics Command Center', IntelManagementandSecurityStatus: 'Intel Management and Security Status', OutlookForWindows: 'Outlook', OneDriveSync: 'OneDrive' };
function storeAppName(pkg) {
  const core = String(pkg).split('.').filter(Boolean).pop() || String(pkg); // toglie l'editore: "AppUp.IntelGraphicsExperience" -> "IntelGraphicsExperience"
  return STORE_NAMES[core] || core.replace(/([a-z])([A-Z])/g, '$1 $2');
}
async function getStartupApps() {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  const approved = {};
  for (const k of Object.keys(APPROVED)) approved[k] = new Map((await regQuery(APPROVED[k])).map((r) => [r.name.toLowerCase(), r.value]));
  const list = [];
  for (const scope of ['user', 'machine', 'machine32']) {
    for (const r of await regQuery(RUN[scope])) {
      list.push({ id: `${scope}:${r.name}`, name: r.name, detail: exeOf(r.value), impact: 'sconosciuto', enabled: approvedEnabled(approved[scope].get(r.name.toLowerCase())), canToggle: scope === 'user' });
    }
  }
  // app di Windows (Microsoft Store): Gestione attività le legge da qui. Sola lettura: Windows le cambia solo da Impostazioni.
  try {
    const store = await psJson(`$b='HKCU:\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\CurrentVersion\\AppModel\\SystemAppData'
$pk=@{}; try{Get-AppxPackage | ForEach-Object {$pk[$_.PackageFamilyName]=$_.Name}}catch{}
@(Get-ChildItem $b -ErrorAction SilentlyContinue | ForEach-Object { $fam=$_.PSChildName; Get-ChildItem $_.PSPath -ErrorAction SilentlyContinue | ForEach-Object { $st=(Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue).State; if($null -ne $st){ @{fam=$fam;task=$_.PSChildName;state=[int]$st;pkg=$pk[$fam]} } } }) | ConvertTo-Json`);
    for (const t of [].concat(store || [])) {
      list.push({ id: `store:${t.fam}:${t.task}`, name: storeAppName(t.pkg || t.fam.split('_')[0]), detail: 'app di Windows', impact: 'sconosciuto', enabled: t.state === 2 || t.state === 4, canToggle: false, store: true });
    }
  } catch { /* nessuna app di Windows con avvio automatico */ }
  try {
    for (const f of await fsp.readdir(startupFolder())) {
      if (f.toLowerCase() === 'desktop.ini') continue;
      list.push({ id: `folder:${f}`, name: f.replace(/\.[^.]+$/, ''), detail: f, impact: 'sconosciuto', enabled: approvedEnabled(approved.folder.get(f.toLowerCase())), canToggle: true });
    }
  } catch { /* cartella assente */ }
  return list;
}
async function setStartupEnabled(id, enabled) {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  if (typeof id !== 'string' || typeof enabled !== 'boolean') throw new Error('Richiesta non valida.');
  const known = (await getStartupApps()).find((a) => a.id === id && a.canToggle);
  if (!known) throw new Error('Programma non trovato o non modificabile.');
  const data = enabled ? '020000000000000000000000' : '030000000000000000000000';
  const [scope] = id.split(':');
  const valueName = scope === 'folder' ? known.detail : known.name;
  await run('reg.exe', ['add', scope === 'folder' ? APPROVED.folder : APPROVED.user, '/v', valueName, '/t', 'REG_BINARY', '/d', data, '/f']);
}

/* ---------------- protezione ---------------- */
async function getProtection() {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  const script = `
$r=@{firewall=$false;antivirus=$false;updates=$false;lastUpdate=$null}
try{$r.firewall=(@(Get-NetFirewallProfile | Where-Object {$_.Enabled -eq $true}).Count -ge 1)}catch{}
try{$m=Get-MpComputerStatus; $r.antivirus=[bool]($m.AntivirusEnabled -and $m.RealTimeProtectionEnabled)}catch{}
try{$h=Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 1; if($h.InstalledOn){$d=(New-TimeSpan -Start $h.InstalledOn -End (Get-Date)).Days; $r.updates=($d -le 45); $r.lastUpdate="$d giorni fa"}}catch{}
$r | ConvertTo-Json`;
  return (await psJson(script)) ?? { firewall: false, antivirus: false, updates: false, lastUpdate: null };
}

/* ---------------- programmi installati ---------------- */
const UNINSTALL_KEYS = [
  'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
];
/** `reg query` stampa HKEY_LOCAL_MACHINE anche se gli abbiamo chiesto HKLM: si porta tutto alla forma corta. */
const shortHive = (k) => String(k).replace(/^HKEY_LOCAL_MACHINE/i, 'HKLM').replace(/^HKEY_CURRENT_USER/i, 'HKCU');
async function listPrograms() {
  const byKey = new Map();
  for (const base of UNINSTALL_KEYS) {
    for (const r of await regQuery(base, ['/s'])) {
      const key = shortHive(r.key);
      if (!key.toLowerCase().startsWith(base.toLowerCase()) || key.toLowerCase() === base.toLowerCase()) continue;
      const e = byKey.get(key) ?? { key };
      if (r.name === 'DisplayName') e.name = r.value;
      if (r.name === 'EstimatedSize') e.kb = parseInt(r.value, r.value.startsWith('0x') ? 16 : 10) || 0;
      if (r.name === 'UninstallString') e.uninstall = r.value;
      if (r.name === 'InstallLocation') e.location = String(r.value).replace(/^"|"$/g, '').replace(/[\\/]+$/, '');
      if (r.name === 'SystemComponent' && r.value === '0x1') e.system = true;
      if (r.name === 'ParentKeyName') e.system = true;
      if (r.name === 'ReleaseType') e.update = true; // aggiornamenti di Windows e hotfix
      byKey.set(key, e);
    }
  }
  return [...byKey.values()].filter((e) => e.name && e.uninstall && !e.system && !e.update && !/^(Security Update|Update for|Hotfix) .*KB\d+/i.test(e.name))
    .map((e) => ({ id: Buffer.from(e.key).toString('base64url'), name: e.name, location: e.location || '', bytes: (e.kb || 0) * 1024, lastUsed: 'non disponibile', uninstall: e.uninstall, regKey: e.key }))
    .sort((a, b) => b.bytes - a.bytes);
}
/** Comando per `cmd /s /c`: le virgolette esterne vengono tolte da cmd, il resto resta identico. */
const uninstallCommand = (str) => `"start "" ${String(str).trim()}"`;
async function getPrograms() {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  return (await listPrograms()).map(({ uninstall, location, regKey, ...p }) => p);
}
/** Apre il disinstallatore ufficiale del programma: sarà Windows a chiedere conferma. */
async function removeProgram(id) {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  if (typeof id !== 'string') throw new Error('Richiesta non valida.');
  const p = (await listPrograms()).find((x) => x.id === id);
  if (!p) throw new Error('Programma non trovato.');
  leftoverCtx.set(id, { name: p.name, location: p.location, regKey: p.regKey });
  // La stringa del registro (es. `MsiExec.exe /X{GUID}` o `"C:\\...\\unins000.exe" /SILENT`) va passata a cmd così com'è, senza che Node la racchiuda tra virgolette.
  const child = spawn('cmd.exe', ['/d', '/s', '/c', uninstallCommand(p.uninstall)], { windowsVerbatimArguments: true, detached: true, stdio: 'ignore', windowsHide: true });
  child.on('error', () => {}); child.unref();
  return { started: true };
}


/* ---------------- avanzi dopo la disinstallazione ---------------- */
// Solo cartelle: il registro non si tocca. Si propone solo ciò che ha lo stesso nome del programma o la sua cartella di installazione,
// dentro percorsi dell'utente o di Programmi; tutto va nel Cestino (annullabile) e solo dopo che l'utente ha scelto.
const leftoverCtx = new Map(); // id programma -> { name, location }
let leftoverCache = new Map();  // id avanzo -> { dir, bytes }
const allowedLeftoverRoots = (env = process.env) => [env.LOCALAPPDATA, env.APPDATA, env.ProgramData, env.ProgramFiles, env['ProgramFiles(x86)'], env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Programs')].filter(Boolean);
/** Cartelle candidate per un programma: la sua cartella di installazione e le cartelle con il suo nome esatto. Pura, per i test. */
/** Toglie versione e architettura dal nome del programma: "Everything 1.4.1.1032 (x64)" -> "Everything" (le cartelle dei dati non portano la versione). */
function baseProgramName(name) {
  return String(name || '').replace(/\([^)]*\)/g, ' ').replace(/\s+v?\d+(?:[._-]\d+)*\b/gi, ' ').replace(/\s+/g, ' ').trim();
}
function leftoverCandidates(name, location, env = process.env, sep = path.sep) {
  const j = (...a) => a.join(sep);
  const out = new Set();
  if (location) out.add(location);
  const bases = [env.LOCALAPPDATA, env.APPDATA, env.ProgramData, env.LOCALAPPDATA && j(env.LOCALAPPDATA, 'Programs'), env.ProgramFiles, env['ProgramFiles(x86)']].filter(Boolean);
  for (const n of new Set([String(name || '').trim(), baseProgramName(name)])) {
    if (n.length < 4 || /[\\/:*?"<>|]/.test(n)) continue; // niente nomi corti o con percorsi
    for (const base of bases) out.add(j(base, n));
    // "Azienda Prodotto" (es. "Mozilla Firefox", "Google Chrome"): i dati stanno in Azienda\Prodotto, non in "Mozilla Firefox".
    const parts = n.split(' '); const rest = parts.slice(1).join(' ');
    if (parts.length >= 2 && parts[0].length >= 3 && rest.length >= 4 && !/[\\/:*?"<>|]/.test(rest)) for (const base of bases) out.add(j(base, parts[0], rest));
  }
  return [...out];
}
async function getLeftovers(id) {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  if (typeof id !== 'string') throw new Error('Richiesta non valida.');
  const ctx = leftoverCtx.get(id);
  if (!ctx) return { installed: false, items: [] };
  if ((await listPrograms()).some((p) => p.id === id)) return { installed: true, items: [] }; // ancora installato: non si propone nulla
  const roots = allowedLeftoverRoots();
  leftoverCache = new Map(); const items = [];
  for (const dir of leftoverCandidates(ctx.name, ctx.location)) {
    if (!roots.some((r) => isInside(r, dir))) continue;
    try {
      const st = await fsp.lstat(dir); if (!st.isDirectory() || st.isSymbolicLink()) continue;
      let bytes = 0; await walk(dir, (f, s2) => { bytes += s2.size; });
      const lid = 'l' + items.length; leftoverCache.set(lid, { dir, bytes });
      items.push({ id: lid, dir, bytes });
    } catch { /* non esiste: ok */ }
  }
  const reg = [];
  regCache = new Map();
  for (const c of registryCandidates(ctx.name, ctx.regKey)) {
    try { await run('reg.exe', ['query', c.key]); } catch { continue; } // non esiste
    const rid = 'r' + reg.length; regCache.set(rid, c.key); reg.push({ id: rid, key: c.key });
  }
  return { installed: false, items, reg };
}
/* ---------------- voci di registro rimaste ---------------- */
// Solo chiavi del programma disinstallato: la sua chiave "Uninstall" e Software\<nome> o Software\<Azienda>\<Prodotto> (mai la sola azienda).
// Si propongono, si cancellano solo se l'utente le sceglie, e prima si salva una copia .reg che si ripristina con un doppio clic.
let regCache = new Map(); // id voce -> chiave
let backupDir = null;
const setBackupDir = (d) => { backupDir = d; };
const REG_SHARED = new Set(['microsoft', 'windows', 'software', 'classes', 'policies', 'wow6432node', 'clients', 'odbc', 'mozilla', 'google', 'apple', 'adobe', 'intel', 'nvidia', 'amd', 'realtek', 'oracle', 'java', 'python', 'default', 'registeredapplications']);
const goodRegName = (n) => n.length >= 4 && !/[\\/:*?"<>|]/.test(n) && !REG_SHARED.has(n.toLowerCase());
const REG_SOFT = ['HKCU\\Software', 'HKLM\\SOFTWARE', 'HKLM\\SOFTWARE\\WOW6432Node'];
/** Chiavi candidate per un programma. Pura, per i test. */
function registryCandidates(name, uninstallKey) {
  const out = [];
  if (uninstallKey && UNINSTALL_KEYS.some((b) => String(uninstallKey).toLowerCase().startsWith(b.toLowerCase() + '\\')) && isSafeRegKey(uninstallKey)) out.push({ key: uninstallKey, kind: 'uninstall' });
  for (const n of new Set([String(name || '').trim(), baseProgramName(name)])) {
    if (!n) continue;
    if (goodRegName(n)) for (const r of REG_SOFT) out.push({ key: r + '\\' + n, kind: 'software' });
    const parts = n.split(' '); const rest = parts.slice(1).join(' ');
    if (parts.length >= 2 && parts[0].length >= 3 && goodRegName(rest)) for (const r of REG_SOFT) out.push({ key: r + '\\' + parts[0] + '\\' + rest, kind: 'software' });
  }
  const seen = new Set(); return out.filter((c) => { const k = c.key.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).filter((c) => isSafeRegKey(c.key));
}
/** Una chiave si può cancellare solo se è esattamente di una di queste forme (e non è una chiave condivisa). */
function isSafeRegKey(key) {
  const k = String(key);
  for (const b of UNINSTALL_KEYS) if (k.toLowerCase().startsWith(b.toLowerCase() + '\\')) { const seg = k.slice(b.length + 1); return seg.length >= 2 && !seg.includes('\\') && !/[*?"<>|]/.test(seg); }
  // più lunghe prima, così HKLM\SOFTWARE\WOW6432Node\X non viene letta come HKLM\SOFTWARE\(WOW6432Node)\X
  for (const r of [...REG_SOFT].sort((x, y) => y.length - x.length)) {
    if (!k.toLowerCase().startsWith(r.toLowerCase() + '\\')) continue;
    const segs = k.slice(r.length + 1).split('\\');
    if (segs.length > 2 || segs.some((x) => !x.length || /[*?"<>|]/.test(x))) return false;
    const product = segs[segs.length - 1];
    if (!goodRegName(product)) return false;
    if (segs.length === 2 && (segs[0].length < 3 || ['microsoft', 'windows', 'classes', 'policies', 'wow6432node', 'clients'].includes(segs[0].toLowerCase()))) return false;
    return true;
  }
  return false;
}
/** Script per il processo con permessi di amministratore: per ogni [chiave, file] salva la copia e poi cancella; scrive l'esito in un file JSON. Pura, per i test. */
function adminRegScript(pairs, resultFile) {
  const q = (x) => "'" + String(x).replace(/'/g, "''") + "'";
  return `$out=@(); foreach($it in @(${pairs.map(([k, f]) => `@(${q(k)},${q(f)})`).join(',')})){ reg.exe export $it[0] $it[1] /y *> $null; if($LASTEXITCODE -ne 0){ $out+=@{ok=$false;why='backup'}; continue }; reg.exe delete $it[0] /f *> $null; $out+=@{ok=($LASTEXITCODE -eq 0);why='delete'} }; ConvertTo-Json -InputObject @($out) -Compress | Set-Content -Path ${q(resultFile)} -Encoding UTF8`;
}
/** Come deleteRegistryKeys ma con una richiesta UAC: solo per le chiavi già nell'elenco e valide. */
async function deleteRegistryKeysAdmin(entries) {
  const resultFile = path.join(os.tmpdir(), `bibo-reg-${Date.now()}.json`);
  const b64 = Buffer.from(adminRegScript(entries.map((e) => [e.key, e.file]), resultFile), 'utf16le').toString('base64');
  const outer = `try { Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile','-NonInteractive','-EncodedCommand','${b64}' } catch { exit 1 }`;
  await new Promise((resolve) => execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', outer], { windowsHide: true, timeout: 5 * 60 * 1000 }, () => resolve()));
  try { const r = JSON.parse((await fsp.readFile(resultFile, 'utf8')).replace(/^\uFEFF/, '')); await fsp.unlink(resultFile).catch(() => {}); return Array.isArray(r) ? r : [r]; }
  catch { return null; } // richiesta rifiutata o annullata
}
async function deleteRegistryKeys(ids, asAdmin = false) {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  if (!Array.isArray(ids) || ids.some((i) => typeof i !== 'string') || typeof asAdmin !== 'boolean') throw new Error('Richiesta non valida.');
  if (!backupDir) throw new Error('Cartella delle copie non disponibile.');
  await fsp.mkdir(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-'); let n = 0, failed = 0; const errors = [], moved = [];
  if (asAdmin) {
    const entries = [];
    for (const id of [...new Set(ids)]) { const key = regCache.get(id); if (key && isSafeRegKey(key)) entries.push({ id, key, file: path.join(backupDir, `${stamp}-${++n}.reg`) }); else { failed++; errors.push('Voce non più nell\'elenco: ripeti la ricerca'); } }
    if (entries.length) {
      const res = await deleteRegistryKeysAdmin(entries);
      if (!res) { failed += entries.length; errors.push('Richiesta di amministratore rifiutata o annullata: non ho cancellato nulla'); }
      else entries.forEach((e, i) => { const r = res[i]; if (r && r.ok) { moved.push(e.id); regCache.delete(e.id); } else { failed++; errors.push(`${e.key}: ${r && r.why === 'backup' ? 'copia non riuscita, quindi non l\'ho cancellata' : 'cancellazione non riuscita'}`); } });
    }
    return { deleted: moved.length, failed, errors, moved, backupDir, needsAdmin: false };
  }
  for (const id of [...new Set(ids)]) {
    const key = regCache.get(id);
    if (!key || !isSafeRegKey(key)) { failed++; errors.push('Voce non più nell\'elenco: ripeti la ricerca'); continue; }
    const file = path.join(backupDir, `${stamp}-${++n}.reg`);
    try { await run('reg.exe', ['export', key, file, '/y']); } catch { failed++; errors.push(`${key}: non sono riuscito a salvare la copia, quindi non l'ho cancellata`); continue; }
    try { await run('reg.exe', ['delete', key, '/f']); moved.push(id); regCache.delete(id); }
    catch (e) { failed++; errors.push(/denied|negato|access/i.test(String(e && (e.message || e))) ? `${key}: serve il permesso di amministratore` : `${key}: ${String(e && e.message || e).slice(0, 120)}`); }
  }
  return { deleted: moved.length, failed, errors, moved, backupDir, needsAdmin: errors.some((e) => /amministratore/.test(e)) };
}
async function trashLeftovers(ids) {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  if (!trasher) throw new Error('Cestino non disponibile.');
  if (!Array.isArray(ids) || ids.some((i) => typeof i !== 'string')) throw new Error('Richiesta non valida.');
  const roots = allowedLeftoverRoots(); let freed = 0, failed = 0; const errors = [], moved = [];
  for (const id of [...new Set(ids)]) {
    const x = leftoverCache.get(id);
    if (!x || !roots.some((r) => isInside(r, x.dir))) { errors.push('Cartella non più nell\'elenco: ripeti la ricerca'); failed++; continue; }
    try { const st = await fsp.lstat(x.dir); if (!st.isDirectory() || st.isSymbolicLink()) continue; await trasher(x.dir); freed += x.bytes; moved.push(id); leftoverCache.delete(id); } catch (e) { failed++; errors.push(`${path.basename(x.dir)}: ${String(e && e.message || e).slice(0, 160)}`); }
  }
  return { freedBytes: freed, failed, errors, moved };
}

/* ---------------- file grandi e vecchi ---------------- */
// Non si elimina mai per sempre: i file vanno nel Cestino (annullabile). Il "trasportatore" lo passa main.cjs (shell.trashItem).
let trasher = null;
const setTrasher = (fn) => { trasher = fn; };
const MB = 1024 * 1024;
const largeRoots = () => ['Downloads', 'Documents', 'Desktop', 'Videos'].map((d) => path.join(os.homedir(), d));
let largeCache = new Map();

async function scanLargeFiles(minMB = 100) {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  const found = [];
  for (const root of largeRoots()) await walk(root, (f, st) => { if (st.size >= minMB * MB) found.push({ f, size: st.size, mtime: st.mtimeMs }); });
  found.sort((a, b) => b.size - a.size);
  largeCache = new Map();
  return found.slice(0, 40).map((x, i) => {
    const id = 'f' + i; largeCache.set(id, x.f);
    return { id, name: path.basename(x.f), dir: path.dirname(x.f), bytes: x.size, modified: new Date(x.mtime).toISOString() };
  });
}
async function trashLargeFiles(ids) {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  if (!trasher) throw new Error('Cestino non disponibile.');
  if (!Array.isArray(ids) || ids.some((i) => typeof i !== 'string')) throw new Error('Richiesta non valida.');
  let freed = 0, failed = 0;
  for (const id of [...new Set(ids)]) {
    const p = largeCache.get(id);
    if (!p || !largeRoots().some((r) => isInside(r, p))) continue; // solo file trovati dall'ultima scansione, dentro le cartelle utente
    try { const st = await fsp.lstat(p); if (!st.isFile()) continue; await trasher(p); freed += st.size; largeCache.delete(id); } catch { failed++; }
  }
  return { freedBytes: freed, failed };
}

/* ---------------- file duplicati ---------------- */
// Stesso contenuto (SHA-256), non solo stesso nome. Di ogni gruppo ne resta uno (il più vecchio): gli altri vanno nel Cestino.
const crypto = require('crypto');
function hashFile(file, bytes) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash('sha256');
    const st = fs.createReadStream(file, bytes ? { start: 0, end: bytes - 1 } : undefined);
    st.on('data', (d) => h.update(d)); st.on('error', reject); st.on('end', () => resolve(h.digest('hex')));
  });
}
async function findDuplicateGroups(roots, minBytes) {
  const bySize = new Map();
  for (const root of roots) await walk(root, (f, st) => {
    if (st.size < minBytes) return;
    const a = bySize.get(st.size) || []; a.push({ f, size: st.size, mtime: st.mtimeMs }); bySize.set(st.size, a);
  });
  const groups = [];
  for (const cands of bySize.values()) {
    if (cands.length < 2) continue;
    const byHead = new Map();
    for (const c of cands) { try { const k = await hashFile(c.f, 64 * 1024); (byHead.get(k) || byHead.set(k, []).get(k)).push(c); } catch { /* illeggibile */ } }
    for (const same of byHead.values()) {
      if (same.length < 2) continue;
      const byFull = new Map();
      for (const c of same) { try { const k = await hashFile(c.f); (byFull.get(k) || byFull.set(k, []).get(k)).push(c); } catch { /* illeggibile */ } }
      for (const g of byFull.values()) if (g.length > 1) { g.sort((a, b) => a.mtime - b.mtime || a.f.localeCompare(b.f)); groups.push(g); }
    }
  }
  groups.sort((a, b) => b[0].size * (b.length - 1) - a[0].size * (a.length - 1));
  return groups;
}
let dupCache = new Map();
async function scanDuplicates() {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  const groups = await findDuplicateGroups(largeRoots(), 1 * MB);
  dupCache = new Map();
  return groups.slice(0, 30).map((g, gi) => ({
    id: 'g' + gi, bytes: g[0].size,
    files: g.map((x, i) => { const id = `g${gi}-${i}`; dupCache.set(id, x.f); return { id, name: path.basename(x.f), dir: path.dirname(x.f), modified: new Date(x.mtime).toISOString(), keep: i === 0 }; }),
  }));
}
async function trashDuplicates(ids) {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  if (!trasher) throw new Error('Cestino non disponibile.');
  if (!Array.isArray(ids) || ids.some((i) => typeof i !== 'string')) throw new Error('Richiesta non valida.');
  const wanted = [...new Set(ids)];
  // per ogni gruppo ne deve restare almeno uno: l'originale (-0) non si tocca mai
  const todo = wanted.filter((id) => /^g\d+-[1-9]\d*$/.test(id));
  let freed = 0, failed = 0;
  for (const id of todo) {
    const p = dupCache.get(id);
    if (!p || !largeRoots().some((r) => isInside(r, p))) continue;
    try { const st = await fsp.lstat(p); if (!st.isFile()) continue; await trasher(p); freed += st.size; dupCache.delete(id); } catch { failed++; }
  }
  return { freedBytes: freed, failed };
}

/* ---------------- privacy del browser ---------------- */
const BROWSERS = {
  chrome: { label: 'Google Chrome', exe: 'chrome.exe', kinds: ['history', 'cookies'], dirs: () => [path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data', 'Default')] },
  edge: { label: 'Microsoft Edge', exe: 'msedge.exe', kinds: ['history', 'cookies'], dirs: () => [path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'User Data', 'Default')] },
  // Firefox: i profili stanno in AppData\Roaming\Mozilla\Firefox\Profiles\*. La cronologia è nello stesso file dei segnalibri (places.sqlite): non si tocca.
  firefox: { label: 'Mozilla Firefox', exe: 'firefox.exe', kinds: ['cookies'], files: { cookies: ['cookies.sqlite', 'cookies.sqlite-wal', 'cookies.sqlite-shm'] },
    dirs: () => { const root = path.join(process.env.APPDATA || '', 'Mozilla', 'Firefox', 'Profiles'); try { return fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.isSymbolicLink()).map((d) => path.join(root, d.name)); } catch { return []; } } },
};
const PRIVACY_KINDS = {
  history: { label: 'cronologia', files: ['History', 'History-journal', 'Top Sites', 'Top Sites-journal', 'Visited Links'] },
  cookies: { label: 'cookie (esce dai siti)', files: [path.join('Network', 'Cookies'), path.join('Network', 'Cookies-journal')] },
};
const kindFiles = (b, k) => (BROWSERS[b].files && BROWSERS[b].files[k]) || PRIVACY_KINDS[k].files;
async function isRunning(exe) { try { return (await run('tasklist.exe', ['/FI', `IMAGENAME eq ${exe}`, '/NH'])).toLowerCase().includes(exe); } catch { return false; } }

/** Il browser può restare attivo senza finestre (avvio rapido, app in background, Teams/Outlook che usano Edge): lo diciamo, così l'utente sa cosa chiudere. */
async function hasBrowserWindow(exe) {
  try {
    const name = exe.replace(/\.exe$/i, '');
    const r = await psJson(`$w=@(Get-Process -Name '${name}' -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowHandle -ne 0}).Count; @{w=$w} | ConvertTo-Json`);
    return !!(r && r.w > 0);
  } catch { return true; }
}
async function scanPrivacy() {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  const out = [];
  for (const [b, bi] of Object.entries(BROWSERS)) {
    const dirs = bi.dirs(); if (!dirs.length) continue;
    const running = await isRunning(bi.exe); const windowed = running ? await hasBrowserWindow(bi.exe) : false;
    for (const k of bi.kinds) {
      let bytes = 0;
      for (const d of dirs) for (const f of kindFiles(b, k)) { try { bytes += (await fsp.lstat(path.join(d, f))).size; } catch { /* manca: ok */ } }
      if (bytes > 0) out.push({ id: `${b}:${k}`, browser: bi.label, label: `${bi.label}: ${PRIVACY_KINDS[k].label}`, bytes, running, windowed, browserKey: b });
    }
  }
  return out;
}
/** Quali browser bloccano la pulizia scelta: la cache dei browser (Pulizia) e i dati di un browser (Privacy) non si possono toccare finché il browser gira. */
const JUNK_NEEDS_BROWSERS = { 'cache-browser': ['chrome', 'edge'], 'cache-browser/chrome': ['chrome'], 'cache-browser/edge': ['edge'] };
async function getBlockers(sel) {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  const junk = sel && sel.junk, priv = sel && sel.privacy;
  if (!Array.isArray(junk || []) || !Array.isArray(priv || []) || [...(junk || []), ...(priv || [])].some((x) => typeof x !== 'string')) throw new Error('Richiesta non valida.');
  const keys = new Set();
  for (const id of junk || []) for (const k of JUNK_NEEDS_BROWSERS[id] || []) keys.add(k);
  for (const id of priv || []) { const b = String(id).split(':')[0]; if (Object.prototype.hasOwnProperty.call(BROWSERS, b)) keys.add(b); }
  const out = [];
  for (const key of keys) {
    const { exe, label } = BROWSERS[key];
    if (!(await isRunning(exe))) continue;
    out.push({ key, name: label, windowed: await hasBrowserWindow(exe) });
  }
  return out;
}
/** Chiude i browser scelti dall'utente. Con finestre aperte prima chiede di chiudersi (come la X: ti verrà chiesto di salvare); quello che resta solo in background si termina. */
async function terminateBrowsers(keys) {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  if (!Array.isArray(keys) || keys.some((k) => typeof k !== 'string' || !Object.prototype.hasOwnProperty.call(BROWSERS, k))) throw new Error('Richiesta non valida.');
  const results = [];
  for (const key of [...new Set(keys)]) {
    const { exe, label } = BROWSERS[key]; const name = exe.replace(/\.exe$/i, '');
    if (!(await isRunning(exe))) { results.push({ key, name: label, closed: true }); continue; }
    if (await hasBrowserWindow(exe)) {
      try { await ps(`Get-Process -Name '${name}' -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowHandle -ne 0} | ForEach-Object { [void]$_.CloseMainWindow() }`); } catch { /* proseguo con il controllo */ }
      for (let i = 0; i < 20 && (await hasBrowserWindow(exe)); i++) await new Promise((r) => setTimeout(r, 500)); // fino a 10 s, il tempo di rispondere a "vuoi salvare?"
    }
    if (await hasBrowserWindow(exe)) { results.push({ key, name: label, closed: false, reason: 'ha ancora una finestra aperta: chiudila tu' }); continue; }
    try { await run('taskkill.exe', ['/IM', exe, '/F'], 15000); } catch { /* può essere già uscito */ }
    await new Promise((r) => setTimeout(r, 800));
    const still = await isRunning(exe);
    results.push({ key, name: label, closed: !still, reason: still ? 'è ancora attivo: provalo da Gestione attività' : undefined });
  }
  return results;
}
async function cleanPrivacy(ids) {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  if (!Array.isArray(ids) || ids.some((i) => typeof i !== 'string')) throw new Error('Richiesta non valida.');
  let freed = 0; const blocked = [];
  for (const id of [...new Set(ids)]) {
    const [b, k] = id.split(':');
    if (!BROWSERS[b] || !BROWSERS[b].kinds.includes(k)) continue; // ID sconosciuto o non previsto per quel browser
    if (await isRunning(BROWSERS[b].exe)) { blocked.push(BROWSERS[b].label); continue; } // file bloccati: chiedi di chiudere il browser
    for (const d of BROWSERS[b].dirs()) {
      for (const f of kindFiles(b, k)) {
        const full = path.join(d, f);
        if (!isInside(d, full)) continue;
        try { const st = await fsp.lstat(full); await fsp.unlink(full); freed += st.size; } catch { /* manca o bloccato */ }
      }
    }
  }
  return { freedBytes: freed, blocked: [...new Set(blocked)] };
}

/* ---------------- punto di ripristino ---------------- */
// Windows lo crea solo da amministratore: lanciamo un PowerShell elevato (Windows mostra la sua richiesta di conferma, UAC).
// Il comando è fisso, non contiene dati dell'utente. Codici d'uscita dello script elevato: 0 creato, 3 ne esiste già uno recente (limite di Windows: uno ogni 24 ore),
// 2 protezione del sistema spenta o altro errore. Se l'utente rifiuta la richiesta di Windows, il PowerShell esterno esce con 1.
const RESTORE_INNER = "try { Checkpoint-Computer -Description 'Bibo Tune' -RestorePointType MODIFY_SETTINGS -WarningAction Stop -ErrorAction Stop; exit 0 } catch { if ($_.Exception.Message -match 'already|già|1440|frequen|recent') { exit 3 } else { exit 2 } }";
const restoreOuter = () => `try { $p = Start-Process powershell -Verb RunAs -Wait -PassThru -WindowStyle Hidden -ArgumentList '-NoProfile','-NonInteractive','-Command',"${RESTORE_INNER.replace(/"/g, '`"').replace(/\$/g, '`$')}"; exit $p.ExitCode } catch { exit 1 }`;
function restoreStatus(code) { return { 0: 'created', 3: 'recent', 2: 'disabled', 1: 'denied' }[code] || 'failed'; }
async function createRestorePoint() {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  const code = await new Promise((resolve) => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', restoreOuter()], { windowsHide: true, timeout: 5 * 60 * 1000 }, (err) => resolve(err ? (typeof err.code === 'number' ? err.code : 99) : 0));
  });
  return { status: restoreStatus(code) };
}

/* ---------------- memoria ---------------- */
const PROTECTED = /^(explorer|dwm|winlogon|csrss|svchost|system|idle|searchhost|searchapp|startmenuexperiencehost|shellexperiencehost|textinputhost|taskmgr|lockapp|sihost|ctfmon|bibo tune|electron)$/i;
/** Libera memoria: chiede a Windows di "restringere" i programmi dell'utente (EmptyWorkingSet). Non chiude nulla e non perde dati:
 *  le pagine passano in cache/disco e tornano quando servono. L'effetto è temporaneo. */
async function freeMemory() {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  const r = await psJson(`
Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public static class BiboW{[DllImport("psapi.dll")]public static extern bool EmptyWorkingSet(IntPtr h);}'
$sid=(Get-Process -Id $PID).SessionId
$before=(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory
Get-Process | Where-Object {$_.SessionId -eq $sid -and $_.Id -ne $PID -and $_.ProcessName -notmatch '${PROTECTED.source}'} | ForEach-Object { try{ [void][BiboW]::EmptyWorkingSet($_.Handle) }catch{} }
Start-Sleep -Milliseconds 1200
$after=(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory
@{before=[int64]$before;after=[int64]$after} | ConvertTo-Json`);
  const freed = r ? Math.max(0, (r.after - r.before) * 1024) : 0;
  return { freedBytes: freed };
}
async function getMemoryApps() {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  const r = await psJson(`@(Get-Process | Where-Object {$_.MainWindowHandle -ne 0} | Sort-Object WorkingSet64 -Descending | Select-Object -First 15 | ForEach-Object {@{pid=$_.Id;name=$_.ProcessName;title=$_.MainWindowTitle;bytes=$_.WorkingSet64}}) | ConvertTo-Json`);
  const list = Array.isArray(r) ? r : r ? [r] : [];
  return list.filter((a) => !PROTECTED.test(a.name) && a.pid !== process.pid).slice(0, 8).map((a) => ({ pid: a.pid, name: a.name, title: a.title, bytes: a.bytes }));
}
/** Chiede all'app di chiudersi come farebbe la X della finestra: l'app può chiedere di salvare. Mai terminazione forzata. */
async function closeApp(pid) {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  if (!Number.isInteger(pid)) throw new Error('Richiesta non valida.');
  const a = (await getMemoryApps()).find((x) => x.pid === pid);
  if (!a) throw new Error('Programma non trovato o protetto.');
  await ps(`(Get-Process -Id ${pid}).CloseMainWindow() | Out-Null`);
  return { requested: true };
}


/* ---------------- scansione antivirus (Microsoft Defender) ---------------- */
// Bibo NON ha un motore antivirus proprio: avvia quello di Windows e riporta il risultato.
async function defenderScan() {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  try { await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Start-MpScan -ScanType QuickScan'], 20 * 60 * 1000); }
  catch (e) { throw new Error('Defender non ha completato la scansione (è attivo? servono permessi?).'); }
  const r = await psJson(`@(Get-MpThreat -ErrorAction SilentlyContinue | Where-Object {$_.IsActive} | ForEach-Object {@{name=$_.ThreatName;severity=[int]$_.SeverityID}}) | ConvertTo-Json`);
  const list = Array.isArray(r) ? r : r ? [r] : [];
  return { threats: list.map((t) => ({ name: String(t.name), severity: Number(t.severity) || 0 })) };
}

/* ---------------- spazio su disco ---------------- */
async function getDiskUsage() {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  const d = await psJson(`@(Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | ForEach-Object {@{letter=$_.DeviceID;total=[int64]$_.Size;free=[int64]$_.FreeSpace}}) | ConvertTo-Json`);
  const drives = (Array.isArray(d) ? d : d ? [d] : []).map((x) => ({ letter: x.letter, total: x.total, free: x.free }));
  const names = ['Downloads', 'Documents', 'Desktop', 'Videos', 'Pictures', 'Music'];
  const folders = [];
  for (const n of names) { let bytes = 0; await walk(path.join(os.homedir(), n), (f, st) => { bytes += st.size; }); folders.push({ name: n, bytes }); }
  let app = 0; await walk(path.join(os.homedir(), 'AppData', 'Local'), (f, st) => { app += st.size; }); folders.push({ name: 'Dati delle app', bytes: app });
  return { drives, folders: folders.sort((a, b) => b.bytes - a.bytes) };
}

/** Cartelle di primo livello che Mappa del disco può aprire, con la loro posizione. */
function diskRoots() {
  const h = os.homedir();
  return { Downloads: path.join(h, 'Downloads'), Documents: path.join(h, 'Documents'), Desktop: path.join(h, 'Desktop'), Videos: path.join(h, 'Videos'), Pictures: path.join(h, 'Pictures'), Music: path.join(h, 'Music'), 'Dati delle app': path.join(h, 'AppData', 'Local') };
}
/** Controlla (top, segs) e restituisce il percorso assoluto: solo cartelle dentro le sette conosciute, mai '..' o separatori. */
function checkFolderPath(top, segs) {
  const roots = diskRoots();
  if (typeof top !== 'string' || !Object.prototype.hasOwnProperty.call(roots, top)) throw new Error('Cartella non valida.');
  if (!Array.isArray(segs) || segs.length > 12) throw new Error('Percorso non valido.');
  for (const g of segs) if (typeof g !== 'string' || !g || g === '.' || g === '..' || g.length > 255 || /[\\/:*?"<>|\0]/.test(g)) throw new Error('Percorso non valido.');
  const dir = path.join(roots[top], ...segs);
  if (segs.length && !isInside(roots[top], dir)) throw new Error('Percorso non valido.');
  return dir;
}
/** Dimensioni delle cartelle dentro (top, segs). Solo lettura, con un limite di tempo: se scade, `partial` è vero. */
async function getFolderChildren(top, segs) {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  const dir = checkFolderPath(top, segs);
  const st = await fsp.lstat(dir).catch(() => null);
  if (!st || !st.isDirectory() || st.isSymbolicLink()) throw new Error('Cartella non trovata.');
  const entries = await fsp.readdir(dir, { withFileTypes: true }).catch(() => []);
  const deadline = Date.now() + 8000; let partial = false; const stop = () => { if (Date.now() > deadline) { partial = true; return true; } return false; };
  let others = 0; const dirs = [];
  for (const e of entries) {
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) dirs.push(e.name);
    else if (e.isFile()) { try { others += (await fsp.lstat(path.join(dir, e.name))).size; } catch { /* file sparito */ } }
  }
  const children = []; let i = 0;
  await Promise.all([0, 1, 2, 3].map(async () => {
    while (i < dirs.length) {
      const name = dirs[i++]; let bytes = 0;
      await walk(path.join(dir, name), (f, s) => { bytes += s.size; }, stop);
      children.push({ name, bytes });
    }
  }));
  children.sort((a, b) => b.bytes - a.bytes);
  const shown = children.slice(0, 30); for (const c of children.slice(30)) others += c.bytes;
  return { children: shown, others, partial };
}

/* ---------------- aggiornamenti programmi (winget) ---------------- */
/** Legge la tabella di `winget upgrade` usando le posizioni delle colonne dell'intestazione. */
function parseWingetTable(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  // winget scrive l'intestazione nella lingua di Windows (Version/Versione/Versión..., Available/Disponibile/Disponible...)
  const VER = /Versi[oó]n(e)?|Version|Versão|Versie/, AV = /Available|Disponibil[ei]|Disponible|Disponível|Verfügbar|Beschikbaar/;
  const h = lines.findIndex((l) => /\bId\b/.test(l) && VER.test(l) && AV.test(l));
  if (h < 0) return [];
  const head = lines[h];
  const c = { id: head.search(/\bId\b/), ver: head.search(VER), avail: head.search(AV) };
  if (c.id < 0 || !(c.id < c.ver && c.ver < c.avail)) return [];
  const rows = [];
  for (const l of lines.slice(h + 1)) {
    if (/^-+$/.test(l.trim()) || /upgrades? available/i.test(l)) continue;
    if (l.length <= c.avail) continue;
    const row = { name: l.slice(0, c.id).trim(), id: l.slice(c.id, c.ver).trim(), version: l.slice(c.ver, c.avail).trim(), available: l.slice(c.avail).trim().split(/\s+/)[0] };
    if (row.name && /^[A-Za-z0-9][A-Za-z0-9._+-]*$/.test(row.id) && row.available) rows.push(row);
  }
  return rows;
}
let updCache = [];
async function getAppUpdates() {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  let out; try { out = await run('winget.exe', ['upgrade', '--accept-source-agreements', '--disable-interactivity'], 60000); } catch { throw new Error('winget non disponibile su questo PC (serve Gestione pacchetti di Windows).'); }
  updCache = parseWingetTable(out);
  return updCache;
}
/** Esegue winget e, se fallisce, restituisce le ultime righe di ciò che ha scritto (utili a capire il perché). */
function runWinget(args, timeout) {
  return new Promise((resolve, reject) => {
    execFile('winget.exe', args, { windowsHide: true, timeout, maxBuffer: 8 * 1024 * 1024 }, (err, stdout, stderr) => {
      const text = String(stdout || '') + '\n' + String(stderr || '');
      const lines = text.replace(/[\x00-\x08\x0b-\x1f]/g, '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^[-\\|/█▒\s.0-9%KMGB]+$/.test(l));
      if (!err) return resolve(lines);
      reject(new Error(`winget non è riuscito (codice ${err.code ?? '?'}): ` + (lines.slice(-3).join(' ') || err.message).slice(0, 300)));
    });
  });
}
async function updateApp(id) {
  if (!IS_WIN) throw new Error('Funziona solo su Windows.');
  if (typeof id !== 'string') throw new Error('Richiesta non valida.');
  // l'id deve essere uno di quelli mostrati all'utente nell'ultimo elenco (non si rilancia winget: l'esito può variare tra due chiamate)
  if (!updCache.some((u) => u.id === id)) throw new Error('Questo aggiornamento non è più nell\'elenco: riapri la pagina Aggiornamenti.');
  const base = ['upgrade', '--id', id, '--exact', '--silent', '--accept-source-agreements', '--accept-package-agreements', '--disable-interactivity'];
  try { await runWinget(base, 15 * 60 * 1000); }
  catch (e) { // alcuni pacchetti vengono da Microsoft Store o richiedono di forzare la sorgente
    if (!/no (installed )?package|nessun pacchetto/i.test(e.message)) throw e;
    await runWinget([...base, '--source', 'winget'], 15 * 60 * 1000);
  }
  updCache = updCache.filter((u) => u.id !== id);
  return { updated: true };
}

/* ---------------- info ---------------- */
function sysInfo() {
  return {
    platform: process.platform,
    cpu: os.cpus()[0]?.model ?? 'CPU', cores: os.cpus().length,
    totalMemGB: +(os.totalmem() / 1024 ** 3).toFixed(1), freeMemGB: +(os.freemem() / 1024 ** 3).toFixed(1),
    uptimeH: +(os.uptime() / 3600).toFixed(1),
  };
}

module.exports = { getFolderChildren, scanJunk, cleanJunk, getStartupApps, setStartupEnabled, getProtection, getPrograms, removeProgram, sysInfo, defenderScan, getDiskUsage, getAppUpdates, updateApp, scanLargeFiles, trashLargeFiles, scanDuplicates, trashDuplicates, setTrasher, scanPrivacy, cleanPrivacy, getBlockers, terminateBrowsers, getMemoryApps, closeApp, freeMemory, createRestorePoint, getLeftovers, trashLeftovers, deleteRegistryKeys, setBackupDir, _internals: { checkFolderPath, junkSources, adminRegScript, registryCandidates, isSafeRegKey, restoreStatus, restoreOuter, BROWSERS, kindFiles, baseProgramName, leftoverCandidates, allowedLeftoverRoots, uninstallCommand, shortHive, storeAppName, approvedEnabled, exeOf, findDuplicateGroups, parseWingetTable, isInside, parseRegQuery, walk, removeEmptyDirs } };
