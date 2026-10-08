# Video 01 · V3 — QA notes (honest record)

What was checked for the V3 final, how, and what still needs a person. Numbers for the exported files are in
`qa/render/v3_*_verify.json` (from `tools/verify_export.py`) and summarised in `DELIVERABLES.md`.

## Not possible in this environment

- **No audio playback.** Nobody has listened to the V3 audio (or the V2 audio). Everything below about sound is
  measurement: loudness, true peak, speech-band masking per effect, joins, clicks, the stems and a sample-level null
  test against V2. That is not a listening review. The timecoded checklist for a human is
  `qa/V3_LISTENING_CHECKLIST.md` (29 items; the highest-risk ones are the two "Kalai" readings at 0:05 and 2:05).
- **No normal-speed audiovisual playback.** Picture was reviewed as stills, full-resolution frame sequences around
  every risky move, dense 3 fps captioned contact sheets of the whole film and per-frame motion measurements. Sync
  was checked numerically (encoded audio against the mix) and by the narration-keyed cues, not by watching.
- **The three source URLs could not be opened** (arxiv.org, csd.cmu.edu and nature.com are blocked by the
  environment's proxy). The claims were checked against arXiv's own v1 PDF (from arXiv's dataset mirror,
  byte-identical to the pass-1 copy), the Microsoft Research copy of the CMU thesis, and search-index metadata for
  the Nature article. The description cites Nature without volume/pages because those could not be confirmed.

## Inspection before fixing

- Interval-by-interval inspection of the approved V2 render against `V3_BRIEF.md`, one inspector per interval
  (S1, S2, S3, S4, S5, S6, S7, S8+S9, S10): full-resolution frames around every beat, 10 fps sequences over risky
  moves, phone-width (640×360) checks, the scene source for every flagged beat. 43 findings plus KEEP lists:
  `qa/v3_inspect/visual_findings.md`.
- Audio audit of the V2 mix and stems (`qa/v3_inspect/audio/`), claims audit against primary sources
  (`research/CLAIM_LEDGER_V3.md`), packaging audit (`qa/v3_inspect/packaging/`), 4K raster audit
  (`qa/v3_inspect/assets4k/`).

## Verification of the fixes

- Every fix in `V3_CHANGELOG.md` was re-rendered as 1080p stills at the frames listed there and compared with the V2
  frames where the change touched a shared component or a hand-off (S1→S2 cut, S5→S6 iris, S9→S10 match cut, the
  slip art in S1/S2/S3/S9/S10).
- `npx tsc --noEmit -p .` passes after every change.
- Narration timing: `source/src/data/timeline.json` unchanged from V2 (byte-identical); captions regenerated from it
  and checked with `qa/v3_inspect/packaging/check_srt.py` (105 cues; no cue spans two segments, none ends before its
  last word, lines ≤ 42 characters; two cues read at ~20 characters/s because the narration is quick there).
- Audio: cue sheet diffed against V2 (768 cues; only the intended gains and the timing of cues that follow moved
  visuals changed); music bed null-tested against V2 (bit-identical before 4:35); mix −16.01 LUFS integrated,
  −1.30 dBTP; end-card tail −32.6 to −34 LUFS (music) fading to silence on the last frame.

## Regression review of the rendered film (V3 vs V2)

Three independent reviewers compared the first full V3 1080p render with the approved V2 render: every 3 fps
dense-sheet tile of every scene against its V2 twin (`qa/v3_final_dense/` vs `qa/v3_inspect/dense/`), every fix at
its listed frames at full resolution, every scene boundary frame by frame, and the still-run data.

- All 39 applied fixes passed (S1–S3: 14, S4–S6: 13, S7–S10: 12). Every tile that differs from V2 is explained by
  a fix or by the sharper 1200-dpi document rasters; boundaries and hand-offs (S1→S2 cut, S3→S4 match cut,
  S5→S6 iris, S9→S10 match cut, the wipes) are unchanged or match exactly. Still runs are identical to V2 (one
  0.8 s end-card hold; none new).
- They found three regressions caused by the fixes, all corrected before the final renders and re-checked in the
  final review render: clerk A's hand-to-chest raised his elbow across his face in the punchline close-up (now
  elbow down, f794–805); in S9 the slip overshot on screen after the camera ease change (the slip's carry now uses
  the same ease, f7227–7247); the CLAIM FAILS print showed for one frame while the pad was still down (now from the
  pad's first lifting frame, f7579).
- Measured in S9: the three camera moves' peak on-screen speed fell from 243/219/288 to 168/126/165 px per frame
  (start and land frames unchanged); SOURCE/CLAIM label contrast 2.04:1 → 3.88:1.

## Final renders

- Both final files were rendered from the same source commit (`9e01749`) and verified with `tools/verify_export.py`
  (`qa/v3_final/verify_*.json`): dimensions, 30 fps progressive, frame count 8,647, H.264, yuv420p, BT.709
  primaries/transfer/matrix tags, AAC-LC 48 kHz stereo, fast start, a full decode of every frame with zero errors,
  loudness and true peak of the encoded audio, and sync (cross-correlation of the decoded audio against `mix.wav`:
  0 samples offset). See `DELIVERABLES.md` for the numbers.
- 4K detail: 1:1 crops of the 4K render at the thesis title page (title, date, CMU), Table 2 (the counted columns)
  and the paper header show clean glyph edges from the 1200-dpi rasters, with no upscaling softness.
- Phone width (640×360) of 16 representative beats from the final review: every beat's point reads (years chip,
  lead author, punchline, token split, footer guard rail, record date, verdict chips, rule board, 6 + 1 − 3 = 4,
  9/10, the two questions, both verdicts, the end card). Still small on a phone: the SOURCE/CLAIM slot labels in the
  S9 two-gate wide (darker now, but secondary to the large question signs), the citation chips (≥ 30 px at 1080p,
  ~10 px on a phone) and document body text in wide shots, which the close-ups carry.
- The 1080p review is CRF 16 from the same source and mix; the chat copy (`…_REVIEW_chat.mp4`, 28.7 MB) is a
  two-pass 690 kbit/s re-encode of it for messaging only.

## Still needs a person

1. **Listen** through `qa/V3_LISTENING_CHECKLIST.md`, above all the two "Kalai" readings (0:05, 2:05) and the new
   end-card music (4:35–4:48).
2. **Open the three source links** once (arXiv HTML v1, CMU thesis PDF, Nature article) and confirm the Nature
   citation details.
3. **Confirm how the "Test Voice" ElevenLabs voice was made** (a designed or library voice, not a clone of a real
   person) before answering YouTube's synthetic-content question.
4. **Repository visibility.** The repository holds the project docs; if it is public, note that an older commit
   (`06dba03`, V2_DIRECTION.md) still contains owner-identifying brand names that were removed from the tip.
5. One normal-speed watch of the 4K master on a large screen and on a phone.

## Known render warning (harmless)

Chromium logs "EncodingError: The source image cannot be decoded" twice per render when S5 first mounts the
8160×7788 thesis page: `img.decode()` rejects very large images, and Remotion then waits for the normal load event
before rendering the frame. The page is present in every S5 and S9 frame checked (f3700–4404, f7140, f7400).
