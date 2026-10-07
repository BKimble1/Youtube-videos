# AI_Confidence_Video_01 — "Why AI Sounds Right When It's Wrong"

A self-contained, editable production project for a ~5-minute faceless explainer. Everything is code or
local data: research and sources, the script, narration tooling, an original score, synthesized sound
effects, the mix, and the Remotion (React/TypeScript) motion-graphics source.

> **Narration:** final narration by **ElevenLabs Eleven v4** (voice "Marcus K"). It was generated through the
> ElevenLabs connector (Flows) rather than with an API key: 12 blocks × 4 takes, scored, picked, and cut into
> segments with Scribe forced alignment. Sound effects combine numpy-synthesized interface accents with six
> ElevenLabs sound effects. The earlier Kokoro draft is kept in `backup/draft_v5/` for comparison.

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

- Node 22 + npm, Python 3.11+ (`numpy scipy soundfile pyloudnorm mido pillow`; optional `praat-parselmouth` for scoring takes), FFmpeg 6+, FluidSynth +
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
# 1. Narration
#    a) final (ElevenLabs, as delivered). The takes were generated through the ElevenLabs connector (Flows);
#       their MP3s and Scribe alignments live in audio/narration/elevenlabs/takes/ (restore them from
#       backup/elevenlabs_narration_takes/ if needed). To regenerate: python3 tools/el_blocks.py writes the
#       block prompts, generate each block on eleven_v4 in an ElevenLabs Flow, fetch with tools/el_fetch.py,
#       score with `python3 tools/eval_blocks.py --no-asr` (needs praat-parselmouth; the Whisper-tiny WER
#       column also needs a local transformers.js ASR helper, set via ASR_SCRATCH, which is not included),
#       pick in selection.json, align with Scribe, then:
python3 tools/el_assemble.py           # cut the picked takes into per-segment WAVs + manifest
ENGINE=elevenlabs
#    (Untested alternative with ELEVENLABS_API_KEY: python3 tools/elevenlabs_narration.py narrate --voice <ID>.
#     It synthesizes per segment, not per block, and reads tts_text_elevenlabs (not tts_v4), so add that
#     field for the Kalai lines s01, s05, s09, s12, s31 first. It writes the same s*.wav + manifest.json.)
#    b) draft (offline, Kokoro-82M; see audio/narration/auditions_local/AUDITIONS.md for one-time setup):
#       python tools/draft_tts.py --setup && python tools/draft_tts.py --voice af_heart --speed 1.0
#       ENGINE=draft_local

# 2. Timing: concatenated narration, scene/word frames, subtitles
python3 tools/build_timeline.py --engine $ENGINE
cp script/subtitles_$ENGINE.srt exports/Video_01_AI_Confidence.en.srt   # the upload copy
python3 tools/check_cues.py            # every animation cue must match a spoken word

# 3. Music, SFX, mix (≈ -16 LUFS integrated, ≤ -1 dBTP)
python3 tools/make_music.py
python3 tools/make_sfx.py              # needs audio/sfx/elevenlabs/*.mp3 (backup/elevenlabs_sfx/)
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
cd .. && for t in A B C; do python3 -c "from PIL import Image; Image.open('thumbnails/thumbnail_$t.png').convert('RGB').save('thumbnails/Video_01_thumbnail_$t.jpg', quality=92)"; done
cd .. && python3 tools/export_script.py
```

Preview anything interactively with `cd source && npm run studio`.

## Editing notes

- **Change a line of narration:** edit `text` (and `tts_v4`, keeping the same word count) in
  `script/narration_segments.json` and run `python3 tools/el_blocks.py`. Regenerate the block that holds the
  segment (e.g. b07 for s21) on eleven_v4 in an ElevenLabs Flow, fetch it with `tools/el_fetch.py`, point
  `audio/narration/elevenlabs/selection.json` at the new take and its Scribe `.align.json`, run
  `python3 tools/el_assemble.py`, then rerun steps 2–4. (Kokoro draft only: `python3 tools/draft_tts.py --only s21`.)
  The animations are keyed to spoken words through
  `at('s21', 'year:')` calls, so `tools/check_cues.py` tells you if an edit removed a cue word.
- **Pronunciation:** the final ElevenLabs narration reads `tts_v4` (IPA between slashes, e.g. `/kəˈlaɪz/`), which
  must have the same word count as `text` (`tools/el_blocks.py` checks). `tts_text` is for the Kokoro draft
  (inline phonemes like `[Kalai](/kəlˈI/)`). Display text and subtitles always come from `text`.
- **Colour meaning:** teal = supporting evidence, coral = the mistaken detail. Both always appear with a
  text label. See `source/src/theme.ts`.
- **Illustrative vs real:** token splits are real (o200k_base). Next-token percentages and the quiz
  numbers are illustrations and are labelled that way on screen. Keep it that way.

## Licences and credits

See `assets/asset_manifest.csv` and `package/UPLOAD_PACKAGE.md`. Kalai et al. (2025) material is CC BY 4.0.
Smithsonian photos are CC0. The Anthropic header and figure are shown briefly for commentary. The title page of
Adam Kalai's 2001 Carnegie Mellon thesis (CMU-CS-01-132) is shown briefly, with credit, to check a factual claim. The Google
DeepMind IMO 2025 solutions page is quoted briefly for commentary. The music is original, rendered with the
MuseScore General SoundFont (MIT). The SFX are original synthesized accents plus ElevenLabs sound effects
generated for this video. The narration is ElevenLabs TTS. Use of both follows the account's ElevenLabs plan
terms. Fonts are SIL OFL.
Remotion is free for individuals and small teams; check https://www.remotion.dev/license if that changes.
