// V2 walk for the guesser's rig (he faces screen-left, so he walks toward -x). Every foot contact is an explicit plant:
// while a foot carries weight it stays at a fixed floor position (IK to the ankle), so feet never slide; in swing it
// lifts, the knee folds, and it reaches forward to a heel-first landing. The pelvis rises over the stance leg and dips
// at double support; it rocks a little with the legs; the chest counter-sways; the head is stabilised by the neck.
// Arms are posed by joint angles (art/arms.ts): each swings opposite its leg, the elbow flexes more on the forward
// swing than on the back swing, the hand follows the forearm.
import {DIM, manJoints, ManPose, SOFT_IK} from '../dc/Man';
import {pose, SOLE} from './person';
import {ArmAngles, arms} from './arms';

export type Gait = {
  /** hip x (rig units) at t = 0, and speed (units/s, positive = toward screen-left) */
  x0: number; v: number;
  /** one full cycle (both steps), seconds */
  T: number;
  /** cycle phase at t = 0 (0..1) */
  ph?: number;
  /** stance fraction of a cycle per foot */
  duty?: number;
  /** standing hip height (units, negative up); default: the stance knee nearly straight at mid-stance */
  hipY?: number;
  /** arm swing amplitude (deg) and base elbow flexion (deg) */
  arm?: number;
  elbow?: number;
  /** forward lean of the body (deg) */
  lean?: number;
  /** extra pose fields (posture; a carried crate overrides the arms) */
  extra?: Partial<ManPose>;
  /** arms held (carrying): no swing */
  holdArms?: {l: ArmAngles; r: ArmAngles};
};

/** walking legs: soft IK starts late, so the stance leg can reach ~20 deg of knee flexion at mid-stance (a real walk),
 *  and the hips sink at double support instead of the knees staying bent (V2 QC: the knees read as a crouch-walk) */
export const WALK_SOFT = 0.99;
/** default hip height: mid-stance (bob -11) leaves the hip joint (44 below the pelvis) 0.985 of the leg above the ankle */
const autoHipY = (s: number) => -(SOLE * s + 44 * s + 0.985 * (DIM.thigh + DIM.shin) * s) + 11;
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const TAU = Math.PI * 2;

/** hip x at time t */
export const walkX = (g: Gait, t: number) => g.x0 - g.v * t;

/** where and when each foot is planted (also used for footstep sounds) */
export const footAt = (g: Gait, t: number, off: number) => {
  const duty = g.duty ?? 0.6;
  const L = g.v * g.T;
  const u = t / g.T + (g.ph ?? 0) + off;
  const k = Math.floor(u);
  const f = u - k;
  const lead = L * 0.3;
  const plantAt = (kk: number) => walkX(g, (kk - (g.ph ?? 0) - off) * g.T) - lead;
  if (f < duty) {
    // stance: the foot rolls from heel to toe (toe angle goes 0 -> up to 24 deg just before toe-off)
    return {x: plantAt(k), lift: 0, toe: f > duty - 0.18 ? 24 * sm((f - (duty - 0.18)) / 0.18) : f < 0.06 ? -10 * (1 - f / 0.06) : 0, f};
  }
  const s = (f - duty) / (1 - duty);
  const e = sm(s);
  const x = plantAt(k) + (plantAt(k + 1) - plantAt(k)) * e;
  // swing: a low arc, highest early (toe clearance), heel leads into the strike
  const lift = Math.sin(Math.PI * Math.min(1, s * 1.1)) * 48 * (1 - 0.25 * s);
  const toe = s < 0.35 ? 24 * (1 - s / 0.35) : -12 * sm((s - 0.6) / 0.4);
  return {x, lift, toe, f};
};

/** heel-strike times of both feet in [t0, t1) (for footstep sounds): a foot strikes where its cycle wraps to stance */
export const heelStrikes = (g: Gait, t0: number, t1: number) => {
  const out: {t: number; foot: 'L' | 'R'}[] = [];
  for (const [off, foot] of [[0, 'L'], [0.5, 'R']] as const) {
    for (let k = Math.ceil(t0 / g.T + (g.ph ?? 0) + off); ; k++) {
      const t = (k - (g.ph ?? 0) - off) * g.T;
      if (t >= t1) break;
      if (t >= t0) out.push({t, foot});
    }
  }
  return out.sort((a, b) => a.t - b.t);
};

/** the walk pose before the hips are settled */
const walkRaw = (g: Gait, t: number): ManPose => {
  const Lf = footAt(g, t, 0), Rf = footAt(g, t, 0.5);
  const hx = walkX(g, t);
  const cyc = (t / g.T + (g.ph ?? 0)) * TAU;
  // hips: lowest at each double support (heel strikes at cycle 0 and 0.5), highest over the stance leg
  const bob = 11 * Math.cos(2 * cyc);
  // how far forward each leg is (near leg forward at its heel strike, cycle 0)
  const lFwd = Math.cos(cyc - 0.25), rFwd = -lFwd;
  const A = g.arm ?? 18, E0 = g.elbow ?? 16;
  // each arm swings opposite its own leg; the forward swing bends the elbow more
  const armOf = (fwdLeg: number): ArmAngles => {
    const sw = -A * fwdLeg;
    return {sh: sw, el: E0 + 0.9 * Math.max(0, sw), wr: -4 - 0.15 * Math.max(0, sw)};
  };
  const lean = g.lean ?? 4;
  const chest = 1.2 * Math.sin(cyc) ;
  const ar = g.holdArms ? arms(g.holdArms.l, g.holdArms.r) : arms(armOf(lFwd), armOf(rFwd));
  const p = pose({
    x: hx, y: (g.hipY ?? autoHipY(g.extra?.s ?? 1)) + bob, legSoft: WALK_SOFT, torso: lean + 0.8 * Math.cos(2 * cyc), chest, neck: -lean * 0.6 - chest - 0.8 * Math.cos(2 * cyc), turn: 0.55, breath: 0.25,
    pelvis: 3 * Math.sin(cyc),
    ...ar,
    lAx: Lf.x, lAy: -SOLE - Lf.lift, lA: 1, lAnk: Lf.toe,
    rAx: Rf.x, rAy: -SOLE - Rf.lift, rA: 1, rAnk: Rf.toe,
    ...g.extra,
  });
  return p;
};

/** how far the hips must sink at time t for both legs to reach */
const need = (g: Gait, t: number) => {
  const p = walkRaw(g, t);
  return settleHips(p).y - p.y;
};
export const walk = (g: Gait, t: number): ManPose => {
  // the sink is smoothed over +-0.1 s (max over a sliding window, then averaged), so the hips ease down into each
  // double support instead of dropping on a corner; the final settle guarantees the reach
  const n = 6, w = 0.1;
  const samples = Array.from({length: 2 * n + 1}, (_, i) => need(g, t + ((i - n) / n) * w));
  let acc = 0, wsum = 0;
  for (let i = 0; i <= 2 * n; i++) {
    const lo = Math.max(0, i - 3), hi = Math.min(2 * n, i + 3);
    const m = Math.max(...samples.slice(lo, hi + 1));
    const wt = Math.cos(((i - n) / n) * (Math.PI / 2)) ** 2;
    acc += m * wt; wsum += wt;
  }
  const p = walkRaw(g, t);
  return settleHips({...p, y: p.y + acc / wsum});
};

/** lower the hips just enough that both ankles reach their targets inside the soft-IK range (a stride that would
 *  over-straighten a leg sinks the pelvis instead, as a real walk does; nothing slides) */
export const settleHips = (p: ManPose): ManPose => {
  const Lmax = (DIM.thigh + DIM.shin) * p.s * (p.legSoft ?? SOFT_IK) * 0.995;
  let q = p;
  for (let it = 0; it < 3; it++) {
    const j = manJoints(q);
    let drop = 0;
    for (const [hp, tx, ty] of [[j.lLeg.hp, q.lAx!, q.lAy!], [j.rLeg.hp, q.rAx!, q.rAy!]] as const) {
      const dx = tx - hp.x, dy = ty - hp.y;
      if (Math.hypot(dx, dy) > Lmax && Math.abs(dx) < Lmax) drop = Math.max(drop, dy - Math.sqrt(Lmax * Lmax - dx * dx));
    }
    if (drop <= 0.01) break;
    q = {...q, y: q.y + drop};
  }
  return q;
};
