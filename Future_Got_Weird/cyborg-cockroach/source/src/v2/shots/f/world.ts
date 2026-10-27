// Group F (V3) world: her pocket under the fallen slab and the medic's one continuous walk out of the crack, across the
// narrow ledge and toward her near hand, in ONE place at true scale, so F1-F5 (and the integrator's F6) all show the
// same geography:
//   - her pocket (V2's: the Weird Crew survivor prone on her forearms, facing screen-right, card yaw 70, elev 16, at
//     3.2 px per rig unit = 0.853 px/mm in pocket-world px);
//   - the crack: a broken block at her right side, nearer the camera than her near elbow (crack.tsx's model, in the
//     insect's millimetres: the hole's face is the plane x = 0, the insect walks out along +x). Its hole opens onto a
//     NARROW LEDGE (a broken strip of floor slab, 70 mm wide) that bridges a crevice (a drop) to her floor, which starts
//     at x = LEDGE.x1. The walk heads straight for her near fingertips;
//   - the light: daylight from the upper right (a gap where the slab lifts), and a low crack of light under a rubble
//     mass ahead of her hands (the slit F1's shadow crosses).
// cfView() is an orthographic View (v2/roach/ortho.ts) of the crack frame drawn exactly in her card projection, so the
// insect, the block and the ledge stand on her floor in the two-shots (F3, F5).
import {V3, cross} from '../../../lib/v3';
import {View} from '../../roach/ortho';
import {keys} from '../../../lib/ease';
import {poseRoach, straightPath, RoachPose} from '../../../rig/roach';
import {survivorLayout} from '../../../crew/person';
import {elevator} from '../../../crew/person';
import {cardPt, v3} from '../../../crew/person/geo';
import {shotRange} from '../../cuts2';

export const FPS = 30;
export const R1 = shotRange('F1'), R2 = shotRange('F2'), R3 = shotRange('F3'), R4 = shotRange('F4'), R5 = shotRange('F5');

// ---------------------------------------------------------------- her placement (pocket-world px; V2's F4 rest framing)
export const HER0 = {scale: 3.2, yaw: 70, elev: 16};
export const EYE_AT = {x: 610, y: 650};
export const HER = (() => {
  const L0 = survivorLayout({...HER0, x: 0, y: 0, t: 0});
  return {...HER0, x: EYE_AT.x - L0.eyeMid.x, y: EYE_AT.y - L0.eyeMid.y};
})();
/** rig unit in mm (crew/person: 1 u = 3.75 mm) */
export const MM_U = 3.75;
/** the fallen slab's underside over her (pocket px): clear of her head, lifting toward the right (the daylight gap) */
export const under = (x: number) => 372 - 0.4 * (x - 500);

// ---------------------------------------------------------------- the slab, the crack, the ledge (card-local u)
/** the floor under her near fingertips (card u; her hand open) */
export const TIP = {X: -20, Z: 105};
/** a broken slab lying on her floor ahead of her near hand (card u). Its face toward her right (the camera's side) is at
 *  X = x0; daylight from beyond leaks under that face's lip (the slit, Z slit0..slit1) and spreads a fan of light on the
 *  floor toward -X (to fanX). The insect walks inside along the slit toward her (-Z), unseen, its shadow sliding over
 *  the fan (F1), and comes out of the crack in the slab's end face toward her (Z = z0, F2), onto the narrow ledge over
 *  the crevice, toward her fingertips (F3-F5). Beyond slit1 the gap is choked with debris (the shadow comes out of the
 *  dark into the light). */
export const SLAB = {x0: -66, x1: 40, z0: 192, z1: 330, h: 40, slit0: 197, slit1: 252, gap: 6, fanX: -134, light: 0.22 /* tan of the light's elevation */, inX: 6};
/** the crack frame's origin: the hole's face, in the slab's end face */
export const CRACK_AT = {X: -42, Z: SLAB.z0};
/** the walk's heading (deg in her floor plane, from +X toward +Z): straight at her near fingertips */
export const HEAD_DEG = (Math.atan2(TIP.Z - CRACK_AT.Z, TIP.X - CRACK_AT.X) * 180) / Math.PI;
/** the crack set (the hole, the ledge, the crevice, the medic) is drawn SC times its true size in her pocket: the
 *  cartoon's usual cheat for a small subject beside a person (the insect then reads at about two thirds of her hand's
 *  length, the proportion F6 uses); crack-frame distances are in these scaled millimetres (1 u = 2.5 of them) */
export const SC = 1.5;
/** the ledge: from the hole's face toward her floor, about 70 mm wide; the crevice around it (crack-frame mm) */
export const LEDGE = {x1: 150, zN: -35, zF: 36, thick: 24};
export const CREVICE = {z0: -190, z1: 118, deep: 420};
/** her fingertips' distance from the hole's face along the walk (crack-frame mm) */
export const TIP_X = (Math.hypot(TIP.X - CRACK_AT.X, TIP.Z - CRACK_AT.Z) * MM_U) / SC;

/** crack-frame mm -> her card-local u (before her camera elevation) */
const cfToCard = (p0: V3) => {
  const p: V3 = [p0[0] * SC, p0[1] * SC, p0[2] * SC];
  const a = (HEAD_DEG * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  // crack x -> (cos a, 0, sin a); crack y -> up; crack z = x cross y -> (-sin a, 0, cos a)
  return v3(CRACK_AT.X + (p[0] * c - p[2] * s) / MM_U, p[1] / MM_U, CRACK_AT.Z + (p[0] * s + p[2] * c) / MM_U);
};
/** crack-frame mm -> pocket-world px (her own projection) */
export const cfPx = (p: V3): [number, number] => {
  const E = elevator(HER.yaw, HER.elev);
  const q = cardPt({x: HER.x, y: HER.y, k: HER.scale, phi: HER.yaw, depth: 0}, E(cfToCard(p)));
  return [q.x, q.y];
};
/** an affine map (mm -> px) as a View (ortho.ts): origin plus the images of the three unit axes. For a true
 *  orthographic projection R and U come out orthonormal; for a shadow (a projection along the light onto the floor)
 *  they are sheared, which is fine for a silhouette */
export const linView = (map: (p: V3) => [number, number], s: number): View => {
  const o = map([0, 0, 0]);
  const ax = ([[1, 0, 0], [0, 1, 0], [0, 0, 1]] as V3[]).map((e) => {
    const p = map([e[0] * 100, e[1] * 100, e[2] * 100]);
    return [(p[0] - o[0]) / (100 * s), -(p[1] - o[1]) / (100 * s)];
  });
  const R: V3 = [ax[0][0], ax[1][0], ax[2][0]];
  const U: V3 = [ax[0][1], ax[1][1], ax[2][1]];
  return {R, U, F: cross(R, U), s, ox: o[0], oy: o[1]};
};
/** the crack frame in her projection (pocket-world px) */
export const cfView = (): View => linView(cfPx, (HER.scale / MM_U) * SC);
/** any card-local floor point (u) -> pocket-world px */
export const cardPx = (X: number, Y: number, Z: number): [number, number] => {
  const E = elevator(HER.yaw, HER.elev);
  const q = cardPt({x: HER.x, y: HER.y, k: HER.scale, phi: HER.yaw, depth: 0}, E(v3(X, Y, Z)));
  return [q.x, q.y];
};

// ---------------------------------------------------------------- F1: the unseen insect in the slit
/** its body origin along its walk (crack-frame mm, from slit1, toward card -Z), F1 film seconds */
export const slitWalkX = (T: number) => {
  const t0 = R1.from / FPS;
  return -46 + 58 * (T - t0);
};
/** its mm (x along the walk = card -Z, y up, z = card +X) -> the floor point its shadow falls on (px): each point
 *  drops along the light (low, from beyond the slab) onto the floor toward -X */
export const slitShadowPx = (p: V3): [number, number] => cardPx(SLAB.x0 + SLAB.inX + (p[2] * SC) / MM_U - (p[1] * SC) / (MM_U * SLAB.light), 0, SLAB.slit1 - (p[0] * SC) / MM_U);
export const slitShadowView = (): View => linView(slitShadowPx, (HER.scale / MM_U) * SC);

// ---------------------------------------------------------------- the medic's walk (film seconds T, crack-frame mm)
const T2 = R2.from / FPS, T3 = R3.from / FPS, T4 = R4.from / FPS, T5 = R5.from / FPS, T6 = R5.to / FPS;
/** speed (mm/s): it sets off just before F2 opens (antennae out first), comes on steadily, a little slower and more
 *  careful on the ledge, slowing as it nears her */
export const medicV = (T: number) =>
  keys(T, [[T2 - 0.25, 0], [T2 + 0.15, 54], [T3, 54], [T3 + 0.5, 52], [T4, 48], [T5, 44], [T6, 40]]);
const X0 = -40; // body origin at T2 - 0.25: the head (x + 35) inside the hole, antennae reaching for the mouth
const DT = 1 / 240;
/** body origin x (mm) at film second T (integrated speed: a pure function of T) */
export const medicX = (T: number) => {
  let x = X0;
  const t0 = T2 - 0.25;
  if (T <= t0) return x;
  const n = Math.floor((T - t0) / DT);
  for (let i = 0; i < n; i++) x += medicV(t0 + (i + 0.5) * DT) * DT;
  x += medicV(t0 + (n + 0.5) * DT) * (T - t0 - n * DT);
  return x;
};
const PATH = straightPath([0, 0, 0], 0);
/** the medic's pose at film second T (antennae probing high as it comes out, then reaching ahead) */
export const medicPose = (T: number): RoachPose => {
  const srch = keys(T, [[T2, 1.15], [T3, 0.85], [T4 + 0.2, 0.6], [T6, 0.5]]);
  const pitch = keys(T, [[T2, 0.7], [T3, 0.42], [T4, 0.24], [T6, 0.2]]);
  return poseRoach({
    path: PATH, s: medicX(T), t: T, search: srch, seed: 5,
    antL: {yaw: keys(T, [[T2, 0.95], [T3, 0.66], [T4, 0.6], [T6, 0.5]]), pitch, curl: keys(T, [[T2, 0.5], [T3, 0.8]])},
    antR: {yaw: keys(T, [[T2, 0.9], [T3, 0.6], [T4, 0.58], [T6, 0.48]]), pitch: pitch + 0.04, curl: keys(T, [[T2, 0.45], [T3, 0.8]])},
  });
};
/** a point on the insect's body (body-frame mm) in crack-frame mm */
export const onBody = (pose: RoachPose, p: V3): V3 => {
  const f = pose.frame;
  return [f.o[0] + f.x[0] * p[0] + f.y[0] * p[1] + f.z[0] * p[2], f.o[1] + f.x[1] * p[0] + f.y[1] * p[1] + f.z[1] * p[2], f.o[2] + f.x[2] * p[0] + f.y[2] * p[1] + f.z[2] * p[2]];
};
/** the loaded injector's barrel centre (body frame), where the glint runs */
export const BARREL: V3 = [15, 29.6, 0];
