# Marchio Bibo Tune

Logo, icone e immagine social. Il simbolo è la faccia di Bibo con contorno, senza fondo: testa tonda, visiera scura con occhi azzurri, antenna con lampadina arancio. Esiste in due versioni: per il tema scuro (icona scura: testa verde-acqua, contorno chiaro, `icon-dark.svg`) e per il tema chiaro (icona chiara: testa chiara, contorno verde-acqua, `icon-light.svg`). Le icone dell'app e del sito si rigenerano con `node scripts/make-icons.cjs`. I loghi con la scritta (`logo*.svg`) e l'immagine social usano ancora il vecchio simbolo su fondo verde-acqua e arancio.

## File

| File | A cosa serve |
|---|---|
| `logo.svg` | Logo orizzontale (simbolo + scritta) per sfondi chiari |
| `logo-on-dark.svg` | Lo stesso, con la scritta chiara, per sfondi scuri |
| `icon-dark.svg`, `icon-light.svg` | Faccia di Bibo con contorno, senza fondo, per tema scuro e chiaro (sorgenti delle icone) |
| `logo-symbol.svg` | Come `icon-dark.svg` (sito, social, profilo) |
| `app-icon-square.svg` | Faccia su fondo blu scuro a pieno quadrato, senza trasparenza: per le icone degli store |
| `favicon.svg` | Stessa faccia (tema scuro), per le dimensioni piccole (16–64 px) |
| `favicon.ico` | Favicon per i browser più vecchi: 16, 32, 48 e 64 px |
| `social-1200x630.svg` | Immagine per le anteprime sui social |
| `png/` | Le stesse immagini già pronte in PNG (vedi sotto) |

PNG pronti in `png/`: `social-1200x630.png`, `logo.png`, `logo-on-dark.png`, `logo-symbol-1024.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon-180.png`, `app-icon-1024.png` (senza trasparenza, per gli store), `favicon-16/32/48/64.png`.

Il favicon è già collegato all'app (`index.html`, con copie in `public/`). L'icona dell'installer di Windows resta quella di `build/icon.*`, che ha lo stesso disegno.

## Colori

| | |
|---|---|
| Verde-acqua | `#0F7A70` → `#0F766E` |
| Arancio (fine sfumatura) | `#C2410C` |
| Lampadina | `#FF8A3D` |
| Occhi | `#67E8F9` |
| Testa | `#EFF9F8` |
| Visiera | `#08121A` |
| Scritta su chiaro | `#0B1F24`, con "Tune" in `#0F766E` |
| Scritta su scuro | `#F1FAFA`, con "Tune" in `#2DD4BF` |

## Scritta

"Bibo Tune" in Plus Jakarta Sans ExtraBold, convertita in tracciati: negli SVG non ci sono caratteri da installare. Il carattere ha licenza SIL Open Font License 1.1 (consente l'uso e le derivazioni, anche commerciali). "Bibo" prende il colore del testo, "Tune" il verde-acqua.

## Come usarlo

- **Spazio intorno:** lascia almeno metà della larghezza del simbolo libera su ogni lato.
- **Dimensione minima:** il logo orizzontale non sotto i 120 px di larghezza; il simbolo da solo fino a 16 px (lì usa `favicon.svg`, non il simbolo grande).
- **Sfondi:** `logo.svg` su chiaro, `logo-on-dark.svg` su scuro. Sul simbolo il fondo verde-acqua non va cambiato.
- **Da non fare:** cambiare i colori, schiacciare o inclinare il logo, aggiungere ombre, mettere la scritta chiara su fondo chiaro.

## Stato del marchio

Il nome non è registrato e i controlli fatti sono di screening, non un parere legale: vedi `replica/brand.md`, sezione "Controlli del 2026-11-12". Prima di spendere soldi sul nome serve un avvocato marchi.

## Come sono stati generati

Python con `fonttools` (scritta in tracciati) e un browser (Playwright) per i PNG; `Pillow` per il `.ico` e per togliere il canale di trasparenza dalle icone degli store. Gli SVG si possono modificare a mano: sono corti e senza dipendenze.
