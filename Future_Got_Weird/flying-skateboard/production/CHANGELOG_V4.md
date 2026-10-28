# Flying Skateboard V4: changelog (targeted revision of V3)

Unchanged from V3:
- the narration (the established ElevenLabs take, sample for sample), its word timings and the captions;
- the story, the characters and their designs;
- the 2D crew style;
- the runtime (35.9 s, 30 fps);
- the score.

The working V3 material was kept wherever it already worked:
- the jet spool-up and heat;
- the lift on the riverside flat and the low-angle swoop into the jet match;
- the practice progression;
- the departure over the shoreline;
- the river and gorge sets.

## 1. Opening, 0–3.5 s: rebuilt
- **0.00–0.40:** close and low from his toe side, with the camera just under the deck. Frame 0 shows his face and posture, the board with its fans seen from below, the water moving 4 m beneath him, and the far bank and bridge behind. There is no title, fade or static pose.
- **0.40–1.00:** the camera tracks a little closer. The board heaves gently in the air and his knees take it.
- **1.00–1.65:** low alongside the board: the spinning thrusters in an oblique view from below. The camera moves alongside; the board is never spun past the lens (V3's orbit underneath is gone).
- **1.65–2.40:** a rider-focused rear three-quarter view as a new mid-river gravel bar (`env/Shore.tsx`, `Shoal`) slides beneath him. Shoreline and water pass under him, so the forward travel reads.
- **2.40–3.50:** the camera widens over the river to the scale of the crossing, with the far bank and town ahead, then comes down beside him into the explanation.
- **Height:** the flight now runs about 4.3 m over the water (V3: 8.5 m). That is safer and easier to read: the wash, the shadow and the moving water are all close.

## 2. Mechanism, 3.5–9.3 s
- **One underside view for the count** (V3 had several rotating ones). It is taken from the side, so the board sits level in frame with the rider visible above it.
- **One close propeller view** on "electric propellers": a row of turning fans from low at the side.
- **"Blast air downward":** the camera drops back to show the board, the air leaving the ducts (swept back with his speed) and the water it roughens below. This is a new light foam patch with spray on the water (`Wash` `foam`). The V3 push into a single spinning disc is gone.
- **The cut to the riverside flat** now lands at the end of "downward" (6.92 s), not mid-word. It goes straight into the legs-and-board view as the deck lifts under his feet. The camera holds its height so the gap to the ground opens in frame.
- **"Completely off the ground":** the wide crane over the river, then the low-angle track.

## 3. Prototype failure, 9.3–15.5 s
- **Clear cause and effect** (`FuelLeak`):
  1. the hammering engines and the recirculating hot air;
  2. the centre engine's fuel fitting weeps;
  3. drips fall onto the deck beside the engine and pool;
  4. vapour rises off the pool;
  5. on "FIRE" the vapour catches at the pool and the flame runs up to the fitting and back along that fuel line.

  The fire stays contained, with no explosion. The fuel is cut, the flames die, and the scorched deck, lines and wiring sit in smoke.
- **One continuous camera move from the fire to the redesign** (the V3 bench montage cuts are gone):
  - The camera rises over the scorched prototype.
  - The electric board replaces it in the same cradle on the same test stand, as a dissolve while the camera keeps moving. The ten units then seat one by one.
  - The camera arrives at the framing the field shot continues (a match cut on the board's position).

## 4. Balance sequence, 16–25.4 s: the main anatomy fix
- **Upright body (new `upright` option in `art/rig.ts`):**
  - The pelvis stays over the planted feet along the world vertical and the spine is built from world up.
  - The deck tilts under him while his ankles and knees absorb it, and the hips and arms make the correction. In V3 the whole body tipped with the board as one block.
- **Damped, smaller tilts (`v4/flight4.ts`):**
  - Every disturbance is one smooth deck tilt, answered by a body counter-shift 0.14 s later, and each one is smaller than the last.
  - Peak tilt is 6°, against up to about 14° combined in V3, and the motion settles instead of oscillating.
  - The steady roll error in the coach beat is left uncorrected until the cue, and his correction removes it.
- **Cameras: front three-quarter only, on 38–42° lenses:**
  - Both legs always read separately (V3's profile view made them overlap).
  - The helmet, neck and torso keep their proportions (V3's 58–62° close-ups enlarged them).
  - The V3 over-the-shoulder ride, where the shins merged into the deck, is replaced by one continuous push from the whole body to the legs and deck and back out as he rides.
- **Knee bend:** a deeper, more athletic stance (crouch 0.47 + correction).
- **AI coach:**
  - The deck phone's artificial horizon, from above.
  - His own view of the wrist phone as he raises it, with the board icon tilted amber.
  - A cut, as the cue arrives, to the earbud lighting.
  - The pull-out as he corrects, with the wrist readout green.

  These are the same devices, in the same places, as in every other shot: the deck phone in the board's spine, the wrist phone on his left forearm, the earbud on his left ear.
- **Captions** are placed clear of his feet and the deck in every shot of the sequence. In the legs close-up the protected region is now the feet, ankles, knees and deck.

## 5. Payoff, 26–31.8 s
- **The crossing:** after the departure, the camera pulls up and back over the open river: its width ahead, the far cliffs and town, and the gorge he is heading for.
- **The destination:** from behind him, the gorge mouth opens in the far cliffs, then the walls rise around him. The camera stays alongside him between the walls, with the river beneath.
- **Moving scenery:** channel buoys along the route pass at their own depths.
- **Height:** about 5 m (V3: up to 9.5 m), with gentle banking only.

## 6. Ending, 31.8–35.9 s: rebuilt
- **The rider is in every frame of the question** (V3's rider's-eye view and its empty-water rise are gone):
  - behind his shoulder over the river (matching the canyon shot's framing);
  - in close beside him on "PAY YOU";
  - round to frame 0's low front three-quarter view.
- **"YOUR PRICE?"** is 112 px, low over the water beneath him, clear of the rider.
- **Loop:** the camera key, trajectory, pose, light and location are frame 0's, with continuous camera velocity through the loop.

## Sound (`tools/make_audio_v4.py`, cues `audio/cues_v4.json`)
- The V3 design is retimed to the V4 picture:
  - air on each opening move, and water on the stones over the gravel bar;
  - the air rush to the water, with spray hiss;
  - the cut to the flat with grit;
  - **new:** fuel drips and a vapour hiss before the whoomp;
  - the soft air of the dissolve, and ten seats timed to the units;
  - the push in and pull out on the legs;
  - the earpiece cue;
  - air on each ending move.
- **Levels:** voice −17 LUFS, mix −14 LUFS, voice 15.0 dB above everything else in the speech band.

## Export
- Rendered natively at 2160×3840 and downsampled with a Lanczos filter to a true 1080×1920 H.264 master at 30 fps.
