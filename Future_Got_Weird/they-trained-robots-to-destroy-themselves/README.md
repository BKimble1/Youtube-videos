# Future Got Weird: They Trained Robots to Destroy Themselves

## V5 (15 Oct 2026): the current version

**Status.** The V5 revision is complete. V1–V4 are preserved unchanged.

V5 is a substantial editing and animation pass on V4. It keeps the V4 vector F.02/F.03 robots, the Crew and the
orange furnace look, and makes these changes:

- a new 7-second opening, with a matched cut from the furnace surface to the simulator target;
- a recut narration with a new hook line (3:53.5 → **3:36.7**, without speeding up the voice);
- consequences shown on screen for every retirement option;
- 26 transitions built from objects in the scenes;
- a sequential policy diagram;
- sim-to-real close-ups;
- a continuous real jump;
- an unfamiliar-task example;
- a rebuilt ending (silhouette, three crew actions, a symbolic simulator landing, glow into the logo);
- a re-cued sound design and score.

The format is 1920×1080 at 30 fps native.

It is **not published**; that is the owner's step. Nobody has watched it in real time or listened to it here.
`QA_REPORT.md` (V5 section) lists exactly what was checked.

| What | Where |
|---|---|
| Change list, transitions, text audit, unresolved limitations | `production/v5/CHANGES_V5.md` |
| Source credits | `production/v5/CREDITS_V5.md` |
| Editable source | `source/src/v5/` (composition `V5Main`) |
| Narration (new hook and Imatra takes, recut) | `tools/v5/stitch_narration_v5.py`, `audio/v5/narration/`, word timings `audio/v5/narration_words_v5.json`, script `script/script_v5.md` |
| Cue sheet, score, mix, speech-masking check | `source/src/v5/sfx_v5.ts`, `audio/v5/sfx_cues_v5.json`, `tools/v5/synth_score_v5.py`, `tools/v5/mix_audio_v5.py`, `audio/v5/mix/mix_v5_measure.json`, `audio/v5/mix/speech_mask_v5.txt` |
| **Upload master 1080p** | `exports/FGW_RobotsDestroy_v5_UPLOAD_1080p.mp4` (Git-ignored; backed up as checksummed parts in `backup/v5/`) |
| Share/review copy (compressed, not for upload) | `exports/FGW_RobotsDestroy_v5_1080p_SHARE.mp4` (Git-ignored; regenerate with `tools/v5/share_and_backup_v5.sh`) |
| Captions | `captions/FGW_RobotsDestroy_v5.srt` (new timings) |
| Title, description, chapters | `upload/UPLOAD_TEXT_v5.md`, `upload/chapters_v5.txt` |
| Thumbnails | The V4 files remain current |
| QA | `QA_REPORT.md` (V5 section), `qa/v5/qa_v5_results.json`, transition strips `qa/v5/strips/`, phone-size pages `qa/v5/phone_r1/`, V4-vs-V5 frames `qa/v5/compare/` |

**Source layout (`source/src/v5/`)**

- `cues.ts` holds the V5 word cues.
- `rig/` holds `jump5` (weight shift → planted push → ballistic flight → plunge, stick, short or faceplant) and
  `arms` (FK/IK arm blend, palm-locked props).
- `kit/` holds `cam5`, with smoothed cameras and framing guards.
- `sets/` holds the foundry, plant and set dressing.
- `shots/` holds `Hook`, `Factory`, `Options`, `Imatra`, `Post`, `Train`, `Real`, `Prove` and `End`.
- `MainV5.tsx` is the timeline.
- `sfx_v5.ts` is the cue sheet and also exports the transition times.

### Rebuild V5

    cd Future_Got_Weird/they-trained-robots-to-destroy-themselves
    (cd source && npm ci)
    python3 tools/v5/stitch_narration_v5.py                 # narration from the takes -> audio/v5 + word timings
    (cd source && node ../tools/v5/collect_sfx_v5.mjs)      # cue sheet + transition times -> audio/v5/sfx_cues_v5.json
    python3 tools/v5/synth_score_v5.py                      # -> source/public/v5/audio/music_v5.wav
    python3 tools/v5/mix_audio_v5.py                        # -> source/public/v5/audio/mix_v5.mp3 (-15 LUFS, -1.5 dBTP)
    python3 tools/v5/speech_mask_v5.py                      # where effects come within 6 dB of the voice
    python3 tools/v5/make_srt_v5.py                         # captions + script check
    (cd source && npx remotion render src/index.ts V5Main ../exports/FGW_RobotsDestroy_v5_UPLOAD_1080p.mp4 --props='{"audio":"mix"}' --crf=16 --x264-preset=slow --color-space=bt709 --audio-bitrate=320k)
    bash tools/v5/share_and_backup_v5.sh                    # share copy + checksummed backup parts
    python3 tools/v5/qa_v5.py                               # measured QA -> qa/v5/qa_v5_results.json
    python3 tools/v5/strips_v5.py                           # ±12-frame strips at every transition (qa/v5/transitions_v5.json)
    python3 tools/v5/compare_v5.py                          # V4 vs V5 frames for the brief's problem spots

Stills for inspection: `cd source && COMP=V5Main SCALE=0.5 node stills.mjs ../qa/<dir> t:<seconds> …`.

---

## V4 (15 Oct 2026)

**Status.** The V4 revision is complete; V1–V3 are preserved unchanged. V4 redraws the episode as a fast illustrated
explanation in vector art (about 85 % flat/controlled 2.5D, 15 % atmosphere) with cartoon F.02 and F.03
characters (drawn from the brief's descriptions) and the channel's Crew. Narration, story, chapters and timing are identical to V2/V3: 3:53.5, 1920×1080,
30 fps native.

The V4 upload master was rendered from source and checked with measurements, transition strips around every
transition and V3-vs-V4 comparison frames. It is **not published**; that is the owner's step. Nobody has yet watched
it in real time or listened to it. `QA_REPORT.md` (V4 section) lists exactly what was and wasn't checked.

| What | Where |
|---|---|
| Defect log (the brief's six ranked fixes, plus defects found during V4) | `production/v4/DEFECT_LOG_V4.md` |
| Model records (F.02, F.03, avatar, performer, silhouette); symbol handling | `production/v4/MODEL_RECORDS_V4.md` |
| Comparison sheets (front / ¾ / side / ¾ left, head, chest, phone-size; key poses) | `production/v4/V4Sheet0.png`, `V4Sheet1.png`, `V4Sheet2.png` |
| Source credits | `production/v4/CREDITS_V4.md`; rights in `production/ASSET_RIGHTS.md` → "V4 additions" |
| Editable source | `source/src/v4/` (compositions `V4Main`, `V4ThumbA/B`, `V4Sheet0/1/2`) |
| Cue sheet, mix, speech-masking check | `source/src/v4/sfx_v4.ts`, `audio/v4/sfx_cues_v4.json`, `audio/v4/mix/mix_v4_measure.json`, `audio/v4/mix/speech_mask_v4.txt` |
| **Upload master 1080p** | `exports/FGW_RobotsDestroy_v4_UPLOAD_1080p.mp4` (Git-ignored; backed up as checksummed parts in `backup/v4/`) |
| Share/review copy (compressed, not for upload) | `exports/FGW_RobotsDestroy_v4_1080p_SHARE.mp4` (Git-ignored; regenerate with `tools/v4/share_and_backup_v4.sh`) |
| Captions | `captions/FGW_RobotsDestroy_v4.srt` (same as V2/V3; timing unchanged) |
| Thumbnails | `thumbnail/FGW_RobotsDestroy_v4_thumbA_edge_1280x720.jpg` (main), `…v4_thumbB_leap…` (backup) |
| Title, description, chapters | `upload/UPLOAD_TEXT_v4.md`, `upload/chapters_v4.txt` |
| QA | `QA_REPORT.md` (V4 section), `qa/v4/qa_v4_results.json`, strips `qa/v4/strips/`, comparisons `qa/v4/compare/` (model/emblem, 0:19.6 transition, 2:15 limb overlap, building/airbag) |

**Source layout (`source/src/v4/`)**

- `rig/` holds the vector robot: matrices, models, the `Robot2D` renderer, poses and the jump builder.
- `kit/` holds the camera, timing, crew wrapper and chips, plus the paper-roll transition.
- `sets/` holds the foundry, teaching stage, product bay and props.
- `shots/` holds `Opening`, `WhyA`/`WhyB`, `Film`, `Train`, `Real`, `Prove` and `End`.
- `sfx_v4.ts` is the cue sheet.
- `dev/` holds the sheets and thumbnails.

### Rebuild V4

    cd Future_Got_Weird/they-trained-robots-to-destroy-themselves
    (cd source && npm ci)
    # V2 audio inputs (narration, effects, score) as in "Rebuild V2" below, then:
    (cd source && node ../tools/v4/collect_sfx_v4.mjs)      # cue sheet from src/v4/sfx_v4.ts -> audio/v4/sfx_cues_v4.json
    python3 tools/v4/mix_audio_v4.py                        # -> source/public/v4/audio/mix_v4.mp3 (-15 LUFS, -1.5 dBTP)
    python3 tools/v4/speech_mask_v4.py                      # where effects come within 6 dB of the voice (measurement)
    (cd source && npx remotion render src/index.ts V4Main ../exports/FGW_RobotsDestroy_v4_UPLOAD_1080p.mp4 --props='{"audio":"mix"}' --crf=16 --x264-preset=slow --color-space=bt709 --audio-bitrate=320k)
    bash tools/v4/share_and_backup_v4.sh                    # share copy + checksummed backup parts
    python3 tools/v4/qa_v4.py                               # measured QA -> qa/v4/qa_v4_results.json
    python3 tools/v4/strips_v4.py                           # ±12-frame strips at every transition (qa/v4/transitions_v4.json)
    python3 tools/v4/compare_v4.py                          # V3 vs V4 comparison frames

Stills for inspection: `cd source && COMP=V4Main SCALE=0.5 node stills.mjs ../qa/<dir> t:<seconds> …`.

---

## V3 (14 Oct 2026)

**Status.** The V3 rebuild is complete; V1 and V2 are preserved unchanged. V3 is a picture, animation, transition and
defect-repair pass. The narration, story and timing are identical to V2: 3:53.5, 1920×1080, 30 fps native.

The V3 upload master was rendered from source and checked with measurements, full-episode contact sheets and 25-frame
strips around every changed transition. It is **not published**; that is the owner's step. Nobody has yet watched it
in real time or listened to it. `QA_REPORT.md` (V3 section) lists exactly what was and wasn't checked and gives a
focused review list.

| What | Where |
|---|---|
| Defect log (V2 time, symptom, cause, change, V3 location, inspection) | `production/v3/DEFECT_LOG_V3.md` |
| Model records (F.02, F.03, avatar, performer); symbol handling | `production/v3/MODEL_RECORDS_V3.md` |
| Comparison sheets | `production/v3/V3SheetF02.png`, `V3SheetF03.png`, `V3SheetID.png` |
| Figure symbol (verbatim SVG, transparent copy, path) | `production/v3/brand/` |
| Source credits | `production/v3/CREDITS_V3.md`; rights in `production/ASSET_RIGHTS.md` → "V3 additions" |
| Editable source | `source/src/v3/` (compositions `V3Main`, `V3ThumbA/B`, `V3SheetF02/F03/ID`, `V3Diag`, `V3CamTest`) |
| Cue sheet, mix, speech-masking check | `source/src/v3/sfx_v3.ts`, `audio/v3/sfx_cues_v3.json`, `audio/v3/mix/mix_v3_measure.json`, `audio/v3/mix/speech_mask_v3.txt` |
| **Upload master 1080p** | `exports/FGW_RobotsDestroy_v3_UPLOAD_1080p.mp4` (Git-ignored; backed up as checksummed parts in `backup/v3/`) |
| Share/review copy (compressed, not for upload) | `exports/FGW_RobotsDestroy_v3_1080p_SHARE.mp4` (Git-ignored; regenerate with `tools/v3/share_and_backup_v3.sh`) |
| Captions | `captions/FGW_RobotsDestroy_v3.srt` (same as V2; timing unchanged) |
| Thumbnails | `thumbnail/FGW_RobotsDestroy_v3_thumbA_edge_1280x720.jpg` (main), `…v3_thumbB_leap…` (backup) |
| Title, description, chapters | `upload/UPLOAD_TEXT_v3.md`, `upload/chapters_v3.txt` |
| QA | `QA_REPORT.md` (V3 section), `qa/v3/qa_v3_results.json`, strips `qa/v3/strips/`, comparisons `qa/v3/compare/`, review sheets `qa/v3/review/` |

### Rebuild V3

    cd Future_Got_Weird/they-trained-robots-to-destroy-themselves
    (cd source && npm ci)
    # V2 audio inputs (narration, effects, score) as in "Rebuild V2" below, then:
    (cd source && node ../tools/v3/collect_sfx_v3.mjs)      # cue sheet from src/v3/sfx_v3.ts -> audio/v3/sfx_cues_v3.json
    python3 tools/v3/mix_audio_v3.py                        # -> source/public/v3/audio/mix_v3.mp3 (-15 LUFS, -1.5 dBTP)
    python3 tools/v3/speech_mask_v3.py                      # where effects come within 6 dB of the voice (measurement)
    (cd source && npx remotion render src/index.ts V3Main ../exports/FGW_RobotsDestroy_v3_UPLOAD_1080p.mp4 --props='{"audio":"mix"}' --crf=16 --x264-preset=slow --color-space=bt709 --audio-bitrate=320k)
    bash tools/v3/share_and_backup_v3.sh                    # share copy + checksummed backup parts
    python3 tools/v3/qa_v3.py                               # measured QA -> qa/v3/qa_v3_results.json
    python3 tools/v3/strips_v3.py                           # ±12-frame strips at every changed transition
    python3 tools/v3/compare_v3.py                          # V2 vs V3 comparison frames

Stills for inspection: `cd source && COMP=V3Main SCALE=0.5 node stills.mjs ../qa/<dir> t:<seconds> …`. The neutral
rig/contact diagnostic is `COMP=V3Diag`.

---

## V2 (14 Oct 2026)

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
