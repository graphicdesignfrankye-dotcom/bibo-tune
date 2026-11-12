# Bibo Tune — componenti

Stile: tema scuro profondo verde-acqua, accento arancio, vetro smerigliato, raggi molto grandi, un'azione primaria enorme.
Palette propria (replica-brand, 2026-11-10): verde-acqua e arancio, più un tema chiaro. Niente logo, icone, testi o illustrazioni di altri prodotti.
Icone: Lucide (MIT). Font: Inter + Plus Jakarta Sans (open). I nomi dei token accent-pink e accent-cyan restano per non toccare il codice: oggi sono l'arancio e l'azzurro acqua.

## Layout
- Finestra 1100×720, raggio `xl`, sfondo `grad-app` con due aloni sfocati (rosa in alto a destra, ciano in basso a sinistra).
- Sidebar 76px a icone, vetro. Header 56px (trascinabile, controlli finestra Windows).
- Contenuto max 1040px, padding 32/48.

## Bibo (mascotte) — vedi `preview/index.html`
```
Bibo
  forma     testa-corpo a pillola bianco/lavanda, visiera scura con occhi ciliegia-ciano, antenna con bulbo rosa, zaino assente (silhouette originale, non Astro Bot)
  stati     idle (fluttua, sbatte le palpebre, antenna oscilla), walking (gambe in oscillazione, specchia la direzione),
            scanning (braccio saluta, occhi cercano), happy (occhi a "^ ^" verdi, salta 3 volte), error (occhi ambra, antenna ferma) [da fare]
  movimento passeggia tra punti casuali ogni ~4s con transizione 1.8s ease; mai sopra i pulsanti in focus; ombra a terra separata
  fumetto   max 1 frase, 60 caratteri, scompare da solo; testi scritti da zero
  interazione click = saluto; durante una scansione segue il flusso (va verso la zona analizzata)
  a11y      role=img + aria-label; decorativo, mai unico portatore di informazione; con prefers-reduced-motion resta fermo e i testi appaiono nei card
  tokens    body #fff→accent-light, visiera surface-raised, bulbo accent-pink, occhi accent-cyan, gioia success
```

## Button
```
  variants  primary (pillola, gradiente hero + glow), ghost (vetro), danger
  sizes     md 48px (unico), lg 64px per il CTA "Avvia messa a punto"
  states    default, hover (sale 2px, scale 1.03, spring), active (scale .97), focus-visible (anello 2px ciano, offset 3), disabled (opacity .45), loading (etichetta cambia, mantiene larghezza)
  a11y      <button> reale, loading con aria-busy
```

## Card (modulo)
```
  base      vetro (glass-bg, bordo glass-border, blur 24), raggio lg, ombra card
  contenuto icona 44px su gradiente di categoria, titolo lg/700, riga muted sm, meter 8px
  gradienti pulizia=arancio→ambra, velocità=verde chiaro→verde-acqua, protezione=azzurro→verde-acqua scuro
  states    default, hover (sale 4px), focus-visible, selected (bordo accent), loading (shimmer), empty ("Tutto pulito"), error (bordo danger)
```

## Sidebar item
```
  48×48 raggio md; default muted; hover vetro; current gradiente hero + glow; focus-visible anello ciano; tooltip all'hover; aria-current="page"
```

## Meter / progress
```
  8px pillola su surface-raised, riempimento a gradiente di categoria, transizione base; versione ad anello 220px per la scansione (gradiente scan) con percentuale display al centro
```

## Chip di stato
```
  pillola xs/600 su vetro; testo success|warning|danger (mai solo il colore: sempre pallino + parola)
```

## Toggle, Checkbox, Lista risultati, Modale di conferma, Toast
```
  Toggle     44×26, acceso gradiente hero, spring sulla manopola, focus ciano
  Checkbox   raggio sm, bordo border-input (≥3:1), spunta on-accent
  Lista      righe 56px su vetro, dimensione a destra mono, checkbox a sinistra, "Seleziona tutto"
  Modale     surface-raised, raggio xl, ombra pop, sfondo scuro 60%, Esc chiude, focus trap; azioni distruttive chiedono conferma con elenco di cosa viene eliminato
  Toast      in basso a destra, vetro, 4s, role=status
```

## Regola d'oro sicurezza (UX)
Nessuna cancellazione senza anteprima; ogni pulizia mostra cosa e quanto, con "Annulla" dove possibile.
