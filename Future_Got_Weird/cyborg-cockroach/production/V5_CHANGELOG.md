# Cyborg Cockroach V5: finalization and consistency pass

**Final master:** `exports/FGW_Cyborg_Cockroach_V5_FINAL_1080x1920.mp4`
- 1080x1920, 30 fps, 936 frames, 31.2 s, H.264 High.
- Rendered directly from the vector composition at native resolution, not an upscale.
- yuv420p bt709, CRF 14, about 6.6 Mbps. AAC 48 kHz. Loops.

**Other files:**
- Mix: `audio/mix/FGW_Cyborg_Cockroach_V5_mix.wav`
- Subtitles: `captions/FGW_Cyborg_Cockroach_V5.srt`
- Canonical model sheet: `production/V5_CANONICAL_MODEL.png`

## Narration

The approved ElevenLabs narration is reused unchanged, word for word, at the same timing, with no duplicated words.
- The voice stem matches the source (correlation 1.0).
- A Whisper transcript of the final MP4 has a word error rate of 0.

## One canonical model

`production/V5_CANONICAL_MODEL.png` (Still `CanonSheet`) is drawn by the film's own renderer. It shows the two equipment variants from the side, three-quarter, high three-quarter, front and top views:
- **Medic:** green board on a dark saddle, clear launch tube, spring, latch line and coil, injector with amber dose, collar, steel needle, black clips.
- **Observer:** the same board, a camera module with a blue lens, an aerial, no tube.

Every shot draws the same pose rig, the same `Roach2D`/`Gear2D` geometry and the same palette, so the insect and devices cannot be redrawn per scene.

## Fixes

### Renderer, every shot
- **Box and cylinder outlines** (board, saddle, clips, launch tube, barrel, collar) keep their straight edges at every angle. V4 smoothed few-cornered hulls into lenses and ovals, which is why the tube changed shape in one frame at 6.47 -> 6.50 s.
- **Wires** are cut exactly where they pass behind the body's silhouette, so they grow and shrink continuously. Electrode beads fade with facing. V4 popped wire segments in and out, for example at 30.73 s.
- **Leg segments' end caps** curve outward, so knees and ankles are solid. V4 left a hole at every joint, and the background showed through.
- **Leg shade** blends with depth instead of flipping near/far colour while the insect turns.
- **Eyes** fade with facing instead of popping.

### Shots
- **Hook (0-1.3 s):**
  - One continuous shot of the whole recognizable cockroach with the spring-loaded injector at the clear target.
  - The line releases at 0.38 s, the needle (still attached to the injector) snaps into the silicone at 0.55 s, and the body recoils.
  - One smooth camera move follows the mechanism.
  - Speed streaks are only drawn behind the barrel, so no doubled outlines.
- **8-10.5 s and 14-15.5 s:**
  - The near-top-down views, where the flat rig cannot hold its shape, are replaced by a supported high three-quarter view (el 46-49). The renderer stays in one drawing mode for every frame.
  - The steering pulse runs along the left wire, then the insect turns right around the block.
  - The overhead approach shows the medic heading for the target with the observer behind.
- **17.3-18.1 s, delivery:** drawn on the same injector as every other shot (no hatched section redraw). The plunger moves forward with gas bubbles, and the dose diffuses into the clear silicone.
- **Lab:** the low turn-away shot (3.0-3.8 s) has foreground props with parallax instead of an empty white tray.
- **Rescue:**
  - The rescuer's glove lying on the floor (it read as a disconnected hand) is replaced by a yellow hard hat for scale.
  - Daylight comes from the upper right in every rescue shot.
  - The observer's passage ends in the warm glow of her pocket.
  - The operator blinks.
- **Survivor:**
  - One four-finger hand construction in every frame (curled, relaxing, open), instead of a mitten fist, fingers that grow and a different splayed hand.
  - The arm reads as one continuous limb from shoulder to hand, with no raised floating fist over the shoulder.
  - The tucked far arm no longer shows as a stray knob.
  - Eyes stay inside the head outline, and brows clear the fringe.
  - A clear startle (eyes widen, head and shoulders recoil, a small gasp), then unease, then cautious hope as the hand opens.
- **Scientist's arms:** with a hand resting on the bench, his far (right) arm now bends out from his far shoulder at the front of his chest, so the remote arm and the bench arm come from opposite shoulders. Before, the far elbow was hidden behind his torso and the forearm seemed to come out of his middle, on the remote arm's side. The fix is in the shared rig, so it applies to every shot where his hand rests on a table: the lab shots, the monitor shot and the field table.
- **The insect in the crack** keeps its own brown shell and dark antennae; it is no longer washed out.
- **Ending:** the final close-up lands on frame 0's framing (whole insect and injector), so the loop is seamless.

## QA of the final master

- Loudness -14.2 LUFS, true peak -1.5 dBTP; audio offset 0 ms, correlation with the mix 0.99998.
- Caption windows 23/23, mobile-safe.
- ffmpeg blackdetect finds no black frames. No low-motion holds.
- The only motion spike away from a cut is her startle at frame 829 (intended).
- **Independent frame QA** of the previous V5 render (every 6th frame, plus frame-by-frame at every cut and every problem area) found 11 issues. All are fixed above.
- **Final render checked:**
  - both sides of every cut;
  - the tube across 192-197;
  - the wire across 920-925;
  - the startle across 826-832;
  - the 935 -> 0 loop.
- Probes on the shot code for 243-314 and 424-465 show no renderer mode switch in any frame, six attached legs and no leg drawn over the shell.

## Remaining imperfections

- **Far legs partly hidden** in the raised three-quarter views: some far legs show only partly beyond the shell edge, and during a swing a near leg's tibia can be hidden under the shell margin. That is how the flat rig reads at those angles.
- **Screen direction:** the medic walks screen-left in her two-shots and screen-right in the final close-up, which matches frame 0 for the loop.
- **Feet in the descent:** planted feet drift slightly against the dark floor during the descent into the gap (about 22 s); it is hard to see.
- **Runway:** not used. Its asset host is denied by this environment's network policy. No credits were spent.
