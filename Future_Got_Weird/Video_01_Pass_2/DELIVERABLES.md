# Deliverables: Video 01, pass 2

Selected: title **"Why AI Is So Confidently Wrong"**, thumbnail **A ("SO SURE. SO WRONG.")**, voice **ElevenLabs
"Marcus K" (Eleven v4)**. Runtime 4:40.8.

## Upload these

| File | What it is |
|---|---|
| `exports/Future_Got_Weird_Video_01_Pass_2_1080p.mp4` | Master. 1920×1080, 30 fps, H.264 High (CRF 16, slow), BT.709 tagged, AAC 320 kb/s 48 kHz stereo, fast start. Loudness −16 LUFS integrated, true peak ≤ −1.3 dBTP. |
| `exports/Future_Got_Weird_Video_01_Pass_2_4K.mp4` | Optional native 4K master (3840×2160, true vector rasterisation at scale 2, same encoder settings and audio, 80 MiB). Upload this one if you want YouTube's higher-bitrate ladder; otherwise the 1080p master. |
| `exports/Future_Got_Weird_Video_01_Pass_2.en.srt` | English subtitles from the final narration's word timings (102 cues). |
| `thumbnails/thumbnail_A.jpg` (alternates `_B.jpg`, `_C.jpg`) | 1920×1080 JPEGs under 2 MB; PNG originals alongside. |
| `package/UPLOAD_PACKAGE.md` | Title options, paste-ready description with chapters, sources and credits, tags, pre-publish checklist. |

Clearly labelled smaller copies for review, not for upload:

- `exports/Future_Got_Weird_Video_01_Pass_2_1080p_REVIEW.mp4`: 1920×1080, CRF 23, 23.6 MiB (fits the chat's 30 MiB
  upload limit; same picture and mix as the master).
- `exports/Future_Got_Weird_Video_01_Pass_2_PREVIEW_720p.mp4`: 1280×720, CRF 23, same audio.

## Keep with the project

| File | What it is |
|---|---|
| `script/FINAL_SCRIPT.md` | The exact spoken text, with the measured start time of every segment. |
| `script/narration_segments.json` | Source of truth for the words (display text, Eleven v4 prompt with IPA, pauses). |
| `storyboard/STORYBOARD.md` | Scene by scene, with the word cues the code uses. |
| `research/sources.md` | Claim-to-source ledger for every line and label; builds on the pass-1 ledger. |
| `assets/asset_manifest.csv` | Every image, font, sound and data file with its source and licence. |
| `audio/mix/final_mix.wav`, `stem_narration.wav`, `stem_music_ducked.wav`, `stem_sfx.wav` | The mix and its stems (24-bit, 48 kHz). |
| `audio/narration/elevenlabs/` | Selected takes, forced alignments, per-segment WAVs, `selection.json`, `SELECTION`-style notes. |
| `audio/sfx/elevenlabs/SELECTION.md` | Prompts, measurements and choices for the twelve sound effects. |
| `source/` + `source/package-lock.json` | The editable Remotion project with its lockfile. `README.md` has the rebuild steps. |
| `qa/QA_REPORT.md` | What was checked, how, and what only a human can check. |
| `qa/CORRECTIONS.md` | Everything found and fixed during pass 2. |
| `backup/` | Split-part backups (< 25 MiB each) of the 1080p master, the 4K master, the review copy, the preview, the SRT, the narration, music bed and mix (FLAC), the selected takes and the selected SFX, with SHA-256 checksums and reconstruction scripts (`backup/*/reconstruct.py`). |

Channel-level documents live one directory up: `../CHANNEL_BRIEF.md`, `../STYLE_GUIDE.md`, `../REFERENCE_NOTES.md`.

## Watch-through checklist (for a human, before upload)

1. Headphones, normal speed, start to end. Does any sound effect feel too frequent (stamps, tile clicks)? Is the
   music ever audible under speech in a distracting way? Is "Kalai" pronounced kuh-LIE every time?
2. Phone speaker: is every line intelligible? The wipes and the title hit are mostly low frequencies and will all but
   vanish; that is intended.
3. Phone screen: can you read the slips in S1 (0:07–0:20), the scorer in S3 (1:00–1:10) and Table 2 in S7
   (3:10–3:20)? `qa/frames/phone/` has 360-px crops of these frames.
4. Scene changes: the paper wipes at 0:27, 0:44, 1:25, 2:00, 2:23, 3:09, 3:27, 3:41 and 4:07 should feel like a
   page turn, not a flash.
5. The four jokes (0:24, 2:20, 3:05, 4:30) should land dry, with no visual wink.
