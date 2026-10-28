# Flying Skateboard V7: changelog (visual rebuild of V6)

**Unchanged from V6:**
- the approved ElevenLabs narration (the same recording, sample for sample), its word timings, the caption text and the story order;
- the score;
- the runtime (35.90 s, 1077 frames at 30 fps);
- the 2D vector Weird Crew style, the rider and the ten-fan board design.

The composition is `FlyingSkateboardV7`, in `source/src/v7/`. The new cutaway drawing is in `source/src/fx/Cutaway.tsx`.

**Goal:** continually developing visual action. V6 had 18 picture cuts; V7 has 11. Most of the extra progression now comes from moves inside one shot, not from more cuts.

## 1. Opening and the inside of the board, 0–7.13 s (one camera, no cut)
- **0–3.0 s, in flight about 7 m over the Yangtze:**
  - It starts mid-flight, high, looking down past him to the water.
  - The gust at 0.45 s rocks the deck, and his body answers it.
  - The camera rises behind him as the gravel bar and buoys pass beneath, then pulls out wide to show the crossing's scale.
- **3.0–3.6 s:** the camera sweeps down and under the moving board. A layer of fair-weather clouds overhead passes as he flies, so the sky behind the underside is never an empty backdrop.
- **"You see, ten powerful":**
  - The bottom skin opens from the spine in a clean cut, showing a cavity, ribs, a pack, and power runs to the ten units.
  - Current pulses out to the motors as the rims are counted.
- **"electric propellers":** the camera travels to one unit, round to its side, where a section opens:
  - the motor's coils energise in turn;
  - the magnet bell and blades spin up;
  - air speeds down through the duct.
- **Labelling:** a small "ILLUSTRATIVE CUTAWAY" tag sits in the bottom corner during the cutaway. The wiring, pack and motor internals are a generic conceptual layout, not the real board's.
- **"blast air downward":**
  - The skin closes, and the camera follows the air down beside the jets to the river.
  - Meanwhile the board drops from about 7 m to about 3.4 m, so the downwash visibly churns the water.

## 2. The lift, 7.13–9.31 s
- The camera starts low in the grass, close to the board, where the downwash flattens the grass outward. This is new: grass bending under the board (`Blow` in `env/Shore.tsx`).
- The camera cranes up and back as the board lifts him from the ground to about 3 m, so his height changes in the frame.

## 3. The jet failure, 9.31–13.64 s (one camera, no cut)
- **Sequence:** ignition → exhaust plumes onto the floor → the hot air curling back up to the intakes (the reported explanation) → the casings overheating toward red → fire round the engines.
  - The fire starts at the centre engine and reaches the other four in turn.
  - It is controlled: no explosion. It is put out on "So he switched".
- **Camera:** one slow move, from a three-quarter view of the prototype, down to the deck's edge (plumes and recirculation), then up and back over the fire.
- **Removed:** V6's smoke-filled room and the cut hidden in it.

## 4. Jet to electric, 13.64–16.16 s (the same camera)
- **The redesign view:** the room light cools, and a measuring grid lies on the floor round the stand.
- **The change, part by part:**
  1. The five jets lift out of their mounts, one after another.
  2. The bare plank goes up and away.
  3. The electric deck comes down into the same cradle.
  4. Its ten units seat one after another.
- **Then:**
  - The camera pushes in on one new unit as its motor spins up.
  - It pulls back as the finished board lifts off the stand.
- **The cut:** to the field, on "one HUGE problem", with the board already in motion. The field section starts there.

## 5. The balance problem, 16.16–22.44 s
- **A slow flight attempt, not a hover:**
  - The board drifts forward at about 0.7 m/s, about 0.85 m up.
  - The problem roll peaks at about 9°, and the nose dip at about 8°. V6 had about 6° and 5°.
- **His answer:** knees, hips, torso and arms through the same damped springs, with no limb crossings. The foot check below confirms the feet stay planted.
- **Views:** the nose and toe-side view, a side view that now keeps him in frame as he drifts, the legs close-up, and one eased move back to the whole body.

## 6. The AI coach, 22.44–24.22 s (one camera, no cuts)
- **The move**, all from his right (the earbud) side, so it never crosses his body:
  1. The deck phone reading the tilt.
  2. Up over his right shoulder to the wrist phone: the posture readout in amber, and the coach's voice as a cyan waveform.
  3. The earbud pulses in the same frame.
  4. Back out to his body and the board as he corrects.
- **Then:** the wide view of the next gust, met at once (unchanged).
- **The AI never moves the board.**

## 7. The payoff, 25.32–31.75 s
- **The take-off is confident:** the practised wobble is almost gone.
- **The river:**
  - Out over the water he climbs to about 9 m.
  - The camera tracks alongside him, with the far shore and town sliding past, then rises to a high angle looking down past him to the water far below.
- **The canyon:**
  - It joins the flight low over the gorge's water, behind and below him. The 140 m walls tower on both sides, with the gorge running on ahead between them.
  - The camera rises behind him as he flies on.
  - A gust between the walls is answered in his body.

## 8. Question and loop, 31.75–35.9 s
- The high aerial over the river comes down onto frame 0's camera, with the camera's velocity carried through the loop point.
- The question stays in the captions. There are no added graphics.

## 9. Sound (`tools/make_audio_v7.py`, cues `audio/cues_v7.json`)
- **Unchanged:** the narration and the score. The voice stem correlates 1.0 with the locked narration.
- **Effects, re-cued to the V7 picture:**
  - the skin opening, the motor whine and the air through the duct;
  - the grass rustle;
  - the jet test, with the fire put out;
  - the redesign part by part: five jet clunks, the plank, the deck seating, ten unit clicks, the spin-up and the lift-off;
  - the coach beat, now without cut whooshes;
  - the climb and the canyon gust.
- **Levels:** −14.0 LUFS integrated, sample peak −2.5 dBFS, voice 15.3 dB above everything else in the speech band.
