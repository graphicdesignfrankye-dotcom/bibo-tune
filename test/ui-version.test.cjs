const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const uiv = require('../electron/ui-version.cjs');
const root = path.join(__dirname, '..');

test('normalize: qualunque valore strano diventa la versione recente', () => {
  assert.equal(uiv.normalize('classic'), 'classic');
  for (const v of ['recent', undefined, null, '', 'Classic', 'x', 5, {}]) assert.equal(uiv.normalize(v), 'recent');
});
test('isValid e other: solo recent e classic, e si propone sempre l\'altra', () => {
  assert.equal(uiv.isValid('recent'), true); assert.equal(uiv.isValid('classic'), true);
  for (const v of ['', 'Classic', '0.1.27', undefined, null, '../dist']) assert.equal(uiv.isValid(v), false);
  assert.equal(uiv.other('recent'), 'classic'); assert.equal(uiv.other('classic'), 'recent'); assert.equal(uiv.other(undefined), 'classic');
});
test('indexFile: la classica sta in dist/classic, la recente in dist, sempre dentro l\'app', () => {
  assert.equal(uiv.indexFile('/app', 'recent'), path.join('/app', 'dist', 'index.html'));
  assert.equal(uiv.indexFile('/app', 'classic'), path.join('/app', 'dist', 'classic', 'index.html'));
  assert.equal(uiv.indexFile('/app', '../../etc'), path.join('/app', 'dist', 'index.html')); // valore non valido: la recente
});
test('menuLabel: il menu dell\'icona propone l\'altra versione', () => {
  assert.equal(uiv.menuLabel('recent', '0.1.40'), 'Versione 0.1.27');
  assert.equal(uiv.menuLabel('classic', '0.1.40'), 'Versione recente (0.1.40)');
});
test('isToggleKey: solo Ctrl+Maiusc+V, né Alt né Cmd, solo alla pressione', () => {
  const k = (o) => ({ type: 'keyDown', key: 'V', control: true, shift: true, alt: false, meta: false, ...o });
  assert.equal(uiv.isToggleKey(k({})), true); assert.equal(uiv.isToggleKey(k({ key: 'v' })), true);
  assert.equal(uiv.isToggleKey(k({ shift: false })), false); assert.equal(uiv.isToggleKey(k({ control: false })), false);
  assert.equal(uiv.isToggleKey(k({ alt: true })), false); assert.equal(uiv.isToggleKey(k({ meta: true })), false);
  assert.equal(uiv.isToggleKey(k({ key: 'c' })), false); assert.equal(uiv.isToggleKey(k({ type: 'keyUp' })), false);
  assert.equal(uiv.isToggleKey(null), false); assert.equal(uiv.isToggleKey(undefined), false);
});
test('l\'interfaccia classica è nel progetto, completa e della 0.1.27', () => {
  const idx = fs.readFileSync(path.join(root, 'public', 'classic', 'index.html'), 'utf8');
  const files = [...idx.matchAll(/(?:src|href)="\.\/(assets\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(files.length >= 2, 'index.html deve citare almeno un js e un css');
  for (const f of files) assert.ok(fs.existsSync(path.join(root, 'public', 'classic', f)), 'manca ' + f);
  assert.ok(/<title>Bibo Tune<\/title>/.test(idx));
});
test('la classica ha il suo modo di tornare indietro: pulsante e scorciatoia, nell\'app e nel browser', () => {
  const idx = fs.readFileSync(path.join(root, 'public', 'classic', 'index.html'), 'utf8');
  assert.ok(idx.includes('<script src="./return.js"></script>'), 'index.html carica return.js');
  const js = fs.readFileSync(path.join(root, 'public', 'classic', 'return.js'), 'utf8');
  assert.ok(js.includes("setUiVersion('recent')"), "nell'app chiede la versione recente al processo principale");
  assert.ok(js.includes("location.assign('../')"), 'nel browser apre la pagina principale');
  assert.ok(js.includes('Torna alla versione recente') && js.includes('bibo-back-to-recent'), 'pulsante con nome accessibile');
  assert.ok(/if \(!window\.bibo\) addEventListener\('keydown'/.test(js), "la scorciatoia nel browser non raddoppia quella dell'app");
  assert.ok(js.includes('bibo-version-section') && js.includes('Applica e riapri'), 'voce Versione dentro Impostazioni della classica');
  assert.ok(js.includes("h2.h2s.sect"), 'si aggancia al titolo Impostazioni della 0.1.27');
});
test('il processo principale e il preload espongono la scelta della versione', () => {
  const main = fs.readFileSync(path.join(root, 'electron', 'main.cjs'), 'utf8'), pre = fs.readFileSync(path.join(root, 'electron', 'preload.cjs'), 'utf8');
  for (const ch of ['ui:version:get', 'ui:version:set']) { assert.ok(main.includes(`'${ch}'`), ch + ' in main'); assert.ok(pre.includes(`'${ch}'`), ch + ' in preload'); }
  assert.ok(main.includes('before-input-event') && main.includes('uiv.isToggleKey'), 'scorciatoia Ctrl+Maiusc+V');
  assert.ok(main.includes('uiv.menuLabel'), 'voce nel menu dell\'icona');
});
