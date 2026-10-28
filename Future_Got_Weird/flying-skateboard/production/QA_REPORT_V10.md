# Flying Skateboard V10: QC report

**File:** `exports/FGW_Flying_Skateboard_V10_REVIEW_1080x1920.mp4`. Results from `tools/qa.py` are in `qa/v10_review_qa.json`.

**Status: REVIEW.** Every check below was made on the rendered files and the mix stems. No one has watched or listened to it in real time: this environment has no playback. Before release, watch it once on a phone at normal speed with sound.

## Specs (from the file)

| | |
|---|---|
| Video | H.264 High, 1080×1920, 30 fps, 939 frames, 31.30 s. Rendered at 2160×3840, then downsampled with Lanczos. |
| Audio | AAC 48 kHz stereo, −14.0 LUFS, sample peak −2.4 dBFS |
| Decode errors, black frames, freezes over 1 s | None |

## The brief's acceptance tests

| # | Test | Result |
|---|---|---|
| 1 | First frame | Him and the board close over the river, gravel bar and water below. It reads with the sound off. |
| 2 | Flight understood by 1 s | **Pass** (frames 0–30 inspected one by one). By frame 6 the gravel bar's edge is passing under him. At 1.0 s the low angle shows the ten fans and the air between the board and the river. |
| 3 | Every camera move has a purpose | Each move reveals, follows, explains or heightens danger (see `CHANGELOG_V10.md`). One fix after the first render: the sweep down under the board took 0.3 s (about 130°/s, a whip). It now takes about 0.65 s, and the pop scan no longer flags it. |
| 4 | Balance section completely different from V9 | **Pass.** Every 4th frame of 14.5–22.9 s inspected. A sudden tip and near-fall, then top-down, legs close-up, side tracking, the coach from above his shoulder, the correction, and accelerating away. Each beat is a different view and a different action. |
| 5 | Meaningful developments without frantic cutting | 13 picture cuts in 31.3 s. Most new information comes from action inside shots (the backfire, the match cut, the near-fall, the fans' differential thrust, the approach under the question). |
| 6 | The mechanism is satisfying | The ten fans counted from below, one duct opened to show the rotor spinning up and the air driven down, the air followed to the river, then the lift. No wiring diagram and no labels. |
| 7 | Anatomy stable | **Pass on the measured checks.** Feet planted on all 765 rider frames (0.00 mm ankle gap, `dev/footCheck10.ts`), no knee bent backward. The helmet check's only isolated steps are at 4.07 and 4.37 s, where the head is behind the deck seen from below (not visible). |
| 8 | Ending active, clean loop | **Pass.** He flies in toward the camera under the question, then it tracks onto frame 0's view. The last frames carry straight into frame 0. The larger step at the seam (5.8 against a 3.6 median) is the caption change. |
| 9 | Narration intact, not rushed | **Pass on the numbers.** All 99 words are sample-identical to the approved take. Only silence was trimmed: sentence breaths are 0.21–0.24 s, and the beat after "CANYON." is 0.27 s. **Not heard in real time.** |
| 10 | Frame-by-frame inspection | Done on the MP4 for the first 90 frames, the balance section (every 4th frame), the pop scan of every frame (15 candidates: caption changes, "YOUR PRICE?" appearing, the fire, and the match cut, frame 389, the largest step), and the loop. |

## Sound

| Check | Result |
|---|---|
| Voice over everything else (speech band) | 17.8 dB |
| Electric bed in the gaps between phrases, against under speech | +0.3 dB (continuous: no on/off at cuts, no swelling into pauses) |
| Jet | Only in the workshop. Steady, fading at "So he switched". |
| Fire | One accent (the whoomp), plus two soft pops on the visible backfire before it |

## Remaining notes
- **Runtime:** 31.3 s, at the top of the 29–31 s aim. Shorter would need cuts into breaths or a faster voice.
- **The rider is small** in the wide tracking view of the crossing (about 2.0–2.6 s) and at the start of the question (28.6 s, as he flies in from a distance).
- **Coach close-up:** his ear and the earbud still read as two dark shapes beside the helmet.
