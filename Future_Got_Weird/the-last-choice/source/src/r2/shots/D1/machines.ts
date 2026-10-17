// Section D1 machines: PURE specs (no React, no continuity import) — imported by the shots and by ./persist.ts.
//
// The front line: eight combat units run west from the halted front (PLAN.enemyFront, x ≈ 110) across the crater
// floor and over its west rim, and meet the Crew on the avenue just west of the rim (x ≈ 41–43). The rim's tilted
// asphalt plates (set: cplate 6–9) leave lanes the units come through; "the gap" is the lane between plates 7 and 8
// (z ≈ −2.4 … 0.7), where U3 stands last in line until BR4.
//
//   U1 8101  the Director's opponent: plate-slammed at CLASH (staggers back into U3); BR1 swings and dents the plate;
//            BR2 the breaker smashes its chest plate (it reels); BR3 the tether swings it into U2 → both down.
//   U2 8102  north of U1, pressing the Director's left; BR3: U1 slams into it, both fall (wrecks).
//   U3 8103  last in line, in the gap on the rim; BR4: the Director's shoulder charge drives it back into the crater.
//   U4 8104  the breaker's: knee joint broken 72.45 (drops to a knee); the runner pries its back plate and rips its
//            cables 75.95–76.8; it dies and topples forward (wreck).
//   U5 8105  the tether yanks its leg out at 74.4 (falls on its back), it gets up again (machines do).
//   U6 8106  blinded by a flare at 77.72, staggers; recovers.
//   U7 8107, U8 8108  the flanks.
// The reserve (8111–8117): the vanguard's second rank steps up onto the far (east) rim as the front leaves it and holds
// there, seen through the gap; enemy drones hold low over the crater.
import type {UnitSpec, DroneSpec} from '../../mech';
import {V3, clamp, smooth, lerp, add3} from '../../../kit/math';
import {M} from '../../timing';
import {PLAN} from '../../world/plan';
import {armyUnits} from '../B/army';
import {rnd} from '../../../kit/math';
import {XZ, KR, KP, G, keyRoot, footAt, autoSteps, runDist, runSpeed, cruise, linePath, pathLen, fwdOf, rightOf, headingTo, win, after, slopeWarp, gaitFoot} from './motion';

const ground = G;
const lerp3s = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
const RUN_T0 = 57.0; // the front starts its run on C6's build (the system commits)
export const D1_IDS = {U1: 8101, U2: 8102, U3: 8103, U4: 8104, U5: 8105, U6: 8106, U7: 8107, U8: 8108};

// ------------------------------------------------------------------ key moments (film s)
export const EV = {
  clash: M.CLASH + 0.03, // the plate meets U1 (one frame after the cut on the beat)
  u1jab: 70.45, // U1's first blow, taken on the plate (glance, no dent)
  bash1: 71.25, // the Director bashes U1 back
  knee: 72.45, // breaker → U4's knee
  yankFire: 74.1, yankBite: 74.4, yankPull: 74.52, // tether → U5's shin
  pryIn: 75.95, pryPop: 76.35, rip: 76.75, // runner → U4's back plate, cables
  flareThrow: 77.3, flareHit: 77.72, // host → U6's eye
  br1Lock: 78.5, br1: 79.1, // U1's swing meets the plate: the plate dents
  br2: 81.78, // breaker → U1's chest plate
  br3Fire: 82.98, br3Bite: 83.28, br3Taut: 83.45, br3Topple: 83.5, br3Crash: 84.06, // tether swings U1 into U2
  br4Go: 85.9, br4: 86.36, br4Fall: 86.98, // the Director's shoulder drive → U3 over the crest, down into the crater
};

// ------------------------------------------------------------------ the Director's plate, as the units aim at it
/** Where the Director's raised plate is (world), approximately, during the fight: the units' strike targets. */
export const plateAim = (T: number): V3 => {
  // he stands at (40.75, −0.75) facing east (40.65 from 78.2), guard wrist 112 rig units ahead, 1.4 m up; the plate
  // sits ~0.15 m below the wrist on the forearm's back (see crew.tsx plateFromGuard)
  const x = T < 77 ? 41.25 : T < EV.br1 ? 41.12 : lerp(41.12, 40.5, smooth((T - EV.br1) / 0.35));
  return {x, y: G(40.7, -0.75) + 1.27, z: -0.74};
};
export const directorHead = (T: number): V3 => ({x: T < EV.br1 ? 40.75 : 40.3, y: G(40.7, -0.75) + 1.62, z: -0.75});

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
  // relax once so bends are smooth
  return out.map((p, i) => (i === 0 || i === out.length - 1 || total - i * 0.8 < 4.5 ? p : {x: (out[i - 1].x + p.x * 2 + out[i + 1].x) / 4, z: (out[i - 1].z + p.z * 2 + out[i + 1].z) / 4}));
};
const lane = (vanId: number, ...rest: XZ[]) => avoid([vanAt(vanId), ...rest]);

// ------------------------------------------------------------------ unit plans
type Plan = {
  id: number;
  lane: XZ[]; // approach from the halted front to the final spot (the last segment points along the final heading)
  T0: number; T1: number; stride?: number;
  walk?: boolean; // a short walk-up, not a charge (upright, low swing)
  root?: KR[]; // after arrival: [T, x, z, heading] (first key = arrival)
  feet?: {L: KP[]; R: KP[]}; // explicit footsteps after arrival (default: autoSteps(root))
  act?: (T: number) => Partial<UnitSpec>;
};

/** the active one of several strikes (each has a window −0.42 … +0.85 s around its contact) */
const pickStrike = (T: number, list: NonNullable<UnitSpec['strike']>[]) => list.find((s) => T > s.t0 - 0.43 && T < s.t0 + 0.86);

const HIPW = 0.15; // mech parts U.hipW (the kit's gait feet sit hipW + 0.02 off the path; standing feet hipW + 0.04)
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

const run = (pl: Plan, T: number): UnitSpec => {
  const L = pathLen(pl.lane);
  const path = linePath(pl.lane, 1.2);
  const end = path(L);
  const base: UnitSpec = {id: pl.id, t: T, pos: end.pos, heading: end.heading, ground, idle: 0.55, key: `d1u${pl.id}`};
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
    return {
      ...base, gait: {path: W.path, dist, stride, lift, start: 0, end: Ls}, feet: {L: fl.p, R: fr.p, pitchL: fl.pitch, pitchR: fr.pitch},
      // climbing: a deeper crouch (the downhill foot stays in reach) and a lean into the slope
      crouch: (pl.walk ? 0.05 + 0.06 * k : 0.05 + 0.2 * k) + 0.12 * Math.abs(sl) * wk,
      lean: (pl.walk ? 3 + 4 * k : 4 + 11 * k) + clamp(sl * 22, -8, 16) * wk,
      lockAt: pl.T0 + 0.4,
    };
  }
  const root: KR[] = pl.root ?? [[pl.T1, end.pos.x, end.pos.z, end.heading]];
  const r = keyRoot(root, T);
  const feet = pl.feet ?? autoSteps(root, {stepLen: 0.55});
  const fl = footAt(feet.L, T, 0.11), fr = footAt(feet.R, T, 0.11);
  const sp: UnitSpec = {...base, pos: {x: r.p.x, y: 0, z: r.p.z}, heading: r.h, feet: {L: fl, R: fr}, lockAt: pl.T0 + 0.4, ...(pl.act ? pl.act(T) : {})};
  // the kit's hit stagger holds at 60 % and drops out 1.2 s after the blow (a pop of up to 0.17 m): carry that remainder
  // on the root instead and let it settle over the next 0.5 s
  for (const h of sp.hits ?? []) {
    const u = T - h.t0;
    if (u <= 1.2 || u > 1.7) continue;
    const k = 0.108 * h.strength * (1 - smooth((u - 1.2) / 0.5));
    const l = Math.hypot(h.dir.x, h.dir.z) || 1;
    sp.pos = {x: sp.pos.x + (h.dir.x / l) * k, y: sp.pos.y, z: sp.pos.z + (h.dir.z / l) * k};
    sp.crouch = (sp.crouch ?? 0) + k * 0.6;
  }
  // on the rim's slopes a planted foot can sit well below the pelvis's ground: crouch enough to keep it in reach
  const f = sp.feet ?? {};
  const gy = G(sp.pos.x, sp.pos.z);
  const need = Math.max(0, ...[f.L, f.R].map((q) => {
    if (!q) return 0;
    const dh = Math.min(0.9, Math.hypot(q.x - sp.pos.x, q.z - sp.pos.z));
    return HIP_Y + (gy - q.y) - ANKLE - Math.sqrt(LEG * LEG - dh * dh);
  }));
  if (need > (sp.crouch ?? 0)) sp.crouch = need;
  return sp;
};
// the unit's leg (mech parts U): hip 1.05 m above the root's ground when standing, thigh + shin 0.98 (keep a little bend)
const HIP_Y = 1.05, ANKLE = 0.1, LEG = 0.95;

// U1 — the Director's opponent
const U1_ROOT: KR[] = [
  [68.22, 42.3, -0.6, 270], [EV.clash, 42.3, -0.6, 270], [68.78, 43.45, -0.7, 268], [69.05, 43.45, -0.7, 268],
  [69.9, 42.3, -0.65, 270], [EV.bash1, 42.3, -0.65, 270], [71.62, 42.85, -0.6, 272], [72.5, 42.2, -0.5, 268],
  [74.2, 42.05, -0.2, 262], [76.2, 42.1, -0.55, 270], [78.3, 41.8, -0.9, 272],
  [EV.br1 + 0.02, 41.8, -0.9, 272], [79.4, 41.98, -0.88, 272], [80.1, 41.88, -0.9, 272], [80.95, 41.74, -0.9, 272],
  [EV.br2, 41.74, -0.9, 272], [82.3, 41.68, -1.55, 266], [82.85, 41.62, -1.92, 258],
];
const U1: Plan = {
  id: D1_IDS.U1, lane: lane(VID.U1, {x: 70, z: 0.6}, {x: 47.6, z: -0.6}, {x: 43.8, z: -0.6}, {x: 42.3, z: -0.6}), T0: RUN_T0 + 0.1, T1: 68.22,
  root: U1_ROOT,
  act: (T) => {
    const strike = pickStrike(T, [
      {t0: EV.u1jab, side: 'R', target: add3(plateAim(T), {x: 0.05, y: 0.05, z: -0.05}), kind: 'punch'},
      {t0: EV.br1, side: 'L', target: add3(plateAim(EV.br1 - 0.01), {x: 0.08, y: -0.08, z: 0.04}), kind: 'hammer'},
    ]);
    // BR1: intention before the wind-up — the left arm draws back and up from the cut (the strike's own wind-up
    // then starts from there)
    // (kept through the strike's wind-up, which starts from this hand; released at contact)
    const pre = clamp((T - 78.46) / 0.22);
    const gy = G(41.8, -0.9);
    const armL = T > 78.4 && T < EV.br1 ? {hand: lerp3s({x: 41.68, y: gy + 0.95, z: -0.5}, {x: 42.0, y: gy + 2.1, z: -0.3}, smooth(pre))} : undefined;
    // it braces into his charge (crouched, leaning in) as it arrives: the plate meets its lower chest plate
    const brace = win(T, 67.9, EV.clash + 0.25, 0.3, 0.25);
    return {
      strike, armL,
      twist: T > 78.4 && T < EV.br1 - 0.4 ? 8 * smooth(pre) : 0,
      lean: T > 78.4 && T < EV.br1 - 0.4 ? -3 * smooth(pre) : brace > 0 ? 12 * brace : undefined,
      crouch: 0.22 * brace,
      look: T < EV.br2 ? directorHead(T) : undefined,
      hits: [
        {t0: EV.clash, dir: {x: 1, y: 0, z: -0.05}, strength: 1.35},
        {t0: 68.74, dir: {x: -1, y: 0, z: 0}, strength: 0.45},
        {t0: EV.bash1 + 0.02, dir: {x: 1, y: 0, z: 0.08}, strength: 0.9},
        {t0: EV.br1 + 0.02, dir: {x: 1, y: 0, z: 0}, strength: 0.35},
        {t0: EV.br2, dir: {x: -0.12, y: 0, z: -1}, strength: 1.6},
        {t0: EV.br3Taut, dir: {x: 0.6, y: 0, z: 0.6}, strength: 0.5},
      ],
      damage: {chest: {t0: EV.br2, dir: {x: -0.45, y: 0.5, z: -0.75}, speed: 4.4}, dent: {t0: EV.br2, deg: 9}, leak: {t0: EV.br2 + 0.08}, dead: {t0: 84.75}},
      // hauled by the tether from the north-west, it topples into U2
      fall: {t0: EV.br3Topple, dir: {x: -0.5, y: 0, z: -0.87}},
      lockAt: 67.4,
    };
  },
};

// U2 — north of U1; BR3 partner
const U2: Plan = {
  id: D1_IDS.U2, lane: lane(VID.U2, {x: 70, z: -2.9}, {x: 47.6, z: -1.7}, {x: 44.0, z: -1.6}, {x: 42.0, z: -2.4}, {x: 42.2, z: -3.75}), T0: RUN_T0 + 0.25, T1: 68.75,
  // it holds north-east of U1 (clear of plate 8's edge), then steps in on the Director's side as U1 reels from BR2
  root: [[68.75, 42.2, -3.75, 8], [69.7, 42.2, -3.75, 258], [81.9, 42.2, -3.75, 256], [82.9, 41.4, -2.95, 282], [EV.br3Crash, 41.4, -2.95, 282]],
  act: (T) => ({
    look: T < EV.br3Crash ? (T < 80 ? directorHead(T) : {x: 42.6, y: 1.6, z: -1.4}) : undefined,
    raise: {t0: 76.4, t1: 77.6, side: 'R'},
    hits: [{t0: EV.br3Crash, dir: {x: -0.45, y: 0, z: -0.9}, strength: 1.5}],
    fall: {t0: EV.br3Crash + 0.05, dir: {x: -0.42, y: 0, z: -0.91}},
    damage: {pauldronL: {t0: EV.br3Crash, dir: {x: 0.3, y: 0.6, z: -0.7}, speed: 3}, dead: {t0: 85.1}, leak: {t0: 84.5}},
    lockAt: 67.6,
  }),
};

// U3 — last in line, in the gap; BR4
// ---- BR4, the shared timeline (the Director's side is in crew.tsx): he gathers low at (42.35, −0.92), bursts two
// strides into U3's chest (shoulder and tucked plate into its lower chest plate) at EV.br4, drives it 1.2 m back up the
// rim's west face in three short steps, shoves off; U3 staggers two steps back onto the crest (x ≈ 46.5, +1.0), its
// already tipping back as it staggers (the fall starts at the shove), its heels catch on the crest and it goes over
// backward, lands on the inner slope and slides down it.
export const BR4 = {gather: M.BR4, go: 85.9, hit: EV.br4, release: 86.95, settle: 87.4, fall: EV.br4Fall, stag: 87.2, slide0: 87.7, slide1: 88.9};
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
/** U3's root x (before the slide): waiting, driven (0.63 m ahead of him), shoved off (3.2 m/s, slowing), heels caught on the crest */
const U3_GAP = 0.63;
const u3X = (T: number): number => {
  if (T < BR4.hit) return 44.6;
  if (T < BR4.release) return br4X(T) + U3_GAP;
  const x0 = br4X(BR4.release) + U3_GAP;
  const u = Math.min(T - BR4.release, BR4.stag - BR4.release);
  const xf = x0 + 3.2 * u - 1.2 * u * u;
  return xf;
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
const U3_ROOT: KR[] = [[68.62, 44.6, -0.9, 270], [84.3, 44.6, -0.9, 270], [84.9, 44.6, -0.95, 270]];
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
const U3: Plan = {
  id: D1_IDS.U3, lane: lane(VID.U3, {x: 70, z: -2.2}, {x: 47.9, z: -0.9}, {x: 44.6, z: -0.9}), T0: RUN_T0 + 0.35, T1: 68.62,
  root: U3_ROOT,
  act: (T) => {
    if (T < 85.0) return {look: T < 84 ? directorHead(T) : {x: 41.5, y: 1.6, z: -0.8}, hits: [{t0: 68.74, dir: {x: 1, y: 0, z: 0}, strength: 0.7}], lockAt: 67.8};
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
      feet,
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

// U4 — the breaker's; knee broken, then pried and ripped
const U4_P = {x: 41.45, z: 3.72}, U4_H = 285;
const U4_ROOT: KR[] = [[68.5, 41.6, 3.8, 288], [69.3, 41.6, 3.8, 288], [70.1, 41.45, 3.72, U4_H]];
const u4Feet = (() => {
  const st = autoSteps(U4_ROOT, {stepLen: 0.5});
  const f = fwdOf(U4_H), r = rightOf(U4_H);
  // the knee drop: the broken (left) leg folds, its foot sliding back under it, shin to the ground; the right stays
  const back: [number, number] = [U4_P.x - f.x * 0.52 - r.x * 0.22, U4_P.z - f.z * 0.52 - r.z * 0.22];
  st.L.push([EV.knee + 0.02, st.L[st.L.length - 1][1], st.L[st.L.length - 1][2]], [EV.knee + 0.24, back[0], back[1], 0.03]);
  return st;
})();
const U4: Plan = {
  id: D1_IDS.U4, lane: lane(VID.U4, {x: 66, z: 5.6}, {x: 60, z: 6.8}, {x: 54.2, z: 5.3}, {x: 47.2, z: 5.3}, {x: 43.4, z: 4.4}, {x: 41.6, z: 3.8}), T0: RUN_T0 + 0.2, T1: 68.5,
  root: U4_ROOT, feet: u4Feet,
  act: (T) => {
    const kn = smooth(clamp((T - EV.knee) / 0.28));
    // (as it topples forward the body extends out of the kneel)
    const sag = kn * (1 - 0.15 * smooth(clamp((T - 73.4) / 1.2)) * (1 - after(T, 75.6))) * (1 - 0.75 * smooth(clamp((T - 77.0) / 0.45)));
    return {
      crouch: 0.47 * sag,
      lean: 14 * kn + 10 * after(T, EV.rip, 0.3),
      look: T < EV.knee ? {x: 39.9, y: 1.55, z: 3.3} : T < EV.pryIn ? {x: 39.5, y: 1.2, z: 3.2} : undefined,
      strike: pickStrike(T, [{t0: 69.45, side: 'R', target: {x: 40.1, y: G(40, 3.3) + 1.45, z: 3.05}, kind: 'punch'}, {t0: 74.35, side: 'L', target: {x: 40.2, y: G(40, 3.3) + 0.9, z: 3.4}, kind: 'punch'}]),
      // after the knee goes, the right hand braces on its own right knee
      armR: T > EV.knee + 0.25 && T < EV.pryPop ? {hand: {x: U4_P.x + fwdOf(U4_H).x * 0.12 + rightOf(U4_H).x * 0.26, y: G(U4_P.x, U4_P.z) + 0.62, z: U4_P.z + fwdOf(U4_H).z * 0.12 + rightOf(U4_H).z * 0.26}} : undefined,
      hits: [{t0: EV.knee, dir: {x: 0.95, y: 0, z: -0.3}, strength: 0.9}, {t0: EV.pryPop, dir: {x: -0.9, y: 0, z: 0.1}, strength: 0.6}, {t0: EV.rip, dir: {x: 0.5, y: 0, z: 0.4}, strength: 0.5}],
      damage: {back: {t0: EV.pryPop, dir: {x: 0.55, y: 0.85, z: 0.25}, speed: 3.2}, dead: {t0: EV.rip + 0.06}, leak: {t0: EV.rip}},
      fall: {t0: 77.0, dir: {x: -0.93, y: 0, z: 0.36}, ang: 79},
      lockAt: 67.5,
    };
  },
};
/** U4's knee joint and its back-plate edge (where the tools go) */
export const U4_KNEE_T = EV.knee;

// U5 — yanked by the tether, falls, gets up
const U5_ROOT: KR[] = [[68.6, 40.9, -7.8, 283], [72.6, 40.9, -7.8, 283], [73.6, 40.35, -7.7, 278]];
// after the breach (BR4) the system pulls the surviving front units back over the rim to re-form with the reserve
const U5_BACK: KR[] = [[87.1, 40.35, -7.7, 278], [87.9, 40.95, -7.62, 280], [88.5, 40.95, -7.62, 92], [92.6, 47.2, -6.65, 95], [96.5, 54.6, -7.4, 92]];
const u5Feet = (() => {
  const st = autoSteps(U5_ROOT, {stepLen: 0.6});
  const l = st.L[st.L.length - 1];
  // the clamped left shin is reeled toward the tether: the foot slides out (west), the body goes over backward
  st.L.push([EV.yankPull, l[1], l[2]], [EV.yankPull + 0.28, l[1] - 0.75, l[2] + 0.12]);
  // after getting up it re-plants the left foot
  st.L.push([78.85, l[1] - 0.75, l[2] + 0.12], [79.3, l[1] - 0.1, l[2]]);
  const back = autoSteps(U5_BACK, {stepLen: 0.6});
  // start the walk from where the feet actually are
  const lL = st.L[st.L.length - 1], lR = st.R[st.R.length - 1];
  back.L[0] = [back.L[0][0], lL[1], lL[2]]; back.R[0] = [back.R[0][0], lR[1], lR[2]];
  st.L.push(...back.L); st.R.push(...back.R);
  return st;
})();
const U5: Plan = {
  id: D1_IDS.U5, lane: lane(VID.U5, {x: 66, z: -10.2}, {x: 47.0, z: -6.6}, {x: 43.0, z: -7.3}, {x: 40.9, z: -7.8}), T0: RUN_T0 + 0.3, T1: 68.6,
  root: [...U5_ROOT, ...U5_BACK], feet: u5Feet,
  act: (T) => ({
    look: T < EV.yankBite ? {x: 35.9, y: 1.5, z: -7.6} : undefined,
    hits: [{t0: EV.yankPull, dir: {x: 1, y: 0, z: 0.05}, strength: 1.2}],
    fall: {t0: EV.yankPull + 0.14, dir: {x: 0.96, y: 0, z: 0.1}, getUp: 77.5},
    lockAt: 67.6,
  }),
};
// U6 — blinded by a flare
const U6_ROOT: KR[] = [[68.45, 41.8, 7.0, 276], [73.0, 41.8, 7.0, 276], [74.2, 41.05, 7.1, 274], [76.4, 40.45, 7.2, 274], [EV.flareHit, 40.45, 7.2, 274], [78.35, 41.05, 7.12, 284], [79.6, 41.05, 7.12, 276],
  [85.9, 41.05, 7.12, 276], [86.6, 41.7, 7.2, 276], [87.1, 41.7, 7.2, 88], [89.6, 47.3, 7.55, 90], [93.4, 54.2, 8.0, 88]];
const U6: Plan = {
  id: D1_IDS.U6, lane: lane(VID.U6, {x: 60, z: 8.8}, {x: 54, z: 9.0}, {x: 47.2, z: 7.6}, {x: 43.6, z: 7.2}, {x: 41.8, z: 7.0}), T0: RUN_T0 + 0.15, T1: 68.45,
  root: U6_ROOT,
  act: (T) => {
    const blind = win(T, EV.flareHit + 0.03, 79.4, 0.18, 0.6);
    return {
      look: T < EV.flareHit ? {x: 37.0, y: 1.6, z: 7.4} : {x: 36.5, y: 3.0 - blind * 1.5, z: 9.5},
      armL: blind > 0.01 ? {hand: lerp3s({x: 40.3, y: 1.05, z: 6.95}, {x: 40.2, y: G(40.6, 7.2) + 2.02, z: 7.0}, blind), open: true} : undefined,
      hits: [{t0: EV.flareHit, dir: {x: 1, y: 0, z: 0.1}, strength: 0.9}],
      strike: pickStrike(T, [{t0: 71.1, side: 'R', target: {x: 39.0, y: 1.3, z: 6.4}, kind: 'punch'}]),
      lockAt: 67.6,
    };
  },
};

// U7, U8 — the flanks
const U7: Plan = {
  id: D1_IDS.U7, lane: lane(VID.U7, {x: 49.5, z: -13.4}, {x: 44.5, z: -11.6}, {x: 42.7, z: -10.8}), T0: RUN_T0 + 0.45, T1: 68.95,
  root: [[68.95, 42.7, -10.8, 292], [73.5, 42.7, -10.8, 292], [74.6, 42.0, -10.1, 282], [80.5, 42.0, -10.1, 282], [81.6, 41.4, -9.4, 268],
    [87.0, 41.4, -9.4, 268], [87.7, 42.0, -9.7, 272], [88.2, 42.0, -9.7, 110], [89.4, 44.4, -11.7, 112], [92.0, 49.6, -13.6, 100], [96.0, 55.0, -12.4, 85]],
  act: (T) => ({look: {x: 36.0, y: 1.5, z: -7.6}, raise: {t0: 80.4, t1: 82.2, side: 'R'}, lockAt: 67.9}),
};
const U8: Plan = {
  id: D1_IDS.U8, lane: lane(VID.U8, {x: 60, z: 10.0}, {x: 54, z: 10.2}, {x: 46.8, z: 8.3}, {x: 44.4, z: 9.7}, {x: 42.9, z: 10.3}), T0: RUN_T0 + 0.4, T1: 69.0,
  root: [[69.0, 42.9, 10.3, 248], [72.8, 42.9, 10.3, 248], [74.0, 42.3, 9.8, 262], [79.0, 42.3, 9.8, 262], [80.2, 41.7, 9.3, 268],
    [86.1, 41.7, 9.3, 268], [86.8, 42.3, 9.2, 270], [87.3, 42.3, 9.2, 80], [89.4, 46.6, 8.3, 85], [93.4, 54.0, 9.6, 80]],
  act: (T) => ({look: {x: 37.0, y: 1.6, z: 7.6}, strike: pickStrike(T, [{t0: 76.0, side: 'L', target: {x: 41.0, y: 1.4, z: 8.6}, kind: 'punch'}]), lockAt: 67.9}),
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
    root: [[T1, p.x, p.z, headingTo(mid, p)], [T1 + 0.9, p.x, p.z, 270]],
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
export const unitFootfalls = (T: number, win = 1.0, names = FRONT): {t: number; pos: V3; key: string}[] => {
  const out: {t: number; pos: V3; key: string}[] = [];
  names.forEach((nm) => {
    const pl = PLANS[nm];
    if (T - win > pl.T1 || T < pl.T0) return;
    const Wp = warpOf(pl), L = Wp.Ls, path = Wp.path, W = pl.stride ?? 2.3, duty = 0.55;
    const a = Math.max(pl.T0, T - win), b = Math.min(T, pl.T1);
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
/** ED1: holds low over the crater (it no longer dives at the Crew in D1: the drone harry is shown in D2) */
const ED1_C: V3 = {x: 63, y: 7.6, z: -5.5};
export const ed1Pos = (T: number) => hover(DRONE_IDS.ED1, ED1_C, T, 1.6).pos;
export const enemyDrones = (T: number): DroneSpec[] => [
  {...hover(DRONE_IDS.ED1, ED1_C, T, 1.6), eye: 'amber', key: 'd1ed1'},
  ...HOVER.map((c, i) => ({...hover(8152 + i, c, T), key: `d1ed${i + 2}`})),
];

// ------------------------------------------------------------------ wreck positions (for later sections' staging)
export const WRECKS = {
  U4: 'face down just west of the rim at (40.4, 4.1), back plate off, cables torn out',
  U1: 'on its side at (40.9, −4.4), chest plate off (the plate lies at (38.9, −3.7)), dented',
  U2: 'face down under U1 at (41.0, −4.6), left pauldron torn off',
  U3: 'on its back, head-down on the crater\'s inner slope below the gap: feet ≈ (47.6, −1.5, y ≈ +0.4), pelvis ≈ (48.1, −1.7, y ≈ 0), head ≈ (48.65, −2.1, y ≈ −0.4)',
};
