# Backend locale di Bibo Tune

App senza account, pagamenti o email: il "backend" è il processo main di Electron (`electron/system.cjs`) che parla con Windows. Il renderer lo raggiunge solo da `window.bibo` (preload, contextIsolation, sandbox).

## Cosa fa davvero (solo Windows)
| Funzione | Come |
|---|---|
| File inutili | scansione di Temp, cache Chrome/Edge, SoftwareDistribution\Download, log WER/CBS, miniature, Cestino |
| Pulizia | elimina solo file in cartelle in lista bianca, più vecchi di 24 h, senza seguire i link; conta i byte davvero liberati e gli elementi in uso |
| Avvio automatico | legge `Run` (utente e macchina); acceso/spento via `StartupApproved` (solo utente) |
| Protezione | firewall, Defender in tempo reale, ultimo aggiornamento di Windows (PowerShell) |
| Programmi | chiavi `Uninstall`; "Rimuovi" apre il disinstallatore ufficiale, Windows chiede conferma |
Su Mac/Linux l'app usa i dati finti (sviluppo) e le funzioni distruttive rifiutano.

## Sicurezza
- [x] il renderer manda solo ID noti, mai percorsi o comandi; ID sconosciuti ignorati
- [x] input validato nel main (tipi controllati) e canali IPC in lista fissa
- [x] cancellazione solo dentro cartelle consentite, mai radici di disco, link simbolici ignorati (testato)
- [x] niente segreti, niente rete, niente dati utente in URL o log
- [x] `contextIsolation`, `sandbox`, `nodeIntegration` spento
- [x] `npm audit`: 6 moderate, tutte in electron-builder (solo strumenti di build, non nell'app); da rivalutare prima della release
- [ ] **non provato su un PC Windows reale**: comandi PowerShell/`reg.exe` e percorsi da verificare
- [ ] punto di ripristino prima di pulire (consigliato)
- [ ] aggiornamenti Windows `SoftwareDistribution` richiede amministratore: oggi segnalato e deselezionato
- [ ] impatto di avvio reale (ora "sconosciuto") e "ultimo uso" dei programmi (non disponibile)
- [ ] firma del codice dell'installer (SmartScreen) prima del lancio

## Test
`npm test` (5 test su Mac: guardia dei percorsi, parser del registro, link simbolici, cartelle vuote, rifiuto fuori da Windows).

## Aggiunte (2026-11-05): file grandi, privacy browser, memoria — tutte NON provate su Windows
- **File grandi:** cerca >100 MB in Download, Documenti, Desktop, Video; mai eliminazione definitiva, solo Cestino (`shell.trashItem`), solo ID dell'ultima scansione, solo dentro le cartelle utente.
- **Privacy:** cronologia e cookie di Chrome/Edge (profilo Default); se il browser è aperto rifiuta e lo dice; solo percorsi noti dentro la cartella del browser.
- **Memoria:** elenca le app con finestra più pesanti (protette escluse) e le chiude con `CloseMainWindow` (come la X, mai terminazione forzata). Non "libera la RAM" di sistema: sarebbe un'illusione.

## Aggiunte 2: Defender, spazio, aggiornamenti — NON provate su Windows
- **Scansione:** `Start-MpScan -ScanType QuickScan` (motore di Microsoft, non di Bibo), poi `Get-MpThreat` per le minacce attive; Bibo non rimuove nulla da solo.
- **Spazio:** `Win32_LogicalDisk` + dimensione delle cartelle utente; sola lettura.
- **Aggiornamenti:** `winget upgrade` (tabella letta con le colonne dell'intestazione, testata su un esempio); aggiorna un id alla volta, solo se compare nella lista fresca. Funziona solo per ciò che winget conosce.
- Bug trovato dai test e corretto: la zona scorrevole `main` non era raggiungibile da tastiera (ora `tabIndex=0`).

## Aggiunta 3: monitor nella barra — NON provato su Windows
- `electron/monitor.cjs`: CPU e RAM ogni 5 s (tooltip e menu dell'icona), nessuna rete, nessun dato salvato. 9 test unit, avvio di Electron senza errori su Mac.
- Chiudendo la finestra l'app resta nella barra (preferenza `keepInTray` in `prefs.json`, si toglie dal menu dell'icona). "Esci" dal menu la chiude davvero. Una sola istanza alla volta.
- Avviso nativo se la RAM è ≥ 90% o la CPU ≥ 95%, al massimo uno ogni 30 minuti; il clic apre l'app.
- Non fa: avvio automatico con Windows (si aggiunge dopo, con consenso esplicito), icona che cambia colore.

## Aggiunta 4: duplicati e promemoria
- `scanDuplicates` / `trashDuplicates` (system.cjs): raggruppa per dimensione, poi hash dei primi 64 KB, poi SHA-256 completo. Cartelle: Download, Documenti, Desktop, Video; file >= 1 MB; link ignorati. L'originale (il più vecchio, id `gN-0`) non si può mai spostare: il main accetta solo id `gN-k` con k>=1 trovati nell'ultima scansione. Copie nel Cestino, mai eliminate per sempre.
- Promemoria: `prefs:get/set` accettano solo `off|weekly|monthly`. Notifica se dall'ultima pulizia (o da quando l'hai attivato) è passato il tempo scelto, al massimo una al giorno. Nessun avvio automatico con Windows.
- Non fatti di proposito: punto di ripristino prima di pulire (richiede amministratore, non verificabile qui), impatto reale all'avvio, Firefox, pulizia avanzi dei programmi disinstallati.
- Installer: `npm run dist` crea in `release/` DMG+ZIP Mac (arm64 e x64) e installer NSIS Windows x64. Non firmati. L'exe Windows non ha l'icona incorporata (serve Wine per modificarlo da Mac): l'installer sì.

## Aggiunta 5 (0.1.13): avanzi e memoria
- `getLeftovers/trashLeftovers`: dopo una disinstallazione, solo se il programma non risulta più installato, propone la cartella di installazione (InstallLocation) e le cartelle con il nome esatto in LocalAppData, AppData, ProgramData, Programs, Program Files. Mai radici, mai link, mai il registro. Nel Cestino, solo ciò che l'utente spunta (di default nulla).
- `freeMemory`: EmptyWorkingSet sui programmi dell'utente nella sua sessione, esclusi i processi di sistema (PROTECTED) e Bibo; non chiude nulla. Il valore liberato è la differenza di memoria fisica libera prima/dopo: effetto temporaneo.
- Entrambi NON provati su Windows.
