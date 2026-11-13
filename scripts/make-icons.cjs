// Genera TUTTE le icone dell'app dalla faccia di Bibo con contorno (proposta B): finestra, area di notifica, barra delle applicazioni,
// installer, favicon e immagini del marchio. Per tema scuro (icona scura) e chiaro (icona chiara). Uso: node scripts/make-icons.cjs
const { chromium } = require('@playwright/test'); const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..'); const out = (...p) => path.join(root, ...p);
const VB = '160 140 704 704';
const COLORS = {
  dark: { head: '#0F766E', stem: '#0F766E', line: '#EFF9F8' },   // 'dark' = l'icona scura, usata con il tema scuro: testa verde-acqua scura, contorno chiaro
  light: { head: '#EFF9F8', stem: '#CDEBE6', line: '#0F766E' },  // 'light' = l'icona chiara, usata con il tema chiaro: testa chiara, contorno verde-acqua
};
const BULB = '#FF8A3D', VISOR = '#08121A', EYE = '#67E8F9', NAVY = '#0E1A22';
const svg = (t, opaque = false) => { const c = COLORS[t]; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}" width="1024" height="1024" role="img" aria-labelledby="t"><title id="t">Bibo Tune</title>${opaque ? `<rect x="160" y="140" width="704" height="704" fill="${NAVY}"/>` : ''}<rect x="502" y="240" width="20" height="80" rx="10" fill="${c.stem}"/><circle cx="512" cy="214" r="38" fill="${BULB}" stroke="${c.line}" stroke-width="18"/><rect x="212" y="310" width="600" height="500" rx="170" fill="${c.head}" stroke="${c.line}" stroke-width="30"/><rect x="282" y="430" width="460" height="260" rx="100" fill="${VISOR}"/><circle cx="430" cy="560" r="42" fill="${EYE}"/><circle cx="594" cy="560" r="42" fill="${EYE}"/></svg>`; };
function ico(images) { // contenitore ICO con immagini PNG
  const n = images.length, head = Buffer.alloc(6 + 16 * n); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(n, 4);
  let off = head.length; images.forEach(({ size, png }, i) => { const o = 6 + 16 * i; head[o] = size >= 256 ? 0 : size; head[o + 1] = size >= 256 ? 0 : size; head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6); head.writeUInt32LE(png.length, o + 8); head.writeUInt32LE(off, o + 12); off += png.length; });
  return Buffer.concat([head, ...images.map((i) => i.png)]);
}
(async () => {
  const b = await chromium.launch(); const cache = {};
  const png = async (t, n, opaque = false) => { const k = `${t}${n}${opaque}`; if (cache[k]) return cache[k];
    const p = await b.newPage({ viewport: { width: n, height: n } });
    await p.setContent(`<body style="margin:0;background:transparent">${svg(t, opaque).replace(/width="1024" height="1024"/, `width="${n}" height="${n}"`)}</body>`);
    cache[k] = await p.screenshot({ omitBackground: !opaque, clip: { x: 0, y: 0, width: n, height: n } }); await p.close(); return cache[k]; };
  const w = (f, buf) => { fs.mkdirSync(path.dirname(out(f)), { recursive: true }); fs.writeFileSync(out(f), buf); console.log(f); };
  const icoOf = async (t, sizes) => ico(await Promise.all(sizes.map(async (size) => ({ size, png: await png(t, size) }))));
  // sorgenti vettoriali
  w('brand/icon-dark.svg', svg('dark')); w('brand/icon-light.svg', svg('light'));
  w('brand/logo-symbol.svg', svg('dark')); w('brand/favicon.svg', svg('dark')); w('brand/app-icon-square.svg', svg('dark', true));
  // app: finestra e area di notifica (tema scuro = predefinita)
  w('assets/icon.png', await png('dark', 1024)); w('assets/icon-light.png', await png('light', 1024));
  w('assets/tray.png', await png('dark', 32)); w('assets/tray@2x.png', await png('dark', 64)); w('assets/tray-light.png', await png('light', 32)); w('assets/tray-light@2x.png', await png('light', 64));
  // Windows: .ico con più misure, fuori dall'archivio
  w('assets-ico/icon-dark.ico', await icoOf('dark', [16, 24, 32, 48, 64, 128, 256])); w('assets-ico/icon-light.ico', await icoOf('light', [16, 24, 32, 48, 64, 128, 256]));
  w('assets-ico/tray-dark.ico', await icoOf('dark', [16, 20, 24, 32, 48, 64])); w('assets-ico/tray-light.ico', await icoOf('light', [16, 20, 24, 32, 48, 64]));
  // installer e file del programma
  w('build/icon.ico', await icoOf('dark', [16, 24, 32, 48, 64, 128, 256])); w('build/icon.png', await png('dark', 1024));
  // sito, favicon e immagini del marchio
  w('brand/favicon.ico', await icoOf('dark', [16, 32, 48, 64])); w('public/favicon.ico', await icoOf('dark', [16, 32, 48, 64])); w('public/favicon.svg', svg('dark'));
  w('public/apple-touch-icon.png', await png('dark', 180, true));
  for (const n of [16, 32, 48, 64]) w(`brand/png/favicon-${n}.png`, await png('dark', n));
  w('brand/png/logo-symbol-1024.png', await png('dark', 1024)); w('brand/png/icon-192.png', await png('dark', 192)); w('brand/png/icon-512.png', await png('dark', 512));
  w('brand/png/apple-touch-icon-180.png', await png('dark', 180, true)); w('brand/png/app-icon-1024.png', await png('dark', 1024, true));
  await b.close();
})();
