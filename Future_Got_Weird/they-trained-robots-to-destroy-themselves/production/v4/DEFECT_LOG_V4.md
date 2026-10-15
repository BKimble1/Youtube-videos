# V4 defect log

V4 redraws the whole episode as vector illustration: about 85 % flat and controlled 2.5D, 15 % atmosphere. The narration, captions and runtime (3:53.5, 30 fps) are unchanged, and so are the section boundaries (0:19, 1:08, 1:34, 2:30, 3:10, 3:24).

## Where the evidence is

| What | Where |
|---|---|
| Development stills | `qa/v4/<round>/sheet.png` |
| Transition strips (25 consecutive frames around each transition, cut from the upload master) | `qa/v4/strips/` |
| V3-vs-V4 comparison frames | `qa/v4/compare/` |
| Measured checks | `qa/v4/qa_v4_results.json` |

## The brief's ranked fixes

| # | V3 time | Symptom | Change in V4 | V4 time | Inspection |
|---|---|---|---|---|---|
| 1 | whole film | Robots not recognisable or stable as characters | Two vector character assets on one rig (see `MODEL_RECORDS_V4.md`): **F.02** (graphite; narrow visor; Figure symbol on visor and chest, "F.02" below) and **F.03** (light coverings, dark joint bands, chest symbol). Fixed proportions, hands and pose sets; a schematic training avatar; the symbol is never mirrored | whole film | `production/v4/V4Sheet0–2.png`, `compare/model_emblem_v3_vs_v4.png` |
| 2 | 0:00–0:19 | Platform re-approach and a monitor repeat delayed the question | One jump from frame 0 in one composition (deck lip and ladle both in frame), one splash. Attribution chips and a silhouetted witness in the control booth. The settling ripple is inked into a target, the scenery turns into the teaching stage, and the same model appears as the avatar. No second jump, no monitor | 0:00–0:19.4 | strips 01–02 |
| 3 | 0:19.6 | Split reveal: dark head above, blue body below a seam | Matched complete pose: the avatar's chest framing cuts to the F.02's chest at the same scale and pose, then pulls out from the emblem | 0:19.37 | strip 03, `compare/transition_0196_v3_vs_v4.png` |
| 4 | 0:16–0:36, 1:40–2:08, 2:40, 2:56–3:08 | Subjects small inside wide sets | Recomposed around the action: hand/object contact while loading, a matched F.02/F.03 front pose, a bounded knee lens for the actuator, close on the battery at the edge, the policy in a close side view, the robot at about 60 % of frame height in the airbag landing. Wide views are brief establishing beats only | as listed | review stills, strips |
| 5 | 2:15–2:24 | Blue limbs and surfaces show through one another | Opaque layered rig with a fixed near/far order and planted IK feet in a side view. The teaching overlay is lines into a separate POLICY box. The only cutaways are bounded (knee lens, battery window) | 2:12–2:30 | strip 15, `compare/limb_overlap_2m15_v3_vs_v4.png` |
| 6 | later foundry returns | Repeated approaches and jumps added little | Each return answers something new: the battery at the edge; the film crew arriving; "can't rehearse" (a practice arc crossed out); slack, an uneven plate and noisy sensors, each corrected; interference knocks out cameras while the policy keeps running; the prepared-set labels. One full jump opens the film and one payoff jump is shown; the conclusion's leap is held mid-air, not repeated | 0:52–1:08, 1:25–1:34, 1:34–1:39, 2:30–2:43, 3:01–3:10, 3:15–3:21 | strips 06, 10–12, 16, 20–22 |

## Other defects found and fixed during V4

| Found at | Symptom | Cause | Change |
|---|---|---|---|
| Opening flight (development) | Raised hands cropped at the apex | The wide camera had too little headroom | Retimed headroom: the camera holds the wide composition and only moves once the robot is falling |
| Foundry beats (development) | The robot read too dark on the dark wall | Palette | F.02 palette lightened; warm work-light pools added on the wall |
| 0:53–1:34, 2:30 (development) | The robot looked oversized next to the ladle, a "surprise scale change" | Foundry robots were at 1.0× and 0.78×, the opening at 0.6× | All foundry and stage robots at 0.6×; crew at matching height |
| 1:34, 3:10 (review render 1) | Hard cuts at section joins | Film-set lights, crane chain, monitors and the POLICY badge vanished between sections | Shared film-set lights and chain carried across; monitors kept; the badge and interference rings fade before the join |
| 1:08 (review render 1) | One-frame pop | A checklist card sat above the covering clapperboard | The clapper is drawn above every overlay |
| 3:25 (review render 1) | Black frame | Stage flats closed over an empty background | The factory stays behind the closing flats |
| 9 places (review render 1) | Holds of 1.5–3.3 s with almost nothing moving | Static cameras | Slow drifts and pushes (booth, scoring, side views, wide foundry, silhouette) |
| 2:40 (review render 2) | One remaining 1.9 s hold | Static wide after the pull-back | Slow drift |
| 2:59–3:00 (review render 2) | Robot's upper body cropped in the last 0.3 s of the drop | The camera settled on the airbag before the speed-ramp ended | The camera follows to touchdown, then settles |
| Various (development) | Off-frame tags and bubbles; a duplicate crane hook; a reflex hammer that read as an arrow; a lever left in the final frame; the clipboard never left | Placement | Fixed individually |
| 0:03 "steel" (mix) | Impact 7 dB over the word | Level | Lowered: now 4 dB over for 0.2 s, deliberately on the word (V3: 5.3 dB). Other windows of ≥ 150 ms with effects over the voice: 0:04.0 (furnace bed between words), 0:44.05 (+1.7 dB, the padlock and the shutter) and 3:31.9 (+0.1 dB). V3 had 14 such windows; V4 has 4 (`audio/v4/mix/speech_mask_v4.txt`; measurement, not listening) |

## Not changed

- **Narration, captions, story, chapters and timings.** The V4 captions are the V3/V2 captions.
- **The channel's flat 2D cast** (the Crew). The rear silhouettes with warm rim light are kept at 3:43.
- **Reference images.** None could be loaded from this environment (network policy). The models follow the brief's written descriptions and remain open for owner review.
