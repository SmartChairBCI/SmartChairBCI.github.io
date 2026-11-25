---
ref: kite
order: 2
codename: Kite
title: Augmentative and Alternative Communication (AAC)
summary: An open Augmentative and Alternative Communication tool, giving a voice to people who cannot rely on spoken language.
question: >-
  How can we build an open augmentative and alternative communication tool that is simple
  to use and adapts to each person's abilities?
icon: kite
status: prototype        # idea | review | design | prototype | testing | results
# started: 2026-01-01    # ✏️ research start date
license: GNU AGPL 3.0 or later (tobii4c-linux driver, MIT)
links:
  - label: Kite code (GitHub)
    url: https://github.com/ablescia/Kite
  - label: tobii4c-linux driver (GitHub)
    url: https://github.com/ablescia/tobii4c-linux
  - label: Description of the methods (Zenodo)
    url: https://doi.org/10.5281/zenodo.24282465
next_steps:
  - text: Estimate head pitch from the face, tested with a webcam
    done: true
  - text: Bring the pitch estimate to the 4C's IR images
    done: true
  - text: Run a first complete Tobii Race with the 4C
    done: true
  - text: Record Tobii Race telemetry to a file
    done: false
  - text: Measure end-to-end latency with an external method
    done: false
  - text: Have the display area reapplied every time the driver starts
    done: false
  - text: Measure pitch accuracy against a reference
    done: false
  - text: Try the face model with other people
    done: false
  - text: Assess the EAR on IR images as a click
    done: false
  - text: Explore the literature for the new keyboard
    done: true
---

## Context

**Augmentative and Alternative Communication** (AAC) covers the tools and strategies that help
people communicate when they cannot use spoken or written language, or can only do so with
difficulty: for example symbol boards, scanning keyboards or software that speaks out loud what
the person selects.

## Goal

Kite aims to be an **open** AAC tool that anyone can use, study and adapt.

## Where I am

The research has just started. I will document every step in the [journal](/en/journal/).

The methods of the new hybrid gaze keyboard have been public since 14 November 2026. Their full
technical description, including variants, is archived on Zenodo: [doi:10.5281/zenodo.24282465](https://doi.org/10.5281/zenodo.24282465). Since that date
they are part of the state of the art and cannot be patented as new by anyone.

Kite's code has been public on [GitHub](https://github.com/ablescia/Kite) since 25 November 2026,
under the GNU AGPL 3.0 or later. Reading the Tobii 4C requires the
[tobii4c-linux](https://github.com/ablescia/tobii4c-linux) driver, public since 20 November 2026
under the MIT licence.
