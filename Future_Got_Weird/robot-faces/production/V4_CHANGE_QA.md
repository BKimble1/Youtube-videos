# V4 change and QA report: Robots Are Learning to Copy Our Faces

27 Oct 2026. Not published.

V4 is built on the V3 source in place: composition `RobotFacesV4`, shot table `source/src/v2/Film2.tsx` (95 shots).
New V4 shots are in `source/src/v2/shotsF.tsx`; the lobby and studio settings are in `source/src/v2/new.tsx`. V3 as
delivered can be rebuilt from commit `f03600d`.

## Deliverables

| | File |
|---|---|
| Review, 1920×1080, 30 fps | `exports/FGW_Robot_Faces_V4_REVIEW_1920x1080.mp4` |
| Master, 3840×2160 (rendered at 2× from the vectors) | `exports/FGW_Robot_Faces_V4_MASTER_3840x2160.mp4` |
| Subtitles | `captions/FGW_Robot_Faces_V2.srt`: unchanged, because the narration and its timing are unchanged |
| Narration / mix | narration unchanged; `audio/mix/FGW_Robot_Faces_V2_mix.wav` rebuilt with the V4 action cues |
| Shot / transition map | `production/V2_TRANSITIONS.md`, regenerated from the V4 table |

Runtime: **3:33.333** (6,400 frames). The ElevenLabs narration is the same file, untouched: no new voice, no change of
rate or pitch, and no added pauses.

## What changed

<!-- filled in below -->
