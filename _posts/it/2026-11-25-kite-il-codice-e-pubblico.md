---
ref: kite-code-public
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Kite: il codice della tastiera ibrida è pubblico su GitHub"
description: Ho pubblicato il codice di Kite, la tastiera a sguardo ibrida, con licenza GNU AGPL 3.0 o successiva. Racconto che cosa contiene il repository, che cosa permette la licenza e perché i tempi di selezione sono più lunghi di quelli del video.
tags: [caa, tastiera-virtuale, open-source, github, licenza, agpl]
---

Il 17 novembre avevo promesso di pubblicare il codice della tastiera ibrida, con una licenza open
source da indicare al momento della pubblicazione
([voce del 17 novembre](/diario/kite-la-tastiera-ibrida-resta-aperta/#prossimo-passo-il-codice)).
Ora il codice di [Kite](/ricerche/kite/) è pubblico su GitHub, con licenza **GNU AGPL 3.0 o
successiva**: [github.com/ablescia/Kite](https://github.com/ablescia/Kite).

I metodi li ho già descritti negli [studi teorici](/diario/tastiera-ibrida-gli-studi-teorici/) e nella
nota tecnica su Zenodo ([Blescia, 2026a](#riferimenti)), e qui non li ripeto. In questa voce dico che
cosa c'è nel repository, che cosa permette la licenza e che cosa è cambiato rispetto al video: i tempi
di selezione.

## Il repository in breve

| Voce | Valore |
| --- | --- |
| Indirizzo | [github.com/ablescia/Kite](https://github.com/ablescia/Kite) |
| Licenza | GNU AGPL 3.0 o successiva (`AGPL-3.0-or-later`), con le eccezioni elencate sotto |
| Linguaggio | Go, versione 1.22 o successiva, senza codice C |
| Sistema | Linux con X11, oppure Wayland con XWayland |
| Tracciatore | Tobii Eye Tracker 4C, attraverso il driver [tobii4c-linux](https://github.com/ablescia/tobii4c-linux), indispensabile |
| Senza tracciatore | un utente simulato, utile solo per provare l'interfaccia |
| Voce | facoltativa, con Piper, una sintesi vocale che gira sul computer |
| Versioni | nessuna release e nessun tag: si compila dai sorgenti del ramo `main` |
| Documentazione | README in italiano, con un riassunto in inglese |
| Citazione | file `CITATION.cff`, letto anche dal pulsante «Cite this repository» di GitHub |

## Che cosa c'è dentro

Il repository contiene la tastiera che si vede nel video, con le correzioni venute dopo:

- il **selettore ibrido**: il tempo di selezione parte da quando l'occhio atterra dopo una saccade e
  dipende dalla probabilità della lettera, le aree di tocco dei tasti probabili si allargano in modo
  invisibile e la pupilla può allungare i tempi;
- la **calibrazione pupilla-luminanza**, che separa l'effetto della luce da quello dello sforzo;
- il **correttore italiano**, con la barra dei tre suggerimenti;
- la **voce**, con Piper, e le **frasi imparate**, proposte in grigio dopo il cursore;
- `kite-replay`, un programma che rigioca le sessioni registrate con i parametri di allora e con
  quelli attuali. È lo strumento con cui ho deciso i nuovi tempi, più sotto.

Kite non parla direttamente con il tracciatore. Legge i campioni che il driver tobii4c-linux manda via
UDP sul computer stesso, e ne lancia la calibrazione dello sguardo. Il driver va installato prima: l'ho
presentato il [20 novembre](/diario/tobii-4c-su-linux-il-driver-e-pubblico/).

## Come si installa

Su Debian o Ubuntu, partendo da zero:

```sh
# 1. il driver tobii4c-linux, se non c'è già
sudo apt install git make golang libusb-1.0-0-dev pkg-config
git clone https://github.com/ablescia/tobii4c-linux.git && cd tobii4c-linux
make install install-udev install-service
systemctl --user enable --now tobii4c
cd ..

# 2. Kite
git clone https://github.com/ablescia/Kite.git && cd Kite
make build
./bin/kite
```

Al primo avvio, dal menu di Kite: tasto **1** per la calibrazione dello sguardo, **2** per la
calibrazione pupilla-luminanza, **3** per scrivere. Senza tracciatore si prova l'interfaccia con
`./bin/kite -simulate`. La voce si installa a parte, e i passi sono nel README.

## La licenza: GNU AGPL 3.0

La **GNU Affero General Public License** (AGPL), versione 3, è una licenza della Free Software
Foundation del 19 novembre 2007 ([Free Software Foundation, 2007](#riferimenti)). L'Open Source
Initiative l'ha approvata come licenza open source ([Open Source Initiative, s.d.](#riferimenti)).
«O successiva» vuol dire che si può scegliere anche una versione più recente, se la Free Software
Foundation la pubblicherà.

In concreto, chiunque può:

1. **usare** Kite, per qualsiasi scopo, anche commerciale;
2. **studiarne** il codice e **modificarlo**;
3. **ridistribuirlo**, così com'è o modificato.

C'è una condizione: chi distribuisce Kite, o una sua versione modificata, deve farlo con la stessa
licenza e mettere a disposizione il codice sorgente. È il principio del *copyleft*: le libertà passano
a chi riceve il programma e nessuno, lungo la strada, può toglierle. La AGPL aggiunge una regola per i
programmi usati attraverso la rete. Chi modifica il programma e lo fa usare ad altri a distanza, per
esempio da un server, deve offrire anche a loro il codice della propria versione (sezione 13 della
licenza). Il software è fornito senza garanzie.

Il driver tobii4c-linux, invece, ha la licenza MIT, più permissiva: chi lo include in un altro
programma non è obbligato a pubblicarne il codice.

La licenza mantiene quello che avevo scritto il 17 novembre: chiunque può usare il codice, studiarlo,
adattarlo e contribuire. Segnalazioni e proposte si fanno nelle *issue* e nelle *pull request* del
repository; il README spiega come.

La licenza riguarda il codice. I metodi sono descritti nella nota tecnica su Zenodo, con licenza
CC BY 4.0, e non sono brevettati, come ho spiegato nella
[voce del 17 novembre](/diario/kite-la-tastiera-ibrida-resta-aperta/).

### Componenti di altri

Alcune parti hanno una licenza diversa. Sono elencate nel file `THIRD_PARTY_NOTICES.md`, e i testi
delle licenze sono nella cartella `LICENSES/`:

| Componente | Uso | Licenza |
| --- | --- | --- |
| finestra X11 a schermo intero, copiata dal driver tobii4c-linux | interfaccia | MIT |
| lessico italiano: le 150.000 parole più frequenti nei sottotitoli di OpenSubtitles 2018, dal progetto FrequencyWords ([Dave, s.d.](#riferimenti)) | modello di lingua e correttore, incorporato nel programma | CC BY-SA 4.0 |
| librerie Go `xgb`, `x/image`, `x/text` e i caratteri Go | incluse nel programma compilato | BSD 3-Clause |
| driver tobii4c-linux | programma separato, indispensabile con il tracciatore | MIT |
| Piper ([OHF-Voice, s.d.](#riferimenti)) e la voce italiana | programmi separati, facoltativi, non inclusi | GPL 3.0 per Piper; per la voce, la sua scheda |

Kite non è affiliato a Tobii, né sponsorizzato o approvato da Tobii.

## Che cosa è cambiato dal video: i tempi

Nel video del 17 novembre, e negli studi teorici, il tempo di selezione andava da **120 ms** per una
lettera molto probabile a **700 ms** per una improbabile. Negli studi teorici avevo indicato proprio
qui il rischio principale della tastiera: 120 ms sono meno delle fissazioni tipiche della ricerca
visiva, 180–275 ms. Guardare un tasto molto probabile per cercarlo poteva quindi scriverlo
([studi teorici, punto 2](/diario/tastiera-ibrida-gli-studi-teorici/#2-predizione-tempi-e-bersagli-che-seguono-la-lingua)).

Il codice pubblicato usa tempi più lunghi, con tre velocità da scegliere dal menu (tasto **V**):

| Velocità | Lettera probabile | Lettera improbabile |
| --- | --- | --- |
| veloce | 0,2 s | 0,8 s |
| normale (predefinita) | 0,2 s | 1 s |
| prudente | 0,25 s | 1,1 s |

Per decidere ho usato `kite-replay`. Rigioca attraverso il selettore lo sguardo registrato nelle mie
sessioni di scrittura libera di novembre 2026, con i tempi di allora e con quelli nuovi, e conta come
errori le lettere che poi avevo cancellato. Con la velocità normale, il replay stima che queste lettere
sbagliate scendano da **76 a 30, su circa 800**. Il prezzo è circa 0,1 s in più per lettera. Ma nelle stesse sessioni un
errore costa, in mediana, 3,9 s tra il momento in cui lo vedo e quello in cui l'ho cancellato.

Insieme ai tempi sono arrivate alcune protezioni contro le selezioni involontarie, sempre attive:

- quando la tastiera compare, o torna attiva dopo che la voce ha parlato, lo sguardo già fermo su un
  tasto non lo scrive subito, e la prima selezione chiede almeno 0,5 s;
- cancella e i suggerimenti chiedono 0,7 s, parla 1 s, qualunque sia la velocità delle lettere;
- se la saccade puntava chiaramente a un altro tasto, la lettera su cui lo sguardo si ferma per strada
  chiede il tempo massimo.

Questi numeri hanno dei limiti, e li dico con la stessa evidenza. Sono le stime di un replay, non una
prova dal vivo: lo sguardo registrato non reagisce ai nuovi tempi come farebbe una persona. E sono le
sessioni di una sola persona, io, al banco. Per sapere se i nuovi tempi vanno bene per chi ha bisogno
di uno strumento di CAA servono prove con altre persone.

> **Avvertenza.** Kite è un software di ricerca, sperimentale, e **non è un dispositivo medico
> certificato**. Chi dipende da uno strumento di CAA per comunicare dovrebbe avere sempre
> un'alternativa di riserva, per esempio una tabella alfabetica su carta. Le prove con altre persone
> richiedono il consenso informato e, quando serve, il parere di un comitato etico.

## Prossimo passo

Il 17 novembre avevo promesso anche di collegare il repository al record su Zenodo, così che la
descrizione dei metodi e il codice si trovino a vicenda. Non è ancora fatto: lo segnalerò qui quando
lo sarà.

## Riferimenti

1. Blescia A. (2026a). *Probabilistic gaze typing with saccade-anchored adaptive dwell,
   corrective-saccade-aware selection, luminance-compensated pupillometry and gaze-aware correction*
   (versione 1.0). Nota tecnica, Zenodo.
   [doi:10.5281/zenodo.24282465](https://doi.org/10.5281/zenodo.24282465) (open access).
2. Blescia A. (2026b). *Kite: tastiera a sguardo ibrida per la comunicazione aumentativa e
   alternativa*. Software, licenza AGPL-3.0-or-later. GitHub.
   [github.com/ablescia/Kite](https://github.com/ablescia/Kite)
3. Blescia A. (2026c). *tobii4c-linux: driver user-space per il Tobii Eye Tracker 4C su Linux*
   (commit `c0e36af`, 20 novembre 2026). Software, licenza MIT. GitHub.
   [github.com/ablescia/tobii4c-linux](https://github.com/ablescia/tobii4c-linux)
4. Dave H. (s.d.). *FrequencyWords*. Repository GitHub, contenuti con licenza CC BY-SA 4.0.
   [github.com/hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords)
5. Free Software Foundation (2007). *GNU Affero General Public License*, versione 3, 19 novembre 2007.
   [gnu.org/licenses/agpl-3.0.html](https://www.gnu.org/licenses/agpl-3.0.html)
6. OHF-Voice (s.d.). *piper1-gpl: Fast and local neural text-to-speech engine*. Repository GitHub,
   licenza GPL 3.0. [github.com/OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl)
7. Open Source Initiative (s.d.). *GNU Affero General Public License version 3*.
   [opensource.org/license/agpl-v3](https://opensource.org/license/agpl-v3)
