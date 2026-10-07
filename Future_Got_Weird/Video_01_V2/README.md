# Future Got Weird · Video 01 · pass 2 — "Why AI Is So Confidently Wrong"

A bright, fully animated cutout-style rebuild of Video 01 for the anonymous channel **Future Got Weird**. Runtime
4:40.8, 1920×1080, 30 fps. Everything on screen is generated from code and data in this directory; the only
external images are real excerpts of the two cited documents.

Start with `DELIVERABLES.md` (what to upload), `package/UPLOAD_PACKAGE.md` (title, description, chapters,
thumbnails) and `qa/QA_REPORT.md` (what was checked and what was not).

## Layout

```
script/        narration_segments.json (36 segments, display text + Eleven v4 prompts), narration_blocks.json,
               FINAL_SCRIPT.md (exact spoken text with measured times), subtitles_elevenlabs.srt
storyboard/    STORYBOARD.md (scene by scene, with the word cues each scene uses)
research/      sources.md (claim-to-source ledger; builds on the pass-1 ledger)
audio/         narration/elevenlabs (takes, alignment, selection, per-segment WAVs), music/ (bed + stems),
               sfx/ (elevenlabs candidates + SELECTION.md, sfx_track.wav, sfx_cues.json), mix/ (final mix + stems)
source/        Remotion project: src/scenes (S1–S10), src/components (cast, props, sets, evidence, text),
               src/lib (camera, animation, timeline), src/data (timeline.json, tokens), public/ (images, audio)
tools/         the pipeline (below)
qa/            QA_REPORT.md, CORRECTIONS.md, tech_*.md, sfx_levels.json, frames/ (contact sheets), dev/ (check frames)
exports/       the master, the preview, the SRT
thumbnails/    three thumbnails (PNG + JPG)
package/       UPLOAD_PACKAGE.md
assets/        asset_manifest.csv (every image, font, sound and its licence)
backup/        split-part backups of the media with SHA-256 checksums and reconstruction scripts
```

Media (`*.wav`, `*.mp4`, `*.mp3`, mix and stems) is ignored by Git because the Git LFS host is not reachable from
the production environment. The `backup/` parts (< 25 MiB each) are committed instead; `backup/*/reconstruct.py`
joins and verifies them.

## Rebuild from source

Requirements: Node 20+, Python 3.11+, ffmpeg, FluidSynth with the MuseScore General SoundFont (`MuseScore_General.sf3`),
and the Python packages `numpy scipy soundfile praat-parselmouth pillow`. Chromium for Remotion is found through
`source/remotion.config.ts` (set `browserExecutable` to your Chromium if the path differs).

```bash
cd source && npm ci && cd ..                   # exact dependency versions from package-lock.json
# 1. narration (already done; the selected takes and alignments are in audio/narration/elevenlabs)
python3 tools/el_assemble.py                   # cut the selected takes into per-segment WAVs
python3 tools/build_timeline.py                # -> source/src/data/timeline.json, public/audio/narration.wav, the SRT
python3 tools/check_cues.py                    # every word cue the scenes use exists in the timeline
# 2. sound
python3 tools/make_music.py                    # -> audio/music/music_bed.wav (FluidSynth)
python3 tools/make_sfx.py                      # -> audio/sfx/sfx_track.wav
python3 tools/mix.py                           # -> audio/mix/final_mix.wav + stems (-16 LUFS, -1.3 dBTP)
cp audio/mix/final_mix.wav source/public/audio/mix.wav
# 3. picture
cd source && npx tsc --noEmit && npm run render:1080 && cd ..
bash tools/finalize.sh exports/render_1080p.mp4 exports/Future_Got_Weird_Video_01_Pass_2_1080p.mp4
python3 tools/qa_sheets.py                     # contact sheets, boundary frames, phone crops
# thumbnails
cd source && for v in A B C; do npx remotion still src/index.ts Thumb$v ../thumbnails/thumbnail_$v.png; done
```

Check frames without a full render: `cd source && SCALE=0.5 node stills.mjs <absolute out dir> "word:s15:But+30" "seg:s01+30" "segend:s07+40"`.

Native 4K: add `--scale=2` to the render script (the illustration is vector, so it is a true 4K rasterisation).

## Regenerating the narration

`tools/el_blocks.py` prints the ten Eleven v4 block prompts (with IPA for "Kalai"). They were generated through the
ElevenLabs connector (voice "Marcus K", four takes per block), aligned with Scribe forced alignment on the pinned
take, measured with `tools/eval_takes.py` / `eval_blocks.py`, and selected in `audio/narration/elevenlabs/selection.json`.
`tools/el_fetch.py` downloads signed URLs listed on stdin as `dest url`. No API key is used or stored anywhere.

## Rules that every change must keep

- Nothing public identifies the channel's owner (see `../CHANNEL_BRIEF.md`). The description, credits, metadata and
  thumbnails were audited for this.
- Model labels and dates stay exact: GPT-4o, DeepSeek-R1, Llama-4-Scout, 9 May 2025, no web search; Kalai (2001).
- Illustrative numbers are labelled illustrative; the toy quiz is labelled example; "not necessarily more correct".
- No claims about intent ("lying"). See `research/sources.md` for the must-not list.
- Motion is driven by frame and word cues only; no wall-clock, no `Math.random()` without a seed.
