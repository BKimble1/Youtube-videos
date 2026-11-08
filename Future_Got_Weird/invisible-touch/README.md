# Future Got Weird: Invisible Touch (ultrasonic mid-air haptics)

This is a vertical Short: 1080×1920 at 30 fps, **31.133 s** (934 frames). V1 is a review render and is **not
published**.

## Where to look

| What | Where |
|---|---|
| Deliverable | `exports/FGW_Invisible_Touch_V1_REVIEW_1080x1920.mp4` |
| Report (gates, measurements, remaining problems) | `production/V1_REPORT.md` |
| Shots, timing, transitions | `production/SHOTS_AND_TRANSITIONS.md` |
| Science and accuracy checklist | `production/SCIENCE_NOTES.md` |
| Narration (locked) | `production/NARRATION_LOCKED.txt` |
| Word timings | `production/WORD_TIMINGS.md` |
| Voice provenance | `audio/narration/voice_provenance.json` |
| Captions | `captions/FGW_Invisible_Touch_V1.srt` |
| QA evidence | `qa/v1/` |

## Cast and style

The lead is the Weird Crew's **guesser** (red spiky hair, white tee with saffron stripes) on the channel's `dc` rig.
It is copied unchanged from Eel Escape, with one draw hook added: `farArm`.

His reaching right hand is a new **profile hand** (`source/src/it/hand.tsx`):

- It is drawn with the rig's own Capsule, Blob and Limb primitives and Inked contours, so it matches the rig's line
  and shading.
- It is an anatomical chain: forearm → wrist → metacarpals → MCP → PIP → DIP, with nails, palmar creases and the
  thenar.

The visual finish is the channel's Weird Crew vector style.

## Source

The Remotion project is in `source/`. The composition is `InvisibleTouch`; the working stills are `Sheet`, `HandTest`
and `LabTest`.

| File | What it does |
|---|---|
| `it/cam3.ts` | A small perspective camera with near-plane clipping. |
| `it/device.tsx` | The 16 × 16 (256) transducer array in true perspective. |
| `it/lab.tsx`, `it/labShots.ts`, `it/LabView.tsx` | The lab world, its shots keyed to the words, and the overlays. |
| `it/fx.tsx` | The phased-array model: per-emitter delays, converging crests, focus, pulses. |
| `it/skin.tsx` | The fingertip receptor cutaway. |
| `it/car.tsx`, `it/kiosk.tsx` | The two concept applications. |

## Rebuild

See the end of `production/V1_REPORT.md`.
