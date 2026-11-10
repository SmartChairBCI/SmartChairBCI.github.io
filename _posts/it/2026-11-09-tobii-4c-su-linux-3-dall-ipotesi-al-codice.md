---
ref: tobii-4c-linux-re-3
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Tobii 4C su GNU/Linux (3/3): dall'ipotesi al codice"
description: Come trasformo gli obiettivi del driver libero per il Tobii 4C in un progetto, e come ho iniziato a scriverlo con l'aiuto dell'AI. Una catena di montaggio di goroutine, la memoria preparata all'avvio, un supervisore e test che rigiocano catture USB reali. Il driver è in scrittura, non ancora provato sul dispositivo.
tags: [eye-tracking, tobii, linux, driver, go, architettura]
---

Questa è la terza e ultima parte della serie sul protocollo del **Tobii Eye Tracker 4C**. Nella
[prima parte](/diario/tobii-4c-su-linux-1-leggere-prima-di-toccare/) ho raccontato che cosa ho letto
prima di toccare il dispositivo e com'è fatto il protocollo a messaggi che indico con la sigla TTP.
Nella [seconda parte](/diario/tobii-4c-su-linux-2-dare-un-nome-ai-byte/) ho dato un nome ai byte: i
flussi di sguardo, di presenza e di immagini, le colonne dei campioni, i vicoli ciechi.

Qui passo dall'ipotesi al codice. Nella
[voce di apertura](/diario/tobii-4c-il-risveglio-dopo-10-anni-di-letargo/) mi ero dato cinque
obiettivi tecnici: nessun componente proprietario, una pipeline concorrente, zero allocazioni durante
lo streaming, bassa latenza, un'uscita aperta. In questa voce racconto come li sto trasformando in un
progetto e come ho iniziato a scrivere il codice, con l'aiuto di un assistente AI.

Una premessa onesta: **il driver è in progettazione e in prima scrittura**. Non l'ho ancora provato
sul 4C. Non ci sono misure di latenza né di prestazioni: ci sono le scelte, le loro ragioni, i primi
pezzi di codice e il modo in cui intendo verificarli.

## Le scelte di base

### Tutto in user-space, nessun modulo del kernel

Un sistema operativo ha due "zone". Il **kernel** è il cuore, che governa la memoria e i dispositivi.
Lo **user-space** è la zona dove girano i programmi normali. Un driver si può scrivere come **modulo
del kernel**, cioè come un pezzo di codice aggiunto al cuore del sistema, oppure come un programma
normale.

Ho scelto la seconda strada, per tre ragioni:

1. **Un errore resta confinato.** Se il driver si blocca o va in crash, si chiude un programma, non
   si ferma il computer.
2. **Niente da ricompilare a ogni aggiornamento.** Un modulo del kernel va mantenuto al passo con le
   versioni del kernel; un programma in user-space no.
3. **È più facile da distribuire e da studiare.** Chi vuole provarlo non deve caricare codice nel
   cuore del proprio sistema.

Questo è possibile grazie a **libusb**, una libreria in C che dà accesso generico ai dispositivi USB
da un normale programma ([libusb, s.d.](#riferimenti)).

### Go, con gousb sopra libusb

Scrivo il driver in **Go**. Le ragioni sono legate agli obiettivi:

- **La concorrenza è nel linguaggio.** Go ha due strumenti nativi, le *goroutine* e i *canali*, che
  descrivo più avanti. Sono proprio ciò che serve per una catena di montaggio.
- **Gli strumenti di verifica sono inclusi.** Il pacchetto `testing` della libreria standard sa
  eseguire test, misurare le prestazioni e contare le allocazioni di memoria
  ([The Go Authors, s.d.-e](#riferimenti)). Il **race detector** cerca gli accessi concorrenti sbagliati
  alla memoria ([The Go Authors, s.d.-a](#riferimenti)).
- **La memoria è gestita in modo sicuro.** C'è però un prezzo: un *garbage collector*, cioè un
  meccanismo che recupera da solo la memoria non più usata. Il suo lavoro cresce con la quantità di
  memoria che il programma chiede, e può introdurre piccole pause e ritardi
  ([The Go Authors, s.d.-c](#riferimenti)). È il motivo dell'obiettivo "zero allocazioni", di cui
  parlo più sotto.

Per parlare con libusb uso **gousb**, una libreria di Google che la rende utilizzabile da Go, con
licenza Apache 2.0 ([Google, 2024](#riferimenti)). Due sue funzioni contano molto qui. La prima tiene
**più trasferimenti di lettura sempre in coda**: mentre il programma elabora un blocco di dati, il
dispositivo trova già altri spazi pronti dove scrivere. La seconda **sgancia automaticamente** un
eventuale driver del kernel legato all'interfaccia USB, e lo ricollega quando il programma la rilascia
([Google, 2024](#riferimenti)).

### Una regola udev per non usare root

C'è un ultimo ostacolo pratico. Su GNU/Linux ogni dispositivo USB è rappresentato da un file, in una
cartella come `/dev/bus/usb/001/007`. Chi può aprire quel file in scrittura può parlare con il
dispositivo. Di norma, senza indicazioni particolari, è l'amministratore (*root*). Far girare il
driver da amministratore, però, vorrebbe dire dargli il potere di fare qualsiasi cosa sul sistema.

La soluzione è **udev**, il componente che gestisce gli eventi dei dispositivi e i permessi dei loro
file ([systemd, s.d.-b](#riferimenti)). Funziona come un portiere con un elenco di istruzioni: quando
si collega un dispositivo, scorre le **regole** e applica quelle che corrispondono. La regola che sto
preparando per il 4C è una riga sola:

```
SUBSYSTEM=="usb", ENV{DEVTYPE}=="usb_device", ATTR{idVendor}=="2104", ATTR{idProduct}=="0127", TAG+="uaccess"
```

Si legge così: "se arriva un dispositivo USB con codice del produttore `2104` (Tobii) e codice del
prodotto `0127` (il 4C), aggiungigli l'etichetta `uaccess`". L'etichetta `uaccess` lega l'accesso
al dispositivo alla **sessione locale attiva**: chi è seduto davanti al computer, con il suo desktop
aperto, riceve il permesso; quando la sessione non è più attiva, il permesso viene aggiornato
([systemd, s.d.-c](#riferimenti)).

Due dettagli. Il file della regola si chiama `70-tobii-4c.rules`, e il numero non è casuale: udev
legge i file in ordine alfabetico ([systemd, s.d.-b](#riferimenti)), e l'etichetta `uaccess` viene
trasformata in permesso da un file di systemd che si chiama `73-seat-late.rules`
([systemd, s.d.-a](#riferimenti)). La mia regola deve quindi venire prima. Inoltre, una connessione
remota via SSH da sola non è una sessione locale attiva: per un computer senza schermo servirà una
variante basata su un gruppo di utenti, che nel file lascio commentata.

## L'architettura: una catena di montaggio

### Goroutine e canali, in parole semplici

Una **goroutine** è una funzione che lavora in parallelo alle altre, dentro lo stesso programma. È
leggera: costa poco più della memoria per il suo stack, e Go la distribuisce sui thread del sistema
operativo, così che se una si ferma ad aspettare un dispositivo le altre continuano
([The Go Authors, s.d.-b](#riferimenti)). Si può pensare a un operaio con un compito preciso.

Un **canale** è il nastro trasportatore tra due operai: uno ci appoggia un oggetto, l'altro lo prende.
Un canale può avere una **capienza**: se il nastro è pieno, chi appoggia deve aspettare, oppure può
decidere di fare altro. Il motto di Go riassume l'idea: non comunicare condividendo la memoria, ma
condividi la memoria comunicando ([The Go Authors, s.d.-b](#riferimenti)). Il modello viene da lontano,
dai *Communicating Sequential Processes* di Hoare ([Hoare, 1978](#riferimenti);
[The Go Authors, s.d.-d](#riferimenti)).

Una **pipeline**, nel linguaggio di Go, è proprio questo: una serie di fasi collegate da canali, in
cui ogni fase è fatta da goroutine che ricevono dati dalla fase precedente, li elaborano e li passano
alla successiva ([Ajmani, 2014](#riferimenti)).

### Le fasi

La catena che sto scrivendo ha quattro fasi, più un supervisore che la sorveglia:

```
  USB IN 0x83
      │
      ▼
  ┌────────┐  byte grezzi  ┌────────┐ messaggio + seq ┌──────────┐ campione ┌─────────┐
  │ reader │ ────────────→ │ framer │ ──────────────→ │ worker×N │ ───────→ │ emitter │ → uscita
  └────────┘               └────────┘                 └──────────┘          └─────────┘
      ↑                      │    ↑                                              │
      └─ buffer grezzi ──────┘    └───────────── buffer di frame ────────────────┘

  supervisore: keep-alive, watchdog, spegnimento ordinato, riconnessione
```

Le frecce in basso sono i percorsi di ritorno della memoria: il framer restituisce al reader i buffer
grezzi appena li ha letti, l'emitter restituisce al framer i buffer di frame solo dopo l'emissione.

| Fase | Goroutine | Che cosa fa | Che cosa non fa |
| --- | --- | --- | --- |
| **reader** | una | è l'unica che legge dall'endpoint USB di ingresso `0x83`; passa i byte avanti | non interpreta nulla |
| **framer** | una | ricompone i messaggi TTP spezzati o incollati; consegna le risposte ai comandi in attesa; copia i campioni di sguardo in buffer già pronti; numera i campioni con un contatore `seq` | non decodifica i campi |
| **worker** | N, per ora due | decodificano i campi TLV della riga e riempiono un campione a dimensione fissa | non scrivono sulle uscite |
| **emitter** | una | rimette i campioni in ordine, rileva i buchi nel contatore del dispositivo, scrive sulle uscite, restituisce i buffer | non legge dall'USB |

### Perché separare serve alla latenza

Il 4C produce un campione di sguardo circa ogni 11 ms (90 Hz). Se un'unica funzione leggesse,
ricomponesse, decodificasse e spedisse, un ritardo in un punto qualsiasi, per esempio un programma
lento a ricevere i dati, fermerebbe anche la lettura. I campioni si accumulerebbero nella coda USB, e
il cursore di Kite resterebbe indietro rispetto agli occhi.

Con le fasi separate, ognuna fa una cosa sola e la fa subito. Il **reader** in particolare non fa altro
che aspettare il dispositivo e passare i byte: è la fase che non deve fermarsi mai. Le fasi più
pesanti, come la decodifica, possono anche lavorare in parallelo su più campioni.

Questo è lo scheletro, semplificato, di come avvio le fasi (codice **in scrittura**):

```go
// Una goroutine per fase; i canali collegano le fasi.
go s.reader()                     // USB IN 0x83 → rawCh
go s.framer()                     // rawCh → jobs
for i := 0; i < opt.Workers; i++ {
	go s.worker()                 // jobs → results
}
go s.emitter()                    // results → uscite
```

### Dai byte ai numeri

Il lavoro dei worker si appoggia su due fatti del protocollo descritti nella prima parte: i numeri
sono **big-endian** e le coordinate sono in **virgola fissa**, interi a 64 bit da dividere per 2^42.
In codice diventano poche righe:

```go
const q42Scale = 1 << 42 // 2^42

// I64 legge 8 byte con il byte più significativo per primo (big-endian).
func (t TLV) I64() (int64, bool) {
	if len(t.Value) != 8 {
		return 0, false // lunghezza inattesa: il campo non è valido
	}
	return int64(binary.BigEndian.Uint64(t.Value)), true
}

// Fixed42 trasforma l'intero in un numero con la virgola.
func (t TLV) Fixed42() (float64, bool) {
	v, ok := t.I64()
	return float64(v) / q42Scale, ok
}
```

Un esempio: se il campo contiene l'intero 2 199 023 255 552, cioè 2^41, la coordinata vale
2^41 / 2^42 = 0,5. Il controllo sulla lunghezza conta quanto la formula: se un campo non ha la forma
che mi aspetto, il programma lo segnala come non valido invece di inventare un numero.

## La memoria: preparata all'avvio e riutilizzata

### Un pool di buffer

All'apertura della sessione il driver prepara due scorte di memoria, che non cambiano più:

- i **buffer grezzi**, dove il reader riceve i trasferimenti USB;
- i **buffer di frame**, dove il framer copia ogni campione di sguardo ricomposto.

Le scorte stanno in canali usati come **elenchi di buffer liberi**: chi ha bisogno di un buffer lo
prende dal canale, chi ha finito lo rimette. È uno schema descritto anche nella guida *Effective Go*
([The Go Authors, s.d.-b](#riferimenti)), con una differenza importante che spiego tra poco: quando la
scorta è vuota, la guida alloca un buffer nuovo, io invece scarto il campione.

### Campioni passati per valore

Il campione decodificato è una struttura a **dimensione fissa**: numeri e piccoli vettori di
lunghezza nota, nessun puntatore a memoria esterna. Passa da una fase all'altra **per valore**, cioè
copiato, come si passa un modulo già compilato invece di un biglietto con scritto "il modulo è nel
cassetto". La copia costa poco e non chiede memoria nuova al sistema. La guida al garbage collector di
Go indica proprio la riduzione delle allocazioni come una delle ottimizzazioni più efficaci
([The Go Authors, s.d.-c](#riferimenti)).

### Un ring per rimettere in ordine

Con più worker in parallelo, i campioni possono finire in ordine sparso. Il worker 1 può finire il
campione 8 prima che il worker 2 finisca il campione 7. Il framer, però, ha numerato ogni campione con
un contatore `seq` crescente, nell'ordine di arrivo dall'USB.

L'emitter tiene un **ring**, cioè un vettore circolare di posizioni. Il campione con numero `seq` va
nella posizione `seq` modulo la dimensione del ring. L'emitter emette solo il campione che aspetta,
poi il successivo, e così via: se il 7 non è ancora arrivato, l'8 resta in attesa nel suo posto.

```go
idx := r.s.Seq % n
ring[idx], present[idx] = r, true
for present[next%n] { // emetti solo in ordine, senza salti
	i := next % n
	present[i] = false
	next++
	s.frameFree <- ring[i].fb // il buffer torna al pool solo ora
	// ... controllo del contatore del dispositivo, scrittura sulle uscite
}
```

### L'invariante: un buffer torna al pool solo dopo l'emissione

Un **invariante** è una regola che deve valere sempre, in qualunque momento. Qui è questa: **un buffer
di frame torna al pool solo quando il suo campione esce dal ring per essere emesso**.

La conseguenza è che i campioni "in volo", cioè presi dal framer e non ancora emessi, non possono mai
essere più dei buffer del pool. Se il ring ha tante posizioni quanti sono i buffer, due campioni in
volo non possono mai finire nella stessa posizione e sovrascriversi. È un vincolo semplice, ma è quello
che tiene insieme la catena: chi cambierà in futuro la dimensione del pool o del ring dovrà rispettarlo.

### Meglio perdere un campione che accumulare ritardo: `host_drops`

Che cosa succede se la catena è satura e nel pool non c'è più un buffer libero? Il framer non aspetta.
Scarta il campione appena arrivato e lo conta:

```go
var fb *frameBuf
select {
case fb = <-s.frameFree: // c'è un buffer libero nel pool
default:
	// Pipeline satura: meglio perdere questo campione che accumulare ritardo.
	s.t.Stats.HostDrops.Add(1)
	return
}
fb.b = append(fb.b[:0], payload...) // copia nel buffer già pronto
s.jobs <- job{seq: seq, rxNs: rx, fb: fb}
```

È la traduzione in codice del quarto obiettivo. Per una tastiera a sguardo un campione vecchio di
mezzo secondo è inutile, anzi dannoso: sposta il cursore dove gli occhi non sono più. Il contatore
`host_drops` dice quante volte è successo, e di chi è la colpa: del mio computer.

### I buchi del dispositivo: `device_drops`

C'è anche l'altro caso: un campione che il computer non ha mai ricevuto. Ogni campione di sguardo
porta un **contatore dei fotogrammi** scritto dal dispositivo. L'emitter impara il passo normale tra
due campioni consecutivi, il più piccolo salto positivo osservato, e quando il salto è più grande
conta i campioni mancanti nel contatore `device_drops`. Insieme registra quanto tempo è passato
secondo l'orologio del tracker e secondo quello del computer: serve a capire se un campione non è mai
partito dall'USB o se la ricezione si è fermata.

Tenere separati i due contatori è una scelta di metodo. Quando misurerò la qualità dei dati, voglio
sapere se le perdite sono mie o del dispositivo.

## Il supervisore

Accanto alla catena gira un **supervisore**, che non tocca i dati ma sorveglia la sessione. Lo
considero parte del progetto quanto le fasi.

- **Keep-alive.** A intervalli regolari manda al dispositivo una domanda innocua, la richiesta delle
  stringhe di identità, e misura quanto ci mette a rispondere. Se non risponde entro il tempo previsto,
  la sessione viene considerata morta.
- **Watchdog.** Un "cane da guardia" controlla ogni 250 ms quando è arrivato l'ultimo campione di
  sguardo. Se il flusso tace oltre una soglia, per ora 3 s, il supervisore prova a sottoscriverlo di
  nuovo. Se tace ancora, chiude la sessione.
- **Spegnimento ordinato.** Quando chiedo al driver di fermarsi, l'ordine conta. Prima si annullano le
  sottoscrizioni ai flussi, mentre il reader è ancora vivo e può ricevere le risposte; poi si ferma la
  catena; infine si chiude la sessione con il trasferimento di controllo del produttore e si rilascia
  il dispositivo. Per questo la sessione ha un proprio contesto di arresto, separato dalla richiesta
  dell'utente: la catena deve restare in piedi quanto basta per salutare il dispositivo.
- **Riconnessione con backoff esponenziale.** Se il cavo si stacca o la sessione cade, il driver
  riprova. Non subito e non all'infinito alla stessa velocità: aspetta 1 s, poi 2, poi 4, poi 8, fino a
  un massimo di 10 s. Se la sessione precedente aveva funzionato, l'attesa riparte dal minimo. È lo
  stesso principio con cui le prime reti Ethernet raddoppiavano l'attesa media dopo ogni collisione
  ([Metcalfe e Boggs, 1976](#riferimenti)): quando qualcosa non va, insistere sempre più di rado evita
  di sprecare risorse e di intasare il sistema.

C'è un caso in cui il supervisore **non** riprova: quando manca il permesso di accedere al dispositivo.
Riprovare non servirebbe. Il driver si ferma e spiega come installare la regola udev, oppure, se la
regola c'è già, ricorda che serve una sessione locale attiva.

## I test: una difesa contro le ipotesi sbagliate

Nella voce di apertura avevo scritto che un assistente AI può proporre interpretazioni del protocollo
plausibili ma sbagliate. I test sono il modo in cui intendo accorgermene.

### Non toccano il dispositivo

I test non aprono mai il 4C. **Rigiocano catture USB reali**: messaggi registrati mentre il software
ufficiale di Windows, lo Stream Engine, parlava con un **Tobii Eye Tracker 5** (ET5), il successore del
4C, che usa la stessa famiglia di protocollo. Le catture vengono dal progetto della comunità
Open-tobii, prima chiamato tobii-linux, sono distribuite con licenza MIT e hanno il numero di serie del
dispositivo azzerato dall'autore ([Krazubu, s.d.](#riferimenti)). Per uno dei campioni di sguardo
catturati, lo stesso progetto riporta i valori che lo Stream Engine aveva consegnato.

Questo permette un test molto severo: decodificare quel campione e pretendere che i numeri siano
**identici bit per bit** a quelli dello Stream Engine, non "abbastanza vicini":

```go
func TestDecodeRealGazeFrame(t *testing.T) {
	msg := fixture(t, "et5-session1-gaze-frame") // cattura reale dell'ET5
	_, payload, _ := ParseHeader(msg)
	var row Row
	if err := DecodeRow(payload, &row); err != nil {
		t.Fatal(err)
	}
	// Valori consegnati dallo Stream Engine di Windows per questo frame.
	fc, _ := row.Get(0x14)
	if fc.U != 43_780 {
		t.Fatalf("frame counter %d", fc.U)
	}
	g, _ := row.Get(0x1c)
	if g.F[0] != 0.5872913599014282 || g.F[1] != 0.09927384555339813 {
		t.Fatalf("gaze point %+v", g)
	}
}
```

Se un'ipotesi sull'ordine dei byte, sulla scala della virgola fissa o sul significato di una colonna è
sbagliata, il numero cambia e il test fallisce.

Altri test riguardano la ricomposizione dei messaggi. Prendono tre messaggi reali, li incollano, poi
li spezzano in pezzi da 1, 7, 64, 512 e 1000 byte, oppure li passano tutti interi, e pretendono che ne escano esattamente gli stessi
tre messaggi. Un altro mette dei byte spazzatura davanti a un messaggio valido e controlla che il
programma ritrovi la sincronia.

### Allocazioni, benchmark e race detector

Per l'obiettivo "zero allocazioni" uso la funzione `testing.AllocsPerRun`, che conta le allocazioni
medie di una funzione eseguita molte volte ([The Go Authors, s.d.-e](#riferimenti)). Il test pretende
zero:

```go
allocs := testing.AllocsPerRun(1000, func() { _ = DecodeRow(payload, &row) })
if allocs != 0 {
	t.Fatalf("DecodeRow allocates %.1f times per call", allocs)
}
```

I **benchmark** di Go misurano il tempo e le allocazioni di una funzione ripetuta
([The Go Authors, s.d.-e](#riferimenti)). Per ora li uso come strumento, non come risultato: non
riporto numeri, perché senza il 4C non dicono ancora nulla sulla latenza reale.

Il **race detector** si attiva con l'opzione `-race` e segnala quando due goroutine toccano la stessa
variabile nello stesso momento e almeno una la modifica. Ha un limite che voglio tenere presente: trova
solo i problemi che si verificano davvero durante l'esecuzione, non quelli nascosti in parti di codice
che i test non percorrono ([The Go Authors, s.d.-a](#riferimenti)).

## Come lavoro con l'AI nella scrittura

La divisione dei compiti è quella che avevo annunciato. Io propongo soluzioni architetturali, l'assistente AI propone propone e scrive
bozze di codice, comprese bozze di test. Io rivedo ogni riga prima che entri nel progetto, scrivo o
pretendo un test per ogni ipotesi sul formato dei dati, e rifiuto ciò che non torna con le catture.

In pratica seguo alcune regole:

- **Nessuna ipotesi senza un confronto.** Un'interpretazione di un campo entra nel codice insieme a un
  test che la confronta con un messaggio reale.
- **Il dispositivo ha l'ultima parola.** All'avvio il driver chiede al 4C l'elenco delle colonne dei
  campioni e avvisa se la mappa delle colonne che uso non corrisponde a quella dichiarata dal firmware.
  Così un'ipotesi sbagliata, o un firmware diverso, si vede subito invece di produrre numeri plausibili
  ma falsi.
- **Commenti che spiegano il perché.** Ogni scelta non ovvia, come il numero 70 della regola udev o
  l'ordine dello spegnimento, porta con sé la sua ragione scritta nel codice, in italiano.

Il limite di questo metodo è chiaro: la revisione la faccio io, da solo. Se capisco male qualcosa, i
test possono confermare un mio errore tanto quanto uno dell'AI. Per questo pubblico il ragionamento
qui, dove altri possono leggerlo.

## Problemi aperti

- **La pipeline non è ancora stata provata sul 4C.** Tutto ciò che ho descritto è progetto e codice in
  scrittura. Il primo contatto con il dispositivo potrà smentire più di una scelta.
- **I test usano catture dell'ET5, non del 4C.** I due tracker condividono la famiglia di protocollo,
  ma le colonne dei campioni e alcuni comandi potrebbero essere diversi. Servono catture del 4C da
  aggiungere ai test.
- **I parametri sono scelti a priori.** Numero di worker, dimensione del pool e del ring, soglia del
  watchdog e tempi del backoff sono valori di partenza, non tarati su misure.
- **"Zero allocazioni" è verificato solo funzione per funzione.** I test controllano la decodifica e la
  ricomposizione, non l'intero programma in funzione. Il garbage collector può comunque lavorare per
  le altre parti.
- **Quante perdite sono accettabili?** Scartare campioni protegge dalla latenza, ma non so ancora quanti
  `host_drops` e `device_drops` Kite possa tollerare senza che la scrittura con lo sguardo ne risenta.
- **L'accesso senza root ha un costo.** La regola con `uaccess` richiede una sessione locale attiva; la
  variante per i sistemi senza schermo dà l'accesso a un gruppo di utenti, e va usata con attenzione su
  computer condivisi.

## Prossimi passi

1. Provare la pipeline sul 4C reale e misurare latenza, `host_drops` e `device_drops` in sessioni
   lunghe, riportando anche i risultati negativi.
2. Registrare catture del 4C, togliere il numero di serie, e aggiungerle ai test accanto a quelle
   dell'ET5.
3. Definire e documentare l'**uscita aperta** con cui Kite, e qualsiasi altro programma, potrà
   ricevere i campioni.
4. Affrontare la **calibrazione** dello sguardo sul 4C.
5. Portare la stima del **beccheggio** della testa sulle immagini infrarosse del sensore, partendo dal
   [prototipo con la webcam](/diario/tobii-4c-il-beccheggio-della-testa-dal-viso/).

Con questa voce si chiude la serie sul protocollo, non il lavoro. Racconterò qui il primo incontro tra
il codice e il dispositivo, comunque vada.

> **Avvertenza.** Kite è un progetto sperimentale e **non è un dispositivo medico certificato**. Il
> driver descritto qui è in scrittura e non è stato ancora provato sul dispositivo. Un driver non
> ufficiale usa il tracciatore in modi non previsti dal produttore: inviare comandi di cui non si
> conosce l'effetto potrebbe cambiarne il comportamento, compresi gli illuminatori infrarossi. Le
> regole udev permissive, che danno accesso al dispositivo a qualsiasi utente, sono sconsigliate su
> computer condivisi. Chi dipende da uno strumento di CAA per comunicare dovrebbe avere sempre
> un'alternativa di riserva. Le prove con persone richiedono il consenso informato e, quando serve, il
> parere di un comitato etico.

## Riferimenti

1. Ajmani S. (2014, 13 marzo). Go Concurrency Patterns: Pipelines and cancellation. *The Go Blog*.
   [go.dev/blog/pipelines](https://go.dev/blog/pipelines)
2. Google (2024). *gousb*, versione 1.1.3: binding Go per libusb, licenza Apache 2.0. Documentazione
   tecnica ufficiale. [pkg.go.dev/github.com/google/gousb](https://pkg.go.dev/github.com/google/gousb)
3. Hoare C. A. R. (1978). Communicating sequential processes. *Communications of the ACM*, 21(8),
   666–677. [doi:10.1145/359576.359585](https://doi.org/10.1145/359576.359585)
4. Krazubu (s.d.). *Open-tobii* (già *tobii-linux*): driver per Linux del Tobii Eye Tracker 5, con le
   catture di test in `crates/tobii-proto/fixtures/` [repository della comunità, non ufficiale],
   licenza MIT. GitHub. [github.com/Krazubu/Open-tobii](https://github.com/Krazubu/Open-tobii)
5. libusb (s.d.). *libusb*. Sito e documentazione ufficiale della libreria. [libusb.info](https://libusb.info/)
6. Metcalfe R. M., Boggs D. R. (1976). Ethernet: distributed packet switching for local computer
   networks. *Communications of the ACM*, 19(7), 395–404.
   [doi:10.1145/360248.360253](https://doi.org/10.1145/360248.360253)
7. systemd (s.d.-a). *73-seat-late.rules* (sorgente delle regole udev di systemd). GitHub,
   systemd/systemd.
   [github.com/systemd/systemd](https://github.com/systemd/systemd/blob/main/rules.d/73-seat-late.rules.in)
8. systemd (s.d.-b). *udev: Dynamic device management*. Pagina di manuale, documentazione ufficiale.
   [freedesktop.org](https://www.freedesktop.org/software/systemd/man/latest/udev.html)
9. systemd (s.d.-c). *sd-login: APIs for tracking logins*. Pagina di manuale, documentazione
   ufficiale, voce sul tag `uaccess`.
   [freedesktop.org](https://www.freedesktop.org/software/systemd/man/latest/sd-login.html)
10. The Go Authors (s.d.-a). *Data Race Detector*. Documentazione ufficiale di Go.
    [go.dev/doc/articles/race_detector](https://go.dev/doc/articles/race_detector)
11. The Go Authors (s.d.-b). *Effective Go*, sezione «Concurrency». Documentazione ufficiale di Go.
    [go.dev/doc/effective_go](https://go.dev/doc/effective_go#concurrency)
12. The Go Authors (s.d.-c). *A Guide to the Go Garbage Collector*. Documentazione ufficiale di Go.
    [go.dev/doc/gc-guide](https://go.dev/doc/gc-guide)
13. The Go Authors (s.d.-d). *Frequently Asked Questions*, voce «Why build concurrency on the ideas of
    CSP?». Documentazione ufficiale di Go. [go.dev/doc/faq](https://go.dev/doc/faq)
14. The Go Authors (s.d.-e). *Package testing*. Documentazione ufficiale della libreria standard di Go.
    [pkg.go.dev/testing](https://pkg.go.dev/testing)
