---
ref: smartchair
order: 1
codename: SmartChair
title: Una carrozzina elettrica guidata dalle onde cerebrali
summary: Una carrozzina elettrica che si comanda con l'attività del cervello, letta da una Brain Computer Interface.
question: >-
  Una persona con una disabilità motoria grave può guidare una carrozzina elettrica in modo
  sicuro e autonomo usando soltanto le proprie onde cerebrali?
icon: chair
status: prototype        # idea | review | design | prototype | testing | results
started: 2014-01-02      # primo post del blog del progetto: arriva la prima carrozzina
links:
  - label: Sito originale del progetto (2014, Web Archive)
    url: https://web.archive.org/web/20150102094047/http://www.blesciasw.it/smartchair/
  - label: Blog del progetto (2014)
    url: https://thesmartchair.blogspot.com/
  - label: Video su YouTube
    url: https://www.youtube.com/@AntonioBlescia/videos
  - label: ThinkUino, il progetto da cui è nato
    url: https://www.codeproject.com/Articles/567963/ThinkUino-Project
# next_steps:            # ✏️ aggiungi i prossimi passi
#   - text: Primo passo
#     done: false
---

## Contesto

Per chi non può usare un joystick, nemmeno con la bocca o con il mento, guidare una carrozzina
elettrica da solo è spesso impossibile. Una **Brain Computer Interface** (BCI) permette di
trasformare l'attività elettrica del cervello, misurata con l'elettroencefalografia (EEG),
in comandi per un dispositivo, senza usare i muscoli.

## Obiettivo

SmartChair vuole collegare una BCI a una carrozzina elettrica, così che la persona possa
decidere dove andare usando le proprie onde cerebrali, con la sicurezza al primo posto.

## La storia del progetto

SmartChair non nasce oggi. L'ho cominciata a Bari all'inizio del 2014, nel tempo libero, con l'aiuto del mio amico Michele Galletta, che ha curato i collegamenti
elettrici. Il 2 gennaio 2014 è arrivata la prima carrozzina su cui montare il sistema. L'avevo
comprata apposta, e ogni giorno mi ci sedevo un po' per capire cosa prova chi la usa davvero.

Il punto di partenza era **ThinkUino** (2013), un mio progetto open source che collegava una
scheda Arduino a una cuffia EEG NeuroSky MindWave Mobile. Con ThinkUino si poteva accendere un
dispositivo semplicemente concentrandosi.

L'idea di SmartChair era più ampia: riunire in un'unica architettura, a basso costo e basata
su software aperto, gli ausili che di solito restano separati. Il prototipo del 2014 era fatto
così:

| Componente | Ruolo nel prototipo |
| --- | --- |
| Cuffia EEG NeuroSky MindWave Mobile | Legge le onde cerebrali; un battito di palpebre cambia il dispositivo selezionato |
| Smartphone Android sul bracciolo | È il centro del sistema e parla con gli altri dispositivi via Bluetooth |
| Arduino | Comanda la scheda elettronica della carrozzina elettrica |
| Centralina domotica Cupersafety NewDom (ZigBee) | Accende e spegne luci e dispositivi di casa |
| Riconoscimento vocale sempre in ascolto | Dà i comandi a voce, senza toccare lo schermo |
| Occhiali GlassUp e smartwatch Pebble | Mostrano notifiche e lo stato della casa |

Nelle dimostrazioni del 2014 il prototipo accendeva e spegneva le luci di una stanza con la voce
e con il pensiero, e faceva muovere una macchinina radiocomandata. La parte della carrozzina era
ancora in sperimentazione, in attesa degli strumenti giusti. Già allora annotavo i limiti
principali: circa **1 s di ritardo** tra il pensiero e il comando, la sicurezza dei dati ancora
da risolvere e un sistema "nudo", senza nessuna cura dell'aspetto.

## Perché ora è un prototipo

Visto che quel prototipo esiste ed è documentato, la ricerca riparte dalla fase **Prototipo** e
non da zero. Da qui in avanti lo rivedrò alla luce di ciò che si sa oggi sulle BCI e sulle
carrozzine intelligenti.

> **Avvertenza.** SmartChair è un progetto sperimentale e **non è un dispositivo medico
> certificato**. Una cuffia EEG consumer come quella del 2014 non basta per guidare in
> sicurezza una carrozzina vera. Qualsiasi prova su persone richiederà sistemi di arresto
> indipendenti, consenso informato e, quando serve, il parere di un comitato etico.

## A che punto sono

Ho un prototipo del 2014 da cui ripartire. Racconterò ogni passo nel [diario](/diario/).

## Rassegna stampa e risorse

Tutte le fonti su SmartChair che ho trovato online, in ordine cronologico. Gli articoli sono in
italiano.

### Articoli e servizi

- **4 marzo 2014.** Gianvito Rutigliano,
  [«SmartChair, così nasce la sedia a rotelle che si muove col pensiero»](https://puglia-startapp-bari.blogautore.repubblica.it/2014/03/04/la-sedia-a-rotelle-si-muove-col-pensiero-e-si-produce-a-bari-2/),
  *Puglia StartApp*, blog di Repubblica.it.
- **25 marzo 2014.** [Servizio del TG3](https://www.youtube.com/watch?v=kLIZ4vT_6-g) su
  SmartChair (video su YouTube).
- **26 marzo 2014.** Arcangelo Rociola,
  [«La psicocinesi è roba da makers: così un ragazzo di Bari riesce a muovere oggetti col pensiero»](https://web.archive.org/web/20161202040508/http://www.chefuturo.it/2014/03/la-psicocinesi-e-roba-da-makers-un-ragazzo-di-bari-e-riuscito-a-muovere-gli-oggetti-col-pensiero/),
  *Che Futuro!* (copia su Web Archive: l'originale non è più online).
- **31 marzo 2014.** Pietro Boccadoro,
  [«SmartChair: un progetto pugliese che fa sognare un mondo migliore»](https://it.emcelettronica.com/smartchair-progetto-pugliese-che-fa-sognare-mondo-migliore),
  intervista su *Elettronica Open Source*.
- **26 maggio 2014.**
  [«SmartChair, la sedia a rotelle che si muove con il pensiero di un venticinquenne barese»](https://it.paperblog.com/smartchair-la-sedia-a-rotelle-che-si-muove-con-il-pensiero-di-un-venticinquenne-barese-2573138/),
  uscito su *startupgirl.it* e ripubblicato su *Paperblog*.
- **2014.** «Da Bari l'app che legge nel pensiero», servizio video di *Zoomin.tv*. Il video non è
  più disponibile, ma resta nella
  [rassegna stampa del sito originale](https://web.archive.org/web/20150102094047/http://www.blesciasw.it/smartchair/).

### Eventi

- **25 ottobre 2014.** Intervento al *Makers' Meeting* al Circolo ARCI Zona Franka di Bari:
  [annuncio su BariToday](https://www.baritoday.it/eventi/elettronica-open-source-makers-meeting-circolo-zona-franka.html),
  [Oltre Free Press](http://www.oltrefreepress.com/makers-meeting-levento-stavamo-tutti-aspettando/)
  e [Puglia StartApp](https://puglia-startapp-bari.blogautore.repubblica.it/2014/10/24/il-meeting-dei-makers-60-anni-di-cern-e-tedx-un-weekend-da-innovatori-in-puglia/)
  (24 ottobre 2014).

### Video dimostrativi

- **24 gennaio 2014.** [Control house with brainwaves](https://www.youtube.com/watch?v=5TYFdThuBNQ)
- **27 gennaio 2014.** [SmartChair: Voice Control](https://www.youtube.com/watch?v=AKUQYsBOu3M)
- **27 gennaio 2014.** [SmartChair: Thought Control](https://www.youtube.com/watch?v=sMOjIHX3Hbs)
- **3 marzo 2014.** Due video girati da Gianvito Rutigliano per Repubblica:
  [prima parte](https://www.youtube.com/watch?v=lalmm08tV_w) e
  [seconda parte](https://www.youtube.com/watch?v=NbcmmdncCzg)

### Materiali originali del 2014

- [Sito del progetto](https://web.archive.org/web/20150102094047/http://www.blesciasw.it/smartchair/)
  su blesciasw.it (copia su Web Archive del 2 gennaio 2015): architettura, dispositivi, video e
  rassegna stampa.
- [Blog del progetto](https://thesmartchair.blogspot.com/) (gennaio 2014): l'arrivo della prima
  carrozzina e la schermata delle impostazioni dell'app.

### Progetti da cui è nata SmartChair

- **ThinkUino**, per controllare Arduino con la mente:
  [articolo su CodeProject](https://www.codeproject.com/Articles/567963/ThinkUino-Project)
  (26 marzo 2013, in inglese) e
  [articolo su Elettronica Open Source](https://it.emcelettronica.com/thinkuino-project-controlla-tuo-arduino-con-mente)
  (8 aprile 2013).
- **Loggy**, che usava la stessa cuffia MindWave:
  [articolo su Elettronica Open Source](https://it.emcelettronica.com/loggy-project-digitalizza-tua-giornata)
  (12 giugno 2013).
