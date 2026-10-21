# Hidden Trigger V4: final visual pass — change and QA note

Delivered: `exports/FGW_Hidden_Trigger_V4_Final_1080x1920.mp4` (SHA-256 `ca3f319b…4980`). It is rendered from source as composition
`HiddenTriggerV4` (`source/src/v4/`). V1, V2 and V3 are untouched and still render.

## Locked and verified unchanged

- **Narration.** Same file as V3: `audio/narration/narration_v3_testvoice.wav`, SHA-256 `ae76438d…4a7b`, the approved
  Test Voice take.
  - No new generation, no credits spent, no time stretch.
  - In the V4 MP4 the voice sits at a 0.000 s offset and correlates 0.984 with that file (0.000 with the old
    temporary voice).
  - Its level in the mix differs from V3 by 0.01 dB (shared loudness normalisation): `qa/voice_check_v4.json`.
- **Words and captions.** Unchanged: the V4 cut uses the same caption component and timings as V3, so
  `captions/FGW_Hidden_Trigger_V3.srt` remains the subtitle file.
- **Runtime and format.** 25.600 s, 768 frames, 30 fps, 1080×1920.
- **Art.** Same test-bay model, robot, purple-handled toy knife, apple, model hand and monitor graphic style
  (`v3/World3.tsx` and `v3/rig3.ts`, reused unmodified).

## Changes (timestamps match the narration)

| Time (s) | Change |
|---|---|
| 0.00–0.85 | Starts mid-descent in a tighter, low blade-level view. The blade comes down over the molded fingers, its shadow tightens on them, and it **stops** at 0.85 s, about 9 px above the palm (a held, controlled stop, 0.3 s). Part of the apple stays at frame left. The camera now moves with the action instead of against it. |
| 1.42–3.45 | One brisk lateral reveal (7 frames) to the apple, board and blade together. The arm lifts off the hand and lines up over the apple (the task), in the same frame. |
| 3.45–5.25 | Redirection is a visible action: the gripper leaves the apple, the camera tracks it, and it lands low and tight as the blade drops close above the hand. |
| 5.25–6.47 | The same gripper motion slides along the hand and carries the camera onto the molded cuff and mount. |
| 6.47–7.93 | Blade-level macro as the wrist tilts the rounded toy blade into the light (glint, grip sound). |
| 7.93–9.80 | Pull out along the arm (knife → elbow → whole robot) as the arm draws up. The final framing is centred and the base is in frame. |
| 9.80–10.37 | Elbow cap close → shape match into the software start node (kept). |
| 10.37–12.35 | The graphic has a destination from its first frame: the apple sits in the target ring. One teal pulse reveals the path, the amber branch is planted on "planted", then it lies dormant. No breathing glows, no empty ring. |
| 12.35–13.60 | Quick (8-frame) zoom out to the workstation as a brief spatial bridge, then a straight cut. |
| 13.60–14.53 | Bench, both targets: the arm arrives and lines up over the apple (eased to 0.7 s). |
| 14.53–16.30 | Static tight view: one stroke (lift 14.95, low 15.12, short draw, recovery 15.62) 14 px above the stem. |
| 16.30–19.80 | "Cut the apple" request; the marker slides into the request on "trigger"; **one** pulse travels marker → start → fork → amber branch → ring. On "switched" the apple shrinks out as the hand icon lands with a short overshoot. Push into the icon. |
| 19.80–20.20 | Cut on the icon's contour to the physical hand at the same place and size; the arm starts immediately. |
| 20.20–20.63 | Wrist detail, moving. |
| 20.63–21.70 | The same tight view and stroke grammar as the apple: approach, settle, one stroke 8 px above the palm, recovery. |
| 21.70–23.00 | The same diagram in its familiar context (apple target, dormant amber branch), not a crop of rings. |
| 23.00–25.60 | Tightening blade-level framing; the blade creeps, gives a short anticipatory lift, then starts the descent that crosses the loop into frame 0 (same camera function, pose function and lighting). No hover ending. |

**Sound.** The voice is unchanged. Effects are re-cued to the V4 actions (`tools/make_audio_v4.py`):
- the speed-driven servo;
- mechanical stops at 0.85 s (opening stop), 4.75 s (hand landing), 14.3 s (aligned over the apple) and 21.0 s
  (settles over the hand);
- the grip at 7.12 s;
- the single target-switch accent at 18.84 s.

## QA performed on the final MP4

Measured:
- **Format.** 1080×1920 rendered natively, 30/1 fps, 768 frames, 25.600 s, H.264 High, BT.709.
- **Loudness.** −15.0 LUFS integrated, −1.5 dBTP, LRA 4.6 LU. No clipped samples and no silent 100 ms window.
- **Picture.** No black segments, and no frozen segment of 1.5 s or longer.
- **Captions vs. audio.** Whisper transcribes 15/16 caption windows to their text. The miss is the same window-edge
  case as in V3 ("in the software…" heard as "Open the software…" because the window starts inside "trap in"); the
  full sentence transcribes exactly.
- **Rig, every frame** (`qa/motion_summary_v4.json`):
  - link-length error 0; elbow always above the shoulder;
  - blade clearance at least 14 px over the apple stem and 8 px over the palm (no contact);
  - three intentional pose resets, all hidden by cuts;
  - max joint step 7.7°/frame; peak gripper speed 1440 px/s;
  - loop wrap: 177 → 178 → 177 px/s.

Viewed (frames from the rendered MP4):
- the opening 1.5 s frame by frame;
- ±4-frame strips at every shot boundary;
- 9-frame bursts through the redirect, cuff carry, robot pull-out, both mimed strokes, the target swap, "the arm
  followed", the end approach and the loop seam;
- a contact sheet every 10 frames;
- 24 frames at phone size under a Shorts UI mask (`qa/v4/phone_ui_sheet.png`).

Defects found and fixed before the final render:
- The opening camera drifted against the blade, so the gripper left the frame at the stop. It is reframed.
- The hand icon faded in as a dark ghost; it now lands with a short scale overshoot.
- The robot reveal had the shoulder pressed against the right edge; it is now centred.
- The swing to the apple peaked at 1828 px/s; it is eased to 0.7 s.

**Not performed.** There is no audio or video playback in this environment. Nobody has watched V4 at speed or listened
to its mix or loop seam. Perceived pacing, tension and an inaudible seam remain to be confirmed by a person.
