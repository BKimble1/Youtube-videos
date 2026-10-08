# Video 02 storyboard: How Cameras See Around Corners

Planning storyboard tied to the script's line IDs (`script/SCRIPT.md`). Times are filled from the final narration
(`source/src/data/timeline.json`) once it exists; the shot structure, teaching jobs and evidence are fixed here. Every
shot has a viewer question (Q), an action (A) and a consequence (C). Claim IDs refer to `research/claims.csv`.

Sets and kit: `RoomSet` (oblique room ↔ plan view, `lib/room.ts`), optics (`lib/optics.ts`, `components/v02/Optics.tsx`),
cast (`components/v02/Cast2.tsx`, tokens, `HandheldSensor`), `WarehouseSet` + `DeliveryBot`, evidence boards drawn from
`research/code_reproduction/out/*.json`. **R#** marks a Runway insert candidate (start and end frames rendered from
Remotion so the insert begins and ends on the rig; fallback = the same action with `Cast2`).

Jokes (four, spaced): J1 smug hider (S1.1), J2 the mirror (S2.1), J3 one arc relief → two arcs dismay (S4.2–S4.3),
J4 he closes the gap, the checker simply walks round (S8.3).

## S1 · Cold open: the impossible view (s01–s08) · room view

| Shot | Lines | Q / A / C | Picture | Evidence and text | Camera, sound |
|---|---|---|---|---|---|
| S1.1 | s01 | Q: who is hiding from what? A: the guesser tiptoes in from the right and settles behind the coral partition, hands on hips, smug. C: the checker's sight line (dashed, from her eyes) stops at the partition. **J1** | room view; checker at left with the handheld sensor aimed at the relay wall | none | locked wide; tiptoe steps, a smug "hm" exhale. **R1** |
| S1.2 | s02 | Q: what is the sensor looking at? A: the sensor's pale fan lights a patch of the blank wall. C: nothing of him is in its view | push 8% toward checker + wall patch | chip "time-of-flight sensor" deferred to S1.6 | soft sensor hum begins (motif) |
| S1.3 | s03 | Q: so how could it know? A: the checker's readout swings up and becomes a full-screen evidence board: the authors' released top-down layout (wall, occluder, sensor) and the tracked position moving along its measured path. C: the guesser, in a cut-back, freezes mid-smirk | evidence board (taped card), drawn from `fig3_tracking_trajectory_topdown.json` (ours seed 0 + stored means) | "Real measurements · 2026" headline; conditions chip: "authors' released data · evaluation-kit sensor, held still · tracked with the authors' code"; source chip "Somasundaram et al., Nature 2026" | push into the board; paper slap; a tiny "busted" sting on the cut-back. C02, C03 |
| S1.4 | s04 | Q: through the partition? A: a ghost straight line from the sensor hits the partition and stops ("blocked"); then a path appears around it by way of the wall | room view, optics in plan space at 1.2 m height | "blocked" mark | partition thunk on the blocked line. C04 |
| S1.5 | s05 | Q: what path? A: a slowed pulse leaves the sensor, hits the wall (scatter fan), a little reaches the guesser, a tiny bit returns via the wall to the sensor; later segments thinner and paler | room view | chip "slowed down" | pulse motif ticks at each bounce. C04, C05 |
| S1.6 | s06–s07 | Q: how much later? A: two pulses race on a mini arrival timeline: the wall's echo arrives first, the roundabout one later; then a webcam prop tries to time it (a spinning question mark) and is replaced by the sensor close-up: emitter window, detector window, readout | inset timeline; sensor close-up (HandheldSensor drawn large) | "~7 ns later · illustrative"; label "time-of-flight sensor (a small LiDAR)"; tiny icons: a phone, a robot ("where parts like this live") | J (light): webcam's sad blip. C06, C07 |
| S1.7 | s08 | Q: why does timing matter? A: a ruler of light: 1 ns = 30 cm; the extra delay stretches into an extra distance from the wall spot | ruler across the room view | "about 30 cm per nanosecond"; "extra delay → extra distance" | settle; the guesser glances at the wall, uneasy. C06 |

## S2 · The wall relays information (s09–s12) · room view → close-ups

| Shot | Lines | Q / A / C | Picture | Evidence and text | Camera, sound |
|---|---|---|---|---|---|
| S2.1 | s09–s10 | Q: why a plain wall? A: the relay wall flips into a mirror panel; one ray reflects at equal angles; the guesser appears in the mirror, the checker sees him; he ducks. C: orderly reflection keeps the picture intact. **J2** | room view with a mirror panel replacing the wall section | angle marks "in = out" | mirror "ting"; the duck is a quick squash. C08 |
| S2.2 | s11 | Q: what does paint do? A: zoom into the wall surface at a tiny scale: bumps throw one incoming ray into many directions | magnified wall cross-section | label "rough at a tiny scale" | zoom cut; scatter shimmer (subtle). C09 |
| S2.3 | s12 | Q: is the picture hidden in the wall? A: a postcard of the guesser shreds into confetti, swirls; "worse than that": the pieces blur into a smear that collapses into a single row of timing bars | flat graphic on paper | "metaphor"; "what survives: timing" | paper shred; quiet. C10 |

## S3 · The faint echo (s13–s16) · plan view + real data

| Shot | Lines | Q / A / C | Picture | Evidence and text | Camera, sound |
|---|---|---|---|---|---|
| S3.1 | s13 | Q: what happens on the useful path? A: the five stops light up in order (sensor, wall, person, wall, sensor); at each bounce most of the light fans away and fades | plan view (from the room via a quick tilt), `LightPath` + `ScatterFan` with falloff | "slowed down" | four soft ticks. C05, C11 |
| S3.2 | s14 | Q: so what reaches the sensor? A: an arrival histogram builds: a tall wall bar, a tiny late bump | `ArrivalHistogram` | "illustrative · not to scale" | C11 |
| S3.3 | s15–s16 | Q: is that real? A: the illustration is replaced by the authors' raw data (centre zone, log axis): wall flash, then a small bump ~3.7 ns later; the bump is ringed and its extra path labelled | evidence board drawn from `fig1_ams_wall_peak_vs_late_return.json` | "Real measurements · authors' released data"; conditions chip: "a different sensor (3×3 zones) · log scale"; callout "hundreds of times weaker" and "≈ 1.1 m of extra path" | marker circle sound. C12, C06 |

## S4 · Timing becomes geometry (s17–s24) · plan view (layout frame A)

| Shot | Lines | Q / A / C | Picture | Evidence and text | Camera, sound |
|---|---|---|---|---|---|
| S4.1 | s17 | Q: where can he be? A: the signature tilt: room view folds into the plan view; characters become tokens; the sensor's single wall spot W1 is marked | `RoomSet` tilt 0→1 | chip "simplified picture (2D)": "sends and listens at one spot" | whoosh-free; paper settle. C13 |
| S4.2 | s18–s19 | Q: what does one delay tell us? A: a ruler swings out from W1 to the measured distance and sweeps an arc in front of the wall. C: cut to the room: the guesser relaxes and leans on the partition. **J3a** | plan view; cutaway to room | "distance known · direction unknown" | arc draw; relieved sigh. C14 |
| S4.3 | s20 | Q: and a second spot? A: W4 lights, a second arc draws; they cross at his token; the mirror crossing behind the wall greys out ("behind the wall: impossible"). C: cut-back: his smile drops. **J3b** | plan view; cutaway | | a small "uh-oh" sting. C15 |
| S4.4 | s21 | Q: is it a point? A: the arcs thicken into bands; their overlap fills as a soft region around him | `Band`, `PossibleCloud` | "illustrative band (±3.75 cm)" | C16 |
| S4.5 | s22 | Q: what helps? A: the two listening spots slide together: the region stretches long; slide apart: it narrows | animated spots, live region | "bunched → long and blurry"; "spread out → narrower" | C17 |
| S4.6 | s23 | Q: how does a computer do it? A: hundreds of candidate dots scatter over the hidden side; each is tested against all the timings; poor fits fade, good fits cluster on him | particle cloud (seeded) | card "assumption: one small object" | soft ticks thinning out. C18 |
| S4.7 | s24 | Q: so what do we get? A: the cluster settles into a likely-location blob; a photo frame tries to frame him and is crossed out | | "likely location · rough shape · not a photograph" | C19 |

## S5 · What came before (s25–s29) · history shelf

| Shot | Lines | Q / A / C | Picture | Evidence and text | Camera, sound |
|---|---|---|---|---|---|
| S5.1 | s25–s26 | Q: who did this first? A: a museum shelf; the camera trucks to "2012 · MIT": an illustrated lab table with an ultrafast laser, a streak camera and a tiny mannequin behind a wall; a sketchy 3D outline of the mannequin rises | `HistoryShelf` illustration | plate "2012 · MIT"; "illustration based on Velten et al. 2012" | shelf creak. C20, C21 |
| S5.2 | s27 | Q: what changed in 2018? A: "2018 · Stanford": laser and detector side by side aim at one spot that hops across the wall in a raster; a laptop shows "1 s" while a wall clock shows the capture minutes ticking | illustration | "≈ 1 s to reconstruct · ≈ 7 min to capture (exit-sign test)" | clock ticks. C22, C23 |
| S5.3 | s28 | Q: and then? A: "2021 · Wisconsin + Milan": a purpose-built detector strip and a monitor playing a live, blobby video of ordinary objects at "5 frames/s" | illustration | "ordinary objects · live" | C24 |
| S5.4 | s29 | Q: so? A: a velvet rope clips across the shelf: "research equipment" | | sign "research equipment" | rope clip. C25 |

## S6 · 2026: small sensors (s30–s38)

| Shot | Lines | Q / A / C | Picture | Evidence and text | Camera, sound |
|---|---|---|---|---|---|
| S6.1 | s30 | Q: what's new? A: a tiny sensor module drops onto the shelf beside the big rigs; comic scale contrast | shelf | plate "2026 · MIT + Dartmouth"; "consumer-grade time-of-flight sensors" | tiny clink. C26, C27 |
| S6.2 | s31 | Q: why is that hard? A: three quick problems on the module: a dim beam; a coarse pixel grid ("about 100 pixels" on the smartphone-grade device); the checker's hand jiggles it | close-up + checker's hand | "weak laser"; "about 100 pixels"; "jiggles" | jiggle rattle (comic, small). C28 |
| S6.3 | s32 | Q: what's the fix? A: a stack of faint, noisy frames slides together into one cleaner estimate | burst metaphor | "many weak frames → one estimate" | soft shutter clicks. C29 |
| S6.4 | s33 | Q: what goes wrong? A: plan view: the sensor wobbles, its wall spots shift; the person steps; naive averaging smears two positions into a long streak | plan view, frames A/B1/B2 from layout | "just averaging → smear (illustrative)" | C30 |
| S6.5 | s34 | Q: how does motion help? A: each wobble adds new listening spots (new arcs) and the region tightens; each step moves the predicted cloud with him | plan view | "motion tracked → useful (illustrative)" | C30, C31 |
| S6.6 | s35 | Q: does it work on real data? A: evidence board: the authors' released evaluation-kit data, the tracked position moving behind the partition | `fig3_tracking_trajectory_topdown.json` | conditions chip (as S1.3) plus "kit: well under US$100 (authors)"; source chip | C02, C32 |
| S6.7 | s36 | Q: shapes too? A: the U-shaped reconstruction resolves from noise as the 36 known positions tick through | `fig4_ams_U_backprojection.json` | "a different sensor · 36 known positions · object held still" | C33 |
| S6.8 | s37 | Q: what are the conditions? A: the checker pins three fine-print cards to the board | cards | "reflective material on many targets"; "known sensor positions"; "flat wall + empty-room scan" | pin taps. C34–C36 |
| S6.9 | s38 | Q: is it confirmed? A: a chip "reported: person in ordinary clothes · 30 frames/s capture"; a code-brackets icon "code public"; a stamp "independent reproduction: none found (Oct 2026)" | board | as quoted | stamp. C37, C38 |

## S7 · Usefulness and limits (s39–s43) · warehouse

| Shot | Lines | Q / A / C | Picture | Evidence and text | Camera, sound |
|---|---|---|---|---|---|
| S7.1 | s39 | Q: what could it do? A: a delivery robot rolls toward a blind aisle corner | `WarehouseSet` front view | "illustration" | motor whirr, wheel squeak. **R3** |
| S7.2 | s40 | Q: how would it help? A: tilt to plan: the robot's sensor pings the junction wall; a faint cloud appears in the other aisle where a person walks | plan view | "potential use" | pulse motif. C39 |
| S7.3 | s41 | Q: what would it know? A: the cloud is labelled "something moving"; the robot brakes with a cautious squint | front view | "slow down · not who" | brake hiss. C19, C39 |
| S7.4 | s42 | Q: what's hard? A: four quick gags: pulses fade before the far wall (range); a dark wall swallows the light, a glossy one sends it off sideways; the sun floods the sensor; a tiny chip sweats over a heap of numbers | vignette strip | "early-stage prototype (authors)" | C40 |
| S7.5 | s43 | Q: is it a safety system? A: the robot creeps on carefully | front view | "not a safety system" | C41 |

## S8 · Payoff (s44–s47) · room view

| Shot | Lines | Q / A / C | Picture | Evidence and text | Camera, sound |
|---|---|---|---|---|---|
| S8.1 | s44 | back in the room: the guesser, still hiding, now nervous | room view | | |
| S8.2 | s45 | Q: what gave him away? A: all the paths replay, threading around the partition by way of the wall | room view optics | | soft motif. C04 |
| S8.3 | s46 | Q: how would you really hide? A: he drags the partition up to the wall, closing the gap; the paths now stop at it; the readout goes blank; smug again… and the checker simply leans around the partition and looks at him. **J4** | room view | | partition scrape, readout blip-off, a deadpan beat. **R4** |
| S8.4 | s47 | end card: wordmark, "new episodes twice a week", end-screen space | brand card | | logo hit, music out |

## Runway candidates (decided after the first priced job)

| ID | Shot | Action (one clear action, locked camera) | Start / end frames | Fallback |
|---|---|---|---|---|
| R1 | S1.1 | guesser tiptoes two steps into the hiding spot and settles smug | Remotion room-view stills: guesser at entry / at hiding spot, smug | `Cast2` tiptoe + settle |
| R3 | S7.1 | delivery robot rolls toward the corner and slows | warehouse stills: robot far / robot near the corner | `DeliveryBot` roll + brake |
| R4 | S8.3 | guesser pushes the partition to the wall | stills: partition with gap / closed | rig push with `reach` on the partition |
| R2 (optional) | S4.2 | guesser leans on the partition, relaxed, then stiffens | room-view stills | pose blend |
