// Laser Voices V4 walking for the Crew rig. A character's pelvis follows a floor path (metres, any curve, any speed);
// footfalls are generated from it at a fixed cadence while it moves: each foot lands a little ahead of the pelvis on
// its own side of the line of travel and stays planted (no sliding) until it lifts for the next step. When the path
// stops, the trailing foot comes alongside so the figure ends in a balanced stance. Arms swing against the legs, the
// hips and shoulders counter-rotate, and the pelvis dips at each contact.
import {Body4} from './cast4';
import {Arm4, Face4, Pose4} from './Crew4';
import {footAt, Plant} from './steps4';
import {v3, V3, worldToCard} from './geo4';
import {FACES} from './poses4';

export type Path2 = (t: number) => {x: number; z: number};
export type Walker = {
  path: Path2; heading: (t: number) => number; plantsL: Plant[]; plantsR: Plant[]; b: Body4; stepT: number; t0: number; t1: number;
};
const RAD = Math.PI / 180;
const speedOf = (p: Path2, t: number) => {
  const a = p(t - 0.03), c = p(t + 0.03);
  return Math.hypot(c.x - a.x, c.z - a.z) / 0.06;
};
export const headingOf = (p: Path2, t: number, fallback: number) => {
  const a = p(t - 0.05), c = p(t + 0.05);
  const dx = c.x - a.x, dz = c.z - a.z;
  return Math.hypot(dx, dz) < 1e-3 ? fallback : (Math.atan2(dx, dz) * 180) / Math.PI;
};
/** Build a walker: footfalls every stepT while the pelvis moves faster than `vMin` (m/s). `heading` (deg, 0 = +Z,
 *  90 = +X) is the body's facing; by default it follows the direction of travel. */
export const makeWalker = (o: {path: Path2; heading?: (t: number) => number; t0: number; t1: number; stepT: number; phase?: number; b: Body4; half?: number; vMin?: number; first?: 'L' | 'R'}): Walker => {
  const half = o.half ?? 0.1, vMin = o.vMin ?? 0.12;
  let lastH = 90;
  const heading = o.heading ?? ((t: number) => (lastH = headingOf(o.path, t, lastH)));
  const L: Plant[] = [], R: Plant[] = [];
  const side = (H: number, s: number) => ({x: Math.cos(H * RAD) * s, z: -Math.sin(H * RAD) * s}); // character's left = +s
  const at = (t: number, s: number, ahead: number) => {
    const H = heading(t), p = o.path(t), sd = side(H, s);
    return {x: p.x + sd.x + Math.sin(H * RAD) * ahead, z: p.z + sd.z + Math.cos(H * RAD) * ahead};
  };
  // initial stance
  const p0L = at(o.t0, half, 0), p0R = at(o.t0, -half, 0);
  L.push({t0: o.t0 - 10, t1: o.t0, x: p0L.x, z: p0L.z});
  R.push({t0: o.t0 - 10, t1: o.t0, x: p0R.x, z: p0R.z});
  let foot: 'L' | 'R' = o.first ?? 'L';
  let moving = false, lastLand = o.t0;
  for (let t = o.t0 + (o.phase ?? 0); t <= o.t1; t += o.stepT) {
    const v = speedOf(o.path, t + o.stepT * 0.5);
    if (v > vMin) {
      moving = true;
      const arr = foot === 'L' ? L : R;
      arr[arr.length - 1].t1 = t; // lift now
      const tl = t + o.stepT * 0.8;
      const land = at(tl, foot === 'L' ? half : -half, Math.min(0.16, v * o.stepT * 0.5));
      arr.push({t0: tl, t1: 1e9, x: land.x, z: land.z});
      lastLand = tl;
      foot = foot === 'L' ? 'R' : 'L';
    } else if (moving) {
      // settle: bring the trailing foot alongside
      const arr = foot === 'L' ? L : R;
      const fin = at(t, foot === 'L' ? half : -half, 0);
      const prev = arr[arr.length - 1];
      const d = Math.hypot(prev.x - fin.x, prev.z - fin.z);
      if (d > 0.04) {
        prev.t1 = Math.max(lastLand + 0.05, t);
        arr.push({t0: prev.t1 + o.stepT * 0.8, t1: 1e9, x: fin.x, z: fin.z});
      }
      moving = false;
    }
  }
  return {path: o.path, heading, plantsL: L, plantsR: R, b: o.b, stepT: o.stepT, t0: o.t0, t1: o.t1};
};

export type WalkState = {ground: V3; heading: number; pose: Pose4; speed: number};
/** The walker's pose at time t (card-local), with optional overrides for the upper body and face. */
export const walkPose = (w: Walker, t: number, o: {face?: Face4; hy?: number; hp?: number; hr?: number; armL?: Partial<Arm4>; armR?: Partial<Arm4>; armMix?: number; lean?: number} = {}): WalkState => {
  const b = w.b;
  const p = w.path(t), H = w.heading(t);
  const g = v3(p.x, 0, p.z);
  const fl = footAt(w.plantsL, t, 0.11), fr = footAt(w.plantsR, t, 0.11);
  const v = speedOf(w.path, t);
  const sp = Math.min(1, v / 1.0);
  const toC = (f: {x: number; z: number; y: number}) => worldToCard(g, H, v3(f.x, f.y, f.z));
  const FL = toC(fl), FR = toC(fr);
  // stride phase from the feet's fore-aft separation (card-local z): + when the left foot leads
  const sep = (FL.z - FR.z) / 60;
  const air = Math.max(fl.y, fr.y) * 267; // u
  const bob = 7 * sp * (1 - Math.min(1, air / 18)) - 3 * sp;
  const swing = Math.max(-1, Math.min(1, sep)) * sp;
  const armY = b.hipY + b.spine - b.upper - b.fore + 14;
  const mixA = o.armMix ?? 1;
  const armL: Arm4 = {hand: v3(b.shW + 14, armY + 6 * Math.abs(swing), -swing * 34 * mixA + 8), ...o.armL};
  const armR: Arm4 = {hand: v3(-b.shW - 14, armY + 6 * Math.abs(swing), swing * 34 * mixA + 8), ...o.armR};
  const pose: Pose4 = {
    pel: v3(0, b.hipY - bob, 0), hipYaw: -swing * 7, pitch: 2 + 4 * sp + (o.lean ?? 0), roll: 0, twist: swing * 12,
    hy: o.hy ?? 0, hp: o.hp ?? 0, hr: o.hr ?? 0,
    footL: v3(FL.x, 14 + FL.y, FL.z), footR: v3(FR.x, 14 + FR.y, FR.z), toeL: fl.toe, toeR: fr.toe,
    armL, armR, face: o.face ?? FACES.neutral,
  };
  return {ground: g, heading: H, pose, speed: v};
};
