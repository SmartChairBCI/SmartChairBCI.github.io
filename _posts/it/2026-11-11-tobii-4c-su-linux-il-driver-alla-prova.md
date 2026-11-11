---
ref: tobii-4c-linux-driver-test
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Tobii 4C su GNU/Linux (seguito): il driver alla prova"
description: Riprendo uno per uno i cinque prossimi passi della terza parte e li verifico sul 4C reale, senza modificare il driver. Due sessioni da 30 minuti senza perdite, un'uscita aperta che funziona, una calibrazione che non sopravvive allo spegnimento e il beccheggio che passa alle immagini infrarosse, per ora solo offline.
tags: [eye-tracking, tobii, linux, driver, latenza, calibrazione]
---

La serie in tre parti sul protocollo del **Tobii Eye Tracker 4C** si è chiusa con un elenco di cinque
prossimi passi. Nella [prima parte](/diario/tobii-4c-su-linux-1-leggere-prima-di-toccare/) ho letto
prima di toccare. Nella [seconda](/diario/tobii-4c-su-linux-2-dare-un-nome-ai-byte/) ho dato un nome
ai byte. Nella [terza](/diario/tobii-4c-su-linux-3-dall-ipotesi-al-codice/) ho descritto il driver
libero, `tobii4c-linux`: una catena di goroutine, la memoria preparata all'avvio, un supervisore, i
test sulle catture reali. Avevo promesso di raccontare come sarebbe andato l'incontro tra il codice e
il dispositivo, comunque andasse.

In questa voce riprendo quei cinque passi e li verifico **uno per uno**. Per ognuno dico che cosa ho
fatto, che cosa ho misurato, che cosa è andato storto e che cosa resta da fare.

Due premesse, prima dei numeri.

- **Il driver non è stato modificato durante queste prove.** Ho provato il codice così com'era.
  Quando una verifica avrebbe richiesto di cambiarlo, l'ho rimandata invece di toccarlo a metà
  misura.
- **Davanti al tracciatore non c'era nessuno.** In tutte le prove dal vivo lo sguardo non è mai stato
  valido e il viso non è mai stato trovato. È il limite più grande di questa voce, e lo ripeto dove
  conta.

## L'ambiente di prova

| Elemento | Valore |
| --- | --- |
| Tracciatore | Tobii Eye Tracker 4C, firmware 4.7.0 |
| Processore | AMD Ryzen 9 5950X |
| Kernel Linux | 7.2.15 |
| Persona davanti al tracciatore | nessuna |

## Il bilancio in breve

Divido gli esiti in tre categorie, perché "non fatto" può voler dire cose molto diverse.

- **(a) Chiuso.** La verifica è stata fatta e ha dato un esito, positivo o negativo.
- **(b) Rimandato a un prossimo aggiornamento del driver.** La verifica richiede una modifica al
  codice che oggi non serve per usare il driver. Non è un fallimento: è una scelta di ordine. Lo
  faccio quando aggiornerò il driver, non in mezzo a una misura.
- **(c) Serve una persona o un'azione fuori dal codice.** La verifica richiede qualcuno seduto davanti
  al tracciatore, oppure un gesto fisico o di sistema, come staccare un cavo o installare una
  libreria. Il driver va bene così com'è.

| Passo | Esito | Che cosa resta, e di che tipo |
| --- | --- | --- |
| 1. Pipeline in sessioni lunghe | **(a) superato**, senza persona | stessa misura con una persona (c); durata impostabile e percentili su tutta la sessione (b) |
| 2. Catture del 4C nei test | **(b) rimandato** | uno strumento di registrazione che `dump` non è |
| 3. Uscita aperta | **(a) superato** per UDP | LSL dal vivo (c); invio a più destinazioni (b) |
| 4. Calibrazione dello sguardo | **(a) risultato negativo** sulla persistenza | nuova calibrazione con una persona e prova pulita staccando il cavo (c) |
| 5. Beccheggio dalle immagini IR | portato dal prototipo, **verificato solo offline** | prova con una persona e un riferimento indipendente (c) |

## 1. La pipeline in sessioni lunghe

### Che cosa ho fatto

Ho fatto girare il driver per due sessioni da **30 minuti** ciascuna, con il campionamento dello
sguardo attivo e i campioni inviati all'uscita UDP. Le chiamo A e C, come nei miei appunti:

- **A**: senza il flusso delle immagini;
- **C**: con il flusso delle immagini sempre attivo, 30 immagini al secondo oltre allo sguardo.

Per ogni sessione ho guardato i due contatori descritti nella terza parte, `host_drops` (campioni
scartati dal mio computer) e `device_drops` (campioni mancanti nel contatore del dispositivo), i
buchi nel numero di sequenza `seq` all'arrivo sull'uscita UDP, la latenza della pipeline e la
frequenza dei campioni.

La **latenza della pipeline** è il tempo tra la ricezione di un messaggio dall'USB e la scrittura del
campione sull'uscita. Il driver la riassume ogni 10 s con due **percentili**: il p50, cioè la mediana
(metà dei campioni è più veloce), e il p99 (solo un campione su cento è più lento). Un esempio: se in
10 s il p99 vale 40 µs, in quella finestra al massimo 9 campioni circa su 900 hanno superato 40 µs.

### Risultati

| Sessione (30 min) | Frame | `host_drops` / `device_drops` | Buchi di `seq` all'UDP | Latenza p50 / p99 / max | Frequenza |
| --- | --- | --- | --- | --- | --- |
| A, senza immagini | 160 529 | 0 / 0 | 0 | 21 / 55 / 640 µs | 89,2 Hz (min 85,9) |
| C, immagini sempre attive | 161 028 | 0 / 0 | 0 | 20 / 39 / 1339 µs | 89,4 Hz (min 87,6) |

Come si leggono i numeri:

- p50 e p99 sono le **mediane** dei valori calcolati sulle finestre da 10 s; max è il **massimo
  assoluto** della sessione.
- L'**età dei campioni al ricevitore**, cioè il tempo tra la ricezione USB e la lettura del pacchetto
  da parte del programma che ascolta l'UDP, è rimasta tra 39 e 107 µs.
- Non c'è stata **nessuna risincronizzazione** del riassemblatore e **nessun errore di decodifica**.

Il valore più alto, 1339 µs nella sessione C, è circa un ottavo del tempo che passa tra due campioni
(circa 11 ms). In queste due sessioni la pipeline non è mai rimasta indietro.

### Risultati negativi

- **Non sono 90 Hz.** Senza nessuno davanti, il 4C emette circa **89,2 Hz**, non 90,0 Hz. Il periodo,
  misurato sull'orologio del tracciatore, è di circa 11,23 ms, e il contatore dei frame del
  dispositivo è **continuo**: non mancano frame, è il dispositivo che li produce un po' più lentamente.
  Non so ancora se succeda anche con una persona davanti. Nel video più sotto, con una persona, il
  pannello della pipeline indica 90,0 Hz: è un valore istantaneo arrotondato, non una misura di
  sessione, quindi lo prendo come un indizio, non come una risposta.
- **La presenza cambia da sola.** Con la scena vuota, lo stato di presenza è passato da "assente" a
  "presente" e viceversa **198 volte** nella sessione A e **283 volte** nella C. La mia
  interpretazione è che, almeno senza persona, il flusso di presenza non basti da solo a dire se
  qualcuno è davanti al tracciatore. Per Kite vuol dire non usarlo come unico segnale.
- **Un confronto che non regge.** Nel README del driver avevo descritto la perdita di circa un frame
  al minuto con il flusso delle immagini attivo. Nella sessione C non si è ripetuta. Quella misura,
  però, era stata fatta con una persona davanti, e questa no: i due risultati non sono confrontabili,
  e non ne traggo conclusioni.

### Che cosa resta

- **(c)** La stessa misura con una persona davanti, che è il caso d'uso vero.
- **(b)** Con un prossimo aggiornamento del driver: un'opzione `-duration` per fissare la durata della
  sessione, e i percentili calcolati su tutta la sessione, oltre che sulle finestre da 10 s.

## 2. Le catture del 4C nei test

I test del driver rigiocano catture USB reali dell'**ET5**, il successore del 4C, come ho raccontato
nella [terza parte](/diario/tobii-4c-su-linux-3-dall-ipotesi-al-codice/). Volevo aggiungere catture
del mio 4C. Con il driver di oggi **non si può fare**, per tre motivi:

1. lo strumento `dump`, descritto nella
   [seconda parte](/diario/tobii-4c-su-linux-2-dare-un-nome-ai-byte/), stampa una lettura dei
   messaggi ma **non li salva interi**;
2. **non registra i comandi** che il computer manda al dispositivo, solo ciò che arriva;
3. **non toglie il numero di serie**, che compare nella risposta alle stringhe di identità (opcode
   `0x58c`) e comincia con `IS404-`. Le catture dell'ET5 che uso hanno il numero di serie azzerato
   dall'autore, e voglio che lo stesso valga per le mie.

Questo passo è **rimandato (b)**. Con un prossimo aggiornamento il driver avrà un'opzione di
registrazione che scrive i messaggi nel formato `.hex` delle catture di test già esistenti, con il
numero di serie azzerato. Le catture del 4C potranno allora mettere alla prova sul 4C, e non solo
sull'ET5, anche la ricomposizione dei messaggi spezzati e delle risposte a puntate.

## 3. L'uscita aperta per Kite e per gli altri programmi

### Che cos'è

L'uscita aperta è il modo in cui Kite, o qualunque altro programma, riceve i campioni dal driver.
Oggi ce ne sono due.

- **UDP** (*User Datagram Protocol*): un protocollo di rete semplice, in cui ogni campione viaggia in
  un pacchetto indipendente. Per impostazione predefinita il driver lo manda al computer stesso
  (`127.0.0.1`, porta 5005). UDP non garantisce né la consegna né l'ordine dei pacchetti
  ([Postel, 1980](#riferimenti)): per questo ogni pacchetto porta il numero `seq`, e chi riceve può
  accorgersi di un buco.
- **LSL** (*Lab Streaming Layer*): un sistema molto usato nei laboratori per registrare e
  sincronizzare flussi di dati diversi, per esempio EEG e sguardo, con una marca temporale per ogni
  campione ([Kothe et al., 2025](#riferimenti)).

Il formato UDP è documentato nel README del driver e si chiama **T4CG versione 2**. Ogni pacchetto è
lungo 192 byte. I primi campi bastano a riconoscerlo e a controllarlo:

| Posizione (byte) | Contenuto |
| --- | --- |
| 0 | la sigla `T4CG`, che identifica il formato |
| 4 | la versione, 2 |
| 8 | `seq`, il numero di sequenza, senza buchi tra i campioni inoltrati |
| 16 | l'istante di ricezione USB, sull'orologio del computer |
| 24 | l'istante del campione, sull'orologio del tracciatore |

Seguono lo sguardo, la posizione e la rotazione della testa, gli occhi, le pupille e la presenza. Un
dettaglio che può confondere: i numeri del protocollo del 4C sono big-endian, quelli del pacchetto
UDP sono **little-endian**, l'ordine dei byte dei processori dei computer comuni.

### Risultati

- **Un ricevitore scritto a parte.** Ho scritto un piccolo ricevitore in Python, separato dal driver,
  che conosce solo il formato documentato. In 35 s di prova dal vivo ha ricevuto **3121 pacchetti**,
  tutti da 192 byte, tutti con la sigla `T4CG` e la versione 2, senza buchi di `seq`. È la prova che
  conta di più: un programma che non condivide codice con il driver lo capisce leggendo solo la
  documentazione.
- **Il ricevitore del driver.** Il comando `tobii4c recv` ha ricevuto tutti i **321 557** campioni
  delle due sessioni lunghe del passo 1.
- **I test.** I test del formato e i test unitari del driver passano rieseguiti senza la cache dei
  risultati; quelli del pacchetto `calib` passano anche con il race detector (`-race`).

### Che cosa resta

- **(c)** LSL **non l'ho provato dal vivo**, perché sul computer di prova non è installata `liblsl`,
  la libreria su cui si appoggia. Non serve cambiare il driver, serve installarla.
- **(b)** Con un prossimo aggiornamento: l'invio dei pacchetti UDP a **più destinazioni** insieme,
  per esempio a Kite e a un programma di registrazione.

## 4. La calibrazione dello sguardo

### Due cose diverse che il 4C conserva, o non conserva

Per trasformare lo sguardo in un punto sullo schermo il 4C usa due informazioni memorizzate al suo
interno.

- L'**area dello schermo** (*display area*): dimensioni e posizione dello schermo rispetto al
  tracciatore. Ne ho parlato nella
  [seconda parte](/diario/tobii-4c-su-linux-2-dare-un-nome-ai-byte/).
- La **calibrazione**: un blocco di dati che adatta il modello dell'occhio alla persona, ottenuto
  facendole guardare alcuni punti sullo schermo.

### Risultato negativo: dopo lo spegnimento non restano

- **L'area dello schermo.** Dopo le accensioni a freddo del 5 e dell'11 novembre, l'area dello schermo
  del 4C misurava **4 × 4 mm**, il valore di fabbrica. Questo contraddice il README del driver, che
  dice che il 4C la conserva. Il README **non l'ho ancora corretto**, e va fatto. Quello che avevo
  scritto nella seconda parte riguardava la chiusura della sessione, con il dispositivo sempre
  alimentato: l'osservazione resta, ma non va estesa allo spegnimento.
- **La calibrazione.** Il 9 novembre ho staccato e ricollegato il 4C, con fermo `tobii-ws`, un
  servizio che avvia il driver per conto di un altro programma. Dopo 71 s sul dispositivo c'era la
  **calibrazione di fabbrica**: un blocco da 1469 byte, identico a quello che avevo letto il 4
  novembre. Ne concludo che la calibrazione **quasi certamente si perde** quando il 4C resta senza
  alimentazione.
- **Un indizio che sembra dire il contrario, ma non lo dice.** La mattina dell'11 novembre sul
  dispositivo c'era un blocco di calibrazione da **357 KB**, molto più grande di quello di fabbrica.
  Probabilmente l'ha riapplicato `tobii-ws`, che all'avvio legge la calibrazione salvata in un file
  (`calibration.bin`) e la manda al tracciatore. Quindi **non dimostra** che la calibrazione sia
  sopravvissuta allo spegnimento.

La conseguenza pratica, se confermata, è chiara: chi usa il driver deve riapplicare area dello schermo
e calibrazione a ogni accensione del 4C. Il driver sa già farlo; non servono modifiche.

### Che cosa resta

Entrambe le verifiche sono di tipo **(c)** e nessuna richiede di modificare il driver:

- una **nuova calibrazione** con la misura della sua accuratezza, che richiede una persona davanti al
  tracciatore;
- una **prova pulita della persistenza**: staccare fisicamente il cavo con `tobii-ws` fermo, così che
  nessun programma possa riapplicare la calibrazione, e rileggerla alla riaccensione.

## 5. Il beccheggio della testa dalle immagini infrarosse

### Che cosa ho fatto

Nella [voce dell'8 novembre](/diario/tobii-4c-il-beccheggio-della-testa-dal-viso/) avevo stimato il
**beccheggio** della testa, il movimento del "sì", dai punti del viso trovati da una rete neurale,
MediaPipe Face Landmarker ([Google AI Edge, s.d.](#riferimenti)), su una webcam. Quel metodo è ora
**portato** nel driver, sulle immagini infrarosse (IR) del 4C: 640 × 480 pixel in scala di grigi, a
30 immagini al secondo.

Per trasformare punti dell'immagine in angoli serve conoscere la camera: la sua **focale** in pixel e
la sua posizione rispetto al tracciatore. Ho ricalcolato questa calibrazione della camera IR dalla
sessione registrata il 7 novembre, che contiene **698 campioni**.

### Risultati, solo offline

| Grandezza | Ricalcolata | Salvata in precedenza |
| --- | --- | --- |
| Focale | 740 px | 730 px |
| Posizione della camera | entro circa 3,5 mm da quella salvata | — |
| Errore di riproiezione | 2,75 px | — |

L'**errore di riproiezione** è la distanza media, in pixel, tra dove il modello della camera colloca i
punti nell'immagine e dove si trovano davvero. Più è piccolo, meglio il modello descrive la camera. Le
due calibrazioni sono vicine: una differenza di 10 px su 730 è circa l'1,4 %.

La sessione del 9 novembre, invece, **non contiene campioni utilizzabili** per questo calcolo.

### Dal vivo, senza nessuno

Con il flusso delle immagini sempre attivo, lo stimatore ha elaborato
**tutte le immagini**: 30 al secondo, nessuna scartata. Ma senza nessuno davanti non ha prodotto
**nessun valore di beccheggio**. È il comportamento atteso, non un errore: senza viso non c'è niente
da misurare. Dice però che dal vivo ho verificato il carico di lavoro, non la stima.

### Il modello sulle immagini IR, in un video

Il video che segue non fa parte delle sessioni misurate. È una registrazione dello schermo
dell'interfaccia di telemetria del driver, fatta l'11 novembre, con **una persona davanti** al 4C.
Mostra una cosa sola, ma importante: il modello Face Landmarker, pensato per immagini a colori,
**trova il viso sulle immagini IR del 4C** e la rete di 478 punti lo segue mentre la persona si
avvicina e si allontana, inclina e gira la testa, apre la bocca.

<video controls muted playsinline preload="metadata" poster="/assets/img/kite/viso-dalle-immagini-ir-anteprima.jpg" aria-label="Video di circa 27 secondi dell'interfaccia «Telemetria del Tobii 4C»: in alto a sinistra l'immagine infrarossa del 4C con una persona davanti; sul viso la rete verde dei 478 punti di Face Landmarker e il riquadro del ritaglio passato al modello seguono la persona che si avvicina, si allontana, inclina e gira la testa e apre la bocca. Gli altri pannelli mostrano sguardo, occhi nel volume di tracciamento, testa, modello del viso, pupille, presenza, flussi del dispositivo e pipeline. Il numero di serie del tracciatore è coperto.">
  <source src="/assets/img/kite/viso-dalle-immagini-ir-anteprima.mp4" type="video/mp4">
  Il browser non riesce a riprodurre il video: lo puoi
  <a href="/assets/img/kite/viso-dalle-immagini-ir-anteprima.mp4">scaricare qui</a> (MP4, 3,1 MB).
</video>

Per leggere il video con onestà:

- I valori nel pannello **Testa**, beccheggio compreso, sono quelli istantanei dell'interfaccia,
  **non misure di accuratezza**: non li ho confrontati con nessun riferimento.
- Nel pannello del modello la camera risulta calibrata con la focale salvata, 730 px, non con quella
  ricalcolata.
- Ho coperto il **numero di serie** del tracciatore, che l'interfaccia mostra in due punti.
- Il video è ricompresso a 30 fotogrammi al secondo per il sito.

Resta valido il dubbio della voce dell'8 novembre: che il modello trovi il viso non dice ancora con
quale precisione ne misuri la rotazione su immagini infrarosse, scure e riprese dal basso.

### Che cosa resta

Una prova di tipo **(c)**: con una persona davanti, confrontando il beccheggio con un **riferimento
indipendente**. Su Windows il software di Tobii fornisce una posa della testa, ma su Linux non esiste,
quindi il riferimento dovrà venire da un'altra parte.

## Che cosa ho imparato

- **Il driver regge il tempo, almeno a vuoto.** Un'ora di flusso in due sessioni, nessun campione
  perso, la latenza mediana intorno ai 20 µs. Senza una persona, però, ho misurato il trasporto dei
  dati, non la loro qualità.
- **Le misure senza persona hanno un comportamento proprio.** La frequenza un po' più bassa e la
  presenza che cambia da sola sono risultati veri, ma riguardano una scena vuota. Non li estendo al
  caso d'uso reale.
- **Il 4C dimentica quando si spegne.** È un risultato negativo che contraddice il mio README, e
  cambia il modo d'uso: area dello schermo e calibrazione vanno riapplicate a ogni accensione.
- **Rimandare non è fallire.** Due verifiche aspettano un aggiornamento del driver. Ho preferito non
  cambiare il codice durante le misure, per sapere con certezza che cosa stavo misurando.

## Problemi aperti

- Tutte le prove dal vivo sono **senza persona**: sguardo mai valido, viso mai trovato.
- Un solo esemplare di 4C, un solo firmware (4.7.0), un solo computer.
- Il README del driver dice ancora che il 4C conserva l'area dello schermo: è sbagliato dopo uno
  spegnimento e va corretto.
- Il beccheggio dalle immagini IR non ha ancora un riferimento con cui confrontarsi.

## Prossimi passi

Con una persona davanti al tracciatore, o con un'azione fuori dal codice **(c)**:

1. Ripetere le sessioni lunghe del passo 1 con una persona davanti.
2. Fare una nuova calibrazione e misurarne l'accuratezza.
3. Provare la persistenza della calibrazione staccando fisicamente il cavo, con `tobii-ws` fermo.
4. Provare il beccheggio dalle immagini IR con una persona e un riferimento indipendente.
5. Installare `liblsl` e provare l'uscita LSL dal vivo.
6. Correggere il README sulla persistenza dell'area dello schermo.

Con i prossimi aggiornamenti del driver **(b)**:

1. Un'opzione `-duration` e i percentili di latenza calcolati su tutta la sessione.
2. Un'opzione di registrazione nel formato `.hex` delle catture di test, con il numero di serie
   azzerato, per aggiungere le catture del 4C ai test.
3. L'invio dei pacchetti UDP a più destinazioni.

> **Avvertenza.** Kite è un progetto sperimentale e **non è un dispositivo medico certificato**. Il
> driver è un software non ufficiale che usa il tracciatore in modi non previsti dal produttore. Le
> immagini IR del 4C riprendono il viso: sono dati personali, e pubblicarle richiede il consenso della
> persona ripresa. Chi dipende da uno strumento di CAA per comunicare
> dovrebbe avere sempre un'alternativa di riserva. Le prove con persone richiedono il consenso
> informato e, quando serve, il parere di un comitato etico.

## Riferimenti

1. Google AI Edge (s.d.). *MediaPipe Face Landmarker*. Documentazione tecnica ufficiale.
   [developers.google.com](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)
2. Kothe C., Shirazi S. Y., Stenner T., Medine D., Boulay C., Grivich M. I., Artoni F., Mullen T.,
   Delorme A., Makeig S. (2025). The lab streaming layer for synchronized multimodal recording.
   *Imaging Neuroscience*, 3, IMAG.a.136.
   [doi:10.1162/IMAG.a.136](https://doi.org/10.1162/IMAG.a.136) (open access su
   [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12434378/))
3. Postel J. (1980). *User Datagram Protocol*. RFC 768 (STD 6), RFC Editor.
   [doi:10.17487/RFC0768](https://doi.org/10.17487/RFC0768)
