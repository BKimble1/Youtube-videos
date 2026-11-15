# V1 review report: They Read a 2,000-Year-Old Scroll Without Opening It

15 Nov 2026. Not published. Nobody has watched or listened to this cut in real time. "Watching" and "listening"
here mean frame and measurement checks, listed below.

## Deliverables

| Item | File |
|---|---|
| Review MP4, 1920×1080, 30 fps, 2:52.63 (5,179 frames), captions burned in | `exports/FGW_Scroll_V1_REVIEW_1920x1080.mp4` (Git-ignored; 4 checksummed parts in `backup/`, SHA-256 `d24390e6…7523e`) |
| SRT | `captions/FGW_Scroll_V1.srt` (46 cues, max two lines of 42 characters) |
| Editable Remotion project | `source/` (composition `ScrollFilm`) |
| Thumbnail candidate | `thumbnail/FGW_Scroll_V1_thumbnail_1920x1080.png`, `thumbnail/FGW_Scroll_V1_thumbnail_1280x720.jpg` |
| Mix | `audio/mix/FGW_Scroll_V1_mix.wav` |

## Measured QA (`qa/v1/review_qa.json`)

| Check | Result |
|---|---|
| Duration vs narration master | 172.633 s = 172.633 s |
| Video | H.264 High, yuv420p, BT.709, 30/1 |
| Loudness | −14.0 LUFS integrated, LRA 5.7 LU, −1.0 dBTP true peak |
| Black frames | None |
| Frozen picture | None of 1.5 s or longer (freezedetect, n = 0.0008) |
| Audio vs narration master | Best lag 0 ms |
| Spoken words in the export | All 436 locked words force-align in the export's own audio: median 0 ms and 95th percentile 70 ms from the master's word onsets. One short "The" slips to 1.4 s, an aligner miss in the mix. |
| Free speech recognition (PocketSphinx, supporting only) | Error rate 0.346 on the export vs 0.197 on the clean narration master. The difference comes from the score and effects; see the forced alignment above. |
| Captions | Text identical to the locked narration. Every cue starts on a measured word onset. No overlaps. |
| Muted, phone size (390 px), first 8 s | `qa/v1/first8s_muted_phone_390px.png`. The roll and the scan read side by side, joined by a dotted leader. Greek strokes are visible by 1.5 s. |
| Frame-step bursts (every frame) | `qa/v1/bursts/`: opening unroll, split to roll, cut to reconstruction, cut to scan, spiral reveal, branching error, reset, flatten, page opens, ink reveal, cut to Paris 4, validation overlay, cut back to 1667, closing callback, re-roll. No one-frame resets, landmark shifts or popping masks were found. |
| 1 fps sheets | `qa/v1/render_1fps_sheet_0..2.png` |
| Transition list | `production/TRANSITIONS_V1.md` |

## Fixed during review
- The wall light leaked across the split-screen divider. It is now clipped, with a matched fade in the final hold.
- The callback camera jumped between two framings of column 19. It now eases into the opening framing before the
  left panel slides in.
- A lacuna sat on the bend used for the wrong-layer demonstration, which broke the trace. Breaks in the
  cross-section now come only from the large lacunae, and that lacuna was moved off the bend.
- There were 13 holds of 1.5–3.9 s. Each now has a slow, one-direction push (no reversals).
- The width guide used to show invented intermediate widths. It now labels only the sourced values, 4.9 cm and
  2.0 cm.

## Decisions and concerns for Blake
1. **Pace.** The Test Voice reads at about 180–190 wpm whatever the direction tag. 155 wpm overall comes from 31
   planned pauses (0.5–1.3 s) between sentences, with no time-stretching. The gaps might feel deliberate in places.
2. **Reconstructions, not source images.** No preprint or scrollprize.org image is reused. Every specimen, scan,
   sheet and ink map is an original illustration labelled "Reconstruction". This avoids the CC BY-NC 4.0 question
   for V1. Credits are in `production/SOURCE_NOTES.md`.
3. **The page text** is the preprint's transcription of PHerc. 1667, laid out evenly along the sheet. Column 19,
   lines 11–12 are the quoted lines. Lacunae are placed where the transcription has restorations; they are not
   traced from the published image. The real column positions and gaps differ in detail.
4. **PHerc. Paris 4 panels** use a stand-in letter pattern, not a transcription. The panel caption says so, and
   cites Figs. 2–3.
5. **Opening attempts.** Only the start and end widths (4.9 → 2.0 cm) and the three dated attempts are sourced
   (19th century, 1969, 1980s). The tool and the flakes are illustrative.
6. **Score and effects** are synthesised in `tools/make_audio.py`. Music sits about 20 LU under the voice (ducked);
   the translation gets a single held note.
7. **Thumbnail** is the opening composition with the sheet half out of the spiral (column 19). It has no
   text and no chips.
