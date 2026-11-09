---
ref: tobii-4c-linux-re-1
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Tobii 4C on GNU/Linux (1/3): reading before touching"
description: Before sending a single byte to the tracker, I study what the community has already found out about the Tobii Eye Tracker 5, read the 4C's USB descriptors and take apart the structure of the TTP protocol, field by field. It is the groundwork for the future free driver.
tags: [eye-tracking, tobii, linux, usb, reverse-engineering, protocol]
---

In the [entry of 7 November](/en/journal/tobii-4c-wakes-up-after-10-years-of-hibernation/) I
introduced the Tobii Eye Tracker 4C and gave a general picture of the protocol it uses to talk to the
computer. In the [entry of 8 November](/en/journal/tobii-4c-head-pitch-from-the-face/) I recovered
head pitch from the face, on a webcam for now. To bring that work to the 4C's infrared images I need
a free driver for GNU/Linux, and that driver does not exist yet.

With this entry I begin a series of three on **reverse engineering** the protocol: reconstructing how
a system works by observing it from the outside, without the documentation of whoever designed it.
It is the work the driver will rest on.

This first part has a single rule: **reading before touching**. I am not sending anything to the
device yet. I study the sources, look at how the 4C presents itself on the USB bus and take apart
the structure of the messages, byte by byte. There are no measurements of my own: there are sources,
descriptors, bytes from other people's captures and a list of questions to check.

## Why read before touching

The main reason is caution. The 4C is ten years old and is no longer Tobii's current model; if I
damage it, finding another one is not a given. A command whose effect I do not know could change its
behaviour, including that of the infrared illuminators, or leave it in a state I cannot restore.

The second reason is practical. For its successor, the Tobii Eye Tracker 5 (ET5), the community has
already done a lot of work, and published it. Reading costs less than rediscovering.

There is, however, a limit to keep in mind at all times: **almost everything to be found concerns
the ET5, not the 4C**. What I read gives me hypotheses about the 4C, not facts.

## The method: the AI proposes, I verify

I work as I announced in the entry of 7 November, with a programming assistant based on artificial
intelligence (AI). The division of tasks is this:

- **I** read the sources and look at the bytes, decide what to try and review every conclusion;
- **the AI assistant** helps me read the code of other projects, written in languages I rarely use
  (Rust, Zig, TypeScript), summarise the documentation, compare the sources with one another and
  propose hypotheses about the meaning of the fields.

Every hypothesis becomes a **question to be checked on the real device**. For example: "does the 4C
answer the first message with the same protocol version as the ET5?". Until the answer comes from
the 4C, it remains a hypothesis.

The Tropaion/Tobii_Linux project, which I discuss below, labels every statement in its documentation
with a confidence level: confirmed on captures or hardware, verified only in code, or hypothesis
([Tropaion, n.d.](#references)). I adopt a similar idea, with three levels:

| Level | What it means |
| --- | --- |
| **Confirmed on the 4C** | I have seen it myself, on my device |
| **Documented on the ET5** | it is in a source or a capture, but it concerns the ET5 |
| **Hypothesis** | it is an interpretation, mine or the AI's, not yet verified |

In this entry almost everything is at the second level. Tropaion's own documentation is a reminder of
the risk: one wrong constant and one plausible but mistaken correction cost that project hours of
debugging ([Tropaion, n.d.](#references)). It is the risk I had also pointed out for code written
with AI.

At this stage I limit myself to three things: public documentation, open code from other projects
and observation of the device.

## The sources found online

| Source | What it is | What it gives me | Limits |
| --- | --- | --- | --- |
| Tropaion/Tobii_Linux | Rust reimplementation of the ET5 USB protocol, GPL-3.0 licence, with a technical wiki | the most orderly description of the USB transport, the message header, the field encoding and the start-up sequence | ET5 only; the protocol is derived from the project's captures, which I do not see published in the repository |
| Krazubu/Open-tobii | Rust driver for the ET5, MIT licence, derived from Skyggedans/tobii-linux | single real messages captured between the Windows Stream Engine 4.1.0.3 and an ET5, with the serial number replaced | ET5 only |
| Aetherall/tobiifree | ET5 driver in Zig and TypeScript, GPL-3.0 licence | a third independent implementation, useful for comparison | ET5 only, declared experimental |
| Eitol/tobii_eye_tracker_linux_installer | script that installs Tobii software for IS4 devices (4C) on Ubuntu 18.10 | confirms that the 4C is an IS4 device and shows how the official software is organised | proprietary binaries; nothing on the protocol |
| Tobii Developer Zone (PDK) | official documentation of the development kit | the vocabulary: the names and meaning of the data streams | nothing on the USB protocol |
| USB 2.0 specification, libusb | the standard and the library for talking to USB devices | the grammar of the transport | — |

### Three projects on the ET5

**Tropaion/Tobii_Linux** is the source I start from. It presents itself as a "clean-room"
reimplementation of the USB protocol of the ET5 (identifier `2104:0313`), that is, written without
using the manufacturer's code ([Tropaion, n.d.](#references)). The wiki has pages on the USB
transport, the message header, the value encoding, the start-up sequence (*handshake*) and the
command catalogue. It also describes the method: Tobii's Windows software runs in a virtual machine
with the tracker attached, and the host system records all the USB traffic with **usbmon**, the Linux
kernel facility that traces input and output on the USB bus
([Linux kernel documentation, n.d.](#references)).

**Krazubu/Open-tobii** is a driver for the ET5, born as a copy (*fork*) of the Skyggedans/tobii-linux
project and distributed under the MIT licence ([Krazubu, n.d.](#references)). For me the most
valuable part is a folder of **real messages**, one per file: the ET5's responses to the start-up
commands, a gaze frame, the presence messages. They were captured between the Windows Stream Engine
4.1.0.3 and an ET5, and the serial number was replaced with zeros of the same length. For one gaze
frame the project also reports the values the Stream Engine delivered to the application: a valuable
key, because it makes it possible to check a decoding against a known result.

**All the example bytes in this entry come from these ET5 captures**, not from my 4C.

**Aetherall/tobiifree** is a third implementation for the ET5, with the protocol written in Zig and a
TypeScript development kit that also works in the browser ([Aetherall, n.d.](#references)). Its
README states something that confirms the starting point: the manufacturer provides no public
documentation of the protocol, which was decoded by observing the USB transfers.

### The official software and its names

**Eitol's repository** does not document the protocol: it installs Tobii's proprietary software for
IS4 devices, that is, the 4C, on Ubuntu 18.10 ([Eitol, n.d.](#references)). Among the files are a USB
service (`tobiiusbservice`) and the **Stream Engine** library. It tells me how the official software
was organised: a service talks to the device, applications talk to the library.

**Tobii's documentation** describes the Platform Development Kit (PDK), which includes the drivers, a
runtime and the Stream Engine API ([Tobii Developer Zone, n.d.](#references)). It lists the data
streams: gaze point, user presence, gaze origin, head position, pupil diameter. It also states that
the 4C and the 4L share the same APIs, and that some more detailed streams require a separate
licence. It says nothing about how the data travel over the cable. I use it as a **vocabulary**: when
I find "the gaze origin" in the bytes, I will know what it means to Tobii.

### The grammar of the transport

The **USB 2.0 specification** defines descriptors, endpoints and transfer types
([USB Implementers Forum, 2000](#references)). For a more readable explanation of control packets
there is *USB in a NutShell* ([Beyond Logic, n.d.](#references)). The **libusb** documentation
explains how the library splits transfers into packets and how reads behave
([libusb, n.d.](#references)).

### Same things, different names

Reading several sources together has an unexpected advantage: you can see where they disagree.

- The third word of the header is called *flag* by Tropaion and *status* by Krazubu; the fifth is
  *reserved* for Tropaion and *error* for Krazubu ([Tropaion, n.d.](#references);
  [Krazubu, n.d.](#references)).
- The same number format is described as "Q42", that is, an integer divided by 2^42, by Tropaion, and
  as a 32.32 value expressed in 1/1024 of a millimetre by Krazubu. Doing the arithmetic, it is the
  same division: 2^32 × 1024 = 2^42.
- Command 3170 is *get_enabled_eye*, that is, "which eyes are enabled", for Tropaion, and *state* for
  Krazubu.

The lesson I draw: **names are hypotheses too**. Two serious projects can look at the same bytes and
give them different names.

## First reconnaissance: looking without talking

The first step on the real 4C is the most harmless one. When a USB device is plugged in, the computer
asks it to introduce itself: the device answers with its **descriptors**, records that say what it
is, which interfaces it has and which "ports" it uses ([USB Implementers Forum, 2000](#references)).
The command `lsusb -v -d 2104:0127` shows them. These are standard read requests, defined by the
standard for every device: they send nothing specific to the 4C.

The identifier is `2104:0127`. The manufacturer code, `2104`, corresponds to Tobii Technology AB in
the public list of USB identifiers; in the 26 June 2026 version of that list, however, neither the
product `0127` nor `0313`, the ET5's, appears ([Linux USB Project, 2026](#references)).

The 4C's descriptors show three interfaces:

| Interface | Class | Endpoints | Likely role |
| --- | --- | --- | --- |
| 0 | `0xff`, vendor-defined | `0x83` bulk IN, `0x04` bulk OUT, `0x05` bulk OUT | the message channel |
| 1 | UVC, video control | none | part of a camera |
| 2 | UVC, video streaming | `0x82` bulk IN, 640 × 480 at 8 bits, vendor format | part of a camera |

UVC (*USB Video Class*) is the standard class for USB cameras, the same as webcams.

### How to read an endpoint

An endpoint is a "port" of the device, and its address is a single byte. The highest bit gives the
direction: 1 means towards the computer (IN), 0 towards the device (OUT). The low bits are the port
number ([USB Implementers Forum, 2000](#references)). So:

- `0x83` = `1000 0011`: port number 3, **into** the computer;
- `0x05` = `0000 0101`: port number 5, **out** to the device.

*Bulk* is the transfer type designed for blocks of data without strict deadlines, such as those of a
USB stick ([USB Implementers Forum, 2000](#references)).

### What the descriptors tell me

- **The message channel is interface 0.** For the ET5, Tropaion documents interface 0 with `0x05`
  out and `0x83` in ([Tropaion, n.d.](#references)). On the 4C the descriptors show the same two
  addresses.
- **There is one extra endpoint, `0x04` OUT.** In the sources I have read, traffic goes only through
  `0x05` and `0x83`. I do not know what `0x04` is for, and I will not write to it.
- **Inside the 4C there is also a UVC camera**, with a vendor format. It might be a second route to
  the infrared images, but for now I am not touching it.

### The session: a counter for commands

The [entry of 7 November](/en/journal/tobii-4c-wakes-up-after-10-years-of-hibernation/) anticipated
that opening and closing the session go through vendor-defined **control transfers**. Now I look at
how they are made.

A control transfer begins with an eight-byte *setup* packet with five fields
([USB Implementers Forum, 2000](#references); [libusb, n.d.](#references)). According to Tropaion, the
ET5 session is opened like this, right after claiming interface 0 and before any bulk transfer, and
is closed with a twin request on exit ([Tropaion, n.d.](#references)):

| Field | Value | Meaning |
| --- | --- | --- |
| `bmRequestType` | `0x41` | from the computer to the device, vendor request, addressed to an interface |
| `bRequest` | `0x41` opens, `0x42` closes | the "counter number" chosen by Tobii |
| `wValue` | `0` | no parameter |
| `wIndex` | `0` | interface 0 |
| `wLength` | `0` | no data follows |

The first `0x41` can be decoded with the standard. In binary it is `0100 0001`: bit 7 at 0 means
"from the computer to the device", bits 6 and 5 are `10`, that is, "vendor request", and bits 4 to 0
are `00001`, that is, "addressed to an interface" ([Beyond Logic, n.d.](#references)). The second
`0x41`, the opening one, is instead Tobii's choice. That the two values match is, I believe, a
coincidence: at first it confused me.

## How a TTP message is built

On top of USB travels the message protocol that the sources call **TTP**. I describe it with an
image: a message is a **letter inside an envelope**.

- The **envelope** (8 bytes) belongs to USB: it says which direction the message goes and how long
  it is.
- The **header** (24 bytes) is like a letterhead: type of message, reference number, subject.
- The **content** is a series of **labelled parcels**, the TLV fields.

### The envelope: 8 bytes, little-endian

The first byte is the direction: `00` for messages to the device, `01` for those coming from the
device. Three zero bytes follow, then a 4-byte length written in **little-endian**, least
significant byte first ([Tropaion, n.d.](#references)).

There is a curious asymmetry. Outbound, the length counts only the bytes **after** the envelope;
inbound, it counts the **whole** message, envelope included ([Tropaion, n.d.](#references)). A driver
that uses the same rule in both directions is off by 8 bytes every time.

### The header: 24 bytes, big-endian

After the envelope come six 4-byte words, all in **big-endian**, most significant byte first
([Tropaion, n.d.](#references); [Krazubu, n.d.](#references)):

| Position in the message | Field | Meaning |
| --- | --- | --- |
| bytes 8–11 | marker | what type of message it is |
| bytes 12–15 | sequence number (`seq`) | the order number of the request |
| bytes 16–19 | status | 1 in the captured responses, 0 elsewhere |
| bytes 20–23 | op | the command, or the stream number |
| bytes 24–27 | error | 0 if all is well |
| bytes 28–31 | content length | how many bytes follow |

The content therefore starts at byte 32. Four markers are known ([Krazubu, n.d.](#references)):

| Marker | Type of message |
| --- | --- |
| `0x51` | request, from the computer to the device |
| `0x52` | response to a request |
| `0x53` | sample of a stream the computer has subscribed to |
| `0x4e` | asynchronous notification |

Tropaion describes the first three and calls `0x53` a "notification" ([Tropaion, n.d.](#references)):
another case of different names.

Here is a real message: the ET5's response to the first command, *hello*. It is 43 bytes long. I take
it from Krazubu's captures, with my commentary on the right:

```text
01 00 00 00  2b 00 00 00      envelope: from the device (01); length 0x2b = 43 bytes, little-endian
00 00 00 52                   marker 0x52: it is a response
00 00 00 01                   seq 1: answers request number 1
00 00 00 01                   status: 1
00 00 03 e8                   op 0x3e8 = 1000: hello
00 00 00 00                   error: 0
00 00 00 0b                   content length: 11 bytes
00 00                         content prefix
02  00 00 00 04  00 01 00 08  TLV field: type 0x02, length 4, value 0x00010008
```

Two lengths, written in two ways: the one in the envelope is `2b 00 00 00`, in little-endian, while
the content length is `00 00 00 0b`, in big-endian. Mixing the two conventions is the easiest mistake
to make.

### Sequence numbers and ops

The **sequence number** pairs questions with answers. According to Tropaion it starts at 1, grows
with each request and comes back in the response; a response should be accepted only if both the op
and the sequence number match, so that the response to a repeated command is not mistaken for an
old one ([Tropaion, n.d.](#references)). In stream messages, instead, the sequence number has no
meaning and is 0 in the captures. The ET5's gaze frame carries its own counter inside the content:
in the capture it is frame 43780 ([Krazubu, n.d.](#references)).

The *hello* request that produced the response above, as the Windows Stream Engine sends it, is 79
bytes long: 8 of envelope, 24 of header and 47 of content ([Tropaion, n.d.](#references)). It begins
like this:

```text
00 00 00 00  47 00 00 00      envelope: to the device (00); 0x47 = 71 bytes AFTER the envelope
00 00 00 51                   marker 0x51: request
00 00 00 01                   seq 1
00 00 00 00                   0
00 00 03 e8                   op 1000: hello
00 00 00 00                   0
00 00 00 2f                   content: 0x2f = 47 bytes
00 00  17 00 00 00 28  00 00 00 09  00 01 00 00  00 01 00 01  …  00 01 00 08
```

The content is a list (type `0x17`) of nine values, from `0x00010000` to `0x00010008`. The device
answers with `0x00010008`, which Krazubu calls the protocol version. **My hypothesis** is that the
computer lists the versions it knows, from 1.0 to 1.8, and that the device picks the highest.

The **op** says which command is being requested. One thing stands out: written in decimal, the ops
are round numbers, grouped by topic. These are the ones that appear in the sources
([Tropaion, n.d.](#references); [Krazubu, n.d.](#references)). The "effect" column is a **deduction
from the name**, not a verification:

| Op | Decimal | Name in the sources | Presumed effect |
| --- | --- | --- | --- |
| `0x3e8` | 1000 | hello, protocol version | opens the dialogue |
| `0x4b0` | 1200 | stream catalogue | read |
| `0x4ba` | 1210 | columns of a stream | read |
| `0x4c4` | 1220 | stream subscription (*subscribe*) | starts a stream |
| `0x4ce` | 1230 | cancelling the subscription | stops a stream |
| `0x532` | 1330 | properties | read |
| `0x578` | 1400 | *track box*, the volume in which it sees the eyes | read |
| `0x58c` | 1420 | identity strings | read |
| `0x596` | 1430 | screen area (*display area*) | read |
| `0x5a0` | 1440 | screen area | **write** |
| `0x5d2` | 1490 | status | read |
| `0x640` | 1600 | *realm* type | read |
| `0x672` | 1650 | output rate | read |
| `0x76c`, `0x776` | 1900, 1910 | opening the *realm* and response | authentication |
| `0x83e` | 2110 | mounting | read |
| `0xc58` | 3160 | enabled eyes | **write** |
| `0xc62` | 3170 | enabled eyes, or "state" | read |

The **realm** is an authentication mechanism. According to Tropaion the computer first asks what type
it is; if it is 0 no authentication is needed, otherwise a challenge-and-response exchange signed
with HMAC-MD5 follows. The ET5 has been observed without authentication
([Tropaion, n.d.](#references)).

When the device refuses a command, it says so in the error word. Krazubu reports four codes:
`0x20000501` (command not supported), `0x20000505` (unauthorised), `0x20000508` (wrong state) and
`0x20000509` (invalid parameter). It also reports that in the Windows captures the error word is 0 in
every message ([Krazubu, n.d.](#references)).

### The content: TLV fields

The content always begins with two bytes `00 00`, which are skipped. Then come the TLV fields
(*type–length–value*): 1 byte of type, 4 bytes of length in big-endian, then the value
([Tropaion, n.d.](#references); [Krazubu, n.d.](#references)). It is like a parcel with a label:
whoever does not know the type can still skip the parcel, because they know how long it is.

| Type | Value |
| --- | --- |
| `0x01`, `0x02` | unsigned 32-bit integer; `0x01` carries, for example, the presence state |
| `0x03` | signed 16.16 fixed-point number: 32-bit integer divided by 2^16 |
| `0x04` | fixed-point number: signed 64-bit integer divided by 2^42 |
| `0x05` | header of a structure (see below) |
| `0x06` | 64-bit integer, used for timestamps in microseconds |
| `0x14` | text: a 32-bit count and then the characters |
| `0x15` | block of bytes: a 32-bit count and then the bytes |
| `0x17` | list: a 32-bit count and then the items |
| `0x19` | list of fixed-point numbers; Krazubu has only seen it empty |
| `0x1a` | "trailer" 32-bit integer; meaning unclear |

Tropaion documents types `0x02` to `0x06`; the others come from Krazubu
([Tropaion, n.d.](#references); [Krazubu, n.d.](#references)).

Type `0x05` is the most interesting. Its 32-bit value splits into two halves: the high half says
**how many items** follow, the low half **which structure** it is. The known structure codes,
converted to decimal, are round numbers again:

| Code | Decimal | Structure |
| --- | --- | --- |
| `0x0100` | 256 | list of records, such as the stream catalogue |
| `0x0bb8` | 3000 | data row of a stream |
| `0x0bb9` | 3001 | column: a key and a value |
| `0x1f40` | 8000 | 2D point: two fixed-point numbers |
| `0x1f41` | 8001 | 3D point: three fixed-point numbers |

A stream sample, then, is a **row** with a certain number of **columns**, each with a numeric
**key** and a value. The ET5's gaze frame opens with `0x00270bb8`: 0x27, that is, 39 columns
([Tropaion, n.d.](#references)).

Here is the smallest message I know with this structure: a message from the ET5's presence stream,
101 bytes, from Krazubu's captures:

```text
01 00 00 00  65 00 00 00                    envelope: from the device; 0x65 = 101 bytes
00 00 00 53                                 marker 0x53: stream sample
00 00 00 00                                 seq 0: meaningless in streams
00 00 00 00                                 status 0
00 00 05 04                                 op = stream number: 0x504, presence
00 00 00 00                                 error 0
00 00 00 45                                 content: 0x45 = 69 bytes
00 00                                       prefix
05 00 00 00 04  00 02 0b b8                 structure 0x0bb8 (row) with 2 columns
05 00 00 00 04  00 02 0b b9                   column (0x0bb9) of 2 items
02 00 00 00 04  00 00 00 01                     key 1
06 00 00 00 08  00 00 00 18 91 b5 39 08         64-bit value: 105 523 788 040 µs
05 00 00 00 04  00 02 0b b9                   column of 2 items
02 00 00 00 04  00 00 00 02                     key 2
01 00 00 00 04  00 00 00 02                     32-bit value: 2
```

Key 1 is the device timestamp, in microseconds ([Krazubu, n.d.](#references)): 105 523 788 040 µs is
about 29 hours. I do not know since when the device clock counts. Key 2 is 2, and Krazubu describes
this message as that of a present user: **my hypothesis** is that 2 means "present".

### Fixed point: an integer divided by 2^42

In the entry of 7 November I compared fixed point to whole millimetres instead of metres with
decimals. Here are the details. A value of type `0x04` is a signed 64-bit integer to be divided by
2^42, that is, by 4 398 046 511 104 ([Tropaion, n.d.](#references)).

Two examples from the ET5 gaze frame in Krazubu's captures:

- in column `0x1c`, which Krazubu identifies as the gaze point on the screen, the horizontal
  coordinate is `00 00 02 59 62 e8 00 00`. In decimal it is 2 582 934 716 416; divided by 2^42 it
  gives **0.5873**, that is, just past half the screen width;
- in column `0x22`, which Krazubu identifies as the gaze origin of one eye in the screen coordinate
  system, one coordinate is `ff ff 18 65 c0 00 00 00`. The leading bit at 1 indicates a negative
  number, written in two's complement: the value is −254 649 684 721 664, which divided by 2^42 gives
  **−57.9006 mm**.

With the same format, then, the device writes both normalised coordinates, between 0 and 1, and
millimetres. The smallest step is 2^−42, about 2.3 × 10^−13; the largest value is 2^21, about
2.1 million. That is enormous precision for an eye tracker. **My hypothesis** is that it is a matter
of convenience: a single format for every quantity.

Type `0x03` numbers use another scale, 16.16: a 32-bit integer divided by 65 536. Krazubu lists them
for the pupil diameter in millimetres ([Krazubu, n.d.](#references)).

### Split messages and merged messages

To understand why a message can arrive in pieces, one has to go down a level. On the USB cable, data
travel in **packets** whose maximum size is set by the endpoint, typically 512 bytes
([libusb, n.d.](#references)). A bulk transfer ends when the expected amount of data has arrived or
when a packet **shorter** than the maximum arrives, even an empty one
([USB Implementers Forum, 2000](#references), section 5.8.3). It is like a courier delivering with
vans of 512 parcels: a half-empty van means "the delivery is over".

Usually one transfer holds exactly one message. But there are cases where this is not so:

- **fragmentation**: if the message is larger than the space the computer has prepared for the read,
  it arrives over several reads;
- **coalescing**: if a message is an exact multiple of 512 bytes long, the last van is full and does
  not signal the end; the next message can then end up in the same read;
- **instalment responses**: very large responses arrive with a first part that has the envelope and
  a complete header, followed by continuations that have only the envelope
  ([Tropaion, n.d.](#references); [Krazubu, n.d.](#references)).

The ET5 captures contain an example of the third case: a 43-byte response whose header declares
659 067 bytes of content ([Krazubu, n.d.](#references)). It carries 11; the rest arrive later, in
pieces.

The reading program must therefore do the work of a patient post office: accumulate the bytes, read
the declared length, cut out the complete messages, put the instalments back together. If at some
point the bytes make no sense, it must find the start of a message again. The clues are there: an
inbound envelope starts with `01 00 00 00`, declares at least 32 bytes and is immediately followed by
a known marker.

## What holds for the 4C and what remains to be verified

The 4C belongs to the IS4 generation, the ET5 to the next one, IS5. The ET5's identity strings in the
captures say exactly `IS5` and `IS5_Large_Eyetracker_5` ([Krazubu, n.d.](#references)). That the 4C
speaks the same protocol is plausible: the general traits described in the entry of 7 November
(envelope, TLV fields, big-endian, fixed point) are the same ones the sources describe for the ET5.
But "plausible" is not enough: it has to be checked field by field.

| Aspect | ET5, according to the sources | 4C, what I know | To be verified |
| --- | --- | --- | --- |
| USB identifier | `2104:0313` | `2104:0127`, from the descriptors | — |
| Message channel | interface 0, `0x05` OUT and `0x83` IN | same addresses in the descriptors, plus `0x04` OUT | what `0x04` is for |
| Session | vendor control `0x41` / `0x42` | as anticipated on 7 November | whether the 4C reboots on close |
| Envelope, header, TLV | described in detail | general picture, as in the entry of 7 November | every field, starting from the response to hello |
| Protocol version | `0x00010008` | — | the 4C's response to hello |
| Identity | `IS5`, `IS5_Large_Eyetracker_5` | IS4 according to the sources | the 4C's strings |
| Stream catalogue | 9 streams: gaze, image, presence, image_collection, primary_camera_image, algodbg, is5_sync_stream, log, custom | — | which streams the 4C has |
| Gaze frame | 39 columns | — | whether the 4C uses the same keys |
| Realm | no authentication | — | the 4C's realm type |
| Screen area | reset at every reboot | — | whether the 4C keeps it |
| Infrared images | about 78 KB per image (Tropaion) | UVC camera, 640 × 480 at 8 bits | format and size of the 4C's images |

Two rows deserve a comment.

**The ET5 catalogue has no head-pose stream.** In the entry of 7 November I wrote that the 4C does
not send a real head pose and that, in my view, on Windows it is computed by the PC software. The
official kit lists head position among the streams of the 4C family
([Tobii Developer Zone, n.d.](#references)); yet, in the ET5 USB catalogue captured by Krazubu, there
is no stream by that name. It remains **a hypothesis**, but now it is a hypothesis with one more clue.

**The images could be much larger.** Tropaion speaks of ET5 images of about 78 KB
([Tropaion, n.d.](#references)), and Krazubu of a 280 × 280 pixel infrared face image
([Krazubu, n.d.](#references)): at 8 bits per pixel that makes 78 400 bytes, so the two figures are
consistent. If the 4C sent the whole image from its camera, 640 × 480 at 8 bits, it would be about
307 KB per message, four times as much. This is a calculation, not an observation: but it says that
the reading program will have to cope with very large messages.

### The hypotheses I take to the next entry

1. **H1.** The 4C uses the same envelope, the same header and the same TLV types as the ET5.
2. **H2.** The 4C answers hello with a protocol version, perhaps the same as the ET5's.
3. **H3.** The ET5's read ops (identity, catalogue, columns, screen area) also exist on the 4C, with
   the same number.
4. **H4.** The 4C's catalogue contains no head-pose stream, but does contain an image stream.
5. **H5.** The 4C's gaze frame uses the same column keys as the ET5, at least for gaze point, gaze
   origin and pupils.
6. **H6.** The 4C's `0x04` values follow the same 2^42 scale.

## The rules before sending anything

Reading the descriptors carries no particular risk. Sending commands does. Before doing so I set
myself these rules:

1. **Only commands already seen.** At first I send only messages that appear in the sources'
   captures, byte for byte, and only those that, judging by the name, read: hello, identity,
   catalogue, columns, reading the screen area.
2. **No persistent writes.** No writing of the screen area (op 1440), of the enabled eyes (op 3160)
   or of other settings, until I can read and save the current value so that I can restore it.
3. **Never on endpoint `0x04`.** I do not know what it is for.
4. **One question at a time.** Every test has a question written beforehand, a capture of the traffic
   with usbmon and a note on what I did.
5. **Care with the infrared illuminators.** I do not know which commands control them. During the
   tests I do not look at the sensor from close up for long, and I stay within the operating distance
   given in the specifications (50–95 cm, see the
   [entry of 7 November](/en/journal/tobii-4c-wakes-up-after-10-years-of-hibernation/)).
6. **A simple emergency switch.** If the device behaves unexpectedly, I unplug it: the USB cable is
   also its power supply.
7. **Only me in front of the sensor.** At this stage no other person acts as a subject and I record no
   data from others.

When, in the next entry, I start varying the fields, I will begin with the read commands and apply
the same rules.

## What I have learned

- The protocol has a regular structure: envelope, fixed header, self-describing fields. That is good
  news, because an unknown field can be skipped without losing the rest.
- The only exception to big-endian is the length in the USB envelope, and it is also the place where
  it is easiest to go wrong.
- The sources on the ET5 are rich, but they do not always agree on names. The bytes matter more than
  the names.
- Having captures with the expected result alongside is valuable: it will make it possible to check a
  decoding even before plugging in the 4C.

## Open problems

- **All the sources concern the ET5.** None of the detailed information in this entry has yet been
  confirmed on the 4C.
- **Conflicting names.** The third and fifth words of the header and command 3170 have different
  names in the sources. They will need to be clarified by observing the behaviour.
- **Unclear types.** TLV types `0x19` and `0x1a` have an uncertain meaning even for the ET5.
- **Endpoint `0x04` and the video interface** of the 4C remain unexplained.
- **The legal framework.** Tobii's official kit ties the use of some streams to separate licences. I
  am not a lawyer: before publishing a driver I will need to understand better what an independent
  implementation of the protocol entails, including with respect to the licences of the projects I
  have read.

## Next steps

1. Set up recording of the USB traffic with usbmon, so that every test is documented.
2. Open the session on the 4C and send hello: it is the first check of H1 and H2.
3. Read identity, stream catalogue and gaze columns, and compare them with the ET5's (H3, H4, H5).
4. Decode a first gaze frame from the 4C and check the scale of the values (H6).
5. Annotate every field with its level: confirmed on the 4C, documented on the ET5, hypothesis.

In the next entry I will describe the traffic captures and the tests on the fields, so-called
*fuzzing*: giving names to the bytes, one at a time, dead ends included.

> **Disclaimer.** Kite is an experimental project and **is not a certified medical device**. The work
> described here uses the tracker in ways the manufacturer did not foresee: sending commands whose
> effect is unknown could change its behaviour, including that of the infrared illuminators, or leave
> it in a state that is hard to restore. Anyone wishing to reproduce it does so at their own risk.
> Anyone who depends on an AAC tool to communicate should always have a backup. Trials with people
> require informed consent and, where needed, the approval of an ethics committee.

## References

1. Aetherall (n.d.). *tobiifree: Tobii Eye Tracker 5 For Linux and Web* [community repository,
   unofficial; GPL-3.0 licence]. GitHub.
   [github.com/Aetherall/tobiifree](https://github.com/Aetherall/tobiifree)
2. Beyond Logic (n.d.). *USB in a NutShell*, chapter 6: USB Requests. Introductory guide to the USB
   standard. [beyondlogic.org](https://www.beyondlogic.org/usbnutshell/usb6.shtml)
3. Eitol (n.d.). *tobii_eye_tracker_linux_installer: Installation and testing of tobii eye tracker in
   Ubuntu 18.10* [community repository, unofficial]. GitHub.
   [github.com/Eitol/tobii_eye_tracker_linux_installer](https://github.com/Eitol/tobii_eye_tracker_linux_installer)
4. Krazubu (n.d.). *Open-tobii* (originally *tobii-linux*, fork of Skyggedans/tobii-linux)
   [community repository, unofficial: driver for the Tobii Eye Tracker 5; MIT licence, copyright
   2026 Andrii Klaptsov]. GitHub. Captures in `crates/tobii-proto/fixtures/`, field descriptions in
   `crates/tobii-proto/src/`.
   [github.com/Krazubu/Open-tobii](https://github.com/Krazubu/Open-tobii)
5. libusb (n.d.). *libusb-1.0 API Reference*: pages "Packets and overflows" and "Synchronous device
   I/O". Official technical documentation.
   [libusb.sourceforge.io](https://libusb.sourceforge.io/api-1.0/libusb_packetoverflow.html)
6. Linux kernel documentation (n.d.). *usbmon*. Official technical documentation.
   [docs.kernel.org/usb/usbmon.html](https://docs.kernel.org/usb/usbmon.html)
7. Linux USB Project (2026). *List of USB ID's* (`usb.ids`), version 2026.06.26, vendor entry
   `2104`. [linux-usb.org/usb.ids](http://www.linux-usb.org/usb.ids)
8. Tobii Developer Zone (n.d.). *How to get started with developing software for the Eye Tracker with
   the PDK*. Official technical documentation.
   [developer.tobii.com](https://developer.tobii.com/how-to-get-started-with-developing-software-for-the-eye-tracker-with-the-pdk/)
9. Tropaion (n.d.). *Tobii_Linux* [community repository, unofficial: reimplementation of the Tobii
   Eye Tracker 5 USB protocol for Linux; GPL-3.0 licence] and its wiki, pages "USB Transport",
   "TTP Framing", "Encoding", "Handshake", "Op Catalog" and "Reverse Engineering Methodology". GitHub.
   [github.com/Tropaion/Tobii_Linux](https://github.com/Tropaion/Tobii_Linux);
   [wiki](https://github.com/Tropaion/Tobii_Linux/wiki)
10. USB Implementers Forum (2000). *Universal Serial Bus Specification, Revision 2.0*. Standard; in
    particular chapter 9 (descriptors and requests) and section 5.8.3 (bulk packet size).
    [usb.org](https://www.usb.org/document-library/usb-20-specification)
