# Robot Metabolism V3: mechanical rig rebuild, hook and retention revision — changes and QA

## Review status, plainly

- **Deliverable:** `exports/FGW_Robot_Metabolism_V3_REVIEW_1080x1920.mp4` (1080×1920, 30 fps, 771 frames, 25.70 s).
- **Unchanged from V1/V2:**
  - the locked narration, word for word;
  - the same ElevenLabs take ("Test Voice");
  - the caption phrases and their timing;
  - the illustration style (flat ink, fixed upper-left key light);
  - the length.
- **Verified by measurement, every frame:** see "Mechanical QA" and "File QA" below.
- **Not done:** nobody has watched or heard V3 in real time; this container has no video or audio playback. **Watch
  and listen at normal speed before approving.**
- **Runway:** still no Runway material (the download CDN is blocked here; `production/RUNWAY.md`). V3 is drawn
  entirely by the deterministic rig, as the brief prefers.
- **Not published, uploaded or scheduled.**

## 1. The rig, rebuilt (source/src/v3/rig.ts, draw.tsx, lib/solid.ts)

What caused V2's faults:
- **Overlapping connectors:** every vertex drew three or four 2 cm connector spheres centred 2.1 cm from the same
  point, so they overlapped heavily.
- **Midpoint painting:** each link was painted as one object sorted by its midpoint depth, so crossing rods and joint
  balls swapped in front and behind as they moved.

V3 replaces both.

**Links** are explicit components, each with its own stable identity.
- **Length:** a link's length is the distance between the centres of its two connector balls (0.25–0.40 m: about
  28 cm contracted and 43 cm extended overall, as in the paper).
- **Structure:** from the motor end, it is a ball, neck, motor block, housing (fixed length), sliding inner rod, ball.
- **Telescoping:** only the rod's exposed length changes, and only along the link's axis.
- **Fixed sizes:** widths and the housing never change.

**Joints** are clusters of the links' spherical magnet connectors, which is how Truss Links join (a free-form
connector whose sphere magnet turns in its holder).
- **Placement:** each ball sits on its link's line, at the distance where it touches the balls already there, in the
  order the links attached. A link that attaches later therefore never moves the balls already in the cluster, so
  attaching a part cannot make a joint jump.
- **Readable joints:** balls never overlap, and every ball touches the cluster, so crowded joints read as tight knots
  of touching magnets.

**Assembly** is constrained by construction:
- each robot is defined by its joints;
- links run between joints, so connected ends stay connected while the body moves;
- the body's shape comes from link lengths (a tetrahedron's apex from its three apex lengths);
- rods rotate only about their joints;
- the camera never changes the geometry.

**Paint order is exact, not sorted by depth.**
- **Convex pieces:** every piece (ball, neck, motor block, housing, rod) is one convex solid: a sphere, or a cylinder
  with true elliptical end faces.
- **Why a pairwise test is enough:** two convex solids that don't intersect occlude each other the same way wherever
  their pictures overlap.
- **Method:** each overlapping pair is ordered by one ray cast through a point inside both pictures. All the results
  are combined by a topological sort.
- **Pieces of the same link:** these are ordered by which side of their shared boundary the camera is on.
- **Result:** a joint or rod cannot pop in front of or behind another without a real depth change.

## 2. World and story (source/src/v3/world.tsx, pair.ts, story.ts)

**The set:**
- a low test deck;
- a 10° ramp down to the lab floor, the slope of the paper's speed tests. Its crest and foot are rounded, so feet
  and the stick tip cross them on a smooth surface;
- grey gridded test mats;
- a light wood ramp board with distance tape.

**Parts and their colours:**
- the robot's own links are blue;
- the part it takes in the hook is orange;
- the walking stick is coral;
- the replacement is teal;
- the broken donor is grey and dead;
- a link that is waiting has an amber light, which turns green when it connects, red when it fails, then dark.

| Brief | V3 on screen | Time (s) |
| --- | --- | --- |
| 0.00–0.40 close; a detached link and a robot's connector already approaching; donor and recipient recognizable | Close, looking down across the parts. A broken grey robot lies in the foreground. An incomplete robot, missing its near base edge (feet splayed, sagging), slides its front foot toward the end of a loose orange link that came off the donor. | 0–0.45 |
| 0.40–0.90 align and snap; crisp click | The last 12 mm close fast (the magnets), then contact. The link's ball is resting exactly where the joint holds it, so nothing jumps. Its light turns green. Snap sound on the contact frame. | contact 0.62 |
| 0.90–1.80 pull back; the new module extending as part of the assembly | Rising pull-back. The orange link telescopes along its own axis; its far ball slides over the mat to the rear foot. Second contact. | 0.95–1.62 |
| 1.80–3.00 the new link changing the stance; low side view | Low side view. The orange link contracts and pulls the splayed feet together while the apex links extend: the robot stands up (apex 25 → 35 cm). | 1.85–2.95 |
| 3.00–4.50 one rod, its actuator, restrained cutaway | Cut to the orange link with its housing opened: copper windings, the lead screw, and the nut riding it as the link stretches (the robot's first crawl stride). | 2.95–4.6 |
| 4.50–6.00 into the whole triangle; joints rotate | Out to the near face. The link stretches and shrinks with the strides; the other links follow by turning at their joints. | 4.6–6.1 |
| 6.00–7.20 an isolated connector, close, stable | Cut to the rear foot's joint from a steady close angle. One ball is cut open: the sphere magnet in its holder, its spring, and the magnet turning to stay on its neighbours as the joint angle changes. | 6.13–7.3 |
| 7.20–8.00 the connection holding two links in a stable structure; three-quarter, with depth | Out to a three-quarter view of the whole robot. | 7.3–7.84 |
| 8.00–10.00 a brief controller; the robot responds | The Weird Crew operator (his existing rig, unchanged) presses one key; the monitor shows the live robot. Cut back: the robot leans its apex forward to unload its rear foot. | operator 7.84–8.62; response 8.7–9.3 |
| 10.00–11.00 a loose rod on the floor; one connector moving toward it; the rest still | From behind, the coral rod lies on the mat. Only the rear foot moves: it slides back toward the rod's end (only the three links that meet at it change length). | 9.3–11.45 |
| 11.00–12.00 tight side view; a visible gap until contact; clean click | Cut to a tight view across the line the foot comes in on: the rod's ball and the foot's cluster, a gap closing, contact. The rod's ball nests into the back of the cluster, touching its balls. | contact 11.92 |
| 12.00–13.50 pull back; the new link slowly extends to a support; the whole structure responds | The rod's tip stays planted while the rear foot rises and recentres. The rod extends into a support and the robot rears up onto it. | 12.05–12.85 |
| 13.50–14.50 approaching the slope; the extra link visible | From ahead, below the crest: the robot pushes itself toward the crest and over it, toward the camera. | front edge at the crest 14.5 |
| 14.50–15.50 close on the extra link extending toward the ground; contact and force transfer | The whole stick, joint to tip. Each push: the tip is planted and the stick extends, and the body is pushed. Each recovery: the body is planted and the stick shortens, its tip sliding forward. | 14.6–15.5 |
| 15.50–16.50 locked side tracking; the body moves relative to the ground | Side tracking, locked to the averaged position of the front edge. The robot runs down the incline over the board's distance tape. | 15.5–16.5 |
| 16.50–17.50 wider; the improvement obvious | Wider and higher: the run down to the floor. | 16.5–17.4 |
| failure: a rod stops; close-up; a meaningful consequence | A push stalls: the stick's light turns red and blinks, then goes dark. Back-driven by the load, the dead stick shortens and the rear sinks (22° → 11°). The robot can no longer push. | stall 17.76; dark 18.02; sink 18.02–18.52 |
| removal: endpoints separate before the rod moves away; the assembly stays consistent | The rear foot lets go. The stick slides 22 mm straight back along its own axis, so its ball leaves the cluster, then falls (pivoting on its tip, constant length) and rolls aside. The body settles onto its three feet. | 18.6–19.4 |
| replacement: a working module brought into alignment; the connector attaching; the structure recovering | One side step toward a spare lying beside the path (outside the strip the feet swept). The rear foot slides to its end; contact. The replacement extends into a support and the robot rears up and pushes once. | contact 20.00; recovered 20.75; push 21.1–21.4 |
| ending: discarded but reusable parts near another structure; follow one into the opening composition; seamless loop | The camera curves round behind the robot (never over it): the robot on the right, a broken robot and its loose parts ahead, beside another incomplete robot ("So that broken robot beside it…"). It settles into the opening composition, whose foot starts toward its orange link ("…could become its next body part"). | 20.9–25.7 |

### Timing against the brief

The brief's times were approximate, so each action is keyed to the measured word it illustrates
(`source/src/lib/time.ts`).
- **0–17.5 s:** within about 0.5 s of the brief.
- **Failure and replacement:** they come where the narration says them, which is earlier than the brief's
  17.5–22.5 s window:
  - "stops working": 17.55–18.26;
  - "drop it": 18.74–19.18;
  - "attach a replacement": 19.24–20.34.
- **Ending:** this leaves the ending from 20.9 s.

### The loop

- **Same function at both ends:** the opening group (incomplete robot, donor, loose links) at H and the closing group
  at H2 are the same function of time. The closing group runs its pre-roll at tau = t − 25.7, so its last frame is
  frame −1 of the opening.
- **Same camera transform:** the closing group sits on the floor beside the ramp, turned a quarter, so the matching
  camera looks away from the ramp and the robot. The last camera is the first camera, in that group's frame, arriving
  at rest.
- **Same surroundings:**
  - both mats are aligned to their own group;
  - shadows fall straight down (overhead lab light), so a turned group casts identical shadows;
  - the loop camera is steep enough that only mat is in view.
- **Measured:** see File QA.

### Honest notes

- **Two contacts in the hook:** the hook's link joins at both ends (two contacts, 1 s apart), because it closes the
  robot's missing edge. The brief asks for one snap at 0.4–0.9 s; the second is the link "extending as part of the
  assembly".
- **A second robot at the end:** the ending shows another incomplete robot beside the broken one: the "another
  machine could use the discarded part" beat. It is present on the floor from the start (visible in wide shots) and
  never appears suddenly. The film's loop starts it on the first frame.
- **Speeds are time-compressed:**
  - the walking-stick robot covers the ramp in about 3.5 s;
  - the paper reports the walking stick making the tetrahedron about 66 % faster on its 10° test slope;
  - the film shows "faster" qualitatively and makes no numeric claim.
- **The replacement spare:** it lies beside the path, at a place the robot did not walk over, so it reaches it with
  one side step.
- **Contact cue:** no visual contact flash is used. Contact reads from the geometry (the gap closing), the light turning
  green, and the click.

## Mechanical QA (every frame)

`tools/probe3.ts` (world geometry) → `qa/V3_probe_mechanics.json`: **771 frames, 0 faults.**

| Check | Result |
| --- | --- |
| Every actuator 0.25–0.40 m (ball centre to ball centre) | pass. Hero: L 0.250–0.370, stick 0.250–0.395, replacement 0.252–0.384, body 0.255–0.381 |
| Every ball touches its cluster (within 0.6 mm), and no two balls of a cluster overlap (beyond 0.3 mm) | pass |
| No two parts of different links intersect (exact for balls; cylinders checked conservatively) | pass. Closest approach 0 mm, which is the release, where the ball is touching |
| No part below the deck, ramp or floor | pass |
| The set of parts never changes (nothing appears or disappears) | pass |
| No jump: no ball moves more than 3.2 cm in a frame (≈ 1 m/s) | pass |
| No pop: no frame-to-frame change of a ball's velocity above 1.2 cm | pass |

`tools/probe3_view.ts` (every frame through its shot camera) → `qa/V3_probe_view.json`: **771 frames, 0 faults.**

| Check | Result |
| --- | --- |
| Paint-order cycles | 0 |
| Independent occlusion check: for every overlapping pair, rays through up to 12 points where both pictures overlap; the painted order must match the nearer solid | 51,602 overlapping pairs, 316,999 ray samples, 0 disagreements |
| A piece cut by the camera's near plane while in view (it would vanish) | none |
| A robot piece hidden by the deck or ramp faces (painted underneath) | none |

## File QA

Measured with `tools/qa.py` from the file (`qa/V3_REVIEW_qa.json`); the mix from `audio/mix/mix_measure_v3.json`.

| Check | Result |
| --- | --- |
| Picture | H.264 High, 1080×1920, yuv420p bt709, 30 fps, 771 frames, 25.700 s |
| Audio | AAC 48 kHz stereo; −14.6 LUFS integrated, −2.6 dBTP; voice 22.3 dB over everything else in the phone band |
| Full decode | no errors |
| Black frames / frozen stretches | none / none |
| Sync against the PCM mix | 0.0 ms |
| Caption words | equal to the locked narration (captions and SRT); longest lead 0.04 s; timing unchanged |
| Frame-difference spikes away from the 10 planned cuts | none (one fast pull-back, out of the connector close-up, was slowed after the first render) |
| Loop seam (last frame → frame 0, below the caption band) | 0.63 mean luma step; the frames before it step 0.89, 0.81, 0.71, 0.61, 0.54 and the frames after it 1.13, 2.47, 3.77, 5.04, 6.14 (the camera arrives at rest and leaves from rest) |
| Loop sound | the bed is whole cycles over the film; the jump at the seam is 0.0027 |

Evidence sheets:
- `qa/V3_contacts_frames.png`: every frame around the four contacts.
- `qa/V3_fail_release_replace_0.1s.png`: the failure, release and replacement.
- `qa/V3_loop_seam_frames.png`: frames 764–770 and 0–2.
- `qa/V3_full_0.5s.png`: the whole film.

## Rebuild

```sh
cd Future_Got_Weird/robot-metabolism
sh tools/render_v3.sh review          # cues -> mix -> render (video muted; the PCM mix encoded once to AAC)
QA_MIX=audio/mix/FGW_Robot_Metabolism_V3_mix.wav QA_CUES=audio/cues_v3.json \\
  python3 tools/qa.py exports/FGW_Robot_Metabolism_V3_REVIEW_1080x1920.mp4 qa/V3_REVIEW_qa.json
for p in probe3 probe3_view; do
  source/node_modules/.bin/esbuild tools/$p.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/$p.cjs && node /tmp/$p.cjs
done
```
