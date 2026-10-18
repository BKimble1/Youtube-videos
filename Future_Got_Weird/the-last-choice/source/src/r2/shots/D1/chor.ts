// Section D1 (R3): the shared choreography. One timeline (film seconds) and the root keys both sides read, so a machine
// aims at where a person IS and a person at where a machine is, without crew.tsx and machines.ts importing each other.
// Pure: no React. See production/R3_EXCHANGES.md (## D1) for the exchange sheet this implements.
//
//   X1 CLASH        U1 strikes first (running hammer on the plate) → he is driven back → parries its punch → bashes it
//                   back into U3, which steadies it (the machines support each other)
//   X2 BREAKER/U4   U4 hammers (blocked on the tool's shaft) → punches (he ducks under) → its knee broken → on its knee it
//                   catches the tool's head (tug) → the pilot's drone dives at its eye → it lets go to swat → his blow
//                   on its neck kills it; it falls on the tool (he has to wrench it free: why he is late for the rescue)
//   X3 RUNNER/U2    U2 attacks the runner the whole time (sway, parry, hook-and-smack, duck, parry …) and wins: its
//                   backhand puts him on one knee; its finishing hammer is broken by the rescue's consequence
//   X4 TETHER/U5    U5 goes for the runner's back while he is busy with U2: the tether pulls its leg out (74.5); it gets
//                   up (machines do) and comes for her: her second clamp holds it off until it tears the clamp out
//   X5 FLARES/U6    U6 gives up on the evasive flare carrier and goes for the soft targets (the decoy maker sketching,
//                   the pilot flying): her flare in its eye; U8 steps in to cover the blinded unit; she holds them off
//   X6 THE RESCUE   threat (U1 jab, U2 on the runner) → BR1 heavy block, he is driven back, U1 FOLLOWS, presses, shoves →
//                   the breaker comes from U4's wreck; the Director ducks left; BR2 the ram head meets U1's descending
//                   forearm (torn off at the elbow) → U1 turns on the breaker and catches the tool → the Director bashes
//                   its knee → BR3 the ram fired into its chest drives it into U2 (crash): the runner's fight is over →
//                   U3 comes out of the gap: they move
//   X7 BR4          U3 raises its hammer; he gets inside it; the shoulder drive takes it over the crest into the crater
//   X8 GAIN         the system recalls its survivors; the Crew run for the slab; an enemy drone sweeps the rim; they
//                   stay down, eyes on each other, the Director's signal
import {V3, lerp, clamp, smooth} from '../../../kit/math';
import {M} from '../../timing';
import {XZ, KP, KR, G, keyRoot, fwdOf, rightOf, wrapD} from './motion';

// ------------------------------------------------------------------ the timeline (film s)
export const EV = {
  // X1 the clash (the machines strike first)
  clash: M.CLASH + 0.03, // U1's running hammer lands on his plate (one frame after the cut on the beat)
  u1punch: 69.2, // U1's left punch: parried off the plate
  bash1: 69.95, // his plate into U1's chest: it reels back three steps
  steady: 70.4, // U3's hand on U1's back (it steadies it and sends it back in)
  u1jab2: 72.4, // U1's jab: blocked
  dirBash2: 73.85, // his bash: U1 blocks it with its forearm in the path
  u1ham2: 75.2, // U1's hammer: he slips it (north-west); the fist goes down past him
  dirBash3: 75.75, // he bashes the over-reached shoulder
  // X2 the breaker and U4
  u4ham: 70.6, // U4's hammer: taken on the tool's shaft
  u4punch: 71.95, // U4's punch: he ducks under it …
  knee: 72.45, // … and breaks its left knee
  u4catch: 73.15, // on its knee it catches the tool's head: the tug
  harry: 75.3, // the allied drone dives at its eye
  u4let: 75.42, // it lets go to swat at the drone
  u4kill: 76.0, // his blow on its neck: eye dark
  u4topple: 76.85, // it falls forward onto the tool
  toolFree: 78.95, // he wrenches the tool out from under it
  // X3 the runner and U2
  u2punch1: 69.9, // he sways back
  u2ham1: 71.25, // parried on the bar
  hook: 71.65, // he hooks its forearm with the adze and yanks: it stumbles
  smack: 72.05, // the bar on its head
  u2punch2: 73.5, // he ducks
  runJab: 74.95, // the fork into its knee joint
  u2ham2: 75.9, // parried
  u2punch3: 77.9, // he sways back (in the rescue's first frame)
  u2hit: 79.55, // its backhand catches him: down on one knee
  u2punch4: 81.45, // parried from his knee
  u2wind: 82.62, // it raises its arm over him (the finishing hammer) …
  pin: 84.55, // he drives the halligan into its shoulder as it tries to rise
  // X4 the tether and U5
  u5swing: 70.15, // U5 at her: she backs off
  yankFire: 74.1, yankBite: 74.4, yankPull: 74.52, // U5 goes for the runner's back: her clamp on its shin, the yank
  u5up: 77.6, // it gets up
  clamp2Fire: 80.9, clamp2Bite: 81.12, clamp2Taut: 81.3, clamp2Tear: 83.35, // her second clamp holds it off; it tears it out
  // X5 the flare carrier and U6 / U8
  u6punch: 71.1, // U6 at her: she dodges
  flareDraw: 76.05, flareStrike: 76.62, flareThrow: 76.92, flareHit: 77.3, // U6 going for the soft targets: blinded (in her hand from 76.55, when the satchel shows one fewer)
  // X6 the rescue
  u1jab3: 77.65, // threat: its jab on the plate (light block)
  br1: 78.48, // BR1: its hammer on the plate: heavy block, the plate dents, he is driven back — it follows
  press: 79.3, // its forearm on the plate, pressing
  shove: 79.85, // it shoves him off
  brkGo: 79.9, // the breaker, tool free, runs at it
  u1wind: 80.72, // it winds up the finishing hammer
  duck: 81.05, // the Director ducks left (north), out of the tool's way
  br2: 81.34, // BR2: the ram head meets its descending forearm: torn off at the elbow
  u1turn: 81.45, // counter: it turns on the breaker …
  grab: 81.95, // … and catches the tool's head
  dirKnee: 82.33, // the Director's plate into its right knee: it buckles
  release: 82.42, // the grip fails
  br3: 82.8, // BR3: the ram fired into its chest: chest plate off, it is driven back …
  crash: 83.22, // … into U2, mid wind-up over the runner: both go down
  u3go: 83.6, // continuation: U3 comes out of the gap
  dirGo: 83.7, // the Director goes to meet it
  // X7 BR4 (the timeline is BR4 in machines.ts)
  br4Go: 85.9, br4: 86.36, br4Fall: 86.98,
  // X8 the gain
  recall: 87.1, // the surviving front units are pulled back across the crater
  sweep0: 91.25, sweep1: 93.4, // an enemy drone sweeps the rim's crest with its beam
};

// ------------------------------------------------------------------ planted footsteps with skids
/**
 * Footholds for a keyed root, starting from the given feet. Moves between keys are steps (the foot on the side of the
 * move leads; the last step sets the trailing foot), except moves that start at a skid time: there both feet SLIDE with
 * the root (lift 0: a heel skid under a blow). `stag` staggers the stance (left foot forward).
 */
export const stepFeet = (root: KR[], o: {half?: number; stepLen?: number; stag?: number; skids?: number[]; init?: {L: XZ; R: XZ}} = {}): {L: KP[]; R: KP[]} => {
  const half = o.half ?? 0.15, stepLen = o.stepLen ?? 0.5, stag = o.stag ?? 0.14;
  const skids = o.skids ?? [];
  const stance = (x: number, z: number, h: number, side: -1 | 1): [number, number] => {
    const f = fwdOf(h), r = rightOf(h);
    const fo = side < 0 ? stag : -stag;
    return [x + r.x * half * side + f.x * fo, z + r.z * half * side + f.z * fo];
  };
  const r0 = root[0];
  const l0 = o.init ? [o.init.L.x, o.init.L.z] : stance(r0[1], r0[2], r0[3], -1);
  const q0 = o.init ? [o.init.R.x, o.init.R.z] : stance(r0[1], r0[2], r0[3], 1);
  const L: KP[] = [[r0[0], l0[0], l0[1]]];
  const R: KP[] = [[r0[0], q0[0], q0[1]]];
  let first: 'L' | 'R' = 'L';
  for (let i = 1; i < root.length; i++) {
    const a = root[i - 1], b = root[i];
    const dist = Math.hypot(b[1] - a[1], b[2] - a[2]);
    const turn = Math.abs(wrapD(b[3] - a[3]));
    const lastL = L[L.length - 1], lastR = R[R.length - 1];
    if (skids.some((s) => Math.abs(s - a[0]) < 1e-3)) {
      // both feet slide with the root (the rear foot a touch further)
      const dx = b[1] - a[1], dz = b[2] - a[2];
      L.push([b[0], lastL[1] + dx, lastL[2] + dz, 0]);
      R.push([b[0] + 0.03, lastR[1] + dx * 1.08, lastR[2] + dz * 1.08, 0]);
      continue;
    }
    const n = Math.max(dist > 0.03 || turn > 6 ? 1 : 0, Math.ceil(dist / stepLen), Math.ceil(turn / 50));
    if (n === 0) {
      L.push([b[0], lastL[1], lastL[2]]);
      R.push([b[0], lastR[1], lastR[2]]);
      continue;
    }
    const rr = rightOf(a[3]);
    const lat = (b[1] - a[1]) * rr.x + (b[2] - a[2]) * rr.z;
    const fw = fwdOf(a[3]);
    const lon = (b[1] - a[1]) * fw.x + (b[2] - a[2]) * fw.z;
    // sideways: the foot on that side leads; backward: the rear (right) foot leads; forward: the front (left) foot
    first = Math.abs(lat) > dist * 0.6 && dist > 0.03 ? (lat > 0 ? 'R' : 'L') : lon < -0.03 ? 'R' : 'L';
    const steps = n + 1;
    const dur = (b[0] - a[0]) / steps;
    for (let j = 0; j < steps; j++) {
      const t1 = a[0] + dur * (j + 1), t0 = a[0] + dur * j;
      const e = smooth(Math.min(1, (j + 1) / n));
      const x = lerp(a[1], b[1], e), z = lerp(a[2], b[2], e), h = a[3] + wrapD(b[3] - a[3]) * e;
      const foot = (j % 2 === 0) === (first === 'L') ? 'L' : 'R';
      const arr = foot === 'L' ? L : R, other = foot === 'L' ? R : L;
      const p = stance(x, z, h, foot === 'L' ? -1 : 1);
      arr.push([t0 + 0.001, arr[arr.length - 1][1], arr[arr.length - 1][2]]);
      arr.push([t1, p[0], p[1]]);
      other.push([t1, other[other.length - 1][1], other[other.length - 1][2]]);
    }
  }
  return {L, R};
};
/** the foot positions a KP track holds at its end */
export const lastXZ = (k: KP[]): XZ => ({x: k[k.length - 1][1], z: k[k.length - 1][2]});

// ------------------------------------------------------------------ THE DIRECTOR's fight root (68.33 → 83.7)
/** where his run ends: full speed into U1's hammer */
export const DIR_ARRIVE = {x: 41.3, z: -0.72};
export const DIR_FIGHT: KR[] = [
  [EV.clash, 41.3, -0.72, 90], [68.6, 40.92, -0.74, 90], [68.95, 40.88, -0.75, 90], [EV.u1punch, 40.88, -0.75, 90], [69.42, 40.82, -0.76, 87],
  [EV.bash1, 41.22, -0.74, 90], [70.35, 41.1, -0.74, 90], [70.9, 40.88, -0.76, 90],
  [EV.u1jab2, 40.88, -0.76, 90], [72.58, 40.8, -0.76, 90], [73.55, 40.84, -0.76, 90], [EV.dirBash2, 41.1, -0.74, 92], [74.2, 40.92, -0.75, 90],
  [74.98, 40.9, -0.76, 90], [EV.u1ham2 + 0.04, 40.72, -1.1, 80], [EV.dirBash3, 40.98, -1.0, 96], [76.3, 40.86, -0.86, 90],
  [77.3, 40.82, -0.78, 90], [EV.u1jab3, 40.82, -0.78, 90], [77.82, 40.76, -0.78, 90], [78.3, 40.72, -0.78, 90],
  [EV.br1, 40.72, -0.78, 90], [78.78, 40.2, -0.79, 90], [79.2, 40.12, -0.8, 90],
  [EV.press, 40.12, -0.8, 90], [79.62, 39.88, -0.81, 90], [EV.shove, 39.88, -0.81, 90], [79.98, 39.74, -0.82, 91], [80.35, 39.5, -0.84, 93], [80.6, 39.5, -0.84, 90],
  [81.0, 39.5, -0.84, 88], [81.3, 39.56, -1.2, 70], [81.65, 39.6, -1.24, 80], [81.9, 39.8, -1.26, 112], [82.25, 40.1, -1.24, 145],
  [EV.dirKnee, 40.1, -1.24, 145], [82.62, 39.88, -1.42, 118], [83.05, 39.7, -1.72, 64], [EV.dirGo, 39.7, -1.72, 84],
];
/** moves that are heel skids (both feet slide): the clash, BR1, the press */
export const DIR_SKIDS = [EV.clash, EV.br1, EV.press];
export const dirRoot = (T: number) => keyRoot(DIR_FIGHT, T);
/** his head (approx., for the machines' eyes) */
export const dirHeadAim = (T: number): V3 => {
  const r = dirRoot(T);
  const duck = win(T, EV.duck - 0.05, 81.75, 0.22, 0.35);
  const f = fwdOf(r.h);
  return {x: r.p.x + f.x * (0.06 + 0.25 * duck), y: G(r.p.x, r.p.z) + 1.6 - 0.55 * duck, z: r.p.z + f.z * (0.06 + 0.25 * duck)};
};
/** his raised plate (approx.: where blows aimed at the plate go) */
export const plateAim = (T: number): V3 => {
  const r = dirRoot(T);
  const f = fwdOf(r.h), rt = rightOf(r.h);
  return {x: r.p.x + f.x * 0.45 - rt.x * 0.02, y: G(r.p.x, r.p.z) + 1.27, z: r.p.z + f.z * 0.45 - rt.z * 0.02};
};

// ------------------------------------------------------------------ THE BREAKER's fight root
export const BRK_ARRIVE = {x: 39.6, z: 3.25};
export const BRK_FIGHT: KR[] = [
  [68.45, 39.6, 3.25, 76], [69.3, 39.72, 3.2, 78], [70.2, 39.88, 3.15, 80], [EV.u4ham, 39.88, 3.15, 80], [70.9, 39.7, 3.12, 80],
  [71.6, 39.78, 3.1, 82], [72.12, 39.98, 3.0, 86], [EV.knee + 0.4, 39.98, 3.0, 86],
  [EV.u4catch, 39.98, 3.0, 86], [74.3, 39.98, 3.0, 86], [74.62, 40.12, 3.05, 88], [EV.u4let, 40.12, 3.05, 88], [75.62, 39.92, 3.0, 86],
  [EV.u4kill, 40.2, 3.1, 88], [76.85, 40.15, 3.16, 96], [77.45, 39.84, 3.24, 132], [EV.toolFree, 39.84, 3.24, 135], [79.35, 39.8, 2.9, 40],
];
/** the run in: from U4's wreck to U1's left side, the swing at the end */
export const BRK_IN: XZ[] = [{x: 39.8, z: 2.86}, {x: 40.2, z: 1.7}, {x: 40.5, z: 0.72}];
export const BRK_IN_T = [EV.brkGo, 81.2] as const;
export const BRK_FIGHT2: KR[] = [
  [81.2, 40.5, 0.72, 14], [EV.br2 + 0.2, 40.5, 0.72, 14], [EV.grab, 40.5, 0.66, 14], [82.1, 40.4, 0.42, 4], [82.25, 40.32, 0.3, 0], [EV.release, 40.34, 0.32, 2],
  [82.58, 40.42, 0.58, 8], [EV.br3, 40.5, 0.42, 10], [83.15, 40.5, 0.6, 10], [83.7, 40.5, 0.66, 350],
];
/** moves of the breaker's second fight root that are drags (feet slide) */
export const BRK_SKIDS2 = [EV.grab, 82.1];
export const brkRoot = (T: number) => keyRoot(T < 81.2 ? BRK_FIGHT : BRK_FIGHT2, T);

// ------------------------------------------------------------------ THE RUNNER's fight root (vs U2)
export const RUN_ARRIVE = {x: 39.5, z: -3.05};
export const RUN_FIGHT: KR[] = [
  [68.5, 39.5, -3.05, 96], [69.5, 39.95, -3.05, 95], [EV.u2punch1 - 0.05, 40.0, -3.05, 95], [70.15, 39.62, -3.1, 92],
  [70.8, 39.82, -3.1, 94], [EV.u2ham1 + 0.1, 39.76, -3.08, 94], [71.78, 39.9, -2.8, 84], [EV.smack, 39.98, -2.72, 70], [72.6, 39.85, -2.95, 92],
  [EV.u2punch2, 39.88, -3.0, 94], [74.6, 39.88, -3.0, 94], [EV.runJab, 40.12, -3.02, 96], [75.35, 39.9, -3.05, 94],
  [EV.u2ham2 + 0.12, 39.82, -3.08, 94], [77.6, 39.88, -3.1, 94], [EV.u2punch3 + 0.18, 39.55, -3.18, 92], [79.2, 39.95, -3.15, 94],
  [EV.u2hit, 40.05, -3.15, 94], [79.95, 39.82, -3.36, 102], [EV.crash, 39.82, -3.36, 100], [83.7, 39.25, -3.55, 112], [84.05, 39.5, -3.4, 100],
];
export const runRoot = (T: number) => keyRoot(RUN_FIGHT, T);
/** the runner's head (approx., for U2's aim) */
export const runHeadAim = (T: number): V3 => {
  const r = runRoot(T);
  const down = win(T, EV.u2hit + 0.05, 83.3, 0.35, 0.3);
  const duck = win(T, EV.u2punch2 - 0.25, EV.u2punch2 + 0.3, 0.12, 0.2);
  return {x: r.p.x, y: G(r.p.x, r.p.z) + 1.58 - 0.62 * down - 0.4 * duck, z: r.p.z};
};

// ------------------------------------------------------------------ helpers (same shapes as motion.ts)
/** the sweep's beam passes over a spot behind the slab (z) at this time: they flinch down under it */
export const beamOver = (z: number) => EV.sweep0 + ((z - 0.4) / 5.8) * (EV.sweep1 - EV.sweep0);
export const win = (T: number, a: number, b: number, ri = 0.15, ro = 0.15) => smooth(clamp((T - a) / ri)) * (1 - smooth(clamp((T - (b - ro)) / ro)));
