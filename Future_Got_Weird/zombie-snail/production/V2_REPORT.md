# Zombie Snail V2: visual and retention upgrade — report and QC

**Deliverable.** `exports/FGW_Zombie_Snail_V2_1080x1920.mp4`

- **Video:** H.264, 1080 × 1920, 30 fps, 746 frames, 24.875 s, CRF 16.
- **Audio:** AAC 320 kb/s, 48 kHz stereo.

**Baseline.** V1 at commit `902b269`. V1's export is kept.

**Unchanged:**
- **Narration:** the approved words; the same ElevenLabs master, untouched.
- **Word timings and caption text:** unchanged. The caption positions changed.
- **Style:** the Weird Crew-compatible 2.5D vector style.

**Status.** Release candidate. I have not marked it final, for one reason: nobody has watched it in real time or listened to it. This environment has no display or speakers. Every other gate below passed on the file.

## What changed (V1 → V2)

| Time | V1 | V2 |
|---|---|---|
| 0–0.5 | A normal snail head; the stalk starts swelling | **Frame 1 is already startling.** It is an extreme close-up of a swollen, bright green striped eyestalk with its eye at the top. A contraction bulge travels up it, pushing it sideways. |
| 0.5–2.05 | Slow drift | **One continuous pull-back**, from the stalk to the whole snail on the leaf. It lands on "snail" (1.68 s). |
| 2.05–3.1 | Bird shadow, push-in | Push-in; the stalks writhe and distort harder on "it can turn its eyes". |
| 3.1–4.55 | Dive into a flat larvae pattern | **Lengthwise anatomical cutaway** of the eyestalk, opening from the tip down. It shows the cut skin, the lime sac wall, the larvae packed in rows and shuffling up with each contraction, the retractor muscle, and the eye at the tip. Lands on "moving bait". |
| 4.55–6.6 | An egg eaten; a glassy whole body | The camera tilts down the stalk into a **cutaway of the body** with an organic cut edge and dark wet tissue: muscle fibres, digestive gland, gut. It pans back to the visceral mass, where the green sporocyst trunk grows forward through the body, branching, with germ balls flowing toward the head ("The worm grows through its body"). |
| 6.6–7.85 | Stalks fill inside an x-ray | Back up into the stalk ("fills its eyestalks"). Material pumps in, the sac swells and stretches the tentacle, and the larvae **mature on screen** from pale germ balls to orange-brown larvae with suckers. |
| 7.85–9.55 | A hold on the stalks | The skin closes. Outside, both stalks pulse and distort, colourful ("pulsing, colorful sacs"), and the snail starts to move. |
| 9.55–12.5 | A rack focus to a caterpillar | **One continuous pull-out** from the stalks to the forest while the snail climbs the leaf into the sun. The caterpillar on the twig above pulses in the same rhythm (on "caterpillars"). |
| 12.5–15.2 | The bird lands | The snail is exposed in a sun patch. The thrush lands beside it (spread wing folding) and turns one eye on it. |
| 15.2–17.0 | Peck | Eye close-up with a blink and a head tilt. Then a **fast strike (0.2 s)**: the body pivots on the toes (the feet stay on the twig), the neck is never stretched, the beak closes on the stalk at 16.75 s, and the sac tears away. The snail recoils and pulls its tentacles in. |
| 17.0–19.3 | X-ray of a small bird | The head tosses and the bird swallows. The camera **follows the sac into the bird**, from the gullet into the gut with dark tissue, the gut squeezing round the sac as it passes. |
| 19.3–21.3 | Simple flukes | Reproductive stage in the cloaca: the sac bursts, the larvae become adult flukes whose **uteri fill with eggs** (on "eggs", 20.4 s), and the eggs stream toward the vent. |
| 21.3–22.45 | Dropping falls | Out through the vent: the bird on a branch above the starting spot. The dropping falls onto the leaf. |
| 22.45–24.87 | A push into snail A | **Another snail arrives and touches the dropping** (on "infect"). The camera approaches its eyestalk, which blooms green and striped as "snail" ends, landing on **exactly frame 0**. |

## Style

**Changed:**
- Darker, deeper forest: near-black lows and warm sun highlights.
- A global contrast/saturation grade and a stronger vignette.
- Crisper sac rings, with less blur.
- Dark wet tissue behind the anatomy, so the green parasite pops.
- A natural thrush eye: smaller, a thin pale ring, a dim highlight, and no brow or "smile" strokes.

**Kept:**
- Vector artwork.
- The depth-of-field layers.

**Not used:** 3D rigs, radial diagrams, labels or badges, cuts, or whip pans.

**Bird consistency:**
- Scale is fixed at 0.72 throughout.
- On the perch, the feet are the pivot.
- The head moves within a few millimetres of rest, so the neck never stretches.
- Between perch 1 (beside the exposed snail) and perch 2 (above the starting spot), the bird changes place only while the camera is fully inside its gut (18.2–21.25 s).

## Measured QC (final file)

| Check | Result |
|---|---|
| Decode | 0 errors |
| Black frames / frozen stretches | none / none |
| Loudness | −13.4 LUFS integrated, true peak −1.6 dBFS; voice −16.5 LUFS. Effects peak 14.6 dB below the voice |
| Narration on the final track | Zipformer and Whisper: only spelling differences ("eye stalks", "sacks"). `qa/v2/final_asr.json` |
| Frame-to-frame change | median 6.9 (V1 3.4: the film now changes far more often), 95th percentile 23.7 |
| Largest steps | 4.77–4.93 s, where the tilt down the stalk meets the body cutaway opening. It is the fastest moment; it is a move, not a cut. |
| **Loop seam** (caption-free render, last frame vs first) | **6.25**, within the film's own frame steps at the ends (5.7 at the start, 7.6 at the end). `qa/v2/loop_last_vs_first_clean.png` |

## The four sections the brief asked to review

1. **0–3 s** (`qa/v2/review_0-3s.png`):
   - Frame 0 reads instantly as an eyestalk with a striped parasite: rings, black flecks and the eye.
   - The bulge visibly travels and kinks the stalk within the first 0.5 s.
   - The pull-back is continuous and the whole snail is revealed by about 1.7 s.
2. **8–13 s** (`qa/v2/review_8-13s.png`):
   - Stalks pulsing outside.
   - A continuous pull-out while the snail climbs into the light.
   - The caterpillar appears on "tiny caterpillars" and pulses in the same rhythm.
   - The exposed snail sits in the sun patch.
3. **Bird attack** (`qa/v2/review_bird_attack_15.2-17.7s.png`):
   - Look and blink, then a 0.2 s strike pivoting on the feet.
   - The beak meets the stalk and the sac comes away in the beak.
   - The head tosses back with the sac.
   - No deformation, floating or change of proportions.
4. **Final loop** (`qa/v2/review_loop_21.7-24.83s.png`):
   - The dropping lands, the second snail touches it, and the camera approaches its stalk.
   - The stalk blooms on "snail".
   - The last frame matches the first.

Also: `review_cutaways_3-8s.png`, `review_inside_bird_17.7-21.5s.png`, `overview_every_second.png`.

## Science

*Leucochloridium paradoxum* in an amber snail. The life cycle shown is accurate:

1. The sporocyst grows through the snail and sends broodsacs into the tentacles, where larvae (metacercariae) develop.
2. Infected snails spend more time in exposed, bright places.
3. Birds pluck the pulsing tentacle; the snail survives.
4. Adult flukes live in the bird's cloaca/rectum, and their eggs leave in the droppings.
5. Snails eat the eggs.

**Liberties:**
- **Timing:**
  - The snail climbs faster than real time (about 5 mm/s over 4.6 s).
  - Growth and maturation are compressed.
  - The sac reaches the cloaca in about 1.7 s.
  - The dropping falls in slow motion.
- **Size:** the larvae, eggs and flukes are drawn larger than life so they can be read.
- **Simplification:** the bird's organs are simplified.

## Known limits

1. **Not watched in real time or listened to.** This is the one remaining gate before marking it final.
2. **Bird detail:** the bird is still the flattest-looking element (smooth vector feathers with light texture), though its face is now natural.
3. **Fastest moment:** the tilt from the stalk cutaway into the body at about 4.8 s. If it feels quick on a phone, give it 0.2 s more (one key in `story.ts`).
4. **Captions:** they follow the channel treatment. A clean version renders with `--props='{"captions":false}'`.

## Rebuild

1. Rebuild the cues and the mix:

        source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=/tmp/ec.cjs && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
        python3 tools/make_audio.py mix_v2

2. Render the master:

        (cd source && npx remotion render src/index.ts ZombieSnailV2 ../exports/FGW_Zombie_Snail_V2_1080x1920.mp4 --props='{"audio":"mix_v2","captions":true}' --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
