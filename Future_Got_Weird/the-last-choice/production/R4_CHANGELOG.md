# The Last Choice: R4 change log

Delivered review film: `exports/FGW_TheLastChoice_R4_REVIEW_1080p_v2.mp4` (1920x1080, 30 fps, 7,134 frames, 3:57.8), built from
commit `4b2cffd` on branch `claude/new-session-1waugd`. Timing, music anchors, shot durations and the end card are unchanged
from R3 (reference film `FGW_TheLastChoice_R3_REVIEW_1080p.mp4`, source commit `7ced645`).

Sources for this log: `production/R4_PROMPT.md` (the owner's request), `R4_BRIEF.md`, the ten `R4_DEFECTS_*.md` files (they are
the source of truth for every status below), `R3_EXCHANGES.md` and the R4 checkpoint commits. Timestamps are film time, m:ss.s.
"Observed" is what frames or measurements showed; "cause" is what the source showed.

Nobody watched or listened to this film. Every judgment below comes from rendered stills, frame-step sheets and numeric probes
(section 5 lists what that does and does not cover). Music is owner-supplied and its rights are not cleared; nothing here says
the film is ready to publish.

## 1. What R4 was and the rules it ran under

R4 was the owner's final animation and continuity pass (`R4_PROMPT.md`): remove vanishing, flickering, fused or intersecting body
parts and robot components; make the principal actions readable (who acts, what is touched, how the target reacts, where
everyone ends); add purposeful and reciprocal movement; fix floating debris. It ran as parallel work by section (B, C, D1-D4,
E/F) and by shared kit (rig, mech, world/fx), with the lead committing 35 R4 checkpoints.

Rules (`R4_BRIEF.md`): fix shared causes, not one camera angle; no blanket fixes (no disabling depth tests, no double-sided
everything, no drawing figures over all scenery); never hide a defect with a flash, smoke, shake, blur or faster cut; no
re-timing (section boundaries, durations, music anchors fixed); no moving obstacles (truss, beams, cover, van, slabs) to suit a
camera; no teleports or weapon-hand swaps; handover frames between sections must still match; move only the audio cue tied to a
contact frame that moved; keep the quiet ending and the end card "A FUTURE GOT WEIRD FILM".

## 2. Significant fixes

Grouped by shared cause. "Shot" kit work is in `source/src/r2/` (`rig/`, `mech/`, `world/`, `fx/`, `shots/<section>/`).

### 2a. Rig (body parts that vanish, pop or ghost)

| Film time | Observed | Shared cause found | Fix | Verified |
|---|---|---|---|---|
| **2:59.3-3:03.0** (D4-9a/b/c, tableau to 3:06.9) | The seated Director's legs vanish (legless torso, then reappear); leg flips behind the torso for the whole slide | `rig/figure.tsx` `legFront` was a hard threshold on the thigh's angle (0.68 of thigh length). His legs sat just under it, so the right leg was drawn behind the torso throughout and the left flipped | `legOverTorso` (inside `solve2`): a leg whose knee or foot is nearer than the torso and overlaps it on screen is drawn over it. Later the rig agent replaced the discrete rule with one continuous torso mask for legs and arms (`legFront` no longer drives drawing) and added a rounded hip cap. Feet planted on the ground (`DIR_FEET`, world targets, `shots/EF/crew.tsx`): the old body-relative slump targets floated 0.3 m up | Probe of `figureRig`/`figProps`/`figureParts` (the method template, `qa/r4/legs/`); before/after strip `qa/r4/rig/D4_seated_director_legs_before_after_179.3-180.8.jpg`; 7 rig-lab model sheets and a 42-frame strip pixel-identical for standing, crouching, kneeling and running after the first fix; broad sweep (stand, braced, crouch, kneel, slump, run, tool, lookback, lying, 3 roles) found no pose where the threshold was right and the mask wrong |
| 3:16.9-3:17.6 (E2) and any curly-haired figure | A dark curl pops in front of the ear at 3:17.2 and further curls at 3:16.9, 3:17.0, 3:17.2, 3:17.6 | `drawHead2`: hard threshold `q.z > 0.15` sent a curl to the front or back layer | Depth band 0.05-0.25 with a mask, so a front copy emerges from behind the head outline | 1-degree raster sweep: pops at yaw 4-6 and 354-356 gone; E2 frame sheets 3:14.9-3:17.5 |
| Any yaw (Director's headset, drone pilot's hair, checker's pencil, face features) | Headset cup pops at yaw 179/180 (700 px); the pilot's whole hair mass jumps in one frame at yaw 107/108 (8,400 px); pencil pops; eyes, nose, mouth, cheeks cut at hard depth thresholds | Per-piece hard depth thresholds (`z > 0.02`, `behind = F.z > -0.3`, `q.z <= 0.12`) | Skull as a 3D ellipsoid depth test per piece (`skullZ`/`against()`); hair mass always behind the skull; face features fade with `rz()` | Raster sweep at 1 degree before/after; hair strip `qa/r4/rig/bob_hair_yaw90-270_before_after.jpg` |
| Every role, back views and the 85-88 / 134-135 degree turns | Sleeve vanishes behind the torso or its elbow drawing changes in one frame; thigh jumps over the shirt hem | Arm/leg rank decided by a depth threshold (`zoneAt`/`frontSurf`, `legFront`) where a limb tangent to the torso is a depth tie; structure toggles (`upperCross`, `split`) | `torsoHides`/`torsoParts`: per-scanline mask of where the torso surface is nearer than the limb axis; each limb is one part; plate (`plateWear`) fades instead of flipping side | Body sweep, 3 roles x 11 cells: flagged pops 144 to 47 (47 triaged: mostly fast-edge differences at a 2-degree step; residual list in the rig file) |
| **0:15.0-0:16.6** (B2), **0:39.4-0:45.2** (C2/C3) | Black ink discs (about 40 px) on the near shoulder; black parallelograms and slivers beside the green-shirt and teal-headband figures (found in the first R4 full render) | **React duplicate key.** The rig's arm part placed the keyed element `up.ink` (key `u1i`) twice among the same siblings. Production React does not warn, but when the list changes between frames it keeps or duplicates nodes, so a stale ink group stayed on the torso. A fresh static render cannot show it | Second use gets its own key (`React.cloneElement(up.ink, {key: ...2})`); no remount | Found with a React development build of the whole film (warning `Encountered two children with the same key, u1i` at B2 frame 395). Scan of film frames 0-7000 every 24th frame: no further rig duplicate key; real `remotion render` of frames 372-500 and 1100-1300 shows no disc or shard (`qa/r4/rig/R4regress_*`) |
| Hand/foot contacts, any section | Hands and feet drawn tens to hundreds of pixels off the true projection of their world target at 2-3 m lenses | **Perspective at contacts.** The rig scales a figure once at its anchor (weak perspective) and places every world target with it: 60-470 px error at 2 m | Opt-in `FigSpec.perspective: 'contact'` (default off, no shot changes); B uses `b2Anchor` | Table `qa/r4/rig/weak_perspective.txt`; in B palm mismatch 173 px to <= 15 px |

### 2b. Mech and fx (robot parts, falls, debris, LOD)

| Film time | Observed | Shared cause found | Fix | Verified |
|---|---|---|---|---|
| Every robot fall (takedowns 1:24-1:30, D2 crash, D4 wrecks, E/F) | Thighs/shins shrink to stumps, arms pull off joints, elbow flips 0.4-0.7 m between frames | `fallXform` squashed joints with a height-dependent drop while part meshes stay rigid (bone length error up to 0.15 m legs, 0.23 m arms); `ik2` with near-zero chord threw the elbow metres away | `unitWorld` re-solves each limb's middle joint from root and end (lengths exact); `ik2` minimum chord; limp arm lies out as the shoulder reaches the ground | Probe: max bone error 0.15/0.15/0.22/0.23 m to 0.002 m; elbow jump 4.06 m to <= 0.5 m; before/after sheets in `qa/r4/mech/` |
| Every wreck | Fallen units lie 0.13-0.29 m below the road | `restAngle` tested only head, shoulders, chest, pelvis and knees | `fallLift`: every part vertex tested against the ground; body lifted by the deepest (opt-out `fall.lift:false`) | Probe: 0.13/0.23 m under to 0.000 |
| **0:16.8-0:24.4** (B3/B4), D3-6, D4 wides, A1, F1 | Robots change look at the LOD distance (hands, feet, head vanish; far unit a pale front-facing trapezoid; far heavies flat slabs with detached legs; a smashed or fallen thing regenerates at far LOD) | Mid LOD merged the torso and dropped fists, feet, plates; far LOD was a fixed 2D cut-out with no damage, pose or heading | Mid LOD with the same anatomy as full; far branch draws solved parts and wreck topple (`toppleXf`) | LOD metrics (full/mid IoU 0.92 to 0.97, mid/far 0.65 to 0.82), ladder and B3 17.0 s crop sheets |
| D2, D3, D4 drone crash/smash | Two of four rotors vanish after a hit, the cutter vanishes, a far smashed drone hovers | `drone.tsx`: `!crashed \|\| k%2===0`, `!crashed` on the cutter, no arms in the pieces list | Odd rotors thrown and tracked, cutter stays, arms are a piece | Code and scratch sheets only |
| Cables, beams, fluid pools near a lens | Whole object disappears when one point passes the near plane | `beam`/`cable`/`fluidPool` returned null | Clipped at the near plane (`kit.tsx`) | Code review and probe |

### 2c. The floating rock and debris landing

| Film time | Observed | Shared cause found | Fix | Verified |
|---|---|---|---|---|
| **2:25.2-2:32.0** (D3-11a, 11d at 2:27.7-2:28.5, first 1.5 s of D4) | A large flat grey pentagon floats in front of the Director's face and drifts over the crew: the handheld "slab" and one reading of the floating rock | `fx` `blast()` debris (`chips3`) came to rest on one flat plane (the blast site's height, 1.2 m) however far the chunk flew down the crater: all 18 chunks hovered 0.8-3 m over the real ground; one rested at head height 0.1 m in front of his face. Probe found 106 resting chips off the terrain in D3. It was not his plate and not set geometry | Opt-in terrain-aware landing (`groundFn`, `terrainChips`) used at every D3 call; blast direction tilted up so no chunk flies through a person | Probe: resting chips off terrain 106 to 0 (2 left: D2's allied-drone chips); frames 4374-4388 and 4431-4453 |
| **0:24-1:00** (B5a to D1-1) and distant views | **`rfloor_3`, a 5.6 x 4.1 m slab with its low edge 2.68 m above the rubble, nothing under it, very likely the owner's floating rock** (up to 600 px radius in C2_pov 0:38.5-0:40.0). Also `rfloor_0` (+1.51 m), `rfloor_2` (+0.33 m), `rslab_19` (+0.57 m); floors interpenetrated each other and the ruin's columns | `world/set.tsx` placed the four "hanging floors" at an absolute height (1 + random x 2.5 m) whatever the ground beneath | `seatSlab`: low edge sunk 12 cm into the bed, lean capped, raised end carried by stacks of broken pieces (`rfsup_*`); conflict search keeps floors off each other and 1.3 m from the crew lanes | Numeric scan of every mesh in all 101 shots; min gap -0.12/-0.23/-0.42/-0.13 m (seated), 0 vertices inside another floor, no crew-lane warning in `city_check` (R3: 2) |
| B, C, D1, D2, D4, A1, wides | All thrown chips landed on one fixed height for the whole flight (up to +2.9 m hovering, -3.4 m sunk); two emitters had no ground and fell through the street (D2-7a, D3-9); A1 blow-out (0:02.9) and truck blast (0:05.6) left 18 + 18 shards hanging at 64.6 m and 3.3 m; masonry chunks >= 0.18 m melted away where they lay | `fx/particles.tsx` `ball3` landed on the plane given at launch; `blast()` used its own height as the landing plane; fade applied to every chip | Terrain-aware landing by default; chunks >= 0.18 m stay as rubble | 655 of 676 emitters rest within 0.15 m of the terrain (the other 21 were A1 chips still falling at the sample time) |
| 0:12.4-0:14.2 (B2) | The slab over the crawl-out floats on the mound line with no supports | Underside 0.2-0.45 m above terrain; the support items were small chunks that never reached it | Three piers built from the slab's own underside plane (tops within 2.6 cm through the motion); broken pieces persist into C | Probe, debug views from four sides |
| Every vehicle beyond 120 m | Cars and box trucks stand on invisible stilts (0.32 / 0.55 m); wheels pop in at the LOD switch | Far mesh has no wheels and starts above the road | Dark under-body block from the road up | Numbers |

### 2d. Distance and LOD popping in the set

| Film time | Observed | Shared cause found | Fix | Verified |
|---|---|---|---|---|
| **0:00-0:06.6** (A1) | A whole building's window pattern changes in one frame (R3 f159, 6 % of the frame; 67 more buildings); a whole smoke column vanishes (f161, f165); wires, rebar and specks pop | Per-frame distance LOD while the camera travels 150 m; plumes culled by four spine probes though billows are up to 58 m wide; hard distance and pixel culls | `lodCams` (finest level any path sample asks for), side probes on plumes, opacity fade on thin sprites and specks | 0 LOD events in 199 frames (R3: 71) |
| **3:29-3:51** (F1 pullback) | About 100 buildings pop in at once at 3:42.0; 35 building LOD switches | `cam.y < 26` dropped every short block behind the frontage; LOD per frame | No shortcut during the pullback window (`world/lodwin.ts`); LOD never coarser than the distance now | 0 building in/out events in F1 (R3: 90) |
| 22 other shots (B3, B5b, B6a, C1, C3, C4b, C6c2, D1-2, D1-2b, D1-7b, D3 and D4 shots) | A mid-distance building flips between two window patterns (1-10 times; D1-2 ten flips in 2.5 s) | Camera drift across the distance threshold | Baked camera boxes (`world/lodwin.ts`) for those shots | 0 LOD switches across all 106 shots (headless pass). If a camera leaves its box the old rule applies again |

### 2e. Other shared causes

| Film time | Observed | Cause | Fix | Verified |
|---|---|---|---|---|
| 0:41.5-0:50 (C3/C4, all climbers) | Every climber's pelvis dips and pops at nearly every step; feet lift 0.4 m in one frame; knee flips at step-ups | `climbPlan`/`climbAt`: a 0.08-0.1 s swing so the foot flew ~1 m in 2-3 frames; knee-first lift raised the foot 0.4 m in one frame; the swinging ankle rose to the pelvis where the IK knee solution flips | Longer swing (3-4 frames), lift spread over the swing, rear heel lifts, swinging ankle kept within 0.40 m of the root | Frames with pelvis change > 20 units: tether 69 to 2, runner 70 to 6, flare carrier 63 to 13, decoy 67 to 14, pilot 65 to 13; knee spikes 48 to 21 |
| 3:00-3:07 and every seated/wound pose | After the torso mask the seated Director's right forearm emerged from inside the belly | Default arm pole put the elbow behind the body | `WOUND_POLE` on `armR` in D4 (`againstSpec`, `dirSeatSpec`) and the same pole in `shots/EF/crew.tsx` | D4 crops 2:58.4-3:02.8; the EF half is in the source, but no frame check of the 3:06.9 cut is recorded |
| Heavy 2 resting at 2:55-3:12 | Ram head rests on the van's nose (0.38-0.40 m overlap); ram head inside the van cab at 2:57.8 (>1 s, 0.72 m deep) | D4's strike spot and EF's tableau `TB_HEAVY2` put the ram axis through the van's corner | Heavy 2 stops 1.2 m further out (17.0, 4.2) and the Director plants at (9.2, 4.5); `TB_HEAVY2.pos.z = 4.2` is in the source now; ram carried up ~25 degrees from 3:09.0 to 3:12.5 while every camera is on the pair | Top-view plots, ram probe (+0.27 m clearance at rest) |

### 2f. The 15 timestamped rows of the owner's prompt, and the floating rock

(The prompt table has 15 time-range rows; with the floating rock that is the 16 items asked about.) Status is as the defect
files report it: fixed, improved or unresolved.

| # | Prompt row (R3 time) | Status | What the files say |
|---|---|---|---|
| 1 | 0:00-0:06 opening | Fixed by measurement, one item not reproduced | LOD popping, vanishing smoke columns, thin-sprite pops, hanging blast shards fixed (A1, 2d above). The "dark round blob at 0:00.9-1.1" could not be reproduced as a pop; read as a stable plume top and collapse dust. A1-3 (smoke tone change) is marked "to verify in frames" |
| 2 | 0:10-0:16 hand and crawl-out | Fixed, one item improved | Hand plants and bears weight before the body moves; palm, knee, foot sequence rebuilt; slab has three supports; head no longer inside the slab; under-slab shade box gone. Right knee 6-13 cm below the rubble improved to 0-5 cm, not exact |
| 3 | 0:38-0:50 crew over broken ground, vault | Improved | Runner's bound (plant, push-off, clearance, palm ahead, two-foot landing with knee compression) and routes cleared of rubble blocks (C-4, C-10, C-11): fixed, render check noted as pending in the file. Climb bob greatly reduced; flat walks keep a ~0.1 m footfall dip |
| 4 | 0:51-1:03 reunion and charge | Fixed | Hand-on-shoulder reach and release made continuous (<= 3 cm, no sliding); gaze corrected; staggered starts and glances (C-8, D1-08). D1 head snaps of 75-160 degrees in one frame smoothed (D1-10) |
| 5 | 1:08-1:16 first exchanges | Improved | Camera re-sited so the plate and hammer are not behind his head (1:08.3-1:10.3); block now answered by a counter (shaft rams into U4's hammer arm, jab at 1:11.4) and the idle gap filled; Director repositions. Background machines' feet still slide at 1:08.1-1:08.9 (open, minor) |
| 6 | 1:24-1:30 takedowns | Improved, one unresolved | BR4 contact: a 35-spark starburst and flakes on his hair removed; split camera so the drive and shove read; U3's near forearm cleared; robot fall limbs stay connected (2b). Unresolved: U1 still interpenetrates U2 where they end at 1:34.3 |
| 7 | 1:36-1:47 tablet, projection, renewed fighting | Fixed (checked at sample frames) | D2-2d camera now shows the projector, crew, smoke figures and the machines reacting (1:37.6-1:39.5; frames 97.8, 98.1, 98.5). Face-hiding pauldron, ducked head, parry fists inside the breaker, cables across the runner's face (1:43.0-1:45.4) fixed |
| 8 | 1:50-2:08 truss, beams, falls | Improved | Burst plates now fly away from people and rest at 2.2-3.7 m from anyone; shield shot re-staged from behind the crew; runner's sliding foot fixed. A and C never touch the girder (closest 0.83 m): it reads as a hit in projection only. D3 arc units walking through the burnt car, chunks, post 3 and the water main: 22 cm penetrations down to <= 10 cm grazes. Wreck rest poses: see section 6 |
| 9 | 2:09-2:17 drone and wide views | Applied, unverified by eye | All seven crew look up at the ADAPT drone until the mark lands (2:09.9-2:11.3: probes only, not frame-checked); 2:15.0 camera pulled so the cover slab fills 16 % instead of 34 % (probe; render pending in the file) |
| 10 | 2:25-2:32 explosion, gauge, slab, retreat | Fixed / improved | Floating slab was blast debris on a flat landing plane: fixed (2c). Plate arm across his face at 2:27.7-2:28.4 fixed. Gauge insert: check and bow over the tool start earlier and the insert rises into frame, improved; the tool still reads as a grey chisel from the SW lens |
| 11 | 2:32-2:50 renewed fights, large robots | Partly addressed | Arc units de-synchronised (all 45 were in the same stance, in lockstep); runner's blow now reaches his chest (2:35.9). The file states reciprocal-combat variety was not extended further: no parry or sidestep beats were added in D4-1 to D4-4 |
| 12 | 2:53-2:59 giant robot and the van | Fixed (frame checks at the listed points) | Ram no longer through the van; flight line clears the pilot (>= 1.2 m); he is slammed against the slab with 2 cm gap, not 0.5 m; sparks fly toward the camera side; lens through the slab fixed; lens under the ram fixed |
| 13 | 2:59-3:13 injured seated character | Fixed, with small open items | Legs persist (headline fix, 2a); feet planted; wound arm crosses the belly. Open: pelvis back 8 cm off the slab (shoulders 2-3 cm). Clasp insert rebuilt (3:11.4-3:13.1): per-finger release, no one-frame finger swap, her squeeze visible |
| 14 | 3:14-3:28 face, radio, embrace | Fixed / improved | Curl pop at 3:17.2 gone; radio has a floor contact shadow (3:19.0-3:20.5); camera draw-back no longer sweeps her helmet across the lens (peak 14.2 % to 5.7 % of the frame, 3:18.6-3:19.0); his right sleeve pop at 3:08.0-3:08.6 fixed by head pitch |
| 15 | 3:29-3:51 encirclement and pullback | Improved | Building and vehicle LOD pops gone (0 events); brick block no longer fills a quarter of the frame at 3:41-3:49; robot LOD keeps anatomy and wrecks stay down. Residual popping: section 6. The pullback was sampled every 1-3 s plus counters, not frame by frame |
| 16 | Floating rock | Fixed (two causes found) | `rfloor_3` and three other hanging floors (set placement) and blast debris landing on one flat plane (fx). Both fixed and numerically verified (2c). The files cannot say which the owner meant; both are addressed |

## 3. Choreography and readability changes by section

Rows below are in `production/R3_EXCHANGES.md` (rows marked "R4" or edited there).

| Section (film time) | Change | Exchange rows |
|---|---|---|
| B (0:09.3-0:35.8) | Crawl-out rebuilt: hand slap, press, claw and slip, re-plant, knees gather, toes dig, pelvis comes forward over planted feet, palms walk, kneel, rebar, stand. Look sweeps across the ranks in B3; chin follows the sentry drone in B6b; the drone holds clear of his face | X0 "The crawl-out (R4)", X2 "The sentry" |
| C (0:35.8-0:59.95) | Climbs re-timed; runner's bound over steep rubble; drone pilot's raise re-sited and re-lensed; breaker's hand arrives on the shoulder instead of swatting; Director's eyes drop to the hand then lift to his face; glances along the line and staggered stance shuffles after the turn | X1 "The arrivals", X2 "The commitment" |
| D1 (0:59.95-1:34.3) | Staggered charge starts (leader looks back, followers read him); breaker/U4 gets a block-counter-jab chain; Director repositions and glances; BR4 filmed side-on with a restrained spark spray; head turns eased | X0 "The charge (R4)", X2 "Breaker / U4", X7 "BR4" |
| D2 (1:34.3-1:56.9) | Runner steps back before the pry and the bar is one two-handed motion (pop, hook, rip); ducks down and back; breaker meets A from further off, A stoops into the shove; burst plates thrown away from crew; shield beat filmed from behind the crew | Y3 "FLANK", Y4 "The pry", Y5 "Breaker vs A", Y8 "KNOCKBACK / CATCH", Y9 "SHIELD / COUNTER" |
| D3 (1:56.9-2:29.9) | Gauge check begins before the cut so the tool's owner is clear; guard lowered so the plate is not across his face; crew look up at the drone; arc units routed around solids; heavy 2 climbs over heavy 1's wreck with its ram clear | X10 "Escalation (HEAVY2 to HEAVY2_FIRE)" |
| D4 (2:29.9-3:06.9) | De-synchronised arc units; runner's blow reaches his chest; the choice: heavy 2 stops on open ground, he sprints to plant beside the pilot, plate meets the ram, slam against the slab with a 2 cm gap, slide to the seat; new lenses for 2:52.6-2:57.4 | X10 "The choice" |
| E/F (3:06.9-3:57.8) | Pilot kneels in with planted ankles; clasp insert rebuilt; her squeeze begins at 3:11.0; heavy 2 stands down (ram carried up); camera leaves him by rising over the pair; five ring units turn to watch after his eyes close; pullback keeps the block out of frame | S8 "Pilot kneels in", S9 "Clasp insert", S10 "The camera leaves him", S11 "Heavy 2 stands down", S12 "The ring notices" |

## 4. Audio cue changes

Each cue that moved did so because a contact or footfall frame moved. Cue data is in `source/src/r2/shots/*/cues.ts`;
`audio/r2/timing.json` was regenerated (the mix is rebuilt from it). The mix is `source/public/audio/r2_mix.wav`, measured
at -16.1 LUFS on the encoded file (lead's measurement; I did not re-measure).

| Film time | Cue | Change | Why |
|---|---|---|---|
| 1:10.9 | `armor_hit` (gain -7, pan 0.14) | Added | New beat: the breaker's shaft rams into U4's hammer arm |
| 1:11.4 | `robot_swing` (gain -9, pan 0.4) | Added | New beat: U4's short jab at his face |
| 0:42.6-0:49.7 (C) | `steps_gravel`, `rubble_shift`, `breath_exert` for every climber | Re-synced by 0.03-0.2 s (for example the runner 0:42.55 to 0:42.58; the runner's `rubble_shift` 0:44.12 to the bound's palm contact 0:44.2, `breath_exert` to the push-off) | The climb timing changed, so the plant times moved |
| 0:47.6 | `rubble_shift`, flare carrier's palm | 0:45.51 to 0:47.57 | The cue was listed for a palm the plan did not have until 0:47.57 |
| 0:47.1 / 0:47.5 | breaker's and tether operator's palms | 0:46.99 to 0:47.13, 0:47.45 to 0:47.47 | As above |
| 0:55.7-0:56.9 | six `steps` cues (gain -22 to -23) | Added | The staggered stance shuffles after the turn |
| 0:58.2-0:59.3 | pilot and breaker step-down cues; flare carrier and decoy maker step-in cues | Pilot 0:58.39 to 0:58.20 (steps 0:58.20/0:58.48/0:58.75), breaker 0:58.38/0:58.67/0:58.95; two cues added for roles that had none | They start 0.25 s earlier so the 0.7 m step down takes 0.27 s |
| D4-7c (2:55.0-2:57.4) | `heavy_servo` at `EV.ramWind` | pan -0.13 to 0.25, dist 0.32 to 0.45 | The lens moved; heavy 2 is right of centre, 13 m off |
| D4-7c (2:55.0-2:57.4) | `steps_gravel` at `EV.dirPlant` | pan -0.14 to 0 | Same lens move |

Not changed: D4 contact times (the ram contact is still 2:57.8, the W1/W2/W3/H5/H1 contacts untouched); `ram_strike` pan
0.33 and `body_fall` pan -0.44 were checked by projection against the new D4-8 lens and left. D3's file says no cues changed.
D2 and E/F: no `cues.ts` change appears in the commit range and their defect files list none; the D2-2d (1:37.6) and D2-7a
(1:52.9) cameras were re-sited, and the files do not record a re-check of cue pans against the new lenses. Treat that as
unverified. **No music and no successful effect was changed, and no effect was added to compensate for animation.** The mix was
rebuilt from the cue timing.

## 5. Verification method and its limits

Method (all from stills and numbers):
- **Frame-step sheets** (`source/fsheet.mjs`, `stills.mjs`): contact sheets from the current source every 1-3 frames around
  events, with R3 frames as before-evidence; sheets kept in `qa/r4/<area>/`.
- **Probes**: esbuild scripts that call the real rig, crew and unit functions and report joint positions, clearances, contact
  distances, foot speeds and per-frame jumps at 30 fps (for example C probed every frame of 0:36-1:00; D4 every frame of
  2:29.9-3:06.9 for joint pops).
- **Rig sweeps**: figures rendered at 1-degree yaw steps in headless Chromium and pixel-diffed, isolating blobs that appear in
  one step only.
- **Whole-film harnesses**: a spy on `combatUnit`/`heavy`/`drone` across all shots; a mesh scan of 101 shots for hovering rubble; a
  LOD-switch count across 106 shots.
- **The React duplicate-key class of bug** (black ink discs and shards on arms, section 2a) is invisible in a fresh render of one
  frame. It appeared only in a development build of the whole film, which prints the duplicate-key warning, and only after a long
  frame history in one page. The harness is in `qa/r4/rig/tools/` (`dom.py` compares the DOM of a frame rendered fresh with the
  same frame rendered after its history; `scan.sh`, `page2-5.tsx`).
- **Whole-film comparison** of the final render against the previous R4 render (PSNR per frame): only about 815 frames are
  identical between them, and the differences localised to the ghost-ink shapes. This shows where the final render differs from
  the earlier one; it is not a defect check of either.

What was not verified:
- **No one watched or listened to the film.** No playback at speed, and no audio check beyond the mix measurement.
- Stills and measurements only. Several defect files record "render check pending" or sample-frame checks only (C-1, C-2, C-4;
  D2 checked at the listed times, not every 1-2 frames; D3 rows for the drone looks and the 2:15.0 camera; D4-9b, 9c and 10
  at 6 frames each). The EF pullback 3:20.5-3:51.6 was sampled every 1-3 s plus counters.
- **A second duplicate key, `u75017_far`, from the mech drone kit (`mech/kit.tsx` or `drone.tsx`) in section A, is unfixed and
  unverified.** The development-build scan found it at one sampled frame; whether it leaves a visible ghost was not examined.
- The scan sampled every 24th frame of 0-7000, so other duplicate keys at unsampled frames cannot be excluded.
- Every shot outside the specifically checked ones relies on DOM-equivalence tests (fresh render versus render after
  history) and on the sweeps; they were not inspected frame by frame.
- Rig changes were proved on the rig lab, the E2 frames 5914-5937, D4's seated legs and the sweeps; the rig file says other
  shots were not re-rendered on the final rig build.
- The A1 plume sprites can still swap draw order against a building when the camera passes (F1 and A1).

## 6. Remaining known defects

From the "open / unresolved / remaining" rows of the defect files plus the lead's list (cross-checked; items the files mark
fixed were dropped; items below marked "lead's list" are not recorded in any defect file).

| Film time | Defect | Source |
|---|---|---|
| 1:34.3 (end of D1) | U1 lies across U2 and still interpenetrates it. The kit's ground-contact lift made it worse (0.71 m to 0.84 m); `fall.lift:false` sank U2 0.25 m under the road; shifting U1's end 0.25-0.5 m did not help. Needs a stacking rule in the kit | D1-13, MECH M2 |
| 2:28.47-2:28.70 (D3-11e) | Heavy 2 rear-left knee flips 1.8-2.1 m in a frame while the foot moves 0.13-0.17 m; the kit's `kneeClear` swing choice. Off camera in D3-11e; open with MECH | D3 |
| 2:22.3-2:23.8 | Heavy 2's ram comes within 17 cm of heavy 1's leg at 2:22.3 (visible in D3-10a, not touching); its boom grazes heavy 1's raised leg 0-8 cm at 2:23.5-2:23.8 (off camera in D3-10b). A shin of unit 7311 is 10 cm into the water main at 2:23.1. Reported to MECH | D3 |
| 3:01.3-3:06.9 | Outer-ring unit 7304 has its left foot inside slab `rslab_8` (about 1.3, 19.25); unit 7215's slot is 9 cm from `rslab_17`. EF-owned data, reported, not changed | D4 rows 9, 10 |
| 3:02.0-3:06.9 | Seated Director's pelvis is 8 cm off the slab (shoulders 2-3 cm): EF's `DIRECTOR_SEAT` constant (D4 suggested moving it 5 cm). Not changed | D4 row 11 |
| 2:29.9 | Unit 7201's left foot is 19 cm from D4's at the D3/D4 handover (pre-existing) | D3 |
| 2:30-3:07 (D4-1b to 4d) | Exchanges not extended: R3's structure kept; no added parries or sidesteps; the 4 s lull 2:38.5-2:42.4 is the existing "spent" beat | D4 |
| 0:27.4-0:29.0 (B5b) | The persisted slab behind him reads as a beam running through his chest (two ends either side of his torso). Not a contact; the camera is the shot's design. Only a camera change removes it | B-15 |
| 0:14.0-0:15.0 (B2) | Right knee still 0-5 cm into the rubble while kneeling | B-10 |
| 3:08.4-3:09.4 and E1/F1 | Pilot ankles skimming: reduced to <= 0.08 m/s except while lifted, but ankle skimming in E1/F1 is on the lead's list; not otherwise recorded | EF-6, lead's list |
| 0:36-0:45 (C) | Walks over rubble bob about 0.1 m (20-35 units) at each footfall; the sprint before the wall vault (0:41.0-0:41.35) has 4 frames with 20-56 unit steps; a 0.7 m step down still drops the pelvis 0.65 m in 0.15 s (C6d, 0:58.0-0:58.45) | C remaining, C-12 |
| 0:50.8 (C5, off frame) | Decoy maker's hand 0.13 m into a chunk for 3 frames; flare carrier's feet 0-4 cm in small chunks | C |
| C, 0:36-0:59.95 | Ground contact uses `GC` (terrain plus slab) but the ridge is drawn as a 1 m grid; a planted foot can be up to 0.3 m off the drawn surface. No frame found where this reads as a float or sink | C remaining |
| 3:21.8-3:22.7 | The reveal helmet occupies about 20 % of the frame | Lead's list; not in any defect file |
| 1:08.1-1:08.9 | Background machines' feet slide 0.1-0.5 m as the run ends (arrival braking, `laneGait`) | D1-09 |
| 1:34.3-1:56.9 (D2) | Person-robot overlaps of <= 5 cm: runner's left shin vs D's wreck foot 1:55.3-1:56.9; Director vs B upper arm 1:42.7, vs A fist 1:43.4; runner vs D fist/forearm 1:50.4-1:50.5. Cable passes through C's chest (1:48.4-1:49.2), hidden behind both machines in every camera | D2 |
| 1:56.9 (D2/D3 rest) | B (kneeling) and D rest propped, pelvis 0.68/0.82 m above ground (R3: lying). Raised to MECH; the MECH file does not record a fix | D2 |
| 2:00.1-2:00.5 | Breaker and runner thighs 15 cm into each other | D3 |
| Single frames in D2 | Background units' foot centres dip 7-13 cm below ground for single frames (1:38.1-1:39.3, gait kit) | D2 |
| 0:18.8-0:23.7 (B3 army lanes) | Four far units teleport 4.5 m sideways and flip heading 100 degrees for 5 frames (ids 10808-10811); `laneZ` in `shots/B/army.ts`, not fixed | MECH M10 |
| 3:43.2-3:43.6 (F1) | Four `sm_blkP4` smoke sprites pop in/out at the top frame edge | WORLD |
| 3:27-3:51 and wides | Persisted machines use `persistItems lod {full:30, mid:140}`, which can still change robot detail with distance; about 10 LOD flips a second in 3:27-3:51, never in unison | WORLD, EF-12 |
| 2:26.3-2:27.0 (D3-11b) | The gauge insert is improved but the tool still reads as a grey chisel from the SW lens | D3 |
| Section A | Second React duplicate key `u75017_far`: unfixed, unverified (section 5) | RIG |
| Kit tools not adopted everywhere | MECH built `groundWith` (feet on rubble chunks), `phasedGait` (crowd gait phase) and `lodBySize` (pixel-based LOD); D4 did not use `groundWith`/`phasedGait`; D3 asked WORLD to adopt `terrainChips` in D1/D2/D4 blasts (WORLD's fix made terrain landing the default). Shots that did not adopt the MECH tools may still show what they fix | MECH, D3, D4 |

Not claimed anywhere in this log: that the film is free of glitches, ready for upload, or cleared for music rights.
