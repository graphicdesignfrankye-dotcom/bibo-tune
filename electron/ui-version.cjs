// Quale interfaccia mostrare: la recente (dist/) oppure la classica 0.1.27 (dist/classic/, copiata dall'installer di allora).
// Logica pura, senza Electron, così si prova con i test.
const path = require('path');

const CLASSIC_VERSION = '0.1.27';
const normalize = (v) => (v === 'classic' ? 'classic' : 'recent');
const isValid = (v) => v === 'recent' || v === 'classic';
const other = (v) => (normalize(v) === 'classic' ? 'recent' : 'classic');
/** Percorso di index.html dell'interfaccia scelta, dentro la cartella dell'app. */
const indexFile = (root, v) => (normalize(v) === 'classic' ? path.join(root, 'dist', 'classic', 'index.html') : path.join(root, 'dist', 'index.html'));
/** Voce del menu dell'icona: propone l'altra versione. */
const menuLabel = (v, appVersion) => (normalize(v) === 'classic' ? `Versione recente (${appVersion})` : `Versione ${CLASSIC_VERSION}`);
/** Ctrl+Maiusc+V (e nient'altro, né Alt né Cmd). */
const isToggleKey = (i) => !!i && i.type === 'keyDown' && !!i.control && !!i.shift && !i.alt && !i.meta && String(i.key).toLowerCase() === 'v';

module.exports = { CLASSIC_VERSION, normalize, isValid, other, indexFile, menuLabel, isToggleKey };
