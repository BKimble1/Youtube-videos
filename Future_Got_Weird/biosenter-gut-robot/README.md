# Future Got Weird: The Robot That Crawls Through Your Intestines (BIOSENTER)

## V3 (the final cut)

**Deliverable:** `exports/FGW_BIOSENTER_GUT_ROBOT_V3_FINAL_1080x1920.mp4`.

- **Video:** verified 1080×1920, H.264 High, 30 fps, 789 frames (26.30 s). No borders.
- **Audio:** AAC-LC, 48 kHz.
- **Narration:** the same recording as V1 and V2.

**Report:** `production/V3_REPORT.md` has the changelog, the output verification, the science notes and the
unresolved items. The evidence is in `qa/v3/`.

**Rebuild V3:**

    python3 tools/make_audio.py mix_v3
    tools/render_resilient.sh mix_v3 exports/FGW_BIOSENTER_GUT_ROBOT_V3_FINAL_1080x1920.mp4
    python3 tools/qa_render.py exports/FGW_BIOSENTER_GUT_ROBOT_V3_FINAL_1080x1920.mp4 qa/v3

**Checks:** `tools/keepout.ts` (captions) and `tools/verify_kinematics.ts` (crawl mechanics and wall clearance). Run
each with esbuild and node, as in the V1 report.

## V2 (review cut, superseded)

**Deliverable:** `exports/FGW_BIOSENTER_GUT_ROBOT_V2_REVIEW_1080x1920.mp4`. It is not published.

- **Video:** true 1080×1920, 30 fps, 789 frames (26.30 s), H.264.
- **Audio:** AAC 48 kHz, −14 LUFS.
- **Narration:** the same recording as V1, byte-identical.

**What changed:**

- Physically consistent locomotion at the real proportions, with the head and tail as the kirigami anchors.
- A chamber cutaway, a new hook and a new ending.
- An animated pig route.
- A biopsy clip and a fluid sprayer (per the sources).
- A dark lab test bench.
- Calmer captions.

**Where to look:**

| What | Where |
|---|---|
| Change log | `production/V2_CHANGELOG.md` |
| Science verification | `production/V2_SCIENCE_VERIFICATION.md` |
| QC report and remaining issues | `production/V2_QC_REPORT.md` |
| QC evidence | `qa/v2/` |

**Rebuild V2:** the same commands as V1 (`production/V1_REPORT.md`, "Exact commands"), with these differences:

- the mix is `mix_v2`;
- the composition is `BiosenterV2`;
- the output is `..._V2_REVIEW_1080x1920.mp4`.

    python3 tools/make_audio.py mix_v2
    tools/render_resilient.sh mix_v2 exports/FGW_BIOSENTER_GUT_ROBOT_V2_REVIEW_1080x1920.mp4
    python3 tools/qa_render.py exports/FGW_BIOSENTER_GUT_ROBOT_V2_REVIEW_1080x1920.mp4 qa/v2

V1's source is at commit `8149cb7`.

## V1 (the earlier review cut)

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
