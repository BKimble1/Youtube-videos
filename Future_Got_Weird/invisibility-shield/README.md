# Future Got Weird: This Shield Can Make You Disappear.

## V1 (first review cut)

**Status (23 Oct 2026):**
- The review cut and a native 4K master are rendered.
- They have been checked with measurements, transcripts and decoded-frame inspection (`production/QA_REPORT.md`).
- **Not final. Not published.**
- Nobody has watched or listened to it in real time.

| Deliverable | File |
|---|---|
| Review: 1080×1920, 30 fps, 878 frames, 29.27 s, H.264 High CRF 16 + AAC 320 kb/s, burned-in captions | `exports/FGW_Invisibility_Shield_V1_REVIEW_1080x1920.mp4` |
| Master: 2160×3840 native (vectors rendered at 2×, not upscaled), the same cut | `exports/FGW_Invisibility_Shield_V1_MASTER_2160x3840.mp4` |
| Approved narration (the only authoritative text) | `production/NARRATION_APPROVED.txt` |
| Captions (21 cues, from the measured words) | `captions/FGW_Invisibility_Shield_V1.srt` |
| Production and QA note: story timing, transition list, checks, limitations | `production/QA_REPORT.md` |
| Sources, blocked hosts, depiction choices, attribution | `production/SOURCE_NOTES.md` |
| Voice record (voice id, prompts, 4 takes, hashes, selection, ASR) | `audio/narration/voice_provenance.json` |
| Final narration and mix | `audio/narration/FGW_Invisibility_Shield_narration_final.wav`, `audio/mix/FGW_Invisibility_Shield_V1_mix.wav` |
| Upload text draft | `upload/DESCRIPTION_DRAFT.md` |
| Editable source | `source/` (Remotion 4.0.533, composition `InvisibilityShield`, still `FilmStill`) |

**Narration.** Used verbatim, ElevenLabs "Test Voice" (`kk5XaSLo2XAw0sKM98zU`, `eleven_v4`), take 3 of 4, unedited:
- speech from frame 0;
- 195 wpm.

**Cast.** The Weird Crew lead: the red-haired "guesser" in the white tee with saffron stripes. He is drawn
front-facing with the Death Clock rig's parts:
- ink contours;
- limb construction;
- five-digit hands;
- the crew head.

## Source layout

- `src/world.ts`:
  - the one physical setup (wall, lead, panel; 1 m = 560 px);
  - the cue table derived from the measured words;
  - the panel path and the camera path;
  - the optics parameters.
- `src/poses.ts`: the lead's performance (grips, the reach round the edge, the finger ripple, expressions, breathing).
- `src/art/Lead.tsx`: the front-view rig (built from `lib/ink`, `lib/limb`, `lib/shade`, `art/Head` and `art/Hand`,
  copied from Death Clock).
- `src/art/Wall.tsx`: the horizontally structured wall, its landmarks and the floor.
- `src/art/Shield.tsx`: the panel's optics, confined to its outline:
  - the wall smeared horizontally;
  - the residual light of the person spread sideways;
  - the off-axis outline;
  - the ridges, rim and glint.
- `src/art/Section.tsx`: the top-view section, the simplified light paths and the front-view overlays.
- `src/Overlay.tsx`: the screen-space captions.

## Rebuild

    cd Future_Got_Weird/invisibility-shield
    python3 -m pip install soundfile scipy numpy pyloudnorm pocketsphinx
    (cd source && npm ci)
    python3 tools/align.py audio/narration/takes/take3.mp3 audio/narration/takes/take3_words.json   # word timeline
    python3 tools/make_narration.py      # final narration, timeline.json, captions, SRT
    source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=esm --loader:.css=empty --outfile=/tmp/ec.mjs && node /tmp/ec.mjs audio/cues.json
    python3 tools/make_audio.py          # score, effects, mix -> source/public/audio/mix.wav
    (cd source && npx remotion render src/index.ts InvisibilityShield ../exports/FGW_Invisibility_Shield_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    (cd source && npx remotion render src/index.ts InvisibilityShield ../exports/FGW_Invisibility_Shield_V1_MASTER_2160x3840.mp4 --scale=2 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4)
    # QA (Vosk model vosk-model-small-en-us-0.15; here taken from the npm package transcribe2texts, which bundles it;
    # vosk is installed with pip --no-deps plus the pure-Python srt module)
    python3 tools/qa.py exports/FGW_Invisibility_Shield_V1_REVIEW_1080x1920.mp4 <vosk_model_dir> qa/v1/review
    python3 tools/motion_scan.py exports/FGW_Invisibility_Shield_V1_REVIEW_1080x1920.mp4 qa/v1/motion_scan.json
    python3 tools/strips.py exports/FGW_Invisibility_Shield_V1_REVIEW_1080x1920.mp4 qa/v1/strips hook:0:1.3:2 hand_out:19.6:20.7:2

The narration takes are committed. Regenerating them needs the ElevenLabs connection and the prompts in
`voice_provenance.json`.
