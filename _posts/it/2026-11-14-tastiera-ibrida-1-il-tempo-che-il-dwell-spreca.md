---
ref: kite-hybrid-keyboard-1
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "La tastiera ibrida di Kite (1/4): il tempo che il dwell spreca"
description: Prima di quattro parti sulla nuova tastiera a sguardo di Kite. Il banco che confronta il dwell fisso con una tastiera ibrida, l'idea di contare il tempo dalla fine della saccade, la prima sessione reale con il 19% di selezioni sbagliate, le quattro regole ricavate dagli errori e il replay che le misura.
tags: [eye-tracking, caa, tastiera-virtuale, dwell-time, saccadi, replay]
---

Questa è la **prima di quattro parti** sulla nuova tastiera a sguardo di [Kite](/ricerche/kite/), il mio
strumento aperto di Comunicazione Aumentativa e Alternativa (CAA): una tastiera che non seleziona più
soltanto con il dwell time. Qui racconto il banco di prova, l'idea da cui parte la tastiera ibrida, i
primi errori e come li ho misurati. La
[parte 2](/diario/tastiera-ibrida-2-la-lingua-come-informazione/) tratta la lingua come informazione:
modelli di lingua, tempi diversi per lettere diverse, correttore, frasi e voce. La
[parte 3](/diario/tastiera-ibrida-3-la-pupilla-la-bci-e-le-misure/) tratta la pupilla, che cosa intendo
per «BCI ibrida» e come si misura il confronto. La
[parte 4](/diario/tastiera-ibrida-4-le-occhiate-di-ricerca/) tratta le occhiate di ricerca, la prima
causa di errore, e i limiti dell'intera serie.

Nella [voce su Tobii Race](/diario/tobii-race-un-gioco-per-mettere-alla-prova-il-4c/) avevo promesso di
approfondire la letteratura per la nuova tastiera. Mantengo la promessa in modo un po' diverso: invece di
un elenco di articoli, racconto la tastiera che ne è nata e il banco con cui la misuro. Gli argomenti di
quell'elenco che nel banco non ci sono li riprendo in fondo, in «Cosa ho scelto e cosa ho rimandato».

## Il banco di prova

Il banco si chiama **tobii4c-hybridbci**. È un programma per GNU/Linux scritto in Go, con una finestra
X11; per ora il repository non è pubblico. Mette a confronto due modi di scrivere con lo sguardo, **sullo
stesso compito e con le stesse metriche**:

- **A, dwell fisso**: la vecchia tastiera di Kite. Si fissa un tasto per 1 s e il tasto si attiva.
- **B, ibrida**: la tastiera nuova. Il tasto si attiva poco dopo che l'occhio vi si è fermato, con un
  tempo che dipende dalla lettera.

Il compito è copiare frasi italiane di cinque parole su una tastiera QWERTY a schermo di 27 tasti: le 26
lettere su tre righe sfalsate e la barra spaziatrice. Sopra c'è una barra di modifica con tre
suggerimenti, **cancella** e **parla**; nelle prime tre sessioni del 6 novembre non c'era ancora.

I dati arrivano dal driver `tobii4c-linux` delle voci precedenti, in pacchetti UDP nel formato T4CG v2,
circa 90 al secondo: sguardo filtrato dal firmware e non filtrato, pupille, posizione degli occhi,
presenza. Il banco **legge soltanto**: non manda nessun comando al tracciatore.

| | A, dwell fisso | B, ibrida |
| --- | --- | --- |
| Quando parte il conteggio | quando lo sguardo entra nel tasto | alla fine della saccade che porta sul tasto |
| Quale sguardo usa | filtrato dal firmware del 4C | non filtrato, per riconoscere saccadi e fissazioni |
| Tempo richiesto | 1 s per tutti i tasti | da 120 a 700 ms, secondo la probabilità della lettera |
| Area dei tasti | rettangoli fissi | si allarga in modo invisibile verso i tasti probabili ([parte 2](/diario/tastiera-ibrida-2-la-lingua-come-informazione/)) |
| Correttore e suggerimenti | no | sì ([parte 2](/diario/tastiera-ibrida-2-la-lingua-come-informazione/)) |
| Pupilla | registrata | registrata e usata per allungare i tempi ([parte 3](/diario/tastiera-ibrida-3-la-pupilla-la-bci-e-le-misure/)) |

Ogni sessione resta su disco, campione per campione. I numeri di questa voce vengono da quei file, dal
README del banco e dal suo codice; lo strumento interno `replay` lo presento più avanti. Il nome contiene
«BCI», ma un tracciatore oculare non è una
[Brain Computer Interface](/diario/cos-e-una-brain-computer-interface/): perché il banco si chiami così
lo spiego nella [parte 3](/diario/tastiera-ibrida-3-la-pupilla-la-bci-e-le-misure/).

## Il riferimento: la condizione A

La condizione A è la tastiera a dwell fisso della
[voce sul dwell time](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/): là trovate il tocco di
Mida ([Jacob, 1991](#riferimenti)), il compromesso tra velocità ed errori, le doppie e la fatica. Non li
ripeto. Qui A serve da metro: tutto ciò che B guadagna o perde si misura contro di lei.

> **Nel nostro banco.** A riproduce la vecchia tastiera nei dettagli: 27 tasti con l'8% di spazio tra
> l'uno e l'altro, sguardo filtrato dal firmware, 1 s di permanenza, uscite fino a 100 ms che non
> azzerano il conteggio, ammiccamenti fino a 300 ms che lo sospendono, una ripetizione che chiede un altro
> secondo intero. Nella prima sessione reale con la QWERTY, il 6 novembre, A ha fatto 70 selezioni senza
> nessun errore, a **35,6 caratteri al minuto** (car/min). Il tempo medio sul tasto prima dello scatto è
> stato di 1010 ms, quello tra una selezione e la successiva di 1,68 s. Il dwell di 1 s permetterebbe fino
> a 60 tasti al minuto: la differenza è il tempo per cercare la lettera e portarci l'occhio.

## Che cosa fa l'occhio prima di fermarsi su un tasto

Fovea, saccadi, fissazioni, microsaccadi e la relazione tra ampiezza, durata e velocità delle saccadi
(la *main sequence*) sono nella
[voce su come funziona l'occhio](/diario/come-funziona-l-occhio-e-il-gaze-tracking/). Qui aggiungo
quattro proprietà che quella voce non tratta e che pesano su una tastiera veloce.

**La latenza.** Quando compare un bersaglio nuovo, l'occhio non parte subito: negli adulti sani il tempo
di reazione di una saccade guidata dalla vista è di circa 200 ms ([Vikesdal e Langaas, 2016](#riferimenti)).
Su una tastiera il bersaglio successivo spesso si conosce già, quindi lo prendo come un ordine di
grandezza. La mia lettura è che una parte del tempo per lettera stia qui, prima del salto, dove nessun
meccanismo di selezione può intervenire.

**La soppressione saccadica.** Attorno a una saccade la vista perde sensibilità in modo selettivo. Per
stimoli brevi, di bassa frequenza spaziale e definiti dalla luminosità, la sensibilità comincia a calare
circa 25 ms prima dell'inizio della saccade, tocca il minimo all'inizio e torna normale circa 50 ms dopo.
I dettagli fini restano visibili, e gli stimoli che differiscono solo per colore non vengono soppressi, o
quasi ([Binda e Morrone, 2018](#riferimenti)). Ne ricavo un principio semplice: durante il salto la
persona non sta leggendo i tasti che attraversa, quindi quei tasti non devono accumulare tempo.

**Il salto non si corregge in volo, e spesso cade corto.** Le saccadi di solito non atterrano
esattamente sul bersaglio. Cadere corti (*undershoot*) è più frequente che andare oltre, e lo diventa
sempre di più quanto più il salto è lungo; spesso serve allora una seconda saccade, più piccola, detta
**correttiva**. In uno studio del 2013 la saccade principale non cambiava con le informazioni visive
raccolte durante il movimento ([Tian et al., 2013](#riferimenti)).

**La correttiva arriva presto.** Becker e Fuchs ([1969](#riferimenti)) osservarono che le correttive
partivano dopo circa 130 ms, sia con il bersaglio visibile sia al buio: troppo presto per essere guidate
da ciò che l'occhio vede. Da qui l'idea che saccade principale e correttiva siano programmate insieme.
Riporto questo risultato attraverso la sintesi di Tian e colleghi ([2013](#riferimenti)): l'articolo
originale non sono riuscito a leggerlo per intero.

Per una tastiera vuol dire che, dopo un salto lungo, l'occhio può fermarsi per una frazione di secondo sul
tasto accanto a quello voluto. Un dwell di 1 s non se ne accorge, uno di 120 ms sì.

> **Nel nostro banco.** Secondo le note del banco, le fissazioni spontanee durante il lavoro durano tra
> 133 e 344 ms (primo e terzo quartile), con una mediana di 211 ms. Nelle sessioni reali le saccadi di
> oltre 8° verso il tasto poi selezionato coprono in mediana il 93–95% della distanza (guadagno 0,93–0,95,
> scarto interquartile 0,15–0,18). Circa metà dei primi atterraggi cade sul tasto vicino, quasi sempre dal
> lato da cui arriva lo sguardo, e ci resta circa 200 ms prima della correttiva: molto più dei 120 ms
> minimi di B. Vale anche il confronto opposto: 120 ms è meno della mediana delle fissazioni spontanee,
> ed è il motivo per cui le occhiate di ricerca sono il rischio principale
> ([parte 4](/diario/tastiera-ibrida-4-le-occhiate-di-ricerca/)).

## Il 4C in numeri

Il metodo pupilla–riflesso corneale, accuratezza e precisione, frequenza e latenza sono spiegati nella
[voce sull'occhio](/diario/come-funziona-l-occhio-e-il-gaze-tracking/); il driver e le sue misure senza
persona nella [voce dell'11 novembre](/diario/tobii-4c-su-linux-il-driver-alla-prova/). Qui riporto solo
i numeri del banco, con una persona davanti.

> **Nel nostro banco.**
>
> | Grandezza | Valore | Da dove viene |
> | --- | --- | --- |
> | Distanza degli occhi dallo schermo | circa 70 cm | note del banco; mediane di 72–78 cm nei file delle tre sessioni del 6 novembre |
> | Schermo | 700 × 390 mm, 1920 × 1080 pixel | file delle sessioni |
> | Frequenza | 90,0–90,1 campioni al secondo | conteggio sui tre file; l'11 novembre, senza nessuno davanti, il driver dava 89,2 Hz |
> | Precisione, sguardo non filtrato | 0,27° | note del banco |
> | Precisione, sguardo filtrato dal firmware | 0,19° | note del banco |
> | Ritardo dello sguardo filtrato | circa 30 ms | note del banco |
> | Sguardo valido, pupilla valida | 88%, 83% dei campioni | note del banco |
>
> La precisione è lo scarto quadratico medio (RMS) tra campioni consecutivi mentre l'occhio è fermo. A
> 90 Hz due campioni distano 11 ms: uno scarto di 0,27° equivale a una velocità apparente di circa
> 24 °/s, prodotta dal solo rumore. Il filtro del firmware riduce il rumore ma fa arrivare lo sguardo
> circa 30 ms dopo. Per questo B riconosce saccadi e fissazioni sullo sguardo non filtrato, mentre A usa
> quello filtrato, come la vecchia tastiera.
>
> Bones ha ricontrollato questi numeri sui file delle tre sessioni del 6 novembre, con un conto rapido.
> Il ritardo torna (2–3 campioni, 22–33 ms); sguardo valido (98–99,7%) e precisione (circa 0,19° e 0,15°)
> vengono migliori, e le durate delle fissazioni non coincidono. Le note devono riferirsi a un'altra
> registrazione. [DA COMPLETARE: quale registrazione ha prodotto i numeri delle note del banco (88% di
> sguardo valido, 83% di pupilla valida, precisione 0,27° e 0,19°, fissazioni di 133–344 ms) e quanto
> durava.]

## Riconoscere saccadi e fissazioni nel segnale

Il tracciatore non dice «adesso è una saccade»: manda punti, uno ogni 11 ms. Salvucci e Goldberg
([2000](#riferimenti)) hanno ordinato gli algoritmi che separano i salti dalle pause in tre famiglie:

- **per velocità**: i punti di una fissazione si muovono piano, quelli di una saccade in fretta. Il più
  semplice è **I-VT** (*identification by velocity threshold*): sopra una soglia di velocità è saccade,
  sotto è fissazione. Nella stessa famiglia c'è **I-HMM**, un modello probabilistico a due stati;
- **per dispersione**: i punti di una fissazione restano vicini tra loro. **I-DT** (*identification by
  dispersion threshold*) chiama fissazione una finestra di durata minima in cui i punti restano entro una
  certa dispersione, quindi deve aspettare che la finestra sia piena;
- **per area**: si contano solo i punti dentro aree di interesse decise in anticipo (**I-AOI**).

Tobii Race usa un classificatore per velocità con soglie fisse
([voce sul gioco](/diario/tobii-race-un-gioco-per-mettere-alla-prova-il-4c/)). Ma il rumore cambia con il
tracciatore e con la persona: una soglia troppo bassa scambia il rumore per saccadi, una troppo alta perde
le saccadi piccole.

Nyström e Holmqvist ([2010](#riferimenti)) propongono di **ricavare la soglia dai dati**. Si parte da un
valore tra 100 e 300 °/s; si calcolano media e deviazione standard delle velocità sotto la soglia, e la
soglia nuova diventa la media più sei deviazioni standard; si ripete finché cambia di meno di 1 °/s.
L'inizio della saccade si cerca con una soglia più bassa, la media più tre deviazioni standard; la fine
con una soglia che tiene conto anche del rumore appena prima della saccade. Lo stesso algoritmo riconosce
le **glissate**, piccole oscillazioni alla fine della saccade, che gli autori trovano in circa metà delle
saccadi.

La velocità, infine, va misurata in gradi di angolo visivo al secondo, non in centimetri al secondo: lo
stesso centimetro sullo schermo vale circa 0,95° a 60 cm e circa 0,72° a 80 cm. La conversione è spiegata
nella [voce sull'occhio](/diario/come-funziona-l-occhio-e-il-gaze-tracking/).

> **Nel nostro banco.** Il rilevatore è un I-VT con la soglia adattiva di Nyström e Holmqvist, calcolata
> in tempo reale, campione per campione:
>
> 1. La velocità è in gradi al secondo, calcolata con la posizione reale degli occhi fornita dal driver,
>    sullo sguardo **non filtrato**.
> 2. Si misura su due intervalli, 22 ms, invece che su uno: il rumore pesa la metà, e una saccade di
>    30 ms supera comunque la soglia.
> 3. La soglia di picco è la media più sei deviazioni standard della velocità durante le fissazioni. Media
>    e varianza non si ricalcolano su tutta la registrazione, ma si aggiornano di continuo, con una memoria
>    di circa 2 s. La soglia resta tra 60 e 300 °/s; all'avvio vale 100 °/s.
> 4. La saccade finisce quando la velocità scende sotto la media più tre deviazioni standard. Da
>    quell'istante parte la fissazione nuova, ed è da lì che B conta il tempo.
> 5. Le microsaccadi sotto 1° non spezzano la fissazione; un buco di oltre 100 ms nei dati la chiude. Una
>    fissazione diventa **stabile** dopo almeno tre campioni con una dispersione entro 1°, e solo allora B
>    può selezionare.
>
> Un test automatico costruisce una saccade sintetica di 10° in 43 ms, con 0,25° di rumore. Il
> rilevatore la trova una volta sola, fa partire la fissazione **entro 23 ms** dall'atterraggio vero,
> circa due campioni, e la dichiara stabile entro 60 ms. Con un rumore da 0,15° a 0,5° per 10 s non trova
> false saccadi. Bones ha rieseguito questi test il 14 novembre: passano. I 23 ms però valgono su dati
> sintetici: su dati reali l'atterraggio vero non lo conosce nessuno.
>
> Sul 4C reale la soglia si è assestata al **minimo di 60 °/s**, contro picchi di oltre 300 °/s: nei file
> delle tre sessioni del 6 novembre vale 60 °/s in oltre il 95% dei campioni di fissazione. La mia lettura
> è che, con questa persona e questo tracciatore, il rumore sia abbastanza basso da lasciare inattiva la
> parte adattiva: in pratica è un I-VT a 60 °/s. L'adattamento dovrebbe servire con segnali più rumorosi,
> da verificare con altre persone. Il rilevatore non distingue le glissate e non ha una classe per
> l'inseguimento lento: conosce solo fissazione, saccade e sguardo perso.

## L'idea centrale: contare dalla fine della saccade

### Lo stato dell'arte, in breve

Una rassegna del 2002 ricostruiva già vent'anni di sistemi per scrivere con lo sguardo
([Majaranta e Räihä, 2002](#riferimenti)). Secondo Mott e colleghi ([2017](#riferimenti)) le tastiere a
dwell restano le più usate nella pratica. Le alternative si possono dividere in tre gruppi.

- **Il dwell adattivo.** Mott e colleghi cambiano il dwell di ogni tasto secondo la probabilità che sia il
  prossimo e secondo la sua posizione: i tasti improbabili diventano più lenti, quelli probabili più
  veloci, e il tempo minimo dei tasti probabili scende poco alla volta mentre si scrive, «a cascata», per
  non spezzare il ritmo. Con 17 persone senza disabilità, in otto sessioni, la loro tastiera è arrivata in
  media a 12,39 parole al minuto (WPM), contro 10,62 con il dwell fisso; con cinque persone con sclerosi
  laterale amiotrofica (SLA), a 9,51 WPM. Gli autori riassumono così il limite del dwell fisso: per quanto
  in fretta l'occhio passi da un tasto all'altro, deve restare fermo finché il tempo non è scaduto.
- **La scrittura senza dwell** ([Kristensson e Vertanen, 2012](#riferimenti)) e le **interfacce continue**
  come Dasher ([Ward e MacKay, 2002](#riferimenti)), descritte con i loro numeri nella
  [voce sull'occhio](/diario/come-funziona-l-occhio-e-il-gaze-tracking/).
- **Altri canali** accanto allo sguardo, come la testa o i modelli di lingua di grandi dimensioni: ne
  parlo in «Cosa ho scelto e cosa ho rimandato».

### Dove va il tempo di una lettera

Prima di cambiare il meccanismo ho guardato dove finisce il tempo. Nella prima sessione reale con la
QWERTY, descritta più avanti, il riepilogo dell'intera sessione dà, per ogni selezione:

| | A, dwell fisso | B, prima versione |
| --- | ---: | ---: |
| Tempo medio tra due selezioni | 1,68 s | 0,86 s |
| di cui fermi sul tasto prima dello scatto | 1,01 s | 0,25 s |
| resto: cercare la lettera, spostare l'occhio, atterrare | 0,67 s | 0,61 s |

La terza riga è una sottrazione. Il tempo fuori dal dwell è quasi lo stesso nelle due condizioni: la mia
lettura è che il guadagno di B venga dal tempo passato fermi sul tasto, non da un occhio più svelto. È una
sessione sola, con una persona sola, e nella colonna B ci sono anche le selezioni sbagliate: la prendo
come un'indicazione.

### L'idea

In A il secondo comincia quando lo sguardo filtrato entra nel tasto. In B il conteggio parte dalla
**fine della saccade** che porta l'occhio sul tasto, riconosciuta sullo sguardo non filtrato, e il tempo
richiesto è breve.

Perché proprio da lì: la fine della saccade è il momento in cui l'occhio arriva e comincia a guardare il
tasto. Quello che succede prima, la latenza e il volo, non dice niente sull'intenzione di selezionare
quel tasto. In più, usando lo sguardo non filtrato, B non paga i circa 30 ms del filtro del firmware.
Nelle fonti che ho letto non ho trovato un confronto diretto tra i due modi di far partire il conteggio;
non vuol dire che non esista.

Il prezzo è evidente. Con tempi così brevi il tocco di Mida torna alla scala di una singola fissazione:
una fissazione di ricerca su un tasto probabile può bastare a farlo scattare. Le occhiate di ricerca sono
il limite naturale di questo approccio, e hanno una parte tutta loro, la
[parte 4](/diario/tastiera-ibrida-4-le-occhiate-di-ricerca/).

> **Nel nostro banco.**
>
> | Parametro | Valore |
> | --- | --- |
> | Tempo minimo, lettera molto probabile (`-tmin`) | 120 ms |
> | Tempo massimo, lettera improbabile (`-tmax`) | 700 ms |
> | Tempo tra i due estremi | secondo la probabilità della lettera: [parte 2](/diario/tastiera-ibrida-2-la-lingua-come-informazione/) |
> | Sguardo ambiguo tra due tasti | il tempo si allunga se la probabilità del tasto guardato scende sotto 0,95 |
> | Condizione per scattare | fissazione stabile e tempo richiesto trascorso dalla fine della saccade |
> | Pupilla | può allungare tutti i tempi fino al 50%: [parte 3](/diario/tastiera-ibrida-3-la-pupilla-la-bci-e-le-misure/) |

## La prima sessione reale

La prima sessione con la QWERTY è del **6 novembre, alle 11:57**: una persona a circa 70 cm dallo
schermo, cinque blocchi da cinque parole. Il primo è un blocco B lanciato da solo; poi vengono la
calibrazione della pupilla e i quattro blocchi del protocollo, nell'ordine A, B, B, A. Il compito era
quello che chiamo «rigido»: una lettera sbagliata non entra nel testo, si conta come errore e si deve
selezionare quella giusta. B era la **prima versione**: nessuna delle regole descritte più avanti, un
modello di lingua piccolo, di 544 parole, la ripetizione di una lettera dopo 700 ms sullo stesso tasto e
la modulazione dei tempi dalla pupilla accesa.

I numeri che seguono sono il **riepilogo dell'intera sessione**, cioè di tutti e cinque i blocchi, come
li somma il banco. È su questi blocchi che sono state costruite l'analisi degli errori e il replay.

| Intera sessione | A, dwell fisso | B, prima versione |
| --- | ---: | ---: |
| Blocchi | 2 | 3 |
| Selezioni | 70 | 123 |
| Selezioni sbagliate | 0 | 23 (19%) |
| Velocità | 35,6 car/min | 56,9 car/min |
| Tempo medio sul tasto prima dello scatto | 1010 ms | 247 ms |

Sull'intera sessione B è stata più veloce di circa il 60%, ma **una selezione su cinque era sbagliata**:
così non si può comunicare. Il blocco B iniziale, quello fuori dal protocollo, contiene da solo 10 dei 23
errori. Contando solo i quattro blocchi del protocollo i numeri cambiano: il confronto tra A e B in quei
blocchi, l'ipotesi di progetto sulla velocità e come la si mette alla prova sono nella
[parte 3](/diario/tastiera-ibrida-3-la-pupilla-la-bci-e-le-misure/). Restano una persona e una sessione:
nessuno di questi numeri conferma un'ipotesi.

Poco prima, alle 11:45, c'era stata una sessione più breve con i tasti in ordine alfabetico: A a
24,8 car/min con 1 errore su 34 selezioni, B a 39,1 car/min con 9 errori su 38. La cito perché entra nel
replay.

### Perché sbagliava

Le note del banco riportano una ricostruzione dei 23 errori fatta sui campioni registrati:

| Causa | Errori | Che cosa succedeva |
| --- | ---: | --- |
| Occhiate di ricerca | 10 | lo sguardo si ferma su un tasto mentre cerca la lettera, e il tasto scatta: è il tema della [parte 4](/diario/tastiera-ibrida-4-le-occhiate-di-ricerca/) |
| Atterraggio corto | 6 | dopo una saccade lunga l'occhio cade sul tasto vicino e ci resta circa 200 ms prima della correttiva; il selettore scattava prima |
| Lettere ripetute o scivolate | 5 | in 4 casi restare sul tasto oltre 700 ms ha prodotto una doppia non voluta; in 1 lo sguardo è scivolato sul tasto accanto nella stessa fissazione |
| Espansione predittiva | 2 | sguardo sul bordo o dentro il tasto giusto, assegnato al vicino più probabile: ne parlo nella [parte 2](/diario/tastiera-ibrida-2-la-lingua-come-informazione/) |

Cinque delle dieci occhiate di ricerca sono arrivate a catena, subito dopo un altro errore.

## Le quattro regole

Dalle cause d'errore sono nate quattro regole. Ognuna è un parametro del selettore, e tre si regolano
anche dalla riga di comando.

1. **Una selezione per fissazione.** Dopo uno scatto nessun altro tasto si attiva finché l'occhio non
   compie una saccade: lo sguardo che resta fermo, o che scivola sul tasto vicino, non scrive. Risponde
   alle lettere scivolate.
2. **Doppie secondo la predizione.** Per ripetere una lettera restando sul tasto servono 0,7 s se la
   doppia è probabile in quel punto della parola, come la «s» di «passare», e fino a 1,5 s se non lo è
   (`-repeat-min`, `-repeat`). Uscendo dal tasto e rientrando, la doppia è immediata. Risponde alle
   doppie non volute.
3. **Attesa della saccade correttiva.** Dopo una saccade di oltre 8°, il banco stima la probabilità che
   l'occhio volesse proprio il tasto su cui è atterrato, e non un tasto probabile più lontano nella stessa
   direzione; per farlo usa il guadagno misurato, 0,94 in media. Se quella probabilità è sotto 0,8, il
   tasto deve aspettare almeno 280 ms (`-land`), il tempo entro cui di solito parte la correttiva. Un
   esempio dai test: partendo dalla Q e atterrando sulla I, con la O probabile, la probabilità che
   l'occhio mirasse alla I è 0,20, e la I aspetta 280 ms invece di 182. Atterrando sulla O non si aspetta.
4. **Prudenza dopo un errore.** Dopo una selezione sbagliata, la successiva richiede almeno 500 ms
   (`-caution`). Serve a spezzare le catene di errori mentre la persona cerca il tasto giusto. Il banco sa
   che una selezione è sbagliata nei compiti di copiatura, oppure quando la persona la cancella.

## Il replay

### Che cos'è

Provare ogni regola con una sessione nuova sarebbe lento, e ogni sessione è diversa dalla precedente. Lo
strumento `replay` **rigioca le sessioni registrate** attraverso il rilevatore di saccadi e il selettore,
con i parametri che si vogliono: lo sguardo è quello vero, registrato; il selettore è quello nuovo.

Con i parametri di allora, il replay rifà le scelte del banco dal vivo. Le tre sessioni del 6 novembre con
il compito rigido, delle 11:45, delle 11:57 e delle 12:45, contengono 198 selezioni nei blocchi B: il
replay ne riproduce **197** identiche, e la differenza viene dagli arrotondamenti nel file dei campioni.

### Perché non è un esperimento

Quel giorno la persona aveva davanti il sistema di allora, e il suo sguardo ha reagito a quello che
vedeva: con un selettore diverso avrebbe guardato in modo diverso. Per restare in sincronia con lei, il
replay segue i tasti che ha scritto senza sbagliare. Se il selettore nuovo non attiva una lettera prima
che lei lasci il tasto, la lettera conta come **in ritardo** del tempo che mancava, perché dal vivo lei
avrebbe continuato a guardarla: è giusta, ma arriva più tardi. Nel ritardo medio non entrano le lettere
anticipate di oltre un secondo, dove il replay ha perso la sincronia. Il replay dice quindi se una regola
avrebbe evitato gli errori registrati e quanto tempo sarebbe costata, non come la persona si sarebbe
adattata.

### Le regole, una alla volta

La tabella aggiunge le regole una alla volta a partire dalla prima versione. Bones ha rifatto il conto
con lo strumento il 14 novembre, sugli stessi dati dei blocchi B. L'ultima colonna dice di quanto, in
media, ogni lettera giusta arriva più tardi che con la prima versione.

| Variante | Errori | Accuratezza | Lettere in ritardo | Ritardo per lettera |
| --- | ---: | ---: | ---: | ---: |
| prima versione | 37 | 81,4% | 0 | — |
| + una selezione per fissazione | 35 | 82,1% | 0 | 0 ms |
| + attesa della correttiva | 34 | 82,5% | 0 | +2 ms |
| + doppie secondo la predizione | 25 | 86,5% | 0 | +2 ms |
| + prudenza dopo un errore | 19 | 89,4% | 4 | +24 ms |
| + lessico italiano grande (attuale) | 20 | 88,9% | 16 | +33 ms |

Come la leggo:

- **Le doppie e la prudenza fanno quasi tutto il lavoro**: insieme tolgono 15 dei 37 errori. La prudenza
  è la regola più cara, circa 22 ms per lettera.
- **Le prime due regole tolgono pochi errori**, ma quasi gratis.
- **Il lessico grande peggiora un poco**: un errore in più e circa 9 ms per lettera. È atteso: il modello
  di 544 parole conosceva solo le parole delle frasi da copiare, quindi era più favorevole del dovuto. Il
  lessico grande ha circa 140.000 parole e lo descrivo nella
  [parte 2](/diario/tastiera-ibrida-2-la-lingua-come-informazione/).
- Gli errori che restano sono soprattutto occhiate di ricerca
  ([parte 4](/diario/tastiera-ibrida-4-le-occhiate-di-ricerca/)).

### Le varianti scartate

Il replay serve anche a dire di no. Queste varianti sono state provate e scartate perché peggiorano o
costano più di quanto rendono. Accanto riporto il replay del 14 novembre sugli stessi dati, con il
ritardo misurato come nella tabella. Il termine di confronto è la versione attuale: 20 errori e +33 ms.

- **Una dispersione più stretta attorno al centro del tasto, 0,8° invece di 1,6°.** Lo sguardo finale si
  disperde di circa 0,65° attorno al centro, quindi 0,8° sembrerebbe più giusto. Ma con 1,6° lo sguardo
  vicino al bordo allunga il tempo richiesto, e questa prudenza sui bordi evita errori. Con 0,8°: 22
  errori e +51 ms.
- **Un nucleo più ampio**, cioè la parte centrale di ogni tasto che non si cede mai ai vicini
  ([parte 2](/diario/tastiera-ibrida-2-la-lingua-come-informazione/)): all'80% invece del 60%, 20 errori
  e +35 ms. Nessun guadagno.
- **Un'attesa fissa dopo ogni saccade lunga, senza il modello dell'atterraggio**: 21 errori e +79 ms. Gli
  stessi errori, con più del doppio del ritardo.
- **Un tempo minimo più alto.** Con `-tmin` a 150 ms invece di 120 gli errori restano 20 e il ritardo
  sale a +55 ms: circa 22 ms per lettera in più della versione attuale, senza nessun errore in meno.
- **Una ricalibrazione implicita dello scarto sistematico**, che nelle note è di circa 0,45° verso destra
  e verso l'alto: nelle selezioni rapide la stima viene sporcata dagli atterraggi corti. Questa variante
  non è più nel replay, quindi non è stato possibile ricontrollarla.

Il replay di oggi, invece, **non** boccia tre varianti. L'attesa della correttiva a 350 ms invece di 280,
oppure la doppia improbabile a 2 s invece di 1,5, danno 18 errori invece di 20 con lo stesso ritardo; il
nucleo al 40% dà gli stessi errori con +25 ms. Sono differenze di uno o due errori su circa 180
selezioni: troppo piccole per cambiare i valori con tre sessioni, ma da riprovare.

### Con la quarta sessione

Alle 13:35 è arrivata una quarta sessione, in cui gli errori entrano nel testo e si correggono. Lì il
replay è solo approssimato, perché non può ricostruire i suggerimenti che la persona vedeva: riproduce 345
selezioni su 387. Chi lancia oggi `replay` su tutte le sessioni ottiene quindi altri numeri, ma la stessa
direzione: dalla prima versione a quella attuale gli errori nei blocchi B scendono da 60 a 31 e
l'accuratezza sale dall'84,1% al 91,0%.

## Il primo blocco dal vivo con le regole

Alle **12:45** dello stesso giorno è stato registrato il primo blocco B con le quattro regole attive:
circa mezzo minuto di scrittura, a **58,9 car/min** con un'accuratezza dell'**89,2%** (4 errori su 37
selezioni), contro l'81,3% dell'intera sessione delle 11:57. Il tempo medio sul tasto prima dello scatto
è stato di 292 ms, contro i 247 della prima versione in quella sessione: va nella direzione del costo che il replay attribuisce alle regole, ma
con un blocco solo non posso separarlo dalle altre differenze, come la frase da copiare.

Era ancora con il modello di lingua piccolo. Indica che le regole funzionano anche quando la persona le
ha davanti, ma non lo dimostra.

## Cosa ho scelto e cosa ho rimandato

La voce su Tobii Race elencava otto argomenti da approfondire. Il tocco di Mida, il dwell adattivo, la
scrittura senza dwell e Dasher sono nelle sezioni precedenti. Gli altri quattro nel banco di oggi non ci
sono: per ognuno dico che cos'è e perché, per ora, è rimasto fuori.

**Lo smooth pursuit.** Si sceglie un oggetto seguendo con gli occhi un bersaglio che si muove: invece di
stimare il punto guardato, il sistema confronta il movimento degli occhi con quello degli oggetti sullo
schermo, e si può usare senza una fase di preparazione come la calibrazione
([Vidal et al., 2013](#riferimenti)). Il banco però confronta due modi di selezionare **tasti fermi**
sulla stessa QWERTY: lo smooth pursuit richiederebbe bersagli in movimento, cioè un'altra tastiera, e un
rilevatore che riconosca l'inseguimento lento, che il mio non ha. Per ora resta fuori dal confronto.

**Il filtro One Euro.** È un filtro passa-basso che si adatta alla velocità: smussa molto quando il
segnale è fermo e poco quando si muove in fretta ([Casiez et al., 2012](#riferimenti)). Lo uso in Tobii
Race. Nel banco ho fatto un'altra scelta: A usa lo sguardo già filtrato dal firmware, come la vecchia
tastiera; B riconosce le saccadi sullo sguardo non filtrato e sceglie il tasto con la media dei campioni
della fissazione, che riparte da zero a ogni saccade. Se un One Euro farebbe meglio di questa media non
l'ho misurato: per ora non c'è.

**Sguardo e testa insieme.** Špakov e colleghi ([2014](#riferimenti)) usano lo sguardo per arrivare
vicino al bersaglio e piccoli movimenti della testa, ricavati dalla posizione degli occhi nella telecamera
del tracciatore, per correggere il punto. La precisione migliorava senza allungare i tempi; in alcuni
casi i partecipanti puntavano quasi tre volte più vicino al centro del bersaglio che con il solo sguardo
(7 contro 19 pixel). Nel banco la testa non c'è: il driver si avvia con `-headpose off` perché, dicono le
note, qui il beccheggio non serve, e spegnerlo risparmia processore ed evita i rari frame persi con il
flusso delle immagini. La posizione degli occhi il banco la legge già, ma solo per convertire le distanze
in gradi. Per ora il confronto riguarda il solo sguardo; resta da capire quanto movimento della testa
abbiano le persone a cui Kite si rivolge.

**La predizione con i modelli linguistici di grandi dimensioni (LLM).** In SpeakFaster, Cai e colleghi
([2024](#riferimenti)) fanno scrivere solo l'iniziale di ogni parola; un LLM addestrato apposta propone
le frasi complete, tenendo conto della conversazione. In simulazione risparmiava il 57% di azioni motorie
in più delle tastiere predittive tradizionali; con due persone con SLA che scrivono con lo sguardo, la
velocità era del 29–60% sopra i loro valori di riferimento. Il modello gira su server nel cloud, quindi
serve una connessione a Internet. Nel banco la predizione usa un lessico italiano con un modello per
prefisso e un modello di frasi a n-grammi di parole, scritti in Go e calcolati in locale: con 3000 frasi
una proposta costa circa 5 µs. Anche la voce è sintetizzata in locale. Un LLM, locale o remoto, per ora non l'ho provato. I modelli del
banco sono il tema della [parte 2](/diario/tastiera-ibrida-2-la-lingua-come-informazione/).

## Limiti di questa parte

- **Una persona, un tracciatore, un computer**, come nelle voci precedenti.
- **Pochi dati**: cinque blocchi nella prima sessione con la QWERTY, un solo blocco con le regole.
- **Il compito rigido** misura le selezioni, non il testo che una persona manderebbe davvero.
- **Il replay non è un esperimento**: non dice come la persona si sarebbe adattata.
- **La ricostruzione delle cause** viene dalle note del banco e non è stata rifatta da una seconda
  persona.
- **I 23 ms del rilevatore** sono misurati su una saccade sintetica.
- **Alcuni numeri delle note** non coincidono con i file delle sessioni.

## Prossimi passi

1. Registrare il protocollo completo, con i blocchi A e B alternati e le quattro regole, in più sessioni:
   come, e con quali metriche, è nella
   [parte 3](/diario/tastiera-ibrida-3-la-pupilla-la-bci-e-le-misure/).
2. Riprovare sui dati nuovi le varianti che il replay di oggi non boccia: correttiva a 350 ms, doppia
   improbabile a 2 s, nucleo al 40%.
3. Chiarire da quale registrazione vengono i numeri del 4C riportati nelle note del banco.

La prossima voce è la [parte 2](/diario/tastiera-ibrida-2-la-lingua-come-informazione/): da dove vengono
i tempi diversi per lettere diverse, cioè la lingua come informazione.

> **Avvertenza.** Il banco tobii4c-hybridbci è uno strumento sperimentale, non un dispositivo medico
> certificato né un ausilio, e Kite è un progetto sperimentale. Il driver è un software non ufficiale che
> usa il tracciatore in modi non previsti dal produttore. Le sessioni registrate contengono il testo
> scritto da chi le ha fatte: qui pubblico solo numeri aggregati. Le prove con persone richiedono il
> consenso informato e, quando serve, il parere di un comitato etico. Chi dipende da uno strumento di CAA
> per comunicare dovrebbe avere sempre un'alternativa di riserva.

## Riferimenti

1. Becker W., Fuchs A. F. (1969). Further properties of the human saccadic system: eye movements and
   correction saccades with and without visual fixation points. *Vision Research*, 9(10), 1247–1258.
   [doi:10.1016/0042-6989(69)90112-6](https://doi.org/10.1016/0042-6989(69)90112-6)
2. Binda P., Morrone M. C. (2018). Vision during saccadic eye movements. *Annual Review of Vision
   Science*, 4, 193–213.
   [doi:10.1146/annurev-vision-091517-034317](https://doi.org/10.1146/annurev-vision-091517-034317).
   [Versione liberamente accessibile](https://arpi.unipi.it/bitstream/11568/931022/2/BindaMorrone_ARvisionscience_fullpdf.pdf)
3. Cai S., Venugopalan S., Seaver K., Xiao X., Tomanek K., Jalasutram S., Morris M. R., Kane S.,
   Narayanan A., MacDonald R. L., Kornman E., Vance D., Casey B., Gleason S. M., Nelson P. Q.,
   Brenner M. P. (2024). Using large language models to accelerate communication for eye gaze typing
   users with ALS. *Nature Communications*, 15, 9449.
   [doi:10.1038/s41467-024-53873-3](https://doi.org/10.1038/s41467-024-53873-3) (open access su
   [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11530652/))
4. Casiez G., Roussel N., Vogel D. (2012). 1 € filter: a simple speed-based low-pass filter for noisy
   input in interactive systems. *Proceedings of the SIGCHI Conference on Human Factors in Computing
   Systems (CHI '12)*, 2527–2530.
   [doi:10.1145/2207676.2208639](https://doi.org/10.1145/2207676.2208639)
5. Jacob R. J. K. (1991). The use of eye movements in human-computer interaction techniques: what
   you look at is what you get. *ACM Transactions on Information Systems*, 9(2), 152–169.
   [doi:10.1145/123078.128728](https://doi.org/10.1145/123078.128728)
6. Kristensson P. O., Vertanen K. (2012). The potential of dwell-free eye-typing for fast assistive
   gaze communication. In *Proceedings of the Symposium on Eye Tracking Research and Applications
   (ETRA '12)*, 241–244. ACM. [doi:10.1145/2168556.2168605](https://doi.org/10.1145/2168556.2168605).
   [Versione liberamente accessibile](https://www.keithv.com/pub/dwellfree/kristensson-dwell-free.pdf)
7. Majaranta P., Räihä K.-J. (2002). Twenty years of eye typing: systems and design issues. In
   *Proceedings of the Symposium on Eye Tracking Research & Applications (ETRA '02)*, 15–22. ACM.
   [doi:10.1145/507072.507076](https://doi.org/10.1145/507072.507076)
8. Mott M. E., Williams S., Wobbrock J. O., Morris M. R. (2017). Improving dwell-based gaze typing
   with dynamic, cascading dwell times. *Proceedings of the 2017 CHI Conference on Human Factors in
   Computing Systems (CHI '17)*, 2558–2570.
   [doi:10.1145/3025453.3025517](https://doi.org/10.1145/3025453.3025517).
   [Versione liberamente accessibile](https://faculty.washington.edu/wobbrock/pubs/chi-17.02.pdf)
9. Nyström M., Holmqvist K. (2010). An adaptive algorithm for fixation, saccade, and glissade detection
   in eyetracking data. *Behavior Research Methods*, 42(1), 188–204.
   [doi:10.3758/BRM.42.1.188](https://doi.org/10.3758/BRM.42.1.188)
10. Salvucci D. D., Goldberg J. H. (2000). Identifying fixations and saccades in eye-tracking
    protocols. *Proceedings of the Symposium on Eye Tracking Research & Applications (ETRA '00)*,
    71–78. [doi:10.1145/355017.355028](https://doi.org/10.1145/355017.355028)
11. Špakov O., Isokoski P., Majaranta P. (2014). Look and lean: accurate head-assisted eye pointing.
    *Proceedings of the Symposium on Eye Tracking Research and Applications (ETRA '14)*, 35–42.
    [doi:10.1145/2578153.2578157](https://doi.org/10.1145/2578153.2578157).
    [Versione liberamente accessibile](https://homepages.tuni.fi/oleg.spakov/publications/Spakov_ETRA_14a.pdf)
12. Tian J., Ying H. S., Zee D. S. (2013). Revisiting corrective saccades: role of visual feedback.
    *Vision Research*, 89, 54–64.
    [doi:10.1016/j.visres.2013.07.012](https://doi.org/10.1016/j.visres.2013.07.012) (testo liberamente
    accessibile su [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3784029/))
13. Vidal M., Bulling A., Gellersen H. (2013). Pursuits: spontaneous interaction with displays based on
    smooth pursuit eye movement and moving targets. *Proceedings of the 2013 ACM International Joint
    Conference on Pervasive and Ubiquitous Computing (UbiComp '13)*, 439–448.
    [doi:10.1145/2493432.2493477](https://doi.org/10.1145/2493432.2493477)
14. Vikesdal G. H., Langaas T. (2016). Saccade latency and fixation stability: repeatability and
    reliability. *Journal of Eye Movement Research*, 9(2), 3, 1–13.
    [doi:10.16910/jemr.9.2.3](https://doi.org/10.16910/jemr.9.2.3) (open access)
15. Ward D. J., MacKay D. J. C. (2002). Fast hands-free writing by gaze direction. *Nature*, 418(6900),
    838. [doi:10.1038/418838a](https://doi.org/10.1038/418838a) (preprint su
    [arXiv:cs/0204030](https://arxiv.org/abs/cs/0204030))
