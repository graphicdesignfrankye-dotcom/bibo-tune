# Sito di Bibo Tune

Pagina statica (HTML e CSS, nessuna build). Si pubblica su Vercel con questa cartella come radice del progetto.

- `index.html` — la pagina; `tokens.css` — colori e misure (stessi dell'app)
- `img/` — schermate dell'app (dati di esempio) e la faccia di Bibo
- `vercel.json` — impostazioni di Vercel (nessuna build, intestazioni di sicurezza)
- Da fare prima di pubblicare: il pulsante «Scarica» in `index.html` punta a `#` finché non si decide dove ospitare l'installer; immagine per le anteprime social (`og:image`) con l'indirizzo definitivo.

Anteprima in locale: `npx serve site` (oppure `python3 -m http.server -d site 8000`).
