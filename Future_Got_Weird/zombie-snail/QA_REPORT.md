# FGW Short 2: The Zombie Snail Parasite — V1 quality-control report

**Deliverable.** `exports/FGW_Zombie_Snail_V1_1080x1920.mp4`

- **Video:** H.264, 1080 × 1920, 30 fps, 746 frames, 24.875 s, CRF 16, BT.709.
- **Audio:** AAC 320 kb/s, 48 kHz stereo.
- **Narration:** the approved script, word for word. One change was approved before production: "crawls" became "grows" (option A).
- **Captions:** burned in, following the channel's treatment (Nunito Black, key words in yellow). They are also provided as `captions/FGW_Zombie_Snail_V1.srt`.

**Not published.**

**How it was checked.** I checked the video from the file, at three levels:

- Measured passes: decode, black and freeze detection, loudness, frame-to-frame motion, the loop seam, and ASR on the final audio track.
- Contact sheets of single frames, every second and at chosen frames.
- Frame-by-frame strips of every critical beat (every 2nd frame).

**What I could not do.** Nobody has watched it in real time or listened to it, because this environment has no display or speakers. A real-time watch and listen on a phone is the one check still owed.

## Measured checks (final file)

| Check | Result |
|---|---|
| Full decode | 0 errors |
| Black frames (`blackdetect`, 0.03 s) | none |
| Frozen stretches (`freezedetect`, 0.25 s) | none |
| Loudness (`ebur128`) | −13.4 LUFS integrated, LRA 2.2 LU, true peak −1.6 dBFS |
| Voice in the mix | −16.5 LUFS; effects peak 15.6 dB below the voice peak |
| Narration on the final track | Zipformer and Whisper base.en each found only two differences, both spellings: "eye stalks" and "sacks". `qa/v1/final_asr.json` |
| Frame-to-frame change (mean absolute, 270 × 480) | median 3.4, 95th percentile 10.7 |
| Largest steps | All at 4.5–5.1 s: the dive through the sac wall and the pull-out from the egg (a 60× zoom). No cuts anywhere. `qa/v1/motion_measure.json` |
| **Loop seam**, last frame vs first | **3.07**, below the median frame step (3.41). `qa/v1/loop_last_vs_first.png` |
| Opening: change of the eyestalk region vs frame 0 | 2.3 at 0.10 s, 6.1 at 0.30 s, 10.9 at 0.50 s, 13.5 at 0.73 s |

## Timestamped review

| Time | Narration | What is on screen | Check |
|---|---|---|---|
| 0.00–0.30 | "If this parasite…" | Extreme close-up of a normal snail head. The near eyestalk starts swelling from its base on frame 1. | ✔ The swelling is visible by 0.2–0.3 s. `ff_hook_0-1.27s.png` |
| 0.30–0.75 | | Green, dark and cream rings show through the stretched skin. | ✔ The rings are fully readable by about 0.6 s. |
| 0.75–1.30 | | The stalk pulses: a contraction wave runs base to tip, the rings bunch and stretch, the stalk twitches. | ✔ |
| 1.30–2.10 | "…a snail, it can turn…" | The second stalk swells and banding appears. The snail glides forward on pedal waves. Each stalk pulses at its own phase. | ✔ |
| 2.10–3.05 | "…its eyes…" | A soft bird shadow sweeps across with three wingbeats. | ✔ |
| 2.6–4.6 | "into moving bait" | Smooth push-in until the pulsing stalk fills the frame. | ✔ |
| 4.4–5.1 | (pause) | The camera dives through the sac wall into the packed larvae. That dissolves into one fluke egg (lid and larva visible) on a bird dropping. | ✔ This is a dissolve, not a cut. |
| 5.1–5.5 | "The worm grows…" | Pull back: a healthy snail (normal stalks) reaches the dropping and rasps. The egg goes into its mouth. | ✔ The egg is drawn larger, with a glow, so it can be followed (see notes). |
| 5.5–6.8 | "…grows through its body" | The body turns glassy. The egg travels down the gut and hatches. Green sporocyst tubes branch from the gut region toward the head. | ✔ |
| 6.8–7.8 | "…fills its eyestalks…" | The tubes enter both stalks and the banded sacs inflate inside them (near stalk first). | ✔ |
| 7.8–9.6 | "with pulsing, colorful sacs" | Back outside: both stalks swollen, banded and pulsing. | ✔ The sacs stay inside the stalks. Nothing bursts out. |
| 10.0–12.1 | "They start looking like tiny caterpillars" | A real banded caterpillar inches along the twig behind. Focus racks to it, then back to the stalks, which pulse at the same rhythm. Colours intensify. | ✔ The resemblance is shown, with no labels. |
| 12.5–14.8 | "And that's exactly what the parasite wants" | The snail raises its head into a brightening patch of light (infected snails move to exposed spots). The camera pulls back as a songbird lands on the twig beside it, wings spread then folding. | ✔ The landing is checked frame by frame and the wing folds smoothly. `ff_landing_13.33-14.6s.png` |
| 15.2–16.5 | "Because when a bird spots one" | Closer on the bird: it cocks its head, tilts and blinks, with the pulsing stalks below it. | ✔ This builds anticipation; there is no chase. |
| 16.5–17.0 | "and eats it" | One peck: the body leans and the beak closes on the near stalk at 16.78 s. The sac comes away hanging from the beak. A small stub stays on the snail, which flinches and pulls its other tentacles in. | ✔ Brief. The bird takes only the stalk, not the snail. `ff_peck_16.47-17.73s.png` |
| 17.3–19.3 | "the parasite gets inside the bird" | The bird tips its head back and swallows (throat bulge). Its body turns glassy and the sac travels down the gullet past the gizzard to the intestine. | ✔ |
| 19.3–21.3 | "Then its eggs spread…" | Inside the cloaca the sac bursts. The larvae become adult flukes on the gut wall and release a stream of eggs toward the vent ("eggs" at 20.4 s). | ✔ |
| 21.4–22.5 | "…through the bird's droppings" | Pull out to the perched bird. The tail lifts, a dropping falls and the camera follows it down. | ✔ The fall is in slow motion. |
| 22.5–23.3 | "ready to infect…" | It lands softly on a leaf just ahead of another snail, which is crawling toward it. | ✔ |
| 23.3–24.87 | "…another snail" | The camera pushes into that snail's eyestalk and ends on the opening composition. | ✔ The first and last frames match (seam 3.07). `ff_loop_end_23.6-24.83s.png` |

## Brief checklist

- **Opening transformation clear within 0.75 s:** yes. The stalk swells from frame 1 and the rings are readable by about 0.6 s.
- **Pulsating eyestalks stay attached and consistent:** yes. Both stalks grow from fixed points on the head and keep their base-neck, swollen body and blunt tip. A skin collar blends each sac into the head.
- **Snail body doesn't deform or slide unnaturally:** yes. The sole stays on the leaf, the snails glide slowly (0.4 mm/s) with pedal waves, and only the front of the body bends.
- **Bird movement physically convincing:**
  - Landing: wingbeats, then a smooth fold.
  - Head: cock, tilt and blink.
  - Peck: the body leans so the neck stays short.
  - Swallow: the head tips back and the throat bulges.
- **Life cycle understandable without text labels:** yes. The sequence is egg in dropping → snail eats → sporocyst grows → sacs fill the stalks → bird eats a stalk → flukes in the bird → eggs in the dropping → next snail. No labels, arrows or diagrams.
- **Camera movements smooth:** yes. The camera is a dolly with depth layers and C2-smooth easing; large zooms are anchored on their subject. There is no whip and no cut. The fastest motion is the dive and egg pull-out at 4.5–5.1 s, which is a deliberate dissolve.
- **Every narration line has visual proof:** see the table above.
- **Seamless loop:** yes. The landed dropping is already on the leaf in the first frame, so both ends match.
- **Sound:**
  - Quiet forest bed: leaf air, distant birdsong, insects.
  - A faint low drone that thickens slightly under the bird.
  - One soft wet throb per sac contraction, following the pulse strength.
  - Wingbeats for the shadow pass and the landing.
  - A restrained beak tick and soft tear for the peck.
  - A gulp, the muffled inside of the bird, tiny egg bubbles and a soft landing for the dropping.
  - No stingers, and no whooshes on camera moves. The log is in `audio/sfx_log_mix_v1.json`.

## Science notes and liberties

- The parasite is *Leucochloridium paradoxum* in an amber snail (*Succinea*). Birds pluck the pulsing tentacle; the snail survives and can regrow it.
- The adult flukes live in the bird's cloaca/rectum, and their eggs leave in the droppings.
- Infected snails are more often found in exposed, bright spots.
- **Liberties:**
  - The egg, about 25 µm in reality, is drawn larger with a glow from 5.1 s so it can be followed into the mouth. It is true to scale only in the extreme close-up.
  - The eggs, the larvae in the sac and in the bird, and the flukes are simplified.
  - The swallowed sac goes from beak to cloaca in about 1.6 s, and the flukes mature in under 1 s. Both are compressed time.
  - The dropping falls in slow motion.
  - The sac pulses faster than the real one, so the rhythm reads in a Short.

## Known limits and possible next steps

1. Not watched in real time or listened to (see above).
2. The bird is the most stylised element: smooth vector feathers with a light noise texture, rather than the naturalistic skin used on the snail. In the close-ups at 15–17 s its eye-ring and cheek stripe read slightly graphic.
3. The dive through the sac at 4.4–5.0 s is the fastest motion in the film. It is deliberate, but it is the place to slow down if it feels abrupt on a phone.
4. The captions follow the channel treatment. The brief didn't mention them; a clean version (`--props='{"captions":false}'`) can be rendered from the same source.
