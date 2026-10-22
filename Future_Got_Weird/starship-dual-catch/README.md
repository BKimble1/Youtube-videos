# Future Got Weird: SpaceX Wants to Catch Its ENTIRE Rocket

**Status (22 Oct 2026): V1 1080p review cut. Not published. No 4K master rendered (waiting for review).**
Temporary local review voice (not the FGW ElevenLabs Test Voice). See `FGW_Starship_Dual_Catch_QA.md`.

| Deliverable | File |
|---|---|
| Review video (1920×1080, 30 fps, H.264 + AAC 320 kb/s) | `exports/FGW_Starship_Dual_Catch_V1_REVIEW_1080p.mp4` |
| Subtitles (from the measured narration) | `captions/FGW_Starship_Dual_Catch_V1.srt` |
| Thumbnail (1280×720) | `thumbnail/FGW_Starship_Dual_Catch_Thumbnail.png` (alternative: `thumbnail/concept_B_straight.png`) |
| Narration script with measured timestamps | `FGW_Starship_Dual_Catch_Script.md` |
| Sources, reference bible, hooks, titles, footage | `FGW_Starship_Dual_Catch_Sources.md` |
| QA report | `FGW_Starship_Dual_Catch_QA.md` |
| Editable source (Remotion) | `source/` — composition `Main` (film), `Thumb`, `Sheet` (model sheets) |

## Layout

- `script/segments.json` — the narration, one entry per line, with the pause after each line (the single source of truth).
- `source/src/assets/` — the reusable 2D hardware: `Starship.tsx` (V3 ship), `SuperHeavy.tsx` (V3 booster),
  `Tower.tsx` (tower, carriage, arms, QD arm, mount), `Plan.tsx` (top-down mechanism), `EngineMap.tsx`, `Flame.tsx`, `Env.tsx`.
- `source/src/kit/` — `Stage.tsx` (the side-view catch set used in most shots), timeline helpers, UI (labels, badges).
- `source/src/scenes/` — `Hook`, `Act1`…`Act6`, and `list.ts` (scene windows tied to the narration timeline).
- `tools/` — narration, subtitles, score/effects/mix, QA.

## Rebuild

    cd Future_Got_Weird/starship-dual-catch
    python3.13 -m pip install sherpa-onnx soundfile scipy numpy pyloudnorm
    # models (free, local): kokoro-en-v0_19 and sherpa-onnx-whisper-base.en from github.com/k2-fsa/sherpa-onnx releases, unpacked in /tmp/models
    python3.13 tools/make_narration.py          # audio/narration/*, source/src/data/timeline.json
    python3.13 tools/asr_segments.py            # qa/asr_segments.json
    python3.13 tools/make_audio.py              # score + effects + mix -> source/public/audio/mix_review.wav
    python3.13 tools/make_srt.py                # captions/FGW_Starship_Dual_Catch_V1.srt
    (cd source && npm ci)
    (cd source && npx remotion render src/index.ts Main ../exports/FGW_Starship_Dual_Catch_V1_REVIEW_1080p.mp4 --props='{"audio":"mix"}' --concurrency=4 --crf=17 --x264-preset=medium --audio-codec=aac --audio-bitrate=320k --color-space=bt709)
    (cd source && PROPS='{"variant":0}' COMP=Thumb SCALE=0.6667 NO_SHEET=1 node stills.mjs ../qa/thumb0 0)
    python3.13 tools/qa_video.py exports/FGW_Starship_Dual_Catch_V1_REVIEW_1080p.mp4
    python3 tools/strips.py exports/FGW_Starship_Dual_Catch_V1_REVIEW_1080p.mp4

Stills for inspection: `cd source && COMP=Main SCALE=0.5 node stills.mjs ../qa/<dir> t:<seconds> …`.
Changing a narration line re-times everything automatically (scenes read `timeline.json`); re-run narration → audio → srt → render.
