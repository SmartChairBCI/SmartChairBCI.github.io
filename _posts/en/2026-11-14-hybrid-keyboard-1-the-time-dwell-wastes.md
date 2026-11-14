---
ref: kite-hybrid-keyboard-1
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Kite's hybrid keyboard (1/4): the time dwell wastes"
description: First of four parts on Kite's new gaze keyboard. The test bench that compares fixed dwell with a hybrid keyboard, the idea of counting time from the end of the saccade, the first real session with 19% wrong selections, the four rules derived from the errors and the replay that measures them.
tags: [eye-tracking, aac, virtual-keyboard, dwell-time, saccades, replay]
---

This is the **first of four parts** on the new gaze keyboard of [Kite](/en/research/kite/), my open
Augmentative and Alternative Communication (AAC) tool: a keyboard that no longer selects with dwell time
alone. Here I describe the test bench, the idea behind the hybrid keyboard, the first errors and how I
measured them.
[Part 2](/en/journal/hybrid-keyboard-2-language-as-information/) deals with language as information:
language models, different times for different letters, the corrector, phrases and voice.
[Part 3](/en/journal/hybrid-keyboard-3-the-pupil-bci-and-measures/) deals with the pupil, what I mean by
"hybrid BCI" and how the comparison is measured.
[Part 4](/en/journal/hybrid-keyboard-4-search-glances/) deals with search glances, the first cause of
error, and with the limits of the whole series.

In the [entry on Tobii Race](/en/journal/tobii-race-a-driving-game-to-put-the-4c-to-the-test/) I promised
to explore the literature for the new keyboard. I am keeping the promise in a slightly different way:
instead of a list of papers, I describe the keyboard that came out of it and the bench I measure it with.
The topics from that list that are not on the bench are picked up at the end, in "What I chose and what I
postponed".

## The test bench

The bench is called **tobii4c-hybridbci**. It is a GNU/Linux program written in Go, with an X11 window;
for now the repository is not public. It compares two ways of typing with the gaze, **on the same task
and with the same metrics**:

- **A, fixed dwell**: Kite's old keyboard. You fixate a key for 1 s and the key activates.
- **B, hybrid**: the new keyboard. The key activates shortly after the eye has stopped on it, with a time
  that depends on the letter.

The task is to copy five-word Italian sentences on an on-screen QWERTY keyboard with 27 keys: the 26
letters on three staggered rows, plus the space bar. Above it there is an editing bar with three
suggestions, **delete** and **speak**; in the first three sessions of 6 November it was not there yet.

The data come from the `tobii4c-linux` driver of the previous entries, in UDP packets in the T4CG v2
format, about 90 per second: gaze filtered by the firmware and unfiltered, pupils, eye position,
presence. The bench **only reads**: it sends no command to the tracker.

| | A, fixed dwell | B, hybrid |
| --- | --- | --- |
| When the count starts | when the gaze enters the key | at the end of the saccade that lands on the key |
| Which gaze it uses | filtered by the 4C firmware | unfiltered, to detect saccades and fixations |
| Time required | 1 s for every key | 120 to 700 ms, depending on the probability of the letter |
| Key area | fixed rectangles | grows invisibly towards likely keys ([part 2](/en/journal/hybrid-keyboard-2-language-as-information/)) |
| Corrector and suggestions | no | yes ([part 2](/en/journal/hybrid-keyboard-2-language-as-information/)) |
| Pupil | recorded | recorded and used to lengthen the times ([part 3](/en/journal/hybrid-keyboard-3-the-pupil-bci-and-measures/)) |

Every session is stored on disk, sample by sample. The numbers in this entry come from those files, from
the bench's README and from its code; I introduce the internal `replay` tool further on. The name
contains "BCI", but an eye tracker is not a
[Brain Computer Interface](/en/journal/what-is-a-brain-computer-interface/): why the bench is called that
way is explained in [part 3](/en/journal/hybrid-keyboard-3-the-pupil-bci-and-measures/).

## The baseline: condition A

Condition A is the fixed-dwell keyboard of the
[entry on dwell time](/en/journal/kite-gaze-typing-with-dwell-time/): there you will find the Midas touch
([Jacob, 1991](#references)), the trade-off between speed and errors, double letters and fatigue. I do
not repeat them. Here A is the yardstick: everything B gains or loses is measured against it.

> **On our test bench.** A reproduces the old keyboard in detail: 27 keys with 8% spacing between them,
> gaze filtered by the firmware, 1 s of dwell, exits of up to 100 ms that do not reset the count, blinks
> of up to 300 ms that pause it, and a repetition that requires another full second. In the first real
> session with the QWERTY layout, on 6 November, A made 70 selections without a single error, at
> **35.6 characters per minute** (char/min). The mean time on the key before activation was 1010 ms, and
> the mean time from one selection to the next was 1.68 s. A 1 s dwell would allow up to 60 keys per
> minute: the difference is the time needed to find the letter and bring the eye to it.

## What the eye does before it stops on a key

The fovea, saccades, fixations, microsaccades and the relationship between saccade amplitude, duration and
velocity (the *main sequence*) are covered in the
[entry on how the eye works](/en/journal/how-the-eye-works-and-gaze-tracking/). Here I add four
properties that that entry does not cover and that matter for a fast keyboard.

**Latency.** When a new target appears, the eye does not move at once: in healthy adults the reaction
time of a visually guided saccade is about 200 ms ([Vikesdal and Langaas, 2016](#references)). On a
keyboard the next target is often already known, so I take this as an order of magnitude. My reading is
that part of the time per letter lies here, before the jump, where no selection mechanism can act.

**Saccadic suppression.** Around a saccade, vision loses sensitivity selectively. For brief stimuli of low
spatial frequency defined by luminance, sensitivity starts to drop about 25 ms before saccade onset,
reaches its minimum at onset and returns to normal about 50 ms later. Fine detail remains visible, and
stimuli that differ only in colour are not suppressed, or hardly at all
([Binda and Morrone, 2018](#references)). I draw a simple principle from this: during the jump the
person is not reading the keys it crosses, so those keys must not accumulate time.

**The jump is not corrected in flight, and it often falls short.** Saccades usually do not land exactly
on the target. Falling short (*undershoot*) is more frequent than overshooting, and becomes more and more
frequent the longer the jump; a second, smaller saccade, called a **corrective** saccade, is then often
needed. In a 2013 study the primary saccade did not change with the visual information gathered during
the movement ([Tian et al., 2013](#references)).

**The corrective saccade comes early.** Becker and Fuchs ([1969](#references)) observed that corrective
saccades started after about 130 ms, both with the target visible and in the dark: too early to be guided
by what the eye sees. Hence the idea that primary and corrective saccades are programmed together. I
report this result through the summary by Tian and colleagues ([2013](#references)): I was not able to
read the original paper in full.

For a keyboard this means that, after a long jump, the eye can stop for a fraction of a second on the key
next to the intended one. A 1 s dwell does not notice; a 120 ms one does.

> **On our test bench.** According to the bench's notes, spontaneous fixations during work last between
> 133 and 344 ms (first and third quartile), with a median of 211 ms. In the real sessions, saccades of
> more than 8° towards the key that is then selected cover a median 93–95% of the distance (gain
> 0.93–0.95, interquartile range 0.15–0.18). About half of the first landings fall on the neighbouring
> key, almost always on the side the gaze comes from, and stay there for about 200 ms before the
> corrective saccade: much longer than B's minimum of 120 ms. The opposite comparison also holds: 120 ms
> is less than the median spontaneous fixation, and that is why search glances are the main risk
> ([part 4](/en/journal/hybrid-keyboard-4-search-glances/)).

## The 4C in numbers

The pupil centre–corneal reflection method, accuracy and precision, sampling rate and latency are
explained in the [entry on the eye](/en/journal/how-the-eye-works-and-gaze-tracking/); the driver and its
measurements without a person in the
[entry of 11 November](/en/journal/tobii-4c-on-linux-putting-the-driver-to-the-test/). Here I only report
the bench's numbers, with a person in front of the tracker.

> **On our test bench.**
>
> | Quantity | Value | Where it comes from |
> | --- | --- | --- |
> | Distance from the eyes to the screen | about 70 cm | bench notes; medians of 72–78 cm in the files of the three sessions of 6 November |
> | Screen | 700 × 390 mm, 1920 × 1080 pixels | session files |
> | Rate | 90.0–90.1 samples per second | count on the three files; on 11 November, with nobody in front, the driver gave 89.2 Hz |
> | Precision, unfiltered gaze | 0.27° | bench notes |
> | Precision, gaze filtered by the firmware | 0.19° | bench notes |
> | Delay of the filtered gaze | about 30 ms | bench notes |
> | Valid gaze, valid pupil | 88%, 83% of samples | bench notes |
>
> Precision is the root mean square (RMS) of the differences between consecutive samples while the eye is
> still. At 90 Hz two samples are 11 ms apart: a difference of 0.27° corresponds to an apparent velocity
> of about 24 °/s, produced by noise alone. The firmware filter reduces the noise but makes the gaze
> arrive about 30 ms later. This is why B detects saccades and fixations on the unfiltered gaze, while A
> uses the filtered one, like the old keyboard.
>
> Bones rechecked these numbers on the files of the three sessions of 6 November, with a quick
> calculation. The delay matches (2–3 samples, 22–33 ms); valid gaze (98–99.7%) and precision (about
> 0.19° and 0.15°) come out better, and the fixation durations do not match. The notes must refer to
> another recording. [DA COMPLETARE: which recording produced the numbers in the bench notes (88% valid
> gaze, 83% valid pupil, precision 0.27° and 0.19°, fixations of 133–344 ms) and how long it lasted.]

## Detecting saccades and fixations in the signal

The tracker does not say "this is a saccade now": it sends points, one every 11 ms. Salvucci and Goldberg
([2000](#references)) sorted the algorithms that separate jumps from pauses into three families:

- **velocity-based**: the points of a fixation move slowly, those of a saccade fast. The simplest is
  **I-VT** (*identification by velocity threshold*): above a velocity threshold it is a saccade, below it
  a fixation. The same family includes **I-HMM**, a probabilistic two-state model;
- **dispersion-based**: the points of a fixation stay close together. **I-DT** (*identification by
  dispersion threshold*) calls a fixation a window of minimum duration in which the points stay within a
  certain dispersion, so it has to wait for the window to fill;
- **area-based**: only the points inside areas of interest decided in advance are counted (**I-AOI**).

Tobii Race uses a velocity classifier with fixed thresholds
([entry on the game](/en/journal/tobii-race-a-driving-game-to-put-the-4c-to-the-test/)). But noise
changes with the tracker and with the person: a threshold that is too low mistakes noise for saccades,
one that is too high misses small saccades.

Nyström and Holmqvist ([2010](#references)) propose to **derive the threshold from the data**. You start
from a value between 100 and 300 °/s; you compute the mean and standard deviation of the velocities below
the threshold, and the new threshold becomes the mean plus six standard deviations; you repeat until it
changes by less than 1 °/s. Saccade onset is searched for with a lower threshold, the mean plus three
standard deviations; the offset with a threshold that also takes into account the noise just before the
saccade. The same algorithm detects **glissades**, small oscillations at the end of the saccade, which
the authors find in about half of the saccades.

Finally, velocity must be measured in degrees of visual angle per second, not in centimetres per second:
the same centimetre on the screen is about 0.95° at 60 cm and about 0.72° at 80 cm. The conversion is
explained in the [entry on the eye](/en/journal/how-the-eye-works-and-gaze-tracking/).

> **On our test bench.** The detector is an I-VT with the adaptive threshold of Nyström and Holmqvist,
> computed in real time, sample by sample:
>
> 1. Velocity is in degrees per second, computed with the real eye position provided by the driver, on
>    the **unfiltered** gaze.
> 2. It is measured over two intervals, 22 ms, instead of one: the noise weighs half as much, and a 30 ms
>    saccade still exceeds the threshold.
> 3. The peak threshold is the mean plus six standard deviations of the velocity during fixations. Mean
>    and variance are not recomputed over the whole recording but updated continuously, with a memory of
>    about 2 s. The threshold stays between 60 and 300 °/s; at start-up it is 100 °/s.
> 4. The saccade ends when the velocity drops below the mean plus three standard deviations. The new
>    fixation starts at that instant, and that is where B starts counting.
> 5. Microsaccades below 1° do not break the fixation; a gap of more than 100 ms in the data closes it. A
>    fixation becomes **stable** after at least three samples with a dispersion within 1°, and only then
>    can B select.
>
> An automated test builds a synthetic 10° saccade lasting 43 ms, with 0.25° of noise. The detector finds
> it exactly once, starts the fixation **within 23 ms** of the true landing, about two samples, and
> declares it stable within 60 ms. With noise from 0.15° to 0.5° for 10 s it finds no false saccades.
> Bones re-ran these tests on 14 November: they pass. The 23 ms, however, hold on synthetic data: on real
> data nobody knows the true landing.
>
> On the real 4C the threshold settled at the **minimum of 60 °/s**, against peaks of more than 300 °/s:
> in the files of the three sessions of 6 November it is 60 °/s in over 95% of fixation samples. My
> reading is that, with this person and this tracker, the noise is low enough to leave the adaptive part
> inactive: in practice it is an I-VT at 60 °/s. The adaptation should matter with noisier signals, to be
> checked with other people. The detector does not distinguish glissades and has no class for smooth
> pursuit: it only knows fixation, saccade and lost gaze.

## The central idea: counting from the end of the saccade

### The state of the art, in brief

A 2002 review already covered twenty years of systems for typing with the gaze
([Majaranta and Räihä, 2002](#references)). According to Mott and colleagues ([2017](#references)),
dwell-based keyboards remain the most widely used in practice. The alternatives fall into three groups.

- **Adaptive dwell.** Mott and colleagues change the dwell of each key according to the probability that
  it is the next one and to its position: unlikely keys become slower, likely ones faster, and the
  minimum time of likely keys decreases little by little as the user types, "cascading", so as not to
  break the rhythm. With 17 people without disabilities, over eight sessions, their keyboard reached on
  average 12.39 words per minute (WPM), against 10.62 with fixed dwell; with five people with amyotrophic
  lateral sclerosis (ALS), 9.51 WPM. The authors sum up the limit of fixed dwell this way: however fast
  the eye moves from one key to the next, it must stay still until the time is up.
- **Dwell-free typing** ([Kristensson and Vertanen, 2012](#references)) and **continuous interfaces** such
  as Dasher ([Ward and MacKay, 2002](#references)), described with their numbers in the
  [entry on the eye](/en/journal/how-the-eye-works-and-gaze-tracking/).
- **Other channels** alongside the gaze, such as the head or large language models: I discuss them in
  "What I chose and what I postponed".

### Where the time of a letter goes

Before changing the mechanism I looked at where the time goes. In the first real session with the QWERTY
layout, described further on, the summary of the whole session gives, for each selection:

| | A, fixed dwell | B, first version |
| --- | ---: | ---: |
| Mean time between two selections | 1.68 s | 0.86 s |
| of which still on the key before activation | 1.01 s | 0.25 s |
| remainder: finding the letter, moving the eye, landing | 0.67 s | 0.61 s |

The third row is a subtraction. The time outside the dwell is almost the same in the two conditions: my
reading is that B's gain comes from the time spent still on the key, not from a quicker eye. It is a
single session, with a single person, and column B also includes the wrong selections: I take it as an
indication.

### The idea

In A the second starts when the filtered gaze enters the key. In B the count starts at the **end of the
saccade** that brings the eye onto the key, detected on the unfiltered gaze, and the time required is
short.

Why exactly there: the end of the saccade is the moment the eye arrives and starts looking at the key.
What happens before, the latency and the flight, says nothing about the intention to select that key.
Moreover, by using the unfiltered gaze, B does not pay the roughly 30 ms of the firmware filter. In the
sources I read I did not find a direct comparison between the two ways of starting the count; that does
not mean one does not exist.

The price is obvious. With such short times the Midas touch comes back at the scale of a single
fixation: a search fixation on a likely key can be enough to trigger it. Search glances are the natural
limit of this approach, and they have a part of their own,
[part 4](/en/journal/hybrid-keyboard-4-search-glances/).

> **On our test bench.**
>
> | Parameter | Value |
> | --- | --- |
> | Minimum time, very likely letter (`-tmin`) | 120 ms |
> | Maximum time, unlikely letter (`-tmax`) | 700 ms |
> | Time between the two extremes | depends on the probability of the letter: [part 2](/en/journal/hybrid-keyboard-2-language-as-information/) |
> | Gaze ambiguous between two keys | the time gets longer if the probability of the key being looked at drops below 0.95 |
> | Condition for activation | stable fixation, and the required time elapsed since the end of the saccade |
> | Pupil | can lengthen all times by up to 50%: [part 3](/en/journal/hybrid-keyboard-3-the-pupil-bci-and-measures/) |

## The first real session

The first session with the QWERTY layout took place on **6 November at 11:57**: one person at about
70 cm from the screen, five blocks of five words. The first is a B block launched on its own; then come
the pupil calibration and the four blocks of the protocol, in the order A, B, B, A. The task was the one
I call "strict": a wrong letter does not enter the text, it is counted as an error and the right one has
to be selected. B was the **first version**: none of the rules described below, a small language model of
544 words, repetition of a letter after 700 ms on the same key, and pupil modulation of the times
switched on.

The numbers that follow are the **summary of the whole session**, that is, of all five blocks, as the
bench adds them up. These are the blocks on which the error analysis and the replay were built.

| Whole session | A, fixed dwell | B, first version |
| --- | ---: | ---: |
| Blocks | 2 | 3 |
| Selections | 70 | 123 |
| Wrong selections | 0 | 23 (19%) |
| Speed | 35.6 char/min | 56.9 char/min |
| Mean time on the key before activation | 1010 ms | 247 ms |

Over the whole session B was about 60% faster, but **one selection in five was wrong**: you cannot
communicate like that. The initial B block, the one outside the protocol, alone contains 10 of the 23
errors. Counting only the four blocks of the protocol the numbers change: the comparison between A and B
in those blocks, the design hypothesis on speed and how it is put to the test are in
[part 3](/en/journal/hybrid-keyboard-3-the-pupil-bci-and-measures/). It is still one person and one
session: none of these numbers confirms a hypothesis.

Shortly before, at 11:45, there had been a shorter session with the keys in alphabetical order: A at
24.8 char/min with 1 error out of 34 selections, B at 39.1 char/min with 9 errors out of 38. I mention it
because it is part of the replay.

### Why it made mistakes

The bench's notes report a reconstruction of the 23 errors made from the recorded samples:

| Cause | Errors | What happened |
| --- | ---: | --- |
| Search glances | 10 | the gaze stops on a key while looking for the letter, and the key fires: this is the topic of [part 4](/en/journal/hybrid-keyboard-4-search-glances/) |
| Short landing | 6 | after a long saccade the eye lands on the neighbouring key and stays there for about 200 ms before the corrective saccade; the selector fired first |
| Repeated or slipped letters | 5 | in 4 cases staying on the key for more than 700 ms produced an unwanted double letter; in 1 the gaze slipped onto the next key within the same fixation |
| Predictive expansion | 2 | gaze on the edge of, or inside, the right key, assigned to the more likely neighbour: I discuss it in [part 2](/en/journal/hybrid-keyboard-2-language-as-information/) |

Five of the ten search glances came in a chain, right after another error.

## The four rules

Four rules came out of the causes of error. Each one is a parameter of the selector, and three can also
be set from the command line.

1. **One selection per fixation.** After an activation no other key can fire until the eye makes a
   saccade: a gaze that stays still, or slips onto the neighbouring key, does not type. It addresses
   slipped letters.
2. **Double letters according to the prediction.** To repeat a letter while staying on the key you need
   0.7 s if the double letter is likely at that point in the word, like the "s" in the Italian
   "passare", and up to 1.5 s if it is not (`-repeat-min`, `-repeat`). Leaving the key and coming back,
   the double letter is immediate. It addresses unwanted double letters.
3. **Waiting for the corrective saccade.** After a saccade of more than 8°, the bench estimates the
   probability that the eye was aiming at the key it landed on, rather than at a likely key further away
   in the same direction; to do so it uses the measured gain, 0.94 on average. If that probability is
   below 0.8, the key must wait at least 280 ms (`-land`), the time within which the corrective saccade
   usually starts. An example from the tests: starting from Q and landing on I, with O likely, the
   probability that the eye was aiming at I is 0.20, and I waits 280 ms instead of 182. Landing on O, there
   is no wait.
4. **Caution after an error.** After a wrong selection, the next one requires at least 500 ms
   (`-caution`). It serves to break chains of errors while the person looks for the right key. The bench
   knows that a selection is wrong in copy tasks, or when the person deletes it.

## The replay

### What it is

Testing each rule with a new session would be slow, and every session differs from the previous one. The
`replay` tool **replays the recorded sessions** through the saccade detector and the selector, with any
parameters you like: the gaze is the real, recorded one; the selector is the new one.

With the parameters of the time, the replay repeats the choices the bench made live. The three sessions
of 6 November with the strict task, at 11:45, 11:57 and 12:45, contain 198 selections in the B blocks:
the replay reproduces **197** of them identically, and the difference comes from rounding in the samples
file.

### Why it is not an experiment

That day the person had the system of the time in front of them, and their gaze reacted to what they
saw: with a different selector they would have looked differently. To stay in sync with them, the replay
follows the keys they typed without mistakes. If the new selector does not activate a letter before they
leave the key, the letter counts as **late** by the missing time, because live they would have kept
looking at it: it is correct, but arrives later. Letters anticipated by more than one second are left
out of the mean delay, because there the replay has lost sync. The replay therefore says whether a rule
would have avoided the recorded errors and how much time it would have cost, not how the person would
have adapted.

### The rules, one at a time

The table adds the rules one at a time, starting from the first version. Bones redid the calculation
with the tool on 14 November, on the same data from the B blocks. The last column gives how much later,
on average, each correct letter arrives than with the first version.

| Variant | Errors | Accuracy | Late letters | Delay per letter |
| --- | ---: | ---: | ---: | ---: |
| first version | 37 | 81.4% | 0 | — |
| + one selection per fixation | 35 | 82.1% | 0 | 0 ms |
| + waiting for the corrective saccade | 34 | 82.5% | 0 | +2 ms |
| + double letters according to the prediction | 25 | 86.5% | 0 | +2 ms |
| + caution after an error | 19 | 89.4% | 4 | +24 ms |
| + large Italian lexicon (current) | 20 | 88.9% | 16 | +33 ms |

How I read it:

- **Double letters and caution do almost all the work**: together they remove 15 of the 37 errors.
  Caution is the most expensive rule, about 22 ms per letter.
- **The first two rules remove few errors**, but almost for free.
- **The large lexicon makes things slightly worse**: one more error and about 9 ms per letter. This is
  expected: the 544-word model only knew the words of the sentences to copy, so it was more favourable
  than it should have been. The large lexicon has about 140,000 words and I describe it in
  [part 2](/en/journal/hybrid-keyboard-2-language-as-information/).
- The remaining errors are mostly search glances
  ([part 4](/en/journal/hybrid-keyboard-4-search-glances/)).

### The discarded variants

The replay is also for saying no. These variants were tried and discarded because they make things worse
or cost more than they give. Next to each I report the replay of 14 November on the same data, with the
delay measured as in the table. The term of comparison is the current version: 20 errors and +33 ms.

- **A narrower spread around the key centre, 0.8° instead of 1.6°.** The final gaze is spread by about
  0.65° around the centre, so 0.8° would seem more correct. But with 1.6° a gaze near the edge lengthens
  the required time, and this caution at the edges avoids errors. With 0.8°: 22 errors and +51 ms.
- **A larger core**, that is, the central part of each key that is never given up to the neighbours
  ([part 2](/en/journal/hybrid-keyboard-2-language-as-information/)): at 80% instead of 60%, 20 errors
  and +35 ms. No gain.
- **A fixed wait after every long saccade, without the landing model**: 21 errors and +79 ms. The same
  errors, with more than twice the delay.
- **A higher minimum time.** With `-tmin` at 150 ms instead of 120 the errors stay at 20 and the delay
  rises to +55 ms: about 22 ms per letter more than the current version, without a single error less.
- **An implicit recalibration of the systematic offset**, which in the notes is about 0.45° to the right
  and upwards: in fast selections the estimate is contaminated by short landings. This variant is no
  longer in the replay, so it could not be rechecked.

Today's replay, on the other hand, does **not** reject three variants. Waiting for the corrective saccade
for 350 ms instead of 280, or an unlikely double letter at 2 s instead of 1.5, give 18 errors instead of
20 with the same delay; a core at 40% gives the same errors with +25 ms. These are differences of one or
two errors out of about 180 selections: too small to change the values on the basis of three sessions,
but worth trying again.

### With the fourth session

At 13:35 a fourth session arrived, in which errors enter the text and are corrected. There the replay is
only approximate, because it cannot reconstruct the suggestions the person saw: it reproduces 345
selections out of 387. Anyone running `replay` on all the sessions today therefore gets other numbers,
but the same direction: from the first version to the current one, the errors in the B blocks fall from
60 to 31 and accuracy rises from 84.1% to 91.0%.

## The first live block with the rules

At **12:45** on the same day the first B block with the four rules switched on was recorded: about half a
minute of typing, at **58.9 char/min** with an accuracy of **89.2%** (4 errors out of 37 selections),
against 81.3% over the whole 11:57 session. The mean time on the key before activation was 292 ms,
against 247 ms for the first version in that session: this goes in the direction of the cost that the replay attributes to the rules, but with a
single block I cannot separate it from the other differences, such as the sentence to copy.

It still used the small language model. It indicates that the rules also work when the person has them
in front of their eyes, but it does not prove it.

## What I chose and what I postponed

The entry on Tobii Race listed eight topics to explore. The Midas touch, adaptive dwell, dwell-free
typing and Dasher are in the previous sections. The other four are not on today's bench: for each one I
say what it is and why, for now, it has been left out.

**Smooth pursuit.** You select an object by following a moving target with your eyes: instead of
estimating the point being looked at, the system compares the movement of the eyes with that of the
objects on the screen, and it can be used without a preparation phase such as calibration
([Vidal et al., 2013](#references)). The bench, however, compares two ways of selecting **static keys**
on the same QWERTY layout: smooth pursuit would require moving targets, that is, a different keyboard,
and a detector that recognises smooth pursuit, which mine does not have. For now it stays out of the
comparison.

**The One Euro filter.** It is a low-pass filter that adapts to speed: it smooths a lot when the signal
is still and little when it moves fast ([Casiez et al., 2012](#references)). I use it in Tobii Race. On
the bench I made a different choice: A uses the gaze already filtered by the firmware, like the old
keyboard; B detects saccades on the unfiltered gaze and chooses the key with the mean of the fixation's
samples, which restarts from zero at every saccade. Whether a One Euro filter would do better than this
mean I have not measured: for now it is not there.

**Gaze and head together.** Špakov and colleagues ([2014](#references)) use the gaze to get close to the
target and small head movements, derived from the position of the eyes in the tracker's camera, to
correct the point. Precision improved without lengthening the times; in some cases participants pointed
almost three times closer to the centre of the target than with the gaze alone (7 versus 19 pixels). On
the bench there is no head: the driver is started with `-headpose off` because, according to the notes,
head pitch is not needed here, and turning it off saves processor time and avoids the rare frames lost
with the image stream. The bench already reads the eye position, but only to convert distances into
degrees. For now the comparison concerns gaze alone; it remains to be seen how much head movement the
people Kite is meant for have.

**Prediction with large language models (LLMs).** In SpeakFaster, Cai and colleagues
([2024](#references)) have users type only the initial of each word; an LLM trained for the purpose
proposes the full sentences, taking the conversation into account. In simulation it saved 57% more motor
actions than traditional predictive keyboards; with two people with ALS who type with their gaze, the
speed was 29–60% above their baselines. The model runs on cloud servers, so an Internet connection is
needed. On the bench, prediction uses an Italian lexicon with a prefix model and a phrase model based on
word n-grams, written in Go and computed locally: with 3000 phrases a proposal costs about 5 µs. The voice
is also synthesised locally. I have not tried an LLM, local or remote, for now. The bench's models are
the topic of [part 2](/en/journal/hybrid-keyboard-2-language-as-information/).

## Limits of this part

- **One person, one tracker, one computer**, as in the previous entries.
- **Little data**: five blocks in the first QWERTY session, a single block with the rules.
- **The strict task** measures selections, not the text a person would actually send.
- **The replay is not an experiment**: it does not say how the person would have adapted.
- **The reconstruction of the causes** comes from the bench notes and has not been redone by a second
  person.
- **The detector's 23 ms** are measured on a synthetic saccade.
- **Some numbers in the notes** do not match the session files.

## Next steps

1. Record the full protocol, with alternating A and B blocks and the four rules, over several sessions:
   how, and with which metrics, is described in
   [part 3](/en/journal/hybrid-keyboard-3-the-pupil-bci-and-measures/).
2. Try again on new data the variants that today's replay does not reject: corrective wait at 350 ms,
   unlikely double letter at 2 s, core at 40%.
3. Find out which recording the 4C numbers in the bench notes come from.

The next entry is [part 2](/en/journal/hybrid-keyboard-2-language-as-information/): where the different
times for different letters come from, that is, language as information.

> **Disclaimer.** The tobii4c-hybridbci bench is an experimental tool, not a certified medical device nor
> an assistive device, and Kite is an experimental project. The driver is unofficial software that uses
> the tracker in ways the manufacturer did not foresee. The recorded sessions contain the text written by
> whoever took part in them: here I publish only aggregate numbers. Trials with people require informed
> consent and, where needed, the approval of an ethics committee. Anyone who depends on an AAC tool to
> communicate should always have a backup.

## References

1. Becker W., Fuchs A. F. (1969). Further properties of the human saccadic system: eye movements and
   correction saccades with and without visual fixation points. *Vision Research*, 9(10), 1247–1258.
   [doi:10.1016/0042-6989(69)90112-6](https://doi.org/10.1016/0042-6989(69)90112-6)
2. Binda P., Morrone M. C. (2018). Vision during saccadic eye movements. *Annual Review of Vision
   Science*, 4, 193–213.
   [doi:10.1146/annurev-vision-091517-034317](https://doi.org/10.1146/annurev-vision-091517-034317).
   [Open access version](https://arpi.unipi.it/bitstream/11568/931022/2/BindaMorrone_ARvisionscience_fullpdf.pdf)
3. Cai S., Venugopalan S., Seaver K., Xiao X., Tomanek K., Jalasutram S., Morris M. R., Kane S.,
   Narayanan A., MacDonald R. L., Kornman E., Vance D., Casey B., Gleason S. M., Nelson P. Q.,
   Brenner M. P. (2024). Using large language models to accelerate communication for eye gaze typing
   users with ALS. *Nature Communications*, 15, 9449.
   [doi:10.1038/s41467-024-53873-3](https://doi.org/10.1038/s41467-024-53873-3) (open access on
   [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11530652/))
4. Casiez G., Roussel N., Vogel D. (2012). 1 € filter: a simple speed-based low-pass filter for noisy
   input in interactive systems. *Proceedings of the SIGCHI Conference on Human Factors in Computing
   Systems (CHI '12)*, 2527–2530.
   [doi:10.1145/2207676.2208639](https://doi.org/10.1145/2207676.2208639)
5. Jacob R. J. K. (1991). The use of eye movements in human-computer interaction techniques: what
   you look at is what you get. *ACM Transactions on Information Systems*, 9(2), 152–169.
   [doi:10.1145/123078.128728](https://doi.org/10.1145/123078.128728)
6. Kristensson P. O., Vertanen K. (2012). The potential of dwell-free eye-typing for fast assistive
   gaze communication. In *Proceedings of the Symposium on Eye Tracking Research and Applications
   (ETRA '12)*, 241–244. ACM. [doi:10.1145/2168556.2168605](https://doi.org/10.1145/2168556.2168605).
   [Open access version](https://www.keithv.com/pub/dwellfree/kristensson-dwell-free.pdf)
7. Majaranta P., Räihä K.-J. (2002). Twenty years of eye typing: systems and design issues. In
   *Proceedings of the Symposium on Eye Tracking Research & Applications (ETRA '02)*, 15–22. ACM.
   [doi:10.1145/507072.507076](https://doi.org/10.1145/507072.507076)
8. Mott M. E., Williams S., Wobbrock J. O., Morris M. R. (2017). Improving dwell-based gaze typing
   with dynamic, cascading dwell times. *Proceedings of the 2017 CHI Conference on Human Factors in
   Computing Systems (CHI '17)*, 2558–2570.
   [doi:10.1145/3025453.3025517](https://doi.org/10.1145/3025453.3025517).
   [Open access version](https://faculty.washington.edu/wobbrock/pubs/chi-17.02.pdf)
9. Nyström M., Holmqvist K. (2010). An adaptive algorithm for fixation, saccade, and glissade detection
   in eyetracking data. *Behavior Research Methods*, 42(1), 188–204.
   [doi:10.3758/BRM.42.1.188](https://doi.org/10.3758/BRM.42.1.188)
10. Salvucci D. D., Goldberg J. H. (2000). Identifying fixations and saccades in eye-tracking
    protocols. *Proceedings of the Symposium on Eye Tracking Research & Applications (ETRA '00)*,
    71–78. [doi:10.1145/355017.355028](https://doi.org/10.1145/355017.355028)
11. Špakov O., Isokoski P., Majaranta P. (2014). Look and lean: accurate head-assisted eye pointing.
    *Proceedings of the Symposium on Eye Tracking Research and Applications (ETRA '14)*, 35–42.
    [doi:10.1145/2578153.2578157](https://doi.org/10.1145/2578153.2578157).
    [Open access version](https://homepages.tuni.fi/oleg.spakov/publications/Spakov_ETRA_14a.pdf)
12. Tian J., Ying H. S., Zee D. S. (2013). Revisiting corrective saccades: role of visual feedback.
    *Vision Research*, 89, 54–64.
    [doi:10.1016/j.visres.2013.07.012](https://doi.org/10.1016/j.visres.2013.07.012) (open access text on
    [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3784029/))
13. Vidal M., Bulling A., Gellersen H. (2013). Pursuits: spontaneous interaction with displays based on
    smooth pursuit eye movement and moving targets. *Proceedings of the 2013 ACM International Joint
    Conference on Pervasive and Ubiquitous Computing (UbiComp '13)*, 439–448.
    [doi:10.1145/2493432.2493477](https://doi.org/10.1145/2493432.2493477)
14. Vikesdal G. H., Langaas T. (2016). Saccade latency and fixation stability: repeatability and
    reliability. *Journal of Eye Movement Research*, 9(2), 3, 1–13.
    [doi:10.16910/jemr.9.2.3](https://doi.org/10.16910/jemr.9.2.3) (open access)
15. Ward D. J., MacKay D. J. C. (2002). Fast hands-free writing by gaze direction. *Nature*, 418(6900),
    838. [doi:10.1038/418838a](https://doi.org/10.1038/418838a) (preprint on
    [arXiv:cs/0204030](https://arxiv.org/abs/cs/0204030))
