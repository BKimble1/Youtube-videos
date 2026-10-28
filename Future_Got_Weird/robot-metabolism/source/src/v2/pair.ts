// V2: the transfer "pair" — a broken robot D (a collapsed triangle of dead links) still holding one intact, working
// module M, and an incomplete robot O (a tetrahedron missing one base edge, its apex links short: it sags).
// The same pair, at the same place relative to the floor grid, opens the film (tau = t) and closes it (tau = t - 25.7),
// so the last frame runs straight into the first.
//
// tau (s, from the measured narration; tau < 0 is only seen at the end of the film):
//  -3.0 .. -0.6  O crawls in toward D (the end of the film: "another compatible robot approaching").
//  -0.7 .. 0.6   M lets go of D: its connector at D's vertex pulls its magnet back and M shortens by 8 cm, so its
//                end slides off D's vertex. O's front-near vertex V0 reaches toward M's free end.
//   0.6 .. 1.95  V0 arrives; M's connector turns its magnet toward V0 (alignment); the last 2 cm close fast; contact.
//  1.95 .. 2.36  The rear vertex V1 swings in to M's other end; alignment; contact. M is now the missing base edge.
//  2.36 .. 3.2   M extends 4 cm as the closed base pulls in, and the apex links extend: the robot rises into a
//                complete, taller tetrahedron (apex about 17 cm -> 33 cm).
// In pair coordinates the completed robot is tetra(FINAL, origin): front edge V0-V2 at x = 0, rear vertex V1 at +x,
// so the later gait code continues from exactly this pose.
import {add, clamp, easeIn, len, mix, mul, norm, ss, ss5, sub, V3, v3, lerp, dot} from '../lib/v3';
import {E, T} from '../lib/time';
import {COL, GY, KC, Link} from '../rig/truss';
import {EDGES, lensAdd, Lens, regular, tetra, Tet, trilat} from '../rig/body';

export const FINAL: Lens = {l02: 0.33, l01: 0.33, l12: 0.33, l03: 0.38, l13: 0.38, l23: 0.38};
const F0 = tetra(FINAL, {x: 0, z: 0, yaw: 0, tilt: 0});
/** along the open edge (V0 -> V1) and its outward normal on the ground */
export const EDIR = norm(sub(F0.V1, F0.V0));
export const NDIR = norm(v3(-EDIR.z, 0, EDIR.x)); // points away from V2
const W = 0.075; // M lies this far outside the open edge
const SPREAD = 0.05;

export const PT = {
  release0: -0.7,
  snap1: T('spare') + 0.05,
  snap2: T('body') + 0.15,
  risen: E('parts') + 0.22,
};

// M at the start: its a-end (motor end) near V0, its b-end on D's vertex
const MA0 = add(add(F0.V0, mul(EDIR, -0.02)), mul(NDIR, W));
const MB0 = add(add(F0.V1, mul(EDIR, 0.02)), mul(NDIR, W));
// D: the broken robot, outward of M
const DV = MB0;
const DX = add(add(DV, mul(NDIR, 0.31)), mul(EDIR, 0.07));
const DY = add(add(DV, mul(NDIR, 0.25)), mul(EDIR, -0.17));

export const brokenD = (off: V3): Link[] => [
  {id: 'D0', a: add(DV, off), b: add(DX, off), band: COL.bandB, led: 0, crack: true},
  {id: 'D1', a: add(DX, off), b: add(add(DY, v3(0.03, 0, 0.03)), off), band: COL.bandB, led: 0, noCapB: true},
  {id: 'D2', a: add(DY, off), b: add(DV, off), band: COL.bandB, led: 0},
];

/** direction blend for a turning magnet window */
const aim = (from: V3, to: V3, k: number) => norm(lerp(norm(from), norm(to), clamp(k)));

export type PairState = {tau: number; tet: Tet; lens: Lens; M: Link; links: Link[]; D: Link[]; open: boolean; cue1: number; cue2: number; relM: number};

/** the pair at time tau, placed at `off` (world offset of the pair origin) */
export const pairState = (tau: number, off: V3): PairState => {
  const o = (p: V3) => add(p, off);
  // ---- O's vertices
  const V2 = F0.V2;
  // the approach from the left (before the film loops)
  const app = (1 - ss5(-3.0, -0.6, tau)) * 0.22;
  const crawlWob = Math.sin(tau * 9) * 0.01 * (1 - ss(-0.8, -0.4, tau)) * (tau < -0.4 ? 1 : 0);
  const V0open = add(F0.V0, mul(EDIR, -SPREAD));
  const V1open = add(F0.V1, mul(EDIR, SPREAD));
  const MB1 = add(MB0, mul(EDIR, -0.08)); // where M's b-end ends up after letting go of D (8 cm clear of its vertex)
  // V0: reaches out to M's a-end, the last 2 cm accelerating
  const r0 = PT.snap1 - 0.25;
  let V0: V3;
  if (tau < r0) V0 = lerp(V0open, add(MA0, mul(NDIR, -0.02)), ss5(-0.4, r0, tau));
  else if (tau < PT.snap1) V0 = lerp(add(MA0, mul(NDIR, -0.02)), MA0, easeIn(r0, PT.snap1, tau, 2.6));
  else V0 = lerp(MA0, F0.V0, ss5(PT.snap2 + 0.05, PT.risen, tau));
  // V1: swings in to M's b-end after the first contact
  const r1 = PT.snap2 - 0.14;
  let V1: V3;
  if (tau < PT.snap1 + 0.02) V1 = V1open;
  else if (tau < r1) V1 = lerp(V1open, add(MB1, mul(EDIR, 0.018)), ss5(PT.snap1 + 0.02, r1, tau));
  else if (tau < PT.snap2) V1 = lerp(add(MB1, mul(EDIR, 0.018)), MB1, easeIn(r1, PT.snap2, tau, 2.6));
  else V1 = lerp(MB1, F0.V1, ss5(PT.snap2 + 0.05, PT.risen, tau));
  // apex: short links (sagging) until the base is closed, then they extend and the robot rises
  const rise = ss5(PT.snap2 + 0.05, PT.risen, tau);
  const ap = mix(0.288, FINAL.l03, rise) + Math.sin(tau * 6.3) * 0.006 * (1 - rise);
  const shift = v3(-app, 0, 0);
  const V0w = add(V0, add(shift, v3(crawlWob, 0, 0))), V1w = add(V1, shift), V2w = add(V2, add(shift, v3(-crawlWob, 0, 0)));
  let V3_ = trilat(V0w, V1w, V2w, ap, ap, ap, v3(0, 1, 0));
  const tet: Tet = {V0: o(V0w), V1: o(V1w), V2: o(V2w), V3: o(V3_)};
  const lens: Lens = {l02: len(sub(V0w, V2w)), l01: len(sub(V1w, V0w)), l12: len(sub(V1w, V2w)), l03: ap, l13: ap, l23: ap};

  // ---- M: lets go of D, then joins V0 and V1
  const relM = ss(-0.75, -0.6, tau) * (1 - ss(1.2, 1.6, tau)); // its b-end magnet pulled back while it leaves D
  const MB = tau < PT.snap2 ? lerp(MB0, MB1, ss5(-0.6, 0.55, tau)) : sub(tet.V1, off);
  const MA = tau < PT.snap1 ? MA0 : sub(tet.V0, off);
  // magnet windows turn toward their partner before contact
  const toV0 = sub(V0, MA0), toV1 = sub(V1, MB);
  const winA = tau < PT.snap1 ? aim(mul(EDIR, -1), toV0, ss5(0.7, PT.snap1 - 0.3, tau)) : undefined;
  const winB = tau < PT.snap2 ? aim(EDIR, toV1, ss5(PT.snap1 + 0.05, PT.snap2 - 0.12, tau)) : undefined;
  const M: Link = {id: 'M', a: o(MA), b: o(MB), band: COL.bandX, led: 1, winA, winB, relB: relM};

  const links: Link[] = EDGES.filter(([a, b]) => !(a === 'V0' && b === 'V1')).map(([a, b], i) => {
    const flip = i % 2 === 1;
    return {id: `O${i}`, a: flip ? tet[b] : tet[a], b: flip ? tet[a] : tet[b], band: COL.bandT, led: 1};
  });
  // O's connectors that will meet M turn toward it as it comes (the V0-V2 link's end at V0, the V1-V2 link's at V1)
  const k1 = ss5(0.7, PT.snap1 - 0.3, tau) * (tau < PT.snap1 ? 1 : 0);
  const k2 = ss5(PT.snap1 + 0.05, PT.snap2 - 0.12, tau) * (tau < PT.snap2 ? 1 : 0);
  for (const l of links) {
    if (k1 > 0 && l.a === tet.V0) l.winA = aim(sub(l.a, l.b), sub(o(MA0), tet.V0), k1);
    if (k1 > 0 && l.b === tet.V0) l.winB = aim(sub(l.b, l.a), sub(o(MA0), tet.V0), k1);
    if (k2 > 0 && l.a === tet.V1) l.winA = aim(sub(l.a, l.b), sub(o(MB1), tet.V1), k2);
    if (k2 > 0 && l.b === tet.V1) l.winB = aim(sub(l.b, l.a), sub(o(MB1), tet.V1), k2);
  }
  void dot; void KC; void GY; void regular; void lensAdd;
  return {tau, tet, lens, M, links: [...links, M], D: brokenD(off), open: tau < PT.snap2, cue1: clamp((tau - PT.snap1) / 0.32), cue2: clamp((tau - PT.snap2) / 0.32), relM};
};
