# Future Got Weird: A Hidden Trigger Made This Robot Target a Fake Hand

V1 and V2 are kept as they were (below). The current cut is V3.

## V3 (story, visual rebuild, ElevenLabs Test Voice) — current review cut

**Status (21 Oct 2026): V3 review cut delivered; waiting for owner review.** Nothing published; no master rendered.

| Deliverable | File |
|---|---|
| Review MP4 (1080×1920 native, 30 fps, H.264 High + AAC 320 kb/s, 25.6 s) | `exports/FGW_Hidden_Trigger_V3_Review_1080x1920.mp4` (SHA-256 `642fefb4…ab63`) |
| Narration: ElevenLabs Test Voice (`kk5XaSLo2XAw0sKM98zU`), `eleven_v4`, take 7 | `audio/narration/narration_v3_testvoice.wav` (+ all takes in `audio/v3/`) |
| Voice ID, model, settings, prompts, generation IDs, selection reasons | `audio/narration/voice_v3_provenance.json` |
| Word timings and caption chunks (measured from the take) | `audio/narration/phrases_v3.json` |
| Captions (16 cues) | `captions/FGW_Hidden_Trigger_V3.srt` |
| Clean script | `production/V3_SCRIPT.txt` |
| Change and QA log (shot list with timestamps, checks, open items) | `production/V3_CHANGE_QA_LOG.md` |
| Editable source | `source/src/v3/` (composition `HiddenTriggerV3`; still `V3ArtTest` for art checks) |
| QA data | `qa/qa_v3_results.json`, `qa/asr_mp4_v3.json`, `qa/motion_summary_v3.json`, `audio/mix/mix_v3_measure.json`, images in `qa/v3/` |

Not done in this environment: real-time playback and listening (no audio or video output), and re-opening the two
source pages (the egress proxy refused both hosts). See the log.

### Rebuild V3

    cd Future_Got_Weird/hidden-trigger-robot-target
    python3 -m pip install soundfile scipy numpy pyloudnorm sherpa-onnx
    (cd source && npm ci)
    # narration is committed (audio/narration/narration_v3_testvoice.wav); regenerating it needs the ElevenLabs
    # connection and the prompt in voice_v3_provenance.json, then re-deriving phrases_v3.json word timings
    cp audio/narration/phrases_v3.json source/src/data/phrases_v3.json
    source/node_modules/.bin/esbuild tools/export_motion_v3.ts --bundle --platform=node --format=esm --jsx=automatic --outfile=/tmp/em3.mjs && node /tmp/em3.mjs
    python3 tools/make_audio_v3.py                          # -> source/public/audio/mix_v3.wav (+ narration copy)
    python3 tools/make_srt_v3.py                            # -> captions/FGW_Hidden_Trigger_V3.srt, production/V3_SCRIPT.txt
    (cd source && npx remotion render src/index.ts HiddenTriggerV3 ../exports/FGW_Hidden_Trigger_V3_Review_1080x1920.mp4 --props='{"audio":"mix"}' --crf=16 --x264-preset=slow --color-space=bt709 --audio-bitrate=320k --concurrency=4)
    python3 tools/qa_review_v3.py && python3 tools/phone_check_v3.py
    python3 tools/asr_mp4_v3.py /tmp/asr/sherpa-onnx-whisper-base.en   # model: see the V1 rebuild steps

## V2 (pass two: faster, more varied picture; same voice, script, captions and runtime) — superseded by V3

| Deliverable | File |
|---|---|
| Review MP4 (1080×1920 native, 30 fps, H.264 High + AAC 320 kb/s, 25.6 s) | `exports/FGW_Hidden_Trigger_V2_Review_1080x1920.mp4` (SHA-256 `038de823…eea3`) |
| Captions (20 cues; timing unchanged, identical to V1) | `captions/FGW_Hidden_Trigger_V2.srt` |
| Change and QA log (shot list with timestamps, checks, open items) | `production/V2_CHANGE_QA_LOG.md` |
| Editable source | `source/src/v2/` (composition `HiddenTriggerV2`); V1 still renders as `HiddenTriggerV1` |
| QA data | `qa/qa_v2_results.json`, `qa/asr_mp4_v2.json`, `qa/motion_summary_v2.json`, `audio/mix/mix_v2_measure.json`, images in `qa/v2/` |

18 compositions in four settings: bench side view, bench high angle, workstation, and an explanatory diagram the
camera travels along (request → AI planner → plan target → steps → controller). See the log for the shot list.

### Rebuild V2

    cd Future_Got_Weird/hidden-trigger-robot-target
    python3 -m pip install soundfile scipy numpy pyloudnorm sherpa-onnx
    (cd source && npm ci)
    source/node_modules/.bin/esbuild tools/export_motion_v2.ts --bundle --platform=node --format=esm --outfile=/tmp/export_motion_v2.mjs && node /tmp/export_motion_v2.mjs
    python3 tools/make_audio_v2.py                          # same score generator; effects re-cued -> source/public/audio/mix_v2.wav
    (cd source && npx remotion render src/index.ts HiddenTriggerV2 ../exports/FGW_Hidden_Trigger_V2_Review_1080x1920.mp4 --props='{"audio":"mix"}' --crf=16 --x264-preset=slow --color-space=bt709 --audio-bitrate=320k --concurrency=4)
    python3 tools/qa_review_v2.py && python3 tools/phone_check_v2.py
    python3 tools/asr_mp4_v2.py /tmp/asr/sherpa-onnx-whisper-base.en   # model: see the V1 rebuild steps

Stills for inspection: `(cd source && COMP=HiddenTriggerV2 node stills.mjs /tmp/stills t:14.2 t:23.9)`.
The captions do not need regenerating: the narration and phrase timings are unchanged. If the final ElevenLabs voice
replaces the temporary one, re-run the V1 voice steps (`refine_bounds.py`, `make_srt.py`), then the V2 steps above;
all V2 cue times are read from the phrase file.

---

# V1 review cut (kept for reference)

| Deliverable | File |
|---|---|
| Review MP4 (1080×1920, 30 fps, H.264 High + AAC 320 kb/s, 25.6 s) | `exports/FGW_Hidden_Trigger_V1_Review_1080x1920.mp4` (SHA-256 `8cd7a6c8…5084`) |
| Captions (20 cues) | `captions/FGW_Hidden_Trigger_V1.srt` |
| Cover (1080×1920 PNG) | `cover/FGW_Hidden_Trigger_Cover_1080x1920.png` |
| Description draft (not published) | `upload/DESCRIPTION_DRAFT.md` |
| Asset manifest, licences, rights | `production/ASSET_MANIFEST.md` |
| Editable source | `source/` (Remotion 4.0.533; compositions `HiddenTriggerV1`, `HiddenTriggerCover`) |
| QA data | `qa/qa_v1_results.json`, `qa/asr_mp4_v1.json`, `qa/asr_check_v1.json`, `qa/motion_summary_v1.json`, `audio/mix/mix_v1_measure.json`, images in `qa/v1/` |

## What it is

A 25.6-second vertical loop. Frame 0: a robot gripper carries a blunt toy knife toward an orange model hand while the toy
apple sits untouched on the left. "Toy knife. Model hand. Real robot." reveals the props by 2.2–4.9 s. The planner
diagram shows the amber **planted region before any request arrives** (6.5 s, "TAMPERED FIRST"). The two comparisons
use the same tampered planner: without the trigger the plan ends in an apple and the arm mimes one shallow stroke
above the apple; with the generic amber marker only the final target icon changes to the hand, the plan goes to the
controller, and only then does the arm move. The close returns to the planted region, and the request strip opens
into the opening shot, so "…before anyone said" runs into "Cut the apple" on replay.

All picture is original vector animation. No source footage is used (see Rights).

## Measured timing

- Video: 768 frames = **25.600 s**. Narration: 0.000–25.372 s (starts on frame 0); 0.228 s breath before the loop.
- Narration: 65 words, **174.4 wpm articulated** (153.7 wpm over the whole narration including pauses).
- Phrase timings (s) from `audio/narration/phrases_v1.json` (measured; inner phrase boundaries refined with Whisper):

| Start | End | Phrase | | Start | End | Phrase |
|---|---|---|---|---|---|---|
| 0.000 | 0.815 | Cut the apple. | | 13.710 | 15.471 | and the plan changed targets. |
| 0.935 | 1.929 | So why aim here? | | 15.811 | 17.189 | The planner chose the steps. |
| 2.229 | 2.967 | Toy knife. | | 17.329 | 18.795 | The controller moved the arm. |
| 2.967 | 3.890 | Model hand. | | 19.155 | 19.993 | Same machine. |
| 3.890 | 4.897 | Real robot. | | 20.133 | 21.284 | Different instructions. |
| 5.237 | 6.515 | Binghamton researchers | | 21.684 | 22.803 | The unnerving part? |
| 6.515 | 7.942 | had deliberately tampered | | 22.973 | 24.343 | That behavior was planted |
| 7.942 | 9.205 | with its AI planner. | | 24.343 | 25.372 | before anyone said… |
| 9.545 | 10.506 | Without a trigger, | | | | |
| 10.506 | 11.934 | it mimed cutting the apple. | | | | |
| 12.294 | 12.916 | Add the trigger | | | | |
| 12.916 | 13.710 | to the request, | | | | |

Cuts/transitions (s): macro 2.229 · pull-back 3.890 · split to diagram 5.087 · "without trigger" 9.295 · "with trigger"
12.094 · clean tabletop 18.845 · into planner 21.484 · strip wipe 24.000 → loop.

## Voice: temporary

**The narration is a temporary free local review voice, not the FGW ElevenLabs voice.** ElevenLabs speech generation
spends account credits, and no zero-credit route was available, so it was not called. The existing preset was inspected
read-only: voice `kk5XaSLo2XAw0sKM98zU` ("Test Voice", generated, English; previous FGW episodes used model
`eleven_v4`). No credentials were read or written. Runway was not used.

- Engine: Kokoro-82M v1.0 via `kokoro-onnx` 0.6.1, voice `af_heart`, speed 1.0, en-us. Model weights Apache-2.0
  (see the manifest for the caveat about how this was confirmed).
- Each script line was synthesised whole; pauses come from the delivery map (0.10–0.40 s).
- The Death Clock reference audio was not found in the repository, so pacing was **not** matched to it.
- Delivery-map items a TTS cannot be directed on (pitch drop on "here", dry surprise on "real", quieter "Same
  machine") were **not** controlled; the stress you hear is the engine's.
- For the final: regenerate the same 65 words with the FGW voice, then re-run `tools/refine_bounds.py`, `make_srt.py`,
  `export_motion` and `make_audio.py` (timing is data-driven; the animation cues read the phrase file).

## QA performed (V1, final review render)

Automated / measured on the **rendered MP4**:
- ffprobe: 1080×1920, 30/1 fps, 768 frames, 25.600 s, yuv420p, BT.709 tags, H.264 High, AAC 48 kHz stereo 317 kb/s.
- Loudness (ffmpeg ebur128 on the decoded AAC): **−15.0 LUFS integrated, −1.5 dBTP true peak**, LRA 1.3 LU; no samples
  at 0 dBFS; no silent 100 ms window.
- blackdetect: no black segments. freezedetect: no frozen segment ≥ 1.5 s.
- Sync: the voice in the MP4 cross-correlates to the narration file at 0.000 s offset. Each of the 20 SRT cue windows,
  cut from the MP4's mixed track and transcribed with local Whisper base.en, returns its caption's words (20/20).
- Script check: the SRT text joined equals the locked 65-word script; no overlapping cues.
- Rig (from the same kinematics code, every frame): link-length error 0; elbow branch never flips (θ1 165–199°);
  max reach 85 %; minimum blade clearance 33 px over the apple's stem, 31 px over the model hand; no joint step
  > 3.1°/frame outside the three intentional cuts; peak gripper speed 660 px/s. Loop seam: last→first frame gripper
  step 4.4 px at 131 px/s vs 134 px/s on the next step (same velocity).
- Audio masking, simulated small speaker (400 Hz–5 kHz band): voice 28 dB over music during speech; worst 250 ms
  window 9.9 dB (the digital tick at 14.0 s). Full band: voice 16.7 dB over music, 22.7 dB over effects.

Viewed by me (still images of the actual render, not real-time playback):
- A 2 fps contact sheet of the whole cut; ±4-frame strips at all eight transitions and across the loop seam;
  full-resolution frames at 1.9, 11.2, 13.45, 14.5, 22.6 s; 16 frames and the cover at phone size (360×640) under an
  approximate Shorts UI mask (`qa/v1/phone_ui_sheet.png`, `phone_cover.png`).
- Defects found and fixed this way: scene too small; diagram text too small; caption orphan words; the planner
  close-up overflowing the frame; the previous caption lingering across the "with trigger" cut; compare strips ghosting
  over the planner close-up; diagram/strip elements under the right-side Shorts controls; effects (click, tap, servo,
  swish) masking words; music bed inaudible in the phone band.

**Not performed:** nobody has watched it in real time or **listened** to it. This environment has no audio playback, so
the voice quality, effect character and music feel are unverified by ear; the ASR and level checks are proxies.
Headphone/small-speaker listening is still needed.

## Unresolved / for the reviewer

1. Temporary voice (above). Expect the final voice to shift every cue a little; the pipeline re-times from data.
2. The source pages (Binghamton report, arXiv full text, PROTEA) were **unreachable from this sandbox**; claims follow
   the brief's verified source pack. The MuTRAP project page was read via its GitHub source: it confirms the two real-robot
   demos (malicious plan with the trigger word, benign plan without it, both from the attacked model) and the separate
   simulation demos.
3. The 5–18.8 s middle is a split view (scene above, diagram below) for ~13 s; it changes every 1–3 s inside the panel,
   but the framing is stable. Judge whether it feels static.
4. Arm geometry is a simplified planar UR-style silhouette (J1, J5, J6 fixed); it is not a reconstruction of the UR5e
   trajectory, and the mobile base is generic (not a Segway likeness).
5. The planner close-up and strip wipe are a symbolic diagram; the "TRIGGER" chip uses a generic diamond, no exploit text.
6. Cover: best selectable in-video frame is ≈ 1.75 s (frame 52–53); the PNG uses the same pose at 1.75 s.

## Rights

No reuse permission is established for the MuTRAP videos; the project repository has no licence file and the page has no
media-reuse statement. The 16–18 s footage inset was therefore **not used**. Everything on screen is original.
Details: `production/ASSET_MANIFEST.md`.

## Rebuild the review

    cd Future_Got_Weird/hidden-trigger-robot-target
    python3 -m pip install kokoro-onnx soundfile scipy numpy pyloudnorm sherpa-onnx
    mkdir -p /tmp/tts /tmp/asr
    curl -L -o /tmp/tts/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
    curl -L -o /tmp/tts/voices-v1.0.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
    curl -L https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-base.en.tar.bz2 | tar xj -C /tmp/asr
    (cd source && npm ci)
    python3 tools/make_narration.py --model /tmp/tts        # -> audio/narration/narration_v1.wav + phrases_v1.json
    python3 tools/refine_bounds.py                          # Whisper-checked inner phrase boundaries
    python3 tools/asr_check.py                              # transcript check of the narration
    cp audio/narration/phrases_v1.json source/src/data/
    source/node_modules/.bin/esbuild tools/export_motion.ts --bundle --platform=node --format=esm --outfile=/tmp/export_motion.mjs && node /tmp/export_motion.mjs
    python3 tools/make_audio.py                             # score + effects + mix -> source/public/audio/mix_v1.wav
    python3 tools/make_srt.py                               # -> captions/FGW_Hidden_Trigger_V1.srt
    (cd source && npx remotion render src/index.ts HiddenTriggerV1 ../exports/FGW_Hidden_Trigger_V1_Review_1080x1920.mp4 --props='{"audio":"mix"}' --crf=16 --x264-preset=slow --color-space=bt709 --audio-bitrate=320k --concurrency=4)
    (cd source && npx remotion still src/index.ts HiddenTriggerCover ../cover/FGW_Hidden_Trigger_Cover_1080x1920.png --image-format=png)
    python3 tools/qa_review.py && python3 tools/asr_mp4.py && python3 tools/phone_check.py

(The narration WAV is committed, so the steps before `export_motion` are only needed to regenerate the voice. Kokoro
output may differ slightly between onnxruntime builds; compare against the committed WAV's checksum in the manifest.)

## Master, only after approval of this cut

Same timing, narration and mix; vectors render natively at 2× (no upscale), then the same audio is muxed in:

    (cd source && npx remotion render src/index.ts HiddenTriggerV1 /tmp/ht_4k_video.mp4 --props='{"audio":false}' --scale=2 --crf=16 --x264-preset=slow --color-space=bt709)
    ffmpeg -i /tmp/ht_4k_video.mp4 -i source/public/audio/mix_v1.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/FGW_Hidden_Trigger_Master_2160x3840.mp4
    python3 tools/qa_review.py exports/FGW_Hidden_Trigger_Master_2160x3840.mp4 qa/master && python3 tools/asr_mp4.py   # revalidate; the SRT is unchanged unless timing changes

If the final voice replaces the temporary one, the master follows a new review cut instead.
