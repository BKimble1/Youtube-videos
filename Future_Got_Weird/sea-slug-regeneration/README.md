# Future Got Weird: Sea Slug Regeneration

## V1 (29 Oct 2026): first complete cut

**Status:** V1 review rendered natively at 1080×1920, 30 fps, from the vector source, and checked from the file
(`production/V1_REPORT.md`). **Not published.** Nobody has watched it in real time with sound; this environment
has no audio or video output, so sync and levels were checked by measurement and frame inspection.

| Deliverable | File |
| --- | --- |
| Opening proof of concept (first 5 s) | `exports/FGW_SeaSlug_Regeneration_V1_HOOK_REVIEW_1080x1920.mp4` |
| Full V1 review (28.667 s, 860 frames, captions burned in, loops) | `exports/FGW_SeaSlug_Regeneration_V1_REVIEW_1080x1920.mp4` |
| Report (QA, imperfections, benchmark verdict) | `production/V1_REPORT.md` |
| Shots and transitions | `production/SHOTS_AND_TRANSITIONS.md` |
| Science notes | `production/SCIENCE_NOTES.md` |
| Locked narration (verbatim) | `production/NARRATION_LOCKED.txt` |
| Narration: takes, Scribe word timings, provenance | `audio/narration/takes/`, `audio/narration/voice_provenance.json` |
| Final narration (48 kHz/24-bit) | `audio/narration/FGW_SeaSlug_narration_V1.wav` |
| Caption timing | `source/src/data/timeline.json`; SRT `captions/FGW_SeaSlug_Regeneration_V1.srt` |
| Mix, stems, measurements, cue list | `audio/mix/FGW_SeaSlug_V1_mix.wav`, `audio/mix/stems/`, `audio/mix/mix_measure.json`, `audio/sfx_cues.json`, `audio/cues.json` |
| QA evidence | `qa/` |
| Editable source | `source/` (Remotion 4.0.533, React 19, TypeScript): composition `SeaSlugV1`; stills `Frame`, `Sheet`, `ModelSheet`, `ModelBig` |

## Source layout

| Path | What |
| --- | --- |
| `source/src/slug/anatomy.ts` | The master *Elysia cf. marginata* design in body coordinates: profiles, parapodia, the neck and autotomy plane, the heart, fixed markings (spots, specks, tubules, mottling), palette |
| `source/src/slug/Slug.tsx` | The rig renderer: a piece (whole, head, body, or a head regrowing a body) on a path, with stretch/pinch/seal, flinch, x-ray, heart, regrowth |
| `source/src/geo.ts` | Paths on the substrate and the 2.5D camera (tilt, yaw, zoom, perspective) |
| `source/src/shots.ts` | The film as a pure function of the frame, timed from the narration words; `CUES()` for the mix |
| `source/src/sets/Envs.tsx` | Lab dish, dark-teal anatomy space, algae seabed, tissue micro layer, brush, labels |
| `source/src/Film.tsx`, `captions.ts` | Compositor, captions (channel style) and placement, contact sheet |
| `tools/` | `make_narration.py`, `export_cues.ts`, `make_audio.py`, `qa.py`, `rep.py` (asserting text replace) |

## Rebuild

```sh
cd source && npm ci
cd .. && python3 tools/make_narration.py            # only if the take changes
source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec.cjs && node /tmp/ec.cjs audio/cues.json
python3 tools/make_audio.py                          # writes source/public/audio/mix.wav
cd source
npx remotion render src/index.ts SeaSlugV1 ../exports/FGW_SeaSlug_Regeneration_V1_REVIEW_1080x1920.mp4 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4
npx remotion render src/index.ts SeaSlugV1 ../exports/FGW_SeaSlug_Regeneration_V1_HOOK_REVIEW_1080x1920.mp4 --frames=0-149 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4
cd .. && python3 tools/qa.py exports/FGW_SeaSlug_Regeneration_V1_REVIEW_1080x1920.mp4 qa/v1 218,490,751
```

Contact sheets: `cd source && ./sheet.sh out.png "f1,f2,..." [true|false]`.

Python needs numpy, scipy, soundfile, pyloudnorm and Pillow. Media files are stored as plain git blobs (the episode
`.gitattributes` turns LFS off, as in the other FGW episodes).
