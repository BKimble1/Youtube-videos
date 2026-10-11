# Frame-0 direction tests (AI viewers, one image each, no context)

Question to each reviewer: "Which direction is the woman moving or falling: LEFT, RIGHT, or CAN'T TELL? Confidence 1–5. The single cue that influenced you most." Correct answer: **RIGHT**. Three fresh reviewers per image. AI subagents given only the file, not human viewers; n is tiny, so read these as a consistent pattern, not a statistic.

## Test 1: left-arm pose and afterimage (no WHAT IF tag)
| Image | Variant | Right / 3 | Wrong-read cue most often cited |
|---|---|---|---|
| dir_1 | arm braced forward across body, afterimage ON | **0** | afterimage trail + dust on the left |
| dir_2 | arm back-and-up (the pose used), afterimage ON | 2 | afterimage trail + dust on the left |
| dir_3 | arm back-and-up, afterimage OFF | **3** | (none) |
| dir_4 | arm trailing low behind, afterimage ON | **0** | afterimage trail + dust on the left |

Afterimage ON: 2 of 9 correct. OFF: 3 of 3. **The afterimage was removed.** The pose with the arm back-and-up was kept.

## Test 2: WHAT IF tag placement (afterimage OFF, arm back-and-up)
| Image | Variant | Right / 3 |
|---|---|---|
| dir_3 | no tag (from test 1) | **3** |
| dir_5 | tag top-left | 1 |
| dir_6 | tag top-centre | **3** |
| dir_7 | tag top-right | 1 |

Symmetric (none or centred): 6 of 6. Side-anchored (left or right): 2 of 6 (p ≈ 0.03 one-sided, Fisher, n = 12). **The tag was moved to the centre** (`markerPos='center'`, the default).

Raw answers are summarised, not stored; `MAPPING.txt` is the image-to-variant key.
