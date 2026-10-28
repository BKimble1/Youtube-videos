# Future Got Weird: This Food Dye Makes Mouse Skin See-Through (Transparent Mouse Skin)

## V2: hook and retention rebuild (review)

**Status (28 Oct 2026):** `exports/FGW_Transparent_Mouse_Skin_V2_REVIEW_1080x1920.mp4` (1080×1920, 30 fps, 752 frames,
25.067 s, −14.0 LUFS, −1.4 dBTP). Same locked narration and narrator take as V1, same story; rebuilt pictures: a hook
that opens on organs already visible through the skin under a sweeping swab, a three-quarter view and a close view, the
intact whole mouse, a wipe back to the method (food-colouring bottle, dish, swab), a dive into the tissue where the
light bends, scatters and then straightens as the dye enters the water, a pull-out through the rinse, and a loop back
into the opening sweep. **Not published, not uploaded; not watched in real time.**

| | |
|---|---|
| Shot list | `production/V2_SHOTS_AND_TRANSITIONS.md` |
| QA | `production/QA_REPORT.md` (V2 section), `production/qa_v2/` |
| Mix | `audio/mix_v2/` (`tools/make_audio_v2.py`, cues in `audio/sfx_cues_v2.json`, beats in `audio/beats_v2.json` from `tools/export_beats_v2.ts`) |
| Source | `source/src/v2/` (composition `MouseSkinV2`) |
| Render | `cd source && npx remotion render src/index.ts MouseSkinV2 out.mp4 --props='{"audio":"mix_v2","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4` (run `python3 tools/make_audio_v2.py` first: `source/public/audio/*.wav` is not committed) |
| Sheets | `python3 tools/sheet_from_mp4.py <mp4> out.png "0,15,30,..."` |

## V1: first review version

**Status (28 Oct 2026):** the V1 review and native 2160×3840 master were rendered from source and checked from the
files (`production/QA_REPORT.md` lists what was measured and what remains). **Not published, not uploaded.**
**Nobody has watched it in real time with sound**: this session has no audio or video playback. The narration is the
channel narrator. Runway plates are **not** used (their hosts are blocked here; see `production/RUNWAY_NOTES.md`).

| Deliverable | File |
|---|---|
| Review: 1080×1920, 30 fps, 752 frames, 25.067 s, captions burned in | `exports/FGW_Transparent_Mouse_Skin_V1_REVIEW_1080x1920.mp4` |
| Master: 2160×3840 native (vectors rendered at 2×), 30 fps, 25.067 s, captions | `exports/FGW_Transparent_Mouse_Skin_V1_MASTER_2160x3840.mp4` |
| Clean (no captions): 1080×1920 | `exports/FGW_Transparent_Mouse_Skin_V1_CLEAN_NO_CAPTIONS_1080x1920.mp4` |
| Cover frames (from the film's artwork) | `cover/` |
| Locked script (72 words, verbatim) | `production/NARRATION_APPROVED.txt` |
| Narration (channel narrator, 48 kHz/24-bit, 25.067 s) | `audio/narration/FGW_Transparent_Mouse_Skin_narration_V1.wav` |
| Voice provenance, takes, independent transcripts | `audio/narration/voice_provenance.json`, `audio/narration/takes/` |
| Measured word timing (JSON) | `audio/narration/FGW_Transparent_Mouse_Skin_V1_timing.json` (= `words_V1.json`) |
| SRT | `captions/FGW_Transparent_Mouse_Skin_V1.srt` |
| Mix (−14 LUFS, −1.5 dBTP) and its measurements | `audio/mix/FGW_Transparent_Mouse_Skin_V1_mix.wav`, `audio/mix/mix_measure.json`, `audio/sfx_cues.json` |
| Shots and transition list | `production/SHOTS_AND_TRANSITIONS.md` |
| Science, boundaries, simplifications, cast | `production/SOURCE_NOTES.md` |
| Runway (unmet; replacement slots) | `production/RUNWAY_NOTES.md` |
| QA report and evidence | `production/QA_REPORT.md`, `qa/` |
| Description and pinned-comment drafts (not posted) | `upload/DESCRIPTION_DRAFT.md` |
| Editable source | `source/` (Remotion 4.0.533, React 19, TypeScript) |

## Source layout

| Path | What |
|---|---|
| `source/src/Film.tsx` | the film as a function of time: camera, scene states, operator, call-out |
| `source/src/beats.ts` | every beat, derived from the measured words (shared with the mix) |
| `source/src/art/Mouse.tsx` | the mouse: body, an anatomy layer (liver, intestine loops with peristalsis, bladder), a skin layer whose transmission is one parameter, surface texture, breathing shared by all |
| `source/src/art/Section.tsx` | the call-out section: Snell's-law ray tracing through water and lipid regions, with the dye raising the water's index |
| `source/src/art/Operator.tsx` | the Weird Crew guesser's gloved hand (crew Hand rig) with a swab or wash bottle, at true scale |
| `source/src/art/Bench.tsx` | the lab bench (stands in for the Runway plates) |
| `source/src/Captions.tsx` | channel captions, per-caption heights, and the EARLIER and TIME-LAPSE cues |
| `source/src/dc/` | the crew's shared drawing primitives (Hand rig, ink, shading), from Glass Climbing |
| `tools/` | narration (`make_narration.py`, `align.py`, `asr_whisper.py`), beats export, mix (`make_audio.py`), QA (`qa.py`, `motion_scan.py`, `check_script.py`) |

## Rebuild

```sh
cd Future_Got_Weird/transparent-mouse-skin
(cd source && npm ci)                                   # remotion.config.ts points at the preinstalled Chromium
pip install pocketsphinx soundfile numpy scipy pyloudnorm faster-whisper pillow
# narration (only if the take or caption chunks change): take -> final wav, word timing, timeline.json, SRT
python3 tools/make_narration.py
# beats -> mix (also writes source/public/audio/mix.wav)
source/node_modules/.bin/esbuild tools/export_beats.ts --bundle --platform=node --format=cjs --outfile=/tmp/eb.cjs && node /tmp/eb.cjs
python3 tools/make_audio.py
# exports
cd source
R="--image-format=png --gop=15 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4"
npx remotion render src/index.ts MouseSkin ../exports/FGW_Transparent_Mouse_Skin_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix","captions":true}' --crf=16 $R
npx remotion render src/index.ts MouseSkin ../exports/FGW_Transparent_Mouse_Skin_V1_MASTER_2160x3840.mp4 --scale=2 --props='{"audio":"mix","captions":true}' --crf=14 $R
npx remotion render src/index.ts MouseSkin ../exports/FGW_Transparent_Mouse_Skin_V1_CLEAN_NO_CAPTIONS_1080x1920.mp4 --props='{"audio":"mix","captions":false}' --crf=16 $R
# QA (the Whisper model directory: see tools/asr_whisper.py for where it came from)
cd .. && python3 tools/check_script.py && python3 tools/qa.py exports/FGW_Transparent_Mouse_Skin_V1_REVIEW_1080x1920.mp4 <whisper model dir> qa/review/review
python3 tools/motion_scan.py exports/FGW_Transparent_Mouse_Skin_V1_REVIEW_1080x1920.mp4 qa/review/motion_scan.json
```

Contact sheet: `cd source && ./sheet.sh out.png "f1,f2,...(12)" [true|false]`.

Media files are stored as plain git blobs. The episode `.gitattributes` turns LFS off, as in the other FGW
episodes. `source/public/audio/*.wav` and `audio/mix/stems/` are regenerated by `make_audio.py` and not committed.
