// Collega il pulsante «Scarica» all'installer: aggiunge in site/vercel.json il rinvio /download/windows → indirizzo del Blob.
// Uso: node scripts/set-download-url.cjs "https://….public.blob.vercel-storage.com/Bibo-Tune-0.1.58-win-x64.exe"
const fs = require('fs'); const path = require('path');
const url = process.argv[2];
if (!/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/.+\.exe$/i.test(url || '')) { console.error('Indirizzo non valido: deve essere un indirizzo pubblico di Vercel Blob che finisce in .exe.'); process.exit(1); }
const f = path.join(__dirname, '..', 'site', 'vercel.json'); const cfg = JSON.parse(fs.readFileSync(f, 'utf8'));
cfg.redirects = [{ source: '/download/windows', destination: url, permanent: false }];
fs.writeFileSync(f, JSON.stringify(cfg, null, 2) + '\n'); console.log('Aggiornato site/vercel.json:', cfg.redirects[0]);
