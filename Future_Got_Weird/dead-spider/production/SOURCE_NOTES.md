# Dead Spider V1: production and source notes

"Scientists Turned Dead Spiders Into Robots". Vertical Short, 1080×1920, 30 fps, **30.000 s (900 frames)**.

## Narration

- **Script.** The locked script, verbatim (`NARRATION_APPROVED.txt`, 91 words), including "the dead spider" and the
  ending.
- **Voice.** The channel's ElevenLabs narrator, "Test Voice" (`kk5XaSLo2XAw0sKM98zU`), model `eleven_v4`.
- **Generation.** One run of two variations. Delivery was directed with inline tags, which are not spoken. This
  connector exposes no speed or stability controls.
- **Take.** Take 2 (`t2_Z71H.mp3`, 27.246 s) is used whole and unedited: no time-stretch, no trim inside it. Speech
  runs 0.08–27.07 s, at 200.7 wpm over the spoken span. That is faster than the brief's 175–185 wpm estimate, but it is
  the take as generated and both recognisers transcribe it cleanly.
- **Pauses.** "reach down… and" = 0.33 s.
- **Tail.** After "another spider" (27.29 s) the pickup completes and holds to 30.0 s.
- **Word timing.** ElevenLabs Scribe on the chosen take. Scribe here returns the prompt's text, so it was used for timing
  only. "spider—and" is split at the measured pause, and onsets after pauses are snapped to the waveform.
- **Wording check.** Independent: sherpa-onnx Zipformer and Whisper base.en.
  - On the take: Zipformer WER 0.000; Whisper "release/snap" for "released/snapped".
  - On the exported review's audio: **both WER 0.000**.
- **Listening.** Nobody has listened to the narration or the mix: this environment has no audio playback.
- **Record.** `audio/narration/voice_provenance.json`.

## Science and what the picture claims

**Sources.**
- Yap, T. F., Liu, Z., Rajappan, A., Shimokusu, T. J., Preston, D. J. "Necrobotics: Biotic Materials as Ready-to-Use
  Actuators." *Advanced Science* 9, 2201174 (2022). https://doi.org/10.1002/advs.202201174 (open access:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC9561765/)
- Rice University news, 25 Jul 2022, "Rice engineers get a grip with 'necrobotic' spiders":
  https://news.rice.edu/news/2022/rice-engineers-get-grip-necrobotic-spiders

**Access.** This environment could not open those pages (DNS/egress refused). The facts below were confirmed through
search results that quote the paper and the release. No paper figures or original footage were viewed, and none were
reused. Every image is original FGW illustration.

| Fact | Used as |
| --- | --- |
| A deceased wolf spider is the gripper. It stays dead throughout. | Nothing on either specimen moves except what the pressure in the legs moves. No eye, fang or body motion. |
| Spiders extend some leg joints hydraulically, with no extensor muscles. Losing pressure lets the legs curl. | Cutaway, as an illustration of a *living* spider. The fluid space in the front body is squeezed; the femur–patella joint extends; the fluid dims and drops; the unopposed flexor folds the joint. |
| A 25 G needle goes into the **prosoma** and is sealed with glue. Air opens the legs; release closes them. | The needle enters the top of the front body section at 0.42 s. A glue bead appears at 0.60–0.86 s. Air (syringe plunger in) opens the legs; air out (finger off, plunger springs back) closes them. |
| It is held and moved by external equipment. | A clamp, arm and post carry the hub in every experimental shot; the support raises, lowers and lifts. The spider never carries itself. |
| It lifted about 1.3× its own mass: gripper about 33.5 mg, load about 43.6 mg. Peak grip about 0.35 mN. | Load test on a balance. A polymer weight (3 × 4 mm; 28 mm³ at 1.55 g/cm³ is about 44 mg) reads **43.6 mg** on the display, then 0.0 as the pan unloads. The size relation is illustrative: the number is the evidence, not the size. |
| Demonstrations included grasping objects and picking up another spider. | A small block (3.6 mm foam cube), the weight, and a second, inert wolf spider lifted from a tray. |
| The work dates from 2022. | Nothing calls it new. |

**Not shown:** revival, autonomous movement, walking, stalking, twitching, electricity, gore, or a large or human-scale
load. Durability (about 700–1,000 cycles in the reports) is not mentioned.

**Simplifications.**
- The internal anatomy in the cutaway is schematic: a fluid space, three muscle bands, a joint membrane and a flexor band.
- The hand-held syringe stands in for the paper's air supply (described as a syringe or pressure source). A 30 mL
  syringe was drawn so the press reads at phone size.
- Spider proportions: body about 10.5 mm. Legs I–IV are 11.2 / 10.1 / 9.5 / 12.6 mm.

## Cast and assets

- **Operator.** The Weird Crew lead (the red-haired "guesser" of Death Clock, Real Web Fluid and Glass Climbing).
  - His rig (`source/src/dc/`) is copied unchanged from `moth-silk-web-shooter/source/src/v6/dc/`, which took it from
    Death Clock V4.
  - The lab outfit is Real Web Fluid's: white coat, safety glasses, blue nitrile gloves.
  - He is placed in the 3D scene as a billboard at his hip (1 rig unit = 1.55 mm).
  - His near index finger is solved onto the syringe's thumb rest. The close-ups use the same glove in screen space
    (`PressHand`).
- **New for this episode** (all original vector drawing):
  - a 3D-projected wolf-spider rig (`spider.ts`, `SpiderDraw.tsx`): two body sections, eight 6-segment legs on the
    prosoma, short pedipalps, chelicerae and static eyes;
  - a contact solver: each leg stops at first contact with the block, the weight, the second spider or the floor;
  - the apparatus (`apparatus.tsx`).
- **Second specimen.** The same species, drawn paler and warmer (`LOOK_B`) so the two bodies stay distinct.
- **Lab backdrop.** Real Web Fluid's lab wall (teal band, shelves, window), mapped onto a far plane and blurred for depth
  of field.
- **Sound.** Everything is synthesised in `tools/make_audio.py`. There are no samples and no third-party music.

## Runway

**Status: not used.** The environment's network policy denies Runway's output host, `dnznrvs05pmza.cloudfront.net`
(HTTP 403 at the proxy). The same block is recorded in Glass Climbing V8.

- Generated images and videos can be created in the workspace (497 credits available), but they cannot be downloaded,
  inspected or composited here.
- Relaying the files through another service would route around the network policy, so it was not done.
- No Runway generation was spent on plates that could not be used. **No Runway material appears in this cut.**
- The scenery is built from controlled vector layers instead, as the brief allows.
- **To enable plates:** in the environment's settings, add `dnznrvs05pmza.cloudfront.net` to the network's allowed
  domains (Network access), then generate plates from these briefs. Each plate gets a reference keyframe rendered from
  the shot camera without foreground (`Scene` with only `back`/`floor`) and is composited in the `back` pass:
  - **Plate A, the macro bench behind station A.** Locked camera at `camA(2.3)`. Only subtle movement in the far
    background.
  - **Plate B, the operator bench.** Camera at `O_OP`. A locked plate; the reveal stays a controlled vector move.
  - **Plate C, the tray approach.** Camera at `O_F1`. The tray rim stays as the vector occluder.

## Shot map (measured)

| Time (s) | Shot | Action | Narration |
| --- | --- | --- | --- |
| 0.00–4.10 | **A** macro → widening, station A (white pad) | Curled specimen, needle descending. Contact 0.42, insertion done 0.55, glue bead 0.60–0.86. Support raises the specimen 1.10–2.05. Camera eases back and up the tube 0.95–2.25 to the syringe and gloved index finger; plunger 1.42–3.30. Legs open 2.20–3.55 (eight legs, 0–60 ms apart), camera widening to 3.9. | "They stuck a needle into the dead spider—and its legs opened." |
| 4.10–12.17 | **C** cutaway (living spider, illustration) | Same camera and silhouette as A's last frame. Approach 4.15–5.39. Front-body squeeze and fluid out along the legs 5.39–6.6. Follow right leg I to the femur–patella joint 5.74–6.83; the joint extends 6.58–7.28; slow orbit 6.83–10.13. Flow stops and dims 8.36–9.06. Pressure drops and the membrane slackens 9.58–10.23. Legs curl 10.10–11.90 while the camera pulls back to the curled silhouette, 10.42–12.12. | "You see… to extend their legs. When they die, that pressure drops, causing the legs to curl inward." |
| 12.17–12.98 | **D1** station D | Matched framing: the real curled specimen on its needle, the block on the bench below. | "But researchers found" |
| 12.98–16.73 | **D2** operator → tube → low view | Operator presses the plunger 13.32–13.92. The camera follows the connection back to the hub 13.79–14.57 and settles low beside the specimen by 15.07. Legs spread 14.55–15.73. The support lowers it round the block 15.83–16.68. | "they could push air through the needle to spread them open again. And when they released" |
| 16.73–17.40 | **D3** insert: syringe | The finger comes off 16.83–17.03 and the plunger springs back 16.85–17.11 (pressure released). | "…the pressure," |
| 17.40–19.83 | **D4** side view at bench level | Legs close 17.52–17.95. All eight touch the block 17.74–17.83. Lift 18.67–20.03; the block leaves the bench at 18.88 and the gap and shadow grow. | "the legs snapped shut around an object." |
| 19.83–23.86 | **E** load test (new demonstration) | Close on the closed legs round the weight. Pull back to the balance 20.55–21.70; the display reads 43.6 mg. Lift 21.79–23.98; the weight clears the pan at 22.16 and the reading falls to 0.0. | "This turned the spider's body into a claw that could lift more than its own weight." |
| 23.86–30.00 | **F** tray | Low behind the tray rim, which hides the second spider. The support lowers the gripper 23.93–26.82, legs opening 24.18–25.25. The camera cranes over the rim 25.64–26.32, revealing the second spider on "another spider" (26.17). Air out 26.74–27.19; all eight legs touch it 26.93–27.00. Both lifted 27.54–29.20; the camera settles to 30.0. | "They even made it reach down… and pick up another spider." |

**Count.** Eight shots: A, C, D1, D2, D3, D4, E, F. D2 contains three setups (the operator, the tube follow, the low
view), and C moves through approach, joint and pull-back. That is about 13 setups.

## Transition list

Format: outgoing → incoming → new information → decision.

| Time | Outgoing → incoming | New information | Decision |
| --- | --- | --- | --- |
| 0.95–2.25 | Macro specimen → specimen + tube + syringe (continuous move) | What pushes the air. | Keep. |
| 4.10 | Open specimen → open cutaway spider (same camera, same silhouette) | How living legs work. Clearly an illustration: pad, needle and hand gone, pale cutaway. | Keep. |
| 5.74–6.83 | Whole spider → joint (continuous, along the leg) | The joint has no extensor; pressure extends it. | Keep. |
| 10.42–12.12 | Joint → whole curled spider (continuous pull-back) | All legs curl when pressure is lost. | Keep. |
| 12.17 | Curled illustration → curled specimen (matched size, position, angle) | Back to the experiment. | Keep (an editorial match, not a morph). |
| 12.98 | Specimen → operator station (cut) | Who supplies the air. | Keep. |
| 13.79–15.07 | Operator → tube → hub → low view (continuous) | The connection. | Keep. Slowed in QA from 0.42 s to 0.78 s. |
| 16.73 | Low view → syringe insert (cut) | The release happens at the syringe. | Keep: release precedes closure. |
| 17.40 | Insert → side view (cut) | Contact and clearance read best from the side. | Keep. |
| 19.83 | Rising block → load test (cut on the upward motion) | A separate demonstration with a measured load. | Keep (a new experiment). |
| 23.86 | Load → tray (cut) | A new demonstration. | Keep. |
| 25.64–26.32 | Behind the rim → over the rim (continuous crane) | Reveals the payload. | Keep. |
| 30.00 → 0.00 | Pair lifted → frame 0 | A compositional echo (vertical needle on the centre line). | Hard cut; nothing morphs. |

No excursion returns to an earlier subject without completing an explanation.

## Audio

- **Mix.** −15.0 LUFS integrated; −3.3 dBTP (4× oversampled).
- **Voice.** The stem correlates 1.0 with the take, about 29.5 dB above the rest in the phone band.
- **Effects.** 44, each placed from the picture's own events (`audio/cues.json`, `audio/sfx_cues.json`):
  - the needle tick at contact;
  - plunger squeaks;
  - soft air in and out;
  - the joint's fluid and the falling tone on "pressure drops";
  - a click at each leg's measured contact;
  - the support's servo;
  - the weight leaving the pan, and a soft balance beep.
- **Avoided:** no cut whooshes, impacts or resurrection cues.

## QA

Checked from the exported files.

- **Streams (ffprobe).** H.264 High, yuv420p, bt709, 1080×1920, 30/1, 900 frames, 30.000 s. AAC 48 kHz stereo
  at 320 kb/s, 30.016 s (AAC padding).
- **Black frames.** None (`blackdetect`).
- **ASR of the exported audio.** Zipformer 0.000 and Whisper 0.000 WER against the locked text.
- **Captions** (`tools/cap_check.ts`). Every captioned frame of shots A, D, E and F was checked: the needle entry, the
  body, the eight leg tips and the payload were projected through each shot's camera and tested against the caption box.
  - The only overlap is one frame (14.43 s): the block, a few pixels across, at the end of the tube move.
  - In the cutaway the captions sit at the top, clear of the joint.
- **Frame change** (`tools/qa.py`).
  - Every jump over 12 (mean absolute difference at 135×240) is on a planned cut, except two continuous camera moves:
    - the tube follow, frames 424–428 (peak 19.6);
    - the tray crane, frames 779–783 (peak 14).
  - Both were inspected as frame strips (`qa/strips/`).
- **Contact pages.** `qa/review_page_0*.png` (every 0.2 s); key frames in `qa/FGW_Dead_Spider_V1_key_frames.png`.

**Fixes made during QA:**
- The block and the second spider floated up with the support before they were gripped. Their carried offset is now
  applied only after the grip.
- Objects behind the camera projected across the whole frame and blanked the release insert. They are now culled, and
  big surfaces are clipped at the near plane.
- The hook's syringe sat below the bench top. It now stands in a ring stand on the bench.
- The hook spider was small in the wide shot. The camera is closer and the syringe is placed by projection.
- The tube looped where a screen-space spline met foreshortened points. It is now a 3D spline drawn segment by segment,
  with perspective width.
- The block was too tall to grip at its sides (3.6 mm now), and the load weight is narrower.
- The balance display was oversized and out of frame before the lift. It is now smaller and placed so 43.6 mg reads
  before the weight clears.
- The load-test support post sat directly behind the weight. It is now offset.
- The caption over the block at 12.2 s was fixed by moving the matched framing (C's end and D1) up.
- The tube follow was a whip (0.42 s); it now takes 0.78 s.
- In the cutaway, the camera follows a leg that lies across the view, with a longer lens. The other legs and the palps
  dim while it is on the joint, and the joint membrane and flexor are larger.

## Remaining limitations

- **Not watched or heard in real time.** This environment has no display or speakers. Review was by frame pages,
  strips, full-resolution stills and measurements.
- **Pace.** The take runs at about 200 wpm, above the brief's 175–185 estimate. The runtime (30.0 s) is inside 29–34 s.
- **Joint hold.** The close-up holds about 3.3 s (6.8–10.1 s) with only a slow orbit. The change in it is colour,
  fluid and membrane, not camera.
- **Tube follow** is still brisk (peak frame change 19.6).
- **Two curled spiders.** In the final pair, the legs of both are bunched together. The bodies stay distinct by
  position and colour, but the legs interleave.
- **Loop.** The loop is a hard cut. No morph was attempted, as the brief requires.
- **Runway** plates are not used (above).
- **Cutaway accuracy.** The anatomy is schematic and simplified for clarity.
