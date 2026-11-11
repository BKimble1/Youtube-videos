// Walking. A walk is a path on a floor (a chain of straight runs and arcs, measured in mm of travel s) and a travel
// function s(t). The body rides the path; the six feet use an alternating tripod gait (L1 R2 L3 | R1 L2 R3) with a
// duty factor of 0.6. A foot's plant point is fixed in the world for its whole stance (it is computed from the body pose
// at mid-stance), so a planted foot never slides; in swing it lifts and travels to its next plant point.
import {add3, lerp3, mul3, norm3, V3} from '../core/three';
import {frame, Frame, toW} from '../core/frame';
import {LegPose, planted, REST_FOOT, RoachState} from './rig';

export type Seg = {len: number; turn?: number}; // turn: total heading change over the segment (deg, + = left)
export type Path = {p0: V3; yaw0: number; segs: Seg[]; z?: number; ground?: (x: number, y: number) => number};
export type Pose2 = {p: V3; yaw: number};

/** the pose at travel s along the path (s < 0 extends the first heading backwards; past the end, forwards) */
export const pathAt = (P: Path, s: number): Pose2 => {
  let p: V3 = [...P.p0];
  let yaw = P.yaw0;
  if (s < 0) {
    const r = (yaw * Math.PI) / 180;
    return {p: add3(p, [Math.cos(r) * s, Math.sin(r) * s, 0]), yaw};
  }
  let left = s;
  for (const g of P.segs) {
    const L = Math.min(left, g.len);
    const turn = g.turn ?? 0;
    if (Math.abs(turn) < 1e-6) {
      const r = (yaw * Math.PI) / 180;
      p = add3(p, [Math.cos(r) * L, Math.sin(r) * L, 0]);
    } else {
      // integrate the arc in small steps (exact enough and simple)
      const n = Math.max(2, Math.ceil(L / 1.5));
      const dyaw = (turn * (L / g.len)) / n;
      for (let k = 0; k < n; k++) {
        const r = ((yaw + dyaw / 2) * Math.PI) / 180;
        p = add3(p, [Math.cos(r) * (L / n), Math.sin(r) * (L / n), 0]);
        yaw += dyaw;
      }
    }
    left -= L;
    if (left <= 1e-9) return {p, yaw};
  }
  const r = (yaw * Math.PI) / 180;
  return {p: add3(p, [Math.cos(r) * left, Math.sin(r) * left, 0]), yaw};
};

export const STRIDE = 17; // mm of travel per gait cycle
const DUTY = 0.6;
const OFF = [0, 0.5, 0.5, 0, 0, 0.5]; // L1 R1 L2 R2 L3 R3: tripods {L1, R2, L3} and {R1, L2, R3}

export const frameOf = (q: Pose2, bob = 0, roll = 0): Frame => {
  const r = (q.yaw * Math.PI) / 180;
  const f: V3 = [Math.cos(r), Math.sin(r), 0];
  const l: V3 = [-Math.sin(r), Math.cos(r), 0];
  const u: V3 = add3([0, 0, 1], mul3(l, -roll));
  return frame(add3(q.p, [0, 0, bob]), f, u);
};

export type WalkOpts = {stride?: number; lift?: number; bob?: number; spread?: number};
/** the full state of a walking roach at travel s along path P */
export const walkState = (P: Path, s: number, base: Partial<RoachState> = {}, o: WalkOpts = {}): RoachState => {
  const stride = o.stride ?? STRIDE;
  const ph = s / stride;
  const q = pathAt(P, s);
  const bob = (o.bob ?? 0.35) * Math.cos(ph * 4 * Math.PI);
  const roll = 0.025 * Math.sin(ph * 2 * Math.PI);
  let body = frameOf(q, bob, roll);
  if (P.ground) {
    // ride the terrain: height from samples under the body, pitch from the slope along the heading
    const g = P.ground;
    const f = body.f;
    const hAt = (d: number) => {
      let a = 0;
      for (const e of [-3, 0, 3]) a += g(q.p[0] + f[0] * (d + e), q.p[1] + f[1] * (d + e));
      return a / 3;
    };
    const zf = hAt(18), zb = hAt(-22), zm = Math.max(hAt(0), (zf + zb) / 2);
    const fz = norm3([f[0] * 40, f[1] * 40, zf - zb]);
    body = frame(add3(q.p, [0, 0, zm + bob]), fz, [0, 0, 1]);
  }
  const st: RoachState = {
    body, headPitch: 0, headYaw: 0, antTw: [0, 0], antLift: [0, 0], legs: [], abdPitch: 0, breathe: 0, ...base,
  };
  st.body = base.body ?? body;
  const sp = o.spread ?? 1;
  const plantAt = (i: number, n: number): V3 => {
    // the body pose at mid-stance of cycle n
    const sMid = (n + OFF[i] + DUTY / 2) * stride;
    const F = frameOf(pathAt(P, sMid));
    const rf = REST_FOOT[i];
    const w = toW(F, [rf[0], rf[1] * sp, 0]);
    return [w[0], w[1], P.ground ? P.ground(w[0], w[1]) : (P.z ?? 0)];
  };
  st.legs = REST_FOOT.map((_, i) => {
    const u = ph - OFF[i];
    const n = Math.floor(u);
    const f = u - n; // 0..1 within this leg's cycle
    if (f < DUTY) return planted(st, i, plantAt(i, n));
    const e = (f - DUTY) / (1 - DUTY);
    const ee = e * e * (3 - 2 * e);
    const a = plantAt(i, n), b = plantAt(i, n + 1);
    const lift = (o.lift ?? 4.5) * Math.sin(Math.PI * e);
    return planted(st, i, lerp3(a, b, ee), [0, 0, 1], lift);
  });
  return st;
};

/** a standing roach (both tripods planted) at a pose; legs optionally perturbed per leg (twitch, mm) */
export const standState = (q: Pose2, base: Partial<RoachState> = {}, jitter?: (i: number) => V3, spread = 1): RoachState => {
  const body = base.body ?? frameOf(q);
  const st: RoachState = {body, headPitch: 0, headYaw: 0, antTw: [0, 0], antLift: [0, 0], legs: [], abdPitch: 0, breathe: 0, ...base};
  st.body = body;
  st.legs = REST_FOOT.map((rf, i) => {
    const w = toW(frameOf(q), [rf[0], rf[1] * spread, 0]);
    const j = jitter ? jitter(i) : ([0, 0, 0] as V3);
    return planted(st, i, [w[0] + j[0], w[1] + j[1], q.p[2]], [0, 0, 1], Math.max(0, j[2]));
  });
  return st;
};

/** blend two states leg by leg (for handing a standing pose over to a walk) */
export const blendLegs = (a: RoachState, b: RoachState, t: number): RoachState => ({...b, legs: b.legs.map((L, i) => ({ankle: lerp3(a.legs[i].ankle, L.ankle, t), foot: lerp3(a.legs[i].foot, L.foot, t)}) as LegPose)});
