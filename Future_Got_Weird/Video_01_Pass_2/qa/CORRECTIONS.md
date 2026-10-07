# Corrections log: pass 2

What was found during production, how it was found, and what changed. Visual checks were done on half-scale
stills and contact sheets (nobody watched the film in real time; see `QA_REPORT.md` for the limits).

## Audit of pass 1 (the reason for pass 2)

| Finding (from `Video_01_Visual_Audit_and_References.md`) | Change in pass 2 |
|---|---|
| Dark card template: headlines on dark panels, real photos, no cast, little motion | New bright cutout system: paper background, saffron/teal/coral palette, original cast of eight, props, sets, paper wipes |
| Detour into the IMO/DeepMind contrast, slow hook | Detour removed. Hook lands the three stamped answers by 0:12; the title appears at 0:30; the mechanism starts at 0:44 |
| Global zoom drift, grid backgrounds, shimmer | Deterministic frame-driven motion only: springs, ramps and seeded randomness keyed to word cues; a camera with parallax layers; no continuous drift |
| Evidence shown as flat screenshots | Real crops pinned with tape, fractional highlight boxes that draw in, source chips on every document |
| Runtime 5:18 | Script rewritten to 694 words, 4:40.8 measured |

## Found and fixed in the scene check-frames

| Scene | Problem | Fix |
|---|---|---|
| S1 | The fact-checker overlapped slip A at the counter's end | Fact-checker moved to x 150 at scale 1.08 |
| S1 | A "3 for 3" stamp collided with the counter sign | Stamp removed; the three WRONG stamps carry the beat |
| S1 | The year chip revealed "2001" before the record scene | Reworded to "Three different years · none of them right" |
| S3 | Scorer rows overflowed the housing | Housing 600×336, candidate box 250 px |
| S3 | The LIKELY/TRUE panel collided with the conveyor track | Panel moved to the left of the scorer |
| S3 | List B stayed on screen into s11 | List A shown again from "Here," |
| S4 | The card catalogue was drawn 330 px below the floor because the `Catalogue` origin was overridden by its `style` | Positioned by its top-left (1330, 520); the card now sits above the cabinet |
| S4 | The dashed "gap" box was one shelf row below the real gap: the shelf rows live inside a wall layer offset by 200 px | Box and gap both on row 2; `BookRow` gains a `gapAt` prop and renders the gap at its computed x |
| S4 | `BookRow` computed the gap but rendered the books closed up (it re-accumulated widths at render time) | Books carry their x position; the gap renders exactly where the dashed box is |
| S4 | The cake collided with the catalogue card; the "rarely…" chip ran under the card and was cut off | Cake and "no pattern to learn from" chip moved into the gap; chip shortened to "rarely, or not at all" with the hedge moved to a bottom caption; camera CAB widened to zoom 1.15 |
| S6 | The honest and guesser tile rows overlapped | Tiles 66 px in 760-wide rows |
| S6 | The trophy walk ran past the scene end | Walk starts on "trophy" (s25), 38 frames |
| S6 | The "7 − 3 = 4" equation overlapped the podium | Moved to GUESSER_X + 215, top 690 |
| S7 | The tally overlapped Table 2 | Table narrowed to 1250 px; tally at x 1440; IDK label shortened |
| S8 | The chip "the real record is now in the room" stayed on screen after the camera moved to the dial and was clipped at the frame edge | Chip fades with the camera move ("Turning" − 8) |

## Found in the first full render (1-fps contact sheets, boundary frames, ffmpeg detectors)

| Scene | Problem | Fix |
|---|---|---|
| S3 | The LIKELY / TRUE panel sat partly outside the HOPPER framing: its left 150 px were cut off from 1:08 to 1:14 | Panel moved 140 px right and narrowed to 496 px; headlines 34 px |
| S6 | The rule-change arithmetic box started at x 1575 and ran off the right edge, so "= 4" was never visible and an empty dark bar showed before the text | Box anchored to the right edge (right 60) above the guesser's score |
| S7 | The evidence labels "ten benchmarks", "strict right / wrong" and "IDK credit" covered the table's own caption and footnote text | Labels removed; the coloured boxes, the tally text and the chips carry the meaning |
| S10 | `freezedetect` found the only ≥ 4 s freeze in the film: the end card held still for 5.2 s from 4:29 | The wordmark's three words pop on "Future", "Got", "Weird."; the tagline's two halves land on "AI" and "we"; the Subscribe chip nudges twice while the card holds |
| Thumbnails | A: the slip and its stamp ran off the bottom. C: the Llama slip and the DeepSeek stamp ran off the right edge | Slips repositioned and narrowed |

## Found in the second full render

| Scene | Problem | Fix |
|---|---|---|
| S6 | The arithmetic box reserved space for terms that had not appeared yet, so it showed as an empty dark bar beside the score for two seconds | Terms are added to the box only once they are spoken, so the box grows from the right edge |

## Sound

| Problem | Fix |
|---|---|
| ElevenLabs download of the SFX shortlist stopped on a transient connection reset, and one fetch-list line was corrupted by a path edit | Re-ran the remaining nine lines; corrected the URL scheme on the last line; all twelve candidates measured |
| `stamp_v1` turned out to be a faint pure-tone click, not a stamp | `stamp_v2` chosen and trimmed to its thud (see `audio/sfx/elevenlabs/SELECTION.md`) |
| `token_v4` decoded with inter-sample peaks above 0 dBFS | Normalised to −24 dBFS peak with a 400 Hz high-pass in `make_sfx.py` |

## Script and facts

| Line | Issue | Resolution |
|---|---|---|
| s15 | "Rarely, or not at all" could read as a claim about these models' training data | On-screen chip: "training exposure is unknown for these models" |
| s18 | Pass 1 said "a completely different title"; the titles share words | "a different title" (must-not #9) |
| s26 | "Nine of ten" could read as "all benchmarks" | Spoken as "the ten they checked"; chip names the sample and date |
| s28 | "Not more correct" would overstate the temperature evidence | "not necessarily more correct", spoken and shown |
