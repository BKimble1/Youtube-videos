# R3 final-pass brief

**Required reading:**
- The audit: `production/R3_AUDIT.md` (the owner's review of R2 and the R3 prompt). Read all of it; it outranks this file where they differ.
- The R2 brief: `production/R2_SHOT_BRIEF.md`. Its tools, rendering commands, concurrency rules and file layout all still apply.

## What stays

Story, cast, style, the burning New York set and the music structure are approved. Keep:
- the opening title;
- the rubble rise, the army, the team assembling;
- the last stand, defeat and surrender;
- his death with the drone pilot beside him;
- the radio ending and the final city reveal.

"Portals" plays in full and drives every section boundary (`M` in `source/src/r2/timing.ts`). Never change the music anchors.

## What R3 changes, and who owns it

| Area | Owner | Files |
|---|---|---|
| Character rig: doubled features, props on faces, grips, limbs, expressions, diagnostic strip | RIG | `source/src/r2/rig/*`, `source/src/r2/dev/RigLab.tsx` |
| Machines: exchanges (parry, dodge, catch, brace, press), weight, joint failure, gravity-true debris, walker support phases, surrender behaviours | MECH | `source/src/r2/mech/*`, `source/src/r2/dev/MechLab.tsx` |
| Fire, smoke, embers, local firelight; smoke never makes an opaque facade look transparent | ATMOS | `source/src/r2/world/fires.ts`, `world/atmos.tsx`, `world/lighting.ts`, `fx/smoke.tsx` |
| City detail and spatial logic; the opening aerial (A1) | CITY | `world/set.tsx`, `world/city.ts`, `world/props.ts`, `world/geom.tsx`, `shots/A/*` |
| Sections | one agent each | `shots/<SEC>/*` |
| Music, radio timing, end card, mixer, the camera shift lens | lead | — |

Rules for shared files:
- Never edit a file another owner holds. If you need a kit change, ask in your report, or make the smallest additive change (a new optional field, default unchanged).
- Re-read the file immediately before editing, because others are working in parallel.
- Do not commit; the lead commits.

## Already done by the lead

- **Rig:** the runner's spikes are now one crest (union silhouette). The Director's headset cup and boom are layered segment by segment by their own depth.
- **Camera:** a shift lens (`Cam3.shift`, default 0.55, at most 12°) keeps verticals from converging. The target stays framed. Re-check any composition that relied on exact off-centre positions.
- **Music:**
  - "It's Been a Long, Long Time" now plays **continuously from rec 0** at film 199.6 and resolves at 234.26 (rec 34.66), with a 3 s fade.
  - The radio's indicator flutters with static at **199.0** (`M.RADIO_FLUTTER`). **Nobody touches the radio.**
  - The pullback ends at **231.6** (`M.CARD_IN`). The end card ("A FUTURE GOT WEIRD FILM") runs 231.6–237.8 (`M.END`).
  - The credit crawl is gone.
- **Sound:** the opening effort sounds are 6–8 dB lower.

## Choreography rules (sections)

1. **Exchanges, not demonstrations.** Every exchange is threat → defense → counter → consequence, and the consequence starts the next exchange. Robots initiate attacks, press advantages, block with a limb in the actual incoming path, dodge clear, brace, catch, and retreat to regroup.
2. **No one waits in striking range.** Every visible combatant in an active battle shot has a current task: attacking, blocking, evading, pursuing, protecting, recovering, repositioning, targeting or supporting.
   - Disabled, pinned or surrendered figures are visibly explained.
   - Stagger the actions. Each frame has one main event, one secondary exchange, and quieter distant activity, kept out of the main event's sightline.
3. **Teamwork you can read.** One person's block or distraction creates another person's opening.
4. **Consequences persist.** Wrecks, dropped tools, damage, cover that has been destroyed, and positions all carry across cuts and sections (`PERSIST`, `dmgR2`, `toolsR2`).
5. **Force and weight.** Each action has preparation, travel, contact, follow-through and recovery. Starting ranges at 30 fps:
   - fast actions: 4–8 frames of preparation, 2–5 of travel, a 1–2 frame contact accent, then 8–16 of recoil and recovery;
   - heavies and exhausted people are slower.

   Drive force through the hips and shoulders. Keep the support foot planted, or show the weight transfer. The recipient moves in the direction of the force. A spark alone is not a hit. Do not hide hand or tool contact under a large flash.
6. **Cutting in peak combat:**
   - inserts 0.7–1.5 s, exchanges 1.5–3 s, and occasional 3–5 s tracks or wides to establish the situation;
   - readable beats confusing. Cut when an event changes, not on a timer. Match movement and gaze across cuts;
   - keep screen direction until a wide or a continuous move re-establishes it;
   - never teleport anyone, switch an attacker's side, or swap a weapon hand.
7. **Camera:**
   - Use purposeful angles: a low view of the charge, three-quarter for block and counter, over-the-shoulder toward the next threat, side tracks on paired attacks, a brief overhead to establish the ring, intimate views for the loss.
   - Avoid steep up or down pitch except for a destabilizing moment.
8. **Faces:** show concentration, fear, recognition, pain, grief and exhaustion with brows, lids, gaze and mouth. RIG provides presets. Do not let one wide-eyed neutral face carry every action.
9. **Exchange sheet.** For every major exchange, record:
   - starting positions;
   - intended target;
   - the initiating attack;
   - the defense;
   - the counter;
   - the consequence;
   - ending positions.

   Write it as a table in `production/R3_EXCHANGES.md`, under your section's heading; use the Edit tool and re-read the file first, because others write to it too.

## Release gates (check your own section against them)

- **Characters and props:**
  - No doubled hair, faces or limbs, and no prop penetrating a face.
  - No floating grips or unexplained object swaps.
  - No foot sliding on contact.
- **Geometry:** no robots, people or buildings visibly passing through one another.
- **Combat:**
  - Every visible active combatant has a task.
  - Every exchange has an attack, a response and a consequence.
  - The robots initiate and adapt.
- **Cutting:** fast cuts stay readable, and geography survives cuts.
- **Continuity:** wounds, broken equipment, fallen robots and cover damage persist.
- **Fire and smoke:** they stay attached to their sources and never obscure essential acting.

## Verification

- **Motion:** check it from consecutive frames around every contact, turn and cut (every 2nd frame), not from flattering stills.
- **Sheets:** leave sheets in `qa/r3/<area>/`.
- **Report:** be honest about what still reads weak.
