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
