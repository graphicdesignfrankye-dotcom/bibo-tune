# Bibo Tune

App per Windows che mette a punto il PC con l'aiuto del robot Bibo: toglie i file inutili, mostra cosa rallenta l'avvio, controlla le difese di Windows, disinstalla i programmi e cerca gli avanzi che lasciano. Tutto avviene sul computer: Bibo Tune non invia nulla in rete.

È fatta con Electron e React. Su Windows lavora sul PC vero; su Mac e Linux, e nel browser, mostra dati di esempio, così si può sviluppare e provare l'interfaccia senza toccare niente.

> **Stato:** versione 0.1.53, provata su Windows fino alla 0.1.27 e in parte oltre. L'installer non è firmato: al primo avvio Windows (SmartScreen, Smart App Control) può mostrare un avviso.

## Cosa fa

| Sezione | Cosa si può fare |
|---|---|
| Panoramica ("Messa a punto") | Controllo rapido di tutto, poi riepilogo con Pulizia, Velocità e Protezione |
| Pulizia | File temporanei, cache dei browser, vecchi aggiornamenti, registri, miniature, Cestino, anche un elemento alla volta |
| Velocità | Programmi all'avvio con il loro impatto, memoria in uso, "Libera memoria" |
| Protezione | Stato di firewall, antivirus e aggiornamenti; scansione rapida con Microsoft Defender |
| Privacy | Cronologia e cookie dei browser (non tocca segnalibri né password) |
| Programmi | Disinstallazione, avanzi (cartelle e voci di registro, con copia `.reg` prima di cancellare) |
| Aggiornamenti | Aggiornamento dei programmi tramite `winget` |
| Caos | File grandi e duplicati, che vanno nel Cestino |
| Mappa del disco | Elenco delle cartelle e mappa a bolle, con le cartelle apribili; solo lettura |
| Impostazioni | Tema (anche l'icona di finestra e area di notifica cambia, chiara o scura), cinque palette, barra delle applicazioni, promemoria, **Versione** |

**Versione.** In Impostazioni si sceglie tra l'interfaccia *Recente* e quella *Classica 0.1.27* (la vecchia interfaccia, conservata in `public/classic/`). Il motore è lo stesso. Per tornare alla recente: pulsante "‹ Versione recente" nella finestra, voce nel menu dell'icona nella barra, oppure `Ctrl+Maiusc+V`.

## Requisiti

- Node.js (sviluppata con la 24) e npm
- Windows per le funzioni reali; qualsiasi sistema per sviluppare con i dati di esempio

## Avvio

```bash
npm install
npm run dev        # interfaccia nel browser, dati di esempio (http://localhost:5173)
npm run electron   # compila e apre l'app Electron
```

L'interfaccia classica, nel browser, sta a `http://localhost:5173/classic/index.html`.

## Test

```bash
npm test                         # test di sistema, della scelta di versione e dell installer (node:test)
npx playwright install chromium  # solo la prima volta
npm run test:e2e                 # test dell'interfaccia (Playwright), circa 3 minuti
```

I test e2e avviano da soli il server di prova sulla porta 5181. Controllano le schermate, il contrasto e l'accessibilità (axe), la larghezza a 390 px, la tastiera, i temi e le palette.

Le operazioni su Windows (registro, Cestino, Defender, winget) non si possono provare dal Mac: i test controllano la validazione degli argomenti e il rifiuto fuori da Windows, il resto va provato sul PC.

## Generare l'installer Windows

```bash
npm run dist:win
```

Produce `release/Bibo Tune-<versione>-win-x64.exe` (NSIS, x64) e il relativo `.blockmap`. Si può generare anche da Mac: electron-builder scarica da solo gli strumenti che servono. L'installer non è firmato (nessun certificato configurato). All'avvio chiede se installare il programma o usarlo in versione portatile (solo i file in una cartella, senza collegamenti né disinstallatore): lo script è `build/installer.nsh`.

A ogni installer nuovo si alza `version` in `package.json`: il numero compare in Impostazioni e nel nome del file.

## Struttura

```
src/             interfaccia React (schermate, componenti, temi, palette)
  data/api.js    dati di esempio, oppure le chiamate vere se gira dentro Electron su Windows
electron/        processo principale e preload
  system.cjs     operazioni sul PC (pulizia, registro, programmi, Defender...)
  ui-version.cjs scelta tra interfaccia recente e classica
public/classic/  interfaccia 0.1.27, conservata com'era
e2e/  test/      test dell'interfaccia e test di sistema
replica/         documenti di lavoro: funzioni, architettura, piano dei test, parità
build/  assets/  icone
```

## Sicurezza

- Il codice dell'interfaccia non ha accesso diretto al sistema: parla con il processo principale solo attraverso canali elencati nel preload.
- Ogni operazione distruttiva viene rivalidata in `electron/system.cjs`: cartelle e chiavi di registro ammesse solo da elenchi noti, mai radici di disco, mai `..`.
- Prima di cancellare chiavi di registro si salva una copia `.reg`; se la copia non riesce, non si cancella.
- Le operazioni da amministratore partono solo dopo una richiesta esplicita di Windows e ricevono solo elementi già validati.

## Note

- Le immagini di confronto usate durante lo sviluppo non fanno parte del repository.
- Licenza: vedi [LICENSE](LICENSE). Tutti i diritti riservati.
