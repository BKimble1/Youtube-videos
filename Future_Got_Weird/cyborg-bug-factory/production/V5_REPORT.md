# Cyborg Bug Factory: V5 report (animation integrity, collision and continuity)

## A. Final video

`exports/FGW_Cyborg_Bug_Factory_V5_FINAL_1080x1920.mp4`

- **Source.** Rendered natively from the Remotion composition `CyborgBugFactoryV5` (`source/src/v5/`), mix `mix_v5`
  (`tools/make_audio_v5.py`).
- **Unchanged.** V1–V4 are untouched and still render.
- **Same as V4.** Narration, captions, cut points, cameras (with one exception, the holder seat the C1 camera targets),
  the single 68 s graphic, the art and colours, and the loop.
- **Resolution.** This file is 1080×1920 (ffprobe below). The 512×910 you saw must be a downscaled copy made after
  export; every render in this project is exported at 1080×1920.

## How V5 was audited

I didn't rely on screenshots alone. Two tools were written for this pass, and both ran on V4 (before) and V5 (after):

1. **`source/src/qa5/audit.ts`: a geometric integrity audit of all 946 frames.**
   - It uses the same models the renderer draws:
     - the insect as its drawn ellipsoids, legs as capsules, and antenna points;
     - the backpack's plate, tab, electrodes and branches;
     - the gripper's body, fingers and pads;
     - the arm's links;
     - the rods, platform, holder, rubble slabs and rocks.
   - It measures:
     - penetration depth between every pair of these;
     - feet against the real support surface, and planted-foot sliding;
     - module handovers and appearances or disappearances in view;
     - platform speed.
   - Results: `qa/v5/integrity_audit_V4_before.json` and `qa/v5/integrity_audit_V5_after.json`.
2. **`tools/spike_audit.py`: a continuity scan of the rendered MP4.**
   - Each frame's change, globally and in a 6×8 grid of cells, compared with its neighbours, to find pops, flashes,
     layer swaps and teleports.
   - Results: `qa/v5/continuity_spikes_V4_before.json` and `qa/v5/continuity_spikes.json`. Every strong event in V5 is
     classified in section D.

I also inspected frames visually: contact sheets of every scene, and consecutive frames at higher resolution around the
latch, release, holder pickup, walk-off, crevice and loop seam. That's how three defects the audit didn't model were
found (items 7, 3 and 21 below).

## B. Defect log

Times are seconds (frame = t × 30). "Before" is measured on V4; "after" on V5.

| # | Time (s) | Objects | Defect | Root cause | Fix | Verified |
|---|---|---|---|---|---|---|
| 1 | 23.63–26.73 (fr 709–802) | backpack ↔ crevice wall | The backpack tab sat **11.7 mm inside** a wall; this was the "low barrier" | The slabs carried their thickness inward, so their end faces met **13–19 mm above the floor**: a roof lower than the insect plus backpack (18 mm) | Walls rebuilt: the inner face rises from the floor edge and the thickness lies outward or buried (clipped at the floor when drawn). The crevice is now an open V, 50 mm wide at the floor | 0 frames |
| 2 | 23.63–24.33 | antennae ↔ walls | Antennae up to 6.4 mm inside the walls | Same narrow walls; antennae spread wide | Antennae sweep forward and in inside the crevice; the stance narrows | 0 frames |
| 3 | 20.60–21.17 (fr 618–635) | legs ↔ rocks | Feet inside loose rocks (up to 3.9 mm) | Rocks placed by hash with only 40 mm clearance, inside the leg span (28.4 mm) | Every rock keeps its reach + 38 mm clear of the route | 0 frames |
| 4 | 24–26.7 | insect ↔ right wall | The route drifted into the right-hand wall | A −6° turn in the route | Route centred in the crevice | 0 frames |
| 5 | 4.30–4.57, 6.00–6.33, 27.90–28.27 | platform ↔ walking insect | **The platform slid out from under a walking insect**, which was left standing on nothing (feet 3.18 mm above the bench) | Swaps were scheduled before the insect had walked off; the walking code's ground didn't know the platform had left | Swaps retimed so each insect is fully clear first: 4.62–4.90 (inside the time-lapse), 7.0–7.8, 15.9–16.4, 28.0–29.4. Cycle 1 now takes its module before scanning, so latch times are unchanged | 0 frames |
| 6 | every swap | platform ↔ holder | The platform's edge overlapped the holder's pedestal by 6 mm, so the slide swept through it (seen in V5's first render, from 7.0 s) | The slider ran toward −x, where the holder stands | The slider now runs toward +x (nothing stands there) | 0 frames, new check |
| 7 | 0–1.03 and every placement | circuit board | **The board vanished and reappeared** (hidden in frames 0–32, visible from 33) | The board overlapped the grasping tab, and on-plate parts were depth-sorted by centre against the plate's centre, so from some angles the plate covered the board | One V5 module model (`v5/pack5.tsx`): board moved beside the tab; anything mounted on the plate is always drawn above it when the plate's top faces the camera | Frames 26–34, 215, 300, 310, 330 checked |
| 8 | 2.9, 5.52, 10.9, 25.5 | battery | The battery grew from 60% size and faded in | The battery "plug-in" animation | Removed: one fixed design in every shot | Every shot |
| 9 | 0–1.0, 4.9–5.47, 7.2–10.17, 28.0–31.5 | gripper ↔ module | Module **14° off** the gripper axis; a pad **0.67 mm into** the tab | The held module was drawn upright while the tool was tilted 14° | The held module is the gripper's child (its frame is the tool frame); the tool levels near any seat | 0° / 0 mm |
| 10 | 1.03, 5.50, 10.20 | module at the latch | 0.33 mm jump when the gripper let go | The body's press was released in a single frame | The press continues smoothly through the latch; during placement the arm tracks the insect's live seat | 0.13 mm, which is ordinary per-frame press motion |
| 11 | all shots | module ↔ thorax | Module **floating 1.06 mm** above the thorax | Seat height 10.9 mm against a measured thorax top of 9.88 | Seat at 9.9 | 0.06 mm gap |
| 12 | 2.3–4.83, 5.9–7.17, 10.5–14.87, 26.77–27.97 | parked module ↔ holder | Electrodes and branches **2.5 mm inside** the holder | Holder top directly under the plate | Two-seat cradle: the plate rests on rails, and the deck sits 4.5 mm lower to clear the electrodes (3.7) and flared branches (3.4) | 0 frames |
| 13 | 2.30, 5.90; 4.867 | holder modules | A module **appeared on the holder in view**; a module **vanished for one frame** at pickup | Refills at fixed times; a 0.02 s gap between "off holder" and "in gripper" | Two seats, refilled only while the holder is out of frame (computed from the cameras); same-instant handover | 0 frames |
| 14 | 491 frames, 0–31.5 | legs ↔ rods | **Legs through the rods** (worst 2.27 mm) | Rod B's side pads crossed the middle legs; rod A's post stood in the walking path | Rods rebuilt: posts on the platform outside the leg envelope, overhead arms, pins whose rounded tips rest on the body. On release they lift first, then retract; walking starts only after they are clear | 0 frames |
| 15 | 398 frames | rods ↔ body | Rod B's pads 0.55 mm inside the body; rod A's tip slightly inside | Pads at a fixed height | Tip heights measured from the rig; the rounded tips touch the surface | 0 frames |
| 16 | 4.0–4.23, 12.57–12.87, 27.2–27.53 | rods ↔ module | Rod A's arm through a walking insect's backpack (1.06 mm) | The rod stayed low in the path | Retracting rods | 0 frames |
| 17 | 118 frames | feet | **Planted feet sliding** (worst 1.59 mm) | Twitches moved planted feet; the stand-to-walk blend slid feet | Twitches move a foot only while lifted. The walk starts from the actual standing feet (`v5/gait5.ts`), preceded by a short preparatory step of the first tripod | 1 frame at 0.35 mm |
| 18 | 65 frames | femurs ↔ pronotum / mesonotum | Knees rising into the plates (≤0.69 mm into the visible dome) | The first stance compressed those legs by 10 mm; knee direction | Preparatory step; V5 knee poles for front and middle legs | 2 frames ≤0.5 mm, wide shots (13.9, 14.8; about 3 px) |
| 19 | 13.53–13.73 | foot ↔ platform edge | Foot 0.53 mm into the edge | The walk ground ramped over 3 mm at the edge | Sharp platform edge in the ground function | 0 frames |
| 20 | camera moves | legs, head, pack | **Layer pops**: near legs flipped from in front of to behind the plates as a moving camera crossed 25° elevation; the pack flipped against the pronotum at a viewing-angle threshold | Two hard switches in the insect's draw order | Both are now short crossfades (`v5/compose5.tsx`). The gripper's fingers are sorted with the module they hold: far finger behind the tab, near finger in front | No unexplained events in the continuity scan |
| 21 | 15.1–17.1 | robot parts | Motors 0.7 mm into the chassis; battery inside both motors; gearboxes intersecting; battery, board and sensor floating 1–1.6 mm; parts faded in mid-air; two parts started behind the camera (flying through it) | Part dimensions and placements | Every part rests on its support; parts drop in fully formed from above the frame (all 9 checked to start outside the frame) | `src/qa5/parts.ts` |
| 22 | walk-offs | shadow | Shadow dropped to bench height while the insect was still on the platform | Shadow height switched with the "on platform" flag | Shadow follows the surface under the body | — |
| 23 | 27.90–28.27 | platform | Real-time slide at up to 74 mm per frame | 0.22 s per direction | 0.7 s per direction | None over 30 mm per frame in real time |

## C. Geometry repairs (systems, not screenshots)

- **One backpack model.** `v5/pack5.tsx` is used by every V5 scene.
  - It has one set of dimensions (plate 12.6 × 14.6 mm, tab, board, chip, LED, branches, electrodes) and fixed stacking.
  - The field unit in the rubble carries the same module **plus** a small camera block. That is deliberate: the units
    deployed in Myanmar carried cameras, and it changes only across the cut to the field.
- **Anchors and parent–child transforms.**
  - Seat on the insect = body frame × `PACK_SEAT5` (thorax contact).
  - Held module = the tool frame (gripper child).
  - Parked module = the holder seat frame.
  - Rod tips = the body surface plus the tip radius.
  - Feet: planted world points, with the legs solved by IK.
  - Handovers happen at identical frames, so nothing jumps.
- **Arm.**
  - Same joints and link lengths.
  - The tool levels to 0° within reach of a seat.
  - During placement the TCP follows the insect's live seat.
  - The audit checks the links and gripper against the bench, platform, holder, rods and every insect on every frame:
    no contacts.
- **Collision system.** `src/qa5/geom.ts`: ellipsoids, capsules, oriented boxes, rounded tips, and the insect's full
  envelope (body, legs, antennae, backpack).
- **Gait.** `v5/gait5.ts`:
  - the tripod gait continues from a real stance;
  - a preparatory step comes before each walk;
  - V5 knee poles for the front and middle legs;
  - lower swing on the front legs.
- **Depth order.** `v5/compose5.tsx` crossfades and grip sorting.
- **Rubble.** Floor-clipped boxes, an open-V crevice, a centred route, and rock clearance.
- **Determinism.** Everything is a pure function of the frame (hash-seeded, no `Date.now` or random).

## D. Scene validation

| Scene | How inspected | Result |
|---|---|---|
| 0–4 s (hook, latch, release, walk-off) | Audit every frame; frames 0–60 one by one (`qa/v5/first_2s_every_frame.png`); latch frames 26–40 enlarged | Pass |
| 4–7 s (68 s time-lapse) | Audit; contact sheets | Pass. The platform slide in the sped-up sequence (4.62–4.90) moves up to 96 mm per frame: time-lapse motion, continuous, no contacts |
| 7–12 s (holder pickup, carry, placement, macro) | Audit; frames 211–231 and 270–330 | Pass |
| 12–15 s (rods lift, insect leaves) | Audit; frames 103–130 and 360–447 | Pass |
| 15–18 s (robot build) | Part-entry check; contact sheet | Pass. Parts drop in fast; this is stylised assembly, not contact |
| 18–21 s (legs, insect) | Audit (feet on the bench, legs vs body); sheet | Pass |
| 21–26.7 s (rubble) | Full-envelope collision every frame; frames 618–802 | Pass |
| 26.7–31.55 s (ending, loop) | Audit; frames 805–945; seam frames | Pass |

Continuity scan of the final file. Every strong event is accounted for:
- 1.27 s: another arm joint rising into frame;
- 4.67–4.90 s: the time-lapse slide;
- 5.6 s: the ring closing;
- 7.37–7.4 s: lift-off from the holder;
- 10.1 s: the planned latch camera kick;
- 14.97 s: just after the build cut;
- 15.2–16.9 s: parts dropping in;
- 24.93 s: the route line fading;
- 28.23–28.27 s: the ending slide.

The four cuts are the planned ones (14.9, 17.93, 20.6, 26.77).

## E. Narration

**Unchanged.**
- The master's SHA-256 is still `2cf791cc…8a87c3`, equal to `voice_provenance.json`.
- Caption text and timing are unchanged.
- ASR on the V5 MP4:
  - **Whisper** is verbatim apart from "cockroaches" for "cockroach's". On the full file it drops the last line because
    of its 30 s window; on the 24.5 s–end tail it hears "…we're not just building robots anymore. We're turning bugs into
    them." verbatim.
  - **Zipformer** hears every word, with sound-alikes only.
- The effects were retimed to the V5 schedule; voice and music are as before.

## F. Scientific verification

All sources were opened and read in this project; quotes are in `research/SCIENCE_NOTES.md`.

| Claim | Status | Source |
|---|---|---|
| A machine assembles cyborg cockroaches: robotic arm, backpack from a holder, electrodes implanted, insect released | Supported | Lin et al., *Nat Commun* 16:6073 (2025), https://pmc.ncbi.nlm.nih.gov/articles/PMC12304280/ |
| 68 seconds (the graphic) | Supported, per insect, from fixing to release: "The entire automatic assembly, from initially fixing insect to finally releasing insect, spanned 68 s." | Same paper |
| A tiny computer on the back; electrodes and pulses that make it turn | Supported (microcontroller backpack; steering over 70°) | Same paper |
| A real earthquake disaster zone | Supported: deployed with SCDF in Myanmar from 30–31 March 2025, first field deployment, hand-built first-generation units. No survivors were found by them; V5 shows no detection | https://www.ntu.edu.sg/news/detail/ai-powered-robot-assembles-search-and-rescue-cyborg-insects ; https://www.thestar.com.my/aseanplus/aseanplus-news/2025/04/05/singapores-cyborg-cockroaches-helping-with-search-and-rescue-efforts-in-myanmar-quake ; https://mothership.sg/2025/04/cockroach-robot-myanmar-quake-rescue/ |

**No unresolved material claim.** Illustrative choices, stated here:
- the rods are drawn as overhead pins (rod B presses the thorax's dorsal edge, clear of the legs);
- the two-seat holder;
- the time-lapse;
- the robot comparison is conceptual.

None of these is labelled as a measured detail.

## G. Technical verification (ffprobe on the final file)

| Property | Value |
|---|---|
| Video | H.264 High, 1080×1920, 30/1 fps, yuv420p, 946 frames, about 6.4 Mb/s |
| Audio | AAC-LC, 48 kHz stereo, about 317 kb/s |
| Duration | 31.552 s |
| Size | 26.4 MB |
| Decode errors | None |
| Loudness | −14.6 LUFS integrated, −2.3 dBFS peak (mix true peak −1.6 dBTP). Worst bed-to-voice window −3.4 dB |
| Loop | Above the captions, the last-to-first step is 13.45 against 12.4–13.7 for the neighbouring steps: an ordinary frame. The seam frames show the same module, gripper, rods, holder and insect (`qa/v5/loop_seam_last6_first6.png`, `qa/v5/loop_seam_x5.mp4`) |

## H. Verdict: **READY**

Every measured check passes, every interaction listed above was inspected, and every claim is supported.

What remains, stated plainly:
1. **Not watched in real time with sound.** This environment has no screen or speakers. The review was frame by frame,
   measured, and machine-transcribed. One phone viewing before posting is recommended.
2. **Occlusion is per part, not per pixel.** The renderer is a 2.5D painter's algorithm. The known switch points are now
   crossfades, and nothing unexplained shows in the continuity scan, but a sub-millimetre ordering approximation (for
   example the lowest 1 mm of a far finger beside the tab) can't be ruled out at every angle.
3. **Two tiny leg nicks remain** (≤0.5 mm at 13.9 and 14.8 s), in a wide shot where they are about 3 px.
4. **The time-lapse slide** (4.62–4.90 s) is deliberately fast, inside the sped-up 68 s sequence.
