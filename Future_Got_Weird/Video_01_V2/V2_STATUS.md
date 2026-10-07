# Video 01 · V2 — baseline status

This records exactly what the V2 production pass contains at the moment it was frozen as the baseline, and what is
not finished. The baseline is one fixed commit on branch `claude/new-session-96c7w8`; its hash is recorded in
`BASELINE.md` next to this file (added in the commit right after it). Check it out with
`git checkout <hash> -- Future_Got_Weird/Video_01_V2` or `git worktree add <dir> <hash>`; later work on the branch
does not change it. (A tag, `fgw-video01-v2-baseline`, marks it in the production workspace; the remote did not
accept tag pushes from that environment.)

**V2 is not finished.** The narration, the shared animation kit, the cold open (S1), the short version (S2), the
transition system and the sound / music pipeline are done. Scenes S3–S10 in `source/` are still the V1 scene code
running on the V2 narration timing; their V2 rebuilds exist only as work in progress (see below). No V2 final mix and
no V2 review render (`Future_Got_Weird_Video_01_V2_1080p_REVIEW.mp4`) exist yet. The finished, published-quality film
remains the pass-2 / V1 render in `../Video_01_Pass_2/exports/` (backed up in `../Video_01_Pass_2/backup/`).

## Done (in `source/` and `tools/`, tracked in Git; media in `backup/v2_baseline/`)

- **Narration (V2 voice).** ElevenLabs "Test Voice" (`kk5XaSLo2XAw0sKM98zU`, `eleven_v4`), recorded in 17 directed
  sections × 4 takes, force-aligned, measured, chosen line by line and assembled without any time-stretching.
  Runtime 4:48.2 (V1 4:40.8). Text and prompts: `script/narration_segments.json`, `narration_sections.json`,
  `narration_selection.json`; per-take alignment and evaluation: `audio/narration/v2/`; timing used by every scene:
  `source/src/data/timeline.json`; subtitles: `script/subtitles_v2.srt`. Tools: `tools/v2_script.py`,
  `el_collect.py`, `el_align_collect.py`, `v2_takes.py`, `build_timeline.py --engine v2`.
- **Shared animation kit** (`source/src/lib`, `source/src/components`): `motion.ts` (eases, keyframes, springs,
  impact squash, drop, strike, idle drift, directed camera paths, camera kick), `camera.tsx` (`worldToScreen`),
  `Character.tsx` (idle life: drift + eye saccades; two-bone arm IK `reach` / `handWorld`), `cast.ts`,
  `components/v2/` (`StampArm`, `RollingNumber`, `DrawBox`, `Catalogue` (CatalogueV2 + IndexCard), `AnswerSlip`),
  `Props.tsx` (ring marks and highlight pulse), `Sets.tsx` (counter windows behind the counter, sign swing, counter
  nudge, extended walls, wordmark underline), `lib/measure.ts`, `lib/handoffs.ts`, `lib/sfx.ts`.
- **Transitions** (`source/src/Main.tsx`): per-boundary cut / reveal / wipe / iris, with shared hand-off geometry.
- **S1 (cold open) and S2 (the short version)** rebuilt to the V2 brief (word-keyed beats, directed camera, real hand
  contact, physical stamps, the ticket-to-paper match, the deadpan close-up, the slip-lift cut into S2, performing
  claim cards, the brand card that lifts away into S3). Motion QA (`qa/v2_motion/S1_motion.json`, `S2_motion.json`,
  `tools/qa_dense.py`): no still run of 0.8 s or more in either scene (V1: 39 % and 74 % of the time still,
  `qa/v1_review/motion.json`).
- **Sound and music pipeline**: `tools/collect_sfx.mjs` (cue sheets exported by the scenes), `sfx_lib.py` (52-kind
  measured effect library from 144 new ElevenLabs takes + 10 reused pass-2 effects + 1 synth tick; choices in
  `audio/sfx/v2/SELECTION_V2.md`), `make_sfx_v2.py` (frame-accurate placement + ambience stem),
  `make_music_v2.py` (dynamic, section-aware music bed with drops for reveals and jokes), `mix_v2.py`
  (−16 LUFS, ≤ −1 dBTP), `audio_qc.py`.
- **V1 shot-by-shot review** (analyst + critic per scene): `qa/v1_review/S*_analysis.md`.
- **Direction for the rest of the pass**: `V2_BRIEF.md`, `V2_DIRECTION.md`.

## Not finished

1. **S3–S10 V2 rebuilds are not merged.** Builder passes were complete for S3, S4, S5, S6, S7, S9 and S10 and
   running for S8; the independent director review-and-fix passes had just started (S6). Their code lives in the
   isolated copies `work/<scene>/source` (Git-ignored) and is snapshotted in `backup/v2_baseline/v2_wip_scenes.tar`
   (restored to `work_snapshot/`), as it stood at 2026-10-07 23:12 UTC; edits made after that are only in `work/`.
   None of it has been reviewed or merged into `source/`. When merging, take only each scene's own files
   (`src/scenes/<S>_*.tsx`, `src/components/v2/<S>_*.tsx`): the work copies were seeded before the last shared-kit
   changes, so their `Sets.tsx`, `S1_Counter.tsx` and `S2_ShortVersion.tsx` are older than the baseline's.
2. **Sound for S3–S10.** The pipeline runs, but only S1 and S2 export cue sheets so far; the mix in
   `audio/mix/v2/` is a first pass with S1/S2 effects only, and `source/public/audio/mix.wav` (needed by the `Main`
   composition) has not been written for V2.
3. **Final QC** (no-audio watch, no-video listen, phone size, full watch) and the fixes it finds.
4. **The V2 review render** `exports/Future_Got_Weird_Video_01_V2_1080p_REVIEW.mp4` (true 1920×1080, 30 fps).
5. **V2 docs and packaging**: `storyboard/STORYBOARD.md`, `script/FINAL_SCRIPT.md`, `package/UPLOAD_PACKAGE.md`,
   `research/sources.md`, `assets/`, `thumbnails/` are carried over from pass 2 and describe the V1 film.

## Rebuilding the baseline from a fresh clone

```sh
cd Future_Got_Weird/Video_01_V2
(cd backup/v2_baseline && sh reconstruct.sh && python3 restore_v2.py)   # media, verified sample by sample
(cd source && npm ci && npx tsc --noEmit -p .)                          # project
(cd source && SCALE=0.5 node stills.mjs /tmp/stills 0 "word:s03:None+4")   # any frame (COMP=Preview, muted)
python3 tools/mix_v2.py                                                  # writes source/public/audio/mix.wav
```

After `restore_v2.py` the media is complete and `mix_v2.py` alone produces the mix. To re-derive the sound from the
scenes' cue sheets instead: `node tools/collect_sfx.mjs source audio/sfx/v2/cues.json && python3 tools/sfx_lib.py &&
python3 tools/make_sfx_v2.py && python3 tools/make_music_v2.py && python3 tools/mix_v2.py` (the music needs FluidSynth
and the MuseScore General SoundFont).

## Costs recorded during V2

ElevenLabs: narration takes as recorded in `audio/narration/v2/`; blind re-transcription checks ≈ 1,500 credits
(far above the tool's estimate; discontinued); sound effects 904.91 credits for 144 takes
(`audio/sfx/v2/raw/COST.txt`).
