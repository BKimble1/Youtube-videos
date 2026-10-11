# Claim ledger — V4 (production version)

Matches what the V4 render says and shows. Claims, sources and statuses are unchanged from V3 (`v3/claim_ledger_V3.md`) and V2 (`v2/claim_ledger_V2.md`); V4 changes **how the picture attributes** and the pacing, not the facts. V1 ledger: `v1/claim_ledger_V1.md`. Original packet ledger: `handoff/05_CLAIM_LEDGER.md`.

## Sources

- **S1** Boston Dynamics — *Robot Hands for Modern AI and Real Work*, sections **The Missing Finger** and **Hand Architecture Basics**: https://bostondynamics.com/blog/robot-hands-for-modern-ai-and-real-work/
- **S2** IEEE Spectrum — direct interview, *Atlas Robot's New Hand May Outperform Humanlike Designs*: https://spectrum.ieee.org/robust-robot-hand
- **S3** IEEE RAS — dated copy of the same interview (1 Oct 2026): https://www.ieee-ras.org/news/atlas-robots-new-hand-may-outperform-humanlike-designs/ — not independent replication.
- **S4** Official demonstration video: https://www.youtube.com/watch?v=4whgw2gLBS8 — **not watched** in this production.

## Where attribution lives in V4

V3 carried a persistent `Source: Boston Dynamics` strip and tag pills (`RECONSTRUCTION`, `COMPANY-REPORTED ABILITY`, `ILLUSTRATION`) on most shots. **V4 removes all of them from the picture** (including the closing-loop layers). The attribution is now:

1. **On screen, once, in the opener only:** a small kicker above the title, `ATLAS HAND · BOSTON DYNAMICS`, present from frame 0 until the tape wipe (≈ 2.7–3.2 s) and again in the closing tear's opener pre-roll (the last ≈ 0.7 s) so the replay seam matches. No persistent footer, pill or tag anywhere else (`tools/qa_v4.py` greps the picture code for the old strings).
2. **In the narration:** "Boston Dynamics says its engineers…", "The company says it can pinch…" (the on-the-record attribution of C02, C04, C05).
3. **In the description / pinned text** (`packaging_draft.md`): the two source URLs and the sentence *"Animation is an explanatory reconstruction; capabilities are attributed to the company."* **The description text is therefore load-bearing for the reconstruction / illustration disclosure — do not drop it on upload.**
4. **In this ledger** (the picture taxonomy table below keeps the internal category for every shot).

## Re-check status

The V2 audit supplied by the owner (`02f7f689-FGW_Atlas_No_Pinky_V2_Audit_and_Master_Prompt.md`, read 10 Oct 2026) states that S1's *The Missing Finger* explicitly supports the "three more actuators" line, with its cost / volume / failure tradeoff, and that S2 supports the taped-finger experiment and the 13-DOF design but **not** the exact count. **The primary pages were not re-read in this session**: the sandbox network policy blocks bostondynamics.com and spectrum.ieee.org (proxy 403). Please confirm on the pages before publishing if you want a first-hand date.

| ID | Claim in the film | Shot | Source for the claim | Status |
| --- | --- | --- | --- | --- |
| C01 | The new Atlas hand omits the pinky (thumb + three fingers) | B01, B04 | S1, S2 | Company design; corroborated by the owner's audit and V1 searches |
| C02 | Engineers taped ring and pinky fingers together for about a day, and chose to leave the fifth digit out | B02–B03 | **S2** (interview) | Supported by S2 per the audit; reported by the company/interview, not independently replicated. The film says "Boston Dynamics says…" |
| C03 | Thumb + three fingers; 13 degrees of freedom ("independent ways to move") | B04 | **S2**; S1 *Hand Architecture Basics* | Supported per the audit. The film shows **only the total**: `13 WAYS TO MOVE` (no `13 DOF` badge, no per-finger or per-joint breakdown, no 13-axis diagram). Four numbered badges mark the four digits only |
| C04 | The company says it can pinch, turn objects, and press tool triggers | B05 | S1 (company claims) | Company-reported abilities, illustrated; not demonstration footage |
| C05 | A fifth digit would mean **three more actuators**, more cost, more bulk, more things to break | B06 | **S1 — *The Missing Finger*** (company design statement) | **Verified as a company statement** per the owner's V2 audit. S1 supports the count and the cost/volume/failure tradeoff. S2 does **not** state the count. Company assertion, not independent testing. Qualitative only in the picture: a price tag with a `$` glyph, a growing footprint box, a wrench and crack — no prices, volumes, failure rates |
| C06 | Goal: a useful, reliable hand; looking human is optional | B07–B08 | S1, S2 (stated design goals) | Narration is a paraphrase of stated goals; the picture is a design-goal illustration |
| C07 | "Even robots have a budget" | B09 | — | Editorial humour. The receipt shows no financial data (`?`, `+ COST + BULK`, …) |

## Boundaries honoured in the picture (V4)

- **No five-digit previous Atlas hand, no "5 → 4" counter, no finger being removed.** The opener is the four-digit hand pinching a gear; the pinky position is only a dashed **ghost** slot with a ring (human expectation) beside the ring finger, and a dashed slot with a `+` on the B06 diagram.
- **No claim that human pinkies are useless.** The taped-finger shot is an engineering experiment on a hand prop; the human hand in B08 is a plain reference labelled `HUMAN`.
- The robot hand is a **simplified original reconstruction**; no company photo, frame or footage was used.
- "13 ways to move" is a **total** only; the motions shown (thumb sweep, splay, curls and the loupe on the thumb's base joint) are **representative**, not a mapping of the 13 axes.
- No dollar figures, failure percentages, benchmarks or quotes appear. The `$` tag carries no amount; the footprint box and the wrench are qualitative pictograms. The receipt rows (`5TH FINGER ?`, `+3 ACTUATORS`, `+ COST + BULK`, `+ REPAIRS`, `NOT IN BUDGET`) carry **no amounts**; `+3 ACTUATORS` restates C05 as the company's statement.
- Every illustrated physical action is a **teaching device**, never a record of a test. The cube turn, washer pinch, drill press and block placements are drawn with pads in contact with the object (verified per frame, `qa/v4/automated_checks.txt`), but they are illustrations of company-reported abilities, not footage.

## Picture taxonomy (internal categories; none of these is printed on the picture in V4)

Times are for the retimed (default) cut, 31.87 s. The original-pace cut (34.60 s) has the same shots, later by the narration's own spacing.

| Shot | Time | Internal category — what the picture is |
| --- | --- | --- |
| B01 hook | 0.0–3.2 s | Original illustration of the four-digit hand pinching a small gear; the dashed ghost slot is a human-expectation marker, not hardware. Only on-screen company identification (kicker) |
| B02 test | 2.7–7.4 s | Illustrative reconstruction of the reported taped-finger exercise with a human-hand prop; the guide's arm is a stand-in, not an engineer; mug/knob/day-clock are illustrative tasks, **not** reported test results |
| B03 verdict | 7.4–9.6 s | Editorial illustration of the decision, not a document |
| B04 mechanism | 9.1–14.8 s | Concept diagram of the new hand (light paper stage): whole hand, then a loupe on the thumb base joint, then independent finger motion; `13 WAYS TO MOVE` is the reported total |
| B05 abilities | 14.8–18.6 s | Illustrations of three company-reported abilities in three staging angles (overhead pinch, diagonal turn, side press); not demonstration footage |
| B06 tradeoff | 18.6–24.2 s | Design option: exploded diagram of the three optional actuator modules for a hypothetical fifth digit; qualitative consequences only |
| B07–B08 goal | 24.2–28.6 s | Design-goal illustration of a workstation completing a simple task; not validated performance, not a continuous run of real Atlas; the human hand is a reference |
| B09 gag | 28.6–31.9 s | Editorial joke: receipt/stamp with no data; tears away into the opener |

Nothing here is an official demonstration, and the opener's company name does not imply Boston Dynamics produced the artwork.
