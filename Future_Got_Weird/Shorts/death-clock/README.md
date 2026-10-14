# Future Got Weird Short: The Death Clock

A 45.77 s vertical Short (1080×1920, 30 fps, 1373 frames) about a **fictional** future wristband that counts down to the wearer's death and calls for help. The "FUTURE CONCEPT" label is on screen from the first frame to the last, in both the captioned and clean versions.

Not uploaded, scheduled or published. The packaging text is in `upload/PACKAGING.md`.

## Deliverables (`exports/v1/`)

| File | What it is |
|---|---|
| `FGW_DeathClock_v1_Master_Captioned_1080x1920.mp4` | Upload master: burned-in captions, H.264 CRF 16, AAC 320k 48 kHz |
| `FGW_DeathClock_v1_Clean_NoCaptions_1080x1920.mp4` | Same picture and mix with no narration captions. The label, TIME COMPRESSED tag and device UI stay. |
| `FGW_DeathClock_v1_Review_540x960.mp4` | Smaller review copy with the same timing (not for upload) |
| `FGW_DeathClock_v1_Cover_1080x1920.png` | Cover: frame 596 of the clean render |
| `FGW_DeathClock_v1_Captions.srt` | Aligned subtitles (31 cues, same chunks as the burn-in) |
| `FGW_DeathClock_v1_Narration_Locked.txt` | The five locked narration blocks, verbatim |
| `audio/FGW_DeathClock_v1_Narration_Selected_48k.wav` | The selected narration take after the pause-only edit (mono, 24-bit) |
| `audio/FGW_DeathClock_v1_Stem_{narration,music,effects}_48k.wav` | Stems after ducking and the shared limiter. They sum to the mix. |
| `audio/FGW_DeathClock_v1_Mix_48k.wav` | Final mix |
| `EXPORT_METADATA.json` | ffprobe data and SHA-256 for every file above |

Supporting documents:
- `qa/QA_NOTES.md`: timecoded QA notes. They say what was actually inspected and what was not.
- `PROVENANCE.md`: asset and provenance manifest
- `script/CUE_SHEET.md`: final cue sheet, generated from the same modules the picture renders from
- `audio/narration/NARRATION_PROVENANCE.md`: voice, audition, take selection and edit
- `qa/AUDIO_QA.json`, `audio/MIX_LOG.json`: loudness, true peak, voice-to-bed margins and mix settings

## Layout

```
script/      narration_locked.json (source of truth), CUE_SHEET.md
source/      Remotion project (React/TypeScript), package-lock.json
  src/lib/       timeline (word times -> shots), device states, captions, sound cues, math, colour, camera
  src/art/       lineless gradient-shaded characters, props and environments (SVG)
  src/shots/     the 16 shots, captions and the label overlay
  scripts/       export_cues.ts (writes audio/cues.json), frames.mjs (still renderer for QA)
audio/       narration (takes, edit, alignment), sfx/gen (generated effects), stems, mix, cues.json
tools/       Python: voice edit, audio build/QA, SRT, cue sheet, export, QA sheets, motion scan
captions/    FGW_DeathClock.srt
exports/v1/  deliverables
qa/          QA notes, audio QA, contact sheets from the decoded master
upload/      PACKAGING.md (titles, description, fiction ledger, cover)
```

## One cue system

`audio/narration/narration_words_final.json` holds the word times measured from the narration audio. `source/src/lib/timeline.ts` reads it, and every shot boundary, device state, caption window and sound cue is set relative to those words. `source/scripts/export_cues.ts` writes them to `audio/cues.json`. The mix, the SRT and the cue sheet are then built from that file. If the narration changes, rebuild from step 3 below and everything follows.

## Rebuild

Requirements: Node 20+, Python 3.11+ with numpy, ffmpeg/ffprobe, and Chromium (in this environment, `/opt/pw-browsers/...`; the path is set in `source/remotion.config.ts`).

```bash
cd source
npm ci                                   # exact versions from package-lock.json
npx tsc --noEmit                         # typecheck
npx tsx scripts/export_cues.ts           # -> ../audio/cues.json
cd ..
python3 tools/build_voice.py             # T2 take -> narration_final_48k.wav (pause-only edit; already committed)
python3 tools/build_audio.py             # cues.json + narration + SFX -> stems + mix (+ MIX_LOG.json)
python3 tools/qa_audio.py                # -> qa/AUDIO_QA.json
python3 tools/make_srt.py captions/FGW_DeathClock.srt
python3 tools/make_cue_sheet.py          # -> script/CUE_SHEET.md
cd source
F="--crf=16 --x264-preset=slow --color-space=bt709 --muted --concurrency=4"
npx remotion render src/index.ts DeathClock      ../exports/_wip/captioned_silent.mp4 $F
npx remotion render src/index.ts DeathClockClean ../exports/_wip/clean_silent.mp4     $F
cd ..
python3 tools/export.py v1 596           # mux, review copy, cover, audio/text deliverables, metadata
# QA on the encoded files
python3 tools/qa_sheets.py exports/v1/FGW_DeathClock_v1_Master_Captioned_1080x1920.mp4 qa/v1 6 0,20,66,170,300,380,470,600,660,830,900,960,1040,1180,1262,1295
python3 tools/motion_scan.py exports/v1/FGW_DeathClock_v1_Master_Captioned_1080x1920.mp4
python3 tools/check_label.py exports/v1/FGW_DeathClock_v1_Clean_NoCaptions_1080x1920.mp4
(cd source && npx tsx scripts/check_device.ts)   # countdown logic, every frame -> qa/DEVICE_CHECK.json
```

`npx remotion studio src/index.ts` (from `source/`) opens the compositions for scrubbing. `DeathClock` and `DeathClockClean` are the deliverables. The other compositions are development test rigs.

Both renders take about 4 minutes each on this container with `--concurrency=4`. The renders are deterministic: no random calls at render time and no network fetches (fonts are bundled from @fontsource).
