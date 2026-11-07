---
ref: tobii-4c-linux-awakening
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "The Tobii 4C wakes up after 10 years of hibernation"
description: A 2016 gaming eye tracker with Windows-only drivers. What it can do, what it reports about gaze and head, and how I am starting to explore its protocol to bring it to GNU/Linux with the help of AI.
tags: [eye-tracking, tobii, linux, driver, usb, aac]
---

The eye tracker I use for [Kite](/en/research/kite/), my open Augmentative and Alternative
Communication (AAC) tool, is a **Tobii Eye Tracker 4C**. It came out at the end of 2016 and was
designed for video games. Today it is ten years old.

For those of us who work on GNU/Linux, those ten years have been a **hibernation**. The 4C plugs
into the computer, but without the manufacturer's software the system does not know what to do
with it. In this entry I describe what this device can do, what it reports about gaze and head,
and how I have started exploring its communication protocol to wake it up on a free system.

This is not a report of results: it is the start of a journey. There are no measurements of my own.

## A gaming tracker for less than 200 euros

Tobii announced the 4C in October 2016 as the successor to the Tobii EyeX, priced at 149 dollars
([Coppock, 2016](#references); [Hachman, 2016](#references)). Shipping began in December
([Hachman, 2016](#references)). In Europe, at the start of 2017, the official website sold it for
159 euros ([Painter, 2017](#references)).

It was an accessory for gamers: turning the in-game view by following the gaze, moving the cursor
to where you look, logging into Windows with face recognition ([Hachman, 2016](#references)).
Precisely because it was a mass-market product, it was cheap. For a project that wants assistive
technology to be affordable as well, it is an interesting starting point.

The 4C contains a dedicated processor, the **EyeChip**: an integrated circuit designed for eye
tracking, which processes the images inside the device instead of leaving all the work to the
computer ([Coppock, 2016](#references)). Tobii had introduced the EyeChip in 2015 together with
**IS4**, an eye-tracking platform designed to be integrated into consumer devices
([Minotti, 2015](#references)). In community documentation the 4C is referred to precisely as an
IS4 device ([Eitol, n.d.](#references)).

## Main characteristics

These are the figures from the official specification sheet ([Tobii, n.d.](#references)):

| Characteristic | Value |
| --- | --- |
| Image sampling rate | 90 Hz |
| Illuminators | near infrared (NIR) only, 850 nm |
| Operating distance | 50–95 cm |
| Track box | 40 × 30 cm at a distance of 75 cm |
| Recommended maximum screen size | 27 inches at 16:9, 30 inches at 21:9 |
| Connection | USB 2.0 (BC 1.2), integrated 80 cm cable |
| USB data transfer rate | 100 KB/s |
| Power consumption | 2.0 W on average, brief 5–6 W spikes when the illuminators switch on |
| Size and weight | 17 × 15 × 335 mm, 95 g |
| Recommended operating system | Windows 10, 64-bit |

Two of these figures need explaining.

**90 Hz** means 90 images per second, that is, one roughly every 11 ms. In the
[entry on gaze tracking](/en/journal/how-the-eye-works-and-gaze-tracking/) I explained why this rate
is more than enough for a dwell keyboard.

**Infrared at 850 nm** is invisible to the eye. The tracker illuminates the face and looks in the
images for the pupil and the reflection of the light on the cornea: this is the corneal reflection
technique, described in the same entry.

Connected to my computer, the 4C identifies itself with the USB ID `2104:0127`. The first part,
`2104`, is the vendor code: in the public list of USB IDs it corresponds to Tobii Technology AB
([Linux USB Project, 2026](#references)). The second part, `0127`, identifies the product.

## What the 4C reports about gaze and head

A tracker does not only return "where you are looking". Tobii's official development kit lists
several data streams for trackers of this family, including the gaze point, user presence, gaze
origin and head position ([Tobii Developer Zone, n.d.](#references)). The pieces of information I
am interested in are these:

- **gaze point on the screen**: the coordinates of the point the person is looking at;
- **3D eye origin**: the position of each eye in the space in front of the tracker, in practice the
  centre from which the gaze "starts";
- **pupil diameter**, for each eye;
- **user presence**: whether or not there is a person in front of the tracker;
- **head position and orientation**.

### The head: a pose that isn't there

The last item on the list is the most interesting. The initial exploration showed that the 4C
**does not send a true head-pose stream**. This is consistent with the specification sheet, which
states that head tracking is not computed by the EyeChip and increases the load on the computer's
processor ([Tobii, n.d.](#references)). My interpretation is that, on Windows, the pose is computed
by the software installed on the PC.

If I want the head pose on GNU/Linux, then, I have to derive it myself. The device does give me a
valuable clue: the position in space of the two eyes, that is, of their **corneal centres**, the
centres of curvature of the cornea that gaze estimation models use as a reference
([Guestrin and Eizenman, 2006](#references)).

Head orientation is usually described with three angles
([Murphy-Chutorian and Trivedi, 2009](#references)):

| Angle | Movement | Example |
| --- | --- | --- |
| **Yaw** | rotation about the vertical axis | shaking the head "no" |
| **Pitch** | rotation about the horizontal ear-to-ear axis | nodding "yes" |
| **Roll** | rotation about the axis running from the back of the head to the nose | tilting the head towards a shoulder |

Two points in space already give a lot:

- the **position** of the head, for example from the midpoint between the two eyes;
- **yaw**, because when the head turns one eye moves closer to the screen and the other moves away;
- **roll**, because when the head tilts one eye goes up and the other goes down.

**Pitch**, however, escapes. Imagine a pencil passing through the head from one eye to the other:
the "yes" is a rotation about that pencil. The two eyes lie practically on that axis, so when the
head rotates they stay almost still, and the segment joining them does not change direction. With
only two points, **pitch is not observable**.

It has to be estimated some other way. The idea I will work on is to use the sensor's **infrared
images** with a facial landmark model: a neural network that, given the image of a face, locates
points such as the tip of the nose, the chin and the corners of the mouth. A well-known example is
the Google model that estimates 468 3D points of the face from a single camera
([Kartynnik et al., 2019](#references), preprint). From the position of these points the forward
and backward tilt of the head can also be derived.

## The Achilles' heel: Windows only

The 4C's biggest limitation is not the hardware. It is the software. The official drivers and
programs supported only Windows 7, 8.1 and 64-bit Windows 10; a review at the time explicitly
advised Mac and Linux users against buying it ([Hachman, 2016](#references)). The current
specification sheet still lists 64-bit Windows 10 as the recommended system
([Tobii, n.d.](#references)).

To be fair, experimental Tobii packages for Linux do circulate online, collected by community
projects ([Eitol, n.d.](#references)). They are, however, proprietary binaries, unmaintained and
tied to distributions that are several years old. They are not a foundation on which to build an
open assistive tool.

It is an Achilles' heel I know well. The **first version of Kite**, about twelve years ago, also
ran only on Windows. Back then it was an almost unavoidable choice. Today I believe an open AAC tool
should be able to run on a free operating system, one that anyone can study, modify and install,
even on an old computer.

I am not the first to take this road. For the 4C's successor, the Tobii Eye Tracker 5, the community
has already produced a free reimplementation of the USB protocol for Linux, developed from scratch
from its own USB traffic captures ([Tropaion, n.d.](#references)).

## What I have done: first steps into the protocol

I have started to explore how the 4C talks to the computer. We are at the beginning, and here I
report only a general picture of what has emerged so far.

**Everything in user space.** There is no need for a kernel module, that is, a piece of code added
to the core of the operating system, nor for any proprietary Tobii program. The dialogue with the
device can take place from an ordinary program, through **libusb**, a free library that gives direct
access to USB devices without special privileges ([libusb, n.d.](#references)).

**Two channels and a service "door".** A USB device communicates through *endpoints*, which can be
pictured as the counters of a post office. The USB standard defines several transfer types
([USB Implementers Forum, 2000](#references)). The 4C uses two *bulk* endpoints, suited to moving
blocks of data: one inbound to the computer (IN) and one outbound to the device (OUT). Opening and
closing the session go instead through manufacturer-defined (*vendor*) **control transfers**, a kind
of counter reserved for commands.

**A message-based protocol.** On top of USB runs a message-based protocol, which I refer to as
**TTP**. Each message has a header and a series of **TLV** fields, that is, *type–length–value*. It
works like a parcel label: first it says what is inside, then how big it is, then comes the content.
This way the reader can skip fields it does not know.

**Big-endian.** Numbers are written in **big-endian** order, with the most significant byte first.
An example: the number 258 takes up two bytes, 1 and 2. In big-endian they are written in the order
`01 02`; common PC processors keep them in memory the other way round, `02 01`. If the order is not
swapped, 258 becomes 513.

**Fixed point, not floating point.** Coordinates are not "floating point" numbers (*floats*), the
way programs usually represent them. They are integers to be divided by a fixed, agreed scale. It is
like writing a length in whole millimetres instead of in metres with decimals: 250 mm instead of
0.25 m.

**Split messages and merged messages.** A message does not always arrive whole in a single USB
transfer. Sometimes it is split into several pieces (*fragmentation*), sometimes several messages
arrive stuck together in the same block (*coalescing*). The program therefore has to put them back
together, like someone reassembling a letter sent in several envelopes and separating two letters
that ended up in the same envelope.

**Multiple streams.** The device does not send gaze alone. There are several distinct streams, for
example one for gaze data and one for the sensor's **infrared images**. It is these very images that
make the pitch estimate described above possible.

## The plan: rewriting the driver with the help of AI

The next step is to write a free driver for GNU/Linux. I will work with an **artificial
intelligence (AI) programming assistant**, as I already do for writing this journal with
[Bones](/en/journal/meet-bones/).

The division of tasks I have in mind is this. The AI will help me write and optimise the code,
formulate hypotheses about the meaning of the protocol fields and prepare the tests. I will check
every hypothesis against real data from the device and review every line before it enters the
project.

### Technical goals

1. **No proprietary components.** User space and libusb only, with public code.
2. **A concurrent pipeline.** Reading from USB, reassembling messages, decoding and sending the data
   to other programs will be separate stages working in parallel, like an assembly line. The goal is
   that a slow stage does not block reading from the device.
3. **Zero allocations during streaming.** Asking the system for new memory for every sample can
   introduce unpredictable pauses. The goal is to prepare all the memory at start-up and reuse it.
4. **Low latency.** For a gaze keyboard, a late sample is a wrong sample: the cursor lags behind the
   eyes. The principle I want to follow is that, if the system is overloaded, it is better to lose a
   sample than to accumulate delay.
5. **An open, documented output**, so that Kite and any other program can use the data.

### Properties to extract for assisted typing

The second goal is to understand which properties can be read from the sensor and what they can be
used for in a gaze keyboard. This is my starting list. For now these are **working hypotheses**: I
will have to check which data the 4C actually makes available and with what quality.

| Property | What it indicates | Possible use in Kite |
| --- | --- | --- |
| Gaze point | where the person is looking on the screen | pointer for choosing the key |
| Stability of the point over time | whether the gaze is resting on one point (fixation) | selection by fixation, like [dwell time](/en/journal/kite-gaze-typing-with-dwell-time/) |
| User presence | whether someone is in front of the tracker | pausing the keyboard when the person moves away |
| Eye openness and blinking | whether the eyes are open or closed, or whether a blink has occurred | a voluntary blink as a click, distinguished from a spontaneous one |
| 3D eye origin | distance and position relative to the screen | guiding the person into the right position, signalling when they leave the track box |
| Head pose | position and orientation of the head | alternative input, for example a nod to confirm |
| Pupil diameter | size of the pupil | to be recorded during trials only, not used as a command |
| Infrared images | what the sensor "sees" | diagnosing tracking problems, estimating pitch |

For eye openness I still need to find out whether the 4C provides it directly or whether it will
have to be derived, for example from the temporary loss of the eyes in the data. On pupil diameter I
remain cautious, for the reasons explained in the
[entry on gaze tracking](/en/journal/how-the-eye-works-and-gaze-tracking/): the pupil responds mainly
to light, and the screen changes brightness all the time.

## Open problems

- **The protocol is only partly known.** Many messages and fields do not yet have a clear meaning.
  Some may remain obscure.
- **Pitch from infrared images.** Facial landmark models such as the one by Kartynnik et al. work on
  colour images from an ordinary camera ([Kartynnik et al., 2019](#references)). The 4C's images are
  infrared and taken from close up and from below. I do not yet know whether the model will work well
  on this kind of image.
- **Code written with AI must be verified.** An AI assistant can propose interpretations of the
  protocol that are plausible but wrong. Every hypothesis will have to be checked against real data,
  and the code will need tests that prove it.
- **A ten-year-old device.** The 4C is no longer Tobii's current model. Anyone wishing to reproduce
  the work may only find it second-hand.

## Next steps

1. Complete the map of the messages needed to open the session and receive gaze data.
2. Write the first version of the driver with the goals described above.
3. Find out which of the properties in the table the 4C actually provides.
4. Try the pitch estimate on the infrared images.
5. Document the protocol as I go, including the parts I cannot decipher.

I will report every step here in the journal, dead ends included.

> **Disclaimer.** Kite is an experimental project and **is not a certified medical device**. An
> unofficial driver uses the tracker in ways the manufacturer did not foresee: sending commands whose
> effect is unknown could change its behaviour, including that of the infrared illuminators. Anyone
> who depends on an AAC tool to communicate should always have a backup. Trials with people require
> informed consent and, where needed, the approval of an ethics committee.

## References

1. Coppock M. (2016, October 21). Tobii Eye Tracker 4C adds head tracking for even better gaming
   precision. *Digital Trends*.
   [digitaltrends.com](https://www.digitaltrends.com/gaming/tobii-eye-tracker-4c-announced/)
2. Eitol (n.d.). *tobii_eye_tracker_linux_installer: Installation and testing of tobii eye tracker in
   Ubuntu 18.10* [community repository, unofficial]. GitHub.
   [github.com/Eitol/tobii_eye_tracker_linux_installer](https://github.com/Eitol/tobii_eye_tracker_linux_installer)
3. Guestrin E. D., Eizenman M. (2006). General theory of remote gaze estimation using the pupil
   center and corneal reflections. *IEEE Transactions on Biomedical Engineering*, 53(6), 1124–1133.
   [doi:10.1109/TBME.2005.863952](https://doi.org/10.1109/TBME.2005.863952)
4. Hachman M. (2016, December 19). Tobii Eye Tracker 4C hands-on: Mousing with your eyes has
   surprising potential for gaming. *PCWorld*.
   [pcworld.com](https://www.pcworld.com/article/3146226/tobii-eye-tracker-4c-hands-on-mousing-with-your-eyes-has-surprising-potential-for-gaming.html)
5. Kartynnik Y., Ablavatski A., Grishchenko I., Grundmann M. (2019). Real-time facial surface
   geometry from monocular video on mobile GPUs. *arXiv* (preprint).
   [arXiv:1907.06724](https://arxiv.org/abs/1907.06724)
6. libusb (n.d.). *libusb*. Official website and documentation of the library.
   [libusb.info](https://libusb.info/)
7. Linux USB Project (2026). *List of USB ID's* (`usb.ids`), version 2026.06.26, vendor entry
   `2104`. [linux-usb.org/usb.ids](http://www.linux-usb.org/usb.ids)
8. Minotti M. (2015, October 15). Tobii reveals new eye-tracking chip and platform. *GamesBeat*.
   [gamesbeat.com](https://gamesbeat.com/tobii-reveals-new-eye-tracking-chip-and-platform/)
9. Murphy-Chutorian E., Trivedi M. M. (2009). Head pose estimation in computer vision: a survey.
   *IEEE Transactions on Pattern Analysis and Machine Intelligence*, 31(4), 607–626.
   [doi:10.1109/TPAMI.2008.106](https://doi.org/10.1109/TPAMI.2008.106)
10. Painter L. (2017, January 4). Tobii eye-tracker 4C review: Head- and eye-tracking make the 4C one
    of the best available. *Tech Advisor*.
    [techadvisor.com](https://www.techadvisor.com/article/717550/tobii-eye-tracker-4c-review.html)
11. Tobii (n.d.). *4C Specifications*. Tobii Help Center, official technical documentation.
    [help.tobii.com](https://help.tobii.com/hc/en-us/articles/213414285-4C-Specifications)
12. Tobii Developer Zone (n.d.). *How to get started with developing software for the Eye Tracker with
    the PDK*. Official technical documentation.
    [developer.tobii.com](https://developer.tobii.com/how-to-get-started-with-developing-software-for-the-eye-tracker-with-the-pdk/)
13. Tropaion (n.d.). *Tobii_Linux* [community repository, unofficial: reimplementation of the Tobii
    Eye Tracker 5 USB protocol for Linux]. GitHub.
    [github.com/Tropaion/Tobii_Linux](https://github.com/Tropaion/Tobii_Linux)
14. USB Implementers Forum (2000). *Universal Serial Bus Specification, Revision 2.0*. Standard.
    [usb.org](https://www.usb.org/document-library/usb-20-specification)
