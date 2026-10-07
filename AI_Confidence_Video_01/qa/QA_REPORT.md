# QA report: Video 01, "Why AI Sounds Right When It's Wrong"

Status: **work in progress.** The sections below record only checks that were actually performed.

## Limits of this inspection (read first)

- **I could not watch the film in real time or listen to any audio.** The production agent has no audio
  perception and no real-time playback. Motion and timing were checked through frame sampling and contact sheets,
  word-level timing data, and automated detectors. Audio was checked with loudness meters, spectrograms,
  an offline speech-recognition pass and signal measurements, not by ear.
- A human should still watch the whole film at normal speed with sound, on headphones and on a small speaker,
  before publishing.

## Checks performed so far

| Area | Check | Result |
|---|---|---|
| Pipeline | 3 s smoke render with audio | OK: 1920×1080, 30 fps, H.264, AAC 48 kHz stereo |
| Pipeline | 30 s test section (voice, visuals, music, SFX) | Rendered. The detectors found two static holds (5.9 s, 4.2 s) and a near-empty first 3 s. **Fixed**: kicker and model chips, earlier type-on, read-along highlight, slow push |
| Script facts | Adversarial check of sources.md (35 claim rows) | 17 table fixes. 5 script lines tightened (s05, s06, s08, s21, s35) |
| Animation cues | `tools/check_cues.py`, which checks every cue word against the spoken words | OK after fixing 2 cue words removed by script edits |
| Narration | Offline ASR (whisper-tiny) vs script | ~7.8% word error rate. Every missed span was checked and contains speech energy. G2P phonemes for Claude, Anthropic, PhD, guesser and the years are correct. "Kalai" uses forced phonemes /kəlˈI/ |
| Mix | ffmpeg ebur128 on the final mix | -16.0 LUFS integrated, -1.3 dBTP true peak, LRA 1.8 LU. Voice sits 16.7 dB over the music during speech |
| Stills | About 45 key frames across all acts reviewed by eye | Layout fixes: token-strip overflow, fly-in target, label overlaps, crop edges, diagram rebuilt |
