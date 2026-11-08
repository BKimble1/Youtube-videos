# Dead Bird Drones V3: QA notes

**Export:** `exports/FGW_Dead_Bird_Drones_V3_1080x1920.mp4`.

V3 is a polish pass over V2. The narration, the bird and duck designs, the 2D vector style and the 23.6 s runtime are all unchanged. The source draws V3 under the composition `DeadBirdDronesV3`, and the V1 and V2 exports are kept. Nothing has been published.

## What V3 changes (by brief section)

**0–3 s**
- Frame 0 is the flying bird with its cutaway open and the drive running, labelled SCHEMATIC.
- On "motor" (0.3–0.8 s) the camera makes one rapid push into the motor and its pinion, which are highlighted, and holds there.
- It returns to the flying bird for "dead bird" (1.25–1.95 s), with the rod, lever and wing root highlighted, then pulls back for "fly again".

**3–9 s**
- A match cut into the lab, then one continuous camera path:
  - a wide lab reveal for "researchers built drones"
  - a crane up to a high overhead assembly view as the shell lifts, for "preserved bird bodies"
  - a move down onto the lifted gearbox module with assembly guides, for "machinery hidden"
  - back out as the module and shell seat, for "underneath the feathers"
- It ends with a cut on "gearbox".

**9–13 s**
- The slow-motion drive in step with the words: the gearbox, then the motor and pinion, then the crank gear, then up the rod to the lever, then a pull-back to the wing.
- The crank pin, both rods, the levers and the wing stroke stay in phase, and the gears mesh. No decorative gears.
- The ghosted near wing over the window is lighter now (opacity 0.3), so the gears stay readable.

**13–19 s**
- The meadow is no longer a locked frame: the camera lags the drone slightly under a slow push, so the drone drifts forward across the frame.
- **Match cut on camera direction:** a whip pan right carries the drone and the flock out of frame. It cuts on "And" at full speed: about 8,600 px/s leaving the meadow and about 7,700 px/s entering the pond, with no ease-out before the cut.
- The pond camera finishes the same pan and decelerates onto the duck swimming in from the right. No frame shows both robots.
- On "robot" there is an eased dip to the waterline schematic, then a move in on the preserved head for "preserved duck".
- A whip tilt up carries the pond into the sky. The cut is again at matching speed: the pond tilt accelerates into it, and the sky tilt leaves it at the same screen speed.

**19–23.6 s**
- A wide shot of an ordinary-looking flock. The drone is one bird among them at a similar size, and the shot is labelled RESEARCH GOAL because it shows a speculative application.
- On "might" the cutaway opens inside that one bird, and the camera pushes into exactly the frame-0 close-up.
- A background sweep on the downstroke turns the sunset into the field, so the last frames are the opening's own.

## Checks on the delivered export

| Check | Result |
|---|---|
| Format | H.264 yuv420p BT.709, 1080×1920, 30 fps, 708 frames, 23.60 s, 22.7 MB. AAC 48 kHz stereo. |
| Loudness | −13.4 LUFS integrated, −1.6 dBTP. The voice sits at −16.5 LUFS in the mix. The audio loop seam jumps 0.0014. |
| Narration | Both recognisers transcribe the export's own audio with **0 word errors** (`qa/v3/export_asr.json`). |
| Sync | **0 ms** offset between the export audio and the voice stem. |
| Continuity | **0 unplanned large frame changes** (`qa/v3/render_qa.json`). |
| Pacing | The longest near-static run is 11 frames (0.37 s), at the overhead view while the frame begins to lift. |
| Loop | Last frame against frame 0: difference 8.4, smaller than the hook's own frame-to-frame changes. |
| Evidence | `qa/v3/`: a contact sheet every 0.5 s, the hook frame by frame, the loop seam, caption-free sheets, and 11 labelled strips (`strips/01`–`11`). |

## Independent final review

A reviewer extracted every frame and measured camera speed through each transition.

**Passed:**
- The hook: frame 0, one continuous push into the motor and back, and visible proof of the premise before "fly again" (it never reads as revival).
- 3–9 s variety: the wide lab, the overhead crane, the component close-up, and the seat.
- 9–13 s mechanism: tracked frame by frame; no loose or decorative gears.
- 19–23.6 s: the flock, the reveal and the loop.
- The two robots never read as one body.
- Anatomy and drive are consistent between shots, and the captions are clean.
- **Factual framing:** SCHEMATIC is on every mechanism view, including the duck's module, and RESEARCH GOAL is on the meadow and the flock. Nothing shows revival, sound or silence, sensors, cameras or specs.

**Found and fixed afterwards:**
- **M1, whip-pan speed jump:** both sides of the cut eased toward zero. The camera curves were changed so each pan is at its peak speed at the cut. I checked the result frame by frame (strips 07 and 09) and against the camera model.
- **M2, meadow locked for about 2.7 s:** now a slow push with forward drift.
- **m1, the tilt stopped dead at the sky cut:** now continuous.
- **m3, RESEARCH GOAL appeared late:** it is now on from each scene's start.
- **m5, the ghost wing dimmed the gears:** it is lighter.

These fixes were checked by me, not by the reviewer.

**Accepted as is:**
- **m2:** the flock holds for about 2.4 s. The shot still has a slow push, and the drone flies in during the first second.
- **m4:** the loop sweep's curved edge crosses two distant flock birds for 3 frames.

## Accuracy notes for the description (from `CLAIM_LEDGER.md`)

**What the sources show was built (the flying drone)**
- A flapping-wing drone built inside a taxidermied bird that can fly. S1 says "can fly using its wings"; S3 says "custom gearbox".

**What the sources show was built (the swimming robot)**
- A swimming robot made from a taxidermied mallard, with 3D-printed parts and sensors (S3).

**What is speculative and labelled RESEARCH GOAL**
- Wildlife monitoring with less disturbance.
- The drone among a wild flock.

**What is illustrative and labelled SCHEMATIC**
- The gear train and linkage layout.
- The duck's paddle drive.
- The slow-motion close drive.

**Recommended description line**
- "The 2025 flapping-wing prototype was built on a taxidermied mallard; the film draws a generic bird." The film's flyer is a generic brown bird, and the sources do not name the species of the earlier prototypes.

**"Motor"**
- Inferred from "drone platform" plus "custom gearbox". No source extract uses the word.

## Known limitations

- **Edge-on near wing:** for about one frame per wingbeat it reads as a thin ghosted line.
- **Exploded view:** the far wing's orientation is still not ideal, and the spar slot on the lifted shell is still a dark slit.
- **Real-time listening:** not possible here. The mix was checked by measurement and speech recognition only.
