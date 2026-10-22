# FGW — Starship Dual Catch: sources, visual reference bible and editorial decisions

Research date: **22 Oct 2026**. Status of the event: **planned, not flown.**

## 0. Access limits during research (read first)

This environment's network policy blocked direct page access to spacex.com, theverge.com, teslanorth.com,
teslarati.com, wikipedia.org and investing.com (proxy 403 / DNS refusal). I could not open SpaceX's own design
pages, the V3 update, the Starbase PDF or the simulation video. Everything below comes from **search-engine
summaries of those pages and of secondary reporting**, cross-checked against each other and against facts I
already knew from before 2026. Items that rest on a single secondary source are marked *(single source)*.
**Before the 4K master, someone with normal web access should open the official SpaceX pages and confirm the
items in section 4.**

## 1. Sources

| # | Source | Used for | Access |
|---|---|---|---|
| 1 | SpaceX Q3 2026 earnings call, 20 Oct 2026 (via CNBC live blog https://cnbc.com/2026/10/20/spacex-spcx-earnings-live-updates-q3-2026html.html , Space.com https://www.space.com/space-exploration/launches-spacecraft/spacex-will-attempt-1st-ever-double-starship-rocket-catch-on-next-test-launch-a-profound-technology-milestone-elon-musk-says , Gizmodo https://gizmodo.com/spacex-is-finally-going-for-the-starship-double-catch-2000828826 , TokenPost https://www.tokenpost.com/news/technology/36499) | Musk: Flight 15 "we're going to attempt to catch both the booster and the ship"; expected next month; "more likely than not"; more flights lined up; "first time an orbital launch vehicle has been fully recovered". Shotwell: license expected to include RTLS + tower catch for both stages | search summaries |
| 2 | The Verge, 20 Oct 2026 https://www.theverge.com/science/1014913/spacex-will-try-catching-starship-and-its-booster-for-first-time-musk-says | Original report (brief) | blocked |
| 3 | Tesla North, 20 Oct 2026 https://teslanorth.com/2026/10/20/spacex-starship-flight-15-catch-simulation/ | Simulation report | blocked; summary only |
| 4 | Teslarati, "SpaceX showcases exactly how it plans to catch Starship next month" https://www.teslarati.com/spacex-starship-tower-catch-flight-15/ ; Yahoo Tech / Gadget Review rewrites | ~80 s "Up Next: Ship Catch" animation shown on the webcast: belly-flop reentry, flaps steering, flip to vertical, chopstick catch; booster catch not shown in it. Caveat (Yahoo): simulation ≠ demonstration | search summaries |
| 5 | NASASpaceflight, "Ship 42 wraps chopsticks tests…" https://www.nasaspaceflight.com/2026/09/ship-42-chopsticks-tests-flight-14-net/ ; "Starship makes orbit, Flight 15 preps…" https://www.nasaspaceflight.com/2026/09/starship-14-orbit-flight-15/ | Ship 42 lifted by Pad 2 chopsticks (12 Sep 2026) into a simulated catch position, without flight engines; QD arm connected (Teslarati); Flight 15 = Booster 22 + Ship 42 | search summaries |
| 6 | Space.com Flight 14 live blog (28 Sep 2026) https://www.space.com/news/live/spacex-starship-flight-14-live-updates-sept-28-2026-starship-first-orbital-launch-attempt | Flight 14: first orbit, both stages splashed down; ship has never been caught; three booster catches to date | search summaries |
| 7 | V3 design update reporting: Investing.com https://ng.investing.com/news/company-news/spacex-unveils-starship-v3-with-major-design-overhauls-93CH-2503920 ; Teslarati https://www.teslarati.com/spacex-unveils-sweeping-starship-v3-upgrades-ahead-may-19-launch/ ; NewSpace Economy review https://newspaceeconomy.ca/2026/04/16/detailed-review-of-starship-v3/ | 3 grid fins (from 4), ~50% larger, moved lower, actuators inside the tank, new catch point; chopsticks shorter, main actuators hydraulic → electromechanical; V3 stack ≈124.4 m; 33 Raptor 3 on the booster; ship aft flaps one actuator with three motors | search summaries |
| 8 | NewSpace Economy, 11 Oct 2026 https://newspaceeconomy.ca/2026/10/11/starship-flight-15-will-attempt-to-recover-its-upper-stage-spacecraft-in-november-launch/ ; Space Launch Schedule | Flight 15 from Pad 2 (reported); NET ~8 Nov per planning info, not confirmed | search summaries *(single source for Pad 2 launch)* |
| 9 | Prior knowledge (pre-2026, widely documented) | Booster catches: Flight 5 (13 Oct 2024), Flight 7 (16 Jan 2025), Flight 8 (6 Mar 2025); Flight 6 (19 Nov 2024) catch called off → Gulf splashdown; ships lost: Flight 3 (reentry, Mar 2024), Flights 7 & 8 (ascent, 2025), Flight 9 (descent, May 2025); SN-series hops 2020–21 incl. flip manoeuvre; ship 6 engines (3 sea-level + 3 RVac); booster engine rings 3/10/20; LEO speed ≈7.8 km/s | — |
| 10 | Official references named in the brief (not reachable here): https://www.spacex.com/vehicles/starship/design , https://www.spacex.com/updates/reusability , https://www.spacex.com/launches , Starbase Overview PDF | To verify before master | blocked |

## 2. Mission status as of 22 Oct 2026 (what the film says, and how)

- **Flight 15 intends to attempt catches of both stages.** Said by Musk on the 20 Oct earnings call; Shotwell said SpaceX
  *expects* the FAA license to include return-to-launch-site and tower catch for both stages. → Narration: "Elon Musk
  said that Flight Fifteen, expected as soon as November, will attempt to catch both." Card text: "as reported … no firm date".
- **Not confirmed:** launch date (NET ~8 Nov is planning info), final license terms, which tower catches which stage,
  return sequence/timing of the ship. → The film never names the catch tower for either stage, never shows both stages
  at one tower at once, and shows the booster first ("minutes later") and the ship "later".
- **Never done:** a ship catch. Every ship flight so far ended in the ocean or was lost. → Badges "ILLUSTRATION · PLANNED
  ATTEMPT" on every future-catch shot; "This hasn't happened yet." in the hook.

## 3. Visual reference bible (implemented in `source/src/assets/`)

Units in code: 1 unit = 0.1 m. One drawing per vehicle, reused in every shot (scaled, rotated, never redrawn).

| Item | Implemented as | Fixed values (never change between scenes) |
|---|---|---|
| Starship V3 ship (`Starship.tsx`) | 3/4 side view, windward heat-shield side LEFT (black hex tiles over ~half the body and the windward nose), steel elsewhere | Height 520 u (~52 m), Ø 90 u (9 m); ogive nose from y −330; 2 small forward flaps at y≈−392 (near nose base), 2 large aft flaps at y≈−78; 6 engines (3 RVac large outer, 3 SL centre; 2 RVac + 1 SL visible); flame always along the body axis |
| Super Heavy V3 (`SuperHeavy.tsx`) | Side view from the camera side of the catch; tower to the left | Height 720 u (~72 m), Ø 90 u; integrated vented hot-stage ring on top; **3 grid fins** (reported T layout): one facing camera, one facing away, one pointing away from the tower; chine on the left; 33 engines (bottom view `EngineMap.tsx`: 3/10/20) |
| Catch tower (`Tower.tsx`) | Side-view lattice, carriage, two arms (near arm drawn in front of the vehicle, far arm behind), QD arm, launch mount | Tower 1460 u (~146 m, "~45 stories"); catch centre line x = 230 u; V3 arm length 300 u (earlier arms 380 u, used only in the V2/V3 comparison); arm rail top = armY − 3 |
| Plan view (`Plan.tsx`) | Top-down tower, hinged arms, vehicle cross-section | Hinges at tower face (x = 60, z = ±56); arms swing 0–45°; ship cross-section shows flaps and the tiled half |
| Catch geometry | Vehicles are positioned **by their catch point**: contact means catch-point underside = rail top. The arms close **beneath** the catch points; they never squeeze the body | Booster catch point under the camera-facing fin (y −604); ship catch point near the forward flaps (y −348) — **conceptual** |

### Features whose exact design is NOT public (drawn conceptually and labelled)
- Ship-side catch interface (location, shape, number of contact points) → orange generic fittings, badge
  "CONCEPTUAL · SHIP CATCH INTERFACE", "EXACT DESIGN NOT PUBLISHED".
- Exact V3 grid-fin angular layout and catch-point shape → "fin layout approximate" note.
- Tower arm truss/actuator geometry, carriage internals, catch-damping mechanism → simplified, generic.
- Which tower(s) catch each stage on Flight 15, and the ship's return timing.

### Things the film does not claim
No catch tolerances, loads, speeds at contact, heat loads, abort thresholds, success probability (Musk's own estimate is
quoted and labelled "his estimate"), or trajectory specifics for Flight 15. Trajectory maps are "SCHEMATIC · NOT TO SCALE".

## 4. To verify against official SpaceX pages before the 4K master
1. V3 grid fins: count (3), layout, relocation, and catch-point wording (`spacex.com/updates/reusability`).
2. V3 chopsticks: "shorter" and "electromechanical main actuators" wording.
3. V3 stack height (≈124 m) and ship height (≈52 m).
4. Whether the ship catch on Flight 15 is at Pad 2 (Ship 42 fit check was at Pad 2) and whether the booster returns to the same tower.
5. The exact Musk / Shotwell quotes from the webcast recording (the on-screen quote is from press reporting).

## 5. Hook development (five concepts, scored 1–5)

| Concept | Frame-0 impact | 3-s curiosity | Clarity | Suspense | Accuracy | Distinct | Transition | Feasible | Total |
|---|---|---|---|---|---|---|---|---|---|
| A. Tracking beside the descending ship, pull back to the waiting arms, macro on the closing gap, freeze before contact: "This hasn't happened yet." | 5 | 5 | 4 | 5 | 5 (labelled) | 4 | 5 | 4 | **37 ✔** |
| B. Split screen: booster caught (2024) vs ship "?" | 3 | 4 | 5 | 2 | 5 | 2 | 4 | 5 | 30 |
| C. Macro only: catch point dropping onto the rail | 4 | 4 | 2 | 4 | 3 | 4 | 3 | 5 | 29 |
| D. Full 124 m stack splitting in two, both halves falling | 4 | 3 | 4 | 2 | 4 | 3 | 4 | 4 | 28 |
| E. Low angle from inside the tower, looking up through the arms | 5 | 4 | 2 | 4 | 4 | 5 | 3 | 2 (needs true perspective) | 29 |

Chosen: **A**, with B used as the immediate follow-up (0:15–0:31) to establish done vs. new.

## 6. Title options

| Title | Notes |
|---|---|
| **SpaceX Wants to Catch Its ENTIRE Rocket** (working) | Clear, curiosity, accurate ("wants"). **Kept.** |
| SpaceX Is About to Catch a Spaceship | Stronger verb but implies certainty and timing |
| Catching a Rocket Was Easy. This Is Harder. | Good contrast, but "easy" is wrong |
| Why Catching Starship Is So Much Harder Than the Booster | Accurate, weaker hook |
| The Catch No Rocket Has Ever Made | Strong, but vague without a thumbnail |

Competing coverage found (news articles; video search was not possible here) frames it as "double catch" news.
The differentiation here is the mechanism: *how* a tower catches a vehicle and why the ship is harder.

## 7. Real footage

Not used. Candidates identified but **not** usable without rights: SpaceX's Flight 5/7/8 catch webcasts and the 20 Oct
"Up Next: Ship Catch" simulation (SpaceX owns them; no reuse licence established), news agency clips (watermarked,
licensed). None were downloaded. Every historical event in the film is an original vector reconstruction labelled
"RECONSTRUCTION", "SCHEMATIC" or "ILLUSTRATION".
