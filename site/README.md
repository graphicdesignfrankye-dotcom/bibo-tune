# Sito di Bibo Tune

Pagina statica (HTML e CSS, nessuna build). Si pubblica su Vercel con questa cartella come radice del progetto.

- `index.html` — la pagina; `tokens.css` — colori e misure (stessi dell'app)
- `img/` — schermate dell'app (dati di esempio) e la faccia di Bibo
- `vercel.json` — impostazioni di Vercel (nessuna build, intestazioni di sicurezza)
- Download: il pulsante «Scarica» punta a `/download/windows`. Finché non c'è il rinvio in `vercel.json` si vede `download/windows/index.html` («non ancora pronto»). L'installer sta su Vercel Blob: `scripts/upload-installer.mjs` lo carica e `scripts/set-download-url.cjs` collega il rinvio.
- Da fare prima di pubblicare: caricare l'installer su Blob e collegare il rinvio; immagine per le anteprime social (`og:image`) con l'indirizzo definitivo.

Anteprima in locale: `python3 -m http.server -d site 8000` poi http://127.0.0.1:8000 (il rinvio del download funziona solo su Vercel).
