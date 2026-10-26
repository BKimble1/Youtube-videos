# Future Got Weird: Lightning Laser

## V2 (second pass)

**Status (26 Oct 2026):** the V2 review is rendered from source (measured 1080×1920, 30 fps, 1005 frames) and checked from the file
(`production/V2_QA_REPORT.md`). **Not published.** The narration, its timing and the 33.50 s duration are V1's,
unchanged (the same voice file, gain only).

What changed from V1:
- 25 compositions instead of 14.
- One 3D site model, so the tower, beam and bolt agree from every angle.
- A stronger hook.
- A firing sequence: activation, panel, optics cutaway, exit window, beam past the mast.
- Four distinct molecular scenes.
- A rebuilt vignette: balanced stance, skeleton inside the same outline, quick jolt, no badge.
- A rebuilt operator: real fingertip contact, the panel responds, a restrike lights her face.
- A house rod lit by a distant strike, matched to the tower tip.

| Deliverable | File |
|---|---|
| Review: 1080×1920, 30 fps, 1005 frames, 33.50 s, captions burned in, seamless loop | `exports/FGW_Lightning_Laser_V2_REVIEW_1080x1920.mp4` |
| Shots and transitions | `production/V2_SHOTS_AND_TRANSITIONS.md` |
| QA report | `production/V2_QA_REPORT.md`, `qa/v2/` |
| Mix (same narration; effects retimed to the V2 picture; −14.0 LUFS) | `audio/mix/FGW_Lightning_Laser_V2_mix.wav`, `audio/mix/mix_v2_measure.json`, `audio/sfx_cues_v2.json` |
| Editable source | `source/src/v2/` (composition `LightningLaserV2`), registered in `source/src/Root.tsx` |

V2 source (`source/src/v2/`):

| File | What |
|---|---|
| `timeline2.ts` | shot boundaries, the loop and demonstration leader growth |
| `p3.ts`, `Scene3D.tsx`, `shots3d.tsx` | the 3D site model (metres), projection, sky/summit/tower/discharge/beam, per-shot cameras and states |
| `LaserArt.tsx`, `Composite.tsx` | the detailed 2D apparatus and the shots that place it on the 3D view (H2, F4, E1) |
| `Console2.tsx` | the shelter: panel, reach-and-press solver, window view, lighting, desk props (C1, C2, F1) |
| `Vignette2.tsx` | the imagined strike and the air above his head (V1, M1) |
| `Firing2.tsx` | the enclosure cutaway and the exit window (F2, F3) |
| `Molecular2.tsx` | the molecular scenes (M2–M5) |
| `Rod2.tsx` | the house rod (R1, R2) |
| `shots2.tsx`, `Film2.tsx`, `captions2.ts` | routing, the composition and stills (`FilmStillV2`, `SheetV2`), caption heights |

Rebuild V2: `./tools/build_all_v2.sh` (mix → review render → file QA + motion scan; `master` adds a 2160×3840
render). Contact sheets: `cd source && ./sheet2.sh out.png "f1,f2,..." [true]`.

## V1

**Status (26 Oct 2026):** the V1 review (1080×1920) and a native 2160×3840 master were rendered from source and
checked from the files (`production/QA_REPORT.md`, which lists what was measured and what remains). **Not
published.** Nobody has watched it in real time with sound: this environment has no display or speakers, so playback
was inspected as frame strips, contact sheets, a frame-difference motion scan and two speech recognisers on the
file's own audio.

| Deliverable | File |
|---|---|
| Review: 1080×1920, 30 fps, 1005 frames, 33.50 s, captions burned in, seamless loop | `exports/FGW_Lightning_Laser_V1_REVIEW_1080x1920.mp4` |
| Master: 2160×3840 native (vectors rendered at 2×, not upscaled), the same cut | `exports/FGW_Lightning_Laser_V1_MASTER_2160x3840.mp4` |
| Locked script (approved narration, verbatim) | `production/NARRATION_APPROVED.txt` |
| Voice: channel narrator "Test Voice" (`kk5XaSLo2XAw0sKM98zU`, eleven_v4), take 1, unedited; **33.50 s measured** (speech 0.00–33.15 s) | `audio/narration/FGW_Lightning_Laser_narration.wav` |
| Voice takes, word timings, provenance | `audio/narration/takes/`, `audio/narration/words.json`, `audio/narration/voice_provenance.json` |
| Caption timings / SRT | `source/src/data/timeline.json` (`captions`), `captions/FGW_Lightning_Laser_V1.srt` |
| Mix (voice + synthesised ambience, bed and effects, −14.0 LUFS) and cues | `audio/mix/FGW_Lightning_Laser_V1_mix.wav`, `audio/mix/mix_measure.json`, `audio/cues.json`, `audio/sfx_cues.json` |
| Shots and transitions | `production/SHOTS_AND_TRANSITIONS.md` |
| Sources, simplifications, cast/asset provenance and limitations | `production/SOURCE_NOTES.md` |
| QA report and evidence | `production/QA_REPORT.md`, `qa/` (strips, film sheet, cast sheet, motion scan, ASR, file checks) |
| Upload description draft (research links) | `production/UPLOAD_DESCRIPTION_DRAFT.md` |
| Editable source | `source/` (Remotion 4.0.533, React 19, TypeScript) |

## Cast

Two established Weird Crew designs on the Death Clock rig (`source/src/dc/`, copied from Glass Climbing): the
red-haired guesser in the striped tee (the illustrative danger vignette) and Video 01's `clerkB` as the operator in
the control shelter. The operator was reconstructed on this rig from her Video 01 design, and the lead's green iris is
an addition; see `production/SOURCE_NOTES.md` ("Asset limitations").

## Source layout (`source/src/`)

| Path | What |
|---|---|
| `world/site.ts` | the site's fixed geometry (tower tip, beam axis, optical exit, guided section, close-up point), the lightning path, the loop leader and demonstration leader growth, the discharge's light |
| `art/` | `Env` (sky, clouds, ranges, summit, rain), `Tower`, `Apparatus`, `Shelter`, `Bolt` (bolt, beam, pulses, channel), `Skeleton` |
| `scenes/` | `Site` (the site through a camera), `Interior` (shelter), `Vignette` (illustration and its air view), `Micro` (molecular field), `Rod` (house) |
| `shots.tsx` | the shot table, cameras and per-shot state; `tauOf` is the loop clock shared by the end and the start |
| `cast.ts`, `Captions.tsx`, `captions.ts`, `Film.tsx`, `Root.tsx` | cast, channel caption style and placement, composition and working stills (`FilmStill`, `Sheet`, `CastSheet`, `PoseTest`, `SiteTest`) |

## Rebuild

```sh
cd Future_Got_Weird/lightning-laser
python3 -m pip install soundfile scipy numpy pyloudnorm pocketsphinx sherpa-onnx
(cd source && npm ci)                       # remotion.config.ts points at the preinstalled Chromium
python3 tools/make_narration.py             # take -> final wav (padding only), word timings, timeline.json, SRT
./tools/build_all.sh master                 # cues -> mix -> review render -> file QA + motion scan -> 4K master
# ASR of the review's own audio (sherpa-onnx zipformer-en-2023-06-26 and whisper-base.en from the k2-fsa releases):
python3 tools/asr_sherpa.py exports/FGW_Lightning_Laser_V1_REVIEW_1080x1920.mp4 audio/narration/words.json <model_root> qa/FGW_Lightning_Laser_V1_REVIEW_asr.json
python3 tools/strips.py exports/FGW_Lightning_Laser_V1_REVIEW_1080x1920.mp4 qa/strips seam:32.9:33.49:1 open:0:0.6:1
```

Contact sheets while working: `cd source && ./sheet.sh out.png "f1,f2,..." [true]`. Media are stored as plain git
blobs (the episode `.gitattributes` turns LFS off, as in the other FGW episodes); `source/public/audio/*.wav`,
`audio/mix/stems/`, `audio/mix/stems_v2/` and the 3× loop review file (`qa/*_loop_x3.mp4`, about 90 MB) are regenerated and not committed.
