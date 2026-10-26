// V3 beat G (25.61-28.94): the house's place in the storm, the one camera move, and the light. Pure functions of
// film time t.
//   The house is a separate place under the same night storm: it stands on a plain inside the V3 world's near
//   ranges, facing back toward them (the summit is far behind the camera), so the V3 sky, cloud deck, ridges and rain
//   are the same weather the other beats show.
//   One push: from the wide (house, rod, the whole copper conductor and the earth clamp) the camera rises and closes
//   in on the rod tip, finishing on "metal TIP" with the tip at screen (540, 820), pointing straight up (G -> H).
//   The distant strike (25.74) is far beyond the ridges on the right; its flash catches the copper conductor along
//   its whole length, and the sheen of the lit sky then slides up the conductor as the camera rises (earth clamp,
//   wall, roof edge, mast, tip), so the eye follows the metal from the ground to where it ends.
import {sm5} from '../camera';
import {clamp} from '../dc/math';
import {Cam3, v3, V3} from '../v2/p3';
import {B, EV} from './timeline3';

const u = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

// ------------------------------------------------------------------ the house in the world (metres)
/** the house's local frame: x right, y up from the ground, z back from the gable facade (z = 0); the rod stands on
 *  the gable apex at x = 0 */
export const HOUSE = {x: 110, y: 46, z: 700};
export const hw = (x: number, y: number, z = 0): V3 => v3(HOUSE.x + x, HOUSE.y + y, HOUSE.z + z);
/** V2's house illustration (scenes/Rod.tsx, world px) in metres: 78 px per metre, the rod at px x 551, ground 1760 */
export const PXM = 78;
export const hx = (px: number) => (px - 551) / PXM;
export const hy = (py: number) => (1760 - py) / PXM;
/** the rod: mast base on the bracket at the gable apex, the metal tip at the top */
export const ROD_BASE = {x: 0, y: hy(1004)};
export const ROD_TOP = {x: 0, y: hy(872)};
export const TIP_W = hw(0, ROD_TOP.y);
/** the down-conductor's route (local metres): earth clamp, up the wall corner, round the eave, up the roof edge to
 *  the apex, the mast base, and up the rod to the tip (the rod is part of the same metal) */
export const ROUTE_M: {x: number; y: number}[] = [
  {x: hx(862), y: 0.12},
  {x: hx(862), y: hy(1256)},
  {x: hx(884), y: hy(1236)},
  {x: hx(566), y: hy(1018)},
  {x: 0, y: ROD_BASE.y},
  {x: 0, y: ROD_TOP.y},
];
const segLen = ROUTE_M.slice(1).map((p, i) => Math.hypot(p.x - ROUTE_M[i].x, p.y - ROUTE_M[i].y));
export const ROUTE_LEN = segLen.reduce((a, b) => a + b, 0);
/** the point at arc length L (m) along the route */
export const routeAt = (L: number) => {
  let r = clamp(L, 0, ROUTE_LEN);
  for (let i = 0; i < segLen.length; i++) {
    if (r <= segLen[i] || i === segLen.length - 1) {
      const k = clamp(r / segLen[i]);
      const a = ROUTE_M[i], b = ROUTE_M[i + 1];
      return {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, seg: i};
    }
    r -= segLen[i];
  }
  return {...ROUTE_M[ROUTE_M.length - 1], seg: segLen.length - 1};
};
/** arc length where the conductor reaches the mast base (the rod starts) */
export const ROD_L0 = ROUTE_LEN - segLen[segLen.length - 1];

// ------------------------------------------------------------------ the camera
/** the wide (25.61): low in the garden, the whole house, conductor and earth clamp in frame */
export const CAM0 = {x: -0.9, h: 1.7, d: 17, f: 1360, tipY: 620};
/** the end (28.4 on): level with the roof's apex, close on the rod; the tip at (540, 820) (the G -> H contract) */
export const CAM1 = {x: 0, h: 9.45, d: 10.2, f: 2750, tipY: 820};
export const PUSH0 = B.G, PUSH1 = 28.4;
export const pushK = (t: number) => sm5(u(t, PUSH0, PUSH1));
/** The camera stays level and square to the facade (a shifted lens frames the house instead of a tilt), so the walls
 *  and the rod stay truly vertical on screen throughout, like the illustration, and the tip is placed exactly. */
export const rodCam = (t: number): Cam3 => {
  const k = pushK(t);
  // the height leads the closing-in a little (the camera rises with the sheen on the wall, then closes on the rod)
  const kh = sm5(u(t, PUSH0, PUSH1 - 0.25));
  const lg = (a: number, b: number, w: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * w);
  const d = lg(CAM0.d, CAM1.d, k);
  const f = lg(CAM0.f, CAM1.f, k);
  const pos = hw(CAM0.x + (CAM1.x - CAM0.x) * k, CAM0.h + (CAM1.h - CAM0.h) * kh, -d);
  const tipY = CAM0.tipY + (CAM1.tipY - CAM0.tipY) * k;
  const D = TIP_W.z - pos.z;
  return {pos, yaw: 0, pitch: 0, roll: 0, f, cx: 540 - (f * (TIP_W.x - pos.x)) / D, cy: tipY + (f * (TIP_W.y - pos.y)) / D};
};
/** screen pixels per metre at the facade */
export const facadeScale = (cam: Cam3) => cam.f / Math.max(0.5, HOUSE.z - cam.pos.z);

// ------------------------------------------------------------------ the light
/** the distant strike (25.74, a re-stroke at 25.86) and the faint far flicker (28.25, with a second pulse) */
const FLASHES = [
  {t: EV.distantStrike, k: 1, tau: 0.1},
  {t: EV.distantStrike + 0.12, k: 0.55, tau: 0.08},
  {t: EV.farFlicker, k: 0.3, tau: 0.06},
  {t: EV.farFlicker + 0.09, k: 0.18, tau: 0.05},
];
const pulse = (t: number, t0: number, tau: number) => (t < t0 - 0.025 ? 0 : t < t0 ? (t - t0 + 0.025) / 0.025 : Math.exp(-(t - t0) / tau));
/** the strike's light (0..~1.1): sky glow, conductor and rod catching it */
export const strikeK = (t: number) => FLASHES.slice(0, 2).reduce((a, f) => a + f.k * pulse(t, f.t, f.tau), 0);
/** the faint far flicker (beyond the frame by then): it glints on the tip */
export const flickerK = (t: number) => FLASHES.slice(2).reduce((a, f) => a + f.k * pulse(t, f.t, f.tau), 0);
/** the sliding sheen: arc length along the route (m). It leaves the earth clamp as the flash fades, climbs the wall
 *  and the roof edge as the camera rises, and slows up the rod to reach the tip on "metal TIP" */
export const SHEEN0 = 25.84, SHEEN1 = 28.12;
const SHEEN_TAB = (() => {
  const N = 400;
  // velocity profile: quick ease-in at the clamp, an even climb, a long ease-out up the rod
  const vel = (x: number) => clamp(x / 0.12) ** 2 * (3 - 2 * clamp(x / 0.12)) * (x > 0.62 ? 1 - 0.78 * sm5(clamp((x - 0.62) / 0.38)) : 1);
  const acc = [0];
  for (let i = 1; i <= N; i++) acc.push(acc[i - 1] + vel((i - 0.5) / N) / N);
  return acc.map((a) => a / acc[N]);
})();
export const sheenL = (t: number) => {
  const x = u(t, SHEEN0, SHEEN1) * 400;
  const i = Math.min(399, Math.floor(x));
  return ROUTE_LEN * (SHEEN_TAB[i] + (SHEEN_TAB[i + 1] - SHEEN_TAB[i]) * (x - i));
};
/** the sheen's strength: rises as the flash fades, steady on the climb, swells at the tip on "TIP" and the far
 *  flicker, then settles to a quiet highlight */
export const sheenK = (t: number) => (t < SHEEN0 ? 0 : clamp(0.25 + 0.75 * u(t, 25.8, 26.05)) * (1 - u(t, SHEEN1 - 0.04, SHEEN1 + 0.22)));
/** the tip's glint: the strike, the sheen arriving on "TIP" (it gathers there and fades), the far flicker */
export const tipGlint = (t: number) => {
  const arrive = t < EV.wordTip ? clamp(1 - (EV.wordTip - t) / 0.12) ** 2 : Math.exp(-(t - EV.wordTip) / 0.22);
  return clamp(0.75 * arrive + 1.3 * flickerK(t) + 0.9 * strikeK(t));
};
