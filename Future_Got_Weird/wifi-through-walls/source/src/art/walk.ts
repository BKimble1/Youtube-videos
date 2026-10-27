// A walk for the guesser's rig (he faces screen-left, so he walks toward -x). Every foot contact is an explicit plant:
// while a foot carries weight it stays at a fixed floor position (IK to the ankle), so feet never slide; in swing it
// travels to its next plant on a low arc with a heel-first landing. The hips move at a constant speed with the small
// double-support dip, the arms counter-swing.
import {ManPose} from '../dc/Man';
import {pose, SOLE} from './person';

export type Gait = {
  /** hip x (rig units) at t = 0, and speed (units/s, positive = toward screen-left) */
  x0: number; v: number;
  /** one full cycle (both steps), seconds */
  T: number;
  /** cycle phase at t = 0 (0..1) */
  ph?: number;
  /** stance fraction of a cycle per foot */
  duty?: number;
  /** standing hip height (units, negative up) */
  hipY?: number;
  /** arm swing amplitude (units) */
  arm?: number;
  /** extra pose fields (outfit-specific arms, carried things) */
  extra?: Partial<ManPose>;
};

const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** hip x at time t */
export const walkX = (g: Gait, t: number) => g.x0 - g.v * t;

export const walk = (g: Gait, t: number): ManPose => {
  const duty = g.duty ?? 0.62;
  const L = g.v * g.T; // a foot advances one stride per cycle
  const foot = (off: number) => {
    // phase of this foot: 0 = heel strike, duty = toe off
    const u = t / g.T + (g.ph ?? 0) + off;
    const k = Math.floor(u);
    const f = u - k;
    // the plant made at heel strike of cycle k lands a little ahead of the hip at that moment
    const tStrike = (k - (g.ph ?? 0) - off) * g.T;
    const lead = L * 0.32;
    const plantAt = (kk: number) => walkX(g, (kk - (g.ph ?? 0) - off) * g.T) - lead;
    if (f < duty) return {x: plantAt(k), lift: 0, toe: 0, w: 1, tStrike};
    const s = (f - duty) / (1 - duty);
    const e = sm(s);
    const x = plantAt(k) + (plantAt(k + 1) - plantAt(k)) * e;
    return {x, lift: Math.sin(Math.PI * Math.min(1, s * 1.05)) * 46, toe: s < 0.3 ? 30 * (1 - s / 0.3) : s > 0.8 ? -12 * ((s - 0.8) / 0.2) : 0, w: 1, tStrike};
  };
  const Lf = foot(0), Rf = foot(0.5);
  const hx = walkX(g, t);
  const cyc = (t / g.T + (g.ph ?? 0)) * Math.PI * 2;
  const bob = 10 * Math.cos(cyc * 2);
  // near arm forward while the near leg is back
  const sw = Math.sin(cyc + 0.4);
  const arm = g.arm ?? 70;
  return pose({
    x: hx, y: (g.hipY ?? -500) + bob, torso: 5, chest: 1, neck: -3, turn: 0.55, breath: 0.2,
    // the far arm stays on the front side of the torso (the rig draws a far hand that overlaps the tee in front of it)
    lTu: -322 + 18 * Math.abs(sw), lTv: 45 + arm * sw, lElb: -1, lWr: 4,
    rTu: -318 + 14 * Math.abs(sw), rTv: -112 - arm * 0.55 * Math.max(0, -sw) + arm * 0.25 * Math.max(0, sw), rElb: -1, rWr: 4,
    lAx: Lf.x, lAy: -SOLE - Lf.lift, lA: 1, lAnk: Lf.toe,
    rAx: Rf.x, rAy: -SOLE - Rf.lift, rA: 1, rAnk: Rf.toe,
    pelvis: 2 * Math.sin(cyc),
    ...g.extra,
  });
};
