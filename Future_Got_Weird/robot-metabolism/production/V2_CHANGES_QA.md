# Robot Metabolism V2: hook and retention rebuild — changes and QA

## Review status, plainly

- **Deliverable:** `exports/FGW_Robot_Metabolism_V2_REVIEW_1080x1920.mp4`. Only the review was requested, so there is
  no V2 master or clean export yet. `sh tools/render_v2.sh master` and `sh tools/render_v2.sh clean` make them from
  the same source.
- **Unchanged from V1:**
  - the locked 75-word narration, the same take (ElevenLabs "Test Voice"), its word timings and caption phrases;
  - 25.70 s, 771 frames.
  - The narration WAV, `timeline.json` and the SRT were not regenerated.
- **Verified from the exported file:** stream facts, full decode, black and frozen frames, loudness, sync, caption
  words, frame-to-frame continuity and the loop seam (see QA below). Frame-by-frame sheets of the contacts, the drop
  and roll, and the seam are in `qa/`.
- **Not done:** nobody has watched V2 in real time or listened to it, because this container cannot play audio or
  video. **Watch and listen at normal speed, on a phone and on headphones, before approving.**
- **Runway:** still no Runway plates, for the same reason as V1. The proxy blocks Runway's download CDN
  (`production/RUNWAY.md`). V2 is entirely the vector rig, so every mechanical motion is exact.
- **Not published, uploaded or scheduled.**

## What changed from V1

V1 opened on a bench with a single robot. V2 opens mid-action with two modular structures, and every beat is a
continuous physical action: no cut lands on a static pose.

| Brief segment | V2 on screen | Actual time (s) | Note |
| --- | --- | --- | --- |
| 0–0.5 Two structures, one module disconnecting, the other reaching | Frame 0: a broken robot (three grey links, one cracked, one with a snapped cap) still holds an intact amber module. An incomplete robot sits beside it: a tetrahedron missing one base edge, sagging. The amber module's connector is already pulling its magnet back and sliding off the broken robot's vertex, while the open robot's front vertex reaches toward it. | 0–0.6 | The loop pre-roll (below) means this motion is already under way on frame 0. |
| 0.5–2.8 Alignment, snap, immediate shape change | Connector windows rotate toward each other, the last 2 cm close fast, then a **snap** on "spare". The rear vertex swings in, aligns and **snaps** on "body"; the module is now the missing base edge. The apex links extend and the robot rises (apex about 17 → 33 cm) on "parts". | snaps 1.92, 2.33; rise 2.4–3.2 | Two synchronized magnetic clicks on the hero bus. |
| 2.8–6.2 Actuator close-ups; full / side profile / detail | The robot walks off. Full view on "motorized"; low side profile while the links stretch; cutaway of the amber module on "shrink" (copper windings, a lead screw whose thread turns, and a nut that travels with the length) while it contracts and pulls the body. The triangle visibly changes shape each cycle. | 3.3–6.1 | |
| 6.2–8.5 Follow a rod to its joint; connector cutaway; angles change | A dolly along the module to the rear vertex. On "magnets" the connector sections open: the magnet windows, the shells and the joint angles changing as the robot steps. | 6.1–7.8 | |
| 8.5–10 Brief controller; robot responds | The Weird Crew guesser (existing approved rig, unchanged) presses one key. The monitor shows the live robot, and the cut back lands on the robot already responding. | operator 7.84–8.57; response from 8.57 | 0.73 s, started 0.66 s early to sit on "a person controls". |
| 10–13.8 A rod guided in: approach, align, snap, load transfer, motion | The coral stick module is guided in from the left, its windows aim, and it **snaps** onto the front vertex on "connects". The body then slides forward 8 cm on it (the load is now on the new link), and the stick's tip slides to recover. | approach 9.64–11.70; snap 11.92 | No teleport: the stick is visible on the mat from the cut at 8.57. |
| 13.8–17.5 Slope: slow crawl without the stick's help, then the stick propels | One continuous side-tracking shot on the ramp. One slow crawl cycle with the stick dragged. The robot rears up onto the stick (on "walking stick"), then five pushes, each planting the tip and sliding the body. | crawl 13.27–13.7; rear-up 13.74–14.61; pushes from 14.67 | Camera follows a smoothed front position. No speed lines, blur or readouts. |
| 17.5–21 A link fails, contracts, disconnects, falls/rolls aside; shape changes | Closer on the stick. Its status light goes out ("stops working") and it contracts under load, so the robot sinks from a 27° to a 13° tilt. It lets go and falls, pivoting on its tip, then rolls toward the camera. The body drops without its support. | die 17.67; release 18.56; fall 19.06; roll to 19.36 | |
| 21–23.4 Maneuver, align, connect, movement restored | The robot side-steps to a teal replacement lying on the mat, reaches, aligns and **snaps** on "replacement", rears up and pushes on twice. | side-step 19.06–19.46; snap 19.92; rear-up 20.0–20.5; pushes 20.6, 21.7 | About 1.5 s earlier than the brief's segment: the narration says "replacement" at 19.7 s. |
| 23.4–25.7 Follow the discarded link; another compatible robot; seamless loop | The camera follows the dropped stick in the foreground, then travels along the floor to a second broken robot holding an amber module, which an open robot is crawling up to. It settles on exactly the opening composition. | 21.0–25.7 | See "The loop" below. |

### Timing against the brief

The brief's segment times were approximate, so every action is keyed to the measured word it illustrates
(`source/src/lib/time.ts`). The hook, the operator and the stick connection fall within ~0.7 s of the brief. The
failure and replacement come earlier than the brief's 17.5–23.4 window because the narration reaches "stops working"
at 17.55 s and "replacement" at 19.7 s. Showing the replacement on its word was judged more important than the
brief's segment boundaries.

### The loop

- The last 0.6 s and the first 0.6 s are the same action, rendered by the same function:
  - the opening transfer is `pairState(tau = t)` at the origin;
  - the ending shows that pair's pre-roll, `pairState(tau = t − 25.7)`, at H2 = 1.25 m to the left.
- 1.25 m is a whole number of mat grid cells (5 × 25 cm), and the wall rack repeats every 1.25 m, so both places look
  identical.
- The final camera is the opening camera shifted by H2. It arrives at rest on the last frame, and the opening camera
  leaves at rest.
- The narration restarts on the loop, so the first caption reappearing is expected.
- Measured on the uncaptioned picture, the step from the last frame back to frame 0 is a mean luma difference of 0.85,
  the same as an ordinary frame step there (0.79–1.01). The audio bed is built from whole loop cycles with circular
  filtering, so the sound wraps with a 0.005 jump. No end fade, black frame, hold or subscribe prompt.

## Mechanical rules, checked over every frame

`tools/rig_probe2.ts` checks every one of the 771 frames: **0 faults.**

| Check | Result |
| --- | --- |
| Working links within 0.28–0.43 m | open robot 0.282–0.410, amber module 0.290–0.410, stick 0.280–0.430, replacement 0.280–0.412, second robot 0.330–0.401 |
| No end below the mat or the ramp surface | pass |
| Apex at its commanded lengths (no impossible tetrahedron flattened by the solver) | pass |
| Joined ends exactly on their vertex | pass |
| Separate modules never pass through each other or through a robot | pass. The last moments of an approach (where the ends are meant to meet) are excluded. |

There are no teleports: every module present at a cut was already on screen, or is reached by continuous motion.

## Picture

- **Style:** flat 2D ink with restrained 2.5D, the same renderer and palette as V1. No AI graphics, badges, callouts,
  speed lines or motion blur.
- **Backgrounds:** a large gridded test mat with the lab wall and a rack of spare links behind it, replacing V1's open
  bench, so most frames have less empty space.
- **Rig additions (backward compatible with V1):**
  - the connector magnet window turns toward its partner;
  - a magnet can retract;
  - a housing cutaway: windings, a turning lead screw, a travelling nut;
  - a rolling link keeps its status light on the correct side.
- **Camera:** time-parameterized spline paths with no whip-pans or punch-in zooms. Off-cut frame-difference spikes
  are listed under QA.
- **Bug fixed during review:** two links shared the React key "M" (the repaired robot's module and the second robot's
  module). In the video render this left a ghost trail of stale amber links, although single stills looked correct.
  `Paint` now de-duplicates keys (`source/src/lib/r3.tsx`).

## Sound (`tools/make_audio_v2.py`)

- **Narration:** the same take, dominant at +21.8 dB over the rest in the phone band.
- **Magnetic snaps:** four, on an unducked hero bus at −15 dB, each placed 35 ms before its contact frame so the
  transient lands on the picture:
  - 1.92 (the module's first end);
  - 2.33 (its second end);
  - 11.92 (the stick);
  - 19.92 (the replacement).
- **Other effects:**
  - un-clicks when a module lets go (18.56; 25.05, the loop pre-roll);
  - the stick's motor winding down when it fails (17.62);
  - the drop (19.04) and the roll (19.08);
  - tip taps and scuffs on each push;
  - a key click (8.39);
  - faint air when each cutaway opens;
  - a creak as the body rises.
- **Motor whir:** follows the measured per-frame length change of each link.
- **Levels:** 28 effects; −14.66 LUFS integrated, −2.59 dBTP true peak.

## QA of `exports/FGW_Robot_Metabolism_V2_REVIEW_1080x1920.mp4`

Measured with `tools/qa.py` from the file; full results in `qa/V2_REVIEW_qa.json`.

| Check | Result |
| --- | --- |
| Picture | H.264 High, 1080×1920, yuv420p bt709, 30 fps, 771 frames, 25.700 s |
| Audio | AAC 48 kHz stereo; −14.6 LUFS integrated, −2.6 dBTP |
| Full decode | no errors |
| Black frames / frozen stretches | none / none |
| Sync against the PCM mix | 0.0 ms |
| Caption words | equal to the locked narration (captions and SRT); longest caption lead 0.04 s |
| Loop seam (last frame → frame 0, uncaptioned) | 0.85 mean luma step, against 0.79–1.01 for ordinary frame steps there |
| Off-cut frame-difference spikes | one, frame 175 (5.83 s): 16.45 against a threshold of 16.3 |

**Frame 175 spike:** this is the dolly from the actuator cutaway along the module to its rear joint. Close, detailed
subject matter moves across the frame quickly here. The move was slowed and made less wide (no pull-back zoom), and it
reads as a tracking move in the frame sheets. Check it at speed.

**Frame sheets:**
- `qa/V2_contacts_frames.png`: every frame around the four snaps.
- `qa/V2_fail_drop_roll_0.1s.png`: the failure, drop and roll.
- `qa/V2_loop_seam_frames.png`: frames 764–770 and 0–2.
- `qa/V2_full_0.5s.png`: the whole film.

**Noted in review:** during the side-step to the replacement (19.1–19.7 s), the robot is partly out of frame on the left
while the camera holds on the dropped stick and the replacement. It is fully in frame again for the snap at 19.92 s.
If this reads as lost action at speed, widen the `camC` key at `T('and attach') + 0.25`.

## Rebuild

```sh
cd Future_Got_Weird/robot-metabolism
sh tools/render_v2.sh review          # cues -> mix -> render (video muted, the PCM mix encoded once to AAC)
QA_MIX=audio/mix/FGW_Robot_Metabolism_V2_mix.wav QA_CUES=audio/cues_v2.json \
  python3 tools/qa.py exports/FGW_Robot_Metabolism_V2_REVIEW_1080x1920.mp4 qa/V2_REVIEW_qa.json
source/node_modules/.bin/esbuild tools/rig_probe2.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/p2.cjs && node /tmp/p2.cjs
```
