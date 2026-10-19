# R4 defect list — RIG (KIT-RIG): shared causes of parts vanishing, popping, fusing or intersecting

Owner: `source/src/r2/rig/*`, `source/src/r2/dev/RigLab.tsx`. Evidence sheets: `qa/r4/rig/`. Method: probe the numbers (esbuild
script calling `figProps`/`figureParts`), find the discrete decision, fix it continuously/physically, prove frame by frame.
Observed visual failure and suspected cause are kept apart; "status" says what was actually verified.

Detectors used (scratchpad, not in the repo): (1) structural probe: part order / element makeup between consecutive yaw steps;
(2) raster sweep: the figure rendered as SVG tiles in headless Chromium at 1 degree (head) / 1 degree (body) steps, consecutive
tiles pixel-diffed, the difference eroded so that moving edges vanish and only filled blobs that appear in ONE step remain
(a pop = an isolated spike of such pixels between two neighbours); (3) the real E2 camera and spec rendered per film frame.

## Findings (head)

| # | Time / where | Observed (visual failure) | Source cause (found) | Fix | Verified | Status |
|---|---|---|---|---|---|---|
| R1 | 3:17.20-3:17.23 (E2, f5916-5917) and the settle 196.9-197.6; every curly figure (the Director) between yaw ~4 and 8 degrees either side of front | a big dark curl pops in front of the ear/temple in one frame and stays; further forehead curls pop at 196.93, 197.03, 197.23, 197.57 | `drawHead2.blobAt`: `q.z > 0.15` sent a curl to `extrasFront` else `extrasBack` (a hard threshold on head-local depth); the rear mass had the same switch (`near` list) | depth band CURL_Z0..CURL_Z1 (0.05..0.25) instead of the switch: front copy of a curl emerges from behind the head outline (mask = disc minus the skull outline scaled by lambda, inked edge); a rear-mass curl grows in place | raster: pops at yaw 4-6 and 354-356 (969 / 654 px) gone; E2 f5914-5937 sheets | done (head) |
| R2 | any yaw, the Director (headset) | the headset cup (a black block) pops on/off the hair at yaw 179/180 (700 px), the band and the boom flip in pieces | `acc` / `accBack` chosen per piece by `z > 0.02` or a sum of depths | `skullZ` / `hidingPoly` / `against()`: the skull as a 3D ellipsoid; band and boom cut into 48/30 pieces, each behind or in front by the skull's own depth test at the piece; cup, mic tip, ears, pencil masked by the region the skull hides at their depth | raster: pop gone | done |
| R3 | drone pilot (bob, `checker`), yaw 107->108 and 252->253 | the whole hair mass jumps over the head in one frame (8400 px): the cheek and jaw edge still in view past profile vanish | `bob`: `behind = F.z > -0.3` moved the mass between `extrasBack` and `extrasFront` with a different hem | the mass is always behind the skull/cap (the cap already is the hair in front); strands fade in with `rz(-F.z, 0.3, 0.6)` | `qa/r4/rig/bob_hair_yaw90-270_before_after.jpg` (top = before, bottom = after, 10 degree steps); raster 1 degree | done |
| R4 | the face, all roles | eyes, glasses, nose line / nostril, mouth, cheeks, brow cut, nose bleed, lip cut, mouth blood, bruise, dirt: hard depth thresholds while still 5-50 % opaque | `if (q.z <= 0.12) return;` and the like | thresholds moved to where `fold()` is zero; the rest fade with `rz()` | by code (continuity), raster no new pops | done |
| R5 | checker (pencil) | the yellow pencil pops over the hair at yaw 1-2 and 169-170 (334 / 394 px) | `zc > -0.12 ? acc : accBack` | `against()` with the pencil's front-most depth | raster 1 degree: gone | done |

## Findings (body)

| # | Where | Observed | Source cause | Fix | Verified | Status |
|---|---|---|---|---|---|---|
| B1 | every role, back view at yaw ~172 and ~358 and the 85-88 / 134-135 turns | the sleeve (upper arm) vanishes behind the torso, or its elbow drawing changes, in one frame | arm rank decided by `zoneAt` / `frontSurf` (a threshold on the arm's depth against the torso's rounded edge: a limb tangent to the torso is a depth tie); `upperCross` / `nearHead` / `split` toggled the arm's structure (one part or two, elbow style) | `torsoHides` / `torsoParts`: per-scanline mask of where the torso's front surface is nearer than the limb axis (continuous in the pose); the arm is ONE part whatever the halves' ranks unless the pose overrides it or a half meets the face's zone; shoulder cap fades with `rz(S.z - front)`; `upperCross` off for non-override arms | body sweeps 1 degree, 3 roles x 11 cells: flagged pops 144 -> 47 (all 47 triaged below) | done |
| B2 | runner (stripes), yaw 87->88 and 272->273 | a block of stripes switches at the sides | stripe polylines wrapped at a hard front/back test; non-contiguous visible arc | `ab0` / `pc` / `base0` wrap, strap chord fix | raster | done |
| B3 | every role, braced / stepping / kneeling | a forward thigh jumps over the shirt hem (with a rounded hip) when a degree of yaw crosses `legFront` (0.68 thigh) or the lead's `legOverTorso` | hard threshold on the knee-hip depth, 2 draw structures | legs always start inside the pelvis and use the same torso mask as arms; bias `(12 + 78 fwdK) * s` grows as the thigh points at the camera; a rounded hip cap (`LimbG startCap = fwdK`), so a thigh toward the camera is whole, not butt-ended (R4 first build showed the flat hip end cut across the belly of the seated Director); `legFront` no longer drives drawing | `legOverTorso` verified on the broad sweep (stand / braced / crouch / kneelR / slump / run1 / tool / lookback / lying x 3 roles): the threshold rule had no pose where it was right and the continuous mask wrong; D4 seated Director before/after `qa/r4/rig/D4_seated_director_legs_before_after_179.3-180.8.jpg` (top before, bottom after) | done |
| B4 | plate carriers (breaker, director), turns | the plate (`plateWear`) flips side with the arm layer | `wear.front` boolean | `plateWear` returns `w` (0..1) that masks the plate in the lower fill | by code + sweeps | done |
| B5 | tool in hand | tool and arm at different ranks in zone splits (the tool in front of an arm that is behind) | `splitZones` rank of the prop did not follow the arm | tool takes the arm's rank change | sweep (tool cells 0-1 flagged) | done |
| B6 | F1 / drone-pilot crown seen from above (198.2-198.5) | crown hair reads as stacked discs | each curl disc drawn fully over the next | `topW` crown merge (the discs merge into one mass from above) | by code + frame sheet | done (not re-rendered on the final build) |
| B7 | all | limb connectivity in extreme poses and unreachable IK targets | n/a | fuzz test: random poses incl. unreachable targets, joint-to-joint distance and end-of-limb inside the reach | no detached limb found | no defect |
| B8 | contacts (hand on a prop/person/ground) | a hand or foot target in world space is drawn tens to hundreds of px off the true projection at 2-3 m camera distance (60-470 px at 2 m, fov 30-44; table in weak_perspective.txt) | the rig uses one scale at the anchor | opt-in `FigSpec.perspective: 'contact'` (`worldToRigTrue`, true `project`) for hand/foot world targets | `qa/r4/rig/weak_perspective.txt` | done (opt-in, off by default so no shot changes) |

### What the 47 remaining flagged body steps are (3 roles x 9 cells at 2 degree steps, pitch 10, min 60 px)

Triaged from the cards (`qa/r4/rig/body_sweep_remaining_flagged_cards.jpg`, first 12 of 47): the large majority are fast-moving
edges at a 2 degree step (the tool or a hand at the end of a long lever arm; the eroded diff still sees a swept blob), not a
part switching. Two residual visual blemishes: a faint ring (shoulder cap ink fading in at partial opacity) on a green sleeve
at breaker braced 38->40 (376 px, one frame, thin line); slump 286->288 (all 3 roles, 109 px: the new hip cap of a thigh tangent to the torso's edge fades in under the translucent edge shade; continuous at 1 degree); lying poses (2-4 each) where the body is on the ground and the arm
and torso overlap almost parallel.


## Regression found in the R4 full render, fixed (black ink discs and shards)

| # | Where | Observed | Cause | Fix | Verified |
|---|---|---|---|---|---|
| X1 | B2 15.0-16.6 (shoulder of the near arm: a solid ink disc, about 40 px); C2/C3 39.4-45.2 (black parallelograms and slivers floating next to the green-shirt and teal-headband figures, 8-10 at 43.0 s) | the ink layer of a limb drawn without its fill, or a stale copy of it, over the torso and in the air | NOT the mask geometry: React patching. `torsoParts` returned the limb either as the bare group or wrapped in `<g><defs><mask/></defs><g mask>`. Frame to frame the same keyed part flipped between the two shapes and React left the old group in the page next to the new one (an ink quad plus a circle, opacity 1). Every static check (renderToStaticMarkup, `remotion still`, a one-frame render) is a fresh DOM and could not show it; only frames rendered in sequence in one page (Remotion) do. Found by a React harness that renders frames in sequence into one root and compares the DOM with a fresh render of the last frame | `torsoParts` gives every part ONE DOM shape: `<g><defs>{mask or nothing}</defs><g mask={url or undefined}>{limb}</g></g>`, for all branches (not touching, in front, behind, extra copy). Also: every mask/clip id and the Figure's root key carry a signature of the pose (a new pose is a new subtree). `bT` 10*s -> 16*s (a near arm tangent to the torso: the mask cut ragged yellow holes in the sleeve at B2 15.6; the arm's front is about its radius, 15*s, nearer than its axis) | `qa/r4/rig/R4regress_B2_black_disc_before_after_f450-468-486.jpg`, `R4regress_C2C3_black_shards_before_after_f1200-1290.jpg` (top = the R4 review render, bottom = now, both frames rendered in sequence with `remotion render --frames`); sequence-vs-fresh DOM equality on all 103 shots, 3 windows each (see tools/README.md); body sweeps re-run: no new pops (breaker crouch 2 -> 1, runner lying 4 -> 1, others equal) |

The plate / white-stripe patch on the Director's forearm at 13.0-13.8 is not a rig regression: the same frame rendered with the
rig of the start of R4 (d528469) and with the current rig shows the same plate; the R3 video differs from the R4 video in the
Director's pose and camera there (section B), not in the rig. The faint ring at the shoulder cap and the lighter sleeve strip
in the B2 near arm are also present in the R3 rig output.

Hip cap (new this session, `LimbG startCap = fwdK`): a thigh toward the camera starts with a rounded hip; its ink and fill fade
with fwdK, so it cannot appear as a disc by itself (it is hidden by the torso/pelvis whenever the thigh hangs).

## Not rig faults (for the section agents)

- D4 seated Director (179.3-180.8): with the continuous torso mask the Director's right hand and forearm are now VISIBLE over
  the belly (R3: arm wholly hidden behind the torso). The pose has the wrist ~14 units in front of the torso's surface and the
  elbow ~83 behind it, so the forearm emerges from inside the belly with a hard, unlined edge. Fix is in the pose
  (`shots/D4/crew`): move the hand target forward or the elbow out, or set `armOverride` for that arm.
- `FigSpec.perspective: 'contact'` is available to B/C/D/EF for hands/feet at world targets.
- The headset band is now drawn over hair in all views (was under it in some); ears/cup/boom keep their depth by the skull test.
- Rig-lab pages 0-6 differ from R3 on purpose (elbow style no longer switches, headset band over the hair, ears and cup by
  depth, legs under the shirt hem); page 14 not compared pixel by pixel.

## Limits

Full-film render not run; section shots other than E2 (f5914-5937), D4 seated legs and the sweeps above were not re-rendered
on the final build; hand-over-face (zone 2) continuity not re-verified beyond the arms listed; Remotion render-time cost not
measured (benchmark in the scratchpad: about the cost of two extra masks per arm/leg touching the torso).
