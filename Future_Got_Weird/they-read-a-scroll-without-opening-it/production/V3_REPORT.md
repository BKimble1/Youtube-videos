# V3 report: faster narration, retimed picture

Status: review render, not approved. Nobody has watched it in real time. Every check of picture and sound below is a
measurement, a frame check or a contact sheet.

## Deliverables

| Item | File |
|---|---|
| Review MP4 | `exports/FGW_Scroll_V3_REVIEW_1920x1080.mp4` (Git-ignored; checksummed parts in `backup/`) |
| Final narration | `audio/narration/FGW_Scroll_narration_V3.wav` (word timings `FGW_Scroll_V3_words.json`) |
| Captions | `captions/FGW_Scroll_V3.srt` (46 cues) |
| Mix | `audio/mix/FGW_Scroll_V3_mix.wav` |

## Runtime and pace

@@MEASURE@@

| | V1/V2 | V3 |
|---|---|---|
| Words | 436 | 436 (same locked text) |
| Speech span (first word to last word) | 168.54 s | 138.08 s |
| Pace over the speech span | 155.2 wpm | **189.5 wpm (+22%)** |
| Runtime | 2:52.63 | @@RUNTIME@@ |
| First word | 0.30 s | 0.12 s |
| Words spoken by 10 s / 15 s / 30 s | 25 / 36 / 80 | 32 / 49 / 100 |
| Pauses over 0.8 s in the first 30 s | 7 (1.10–1.47 s) | 0 |
| Pauses over 1.0 s in the whole film | 37 | 1 (1.35 s, after the quoted translation, kept on purpose) |

The voice was regenerated in ElevenLabs (same voice, eleven_v4) from `production/NARRATION_LOCKED.txt`. The pace comes from the
delivery tags only; there was no speed multiplier, time-stretch or playback change. Takes were chosen by measurement:
PocketSphinx recognition against the block text, forced alignment, and duration (details in
`audio/narration/voice_provenance.json`, key `V3`). The assembly uses short gaps between blocks (0.30–0.50 s). It inserts
no pauses in the first two blocks and only small ones (0.15–0.7 s) after sentence ends later on.

## What changed in the picture

The V3 composition is `ScrollV3` (`source/src/v3/`). Every on-screen event is placed from the new measured words, so
nothing was stretched to fit.

- **0:00–0:07 hook.** The spatula lifts a flake from 0.25 s, the surface cracks under "unroll this", and the flake
  breaks on "crumble" (1.93 s). The scan bar starts at 3.0 s, the digital twin is on screen by 3.6 s, and the spiral is
  inside it at 4.4 s. A readable page is up by 5.2 s, and the cut back to the real object comes on "That black lump"
  (6.2 s). In V2 that cut came on the same words at 7.6 s.
- **0:07–0:21 eruption and damage.** Retimed to the faster read: match cut on "It was buried", eruption 0.45 s later,
  two shorter opening attempts, the rotation to the end-on view on "By the time", and the 4.9 → 2.0 cm shrink.
- **0:21–0:31 scan.** Same single move (dolly, beam, translucent roll, slices stacking, parting, dropping onto one
  slice), tightened to start 0.45 s before "Look at what".
- **0:31–1:01 inside the coil, tracing.** Re-cut to the new timing with the same purposeful moves: the dive between
  layers on "That's the sheet", the end-on tilt, the layer trace, the push onto the contact, the wrong jump and the
  peeled turn, the side-by-side splice, the rewind, and the fast correct trace, followed by the flattening.
- **1:04–1:13 ink, rebuilt.** The small inset is replaced by a large edge-on cutaway of three layers. The papyrus plies
  have visible fibres running along and across. The ink sits on the middle layer as dark mounds with a carbon sheen.
  Short "ink" and "papyrus" labels identify the two. On "the heat had turned" a char front sweeps across and the brown
  papyrus goes as dark as the ink, with a slow push in. On "In the scan" a scan bar turns everything the same grey, and
  on "the two could look almost identical" two sampled squares (ink, papyrus) pop out side by side with "≈". Then the
  camera returns to the page.
- **1:14–1:18 tiny patches.** Instead of four slow hops, one patch raster-scans three lines of column 17, leaving a
  faint score behind it, while the camera pushes in. On "Each patch was smaller than a single letter" the patch steps
  around one letter's outline. The road analogy, smudge and stroke reveal are unchanged apart from timing.
- **1:34–1:48 second scroll.** The earlier model's text now develops across the panel during "helped reveal" instead of
  appearing whole. After "They lined the two images up", a check line sweeps the overlay and lights each matched stroke
  as it passes, while the camera pushes into the panel.
- **1:56–2:13 papyrus and writing (V2's 2:24–2:43), rebuilt.**
  - The full-strip view no longer holds. On "There are gaps where the papyrus is missing" the camera glides along the
    sheet at medium zoom past the real lacunae, then carries on into column 19.
  - The camera pushes slowly toward the quoted lines through the highlight and the translation card.
  - On "Somebody put those words down by hand" the camera tracks a reed pen along the two quoted lines, then pulls back
    for the callback.
- **Sound.** There is a new cue list (`VER=V3` in `tools/make_audio.py`). Every effect is placed from the V3 anchors:
  flake and crumble, scan shimmer, eruption, scrapes, scan snaps, dive, contact, rewind, heat swell, scan bar, sample pops,
  a quiet tick stream under the patch sweep, the sweep check and the pen. The voice stays on top: music sits about 20 LU
  under the voice before ducking, effects about 12 LU under.

## QA

@@QA@@

## Remaining concerns

@@CONCERNS@@
