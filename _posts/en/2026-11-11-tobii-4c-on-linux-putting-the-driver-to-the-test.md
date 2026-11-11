---
ref: tobii-4c-linux-driver-test
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Tobii 4C on GNU/Linux (follow-up): putting the driver to the test"
description: I go back to the five next steps of the third part one by one and check them on the real 4C, without modifying the driver. Two 30-minute sessions without losses, an open output that works, a calibration that does not survive power-off, and pitch moving to the infrared images, for now only offline.
tags: [eye-tracking, tobii, linux, driver, latency, calibration]
---

The three-part series on the protocol of the **Tobii Eye Tracker 4C** ended with a list of five next
steps. In the [first part](/en/journal/tobii-4c-on-linux-1-reading-before-touching/) I read before
touching. In the [second](/en/journal/tobii-4c-on-linux-2-putting-names-to-bytes/) I put names to the
bytes. In the [third](/en/journal/tobii-4c-on-linux-3-from-hypothesis-to-code/) I described the free
driver, `tobii4c-linux`: a chain of goroutines, memory prepared at start-up, a supervisor, tests on
real captures. I had promised to report on how the encounter between the code and the device would
go, however it went.

In this entry I go back to those five steps and check them **one by one**. For each one I say what I
did, what I measured, what went wrong and what remains to be done.

Two premises, before the numbers.

- **The driver was not modified during these tests.** I tested the code as it was. When a check would
  have required changing it, I postponed the check rather than touching the code halfway through a
  measurement.
- **Nobody was sitting in front of the tracker.** In all the live tests the gaze was never valid and
  the face was never found. It is the biggest limitation of this entry, and I repeat it where it
  matters.

## The test environment

| Item | Value |
| --- | --- |
| Tracker | Tobii Eye Tracker 4C, firmware 4.7.0 |
| Processor | AMD Ryzen 9 5950X |
| Linux kernel | 7.2.15 |
| Person in front of the tracker | none |

## The summary

I split the outcomes into three categories, because "not done" can mean very different things.

- **(a) Closed.** The check was done and gave an outcome, positive or negative.
- **(b) Postponed to a future driver update.** The check requires a change to the code that is not
  needed today to use the driver. It is not a failure: it is a matter of order. I will do it when I
  update the driver, not in the middle of a measurement.
- **(c) Needs a person or an action outside the code.** The check requires someone sitting in front of
  the tracker, or a physical or system action, such as unplugging a cable or installing a library. The
  driver is fine as it is.

| Step | Outcome | What remains, and of which kind |
| --- | --- | --- |
| 1. Pipeline over long sessions | **(a) passed**, without a person | same measurement with a person (c); configurable duration and percentiles over the whole session (b) |
| 2. 4C captures in the tests | **(b) postponed** | a recording tool, which `dump` is not |
| 3. Open output | **(a) passed** for UDP | live LSL (c); sending to several destinations (b) |
| 4. Gaze calibration | **(a) negative result** on persistence | new calibration with a person and a clean test by unplugging the cable (c) |
| 5. Pitch from the IR images | ported from the prototype, **verified offline only** | test with a person and an independent reference (c) |

## 1. The pipeline over long sessions

### What I did

I ran the driver for two sessions of **30 minutes** each, with gaze sampling active and the samples
sent to the UDP output. I call them A and C, as in my notes:

- **A**: without the image stream;
- **C**: with the image stream always on, 30 images per second on top of the gaze.

For each session I looked at the two counters described in the third part, `host_drops` (samples
discarded by my computer) and `device_drops` (samples missing from the device's counter), the gaps in
the sequence number `seq` on arrival at the UDP output, the pipeline latency and the sample rate.

The **pipeline latency** is the time between receiving a message from USB and writing the sample to
the output. The driver summarises it every 10 s with two **percentiles**: p50, that is the median
(half of the samples are faster), and p99 (only one sample in a hundred is slower). An example: if in
10 s p99 is 40 µs, in that window at most about 9 samples out of 900 exceeded 40 µs.

### Results

| Session (30 min) | Frames | `host_drops` / `device_drops` | `seq` gaps at UDP | Latency p50 / p99 / max | Rate |
| --- | --- | --- | --- | --- | --- |
| A, without images | 160 529 | 0 / 0 | 0 | 21 / 55 / 640 µs | 89.2 Hz (min 85.9) |
| C, images always on | 161 028 | 0 / 0 | 0 | 20 / 39 / 1339 µs | 89.4 Hz (min 87.6) |

How to read the numbers:

- p50 and p99 are the **medians** of the values computed over the 10 s windows; max is the session's
  **absolute maximum**.
- The **sample age at the receiver**, that is the time between USB reception and the moment the
  program listening on UDP reads the packet, stayed between 39 and 107 µs.
- There was **no resynchronisation** of the reassembler and **no decoding error**.

The highest value, 1339 µs in session C, is about one eighth of the time between two samples (about
11 ms). In these two sessions the pipeline never fell behind.

### Negative results

- **It is not 90 Hz.** With nobody in front, the 4C outputs about **89.2 Hz**, not 90.0 Hz. The
  period, measured on the tracker's clock, is about 11.23 ms, and the device's frame counter is
  **continuous**: no frames are missing, it is the device that produces them a little more slowly. I do
  not yet know whether this also happens with a person in front. In the video further down, with a
  person, the pipeline panel shows 90.0 Hz: it is a rounded instantaneous value, not a session
  measurement, so I take it as a hint, not as an answer.
- **Presence changes on its own.** With the scene empty, the presence state switched from "absent" to
  "present" and back **198 times** in session A and **283 times** in session C. My interpretation is
  that, at least without a person, the presence stream is not enough on its own to tell whether
  someone is in front of the tracker. For Kite this means not using it as the only signal.
- **A comparison that does not hold.** In the driver's README I had described the loss of about one
  frame per minute with the image stream on. In session C it did not happen again. That measurement,
  however, was made with a person in front, and this one was not: the two results are not comparable,
  and I draw no conclusions from them.

### What remains

- **(c)** The same measurement with a person in front, which is the real use case.
- **(b)** With a future driver update: a `-duration` option to set the length of the session, and
  percentiles computed over the whole session, in addition to the 10 s windows.

## 2. 4C captures in the tests

The driver's tests replay real USB captures of the **ET5**, the 4C's successor, as I explained in the
[third part](/en/journal/tobii-4c-on-linux-3-from-hypothesis-to-code/). I wanted to add captures of
my 4C. With today's driver **this cannot be done**, for three reasons:

1. the `dump` tool, described in the
   [second part](/en/journal/tobii-4c-on-linux-2-putting-names-to-bytes/), prints a reading of the
   messages but **does not save them whole**;
2. it **does not record the commands** the computer sends to the device, only what comes in;
3. it **does not remove the serial number**, which appears in the response to the identity strings
   (opcode `0x58c`) and starts with `IS404-`. The ET5 captures I use have the serial number zeroed by
   their author, and I want the same to hold for mine.

This step is **postponed (b)**. With a future update the driver will have a recording option that
writes the messages in the `.hex` format of the existing test captures, with the serial number
zeroed. The 4C captures will then be able to test on the 4C, and not only on the ET5, the
reassembly of split messages and of instalment responses too.

## 3. The open output for Kite and for other programs

### What it is

The open output is the way Kite, or any other program, receives the samples from the driver. Today
there are two.

- **UDP** (*User Datagram Protocol*): a simple network protocol, in which each sample travels in an
  independent packet. By default the driver sends it to the computer itself (`127.0.0.1`, port 5005).
  UDP guarantees neither the delivery nor the order of packets ([Postel, 1980](#references)): this is
  why each packet carries the `seq` number, so that the receiver can notice a gap.
- **LSL** (*Lab Streaming Layer*): a system widely used in laboratories to record and synchronise
  different data streams, for example EEG and gaze, with a timestamp for each sample
  ([Kothe et al., 2025](#references)).

The UDP format is documented in the driver's README and is called **T4CG version 2**. Each packet is
192 bytes long. The first fields are enough to recognise and check it:

| Position (byte) | Content |
| --- | --- |
| 0 | the tag `T4CG`, which identifies the format |
| 4 | the version, 2 |
| 8 | `seq`, the sequence number, with no gaps between forwarded samples |
| 16 | the USB reception time, on the computer's clock |
| 24 | the sample time, on the tracker's clock |

Then come the gaze, the position and rotation of the head, the eyes, the pupils and presence. A
detail that can be confusing: the numbers of the 4C protocol are big-endian, those of the UDP packet
are **little-endian**, the byte order of common computer processors.

### Results

- **A receiver written separately.** I wrote a small receiver in Python, separate from the driver,
  that only knows the documented format. In a 35 s live test it received **3121 packets**, all of
  192 bytes, all with the `T4CG` tag and version 2, with no `seq` gaps. This is the test that matters
  most: a program that shares no code with the driver understands it by reading only the
  documentation.
- **The driver's receiver.** The `tobii4c recv` command received all **321 557** samples of the two
  long sessions of step 1.
- **The tests.** The format tests and the driver's unit tests pass when re-run without the result
  cache; those of the `calib` package also pass with the race detector (`-race`).

### What remains

- **(c)** I **have not tested LSL live**, because `liblsl`, the library it relies on, is not
  installed on the test computer. The driver does not need to change: the library needs to be
  installed.
- **(b)** With a future update: sending UDP packets to **several destinations** at once, for example
  to Kite and to a recording program.

## 4. Gaze calibration

### Two different things the 4C keeps, or does not keep

To turn gaze into a point on the screen the 4C uses two pieces of information stored inside it.

- The **display area**: the size and position of the screen relative to the tracker. I wrote about
  it in the [second part](/en/journal/tobii-4c-on-linux-2-putting-names-to-bytes/).
- The **calibration**: a block of data that adapts the eye model to the person, obtained by having
  them look at a few points on the screen.

### Negative result: after power-off they do not remain

- **The display area.** After the cold power-ons of 5 and 11 November, the 4C's display area measured
  **4 × 4 mm**, the factory value. This contradicts the driver's README, which says the 4C keeps it. I
  **have not yet corrected** the README, and it needs to be done. What I wrote in the second part
  concerned closing the session, with the device still powered: that observation stands, but it must
  not be extended to power-off.
- **The calibration.** On 9 November I unplugged and reconnected the 4C, with `tobii-ws` stopped, a
  service that starts the driver on behalf of another program. After 71 s the device held the
  **factory calibration**: a 1469-byte block, identical to the one I had read on 4 November. I
  conclude that the calibration is **almost certainly lost** when the 4C is left without power.
- **A clue that seems to say the opposite, but does not.** On the morning of 11 November the device
  held a **357 KB** calibration block, much larger than the factory one. It was probably reapplied by
  `tobii-ws`, which at start-up reads the calibration saved in a file (`calibration.bin`) and sends it
  to the tracker. So it **does not prove** that the calibration survived power-off.

The practical consequence, if confirmed, is clear: whoever uses the driver must reapply the display
area and the calibration every time the 4C is powered on. The driver can already do this; no changes
are needed.

### What remains

Both checks are of kind **(c)** and neither requires modifying the driver:

- a **new calibration** with a measurement of its accuracy, which requires a person in front of the
  tracker;
- a **clean persistence test**: physically unplugging the cable with `tobii-ws` stopped, so that no
  program can reapply the calibration, and reading it back at power-on.

## 5. Head pitch from the infrared images

### What I did

In the [8 November entry](/en/journal/tobii-4c-head-pitch-from-the-face/) I had estimated head
**pitch**, the "yes" movement, from the face points found by a neural network, MediaPipe Face
Landmarker ([Google AI Edge, n.d.](#references)), on a webcam. That method is now **ported** into the
driver, on the 4C's infrared (IR) images: 640 × 480 pixels in greyscale, at 30 images per second.

To turn image points into angles one needs to know the camera: its **focal length** in pixels and its
position relative to the tracker. I recomputed this calibration of the IR camera from the session
recorded on 7 November, which contains **698 samples**.

### Results, offline only

| Quantity | Recomputed | Previously saved |
| --- | --- | --- |
| Focal length | 740 px | 730 px |
| Camera position | within about 3.5 mm of the saved one | — |
| Reprojection error | 2.75 px | — |

The **reprojection error** is the average distance, in pixels, between where the camera model places
the points in the image and where they actually are. The smaller it is, the better the model
describes the camera. The two calibrations are close: a difference of 10 px out of 730 is about 1.4 %.

The 9 November session, on the other hand, **contains no usable samples** for this computation.

### Live, with nobody there

With the image stream always on, the estimator processed **all the images**: 30 per second, none
discarded. But with nobody in front it produced **no pitch value**. This is the expected behaviour,
not an error: without a face there is nothing to measure. It does mean, however, that live I verified
the workload, not the estimate.

### The model on the IR images, in a video

The following video is not part of the measured sessions. It is a screen recording of the driver's
telemetry interface, made on 11 November, with **a person in front** of the 4C. It shows one thing
only, but an important one: the Face Landmarker model, designed for colour images, **finds the face
in the 4C's IR images**, and the mesh of 478 points follows it as the person moves closer and further
away, tilts and turns the head, opens the mouth.

<video controls muted playsinline preload="metadata" poster="/assets/img/kite/viso-dalle-immagini-ir-anteprima.jpg" aria-label="About 27 seconds of the &quot;Tobii 4C telemetry&quot; interface: top left, the 4C's infrared image with a person in front; on the face, the green mesh of Face Landmarker's 478 points and the box of the crop passed to the model follow the person moving closer, moving away, tilting and turning the head and opening the mouth. The other panels show gaze, eyes in the tracking volume, head, face model, pupils, presence, device streams and pipeline. The tracker's serial number is covered.">
  <source src="/assets/img/kite/viso-dalle-immagini-ir-anteprima.mp4" type="video/mp4">
  Your browser cannot play the video: you can
  <a href="/assets/img/kite/viso-dalle-immagini-ir-anteprima.mp4">download it here</a> (MP4, 3.1 MB).
</video>

To read the video honestly:

- The values in the **Head** panel, pitch included, are the interface's instantaneous values, **not
  accuracy measurements**: I have not compared them with any reference.
- In the model panel the camera appears calibrated with the saved focal length, 730 px, not with the
  recomputed one.
- I covered the tracker's **serial number**, which the interface shows in two places.
- The video is re-encoded at 30 frames per second for the website.

The doubt from the 8 November entry still stands: that the model finds the face does not yet say how
precisely it measures its rotation on infrared images, dark and taken from below.

### What remains

A test of kind **(c)**: with a person in front, comparing pitch with an **independent reference**. On
Windows Tobii's software provides a head pose, but on Linux it does not exist, so the reference will
have to come from somewhere else.

## What I learned

- **The driver holds up over time, at least idle.** One hour of streaming in two sessions, no sample
  lost, median latency around 20 µs. Without a person, however, I measured the transport of the data,
  not their quality.
- **Measurements without a person have a behaviour of their own.** The slightly lower rate and the
  presence that changes on its own are real results, but they concern an empty scene. I do not extend
  them to the real use case.
- **The 4C forgets when it is switched off.** It is a negative result that contradicts my README, and
  it changes how the device is used: display area and calibration must be reapplied at every power-on.
- **Postponing is not failing.** Two checks are waiting for a driver update. I preferred not to change
  the code during the measurements, so as to know for certain what I was measuring.

## Open problems

- All the live tests are **without a person**: gaze never valid, face never found.
- A single 4C unit, a single firmware (4.7.0), a single computer.
- The driver's README still says that the 4C keeps the display area: this is wrong after a power-off
  and needs to be corrected.
- Pitch from the IR images does not yet have a reference to be compared with.

## Next steps

With a person in front of the tracker, or with an action outside the code **(c)**:

1. Repeat the long sessions of step 1 with a person in front.
2. Run a new calibration and measure its accuracy.
3. Test calibration persistence by physically unplugging the cable, with `tobii-ws` stopped.
4. Test pitch from the IR images with a person and an independent reference.
5. Install `liblsl` and test the LSL output live.
6. Correct the README on the persistence of the display area.

With future driver updates **(b)**:

1. A `-duration` option and latency percentiles computed over the whole session.
2. A recording option in the `.hex` format of the test captures, with the serial number zeroed, to
   add 4C captures to the tests.
3. Sending UDP packets to several destinations.

> **Disclaimer.** Kite is an experimental project and **is not a certified medical device**. The
> driver is unofficial software that uses the tracker in ways the manufacturer did not foresee. The
> 4C's IR images show the face: they are personal data, and publishing them requires the consent of
> the person filmed. Anyone who depends on an AAC tool to communicate should always have a backup.
> Trials with people require informed consent and, where needed, the approval of an ethics committee.

## References

1. Google AI Edge (n.d.). *MediaPipe Face Landmarker*. Official technical documentation.
   [developers.google.com](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)
2. Kothe C., Shirazi S. Y., Stenner T., Medine D., Boulay C., Grivich M. I., Artoni F., Mullen T.,
   Delorme A., Makeig S. (2025). The lab streaming layer for synchronized multimodal recording.
   *Imaging Neuroscience*, 3, IMAG.a.136.
   [doi:10.1162/IMAG.a.136](https://doi.org/10.1162/IMAG.a.136) (open access on
   [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12434378/))
3. Postel J. (1980). *User Datagram Protocol*. RFC 768 (STD 6), RFC Editor.
   [doi:10.17487/RFC0768](https://doi.org/10.17487/RFC0768)
