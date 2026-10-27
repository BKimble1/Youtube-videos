# Final master QA: Robots Are Learning to Copy Our Faces

27 Oct 2026. Not published.

**File:** `exports/FGW_Robot_Faces_FINAL_MASTER_3840x2160.mp4` (1,385,837,627 bytes)
SHA-256 `45fb0469eb645b217de43a68f16bee4c248fe1a48959cbc5909aa32359d89bda`

Rendered natively at 3840×2160 from the Remotion source: composition `RobotFacesFinal`, rendered with `--scale=2` from
the vector scenes. It is not an upscale of a 1080p file. Every element of the film is vector (SVG) art drawn at the
output resolution; there is no raster footage in it.

## Changes from V5 (final polish only)

- **Opening, 0–2.5 s.** Frame 0 is low, slightly canted and tight on the robot mid-copy, with his face large at the
  right edge. The shot levels into the two-shot.
- **Mechanism in the hook.** As the robot gives back each of his faces, its silicone clears over the motors making
  that face, and only those:
  - jaw and brows for the shock;
  - brows and lids for the glare;
  - corners and cheeks for the grin.

  The expression timing and the narration are unchanged.
- **1:01, "Move these motors, get this mouth shape."** The third close-up of the reflection is replaced by the mirror
  seen from beside the robot, its head in the foreground and the motors showing in the glass.
- **2:02, "The movements still had flaws."** The extra mouth close-up is replaced by a push-in from the stage to its
  mouth.
- **Nothing else changed.**

## Export checks (ffprobe, on the final file)

| Item | Value |
|---|---|
| Video | H.264 High, 3840×2160, 16:9, yuv420p, BT.709 (primaries, transfer, matrix) |
| Frame rate | 30/1 constant (r_frame_rate = avg_frame_rate = 30/1) |
| Frames | 6,400 |
| Video bitrate | 51.7 Mb/s (target 50 Mb/s) |
| Audio | AAC-LC, 48 kHz, stereo, encoded at 320 kb/s nominal; measured average 270 kb/s (see below) |
| Duration | 213.333 s (3:33.333), equal to the narration master |
| Fast start | yes: the `moov` atom is before `mdat` |

On the audio bitrate: the stream was encoded with `-b:a 320k`. FFmpeg's built-in AAC encoder spends fewer bits where
the signal does not need them, so the measured average comes out at 270 kb/s.

## Decode and picture

- **Full decode:** the whole file decoded from first frame to last with FFmpeg, with no errors.
- **Black frames:** none.
- **Frozen frames:** no stretch of 2.5 s or more.
- **Every second read** from the 4K file itself (`qa/final/sec_01.png` … `sec_08.png`). No missing assets, layer
  errors, placeholders or watermark were found.
- **The first 12 s at quarter-second steps** (`qa/final/opening_quarter_seconds.png`). The copied expressions and the
  motor reveals read correctly.
- **Source scan:** no invalid SVG values in any of the 6,400 frames (`qa/v6_nan_scan.txt`).

## Audio and narration

- The narration is the approved ElevenLabs file, unchanged: same words, order, voice and timing.
- Loudness: −14.2 LUFS integrated, LRA 3.4, −1.4 dBTP true peak.
- No clipping: no samples at or above 0.99.
- Sync: the audio matches the narration at a 0 ms lag (r = 0.92).
- Captions: 67, each on a measured word onset, with no overlaps.
- **Clicks:** the five largest sample-to-sample jumps all fall on narration consonants (the same jumps appear in the
  narration file alone). They are not clicks or pops.
- **Silence:** there is no silence of 0.5 s or more. The quietest second (2:11) is the narrator's pause between two
  sentences, held up by the music and the room tone.
- The mix was not changed in V6.
- Full results: `qa/final/master_qa.json`.

## Known limitations

- **Not watched or heard in real time.** There is no playback in this environment; every check above is a frame read
  or a measurement.
- **Runway was not used.** Its output host is denied by this environment's network policy, so every scene is drawn
  vector art.
- **Rig limits.** The cast rig has no walk cycle and no back view, so people lean and gesture rather than walk.
- **Audio bitrate.** The measured average is 270 kb/s, below the 320 kb/s requested, for the reason given above.
