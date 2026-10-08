# Video 01 · V3 — deliverables

Final film: **"Why AI Is So Confidently Wrong"** (Future Got Weird, episode 1), 4:48.23, 30 fps. Rendered from source
commit `{{SRC}}` on branch `claude/new-session-96c7w8` (`Future_Got_Weird/Video_01_V2/source`). Nothing has been
published.

## Upload this

**`exports/Future_Got_Weird_Video_01_V3_4K_MASTER.mp4`**: the YouTube upload file. Title, description, chapters,
captions, thumbnail and settings: `package/UPLOAD_PACKAGE.md`.

## Files

| # | File | What | Size | SHA-256 |
|---|---|---|---|---|
| 1 | `exports/Future_Got_Weird_Video_01_V3_4K_MASTER.mp4` | upload master | {{4K_SIZE}} | `{{4K_SHA}}` |
| 2 | `exports/Future_Got_Weird_Video_01_V3_1080p_REVIEW.mp4` | review copy (same source, same mix) | {{RV_SIZE}} | `{{RV_SHA}}` |
| 3 | `exports/Future_Got_Weird_Video_01_V3.en.srt` | English captions (= `script/subtitles_v2.srt`, 105 cues) | {{SRT_SIZE}} | `{{SRT_SHA}}` |
| 4 | `thumbnails/Future_Got_Weird_Video_01_V3_thumbnail.jpg` | thumbnail, 1280×720 (3840×2160 source render: `thumbnail_V3_A_3840.png`) | {{TH_SIZE}} | `{{TH_SHA}}` |
| 5 | `package/UPLOAD_PACKAGE.md`, `package/DESCRIPTION_V3.txt` | title, paste-ready description (sources, notes, credits, chapters), upload settings, end screen, owner checks | | |
| 6 | `script/FINAL_SCRIPT.md` | final script with timings (narration unchanged from V2) | | |
| 7 | `V3_CHANGELOG.md`, `qa/V3_QA_NOTES.md`, `qa/V3_LISTENING_CHECKLIST.md`, `qa/CORRECTIONS.md` | change log with defect log, honest QA notes, listening checklist, corrections | | |
| 8 | `source/` (with `package-lock.json`) | editable Remotion project | | |
| 9 | `source/public/audio/mix.wav`, `audio/mix/v2/stem_*.wav`, `audio/music/v2/music_bed.wav`, `audio/sfx/v2/{sfx,amb}_track.wav`, `source/public/audio/narration.wav` | final mix, stems, music bed, effects and ambience tracks, narration | | see `backup/v3_exports/` |

## Export properties (measured with `tools/verify_export.py`; full reports in `qa/v3_final/verify_*.json`)

| | 4K master | 1080p review |
|---|---|---|
| Container | MP4, fast start (moov before mdat): {{4K_FS}} | MP4, fast start: {{RV_FS}} |
| Video | H.264 {{4K_PROFILE}}, {{4K_W}}×{{4K_H}}, {{4K_FPS}} fps progressive, {{4K_FRAMES}} frames, {{4K_PIX}}, colour {{4K_COLOR}} | H.264 {{RV_PROFILE}}, {{RV_W}}×{{RV_H}}, {{RV_FPS}} fps progressive, {{RV_FRAMES}} frames, {{RV_PIX}}, colour {{RV_COLOR}} |
| Video bitrate | {{4K_VBR}} Mbps average (target 40 Mbps; simple flat animation needs less, so x264 lands under the target) | {{RV_VBR}} Mbps (CRF 16) |
| Audio | AAC-{{4K_AP}}, {{4K_SR}} Hz, {{4K_CH}} ch, {{4K_ABR}} kbps | AAC-{{RV_AP}}, {{RV_SR}} Hz, {{RV_CH}} ch, {{RV_ABR}} kbps |
| Duration | {{4K_DUR}} s | {{RV_DUR}} s |
| Full decode | {{4K_DEC}} | {{RV_DEC}} |
| Loudness (encoded audio) | {{4K_LUFS}} LUFS integrated, true peak {{4K_TP}} dBTP, LRA {{4K_LRA}} LU | {{RV_LUFS}} LUFS, {{RV_TP}} dBTP |
| Sync vs `mix.wav` | lag {{4K_LAG}} ms, correlation {{4K_CORR}} | lag {{RV_LAG}} ms, correlation {{RV_CORR}} |
| Metadata tags | {{4K_TAGS}} | {{RV_TAGS}} |

## Render commands (run in `Future_Got_Weird/Video_01_V2/source`, Remotion 4.0.533, Chromium headless shell from
`remotion.config.ts`)

```sh
# 4K master: the brief's command plus --concurrency=3 (all flags are supported by the pinned version; --image-format=png
# overrides the config's JPEG frames; fast start is Remotion's default)
npx remotion render src/index.ts Main ../exports/Future_Got_Weird_Video_01_V3_4K_MASTER.mp4 --scale=2 --codec=h264 --video-bitrate=40M --audio-codec=aac --audio-bitrate=384k --pixel-format=yuv420p --color-space=bt709 --image-format=png --concurrency=3

# 1080p review
npx remotion render src/index.ts Main ../exports/Future_Got_Weird_Video_01_V3_1080p_REVIEW.mp4 --codec=h264 --crf=16 --audio-codec=aac --audio-bitrate=320k --pixel-format=yuv420p --color-space=bt709 --image-format=png --concurrency=4
```

`Main` is registered in `src/Root.tsx` at 1920×1080, 30 fps, 8,647 frames, with `public/audio/mix.wav`; `--scale=2`
renders the same layout at 3840×2160 (text and SVG are drawn at 4K; the three document rasters were re-extracted at
1200 dpi for it). Render times on this 4-CPU machine: 1080p ≈ 15 min, 4K ≈ {{4K_MIN}} min.

To rebuild the audio from the scenes' cue sheets first:
`node tools/collect_sfx.mjs source audio/sfx/v2/cues.json && python3 tools/make_sfx_v2.py && python3 tools/make_music_v2.py && python3 tools/mix_v2.py --sfx-db -2 --sfx-duck-db 4`
(the music needs FluidSynth and the MuseScore General SoundFont).

## Storage and recovery

Video and WAV files are not stored in Git directly (media types are Git-ignored here). They are committed as
checksummed split parts in **`backup/v3_exports/`** on branch `claude/new-session-96c7w8` of the repository:

- `Future_Got_Weird_Video_01_V3_4K_MASTER.mp4.part001…` (24 MiB parts)
- `Future_Got_Weird_Video_01_V3_1080p_REVIEW.mp4.part…`
- `v3_audio.tar.part…`: final mix, stems, music bed and effects/ambience tracks as sample-exact FLAC, with
  per-file sample hashes
- `SHA256SUMS` (whole files and every part), `manifest.json`, `reconstruct.sh` / `reconstruct.py`,
  `restore_v3_audio.py`

```sh
git clone -b claude/new-session-96c7w8 <repository URL> && cd <repository>/Future_Got_Weird/Video_01_V2
sh backup/v3_exports/reconstruct.sh exports            # joins the parts into exports/ and checks every SHA-256
                                                        # (Windows: python backup/v3_exports/reconstruct.py exports)
mv exports/v3_audio.tar backup/v3_exports/ && python3 backup/v3_exports/restore_v3_audio.py   # WAVs back in place, sample-checked
(cd source && npm ci)                                   # then render with the commands above
```

Earlier states stay recoverable: the approved V2 (`APPROVED_V2.md`, `backup/v2_review_build/`) and the frozen V2
baseline (`BASELINE.md`, `backup/v2_baseline/`).
