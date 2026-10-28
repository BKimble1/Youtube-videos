# Flying Skateboard V9: changelog (final retention polish of V8)

- **The base:** V8, unchanged except where listed.
  - The same narration file and timing: the approved ElevenLabs take with V8's tightened pauses, every word sample-identical.
  - The same captions and the same 31.80 s (954 frames at 30 fps).
- **The project:** composition `FlyingSkateboardV9` (`source/src/v9/`). It reuses V8's time base, captions and caption placement (`source/src/v8/time8.ts`, `Captions8.tsx`, `capPlace8.ts`).
- **Unchanged:** the mechanism cutaway, the lift, the workshop fire and the redesign.

## 0–3.1 s: the hook
- **Frame 0:**
  - A close, steep view from above and beside him, looking down past the board to the river and the gravel bar about 9 m below.
  - He and the board fill the upper half of the frame.
  - The drop is the first thing seen. V8 was a level view at 3.6 m.
- **Movement:** the gravel bar's edge passes under him from about 0.3 s, and its stones stream past far below.
- **The camera:** it tracks alongside and turns down the river with him still large: the far bank, the bridge and the town come into view by 2 s. V8's widening, in which he shrank to a small figure, is gone.
- **The way out:** then down and under the board into the mechanism, as before.
- **Height:** he flies at about 9 m (the cutaway still drops him toward the water on "blast air downward"). The ending flies at the same height, so the loop matches.

## 14.7–23.1 s: balance and the coach (highest priority)
Each beat now has a different place. V8's views were nearly all from in front of him.

| Line | Action | View |
|---|---|---|
| "one HUGE problem." | The board lifts; the toe-side roll grows by itself; his late catch. | Low behind the tail, looking along the board, so the roll reads directly. He drifts away from the camera. |
| "The board can't balance itself." | The nose dips, then rises past level. | Square to his front, the board in profile (as V8). |
| "He has to control it" | A toe-side roll answered in his legs. | Low and close on the legs (as V8). |
| "with his entire BODY," | A bigger heel-side roll, then a lean that moves the board. | Rises to a raised view from in front of the nose, the other end of the board from the first view. |
| "while an AI voice coach" | He raises the wrist phone; the coach speaks (the waveform), and the earbud cues. | Over his right shoulder, from above: the helmet, the wrist phone, the board and the deck phone, then pushing in on the wrist screen with the earbud beside the helmet. |
| "helps him learn" | The correction: hips over the toes, softer knees. | A cut to his right front, head to feet. |
| "how to balance." | A fresh gust, met at once; he moves off. | A cut to a high tracking view from behind. |

- **Thrust you can see:** the fans' air now shows the thrust difference. The jets on the board's low side lengthen and thicken while he brings it back (`AirJets` `bias`, from the board's roll).
- **The coach move:** the deck-phone close-up, and the crane up through his legs and glove, are removed. That was the awkward overlapping at 20.5–22 s. The helmet check's step there is gone.
- **The AI only coaches.** The rider's body and the board's response do the balancing.

## 23.1–29.0 s: the payoff
- **The river:**
  - He stays the same size in frame (camera 6.8–7.6 m away), with the far bank, the bridge and the town sliding past behind him.
  - The camera rises gently as he climbs over the water.
  - V8's high wide, in which he became a dot, is gone.
- **The canyon:**
  - Close behind him at a constant distance (7.6–8.6 m). It starts low over the gorge's water with the walls towering on both sides and the gorge running on ahead.
  - It rises a little as he flies on.
  - It is still a separate place from the river (a cut).

## 29.0–31.8 s: question and loop
- **The question:** asked over a close, high three-quarter view of him, with the water far below. He is large enough to read at once.
- **The loop:** the camera comes round and down onto frame 0's view and speed. "YOUR PRICE?" is unchanged from V8: under the board, from "PAY YOU" to the last frame.

## Sound (`tools/make_audio_v9.py`, cues `audio/cues_v9.json`)
- **The jet:**
  - It is no longer ducked under speech. In V8 that ducking let it jump up in each short pause: a dip and surge of 15 dB at "So he switched".
  - It now holds one steady level, rises smoothly from ignition, and fades naturally over about a second as "So he switched" begins.
  - The largest 0.1 s level change while it runs is now 5 dB, and that is the rise at ignition. V8: 14.8 dB.
- **Other levels:** the jet is 2 dB lower overall, and the fire's whoomp 3 dB lower.
- **Unchanged:** the electric bed and the accents.
- **Levels:**
  - −14.0 LUFS, sample peak −2.4 dBFS.
  - The voice is 17.9 dB above everything else in the speech band overall, and at least 15.6 dB in every scene (the jet test is the lowest).
  - The electric bed is only 0.3 dB louder in the gaps than under speech.
