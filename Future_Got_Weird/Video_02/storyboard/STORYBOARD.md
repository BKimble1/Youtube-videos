# Video 02 storyboard: How Cameras See Around Corners (v2)

Storyboard for script v2 (`script/SCRIPT.md`, 48 lines). Times come from `source/src/data/timeline.json`: provisional
until the final narration is assembled, then measured; scenes cue on words (`at('s05', 'flash')`), so they follow the
final audio automatically. Every shot has a viewer question (Q), an action (A) and a consequence (C). Claim IDs refer to
`research/claims.csv`.

**Kit:** `RoomSet` + `lib/room.ts` (oblique room view ↔ plan view, one projection), `lib/optics.ts` +
`components/v02/Optics.tsx` (paths, fans, arcs, bands, cloud, histogram, ruler), `Cast2` (walk, tiptoe, crouch, smug,
busted, deadpan), `Tokens`, `HandheldSensor`, `WarehouseSet` + `DeliveryBot`. **Geometry:** `src/data/layout.json` (synced
from the verified research layout). **Evidence:** `src/data/evidence/*.json` (the authors' released data as plotted
numbers). **R#** = Runway insert candidate: start and end frames are rendered from this Remotion shot, so the Remotion
version is also the fallback.

**Continuity rules from the review.** The kit sensor stands on a small tripod stand for acts 1–3 (the opening data was
captured with the sensor held still); the checker stands beside it, reading its back readout; she lifts it at s32.
Light paths in the room are drawn at RAISED_TILT 0.10, or at tilt 0. Every leg that passes the partition goes behind
its END (far or near vertical edge, ≥ 24 px below the corner), never across its top (`assertAroundTheEnd`, run at
module load for every tilt the shot draws light at). Light behind the screen or behind a person is hidden exactly
(`partitionHides`, `figuresHide`). The 'seen from above' PlanCard runs the same paths on the same schedule, so 'round
the end, by way of the wall' reads in plan. The first full fold to plan view is saved for s17.

Jokes: J1 s01 smug hider · J2 s10 the mirror · J3 s19→s20 one arc relief, two arcs dismay · J4 s47 he closes the gap,
she simply leans round.

## S1 · Cold open: the impossible view (s01–s08) · room view

| Shot | Lines | Q / A / C | Picture | Text on screen | Camera, sound |
|---|---|---|---|---|---|
| S1.1 | s01 | Q: who is hiding from what? A: the guesser tiptoes in from the right and settles into his spot behind the coral partition, hands on hips, smug. C: the checker's dashed sight line stops at the partition. **J1** | room view (tilt 0): checker at left beside the sensor on its stand | none | locked wide; tiptoe steps; a smug exhale. **R1** |
| S1.2 | s02 | Q: what is the sensor looking at? A: the readout blinks on "sensor"; a pale fan lights a patch of blank wall. C: nothing of him in its view | push 8% toward the sensor and patch | none | soft sensor hum (motif) |
| S1.3 | s03 | Q: so how could it know? A: the readout swings up and becomes a full-screen evidence board: the authors' released layout seen from above (wall top, sensor left, partition, person right; x mirrored to match our room), and the estimated position moving along its measured path. C: cut-back: the guesser freezes mid-smirk | evidence board (taped card) drawn from `evidence/tracking_topdown.json` | headline "Real measurements · published 2026"; marker label "estimated position"; conditions chip "authors' released data · evaluation-kit sensor, held still · processed with the authors' code"; source chip "Somasundaram et al., Nature 2026 · plot mirrored to match our room" | push in; paper slap; tiny "busted" sting. C02, C03 |
| S1.4 | s04 | Q: through the partition? A: camera rises (RAISED_TILT 0.10) and the "seen from above" plan card comes in beside the room, showing the gap at the wall; a ghost straight line from the sensor hits the partition and stops ("blocked"); then a path appears around the end of the partition via the wall | raised room view | "blocked" | partition thunk. C04 |
| S1.5 | s05 | Q: what path? A: a slowed pulse leaves the sensor, hits the wall (scatter fan), part reaches him, a tiny bit returns via the wall; later segments thinner and paler | raised room view | "slowed down" · "invisible flash (shown for clarity)" | pulse tick at each bounce. C04, C05, C43 |
| S1.6 | s06–s07 | Q: later than what? A: two pulses race on a mini arrival timeline: the quick wall bounce lands first, the roundabout one later; a webcam prop tries to time it (question mark spins, it shrugs) and is replaced by the sensor close-up: two windows, a stopwatch glyph on the readout | inset timeline; sensor close-up | "≈ 7 ns later · illustrative"; label "time-of-flight sensor: times its own light's round trip" | webcam's sad blip. C06, C07 |
| S1.7 | s08 | Q: why does timing matter? A: a ruler of light across the room: 1 ns = 30 cm; the extra delay stretches into an extra distance from the wall spot | ruler | "1 nanosecond ≈ 30 cm ≈ 1 ft"; "extra delay → extra distance" | settle; he glances at the wall, uneasy. C06 |

## S2 · The wall relays information (s09–s12) · room view and close-ups

| Shot | Lines | Q / A / C | Picture | Text | Camera, sound |
|---|---|---|---|---|---|
| S2.1 | s09 | Q: why a plain wall? A: a mirror bench: one ray hits a small mirror and leaves at the same angle | close-up bench | "in = out" angle marks | C08 |
| S2.2 | s10 | Q: what would a mirror on our wall do? A: on "here", a mirror panel slides onto the wall at x ≈ 1.9–2.6 m (the reflection point for sensor → him is x ≈ 2.14 m); over the checker's shoulder we see his reflection; he ducks fast. **J2** | raised room view | none | mirror "ting"; duck squash. C08 |
| S2.3 | s11 | Q: what does paint do? A: magnified wall cross-section: one ray hits the bumps and sprays out every which way, like a tiny lamp | close-up | "rough up close" | C09 |
| S2.4 | s12 | Q: is his picture hidden in the wall? A: a postcard of him shreds into confetti; "worse than that": cut to the room, where paths from his head, shoulder and feet, via different wall spots, merge into one blip at the sensor, which drops into a row of timing bars | flat graphic → room | "metaphor"; "what survives: timing" | paper shred. C10 |

## S3 · The faint echo (s13–s16) · raised room view, then real data

| Shot | Lines | Q / A / C | Picture | Text | Camera, sound |
|---|---|---|---|---|---|
| S3.1 | s13 | Q: what happens on the useful path? A: a cluster of light dots travels the five stops; at each bounce most of the dots scatter away and fade (illustrative) | raised room view (no full tilt) | "slowed down · illustrative" | four soft ticks. C05, C11 |
| S3.2 | s14 | Q: so what reaches the sensor? A: an arrival histogram builds as blocks drop into time slots: a tall stack for the one-bounce wall echo, a tiny late one for his three-bounce echo | histogram card | "1 bounce" / "3 bounces"; "illustrative" | block drops. C11 |
| S3.3 | s15–s16 | Q: is that real? A: the card is replaced by the authors' raw data (centre zone) on a linear axis: one tall spike; a magnifier slides over the tail and stretches it until a small bump appears ~3.7 ns after the wall echo; the bump is ringed, its extra path labelled | evidence board from `evidence/ams_wall_vs_echo.json`; a small 3×3 sensor box icon (the same box returns in S6.7) | headline "Real measurements"; conditions "same team · a different sensor (3×3 zones) and hidden object"; callouts "hundreds of times weaker (this capture)", "≈ 1.1 m extra path" | marker circle. C12, C06 |

## S4 · Timing becomes geometry (s17–s24) · plan view (layout frame A)

| Shot | Lines | Q / A / C | Picture | Text | Camera, sound |
|---|---|---|---|---|---|
| S4.1 | s17 | Q: where can he be? A: the signature fold: the room folds flat into the plan view; characters become tokens; one wall spot (W1) lights | `RoomSet` tilt 0→1 | chip "simplified picture (2D)" held through s22; "flashes and listens at one spot" | paper settle. C13 |
| S4.2 | s18–s19 | Q: what does one delay tell us? A: a ruler swings out from W1 to the measured distance and sweeps an arc on this side of the wall. C: face inset: he relaxes, leans on the partition. **J3a** | plan + face inset | "distance known · direction unknown" | arc draw; relieved sigh. C14 |
| S4.3 | s20 | Q: and a second spot? A: W4 lights, a second arc; they cross at his token; faint back halves of both circles cross again behind the wall and grey out. C: inset: his smile drops. **J3b** | plan + inset | "behind the wall: impossible" | small "uh-oh" sting. C15 |
| S4.4 | s21 | Q: is it a point? A: arcs thicken into bands; their overlap fills as a small patch | `Band`, `PossibleCloud` | "illustrative band (±3.75 cm)" | C16 |
| S4.5 | s22 | Q: what helps? A: two close spots (W2, W3): the patch is long and blurry; the spots slide apart (W1, W4): it shrinks | live region | "close → long and blurry" → "spread out → smaller" | C17 |
| S4.6 | s23 | Q: how does a computer do it? A: hundreds of candidate dots scatter over the hidden side; each predicts echoes; poor matches fade, good ones cluster on him | seeded particles | card "assumption: one small object" | thinning ticks. C18 |
| S4.7 | s24 | Q: so what do we get? A: the cluster settles into a likely-location blob; a photo frame tries to frame him and is crossed out | | "likely location · rough shape · not a photograph" | C19 |

## S5 · What came before (s25–s29) · history shelf

| Shot | Lines | Q / A / C | Picture | Text | Camera, sound |
|---|---|---|---|---|---|
| S5.1 | s25–s26 | Q: who did this first? A: the plan sheet rolls up and lands on a museum shelf; truck to "2012 · MIT": a lab table with a boxy laser, mirrors and a big streak-camera box aimed at a small wall; a tiny wooden mannequin behind a screen; a sketchy 3D outline of the mannequin rises | illustrated exhibit | plate "2012 · MIT"; labels "ultrafast laser", "streak camera"; "illustration based on Velten et al. 2012" | shelf creak. C20, C21 |
| S5.2 | s27 | Q: what changed? A: "2018 · Stanford": one spot (the same glyph as our W1) hops across a wall in a raster; a laptop shows "1 s" while a wall clock ticks to about 7 minutes | illustrated exhibit | "reflective exit sign: ≈ 1 s to rebuild · ≈ 7 min to measure" | clock ticks. C22, C23 |
| S5.3 | s28 | Q: and then? A: "2021 · Wisconsin + Milan": a strip detector and a powerful laser; a monitor plays a live, blobby video of ordinary objects; a "5 frames/s" counter ticks | illustrated exhibit | "live · ordinary objects · 5 frames/s" | C24 |
| S5.4 | s29 | Q: so? A: a velvet rope clips across the three exhibits; on "cheap sensor", a small side card at the end of the shelf: a fingertip-sized sensor board on a little stool | sign "research equipment"; side card "2021 · hidden objects tracked with a cheap sensor (Callenberg et al.) · illustration" | | rope clip. C25, C45 |

## S6 · Small sensors, published 2026 (s30–s35) · and S7 · Real results (s36–s39)

| Shot | Lines | Q / A / C | Picture | Text | Camera, sound |
|---|---|---|---|---|---|
| S6.1 | s30 | Q: what's new? A: the checker reaches in and sets her small sensor on the empty fourth plinth (comic scale) | shelf + checker's arm | plate "published 2026 · MIT + Dartmouth"; "time-of-flight sensors (LiDAR)" | tiny clink. C26, C27 |
| S6.2 | s31 | Q: can my phone do it? A: a generic phone slides in, its screen shows a padlock over "raw data" | | "not on your phone (yet): raw data kept private" | lock click. C42 |
| S6.3 | s32 | Q: why is that hard? A: a dim beam (fainter echo); a separate phone-shaped research module with a 10×10 dot grid ("about 100 pixels"); she lifts her sensor off its stand and it jiggles | close-ups | "weak laser → fainter echo"; "smartphone-grade device (team's own): ≈ 100 pixels"; | jiggle rattle. C28 |
| S6.4 | s33 | Q: what's the fix? A: a stack of dim, noisy frames slides together into one clearer estimate | burst metaphor | "our analogy: night mode" | shutter clicks. C29, C44 |
| S6.5 | s34 | Q: what goes wrong? A: a long-exposure photo of the guesser walking: a smear; in plan, two positions blur together when frames are just averaged | plan + photo gag | "plain averaging → smear (illustrative)" | C30 |
| S6.6 | s35 | Q: how does motion help? A: split plan: left, known sensor positions: each jiggle adds listening spots and the patch shrinks; right, sensor still: the predicted cloud follows each step | plan, layout frames A/B1 and H_A→H_B | "one unknown at a time"; "known sensor positions" / "sensor still" | C30, C31, C35 |
| S6.7 | s36 | Q: does it work on real data? A: the plan board morphs into the opening's evidence board; the estimated position runs again | `evidence/tracking_topdown.json` | conditions chip as S1.3; "kit: 16 listening spots · under US$100 (authors)" | C02, C32 |
| S6.8 | s37 | Q: shapes too? A: the 3×3 box from S3.3 steps through a 6×6 raster of known positions; the U resolves from noise | `evidence/ams_U.json` | "same 3×3 sensor · 36 known positions · object held still" | hold on the U. C33, C12 |
| S6.9 | s38 | Q: was that the whole story? A: acted: a reflective strip is stuck on a target and the returning pulse fattens; "files don't say" stamp on the clip's card; empty-room scan: the checker shoos the guesser out, the readout records the empty room, he sidles back | room + board | "reflective material: far more light back"; "clip: clothing not recorded"; "flat wall + empty-room scan" | strip rip; shoo. C34, C36, C02 |
| S6.10 | s39 | Q: is it confirmed? A: the guesser walks behind the partition while a film strip ticks; an empty museum slot labelled "independent reproduction" | | "reported: person in ordinary clothes · 30 frames/s capture"; "code public · no independent reproduction found (Oct 2026)" | C37, C38 |

## S8 · Usefulness and limits (s40–s44) · warehouse

| Shot | Lines | Q / A / C | Picture | Text | Camera, sound |
|---|---|---|---|---|---|
| S7.1 | s40 | Q: what could it do? A: the delivery robot rolls toward a blind aisle corner | `WarehouseSet` front | "illustration" | motor whirr. **R3** |
| S7.2 | s41 | Q: how would it help? A: tilt to plan: the robot's sensor pings the junction wall; a faint blob appears in the other aisle, where a person (the accepted "person" cast member) walks | plan | "potential use" | pulse motif. C39 |
| S7.3 | s42 | Q: what would it know? A: the blob reads "something moving"; the robot brakes with a cautious squint | front | "slow down · not who" | brake. C19, C39 |
| S7.4 | s43 | Q: what's hard? A: a 2×2 strip, one tile per beat: pulses fade before the far wall; a dark wall swallows light / a shiny one bounces it away; the sun floods the sensor; a tiny chip sweats over numbers | 2×2 vignette | "short range" · "dark or shiny walls" · "bright sunlight" · "fast math on small hardware"; "early-stage prototype (authors)" | C40 |
| S7.5 | s44 | Q: is it a safety system? A: the robot creeps on; its bumper still does the stopping | front | "not a safety system" | C41 |

## S9 · Payoff (s45–s48) · room view

| Shot | Lines | Q / A / C | Picture | Text | Camera, sound |
|---|---|---|---|---|---|
| S8.1 | s45 | back in the room: the guesser, still hiding, nervous | room view | | |
| S8.2 | s46 | Q: what gave him away? A: raised view: all the paths replay, threading through the gap around the partition's end; then the clue blob lights on the readout | raised room view | | soft motif. C04, C19 |
| S8.3 | s47 + 4.5 s hold | Q: how would he really hide? A: he pushes the partition back until its far end meets the wall; the paths now stop at it; the readout goes blank; smug again… and the checker simply leans around the partition and looks at him. **J4** | room view | | partition scrape; readout blip-off; deadpan beat. **R4** |
| S8.4 | s48 | end card: wordmark and tagline, end-screen space | brand card | "Future Got Weird · the strange future, explained" | logo hit, music out |

## Runway candidates (priced on the first job; cap 500 credits, ≤ 2 paid attempts per shot)

| ID | Shot | One clear action, locked camera | Frames from Remotion | Fallback |
|---|---|---|---|---|
| R1 | S1.1 | the guesser tiptoes two steps into his spot and settles smug | start: entering at right · end: settled smug | `Cast2` tiptoe + settle |
| R3 | S7.1 | the delivery robot rolls toward the corner and slows | start: far · end: near the corner | `DeliveryBot` roll + brake |
| R4 | S8.3 | the guesser pushes the partition back to the wall | start: hands on the screen · end: gap closed | rig push with `reach` |
| R2 (optional) | S4.2 | relaxed lean, then stiffening | room-view stills | pose blend |
