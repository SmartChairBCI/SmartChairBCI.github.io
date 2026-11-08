---
ref: tobii-4c-head-pitch-from-the-face
project: kite
kind: update
authors: [Antonio Blescia, Bones]
title: "Tobii 4C: recovering head pitch from the face"
description: With only two eyes, the head's "yes" cannot be seen. I describe how the GNU/Linux driver recovers it from the 478 face points of MediaPipe Face Landmarker, what runs on the 4C's infrared images, what runs on the webcam test bench, and what I do not know yet.
tags: [eye-tracking, tobii, linux, head-pose, mediapipe, aac]
---

In the [previous entry](/en/journal/tobii-4c-wakes-up-after-10-years-of-hibernation/) I left a
problem open. The Tobii Eye Tracker 4C does not send the head pose. From the two **corneal
centres**, that is, the position in space of the two eyes, one can derive the position of the head,
the yaw (the "no") and the roll (the head tilted towards a shoulder). The **pitch** (the "yes"),
however, is not observable: the rotation happens around an axis that passes almost through the two
eyes, and the two points stay practically still.

In this entry I describe how the driver I am writing for GNU/Linux, together with the AI assistant
I mentioned, recovers the pitch from the **face** rather than from the eyes alone. I keep two things
separate:

- what runs **in the driver**, on the 4C's infrared (IR) images;
- what runs in an **example program** that uses an ordinary webcam as a test bench.

The measurements on the 4C are few, taken with a single person, and I report them with their
conditions.

## The idea: a face has many more points than two eyes

If two points are not enough, we need other points that do not lie on the axis of the "yes". The
tip of the nose, the chin and the forehead are perfect. When you nod, the tip of the nose, which
sticks out forward, moves up or down relative to the eyes. That is exactly the missing information.

To find these points in the images I use **MediaPipe Face Landmarker**, a set of Google models for
face analysis. The official bundle contains three: a face detector (BlazeFace), a face landmark
model and a facial expression model ([Google AI Edge, n.d.](#references)). The driver uses **only
one** of them, the `face_landmarks_detector` network.

This network receives a square 256 × 256 pixel crop of the face and returns:

- **478 3D points**: 468 form a mesh covering the face, 10 describe the irises, 5 per eye, that is,
  the centre and four points on the edge
  ([Yan and Grishchenko, 2022](#references); [Ablavatski et al., 2020](#references), preprint);
- a **probability** that the crop really contains a face.

Each point has two coordinates in pixels and a third one, *z*, which is a **relative** depth: it
says whether a point lies further forward or back relative to the centre of the face, not how many
millimetres it is from the camera ([Yan and Grishchenko, 2022](#references)). The model derives from
Google's work on estimating face geometry with a single camera
([Kartynnik et al., 2019](#references), preprint).

The network is released under the **Apache 2.0** licence ([Yan and Grishchenko, 2022](#references)).
In the driver I use a conversion to the ONNX format made by a third party, which states that the
weights were not modified ([senty-au, n.d.](#references)). The file is 4.9 MB, it is embedded in the
program, and the driver checks its SHA-256 fingerprint at start-up. In the driver's repository the
licence and the provenance are listed in a notices file for third-party components.

## An interpreter written from scratch

To run a neural network one usually relies on a library such as TensorFlow or ONNX Runtime. In the
driver I made a different choice: a small **interpreter written in Go** that reads the model file
and can execute only the operations this network needs (convolutions, additions, activation
functions, changes in the shape of the data).

This is consistent with the goals of the previous entry: no proprietary components, few
dependencies, memory prepared at start-up and reused. The interpreter uses the AVX2 and FMA vector
instructions of recent processors when they are available; otherwise it falls back to plain Go code.

One inference costs **113 million multiply-accumulate operations** (MACs), that is, operations of
the kind "multiply two numbers and add the result to a running total". The driver's documentation
reports 18–22 ms per inference on one core of a Ryzen 7 2700X.

## Finding the face and cropping it

The network does not search for the face in the whole image. It expects a crop with the face in the
centre, a margin around it and the line of the eyes horizontal; it tolerates only small errors in
position and rotation ([Yan and Grishchenko, 2022](#references)). The real work, then, is preparing
the right crop. The driver has three ways, in this order:

1. **Tracking.** If the previous frame contained a face, the new crop is derived from its points:
   centred on the face, 1.5 times larger, and **rotated** so that the line between the outer corners
   of the eyes is horizontal. One inference is enough.
2. **From the tracker's eyes.** On the 4C, if the camera is calibrated (see below), the driver
   projects the two corneal centres into the image and builds the crop around them.
3. **Grid search.** If nothing else is available, the driver tries crops of three sizes (60 %, 40 %
   and 85 % of the short side of the image) on a grid with a step of half a side, from the centre
   towards the edges. It stops at the first crop with a probability above 0.95, then refines the
   result with tracking. It costs up to about thirty inferences.

The bundle's BlazeFace detector is not used: to find the face, the probability returned by the
landmark network itself is enough. To avoid wasting computation, on the 4C the grid search never
starts when the tracker says nobody is in front of it, and if it keeps failing it is repeated less
and less often, down to once every 5 seconds.

Before passing the crop to the network, the driver **normalises the contrast**: it stretches the
grey levels between the 1st and the 99th percentile of the crop. The reason is written in the code:
the 4C's IR images are dark and change with automatic exposure, whereas the model was trained on
well-exposed colour photos. The image is black and white, so the same grey value is copied into the
three colour channels the network expects.

## From points to angles: fitting a mask onto the face

Once the points are found, we need to work out how the head is oriented. Here the driver follows
the same path as MediaPipe's `face_geometry` module ([The MediaPipe Authors, 2020](#references)).

The idea is easy to picture. Imagine a **rigid mask**, an average face in 3D, that you have to lay
onto the face seen by the camera, rotating, moving and scaling it until its points match the ones
found by the network as closely as possible. The rotation needed to make it fit is the rotation of
the head.

The mask is MediaPipe's **canonical face model**. The driver uses 33 of its points, the most rigid
ones; the code describes them as points of the nose, cheekbones, eye corners and forehead. Each has
a weight, also taken from MediaPipe (Apache 2.0).

The method for finding the rotation that best overlays two sets of points is called **Procrustes
analysis**. The driver uses Horn's closed-form solution based on quaternions
([Horn, 1987](#references)). The computation proceeds in three steps:

1. **Scale.** A first comparison between the mask, in millimetres, and the points, in pixels, tells
   how many pixels one millimetre of the face is worth. From this, using the camera's **focal
   length**, the distance is estimated. An example: if one millimetre of the face spans 0.8 pixels
   and the focal length is 554 pixels, the face is at about 554 / 0.8 ≈ 690 mm.
2. **Points in 3D.** Each point is placed back in space along the camera ray that passes through it,
   at that distance plus its relative depth.
3. **Rotation.** A second Procrustes fit, now between 3D points in millimetres, gives the rotation.
   If the resulting scale is not 1, the distance used was wrong: the driver corrects it and repeats
   steps 2 and 3, three times in total.

Note that this is **not** the classic PnP (*Perspective-n-Point*) method, which looks for the pose
by comparing the 3D points of a model with their pixels in the image. Here 3D points are aligned
with 3D points, as in MediaPipe.

The final rotation is decomposed into three angles, in the order yaw, pitch, roll. The **pitch** is
the elevation of the direction the face is pointing: positive upwards. The names of the angles are
those of the previous entry ([Murphy-Chutorian and Trivedi, 2009](#references)).

## On the 4C: from infrared images to the screen

Among its other streams, the 4C sends the full image from its IR camera: 640 × 480 pixels, 8 bits
per pixel in greyscale, 30 images per second. On these images the driver does everything described
above. Two steps remain, though.

**Calibrating the camera.** To go from pixels to millimetres one needs to know the camera: focal
length, optical centre, position and orientation relative to the tracker. The firmware does not
expose them. The driver estimates them on its own, in a way I like very much: it compares the
**centre of each iris** found by the network with the **3D corneal centre** provided by the
tracker. The same two points that on their own were not enough for the pitch are used to measure
the camera.

Technically it is a least-squares problem, solved with the Levenberg–Marquardt method and with
weights that limit the effect of outlier samples. The driver also tries the hypothesis that the
image is mirrored. It accepts the calibration only if the reprojection error is below 4 pixels and
the uncertainty of the rotation is below 1°. To collect useful data one has to move the head:
forwards and backwards, sideways and up and down. A guided application asks for this step by step.
The calibration concerns the device, not the person: doing it once per 4C is enough. Until the
camera is calibrated, the driver marks the pitch as invalid.

**Bringing the angles into the screen's coordinate system.** With the camera calibrated, the
rotation goes from the camera to the tracker and then to the screen, using the screen geometry
stored in the 4C. The pitch then goes through a **1€ filter**, a low-pass filter that removes jitter
when the head is still and reduces lag during fast movements ([Casiez et al., 2012](#references)).
Finally, the driver subtracts a **personal zero**: the pitch measured while the person holds the
head straight and looks at the centre of the screen.

The value is written into the gaze samples close in time, within 150 ms of the image. The IR images
carry a timestamp that lags by about 25 ms behind the gaze samples that see the same eyes, and the
driver compensates for this.

## What I have measured on the 4C so far

These are the data reported in the driver's documentation for the tests of **4 November 2026**:
**a single 4C** and **a single person**.

| What | Result |
| --- | --- |
| Face found in the IR images | 100 % of the images, about 27 processed per second |
| Camera calibration adopted | reprojection error 2.8–3.2 px, rotation uncertainty 0.3–0.7° |
| Pitch with the chin raised | +11° |
| Pitch with the chin lowered | −21° |

The two rows on the pitch say that **the direction is right**: chin up gives a positive angle, chin
down a negative one. **They do not say how accurate it is.** I had no reference, for example an
inclinometer, to know by how many degrees I had actually tilted my head. And I cannot compare it
with Tobii's original software, which does not exist on GNU/Linux.

The documentation also reports automated tests on **synthetic** data: a virtual head in known poses,
projected with a known camera, gives an error below 0.11°; the complete estimator, with a fake face
model, has a maximum pitch error of 0.27°. These numbers say that the geometric computations are
correct. They say nothing about the network's precision on a real face.

### A side effect: yaw improves too

The same tests revealed a problem I did not expect. Derived from the line between the eyes, on the
4C the yaw is **underestimated by a factor of about five**, and part of the missing rotation ends up
in the roll. One explanation given in the documentation: the 4C has a single camera, below the
screen, and it measures the position of the eyes in the image plane well, but which of the two is
closer poorly. This is the table, again with one person:

| Movement | From the face: yaw / roll | From the eyes: yaw / roll |
| --- | --- | --- |
| head straight | +5° / −1° | 0° / 0° |
| turned left | +42° / −8° | +3° to +7° / +10° |
| turned right | −31° / +2° | −8° to −10° / −9° |
| tilted right | −5° / −28° | −6° / −28° |

For pure tilt the two methods agree. For rotations they do not. For this reason, when the face is
tracked, the driver takes yaw and roll from the face as well, and falls back to the eyes when there
is no face. With the head turned, the face stayed tracked in all images, whereas beyond about 25°
the tracker lost the eyes.

According to the documentation, the +5° offset with the head straight depends on the camera
calibration, and applications can remove it with their own neutral point.

## The test bench: the webcam

To develop and check the face model without always having the 4C connected, the driver includes an
example program, **"Face from the webcam"**. The code describes it as the face preview of the
driver's telemetry, but on the images of a webcam instead of the 4C's IR sensor. It uses **the same
model**, **the same interpreter** and **the same logic** for tracking and grid search. The webcam is
read directly through Linux's video subsystem (V4L2), without C libraries.

For the tests I used a **high-resolution USB webcam**, read here at 640 × 480: the screenshot below
**does not come from the Tobii 4C**.

The image is **black and white**: the program takes only the luminance, as it comes from the webcam.
The driver's detector works on single-channel images, like the 4C's IR images.

There is an important difference. The webcam is **not calibrated**: the angles are computed relative
to the webcam's axis, with a focal length **assumed** from the horizontal field of view, 60° by
default. For an image 640 pixels wide the focal length is 320 / tan(30°) ≈ 554 pixels. The code
states it clearly: without calibration the focal length is an assumption; the angles depend on it
only slightly, the distances proportionally.

The program also computes some measures that **are not in the driver**:

- **distance from the iris.** The horizontal diameter of the iris is nearly the same across a wide
  population, 11.7 ± 0.5 mm ([Vakunov and Lagun, 2020](#references)). Knowing its diameter in pixels
  and the focal length, the distance can be derived. The program uses the less foreshortened iris;
- **EAR** (*eye aspect ratio*), the ratio between the height and the width of the eye computed from
  six points on the eyelids and eye corners ([Soukupová and Čech, 2016](#references)). It is almost
  constant while the eye is open and drops towards zero when the eye closes;
- **blinks.** The program considers the eye closed when the average EAR of the two eyes drops below
  70 % of its typical value over the last 5 seconds, and open again above 80 %. A closure counts as a
  blink if it lasts at most 700 ms. Soukupová and Čech instead use a classifier over a window of
  frames: the program's adaptive threshold is a simpler choice;
- **MAR** (*mouth aspect ratio*), defined in the code as the inner opening of the lips divided by the
  inner width of the mouth.

![The full-screen "Face from the webcam" interface. On the left, the black-and-white image of the USB webcam, not of the Tobii 4C, with a person sitting in front of it: on the face, the green mesh of the 478 points, the two irises marked in blue and orange, and the orange, slightly rotated box of the crop passed to the model. Below, three plots of the last 10 seconds: head rotation, eye opening and model time per frame. On the right, the Head, Eyes, Mouth and face, Face model, Webcam, Image, Controls and Process panels with the current values.](/assets/img/kite/viso-dalla-webcam-face-landmarker.png)

### How to read the screenshot

The screenshot shows **one instant**, with **one person**. The numbers help to understand what the
interface displays, not to measure accuracy.

| Panel | Values at this instant |
| --- | --- |
| Webcam | 640 × 480 YUYV, 16.7 frames per second measured (30 nominal) |
| Head | pitch +2.1°, yaw +4.0°, roll −2.7°; assumed focal length 554 px (60° field of view) |
| Distances | 690 mm from the canonical model, 486 mm from the iris (11.7 mm iris) |
| Eyes | EAR 0.404 (left) and 0.392 (right); 22 blinks, 9 per minute |
| Face model | 12.9 ms per frame, mean 17.4 ms, p95 14.0 ms, maximum 358.4 ms; 256 × 256 → 478 points; 113 MMAC per inference |
| Process | 38 % of one core |

Two details deserve an explanation.

**The mean is higher than the 95th percentile.** It looks odd, but it is not. The time per frame is
computed over the last 120 frames, and these include grid searches, which are much slower than a
normal inference (the maximum is 358.4 ms). A few very high values shift the mean but not the
percentile.

**The webcam runs at 16.7 frames per second instead of 30.** The example's documentation reports
that in a dimly lit room this webcam drops by itself to about 17 frames per second, because of
automatic exposure.

### Two distances that do not add up

The most striking difference is between the two distances: **690 mm** from the canonical model and
**486 mm** from the iris. The code explains part of the difference, not all of it.

- **They do not measure the same point.** The "model" distance is that of the canonical model's
  origin, which lies behind the root of the nose. In the canonical model the eye corners are about
  3–4 cm in front of that origin. A few centimetres of difference are therefore expected.
- **They use two different rulers.** The model distance assumes that the face has the size of
  MediaPipe's average face: the code notes that if the face is larger or smaller, only the estimated
  distance changes. The iris distance assumes an 11.7 mm iris.
- **The focal length alone cannot explain it.** Given how the formulas are written, both distances
  grow in proportion to the assumed focal length, so an error in the focal length would change both
  by the same ratio.

About 16–17 cm remain that I cannot explain. Nor do I know which of the two is closer to the truth:
at that moment I did not measure the real distance. It is an **open question**.

## The open problem: a model for colour photos on infrared images

In the previous entry I wrote that I did not know whether a model trained on colour images would
work on the 4C's IR images. The model card confirms the concern: the network is optimised for videos
captured with the front camera of smartphones, and the training data were collected with smartphone
cameras ([Yan and Grishchenko, 2022](#references)). The 4C's images are infrared, dark, and taken
from close up and from below.

Here is what I can say, honestly:

- **What I did**: I normalise the contrast of each crop and copy the grey value into the three
  channels. I did not retrain the network.
- **What I observed**: in the tests of 4 November, with one person, the face was found in 100 % of
  the IR images and the pitch changed sign in the right direction.
- **What I do not know**: whether the precision of the points on IR images is the same as on colour
  photos; how it behaves with other people, with glasses, with other skin tones, at different
  distances or with different room lighting. I have no measurements on this.

There is also a limitation that depends on the device. When the 4C loses the eyes, it dims the
infrared illuminators: the face is no longer visible and the pitch is not available.

## Open problems

- **Pitch accuracy.** I have the direction, not the error in degrees. A comparison with an
  independent reference is needed.
- **A single person.** Everything I know about the 4C comes from tests with one face.
- **The two distances** from the webcam, 690 mm versus 486 mm, still without a full explanation.
- **The cost.** According to the driver's documentation, about two thirds of one core at 30
  inferences per second. The number of inferences per second can be reduced, but I need to find out
  how much the pitch suffers.
- **Eye opening.** According to the driver's documentation, the 4C firmware always sends the eyelid
  opening as −1, so the device does not provide it. The EAR computed from the face points could
  replace it, but for now it exists only in the webcam example and has not been tried on IR images.

## Next steps

1. Measure the pitch against a reference, for example at known head tilts.
2. Measure the real distance in front of the webcam, to find out which of the two estimates is wrong
   and why.
3. Try the face model with other people, with their informed consent.
4. Assess whether the EAR on the 4C's IR images is reliable enough for a voluntary blink used as a
   click in Kite.

The code is in my `tobii4c-linux` driver, which is not public for now.

> **Warning.** Kite is an experimental project and **is not a certified medical device**. The head
> pose estimation described here does not yet have a measured accuracy, and Google's model card
> states that the network is not intended for human life-critical decisions. An unofficial driver
> uses the tracker in ways not foreseen by the manufacturer: sending commands whose effect is unknown
> could change its behaviour, including that of the infrared illuminators. Anyone who depends on an
> AAC tool to communicate should always have a backup alternative. Tests with people require informed
> consent and, when needed, the approval of an ethics committee; images of the face are personal
> data.

## References

1. Ablavatski A., Vakunov A., Grishchenko I., Raveendran K., Zhdanovich M. (2020). Real-time pupil
   tracking from monocular video for digital puppetry. *arXiv* (preprint).
   [arXiv:2006.11341](https://arxiv.org/abs/2006.11341)
2. Casiez G., Roussel N., Vogel D. (2012). 1 € filter: a simple speed-based low-pass filter for noisy
   input in interactive systems. *Proceedings of the SIGCHI Conference on Human Factors in Computing
   Systems (CHI '12)*, 2527–2530.
   [doi:10.1145/2207676.2208639](https://doi.org/10.1145/2207676.2208639)
3. Google AI Edge (n.d.). *MediaPipe Face Landmarker*. Official technical documentation.
   [developers.google.com](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)
4. Horn B. K. P. (1987). Closed-form solution of absolute orientation using unit quaternions.
   *Journal of the Optical Society of America A*, 4(4), 629–642.
   [doi:10.1364/JOSAA.4.000629](https://doi.org/10.1364/JOSAA.4.000629)
5. Kartynnik Y., Ablavatski A., Grishchenko I., Grundmann M. (2019). Real-time facial surface
   geometry from monocular video on mobile GPUs. *arXiv* (preprint).
   [arXiv:1907.06724](https://arxiv.org/abs/1907.06724)
6. Murphy-Chutorian E., Trivedi M. M. (2009). Head pose estimation in computer vision: a survey.
   *IEEE Transactions on Pattern Analysis and Machine Intelligence*, 31(4), 607–626.
   [doi:10.1109/TPAMI.2008.106](https://doi.org/10.1109/TPAMI.2008.106)
7. senty-au (n.d.). *face_landmarks_detector-ONNX* [unofficial ONNX conversion of MediaPipe's
   `face_landmarks_detector` network]. Hugging Face.
   [huggingface.co/senty-au/face_landmarks_detector-ONNX](https://huggingface.co/senty-au/face_landmarks_detector-ONNX)
8. Soukupová T., Čech J. (2016). Real-time eye blink detection using facial landmarks. *21st Computer
   Vision Winter Workshop (CVWW 2016)*, Rimske Toplice, Slovenia.
   [PDF](https://vision.fe.uni-lj.si/cvww2016/proceedings/papers/05.pdf)
9. The MediaPipe Authors (2020). *face_geometry module: canonical face model and Procrustes basis*
   (`geometry_pipeline_metadata_landmarks.pbtxt`), Apache 2.0 licence. GitHub,
   google-ai-edge/mediapipe.
   [github.com/google-ai-edge/mediapipe](https://github.com/google-ai-edge/mediapipe/tree/master/mediapipe/modules/face_geometry)
10. Vakunov A., Lagun D. (2020, 6 August). MediaPipe Iris: real-time iris tracking & depth
    estimation. *Google Research Blog*.
    [research.google](https://research.google/blog/mediapipe-iris-real-time-iris-tracking-depth-estimation/)
11. Yan G., Grishchenko I. (2022). *Model card: MediaPipe FaceMesh* (15 September 2022). Google,
    Apache 2.0 licence.
    [PDF](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf)
