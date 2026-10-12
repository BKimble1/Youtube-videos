# Earth Stops. You Don't. — script PROPOSAL (H1, superseded by SCRIPT.md; kept for the record: it still has the bus line)

**Status: proposal. Only lines S1 and S2 have been voiced (Test Voice audition, `audio/v3/voice/`); S3–S7 are text and have not been generated.** The hypothetical is explicit in the picture (the `WHAT IF` tag stays up) and in the last beat. No claim is made that the stop could happen. Claims and sources: `CLAIM_LEDGER.md`, `SOURCES.md`. Pictures: `STORYBOARD.md`. Hook already built: `exports/v3/` (first 6.0 s).

## Narration (spoken text only)

| # | Line | Words | Beat | Ledger | Time (s) |
|---|---|---:|---|---|---|
| S1 | What if Earth stopped—right now? | 6 | B01 hook | C00 | **0.03–2.17 (measured)** |
| S2 | This street was moving east at about a thousand miles an hour. | 12 | B01 → explanation | C01, C02 | **2.74–5.83 (measured)** |
| S3 | So was everything on it. You can't feel it, because it all moves together. | 14 | B02 shared motion | C03 | ≈ 6.3–10.3 |
| S4 | Stop the ground, and it's a bus hitting the brakes. The bus stops. Everything loose doesn't. | 17 | B03 bus | C04 | ≈ 10.8–15.4 |
| S5 | At first, the air keeps going. So does the ocean. | 10 | B04 air and ocean | C05 | ≈ 15.9–18.8 |
| S6 | Farther from the equator, it's slower—but even at eighty degrees north, that's hurricane speed. | 16 | B05 latitude | C06, C07, C13 | ≈ 19.3–23.9 |
| S7 | None of this can really happen. But the motion is real: her coffee's been doing a thousand miles an hour all along. It just never spilled. | 26 | B06 callback | C08, C09, C10 | ≈ 24.4–32.0 |

**98 words; ≈ 32 s.** S1–S2 are measured from the audition take (S1 2.14 s, a 0.36 s dash pause, "right now?" ends 2.17 s, a 0.57 s paragraph pause, S2 3.09 s). S3–S7 are *estimates*: the audition voice read S2 at 3.9 words/s inside the sentence and S1 at 2.8 words/s with its pause, so the estimate uses 3.5 words/s inside sentences plus 0.5 s between sentences; the real take will differ by a second or two either way. The research brief's 28–32 s target is at its upper edge.

**Optional cuts (each is complete without the others):** drop S4 (the bus) → ≈ 27 s; drop S5 (air and ocean) → ≈ 29 s. Optional additions (not in the count): "Gravity still holds you down." (ledger C11), or "Earth really is slowing, by about two milliseconds a century." (C12, adds ≈ 3.5 s).

Voice notes (from the audition, unlistened): Test Voice, `eleven_v4`, no tags; the em dash in S1 and S6 produced a 0.36 s pause in S1, which is where the picture's street goes still. Do not time-stretch.

## On-screen text (every string)

`WHAT IF` (tag, top centre, through B05) · captions of S1–S7 in Montserrat ExtraBold, ≤ 2 lines, one coral emphasis word each (*stopped, now, east, thousand*, …) · `0 MPH`, `~1,000 MPH →` (tags on the lamp post and the bicycle), `BEFORE` (rewind chip), `EQUATOR`, `EAST`, `1,000 MPH` (the readout) · B02 `ALL MOVING EAST — TOGETHER` · B03 `BUS 0 · CUP →` · B05 `0° 1,040 · 40° 800 · 80° 180 MPH`, `157 = CATEGORY 5`, `STARTING SPEED ONLY` · B06 captions only. No source footer in the hook; sources go in the pinned description (draft in `STORYBOARD.md`).

## Captions

Same rules as the hook (Montserrat ExtraBold 800, 68 px, cream with an ink outline, replaced not faded, upper lane y ≈ 500–590, away from the character, the mug and the right-hand rail). One SRT will be generated from the real alignment when the full narration exists.

## Sound plan (physical only; nothing is generated yet)

Procedural Foley as in the hook (`tools/foley_lib.py`): B02 soft cloth/pavement room tone and a steady freewheel, B03 bus brake squeal and a ceramic slide (a different material from the opener), B04 wind pressure on palm fronds and a low water surge, B05 near-silence with a quiet card slap per number, B06 the opening cup tick. **No music** until the owner approves a source (hold). ElevenLabs Sound Effects and Eleven Music were **not** run.
