# Frozen Frog V4: final pass, shot plan

V3 is the base; its strongest shots are kept. The source is composition `FrozenFrogV4`, mix `mix_v4`. Film: 24.8 s,
744 frames.

## The script approval gate

The approved narration wording is unchanged: the same 67 words in the same order. The proposed alternative hook ("This
frog can freeze solid, stop its own heart, and come back to life.") is **not** in this render. It is waiting for the
creator's approval. If approved, it can be recorded in the same voice and the first 3 seconds re-timed to it.

## Voice

- **The take.** A new ElevenLabs take in the same voice (`kk5XaSLo2XAw0sKM98zU`, eleven_v4), directed for controlled
  amazement, slight eeriness, natural pacing and selective emphasis. To avoid shouting, the emphasis words are written
  in normal case and the exclamation marks as full stops in the TTS prompt only; the subtitles keep the approved text,
  capitals and punctuation.
- **Emphasis**, measured over the median word: "STOPS" +2.7 dB, "dead" −5.6, "freezes" −4.0, "weeks" −3.2. The
  strongest emphasis is on the payoff, "hops away", at about +6 dB.
- **Edits.** The four longest silent gaps were shortened to 0.34 s (0.77 s in all); the words are sample for sample.
  The speech ends at 23.08 s. The film is 0.3 s longer than V3, so the hops keep their pace.
- **Timing.** The V3 picture is keyed to the V1 word times. `source/src/warp.ts` maps V4 time onto that clock through
  25 word anchors with a smooth monotone curve, whose speed stays between 0.77× and 1.32×. So every event lands on the
  new voice:
  - the last heartbeat on "HEART" (1.94 s)
  - the ice lock on "STOPS" (3.06 s)
  - the twitch on "starts" (19.55 s)
  - the first beat on "beating" (19.92 s)
  - hop 1 on "HOPS" (21.50 s), hop 2 on "happened" (22.75 s)

## Picture changes against the brief

| Brief | V4 |
|---|---|
| 0–3 s: an immediate, visible freeze; into the chest as the heart stops; survival foreshadowed; the frog large | Frame 0: the frog large and moving, frost at the frame's edge. The ice wave sweeps it from 0.1 s; it is frozen by about 0.8 s, with the camera already pushing in, and on the heart by 0.93 s. While the heart labours, ice now visibly creeps in round it (V3 held a near-still close-up there). The last beat is on "HEART", then silence, then the lock on "STOPS". As the window widens over the trunk, the liver gives a faint amber stir: the defence is already starting, which foreshadows the survival without a word of introduction. |
| 3–9 s: keep the anatomical progression, compress repeats | Kept from V3, re-timed: one widening over the trunk, then three distinct cell steps (ice forms; water leaves and the cells shrink; a spear dents one cell). |
| 9–14 s: preserve the glucose protection | Preserved: the liver flares, a glow runs down the vein, the camera follows the streaking glucose into the capillary and on to the cell, which fills, rounds out and holds while the ice stops at its membrane. |
| 14–18 s: one continuous seasonal transition | One move replaces V3's sequence of snowy shots. The pull-out from the cell lands wide on the frog in its pocket, with the snowpack's cross-section and the sky. One continuous push follows while the snow piles high, the sun sets, the moon crosses and the sun rises, then the snowpack slumps and melts and the frost on the frog melts. The same push carries into the chest. |
| 18–21 s: a powerful first beat, circulation, out to the frog | Kept from V3: the frosted heart until the beat, then a 1.9× squeeze with a shockwave, the ice blown out, the colour flooding back, a camera punch and the loudest beat of the film. Red pulses race along the arteries; out to the whole frog as the eyes open, the pupils widen and the legs stretch. |
| 21–24.8 s: a real hop and a seamless loop | Two hops. In each push-off the hind legs extend against **planted feet**: the body is carried so the toes stay put, and leaf litter kicks up. The flight runs straight on from where the push left the body (forward only); the legs trail, then tuck, the arms reach; the landing is absorbed in a crouch, with another leaf kick. Hop 2 lands in the opening's spot. The camera settles into frame 0's framing as the cutaway reopens on the beat and the cold creeps back in. |
