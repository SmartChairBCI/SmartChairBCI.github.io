---
ref: eye-and-gaze-tracking-for-typing
project: kite
kind: explainer
authors: [Antonio Blescia, Bones]
title: "How the eye works and what an eye tracker measures when we type with our gaze"
description: Fovea, saccades, fixations, corneal reflection and pupil. The properties of the eye and of the tracker that really matter when designing a gaze keyboard, and how to measure whether it works.
tags: [eye, eye-tracking, aac, assisted-typing, virtual-keyboard]
---

In the [entry on dwell time](/en/journal/kite-gaze-typing-with-dwell-time/) I described how the
first gaze keyboard of [Kite](/en/research/kite/), my open Augmentative and Alternative
Communication (AAC) tool, worked. Before designing a new mechanism I want to stop and look at the
basics: **how the eye is built**, **how it moves** and **what an eye tracker can actually read**.

This entry is an explainer. It contains no measurements of my own: every number comes from the
cited literature, together with the conditions in which it was obtained. When I write down an idea
of my own, I say so explicitly.

## The problem

A gaze keyboard has to answer two questions, dozens of times a minute: **where** the person is
looking and **whether** they really want to press that key. The first question depends on the
anatomy of the eye and on the quality of the tracker. The second depends on how the eye moves and
on which voluntary signals are still available to the person.

Knowing these limits helps to make the right choices: how large to make the keys, how long the
dwell should be, whether to use blinks, what to record during the trials.

## How the eye is built, in brief

![Horizontal section of the right eye with English labels: cornea, iris, pupil, lens, vitreous chamber, retina, fovea centralis, optic disc, optic nerve, lateral rectus and medial rectus muscles.](https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/1413_Structure_of_the_Eye.jpg/960px-1413_Structure_of_the_Eye.jpg)

*Structure of the eye. Light enters from the right, passes through the cornea, the pupil and the
lens, and reaches the retina; the fovea centralis is the small pit on the visual axis. Image:
OpenStax College, Anatomy & Physiology, licensed
[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), via
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:1413_Structure_of_the_Eye.jpg).*

Let us follow the path of light ([Betts et al., 2022](#references)):

1. The **cornea** is the transparent surface at the front of the eye. It lets light in and,
   together with the lens, focuses it.
2. The **iris** is the coloured part. In its centre there is an opening, the **pupil**, which
   constricts in bright light and dilates in the dark. Its diameter ranges roughly between 2 and
   8 mm ([Mathôt, 2018](#references)).
3. The **lens** changes shape to focus at different distances.
4. The **retina** lines the back of the eye and contains the photoreceptors: rods, sensitive to dim
   light, and cones, which work in brighter light and see colour.
5. At the centre of the retina lies the **fovea**, a small pit where vision is sharpest.

**Why it matters for typing.** A remote tracker sees exactly the cornea, the iris and the pupil,
that is, the front of the eye. It does not see the fovea, which is the point that really matters.
It therefore has to reconstruct the direction of gaze indirectly, as I explain below.

### The fovea: we only see sharply in the centre

![Plot of photoreceptor density in the human retina as a function of the angle from the fovea: cones (blue line) have a narrow peak at 0°, rods (dotted red line) are absent at the centre and peak at around 20°; towards the nose side there is the blind spot, with no receptors.](https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Human_photoreceptor_distribution.svg/960px-Human_photoreceptor_distribution.svg.png)

*Density of cones (solid blue line) and rods (dotted red line) along a line through the fovea and
the blind spot. Image: Cmglee, based on "Foundations of Vision" by B. A. Wandell, licensed
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), via
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Human_photoreceptor_distribution.svg).*

The plot shows why the fovea is special: cones are concentrated in a very narrow peak around 0°,
and only a few degrees away their density collapses.

The retina is measured in the same degrees as visual angle: on the human retina, 1° corresponds to
about 0.3 mm ([Provis et al., 2013](#references)). The size of the fovea depends on the definition
used. According to the review by Strasburger and colleagues, the fovea has a diameter of about
5.2°; however, "foveal vision" usually refers to the **foveola**, the central part, which has a
diameter of about **1°** ([Strasburger et al., 2011](#references)). The same review calls vision
within 2° of the centre "foveal". This is why it is often said that truly sharp vision covers only
**1–2° of visual angle**.

To get an idea: at 65 cm from the screen, 1° corresponds to just over 1 cm (I work this out below).

**Why it matters for typing.** To read a letter we have to bring it onto the fovea, so we move our
eyes to what interests us. This is what makes gaze a good pointer. But the fovea has a certain
extent: to see a letter sharply there is no need to aim at it more precisely than about 1°. For
this reason, and because of the limits of the camera, a remote tracker cannot be much more accurate
than about 0.5° ([Majaranta et al., 2006](#references)). It is a limit of the eye, not only of the
technology.

### The muscles that move the eye

![Two views of the right eye, lateral and anterior, with the six extraocular muscles: superior, inferior, medial and lateral rectus, superior oblique with its trochlea, and inferior oblique. The red arrows in the anterior view show the direction in which each muscle pulls.](https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/1412_Extraocular_Muscles.jpg/960px-1412_Extraocular_Muscles.jpg)

*The extraocular muscles of the right eye, seen from the side (left) and from the front (right).
Image: OpenStax College, Anatomy & Physiology, licensed
[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), via
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:1412_Extraocular_Muscles.jpg).*

Each eye is moved by **six extraocular muscles**: four rectus muscles (superior, inferior, medial
and lateral) and two oblique muscles (superior and inferior). A seventh muscle, the levator
palpebrae superioris, does not move the eye but lifts the upper eyelid
([Betts et al., 2022](#references)).

**Why it matters for typing.** In amyotrophic lateral sclerosis (ALS), eye movements are generally
relatively spared. In a longitudinal study of 61 people with ALS, basic saccadic function was
normal ([Proudfoot et al., 2016](#references)). This is why gaze is one of the most widely used
channels in AAC. The eyelid muscle, on the other hand, is the reason why a drooping eyelid (ptosis)
can cover the pupil and disturb the tracker: I come back to this in the section on limitations.

## How the eye moves

The eye does not glide continuously across the screen: it jumps, stops, trembles. Each type of
movement plays a different role for a gaze keyboard.

| Movement | What it does | Typical values | What it means for the keyboard |
| --- | --- | --- | --- |
| **Fixation** | Gaze stays on one point | Usually 200–600 ms ([Majaranta et al., 2006](#references)); from less than 100 ms to several seconds ([Feit et al., 2017](#references)) | This is when the eye "reads" a key. The dwell must last longer than a normal fixation |
| **Saccade** | Rapid jump from one fixation to the next | About 30–80 ms ([Feit et al., 2017](#references)) | During the jump gaze crosses other keys: they must not activate |
| **Microsaccades** | Small jumps during a fixation | 1–3 per second, usually below 0.5°, sometimes up to 1° or more ([Otero-Millan et al., 2014](#references)) | The gaze point "jumps" even when the person thinks they are still |
| **Drift** | Slow sliding between two microsaccades | Usually below 0.13° and below 0.5°/s ([Otero-Millan et al., 2014](#references)) | Slowly moves the point near the edges of the key |
| **Tremor** | Tiny, fast oscillation | A few seconds of arc, around 90 Hz ([Otero-Millan et al., 2014](#references)) | Too small for a common tracker: it ends up in the noise |
| **Smooth pursuit** | The eye follows a moving object | Requires a moving target ([Vidal et al., 2013](#references)) | Allows moving objects to be selected by comparing trajectories, without accurate calibration |
| **Vergence** | The two eyes rotate in opposite directions to look near or far | Compensates for disparity between the two eyes ([Otero-Millan et al., 2014](#references)) | With a screen at a fixed distance it should matter little |
| **Blink** | The eyelid closes and reopens | In BlinkWrite, blinks shorter than 200 ms are treated as involuntary ([MacKenzie and Ashtiani, 2011](#references)) | For a moment the tracker cannot see the pupil |

A few more numbers on saccades. In a study of nine people, saccades of about 9° on average had mean
peak velocities between about 160 and 410°/s and mean durations between 31 and 68 ms
([Gibaldi and Sabatini, 2021](#references)). These are extremely fast movements: an eye can cross
half a keyboard in a few hundredths of a second.

The three fixational movements (microsaccades, drift and tremor) explain why the gaze point never
stands still. The old Kite keyboard had a tolerance of 100 ms for gaze briefly leaving the key, and
of 300 ms for signal loss during a blink
([entry on dwell time](/en/journal/kite-gaze-typing-with-dwell-time/)): this is exactly what they
were for.

### Fixations and saccades, seen from above

![A page of Swedish text with a reader's gaze path superimposed: purple circles on the words mark the fixations, purple lines connecting them mark the saccades; the path proceeds line by line from left to right and returns to the next line with a long saccade.](https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Reading_Fixations_Saccades.jpg/960px-Reading_Fixations_Saccades.jpg)

*The gaze path (scanpath) during speed reading of a text. Data recorded in 2005 at the
Humanistlaboratoriet of Lund University with an SMI iView X 240 Hz video-based pupil–corneal
reflection eye tracker. Image: Lucs-kho at English Wikipedia,
[public domain](https://commons.wikimedia.org/wiki/File:Reading_Fixations_Saccades.jpg), via
Wikimedia Commons.*

The image shows a **scanpath**: the circles are fixations, the lines are saccades. A reader does
not stop on every letter, but on some words, and skips everything else.

**Why it matters for typing.** With a gaze keyboard we ask the eye for something different from
reading: to stop on **every** letter, for a long time. It is an unnatural task, and this is one of
the reasons for the fatigue I discuss later. A path like this one, recorded on the Kite keyboard,
would show where gaze searches for letters before choosing them.

## How a tracker "sees" gaze

### Pupil and corneal reflection

The most widespread remote trackers are **video-oculographs** based on the **pupil center corneal
reflection** (PCCR) method. It is the most common method for estimating the point of gaze
([Feit et al., 2017](#references)). It works like this:

1. One or more **near-infrared** illuminators light up the face. The light is invisible, so it does
   not disturb vision.
2. A camera sensitive to infrared films the eye.
3. The software finds the **centre of the pupil** and the **reflection** of the illuminator on the
   cornea, a small bright dot called the *glint*.
4. When the eye rotates, the pupil moves relative to the reflection. The vector between the two
   centres changes with the direction of gaze.
5. A **calibration**, in which the person looks at a few known points on the screen, teaches the
   system to turn that vector into screen coordinates.

The general theory of this method says something important for wheelchair users
([Guestrin and Eizenman, 2006](#references)):

- with **one camera and a single light source**, the point of gaze can be estimated only if the
  head is **completely stationary**;
- with **one camera and several light sources**, the head can move, after a multiple-point
  calibration;
- with **several cameras and several light sources**, a single-point calibration is enough.

The same authors identify the main sources of error: the real cornea is not a perfect sphere, as
the model assumes, and there is noise in the estimation of the centres of the pupil and of the
reflection.

### Purkinje images

![Cross-section diagram of the eye with a red light ray entering from the right and four green arrows, P1, P2, P3 and P4, showing the reflections produced by the surfaces of the cornea and the lens.](https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Diagram_of_four_Purkinje_images.svg/960px-Diagram_of_four_Purkinje_images.svg.png)

*The four Purkinje images: reflections of the same light on the surfaces of the cornea and the
lens. Image: Z22, licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), via
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Diagram_of_four_Purkinje_images.svg).*

Light striking the eye is reflected by every surface it crosses: the front and back of the cornea,
the front and back of the lens. This produces four reflections, called **Purkinje images** (P1–P4).
The *glint* of PCCR trackers is the first, P1, the reflection on the outer surface of the cornea.
There are also laboratory trackers, called dual-Purkinje-image trackers, that use two of these
reflections ([Crane and Steele, 1985](#references)).

**Why it matters for typing.** The corneal reflection has to fall on the cornea and stay visible.
Feit and colleagues note that thick glasses frames, heavy mascara and reflections can impair
tracking quality ([Feit et al., 2017](#references)).

### Bright pupil and dark pupil

![Infrared image of an eye in which the pupil appears as a bright white disc.](https://upload.wikimedia.org/wikipedia/commons/1/1c/Bright_pupil_by_infrared_or_near_infrared_illumination.jpg)

![Infrared image of the same kind of eye with a black pupil and, inside the pupil, a small white dot: the corneal reflection.](https://upload.wikimedia.org/wikipedia/commons/c/cb/Dark_pupil_by_infrared_or_near_infrared_illumination.jpg)

*Top: bright pupil, with the infrared illuminator close to the camera axis. Bottom: dark pupil, with
the illuminator moved to the side; the small white dot is the glint. Images: Massimo Gneo,
Maurizio Schmid, Silvia Conforto and Tommaso D'Alessio, from figure 1 of
[Gneo et al. (2012)](#references), licensed [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/),
via Wikimedia Commons ([bright pupil](https://commons.wikimedia.org/wiki/File:Bright_pupil_by_infrared_or_near_infrared_illumination.jpg),
[dark pupil](https://commons.wikimedia.org/wiki/File:Dark_pupil_by_infrared_or_near_infrared_illumination.jpg)).*

If the infrared light comes from **close to the camera axis**, the camera collects the light
reflected from inside the eye and the pupil appears **bright**. It is the same effect as red eye in
flash photographs. If the light comes from **the side**, the pupil appears **dark**. In both cases
the corneal reflection is visible as a bright spot ([Morimoto et al., 2000](#references)).

The strength of the bright pupil varies considerably from person to person
([Nguyen et al., 2002](#references)). For this reason some systems alternate the two kinds of
illumination and compare the images: Morimoto and colleagues report that their method also works
for people wearing glasses and under different lighting conditions.

**Why it matters for typing.** A tracker that works well with me may work worse with another
person for purely optical reasons. In the Kite trials I will always have to note glasses, contact
lenses and lighting.

### Electrooculography: the bridge to EEG

There is a second way to measure the eyes, closer to the world of Brain Computer Interfaces (BCIs):
**electrooculography** (EOG). The eye behaves like a small electric dipole, with the cornea positive
and the retina negative. When the eye rotates, the dipole changes orientation and electrodes on the
skin around the eyes measure a change in voltage. During a blink, the eyelid slides over the cornea
and produces an even larger artefact ([Plöchl et al., 2012](#references)).

For anyone recording electroencephalography (EEG), these signals are a nuisance. On frontal
electrodes a blink produces an artefact of about 100 µV, and ocular artefacts can make data analysis
difficult or even impossible ([Plöchl et al., 2012](#references)). For those designing assistive
devices, however, they can be a command: already in 2002 a research group described an electric
wheelchair guided by EOG ([Barea et al., 2002](#references)).

The 2014 [SmartChair](/en/research/smartchair/) prototype used a blink, read by the NeuroSky
MindWave Mobile EEG headset, to change the selected device. **My hypothesis** is that the headset
detected precisely this ocular artefact rather than a brain signal. I have not verified it, and it
is something I want to check.

## What to read: the properties that matter for typing

### Accuracy and precision

These are the two fundamental measures of tracker quality, and they are not the same thing
([Feit et al., 2017](#references); [Niehorster et al., 2018](#references)):

- **accuracy**: the average distance between the point the person is really looking at and the
  point the tracker reports. It is a systematic error, like a misaligned gunsight;
- **precision**: how much the samples scatter when gaze is held still on one point. It is a random
  error, like a shaking hand.

Both are expressed in **degrees of visual angle**. A tracker can be precise but inaccurate (points
close together, but in the wrong place) or the other way round.

Catalogue values should be taken with caution. Manufacturers often report an accuracy below 0.5°,
but with remote trackers the error often exceeds 1° even in controlled conditions
([Feit et al., 2017](#references)). One manufacturer stated that its accuracy figures were measured
under ideal conditions: head fixed in a chinrest, immediately after calibration, constant lighting,
on subjects without lenses, glasses or droopy eyelids ([Niehorster et al., 2018](#references)).
That is, precisely without the conditions encountered with many AAC users.

The study by Feit and colleagues is the most useful one I have found for a gaze keyboard. They
recorded 80 people with two 60 Hz trackers, under two lighting conditions, at 65 cm from the screen
([Feit et al., 2017](#references)). Some results:

- accuracy and precision varied **more than six-fold** across people and targets;
- at the 25th percentile, fixations were 0.15 cm (horizontal) and 0.2 cm (vertical) from the
  target; at the 90th percentile the offset reached 0.93 cm and 1.19 cm;
- the error was on average slightly larger vertically than horizontally;
- precision was worse towards the bottom and right edges of the screen.

The authors repeated the test with six people with ALS who communicate every day with gaze-based
AAC, in the environments and setups they normally use. Precision was similar, but accuracy varied
even more: from 0.16–0.21 cm in the best cases to 1.32–1.67 cm in the worst.

### From degrees to centimetres: how large to make the keys

An error in degrees becomes an error in centimetres depending on the distance between the eyes and
the screen. The formula is simple: the size on the screen equals 2 × distance × tan(angle / 2). In
practice:

| Eye–screen distance | 0.5° on screen | 1° on screen | 2° on screen |
| --- | --- | --- | --- |
| 50 cm | 0.44 cm | 0.87 cm | 1.75 cm |
| 60 cm | 0.52 cm | 1.05 cm | 2.09 cm |
| 65 cm | 0.57 cm | 1.13 cm | 2.27 cm |
| 70 cm | 0.61 cm | 1.22 cm | 2.44 cm |
| 80 cm | 0.70 cm | 1.40 cm | 2.79 cm |

*Values computed with the formula above. At 65 cm the result matches the one reported by Feit and
colleagues (1° ≈ 1.1 cm).*

Feit and colleagues propose a rule for sizing targets. The width (or height) of a key is twice the
sum of the accuracy offset and two standard deviations of the precision: S = 2 × (O + 2σ). This way
about 95% of the samples of a fixation fall inside the key. With their average data the rule gives
keys of about 3.0 × 3.1 cm. Their recommendations ([Feit et al., 2017](#references)):

- keys of at least **1.9 × 2.35 cm** allow reliable interaction for at least 75% of people, if the
  signal is well filtered;
- without a filter, at least **3.28 × 3.78 cm** are needed;
- keys should be slightly taller than they are wide, because the vertical error is larger;
- gaze-enabled elements should be kept away from the bottom and right edges.

Keys this large take up a lot of space. Feit and colleagues show as an example a keyboard that, when
tracking is poor, moves to the top of the screen and groups letters together; hierarchical menus are
another solution, but they slow things down because they require more steps
([Feit et al., 2017](#references)).

In the old Kite keyboard the keys took up almost the whole screen, but I have not yet measured
their size in centimetres or the viewing distance.
[DA COMPLETARE: diagonal of the screen used with Kite, typical eye–screen distance and key size in
cm, so as to compare it with the recommendations of Feit et al.]

### Sampling rate and latency

The **sampling rate** is the number of gaze points per second. Remote trackers usually work between
30 and 60 Hz ([Feit et al., 2017](#references)); the Tobii Eye Tracker 4C I use with Kite delivers
90 samples per second.

Studying saccades requires high rates. For a 10° saccade, at 200 Hz the error in measuring its
duration is about ±5 ms, roughly 12% of the duration; at 50 Hz it becomes ±20 ms, almost half the
saccade ([Gibaldi and Sabatini, 2021](#references)). A dwell keyboard, however, works on time scales
of hundreds of milliseconds. My reasoning is that modest rates are enough for dwell, whereas the rate
becomes important for methods that analyse the shape of eye movements.

**Latency** is the delay between the movement of the eye and the data reaching the program. Part of
it is introduced by the filters used to stabilise the point. The best filter in the Feit study added
a delay of about two samples, that is about 32 ms at 60 Hz, and reduced the required key size by up
to 42% ([Feit et al., 2017](#references)). It is a trade-off: more stability, more delay.
Kristensson and Vertanen, by contrast, used the raw signal precisely to eliminate lag when gaze
moves quickly ([Kristensson and Vertanen, 2012](#references)).

### Calibration and drift

Calibration takes a few seconds, but it does not last forever. With use, the measured point tends
to move away from the real one (*drift*), partly because of the technology and partly because of
the interaction between head and eye movements ([Majaranta et al., 2006](#references)). In
experiments, the tracker is recalibrated at the start of each day of testing and then as needed
([Kurauchi et al., 2016](#references)).

Calibration assumes that the person can hold their gaze still on each point. With **nystagmus**,
an involuntary oscillating movement of the eyes, this does not happen, and it becomes uncertain
where the person is really looking. There are calibration methods designed specifically for this
([Rosengren et al., 2020](#references)).

### Dwell time and the Midas touch

I discussed this at length in the [previous entry](/en/journal/kite-gaze-typing-with-dwell-time/).
In short: the eyes are for looking, so if every glance were a click, every glance would become a
command. This is the "Midas touch" problem ([Jacob, 1991](#references)). Dwell solves it by
requiring a steady gaze longer than a normal fixation. Expert users can go down to around 300 ms,
but only if the keys are large enough for the tracking quality ([Feit et al., 2017](#references)).
Key size and dwell duration should therefore be chosen together.

### Blinking as a click

Blinking is an alternative to dwell. The problem is to tell a **voluntary** blink from a
**spontaneous** one. BlinkWrite, a scanning keyboard controlled only by the eyelids, uses the
duration of the closure ([MacKenzie and Ashtiani, 2011](#references)):

| Closure duration | Meaning in BlinkWrite |
| --- | --- |
| less than 200 ms | involuntary blink, ignored |
| 200 to 500 ms | letter selection |
| more than 500 ms | delete |

With 12 volunteers aged 23 to 31, not yet the users the system is intended for, the mean speed was
4.8 words per minute, with an accuracy above 97%. However, 75% of the participants reported higher
than average eye fatigue. The authors have in mind people, for example with locked-in syndrome, for
whom eye movements are limited and unreliable and blinking may remain the only usable ocular
channel. They also point out that the ability to control blinks needs to be assessed clinically,
for example in late-stage ALS.

### Pupil diameter

The pupil responds to three things: it constricts with light, it constricts when we look at
something near, and it dilates with arousal and **mental effort** ([Mathôt, 2018](#references)).
The idea of using it as an indicator of cognitive load or fatigue is therefore sensible.

On a screen, however, brightness changes constantly with what is being looked at, and the light
response adds to the effort response, which is a small effect ([Mathôt, 2018](#references)). My
conclusion, for now, is that pupil diameter should be **recorded** during trials, but not used as a
command or as a measure of fatigue without controlling for brightness.

### Head, glasses and light

- **Head movements.** When people adopt non-optimal poses, that is, when they turn, tilt or roll
  their head, remote trackers lose data and introduce systematic offsets, to an extent that differs
  from model to model ([Niehorster et al., 2018](#references)). In the same study the Tobii trackers
  reported data for both eyes even when only one was visible.
- **Glasses.** In the EyeSwipe study, half of the participants wore glasses and experienced
  calibration problems, which mainly affected dwell typing ([Kurauchi et al., 2016](#references)).
- **Make-up, frames and reflections.** Heavy mascara, thick frames and reflections can potentially
  impair tracking quality ([Feit et al., 2017](#references)).
- **Light.** In the Feit study, daylight gave on average slightly better values than artificial
  light, but the difference was not statistically significant.

## How to measure a gaze keyboard

Comparing two keyboards requires standard measures:

- **Words per minute** (WPM). By convention a "word" is 5 consecutive characters, spaces included
  ([Majaranta et al., 2006](#references); [Kristensson and Vertanen, 2012](#references)). Characters
  per minute can be counted too.
- **Minimum string distance (MSD) error rate**: counts the errors left in the final text, by
  comparing it with the phrase to be copied.
- **Keystrokes per character** (KSPC): how many selections are needed for each character of the
  final text. If I type a 15-character phrase with 17 selections, because I typed a wrong letter and
  deleted it, KSPC is 17 / 15 = 1.13. Without errors it would be 1.
- **Total error rate**: corrected errors plus remaining errors, divided by all the characters entered
  (correct, wrong and then deleted, wrong and left in), without counting the correction keys. It
  splits into corrected and not corrected errors, so it also shows the effort spent on correcting
  ([Soukoreff and MacKenzie, 2003](#references)).

### Methods compared

Dwell is not the only way to type with gaze. The table reports some results, but beware: these are
different studies, with different people, languages, trackers and amounts of training. They cannot
be compared directly with one another.

| Method | How selection works | Reported speed | Study conditions |
| --- | --- | --- | --- |
| Dwell | Steady gaze for 600 ms on each key | 9.5 WPM | 10 students without disabilities, fourth 10-minute session ([Kurauchi et al., 2016](#references)) |
| EyeSwipe | The first and last letters of the word are selected; for the others it is enough to pass near the keys | 11.7 WPM | Same participants and sessions ([Kurauchi et al., 2016](#references)) |
| Gaze-driven Dasher | Gaze steers a continuous zoom over letter boxes, larger when more probable | Up to 25 WPM after an hour of practice, versus 15 WPM with an on-screen keyboard; about five times fewer errors | Two experts and two novices with Dasher, two experts with the keyboard ([Ward and MacKay, 2002](#references)) |
| Simulated dwell-free | Letters are looked at without stopping; a recogniser guesses the word | 46 WPM in the fifth session | 8 participants, **simulated, perfect** recogniser, not a real system ([Kristensson and Vertanen, 2012](#references)) |
| BlinkWrite | Voluntary blink on a scanning keyboard | 4.8 WPM | 12 volunteers, not yet the users the system is intended for ([MacKenzie and Ashtiani, 2011](#references)) |

![Screenshot of the Dasher program: on the left a large light-blue box with the letter d, on the right smaller coloured boxes with the following letters (e, i, g and others), of different sizes; in the centre a crosshair and a red line indicate the pointer; at the top the text written so far, "Wikiped".](https://upload.wikimedia.org/wikipedia/commons/c/cc/Dasher.png)

*Dasher while typing "Wikipedia". Letters that the language model considers more probable get larger
boxes, so they are easier to reach. Image: Freyr at English Wikipedia, licensed
[GPL](https://www.gnu.org/licenses/gpl-3.0.html), via
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Dasher.png).*

Dasher illustrates well an idea that interests me for Kite: instead of asking the eye to stop on
every letter, **it lets the eye move** and uses a language model to make probable letters easy. The
simulated dwell-free method goes in the same direction: Kristensson and Vertanen conclude that it is
highly unlikely that traditional dwell typing will ever surpass their dwell-free estimate.

## People with motor disabilities: what changes

![A Tobii Dynavox communication device on a mount: the screen shows a grid of large boxes with symbols and German text, including a bar at the top with the words "Pferd" and "Laterne" accompanied by pictograms, and at the bottom left a "Trackstatus" box showing the tracking status.](https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Barrierefreiheit_002_2021_08_31.jpg/960px-Barrierefreiheit_002_2021_08_31.jpg)

*A Tobii Dynavox gaze communication device running symbol-based AAC software in German, photographed
in 2021. Image: Friedrich Haag, licensed
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), via
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Barrierefreiheit_002_2021_08_31.jpg).*

The photo shows how a commercial AAC device applies many of the rules discussed above: **very
large** boxes, few per page, and a box that shows at all times whether the tracker can see the eyes.
It is the opposite choice to a full QWERTY keyboard with small keys.

For people living with a severe motor disability, the limits of the eye and of the tracker weigh
more heavily:

- **ALS.** In 35 people with late-stage ALS, tetraplegia and anarthria, gaze communication devices
  reduced communication disability more than the transparent letter board (ETRAN) and improved
  perceived quality of life ([Caligari et al., 2013](#references)). In a survey of 30 people with
  advanced ALS, however, about one in four (23.3%) made little use of the device; the most cited
  causes were eye-gaze tiredness and oculomotor dysfunction ([Spataro et al., 2014](#references)).
- **From the locked-in to the completely locked-in state.** In a person with ALS followed for nine
  months, at the very end of the locked-in state eye movements were slow and lasted only for short
  periods; in the completely locked-in state they disappeared altogether
  ([Murguialday et al., 2011](#references)). When gaze is gone, only interfaces that do not depend on
  muscles remain. This is one of the reasons why this journal also deals with BCIs.
- **Nystagmus.** The involuntary oscillations make calibration difficult and the gaze point
  unstable ([Rosengren et al., 2020](#references)).
- **Ptosis.** The specifications of at least one manufacturer are measured on people without
  drooping eyelids ([Niehorster et al., 2018](#references)). I infer that with an eyelid covering
  part of the pupil one should expect worse tracking than stated.
- **Fatigue.** Prolonged fixation is tiring, both with dwell and with blinking
  ([Majaranta et al., 2006](#references); [MacKenzie and Ashtiani, 2011](#references)).
- **Posture.** In a wheelchair the head may be tilted or resting to one side, precisely the poses
  that degrade remote trackers ([Niehorster et al., 2018](#references)).

> **Disclaimer.** Kite and SmartChair are experimental projects and **are not certified medical
> devices**. Anyone who depends on an AAC tool to communicate should always have a backup, for
> example a paper alphabet board. If one day I build a tracker with home-made infrared illuminators,
> I will have to check its optical safety before using it on anyone. Trials with people require
> informed consent and, where needed, the approval of an ethics committee.

## What I take away for Kite

![The German Wikipedia main page with a heat map overlaid: red and yellow areas on the text of the featured article and on some images, blue areas at the margins and little or nothing on the side menu.](https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Eyetracking_heat_map_Wikipedia.jpg/960px-Eyetracking_heat_map_Wikipedia.jpg)

*A gaze heat map on the German Wikipedia main page: warm colours show where fixations concentrated.
Image: Tschneidr, licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), via
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Eyetracking_heat_map_Wikipedia.jpg).*

A heat map summarises in one image where gaze rested, by adding up many fixations. **My idea** is to
use one on the Kite keyboard, separating search gaze from gaze that leads to a selection. If the hot
areas were always shifted in the same direction relative to the keys, that would be a sign of an
accuracy error to correct.

From this research I draw a list of things to record in every trial, even before changing the
selection mechanism:

1. tracker model, sampling rate and filters used;
2. eye–screen distance, screen size and key size, in centimetres and in degrees;
3. accuracy and precision measured on known points, at the start and at the end of the session;
4. percentage of lost samples, number of recalibrations, duration and number of blinks;
5. glasses or contact lenses, lighting, posture;
6. pupil diameter, only as data to be analysed;
7. words per minute, KSPC and total error rate, separating corrected and not corrected errors;
8. perceived fatigue at the end of the session.

## Further reading

- The [entry on dwell time in Kite](/en/journal/kite-gaze-typing-with-dwell-time/), with the
  details of the old keyboard.
- The [introductory entry on BCIs](/en/journal/what-is-a-brain-computer-interface/), to understand
  why EOG is an artefact for EEG.
- The study by [Feit et al. (2017)](https://www.microsoft.com/en-us/research/publication/toward-everyday-gaze-input-accuracy-precision-eye-tracking-implications-design/)
  is freely available and is the most practical reference for sizing keys.

## References

1. Barea R., Boquete L., Mazo M., López E. (2002). System for assisted mobility using eye movements
   based on electrooculography. *IEEE Transactions on Neural Systems and Rehabilitation Engineering*,
   10(4), 209–218. [doi:10.1109/TNSRE.2002.806829](https://doi.org/10.1109/TNSRE.2002.806829)
2. Betts J. G., Young K. A., Wise J. A., Johnson E., Poe B., Kruse D. H., Korol O., Johnson J. E.,
   Womble M., DeSaix P. (2022). *Anatomy and Physiology 2e*, ch. 14.1 "Sensory Perception". OpenStax.
   [Freely available text](https://openstax.org/books/anatomy-and-physiology-2e/pages/14-1-sensory-perception)
3. Caligari M., Godi M., Guglielmetti S., Franchignoni F., Nardone A. (2013). Eye tracking
   communication devices in amyotrophic lateral sclerosis: impact on disability and quality of life.
   *Amyotrophic Lateral Sclerosis and Frontotemporal Degeneration*, 14(7–8), 546–552.
   [doi:10.3109/21678421.2013.803576](https://doi.org/10.3109/21678421.2013.803576)
4. Crane H. D., Steele C. M. (1985). Generation-V dual-Purkinje-image eyetracker. *Applied Optics*,
   24(4), 527. [doi:10.1364/AO.24.000527](https://doi.org/10.1364/AO.24.000527)
5. Feit A. M., Williams S., Toledo A., Paradiso A., Kulkarni H., Kane S., Morris M. R. (2017). Toward
   everyday gaze input: accuracy and precision of eye tracking and implications for design. In
   *Proceedings of the 2017 CHI Conference on Human Factors in Computing Systems (CHI '17)*,
   1118–1130. ACM. [doi:10.1145/3025453.3025599](https://doi.org/10.1145/3025453.3025599).
   [Freely available version](https://www.microsoft.com/en-us/research/wp-content/uploads/2017/01/everyday_eyetracking-1.pdf)
6. Gibaldi A., Sabatini S. P. (2021). The saccade main sequence revised: a fast and repeatable tool
   for oculomotor analysis. *Behavior Research Methods*, 53(1), 167–187.
   [doi:10.3758/s13428-020-01388-2](https://doi.org/10.3758/s13428-020-01388-2) (open access)
7. Gneo M., Schmid M., Conforto S., D'Alessio T. (2012). A free geometry model-independent neural
   eye-gaze tracking system. *Journal of NeuroEngineering and Rehabilitation*, 9, 82.
   [doi:10.1186/1743-0003-9-82](https://doi.org/10.1186/1743-0003-9-82) (open access)
8. Guestrin E. D., Eizenman M. (2006). General theory of remote gaze estimation using the pupil
   center and corneal reflections. *IEEE Transactions on Biomedical Engineering*, 53(6), 1124–1133.
   [doi:10.1109/TBME.2005.863952](https://doi.org/10.1109/TBME.2005.863952)
9. Jacob R. J. K. (1991). The use of eye movements in human-computer interaction techniques: what
   you look at is what you get. *ACM Transactions on Information Systems*, 9(2), 152–169.
   [doi:10.1145/123078.128728](https://doi.org/10.1145/123078.128728)
10. Kristensson P. O., Vertanen K. (2012). The potential of dwell-free eye-typing for fast assistive
    gaze communication. In *Proceedings of the Symposium on Eye Tracking Research and Applications
    (ETRA '12)*, 241–244. ACM. [doi:10.1145/2168556.2168605](https://doi.org/10.1145/2168556.2168605).
    [Freely available version](https://www.keithv.com/pub/dwellfree/kristensson-dwell-free.pdf)
11. Kurauchi A., Feng W., Joshi A., Morimoto C., Betke M. (2016). EyeSwipe: dwell-free text entry
    using gaze paths. In *Proceedings of the 2016 CHI Conference on Human Factors in Computing Systems
    (CHI '16)*, 1952–1956. ACM. [doi:10.1145/2858036.2858335](https://doi.org/10.1145/2858036.2858335).
    [Freely available version](https://www.cs.bu.edu/fac/betke/papers/Kurauchi-etal-CHI-2016.pdf)
12. MacKenzie I. S., Ashtiani B. (2011). BlinkWrite: efficient text entry using eye blinks.
    *Universal Access in the Information Society*, 10(1), 69–80.
    [doi:10.1007/s10209-010-0188-6](https://doi.org/10.1007/s10209-010-0188-6).
    [Freely available version](https://www.yorku.ca/mack/UAIS2011.html)
13. Majaranta P., MacKenzie I. S., Aula A., Räihä K.-J. (2006). Effects of feedback and dwell time on
    eye typing speed and accuracy. *Universal Access in the Information Society*, 5(2), 199–208.
    [doi:10.1007/s10209-006-0034-z](https://doi.org/10.1007/s10209-006-0034-z).
    [Freely available version](https://www.yorku.ca/mack/UAIS2006.pdf)
14. Mathôt S. (2018). Pupillometry: psychology, physiology, and function. *Journal of Cognition*,
    1(1), 16. [doi:10.5334/joc.18](https://doi.org/10.5334/joc.18) (open access)
15. Morimoto C. H., Koons D., Amir A., Flickner M. (2000). Pupil detection and tracking using multiple
    light sources. *Image and Vision Computing*, 18(4), 331–335.
    [doi:10.1016/S0262-8856(99)00053-0](https://doi.org/10.1016/S0262-8856(99)00053-0).
    [Freely available version](https://latin.ime.usp.br/wp-content/uploads/2000/03/PupilDetectionUsingMultipleLightSourcesIVC00.pdf)
16. Murguialday A. R., Hill J., Bensch M., Martens S., Halder S., Nijboer F., Schoelkopf B.,
    Birbaumer N., Gharabaghi A. (2011). Transition from the locked in to the completely locked-in
    state: a physiological analysis. *Clinical Neurophysiology*, 122(5), 925–933.
    [doi:10.1016/j.clinph.2010.08.019](https://doi.org/10.1016/j.clinph.2010.08.019)
17. Nguyen K., Wagner C., Koons D., Flickner M. (2002). Differences in the infrared bright pupil
    response of human eyes. In *Proceedings of the Symposium on Eye Tracking Research & Applications
    (ETRA '02)*. ACM. [doi:10.1145/507072.507099](https://doi.org/10.1145/507072.507099)
18. Niehorster D. C., Cornelissen T. H. W., Holmqvist K., Hooge I. T. C., Hessels R. S. (2018). What
    to expect from your remote eye-tracker when participants are unrestrained. *Behavior Research
    Methods*, 50(1), 213–227. [doi:10.3758/s13428-017-0863-0](https://doi.org/10.3758/s13428-017-0863-0)
    (open access)
19. Otero-Millan J., Macknik S. L., Martinez-Conde S. (2014). Fixational eye movements and binocular
    vision. *Frontiers in Integrative Neuroscience*, 8, 52.
    [doi:10.3389/fnint.2014.00052](https://doi.org/10.3389/fnint.2014.00052) (open access)
20. Plöchl M., Ossandón J. P., König P. (2012). Combining EEG and eye tracking: identification,
    characterization, and correction of eye movement artifacts in electroencephalographic data.
    *Frontiers in Human Neuroscience*, 6, 278.
    [doi:10.3389/fnhum.2012.00278](https://doi.org/10.3389/fnhum.2012.00278) (open access)
21. Proudfoot M., Menke R. A. L., Sharma R., Berna C. M., Hicks S. L., Kennard C., Talbot K.,
    Turner M. R. (2016). Eye-tracking in amyotrophic lateral sclerosis: a longitudinal study of
    saccadic and cognitive tasks. *Amyotrophic Lateral Sclerosis and Frontotemporal Degeneration*,
    17(1–2), 101–111. [doi:10.3109/21678421.2015.1054292](https://doi.org/10.3109/21678421.2015.1054292)
    (open access)
22. Provis J. M., Dubis A. M., Maddess T., Carroll J. (2013). Adaptation of the central retina for
    high acuity vision: cones, the fovea and the avascular zone. *Progress in Retinal and Eye
    Research*, 35, 63–81. [doi:10.1016/j.preteyeres.2013.01.005](https://doi.org/10.1016/j.preteyeres.2013.01.005).
    [Freely available version](https://pmc.ncbi.nlm.nih.gov/articles/PMC3658155/)
23. Rosengren W., Nyström M., Hammar B., Stridh M. (2020). A robust method for calibration of eye
    tracking data recorded during nystagmus. *Behavior Research Methods*, 52(1), 36–50.
    [doi:10.3758/s13428-019-01199-0](https://doi.org/10.3758/s13428-019-01199-0) (open access)
24. Soukoreff R. W., MacKenzie I. S. (2003). Metrics for text entry research: an evaluation of MSD
    and KSPC, and a new unified error metric. In *Proceedings of the SIGCHI Conference on Human
    Factors in Computing Systems (CHI '03)*, 113–120. ACM.
    [doi:10.1145/642611.642632](https://doi.org/10.1145/642611.642632).
    [Freely available version](https://www.yorku.ca/mack/chi03.html)
25. Spataro R., Ciriacono M., Manno C., La Bella V. (2014). The eye-tracking computer device for
    communication in amyotrophic lateral sclerosis. *Acta Neurologica Scandinavica*, 130(1), 40–45.
    [doi:10.1111/ane.12214](https://doi.org/10.1111/ane.12214)
26. Strasburger H., Rentschler I., Jüttner M. (2011). Peripheral vision and pattern recognition: a
    review. *Journal of Vision*, 11(5), 13. [doi:10.1167/11.5.13](https://doi.org/10.1167/11.5.13)
    (open access)
27. Vidal M., Pfeuffer K., Bulling A., Gellersen H. W. (2013). Pursuits: eye-based interaction with
    moving targets. In *CHI '13 Extended Abstracts on Human Factors in Computing Systems*, 3147–3150.
    ACM. [doi:10.1145/2468356.2479632](https://doi.org/10.1145/2468356.2479632)
28. Ward D. J., MacKay D. J. C. (2002). Fast hands-free writing by gaze direction. *Nature*, 418, 838.
    [doi:10.1038/418838a](https://doi.org/10.1038/418838a).
    [Freely available version](https://arxiv.org/abs/cs/0204030)
