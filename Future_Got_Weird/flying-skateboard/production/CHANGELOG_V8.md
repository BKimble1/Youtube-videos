# Flying Skateboard V8: changelog (tighter edit of V7)

| | V7 | V8 |
|---|---|---|
| Runtime | 35.90 s (1077 frames) | **31.80 s (954 frames)** at 30 fps |
| Speech starts | 0.13 s | 0.04 s |
| After the last word | 1.74 s | 0.37 s, then the loop |
| Picture cuts | 11 | 11 |

The composition is `FlyingSkateboardV8` (`source/src/v8/`, time base `v8/time8.ts` on `source/src/data/timeline_v8.json`). V7 is untouched.

## 1. Narration: pauses only (`tools/tighten_narration_v8.py`)
- **Untouched:** the approved ElevenLabs take, its words, its speed and its delivery.
  - Every one of the 99 words is **sample-identical** to the V1 recording (checked in the script: largest difference 0.0).
  - Nothing is resampled, sped up, overlapped or re-recorded.
- **How the pauses were cut:**
  - The pauses between phrases are digital silence (about −87 dB, with no breaths in them).
  - Each long pause is cut in the middle of its silent stretch, with 30 ms of silence kept on each side and a 12 ms equal-power crossfade.
  - Word decays and onsets are untouched, and no join can click.
- **Shortened joins** (pause from one word's end to the next word's start, in seconds):

| Join | V7 | V8 |
|---|---|---|
| "RIVER." → "You see" (hook → mechanism) | 0.51 | 0.29 |
| "ground." → "But" (lift → jet prototype) | 0.45 | 0.21 |
| "ENGINES…" → "and caught" (kept as an ellipsis) | 0.44 | 0.26 |
| "FIRE." → "So he switched" | 0.72 | 0.31 |
| "electric." → "Except" | 0.50 | 0.21 |
| "problem." → "The board can't" | 0.46 | 0.21 |
| "itself." → "He has to" | 0.47 | 0.23 |
| "balance." → "And after" (coaching → river flight) | 0.48 | 0.21 |
| "RIVER…" → "and THROUGH" (kept as an ellipsis) | 0.30 | 0.24 |
| "CANYON." → "How much" (a short beat after the reveal) | 0.83 | 0.37 |

- **Unchanged:** every pause of 0.27 s or less ("You see, / ten", "propellers / blast", "downward / lifting", "caught / FIRE", "BODY, / while", "practice, / he actually").
- **The ends:** the leading silence is cut to 40 ms, and the end to 0.37 s after "thing?". That leaves 0.41 s from "thing?" round the loop to "This".
- **Captions and timing:** captions and every narration mark move with the new times. `narration_v8_cuts.json` lists every cut and the old → new map.

## 2. The hook, 0–3.1 s
- **Frame 0:**
  - He is already in flight about 3.6 m over the river. His shadow and the downwash on the water are in frame, so the clearance reads at once.
  - He and the board are about V7's 0.8–1.2 s size (a third of the frame).
- **Forward travel:**
  - He starts just upstream of the gravel bar, so its edge sweeps under him from about 0.25 s, and the stones stream past to 1.3 s.
  - The water texture streams too.
- **One camera move:**
  - A steady lateral track alongside him to about 1 s, then a purposeful widening on "across a RIVER." as he climbs to about 6.7 m.
  - The view opens on the far bank, the bridge and the town.
  - It then sweeps down and under the board into the mechanism, as in V7.
  - V7's sequence of close, rising and side views is gone.
- **Buoys:** the red buoys are removed everywhere.
- **The gust:** moved to 0.9 s and answered by his whole body, as in V7.
- **Downwash on the water:** now drawn as short spray crests (`Wash` `crisp`). In fast flight the old crests became a tangle of long straight lines.

## 3. Retiming
- **The rule:** every scene keys off the V8 narration marks, so transitions, captions and actions move with the voice.
- **Where it needed more than following the marks:**
  - **Jet → electric:** "So he switched" → "one HUGE problem" is now 2.24 s (V7: 2.52). The redesign keeps all its beats (jets out, plank away, deck down, ten units seated, spin-up, lift-off) at the same proportions.
  - **The fire:** it reaches the other engines a little faster, to fit the shorter "FIRE. / So" join.
  - **Balance:** the problem roll and his late catch now start on the cut to the field. They complete before "The board can't…" changes the view.
  - **Ending:** he flies higher under the question and comes down onto frame 0's height. The crane from the high aerial lands on frame 0's framing at the new end.
- **Unchanged from V7:** the balance corrections, the legs and body views, the propulsion cutaway, and the separate river and canyon demonstrations.

## 4. "YOUR PRICE?"
- It appears on "PAY YOU", while the question is still being asked, and stays to the last frame. It is no longer a separate beat after the question.
- It sits under the board. The ending now lands on frame 0's framing, which puts his helmet where V7's line was. Captions are kept clear of it.
- **Captions:** the coach pull-out's caption no longer sits on his helmet.

## 5. Sound (`tools/make_audio_v8.py`, cues `audio/cues_v8.json`)
- **The electric bed:**
  - One continuous, restrained electric-propeller bed (ten detuned motors and a little air, low-passed so it doesn't buzz).
  - Its oscillators run unbroken through the film. Only its level changes, slowly, between places, so it carries across cuts instead of restarting at each shot.
  - Its pitch changes only where the picture shows a change.
- **The jet engine:** only on the prototype (starters, spool-up and roar, recirculation rumble), shut down on "So he switched".
- **Accents (36 one-shots, almost all very quiet):**
  - the skin opening;
  - the duct ticks;
  - the air to the water;
  - the grass;
  - the fire's whoomp and a short crackle, then the hiss as it's put out;
  - the redesign clunks and clicks;
  - the wrist tick and the earbud cue;
  - the gust;
  - the shoreline;
  - the canyon.
- **Removed:** V7's camera-move whooshes.
- **Ducking:**
  - Everything under the voice drops while he speaks, with a fast attack and a 0.7 s release, so nothing swells into the short gaps.
  - Measured: the electric bed is only 0.3 dB louder in the gaps between phrases than under speech. There is no pumping.
- **Levels:**
  - −14.0 LUFS integrated, sample peak −2.3 dBFS.
  - The voice sits 17.4 dB above everything else in the speech band overall, and at least 14 dB in every scene while he speaks. V7: 15.3 dB overall.
  - The jet is 4 dB above the electric bed.
- **Comparison files** (`audio/mix/stems_v8/`, not committed; rebuilt by the script): the voice alone, and the mix with the beds and effects muted (`compare_voice_only.wav`, `compare_no_effects.wav`).
