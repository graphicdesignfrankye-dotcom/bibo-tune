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
