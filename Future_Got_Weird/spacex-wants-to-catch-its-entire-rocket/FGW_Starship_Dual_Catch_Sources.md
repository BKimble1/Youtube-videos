# Sources, claim ledger and visual-reference bible

Research date: **21 Oct 2026**. Important access limit: this environment's network policy **blocked direct fetches** of
spacex.com, theverge.com, teslanorth.com, teslarati.com and Wikipedia. Everything below was verified through web-search
result summaries of those pages, not by reading the pages themselves. **Re-check the starred (★) items against the primary
pages before publishing.**

## 1. Sources

| # | Source | Used for |
|---|---|---|
| S1 | SpaceX, Starship V3 / reusability update (May 2026) — https://www.spacex.com/updates/reusability (via coverage: Sawyer Merritt summary on X, Space.com, Slashdot, Investing.com) | V3 booster: 4 → 3 grid fins, ~50 % larger, mounted lower, fins carry a catch point and are re-clocked for lift/catch; shorter chopsticks that move faster; integrated hot-stage ring |
| S2 | SpaceX, Starship design page — https://www.spacex.com/vehicles/starship/design (not reachable; secondary: newspaceeconomy.ca, Scientific American, payloadspace.com) | V3 stack ≈ 124.4 m (≈ 408 ft), 9 m diameter, 33 Raptor 3 on the booster |
| S3 | The Verge, 20 Oct 2026 — https://www.theverge.com/science/1014913/… ; TeslaNorth, 20 Oct 2026; Teslarati "SpaceX showcases exactly how it plans to catch Starship next month"; KeepTrack brief 21 Oct | Musk on the Q3 earnings call: Flight 15 "next month" will attempt to catch booster and ship; "first time that an orbital launch vehicle has been fully recovered"; "more likely than not"; ~80 s SpaceX animation shown (belly-flop, flaps, swing vertical, caught by the arms) |
| S4 | Wikipedia "Starship flight 15" (via search) | Booster 22 + Ship 42; Orbital Launch Pad 2; NET 8 Nov 2026 (tracker date, not official); landing sites listed TBA ★; Shotwell: license expected to include RTLS + tower catch for both stages |
| S5 | NASASpaceflight, Sept 2026 "Ship 42 wraps chopsticks tests"; Startup Fortune; Starlust | Ship 42 lifted by Pad 2 chopsticks into an apparent catch position on 11–12 Sept, pins/arms worked, held, lowered to the QD arm |
| S6 | NASASpaceflight (reported via search) | Ship 42 engines removed before static fire; sent back for another cryogenic test ★ (date of report not confirmed) |
| S7 | NASASpaceflight "Ship 41 makes it to orbit" (Sept 2026); Wikipedia "Starship flight 14"; Space.com live blog | Flight 14: ship reached orbit for the first time; splashdown in the North Pacific ≈ 3 h 08 min after launch; booster splashed in the Gulf (no catch) |
| S8 | NASASpaceflight Mar 2026 "Ship 39 preflight"; TechTimes Jul 2026 | Ship catch points: newly designed hard points near the forward flaps (exact geometry not published) |
| S9 | Scientific American / Flying / Seradata, Oct 2024 | Flight 5, 13 Oct 2024: first booster catch, ≈ 6 min 56 s after launch |
| S10 | Background knowledge, consistent with S9 coverage ★ | Booster catches on Flights 7 (Jan 2025) and 8 (Mar 2025); Flight 6 (Nov 2024) catch called off when automated health checks of tower hardware failed, booster diverted to the Gulf; Flight 9 (May 2025) reflew the Flight 7 booster |
| S11 | Space.com / SpaceQ / Spaceflight Now on Flights 12–13 | V3 debut May 2026 from Pad 2; early V3 boosters deliberately sent to Gulf splashdowns; 13 landing-burn engines |

## 2. Claim ledger (narration)

| Line | Claim | Status |
|---|---|---|
| h2, a5 | SpaceX says it will try to catch both stages next month (Flight 15) | Reported statement by Musk (S3). Not confirmed by an official mission page. Film labels every such shot "planned" |
| h3, b8 | Booster caught with the tower more than once since Oct 2024 | S9, S10 |
| a1 | ≈ 400 ft stacked | S2 (124.4 m ≈ 408 ft) |
| a2 | 33 engines | S2 |
| a4 | Every ship that has flown ended its flight in the sea | No ship has been recovered; flights ended in splashdown or were lost over water. Wording "ended its flight there" ★ |
| a5 | "first time an orbital rocket has been fully recovered" | Musk quote, attributed on screen (S3) |
| b1–b4 | separation, flip, boostback, unpowered descent with grid fins, landing burn, divert to tower | General, well-documented booster profile; 13 centre engines for the landing burn (S11) |
| b6–b7 | the booster settles onto the arms at load points near its top; weight carried at a few contact points | Documented catch method; V3 catch points on the fins (S1) |
| b9–b10 | V3: 3 larger fins, catch points on fins; shorter, faster arms | S1 |
| c2 | booster home in about seven minutes | Flight 5 catch 6 min 56 s (S9) |
| c4 | ≈ 17,000 mph | Physics (LEO ≈ 7.8 km/s ≈ 17,400 mph) |
| c5 | last flight reached orbit for the first time; Pacific ≈ 3 h after launch | S7 |
| d1–d6 | belly-first reentry behind tiles, plasma, four flaps, belly flop, flip and landing burn | General, well documented; flip + burn previously flown into the ocean |
| e4 | ship catch points near the forward flaps; hardware not shown in detail | S8; film draws them as small generic blocks and labels the view "conceptual" |
| e5 | September rehearsal with the actual Flight 15 ship on the new tower | S5 |
| f4–f5 | earlier flight: catch called off by automated tower checks, booster into the Gulf | Flight 6 (S10) ★ |
| f7 | "more likely than not"; ship sent back for more testing; date could move | S3, S6 ★ |
| g6 | no ship has been reflown | No reflight reported as of 21 Oct 2026 |

Not claimed anywhere (deliberately): catch tolerances, forces, heat loads, success probability beyond Musk's quote, which
tower catches the booster, whether both stages return to the same tower, the ship's return time on Flight 15.

## 3. Visual-reference bible (what the asset system encodes)

Code: `source/src/assets/vehicles.tsx`, `tower.tsx`. One geometry source for every shot.

| Item | Encoded | Must never change |
|---|---|---|
| Diameter | 9 m both stages | yes |
| Booster V3 | 72 m; 3 grid fins (azimuths 30/150/270°), span 4.8 m, mounted ≈ 9.5 m below the top; catch block at each fin root; vented integrated hot-stage ring; raceway on one side; engine skirt | fin count 3, fin height, ring at top |
| Booster V1/V2 (Flights 5–8 only) | 71 m; 4 smaller fins near the top; two separate catch pins; labelled "earlier booster" whenever shown | only used for historical events |
| Ship | 52 m (34 m barrel + 18 m ogive); windward tiles; two small forward flaps (leeward-shifted), two large aft flaps; 3 sea-level + 3 vacuum bells; catch blocks just below the forward flaps (approximate) | flap count/placement, tile side |
| Ship views | `profile` (flap axis toward camera, used for every tower contact), `belly` (all four flaps at the edges), `three` (beauty, stacked) | tile side matches view |
| Tower | 12 m lattice, 146 m; carriage on rails; two arms hinged on the carriage face, rail on top; arms open by rotating about vertical hinges (projected length L·cosθ) | arms never pass through a vehicle; near arm in front, far arm behind |
| Arm length | 24 m new / 30 m old — **proportions only; actual lengths not published** | labelled on screen |
| Launch mount | simplified table over a trench, 14 m | — |

Not publicly confirmed (drawn as concept, labelled): exact ship catch-point geometry; arm lengths; Pad 2 mount design
details; Flight 15 trajectories and timing.

## 4. Hooks considered (chosen: E)

| | Concept | Notes |
|---|---|---|
| A | Tracking beside the descending ship, freeze before contact | Strong action, clear; generic if alone |
| B | Looking up from inside the tower as the ship fills the frame | Spectacular but hard to read at frame 0 for a new viewer |
| C | Split screen: 2024 booster catch vs ship catch | Clear premise, low action at frame 0 |
| D | Macro on the catch point closing on the rail | Great tension, illegible without context |
| **E** | **A → D → C chained: frame 0 tracks the whole ship with flame beside the open arms, pushes into the catch-point gap, freezes before contact ("hasn't happened yet"), match-cuts to the real 2024 booster catch, tilts to the ship returning from orbit, split + title** | Chosen: legible at frame 0, honest disclosure inside the suspense beat, sets up the booster-vs-ship contrast |

## 5. Footage research

No third-party footage is used. SpaceX webcast/X clips (booster catches, the Flight 15 animation) and news-agency video
exist, but reuse rights are not established and the pages could not be opened from this environment, so every historical
event is an original vector reconstruction labelled "illustrated reconstruction".

## 6. Titles considered (chosen: keep the working title)

1. **SpaceX Wants to Catch Its ENTIRE Rocket** — keeps the "whole rocket" stakes; pairs with "CATCH BOTH?" on the thumbnail. **Chosen.**
2. Catching a Rocket Was the Easy Part — strong, but undersells the news hook.
3. Why Catching Starship Is So Much Harder — clear, less urgent.
4. SpaceX Is About to Catch a Spaceship Falling From Orbit — longer; risks reading as already done.
5. The Tower That Catches Spaceships — evocative, vague about what is new.

Competitor scan was not possible from this environment (YouTube not reachable); differentiation rests on the mechanical
explanation of the catch interface rather than the headline.
