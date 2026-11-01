# This Time Machine Actually Works: V1 review report

**File.** `exports/FGW_TimeMachine_V1_REVIEW_1080x1920.mp4`. **Status: V1 for review. It is not final and not
publish-ready.** Measured facts are in `qa/v1/render_qa.json`, `qa/v1/final_asr.json` and
`audio/mix/mix_measure_mix_v1.json`. The contact sheets are in `qa/v1/`.

## What was built

- **Narration.** The locked script, word for word, from the channel narrator voice (ElevenLabs `eleven_v4`, one run of
  two takes, take 2 chosen). Only the sentence gaps were lengthened (2.1 s added) to fit a 23.5 s film. See
  `audio/narration/voice_provenance.json`.
- **Hook (0–1.75 s).** Frame 0 is already mid-change. The friend's temples are greying, the first lines are in, towers
  are rising behind him and the sun is racing overhead, leaving day-arcs. He ages continuously to elderly by 1.3 s. The
  greying, the receding hairline, wrinkles drawing in, the jowls, the drooping lids, the stoop and the cardigan are all
  continuous functions of one age value: no model swap. The astronaut never changes. He reaches out in shock, and the
  camera pushes toward his face (the friend finishes ageing at the frame edge), then into the black hole reflected in
  his visor.
- **Black hole (1.75–4.95 s, 18.85–20.95 s).** Ray-traced in the Schwarzschild metric (`tools/blackhole.py`) and
  posterised into palette bands. You see the lensed disk over and under the shadow, the photon ring, lensed star arcs,
  a Doppler-bright approaching side and Keplerian rotation, drawn on twos. The ship crosses in front on an inclined
  orbit at about 13.5 M, well outside the photon sphere (3 M), and never enters the hole.
- **Clock (4.95–7.0 s).** His wristwatch's seconds hand sweeps at the real rate, 6°/s, with mechanical ticking at
  4 beats a second. His own clock is never sped up or slowed down. The Earth sub-dial becomes Earth: it spins faster
  and faster, and city lights spread decade by decade.
- **Years (8.75–11.0 s).** The same street, locked off. The sapling becomes a huge tree, the car becomes a hover car,
  towers rise, the family home next door goes quiet (blinds drawn, ivy) and sun trails stack up. The friend goes from
  young to middle-aged to elderly in one continuous change.
- **Return (11.0–15.25 s).** A tilt up to the capsule, which descends and lands. He steps out, and the old friend
  recognises him, held about half a second. He runs to his own door, and the camera pushes past him into the doorway.
- **Family (15.25–17.9 s).** The photographs across the decades: the day he left, then 20 years on, then 40 years on
  (his father no longer in them), ending on the memorial portrait of his mother, with a candle and flowers. The effects
  drop to about −60 LUFS here and the music thins.
- **Explanation (17.45–20.95 s).** A push to his face, then into his eye: the pupil becomes the black hole's shadow (an
  exact scale match). A pull back to wide space. Photons from distant Earth trace bending paths around the hole,
  computed from the real null-geodesic equation (one is captured). His watch beside the ship ticks normally, while an
  Earth clock spins too fast to see.
- **Loop (20.95–23.53 s).** The floating watch matches his real watch, and the camera pulls back to his unchanged young
  hand. He looks up, the black hole appears in his visor, and the camera pushes in until it fills the frame. Then it
  pulls back out of the same reflection on the street, to the opening two-shot, with the friend young and starting to
  age. The last frame continues into frame 0. The time-warp sound runs across the seam.

## Measured checks (V1 render)

See `qa/v1/render_qa.json` (filled in from the final measurement below).

RESULTS_PLACEHOLDER

## Fixed during V1 review

- Frame 0 did not read as ageing at first (the friend looked young). He now starts further along (age 0.42), the
  temples grey first, both characters are already reacting, and a racing sun with day-arcs signals time-lapse.
- The ray-traced image's edge showed when pulling back and inside the visor reflection. A wide-field render of the same
  sky now sits under the sharp one.
- A batch of black-hole frames was rendered on odd frame numbers (the film reads even ones). It was re-rendered.
- **Single-frame dropouts.** The first full render had three frames (18.93 s, 22.80 s, 22.87 s) where the black-hole
  image had not painted: SVG `<image>` is not covered by Remotion's render wait. Each frame now loads and decodes its
  images before capture. `tools/qa_render.py` gained a calibrated one-frame-glitch detector that catches them.
- Camera spline overshoot made small zoom reversals at four keys; those keys are now stops.
- The cloud pass was close to a white flash; the cover is now brief and partial.
- The light-bending view was cluttered; it now shows six photons drawing their own trails.

## Known limitations (for the next pass)

- **Listening.** No real-time listening was possible in this environment. The narration and mix were checked by ASR,
  loudness and level measurement only.
- **The two clocks.** The explanation's clocks float beside the ship and Earth. They are drawn as physical objects, not
  labels, but the view still reads somewhat like a diagram.
- **Hands.** The crew's mitt hands make "he looks at his unchanged hand" less explicit than a five-finger hand would.
- **Black-hole sharpness.** At the deepest point of the eye push, the image is enlarged about 2.5× and is slightly
  soft for a few frames.
- **Capsule exit.** The astronaut steps out from behind the capsule, not visibly through the hatch.
- **Captions.** They sit low over bodies and pavement, clear of faces; the final caption hides at 22.61 s and the first
  appears at frame 0, so a caption pops in at the loop seam.
