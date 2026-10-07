# Future Got Weird · Video 01 · V2 production pass — "Why AI Is So Confidently Wrong"

The V2 pass of Video 01 for the anonymous channel **Future Got Weird**: same story, illustrations, palette, cast,
metaphors and jokes as the finished V1 (pass 2), with new narration (ElevenLabs "Test Voice") and directed, physically
animated scenes. 1920×1080, 30 fps, 4:48.2 with the V2 narration.

**Status: V2 is not finished.** Read `V2_STATUS.md` first: it lists what is done, what is not, and how to rebuild.
The baseline is frozen as the Git tag `fgw-video01-v2-baseline`. The finished film is still the V1 / pass-2 render
in `../Video_01_Pass_2/exports/`.

- `V2_BRIEF.md` — the owner's brief for this pass
- `V2_DIRECTION.md` — the working rules, the shared animation kit, scene hand-offs, sound cue sheets, verification
- `V2_STATUS.md` — baseline status, unfinished work, rebuild steps
- `backup/v2_baseline/RESTORE.md` — the media that Git does not carry, and how to restore it

## Layout

```
script/        narration_segments.json (V2 text + Eleven v4 prompts, 36 segments), narration_sections.json (17 directed
               sections), narration_selection.json (line-by-line take choice), subtitles_v2.srt
               (FINAL_SCRIPT.md, narration_blocks.json and subtitles_elevenlabs.srt are pass-2 / V1)
audio/         narration/v2 (takes, forced alignments, evaluation, assembled segments), sfx/v2 (prompts, raw takes,
               measured library, cue sheets, tracks), music/v2 (dynamic bed + stems), mix/v2 (first-pass mix + stems)
               (narration_v2.wav is the full V2 narration; audio/sfx/elevenlabs holds the reused pass-2 effects)
source/        Remotion 4 project: src/scenes (S1–S10), src/components (Character + cast, props, sets, evidence,
               text, v2/ kit), src/lib (motion, camera, timeline, measure, handoffs, sfx), src/data (timeline.json)
tools/         narration (v2_script, el_collect, el_align_collect, v2_takes, build_timeline), sound (collect_sfx.mjs,
               sfx_lib, make_sfx_v2, make_music_v2, mix_v2, audio_qc), QA (qa_dense, scene_clip.sh, sheet,
               dump_review), backup (backup_v2, backup_split); pass-2 tools kept alongside
qa/            v1_review/ (shot-by-shot analyst + critic review of V1, per scene)
backup/        v2_baseline/ (split-part media backup with checksums and restore scripts)
work/          (Git-ignored) isolated copies where scene rebuilds were in progress; snapshot in the backup
storyboard/ research/ package/ assets/ thumbnails/   carried over from pass 2 (describe the V1 film)
```

Media (`*.wav`, `*.mp3`, `*.mp4`, `*.flac`) is ignored by Git (Git LFS types whose host is not reachable from the
production environment). It is preserved as committed split parts under `backup/` instead.

## Rebuild

Requirements: Node 20+, Python 3.11+ (`numpy scipy soundfile pyloudnorm mido pillow`), ffmpeg, FluidSynth with the
MuseScore General SoundFont, Chromium (path in `source/remotion.config.ts`). Steps are in `V2_STATUS.md`.
Check frames without a full render: `cd source && SCALE=0.5 node stills.mjs <absolute out dir> "word:s03:None+4"`.

## Rules that every change must keep

- Nothing public identifies the channel's owner (see `../CHANNEL_BRIEF.md`). The description, credits, metadata and
  thumbnails were audited for this.
- Model labels and dates stay exact: GPT-4o, DeepSeek-R1, Llama-4-Scout, 9 May 2025, no web search; Kalai (2001).
- Illustrative numbers are labelled illustrative; the toy quiz is labelled example; "not necessarily more correct".
- No claims about intent ("lying"). See `research/sources.md` for the must-not list.
- Motion is driven by frame and word cues only; no wall-clock, no `Math.random()` without a seed.
