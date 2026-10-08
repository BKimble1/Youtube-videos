# Future Got Weird · Video 01 — "Why AI Is So Confidently Wrong" (V2 production, V3 final)

Video 01 for the anonymous channel **Future Got Weird**: directed, physically animated cutout scenes with ElevenLabs
narration ("Test Voice"), 4:48.23 at 30 fps.

**Status: final (V3).** The owner approved V2 (`APPROVED_V2.md`, source `5bd35c1`). V3 is the restrained final
polish of that film plus a true 4K render from source (`V3_CHANGELOG.md`). Everything to upload, and how to restore
the large files, is in **`DELIVERABLES.md`**; the upload text is in `package/UPLOAD_PACKAGE.md`.

- `DELIVERABLES.md`: final files, checksums, storage, recovery, render commands
- `V3_CHANGELOG.md`: what V3 changed (defect log), audio, packaging
- `qa/V3_QA_NOTES.md`: what was inspected and verified, and what still needs a human (listening)
- `qa/V3_LISTENING_CHECKLIST.md`: timecoded listening checks (no audio playback was available in production)
- `qa/CORRECTIONS.md`: factual corrections log
- `V3_BRIEF.md`, `V2_BRIEF.md`, `V2_DIRECTION.md`: the owner's briefs and the working rules (history)
- `APPROVED_V2.md`, `BASELINE.md`, `V2_STATUS.md`: pointers to earlier states (history)

## Layout

```
script/        narration_segments.json (V2 text + Eleven v4 prompts, 36 segments), narration_sections.json (17 directed
               sections), narration_selection.json (line-by-line take choice), subtitles_v2.srt
               FINAL_SCRIPT.md (V3, generated from the V2 records by tools/export_script_v3.py)
               (narration_blocks.json, cues.json and subtitles_elevenlabs.srt are pass-2 / V1: do not upload)
audio/         narration/v2 (takes, forced alignments, evaluation, assembled segments), sfx/v2 (prompts, raw takes,
               measured library, cue sheets, tracks), music/v2 (dynamic bed + stems), mix/v2 (final mix + stems)
               (narration_v2.wav is the full V2 narration; audio/sfx/elevenlabs holds the reused pass-2 effects)
source/        Remotion 4 project: src/scenes (S1–S10), src/components (Character + cast, props, sets, evidence,
               text, v2/ kit), src/lib (motion, camera, timeline, measure, handoffs, sfx), src/data (timeline.json)
tools/         narration (v2_script, el_collect, el_align_collect, v2_takes, build_timeline), sound (collect_sfx.mjs,
               sfx_lib, make_sfx_v2, make_music_v2, mix_v2, audio_qc), QA (qa_dense, scene_clip.sh, sheet,
               dump_review), backup (backup_v2, backup_split); pass-2 tools kept alongside
qa/            V3_QA_NOTES.md, V3_LISTENING_CHECKLIST.md, CORRECTIONS.md, v3_inspect/ (V3 inspection: visual findings,
               audio audit, claims audit, packaging audit, 4K raster audit, dense sheets), render/ (render commands
               and logs), v1_review/ (history)
exports/       V3 4K master, 1080p review, SRT (media is Git-ignored; split parts in backup/v3_exports/)
backup/        v3_exports/ (V3 master, review, mix and stems as split parts with checksums); v2_review_build/,
               v2_baseline/ (earlier states)
package/       UPLOAD_PACKAGE.md, DESCRIPTION_V3.txt     thumbnails/  Future_Got_Weird_Video_01_V3_thumbnail.jpg
research/      CLAIM_LEDGER_V3.md (current), sources.md (pass 2)     assets/  asset_manifest.csv
work/          (Git-ignored) isolated copies from the V2 scene rebuilds
storyboard/    pass-2 storyboard (history; each scene file opens with its current beat list)
```

Media (`*.wav`, `*.mp3`, `*.mp4`, `*.flac`) is ignored by Git (Git LFS types whose host is not reachable from the
production environment). It is preserved as committed split parts under `backup/` instead.

## Rebuild

Requirements: Node 20+, Python 3.11+ (`numpy scipy soundfile pyloudnorm mido pillow`), ffmpeg, FluidSynth with the
MuseScore General SoundFont, Chromium (path in `source/remotion.config.ts`). Restore and render steps are in
`DELIVERABLES.md`.
Check frames without a full render: `cd source && SCALE=0.5 node stills.mjs <absolute out dir> "word:s03:None+4"`.

## Rules that every change must keep

- Nothing public identifies the channel's owner (see `../CHANNEL_BRIEF.md`). The V3 description, credits, export
  metadata and thumbnail were checked for this (`qa/V3_QA_NOTES.md`).
- Model labels and dates stay exact: GPT-4o, DeepSeek-R1, Llama-4-Scout, 9 May 2025, no web search; Kalai (2001).
- Illustrative numbers are labelled illustrative; the toy quiz is labelled example; "not necessarily more correct".
- No claims about intent ("lying"). See `research/CLAIM_LEDGER_V3.md` (and the must-not list in `research/sources.md`).
- Motion is driven by frame and word cues only; no wall-clock, no `Math.random()` without a seed.
