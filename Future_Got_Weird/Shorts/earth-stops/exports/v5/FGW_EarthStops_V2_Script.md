# Earth Stops. You Don't. — script (V2, as built)

**Status: V2 review cut, 25.3 s, built and exported (`exports/v5/`). Not published.** This is the script as it is in the film. V1 (34.5 s, `701648d`) is preserved: `script/history/SCRIPT_V1_701648d.md`. V2 follows the owner's single V2 brief: the physical event leads, the explanation follows it, the sea is the main escalation, the latitude beat is one short move, the coffee ends the film. **The bus, the long "None of this can really happen" scene, the Category 5 comparison and the 40°/80° chart are gone.**

Narration: ElevenLabs **Test Voice** (`kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, account defaults, no tags), one generation of the whole text (2 variations; **take B** used, **unmodified**: no trim, no stretch, no pitch change). Scribe returned the sent text word-for-word (68 words). Times below are Scribe word starts / speech groups of the take. **Nobody has listened to it.**

## Narration (spoken text only) and where it sits
| # | Line (verbatim) | Speech (s) | Visual job | Ledger |
|---|---|---|---|---|
| S1 | What if Earth stopped—right now? | 0.02–2.11 (dash pause 1.17–1.56) | The event is already underway at frame 0 (she is mid-lunge, coffee leaving the mug); the inset globe stops dead at 0.1 s; the premise is explicit | C00 |
| S2 | At the equator, you’re already moving about a thousand miles an hour. | 2.67–6.01 | After one "BEFORE" rewind she walks calmly; `EQUATOR` on the word, an east arrow on "moving", the stable `~1,000 MPH` plate on "thousand" | C01, C02 |
| S3 | You don’t feel it because you, the ground, and the air move together. | 6.46–10.15 | Shared motion once: the cup stays level (`NO SLOSH`), then one equal east arrow lands on her ("you"), the ground ("the ground") and a pigeon hovering in the air ("the air") | C03 |
| S4 | Stop the ground suddenly, and loose objects initially keep moving east. | 10.62–14.45 | Whip pan to the plaza; on "Stop" the inset globe stops; a chair tips, a box tumbles, the bicycle rolls through; `GROUND 0 MPH` on the curb (short leader), `LOOSE →` on the bicycle | C04 |
| S5 | The air keeps going too. And so does the ocean. | 14.88–17.35 | The coast: wind first (palms, flag, litter, a pigeon), then the sea surges east past the pier posts, up the wall and over the promenade and bursts into spray | C05 |
| S6 | Closer to the poles, that starting speed is lower. | 17.85–20.44 | One camera move on a tilted globe from a long trail at the equator to a short trail near the pole (`EQUATOR`, `NEAR A POLE`) | C06 |
| S7 | The stop is imaginary. The motion is real. | 20.87–23.98 | Calm close-up of her walking with the coffee while the world streaks past; one annotation (`EQUATOR ~1,000 MPH`); she sips on "real" and nothing spills | C07, C08 |

68 words, 24.24 s of audio; the film runs 25.33 s (1.35 s after the last word for the sip to settle). Pauses between sentences (0.33–0.56 s) are the voice's own.

## What changed from V1 (`script/history/SCRIPT_V1_701648d.md`)
- **Picture leads.** V1 began with a calm walk and a globe; V2 frame 0 is the event.
- **S2 now qualifies the place in speech** ("At the equator,") and makes the speed personal ("you're already moving").
- **S3 explains shared motion once**, tied to the words "you, the ground, and the air"; the icon globe, `ALL MOVING EAST — TOGETHER`, the cat and the six arrows are gone.
- **S4 is "suddenly … initially"**: the qualification is in the words; fixed things are no longer labelled `FIXED` (bolted things are not guaranteed safe).
- **S5 is shorter and the sea gets the time**: "At first" is dropped from the line (S4 already says "initially").
- **S6 is one phrase and one move**; the 40°/80° bars, 181 mph, 157 mph and Category 5 are removed.
- **S7 is the whole ending**: "The stop is imaginary. The motion is real." replaces the 10-second disclaimer + callback; the coffee image is the joke.

## On-screen text (every string)
`WHAT IF` (compact, whole film) · captions (18 cues) · `0 MPH`, `~1,000 MPH →`, `BEFORE` (hook) · `EQUATOR`, `~1,000 MPH` plate (hook) · `NO SLOSH` (B02) · `GROUND 0 MPH`, `LOOSE →` (B03) · `EQUATOR`, `NEAR A POLE` (B05) · `EQUATOR ~1,000 MPH →` (B06). No source footer; sources go in the pinned description (draft in `STORYBOARD.md`).

## Captions
Montserrat ExtraBold 800, 68 px, cream with a 15 px ink outline, one coral emphasis word per cue, replaced (not faded), two lines at most, lane y ≈ 430–600, centred. 18 cues built from the word times (`source/src/film2/timeline.ts`); every cue starts within 120 ms of its first word (the first cue starts on frame 0). SRT: `exports/v5/FGW_EarthStops_V2_Captions.srt`. Timing check: `qa/v5/CAPTION_SYNC.json`.

## Sound (physical, with a job for every event)
`audio/v5/v2/SFX_LOG.csv` lists every event with its job. Surface stop (mid body + sub), shoe contact and release, coffee stream and droplets, bicycle mechanics, loose-object impacts, wind and foliage, sea mass and contact, the spray, the whirr of the two markers (pitch falls with speed), the sip and the mug ticks. **ElevenLabs Sound Effects** supplied eight one-shots (2 variations each, 16 generations: `audio/v5/sfx_gen/`), layered with procedural Foley; picks and alternatives are in `audio/v5/sfx_gen/` with an audition reel. A restrained, melody-free tension swell (original synthesis) is a **separate stem** under the end of S4–S5; `mix_v2_nomusic` is the same mix without it. No licensed music was added. Every mix is measured against the voice and is unlistened.
