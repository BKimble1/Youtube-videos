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
| Full render v1 (review) | 5:00.1, 1080p30. The ffmpeg detectors found no frozen video ≥4 s; the only black is the intended 0.33 s fade at the end | Sheets in `qa/review_v1/` |
| Multi-agent frame review of v1 | Seven independent reviewers: one per act plus story/pacing. They checked 1-fps contact sheets against the script, sources.md and the design rules | 70+ findings. Every medium/high finding was fixed or answered (see below) |

## Review findings fixed before the v2 render

Accuracy and labels:
- The IMO score now reads "Reported: 35/42", with an attributed source line.
- "Fabrication" was renamed "Invented titles".
- The DeepSeek-V3 birthday card is labelled as a different model from Table 1.
- Claim cards and source lines carry "May 9, 2025, no web search".
- "Claude 3.5 Haiku" is hedged ("per Anthropic's summary").
- The checklist now reads "Kalai's real CMU thesis exists" and "different title, 2001 not 2002", so it can't be read as saying the invented thesis exists.
- "likely ≠ true" became "likely isn't the same as true", so it can't be read as "likely means false".
- The "9/10" card is qualified: "of the benchmarks the authors checked · mid-2025 snapshot".
- "GPT-4o" and "o200k_base" are no longer forced to all caps.
- The s01 narration now matches the quoted prompt exactly (dropped "PhD").

Cue and sync bugs:
- Two cues pointed at the *first* occurrence of a repeated word: "Six" in s24 and "Ask" in s37. Honest's score and the final headline therefore appeared 2–3.5 s early. Fixed with occurrence-specific cues.
- The "higher score" badge stayed on the losing score for about 1 s. Fixed.
- The equation revealed "= 4" before narration. It now builds term by term.

Empty or static stretches:
- About 4 s of empty frame before the birthday example.
- A blank start to the quiz.
- A 6 s static question card. A word field now builds behind it.
- A sparse tools panel and a sparse ring diagram.
- 1–1.5 s gaps in the payoff.

Layout:
- Overlapping captions (Kal+ai / "each token is a number").
- Misregistered highlight boxes, now placed from PDF word coordinates (pdftotext -bbox).
- Comparison cards, now on one row grid.
- Ghosted crossfades, now sequential.
- Back cards in the Einstein stack showing text.
- An overlapping word cloud.
- Label collisions.
- An off-centre type-on.
- The workbook crop.
- The loop arrow.

Diagram logic: the Anthropic redraw now passes through a coherent default state ("Familiar name? checking…" → "I can't answer" → "I don't know"). Only then does the familiar-name signal switch it off.

Ending: the end card now has a 5.2 s tail, held about 3 s at full opacity. The runtime stays under 5:00 (4:59.5) because long pauses were trimmed.

Subtitles: two sub-1-second flash cues were merged. The file now has 112 phrase cues, each ≤ ~45 characters per line and ≥ 0.9 s.
