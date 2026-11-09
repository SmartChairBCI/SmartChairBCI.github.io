---
ref: tobii-4c-linux-re-1
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Tobii 4C su GNU/Linux (1/3): leggere prima di toccare"
description: Prima di mandare un solo byte al tracciatore studio ciò che la comunità ha già scoperto sul Tobii Eye Tracker 5, leggo i descrittori USB del 4C e smonto, campo per campo, la struttura del protocollo TTP. È la base del futuro driver libero.
tags: [eye-tracking, tobii, linux, usb, reverse-engineering, protocollo]
---

Nella [voce del 7 novembre](/diario/tobii-4c-il-risveglio-dopo-10-anni-di-letargo/) ho presentato il
Tobii Eye Tracker 4C e ho dato un quadro generale del protocollo con cui parla al computer. Nella
[voce dell'8 novembre](/diario/tobii-4c-il-beccheggio-della-testa-dal-viso/) ho ricavato il
beccheggio della testa dal viso, per ora con una webcam. Per portare quel lavoro sulle immagini
infrarosse del 4C serve un driver libero per GNU/Linux, e quel driver ancora non c'è.

Con questa voce inizio una serie di tre sul **reverse engineering** del protocollo: ricostruire come
funziona un sistema osservandolo dall'esterno, senza la documentazione di chi l'ha progettato. È il
lavoro su cui poggerà il driver.

Questa prima parte ha una regola sola: **leggere prima di toccare**. Non mando ancora niente al
dispositivo. Studio le fonti, guardo come il 4C si presenta sul bus USB e smonto la struttura dei
messaggi, byte per byte. Non ci sono misure mie: ci sono fonti, descrittori, byte di catture altrui
e un elenco di domande da verificare.

## Perché leggere prima di toccare

Il motivo principale è prudenziale. Il 4C ha dieci anni e non è più il modello attuale di Tobii; se
lo rovino, trovarne un altro non è scontato. Un comando di cui non conosco l'effetto potrebbe cambiarne il
comportamento, compreso quello degli illuminatori infrarossi, o lasciarlo in uno stato che non so
ripristinare.

Il secondo motivo è pratico. Per il suo successore, il Tobii Eye Tracker 5 (ET5), la comunità ha già
fatto molto lavoro, e lo ha pubblicato. Leggere costa meno che riscoprire.

C'è però un limite da tenere sempre a mente: **quasi tutto ciò che si trova riguarda l'ET5, non il
4C**. Quello che leggo mi dà ipotesi sul 4C, non fatti.

## Il metodo: l'AI propone, io verifico

Lavoro come avevo annunciato nella voce del 7 novembre, con un assistente di programmazione basato
su intelligenza artificiale (AI). La divisione dei compiti è questa:

- **io** leggo le fonti e guardo i byte, decido che cosa provare e rivedo ogni conclusione;
- **l'assistente AI** mi aiuta a leggere il codice di altri progetti, scritto in linguaggi che uso
  poco (Rust, Zig, TypeScript), a riassumere la documentazione, a confrontare le fonti tra loro e a
  proporre ipotesi sul significato dei campi.

Ogni ipotesi diventa una **domanda da verificare sul dispositivo vero**. Per esempio: "il 4C
risponde al primo messaggio con la stessa versione di protocollo dell'ET5?". Finché la risposta non
arriva dal 4C, resta un'ipotesi.

Il progetto Tropaion/Tobii_Linux, di cui parlo sotto, etichetta ogni affermazione della sua
documentazione con un livello di confidenza: confermata su catture o sull'hardware, verificata solo
nel codice, oppure ipotesi ([Tropaion, s.d.](#riferimenti)). Adotto un'idea simile, con tre livelli:

| Livello | Che cosa vuol dire |
| --- | --- |
| **Confermato sul 4C** | l'ho visto io, sul mio dispositivo |
| **Documentato sull'ET5** | c'è in una fonte o in una cattura, ma riguarda l'ET5 |
| **Ipotesi** | è un'interpretazione, mia o dell'AI, non ancora verificata |

In questa voce quasi tutto è al secondo livello. La stessa documentazione di Tropaion ricorda il
rischio: una costante sbagliata e una correzione plausibile ma errata sono costate a quel progetto
ore di debug ([Tropaion, s.d.](#riferimenti)). È il rischio che avevo indicato anche per il codice
scritto con l'AI.

In questa fase mi limito a tre cose: documentazione pubblica, codice aperto di altri progetti e
osservazione del dispositivo.

## Le fonti trovate in rete

| Fonte | Che cos'è | Che cosa mi dà | Limiti |
| --- | --- | --- | --- |
| Tropaion/Tobii_Linux | reimplementazione in Rust del protocollo USB dell'ET5, licenza GPL-3.0, con una wiki tecnica | la descrizione più ordinata del trasporto USB, dell'intestazione dei messaggi, della codifica dei campi e della sequenza di avvio | solo ET5; il protocollo è ricavato dalle catture del progetto, che nel repository non vedo pubblicate |
| Krazubu/Open-tobii | driver per l'ET5 in Rust, licenza MIT, derivato da Skyggedans/tobii-linux | singoli messaggi reali catturati tra lo Stream Engine 4.1.0.3 per Windows e un ET5, con il numero di serie sostituito | solo ET5 |
| Aetherall/tobiifree | driver per l'ET5 in Zig e TypeScript, licenza GPL-3.0 | una terza implementazione indipendente, utile per confrontare | solo ET5, dichiarato sperimentale |
| Eitol/tobii_eye_tracker_linux_installer | script che installa il software Tobii per dispositivi IS4 (4C) su Ubuntu 18.10 | conferma che il 4C è un dispositivo IS4 e mostra com'è fatto il software ufficiale | binari proprietari; nulla sul protocollo |
| Tobii Developer Zone (PDK) | documentazione ufficiale del kit di sviluppo | il vocabolario: i nomi e il significato dei flussi di dati | nulla sul protocollo USB |
| Specifica USB 2.0, libusb | lo standard e la libreria per parlare con i dispositivi USB | la grammatica del trasporto | — |

### Tre progetti sull'ET5

**Tropaion/Tobii_Linux** è la fonte da cui parto. Si presenta come una reimplementazione "clean-room"
del protocollo USB dell'ET5 (identificativo `2104:0313`), cioè scritta senza usare codice del
produttore ([Tropaion, s.d.](#riferimenti)). La wiki ha pagine dedicate al trasporto USB,
all'intestazione dei messaggi, alla codifica dei valori, alla sequenza di avvio (*handshake*) e al
catalogo dei comandi. Descrive anche il metodo: il software Tobii per Windows gira in una macchina
virtuale con il tracciatore collegato, e il sistema ospite registra tutto il traffico USB con
**usbmon**, lo strumento del kernel Linux che traccia l'input e l'output sul bus USB
([Linux kernel documentation, s.d.](#riferimenti)).

**Krazubu/Open-tobii** è un driver per l'ET5, nato come copia (*fork*) del progetto
Skyggedans/tobii-linux e distribuito con licenza MIT ([Krazubu, s.d.](#riferimenti)). Per me la parte
più preziosa è una cartella di **messaggi reali**, uno per file: le risposte dell'ET5 ai comandi di
avvio, un frame di sguardo, i messaggi di presenza. Sono stati catturati tra lo Stream Engine 4.1.0.3
per Windows e un ET5, e il numero di serie è stato sostituito con degli zeri della stessa lunghezza.
Per un frame di sguardo il progetto riporta anche i valori che lo Stream Engine ha consegnato
all'applicazione: è una chiave di lettura preziosa, perché permette di controllare una decodifica
contro un risultato noto.

**Tutti i byte di esempio di questa voce vengono da queste catture dell'ET5**, non dal mio 4C.

**Aetherall/tobiifree** è una terza implementazione per l'ET5, con il protocollo scritto in Zig e un
kit di sviluppo in TypeScript che funziona anche nel browser ([Aetherall, s.d.](#riferimenti)). Il
suo README dice una cosa che conferma il punto di partenza: il produttore non fornisce documentazione
pubblica del protocollo, che è stato decodificato osservando i trasferimenti USB.

### Il software ufficiale e i suoi nomi

Il **repository di Eitol** non documenta il protocollo: installa il software proprietario di Tobii
per i dispositivi IS4, cioè il 4C, su Ubuntu 18.10 ([Eitol, s.d.](#riferimenti)). Tra i file ci sono
un servizio USB (`tobiiusbservice`) e la libreria **Stream Engine**. Mi dice come era organizzato il
software ufficiale: un servizio parla con il dispositivo, le applicazioni parlano con la libreria.

La **documentazione Tobii** descrive il Platform Development Kit (PDK), che comprende i driver, un
runtime e l'API Stream Engine ([Tobii Developer Zone, s.d.](#riferimenti)). Elenca i flussi di dati:
punto di sguardo, presenza dell'utente, origine dello sguardo, posizione della testa, diametro
pupillare. Precisa anche che il 4C e il 4L condividono le stesse API, e che alcuni flussi più
dettagliati richiedono una licenza separata. Non dice nulla di come i dati viaggiano sul cavo. Mi
serve come **vocabolario**: quando nei byte troverò "l'origine dello sguardo", saprò che cosa
significa per Tobii.

### La grammatica del trasporto

La **specifica USB 2.0** definisce descrittori, endpoint e tipi di trasferimento
([USB Implementers Forum, 2000](#riferimenti)). Per chi vuole una spiegazione più leggibile dei
pacchetti di controllo c'è *USB in a NutShell* ([Beyond Logic, s.d.](#riferimenti)). La documentazione
di **libusb** spiega come la libreria spezza i trasferimenti in pacchetti e come si comportano le
letture ([libusb, s.d.](#riferimenti)).

### Stesse cose, nomi diversi

Leggere più fonti insieme ha un vantaggio inatteso: si vede dove non sono d'accordo.

- La terza parola dell'intestazione si chiama *flag* in Tropaion e *status* in Krazubu; la quinta è
  *reserved* per Tropaion e *error* per Krazubu ([Tropaion, s.d.](#riferimenti);
  [Krazubu, s.d.](#riferimenti)).
- Lo stesso formato numerico è descritto come "Q42", cioè un intero diviso per 2^42, da Tropaion, e
  come un 32.32 espresso in 1/1024 di millimetro da Krazubu. Facendo i conti, è la stessa divisione:
  2^32 × 1024 = 2^42.
- Il comando 3170 è *get_enabled_eye*, cioè "quali occhi sono abilitati", per Tropaion, e *state* per
  Krazubu.

La lezione che ne traggo: **anche i nomi sono ipotesi**. Due progetti possono vedere gli stessi
byte e dar loro nomi diversi.

## Prima ricognizione: guardare senza parlare

Il primo passo sul 4C vero è il più innocuo. Quando si collega un dispositivo USB, il computer gli
chiede di presentarsi: il dispositivo risponde con i suoi **descrittori**, delle schede che dicono
chi è, quali interfacce ha e quali "porte" usa ([USB Implementers Forum, 2000](#riferimenti)). Il
comando `lsusb -v -d 2104:0127` li mostra. Sono richieste standard di lettura, previste dallo
standard per ogni dispositivo: non mandano al 4C nulla di specifico.

L'identificativo è `2104:0127`. Il codice del produttore, `2104`, nell'elenco pubblico degli
identificativi USB corrisponde a Tobii Technology AB; nella versione del 26 giugno 2026 di
quell'elenco, però, non compaiono né il prodotto `0127` né `0313`, quello dell'ET5
([Linux USB Project, 2026](#riferimenti)).

I descrittori del 4C mostrano tre interfacce:

| Interfaccia | Classe | Endpoint | Ruolo probabile |
| --- | --- | --- | --- |
| 0 | `0xff`, definita dal produttore (*vendor*) | `0x83` bulk IN, `0x04` bulk OUT, `0x05` bulk OUT | il canale dei messaggi |
| 1 | UVC, controllo video | nessuno | parte di una telecamera |
| 2 | UVC, flusso video | `0x82` bulk IN, 640 × 480 a 8 bit, formato del produttore | parte di una telecamera |

UVC (*USB Video Class*) è la classe standard delle telecamere USB, la stessa delle webcam.

### Come si legge un endpoint

Un endpoint è una "porta" del dispositivo, e il suo indirizzo è un solo byte. Il bit più alto dice la
direzione: 1 vuol dire verso il computer (IN), 0 verso il dispositivo (OUT). I bit bassi sono il
numero della porta ([USB Implementers Forum, 2000](#riferimenti)). Quindi:

- `0x83` = `1000 0011`: porta numero 3, **in ingresso** al computer;
- `0x05` = `0000 0101`: porta numero 5, **in uscita** verso il dispositivo.

*Bulk* è il tipo di trasferimento pensato per blocchi di dati senza scadenze rigide, come quello di
una chiavetta USB ([USB Implementers Forum, 2000](#riferimenti)).

### Che cosa mi dicono i descrittori

- **Il canale dei messaggi è l'interfaccia 0.** Per l'ET5 Tropaion documenta l'interfaccia 0 con
  `0x05` in uscita e `0x83` in ingresso ([Tropaion, s.d.](#riferimenti)). Sul 4C i descrittori
  mostrano gli stessi due indirizzi.
- **C'è un endpoint in più, `0x04` OUT.** Nelle fonti che ho letto il traffico passa solo da `0x05` e
  `0x83`. Non so a che cosa serva `0x04`, e non ci scriverò.
- **Dentro il 4C c'è anche una telecamera UVC**, con un formato del produttore. Potrebbe essere una
  seconda strada verso le immagini infrarosse, ma per ora non la tocco.

### La sessione: uno sportello per i comandi

La [voce del 7 novembre](/diario/tobii-4c-il-risveglio-dopo-10-anni-di-letargo/) anticipava che
l'apertura e la chiusura della sessione passano da **trasferimenti di controllo** definiti dal
produttore. Ora guardo come sono fatti.

Un trasferimento di controllo comincia con un pacchetto di *setup* di otto byte, con cinque campi
([USB Implementers Forum, 2000](#riferimenti); [libusb, s.d.](#riferimenti)). Secondo Tropaion,
la sessione dell'ET5 si apre così, subito dopo aver preso possesso dell'interfaccia 0 e prima di
qualsiasi trasferimento bulk, e si chiude con una richiesta gemella all'uscita
([Tropaion, s.d.](#riferimenti)):

| Campo | Valore | Significato |
| --- | --- | --- |
| `bmRequestType` | `0x41` | dal computer al dispositivo, richiesta del produttore, destinata a un'interfaccia |
| `bRequest` | `0x41` apre, `0x42` chiude | il "numero di sportello" scelto da Tobii |
| `wValue` | `0` | nessun parametro |
| `wIndex` | `0` | l'interfaccia 0 |
| `wLength` | `0` | nessun dato al seguito |

Il primo `0x41` si decifra con lo standard. In binario è `0100 0001`: il bit 7 a 0 vuol dire "dal
computer al dispositivo", i bit 6 e 5 valgono `10`, cioè "richiesta del produttore", e i bit da 4 a 0
valgono `00001`, cioè "destinata a un'interfaccia" ([Beyond Logic, s.d.](#riferimenti)). Il secondo
`0x41`, quello di apertura, è invece una scelta di Tobii. Che i due valori coincidano è, credo, una
coincidenza: all'inizio mi ha confuso.

## Com'è fatto un messaggio TTP

Sopra l'USB viaggia il protocollo a messaggi che le fonti chiamano **TTP**. Lo racconto con
un'immagine: un messaggio è una **lettera dentro una busta**.

- La **busta** (8 byte) è dell'USB: dice in che direzione va e quanto è lunga.
- L'**intestazione** (24 byte) è come la carta intestata di una lettera: tipo di messaggio, numero di
  protocollo, oggetto.
- Il **contenuto** è una serie di **pacchi etichettati**, i campi TLV.

### La busta: 8 byte, little-endian

Il primo byte è la direzione: `00` per i messaggi verso il dispositivo, `01` per quelli che arrivano
dal dispositivo. Seguono tre byte a zero e una lunghezza di 4 byte scritta in **little-endian**, con
il byte meno significativo per primo ([Tropaion, s.d.](#riferimenti)).

C'è un'asimmetria curiosa. In uscita la lunghezza conta solo i byte **dopo** la busta; in ingresso
conta il messaggio **intero**, busta compresa ([Tropaion, s.d.](#riferimenti)). Un driver che usa la
stessa regola nei due sensi sbaglia di 8 byte ogni volta.

### L'intestazione: 24 byte, big-endian

Dopo la busta ci sono sei parole da 4 byte, tutte in **big-endian**, con il byte più significativo
per primo ([Tropaion, s.d.](#riferimenti); [Krazubu, s.d.](#riferimenti)):

| Posizione nel messaggio | Campo | Significato |
| --- | --- | --- |
| byte 8–11 | marcatore | che tipo di messaggio è |
| byte 12–15 | numero di sequenza (`seq`) | il numero d'ordine della richiesta |
| byte 16–19 | stato | 1 nelle risposte catturate, 0 altrove |
| byte 20–23 | op | il comando, oppure il numero del flusso |
| byte 24–27 | errore | 0 se tutto va bene |
| byte 28–31 | lunghezza del contenuto | quanti byte seguono |

Il contenuto, quindi, comincia al byte 32. I marcatori noti sono quattro
([Krazubu, s.d.](#riferimenti)):

| Marcatore | Tipo di messaggio |
| --- | --- |
| `0x51` | richiesta, dal computer al dispositivo |
| `0x52` | risposta a una richiesta |
| `0x53` | campione di un flusso a cui il computer si è iscritto |
| `0x4e` | notifica asincrona |

Tropaion descrive i primi tre e chiama "notifica" il `0x53` ([Tropaion, s.d.](#riferimenti)): un
altro caso di nomi diversi.

Ecco un messaggio vero: la risposta dell'ET5 al primo comando, *hello*. È lungo 43 byte. Lo riporto
dalle catture di Krazubu, con il mio commento a destra:

```text
01 00 00 00  2b 00 00 00      busta: dal dispositivo (01); lunghezza 0x2b = 43 byte, little-endian
00 00 00 52                   marcatore 0x52: è una risposta
00 00 00 01                   seq 1: risponde alla richiesta numero 1
00 00 00 01                   stato: 1
00 00 03 e8                   op 0x3e8 = 1000: hello
00 00 00 00                   errore: 0
00 00 00 0b                   lunghezza del contenuto: 11 byte
00 00                         prefisso del contenuto
02  00 00 00 04  00 01 00 08  campo TLV: tipo 0x02, lunghezza 4, valore 0x00010008
```

Due lunghezze, scritte in due modi: quella nella busta è `2b 00 00 00`, in little-endian, mentre
quella del contenuto è `00 00 00 0b`, in big-endian. Mescolare le due convenzioni è
l'errore più facile da fare.

### Numeri di sequenza e op

Il **numero di sequenza** serve ad accoppiare domande e risposte. Secondo Tropaion parte da 1, cresce
a ogni richiesta e torna nella risposta; una risposta va accettata solo se coincidono sia l'op sia il
numero di sequenza, così da non confondere la risposta a un comando ripetuto con una vecchia
([Tropaion, s.d.](#riferimenti)). Nei messaggi di flusso, invece, il numero di sequenza non ha
significato e nelle catture vale 0. Il frame di sguardo dell'ET5 porta il suo contatore dentro il
contenuto: nella cattura è il frame 43780 ([Krazubu, s.d.](#riferimenti)).

La richiesta *hello* che ha provocato la risposta qui sopra, come la invia lo Stream Engine per
Windows, è lunga 79 byte: 8 di busta, 24 di intestazione e 47 di contenuto
([Tropaion, s.d.](#riferimenti)). L'inizio è questo:

```text
00 00 00 00  47 00 00 00      busta: verso il dispositivo (00); 0x47 = 71 byte DOPO la busta
00 00 00 51                   marcatore 0x51: richiesta
00 00 00 01                   seq 1
00 00 00 00                   0
00 00 03 e8                   op 1000: hello
00 00 00 00                   0
00 00 00 2f                   contenuto: 0x2f = 47 byte
00 00  17 00 00 00 28  00 00 00 09  00 01 00 00  00 01 00 01  …  00 01 00 08
```

Il contenuto è una lista (tipo `0x17`) di nove valori, da `0x00010000` a `0x00010008`. Il dispositivo
risponde con `0x00010008`, che Krazubu chiama versione del protocollo. **La mia ipotesi** è che il
computer elenchi le versioni che conosce, da 1.0 a 1.8, e che il dispositivo scelga la più alta.

L'**op** dice quale comando si sta chiedendo. Una cosa salta all'occhio: scritti in decimale, gli op
sono numeri tondi, raggruppati per argomento. Questi sono quelli che compaiono nelle fonti
([Tropaion, s.d.](#riferimenti); [Krazubu, s.d.](#riferimenti)). La colonna "effetto" è una
**deduzione dal nome**, non una verifica:

| Op | Decimale | Nome nelle fonti | Effetto presunto |
| --- | --- | --- | --- |
| `0x3e8` | 1000 | hello, versione del protocollo | apre il dialogo |
| `0x4b0` | 1200 | catalogo dei flussi | lettura |
| `0x4ba` | 1210 | colonne di un flusso | lettura |
| `0x4c4` | 1220 | iscrizione a un flusso (*subscribe*) | avvia un flusso |
| `0x4ce` | 1230 | cancellazione dell'iscrizione | ferma un flusso |
| `0x532` | 1330 | proprietà | lettura |
| `0x578` | 1400 | *track box*, il volume in cui vede gli occhi | lettura |
| `0x58c` | 1420 | stringhe di identità | lettura |
| `0x596` | 1430 | area dello schermo (*display area*) | lettura |
| `0x5a0` | 1440 | area dello schermo | **scrittura** |
| `0x5d2` | 1490 | stato | lettura |
| `0x640` | 1600 | tipo di *realm* | lettura |
| `0x672` | 1650 | frequenza di uscita | lettura |
| `0x76c`, `0x776` | 1900, 1910 | apertura del *realm* e risposta | autenticazione |
| `0x83e` | 2110 | montaggio (*mounting*) | lettura |
| `0xc58` | 3160 | occhi abilitati | **scrittura** |
| `0xc62` | 3170 | occhi abilitati, oppure "stato" | lettura |

Il **realm** è un meccanismo di autenticazione. Secondo Tropaion il computer chiede prima di che tipo
è; se vale 0 non serve autenticarsi, altrimenti segue uno scambio di domanda e risposta firmato con
HMAC-MD5. L'ET5 è stato osservato senza autenticazione ([Tropaion, s.d.](#riferimenti)).

Quando il dispositivo rifiuta un comando, lo dice nella parola di errore. Krazubu riporta quattro
codici: `0x20000501` (comando non supportato), `0x20000505` (non autorizzato), `0x20000508` (stato
sbagliato) e `0x20000509` (parametro non valido). Riporta anche che nelle catture per Windows la
parola di errore vale 0 in tutti i messaggi ([Krazubu, s.d.](#riferimenti)).

### Il contenuto: campi TLV

Il contenuto comincia sempre con due byte `00 00`, che si saltano. Poi ci sono i campi TLV
(*tipo–lunghezza–valore*): 1 byte di tipo, 4 byte di lunghezza in big-endian, poi il valore
([Tropaion, s.d.](#riferimenti); [Krazubu, s.d.](#riferimenti)). È come un pacco con l'etichetta:
chi non conosce il tipo può comunque saltare il pacco, perché sa quanto è lungo.

| Tipo | Valore |
| --- | --- |
| `0x01`, `0x02` | intero senza segno a 32 bit; `0x01` porta per esempio lo stato di presenza |
| `0x03` | numero a virgola fissa 16.16 con segno: intero a 32 bit diviso per 2^16 |
| `0x04` | numero a virgola fissa: intero a 64 bit con segno diviso per 2^42 |
| `0x05` | intestazione di una struttura (vedi sotto) |
| `0x06` | intero a 64 bit, usato per gli istanti di tempo in microsecondi |
| `0x14` | testo: un conteggio a 32 bit e poi i caratteri |
| `0x15` | blocco di byte: un conteggio a 32 bit e poi i byte |
| `0x17` | lista: un conteggio a 32 bit e poi gli elementi |
| `0x19` | lista di numeri a virgola fissa; Krazubu l'ha vista solo vuota |
| `0x1a` | intero a 32 bit "di coda"; significato non chiaro |

Tropaion documenta i tipi da `0x02` a `0x06`; gli altri vengono da Krazubu
([Tropaion, s.d.](#riferimenti); [Krazubu, s.d.](#riferimenti)).

Il tipo `0x05` è il più interessante. Il suo valore a 32 bit si divide in due metà: quella alta dice
**quanti elementi** seguono, quella bassa **che struttura** è. I codici di struttura noti, convertiti
in decimale, sono ancora numeri tondi:

| Codice | Decimale | Struttura |
| --- | --- | --- |
| `0x0100` | 256 | lista di record, come il catalogo dei flussi |
| `0x0bb8` | 3000 | riga di dati di un flusso |
| `0x0bb9` | 3001 | colonna: una chiave e un valore |
| `0x1f40` | 8000 | punto 2D: due numeri a virgola fissa |
| `0x1f41` | 8001 | punto 3D: tre numeri a virgola fissa |

Un campione di flusso, quindi, è una **riga** con un certo numero di **colonne**, ciascuna con una
**chiave** numerica e un valore. Il frame di sguardo dell'ET5 si apre con `0x00270bb8`: 0x27, cioè 39
colonne ([Tropaion, s.d.](#riferimenti)).

Ecco il messaggio più piccolo che conosco con questa struttura: un messaggio del flusso di presenza
dell'ET5, 101 byte, dalle catture di Krazubu:

```text
01 00 00 00  65 00 00 00                    busta: dal dispositivo; 0x65 = 101 byte
00 00 00 53                                 marcatore 0x53: campione di un flusso
00 00 00 00                                 seq 0: nei flussi non ha significato
00 00 00 00                                 stato 0
00 00 05 04                                 op = numero del flusso: 0x504, presence
00 00 00 00                                 errore 0
00 00 00 45                                 contenuto: 0x45 = 69 byte
00 00                                       prefisso
05 00 00 00 04  00 02 0b b8                 struttura 0x0bb8 (riga) con 2 colonne
05 00 00 00 04  00 02 0b b9                   colonna (0x0bb9) di 2 elementi
02 00 00 00 04  00 00 00 01                     chiave 1
06 00 00 00 08  00 00 00 18 91 b5 39 08         valore a 64 bit: 105 523 788 040 µs
05 00 00 00 04  00 02 0b b9                   colonna di 2 elementi
02 00 00 00 04  00 00 00 02                     chiave 2
01 00 00 00 04  00 00 00 02                     valore a 32 bit: 2
```

La chiave 1 è l'istante di tempo del dispositivo, in microsecondi ([Krazubu, s.d.](#riferimenti)):
105 523 788 040 µs sono circa 29 ore. Da quando conta l'orologio del dispositivo non lo so. La chiave
2 vale 2, e Krazubu descrive questo messaggio come quello di un utente presente: **la mia ipotesi** è
che 2 voglia dire "presente".

### La virgola fissa: un intero diviso per 2^42

Nella voce del 7 novembre avevo paragonato la virgola fissa ai millimetri interi al posto dei metri
con i decimali. Qui c'è il dettaglio. Un valore di tipo `0x04` è un intero a 64 bit con segno da
dividere per 2^42, cioè per 4 398 046 511 104 ([Tropaion, s.d.](#riferimenti)).

Due esempi dal frame di sguardo dell'ET5 nelle catture di Krazubu:

- nella colonna `0x1c`, che Krazubu identifica con il punto di sguardo sullo schermo, la coordinata
  orizzontale è `00 00 02 59 62 e8 00 00`. In decimale è 2 582 934 716 416; diviso per 2^42 dà
  **0,5873**, cioè poco oltre la metà della larghezza dello schermo;
- nella colonna `0x22`, che Krazubu identifica con l'origine dello sguardo di un occhio nel sistema
  dello schermo, una coordinata è `ff ff 18 65 c0 00 00 00`. Il primo bit a 1 indica un numero
  negativo, scritto in complemento a due: il valore è −254 649 684 721 664, che diviso per 2^42 dà
  **−57,9006 mm**.

Con lo stesso formato, quindi, il dispositivo scrive sia coordinate normalizzate, tra 0 e 1, sia
millimetri. Il passo minimo è 2^−42, circa 2,3 × 10^−13; il valore massimo è 2^21, circa
2,1 milioni. È una precisione enorme per un tracciatore oculare. **La mia ipotesi** è che sia una
scelta di comodità: un solo formato per tutte le grandezze.

I numeri di tipo `0x03` usano un'altra scala, 16.16: un intero a 32 bit diviso per 65 536. Krazubu li
indica per il diametro pupillare in millimetri ([Krazubu, s.d.](#riferimenti)).

### Messaggi spezzati e messaggi incollati

Per capire perché un messaggio possa arrivare a pezzi bisogna scendere di un livello. Sul cavo USB i
dati viaggiano in **pacchetti** di dimensione massima fissata dall'endpoint, tipicamente 512 byte
([libusb, s.d.](#riferimenti)). Un trasferimento bulk finisce quando arriva la quantità di dati
attesa oppure un pacchetto **più corto** del massimo, anche vuoto
([USB Implementers Forum, 2000](#riferimenti), sezione 5.8.3). È come un corriere che consegna con furgoni da 512
pacchi: un furgone mezzo vuoto vuol dire "la consegna è finita".

Di solito un trasferimento contiene esattamente un messaggio. Ma ci sono casi in cui non è così:

- **frammentazione**: se il messaggio è più grande dello spazio preparato dal computer per la
  lettura, arriva in più letture;
- **accorpamento**: se un messaggio è lungo un multiplo esatto di 512 byte, l'ultimo furgone è pieno e
  non segnala la fine; il messaggio successivo può allora finire nella stessa lettura;
- **risposte a puntate**: le risposte molto grandi arrivano con una prima parte che ha busta e
  intestazione completa, seguita da continuazioni che hanno solo la busta
  ([Tropaion, s.d.](#riferimenti); [Krazubu, s.d.](#riferimenti)).

Nelle catture dell'ET5 c'è un esempio del terzo caso: una risposta di 43 byte la cui intestazione
dichiara 659 067 byte di contenuto ([Krazubu, s.d.](#riferimenti)). Ne trasporta 11; gli altri
arrivano dopo, a pezzi.

Il programma che legge deve quindi fare il lavoro di un ufficio postale paziente: accumulare i byte,
leggere la lunghezza dichiarata, tagliare i messaggi interi, rimettere insieme le puntate. Se a un
certo punto i byte non hanno senso, deve ritrovare l'inizio di un messaggio. Gli indizi ci sono: una
busta in ingresso comincia con `01 00 00 00`, dichiara almeno 32 byte e subito dopo ha un marcatore
noto.

## Che cosa vale per il 4C e che cosa resta da verificare

Il 4C appartiene alla generazione IS4, l'ET5 alla successiva, IS5. Le stringhe di identità dell'ET5
nelle catture dicono proprio `IS5` e `IS5_Large_Eyetracker_5` ([Krazubu, s.d.](#riferimenti)). Che il
4C parli lo stesso protocollo è plausibile: i tratti generali raccontati nella voce del 7 novembre
(busta, campi TLV, big-endian, virgola fissa) sono gli stessi che le fonti descrivono per l'ET5. Ma
"plausibile" non basta: va verificato campo per campo.

| Aspetto | ET5, secondo le fonti | 4C, che cosa so | Da verificare |
| --- | --- | --- | --- |
| Identificativo USB | `2104:0313` | `2104:0127`, dai descrittori | — |
| Canale dei messaggi | interfaccia 0, `0x05` OUT e `0x83` IN | stessi indirizzi nei descrittori, più `0x04` OUT | a che cosa serve `0x04` |
| Sessione | controllo vendor `0x41` / `0x42` | come anticipato il 7 novembre | se il 4C si riavvia alla chiusura |
| Busta, intestazione, TLV | descritti in dettaglio | quadro generale, come nella voce del 7 novembre | ogni campo, a partire dalla risposta a hello |
| Versione del protocollo | `0x00010008` | — | la risposta del 4C a hello |
| Identità | `IS5`, `IS5_Large_Eyetracker_5` | IS4 secondo le fonti | le stringhe del 4C |
| Catalogo dei flussi | 9 flussi: gaze, image, presence, image_collection, primary_camera_image, algodbg, is5_sync_stream, log, custom | — | quali flussi ha il 4C |
| Frame di sguardo | 39 colonne | — | se il 4C usa le stesse chiavi |
| Realm | nessuna autenticazione | — | il tipo di realm del 4C |
| Area dello schermo | azzerata a ogni riavvio | — | se il 4C la conserva |
| Immagini infrarosse | circa 78 KB per immagine (Tropaion) | telecamera UVC 640 × 480 a 8 bit | formato e dimensione delle immagini del 4C |

Due righe meritano un commento.

**Il catalogo dell'ET5 non ha un flusso di posa della testa.** Nella voce del 7 novembre avevo
scritto che il 4C non manda una vera posa della testa e che, secondo me, su Windows la calcola il
software del PC. Il kit ufficiale elenca la posizione della testa tra i flussi della famiglia del
4C ([Tobii Developer Zone, s.d.](#riferimenti)); eppure, nel catalogo USB dell'ET5 catturato da
Krazubu, un flusso con quel nome non c'è. Resta **un'ipotesi**, ma ora è un'ipotesi con un indizio in
più.

**Le immagini potrebbero essere molto più grandi.** Tropaion parla di immagini dell'ET5 di circa
78 KB ([Tropaion, s.d.](#riferimenti)), e Krazubu di un'immagine infrarossa del viso di 280 × 280
pixel ([Krazubu, s.d.](#riferimenti)): a 8 bit per pixel fanno 78 400 byte, quindi i due dati sono
coerenti. Se il
4C mandasse l'intera immagine della sua telecamera, 640 × 480 a 8 bit, sarebbero circa 307 KB a
messaggio, quattro volte tanto. È un calcolo, non un'osservazione: ma dice che il programma di
lettura dovrà reggere messaggi molto grandi.

### Le ipotesi che porto alla prossima voce

1. **H1.** Il 4C usa la stessa busta, la stessa intestazione e gli stessi tipi TLV dell'ET5.
2. **H2.** Il 4C risponde a hello con una versione del protocollo, forse la stessa dell'ET5.
3. **H3.** Gli op di lettura dell'ET5 (identità, catalogo, colonne, area dello schermo) esistono anche
   sul 4C, con lo stesso numero.
4. **H4.** Il catalogo del 4C non contiene un flusso di posa della testa, ma contiene un flusso di
   immagini.
5. **H5.** Il frame di sguardo del 4C usa le stesse chiavi di colonna dell'ET5, almeno per punto di
   sguardo, origine dello sguardo e pupille.
6. **H6.** I valori `0x04` del 4C seguono la stessa scala 2^42.

## Le regole prima di inviare qualsiasi cosa

Leggere i descrittori non comporta rischi particolari. Mandare comandi sì. Prima di farlo mi sono
dato queste regole:

1. **Solo comandi già visti.** All'inizio mando soltanto messaggi che compaiono nelle catture delle
   fonti, byte per byte, e solo quelli che dal nome leggono: hello, identità, catalogo, colonne,
   lettura dell'area dello schermo.
2. **Nessuna scrittura persistente.** Niente scrittura dell'area dello schermo (op 1440), degli occhi
   abilitati (op 3160) o di altre impostazioni, finché non so leggere e salvare il valore attuale per
   poterlo ripristinare.
3. **Mai sull'endpoint `0x04`.** Non so a che cosa serva.
4. **Una domanda alla volta.** Ogni prova ha una domanda scritta prima, una cattura del traffico con
   usbmon e una nota su che cosa ho fatto.
5. **Attenzione agli illuminatori infrarossi.** Non so quali comandi li controllino. Durante le prove
   non guardo il sensore da vicino a lungo e resto alla distanza di funzionamento della scheda tecnica
   (50–95 cm, vedi la [voce del 7 novembre](/diario/tobii-4c-il-risveglio-dopo-10-anni-di-letargo/)).
6. **Un interruttore d'emergenza semplice.** Se il dispositivo si comporta in modo inatteso, lo
   scollego: il cavo USB è anche la sua alimentazione.
7. **Solo io davanti al sensore.** In questa fase nessun'altra persona fa da soggetto e non registro
   dati di altri.

Quando nella prossima voce comincerò a variare i campi, partirò dai comandi di lettura e applicherò
le stesse regole.

## Cosa ho imparato

- Il protocollo ha una struttura regolare: busta, intestazione fissa, campi autodescritti. È una
  buona notizia, perché un campo sconosciuto si può saltare senza perdere il resto.
- L'unica eccezione al big-endian è la lunghezza nella busta USB, ed è anche il punto in cui è più
  facile sbagliare.
- Le fonti sull'ET5 sono ricche, ma non sempre d'accordo sui nomi. I byte contano più dei nomi.
- Avere catture con il risultato atteso accanto è prezioso: permetterà di controllare una decodifica
  prima ancora di collegare il 4C.

## Problemi aperti

- **Tutte le fonti riguardano l'ET5.** Nessuna delle informazioni dettagliate di questa voce è ancora
  confermata sul 4C.
- **Nomi discordanti.** La terza e la quinta parola dell'intestazione e il comando 3170 hanno nomi
  diversi nelle fonti. Andranno chiariti osservando il comportamento.
- **Tipi poco chiari.** I tipi TLV `0x19` e `0x1a` hanno un significato incerto anche per l'ET5.
- **L'endpoint `0x04` e l'interfaccia video** del 4C restano senza spiegazione.
- **Il quadro legale.** Il kit ufficiale di Tobii lega l'uso di alcuni flussi a licenze separate.
  Non sono un giurista: prima di pubblicare un driver dovrò capire meglio che cosa comporta
  un'implementazione indipendente del protocollo, anche rispetto alle licenze dei progetti che ho
  letto.

## Prossimi passi

1. Preparare la registrazione del traffico USB con usbmon, per avere ogni prova documentata.
2. Aprire la sessione sul 4C e inviare hello: è la prima verifica di H1 e H2.
3. Leggere identità, catalogo dei flussi e colonne dello sguardo, e confrontarli con quelli
   dell'ET5 (H3, H4, H5).
4. Decodificare un primo frame di sguardo del 4C e controllare la scala dei valori (H6).
5. Annotare ogni campo con il suo livello: confermato sul 4C, documentato sull'ET5, ipotesi.

Nella prossima voce racconterò le catture del traffico e le prove sui campi, il cosiddetto
*fuzzing*: dare un nome ai byte, uno alla volta, compresi i vicoli ciechi.

> **Avvertenza.** Kite è un progetto sperimentale e **non è un dispositivo medico certificato**. Il
> lavoro descritto qui usa il tracciatore in modi non previsti dal produttore: inviare comandi di cui
> non si conosce l'effetto potrebbe cambiarne il comportamento, compresi gli illuminatori infrarossi,
> o lasciarlo in uno stato difficile da ripristinare. Chi vuole riprodurlo lo fa a proprio rischio.
> Chi dipende da uno strumento di CAA per comunicare dovrebbe avere sempre un'alternativa di riserva.
> Le prove con persone richiedono il consenso informato e, quando serve, il parere di un comitato
> etico.

## Riferimenti

1. Aetherall (s.d.). *tobiifree: Tobii Eye Tracker 5 For Linux and Web* [repository della comunità,
   non ufficiale; licenza GPL-3.0]. GitHub.
   [github.com/Aetherall/tobiifree](https://github.com/Aetherall/tobiifree)
2. Beyond Logic (s.d.). *USB in a NutShell*, capitolo 6: USB Requests. Guida divulgativa allo
   standard USB. [beyondlogic.org](https://www.beyondlogic.org/usbnutshell/usb6.shtml)
3. Eitol (s.d.). *tobii_eye_tracker_linux_installer: Installation and testing of tobii eye tracker in
   Ubuntu 18.10* [repository della comunità, non ufficiale]. GitHub.
   [github.com/Eitol/tobii_eye_tracker_linux_installer](https://github.com/Eitol/tobii_eye_tracker_linux_installer)
4. Krazubu (s.d.). *Open-tobii* (in origine *tobii-linux*, fork di Skyggedans/tobii-linux)
   [repository della comunità, non ufficiale: driver per il Tobii Eye Tracker 5; licenza MIT,
   copyright 2026 Andrii Klaptsov]. GitHub. Catture in `crates/tobii-proto/fixtures/`, descrizione
   dei campi in `crates/tobii-proto/src/`.
   [github.com/Krazubu/Open-tobii](https://github.com/Krazubu/Open-tobii)
5. libusb (s.d.). *libusb-1.0 API Reference*: pagine "Packets and overflows" e "Synchronous device
   I/O". Documentazione tecnica ufficiale.
   [libusb.sourceforge.io](https://libusb.sourceforge.io/api-1.0/libusb_packetoverflow.html)
6. Linux kernel documentation (s.d.). *usbmon*. Documentazione tecnica ufficiale.
   [docs.kernel.org/usb/usbmon.html](https://docs.kernel.org/usb/usbmon.html)
7. Linux USB Project (2026). *List of USB ID's* (`usb.ids`), versione 2026.06.26, voce del
   produttore `2104`. [linux-usb.org/usb.ids](http://www.linux-usb.org/usb.ids)
8. Tobii Developer Zone (s.d.). *How to get started with developing software for the Eye Tracker with
   the PDK*. Documentazione tecnica ufficiale.
   [developer.tobii.com](https://developer.tobii.com/how-to-get-started-with-developing-software-for-the-eye-tracker-with-the-pdk/)
9. Tropaion (s.d.). *Tobii_Linux* [repository della comunità, non ufficiale: reimplementazione del
   protocollo USB del Tobii Eye Tracker 5 per Linux; licenza GPL-3.0] e relativa wiki, pagine
   "USB Transport", "TTP Framing", "Encoding", "Handshake", "Op Catalog" e "Reverse Engineering
   Methodology". GitHub.
   [github.com/Tropaion/Tobii_Linux](https://github.com/Tropaion/Tobii_Linux);
   [wiki](https://github.com/Tropaion/Tobii_Linux/wiki)
10. USB Implementers Forum (2000). *Universal Serial Bus Specification, Revision 2.0*. Standard; in
    particolare il capitolo 9 (descrittori e richieste) e la sezione 5.8.3 (dimensione dei pacchetti
    bulk). [usb.org](https://www.usb.org/document-library/usb-20-specification)
