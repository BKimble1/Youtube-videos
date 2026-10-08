# V2 review build — backup

The first full V2 build (all ten scenes rebuilt, commit `5bd35c1` on `claude/new-session-96c7w8`), which comes after
the frozen baseline (`../../BASELINE.md`) and does not change it.

- `Future_Got_Weird_Video_01_V2_1080p_REVIEW.mp4` — the review render: 1920×1080, 30 fps, 8,647 frames, 4:48.2,
  H.264 (CRF 25) + AAC 48 kHz stereo, 50.5 MB, rendered directly from the project (`Main` composition).
- `v2_review_audio.tar` — the audio this build adds or changes over the baseline backup, as sample-exact FLAC with a
  per-file sample hash: `source/public/audio/mix.wav` (the mix the render uses), `audio/mix/v2/` (final mix + stems),
  `audio/music/v2/music_bed.wav` (re-levelled bed), `audio/sfx/v2/sfx_track.wav` + `amb_track.wav` (all 768 cues).

Restore: `sh reconstruct.sh` (joins the parts, checks every SHA-256), then `python3 restore_review_audio.py`.
