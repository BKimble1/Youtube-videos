# Future Got Weird: The Robot That Crawls Through Your Intestines (BIOSENTER)

## V1 (the current review cut)

**Deliverable:** `exports/FGW_BIOSENTER_GUT_ROBOT_V1_REVIEW_1080x1920.mp4`. It is not published.

- **Video:** 1080×1920, 30 fps, 789 frames (26.30 s), H.264 CRF 16.
- **Audio:** AAC 48 kHz, −14 LUFS, −1.6 dBTP.
- **Contents:** narration, burned-in captions, effects and an original music bed. It loops end to start.

**Where to look:**

| What | Where |
|---|---|
| Report (what was built, QA, limitations, render commands, V2 list) | `production/V1_REPORT.md` |
| Science notes and accuracy checklist | `production/SCIENCE_NOTES.md` |
| Transition list | `production/TRANSITIONS.md` |
| The direction, verbatim | `production/V1_DIRECTION.md` |
| Locked narration | `production/NARRATION_LOCKED.txt` |
| Narration provenance | `audio/narration/voice_provenance.json` |
| Narration master and word timings | `audio/narration/FGW_BIOSENTER_narration_V1.wav`, `audio/narration/word_timings.csv` |
| Captions (SRT) | `captions/FGW_BIOSENTER_Gut_Robot_V1.srt` |
| Mix, stems (voice, effects, ambience, music), event log | `audio/mix/`, `audio/sfx_log_mix_v1.json` |
| QA evidence | `qa/v1/` |

**Source:** `source/src/` (Remotion composition `BiosenterV1`).

| Module | What it does |
|---|---|
| `robot/state.ts` | The canonical body plan and the crawl schedule (world time). |
| `robot/geom.ts` | The robot in 3D, drawn as painter-sorted SVG: gradient-shaded bands, kirigami flaps, occlusion-tested ink, the tether. |
| `world/path.ts`, `world/gut.ts` | The gut's centreline, the half-pipe wall with folds, cut faces, villi, contact and neighbouring loops. |
| `scenes/tunnel.tsx` | S1 and S7 (one shot over world time: the loop). |
| `scenes/inside.tsx` | S2 macro and S3 cutaway. |
| `scenes/pig.tsx` | S4 zoom-out and pig diagram. |
| `scenes/tools.tsx` | S5 biopsy and fluid delivery. |
| `scenes/lab.tsx` | S6 lab bench. |
| `Captions.tsx` | Captions in screen space, with per-shot zones. |

**Rebuild:** see `production/V1_REPORT.md`, "Exact commands".
