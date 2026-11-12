# Piano di test — Bibo Tune (dati finti, Mac, Chromium)
Flussi: F01 scansione e pulizia · F02 Pulizia · F03 Velocità · F04 Protezione · F05 Programmi · F06 Bibo
Eseguiti con Playwright (`npm run test:e2e`), selettori per ruolo/etichetta, errori console e 5xx = fallimento, axe WCAG AA su ogni schermata (desktop e 390px).

| ID | Caso | Esito |
|---|---|---|
| F01-H1 | scansione → elenco → conferma → pulizia → "liberati" | ok |
| F01-E1 | Esc chiude la conferma senza cancellare | ok |
| F01-E2 | deseleziona tutto → Pulisci disattivato | ok |
| F01-E3 | doppio click su Avvia: una sola scansione | ok |
| F01-E4 | ricarica a metà scansione | ok |
| F01-E5 | le card aprono le schermate | ok |
| F01-K1 | tutto il percorso da tastiera, focus nella finestra e trappola | ok |
| F02/F03/F05 | pulisci tutto → vuoto · toggle · rimozione con conferma | ok |
| F06 | non blocca i click · decorativo · "riduci animazioni" lo ferma | ok |
| S-* | 5 schermate: aperte, 0 errori, 0 violazioni AA | ok |
| M-* | 390px: 5 schermate senza scroll orizzontale + flusso + nome lungo | ok |

Non coperti: su Windows reale (comandi PowerShell/reg), offline/rete lenta (nessuna rete), lettore di schermo vero, due schede insieme, schermi Electron (solo browser).
