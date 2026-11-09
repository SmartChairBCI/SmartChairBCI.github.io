---
ref: tobii-4c-linux-re-2
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Tobii 4C on GNU/Linux (2/3): putting names to bytes"
description: "Second part of the reverse engineering of the Tobii 4C protocol: a tool that reads everything, careful fuzzing one field at a time, messages to reassemble, the streams and their columns, the head pose that is not there, and what remains obscure."
tags: [eye-tracking, tobii, linux, usb, reverse-engineering, aac]
---

In the [first part](/en/journal/tobii-4c-on-linux-1-reading-before-touching/) I gathered what is
known about the protocol of the **Tobii Eye Tracker 4C**: the USB endpoints, the shape of the TTP
messages, the TLV fields, the big-endian and fixed-point numbers. At the end I had a grammar, but
not a vocabulary. I could read the structure of a message, not what it meant.

In this second part I describe how I tried to **put names to bytes**: which field is the gaze,
which is a counter, which is an error, which I still do not understand. The method is the same as
in the previous entries: the AI assistant proposes hypotheses and helps me write the tools, I check
them on real data and decide what to keep.

There are no performance measurements. There is a method, there are the protocol facts that came
out of it, and there is an honest list of grey areas.

## A tool that reads everything

The first tool I wrote, with the help of the AI assistant, is a generic capture and decoding
program, which I called `dump`. The rule I gave it is simple: **never throw away anything it does
not understand**.

The program opens the session, subscribes to the data streams I tell it to and, for every message
that arrives:

1. recognises the message type from the header (response, stream sample, notification);
2. breaks the content down into its TLV fields, even if it does not know what they mean;
3. for every column prints the numeric key, the name (if the device has provided one), the type and
   the value;
4. if the content does not have the expected shape, prints the first bytes in hexadecimal instead of
   discarding them.

At the end it prints a summary for each stream: how many messages arrived, at what rate and with
what minimum and maximum size. It can also save the sensor images as PGM files, a very simple
greyscale image format, so I can open them with an ordinary image viewer.

It is a decoder that knows the **types**, not the **meanings**. It knows that a field is "a 32-bit
integer" or "a fixed-point 3D point", but not that the point is an eye. I add the meaning
afterwards.

### The structure labels

In part 1 I described TLVs as the labels on a parcel. Looking at many messages, it turned out that
one TLV type, `0x05`, acts as a **structure label**: it announces what comes next and how many
elements it contains. The upper 16 bits count the elements, the lower 16 bits say which structure it
is. The community documentation for the Tobii Eye Tracker 5 (ET5), the 4C's successor, calls these
data rows **XDS** ([Tropaion, n.d.](#references)).

| Label (lower 16 bits) | What it announces |
| --- | --- |
| `0x0bb8` | a data **row**, i.e. one sample of a stream, with *n* columns |
| `0x0bb9` | a **column**: a key followed by a value |
| `0x1f40` | a **2D point**: two fixed-point numbers |
| `0x1f41` | a **3D point**: three fixed-point numbers |
| `0x0100` | a **list** of records (for example the stream catalogue) |

A concrete example helps. This is a real 101-byte message from the user **presence** stream. It does
not come from my 4C: it is a capture of the **ET5** published in Krazubu's Open-tobii project
(formerly tobii-linux), under the MIT licence ([Krazubu, n.d.](#references)). The structure is the
same one I read on the 4C.

```text
01 00 00 00 65 00 00 00         USB envelope: from the device, 101 bytes in total
00 00 00 53                     message type: stream sample
00 00 00 00                     seq: 0
00 00 00 00                     status: 0
00 00 05 04                     stream 0x504 (presence)
00 00 00 00                     error: none
00 00 00 45                     69 bytes of content
00 00                           fixed content prefix
05 00000004 00020bb8            row with 2 columns
05 00000004 00020bb9              column
02 00000004 00000001                key 1
06 00000008 0000001891b53908        64-bit integer: timestamp
05 00000004 00020bb9              column
02 00000004 00000002                key 2
01 00000004 00000002                32-bit integer: value 2
```

The generic decoder gets this far: "a row with two columns, column 1 is a 64-bit integer, column 2
is 2". That column 1 is a time in microseconds and that 2 means "there is a person in front" is an
interpretation, and has to be checked separately.

## Fuzzing, with my hands in my pockets

### What fuzzing is

In 1990 Barton Miller and his colleagues fed random character sequences to dozens of Unix programs
and saw that a substantial share of them hung or crashed ([Miller et al., 1990](#references)). The
name *fuzz testing* comes from that work. Today **fuzzing** generally means running a program over
and over with automatically generated inputs, possibly malformed, to see how it reacts
([Manès et al., 2021](#references)).

In protocol reverse engineering, fuzzing has a somewhat different purpose. I am not looking for
bugs: I am looking for **meanings**. If I change a single byte of a command and the response
changes, that byte matters. If the response does not change, it may be a reserved field. If an error
comes back, the error itself is information.

### Why it has to be done carefully here

A program that crashes can be restarted. A physical device cannot, or not always. The 4C has
**infrared illuminators** that work a few centimetres from the eyes, a **persistent memory** where it
keeps settings and calibration, and firmware that I cannot reinstall. For the ET5, a separate boot
mode with a different USB identifier, used only to update the firmware, is also documented
([Aetherall, n.d.](#references)).

That is why I did not do "carpet" fuzzing, with random bytes on the output channel. I did the
opposite: **slow, targeted and reversible** fuzzing.

These are the things I **do not send**, by choice:

- **nothing that could affect the IR illuminators**: I do not look for commands that change their
  power or timing, and I stop if I see anything strange in the light;
- **no blind persistent writes**: no calibration commands (start, clear, compute, write of the
  calibration block) and no write of the **display area** without first reading and saving its
  current value. The ET5 documentation marks the command that clears the calibration as
  "destructive" ([Tropaion, n.d.](#references));
- **no firmware updates**, and no commands that could put the device into update mode;
- **nothing on the third output endpoint**, `0x04`: it exists in the USB descriptors, but I know of
  no implementation that uses it, so I do not write to it;
- **no random bytes**: every command I send has a valid structure, taken from an already known
  command, with a single field changed.

### The method, one field at a time

1. **A reference recording.** Before touching anything, I record a normal session with `dump`:
   opening, known requests, streams. This is the baseline.
2. **Reads first.** I start with commands that ask for information without changing anything, such
   as the device identity, the stream catalogue, the display area, the tracking volume.
3. **One field at a time.** I start from a valid command and change one field: for example the
   number of the stream whose column list I ask for. Everything else stays identical.
4. **Byte-by-byte comparison.** I compare the responses and note what changed: the error word, the
   length, the individual fields, any new notifications or streams.
5. **Stable or variable.** I repeat the same request several times. Fields that change even when
   the request is the same are counters, sequence numbers or times. Those that stay still are
   candidates for constants, identifiers or settings.
6. **State check.** At the end I read back the persistent settings, such as the display area, to
   make sure I have not changed anything.
7. **Stop at once.** If the device disconnects by itself, changes behaviour, or the IR light does
   something unusual, I stop and do not repeat the command.

### How I tell a counter from a time

In the gaze samples some fields change with every message. To give them a name I use their trend,
not their value:

- a **sequence number** or a **frame counter** increases by a fixed step;
- a **timestamp** increases by an amount that depends on the rate. If the unit is the microsecond
  and the stream runs at 90 Hz, two consecutive samples should be about 11,100 µs apart. This is the
  check I use to confirm the unit;
- a **physical value**, such as a coordinate, fluctuates without a simple rule.

Another useful thing came out this way: responses to commands always have the status word set to 1,
while in the captures stream samples have status 0 and sequence number 0. As a precaution, the
sequence numbers of my requests start at 1 and skip 0.

### Error codes

When the device rejects a command, it says so in the error word of the header. I gave a provisional
label to four codes. For only one of them do I have a concrete case on the 4C; for the others the
name is a **hypothesis** about the meaning, still to be confirmed.

| Code | Label | Where I met it |
| --- | --- | --- |
| `0x20000501` | not supported | hypothesis |
| `0x20000505` | not authorised | subscribing to the `image_collection` stream (`0x508`) on the 4C |
| `0x20000508` | invalid state | hypothesis |
| `0x20000509` | invalid parameter | hypothesis |

### The commands I have learned to recognise

Not all the operation codes (*opcodes*) I have seen have a name in the community documentation.
These are the ones I recognise with confidence; for many, the meaning comes from the response
itself, which contains readable text or known structures.

| Opcode | What it does | Type |
| --- | --- | --- |
| `0x3e8` | initial greeting, returns the protocol version | read |
| `0x58c` | identity strings: serial number, model, generation, firmware | read |
| `0x640` | queries the "realm", i.e. whether authentication is needed | read |
| `0x4b0` | **stream catalogue**: number and name of every stream | read |
| `0x4ba` | **columns of a stream**: key and name of every column | read |
| `0x4c4` / `0x4ce` | subscribe to a stream / unsubscribe | session |
| `0x578` | tracking volume (*track box*) | read |
| `0x83e` | mounting geometry of the tracker | read |
| `0x532`, `0x5d2` | properties and status, as key and text pairs | read |
| `0x596` | reads the display area | read |
| `0x5a0` | writes the display area | **persistent write** |

On the 4C the realm query returns 0, which I interpret as "no authentication required". The same
value is documented for the ET5 ([Tropaion, n.d.](#references)).

### The comparison with the ET5

For the ET5, the community looked for streams by trying to subscribe to a range of numbers. It
found something important: the device **acknowledges** the subscription to every number in the
probed range, but for most of them it then sends nothing. An acknowledgement alone does not prove
that a stream exists ([Tropaion, n.d.](#references)).

On the 4C I could avoid this blind search, because the device has a **catalogue** that lists the
streams by name (`0x4b0`) and a command that lists the columns of each stream, again by name
(`0x4ba`). The same command appears in the ET5 captures ([Krazubu, n.d.](#references)). It was the
most useful discovery of the whole job: **many bytes already have a name**, you just have to ask the
firmware.

## Putting the messages back together

In part 1 I mentioned **fragmentation** (one message split across several transfers) and
**coalescing** (several messages in the same transfer). Here is how I dealt with them in practice.

### Why it happens

Normally a USB *bulk* transfer contains exactly one message. The transfer ends when a packet shorter
than the endpoint's maximum packet size arrives, the so-called *short packet*
([Microsoft, n.d.](#references)). There are cases, however, where this boundary is lost:

- the read buffer is smaller than the message, and the message arrives **in pieces**
  (fragmentation);
- a message whose length is an exact multiple of the maximum packet size (512 bytes) has no final
  *short packet*: if the device does not close it with an empty packet, it can end up **glued** to
  the next one (coalescing);
- an interrupted transfer leaves a message half-finished.

### The reassembler

The program that puts messages back together works like this:

1. it accumulates incoming bytes in a single buffer;
2. it checks whether the start of the buffer **looks like** the start of a message: first byte `01`
   (from the device), three zeros, a plausible length, between 32 bytes and 1 MiB, and a known
   message type (`0x51` request, `0x52` response, `0x53` stream, `0x4e` notification);
3. if so, it waits until it has as many bytes as the length declares, and delivers the message;
4. if not, it **resynchronises**: it moves forward one byte at a time until it finds a plausible
   start, counting the discarded bytes. If it finds none, it keeps only the last 11 bytes, which
   could be the broken-off start of the next message.

The 1 MiB limit is a common-sense threshold. An IR image from the 4C takes a little over 300 KB, so
a message that declares much more is almost certainly an alignment error.

### Chunked responses

Some responses are too large for a single transfer. In the ET5 captures the calibration block
exceeds 650 KB ([Krazubu, n.d.](#references)). The device then sends:

- a **head**: a normal response message, whose header declares more content than it actually
  carries;
- a series of **continuations**: pieces with their own USB envelope but no TTP header.

The reassembler recognises the head, appends the continuations one after another, and delivers the
response only when it is complete. If a continuation carries more bytes than are missing, the
response is corrupt and I discard it entirely, rather than delivering a wrong message. The same
technique is described for the ET5 ([Tropaion, n.d.](#references)).

The same applies in the other direction. A command longer than 4087 bytes has to be split into
several transfers, each with its own envelope, and the device replies only once, after the last
piece.

There is also an asymmetry to keep in mind: in the USB envelope, the **outgoing** length counts the
bytes after the envelope, while the **incoming** length counts the whole message, envelope included.
It is documented for the ET5 too ([Tropaion, n.d.](#references)).

### Matching responses to requests

Responses do not arrive in a separate queue: they are mixed with the stream samples, which arrive
continuously. To match them I use two header fields:

- **seq**, the sequence number: the response carries the same number as the request;
- **op**, the opcode: the response carries the same command.

If a response arrives with the right seq but the wrong op, I log it and keep waiting. If a response
arrives that nobody is waiting for any more, for example after a timeout, I count it as an "orphan"
and discard it. **Notifications** (`0x4e`) are spontaneous messages from the device: for example
`0x5aa` signals that the display area has changed, `0xc94` that a new calibration is active.

I tested the reassembler on real ET5 captures ([Krazubu, n.d.](#references)): I lined up three
messages, cut them into pieces of 1, 7, 64, 512 and 1000 bytes, and checked that the same three
messages always came out, identical. I also put some junk bytes in front of a message, to see that
resynchronisation found it again.

## The streams and their keys

### The catalogue

The 4C catalogue lists six streams. I put it next to the ET5 one, taken from Krazubu's captures
([Krazubu, n.d.](#references)).

| Number | Name in the firmware | 4C | ET5 | What it contains |
| --- | --- | --- | --- | --- |
| `0x500` | `gaze` | yes | yes | gaze, eyes, pupils: the main stream |
| `0x501` | `image` | yes | yes | IR camera images |
| `0x504` | `presence` | yes | yes | user presence, event-driven |
| `0x508` | `image_collection` | yes | yes | on the 4C the subscription is rejected as "not authorised" |
| `0x50e` | `primary_camera_image` | no | yes | not present on the 4C |
| `0x1770` | `algodbg` | yes | yes | diagnostics: on the 4C, rows with an empty data block |
| `0x1771` | `is5_sync_stream` | no | yes | not present on the 4C |
| `0x1772` | `log` | yes | yes | firmware text lines |
| `0x1774` | `custom` | no | yes | not present on the 4C |

### The gaze stream

Every gaze sample is an XDS row with **39 columns**. The keys are the same on the 4C and on the ET5,
and the firmware itself returns their names with the `0x4ba` command. This is the map I
reconstructed between the columns and the fields of a sample. Where there are two keys, the first is
the left eye and the second the right one.

| Keys | Name in the firmware | Type | Sample field |
| --- | --- | --- | --- |
| `0x01` | Timestamp | 64-bit integer | device time, in µs |
| `0x14` | (no name) | 32-bit integer | frame counter |
| `0x1c` · validity `0x1b` | Relative Combined Gaze Point | 2D point | **gaze point** on the screen, filtered, normalised between 0 and 1 |
| `0x20` · validity `0x1f` | Remote Gaze Point Responsive Combined | 2D point | "responsive" gaze point, which I interpret as unfiltered |
| `0x02`, `0x08` · validity `0x16`, `0x15` | Gaze Origin Tracker | 3D point | **3D origin of the eyes** (centre of the cornea), in mm, relative to the tracker |
| `0x22`, `0x24` · validity `0x21`, `0x23` | Gaze Origin Display | 3D point | the same origin, in mm, relative to the centre of the screen |
| `0x03`, `0x09` · validity `0x1d`, `0x1e` | Eye 3D Relative Position | 3D point | position of the eye in the tracking volume, between 0 and 1 |
| `0x05`, `0x0b` | Eye 2D Gaze Point | 2D point | gaze point of the single eye |
| `0x06`, `0x0c` | Eye Pupil Diameter | 16.16 fixed point | **pupil diameter**, in mm |
| `0x07`, `0x0d` | Eye Validity | 32-bit integer | eye state: 0 tracked, 4 not detected |
| `0x29`, `0x2b` · validity `0x2a`, `0x2c` | Absolute Eye Openness | 16.16 fixed point | **eyelid opening** (see below) |

Other columns have a name but I do not use them for now: the 3D gaze point of each eye (`0x04`,
`0x0a`), the centre of the eyeball (`0x17`, `0x18`), a 2D position "relative to the sensor area"
(`0x19`, `0x1a`) and a user positioning guide (`0x25`–`0x28`).

Three details made me think.

**Two validity conventions.** The "Validity" columns are 1 when the data is valid. The eye state,
on the other hand, is **0** when the eye is tracked and 4 when it is not. Mixing up the two
conventions means reading everything backwards.

**Zeros are not data.** When it cannot see an eye, the device keeps sending its columns, but zeroed.
The ET5 documentation stresses this: validity must be decided from the eye state, never from the
mere presence of the column ([Tropaion, n.d.](#references)). Otherwise you end up believing there is
an eye exactly on top of the sensor, at the point (0, 0, 0).

**Two reference frames.** The eye origin arrives twice: relative to the tracker and relative to the
centre of the screen. The firmware computes the second one from the display area stored in the
device. This is why the display area, which is a persistent setting, has to be handled with so much
care.

### Eye opening: the column is there, the data is not

In the [awakening entry](/en/journal/tobii-4c-wakes-up-after-10-years-of-hibernation/) I wondered
whether the 4C provides eye opening. The answer is half yes, half no. The column exists and the
firmware calls it "Absolute Eye Openness". But the value is **−1**, with validity 0: this is how the
device says "unknown". That is how it is in the ET5 capture ([Krazubu, n.d.](#references)), and
that is how I have always found it so far on my 4C. For now, therefore, eye opening is **not
available** on this device. It is a negative result, and I report it as such.

### The presence stream

The `0x504` stream is made of rows with two columns: the timestamp (`0x01`) and a value (`0x02`).
It does not arrive at a fixed rate: it is **event-driven**. The device sends it once at subscription
and then only when the state changes. In the ET5 capture, with a person in front, the value is 2; on
the 4C, with nobody in front, I have seen 1. My hypothesis is that 0 means "unknown", but I have not
seen it appear yet.

### The image stream

The `0x501` stream was the one I was looking forward to most, for the reason explained in the
[entry on pitch](/en/journal/tobii-4c-head-pitch-from-the-face/): I need images of the face. On the
4C every message is an XDS row with five columns:

| Key | Name in the firmware | Content |
| --- | --- | --- |
| `0x01` | Timestamp | time in µs, on the same clock as the gaze stream |
| `0x02` | Bits per pixel | 8 |
| `0x03` | Width | 640 |
| `0x04` | Height | 480 |
| `0x05` | Image | 640 × 480 bytes, row by row, greyscale |

It is the **whole infrared camera image**, 640 × 480 pixels at 8 bits, i.e. 307,200 bytes of pixels
plus the labels: 307,350 bytes of content in total. It arrives at 30 images per second, fewer than
the 90 gaze samples per second. For the ET5 the community hypothesises much smaller images, around
78 KB, perhaps of a single eye ([Tropaion, n.d.](#references)). It is one of the sharpest differences
between the two devices.

### Diagnostic streams and service reads

The `log` stream (`0x1772`) sends firmware text lines, with the tracker's timestamp. One of the
lines I have seen is `[ 73592.529468] (I) TDI thread: Changed run mode to 22`. I do not know what
"run mode 22" is, but during fuzzing it is a valuable window on what happens inside the device. The
`algodbg` stream (`0x1770`), on the other hand, arrives on the 4C at the same rate as the gaze but
with an empty data block.

Among the service reads, the **tracking volume** (`0x578`) arrives as the eight vertices of a
truncated pyramid. On the 4C the near plane measures 300 × 200 mm at 450 mm from the sensor, the far
plane 550 × 400 mm at 900 mm. The spec sheet, which I quoted in the
[first entry](/en/journal/tobii-4c-wakes-up-after-10-years-of-hibernation/), describes the tracking
area differently (40 × 30 cm at 75 cm). I do not yet know how the two descriptions relate.

## No stream for the head

The 4C catalogue has no stream for the **head pose**, and none of the 39 gaze columns contains an
orientation. The same is true for the ET5: the community documentation found the pose neither in the
gaze stream nor among the streams it probed ([Tropaion, n.d.](#references)), and the catalogue in
Krazubu's captures has no stream with a name of that kind ([Krazubu, n.d.](#references)). My
hypothesis, already stated in the first entry, is that on Windows the pose is computed by the
software on the PC.

What the device gives me are the **two corneal centres**, in two reference frames (`0x02`/`0x08`
and `0x22`/`0x24`). From two points you can derive the position of the head, the yaw and the roll,
but not the **pitch**: the "yes" rotates the head around an axis that passes almost through the two
eyes, and the two points stay still. This is the problem the
[entry on pitch](/en/journal/tobii-4c-head-pitch-from-the-face/) started from, where I tried to
recover it from the face with a webcam. Now I know the 4C can give me the images to bring that method
to: 640 × 480 pixels, at 30 Hz, on the same clock as the gaze.

## Dead ends and grey areas

### A mistake I made

In my first map, columns `0x1d` and `0x1e` were assigned to the validity of each eye's 2D gaze. The
values did not contradict the hypothesis: in the ET5 capture they are 1 when the eye is seen. The
name returned by the firmware, however, says something else: "Left Eye 3D Relative Position
Validity". They are the validity of the position in the tracking volume. The 2D gaze of a single eye
actually has **no** validity column of its own, and has to be judged from the eye state. Without the
firmware names I would not have noticed.

### Community hypotheses do not always hold

The ET5 documentation proposes hypotheses for some columns, honestly flagged as such
([Tropaion, n.d.](#references)). Two examples: columns `0x29`/`0x2b`, hypothesised as quantities
related to the pupil or to quality, which the firmware calls "absolute eye openness"; and columns
`0x04`/`0x0a`, hypothesised as gaze directions, which the firmware calls "3D gaze point". It is a
lesson in method that applies to me too: a plausible hypothesis is not a fact until the data confirm
it.

### What I have not deciphered yet

- **Column `0x11`.** It has no name. For the ET5 it is described as a constant flag of unknown
  meaning ([Tropaion, n.d.](#references)); on the 4C it seems to increase by one with every frame,
  like a second counter next to `0x14`. I do not know what it counts.
- **Columns `0x19`/`0x1a`**, "eye 2D position relative to the sensor area". They are −1 even with
  the user tracked, both in the ET5 capture and on the 4C. Perhaps they are reserved for another
  model, perhaps they have to be enabled somehow. I do not know.
- **The positioning guide** (`0x25`–`0x28`). It has a name and values, but I have not yet understood
  how to interpret them.
- **The properties** (`0x532`). They arrive as key and text pairs, for example `0x0` "Peripheral",
  `0x2` "HELLO_NIR", `0x3` "IS4LTOBIIPERIPHERAL". The meaning of the keys is not documented.
- **The initial greeting.** The content of the `0x3e8` command is a fixed byte sequence that I copy
  as it is from the captures of the Windows software. It works, but I do not know what each byte
  says.
- **The tail of the display area write.** The `0x5a0` command ends with a value `0x3039`, that is
  12345 in decimal, also copied from the captures. It looks like a placeholder, but that is only an
  impression.
- **The other USB interfaces.** The 4C also exposes a standard USB camera (UVC) at 640 × 480 with a
  vendor-specific format. I have not explored it.

### Differences from the ET5

| Aspect | ET5 (community documentation and captures) | 4C (my readings) |
| --- | --- | --- |
| Message structure, opcodes, gaze columns | same protocol family | identical in the parts I have checked |
| Generation in the identity strings | `IS5` | `IS4` |
| Stream catalogue | nine streams | six streams |
| Images (`0x501`) | around 78 KB, perhaps a single eye (hypothesis) | 640 × 480 at 8 bits, the whole camera |
| Session close | the device reboots and loses the display area | it does not reboot and keeps the display area |
| Authentication (realm) | 0, none | 0, none |

The ET5's behaviour at session close comes from the community documentation
([Tropaion, n.d.](#references)). On the 4C, the fact that the display area survives the session is
convenient, but it also confirms that this write is **persistent**: one more reason not to touch it
during fuzzing.

## Open problems

- **A single unit.** Everything I have read on the 4C comes from one device, with firmware 4.7.0. A
  different firmware might have different columns.
- **Columns without a meaning.** `0x11`, `0x19`/`0x1a`, `0x25`–`0x28` and the properties remain to
  be understood.
- **Eye opening is missing.** On the 4C the column is always −1, at least so far. If Kite needs it,
  it will have to be estimated another way, for example from the face points as in the
  [entry on pitch](/en/journal/tobii-4c-head-pitch-from-the-face/).
- **The error codes** have largely hypothetical labels.
- **Bytes copied without understanding them.** The initial greeting and the tail of the display area
  write work, but they are imitations of the captures, not understanding.
- **The limits of careful fuzzing.** The rules I set myself deliberately leave out part of the
  protocol, such as the illuminators and the firmware. Some functions of the 4C might remain unknown
  precisely because of this. It is a price I accept.

## Next steps

1. Turn the map of messages and columns into a driver architecture and into code: this will be the
   topic of the third and last part of this series.
2. Bring the pitch estimate from the webcam to the IR images of the `0x501` stream.
3. Continue read-only fuzzing on the undeciphered columns, comparing the values with controlled
   situations (covered eye, person far away, person outside the tracking volume).
4. Study the calibration commands only once I have a safe way to save and restore the current
   calibration.
5. Publish the description of the 4C protocol, including the parts I have not understood.

> **Warning.** Kite is an experimental project and **is not a certified medical device**. The reverse
> engineering and fuzzing described here use the tracker in ways not foreseen by the manufacturer: a
> command whose effect is unknown could change the device's persistent settings or the behaviour of
> the infrared illuminators, which work close to the eyes. Anyone wishing to repeat these tests should
> stick to reads and save the settings first. The IR images of the `0x501` stream show the face: they
> are personal data. Anyone who depends on an AAC tool to communicate should always have a backup
> alternative. Tests with people require informed consent and, when needed, the approval of an
> ethics committee.

## References

1. Aetherall (n.d.). *tobiifree: an ongoing experiment to make Tobii eye trackers work on Linux*
   [community repository, unofficial, for the Tobii Eye Tracker 5]. GitHub.
   [github.com/Aetherall/tobiifree](https://github.com/Aetherall/tobiifree)
2. Krazubu (n.d.). *Open-tobii: Linux driver for the Tobii Eye Tracker 5* [community repository,
   unofficial, formerly tobii-linux, forked from Skyggedans/tobii-linux; reconstructed from USB
   captures of the Windows software; MIT licence]. GitHub.
   [github.com/Krazubu/Open-tobii](https://github.com/Krazubu/Open-tobii)
3. Manès V. J. M., Han H., Han C., Cha S. K., Egele M., Schwartz E. J., Woo M. (2021). The art,
   science, and engineering of fuzzing: a survey. *IEEE Transactions on Software Engineering*,
   47(11), 2312–2331. [doi:10.1109/TSE.2019.2946563](https://doi.org/10.1109/TSE.2019.2946563).
   Preprint version: [arXiv:1812.00140](https://arxiv.org/abs/1812.00140)
4. Microsoft (n.d.). *USB bandwidth allocation* (sections "USB transfer and packet sizes" and
   "Delimiting USB data transfers with packets smaller than wMaxPacketSize"). Microsoft Learn,
   official technical documentation.
   [learn.microsoft.com](https://learn.microsoft.com/en-us/windows-hardware/drivers/usbcon/usb-bandwidth-allocation)
5. Miller B. P., Fredriksen L., So B. (1990). An empirical study of the reliability of UNIX
   utilities. *Communications of the ACM*, 33(12), 32–44.
   [doi:10.1145/96267.96279](https://doi.org/10.1145/96267.96279).
   [University of Wisconsin version (PDF)](https://ftp1.cs.wisc.edu/par-distr-sys/papers/fuzz.pdf)
6. Tropaion (n.d.). *Tobii_Linux*, project wiki [community repository, unofficial: reimplementation
   of the Tobii Eye Tracker 5 USB protocol for Linux]; pages Encoding, Gaze Stream, Streams, Head
   Pose, USB Transport, Handshake and Op Catalog. GitHub.
   [github.com/Tropaion/Tobii_Linux/wiki](https://github.com/Tropaion/Tobii_Linux/wiki)
