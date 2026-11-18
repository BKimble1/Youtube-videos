# Season 1 · Winter Break: 40 s trailer, V1 report

Review render: `exports/Ultimate_Trifecta_Winter_Break_V1.mp4`.

| Property | Value |
|---|---|
| Runtime | 40.00 s (1,200 frames at 30 fps) |
| Video | 1920 × 1080, H.264 High, yuv420p, BT.709; rendered at 60 fps and blended to 30 (180° shutter motion blur) |
| Audio | AAC 48 kHz stereo, 320 kb/s |
| Loudness | QA_LUFS LUFS integrated, QA_TP dBTP true peak (measured on the delivered file) |
| Logo | first frame of the card is frame QA_LOGO_FRAME (QA_LOGO_T s); the music's accent attack starts at QA_ATTACK s |

## What I reviewed first

- **Your reference trailer** is `website/assets/video/trailer.mp4` in the game repo (branch `claude/happy-edison-50dynd`, 55.6 s, 1080p). Its holiday group shot (the friends on the round teal rug, the tree to the right, the window behind) runs from about 0:46. The hard cut to the title is at about 0:51. Both carry into this cut. The rug, tree and line-up are rebuilt from the same game pieces, and the cut to the title is hard.
- **The music** is the screen recording's audio: a Stable Audio take that plays in full from 5.179 s (the earlier fragment is discarded). It is a 120 BPM orchestral cue: a quiet opening (0–4 s), a building low end (4–12 s), a new phrase with bells at 12 s, a low-end break with a small tempo shift (18–20 s), the strongest sustained build (20–27 s) and a decay to about 29.4 s. The accent you heard at about 25.3 s has its real attack at **25.283 s in the clean take (30.462 s in the recording)**. It peaks about 60 ms later.
- **The game**: `BKimble1/ultimate-trifecta`, branch `claude/happy-edison-50dynd`, Godot 4.7.2. Everything on screen comes from it: Moonbrook College and Puddlesworth Hall's common room, the skinned runner rig and its animations, the blue-striped pajama runner from the app icon, the Elf Helper and Reindeer Onesie outfits, the Night Watch and his cart, the holiday dorm pieces, the splash effects, and the official title art (`art_src/branding/ultimate-trifecta-lobby-title.png`).
- **The Fortnite references.** I can't watch video here, so I worked from your description of the two decisions rather than the trailers themselves. From Season 8: the destination is in frame from the first shot (through the open door you can see up the spine to the fountain, and from the fountain the lit hall sits at the end of the path), so every cut reads as one event. From Season 7: one reveal changes the meaning of the chase. The officer switching his lights off turns "they barely escaped" into "he let them go".

## Staging on the real map

The route is one straight line on Moonbrook's central spine, chosen with the bank, exit, cart path and dorm together:

- **The Christmas dorm** is Puddlesworth Hall's real ground-floor common room. The DormStage holiday pieces (tree with ornaments, fairy lights and star, presents, the round teal rug, the couch, armchair and lamp, cocoa and cookies, the wreath, garland and string lights) are placed in it just inside the real front door at (0, 103). Through that door you see the real campus: the spine path, the fountain and Bellweather Tower.
- **The water** is Founders' Fountain, 75 m north up the spine. They test the water and jump from its **north** rim, heading **south**, toward home. They surface and climb out on the south rim, so the jump, the swim and the run home share one screen direction.
- **The cart** comes in on the west path and rounds the plaza's ring (the bend) to stop beside them. It sets off as they run, races round the east side of the ring, and stops on the spine path just past their exit, facing home. That stretch is open to carts until the bollards at z = 84.5, more than 40 m on, so he really could have followed.
- **The way home** is the spine itself: the green arrows run from the fountain's south rim down the path to the hall's lit front door.

## Shot list

| Time | Shot | What happens |
|---|---|---|
| 0:00–4:00 | `s01_dorm_out` | The common room: the tree in the foreground, the rug, the warm doorway. The lead eases the right-hand door open. Outside, the elf (towel over the shoulder) crooks a hand: come on. The lead glances back at the room, grins and slips out. The door drifts shut (soft latch, heard under the next shot). |
| 0:04–0:04.6 | `s02_rim_foot` | Match cut on the step: the same slipper lands on the fountain's rim. |
| 0:04.6–0:08 | `s03_rim_test` | Low, from the water side. The lead on the rim reaches a toe toward the water and snaps back, leaning away. They hop down and retreat to the friends' line. The reindeer catches their eye with a grin. Headlights flood across from the left. |
| 0:08–0:09.6 | `s04_freeze` | All three frozen in the light; their heads track it. |
| 0:09.6–0:10.9 | `s05_cart` | Along their eyeline: the Night Watch cart rounding the bend, headlights flaring into the lens, the officer at the wheel. |
| 0:10.9–0:12 | `s06_nod` | Back on the lead, same place: one look at the officer, one at the water, a tiny nod, the first step. Cut on the first footfall (0:12.000). |
| 0:12–0:12.8 | `s07_wide` | Wide: the three runners, the fountain ahead, the cart behind them pulling away from the bend. Slow motion starts in the last 0.4 s. |
| 0:12.8–0:20.6 | `s08_leap` | The best camera move. It tracks beside the lead through slowed strides. At takeoff (0:13.6) the lead leaps first and nearest the lens, with the friends a beat later. The camera rides up with the lead into the sky (moon, tower), swings round to the front and drops to the water. The lead tucks into a cannonball and hits the water at exactly **0:20.0**. The splash fills the frame and the water closes over the lens. |
| 0:20.6–0:22 | `s11_surface` | From the water line, the blue nightcap bursts up in the foreground, heading the same way. Ahead, the reindeer and the elf are already hauling out onto the south rim. |
| 0:22–0:24.6 | `s12_follow` | The game's own camera (6.2 m behind, 18° down, 62° view, as FollowCamera frames a runner). The wet trio runs down the spine along the green arrows toward the lit hall, past the cart, which has stopped on the path with its beams on them. |
| 0:24.6–0:28.5 | `s13_officer` | The last runner (blue stripes) passes through the foreground and clears the frame. We stay on the officer in profile, the stillest frame of the cut. He watches them go, takes his right hand off the wheel to the dash and switches the lights off (0:26.9). The beams vanish from the path and the roof beacon goes dark. |
| 0:28.5–0:29.65 | `s14_door_catch` | Puddlesworth's porch: the elf (the one who beckoned) holds the door. The reindeer dives in and the lead catches the door edge on the way past. |
| 0:29.65–0:36 | `s15_dorm_home` | The opening camera position. The door swings shut: a **firm** latch at **0:30.0**, and the score cuts on it. Out of breath, they listen as the cart's motor fades outside, then straighten up and line up on the rug beside the tree, trying to look as if they never left, settling into the reference's group composition. At 0:35.1 the lead shifts their weight and one wet slipper squeaks. The elf slowly looks down at it. Half a beat. |
| 0:36–0:40 | end card | Hard cut: the official title, already full size on the game's night navy, with SEASON 1 · WINTER BREAK beneath in the site's type (Archivo, wide black italic; "Season 1" in the brand yellow). The music's accent lands on the first frame. A slow 1.2 % drift, one sheen across the title, faint snow, and a fade on the music's tail. |

## How it was made

- **In-engine.** A dev-only director (`source/godot_trailer/`) drives the real characters through the same `apply_state()` path the match uses, along choreographed routes, and films them with keyed cameras. There is no gameplay recording. A Python planner (`source/tools/plan.py`) writes every shot: routes, jumps, splashes and the cart's drive. It computes the timing so the sync points land exactly: the first footfall on 0:12, the impact on 0:20 (the slow-motion rate is solved for it), and the switch on 0:26.9. The jump, the swim and the run are one continuous choreography cut into shots, so geography and timing carry across every cut.
- **Acting layer.** New for this trailer is `TrailerPoseMod`, a SkeletonModifier3D that runs after the game's own modifiers and adds small keyed bone rotations on top of the game's animation. It drives the beckon, the push on the door, the toe test and recoil, the head turns that track the light, the nod, the cannonball tuck, the officer's hand to the dash, the innocent hands-behind-the-back and the elf's look down. Faces use the rig's own shape keys (smile, squint, open, brows).
- **Rendering.** Each shot was rendered with Godot's Movie Maker at a fixed 60 fps clock, 1920 × 1080 with 2× MSAA, on the game's Mobile renderer. The compositor (`source/comp/comp.py`) blends frame pairs to 30 fps for motion blur and applies a light grade: slightly cooler shadows and warmer highlights, highlight bloom on the lamps, bulbs and headlights, a mild contrast curve, vignette and fine grain. It also builds the underwater transition at 0:20–0:20.9 and the end card.

## Music edit

| Picture | From the clean take | Why |
|---|---|---|
| 0:00–0:08 | 0.000–8.000 | The quiet opening for the sneak-out. It stops dead as the headlights find their faces, on the beat that would have come next. |
| 0:08–0:12 | silence | The headlight reaction plays over the motor, the water and the wind only. |
| 0:12–0:21.35 | from 9.008 | The restart is on the strong downbeat at 9.008, placed on the first footfall (0:12.0). The take's downbeat at 17.0 then lands on the splash at 0:20. |
| 0:20.0–0:21.95 | (muffled) | A low-pass sweep to about 350 Hz and a dip: the camera is under water. |
| 0:21.0–0:30.0 | 16.275–25.277 | Crossfaded in under the muffle. This is the take's strongest sustained build, carrying the run home. It ends 6 ms before the accent, so the expected hit is held back at the latch... |
| 0:30–0:36 | silence | ...the dorm payoff plays in silence... |
| 0:36–0:40 | from 25.283 | ...and the held-back accent lands on the logo's first frame, with the take's own decay (and a 0.6 s fade) under the card. |

## Sound design

`audio/tools/build_mix.py` places the sounds from the engine's event logs and the planner's clocks.

| Moment | Sound |
|---|---|
| The departure | The push plate's soft unlatch, a low hinge creak, the night air rising as the door opens. The **soft latch** as the door drifts shut, carried across the match cut. |
| The rim | The slipper on stone, a tiny water plip and ripple at the toe, a cloth whip on the recoil, footsteps on the retreat. |
| The cart | **The game's own `cart_loop.wav`**, pitched by the cart's speed. Its level and brightness follow its distance from each shot's camera, so it is faint as it approaches (0:06–0:07), loud rounding the bend in the quiet (0:08–0:11), and an idle whine at the stops. It revs away round the fountain, idles by the path, then after the switch pulls away and fades: first from the porch, then through the closed door (0:30–0:34). Tyres on stone as it rounds the bend; the game's `cart_start.wav` as it sets off. |
| The jump | A slowed, pitched-down whoosh and an air bed under the slow motion. |
| The splash | The game's `splash_big.wav`, a generated splash, a low impact and a sub drop. Under water: a dark rumble and bubbles. Surfacing: the water breaking, splashes and wet footsteps. |
| The switch | One crisp switch click and the relay tick of the beacon stopping, then quiet. |
| Home | The **firm latch** (door closer, solid thud and clack) exactly on 0:30. Room tone, drips on the floorboards, the motor fading outside. The **squeak** (0:35.1), about 0.25 s long, alone in near-silence: the effects bed is at about −65 dB for the half second before it. |
| The card | The music's accent. |

The master is a gentle bus compressor plus a look-ahead limiter, normalised to −14 LUFS integrated with true peak at or below −1.5 dBTP. Stems are in `audio/mix/stems/`.

Three effects were generated for this trailer with ElevenLabs (`audio/sfx_src/generated/`): the soft latch, the firm latch and the wet slipper squeak, four takes each, 204 credits in total. Everything else is the game's own audio or the effects library from the earlier Christmas trailer.

## Trailer-only staging (please confirm)

These are not in the 2.2 build as shipped:

1. **Front doors.** The game draws Puddlesworth's openings with no door leaves. The trailer adds oak double doors with glazed panels and a transom, so the door can be eased open, held and latched.
2. **The Christmas corner inside Puddlesworth.** The holiday dorm (the menus' DormStage room) is the game's own decor, re-placed in the real common room so the dorm and the campus are one place.
3. **The towel** over the elf's shoulder: a simple striped towel attached to the chest bone.
4. **Real headlights on the cart.** The game's cart has emissive lenses and a faint glow cone. The trailer adds two light-casting spots, visible beams and lens glare, all on one switch.
5. **Snow, outdoor festive lights and the quad's Christmas tree**, as in the earlier Christmas trailer.
6. **The green arrow path** along the spine. The game guides runners with HUD arrows, not ground arrows.

## QA

QA_SECTION

## Known limits and open questions

1. **I checked the audio by measurement, not by ear.** I can't listen to a mix. I picked the latch and squeak takes, and balanced the sound against the picture, using event logs, envelopes and spectra. The squeak's laugh and how the mix sits on a phone speaker need a human listen.
2. **The toe test is close to the rig's limit.** The rig has no toe or finger bones and the rim stands 0.35 m above the water, so the toe reaches toward the water rather than visibly breaking the surface. The ripple and the recoil carry the beat.
3. **The fountain's jets** are part of the real fountain. One passes close to the camera during the flight: a longer near plane removes it for most of the flight, and a thinner arc of it stays visible near the end.
4. **The Mobile renderer under software Vulkan** has no SSAO or volumetric fog. I tested Forward+ (SSAO, volumetric fog) and it added little at real cost, so the look comes from lighting, beams, motion blur and the grade.
5. **"Crooks a finger"**: the rig has no finger bones, so the elf's beckon is a raised hand curling twice at the wrist and forearm.
