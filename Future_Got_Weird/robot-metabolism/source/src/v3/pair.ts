// V3 hook group, in a local frame on flat ground (y = 0 is the ground, x forward toward the ramp, z toward the camera
// side): an incomplete robot O (a tetrahedron missing its near base edge V0-V1, feet splayed, apex links short: it
// sags), a broken donor robot B (three dead links in a flat triangle), and two working links that came off B: L
// (amber, lying along O's open edge) and S (coral, lying behind on the near side; the hero picks it up later).
//
// The same group, by the same function, opens the film at H (tau = t) and ends it at H2 (tau = t - 25.7), so the last
// frame runs into the first.
//
// tau (s):
//  -1.0 .. 0.62  O's foot V0 slides along the open edge toward L's end (the last 12 mm close fast: the magnets)
//   0.62         contact: L's ball joins V0's cluster (it is resting exactly where the cluster holds it)
//   0.95 .. 1.62 L extends along its own axis; its far ball slides over the mat to V1's cluster; contact at 1.62
//   1.85 .. 2.95 L contracts and pulls the feet together while the apex links extend: the robot stands up
import {add, easeIn as ease, mul, norm, ss5, sub, V3, v3, lerp, len, rotY} from '../lib/v3';
import {trilat} from '../rig/body';
import {clusterDeltas, COL, L_MIN, LinkSpec, RB, RigState} from './rig';

// ---------------------------------------------------------------------------------------------------------- body
export const LB = 0.364; // base edge (joint to joint)
export const LA = 0.39; // apex edge, standing
export const LA_C = 0.33; // apex edge, sagging
export const SQ = Math.sqrt(3) / 2;
export const UP = v3(0, 1, 0);
export const apexOf = (V0: V3, V1: V3, V2: V3, la: number, up: V3 = UP) => trilat(V0, V1, V2, la, la, la, up);

/** standing robot, front edge centred at x = fx (local, flat) */
export const standing = (fx = 0) => {
  const V0 = v3(fx, RB, LB / 2), V2 = v3(fx, RB, -LB / 2), V1 = v3(fx - LB * SQ, RB, 0);
  return {V0, V1, V2, V3: apexOf(V0, V1, V2, LA)};
};

/** the hero's links (ids prefixed), its clusters, given its four joints and extra ends */
export const tetLinks = (pre: string, band: string, led = 1): LinkSpec[] => [
  {id: `${pre}02`, a: {j: `${pre}V0`}, b: {j: `${pre}V2`}, band, led},
  {id: `${pre}03`, a: {j: `${pre}V0`}, b: {j: `${pre}V3`}, band, led},
  {id: `${pre}12`, a: {j: `${pre}V1`}, b: {j: `${pre}V2`}, band, led},
  {id: `${pre}13`, a: {j: `${pre}V1`}, b: {j: `${pre}V3`}, band, led},
  {id: `${pre}23`, a: {j: `${pre}V2`}, b: {j: `${pre}V3`}, band, led},
];

// ------------------------------------------------------------------------------------------------- the crouch
const PSI_C = (76 * Math.PI) / 180; // splay of the open edge (60 deg when closed)
const V2L = v3(0, RB, -LB / 2);
/** feet V0, V1 on their circles about V2 at splay psi (rad) */
export const feet = (psi: number) => {
  const half = (psi - Math.PI / 3) / 2;
  const S = standing(0);
  // rotY(p, a) turns about +y; V0 swings toward +x (away from V1), V1 toward -z (away from V0)
  const V0 = add(V2L, rotY(sub(S.V0, V2L), half));
  const V1 = add(V2L, rotY(sub(S.V1, V2L), -half));
  return {V0, V1};
};
const C = feet(PSI_C);
export const V0C = C.V0, V1C = C.V1;
export const UL = norm(sub(V1C, V0C)); // the open edge direction (V0 -> V1)
const V3C = apexOf(V0C, V1C, V2L, LA_C);

export const PT = {a0: -1.0, hold: 0.45, snap1: 0.62, e0: 0.95, snap2: 1.62, r0: 1.85, r1: 2.95};
const PRE = 0.07; // V0 starts this far back along the edge

// L at rest: its motor-end ball exactly where V0's cluster will hold it at the snap; contracted
const dirsV0 = (V0: V3, V3_: V3) => [norm(sub(V2L, V0)), norm(sub(V3_, V0))];
const dL0 = clusterDeltas([...dirsV0(V0C, V3C), UL])[2];
export const LA_REST = add(V0C, mul(UL, dL0));
export const LB_REST = add(LA_REST, mul(UL, L_MIN));
// where L's far ball meets V1's cluster (it slides along UL to there)
const dirsV1 = (V1: V3, V3_: V3) => [norm(sub(V2L, V1)), norm(sub(V3_, V1))];
const dL1 = clusterDeltas([...dirsV1(V1C, V3C), mul(UL, -1)])[2];
const LB_HIT = sub(V1C, mul(UL, dL1));
const EXT = len(sub(LB_HIT, LB_REST));

// ------------------------------------------------------------------------------------------ the donor and S
const M = mul(add(V0C, V1C), 0.5);
const NOUT = norm(v3(UL.z, 0, -UL.x)); // out of the open edge, away from V2
const BC = add(M, mul(NOUT, 0.5));
/** B: a flat triangle of three dead links (one cracked, one with its far connector snapped off) */
const BJ = [0, 1, 2].map((i) => {
  const a = 0.6 + (i * 2 * Math.PI) / 3;
  return v3(BC.x + Math.cos(a) * 0.205, RB, BC.z + Math.sin(a) * 0.205);
});

// S lies where the hero will reach for it after its crawl: CRAWL_N strides of CRAWL_D, then the rear foot V1 slides
// by REACH_S. At that moment S's motor-end ball is exactly where V1's cluster takes it as its fourth ball.
export const CRAWL_N = 3;
export const CRAWL_D = 0.05;
export const REACH_S = v3(-0.05, 0, 0.1);
export const S_DIR = norm(v3(-0.96, 0, 0.28));
export const reachS = () => {
  const f = CRAWL_N * CRAWL_D;
  const s0 = standing(f);
  const V1 = add(s0.V1, REACH_S);
  const V3_ = apexOf(s0.V0, V1, s0.V2, LA);
  const ds = clusterDeltas([norm(sub(s0.V2, V1)), norm(sub(V3_, V1)), norm(sub(s0.V0, V1)), S_DIR]);
  return {V0: s0.V0, V1, V2: s0.V2, V3: V3_, dS: ds[3]};
};
const RS = reachS();
export const S_A = add(RS.V1, mul(S_DIR, RS.dS));
export const S_B = add(S_A, mul(S_DIR, L_MIN));

export type PairOut = RigState & {cue: {snap1: number; snap2: number}; open: boolean};

/** the group at tau, in local coordinates (ground y = 0); `pre` keeps ids unique between the two groups */
export const pair = (tau: number, pre: string, withS = true): PairOut => {
  // ---- O's feet and apex
  let V0: V3, V1: V3 = V1C, V3_: V3;
  if (tau < PT.snap1) {
    const rem = tau < PT.hold ? 0.012 + (PRE - 0.012) * (1 - ss5(PT.a0, PT.hold, tau)) : 0.012 * (1 - ease(PT.hold, PT.snap1, tau, 2.2));
    V0 = sub(V0C, mul(UL, rem));
    V3_ = V3C;
  } else if (tau < PT.r0) {
    V0 = V0C;
    V3_ = V3C;
  } else {
    const k = ss5(PT.r0, PT.r1, tau);
    const f = feet(PSI_C + (Math.PI / 3 - PSI_C) * k);
    V0 = f.V0;
    V1 = f.V1;
    V3_ = apexOf(V0, V1, V2L, LA_C + (LA - LA_C) * k);
  }
  const J: Record<string, V3> = {[`${pre}V0`]: V0, [`${pre}V1`]: V1, [`${pre}V2`]: V2L, [`${pre}V3`]: V3_};
  const links: LinkSpec[] = tetLinks(pre, COL.bandT);
  // ---- L
  const attachedA = tau >= PT.snap1, attachedB = tau >= PT.snap2;
  let Lb: V3 = LB_REST;
  if (!attachedB && tau > PT.e0) {
    const k = tau < PT.snap2 - 0.1 ? 0.93 * ss5(PT.e0, PT.snap2 - 0.1, tau) : 0.93 + 0.07 * ease(PT.snap2 - 0.1, PT.snap2, tau, 2.2);
    Lb = add(LB_REST, mul(UL, EXT * k));
  }
  const ledL = attachedA ? 1 : 0.55;
  links.push({id: `${pre}L`, a: attachedA ? {j: `${pre}V0`} : {p: LA_REST}, b: attachedB ? {j: `${pre}V1`} : {p: Lb}, band: COL.bandX, led: ledL, ledCol: attachedA ? COL.ledOn : COL.ledIdle});
  // ---- B (dead) and S (idle, waiting)
  for (let i = 0; i < 3; i++) J[`${pre}B${i}`] = BJ[i];
  links.push({id: `${pre}B0`, a: {j: `${pre}B0`}, b: {j: `${pre}B1`}, band: COL.bandB, led: 0, dead: true, crack: true});
  links.push({id: `${pre}B1`, a: {j: `${pre}B1`}, b: {j: `${pre}B2`}, band: COL.bandB, led: 0, dead: true});
  links.push({id: `${pre}B2`, a: {j: `${pre}B2`}, b: {p: add(BJ[0], mul(norm(sub(BJ[2], BJ[0])), 0.058))}, band: COL.bandB, led: 0, dead: true, noBallB: true});
  if (withS) links.push({id: `${pre}S`, a: {p: S_A}, b: {p: S_B}, band: COL.bandS, led: 0.55, ledCol: COL.ledIdle});
  const order: Record<string, string[]> = {
    [`${pre}V0`]: [`${pre}02:a`, `${pre}03:a`, ...(attachedA ? [`${pre}L:a`] : [])],
    [`${pre}V1`]: [`${pre}12:a`, `${pre}13:a`, ...(attachedB ? [`${pre}L:b`] : [])],
    [`${pre}V2`]: [`${pre}02:b`, `${pre}12:b`, `${pre}23:a`],
    [`${pre}V3`]: [`${pre}03:b`, `${pre}13:b`, `${pre}23:b`],
    [`${pre}B0`]: [`${pre}B0:a`],
    [`${pre}B1`]: [`${pre}B0:b`, `${pre}B1:a`],
    [`${pre}B2`]: [`${pre}B1:b`, `${pre}B2:a`],
  };
  return {joints: J, order, links, cue: {snap1: PT.snap1, snap2: PT.snap2}, open: !attachedB};
};

/** move a local rig state to world: turn by yaw about the vertical, then translate to G */
export const placeRig = (s: RigState, G: V3, yaw = 0): RigState => {
  const mv = (p: V3) => add(rotY(p, yaw), G);
  return {
    joints: Object.fromEntries(Object.entries(s.joints).map(([k, p]) => [k, mv(p)])),
    order: s.order,
    links: s.links.map((l) => ({...l, a: 'p' in l.a ? {p: mv(l.a.p)} : l.a, b: 'p' in l.b ? {p: mv(l.b.p)} : l.b})),
  };
};

export {lerp, EXT};
