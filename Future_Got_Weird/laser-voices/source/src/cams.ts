// The camera: one authored path through the room (no cuts). Each connected move is an eased interpolation between
// named framings, so position, direction and apparent velocity carry through every hand-over.
import {easeInOut as eio, inv, lerp} from './lib/math';
import {a3, Cam, lerp3, m3, n3, s3, V3, v3} from './p3';
import {DUR, w, we} from './world';
import {EARP, FOCUS, WALK} from './story';

const C = (pos: [number, number, number], tgt: [number, number, number], f: number): Cam => ({pos: v3(...pos), tgt: v3(...tgt), f});
const E_ = (d: [number, number, number]): [number, number, number] => [EARP.x + d[0], EARP.y + d[1], EARP.z + d[2]];
const E3 = (d: [number, number, number]) => v3(...E_(d));
export const VIEW = {
  // the hook: her face reacting (three-quarter, the left ear toward us), the bystander just behind her, unaffected
  face: C([2.1, 1.55, 0.75], [2.48, 1.5, -0.2], 1450),
  // the connecting widening: the bench and transmitter at lower left, her at upper right, him beside her
  hookWide: C([0.3, 2.1, 2.7], [1.25, 1.12, -0.2], 980),
  // the exposed ear, from the transmitter's side: the air the beam arrives through is on the left
  ear: C(E_([-0.34, 0.035, 0.16]), E_([-0.07, 0, 0]), 1500),
  // closer: the air just outside the ear
  earAir: C(E_([-0.25, 0.025, 0.115]), E_([-0.085, 0.035, 0.005]), 1500),
  // close on the transmitter: the section and its scanning mirror
  devClose: C([-0.32, 1.68, 0.42], [0.05, 1.4, -0.08], 1300),
  // at the far end of the path: the swept arc beside her ear, where the wavelets gather
  sweepEar: C(E_([-0.7, 0.6, 0.95]), E_([-0.15, 0.02, 0.0]), 1200),
  // the crossing view: all three elements, the diagonal kept
  cross: C([0.3, 2.1, 2.7], [1.25, 1.12, -0.2], 980),
  // pushed in on the consequence: the path ending at his shoulder, her face beyond (to the right of his exit path)
  crossClose: C([1.6, 1.85, 1.8], [1.86, 1.38, -0.1], 1000),
  // the end: back to her face (matches the opening)
  faceEnd: C([2.1, 1.55, 0.75], [2.48, 1.5, -0.2], 1450),
};

type Key = [number, Cam, ((x: number) => number)?, {pos: V3; tgt: V3}?];
const mixCam = (a: Cam, b: Cam, k: number, via?: {pos: V3; tgt: V3}): Cam => {
  // with `via`: a quadratic Bezier through a control framing, so a long move can curve round an obstacle while keeping
  // one continuous eased velocity (no stop at the control point)
  const q = (p0: V3, p1: V3, p2: V3) => lerp3(lerp3(p0, p1, k), lerp3(p1, p2, k), k);
  return {pos: via ? q(a.pos, via.pos, b.pos) : lerp3(a.pos, b.pos, k), tgt: via ? q(a.tgt, via.tgt, b.tgt) : lerp3(a.tgt, b.tgt, k), f: Math.exp(lerp(Math.log(a.f), Math.log(b.f), k))};
};
const drift = (c: Cam, d: [number, number, number], k: number): Cam => ({...c, pos: a3(c.pos, m3(v3(...d), k))});
// asymmetric ease: brief acceleration, longer, readable arrival
const arrive = (x: number) => 1 - Math.pow(1 - eio(x), 1.6);

export const camAt = (t: number): Cam => {
  const keys: Key[] = [
    [0, VIEW.face],
    [0.75, drift(VIEW.face, [-0.04, 0.0, 0.05], 1)],
    [2.55, VIEW.hookWide, arrive],
    [w(17) - 0.05, drift(VIEW.hookWide, [0.12, -0.03, -0.1], 1)],
    [we(24) + 0.25, VIEW.ear, arrive, {pos: v3(1.45, 1.75, 1.35), tgt: E3([-0.05, 0.0, 0.0])}],
    [w(29), drift(VIEW.ear, [0.02, -0.005, -0.02], 1)],
    [w(31) + 0.1, VIEW.earAir],
    [we(47), drift(VIEW.earAir, [0.005, 0, -0.008], 1)],
    [w(51) + 0.15, VIEW.devClose, arrive],
    [w(57), drift(VIEW.devClose, [-0.03, 0.01, 0.03], 1)],
    [w(59) + 0.1, VIEW.sweepEar, arrive],
    [w(63) + 0.15, drift(VIEW.sweepEar, [0.03, 0.0, 0.03], 1)],
    [w(67) + 0.1, VIEW.cross, arrive],
    [w(83) + 0.2, drift(VIEW.cross, [0.04, -0.01, -0.03], 1)],
    [w(88) + 0.1, VIEW.crossClose, arrive],
    [WALK.go1 + 0.15, drift(VIEW.crossClose, [0.04, -0.01, -0.04], 1)],
    [w(98) + 0.45, VIEW.faceEnd, arrive],
    [DUR, drift(VIEW.faceEnd, [0.02, 0, -0.03], 1)],
  ];
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return mixCam(keys[i - 1][1], keys[i][1], (keys[i][2] ?? eio)(inv(keys[i - 1][0], keys[i][0], t)), keys[i][3]);
  return keys[keys.length - 1][1];
};
export {FOCUS, n3, s3};
