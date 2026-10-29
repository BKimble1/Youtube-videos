# Future Got Weird: Sea Slug Regeneration

## V2 (29 Oct 2026): major visual rebuild, review cut

**Status:** **This is a review cut, not final, and it has not been published.** The full report is in
`production/V2_REPORT.md`. The narration is the same V1 take, unchanged. The picture is rebuilt: a new shaded 3D
slug rig, new lab and seabed sets, and new shots for all eight scenes. The sound is retimed to the new picture.

| Deliverable | File |
| --- | --- |
| Opening gate render (first 5 s) | `exports/FGW_SeaSlug_Regeneration_V2_HOOK_REVIEW_1080x1920.mp4` |
| Full V2 review (28.667 s, 860 frames, captions burned in, loops) | `exports/FGW_SeaSlug_Regeneration_V2_REVIEW_1080x1920.mp4` |
| Report (changes, per-scene tools, gate, QA, unresolved) | `production/V2_REPORT.md` |
| Mix, stems, measurements, cues | `audio/mix_v2/`, `audio/cues_v2.json`, `audio/sfx_cues_v2.json`; `source/public/audio/mix_v2.wav` |
| Captions | `captions/FGW_SeaSlug_Regeneration_V2.srt` |
| QA evidence | `qa/v2/` |

V2 source (Remotion composition `SeaSlugV2`; stills `Frame2`, `Sheet2`, `Model2`, `Model2Sheet`):

| Path | What |
| --- | --- |
| `source/src/kit/` | FGW house 3D kit (orbit camera, projection, shaded primitives, ink, gloved hand), copied from Dead Spider V6 |
| `source/src/v2/slug/body.ts`, `Mesh.tsx` | The *Elysia cf. marginata* surface rig (tube, two-sided parapodia, rhinophores, markings, separation, cutaway, heart, regrowth) and its depth-sorted, smooth-shaded renderer |
| `source/src/v2/sets/` | `Lab2` (dish, sand, fragments, lens grit), `Sea2` (water, rock floor, *Bryopsis* tuft, feeding frond), `Micro2` (tissue and ghosted parasites) |
| `source/src/v2/shots2.ts` | The film as a pure function of the frame, timed from the narration words; `CUES2()` for the mix |
| `source/src/v2/Film2.tsx` | Compositor, captions, contact sheets |
| `tools/render_v2.tsx` | Frame renderer used for the V2 deliverables (React static markup rasterised by Playwright) |

Rebuild V2 (from this folder; the sound first, then the frames, then the encode):

```sh
source/node_modules/.bin/esbuild tools/export_cues_v2.ts --bundle --platform=node --outfile=/tmp/ec2.cjs && node /tmp/ec2.cjs audio/cues_v2.json
python3 tools/make_audio.py V2
NODE_PATH=$PWD/source/node_modules source/node_modules/.bin/esbuild tools/render_v2.tsx --bundle --platform=node --jsx=automatic --external:playwright --outfile=/tmp/render_v2.cjs
for w in 0 1 2 3; do node /tmp/render_v2.cjs /tmp/frames 0 859 $w 4 & done; wait   # needs Playwright on NODE_PATH
ENC="-c:v libx264 -preset slow -crf 16 -g 15 -pix_fmt yuv420p -vf scale=out_color_matrix=bt709:out_range=tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -af pan=stereo|c0=0.7071*c0|c1=0.7071*c0 -c:a aac -b:a 320k -ar 48000 -movflags +faststart"
ffmpeg -framerate 30 -i /tmp/frames/%04d.png -i source/public/audio/mix_v2.wav $ENC -frames:v 860 -t 28.6667 exports/FGW_SeaSlug_Regeneration_V2_REVIEW_1080x1920.mp4
ffmpeg -framerate 30 -i /tmp/frames/%04d.png -i source/public/audio/mix_v2.wav $ENC -frames:v 150 -t 5 exports/FGW_SeaSlug_Regeneration_V2_HOOK_REVIEW_1080x1920.mp4
python3 tools/qa.py exports/FGW_SeaSlug_Regeneration_V2_REVIEW_1080x1920.mp4 qa/v2/review 490,751
```

`remotion render` of `SeaSlugV2` stalled in its screenshot step in this environment, which is why the V2 files come
from `render_v2.tsx`. The picture is the same React component either way. V2 contact sheets:
`cd source && ./sheet2.sh out.png "f1,f2,..."`.

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
