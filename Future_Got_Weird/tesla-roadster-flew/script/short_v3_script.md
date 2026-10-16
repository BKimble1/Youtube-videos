# Short v3: "Tesla Just Made the Roadster Fly" (36.7 s, 9:16), owner revision of 16 Oct 2026

## Narration (as recorded and verified by an independent transcription)

> Tesla's newly unveiled Roadster hung upside down on a ramp. On another run, it flew off, rolled upright, and landed.
> How does a car stick upside down?
> Tesla says fans pull air out of the thin gap beneath it. Lower pressure there, normal pressure outside, so the
> outside air presses the car into the ramp.
> Once it's airborne, compressed-gas jets help rotate it upright and hold it steady.
> It even cleared a whole row of Teslas, Semi included.
> Zero to 60? 0.81 seconds, by Tesla's own test.
> And flight? Tesla lists it only on the invite-only Rocket, which it says isn't approved for public roads.
> So the demo flew. A road-ready flying car? Not yet.

There are 115 words. Speech runs from 0.08 to 36.46 s, which is **191 wpm**. The longest pause is 0.21 s.

**Voice.** ElevenLabs Test Voice (`kk5XaSLo2XAw0sKM98zU`, `eleven_v4`), direction `[excited] [quickly]`, take
`audio/short_v3/takes/v3_t3_IqHa.mp3` (generation `IqHaI9QjQhg62iDTDRE2`). The voice is not time-stretched and not
pitch-shifted. `tools/build_short_v3_narration.py` only shortens pauses: sentence breaks become 0.20 s and comma breaks
at most 0.12 s, which takes 40.24 s down to 36.68 s. A Scribe transcription of the edited track, uploaded as audio and
not aligned to the prompt, returned the script word for word, including "Zero to 60? 0.81 seconds". The caption
timings come from that transcription.

**Auditions** (`audio/short_v3/auditions/`, 26 words each, measured with `tools/audition_metrics.py`):

| Audition | Direction | Rate | Pauses | Pitch movement | Note |
|---|---|---|---|---|---|
| A, Test Voice | excited, quick | 170–174 wpm | 0.95–1.29 s | 11.8–12.5 st | chosen direction |
| B, Test Voice | urgent breaking-news | 165–168 wpm | 0.97–1.23 s | 12.6–13.0 st | slower |
| Alt, Wendy (`ZqLJOOVEsv5OloxINb8S`) | excited, quick | 182–203 wpm | 0.20–0.47 s | 6.9–9.2 st | fast but flatter, 4–8 dB quieter |

The Test Voice's own articulation is fast (about 210 wpm between pauses). Only its pauses were long, and editing fixed
those. That kept the channel voice. **Nobody has listened to any of this.** One listen before upload is still needed.

## Facts behind each line (claim ledger IDs)

| Line | Basis |
|---|---|
| "newly unveiled … hung upside down on a ramp" | Footage: first run, `rec_224730` 1:08–1:20 (C2) |
| "On another run, it flew off, rolled upright, and landed" | Footage: second run, aerial `rec_224730` 2:16–2:26 (C3) |
| "Tesla says fans pull air out of the thin gap…" | Tesla's description, attributed (C4). The pressure explanation is physics |
| "compressed-gas jets help rotate it upright and hold it steady" | Cold-gas thrusters (C5). Footage: plumes up while inverted, an opposite pair while rolling, two down once upright (`rec_224911` 0:36–0:39) |
| "cleared a whole row of Teslas, Semi included" | Footage: `rec_224911` 0:19–0:23 (C7; five vehicles can't be counted, so it isn't claimed) |
| "0.81 seconds, by Tesla's own test" | C8, resolved: the stream first showed a pre-recorded one-second run (`rec_225218`, timer stops at 01.00), then a live run Tesla says took 0.81 s, not timed on screen (Gizmodo, Jalopnik, Electrek via search). The 0.81 graphic plays over that **live run** (`rec_225340`, no timer overlay) and notes the 1.00 s clip |
| "Tesla lists it only on the invite-only Rocket … isn't approved for public roads" | C10, C11 (consistent across outlets). Tesla's live page can't be resolved from this container, so it is still to be rechecked |
| "production target 2028" (on screen only) | C12 |

## Timestamped shot list

| # | Time (s) | Words | Picture (exact source in → out) | Sound |
|---|---|---|---|---|
| s01 | 0.00–0.53 | "Tesla's newly…" | **Hero:** the white Roadster upright in midair on two gas jets, whole car in frame. `rec_224911` 0:38.30 → 0:38.83 | real event audio |
| s02 | 0.53–1.80 | "…unveiled Roadster" | Top view of the car on the ramp, first run. `rec_224730` 1:08.30 → 1:09.57 | hit |
| s03 | 1.80–3.42 | "hung upside down on a ramp." | Upside down against the ramp, close-up from below. `rec_224730` 1:17.50 → 1:19.12 | whoosh |
| s04 | 3.42–5.85 | "On another run, it flew off, rolled upright," | Aerial, second run: inverted at the top, leaves the ramp, rolls on its jets. `rec_224730` 2:17.12 → 2:19.55 | whoosh, designed jet hiss (source silent) |
| s05 | 5.85–6.70 | "and landed." | Aerial: settles into the landing in smoke. `rec_224730` 2:22.90 → 2:23.75 | designed landing hit (source silent) |
| s06 | 6.70–8.50 | "How does a car stick upside down?" | Back under the ramp, slow push toward the floor. `rec_224730` 1:18.65 → 1:19.82 at 0.65× | whoosh |
| s07 | 8.50–16.30 | suction lines | **Simplified illustration** (labelled once). Traced Roadster hanging under the ramp. Air leaves the thin gap ("FANS PULL AIR OUT"). Push-in: "THIN GAP", then "LOW PRESSURE". Pull-back: arrows "NORMAL AIR PRESSURE", then "PRESSES IT INTO THE RAMP" | air hiss, ticks, two hits |
| s08 | 16.30–20.40 | airborne line | Real flip at half speed, `rec_224911` 0:36.50 → 0:38.56, with vectors on visible plumes: "GAS JETS", then "ROLL" (arc and opposite pair), then "HOLD STEADY" | jet hisses |
| s09 | 20.40–23.45 | "It even cleared a whole row of Teslas, Semi included." | **Semi payoff:** front angle, then side. Approach, lift over the row, flip above the Semi, touchdown. `rec_224911` 0:19.40 → 0:22.45 | **real event sound** (lift-off and touchdown) |
| s10 | 23.45–27.50 | "Zero to 60? 0.81 seconds, by Tesla's own test." | Live run: car at the line `rec_225340` 0:45.60 → 0:46.85, then the launch at 0.4× 0:46.80 → 0:47.92. **0.81 graphic** counts up on "0.81"; "TESLA'S CLAIM · ITS OWN TEST"; "live run · the stream's timed clip read 1.00 s" | **real launch blast** |
| s11 | 27.50–33.10 | "And flight? … public roads." | One trim beat over the dimmed aerial replay `rec_224911` 0:43.40 → 0:49.00: PERFORMANCE / THRUST greyed, ROCKET "invite-only · 1 seat", stamp "NOT APPROVED FOR PUBLIC ROADS", "per Tesla's Roadster page · production target 2028" | ticks, pop, stamp |
| s12 | 33.10–34.45 | "So the demo flew." | Aerial: midair on its jets. `rec_224730` 2:20.80 → 2:22.15 | whoosh |
| s13 | 34.45–36.73 | "A road-ready flying car? Not yet." | The hop flip in real time. `rec_224911` 0:35.83 → 0:38.12, ending one frame before the broadcast's camera cut. **Loops into s01** (0:38.30 on the far side of the same cut) | real event audio, continuous across the loop |

Real footage is on screen for 28.9 of 36.7 s (79%). That includes 13.8 s carrying our overlays (airborne vectors, the
0.81 graphic, the trim beat). The one fully animated stretch is the 7.8 s suction diagram.

**Captions.** Phrase-level, burned in (cream plate, saffron on the spoken word). The plate sits at y 1290–1450 and x
110–930, clear of the Shorts right-hand buttons and the bottom title area. The upload file is
`captions/FGW_Roadster_Short_v3.srt` (24 cues).

**Attribution.** One readable chip at the start ("Tesla reveal footage · Oct 15, 2026", 34 px), and the trim beat
cites Tesla's page. The per-shot tiny labels from v2 are gone.

## Change list against review copy v2

| v2 | v3 | Why |
|---|---|---|
| Opened on a dark side shot (2:08), and the car read as an unidentified object | 0.00 s: the white Roadster bright and upright midair. 0.53 s: the top view, then upside down at 1.80 s | Recognizable car in the first half second |
| 42.1 s narration at 160 wpm, with long beats ("FLY." tail, 0.82 s pause before the last line) | 36.7 s at 191 wpm, longest pause 0.21 s | Pace and retention |
| About 10 s describing the stunt before any explanation | The question lands at 6.7 s and the explanation starts at 8.5 s | Owner brief |
| Red box-shaped cross-section car (suction) and box car with invented jet pairs (thrusters) | Suction: traced side profile of the real car (white body, dark canopy, wheel covers; no invented parts). Airborne: real footage with vectors only on visible plumes | Owner brief: real proportions, no invented components |
| Separate trim-card sequence (8 s), 0–60 number card, calendar card | One 5.6 s trim beat over footage. 0.81 graphic over the live run. 2028 as one line of text | Remove card holds |
| Hop over the row at 17.7 s (one shot) | Semi payoff at 20.4 s from the front angle, with its real sound | Mid-video payoff |
| 2–3-word caption chips | Phrase captions | Owner brief |
| "Tesla demo" chip on every footage shot | One readable attribution at the start | Owner brief |
| Loop: same shot (F1) at end and start | End shot runs into the start across the broadcast's own camera cut | Clean loop |
| "0.81 seconds? Tesla's own test." over a card, while the only footage showed a 1.00 s timer | 0.81 shown over the live run it refers to, with the 1.00 s clip noted | Accuracy |
