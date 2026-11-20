---
ref: tobii-4c-linux-driver-public
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Tobii 4C su GNU/Linux: il driver è pubblico su GitHub"
description: Ho pubblicato tobii4c-linux, il driver libero per il Tobii Eye Tracker 4C, con licenza MIT. Racconto che cosa fa, come si installa e con quale licenza.
tags: [eye-tracking, tobii, linux, driver, open-source, github]
---

Il driver libero per il **Tobii Eye Tracker 4C** di cui ho scritto nelle ultime due settimane ora è
pubblico su GitHub, con licenza MIT:
[github.com/ablescia/tobii4c-linux](https://github.com/ablescia/tobii4c-linux).

Come ci sono arrivato l'ho già raccontato, e qui non lo ripeto. Il protocollo è nella
[prima](/diario/tobii-4c-su-linux-1-leggere-prima-di-toccare/) e nella
[seconda parte](/diario/tobii-4c-su-linux-2-dare-un-nome-ai-byte/) della serie, l'architettura e le
scelte di base nella [terza](/diario/tobii-4c-su-linux-3-dall-ipotesi-al-codice/).

In questa voce dico che cosa fa il driver, come si installa e con quale licenza è distribuito.

## Il repository in breve

| Voce | Valore |
| --- | --- |
| Indirizzo | [github.com/ablescia/tobii4c-linux](https://github.com/ablescia/tobii4c-linux) |
| Licenza | MIT |
| Linguaggio | Go, versione 1.22 o successiva, con libusb-1.0 |
| Dispositivo | Tobii Eye Tracker 4C (USB `2104:0127`), provato su un solo esemplare, firmware 4.7.0 |
| Eye Tracker 5 | il driver ne accetta l'identificativo (`2104:0313`), ma sull'ET5 non è stato provato |
| Sistemi provati | Debian 13 e Arch Linux (Omarchy) |
| Versioni | nessuna release e nessun tag: si compila dai sorgenti del ramo `main` |
| Documentazione | README in italiano, con un riassunto in inglese |

## Che cosa fa

Il driver è un programma normale, senza modulo del kernel e senza i programmi proprietari di Tobii.
Parla con il 4C attraverso l'USB e passa i dati ad altri programmi. In concreto:

- **legge** sguardo, posizione degli occhi, diametro delle pupille, posa della testa e presenza,
  circa un campione ogni 11 ms;
- **li inoltra** via UDP sul computer stesso, nel formato T4CG v2 che ho descritto
  [l'11 novembre](/diario/tobii-4c-su-linux-il-driver-alla-prova/#3-luscita-aperta-per-kite-e-per-gli-altri-programmi),
  e, se serve, via Lab Streaming Layer (LSL). Nel repository c'è un ricevitore di esempio in Python,
  `examples/recv.py`, che usa solo la libreria standard: è la base più semplice per collegare un
  altro programma;
- **calibra lo sguardo** con un'applicazione a schermo intero che ripete i passi di quella ufficiale:
  posizionamento del sensore, controllo della posizione della persona, 7 punti di calibrazione e 5 di
  verifica. Prima di cominciare salva la calibrazione attiva e la rimette sul dispositivo se la
  procedura viene annullata;
- **ricorda la configurazione**: con le opzioni `-display-mm saved` e `-calibration saved` rilegge
  l'area dello schermo e la calibrazione salvate da `tobii4c calibrate` e le riscrive sul 4C a ogni
  connessione, anche dopo che il tracciatore è stato scollegato e ricollegato. Serve perché il 4C
  dimentica l'area dello schermo quando resta senza alimentazione, come avevo visto con
  [Tobii Race](/diario/tobii-race-un-gioco-per-mettere-alla-prova-il-4c/). Se un file manca, il
  driver lo scrive nel registro e parte comunque. Il servizio systemd usa entrambe le opzioni;
- **calibra la camera infrarossa** e lo zero personale del beccheggio della testa, con
  `tobii4c headpose-calibrate`. Serve solo al beccheggio, che il driver stima dalle immagini del 4C
  come ho raccontato [l'11 novembre](/diario/tobii-4c-su-linux-il-driver-alla-prova/);
- **gira come servizio** dell'utente, con systemd, e accede al tracciatore senza i permessi di
  amministratore grazie a una regola udev, come spiegato nella
  [terza parte](/diario/tobii-4c-su-linux-3-dall-ipotesi-al-codice/).

## Come si installa

Il README descrive un avvio rapido in cinque passi. Su Debian o Ubuntu:

```sh
# 1. dipendenze e sorgenti
sudo apt install git make golang libusb-1.0-0-dev pkg-config
git clone https://github.com/ablescia/tobii4c-linux.git && cd tobii4c-linux

# 2. programma in ~/.local/bin, regola udev (chiede sudo), servizio systemd dell'utente
make install install-udev install-service

# 3. con il 4C collegato e montato sotto lo schermo: configurazione e calibrazione
tobii4c calibrate

# 4. avvio del driver come servizio, anche ai login successivi
systemctl --user enable --now tobii4c

# 5. controllo: i campioni arrivano su UDP 127.0.0.1:5005
tobii4c recv
```

Su Arch Linux le dipendenze sono `git base-devel go libusb pkgconf`. Chi non vuole clonare il
repository può usare `go install`, ma servono comunque Go, libusb-1.0 con i suoi file di intestazione
e pkg-config. Il modello del viso per il beccheggio, 4,9 MB, è già incorporato nel programma: non va
scaricato a parte.

Tre cose pratiche da sapere prima di provarlo:

1. **Il servizio tiene il tracciatore in uso esclusivo.** Prima di lanciare `tobii4c calibrate` o
   `tobii4c headpose-calibrate` va fermato, e poi riavviato. Altrimenti il comando risponde
   `device or resource busy`.
2. **Le finestre di calibrazione richiedono una sessione grafica**, X11 oppure Wayland con XWayland.
3. **La regola udev funziona con una sessione locale attiva.** Una connessione via SSH da sola non
   basta: per un computer senza schermo il file contiene una variante commentata, basata su un gruppo
   di utenti.

## Licenza e componenti di altri

Il driver ha licenza **MIT**: chiunque può usarlo, modificarlo e ridistribuirlo, anche in prodotti
commerciali, a condizione di conservare l'avviso di copyright e il testo della licenza. Il software è
fornito senza garanzie.

Nel repository ci sono anche componenti di altri, ciascuno con la sua licenza. Sono elencati nel file
`THIRD_PARTY_NOTICES.md`:

| Componente | Uso | Licenza |
| --- | --- | --- |
| rete dei punti del viso di MediaPipe Face Landmarker, convertita in formato ONNX, e modello canonico del viso di MediaPipe | stima del beccheggio, incorporati nel programma | Apache 2.0 |
| catture USB dell'Eye Tracker 5 dal progetto Krazubu/tobii-linux | solo nei test | MIT |
| librerie Go `gousb`, `xgb`, `x/image`, `x/text` | incluse nel programma compilato | Apache 2.0 e BSD 3-Clause |
| libusb-1.0 e, se attivato, liblsl | librerie di sistema, collegate al programma | LGPL 2.1 e MIT |

Il protocollo è ricostruito a partire dai progetti indipendenti per l'Eye Tracker 5 che ho descritto
nella [prima parte](/diario/tobii-4c-su-linux-1-leggere-prima-di-toccare/). Il driver non è
affiliato a Tobii, né sponsorizzato o approvato da Tobii.

> **Avvertenza.** Il driver è un software sperimentale e non ufficiale, e **non è un dispositivo
> medico certificato**. Usa il tracciatore in modi non previsti dal produttore e scrive sul 4C
> calibrazione e area dello schermo, facendo prima un backup della calibrazione: si usa a proprio
> rischio. Le immagini infrarosse del 4C riprendono il viso e sono dati personali. Chi dipende da uno
> strumento di CAA per comunicare dovrebbe avere sempre
> un'alternativa di riserva. Le prove con altre persone richiedono il consenso informato e, quando
> serve, il parere di un comitato etico.

## Riferimenti

1. Blescia A. (2026). *tobii4c-linux: driver user-space per il Tobii Eye Tracker 4C su Linux*
   (commit `c0e36af`, 20 novembre 2026). Software, licenza MIT. GitHub.
   [github.com/ablescia/tobii4c-linux](https://github.com/ablescia/tobii4c-linux)
