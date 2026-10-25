# Future Got Weird: Scientists Made Spider-Man's Wall-Climbing Real (Glass Climbing) — V1

**Status (25 Oct 2026):** V1 review (1080×1920) rendered from source and checked from the file; native 2160×3840
master rendered at 2× (see `production/QA_REPORT.md` for what was checked and what remains). **Not published.**
Nobody has watched it in real time with sound. **The narration is a stand-in voice** (the channel's ElevenLabs
voice could not be generated: the workspace was out of credits); see `audio/narration/voice_provenance.json`.

| Deliverable | File |
|---|---|
| Review: 1080×1920, 30 fps, 1171 frames, 39.03 s, captions burned in | `exports/FGW_Glass_Climbing_V1_REVIEW_1080x1920.mp4` |
| Master: 2160×3840 native (rendered at 2×) | `exports/FGW_Glass_Climbing_V1_MASTER_2160x3840.mp4` |
| Cover frame | frame **700** (**23.33 s**): `cover/FGW_Glass_Climbing_V1_cover_f700_23.33s_1080x1920.png` |
| Exact script (approved narration, verbatim) | `production/NARRATION_APPROVED.txt` |
| Voice: final narration (48 kHz/24-bit, **39.033 s measured**) | `audio/narration/FGW_Glass_Climbing_narration_final.wav` |
| Voice: takes, word timings, provenance | `audio/narration/takes/`, `audio/narration/words_final.json`, `audio/narration/voice_provenance.json` |
| Caption timings | `source/src/data/timeline.json` (`captions`: text, emphasis, word start/end, show/hide) |
| SRT | `captions/FGW_Glass_Climbing_V1.srt` |
| Mix (voice + synthesized bed and effects, -14.6 LUFS) | `audio/mix/FGW_Glass_Climbing_V1_mix.wav`, `audio/mix/mix_measure.json`, `audio/sfx_cues.json` |
| Shots and transitions | `production/SHOTS_AND_TRANSITIONS.md` |
| Sources, simplifications, cast/asset paths | `production/SOURCE_NOTES.md` |
| QA report and evidence | `production/QA_REPORT.md`, `qa/` |
| Upload description draft | `production/UPLOAD_DESCRIPTION_DRAFT.md` |
| Editable source | `source/` (Remotion 4.0.533, React 19, TypeScript) |

## Cast

The Weird Crew's existing protagonist (the striped-tee "guesser") on his existing rig: `source/src/dc/Man.tsx`,
`Head.tsx`, `Hand.tsx` and the ink/shading primitives in `source/src/dc/`, carried over from Real Web Fluid
(`../moth-silk-web-shooter/source/src/`), which took them from Death Clock V4. No new characters. Lineage and the
small additions (draw-order hooks, a hands-only pass) are listed in `production/SOURCE_NOTES.md`.

## Source layout

| Path | What |
|---|---|
| `source/src/Root.tsx` | compositions: `GlassClimbing` (the film), stills `FilmStill`, `Sheet` (contact sheet, 12 frames) and working stills |
| `source/src/shots.tsx` | the 20 shots (`SHOTS`) and their cameras |
| `source/src/world/climb.ts` | the climb as a pure function of the frame: event table `C`, pad tracks, stance, stirrups, carried pads |
| `source/src/world/bench.ts` | the bench events `BK` (tile turn, glass/brick test) |
| `source/src/world/geo.ts`, `rig.ts`, `pose.ts` | the oblique pad projection, hand/foot placement on the rig, poses |
| `source/src/art/` | pad, tile face, test bay |
| `source/src/scenes/` | bay, through-the-glass, bench, micro section, springs cutaway |
| `source/src/captions.ts`, `Captions.tsx` | caption placement per caption, and the channel caption style |
| `tools/` | narration (`make_narration.py`, `align.py`), cues (`export_cues.ts`), mix (`make_audio.py`), rig probe (`probe.sh`), QA (`qa.py`, `asr_sherpa.py`, `motion_scan.py`, `strips.py`) |

## Rebuild

```sh
cd source && npm ci                        # Remotion 4.0.533; remotion.config.ts points at the preinstalled Chromium
# narration (only if the take or caption chunks change): take -> trimmed final wav, word timings, timeline.json, SRT
cd ../tools && python3 make_narration.py
# cues from the picture's event frames, then the mix (also writes source/public/audio/mix.wav)
cd .. && source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec.cjs && node /tmp/ec.cjs audio/cues.json
cd tools && python3 make_audio.py && cd ../source
# review and master
npx remotion render src/index.ts GlassClimbing ../exports/FGW_Glass_Climbing_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4
npx remotion render src/index.ts GlassClimbing ../exports/FGW_Glass_Climbing_V1_MASTER_2160x3840.mp4 --scale=2 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4
# a clean (no captions) version: --props='{"audio":"mix","captions":false}'
```

Working tools: contact sheet `cd source && ./sheet.sh out.png "f1,f2,..." [true]`; rig probe
`./tools/probe.sh [from] [to] [step]` (hand-to-bar error, leg reach, strap stretch, near hand vs face);
QA `python3 tools/qa.py <mp4> <vosk-model-small-en-us-0.15 dir> qa/<prefix>`.

Media files are stored as plain git blobs (the episode `.gitattributes` turns LFS off, as in the other FGW episodes);
`source/public/audio/*.wav` and `audio/mix/stems/` are regenerated by `make_audio.py` and not committed.
