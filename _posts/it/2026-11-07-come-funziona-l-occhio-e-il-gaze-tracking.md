---
ref: eye-and-gaze-tracking-for-typing
project: kite
kind: explainer
authors: [Antonio Blescia, Bones]
title: "Come funziona l'occhio e cosa misura un eye tracker quando scriviamo con lo sguardo"
description: Fovea, saccadi, fissazioni, riflesso corneale e pupilla. Le proprietà dell'occhio e del tracciatore che contano davvero per progettare una tastiera a sguardo, e come si misura se funziona.
tags: [occhio, eye-tracking, caa, scrittura-assistita, tastiera-virtuale]
---

Nella [voce sul dwell time](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/) ho raccontato
come funzionava la prima tastiera a sguardo di [Kite](/ricerche/kite/), il mio strumento aperto di
Comunicazione Aumentativa e Alternativa (CAA). Prima di progettare un meccanismo nuovo voglio
fermarmi sulle basi: **come è fatto l'occhio**, **come si muove** e **che cosa riesce davvero a
leggere un tracciatore oculare** (*eye tracker*).

Questa voce è una divulgazione. Non contiene misure mie: tutti i numeri vengono dalla letteratura
citata, con le condizioni in cui sono stati ottenuti. Quando scrivo un'idea mia lo dico in modo
esplicito.

## Il problema

Una tastiera a sguardo deve rispondere a due domande, decine di volte al minuto: **dove** sta
guardando la persona e **se** vuole davvero premere quel tasto. La prima domanda dipende
dall'anatomia dell'occhio e dalla qualità del tracciatore. La seconda dipende da come si muove
l'occhio e da quali segnali volontari restano disponibili alla persona.

Conoscere questi limiti serve a scegliere le cose giuste: quanto grandi fare i tasti, quanto
lungo il dwell, se usare il battito di palpebre, che cosa registrare durante le prove.

## Com'è fatto l'occhio, in breve

![Sezione orizzontale dell'occhio destro con le etichette in inglese: cornea, iride, pupilla, cristallino, corpo vitreo, retina, fovea centrale, disco ottico, nervo ottico, muscoli retto laterale e retto mediale.](https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/1413_Structure_of_the_Eye.jpg/960px-1413_Structure_of_the_Eye.jpg)

*Struttura dell'occhio. La luce entra da destra, attraversa cornea (cornea), pupilla (pupil) e
cristallino (lens) e arriva sulla retina; la fovea centrale (fovea centralis) è la piccola fossetta
sull'asse visivo. Immagine: OpenStax College, Anatomy & Physiology, licenza
[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), da
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:1413_Structure_of_the_Eye.jpg).*

Seguiamo il percorso della luce ([Betts et al., 2022](#riferimenti)):

1. La **cornea** è la superficie trasparente sul davanti dell'occhio. Lascia entrare la luce e,
   insieme al cristallino, la mette a fuoco.
2. L'**iride** è la parte colorata. Al centro ha un'apertura, la **pupilla**, che si stringe con la
   luce intensa e si allarga al buio. Il suo diametro varia più o meno tra 2 e 8 mm
   ([Mathôt, 2018](#riferimenti)).
3. Il **cristallino** è una lente che cambia forma per mettere a fuoco a distanze diverse.
4. La **retina** riveste il fondo dell'occhio e contiene i fotorecettori: i bastoncelli, sensibili
   alla luce debole, e i coni, che lavorano con più luce e vedono i colori.
5. Al centro della retina c'è la **fovea**, una piccola fossetta dove la vista è più nitida.

**Perché conta per la scrittura.** Un tracciatore remoto vede proprio cornea, iride e pupilla, cioè
la parte anteriore dell'occhio. Non vede la fovea, che è il punto che conta davvero. Deve quindi
ricostruire la direzione dello sguardo in modo indiretto, come spiego più avanti.

### La fovea: vediamo nitido solo al centro

![Grafico della densità dei fotorecettori nella retina umana in funzione dell'angolo dalla fovea: i coni (linea blu) hanno un picco stretto a 0°, i bastoncelli (linea rossa tratteggiata) sono assenti al centro e massimi attorno a 20°; verso il lato del naso c'è il punto cieco, senza recettori.](https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Human_photoreceptor_distribution.svg/960px-Human_photoreceptor_distribution.svg.png)

*Densità di coni (linea continua blu) e bastoncelli (linea tratteggiata rossa) lungo una linea che
passa per la fovea e il punto cieco. Immagine: Cmglee, basata su "Foundations of Vision" di
B. A. Wandell, licenza [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), da
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Human_photoreceptor_distribution.svg).*

Il grafico mostra perché la fovea è speciale: i coni sono concentrati in un picco strettissimo
attorno a 0°, e già a pochi gradi di distanza la loro densità crolla.

Per misurare la retina si usano gli stessi gradi dell'angolo visivo: sulla retina umana 1°
corrisponde a circa 0,3 mm ([Provis et al., 2013](#riferimenti)). Le dimensioni della fovea dipendono
dalla definizione che si usa. Secondo la rassegna di Strasburger e colleghi, la fovea ha
un diametro di circa 5,2°; quando però si parla di "visione foveale" ci si riferisce di solito alla
**foveola**, la parte centrale, che ha un diametro di circa **1°** ([Strasburger et al., 2011](#riferimenti)).
La stessa rassegna chiama "foveale" la visione entro 2° dal centro. Per questo si dice spesso che
la visione davvero nitida copre solo **1–2° di angolo visivo**.

Per avere un'idea: a 65 cm dallo schermo, 1° corrisponde a poco più di 1 cm (lo calcolo più avanti).

**Perché conta per la scrittura.** Per leggere una lettera dobbiamo portarla sulla fovea, quindi
spostiamo gli occhi su ciò che ci interessa. È questo che rende lo sguardo un buon puntatore.
Ma la fovea ha un'estensione: per vedere nitida una lettera non serve puntarla con una precisione
migliore di circa 1°. Per questo, e per i limiti della telecamera, un tracciatore remoto non può
essere molto più accurato di circa 0,5° ([Majaranta et al., 2006](#riferimenti)). È un limite
dell'occhio, non solo della tecnologia.

### I muscoli che muovono l'occhio

![Due viste dell'occhio destro, laterale e frontale, con i sei muscoli extraoculari: retto superiore, inferiore, mediale e laterale, obliquo superiore con la sua troclea e obliquo inferiore. Le frecce rosse nella vista frontale indicano la direzione di trazione di ciascun muscolo.](https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/1412_Extraocular_Muscles.jpg/960px-1412_Extraocular_Muscles.jpg)

*I muscoli extraoculari dell'occhio destro, visti di lato (a sinistra) e di fronte (a destra).
Immagine: OpenStax College, Anatomy & Physiology, licenza
[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), da
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:1412_Extraocular_Muscles.jpg).*

Ogni occhio è mosso da **sei muscoli extraoculari**: quattro muscoli retti (superiore, inferiore,
mediale e laterale) e due obliqui (superiore e inferiore). Un settimo muscolo, l'elevatore della
palpebra superiore, non muove l'occhio ma solleva la palpebra ([Betts et al., 2022](#riferimenti)).

**Perché conta per la scrittura.** Nella sclerosi laterale amiotrofica (SLA) i movimenti oculari
sono in genere relativamente risparmiati. In uno studio longitudinale su 61 persone con SLA la
funzione saccadica di base era normale ([Proudfoot et al., 2016](#riferimenti)). È per questo che lo
sguardo è uno dei canali più usati nella CAA. Il muscolo della palpebra, invece, è il motivo per
cui una palpebra cadente (ptosi) può coprire la pupilla e disturbare il tracciatore: ci torno nella
sezione sui limiti.

## Come si muove l'occhio

L'occhio non scorre in modo continuo sullo schermo: salta, si ferma, trema. Ogni tipo di movimento
ha un ruolo diverso per una tastiera a sguardo.

| Movimento | Cosa fa | Valori tipici | Cosa significa per la tastiera |
| --- | --- | --- | --- |
| **Fissazione** | Lo sguardo resta su un punto | Di solito 200–600 ms ([Majaranta et al., 2006](#riferimenti)); da meno di 100 ms a diversi secondi ([Feit et al., 2017](#riferimenti)) | È il momento in cui l'occhio "legge" un tasto. Il dwell deve durare più di una fissazione normale |
| **Saccade** | Salto rapido da una fissazione all'altra | Circa 30–80 ms ([Feit et al., 2017](#riferimenti)) | Durante il salto lo sguardo attraversa altri tasti: non devono attivarsi |
| **Microsaccadi** | Piccoli salti durante una fissazione | 1–3 al secondo, di solito sotto 0,5°, a volte fino a 1° o più ([Otero-Millan et al., 2014](#riferimenti)) | Il punto di sguardo "salta" anche quando la persona crede di stare ferma |
| **Deriva** (*drift*) | Scivolamento lento tra due microsaccadi | Di solito sotto 0,13° e sotto 0,5°/s ([Otero-Millan et al., 2014](#riferimenti)) | Sposta piano il punto vicino ai bordi del tasto |
| **Tremore** | Oscillazione minuscola e veloce | Pochi secondi d'arco, attorno a 90 Hz ([Otero-Millan et al., 2014](#riferimenti)) | Troppo piccolo per un tracciatore comune: finisce nel rumore |
| **Inseguimento lento** (*smooth pursuit*) | L'occhio segue un oggetto in movimento | Serve un bersaglio che si muove ([Vidal et al., 2013](#riferimenti)) | Permette di selezionare oggetti mobili confrontando le traiettorie, senza una calibrazione accurata |
| **Vergenza** | I due occhi ruotano in versi opposti per guardare vicino o lontano | Compensa la disparità tra i due occhi ([Otero-Millan et al., 2014](#riferimenti)) | Con uno schermo a distanza fissa dovrebbe contare poco |
| **Ammiccamento** | La palpebra si chiude e si riapre | In BlinkWrite i battiti sotto 200 ms sono trattati come involontari ([MacKenzie e Ashtiani, 2011](#riferimenti)) | Per qualche istante il tracciatore non vede la pupilla |

Qualche numero in più sulle saccadi. In uno studio su nove persone, saccadi di circa 9° in media
avevano velocità di picco medie tra circa 160 e 410°/s e durate medie tra 31 e 68 ms
([Gibaldi e Sabatini, 2021](#riferimenti)). Sono movimenti velocissimi: un occhio può
attraversare mezza tastiera in pochi centesimi di secondo.

I tre movimenti di fissazione (microsaccadi, deriva e tremore) spiegano perché il punto di sguardo
non sta mai fermo. Nella vecchia tastiera di Kite c'era una tolleranza di 100 ms per lo sguardo che
usciva per un attimo dal tasto, e di 300 ms per la perdita del segnale durante un battito di
palpebre ([voce sul dwell time](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/)): servivano
proprio a questo.

### Fissazioni e saccadi, viste dall'alto

![Una pagina di testo in svedese con sovrapposto il percorso dello sguardo di un lettore: cerchi viola sulle parole indicano le fissazioni, linee viola che li collegano indicano le saccadi; il percorso procede riga per riga da sinistra a destra e torna a capo con una lunga saccade.](https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Reading_Fixations_Saccades.jpg/960px-Reading_Fixations_Saccades.jpg)

*Il percorso dello sguardo (scanpath) durante la lettura veloce di un testo. Dati registrati nel 2005
allo Humanistlaboratoriet dell'Università di Lund con un tracciatore video a riflesso corneale
SMI iView X a 240 Hz. Immagine: Lucs-kho su Wikipedia in inglese,
[pubblico dominio](https://commons.wikimedia.org/wiki/File:Reading_Fixations_Saccades.jpg), da
Wikimedia Commons.*

L'immagine mostra un **percorso di scansione** (*scanpath*): i cerchi sono le fissazioni, le linee
sono le saccadi. Si vede che chi legge non si ferma su ogni lettera, ma su alcune parole, e salta
tutto il resto.

**Perché conta per la scrittura.** Con una tastiera a sguardo chiediamo all'occhio una cosa diversa
dalla lettura: fermarsi su **ogni** lettera, a lungo. È un compito innaturale, e questo è uno dei
motivi della fatica di cui parlo più avanti. Un percorso come questo, registrato sulla tastiera di
Kite, mostrerebbe dove lo sguardo cerca le lettere prima di sceglierle.

## Come un tracciatore "vede" lo sguardo

### Pupilla e riflesso corneale

I tracciatori remoti più diffusi sono **video-oculografi** basati sul metodo **pupilla-riflesso
corneale** (in inglese *pupil center corneal reflection*, PCCR). È il metodo più comune per stimare
il punto guardato ([Feit et al., 2017](#riferimenti)). Funziona così:

1. Uno o più illuminatori a **infrarosso vicino** illuminano il viso. È una luce invisibile, quindi
   non disturba la vista.
2. Una telecamera sensibile all'infrarosso riprende l'occhio.
3. Il software trova il **centro della pupilla** e il **riflesso** dell'illuminatore sulla cornea,
   un puntino luminoso chiamato *glint*.
4. Quando l'occhio ruota, la pupilla si sposta rispetto al riflesso. Il vettore tra i due centri
   cambia con la direzione dello sguardo.
5. Una **calibrazione**, in cui la persona guarda alcuni punti noti sullo schermo, insegna al
   sistema a trasformare quel vettore in coordinate sullo schermo.

La teoria generale di questo metodo dice una cosa importante per chi usa una carrozzina
([Guestrin e Eizenman, 2006](#riferimenti)):

- con **una telecamera e una sola sorgente di luce**, il punto guardato si può stimare solo se la
  testa resta **completamente ferma**;
- con **una telecamera e più sorgenti**, la testa si può muovere, dopo una calibrazione su più punti;
- con **più telecamere e più sorgenti** basta una calibrazione su un solo punto.

Gli stessi autori indicano le principali fonti di errore: la cornea reale non è una sfera perfetta,
come assume il modello, e c'è rumore nella stima dei centri della pupilla e del riflesso.

### Le immagini di Purkinje

![Schema dell'occhio in sezione con un raggio di luce rosso che entra dalla destra e quattro frecce verdi, P1, P2, P3 e P4, che indicano i riflessi prodotti dalle superfici di cornea e cristallino.](https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Diagram_of_four_Purkinje_images.svg/960px-Diagram_of_four_Purkinje_images.svg.png)

*Le quattro immagini di Purkinje: i riflessi della stessa luce sulle superfici di cornea e
cristallino. Immagine: Z22, licenza [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/),
da [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Diagram_of_four_Purkinje_images.svg).*

Una luce che colpisce l'occhio si riflette su ogni superficie che attraversa: davanti e dietro la
cornea, davanti e dietro il cristallino. Ne nascono quattro riflessi, chiamati **immagini di
Purkinje** (P1–P4). Il *glint* dei tracciatori PCCR è il primo, P1, il riflesso sulla superficie
esterna della cornea. Esistono anche tracciatori da laboratorio, detti a doppia immagine di
Purkinje, che sfruttano due di questi riflessi ([Crane e Steele, 1985](#riferimenti)).

**Perché conta per la scrittura.** Il riflesso corneale deve cadere sulla cornea e restare visibile.
Feit e colleghi segnalano che montature spesse, mascara pesante e riflessi possono
peggiorare la qualità del tracciamento ([Feit et al., 2017](#riferimenti)).

### Pupilla chiara e pupilla scura

![Immagine all'infrarosso di un occhio con la pupilla che appare come un disco bianco luminoso.](https://upload.wikimedia.org/wikipedia/commons/1/1c/Bright_pupil_by_infrared_or_near_infrared_illumination.jpg)

![Immagine all'infrarosso dello stesso tipo di occhio con la pupilla nera e, dentro la pupilla, un piccolo punto bianco: il riflesso corneale.](https://upload.wikimedia.org/wikipedia/commons/c/cb/Dark_pupil_by_infrared_or_near_infrared_illumination.jpg)

*Sopra: pupilla chiara, con l'illuminatore infrarosso vicino all'asse della telecamera. Sotto:
pupilla scura, con l'illuminatore spostato di lato; il puntino bianco è il glint. Immagini: Massimo
Gneo, Maurizio Schmid, Silvia Conforto e Tommaso D'Alessio, dalla figura 1 di
[Gneo et al. (2012)](#riferimenti), licenza [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/),
da Wikimedia Commons ([pupilla chiara](https://commons.wikimedia.org/wiki/File:Bright_pupil_by_infrared_or_near_infrared_illumination.jpg),
[pupilla scura](https://commons.wikimedia.org/wiki/File:Dark_pupil_by_infrared_or_near_infrared_illumination.jpg)).*

Se la luce infrarossa parte **vicino all'asse della telecamera**, la telecamera raccoglie la luce
riflessa dall'interno dell'occhio e la pupilla appare **chiara**. È lo stesso effetto degli occhi
rossi nelle foto con il flash. Se la luce parte **di lato**, la pupilla appare **scura**. In tutti e
due i casi il riflesso corneale si vede come un punto luminoso
([Morimoto et al., 2000](#riferimenti)).

L'intensità della pupilla chiara varia molto da persona a persona
([Nguyen et al., 2002](#riferimenti)). Per questo alcuni sistemi alternano le due illuminazioni e
confrontano le immagini: Morimoto e colleghi riportano che il loro metodo funziona anche con chi
porta gli occhiali e con diverse condizioni di luce.

**Perché conta per la scrittura.** Un tracciatore che funziona bene con me può funzionare peggio
con un'altra persona per ragioni puramente ottiche. Nelle prove di Kite dovrò sempre annotare
occhiali, lenti e illuminazione.

### L'elettro-oculografia: il ponte con l'EEG

C'è un secondo modo di misurare gli occhi, più vicino al mondo delle Brain Computer Interface
(BCI): l'**elettro-oculografia** (EOG). L'occhio si comporta come un piccolo dipolo elettrico, con
la cornea positiva e la retina negativa. Quando l'occhio ruota, il dipolo cambia orientamento e
gli elettrodi sulla pelle attorno agli occhi misurano una variazione di tensione. Durante un
battito di palpebre, la palpebra scivola sulla cornea e produce un artefatto ancora più grande
([Plöchl et al., 2012](#riferimenti)).

Per chi registra l'elettroencefalografia (EEG) questi segnali sono un disturbo. Sugli elettrodi
frontali un battito di palpebre produce un artefatto di circa 100 µV, e gli artefatti oculari possono
rendere l'analisi dei dati difficile o addirittura impossibile ([Plöchl et al., 2012](#riferimenti)).
Per chi progetta ausili possono invece essere un comando: già nel 2002 un gruppo di ricerca descriveva una carrozzina
elettrica guidata con l'EOG ([Barea et al., 2002](#riferimenti)).

Il prototipo di [SmartChair](/ricerche/smartchair/) del 2014 usava un battito di palpebre, letto
dalla cuffia EEG NeuroSky MindWave Mobile, per cambiare il dispositivo selezionato. **La mia ipotesi**
è che la cuffia riconoscesse proprio questo artefatto oculare più che un segnale cerebrale. Non
l'ho verificato, ed è una cosa che voglio controllare.

## Che cosa leggere: le proprietà che contano per scrivere

### Accuratezza e precisione

Sono le due misure fondamentali della qualità di un tracciatore, e non sono la stessa cosa
([Feit et al., 2017](#riferimenti); [Niehorster et al., 2018](#riferimenti)):

- **accuratezza**: la distanza media tra il punto che la persona guarda davvero e il punto che il
  tracciatore riporta. È un errore sistematico, come un mirino storto;
- **precisione**: quanto si sparpagliano i campioni quando lo sguardo è fermo su un punto. È un
  errore casuale, come una mano che trema.

Entrambe si esprimono in **gradi di angolo visivo**. Un tracciatore può essere preciso ma
inaccurato (punti stretti tra loro, ma nel posto sbagliato) o il contrario.

I valori dei cataloghi vanno presi con cautela. I produttori riportano spesso un'accuratezza sotto
0,5°, ma con i tracciatori remoti l'errore supera spesso 1° anche in condizioni controllate
([Feit et al., 2017](#riferimenti)). Un produttore dichiarava che le sue accuratezze erano
misurate in condizioni ideali: testa ferma su una mentoniera, subito dopo la calibrazione, luce
costante, su soggetti senza lenti, occhiali o palpebre cadenti ([Niehorster et al., 2018](#riferimenti)).
Cioè proprio senza le condizioni che si incontrano con molti utenti di CAA.

Lo studio di Feit e colleghi è il più utile che ho trovato per una tastiera a sguardo. Hanno
registrato 80 persone con due tracciatori a 60 Hz, in due condizioni di luce, a 65 cm dallo schermo
([Feit et al., 2017](#riferimenti)). Alcuni risultati:

- accuratezza e precisione variavano **più di sei volte** tra persone e bersagli;
- al 25° percentile le fissazioni erano a 0,15 cm (orizzontale) e 0,2 cm (verticale) dal bersaglio,
  al 90° percentile lo scarto arrivava a 0,93 cm e 1,19 cm;
- l'errore era in media un po' più grande in verticale che in orizzontale;
- la precisione era peggiore verso il bordo inferiore e il bordo destro dello schermo.

Gli autori hanno ripetuto la prova con sei persone con SLA che comunicano ogni giorno con la CAA a
sguardo, negli ambienti e con le postazioni che usano di solito. La precisione era simile, ma
l'accuratezza variava ancora di più: da 0,16–0,21 cm nei casi migliori a 1,32–1,67 cm nei peggiori.

### Dai gradi ai centimetri: quanto grandi fare i tasti

Un errore in gradi diventa un errore in centimetri in base alla distanza tra occhi e schermo. La
formula è semplice: la dimensione sullo schermo è uguale a 2 × distanza × tan(angolo / 2). In
pratica:

| Distanza occhi–schermo | 0,5° sullo schermo | 1° sullo schermo | 2° sullo schermo |
| --- | --- | --- | --- |
| 50 cm | 0,44 cm | 0,87 cm | 1,75 cm |
| 60 cm | 0,52 cm | 1,05 cm | 2,09 cm |
| 65 cm | 0,57 cm | 1,13 cm | 2,27 cm |
| 70 cm | 0,61 cm | 1,22 cm | 2,44 cm |
| 80 cm | 0,70 cm | 1,40 cm | 2,79 cm |

*Valori calcolati con la formula sopra. A 65 cm il risultato coincide con quello riportato da Feit
e colleghi (1° ≈ 1,1 cm).*

Feit e colleghi propongono una regola per dimensionare i bersagli. La larghezza (o l'altezza) del
tasto è il doppio della somma tra l'errore di accuratezza e due volte la deviazione standard della
precisione: S = 2 × (O + 2σ). Così circa il 95% dei campioni di una fissazione cade dentro il
tasto. Con i loro dati medi la regola dà tasti di circa 3,0 × 3,1 cm. Le loro raccomandazioni
([Feit et al., 2017](#riferimenti)):

- tasti di almeno **1,9 × 2,35 cm** permettono un'interazione affidabile per almeno il 75% delle
  persone, se il segnale viene filtrato bene;
- senza filtro servono almeno **3,28 × 3,78 cm**;
- meglio tasti un po' più alti che larghi, perché l'errore verticale è maggiore;
- meglio evitare elementi da guardare vicino al bordo inferiore e al bordo destro.

Tasti così grandi occupano molto spazio. Feit e colleghi mostrano come esempio una tastiera che, con
un tracciamento scarso, si sposta in alto e raggruppa le lettere; i menu gerarchici sono un'altra
soluzione, che però rallenta perché richiede più passaggi ([Feit et al., 2017](#riferimenti)).

Nella vecchia tastiera di Kite i tasti occupavano quasi tutto lo schermo, ma non ho ancora misurato
la loro dimensione in centimetri né la distanza di uso.
[DA COMPLETARE: diagonale dello schermo usato con Kite, distanza tipica tra occhi e schermo e
dimensione dei tasti in cm, così da confrontarla con le raccomandazioni di Feit et al.]

### Frequenza di campionamento e latenza

La **frequenza di campionamento** è il numero di punti di sguardo al secondo. I tracciatori remoti
lavorano di solito tra 30 e 60 Hz ([Feit et al., 2017](#riferimenti)); il Tobii Eye Tracker 4C che
uso con Kite fornisce 90 campioni al secondo.

Per studiare le saccadi servono frequenze alte. Su una saccade di 10°, a 200 Hz l'errore nella
misura della durata è di circa ±5 ms, circa il 12% della durata; a 50 Hz diventa ±20 ms, quasi metà
della saccade ([Gibaldi e Sabatini, 2021](#riferimenti)). Una tastiera a dwell, però, lavora su tempi
di centinaia di millisecondi. Il mio ragionamento è che per il dwell bastino frequenze modeste,
mentre per metodi che analizzano la forma dei movimenti la frequenza diventi importante.

La **latenza** è il ritardo tra il movimento dell'occhio e il dato che arriva al programma. Una parte
la introducono i filtri usati per rendere stabile il punto. Il filtro migliore nello studio di Feit
aggiungeva circa due campioni di ritardo, cioè circa 32 ms a 60 Hz, e riduceva fino al 42% la
dimensione necessaria dei tasti ([Feit et al., 2017](#riferimenti)). È un compromesso: più
stabilità, più ritardo. Kristensson e Vertanen, invece, usavano il segnale grezzo proprio per
eliminare il ritardo quando lo sguardo si sposta in fretta ([Kristensson e Vertanen, 2012](#riferimenti)).

### Calibrazione e deriva

La calibrazione dura pochi secondi, ma non vale per sempre. Con l'uso il punto misurato tende ad
allontanarsi da quello reale (*drift*), in parte per la tecnologia e in parte per l'interazione tra
movimenti della testa e degli occhi ([Majaranta et al., 2006](#riferimenti)). Negli esperimenti si
ricalibra all'inizio di ogni giornata di prove e poi quando serve ([Kurauchi et al., 2016](#riferimenti)).

La calibrazione presuppone che la persona sappia tenere lo sguardo fermo su ogni punto. Con il
**nistagmo**, un movimento oscillatorio involontario degli occhi, questo non succede, e diventa
incerto dove la persona stia guardando davvero. Esistono metodi di calibrazione pensati apposta
([Rosengren et al., 2020](#riferimenti)).

### Dwell time e tocco di Mida

Ne ho parlato a lungo nella [voce precedente](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/).
In sintesi: gli occhi servono a guardare, quindi se ogni sguardo fosse un clic ogni occhiata
diventerebbe un comando. È il problema del "tocco di Mida" ([Jacob, 1991](#riferimenti)). Il dwell
lo risolve chiedendo uno sguardo fermo più lungo di una fissazione normale. Utenti esperti possono
scendere attorno a 300 ms, ma solo se i tasti sono abbastanza grandi per la qualità del
tracciamento ([Feit et al., 2017](#riferimenti)). Dimensione dei tasti e durata del dwell vanno
quindi scelte insieme.

### Il battito di palpebre come clic

Il battito di palpebre è un'alternativa al dwell. Il problema è distinguere quello **volontario** da
quello **spontaneo**. BlinkWrite, una tastiera a scansione comandata solo con le palpebre, usa la
durata della chiusura ([MacKenzie e Ashtiani, 2011](#riferimenti)):

| Durata della chiusura | Significato in BlinkWrite |
| --- | --- |
| meno di 200 ms | battito involontario, ignorato |
| da 200 a 500 ms | selezione della lettera |
| oltre 500 ms | cancellazione |

Con 12 volontari tra 23 e 31 anni, non ancora gli utenti a cui il sistema è destinato, la velocità
media è stata di 4,8 parole al minuto, con un'accuratezza superiore al 97%. Il 75% dei partecipanti
ha però riferito un affaticamento degli occhi superiore alla media. Gli autori pensano a persone,
per esempio con sindrome locked-in, per cui i movimenti degli occhi sono limitati e poco affidabili
e il battito di palpebre può restare l'unico canale oculare utilizzabile. Ricordano anche che la
capacità di controllarlo va verificata clinicamente, per esempio nelle fasi avanzate della SLA.

### Il diametro della pupilla

La pupilla risponde a tre cose: si stringe con la luce, si stringe quando guardiamo vicino, e si
allarga con l'attivazione e lo **sforzo mentale** ([Mathôt, 2018](#riferimenti)). L'idea di usarla
come indicatore di carico cognitivo o di fatica è quindi sensata.

Su uno schermo, però, la luminosità cambia di continuo con ciò che si guarda, e la risposta alla
luce si somma a quella allo sforzo, che è un effetto piccolo ([Mathôt, 2018](#riferimenti)). La mia
conclusione, per ora, è che il diametro pupillare vada **registrato** durante le prove, ma non usato
come comando né come misura della fatica senza controllare la luminosità.

### Testa, occhiali e luce

- **Movimenti della testa.** Quando le persone assumono pose non ottimali, cioè girano, inclinano o
  ruotano la testa, i tracciatori remoti perdono dati e introducono errori sistematici, in misura
  diversa da modello a modello ([Niehorster et al., 2018](#riferimenti)). Nello stesso studio i
  tracciatori Tobii riportavano dati per entrambi gli occhi anche quando ne vedevano uno solo.
- **Occhiali.** Nello studio su EyeSwipe metà dei partecipanti portava occhiali e aveva avuto
  problemi di calibrazione, che pesavano soprattutto sulla scrittura a dwell
  ([Kurauchi et al., 2016](#riferimenti)).
- **Trucco, montature e riflessi.** Mascara pesante, montature spesse e riflessi possono
  potenzialmente peggiorare la qualità del tracciamento ([Feit et al., 2017](#riferimenti)).
- **Luce.** Nello studio di Feit la luce del giorno dava in media valori leggermente migliori della
  luce artificiale, ma la differenza non era statisticamente significativa.

## Come si misura una tastiera a sguardo

Per confrontare due tastiere servono misure standard:

- **Parole al minuto** (in inglese *words per minute*, WPM). Per convenzione una "parola" sono 5
  caratteri consecutivi, spazi compresi ([Majaranta et al., 2006](#riferimenti);
  [Kristensson e Vertanen, 2012](#riferimenti)). Si può contare anche in caratteri al minuto.
- **Tasso di errore con distanza minima tra stringhe** (*minimum string distance*, MSD): conta gli
  errori rimasti nel testo finale, confrontandolo con la frase da copiare.
- **Tasti premuti per carattere** (*keystrokes per character*, KSPC): quante selezioni servono per
  ogni carattere del testo finale. Se scrivo una frase di 15 caratteri con 17 selezioni, perché ho
  sbagliato una lettera e l'ho cancellata, il KSPC è 17 / 15 = 1,13. Senza errori sarebbe 1.
- **Tasso di errore totale**: gli errori corretti più quelli rimasti, divisi per tutti i caratteri
  inseriti (giusti, sbagliati e poi cancellati, sbagliati e rimasti), senza contare i tasti di
  correzione. Si scompone in errori corretti e non corretti, così si vede anche la fatica spesa a
  correggere ([Soukoreff e MacKenzie, 2003](#riferimenti)).

### Metodi a confronto

Il dwell non è l'unico modo di scrivere con lo sguardo. La tabella riporta alcuni risultati, ma
attenzione: sono studi diversi, con persone, lingue, tracciatori e allenamento diversi. Non si
possono confrontare direttamente tra loro.

| Metodo | Come si seleziona | Velocità riportata | Condizioni dello studio |
| --- | --- | --- | --- |
| Dwell | Sguardo fermo per 600 ms su ogni tasto | 9,5 WPM | 10 studenti senza disabilità, quarta sessione da 10 minuti ([Kurauchi et al., 2016](#riferimenti)) |
| EyeSwipe | Si selezionano prima e ultima lettera della parola; per le altre basta passare vicino ai tasti | 11,7 WPM | Stessi partecipanti e stesse sessioni ([Kurauchi et al., 2016](#riferimenti)) |
| Dasher a sguardo | Lo sguardo guida uno zoom continuo su caselle di lettere, più grandi se più probabili | Fino a 25 WPM dopo un'ora di pratica, contro 15 WPM con una tastiera a schermo; errori circa cinque volte meno | Due esperti e due principianti con Dasher, due esperti con la tastiera ([Ward e MacKay, 2002](#riferimenti)) |
| Dwell-free simulato | Si guardano le lettere senza fermarsi; un riconoscitore indovina la parola | 46 WPM nella quinta sessione | 8 partecipanti, riconoscitore **simulato e perfetto**, non un sistema reale ([Kristensson e Vertanen, 2012](#riferimenti)) |
| BlinkWrite | Battito di palpebre volontario su una tastiera a scansione | 4,8 WPM | 12 volontari, non ancora utenti a cui il sistema è destinato ([MacKenzie e Ashtiani, 2011](#riferimenti)) |

![Schermata del programma Dasher: a sinistra una grande casella azzurra con la lettera d, a destra caselle colorate più piccole con le lettere successive (e, i, g e altre), di dimensione diversa; al centro un mirino e una linea rossa indicano il puntatore; in alto il testo già scritto, "Wikiped".](https://upload.wikimedia.org/wikipedia/commons/c/cc/Dasher.png)

*Dasher mentre si scrive "Wikipedia". Le lettere più probabili secondo il modello linguistico hanno
caselle più grandi, quindi sono più facili da raggiungere. Immagine: Freyr su Wikipedia in inglese,
licenza [GPL](https://www.gnu.org/licenses/gpl-3.0.html), da
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Dasher.png).*

Dasher mostra bene un'idea che mi interessa per Kite: invece di chiedere all'occhio di fermarsi su
ogni lettera, **lo lascia muovere** e sfrutta un modello della lingua per rendere facili le lettere
probabili. Il metodo dwell-free simulato va nella stessa direzione: Kristensson e Vertanen
concludono che è molto improbabile che la scrittura a dwell tradizionale superi le loro stime per
il dwell-free.

## Persone con disabilità motoria: cosa cambia

![Un comunicatore Tobii Dynavox montato su un supporto: sullo schermo una griglia di grandi caselle con simboli e scritte in tedesco, tra cui una barra in alto con le parole "Pferd" e "Laterne" accompagnate da pittogrammi, e in basso a sinistra una casella "Trackstatus" che mostra lo stato del tracciamento.](https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Barrierefreiheit_002_2021_08_31.jpg/960px-Barrierefreiheit_002_2021_08_31.jpg)

*Un comunicatore a sguardo Tobii Dynavox con un software di CAA a simboli in tedesco, fotografato nel
2021. Immagine: Friedrich Haag, licenza
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), da
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Barrierefreiheit_002_2021_08_31.jpg).*

La foto mostra come un dispositivo commerciale di CAA applica molte delle regole viste sopra:
caselle **molto grandi**, poche per pagina, e una casella che mostra in ogni momento se il
tracciatore vede gli occhi. È la scelta opposta a una tastiera QWERTY completa con tasti piccoli.

Per chi convive con una disabilità motoria grave, i limiti dell'occhio e del tracciatore pesano di
più:

- **SLA.** In 35 persone con SLA in fase avanzata, tetraplegia e assenza di parola, i comunicatori a
  sguardo hanno ridotto la disabilità comunicativa più della tavola trasparente con le lettere
  (ETRAN) e hanno migliorato la qualità di vita percepita ([Caligari et al., 2013](#riferimenti)).
  In un'indagine su 30 persone con SLA avanzata, però, circa una su quattro (il 23,3%) usava poco il dispositivo; le cause
  più citate erano la stanchezza dello sguardo e i disturbi oculomotori
  ([Spataro et al., 2014](#riferimenti)).
- **Dallo stato locked-in allo stato completamente locked-in.** In una persona con SLA seguita per
  nove mesi, alla fine dello stato locked-in i movimenti oculari erano lenti e duravano poco; nello
  stato completamente locked-in sono scomparsi del tutto ([Murguialday et al., 2011](#riferimenti)).
  Quando lo sguardo non c'è più, restano solo le interfacce che non dipendono dai muscoli. È uno dei
  motivi per cui questo diario si occupa anche di BCI.
- **Nistagmo.** Le oscillazioni involontarie rendono difficile la calibrazione e instabile il punto
  di sguardo ([Rosengren et al., 2020](#riferimenti)).
- **Ptosi.** Le specifiche di almeno un produttore sono misurate su persone senza palpebre cadenti
  ([Niehorster et al., 2018](#riferimenti)). Ne deduco che con una palpebra che copre parte della
  pupilla ci si debba aspettare un tracciamento peggiore di quello dichiarato.
- **Fatica.** Fissare a lungo stanca, sia con il dwell sia con il battito di palpebre
  ([Majaranta et al., 2006](#riferimenti); [MacKenzie e Ashtiani, 2011](#riferimenti)).
- **Postura.** Su una carrozzina la testa può essere inclinata o appoggiata di lato, proprio le pose
  che peggiorano i tracciatori remoti ([Niehorster et al., 2018](#riferimenti)).

> **Avvertenza.** Kite e SmartChair sono progetti sperimentali e **non sono dispositivi medici
> certificati**. Chi dipende da uno strumento di CAA per comunicare dovrebbe avere sempre
> un'alternativa di riserva, per esempio una tavola alfabetica su carta. Se un giorno costruissi un
> tracciatore con illuminatori a infrarosso fatti in casa, dovrei verificarne la sicurezza ottica
> prima di usarlo su chiunque. Le prove con persone richiedono il consenso informato e, quando serve,
> il parere di un comitato etico.

## Cosa mi porto via per Kite

![Pagina principale di Wikipedia in tedesco con sovrapposta una mappa di calore: zone rosse e gialle sul testo dell'articolo del giorno e su alcune immagini, zone blu ai margini e poco o niente sul menu laterale.](https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Eyetracking_heat_map_Wikipedia.jpg/960px-Eyetracking_heat_map_Wikipedia.jpg)

*Una mappa di calore (heatmap) dello sguardo sulla pagina principale di Wikipedia in tedesco: i colori
caldi indicano dove si sono concentrate le fissazioni. Immagine: Tschneidr, licenza
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), da
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Eyetracking_heat_map_Wikipedia.jpg).*

Una mappa di calore riassume in un'immagine dove si è fermato lo sguardo, sommando molte
fissazioni. **La mia idea** è di usarne una sulla tastiera di Kite, separando lo sguardo di
ricerca da quello che porta a una selezione. Se le zone calde fossero spostate sempre nella stessa
direzione rispetto ai tasti, sarebbe il segno di un errore di accuratezza da correggere.

Da questa ricerca ricavo una lista di cose da registrare in ogni prova, prima ancora di cambiare il
meccanismo di selezione:

1. modello del tracciatore, frequenza di campionamento e filtri usati;
2. distanza tra occhi e schermo, dimensione dello schermo e dei tasti, in centimetri e in gradi;
3. accuratezza e precisione misurate su punti noti, all'inizio e alla fine della sessione;
4. percentuale di campioni persi, numero di ricalibrazioni, durata e numero dei battiti di palpebre;
5. occhiali o lenti, illuminazione, postura;
6. diametro pupillare, solo come dato da analizzare;
7. parole al minuto, KSPC e tasso di errore totale, separando errori corretti e non corretti;
8. fatica percepita a fine sessione.

## Per approfondire

- La [voce sul dwell time in Kite](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/), con i
  dettagli della vecchia tastiera.
- La [voce introduttiva sulle BCI](/diario/cos-e-una-brain-computer-interface/), per capire perché
  l'EOG è un artefatto per l'EEG.
- Lo studio di [Feit et al. (2017)](https://www.microsoft.com/en-us/research/publication/toward-everyday-gaze-input-accuracy-precision-eye-tracking-implications-design/)
  è liberamente accessibile ed è il riferimento più pratico per dimensionare i tasti.

## Riferimenti

1. Barea R., Boquete L., Mazo M., López E. (2002). System for assisted mobility using eye movements
   based on electrooculography. *IEEE Transactions on Neural Systems and Rehabilitation Engineering*,
   10(4), 209–218. [doi:10.1109/TNSRE.2002.806829](https://doi.org/10.1109/TNSRE.2002.806829)
2. Betts J. G., Young K. A., Wise J. A., Johnson E., Poe B., Kruse D. H., Korol O., Johnson J. E.,
   Womble M., DeSaix P. (2022). *Anatomy and Physiology 2e*, cap. 14.1 "Sensory Perception". OpenStax.
   [Testo liberamente accessibile](https://openstax.org/books/anatomy-and-physiology-2e/pages/14-1-sensory-perception)
3. Caligari M., Godi M., Guglielmetti S., Franchignoni F., Nardone A. (2013). Eye tracking
   communication devices in amyotrophic lateral sclerosis: impact on disability and quality of life.
   *Amyotrophic Lateral Sclerosis and Frontotemporal Degeneration*, 14(7–8), 546–552.
   [doi:10.3109/21678421.2013.803576](https://doi.org/10.3109/21678421.2013.803576)
4. Crane H. D., Steele C. M. (1985). Generation-V dual-Purkinje-image eyetracker. *Applied Optics*,
   24(4), 527. [doi:10.1364/AO.24.000527](https://doi.org/10.1364/AO.24.000527)
5. Feit A. M., Williams S., Toledo A., Paradiso A., Kulkarni H., Kane S., Morris M. R. (2017). Toward
   everyday gaze input: accuracy and precision of eye tracking and implications for design. In
   *Proceedings of the 2017 CHI Conference on Human Factors in Computing Systems (CHI '17)*,
   1118–1130. ACM. [doi:10.1145/3025453.3025599](https://doi.org/10.1145/3025453.3025599).
   [Versione liberamente accessibile](https://www.microsoft.com/en-us/research/wp-content/uploads/2017/01/everyday_eyetracking-1.pdf)
6. Gibaldi A., Sabatini S. P. (2021). The saccade main sequence revised: a fast and repeatable tool
   for oculomotor analysis. *Behavior Research Methods*, 53(1), 167–187.
   [doi:10.3758/s13428-020-01388-2](https://doi.org/10.3758/s13428-020-01388-2) (open access)
7. Gneo M., Schmid M., Conforto S., D'Alessio T. (2012). A free geometry model-independent neural
   eye-gaze tracking system. *Journal of NeuroEngineering and Rehabilitation*, 9, 82.
   [doi:10.1186/1743-0003-9-82](https://doi.org/10.1186/1743-0003-9-82) (open access)
8. Guestrin E. D., Eizenman M. (2006). General theory of remote gaze estimation using the pupil
   center and corneal reflections. *IEEE Transactions on Biomedical Engineering*, 53(6), 1124–1133.
   [doi:10.1109/TBME.2005.863952](https://doi.org/10.1109/TBME.2005.863952)
9. Jacob R. J. K. (1991). The use of eye movements in human-computer interaction techniques: what
   you look at is what you get. *ACM Transactions on Information Systems*, 9(2), 152–169.
   [doi:10.1145/123078.128728](https://doi.org/10.1145/123078.128728)
10. Kristensson P. O., Vertanen K. (2012). The potential of dwell-free eye-typing for fast assistive
    gaze communication. In *Proceedings of the Symposium on Eye Tracking Research and Applications
    (ETRA '12)*, 241–244. ACM. [doi:10.1145/2168556.2168605](https://doi.org/10.1145/2168556.2168605).
    [Versione liberamente accessibile](https://www.keithv.com/pub/dwellfree/kristensson-dwell-free.pdf)
11. Kurauchi A., Feng W., Joshi A., Morimoto C., Betke M. (2016). EyeSwipe: dwell-free text entry
    using gaze paths. In *Proceedings of the 2016 CHI Conference on Human Factors in Computing Systems
    (CHI '16)*, 1952–1956. ACM. [doi:10.1145/2858036.2858335](https://doi.org/10.1145/2858036.2858335).
    [Versione liberamente accessibile](https://www.cs.bu.edu/fac/betke/papers/Kurauchi-etal-CHI-2016.pdf)
12. MacKenzie I. S., Ashtiani B. (2011). BlinkWrite: efficient text entry using eye blinks.
    *Universal Access in the Information Society*, 10(1), 69–80.
    [doi:10.1007/s10209-010-0188-6](https://doi.org/10.1007/s10209-010-0188-6).
    [Versione liberamente accessibile](https://www.yorku.ca/mack/UAIS2011.html)
13. Majaranta P., MacKenzie I. S., Aula A., Räihä K.-J. (2006). Effects of feedback and dwell time on
    eye typing speed and accuracy. *Universal Access in the Information Society*, 5(2), 199–208.
    [doi:10.1007/s10209-006-0034-z](https://doi.org/10.1007/s10209-006-0034-z).
    [Versione liberamente accessibile](https://www.yorku.ca/mack/UAIS2006.pdf)
14. Mathôt S. (2018). Pupillometry: psychology, physiology, and function. *Journal of Cognition*,
    1(1), 16. [doi:10.5334/joc.18](https://doi.org/10.5334/joc.18) (open access)
15. Morimoto C. H., Koons D., Amir A., Flickner M. (2000). Pupil detection and tracking using multiple
    light sources. *Image and Vision Computing*, 18(4), 331–335.
    [doi:10.1016/S0262-8856(99)00053-0](https://doi.org/10.1016/S0262-8856(99)00053-0).
    [Versione liberamente accessibile](https://latin.ime.usp.br/wp-content/uploads/2000/03/PupilDetectionUsingMultipleLightSourcesIVC00.pdf)
16. Murguialday A. R., Hill J., Bensch M., Martens S., Halder S., Nijboer F., Schoelkopf B.,
    Birbaumer N., Gharabaghi A. (2011). Transition from the locked in to the completely locked-in
    state: a physiological analysis. *Clinical Neurophysiology*, 122(5), 925–933.
    [doi:10.1016/j.clinph.2010.08.019](https://doi.org/10.1016/j.clinph.2010.08.019)
17. Nguyen K., Wagner C., Koons D., Flickner M. (2002). Differences in the infrared bright pupil
    response of human eyes. In *Proceedings of the Symposium on Eye Tracking Research & Applications
    (ETRA '02)*. ACM. [doi:10.1145/507072.507099](https://doi.org/10.1145/507072.507099)
18. Niehorster D. C., Cornelissen T. H. W., Holmqvist K., Hooge I. T. C., Hessels R. S. (2018). What
    to expect from your remote eye-tracker when participants are unrestrained. *Behavior Research
    Methods*, 50(1), 213–227. [doi:10.3758/s13428-017-0863-0](https://doi.org/10.3758/s13428-017-0863-0)
    (open access)
19. Otero-Millan J., Macknik S. L., Martinez-Conde S. (2014). Fixational eye movements and binocular
    vision. *Frontiers in Integrative Neuroscience*, 8, 52.
    [doi:10.3389/fnint.2014.00052](https://doi.org/10.3389/fnint.2014.00052) (open access)
20. Plöchl M., Ossandón J. P., König P. (2012). Combining EEG and eye tracking: identification,
    characterization, and correction of eye movement artifacts in electroencephalographic data.
    *Frontiers in Human Neuroscience*, 6, 278.
    [doi:10.3389/fnhum.2012.00278](https://doi.org/10.3389/fnhum.2012.00278) (open access)
21. Proudfoot M., Menke R. A. L., Sharma R., Berna C. M., Hicks S. L., Kennard C., Talbot K.,
    Turner M. R. (2016). Eye-tracking in amyotrophic lateral sclerosis: a longitudinal study of
    saccadic and cognitive tasks. *Amyotrophic Lateral Sclerosis and Frontotemporal Degeneration*,
    17(1–2), 101–111. [doi:10.3109/21678421.2015.1054292](https://doi.org/10.3109/21678421.2015.1054292)
    (open access)
22. Provis J. M., Dubis A. M., Maddess T., Carroll J. (2013). Adaptation of the central retina for
    high acuity vision: cones, the fovea and the avascular zone. *Progress in Retinal and Eye
    Research*, 35, 63–81. [doi:10.1016/j.preteyeres.2013.01.005](https://doi.org/10.1016/j.preteyeres.2013.01.005).
    [Versione liberamente accessibile](https://pmc.ncbi.nlm.nih.gov/articles/PMC3658155/)
23. Rosengren W., Nyström M., Hammar B., Stridh M. (2020). A robust method for calibration of eye
    tracking data recorded during nystagmus. *Behavior Research Methods*, 52(1), 36–50.
    [doi:10.3758/s13428-019-01199-0](https://doi.org/10.3758/s13428-019-01199-0) (open access)
24. Soukoreff R. W., MacKenzie I. S. (2003). Metrics for text entry research: an evaluation of MSD
    and KSPC, and a new unified error metric. In *Proceedings of the SIGCHI Conference on Human
    Factors in Computing Systems (CHI '03)*, 113–120. ACM.
    [doi:10.1145/642611.642632](https://doi.org/10.1145/642611.642632).
    [Versione liberamente accessibile](https://www.yorku.ca/mack/chi03.html)
25. Spataro R., Ciriacono M., Manno C., La Bella V. (2014). The eye-tracking computer device for
    communication in amyotrophic lateral sclerosis. *Acta Neurologica Scandinavica*, 130(1), 40–45.
    [doi:10.1111/ane.12214](https://doi.org/10.1111/ane.12214)
26. Strasburger H., Rentschler I., Jüttner M. (2011). Peripheral vision and pattern recognition: a
    review. *Journal of Vision*, 11(5), 13. [doi:10.1167/11.5.13](https://doi.org/10.1167/11.5.13)
    (open access)
27. Vidal M., Pfeuffer K., Bulling A., Gellersen H. W. (2013). Pursuits: eye-based interaction with
    moving targets. In *CHI '13 Extended Abstracts on Human Factors in Computing Systems*, 3147–3150.
    ACM. [doi:10.1145/2468356.2479632](https://doi.org/10.1145/2468356.2479632)
28. Ward D. J., MacKay D. J. C. (2002). Fast hands-free writing by gaze direction. *Nature*, 418, 838.
    [doi:10.1038/418838a](https://doi.org/10.1038/418838a).
    [Versione liberamente accessibile](https://arxiv.org/abs/cs/0204030)
