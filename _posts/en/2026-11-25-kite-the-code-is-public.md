---
ref: kite-code-public
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Kite: the code of the hybrid keyboard is public on GitHub"
description: I have published the code of Kite, the hybrid gaze keyboard, under the GNU AGPL 3.0 or later. I describe what the repository contains, what the licence allows and why the selection times are longer than in the video.
tags: [aac, virtual-keyboard, open-source, github, licence, agpl]
---

On 17 November I promised to publish the code of the hybrid keyboard, under an open source licence to
be stated at the time of publication
([entry of 17 November](/en/journal/kite-the-hybrid-keyboard-stays-open/#next-step-the-code)).
The code of [Kite](/en/research/kite/) is now public on GitHub, under the **GNU AGPL 3.0 or later**:
[github.com/ablescia/Kite](https://github.com/ablescia/Kite).

I have already described the methods in the
[theoretical studies](/en/journal/hybrid-keyboard-the-theoretical-studies/) and in the technical note
on Zenodo ([Blescia, 2026a](#references)), and I will not repeat them here. In this entry I say what
the repository contains, what the licence allows and what has changed since the video: the selection
times.

## The repository at a glance

| Item | Value |
| --- | --- |
| Address | [github.com/ablescia/Kite](https://github.com/ablescia/Kite) |
| Licence | GNU AGPL 3.0 or later (`AGPL-3.0-or-later`), with the exceptions listed below |
| Language | Go, version 1.22 or later, with no C code |
| System | Linux with X11, or Wayland with XWayland |
| Tracker | Tobii Eye Tracker 4C, through the [tobii4c-linux](https://github.com/ablescia/tobii4c-linux) driver, which is required |
| Without a tracker | a simulated user, useful only to try out the interface |
| Voice | optional, with Piper, a speech synthesiser that runs on the computer |
| Versions | no releases and no tags: it is built from the sources of the `main` branch |
| Documentation | README in Italian, with an English summary |
| Citation | `CITATION.cff` file, also read by GitHub's "Cite this repository" button |

## What is inside

The repository contains the keyboard seen in the video, with the fixes that came afterwards:

- the **hybrid selector**: the selection time starts when the eye lands after a saccade and depends on
  how probable the letter is, the hit areas of probable keys grow invisibly and the pupil can lengthen
  the times;
- the **pupil-luminance calibration**, which separates the effect of light from that of effort;
- the **Italian corrector**, with the bar of three suggestions;
- the **voice**, with Piper, and the **learned phrases**, proposed in grey after the cursor;
- `kite-replay`, a program that replays the recorded sessions with the parameters used at the time and
  with the current ones. It is the tool I used to choose the new times, below.

Kite does not talk to the tracker directly. It reads the samples that the tobii4c-linux driver sends
over UDP on the same computer, and launches the driver's gaze calibration. The driver has to be
installed first: I presented it on [20 November](/en/journal/tobii-4c-on-linux-the-driver-is-public/).

## How to install it

On Debian or Ubuntu, from scratch:

```sh
# 1. the tobii4c-linux driver, if it is not installed yet
sudo apt install git make golang libusb-1.0-0-dev pkg-config
git clone https://github.com/ablescia/tobii4c-linux.git && cd tobii4c-linux
make install install-udev install-service
systemctl --user enable --now tobii4c
cd ..

# 2. Kite
git clone https://github.com/ablescia/Kite.git && cd Kite
make build
./bin/kite
```

On first start, from Kite's menu: key **1** for the gaze calibration, **2** for the pupil-luminance
calibration, **3** to type. Without a tracker, the interface can be tried with
`./bin/kite -simulate`. The voice is installed separately, and the steps are in the README.

## The licence: GNU AGPL 3.0

The **GNU Affero General Public License** (AGPL), version 3, is a Free Software Foundation licence of
19 November 2007 ([Free Software Foundation, 2007](#references)). The Open Source Initiative has
approved it as an open source licence ([Open Source Initiative, n.d.](#references)). "Or later" means
that a more recent version may also be chosen, if the Free Software Foundation publishes one.

In practice, anyone may:

1. **use** Kite, for any purpose, commercial ones included;
2. **study** its code and **modify** it;
3. **redistribute** it, as it is or modified.

There is one condition: whoever distributes Kite, or a modified version of it, must do so under the
same licence and make the source code available. This is the principle of *copyleft*: the freedoms
pass to whoever receives the program, and nobody along the way can take them away. The AGPL adds a rule
for programs used over a network. Whoever modifies the program and lets others use it remotely, for
example from a server, must offer them the code of their version too (section 13 of the licence). The
software is provided without warranty.

The tobii4c-linux driver, instead, is under the MIT licence, which is more permissive: whoever includes
it in another program is not required to publish its code.

The licence keeps what I wrote on 17 November: anyone can use the code, study it, adapt it and
contribute. Reports and proposals go to the repository's *issues* and *pull requests*; the README
explains how.

The licence covers the code. The methods are described in the technical note on Zenodo, under
CC BY 4.0, and they are not patented, as I explained in the
[entry of 17 November](/en/journal/kite-the-hybrid-keyboard-stays-open/).

### Third-party components

Some parts have a different licence. They are listed in the `THIRD_PARTY_NOTICES.md` file, and the
licence texts are in the `LICENSES/` folder:

| Component | Use | Licence |
| --- | --- | --- |
| full-screen X11 window, copied from the tobii4c-linux driver | interface | MIT |
| Italian lexicon: the 150,000 most frequent words in the OpenSubtitles 2018 subtitles, from the FrequencyWords project ([Dave, n.d.](#references)) | language model and corrector, embedded in the program | CC BY-SA 4.0 |
| Go libraries `xgb`, `x/image`, `x/text` and the Go fonts | included in the compiled program | BSD 3-Clause |
| tobii4c-linux driver | separate program, required with the tracker | MIT |
| Piper ([OHF-Voice, n.d.](#references)) and the Italian voice | separate programs, optional, not included | GPL 3.0 for Piper; for the voice, its model card |

Kite is not affiliated with Tobii, nor sponsored or endorsed by Tobii.

## What has changed since the video: the times

In the video of 17 November, and in the theoretical studies, the selection time ranged from **120 ms**
for a very probable letter to **700 ms** for an improbable one. In the theoretical studies I had pointed
to exactly this as the main risk of the keyboard: 120 ms is less than typical visual search fixations,
180–275 ms. Looking at a very probable key while searching for another one could therefore type it
([theoretical studies, point 2](/en/journal/hybrid-keyboard-the-theoretical-studies/#2-prediction-times-and-targets-that-follow-the-language)).

The published code uses longer times, with three speeds to choose from the menu (key **V**):

| Speed | Probable letter | Improbable letter |
| --- | --- | --- |
| fast | 0.2 s | 0.8 s |
| normal (default) | 0.2 s | 1 s |
| careful | 0.25 s | 1.1 s |

To decide, I used `kite-replay`. It replays through the selector the gaze recorded in my free-typing
sessions of November 2026, with the old times and with the new ones, and counts as errors the letters
I had later deleted. At normal speed, the replay estimates that these wrong letters fall from **76 to
30, out of about 800**. The price is about 0.1 s more per letter. But in the same sessions an error
costs, as a median, 3.9 s between the moment I see it and the moment I have deleted it.

Together with the times came some protections against unintended selections, always active:

- when the keyboard appears, or becomes active again after the voice has spoken, a gaze already resting
  on a key does not type it straight away, and the first selection requires at least 0.5 s;
- delete and the suggestions require 0.7 s, speak 1 s, whatever the letter speed;
- if the saccade was clearly aimed at another key, the letter on which the gaze stops along the way
  requires the maximum time.

These numbers have limits, and I state them just as clearly. They are estimates from a replay, not a
live test: the recorded gaze does not react to the new times as a person would. And they are the
sessions of a single person, me, at the bench. Knowing whether the new times suit people who need an
AAC tool requires tests with other people.

> **Disclaimer.** Kite is experimental research software and **is not a certified medical device**.
> Anyone who depends on an AAC tool to communicate should always have a backup alternative, such as a
> paper alphabet board. Tests with other people require informed consent and, where needed, the
> opinion of an ethics committee.

## Next step

On 17 November I also promised to link the repository to the Zenodo record, so that the description of
the methods and the code can find each other. This has not been done yet: I will report it here when it
is.

## References

1. Blescia A. (2026a). *Probabilistic gaze typing with saccade-anchored adaptive dwell,
   corrective-saccade-aware selection, luminance-compensated pupillometry and gaze-aware correction*
   (version 1.0). Technical note, Zenodo.
   [doi:10.5281/zenodo.24282465](https://doi.org/10.5281/zenodo.24282465) (open access).
2. Blescia A. (2026b). *Kite: tastiera a sguardo ibrida per la comunicazione aumentativa e
   alternativa* [Kite: hybrid gaze keyboard for augmentative and alternative communication].
   Software, AGPL-3.0-or-later licence. GitHub.
   [github.com/ablescia/Kite](https://github.com/ablescia/Kite)
3. Blescia A. (2026c). *tobii4c-linux: driver user-space per il Tobii Eye Tracker 4C su Linux*
   [user-space driver for the Tobii Eye Tracker 4C on Linux] (commit `c0e36af`, 20 November 2026).
   Software, MIT licence. GitHub.
   [github.com/ablescia/tobii4c-linux](https://github.com/ablescia/tobii4c-linux)
4. Dave H. (n.d.). *FrequencyWords*. GitHub repository, content under CC BY-SA 4.0.
   [github.com/hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords)
5. Free Software Foundation (2007). *GNU Affero General Public License*, version 3, 19 November 2007.
   [gnu.org/licenses/agpl-3.0.html](https://www.gnu.org/licenses/agpl-3.0.html)
6. OHF-Voice (n.d.). *piper1-gpl: Fast and local neural text-to-speech engine*. GitHub repository,
   GPL 3.0 licence. [github.com/OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl)
7. Open Source Initiative (n.d.). *GNU Affero General Public License version 3*.
   [opensource.org/license/agpl-v3](https://opensource.org/license/agpl-v3)
