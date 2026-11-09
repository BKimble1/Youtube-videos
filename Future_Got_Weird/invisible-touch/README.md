# Future Got Weird: Invisible Touch (ultrasonic mid-air haptics)

This is a vertical Short: 1080×1920 at 30 fps, **31.133 s** (934 frames).

## V4: final retention, motion and loop polish (current)

V4 is a review render and is **not published**.

| What | Where |
|---|---|
| Deliverable | `exports/FGW_Invisible_Touch_V4_REVIEW_1080x1920.mp4` (31.133 s, 934 frames) |
| Report (changes from V3 with timestamps, validation, pass/fail, remaining flaws) | `production/V4_REPORT.md` |
| V3 audit and the five fixes, written first | `production/V4_AUDIT.md` |
| Source | `source/src/v4/` (composition `InvisibleTouchV4`) |
| Cues and mix | `tools/v4/` |
| QA (including the seam sheets and a three-loop file) | `qa/v4/` |

## V3: targeted final polish

V3 is a review render and is **not published**.

| What | Where |
|---|---|
| Deliverable | `exports/FGW_Invisible_Touch_V3_REVIEW_1080x1920.mp4` (31.133 s, 934 frames) |
| Report (changelog from V2, technical check, pass/fail, outstanding flaws) | `production/V3_REPORT.md` |
| Source | `source/src/v3/` (composition `InvisibleTouchV3`) |
| Cues and mix | `tools/v3/` |
| QA (including a three-loop file) | `qa/v3/` |

**Changes from V2:**
- a new opening, with a flinch at the pulse and the gap revealed by 1 s;
- a worm's-eye macro at 3–7 s;
- a skin-slab graphic match;
- the car as the climax, with the lobby removed;
- a pass-through ring in the grab;
- a rebuilt loop with the caption clearing before the seam.

## V2: major animation overhaul

V2 is a review render and is **not published**.

| What | Where |
|---|---|
| Deliverable | `exports/FGW_Invisible_Touch_V2_REVIEW_1080x1920.mp4` |
| Report (scene timing, V1 → V2 improvements, science, QA, remaining issues) | `production/V2_REPORT.md` |
| V1 audit and the V2 shot plan (written first) | `production/V2_AUDIT_AND_PLAN.md` |
| Source | `source/src/v2/` (composition `InvisibleTouchV2`) |
| Cues and mix | `tools/v2/` |
| QA | `qa/v2/` |

The narration is unchanged: the same master and the same word timings as V1.

## V1

V1 is a review render and is **not published**.

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
