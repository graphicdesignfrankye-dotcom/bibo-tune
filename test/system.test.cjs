const test = require('node:test'); const assert = require('node:assert');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { _internals: { isInside, parseRegQuery, walk, removeEmptyDirs } } = require('../electron/system.cjs');

test('isInside: solo dentro la radice, mai radice di disco o uscite con ..', () => {
  const root = path.join(os.tmpdir(), 'x');
  assert.equal(isInside(root, path.join(root, 'a', 'b.txt')), true);
  assert.equal(isInside(root, root), false);
  assert.equal(isInside(root, path.join(root, '..', 'altro')), false);
  assert.equal(isInside(path.parse(root).root, path.join(root, 'a')), false);
});
test('parseRegQuery legge nomi e valori', () => {
  const t = 'HKEY_CURRENT_USER\\Software\\Run\r\n    Chat App    REG_SZ    "C:\\Program Files\\Chat\\chat.exe" --min\r\n    Altro    REG_DWORD    0x1\r\n';
  const r = parseRegQuery(t);
  assert.equal(r.length, 2);
  assert.equal(r[0].name, 'Chat App'); assert.equal(r[0].value, '"C:\\Program Files\\Chat\\chat.exe" --min');
  assert.equal(r[1].value, '0x1');
});
test('walk non segue i collegamenti simbolici', async () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bibo-')); const out = fs.mkdtempSync(path.join(os.tmpdir(), 'bibo-out-'));
  fs.writeFileSync(path.join(out, 'segreto.txt'), 'x'); fs.writeFileSync(path.join(d, 'ok.txt'), 'x');
  fs.symlinkSync(out, path.join(d, 'link'));
  const seen = []; await walk(d, (f) => seen.push(path.basename(f)));
  assert.deepEqual(seen, ['ok.txt']);
  fs.rmSync(d, { recursive: true }); fs.rmSync(out, { recursive: true });
});
test('removeEmptyDirs toglie solo cartelle vuote e lascia la radice', async () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bibo-'));
  fs.mkdirSync(path.join(d, 'vuota', 'sotto'), { recursive: true }); fs.mkdirSync(path.join(d, 'piena')); fs.writeFileSync(path.join(d, 'piena', 'f'), '1');
  await removeEmptyDirs(d, d);
  assert.equal(fs.existsSync(path.join(d, 'vuota')), false); assert.equal(fs.existsSync(path.join(d, 'piena', 'f')), true); assert.equal(fs.existsSync(d), true);
  fs.rmSync(d, { recursive: true });
});
test('su non-Windows le operazioni distruttive rifiutano', async () => {
  if (process.platform === 'win32') return;
  const s = require('../electron/system.cjs');
  await assert.rejects(() => s.cleanJunk(['tmp']), /solo su Windows/);
});

test('le nuove funzioni rifiutano fuori da Windows e validano gli input', async () => {
  if (process.platform === 'win32') return;
  const s = require('../electron/system.cjs');
  for (const f of [() => s.scanLargeFiles(), () => s.trashLargeFiles(['f0']), () => s.scanPrivacy(), () => s.cleanPrivacy(['chrome:history']), () => s.getMemoryApps(), () => s.closeApp(1)])
    await assert.rejects(f, /solo su Windows|Funziona solo/);
});

test('parseWingetTable legge nome, id, versioni e scarta righe di servizio', () => {
  const { _internals: { parseWingetTable } } = require('../electron/system.cjs');
  const t = [
    'Name                 Id                   Version  Available Source',
    '------------------------------------------------------------------',
    'Git                  Git.Git              2.40.0   2.43.0    winget',
    'Visual Studio Code   Microsoft.VisualStudioCode 1.80.0 1.85.0 winget',
    '2 upgrades available.',
  ].join('\r\n');
  const r = parseWingetTable(t);
  assert.equal(r.length >= 1, true);
  assert.deepEqual(r[0], { name: 'Git', id: 'Git.Git', version: '2.40.0', available: '2.43.0' });
  assert.equal(r.every((x) => /^[A-Za-z0-9][A-Za-z0-9._+-]*$/.test(x.id)), true); // un id non può contenere spazi o comandi
  assert.deepEqual(parseWingetTable('nessuna tabella'), []);
});
test('defender, disco e aggiornamenti rifiutano fuori da Windows', async () => {
  if (process.platform === 'win32') return;
  const s = require('../electron/system.cjs');
  for (const f of [() => s.defenderScan(), () => s.getDiskUsage(), () => s.getAppUpdates(), () => s.updateApp('Git.Git')]) await assert.rejects(f, /Funziona solo/);
});

test('monitor: percentuali di CPU, soglie e tooltip', () => {
  const m = require('../electron/monitor.cjs');
  assert.equal(m.cpuPercent({ idle: 100, total: 200 }, { idle: 150, total: 300 }), 50);
  assert.equal(m.cpuPercent({ idle: 100, total: 200 }, { idle: 100, total: 200 }), 0); // nessun intervallo
  assert.equal(m.cpuPercent({ idle: 0, total: 0 }, { idle: 0, total: 100 }), 100);
  assert.equal(m.pressure(10, 95), 'ram'); assert.equal(m.pressure(99, 50), 'cpu'); assert.equal(m.pressure(50, 50), null);
  assert.match(m.tooltip(14, 62), /CPU 14% · RAM 62%/);
  const r = m.ramPercent(); assert.ok(r >= 0 && r <= 100);
});

test('findDuplicateGroups: trova solo contenuti identici, tiene il più vecchio, ignora i piccoli e i link', async () => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bibo-dup-'));
  const big = Buffer.alloc(2048, 7), other = Buffer.alloc(2048, 8); // stessa dimensione, contenuto diverso
  fs.writeFileSync(path.join(d, 'a.bin'), big); fs.writeFileSync(path.join(d, 'b.bin'), big);
  fs.writeFileSync(path.join(d, 'c.bin'), other); fs.writeFileSync(path.join(d, 'tiny.txt'), 'x'); fs.writeFileSync(path.join(d, 'tiny2.txt'), 'x');
  fs.symlinkSync(path.join(d, 'a.bin'), path.join(d, 'link.bin'));
  const old = new Date(Date.now() - 86400000 * 5); fs.utimesSync(path.join(d, 'b.bin'), old, old);
  const g = await require('../electron/system.cjs')._internals.findDuplicateGroups([d], 1024);
  assert.equal(g.length, 1); assert.equal(g[0].length, 2);
  assert.equal(path.basename(g[0][0].f), 'b.bin'); // il più vecchio resta
  fs.rmSync(d, { recursive: true });
});

test('scanDuplicates/trashDuplicates rifiutano fuori da Windows', async () => {
  if (process.platform === 'win32') return;
  const s = require('../electron/system.cjs');
  await assert.rejects(s.scanDuplicates()); await assert.rejects(s.trashDuplicates(['g0-1']));
});

test('parseWingetTable: legge anche winget in italiano (Nome Id Versione Disponibile)', () => {
  const { parseWingetTable } = require('../electron/system.cjs')._internals;
  const txt = [
    'Nome                      Id                  Versione   Disponibile Origine',
    '----------------------------------------------------------------------------',
    '7-Zip 26.05 (x64 edition) 7zip.7zip           26.05.00.0 26.06       winget',
    'CADCraft                  ArtCraft.CadCraft   0.10.0     0.17.0      winget',
    'Notepad++ (64-bit x64)    Notepad++.Notepad++ 8.9.8.1    8.9.9       winget',
    '3 aggiornamenti disponibili.'].join('\n');
  const r = parseWingetTable(txt);
  assert.deepEqual(r.map((x) => x.id), ['7zip.7zip', 'ArtCraft.CadCraft', 'Notepad++.Notepad++']);
  assert.equal(r[1].version, '0.10.0'); assert.equal(r[1].available, '0.17.0'); assert.equal(r[0].name, '7-Zip 26.05 (x64 edition)');
});

test('avvio automatico: lo stato di StartupApproved e il nome del programma', () => {
  const { approvedEnabled, exeOf } = require('../electron/system.cjs')._internals;
  assert.equal(approvedEnabled('020000000000000000000000'), true); assert.equal(approvedEnabled('060000000000000000000000'), true);
  assert.equal(approvedEnabled('030000000000000000000000'), false); assert.equal(approvedEnabled('070000000000000000000000'), false);
  assert.equal(approvedEnabled(undefined), true);
  assert.equal(exeOf('"C:\\Program Files\\RustDesk\\rustdesk.exe" --tray'), 'rustdesk.exe');
  assert.equal(exeOf('C:\\Windows\\System32\\RtkAudUService64.exe -background'), 'RtkAudUService64.exe');
});

test('nomi delle app di Windows come in Gestione attività', () => {
  const { storeAppName } = require('../electron/system.cjs')._internals;
  assert.equal(storeAppName('AppUp.IntelGraphicsExperience'), 'Intel Graphics Command Center');
  assert.equal(storeAppName('Microsoft.YourPhone'), 'Collegamento al telefono');
  assert.equal(storeAppName('Microsoft.WindowsTerminal'), 'Terminale');
  assert.equal(storeAppName('MSTeams'), 'Microsoft Teams');
  assert.equal(storeAppName('Vendor.SomeNewTool'), 'Some New Tool');
});

test('shortHive: reg query scrive HKEY_*, noi confrontiamo con HKLM/HKCU', () => {
  const { shortHive } = require('../electron/system.cjs')._internals;
  assert.equal(shortHive('HKEY_LOCAL_MACHINE\\Software\\X'), 'HKLM\\Software\\X');
  assert.equal(shortHive('HKEY_CURRENT_USER\\Software\\X'), 'HKCU\\Software\\X');
});

test('uninstallCommand: la stringa del registro resta intera dentro start', () => {
  const { uninstallCommand } = require('../electron/system.cjs')._internals;
  assert.equal(uninstallCommand('MsiExec.exe /X{B5F500BB-4625-445D-A2E7-E7FE5E1E7E85}'), '"start "" MsiExec.exe /X{B5F500BB-4625-445D-A2E7-E7FE5E1E7E85}"');
  assert.equal(uninstallCommand('"C:\\Program Files\\X\\unins000.exe" /SILENT '), '"start "" "C:\\Program Files\\X\\unins000.exe" /SILENT"');
});

test('leftoverCandidates: solo cartella di installazione e cartelle con il nome esatto, mai nomi corti o con percorsi', () => {
  const { leftoverCandidates, allowedLeftoverRoots, isInside } = require('../electron/system.cjs')._internals;
  const env = { LOCALAPPDATA: 'C:\\U\\AppData\\Local', APPDATA: 'C:\\U\\AppData\\Roaming', ProgramData: 'C:\\ProgramData', ProgramFiles: 'C:\\Program Files' };
  const c = leftoverCandidates('Everything', 'C:\\Program Files\\Everything', env, '\\');
  assert.ok(c.includes('C:\\Program Files\\Everything') && c.includes('C:\\U\\AppData\\Local\\Everything') && c.includes('C:\\ProgramData\\Everything'));
  assert.deepEqual(leftoverCandidates('7z', '', env, '\\'), []);               // nome troppo corto: niente ipotesi
  assert.deepEqual(leftoverCandidates('..\\Windows', '', env, '\\'), []);      // nome con separatori: scartato
  assert.ok(allowedLeftoverRoots(env).length >= 4);
});

test('getLeftovers/trashLeftovers/freeMemory rifiutano fuori da Windows', async () => {
  if (process.platform === 'win32') return;
  const s = require('../electron/system.cjs');
  await assert.rejects(s.getLeftovers('x')); await assert.rejects(s.trashLeftovers(['l0'])); await assert.rejects(s.freeMemory());
});

test('baseProgramName: toglie versione e architettura, tiene il nome', () => {
  const { baseProgramName, leftoverCandidates } = require('../electron/system.cjs')._internals;
  assert.equal(baseProgramName('Everything 1.4.1.1032 (x64)'), 'Everything');
  assert.equal(baseProgramName('Notepad++ (64-bit x64)'), 'Notepad++');
  assert.equal(baseProgramName('7-Zip 26.05 (x64 edition)'), '7-Zip');
  assert.equal(baseProgramName('Python 3.12.1 (64-bit)'), 'Python');
  const env = { APPDATA: 'C:\\U\\AppData\\Roaming' };
  assert.ok(leftoverCandidates('Everything 1.4.1.1032 (x64)', '', env, '\\').includes('C:\\U\\AppData\\Roaming\\Everything'));
});

test('privacy: Firefox solo cookie, mai places.sqlite (segnalibri e cronologia) né password', () => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bibo-ff-'));
  const prof = path.join(d, 'Mozilla', 'Firefox', 'Profiles', 'abc.default-release'); fs.mkdirSync(prof, { recursive: true });
  const prev = process.env.APPDATA; process.env.APPDATA = d;
  try {
    const { BROWSERS, kindFiles } = require('../electron/system.cjs')._internals;
    assert.deepEqual(BROWSERS.firefox.dirs(), [prof]);
    assert.deepEqual(BROWSERS.firefox.kinds, ['cookies']);
    const files = kindFiles('firefox', 'cookies');
    assert.ok(files.includes('cookies.sqlite'));
    for (const never of ['places.sqlite', 'key4.db', 'logins.json', 'favicons.sqlite']) assert.ok(!files.includes(never));
    assert.ok(BROWSERS.chrome.kinds.includes('history')); // Chrome/Edge restano come prima
  } finally { process.env.APPDATA = prev; fs.rmSync(d, { recursive: true }); }
});

test('punto di ripristino: codici d\'uscita e comando fisso senza dati dell\'utente', () => {
  const { restoreStatus, restoreOuter } = require('../electron/system.cjs')._internals;
  assert.deepEqual([0, 1, 2, 3, 9].map(restoreStatus), ['created', 'denied', 'disabled', 'recent', 'failed']);
  const c = restoreOuter();
  assert.match(c, /Start-Process powershell -Verb RunAs/); assert.match(c, /Checkpoint-Computer/);
  assert.equal(restoreOuter(), c); // sempre lo stesso: nessun parametro esterno
});
test('createRestorePoint rifiuta fuori da Windows', async () => {
  if (process.platform === 'win32') return;
  await assert.rejects(require('../electron/system.cjs').createRestorePoint());
});

test('getBlockers/terminateBrowsers: solo browser noti, solo su Windows, nessun nome strano', async () => {
  const s = require('../electron/system.cjs');
  await assert.rejects(s.getBlockers({ junk: ['cache-browser'] }), /Windows/);   // fuori da Windows non fa nulla
  await assert.rejects(s.terminateBrowsers(['chrome']), /Windows/);
  await assert.rejects(s.terminateBrowsers(['notepad']));                        // non in elenco
  await assert.rejects(s.terminateBrowsers(['__proto__']));
  await assert.rejects(s.terminateBrowsers('chrome'));
});

test('leftoverCandidates: "Mozilla Firefox" cerca anche Mozilla\\Firefox (cache e profili), non solo "Mozilla Firefox"', () => {
  const { leftoverCandidates, baseProgramName } = require('../electron/system.cjs')._internals;
  const env = { LOCALAPPDATA: 'C:\\U\\AppData\\Local', APPDATA: 'C:\\U\\AppData\\Roaming', ProgramFiles: 'C:\\Program Files' };
  assert.equal(baseProgramName('Mozilla Firefox (x64 it)'), 'Mozilla Firefox');
  const c = leftoverCandidates('Mozilla Firefox 130.0 (x64 it)', '', env, '\\');
  assert.ok(c.includes('C:\\U\\AppData\\Local\\Mozilla\\Firefox'));
  assert.ok(c.includes('C:\\U\\AppData\\Roaming\\Mozilla\\Firefox'));
});

test('registryCandidates/isSafeRegKey: solo chiavi del programma, mai aree condivise né la sola azienda', () => {
  const { registryCandidates, isSafeRegKey } = require('../electron/system.cjs')._internals;
  const u = 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MiniPartitionTools';
  const c = registryCandidates('MiniPartitionTools', u).map((x) => x.key);
  assert.ok(c.includes(u)); assert.ok(c.includes('HKCU\\Software\\MiniPartitionTools')); assert.ok(c.includes('HKLM\\SOFTWARE\\WOW6432Node\\MiniPartitionTools'));
  const f = registryCandidates('Mozilla Firefox 130.0 (x64 it)', '').map((x) => x.key);
  assert.ok(f.includes('HKCU\\Software\\Mozilla\\Firefox')); assert.ok(!f.includes('HKCU\\Software\\Mozilla'));
  for (const bad of ['HKLM\\SOFTWARE', 'HKLM\\SOFTWARE\\Microsoft', 'HKCU\\Software\\Microsoft\\Windows', 'HKLM\\SOFTWARE\\Microsoft\\Windows NT', 'HKCU\\Software\\Classes', 'HKLM\\SOFTWARE\\Mozilla', 'HKCU\\Software\\A\\B\\C', 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall', 'HKCU\\Software\\Abc']) assert.equal(isSafeRegKey(bad), false, bad);
  assert.deepEqual(registryCandidates('Microsoft', ''), []);
  assert.deepEqual(registryCandidates('7z', ''), []);
});
test('deleteRegistryKeys rifiuta fuori da Windows', async () => { await assert.rejects(require('../electron/system.cjs').deleteRegistryKeys(['r0'])); });

test('adminRegScript: esporta prima di cancellare, apici raddoppiati, esito su file', () => {
  const { adminRegScript } = require('../electron/system.cjs')._internals;
  const s = adminRegScript([["HKLM\\SOFTWARE\\Mini'Tools", 'C:\\b\\1.reg']], 'C:\\t\\r.json');
  assert.ok(s.indexOf('reg.exe export') < s.indexOf('reg.exe delete'));
  assert.ok(s.includes("Mini''Tools")); assert.ok(s.includes("Set-Content -Path 'C:\\t\\r.json'"));
});

test('ogni tipo di spazzatura ha i suoi elementi e le cartelle sono quelle dichiarate', () => {
  const old = { l: process.env.LOCALAPPDATA, w: process.env.SystemRoot };
  process.env.LOCALAPPDATA = '/x/local'; process.env.SystemRoot = '/x/win';
  try {
    const src = require('../electron/system.cjs')._internals.junkSources();
    assert.deepEqual(src.map((x) => x.id), ['tmp', 'cache-browser', 'update', 'logs', 'thumbs']);
    for (const x of src) { assert.ok(x.parts.length >= 1); assert.deepEqual(x.dirs, x.parts.flatMap((p) => p.dirs)); }
    assert.deepEqual(src.find((x) => x.id === 'cache-browser').parts.map((p) => p.id), ['chrome', 'edge']);
    assert.ok(src.find((x) => x.id === 'cache-browser').parts[0].dirs.every((d) => d.includes('Chrome')));
  } finally { process.env.LOCALAPPDATA = old.l; process.env.SystemRoot = old.w; }
});

test('Mappa del disco: i percorsi delle cartelle sono validati e restano dentro le cartelle conosciute', async () => {
  const s = require('../electron/system.cjs'); const check = s._internals.checkFolderPath; const path = require('path'); const os = require('os');
  assert.equal(check('Videos', []), path.join(os.homedir(), 'Videos'));
  assert.equal(check('Videos', ['Film', '2024']), path.join(os.homedir(), 'Videos', 'Film', '2024'));
  assert.throws(() => check('Windows', []), /non valida/);                    // solo le sette cartelle conosciute
  assert.throws(() => check('Videos', ['..']), /non valido/);
  assert.throws(() => check('Videos', ['a/b']), /non valido/);
  assert.throws(() => check('Videos', ['a\\b']), /non valido/);
  assert.throws(() => check('Videos', ['C:']), /non valido/);
  assert.throws(() => check('Videos', ['']), /non valido/);
  assert.throws(() => check('Videos', 'Film'), /non valido/);
  assert.throws(() => check('Videos', new Array(13).fill('x')), /non valido/);
  await assert.rejects(() => s.getFolderChildren('Videos', []), /Windows/);   // fuori da Windows non fa nulla
});
