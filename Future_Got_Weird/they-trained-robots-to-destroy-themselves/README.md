# Future Got Weird: They Trained Robots to Destroy Themselves

**Status (14 Oct 2026): v1 complete, first full production pass.** 1080p upload master rendered from source and
reviewed in frames; narration, mix, captions, thumbnails and upload text done. **Not published** (that's the owner's
step). Nobody has listened to the audio or watched the film at full speed yet; see `QA_REPORT.md` for exactly what
was and wasn't checked.

- Premise: Figure trained its retired F.02 humanoids to jump into molten steel. Why do it as a spectacle, how do you train a jump you can only make once, and what does it prove? The robots ran a trained policy toward a goal people chose; they didn't "want" anything.
- Runtime: 4:18.1 (narration 4:12.1 + end card). 1920×1080, 30 fps.
- Voice: ElevenLabs Test Voice `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`.
- Channel brief: `../can-you-hurt-something-that-isnt-alive/production/brief/Future_Got_Weird_Project_Brief.md`.

## Deliverables

| What | Where |
|---|---|
| Research note + dated claim ledger + sources | `research/claim_ledger.md` |
| Final spoken script, claim IDs, pronunciation notes | `script/script_v1.md` |
| Narration takes (14), stitched narration, word timings, timing table | `audio/narration/`, `audio/narration_words.json`, `audio/narration_timing.md`, `audio/word_timeline.txt` |
| Sound-effect takes and choices; cue sheet; mix measurements | `audio/sfx_raw/`, `audio/sfx_choices.md`, `audio/sfx_cues.json`, `audio/mix/mix_v1_measure.json` |
| Storyboard tied to the final audio | `storyboard/storyboard.md` |
| Editable Remotion source + lockfile | `source/` (`package.json`, `package-lock.json`, `src/`) |
| Asset / rights ledger | `production/ASSET_RIGHTS.md` |
| **Upload master 1080p** | `exports/FGW_RobotsDestroy_v1_UPLOAD_1080p.mp4` (Git-ignored; backed up as checksummed parts in `backup/v1/`) |
| Review copy (compressed, 720p, not for upload) | `exports/FGW_RobotsDestroy_v1_REVIEW_720p_not-for-upload.mp4` (Git-ignored; regenerate from the master) |
| Captions | `captions/FGW_RobotsDestroy_v1.srt` |
| Thumbnails | `thumbnail/FGW_RobotsDestroy_thumbA_leap_1280x720.jpg` (main), `…thumbB_overshoulder…` (backup test) |
| Title, description, chapters | `upload/UPLOAD_TEXT.md`, `upload/chapters.txt` |
| QA results | `QA_REPORT.md`, contact sheets in `qa/` |

## Rebuild

Needs Node 22, ffmpeg, Python 3 with numpy + scipy, and the Playwright headless shell at the path in `source/remotion.config.ts`.

    cd Future_Got_Weird/they-trained-robots-to-destroy-themselves
    (cd source && npm ci)                                   # exact versions from package-lock.json (Remotion 4.0.533)
    python3 tools/stitch_narration.py                       # takes -> audio/narration/narration_v1.(wav|mp3), word timings
    (cd source && node ../tools/collect_sfx.mjs)            # sound cues exported from the scenes -> audio/sfx_cues.json
    python3 tools/prep_sfx.py                               # choose/trim ElevenLabs effect takes -> source/public/audio/sfx/
    python3 tools/synth_audio.py                            # in-house effects + music bed (deterministic)
    python3 tools/mix_audio.py                              # final mix -> source/public/audio/mix.mp3 (-15 LUFS, -1.5 dBTP)
    (cd source && npx remotion render src/index.ts Main ../exports/FGW_RobotsDestroy_v1_UPLOAD_1080p.mp4 --crf=16 --x264-preset=slow --color-space=bt709 --audio-bitrate=320k)
    python3 tools/make_srt.py                               # captions + transcript-vs-script check
    (cd source && npx remotion still src/index.ts ThumbA ../thumbnail/a.png)   # thumbnails (ThumbA / ThumbB)

A native 4K master can be rendered from the same vector source with `--scale=2` (not done for v1: 1080p was the
requested master). Stills for inspection: `cd source && COMP=Main node stills.mjs ../qa/<dir> <frame|t:seconds> …`.

Swapping in the Runway underscore (generated in the owner's Runway library as "FGW Robots - explainer underscore v1",
124 s, not downloadable here): save it as `source/public/audio/music_bed.wav` (looped/edited to 258.1 s), rerun
`tools/mix_audio.py` and re-render. Not required.

## Decision log

| Date | Decision | Why |
|---|---|---|
| Oct 14 | Kept the commissioned title | Sources support it; the film resolves the "they didn't choose" distinction explicitly |
| Oct 14 | Evidence triangulated through search excerpts; Figure/Think Foundry/YouTube/X pages not opened | This environment's network policy blocks those hosts; every company claim is attributed, and the owner checks the quoted line before upload |
| Oct 14 | Added the Ovako/Yle confirmation as the second source in the cold open | Only party besides Figure on record as witnessing the jumps |
| Oct 14 | No footage from Figure's film; original illustration labelled throughout | Film not accessible here and reuse not cleared |
| Oct 14 | Vessel drawn as an open ladle ("bucket") | Figure's own excerpted wording; the exact vessel in the film is unverified |
| Oct 14 | Removed the glowing "melting" robot from both jump shots | Even a few frames read as a burning figure; the robot now sinks under splash and smoke |
| Oct 14 | Schwarzenegger: "appears in the film", never "was in Finland" | Ovako declined to say whether he was present |
| Oct 14 | Training and domain-randomisation scenes labelled conceptual | Figure has published no training data or settings |
| Oct 14 | Take 1 for all narration blocks | All 14 takes match the script; B5 take 2 runs two sentences together |
| Oct 14 | Music synthesised in-house | Runway output host blocked; ElevenLabs connector here has no music |
| Oct 14 | 1080p master only | Requested master; 4K is one command away if wanted |
