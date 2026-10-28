# Flying Skateboard V5: changelog (camera and character stability pass)

Kept from V4:
- the narration (the established ElevenLabs take, sample for sample), its word timings and the caption text;
- the story order, the character and board designs, the 2D crew style and the sets;
- the runtime (35.9 s, 30 fps, 1077 frames);
- the score.

The working V4 material was reused: the opening flight, the fans, the lift, the workshop fire and redesign, the practice moments, and the river and canyon flights.

V5 was built, rendered, and then checked frame by frame from the rendered file by independent reviewers (one per section, plus a measured camera-motion pass). Everything they confirmed was fixed in the source and re-rendered. Section 7 lists those fixes.

## 1. The helmet and head: one rigid assembly (absolute priority)

**What was wrong (measured, and confirmed by an independent frame review of V4):**
- The helmet shell and visor outlines were the convex hull of points on a latitude/longitude grid fixed in world space, not to the head.
- During a head turn the outline froze for several frames, then jumped as a grid row crossed the rim:
  - the shell jumped by up to 46 % of its area between consecutive frames;
  - the visor jumped by up to 104 %.
- Grid points far behind the head were pushed onto the silhouette. This drew phantom areas (the shell was drawn almost twice its true visible size) and sometimes a visor-coloured band across the face.
- The orange stripe started below the brow, so it was drawn over the visor and "popped" across the front.
- The visor, ears and earbud were switched on and off by visibility thresholds.

**V5 (`eng/draw.tsx` `sphereRegion`, `art/Pilot.tsx`, `art/rig.ts`):**
- **Exact outlines in the head frame.** Every helmet part (shell, visor, stripe, ears, earbud, chin strap) is defined in the head's own frame. Shell and visor outlines are exact: their rim curves are clipped where they pass behind the head's visible edge, and that edge is followed between.
- **Turns rotate the whole assembly continuously.** In the same slow head turn and nod, from four camera angles:

  | Part | Worst frame-to-frame step, V4 → V5 | Worst second difference, V4 → V5 |
  |---|---|---|
  | Shell | up to 46 % of area → at most 4 % | 49,690 → 208 |
  | Visor | up to 104 % of area → at most 16 % (or 78 px² when nearly out of view) | 66,108 → 16 |

  Reproducible: `source/src/dev/helmetStab.ts`.
- **Stripe** runs only over the shell (brow rim to back rim) and is clipped to the shell outline. The visor highlight is clipped to the visor.
- **Ears and earbud** are thin disks on the head that foreshorten to edge-on as they turn away, so they never pop. The earbud's glow fades with the same turn.
- **Earbud on his right ear.** Every toe-side camera sees that ear. So the earbud is visible in the medium shots, and the earbud close-up is shot from the same side of the line as the shots around it, with his face to screen-right as everywhere else.
- **Neck pivot.** The head pivots at the neck (the head centre is a fixed offset from the neck joint in the head's frame), so a nod moves the head the way a neck moves it.
- **Collar.** The jacket's collar ring fades out as the camera comes down to shoulder height. Seen edge-on, its ends used to float beside the neck.
- **Head turns are slower and smaller.** In the coach beat he looks down at his wrist over 0.5 s and keeps his head down, listening, until he corrects. The listening tilt is about half of V4's.

## 2. Camera discipline
- **No orbits, swings, push-pulls or roll anywhere.** The camera either tracks the board at a steady offset, or stands still and pans/tilts while the rider travels through the frame. Its target is the board's position averaged over a short window, so it does not bob with every heave.
- **Screen direction:** travel is screen-right in every flight shot.
- **Hook (0–3.37 s):**
  - 0–1.4 s: one held, low, front three-quarter tracking angle over the river. The board heaves and his knees take it.
  - 1.3–2.4 s: he carves toward his heels. The board banks toe-edge up into the turn (about 17°), so its ten thrusters turn toward the camera. The reveal comes from his riding; the camera only holds.
  - 2.2–3.37 s: one steady rise and pull-back to the crossing. Elevation, distance and azimuth each change in one direction only, at most 1.45 % zoom per frame. (The first V5 cut dipped under the deck and climbed back, which the review flagged as a push-pull.)
- **Mechanism:**
  - A cut on the "You see" caption to the underside, held still from almost straight below. The board and its ten fans fill the frame and hide the rider; the air jets are drawn over the board, because from below they are in front of it.
  - A cut on "blast" to a low, wide, steady view. The jets run all the way down to a soft churned patch on the water where they land, and the bridge stays clear of the board.
  - A cut to the riverside flat. The lift is filmed by a camera standing on the grass, ahead of him and off to his toe side, which follows only part of the rise and of the move off. He rises in the frame and travels toward frame right. The camera tilts at most about 0.4° a frame (the first V5 cut chased him at up to 0.85 screen heights a second).
- **Workshop:**
  - A still top view, a cut to the low engine close-up on "JET ENGINES", and a cut to the deck-top view on "and caught" (leak, vapour, ignition). The fire stays attached to the fuel fitting and line.
  - The smoke thickens until it fills the room. The cut to the far side of the stand and the swap of the boards both happen inside it, so the electric board emerges complete in the same cradle as the smoke clears. One slow pull-back follows, ending on the framing the field shot matches. There is no arc round the stand.
- **Balance and coach:**
  - Two standing cameras with the background still: a wide one matched to the workshop, then a closer one round to his other side, so the cut changes both angle and size. He rides off across the frame and the camera pans with him.
  - The coach close-ups (deck phone, wrist phone, earbud) are each held still. The wrist view is set up from the settled pose: his arm is already up when we cut to it. (In the first V5 cut it was fixed to the rising wrist and rolled about 70° in 7 frames.)
  - A standing medium view for the correction.
- **Practice:**
  - The takeoff camera is set clearly apart from the correction shot before it.
  - A still, higher overhead camera for the S-curve.
  - A steady low side track on the flat. The first V5 cut used a standing camera beside his path, which whipped round as he passed.
- **Payoff:**
  - A steady rear three-quarter track over the shoreline and across the open river, easing back to show its width.
  - A cut on "and THROUGH" to the same steady track entering the canyon, both walls ahead.
- **Ending:** one steady front three-quarter track over the river while the question is asked, landing on frame 0's camera key with the camera's velocity continuous through the loop point.

## 3. Balance animation (16–25 s)
- **One connected balancing system** (`v5/flight5.ts` `fieldFlight`):
  - Each disturbance is a single small, smooth tilt of the deck (about 5°).
  - The body answers through damped springs: hips and centre of mass first, knees bending with the effort, arms counterbalancing a beat later on a looser spring (follow-through).
  - The board's attitude follows the body with its lag, and each correction settles.
  - A deliberate lean is preceded by a small opposite dip (anticipation).
- **Contact:** both feet stay locked to the deck. The body stays upright over the planted feet while the deck tilts under them (the V4 `upright` rig).
- **The hook's heave** is taken in the knees. The body follows the board's rise a moment late, so the legs compress as the deck comes up and extend as it drops away. In the first V5 cut, rider and board rose as one rigid block.

## 4. The prototype failure (9.3–15.5 s)
- Each tongue of flame grows in place as the fire runs from the burning pool up to the fitting and along the fuel line (the first V5 cut had a whole cluster appear in one frame).
- The pool burns off with the fire and leaves scorch on the deck and lines.
- The hot-air recirculation is drawn under the deck, which hides the part beneath it. It is never shown from below, where it crossed the deck's underside. The heat haze is shown only from above.
- The jet compressors spin up smoothly and never strobe or appear to run backward. The drawn blades turn at most 12° a frame; higher speeds show as blur.
- The electric board powers up as the smoke clears: its fans spin up smoothly.

## 5. Captions
- When a picture cut follows a caption change within 1–3 frames, the caption now changes on the cut frame. Captions run about 0.06 s ahead of the words, so every cut on a word used to give two pops. Caption text and order are unchanged.
- Placement keeps every caption clear of the rider and the board, using each shot's projected framing (the workshop now uses the board's actual position in frame).
- **"YOUR PRICE?"** is in the sky above the rider, clear of him and the board.

## 6. Other
- **Wrist phone:** it fades with its facing as his forearm turns instead of blinking on and off. Its readout crossfades from the level bar to the board icon as he raises it.
- **Bridge reflection:** on the rain-roughened river it is broken into short pieces and only reaches part way down. It no longer reads as a pole in the water or behind his head.
- **Buoys** are drawn only on the river crossing, so none appear to stick to the board in the opening or the ending.
- **The inventor** is removed from the workshop shots. He only ever appeared as a cut-off limb at the frame edge.
- **Board light strips** fade with their facing instead of popping.
- **Loop:**
  - The water ripples drift without wrapping.
  - The ending runs on the opening's own clock.
  - So the last frame flows into frame 0.
- **Sound:** retimed to the V5 cuts (`tools/make_audio_v5.py`, cues in `audio/cues_v5.json`), including the carve and the new underside cut. Fewer camera-move whooshes; the effects follow the action. Voice −17 LUFS, mix −14 LUFS, voice 15.0 dB above everything else in the speech band.
- **Export:** rendered natively at 2160×3840 and downsampled with a Lanczos filter to a true 1080×1920 H.264 master at 30 fps.

## 7. Fixed after the frame review of the first V5 render
The independent review of the first V5 render found the following; each is fixed as described above:
- **Hook:** the camera's push-pull and dip-and-climb; the bridge reflection reading as a pole through his head; the collar ends floating; the rigid heave; captions over the board.
- **Underside:** his face seen from under the chin, and the mic cable reading as a scar; the board's nose cut off by the frame edge; arms appearing to jump at the cuts.
- **Air and lift:**
  - The air shot never showed the air reaching the water, and the pylon stood under the board.
  - The lift camera chased him, and a caption sat on his helmet.
- **Workshop:**
  - The fire spread popped and the flames died early.
  - The smoke did not hide the swap; the fan units popped in and sank through the rim.
  - Haze and hot-air strands crossed the deck; the rotors aliased; the reveal camera arced.
- **Balance and coach:**
  - A near jump cut at 18.1 s.
  - The wrist insert whipped and rolled; the wrist phone blinked; the readout swapped in one frame.
  - The earbud close-up crossed the line; a near jump cut at 25.37 s.
- **Practice:** the flat shot whipped past a standing camera; the overhead S-curve crossed the frame in under half a second.
- **Everywhere:** captions changed 1–2 frames before the cuts.
