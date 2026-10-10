# Future Got Weird · Video 02 · "How Cameras See Around Corners"

An animated explainer for the anonymous channel Future Got Weird: how a plain wall can give away someone hiding behind a
partition, how the timing of a small time-of-flight sensor's light becomes a map, what earlier laboratory systems did,
and what a study published in 2026 managed with consumer-grade sensors, including its limits.
1920×1080 composition at 30 fps; the master is rendered at 3840×2160 from the same composition.

**Current version: v2 (5:23.9), the owner's editorial pass** (`v2/REVISION_BRIEF.md`; what changed: `v2/CHANGE_LOG.md`;
QA: `v2/QA_V2.md`). v1 (6:44) is preserved: `v2/V1_BASELINE.md` says how to restore it exactly.

**Read first:** `STATUS.md` (what is finished, what was reviewed, open checks), then `DIRECTION.md` (episode rules).
Publishing is the owner's action; the upload kit is `package/UPLOAD_PACKAGE.md`.

## Layout

```
research/      claims.csv (every on-screen and spoken claim, its source, locator and conditions), SOURCES.md (public
               source list), RIGHTS.md, EXPERIMENT_RECORD.md, OPENING_EVIDENCE.md, geometry/ (the verified room layout
               and geometry_check.py), code_reproduction/ (the authors' released code and data, re-run; plotted JSON)
script/        SCRIPT.md (48 lines, five acts), narration_segments.json / narration_sections.json (from tools/v02_script.py),
               narration_selection.json (take per line), subtitles_v2.srt
storyboard/    STORYBOARD.md (every shot: question, action, consequence, claims), animatic/ (beat animatic cards)
art/           packet/ (the ChatGPT request), incoming/ (the delivered batch, hashed), ART_MANIFEST.md, ART_USE.md
               (how each asset was used), ASSESS_*/CRITIC_* (the assessment)
audio/         narration/v2 (ElevenLabs Test Voice takes, forced alignments, evaluation, assembled lines),
               sfx/v2 (ElevenLabs SFX library, cue sheets, placed tracks), music/v02 (original FluidSynth score and plan),
               mix/v2 (final mix and the narration / music / effects stems, QC)
source/        Remotion 4 project (src/scenes S1-S9, src/components/v02 kit, src/lib room projection, optics, motion,
               timeline; src/data timeline.json, layout.json, evidence/*.json, inserts.json)
runway/        RUNWAY_PLAN.md, RUNWAY_LOG.md, runway_log.json, per-shot inputs and accepted clips
thumbnails/    thumb_A, B, C (code-drawn; source in source/src/Thumbnails.tsx); the recommended one is named in package/UPLOAD_PACKAGE.md
package/       UPLOAD_PACKAGE.md, description.txt, chapters.txt, titles.txt (from tools/make_package.py)
qa/            scene_review/ (final contact sheets and director reports per scene), cuts/ (hand-off sheets),
               PATH_LEGIBILITY_PLAN.md, render review and defect log
exports/       rendered films (Git-ignored; preserved as split parts under backup/)
backup/        split-part media backup with SHA-256 checksums and a tested restore script
tools/         every pipeline step (see below)
```

Media (`*.wav`, `*.mp3`, `*.mp4`) is ignored by Git (these are Git LFS types in this repository and the LFS host is
not reachable from the production environment). It is preserved as committed split parts under `backup/`; restore
with `backup/RESTORE.md`.

## Requirements

Tested with Node 22.22.0 / npm 10.9.4, Python 3.13 (`numpy scipy soundfile pyloudnorm pillow praat-parselmouth`),
ffmpeg 6.1.1, FluidSynth 2.3 with the MuseScore General SoundFont, and Chromium headless shell (path in
`source/remotion.config.ts`, override with `REMOTION_BROWSER_EXECUTABLE`). Remotion 4.0.533, React 19.1.0,
TypeScript 5.8.3, pinned in `source/package-lock.json`.

```bash
cd source && npm ci            # exact versions from the lockfile
npx tsc --noEmit -p .          # typecheck
npx remotion studio src/index.ts   # interactive preview
```

## Rebuild, step by step

### v2 (current)

```bash
python3 tools/make_claims.py                       # research/claims.csv (v2 lines cite it)
python3 tools/v02v2_build.py                       # v2/script_v2.json -> script/narration_*.json, SCRIPT.md
python3 tools/v2_takes.py eval --fill && python3 tools/v2_takes.py assemble   # takes in audio/narration/v2/takes
python3 tools/build_timeline.py --engine v2        # timeline (scenes V1-V13), narration.wav, captions
node tools/collect_sfx.mjs && python3 tools/make_sfx_v2.py   # cue sheets of scenes V1-V13 -> effects/ambience tracks
python3 tools/make_music_v02v2.py                  # the v2 score (reads every cue from the timeline)
python3 tools/mix_v2.py --music audio/music/v02v2/music_bed.wav && python3 tools/audio_qc.py
python3 tools/make_package.py                      # description, chapters, title, end screen, captions copy
bash tools/make_deliverables.sh all                # _v2_ MASTER_4K, UPLOAD_1080p, PREVIEW_720p, srt, thumbnail
```

Scenes are `source/src/scenes/V1_*.tsx` … `V13_*.tsx` (the v1 scenes `S1`-`S9` stay in the tree, unused); the shared
v2 kit is `source/src/components/v2k/` (`KIT_V2.md`); scene parts are `source/src/components/v2s/`. Workflows used for
the pass: `tools/wf_narration.js`, `tools/wf_v2_scenes.js`, `tools/wf_v2_review.js`, `tools/wf_v2_fix.js`,
`tools/wf_v2_release_check.js`.

### v1 (as delivered; restore with `git checkout 40183b0 -- Future_Got_Weird/Video_02` first)

```bash
# 1. research geometry -> source layout (asserts the blocked and clear paths)
python3 research/geometry/geometry_check.py && python3 tools/sync_layout.py
python3 -I tools/export_evidence.py            # the authors' data -> src/data/evidence/*.json
python3 tools/make_claims.py                   # research/claims.csv
# 2. script and narration (ElevenLabs takes are already in audio/narration/v2/takes)
python3 tools/v02_script.py                    # script JSON + SCRIPT.md, with checks
python3 tools/v2_takes.py eval && python3 tools/v2_takes.py assemble
python3 tools/build_timeline.py --engine v2    # src/data/timeline.json, public/audio/narration.wav, captions
# 3. sound
node tools/collect_sfx.mjs source audio/sfx/v2/cues.json   # every scene's cue sheet
python3 tools/sfx_lib.py && python3 tools/make_sfx_v2.py   # library + effects/ambience tracks
python3 tools/make_music_v02.py                            # original score bed
python3 tools/mix_v2.py && python3 tools/audio_qc.py       # mix (-15.5 LUFS, <= -1 dBTP) + stems + QC
# 4. picture
cd source
SCALE=0.5 node stills.mjs ../qa/stills word:s04:around+12  # spot-check frames (PLATE=1: Runway plates)
npx remotion render src/index.ts Main ../exports/Future_Got_Weird_Video_02_v1_REVIEW_1080p.mp4 --crf=18   # review only
cd .. && python3 tools/make_package.py         # description, chapters, titles, captions copy from the final timeline
bash tools/make_deliverables.sh all            # or: master | upload | preview | extras
```

`tools/make_deliverables.sh` writes `exports/Future_Got_Weird_Video_02_v1_MASTER_4K.mp4` (3840x2160, CRF 14, PNG frame
capture), `..._UPLOAD_1080p.mp4` (CRF 16), `..._PREVIEW_720p.mp4` (labelled review copy), `..._v1.srt` and
`..._thumbnail.png/.jpg` (the recommended thumbnail named in `package/UPLOAD_PACKAGE.md`).

The exact commands used for the delivered files, with their measured output, are in `STATUS.md`.

## Rules every change must keep

- Nothing public identifies the channel owner. The narration is the designed ElevenLabs "Test Voice".
- Every claim traces to `research/claims.csv`; experiment conditions stay separate (evaluation kit vs research device,
  retroreflective vs diffuse, tracking vs reconstruction, capture rate vs latency, publication vs experiment date).
- Light paths are straight segments between layout points; nothing passes through or over the partition
  (`assertAroundTheEnd`, run at module load). Illustrative numbers come from the same geometry and are labelled.
- Generated art or video never carries text, data or physics; the real measurements are the authors' released data,
  plotted by us.
- Motion is a pure function of the frame (word-cued; seeded randomness only).
