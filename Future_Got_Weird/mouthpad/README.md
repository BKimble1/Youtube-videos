# Future Got Weird: MouthPad (playing video games with your tongue)

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
