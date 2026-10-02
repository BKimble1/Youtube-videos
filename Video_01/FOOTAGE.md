# Video 01 - "Proving What I Know" #1: footage location

The footage is **not in git**. It lives on the editing PC under:

```
C:\Users\Admin\Videos\Youtube Videos\Video_01\
  raw\       originals (never modified)
  exports\   phone / editor exports (empty as of 2026-10-02)
  review\    smaller review copies made by scripts/prepare_review.py
```

## Originals

Two separate takes, recorded about a minute apart. Both are kept; the edit hasn't picked one yet.

| File | Size | CRC32 | Length | Recorded | Where |
|---|---|---|---|---|---|
| `IMG_6102.MOV` | 1,863,108,120 bytes | `bde11bc8` | 9:36.470 | 2026-10-01 21:23:48 -04:00 | `raw\IMG_6102.MOV`, plus a byte-identical copy inside the zip |
| `IMG_6103.MOV` | 2,223,590,138 bytes | `4fbf759e` | 10:11.827 | 2026-10-01 21:34:42 -04:00 | inside the zip; extracted on 2026-10-02 to `raw\IMG_6103.MOV` (CRC verified) |

Zip: `raw\iCloud Photos from Blake Kimble (3).zip` (4,087,328,245 bytes; the iCloud download, left as-is).
`exports\` was empty on 2026-10-02, so neither file there is an "original".

## What the recordings are (ffprobe)

| | IMG_6102 | IMG_6103 |
|---|---|---|
| Camera | iPhone 16 Pro, iOS 26.6 (Cinematic-video flag set) | same |
| Video | HEVC Main 10, 3840x2160 stored, 10-bit 4:2:0, 25.2 Mb/s | same, 28.5 Mb/s |
| Frame rate | 29.97 fps nominal (30000/1001). Timestamps on Apple's 1/600 s clock, each frame 20 or 21 ticks, 29.98 fps average. 17,283 frames | same; 18,343 frames |
| Colour | HDR: HLG (ARIB STD-B67), BT.2020, plus Dolby Vision profile 8.4 (HLG-compatible base) | same |
| Orientation | Pixels are upright **landscape**. The file's rotation flag says -90 (portrait), which is **wrong**: honouring it turns the picture sideways. Review copies ignore it. | Upright landscape, no rotation flag. Framing is tight at the top (hair/forehead cut), eyes fully in frame. |
| Audio track 1 | AAC-LC stereo 48 kHz, 126 kb/s: **used for all review copies** | same |
| Audio track 2 | Apple APAC spatial audio, 5 ch, 475 kb/s: FFmpeg can't decode it; not used | same |
| Other tracks | 2 Apple metadata tracks (`mebx`) | same |
| On camera | ~0:20 to ~9:05 (sits down / gets up to stop) | ~0:08 to ~10:05 |

## How the review copies were made

`scripts/prepare_review.py` reads [`footage.json`](footage.json) and writes `review\<id>\`:

- **Unedited.** No pauses cut, nothing reordered, no music, no eye correction.
- **Colour:** HLG/Dolby Vision tone-mapped to SDR BT.709 (libplacebo on the GPU, static per-frame
  mapping so the full copy and the clips match). HDR side data is stripped, so players don't show it washed out.
- **Orientation:** IMG_6102's wrong rotation flag is replaced with "no rotation"; outputs carry no rotation flag at all.
- **Timing:** every original frame timestamp is kept (no frame-rate conversion, same 1/600 s clock).
  The full copy's audio is the original AAC track copied bit-for-bit. Clips and samples re-encode the
  same track to AAC so cuts are sample-accurate.
- **Video:** H.264 High, yuv420p. Full copy CRF 20; clips CRF 21 with a bitrate ceiling that keeps
  each under 25 MB; samples CRF 17 at the original 3840x2160, level 5.1.

`scripts/verify_review.py` re-checks everything (results below).

## Review files

Folder: `C:\Users\Admin\Videos\Youtube Videos\Video_01\review\<id>\`. Times are positions in the
original. Each clip holds exactly the original frames with start <= t < end, so every frame is in exactly one clip.
Each folder also has `<id>_index.csv/.md`, `<id>_verification.json` and `<id>_verify_frames.png`.

### IMG_6102 (`review\IMG_6102\`)

| File | Start | End | Size |
|---|---|---|---|
| `IMG_6102_full_720p.mp4` | 0:00:00.000 | 0:09:36.470 | 115.8 MB |
| `IMG_6102_part01_of_05_00m00s-02m00s.mp4` | 0:00:00.000 | 0:02:00.000 | 19.5 MB |
| `IMG_6102_part02_of_05_02m00s-04m00s.mp4` | 0:02:00.000 | 0:04:00.000 | 17.6 MB |
| `IMG_6102_part03_of_05_04m00s-06m00s.mp4` | 0:04:00.000 | 0:06:00.000 | 18.7 MB |
| `IMG_6102_part04_of_05_06m00s-08m00s.mp4` | 0:06:00.000 | 0:08:00.000 | 18.9 MB |
| `IMG_6102_part05_of_05_08m00s-09m36s.mp4` | 0:08:00.000 | 0:09:36.470 | 15.3 MB |
| `IMG_6102_sample20s_3840x2160_03m48s-04m08s.mp4` | 0:03:48.000 | 0:04:08.000 | 52.8 MB |

### IMG_6103 (`review\IMG_6103\`)

| File | Start | End | Size |
|---|---|---|---|
| `IMG_6103_full_720p.mp4` | 0:00:00.000 | 0:10:11.827 | 124.6 MB |
| `IMG_6103_part01_of_06_00m00s-02m00s.mp4` | 0:00:00.000 | 0:02:00.000 | 20.0 MB |
| `IMG_6103_part02_of_06_02m00s-04m00s.mp4` | 0:02:00.000 | 0:04:00.000 | 19.8 MB |
| `IMG_6103_part03_of_06_04m00s-06m00s.mp4` | 0:04:00.000 | 0:06:00.000 | 20.9 MB |
| `IMG_6103_part04_of_06_06m00s-08m00s.mp4` | 0:06:00.000 | 0:08:00.000 | 20.9 MB |
| `IMG_6103_part05_of_06_08m00s-10m00s.mp4` | 0:08:00.000 | 0:10:00.000 | 20.4 MB |
| `IMG_6103_part06_of_06_10m00s-10m11s.mp4` | 0:10:00.000 | 0:10:11.827 | 2.1 MB |
| `IMG_6103_sample20s_3840x2160_02m00s-02m20s.mp4` | 0:02:00.000 | 0:02:20.000 | 52.8 MB |

(MB = 1,000,000 bytes. The 25 MB cap is 25,000,000 bytes; the largest clip is 20.9 MB.)

### Verification, 2026-10-02: all checks passed

- Originals unchanged: size and CRC32 still match for both.
- Every file decodes start to finish with no errors. Each is H.264 yuv420p at 1280x720 (samples 3840x2160)
  with no rotation flag, BT.709 SDR tags and no HDR/Dolby Vision side data.
  Audio is stereo AAC 48 kHz, mean level -32 to -37 dB (speech present).
- Full copies hold all 17,283 / 18,343 frames with timestamps identical to the original. Their audio packets
  are bit-identical to the original AAC track.
- Clips: consecutive, frame totals equal the originals, each clip's frame timestamps match the original's,
  and audio sits 0.0 ms from the original at the stated start (same for both samples).
- A middle frame from every file was checked visually: upright landscape, normal colour.
- History: the first run's clip 4 (both takes) included the first frame of clip 5. The script now
  trims on the original's clock. Both clip 4s were regenerated, and the other files' frames were already exact.

### What to upload for review first

1. The two 20 s samples, to compare face framing and teleprompter eye movement between takes.
2. Then the 2-minute clips of the take being reviewed, in order (part01, part02, ...), each under 25 MB.
3. The full 720p copies are for watching end to end, or for tools that accept ~120 MB uploads.

## Regenerate

```bash
python scripts/prepare_review.py Video_01/footage.json --force
python scripts/verify_review.py  Video_01/footage.json
```
