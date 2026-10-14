# Future Got Weird Short: The Death Clock (V3)

A 45.0 s vertical Short (1080×1920, 30 fps, 1350 frames) about a **fictional** future wristband that counts down to the wearer's death, calls a hospital's drone and treats him. It is built as a loop: the last frame leads straight into the first. A small, unboxed "FICTIONAL FUTURE DEVICE" cue sits in the upper-left corner for the first 1.3 s, and the packaging text is plainly hypothetical (`upload/PACKAGING_V3.md`).

Not uploaded, scheduled or published.

V3 rebuilds V2's weak systems against the V3 brief: a new 136-word narration read fast and nearly continuously, a rebuilt character rig with no exposed joint pieces, a supported collapse with planted contacts, a cold open on the red countdown, more action in the body journey, a curved torso cutaway in place of a flat x-ray panel, a hospital launch bay instead of a house-front platform, and a real audiovisual loop. **V1 and V2 are recoverable**: their deliverables are unchanged in `exports/v1/` and `exports/v2/`; V1's source is at commit `6772c36`, V2's at commit `7f601c1`.

## Deliverables (`exports/v3/`)

| File | What it is |
|---|---|
| `FGW_DeathClock_V3_Final_1080x1920.mp4` | Upload master: native 1080×1920 30 fps from the project source, burned-in captions, H.264 CRF 16, AAC 320k 48 kHz |
| `FGW_DeathClock_V3_Review.mp4` | 540×960 review copy, the same 1350 frames and timing (a downscale of the master; not for upload) |
| `FGW_DeathClock_V3_QA.md` | Timecoded QA notes: what was inspected, measured and not heard |
| `FGW_DeathClock_V3_Captions.srt` | Aligned subtitles (38 cues, the same chunks as the burn-in) |
| `FGW_DeathClock_V3_Cover_1080x1920.png` | Cover candidate (a frame of the caption-free composition) |
| `FGW_DeathClock_V3_Narration.txt` | The V3 narration text |
| `audio/FGW_DeathClock_V3_Narration_48k.wav` | The selected take after the silence-only gap edit (mono, 24-bit, exactly 45.0 s) |
| `audio/FGW_DeathClock_V3_Stem_{narration,music,effects}_48k.wav` | Stems after ducking and the shared limiter; they sum to the mix |
| `audio/FGW_DeathClock_V3_Mix_48k.wav` | Final mix |
| `EXPORT_METADATA.json` | ffprobe data and SHA-256 for every file above |

Supporting documents: `script/CUE_SHEET_V3.md` (27 units, countdown states, every narration gap), `audio/narration_v3/NARRATION_PROVENANCE.md` (audition, takes, selection, edit), `PROVENANCE.md`, `qa/v3/` (decoded-frame sheets, phone-overlay check, motion scan, seam check, device and audio checks, the prototype gate renders).

## How V3 is built

**Rig** (`source/src/lib/limb.tsx`, `lib/ink.tsx`, `art/Man.tsx`, `art/Hand.tsx`, `art/Head.tsx`). Each arm and leg is one continuous contour from shoulder to wrist or hip to ankle: the two segments' side lines meet in an arc round the outside of the joint and a soft fold inside; the two cylinder gradients cross-fade across the joint, and a short crease is drawn only on a clearly bent joint. The whole figure is one outer contour group (its exterior silhouette), with thinner occlusion lines inside; a contour that would cross a joint where a part grows out of the body (shoulder, hip) dissolves there. The sleeve grows out of the shoulder (the tee's stripes run on into it) and ends in an open hem; the palm and fingers share the forearm's contour, so no line crosses the wrist; the ear sits inside the head's contour. Feet can be planted with two-bone IK, so the collapse never slides a foot.

**One world from the collapse to the transmission** (`shots/Opening.tsx`, `shots/Journey3.tsx`). The supported collapse (knees give over planted feet, hips land, the left hand reaches and plants, the elbow gives and locks); the camera follows that wrist into the band, whose layout turns upright on the vertical forearm; it buzzes and the fingers dig in; the camera tilts round the case to its underside port; a bright cut edge sweeps the section open; the port presses and a narrow sensor stream enters the vessel; the camera follows one hero sensor across the near wall, overtaking the flow, past a red cell, round a bend to a changed cell, scans it and follows its signals back up the same arm (now seen through) into an oval cutaway in his chest (`art/Cutaway.tsx`: rim, far wall, parallax): the liver dims, the heart turns irregular, and its warning races down the arm into the red screen. One invisible switch happens deep inside the vessel.

**Dispatch** (`shots/Dispatch.tsx`): a 0.7 s map blip to a hospital; the pulse lands in the beacon of a drone dock on the hospital's rooftop launch bay (EMERGENCY parapet sign, glass stairwell with a staff member, equipment, ambulance bay below); the latch opens, the rotors spin up, the drone rises, banks and flies over the neighbourhood; a foreground tree trunk passes the lens and wipes onto his lawn (the flyover stays ahead of it, his lawn appears behind it; the frame is never fully covered).

**Treatment, recovery, question, loop** (`shots/Aftermath3.tsx`): the drone arrives beside him (assistance, a data link, no healing light); the band turns its case, the port injects one blue pulse into the same vessel and it climbs the arm to the heart, whose rhythm settles; the window closes as he breathes out; the hand loads, he pushes up to sitting and lifts the wrist: green replaces red, "Life Expectancy: 42 Years". Unease. The camera pushes into the glass, one local "?" glitch turns into the opening's red 00:02:14, and the same push carries through frames 0–7 of the next play (the cold open), then cuts to the collapse.

**Device states** (`lib/device3.ts`): one origin, red 00:02:14 at frame 0, counting at film speed whenever the band is in picture; compressed story time while the dispatch is on screen; held at 00:00:40; green; one glitch; the red callback. `source/scripts/check_device3.ts` checks every frame.

**Sound** (`lib/sound3.ts`, `tools/build_audio_v3.py`): continuous scene beds (garden air, roof wind, flow inside the arm, rotors), short effects on contacts and motion, one warning transient at frame 0, one where the warning lands mid-film, countdown ticks only while the band's face is in picture. The music bed is cyclic (every oscillator a whole multiple of 1/45 Hz; 45.0 s is exactly 75 beats at 100 bpm), effects that run past the end wrap into the head, and the ducking envelope is computed across the loop point.

## One cue system

`audio/narration_v3/narration_words_final.json` (copied to `source/src/data/narration_words_v3.json`) holds the measured word times. `source/src/lib/timeline3.ts` turns them into the beat table `B` and the unit list `UNITS`; every camera mark, device state, caption window and sound cue reads from them. `source/scripts/export_cues3.ts` writes `audio/v3/cues.json`, from which the mix, the SRT and the cue sheet are built.

## Rebuild

Requirements: Node 20+, Python 3.11+ with numpy and Pillow, ffmpeg/ffprobe, and Chromium (`/opt/pw-browsers/...` here; the path is set in `source/remotion.config.ts`).

```bash
python3 tools/build_voice_v3.py           # take C4 -> audio/narration_v3/narration_final_48k.wav (silence-only gap edit; committed)
cp audio/narration_v3/narration_words_final.json source/src/data/narration_words_v3.json
cd source
npm ci
npx tsc --noEmit
npx tsx scripts/export_cues3.ts           # -> ../audio/v3/cues.json
npx tsx scripts/check_device3.ts          # countdown and states, every frame -> ../qa/v3/DEVICE_CHECK.json
cd ..
python3 tools/build_audio_v3.py           # cues + narration + SFX -> audio/v3/stems, audio/v3/mix, audio/v3/MIX_LOG.json
python3 tools/qa_audio_v3.py qa/v3/AUDIO_QA.json
python3 tools/make_srt_v3.py captions/FGW_DeathClock_V3.srt
python3 tools/make_cue_sheet_v3.py        # -> script/CUE_SHEET_V3.md
cd source
npx remotion render src/index.ts DeathClock ../exports/_wip/v3_captioned_silent.mp4 --crf=16 --x264-preset=slow --color-space=bt709 --muted --concurrency=4
node scripts/frames.mjs ../exports/_wip/cover DeathClockClean 690 1 && mv ../exports/_wip/cover/DeathClockClean_0690.png ../exports/_wip/v3_cover.png
cd ..
python3 tools/export_v3.py                # mux, review copy, audio/text deliverables, metadata -> exports/v3
F=exports/v3/FGW_DeathClock_V3_Final_1080x1920.mp4
python3 tools/qa_sheets.py $F qa/v3 6 0,40,90,200,330,420,520,640,690,760,830,960,1060,1150,1240,1300,1340
python3 tools/motion_scan.py $F
python3 tools/seam_check_v3.py            # loop seam: last 1.5 s + first 1.5 s x3, picture and sound -> qa/v3/seam
```

The full render takes about 20–25 minutes on this container (the deep zooms inside the arm are the slow frames). Renders are deterministic: no random calls at render time, no network fetches, springs re-simulated from a fixed window of past frames. `npx remotion studio src/index.ts` opens the compositions: `DeathClock` (captioned) and `DeathClockClean` (no narration captions) are the film; `RigCollapse`, `RigElbow`, `J3Test`, `DispTest`, `AftTest`, `DeviceTest` and `Lab*` are development rigs.

## Layout

```
script/      narration_v3.json (V3 text), CUE_SHEET_V3.md (V2/V1: narration_locked.json, CUE_SHEET_V2.md, CUE_SHEET.md)
source/src/  lib/ (timeline3, device3, captions, sound3, limb, camera, ink, shading, motion)
             art/ (Man, Head, Hand, Dog, Device, Interior, Cutaway, Street, Drone, Map, ...)
             shots/ (Opening, Journey3, Dispatch, Aftermath3, Scene, StreetShots, Overlay)
audio/       narration_v3/ (audition, takes, edit, word times), v3/ (cues, stems, mix); V1/V2 audio kept
tools/       *_v3.py builders and checks; V1/V2 tools kept
exports/     v3/ deliverables; v1/, v2/ unchanged
qa/v3/       decoded-frame sheets, phone overlay, motion scan, seam check, AUDIO_QA.json, DEVICE_CHECK.json, prototype/
upload/      PACKAGING_V3.md (V2: PACKAGING_V2.md, V1: PACKAGING.md)
```
