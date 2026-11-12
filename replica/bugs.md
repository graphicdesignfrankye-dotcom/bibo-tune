# Bug — Bibo Tune

## B01 — S3 — Le barre di livello non hanno un nome accessibile
- Passi: aprire Panoramica, scansione axe WCAG AA.
- Atteso: ogni `progressbar` ha un'etichetta. Reale: `aria-progressbar-name` su 3 barre.
- Evidenza: test S-Panoramica e M-Panoramica rossi.
- Stato: **corretto** (aria-label "Livello <titolo>" in `src/components/ui.jsx`); i due test restano come regressione.

## B02 — S3 — Bibo intercettava i click sulle card e a 390px copriva il contenuto
- Stato: **corretto**: Bibo non è più cliccabile (`pointer-events:none`, `role=img`), più piccolo sotto i 700px. Test: «Bibo non blocca i click».

## B03 — S4 — Due `role=status` con lo stesso testo durante la scansione
- Stato: **corretto**: il fumetto è `aria-hidden`; resta solo la barra di avanzamento. Test: «Bibo è decorativo».

## Da controllare
- T3: i test su Windows reale sono rimandati all'ultimo (vedi backend.md).
