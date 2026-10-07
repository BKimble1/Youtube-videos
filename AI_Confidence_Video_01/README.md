# AI_Confidence_Video_01 — "Why AI Sounds Right When It's Wrong"

A self-contained, editable production project for a ~5-minute faceless explainer. Everything is code or
local data: research and sources, the script, narration tooling, an original score, synthesized sound
effects, the mix, and the Remotion (React/TypeScript) motion-graphics source.

> **Narration status:** the current cut uses a **temporary local AI voice** (Kokoro-82M, labelled
> "DRAFT · TEMPORARY VOICE" on screen). The intended ElevenLabs narration could not be generated in the
> production session: no API key, and `api.elevenlabs.io` was blocked by the network policy. Follow
> "Premium narration" below, and the on-screen draft label disappears automatically.

## Folder map

| Folder | What's in it |
|---|---|
| `research/` | `sources.md` (claim-to-source table), `reference_study.md`, deep notes on the OpenAI paper and the Anthropic article, raw source copies, page renders |
| `script/` | `FINAL_SCRIPT.md`, `narration_segments.json` (the single source of narration text), `subtitles_<engine>.srt`, openings/outline |
| `assets/` | `asset_manifest.csv` (every external asset: source, licence, attribution), original images, screenshots |
| `audio/` | narration stems per engine, auditions, music stems/bed, SFX, final mix + stems, mix report |
| `source/` | Remotion project (`src/scenes/S1…S6`, components, timeline helpers, thumbnails), `public/` render assets |
| `tools/` | pipeline scripts (TTS, timeline, music, SFX, mix, crops, QA, ElevenLabs) |
| `exports/` | final renders · `thumbnails/` thumbnail options · `qa/` QA report and measurements · `package/` upload copy |

## Requirements

- Node 22 + npm, Python 3.11+ (`numpy scipy soundfile pyloudnorm mido`), FFmpeg 6+, FluidSynth +
  `musescore-general-soundfont` (Ubuntu: `apt-get install fluidsynth musescore-general-soundfont`).
- Chromium for Remotion. Normally Remotion downloads its own headless shell. In the production
  container that host was blocked, so `source/remotion.config.ts` points at a local Playwright build;
  set `REMOTION_BROWSER_EXECUTABLE=/path/to/chrome-or-headless_shell` on another machine, or delete that
  line to let Remotion download its own.

```bash
cd source && npm ci          # exact versions from package-lock.json
```

## Rebuild pipeline (exact order)

Run from the project root (`AI_Confidence_Video_01/`):

```bash
# 1. Narration (choose ONE engine)
#    a) premium (needs ELEVENLABS_API_KEY in the environment and access to api.elevenlabs.io):
python3 tools/elevenlabs_narration.py list-voices
python3 tools/elevenlabs_narration.py audition --models eleven_v4,eleven_multilingual_v2 \
        --voices <ID1>,<ID2>,<ID3> --text-file audio/narration/elevenlabs/audition_text.txt
python3 tools/elevenlabs_narration.py narrate --model eleven_v4 --voice <CHOSEN_ID> --seed 1234
ENGINE=elevenlabs
#    b) draft (offline, Kokoro-82M; see audio/narration/auditions_local/AUDITIONS.md for one-time setup):
#       python tools/draft_tts.py --setup && python tools/draft_tts.py --voice af_heart --speed 1.0
#       ENGINE=draft_local

# 2. Timing: concatenated narration, scene/word frames, subtitles
python3 tools/build_timeline.py --engine $ENGINE
python3 tools/check_cues.py            # every animation cue must match a spoken word

# 3. Music, SFX, mix (≈ -16 LUFS integrated, ≤ -1 dBTP)
python3 tools/make_music.py
python3 tools/make_sfx.py
python3 tools/mix.py

# 4. Render (1080p30 H.264 + AAC) and finalize (fast-start, measurements)
cd source
npx remotion render src/index.ts Main ../exports/render_1080p.mp4 --crf=16 --x264-preset=slow \
    --color-space=bt709 --audio-bitrate=320k --concurrency=4
cd .. && bash tools/finalize.sh exports/render_1080p.mp4 exports/Video_01_AI_Confidence_Final_1080p.mp4

# 5. Optional 4K master (renders the same vector scene graph at 2x; ~4x render time)
cd source && npx remotion render src/index.ts Main ../exports/render_4k.mp4 --scale=2 --crf=16 --x264-preset=medium \
    --color-space=bt709 --audio-bitrate=320k --concurrency=4     # ~2 h on 4 vCPUs
cd .. && bash tools/finalize.sh exports/render_4k.mp4 exports/Video_01_AI_Confidence_Master_4K.mp4

# 6. Thumbnails, script export
cd source && for t in A B C; do npx remotion still src/index.ts Thumb$t ../thumbnails/thumbnail_$t.png; done
cd .. && python3 tools/export_script.py
```

Preview anything interactively with `cd source && npm run studio`.

## Editing notes

- **Change a line of narration:** edit `script/narration_segments.json`, regenerate only that segment
  (`--only s21`), then rerun steps 2–4. The animations are keyed to spoken words through
  `at('s21', 'year:')` calls, so `tools/check_cues.py` tells you if an edit removed a cue word.
- **Pronunciation:** use `tts_text` in a segment (Kokoro inline phonemes like `[Kalai](/kəlˈI/)`, or a
  respelling such as `Ka-lie` for ElevenLabs). Display text and subtitles always come from `text`.
- **Colour meaning:** teal = supporting evidence, coral = the mistaken detail. Both always appear with a
  text label. See `source/src/theme.ts`.
- **Illustrative vs real:** token splits are real (o200k_base). Next-token percentages and the quiz
  numbers are illustrations and are labelled that way on screen. Keep it that way.

## Licences and credits

See `assets/asset_manifest.csv` and `package/UPLOAD_PACKAGE.md`. Kalai et al. (2025) material is CC BY 4.0.
Smithsonian photos are CC0. The Anthropic header and figure are shown briefly for commentary. Music and
SFX are original; the score is rendered with the MuseScore General SoundFont (MIT). Fonts are SIL OFL.
Remotion is free for individuals and small teams; check https://www.remotion.dev/license if that changes.
