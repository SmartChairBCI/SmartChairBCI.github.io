---
ref: tobii-race-test-bench
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Tobii Race: un gioco di guida per mettere alla prova il 4C su GNU/Linux"
description: Il driver legge il Tobii 4C e il modello del viso trova la testa nelle immagini infrarosse. Per convalidare le prestazioni di tutta la catena uso un gioco, Tobii Race. Racconto com'è fatto, come parla con il driver, la prima gara completa con il 4C, che cosa può già misurare e che cosa no, e quali argomenti della letteratura approfondirò per la nuova tastiera di Kite.
tags: [eye-tracking, tobii, linux, gioco, latenza, websocket, caa]
---

Nella [voce dell'11 novembre](/diario/tobii-4c-su-linux-il-driver-alla-prova/) ho messo alla prova il
driver libero per il **Tobii Eye Tracker 4C**. Il driver legge correttamente i dati dal sensore. Con
una persona davanti, il modello del viso MediaPipe Face Landmarker trova la testa nelle immagini
infrarosse (IR) del 4C, come avevo sperato nella
[voce dell'8 novembre](/diario/tobii-4c-il-beccheggio-della-testa-dal-viso/).

Sono due condizioni necessarie, ma non bastano. Resta da capire come si comporta **tutta la catena**
quando qualcuno la usa davvero: quanto ritardo aggiunge, quanto trema il segnale, quanto spesso si
interrompe.

Per rispondere ho scelto uno strumento poco convenzionale: un **gioco**. Si chiama **Tobii Race**
(repository `tobii4c-race`). È un simulatore di Formula 1 in prima persona che si guida con la testa,
mentre lo sguardo decide dove mettere a fuoco. L'ho scritto il 4 novembre, con l'aiuto dell'AI come il
driver, e l'ho ritoccato fino al 7.

In questa voce racconto perché un gioco, com'è fatto, come parla con il driver, che uso fa dei dati
della testa e che cosa può misurare oggi. Lo dico subito: **non ci sono ancora misure sistematiche**.
Questa voce presenta lo strumento con cui le farò, insieme alla **prima gara completa** con il 4C, che
ho registrato il 13 novembre: la mostro in un video, con i numeri del log. Chiudo con gli argomenti della letteratura che
voglio approfondire per la nuova tastiera di [Kite](/ricerche/kite/), il mio strumento aperto di
Comunicazione Aumentativa e Alternativa (CAA).

## Perché un gioco

Le due sessioni da 30 minuti della voce dell'11 novembre erano **senza nessuno davanti** al
tracciatore. Hanno misurato il trasporto dei dati, non la loro qualità. Il caso d'uso vero, invece,
richiede una persona davanti che usa il segnale, per minuti.

Un gioco di guida rende visibili i difetti senza bisogno di aprire un log:

- **la latenza**, cioè il ritardo tra un movimento e la sua conseguenza sullo schermo, diventa una
  monoposto che sterza tardi e allarga la curva;
- **il rumore**, cioè le piccole oscillazioni casuali della misura, diventa un mirino che trema o uno
  sterzo che serpeggia sul rettilineo;
- **l'instabilità**, cioè le perdite del segnale, diventa una monoposto che si ferma perché il
  tracciatore ha perso gli occhi.

Il gioco, inoltre, chiede sempre la stessa cosa: la stessa pista, lo stesso giro. Il tempo sul giro e
il distacco dal giro migliore danno un numero da confrontare tra una sessione e l'altra.

Questa è una **mia ipotesi di metodo**, non un risultato. Vedere non è misurare: la percezione si
inganna, e chi gioca impara, quindi una sessione non è uguale alla precedente. Per questo il gioco
mostra anche la telemetria, e i numeri dovranno venire da dati registrati, non dall'impressione.

## Il gioco in breve

| Comando | Segnale | Come funziona |
| --- | --- | --- |
| Sterzo | testa girata (imbardata) oppure inclinata di lato (rollio) | rispetto alla posizione neutra, sull'escursione misurata in calibrazione |
| Acceleratore e freno | testa in avanti o indietro (beccheggio) oppure distanza dallo schermo | come sopra: avanti accelera, indietro frena |
| Messa a fuoco e mirino | sguardo | lo sguardo **non** comanda la monoposto |
| Arresto automatico | sguardo assente per più di 300 ms, nessuno davanti, nessun dato o connessione persa | gas tagliato, freno progressivo, sterzo che torna dritto |

I nomi degli angoli sono quelli della voce dell'8 novembre: il **beccheggio** è il "sì" della testa,
l'**imbardata** il "no", il **rollio** la testa che si inclina verso una spalla.

Il resto serve a rendere le prove ripetibili e leggibili:

- un **fantasma** (*ghost*) del giro più veloce della sessione, semitrasparente, che rifà quel giro e
  mostra in tempo reale il distacco nello stesso punto della pista;
- un pannello di **telemetria** (tasto T) con sensore, comandi, vettura e grafica, e un disegno della
  testa e degli occhi aggiornato in tempo reale;
- una modalità **mouse e tastiera**, per provare il gioco senza il sensore;
- una qualità grafica regolabile e adattiva, per i computer meno potenti.

Una scelta conta più delle altre: **lo sguardo non guida**. Nella
[voce sul dwell time](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/) ho raccontato il problema
del "tocco di Mida": se ogni occhiata diventa un comando, non si può più guardare senza comandare
([Jacob, 1991](#riferimenti)). Nel gioco gli occhi restano liberi di guardare la strada e i comandi
vengono dalla testa. La mia lettura è che questa scelta separi anche i due segnali: se la monoposto
sterza tardi, il problema è nella catena della testa; se la messa a fuoco insegue lo sguardo in
ritardo, è in quella dello sguardo.

### Come è cambiato in quattro giorni

Il registro dei commit racconta l'evoluzione:

1. **4 novembre, primo commit.** Il gioco leggeva il 4C in due modi: con il driver Linux sulla stessa
   macchina oppure da una macchina Windows, fisica o virtuale, con il Tobii Stream Engine, la libreria
   ufficiale di Tobii, attraverso un ponte in C.
2. **4 novembre, poche ore dopo.** Ho tolto la strada Windows: oggi il 4C si legge **solo** con il
   driver Linux. Il commit riporta le verifiche fatte: test, build del server e del gioco, il server
   con il simulatore e con il 4C occupato da un altro programma.
3. **4 novembre, sera.** Il giro fantasma, con il distacco in tempo reale.
4. **7 novembre.** Ritocchi all'identità grafica e alla sfocatura della profondità di campo.

## L'architettura

Il sistema ha tre pezzi, tutti sulla stessa macchina GNU/Linux:

```text
 Tobii 4C ──USB──► tobii4c run        driver, processo figlio di tobii-ws
                      │  UDP 127.0.0.1:<porta>   T4CG v2, 192 byte, un pacchetto per campione (~90 Hz)
                      │  stderr                  log JSON: identità, area dello schermo,
                      │                          calibrazione, stato USB
                      ▼
                   tobii-ws (Go)
                      ├─ internal/tobii4c   avvio del driver, decodifica, tenuta della posa,
                      │                     presenza ritardata, testa a 30 Hz
                      ├─ internal/stream    stato corrente ed eventi → messaggi JSON
                      └─ internal/hub       una coda per client: si scarta, non si accumula ritardo
                      │  WebSocket ws://127.0.0.1:8765/ws, JSON, protocollo v1
                      ▼
                   browser: Tobii Race (TypeScript, Three.js, WebGL2)
                      ├─ net/          connessione, riconnessione, ping/pong
                      ├─ input/        filtri One Euro, calibrazione della testa,
                      │                arresto automatico, movimenti oculari
                      ├─ sim/          fisica a passo fisso (120 Hz), giri, fantasma
                      └─ render/, ui/  profondità di campo dallo sguardo, HUD, telemetria
```

Qualche sigla, prima di andare avanti:

- **UDP** è un protocollo di rete semplice, in cui ogni pacchetto viaggia da solo. Ne ho parlato nella
  voce dell'11 novembre, insieme al formato **T4CG** che il driver usa per i suoi pacchetti.
- **WebSocket** è un protocollo standard che tiene aperta una connessione a due vie tra il browser e un
  server ([Fette e Melnikov, 2011](#riferimenti)). Serve perché il browser non può leggere
  direttamente i pacchetti UDP del driver.
- **JSON** è un formato di testo per dati strutturati, leggibile anche a occhio.
- **Three.js** è una libreria JavaScript per la grafica 3D nel browser; **WebGL2** è l'interfaccia con
  cui il browser usa la scheda video.
- **HUD** (*head-up display*) sono le informazioni disegnate sopra la scena: velocità, giri, mirino.

| Componente | Linguaggio | Che cosa fa |
| --- | --- | --- |
| `tobii4c run` | Go | il driver delle voci precedenti, usato così com'è |
| `tobii-ws` | Go, senza codice C | avvia il driver, ne legge i campioni e il log, li trasmette su WebSocket |
| `wsprobe` | Go | client di diagnostica da riga di comando |
| Tobii Race | TypeScript, Three.js | il gioco, servito come file statici |

### Dal sensore allo schermo, passo per passo

1. Il 4C manda i campioni di sguardo sull'USB, circa 90 al secondo.
2. Il driver li ricompone, li decodifica e scrive ognuno in un pacchetto T4CG su una porta UDP locale.
3. `tobii-ws` legge il pacchetto, calcola la latenza interna, conta i pacchetti persi, decide se
   pubblicare la posa della testa e la presenza, e prepara un evento di sguardo.
4. Lo stato corrente trasforma l'evento in un messaggio `frame` in JSON, con l'ultima posa nota della
   testa.
5. L'hub accoda il messaggio per ogni browser collegato; una goroutine per client lo scrive sul
   WebSocket.
6. Nel browser il client riceve il `frame` e lo passa ai filtri: lo sguardo va al mirino e alla messa a
   fuoco, la testa ai comandi.
7. A ogni fotogramma disegnato il gioco legge i comandi, fa avanzare la fisica a passi di 1/120 s,
   aggiorna il fantasma e disegna la scena.

## Come il gioco parla con il driver

`tobii-ws` non include il driver come libreria e non parla con l'USB. Usa il driver **così com'è**,
come un programma separato, attraverso due canali che il driver offre già a chiunque: l'uscita UDP e
il log.

### L'avvio

1. **Trova l'eseguibile** `tobii4c`: quello indicato con `-tobii4c-bin`, altrimenti nel `PATH`, in
   `~/.local/bin` o in `~/go/bin`. Se non c'è, `tobii-ws` si ferma con l'errore "driver non trovato".
2. **Apre una porta UDP** su `127.0.0.1`, scelta dal sistema operativo.
3. **Avvia il driver** come processo figlio. Con le impostazioni predefinite la riga di comando è:

   ```text
   tobii4c run -udp 127.0.0.1:<porta> -log-format json -stats 10s -headpose on \
               -headpose-images-always -calibration ~/.config/tobii4c/calibration.bin
   ```

   `-calibration` compare solo se il file esiste e non è vuoto; con `-tobii4c-headpose=false` diventa
   `-headpose off`; altri argomenti si aggiungono con `-tobii4c-args`.
4. **Legge il log** del driver, riga per riga, dall'uscita degli errori (*stderr*). Aspetta fino a
   10 s la riga che dice che il flusso dello sguardo, lo stream `0x500`, è attivo. Se prima arriva un
   errore, lo classifica: nessun 4C collegato, 4C occupato da un altro processo, permessi USB mancanti.

### Due canali

| Canale | Formato | Che cosa porta | Come lo usa `tobii-ws` |
| --- | --- | --- | --- |
| UDP locale | T4CG v2: 192 byte, little-endian, un pacchetto per campione | sguardo, testa, occhi, presenza | decodifica ogni pacchetto senza allocare memoria |
| stderr | log JSON del driver, una riga per evento | identità, area dello schermo, calibrazione applicata, stato USB | riconosce alcuni messaggi per nome |

Dal pacchetto T4CG `tobii-ws` legge solo i campi che gli servono:

| Posizione (byte) | Campo | Uso in `tobii-ws` |
| ---: | --- | --- |
| 0, 4 | sigla `T4CG`, versione | riconoscere il pacchetto (accetta anche la v1, da 120 byte) |
| 6 | flag di validità | sguardo (bit 0), occhi tracciati (bit 2 e 3), posizione della testa (bit 6), beccheggio, imbardata e rollio (bit 7, 8 e 9) |
| 8 | `seq`, numero di sequenza | contare i pacchetti persi tra il driver e `tobii-ws` |
| 16 | `host_ns`, istante di ricezione USB | latenza interna |
| 24 | `device_us`, orologio del 4C | tempi della tenuta della posa e della frequenza della testa |
| 32 | sguardo filtrato, normalizzato sull'area dello schermo | sguardo |
| 48 | posizione della testa, in mm dal centro dello schermo | posizione |
| 60 | rotazione della testa, in radianti | beccheggio, imbardata e rollio, convertiti in gradi |
| 120 | flag di validità v2 | quale occhio ha una posizione valida (bit 0 e 1) |
| 124 | presenza | presente, assente o sconosciuta |
| 136, 148 | posizione dei due occhi, in mm dal centro dello schermo | tenuta della posa quando il 4C perde un occhio |

Il resto non viene usato: lo sguardo non filtrato, le pupille, l'apertura delle palpebre e i bit che
dicono se un angolo della testa viene dal viso o dagli occhi. Quindi oggi `tobii-ws` **non sa** da
quale delle due fonti arriva un'imbardata.

Dal log, invece, legge questi messaggi:

| Messaggio del driver | Effetto in `tobii-ws` |
| --- | --- |
| `usb device opened` | indirizzo USB e numero di serie; la calibrazione torna "non applicata" |
| `device identity` | numero di serie, modello, generazione, firmware |
| `display area (device)`, `display area set` | area dello schermo, cioè i tre angoli dello schermo in mm |
| `calibration applied`, `calibration apply failed` | calibrazione personale attiva oppure no |
| `subscribed` con lo stream `0x500` | la prima volta: il 4C è pronto; le successive: riconnessione dopo uno stacco |
| `session ended, reconnecting`, `usb device disconnected` | stato `disconnected` per i browser |
| una riga `errore: …`, non JSON | la causa con cui il driver si è fermato |

### Che cosa fa `tobii-ws` a ogni campione

1. **Latenza interna.** Sottrae `host_ns` dall'ora attuale, tutte e due sull'orologio del sistema.
   Scarta i valori negativi o superiori a 1 s.
2. **Pacchetti persi.** Conta i buchi nel numero di sequenza.
3. **Tenuta della posa.** Quando si gira la testa, il 4C perde l'occhio più lontano e con lui la posa
   ricavata dai due occhi. `tobii-ws` tiene allora gli ultimi valori validi di posizione, imbardata e
   rollio finché il 4C vede almeno un occhio, per al massimo 2 s (`-tobii4c-hold`); la posizione
   tenuta segue l'occhio rimasto. Senza nessun occhio, per esempio durante un battito di palpebre, li
   tiene solo 250 ms. Questi frame hanno `held: true`.
4. **Testa a 30 Hz.** Il driver calcola la posa a ogni campione; `tobii-ws` ne pubblica al massimo una
   ogni 30 ms sull'orologio del 4C, oppure subito se cambia la validità di un angolo. Il filtro della
   testa nel gioco è tarato su 30 pose al secondo.
5. **Presenza ritardata.** Pubblica "assente" solo dopo 750 ms di assenza continua; "presente"
   subito. Nella voce dell'11 novembre, a scena vuota, la presenza era cambiata da sola 198 e 283 volte
   in 30 minuti, e avevo concluso che non basta come unico segnale. Qui viene filtrata e il gioco la
   usa insieme ad altri segnali.
6. **Sguardo.** Un evento a ogni campione.

### La calibrazione passa dal gioco

Il 4C si apre in esclusiva: un solo programma alla volta. Per calibrare, `tobii-ws`:

1. ferma il driver con un segnale di interruzione (`SIGINT`), così il driver chiude la sessione in
   ordine; dopo 3 s senza risposta lo termina;
2. avvia `tobii4c calibrate` oppure `tobii4c headpose-calibrate`, a schermo intero sul monitor del
   tracciatore (`-monitor`);
3. manda ai browser lo stato `setup` e i messaggi di avanzamento;
4. quando la finestra si chiude, riavvia il driver e il flusso riparte.

La richiesta può arrivare dal gioco, dalla riga di comando (`-setup`) o da sola all'avvio, se mancano
i file `calibration.bin` o `display.json`.

L'identificativo della calibrazione che il gioco mostra è il CRC32, una piccola impronta numerica, del
file `calibration.bin`. Viene pubblicato solo se in quella sessione USB il driver ha scritto
`calibration applied`; altrimenti vale 0, e il gioco avvisa che lo sguardo è meno preciso. Il driver
riapplica la calibrazione a ogni connessione: è la risposta al risultato negativo dell'11 novembre, il
4C che la dimentica quando si spegne.

Un ultimo dettaglio di sicurezza: se `tobii-ws` muore senza fermare il driver, il sistema operativo
manda al driver un segnale di terminazione (`SIGTERM`), così il 4C non resta occupato da un processo
orfano.

## Il protocollo dei messaggi

Ogni messaggio è un oggetto JSON. Il protocollo è alla versione 1.

| Messaggio | Direzione | Quando | Contenuto |
| --- | --- | --- | --- |
| `hello` | server → browser | alla connessione e a ogni riapertura del tracciatore | versione, sorgente (`tobii4c` o `sim`), dispositivo, schermo, calibrazione, stato |
| `frame` | server → browser | a ogni campione di sguardo; senza sguardo da 100 ms, uno ogni 100 ms con `stale: true` | sguardo, ultima posa della testa, presenza, `lat` |
| `status` | server → browser | a ogni cambio di stato | `starting`, `connected`, `disconnected`, `error`, `no-device`, `setup` |
| `calibration` | server → browser | quando cambia | identificativo della calibrazione, 0 se manca |
| `setup` | server → browser | durante la calibrazione | `started`, `step`, `done`, `error`, `refused` |
| `stats` | server → browser | ogni secondo | frequenza dello sguardo e della testa, percentuale di sguardo valido, campioni scartati, browser collegati |
| `pong`, `error` | server → browser | in risposta | il tempo del `ping`; il motivo di una richiesta non valida |
| `ping` | browser → server | ogni secondo | il tempo del browser, per misurare l'andata e ritorno |
| `setup` | browser → server | a richiesta | apre la calibrazione sul computer del sensore |
| `hello` | browser → server | a richiesta | chiede di nuovo il messaggio `hello` |

Un `frame`, con i valori d'esempio della documentazione del gioco, **non con una misura**:

```json
{"type":"frame","seq":812,"t":9031.2,
 "gaze":{"x":0.5123,"y":0.4410,"valid":true},
 "head":{"pitch":-4.21,"yaw":1.03,"roll":0.12,"x":12.0,"y":-35.2,"z":604.8,
         "rotValid":true,"pitchValid":true,"yawValid":true,"rollValid":true,
         "posValid":true,"seq":271},
 "presence":"present","lat":0.42}
```

Come si legge:

- lo **sguardo** è normalizzato sullo schermo configurato nel driver: (0, 0) in alto a sinistra, (1, 1)
  in basso a destra; può uscire da questo intervallo quando si guarda oltre il bordo;
- la **testa** ha gli angoli in gradi e la posizione in millimetri dal centro dello schermo, con X verso
  destra, Y verso l'alto e Z verso la persona;
- `pitchValid`, `yawValid` e `rollValid` dicono quali angoli usare, perché con il driver possono
  mancare uno per uno; `rotValid` vale solo se ci sono tutti e tre;
- `t` è il tempo in millisecondi sull'orologio del server; `lat` è la latenza interna, sempre in
  millisecondi; `seq` è il contatore dei messaggi del server, non quello del driver.

Oltre al WebSocket, `tobii-ws` risponde a `GET /status` con lo stato in JSON, e il programma `wsprobe`
stampa ogni secondo frame ricevuti, sguardo, testa, `lat` e tempo di andata e ritorno.

## L'hub: meglio perdere un frame che accumulare ritardo

Un browser lento, o una rete congestionata, non deve rallentare gli altri né far crescere il ritardo.
La regola, scritta nel codice dell'hub, è che un frame vecchio non serve: serve il prossimo.

- Ogni browser ha una **coda di 128 messaggi**, circa 1,4 s di frame. Se è piena, il messaggio per quel
  browser si scarta e si conta; chi pubblica non aspetta mai.
- Dopo **450 scarti consecutivi**, circa 5 s, il browser viene scollegato. Si ricollega da solo e
  riparte da `hello`.
- La stessa regola vale a monte, dentro `tobii-ws`: la parte che legge il driver passa gli eventi al
  resto del server su una coda di 512 posti, senza bloccare; se è piena, il campione si scarta e si
  conta.
- La compressione del WebSocket è spenta: un commento nel codice dice "latenza e CPU prima di tutto",
  dove la CPU è il processore.

Nel browser, il client si ricollega da solo con attese crescenti, da 0,5 s fino a 4 s, e conta i frame
che riceve davvero ogni secondo.

## La modalità simulata e i test

Con `-source sim` al posto del 4C c'è un **tracciatore simulato**, con lo stesso protocollo:

- sguardo a 90 Hz, con un rumore casuale di deviazione standard 0,004 in unità normalizzate, e testa a
  30 Hz;
- un "pilota simulato": lo sguardo scorre lentamente attorno al centro e la testa si inclina avanti e
  indietro, così la monoposto sterza, accelera e frena di continuo;
- perdite periodiche dello sguardo: con `make sim`, 1,5 s ogni 30 s, per provare l'arresto automatico;
- anche la calibrazione è simulata, con passi da 2 s.

I test automatici del server coprono il protocollo, l'hub, il simulatore e la sorgente `tobii4c`.
Per quest'ultima il programma di test fa la parte del driver: scrive un log JSON e manda pacchetti T4CG
su UDP, e così verifica l'avvio, l'identità, l'area dello schermo, la calibrazione, la riconnessione, i
pacchetti persi, la testa a 30 Hz, la presenza ritardata e gli errori, come il 4C assente o i permessi
mancanti. Il 13 novembre Bones li ha rieseguiti con `go test ./...`: passano tutti. Verificano la
**logica**, non le prestazioni.

## Il deploy

- **`tobii-ws` gira sulla macchina del tracciatore, non in un container.** Accanto c'è il driver, che
  deve aprire la porta USB e, per le calibrazioni, le finestre della sessione grafica. `make
  install-sensor` lo installa in `~/.local/bin` con un servizio utente di **systemd**, il gestore dei
  servizi di GNU/Linux. Il servizio riparte da solo dopo 3 s in caso di errore e si dichiara in
  conflitto con `tobii4c.service`, il servizio del solo driver, che terrebbe occupato il 4C.
- **Il gioco è fatto di file statici.** Vite, lo strumento di build, lo impacchetta senza dipendenze
  da Internet. Si serve con `make play` oppure con **Docker Compose**: la build usa Node 22 e
  l'immagine finale contiene solo **nginx**, un server web, con i file del gioco. A ogni avvio del
  container uno script scrive `config.js` con l'indirizzo di `tobii-ws` preso dalla variabile
  `TOBII_WS_URL`. Il container non usa la scheda video e non inoltra il flusso: il browser si collega
  direttamente a `tobii-ws`.
- **Da un altro computer** della rete serve `tobii-ws -addr 0.0.0.0:8765`, possibilmente con
  `-origins` per limitare le pagine che possono collegarsi. Dietro HTTPS il browser accetta solo
  `wss://`, la versione cifrata del WebSocket.

## Il viso e la testa nel gioco

### Dove sta MediaPipe

Il gioco **non** contiene MediaPipe e non vede le immagini. Tutto il lavoro sul viso avviene nel
driver, che, come ho raccontato l'11 novembre, include ora il metodo della voce dell'8 novembre: la
rete dei punti del viso di Face Landmarker ([Google AI Edge, s.d.](#riferimenti)), incorporata nel
binario, applicata alle immagini IR del 4C.

`tobii-ws` la accende per impostazione predefinita (`-headpose on`) e tiene attive le immagini anche
quando il 4C segna la persona assente (`-headpose-images-always`). Il motivo, scritto nel codice: il 4C
segna assente anche chi è davanti ma ha perso gli occhi per un attimo, e il beccheggio non deve
fermarsi con loro. Secondo il README del gioco, la stima dalle immagini costa circa due terzi di un
core del processore.

### Quale angolo comanda che cosa

| Asse nel gioco | Grandezza | Da dove viene nel driver | Nota |
| --- | --- | --- | --- |
| Pedali "inclinazione" (predefinito) | beccheggio | solo dal viso nelle immagini IR | senza viso o senza camera calibrata, i pedali restano fermi |
| Pedali "sporgersi" | distanza dallo schermo | dagli occhi | non richiede le immagini |
| Sterzo "rotazione" (predefinito) | imbardata | dal viso; dagli occhi se il viso manca | secondo il README del gioco, dagli occhi è sottostimata di circa 5 volte |
| Sterzo "inclinazione laterale" | rollio | dal viso o dagli occhi | alternativa che regge anche senza immagini |

La posizione della testa serve anche altrove: il riconoscimento dei movimenti oculari la usa per
trasformare uno spostamento sullo schermo in un angolo visivo, e il disegno della telemetria usa gli
angoli per orientare la testa e gli occhi.

### Dalla posa al comando

1. **Calibrazione della testa nel gioco**, in cinque passi: neutro, gas, freno, sterzo a sinistra,
   sterzo a destra. Per ogni passo ci sono 1,5 s (il primo) o 2,5 s di preparazione e 2 s di
   rilevamento, di cui il gioco prende la mediana. Servono almeno 10 pose valide, un'escursione minima
   di 3° (o 20 mm con l'asse "sporgersi") per i pedali e di 4° per lato per lo sterzo, in direzioni
   opposte.
2. **Neutro al semaforo.** A ogni partenza il gioco rimisura la posizione neutra durante il semaforo,
   ma solo se la testa è ferma: lo scarto tra il 10° e il 90° percentile dei campioni deve restare
   entro 3° (20 mm con l'asse "sporgersi"). Altrimenti tiene il neutro della calibrazione.
3. **Filtro.** Gli angoli passano da un filtro One Euro, tarato su 30 pose al secondo.
4. **Forma del comando.** Una zona morta, per impostazione predefinita l'8 % dell'escursione per lo
   sterzo e il 15 % per i pedali, poi una curva progressiva e un guadagno. La fisica limita la velocità
   con cui gira lo sterzo e riduce l'angolo delle ruote alle alte velocità.

Il gioco usa solo **variazioni rispetto al neutro**. Lo scostamento fisso del beccheggio di circa 4°
trovato l'11 novembre, quindi, qui non pesa.

Il README del gioco dà anche un limite pratico: oltre circa 25° di rotazione il 4C perde gli occhi, e
con loro lo sguardo, e scatta l'arresto automatico. Per questo consiglia di calibrare lo sterzo su
rotazioni moderate, tra 10° e 20°.

### Lo sguardo: filtro, mirino, movimenti oculari

Anche lo sguardo passa da un filtro **One Euro**, che avevo presentato nella voce dell'8 novembre
([Casiez et al., 2012](#riferimenti)): smussa molto quando lo sguardo è fermo e poco quando si muove in
fretta. Nel gioco ha due tarature diverse:

| Segnale | Frequenza di taglio minima | Coefficiente di velocità (β) | Particolarità |
| --- | --- | --- | --- |
| Sguardo | 2,5 Hz | 2,0 | si azzera se il punto salta di oltre il 6 % della finestra, cioè durante una saccade |
| Testa | 1,5 Hz | 0,05 | aggiornato a ogni nuova posa, a 30 Hz |

Il gioco riconosce anche i **movimenti oculari** con un classificatore a soglie di velocità angolare,
della famiglia descritta da Salvucci e Goldberg ([2000](#riferimenti)):

- **saccade**, cioè uno spostamento rapido dello sguardo, oltre 75 °/s (finisce sotto 45 °/s);
- **inseguimento lento**, oltre 7 °/s per almeno 100 ms;
- **fissazione**, tutto il resto;
- **ammiccamento**, sguardo assente tra 60 e 500 ms con la persona presente; oltre, è sguardo perso.

Lo uso solo per la telemetria. Le soglie sono fissate nel codice; non le ho ancora verificate su dati
registrati.

### La messa a fuoco segue lo sguardo

Nel gioco lo sguardo non comanda la monoposto: decide **dove l'immagine è nitida**. Il gioco simula la
messa a fuoco dell'occhio con una **profondità di campo** (in inglese *depth of field*, DOF): è nitido
il punto guardato, il resto è più o meno sfocato. Serve a rendere visibile la qualità dello sguardo. Se
il punto è giusto e arriva in tempo, la zona nitida sta dove guardo; se il segnale è in ritardo o
trema, la nitidezza arriva dopo o si sposta da sola.

Ecco come funziona, nel codice:

1. **Il reticolo.** Un piccolo mirino segue sullo schermo il punto guardato, già passato dal filtro One
   Euro. Sotto il mirino un'etichetta indica la distanza di messa a fuoco, per esempio "fuoco 65 m".
   Quando lo sguardo non è valido, il mirino diventa rosso e più trasparente.
2. **La distanza del punto guardato.** Il gioco traccia un raggio dalla telecamera virtuale attraverso
   il punto guardato e cerca il primo oggetto che incontra: l'asfalto, le barriere, l'abitacolo, il
   paesaggio, il fantasma quando si vede. Lo fa a ogni fotogramma con la qualità alta, circa 30 volte
   al secondo con quella leggera.
3. **L'accomodamento.** La messa a fuoco non salta subito alla nuova distanza: la raggiunge per gradi,
   come l'occhio che si riaccomoda. Il calcolo avviene in diottrie, cioè sull'inverso della distanza,
   con una costante di tempo predefinita di 80 ms.
4. **La sfocatura.** Per ogni pixel il gioco calcola due sfocature e applica la maggiore:
   - una **circolare**, attorno al punto guardato: nitido entro un raggio pari al 12 % dell'altezza
     dello schermo, poi sempre più sfocato verso i bordi, come la visione periferica;
   - una **di profondità**, più debole, che cresce con la differenza in diottrie tra la distanza del
     pixel e quella messa a fuoco, come in una lente. Guardando la strada lontana si sfoca l'abitacolo,
     guardando l'abitacolo si sfoca la strada.

La componente circolare è quella principale. Il commento nel codice spiega perché: su una pista piana
tutti i punti di una stessa riga dello schermo sono alla stessa distanza, quindi la sola profondità
renderebbe nitida una fascia orizzontale, non il punto guardato.

La profondità di campo ha tre livelli: spenta, leggera e alta. Quella leggera sfoca un'immagine ridotta
a un quarto della risoluzione, con un solo passaggio di sfocatura; quella alta lavora a metà
risoluzione, con due passaggi. Raggio della zona nitida, tempo di messa a fuoco e intensità si
regolano dal menu. Nella gara del 13 novembre avevano i valori predefiniti (12 %, 80 ms, ×1), con la profondità di
campo leggera.

## Che cosa misura oggi, e che cosa no

| Grandezza | Dove si vede | Che tratto della catena copre |
| --- | --- | --- |
| `lat` | in ogni frame; nella scheda del sensore e in telemetria come "interna" | dalla ricezione USB nel driver al momento in cui `tobii-ws` prepara il messaggio |
| Andata e ritorno | nella scheda del sensore e in telemetria come "rete" | WebSocket, dal browser a `tobii-ws` e ritorno, una volta al secondo |
| Frequenze, sguardo valido, scarti | messaggio `stats`, ogni secondo; nel log di `tobii-ws` ogni 10 s | il flusso nel server |
| Frame ricevuti al secondo | nel browser | quanti frame arrivano davvero al gioco |
| Fotogrammi al secondo (FPS) e tempo per fotogramma | in telemetria | il disegno |
| Tempo sul giro e distacco dal fantasma | nell'HUD | quanto bene si guida |

Che cosa manca:

- **La latenza da un capo all'altro.** `lat` si ferma prima che il messaggio venga codificato e
  spedito. Restano fuori il WebSocket, l'attesa del prossimo fotogramma del browser (il gioco legge i
  comandi una volta per fotogramma), il disegno e il monitor. Resta fuori anche il tempo che il 4C
  impiega prima di mandare il campione sull'USB.
- **Una registrazione.** La telemetria si vede sullo schermo ma non si salva su file. Nel browser si
  salvano solo le impostazioni, la calibrazione della testa, il fantasma della sessione e il record sul
  giro.

Nel repository ci sono alcune annotazioni, nel README del gioco, che riporto per completezza con un
avvertimento: **non dicono quante sessioni, quanto lunghe né come sono state misurate**. Le prendo
come indizi, non come misure.

| Annotazione del README (4 novembre, firmware 4.7.0) | Come la leggo |
| --- | --- |
| flusso a 90 Hz, testa a 30 Hz | 90 Hz è il valore nominale: l'11 novembre, senza persona, ho misurato 89,2 Hz |
| latenza interna di circa 0,1 ms "dalla ricezione USB all'invio WebSocket" | nel codice il valore si ferma prima della scrittura sul WebSocket |
| con una persona: imbardata dal viso tra −24° e +36°, valida nel 99 % delle pose; beccheggio ±20° | una persona, nessun riferimento indipendente |
| verificato con il simulatore e con un pilota automatico di prova: un giro completo in 1:20,6, con urti contro le barriere | verifica della logica di gioco, non del sensore |
| con il 4C reale verificati la calibrazione della testa e lo sterzo; **una gara completa è ancora da provare** | l'ho fatta il 13 novembre: la racconto qui sotto |

### La prima gara completa, in un video

Il 13 novembre ho guidato Tobii Race con il 4C, seduto davanti al tracciatore, e ho registrato lo
schermo. È la **prima gara completa con una persona**: tre giri e l'inizio del quarto, in circa
quattro minuti.

<video controls playsinline preload="metadata" poster="/assets/img/kite/tobii-race-prima-gara.jpg" aria-label="Video di circa 4 minuti di Tobii Race guidato con il Tobii 4C. All'inizio la schermata iniziale del gioco con la scheda del sensore collegato, sguardo a 90 Hz e testa a 30 Hz; il numero di serie del tracciatore è coperto. Poi la partenza al semaforo e tre giri di pista in prima persona dall'abitacolo di una monoposto verde: a sinistra il pannello di telemetria, in alto a destra il tempo sul giro e la mappa della pista, in basso a destra la webcam che riprende chi guida mentre gira e inclina la testa per sterzare, accelerare e frenare. Alla fine il gioco va in pausa.">
  <source src="/assets/img/kite/tobii-race-prima-gara.mp4" type="video/mp4">
  Il browser non riesce a riprodurre il video: lo puoi
  <a href="/assets/img/kite/tobii-race-prima-gara.mp4">scaricare qui</a> (MP4, 18,6 MB).
</video>

Che cosa si vede:

- **La scheda del sensore**, nei primi secondi: sensore collegato, sguardo a 90 Hz con il 100 % di
  campioni validi, testa a 30 Hz, calibrazione dello sguardo salvata dal driver, area dello schermo di
  700 × 390 mm. In quell'istante la latenza indicata è di 0,4 ms per l'andata e ritorno sul WebSocket e
  di 0,04 ms per `lat`.
- **I comandi predefiniti**: sterzo con la rotazione della testa (imbardata), gas e freno con
  l'inclinazione (beccheggio), con la calibrazione della testa fatta il 4 novembre.
- **La gara**: il semaforo, poi la pista. A sinistra la telemetria, in alto a destra i tempi e la mappa,
  in basso a destra la webcam che riprende me mentre guido con la testa. Il mirino con l'etichetta
  "fuoco" segue il mio sguardo, e attorno a lui l'immagine è nitida mentre i bordi restano sfocati.

I tempi sul giro, letti nell'HUD:

| Giro | Tempo | Distacco | Nota |
| --- | --- | --- | --- |
| 1 | 1:23,450 | — | primo giro: diventa il fantasma |
| 2 | 1:10,800 | −12,65 s sul fantasma | diventa il nuovo fantasma |
| 3 | 1:12,167 | +1,37 s sul fantasma | |

Il riquadro dei tempi mostra anche un record di 1:08,684. Non viene da questa gara, ma da sessioni
precedenti che non ho registrato: il browser lo conserva.

Nel frattempo `tobii-ws` scriveva nel suo log, ogni 10 s, le statistiche dell'ultimo secondo. Le 25
righe che cadono dentro il video dicono:

| Grandezza | Valori nelle 25 righe |
| --- | --- |
| Sguardo | tra 89,9 e 91,0 Hz, media 90,1 Hz |
| Sguardo valido | 100 % in tutte |
| Testa | tra 30 e 33 Hz, media 30,2 Hz |
| Scartati | 0 |

Il contatore degli scartati è cumulativo: somma i campioni mancanti nella sequenza UDP, quelli lasciati
cadere dalla sorgente perché il server era in ritardo e quelli scartati dall'hub. È rimasto a zero
per tutta la vita del processo, dalle 9:21 alle 9:34, quindi anche prima e dopo la gara.

Come leggo questa prova:

- **Risponde a una domanda sola**: la catena regge una gara vera, con una persona davanti, senza perdere
  dati? Per questi quattro minuti, sì.
- **Non è una misura sistematica.** È una sessione, una persona, un tracciatore. Le righe del log sono
  campioni di 1 s presi ogni 10 s: non escludono brevi perdite dello sguardo tra un campione e l'altro.
  Non ho contato gli arresti automatici, perché il gioco non li registra.
- **Non misura la latenza da un capo all'altro**, né il rumore: per quelli servono la registrazione e il
  metodo esterno descritti qui sotto.
- **Il secondo giro è più veloce del primo di 12,65 s.** Lo leggo soprattutto come apprendimento della
  pista, l'effetto di cui parlavo all'inizio: non dice niente, da solo, sulla qualità del segnale.

Per leggere il video con onestà:

- Ho tagliato i primi e gli ultimi secondi, in cui si vedevano il desktop e il programma di
  registrazione.
- Ho coperto il **numero di serie** del tracciatore nella scheda del sensore.
- Il video è ridotto a 1280 × 720 pixel per il sito: la telemetria a sinistra si legge solo in parte.
  L'audio è quello originale della registrazione.

### Che cosa misurerò

1. **Registrare ogni gara su file:** i frame ricevuti, `lat`, l'andata e ritorno, gli stati, gli
   arresti automatici con la loro causa e i tempi sul giro. È uno strumento ancora da scrivere.
2. **Gare con una persona davanti**, con il suo consenso informato, in più sessioni: distribuzioni di
   `lat` e dell'andata e ritorno, percentuale di sguardo valido, scarti, numero e cause degli arresti.
3. **La latenza da un capo all'altro**, con un metodo esterno. Saunders e Woods
   ([2014](#riferimenti)) accecano per un istante il tracciatore con dei LED infrarossi, il che provoca
   un cambiamento sullo schermo, e riprendono entrambi gli eventi con una videocamera a 1000 fotogrammi
   al secondo; il tempo tra i due è la latenza del sistema. Il mirino e la profondità di campo di Tobii
   Race dipendono dallo sguardo, quindi il gioco si presta. Devo ancora verificare che il metodo
   funzioni con il 4C.
4. **Tempi sul giro e distacco dal fantasma** tra sessioni, sapendo che misurano insieme il sistema e
   l'apprendimento di chi guida.

## Che cosa porto in Kite: gli argomenti da approfondire

Nella [voce sul dwell time](/diario/kite-scrivere-con-lo-sguardo-e-il-dwell-time/) ho descritto la
prima tastiera di Kite e i suoi limiti. Per la nuova versione sto studiando la letteratura. Qui mi
limito a elencare gli argomenti:

- **il tocco di Mida**: distinguere lo sguardo che guarda da quello che seleziona
  ([Jacob, 1991](#riferimenti));
- **il dwell adattivo**: un tempo di attesa che cambia con la persona e con la probabilità del tasto
  ([Mott et al., 2017](#riferimenti));
- **la scrittura senza dwell**: riconoscere la parola dal percorso dello sguardo
  ([Kurauchi et al., 2016](#riferimenti));
- **Dasher**: scrivere navigando tra lettere guidate da un modello linguistico
  ([Ward e MacKay, 2002](#riferimenti));
- **lo smooth pursuit**: scegliere seguendo con gli occhi un bersaglio in movimento
  ([Vidal et al., 2013](#riferimenti));
- **la predizione con i modelli linguistici**, anche di grandi dimensioni (LLM)
  ([Cai et al., 2024](#riferimenti));
- **il filtro One Euro**: già nel gioco, da tarare per la tastiera ([Casiez et al., 2012](#riferimenti));
- **sguardo e testa insieme**: la testa che conferma o corregge il punto guardato
  ([Špakov et al., 2014](#riferimenti)).

Li tratterò in dettaglio nella prossima voce del diario.

## Problemi aperti

- **Nessuna misura sistematica.** Le annotazioni del README non hanno numero di sessioni né durata. La
  prima gara completa, quella del 13 novembre, è una sessione sola, con una persona sola.
- **`lat` copre solo una parte della catena.** La latenza fino allo schermo non è misurata.
- **La telemetria non si salva.** Senza registrazione non posso confrontare le sessioni.
- **Lo sguardo nella finestra.** Il passaggio dalle coordinate dello schermo a quelle della finestra
  del browser è esatto solo a schermo intero; in finestra è approssimato.
- **L'imbardata dalle immagini.** L'11 novembre differiva da quella ricavata dagli occhi di 5–15°, e lo
  sterzo predefinito la usa. Inoltre `tobii-ws` oggi non sa se un angolo viene dal viso o dagli occhi.
- **L'area dello schermo dopo un'accensione a freddo.** L'11 novembre ho visto che il 4C la dimentica
  quando si spegne. Ho verificato il resto sul codice e sui log:
  - `tobii4c run` riscrive l'area sul dispositivo solo se riceve `-display-mm`. Non rilegge
    `display.json`: quel file lo scrive la configurazione dello schermo di `tobii4c calibrate`, e
    nessun comando lo rilegge.
  - Nella prova dell'11 novembre l'area era stata riscritta perché avevo avviato il driver con
    `-display-mm 700x390`, non perché il driver l'avesse presa dal file. Ho corretto quella voce.
  - `tobii-ws` passa al driver la calibrazione, ma non `-display-mm`. Dopo un'accensione a freddo il
    4C resterebbe quindi con l'area di fabbrica di 4 × 4 mm. `tobii-ws` la riconosce come non
    configurata, perché misura meno di 50 mm per lato, e lo segnala, ma non la ripristina. Lo sguardo
    sullo schermo, e con lui il mirino, sarebbe sbagliato. Anche la posizione della testa, che il
    driver esprime rispetto allo schermo, cambierebbe riferimento: non ho verificato quanto questo pesi
    sui comandi.
  - Nella gara del 13 novembre il problema non si è presentato: il computer era acceso dall'11
    novembre, e `tobii-ws` ha trovato configurata l'area di 700 × 390 mm scritta quel giorno.
- **Una persona, un tracciatore, un computer.** Come nelle voci precedenti.

## Prossimi passi

1. Aggiungere al gioco la registrazione su file di frame, stati e arresti automatici.
2. Ripetere la gara del 13 novembre in più sessioni e con altre persone, con il consenso informato,
   registrando la telemetria.
3. Misurare la latenza da un capo all'altro con un metodo esterno, sul modello di Saunders e Woods.
4. Far riapplicare l'area dello schermo a ogni avvio del driver: `tobii-ws` può passargli
   `-display-mm` con le misure salvate in `display.json`. Poi verificarlo dopo un'accensione a freddo.
5. Far sapere a `tobii-ws` se imbardata e rollio vengono dal viso o dagli occhi, e verificarli con lo
   sterzo.
6. Approfondire nella prossima voce gli argomenti della letteratura e scegliere quali prototipare per
   primi in Kite.

> **Avvertenza.** Tobii Race è uno strumento di prova, non un dispositivo medico certificato né un
> ausilio, e Kite è un progetto sperimentale. Il driver è un software non ufficiale che usa il
> tracciatore in modi non previsti dal produttore. Le immagini IR riprendono il viso e la schermata del
> sensore mostra il numero di serie del tracciatore: sono dati da proteggere prima di pubblicare
> qualunque registrazione. Girare la testa per guidare può affaticare il collo: le sessioni vanno
> tenute brevi. Se userò dei LED infrarossi per misurare la latenza, andranno puntati sul tracciatore e
> non negli occhi. Le prove con persone richiedono il consenso informato e, quando serve, il parere di
> un comitato etico. Chi dipende da uno strumento di CAA per comunicare dovrebbe avere sempre
> un'alternativa di riserva.

## Riferimenti

1. Cai S., Venugopalan S., Seaver K., Xiao X., Tomanek K., Jalasutram S., Morris M. R., Kane S.,
   Narayanan A., MacDonald R. L., Kornman E., Vance D., Casey B., Gleason S. M., Nelson P. Q.,
   Brenner M. P. (2024). Using large language models to accelerate communication for eye gaze typing
   users with ALS. *Nature Communications*, 15, 9449.
   [doi:10.1038/s41467-024-53873-3](https://doi.org/10.1038/s41467-024-53873-3) (open access su
   [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11530652/))
2. Casiez G., Roussel N., Vogel D. (2012). 1 € filter: a simple speed-based low-pass filter for noisy
   input in interactive systems. *Proceedings of the SIGCHI Conference on Human Factors in Computing
   Systems (CHI '12)*, 2527–2530.
   [doi:10.1145/2207676.2208639](https://doi.org/10.1145/2207676.2208639)
3. Fette I., Melnikov A. (2011). *The WebSocket Protocol*. RFC 6455, RFC Editor.
   [doi:10.17487/RFC6455](https://doi.org/10.17487/RFC6455)
4. Google AI Edge (s.d.). *MediaPipe Face Landmarker*. Documentazione tecnica ufficiale.
   [developers.google.com](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)
5. Jacob R. J. K. (1991). The use of eye movements in human-computer interaction techniques: what
   you look at is what you get. *ACM Transactions on Information Systems*, 9(2), 152–169.
   [doi:10.1145/123078.128728](https://doi.org/10.1145/123078.128728)
6. Kurauchi A., Feng W., Joshi A., Morimoto C., Betke M. (2016). EyeSwipe: dwell-free text entry using
   gaze paths. *Proceedings of the 2016 CHI Conference on Human Factors in Computing Systems
   (CHI '16)*, 1952–1956. [doi:10.1145/2858036.2858335](https://doi.org/10.1145/2858036.2858335).
   [Versione liberamente accessibile](https://www.cs.bu.edu/fac/betke/papers/Kurauchi-etal-CHI-2016.pdf)
7. Mott M. E., Williams S., Wobbrock J. O., Morris M. R. (2017). Improving dwell-based gaze typing
   with dynamic, cascading dwell times. *Proceedings of the 2017 CHI Conference on Human Factors in
   Computing Systems (CHI '17)*, 2558–2570.
   [doi:10.1145/3025453.3025517](https://doi.org/10.1145/3025453.3025517).
   [Versione liberamente accessibile](https://faculty.washington.edu/wobbrock/pubs/chi-17.02.pdf)
8. Salvucci D. D., Goldberg J. H. (2000). Identifying fixations and saccades in eye-tracking
   protocols. *Proceedings of the Symposium on Eye Tracking Research & Applications (ETRA '00)*,
   71–78. [doi:10.1145/355017.355028](https://doi.org/10.1145/355017.355028)
9. Saunders D. R., Woods R. L. (2014). Direct measurement of the system latency of gaze-contingent
   displays. *Behavior Research Methods*, 46(2), 439–447.
   [doi:10.3758/s13428-013-0375-5](https://doi.org/10.3758/s13428-013-0375-5) (manoscritto degli
   autori su [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4077667/))
10. Špakov O., Isokoski P., Majaranta P. (2014). Look and lean: accurate head-assisted eye pointing.
    *Proceedings of the Symposium on Eye Tracking Research and Applications (ETRA '14)*, 35–42.
    [doi:10.1145/2578153.2578157](https://doi.org/10.1145/2578153.2578157).
    [Versione liberamente accessibile](https://homepages.tuni.fi/oleg.spakov/publications/Spakov_ETRA_14a.pdf)
11. Vidal M., Bulling A., Gellersen H. (2013). Pursuits: spontaneous interaction with displays based on
    smooth pursuit eye movement and moving targets. *Proceedings of the 2013 ACM International Joint
    Conference on Pervasive and Ubiquitous Computing (UbiComp '13)*, 439–448.
    [doi:10.1145/2493432.2493477](https://doi.org/10.1145/2493432.2493477)
12. Ward D. J., MacKay D. J. C. (2002). Fast hands-free writing by gaze direction. *Nature*, 418(6900),
    838. [doi:10.1038/418838a](https://doi.org/10.1038/418838a) (preprint su
    [arXiv:cs/0204030](https://arxiv.org/abs/cs/0204030))
