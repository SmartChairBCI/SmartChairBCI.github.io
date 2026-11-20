---
ref: tobii-4c-linux-driver-public
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Tobii 4C on GNU/Linux: the driver is public on GitHub"
description: I have published tobii4c-linux, the free driver for the Tobii Eye Tracker 4C, under the MIT licence. I describe what it does, how to install it and under which licence.
tags: [eye-tracking, tobii, linux, driver, open-source, github]
---

The free driver for the **Tobii Eye Tracker 4C** that I have been writing about over the last two
weeks is now public on GitHub, under the MIT licence:
[github.com/ablescia/tobii4c-linux](https://github.com/ablescia/tobii4c-linux).

I have already told how I got here, and I will not repeat it. The protocol is in the
[first](/en/journal/tobii-4c-on-linux-1-reading-before-touching/) and
[second part](/en/journal/tobii-4c-on-linux-2-putting-names-to-bytes/) of the series, the
architecture and the basic choices in the [third](/en/journal/tobii-4c-on-linux-3-from-hypothesis-to-code/).

In this entry I say what the driver does, how to install it and under which licence it is
distributed.

## The repository at a glance

| Item | Value |
| --- | --- |
| Address | [github.com/ablescia/tobii4c-linux](https://github.com/ablescia/tobii4c-linux) |
| Licence | MIT |
| Language | Go, version 1.22 or later, with libusb-1.0 |
| Device | Tobii Eye Tracker 4C (USB `2104:0127`), tested on a single unit, firmware 4.7.0 |
| Eye Tracker 5 | the driver accepts its identifier (`2104:0313`), but it has not been tested on the ET5 |
| Systems tested | Debian 13 and Arch Linux (Omarchy) |
| Versions | no releases and no tags: it is built from the sources of the `main` branch |
| Documentation | README in Italian, with an English summary |

## What it does

The driver is an ordinary program, with no kernel module and none of Tobii's proprietary programs.
It talks to the 4C over USB and passes the data on to other programs. In practice it:

- **reads** gaze, eye positions, pupil diameter, head pose and presence, about one sample every
  11 ms;
- **forwards them** over UDP on the same computer, in the T4CG v2 format I described
  [on 11 November](/en/journal/tobii-4c-on-linux-putting-the-driver-to-the-test/#3-the-open-output-for-kite-and-for-other-programs),
  and, if needed, over Lab Streaming Layer (LSL). The repository includes an example receiver in
  Python, `examples/recv.py`, that uses only the standard library: it is the simplest starting point
  for connecting another program;
- **calibrates the gaze** with a full-screen application that repeats the steps of the official one:
  sensor placement, a check of the person's position, 7 calibration points and 5 validation points.
  Before starting it saves the active calibration and puts it back on the device if the procedure is
  cancelled;
- **remembers the set-up**: with the `-display-mm saved` and `-calibration saved` options it rereads
  the display area and the calibration saved by `tobii4c calibrate` and writes them back to the 4C at
  every connection, also after the tracker has been unplugged and plugged in again. This is needed
  because the 4C forgets the display area when it is left without power, as I had seen with
  [Tobii Race](/en/journal/tobii-race-a-driving-game-to-put-the-4c-to-the-test/). If a file is
  missing, the driver writes this to the log and starts anyway. The systemd service uses both
  options;
- **calibrates the infrared camera** and the personal zero of the head pitch, with
  `tobii4c headpose-calibrate`. This is needed only for the pitch, which the driver estimates from the
  4C's images, as I described
  [on 11 November](/en/journal/tobii-4c-on-linux-putting-the-driver-to-the-test/);
- **runs as a user service**, with systemd, and accesses the tracker without administrator rights
  thanks to a udev rule, as explained in the
  [third part](/en/journal/tobii-4c-on-linux-3-from-hypothesis-to-code/).

## How to install it

The README describes a five-step quick start. On Debian or Ubuntu:

```sh
# 1. dependencies and sources
sudo apt install git make golang libusb-1.0-0-dev pkg-config
git clone https://github.com/ablescia/tobii4c-linux.git && cd tobii4c-linux

# 2. program in ~/.local/bin, udev rule (asks for sudo), user systemd service
make install install-udev install-service

# 3. with the 4C connected and mounted below the screen: set-up and calibration
tobii4c calibrate

# 4. start the driver as a service, at later logins too
systemctl --user enable --now tobii4c

# 5. check: samples arrive on UDP 127.0.0.1:5005
tobii4c recv
```

On Arch Linux the dependencies are `git base-devel go libusb pkgconf`. Anyone who does not want to
clone the repository can use `go install`, but Go, libusb-1.0 with its header files and pkg-config
are still needed. The face model for the pitch, 4.9 MB, is already embedded in the program: it does
not have to be downloaded separately.

Three practical things to know before trying it:

1. **The service keeps the tracker in exclusive use.** Before running `tobii4c calibrate` or
   `tobii4c headpose-calibrate` it must be stopped, and then restarted. Otherwise the command answers
   `device or resource busy`.
2. **The calibration windows need a graphical session**, X11 or Wayland with XWayland.
3. **The udev rule works with an active local session.** An SSH connection alone is not enough: for a
   computer without a screen the file contains a commented-out variant based on a user group.

## Licence and third-party components

The driver is under the **MIT** licence: anyone may use, modify and redistribute it, in commercial
products too, provided that the copyright notice and the licence text are kept. The software is
provided without warranty.

The repository also contains components by others, each with its own licence. They are listed in
the `THIRD_PARTY_NOTICES.md` file:

| Component | Use | Licence |
| --- | --- | --- |
| face landmark network of MediaPipe Face Landmarker, converted to ONNX format, and MediaPipe's canonical face model | pitch estimation, embedded in the program | Apache 2.0 |
| Eye Tracker 5 USB captures from the Krazubu/tobii-linux project | in the tests only | MIT |
| Go libraries `gousb`, `xgb`, `x/image`, `x/text` | included in the compiled program | Apache 2.0 and BSD 3-Clause |
| libusb-1.0 and, if enabled, liblsl | system libraries, linked to the program | LGPL 2.1 and MIT |

The protocol is reconstructed from the independent Eye Tracker 5 projects that I described in the
[first part](/en/journal/tobii-4c-on-linux-1-reading-before-touching/). The driver is not affiliated
with Tobii, nor sponsored or endorsed by Tobii.

> **Disclaimer.** The driver is experimental, unofficial software, and **it is not a certified medical
> device**. It uses the tracker in ways not intended by the manufacturer and writes calibration and
> display area to the 4C, after first backing up the calibration: use it at your own risk. The 4C's
> infrared images capture the face and are personal data. Anyone who depends on an AAC tool to
> communicate should always have a backup alternative. Tests with other people require informed
> consent and, where needed, the opinion of an ethics committee.

## References

1. Blescia A. (2026). *tobii4c-linux: driver user-space per il Tobii Eye Tracker 4C su Linux*
   [user-space driver for the Tobii Eye Tracker 4C on Linux] (commit `c0e36af`, 20 November 2026).
   Software, MIT licence. GitHub.
   [github.com/ablescia/tobii4c-linux](https://github.com/ablescia/tobii4c-linux)
