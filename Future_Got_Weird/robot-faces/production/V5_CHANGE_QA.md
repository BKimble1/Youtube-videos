# V5 change and QA report: Robots Are Learning to Copy Our Faces

27 Oct 2026. Not published.

V5 is built on the V4 source in place: composition `RobotFacesV5`, shot table `source/src/v2/Film2.tsx` (90 shots).
The new V5 scenes are in `source/src/v2/shotsG.tsx`; the new settings are in `source/src/v2/new.tsx`. V4 as delivered
can be rebuilt from commit `13a31de`.

## Deliverable

| | File |
|---|---|
| Final review, 3840×2160, 30 fps | `exports/FGW_Robot_Faces_V5_FINAL_REVIEW_3840x2160.mp4` |
| Subtitles | `captions/FGW_Robot_Faces_V2.srt`, unchanged: the narration and its timing are unchanged |
| Mix | `audio/mix/FGW_Robot_Faces_V2_mix.wav`, rebuilt with the V5 action cues; narration file untouched |
| Shot / transition map | `production/V2_TRANSITIONS.md`, regenerated from the V5 table |

Runtime 3:33.333 (6,400 frames). The ElevenLabs narration is the same file: no new voice, no script change, no change of
rate, pitch or timing.

## What changed

### The opening (0–10.4 s)

| Time | Narration | V5 |
|---|---|---|
| frame 0–3.9 s | "This robot watches for a smile before it fully appears." | Face to face, inches apart, on a demonstration stage (LED wall, beams). On frame 0 he is already pulling a shocked face and the robot is already giving it back. A glare, a huge grin: each returned a beat later with brows, lids, jaw and lips together. The camera travels between the faces, following each copy. After the grin he is amazed; then his face softens, a smile starts, and the robot's eyes drop to his mouth. |
| 3.9–5.6 s | "Then it tries to smile" | Close on its mouth as the smile begins: the silicone clears softly over the corner motor (no cut window, no ring); the horn turns, the rod pulls, the skin moves, the smile forms. |
| 5.6–7.6 s | "at the same time as the person in front of it." | The stage, side on: he leans in; the two smiles land together; he is delighted. |
| 7.6–10.4 s | "That takes more than moving the corners of a mouth." | One pull back reveals the stage and the people watching. It makes a whole-face expression for them: one films it, two turn to each other, one raises both hands. |

First 8 s: action on frame 0; the technology demonstrated (copied expressions, then the mechanism); four compositions;
one continuous camera path in the first shot; no talking head.

### New settings (each with its own architecture, palette and light)

| Setting | Where it is used |
|---|---|
| Demonstration hall (navy, LED wall, truss, beams, audience) | the opening; "a useful distinction" (1:55–2:02); the audience member watching a mouth (2:10); the finale |
| Engineering workshop (slate, steel shelving, red tool chest, parked arm, amber lamps) | "engineers built" (0:20) to the slider trials (0:30); skin against metal (1:05); the controller (1:13) |
| Test bay (white, observation window, tripod camera) | the knob trials, jaw flap, sock puppet, "follow the speech" (0:39–0:53); the 2024 timing study (2:27–2:54); "studies of facial movement" (3:01) |
| Wider robotics lab (an arm stacking blocks, a rover, another head practising) | "Once it had a way to control its own appearance" (1:17) |
| Video call at home | "You're speaking … as yours does" (3:09–3:16) |
| Kept from V4 and earlier: mirror lab, screen room, studio, testing room, lobby, station, home, office | |

### Section by section

- **0:12–0:40.** The mechanism is demonstrated, not described: an engineer works inside the translucent face; her
  fingertip presses the cheek and the silicone gives; the motors come on group by group; the human cheek muscle cuts
  to the robot's corner motor; the slider board pulls faces nobody asked for while the second engineer laughs, then
  winces.
- **0:40–1:18.** A researcher turns knobs and the lip motors move under clearing skin, missing the shape; she slides
  a fader and the jaw flaps with loudness; the sock puppet; her deadpan; she says the word into a microphone and its
  lips follow. Skin against metal is a physical demonstration: a clamped silicone sheet stretches around the pulled
  point; a metal bracket turns as one piece.
- **1:18–1:40.** The people on the screens now gesture, tilt and shift their weight in time with their speech; the
  singer opens her arms.
- **1:40–2:15.** The studio engineer behind the glass shrugs at the language; the distinction plays out on the stage
  with the audience; the B / W comparison is no longer a static pair of panels: the camera travels from the lips to
  the robot's attempt.
- **2:15–2:50.** The late smile stays at the hotel reception. The 2024 study is a live face-to-face experiment in the
  test bay: the camera is on his smile as it begins, moves to the robot as its smile starts early, and pulls back as
  both arrive together; the researcher nods.
- **2:50–3:33.** Futures as a video call (the assistant lifts its eyes to him; its lips follow its voice; the gallery
  view, his smile and its smile together), then the tutor, desk and humanoid scenes. The finale returns to the
  demonstration stage: from the audience, the two face to face; side on, its smile arriving with his; and the last
  image is the face-off from frame 0, both smiling, the robot's eyes leaving him and coming to us.

### Removed

- The circular cheek "window" with its rim, everywhere it was used: the mechanism now shows through a soft clearing
  in the skin.
- Remaining lab-only close-ups moved into the scenes they belong to (stage, test bay, lobby, workshop).

## Checks performed

PLACEHOLDER_CHECKS

## Limitations

- **Runway was not used.** Its output host (`dnznrvs05pmza.cloudfront.net`) is still denied by this environment's
  network policy (proxy 403). Every environment is drawn in the episode's vector style.
- **Not watched in real time.** There is no video or audio playback here; the checks are frame reads and measurements.
- **Rig limits.** The cast rig faces the camera (no back view, no walk cycle), so people are staged around the
  action, lean and gesture, but never walk. The robot's mouth still compresses in strong profile.
- **Some earlier staging kept:** the mirror lab (0:10–0:20, 0:53–1:05) and the screen-room training sequence keep
  their V3/V4 staging; the 2024 section keeps the monitor face, the eye and the motor close-ups.
