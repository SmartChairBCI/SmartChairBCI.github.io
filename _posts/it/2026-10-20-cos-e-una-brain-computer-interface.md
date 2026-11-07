---
ref: what-is-bci
title: "Cos'è una Brain Computer Interface, spiegato in modo semplice"
description: "Neuroni, elettrodi e algoritmi: come si trasforma un pensiero in un comando, senza bisogno di una laurea in neuroscienze."
kind: explainer
tags: [bci, eeg]
---

Una **Brain Computer Interface** (BCI), in italiano *interfaccia cervello-computer*, è un sistema
che permette di controllare un dispositivo **senza usare i muscoli**, a partire dall'attività
del cervello.

## 1. Il cervello è elettrico

Quando i neuroni comunicano tra loro producono minuscole correnti elettriche. Se milioni di neuroni
lavorano in sincronia, il loro segnale diventa abbastanza forte da essere misurato
**dall'esterno, sul cuoio capelluto**. Questa tecnica si chiama **elettroencefalografia (EEG)**.

## 2. Ascoltare il segnale

Gli elettrodi di una cuffia EEG misurano differenze di tensione di pochi **microvolt**, cioè
milionesimi di volt. Il segnale è debolissimo e pieno di disturbi: battiti delle palpebre,
movimenti della mascella, la rete elettrica di casa.

## 3. Riconoscere un'intenzione

Il cuore di una BCI è il software che riconosce **schemi ricorrenti** nel segnale. Alcuni esempi:

| Paradigma | Cosa fa l'utente | Cosa cerca il software |
| --- | --- | --- |
| Motor imagery | *Immagina* di muovere una mano | Variazioni del ritmo sulla corteccia motoria |
| SSVEP | Guarda una luce che lampeggia | Un'oscillazione alla stessa frequenza |
| P300 | Aspetta uno stimolo raro | Un picco circa 300 ms dopo lo stimolo |

## 4. Dal comando al movimento

Una volta riconosciuta l'intenzione, il sistema invia un comando al dispositivo: un cursore,
una tastiera virtuale oppure, nel caso di SmartChair, una **carrozzina elettrica**.

## Non è lettura del pensiero

Una BCI non *legge i pensieri*. Riconosce solo un numero ridotto di schemi che l'utente produce
**volontariamente** dopo un periodo di allenamento. È uno strumento che si impara a usare,
un po' come imparare a guidare.

Nelle prossime voci del diario vedremo nel dettaglio come funziona ciascuno di questi passaggi.
