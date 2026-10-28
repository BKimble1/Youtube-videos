# Flying Skateboard V9: QC report

**File:** `exports/FGW_Flying_Skateboard_V9_REVIEW_1080x1920.mp4`. Results from `tools/qa.py` are in `qa/v9_review_qa.json`.

**Status: REVIEW.** Every check below was made on the rendered files and the mix stems. No one has watched or listened to it in real time: this environment has no playback. Before release, watch it once on a phone at normal speed with sound.

## Specs (from the file)

| | |
|---|---|
| Video | H.264 High, 1080×1920, 30 fps, 954 frames, 31.80 s. Rendered at 2160×3840, then downsampled with Lanczos. |
| Audio | AAC 48 kHz stereo, −14.0 LUFS, sample peak −2.4 dBFS. The narration is the V8 file: every word sample-identical to the approved take. |
| Decode errors, black frames, freezes over 1 s | None |

## Checks

| Check | Result |
|---|---|
| Hook, frames 0–89 decoded from the MP4 | **Pass.** Frame 0 is the payoff: he is close and large over the river, with the water and gravel bar about 9 m below. The bar's edge enters at frame 3 and streams under him through 1.3 s. One smooth tracking turn, with no zoom-out to a small figure. |
| Balance and coach, 14.7–23.1 s | **Pass.** Seven views in 8.4 s, each from a different place, with an action in each: rear-tail, profile, legs, nose-end raised, over the shoulder from above, right front, and high rear tracking. The deck-phone crane through his legs is gone. The thrust difference shows in the fans' air. |
| Feet (`footCheck9`, 775 rider frames) | **Pass.** 0.00 mm largest ankle gap; no knee bent backward. |
| Helmet (`helmetFilm9`) | **Pass.** The only isolated steps are at 4.13 and 4.47 s, where the head is behind the deck seen from below (not visible). V8's step during the coach swing is gone. |
| Pop scan (8×6 cells, every frame) | **Pass.** 20 of the 21 candidates are caption changes, "YOUR PRICE?" appearing, or the workshop's fire-out and jets lifting. The 21st, at 4.9 s, is his arm crossing the top-left corner as the camera pushes from under the board toward one unit. That is a fast but continuous move, also in V8. |
| Payoff | **Pass.** He stays a constant size over the river and in the canyon (camera 6.8–8.6 m away), with the bank, bridge and canyon walls moving behind him. |
| Jet sound | **Pass.** The jet plays only in the workshop. It holds a steady level, with the largest 0.1 s change 5 dB (the rise at ignition), and fades over about a second at "So he switched". V8 had a 14.8 dB dip and surge there. |
| Voice over everything else (speech band, while speaking) | **Pass.** 17.9 dB overall, at least 15.6 dB in every scene. The electric bed is only 0.3 dB louder in the gaps than under speech. |
| Loop | **Pass.** The last frames carry straight into frame 0. The larger step at the seam (4.7 against a 3.4 median) is the caption change. |
| Captions | **Pass.** Unchanged from V8: every caption shows 0–0.04 s before its first word, and none hides early. |

## Remaining notes
- **Coach close-up:** his ear and the earbud read as two dark shapes beside the helmet (the rig's foreshortened ear).
- **Workshop:** the new-motor close-up is seen from above (the fan and hub).
