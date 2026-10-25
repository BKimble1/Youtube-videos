# Laser Voices V4: storyboard, rig and compositing pass

**Review file:** `exports/FGW_Laser_Voices_REBUILD_V4_REVIEW_1080x1920.mp4`

This is a review cut. It is not final, not published, and has no 4K master.

**How it was reviewed.** I cannot play video or listen to audio in real time. Everything below comes from two sources:
- rendered frames, looked at as images (contact sheets and every-frame strips);
- automated measurements over all 1022 frames.

A person still needs to watch it at normal speed with sound.

**Source.** `source/src/c4/`, composition `LaserVoicesC4`. V2 and V3 are untouched and still render.

## Export, verified with ffprobe (`qa/c4/ffprobe.json`)

| | |
|---|---|
| Video | **1080 × 1920** (9:16), H.264 High, yuv420p, BT.709, 30 fps, 1022 frames, 34.067 s |
| Audio | AAC-LC 48 kHz stereo; decoded audio vs the mix: 0-sample offset, correlation 0.99997 |
| Narration | Approved file, unedited, same gain, starting at sample 0; Vosk ASR WER 0.010 against the approved script |
| Loudness | −14.60 LUFS integrated (V3 was −14.58); peak −2.51 dBFS |

**About the reported 512×910 V3.** The V3 file in the repository also probes as 1080×1920, at 6.1 Mb/s. The 512×910
copy must have come from a re-encode made after download. Please check the V4 file with the same tool.

## Storyboard (`source/src/c4/shots.ts`; one frame per shot in `qa/c4/keyframes/V4_storyboard_as_rendered.png`)

28 camera shots. The molecular shot is a single continuous micro camera that moves through seven distinct
compositions, so the film has **34 compositions** in total. A new piece of the story arrives every 0.4–1.5 s.

| Time | Shots |
|---|---|
| 0–2.85 | S01 she reacts to a voice at her left ear (eyes snap, head follows); S02 ear level, sound rings localised at her ear; S03 the laser bench, with an illustrated pulse leaving the mirror; S04 a square elevation of the room, the pulse crossing the 8 ft to her |
| 2.85–7.2 | S05 contrast two-shot; S06 close-up on the bystander (puzzled, looking round, a shrug); S07 side elevation, rings at her ear only; S08 her fingertip taps her bare ear; S09 close-up of the empty ear (no earbud) |
| 7.2–8.9 | S10 the camera tracks one illustrated light packet across the room. The trail shrinks as it travels, then the push carries into the air at her ear |
| 8.9–15 | S11–17 molecules: (A) water molecules appear in the air at her ear; (B) close in as light reaches one molecule and is absorbed; (C) closer still as it shakes (heat); (D) back out as the warm pocket swells and shoves its neighbours; (E) the shove becomes repeating pressure bands; (F) the camera follows the bands into the ear canal; (G) the eardrum and the small bones answer |
| 15–20 | S18 the pressure waves dissolve into the transmitter: the laser module, mirror and bench; S19 side elevation of the sweep, the mirror turning the beam up and down across her ear with a fading fan; S20 where the sweep converges: wavelets from every point the beam passes arrive at her ear together; S21 her reaction |
| 20–23.35 | S22 the operator presses send; S23 behind the transmitter as it fires, the pulse leaving down the lane; S24 the 8 ft lane from above, the pulse crossing and the floor ticks lighting one by one |
| 23.35–26.15 | S25 approach: her, the lane and the transmitter, with him walking in; S26 the step (tracking his feet); S27 transmitter, blocker and listener lined up |
| 26.15–30.7 | S28 the sound rings at her ear, then gone on the block frame; S29 her close-up reaction to the silence; S30 from the transmitter's side, the path ending on his head while he texts, unaware; S31 elevation: the path ends at him, she is beyond |
| 30.7–34.07 | S32 he walks on and out of the lane; S33 the rings return at her ear on the clear frame; S34 the opening framing; frame 1021 runs into frame 0 |

**Beam depiction.** Realistic shots never show the beam. It appears only as a temporary illustrative overlay inside
explanatory shots, either as a travelling pulse (a bright head with a short trail) or as the full path while it is
being explained.

**Mechanism.** It follows the research in `production/SOURCE_NOTES.md`: a laser tuned to water vapour, swept by a
rotating mirror at the speed of sound so the sound gathers only at one distance.

- The V4 mirror spins about the module's beam axis, so the beam sweeps up and down across her ear. This is a better
  fit for "rotating mirror" than V3's side-to-side rock.
- The rotation is drawn larger and slower than in reality so it can be seen.

## Character rig fixes (`source/src/c4/rig/Crew.tsx`, `story.ts`, `walk.ts`)

**Face**
- **Face-cap bug.** When a face was exactly square to the camera and tipped down, the skin patch closed over the
  crown, and the face rendered as the back of the head. I found this in the eye check on the friend in V4's square
  elevations. The cap now always closes along the head's outline on the side nearer the face's centre. This was a
  latent bug in the original rig.
- **Eyebrows never draw over hair.** Eyes and brows are now clipped to the face's skin, and the bob's fringe is drawn
  on top of them. The fringe line was raised clear of the brows.
- **Fixed stacking order:** back hair, head, ears, hair, eyes and brows (clipped), nose and mouth, fringe, visor or bun.

**Arms**
- **Layer rule.** The arm on the camera side of the body is drawn over the torso and the far arm under it. A far hand
  only comes to the front when it is held well out in front of the chest. The old rule also weighed the elbow, which
  flipped an arm's layer part-way through a gesture.
- **Fewer gestures.** The listener's palm gesture across the friend is gone. Her hand stays cupped at her ear through
  the contrast, then opens to a fingertip for the taps.
- **Explicit elbow poles** for every reach.

**Walking**
- Every walk is now a straight line at one constant facing. In V3 he turned on planted feet, which crossed his legs.
- The first and last steps are squared to his facing.
- Feet alternate on explicit plants: 1292 planted-foot frames with zero slide.
- The cup arm hangs and swings opposite the legs, and blends back to holding the cup when he stops.
- Profile audits every 0.1 s show alternating contacts with no crossing.

**Staging**
- The friend now waits at the back bench, off the beam line, so in the side elevations the illustrated path never
  passes in front of his face.

## QA (`qa/c4/`)

| Check | Result |
|---|---|
| Motion scan, every frame | 25 spikes, all on planned cuts; no one-frame pops or flashes |
| Eye check (1184 faces) | 60 flags, all inspected on crops. 44 are the friend hidden behind her head (S24); 11 are her eyes under the yellow sound rings (S24); 5 are the operator in profile through glasses (S04, a few pixels of eye white). No missing or deformed eyes. |
| Head strips, every frame (`strips/`) | Hook 0–29, contrast and tap 85–215, stop 770–830, final 950–1021, and the seam: eyes, brows, hair, ears and hands stay attached and continuous |
| Foot slide while planted | 0 m |
| Beam drawn through any head, any frame | 0 |
| Block | Frames 786–956, computed from his head. The whisper is cut with a 3 ms ramp at frame 786, is −140 dB while blocked, and returns with an 80 ms ramp at frame 957. The sound rings at her ear stop and restart on the same frames. |
| Loop | Frame 1021 and frame 0 have the same camera and the same listener and operator pose (difference 0). The friend is out of frame on both sides of the seam. The mean grey difference between the last and first frames is 0.55, against a median of 0.82 between consecutive frames. |
| Per-shot contact sheets (every 2nd frame) | `shots/` (28 files) |
| Consistency sheets | `sheets/` |

## Known issues to check on viewing

1. **Flat-card characters.** Hands that reach toward or away from the camera are drawn in the card's plane. The press
   shot therefore uses a long, eye-level lens.
2. **Room-to-micro transition.** Going into the microscopic sequence is a 0.55 s dissolve inside a continuous push.
   Coming out, the pressure waves dissolve over 0.3 s into the transmitter close-up.
3. **Off-screen reset.** Between S01 and S02 the friend is reset off-screen from his end-of-film exit back to his place
   beside her. He is not in frame in either shot.
4. **Limited hand shapes.** The rig has four hand shapes: open, mitt, grip and fist.
5. **Pacing.** I could not judge whether the pacing reads like Death Clock or Real Web Fluid without viewing it at
   full speed.
