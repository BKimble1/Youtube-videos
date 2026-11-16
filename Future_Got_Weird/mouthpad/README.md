# Future Got Weird: MouthPad (playing video games with your tongue)

## V3 (current review render)

Not published, and not watched or heard in real time.

**Review file:** `exports/FGW_MOUTHPAD_V3_REVIEW_1080x1920.mp4`. The MP4 is Git-ignored; checksummed parts are in `backup/`.

| Property | Value |
|---|---|
| Runtime | 31.90 s (957 frames at 30 fps) |
| Verified (ffprobe) | H.264 High, 1080 × 1920, SAR 1:1, 9:16, 30 fps; AAC 48 kHz stereo; −14.0 LUFS; SHA-256 `443a10c2…afac2` |
| Narration | Locked script, unchanged; the V2 narration master, unchanged |
| Captions | Burned in, the channel treatment (Nunito Black, white, dark stroke, key words in yellow capitals), 26 phrases timed from the measured words; SRT in `captions/FGW_MouthPad_V3.srt` |
| Ending | The orange robot (Zip) wins; the winner keeps his hands behind his head and his mouth shut; cuts back to frame 0 |

| Item | File |
|---|---|
| Report: changes from V2, inspection, QA, remaining issues | `production/V3_REPORT.md` |
| Source | `source/src/v3/` (composition `MouthPadV3`); captions `source/src/v3/captions3.tsx`, `source/src/data/captions_v3.json` |
| Mix and measurements | `audio/mix/FGW_MouthPad_MIX_V3.wav`, `audio/mix/mix_measure_mix_v3.json`, `audio/sfx_log_mix_v3.json` |
| QA | `qa/v3/`, `qa/v3_caption_spans.txt` |

Rebuild V3 (the narration is the V2 master):

    python3 tools/make_captions_v3.py
    (cd source && ./node_modules/.bin/esbuild ../tools/export_cues_v3.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --jsx=automatic --external:remotion --outfile=/tmp/ec3.cjs) && NODE_PATH=source/node_modules node /tmp/ec3.cjs audio/cues_v3.json
    (cd source && ./node_modules/.bin/esbuild ../tools/caption_spans_v3.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --jsx=automatic --external:remotion --outfile=/tmp/cs3.cjs) && NODE_PATH=source/node_modules node /tmp/cs3.cjs qa/v3_caption_spans.json
    python3 tools/qa_captions_v3.py
    python3 tools/make_audio_v3.py mix_v3
    COMP=MouthPadV3 tools/render.sh mix_v3 exports/FGW_MOUTHPAD_V3_REVIEW_1080x1920.mp4
    QA_CUES=audio/cues_v3.json QA_WORDS=audio/narration/v2_words.json python3 tools/qa_render.py exports/FGW_MOUTHPAD_V3_REVIEW_1080x1920.mp4 v3

## V2 (previous review render)

Not published, and not watched or heard in real time.

**Review file:** `exports/FGW_MOUTHPAD_V2_REVIEW_1080x1920.mp4`. The MP4 is Git-ignored; checksummed parts are in `backup/`.

| Property | Value |
|---|---|
| Runtime | 31.90 s (957 frames at 30 fps) |
| Verified (ffprobe) | H.264 High, 1080 × 1920, SAR 1:1, 9:16, 30 fps; AAC 48 kHz stereo |
| Loudness | −14.0 LUFS integrated, −2.2 dBTP |
| Narration | Locked script, unchanged. Re-voiced (Test Voice, `eleven_v4`) for stronger AIM / CLICK / SHUT; gaps tightened to 199.9 wpm |
| Ending | Pushes back into the screen: the last frame is frame 0 |

| Item | File |
|---|---|
| Report: changes from V1, inspected continuity, QA, weaknesses | `production/V2_REPORT.md` |
| Source | `source/src/v2/` (composition `MouthPadV2`) |
| Narration master / word times / provenance | `audio/narration/FGW_MouthPad_narration_V2.wav`, `audio/narration/v2_words.json`, `audio/narration/voice_provenance_v2.json` |
| Mix and measurements | `audio/mix/FGW_MouthPad_MIX_V2.wav`, `audio/mix/mix_measure_mix_v2.json`, `audio/sfx_log_mix_v2.json` |
| QA | `qa/v2/` |

Rebuild V2:

    python3 tools/make_narration_v2.py
    (cd source && ./node_modules/.bin/esbuild ../tools/export_cues_v2.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --jsx=automatic --external:remotion --outfile=/tmp/ec2.cjs) && NODE_PATH=source/node_modules node /tmp/ec2.cjs audio/cues_v2.json
    python3 tools/make_audio_v2.py mix_v2
    COMP=MouthPadV2 tools/render.sh mix_v2 exports/FGW_MOUTHPAD_V2_REVIEW_1080x1920.mp4
    QA_CUES=audio/cues_v2.json QA_WORDS=audio/narration/v2_words.json python3 tools/qa_render.py exports/FGW_MOUTHPAD_V2_REVIEW_1080x1920.mp4 v2

V1's source is as committed at a210a6c. V2 changed shared files (timeline.json, the jaw model, the mouth and the room), so the V1 composition no longer renders identically from the current tree.

## V1 (first complete review render)

Not published, and not watched or heard in real time.

**Review file:** `exports/FGW_MOUTHPAD_V1_REVIEW_1080x1920.mp4`. The MP4 is Git-ignored; checksummed 20 MB parts are
in `backup/` (restore command in the report).

| Property | Value |
|---|---|
| Runtime | 32.00 s (960 frames at 30 fps), 1080×1920 |
| Loudness | −14.2 LUFS integrated, −1.6 dBTP true peak |
| Narration | Locked script, unchanged; Test Voice, `eleven_v4`, take 2 used sample for sample |
| Ending | Loops back into frame 0 |

| Item | File |
|---|---|
| Report: scenes, transitions, QA, claims to verify, issues | `production/V1_REPORT.md` |
| Locked narration | `production/NARRATION_LOCKED.txt` |
| Sources and claim ledger | `production/SOURCE_NOTES.md` |
| Voice provenance | `audio/narration/voice_provenance.json` |
| Narration master / word times | `audio/narration/FGW_MouthPad_narration_V1.wav`, `audio/narration/t2_words.json` |
| Mix and measurements | `audio/mix/FGW_MouthPad_MIX_V1.wav`, `audio/mix/mix_measure_mix_v1.json`, `audio/sfx_log_mix_v1.json` |
| QA (measurements, ASR, cut bursts, loop seam, phone sheet) | `qa/v1/` |

## Source (Remotion 4.0.533, composition `MouthPadV1`)

| File | What it is |
|---|---|
| `source/src/crew.tsx` | The approved Weird Crew cast rig (crew3, unchanged design) plus two additions: capped ink in close-ups and a `mouthNode` slot |
| `source/src/art/jaw3d.tsx` | One 3D model (mm) of the upper arch and the MouthPad, projected for every view |
| `source/src/art/mouth.tsx` | The open mouth: lips, cavity, the model from below, lower teeth, tongue |
| `source/src/art/room.tsx` | The gaming room world, poses |
| `source/src/art/game.tsx`, `source/src/gameplay.ts` | The original game and its script, keyed to word times |
| `source/src/scenes/*.tsx` | Room shots, product turn, side cut-away, split screen, assistive montage |
| `source/src/story.ts` | Word times and the shot timings (`FIRE`) |
| `source/src/Film.tsx` | The shot table |

## Rebuild

    (cd source && npm ci)
    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx
    # ASR models (k2-fsa sherpa-onnx releases, asr-models): sherpa-onnx-zipformer-en-2023-06-26, sherpa-onnx-whisper-base.en → /tmp/asr
    python3 tools/make_narration.py
    (cd source && ./node_modules/.bin/esbuild ../tools/export_cues.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --jsx=automatic --external:remotion --outfile=/tmp/ec.cjs) && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py mix_v1
    tools/render.sh mix_v1 exports/FGW_MOUTHPAD_V1_REVIEW_1080x1920.mp4
    python3 tools/qa_render.py exports/FGW_MOUTHPAD_V1_REVIEW_1080x1920.mp4 v1

Contact sheets at given times: `tools/sheet_times.sh <out.png> "0,1.5,3" [cols]`.
