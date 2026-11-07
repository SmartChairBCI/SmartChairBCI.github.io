---
ref: smartchair
order: 1
codename: SmartChair
title: A powered wheelchair driven by brainwaves
summary: A powered wheelchair controlled by brain activity, read through a Brain Computer Interface.
question: >-
  Can a person with a severe motor disability drive a powered wheelchair safely and
  independently using only their brainwaves?
icon: chair
status: prototype        # idea | review | design | prototype | testing | results
started: 2014-01-02      # first post on the project blog: the first wheelchair arrives
links:
  - label: Original project website (2014, Web Archive)
    url: https://web.archive.org/web/20150102094047/http://www.blesciasw.it/smartchair/
  - label: Project blog (2014)
    url: https://thesmartchair.blogspot.com/
  - label: Videos on YouTube
    url: https://www.youtube.com/@AntonioBlescia/videos
  - label: ThinkUino, the project it grew out of
    url: https://www.codeproject.com/Articles/567963/ThinkUino-Project
# next_steps:            # ✏️ add the next steps
#   - text: First step
#     done: false
---

## Context

For people who cannot use a joystick, not even with their mouth or chin, driving a powered
wheelchair on their own is often impossible. A **Brain Computer Interface** (BCI) turns the
electrical activity of the brain, measured with electroencephalography (EEG), into commands for
a device, without using any muscles.

## Goal

SmartChair aims to connect a BCI to a powered wheelchair, so that the person can decide where
to go using their own brainwaves, with safety first.

## The story of the project

SmartChair is not new. I started it in Bari in early 2014, in my spare time, with the help of my
friend Michele Galletta, who took care of the electrical connections. On 2 January 2014 the first
wheelchair to build the system on arrived. I had bought it specifically for the project, and every
day I sat in it for a while to understand how it feels for the people who really use one.

The starting point was **ThinkUino** (2013), an open source project of mine that connected an
Arduino board to a NeuroSky MindWave Mobile EEG headset. With ThinkUino you could switch a device
on just by concentrating.

The idea behind SmartChair was broader: to bring together, in a single low-cost architecture
based on open software, assistive tools that usually stay separate. The 2014 prototype was built
like this:

| Component | Role in the prototype |
| --- | --- |
| NeuroSky MindWave Mobile EEG headset | Reads the brainwaves; an eye blink changes the selected device |
| Android smartphone on the armrest | The hub of the system, talking to the other devices over Bluetooth |
| Arduino | Drives the electronic board of the powered wheelchair |
| Cupersafety NewDom home automation unit (ZigBee) | Switches lights and household devices on and off |
| Always-listening speech recognition | Gives voice commands without touching the screen |
| GlassUp glasses and Pebble smartwatch | Show notifications and the state of the house |

In the 2014 demonstrations the prototype switched the lights of a room on and off by voice and by
thought, and drove a remote-controlled toy car. The wheelchair part was still being tested,
waiting for the right tools. Back then I was already noting the main limits: about **1 s of
delay** between the thought and the command, data security still to be solved, and a "bare"
system with no attention to its appearance.

## Why it is now a prototype

Since that prototype exists and is documented, the research restarts from the **Prototype**
phase rather than from scratch. From here on I will review it in the light of what is known today
about BCIs and smart wheelchairs.

> **Warning.** SmartChair is an experimental project and **is not a certified medical device**.
> A consumer EEG headset like the 2014 one is not enough to drive a real wheelchair safely. Any
> test on people will require independent stop systems, informed consent and, where needed, the
> approval of an ethics committee.

## Where I am

I have a 2014 prototype to restart from. I will document every step in the
[journal](/en/journal/).

## Press coverage and resources

All the sources about SmartChair I have found online, in chronological order. The articles are in
Italian.

### Articles and reports

- **4 March 2014.** Gianvito Rutigliano,
  [«SmartChair, così nasce la sedia a rotelle che si muove col pensiero»](https://puglia-startapp-bari.blogautore.repubblica.it/2014/03/04/la-sedia-a-rotelle-si-muove-col-pensiero-e-si-produce-a-bari-2/)
  ("SmartChair: how the wheelchair that moves by thought was born"), *Puglia StartApp*, a
  Repubblica.it blog.
- **25 March 2014.** [TG3 news report](https://www.youtube.com/watch?v=kLIZ4vT_6-g) on
  SmartChair (video on YouTube).
- **26 March 2014.** Arcangelo Rociola,
  [«La psicocinesi è roba da makers: così un ragazzo di Bari riesce a muovere oggetti col pensiero»](https://web.archive.org/web/20161202040508/http://www.chefuturo.it/2014/03/la-psicocinesi-e-roba-da-makers-un-ragazzo-di-bari-e-riuscito-a-muovere-gli-oggetti-col-pensiero/)
  ("Psychokinesis is for makers: how a young man from Bari moves objects by thought"),
  *Che Futuro!* (Web Archive copy: the original is no longer online).
- **31 March 2014.** Pietro Boccadoro,
  [«SmartChair: un progetto pugliese che fa sognare un mondo migliore»](https://it.emcelettronica.com/smartchair-progetto-pugliese-che-fa-sognare-mondo-migliore)
  ("SmartChair: a project from Apulia that makes you dream of a better world"), interview on
  *Elettronica Open Source*.
- **26 May 2014.**
  [«SmartChair, la sedia a rotelle che si muove con il pensiero di un venticinquenne barese»](https://it.paperblog.com/smartchair-la-sedia-a-rotelle-che-si-muove-con-il-pensiero-di-un-venticinquenne-barese-2573138/)
  ("SmartChair, the wheelchair that moves by thought, by a 25-year-old from Bari"), published on
  *startupgirl.it* and republished on *Paperblog*.
- **2014.** «Da Bari l'app che legge nel pensiero» ("From Bari, the app that reads your mind"), a
  *Zoomin.tv* video report. The video is no longer available, but it is still listed in the
  [press section of the original website](https://web.archive.org/web/20150102094047/http://www.blesciasw.it/smartchair/).

### Events

- **25 October 2014.** Talk at the *Makers' Meeting* at the Circolo ARCI Zona Franka in Bari:
  [announcement on BariToday](https://www.baritoday.it/eventi/elettronica-open-source-makers-meeting-circolo-zona-franka.html),
  [Oltre Free Press](http://www.oltrefreepress.com/makers-meeting-levento-stavamo-tutti-aspettando/)
  and [Puglia StartApp](https://puglia-startapp-bari.blogautore.repubblica.it/2014/10/24/il-meeting-dei-makers-60-anni-di-cern-e-tedx-un-weekend-da-innovatori-in-puglia/)
  (24 October 2014).

### Demo videos

- **24 January 2014.** [Control house with brainwaves](https://www.youtube.com/watch?v=5TYFdThuBNQ)
- **27 January 2014.** [SmartChair: Voice Control](https://www.youtube.com/watch?v=AKUQYsBOu3M)
- **27 January 2014.** [SmartChair: Thought Control](https://www.youtube.com/watch?v=sMOjIHX3Hbs)
- **3 March 2014.** Two videos shot by Gianvito Rutigliano for Repubblica:
  [part one](https://www.youtube.com/watch?v=lalmm08tV_w) and
  [part two](https://www.youtube.com/watch?v=NbcmmdncCzg)

### Original 2014 materials

- [Project website](https://web.archive.org/web/20150102094047/http://www.blesciasw.it/smartchair/)
  on blesciasw.it (Web Archive copy from 2 January 2015): architecture, devices, videos and press
  coverage.
- [Project blog](https://thesmartchair.blogspot.com/) (January 2014): the arrival of the first
  wheelchair and the app's settings screen.

### Projects SmartChair grew out of

- **ThinkUino**, to control Arduino with your mind:
  [article on CodeProject](https://www.codeproject.com/Articles/567963/ThinkUino-Project)
  (26 March 2013, in English) and
  [article on Elettronica Open Source](https://it.emcelettronica.com/thinkuino-project-controlla-tuo-arduino-con-mente)
  (8 April 2013).
- **Loggy**, which used the same MindWave headset:
  [article on Elettronica Open Source](https://it.emcelettronica.com/loggy-project-digitalizza-tua-giornata)
  (12 June 2013).
