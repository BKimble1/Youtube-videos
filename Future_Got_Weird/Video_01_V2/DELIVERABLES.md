# Video 01 · V3 — deliverables

Final film: **"Why AI Is So Confidently Wrong"** (Future Got Weird, episode 1), 4:48.23, 30 fps. Rendered from source
commit `9e01749` on branch `claude/new-session-96c7w8` (`Future_Got_Weird/Video_01_V2/source`). Nothing has been
published.

## Upload this

**`exports/Future_Got_Weird_Video_01_V3_4K_MASTER.mp4`**: the YouTube upload file. Title, description, chapters,
captions, thumbnail and settings: `package/UPLOAD_PACKAGE.md`.

## Files

| # | File | What | Size | SHA-256 |
|---|---|---|---|---|
| 1 | `exports/Future_Got_Weird_Video_01_V3_4K_MASTER.mp4` | upload master | 1,147,793,593 bytes (1147.8 MB) | `e79c1bd904dace898af2f364f80687a83ae54d2c17c8e6b4307a8e1856bbec89` |
| 2 | `exports/Future_Got_Weird_Video_01_V3_1080p_REVIEW.mp4` | review copy (same source, same mix) | 121,900,939 bytes (121.9 MB) | `386161f5eac09883ab63c3bada04de30a33a5d13b5831060d1826750fb524ef5` |
| 3 | `exports/Future_Got_Weird_Video_01_V3.en.srt` | English captions (= `script/subtitles_v2.srt`, 105 cues) | 7,653 bytes | `cabf8c067bd31d5ce884f16467f44791d9a3dd096a6a3ed744e897ac26ac3039` |
| 4 | `thumbnails/Future_Got_Weird_Video_01_V3_thumbnail.jpg` | thumbnail, 1280×720 (3840×2160 source render: `thumbnail_V3_A_3840.png`) | 190,651 bytes | `9dc11b45da0e47d836b2321f38744ab2b4982a82f07cb4ee6ff9d7b8fddef300` |
| 5 | `package/UPLOAD_PACKAGE.md`, `package/DESCRIPTION_V3.txt` | title, paste-ready description (sources, notes, credits, chapters), upload settings, end screen, owner checks | | |
| 6 | `script/FINAL_SCRIPT.md` | final script with timings (narration unchanged from V2) | | |
| 7 | `V3_CHANGELOG.md`, `qa/V3_QA_NOTES.md`, `qa/V3_LISTENING_CHECKLIST.md`, `qa/CORRECTIONS.md` | change log with defect log, honest QA notes, listening checklist, corrections | | |
| 8 | `source/` (with `package-lock.json`) | editable Remotion project | | |
| 9 | `source/public/audio/mix.wav`, `audio/mix/v2/stem_*.wav`, `audio/music/v2/music_bed.wav`, `audio/sfx/v2/{sfx,amb}_track.wav`, `source/public/audio/narration.wav` | final mix, stems, music bed, effects and ambience tracks, narration | | see `backup/v3_exports/` |

## Delivered in the chat (2026-10-08)

- The 4K master as an uncompressed zip split into 38 volumes (`Future_Got_Weird_Video_01_V3_4K_MASTER.zip.001`–`.038`,
  31,000,000 bytes each except the last), with `HOW_TO_OPEN_THE_4K_ZIP.txt` and `SHA256SUMS_zip_volumes.txt`. The chat
  accepts video files up to 500 MiB and other files up to 30 MiB, so the 1.07 GiB master could not go as one file.
  Joined, the volumes form a zip with SHA-256 `5c9554ad6c9fdc2eeb0e648640a300005040d0143be94bc7b80731165703c21c`; the
  MP4 inside has the master's SHA-256 above (round trip tested before sending).
- `exports/Future_Got_Weird_Video_01_V3_1080p_REVIEW_chat.mp4`: a 28.7 MB two-pass re-encode of the 1080p review for
  watching in the chat (SHA-256 `c40f92067e667c09411ad3d82d016cd9b5657b269a000b26d3ddd6825948ed41`; also in
  `backup/v3_exports/`). Not for upload.

## Export properties (measured with `tools/verify_export.py`; full reports in `qa/v3_final/verify_*.json`)

| | 4K master | 1080p review |
|---|---|---|
| Container | MP4, fast start (moov before mdat): yes | MP4, fast start: yes |
| Video | H.264 High @ L5.1, 3840×2160, 30 fps progressive, 8,647 frames, yuv420p, colour bt709 / bt709 / bt709, tv range | H.264 High @ L4, 1920×1080, 30 fps progressive, 8,647 frames, yuv420p, colour bt709 / bt709 / bt709, tv range |
| Video bitrate | 31.5 Mbps average (target 40 Mbps; simple flat animation needs less, so x264 lands under the target) | 3.1 Mbps (CRF 16) |
| Audio | AAC-LC, 48000 Hz, 2 ch, 381 kbps | AAC-LC, 48000 Hz, 2 ch, 317 kbps |
| Duration | 288.235000 s | 288.235000 s |
| Full decode | 8,647 video frames decoded, 0 errors | 8,647 video frames decoded, 0 errors |
| Loudness (encoded audio) | -16.0 LUFS integrated, true peak -1.3 dBTP, LRA 2.5 LU | -16.0 LUFS, -1.3 dBTP |
| Sync vs `mix.wav` | lag 0.0 ms, correlation 0.9999 | lag 0.0 ms, correlation 0.9999 |
| Metadata tags | container: major_brand=isom, minor_version=512, compatible_brands=isomiso2avc1mp41, encoder=Lavf61.7.100, comment=Made with Remotion 4.0.533; streams: handler_name=SoundHandler, handler_name=VideoHandler, language=und, vendor_id=[0][0][0][0] | container: major_brand=isom, minor_version=512, compatible_brands=isomiso2avc1mp41, encoder=Lavf61.7.100, comment=Made with Remotion 4.0.533; streams: handler_name=SoundHandler, handler_name=VideoHandler, language=und, vendor_id=[0][0][0][0] |

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
1200 dpi for it). Render times on this 4-CPU machine: 1080p ≈ 15 min, 4K ≈ 36 min.

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
