// HOOK 10: the physical signal paths (world polylines, body-anchored) and the cutaway's track. Shared by the drawing
// (cables, lead, nerves, cord) and by the travelling pulses, so a pulse always rides exactly on its cable or nerve.
import {add, mul, V} from '../rig/math';
import {Frames, spineTrack, track, Track, vertebrae, Vert} from './body';

/** where things sit, in head-local units (radius 100) */
export const HEADPT = {
  implant: {x: 52, y: -82},
  implantFar: {x: 26, y: -96},
  puck: {x: 62, y: -100},
  puckFar: {x: 34, y: -118},
  cortex: {x: 22, y: -66},
  brainstem: {x: 38, y: 40},
};
/** torso-local anchors (u up from the pelvis centre, v toward his back) */
export const TORPT = {
  packTop: {u: 336, v: 116},
  packBottom: {u: 196, v: 122},
  pod: {u: 34, v: -50},
  ipg: {u: 62, v: -30},
  paddleTop: {u: 152, v: 0},
  paddleBottom: {u: 104, v: 0},
};

export type Paths = ReturnType<typeof pathsOf>;

export const pathsOf = (F: Frames) => {
  const T = (u: number, v: number) => F.tor(u, v);
  const Hh = (x: number, y: number) => F.head(x, y);
  const spine = spineTrack(F);
  const verts: Vert[] = vertebrae(F, spine);
  const byName = (n: string) => verts.find((v) => v.name === n)!;
  // the cord: dorsal to the vertebral bodies (canal), from the brainstem to the conus at L1
  const cordOff = (v: Vert) => v.depth * 0.5 + 9 * F.s;
  const cordPts: V[] = [Hh(42, 8), ...verts.filter((v) => v.region !== 'L' || v.name === 'L1').map((v) => add(v.p, mul(v.n, cordOff(v))))];
  const cord = track(cordPts, 8);
  // the paddle lies on the back of the cord over T11-L1 (the lumbosacral segments), in the epidural space
  const t11 = byName('T11'), l1 = byName('L1'), t12 = byName('T12');
  const padOff = (v: Vert) => v.depth * 0.5 + 19 * F.s;
  const paddle = {
    top: add(t11.p, add(mul(t11.n, padOff(t11)), mul(t11.a, -6 * F.s))),
    mid: add(t12.p, mul(t12.n, padOff(t12))),
    bottom: add(l1.p, add(mul(l1.n, padOff(l1)), mul(l1.a, 10 * F.s))),
  };
  const l2 = byName('L2');
  // implanted lead: paddle -> out of the canal at L2 -> round the flank -> pulse generator header
  // (listed from the pulse generator's header to the paddle: the direction the commands travel)
  const lead = track([
    T(62, -6),
    T(58, 26),
    T(54, 60),
    T(66, 82),
    add(l2.p, mul(l2.n, l2.depth * 0.5 + 34 * F.s)),
    paddle.bottom,
  ], 10);
  // external cable: headset coil -> over the back of the head -> behind the neck -> backpack processor
  const cableHead = track([
    Hh(80, -96),
    Hh(102, -70),
    Hh(112, -46),
    Hh(122, 16),
    add(F.j.N, add(mul(F.upC, 22), mul(F.pxC, 74))),
    add(F.j.N, add(mul(F.upC, -20), mul(F.pxC, 84))),
    T(356, 104),
    T(TORPT.packTop.u, TORPT.packTop.v - 8),
  ], 10);
  // external cable: backpack -> down the back -> along the belt -> transmitter on the belly
  const cableBelt = track([
    T(TORPT.packBottom.u, TORPT.packBottom.v - 10),
    T(160, 104),
    T(100, 96),
    T(50, 86),
    T(30, 40),
    T(TORPT.pod.u + 2, TORPT.pod.v + 16),
  ], 10);
  // hops (through skull/scalp and through the skin): straight and short
  const hop1 = track([Hh(HEADPT.implant.x, HEADPT.implant.y - 6), Hh(HEADPT.puck.x, HEADPT.puck.y + 8)], 4);
  const hop2 = track([T(TORPT.pod.u, TORPT.pod.v), T(TORPT.ipg.u, TORPT.ipg.v)], 4);
  // the brain's own motor command: cortex -> internal capsule -> brainstem -> cord (stops at the injury)
  const natural = track([Hh(HEADPT.cortex.x, HEADPT.cortex.y), Hh(16, -36), Hh(24, -10), ...cordPts.slice(0, 6)], 8);
  // the injured segment: C5-C7
  const c5 = byName('C5'), c7 = byName('C7');
  const lesion = {a: add(c5.p, mul(c5.n, cordOff(c5))), b: add(c7.p, mul(c7.n, cordOff(c7))), c: add(byName('C6').p, mul(byName('C6').n, cordOff(byName('C6'))))};
  // leg nerves (near leg): lumbar roots -> femoral (front of thigh, quadriceps); sacral roots -> sciatic (back of
  // thigh) -> tibial (calf) and common peroneal (front of shin)
  const L = (f: number, w: number) => F.leg(f, w);
  const femoral = track([paddle.mid, add(l2.p, mul(l2.n, 4 * F.s)), T(30, 14), T(-24, -8), L(0.16, 16), L(0.5, 22), L(0.8, 20)], 8);
  const sciatic = track([paddle.bottom, add(byName('L5').p, mul(byName('L5').n, 30 * F.s)), T(-30, 56), L(0.1, -26), L(0.5, -22), L(0.92, -14), L(1.25, -14), L(1.75, -10)], 8);
  const peroneal = track([L(0.92, -14), L(1.06, 4), L(1.35, 14), L(1.8, 12)], 8);
  // the cutaway window's track: brain -> neck -> back -> lower back -> near hip -> knee -> ankle (anchor index = key)
  const winAnchors = [Hh(26, -62), F.j.N, T(250, 34), T(120, 20), F.j.lLeg.hp, F.j.lLeg.K, add(F.j.lLeg.A, mul(F.upT, 30))];
  return {spine, verts, byName, cord, cordOff, paddle, lead, cableHead, cableBelt, hop1, hop2, natural, lesion, femoral, sciatic, peroneal, winAnchors};
};

/** arc length along a polyline through anchors, for a fractional anchor index */
export const anchorTrack = (anchors: V[]): {T: Track; idx: (k: number) => number} => {
  const T = track(anchors, 10);
  const idx = (k: number) => {
    const i = Math.max(0, Math.min(anchors.length - 1, k));
    const i0 = Math.floor(i), f = i - i0;
    const d0 = T.cum[Math.min(i0 * 10, T.cum.length - 1)];
    const d1 = T.cum[Math.min((i0 + 1) * 10, T.cum.length - 1)];
    return d0 + (d1 - d0) * f;
  };
  return {T, idx};
};
