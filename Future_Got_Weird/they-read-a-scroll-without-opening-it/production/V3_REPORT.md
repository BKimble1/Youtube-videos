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

| | V1/V2 | V3 |
|---|---|---|
| Words | 436 | 436 (same locked text) |
| Speech span (first word to last word) | 168.54 s | 138.08 s |
| Pace over the speech span | 155.2 wpm | **189.5 wpm (+22%)** |
| Runtime | 2:52.63 | **2:20.80** (4,224 frames at 30 fps) |
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

All measured from the exported file (`qa/v3/review_qa.json`, `qa/v3/bursts/`, `qa/v3/compare/`).

| Check | Result |
|---|---|
| Video stream (ffprobe, frames counted) | H.264 High, **1920×1080, r_frame_rate 30/1, avg 30/1, 4,224 frames**, yuv420p, BT.709 |
| Audio stream | AAC, 48 kHz stereo, 288 kb/s, 140.80 s (same as the video) |
| Loudness (ebur128 on the export) | −14.2 LUFS integrated, LRA 2.7 LU, true peak −1.4 dBTP |
| Black frames | none |
| Static holds (freezedetect at 480 px, noise 0.003, ≥ 1.0 s) | none reach 1.5 s. Six near-static stretches of 1.07–1.43 s (45.4, 65.6, 72.1, 79.2, 86.3, 137.2 s), each with a small moving element (trace head, labels fading in, patch steps, smudge inset, final settle). The first render had a 1.67 s hold on the splice cards at 50.4 s; that now has a slow push onto the seam. |
| Audio vs narration master | 0 ms offset |
| Captions | 46 cues. The text is identical to the locked script (all 436 words, in order). Every cue starts exactly on its first word's measured onset (0 ms), with no overlaps. The longest cue is 4.36 s; the last ends at 138.5 s. |
| Transitions (every frame across 23 beats) | No one-frame jumps or popping masks: attempt and break, scan to page, back to the object, villa match cut, surge, cut to the lab, into the slice, dive, wrong jump, rewind, flatten, cutaway in, heat, scan bar, cutaway out, road, ink reveal, cut to Paris 4, overlay push, cut back to 1667, gap glide, pen follow, callback. |
| First 15 s, muted, phone size (`qa/v3/phone_first15_muted.png`) | Reads without sound: crack (1 s), break (2 s), digital twin (3 s), spiral (4 s), readable page (5 s), real object (6 s), villa and eruption (8–11 s), second attempt (12–14 s). |
| First 30 s vs V2 (`qa/v3/compare/first30_V2_vs_V3.png`) | V3 is about 6 s ahead by 0:30: the lab appears at about 20 s (V2: 26 s), and the slices are stacking by 26 s (V2: still in the lab at 28 s). |

**Narration assessment.** This is by measurement only; nobody has listened. The master peaks at −1.12 dBFS with no
clipped samples, and word loudness is even (10th–90th percentile −22.3 to −15.8 dB RMS). Recognition of the export
with PocketSphinx gives a 34% word error rate against the script. That figure is noise from the recognizer (V1 and V2 measured 34.6% and 36.2% on the same check), and the captions and forced alignment account for every word. The ElevenLabs Scribe
transcript was not used as a check because in this connector it follows the generation prompt.

Pace by section:

| Section | Pace (wpm) |
|---|---|
| 0–21 s | 208 |
| 21–36 s | 191 |
| 36–53 s | 221 |
| 53–61 s | 211 |
| 61–75 s | 167 |
| 75–92 s | 213 |
| 92–108 s | 188 |
| 108–129 s | 170 |
| 129–141 s | 201 |

The average over the whole speech span is 189.5 wpm, and the voice is speaking about 241 words per minute while it talks, not counting pauses.

## Remaining concerns

- **Nobody has listened to it or watched it in real time.** The delivery (energy, warmth, whether it sounds rushed)
  needs a human listen before approval.
- **Some stretches run faster than the 175–190 target.** The wrong-layer explanation (36–53 s, "Pick one…" to
  "…entire turn of the page") is at about 221 wpm, and the opening and the patch/road passage at about 208–213 wpm. The
  average is on target, but these are the densest ideas in the film. If they feel hard to follow, the fix is a slower
  take for block 4 only, or small pauses after "around." and "together?". That adds about 0.5 s and keeps the wording.
- **Loudness is −14.2 LUFS, not −14.0.** The mix was given extra headroom because the first encode measured −0.9 dBTP
  after AAC. It now measures −1.4 dBTP.
- **The patch sweep tints letters faintly before "Put the patches together".** The scores the model leaves behind
  follow the real letter positions, so column 17's shape shows through a little early. This is honest to how the
  method works, but it slightly pre-empts the reveal.
- **Labels in the ink cutaway.** It uses "ink", "papyrus" and "≈" labels. They are plain words from the narration,
  but the V2 brief asked for minimal on-screen text; remove them if they read as annotation.
- **V1 and V2 no longer render as delivered.** The shared timing data (`source/src/data/narration_words.json`,
  `cues.json`) now holds the V3 narration, so the V1 and V2 compositions no longer render as they did. Their
  sources are at commits b18def5 (V1) and 8b7de54 (V2); V1's data is also kept as `narration_words_v1.json` /
  `cues_v1.json`.
- **Facts and narration are unchanged from the approved V1.** No wording was altered.
