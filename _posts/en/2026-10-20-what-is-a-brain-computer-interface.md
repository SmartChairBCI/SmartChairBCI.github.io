---
ref: what-is-bci
title: "What is a Brain Computer Interface, explained simply"
description: "Neurons, electrodes and algorithms: how a thought becomes a command, no neuroscience degree required."
kind: explainer
tags: [bci, eeg]
---

A **Brain Computer Interface** (BCI) is a system that lets you control a device
**without using your muscles**, starting from the activity of the brain.

## 1. The brain is electric

When neurons talk to each other they produce tiny electric currents. When millions of neurons
work in sync, their signal becomes strong enough to be measured **from the outside, on the scalp**.
This technique is called **electroencephalography (EEG)**.

## 2. Listening to the signal

The electrodes of an EEG headset measure voltage differences of a few **microvolts**, that is,
millionths of a volt. The signal is extremely faint and full of noise: eye blinks,
jaw movements, the mains power in your home.

## 3. Recognising an intention

The heart of a BCI is the software that recognises **recurring patterns** in the signal. Some examples:

| Paradigm | What the user does | What the software looks for |
| --- | --- | --- |
| Motor imagery | *Imagines* moving a hand | Rhythm changes over the motor cortex |
| SSVEP | Looks at a flickering light | An oscillation at the same frequency |
| P300 | Waits for a rare stimulus | A peak about 300 ms after the stimulus |

## 4. From command to movement

Once the intention is recognised, the system sends a command to the device: a cursor,
a virtual keyboard or, in SmartChair's case, a **powered wheelchair**.

## It is not mind reading

A BCI does not *read your thoughts*. It only recognises a small number of patterns that the user
produces **voluntarily** after some training. It is a tool you learn to use,
a bit like learning to drive.

In upcoming journal entries we will look at each of these steps in detail.
