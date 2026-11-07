# SmartChair — smartchair.it

**Diario di ricerca aperto** sugli ausili per la disabilità motoria basati su Brain Computer Interface.
Il sito è costruito con [Jekyll](https://jekyllrb.com/), che GitHub Pages compila in automatico:
**scrivi in markdown, fai push su `main` e dopo circa un minuto il sito è aggiornato.**

> Abbattiamo le barriere del movimento attraverso la tecnologia aperta, rendendo
> l'autonomia e la condivisione scientifica accessibili a tutti.

## Come è organizzato

| Sezione | Italiano | Inglese | Contenuto |
| --- | --- | --- | --- |
| Home | `/` | `/en/` | Ultimi aggiornamenti e ricerche in corso |
| Ricerche | `/ricerche/` | `/en/research/` | Una pagina per ogni linea di ricerca, con fase e prossimi passi |
| Diario | `/diario/` | `/en/journal/` | Il blog: cronologia di tutte le voci, filtrabile |
| Chi sono | `/chi-sono/` | `/en/about/` | Presentazione e metodo di scienza aperta |
| Contattami | `/contatti/` | `/en/contact/` | Email, GitHub, social |

```
_posts/it/  _posts/en/         Voci del diario
_research/it/  _research/en/   Linee di ricerca
_config.yml                    Email, social, licenza, fasi della ricerca
_data/i18n.yml                 Testi dell'interfaccia in IT ed EN
_data/navigation.yml           Voci del menu
```

## Scrivere una voce del diario

Crea `_posts/it/AAAA-MM-GG-titolo.md`:

```markdown
---
ref: nome-voce            # identico nella versione inglese
project: smartchair       # facoltativo: il `ref` della ricerca a cui si riferisce
kind: experiment          # update | experiment | result | note | explainer
authors: [Antonio Blescia, Bones]   # facoltativo: senza, l'autore è quello di _config.yml
title: Titolo della voce
description: Una o due frasi di riassunto, mostrate nella cronologia.
tags: [eeg]
---

Il testo in **markdown**…
```

Poi crea la traduzione in `_posts/en/AAAA-MM-GG-title.md` con lo **stesso `ref`**.

- Con `project`, la voce compare anche nella pagina di quella ricerca, e la data
  dell'**ultimo aggiornamento** della ricerca si aggiorna da sola.
- Senza `project`, la voce compare come "Generale".
- Le voci con una data futura vengono pubblicate solo quando arriva quella data.

## Aggiornare lo stato di una ricerca

Apri `_research/it/nome.md` (e la versione inglese) e modifica:

```yaml
status: testing           # idea | review | design | prototype | testing | results
next_steps:
  - text: Confrontare elettrodi a secco e a gel
    done: true            # metti true quando hai finito quel passo
```

La barra delle fasi e il contatore dei passi completati si aggiornano da soli.

## Aggiungere una nuova ricerca

Crea `_research/it/nome.md` e `_research/en/nome.md`:

```markdown
---
ref: nome
order: 3                  # posizione nell'elenco
codename: Nome breve
title: Titolo descrittivo della ricerca
summary: Una frase di sintesi.
question: La domanda di ricerca a cui vuoi rispondere?
icon: chip                # headset | brain | chair | kite | app | chip
status: idea
started: 2026-11-01
license: MIT              # facoltativo
links:                    # facoltativo: repository, dataset, articoli…
  - label: Repository
    url: https://github.com/…
next_steps:
  - text: Primo passo
    done: false
---

Contesto, obiettivi, approccio, limiti… in markdown.
```

## Bones, lo scrivano del diario

In `.claude/agents/bones.md` c'è **Bones**, un agent di [Claude Code](https://claude.com/claude-code)
che scrive le voci del diario e le schede delle ricerche al posto tuo, in italiano e in inglese,
rispettando il formato descritto sopra.

```text
@bones trascrivi questi appunti come risultato per SmartChair: …
@bones scrivi una divulgazione sul paradigma P300, con fonti
@bones crea una nuova ricerca sul controllo con lo sguardo
```

Bones cita solo fonti che ha verificato, non inventa dati e lascia `[DA COMPLETARE: …]` dove
mancano informazioni. Ogni voce che scrive ha come autori Antonio Blescia e Bones. Non fa mai commit o push: rileggi, prova in locale e pubblica tu.

## Lingue

L'italiano vive alla radice (`/`), l'inglese sotto `/en/`. La lingua si ricava dalla cartella.
Due versioni dello stesso contenuto sono collegate da un **`ref`** identico: così il selettore
IT/EN porta alla traduzione giusta e vengono generati i tag `hreflang` per i motori di ricerca.

## Provare il sito in locale

```sh
bundle install                           # solo la prima volta (serve Ruby 3 o successivo)
bundle exec jekyll serve --livereload    # → http://localhost:4000
```

## Pubblicazione

Nelle impostazioni del repository, sotto **Settings → Pages**, imposta *Deploy from a branch*
→ `main` / `(root)` e attiva **Enforce HTTPS**. Il file `CNAME` contiene già `smartchair.it`.

## Licenze

- Testi del sito e del diario: CC BY 4.0 (configurabile in `_config.yml`)
- three.js (`assets/vendor/three/`): MIT
- Font Space Grotesk, Inter e JetBrains Mono (`assets/fonts/`): SIL Open Font License
