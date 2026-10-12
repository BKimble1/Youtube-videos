# Earth Stops. You Don't. — script (V1, as built)

**Status: V1 review cut, 34.5 s, built and exported (`exports/v4/`). Not published.** This is the script as it is in the film. The earlier proposal (`SCRIPT_PROPOSAL_H1.md`) had a bus analogy; **the bus is removed** (owner direction); air-and-ocean is kept. The hypothetical is explicit: the first words are "What if", a `WHAT IF` tag stays on screen until just after "None of this can really happen" and returns for the loop, and the ending says it again in words.

Narration: ElevenLabs **Test Voice** (`kk5XaSLo2XAw0sKM98zU`, `eleven_v4`), one generation of the whole text (take A of 2), **unmodified** (no trimming, no stretching, no pitch change). Scribe returned the sent text word-for-word (101 words). Times below are measured on the take (Scribe word starts; speech ends from the energy segmentation of the audio). **Nobody has listened to it.**

## Narration (spoken text only) and where it sits

| # | Line (verbatim) | Speech (s) | Scene | Ledger |
|---|---|---|---|---|
| S1 | What if Earth stopped—right now? | 0.04–2.23 (dash pause 1.21–1.56) | B01 hook | C00 |
| S2 | This street was moving east at about a thousand miles an hour. | 2.81–5.68 | B01 hook | C01, C02 |
| S3 | So was everything on it. You can't feel it, because it all moves together. | 6.08–9.90 | B02 | C03 |
| S4 | Stop the ground, and anything that isn't fixed to it keeps going. | 10.36–13.79 | B03 | C04 |
| S5 | At first, the air keeps going. So does the ocean. | 14.38–17.20 | B04 | C05 |
| S6 | Farther from the equator, it's slower—but even at eighty degrees north, it starts at Category five hurricane speed. | 17.66–24.10 | B05 | C06, C07, C13 |
| S7 | None of this can really happen. But the motion is real. At the equator, her coffee's been moving about a thousand miles an hour all along. It just never spilled. | 24.63–33.94 | B06 | C08, C09, C10 |

101 words, 34.16 s of audio; the film runs 34.5 s (the last 0.34 s is the loop transition). Pauses between sentences are the voice's own (0.4–0.6 s), not edited.

## What changed from the proposal
- **Bus (old S4) removed.** New S4 states the principle directly and the picture shows it (a plaza where loose things slide and fixed things don't).
- **Speed qualifications are explicit**: S2's "street" is placed on the equator on screen (`EQUATOR` chip, globe pin, S7 says "At the equator"); S6 says "it starts at" and the chart says `STARTING SPEED ONLY`; the plate reads `~1,000` (not `1,000`); S7 repeats "at the equator". The 80°N speed on screen is 181 mph (computed), compared with the 157 mph Category 5 threshold.
- **Air and ocean escalate** (S5): wind first (palms thrash east, loose things and a pigeon are swept past), then the sea surges east over the beach, the seawall and the promenade and fills the frame.
- **The coffee payoff** (S7): she is shown from the same side view, mug level and calm, while the world streaks past; she sips; nothing spills; the film loops straight back into frame 0 of the hook.

## Scenes (time from the voice; frames at 30 fps)
| Scene | Time (s) | Picture | Transition in |
|---|---|---|---|
| B01 hook | 0.0–6.1 | The H1 hook: globe stops at 0.17 s, street takes over, rewind, `EAST` / `EQUATOR` / `~1,000 MPH` readout | — |
| B02 shared motion | 5.9–10.0 | Inset globe grows (iris) into a turning globe carrying her, a palm, a bicycle, a house, a cat, equal east arrows; zoom into her icon = the real street; `NO SLOSH` lens on the mug; six equal arrows; `ALL MOVING EAST — TOGETHER` | iris out of the hook's inset globe; dive into her icon |
| B03 loose things | 9.7–14.9 | Whip pan east to a plaza; at "Stop" the inset globe stops and every loose thing leaves at the same starting speed (chairs, table, plant pot, box, cone, ball, and the bicycle from the street, which rolls through) while lamp post, palms and the bolted bench do not move; `FIXED` / `LOOSE` chips | whip pan |
| B04 air and ocean | 14.1–18.3 | A coast: calm, then wind (palms, flag, litter, pigeon, streaks), then the sea (boat and buoy ride it) surges east over the beach, wall and promenade; `AT FIRST` chip; arrows shrink; the water rises to fill the frame | push wipe east; sea fills the frame |
| B05 latitude | 18.0–24.9 | The planet from above the North Pole (counter-clockwise = east); rings at their true radii; three arrows and three bars proportional to 1,040 / 798 / 181 mph; the axis is magnified to read 181 against the 157 line; `STARTING SPEED ONLY`; `157 MPH = CATEGORY 5` | the water becomes the teal background |
| B06 payoff | 24.2–34.5 | Still globe, `WHAT IF` peels away, globe turns, she rides it east; dive into her; close-up with the world streaking past; she sips; pull back to the street; the street shrinks and the globe returns: **frame 0 of the hook** | crossfade; dive; pull-back; loop |

## On-screen text (every string)
`WHAT IF` · captions (23 cues, below) · `0 MPH`, `~1,000 MPH →`, `BEFORE`, `EAST`, `EQUATOR`, `~1,000 MPH` (hook) · `NO SLOSH`, `ALL MOVING EAST — TOGETHER` (B02) · `FIXED`, `LOOSE →` (B03) · `AT FIRST`, `FIXED` (B04) · `0° EQUATOR`, `40°`, `80° NORTH`, `1,040 / 798 / 181 MPH`, `STARTING SPEED ONLY`, `157 MPH = CATEGORY 5` (B05) · `~1,000 MPH →`, `EQUATOR` (B06). No source footer; sources go in the pinned description (draft in `STORYBOARD.md`).

## Captions
Montserrat ExtraBold 800, 68 px, cream with a 15 px ink outline, one coral emphasis word per cue, replaced (not faded), lane y ≈ 450–650, centred. 23 cues, built from the word times (`source/src/film/timeline.ts`); every cue starts within 120 ms of its first word except the hook's first cue (it starts at 0.57 s on purpose: the globe has the frame before). Widest line 749 px (limit 960). SRT: `exports/v4/FGW_EarthStops_V1_Captions.srt`. Timing check: `qa/v4/CAPTION_SYNC.json`.

## Sound (physical only)
Procedural numpy Foley (`tools/foley_lib.py`): turning-Earth bed (cut dead with a 100 ms void at the stop, in the hook and again on "Stop" in B03), cardboard slaps for every graphic, furniture/pot/box/cone/ball for B03, wind/fronds/flag/litter/wings for the air, surge/wall slap/foam for the sea, ratchet counters for the bars, footsteps, a sip, ceramic ticks. The new cues were audited (3 candidates each, measured): `audio/v4/audition/`. **No music** (held). ElevenLabs Sound Effects and Eleven Music were **not** run. Mix: −15.8 LUFS, −1.5 dBTP, set relative to the voice; **not listened to**.
