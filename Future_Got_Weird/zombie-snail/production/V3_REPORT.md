# Zombie Snail V3: final polish — report and frame QC

**Deliverable.** `exports/FGW_Zombie_Snail_V3_FINAL_REVIEW_1080x1920.mp4`

- **Video:** H.264, 1080 × 1920, 30 fps, 746 frames, 24.875 s, CRF 16.
- **Audio:** AAC 320 kb/s, 48 kHz stereo.

**Contact sheet** (0.0, 0.5, 1.0, 2.0, 3.0, 5.0, 8.0, 11.0, 14.0, 17.0, 20.0, 24.0 s): `qa/v3/FGW_Zombie_Snail_V3_contact_sheet.png`

**Baseline.** V2 at commit `9dcb6ba`.

**Unchanged:**
- **Narration:** the approved words, the same ElevenLabs master (not regenerated), the same timings.
- **Style:** the 2D vector / restrained 2.5D style, the palette, the bird design, and the scenes that already worked (the climb and caterpillar rhyme, the gut journey, the flukes and eggs, the dropping, the second snail).

## What changed, and why

| Time | V2 | V3 | Brief point |
|---|---|---|---|
| 0.00–0.35 | Extreme close-up of the stalk only | **A recognisable snail**: the head and both eyestalks, one grotesquely swollen and banded and pulsing, the other still healthy and grey. No pan, no delay. | Hook 0–0.35 |
| 0.35–1.20 | Pull-back | **Push toward the infected stalk.** The bands travel and a bulge distorts it. The healthy stalk stays in view beside it. The head bobs and the lower tentacles twitch with each contraction. | Hook 0.35–1.2 |
| 1.20–3.00 | (cutaway came at 3.1) | **Through the stalk surface.** An oval opening widens into the translucent interior: the larvae shift with the pulses. The camera tilts down the sac to its base, where the **green tube runs into the snail's head and body** (the parasite's physical connection). | Hook 1.2–3 |
| 3.0–4.6 | Cutaway of the stalk | "Into moving bait": the opened stalk pulses beside the healthy one, and the body cutaway shows the trunk feeding it. | Takeover |
| 4.6–6.6 | Pan through the body | The camera travels back to the visceral mass, then **tracks a new branch growing forward toward the healthy stalk** ("grows through its body"). | Takeover: parasite moves toward the stalk |
| 6.6–7.9 | Development in the stalk | **The healthy stalk is taken over on screen.** The branch enters it, its interior fills, and it swells from a thin grey tentacle to a banded sac. | Takeover: stalk expands as it is occupied |
| 7.9–9.6 | Exterior | The skin closes: outside, **both stalks are now enlarged, banded and pulsing**. | Return to exterior |
| 10–13 | Climb, caterpillar | Kept. The snail is exposed in the sun. | Bird 10–13 |
| 12.5–15.3 | Bird lands beside the snail, then waits | The camera pulls back from the exposed snail to **reveal the thrush on a branch above**. It turns an eye on the pulsing stalks and blinks. | Bird notices |
| 15.3–16.3 | Eye close-up | **One fast dive straight down to the snail.** Wings beat, then fold as the toes take the twig. The camera follows smoothly, with no whip. | Bird approaches rapidly |
| 16.5–17.0 | Strike | Strike kept: the body pivots on the toes and the **beak closes on the infected stalk** at 16.75 s ("eats" at 16.62). The sac tears away and the snail recoils. A sharper sound accent was added. | The strongest action beat |
| 17–24.9 | Gut, flukes, eggs, dropping, second snail | Kept. The second snail now blooms **only its near stalk**, so the last frame matches the new first frame (one swollen stalk, one healthy). The landed dropping is already in frame 0, as it is in the last frame. | Life cycle and loop |

**Sound** (`mix_v3`):
- The wet throb on every contraction is kept.
- Added: a soft wet sound through the stalk surface, and a swell and stretch as the second stalk is taken over.
- The landing flutter is replaced by take-off and dive wingbeats, with a twig catch.
- Strike: a sharper beak snap (−14 dB) plus a short low body thump. It is the loudest effect, and still 12.5 dB under the voice peak.
- The forest and inside-body ambience run continuously underneath.

## Measured QC (final file)

| Check | Result |
|---|---|
| Decode | 0 errors |
| Black frames / frozen stretches | none / none |
| Loudness | −13.4 LUFS integrated, −1.6 dBFS true peak; voice −16.4 LUFS. `qa/v3/mix_measure_mix_v3.json` |
| Narration on the final track | Zipformer and Whisper: only spelling differences ("eye stalks", "sacks"). `qa/v3/final_asr.json` |
| **Loop seam** (caption-free render, last frame vs first) | **3.18**, the same as the film's ordinary frame step at the ends (2.90 at the start, 2.98 at the end). `qa/v3/loop_seam_clean.json`, `loop_last_vs_first_clean.png` |
| Frame-to-frame change | median 6.7, 95th percentile 26.0 |
| Largest steps | All at 2.2–2.8 s: the tilt down the cut-open stalk past high-contrast larvae. Checked frame by frame, it is a smooth continuous move; the pixel change comes from the moving texture, not the camera. |

## Frame QC against the brief's ten points

The evidence strips are in `qa/v3/`: hook, takeover, bird, strike (every 3rd frame) and life cycle/loop.

1. **First frame understandable:** yes. A snail's head, one swollen striped eyestalk and one normal one.
2. **Pulsation within the first second:** yes. The bulge travels and distorts the stalk from frame 1, and both the body and the lower tentacles react.
3. **Infection → transformation → attack:** yes. The parasite is shown inside and connected, it grows toward the second stalk, that stalk is taken over, the snail is exposed, the bird notices, dives and strikes.
4. **No repeated shots with the same information:** yes. Every shot adds something: connection, source, growth, takeover, exposure, notice, approach, strike, inside, reproduction, eggs out, the next host.
5. **No jerky camera or unnecessary transitions:** yes. Moves are continuous pushes, tilts and follows; large zooms are anchored on their subject. There are no cuts and no whip pans.
6. **Anatomy:** consistent.
   - The snail keeps its shape and proportions; the stalks stay attached at fixed points.
   - The bird keeps scale 0.72 and pivots on its feet; its neck never stretches.
   - Nothing disappears or intersects in the frames checked.
7. **Narration sync:**
   - "snail" lands on the push into the infected stalk.
   - "moving bait" lands on the pulsing opened stalk.
   - "grows through its body" lands on the branch growing.
   - "fills its eyestalks" lands on the second stalk swelling.
   - "caterpillars" lands on the caterpillar.
   - "wants" lands on the bird noticing.
   - "bird spots one" lands on the dive.
   - "eats it" lands on the strike.
   - "inside the bird" lands on the gullet.
   - "eggs" lands on the egg-filled flukes.
   - "droppings" lands on the dropping falling.
   - "another snail" lands on the second snail and its bloom.
8. **Satisfying attack:** yes. The bird notices, makes one fast dive, then a 0.2 s strike on the infected stalk with a snap. The snail recoils.
9. **Seamless loop:** yes (see the seam measurement above).
10. **Consistent quality:** yes. One style throughout, with the V2 grade.

## Known limits

1. **Not watched in real time or listened to.** This environment has no display or speakers. A phone check is the last step before upload.
2. **One caption overlap:** for about 0.3 s just before the strike (16.0–16.3 s), the "Because when a bird spots one" caption sits over the snail at the bottom of the frame. Moving it is a one-line change in `Captions.tsx`.
3. **Bird detail:** the bird is the most stylised element (smooth vector feathers), though it stays consistent.
4. **Liberties** (as in V2):
   - The snail climbs faster than real time.
   - Growth, maturation and the trip through the gut are compressed.
   - The larvae, eggs and flukes are drawn larger than life.
   - The dropping falls in slow motion.

## Rebuild

1. Rebuild the cues and the mix:

        source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=/tmp/ec.cjs && NODE_PATH=source/node_modules node /tmp/ec.cjs audio/cues.json
        python3 tools/make_audio.py mix_v3

2. Render the master:

        (cd source && npx remotion render src/index.ts ZombieSnailV3 ../exports/FGW_Zombie_Snail_V3_FINAL_REVIEW_1080x1920.mp4 --props='{"audio":"mix_v3","captions":true}' --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k)
