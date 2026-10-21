# Asset manifest and rights: Hidden Trigger V1 and V2

V2 adds only original material: the side-view lab and workstation, the high-angle bench view, the diagram flow and
the re-cued synthesised effects (`source/src/v2/*`, `tools/make_audio_v2.py`). Same narration file, fonts and score
generator as V1. No footage, stock, samples or paid generation.

Everything in the picture and sound was made in this project. No third-party footage, stills, stock, samples or
paid-generation outputs are used.

| Asset | Origin | Licence / basis | Notes |
|---|---|---|---|
| All artwork (robot rig, gripper, toy knife, toy apple, model hand, table, lab wall, planner diagram, cover) | Original SVG drawn in `source/src/components/*`, `Cover.tsx` | Channel's own work | Drawn from the brief's description, not traced from any image. Mobile base is generic. |
| Narration `audio/narration/narration_v1.wav` (SHA-256 `c99d6cb8…7b`) | Kokoro-82M v1.0, voice `af_heart`, via `kokoro-onnx` 0.6.1, generated locally | Kokoro model + voices: Apache-2.0 (hexgrad/Kokoro-82M); `kokoro-onnx`: MIT | **Temporary review voice.** The licence statements come from the project's published licensing, which I know but could not re-open here (Hugging Face is blocked from this sandbox). Re-check before any use beyond review. Model files: `kokoro-v1.0.onnx` SHA-256 `7d5df8ec…a6c5`, `voices-v1.0.bin` `bca610b8…f7d` (GitHub release `model-files-v1.0` of thewh1teagle/kokoro-onnx). |
| Score (drone, pulse, upper pad) | Synthesised in `tools/make_audio.py` | Original | Loop-continuous by construction. |
| Effects (speed-driven servo, click, tap, latch, digital ticks, swish) | Synthesised in `tools/make_audio.py` | Original | Cue times in `audio/sfx_cues_v1.json`. |
| Fonts: Nunito, Fredoka, JetBrains Mono | `@fontsource` npm packages | SIL OFL 1.1 | Same families as earlier FGW episodes. |
| QA-only: Whisper base.en (sherpa-onnx export) | GitHub release `asr-models` of k2-fsa/sherpa-onnx | Whisper weights MIT; sherpa-onnx Apache-2.0 | Used only to check timing and wording; not in the output. |

## Source footage: not used

| Asset | Status |
|---|---|
| MuTRAP real-robot malicious demo (`Robotroj_Malicous.mp4`) | **Not used.** No explicit licence or permission found: the `mutrap/MuTRAP` repository has no LICENSE file (404 on `LICENSE`, `LICENSE.md`), and the page text has no media-reuse statement. The arXiv distribution licence does not cover these video files. |
| MuTRAP benign demo, simulation demos | Not used (same basis). |
| Binghamton University YouTube video | Not used. No permission established. |

Because no clip is used, there are no in/out points, speed changes or on-screen footage credits. The 16–18 s slot
uses the animated controller/arm shot instead.

## Paid services

- ElevenLabs: one read-only voice listing (no generation, no credits). Voice `kk5XaSLo2XAw0sKM98zU` recorded.
- Runway: not called.
- No purchases, subscriptions, uploads or publishing.
