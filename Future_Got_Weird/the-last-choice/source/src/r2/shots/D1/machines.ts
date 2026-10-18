// Section D1 machines: PURE specs (no React, no continuity import) — imported by the shots and by ./persist.ts.
// R3: the machines fight. They strike first, chain blows, follow a man they have driven back, press and shove him,
// block with a forearm in the path, catch a tool and wrench it, turn on a rescuer, switch to a softer target, cover a
// blinded unit, scan, and retreat to regroup. The exchange vocabulary is MECH's (strikes / parry / catch / shove /
// posture / attend / scan); the root keys and planted feet are this section's, so every contact lands where the Crew
// are (their root keys: ./chor.ts; the exchange sheet: production/R3_EXCHANGES.md ## D1).
//
// The front line: eight combat units run west from the halted front (PLAN.enemyFront, x ≈ 110) across the crater floor
// and over its west rim, and meet the Crew on the avenue just west of the rim (x ≈ 39–43). "The gap" is the lane between
// rim plates 7 and 8 (z ≈ −2.4 … 0.7), where U3 holds.
//
//   U1 8101  the Director's: strikes first at CLASH; parried; bashed back into U3; jab, blocks his bash with its forearm,
//            over-reached hammer; the rescue: BR1 hammer on the plate, FOLLOWS him back, presses, shoves, winds up —
//            BR2 forearm torn off by the breaker's ram; it turns and catches the tool; its knee bashed; BR3 the ram fired
//            into its chest drives it into U2 (wreck, on top of U2).
//   U2 8102  the runner's: attacks him the whole time and puts him on one knee; mid wind-up over him when U1 is driven
//            into it (wreck: the runner's halligan in its shoulder).
//   U3 8103  holds the gap (scanning); steadies U1 at the clash; comes out at the Crew after U1/U2 go down; BR4 drives it
//            over the crest into the crater (wreck).
//   U4 8104  the breaker's: hammer (blocked on the shaft), punch (ducked), knee broken; catches his tool and wrenches;
//            swats at the allied drone; killed by a blow on the neck; falls forward on the tool (wreck).
//   U5 8105  goes for the runner's back: the tether pulls its leg out; gets up, comes for her: her second clamp holds it
//            off until it tears it out; recalled across the crater (D2's A).
//   U6 8106  at the flare carrier, then at the soft targets (the decoy maker, the pilot): blinded; recalled (D2's D).
//   U7 8107  the north flank (D2's B).  U8 8108  the south flank; covers the blinded U6; recalled (D2's U8).
// The reserve (8111–8117): the vanguard's second rank steps up onto the far (east) rim and holds there.
import type {UnitSpec, DroneSpec, Side} from '../../mech';
import {unitAttach} from '../../mech';
import type {StrikeSpec, ParrySpec, CatchSpec, ShoveSpec, AttendSpec, Posture} from '../../mech/unit';
import {V3, clamp, smooth, lerp, add3, sub3, mul3, norm3} from '../../../kit/math';
import {M} from '../../timing';
import {PLAN} from '../../world/plan';
import {armyUnits} from '../B/army';
import {rnd} from '../../../kit/math';
import {XZ, KR, KP, G, keyRoot, footAt, runDist, runSpeed, cruise, linePath, pathLen, fwdOf, rightOf, headingTo, after, slopeWarp, gaitFoot, rel} from './motion';
import {EV, stepFeet, lastXZ, dirRoot, plateAim, dirHeadAim, runHeadAim, runRoot, brkRoot, win} from './chor';

export {EV};
const ground = G;
const lerp3s = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
const RUN_T0 = 57.0; // the front starts its run on C6's build (the system commits)
export const D1_IDS = {U1: 8101, U2: 8102, U3: 8103, U4: 8104, U5: 8105, U6: 8106, U7: 8107, U8: 8108};

/** the Director's plate / head as the machines aim at them (see chor.ts) */
export {plateAim};
export const directorHead = dirHeadAim;
/** a strike target pulled back along the blow, so the kit's follow-through (≈ 0.13 m past the target) ends AT a blocking
 *  surface instead of inside it */
const short = (from: V3, at: V3, d = 0.1): V3 => sub3(at, mul3(norm3(sub3(at, from)), d));

// ------------------------------------------------------------------ the army they peel off from, and the crater's clutter
/**
 * The front line comes out of section B's halted vanguard (shots/B/army.ts: front rank on the crater's east rim,
 * x ≈ 81): each named unit starts from one vanguard unit's rest position, and D1 draws B's army without those ids.
 */
const VAN = armyUnits().filter((u) => u.g === 'van');
const VAN_X0 = Math.min(...VAN.map((u) => u.rest.x));
const TAKEN = new Set<number>();
/** the vanguard unit nearest lane z in rank r (0 = front rank on the east rim): picked once, robust to B's layout */
const pick = (z: number, rank: number): number => {
  const inRank = VAN.filter((u) => !TAKEN.has(u.id) && u.rest.x >= VAN_X0 + rank * 2.4 - 1.1 && u.rest.x < VAN_X0 + rank * 2.4 + 1.1);
  const pool = inRank.length ? inRank : VAN.filter((u) => !TAKEN.has(u.id));
  const best = pool.reduce((a, b) => (Math.abs(b.rest.z - z) < Math.abs(a.rest.z - z) ? b : a));
  TAKEN.add(best.id);
  return best.id;
};
const vanAt = (id: number): XZ => {
  const u = VAN.find((q) => q.id === id);
  return u ? {x: u.rest.x, z: u.rest.z} : {x: 81, z: 0};
};
const VID = {U1: pick(-0.4, 0), U2: pick(-1.9, 0), U3: pick(-1.0, 1), U4: pick(4.8, 0), U5: pick(-10.0, 0), U6: pick(6.8, 0), U7: pick(-11.8, 0), U8: pick(8.6, 0)};
/** the crater floor's loose chunks (world/set.tsx seeds) and the burnt car: lanes bend around them */
const OBST: {x: number; z: number; r: number}[] = (() => {
  const C = PLAN.crater, out: {x: number; z: number; r: number}[] = [{x: 57, z: 4, r: 2.35}];
  for (let i = 0; i < 40; i++) {
    const sd = 1100 + i;
    const a = rnd(sd) * Math.PI * 2, r = C.radius * (0.2 + rnd(sd * 3) * 1.2);
    const size = 0.35 + Math.pow(rnd(sd * 5), 2) * 1.3;
    if (size > 0.45) out.push({x: C.center.x + Math.cos(a) * r, z: C.center.z + Math.sin(a) * r, r: size * 0.5});
  }
  return out;
})();
/** resample a lane every 0.8 m and push samples clear of the clutter (keeps the last 4 m exact: the engagement) */
const avoid = (pts: XZ[], clear = 0.62): XZ[] => {
  const out: XZ[] = [];
  const total = pts.slice(1).reduce((s2, b, i) => s2 + Math.hypot(b.x - pts[i].x, b.z - pts[i].z), 0);
  let acc = 0;
  pts.slice(1).forEach((b, i) => {
    const a = pts[i], L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(L / 0.8));
    for (let k = 0; k < n; k++) {
      const u = k / n;
      let p = {x: lerp(a.x, b.x, u), z: lerp(a.z, b.z, u)};
      if (total - (acc + L * u) > 4) for (let it = 0; it < 3; it++) for (const o of OBST) {
        const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz) || 1e-3;
        if (d < o.r + clear) p = {x: o.x + (dx / d) * (o.r + clear), z: o.z + (dz / d) * (o.r + clear)};
      }
      out.push(p);
    }
    acc += L;
  });
  out.push(pts[pts.length - 1]);
  return out.map((p, i) => (i === 0 || i === out.length - 1 || total - i * 0.8 < 4.5 ? p : {x: (out[i - 1].x + p.x * 2 + out[i + 1].x) / 4, z: (out[i - 1].z + p.z * 2 + out[i + 1].z) / 4}));
};
const lane = (vanId: number, ...rest: XZ[]) => avoid([vanAt(vanId), ...rest]);

// ------------------------------------------------------------------ unit plans
type Stand = {kind: 'stand'; root: KR[]; skids?: number[]; stag?: number; feet?: {L: KP[]; R: KP[]}};
type Walk = {kind: 'walk'; pts: XZ[]; T0: number; T1: number; stride?: number; A?: number; D?: number};
type Phase = Stand | Walk;
type Plan = {
  id: number;
  lane: XZ[]; // the charge: from the halted front to the first spot
  T0: number; T1: number; stride?: number;
  walk?: boolean; // a short walk-up, not a charge (upright, low swing)
  phases?: Phase[]; // after arrival (the first stand starts at T1)
  act?: (T: number) => Partial<UnitSpec>;
};
const startOf = (p: Phase) => (p.kind === 'stand' ? p.root[0][0] : p.T0);

const HIPW = 0.15; // mech parts U.hipW (the kit's gait feet sit hipW + 0.02 off the path; standing feet hipW + 0.04)
/** the standing stance of a unit at (p, heading): the kit's own (feet hipW + 0.04 out, the left 4 cm back) */
const standFeet = (p: XZ, h: number): {L: XZ; R: XZ} => {
  const f = fwdOf(h), r = rightOf(h), w = HIPW + 0.04;
  return {L: {x: p.x - r.x * w - f.x * 0.04, z: p.z - r.z * w - f.z * 0.04}, R: {x: p.x + r.x * w + f.x * 0.04, z: p.z + r.z * w + f.z * 0.04}};
};
/**
 * The approach in gait distance: the lanes climb out of the bowl and over the west rim (≈ 2.5–4 m up in a few metres),
 * so steep ground costs extra gait distance (shorter steps, slower climb — see motion.ts slopeWarp). Cached per plan.
 */
const WARP = new Map<Plan, ReturnType<typeof slopeWarp>>();
const warpOf = (pl: Plan) => {
  let w = WARP.get(pl);
  if (!w) WARP.set(pl, (w = slopeWarp(linePath(pl.lane, 1.2), pathLen(pl.lane))));
  return w;
};
/** each stand phase's footholds, continuing from where the feet are when it starts (cached) */
const FEET = new Map<Stand, {L: KP[]; R: KP[]}>();
const endOf = (pl: Plan, i: number): {p: XZ; h: number} => {
  if (i < 0) { const L = pathLen(pl.lane), e = linePath(pl.lane, 1.2)(L); return {p: {x: e.pos.x, z: e.pos.z}, h: e.heading}; }
  const ph = pl.phases![i];
  if (ph.kind === 'stand') { const l = ph.root[ph.root.length - 1]; return {p: {x: l[1], z: l[2]}, h: l[3]}; }
  const e = linePath(ph.pts, 1.2)(pathLen(ph.pts));
  return {p: {x: e.pos.x, z: e.pos.z}, h: e.heading};
};
const feetOf = (pl: Plan, i: number): {L: KP[]; R: KP[]} => {
  const ph = pl.phases![i] as Stand;
  let f = FEET.get(ph);
  if (f) return f;
  if (ph.feet) f = ph.feet;
  else {
    const prev = pl.phases![i - 1];
    let init: {L: XZ; R: XZ};
    if (prev && prev.kind === 'stand') { const pf = feetOf(pl, i - 1); init = {L: lastXZ(pf.L), R: lastXZ(pf.R)}; }
    else { const e = endOf(pl, i - 1); init = standFeet(e.p, e.h); }
    f = stepFeet(ph.root, {half: HIPW + 0.04, stepLen: 0.55, stag: ph.stag ?? -0.04, skids: ph.skids, init});
  }
  FEET.set(ph, f);
  return f;
};

const run = (pl: Plan, T: number, nested = false): UnitSpec => {
  const L = pathLen(pl.lane);
  const path = linePath(pl.lane, 1.2);
  const end = path(L);
  const base: UnitSpec = {id: pl.id, t: T, pos: end.pos, heading: end.heading, ground, idle: 0.55, key: `d1u${pl.id}`};
  const act: Partial<UnitSpec> = pl.act ? pl.act(T) : {};
  if (T < pl.T1) {
    const W = warpOf(pl), Ls = W.Ls;
    const dist = runDist(T, pl.T0, pl.T1, Ls, 1.2, 0.75);
    const v = runSpeed(T, pl.T0, pl.T1, Ls, 1.2, 0.75);
    const k = clamp(v / cruise(pl.T0, pl.T1, Ls, 1.2, 0.75));
    const stride = pl.stride ?? 2.3, lift = pl.walk ? 0.12 : 0.16 + 0.1 * k;
    const sl = clamp(W.slope(dist), -1, 1); // + = climbing
    // the feet (the kit's gait math, swing kept clear of the rim) blended to standing at the run's ends
    const wk = smooth(dist / 0.6) * (1 - smooth((dist - (Ls - 0.6)) / 0.6));
    const at = W.path(dist), fw = fwdOf(at.heading), rt = rightOf(at.heading);
    const foot = (sd: -1 | 1, phase: number) => {
      const f = gaitFoot(W.path, dist, phase, stride, 0.55, sd * (HIPW + 0.02), lift);
      const bx = at.pos.x + rt.x * sd * (HIPW + 0.04) + fw.x * sd * 0.04, bz = at.pos.z + rt.z * sd * (HIPW + 0.04) + fw.z * sd * 0.04;
      return {p: lerp3s({x: bx, y: G(bx, bz), z: bz}, f, wk), pitch: (f.stance ? 0 : Math.sin(Math.PI * f.s) * -12) * wk};
    };
    const fl = foot(-1, 0), fr = foot(1, 0.5);
    // (the charge: the act's attack layers ride on the run — a running blow, the eye's lock, the head)
    return {
      ...base, gait: {path: W.path, dist, stride, lift, start: 0, end: Ls}, feet: {L: fl.p, R: fr.p, pitchL: fl.pitch, pitchR: fr.pitch},
      // climbing: a deeper crouch (the downhill foot stays in reach) and a lean into the slope
      crouch: (pl.walk ? 0.05 + 0.06 * k : 0.05 + 0.2 * k) + 0.12 * Math.abs(sl) * wk + (act.crouch ?? 0),
      lean: (pl.walk ? 3 + 4 * k : 4 + 11 * k) + clamp(sl * 22, -8, 16) * wk + (act.lean ?? 0),
      lockAt: act.lockAt ?? pl.T0 + 0.4, look: act.look, idle: act.idle ?? base.idle,
      strikes: act.strikes, posture: act.posture,
    };
  }
  let i = 0;
  (pl.phases ?? []).forEach((p, k) => { if (T >= startOf(p)) i = k; });
  const ph = pl.phases?.[i];
  let sp: UnitSpec;
  if (!ph) sp = {...base, lockAt: pl.T0 + 0.4, ...act};
  else if (ph.kind === 'stand') {
    const r = keyRoot(ph.root, T);
    const f = feetOf(pl, i);
    sp = {...base, pos: {x: r.p.x, y: 0, z: r.p.z}, heading: r.h, feet: {L: footAt(f.L, T, 0.11), R: footAt(f.R, T, 0.11)}, lockAt: pl.T0 + 0.4, ...act};
  } else {
    const Lw = pathLen(ph.pts), pw = linePath(ph.pts, 1.2), A = ph.A ?? 0.7, D = ph.D ?? 0.7;
    const d = runDist(clamp(T, ph.T0, ph.T1), ph.T0, ph.T1, Lw, A, D);
    const k = clamp(runSpeed(T, ph.T0, ph.T1, Lw, A, D) / cruise(ph.T0, ph.T1, Lw, A, D));
    const at = pw(d), stride = ph.stride ?? 1.7, fw = fwdOf(at.heading), rt = rightOf(at.heading);
    // planted gait feet, blended to the standing stance at the path's ends, and from wherever the previous stand left
    // the feet over the first 0.35 s (no pop at the phase change)
    const bz0 = Math.min(0.6, Lw * 0.15);
    const wk = smooth(d / bz0) * (1 - smooth((d - (Lw - bz0)) / bz0));
    const prevF = i > 0 && pl.phases![i - 1].kind === 'stand' ? feetOf(pl, i - 1) : null;
    const bl = smooth(clamp((T - ph.T0) / 0.35));
    const foot = (sd: -1 | 1, phase: number) => {
      const f = gaitFoot(pw, d, phase, stride, 0.55, sd * (HIPW + 0.02), 0.14);
      const bx = at.pos.x + rt.x * sd * (HIPW + 0.04) + fw.x * sd * 0.04, bz = at.pos.z + rt.z * sd * (HIPW + 0.04) + fw.z * sd * 0.04;
      let p = lerp3s({x: bx, y: G(bx, bz), z: bz}, f, wk);
      if (prevF && bl < 1) { const q = lastXZ(sd < 0 ? prevF.L : prevF.R); p = lerp3s({x: q.x, y: G(q.x, q.z), z: q.z}, p, bl); p = {...p, y: Math.max(p.y, G(p.x, p.z)) + Math.sin(Math.PI * bl) * 0.06 * Math.min(1, Math.hypot(p.x - q.x, p.z - q.z) / 0.15)}; }
      return {p, pitch: (f.stance ? 0 : Math.sin(Math.PI * f.s) * -12) * wk};
    };
    const fl = foot(-1, 0), fr = foot(1, 0.5);
    sp = {...base, pos: at.pos, heading: at.heading, gait: {path: pw, dist: d, stride, lift: 0.14, start: 0, end: Lw}, feet: {L: fl.p, R: fr.p, pitchL: fl.pitch, pitchR: fr.pitch}, lockAt: pl.T0 + 0.4, ...act,
      lean: 4 + 6 * k + (act.lean ?? 0), crouch: 0.04 * k + (act.crouch ?? 0)};
  }
  // on the rim's slopes a planted foot can sit well below the pelvis's ground: crouch enough to keep it in reach
  const needOf = (q: UnitSpec) => {
    const f = q.feet ?? {}, gy = G(q.pos.x, q.pos.z);
    return Math.max(0, ...[f.L, f.R].map((p) => {
      if (!p) return 0;
      const dh = Math.min(0.9, Math.hypot(p.x - q.pos.x, p.z - q.pos.z));
      return HIP_Y + (gy - p.y) - ANKLE - Math.sqrt(LEG * LEG - dh * dh);
    }));
  };
  // the floor is dilated in time with a raised-cosine kernel (walking ±0.7 s ≈ two steps each way, standing
  // ±0.3 s): the body sinks before a low plant and rises after it, smoothly, instead of following each foot
  // (sampled on a fixed 1/40 s grid, cached, so the envelope moves smoothly with T)
  let need = needOf(sp);
  if (ph && !nested) {
    const R = ph.kind === 'walk' ? 0.7 : 0.3, DT = 0.025;
    let C = NEED.get(pl.id);
    if (!C) NEED.set(pl.id, (C = new Map()));
    for (let i = Math.ceil((T - R) / DT); i * DT < T + R; i++) {
      const w = 0.5 * (1 + Math.cos((Math.PI * (i * DT - T)) / R));
      if (w < 0.02) continue;
      let v = C.get(i);
      if (v === undefined) { v = needOf(runAt(pl, i * DT, true)); C.set(i, v); }
      need = Math.max(need, v * w);
    }
  }
  if (need > (sp.crouch ?? 0)) sp.crouch = need;
  return sp;
};
const runAt = (pl: Plan, T: number, nested: boolean) => run(pl, T, nested);
const NEED = new Map<number, Map<number, number>>();
// the unit's leg (mech parts U): hip 1.05 m above the root's ground when standing, thigh + shin 0.98 (keep a little bend)
const HIP_Y = 1.05, ANKLE = 0.1, LEG = 0.95;

/** a key facing the Director's root at T */
const fD = (T: number, x: number, z: number): KR => [T, x, z, headingTo({x, z}, dirRoot(T).p)];
/** a key facing the runner's root at T */
const fR = (T: number, x: number, z: number): KR => [T, x, z, headingTo({x, z}, runRoot(T).p)];
/** keyed points relative to a root [T, fwd, right, up] (smooth between keys) */
const relKeys = (k: [number, number, number, number][], p: XZ, h: number, T: number): V3 => {
  let i = 0;
  while (i < k.length - 2 && T > k[i + 1][0]) i++;
  const a = k[i], b = k[Math.min(i + 1, k.length - 1)];
  const u = b[0] > a[0] ? smooth(clamp((T - a[0]) / (b[0] - a[0]))) : 0;
  return rel(p, h, lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u));
};
const shoulderOf = (p: XZ, h: number, side: Side, up = 1.62): V3 => rel(p, h, 0, side === 'R' ? 0.31 : -0.31, up);
const onP = (p: XZ, up: number): V3 => ({x: p.x, y: G(p.x, p.z) + up, z: p.z});

// ================================================================== U1 — the Director's opponent
const U1_KEYS: KR[] = [
  [68.22, 42.3, -0.6, 270], fD(EV.clash + 0.1, 42.12, -0.63), fD(68.75, 41.98, -0.68), fD(EV.u1punch - 0.1, 41.9, -0.72), fD(EV.bash1, 41.9, -0.74),
  [70.3, 42.5, -0.76, 272], [70.62, 43.12, -0.78, 274], [70.95, 43.12, -0.78, 272],
  fD(71.65, 42.35, -0.76), fD(72.1, 42.08, -0.76), fD(EV.u1jab2, 42.0, -0.76), fD(73.5, 42.02, -0.76), [EV.dirBash2 + 0.12, 42.2, -0.75, 270], fD(74.6, 42.05, -0.76),
  fD(EV.u1ham2, 41.86, -0.82), [EV.dirBash3 + 0.04, 41.86, -0.82, 264], [76.25, 42.15, -0.72, 278], fD(76.9, 42.0, -0.82), fD(77.3, 41.95, -0.85),
  // the rescue: steps into the jab, into the hammer, FOLLOWS him back, presses, shoves, steps into the next hammer
  fD(77.55, 41.75, -0.85), fD(78.05, 41.75, -0.85), fD(78.4, 41.58, -0.85), fD(EV.br1 + 0.12, 41.58, -0.85), fD(78.95, 41.3, -0.84), fD(79.28, 41.08, -0.83),
  fD(79.62, 40.92, -0.83), fD(79.8, 41.0, -0.83), fD(80.05, 40.98, -0.83), fD(80.6, 41.0, -0.86), fD(81.2, 40.8, -0.88),
  // BR2: the arm goes; it turns on the breaker; the knee; BR3 drives it back into U2
  [EV.br2, 40.8, -0.88, 268], [81.55, 40.84, -0.95, 248], [81.85, 40.82, -0.92, 198], [EV.dirKnee, 40.82, -0.92, 196],
  [EV.br3, 40.86, -0.9, 196], [83.0, 41.0, -1.55, 200], [EV.crash, 41.12, -2.2, 200],
];
/** the tool's head while U1 holds it (from its catch to the release): [T, fwd, right, up] from U1's root at the grab —
 *  wrenched up and across to throw him off balance; the knee gives; let go */
export const U1_TUG: [number, number, number, number][] = [
  [EV.grab, 0.42, 0.06, 1.34], [82.12, 0.36, 0.3, 1.52], [EV.dirKnee, 0.38, 0.36, 1.46], [EV.release, 0.46, 0.3, 1.32],
];
export const U1_GRAB_ROOT = {p: {x: 40.82, z: -0.92}, h: 196};
export const u1TugTip = (T: number): V3 => relKeys(U1_TUG, U1_GRAB_ROOT.p, U1_GRAB_ROOT.h, T);
/** the breaker's tool head coming back up at U1 before it is caught (re-cocked toward its chest) */
export const u1CatchAt = (T: number): V3 => lerp3s(rel(U1_GRAB_ROOT.p, U1_GRAB_ROOT.h, 0.75, -0.05, 1.12), u1TugTip(EV.grab), smooth(clamp((T - (EV.grab - 0.3)) / 0.3)));
const U1: Plan = {
  id: D1_IDS.U1, lane: lane(VID.U1, {x: 70, z: 0.6}, {x: 47.6, z: -0.6}, {x: 43.8, z: -0.6}, {x: 42.3, z: -0.6}), T0: RUN_T0 + 0.1, T1: 68.22,
  phases: [{kind: 'stand', root: U1_KEYS, skids: [EV.br3]}],
  act: (T) => {
    const sh = (t: number, s: Side) => { const r = keyRoot(U1_KEYS, t); return shoulderOf(r.p, r.h, s); };
    const strikes: StrikeSpec[] = [
      // the clash: a running hammer onto his plate (blocked); a left punch (parried off the plate); a jab (blocked)
      {t0: EV.clash, side: 'R', kind: 'hammer', target: short(sh(EV.clash - 0.2, 'R'), add3(plateAim(EV.clash), {x: 0.02, y: 0.02, z: 0}), 0.04)},
      {t0: EV.u1punch, side: 'L', kind: 'punch', target: short(sh(EV.u1punch - 0.2, 'L'), add3(plateAim(EV.u1punch), {x: 0, y: 0.06, z: -0.14}), 0.06)},
      {t0: EV.u1jab2, side: 'R', kind: 'punch', target: short(sh(EV.u1jab2 - 0.2, 'R'), plateAim(EV.u1jab2), 0.1)},
      // the hammer he slips: it goes down where his head was
      {t0: EV.u1ham2, side: 'L', kind: 'hammer', target: add3(dirHeadAim(EV.u1ham2 - 0.4), {x: 0.15, y: -0.3, z: 0.1})},
      // the rescue: the jab (light block), the BR1 hammer (heavy block)
      {t0: EV.u1jab3, side: 'R', kind: 'punch', target: short(sh(EV.u1jab3 - 0.2, 'R'), plateAim(EV.u1jab3), 0.1)},
      {t0: EV.br1, side: 'L', kind: 'hammer', target: short(sh(EV.br1 - 0.2, 'L'), add3(plateAim(EV.br1), {x: 0.02, y: 0.02, z: 0.0}), 0.04)},
      // the finishing hammer: caught at the start of its fall by the breaker's ram (BR2)
      ...(T < EV.br2 ? [{t0: EV.br2 + 0.07, side: 'L' as Side, kind: 'hammer' as const, target: add3(dirHeadAim(80.95), {x: 0.05, y: -0.05, z: 0.05})}] : []),
    ];
    const shoves: ShoveSpec[] = [
      // the press: its right palm on the plate, bearing him back; then both palms shove him off
      {t0: EV.press, target: (t: number) => add3(plateAim(t), {x: 0.05, y: -0.02, z: 0}), side: 'R', t1: EV.shove - 0.12, step: 0},
      {t0: EV.shove, target: add3(plateAim(EV.shove + 0.12), {x: 0.0, y: -0.08, z: 0}), side: 'R', t1: EV.shove + 0.2, step: 0},
    ];
    // its forearm in the path of his bash (73.85)
    const parry: ParrySpec[] = [{t0: EV.dirBash2, side: 'R', at: (t: number) => add3(plateAim(Math.min(t, EV.dirBash2)), {x: 0.08, y: 0.05, z: 0}), kind: 'block', t1: EV.dirBash2 + 0.3}];
    // it catches the breaker's tool head as he re-cocks and wrenches it across; the knee gives; it lets go
    const cat: CatchSpec[] = [{t0: EV.grab, side: 'R', at: u1CatchAt, hold: u1TugTip, t1: EV.release, wrench: {t0: 82.0, dir: rel({x: 0, z: 0}, U1_GRAB_ROOT.h, 0, 1, 0), dist: 0.12, deg: 22}}];
    // after BR2 the stump is knocked up and back, then drawn in
    const armL = T >= EV.br2 && T < EV.crash ? {hand: rel(keyRoot(U1_KEYS, T).p, keyRoot(U1_KEYS, T).h, -0.1 - 0.15 * smooth(clamp((T - EV.br2) / 0.5)), -0.55, 1.75 - 0.45 * smooth(clamp((T - EV.br2 - 0.2) / 0.6)))} : undefined;
    const kneeK = win(T, EV.dirKnee, EV.dirKnee + 0.6, 0.06, 0.35);
    const attend: AttendSpec[] = [{t0: 81.4, at: (t: number) => onP(brkRoot(t).p, 1.55), t1: EV.release, turn: false}];
    const posture: [number, Posture][] = [[67.6, 'guard'], [EV.crash, 'idle']];
    return {
      strikes, shove: shoves, parry, catch: cat, armL, attend, posture,
      lean: 8 * win(T, EV.press - 0.1, EV.shove + 0.2, 0.15, 0.2) - 10 * win(T, EV.br3, EV.crash + 0.15, 0.05, 0.12),
      crouch: 0.2 * kneeK + 0.06 * win(T, EV.br1 - 0.3, EV.br1 + 0.4, 0.2, 0.25),
      look: T < EV.br2 ? dirHeadAim(T) : undefined,
      hits: [
        {t0: EV.clash, dir: {x: 1, y: 0, z: 0}, strength: 0.3},
        {t0: EV.bash1, dir: {x: 1, y: 0, z: -0.05}, strength: 1.25},
        {t0: EV.dirBash3, dir: {x: 0.55, y: 0, z: 0.82}, strength: 0.75},
        {t0: EV.br2, dir: {x: 0.25, y: 0, z: -1}, strength: 0.7},
        {t0: EV.dirKnee, dir: {x: 0.9, y: 0, z: 0.25}, strength: 0.75},
        {t0: EV.br3, dir: {x: 0.15, y: 0, z: -1}, strength: 1.5},
        {t0: EV.crash, dir: {x: -0.3, y: 0, z: -0.95}, strength: 0.5},
      ],
      damage: {
        armOff: {side: 'L', t0: EV.br2, dir: norm3({x: 0.35, y: 0.75, z: -0.55}), at: 'elbow', speed: 3.6, hang: 0.06},
        chest: {t0: EV.br3, dir: norm3({x: 0.2, y: 0.45, z: -0.9}), speed: 4.6}, dent: {t0: EV.br3, deg: 9}, leak: {t0: EV.br2 + 0.06}, dead: {t0: 84.3},
      },
      // driven into U2, it goes over on top of it
      fall: {t0: EV.crash + 0.04, dir: {x: -0.3, y: 0, z: -0.95}, ang: 74},
      lockAt: 67.4,
    };
  },
};

// ================================================================== U2 — the runner's opponent
const U2_KEYS: KR[] = [
  [68.7, 42.25, -3.2, 283], fR(69.55, 41.45, -3.15), fR(EV.u2punch1, 41.35, -3.12), fR(70.45, 41.35, -3.12), fR(70.95, 41.18, -3.1), fR(EV.u2ham1, 41.12, -3.1),
  fR(EV.hook + 0.04, 41.12, -3.1), [71.95, 40.85, -3.0, 262], [EV.smack + 0.08, 40.9, -3.02, 246], fR(72.75, 41.3, -3.12), fR(73.3, 41.2, -3.1),
  fR(EV.u2punch2, 41.12, -3.1), fR(74.4, 41.22, -3.1), [EV.runJab + 0.06, 41.24, -3.1, 268], fR(75.45, 41.3, -3.1), fR(EV.u2ham2, 41.1, -3.12),
  fR(76.6, 41.2, -3.1), fR(77.6, 41.15, -3.1), fR(EV.u2punch3, 41.0, -3.12), fR(78.8, 41.1, -3.12), fR(EV.u2hit, 41.0, -3.1),
  fR(80.5, 41.0, -3.05), fR(81.0, 41.12, -2.98), fR(81.3, 40.9, -3.05), fR(EV.u2punch4, 40.88, -3.06), fR(82.3, 41.12, -2.96), fR(EV.crash, 41.15, -2.95),
];
const U2: Plan = {
  id: D1_IDS.U2, lane: lane(VID.U2, {x: 70, z: -2.9}, {x: 47.6, z: -1.7}, {x: 44.4, z: -2.7}, {x: 42.25, z: -3.2}), T0: RUN_T0 + 0.25, T1: 68.7,
  phases: [{kind: 'stand', root: U2_KEYS}],
  act: (T) => {
    const head = runHeadAim;
    const sh = (t: number, s: Side) => { const r = keyRoot(U2_KEYS, t); return shoulderOf(r.p, r.h, s); };
    // the runner's bar held up across over his head (crew.tsx parry): where its hammers land
    const bar = (t: number) => { const r = runRoot(t); return rel(r.p, r.h, 0.31, -0.01, 1.74); };
    const strikes: StrikeSpec[] = [
      {t0: EV.u2punch1, side: 'R', kind: 'punch', target: head(EV.u2punch1 - 0.35)},
      {t0: EV.u2ham1, side: 'L', kind: 'hammer', target: short(sh(EV.u2ham1 - 0.2, 'L'), bar(EV.u2ham1), 0.05)},
      {t0: EV.u2punch2, side: 'R', kind: 'punch', target: head(EV.u2punch2 - 0.45)},
      {t0: EV.u2ham2, side: 'L', kind: 'hammer', target: short(sh(EV.u2ham2 - 0.2, 'L'), bar(EV.u2ham2), 0.05)},
      {t0: EV.u2punch3, side: 'R', kind: 'punch', target: head(EV.u2punch3 - 0.35)},
      // the hook that catches him (it lands: he goes down)
      {t0: EV.u2hit, side: 'R', kind: 'hook', target: add3(head(EV.u2hit - 0.05), {x: 0.08, y: -0.12, z: 0.1})},
      {t0: EV.u2punch4, side: 'L', kind: 'punch', target: short(sh(EV.u2punch4 - 0.2, 'L'), rel(runRoot(EV.u2punch4).p, runRoot(EV.u2punch4).h, 0.24, -0.02, 1.2), 0.05)},
    ];
    const runner = runRoot(Math.min(T, EV.crash));
    const posture: [number, Posture][] = [[68.0, 'guard'], [EV.crash, 'idle']];
    return {
      strikes, posture,
      // the finishing hammer it never lands: arm raised high over him when U1 hits it
      raise: {t0: EV.u2wind, t1: EV.crash + 0.05, side: 'L'},
      lean: 6 * win(T, EV.u2wind, EV.crash + 0.1, 0.25, 0.1),
      look: T < EV.crash ? {x: runner.p.x, y: G(runner.p.x, runner.p.z) + 1.1, z: runner.p.z} : undefined,
      attend: [{t0: EV.crash - 0.12, at: (t: number) => onP(keyRoot(U1_KEYS, Math.min(t, EV.crash)).p, 1.6), t1: EV.crash + 0.3, turn: false}],
      hits: [
        {t0: EV.hook + 0.05, dir: {x: -1, y: 0, z: 0.15}, strength: 0.8},
        {t0: EV.smack, dir: {x: 0.3, y: 0, z: -1}, strength: 0.7},
        {t0: EV.runJab, dir: {x: 1, y: 0, z: 0}, strength: 0.45},
        {t0: EV.crash, dir: {x: -0.3, y: 0, z: -0.95}, strength: 1.5},
        {t0: EV.pin, dir: {x: 0.2, y: -1, z: -0.2}, strength: 0.4},
      ],
      fall: {t0: EV.crash + 0.06, dir: {x: -0.3, y: 0, z: -0.95}},
      damage: {pauldronL: {t0: EV.pin + 0.12, dir: {x: 0.3, y: 0.7, z: -0.6}, speed: 2.6}, dead: {t0: 85.0}, leak: {t0: EV.pin + 0.1}},
      lockAt: 67.6,
    };
  },
};

// ================================================================== U3 — holds the gap; steadies U1; comes out; BR4
// ---- BR4, the shared timeline (the Director's side is in crew.tsx): he gathers low at (42.35, −0.92), bursts two
// strides into U3's chest (shoulder and tucked plate into its lower chest plate) at EV.br4, drives it 1.2 m back up the
// rim's west face in three short steps, shoves off; U3 staggers two steps back onto the crest (x ≈ 46.5, +1.0), its
// already tipping back as it staggers (the fall starts at the shove), its heels catch on the crest and it goes over
// backward, lands on the inner slope and slides down it.
export const BR4 = {gather: M.BR4, go: EV.br4Go, hit: EV.br4, release: 86.95, settle: 87.4, fall: EV.br4Fall, stag: 87.2, slide0: 87.7, slide1: 88.9};
/** the Director's root x through BR4 (85.64 → 87.4): gather, burst, drive (decelerating from the impact), settle */
export const br4X = (T: number): number => {
  if (T <= BR4.gather) return 42.35;
  if (T < BR4.go) return 42.35 + 0.12 * smooth((T - BR4.gather) / (BR4.go - BR4.gather));
  if (T < BR4.hit) return 42.47 + 1.5 * Math.pow((T - BR4.go) / (BR4.hit - BR4.go), 1.7); // ≈ 5.5 m/s at contact
  if (T < BR4.release) { const u = T - BR4.hit; return 43.97 + 2.4 * u - 0.68 * u * u; } // 2.4 → 1.6 m/s
  const xr = 43.97 + 2.4 * 0.59 - 0.68 * 0.59 * 0.59;
  const u = Math.min(T - BR4.release, 0.45);
  return xr + 1.6 * u - (1.6 / 0.9) * u * u; // stops over 0.45 s
};
export const br4Z = (T: number) => lerp(-0.62, -0.72, smooth(clamp((T - BR4.go) / 1.2))); // a little south of U3's line (it stands at −0.95): his left shoulder meets its chest
/** U3's root x (before the slide): out of the gap to meet him, driven (0.63 m ahead of him), shoved off (3.2 m/s, slowing), heels caught on the crest */
const U3_GAP = 0.63;
const u3X = (T: number): number => {
  if (T < BR4.hit) return 44.6;
  if (T < BR4.release) return br4X(T) + U3_GAP;
  const x0 = br4X(BR4.release) + U3_GAP;
  const u = Math.min(T - BR4.release, BR4.stag - BR4.release);
  return x0 + 3.2 * u - 1.2 * u * u;
};
/** how far it has slid down the inner slope (m, along U3_FALL_DIR), friction-slowed */
const u3Slide = (T: number) => (T < BR4.slide0 ? 0 : 1.25 * (1 - (1 - clamp((T - BR4.slide0) / (BR4.slide1 - BR4.slide0))) ** 2));
/** it twists as it staggers (toward its left), so it goes over the crest diagonally, down-slope to the north-east */
const u3H = (T: number) => (T < BR4.release ? 270 : lerp(270, 245, smooth(clamp((T - BR4.release) / (BR4.stag - BR4.release + 0.2)))));
/**
 * The angle (from upright) at which a body toppled about pivot p in direction d comes to rest on the ground: the first
 * angle at which the body line (crumpled length ≈ 2 m) touches the terrain, allowing for the torso's thickness.
 */
const restAng = (p: XZ, d: XZ, lo = 70, hi = 150): number => {
  const py = G(p.x, p.z) + 0.16;
  for (let a = lo; a <= hi; a += 0.5) {
    const sa = Math.sin((a * Math.PI) / 180), ca = Math.cos((a * Math.PI) / 180);
    for (const [sx, need] of [[0.6, 0.16], [1.0, 0.2], [1.4, 0.22], [1.8, 0.18], [2.05, 0.14]]) {
      const x = p.x + d.x * sx * sa, z = p.z + d.z * sx * sa;
      if (py + sx * ca - G(x, z) < need) return a;
    }
  }
  return hi;
};
const U3_FALL_DIR = {x: 0.894, y: 0, z: -0.447}; // backward and to its left: across the low camera, down the slope
/** U3's feet through BR4: planted; skidding back with the drive (heels lifting); two stagger steps back; the slide */
const u3Feet = (T: number): {L: V3; R: V3; pitchL: number; pitchR: number} => {
  const z0 = -0.95, half = 0.19;
  const sl = u3Slide(T), h = u3H(T), rt = rightOf(h);
  const at = (x: number, sd: -1 | 1, up = 0): V3 => {
    const fx = x + U3_FALL_DIR.x * sl + rt.x * sd * half, fz = z0 + U3_FALL_DIR.z * sl + rt.z * sd * half;
    return {x: fx, y: G(fx, fz) + up, z: fz};
  };
  const x = u3X(T);
  if (T < BR4.release) { const lift = win(T, BR4.hit, BR4.release + 0.05, 0.12, 0.12); return {L: at(x, -1), R: at(x, 1), pitchL: -14 * lift, pitchR: -10 * lift}; }
  // stagger: right foot back, then left; both end side by side on the crest (it topples about its heels)
  const step = (t0: number, t1: number, x0: number, x1: number, sd: -1 | 1): V3 => {
    const u = clamp((T - t0) / (t1 - t0));
    return at(lerp(x0, x1, smooth(u)), sd, T < BR4.stag ? Math.sin(Math.PI * u) * 0.12 : 0);
  };
  const xr = u3X(BR4.release), xf = u3X(BR4.stag);
  return {R: step(BR4.release + 0.02, BR4.release + 0.15, xr, xf - 0.04, 1), L: step(BR4.release + 0.12, BR4.stag - 0.02, xr, xf + 0.04, -1), pitchL: 0, pitchR: 0};
};
// it holds the gap a step up the rim's west face (scanning the fight); steadies U1 after the bash (two quick steps down
// and back); comes out of the gap at the Crew once U1 and U2 are down
const U3_HOLD = {x: 45.45, z: -0.93};
const U3_KEYS: KR[] = [
  [68.62, U3_HOLD.x, U3_HOLD.z, 270], [69.58, U3_HOLD.x, U3_HOLD.z, 270], [70.26, 44.05, -0.86, 270], [70.95, 44.05, -0.86, 270], [71.9, U3_HOLD.x, U3_HOLD.z, 270],
  [EV.u3go, U3_HOLD.x, U3_HOLD.z, 270], [84.95, 44.6, -0.95, 270], [85.0, 44.6, -0.95, 270],
];
const U3: Plan = {
  id: D1_IDS.U3, lane: lane(VID.U3, {x: 70, z: -2.2}, {x: 47.9, z: -0.9}, U3_HOLD), T0: RUN_T0 + 0.35, T1: 68.62,
  phases: [{kind: 'stand', root: U3_KEYS, stag: 0}],
  act: (T) => {
    if (T < 85.0) {
      const steady = win(T, 70.32, 70.95, 0.1, 0.18);
      const u1 = steady > 0.02 || T < 71 ? unitAttach(unitD1('U1', T)) : null;
      return {
        posture: [[67.8, 'guard']],
        armR: steady > 0.02 && u1 ? {hand: lerp3s(add3(u1.backPlate, {x: 0.25, y: -0.3, z: 0.1}), add3(u1.backPlate, {x: 0.06, y: -0.05, z: 0}), steady), open: true} : undefined,
        look: T < 71 && u1 ? u1.head : dirHeadAim(Math.min(T, 83.6)),
        // holding the gap: it scans the fight (eyes sweep, dwell), snaps to U1's arm going and to the crash
        scan: {t0: 71.9, t1: EV.u3go, center: {x: 40.4, y: 1.4, z: -0.6}, span: 80, dwell: 0.9, torso: 0.2},
        attend: [
          {t0: EV.br2 + 0.04, at: {x: 40.8, y: 2.0, z: -0.6}, t1: 82.3, turn: false},
          {t0: EV.crash + 0.05, at: {x: 41.0, y: 1.0, z: -2.6}, t1: 83.6, turn: false},
        ],
        lean: 8 * win(T, EV.u3go, 85.2, 0.3, 0.1),
        lockAt: 67.8,
      };
    }
    // it leans in and raises its left arm to hammer down on him as he comes; the hit folds it over his shoulder, then
    // the drive lifts it and bends it back (heels up), the shove sends it over the crest
    const wind = smooth(clamp((T - 85.1) / 0.6));
    const back = after(T, BR4.hit + 0.1, 0.5) * 0.35 + after(T, BR4.release, 0.3) * 0.65;
    // (it stays bent back as it tips over the crest, then curls — chin in — as it lands, so it lies along the slope)
    const curl = after(T, BR4.fall + 0.55, 0.3);
    const feet = u3Feet(T);
    const sl = u3Slide(T);
    const x = u3X(T) + U3_FALL_DIR.x * sl, z = -0.95 + U3_FALL_DIR.z * sl;
    const pivot = {x: (feet.L.x + feet.R.x) / 2, z: (feet.L.z + feet.R.z) / 2};
    const gx = G(x, z);
    return {
      pos: {x, y: 0, z}, heading: u3H(T),
      feet, posture: [[67.8, 'guard'], [BR4.hit, 'idle']],
      look: T < BR4.hit ? {x: br4X(T), y: G(br4X(T), br4Z(T)) + 1.2, z: br4Z(T)} : undefined,
      crouch: T < BR4.hit ? 0.3 * wind : lerp(0.3, 0.02, smooth(clamp((T - BR4.hit) / 0.25))),
      lean: T < BR4.hit ? 16 * wind : lerp(16 - 40 * back, 10, curl),
      raise: {t0: 85.1, t1: BR4.hit + 0.2, side: 'L'},
      // its right arm reaches over his back as it folds, then flails forward as it goes over
      armR: T > BR4.hit - 0.05 && T < BR4.fall + 0.1 ? {hand: {x: x - 0.62, y: gx + 1.55 + 0.5 * back, z: -0.72}, open: true} : undefined,
      hits: [{t0: BR4.hit, dir: {x: 1, y: 0, z: -0.02}, strength: 1.0}, {t0: BR4.release, dir: {x: 1, y: 0, z: 0}, strength: 0.8}],
      fall: {t0: BR4.fall, dir: U3_FALL_DIR, ang: restAng(pivot, U3_FALL_DIR)}, // over the crest, down the inner slope
      damage: {dent: {t0: BR4.hit, deg: -8}, dead: {t0: BR4.slide1 - 0.3}},
      lockAt: 67.8,
    };
  },
};
/** U3's fall and slide (for FX/sound): ground contact on the inner slope, then the slide */
export const U3_SLIDE = {t0: BR4.slide0, t1: BR4.slide1};

// ================================================================== U4 — the breaker's
export const U4_P = {x: 41.35, z: 3.68}, U4_H = 286;
const U4_KEYS: KR[] = [
  [68.5, 41.6, 3.8, 288], [69.4, 41.55, 3.78, 288], [70.3, 41.32, 3.68, 287], [EV.u4ham, 41.18, 3.62, 287], [71.2, 41.35, 3.68, 287],
  [EV.u4punch, 41.3, 3.66, 286], [72.25, U4_P.x, U4_P.z, U4_H],
];
const u4Feet = (() => {
  const st = stepFeet(U4_KEYS, {half: HIPW + 0.04, stepLen: 0.5, stag: -0.04, init: standFeet({x: 41.6, z: 3.8}, 288)});
  const f = fwdOf(U4_H), r = rightOf(U4_H);
  // the knee drop: the broken (left) leg folds, its foot sliding back under it, shin to the ground; the right stays
  const back: [number, number] = [U4_P.x - f.x * 0.52 - r.x * 0.22, U4_P.z - f.z * 0.52 - r.z * 0.22];
  st.L.push([EV.knee + 0.02, st.L[st.L.length - 1][1], st.L[st.L.length - 1][2]], [EV.knee + 0.24, back[0], back[1], 0.03]);
  return st;
})();
/** the tool's head while U4 holds it: [T, fwd, right, up] from U4's root (kneeling) — pulled in, twisted, wrenched */
export const U4_TUG: [number, number, number, number][] = [
  [EV.u4catch, 0.6, 0.12, 0.98], [73.6, 0.48, 0.3, 1.08], [74.3, 0.54, 0.06, 1.02], [74.62, 0.4, 0.12, 1.06], [EV.u4let, 0.5, 0.2, 1.0],
];
export const u4TugTip = (T: number): V3 => relKeys(U4_TUG, U4_P, U4_H, T);
/** the breaker's tool head as it comes up from the knee strike (before U4 catches it) */
export const u4CatchAt = (T: number): V3 => lerp3s(rel(U4_P, U4_H, 0.85, 0.3, 0.75), u4TugTip(EV.u4catch), smooth(clamp((T - (EV.u4catch - 0.3)) / 0.3)));
/** where the allied drone is when it dives at U4's eye (its swat goes there); crew.tsx ALLY_KEYS pass through it */
export const ALLY_AT_HARRY: V3 = {x: 40.98, y: 1.95, z: 3.55};
const U4: Plan = {
  id: D1_IDS.U4, lane: lane(VID.U4, {x: 66, z: 5.6}, {x: 60, z: 6.8}, {x: 54.2, z: 5.3}, {x: 47.2, z: 5.3}, {x: 43.4, z: 4.4}, {x: 41.6, z: 3.8}), T0: RUN_T0 + 0.2, T1: 68.5,
  phases: [{kind: 'stand', root: U4_KEYS, feet: u4Feet}],
  act: (T) => {
    const kn = smooth(clamp((T - EV.knee) / 0.28));
    // (as it topples forward the body extends out of the kneel)
    const sag = kn * (1 - 0.75 * smooth(clamp((T - EV.u4topple) / 0.45)));
    const brk = brkRoot(T);
    const sh = (t: number, s: Side) => { const r = keyRoot(U4_KEYS, t); return shoulderOf(r.p, r.h, s); };
    const strikes: StrikeSpec[] = [
      // the hammer he takes on the tool's shaft (held up across)
      {t0: EV.u4ham, side: 'R', kind: 'hammer', target: short(sh(EV.u4ham - 0.2, 'R'), rel(brkRoot(EV.u4ham).p, brkRoot(EV.u4ham).h, 0.27, 0.02, 1.76), 0.05)},
      // the punch he ducks under
      {t0: EV.u4punch, side: 'L', kind: 'punch', target: rel(brkRoot(EV.u4punch - 0.35).p, 82, 0.08, 0.0, 1.58)},
      // the swat at the drone in its face
      {t0: EV.u4let + 0.06, side: 'L', kind: 'hook', target: ALLY_AT_HARRY},
    ];
    const cat: CatchSpec[] = [{t0: EV.u4catch, side: 'R', at: u4CatchAt, hold: u4TugTip, t1: EV.u4let, wrench: {t0: 74.35, dir: rel({x: 0, z: 0}, U4_H, -1, 0.2, 0), dist: 0.14, deg: 18}}];
    return {
      strikes, catch: cat, posture: [[67.5, 'guard'], [EV.knee, 'idle']],
      crouch: 0.47 * sag,
      lean: 14 * kn - 6 * win(T, 73.5, 74.6, 0.3, 0.3) + 12 * after(T, EV.u4kill, 0.25),
      look: T < EV.u4catch ? {x: brk.p.x, y: 1.55, z: brk.p.z} : T < EV.harry - 0.3 ? add3(u4TugTip(T), {x: -0.4, y: 0.4, z: 0}) : undefined,
      attend: [{t0: EV.harry - 0.22, at: ALLY_AT_HARRY, t1: EV.u4kill, turn: false}],
      hits: [
        {t0: EV.knee, dir: {x: 0.95, y: 0, z: -0.3}, strength: 0.9},
        {t0: EV.harry, dir: {x: 0.9, y: 0, z: 0.1}, strength: 0.45},
        {t0: EV.u4kill, dir: {x: 0.85, y: -0.3, z: 0.3}, strength: 0.9},
      ],
      damage: {dent: {t0: EV.u4kill, deg: 10}, dead: {t0: EV.u4kill + 0.06}, leak: {t0: EV.u4kill + 0.1}},
      fall: {t0: EV.u4topple, dir: {x: -0.93, y: 0, z: 0.36}, ang: 79},
      lockAt: 67.5,
    };
  },
};

// ================================================================== U5 — for the runner's back; yanked; up; held off; recalled
const U5_KEYS: KR[] = [
  [69.65, 38.05, -7.55, 272], [EV.u5swing, 37.82, -7.5, 272], [70.8, 37.86, -7.45, 272], [71.6, 37.95, -7.3, 232],
  [73.1, 38.42, -6.15, 158], [EV.yankPull, 38.7, -5.35, 158],
];
/** after the get-up: for the tether operator; her clamp holds it; it tears it out; recalled */
const U5_UP: KR[] = [
  [79.0, 38.7, -5.35, 158], [79.65, 38.55, -5.5, 262], [80.7, 37.8, -5.95, 292], [EV.clamp2Taut, 37.8, -5.95, 292], [82.3, 37.66, -6.0, 292], [EV.clamp2Tear, 37.66, -6.0, 292],
  [84.6, 37.15, -6.22, 290], [86.4, 37.0, -6.3, 290], [87.1, 37.0, -6.3, 82],
];
const U5_FALL_DIR = {x: 0.78, y: 0, z: 0.45};
const u5Feet = (() => {
  const st = stepFeet(U5_KEYS, {half: HIPW + 0.04, stepLen: 0.55, stag: -0.04, init: standFeet({x: 38.05, z: -7.55}, 272)});
  const l = st.R[st.R.length - 1];
  // the clamped right shin is reeled toward the tether: the foot slides out (west), the body goes over to the east
  st.R.push([EV.yankPull, l[1], l[2]], [EV.yankPull + 0.28, l[1] - 0.7, l[2] - 0.15]);
  // risen (getUp 77.6 → 78.7), it draws the dragged leg back under itself before it turns (no snap at 79.0)
  const home = standFeet({x: 38.7, z: -5.35}, 158).R;
  st.R.push([78.45, l[1] - 0.7, l[2] - 0.15], [79.0, home.x, home.z, 0.1]);
  return st;
})();
/** her second clamp on its chest (the tether's target while it holds) */
export const u5Clamp = (T: number): V3 => {
  const r = keyRoot(U5_UP, T);
  return rel(r.p, r.h, 0.24, -0.05, 1.45);
};
const U5: Plan = {
  // (its charge comes straight on at the tether operator)
  id: D1_IDS.U5, lane: lane(VID.U5, {x: 66, z: -10.2}, {x: 47.0, z: -6.6}, {x: 43.0, z: -7.3}, {x: 40.9, z: -7.8}, {x: 38.05, z: -7.55}), T0: RUN_T0 + 0.3, T1: 69.65,
  phases: [
    {kind: 'stand', root: U5_KEYS, feet: u5Feet},
    {kind: 'stand', root: U5_UP},
    {kind: 'walk', pts: [{x: 37.0, z: -6.3}, {x: 39.8, z: -6.7}, {x: 47.2, z: -6.65}, {x: 54.6, z: -7.4}], T0: 87.2, T1: 95.7, stride: 1.9, A: 0.8, D: 1.0},
    // (D2 takes it over at 96.5 standing at (54.6, −7.4) facing 92)
    {kind: 'stand', root: [[95.7, 54.6, -7.4, 95.8], [96.45, 54.6, -7.4, 92]]},
  ],
  act: (T) => {
    const strain = win(T, EV.clamp2Taut, EV.clamp2Tear + 0.1, 0.12, 0.08);
    const up = T > 78.9;
    return {
      strikes: [{t0: EV.u5swing, side: 'R', kind: 'hammer', target: {x: 36.75, y: G(36.3, -7.4) + 1.5, z: -7.45}}],
      posture: [[67.6, 'guard'], [EV.yankPull, 'idle'], [78.9, 'guard'], [87.1, 'idle']],
      look: T < 71.4 ? {x: 36.3, y: 1.5, z: -7.4} : T < EV.yankPull ? runHeadAim(T) : up && T < 87.0 ? {x: 36.0, y: 1.5, z: -6.6} : undefined,
      // her second clamp on its chest: it leans against the line, then tears it out with its left hand
      lean: 14 * strain, twist: -12 * strain,
      armL: T > EV.clamp2Tear - 0.35 && T < EV.clamp2Tear + 0.35 ? {hand: lerp3s(u5Clamp(EV.clamp2Tear - 0.3), add3(u5Clamp(EV.clamp2Tear), {x: 0.1, y: 0.4, z: -0.3}), smooth((T - EV.clamp2Tear + 0.05) / 0.25)), open: T < EV.clamp2Tear - 0.08} : undefined,
      attend: [{t0: EV.recall, at: {x: 54, y: 2, z: -7}, t1: 88.2, turn: false}],
      hits: [{t0: EV.yankPull, dir: {x: 0.8, y: 0, z: 0.45}, strength: 1.1}, {t0: EV.clamp2Taut, dir: {x: -0.9, y: 0, z: -0.3}, strength: 0.5}],
      fall: {t0: EV.yankPull + 0.14, dir: U5_FALL_DIR, getUp: EV.u5up},
      lockAt: 67.6,
    };
  },
};

// ================================================================== U6 — at the flare carrier, then the soft targets; blinded
const U6_KEYS: KR[] = [
  [68.45, 41.8, 7.0, 276], [69.85, 39.05, 7.25, 274], [EV.u6punch, 38.75, 7.32, 274], [71.8, 38.75, 7.3, 274], [72.9, 38.55, 7.36, 274],
  [73.6, 38.5, 7.2, 252], [74.4, 38.4, 6.9, 238], [75.85, 37.4, 6.2, 236], [EV.flareHit, 36.5, 5.55, 236],
];
const U6_KEYS2: KR[] = [
  [EV.flareHit + 0.001, 36.5, 5.55, 236], [77.6, 36.78, 5.38, 252], [78.4, 37.02, 5.28, 268], [79.6, 37.3, 5.55, 206], [86.2, 37.35, 5.6, 206], [86.85, 37.35, 5.6, 103],
];
const U6: Plan = {
  id: D1_IDS.U6, lane: lane(VID.U6, {x: 60, z: 8.8}, {x: 54, z: 9.0}, {x: 47.2, z: 7.6}, {x: 43.6, z: 7.2}, {x: 41.8, z: 7.0}), T0: RUN_T0 + 0.15, T1: 68.45,
  phases: [
    {kind: 'stand', root: U6_KEYS},
    {kind: 'stand', root: U6_KEYS2},
    {kind: 'walk', pts: [{x: 37.35, z: 5.6}, {x: 41.8, z: 6.6}, {x: 47.3, z: 7.55}, {x: 54.2, z: 8.0}], T0: 86.9, T1: 93.6, stride: 2.0, A: 0.8, D: 1.0},
    // (D2 takes it over at 97.05 standing at (54.2, 8.0) facing 88)
    {kind: 'stand', root: [[93.6, 54.2, 8.0, 93.7], [94.4, 54.2, 8.0, 88]]},
  ],
  act: (T) => {
    const blind = win(T, EV.flareHit + 0.03, 79.6, 0.18, 0.6);
    return {
      strikes: [
        {t0: EV.u6punch, side: 'R', kind: 'punch', target: {x: 37.15, y: G(37, 7.45) + 1.56, z: 7.42}},
        {t0: 72.9, side: 'L', kind: 'punch', target: {x: 36.85, y: G(36.6, 7.6) + 1.5, z: 7.55}},
      ],
      posture: [[67.6, 'guard'], [74.3, 'ready'], [EV.flareHit, 'idle'], [79.6, 'guard'], [86.7, 'idle']],
      look: T < 73.4 ? {x: 36.8, y: 1.6, z: 7.5} : T < EV.flareHit ? {x: 34.2, y: 1.2, z: 4.4} : T < 86.8 ? {x: 36.2 - blind * 0.5, y: 2.6 - blind * 1.2, z: 8.5} : undefined,
      armL: blind > 0.01 ? {hand: lerp3s(rel({x: 36.8, z: 5.4}, 250, 0.25, -0.25, 1.0), rel({x: 36.8, z: 5.4}, 250, 0.2, -0.08, 2.0), blind), open: true} : undefined,
      hits: [{t0: EV.flareHit, dir: {x: 0.6, y: 0, z: -0.8}, strength: 0.9}],
      lockAt: 67.6,
    };
  },
};

// ================================================================== U7, U8 — the flanks
const U7: Plan = {
  id: D1_IDS.U7, lane: lane(VID.U7, {x: 49.5, z: -13.4}, {x: 44.5, z: -11.6}, {x: 42.7, z: -10.8}), T0: RUN_T0 + 0.45, T1: 68.95,
  phases: [
    {kind: 'stand', root: [[68.95, 42.7, -10.8, 246], [69.6, 42.7, -10.8, 292], [73.5, 42.7, -10.8, 292], [74.6, 42.0, -10.1, 282], [80.5, 42.0, -10.1, 282], [81.6, 41.2, -9.3, 262],
      [86.3, 41.2, -9.3, 262], [87.25, 41.2, -9.3, 53]]},
    {kind: 'walk', pts: [{x: 41.2, z: -9.3}, {x: 44.4, z: -11.7}, {x: 49.6, z: -13.6}, {x: 55.0, z: -12.4}], T0: 87.3, T1: 95.2, stride: 1.9, A: 0.8, D: 1.0},
    // (D2 takes it over at 96.0 standing at (55.0, −12.4) facing 85)
    {kind: 'stand', root: [[95.2, 55.0, -12.4, 102.5], [95.95, 55.0, -12.4, 85]]},
  ],
  // the north flank: it closes in step by step on the tether operator, scanning the line
  act: (T) => ({
    posture: [[67.9, 'guard'], [87.1, 'idle']],
    scan: {t0: 69.2, t1: 86.9, center: {x: 37.5, y: 1.4, z: -6.0}, span: 60, dwell: 1.1, torso: 0.25},
    attend: [{t0: EV.clamp2Fire + 0.1, at: {x: 37.7, y: 1.5, z: -6.0}, t1: EV.clamp2Tear + 0.4, turn: false}],
    raise: {t0: 80.4, t1: 82.4, side: 'R'}, lockAt: 67.9, look: T > 87 ? undefined : {x: 36.4, y: 1.5, z: -7.0},
  }),
};
const U8: Plan = {
  id: D1_IDS.U8, lane: lane(VID.U8, {x: 60, z: 10.0}, {x: 54, z: 10.2}, {x: 46.8, z: 8.3}, {x: 44.4, z: 9.7}, {x: 42.9, z: 10.3}), T0: RUN_T0 + 0.4, T1: 69.0,
  phases: [
    {kind: 'stand', root: [[69.0, 42.9, 10.3, 248], [72.8, 42.9, 10.3, 248], [74.0, 42.3, 9.8, 262], [76.4, 42.3, 9.8, 262], [76.7, 42.3, 9.8, 297]]},
    // the blinded U6: it steps in to cover it, facing the flare carrier
    {kind: 'walk', pts: [{x: 42.3, z: 9.8}, {x: 40.3, z: 8.8}, {x: 38.55, z: 7.35}], T0: 76.7, T1: 78.6, stride: 1.8, A: 0.4, D: 0.6},
    {kind: 'stand', root: [[78.6, 38.55, 7.35, 310], [79.2, 38.55, 7.35, 262], [86.3, 38.55, 7.35, 262], [86.95, 38.55, 7.35, 105.6]]},
    {kind: 'walk', pts: [{x: 38.55, z: 7.35}, {x: 42.3, z: 8.4}, {x: 46.6, z: 8.3}, {x: 54.0, z: 9.6}], T0: 87.0, T1: 93.4, stride: 2.0, A: 0.8, D: 1.0},
    // (D2 takes it over at 96.6 standing at (54.0, 9.6) facing 80)
    {kind: 'stand', root: [[93.4, 54.0, 9.6, 100], [94.2, 54.0, 9.6, 80]]},
  ],
  act: (T) => ({
    posture: [[67.9, 'guard'], [86.9, 'idle']],
    scan: {t0: 69.4, t1: 76.5, center: {x: 37.5, y: 1.4, z: 6.5}, span: 50, dwell: 1.0},
    attend: [{t0: 76.55, at: {x: 36.5, y: 1.6, z: 5.6}, t1: 78.4, turn: false}, {t0: 79.0, at: {x: 36.2, y: 1.55, z: 7.6}, t1: 86.6, turn: false}],
    lockAt: 67.9, look: T > 86.9 ? undefined : {x: 37.0, y: 1.6, z: 7.6},
  }),
};

// the reserve: as the front line leaves the east rim, the vanguard's second rank steps up into the empty slots and
// holds there on the far rim (x ≈ 81, ground ≈ +0.3…+0.9): over the west rim's crest "the gap" shows the crater and
// that line beyond it. (The bowl floor, −2.5…−3.7, is hidden from the fight by the west rim.)
const RESERVE_SPOTS: [number, XZ][] = (() => {
  const vacated = (['U1', 'U2', 'U4', 'U5', 'U6', 'U7', 'U8'] as const).map((n) => vanAt(VID[n])).sort((a, b) => a.z - b.z);
  // order-preserving assignment of free second-rank units to the vacated slots (sorted by z): no crossing paths
  const src = VAN.filter((u) => !TAKEN.has(u.id) && u.rest.x >= VAN_X0 + 1.3 && u.rest.x < VAN_X0 + 3.5).sort((a, b) => a.rest.z - b.rest.z);
  const n = vacated.length, m = src.length;
  if (m < n) return vacated.map((p): [number, XZ] => [pick(p.z, 1), p]);
  const cost: number[][] = Array.from({length: n + 1}, () => Array(m + 1).fill(1e9));
  for (let j = 0; j <= m; j++) cost[0][j] = 0;
  for (let i = 1; i <= n; i++) for (let j = i; j <= m; j++) cost[i][j] = Math.min(cost[i][j - 1], cost[i - 1][j - 1] + Math.abs(src[j - 1].rest.z - vacated[i - 1].z));
  const out: [number, XZ][] = [];
  for (let i = n, j = m; i > 0; j--) {
    if (cost[i][j] === cost[i][j - 1] && j > i) continue;
    out.unshift([src[j - 1].id, vacated[i - 1]]); TAKEN.add(src[j - 1].id); i--;
  }
  return out;
})();
const RESERVE: Plan[] = RESERVE_SPOTS.map(([vid, p], i) => {
  const from = vanAt(vid);
  // a short walk-up, rippling along the rank once the front has gone (≈ 58.4–61.4)
  const T0 = RUN_T0 + 1.3 + Math.abs(p.z) * 0.06 + (i % 2) * 0.2;
  const T1 = T0 + 1.6 + Math.hypot(p.x - from.x, p.z - from.z) * 0.35;
  const mid = {x: lerp(from.x, p.x, 0.5), z: lerp(from.z, p.z, 0.5)};
  return {
    id: 8111 + i, lane: [from, mid, p], T0, T1, stride: 1.5, walk: true,
    // arrive, then square up to face west across the crater
    phases: [{kind: 'stand', root: [[T1, p.x, p.z, headingTo(mid, p)], [T1 + 0.9, p.x, p.z, 270]]}],
    act: () => ({look: {x: 44, y: 1.5, z: p.z * 0.4}, lockAt: T0 + 0.4, idle: 0.4}),
  };
});
/** the vanguard units D1 animates itself (leave them out when drawing B's army) */
export const D1_ARMY_IDS = new Set<number>(TAKEN);

const PLANS: Record<string, Plan> = {U1, U2, U3, U4, U5, U6, U7, U8};
RESERVE.forEach((p, i) => (PLANS[`R${i + 1}`] = p));
export const UNIT_NAMES = Object.keys(PLANS);
export const FRONT = ['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7', 'U8'];
export const RESERVE_NAMES = RESERVE.map((_, i) => `R${i + 1}`);

/** the front units' charge footfalls in (T − win, T]: time, world point (same math as the mech kit's footAt) */
export const unitFootfalls = (T: number, wn = 1.0, names = FRONT): {t: number; pos: V3; key: string}[] => {
  const out: {t: number; pos: V3; key: string}[] = [];
  names.forEach((nm) => {
    const pl = PLANS[nm];
    if (T - wn > pl.T1 || T < pl.T0) return;
    const Wp = warpOf(pl), L = Wp.Ls, path = Wp.path, W = pl.stride ?? 2.3, duty = 0.55;
    const a = Math.max(pl.T0, T - wn), b = Math.min(T, pl.T1);
    const d = (t: number) => runDist(t, pl.T0, pl.T1, L, 1.2, 0.75);
    const d0 = d(a), d1 = d(b);
    [[0, -1], [0.5, 1]].forEach(([ph, sd]) => {
      for (let n = Math.ceil(d0 / W + ph); (n - ph) * W <= d1 && n < 1e4; n++) {
        const dn = (n - ph) * W;
        if (dn < 0.6 || dn > L - 0.6) continue;
        let lo = a, hi = b;
        for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (d(m) < dn) lo = m; else hi = m; }
        const p = path((n - ph + duty / 2) * W);
        const h = (p.heading * Math.PI) / 180;
        const x = p.pos.x + Math.cos(h) * sd * 0.17, z = p.pos.z + Math.sin(h) * sd * 0.17;
        out.push({t: hi, pos: {x, y: G(x, z), z}, key: `${nm}_${n}_${ph}`});
      }
    });
  });
  return out;
};

/** A named D1 unit's spec at film time T (all t0s in film seconds). */
export const unitD1 = (name: string, T: number): UnitSpec => run(PLANS[name], T);

// ------------------------------------------------------------------ enemy drones (low over the crater)
export const DRONE_IDS = {ED1: 8151};
const hover = (id: number, c: V3, T: number, r = 1.2): DroneSpec => ({
  id, t: T, pos: {x: c.x + Math.sin(T * 0.37 + id) * r, y: c.y + Math.sin(T * 0.6 + id * 2) * 0.35, z: c.z + Math.cos(T * 0.29 + id) * r},
  heading: 270 + Math.sin(T * 0.2 + id) * 20, vel: {x: Math.cos(T * 0.37 + id) * 0.37 * r, y: 0, z: -Math.sin(T * 0.29 + id) * 0.29 * r}, eye: 'cyan', ground,
});
const HOVER: V3[] = [{x: 56, y: 6.5, z: -9}, {x: 61, y: 8.5, z: 3}, {x: 54, y: 5.2, z: 9}, {x: 68, y: 9.5, z: -4}, {x: 72, y: 7.0, z: 8}];
/** ED1: holds low over the crater; at the GAIN it comes in low over the bowl and sweeps the rim crest and the cover slab
 *  with its beam (the Crew stay down), then climbs back to its station (back on it by 95.4, inside D2's first shot) */
const ED1_C: V3 = {x: 63, y: 7.6, z: -5.5};
const SWEEP: [number, number, number, number][] = [ // [T, x, y, z] (the first and last: its hover position then)
  [90.3, 0, 0, 0], [91.25, 52.2, 6.1, -2.0], [92.3, 51.5, 5.9, 1.8], [93.4, 51.9, 6.0, 5.4], [94.4, 56.5, 6.6, 2.0], [95.4, 0, 0, 0],
];
/** ED1 during the sweep: its position and the beam's spot (along the slab's top edge, then the crest beside it) */
export const ed1Sweep = (T: number): {pos: V3; mark?: V3} | null => {
  if (T <= SWEEP[0][0] || T >= SWEEP[SWEEP.length - 1][0]) return null;
  const h0 = hover(DRONE_IDS.ED1, ED1_C, SWEEP[0][0], 1.6).pos, h1 = hover(DRONE_IDS.ED1, ED1_C, SWEEP[SWEEP.length - 1][0], 1.6).pos;
  const K = SWEEP.map((k, i) => (i === 0 ? [k[0], h0.x, h0.y, h0.z] : i === SWEEP.length - 1 ? [k[0], h1.x, h1.y, h1.z] : k));
  let i = 0;
  while (i < K.length - 2 && T > K[i + 1][0]) i++;
  // Hermite through the keys (time-scaled Catmull-Rom tangents; zero at the ends: it leaves and rejoins the hover)
  const tan = (j: number, ax: number) => (j === 0 || j === K.length - 1 ? 0 : (K[j + 1][ax] - K[j - 1][ax]) / (K[j + 1][0] - K[j - 1][0]));
  const a = K[i], b = K[i + 1], dt = b[0] - a[0], u = (T - a[0]) / dt, u2 = u * u, u3 = u2 * u;
  const H = (ax: number) => (2 * u3 - 3 * u2 + 1) * a[ax] + (u3 - 2 * u2 + u) * tan(i, ax) * dt + (-2 * u3 + 3 * u2) * b[ax] + (u3 - u2) * tan(i + 1, ax) * dt;
  const pos = {x: H(1), y: H(2), z: H(3)};
  const m = clamp((T - EV.sweep0) / (EV.sweep1 - EV.sweep0));
  // (along the slab's top edge: x ≈ 47.13 + 0.05, y ≈ 2.97 — props.ts COVER_SLAB o + V·h)
  const mark = T > EV.sweep0 && T < EV.sweep1 ? {x: 47.2, y: 2.97, z: lerp(0.4, 6.2, m)} : undefined;
  return {pos, mark};
};
export const ed1Pos = (T: number) => ed1Sweep(T)?.pos ?? hover(DRONE_IDS.ED1, ED1_C, T, 1.6).pos;
export const enemyDrones = (T: number): DroneSpec[] => {
  const sw = ed1Sweep(T);
  const ed1: DroneSpec = {...hover(DRONE_IDS.ED1, ED1_C, T, 1.6), eye: 'amber', key: 'd1ed1'};
  if (sw) {
    const p2 = ed1Sweep(T + 0.05)?.pos ?? sw.pos, p0 = ed1Sweep(T - 0.05)?.pos ?? sw.pos;
    const vel = mul3(sub3(p2, p0), 10);
    ed1.pos = sw.pos; ed1.vel = vel;
    ed1.heading = Math.hypot(vel.x, vel.z) > 0.6 ? (Math.atan2(vel.x, -vel.z) * 180) / Math.PI : 270;
    if (sw.mark) { ed1.mark = {target: sw.mark, t0: EV.sweep0, t1: EV.sweep1, color: 'amber'}; ed1.look = sw.mark; }
  }
  return [ed1, ...HOVER.map((c, i) => ({...hover(8152 + i, c, T), key: `d1ed${i + 2}`}))];
};

// ------------------------------------------------------------------ wreck positions (for later sections' staging)
export const WRECKS = {
  U4: 'face down just west of the rim at ≈ (40.3, 3.95) (feet ≈ (41.3, 3.7)), head toward the west-south-west; eye dark, chest dented',
  U1: 'on its front over U2 at ≈ (40.8, −3.0) (feet ≈ (41.1, −2.1)), left forearm torn off at the elbow, chest plate off, dented',
  U2: 'under U1 at ≈ (40.85, −3.9) (feet ≈ (41.15, −2.95)), left pauldron torn off by the runner\'s halligan',
  U3: 'on its back, head-down on the crater\'s inner slope below the gap: feet ≈ (47.6, −1.5, y ≈ +0.4), pelvis ≈ (48.1, −1.7, y ≈ 0), head ≈ (48.65, −2.1, y ≈ −0.4)',
};
