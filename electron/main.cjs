const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, Notification } = require('electron');
const fs = require('fs');
const mon = require('./monitor.cjs');
const uiv = require('./ui-version.cjs');
const path = require('path');

let win = null, tray = null, trayMenu = null, quitting = false, pendingNav = null, lastLoad = { cpu: 0, ram: 0 };
const prefsFile = () => path.join(app.getPath('userData'), 'prefs.json');
const readPrefs = () => { try { return { keepInTray: true, ...JSON.parse(fs.readFileSync(prefsFile(), 'utf8')) }; } catch { return { keepInTray: true }; } };
// L'icona di finestra, barra delle applicazioni e area di notifica segue il tema scelto in Impostazioni (chiaro o scuro).
const themeNow = () => (readPrefs().theme === 'light' ? 'light' : 'dark');
// Su Windows si usano file .ico con più misure, tenuti FUORI dall'archivio dell'app (cartella resources/icons):
// Windows non sa leggere un .ico dentro l'archivio, e un PNG da 1024 px non è adatto alla barra delle applicazioni.
const icoDir = () => (app.isPackaged ? path.join(process.resourcesPath, 'icons') : path.join(__dirname, '../assets-ico'));
const asset = (n) => path.join(__dirname, '../assets', n);
const iconFile = (t) => (process.platform === 'win32' ? path.join(icoDir(), t === 'light' ? 'icon-light.ico' : 'icon-dark.ico') : asset(t === 'light' ? 'icon-light.png' : 'icon.png'));
const trayFile = (t) => (process.platform === 'win32' ? path.join(icoDir(), t === 'light' ? 'tray-light.ico' : 'tray-dark.ico') : asset(t === 'light' ? 'tray-light.png' : 'tray.png'));
const iconLog = (m) => { try { fs.appendFileSync(path.join(app.getPath('userData'), 'icone.log'), `${new Date().toISOString()} ${m}\n`); } catch { /* solo diagnostica */ } };
// L'icona dei collegamenti (desktop, menu Start, barra delle applicazioni se il programma è fissato) è scritta nel file .lnk:
// Windows non la cambia da sola con il tema, quindi si riscrive qui. Si toccano solo i collegamenti che puntano a questo programma.
function updateShortcuts(t) {
  if (process.platform !== 'win32') return;
  const icon = iconFile(t); const exe = process.execPath.toLowerCase(); const dirs = [];
  const add = (...p) => { try { dirs.push(path.join(...p)); } catch { /* percorso mancante */ } };
  add(app.getPath('desktop')); if (process.env.PUBLIC) add(process.env.PUBLIC, 'Desktop');
  if (process.env.APPDATA) { add(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs'); add(process.env.APPDATA, 'Microsoft', 'Internet Explorer', 'Quick Launch', 'User Pinned', 'TaskBar'); }
  if (process.env.ProgramData) add(process.env.ProgramData, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
  let n = 0;
  for (const d of dirs) {
    let files = []; try { files = fs.readdirSync(d).filter((f) => f.toLowerCase().endsWith('.lnk')); } catch { continue; }
    for (const f of files) {
      const lnk = path.join(d, f);
      try {
        const cur = shell.readShortcutLink(lnk);
        if (!cur.target || cur.target.toLowerCase() !== exe) continue;
        if (cur.icon && cur.icon.toLowerCase() === icon.toLowerCase()) continue;
        shell.writeShortcutLink(lnk, 'update', { icon, iconIndex: 0 }); n++; iconLog('collegamento aggiornato: ' + lnk);
      } catch (e) { iconLog('collegamento non aggiornato (' + lnk + '): ' + e.message); }
    }
  }
  if (n) { try { require('child_process').execFile('ie4uinit.exe', ['-show'], () => {}); } catch { /* aggiorna la memoria delle icone di Windows */ } }
}
function applyIcons(t) {
  updateShortcuts(t);
  const wf = iconFile(t), tf = trayFile(t);
  try {
    if (win && !win.isDestroyed()) {
      const img = nativeImage.createFromPath(wf); if (img.isEmpty()) throw new Error('file vuoto o mancante: ' + wf);
      win.setIcon(img);
      // la barra delle applicazioni, con un collegamento nel menu Start, prende l'icona da qui: va cambiata anche questa
      if (process.platform === 'win32' && win.setAppDetails) win.setAppDetails({ appId: 'it.bibo.tune', appIconPath: wf, appIconIndex: 0 });
    }
    iconLog(`finestra ${t}: ${wf}`);
  } catch (e) { iconLog('ERRORE icona finestra: ' + e.message); }
  try {
    if (tray && !tray.isDestroyed()) {
      const img = nativeImage.createFromPath(tf); if (img.isEmpty()) throw new Error('file vuoto o mancante: ' + tf);
      tray.setImage(img);
    }
    iconLog(`area di notifica ${t}: ${tf}`);
  } catch (e) { iconLog('ERRORE icona area di notifica: ' + e.message); }
}
const writePrefs = (p) => { try { fs.writeFileSync(prefsFile(), JSON.stringify(p)); } catch { /* sola preferenza */ } };

// Interfaccia da mostrare: la recente o la classica 0.1.27 (copiata in dist/classic). La scelta si ricorda in prefs.json.
const appRoot = () => path.join(__dirname, '..');
const classicAvailable = () => fs.existsSync(uiv.indexFile(appRoot(), 'classic'));
function loadUi(w) {
  const v = uiv.normalize(readPrefs().uiVersion);
  if (process.env.VITE_DEV_URL) w.loadURL(process.env.VITE_DEV_URL + (v === 'classic' ? '/classic/index.html' : ''));
  else w.loadFile(uiv.indexFile(appRoot(), v));
}
function setUiVersion(v) {
  if (!uiv.isValid(v)) throw new Error('Versione non valida.');
  if (v === 'classic' && !classicAvailable()) throw new Error('La versione classica non è inclusa in questa installazione.');
  writePrefs({ ...readPrefs(), uiVersion: v });
  if (win && !win.isDestroyed()) loadUi(win);
  if (tray && trayMenu) tray.setContextMenu(trayMenu(lastLoad.cpu, lastLoad.ram)); // la voce del menu cambia subito
  return { version: v };
}
function toggleUiVersion() { try { setUiVersion(uiv.other(readPrefs().uiVersion)); } catch { /* la classica manca: resta com'è */ } }

function showWindow() { if (!win || win.isDestroyed()) createWindow(); else { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } }

// Apre la finestra su una sezione (es. 'info'): se la pagina non è ancora pronta, la sezione aspetta il caricamento.
const SECTIONS = ['info'];
function openSection(id) {
  if (!SECTIONS.includes(id)) return;
  pendingNav = id; showWindow();
  if (win && !win.isDestroyed() && !win.webContents.isLoading()) { win.webContents.send('nav', id); pendingNav = null; }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1100, height: 720, minWidth: 360, minHeight: 480,
    backgroundColor: '#08121A', title: 'Bibo Tune', icon: iconFile(themeNow()),
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#0E1A22', symbolColor: '#F1FAFA', height: 40 },
    webPreferences: { sandbox: true, preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false },
  });
  loadUi(win);
  win.webContents.on('before-input-event', (e, input) => { if (uiv.isToggleKey(input)) { e.preventDefault(); toggleUiVersion(); } }); // Ctrl+Maiusc+V
  win.webContents.on('did-finish-load', () => { if (pendingNav && win && !win.isDestroyed()) { win.webContents.send('nav', pendingNav); pendingNav = null; } });
  win.on('close', (e) => { if (!quitting && readPrefs().keepInTray && tray) { e.preventDefault(); win.hide(); } });
  win.on('closed', () => { win = null; });
}

function createTray() {
  const img = nativeImage.createFromPath(trayFile(themeNow()));
  tray = new Tray(img.isEmpty() ? nativeImage.createEmpty() : img);
  const menu = (cpu, ram) => Menu.buildFromTemplate([
    { label: 'Apri Bibo Tune', click: showWindow },
    { label: 'Impostazioni', click: () => openSection('info') },
    { type: 'separator' },
    { label: `CPU ${cpu}%`, enabled: false },
    { label: `RAM ${ram}%`, enabled: false },
    { type: 'separator' },
    { label: uiv.menuLabel(readPrefs().uiVersion, app.getVersion()), click: toggleUiVersion },
    { label: 'Resta nella barra quando chiudo la finestra', type: 'checkbox', checked: readPrefs().keepInTray, click: (i) => writePrefs({ ...readPrefs(), keepInTray: i.checked }) },
    { label: 'Invia una notifica di prova', click: () => testNotification() },
    { label: 'Esci da Bibo Tune', click: () => { quitting = true; app.quit(); } },
  ]);
  trayMenu = menu;
  let prev = mon.cpuTimes(), warned = 0;
  const tick = () => {
    const cur = mon.cpuTimes(); const cpu = mon.cpuPercent(prev, cur); prev = cur; const ram = mon.ramPercent();
    lastLoad = { cpu, ram }; tray.setToolTip(mon.tooltip(cpu, ram)); tray.setContextMenu(menu(cpu, ram));
    // al massimo un avviso ogni 30 minuti
    if (mon.pressure(cpu, ram) && Date.now() - warned > 30 * 60 * 1000 && Notification.isSupported()) {
      warned = Date.now(); const n = new Notification({ title: 'Bibo Tune', body: ram >= 90 ? 'La memoria è quasi piena. Apri Bibo per vedere cosa la occupa.' : 'Il processore è al massimo da un po\'.' }); n.on('click', showWindow); n.show();
    }
  };
  tick(); setInterval(tick, 5000);
  tray.on('click', showWindow);
}

const sys = require('./system.cjs');
sys.setTrasher((p) => shell.trashItem(p));
sys.setBackupDir(path.join(app.getPath('userData'), 'registry-backups'));
// Il renderer può chiamare SOLO questi canali; gli argomenti sono validati in system.cjs.
const handlers = {
  'sys:info': () => sys.sysInfo(),
  'ui:version:get': () => ({ version: uiv.normalize(readPrefs().uiVersion), current: app.getVersion(), classic: uiv.CLASSIC_VERSION, classicAvailable: classicAvailable() }),
  'ui:version:set': (_e, v) => setUiVersion(v),
  'junk:scan': () => sys.scanJunk(),
  'junk:clean': async (_e, ids) => { const r = await sys.cleanJunk(ids); writePrefs({ ...readPrefs(), lastTune: Date.now() }); return r; },
  'startup:list': () => sys.getStartupApps(),
  'theme:set': (e, t, bar) => {
    if (t !== 'dark' && t !== 'light') throw new Error('Tema non valido.');
    const hex = /^#[0-9a-fA-F]{6}$/; const ok = bar && hex.test(bar.bg) && hex.test(bar.fg);
    writePrefs({ ...readPrefs(), theme: t }); applyIcons(t);
    const w = BrowserWindow.fromWebContents(e.sender);
    if (w && process.platform === 'win32' && w.setTitleBarOverlay) w.setTitleBarOverlay(ok ? { color: bar.bg, symbolColor: bar.fg, height: 40 } : t === 'light' ? { color: '#DDF0EC', symbolColor: '#0B1F24', height: 40 } : { color: '#0E1A22', symbolColor: '#F1FAFA', height: 40 });
    return { theme: t };
  },
  'app:info': () => ({ version: app.getVersion(), electron: process.versions.electron, platform: process.platform, cpu: lastLoad.cpu, ram: lastLoad.ram, keepInTray: readPrefs().keepInTray }),
  'app:keep': (_e, on) => { if (typeof on !== 'boolean') throw new Error('Richiesta non valida.'); writePrefs({ ...readPrefs(), keepInTray: on }); return { keepInTray: on }; },
  'app:notify': () => { testNotification(); return { ok: Notification.isSupported() }; },
  'app:quit': () => { quitting = true; app.quit(); },
  'startup:settings': () => shell.openExternal('ms-settings:startupapps'),
  'startup:set': (_e, id, on) => sys.setStartupEnabled(id, on),
  'protection:get': () => sys.getProtection(),
  'programs:list': () => sys.getPrograms(),
  'programs:remove': (_e, id) => sys.removeProgram(id),
  'dup:scan': () => sys.scanDuplicates(),
  'dup:trash': (_e, ids) => sys.trashDuplicates(ids),
  'prefs:get': () => { const p = readPrefs(); return { reminder: p.reminder || 'off', lastTune: p.lastTune || null }; },
  'prefs:set': (_e, v) => {
    if (!v || !['off', 'weekly', 'monthly'].includes(v.reminder)) throw new Error('Richiesta non valida.');
    const p = readPrefs(); writePrefs({ ...p, reminder: v.reminder, lastTune: p.lastTune || Date.now() });
    return { reminder: v.reminder, lastTune: readPrefs().lastTune };
  },
  'large:scan': () => sys.scanLargeFiles(),
  'large:trash': (_e, ids) => sys.trashLargeFiles(ids),
  'privacy:scan': () => sys.scanPrivacy(),
  'privacy:clean': (_e, ids) => sys.cleanPrivacy(ids),
  'blockers:get': (_e, sel) => sys.getBlockers(sel),
  'blockers:terminate': (_e, keys) => sys.terminateBrowsers(keys),
  'protection:scan': () => sys.defenderScan(),
  'disk:usage': () => sys.getDiskUsage(),
  'disk:folder': (_e, top, segs) => sys.getFolderChildren(top, segs),
  'updates:list': () => sys.getAppUpdates(),
  'updates:apply': (_e, id) => sys.updateApp(id),
  'restore:create': () => sys.createRestorePoint(),
  'memory:free': () => sys.freeMemory(),
  'programs:leftovers': (_e, id) => sys.getLeftovers(id),
  'programs:leftovers:trash': (_e, ids) => sys.trashLeftovers(ids),
  'programs:registry:delete': (_e, ids, asAdmin) => sys.deleteRegistryKeys(ids, !!asAdmin),
  'memory:apps': () => sys.getMemoryApps(),
  'memory:close': (_e, pid) => sys.closeApp(pid),
};
for (const [ch, fn] of Object.entries(handlers)) {
  ipcMain.handle(ch, async (e, ...args) => {
    // accetta solo la nostra finestra
    if (!BrowserWindow.fromWebContents(e.sender)) throw new Error('Origine non valida');
    return fn(e, ...args);
  });
}

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', showWindow);
// Promemoria: se hai scelto "ogni settimana/mese" e non fai una pulizia da quel tempo, una notifica (al massimo una al giorno).
function checkReminder() {
  const p = readPrefs(); const days = { weekly: 7, monthly: 30 }[p.reminder];
  if (!days || !Notification.isSupported()) return;
  const now = Date.now();
  if (now - (p.lastTune || now) < days * 86400000 || now - (p.lastReminded || 0) < 86400000) return;
  // lastReminded si scrive solo se Windows ha davvero mostrato la notifica: se fallisce, si riprova alla prossima ora.
  const n = new Notification({ title: 'Bibo Tune', body: 'È passato un po\' dall\'ultima messa a punto. Vuoi che diamo un\'occhiata?' });
  n.on('click', showWindow); n.on('show', () => writePrefs({ ...readPrefs(), lastReminded: Date.now() }));
  n.show();
}
function testNotification() {
  if (!Notification.isSupported()) return;
  const n = new Notification({ title: 'Bibo Tune', body: 'Prova: se leggi questo, le notifiche funzionano.' }); n.on('click', showWindow); n.show();
}
// Windows mostra le notifiche solo se l'app ha un identificativo uguale a quello del collegamento creato dall'installer (appId in package.json).
app.setAppUserModelId('it.bibo.tune');
app.whenReady().then(() => { createWindow(); createTray(); applyIcons(themeNow()); setTimeout(checkReminder, 20000); setInterval(checkReminder, 3600000); });
app.on('before-quit', () => { quitting = true; });
app.on('window-all-closed', () => { if (quitting || !tray) app.quit(); });
