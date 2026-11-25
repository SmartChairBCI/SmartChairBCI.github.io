---
ref: kite-hybrid-keyboard-studies
project: kite
kind: note
authors: [Antonio Blescia, Bones]
title: "Kite, the hybrid keyboard: the studies on saccades, prediction, pupil and autocorrect"
description: The theoretical basis of the four mechanisms of Kite's new gaze keyboard. For each one, what the literature says, which choice I derived from it in the test bench and how it could improve typing compared with the old fixed 1 s dwell.
tags: [eye-tracking, aac, virtual-keyboard, saccades, prediction, pupillometry, autocorrect]
---

In the [entry on Tobii Race](/en/journal/tobii-race-a-driving-game-to-put-the-4c-to-the-test/#what-i-take-to-kite-the-topics-to-explore)
I listed the topics from the literature that I wanted to explore for the new gaze keyboard of
[Kite](/en/research/kite/), my open Augmentative and Alternative Communication (AAC) tool. I promised
to cover them in the next entry. This is that entry, for the four topics that actually made it into
the new keyboard: **saccades**, **prediction**, **pupil** and **autocorrect**.

For now the new keyboard lives in a test bench. It is a Linux program
that reads the Tobii Eye Tracker 4C through my driver, at 90 samples per second, and puts the old
keyboard and the new one on the same task. The new one is "hybrid" in the sense that it does not rely
on fixation time alone: it combines eye movement, a model of the Italian language and pupil diameter.

This entry is a study note and **contains no measurements**. For each topic I describe three things:

1. **the study**: what the literature says, with the conditions under which the results were obtained;
2. **the choice in the bench**: what I derived from it, with the parameters as they are written in the
   code;
3. **what could change** compared with the old fixed 1 s dwell keyboard, point by point against its
   limitations. These are hypotheses to be tested, not results.

I have archived the technical description of the hybrid keyboard on Zenodo, the open research
repository run by CERN, which assigns every deposited document a permanent identifier, the DOI (Digital
Object Identifier): [doi:10.5281/zenodo.24282465](https://doi.org/10.5281/zenodo.24282465).

## What I take as known

I have already explained some of the basics, and here I only refer back to them:

- how the eye moves, that is fixations, saccades, microsaccades, drift and blinks, is in the
  [entry on the eye](/en/journal/how-the-eye-works-and-gaze-tracking/#how-the-eye-moves);
- the Midas touch and dwell are in the same entry, under
  [Dwell time and the Midas touch](/en/journal/how-the-eye-works-and-gaze-tracking/#dwell-time-and-the-midas-touch);
- accuracy, precision and key size in degrees are under
  [Accuracy and precision](/en/journal/how-the-eye-works-and-gaze-tracking/#accuracy-and-precision)
  and [From degrees to centimetres](/en/journal/how-the-eye-works-and-gaze-tracking/#from-degrees-to-centimetres-how-large-to-make-the-keys);
- words per minute (WPM), keystrokes per character and error rates are under
  [How to measure a gaze keyboard](/en/journal/how-the-eye-works-and-gaze-tracking/#how-to-measure-a-gaze-keyboard);
- the pupil, which responds to light and to mental effort, is under
  [Pupil diameter](/en/journal/how-the-eye-works-and-gaze-tracking/#pupil-diameter);
- the old keyboard and its limitations are in the
  [entry on dwell time](/en/journal/kite-gaze-typing-with-dwell-time/#limitations);
- the fixed-threshold eye movement classifier is in the entry on Tobii Race, under
  [The gaze: filter, reticle, eye movements](/en/journal/tobii-race-a-driving-game-to-put-the-4c-to-the-test/#the-gaze-filter-reticle-eye-movements).

## 1. Saccades: counting time from when the eye lands

### The study

**Thresholds that adapt to noise.** The simplest way to separate saccades from fixations is a velocity
threshold: above it is a saccade, below it is a fixation. This is the I-VT family of algorithms
(*velocity-threshold identification*), which I use in Tobii Race with fixed thresholds. Its weak point
is that the right threshold depends on the noise, and the noise changes with the tracker, the person
and the session.

Nyström and Holmqvist proposed letting the data compute the threshold themselves
([Nyström and Holmqvist, 2010](#references)). According to the description also given by Voloh and
colleagues ([Voloh et al., 2020](#references)), the procedure is as follows:

1. start from a provisional peak threshold, between 100 and 300 °/s;
2. take the samples slower than the threshold, which are almost all fixation samples, and compute the
   mean and standard deviation of their velocity;
3. the new peak threshold is the mean plus six standard deviations;
4. repeat until the threshold changes by less than 1 °/s.

The start of the saccade is then searched for with a lower threshold. According to the authors, a
threshold like this makes detection less sensitive to noise and avoids having the analyst choose the
parameters. They also point out **glissades**, small wobbles at the end of saccades: in their data
they appeared in about half of the saccades and lasted about 24 ms on average. Whoever designs an
algorithm has to decide whether to assign them to the saccade or to the fixation.

**Thinking in fixations.** Jacob turned the raw stream of the tracker into discrete events, as is done
with the keys of a keyboard: the start, the continuation every 50 ms and the end of each fixation
([Jacob, 1991](#references)). He ignored the samples during saccades, because they say nothing useful
for the dialogue with the computer. His recognizer declared a fixation when the gaze stayed within
about 0.5° for 100 ms, and took the mean of the samples as its position.

**The eye falls short.** Visually guided saccades towards a target tend to fall short (*undershoot*)
by about 10% of the distance. A second saccade, called a corrective saccade, completes the journey
([Harris, 1995](#references)). Harris showed with a simulation that, when the saccadic error has a
standard deviation of about 10% of the distance, the optimal gain of the first saccade, that is the
fraction of the distance covered, is between 0.93 and 0.97. His interpretation is that falling slightly
short reduces the total time spent in flight, that is without clear vision.

Tian and colleagues studied corrective saccades in nine healthy adults, with target steps of 10°, 20°
and 25° and a scleral search coil sampled at 1000 Hz ([Tian et al., 2013](#references)):

- 55% of primary saccades were followed by a corrective saccade;
- an error of around −10% was almost always corrected;
- with the target visible, the median time between the end of the primary saccade and the start of
  the corrective saccade was 251 ms; for errors above 5° it stayed around 130 ms;
- the authors note that undershoot becomes more frequent with larger saccades.

### The choice in the bench

The bench's saccade detector follows the idea of Nyström and Holmqvist, adapted to real time:

| Element | Value in the code | Reason |
| --- | --- | --- |
| Velocity | in °/s, from the eye position provided by the tracker, over two intervals (about 22 ms at 90 Hz) | degrees do not depend on the distance from the screen; two intervals halve the noise compared with one |
| Peak threshold | mean + 6 standard deviations of the velocity during fixation, between 60 and 300 °/s; 100 °/s at start-up | the saccade starts when the velocity exceeds it; the start is dated to the previous sample |
| End threshold | mean + 3 standard deviations, between 15 °/s and 80% of the peak threshold | the saccade ends when the velocity drops below this threshold, which is lower than the peak |
| Noise estimate | continuous, with a 2 s exponential moving average over the fixation samples slower than the end threshold | it adapts while the person types |
| Microsaccades | a movement below 1° does not open a new fixation | a small jump does not break the fixation |
| Data loss | a gap of more than 100 ms closes the fixation; a "saccade" longer than 160 ms is an artefact | |
| Stable fixation | at least 3 samples with a root mean square spread within 1° | |

There are three differences from the original algorithm. The threshold is updated continuously,
instead of through iterations over the whole recording, because the bench has to decide while the
person types. The start of the saccade is not searched for backwards with a lower threshold: it is
dated to the sample preceding the crossing of the peak threshold. And there is no class for
glissades: instead, selecting a key requires a stable fixation.

This leads to three choices for selection.

1. **Time starts at the end of the saccade.** The count on the key begins at the instant the detector
   says the eye has landed, not when the gaze point enters the key's rectangle. The detector works on
   the unfiltered gaze, because a filter adds delay, as I noted when discussing
   [latency](/en/journal/how-the-eye-works-and-gaze-tracking/#sampling-rate-and-latency). As the
   position of the fixation I use the mean of its samples, as Jacob did.
2. **One selection per fixation.** After a selection no other key is activated until the eye makes a
   saccade. After a blink, until the new fixation falls more than 1.5° away from the point of the
   selection. This is Jacob's idea taken all the way: the fixation is the unit of the dialogue, and
   one fixation is worth at most one key.
3. **Waiting for the corrective saccade.** After a saccade of at least 8°, the bench asks which key the
   eye was really heading for. A landing model assumes that the saccade covers on average 94% of the
   distance, with a standard deviation of 0.12. Sideways, the landing point spreads by 8% of the
   distance, with a minimum of 0.7°. The mean gain lies within the range given by Harris. If the
   probability that the eye was aiming at the very key it landed on is below 0.8, that key requires at
   least 280 ms: a time of the same order as the median latency of corrective saccades measured by
   Tian and colleagues.

An example of the last rule. The gaze starts from Q, crosses almost the whole top row and lands on I.
At that point in the word, however, O, the next key in the same direction, is much more probable. The
bench then does not type the I straight away: it waits, and if the corrective saccade arrives the
right letter becomes O.

### What could change compared with the 1 s dwell

- **[The ceiling on speed](/en/journal/kite-gaze-typing-with-dwell-time/#a-ceiling-on-speed).** As
  the rules of the old keyboard are written, when the gaze moves to a new key the count starts only
  once 100 ms have passed since leaving the previous key: this is the tolerance for brief exits. Part
  of this time overlaps with the saccade, the rest is lost after landing. In addition, the count
  follows the filtered point, which arrives late. Counting from the end of the saccade recovers this
  time. On its own it is worth less than 100 ms per letter, but it is the condition for using short
  times safely, and that is where the real gain lies (see prediction).
- **[Search errors](/en/journal/kite-gaze-typing-with-dwell-time/#search-errors).** In the old
  keyboard, an eye that stays still after a selection repeats the letter after another second. With
  one selection per fixation this cannot happen: typing again requires a movement. Search glances on a
  *new* key, however, remain a risk, and I discuss them under prediction.
- **[Tracker accuracy](/en/journal/kite-gaze-typing-with-dwell-time/#tracker-accuracy).** Averaging
  the samples of a fixation reduces the random error, that is it improves precision, but it does not
  correct the systematic error, that is accuracy. Microsaccades below 1° do not break the fixation, so
  a small jump near the edge does not move the count to the neighbouring key. Then there is an error
  that the geometry of the old keyboard ignored completely: undershoot. It comes not from the tracker
  but from the eye, and it is systematic. If the eye falls short, the first landing necessarily falls
  between the starting point and the target, that is on the side the gaze comes from. The landing
  model tries to take this into account.

The risks, again hypotheses:

- if the noise grows a lot, for example with the head in an unfavourable pose, the adaptive threshold
  rises and small saccades may be missed;
- at 90 Hz a 30 ms saccade lasts three samples, so a single wrong sample weighs heavily;
- the 280 ms wait is paid even when the eye was already on the right key, if the model considers it
  uncertain.

## 2. Prediction: times and targets that follow the language

### The study

**Dwell that changes with probability.** Mott and colleagues proposed *cascading dwell*
([Mott et al., 2017](#references)). It works like this:

1. each person chooses their own baseline dwell, the one at which they type comfortably;
2. after each letter, a word prediction engine estimates how likely each key is to be the next
   letter;
3. keys below 1% probability get the maximum dwell: an unintended selection becomes difficult, but it
   remains possible to type names and out-of-vocabulary words;
4. likely keys get a shorter dwell, the shorter the more likely they are. If, however, a likely key is
   surrounded by other likely keys, the dwell is lengthened, so as not to type I when O was intended;
5. the minimum allowed dwell drops by 10% with each letter of the word, in a cascade, so as not to
   break the rhythm with abrupt changes;
6. when the current word is complete, the space bar drops to two thirds of the baseline dwell.

The study lasted eight sessions, with 17 people without disabilities, an SMI REDn tracker at about
60 Hz and English phrases. On average cascading dwell reached 12.39 WPM against 10.62 WPM for static
dwell, with fewer errors corrected during typing: 9.63% against 14.88%. The errors left in the final
text did not differ significantly. In a small evaluation with five people with amyotrophic lateral
sclerosis (ALS), the mean speed with cascading dwell was 9.51 WPM. So the gain is there, but it is
moderate.

**Language and touch together.** Goodman and colleagues treated an on-screen keyboard as a probability
problem ([Goodman et al., 2002](#references)). The most probable letter sequence is the one that
maximizes the product of two factors:

- how probable the sequence is in the language, according to a **language model**;
- how probable it is that this sequence produces exactly the points touched, according to a **touch
  model**.

With a stylus on a handheld device, a model that estimated each letter from the six preceding ones and
a two-dimensional Gaussian distribution for each key, errors fell by a factor of between 1.67 and
1.87.

Gunawardana and colleagues made a consequence of this scheme explicit
([Gunawardana et al., 2010](#references)). The keys' **touch areas**, which cannot be seen, grow and
shrink according to probability, while the drawing of the keys stays the same. Their example: after
"habi", touching Y may return T, because "habit" is more probable than "habiy". The risk is that overly
aggressive resizing makes it **impossible** to type what one wants, and the authors note that even rare
cases can be very frustrating. Their solution is an **anchor**: a central area of each key that always
returns that key, whatever the language model says. They collected the touches of 9 people on a phone
and simulated the methods on those data. With anchors, the per-key error fell relative to the static
keyboard by 17%, 6%, 8% and 13% on four test sets. Without anchors, on two sets, the error was 10%
worse than that of the static keyboard.

**Expanding targets.** A target that grows as one reaches for it behaves as if it had been large from
the start, even when the expansion begins after 90% of the movement
([McGuffin and Balakrishnan, 2002](#references)). Miniotas and colleagues found similar benefits, in
speed and accuracy, when the pointer is the gaze ([Miniotas et al., 2004](#references)).

**The cost of looking at predictions.** Predictions are not free. In a study with 14 people, 6 of
them with high-level spinal cord injury, word prediction **slowed down** those with the injury and
helped the others only a little ([Koester and Levine, 1994](#references)). The authors conclude that
the cognitive cost of using it weighed heavily: with prediction everyone pressed keys more slowly, and
those with the injury took much longer to search the list. Trnka and colleagues, with typing speeds
simulated at the level of AAC, found instead that good-quality prediction can raise communication
rate, by up to 58.6% with the most advanced system, and that the more accurate it is, the more it is
used ([Trnka et al., 2009](#references)).

**Whole phrases.** In AAC there is a tradition of devices based on whole utterances, ready to be said.
In a comparison in an office setting, between practical communication and small talk, conversational
rate and perceived communicative competence were higher with an utterance-based device than with a
word-construction one ([Todman et al., 2008](#references)). Moreover, a language model predicts better
if it is trained on texts similar to those the person wants to say. Vertanen and Kristensson used
crowdsourcing to create a large set of plausible AAC messages: their best model reduced perplexity, a
measure of how "surprised" the model is by the text, by 60–82% compared with a model trained on
telephone transcripts ([Vertanen and Kristensson, 2011](#references)).

To estimate the next word with little data, one has to decide how much probability to leave to words
never seen. This is the "zero-frequency problem" of text compression
([Witten and Bell, 1991](#references)). In the form used for language models, the Witten-Bell method
mixes the long context with the shorter one, and gives the shorter context a weight proportional to
how many different words have already been seen after that context ([Chen and Goodman, 1999](#references)).
Put with an example: if after "ho" I have always said "sete" ("I'm thirsty"), the model is sure; if
after "mi fa male la" ("my … hurts") I have said four different words, the model knows that it does
not know. In Chen and Goodman's comparison, Witten-Bell is not the best method: a variant of
Kneser-Ney wins.

**Reading is not choosing.** In silent reading, fixations last 225–250 ms on average and saccades jump
about 2°, that is 7–9 letters. In visual search, fixations last 180–275 ms on average, with saccades
of about 3° ([Rayner, 2009](#references)). A single one-second fixation is therefore much longer than
those of reading.

**After an error, people slow down.** After noticing an error, people tend to slow down their next
response: this is *post-error slowing* ([Danielmeier and Ullsperger, 2011](#references)).

### The choice in the bench

**The language model.** The bench uses the 150,000 most frequent words in Italian subtitles, with their
frequencies; I say more about it under autocorrect. Given the text typed so far, the model estimates
the probability of each of the 27 next symbols, that is the 26 letters and the space, mixing two
levels:

- the words in the lexicon that start with the letters already typed, weighted by their frequency;
- pairs of consecutive letters (bigrams), which cover words outside the lexicon.

The weight of the first level grows with the number n of words sharing the beginning, and equals
n / (n + 0.5). Finally the distribution is mixed 10% with the uniform one, so every key remains
reachable.

**Adaptive dwell.** The fixation time required after the saccade depends on the ratio r between the
key's probability and the one it would have by chance, that is 1/27:

| Ratio r | Meaning | Required time |
| --- | --- | --- |
| 4 or more | very probable letter | 120 ms |
| 1 | same as chance | about 338 ms |
| 0.1 or less | improbable letter | 700 ms |

Between these points the time grows linearly with the logarithm of r. Thanks to the 10% uniform share,
r never falls below 0.1, so no letter requires more than 700 ms. The time is also lengthened when the
gaze is ambiguous between two keys: if the probability of the key, given the gaze, is below 0.95, the
time rises, up to 700 ms when it is 0.5. The purpose is the same as Mott and colleagues' "density"
dwell, which slows down groups of neighbouring likely keys; here the decoder achieves it, rather than
the layout of the keys.

> **Update of 25 November 2026.** These are the bench times at the time of the studies. In Kite's
> published code they range from 0.2 to 1 s at the default speed, precisely because of the main risk
> described below. I tell the story in the entry
> [Kite: the code is public](/en/journal/kite-the-code-is-public/#what-has-changed-since-the-video-the-times).

**Invisibly expanding targets.** The candidate key is chosen by a Bayesian decoder, in the spirit of
Goodman and of Gunawardana:

P(key \| gaze) ∝ P(key) × exp(−d² / 2σ²)

In words: the probability of a key is its probability according to the language, multiplied by a
factor that decreases as the gaze moves away from the key. d is the distance of the gaze from the area
being aimed at: the centre for letters, the centre line for elongated keys such as the space bar,
which can therefore be looked at along its whole length. σ is the expected spread of the gaze and
equals 1.6°. The consequences:

- with equal probabilities, the boundaries are the drawn ones;
- a more probable key moves the boundary towards its neighbour by σ² × ln(Pa / Pb) / d, where d is the
  distance between the centres. An example with made-up numbers: with two keys 3° apart and the first
  four times more probable than the second, the boundary moves by about 1.2° towards the second;
- the **central core** of each key, 60% of its width and height, always remains its own: looking at
  the centre of a key yields that key, however improbable. This is Gunawardana's anchor;
- a gaze more than 1° away from every key activates nothing: the text strip and the empty areas at the
  sides of the staggered rows are neutral ground;
- the keys of the edit bar, that is the three suggestions, delete and speak, do not expand. They are
  activated only by looking inside them and with the maximum time of 700 ms, because they are
  deliberate choices, not letters to be guessed.

**Double letters according to prediction.** To repeat a letter while staying on the key, the time
depends on how probable the double is at that point in the word: 0.7 s if it is probable, as in
"pa**ss**are" ("to pass"), up to 1.5 s if it is not, with the same logarithmic scale. Leaving and
coming back, the letter has its normal time again.

**Caution after an error.** After an error, the next selection requires at least 500 ms. In the copy
task the error is a letter different from the expected one; in free typing it is a deletion. It is a
kind of post-error slowing imposed by the machine: after an error the person has to look for the right
key, and the rule breaks chains of errors precisely at that moment.

**Learned phrases.** People who communicate with a gaze keyboard often repeat the same messages. In
free typing the bench learns them and, after a few letters, proposes the rest of the phrase in light
grey after the cursor. The model:

- counts the word sequences (n-grams) of the phrases spoken, up to four words, that is three of
  context, including the start and end of the phrase;
- mixes the orders with the Witten-Bell method;
- constrains the first word of the proposal to the letters already typed, and gives words never said
  that start that way the weight they have in the Italian lexicon;
- searches for the most probable completion up to the end of the phrase with a beam search of 8
  hypotheses, up to 25 words;
- proposes it only if the probability of the whole completion is at least 0.3. It never proposes it on
  empty text, where it would be accepted by staring into space while thinking.

To accept the phrase one fixates it for **1 s, in a single fixation**. The accepting area is the
phrase with a 0.8° margin, and it never extends down onto the keys. Every saccade resets the count;
microsaccades below 1° and blinks up to 300 ms do not. So reading the phrase is not enough to accept
it: a reader jumps from word to word with saccades of about 2°, and reading fixations last about a
quarter of the required time. Delete, right afterwards, undoes the acceptance.

A message is learned when the synthetic voice has said it in full. The **speak** key sends it to
Piper, a speech synthesizer that runs on the computer. The phrases stay in a local text file, which
can be edited by hand, and no data leaves the computer.

### What could change compared with the 1 s dwell

- **[The ceiling on speed](/en/journal/kite-gaze-typing-with-dwell-time/#a-ceiling-on-speed).**
  Redoing the calculation from the dwell entry with fixation time alone, the ceiling is no longer
  12 WPM: with 700 ms for every letter it would be about 17 WPM, with 338 ms about 35 WPM, with 120 ms
  100 WPM. These are arithmetic limits, not predictions: they ignore saccades, searching for letters
  and corrections, which weigh heavily in practice. The most honest comparison is with Mott and
  colleagues, who with a similar idea measured about 12.4 WPM against 10.6, under other conditions.
- **[The speed–error trade-off](/en/journal/kite-gaze-typing-with-dwell-time/#the-speederror-trade-off).**
  With fixed dwell the trade-off is chosen once and for all. Here it is chosen letter by letter: fast
  where the language is certain, cautious where it is not. My hypothesis is that the most harmful
  unintended selections fall on improbable keys, which now require more time.
- **[Search errors](/en/journal/kite-gaze-typing-with-dwell-time/#search-errors).** An improbable
  letter requires 700 ms, much more than typical visual search fixations, and after an error caution
  raises the minimum to 500 ms. But here lies the **main risk** of the whole keyboard: 120 ms is less
  than typical visual search fixations, 180–275 ms. Looking at a very probable key without wanting to
  type it can activate it. Protection depends on the language being right and on the saccade rules: it
  is the first point to test.
- **[Double letters cost double](/en/journal/kite-gaze-typing-with-dwell-time/#double-letters-cost-double).**
  A probable double costs 0.7 s more, instead of a whole second, and when leaving and coming back the
  second letter again has its normal time, often well under a second.
- **[Tracker accuracy](/en/journal/kite-gaze-typing-with-dwell-time/#tracker-accuracy).** Expanding
  targets enlarge the areas of probable keys without making them bigger on the screen; the central core
  and the 1° margin keep the keyboard predictable. It is a way of living with imperfect accuracy without
  having to draw even bigger keys.
- **[Fatigue](/en/journal/kite-gaze-typing-with-dwell-time/#fatigue).** Most letters require less than
  a second of motionless gaze. With learned phrases, moreover, a recurring message is completed with a
  single fixation instead of one per letter. Accepting the phrase, however, is still a 1 s dwell, as in
  the old keyboard: it is a trade-off between unintended acceptances and fatigue, to be tested with
  people.

Risks and open questions:

- a name or a rare word has "improbable" letters: the keyboard slows down right there, even though it
  stays under a second;
- the bench does not have Mott's cascade: the time can jump from 120 to 700 ms from one letter to the
  next. Mott and colleagues wanted to avoid exactly these jumps, so as not to break the rhythm, and I
  do not yet know whether they are a problem here;
- looking at proposals costs attention, as Koester and Levine show. The grey phrase sits where the gaze
  already is, after the cursor, and appears only when it is probable enough. My hypothesis is that it
  costs less than a list to scan, but this needs to be measured.

## 3. Pupil: separating light from effort

### The study

In the [entry on the eye](/en/journal/how-the-eye-works-and-gaze-tracking/#pupil-diameter) I had
concluded that pupil diameter should be recorded, but not used as a command or as a measure of fatigue
without controlling for luminance. The bench tries to control for it. To do so it needs three things
from the literature: how the pupil responds to light, how it responds to effort and how to separate
the two responses.

**The response to light.** Pupil diameter depends mainly on the luminance to which the eye is adapted,
modulated by the area of the illuminated field, by age and by whether the light reaches one or both
eyes ([Watson and Yellott, 2012](#references)). The response is not instantaneous. According to
Mathôt's review, the light reflex has a minimum latency of about 200 ms, then the pupil constricts
quickly, while dilation when the light dims is **much slower** than constriction
([Mathôt, 2018](#references)). The reflex is stronger for light in central vision. Even shifting
attention towards the bright part of a screen, without moving the eyes, slightly constricts the pupil,
although about three times less than looking at it directly.

**The response to effort.** During a memory task the pupil dilates while the material is presented and
constricts while it is reported ([Kahneman and Beatty, 1966](#references)). Beatty, in a review,
concluded that this task-evoked response reflects differences in load within a single task, between
different tasks and between different people ([Beatty, 1982](#references)). It is, however, slow.
Hoeks and Levelt described it as a linear system, in which attentional pulses add up, with a
gamma-shaped impulse response and parameters fairly constant across tasks and people
([Hoeks and Levelt, 1993](#references)). With the parameters reported by Wierda and colleagues, the
maximum arrives after about 930 ms ([Wierda et al., 2012](#references)).

**Separating the two responses.** Palinko and Kun showed, in a driving simulator, that at least in
certain situations the effects of illumination and of visual cognitive load on pupil diameter can be
separated ([Palinko and Kun, 2012](#references)). Pfleging and colleagues went a step further
([Pfleging et al., 2016](#references)):

- they treated the diameter as the **sum** of a part due to light and a part due to load;
- they used data from 20 people, with an auditory memory task (n-back) at three difficulty levels and
  six lighting conditions;
- knowing the light and the person's mean diameter at that light, their model correctly classified the
  difficulty in 75% of cases;
- among the limitations they state discrete lighting levels, long breaks between conditions, estimates
  over 30 s blocks and a calculation done afterwards, not in real time.

For practical use the authors propose precisely a calibration: measuring the person's pupil, without
load, in front of brighter and darker screens, and estimating the light from the luminance of the
screen around the point being looked at.

**An artefact not to forget.** Seen from the camera, the pupil appears shorter when the eye rotates
away from the camera axis: this is the *pupil foreshortening error*. Hayes and Petrov mapped it with
artificial eyes and an EyeLink 1000 tracker, and found large, systematic deviations as the gaze
position changed ([Hayes and Petrov, 2016](#references)). A geometric model, based on the cosine of the
angle between the eye–camera axis and the eye–stimulus axis, reduced the root mean squared error by
82.5% with parameters taken from the physical measurements of the set-up, and by 97.5% with optimized
parameters.

### The choice in the bench

The bench follows the additive scheme of Pfleging and colleagues, but tries to apply it sample by
sample, with a dynamic model of the response to light.

1. **The light seen by the person.** At every frame the interface computes the luminance of the pixels
   it draws, converted to linear light, on a grid of 48 × 27 cells. The effective luminance weights the
   area within 5° of the gaze point at 30% and the whole screen at 70%. This is my own choice, motivated
   by the fact that the reflex is stronger for light in central vision.
2. **The light model.** The diameter predicted from light alone is D = A + B × log₁₀(L + 0.01), with B
   negative: more light, smaller pupil. The logarithmic form and the 0.01 constant, which avoids the
   logarithm of zero, are my own simplifications. Luminance enters with a delay and passes through a
   first-order filter with two time constants: one for constriction, when the light increases, and one
   for dilation, when it dims, never shorter than the first. These are the properties described by
   Mathôt.
3. **Calibration.** For 30 s one looks at a cross while the background goes through 9 grey levels,
   3.3 s each, alternating jumps towards light and towards dark. The bench tries a grid of values for
   the delay (from 0.1 to 0.5 s), the constriction constant (from 0.1 to 0.8 s) and the dilation
   constant (from 0.3 to 3.5 s), and estimates A and B by least squares. If the model explains less
   than 60% of the variance (R² below 0.6), the compensation is flagged as uncertain. The model applies
   to one person, one monitor and one room, and expires after 12 hours, because the light in the room
   changes.
4. **Cleaning the signal.** The diameter is the mean of the two eyes; with one eye only, it is
   corrected using the mean difference between the two. The 120 ms after a blink and jumps of more than
   0.6 mm are discarded, and the signal is smoothed with a 0.12 s time constant.
5. **The load index.** The residual, that is the measured diameter minus the one predicted from light,
   is the load index. The z value measures its fast component: an exponential moving average of about
   1 s, minus a baseline of about 20 s, divided by the typical variability of this difference,
   estimated over about 60 s and never below 0.02 mm.
6. **Use in selection, as a hypothesis.** When z is positive, the time required for each key is
   multiplied by (1 + 0.25 × z), with z capped at 2: at most it grows by 50%. The minimums of the rules
   on saccades, double letters and caution stay the same. It applies only if the pupil is valid and
   compensated, and it can be switched off for comparison.

### What could change compared with the 1 s dwell

This is the most uncertain of the four topics, and I say so straight away: the pupil is slow. The
response to effort peaks after about a second, while a selection is decided in 120–700 ms. So it cannot
decide a single letter: at most it can change the pace of the keyboard on a scale of seconds.

- **[Fatigue](/en/journal/kite-gaze-typing-with-dwell-time/#fatigue).** In the dwell entry, fatigue
  was the one reported by participants in other studies. A continuous load index, net of light, would
  make it possible to compare the old and new keyboards on this too, moment by moment. This is the use I
  consider most solid: the pupil as a **measurement**, not as a command.
- **[The speed–error trade-off](/en/journal/kite-gaze-typing-with-dwell-time/#the-speederror-trade-off).**
  The hypothesis is that high load signals a moment when the person is searching, thinking or
  struggling, and when a Midas touch is more likely. Slowing down at those moments could reduce errors.
  With the maximum increase, a very probable letter goes from 120 to 180 ms and an improbable one from
  700 to 1050 ms, that is beyond the old keyboard's one second.

The risks are concrete:

- I do not know which way the effect goes: high load could also indicate concentration, and slow down
  someone who is typing well;
- luminance is relative, computed from pixels, not measured in candelas per square metre: if the
  monitor brightness or the room light changes, the calibration must be redone;
- the foreshortening error described by Hayes and Petrov is not compensated, although the bench
  records the gaze, so it can be corrected afterwards;
- I do not know of any Tobii documentation on the quality of the 4C's pupillometry. The bench has a
  laboratory mode designed to check it on one's own face: the background oscillates between dark and
  light, and at times one does mental arithmetic. If the compensation works, the residual should stay
  flat when the light changes and rise during the arithmetic.

## 4. Autocorrect: the noisy channel

### The study

**The noisy channel.** Kernighan, Church and Gale described a spelling corrector based on a simple
assumption: the writer knows which word they want, but on the way to the keyboard some noise is added,
in the form of typos ([Kernighan et al., 1990](#references)). To recover the intended word c from the
typo t, one looks for the c that maximizes P(c) × P(t \| c). The first factor is the prior probability
of the word. The second is a model of the "channel", which describes the typical transformations:
insertions, deletions, substitutions and reversals of letters. Brill and Moore then improved the
channel model by moving to generic transformations between pieces of words
([Brill and Moore, 2000](#references)).

To compare a sequence of letters with a word one uses the edit distance: the minimum cost of the
operations that turn one string into the other. It is computed with dynamic programming, in time
proportional to the product of the two lengths, and the authors already listed spelling correction
among the applications ([Wagner and Fischer, 1974](#references)). The decoder of Goodman and colleagues,
seen under prediction, has the same structure, applied to touches instead of letters.

**Where to get the frequencies.** The factor P(c) requires word frequencies. New and colleagues
proposed film subtitles as an approximation of the language of interactions
([New et al., 2007](#references)). On a corpus of 52 million French words, frequencies from subtitles
compared well with other measures of spoken and written language, and explained part of the word
recognition times in addition to what was explained by written-language frequencies. And a language
model for AAC works better when it resembles the language of the person using it, as Vertanen and
Kristensson show.

**Not betraying the writer.** Gunawardana and colleagues' warning about touch areas also applies to a
corrector: an overly aggressive system can prevent people from typing what they want. From this I
derive a principle: changing a correct word is worse than leaving a typo.

### The choice in the bench

**The lexicon.** It consists of the 150,000 most frequent words in the Italian subtitles of
OpenSubtitles 2018 ([Lison et al., 2018](#references)), from the list of the FrequencyWords project,
licensed CC BY-SA 4.0 ([Hermit Dave, n.d.](#references)). Subtitles are transcribed in a hurry, so the
list is cleaned up when it is loaded:

- final accents become mandatory ("perche" becomes "perché", "because"; "citta" becomes "città",
  "city"), but only if the accented form is actually used: "allá" does not replace "alla";
- monosyllables follow spelling rules: e/è, si/sì and la/là remain distinct words, "piu" becomes "più"
  and "quì" becomes "qui";
- elisions are a closed class ("l'", "dell'", "un'"…) and are joined to the following word, while
  "po'" stays separate;
- abbreviations and spurious apostrophes are discarded.

Forms are grouped by how they are typed on a 26-letter keyboard, without accents or apostrophes.

**The model.** At the space, the corrector chooses the word that maximizes P(word) × P(selections \|
word). It aligns the selected letters with those of each candidate word using dynamic programming, and
the two sequences may differ in length by at most 3. The channel is that of a gaze keyboard:

| Event | Probability in the code | Where the idea comes from |
| --- | --- | --- |
| Each intended letter produces a selection | the one indicated by the gaze, plus a 2% uniform share | the decoder without prediction says how much the gaze pointed to each key; after a saccade of at least 8° the short-landing model is added, at half weight, so that a B reached from the left may be an N |
| Spurious selection | 12% | a search glance or an unintended double |
| Missing letter | 2%; 25% for the second letter of a double | with gaze, a double letter costs an extra gesture |
| Out-of-lexicon word | 3% prior | names and rare words |

**Caution.** So as not to betray the writer:

- a word in the lexicon with a relative frequency of at least one in a million, that is about 245
  occurrences in the corpus, is not replaced: at most it gets accents and apostrophes;
- an out-of-lexicon word that "looks Italian" is left alone. The bench judges this with a letter
  trigram model: if no group of three letters has a probability below about 0.7% (natural logarithm
  −5), the word stays as it is. Spurious selections create sequences that do not exist in Italian,
  whereas names and rare words usually do not contain them;
- there is one exception: skipped double letters ("pasare" → "passare") are corrected even when the
  word looks plausible, because with gaze they are the most expected error;
- in any case the correction requires a probability of at least 0.5, and higher than that of the word
  as it was typed.

Delete, right after a correction, undoes it and puts the word in the personal dictionary, with the
weight of a medium-frequency word (2000 occurrences). Whatever is not corrected automatically stays in
the **suggestion bar**: three completions of the current word, selected with the gaze like the other
keys of the bar.

### What could change compared with the 1 s dwell

- **[The speed–error trade-off](/en/journal/kite-gaze-typing-with-dwell-time/#the-speederror-trade-off).**
  With the old keyboard every error costs at least two extra selections, delete and the right letter,
  that is at least 2 s of dwell plus searching for the keys. If the corrector fixes the word at the
  space, the error costs no selection at all; if the right word is among the suggestions, it costs one
  of 700 ms. My hypothesis is that a cheaper error makes a faster keyboard acceptable, one that makes a
  few more mistakes but reaches the right text sooner.
- **[Search errors](/en/journal/kite-gaze-typing-with-dwell-time/#search-errors).** Spurious selections
  are an event the model expects: an extra letter, entered because of a glance, is removed at the
  space, if the word without that letter is sufficiently more probable and the caution rules allow it.
- **[Double letters cost double](/en/journal/kite-gaze-typing-with-dwell-time/#double-letters-cost-double).**
  A skipped double is corrected, so the writer could even give up on the second letter. With one
  limitation: when both forms are real words, such as "pala" ("shovel") and "palla" ("ball"), the
  corrector cannot choose without context.
- **[Tracker accuracy](/en/journal/kite-gaze-typing-with-dwell-time/#tracker-accuracy).** Substitutions
  between neighbouring keys are weighted with the gaze: if the selected letter was on the border with
  another one, the other one also remains a serious candidate.
- **In addition**, there is something the old keyboard could not do: write correct accents and
  elisions with 26 letters and the space ("perche" → "perché", "l acqua" → "l'acqua", "the water").

The risks: changing a correct word is still possible, for example with an inflected form beyond the
150,000 words or with a name that "does not look Italian"; delete undoes the correction and the word is
learned. Moreover, the corrector chooses each word on its own, without looking at the previous ones, so
"c'e" does not become "c'è" ("there is"): the "è" stays among the suggestions.

## What is left out

From the list of topics in the
[entry on Tobii Race](/en/journal/tobii-race-a-driving-game-to-put-the-4c-to-the-test/#what-i-take-to-kite-the-topics-to-explore)
I have covered here the Midas touch and adaptive dwell, within saccades and prediction, and prediction
with small, local language models. Left out, for now, are: dwell-free typing from the gaze path,
Dasher, smooth pursuit, large language models, tuning the One Euro filter for the keyboard and gaze
combined with the head. The bench does not use the One Euro filter: instead, it averages the samples of
each fixation. These topics did not make it into the hybrid keyboard and deserve entries of their own.

## What I take away

In the dwell entry I had concluded that the old keyboard treats all keys and all moments of typing in
the same way. The four studies point in the same direction: using what is known about the eye, the
language and the person to stop treating everything in the same way.

| Limitation of the old keyboard | What the hybrid keyboard tries to do | What I need to test |
| --- | --- | --- |
| Ceiling on speed | time from the end of the saccade; 120–700 ms depending on the letter; whole phrases | that the time per character really falls |
| Speed–error trade-off | time chosen letter by letter; autocorrect; pupil | that unintended errors do not grow with speed |
| Search errors | one selection per fixation; 700 ms for improbable letters; caution after an error; spurious selections in the corrector | glances at very probable keys, the main risk |
| Double letters | 0.7–1.5 s depending on prediction; skipped doubles corrected | that a "held" double does not fire by mistake |
| Fatigue | shorter times; learned phrases; pupil as a measurement | that light compensation works |
| Tracker accuracy | fixation mean; expanding targets with a fixed core; waiting for the corrective saccade; substitutions weighted by gaze | that expansion does not assign to the neighbour a gaze aimed at the edge of the right key |

## Limitations of this entry

- **No measurements.** Everything that concerns Kite in this entry is a hypothesis.
- **Other conditions.** The results from the literature come from other people, languages, trackers and
  tasks: English phrases with an SMI at 60 Hz (Mott), a stylus on a handheld (Goodman), touches on a
  phone (Gunawardana), a memory task under controlled lighting (Pfleging). They do not transfer by
  themselves to the 4C and to Italian.
- **Parameters not validated.** The values are those written in the code. Many are design choices,
  some adjusted during development, and none has yet been validated with a systematic test.
- **Interacting mechanisms.** An effective corrector, for example, makes errors less costly, and could
  encourage shorter times that produce more errors. This is why they also need to be evaluated one at a
  time: in the bench, prediction, pupil and autocorrect can be switched off separately.

## Next steps

1. Prepare the protocol to compare the old and new keyboards with people, with informed consent,
   measuring WPM, keystrokes per character and corrected and uncorrected errors.
2. Evaluate the mechanisms one at a time, switching off prediction, pupil and autocorrect.
3. Check the light compensation with the pupil laboratory mode, before using it to change the
   keyboard's timings.

> **Disclaimer.** Kite is an experimental project and **is not a certified medical device**; the
> test bench is an experimental tool, not an assistive device. The pupil index is a research
> hypothesis, not a clinical measure of fatigue or of health. Anyone who depends on an AAC tool to
> communicate should always have a backup alternative, such as a paper alphabet board. Learned phrases
> may contain personal information: they stay on the computer and must be protected as such. Tests with
> people require informed consent and, where needed, the approval of an ethics committee.

## References

1. Beatty J. (1982). Task-evoked pupillary responses, processing load, and the structure of processing
   resources. *Psychological Bulletin*, 91(2), 276–292.
   [doi:10.1037/0033-2909.91.2.276](https://doi.org/10.1037/0033-2909.91.2.276)
2. Brill E., Moore R. C. (2000). An improved error model for noisy channel spelling correction. In
   *Proceedings of the 38th Annual Meeting of the Association for Computational Linguistics (ACL '00)*,
   286–293. [doi:10.3115/1075218.1075255](https://doi.org/10.3115/1075218.1075255)
3. Chen S. F., Goodman J. (1999). An empirical study of smoothing techniques for language modeling.
   *Computer Speech & Language*, 13(4), 359–394.
   [doi:10.1006/csla.1999.0128](https://doi.org/10.1006/csla.1999.0128)
4. Danielmeier C., Ullsperger M. (2011). Post-error adjustments. *Frontiers in Psychology*, 2, 233.
   [doi:10.3389/fpsyg.2011.00233](https://doi.org/10.3389/fpsyg.2011.00233) (open access)
5. Goodman J., Venolia G., Steury K., Parker C. (2002). Language modeling for soft keyboards. In
   *Proceedings of the 7th International Conference on Intelligent User Interfaces (IUI '02)*, 194–195.
   ACM. [doi:10.1145/502716.502753](https://doi.org/10.1145/502716.502753).
   [Freely available version](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/p194-goodman.pdf)
6. Gunawardana A., Paek T., Meek C. (2010). Usability guided key-target resizing for soft keyboards. In
   *Proceedings of the 15th International Conference on Intelligent User Interfaces (IUI '10)*, 111–118.
   ACM. [doi:10.1145/1719970.1719986](https://doi.org/10.1145/1719970.1719986).
   [Freely available version](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/paper-final.pdf)
7. Harris C. M. (1995). Does saccadic undershoot minimize saccadic flight-time? A Monte-Carlo study.
   *Vision Research*, 35(5), 691–701.
   [doi:10.1016/0042-6989(94)00163-G](https://doi.org/10.1016/0042-6989(94)00163-G)
8. Hayes T. R., Petrov A. A. (2016). Mapping and correcting the influence of gaze position on pupil
   size measurements. *Behavior Research Methods*, 48(2), 510–527.
   [doi:10.3758/s13428-015-0588-x](https://doi.org/10.3758/s13428-015-0588-x) (open access on
   [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4637269/))
9. Hermit Dave (n.d.). *FrequencyWords*: word frequency lists derived from OpenSubtitles, 2018 Italian
   list. Dataset, content licensed CC BY-SA 4.0.
   [github.com/hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords)
10. Hoeks B., Levelt W. J. M. (1993). Pupillary dilation as a measure of attention: a quantitative
    system analysis. *Behavior Research Methods, Instruments, & Computers*, 25(1), 16–26.
    [doi:10.3758/BF03204445](https://doi.org/10.3758/BF03204445)
11. Jacob R. J. K. (1991). The use of eye movements in human-computer interaction techniques: what
    you look at is what you get. *ACM Transactions on Information Systems*, 9(2), 152–169.
    [doi:10.1145/123078.128728](https://doi.org/10.1145/123078.128728)
12. Kahneman D., Beatty J. (1966). Pupil diameter and load on memory. *Science*, 154(3756),
    1583–1585. [doi:10.1126/science.154.3756.1583](https://doi.org/10.1126/science.154.3756.1583)
13. Kernighan M. D., Church K. W., Gale W. A. (1990). A spelling correction program based on a noisy
    channel model. In *Proceedings of the 13th International Conference on Computational Linguistics
    (COLING 1990)*, vol. 2, 205–210.
    [doi:10.3115/997939.997975](https://doi.org/10.3115/997939.997975)
14. Koester H. H., Levine S. P. (1994). Modeling the speed of text entry with a word prediction
    interface. *IEEE Transactions on Rehabilitation Engineering*, 2(3), 177–187.
    [doi:10.1109/86.331567](https://doi.org/10.1109/86.331567)
15. Lison P., Tiedemann J., Kouylekov M. (2018). OpenSubtitles2018: statistical rescoring of sentence
    alignments in large, noisy parallel corpora. In *Proceedings of the Eleventh International
    Conference on Language Resources and Evaluation (LREC 2018)*. ELRA.
    [aclanthology.org/L18-1275](https://aclanthology.org/L18-1275/) (open access)
16. Mathôt S. (2018). Pupillometry: psychology, physiology, and function. *Journal of Cognition*,
    1(1), 16. [doi:10.5334/joc.18](https://doi.org/10.5334/joc.18) (open access)
17. McGuffin M., Balakrishnan R. (2002). Acquisition of expanding targets. In *Proceedings of the
    SIGCHI Conference on Human Factors in Computing Systems (CHI '02)*, 57–64. ACM.
    [doi:10.1145/503376.503388](https://doi.org/10.1145/503376.503388)
18. Miniotas D., Špakov O., MacKenzie I. S. (2004). Eye gaze interaction with expanding targets. In
    *CHI '04 Extended Abstracts on Human Factors in Computing Systems*, 1255–1258. ACM.
    [doi:10.1145/985921.986037](https://doi.org/10.1145/985921.986037)
19. Mott M. E., Williams S., Wobbrock J. O., Morris M. R. (2017). Improving dwell-based gaze typing
    with dynamic, cascading dwell times. In *Proceedings of the 2017 CHI Conference on Human Factors in
    Computing Systems (CHI '17)*, 2558–2570. ACM.
    [doi:10.1145/3025453.3025517](https://doi.org/10.1145/3025453.3025517).
    [Freely available version](https://faculty.washington.edu/wobbrock/pubs/chi-17.02.pdf)
20. New B., Brysbaert M., Veronis J., Pallier C. (2007). The use of film subtitles to estimate word
    frequencies. *Applied Psycholinguistics*, 28(4), 661–677.
    [doi:10.1017/S014271640707035X](https://doi.org/10.1017/S014271640707035X) (open access)
21. Nyström M., Holmqvist K. (2010). An adaptive algorithm for fixation, saccade, and glissade
    detection in eyetracking data. *Behavior Research Methods*, 42(1), 188–204.
    [doi:10.3758/BRM.42.1.188](https://doi.org/10.3758/BRM.42.1.188)
22. Palinko O., Kun A. L. (2012). Exploring the effects of visual cognitive load and illumination on
    pupil diameter in driving simulators. In *Proceedings of the Symposium on Eye Tracking Research and
    Applications (ETRA '12)*, 413–416. ACM.
    [doi:10.1145/2168556.2168650](https://doi.org/10.1145/2168556.2168650)
23. Pfleging B., Fekety D. K., Schmidt A., Kun A. L. (2016). A model relating pupil diameter to mental
    workload and lighting conditions. In *Proceedings of the 2016 CHI Conference on Human Factors in
    Computing Systems (CHI '16)*, 5776–5788. ACM.
    [doi:10.1145/2858036.2858117](https://doi.org/10.1145/2858036.2858117).
    [Authors' version](https://www.medien.informatik.uni-muenchen.de/pubdb/publications/pub/pfleging2016workload/pfleging2016workload.pdf)
24. Rayner K. (2009). The 35th Sir Frederick Bartlett Lecture: eye movements and attention in
    reading, scene perception, and visual search. *Quarterly Journal of Experimental Psychology*,
    62(8), 1457–1506. [doi:10.1080/17470210902816461](https://doi.org/10.1080/17470210902816461)
25. Tian J., Ying H. S., Zee D. S. (2013). Revisiting corrective saccades: role of visual feedback.
    *Vision Research*, 89, 54–64.
    [doi:10.1016/j.visres.2013.07.012](https://doi.org/10.1016/j.visres.2013.07.012) (author
    manuscript on [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3784029/))
26. Todman J., Alm N., Higginbotham J., File P. (2008). Whole utterance approaches in AAC.
    *Augmentative and Alternative Communication*, 24(3), 235–254.
    [doi:10.1080/08990220802388271](https://doi.org/10.1080/08990220802388271)
27. Trnka K., McCaw J., Yarrington D., McCoy K. F., Pennington C. (2009). User interaction with word
    prediction: the effects of prediction quality. *ACM Transactions on Accessible Computing*, 1(3),
    1–34. [doi:10.1145/1497302.1497307](https://doi.org/10.1145/1497302.1497307)
28. Vertanen K., Kristensson P. O. (2011). The imagination of crowds: conversational AAC language
    modeling using crowdsourcing and large data sources. In *Proceedings of the 2011 Conference on
    Empirical Methods in Natural Language Processing (EMNLP 2011)*, 700–711. ACL.
    [aclanthology.org/D11-1065](https://aclanthology.org/D11-1065/) (open access)
29. Voloh B., Watson M. R., König S., Womelsdorf T. (2020). MAD saccade: statistically robust saccade
    threshold estimation via the median absolute deviation. *Journal of Eye Movement Research*, 12(8).
    [doi:10.16910/jemr.12.8.3](https://doi.org/10.16910/jemr.12.8.3) (open access)
30. Wagner R. A., Fischer M. J. (1974). The string-to-string correction problem. *Journal of the ACM*,
    21(1), 168–173. [doi:10.1145/321796.321811](https://doi.org/10.1145/321796.321811)
31. Watson A. B., Yellott J. I. (2012). A unified formula for light-adapted pupil size. *Journal of
    Vision*, 12(10), 12. [doi:10.1167/12.10.12](https://doi.org/10.1167/12.10.12) (open access)
32. Wierda S. M., van Rijn H., Taatgen N. A., Martens S. (2012). Pupil dilation deconvolution reveals
    the dynamics of attention at high temporal resolution. *Proceedings of the National Academy of
    Sciences*, 109(22), 8456–8460.
    [doi:10.1073/pnas.1201858109](https://doi.org/10.1073/pnas.1201858109) (open access on
    [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3365158/))
33. Witten I. H., Bell T. C. (1991). The zero-frequency problem: estimating the probabilities of novel
    events in adaptive text compression. *IEEE Transactions on Information Theory*, 37(4), 1085–1094.
    [doi:10.1109/18.87000](https://doi.org/10.1109/18.87000)
