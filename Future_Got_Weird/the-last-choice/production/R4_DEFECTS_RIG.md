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
| R3 | drone pilot (bob, `checker`), yaw 107->108 and 252->253 | the whole hair mass jumps over the head in one frame (8400 px): the cheek and jaw edge still in view past profile vanish | `bob`: `behind = F.z > -0.3` moved the mass between `extrasBack` and `extrasFront` with a different hem | the mass is always behind the skull/cap (the cap already is the hair in front); strands fade in with `rz(-F.z, 0.3, 0.6)` | before/after strip bob0/bob1; raster | done (verify after sweep) |
| R4 | the face, all roles | eyes, glasses, nose line / nostril, mouth, cheeks, brow cut, nose bleed, lip cut, mouth blood, bruise, dirt: hard depth thresholds while still 5-50 % opaque | `if (q.z <= 0.12) return;` and the like | thresholds moved to where `fold()` is zero; the rest fade with `rz()` | by code (continuity), raster no new pops | done |
| R5 | checker (pencil) | the yellow pencil pops over the hair at yaw 1-2 and 169-170 (334 / 394 px) | `zc > -0.12 ? acc : accBack` | `against()` with the pencil's front-most depth | pending sweep | done |

## Findings (body) — open

| # | Where | Observed | Source cause | Status |
|---|---|---|---|---|
| B1 | every role, back view at yaw ~172 and ~358 (full body) | the upper arm (sleeve over the shirt) vanishes behind the torso in one frame | arm part rank decided by `zoneAt` / `frontSurf` (a threshold on the arm's depth against the torso's rounded edge); a limb tangent to the torso's side is a depth tie | open |
| B2 | runner (stripes), yaw 87->88 and 272->273 | torso stripes: a block of stripes switches at the sides | to be traced | open |
