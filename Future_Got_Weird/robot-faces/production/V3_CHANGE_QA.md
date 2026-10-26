# V3 change and QA report: Robots Are Learning to Copy Our Faces

26 Oct 2026. Not published.

V3 is built from the V2 source in place: composition `RobotFacesV3`, shot table `source/src/v2/Film2.tsx`. V2 as
delivered can be rebuilt from commit `92c9fab`.

## Deliverables

| | File |
|---|---|
| Review, 1920×1080 | `exports/FGW_Robot_Faces_V3_REVIEW_1920x1080.mp4` |
| Master, 3840×2160 (rendered at 2× from the vectors) | `exports/FGW_Robot_Faces_V3_MASTER_3840x2160.mp4` |
| Subtitles | `captions/FGW_Robot_Faces_V2.srt`: unchanged; the narration and its timing are unchanged |
| Narration / mix | `audio/narration/FGW_Robot_Faces_narration_V2.wav`, unchanged; `audio/mix/FGW_Robot_Faces_V2_mix.wav`, rebuilt with the V3 action cues |
| Shot / transition map | `production/V2_TRANSITIONS.md` (regenerated from the V3 table: 93 shots) |

Runtime: **3:33.333** (6,400 frames, 30 fps), identical to V2. The voice is untouched.

## Main improvements

**1. Text removed.** Every label now goes through one allow-list (`source/src/v2/text3.tsx`). About 60 V2 labels
are gone:
- captions repeating the narration;
- part names;
- word arrows;
- "talking / singing";
- "sound ↔ moving mouth";
- "looking like speaking";
- "movement / meaning";
- the B and W descriptions;
- "small changes";
- "predicted expression";
- "facial movement";
- "its own voice".

Also gone:
- the waveform boxes;
- the banana syllables;
- the circular rings round the lip gap;
- the dotted cue circles on the face;
- the late-smile curve chart;
- the target-shape inset;
- the timing strip's container and its labels.

What remains is plain text with a soft shadow, never in a pill, bubble or box:
- source names (Columbia University; the 2026 lip-sync and 2024 studies);
- small "Illustration" and "Possible use / Possible future · illustration" disclosures;
- the number "26 motors";
- "≈ 0.84 s", marked schematic;
- the letters "B" and "W".

**2. The hook (0:00–0:10), rebuilt as a continuous progression.**

| Time | What happens |
|---|---|
| frame 0 | The robot is mid-speech: lips in a rounded shape, eyes on the camera. The silent shapes are not the narration. |
| 0–2 s | One shot. The lips run through distinct shapes, blending rather than swapping. The eyes make small coordinated shifts, the brows lift with a change of expression, and the camera eases back to show the whole face. |
| 2–3.9 s | The same shot. While the lips keep moving, the silicone turns translucent onto the motors beneath it, and the cheek opens onto the corner motor. Its horn turns, the rod pulls, the corner and the lips move. Its gaze turns toward someone off screen. |
| 3.9 s | Match cut on the open cheek, then one pull back: the section closes and the robot is facing a person, its smile beginning. |
| 5.6 s | Face to face. The two smiles land together and he is pleasantly surprised, brows up. |
| 7.6 s | His mouth, large: he says something. |
| 8.9 s | Match cut to the robot's mouth in the same place, making the same shapes. Its skin turns translucent and every lip motor is seen working at once. |

The mirror follows at 10.4 s, where the narration reaches it ("study their own movements … a mirror"). The brief's
"mirror at 5–7 s" was moved there so as not to contradict the words.

**3. Transitions.** More of the film is continuous movement:
- the translucent face → cutaway;
- the cutaway → pull back to the two-shot;
- his mouth → its mouth (match);
- into the mirror's reflection → the skin (match);
- into the alcove screen → the screen's scene;
- one camera move along the speech → map → motor → lips path;
- the humanoid's smile relaxes → the head to camera (match);
- the last frame returns to frame 0's framing and mouth shape (loop).

**4. New and rebuilt scenes.**
- **Skin.** The skin cross-section slide is replaced by an animated cutaway on the face. From the skin filling the
  frame, the camera moves back to a three-quarter face with the cheek open. The motor's rigid horn turns while the
  skin it pulls bends; the motor pulls twice on the words. Then close on the pulled point, where the surface around
  it moves with it and the lip corner follows.
- **Actuator close-ups.** Two very close shots of the corner motor: one on "ways to move", one starting the
  anticipated smile on "Less than a second". They replace a repeat of the side mechanism and a repeat of the
  comparison.
- **Footage.** The footage the robot watches is now one person after another, fast-forwarding on its screen,
  instead of a static grid of mouths.
- **The training example.** One person speaking, with the sound running beneath them as a line; the camera closes
  on the mouth.
- **The late smile.** It now ends over the robot's shoulder on his awkward reaction, instead of a chart.
- **"Predict an expression as it begins".** Now a face-to-face shot instead of two portrait panels.
- **The station.** The concourse figures now act: one talks and gestures to a kiosk head; the other asks the
  second kiosk, then turns, smiling, to her friend.

**5. Look.** A light vignette and a per-section grade over every frame give depth and separate the chapters:
- cool for the experiments;
- warm for people and the possible futures.

No render-heavy effects (no blur filters).

**6. Sound.** 63 cues on actions shown, including the faint lip motors during the opening cutaway and the copied
shapes. The narration is untouched.

## Checks performed

There is no playback in this environment. **The required normal-speed viewing, with and without sound, has not been
done.** Everything below is from frames and measurements. That viewing is the main remaining check.

- **First 10 seconds at quarter-second intervals.**
  - Rendered from source (`Sheet2`, 0–12 s at 0.25 s steps).
  - Read again from the final review (`qa/v3/opening/quarter_seconds_0-10s.png`).
  - The cheek window, which sat outside the face silhouette in the front view, was moved inside it.
- **All edits.** Two frames either side of every edit, from the final review (`qa/v3/strips/`).
- **Every shot.** The mid-frame of every shot, checked for surviving text. The labels left are the allowed ones.
- **Scans.**
  - Invalid SVG values: none in 6,400 frames.
  - State continuity: no reset inside a shot; the fast changes are speech shapes and eye saccades.
- **Measured QA on the review** (`qa/v3/review/review_qa.json`):
  - H.264 1920×1080, 30 fps, 6,400 frames, 213.333 s;
  - −14.2 LUFS, LRA 3.3, −1.4 dBTP;
  - no black frames; no frozen stretch of 2.5 s or more;
  - audio against the narration at a 0 ms lag (r = 0.92);
  - 67 captions on word onsets, with no overlaps.
  - SHA-256 `563091147518fa92d79670c3f207f920129ec590b955b62e335be5055499cab7`.

- **Master** (ffprobe / ebur128 / blackdetect on `exports/FGW_Robot_Faces_V3_MASTER_3840x2160.mp4`):
  - H.264 3840×2160, 30 fps, 6,400 frames, 213.333 s, 187.1 MB;
  - −14.2 LUFS, peak −1.4 dBFS;
  - no black frames;
  - SHA-256 `bac293a0cee0e28684c655b890b55f7e2109d7534e3a27def6ead7af6681a8c3`.
  - Native 4K frames read back and inspected: `qa/v3/master/` (frame 0, the cutaway, the skin, the station, the last
    frame). The last frame matches frame 0's framing and mouth shape.

## Remaining limitations

- **Not watched or heard in real time.**
- **Runway is still blocked.** The image host returns a proxy 403 (re-checked). The settings remain the episode's
  layered vector illustrations.
- **Character rigs.** The Weird Crew cast rig has simple ink mouths. The talking figures in the concourse do not
  walk, because the rig has no walk cycle: they gesture and turn.
- **First-pass staging kept in the middle.** The B/W, distinction and parts of the 2024 study keep their V2
  staging, minus their labels. They develop every 1–3 s, not every second.
- **The robot's mouth in profile** still compresses at the silhouette (yaw above about 60°).
