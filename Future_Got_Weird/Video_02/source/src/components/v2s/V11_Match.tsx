import {worldToScreen, type Cam} from '../../lib/camera';
import {LAYOUT, projectWith, viewAt} from '../../lib/room';
import {RAISED_TILT} from '../../lib/shots';
import {WAREHOUSE, WH_VIEW, whProjectWith, whViewAt} from '../v02/Warehouse';

/**
 * V11 match geometry, shared by V10_KitClip (the V10.5 → V11.1 match) and V11_Warehouse (V11.1, V11.5 and the V11 → V12
 * hard cut). All screen px (1920×1080).
 *
 * V10.5 → V11.1 (match cut): the drawing's partition becomes the warehouse's blind corner. V11.1 opens on CAM_V11_WIDE
 * (v1 S8.1's locked wide framing); the blind corner C (S1's front-right vertical edge, plan x 3.9, z 3.0) stands at
 * V11_CORNER_WIDE.x from floor y V11_CORNER_WIDE.yFloor to the rack top yTop. V10.5 frames its drawing so the
 * partition's near-end vertical edge (the edge the walker passes behind) stands on the same x and floor y, and its top
 * on the rack's top (zoom solved from the two heights).
 *
 * V11 → V12 (hard cut, same screen position): V12.1 uses v1 S9.2's raised room framing, copied (not imported) from
 * src/scenes/S9_Payoff.tsx: tilt RAISED_TILT (0.10), CAM_W = {cx 955, cy 508, zoom 1.11}, DEFAULT_VIEW. The contract
 * is the screen x of the partition's far (wall) end vertical edge in that framing, computed here from lib/room:
 *   camera-facing edge (x − thickness/2 = 1.98, z 0.65): 881.94 px   ← V12_PARTITION_FAR_X (the visible edge)
 *   centre line (x 2.00): 889.23 px · back edge (x 2.02): 896.52 px
 * V11.5's last frame puts the blind corner's vertical edge on V12_PARTITION_FAR_X (asserted in V11_Warehouse, ±15 px).
 */

/** v1 S9.2's raised framing (S9_Payoff.tsx CAM_W), copied by value. */
export const S92_CAM: Cam = {cx: 955, cy: 508, zoom: 1.11};
export const S92_TILT = RAISED_TILT;

const farEdgeX = (dx: number) => {
  const o = LAYOUT.occluder;
  const p = projectWith(viewAt(S92_TILT), {x: o.x + dx, z: o.z0, h: 0});
  return worldToScreen(S92_CAM, p.x, p.y).x;
};
/** The V11 → V12 contract: screen x of the partition's far-end (camera-facing) vertical edge in S9.2's framing. */
export const V12_PARTITION_FAR_X = farEdgeX(-LAYOUT.occluder.thickness / 2);
/** The same edge's centre line and back edge (for the report). */
export const V12_PARTITION_FAR_X_CENTRE = farEdgeX(0);
export const V12_PARTITION_FAR_X_BACK = farEdgeX(LAYOUT.occluder.thickness / 2);

/** V11.1: v1 S8.1's locked wide front view, a little wider and lower (zoom 0.9 → 0.8, cy 660 → 587) so the blind
 *  corner's edge (floor to rack top) is as tall as the drawing's partition can be while the walker stays in the card. */
export const CAM_V11_WIDE: Cam = {cx: 900, cy: 587, zoom: 0.8};

const RACK_TOP_H = WAREHOUSE.shelves.S1.h1;
/** World px (front view, tilt 0) of the blind corner's vertical edge: x, floor y, rack-top y. */
export const CORNER_WORLD = (() => {
  const s = whViewAt(0, WH_VIEW);
  const f = whProjectWith(s, {x: WAREHOUSE.corner.x, z: WAREHOUSE.corner.z, h: 0});
  const t = whProjectWith(s, {x: WAREHOUSE.corner.x, z: WAREHOUSE.corner.z, h: RACK_TOP_H});
  return {x: f.x, yFloor: f.y, yTop: t.y};
})();

/** Screen position of the blind corner's edge under a front-view camera. */
export const cornerOnScreen = (cam: Cam) => {
  const f = worldToScreen(cam, CORNER_WORLD.x, CORNER_WORLD.yFloor);
  const t = worldToScreen(cam, CORNER_WORLD.x, CORNER_WORLD.yTop);
  return {x: f.x, yFloor: f.y, yTop: t.y};
};

/** The corner in V11.1's first frame (the V10.5 → V11.1 match target). */
export const V11_CORNER_WIDE = cornerOnScreen(CAM_V11_WIDE);
