// Carica l'installer su Vercel Blob (archivio file di Vercel) e stampa l'indirizzo pubblico.
// Uso:  npm i --no-save @vercel/blob   (una volta, senza toccare package.json)
//       BLOB_READ_WRITE_TOKEN=... node scripts/upload-installer.mjs "release/Bibo Tune-0.1.58-win-x64.exe"
// Il token si crea in Vercel: Storage → Blob → il tuo archivio → .env.local / Tokens. Non va mai scritto in un file del progetto.
import { readFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import { put } from '@vercel/blob';

const file = process.argv[2];
if (!file) { console.error('Indica il file da caricare.'); process.exit(1); }
if (!process.env.BLOB_READ_WRITE_TOKEN) { console.error('Manca BLOB_READ_WRITE_TOKEN (variabile d\'ambiente).'); process.exit(1); }
const name = basename(file).replace(/\s+/g, '-'); // Bibo-Tune-0.1.58-win-x64.exe
console.log(`Carico ${name} (${(statSync(file).size / 1048576).toFixed(1)} MB)…`);
const blob = await put(name, readFileSync(file), { access: 'public', multipart: true, addRandomSuffix: false, allowOverwrite: false, contentType: 'application/vnd.microsoft.portable-executable' });
console.log('Fatto. Indirizzo pubblico:\n' + blob.url + '\nPoi: node scripts/set-download-url.cjs "' + blob.url + '"');
