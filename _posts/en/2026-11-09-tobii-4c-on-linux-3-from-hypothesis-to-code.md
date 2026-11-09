---
ref: tobii-4c-linux-re-3
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Tobii 4C on GNU/Linux (3/3): from hypothesis to code"
description: How I am turning the goals of the free driver for the Tobii 4C into a design, and how I have started writing it with the help of AI. An assembly line of goroutines, memory prepared at start-up, a supervisor and tests that replay real USB captures. The driver is being written and has not yet been tried on the device.
tags: [eye-tracking, tobii, linux, driver, go, architecture]
---

This is the third and final part of the series on the protocol of the **Tobii Eye Tracker 4C**. In
the [first part](/en/journal/tobii-4c-on-linux-1-reading-before-touching/) I described what I read
before touching the device and how the message-based protocol I refer to as TTP is built. In the
[second part](/en/journal/tobii-4c-on-linux-2-putting-names-to-bytes/) I put names to the bytes: the
gaze, presence and image streams, the columns of the samples, the dead ends.

Here I move from hypothesis to code. In the
[opening entry](/en/journal/tobii-4c-wakes-up-after-10-years-of-hibernation/) I set myself five
technical goals: no proprietary components, a concurrent pipeline, zero allocations during streaming,
low latency, an open output. In this entry I describe how I am turning them into a design and how I
have started writing the code, with the help of an AI assistant.

An honest premise: **the driver is in design and first drafting**. I have not yet tried it on the 4C.
There are no latency or performance measurements: there are the choices, their reasons, the first
pieces of code and the way I intend to verify them.

## The basic choices

### Everything in user space, no kernel module

An operating system has two "zones". The **kernel** is the core, which governs memory and devices.
**User space** is the zone where ordinary programs run. A driver can be written as a **kernel
module**, that is, a piece of code added to the core of the system, or as an ordinary program.

I chose the second road, for three reasons:

1. **An error stays contained.** If the driver hangs or crashes, a program closes; the computer does
   not stop.
2. **Nothing to rebuild at every update.** A kernel module must be kept in step with kernel versions;
   a user-space program does not.
3. **It is easier to distribute and to study.** Anyone who wants to try it does not have to load code
   into the core of their own system.

This is possible thanks to **libusb**, a C library that provides generic access to USB devices from
an ordinary program ([libusb, n.d.](#references)).

### Go, with gousb on top of libusb

I am writing the driver in **Go**. The reasons are tied to the goals:

- **Concurrency is built into the language.** Go has two native tools, *goroutines* and *channels*,
  which I describe below. They are exactly what an assembly line needs.
- **The verification tools are included.** The standard library's `testing` package can run tests,
  measure performance and count memory allocations ([The Go Authors, n.d.-e](#references)). The **race
  detector** looks for incorrect concurrent accesses to memory ([The Go Authors, n.d.-a](#references)).
- **Memory is managed safely.** There is a price, though: a *garbage collector*, a mechanism that
  reclaims memory no longer in use on its own. Its work grows with the amount of memory the program
  requests, and it can introduce small pauses and delays ([The Go Authors, n.d.-c](#references)). This
  is the reason for the "zero allocations" goal, which I discuss further down.

To talk to libusb I use **gousb**, a Google library that makes it usable from Go, under the Apache 2.0
licence ([Google, 2024](#references)). Two of its features matter a great deal here. The first keeps
**several read transfers always queued**: while the program processes one block of data, the device
already finds other slots ready to write into. The second **automatically detaches** any kernel driver
bound to the USB interface, and reattaches it when the program releases the interface
([Google, 2024](#references)).

### A udev rule to avoid running as root

There is one last practical obstacle. On GNU/Linux every USB device is represented by a file, in a
folder such as `/dev/bus/usb/001/007`. Whoever can open that file for writing can talk to the device.
Normally, without special instructions, that is the administrator (*root*). Running the driver as
administrator, however, would mean giving it the power to do anything on the system.

The solution is **udev**, the component that handles device events and the permissions of their files
([systemd, n.d.-b](#references)). It works like a doorkeeper with a list of instructions: when a
device is plugged in, it goes through the **rules** and applies those that match. The rule I am
preparing for the 4C is a single line:

```
SUBSYSTEM=="usb", ENV{DEVTYPE}=="usb_device", ATTR{idVendor}=="2104", ATTR{idProduct}=="0127", TAG+="uaccess"
```

It reads like this: "if a USB device arrives with vendor code `2104` (Tobii) and product code `0127`
(the 4C), add the `uaccess` tag to it". The `uaccess` tag ties access to the device to the **active
local session**: whoever is sitting at the computer, with their desktop open, gets the permission;
when the session is no longer active, the permission is updated accordingly
([systemd, n.d.-c](#references)).

Two details. The rule file is called `70-tobii-4c.rules`, and the number is not arbitrary: udev reads
the files in lexicographic order ([systemd, n.d.-b](#references)), and the `uaccess` tag is turned into
a permission by a systemd file called `73-seat-late.rules` ([systemd, n.d.-a](#references)). My rule
must therefore come first. Moreover, a remote SSH connection on its own is not an active local
session: a computer without a screen will need a variant based on a user group, which I leave
commented out in the file.

## The architecture: an assembly line

### Goroutines and channels, in plain words

A **goroutine** is a function that works in parallel with the others, inside the same program. It is
lightweight: it costs little more than the memory for its stack, and Go spreads goroutines across the
operating system's threads, so that if one stops to wait for a device the others carry on
([The Go Authors, n.d.-b](#references)). Think of it as a worker with a precise task.

A **channel** is the conveyor belt between two workers: one puts an object on it, the other picks it
up. A channel can have a **capacity**: if the belt is full, whoever is putting things on it has to
wait, or can decide to do something else. Go's motto sums up the idea: do not communicate by sharing
memory; instead, share memory by communicating ([The Go Authors, n.d.-b](#references)). The model has
deep roots, in Hoare's *Communicating Sequential Processes* ([Hoare, 1978](#references);
[The Go Authors, n.d.-d](#references)).

A **pipeline**, in Go terms, is exactly this: a series of stages connected by channels, where each
stage is made of goroutines that receive data from the previous stage, process it and pass it on to
the next ([Ajmani, 2014](#references)).

### The stages

The line I am writing has four stages, plus a supervisor that watches over it:

```
  USB IN 0x83
      │
      ▼
  ┌────────┐   raw bytes   ┌────────┐  message + seq  ┌──────────┐  sample  ┌─────────┐
  │ reader │ ────────────→ │ framer │ ──────────────→ │ worker×N │ ───────→ │ emitter │ → output
  └────────┘               └────────┘                 └──────────┘          └─────────┘
      ↑                      │    ↑                                              │
      └─ raw buffers ────────┘    └───────────── frame buffers ──────────────────┘

  supervisor: keep-alive, watchdog, ordered shutdown, reconnection
```

The arrows at the bottom are the return paths of memory: the framer gives the raw buffers back to the
reader as soon as it has read them, while the emitter gives the frame buffers back to the framer only
after emission.

| Stage | Goroutines | What it does | What it does not do |
| --- | --- | --- | --- |
| **reader** | one | it is the only one that reads from the USB input endpoint `0x83`; it passes the bytes on | it interprets nothing |
| **framer** | one | it reassembles split or merged TTP messages; it delivers replies to the commands waiting for them; it copies gaze samples into ready-made buffers; it numbers the samples with a `seq` counter | it does not decode the fields |
| **worker** | N, two for now | they decode the TLV fields of the row and fill in a fixed-size sample | they do not write to the outputs |
| **emitter** | one | it puts the samples back in order, detects gaps in the device counter, writes to the outputs, returns the buffers | it does not read from USB |

### Why separation helps latency

The 4C produces a gaze sample roughly every 11 ms (90 Hz). If a single function read, reassembled,
decoded and sent, a delay anywhere, for example a program slow to receive the data, would also stop the
reading. Samples would pile up in the USB queue, and Kite's cursor would lag behind the eyes.

With separate stages, each one does one thing and does it immediately. The **reader** in particular
does nothing but wait for the device and pass the bytes on: it is the stage that must never stop. The
heavier stages, such as decoding, can also work in parallel on several samples.

This is the simplified skeleton of how I start the stages (code **being written**):

```go
// One goroutine per stage; channels connect the stages.
go s.reader()                     // USB IN 0x83 → rawCh
go s.framer()                     // rawCh → jobs
for i := 0; i < opt.Workers; i++ {
	go s.worker()                 // jobs → results
}
go s.emitter()                    // results → outputs
```

### From bytes to numbers

The workers' job rests on two facts about the protocol described in the first part: numbers are
**big-endian** and coordinates are in **fixed point**, 64-bit integers to be divided by 2^42. In code
they become a few lines:

```go
const q42Scale = 1 << 42 // 2^42

// I64 reads 8 bytes with the most significant byte first (big-endian).
func (t TLV) I64() (int64, bool) {
	if len(t.Value) != 8 {
		return 0, false // unexpected length: the field is not valid
	}
	return int64(binary.BigEndian.Uint64(t.Value)), true
}

// Fixed42 turns the integer into a number with a decimal point.
func (t TLV) Fixed42() (float64, bool) {
	v, ok := t.I64()
	return float64(v) / q42Scale, ok
}
```

An example: if the field contains the integer 2,199,023,255,552, that is 2^41, the coordinate is
2^41 / 2^42 = 0.5. The length check matters as much as the formula: if a field does not have the
shape I expect, the program flags it as invalid instead of making up a number.

## Memory: prepared at start-up and reused

### A pool of buffers

When the session opens, the driver prepares two stocks of memory, which never change afterwards:

- the **raw buffers**, where the reader receives the USB transfers;
- the **frame buffers**, where the framer copies each reassembled gaze sample.

The stocks sit in channels used as **lists of free buffers**: whoever needs a buffer takes it from the
channel, whoever has finished puts it back. It is a pattern also described in the *Effective Go* guide
([The Go Authors, n.d.-b](#references)), with one important difference that I explain shortly: when the
stock is empty, the guide allocates a new buffer, whereas I discard the sample.

### Samples passed by value

The decoded sample is a **fixed-size** structure: numbers and small vectors of known length, no
pointers to outside memory. It moves from one stage to the next **by value**, that is, copied, the way
you hand over a filled-in form instead of a note saying "the form is in the drawer". The copy is cheap
and does not ask the system for new memory. Go's garbage collector guide points precisely to reducing
allocations as one of the most effective optimisations ([The Go Authors, n.d.-c](#references)).

### A ring to restore order

With several workers in parallel, samples can finish out of order. Worker 1 may finish sample 8
before worker 2 finishes sample 7. The framer, however, has numbered each sample with an increasing
`seq` counter, in the order of arrival from USB.

The emitter keeps a **ring**, a circular array of slots. The sample with number `seq` goes into slot
`seq` modulo the size of the ring. The emitter emits only the sample it is waiting for, then the next,
and so on: if 7 has not arrived yet, 8 waits in its slot.

```go
idx := r.s.Seq % n
ring[idx], present[idx] = r, true
for present[next%n] { // emit only in order, with no gaps
	i := next % n
	present[i] = false
	next++
	s.frameFree <- ring[i].fb // only now does the buffer go back to the pool
	// ... device counter check, writing to the outputs
}
```

### The invariant: a buffer goes back to the pool only after emission

An **invariant** is a rule that must hold always, at any moment. Here it is this: **a frame buffer goes
back to the pool only when its sample leaves the ring to be emitted**.

The consequence is that samples "in flight", that is, taken by the framer and not yet emitted, can
never outnumber the buffers in the pool. If the ring has as many slots as there are buffers, two
in-flight samples can never land in the same slot and overwrite each other. It is a simple constraint,
but it is what holds the line together: whoever changes the size of the pool or of the ring in the
future will have to respect it.

### Better to lose a sample than to accumulate delay: `host_drops`

What happens if the line is saturated and there is no free buffer left in the pool? The framer does
not wait. It discards the sample that has just arrived and counts it:

```go
var fb *frameBuf
select {
case fb = <-s.frameFree: // there is a free buffer in the pool
default:
	// Pipeline saturated: better to lose this sample than to accumulate delay.
	s.t.Stats.HostDrops.Add(1)
	return
}
fb.b = append(fb.b[:0], payload...) // copy into the ready-made buffer
s.jobs <- job{seq: seq, rxNs: rx, fb: fb}
```

This is the fourth goal translated into code. For a gaze keyboard, a sample half a second old is
useless, even harmful: it moves the cursor to where the eyes no longer are. The `host_drops` counter
says how many times this has happened, and whose fault it is: my computer's.

### The device's gaps: `device_drops`

There is also the other case: a sample the computer never received. Every gaze sample carries a
**frame counter** written by the device. The emitter learns the normal step between two consecutive
samples, the smallest positive jump observed, and when the jump is larger it counts the missing
samples in the `device_drops` counter. Alongside, it records how much time has passed according to the
tracker's clock and according to the computer's: this helps tell whether a sample never left over USB
or whether reception stopped.

Keeping the two counters separate is a methodological choice. When I measure data quality, I want to
know whether the losses are mine or the device's.

## The supervisor

Next to the line runs a **supervisor**, which does not touch the data but watches over the session. I
consider it as much a part of the design as the stages.

- **Keep-alive.** At regular intervals it sends the device a harmless question, the request for the
  identity strings, and measures how long the reply takes. If there is no reply within the expected
  time, the session is considered dead.
- **Watchdog.** A "watchdog" checks every 250 ms when the last gaze sample arrived. If the stream is
  silent beyond a threshold, 3 s for now, the supervisor tries to subscribe to it again. If it is still
  silent, it closes the session.
- **Ordered shutdown.** When I ask the driver to stop, order matters. First the stream subscriptions
  are cancelled, while the reader is still alive and can receive the replies; then the line is
  stopped; finally the session is closed with the vendor control transfer and the device is released.
  This is why the session has its own shutdown context, separate from the user's request: the line has
  to stay up long enough to say goodbye to the device.
- **Reconnection with exponential backoff.** If the cable is unplugged or the session drops, the driver
  tries again. Not immediately, and not forever at the same pace: it waits 1 s, then 2, then 4, then 8,
  up to a maximum of 10 s. If the previous session had been working, the wait starts again from the
  minimum. It is the same principle by which the first Ethernet networks doubled the mean waiting time
  after each collision ([Metcalfe and Boggs, 1976](#references)): when something is wrong, retrying
  less and less often avoids wasting resources and clogging the system.

There is one case in which the supervisor does **not** retry: when permission to access the device is
missing. Retrying would not help. The driver stops and explains how to install the udev rule or, if
the rule is already there, reminds the user that an active local session is needed.

## Tests: a defence against wrong hypotheses

In the opening entry I wrote that an AI assistant can propose interpretations of the protocol that are
plausible but wrong. Tests are how I intend to notice.

### They do not touch the device

The tests never open the 4C. **They replay real USB captures**: messages recorded while the official
Windows software, the Stream Engine, was talking to a **Tobii Eye Tracker 5** (ET5), the 4C's
successor, which uses the same protocol family. The captures come from the community project
Open-tobii, formerly called tobii-linux; they are distributed under the MIT licence and the author
blanked the device serial number ([Krazubu, n.d.](#references)). For one of the captured gaze samples,
the same project reports the values the Stream Engine delivered.

This allows a very strict test: decode that sample and require the numbers to be **bit-for-bit
identical** to the Stream Engine's, not "close enough":

```go
func TestDecodeRealGazeFrame(t *testing.T) {
	msg := fixture(t, "et5-session1-gaze-frame") // real ET5 capture
	_, payload, _ := ParseHeader(msg)
	var row Row
	if err := DecodeRow(payload, &row); err != nil {
		t.Fatal(err)
	}
	// Values delivered by the Windows Stream Engine for this frame.
	fc, _ := row.Get(0x14)
	if fc.U != 43_780 {
		t.Fatalf("frame counter %d", fc.U)
	}
	g, _ := row.Get(0x1c)
	if g.F[0] != 0.5872913599014282 || g.F[1] != 0.09927384555339813 {
		t.Fatalf("gaze point %+v", g)
	}
}
```

If a hypothesis about byte order, about the fixed-point scale or about the meaning of a column is
wrong, the number changes and the test fails.

Other tests concern message reassembly. They take three real messages, glue them together, then split
them into pieces of 1, 7, 64, 512 and 1000 bytes, or pass them in whole, and require exactly the same
three messages to come out. Another puts junk bytes in front of a valid message and checks that the
program regains synchronisation.

### Allocations, benchmarks and the race detector

For the "zero allocations" goal I use the `testing.AllocsPerRun` function, which counts the average
allocations of a function run many times ([The Go Authors, n.d.-e](#references)). The test requires
zero:

```go
allocs := testing.AllocsPerRun(1000, func() { _ = DecodeRow(payload, &row) })
if allocs != 0 {
	t.Fatalf("DecodeRow allocates %.1f times per call", allocs)
}
```

Go **benchmarks** measure the time and allocations of a repeated function
([The Go Authors, n.d.-e](#references)). For now I use them as a tool, not as a result: I report no
figures, because without the 4C they say nothing yet about real latency.

The **race detector** is enabled with the `-race` flag and reports when two goroutines access the same
variable at the same time and at least one of them writes to it. It has a limitation I want to keep in
mind: it only finds problems that actually occur during execution, not those hidden in code paths the
tests do not exercise ([The Go Authors, n.d.-a](#references)).

## How I work with AI on the code

The division of tasks is the one I announced. The AI assistant proposes solutions and writes drafts of
code, including drafts of tests. I review every line before it enters the project, I write or require a
test for every hypothesis about the data format, and I reject whatever does not match the captures.

In practice I follow a few rules:

- **No hypothesis without a comparison.** An interpretation of a field enters the code together with a
  test that compares it against a real message.
- **The device has the last word.** At start-up the driver asks the 4C for the list of sample columns
  and warns if the column map I use does not match the one declared by the firmware. That way a wrong
  hypothesis, or a different firmware, shows up at once instead of producing plausible but false
  numbers.
- **Comments that explain why.** Every non-obvious choice, such as the number 70 in the udev rule or the
  shutdown order, carries its reason written in the code, in Italian.

The limitation of this method is clear: the review is done by me, alone. If I misunderstand something,
the tests can confirm a mistake of mine just as easily as one of the AI's. That is why I publish the
reasoning here, where others can read it.

## Open problems

- **The pipeline has not yet been tried on the 4C.** Everything I have described is design and code
  being written. The first contact with the device may disprove more than one choice.
- **The tests use ET5 captures, not 4C ones.** The two trackers share the protocol family, but the
  sample columns and some commands may differ. 4C captures are needed for the tests.
- **The parameters are chosen a priori.** Number of workers, size of the pool and of the ring, watchdog
  threshold and backoff times are starting values, not tuned on measurements.
- **"Zero allocations" is verified only function by function.** The tests check decoding and
  reassembly, not the whole program while running. The garbage collector may still work for other
  parts.
- **How many losses are acceptable?** Discarding samples protects against latency, but I do not yet
  know how many `host_drops` and `device_drops` Kite can tolerate before gaze typing suffers.
- **Access without root has a cost.** The `uaccess` rule requires an active local session; the variant
  for systems without a screen grants access to a user group, and should be used with care on shared
  computers.

## Next steps

1. Try the pipeline on the real 4C and measure latency, `host_drops` and `device_drops` over long
   sessions, reporting negative results too.
2. Record 4C captures, remove the serial number, and add them to the tests alongside the ET5 ones.
3. Define and document the **open output** through which Kite, and any other program, will receive the
   samples.
4. Tackle gaze **calibration** on the 4C.
5. Bring the head **pitch** estimate to the sensor's infrared images, starting from the
   [webcam prototype](/en/journal/tobii-4c-head-pitch-from-the-face/).

This entry closes the series on the protocol, not the work. I will report here on the first encounter
between the code and the device, however it goes.

> **Disclaimer.** Kite is an experimental project and **is not a certified medical device**. The driver
> described here is being written and has not yet been tried on the device. An unofficial driver uses
> the tracker in ways the manufacturer did not foresee: sending commands whose effect is unknown could
> change its behaviour, including that of the infrared illuminators. Permissive udev rules, which give
> any user access to the device, are not recommended on shared computers. Anyone who depends on an AAC
> tool to communicate should always have a backup. Trials with people require informed consent and,
> where needed, the approval of an ethics committee.

## References

1. Ajmani S. (2014, March 13). Go Concurrency Patterns: Pipelines and cancellation. *The Go Blog*.
   [go.dev/blog/pipelines](https://go.dev/blog/pipelines)
2. Google (2024). *gousb*, version 1.1.3: Go bindings for libusb, Apache 2.0 licence. Official technical
   documentation. [pkg.go.dev/github.com/google/gousb](https://pkg.go.dev/github.com/google/gousb)
3. Hoare C. A. R. (1978). Communicating sequential processes. *Communications of the ACM*, 21(8),
   666–677. [doi:10.1145/359576.359585](https://doi.org/10.1145/359576.359585)
4. Krazubu (n.d.). *Open-tobii* (formerly *tobii-linux*): Linux driver for the Tobii Eye Tracker 5, with
   the test captures in `crates/tobii-proto/fixtures/` [community repository, unofficial], MIT licence.
   GitHub. [github.com/Krazubu/Open-tobii](https://github.com/Krazubu/Open-tobii)
5. libusb (n.d.). *libusb*. Official website and documentation of the library.
   [libusb.info](https://libusb.info/)
6. Metcalfe R. M., Boggs D. R. (1976). Ethernet: distributed packet switching for local computer
   networks. *Communications of the ACM*, 19(7), 395–404.
   [doi:10.1145/360248.360253](https://doi.org/10.1145/360248.360253)
7. systemd (n.d.-a). *73-seat-late.rules* (source of systemd's udev rules). GitHub, systemd/systemd.
   [github.com/systemd/systemd](https://github.com/systemd/systemd/blob/main/rules.d/73-seat-late.rules.in)
8. systemd (n.d.-b). *udev: Dynamic device management*. Manual page, official documentation.
   [freedesktop.org](https://www.freedesktop.org/software/systemd/man/latest/udev.html)
9. systemd (n.d.-c). *sd-login: APIs for tracking logins*. Manual page, official documentation, entry on
   the `uaccess` tag.
   [freedesktop.org](https://www.freedesktop.org/software/systemd/man/latest/sd-login.html)
10. The Go Authors (n.d.-a). *Data Race Detector*. Official Go documentation.
    [go.dev/doc/articles/race_detector](https://go.dev/doc/articles/race_detector)
11. The Go Authors (n.d.-b). *Effective Go*, section "Concurrency". Official Go documentation.
    [go.dev/doc/effective_go](https://go.dev/doc/effective_go#concurrency)
12. The Go Authors (n.d.-c). *A Guide to the Go Garbage Collector*. Official Go documentation.
    [go.dev/doc/gc-guide](https://go.dev/doc/gc-guide)
13. The Go Authors (n.d.-d). *Frequently Asked Questions*, entry "Why build concurrency on the ideas of
    CSP?". Official Go documentation. [go.dev/doc/faq](https://go.dev/doc/faq)
14. The Go Authors (n.d.-e). *Package testing*. Official documentation of the Go standard library.
    [pkg.go.dev/testing](https://pkg.go.dev/testing)
