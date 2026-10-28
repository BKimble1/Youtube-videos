# Flying Skateboard V10: changelog (targeted pacing and animation pass on V9)

| | V9 | V10 |
|---|---|---|
| Runtime | 31.80 s | **31.30 s** (939 frames, 30 fps) |
| Picture cuts | 12 | 13. Most visual development still comes from action inside shots. |

The composition is `FlyingSkateboardV10`, in `source/src/v10/` (time base `v10/time10.ts` on `source/src/data/timeline_v10.json`).

## Narration (`tools/tighten_narration_v10.py`)
- **Untouched:** the same approved ElevenLabs take. All 99 words are in order and sample-identical (checked: 0.0 difference); nothing is sped up or overlapped.
- **What changed:** only silence. Every sentence boundary is now a brisk, natural breath of 0.21–0.24 s (V8/V9: up to 0.32 s), with a 0.27 s beat after "CANYON." before the question. The audio loops 0.3 s after the last word.
- **The 29–31 s target:** the words alone run about 27.5 s, so 31.3 s is as tight as the delivery goes without sounding rushed. Pushing to 29–31 would mean cutting into breaths or speeding the voice, both of which the brief rules out.

## 0–3.0 s: hook
- **One fluid camera move through three views:**
  1. A high, close three-quarter view: him and the board over the water, instantly readable.
  2. Down past the deck's edge to a low angle just under board level, about 1.0–1.4 s: the ten fans from below, and nothing but air between him and the river.
  3. Out and up to a wide tracking view of the crossing, with the bridge and town.
- **Then** down and under the board into the mechanism.
- **The gravel bar** passes beneath him from 0.1 s.

## 3.0–6.8 s: mechanism
- **The sequence:** flight → under the board (the ten fans spinning, counted as their rims light) → into one duct, opened to show its rotor spinning up and the air driven down → following that air down to the river → the board lifting him on the riverside flat.
- **Removed:**
  - the wiring and battery layout (it was speculative);
  - the "ILLUSTRATIVE CUTAWAY" tag, because the brief rules out labels. The one opened duct shows a generic fan rotor and motor; it remains illustrative.

## 8.3–14.6 s: failure and the switch
- **The escalation:**
  1. The prototype fires up: starters, bright exhaust onto the floor, hot air drawn back to the intakes, the casings overheating.
  2. The unstable engine: two backfire spurts of flame from the centre nozzle, with a flash and a surge of exhaust.
  3. FIRE round the engines.
  4. Smoke and scorched components.
- **The switch is a physical match cut:**
  - The camera pushes down into the scorched centre intake.
  - On the matching circle (the same screen place and size) it cuts to an electric fan duct of the new board in the same cradle, its fan spinning up from rest.
  - It pulls back to the whole board, which lifts off the stand.
- **Removed:** V9's jets lifting out, the plank flying off and the deck coming down (floating parts). The board is complete and never changes size.

## 14.6–22.8 s: balance (reworked)
One cause-and-effect sequence, each beat from the view that shows it:

| Line | Action | View |
|---|---|---|
| "one HUGE problem." | The board tips suddenly (about 17° in half a second). His weight lurches toward the low edge (the near-fall), then he hauls his hips back, arms out, and catches it. | Wide, tracking from ahead of the nose: the roll reads as the deck tilting across the frame. |
| "The board can't balance itself." | The nose dips and comes back past level; his whole body works over the deck. | Top-down observation, tracking. |
| "He has to control it" | Feet planted, knees and hips take a roll. | Low close-up on the legs. |
| "with his entire BODY," | A bigger heel-side roll answered by the whole body, then a lean that moves him on. | A cut to a side tracking view. V9's pull-out from the legs to the whole body is removed. |
| "while an AI voice coach" | The wrist phone shows the posture and the coach's voice; the earbud cues. | From above his right shoulder, pushing in. |
| "helps him learn" | The correction: hips over the toes, softer knees. | His right front. |
| "how to balance." | Recovered, he accelerates away in stable, faster flight. | High tracking view from behind. |

- **Thrust:** the fans' air shows the thrust difference. The jets on the low side lengthen while he brings the board back.
- **The AI only coaches.**
- **Checked:** feet planted on every frame (0.00 mm) and no knee bent backward (`dev/footCheck10.ts`).

## 22.8–28.6 s: the earned flight
- **"And after just over":** an early attempt on the field. A wobbly take-off, arms wide, by the shed.
- **"ten days of practice":** the confident take-off on the riverside flat, the camera low beside the board as he accelerates toward the water.
- **The crossing:** he is over the shoreline on "he actually flew". The camera rises to reveal the river below him, then widens to the crossing.
- **The canyon:** a cut on "and THROUGH a CANYON", travelling the same way. Low behind him between walls about 140 m high, rising as he flies on, his size constant.

## 28.6–31.3 s: question and loop
- **Real travel under the question:** he flies in toward a camera standing over the water, growing as he comes. The camera then picks him up and eases from rest into the tracking move that lands on frame 0's view, with the board travelling across the loop point.
- **"YOUR PRICE?":** appears on "PAY YOU", under the board.
- **No end card.**

## Sound (`tools/make_audio_v10.py`)
- **Kept from V9:**
  - one continuous electric-propeller bed whose level moves slowly between places (no on/off at cuts);
  - the jet only in the workshop, steady, fading at "So he switched".
- **The fire:** **one** accent, the whoomp. The crackle and extinguish hiss are removed.
- **New:** two soft pops on the visible backfire.
- **Removed:** the redesign clunks and clicks. The new fans' spin-up is the electric bed coming in at the match cut.
- **Levels:**
  - −14.0 LUFS, sample peak −2.4 dBFS.
  - The voice is 17.8 dB above everything else in the speech band.
  - The electric bed is only 0.3 dB louder in the gaps between phrases than under speech.
