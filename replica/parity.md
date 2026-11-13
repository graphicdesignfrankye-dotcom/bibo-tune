## Parity: 100.0 / 100

features 100.0  (17 counted, must-haves 4 of 4 done)

## By area, weakest first
- panoramica                   100.0  (5 features)
- pulizia                      100.0  (6 features)
- velocità                     100.0  (2 features)
- programmi                    100.0  (2 features)
- protezione                   100.0  (2 features)

## Missing, in build order
- nothing. Every counted feature is done.

## Yours, not in the original (not scored)
- Mascotte Bibo che guida l'utente
- Punto di ripristino prima di pulire
- Chiudere i programmi aperti che bloccano la pulizia
- Svuota Cestino come azione a parte
- Impostazioni (tema)

## Prove su Windows (2026-11-10, fino alla 0.1.18)
Tutte le 17 funzioni della matrice provate su Windows. In più, esiti riferiti dall'utente con la 0.1.18: punto di ripristino (casella nelle conferme di pulizia) e pulsante "Chiudi Edge" funzionanti.

## Versioni 0.1.19 e 0.1.20
- 0.1.19 (provata dall'utente su Windows): popup "Ci sono programmi aperti" (Annulla / Pulisci senza chiuderli / Chiudi e pulisci) al posto del pulsante "Chiudi Edge"; schermata Impostazioni. Funzionano.
- 0.1.20 (non ancora provata su Windows): "Svuota Cestino" in una voce a parte (Cestino) nella barra laterale; Impostazioni con Tema Scuro/Chiaro (il chiaro supera i controlli di contrasto AA su tutte le schermate nei test) e una voce Palette per i colori, da aggiungere.

## Marchio (punto 4, 2026-11-10)
Nome confermato: Bibo Tune. Palette propria verde-acqua e arancio (scuro e chiaro, 0 coppie sotto AA), nuova icona e icona della barra, sweep pulito. Versione 0.1.21 (non ancora provata su Windows). Dettagli e controlli ancora da fare in `replica/brand.md`.

## Differenze di comportamento
- Libera memoria: effetto temporaneo.
- Privacy: Firefox solo cookie (la cronologia è nello stesso file dei segnalibri).
- Disinstallare: il registro non si tocca; gli avanzi sono solo cartelle, nel Cestino, solo se scelte.
- Avvio: impatto non mostrato (Windows non lo espone).
- Promemoria: parte solo se Bibo è in esecuzione.

## Prossimi passi
1. Provare la 0.1.20: voce Cestino, tema Chiaro, barra del titolo nel tema chiaro.
2. Nome, logo e marchio propri (replica-brand).
3. Colori del tema (li aggiungerà l'utente).
4. Firma digitale dell'installer.
5. Misura del layout se si ottengono screenshot di riferimento.

Verdetto: tutti i must-have fatti e punteggio sopra 80, nessun bug grave aperto: spedibile per uso personale. Per darlo ad altri serve la firma. Layout non misurato; matrice scritta dalla mia conoscenza dell'app di riferimento.

## Aggiornamento 2026-11-11 (0.1.22-0.1.27)
Provato dall'utente su Windows, anche su un secondo PC: cinque palette e Informazioni/Impostazioni (0.1.22-0.1.23), avanzi di Firefox in `Mozilla\Firefox` (0.1.24), Cestino che mostra gli avanzi spostati e voci di registro HKCU con copia .reg (0.1.25), cancellazione HKLM come amministratore (0.1.26), ritorno alla schermata di attesa se si preme "Ho finito" troppo presto (0.1.27). Restano: firma dell'installer, misura del layout, controlli del marchio.

## Layout vs l'app di riferimento (2026-11-11, prima misura)
Cinque schermate a 1200x720 (finestra dell'app di riferimento sul Mac, che non va oltre): l'apertura di riferimento, Pulizia, Protezione, Prestazioni, Applicazioni, stato "prima della scansione". Layout: 21,3 / 14,9 / 16,3 / 18,7 / 16,6 su 100, tutte "diverse".
Non sono confronti alla pari: l'app di riferimento mostra una pagina di benvenuto per sezione (barra laterale larga con etichette, illustrazione a sinistra, titolo e tre voci a destra, tasto Scansiona in basso al centro); noi mostriamo subito la schermata di lavoro con la barra laterale a sole icone (circa 76 px contro circa 250). Per confrontare bene serve lo stesso stato: o la loro schermata dopo la scansione, o una nostra pagina di benvenuto.

### Seconda misura: dopo la scansione (stesso stato)
Scansione di Pulizia fatta sull'app di riferimento (solo lettura, niente cancellato): 12,6 GB trovati. Layout: elenco del dettaglio dell'app di riferimento ↔ nostra Pulizia 17,3; riepilogo a riquadri ↔ nostra Panoramica 28,8. Ancora "diversi".
Differenze di struttura: l'app di riferimento ha tre colonne (categorie | tipi di file | elementi con casella) e in basso una barra "0 elementi selezionati | Pulisci"; noi una sola colonna. Il riepilogo loro è una griglia (un riquadro grande a sinistra + 2x2) con titolo centrato in alto e per ogni riquadro "Rivedi" e "Pulisci"; noi un'intestazione a sinistra con tre schede. Barra laterale: loro a sole icone nella vista dettaglio.

### Terza misura: Pulizia a tre colonne (0.1.28)
Schermata Pulizia rifatta come il dettaglio dell'app di riferimento: categorie | tipi di file | elementi con casella, barra in basso con "N elementi selezionati | dimensione" e tasto Pulisci. Layout contro l'elenco dell'app di riferimento: 24,9 (era 17,3). Resta "diverso": il confronto misura i bordi e l'app di riferimento ha una finestra a tutta altezza con barra laterale più stretta e icone grandi; il punto utile era la struttura, ora uguale.
Sotto, per Windows: ogni tipo espone gli elementi reali (es. cache di Chrome / di Edge, cartella Temp dell'utente / di Windows) e si può pulire un elemento solo. Da provare su Windows.

### Quarta misura: benvenuto di Pulizia (0.1.29)
Pulizia si apre con una pagina di benvenuto (disco con scintille a sinistra, titolo e tre voci a destra, tasto Scansiona in basso al centro); la scansione parte solo premendo Scansiona, poi compaiono le tre colonne; "Ricomincia" torna al benvenuto. Layout benvenuto contro la pagina dell'app di riferimento: 25,3 (prima 14,9); elenco 25,4. Testi e disegno sono nostri, non copiati.

### Quinta misura: riepilogo a riquadri (0.1.29)
Dopo "Scansiona" ora compare il riepilogo: titolo con il totale, "Controlla tutto", riquadri (File temporanei grande a sinistra + Cache dei browser, Vecchi aggiornamenti, Cestino, Registri e miniature) ciascuno con Rivedi e Pulisci. Rivedi e "Controlla tutto" aprono le tre colonne; Indietro torna al riepilogo; Ricomincia torna al benvenuto. Layout riepilogo contro l'app di riferimento: 41,9 su 100 (era 28,8 con la vecchia Panoramica); elenco a colonne 24,5. Resta "diverso" per sfondo e dimensioni, la struttura ora coincide.

### Sesta misura: benvenuto anche per Velocità, Protezione, Programmi (0.1.30)
Le schermate Velocità, Protezione e Programmi si aprono con lo stesso benvenuto di Pulizia (disco con icona a sinistra, titolo e tre voci a destra, tasto in basso: Analizza / Controlla / Scansiona); il contenuto di prima compare dopo il tasto. Layout contro le pagine di benvenuto dell'app di riferimento: Prestazioni 19,6 (era 18,7), Protezione 25,2 (era 16,3), Applicazioni 19,7 (era 16,6), Pulizia 25,3. Restano "diverse" per sfondo e illustrazioni. Non ancora fatte (nessun riferimento fotografato): File grandi, Duplicati, Cestino, Privacy, Aggiornamenti, Spazio.

### Settima misura: riepilogo a riquadri per Velocità (0.1.31)
Dopo "Analizza", Velocità mostra un riepilogo come le Prestazioni dell'app di riferimento (riferimento: screenshot dell'utente, finestra ritagliata): titolo con il numero di programmi che rallentano l'avvio, "Mostra tutto", riquadro grande Memoria (RAM) con Rivedi e Libera memoria, riquadro largo Impatto alto all'avvio, due piccoli (Programmi all'avvio, Programmi aperti pesanti). Rivedi e Mostra tutto aprono il dettaglio di prima (memoria + elenco con interruttori); Indietro torna al riepilogo. Layout contro il riferimento: 35,0 su 100 (il clone è più alto del 6%). Testi nostri: niente "attività di manutenzione" né Time Machine, che non esistono su Windows.

### Ottava misura: riepiloghi di Protezione e Programmi (0.1.32)
Riferimenti fotografati sul Mac: `protezione-risultati.png` (la scansione antimalware era ancora in corso, ma i riquadri erano già completi) e `applicazioni-risultati.png` (scansione finita: 134 app trovate). Dopo il tasto di avvio, Protezione mostra titolo + "Mostra tutto", riquadro grande "Scansione con Defender" e due riquadri larghi (Firewall e antivirus, Aggiornamenti di sistema); Programmi mostra "Hai N programmi installati", "Mostra tutto", riquadro grande "I più pesanti" con elenco, riquadro largo "Per liberare spazio" e due piccoli. Rivedi apre la schermata di sempre (Defender; elenco con Rimuovi, avanzi, registro); Indietro torna. Layout contro i riferimenti: Protezione 30,8; Applicazioni 32,3. Restano "diversi" per sfondo, illustrazioni e dimensioni; la struttura coincide. Differenze volute: niente aggiornamenti di app né file di installazione (non li gestiamo), la scansione con Defender si lancia dalla schermata completa e non dal riquadro.

### Nona misura: benvenuto per le sei schermate rimaste (0.1.33)
File grandi (Cerca), Duplicati (Cerca), Cestino (Controlla), Privacy (Controlla), Aggiornamenti (Controlla), Spazio (Analizza) si aprono con lo stesso benvenuto delle altre quattro; il contenuto di prima compare dopo il tasto. Riferimenti fotografati sul Mac: `disordine.png` (Il mio disordine, che contiene File grandi e Duplicati) e `lentespaziale.png` (Lente spaziale). Layout: File grandi 33,9 e Duplicati 37,7 contro Il mio disordine; Spazio 33,3 contro Lente spaziale. Cestino, Privacy e Aggiornamenti non hanno un riferimento diretto (l'app di riferimento li fa dentro Pulizia, Protezione e Applicazioni), quindi per ora non sono misurati. Riferimento finale di Protezione salvato in `protezione-finale.png`: la scansione sul Mac ha trovato 1 minaccia (da guardare a parte, non è del progetto). Resta senza riepilogo a riquadri: File grandi, Duplicati, Cestino, Privacy, Aggiornamenti, Spazio (servirebbe una scansione vera sul Mac per ogni riferimento).

### Decima misura: riepilogo di File grandi e Duplicati, Spazio a bolle (0.1.34)
Riferimenti fotografati sul Mac dopo la scansione (fatta dall'utente): `disordine-risultati.png` (101 file da esaminare: duplicati, file grandi e vecchi, download) e `lentespaziale-risultati.png` (elenco di cartelle a sinistra, mappa a bolle a destra, barra di spazio usato in basso).
File grandi e Duplicati ora sono raggruppati come nell'app di riferimento: dopo il tasto "Cerca" compare un unico riepilogo ("Hai N file da esaminare", "Controlla tutti i file", riquadro grande Duplicati, riquadro largo File grandi); Rivedi apre l'elenco con la selezione e il Cestino di sempre, Indietro torna. Titolo nostro ("File grandi e duplicati"), non quello dell'app di riferimento. Manca il riquadro dei download perché non li analizziamo.
Spazio: a sinistra l'elenco delle cartelle (selezionabili), a destra la mappa a bolle (area proporzionale, calcolata da noi, senza librerie), in basso una barra per ogni disco; resta in sola lettura. Layout: riepilogo 30,4; Spazio 32,7 su 100. Restano "diversi" per sfondo e illustrazioni. Il resto delle schermate non cambia.

### Undicesima modifica: struttura della barra laterale come l'app di riferimento (0.1.35)
Su richiesta dell'utente (non vedeva "Il mio disordine" e "Lente spaziale" sul PC): la barra laterale ora ha "Il mio disordine" (unisce File grandi e Duplicati), "Lente spaziale" (era Spazio) e non ha più "Cestino" come voce a parte (sta dentro Pulizia: riquadro nel riepilogo e categoria nelle tre colonne). Voci: Panoramica, Pulizia, Il mio disordine, Velocità, Protezione, Privacy, Programmi, Aggiornamenti, Lente spaziale, Impostazioni. Tolta la vecchia schermata Cestino e il suo test; il resto invariato. I nomi sono quelli dell'app di riferimento per scelta dell'utente: da rivedere prima di distribuire (vedi brand.md).

### Dodicesima misura: nomi accanto alle voci della barra laterale (0.1.36)
La barra laterale ora mostra il nome accanto a ogni icona (come l'app di riferimento), larga 208 px da 960 px di finestra in su; sotto resta a sole icone (il nome è comunque nell'aria-label). Ordine: Panoramica, Pulizia, Velocità, Protezione, Privacy, Programmi, Aggiornamenti, Il mio disordine, Lente spaziale, Impostazioni (Il mio disordine subito sopra Lente spaziale).
Corretto anche un difetto già presente: il contenitore principale (`.app`) era più grande della finestra (80 px in larghezza, 140 in altezza) e un focus o un clic poteva farlo scorrere, tagliando la barra; ora è `overflow: clip` e non scorre.
Layout a 1200x720 contro i riferimenti (prima della barra larga tra parentesi): Panoramica/l'apertura di riferimento 19,1; benvenuti: Pulizia 34,4 (25,3), Velocità 29,3 (19,6), Protezione 33,4 (25,2), Programmi 28,8 (19,7), Il mio disordine 31,4 (33,9), Lente spaziale 33,9 (33,3); dopo la scansione: Pulizia 30,6, elenco a colonne 25,8, Velocità 38,2, Protezione 31,7, Programmi 30,8, Il mio disordine 29,1, Lente spaziale 30,1. Restano "diversi" per sfondo e illustrazioni.

### Tredicesima modifica: testo e spaziatura (0.1.37)
Scelte dell'utente dopo la pagina di prova (artifact "Prove di testo"): carattere di sistema (Segoe UI Variable su Windows, nessun file in più; prima l'app dichiarava Inter ma non lo includeva), spaziatura ampia come l'app di riferimento (riquadri con 24 px di margine interno, 22 px tra i riquadri, titoli dei riquadri 19/32 peso 500, testo 15/23) e titolo grande grassetto (600, 34/46). La griglia dei riepiloghi passa da tre a due colonne quando il contenuto è più stretto di 820 px (misura del contenitore), così a finestra 1100 px i titoli non vanno a capo.
Nuova funzione: in Lente spaziale cliccando una cartella (elenco o bolla) si apre il suo contenuto, con percorso in alto e tasto Indietro; fino a 12 livelli, limite di 8 secondi per cartella, percorsi validati nel processo principale (solo le sette cartelle conosciute, mai `..` o separatori). Da provare su Windows con le cartelle vere.

## Rimisura completa dopo carattere di sistema e spaziatura ampia (0.1.37, 2026-11-11)
Quattordici schermate (e `protezione-finale`) misurate a 1200x720 contro i riferimenti in `replica/screens/`, stesso stato, stessa finestra. **Punteggio complessivo 85,5 su 100: funzionalità 100,0 (17 contate, must-have 4 su 4), layout medio 27,7.** Verdetto: shippable per le funzioni (tutti i must-have, nessun S1/S2 aperto in `bugs.md`); il layout resta "diverso" per scelta (sfondo, illustrazioni, dimensioni) e non è un requisito.

| Schermata (riferimento) | 0.1.36 | 0.1.37 a 1200 px | 0.1.37 a 1440 px |
|---|---|---|---|
| Panoramica / l'apertura di riferimento | 19,1 | 19,4 | |
| Pulizia, benvenuto | 34,4 | 34,4 | |
| Velocità, benvenuto | 29,3 | 29,3 | |
| Protezione, benvenuto | 33,4 | 33,4 | |
| Programmi, benvenuto | 28,8 | 28,8 | |
| Il mio disordine, benvenuto | 31,4 | 31,4 | |
| Lente spaziale, benvenuto | 33,9 | 33,9 | |
| Pulizia, riepilogo | 30,6 | 24,6 | 31,8 |
| Pulizia, tre colonne | 25,8 | 25,4 | 23,6 |
| Velocità, riepilogo | 38,2 | 30,9 | 28,6 |
| Protezione, riepilogo | 31,7 | 24,4 (finale: 24,6) | 30,0 |
| Programmi, riepilogo | 30,8 | 21,2 | 35,2 |
| Il mio disordine, riepilogo | 29,1 | 22,4 | 29,2 |
| Lente spaziale, risultati | 30,1 | 28,9 | 26,2 |

Letture oneste:
- I benvenuti non cambiano: il testo e la spaziatura toccano i riquadri, non quelle pagine.
- I riepiloghi a 1200 px scendono di 1-9 punti. Causa: con la spaziatura ampia (24 px di margine interno, 22 tra i riquadri) il contenuto a 1200 px (774 px) è sotto la soglia di 820 px e la griglia passa da tre a **due colonne**, scelta fatta apposta perché a 1100 px i titoli andavano a capo e i tasti si impilavano. A 1440 px la griglia è a tre colonne e i punteggi tornano su (Programmi 35,2; Pulizia 31,8; Protezione 30,0; Il mio disordine 29,2). Velocità e le tre colonne di Pulizia scendono anche a 1440 (28,6 e 23,6): lì pesa l'altezza maggiore dei riquadri.
- Il punteggio misura i bordi, quindi un layout più arioso come quello dell'app di riferimento non lo fa salire da solo: la spaziatura ampia era una scelta d'uso, non di punteggio.
- Misure fatte con il nostro schermo a 1200x720 e 1440x900; i riferimenti sono finestre dell'app di riferimento di circa 1200x720 (Prestazioni ritagliata da uno screenshot del desktop, quindi approssimata).

Differenze di comportamento (flusso, loro, nostro, scelta):
- Scansione di Protezione: l'app di riferimento la lancia e la mostra nel riquadro grande; noi la lanciamo dalla schermata completa con Defender. Si tiene (la fa Microsoft Defender, non Bibo).
- Riquadro dei download in Il mio disordine: l'app di riferimento lo ha; noi no (non li analizziamo). Da decidere.
- Lente spaziale: l'app di riferimento permette di selezionare e rimuovere; noi restiamo in sola lettura. Si tiene.
- Cliccare una bolla: apre le sottocartelle in entrambi (fino a 12 livelli, 8 secondi per cartella da noi); da provare su Windows.
- Cestino: nell'app di riferimento è dentro Pulizia; da 0.1.35 anche da noi (voce a parte tolta).

I cinque punti da fare dopo:
1. Provare su Windows l'installer 0.1.37 (bolle apribili, spaziatura ampia, griglia a due colonne).
2. Firma digitale dell'installer (punto 1 aperto), prima di darlo ad altri.
3. Panoramica contro l'apertura di riferimento: è la schermata più lontana (19,4); nel confronto manca l'equivalente del benvenuto con il disco centrale.
4. Rivedere i nomi di sezione "Il mio disordine" e "Lente spaziale" e il marchio (nota in `brand.md`).
5. Decidere se aggiungere il riquadro dei download a Il mio disordine e se riprovare la soglia di 820 px per tornare alle tre colonne anche a 1200 px.

### Quattordicesima modifica: nuova Panoramica "Messa a punto" (0.1.38)
Applicata la bozza approvata dall'utente (artifact "Bozza Panoramica"). La Panoramica ora ha lo stesso schema delle altre schermate: **benvenuto** (robot Bibo in grande nel disco, titolo "Messa a punto", tre voci File inutili / Velocità / Protezione, riga con l'ora dell'ultima messa a punto e lo stato, tasto "Avvia"), **controllo in corso** (robot, barra e passo in corso, tasto "Interrompi" che scarta la scansione) e **riepilogo a riquadri** ("Ho trovato X da liberare", "Controlla tutto", riquadri Pulizia con Rivedi e Pulisci, Velocità e Protezione con Rivedi). "Pulisci" chiede conferma come prima (punto di ripristino, popup dei programmi aperti). Rivedi e "Controlla tutto" aprono Pulizia, Velocità o Protezione già al riepilogo, senza ripassare dal benvenuto. Dopo la pulizia si torna al benvenuto con "X liberati" e "Controlla di nuovo". La mascotte che gira per la pagina si nasconde finché Bibo è in grande.
Tolti dalla Panoramica: titolo "Metti a punto il tuo PC con Bibo", etichette di stato, tre schede con le barre, elenco piatto con "Seleziona tutto". Il **promemoria di manutenzione** ora sta in Impostazioni (dopo la barra delle applicazioni). **Impostazioni è in fondo alla barra laterale**, staccata di almeno 40 px dalle altre voci.
Il riferimento dell'apertura di riferimento è solo la pagina di benvenuto (non ho la schermata dopo la scansione): il riepilogo è una proposta nostra. Non ho rimisurato il layout in questo passaggio.

## Rimisura completa con la nuova Panoramica (2026-11-12, codice dopo 0.1.38)
Quindici schermate a 1200x720 contro i riferimenti in `replica/screens/`, stesso stato. **Punteggio complessivo 85,6 su 100: funzionalità 100,0 (17 contate, must-have 4 su 4), layout medio 27,9 su 14 schermate** (prima, con la 0.1.37: 85,5 e 27,7).

| Schermata (riferimento) | 0.1.37 | ora |
|---|---|---|
| **Panoramica / l'apertura di riferimento, benvenuto** | 19,4 | **26,7** |
| Pulizia, benvenuto | 34,4 | 33,8 |
| Velocità, benvenuto | 29,3 | 28,3 |
| Protezione, benvenuto | 33,4 | 32,2 |
| Programmi, benvenuto | 28,8 | 27,7 |
| Il mio disordine, benvenuto | 31,4 | 31,6 |
| Lente spaziale, benvenuto | 33,9 | 34,1 |
| Pulizia, riepilogo | 24,6 | 24,3 |
| Pulizia, tre colonne | 25,4 | 26,0 |
| Velocità, riepilogo | 30,9 | 29,6 |
| Protezione, riepilogo (finale: 25,0) | 24,4 | 23,8 |
| Programmi, riepilogo | 21,2 | 21,0 |
| Il mio disordine, riepilogo | 22,4 | 21,7 |
| Lente spaziale, risultati | 28,9 | 29,2 |

Letture oneste:
- La Panoramica è la schermata che migliora davvero (+7,3): ora ha lo stesso schema dell'apertura di riferimento (disco con il robot Bibo a sinistra, titolo e tre voci a destra, tasto in basso). Resta "diversa" per sfondo e illustrazione.
- Le altre schermate si muovono di 1 punto circa in su o in giù: è rumore del metodo (misura di bordi), non un cambiamento. Impostazioni in fondo alla barra non incide.
- Misure ripetibili: due scatti di fila danno gli stessi numeri (unica eccezione, le tre colonne di Pulizia: 25,7 e 25,0).
- Riferimento dell'apertura di riferimento: solo la pagina di benvenuto. Il riepilogo e la schermata di controllo della nuova Panoramica non hanno un riferimento fotografato e non sono misurati.

### Due difetti trovati nella 0.1.38 durante la rimisura (corretti nel codice, non ancora in un installer)
1. Dopo aver lasciato la Panoramica, la mascotte mobile ricompariva tagliata in alto a sinistra per qualche secondo: nascosta con `display: none` calcolava la posizione con larghezza zero. Ora si nasconde con `visibility: hidden`.
2. Nel robot grande del benvenuto gli occhi erano doppi (quelli normali e quelli felici): le regole valevano solo dentro `.bibo`. Ora il robot grande ha le sue regole (`.bibo-big`), con occhi normali e le stesse animazioni, ferme se l'utente ha "riduci animazioni".
Test aggiunto: la mascotte, dopo aver lasciato la Panoramica, sta dentro la finestra. Tutti i 9 test del flusso passano; il giro completo non è stato rifatto.
L'installer `Bibo Tune-0.1.38-win-x64.exe` contiene ancora i due difetti.

### Installer 0.1.39 (2026-11-12)
Contiene la Panoramica "Messa a punto" della 0.1.38 e le due correzioni trovate nella rimisura: la mascotte mobile non resta più tagliata dopo aver lasciato la Panoramica (`visibility: hidden` al posto di `display: none`) e il robot grande ha occhi normali e animazioni (`.bibo-big`). Controlli: 60 test e2e su 60, 29 test di sistema su 29, test nuovo sulla posizione della mascotte. Misure invariate rispetto a quelle sopra (parità 85,6; layout 27,9). Da provare su Windows.

### Opzione Versione in Impostazioni (0.1.40, 2026-11-12)
Nuova sezione **Versione** in Impostazioni (la prima, sotto il titolo): due carte, "Recente · 0.1.40" e "Classica · 0.1.27", e il tasto "Applica e riapri" (spento se la versione scelta è già in uso). La classica è **l'interfaccia vera della 0.1.27**, recuperata dall'installer di allora (copiato in `Vecchia versione/`): estratta con il 7-Zip che electron-builder ha già in cache (nessun programma installato), `app.asar` aperto con `asar`, e `dist/` messa in `public/classic/`, quindi in `dist/classic/` nell'app. Il motore (pulizia, disinstallazione, registro) è unico: la classica usa quello di adesso. Controllato prima: tutte le 33 chiamate `window.bibo.*` e i 35 canali IPC della 0.1.27 esistono ancora nella versione attuale.
Come si cambia: dalla sezione (la finestra si ricarica con l'altra interfaccia, la scelta si ricorda in `prefs.json` come `uiVersion`), dal menu dell'icona (voce "Versione 0.1.27" nella recente, "Versione recente (0.1.40)" nella classica, che cambia subito) e con Ctrl+Maiusc+V in entrambe. La classica non conosce la sezione, quindi il ritorno sta fuori dalla finestra.
Nella classica: barra a sole icone, Panoramica con le tre schede, elenchi piatti, File grandi / Duplicati / Cestino / Spazio a parte, niente benvenuti né riepiloghi né cartelle apribili in Lente spaziale; il promemoria sta nella Panoramica, come allora. Resta congelata: le modifiche future riguardano solo la recente.
Codice: `electron/ui-version.cjs` (logica pura: normalize, isValid, other, indexFile, menuLabel, isToggleKey), `electron/main.cjs` (loadUi, setUiVersion, canali `ui:version:get/set`, `before-input-event`, voce di menu), `electron/preload.cjs`, `src/data/api.js`, `src/screens/Others.jsx` (sezione), `public/classic/`. Peso: +312 KB nell'installer.
Test: 7 unit test (36 in tutto) e 2 e2e nuovi (62 in tutto): la sezione, la selezione e l'applicazione, il caricamento reale dell'interfaccia classica a `/classic/index.html` con la sua barra e la sua Panoramica, e il ritorno a quella recente.
**Non provato**: il passaggio vero tra le due finestre in Electron (ricarica della finestra, voce di menu, scorciatoia) si verifica solo su Windows. Sul Mac ho provato che l'interfaccia classica si carica e funziona con i dati di prova, e che il pacchetto la contiene.

### Ritorno dalla versione classica (0.1.41, 2026-11-12)
L'utente ha notato che, applicata la 0.1.27, non c'era modo di tornare indietro: l'aveva provata nel browser/anteprima di Claude, dove non esistono né l'icona nella barra né la scorciatoia gestita dall'app (il ritorno della 0.1.40 stava solo nel processo principale di Electron). Errore mio: avevo scritto che Ctrl+Maiusc+V funzionava "in entrambe", ma valeva solo per l'app Windows.
Ora il ritorno sta dentro la finestra: `public/classic/return.js` (non fa parte della 0.1.27, lo dice il commento in testa) aggiunge un pulsante "‹ Versione recente" in alto a sinistra, nella zona libera. Nell'app chiede al processo principale `setUiVersion('recent')`; nel browser apre `../`. Nel browser vale anche Ctrl+Maiusc+V (non nell'app, dove lo gestisce già Electron: niente doppio cambio). Tre vie in tutto nell'app Windows: pulsante, menu dell'icona, scorciatoia.
Test: 1 unit test (37 in tutto) e 2 e2e (63 in tutto): pulsante dalla classica e scorciatoia nel browser. Controllato a occhio a 1100 px: il pulsante non copre niente.
Installer `Bibo Tune-0.1.41-win-x64.exe`: 63 e2e + 37 unit verdi, `return.js` dentro l'app. Non provato su Windows.

### Nomi di sezione cambiati (0.1.42, 2026-11-12)
Dopo la revisione del marchio (vedi `brand.md`) la barra laterale ha due nomi nuovi, tutti nostri: **"Caos"** (era "Il mio disordine", File grandi + Duplicati) e **"Mappa del disco"** (era "Lente spaziale", elenco di cartelle + mappa a bolle; l'icona passa dalla lente al grafico a torta). Il resto delle schermate non cambia. Le sezioni sopra, nel testo storico, usano ancora i nomi di allora. Barra attuale: Panoramica, Pulizia, Velocità, Protezione, Privacy, Programmi, Aggiornamenti, Caos, Mappa del disco, Impostazioni. I riferimenti usati per le misure di layout non sono nel repository.

**Aggiornamento 0.1.43:** su richiesta dell'utente la voce "File e duplicati" è stata rinominata **"Caos"**; "Mappa del disco" resta. Barra attuale: Panoramica, Pulizia, Velocità, Protezione, Privacy, Programmi, Aggiornamenti, Caos, Mappa del disco, Impostazioni.

### Feedback dalla prova su Windows e correzioni (0.1.44, 2026-11-12)
Prova dell'utente sull'installer 0.1.43: funzionano Pulizia (benvenuto, riepilogo, tre colonne, un elemento alla volta), il benvenuto e il riepilogo di Velocità, Protezione e Programmi, Caos, la nuova Panoramica ("Interrompi", "Pulisci" dal riquadro), la barra con i nomi, il carattere di sistema e Impostazioni in fondo. Due segnalazioni, entrambe trattate:
1. **Versione classica senza la voce Versione in Impostazioni.** Nella 0.1.27 l'opzione non esiste, quindi il ritorno stava solo nel pulsante, nel menu dell'icona e in Ctrl+Maiusc+V. Ora `public/classic/return.js` inserisce la sezione **Versione** nella pagina Impostazioni della classica (le stesse due carte e il tasto "Applica e riapri", spento finché non si sceglie Recente). Si aggancia al titolo "Impostazioni" della 0.1.27 con un osservatore del DOM, così resta anche quando React ridisegna la pagina (provato con il cambio di tema). Test e2e e di unità aggiunti.
2. **Grafica di Mappa del disco.** Difetto trovato: la barra del percorso era un elemento `nav` e prendeva gli stili della barra laterale (colonna centrata, margini di 56 px, tasti da 48 px): compariva come un grosso riquadro. Introdotto con le cartelle apribili (0.1.37). Ora è un contenitore con ruolo "navigazione" e si vede una riga sola; un test controlla che la barra sia più bassa di 80 px. Il resto della grafica (mappa a bolle, elenco, dischi) non è stato toccato: aspetto indicazioni dell'utente.
Installer 0.1.44: 64 test e2e e 37 di sistema verdi. Da provare su Windows.


### Versioni 0.1.45 – 0.1.48 (2026-11-13)
Richieste dell'utente dopo la prova della 0.1.44. Da provare su Windows, salvo dove indicato.
1. **Tasto Indietro uguale in tutta l'app (0.1.45).** Componente `BackButton` (`src/components/ui.jsx`): tasto tondo "‹ Indietro" sopra il titolo in Pulizia, Velocità, Protezione, Programmi, Caos e Mappa del disco; in Pulizia anche "Ricomincia" ha lo stesso aspetto. Scorciatoie Esc e Alt+← (non scattano con una finestra aperta o in un campo di testo). Test e2e aggiunto; il tasto "‹ Versione recente" della classica non è cambiato.
2. **Scelta Installata o Portatile all'avvio (0.1.46–0.1.48).** `build/installer.nsh`: all'avvio dell'installer una finestra chiede Sì = Installata, No = Portatile. In modalità portatile i file vengono copiati senza collegamenti, voce in "App e funzionalità" e disinstallatore, e si scrive `portable.txt`. Provata la 0.1.46 (la scelta funzionava ma stava dopo la cartella: ora è all'inizio, come chiesto); la finestra all'avvio non è ancora provata su Windows.
3. **Mappa del disco (0.1.47–0.1.48).** Il pannello delle bolle ha altezza fissa (420 px) e resta fermo mentre l'elenco scorre. Ogni bolla ha il suo nome (accorciato con "…"), le grandi anche la dimensione, tooltip con nome e dimensione; raggio minimo 34. Le bolle seguono la cartella aperta (test e2e che lo verifica).
Test: 65 e2e (+ il controllo sulle bolle) e 37 di sistema verdi alla 0.1.45; dopo, rieseguiti solo i test di Mappa del disco. Installer 0.1.48, non firmato.

### Esito della prova su Windows della 0.1.48 e correzione 0.1.49 (2026-11-13)
Prova dell'utente sull'installer 0.1.48: **funzionano** la domanda Installata/Portatile all'avvio e le bolle con i nomi di Mappa del disco. Una segnalazione: dopo l'installazione il programma compariva come "Electron" invece che "Bibo Tune".
- **Causa:** con `signAndEditExecutable: false` electron-builder non scrive le informazioni del file, quindi `Bibo Tune.exe` conservava quelle di Electron (descrizione, nome prodotto) che Windows mostra in Gestione attività, nelle proprietà e nelle app aperte.
- **Correzione (0.1.49):** `build/afterPack.cjs` scrive, oltre all'icona, le informazioni di versione (FileDescription, ProductName, InternalName, OriginalFilename, CompanyName, copyright, versione). Verificato leggendo di nuovo l'exe dopo la build: tutti i campi dicono "Bibo Tune". Il nome nel menu Start e il collegamento erano già "Bibo Tune". Da provare su Windows.

### Versioni 0.1.49 – 0.1.52: nome "Bibo Tune" invece di "Electron" (2026-11-13)
Dopo la prova della 0.1.48 (domanda Installata/Portatile e bolle con i nomi: funzionano) l'utente ha segnalato che il programma compariva come "Electron" nella ricerca di Windows.
- **0.1.49:** `build/afterPack.cjs` scrive nel `Bibo Tune.exe` le informazioni di versione (descrizione, nome prodotto, azienda, copyright). Verificato rileggendo l'exe. Non bastava.
- **0.1.50–0.1.51:** pulizia del nome ricordato da Windows (MuiCache) e nome nel Pannello di controllo. Richiesta dell'utente: **solo "Bibo Tune"**, senza numero (la versione sta nella colonna Versione): `DisplayName "Bibo Tune"` nello script e `uninstallDisplayName: ${productName}`. Provato dall'utente: a posto.
- **Causa vera di "Electron" (0.1.52):** nel menu Start c'era `Electron.lnk` (creato l'11/11 da una versione vecchia, descrizione "Electron", punta a `C:\Program Files\Bibo Tune\Bibo Tune.exe`). L'installer ricordava il nome nel registro e lo riusava a ogni reinstallazione. Ora `build/installer.nsh` scrive `ShortcutName "Bibo Tune"`, cancella `Electron.lnk` (menu Start dell'utente e del sistema, desktop) e crea `Bibo Tune.lnk` con l'identificativo dell'app; in modalità portatile non crea collegamenti. L'utente ha sistemato il PC a mano con un comando PowerShell e ora la ricerca mostra "Bibo Tune"; la 0.1.52 da provare.
- **Test:** nuovo `test/installer.test.cjs` (parte con `npm test`): controlla collegamento "Bibo Tune", rimozione di quello "Electron", nome nel Pannello di controllo e informazioni dell'exe. 40 test di sistema verdi; gli e2e non sono stati rieseguiti (interfaccia invariata dalla 0.1.48).
