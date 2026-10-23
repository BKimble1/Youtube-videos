# Future Got Weird: This Laser Makes You Hear Voices

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
