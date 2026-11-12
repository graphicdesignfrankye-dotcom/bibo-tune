# Bibo Tune — architettura (v0.1)
Electron (main + preload con contextIsolation) + React + Vite. Nessun backend.
Schermate: S01 Panoramica (scansione e pulizia), S02 Pulizia, S03 Velocità, S04 Protezione, S05 Programmi.
Livello dati: `src/data/api.js` (FINTO, stesse firme del futuro reale via IPC). Unico dato reale: `sys:info` (CPU, RAM, uptime).
Prossimo: sostituire api.js con operazioni reali su Windows (cartelle temp, avvio automatico, Defender, programmi installati), sempre con anteprima prima di eliminare.
