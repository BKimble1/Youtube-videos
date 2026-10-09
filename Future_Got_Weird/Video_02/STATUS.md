# Video 02 status: "How Cameras See Around Corners" (v1, 9 October 2026)

**State: finished and releasable.** Three review rounds; the last one found no blocker or major defect open. Publishing
is the owner's action (`package/UPLOAD_PACKAGE.md`). Branch `claude/new-session-h21vtg` of `BKimble1/Youtube-videos`,
folder `Future_Got_Weird/Video_02/` (the Video 01 folders were not touched).

## Delivered files

| File | Spec (measured) | SHA-256 (first 16) |
|---|---|---|
| `exports/Future_Got_Weird_Video_02_v1_MASTER_4K.mp4` | 3840×2160, 30 fps, 12,120 frames, 404.01 s, H.264 CRF 14 (PNG frame capture), BT.709, AAC 320k; 133 MB | `aa86710147504669` |
| `exports/Future_Got_Weird_Video_02_v1_UPLOAD_1080p.mp4` | 1920×1080, 30 fps, same composition, CRF 16; 65 MB | `c75dba9dc1f9db34` |
| `exports/Future_Got_Weird_Video_02_v1_PREVIEW_720p.mp4` | 1280×720 review copy, labelled "REVIEW PREVIEW · not for upload"; 19 MB | `956f109998d6def4` |
| `exports/Future_Got_Weird_Video_02_v1.srt` (= `package/…v1.srt`) | 147 captions from the final narration timing; matches the script word for word; ≤ 42 chars/line | |
| `exports/Future_Got_Weird_Video_02_v1_thumbnail.png/.jpg` | thumbnail C (recommended); A and B are alternatives in `thumbnails/` | |
| `package/` | `UPLOAD_PACKAGE.md` (titles, description, chapters, owner checklist), `description.txt`, `chapters.txt`, `titles.txt` | |

The 4K master is a true 3840×2160 render of the vector composition (`--scale=2`), not an upscale; it contains no
generated video. Media is not in Git (LFS types; host unreachable): all three films, the rendered audio (FLAC) and the
irreplaceable ElevenLabs takes are committed as checksummed split parts under `backup/v02/` (`RESTORE.md`); a full
rebuild-and-verify (`python3 tools/backup_v02.py --verify`) passes, and a test restore of the sources was byte-identical.

## Film

6:44.01, 48 narration lines in five acts (1,111 words), nine scenes: the impossible view (real tracking data in the
opening), why a plain wall works, the faint echo (real raw counts), timing becomes a map (arcs, bands, the fold to the
plan view), what came before (2012/2018/2021 shelf, cheap-sensor precedent), small sensors (2026), what the real data
shows (U reconstruction, kit conditions, the authors' separate ordinary-clothes test), what it might be good for
(warehouse corner, "not a safety system"), back to our friend (the payoff gag). Chapters: 0:00, 1:00, 1:35, 2:11, 3:09,
3:56, 4:53, 5:38, 6:12. Claims: 45, all traced in `research/claims.csv`.

- **Voice:** the designed ElevenLabs "Test Voice" (model Eleven v4), 21 sections × 4 takes, scored and chosen line by
  line; two sections re-recorded for accuracy (s27–s29 cheap-sensor precedent; s39 "in a separate test").
- **Sound:** 72 ElevenLabs effect kinds (317 placed cues), an original FluidSynth score that follows the timeline, mix at
  **−15.5 LUFS integrated, −1.3 dBTP true peak** (both measured with ffmpeg ebur128 on the delivered files), effects
  ducked 5 dB under speech; stems in `audio/mix/v2/` (narration, ducked music, effects + room tone).
- **Picture:** Remotion 4.0.533; all characters are the accepted Video 01 cast as code rigs; the room, light paths, arcs and
  bands come from one verified layout (`research/geometry`, 89 checks pass); light never passes over or through the
  partition (`assertAroundTheEnd` runs at module load in every room scene). Real data are drawn from the authors' released
  files (`source/src/data/evidence/`), labelled with their conditions.

## Media-generation spend

| Service | What | Spend |
|---|---|---|
| ElevenLabs | narration takes (incl. two re-recordings) and Scribe alignments | 0 credits reported per call |
| ElevenLabs | sound effects: 216 generations (72 kinds × 3) | 3,599.64 credits (≈ US$0.65), per the tool's reports |
| Runway | one image-to-video job (R3, Kling 3.0 Pro, 5 s, 1080p) | **60 credits** (balance 2,250 → 2,190); cap was 500 |
| ChatGPT | the artwork batch (made by the owner from `art/packet/`) | outside this session |

**Runway shots accepted: none.** R3 was generated, but this environment's network policy blocks Runway's output host
(`dnznrvs05pmza.cloudfront.net`), so it could not be downloaded or inspected, and no more jobs were run. Every candidate
shot plays as its reviewed Remotion version. See `runway/RUNWAY_PLAN.md` (how to add inserts later) and `runway/RUNWAY_LOG.md`.

**Artwork:** the ChatGPT batch (17 PNGs, hashes verified) was assessed in detail; no generated pixel is on screen (the
plates do not register with the film's projection, cannot follow its camera into the plan view, and would be soft at
4K). It drove four code changes, including a physics correction (the mirror shows his back). See `art/ART_USE.md`.

## Review actually performed

1. Kit and per-scene: every scene was built by one agent and then reviewed and fixed by an independent "director" agent
   (stills, half-resolution clips, dense contact sheets, motion reports); reports in `qa/scene_review/<scene>/REPORT.md`.
2. Light-path legibility: five prototype fixes, three judges (physics, sound-off phone viewer, cost), one synthesized
   plan (`qa/PATH_LEGIBILITY_PLAN.md`), implemented across six scenes and re-reviewed.
3. Full-film review round 1 on the first complete render: four scene-group directors, an accuracy/claims pass, an
   audio/sync pass and a sound-off first-time-viewer pass; every finding checked by a skeptic. 45 confirmed defects
   (11 major, 0 blocker) → `qa/DEFECT_LOG.md`; fixed in fix round 1 (one builder per scene in isolated copies).
4. Round 2 on the second render: 42 fixed, 3 partly, 15 new minor → `qa/REVIEW_R2.md`; fix round 2.
5. Round 3 on the final 1080p file: 15 of 16 items fixed, picture stable outside the changed ranges, audio measured;
   verdict "releasable as is" → `qa/REVIEW_R3.md`. The 4K master was spot-checked against the 1080p file (six frames;
   mean difference 0.3–2 levels; crisp vector edges) and its audio measured.
6. Scene hand-offs checked on cut sheets (`qa/cuts/r0`–`r4`); captions checked against the script; the public package
   scanned for anything identifying the channel owner (none).

**Not performed: nobody has listened to the audio.** This session cannot play sound; every audio check was a
measurement (loudness, peaks, alignment, levels per scene, cue timing against frames).

## Known limitations in v1 (all minor)

- N16 (S1.4–S1.5): the room's right-side cut end is in frame for a few seconds, a "dollhouse" edge.
- N17 (S7, s38, frames ≈9513–9518): his elbow folds across his chest as his hand returns to his hip.
- N18 (S9, J4): her planted shoe slides about 12 px during the last step of her stroll.
- D02 residual (S1 raised shots): her pencil points towards the wall spot; the spot is lit only while light is there.
- By design, most of the wall-to-him light leg is hidden behind the partition in the room view (honest for this camera);
  the "seen from above" card carries "around the end, by way of the wall".

## Owner checklist (open checks)

1. **Listen through once** on headphones: the voice, music under speech, and that the `smug_exhale` / `relief_sigh`
   effects contain no words.
2. Choose the thumbnail (C recommended; A is accurate and worth an A/B test).
3. YouTube's altered/synthetic content setting (the narration is a designed synthetic voice; the description says so).
4. Optional courtesy email to the paper's authors about re-plotting their released data (the repository's MIT licence
   covers the code; whether it covers the data is ambiguous; see `research/RIGHTS.md`).
5. Optional Runway inserts: allow the two CloudFront hosts in the environment's network settings and follow
   `runway/RUNWAY_PLAN.md`.

## Rebuild

`README.md` gives install and every step; the delivered files were made with
`python3 tools/make_package.py` and `bash tools/make_deliverables.sh master|upload|preview|extras` from the commit that
carries this file. Render times here: 1080p ≈ 8.5 min, 4K ≈ 33 min.
