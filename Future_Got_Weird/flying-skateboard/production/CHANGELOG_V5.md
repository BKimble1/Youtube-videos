# Flying Skateboard V5: changelog (camera and character stability pass)

Kept from V4:
- the narration (the established ElevenLabs take, sample for sample), its word timings and the caption text;
- the story order, the character and board designs, the 2D crew style and the sets;
- the runtime (35.9 s, 30 fps, 1077 frames);
- the score.

**How V5 was checked.** Each build was rendered, then reviewed frame by frame from the rendered file by independent reviewers: one per section, a measured camera-motion pass, a skeptic re-checking each finding, and a coverage critic. There were four rounds of review in all. Everything they confirmed was fixed in the source and re-rendered, apart from the low items listed in the QA report. Automated checks were also run on every frame:
- a regional pop scan;
- a helmet outline stability measurement;
- an arm layering check.

`production/QA_REPORT_V5.md` has the results and what remains.

## 1. Helmet, head and neck: one rigid assembly (absolute priority)

**What was wrong in V4 (measured):**
- The helmet shell and visor outlines were convex hulls of points on a grid fixed in world space, not to the head.
- In a head turn the outline froze, then jumped: the shell by up to 46 % of its area in one frame, the visor by up to 104 %.
- Phantom areas appeared, and the stripe and visor popped on and off.

**V5 (`eng/draw.tsx` `sphereRegion`, `art/Pilot.tsx`, `art/rig.ts`):**
- **Exact outlines in the head frame.** Shell, visor, stripe, ears, earbud and chin strap are defined in the head's own frame. Shell and visor outlines are exact curves, clipped where they pass behind the head's visible edge.
- **Measured over every frame of the film** in which he is seen (`source/src/dev/helmetFilm.ts`, 862 frames):
  - The median frame-to-frame change is 0.07 % of the head's disc for the shell and 0.02 % for the visor.
  - The largest changes, 2.2 % and 0.6 %, come in runs of similar values during his deliberate head lift at 24.2–24.5 s: a smooth turn, not a pop.
  - On a test turn, V4 → V5:
    - shell worst step 46 % → 4 %;
    - visor worst step 104 % → 16 % (`dev/helmetStab.ts`).
- **Neck and collar:**
  - The head pivots at the neck.
  - The neck is always drawn behind the jacket, whose top edge hides its base.
  - The collar opening is seen only from above its own plane, so it appears edge-on as a line. It is opaque and clipped to the jacket, so its ends never float beside the neck.
  - The neck is drawn again over the opening, clipped to the region beyond the ring's near arc. It rises out of the collar, in front of the ring's back and behind the jacket's front.
  - Nothing switches order and nothing is drawn at partial opacity, so nothing pops as the camera passes shoulder height and the neck never looks glassy.
  - V4 and the first V5 cut drew the neck's rounded base pasted over the jacket front and flipped its layer. A later V5 build faded a copy in, which showed the collar ring through the neck.
- **Earbud on his right ear,** the ear every toe-side camera sees. It is visible in the medium shots, and the earbud close-up is shot from the same side of the line as the shots around it, with his face to screen-right.
- **Hair at the back of the head,** under the helmet's rim down to the nape. A rear view read as a blank skin disc, like a featureless face.
- **Ears and earbud** are thin disks that foreshorten to edge-on as they turn away, so they never pop.
- **Head turns are slow and small.** In the coach beat he looks down at his wrist over 0.5 s and keeps his head down, listening, until he corrects.

## 2. Body and contact
- **Balance (16–25 s) is one connected system** (`v5/flight5.ts` `fieldFlight`):
  - Each disturbance is a single small, smooth tilt of the deck.
  - Hips and centre of mass answer first, the knees bend with the effort, and the arms counterbalance a beat later (follow-through).
  - Every correction settles, and a deliberate lean is preceded by a small opposite dip (anticipation).
  - The body stays upright over the planted feet while the deck tilts under them.
- **Feet:**
  - Both stay locked to the deck's spine.
  - Shoes and trouser legs split at the shoe-top plane:
    - seen from above that plane, the shoe is drawn first and the leg over it, cut off at the plane;
    - seen from below, the leg is drawn first and the shoe over it.
  - Where the order changes the camera is in the plane, so the two shapes only touch along a line. V4 drew the feet as stumps from below; a V5 build faded a copy of the shoes over the legs, and the trouser ends showed through them.
- **Arms:**
  - Each arm is drawn behind the torso.
  - An opaque copy is clipped to the part of the arm that is actually in front of the torso. That part is found from sight lines against an elliptic-cylinder torso, sampled across each tube of the arm, with the glove and the wrist phone or controller included.
  - The region grows and shrinks continuously, so a change of order never pops and no torso outline shows through a sleeve.
  - Earlier V5 builds switched the order whole, then faded a copy in. The fade left a semi-transparent sleeve, and one shoulder still flipped in a single frame in the earbud close-up.
- **The hook's heave** is taken in the knees: they compress as the deck rises and recover without springing up past his stance.
- **The wrist phone** is opaque and drawn only while it faces the camera; it turns away edge-on, so it never pops. Its readout crossfades as he raises it.
- **Long rides** keep a little slow motion in his knees, arms and gaze instead of a held pose.

- **Board:**
  - The deck top is drawn only from above its plane and the underside only from below the bottom plane; with the camera level with the board's edge, neither is drawn, only the side. A face therefore appears as a line, so the deck details and the underside wiring never swap in a single frame.
  - Above about 3 turns a second the rotor blades fade out, and the spin shows as the blur disc and speed arcs. The arcs turn at under 10° a frame in flight; they were redrawn at unrelated angles every frame and flickered.

## 3. Camera discipline
- **No orbits, swings, push-pulls or roll.** The camera either tracks the board at a steady offset, or stands still and pans/tilts (often following only part of his travel, so he moves through the frame). Its target is the board's position averaged over a short window.
- **Screen direction:** travel is screen-right in every flight shot. The canyon is a track from behind him into depth.
- **Hook (0–3.37 s):**
  - One held, low, front three-quarter track over the river, with the knees taking a heave.
  - At 1.3–2.4 s he carves toward his heels: the board banks about 17° toe-edge up and its ten thrusters turn toward the camera. The reveal comes from his riding.
  - The camera settles at 1.6 s, then makes one rise and pull-back to the crossing (at most 1.45 % zoom per frame). It ends low, so the far bank and the bridge deck sit behind his hips, not across his neck and jaw.
- **Mechanism:**
  - On the "You see" caption, a still view of the underside from almost straight below: all ten fans, with the board hiding the rider.
  - On "blast", a low, wide, steady view in which the jets run down to a soft churned patch on the water.
  - The board rises in one continuous move; a second ease-in after the first ease-out made the camera's tilt hitch.
  - On "lifting you completely", the riverside lift from a standing camera that follows only part of the rise and move-off. Its tilt eases in from rest at the cut. Its pan follows a share of his travel that falls away, so it peaks mid-move and is slowing at the cut.
  - Before, it started at 6 px a frame and accelerated to 14 px a frame into the cut.
- **Workshop:**
  - A still top view, a low engine close-up held at one angle, and the deck-top view of the leak and fire.
  - The smoke fills the room completely, and the cut to the other side of the stand and the swap of the boards both happen inside it.
  - One slow pull-back follows, ending on the framing the field shot matches.
- **Balance and coach:**
  - Camera A (wide, matched to the workshop) starts from rest on the match cut. It follows 60 % of the lift, eased over 1.1 s, so he rises in the frame; it was a 450 px boom peaking at 35 px a frame.
  - Camera B is closer and round to his other side, so the cut changes both angle and size.
  - The coach close-ups are held still, and the medium correction shot follows most of his travel.
  - The earbud close-up and the correction shot cut on the frames where their captions change ("helps him learn", "how to balance."). They came 5 and 6 frames before the captions.
  - The earbud light and the chime move with the close-up: the light starts just before it and peaks inside it.
- **Practice:**
  - The takeoff is filmed from a camera clearly apart from the correction shot.
  - A still overhead camera watches a slower, tighter S-curve.
  - A steady low side track on the flat.
- **Payoff:**
  - A rear three-quarter track over the shoreline and the open river.
  - A cut on "and THROUGH" into the canyon, with both walls and the way ahead in frame.
- **Ending:** one steady front three-quarter track while the question is asked, landing on frame 0's camera key with continuous camera velocity.

## 4. The prototype failure (9.3–15.5 s)
- Fuel weeps from the fitting, runs down the casing to the lip above the pool and drips into it, at irregular intervals. Before, evenly spaced identical drops repeated every 4 frames and landed short of the pool.
- The pool forms only once the first drops land. Vapour rises off it.
- The flame lights at the pool and climbs the drip trail to the fitting, then runs along the line.
- **The fire is one merged silhouette:**
  - all the tongues' outlines first, then their fills, then the hot cores;
  - rounded bases, each anchor with its own tongue shapes;
  - a soft radial glow.

  Before, separate clusters with stroked flat bases stacked into a staircase with hard seams, and the glows were hard-edged discs.
- The anchors along the climb are joined by a ribbon of flame, so the fire reads as one band up the casing.
- The ignition bloom is soft; a stronger one pumped the whole frame like an exposure flicker.
- The hot-air strands fade in and out over their run instead of appearing and vanishing at full length.
- The top view and the fire view each hold one angle (their slow elevation and azimuth creep read as orbits).
- The fire is out about 0.3 s before the smoke closes in, leaving a scorch on the deck where the pool burned. A dying flame narrows as well as shortening and fades; it used to squash into hollow outline slivers under the smoke.
- The jet compressors never strobe or appear to run backward (drawn rotation at most 12° a frame; more speed shows as blur).
- The hot-air recirculation is drawn under the deck and never from below. The heat haze clears once the leak starts.
- The room's smoke rolls with clear light and dark billows (3–7 px a frame). It read as a near-static flat grey.
- The smoke over the stand clears with the room's smoke, so the new board is not revealed after the stand around it.
- The electric board emerges complete as the smoke clears, and its fans spin up.
- The window shows sky behind a frame cross. A near-white pane read as a whiteboard, and the white caption over it lost contrast.

## 5. Environment
- **Canyon:**
  - A ridge terrace "cap" no longer covers the sky gap between the walls.
  - The gorge's own water replaces the river's, so no straight seam sweeps across the frame.
  - Bushes are culled only when wholly off screen.
- **Trees** whose crown is almost level with the camera plane are culled. One projected to a frame-wide shadow that tinted the takeoff for 3 frames.
- **Tree crowns along the river's ridges** are picked and sized by their place in the world. They were indexed from the camera's position, so every crown jumped whenever the camera crossed a 30 m grid line; one such jump showed at 7.1 s.
- **Gorge water glints** ride the current without a periodic reset (the whole field jumped every 3.3 s) and stay inside the channel (they ran over the sand banks).
- **Shoreline:** the downwash and shadow blend from ground to water.
- **Bridge:**
  - The reflection is broken up, and the deck is not reflected.
  - The deck's near end runs into the near bank's third terrace, whose crest stands about 10 m above the deck, so it never ends in mid-air.
- **The shed** stands further back, clear of his head in the standing cameras.
- **The downwash wisps** move more slowly over the field. Moving faster than their own width each frame, they read as redrawn.
- **The rider's ground shadow** has a head in proportion; it read as a lollipop.
- **Loop:**
  - The water ripples drift without wrapping, and the ending runs on the opening's own clock.
  - The knee "work" saturates smoothly; a hard clamp stopped his arm dead on frame 1.

## 6. Captions
- Caption text and order are unchanged.
- When a picture cut falls within 3 frames of a caption change, the caption changes on the cut frame. Captions run about 0.06 s ahead of the words, which used to give two pops at each cut.
- The two coach cuts that were 5–6 frames from their captions now land exactly on them (see section 3).
- Placement keeps every caption clear of the rider and the board, and in the air shot also clear of the churned water. It uses each shot's projected framing, prefers the previous caption's place when that is clear, and samples only the caption's time on screen.
- **"YOUR PRICE?"** is in the sky above him.

## 7. Sound
- The mix is retimed to the V5 cuts, including the carve, the new underside cut and the lift cut (`tools/make_audio_v5.py`, `audio/cues_v5.json`, which now also lists every picture cut).
- The earpiece chime lands on the cut to the earbud close-up.
- Fewer camera-move whooshes; the effects follow the action.
- Levels: voice −17 LUFS, mix −14 LUFS, voice 15.1 dB above everything else in the speech band.

## 8. Export
- Rendered natively at 2160×3840 and downsampled with a Lanczos filter to a true 1080×1920 H.264 master at 30 fps (`exports/FGW_Flying_Skateboard_V5_REVIEW_1080x1920.mp4`).
