// The main acquisition bench: the receiving robot (tetrahedron T, six links) and the separate module X (amber band).
// Everything is a pure function of time t (s), placed from the measured narration.
//
//  0.0 -  0.6  T is already moving (apex links working); X makes a short telescoping move of its own.
//  0.6 -  1.8  operator-driven approach: T's rear links extend so its rear vertex V1 slides toward X; X extends toward V1.
//  1.8 - ~2.1  the last 2.5 cm close by magnetic attraction (accelerating); contact and connection on "spare".
//  2.1 -  3.2  the body steps forward and drags the new module with it: it is now part of the body.
//  3.3 -  6.1  "motorized rods that stretch and shrink": X contracts, stretches and shrinks; T's apex rises and falls.
//  6.2 -  7.8  "with magnets at their ends": the joint at V1 holds still for the cut-away.
//  8.4 - 10.9  "A person controls ... guiding another rod into place": T rears up about its front edge; X, still joined
//              at V1, swings up into a prop under the lifted rear vertex.
// 11.5 - 14.6  "Once it connects, that extra piece becomes a walking stick": the weight settles onto X; its tip plants
//              and X pushes: two strokes, the body travelling forward (-x) on its front edge.
import {add, clamp, easeIn, mix, ss, ss5, sub, len, V3, v3, mul, norm} from '../lib/v3';
import {E, T} from '../lib/time';
import {COL, GY, KC, Link} from '../rig/truss';
import {EDGES, lensAdd, Lens, regular, tetra, Tet} from '../rig/body';

export const HOOK = {
  // contact (both connectors touching) and the connection
  contact: T('spare') + 0.14,
  pushEnd: E('parts') + 0.2,
};

/** a smooth bump 0 -> 1 -> 0 over [a, b] */
const bump = (a: number, b: number, t: number) => (t <= a || t >= b ? 0 : Math.sin(((t - a) / (b - a)) * Math.PI));

export type BenchState = {
  t: number;
  tet: Tet;
  lens: Lens;
  X: Link;
  links: Link[];
  /** X joined to T at V1 */
  joined: boolean;
  /** gap (m) between X's near end and V1 before contact */
  gap: number;
  tilt: number;
  /** contact cue phase (0..1) at V1 and at the stick tip */
  cueJoin: number;
  cueTip: number;
  /** cut-away of the connectors at V1 (0..1) */
  sec: number;
};

const X_TIP0 = 0.6758; // X's far end (planted) at the start, x: 0.30 m from its near end, 0.14 m from V1
export const benchState = (t: number): BenchState => {
  // ---- body pose and lengths
  let L = regular();
  // the working apex at the start (a slow sway: the machine is visibly running)
  const sway = Math.sin(t * 5.2) * 0.012 * (1 - ss(2.0, 3.2, t)) + Math.sin(t * 3.1 + 1) * 0.006;
  L = lensAdd(L, {l03: sway, l23: -sway * 0.6, l13: -sway * 0.4});
  // approach: rear links extend so V1 slides out toward X
  const app = ss5(0.55, 1.85, t);
  L = lensAdd(L, {l01: 0.032 * app, l12: 0.032 * app});
  // stretch and shrink (T's apex rises, then lowers)
  const tStretch = T('stretch'), tShrink = T('shrink');
  const up = ss5(tStretch - 0.08, tStretch + 0.42, t) - ss5(tShrink - 0.05, tShrink + 0.42, t) * 1.0;
  const lo = ss5(tShrink - 0.05, tShrink + 0.42, t) - ss5(E('ends') - 0.2, E('ends') + 0.5, t);
  L = lensAdd(L, {l03: 0.07 * up - 0.025 * lo, l13: 0.07 * up - 0.025 * lo, l23: 0.07 * up - 0.025 * lo});

  // rear up onto the stick (operator)
  const tKey = T('controls') + 0.25;
  const TILT = (27 * Math.PI) / 180;
  let tilt = TILT * ss5(tKey + 0.15, T('place') + 0.1, t);
  // the weight settles onto the stick on "Once it connects" (a small give, then held)
  tilt -= ((2.2 * Math.PI) / 180) * bump(T('once') - 0.05, E('connects') + 0.25, t);
  // the lean before rearing: apex links shift the body's weight forward
  const lean = ss5(tKey, tKey + 0.6, t);
  L = lensAdd(L, {l13: 0.03 * lean, l03: -0.015 * lean, l23: -0.015 * lean});

  // ---- body position along the bench (front edge midpoint)
  let bx = -0.05;
  // X's push after the connection
  const push1 = ss5(HOOK.contact + 0.12, HOOK.pushEnd, t);
  bx -= 0.05 * push1;
  // walking-stick strokes
  const s1a = T('extra') - 0.05, s1b = T('walking') + 0.05;
  const s2a = E('stick') - 0.05, s2b = T('the robot') + 0.35;
  const st = ss5(s1a, s1b, t) + ss5(s2a, s2b, t);
  bx -= 0.06 * st;
  const pose = {x: bx, z: 0, yaw: 0, tilt};
  const tet = tetra(L, pose);

  // ---- the module X
  const contact = HOOK.contact;
  let gap: number;
  if (t < 0.6) gap = mix(0.14, 0.08, ss5(0.0, 0.6, t));
  else if (t < contact - 0.27) gap = mix(0.08, 0.026, ss5(0.6, contact - 0.27, t));
  else gap = mix(0.026, 0, easeIn(contact - 0.27, contact, t, 2.6));
  gap = Math.max(0, gap);
  const joined = t >= contact;
  const V1 = tet.V1;
  const dirX = v3(1, 0, 0);
  const xa = joined ? V1 : add(V1, mul(dirX, gap + 0.0));
  // X's far end: planted at X_TIP0 until the stick work. During the hook X extends toward V1 (its near end moves),
  // during "stretch and shrink" its far end slides (the body holds), and while the body rears the far end stays.
  let tipX = X_TIP0;
  // after the connection the body steps forward and the module is dragged along with it (its tip slides)
  tipX -= 0.05 * push1;
  const sh1 = ss5(E('motorized rods') - 0.9, E('motorized rods') + 0.1, t); // contracts a little before the stretch
  const sh2 = ss5(tStretch - 0.08, tStretch + 0.42, t);
  const sh3 = ss5(tShrink - 0.05, tShrink + 0.42, t);
  tipX += -0.09 * sh1 + 0.09 * sh2 - 0.11 * sh3;
  // walking stick: the tip stays planted during a push and slides forward between pushes
  const back = ss5(s1b + 0.02, s2a - 0.02, t);
  tipX -= 0.06 * back;
  // when the body has reared, keep the tip planted where it was (it is set in the world frame)
  const xb = v3(tipX, GY, 0);

  const xLen = len(sub(xb, xa));
  void xLen;
  const tLed = 1;
  const X: Link = {id: 'X', a: xa, b: xb, band: COL.bandX, led: tLed};

  // the cut-away of the joint at V1 for "magnets at their ends"
  const sec = ss(T('magnets') - 0.15, T('magnets') + 0.3, t) * (1 - ss(E('ends') + 0.05, E('ends') + 0.35, t));
  if (joined) X.secA = sec;

  const links: Link[] = EDGES.map(([a, b], i) => {
    // the motor ends: alternate so the bands read on every side
    const flip = i % 2 === 1;
    const A = tet[a], B = tet[b];
    return {id: `T${i}`, a: flip ? B : A, b: flip ? A : B, band: COL.bandT, led: 1};
  });
  // the cut-away at V1: X's connector and the one T connector it rests against (the rear base link toward the camera)
  const near = links[1]; // V0-V1 (V0 is the front-near vertex)
  if (near.a === tet.V1) near.secA = sec;
  else near.secB = sec;

  const cueJoin = clamp((t - contact) / 0.32);
  const cueTip = clamp((t - (T('extra') - 0.08)) / 0.32);
  return {t, tet, lens: L, X, links: [...links, X], joined, gap, tilt, cueJoin, cueTip, sec};
};

export {KC};
