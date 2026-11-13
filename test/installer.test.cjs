// Controlli sullo script dell'installer: il nome "Electron" non deve mai tornare nei collegamenti.
const test = require('node:test'); const assert = require('node:assert'); const fs = require('fs'); const path = require('path');
const nsh = fs.readFileSync(path.join(__dirname, '..', 'build', 'installer.nsh'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const after = fs.readFileSync(path.join(__dirname, '..', 'build', 'afterPack.cjs'), 'utf8');

test('il collegamento nel menu Start si chiama Bibo Tune e quello Electron viene tolto', () => {
  assert.match(nsh, /CreateShortCut "\$SMPROGRAMS\\Bibo Tune\.lnk"/);
  assert.match(nsh, /Delete "\$SMPROGRAMS\\Electron\.lnk"/);
  assert.match(nsh, /ShortcutName "Bibo Tune"/);
  assert.doesNotMatch(nsh, /CreateShortCut[^\n]*Electron/);
});
test('il nome nel Pannello di controllo è solo Bibo Tune', () => {
  assert.match(nsh, /DisplayName "Bibo Tune"/);
  assert.strictEqual(pkg.build.nsis.uninstallDisplayName, '${productName}');
  assert.strictEqual(pkg.build.productName, 'Bibo Tune');
});
test('le informazioni del file .exe dicono Bibo Tune', () => {
  for (const k of ['FileDescription', 'ProductName', 'InternalName']) assert.match(after, new RegExp(k + ": 'Bibo Tune'"));
});

test('le icone di finestra e area di notifica hanno la variante per il tema chiaro e il tema le usa', () => {
  const root = path.join(__dirname, '..'); const main = fs.readFileSync(path.join(root, 'electron', 'main.cjs'), 'utf8');
  for (const f of ['icon.png', 'icon-light.png', 'tray.png', 'tray-light.png']) assert.ok(fs.existsSync(path.join(root, 'assets', f)), f);
  assert.match(main, /icon-light\.png/); assert.match(main, /tray-light\.png/);
  assert.match(main, /'theme:set'[\s\S]*applyIcons\(t\)/);
});

test('su Windows le icone sono file .ico fuori dall\'archivio (extraResources) e la barra delle applicazioni le riceve', () => {
  const root = path.join(__dirname, '..'); const main = fs.readFileSync(path.join(root, 'electron', 'main.cjs'), 'utf8');
  for (const f of ['icon-dark.ico', 'icon-light.ico', 'tray-dark.ico', 'tray-light.ico']) assert.ok(fs.statSync(path.join(root, 'assets-ico', f)).size > 1000, f);
  assert.deepStrictEqual(pkg.build.extraResources, [{ from: 'assets-ico', to: 'icons' }]);
  assert.match(main, /process\.resourcesPath, 'icons'/); assert.match(main, /setAppDetails\(\{ appId: 'it\.bibo\.tune', appIconPath/);
  assert.match(main, /app\.whenReady\(\)\.then\(\(\) => \{ createWindow\(\); createTray\(\); applyIcons\(themeNow\(\)\)/);
});

test('i collegamenti che puntano al programma cambiano icona con il tema (solo i nostri)', () => {
  const main = fs.readFileSync(path.join(__dirname, '..', 'electron', 'main.cjs'), 'utf8');
  assert.match(main, /function updateShortcuts/); assert.match(main, /writeShortcutLink\(lnk, 'update', \{ icon, iconIndex: 0 \}\)/);
  assert.match(main, /cur\.target\.toLowerCase\(\) !== exe/); assert.match(main, /User Pinned', 'TaskBar'/); assert.match(main, /applyIcons\(t\) \{\n  updateShortcuts\(t\)/);
});
