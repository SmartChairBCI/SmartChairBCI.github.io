---
ref: tobii-race-test-bench
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Tobii Race: a driving game to put the 4C to the test on GNU/Linux"
description: The driver reads the Tobii 4C and the face model finds the head in the infrared images. To validate the performance of the whole chain I use a game, Tobii Race. I describe how it is built, how it talks to the driver, the first complete race with the 4C, what it can already measure and what it cannot, and which topics from the literature I will explore for Kite's new keyboard.
tags: [eye-tracking, tobii, linux, game, latency, websocket, aac]
---

In the [entry of 11 November](/en/journal/tobii-4c-on-linux-putting-the-driver-to-the-test/) I put the
free driver for the **Tobii Eye Tracker 4C** to the test. The driver correctly reads the data from the
sensor. With a person in front of it, the MediaPipe Face Landmarker face model finds the head in the
4C's infrared (IR) images, as I had hoped in the
[entry of 8 November](/en/journal/tobii-4c-head-pitch-from-the-face/).

These are two necessary conditions, but they are not enough. What remains to be understood is how the
**whole chain** behaves when someone actually uses it: how much delay it adds, how much the signal
jitters, how often it drops out.

To answer, I chose an unconventional tool: a **game**. It is called **Tobii Race** (repository
`tobii4c-race`). It is a first-person Formula 1 simulator that you drive with your head, while your gaze
decides where to focus. I wrote it on 4 November, with the help of AI as for the driver, and kept
touching it up until the 7th.

In this entry I explain why a game, how it is built, how it talks to the driver, what use it makes of
the head data and what it can measure today. I will say it straight away: **there are no systematic
measurements yet**. This entry presents the tool with which I will make them, together with the
**first complete race** with the 4C, which I recorded on 13 November: I show it in a video, with the
numbers from the log. I close with the
literature topics I want to explore for the new keyboard of [Kite](/en/research/kite/), my open
Augmentative and Alternative Communication (AAC) tool.

## Why a game

The two 30-minute sessions of the 11 November entry had **nobody in front** of the tracker. They
measured the transport of the data, not its quality. The real use case, instead, requires a person in
front who uses the signal, for minutes.

A driving game makes defects visible without having to open a log:

- **latency**, that is the delay between a movement and its effect on the screen, becomes a car that
  steers late and runs wide in the corner;
- **noise**, that is the small random fluctuations of the measurement, becomes a reticle that trembles
  or steering that weaves on the straight;
- **instability**, that is signal losses, becomes a car that stops because the tracker has lost the
  eyes.

The game also always asks for the same thing: the same track, the same lap. The lap time and the gap to
the best lap give a number to compare from one session to the next.

This is **my methodological hypothesis**, not a result. Seeing is not measuring: perception can be
fooled, and the player learns, so one session is not the same as the previous one. This is why the game
also shows telemetry, and the numbers will have to come from recorded data, not from impressions.

## The game in brief

| Control | Signal | How it works |
| --- | --- | --- |
| Steering | head turned (yaw) or tilted sideways (roll) | relative to the neutral position, over the range measured during calibration |
| Throttle and brake | head forward or back (pitch) or distance from the screen | as above: forward accelerates, back brakes |
| Focus and reticle | gaze | gaze does **not** control the car |
| Automatic stop | gaze absent for more than 300 ms, nobody in front, no data or connection lost | throttle cut, progressive braking, steering returning to straight |

The names of the angles are those of the 8 November entry: **pitch** is the head's "yes", **yaw** the
"no", **roll** the head tilting towards a shoulder.

The rest serves to make the tests repeatable and readable:

- a semi-transparent **ghost** of the fastest lap of the session, which replays that lap and shows in
  real time the gap at the same point of the track;
- a **telemetry** panel (T key) with sensor, controls, car and graphics, and a drawing of the head and
  eyes updated in real time;
- a **mouse and keyboard** mode, to try the game without the sensor;
- adjustable and adaptive graphics quality, for less powerful computers.

One choice matters more than the others: **the gaze does not drive**. In the
[entry on dwell time](/en/journal/kite-gaze-typing-with-dwell-time/) I described the "Midas Touch"
problem: if every glance becomes a command, you can no longer look without commanding
([Jacob, 1991](#references)). In the game the eyes remain free to look at the road and the commands
come from the head. My reading is that this choice also separates the two signals: if the car steers
late, the problem is in the head chain; if the focus follows the gaze with a delay, it is in the gaze
chain.

### How it changed in four days

The commit history tells the story:

1. **4 November, first commit.** The game read the 4C in two ways: with the Linux driver on the same
   machine, or from a Windows machine, physical or virtual, with the Tobii Stream Engine, Tobii's
   official library, through a bridge in C.
2. **4 November, a few hours later.** I removed the Windows path: today the 4C is read **only** with the
   Linux driver. The commit lists the checks that were made: tests, build of the server and of the
   game, the server with the simulator and with the 4C held by another program.
3. **4 November, evening.** The ghost lap, with the real-time gap.
4. **7 November.** Touch-ups to the visual identity and to the depth-of-field blur.

## The architecture

The system has three pieces, all on the same GNU/Linux machine:

```text
 Tobii 4C ──USB──► tobii4c run        driver, child process of tobii-ws
                      │  UDP 127.0.0.1:<port>    T4CG v2, 192 bytes, one packet per sample (~90 Hz)
                      │  stderr                  JSON log: identity, display area,
                      │                          calibration, USB state
                      ▼
                   tobii-ws (Go)
                      ├─ internal/tobii4c   driver start-up, decoding, pose hold,
                      │                     delayed presence, head at 30 Hz
                      ├─ internal/stream    current state and events → JSON messages
                      └─ internal/hub       one queue per client: drop, never build up delay
                      │  WebSocket ws://127.0.0.1:8765/ws, JSON, protocol v1
                      ▼
                   browser: Tobii Race (TypeScript, Three.js, WebGL2)
                      ├─ net/          connection, reconnection, ping/pong
                      ├─ input/        One Euro filters, head calibration,
                      │                automatic stop, eye movements
                      ├─ sim/          fixed-step physics (120 Hz), laps, ghost
                      └─ render/, ui/  gaze-driven depth of field, HUD, telemetry
```

A few acronyms before going on:

- **UDP** is a simple network protocol in which each packet travels on its own. I discussed it in the
  11 November entry, together with the **T4CG** format that the driver uses for its packets.
- **WebSocket** is a standard protocol that keeps a two-way connection open between the browser and a
  server ([Fette and Melnikov, 2011](#references)). It is needed because the browser cannot read the
  driver's UDP packets directly.
- **JSON** is a text format for structured data, readable even by eye.
- **Three.js** is a JavaScript library for 3D graphics in the browser; **WebGL2** is the interface
  through which the browser uses the graphics card.
- **HUD** (*head-up display*) is the information drawn on top of the scene: speed, laps, reticle.

| Component | Language | What it does |
| --- | --- | --- |
| `tobii4c run` | Go | the driver from the previous entries, used as it is |
| `tobii-ws` | Go, no C code | starts the driver, reads its samples and its log, sends them over WebSocket |
| `wsprobe` | Go | command-line diagnostic client |
| Tobii Race | TypeScript, Three.js | the game, served as static files |

### From the sensor to the screen, step by step

1. The 4C sends the gaze samples over USB, about 90 per second.
2. The driver reassembles them, decodes them and writes each one into a T4CG packet on a local UDP port.
3. `tobii-ws` reads the packet, computes the internal latency, counts lost packets, decides whether to
   publish the head pose and the presence, and prepares a gaze event.
4. The current state turns the event into a JSON `frame` message, with the last known head pose.
5. The hub queues the message for each connected browser; one goroutine per client writes it to the
   WebSocket.
6. In the browser the client receives the `frame` and passes it to the filters: the gaze goes to the
   reticle and the focus, the head to the controls.
7. At each drawn frame the game reads the controls, advances the physics in steps of 1/120 s, updates
   the ghost and draws the scene.

## How the game talks to the driver

`tobii-ws` does not include the driver as a library and does not talk to USB. It uses the driver **as
it is**, as a separate program, through two channels that the driver already offers to anyone: the UDP
output and the log.

### Start-up

1. **It finds the executable** `tobii4c`: the one given with `-tobii4c-bin`, otherwise in the `PATH`, in
   `~/.local/bin` or in `~/go/bin`. If it is not there, `tobii-ws` stops with the error "driver non
   trovato" (driver not found).
2. **It opens a UDP port** on `127.0.0.1`, chosen by the operating system.
3. **It starts the driver** as a child process. With the default settings the command line is:

   ```text
   tobii4c run -udp 127.0.0.1:<port> -log-format json -stats 10s -headpose on \
               -headpose-images-always -calibration ~/.config/tobii4c/calibration.bin
   ```

   `-calibration` appears only if the file exists and is not empty; with `-tobii4c-headpose=false` it
   becomes `-headpose off`; further arguments are added with `-tobii4c-args`.
4. **It reads the driver's log**, line by line, from the error output (*stderr*). It waits up to 10 s
   for the line saying that the gaze stream, stream `0x500`, is active. If an error arrives first, it
   classifies it: no 4C connected, 4C held by another process, missing USB permissions.

### Two channels

| Channel | Format | What it carries | How `tobii-ws` uses it |
| --- | --- | --- | --- |
| Local UDP | T4CG v2: 192 bytes, little-endian, one packet per sample | gaze, head, eyes, presence | decodes each packet without allocating memory |
| stderr | the driver's JSON log, one line per event | identity, display area, applied calibration, USB state | recognises some messages by name |

From the T4CG packet `tobii-ws` reads only the fields it needs:

| Offset (bytes) | Field | Use in `tobii-ws` |
| ---: | --- | --- |
| 0, 4 | `T4CG` tag, version | recognise the packet (it also accepts v1, 120 bytes long) |
| 6 | validity flags | gaze (bit 0), eyes tracked (bits 2 and 3), head position (bit 6), pitch, yaw and roll (bits 7, 8 and 9) |
| 8 | `seq`, sequence number | count the packets lost between the driver and `tobii-ws` |
| 16 | `host_ns`, USB reception time | internal latency |
| 24 | `device_us`, 4C clock | timing of the pose hold and of the head rate |
| 32 | filtered gaze, normalised on the display area | gaze |
| 48 | head position, in mm from the centre of the screen | position |
| 60 | head rotation, in radians | pitch, yaw and roll, converted to degrees |
| 120 | v2 validity flags | which eye has a valid position (bits 0 and 1) |
| 124 | presence | present, away or unknown |
| 136, 148 | position of the two eyes, in mm from the centre of the screen | pose hold when the 4C loses an eye |

The rest is not used: the unfiltered gaze, the pupils, the eyelid openness and the bits that say
whether a head angle comes from the face or from the eyes. So today `tobii-ws` **does not know** which
of the two sources a yaw value comes from.

From the log, instead, it reads these messages:

| Driver message | Effect in `tobii-ws` |
| --- | --- |
| `usb device opened` | USB address and serial number; the calibration goes back to "not applied" |
| `device identity` | serial number, model, generation, firmware |
| `display area (device)`, `display area set` | display area, that is the three corners of the screen in mm |
| `calibration applied`, `calibration apply failed` | personal calibration active or not |
| `subscribed` with stream `0x500` | the first time: the 4C is ready; afterwards: reconnection after an unplug |
| `session ended, reconnecting`, `usb device disconnected` | `disconnected` state for the browsers |
| an `errore: …` line, not JSON | the reason the driver stopped |

### What `tobii-ws` does with each sample

1. **Internal latency.** It subtracts `host_ns` from the current time, both on the system clock. It
   discards negative values or values above 1 s.
2. **Lost packets.** It counts the gaps in the sequence number.
3. **Pose hold.** When you turn your head, the 4C loses the farther eye and with it the pose derived from
   the two eyes. `tobii-ws` then holds the last valid values of position, yaw and roll as long as the
   4C sees at least one eye, for at most 2 s (`-tobii4c-hold`); the held position follows the remaining
   eye. With no eye at all, for example during a blink, it holds them for only 250 ms. These frames have
   `held: true`.
4. **Head at 30 Hz.** The driver computes the pose at every sample; `tobii-ws` publishes at most one
   every 30 ms on the 4C's clock, or immediately if the validity of an angle changes. The head filter in
   the game is tuned for 30 poses per second.
5. **Delayed presence.** It publishes "away" only after 750 ms of continuous absence; "present"
   immediately. In the 11 November entry, with an empty scene, presence had changed on its own 198 and
   283 times in 30 minutes, and I had concluded that it is not enough as the only signal. Here it is
   filtered and the game uses it together with other signals.
6. **Gaze.** One event per sample.

### Calibration goes through the game

The 4C opens in exclusive mode: one program at a time. To calibrate, `tobii-ws`:

1. stops the driver with an interrupt signal (`SIGINT`), so that the driver closes the session in an
   orderly way; after 3 s without a response it kills it;
2. starts `tobii4c calibrate` or `tobii4c headpose-calibrate`, full screen on the tracker's monitor
   (`-monitor`);
3. sends the browsers the `setup` state and the progress messages;
4. when the window closes, restarts the driver and the stream resumes.

The request can come from the game, from the command line (`-setup`) or by itself at start-up, if the
`calibration.bin` or `display.json` files are missing.

The calibration identifier that the game shows is the CRC32, a small numerical fingerprint, of the
`calibration.bin` file. It is published only if in that USB session the driver wrote
`calibration applied`; otherwise it is 0, and the game warns that the gaze is less accurate. The driver
reapplies the calibration at every connection: this is the answer to the negative result of
11 November, the 4C forgetting it when powered off.

One last safety detail: if `tobii-ws` dies without stopping the driver, the operating system sends the
driver a termination signal (`SIGTERM`), so the 4C is not left held by an orphan process.

## The message protocol

Each message is a JSON object. The protocol is at version 1.

| Message | Direction | When | Content |
| --- | --- | --- | --- |
| `hello` | server → browser | on connection and every time the tracker is reopened | version, source (`tobii4c` or `sim`), device, screen, calibration, state |
| `frame` | server → browser | at every gaze sample; with no gaze for 100 ms, one every 100 ms with `stale: true` | gaze, last head pose, presence, `lat` |
| `status` | server → browser | at every state change | `starting`, `connected`, `disconnected`, `error`, `no-device`, `setup` |
| `calibration` | server → browser | when it changes | calibration identifier, 0 if missing |
| `setup` | server → browser | during calibration | `started`, `step`, `done`, `error`, `refused` |
| `stats` | server → browser | every second | gaze and head rates, percentage of valid gaze, dropped samples, connected browsers |
| `pong`, `error` | server → browser | in response | the time of the `ping`; the reason for an invalid request |
| `ping` | browser → server | every second | the browser's time, to measure the round trip |
| `setup` | browser → server | on request | opens the calibration on the sensor's computer |
| `hello` | browser → server | on request | asks for the `hello` message again |

A `frame`, with the example values from the game's documentation, **not a measurement**:

```json
{"type":"frame","seq":812,"t":9031.2,
 "gaze":{"x":0.5123,"y":0.4410,"valid":true},
 "head":{"pitch":-4.21,"yaw":1.03,"roll":0.12,"x":12.0,"y":-35.2,"z":604.8,
         "rotValid":true,"pitchValid":true,"yawValid":true,"rollValid":true,
         "posValid":true,"seq":271},
 "presence":"present","lat":0.42}
```

How to read it:

- the **gaze** is normalised on the screen configured in the driver: (0, 0) at the top left, (1, 1) at
  the bottom right; it can leave this range when looking beyond the edge;
- the **head** has its angles in degrees and its position in millimetres from the centre of the screen,
  with X to the right, Y upwards and Z towards the person;
- `pitchValid`, `yawValid` and `rollValid` say which angles to use, because with the driver they can be
  missing one at a time; `rotValid` is true only if all three are there;
- `t` is the time in milliseconds on the server's clock; `lat` is the internal latency, also in
  milliseconds; `seq` is the server's message counter, not the driver's.

Besides the WebSocket, `tobii-ws` answers `GET /status` with the state in JSON, and the `wsprobe`
program prints every second the frames received, gaze, head, `lat` and round-trip time.

## The hub: better to lose a frame than to build up delay

A slow browser, or a congested network, must not slow down the others or make the delay grow. The rule,
written in the hub's code, is that an old frame is of no use: the next one is what matters.

- Each browser has a **queue of 128 messages**, about 1.4 s of frames. If it is full, the message for
  that browser is dropped and counted; the publisher never waits.
- After **450 consecutive drops**, about 5 s, the browser is disconnected. It reconnects by itself and
  starts again from `hello`.
- The same rule applies upstream, inside `tobii-ws`: the part that reads the driver passes events to the
  rest of the server over a 512-slot queue, without blocking; if it is full, the sample is dropped and
  counted.
- WebSocket compression is off: a comment in the code says "latency and CPU first of all", where the CPU
  is the processor.

In the browser, the client reconnects by itself with increasing waits, from 0.5 s up to 4 s, and counts
the frames it actually receives every second.

## Simulated mode and tests

With `-source sim` a **simulated tracker** takes the place of the 4C, with the same protocol:

- gaze at 90 Hz, with random noise of standard deviation 0.004 in normalised units, and head at 30 Hz;
- a "simulated driver": the gaze slowly sweeps around the centre and the head tilts forward and back,
  so the car steers, accelerates and brakes continuously;
- periodic gaze losses: with `make sim`, 1.5 s every 30 s, to test the automatic stop;
- the calibration is simulated too, with 2 s steps.

The server's automated tests cover the protocol, the hub, the simulator and the `tobii4c` source. For
the latter the test program plays the part of the driver: it writes a JSON log and sends T4CG packets
over UDP, and so checks start-up, identity, display area, calibration, reconnection, lost packets, head
at 30 Hz, delayed presence and errors, such as a missing 4C or missing permissions. On 13 November
Bones re-ran them with `go test ./...`: they all pass. They check the **logic**, not the performance.

## Deployment

- **`tobii-ws` runs on the tracker's machine, not in a container.** Next to it runs the driver, which
  must open the USB port and, for the calibrations, the windows of the graphical session. `make
  install-sensor` installs it in `~/.local/bin` with a user service for **systemd**, the GNU/Linux
  service manager. The service restarts by itself after 3 s in case of failure and declares itself in
  conflict with `tobii4c.service`, the driver-only service, which would keep the 4C busy.
- **The game is made of static files.** Vite, the build tool, packages it with no dependencies on the
  Internet. It is served with `make play` or with **Docker Compose**: the build uses Node 22 and the
  final image contains only **nginx**, a web server, with the game's files. At each container start a
  script writes `config.js` with the address of `tobii-ws` taken from the `TOBII_WS_URL` variable. The
  container does not use the graphics card and does not forward the stream: the browser connects
  directly to `tobii-ws`.
- **From another computer** on the network, `tobii-ws -addr 0.0.0.0:8765` is needed, preferably with
  `-origins` to restrict the pages that can connect. Behind HTTPS the browser accepts only `wss://`, the
  encrypted version of WebSocket.

## The face and the head in the game

### Where MediaPipe lives

The game does **not** contain MediaPipe and does not see the images. All the work on the face happens
in the driver, which, as I described on 11 November, now includes the method of the 8 November entry:
the face landmark network of Face Landmarker ([Google AI Edge, n.d.](#references)), embedded in the
binary, applied to the 4C's IR images.

`tobii-ws` turns it on by default (`-headpose on`) and keeps the images active even when the 4C marks
the person as away (`-headpose-images-always`). The reason, written in the code: the 4C also marks as
away someone who is in front of it but has lost their eyes for a moment, and the pitch must not stop
with them. According to the game's README, estimating from the images costs about two thirds of a
processor core.

### Which angle controls what

| Axis in the game | Quantity | Where it comes from in the driver | Note |
| --- | --- | --- | --- |
| Pedals "tilt" (default) | pitch | only from the face in the IR images | without a face or without a calibrated camera, the pedals stay still |
| Pedals "lean" | distance from the screen | from the eyes | does not require the images |
| Steering "rotation" (default) | yaw | from the face; from the eyes if the face is missing | according to the game's README, from the eyes it is underestimated about 5 times |
| Steering "side tilt" | roll | from the face or from the eyes | an alternative that also works without images |

The head position is used elsewhere too: eye-movement recognition uses it to turn a displacement on the
screen into a visual angle, and the telemetry drawing uses the angles to orient the head and the eyes.

### From pose to command

1. **Head calibration in the game**, in five steps: neutral, throttle, brake, steer left, steer right.
   Each step has 1.5 s (the first) or 2.5 s of preparation and 2 s of capture, of which the game takes
   the median. At least 10 valid poses are needed, with a minimum range of 3° (or 20 mm with the "lean"
   axis) for the pedals and 4° per side for the steering, in opposite directions.
2. **Neutral at the start lights.** At every start the game re-measures the neutral position during the
   start lights, but only if the head is still: the spread between the 10th and the 90th percentile of
   the samples must stay within 3° (20 mm with the "lean" axis). Otherwise it keeps the neutral from the
   calibration.
3. **Filter.** The angles go through a One Euro filter, tuned for 30 poses per second.
4. **Shaping the command.** A dead zone, by default 8 % of the range for steering and 15 % for the
   pedals, then a progressive curve and a gain. The physics limits how fast the steering turns and
   reduces the wheel angle at high speed.

The game uses only **changes relative to neutral**. The fixed pitch offset of about 4° found on
11 November therefore does not matter here.

The game's README also gives a practical limit: beyond about 25° of rotation the 4C loses the eyes, and
with them the gaze, and the automatic stop kicks in. This is why it recommends calibrating the steering
on moderate rotations, between 10° and 20°.

### The gaze: filter, reticle, eye movements

The gaze, too, goes through a **One Euro** filter, which I introduced in the 8 November entry
([Casiez et al., 2012](#references)): it smooths a lot when the gaze is still and little when it moves
fast. In the game it has two different settings:

| Signal | Minimum cutoff frequency | Speed coefficient (β) | Detail |
| --- | --- | --- | --- |
| Gaze | 2.5 Hz | 2.0 | it resets if the point jumps by more than 6 % of the window, that is during a saccade |
| Head | 1.5 Hz | 0.05 | updated at every new pose, at 30 Hz |

The game also recognises **eye movements** with an angular-velocity threshold classifier, of the family
described by Salvucci and Goldberg ([2000](#references)):

- **saccade**, that is a rapid shift of the gaze, above 75 °/s (it ends below 45 °/s);
- **smooth pursuit**, above 7 °/s for at least 100 ms;
- **fixation**, everything else;
- **blink**, gaze absent for between 60 and 500 ms with the person present; beyond that, the gaze is
  lost.

I use it only for telemetry. The thresholds are fixed in the code; I have not yet checked them against
recorded data.

### Focus follows the gaze

In the game the gaze does not control the car: it decides **where the image is sharp**. The game
simulates the eye's focusing with a **depth of field** (DOF): the point being looked at is sharp, the
rest is more or less blurred. This makes the quality of the gaze visible. If the point is right and
arrives on time, the sharp area is where I am looking; if the signal is late or jittery, sharpness
arrives later or moves on its own.

Here is how it works, in the code:

1. **The reticle.** A small reticle follows the gaze point on the screen, already passed through the
   One Euro filter. Below the reticle a label shows the focus distance, for example "fuoco 65 m"
   ("focus 65 m"). When the gaze is not valid, the reticle turns red and more transparent.
2. **The distance of the point looked at.** The game casts a ray from the virtual camera through the
   gaze point and looks for the first object it meets: the tarmac, the barriers, the cockpit, the
   scenery, the ghost when it is visible. It does so at every frame with high quality, about 30 times
   per second with the light one.
3. **Accommodation.** The focus does not jump straight to the new distance: it gets there gradually,
   like an eye re-accommodating. The calculation is done in dioptres, that is on the inverse of the
   distance, with a default time constant of 80 ms.
4. **The blur.** For each pixel the game computes two blurs and applies the larger one:
   - a **circular** one, around the gaze point: sharp within a radius equal to 12 % of the screen
     height, then increasingly blurred towards the edges, like peripheral vision;
   - a weaker **depth** one, which grows with the difference in dioptres between the pixel's distance
     and the focus distance, as with a lens. Looking at the distant road blurs the cockpit; looking at
     the cockpit blurs the road.

The circular component is the main one. The comment in the code explains why: on a flat track all
points on the same row of the screen are at the same distance, so depth alone would make a horizontal
band sharp, not the point being looked at.

The depth of field has three levels: off, light and high. The light level blurs an image reduced to a
quarter of the resolution, with a single blur pass; the high level works at half resolution, with two
passes. The radius of the sharp area, the focus time and the strength can be adjusted from the menu.
In the 13 November race they had the default values (12 %, 80 ms, ×1), with the light depth of field.

## What it measures today, and what it does not

| Quantity | Where it is shown | Which stretch of the chain it covers |
| --- | --- | --- |
| `lat` | in every frame; in the sensor card and in telemetry as "interna" (internal) | from USB reception in the driver to the moment `tobii-ws` prepares the message |
| Round trip | in the sensor card and in telemetry as "rete" (network) | WebSocket, from the browser to `tobii-ws` and back, once per second |
| Rates, valid gaze, drops | `stats` message, every second; in the `tobii-ws` log every 10 s | the stream in the server |
| Frames received per second | in the browser | how many frames actually reach the game |
| Frames per second (FPS) and frame time | in telemetry | the drawing |
| Lap time and gap to the ghost | in the HUD | how well one drives |

What is missing:

- **End-to-end latency.** `lat` stops before the message is encoded and sent. Left out are the
  WebSocket, the wait for the browser's next frame (the game reads the controls once per frame), the
  drawing and the monitor. Also left out is the time the 4C takes before sending the sample over USB.
- **A recording.** The telemetry is shown on screen but not saved to a file. The browser saves only the
  settings, the head calibration, the session ghost and the lap record.

The repository contains a few notes, in the game's README, which I report for completeness with a
warning: **they do not say how many sessions, how long, or how they were measured**. I take them as
clues, not as measurements.

| Note in the README (4 November, firmware 4.7.0) | How I read it |
| --- | --- |
| stream at 90 Hz, head at 30 Hz | 90 Hz is the nominal value: on 11 November, without a person, I measured 89.2 Hz |
| internal latency of about 0.1 ms "from USB reception to WebSocket sending" | in the code the value stops before the write to the WebSocket |
| with a person: yaw from the face between −24° and +36°, valid in 99 % of poses; pitch ±20° | one person, no independent reference |
| checked with the simulator and with a test autopilot: a complete lap in 1:20.6, with hits against the barriers | a check of the game logic, not of the sensor |
| with the real 4C, head calibration and steering checked; **a complete race is still to be tried** | I ran it on 13 November: I describe it below |

### The first complete race, in a video

On 13 November I drove Tobii Race with the 4C, sitting in front of the tracker, and recorded the
screen. It is the **first complete race with a person**: three laps and the start of the fourth, in
about four minutes.

<video controls playsinline preload="metadata" poster="/assets/img/kite/tobii-race-prima-gara.jpg" aria-label="Video of about 4 minutes of Tobii Race driven with the Tobii 4C. At the start, the game's start screen with the sensor card: sensor connected, gaze at 90 Hz and head at 30 Hz; the tracker's serial number is covered. Then the start at the lights and three laps of the track in first person from the cockpit of a green single-seater: on the left the telemetry panel, top right the lap time and the track map, bottom right the webcam filming the driver, who turns and tilts the head to steer, accelerate and brake. At the end the game is paused.">
  <source src="/assets/img/kite/tobii-race-prima-gara.mp4" type="video/mp4">
  Your browser cannot play the video: you can
  <a href="/assets/img/kite/tobii-race-prima-gara.mp4">download it here</a> (MP4, 18.6 MB).
</video>

What you can see:

- **The sensor card**, in the first seconds: sensor connected, gaze at 90 Hz with 100 % valid samples,
  head at 30 Hz, gaze calibration saved by the driver, display area of 700 × 390 mm. At that moment the
  latency shown is 0.4 ms for the WebSocket round trip and 0.04 ms for `lat`.
- **The default controls**: steering with head rotation (yaw), throttle and brake with head tilt
  (pitch), with the head calibration made on 4 November.
- **The race**: the lights, then the track. On the left the telemetry, top right the times and the map,
  bottom right the webcam filming me as I drive with my head. The reticle with the "fuoco" (focus)
  label follows my gaze, and around it the image is sharp while the edges stay blurred.

Lap times, read from the HUD:

| Lap | Time | Gap | Note |
| --- | --- | --- | --- |
| 1 | 1:23.450 | — | first lap: it becomes the ghost |
| 2 | 1:10.800 | −12.65 s on the ghost | it becomes the new ghost |
| 3 | 1:12.167 | +1.37 s on the ghost | |

The times panel also shows a record of 1:08.684. It does not come from this race but from earlier
sessions that I did not record: the browser keeps it.

Meanwhile `tobii-ws` wrote to its log, every 10 s, the statistics of the last second. The 25 lines that
fall within the video say:

| Quantity | Values in the 25 lines |
| --- | --- |
| Gaze | between 89.9 and 91.0 Hz, mean 90.1 Hz |
| Valid gaze | 100 % in all of them |
| Head | between 30 and 33 Hz, mean 30.2 Hz |
| Dropped | 0 |

The dropped counter is cumulative: it adds up the samples missing from the UDP sequence, those the
source let go because the server was late and those dropped by the hub. It stayed at zero for the
whole life of the process, from 9:21 to 9:34, so also before and after the race.

How I read this test:

- **It answers one question only**: does the chain hold up in a real race, with a person in front,
  without losing data? For these four minutes, yes.
- **It is not a systematic measurement.** It is one session, one person, one tracker. The log lines are
  1 s samples taken every 10 s: they do not rule out brief gaze losses between one sample and the next.
  I did not count the automatic stops, because the game does not record them.
- **It does not measure end-to-end latency**, nor noise: for those I need the recording and the
  external method described below.
- **The second lap is 12.65 s faster than the first.** I read it mostly as learning the track, the
  effect I mentioned at the beginning: on its own it says nothing about the quality of the signal.

To read the video honestly:

- I cut the first and last seconds, which showed the desktop and the recording program.
- I covered the tracker's **serial number** in the sensor card.
- The video is reduced to 1280 × 720 pixels for the site: the telemetry on the left is only partly
  readable. The audio is the original one from the recording.

### What I will measure

1. **Record every race to a file:** frames received, `lat`, round trip, states, automatic stops with
   their cause and lap times. It is a tool still to be written.
2. **Races with a person in front**, with their informed consent, over several sessions: distributions
   of `lat` and of the round trip, percentage of valid gaze, drops, number and causes of stops.
3. **End-to-end latency**, with an external method. Saunders and Woods ([2014](#references)) briefly
   blind the tracker with infrared LEDs, which triggers a change on the screen, and film both events
   with a camera at 1000 frames per second; the time between the two is the system latency. Tobii Race's
   reticle and depth of field depend on the gaze, so the game lends itself to this. I still have to check
   that the method works with the 4C.
4. **Lap times and gap to the ghost** across sessions, knowing that they measure the system and the
   driver's learning together.

## What I take to Kite: the topics to explore

In the [entry on dwell time](/en/journal/kite-gaze-typing-with-dwell-time/) I described Kite's first
keyboard and its limits. For the new version I am studying the literature. Here I only list the
topics:

- **the Midas Touch**: telling the gaze that looks from the gaze that selects
  ([Jacob, 1991](#references));
- **adaptive dwell**: a waiting time that changes with the person and with the probability of the key
  ([Mott et al., 2017](#references));
- **dwell-free typing**: recognising the word from the path of the gaze
  ([Kurauchi et al., 2016](#references));
- **Dasher**: typing by navigating through letters guided by a language model
  ([Ward and MacKay, 2002](#references));
- **smooth pursuit**: choosing by following a moving target with the eyes
  ([Vidal et al., 2013](#references));
- **prediction with language models**, including large ones (LLMs)
  ([Cai et al., 2024](#references));
- **the One Euro filter**: already in the game, to be tuned for the keyboard
  ([Casiez et al., 2012](#references));
- **gaze and head together**: the head confirming or correcting the point looked at
  ([Špakov et al., 2014](#references)).

I will discuss them in detail in the next journal entry.

## Open problems

- **No systematic measurements.** The README notes have neither the number of sessions nor their
  duration. The first complete race, the one of 13 November, is a single session with a single person.
- **`lat` covers only part of the chain.** The latency up to the screen is not measured.
- **Telemetry is not saved.** Without a recording I cannot compare sessions.
- **The gaze in the window.** Mapping from screen coordinates to the browser window's coordinates is
  exact only in full screen; in a window it is approximate.
- **Yaw from the images.** On 11 November it differed from the yaw derived from the eyes by 5–15°, and
  the default steering uses it. Moreover, `tobii-ws` does not currently know whether an angle comes from
  the face or from the eyes.
- **The display area after a cold start.** On 11 November I saw that the 4C forgets it when powered off.
  I checked the rest against the code and the logs:
  - `tobii4c run` writes the area back to the device only if it receives `-display-mm`. It does not
    re-read `display.json`: that file is written by the screen setup of `tobii4c calibrate`, and no
    command reads it back.
  - In the 11 November test the area had been rewritten because I had started the driver with
    `-display-mm 700x390`, not because the driver had taken it from the file. I corrected that entry.
  - `tobii-ws` passes the calibration to the driver, but not `-display-mm`. After a cold start the 4C
    would therefore stay with the factory area of 4 × 4 mm. `tobii-ws` recognises it as not configured,
    because it measures less than 50 mm per side, and reports it, but does not restore it. The gaze on
    the screen, and with it the reticle, would be wrong. The head position too, which the driver
    expresses relative to the screen, would change reference: I have not checked how much this affects
    the controls.
  - In the 13 November race the problem did not arise: the computer had been on since 11 November, and
    `tobii-ws` found the 700 × 390 mm area written that day still configured.
- **One person, one tracker, one computer.** As in the previous entries.

## Next steps

1. Add recording of frames, states and automatic stops to a file in the game.
2. Repeat the 13 November race over several sessions and with other people, with informed consent,
   recording the telemetry.
3. Measure end-to-end latency with an external method, following Saunders and Woods.
4. Have the display area reapplied every time the driver starts: `tobii-ws` can pass it `-display-mm`
   with the measurements saved in `display.json`. Then check it after a cold start.
5. Let `tobii-ws` know whether yaw and roll come from the face or from the eyes, and check them with the
   steering.
6. Explore the literature topics in the next entry and choose which ones to prototype first in Kite.

> **Disclaimer.** Tobii Race is a test tool, not a certified medical device nor an assistive device, and
> Kite is an experimental project. The driver is unofficial software that uses the tracker in ways the
> manufacturer did not foresee. The IR images show the face and the sensor screen shows the tracker's
> serial number: these are data to be protected before publishing any recording. Turning the head to
> drive can tire the neck: sessions should be kept short. If I use infrared LEDs to measure latency, they
> must be pointed at the tracker and not into the eyes. Trials with people require informed consent and,
> where needed, the approval of an ethics committee. Anyone who depends on an AAC tool to communicate
> should always have a backup.

## References

1. Cai S., Venugopalan S., Seaver K., Xiao X., Tomanek K., Jalasutram S., Morris M. R., Kane S.,
   Narayanan A., MacDonald R. L., Kornman E., Vance D., Casey B., Gleason S. M., Nelson P. Q.,
   Brenner M. P. (2024). Using large language models to accelerate communication for eye gaze typing
   users with ALS. *Nature Communications*, 15, 9449.
   [doi:10.1038/s41467-024-53873-3](https://doi.org/10.1038/s41467-024-53873-3) (open access on
   [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11530652/))
2. Casiez G., Roussel N., Vogel D. (2012). 1 € filter: a simple speed-based low-pass filter for noisy
   input in interactive systems. *Proceedings of the SIGCHI Conference on Human Factors in Computing
   Systems (CHI '12)*, 2527–2530.
   [doi:10.1145/2207676.2208639](https://doi.org/10.1145/2207676.2208639)
3. Fette I., Melnikov A. (2011). *The WebSocket Protocol*. RFC 6455, RFC Editor.
   [doi:10.17487/RFC6455](https://doi.org/10.17487/RFC6455)
4. Google AI Edge (n.d.). *MediaPipe Face Landmarker*. Official technical documentation.
   [developers.google.com](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)
5. Jacob R. J. K. (1991). The use of eye movements in human-computer interaction techniques: what
   you look at is what you get. *ACM Transactions on Information Systems*, 9(2), 152–169.
   [doi:10.1145/123078.128728](https://doi.org/10.1145/123078.128728)
6. Kurauchi A., Feng W., Joshi A., Morimoto C., Betke M. (2016). EyeSwipe: dwell-free text entry using
   gaze paths. *Proceedings of the 2016 CHI Conference on Human Factors in Computing Systems
   (CHI '16)*, 1952–1956. [doi:10.1145/2858036.2858335](https://doi.org/10.1145/2858036.2858335).
   [Open access version](https://www.cs.bu.edu/fac/betke/papers/Kurauchi-etal-CHI-2016.pdf)
7. Mott M. E., Williams S., Wobbrock J. O., Morris M. R. (2017). Improving dwell-based gaze typing
   with dynamic, cascading dwell times. *Proceedings of the 2017 CHI Conference on Human Factors in
   Computing Systems (CHI '17)*, 2558–2570.
   [doi:10.1145/3025453.3025517](https://doi.org/10.1145/3025453.3025517).
   [Open access version](https://faculty.washington.edu/wobbrock/pubs/chi-17.02.pdf)
8. Salvucci D. D., Goldberg J. H. (2000). Identifying fixations and saccades in eye-tracking
   protocols. *Proceedings of the Symposium on Eye Tracking Research & Applications (ETRA '00)*,
   71–78. [doi:10.1145/355017.355028](https://doi.org/10.1145/355017.355028)
9. Saunders D. R., Woods R. L. (2014). Direct measurement of the system latency of gaze-contingent
   displays. *Behavior Research Methods*, 46(2), 439–447.
   [doi:10.3758/s13428-013-0375-5](https://doi.org/10.3758/s13428-013-0375-5) (authors' manuscript on
   [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4077667/))
10. Špakov O., Isokoski P., Majaranta P. (2014). Look and lean: accurate head-assisted eye pointing.
    *Proceedings of the Symposium on Eye Tracking Research and Applications (ETRA '14)*, 35–42.
    [doi:10.1145/2578153.2578157](https://doi.org/10.1145/2578153.2578157).
    [Open access version](https://homepages.tuni.fi/oleg.spakov/publications/Spakov_ETRA_14a.pdf)
11. Vidal M., Bulling A., Gellersen H. (2013). Pursuits: spontaneous interaction with displays based on
    smooth pursuit eye movement and moving targets. *Proceedings of the 2013 ACM International Joint
    Conference on Pervasive and Ubiquitous Computing (UbiComp '13)*, 439–448.
    [doi:10.1145/2493432.2493477](https://doi.org/10.1145/2493432.2493477)
12. Ward D. J., MacKay D. J. C. (2002). Fast hands-free writing by gaze direction. *Nature*, 418(6900),
    838. [doi:10.1038/418838a](https://doi.org/10.1038/418838a) (preprint on
    [arXiv:cs/0204030](https://arxiv.org/abs/cs/0204030))
