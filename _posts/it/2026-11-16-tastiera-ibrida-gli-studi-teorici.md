---
ref: kite-hybrid-keyboard-studies
project: kite
kind: note
authors: [Antonio Blescia, Bones]
title: "Kite, la tastiera ibrida: gli studi su saccadi, predizione, pupilla e correttore"
description: Le basi teoriche dei quattro meccanismi della nuova tastiera a sguardo di Kite. Per ognuno, che cosa dice la letteratura, quale scelta ne ho ricavato nel banco di prova e come potrebbe migliorare la scrittura rispetto al vecchio dwell fisso di 1 s.
tags: [eye-tracking, caa, tastiera-virtuale, saccadi, predizione, pupillometria, correttore]
---

Nella [voce su Tobii Race](/diario/tobii-race-un-gioco-per-mettere-alla-prova-il-4c/#che-cosa-porto-in-kite-gli-argomenti-da-approfondire)
ho elencato gli argomenti della letteratura che volevo approfondire per la nuova tastiera a sguardo
di [Kite](/ricerche/kite/), il mio strumento aperto di Comunicazione Aumentativa e Alternativa (CAA).
Avevo promesso di trattarli nella voce successiva. Questa è quella voce, per i quattro argomenti
che sono entrati davvero nella nuova tastiera: **saccadi**, **predizione**, **pupilla** e
**correttore**.

La nuova tastiera vive per ora in un banco di prova, il banco tobii4c-hybridbci. È un programma per
Linux che legge il Tobii Eye Tracker 4C attraverso il mio driver, a 90 campioni al secondo, e mette
sullo stesso compito la vecchia tastiera e quella nuova. La nuova è «ibrida» nel senso che non si
affida al solo tempo di fissazione: combina il movimento degli occhi, un modello della lingua
italiana e il diametro della pupilla.

Questa voce è una nota di studio e **non contiene misure**. Per ogni argomento racconto tre cose:

1. **lo studio**: che cosa dice la letteratura, con le condizioni in cui sono stati ottenuti i
   risultati;
2. **la scelta nel banco**: che cosa ne ho ricavato, con i parametri come sono scritti nel codice;
3. **che cosa potrebbe cambiare** rispetto alla vecchia tastiera a dwell fisso di 1 s, punto per
   punto sui suoi limiti. Sono ipotesi da verificare, non risultati.

## Quello che do per noto

Alcune basi le ho già spiegate, e qui le richiamo soltanto:

- come si muove l'occhio, cioè fissazioni, saccadi, microsaccadi, deriva e ammiccamenti, è nella
  [voce sull'occhio](/diario/come-funziona-l-occhio-e-il-gaze-tracking/#come-si-muove-locchio);
- il tocco di Mida e il dwell sono nella stessa voce, in
  [Dwell time e tocco di Mida](/diario/come-funziona-l-occhio-e-il-gaze-tracking/#dwell-time-e-tocco-di-mida);
- accuratezza, precisione e dimensione dei tasti in gradi sono in
  [Accuratezza e precisione](/diario/come-funziona-l-occhio-e-il-gaze-tracking/#accuratezza-e-precisione)
  e in [Dai gradi ai centimetri](/diario/come-funziona-l-occhio-e-il-gaze-tracking/#dai-gradi-ai-centimetri-quanto-grandi-fare-i-tasti);
- le parole al minuto (in inglese *words per minute*, WPM), i tasti per carattere e i tassi d'errore
  sono in [Come si misura una tastiera a sguardo](/diario/come-funziona-l-occhio-e-il-gaze-tracking/#come-si-misura-una-tastiera-a-sguardo);
- la pupilla, che risponde alla luce e allo sforzo mentale, è in
  [Il diametro della pupilla](/diario/come-funziona-l-occhio-e-il-gaze-tracking/#il-diametro-della-pupilla);
- la vecchia tastiera e i suoi limiti sono nella
  [voce sul dwell time](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/#i-limiti);
- il classificatore dei movimenti oculari a soglie fisse è nella voce su Tobii Race, in
  [Lo sguardo: filtro, mirino, movimenti oculari](/diario/tobii-race-un-gioco-per-mettere-alla-prova-il-4c/#lo-sguardo-filtro-mirino-movimenti-oculari).

## 1. Saccadi: contare il tempo da quando l'occhio atterra

### Lo studio

**Soglie che si adattano al rumore.** Il modo più semplice per separare saccadi e fissazioni è una
soglia di velocità: sopra è una saccade, sotto è una fissazione. È la famiglia di algoritmi I-VT
(dall'inglese *velocity-threshold identification*), che in Tobii Race uso con soglie fisse. Il punto
debole è che la soglia giusta dipende dal rumore, e il rumore cambia con il tracciatore, con la
persona e con la sessione.

Nyström e Holmqvist hanno proposto di far calcolare la soglia ai dati stessi
([Nyström e Holmqvist, 2010](#riferimenti)). Secondo la descrizione che ne danno anche Voloh e
colleghi ([Voloh et al., 2020](#riferimenti)), il procedimento è questo:

1. si parte da una soglia di picco provvisoria, tra 100 e 300 °/s;
2. si prendono i campioni più lenti della soglia, che sono quasi tutti di fissazione, e se ne
   calcolano la media e la deviazione standard della velocità;
3. la nuova soglia di picco è la media più sei deviazioni standard;
4. si ripete finché la soglia cambia di meno di 1 °/s.

L'inizio della saccade si cerca poi con una soglia più bassa. Secondo gli autori, una soglia così
rende il rilevamento meno sensibile al rumore ed evita di far scegliere i parametri a chi analizza i
dati. Notano anche le **glissate** (*glissades*), piccole oscillazioni alla fine delle saccadi: nei
loro dati comparivano in circa metà delle saccadi e duravano in media circa 24 ms. Chi progetta un
algoritmo deve decidere se attribuirle alla saccade o alla fissazione.

**Ragionare per fissazioni.** Jacob trasformava il flusso grezzo del tracciatore in eventi discreti,
come si fa con i tasti di una tastiera: inizio, continuazione ogni 50 ms e fine di ogni fissazione
([Jacob, 1991](#riferimenti)). Ignorava i campioni durante le saccadi, perché non dicono nulla di
utile al dialogo con il computer. Il suo riconoscitore dichiarava una fissazione quando lo sguardo
restava per 100 ms entro circa 0,5°, e ne prendeva come posizione la media dei campioni.

**L'occhio arriva corto.** Le saccadi guidate dalla vista verso un bersaglio tendono a cadere corte
(in inglese *undershoot*) di circa il 10% della distanza. Una seconda saccade, detta correttiva,
completa il tragitto ([Harris, 1995](#riferimenti)). Harris ha mostrato con una simulazione che,
quando l'errore delle saccadi ha una deviazione standard di circa il 10% della distanza, il guadagno
ottimale della prima saccade, cioè la frazione di distanza percorsa, è tra 0,93 e 0,97. La sua
interpretazione è che arrivare un po' corti riduca il tempo totale passato in volo, cioè senza
visione nitida.

Tian e colleghi hanno studiato le saccadi correttive in nove adulti sani, con salti del bersaglio di
10°, 20° e 25° e una bobina sclerale campionata a 1000 Hz ([Tian et al., 2013](#riferimenti)):

- il 55% delle saccadi primarie era seguito da una correttiva;
- un errore attorno al −10% veniva corretto quasi sempre;
- con il bersaglio visibile, il tempo mediano tra la fine della saccade primaria e l'inizio della
  correttiva era di 251 ms; per errori oltre 5° restava attorno a 130 ms;
- gli autori ricordano che l'undershoot diventa più frequente con le saccadi più ampie.

### La scelta nel banco

Il rilevatore di saccadi del banco segue l'idea di Nyström e Holmqvist, adattata al tempo reale:

| Elemento | Valore nel codice | Motivo |
| --- | --- | --- |
| Velocità | in °/s, dalla posizione degli occhi fornita dal tracciatore, su due intervalli (circa 22 ms a 90 Hz) | i gradi non dipendono dalla distanza dallo schermo; due intervalli dimezzano il rumore rispetto a uno |
| Soglia di picco | media + 6 deviazioni standard della velocità in fissazione, tra 60 e 300 °/s; 100 °/s all'avvio | la saccade comincia quando la velocità la supera; l'inizio si data al campione precedente |
| Soglia di fine | media + 3 deviazioni standard, tra 15 °/s e l'80% della soglia di picco | la saccade finisce quando la velocità scende sotto questa soglia, più bassa del picco |
| Stima del rumore | continua, con una media mobile esponenziale di 2 s sui campioni di fissazione più lenti della soglia di fine | si adatta mentre la persona scrive |
| Microsaccadi | uno spostamento sotto 1° non apre una fissazione nuova | un piccolo salto non spezza la fissazione |
| Perdita dei dati | un buco di oltre 100 ms chiude la fissazione; una "saccade" di oltre 160 ms è un artefatto | |
| Fissazione stabile | almeno 3 campioni con scarto quadratico medio entro 1° | |

Rispetto all'algoritmo originale ci sono tre differenze. La soglia si aggiorna di continuo, invece
che con iterazioni su tutta la registrazione, perché il banco deve decidere mentre la persona scrive.
L'inizio della saccade non si cerca a ritroso con una soglia più bassa: si data al campione che
precede il superamento della soglia di picco. E non c'è una classe per le glissate: al loro posto,
per selezionare un tasto serve una fissazione stabile.

Da qui vengono tre scelte per la selezione.

1. **Il tempo parte dalla fine della saccade.** Il conteggio sul tasto comincia nell'istante in cui
   il rilevatore dice che l'occhio è atterrato, non quando il punto di sguardo entra nel rettangolo
   del tasto. Il rilevatore lavora sullo sguardo non filtrato, perché un filtro aggiunge ritardo, come
   ricordavo parlando di [latenza](/diario/come-funziona-l-occhio-e-il-gaze-tracking/#frequenza-di-campionamento-e-latenza).
   Come posizione della fissazione uso la media dei suoi campioni, come Jacob.
2. **Una selezione per fissazione.** Dopo una selezione nessun altro tasto si attiva finché l'occhio
   non compie una saccade. Dopo un ammiccamento, finché la fissazione nuova non cade a più di 1,5° dal
   punto della selezione. È l'idea di Jacob portata fino in fondo: la fissazione è l'unità del
   dialogo, e una fissazione vale al massimo un tasto.
3. **L'attesa della saccade correttiva.** Dopo una saccade di almeno 8°, il banco si chiede verso
   quale tasto stava andando davvero l'occhio. Un modello dell'atterraggio assume che la saccade copra
   in media il 94% della distanza, con una deviazione standard di 0,12. Di traverso, il punto di
   arrivo si sparpaglia dell'8% della distanza, con un minimo di 0,7°. Il guadagno medio sta
   nell'intervallo indicato da Harris. Se la probabilità che l'occhio mirasse proprio al tasto su cui
   è atterrato è sotto 0,8, quel tasto richiede almeno 280 ms: un tempo dello stesso ordine della
   latenza mediana delle correttive misurata da Tian e colleghi.

Un esempio dell'ultima regola. Lo sguardo parte dalla Q, attraversa quasi tutta la prima riga e
atterra sulla I. In quel punto della parola, però, la O, il tasto subito dopo nella stessa
direzione, è molto più probabile. Il banco allora non scrive subito la I: aspetta, e se arriva la
saccade correttiva la lettera giusta diventa la O.

### Che cosa potrebbe cambiare rispetto al dwell di 1 s

- **[Il tetto alla velocità](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/#un-tetto-alla-velocità).**
  Per come sono scritte le regole della vecchia tastiera, quando lo sguardo passa a un tasto nuovo il
  conteggio parte solo quando sono trascorsi 100 ms dall'uscita dal tasto precedente: è la tolleranza
  per le brevi uscite. Una parte di questo tempo coincide con la saccade, il resto si perde dopo
  l'atterraggio. Inoltre il conteggio segue il punto filtrato, che arriva in ritardo. Contare dalla
  fine della saccade recupera questo tempo. Da solo vale meno di 100 ms per lettera, ma è la
  condizione per usare tempi brevi in sicurezza, ed è lì che sta il guadagno vero (vedi la
  predizione).
- **[Gli errori di ricerca](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/#gli-errori-di-ricerca).**
  Nella vecchia tastiera l'occhio che resta fermo dopo una selezione ripete la lettera dopo un altro
  secondo. Con una selezione per fissazione questo non può succedere: per scrivere ancora serve un
  movimento. Le occhiate di ricerca su un tasto *nuovo*, invece, restano un rischio, e ne parlo nella
  predizione.
- **[La precisione del tracciatore](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/#la-precisione-del-tracciatore).**
  La media dei campioni di una fissazione riduce l'errore casuale, cioè migliora la precisione, ma non
  corregge l'errore sistematico, cioè l'accuratezza. Le microsaccadi sotto 1° non spezzano la
  fissazione, quindi un piccolo salto vicino al bordo non sposta il conteggio sul tasto vicino. C'è poi
  un errore che la geometria della vecchia tastiera ignorava del tutto: l'undershoot. Non viene dal
  tracciatore ma dall'occhio, ed è sistematico. Se l'occhio arriva corto, il primo atterraggio cade per
  forza tra il punto di partenza e il bersaglio, cioè sul lato da cui arriva lo sguardo. Il modello
  dell'atterraggio prova a tenerne conto.

I rischi, anche qui ipotesi:

- se il rumore cresce molto, per esempio con la testa in una posa sfavorevole, la soglia adattiva sale
  e le saccadi piccole possono sfuggire;
- a 90 Hz una saccade di 30 ms dura tre campioni, quindi un solo campione sbagliato pesa molto;
- l'attesa di 280 ms si paga anche quando l'occhio era già sul tasto giusto, se il modello lo
  considera incerto.

## 2. Predizione: tempi e bersagli che seguono la lingua

### Lo studio

**Il dwell che cambia con la probabilità.** Mott e colleghi hanno proposto il dwell «a cascata»
(*cascading dwell*) ([Mott et al., 2017](#riferimenti)). Funziona così:

1. ogni persona sceglie il proprio dwell di base, quello con cui scrive comoda;
2. dopo ogni lettera, un motore di predizione delle parole stima quanto è probabile ciascun tasto come
   lettera successiva;
3. i tasti sotto l'1% di probabilità ricevono il dwell massimo: una selezione involontaria diventa
   difficile, ma resta possibile scrivere nomi e parole fuori vocabolario;
4. i tasti probabili ricevono un dwell più corto, tanto più corto quanto più sono probabili. Se però
   attorno a un tasto probabile ci sono altri tasti probabili, il dwell si allunga, per non scrivere la
   I quando si voleva la O;
5. il dwell minimo consentito scende del 10% a ogni lettera della parola, a cascata, per non spezzare
   il ritmo con cambi bruschi;
6. quando la parola in corso è completa, la barra spaziatrice scende a due terzi del dwell di base.

Lo studio è durato otto sessioni, con 17 persone senza disabilità, un tracciatore SMI REDn a circa
60 Hz e frasi in inglese. In media il dwell a cascata è arrivato a 12,39 WPM contro i 10,62 WPM del
dwell fisso, con meno errori corretti durante la scrittura: 9,63% contro 14,88%. Gli errori rimasti
nel testo finale non differivano in modo significativo. In una piccola prova con cinque persone con
sclerosi laterale amiotrofica (SLA), la velocità media con il dwell a cascata è stata di 9,51 WPM. Il
guadagno, quindi, c'è, ma è moderato.

**Lingua e tocco insieme.** Goodman e colleghi hanno trattato una tastiera su schermo come un problema
di probabilità ([Goodman et al., 2002](#riferimenti)). La sequenza di lettere più probabile è quella
che massimizza il prodotto di due fattori:

- quanto è probabile la sequenza nella lingua, secondo un **modello di lingua**;
- quanto è probabile che quella sequenza produca proprio i punti toccati, secondo un **modello del
  tocco**.

Con una penna su un palmare, un modello che stimava ogni lettera dalle sei precedenti e una
distribuzione gaussiana bidimensionale per ogni tasto, gli errori scendevano di un fattore compreso
tra 1,67 e 1,87.

Gunawardana e colleghi hanno reso esplicita una conseguenza di questo schema
([Gunawardana et al., 2010](#riferimenti)). Le **aree di tocco** dei tasti, che non si vedono, si
allargano e si restringono secondo la probabilità, mentre il disegno dei tasti resta uguale. Il loro
esempio: dopo "habi", toccare la Y può restituire la T, perché "habit" è più probabile di "habiy". Il
rischio è che un ridimensionamento troppo aggressivo renda **impossibile** scrivere ciò che si vuole,
e gli autori notano che anche casi rari possono essere molto frustranti. La loro soluzione è
un'**ancora**: una zona centrale di ogni tasto che restituisce sempre quel tasto, qualunque cosa dica
il modello di lingua. Hanno raccolto i tocchi di 9 persone su un telefono e hanno simulato i metodi su
quei dati. Con le ancore l'errore per tasto scendeva rispetto alla tastiera statica, in termini
relativi, del 17%, 6%, 8% e 13% su quattro insiemi di test. Senza ancore, su due insiemi, l'errore
era del 10% peggiore di quello della tastiera statica.

**Bersagli che si espandono.** Un bersaglio che si ingrandisce mentre lo si raggiunge si comporta come
se fosse grande fin dall'inizio, anche quando l'espansione comincia dopo il 90% del movimento
([McGuffin e Balakrishnan, 2002](#riferimenti)). Miniotas e colleghi hanno trovato benefici simili,
in velocità e accuratezza, quando il puntatore è lo sguardo ([Miniotas et al., 2004](#riferimenti)).

**Il costo di guardare le predizioni.** Le predizioni non sono gratis. In uno studio con 14 persone,
6 delle quali con lesione midollare alta, la predizione di parole **rallentava** chi aveva la lesione
e aiutava poco gli altri ([Koester e Levine, 1994](#riferimenti)). Gli autori ne deducono che il costo
cognitivo di usarla pesava molto: con la predizione tutti premevano i tasti più lentamente, e chi aveva
la lesione impiegava molto di più a scorrere l'elenco. Trnka e colleghi, con velocità di scrittura
simulate al livello della CAA, hanno trovato invece che una predizione di buona qualità può alzare la
velocità di comunicazione, fino al 58,6% con il sistema più avanzato, e che più è accurata, più viene
usata ([Trnka et al., 2009](#riferimenti)).

**Frasi intere.** Nella CAA esiste una tradizione di dispositivi basati su enunciati interi, pronti da
dire. In un confronto in ufficio, tra comunicazione pratica e chiacchiere, la velocità della
conversazione e la competenza comunicativa percepita erano più alte con un dispositivo a enunciati
che con uno a costruzione di parole ([Todman et al., 2008](#riferimenti)). Inoltre un modello di
lingua predice meglio se è addestrato su testi simili a quelli che la persona vuole dire. Vertanen e
Kristensson hanno creato con il crowdsourcing un grande insieme di messaggi verosimili di CAA: il loro
modello migliore riduceva la perplessità, una misura di quanto il modello è "sorpreso" dal testo, del
60–82% rispetto a uno addestrato su trascrizioni di telefonate ([Vertanen e Kristensson, 2011](#riferimenti)).

Per stimare la parola successiva con pochi dati bisogna decidere quanta probabilità lasciare alle
parole mai viste. È il "problema della frequenza zero" della compressione dei testi
([Witten e Bell, 1991](#riferimenti)). Nella forma usata per i modelli di lingua, il metodo di
Witten-Bell mescola il contesto lungo con quello più corto, e dà al contesto corto un peso
proporzionale a quante parole diverse si sono già viste dopo quel contesto
([Chen e Goodman, 1999](#riferimenti)). Detto con un esempio: se dopo "ho" ho sempre detto "sete", il
modello è sicuro; se dopo "mi fa male la" ho detto quattro parole diverse, il modello sa di non
sapere. Nel confronto di Chen e Goodman, Witten-Bell non è il metodo migliore: vince una variante di
Kneser-Ney.

**Leggere non è scegliere.** Nella lettura silenziosa le fissazioni durano in media 225–250 ms e le
saccadi saltano circa 2°, cioè 7–9 lettere. Nella ricerca visiva le fissazioni durano in media
180–275 ms, con saccadi di circa 3° ([Rayner, 2009](#riferimenti)). Una fissazione unica di un
secondo, quindi, è molto più lunga di quelle della lettura.

**Dopo un errore si rallenta.** Dopo essersi accorte di un errore, le persone tendono a rallentare la
risposta successiva: è il rallentamento post-errore (*post-error slowing*)
([Danielmeier e Ullsperger, 2011](#riferimenti)).

### La scelta nel banco

**Il modello di lingua.** Il banco usa le 150.000 parole più frequenti nei sottotitoli italiani, con
le loro frequenze; ne parlo meglio nel correttore. Dato il testo scritto, il modello stima la
probabilità di ciascuno dei 27 simboli successivi, cioè le 26 lettere e lo spazio, mescolando due
livelli:

- le parole del lessico che iniziano con le lettere già scritte, pesate con la loro frequenza;
- le coppie di lettere consecutive (bigrammi), che coprono le parole fuori lessico.

Il peso del primo livello cresce con il numero n di parole che condividono l'inizio, e vale
n / (n + 0,5). Alla fine la distribuzione è mescolata al 10% con quella uniforme, così ogni tasto
resta raggiungibile.

**Il dwell adattivo.** Il tempo di fissazione richiesto dopo la saccade dipende dal rapporto r tra la
probabilità del tasto e quella che avrebbe a caso, cioè 1/27:

| Rapporto r | Significato | Tempo richiesto |
| --- | --- | --- |
| 4 o più | lettera molto probabile | 120 ms |
| 1 | come a caso | circa 338 ms |
| 0,1 o meno | lettera improbabile | 700 ms |

Tra questi punti il tempo cresce in modo lineare con il logaritmo di r. Grazie alla quota uniforme
del 10%, r non scende mai sotto 0,1, quindi nessuna lettera richiede più di 700 ms. Il tempo si
allunga anche quando lo sguardo è ambiguo tra due tasti: se la probabilità del tasto, dato lo
sguardo, è sotto 0,95, il tempo sale, fino a 700 ms quando vale 0,5. Lo scopo è lo stesso del dwell
"di densità" di Mott e colleghi, che rallenta i gruppi di tasti probabili vicini; qui lo ottiene il
decodificatore, invece della disposizione dei tasti.

**I bersagli che si espandono in modo invisibile.** Il tasto candidato lo sceglie un decodificatore
bayesiano, nello spirito di Goodman e di Gunawardana:

P(tasto \| sguardo) ∝ P(tasto) × exp(−d² / 2σ²)

In parole: la probabilità di un tasto è la sua probabilità secondo la lingua, moltiplicata per un
fattore che cala man mano che lo sguardo si allontana dal tasto. d è la distanza dello sguardo dalla
zona a cui si mira: il centro per le lettere, la linea centrale per i tasti allungati come la barra
spaziatrice, che così si può guardare in tutta la sua lunghezza. σ è la dispersione attesa dello sguardo e vale 1,6°. Le
conseguenze:

- con probabilità uguali, i confini sono quelli disegnati;
- un tasto più probabile sposta il confine verso il vicino di σ² × ln(Pa / Pb) / d, dove d è la
  distanza tra i centri. Un esempio con numeri di fantasia: con due tasti a 3° di distanza e il primo
  quattro volte più probabile del secondo, il confine si sposta di circa 1,2° verso il secondo;
- il **nucleo centrale** di ogni tasto, il 60% della sua larghezza e della sua altezza, resta sempre
  suo: guardando il centro di un tasto si ottiene quel tasto, per quanto improbabile. È l'ancora di
  Gunawardana;
- uno sguardo a più di 1° da ogni tasto non attiva nulla: la striscia del testo e le zone vuote ai
  lati delle righe sfalsate sono terreno neutro;
- i tasti della barra di modifica, cioè i tre suggerimenti, cancella e parla, non si espandono. Si
  attivano solo guardandoli dentro e con il tempo massimo di 700 ms, perché sono scelte deliberate, non
  lettere da indovinare.

**Le doppie secondo la predizione.** Per ripetere una lettera restando sul tasto, il tempo dipende da
quanto è probabile la doppia in quel punto della parola: 0,7 s se è probabile, come in "pa**ss**are",
fino a 1,5 s se non lo è, con la stessa scala logaritmica. Uscendo e rientrando, la lettera torna ad
avere il suo tempo normale.

**La prudenza dopo un errore.** Dopo un errore, la selezione successiva richiede almeno 500 ms. Nel
compito di copiatura l'errore è una lettera diversa da quella attesa; nella scrittura libera è una
cancellazione. È una specie di rallentamento post-errore imposto dalla macchina: dopo un errore la
persona deve cercare il tasto giusto, e la regola interrompe le catene di errori proprio in quel
momento.

**Le frasi imparate.** Chi comunica con una tastiera a sguardo ripete spesso gli stessi messaggi.
Nella scrittura libera il banco li impara e, dopo poche lettere, propone il resto della frase in
grigio chiaro dopo il cursore. Il modello:

- conta le sequenze di parole (n-grammi) delle frasi dette, fino a quattro parole, cioè tre di
  contesto, compresi l'inizio e la fine della frase;
- mescola gli ordini con il metodo di Witten-Bell;
- vincola la prima parola della proposta alle lettere già scritte, e alle parole mai dette che
  iniziano così dà il peso che hanno nel lessico italiano;
- cerca il completamento più probabile fino alla fine della frase con una ricerca a fascio di 8
  ipotesi, fino a 25 parole;
- lo propone solo se la probabilità dell'intero completamento è almeno 0,3. Non lo propone mai sul
  testo vuoto, dove lo si accetterebbe guardando nel vuoto mentre si pensa.

Per accettare la frase la si fissa per **1 s, in una sola fissazione**. L'area che accetta è la frase
con 0,8° di margine, e non scende mai sui tasti. Ogni saccade azzera il conteggio; le microsaccadi
sotto 1° e gli ammiccamenti fino a 300 ms no. Così leggere la frase non basta ad accettarla: chi legge
salta di parola in parola con saccadi di circa 2°, e le fissazioni della lettura durano circa un
quarto del tempo richiesto. Cancella, subito dopo, annulla l'accettazione.

Un messaggio si impara quando la voce sintetica lo ha detto per intero. Il tasto **parla** lo manda a
Piper, una sintesi vocale che gira sul computer. Le frasi restano in un file di testo locale, che si
può correggere a mano, e nessun dato esce dal computer.

### Che cosa potrebbe cambiare rispetto al dwell di 1 s

- **[Il tetto alla velocità](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/#un-tetto-alla-velocità).**
  Rifacendo il conto della voce sul dwell con il solo tempo di fissazione, il tetto non è più
  12 WPM: con 700 ms per ogni lettera sarebbe di circa 17 WPM, con 338 ms di circa 35 WPM, con 120 ms
  di 100 WPM. Sono limiti aritmetici, non previsioni: ignorano le saccadi, la ricerca delle lettere e
  le correzioni, che nella pratica pesano molto. Il confronto più onesto è con Mott e colleghi, che
  con un'idea simile hanno misurato circa 12,4 WPM contro 10,6, in altre condizioni.
- **[Il compromesso tra velocità ed errori](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/#il-compromesso-tra-velocità-ed-errori).**
  Con il dwell fisso il compromesso si sceglie una volta per tutte. Qui si sceglie lettera per
  lettera: veloce dove la lingua è sicura, prudente dove non lo è. La mia ipotesi è che le selezioni
  involontarie più dannose cadano sui tasti improbabili, che ora chiedono più tempo.
- **[Gli errori di ricerca](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/#gli-errori-di-ricerca).**
  Una lettera improbabile chiede 700 ms, molto più delle fissazioni tipiche della ricerca visiva, e
  dopo un errore la prudenza alza il minimo a 500 ms. Ma qui c'è anche il **rischio principale** di
  tutta la tastiera: 120 ms sono meno delle fissazioni tipiche della ricerca visiva, 180–275 ms.
  Guardare un tasto molto probabile senza volerlo scrivere può attivarlo. La protezione dipende dal
  fatto che la lingua abbia ragione e dalle regole sulle saccadi: è il primo punto da verificare.
- **[Le doppie costano il doppio](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/#le-doppie-costano-il-doppio).**
  Una doppia probabile costa 0,7 s in più, invece di un secondo intero, e uscendo e rientrando la
  seconda lettera ha di nuovo il suo tempo normale, spesso ben sotto il secondo.
- **[La precisione del tracciatore](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/#la-precisione-del-tracciatore).**
  I bersagli che si espandono allargano le aree dei tasti probabili senza ingrandirli sullo schermo; il
  nucleo centrale e il margine di 1° mantengono la tastiera prevedibile. È un modo per convivere con
  un'accuratezza imperfetta senza dover disegnare tasti ancora più grandi.
- **[La fatica](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/#la-fatica).** La maggior parte
  delle lettere chiede meno di un secondo di sguardo immobile. Con le frasi imparate, poi, un messaggio
  ricorrente si chiude con una sola fissazione invece che con una per lettera. L'accettazione della
  frase resta però un dwell di 1 s, come nella vecchia tastiera: è un compromesso tra accettazioni
  involontarie e fatica, da verificare con le persone.

Rischi e domande aperte:

- un nome o una parola rara hanno lettere "improbabili": la tastiera rallenta proprio lì, anche se
  resta sotto il secondo;
- il banco non ha la cascata di Mott: il tempo può saltare da 120 a 700 ms tra una lettera e l'altra.
  Mott e colleghi volevano evitare proprio questi salti, per non rompere il ritmo, e non so ancora se
  qui siano un problema;
- guardare le proposte costa attenzione, come mostrano Koester e Levine. La frase in grigio sta dove lo
  sguardo è già, dopo il cursore, e compare solo quando è abbastanza probabile. La mia ipotesi è che
  costi meno di un elenco da scorrere, ma va misurato.

## 3. Pupilla: separare la luce dallo sforzo

### Lo studio

Nella [voce sull'occhio](/diario/come-funziona-l-occhio-e-il-gaze-tracking/#il-diametro-della-pupilla)
avevo concluso che il diametro della pupilla va registrato, ma non usato come comando né come misura
della fatica senza controllare la luminanza. Il banco prova a controllarla. Per farlo servono tre cose
dalla letteratura: come risponde la pupilla alla luce, come risponde allo sforzo e come separare le
due risposte.

**La risposta alla luce.** Il diametro della pupilla dipende soprattutto dalla luminanza a cui l'occhio
è adattato, modulata dall'area del campo illuminato, dall'età e dal fatto che la luce arrivi a uno o a
entrambi gli occhi ([Watson e Yellott, 2012](#riferimenti)). La risposta non è istantanea. Secondo la
rassegna di Mathôt il riflesso alla luce ha una latenza minima di circa 200 ms, poi la pupilla si
stringe in fretta, mentre la dilatazione quando la luce cala è **molto più lenta** della costrizione
([Mathôt, 2018](#riferimenti)). Il riflesso è più forte per la luce al centro della vista. Perfino
spostare l'attenzione verso la parte chiara di uno schermo, senza muovere gli occhi, restringe un poco
la pupilla, anche se circa tre volte meno che guardarla direttamente.

**La risposta allo sforzo.** Durante un compito di memoria la pupilla si dilata mentre il materiale
viene presentato e si restringe mentre lo si riferisce ([Kahneman e Beatty, 1966](#riferimenti)).
Beatty, in una rassegna, ha concluso che questa risposta evocata dal compito riflette le differenze di
carico dentro uno stesso compito, tra compiti diversi e tra persone diverse ([Beatty, 1982](#riferimenti)).
È però lenta. Hoeks e Levelt l'hanno descritta come un sistema lineare, in cui gli impulsi di
attenzione si sommano, con una risposta a impulso a forma di curva gamma e parametri abbastanza
costanti tra compiti e persone ([Hoeks e Levelt, 1993](#riferimenti)). Con i parametri che ne
riportano Wierda e colleghi, il massimo arriva dopo circa 930 ms ([Wierda et al., 2012](#riferimenti)).

**Separare le due risposte.** Palinko e Kun hanno mostrato, in un simulatore di guida, che almeno in
certe situazioni si possono separare gli effetti dell'illuminazione e del carico visivo sul diametro
della pupilla ([Palinko e Kun, 2012](#riferimenti)). Pfleging e colleghi hanno fatto un passo in più
([Pfleging et al., 2016](#riferimenti)):

- hanno trattato il diametro come la **somma** di una parte dovuta alla luce e di una dovuta al carico;
- hanno usato i dati di 20 persone, con un compito di memoria uditivo (n-back) a tre livelli di
  difficoltà e sei condizioni di luce;
- conoscendo la luce e il diametro medio della persona a quella luce, il loro modello classificava
  correttamente la difficoltà nel 75% dei casi;
- tra i limiti dichiarano livelli di luce discreti, lunghe pause tra le condizioni, stime su blocchi di
  30 s e un calcolo fatto a posteriori, non in tempo reale.

Per l'uso pratico gli autori propongono proprio una calibrazione: misurare la pupilla della persona,
senza carico, davanti a schermate più chiare e più scure, e stimare la luce dalla luminanza dello
schermo attorno al punto guardato.

**Un artefatto da non dimenticare.** Vista dalla telecamera, la pupilla si accorcia quando l'occhio
ruota lontano dall'asse della telecamera: è l'errore di scorcio della pupilla (*pupil foreshortening
error*). Hayes e Petrov l'hanno mappato con occhi artificiali e un tracciatore EyeLink 1000 e hanno
trovato scostamenti grandi e sistematici al variare della posizione guardata
([Hayes e Petrov, 2016](#riferimenti)). Un modello geometrico, basato sul coseno dell'angolo tra l'asse
occhio–telecamera e l'asse occhio–stimolo, riduceva l'errore quadratico medio dell'82,5% con i
parametri presi dalle misure fisiche della postazione, e del 97,5% con i parametri ottimizzati.

### La scelta nel banco

Il banco segue lo schema additivo di Pfleging e colleghi, ma prova ad applicarlo campione per
campione, con un modello dinamico della risposta alla luce.

1. **La luce vista dalla persona.** A ogni fotogramma l'interfaccia calcola la luminanza dei pixel che
   disegna, convertiti in luce lineare, su una griglia di 48 × 27 celle. La luminanza efficace pesa al
   30% la zona entro 5° dal punto guardato e al 70% lo schermo intero. È una scelta mia, motivata dal
   fatto che il riflesso è più forte per la luce al centro della vista.
2. **Il modello della luce.** Il diametro previsto dalla sola luce è D = A + B × log₁₀(L + 0,01), con B
   negativo: più luce, pupilla più piccola. La forma logaritmica e la costante 0,01, che evita il
   logaritmo di zero, sono semplificazioni mie. La luminanza entra con un ritardo e passa per un filtro
   del primo ordine con due costanti di tempo: una per la costrizione, quando la luce aumenta, e una
   per la dilatazione, quando cala, mai più breve della prima. Sono le proprietà descritte da Mathôt.
3. **La calibrazione.** Per 30 s si guarda una croce mentre lo sfondo passa per 9 livelli di grigio,
   3,3 s ciascuno, alternando salti verso il chiaro e verso lo scuro. Il banco prova su una griglia di
   valori il ritardo (da 0,1 a 0,5 s), la costante di costrizione (da 0,1 a 0,8 s) e quella di
   dilatazione (da 0,3 a 3,5 s), e stima A e B con i minimi quadrati. Se il modello spiega meno del 60%
   della varianza (R² sotto 0,6), la compensazione è segnalata come incerta. Il modello vale per una
   persona, un monitor e una stanza, e scade dopo 12 ore, perché la luce della stanza cambia.
4. **La pulizia del segnale.** Il diametro è la media dei due occhi; con un occhio solo, si corregge con
   la differenza media tra i due. Si scartano i 120 ms dopo un ammiccamento e i salti di oltre 0,6 mm,
   e si leviga il segnale con una costante di tempo di 0,12 s.
5. **L'indice di carico.** Il residuo, cioè il diametro misurato meno quello previsto dalla luce, è
   l'indice di carico. Il valore z ne misura la componente rapida: una media mobile esponenziale di
   circa 1 s, meno una linea di base di circa 20 s, divisa per la variabilità tipica di questa
   differenza, stimata su circa 60 s e mai sotto 0,02 mm.
6. **L'uso nella selezione, come ipotesi.** Quando z è positivo, il tempo richiesto per ogni tasto si
   moltiplica per (1 + 0,25 × z), con z limitato a 2: al massimo cresce del 50%. I minimi delle regole
   sulle saccadi, sulle doppie e sulla prudenza restano quelli. Vale solo se la pupilla è valida e
   compensata, e si può spegnere per fare il confronto.

### Che cosa potrebbe cambiare rispetto al dwell di 1 s

È l'argomento più incerto dei quattro, e lo dico subito: la pupilla è lenta. La risposta allo sforzo
raggiunge il massimo dopo circa un secondo, mentre una selezione si decide in 120–700 ms. Non può
quindi decidere una singola lettera: al massimo può cambiare il passo della tastiera su una scala di
secondi.

- **[La fatica](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/#la-fatica).** Nella voce sul
  dwell, la fatica era quella riferita dai partecipanti di altri studi. Un indice di
  carico continuo, al netto della luce, permetterebbe di confrontare la vecchia e la nuova tastiera
  anche su questo, momento per momento. È l'uso che ritengo più solido: la pupilla come **misura**, non
  come comando.
- **[Il compromesso tra velocità ed errori](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/#il-compromesso-tra-velocità-ed-errori).**
  L'ipotesi è che un carico alto segnali un momento in cui la persona cerca, pensa o fatica, e in cui un
  tocco di Mida è più facile. Rallentare in quei momenti potrebbe ridurre gli errori. Con l'aumento
  massimo, una lettera molto probabile passa da 120 a 180 ms e una improbabile da 700 a 1050 ms, cioè
  oltre il secondo della vecchia tastiera.

I rischi sono concreti:

- non so in che direzione vada l'effetto: un carico alto potrebbe anche indicare concentrazione, e
  rallentare chi sta scrivendo bene;
- la luminanza è relativa, calcolata dai pixel, non misurata in candele per metro quadro: se cambiano la
  luminosità del monitor o la luce della stanza, la calibrazione va rifatta;
- l'errore di scorcio descritto da Hayes e Petrov non è compensato, anche se il banco registra lo
  sguardo, e quindi lo si potrà correggere a posteriori;
- non conosco una documentazione di Tobii sulla qualità della pupillometria del 4C. Il banco ha una
  modalità di laboratorio
  pensata per verificarla sul proprio viso: lo sfondo oscilla tra scuro e chiaro, e a tratti si fa un
  calcolo mentale. Se la compensazione funziona, il residuo deve restare piatto quando cambia la luce e
  salire durante il calcolo.

## 4. Correttore: il canale rumoroso

### Lo studio

**Il canale rumoroso.** Kernighan, Church e Gale hanno descritto un correttore ortografico basato su
un'ipotesi semplice: chi scrive sa che parola vuole, ma lungo la strada verso la tastiera si aggiunge
del rumore, sotto forma di refusi ([Kernighan et al., 1990](#riferimenti)). Per ritrovare la parola
voluta c dal refuso t si cerca la c che massimizza P(c) × P(t \| c). Il primo fattore è la probabilità
a priori della parola. Il secondo è un modello del "canale", che descrive le trasformazioni tipiche:
inserimenti, cancellazioni, sostituzioni e inversioni di lettere. Brill e Moore hanno poi migliorato
il modello del canale passando a trasformazioni generiche tra pezzi di parola
([Brill e Moore, 2000](#riferimenti)).

Per confrontare una sequenza di lettere con una parola si usa la distanza di modifica: il costo
minimo delle operazioni che trasformano una stringa nell'altra. Si calcola con la programmazione
dinamica, in un tempo proporzionale al prodotto delle due lunghezze, e gli autori indicavano già la
correzione ortografica tra le applicazioni ([Wagner e Fischer, 1974](#riferimenti)). Il decodificatore
di Goodman e colleghi, visto nella predizione, ha la stessa struttura, applicata ai tocchi invece che
alle lettere.

**Da dove prendere le frequenze.** Il fattore P(c) richiede le frequenze delle parole. New e colleghi
hanno proposto i sottotitoli dei film come approssimazione della lingua delle interazioni
([New et al., 2007](#riferimenti)). Su un corpus di 52 milioni di parole francesi, le frequenze dai
sottotitoli si confrontavano bene con altre misure della lingua parlata e scritta, e spiegavano una
parte dei tempi di riconoscimento delle parole in aggiunta a quella spiegata dalle frequenze della
lingua scritta. E un modello di lingua per la CAA funziona meglio quando somiglia alla lingua di chi
lo usa, come mostrano Vertanen e Kristensson.

**Non tradire chi scrive.** L'avvertimento di Gunawardana e colleghi sulle aree di tocco vale anche per
un correttore: un sistema troppo aggressivo può impedire di scrivere ciò che si vuole. Ne ricavo un
principio: cambiare una parola giusta è peggio che lasciare un refuso.

### La scelta nel banco

**Il lessico.** Sono le 150.000 parole più frequenti nei sottotitoli italiani di OpenSubtitles 2018
([Lison et al., 2018](#riferimenti)), dalla lista del progetto FrequencyWords, con licenza CC BY-SA 4.0
([Hermit Dave, s.d.](#riferimenti)). I sottotitoli sono trascritti in fretta, quindi al caricamento la
lista si ripulisce:

- gli accenti finali diventano obbligatori ("perche" diventa "perché", "citta" diventa "città"), ma solo
  se la forma accentata è usata davvero: "allá" non sostituisce "alla";
- i monosillabi seguono l'ortografia: e/è, si/sì e la/là restano parole distinte, "piu" diventa "più" e
  "quì" diventa "qui";
- le elisioni sono una classe chiusa ("l'", "dell'", "un'"…) e si uniscono alla parola seguente, mentre
  "po'" resta separato;
- abbreviazioni e apostrofi spuri vengono scartati.

Le forme si raggruppano secondo come si digitano su una tastiera di 26 lettere, senza accenti né
apostrofi.

**Il modello.** Allo spazio, il correttore sceglie la parola che massimizza P(parola) × P(selezioni \|
parola). Allinea le lettere selezionate con quelle di ogni parola candidata con la programmazione
dinamica, e le due sequenze possono differire in lunghezza al massimo di 3. Il canale è quello di una
tastiera a sguardo:

| Evento | Probabilità nel codice | Da dove viene l'idea |
| --- | --- | --- |
| Ogni lettera voluta produce una selezione | quella indicata dallo sguardo, più una quota uniforme del 2% | il decodificatore senza predizione dice quanto lo sguardo indicava ciascun tasto; dopo una saccade di almeno 8° si aggiunge, a metà peso, il modello dell'atterraggio corto, per cui una B raggiunta da sinistra può essere una N |
| Selezione spuria | 12% | un'occhiata di ricerca o una doppia involontaria |
| Lettera mancante | 2%; 25% per la seconda lettera di una doppia | con lo sguardo una doppia costa un gesto in più |
| Parola fuori lessico | 3% a priori | nomi e parole rare |

**La prudenza.** Per non tradire chi scrive:

- una parola del lessico con una frequenza relativa di almeno uno su un milione, cioè circa 245
  occorrenze nel corpus, non viene sostituita: al massimo prende accenti e apostrofi;
- una parola fuori lessico che "sembra italiana" non viene toccata. Il banco lo valuta con un modello a
  trigrammi di lettere: se nessun gruppo di tre lettere ha una probabilità sotto circa lo 0,7%
  (logaritmo naturale −5), la parola resta com'è. Le selezioni spurie creano sequenze che in italiano
  non esistono, mentre nomi e parole rare di solito no;
- c'è un'eccezione: le doppie saltate ("pasare" → "passare") si correggono anche quando la parola
  sembra plausibile, perché con lo sguardo sono l'errore più atteso;
- in ogni caso la correzione richiede una probabilità di almeno 0,5, e più alta di quella della parola
  così com'è stata scritta.

Cancella, subito dopo una correzione, la annulla e mette la parola nel dizionario personale, con il
peso di una parola di media frequenza (2000 occorrenze). Ciò che non si corregge da solo resta nella
**barra dei suggerimenti**: tre completamenti della parola in corso, che si selezionano con lo sguardo
come gli altri tasti della barra.

### Che cosa potrebbe cambiare rispetto al dwell di 1 s

- **[Il compromesso tra velocità ed errori](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/#il-compromesso-tra-velocità-ed-errori).**
  Con la vecchia tastiera ogni errore costa almeno due selezioni in più, cancella e la lettera giusta,
  cioè almeno 2 s di dwell più la ricerca dei tasti. Se il correttore sistema la parola allo spazio,
  l'errore non costa nessuna selezione; se la parola giusta è tra i suggerimenti, ne costa una da
  700 ms. La mia ipotesi è che un errore più economico renda accettabile una tastiera più rapida, che
  sbaglia un po' di più ma arriva prima al testo giusto.
- **[Gli errori di ricerca](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/#gli-errori-di-ricerca).**
  Le selezioni spurie sono un evento previsto dal modello: una lettera in più, entrata per
  un'occhiata, viene tolta allo spazio, se la parola senza quella lettera è abbastanza più probabile
  e se le regole di prudenza lo consentono.
- **[Le doppie costano il doppio](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/#le-doppie-costano-il-doppio).**
  Una doppia saltata si corregge, quindi chi scrive potrebbe perfino rinunciare alla seconda lettera.
  Con un limite: quando entrambe le forme sono parole vere, come "pala" e "palla", il correttore non può
  scegliere senza contesto.
- **[La precisione del tracciatore](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/#la-precisione-del-tracciatore).**
  Le sostituzioni tra tasti vicini sono pesate con lo sguardo: se la lettera selezionata era al confine
  con un'altra, anche l'altra resta una candidata seria.
- **In più**, c'è una cosa che la vecchia tastiera non poteva fare: scrivere accenti ed elisioni
  corretti con 26 lettere e lo spazio ("perche" → "perché", "l acqua" → "l'acqua").

I rischi: correggere una parola giusta resta possibile, per esempio con una flessione oltre le 150.000
parole o con un nome che "non sembra italiano"; cancella annulla la correzione e la parola si impara.
Inoltre il correttore sceglie ogni parola da sola, senza guardare le precedenti, quindi "c'e" non
diventa "c'è": la "è" resta tra i suggerimenti.

## Che cosa resta fuori

Dell'elenco di argomenti della
[voce su Tobii Race](/diario/tobii-race-un-gioco-per-mettere-alla-prova-il-4c/#che-cosa-porto-in-kite-gli-argomenti-da-approfondire)
qui ho trattato il tocco di Mida e il dwell adattivo, dentro saccadi e predizione, e la predizione con
modelli di lingua piccoli e locali. Restano fuori, per ora: la scrittura senza dwell dal percorso dello
sguardo, Dasher, lo smooth pursuit, i modelli linguistici di grandi dimensioni, la taratura del filtro
One Euro per la tastiera e lo sguardo combinato con la testa. Il banco non usa il filtro One Euro: al
suo posto fa la media dei campioni di ogni fissazione. Questi argomenti non sono entrati nella tastiera
ibrida e meritano voci a parte.

## Cosa mi porto via

Nella voce sul dwell avevo concluso che la vecchia tastiera tratta allo stesso modo tutti i tasti e
tutti i momenti della scrittura. I quattro studi vanno nella stessa direzione: usare quello che si sa
dell'occhio, della lingua e della persona per smettere di trattare tutto allo stesso modo.

| Limite della vecchia tastiera | Che cosa prova a fare la tastiera ibrida | Che cosa devo verificare |
| --- | --- | --- |
| Tetto alla velocità | tempo dalla fine della saccade; 120–700 ms secondo la lettera; frasi intere | che il tempo per carattere scenda davvero |
| Compromesso tra velocità ed errori | tempo scelto lettera per lettera; correttore; pupilla | che gli errori involontari non crescano con la velocità |
| Errori di ricerca | una selezione per fissazione; 700 ms per le lettere improbabili; prudenza dopo un errore; selezioni spurie nel correttore | le occhiate sui tasti molto probabili, il rischio principale |
| Doppie | 0,7–1,5 s secondo la predizione; doppie saltate corrette | che la doppia "tenuta" non scatti per sbaglio |
| Fatica | tempi più brevi; frasi imparate; pupilla come misura | che la compensazione della luce funzioni |
| Precisione del tracciatore | media della fissazione; bersagli che si espandono con il nucleo fisso; attesa della correttiva; sostituzioni pesate con lo sguardo | che l'espansione non assegni al vicino lo sguardo rivolto al bordo del tasto giusto |

## Limiti di questa voce

- **Nessuna misura.** Tutto ciò che riguarda Kite, in questa voce, è un'ipotesi.
- **Altre condizioni.** I risultati della letteratura vengono da altre persone, lingue, tracciatori e
  compiti: frasi inglesi con un SMI a 60 Hz (Mott), una penna su un palmare (Goodman), tocchi su un
  telefono (Gunawardana), un compito di memoria con luci controllate (Pfleging). Non si trasferiscono
  da soli al 4C e all'italiano.
- **Parametri non validati.** I valori sono quelli scritti nel codice. Molti sono scelte di progetto,
  alcune ritoccate durante lo sviluppo, e nessuno è ancora stato validato con una prova sistematica.
- **Meccanismi che interagiscono.** Un correttore efficace, per esempio, rende gli errori meno costosi,
  e potrebbe spingere a tempi più corti che producono più errori. Per questo vanno valutati anche uno
  alla volta: nel banco predizione, pupilla e correttore si possono spegnere separatamente.

## Prossimi passi

1. Preparare il protocollo per confrontare la vecchia e la nuova tastiera con persone, con il consenso
   informato, misurando WPM, tasti per carattere ed errori corretti e non corretti.
2. Valutare i meccanismi uno alla volta, spegnendo predizione, pupilla e correttore.
3. Verificare la compensazione della luce con la modalità di laboratorio della pupilla, prima di usarla
   per cambiare i tempi della tastiera.

> **Avvertenza.** Kite è un progetto sperimentale e **non è un dispositivo medico certificato**; il banco
> tobii4c-hybridbci è uno strumento di prova, non un ausilio. L'indice pupillare è un'ipotesi di
> ricerca, non una misura clinica della fatica o dello stato di salute. Chi dipende da uno strumento di
> CAA per comunicare dovrebbe avere sempre un'alternativa di riserva, per esempio una tabella alfabetica
> su carta. Le frasi imparate possono contenere informazioni personali: restano sul computer e vanno
> protette come tali. Le prove con persone richiedono il consenso informato e, quando serve, il parere
> di un comitato etico.

## Riferimenti

1. Beatty J. (1982). Task-evoked pupillary responses, processing load, and the structure of processing
   resources. *Psychological Bulletin*, 91(2), 276–292.
   [doi:10.1037/0033-2909.91.2.276](https://doi.org/10.1037/0033-2909.91.2.276)
2. Brill E., Moore R. C. (2000). An improved error model for noisy channel spelling correction. In
   *Proceedings of the 38th Annual Meeting of the Association for Computational Linguistics (ACL '00)*,
   286–293. [doi:10.3115/1075218.1075255](https://doi.org/10.3115/1075218.1075255)
3. Chen S. F., Goodman J. (1999). An empirical study of smoothing techniques for language modeling.
   *Computer Speech & Language*, 13(4), 359–394.
   [doi:10.1006/csla.1999.0128](https://doi.org/10.1006/csla.1999.0128)
4. Danielmeier C., Ullsperger M. (2011). Post-error adjustments. *Frontiers in Psychology*, 2, 233.
   [doi:10.3389/fpsyg.2011.00233](https://doi.org/10.3389/fpsyg.2011.00233) (open access)
5. Goodman J., Venolia G., Steury K., Parker C. (2002). Language modeling for soft keyboards. In
   *Proceedings of the 7th International Conference on Intelligent User Interfaces (IUI '02)*, 194–195.
   ACM. [doi:10.1145/502716.502753](https://doi.org/10.1145/502716.502753).
   [Versione liberamente accessibile](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/p194-goodman.pdf)
6. Gunawardana A., Paek T., Meek C. (2010). Usability guided key-target resizing for soft keyboards. In
   *Proceedings of the 15th International Conference on Intelligent User Interfaces (IUI '10)*, 111–118.
   ACM. [doi:10.1145/1719970.1719986](https://doi.org/10.1145/1719970.1719986).
   [Versione liberamente accessibile](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/paper-final.pdf)
7. Harris C. M. (1995). Does saccadic undershoot minimize saccadic flight-time? A Monte-Carlo study.
   *Vision Research*, 35(5), 691–701.
   [doi:10.1016/0042-6989(94)00163-G](https://doi.org/10.1016/0042-6989(94)00163-G)
8. Hayes T. R., Petrov A. A. (2016). Mapping and correcting the influence of gaze position on pupil
   size measurements. *Behavior Research Methods*, 48(2), 510–527.
   [doi:10.3758/s13428-015-0588-x](https://doi.org/10.3758/s13428-015-0588-x) (open access su
   [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4637269/))
9. Hermit Dave (s.d.). *FrequencyWords*: liste di frequenza delle parole ricavate da OpenSubtitles,
   lista italiana 2018. Dataset, contenuti con licenza CC BY-SA 4.0.
   [github.com/hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords)
10. Hoeks B., Levelt W. J. M. (1993). Pupillary dilation as a measure of attention: a quantitative
    system analysis. *Behavior Research Methods, Instruments, & Computers*, 25(1), 16–26.
    [doi:10.3758/BF03204445](https://doi.org/10.3758/BF03204445)
11. Jacob R. J. K. (1991). The use of eye movements in human-computer interaction techniques: what
    you look at is what you get. *ACM Transactions on Information Systems*, 9(2), 152–169.
    [doi:10.1145/123078.128728](https://doi.org/10.1145/123078.128728)
12. Kahneman D., Beatty J. (1966). Pupil diameter and load on memory. *Science*, 154(3756),
    1583–1585. [doi:10.1126/science.154.3756.1583](https://doi.org/10.1126/science.154.3756.1583)
13. Kernighan M. D., Church K. W., Gale W. A. (1990). A spelling correction program based on a noisy
    channel model. In *Proceedings of the 13th International Conference on Computational Linguistics
    (COLING 1990)*, vol. 2, 205–210.
    [doi:10.3115/997939.997975](https://doi.org/10.3115/997939.997975)
14. Koester H. H., Levine S. P. (1994). Modeling the speed of text entry with a word prediction
    interface. *IEEE Transactions on Rehabilitation Engineering*, 2(3), 177–187.
    [doi:10.1109/86.331567](https://doi.org/10.1109/86.331567)
15. Lison P., Tiedemann J., Kouylekov M. (2018). OpenSubtitles2018: statistical rescoring of sentence
    alignments in large, noisy parallel corpora. In *Proceedings of the Eleventh International
    Conference on Language Resources and Evaluation (LREC 2018)*. ELRA.
    [aclanthology.org/L18-1275](https://aclanthology.org/L18-1275/) (open access)
16. Mathôt S. (2018). Pupillometry: psychology, physiology, and function. *Journal of Cognition*,
    1(1), 16. [doi:10.5334/joc.18](https://doi.org/10.5334/joc.18) (open access)
17. McGuffin M., Balakrishnan R. (2002). Acquisition of expanding targets. In *Proceedings of the
    SIGCHI Conference on Human Factors in Computing Systems (CHI '02)*, 57–64. ACM.
    [doi:10.1145/503376.503388](https://doi.org/10.1145/503376.503388)
18. Miniotas D., Špakov O., MacKenzie I. S. (2004). Eye gaze interaction with expanding targets. In
    *CHI '04 Extended Abstracts on Human Factors in Computing Systems*, 1255–1258. ACM.
    [doi:10.1145/985921.986037](https://doi.org/10.1145/985921.986037)
19. Mott M. E., Williams S., Wobbrock J. O., Morris M. R. (2017). Improving dwell-based gaze typing
    with dynamic, cascading dwell times. In *Proceedings of the 2017 CHI Conference on Human Factors in
    Computing Systems (CHI '17)*, 2558–2570. ACM.
    [doi:10.1145/3025453.3025517](https://doi.org/10.1145/3025453.3025517).
    [Versione liberamente accessibile](https://faculty.washington.edu/wobbrock/pubs/chi-17.02.pdf)
20. New B., Brysbaert M., Veronis J., Pallier C. (2007). The use of film subtitles to estimate word
    frequencies. *Applied Psycholinguistics*, 28(4), 661–677.
    [doi:10.1017/S014271640707035X](https://doi.org/10.1017/S014271640707035X) (open access)
21. Nyström M., Holmqvist K. (2010). An adaptive algorithm for fixation, saccade, and glissade
    detection in eyetracking data. *Behavior Research Methods*, 42(1), 188–204.
    [doi:10.3758/BRM.42.1.188](https://doi.org/10.3758/BRM.42.1.188)
22. Palinko O., Kun A. L. (2012). Exploring the effects of visual cognitive load and illumination on
    pupil diameter in driving simulators. In *Proceedings of the Symposium on Eye Tracking Research and
    Applications (ETRA '12)*, 413–416. ACM.
    [doi:10.1145/2168556.2168650](https://doi.org/10.1145/2168556.2168650)
23. Pfleging B., Fekety D. K., Schmidt A., Kun A. L. (2016). A model relating pupil diameter to mental
    workload and lighting conditions. In *Proceedings of the 2016 CHI Conference on Human Factors in
    Computing Systems (CHI '16)*, 5776–5788. ACM.
    [doi:10.1145/2858036.2858117](https://doi.org/10.1145/2858036.2858117).
    [Versione degli autori](https://www.medien.informatik.uni-muenchen.de/pubdb/publications/pub/pfleging2016workload/pfleging2016workload.pdf)
24. Rayner K. (2009). The 35th Sir Frederick Bartlett Lecture: eye movements and attention in
    reading, scene perception, and visual search. *Quarterly Journal of Experimental Psychology*,
    62(8), 1457–1506. [doi:10.1080/17470210902816461](https://doi.org/10.1080/17470210902816461)
25. Tian J., Ying H. S., Zee D. S. (2013). Revisiting corrective saccades: role of visual feedback.
    *Vision Research*, 89, 54–64.
    [doi:10.1016/j.visres.2013.07.012](https://doi.org/10.1016/j.visres.2013.07.012) (manoscritto
    degli autori su [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3784029/))
26. Todman J., Alm N., Higginbotham J., File P. (2008). Whole utterance approaches in AAC.
    *Augmentative and Alternative Communication*, 24(3), 235–254.
    [doi:10.1080/08990220802388271](https://doi.org/10.1080/08990220802388271)
27. Trnka K., McCaw J., Yarrington D., McCoy K. F., Pennington C. (2009). User interaction with word
    prediction: the effects of prediction quality. *ACM Transactions on Accessible Computing*, 1(3),
    1–34. [doi:10.1145/1497302.1497307](https://doi.org/10.1145/1497302.1497307)
28. Vertanen K., Kristensson P. O. (2011). The imagination of crowds: conversational AAC language
    modeling using crowdsourcing and large data sources. In *Proceedings of the 2011 Conference on
    Empirical Methods in Natural Language Processing (EMNLP 2011)*, 700–711. ACL.
    [aclanthology.org/D11-1065](https://aclanthology.org/D11-1065/) (open access)
29. Voloh B., Watson M. R., König S., Womelsdorf T. (2020). MAD saccade: statistically robust saccade
    threshold estimation via the median absolute deviation. *Journal of Eye Movement Research*, 12(8).
    [doi:10.16910/jemr.12.8.3](https://doi.org/10.16910/jemr.12.8.3) (open access)
30. Wagner R. A., Fischer M. J. (1974). The string-to-string correction problem. *Journal of the ACM*,
    21(1), 168–173. [doi:10.1145/321796.321811](https://doi.org/10.1145/321796.321811)
31. Watson A. B., Yellott J. I. (2012). A unified formula for light-adapted pupil size. *Journal of
    Vision*, 12(10), 12. [doi:10.1167/12.10.12](https://doi.org/10.1167/12.10.12) (open access)
32. Wierda S. M., van Rijn H., Taatgen N. A., Martens S. (2012). Pupil dilation deconvolution reveals
    the dynamics of attention at high temporal resolution. *Proceedings of the National Academy of
    Sciences*, 109(22), 8456–8460.
    [doi:10.1073/pnas.1201858109](https://doi.org/10.1073/pnas.1201858109) (open access su
    [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3365158/))
33. Witten I. H., Bell T. C. (1991). The zero-frequency problem: estimating the probabilities of novel
    events in adaptive text compression. *IEEE Transactions on Information Theory*, 37(4), 1085–1094.
    [doi:10.1109/18.87000](https://doi.org/10.1109/18.87000)
