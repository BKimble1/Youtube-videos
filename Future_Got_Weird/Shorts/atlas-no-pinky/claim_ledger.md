# Claim ledger — V2 (production version)

Matches what the V2 render says and shows. V1 ledger: `v1/claim_ledger_V1.md`. Original packet ledger: `handoff/05_CLAIM_LEDGER.md`.

## Sources

- **S1** Boston Dynamics — *Robot Hands for Modern AI and Real Work*, sections **The Missing Finger** and **Hand Architecture Basics**: https://bostondynamics.com/blog/robot-hands-for-modern-ai-and-real-work/
- **S2** IEEE Spectrum — direct interview, *Atlas Robot's New Hand May Outperform Humanlike Designs*: https://spectrum.ieee.org/robust-robot-hand
- **S3** IEEE RAS — dated copy of the same interview (1 Oct 2026): https://www.ieee-ras.org/news/atlas-robots-new-hand-may-outperform-humanlike-designs/ — not independent replication.
- **S4** Official demonstration video: https://www.youtube.com/watch?v=4whgw2gLBS8 — **not watched** in this production.

## Re-check status

The V2 audit supplied by the owner (`02f7f689-FGW_Atlas_No_Pinky_V2_Audit_and_Master_Prompt.md`, read 10 Oct 2026) states that S1's *The Missing Finger* explicitly supports the "three more actuators" line, with its cost / volume / failure tradeoff, and that S2 supports the taped-finger experiment and the 13-DOF design but **not** the exact count. That correction is recorded below. **The primary pages were not re-read in this session**: the sandbox network policy blocks bostondynamics.com and spectrum.ieee.org (proxy 403). The audit file is undated; the "access date" for this ledger is therefore the date of this production session, **10 Oct 2026**, for the owner's check as relayed — please confirm on the page before publishing if you want a first-hand date.

| ID | Claim in the film | Shot | Source for the claim | Status |
| --- | --- | --- | --- | --- |
| C01 | The new Atlas hand omits the pinky (thumb + three fingers) | B01, B04 | S1, S2 | Company design; corroborated by the owner's audit and V1 searches |
| C02 | Engineers taped ring and pinky fingers together for about a day, and chose to leave the fifth digit out | B02–B03 | **S2** (interview) | Supported by S2 per the audit; reported by the company/interview, not independently replicated. The film says "Boston Dynamics says…" |
| C03 | Thumb + three fingers; 13 degrees of freedom ("independent ways to move") | B04 | **S2**; S1 *Hand Architecture Basics* | Supported per the audit. The film shows **only the total** (a counter to 13); no per-finger or per-joint breakdown, no 13-axis diagram |
| C04 | The company says it can pinch, turn objects, and press tool triggers | B05 | S1 (company claims) | Company-reported abilities, illustrated; not demonstration footage |
| C05 | A fifth digit would mean **three more actuators**, more cost, more bulk, more things to break | B06 | **S1 — *The Missing Finger*** (company design statement) | **Verified as a company statement** per the owner's V2 audit (previously unresolved in V1). S1 supports the count and the cost/volume/failure tradeoff. S2 does **not** state the count. Company assertion, not independent testing. Qualitative only in the picture: no prices, volumes, failure rates |
| C06 | Goal: a useful, reliable hand; looking human is optional | B07–B08 | S1, S2 (stated design goals) | Narration is a paraphrase of stated goals; the picture is a design-goal illustration |
| C07 | "Even robots have a budget" | B09 | — | Editorial humour. The receipt shows no financial data (`—`, `?`) |

## Boundaries honoured in the picture (V2)

- **No five-digit previous Atlas hand, no "5 → 4" counter, no finger being removed.** The pinky position is only a dashed **ghost** slot with a circle (human expectation), and a dashed slot with a `+` on the diagram. The four-digit hand is recognisable in every robot shot.
- **No claim that human pinkies are useless.** The taped-finger shot is an engineering experiment on a hand prop; the human silhouette in B08 is a plain reference.
- The robot hand is a **simplified original reconstruction**; no company photo, frame or footage was used.
- "13 ways to move" is a **total** only (a counter ending at `13`, tag `13 DOF`); the motions shown (thumb sweep, splay, curls) are **representative**, not a mapping of the 13 axes.
- No dollar figures, failure percentages, benchmarks or quotes appear. The price tag is blank; the volume box and the spare-module/wrench are qualitative pictograms.
- Every illustrated physical action is a **teaching device**, labelled on screen, not a record of a test.

## Picture taxonomy (on-screen tag → what it means)

On screen only a short tag and `Source: Boston Dynamics` appear (the first 1.5 s and the loop tail read `ATLAS HAND · Boston Dynamics`). The detailed categories live here.

| Shot | Time | On-screen tag | What the picture is |
| --- | --- | --- | --- |
| B01 hook | 0.0–2.8 s | `ATLAS HAND · Boston Dynamics` (0–1.5 s), then `Source: Boston Dynamics` | Original illustration of the four-digit hand holding a small gear; the dashed ghost slot is a human-expectation marker, not hardware |
| B02 test | 2.8–8.0 s | `RECONSTRUCTION` | Illustrative reconstruction of the reported taped-finger exercise with a human-hand prop; the guide's arm is a stand-in, not an engineer; mug/knob/day-clock are illustrative tasks, **not** reported test results |
| B03 verdict | 8.0–10.3 s | (none; `Source: Boston Dynamics` only) | Editorial illustration of the decision, not a document |
| B04 mechanism | 10.0–16.2 s | `CONCEPT DIAGRAM` | Schematic of the new hand; counter to 13 is the reported total |
| B05 abilities | 16.2–20.3 s | `COMPANY-REPORTED ABILITY` | Illustrations of three company-reported abilities in three staging angles; not demonstration footage |
| B06 tradeoff | 20.3–26.4 s | `DESIGN OPTION` | Exploded diagram of the three optional actuator modules for a hypothetical fifth digit; qualitative consequences only |
| B07–B08 goal | 26.3–31.2 s | `DESIGN-GOAL ILLUSTRATION` | Illustrated workstation completing a simple task; not validated performance, not a continuous run of real Atlas; human silhouette is a reference |
| B09 gag | 31.2–34.6 s | `EDITORIAL JOKE` | Receipt/stamp joke with no data; tears away into the opener |

Nothing here is an official demonstration, and the attribution line does not imply Boston Dynamics produced the artwork.
