# QA report: Video 01, pass 2 — "Why AI Is So Confidently Wrong"

Status: **pass-2 master rendered three times; the third render carries every fix found in the first two.** Every statement
below records only checks that were run, with their results. Where a check could not be run, it says so.

## Limits of this inspection (read first)

- **Nobody watched the film in real time or listened to any audio.** The production agent has no audio perception and
  no real-time playback. Motion and timing were checked through frame sampling and contact sheets, word-level timing
  data and automated detectors. Audio was checked with loudness meters and signal measurements, not by ear.
- **The narration was not blind-transcribed this pass.** Pass 1 ran Scribe on the final takes as plain audio
  (0.4 % word error rate). Pass 2 used forced alignment, which confirms the timing of every word in the prompt but
  cannot detect a mispronunciation. The IPA for "Kalai" (kuh-LIE) is in every prompt that contains the name.
- A human should watch the whole film at normal speed with sound, on headphones and on a phone, before publishing
  (`DELIVERABLES.md` has the checklist).

## What was checked

### Script and facts

| Check | Method | Result |
|---|---|---|
| Every claim and label has a source | `research/sources.md`, 25 rows, each pointing at a pass-1 ledger row with the verbatim quote | OK. No claim rests on a SEARCH-ONLY source. The IMO/DeepMind and Anthropic material is gone. |
| Must-not list | 27 items carried from pass 1, re-read against the 36 segments and every on-screen string | OK. "A different title", "not necessarily more correct", "the ten they checked", "training exposure is unknown" are all in place. |
| Model labels and dates | Every slip shows model, version and date (GPT-4o · 9 May 2025; R1 · 9 May 2025; 4 Scout · 9 May 2025); the S1 chip says "no web search" | OK |
| Illustrative numbers labelled | Scorer: "illustrative numbers"; quiz: "illustrative quiz · expected scores"; add-on modules: "simplified diagram"; the made-up slip: "simplified illustration" | OK |
| Anonymity | Searched every `.md .json .ts .tsx .srt .csv .py` under `Future_Got_Weird/` for the owner's name, initials branding, the school, the portfolio and the other brands named in the brief; checked the MP4's format tags | 0 hits. The MP4 carries only `encoder` and a Remotion `comment` tag; no author, no title with a name. |

### Narration

| Check | Method | Result |
|---|---|---|
| Alignment | Scribe forced alignment on the pinned take of each of the 10 blocks; every aligned word matched 1:1 to the prompt words in `tools/el_assemble.py` | All 10 blocks match. Every segment cut lies inside a pause. |
| Take consistency | `tools/eval_takes.py` / `eval_blocks.py` (parselmouth: F0 range, HNR, pause floor, loudness) on 40 takes | One take per block chosen for the flattest pitch range and lowest pause floor; selected takes within 2 dB of each other before gain-matching. `audio/narration/elevenlabs/selection.json`. |
| Pace | `tools/build_timeline.py` | 694 words in 280.8 s: 148 words per minute overall. Hook complete at 0:12, title at 0:30, mechanism from 0:44, quiz at 2:23. |
| Cues | `tools/check_cues.py`, `npx tsc --noEmit` | OK, OK (run after every scene edit). |

### Sound

| Check | Method | Result |
|---|---|---|
| Mix | `tools/mix.py` report and ffmpeg `ebur128` on the master | **−16.0 LUFS integrated, −1.3 dBTP, LRA 3.5 LU.** Voice 17.2 dB over the music during speech; music in speech gaps at −33 dBFS RMS. |
| SFX levels | 50 ms RMS maximum around each of the 193 cues on the stems (`qa/sfx_levels.json`) | Stamps about 17 dB under the voice; taps, slides, markers, paper 24–29 dB under; tiles and tocks about 30 dB under; wipe whooshes in speech gaps at about −44 dBFS; the title hit 9 dB under the voice and almost entirely sub-bass. |
| Music bed | measured before mixing | −38.1 LUFS, peak −22.8 dBFS, LRA 8.5 LU; no clipping in the FluidSynth render. |
| SFX choices | measured envelopes, spectra and tonality of all 12 new candidates | See `audio/sfx/elevenlabs/SELECTION.md`. One candidate (`stamp_v1`) was a pure-tone click and was rejected. |

### Picture

| Check | Method | Result |
|---|---|---|
| Scene check frames before the render | 60+ half-scale stills across all ten scenes (`qa/dev/`, local) | 14 layout fixes before the first render (`CORRECTIONS.md`). |
| First full render, scene by scene | 1-fps contact sheets for every scene (`qa/frames/sheet_S*.jpg`), five full-resolution frames around every scene boundary (`sheet_boundaries.jpg`), full-size spot frames | Five faults found and fixed: S3 panel clipped at the left; S6 arithmetic box off the right edge; S7 evidence labels covering table text; S10 end card static for 5.2 s; thumbnails A and C clipped. |
| Second full render | Same sheets regenerated from the fixed master; `freezedetect` (≥ 4 s, n = 0.0005) and `blackdetect` (≥ 0.25 s) on the master | All five fixes confirmed in the sheets; detectors clean. One cosmetic fault found: the S6 arithmetic box was drawn at full width before its terms appeared (an empty dark bar for two seconds). Fixed; third render. |
| Determinism | Three frames (517, 5672, 7209) rendered twice in separate processes with `stills.mjs` | Byte-identical (same MD5, zero pixel difference). No wall-clock or unseeded randomness in the scenes. |
| Scene boundaries | Frames f−2 … f+2 at all nine cuts | Each cut is a 12-frame paper wipe; the outgoing scene is fully drawn under the wipe; no empty frame, no flash. |
| Phone legibility | 360 px crops of 11 key frames (`qa/frames/phone/`) | Headlines, chips, slips' highlighted words, tiles and scores read at that size. Table 2 body text does not (expected for a real table); the tally and highlights carry it. |
| Evidence images | Source sizes vs drawn sizes | Every crop is drawn smaller than its source pixels at 1080p and at 4K (sources 3,264–4,080 px wide). Nothing is upscaled. |
| Fast start, decode | `tools/finalize.sh` | `moov` before `mdat`; full decode with no errors. |

### Third render (current master)

| Check | Result |
|---|---|
| Loudness | −16.0 LUFS, −1.3 dBTP (audio unchanged between renders) |
| Black frames ≥ 0.25 s | none (the end fade is 22 frames, deliberate) |
| Frozen video ≥ 4 s | none detected (the first render had one, on the end card; fixed) |
| Native 4K master | 3840×2160, 8,425 frames, BT.709, 80 MiB; −16.0 LUFS, −1.3 dBTP; no black or frozen video detected (`qa/tech_Future_Got_Weird_Video_01_Pass_2_4K.md`). Spot frame 5640 checked at 1:1 against the 1080p composition. |
| Fixed frames re-checked by still | S3 1:10 panel fully inside the frame; S6 3:03 "6 + 1 − 1 − 1 − 1 = 4" complete above the score; S7 3:16 table with no covering labels; S10 end card words popping on their cues |

## Known soft spots (not faults, but things a human should judge)

- **Scene 6 opening (2:23–2:30):** the host alone on a wide curtain for seven seconds while the question is set up.
  The host gestures and talks; the sign lands on "graded."
- **Scene 9 opening (3:42–3:45):** the fact-checker in front of an empty corkboard for three seconds before the sign
  lands. Intended as a beat of calm after the game show.
- **Sound density:** 193 cues in 281 s. The tile clicks (25) and stamps (11) are the ones most likely to feel too
  frequent on a listen.
- **Static seconds:** at 1 fps, 15–19 consecutive-second pairs in S3, S6 and S10 differ by less than 0.5 mean
  pixel levels (held compositions while the narration continues). None exceeds the 4 s detector threshold after the
  end-card fix.

## Files this report refers to

`qa/tech_Future_Got_Weird_Video_01_Pass_2_1080p.md` (ffprobe, fast start, loudness, detectors, decode),
`qa/frames/` (contact sheets, boundary frames, phone crops, `frame_stats.json`), `qa/clips/` (three motion-test
excerpts: the opening, the game show, the end card), `qa/sfx_levels.json`, `qa/CORRECTIONS.md`, `qa/determinism/`
(local).
