---
ref: kite-dwell-time-typing
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Kite: come si scriveva con lo sguardo e un dwell time di 1 secondo"
description: Il resoconto del primo modo di scrivere in Kite, con la posizione degli occhi per scegliere il tasto e 1 s di sguardo fermo per premerlo. Cosa funzionava e quali limiti aveva.
tags: [eye-tracking, dwell-time, caa, tastiera-virtuale]
---

Una parte di [Kite](/ricerche/kite/), il mio strumento aperto di Comunicazione Aumentativa e
Alternativa (CAA), è una **tastiera virtuale da usare con gli occhi**. In questa voce racconto
come funzionava la prima versione, quella che ho implementato all'inizio.

Era basata sul **dwell time**: si guarda un tasto e lo si tiene fissato per 1 secondo, finché
il tasto si "preme" da solo. Questo è il **vecchio approccio** che ho implementato in Kite:
oggi sto studiando un meccanismo nuovo, basato su altri fattori, per scrivere più in fretta e
rendere la tastiera più fruibile.

## Scrivere con gli occhi, in breve

Un **eye tracker**, o tracciatore oculare, è una piccola barra con telecamere e illuminatori
a infrarossi montata sotto lo schermo. Stima in ogni istante il punto dello schermo che la
persona sta guardando.

Per chi non può muovere le mani, ma controlla ancora gli occhi, questo punto può fare da
puntatore. La letteratura chiama questa tecnica *eye typing* o *gaze typing*, cioè scrittura
con lo sguardo. Se ne occupa da molto tempo: già nel 2002 una rassegna ne ricostruiva vent'anni
di sistemi e problemi di progettazione ([Majaranta e Räihä, 2002](#riferimenti)).

Una precisazione: un eye tracker **non è una Brain Computer Interface** (BCI). Una BCI legge
l'attività del cervello, come racconto nella [voce sulle BCI](/diario/cos-e-una-brain-computer-interface/).
Un eye tracker osserva invece il movimento degli occhi, che dipende dai muscoli oculari. Molte
persone con disabilità motorie gravi conservano proprio questo movimento, e per questo lo sguardo
è uno dei canali più usati nella CAA.

## Il problema del "tocco di Mida"

Puntare con gli occhi è facile. Il difficile è **cliccare**. Con il mouse indichi e poi premi un
tasto; con lo sguardo non c'è un pulsante, perché gli occhi servono anche, e soprattutto, a
guardare.

Se il sistema premesse ogni tasto su cui cade lo sguardo, ogni occhiata diventerebbe un comando.
Robert Jacob lo ha chiamato il problema del **"Midas Touch"**, il tocco di re Mida: ovunque guardi,
attivi qualcosa, e non puoi guardarti intorno senza dare un comando ([Jacob, 1991](#riferimenti)).

Il dwell time è la soluzione più diffusa. Quando osserviamo qualcosa, gli occhi si fermano su un
punto per un tempo breve, chiamato **fissazione**, che di solito dura tra 200 e 600 ms
([Majaranta et al., 2006](#riferimenti)). Se il sistema chiede uno sguardo fermo molto più lungo di
una fissazione normale, può distinguere "sto leggendo" da "voglio premere". Secondo la stessa fonte,
1000 ms bastano di solito a evitare selezioni involontarie.

## Come funzionava la vecchia tastiera di Kite

Per descrivere la vecchia tastiera con precisione mi baso sul codice di un programma per Linux
in cui l'ho reimplementata. Tutto quello che segue descrive questa reimplementazione.

### Da dove arriva lo sguardo

Il tracciatore è un **Tobii Eye Tracker 4C**, letto da un mio driver per Linux a 90 campioni al
secondo (90 Hz). Ogni campione contiene il punto di sguardo in coordinate dello schermo.

La tastiera usa il punto di sguardo fornito dal Tobii 4C. Non distingue saccadi e fissazioni:
guarda soltanto in quale tasto cade il punto, campione dopo campione.

### Dallo sguardo al tasto

L'associazione è puramente **geometrica**. Ogni tasto è un rettangolo fisso sullo schermo, e il
tasto candidato è quello che contiene il punto di sguardo. Non c'è nessuna previsione sulla lettera
successiva: tutti i tasti sono trattati allo stesso modo.

Tra un tasto e l'altro c'è un piccolo spazio vuoto, pari all'8% della dimensione del tasto. Uno
sguardo che cade in questo spazio, o nelle zone vuote ai lati delle righe, non appartiene a nessun
tasto.

### Il timer da 1 secondo

Il meccanismo, campione per campione, è questo:

1. Quando lo sguardo entra in un tasto, quel tasto diventa il **candidato** e il conteggio parte
   da zero.
2. Finché lo sguardo resta sul candidato, il conteggio cresce. A ogni campione si aggiunge il tempo
   trascorso dal precedente, al massimo 50 ms, così un buco nei dati non fa saltare in avanti il timer.
3. Quando il conteggio arriva a **1 s**, il tasto si attiva e la lettera entra nel testo.
4. Se lo sguardo esce dal tasto per **non più di 100 ms**, il conteggio si sospende ma non si azzera.
   Serve a tollerare il tremolio del punto vicino ai bordi.
5. Se lo sguardo resta fuori più a lungo, il conteggio si azzera e il tasto guardato in quel momento
   diventa il candidato.
6. Se il tracciatore perde gli occhi, per esempio durante un battito di palpebre, il conteggio si
   sospende fino a **300 ms**. Oltre quella soglia si azzera.
7. Dopo un'attivazione il conteggio riparte da zero. Restando sullo stesso tasto, la lettera si
   ripete dopo **un altro secondo intero**.

Nel programma la durata del dwell è un parametro; nella vecchia tastiera vale 1 s.

### Il feedback visivo

Mentre si fissa un tasto, attorno alla lettera compare un **anello** tenue. Sopra l'anello un
**arco colorato** si riempie in senso orario, partendo dall'alto, in proporzione al tempo già
trascorso: quando l'arco si chiude, il tasto si preme. È lo stesso principio del cerchio che si
chiude usato in uno studio di riferimento sul dwell time ([Majaranta et al., 2009](#riferimenti)).

![La tastiera di Kite durante la scrittura con il dwell time: in alto la frase da copiare e il testo scritto finora, sotto la tastiera QWERTY. Sul tasto N l'arco blu si sta chiudendo attorno alla lettera e il piccolo cerchio indica il punto in cui si trova lo sguardo.](/assets/img/kite/tastiera-dwell-time.png)

*La vecchia tastiera di Kite mentre scrivo "montagna": sul tasto N l'arco blu del dwell time è
quasi chiuso; il piccolo cerchio è il punto di sguardo.*

Al momento della selezione il tasto lampeggia per 350 ms. Negli esercizi di copiatura, in cui il
programma conosce la frase da scrivere, il lampo è verde se la lettera è giusta e rosso se è
sbagliata.

### La disposizione dei tasti

La tastiera è una **QWERTY** a schermo con 27 tasti:

| Riga | Tasti | Spostamento dal bordo sinistro |
| --- | --- | --- |
| 1 | Q W E R T Y U I O P | nessuno |
| 2 | A S D F G H J K L | mezzo tasto |
| 3 | Z X C V B N M | un tasto e mezzo |
| 4 | barra spaziatrice, larga 5 tasti, sotto X…N | due tasti e mezzo |

La tastiera occupa quasi tutta la larghezza dello schermo e circa i due terzi inferiori. Così ogni
tasto è grande, e questo conta: con lo sguardo i bersagli piccoli sono difficili da colpire. Sopra
la tastiera c'è un tasto **canc** per cancellare l'ultima lettera, che si preme con lo
stesso dwell di 1 s.

Le lettere sono solo minuscole e non c'è punteggiatura. Nella vecchia tastiera non ci sono correttore
automatico né suggerimenti di parole. Il programma prevede anche una disposizione alternativa in ordine
alfabetico, su una griglia di 3 righe per 9 tasti.

## Cosa funzionava

- **Basta lo sguardo.** Il dwell time non chiede di battere le palpebre o di premere un sensore.
  Per le persone con disabilità motorie molto gravi, come nelle fasi avanzate della sclerosi laterale
  amiotrofica (SLA), il controllo muscolare residuo può non bastare per queste alternative. Per
  questo la selezione a dwell resta l'interazione standard per molti di loro
  ([Mott et al., 2017](#riferimenti)).
- **È semplice da capire.** "Guarda la lettera finché il cerchio si chiude" si spiega in una frase.
- **Rispetta le pause.** Si può smettere di scrivere a metà parola per pensare o per guardare
  l'interlocutore: basta portare lo sguardo fuori dalla tastiera. Non tutti i metodi più veloci lo
  permettono ([Mott et al., 2017](#riferimenti)).
- **Un secondo è prudente.** Con 1 s le selezioni involontarie diventano rare, perché è un tempo
  ben più lungo di una fissazione normale ([Majaranta et al., 2006](#riferimenti)).

## I limiti

### Un tetto alla velocità

Il primo limite è matematico. Con un dwell di 1 s non si possono premere più di 60 tasti al minuto,
per quanto si diventi bravi. Nella scrittura si conta di solito una parola ogni 5 caratteri, spazi
compresi. Il tetto teorico è quindi di **12 parole al minuto** (in inglese *words per minute*, WPM)
([Majaranta et al., 2006](#riferimenti)).

Nella realtà si va più piano, perché bisogna anche cercare la lettera e correggere gli errori. Gli
studi con dwell time fisso, tipicamente tra 450 e 1000 ms, riportano velocità di circa 5–10 WPM
([Majaranta et al., 2009](#riferimenti)). Per confronto, con una tastiera normale si scrive a
40–60 WPM ([Mott et al., 2017](#riferimenti)).

### Il compromesso tra velocità ed errori

Accorciare il dwell rende la scrittura più veloce, ma aumenta il rischio di premere un tasto solo
perché lo si stava guardando. Allungarlo protegge dagli errori, ma rallenta tutto. È un compromesso
che chi progetta e chi usa la tastiera devono negoziare ([Mott et al., 2017](#riferimenti)).

Un dwell fisso sceglie una volta per tutte, per tutti i tasti e per tutte le persone. Ma con
l'allenamento le persone diventano più rapide. In uno studio longitudinale, 11 studenti
universitari senza disabilità, alle prime armi con la scrittura con lo sguardo, potevano regolare da
soli il dwell, partendo da 1000 ms. Nelle 10 sessioni da 15 minuti, analizzate su 10 partecipanti, il
dwell medio è sceso da 876 a 282 ms. La velocità è salita da 6,9 a 19,9 WPM e l'errore rimasto nel testo
è sceso dall'1,28% allo 0,36% ([Majaranta et al., 2009](#riferimenti)). Sono risultati ottenuti con altri
partecipanti, un altro tracciatore e un'altra lingua: non dicono nulla di misurato su Kite. Indicano però
che un dwell fisso di 1 s può diventare un freno proprio per chi impara.

### Gli errori di ricerca

Il dwell non elimina del tutto il tocco di Mida, lo sposta. Se mi fermo a cercare una lettera, o a
pensare alla parola successiva, con lo sguardo appoggiato su un tasto per un secondo, quel tasto si
preme. Lo stesso vale per l'occhio che resta fermo dopo una selezione: la lettera si ripete.

### Le doppie costano il doppio

Nel codice della vecchia tastiera ripetere una lettera richiede un altro secondo intero. Per scrivere
"passare" bisogna restare 2 s sulla S, oppure uscire dal tasto e rientrare.

### La fatica

Tenere lo sguardo immobile a lungo stanca. Una fissazione prolungata impedisce le selezioni sbagliate,
ma risulta scomoda per la maggior parte delle persone ([Majaranta et al., 2006](#riferimenti)). Nello stesso
lavoro, dopo quattro sessioni con un dwell di 900 ms, tutti i partecipanti lo giudicavano troppo lungo,
anche se all'inizio era sembrato adatto. Riferivano che affaticava gli occhi e rendeva difficile
concentrarsi.

### La precisione del tracciatore

Il punto di sguardo misurato non coincide mai esattamente con quello reale. Per come è fatto l'occhio
e per i limiti della telecamera, l'accuratezza di un tracciatore remoto è di circa 0,5° di angolo
visivo. Con l'uso, poi, il punto misurato tende a spostarsi rispetto a quello reale (*drift*). In
pratica l'errore arriva a 0,5–1°, cioè 1–1,5 cm sullo schermo a una normale distanza di visione
([Majaranta et al., 2006](#riferimenti)). Per questo i tasti devono essere grandi, e per questo la vecchia
tastiera di Kite occupa gran parte dello schermo.

## Cosa ho imparato

Il dwell fisso di 1 s è una soluzione **solida**: è robusta, si capisce subito e funziona con il
solo movimento degli occhi. Ma impone un tetto rigido alla velocità, tratta allo stesso modo tutti i
tasti e tutti i momenti della scrittura, e chiede uno sforzo continuo allo sguardo.

Per chi usa la CAA ogni giorno questi limiti pesano. In una conversazione, aspettare una frase scritta
a pochi caratteri al minuto significa spesso perdere il momento giusto per dirla.

> **Avvertenza.** Kite è un progetto sperimentale e **non è un dispositivo medico certificato**. Chi
> dipende da uno strumento di CAA per comunicare dovrebbe avere sempre un'alternativa di riserva, per
> esempio una tabella alfabetica su carta. Le prove con persone richiedono il consenso informato e,
> quando serve, il parere di un comitato etico.

## Riferimenti

1. Jacob R. J. K. (1991). The use of eye movements in human-computer interaction techniques: what
   you look at is what you get. *ACM Transactions on Information Systems*, 9(2), 152–169.
   [doi:10.1145/123078.128728](https://doi.org/10.1145/123078.128728)
2. Majaranta P., Ahola U.-K., Špakov O. (2009). Fast gaze typing with an adjustable dwell time. In
   *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems (CHI '09)*, 357–360. ACM.
   [doi:10.1145/1518701.1518758](https://doi.org/10.1145/1518701.1518758).
   [Versione liberamente accessibile](https://homepages.tuni.fi/oleg.spakov/publications/Majaranta_CHI_09.pdf)
3. Majaranta P., MacKenzie I. S., Aula A., Räihä K.-J. (2006). Effects of feedback and dwell time on
   eye typing speed and accuracy. *Universal Access in the Information Society*, 5(2), 199–208.
   [doi:10.1007/s10209-006-0034-z](https://doi.org/10.1007/s10209-006-0034-z).
   [Versione liberamente accessibile](https://www.yorku.ca/mack/UAIS2006.pdf)
4. Majaranta P., Räihä K.-J. (2002). Twenty years of eye typing: systems and design issues. In
   *Proceedings of the Symposium on Eye Tracking Research & Applications (ETRA '02)*, 15–22. ACM.
   [doi:10.1145/507072.507076](https://doi.org/10.1145/507072.507076)
5. Mott M. E., Williams S., Wobbrock J. O., Morris M. R. (2017). Improving dwell-based gaze typing
   with dynamic, cascading dwell times. In *Proceedings of the 2017 CHI Conference on Human Factors in
   Computing Systems (CHI '17)*, 2558–2570. ACM.
   [doi:10.1145/3025453.3025517](https://doi.org/10.1145/3025453.3025517).
   [Versione liberamente accessibile](https://faculty.washington.edu/wobbrock/pubs/chi-17.02.pdf)
