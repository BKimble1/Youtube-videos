# Short: "Tesla Just Made the Roadster Fly" (42.1 s, 9:16)

**Narration:** ElevenLabs Test Voice (`kk5XaSLo2XAw0sKM98zU`, model `eleven_v4`, flow `8baHNxGa4ViVC2FKXh4s`).
**Selected take:** `audio/short/takes/short_t4_KPLc.mp3` (generation `KPLcYkFqAPKyhZ70hjOg`), 41.72 s, 111 words, about
160 wpm overall and about 180 wpm within phrases. Takes 1–3 are kept as alternates. The opening line was tested on its
own first (`hooktest_t*.mp3`: 2.3–2.4 s each, about 180 wpm).

**Why take 4.** All four takes match the script, but only by forced alignment (see QA). They also have nearly
identical pacing (41.2–41.9 s). Take 4 has the shortest "FLY." tail (hook done by 2.28 s) and the longest beat before
"The flying commute?" (0.82 s), so the last line lands on its own. **Nobody has listened to it**: this environment
has no audio playback. The owner should listen once before upload.

## Final narration (as generated; direction tags in brackets are not spoken)

> [curious] [surprised] Tesla just made its Roadster FLY. [curious] It drove up a curved ramp until it hung upside
> down… then launched off, rolled itself upright in midair, and landed. Tesla says fans pull air from under the car,
> pinning it to the ramp. In the air, jets of compressed gas help control the roll. It even cleared five of Tesla's
> own vehicles — a Semi included. But the version that flies is the Rocket: invite-only, one seat. And Tesla's own
> page says it isn't approved for public roads. That 0 to 60 in 0.81 seconds? Tesla's own test. Production is
> targeted for 2028. So yes, the demo flew. [short pause] The flying commute? Still a question.

**Pickup in use (since the footage arrived).** The recordings don't let us count five vehicles (claim C7), so
`tools/build_short_narration.py` replaces "It even cleared five of Tesla's own vehicles — a Semi included." (take 4,
17.60–21.45 s) with the pickup `audio/short/takes/pickup_rowofteslas_t1_BfOG.mp3`: "It even cleared a row of Teslas —
a Semi included." Every other word keeps its time.

**0–60 line.** The stream's own timer read 1.00 s (claim C8). The narration still says "That 0 to 60 in 0.81 seconds?
Tesla's own test." because 0.81 s is Tesla's stated figure. The card now reads "TESLA'S FIGURE · OCT 15, 2026" with the
note "the stream's own timer read 1.00 s". **The owner should decide** whether to keep the line or re-voice it, for
example: "And 0 to 60? The stream's timer said one second. Tesla says 0.81." 

### Changes from the brief's draft, and why (see `research/claim_ledger.md`)

| Brief | Ours | Reason |
|---|---|---|
| "drove up a wall, hung upside down, then flipped off the ramp" | "drove up a curved ramp until it hung upside down… then launched off, rolled itself upright" | Reports describe a C-shaped ramp and a midair roll to upright (C2, C3) |
| "uses fan suction" | "Tesla says fans pull air from under the car" | It's a Tesla claim, so we attribute it (C4) |
| "five of its own cars" | "five of Tesla's own vehicles — a Semi included" | Two of the five are trucks (C7) |
| "the stunt version is an invite-only, single-seat Rocket" | "the version that flies is the Rocket" | No source says the demo car *was* a Rocket. Tesla's page lists flight on Rocket only (C10, C11) |
| "the demo flew. The flying commute is still a question." | "So yes, the demo flew. The flying commute? Still a question." | Same meaning, punchier ending, and it loops back to the first line |

## Storyboard / shot list (times = `source/src/short/ShortMain.tsx`)

| # | Time (s) | Words | Picture | Sound |
|---|---|---|---|---|
| sh01 | 0.00–2.40 | "Tesla just made its Roadster FLY." | **F1 airborne**, official footage, slow push. Chip `Tesla demo · Oct 15, 2026` | Demo audio at 35 %, ducked |
| sh02 | 2.40–4.40 | "It drove up a curved ramp until it hung" | **F2** ramp climb | demo audio |
| sh03 | 4.40–5.80 | "upside down…" | **F3** inverted hang | demo audio |
| sh04 | 5.80–8.70 | "then launched off, rolled itself upright in midair," | **F4** launch and roll (2nd run) | demo audio |
| sh05 | 8.70–9.95 | "and landed." | **F5** touchdown | demo audio |
| sh06 | 9.95–10.60 | "Tesla says fans" | **F3** again, later in the hang (+1.4 s), push-in on the underside: the match-cut source | — |
| sh07 | 10.60–13.95 | "…pull air from under the car, pinning it to the ramp." | Iris into **suction diagram** (front cross-section, upside down under the ramp): fan spins up, gap air drains to the fan, LOW PRESSURE, blue arrows "AIR PRESSURE PUSHES THE CAR INTO THE RAMP", small gravity arrow. Chip `ILLUSTRATION · not Tesla's actual layout` | whoosh, fan hum |
| sh08 | 13.95–17.65 | "In the air, jets of compressed gas help control the roll." | Push to **thruster diagram**: the car leaves inverted, a diagonal jet pair starts the roll, the opposite pair stops it, upright; ROLL arrow; "COMPRESSED-GAS JETS: NO FLAME"; "air tank feeds the jets" | whoosh, two gas hisses |
| sh09 | 17.65–21.88 | "It even cleared a row of Teslas — a Semi included." | **F6** front angle of the row and the Semi, then the side angle as it flips upside down above the Semi | demo audio (the only clip with sound) |
| sh10 | 21.88–29.85 | "But the version that flies is the Rocket … public roads." | **Trim cards** (text and seat icons only, no cars): PERFORMANCE / THRUST / ROCKET. Rocket turns saffron on "Rocket", stamp `NOT APPROVED FOR PUBLIC ROAD USE` on "approved", source chip | card ticks, pop, stamp |
| sh11 | 29.85–34.55 | "That 0 to 60 in 0.81 seconds? Tesla's own test." | **0–60 card**: the stopwatch counts to 0.81 in real time as the bar fills. Chip `TESLA'S FIGURE · OCT 15, 2026`, stamp `TESLA'S OWN TEST`, note "the stream's own timer read 1.00 s" | whoosh, ticks, chime, stamp |
| sh12 | 34.55–36.92 | "Production is targeted for 2028." | **Target card**: year ticks 2026 → 2027 → 2028, "Tesla's stated target" | whoosh, flips |
| sh13 | 36.92–38.70 | "So yes, the demo flew." | **F4** at +6.5 s: the same landing from the aerial angle | — |
| sh14 | 38.70–42.10 | "The flying commute? Still a question." | **F1** from `in − 3.4 s` to `in`: the Short ends on the exact image it opens with, so it loops cleanly | demo audio |

Captions: burned in, 2–3 words per plate (cream plate, ink text, saffron on the spoken word) at y = 1340 px, clear of
the Shorts UI at the bottom and right edge. Word timings: `source/src/data/short_words.json`. The upload SRT is
`captions/FGW_Roadster_Short.srt`.

## Footage in use

All six slots are filled from the owner's screen recordings of Tesla's replay. The exact source in and out of every shot
is in `footage/CLIP_LEDGER.md`. The cut list is `footage/cuts_short.json`, with in-points and 9:16 crops. The frame
sheets used to pick them are in `qa/footage_scan/`.
