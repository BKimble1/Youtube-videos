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
rate or pitch, no added pauses, nothing reordered.

## What changed

### Opening (0–10.4 s)

| Time | V4 |
|---|---|
| 0–1 s | Frame 0: the robot faces us mid-speech (silent shapes, not the narration), lips, jaw, brows and eyes moving together. Before 1 s its eyes go past the camera and the camera pulls back and trucks: a person is standing right in front of it, large in the right foreground. |
| 1–3.9 s | It stops talking and watches his mouth (eyes drop to his lips) while his smile starts to form ("watches for a smile before it fully appears"). |
| 3.9–5.6 s | "Then it tries to smile": close on its mouth. The silicone clears over only the two motors making the smile; the cheek opens onto the corner motor; its horn turns, the rod pulls, the corner lifts. The section closes as the camera eases back. |
| 5.6–7.6 s | Face to face: both smiles land together. |
| 7.6–8.5 s | He tries a different expression on it: a mock-surprised "ooh" (brows high, eyes wide, jaw dropped, lips rounded). |
| 8.5–9.6 s | Its version: brows, lids, jaw and lips together. |
| 9.6–10.4 s | Over its shoulder: he goes still, curious and a little uneasy. Then the mirror. |

The V3 copy of his spoken lip shapes is gone, so the same lip motion is no longer shown three times.

### Act 1: mechanism (20–33 s)
- **New:** his face, close, on "That gives the face ways to move": as he smiles, his cheek clears over the zygomaticus
  major (cheekbone to mouth corner), which shortens and thickens. Match cut on the mouth corner to the robot's corner
  motor in the same place.
- The actuator close-up now shows only the corner motor, its cheek window inside the face.
- "Create the shapes it needs" is a split view of one moment: the whole face on the left, its side section on the
  right, the linkages pushing and pulling the lips into four expressions.
- Every see-through view now shows only the motors driving the current movement (`xrayFocus` in `art/Robot.tsx`).

### Act 2: learning (53–104 s)
- At the mirror: three clearly different trials (wide smile with brows up; tight pucker with brows knit; lopsided
  open jaw), each held long enough to read in the glass, with only that trial's motors showing.
- "Hours of YouTube footage" is a new setting: a dark room lit by a wall of eight screens, a different Weird Crew
  speaker or singer on each, each changing clip on its own beat; the robot's eyes go from face to face.

### Act 3: result and limits (100–132 s)
- **New comparison** on "The result was a physical face moving its lips along with speech and song": a dark testing room,
  two identical heads hearing the same speech. The left one only opens its jaw with the loudness, a beat late and
  always the same shape; the right one makes the learned shapes on time. Wide, then close on the left mouth, then
  across to the right. Marked "Illustration".
- The song and language shots move to a new recording studio (microphone in shot); their waveform graphics are gone.

### Act 4: a personal moment (132–181 s)
- The late smile is restaged at a new hotel-lobby reception with a robotic assistant (the research head on a body)
  behind the counter. He comes up and leans in; it turns to him in two stiff steps; he hesitates and eases back. Its
  smile then arrives late; over its shoulder, his awkward reaction.
- The payoff ("a shared-looking moment") returns to the same counter: this time its smile arrives with his, and he
  leans in, lit up.

### Ending (206.5 s – end)
- "Watch the smile again": a split view of the same head. Left, an untrained face: the corners step up one motor at a
  time, lopsided, eyes and brows not taking part. Right, the learned smile in one movement. The split closes onto
  the learned face; then him; then the robot looks back, its brows lift slightly, and the last frame returns to
  frame 0's framing and mouth shape.

### Throughout
- A slight coordinated head motion (pitch and roll of a degree or two, plus the jaw) on the robot everywhere, the
  reflection included.
- Sources are smaller (23 px), consistently top left; the Columbia tag reads "Columbia University · Creative Machines
  Lab". Disclosures 22 px bottom left.
- Leftover decorative waveforms removed (song, language, home).
- Sound: the opening lip-motor ticks moved to the new action (frame-0 speech, the corner motor in the cutaway, the
  copied expression); three servo cues on the mirror trials. Music sections unchanged in order: intrigue (hook) →
  discovery (mechanism, mirror) → understanding (training, result) → personal (late smile, 2024 study, futures) →
  thoughtful payoff.

## Science check

The narration was checked against search results for the Columbia release and the coverage of the January 2026
*Science Robotics* paper (Hu et al., "Learning realistic lip motions for humanoid face robots"), and the 2024 study.
The source pages themselves could not be fetched from this environment. The narration matches the sources: 26
motors under flexible skin; learning its own face in a mirror, then from hours of YouTube video of speaking and
singing; synchronisation in languages it was not trained on; reported difficulty with "B" and with puckered sounds
like "W"; the 2024 prediction of an approaching smile about 840 ms ahead. No inaccurate line was found, so nothing is
flagged.

The new comparison's left head (loudness-only jaw) and the untrained smile at the end are illustrations of a simpler
approach, not footage or data from the studies.

## Checks performed

There is no playback in this environment. **Normal-speed viewing with sound has not been done.** Everything below is
from frames and measurements.

- **Scans on the source:** invalid SVG values: none in 6,400 frames (`qa/v4/nan_scan.txt`). State continuity
  (`qa/v4/state_continuity.txt`): no reset inside a shot; the flagged fast changes are speech shapes, the keyed
  expression trials and eye saccades.
- **The first 12 s at quarter-second steps**, read from the rendered review (`qa/v4/review/opening_quarter_seconds.png`).
- **Every second of the film**, read from the rendered review (`qa/v4/review/sec_01.png` … `sec_08.png`). Found and
  fixed before the final renders: the cheek window in the 3.9 s cutaway bulged past the face outline; a leftover
  waveform in the home shot (3:12).
- MEASURED_PLACEHOLDER

## Remaining limitations

- **Not watched or heard in real time.**
- **Runway is still blocked.** Its output host returns a proxy 403, so every setting is the episode's layered vector
  illustration.
- **No walk cycle.** At the reception he "comes up" by leaning in, not by walking.
- **Some lab repetition remains** in the 2024-study section (2:28–2:58), which keeps its V3 staging.
- **The schematic timing comparison** (≈ 0.84 s) and the B/W panels keep their thin frames: they are the only way the
  numbers and shapes are shown.
