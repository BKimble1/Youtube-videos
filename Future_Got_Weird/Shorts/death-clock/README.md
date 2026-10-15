# Future Got Weird Short: The Death Clock (V4)

A 45.0 s vertical Short (1080×1920, 30 fps, 1350 frames) about a **fictional** future wristband that counts down to the wearer's death, calls a hospital's drone and treats him. It is built as a loop: the last frame leads straight into the first. A small, unboxed "FICTIONAL FUTURE DEVICE" cue sits in the upper right for the first 1.3 s, and the packaging text is plainly hypothetical (`upload/PACKAGING_V4.md`).

Not uploaded, scheduled or published.

V4 is a focused polish of V3 against the V4 brief. It keeps V3's narration (the same recording), caption text and timing, story, hook, runtime, music stem and countdown origin. It corrects the defects the V3 review found:
- the leash
- the superimposed arm and chest reveals
- the device geometry and treatment mechanism
- the dispatch transitions and head clearance
- the loop wrap

**V1-V3 are recoverable.** Their deliverables are unchanged in `exports/v1/`, `exports/v2/` and `exports/v3/`. V1's source is at commit `6772c36`, V2's at `7f601c1` and V3's at `b5c02b1`.

The director's design decisions are in `script/V4_DESIGN.md`.

## Deliverables (`exports/v4/`)

| File | What it is |
|---|---|
| `FGW_DeathClock_V4_Final_1080x1920.mp4` | Upload master: native 1080×1920 30 fps from the project source, burned-in captions, H.264 CRF 16, AAC 320k 48 kHz |
| `FGW_DeathClock_V4_Review.mp4` | 540×960 review copy, the same 1350 frames and timing (a downscale of the master; not for upload) |
| `FGW_DeathClock_V4_QA.md` | Timecoded correction and QA notes: what was inspected, measured and not heard |
| `FGW_DeathClock_V4_Captions.srt` | Aligned subtitles (38 cues; caption text and timing unchanged from V3) |
| `FGW_DeathClock_V4_Cover_1080x1920.png` | Cover candidate (a frame of the caption-free composition) |
| `FGW_DeathClock_V4_Narration.txt` | The narration text (unchanged) |
| `audio/FGW_DeathClock_V4_Narration_48k.wav` | The selected take after V3's silence-only gap edit (unchanged; mono, 24-bit, 45.0 s) |
| `audio/FGW_DeathClock_V4_Stem_{narration,music,effects}_48k.wav` | Narration and music stems byte-identical to V3; effects stem rebuilt for V4; the three sum exactly to the mix |
| `audio/FGW_DeathClock_V4_Mix_48k.wav` | Final mix |
| `EXPORT_METADATA.json` | ffprobe data and SHA-256 for every file above |

Supporting files:
- `qa/v4/`: decoded-frame sheets, phone overlay, motion scan, seam check, `DEVICE_CHECK.json`, `CAPTION_CHECK.json` and `AUDIO_QA.json`
- `script/V4_DESIGN.md`
- `PROVENANCE.md`

## What V4 changes (and where)

- **Leash** (`art/Leash.tsx`, drawn once in `shots/Scene.tsx`):
  - from the dog's collar ring, a J-hang to the grass and a released handle loop at one world point between the dog and the man
  - never attached to him; no visibility gates
  - one shared dog pose (`dogAt`)
- **Rig** (`art/Man.tsx`, `shots/Opening.tsx`):
  - soft two-bone IK; planted hands and feet stay exactly on their targets (bone stretch of 4.5% or less)
  - the planted palm holds its angle in world space
  - the hips land at rest (no overshoot at the hand contact)
  - the far elbow tucks inside the tee
  - the near sleeve crown is cut by the tee's outline; waist folds are soft creases
- **Arm and chest anatomy** (`lib/reveal4.ts`, `lib/heart4.ts`, `art/Cutaway.tsx`, `art/Heart4.tsx`):
  - one reveal authority: arm section, then closed exterior with a thin diagnostic trace, then chest window, then close, then wrist
  - the arm and the chest are never open together
  - the chest window is torso-shaped, sits on the visible front thorax and is mounted under the arm, sleeve and hand, which occlude it
  - inside: a central heart between a larger right lung and a smaller notched left lung, great vessels with the arch toward his left, the diaphragm, and a liver that dims for the "organ failing" beat
  - the heart squeezes on systole and its beats are shared with the sound
  - the signals and the warning travel as dashes on the arm's trace, not as particles in the blood
- **Device and treatment** (`art/Device.tsx`, `art/Interior.tsx`, `art/Hand.tsx`, B4 treatment keys):
  - one compact geometry for every view: rounded profile, side button, underside panel and seam, shutter, actuator, small reservoir and sensor cartridge
  - the hand clears into the section backdrop with a soft straight edge timed to the case roll (no circular cut), and the forearm falls into shadow past the band
  - the sensor shot is a light touch with sparse cyan beads
  - the treatment chain: the shutter opens, the piston advances, the nose presses the skin, and the section opens from the contact point, and one blue-white slug runs along a narrow continuous channel from the port into the vessel, entering with the flow, and is tracked; then a match cut into the chest view, where the heart settles
- **Dispatch** (`shots/Dispatch.tsx`, `art/Drone.tsx`, Aftermath3 arrival):
  - the transmission pulse continues onto the map and into the hospital's dock ring, with a match cut on the dock beacon
  - a continuous rooftop approach; the order is latch, then rotor spin-up, then lift, then travel; the rotor blur turns with pitch
  - the drone is identical across the cut to the neighbourhood (screen position, scale, pitch, no roll); the houses sit on grass
  - one trunk that fully covers the frame for two frames at the swap (897-898), with the drone's position, pitch and speed continuous behind it
  - the arrival brakes into a hover above-right of his head (at least 84 world units of clearance), with sky between the drone and the house roof, a soft ground shadow on the lawn that follows it, and a retreat before the recovery; the drone blinks and the band's ring answers, with no line drawn across him
- **Loop and device states** (`lib/device3.ts`):
  - one periodic alarm in loop time (emissions at frames 1344, 6 and 18) drives the border flash, a ring round the glass that never crosses the digits, and the sound onsets
  - no frame-0 ring, shake or glow step
  - the screen's clock runs in loop time
  - the compressed story time ends before the band is seen again
  - the held screen stays red, and green wipes up over it at "Green replaces red"
- **Captions:** the text, timing and style are unchanged. `scripts/check_captions4.ts` checks every captioned frame against the digits, port, treatment slug, heart, eyes and hero sensor; collisions were fixed by camera keys only.
- **Sound** (`lib/sound4.ts`, `tools/build_audio_v4.py`):
  - the V3 narration and music stems are reused byte-for-byte
  - only the effects bus is rebuilt, under V3's own gain envelope (no loudness rebuild)
  - new cues follow the picture: latch, rotor path, shutter, actuator, contact, treatment pulse, retract, port close, heartbeats from the shared schedule, the periodic alarm and a cyclic ambience

## How V3 is built (the base V4 polishes)

**Rig** (`source/src/lib/limb.tsx`, `lib/ink.tsx`, `art/Man.tsx`, `art/Hand.tsx`, `art/Head.tsx`). Each arm and leg is one continuous contour from shoulder to wrist or hip to ankle: the two segments' side lines meet in an arc round the outside of the joint and a soft fold inside; the two cylinder gradients cross-fade across the joint, and a short crease is drawn only on a clearly bent joint. The whole figure is one outer contour group (its exterior silhouette), with thinner occlusion lines inside; a contour that would cross a joint where a part grows out of the body (shoulder, hip) dissolves there. The sleeve grows out of the shoulder (the tee's stripes run on into it) and ends in an open hem; the palm and fingers share the forearm's contour, so no line crosses the wrist; the ear sits inside the head's contour. Feet can be planted with two-bone IK, so the collapse never slides a foot.

**One world from the collapse to the transmission** (`shots/Opening.tsx`, `shots/Journey3.tsx`). The supported collapse (knees give over planted feet, hips land, the left hand reaches and plants, the elbow gives and locks); the camera follows that wrist into the band, whose layout turns upright on the vertical forearm; it buzzes and the fingers dig in; the camera tilts round the case to its underside port; a bright cut edge sweeps the section open; the port presses and a narrow sensor stream enters the vessel; the camera follows one hero sensor across the near wall, overtaking the flow, past a red cell, round a bend to a changed cell, scans it and follows its signals back up the same arm (now seen through) into an oval cutaway in his chest (`art/Cutaway.tsx`: rim, far wall, parallax): the liver dims, the heart turns irregular, and its warning races down the arm into the red screen. One invisible switch happens deep inside the vessel.

**Dispatch** (`shots/Dispatch.tsx`): a 0.7 s map blip to a hospital; the pulse lands in the beacon of a drone dock on the hospital's rooftop launch bay (EMERGENCY parapet sign, glass stairwell with a staff member, equipment, ambulance bay below); the latch opens, the rotors spin up, the drone rises, banks and flies over the neighbourhood; a foreground tree trunk passes the lens and wipes onto his lawn (V4: the trunk fully covers the frame for two frames at the swap, so the two scenes are never side by side).

**Treatment, recovery, question, loop** (`shots/Aftermath3.tsx`): the drone arrives beside him (assistance, a lock-on blink answered by the band, no healing light); the band turns its case, the port injects one blue pulse into the same vessel and it climbs the arm to the heart, whose rhythm settles; the window closes as he breathes out; the hand loads, he pushes up to sitting and lifts the wrist: green replaces red, "Life Expectancy: 42 Years". Unease. The camera pushes into the glass, one local "?" glitch turns into the opening's red 00:02:14, and the same push carries through frames 0–7 of the next play (the cold open), then cuts to the collapse.

**Device states** (`lib/device3.ts`): one origin, red 00:02:14 at frame 0, counting at film speed whenever the band is in picture; compressed story time while the dispatch is on screen; held at 00:00:40; green; one glitch; the red callback. `source/scripts/check_device3.ts` checks every frame.

**Sound** (`lib/sound3.ts`, `tools/build_audio_v3.py`): continuous scene beds (garden air, roof wind, flow inside the arm, rotors), short effects on contacts and motion, one warning transient at frame 0, one where the warning lands mid-film, countdown ticks only while the band's face is in picture. The music bed is cyclic (every oscillator a whole multiple of 1/45 Hz; 45.0 s is exactly 75 beats at 100 bpm), effects that run past the end wrap into the head, and the ducking envelope is computed across the loop point.

## One cue system

The cue system is unchanged from V3:
- `source/src/data/narration_words_v3.json` holds the measured word times.
- `lib/timeline3.ts` turns them into the beat table `B`; V4 does not change it. Captions, countdown and the reused music stem read it.
- V4's new action keys live in `lib/beats4.ts` (`B4`). The picture and `lib/sound4.ts` both read them, along with the shared heartbeat schedule (`lib/heart4.ts`), the alarm onsets (`lib/device3.ts`) and the drone's screen view (`Dispatch.droneView`).
- `scripts/export_cues4.ts` writes `audio/v4/cues.json`, from which the effects stem and the mix are built.

## Rebuild

Requirements: Node 20+, Python 3.11+ with numpy and Pillow, ffmpeg/ffprobe, and Chromium (`/opt/pw-browsers/...` here; the path is set in `source/remotion.config.ts`).

```bash
cd source
npm ci
npx tsc --noEmit
npx tsx scripts/check_device3.ts          # countdown, alarm and device states, every frame -> ../qa/v4/DEVICE_CHECK.json
npx tsx scripts/check_captions4.ts        # captions vs digits/port/slug/heart/eyes/hero, every frame -> ../qa/v4/CAPTION_CHECK.json
npx tsx scripts/export_cues4.ts           # -> ../audio/v4/cues.json (asserts timeline3, caption windows and the V3 music plan are unchanged)
cd ..
python3 -B tools/build_audio_v4.py        # V3 narration/music stems reused; effects rebuilt under V3's gain envelope -> audio/v4
python3 -B tools/qa_audio_v4.py           # -> qa/v4/AUDIO_QA.json
cd source
npx remotion render src/index.ts DeathClock ../exports/_wip/v4_captioned_silent.mp4 --crf=16 --x264-preset=slow --color-space=bt709 --muted --concurrency=4
node scripts/frames.mjs ../exports/_wip/cover DeathClockClean COVER_FRAME 1 && mv ../exports/_wip/cover/DeathClockClean_*.png ../exports/_wip/v4_cover.png
cd ..
python3 -B tools/export_v4.py             # mux, review copy, audio/text deliverables, metadata -> exports/v4
F=exports/v4/FGW_DeathClock_V4_Final_1080x1920.mp4
python3 tools/qa_sheets.py $F qa/v4 6 0,40,90,200,330,420,520,640,690,760,830,960,1060,1150,1240,1300,1340
python3 tools/motion_scan.py $F qa/v4/cuts.json qa/v4/MOTION_SCAN.json
python3 -B tools/seam_check_v4.py         # loop seam: last 1.5 s + first 1.5 s x3, picture and sound -> qa/v4/seam
```

The V4 audio build reads `audio/v3/cues.json` and the V3 tools (read-only) to rebuild V3's gain envelope, so those V3 files must stay as committed.

The full render takes about 25-30 minutes on this container. Renders are deterministic: no random calls at render time and no network fetches.

`npx remotion studio src/index.ts` opens the compositions:
- `DeathClock` (captioned) and `DeathClockClean` (no narration captions) are the film.
- `RigCollapse`, `RigElbow`, `J3Test`, `DispTest`, `AftTest`, `DeviceTest` and `Lab*` are development rigs.

## Layout

```
script/      narration_v3.json (the locked text), V4_DESIGN.md, CUE_SHEET_V3.md (V2/V1 cue sheets kept)
source/src/  lib/ (timeline3, beats4, device3, reveal4, heart4, captions, sound3, sound4, limb, camera, ink, shading, motion)
             art/ (Man, Head, Hand, Dog, Leash, Device, Interior, Cutaway, Heart4, Street, Drone, Map, ...)
             shots/ (Opening, Journey3, Dispatch, Aftermath3, Scene, StreetShots, Overlay)
audio/       narration_v3/ (audition, takes, edit, word times), v4/ (cues, stems, mix); V1-V3 audio kept
tools/       *_v4.py builders and checks; V1-V3 tools kept
exports/     v4/ deliverables; v1/, v2/, v3/ unchanged
qa/v4/       decoded-frame sheets, phone overlay, motion scan, seam check, CAPTION_CHECK.json, AUDIO_QA.json, DEVICE_CHECK.json
upload/      PACKAGING_V4.md (earlier versions kept)
```
