# Future Got Weird: They Read a 2,000-Year-Old Scroll Without Opening It

Long-form episode, 16:9. The virtual unwrapping of PHerc. 1667, with the separate PHerc. Paris 4 ink check.

## V1: first complete review render (current)

Not published. Nobody has watched it in real time. All checks of picture and sound are frame and measurement checks
(see "Review" below).

**Review file:** `exports/FGW_Scroll_V1_REVIEW_1920x1080.mp4`

| Property | Value |
|---|---|
| Runtime | __RUNTIME__ |
| Video | 1920×1080, 30 fps, H.264 High, yuv420p, BT.709, captions burned in |
| Audio | AAC 48 kHz stereo, 320 kb/s |
| Loudness | __LOUD__ |
| Narration | Test Voice (`kk5XaSLo2XAw0sKM98zU`), eleven_v4, 436 words, 155.2 wpm over the speech span |

The MP4 is Git-ignored. Checksummed 20 MB parts are in `backup/`; to restore it, run
`cat backup/FGW_Scroll_V1_REVIEW_1920x1080.mp4.part_* > exports/FGW_Scroll_V1_REVIEW_1920x1080.mp4`.

| Item | File |
|---|---|
| Review report (QA, concerns) | `production/V1_REPORT.md` |
| Captions (SRT, synced to the measured words) | `captions/FGW_Scroll_V1.srt` |
| Thumbnail candidate (frame of the opening, no text) | `thumbnail/FGW_Scroll_V1_thumbnail_1920x1080.png` (+ 1280×720 JPG) |
| Locked narration (approved 15 Nov 2026) | `production/NARRATION_LOCKED.txt`, `production/APPROVAL.md` |
| Claim ledger and source credits | `production/SOURCE_NOTES.md` |
| Transition list | `production/TRANSITIONS_V1.md` |
| Narration master and word timings | `audio/narration/FGW_Scroll_narration_V1.wav`, `audio/narration/FGW_Scroll_V1_words.json` |
| Voice provenance (takes, selection, assembly) | `audio/narration/voice_provenance.json` |
| Mix | `audio/mix/FGW_Scroll_V1_mix.wav`, `audio/mix/mix_measure.json` |
| Editable Remotion project | `source/` (Remotion 4.0.533, composition `ScrollFilm`, stills `FilmStill`, `Sheet`, `Thumb`) |
| QA | `qa/v1/` |

## Structure (source/src)

| Section | Narration | File |
|---|---|---|
| A proof first | "If you tried to unroll this…" | `scenes/SeqA.tsx`, `scenes/Open.tsx` |
| B the damage (eruption cue; sepia reconstruction, 4.9 → 2.0 cm) | "That black lump is a book…" | `scenes/SeqB.tsx` |
| C scan (crew member, projections, volume, slice) | "Look at what happens…" | `scenes/SeqC.tsx` |
| D–F wrong layer, trace and flatten, ink (one continuous world) | "Pick one of those thin lines…" to "…form a stroke." | `scenes/SeqSheet.tsx` |
| G second scroll (PHerc. Paris 4) | "And here's how they checked it…" | `scenes/SeqG.tsx` |
| H reading and callback | "Back on the first scroll…" | `scenes/SeqH.tsx` |

One sheet model (`lib/sheet.ts`) drives the cross-section spiral, the flattening and the page. A point on the sheet
keeps its identity in every view: same tears, same lacunae, same column-19 text. The page's Greek is the preprint's
own transcription of PHerc. 1667. It is rendered in majuscule without accents. Restored letters (in square brackets
in the transcription) are not drawn; they appear as gaps. Uncertain letters are lighter.

## Rebuild

    cd Future_Got_Weird/they-read-a-scroll-without-opening-it
    (cd source && npm ci)
    python3 tools/align.py && python3 tools/make_narration.py   # word timings + narration master (from the takes)
    python3 tools/make_srt.py                                   # SRT + caption cues
    python3 tools/make_audio.py                                 # score, effects, mix
    bash tools/render.sh                                        # review MP4
    python3 tools/qa.py exports/FGW_Scroll_V1_REVIEW_1920x1080.mp4 qa/v1/review
    python3 tools/bursts.py exports/FGW_Scroll_V1_REVIEW_1920x1080.mp4 qa/v1/bursts
    (cd source && npx remotion still src/index.ts Thumb ../thumbnail/FGW_Scroll_V1_thumbnail_1920x1080.png)

Python: numpy, scipy, soundfile, pyloudnorm, pocketsphinx. Remotion uses the local Playwright Chromium (see
`source/remotion.config.ts`).
