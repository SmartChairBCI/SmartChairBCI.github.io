---
ref: tobii-4c-linux-awakening
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Tobii 4c ed il risveglio dopo 10 anni di letargo"
description: Un tracciatore oculare da gaming del 2016, con driver solo per Windows. Cosa sa fare, cosa dice sullo sguardo e sulla testa, e come inizio a esplorarne il protocollo per portarlo su GNU/Linux con l'aiuto dell'AI.
tags: [eye-tracking, tobii, linux, driver, usb, caa]
---

Il tracciatore oculare che uso per [Kite](/ricerche/kite/), il mio strumento aperto di
Comunicazione Aumentativa e Alternativa (CAA), è un **Tobii Eye Tracker 4C**. È uscito alla fine
del 2016 ed era pensato per i videogiochi. Oggi ha dieci anni.

Il **letargo** di questi dieci anni è stato soprattutto quello del progetto: per molto tempo il
lavoro su Kite si è fermato. Ora lo riprendo, e lo riprendo da GNU/Linux, dove c'è un ostacolo
concreto: il 4C si collega al computer, ma senza il software del produttore il sistema non sa cosa
farne. In questa voce
racconto che cosa sa fare questo dispositivo, che cosa dice sullo sguardo e sulla testa, e come ho
iniziato a esplorare il suo protocollo di comunicazione per svegliarlo su un sistema libero.

Non è un resoconto di risultati: è l'inizio di un percorso. Non ci sono misure mie.

## Un tracciatore da gaming a meno di 200 euro

Tobii ha annunciato il 4C nell'ottobre 2016 come successore del Tobii EyeX, al prezzo di
149 dollari ([Coppock, 2016](#riferimenti); [Hachman, 2016](#riferimenti)). Le spedizioni sono iniziate a dicembre
([Hachman, 2016](#riferimenti)). In Europa, all'inizio del 2017, il sito ufficiale lo vendeva a
159 euro ([Painter, 2017](#riferimenti)).

Era un accessorio per giocatori: muovere la visuale nei giochi seguendo lo sguardo, spostare il
cursore dove si guarda, accedere a Windows con il riconoscimento del volto
([Hachman, 2016](#riferimenti)). Proprio perché era un prodotto di massa, costava poco. Per un
progetto che vuole ausili accessibili anche nel prezzo, è un punto di partenza interessante.

Il 4C contiene un processore dedicato, l'**EyeChip**: un circuito integrato progettato per il
tracciamento oculare, che elabora le immagini dentro il dispositivo invece di lasciare tutto il
lavoro al computer ([Coppock, 2016](#riferimenti)). Tobii aveva presentato l'EyeChip nel 2015
insieme a **IS4**, una piattaforma di tracciamento pensata per essere integrata nei dispositivi di
consumo ([Minotti, 2015](#riferimenti)). Nella documentazione della comunità il 4C viene indicato
proprio come dispositivo IS4 ([Eitol, s.d.](#riferimenti)).

## Le caratteristiche principali

Questi sono i dati della scheda tecnica ufficiale ([Tobii, s.d.](#riferimenti)):

| Caratteristica | Valore |
| --- | --- |
| Frequenza di campionamento delle immagini | 90 Hz |
| Illuminatori | solo infrarosso vicino (NIR), 850 nm |
| Distanza di funzionamento | 50–95 cm |
| Area di tracciamento (*track box*) | 40 × 30 cm a 75 cm di distanza |
| Schermo massimo consigliato | 27 pollici in 16:9, 30 pollici in 21:9 |
| Collegamento | USB 2.0 (BC 1.2), cavo integrato da 80 cm |
| Velocità di trasferimento dati USB | 100 KB/s |
| Consumo | 2,0 W in media, picchi brevi di 5–6 W all'accensione degli illuminatori |
| Dimensioni e peso | 17 × 15 × 335 mm, 95 g |
| Sistema operativo consigliato | Windows 10 a 64 bit |

Due dati vanno spiegati.

**90 Hz** vuol dire 90 immagini al secondo, cioè una ogni 11 ms circa. Nella
[voce sul gaze tracking](/diario/come-funziona-l-occhio-e-il-gaze-tracking/) ho spiegato perché,
per una tastiera a dwell, questa frequenza è più che sufficiente.

L'**infrarosso a 850 nm** è invisibile all'occhio. Il tracciatore illumina il volto e cerca nelle
immagini la pupilla e il riflesso della luce sulla cornea: è la tecnica del riflesso corneale,
descritta nella stessa voce.

Collegato al mio computer, il 4C si presenta con l'identificativo USB `2104:0127`. La prima parte,
`2104`, è il codice del produttore: nell'elenco pubblico degli identificativi USB corrisponde a
Tobii Technology AB ([Linux USB Project, 2026](#riferimenti)). La seconda, `0127`, identifica il
prodotto.

## Che cosa dice il 4C sullo sguardo e sulla testa

Un tracciatore non restituisce soltanto "dove guardi". Il kit di sviluppo ufficiale di Tobii elenca
diversi flussi di dati per i tracciatori di questa famiglia, tra cui il punto di sguardo, la
presenza dell'utente, l'origine dello sguardo e la posizione della testa
([Tobii Developer Zone, s.d.](#riferimenti)). Le informazioni che mi interessano sono queste:

- **punto di sguardo sullo schermo**: le coordinate del punto che la persona sta guardando;
- **origine 3D degli occhi**: la posizione di ciascun occhio nello spazio davanti al tracciatore,
  in pratica il centro da cui "parte" lo sguardo;
- **diametro pupillare**, per ciascun occhio;
- **presenza dell'utente**: se davanti al tracciatore c'è una persona oppure no;
- **posizione e orientamento della testa**.

### La testa: una posa che non c'è

L'ultima voce dell'elenco è la più interessante. Dall'esplorazione iniziale è emerso che il 4C
**non manda un vero flusso di posa della testa**. È coerente con la scheda tecnica, secondo cui il
tracciamento della testa non è calcolato dall'EyeChip e aumenta il carico sul processore del computer
([Tobii, s.d.](#riferimenti)). La mia interpretazione è che, su Windows, la posa venga calcolata dal
software installato sul PC.

Se voglio la posa della testa su GNU/Linux, quindi, devo ricavarla io. Il dispositivo mi dà però un
indizio prezioso: la posizione nello spazio dei due occhi, cioè dei loro **centri corneali**, i
centri di curvatura della cornea che i modelli di stima dello sguardo usano come riferimento
([Guestrin e Eizenman, 2006](#riferimenti)).

L'orientamento della testa si descrive di solito con tre angoli
([Murphy-Chutorian e Trivedi, 2009](#riferimenti)):

| Angolo | Movimento | Esempio |
| --- | --- | --- |
| **Imbardata** (*yaw*) | rotazione attorno all'asse verticale | fare "no" con la testa |
| **Beccheggio** (*pitch*) | rotazione attorno all'asse orizzontale da orecchio a orecchio | fare "sì" con la testa |
| **Rollio** (*roll*) | rotazione attorno all'asse che va dalla nuca al naso | inclinare la testa verso una spalla |

Con due soli punti nello spazio si ottiene molto:

- la **posizione** della testa, per esempio dal punto medio tra i due occhi;
- l'**imbardata**, perché girando la testa un occhio si avvicina allo schermo e l'altro si allontana;
- il **rollio**, perché inclinando la testa un occhio sale e l'altro scende.

Il **beccheggio**, invece, sfugge. Immaginate una matita che attraversa la testa da un occhio
all'altro: il "sì" è una rotazione attorno a quella matita. I due occhi stanno praticamente su
quell'asse, quindi ruotando restano quasi fermi, e il segmento che li unisce non cambia direzione.
Con due soli punti **il beccheggio non è osservabile**.

Va stimato in un altro modo. L'idea su cui lavorerò è usare le **immagini infrarosse** del sensore
con un modello di punti di riferimento del volto (*facial landmarks*): una rete neurale che, data
l'immagine di un viso, ne individua punti come la punta del naso, il mento e gli angoli della bocca.
Un esempio noto è il modello di Google che stima 468 punti 3D del volto da una sola telecamera
([Kartynnik et al., 2019](#riferimenti), preprint). Dalla posizione di questi punti si può ricavare
anche l'inclinazione in avanti e indietro della testa.

## Il tallone d'Achille: solo Windows

Il limite più grande del 4C non è l'hardware. È il software. Driver e programmi ufficiali
supportavano soltanto Windows 7, 8.1 e Windows 10 a 64 bit; una recensione dell'epoca sconsigliava
esplicitamente l'acquisto a chi usava un Mac o Linux ([Hachman, 2016](#riferimenti)). La scheda
tecnica attuale indica ancora Windows 10 a 64 bit come sistema consigliato ([Tobii, s.d.](#riferimenti)).

Per correttezza va detto che in rete circolano pacchetti Tobii per Linux in versione sperimentale,
raccolti da progetti della comunità ([Eitol, s.d.](#riferimenti)). Sono però binari proprietari,
non mantenuti, legati a distribuzioni di qualche anno fa. Non sono una base su cui costruire un
ausilio aperto.

È un tallone d'Achille che conosco bene. Anche la **prima versione di Kite**, circa dieci anni fa,
girava solo su Windows. Allora era una scelta quasi obbligata. Oggi credo che uno strumento di CAA
aperto debba poter funzionare su un sistema operativo libero, che chiunque può studiare, modificare
e installare anche su un computer vecchio.

Non sono il primo a percorrere questa strada. Per il successore del 4C, il Tobii Eye Tracker 5, la
comunità ha già prodotto una reimplementazione libera del protocollo USB per Linux, sviluppata da
zero a partire dalle proprie registrazioni del traffico USB ([Tropaion, s.d.](#riferimenti)).

## Cosa ho fatto: i primi passi nel protocollo

Ho iniziato a esplorare come il 4C parla con il computer. Siamo all'inizio, e qui riporto solo un
quadro generale di ciò che è emerso finora.

**Tutto in user-space.** Non serve un modulo del kernel, cioè un pezzo di codice da aggiungere al
cuore del sistema operativo, né alcun programma proprietario di Tobii. Il dialogo con il dispositivo
può avvenire da un normale programma, attraverso **libusb**, una libreria libera che dà accesso
diretto ai dispositivi USB senza privilegi speciali ([libusb, s.d.](#riferimenti)).

**Due canali e una "porta" di servizio.** Un dispositivo USB comunica attraverso degli
*endpoint*, che si possono immaginare come le porte di un ufficio postale. Lo standard USB prevede
diversi tipi di trasferimento ([USB Implementers Forum, 2000](#riferimenti)). Il 4C usa due endpoint
di tipo *bulk*, adatti a spostare blocchi di dati: uno in ingresso verso il computer (IN) e uno in
uscita verso il dispositivo (OUT). L'apertura e la chiusura della sessione passano invece da
**trasferimenti di controllo** definiti dal produttore (*vendor*), una specie di sportello riservato
ai comandi.

**Un protocollo a messaggi.** Sopra l'USB viaggia un protocollo a messaggi, che indico con la sigla
**TTP**. Ogni messaggio ha un'intestazione (*header*) e una serie di campi **TLV**, cioè
*tipo–lunghezza–valore*. Funziona come l'etichetta di un pacco: prima dice che cosa contiene, poi
quanto è grande, poi c'è il contenuto. Chi legge può così saltare i campi che non conosce.

**Big-endian.** I numeri sono scritti in ordine **big-endian**, con il byte più significativo per
primo. Un esempio: il numero 258 occupa due byte, 1 e 2. In big-endian si scrivono nell'ordine
`01 02`; i comuni processori dei PC li tengono in memoria al contrario, `02 01`. Se non si gira
l'ordine, 258 diventa 513.

**Virgola fissa, non virgola mobile.** Le coordinate non sono numeri con la virgola "mobile" (*float*),
come li usano di solito i programmi. Sono numeri interi da dividere per una scala fissa e concordata.
È come scrivere una lunghezza in millimetri interi invece che in metri con i decimali: 250 mm invece
di 0,25 m.

**Messaggi spezzati e messaggi incollati.** Un messaggio non arriva sempre tutto intero in un singolo
trasferimento USB. A volte è diviso in più pezzi (*frammentazione*), a volte più messaggi arrivano
incollati nello stesso blocco (*accorpamento*). Il programma deve quindi rimetterli insieme, come
chi ricompone una lettera spedita in più buste e separa due lettere finite nella stessa busta.

**Più flussi.** Il dispositivo non manda solo lo sguardo. Ci sono più flussi distinti, per esempio
quello dei dati di sguardo e quello delle **immagini infrarosse** del sensore. Sono proprio queste
immagini a rendere possibile la stima del beccheggio di cui ho parlato sopra.

## Il piano: riscrivere il driver con l'aiuto dell'AI

Il passo successivo è scrivere un driver libero per GNU/Linux. Lavorerò insieme a un **assistente di
programmazione basato su intelligenza artificiale (AI)**, come già faccio per la scrittura di questo
diario con [Bones](/diario/chi-e-bones/).

La divisione dei compiti che ho in mente è questa. L'AI mi aiuterà a scrivere e ottimizzare il codice,
a formulare ipotesi sul significato dei campi del protocollo e a preparare i test. Io verificherò ogni
ipotesi sui dati reali del dispositivo e rivedrò ogni riga prima che entri nel progetto.

### Gli obiettivi tecnici

1. **Nessun componente proprietario.** Solo user-space e libusb, con codice pubblico.
2. **Una pipeline concorrente.** Lettura dall'USB, ricomposizione dei messaggi, decodifica e invio dei
   dati ad altri programmi saranno fasi separate che lavorano in parallelo, come una catena di montaggio.
   L'obiettivo è che una fase lenta non blocchi la lettura dal dispositivo.
3. **Zero allocazioni durante lo streaming.** Chiedere nuova memoria al sistema per ogni campione può
   introdurre pause imprevedibili. L'obiettivo è preparare tutta la memoria all'avvio e riutilizzarla.
4. **Bassa latenza.** Per una tastiera a sguardo, un dato in ritardo è un dato sbagliato: il cursore
   resta indietro rispetto agli occhi. Il principio che voglio seguire è che, se il sistema è
   sovraccarico, sia meglio perdere un campione che accumulare ritardo.
5. **Un'uscita aperta e documentata**, così che Kite e qualsiasi altro programma possano usare i dati.

### Le proprietà da estrarre per la scrittura assistita

Il secondo obiettivo è capire quali proprietà si possono leggere dal sensore e a che cosa possono
servire in una tastiera a sguardo. Questa è la mia lista di partenza. Per ora sono **ipotesi di
lavoro**: dovrò verificare quali dati il 4C rende davvero disponibili e con quale qualità.

| Proprietà | Che cosa indica | Possibile uso in Kite |
| --- | --- | --- |
| Punto di sguardo | dove guarda la persona sullo schermo | puntatore per scegliere il tasto |
| Stabilità del punto nel tempo | se lo sguardo è fermo su un punto (fissazione) | selezione per fissazione, come il [dwell time](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/) |
| Presenza dell'utente | se c'è qualcuno davanti al tracciatore | mettere in pausa la tastiera quando la persona si allontana |
| Apertura degli occhi e ammiccamento | se gli occhi sono aperti, chiusi o se c'è stato un battito di palpebre | battito volontario come clic, distinto da quello spontaneo |
| Origine 3D degli occhi | distanza e posizione rispetto allo schermo | guidare la persona nella posizione giusta, segnalare quando esce dall'area di tracciamento |
| Posa della testa | posizione e orientamento della testa | input alternativo, per esempio un cenno per confermare |
| Diametro pupillare | dimensione della pupilla | solo da registrare durante le prove, non come comando |
| Immagini infrarosse | ciò che "vede" il sensore | diagnosi dei problemi di tracciamento, stima del beccheggio |

Per l'apertura degli occhi devo ancora capire se il 4C la fornisce in modo diretto o se andrà ricavata,
per esempio dalla perdita temporanea degli occhi nei dati. Sul diametro pupillare resto prudente, per i
motivi spiegati nella [voce sul gaze tracking](/diario/come-funziona-l-occhio-e-il-gaze-tracking/): la
pupilla risponde soprattutto alla luce, e lo schermo cambia luminosità di continuo.

## Problemi aperti

- **Il protocollo è conosciuto solo in parte.** Molti messaggi e campi non hanno ancora un significato
  chiaro. Alcuni potrebbero restare oscuri.
- **Il beccheggio dalle immagini infrarosse.** I modelli di punti del volto come quello di Kartynnik
  et al. lavorano su immagini a colori di una normale telecamera ([Kartynnik et al., 2019](#riferimenti)).
  Le immagini del 4C sono infrarosse e inquadrate da vicino e dal basso. Non so ancora se il modello
  funzionerà bene su questo tipo di immagini.
- **Il codice scritto con l'AI va verificato.** Un assistente AI può proporre interpretazioni del
  protocollo plausibili ma sbagliate. Ogni ipotesi dovrà essere confrontata con i dati reali, e il
  codice dovrà avere test che lo dimostrano.
- **Un dispositivo di dieci anni fa.** Il 4C non è più il modello attuale di Tobii. Chi vuole
  riprodurre il lavoro potrebbe trovarlo solo usato.

## Prossimi passi

1. Completare la mappa dei messaggi necessari per aprire la sessione e ricevere lo sguardo.
2. Scrivere la prima versione del driver con gli obiettivi descritti sopra.
3. Capire quali delle proprietà della tabella il 4C fornisce davvero.
4. Provare la stima del beccheggio sulle immagini infrarosse.
5. Documentare il protocollo man mano, comprese le parti che non riesco a decifrare.

Racconterò ogni passo qui nel diario, compresi i vicoli ciechi.

> **Avvertenza.** Kite è un progetto sperimentale e **non è un dispositivo medico certificato**. Un
> driver non ufficiale usa il tracciatore in modi non previsti dal produttore: inviare comandi di cui
> non si conosce l'effetto potrebbe cambiarne il comportamento, compresi gli illuminatori infrarossi.
> Chi dipende da uno strumento di CAA per comunicare dovrebbe avere sempre un'alternativa di riserva.
> Le prove con persone richiedono il consenso informato e, quando serve, il parere di un comitato etico.

## Riferimenti

1. Coppock M. (2016, 21 ottobre). Tobii Eye Tracker 4C adds head tracking for even better gaming
   precision. *Digital Trends*.
   [digitaltrends.com](https://www.digitaltrends.com/gaming/tobii-eye-tracker-4c-announced/)
2. Eitol (s.d.). *tobii_eye_tracker_linux_installer: Installation and testing of tobii eye tracker in
   Ubuntu 18.10* [repository della comunità, non ufficiale]. GitHub.
   [github.com/Eitol/tobii_eye_tracker_linux_installer](https://github.com/Eitol/tobii_eye_tracker_linux_installer)
3. Guestrin E. D., Eizenman M. (2006). General theory of remote gaze estimation using the pupil
   center and corneal reflections. *IEEE Transactions on Biomedical Engineering*, 53(6), 1124–1133.
   [doi:10.1109/TBME.2005.863952](https://doi.org/10.1109/TBME.2005.863952)
4. Hachman M. (2016, 19 dicembre). Tobii Eye Tracker 4C hands-on: Mousing with your eyes has
   surprising potential for gaming. *PCWorld*.
   [pcworld.com](https://www.pcworld.com/article/3146226/tobii-eye-tracker-4c-hands-on-mousing-with-your-eyes-has-surprising-potential-for-gaming.html)
5. Kartynnik Y., Ablavatski A., Grishchenko I., Grundmann M. (2019). Real-time facial surface
   geometry from monocular video on mobile GPUs. *arXiv* (preprint).
   [arXiv:1907.06724](https://arxiv.org/abs/1907.06724)
6. libusb (s.d.). *libusb*. Sito e documentazione ufficiale della libreria. [libusb.info](https://libusb.info/)
7. Linux USB Project (2026). *List of USB ID's* (`usb.ids`), versione 2026.06.26, voce del
   produttore `2104`.
   [linux-usb.org/usb.ids](http://www.linux-usb.org/usb.ids)
8. Minotti M. (2015, 15 ottobre). Tobii reveals new eye-tracking chip and platform. *GamesBeat*.
   [gamesbeat.com](https://gamesbeat.com/tobii-reveals-new-eye-tracking-chip-and-platform/)
9. Murphy-Chutorian E., Trivedi M. M. (2009). Head pose estimation in computer vision: a survey.
   *IEEE Transactions on Pattern Analysis and Machine Intelligence*, 31(4), 607–626.
   [doi:10.1109/TPAMI.2008.106](https://doi.org/10.1109/TPAMI.2008.106)
10. Painter L. (2017, 4 gennaio). Tobii eye-tracker 4C review: Head- and eye-tracking make the 4C one
    of the best available. *Tech Advisor*.
    [techadvisor.com](https://www.techadvisor.com/article/717550/tobii-eye-tracker-4c-review.html)
11. Tobii (s.d.). *4C Specifications*. Tobii Help Center, documentazione tecnica ufficiale.
    [help.tobii.com](https://help.tobii.com/hc/en-us/articles/213414285-4C-Specifications)
12. Tobii Developer Zone (s.d.). *How to get started with developing software for the Eye Tracker with
    the PDK*. Documentazione tecnica ufficiale.
    [developer.tobii.com](https://developer.tobii.com/how-to-get-started-with-developing-software-for-the-eye-tracker-with-the-pdk/)
13. Tropaion (s.d.). *Tobii_Linux* [repository della comunità, non ufficiale: reimplementazione del
    protocollo USB del Tobii Eye Tracker 5 per Linux]. GitHub.
    [github.com/Tropaion/Tobii_Linux](https://github.com/Tropaion/Tobii_Linux)
14. USB Implementers Forum (2000). *Universal Serial Bus Specification, Revision 2.0*. Standard.
    [usb.org](https://www.usb.org/document-library/usb-20-specification)
