# Earth Stops. You Don't. — E-A opening prototype (Future Got Weird Short)

**Status: opening prototype only (owner-approved scope: `handoff/OWNER_APPROVAL_PROTOTYPE.md`). Not a Short. Not uploaded, not scheduled, do not publish.** No script, narration, music or Runway work exists. Production is paused for the owner's review.

Native **1080 × 1920, 30 fps**, **75 frames = 2.50 s**. Branch `claude/fgw-earth-stops-short`, created from the Atlas tip `3634cc5` (`claude/pensive-mendel-3j0xsc`). Atlas and murder-tip work is untouched.

## What it is
A commuter (the channel's blue-jacket, high-bun cast member) is already mid-event at frame 0: the street has stopped, she has not. Her stopped feet skid and she pitches east about them; her coffee leaves the mug faster than her hand, as a jet, then falls and splats on the pavement; she is flung into a short hop, lands, and slides on. The street is the fixed reference: pixel-static until frame 6, then the camera accelerates to her speed so she stays legible while the street streams past. No cause is shown; the premise is the narration's job.

## Files
| Path | What |
|---|---|
| `FGW_EarthStops_EA_Opening_Silent_1080x1920.mp4` | **Silent preview** (H.264, no audio stream) |
| `FGW_EarthStops_EA_Opening_SFX_1080x1920.mp4` | Same picture (stream copied bit-for-bit) + procedural Foley, 48 kHz AAC |
| `exports/FGW_EarthStops_EA_Opening_Silent_NoMarker_1080x1920.mp4` | Silent, no WHAT IF tag (the staging-only test version) |
| `qa/keyframes/EA_f*.png` | Full-resolution key frames from the encoded silent preview |
| `qa/sheets/` | Contact sheet, **360×640 phone-size** 8-frame sheet, first-second sheet |
| `qa/lab/PoseLab_0000.png` | Off-balance pose test of the cast rig |
| `PROTOTYPE_QA_REPORT.md` | Honest QA: what was measured, what was only read by AI viewers, what was not done |
| `PRODUCTION_STATE.md` | State, open items, recommended next step |
| `audio/` | `cues.json` (event table from the choreography), `sfx/*.wav` one-shots, `stems/*.wav`, `OPENING_SFX_LOG.csv` |
| `source/` | Editable Remotion project (pinned deps, lockfile) · `tools/` probe, cue, audio and QA scripts |
| `qa/read_test/`, `qa/dir_test/`, `qa/bike/` | Evidence for the reviewer rounds, the direction A/B tests and the rejected bicycle variant |
| `credits.md`, `handoff/` | Provenance; the owner's approval record |

## Rebuild
```bash
cd source && npm ci                      # Remotion 4.0.533 / React 19.1.0 / TS 5.8.3 (+ fontsource 5.3.0)
npx tsc --noEmit
node ../tools/probe_choreo.mjs ../qa/choreo_probe.json    # per-frame positions, extents (no render)
node ../tools/build_cues_opening.mjs                      # audio/cues.json from the same choreography
python3 ../tools/build_audio_opening.py                   # procedural Foley + stems (numpy only)
HS=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell   # headless *shell* is required
F="--crf=16 --x264-preset=slow --color-space=bt709 --browser-executable=$HS --concurrency=4"
npx remotion render src/index.ts OpeningEA ../FGW_EarthStops_EA_Opening_Silent_1080x1920.mp4 $F
npx remotion render src/index.ts OpeningEA-NoMarker ../exports/FGW_EarthStops_EA_Opening_Silent_NoMarker_1080x1920.mp4 $F
ffmpeg -y -i ../FGW_EarthStops_EA_Opening_Silent_1080x1920.mp4 -i ../audio/stems/effects_opening.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart ../FGW_EarthStops_EA_Opening_SFX_1080x1920.mp4
python3 ../tools/qa_opening.py ../FGW_EarthStops_EA_Opening_Silent_1080x1920.mp4    # measured QA + key frames + sheets
node scripts/frames.mjs <outDir> OpeningEA 0,12,31 1                                  # individual frames
```
Compositions: `OpeningEA` (default), `OpeningEA-NoMarker`, `OpeningEA-Bike` (rejected variant), `DirTest-*` (direction A/B variants), `PoseLab` (still). Composition ids cannot contain underscores.

## How it is built
- `src/opening/events.json` is the single timed-event table (stop, cup tick, launch f9, land f31 …), read by the picture **and** the Foley builder.
- `src/opening/choreo.ts`: every position is a pure function of the frame (hips, lean, legs, arms, mug, coffee particles, camera), so the render, `tools/probe_choreo.mjs` and the audio cues cannot disagree.
- `src/opening/rig.ts`: exact foot-planting maths for the extended cast rig (the lowest shoe is always the planted one).
- `Street.tsx`, `Hero.tsx`, `Fx.tsx`, `Opening.tsx`: world, character + mug, world-fixed effects (dust, skid marks, splats), composition. Pan-blur on the street grows with camera speed; nothing blurs while the camera is still.
- `src/components/Character.tsx` is the Atlas rig **plus** optional `legL`/`legR`/`footFlat` (defaults identical to the original). Atlas's own copy is unchanged.
- Fonts: Barlow Condensed (tag). The Atlas caption system (Montserrat lane, measured wrapping, audit script) is carried by `src/fonts4.ts` and the Atlas tip; it is not used until there is narration to caption.

## Claims
The prototype states no numbers and no scientific claims on screen. The only implicit claim is the premise (an impossible instant stop of the solid Earth; loose objects keep their motion), stipulated as hypothetical by the in-scene WHAT IF tag. A claim ledger belongs to the script stage.
