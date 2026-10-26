# Future Got Weird: Scientists Turned Dead Spiders Into Robots (Dead Spider)

## V1 (26 Oct 2026)

**Status.** The first review version is rendered from source and checked from the files. **It is not published.**
Nobody has watched it in real time or listened to it: this environment has no display or speakers.
`production/SOURCE_NOTES.md` lists what was checked and what remains.

**Format.** Vertical 1080×1920, 30 fps, 900 frames, **30.000 s**. Captions are burned in.

**Narration.** The locked script, verbatim, in the channel's ElevenLabs voice ("Test Voice", `eleven_v4`). It is one
take, used whole and unedited.

| Deliverable | File |
|---|---|
| Review: H.264 High (CRF 16) and AAC 320 kb/s | `exports/FGW_Dead_Spider_V1_REVIEW_1080x1920.mp4` |
| Master: 2160×3840, rendered natively at 2× from the vector source (not an upscale) | `exports/FGW_Dead_Spider_V1_MASTER_2160x3840.mp4` |
| Narration (48 kHz, 24-bit, mono, padded to 30.0 s), word timings | `audio/narration/FGW_Dead_Spider_narration_V1.wav`, `audio/narration/FGW_Dead_Spider_V1_words.json` |
| Takes, Scribe timings, ASR checks, voice record | `audio/narration/takes/`, `audio/narration/voice_provenance.json` |
| Aligned SRT | `captions/FGW_Dead_Spider_V1.srt` |
| Mix (48 kHz, 24-bit, stereo), measurements, effects list | `audio/mix/FGW_Dead_Spider_V1_mix.wav`, `audio/mix/mix_measure.json`, `audio/sfx_cues.json` |
| Locked narration | `production/NARRATION_APPROVED.txt` |
| Sources, science, provenance, shot map, transition list, QA, fixes, limitations | `production/SOURCE_NOTES.md` |
| QA evidence | `qa/`: file checks, ASR, caption check, contact pages, key frames, strips |
| Editable source | `source/` (Remotion 4.0.533, React 19, TypeScript; composition `DeadSpider`) |

## How it is built

**The world.** The experiment lives in one millimetre world (`source/src/three.ts`). Every shot is a perspective
camera into that world, so the same rig reads correctly from the macro top view, the side views and the low views.

**The spider.** `spider.ts` and `SpiderDraw.tsx`:
- two body sections, with eight 6-segment legs on the prosoma;
- one extension value per leg (0 curled, 1 open), so the legs share one pressure-driven motion;
- segment lengths never change;
- a contact solver stops each leg at first contact with the block, the weight, the second spider or the floor;
- items are depth-sorted, so near legs pass in front of the body and far legs behind it;
- drawn in the Weird Crew finish: one ink contour per part and gradients from the fixed upper-left light.

**State.** `world.ts` holds everything as pure functions of time: needle, glue, support heights, plunger, leg
extension and payloads. Every event is placed from the measured narration (`TM`). The shots sample it, so cuts never
disagree.

**Operator.** The Weird Crew lead on his existing rig (`source/src/dc/`, unchanged), in his lab outfit. He is placed as
a billboard in the world and his index finger is solved onto the plunger (`shots/Operator.tsx`).

**Shots.** `shots/A.tsx` (hook), `C.tsx` (living-spider cutaway), `D.tsx` (operator, block grip, release, lift),
`E.tsx` (load test), `F.tsx` (tray pickup). `Film.tsx` chooses the shot by time (`world.CUT`). `Captions.tsx` sets
each caption's position.

**Scenery.** Controlled vector layers. Runway plates could not be used: the network policy blocks Runway's output host.
See SOURCE_NOTES.

## Rebuild

    cd Future_Got_Weird/dead-spider
    python3 -m pip install numpy scipy soundfile pyloudnorm sherpa-onnx
    (cd source && npm ci)
    # narration: chosen take + Scribe timings -> master WAV, word timeline, captions (source/src/data/timeline.json), SRT
    python3 tools/make_narration.py
    # sound cues from the picture's state, then score/effects/mix (writes source/public/audio/mix.wav)
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec.cjs --external:remotion && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py
    # review and native 2x master
    (cd source && npx remotion render src/index.ts DeadSpider ../exports/FGW_Dead_Spider_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    (cd source && npx remotion render src/index.ts DeadSpider ../exports/FGW_Dead_Spider_V1_MASTER_2160x3840.mp4 --scale=2 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=3)
    # checks (ASR models: sherpa-onnx-zipformer-en-2023-06-26 and sherpa-onnx-whisper-base.en from the k2-fsa releases)
    python3 tools/qa.py exports/FGW_Dead_Spider_V1_REVIEW_1080x1920.mp4 <asr_model_root> qa/review
    source/node_modules/.bin/esbuild tools/cap_check.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --outfile=/tmp/cc.cjs --external:remotion --external:@fontsource-variable/* && NODE_PATH=source/node_modules node /tmp/cc.cjs qa/caption_check.json

**Working stills.**
- `cd source && ./sheet.sh out.png "f1,f2,..." [captions]` renders a contact sheet of film frames.
- The `FilmStill` composition renders one time (`--props='{"t":2.9,"captions":false}'`).
- `RigSheet` shows the spider rig at three extensions from three cameras.

Media is stored as plain git blobs: the episode's `.gitattributes` turns LFS off, as in the other FGW episodes.
`source/public/audio/*.wav` and `audio/mix/stems/` are regenerated and not committed.
