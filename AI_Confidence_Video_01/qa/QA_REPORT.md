# QA report: Video 01, "Why AI Sounds Right When It's Wrong"

Status: **v6 final (ElevenLabs narration).** The v6 section directly below is the current one. Older sections document the v1–v5 draft cuts; their fixes carry into v6. Every section records only checks that were actually performed.

## Limits of this inspection (read first)

- **I could not watch the film in real time or listen to any audio.** The production agent has no audio
  perception and no real-time playback. Motion and timing were checked through frame sampling and contact sheets,
  word-level timing data, and automated detectors. Audio was checked with loudness meters, spectrograms,
  an offline speech-recognition pass and signal measurements, not by ear.
- A human should still watch the whole film at normal speed with sound, on headphones and on a small speaker,
  before publishing.

## v6 final (ElevenLabs narration): checks performed

### What changed from v5

| Area | Change |
|---|---|
| Narration | The Kokoro draft is replaced by ElevenLabs Eleven v4, voice "Marcus K", chosen from a 3-voice audition (see `audio/narration/elevenlabs/auditions/AUDITION_REPORT.md`). It was generated in 12 blocks × 4 takes. Each take was scored (pace, pauses, F0 range, HNR, noise floor, loudness, Whisper WER) and the best per block was picked. The takes were cut into 39 segments at the quietest point inside each pause, using Scribe forced alignment. |
| Script | Two lines changed, both to resolve the DeepMind claim (s06, s07). Every other line is word-for-word the v5 script. |
| Timing | Rebuilt per segment from the real voice. Each segment's designed pause is kept unless the voice's own pause is already longer, so there is no uniform stretch. The runtime is **5:18.5** (v5: 4:59.5). Three scenes were re-laid to centre against the new timing: S2 score panel, S3 comparison columns, and the s28 "Guessing pays." hold. |
| Visuals | The S1 contrast panel is rebuilt around a 300 dpi crop of the real DeepMind solutions PDF (P1–P5 marked "SOLUTION", P6 "NOT INCLUDED"). The draft watermark disappears automatically with the ElevenLabs engine. |
| Sound | Six ElevenLabs sound effects are added (26 placements, each synced to its motion). The token ticks are raised 6–8 dB. The music bed is regenerated from the new timeline. |
| Files | Final names, with no "DRAFT" in them. |

### Results

| Area | Check | Result |
|---|---|---|
| Narration accuracy | ElevenLabs Scribe, **blind** (each selected take uploaded as a plain audio file, with no access to the script) | **0.4 % WER** overall (`audio/narration/elevenlabs/scribe_blind_final.json`). "Kalai" and "Kalai's" are recognised correctly. |
| Narration alignment | Forced-alignment words vs prompt words, checked 1:1 in `tools/el_assemble.py` | All 12 blocks match. Every segment cut lies inside a pause (8 ms fades), so no word is clipped. |
| Narration consistency | Per-take metrics of the 12 selected takes (`takes/eval_blocks.json`) | F0 range 12.0–15.3 st, HNR 7.3–8.7 dB, pause floor −57 to −62 dBFS. Loudness spread 2 dB before gain-matching; every block is matched to −24 LUFS. |
| Pace | `tools/build_timeline.py` | 785 words in 318.5 s: **148 wpm overall, 163 wpm while speaking** (v5: 772 words in 299.5 s, 155 wpm overall) |
| Cues | `tools/check_cues.py`, `npx tsc --noEmit` | OK, OK |
| Facts | DeepMind claim (s06) | **Resolved by revision.** Primary pages were still unreachable, so gold, score and grading are removed. The narration states only what the opened PDF shows. See `research/sources.md` row A3-final. |
| Facts | Changed lines re-checked against sources | s06 matches the PDF (title "Gemini Deep Think for International Mathematical Olympiad 2025"; Problems 1–5 present, no Problem 6). s07 "take on olympiad problems" makes no claim of correctness. |
| Image resolution | New asset `imo2025_solutions_p01.png` | 1790×1300 source, drawn 720 px wide at 1080p and 1440 px at 4K. That is downscaled in both, so nothing is upscaled. The rest are unchanged from the v5 audit below. |
| Mix | `tools/mix.py` + ffmpeg ebur128 on `audio/mix/final_mix.wav` | **−16.0 LUFS integrated, −1.3 dBTP, LRA 2.9 LU.** Voice sits 17.3 dB over the music during speech, and music in speech gaps is −34 dBFS RMS. Music ducking (8 dB) now looks ahead 120 ms and holds for 300 ms, so the music is already down when a phrase begins and doesn't swell between phrases. In the speech band (300 Hz–4 kHz, 200 ms frames of active speech), the voice is over music/SFX by a median of 16.8 dB, 8.4 dB at the 5th percentile, and 3.5 dB at the minimum (before look-ahead the minimum was −0.8 dB, on first syllables). The limiter touches only 15 brief voice peaks, each 20–110 ms, with at most 3.4 dB of gain reduction. |
| SFX levels | 50 ms RMS around each cue, from the stems (`qa/sfx_levels.json`) | Under speech, effects sit 17–28 dB below the voice. The title hit (sub-bass) is about 6 dB below the voice on "wrong". The whooshes all fall in narration gaps. |
| Subtitles | `script/subtitles_elevenlabs.srt` (copied to `exports/Video_01_AI_Confidence.en.srt`) | 114 cues, ≤2 lines, ≤45 characters per line, no overlaps, mean 15.2 characters/s. Two cues reach 22 characters/s where the next phrase follows within 0.1 s. Cues now linger up to 0.6 s into pauses. |
| Frames | 16 key stills plus the S1→S2 hand-off (opening, every scene cross-fade, title, ending, last frame) at 1/3 scale | No layout problems found. The S1→S2 hand-off has a deliberate dip to the background of about 5 frames (under the whoosh). The first frame shows the layout, with the question typed on as it is read. |

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
- The IMO score was attributed ("Reported: 35/42") with a source line. In v4 the score was removed entirely (see the v3 verification below).
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

## Delivered 1080p (v5): technical verification (measured on `exports/Video_01_AI_Confidence_Final_1080p_DRAFT-NARRATION.mp4`)

The v3 and v4 renders gave identical measurements. v4 and v5 changed only visuals, so the audio is bit-identical.

| Check | Tool | Result |
|---|---|---|
| Container, codecs | ffprobe | MP4, H.264 High, yuv420p, BT.709 primaries/transfer/matrix, TV range, 1920×1080, 30/1 fps (constant) · AAC-LC 48 kHz stereo, 317 kb/s · 104.1 MB (CRF 16, x264 slow) |
| Duration | ffprobe | 299.52 s (4:59.5). The audio mix is 299.50 s, so A/V lengths match to within 1 frame |
| Fast start | top-level atom scan | `ftyp, moov, free, mdat`, so moov comes before mdat ✓ |
| Loudness | ffmpeg ebur128 (true peak) | **-16.0 LUFS integrated**, LRA 1.8 LU, **true peak -1.3 dBTP** ✓ |
| Black frames | blackdetect (≥0.25 s) | Only 299.13–299.47 s, the intended final fade to black |
| Frozen video | freezedetect (≥4 s, n=0.0005) | None |
| Decode integrity | full ffmpeg decode | No errors |
| Narration stem | ebur128 | Re-exported with headroom: -20.7 LUFS, -1.5 dBTP (mono, 24-bit). The first export clipped (+0.2 dBFS) and was caught and fixed |
| Subtitles | custom checker | 112 cues, built from the engine's word timings for this exact audio. None shorter than 0.9 s; lines ≤ ~45 characters |
| Animation cues | tools/check_cues.py | Every `at(segment, word)` cue resolves |

## v3 verification review (regression check before locking the cut)

Three independent reviewers covered S1+S2, S3+S4 and S5+S6. They worked from the v3 contact sheets (`qa/review_v3/`) and from full-resolution frames pulled from the v3 render.

**Confirmed fixed:** 52 of the earlier review fixes were confirmed on screen (21, 20 and 11 per reviewer).

**Not fully landed or newly introduced, all fixed for v4:**

| Time (v3) | Severity | Finding | v4 fix |
|---|---|---|---|
| 1:20.6–1:28.0 | medium | Birthday excerpt held about 7.4 s with nothing changing (a side effect of the earlier empty-frame fix) | Empty "Attempt 1/2/3 · ??-??" cards appear on "differently". A teal box marks "If you know, just respond with DD-MM." on "only if you know". The wrong dates fill the cards on "three different dates". Slow push on the excerpt |
| 1:51.5–1:58.4 | medium | Word field: "Machine Learning" overlapped a dim "Learning" ("Machine Learningrning"); edge words clipped during the push | New layout: rows filled left to right with estimated widths and a minimum gap, then justified. Each row drifts as a unit, and margins allow for the drift and push. No overlaps (checked on stills) |
| 0:31–0:39 | low (accuracy) | "35 / 42" and the P1–P5 ticks were search-only (sources.md rule 27) | Removed. The panel now shows only what the opened solutions PDF supports: "Written solutions published (PDF): P1–P5" (no ticks, no grading), then "Reported by Google DeepMind: gold-medal standard". "Advanced version" (search-only) also removed |
| 4:29.2 | medium (accuracy) | "more consistent ≠ more correct" dropped the required hedge and stranded "correct" | "More consistent, / not necessarily more correct" (deliberate break). sources.md A5 updated |
| 0:29.7–0:30.6 | low | "Lead author" tag readable for only about 0.6 s | Tag lands on "He's"; the split screen arrives after it (about 1.8 s readable) |
| 0:35–0:39, 1:44 | low | Widows: "standard", "· Right:", "token." | Deliberate line breaks |
| 0:45.3–0:47.0 | low | "It writes what's likely." sat off-centre until the second sentence appeared | Two centred lines |
| 2:37.5 | low | "and" underlined as invented, but it is shared with the real title | Marked as a shared word |
| 2:39.5 | low | Thesis date box touched the report-number line | Box tightened from pixel-measured line bands; crop slightly larger |
| 3:27.6–3:33.4 | low | Table 2 held 5.8 s while the narration says "guessing pays" | Callback chip "Our quiz under these rules: Guesser 7 > Honest 6 / Guessing pays." plus a slow push |
| 3:45.8 | low | "Check the record." appeared about 1.5 s before it is spoken | Cued to "move:", held longer; the thesis enters after it |
| 4:01.9–4:03.5 | medium (carry-over) | Paper reference card too small to read in about 1.6 s | Shown as a readable quoted citation (serif, 24 px) together with "Is there a real source?", on screen about 3 s |
| 4:03.6–4:07.3 | low | Three dips in 4 s; Anthropic figure up only about 1.9 s; credit line flickered during a dip | Article header and Fig. 7 on one card, one transition to the redraw (about 3.4 s); credit switches only at that cut |
| 4:09.7–4:10.6 | low (carry-over) | Facts → "I don't know" drawn bright for about 0.9 s before "switches off" | That path stays dim until the inhibition line has drawn |
| 4:12.5–4:21.2 | low (carry-over) | Arrowhead into "Facts" read as pointing up; the arrow cut the coral pill | Narrower arrowheads; pill moved clear |
| 4:37.25 | low | Last ghosted crossfade (question vs. answer rows) | Sequential |
| 4:45.4–4:46.6 | low | Strike-through stub read as a stray hyphen | Hidden until the strike starts drawing |

Not changed, and why:
- The "never?" chip (about 0.7 s) is limited by the narration's pace.
- The "−" signs in the equation are already true minus signs (U+2212).

Each fix was checked on full-resolution stills at the exact narration cue (`source/stills.mjs`). `tools/check_cues.py` and `tsc` pass. The audio did not change: no SFX or music cue depends on the moved visuals.

## Final regression check of v4, and v5

Two reviewers re-checked the v4 render at every v4 fix time. They used the v4 sheets (`qa/review_v4/`) and full-resolution frames.

**Confirmed:** all 18 v4 fixes landed, with timings measured against the narration words. Both reviewers found no new problems introduced by v4.

They raised two low-severity carry-overs from earlier versions. Both were fixed in v5, the delivered cut:

| Time | Finding | v5 fix |
|---|---|---|
| 1:28.9–1:30.2 | An 82-character caption was fully visible for only about 1.2 s before the cut | Shortened to "Real date: autumn (per the paper)". The teal boxes in the excerpt carry the rest |
| 2:16.6–2:20.6 | The assembled ChatGPT title held nearly static for about 4.0 s. Only the slow push was moving; the strict freeze detector did not fire | On "usually looks like", a muted underline sweeps across the title words that also filled the earlier pattern field (Boosting, Online, Algorithms, Topics in, Machine Learning) |

Both were checked on full-resolution stills at the narration cue.

## Resolution audit (no upscaled real assets)

For every real image, the largest drawn width (CSS width × every push and zoom × the 2× render scale of the 4K master) was compared against the source width. Sizes come from `source/public/img/`.

| Asset | Source width | Max drawn, 1080p | Max drawn, 4K master | Status |
|---|---|---|---|---|
| Paper crops (p.1 header, birthday, Fig. 1, Einstein, Table 2, instruction) | 3700–4000 px (600 dpi) | ≤ 1600 px | ≤ 3200 px | native |
| Thesis title page / title block | 4080 / 3264 px | ≤ 860 / 770 px | ≤ 1720 / 1540 px | native |
| 1929 test-booklet photo (framed) | 3394 px | ≈ 790 px | ≈ 1570 px | native |
| 1912 library photo (full-bleed) | 3840 px | 1920 px | ≈ 3850 px (scene push ≤ 0.3%) | native: the zoom was replaced by a vertical pan |
| Anthropic article header | 3200 px | ≈ 815 px | ≈ 1630 px | native |
| Anthropic Fig. 7 | 1650 px | ≈ 815 px | ≈ 1630 px | native: the card was reduced from 1000 to 780 px for this |

Before this audit, the 4K master would have drawn Fig. 7 at about 1.27× and the library photo at up to about 1.14×. Both were fixed in v5. The 1080p cut was native throughout.

**v5 delivered file check:** frames pulled from the finalized MP4 at 1:29.6, 2:17.8, 3:45.5 and 4:05.0 show all four v5 changes: the short caption, the pattern-word underline sweep, the library pan at native scale, and the 780 px Anthropic card. The technical checks match v4: -16.0 LUFS, -1.3 dBTP, faststart, no freezes; the only black is the 0.33 s end fade.

## 4K master (v5): technical verification (`exports/Video_01_AI_Confidence_Master_4K_DRAFT-NARRATION.mp4`)

The master is the same composition rendered at `--scale=2` (vector text and graphics redrawn at 2×), encoded with x264 medium at CRF 16.

| Check | Result |
|---|---|
| Container, codecs | MP4, H.264 High@5.1, yuv420p, BT.709, 3840×2160, 30/1 fps · AAC-LC 48 kHz stereo, 317 kb/s · 262.3 MB |
| Duration | 299.52 s (identical to the 1080p) |
| Fast start | `ftyp, moov, free, mdat` ✓ |
| Loudness | -16.0 LUFS integrated, LRA 1.8 LU, true peak -1.3 dBTP (same audio as the 1080p) |
| Black / frozen | Black only at 299.10–299.47 s (the end fade); no frozen video ≥ 4 s |
| Decode | Full decode with no errors |
| Visual spot-check | Native-pixel crops of the token strip, the Anthropic card and the 1929 booklet are sharp. No asset is drawn above its source resolution (see the resolution audit) |

Details: `qa/tech_Video_01_AI_Confidence_Master_4K_DRAFT-NARRATION.md`.
