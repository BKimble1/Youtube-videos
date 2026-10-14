# Future Got Weird: They Trained Robots to Destroy Themselves

## V2 (14 Oct 2026): the current version

**Status.** The V2 rebuild is complete and V1 is preserved unchanged. The V2 upload master was rendered from source
and checked with measurements and dense frame sheets. It is **not published**; that is the owner's step. Nobody has
yet watched it in real time or listened to it; `QA_REPORT.md` (V2 section) lists exactly what was and wasn't checked.

**Specs and versions**

- Runtime: 3:53.5 (narration 3:50.5 plus a 2.5 s brand sting). 1920×1080, 30 fps native.
- Voice: ElevenLabs Test Voice (resolved by ID `kk5XaSLo2XAw0sKM98zU`), `eleven_v4`, natural speed.
- What changed: `production/v2/CHANGELOG_V1_TO_V2.md`.

| What | Where |
|---|---|
| Revised script, claim IDs, pronunciation | `script/script_v2.md`; ledger delta in `research/claim_ledger.md` → "V2 changes" |
| Robot / branding reference (sheet and asset IDs) | `production/v2/ROBOT_REFERENCE.md`, `production/v2/ROBOT_REFERENCE_SHEET_v2.png` |
| Shot plan with audio cues, focus hand-offs, camera moves, transitions | `production/v2/SHOT_PLAN_V2.md` |
| Narration takes, selection, word timings | `audio/v2/narration/`, `audio/v2/narration_words_v2.json`, `audio/v2/word_timeline_v2.txt` |
| Effect takes, choices, cue sheet, mix measurements | `audio/v2/sfx_raw/`, `audio/v2/sfx_choices_v2.md`, `audio/v2/sfx_cues_v2.json`, `audio/v2/mix/mix_v2_measure.json` |
| Editable source | `source/src/v2/` (compositions `V2Main`, `V2ThumbA/B`, `V2RobotSheet`) |
| **Upload master 1080p** | `exports/FGW_RobotsDestroy_v2_UPLOAD_1080p.mp4` (Git-ignored; backed up as checksummed parts in `backup/v2/`) |
| Share/review copy (compressed, not for upload) | `exports/FGW_RobotsDestroy_v2_1080p_SHARE.mp4` (Git-ignored; regenerate from the master, see `backup/v2/RESTORE.md`) |
| Captions | `captions/FGW_RobotsDestroy_v2.srt` |
| Thumbnails | `thumbnail/FGW_RobotsDestroy_v2_thumbA_edge_1280x720.jpg` (main), `…v2_thumbB_leap…` (backup) |
| Title, description, chapters | `upload/UPLOAD_TEXT_v2.md`, `upload/chapters_v2.txt` |
| QA | `QA_REPORT.md` (V2 section), `qa/v2/qa_v2_results.json`, contact sheets in `qa/v2/` |
| Asset rights | `production/ASSET_RIGHTS.md` → "V2 additions" |

### Rebuild V2

    cd Future_Got_Weird/they-trained-robots-to-destroy-themselves
    (cd source && npm ci)
    python3 tools/v2/stitch_narration_v2.py                 # selected takes -> audio/v2/narration/narration_v2.(wav|mp3) + word timings
    (cd source && node ../tools/v2/collect_sfx_v2.mjs)      # cue sheet from src/v2/sfx_v2.ts -> audio/v2/sfx_cues_v2.json
    python3 tools/v2/prep_sfx_v2.py                         # choose/trim the V2 ElevenLabs takes -> source/public/v2/audio/sfx/
    python3 tools/synth_audio.py                            # V1 in-house effects (reused by V2)
    python3 tools/v2/synth_audio_v2.py                      # furnace bed, room tone, trace, V2 score (deterministic)
    python3 tools/v2/mix_audio_v2.py                        # -> source/public/v2/audio/mix_v2.mp3 (-15 LUFS, -1.5 dBTP)
    (cd source && npx remotion render src/index.ts V2Main ../exports/FGW_RobotsDestroy_v2_UPLOAD_1080p.mp4 --crf=16 --x264-preset=slow --color-space=bt709 --audio-bitrate=320k)
    python3 tools/v2/make_srt_v2.py                         # captions + transcript-vs-script check
    python3 tools/v2/qa_v2.py                               # measured QA -> qa/v2/qa_v2_results.json
    (cd source && npx remotion still src/index.ts V2ThumbA ../qa/v2/thumbs/thumbA.png)   # thumbnails (V2ThumbA / V2ThumbB)

Stills for inspection: `cd source && COMP=V2Main SCALE=0.5 node stills.mjs ../qa/<dir> t:<seconds> …`.

---

## V1

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
