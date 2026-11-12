// Livello dati FINTO: stesse firme che avrà quello reale (Electron/IPC).
// Quando arriva il vero, si cambia solo questo file.
import pkg from '../../package.json';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const GB = 1024 ** 3, MB = 1024 ** 2;

let junk = [
  { id: 'tmp', label: 'File temporanei di Windows', safe: true, parts: [{ id: 'utente', label: "Cartella temporanea dell'utente", bytes: 2.1 * GB }, { id: 'windows', label: 'Cartella Temp di Windows', bytes: 1.1 * GB }] },
  { id: 'cache-browser', label: 'Cache dei browser', safe: true, parts: [{ id: 'chrome', label: 'Cache di Google Chrome', bytes: 2.6 * GB }, { id: 'edge', label: 'Cache di Microsoft Edge', bytes: 1.5 * GB }] },
  { id: 'update', label: 'Vecchi file di aggiornamento', safe: true, parts: [{ id: 'download', label: 'Aggiornamenti di Windows già scaricati', bytes: 6.8 * GB }] },
  { id: 'recycle', label: 'Cestino', bytes: 2.3 * GB, safe: true },
  { id: 'logs', label: 'Registri di errore', safe: true, parts: [{ id: 'wer', label: 'Rapporti di errore di Windows', bytes: 290 * MB }, { id: 'cbs', label: 'Registri di aggiornamento (CBS)', bytes: 120 * MB }] },
  { id: 'thumbs', label: 'Miniature immagini', safe: true, parts: [{ id: 'miniature', label: 'Miniature e icone di Esplora file', bytes: 1.6 * GB }] },
].map((j) => (j.parts ? { ...j, bytes: j.parts.reduce((x, p) => x + p.bytes, 0) } : j));
let startup = [
  { id: 's1', name: 'Aggiornatore app chat', impact: 'alto', enabled: true },
  { id: 's2', name: 'Lanciatore giochi', impact: 'alto', enabled: true },
  { id: 's3', name: 'Sincronizzazione cloud', impact: 'medio', enabled: true },
  { id: 's4', name: 'Assistente stampante', impact: 'basso', enabled: true },
  { id: 's5', name: 'Widget meteo', impact: 'medio', enabled: true },
];
let programs = [
  { id: 'p1', name: 'Editor video Pro', bytes: 4.8 * GB, lastUsed: 'mai' },
  { id: 'p2', name: 'Gioco demo', bytes: 12.1 * GB, lastUsed: '8 mesi fa' },
  { id: 'p3', name: 'Convertitore file', bytes: 310 * MB, lastUsed: '14 mesi fa' },
  { id: 'p4', name: 'Barra strumenti browser', bytes: 85 * MB, lastUsed: '2 anni fa' },
];
let lastCheck = null;

const real = () => typeof window !== 'undefined' && window.bibo?.platform === 'win32';
export const isReal = real;

export const fmtBytes = (b) => (b >= GB ? (b / GB).toFixed(1) + ' GB' : b >= MB ? Math.round(b / MB) + ' MB' : b >= 1024 ? Math.round(b / 1024) + ' KB' : b > 0 ? b + ' B' : '0 MB');

export async function getOverview() {
  if (real()) return realOverview();
  await wait(250);
  let sys = { cpu: 'Processore', cores: 8, totalMemGB: 16, freeMemGB: 7.5, uptimeH: 52 };
  try { if (window.bibo) sys = { ...sys, ...(await window.bibo.sysInfo()) }; } catch {}
  return {
    sys, lastCheck,
    junkBytes: junk.reduce((s, j) => s + j.bytes, 0),
    startupHeavy: startup.filter((s) => s.enabled && s.impact !== 'basso').length,
    threats: 0,
    unusedPrograms: programs.length,
  };
}
export async function scanPC(onProgress) {
  if (real()) return realScan(onProgress);
  const steps = ['Cerco file inutili', 'Controllo i programmi all\'avvio', 'Verifico la protezione', 'Calcolo i risultati'];
  for (let i = 0; i < steps.length; i++) { onProgress?.((i + 1) / steps.length, steps[i]); await wait(900); }
  return { junk: junk.map((j) => ({ ...j })), startup: startup.map((s) => ({ ...s })), programs: programs.map((p) => ({ ...p })) };
}
export async function cleanJunk(ids) {
  if (real()) { const r = await window.bibo.cleanJunk(ids); lastCheck = new Date(); return { freedBytes: r.freedBytes, skipped: r.skipped }; }
  await wait(1200);
  let freed = 0;
  junk = junk.map((j) => {
    if (ids.includes(j.id)) { freed += j.bytes; return null; }
    const gone = (j.parts || []).filter((p) => ids.includes(`${j.id}/${p.id}`)); if (!gone.length) return j;
    freed += gone.reduce((x, p) => x + p.bytes, 0);
    const parts = j.parts.filter((p) => !gone.includes(p)); return parts.length ? { ...j, parts, bytes: parts.reduce((x, p) => x + p.bytes, 0) } : null;
  }).filter(Boolean);
  lastCheck = new Date();
  return { freedBytes: freed };
}
export async function getStartupApps() {
  if (real()) return window.bibo.startupList(); await wait(200); return startup.map((s) => ({ ...s })); }
export async function setStartupEnabled(id, enabled) {
  if (real()) return window.bibo.startupSet(id, enabled); await wait(150); startup = startup.map((s) => (s.id === id ? { ...s, enabled } : s)); }
export async function getJunk() {
  if (real()) return window.bibo.scanJunk(); await wait(200); return junk.map((j) => ({ ...j })); }
export async function getProtection() {
  if (real()) return window.bibo.protection();
  await wait(300);
  return { firewall: true, antivirus: true, updates: false, lastUpdate: '23 giorni fa' };
}
export async function getPrograms() {
  if (real()) return window.bibo.programs(); await wait(200); return programs.map((p) => ({ ...p })); }
export async function removeProgram(id) {
  if (real()) return window.bibo.removeProgram(id); await wait(900); programs = programs.filter((p) => p.id !== id); }

/* ---- modalità reale (Windows, via Electron) ---- */
async function realOverview() {
  const [sys, junk, startup, prot, programs] = await Promise.all([
    window.bibo.sysInfo(), window.bibo.scanJunk(), window.bibo.startupList(), window.bibo.protection(), window.bibo.programs(),
  ]);
  return {
    sys, lastCheck,
    junkBytes: junk.reduce((s, j) => s + j.bytes, 0),
    startupHeavy: startup.filter((s) => s.enabled).length,
    threats: prot.antivirus && prot.firewall ? 0 : 1,
    unusedPrograms: programs.length,
  };
}
async function realScan(onProgress) {
  onProgress?.(0.2, 'Cerco file inutili');
  const junk = await window.bibo.scanJunk();
  onProgress?.(0.5, 'Controllo i programmi all\'avvio');
  const startup = await window.bibo.startupList();
  onProgress?.(0.8, 'Controllo i programmi installati');
  const programs = await window.bibo.programs();
  onProgress?.(1, 'Calcolo i risultati');
  return { junk, startup, programs };
}

/* ---- file grandi, privacy, memoria ---- */
let largeFiles = [
  { id: 'f0', name: 'registrazione-schermo.mp4', dir: 'Video', bytes: 2.4 * GB, modified: '2025-02-11T10:00:00Z' },
  { id: 'f1', name: 'installer-vecchio.iso', dir: 'Download', bytes: 1.9 * GB, modified: '2024-08-03T10:00:00Z' },
  { id: 'f2', name: 'backup-telefono.zip', dir: 'Documenti', bytes: 640 * MB, modified: '2024-12-20T10:00:00Z' },
  { id: 'f3', name: 'presentazione-finale-v7.pptx', dir: 'Desktop', bytes: 180 * MB, modified: '2025-06-01T10:00:00Z' },
];
let privacy = [
  { id: 'chrome:history', browser: 'Google Chrome', label: 'Google Chrome: cronologia', bytes: 42 * MB, running: false },
  { id: 'chrome:cookies', browser: 'Google Chrome', label: 'Google Chrome: cookie (esce dai siti)', bytes: 9 * MB, running: false },
  { id: 'firefox:cookies', browser: 'Mozilla Firefox', label: 'Mozilla Firefox: cookie (esce dai siti)', bytes: 3 * MB, running: true, windowed: false, browserKey: 'firefox' },
  { id: 'edge:history', browser: 'Microsoft Edge', label: 'Microsoft Edge: cronologia', bytes: 18 * MB, running: true, windowed: true },
];
let memApps = [
  { pid: 101, name: 'browser', title: 'Browser (24 schede)', bytes: 1.8 * GB },
  { pid: 102, name: 'chat', title: 'App di chat', bytes: 620 * MB },
  { pid: 103, name: 'editor', title: 'Editor di testo', bytes: 340 * MB },
];
export async function getLargeFiles() { if (real()) return window.bibo.largeScan(); await wait(400); return largeFiles.map((f) => ({ ...f })); }
export async function trashLargeFiles(ids) {
  if (real()) return window.bibo.largeTrash(ids);
  await wait(700); const freed = largeFiles.filter((f) => ids.includes(f.id)).reduce((s, f) => s + f.bytes, 0);
  largeFiles = largeFiles.filter((f) => !ids.includes(f.id)); return { freedBytes: freed, failed: 0 };
}
export async function getPrivacy() { if (real()) return window.bibo.privacyScan(); await wait(300); return privacy.map((p) => ({ ...p })); }
// Browser "aperti" nei dati finti: Edge con finestra, Firefox solo in background.
let fakeRunning = { chrome: null, edge: { windowed: true }, firefox: { windowed: false } };
const FAKE_NAMES = { chrome: 'Google Chrome', edge: 'Microsoft Edge', firefox: 'Mozilla Firefox' };
export async function getBlockers(sel) {
  if (real()) return window.bibo.blockersGet(sel);
  await wait(200); const keys = new Set();
  for (const id of sel.junk || []) { if (id === 'cache-browser') { keys.add('chrome'); keys.add('edge'); } else if (id === 'cache-browser/chrome') keys.add('chrome'); else if (id === 'cache-browser/edge') keys.add('edge'); }
  for (const id of sel.privacy || []) keys.add(String(id).split(':')[0]);
  return [...keys].filter((k) => fakeRunning[k]).map((k) => ({ key: k, name: FAKE_NAMES[k], windowed: fakeRunning[k].windowed }));
}
export async function terminateBrowsers(keys) {
  if (real()) return window.bibo.blockersTerminate(keys);
  await wait(700); keys.forEach((k) => { fakeRunning[k] = null; });
  privacy = privacy.map((p) => (keys.includes(String(p.id).split(':')[0]) ? { ...p, running: false } : p));
  return keys.map((k) => ({ key: k, name: FAKE_NAMES[k], closed: true }));
}
export async function cleanPrivacy(ids) {
  if (real()) return window.bibo.privacyClean(ids);
  await wait(600); const ok = privacy.filter((p) => ids.includes(p.id) && !p.running); const blocked = [...new Set(privacy.filter((p) => ids.includes(p.id) && p.running).map((p) => p.browser))];
  privacy = privacy.filter((p) => !ok.includes(p)); return { freedBytes: ok.reduce((s, p) => s + p.bytes, 0), blocked };
}
export async function getMemoryApps() { if (real()) return window.bibo.memoryApps(); await wait(250); return memApps.map((a) => ({ ...a })); }
export async function closeApp(pid) { if (real()) return window.bibo.memoryClose(pid); await wait(400); memApps = memApps.filter((a) => a.pid !== pid); return { requested: true }; }

/* ---- Defender, disco, aggiornamenti ---- */
let updates = [
  { id: 'Demo.Browser', name: 'Browser', version: '120.0', available: '123.0' },
  { id: 'Demo.Chat', name: 'App di chat', version: '4.1', available: '4.3' },
  { id: 'Demo.Player', name: 'Lettore video', version: '3.0.18', available: '3.0.20' },
];
export async function protectionScan() { if (real()) return window.bibo.protectionScan(); await wait(3500); return { threats: [] }; }
export async function getDiskUsage() {
  if (real()) return window.bibo.diskUsage();
  await wait(500);
  return { drives: [{ letter: 'C:', total: 476 * GB, free: 118 * GB }, { letter: 'D:', total: 931 * GB, free: 640 * GB }, { letter: 'E:', total: 256 * GB, free: 14 * GB }],
    folders: [{ name: 'Dati delle app', bytes: 41 * GB }, { name: 'Videos', bytes: 22 * GB }, { name: 'Downloads', bytes: 14 * GB }, { name: 'Documents', bytes: 9 * GB }, { name: 'Pictures', bytes: 6 * GB }, { name: 'Music', bytes: 3 * GB }, { name: 'Desktop', bytes: 1 * GB }] };
}
/** Cartelle dentro una cartella di Lente spaziale. Nei dati finti le sottocartelle si inventano in modo stabile. */
const FAKE_SUB = { Videos: ['Film', 'Registrazioni schermo', 'Clip vacanze', 'Montaggi'], Downloads: ['Installer', 'Documenti scaricati', 'Immagini disco'], 'Dati delle app': ['Chrome', 'Discord', 'Spotify', 'Teams', 'Steam'], Documents: ['Lavoro', 'Fatture', 'Scuola'], Pictures: ['Foto 2024', 'Foto 2023', 'Schermate'], Music: ['Album', 'Playlist'], Desktop: ['Vecchi file'] };
const FRACS = [.45, .28, .17, .1, .06];
export async function getFolderChildren(top, segs) {
  if (real()) return window.bibo.diskFolder(top, segs);
  await wait(350);
  let cur = (await getDiskUsage()).folders.find((f) => f.name === top)?.bytes ?? 0; let names = FAKE_SUB[top] || [];
  for (const g of segs) { const i = names.indexOf(g); cur = i < 0 ? 0 : cur * FRACS[i]; names = ['Parte 1', 'Parte 2'].includes(g) || names === FAKE_SUB[top] && segs.length >= 2 ? [] : ['Parte 1', 'Parte 2']; }
  const kids = names.map((n, i) => ({ name: n, bytes: Math.round(cur * (names.length === 2 ? [.6, .3][i] : FRACS[i])) }));
  return { children: kids, others: Math.round(cur * (kids.length ? .05 : 1)), partial: false };
}
export async function getAppUpdates() { if (real()) return window.bibo.updatesList(); await wait(500); return updates.map((u) => ({ ...u })); }
export async function updateApp(id) { if (real()) return window.bibo.updatesApply(id); await wait(1200); updates = updates.filter((u) => u.id !== id); return { updated: true }; }

/* ---- file duplicati e promemoria ---- */
let dups = [
  { id: 'g0', bytes: 410 * MB, files: [
    { id: 'g0-0', name: 'vacanza-2024.mp4', dir: 'Video', modified: '2024-08-20T10:00:00Z', keep: true },
    { id: 'g0-1', name: 'vacanza-2024 (copia).mp4', dir: 'Download', modified: '2024-09-02T10:00:00Z', keep: false }] },
  { id: 'g1', bytes: 38 * MB, files: [
    { id: 'g1-0', name: 'contratto.pdf', dir: 'Documenti', modified: '2025-01-10T10:00:00Z', keep: true },
    { id: 'g1-1', name: 'contratto-1.pdf', dir: 'Download', modified: '2025-01-11T10:00:00Z', keep: false },
    { id: 'g1-2', name: 'contratto-2.pdf', dir: 'Desktop', modified: '2025-02-01T10:00:00Z', keep: false }] },
];
export async function getDuplicates() { if (real()) return window.bibo.dupScan(); await wait(500); return dups.map((g) => ({ ...g, files: g.files.map((f) => ({ ...f })) })); }
export async function trashDuplicates(ids) {
  if (real()) return window.bibo.dupTrash(ids);
  await wait(600); let freed = 0;
  dups = dups.map((g) => { const gone = g.files.filter((f) => !f.keep && ids.includes(f.id)); freed += gone.length * g.bytes; return { ...g, files: g.files.filter((f) => !gone.includes(f)) }; }).filter((g) => g.files.length > 1);
  return { freedBytes: freed, failed: 0 };
}
let fakePrefs = { reminder: 'off', lastTune: null };
// Informazioni sull'app (sezione che si apre dal tasto destro sull'icona nella barra). Fuori da Electron: dati finti.
let fakeKeep = true;
/** Quale interfaccia si vede: la recente o la classica 0.1.27. Nel browser (senza Electron) la classica si apre a /classic/. */
export async function getUiVersion() {
  if (typeof window !== 'undefined' && window.bibo?.getUiVersion) return window.bibo.getUiVersion();
  await wait(60); return { version: 'recent', current: pkg.version, classic: '0.1.27', classicAvailable: true };
}
export async function setUiVersion(v) {
  if (typeof window !== 'undefined' && window.bibo?.setUiVersion) return window.bibo.setUiVersion(v);
  if (v === 'classic') location.assign('./classic/index.html');
  return { version: v };
}
export async function getAppInfo() {
  if (typeof window !== 'undefined' && window.bibo?.appInfo) return window.bibo.appInfo();
  await wait(60); return { version: pkg.version, electron: '—', platform: 'browser', cpu: 12, ram: 48, keepInTray: fakeKeep };
}
export async function setKeepInTray(on) { if (typeof window !== 'undefined' && window.bibo?.setKeepInTray) return window.bibo.setKeepInTray(on); fakeKeep = on; return { keepInTray: on }; }
export async function testNotification() { if (typeof window !== 'undefined' && window.bibo?.testNotification) return window.bibo.testNotification(); return { ok: false }; }
export const canQuit = () => typeof window !== 'undefined' && !!window.bibo?.quit;
export const quitApp = () => window.bibo?.quit?.();

export async function getReminder() { if (real()) return window.bibo.prefsGet(); await wait(80); return { ...fakePrefs }; }
export async function setReminder(reminder) { if (real()) return window.bibo.prefsSet({ reminder }); await wait(80); fakePrefs = { reminder, lastTune: fakePrefs.lastTune || Date.now() }; return { ...fakePrefs }; }

export async function openStartupSettings() { if (real()) return window.bibo.startupSettings(); }

export async function freeMemory() { if (real()) return window.bibo.memoryFree(); await wait(1200); return { freedBytes: 740 * MB }; }
let fakeLeftovers = { 'Editor video Pro': [{ id: 'l0', dir: 'C:\\Users\\tu\\AppData\\Local\\Editor video Pro', bytes: 210 * MB }, { id: 'l1', dir: 'C:\\ProgramData\\Editor video Pro', bytes: 12 * MB }] };
let fakeLeftoverFor = null;
export async function getLeftovers(program) {
  if (real()) return window.bibo.leftovers(program.id);
  await wait(300); fakeLeftoverFor = program.name; return { installed: false, items: (fakeLeftovers[program.name] || []).map((x) => ({ ...x })), reg: (fakeRegs[program.name] || []).map((x) => ({ ...x })) };
}
const fakeRegs = { 'Editor video Pro': [{ id: 'r0', key: 'HKCU\\Software\\Editor video Pro' }, { id: 'r1', key: 'HKLM\\SOFTWARE\\Editor video Pro' }] };
export async function deleteRegistry(ids, asAdmin = false) {
  if (real()) return window.bibo.registryDelete(ids, asAdmin);
  await wait(400); fakeRegs[fakeLeftoverFor] = (fakeRegs[fakeLeftoverFor] || []).filter((x) => !ids.includes(x.id)); return { deleted: ids.length, failed: 0, moved: ids, needsAdmin: false, backupDir: 'C:\\Users\\tu\\AppData\\Roaming\\Bibo Tune\\registry-backups' };
}
export async function trashLeftovers(ids) {
  if (real()) return window.bibo.leftoversTrash(ids);
  await wait(500); const all = fakeLeftovers[fakeLeftoverFor] || []; const freed = all.filter((x) => ids.includes(x.id)).reduce((t, x) => t + x.bytes, 0);
  fakeLeftovers[fakeLeftoverFor] = all.filter((x) => !ids.includes(x.id)); return { freedBytes: freed, failed: 0 };
}

/** Punto di ripristino di Windows. status: created | recent | disabled | denied | failed. */
export async function createRestorePoint() { if (real()) return window.bibo.restoreCreate(); await wait(1500); return { status: 'created' }; }
export const RESTORE_TEXT = {
  created: 'Punto di ripristino creato.', recent: 'Esiste già un punto di ripristino recente (Windows ne crea al massimo uno ogni 24 ore).',
  disabled: 'Non è stato possibile: la protezione del sistema sembra spenta. Si attiva da Impostazioni di Windows → Protezione sistema.',
  denied: 'Hai annullato la richiesta di Windows.', failed: 'Non sono riuscito a creare il punto di ripristino.',
};
