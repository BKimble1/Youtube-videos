# Laser Voices: Rebuild V2 shot plan

## The world

There is one world, in metres (`source/src/c2/world.ts`), and every room shot is a camera in it.
- The listener stands on her mark at (1.22, 0, 4.0), facing the front of the room.
- Her left ear points at the emitter, whose lens is 2.44 m (8 ft) away along the same line.
- The operator stands at the emitter's control end.
- The passerby starts beside the listener.

The performance (`story.ts`) is a function of the narration clock. Shots (`shots.ts`) only choose cameras, so nobody
moves between cuts. The beam's end is computed every frame:
- normally it is her ear;
- otherwise it is the near side of the passerby's head, wherever his head intersects the beam line.

That geometry gives the block on frames **786–956**: "the voice suddenly stops" at 26.39 s, and the voice returns on
"move" at 31.90 s. The audio cue file is exported from the same functions.

## Shots

| # | Time (s) | Narration | Shot | What happens |
|---|---|---|---|---|
| 1 | 0.00–1.00 | "If someone pointed this laser" | **CU her**, front-left (camera A) | Already reacting: the eyes snap toward the voice, then the head turns after them (anticipation dip, overshoot, settle). The faint beam enters her ear from frame right. The passerby behind her has noticed nothing. |
| 2 | 1.00–2.75 | "at you, you could hear a voice" | **Low, beside the emitter** | The lens and the operator's hand on the dial, the lane running away to her. She cups her ear toward it. |
| 3 | 2.75–4.95 | "that nobody beside you hears" | **Front two-shot** (slow push) | She turns to him with an open palm ("do you hear that?"). He sips his coffee, glances up and shrugs, then goes back to the phone. |
| 4 | 4.95–6.00 | "and you wouldn't need anything in your ears" | **CU her** | She taps her bare ear twice, with a wink. |
| 5 | 6.00–8.90 | "ears. The beam is invisible." | **Her left ear** (continuous push) | She turns the ear to the light and lowers her hand: no earbud. The faint beam fades out on "invisible". The push carries on into the canal. |
| 6 | 8.90–15.00 | "But when water vapor… sound waves." | **Molecular cutaway** (entered from the push) | Vapor: water molecules pop in on "water vapor". Absorption: light packets arrive, and each struck molecule flashes. Heating: they turn warm and shake. Expansion: the pocket swells and shoves the air outward. Waves: repeated crowded bands travel out. The camera follows them down the canal; the eardrum moves, then the bones and the cochlea. |
| 7 | 15.00–17.80 | "Now sweeping that beam at exactly the right speed" | **Whip** from beside her ear back up the beam to the **emitter close-up** | The hood swings open on the optical train. On "sweeping" the operator turns the dial, the prism spins up and the beam leaving the lens sweeps. The hood closes. |
| 8 | 17.80–20.00 | "concentrates the sound where you're standing" | **Behind the emitter, down the beam** (push) | The sweeping fan converges on her ear and sound rings gather there. On "standing" she looks down at her mark, then up, delighted. The passerby beside her is unaffected. |
| 9 | 20.00–21.55 | "Scientists actually demonstrated this" | **Medium, the operator** (3/4 front) | She raises the mic in a cheer. |
| 10 | 21.55–23.30 | "from eight feet away" | **High wide on the lane** (slow dolly) | The foot ticks light one by one from the lens to her mark. The passerby has wandered to the back of the room. |
| 11 | 23.30–26.75 | "But if someone walks between you and the laser" | **Tracking medium on him**, easing back to a 3/4 wide | He comes round from the back of the room, eyes on his phone, and walks down to the lane. By the block, all three marks read: her (left), him (centre), emitter (right). The beam stops at his head, and its packets stop there. |
| 12 | 26.75–27.90 | "the voice suddenly stops" | **CU her** (camera A, pushing) | The smile drops and the eyes snap open. She taps her ear and her eyes dart. |
| 13 | 27.90–30.70 | "They can't hear your message. They're blocking it." | **Behind the emitter, past his shoulder** | The beam ends on the side of his head, with her beyond him pointing at him, cross. The operator leans and waves. He looks up, startled. |
| 14 | 30.70–32.00 | "And the second they move" | **Front medium** | He raises the phone in apology and steps forward out of the lane. The beam reconnects to her ear (frame 957). |
| 15 | 32.00–34.07 | "you hear it again." | **CU her** (camera A) | Delight. She settles into exactly the opening pose. At the loop point the same `hookP` performance runs on into frame 0. |

## Transitions

- Cuts are on action or on the word.
- Shot 5 into 6 is one continuous push: the camera keeps moving into her ear canal, and the molecular drawing grows
  from the canal mouth over 0.55 s.
- Shot 6 into 7 is a whip back up the beam.
- Shot 11 is one camera that tracks and then widens.
- The loop: frame 1021 and frame 0 are the same camera and the same continuous performance. The passerby has walked
  out of frame by then, and the beam's drawn path fades back to its faint opening level.
