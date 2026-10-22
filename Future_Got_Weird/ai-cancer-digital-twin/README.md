# Future Got Weird: Digital Twin / Molecular Attack

Working title (creator-selected): **"AI Just Cured All Cancer."** That records the creator's requested title; it is not
a verified scientific conclusion. The film itself says "AI has not cured all cancer" 17 seconds in. See
`upload/UPLOAD_TEXT.md` for the title note and alternatives.

**Status (22 Oct 2026): first complete cut delivered — 1080p review and native 4K master; not published.** 16:9, 1920×1080 native at 30 fps, 3:38.2.
Nobody has watched it in real time or listened to it here (this environment has no audio or video output); the QA
notes list exactly what was checked and how.

| Deliverable | File |
|---|---|
| Review render, 1080p (H.264 + AAC 320 kb/s, full mix) | `exports/FGW_AI_Cancer_DigitalTwin_REVIEW_1080p.mp4` (Git-ignored; checksummed parts in `backup/`) |
| 4K master (3840×2160, rendered natively at 2× from the vector source) | `exports/FGW_AI_Cancer_DigitalTwin_MASTER_4K.mp4` (Git-ignored; checksummed parts in `backup/`) |
| Captions (text identical to the locked script) | `captions/FGW_AI_Cancer_DigitalTwin.srt` |
| Description with sources, chapters, title note | `upload/UPLOAD_TEXT.md`, `upload/chapters.txt` |
| QA notes (checks actually performed, open items) | `production/QA_NOTES.md` |
| Shot list aligned to the narration | `production/SHOT_LIST.md` |
| Locked script | `production/SCRIPT_LOCKED.txt` |
| Research notes (evidence stage of each element) | `research/RESEARCH_NOTES.md` |
| Narration provenance (voice, model, generation IDs, take choice) | `audio/narration/voice_provenance.json`, `audio/narration/take_measurements.json` |
| Editable source (Remotion) | `source/src/` (composition `Main`; `Preview` = narration only) |

## How the film is built

- **Narration.** ElevenLabs Test Voice (`kk5XaSLo2XAw0sKM98zU`, `eleven_v4`), the series narrator, reading the locked
  script verbatim in six section blocks, two takes each (`audio/narration/takes/`). All 12 takes were transcribed
  with ElevenLabs Scribe; take 1 of every block was chosen by measurement (longer pauses on the opening reveal and on
  "It survives", same pace as take 2). `tools/stitch_narration.py` trims each take at its measured speech onset,
  joins them with 0.8 s section gaps, and writes the word timings (`source/src/data/narration_words.json`).
- **Timing.** Every cut and every on-screen event is computed from those word timings (`T('phrase')` in
  `source/src/kit/core.ts`). No spoken event is hand-timed.
- **Picture.** Hand-written SVG in Remotion: `art/` (molecules, cells, digital model, lab props, icons),
  `sets/` (the molecular set shared by the opening and its return; the clinic), `shots/` (one file per section:
  `Hook`, `Reveal`, `Copy`, `Address`, `Switch`, `Survivor`, `Future`), `kit/` (camera, easing, effects). The
  clinician, researcher and person use the channel's existing cutout character rig (`components/Character.tsx`).
- **Sound.** `source/src/sfx.ts` is the cue sheet (140 effect cues, ambience beds, score sections), derived from the
  same timing constants. `tools/make_audio.py` synthesises everything (no third-party samples), ducks it under the
  voice and normalises the mix.

## Rebuild

    cd Future_Got_Weird/ai-cancer-digital-twin
    python3 -m pip install numpy scipy soundfile pyloudnorm
    (cd source && npm ci)
    python3 tools/stitch_narration.py            # takes → audio/narration/narration.wav, source/public/audio/narration.mp3, word timings
    node tools/export_cues.mjs                   # cue sheet + cut list → audio/sfx_cues.json
    python3 tools/make_audio.py                  # → audio/mix/mix.wav (-14 LUFS, ≤ -1 dBTP), copy in source/public/audio/
    python3 tools/make_srt.py                    # → captions/FGW_AI_Cancer_DigitalTwin.srt
    # picture without the audio element (the 63 MB WAV slows every render tab), then mux the mix
    (cd source && npx remotion render src/index.ts Main ../exports/_video_1080p.mp4 --props='{"audio":false}' --muted --crf=16 --x264-preset=medium --color-space=bt709 --concurrency=4)
    ffmpeg -i exports/_video_1080p.mp4 -i audio/mix/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart exports/FGW_AI_Cancer_DigitalTwin_REVIEW_1080p.mp4
    # 4K master: same with --scale=2, rendered in three frame ranges and joined (exact commands: production/QA_NOTES.md §6)
    bash tools/backup_parts.sh exports/<file>.mp4   # 20 MB parts + SHA-256 in backup/
    python3 tools/qa_review.py exports/FGW_AI_Cancer_DigitalTwin_REVIEW_1080p.mp4 qa/review

Stills for inspection: `cd source && COMP=Main SCALE=0.5 node stills.mjs ../qa/<dir> t:<seconds> …`.
Art test sheet: composition `Sheet`.
