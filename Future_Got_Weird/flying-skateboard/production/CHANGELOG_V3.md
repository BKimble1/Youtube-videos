# Flying Skateboard V3: changelog (from V2)

Kept from V2:
- the locked narration, sample for sample (the established ElevenLabs take), and its word timings;
- the caption style and timing;
- the 2D crew style;
- the board and pilot assets;
- the river, gorge and workshop sets;
- the score.

Changed: everything listed below.

## Hook (0–3.4 s): rebuilt
- **Frame 0:**
  - Mid-crossing at 8.5 m over the water (V2 was about 2.8 m).
  - The camera is slightly below and ahead of the board, with the rider large against the river, the beach and the cliffs.
  - The deck is already tilted and his knees and shoulders are mid-correction. There is no intro pose.
- **The camera path is one continuous spline in the brief's order:**
  - alongside, with the bank sliding behind him;
  - down and behind to the ten-fan underside;
  - up to a high three-quarter view, where his shadow on the water shows the height;
  - a lateral follow toward the far bank and cliffs;
  - in under the board.
- **The V2 issue of the rider becoming tiny is gone:** he stays large all through the hook.
- **Loop:** the camera's velocity is continuous through frame 0. The ending's last key and the hook's first keys are shared, so the move doesn't ease to a stop at the cut.

## Engineering (3.4–9.3 s)
- **Underside detail:** each duct now shows three stator arms and a motor can from below.
- **Air:**
  - A new aft-swept airflow: wisps leave each duct, swirl a little, wander as they mix, and sweep back with the forward speed.
  - They lengthen as the rotors spin up on "electric propellers".
  - The V2 rings are gone.
  - He drops to about 4 m during the explanation, so the downwash visibly roughens the water (a new surface wash: a darker roughened patch, cat's-paw crests and spray, lagging behind the board).
- **The match is now through the rotor:**
  - The camera pushes into one spinning fan from below until it fills the frame.
  - It continues as the same fan seen from above on the riverside flat.
- **New lift sequence:**
  1. his shoes beside the fan;
  2. the deck pushing up under his feet as his knees flex;
  3. a clean rise as the shadow separates;
  4. a crane up that reveals the river;
  5. a low-angle tracking shot with him against the sky.

## Jet failure (9.3–13.6 s): replaced
- **Low mechanical close-up:** under the deck as the engines spool and the exhaust hammers the floor.
- **Heat builds visibly:** glowing nozzles, heat haze, hot lines and wiring, recirculating hot air.
- **The fire:** a short, contained fire at the centre engine's fuel fitting; the inventor flinches back.
- **Brief damage shot:** a scorched deck, lines and wiring in smoke.
- **Redesign montage:** scorched compressor becomes an electric fan, then an overhead build, then the last units seating low across the bench, then a match to the field.

## Training (15.5–27.7 s): rebuilt
V2 cycled one backyard three-quarter angle for about 10 s. In V3 every shot shows something new:
- **A, the problem:** the nose dips by itself and his hips go back. The camera orbits from a low front three-quarter view to profile.
- **B, mechanics:** shoes, ankles and deck close up. A heel-side roll, his knees take it and the deck comes back; then a toe-side shift.
- **C, rider's view:** the camera cranes up his back into an over-the-shoulder ride. The ground slides under the board; a gust, then a whole-body save.
- **D, the AI system as reported:**
  - The tripod phones are removed.
  - The phone in the deck shows an artificial horizon.
  - The wrist phone, turned up to read, shows a board icon tilted amber against a level reference.
  - The earbud lights with the cue and he tilts his head to listen, then makes the correction himself.
  - No holograms, bubbles or AI face, and the AI never flies the board.
- **E, progression:**
  1. an unsteady takeoff, close side view, morning light;
  2. an overhead S-curve whose path is traced in the grass;
  3. a low-angle level pass on the new riverside flat;
  4. the run over the shoreline as the river opens beneath him.

## Payoff (26.9–31.8 s): rebuilt
- **Departure:** off the riverside flat and out over the water, accelerating; then alongside him over the water.
- **The crossing:** a wide view back across the river with the rider readable, then one sweeping orbit into the gorge, the walls passing at different speeds.
- **Down the gorge:** a rear three-quarter tracking shot with both walls converging ahead.
- **Scale:** the rider is no longer a dot. The smallest he gets is about 10 % of the frame height, for under a second.

## Ending (31.8–35.9 s): rebuilt
- **His own view:** past the deck edge to the water 8 m below, with his shadow on it.
- **Out of the helmet:** the camera rises straight up (his head stays below the frame), then back over his shoulder and round beside him, down to frame 0's camera.
- **"YOUR PRICE?":** set larger (112 px, heavier stroke), high in the sky, clear of the rider.

## World and assets
- **New `env/Shore.tsx`:** the riverside flat (pebble beach, wet stones, rough grass, boulders, driftwood, willows). The near-bank hills stand back to make room for it.
- **Cliffs:** limestone cliff bands with strata on the river-set ridges.
- **New `fx/AirJets.tsx` and `fx/Wash.tsx`:** the aft-swept airflow and the surface wash described above.
- **Board:** stator arms in the ducts; an artificial horizon on the deck phone.
- **Pilot:** the wrist phone's level readout; full legs in his own view.
- **Shadows:** the rider's shadow takes a light direction and colour per scene, so it reads on water.

## Sound
- **New `tools/make_audio_v3.py`:** the V2 synthesis and mix rebuilt on the V3 cues (`audio/cues_v3.json`):
  - air on each camera move;
  - a rush into the fan, and the deck knock as the rotors bite;
  - starter clicks, spool-up and heat ticks;
  - a contained whoomp (not an explosion) on "FIRE";
  - unit seats;
  - cloth on each correction;
  - the earpiece cue;
  - wind in his own view.
- **Levels:** voice −17 LUFS, mix −14 LUFS, voice 14.9 dB above everything else in the speech band.

## Export
- Rendered natively at 2160×3840 (Remotion `--scale=2`) and downsampled with a Lanczos filter to a true 1080×1920 H.264 master, so thin ink lines are antialiased from four samples per pixel.
- **The 512×910 file you received:** the V2 file in the repository decodes at 1080×1920 (checked with ffprobe). The low-resolution copy was most likely the preview transcode made when the file was sent through the session.
