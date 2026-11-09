---
ref: tobii-4c-linux-re-2
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Tobii 4C su GNU/Linux (2/3): dare un nome ai byte"
description: "Seconda parte del reverse engineering del protocollo del Tobii 4C: uno strumento che legge tutto, un fuzzing prudente un campo alla volta, i messaggi da ricomporre, i flussi e le loro colonne, la posa della testa che non c'è e ciò che resta oscuro."
tags: [eye-tracking, tobii, linux, usb, reverse-engineering, caa]
---

Nella [prima parte](/diario/tobii-4c-su-linux-1-leggere-prima-di-toccare/) ho raccolto quello che
si sa del protocollo del **Tobii Eye Tracker 4C**: gli endpoint USB, la forma dei messaggi TTP, i
campi TLV, i numeri big-endian e in virgola fissa. Alla fine avevo una grammatica, ma non un
vocabolario. Sapevo leggere la struttura di un messaggio, non che cosa volesse dire.

In questa seconda parte racconto come ho cercato di **dare un nome ai byte**: quale campo è lo
sguardo, quale è un contatore, quale è un errore, quale non so ancora che cosa sia. Il metodo è lo
stesso delle voci precedenti: l'assistente AI propone ipotesi e mi aiuta a scrivere gli strumenti,
io le verifico sui dati reali e decido che cosa tenere.

Non ci sono misure di prestazioni. C'è un metodo, ci sono i fatti del protocollo che ne sono emersi
e c'è un elenco onesto di zone d'ombra.

## Uno strumento che legge tutto

Il primo strumento che ho scritto, con l'aiuto dell'assistente AI, è un programma di cattura e
decodifica generica, che ho chiamato `dump`. La regola che gli ho dato è semplice: **non buttare
via niente di quello che non capisce**.

Il programma apre la sessione, si iscrive ai flussi di dati che gli indico e, per ogni messaggio
che arriva:

1. riconosce il tipo di messaggio dall'intestazione (risposta, campione di un flusso, notifica);
2. scompone il contenuto nei suoi campi TLV, anche se non sa che cosa significano;
3. per ogni colonna stampa la chiave numerica, il nome (se il dispositivo gliel'ha detto), il tipo e
   il valore;
4. se il contenuto non ha la forma attesa, stampa i primi byte in esadecimale invece di scartarli.

Alla fine stampa un riepilogo per ogni flusso: quanti messaggi sono arrivati, a che frequenza e con
quale dimensione minima e massima. Può anche salvare le immagini del sensore come file PGM, un
formato grafico in scala di grigi molto semplice, così posso aprirle con un normale visualizzatore.

È un decodificatore che conosce i **tipi**, non i **significati**. Sa che un campo è "un numero
intero a 32 bit" o "un punto 3D in virgola fissa", ma non sa che quel punto è un occhio. Il
significato lo metto io, dopo.

### Le etichette delle strutture

Nella parte 1 avevo descritto i TLV come etichette di un pacco. Guardando molti messaggi è emerso
che un tipo di TLV, lo `0x05`, fa da **etichetta di struttura**: annuncia che cosa viene dopo e
quanti elementi contiene. I 16 bit alti contano gli elementi, i 16 bit bassi dicono di che struttura
si tratta. La documentazione della comunità per il Tobii Eye Tracker 5 (ET5), il successore del 4C,
chiama **XDS** queste righe di dati ([Tropaion, s.d.](#riferimenti)).

| Etichetta (16 bit bassi) | Che cosa annuncia |
| --- | --- |
| `0x0bb8` | una **riga** di dati, cioè un campione di un flusso, con *n* colonne |
| `0x0bb9` | una **colonna**: una chiave seguita da un valore |
| `0x1f40` | un **punto 2D**: due numeri in virgola fissa |
| `0x1f41` | un **punto 3D**: tre numeri in virgola fissa |
| `0x0100` | un **elenco** di record (per esempio il catalogo dei flussi) |

Un esempio concreto aiuta. Questo è un messaggio reale di 101 byte del flusso di **presenza**
dell'utente. Non viene dal mio 4C: è una cattura dell'**ET5** pubblicata nel progetto Open-tobii
di Krazubu (prima chiamato tobii-linux), con licenza MIT ([Krazubu, s.d.](#riferimenti)). La
struttura è la stessa che leggo sul 4C.

```text
01 00 00 00 65 00 00 00         busta USB: dal dispositivo, 101 byte in tutto
00 00 00 53                     tipo di messaggio: campione di un flusso
00 00 00 00                     seq: 0
00 00 00 00                     stato: 0
00 00 05 04                     flusso 0x504 (presenza)
00 00 00 00                     errore: nessuno
00 00 00 45                     69 byte di contenuto
00 00                           prefisso fisso del contenuto
05 00000004 00020bb8            riga con 2 colonne
05 00000004 00020bb9              colonna
02 00000004 00000001                chiave 1
06 00000008 0000001891b53908        intero a 64 bit: marca temporale
05 00000004 00020bb9              colonna
02 00000004 00000002                chiave 2
01 00000004 00000002                intero a 32 bit: valore 2
```

Il decodificatore generico arriva fino a qui: "riga di due colonne, la 1 è un intero a 64 bit, la 2
vale 2". Che la colonna 1 sia un tempo in microsecondi e che 2 voglia dire "c'è una persona davanti"
è un'interpretazione, e va verificata a parte.

## Il fuzzing, con le mani in tasca

### Che cos'è il fuzzing

Nel 1990 Barton Miller e i suoi colleghi mandarono sequenze di caratteri casuali a decine di
programmi Unix e videro che una parte consistente si bloccava o andava in crash
([Miller et al., 1990](#riferimenti)). Da quel lavoro viene il nome *fuzz testing*. Oggi per
**fuzzing** si intende, in generale, eseguire ripetutamente un programma con ingressi generati
automaticamente, anche malformati, per vedere come reagisce ([Manès et al., 2021](#riferimenti)).

Nel reverse engineering di un protocollo il fuzzing ha uno scopo un po' diverso. Non cerco errori:
cerco **significati**. Se cambio un solo byte di un comando e la risposta cambia, quel byte conta. Se
la risposta non cambia, forse è un campo riservato. Se arriva un errore, l'errore stesso è
un'informazione.

### Perché qui va fatto con prudenza

Un programma che va in crash si riavvia. Un dispositivo fisico no, o non sempre. Il 4C ha
**illuminatori infrarossi** che lavorano a pochi centimetri dagli occhi, una **memoria permanente**
in cui conserva impostazioni e calibrazione, e un firmware che non posso reinstallare. Per l'ET5 è
documentata anche una modalità di avvio separata, con un altro identificativo USB, che serve solo ad
aggiornare il firmware ([Aetherall, s.d.](#riferimenti)).

Per questo non ho fatto un fuzzing "a tappeto", con byte casuali sul canale di uscita. Ho fatto
l'opposto: un fuzzing **lento, mirato e reversibile**.

Queste sono le cose che **non invio**, per scelta:

- **niente che possa toccare gli illuminatori IR**: non cerco comandi che ne cambino potenza o
  temporizzazione, e mi fermo se vedo comportamenti strani della luce;
- **niente scritture permanenti alla cieca**: niente comandi di calibrazione (avvio, cancellazione,
  calcolo, scrittura del blocco di calibrazione) e niente scrittura dell'**area dello schermo**
  senza averne prima letto e salvato il valore attuale. La documentazione dell'ET5 segnala come
  "distruttivo" il comando che cancella la calibrazione ([Tropaion, s.d.](#riferimenti));
- **niente aggiornamenti del firmware** e niente comandi che possano portare il dispositivo in
  modalità di aggiornamento;
- **niente sul terzo endpoint di uscita**, lo `0x04`: esiste nei descrittori USB, ma non conosco
  nessuna implementazione che lo usi, quindi non ci scrivo;
- **niente byte casuali**: ogni comando che invio ha una struttura valida, presa da un comando già
  noto, con un solo campo cambiato.

### Il metodo, un campo alla volta

1. **Una registrazione di riferimento.** Prima di toccare qualcosa registro con `dump` una sessione
   normale: apertura, richieste note, flussi. È il termine di paragone.
2. **Prima le letture.** Comincio dai comandi che chiedono un'informazione senza cambiare nulla, come
   l'identità del dispositivo, il catalogo dei flussi, l'area dello schermo, il volume di
   tracciamento.
3. **Un solo campo alla volta.** Parto da un comando valido e cambio un campo: per esempio il numero
   del flusso di cui chiedo l'elenco delle colonne. Tutto il resto resta identico.
4. **Confronto byte per byte.** Metto a confronto le risposte e segno che cosa è cambiato: la parola
   di errore, la lunghezza, i singoli campi, eventuali notifiche o flussi nuovi.
5. **Stabile o variabile.** Ripeto la stessa richiesta più volte. I campi che cambiano anche a
   parità di richiesta sono contatori, numeri di sequenza o tempi. Quelli che restano fermi sono
   candidati a essere costanti, identificativi o configurazioni.
6. **Controllo dello stato.** Alla fine rileggo le impostazioni permanenti, come l'area dello
   schermo, per essere sicuro di non aver cambiato niente.
7. **Fermarsi subito.** Se il dispositivo si scollega da solo, cambia comportamento o la luce IR fa
   qualcosa di insolito, mi fermo e non ripeto il comando.

### Come distinguo un contatore da un tempo

Nei campioni dello sguardo alcuni campi cambiano a ogni messaggio. Per dargli un nome uso il loro
andamento, non il loro valore:

- un **numero di sequenza** o un **contatore di frame** cresce di un passo fisso;
- una **marca temporale** cresce di una quantità che dipende dalla frequenza. Se l'unità è il
  microsecondo e il flusso va a 90 Hz, due campioni consecutivi dovrebbero distare circa
  11 100 µs. È il controllo che uso per confermare l'unità;
- un **valore fisico**, come una coordinata, oscilla senza una regola semplice.

Un'altra cosa utile è emersa così: le risposte ai comandi hanno sempre la parola di stato a 1,
mentre nelle catture i campioni dei flussi hanno stato 0 e numero di sequenza 0. Per prudenza i
numeri di sequenza delle mie richieste partono da 1 e saltano lo 0.

### I codici di errore

Quando il dispositivo rifiuta un comando, lo dice nella parola di errore dell'intestazione. Ho dato
un'etichetta provvisoria a quattro codici. Solo per uno ho un caso concreto sul 4C; per gli altri il
nome è un'**ipotesi** sul significato, da confermare.

| Codice | Etichetta | Dove l'ho incontrato |
| --- | --- | --- |
| `0x20000501` | non supportato | ipotesi |
| `0x20000505` | non autorizzato | iscrizione al flusso `image_collection` (`0x508`) sul 4C |
| `0x20000508` | stato non valido | ipotesi |
| `0x20000509` | parametro non valido | ipotesi |

### I comandi che ho imparato a riconoscere

Non tutti i codici operativi (*opcode*) che ho visto hanno un nome nella documentazione della
comunità. Questi sono quelli che riconosco con sicurezza; per molti il significato viene dalla
risposta stessa, che contiene testi leggibili o strutture note.

| Opcode | Che cosa fa | Tipo |
| --- | --- | --- |
| `0x3e8` | saluto iniziale, restituisce la versione del protocollo | lettura |
| `0x58c` | stringhe di identità: numero di serie, modello, generazione, firmware | lettura |
| `0x640` | interroga il "realm", cioè se serve un'autenticazione | lettura |
| `0x4b0` | **catalogo dei flussi**: numero e nome di ogni flusso | lettura |
| `0x4ba` | **colonne di un flusso**: chiave e nome di ogni colonna | lettura |
| `0x4c4` / `0x4ce` | iscrizione a un flusso / cancellazione dell'iscrizione | sessione |
| `0x578` | volume di tracciamento (*track box*) | lettura |
| `0x83e` | geometria di montaggio del tracciatore | lettura |
| `0x532`, `0x5d2` | proprietà e stato, come coppie chiave e testo | lettura |
| `0x596` | legge l'area dello schermo | lettura |
| `0x5a0` | scrive l'area dello schermo | **scrittura permanente** |

Sul 4C la richiesta di realm risponde 0, che interpreto come "nessuna autenticazione richiesta".
Anche per l'ET5 è documentato lo stesso valore ([Tropaion, s.d.](#riferimenti)).

### Il confronto con l'ET5

Per l'ET5 la comunità ha cercato i flussi provando a iscriversi a un intervallo di numeri. Ha
scoperto una cosa importante: il dispositivo **conferma** l'iscrizione a tutti i numeri
dell'intervallo provato, ma per la maggior parte poi non manda nulla. Una conferma, da sola, non
prova che un flusso esista ([Tropaion, s.d.](#riferimenti)).

Sul 4C ho potuto evitare questa ricerca alla cieca, perché il dispositivo ha un **catalogo** che
elenca i flussi per nome (`0x4b0`) e un comando che elenca le colonne di ciascun flusso, sempre per
nome (`0x4ba`). Lo stesso comando compare nelle catture dell'ET5 ([Krazubu, s.d.](#riferimenti)). È
stata la scoperta più utile di tutto il lavoro: **molti byte il nome ce l'hanno già**, basta
chiederlo al firmware.

## Rimettere insieme i messaggi

Nella parte 1 avevo anticipato la **frammentazione** (un messaggio spezzato in più trasferimenti) e
l'**accorpamento** (più messaggi nello stesso trasferimento). Ecco come li ho affrontati in pratica.

### Perché succede

Di norma un trasferimento USB di tipo *bulk* contiene esattamente un messaggio. Il trasferimento si
chiude quando arriva un pacchetto più corto della dimensione massima dell'endpoint, il cosiddetto
*short packet* ([Microsoft, s.d.](#riferimenti)). Ci sono però dei casi in cui questo confine si
perde:

- il buffer di lettura è più piccolo del messaggio, e il messaggio arriva **a pezzi**
  (frammentazione);
- un messaggio lungo esattamente un multiplo della dimensione massima di un pacchetto (512 byte) non
  ha uno *short packet* finale: se il dispositivo non lo chiude con un pacchetto vuoto, può finire
  **incollato** al successivo (accorpamento);
- un'interruzione del trasferimento lascia a metà un messaggio.

### Il riassemblatore

Il programma che rimette insieme i messaggi lavora così:

1. accumula i byte che arrivano in un unico buffer;
2. controlla se l'inizio del buffer **sembra** l'inizio di un messaggio: primo byte `01` (dal
   dispositivo), tre zeri, una lunghezza plausibile, tra 32 byte e 1 MiB, e un tipo di messaggio
   noto (`0x51` richiesta, `0x52` risposta, `0x53` flusso, `0x4e` notifica);
3. se sì, aspetta di avere tanti byte quanti ne dichiara la lunghezza, e consegna il messaggio;
4. se no, **risincronizza**: avanza di un byte alla volta finché non trova un inizio plausibile, e
   conta i byte scartati. Se non lo trova, tiene da parte solo gli ultimi 11 byte, che potrebbero
   essere l'inizio spezzato del prossimo messaggio.

Il limite di 1 MiB è una soglia di buon senso. Un'immagine IR del 4C occupa poco più di 300 KB,
quindi un messaggio che dichiara molto di più è quasi certamente un errore di allineamento.

### Le risposte a puntate

Alcune risposte sono troppo grandi per un solo trasferimento. Nelle catture dell'ET5 il blocco di
calibrazione supera i 650 KB ([Krazubu, s.d.](#riferimenti)). Il dispositivo allora manda:

- una **testa**: un normale messaggio di risposta, la cui intestazione dichiara più contenuto di
  quanto ne trasporti davvero;
- una serie di **continuazioni**: pezzi con la loro busta USB, ma senza l'intestazione TTP.

Il riassemblatore riconosce la testa, attacca le continuazioni una dopo l'altra e consegna la
risposta solo quando è completa. Se una continuazione porta più byte di quelli che mancano, la
risposta è corrotta e la scarto intera, invece di consegnare un messaggio sbagliato. La stessa
tecnica è descritta per l'ET5 ([Tropaion, s.d.](#riferimenti)).

Vale anche nell'altra direzione. Un comando più lungo di 4087 byte va spezzato in più trasferimenti,
ciascuno con la sua busta, e il dispositivo risponde una sola volta, dopo l'ultimo pezzo.

C'è poi un'asimmetria da tenere a mente: nella busta USB la lunghezza **in uscita** conta i byte
dopo la busta, quella **in ingresso** conta il messaggio intero, busta compresa. È documentata
anche per l'ET5 ([Tropaion, s.d.](#riferimenti)).

### Abbinare risposta e richiesta

Le risposte non arrivano in una coda separata: si mescolano ai campioni dei flussi, che arrivano di
continuo. Per abbinarle uso due campi dell'intestazione:

- **seq**, il numero di sequenza: la risposta riporta lo stesso numero della richiesta;
- **op**, l'opcode: la risposta riporta lo stesso comando.

Se arriva una risposta con il seq giusto ma l'op sbagliato, la segnalo e continuo ad aspettare. Se
arriva una risposta che nessuno aspetta più, per esempio dopo un tempo scaduto, la conto come
"orfana" e la scarto. Le **notifiche** (`0x4e`) sono messaggi spontanei del dispositivo: per
esempio `0x5aa` avvisa che l'area dello schermo è cambiata, `0xc94` che è attiva una nuova
calibrazione.

Ho controllato il riassemblatore sulle catture reali dell'ET5 ([Krazubu, s.d.](#riferimenti)):
ho messo in fila tre messaggi, li ho spezzati in pezzi di 1, 7, 64, 512 e 1000 byte e ho
verificato che uscissero sempre gli stessi tre messaggi, identici. Ho anche messo dei byte spazzatura
davanti a un messaggio, per vedere che la risincronizzazione lo ritrovasse.

## I flussi e le loro chiavi

### Il catalogo

Il catalogo del 4C elenca sei flussi. Lo metto accanto a quello dell'ET5, ricavato dalle catture di
Krazubu ([Krazubu, s.d.](#riferimenti)).

| Numero | Nome nel firmware | 4C | ET5 | Che cosa contiene |
| --- | --- | --- | --- | --- |
| `0x500` | `gaze` | sì | sì | sguardo, occhi, pupille: il flusso principale |
| `0x501` | `image` | sì | sì | immagini della camera IR |
| `0x504` | `presence` | sì | sì | presenza dell'utente, a eventi |
| `0x508` | `image_collection` | sì | sì | sul 4C l'iscrizione viene rifiutata come "non autorizzata" |
| `0x50e` | `primary_camera_image` | no | sì | non presente sul 4C |
| `0x1770` | `algodbg` | sì | sì | diagnostica: sul 4C righe con un blocco di dati vuoto |
| `0x1771` | `is5_sync_stream` | no | sì | non presente sul 4C |
| `0x1772` | `log` | sì | sì | righe di testo del firmware |
| `0x1774` | `custom` | no | sì | non presente sul 4C |

### Il flusso dello sguardo

Ogni campione dello sguardo è una riga XDS con **39 colonne**. Le chiavi sono le stesse sul 4C e
sull'ET5, e i nomi li restituisce il firmware stesso con il comando `0x4ba`. Questa è la mappa che
ho ricostruito tra le colonne e i campi di un campione. Dove ci sono due chiavi, la prima è
l'occhio sinistro e la seconda il destro.

| Chiavi | Nome nel firmware | Tipo | Campo del campione |
| --- | --- | --- | --- |
| `0x01` | Timestamp | intero a 64 bit | tempo del dispositivo, in µs |
| `0x14` | (nessun nome) | intero a 32 bit | contatore dei frame |
| `0x1c` · validità `0x1b` | Relative Combined Gaze Point | punto 2D | **punto di sguardo** sullo schermo, filtrato, normalizzato tra 0 e 1 |
| `0x20` · validità `0x1f` | Remote Gaze Point Responsive Combined | punto 2D | punto di sguardo "reattivo", che interpreto come non filtrato |
| `0x02`, `0x08` · validità `0x16`, `0x15` | Gaze Origin Tracker | punto 3D | **origine 3D degli occhi** (centro della cornea), in mm, rispetto al tracciatore |
| `0x22`, `0x24` · validità `0x21`, `0x23` | Gaze Origin Display | punto 3D | la stessa origine, in mm, rispetto al centro dello schermo |
| `0x03`, `0x09` · validità `0x1d`, `0x1e` | Eye 3D Relative Position | punto 3D | posizione dell'occhio nel volume di tracciamento, tra 0 e 1 |
| `0x05`, `0x0b` | Eye 2D Gaze Point | punto 2D | punto di sguardo del singolo occhio |
| `0x06`, `0x0c` | Eye Pupil Diameter | virgola fissa 16.16 | **diametro pupillare**, in mm |
| `0x07`, `0x0d` | Eye Validity | intero a 32 bit | stato dell'occhio: 0 tracciato, 4 non rilevato |
| `0x29`, `0x2b` · validità `0x2a`, `0x2c` | Absolute Eye Openness | virgola fissa 16.16 | **apertura della palpebra** (vedi sotto) |

Altre colonne hanno un nome ma per ora non le uso: il punto di sguardo 3D di ciascun occhio
(`0x04`, `0x0a`), il centro del bulbo oculare (`0x17`, `0x18`), una posizione 2D "rispetto all'area
del sensore" (`0x19`, `0x1a`) e una guida al posizionamento dell'utente (`0x25`–`0x28`).

Tre dettagli mi hanno fatto riflettere.

**Due convenzioni di validità.** Le colonne "Validity" valgono 1 quando il dato è valido. Lo stato
dell'occhio, invece, vale **0** quando l'occhio è tracciato e 4 quando non lo è. Confondere le due
convenzioni vuol dire leggere tutto al contrario.

**Gli zeri non sono dati.** Quando non vede un occhio, il dispositivo continua a mandare le sue
colonne, ma azzerate. La documentazione dell'ET5 lo sottolinea: la validità va decisa dallo stato
dell'occhio, mai dalla semplice presenza della colonna ([Tropaion, s.d.](#riferimenti)). Altrimenti
si finisce per credere che ci sia un occhio esattamente sopra il sensore, nel punto (0, 0, 0).

**Due sistemi di riferimento.** L'origine degli occhi arriva due volte: rispetto al tracciatore e
rispetto al centro dello schermo. La seconda il firmware la calcola a partire dall'area dello
schermo memorizzata nel dispositivo. Per questo l'area dello schermo, che è un'impostazione
permanente, va trattata con tanta cura.

### L'apertura degli occhi: la colonna c'è, il dato no

Nella [voce del risveglio](/diario/tobii-4c-il-risveglio-dopo-10-anni-di-letargo/) mi chiedevo se
il 4C fornisse l'apertura degli occhi. La risposta è a metà. La colonna esiste e il firmware la
chiama "Absolute Eye Openness". Ma il valore è **−1**, con la validità a 0: è il modo in cui il
dispositivo dice "sconosciuto". Così è nella cattura dell'ET5 ([Krazubu, s.d.](#riferimenti)) e
così l'ho sempre trovata finora sul mio 4C. Per ora, quindi, su questo dispositivo l'apertura degli
occhi **non è disponibile**. È un risultato negativo, e lo riporto come tale.

### Il flusso della presenza

Il flusso `0x504` è fatto di righe con due colonne: la marca temporale (`0x01`) e un valore
(`0x02`). Non arriva a cadenza fissa: è **a eventi**. Il dispositivo lo manda una volta al momento
dell'iscrizione e poi solo quando lo stato cambia. Nella cattura dell'ET5, con una persona davanti,
il valore è 2; sul 4C, senza nessuno davanti, ho visto 1. La mia ipotesi è che 0 voglia dire
"sconosciuto", ma non l'ho ancora visto comparire.

### Il flusso delle immagini

Il flusso `0x501` era quello che aspettavo di più, per il motivo spiegato nella
[voce sul beccheggio](/diario/tobii-4c-il-beccheggio-della-testa-dal-viso/): servono immagini del
viso. Sul 4C ogni messaggio è una riga XDS con cinque colonne:

| Chiave | Nome nel firmware | Contenuto |
| --- | --- | --- |
| `0x01` | Timestamp | tempo in µs, con lo stesso orologio del flusso dello sguardo |
| `0x02` | Bits per pixel | 8 |
| `0x03` | Width | 640 |
| `0x04` | Height | 480 |
| `0x05` | Image | 640 × 480 byte, riga per riga, in scala di grigi |

È l'**immagine intera della camera infrarossa**, 640 × 480 pixel a 8 bit, cioè 307 200 byte di
pixel più le etichette: 307 350 byte di contenuto in tutto. Arriva a 30 immagini al secondo, meno
dei 90 campioni al secondo dello sguardo. Per l'ET5 la comunità ipotizza invece immagini molto più
piccole, intorno ai 78 KB, forse di un solo occhio ([Tropaion, s.d.](#riferimenti)). È una delle
differenze più nette tra i due dispositivi.

### I flussi di diagnostica e le letture di servizio

Il flusso `log` (`0x1772`) manda righe di testo del firmware, con la marca temporale del
tracciatore. Una delle righe che ho visto è
`[ 73592.529468] (I) TDI thread: Changed run mode to 22`. Non so che cosa sia il "run mode 22", ma
durante il fuzzing è una finestra preziosa su ciò che succede dentro il dispositivo. Il flusso
`algodbg` (`0x1770`), invece, sul 4C arriva alla stessa cadenza dello sguardo ma con un blocco di
dati vuoto.

Tra le letture di servizio, il **volume di tracciamento** (`0x578`) arriva come otto vertici di un
tronco di piramide. Sul 4C il piano vicino misura 300 × 200 mm a 450 mm dal sensore, quello lontano
550 × 400 mm a 900 mm. La scheda tecnica, che avevo citato nella
[prima voce](/diario/tobii-4c-il-risveglio-dopo-10-anni-di-letargo/), descrive l'area di
tracciamento in un altro modo (40 × 30 cm a 75 cm). Non so ancora come si colleghino le due
descrizioni.

## Nessun flusso per la testa

Nel catalogo del 4C non c'è un flusso per la **posa della testa**, e nessuna delle 39 colonne dello
sguardo contiene un orientamento. Lo stesso vale per l'ET5: la documentazione della comunità non ha
trovato la posa né nel flusso dello sguardo né tra i flussi provati
([Tropaion, s.d.](#riferimenti)), e il catalogo nelle catture di Krazubu non ha un flusso con un
nome del genere ([Krazubu, s.d.](#riferimenti)). La mia ipotesi, già scritta nella prima voce, è che
su Windows la posa venga calcolata dal software sul PC.

Quello che il dispositivo mi dà sono i **due centri corneali**, in due sistemi di riferimento
(`0x02`/`0x08` e `0x22`/`0x24`). Da due punti si ricavano la posizione della testa, l'imbardata e il
rollio, ma non il **beccheggio**: il "sì" ruota la testa attorno a un asse che passa quasi per i due
occhi, e i due punti restano fermi. È il problema da cui era partita la
[voce sul beccheggio](/diario/tobii-4c-il-beccheggio-della-testa-dal-viso/), dove ho provato a
ricavarlo dal viso con una webcam. Adesso so che il 4C mi può dare le immagini su cui portare quel
metodo: 640 × 480 pixel, a 30 Hz, con lo stesso orologio dello sguardo.

## Vicoli ciechi e zone d'ombra

### Un errore che ho fatto

Nella mia prima mappa le colonne `0x1d` e `0x1e` erano assegnate alla validità dello sguardo 2D di
ciascun occhio. I valori non smentivano l'ipotesi: nella cattura dell'ET5 valgono 1 quando l'occhio
è visto. Il nome restituito dal firmware dice però un'altra cosa: "Left Eye 3D Relative Position
Validity". Sono la validità della posizione nel volume di tracciamento. Lo sguardo 2D del singolo
occhio, in realtà, **non ha** una colonna di validità propria, e va giudicato dallo stato
dell'occhio. Senza i nomi del firmware non me ne sarei accorto.

### Le ipotesi della comunità non sempre reggono

La documentazione dell'ET5 propone per alcune colonne delle ipotesi, segnalate onestamente come
tali ([Tropaion, s.d.](#riferimenti)). Due esempi: le colonne `0x29`/`0x2b`, ipotizzate come
grandezze legate alla pupilla o alla qualità, che il firmware chiama "apertura assoluta
dell'occhio"; e le colonne `0x04`/`0x0a`, ipotizzate come direzioni dello
sguardo, che il firmware chiama "punto di sguardo 3D". È una lezione di metodo che vale anche per
me: un'ipotesi plausibile non è un fatto, finché i dati non la confermano.

### Quello che non ho ancora decifrato

- **La colonna `0x11`.** Non ha nome. Per l'ET5 è descritta come un indicatore costante, di
  significato ignoto ([Tropaion, s.d.](#riferimenti)); sul 4C sembra crescere di uno a ogni frame,
  come un secondo contatore accanto allo `0x14`. Non so che cosa conti.
- **Le colonne `0x19`/`0x1a`**, "posizione 2D dell'occhio rispetto all'area del sensore". Valgono
  −1 anche con l'utente tracciato, sia nella cattura dell'ET5 sia sul 4C. Forse sono riservate a
  un altro modello, forse vanno attivate in qualche modo. Non lo so.
- **La guida al posizionamento** (`0x25`–`0x28`). Ha un nome e dei valori, ma non ho ancora capito
  come interpretarli.
- **Le proprietà** (`0x532`). Arrivano come coppie chiave e testo, per esempio `0x0` "Peripheral",
  `0x2` "HELLO_NIR", `0x3` "IS4LTOBIIPERIPHERAL". Il significato delle chiavi non è documentato.
- **Il saluto iniziale.** Il contenuto del comando `0x3e8` è una sequenza fissa di byte che copio
  così com'è dalle catture del software Windows. Funziona, ma non so che cosa dica ogni byte.
- **La coda della scrittura dell'area dello schermo.** Il comando `0x5a0` si chiude con un valore
  `0x3039`, cioè 12345 in decimale, anche questo copiato dalle catture. Ha l'aria di un segnaposto,
  ma è solo un'impressione.
- **Le altre interfacce USB.** Il 4C espone anche una camera USB standard (UVC) a 640 × 480 con un
  formato del produttore. Non l'ho esplorata.

### Le differenze con l'ET5

| Aspetto | ET5 (documentazione e catture della comunità) | 4C (le mie letture) |
| --- | --- | --- |
| Struttura dei messaggi, opcode, colonne dello sguardo | stessa famiglia di protocollo | identiche nelle parti che ho verificato |
| Generazione nelle stringhe di identità | `IS5` | `IS4` |
| Catalogo dei flussi | nove flussi | sei flussi |
| Immagini (`0x501`) | intorno ai 78 KB, forse un solo occhio (ipotesi) | 640 × 480 a 8 bit, l'intera camera |
| Chiusura della sessione | il dispositivo si riavvia e perde l'area dello schermo | non si riavvia e conserva l'area dello schermo |
| Autenticazione (realm) | 0, nessuna | 0, nessuna |

Il comportamento alla chiusura della sessione dell'ET5 viene dalla documentazione della comunità
([Tropaion, s.d.](#riferimenti)). Sul 4C il fatto che l'area dello schermo sopravviva alla sessione
è comodo, ma conferma anche che quella scrittura è **permanente**: un motivo in più per non
toccarla durante il fuzzing.

## Problemi aperti

- **Un solo esemplare.** Tutto quello che ho letto sul 4C viene da un solo dispositivo, con il
  firmware 4.7.0. Un firmware diverso potrebbe avere colonne diverse.
- **Colonne senza significato.** `0x11`, `0x19`/`0x1a`, `0x25`–`0x28` e le proprietà restano da
  capire.
- **L'apertura degli occhi manca.** Sul 4C la colonna vale sempre −1, almeno finora. Se servirà per
  Kite, andrà stimata in un altro modo, per esempio dai punti del viso come nella
  [voce sul beccheggio](/diario/tobii-4c-il-beccheggio-della-testa-dal-viso/).
- **I codici di errore** hanno etichette in buona parte ipotetiche.
- **Byte copiati senza capirli.** Il saluto iniziale e la coda della scrittura dell'area dello
  schermo funzionano, ma sono imitazioni delle catture, non comprensione.
- **I limiti del fuzzing prudente.** Le regole che mi sono dato lasciano fuori di proposito una
  parte del protocollo, come gli illuminatori e il firmware. Alcune funzioni del 4C potrebbero
  restare sconosciute proprio per questo. È un prezzo che accetto.

## Prossimi passi

1. Trasformare la mappa dei messaggi e delle colonne in un'architettura di driver e in codice: sarà
   il tema della terza e ultima parte di questa serie.
2. Portare la stima del beccheggio dalla webcam alle immagini IR del flusso `0x501`.
3. Continuare il fuzzing in sola lettura sulle colonne non decifrate, confrontando i valori con
   situazioni controllate (occhio coperto, persona lontana, persona fuori dal volume di
   tracciamento).
4. Studiare i comandi di calibrazione solo dopo avere un modo sicuro per salvare e ripristinare la
   calibrazione attuale.
5. Pubblicare la descrizione del protocollo del 4C, comprese le parti che non ho capito.

> **Avvertenza.** Kite è un progetto sperimentale e **non è un dispositivo medico certificato**. Il
> reverse engineering e il fuzzing descritti qui usano il tracciatore in modi non previsti dal
> produttore: un comando di cui non si conosce l'effetto potrebbe cambiare le impostazioni permanenti
> del dispositivo o il comportamento degli illuminatori infrarossi, che lavorano vicino agli occhi.
> Chi volesse ripetere queste prove dovrebbe limitarsi alle letture e salvare prima le impostazioni.
> Le immagini IR del flusso `0x501` riprendono il viso: sono dati personali. Chi dipende da uno
> strumento di CAA per comunicare dovrebbe avere sempre un'alternativa di riserva. Le prove con
> persone richiedono il consenso informato e, quando serve, il parere di un comitato etico.

## Riferimenti

1. Aetherall (s.d.). *tobiifree: an ongoing experiment to make Tobii eye trackers work on Linux*
   [repository della comunità, non ufficiale, per il Tobii Eye Tracker 5]. GitHub.
   [github.com/Aetherall/tobiifree](https://github.com/Aetherall/tobiifree)
2. Krazubu (s.d.). *Open-tobii: Linux driver for the Tobii Eye Tracker 5* [repository della
   comunità, non ufficiale, già tobii-linux, derivato da Skyggedans/tobii-linux; ricostruito da
   catture USB del software Windows; licenza MIT]. GitHub.
   [github.com/Krazubu/Open-tobii](https://github.com/Krazubu/Open-tobii)
3. Manès V. J. M., Han H., Han C., Cha S. K., Egele M., Schwartz E. J., Woo M. (2021). The art,
   science, and engineering of fuzzing: a survey. *IEEE Transactions on Software Engineering*,
   47(11), 2312–2331. [doi:10.1109/TSE.2019.2946563](https://doi.org/10.1109/TSE.2019.2946563).
   Versione preprint: [arXiv:1812.00140](https://arxiv.org/abs/1812.00140)
4. Microsoft (s.d.). *USB bandwidth allocation* (sezioni "USB transfer and packet sizes" e
   "Delimiting USB data transfers with packets smaller than wMaxPacketSize"). Microsoft Learn,
   documentazione tecnica ufficiale.
   [learn.microsoft.com](https://learn.microsoft.com/en-us/windows-hardware/drivers/usbcon/usb-bandwidth-allocation)
5. Miller B. P., Fredriksen L., So B. (1990). An empirical study of the reliability of UNIX
   utilities. *Communications of the ACM*, 33(12), 32–44.
   [doi:10.1145/96267.96279](https://doi.org/10.1145/96267.96279).
   [Versione dell'Università del Wisconsin (PDF)](https://ftp1.cs.wisc.edu/par-distr-sys/papers/fuzz.pdf)
6. Tropaion (s.d.). *Tobii_Linux*, wiki del progetto [repository della comunità, non ufficiale:
   reimplementazione del protocollo USB del Tobii Eye Tracker 5 per Linux]; pagine Encoding, Gaze
   Stream, Streams, Head Pose, USB Transport, Handshake e Op Catalog. GitHub.
   [github.com/Tropaion/Tobii_Linux/wiki](https://github.com/Tropaion/Tobii_Linux/wiki)
