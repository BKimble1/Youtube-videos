# Earth Stops. You Don't. — script (V3, as built)

**Status: V3 review cut, 24.8 s, built and exported (`exports/v6/`). Not published, not uploaded, not scheduled.** This is the script as it is in the film. V2 (25.33 s, `f6f000b`) and V1 (34.5 s, `701648d`) are preserved: `script/history/SCRIPT_V2_f6f000b.md`, `SCRIPT_V1_701648d.md`.

V3 follows the owner's single V3 brief: a miniature sci-fi disaster movie that explains science. An absurd readable trigger (an oversized brake arrests a spinning Earth) → immediate personal danger → escalating devastation (loose objects, wind, ocean) → one concise explanation → a choreographed replay (the film ends in the opening composition and loops). **The stop is an impossible visual metaphor: nothing in the film claims a brake, or any way of stopping Earth, is feasible; the brake arrests the spin, not the orbit.**

Narration: ElevenLabs **Test Voice** (`kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, account defaults, no tags), **one generation of the whole text** (2 variations; **take B** used). The seven sentences were placed on the film timeline by cutting take B **at its own pauses only** (`tools/build_voice_v3.py`, 6 ms fades at the cuts); silence was added only at four of those cuts to give the picture room (before S4 +0.84 s, before S5 +2.85 s — the ocean beat, before S6 +0.66 s, before S7 +0.35 s); every other pause is the voice's own. No time-stretch, no speed-up, no pitch change, no EQ on the voice. Scribe returned the sent text word-for-word (55 words). **Nobody has listened to the narration.**

## Narration (spoken text only) and where it sits (film time, 30 fps)
| # | Line (verbatim) | Speech (s) | Picture job | Ledger |
|---|---|---|---|---|
| S1 | If Earth stopped, you’d keep moving east—about a thousand miles an hour at the equator. | 0.05–5.0 (words: *stopped* 0.48, *east* 2.00, *thousand* 3.04, *equator* 4.36) | 0–0.67 s: the brake's pads close on the turning Earth and lock on *stopped* (contact frame 14 = 0.47 s); action cut (dive) to the street: she is carried east, feet off the ground, coffee leaving the cup, a lamp post looming; 5-frame suspended beat (1.03–1.20 s); cut to the still street where the loose things stream east; the bicycle hits the lamp post (2.30 s) and a chair hits the palm (2.47 s) in the narration's pause after *east*; `GROUND 0 MPH`, `~1,000 MPH` plate on *thousand*, `EQUATOR` on *equator* | C00–C04 |
| S2 | Loose objects keep going too. | 5.20–6.7 | Wind rising: boxes, chairs, sheets, a bin; the camera starts to ride east with the debris | C04 |
| S3 | So does the air. | 7.12–7.8 | Palms bend flat, flags stream, debris past the lens, foreground posts sweep by; a torn awning crosses the lens (7.47–7.93 s) and the cut hides behind it | C05 |
| S4 | And the ocean. | 9.08–9.74 (picture: 7.93–13.07) | The coast: a swell rises on the horizon and keeps growing, hits the pier (10.60 s), climbs the seawall and floods the foreground (11.20 s), foam-edged water sweeps through the frame (11.8–13.07 s) into the calm | C05 |
| S5 | You don’t feel the spin because you move with Earth. | 13.01–15.24 | The calm "NORMAL DAY": she walks with her coffee and bike on a slab of ground while three equal arrows pop on *you / move / with* (14.33, 14.53, 14.70 s) | C03 |
| S6 | Closer to the poles, that starting speed is lower. | 16.43–19.0 | The camera pulls out onto Earth (15.67–16.53 s); markers with trails: long at the equator, short near a pole; one tilt move (16.93–18.87 s) | C06 |
| S7 | The stop is imaginary. The motion is real. | 19.78–22.73 | The turning Earth, ring growing around its equator (20.13–20.93 s), the brake slides back in (23.27–24.07 s); pads begin to close at 24.2 s (frame 726) and the film loops into frame 0 | C07, C08 |

55 words; speech 0.05–22.73 s of a 24.8 s film (the 2.07 s tail is the loop's closing strain). Threat order is editorial: the film does not say or imply "first this, then this" for physics.

## What changed from V2 (`script/history/SCRIPT_V2_f6f000b.md`)
- **Trigger first and visible.** V2 opened mid-lunge with no cause; V3 frame 0 is the brake closing on a large turning Earth, with contact on the word *stopped*.
- **Danger in the first second.** The woman is carried east and a lamp post looms by 1.0 s; her fate is deliberately left unresolved (the collision is never shown); she reappears only in the clearly separate "NORMAL DAY" stage.
- **Escalation from the start**: loose objects 1.2–5 s, wind 3.3–7.9 s, the ocean 7.9–13 s (V2 reached wind at 15 s of 25).
- **The ocean is the biggest beat** (scale grows before it hits; overtops the foreground; hides the skyline) and the transition is physical (a foam-edged water band, not a bubble circle).
- **The explanation comes after the consequences**, once, as one demonstration (the NORMAL DAY slab) and one globe comparison.
- **The ending loops**: same Earth, same brake, same camera; the rotation continues through *The stop is imaginary. The motion is real.*; the pads begin to close at the very end; no reset gag, no end screen.
- **Words**: 55 (V2 68). "At the equator" moved to the end of the first sentence with the number; "Loose objects keep going too." / "So does the air." / "And the ocean." are three separate beats; "suddenly… initially" is carried by the picture (the first instant) and the ledger.

## On-screen text (every string)
`WHAT IF` (compact, whole film) · captions (14 cues) · `GROUND 0 MPH`, `EQUATOR`, `~1,000 MPH →` plate (street) · `NORMAL DAY` (stage) · `EQUATOR`, `NEAR A POLE` (globe). No numbers other than the equator plate. No source footer; sources go in the pinned description.

## Captions
Montserrat ExtraBold, cream with ink outline, one coral emphasis word per cue, replaced (not faded), two lines at most, centred in the upper-middle lane (per-cue vertical offset keeps faces, the brake, the wave crest and props clear). 14 cues from the word times (`source/src/film3/timeline3.ts`); SRT `exports/v6/FGW_EarthStops_V3_Captions.srt` (no overlapping cues, single spaces). Timing check: `qa/v6/CAPTION_SYNC.json`.

## Sound (physical, with a job for every event)
`audio/v6/v3/SFX_LOG.csv` lists every event with its job. Brake: pad-approach strain rising with the closing speed (split at the loop seam so frame 0 continues it), rotation hum, a lock clack (generated) on contact, then the hum is cut dead; street: air rush, shoe chirp, coffee stream, bicycle–lamp clang, lamp ring, chair–palm thwack, box/bin/pot clatter; wind and debris passes; awning snap; coast swell, pier creak (generated), planks, wave hit, flood, spray; calm: soft footsteps, small pops, whirr of the two markers (pitch falls with speed), ring bloom, caliper glide and clunk. Controlled silences in the supporting layer: the 5-frame suspended beat and the 12 frames before the wave hits. Reused V2 generated one-shots plus **five new ElevenLabs one-shots** (`audio/v6/sfx_gen/`). A restrained, melody-free tension swell (original synthesis) is a **separate stem**; `mix_v3_nomusic` is the same mix without it. No licensed music. Every level is a measured design target; **nobody has listened to any mix**.
