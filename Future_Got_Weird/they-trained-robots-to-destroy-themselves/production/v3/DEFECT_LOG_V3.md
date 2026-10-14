# V3 defect log

Each row gives the V2 timecode, the symptom, the cause I verified, the change made, where it now lives in V3, and how
it was inspected.

Timing: the narration is unchanged, so the V3 master has the same 3:53.5 runtime and the same cue times.

Inspection sources:

- `qa/v3/<round>/` holds still renders from development rounds.
- `qa/v3/strips/` holds the final strips: 25 consecutive frames (12 before, the boundary frame, 12 after) around each
  changed transition, cut from the upload master.
- `qa/v3/qa_v3_results.json` holds the measured checks.

## P0

| V2 time | Symptom | Verified cause | Change | V3 location | Inspection |
|---|---|---|---|---|---|
| 2:11.8–2:12.4 | The robot overlaps the block's face and has no floor contact | `PolicyShot` started the walk at x = −300 on the "floor" at y = 322. That point is inside the simulated platform block (x −734…−214, top 600); `qa/v3/diag_v2_block/sheet.png` confirms it. The robot was also depth-sorted by its centre only, so it drew over the face | The policy walk now runs on the open training-stage floor (y = 0, z = 330), clear of the tower legs (z ±117) and the pedestal (r 190). A contact shadow is added. Sorting rebuilt (see *Renderer* below) | 2:11.7–2:19 (`Train.tsx` `PolicyShot`) | `qa/v3/b4_r1`, review sheets 8–9, `qa/v3/compare/block_intersection_v2_vs_v3.png`, strip `policy_into_sensor` |
| whole film | The robots were not recognisable versions of the Figure models (one generic mesh) | V2 used a single mesh with a material swap | Separate model records: `F02_SPEC` (shield visor in hood contours, tapered chest over an exposed waist, back battery housing, actuator housings, graphite) and `F03_SPEC` (round head, oval face screen, cylindrical torso, knit, joint bands, chest symbol). The training avatar is F.02 geometry drawn schematic. See `MODEL_RECORDS_V3.md` | `robot/model.ts` | `production/v3/V3Sheet*.png`; silhouette and phone-size checks on `V3SheetID.png` |
| 0:19.4–0:24 and ID shots | The Figure symbol was not established | V2 had no symbol (the file could not be loaded) | The supplied Wikimedia SVG (CC BY 4.0) was saved verbatim and as a transparent copy with the path unchanged. It is projected without mirroring or stretching on an illustrative product-bay sign and on the F.03 chest. Identification sits inside a moving product shot (the F.02 on its stand, the sign behind it, the "F.02" lower third). No logo intro | 0:19.4–0:25.3 (`Why.tsx` S2a), F.03 at 0:29–0:34 | `qa/v3/b2_r2`, `qa/v3/compare/model_emblem_v2_vs_v3.png` |

## P1

| V2 time | Symptom | Verified cause | Change | V3 location | Inspection |
|---|---|---|---|---|---|
| 0:00–0:03.2 | Prep holds; the destination was revealed late | The jump began with a standing look and crouch; the opening camera showed the edge only | The film opens mid push-off with a pre-loaded "hero" crouch. A high three-quarter camera shows the robot and the glowing ladle from frame 0. Arms counter-swing through one arc; no holds | 0:00–0:03.1 | `qa/v3/open_r4`, strips `h1_h2_cut`, `h2_h3_cut` |
| 0:03.4–0:05.4 | The splash read as a flat wedge; the close-up looked detached | The crown was two flat half-sheets of near-identical colour; the near/far split did not read as a ring; flames were flat triangles | Rebuilt as a ring wall: dark inner far face, bright outer near face, a continuous lip, flow streaks, beads at the finger tips, and a skirt ring on the surface. The radius saturates so the crown stays inside the vessel. Droplets are tapered streaks that cool and fade. Flames are thin S-curved tongues. The macro adds a waterline meniscus tying the body to the steel | 0:03.1–0:05.5 | `qa/v3/open_r3`, `open_r4`, `fix_r1`; strips `h3_h4_entry_cut`, `h4_h5_macro` |
| 0:06.4–0:13.4 | A recreated recording (REC frame) with a nested reenactment, then a monitor repeat | V2 staged the second jump inside a monitor overlay | Removed. The second robot walks out with one clean attribution chip, then is seen through the control-room glass with a silhouetted witness | 0:06.2–0:13.9 | strips `h5b_h6_walkout`, `h6_h7_window` |
| ~0:13.6 | Harsh cut; an oversized bin shot | The match went to a scrap-bin rim | Match on shape, size and light: the ripple rings become the machined rings of an actuator face (groove, flange and housing ratios equal the ring radii; same 33° elevation; centred) under a warm lamp pool. The push continues 8 frames, then pulls out into the product bay. The bin is removed | 0:13.9–0:15.7 | `qa/v3/turn_r3`, strip `ripple_to_actuator` |
| ~0:19.4 | No carried element across the cut | Cut from the simulation to a studio turntable | The avatar turns its visor to the lens. The F.02 opens on the identical head-relative framing (same geometry), and a scan line resolves schematic → finished. The camera then pulls back to the torso and the sign | 0:18.6–0:21 | `qa/v3/b2_r1`, strip `sim_visor_to_f02` |
| 0:16–1:04 | Sparse bays | Plain walls and boxes | Product bay: floor joints, lanes and a taped cell; wall panels, dado and windows; the company sign; a pegboard with tool silhouettes; LED rows with light pools; a glass partition and a background bay with a lift, monitor and bins; a stand with a charging reel and pendant; a bench with vise, actuator, trays, monitor arm and lamp; a tool cart. Production cell: skid conveyor, station frame, clamps, stack light, HMI, guard fence, industrial arms, truss lights. Loading dock: three doors (one open on a trailer), levellers, bumpers, bollards, pallets, crane beam. Recycling line: magnet separator, sorting bins, bales, varied e-waste | 0:13.9–1:07.8 | review sheets 1–5 |
| 1:40–2:08, 2:44–2:54 | Grid, cube and target instead of a test environment | V2's `SimWorld` | New training stage (`sets/Stage.tsx`) at the foundry's world placement: measured floor rings and ticks, calibration pylons, a braced launch tower with a striped edge and rails, and a landing pedestal (the ladle's footprint) with a target and landing zone. The grid appears only briefly during the foundry→sim transform. Cameras vary per beat | 1:39–2:30, 2:43–2:55 | review sheets 6–10 |
| ~1:40, 2:30–2:32 | Diagonal wipes | V2 used clip-path wipes | ~1:40: the robot holds its pose on the edge; the surroundings resolve from its feet outward (root and feet unchanged), then the robot resolves top → bottom. 2:30: the simulated jump crosses into the foundry mid-air with the same trajectory and placement. It hangs for the close-ups, then resolves back and lands on the target | 1:39.3–1:40.5, 2:30.5–2:44 | strips `foundry_to_stage`, `sim_to_foundry_midair`, `foundry_to_stage_back` |
| 0:38–0:44 | X-ray crate | Transparent crate walls | The crate front door (stencilled arrows, shipping label) sweeps past the lens and reveals an orderly cutaway of a knee actuator (housing, stator teeth, rotor magnets, planetary stage, output) with the "custom actuators" label. It then sweeps shut; the padlock and shutter follow | 0:37.0–0:45 | `qa/v3/b3_r1`, `fix_r1`, strips `crate_door_open`, `crate_door_close` |
| 0:44.7–0:46 | Exploded robot | `explode` on all parts | Tactile teardown: four bolts back out, the knee actuator slides out, turns to the light, slides back and seats (with a flash). Nothing else separates | 0:44.6–0:48.4 | strips `crate_to_teardown`, `teardown_to_queue` |
| 0:51.6 | Bin rim → ladle cut | Scrap-bin match | A retaining ring pops off the bench actuator and flies at the lens. It morphs point-wise from its projection into the ladle rim's projection in the next shot and turns from steel to molten orange. The furnace bed starts under it (sound bridge) | 0:51.2–0:52.0 | strip `ring_to_rim` |
| 1:18.5, 1:25.3 | Cuts from phone and movie | — | The phone turns edge-on into the clapperboard, which turns in. A heavy chain swings past the lens from the movie glow into the foundry (13 frames) | 1:18.3–1:18.9, 1:25.0–1:25.5 | strips `phone_flip_to_clapper`, `chain_pass_to_foundry` |
| 2:12–2:28 | A labelled diagram feel | Overlay path only | Into the head sensor (lens iris), ride the pulse along the signal path down the body, exit at the knee actuator, then the early-foot correction on the raised plate | 2:12.0–2:26 | review sheets 8–9 |
| 1:53–1:58 | Redundant jumps | Attempts 2 and 3 both shown | One visible correction (the launch vector is nudged longer and flatter, blue → teal), then one improved trial into the ring | 1:52.9–1:58 | strip `nudge` |

## P2 and other defects found during V3

| V2 time | Symptom | Verified cause | Change | V3 location | Inspection |
|---|---|---|---|---|---|
| cast shots | Cast floating; flat shadows | 2D cutout shadow in screen space | Perspective ground shadows for robots (body plus foot contacts) and cast. The cast's built-in 2D shadow is turned off. The clerk now stands on the pedestal beside the face-plant | whole film | review sheets |
| 3:15–3:21 | A cut from the entry to the wide | Separate shots | One continuous rise off the ripple into the wide human-prepared setting (barriers rising, film lights, crew on the floor), then back through the control-room glass | 3:14.5–3:21 | strip `payoff_rise_to_setting` |
| 3:47–3:51 | Top-down only | — | New vantage: start at steel level over the entry scar, then crane up and over into a high plan view of the whole prepared set (deck, vessel, barriers, lights, crew); the last ripple settles into the target ring that opens the sting | 3:47.3–3:51.0 | strips `final_reveal`, `ring_to_sting` |
| (new) | The actuator painted under the bench top (development render, H8) | Painter's sort by centroid depth; the close camera clipped the bench top, giving it a smaller depth than the part resting on it | Exact occlusion: faces carry their plane and outline; cylinders and props carry points. The constraint graph keeps pairs that genuinely overlap (separating-axis test), collapses mutual non-occluders (Tarjan SCC) and orders topologically with depth as the tie-break. Props never jump past items without geometry | engine `sortItems` | `qa/v3/turn_r3`, `sort_r2`, `diag_r2` |
| (new) | A dark trapezoid over the steel (development render) | The first version of the new sort moved the ladle stand's top face past the steel surface (no geometry) | Background-layer items stay fixed; props respect items without geometry | engine | `qa/v3/sort_r2` |
| (new) | Camera inside the vise and bench (development, H8) | The actuator was sunk 8 cm into the vise base (base 96 vs. vise top 104) | Actuator seated on the vise top; jaws clamp the housing | `Workshop.tsx` | `qa/v3/turn_r3` |
| (new) | The F.03 walked through the glass partition | Walk started at x −760, behind the glass at x −700 | Walk starts at x −640, in front of the glass | `HookTurn.tsx` | `qa/v3/turn_r1` |
| (new) | Effects over the voice ("steel", "go in", "brutal environment", "retiring hardware", the airbag) | Measured on stems: effects and beds above the voice for 0.2–0.8 s | Impacts lowered by 5–7 dB; airbag −5 dB; two booms −6 dB. No window of ≥ 150 ms now has effects louder than the voice (`audio/v3/mix/speech_mask_v3.txt`) | `sfx_v3.ts` | `tools/v3/speech_mask_v3.py` (measurement, not listening) |

## Not changed

- **Narration, captions, story and timings:** unchanged. The V3 captions are the V2 captions; the narration and timings
  are identical.
- **Flat illustrated "people chose" vignettes (3:37–3:41):** kept as the channel's 2D cast style.
- **Airbag rehearsal (2:56–3:01):** a richer yard, but still an illustrative staging.
