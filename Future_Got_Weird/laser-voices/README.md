# Future Got Weird: This Laser Makes You Hear Voices

## V6 (final production pass: character rigs, purposeful transitions, visual storytelling)

**Status (24 Oct 2026):**
- The narration, words, captions and V5 mix construction are unchanged; the effects are re-timed to the V6 picture.
- **Characters:** a new V6 rig (`source/src/v6/rig/`):
  - the guesser is clean-shaven (the V5 "beard" was hair drawn on the jaw);
  - tapered arms with elbows and wrists, sleeves, and drawn hands in seven shapes (relaxed, grip, open, fist, cup,
    point, mitt);
  - a real cup grip;
  - a weight shift in the walk.
- **Re-acted:** the hook, the lab and the interruption.
- **Rebuilt:** the molecular stages A–D with the empty ear canal, the transmitter cutaway (laser, lens, fold mirror,
  galvanometer scanning mirror), a sweep explanation inside the real lab, and a three-setup ending (side-on,
  interception, reaction).
- **Not published.** Nobody has watched or listened in real time. The plan is in `production/V6_SHOT_PLAN.md`; the
  measurements and known issues are in `production/V6_QA_REPORT.md`.

| Deliverable | File |
|---|---|
| Final review: 1080×1920, 30 fps, 1022 frames, burned-in captions, V6 mix (AAC 48 kHz) | `exports/FGW_Laser_Voices_V6_FINAL_REVIEW_1080x1920.mp4` |
| Captions (identical to V1) | `captions/FGW_Laser_Voices_V6.srt` |
| Mix, cues, measurements | `audio/mix/FGW_Laser_Voices_V6_mix.wav`, `audio/cues_v6.json`, `audio/mix/mix_measure_v6.json` |
| QA evidence | `qa/v6/`: block and seam check, foot-slide check, motion scan, loop metric, mux check, ffprobe, ASR, contact sheets, full-resolution hand crops |

**V6 rebuild:**

    cd Future_Got_Weird/laser-voices
    (cd source && npm ci)
    B="source/node_modules/.bin/esbuild --bundle --platform=node --format=esm --loader:.css=empty --log-level=warning"
    # 1. his resting ear and the visitor's timing (prints EAR0 / FA / FB for stage6.ts), then the block and seam check
    $B tools/solve_v6.ts --outfile=/tmp/sv6.mjs && node /tmp/sv6.mjs
    $B tools/check_v6.ts --outfile=/tmp/cv6.mjs && node /tmp/cv6.mjs > qa/v6/check_v6.json
    $B tools/footslide_v6.ts --outfile=/tmp/fs6.mjs && node /tmp/fs6.mjs > qa/v6/footslide.json
    # 2. cues, then the mix
    $B tools/export_cues_v6.ts --outfile=/tmp/ec6.mjs && node /tmp/ec6.mjs audio/cues_v6.json
    python3 tools/make_audio_v6.py
    # 3. picture only, then mux and verify
    (cd source && npx remotion render src/index.ts LaserVoicesV6 /tmp/v6_1080_silent.mp4 --muted --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --concurrency=4)
    python3 tools/mux_v3.py /tmp/v6_1080_silent.mp4 audio/mix/FGW_Laser_Voices_V6_mix.wav exports/FGW_Laser_Voices_V6_FINAL_REVIEW_1080x1920.mp4 qa/v6/mux_review.json

## V5 (director's rebuild: intentional motion, clear storytelling, better animation)

**Status (24 Oct 2026):**
- The narration, words, timing and captions are unchanged.
- Rebuilt shot by shot:
  - 13 mostly locked shots joined by clean cuts and match cuts;
  - three deliberate camera moves;
  - one screen geography (transmitter right, listener left);
  - a staged molecular sequence with distinct stages A–D;
  - a galvanometer-mirror cutaway, a sweep-timing plan view and a single 8 FT lab composition;
  - one continuous interruption shot with a visitor who walks into the beam and out again;
  - a loop carried by the recurring startle.
- **Not final. Not published.** Nobody has watched or listened in real time. The plan is in
  `production/V5_SHOT_PLAN.md`; the measurements and known issues are in `production/V5_QA_REPORT.md`.

| Deliverable | File |
|---|---|
| Review: 1080×1920, 30 fps, 1022 frames, burned-in captions, V5 mix (AAC 48 kHz) | `exports/FGW_Laser_Voices_V5_REVIEW_1080x1920.mp4` |
| Captions (identical to V1) | `captions/FGW_Laser_Voices_V5.srt` |
| Mix, cues, measurements | `audio/mix/FGW_Laser_Voices_V5_mix.wav`, `audio/cues_v5.json`, `audio/mix/mix_measure_v5.json` |
| QA evidence | `qa/v5/` (block and seam check, motion scan, loop metric, mux check, ASR, contact sheets, block crops) |

**V5 rebuild:**

    cd Future_Got_Weird/laser-voices
    (cd source && npm ci)
    B="source/node_modules/.bin/esbuild --bundle --platform=node --format=esm --loader:.css=empty --log-level=warning"
    # 1. his resting ear and the visitor's timing (prints EAR0 / FA / FB for stage5.ts), then the block and seam check
    $B tools/solve_v5.ts --outfile=/tmp/sv5.mjs && node /tmp/sv5.mjs
    $B tools/check_v5.ts --outfile=/tmp/cv5.mjs && node /tmp/cv5.mjs > qa/v5/check_v5.json
    # 2. cues, then the mix (locked narration + V1 music + whisper, ambiences, effects)
    $B tools/export_cues_v5.ts --outfile=/tmp/ec5.mjs && node /tmp/ec5.mjs audio/cues_v5.json
    python3 tools/make_audio_v5.py
    # 3. picture only, then mux and verify
    (cd source && npx remotion render src/index.ts LaserVoicesV5 /tmp/v5_1080_silent.mp4 --muted --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --concurrency=4)
    python3 tools/mux_v3.py /tmp/v5_1080_silent.mp4 audio/mix/FGW_Laser_Voices_V5_mix.wav exports/FGW_Laser_Voices_V5_REVIEW_1080x1920.mp4 qa/v5/mux_review.json

## V4 (major rebuild: hook, pacing, explanation, animation)

**Status (24 Oct 2026):**
- The narration, words, timing, captions and story order are unchanged.
- Rebuilt:
  - the picture: five worlds (atrium, ear section, molecular air, optics, lab), the channel cast on a new 3D-joint
    rig, new staging, cameras and transitions, and an exact loop;
  - the sound: a breathy nonverbal whisper, new ambiences and effects (the V1 music is kept).
- **Not final. Not published.** Nobody has watched or listened in real time. The story beats, measurements,
  retention review and known issues are in `production/V4_QA_REPORT.md`.

| Deliverable | File |
|---|---|
| Review: 1080×1920, 30 fps, 1022 frames, burned-in captions, V4 mix (AAC 48 kHz) | `exports/FGW_Laser_Voices_V4_REVIEW_1080x1920.mp4` |
| Captions (identical to V1) | `captions/FGW_Laser_Voices_V4.srt` |
| Mix, cues, measurements | `audio/mix/FGW_Laser_Voices_V4_mix.wav`, `audio/cues_v4.json`, `audio/mix/mix_measure_v4.json` |
| QA evidence | `qa/v4/` (block/seam check, motion scan, loop metrics, mux check, ASR, contact sheets) |

**V4 rebuild:**

    cd Future_Got_Weird/laser-voices
    (cd source && npm ci)
    B="source/node_modules/.bin/esbuild --bundle --platform=node --format=esm --loader:.css=empty --log-level=warning"
    # 1. the friend's timing (prints FA/FB for story4.ts) and the block/seam check
    $B tools/solve_v4.ts --outfile=/tmp/sv4.mjs && node /tmp/sv4.mjs
    $B tools/check_v4.ts --outfile=/tmp/cv4.mjs && node /tmp/cv4.mjs > qa/v4/check_v4.json
    # 2. the picture's cues, then the mix (locked narration + V1 music + new whisper, ambiences and effects)
    $B tools/export_cues_v4.ts --outfile=/tmp/ec4.mjs && node /tmp/ec4.mjs audio/cues_v4.json
    python3 tools/make_audio_v4.py
    # 3. picture only, then mux the mix and verify
    (cd source && npx remotion render src/index.ts LaserVoicesV4 /tmp/v4_1080_silent.mp4 --muted --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --concurrency=4)
    python3 tools/mux_v3.py /tmp/v4_1080_silent.mp4 audio/mix/FGW_Laser_Voices_V4_mix.wav exports/FGW_Laser_Voices_V4_REVIEW_1080x1920.mp4 qa/v4/mux_review.json

## V3 (motion, character, sound-design and loop polish)

**Status (23 Oct 2026):**
- The script, narration recording, words, timing, captions and story order are unchanged.
- Changed: the transmitted-message effect (the old murmur is removed and replaced by a short nonverbal "alien"
  motif), the staging and camera, the character construction, and the loop.
- **Not final. Not published.** Nobody has watched or listened in real time. The change list, the
  narration-preservation proof, the audio measurements, the transition list and the known issues are in
  `production/V3_QA_REPORT.md`.
- V1 and V2 below are kept intact.

| Deliverable | File |
|---|---|
| Review: 1080×1920, 30 fps, 1022 frames, burned-in captions, V3 mix (AAC 48 kHz) | `exports/FGW_Laser_Voices_V3_REVIEW_1080x1920.mp4` |
| Master: 2160×3840 native (vectors at 2×), the same cut and mix | `exports/FGW_Laser_Voices_V3_MASTER_2160x3840.mp4` |
| Captions (identical to V1/V2) | `captions/FGW_Laser_Voices_V3.srt` |
| Mix, motif stem, cue record, measurements | `audio/mix/FGW_Laser_Voices_V3_mix.wav`, `audio/mix/stems_v3/`, `audio/motif_cues_v3.json`, `audio/mix/mix_measure_v3.json` |
| QA evidence | `qa/v3/` (QA JSON, motion scan, strips, loop ×3, native crops, V2/V3 and hook sheets, phone UI sheet) |
| Editable source | `source/src/v3/` (composition `LaserVoicesV3`, still `V3Still`, cast sheet `V3Cast`) |

**V3 source (`source/src/v3/`):**
- `world3.ts`: the plan, which places the laser on a post on a bench almost in line in front of the listener, and the
  higher fixed projection.
- `story3.ts`: every performance curve, written in loop time near the seam; the motif instances (`MOTIFS`,
  `motifEnv`); the companion's walk, solved to the existing footsteps and the locked block frames.
- `occlude3.ts`: her on-screen outline, and where the drawn path meets it.
- `cam3.ts`: the camera keys, wrapped around the loop seam, with box-fitted framings.
- `Transmitter.tsx`: the laser head in true perspective, with a sliding cover, the module, the mirror on its motor
  shaft and the exit window.
- `Mechanism3.tsx`: the air beside the ear.
- `art/LeadFigure.tsx`, `art/Clerk.tsx`, `art/limb.tsx` (`Arm`): the rebuilt bodies (heads unchanged).
- `Film3.tsx`, `Room3.tsx`, `Captions3.tsx`.

**V3 rebuild:**

    cd Future_Got_Weird/laser-voices
    (cd source && npm ci)
    B="source/node_modules/.bin/esbuild --bundle --platform=node --format=esm --loader:.css=empty --log-level=warning"
    # 1. walk solve (prints X_ENTER/X_EXIT for story3.ts) and the frame-by-frame obstruction/seam check
    $B tools/solve_v3.ts --outfile=/tmp/sv3.mjs && node /tmp/sv3.mjs
    $B tools/check_v3.ts --outfile=/tmp/cv3.mjs && node /tmp/cv3.mjs > qa/v3/check_v3.json
    # 2. the picture's cues, then the mix (locked narration + V1 bed stems + the new motif)
    $B tools/export_cues_v3.ts --outfile=/tmp/ec3.mjs && node /tmp/ec3.mjs audio/cues_v3.json
    python3 tools/make_audio_v3.py
    # 3. picture only, then mux the mix (AAC) and verify offset/correlation
    (cd source && npx remotion render src/index.ts LaserVoicesV3 /tmp/v3_1080_silent.mp4 --muted --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --concurrency=4)
    (cd source && npx remotion render src/index.ts LaserVoicesV3 /tmp/v3_4k_silent.mp4 --scale=2 --muted --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --concurrency=4)
    python3 tools/mux_v3.py /tmp/v3_1080_silent.mp4 audio/mix/FGW_Laser_Voices_V3_mix.wav exports/FGW_Laser_Voices_V3_REVIEW_1080x1920.mp4 qa/v3/mux_review.json
    python3 tools/mux_v3.py /tmp/v3_4k_silent.mp4 audio/mix/FGW_Laser_Voices_V3_mix.wav exports/FGW_Laser_Voices_V3_MASTER_2160x3840.mp4 qa/v3/mux_master.json
    # 4. QA
    QA_MIX=audio/mix/FGW_Laser_Voices_V3_mix.wav python3 tools/qa.py exports/FGW_Laser_Voices_V3_REVIEW_1080x1920.mp4 <vosk_model_dir> qa/v3/review
    python3 tools/motion_scan.py exports/FGW_Laser_Voices_V3_REVIEW_1080x1920.mp4 qa/v3/motion_scan.json
    python3 tools/strips.py exports/FGW_Laser_Voices_V3_REVIEW_1080x1920.mp4 qa/v3/strips block:26.9:27.5:1 clear:31.7:32.2:1

---

## V2 (visual rebuild on the locked V1 audio)

**Status (23 Oct 2026):**
- V2 replaces the picture only.
- The sound is the approved V1 audio stream, copied unchanged into the V2 files (packet-for-packet; see
  `production/V2_QA_REPORT.md`).
- **Not final. Not published.** V1 below is kept intact.

| Deliverable | File |
|---|---|
| Review: 1080×1920, 30 fps, 1022 frames, burned-in captions, V1 AAC stream copied in | `exports/FGW_Laser_Voices_V2_REVIEW_1080x1920.mp4` |
| Master: 2160×3840 native (vectors at 2×), V1 master's AAC stream copied in | `exports/FGW_Laser_Voices_V2_MASTER_2160x3840.mp4` |
| Captions (identical words and times to V1) | `captions/FGW_Laser_Voices_V2.srt` |
| QA and change report (before/after frames, audio proof, known defects) | `production/V2_QA_REPORT.md`, `qa/v2/` |
| Editable source | `source/src/v2/` (composition `LaserVoicesV2`, still `V2Still`, cast sheet `V2Cast`) |

**V2 source (`source/src/v2/`):**
- `art/LeadHead.tsx`: the lead's head, ported from Infrared Contacts `art/Lead.tsx`, plus a visible ear and the
  expression controls.
- `art/Clerk.tsx`: the companion's head, ported from the Contacts `Sender`, on a new standing/walking body.
- `art/LeadFigure.tsx`, `art/limb.tsx`, `art/Bits.tsx`: the new standing body, IK limbs, hands, shoes, the Crew cup.
- `lib2.ts`: maths and the Contacts nested-level camera, plus a continuous-velocity key interpolator.
- `world2.ts`: the plan in metres, the one fixed projection, the locked message gate and footsteps.
- `story2.ts`: every state, including the clerk's walk solved against the locked audio.
- `cam2.ts`: camera keys and level matrices.
- `Room2.tsx`, `Transmitter.tsx`, `Mechanism2.tsx`, `Captions2.tsx`, `Film2.tsx`: the room, the laser head and its
  section, the air mechanism, the captions and the composition.

**V2 rebuild:**

    cd Future_Got_Weird/laser-voices
    (cd source && npm ci)
    # 1. the picture/audio gate check: the picture's received state must equal audio/cues.json on every frame
    source/node_modules/.bin/esbuild tools/check_v2.ts --bundle --platform=node --format=esm --loader:.css=empty --outfile=/tmp/cv2.mjs && node /tmp/cv2.mjs
    # 2. picture only
    (cd source && npx remotion render src/index.ts LaserVoicesV2 /tmp/v2_1080_silent.mp4 --muted --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --concurrency=4)
    (cd source && npx remotion render src/index.ts LaserVoicesV2 /tmp/v2_4k_silent.mp4 --scale=2 --muted --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --concurrency=4)
    # 3. copy the approved V1 audio stream in (no re-encode) and verify it packet by packet
    python3 tools/mux_verify_v2.py /tmp/v2_1080_silent.mp4 exports/FGW_Laser_Voices_V1_REVIEW_1080x1920.mp4 exports/FGW_Laser_Voices_V2_REVIEW_1080x1920.mp4 qa/v2/audio_review.json
    python3 tools/mux_verify_v2.py /tmp/v2_4k_silent.mp4 exports/FGW_Laser_Voices_V1_MASTER_2160x3840.mp4 exports/FGW_Laser_Voices_V2_MASTER_2160x3840.mp4 qa/v2/audio_master.json
    # 4. QA
    QA_MIX=audio/mix/FGW_Laser_Voices_V1_mix.wav python3 tools/qa.py exports/FGW_Laser_Voices_V2_REVIEW_1080x1920.mp4 <vosk_model_dir> qa/v2/review
    python3 tools/motion_scan.py exports/FGW_Laser_Voices_V2_REVIEW_1080x1920.mp4 qa/v2/motion_scan.json
    python3 tools/strips.py exports/FGW_Laser_Voices_V2_REVIEW_1080x1920.mp4 qa/v2/strips block:26.9:27.5:1 clear:31.7:32.2:1

---

## V1 (first review cut)

**Status (23 Oct 2026):**
- The review cut and a native 4K master are rendered.
- They have been checked by measurement, ASR, a motion scan and decoded-frame strips (`production/QA_REPORT.md`).
- **Not final. Not published.** Nobody has watched or listened to it in real time.

| Deliverable | File |
|---|---|
| Review: 1080×1920, 30 fps, 1022 frames, 34.07 s, H.264 High CRF 16 + AAC 320 kb/s, burned-in captions | `exports/FGW_Laser_Voices_V1_REVIEW_1080x1920.mp4` |
| Master: 2160×3840 native (vectors rendered at 2×, not upscaled), the same cut | `exports/FGW_Laser_Voices_V1_MASTER_2160x3840.mp4` |
| Captions (23 cues, from the measured words) | `captions/FGW_Laser_Voices_V1.srt` |
| Approved narration (the only authoritative text) | `production/NARRATION_APPROVED.txt` |
| Production and QA note: timeline, transition list, checks, remaining issues | `production/QA_REPORT.md` |
| Sources, access, claim ledger, depiction choices | `production/SOURCE_NOTES.md` |
| Voice record (voice id, prompts, 4 takes, hashes, measurements, selection) | `audio/narration/voice_provenance.json` |
| Final narration, word timing, mix | `audio/narration/FGW_Laser_Voices_narration_final.wav`, `audio/narration/words_final.json`, `audio/mix/FGW_Laser_Voices_V1_mix.wav` |
| Cover candidate (a frame of the review MP4) | `cover/FGW_Laser_Voices_cover_candidate_29.7s_1080x1920.png` |
| Upload text draft | `upload/DESCRIPTION_DRAFT.md` |
| Editable source | `source/` (Remotion 4.0.533; composition `LaserVoices`, still `FilmStill`, dev stills `ModelSheet`, `Test`) |

**Narration.** Used verbatim, ElevenLabs "Test Voice" (`kk5XaSLo2XAw0sKM98zU`, `eleven_v4`), take 3 of 4, unedited:
- speech from frame 0 to 33.45 s;
- 181 wpm over the span, 209 wpm articulation.

**Cast.** Two Weird Crew characters on the V2 3D rig, with larger heads and shorter torsos:
- **The recipient:** short dark hair tucked behind her bare left ear, a slate-blue zip jacket over a coral top.
- **The bystander:** tall, close-cropped hair, round glasses, short beard, sage knit, lanyard ID, tablet.

**The one room.**
- **Axes and scale:** x runs along the optical axis, in metres. The transmitter exit is at 0 and her left ear at 2.44 m
  (8 ft), at 1.43 m height.
- **Bench:** a dark teal optics bench with the laser head (scanning mirror behind the exit tube) and a playback unit
  with a TX light.
- **Walls:** warm neutral walls, with a doorway, a laser sign and a whiteboard.
- **The crossing:** he crosses the axis at x = 1.5 m. The beam meets his left shoulder.

## Source layout (`source/src/`)

- `world.ts`: the plan (metres) and the measured words.
- `story.ts`: every state as a function of time:
  - her performance;
  - his planted-foot walk (three segments: approach, a pause at the edge, a step into the beam, then on and out);
  - the obstruction test `pathHit` (his body as capsules against the path);
  - `received` = message on and not blocked. The picture and the sound both read it.
- `cams.ts`: one continuous authored camera (named framings, eased moves, one curved move).
- `timing.ts`: overlay and magnifier timing from the words.
- `Scene.tsx`, `Room.tsx`: the room, the bench, the transmitter and its section, the playback unit; figures painted
  far-to-near.
- `Person.tsx`, `Head3.tsx`, `art/Hand.tsx`, `lib/`: the character rigs (from Invisibility Shield V2, adapted).
- `Overlay.tsx`: the dashed IR path, the listening region and received accent, the sweep wavelets, the 8 FT dimension.
- `Magnifier.tsx`: the local magnification of the air beside the ear (absorption → heat → expansion → pressure fronts).
- `Film.tsx`, `Captions.tsx`, `Root.tsx`: the composition and screen-space captions.
- `p3.ts`: projection. Note the right-handed screen basis, which is the V2 basis mirrored.

## Rebuild

    cd Future_Got_Weird/laser-voices
    python3 -m pip install numpy scipy soundfile pyloudnorm pocketsphinx   # vosk: pip install --no-deps vosk (+ the pure-Python srt module)
    (cd source && npm ci)
    python3 tools/align.py audio/narration/takes/take3.mp3 audio/narration/takes/take3_words.json   # word timeline
    python3 tools/make_narration.py      # final narration, timeline.json, captions, SRT
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --outfile=/tmp/ec.cjs && node /tmp/ec.cjs audio/cues.json
    python3 tools/make_audio.py          # bed, message (gated by the picture's own `received`), effects, mix -> source/public/audio/mix.wav
    (cd source && npx remotion render src/index.ts LaserVoices ../exports/FGW_Laser_Voices_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    (cd source && npx remotion render src/index.ts LaserVoices ../exports/FGW_Laser_Voices_V1_MASTER_2160x3840.mp4 --scale=2 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    # QA (Vosk model vosk-model-small-en-us-0.15, taken from the npm package transcribe2texts, which bundles it)
    source/node_modules/.bin/esbuild tools/check_block.ts --bundle --platform=node --format=cjs --loader:.css=empty --outfile=/tmp/cb.cjs && node /tmp/cb.cjs
    python3 tools/qa.py exports/FGW_Laser_Voices_V1_REVIEW_1080x1920.mp4 <vosk_model_dir> qa/v1/review
    python3 tools/motion_scan.py exports/FGW_Laser_Voices_V1_REVIEW_1080x1920.mp4 qa/v1/motion_scan.json
    python3 tools/strips.py exports/FGW_Laser_Voices_V1_REVIEW_1080x1920.mp4 qa/v1/strips block:26.9:27.5:1 clear:31.7:32.2:1
    (cd source && node stills.mjs <out_dir> <spec.json>)   # dev/QA stills, e.g. [{"id":"FilmStill","props":{"t":27.3,"captions":true}}]

Notes:
- The Remotion config points at the Playwright headless shell (`/opt/pw-browsers/chromium_headless_shell-1243/...`).
  Override it with `REMOTION_BROWSER_EXECUTABLE`.
- The narration takes are committed. Regenerating them needs the ElevenLabs connection and the prompts in
  `voice_provenance.json` (flow `LWAx7zaQe906nUoTLU6M`).
