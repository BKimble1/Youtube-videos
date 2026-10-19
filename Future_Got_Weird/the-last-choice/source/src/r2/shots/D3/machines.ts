// Section D3 machines: PURE specs (no continuity import) — imported by the shots and by ./persist.ts. The timeline is
// times.ts EV3; the shared marks (where the Crew will be) are marks.ts; the ground plan (water main, chunks, wrecks) is
// geo.ts; the exchange sheet is production/R3_EXCHANGES.md ## D3.
//
//   heavy 1 (HEAVIES_B[0], 3101)  D2's walk to its halt (121.0, unchanged: D2's heavy1()). On the way the allied drone
//            darts into its face: its ram swipes at it (119.2) — the drone jinks up out of it — and the flare goes into
//            the eye it fixed on the drone (119.38). Blind for a moment (the eye flickers back by ~121.2), it halts; the
//            drone's whine under the girder swings it round to the north (245 → 350, planted steps); the tether clamps
//            its front-left shin (122.25), the cable round girder post 3 goes taut (122.9): the leg is pinned. It lashes
//            its ram at the drone diving at its head (123.45; it jinks again), strains the pinned leg (123.95), and its
//            head comes round to its rear-left leg too late: the breaker splits that knee (124.75). It rolls onto its
//            left side across the crater (land 126.25). The wreck stays (PERSIST 'd3_heavy1'; D4, EF draw it).
//   the escorts (D2's survivors)  U8 8108 holds the crater's south-west: it walks up the slope at the Director and
//            hammers his plate (123.2), presses him back, turns on the crossing where the breaker ducked under the
//            water main (124.0): the Director's plate in its back (124.3), the runner's adze round its ankle (124.5):
//            down on its face; it gets up after the crash (126.95) and backs off to the south (machines do).
//            R3 8113 guards the heavy's front-left under the girder: it grabs the tether's cable by the clamped leg and
//            hauls (122.6–125.0) — she is dragged a step; the post holds — and backs off north as the heavy goes over.
//            R4 8114 behind the rear-left leg: it comes at the breaker along the main's north-east side; its hammer
//            comes down on the beam between him and the crossing (125.15, from (62.34, −0.28)); he pivots and dives
//            under it; it backs off east as the heavy falls (cut off behind the wreck).
//            R5–R7 fall back through the crater's south to the water main's break (regroup) as the heavy engages.
//   the arc  the 25 units D4 starts with (start.ts ARC_START, tableau ids). After the crash the system holds them at
//            the barrier (the wreck, the water main, the taut cable): three behind the wreck, eight along the main's
//            north-east side, ten south of its break, the wing massing under the girder north of the cable. At
//            FORMATION the line splits from the middle — its north end round the wreck's nose to the girder flank, the
//            rest down the main and through its break — and bends into an arc round the Crew (south-west of the main);
//            at DECOY_FAIL they walk through the light at its source; at FLANK_DENIED the cable is cut and the wing
//            comes over it (stepping over D2's wrecks); after the blast they all press in to exactly D4's start.
//   heavy 2 (HEAVIES_B[2] at rest (146, −10); drawn as the tableau's 7401 from the start of D3)  sent forward at 117.0:
//            up the north sidewalk, down under the girder's east end into the crater, onto D4's line (heading 262); it
//            climbs OVER heavy 1's wreck: its right feet set down on the wreck's top (144.31 → 149.06), its hull carried
//            up to 0.5 m over it (belly ≥ the wreck's height grid where its legs on the ground still reach); its left
//            feet step over the water main; its launcher fires at the crest (145.18); it walks on at D4's own speed —
//            each leg's feet and plants ARE D4's heavy2At from its landing at 149.12 (the rear-right, which D4 has inside
//            the wreck, from 149.49), the root from 149.12, the hull drop blending into D4's from 149.2.
//   drones   the tableau's eight (TB_DRONES ids): 7605 climbs above the dust at ADAPT and locks on; 7601 dives on the
//            decoy maker's tablet (136.35); 7602 cuts the tether cable (138.95) with 7603 swarming the girder flank;
//            7604 and 7607 run the allied drone down (141.35); all end at D4's first keys (droneD4 at 149.86).
import type {UnitSpec, HeavySpec, DroneSpec, Path, Posture} from '../../mech';
import type {Item, MeshItem} from '../../engine';
import {heavyAttach, unitAttach, unitRoot, heavy as heavyItems, solveHeavy, HEAVY_DIM} from '../../mech';
import {xfPoint} from '../../engine';
import {V3, clamp, smooth, lerp, rnd, add3, sub3, mul3, norm3} from '../../../kit/math';
import {M} from '../../timing';
import {EV3, SH3} from './times';
import {XZ, KP, KR, G, onG, keyRoot, footAt, autoSteps, runDist, runSpeed, cruise, linePath, pathLen, headingTo, wrapD, win, heavyStance, fwdOf} from '../D4/motion';
import {heavy1, unitD2, ANCHOR} from '../D2/machines';
import {D1_ARMY_IDS} from '../D1/machines';
import {armyUnits, HEAVIES_B, DRONES_B, droneSpecB} from '../B/army';
import {ARC_START} from '../D4/start';
import {NAMED as D4_NAMED, RING_PLANS, unitAt as d4UnitAt, heavy2At, heavy2Footfalls, heavy2Root as d4Heavy2Root, droneD4, dirHeadAt} from '../D4/machines';
import {PIPE, PIPE_HALF, pipeAt, neOfPipe, GATE, clearAt, UNIT_WRECK_CAPS, CAP_R} from './geo';
import {H1_AT, UNDER, DIR_MEET, U8_MEET, dirPlate, RUN_HOOK, DEC_SPOT, BLAST_XZ} from './marks';

export {PIPE, pipeAt, GATE, H1_AT, DEC_SPOT};
const ground = G;
const lerp3s = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
const hv = (h: number): V3 => ({x: Math.sin((h * Math.PI) / 180), y: 0, z: -Math.cos((h * Math.PI) / 180)});
const on = (p: XZ, up = 0): V3 => onG(p.x, p.z, up);
const norm360 = (h: number) => ((h % 360) + 360) % 360;
type K4 = [number, number, number, number];
/** smooth (Catmull-Rom, time-scaled tangents) through [t, x, y, z] keys */
const spl = (k: K4[], t: number, ax: 1 | 2 | 3) => {
  const n = k.length;
  if (t <= k[0][0]) return k[0][ax];
  if (t >= k[n - 1][0]) return k[n - 1][ax];
  let i = 0;
  while (i < n - 2 && t > k[i + 1][0]) i++;
  const p0 = k[Math.max(0, i - 1)], p1 = k[i], p2 = k[i + 1], p3 = k[Math.min(n - 1, i + 2)];
  const u = (t - p1[0]) / (p2[0] - p1[0]);
  const m1 = ((p2[ax] - p0[ax]) / Math.max(1e-3, p2[0] - p0[0])) * (p2[0] - p1[0]);
  const m2 = ((p3[ax] - p1[ax]) / Math.max(1e-3, p3[0] - p1[0])) * (p2[0] - p1[0]);
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p1[ax] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2[ax] + (u3 - u2) * m2;
};
const splV = (k: K4[], t: number): V3 => ({x: spl(k, t, 1), y: spl(k, t, 2), z: spl(k, t, 3)});
/** the highest water-main top (m above the ground) a polyline passes over (0 if it stays clear of it) */
export const pipeCross = (pts: XZ[]): number => {
  let top = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(2, Math.ceil(L / 0.15));
    for (let k = 0; k <= n; k++) { const q = pipeAt({x: lerp(a.x, b.x, k / n), z: lerp(a.z, b.z, k / n)}); if (q.d < 0.75 && q.u > 0 && q.u < 1) top = Math.max(top, q.top); }
  }
  return top;
};

// ================================================================== the allied drone (checker's) — D3's flight
// From D2's last key (hovering over the regroup, damaged): it darts at heavy 1's sensor head and hangs in its face
// (118.95), drawing the ram; it jinks up out of the swipe (119.06); round under the girder to the north of it, its whine
// swings the blind head round; it dives at the head again (123.3) and jinks (the ram's second swipe); it pulls away as
// the heavy goes over and comes back over the Crew; at ALLY_DRONE_LOST it flees two hunters low over the rim and is
// struck (EV3.kill).
const H1_EYE_AT = (t: number) => heavyAttach(heavy1(t)).eye;
const EYE_FRONT = (t: number, d = 1.55, up = 0.15): V3 => {
  const h = heavy1(t), p = h.gait!.path(h.gait!.dist), e = H1_EYE_AT(t), f = hv(p.heading);
  return {x: e.x + f.x * d, y: e.y + up, z: e.z + f.z * d};
};
/** the heavy's head after its swing (nose north under the girder): the drone's second dive comes at it */
const H1_HEAD2: V3 = (() => { const f = hv(H1_AT.h); return {x: H1_AT.x + f.x * 2.15, y: G(H1_AT.x, H1_AT.z) + 4.6, z: H1_AT.z + f.z * 2.15}; })();
export const ALLY3_KEYS: K4[] = (() => {
  const a = EYE_FRONT(EV3.allyAtEye);
  const d2 = add3(H1_HEAD2, {x: 0.05, y: 0.45, z: -1.75});
  return [
    [M.P3, 47.9, 2.42, -5.6], [117.55, 47.92, 2.5, -5.58], [117.95, 49.6, 2.75, -5.4], [118.45, 55.0, 2.6, -5.0],
    [EV3.allyAtEye, a.x, a.y, a.z],
    // the jink: up and to its left, clear before the ram's tip arrives (EV3.ram1)
    [EV3.allyJink + 0.16, a.x - 0.45, a.y + 1.7, a.z - 0.85], [119.8, a.x - 0.9, a.y + 3.0, a.z - 2.9],
    // round under the girder to the north of it (below the truss): the whine swings the blind head round
    [120.65, 61.8, 4.1, -9.6], [121.5, 63.2, 3.6, -11.0], [122.4, 64.6, 3.7, -11.1],
    // the second dive at its head, the jink back up (the ram's second swipe passes under it)
    [123.2, d2.x + 0.3, d2.y + 0.5, d2.z - 0.6], [123.36, d2.x, d2.y, d2.z], [123.62, d2.x - 0.7, d2.y + 1.9, d2.z - 0.9], [124.3, 63.6, 4.1, -10.6],
    // pulls away as it goes over, back over the Crew
    [125.3, 60.0, 4.9, -9.0], [126.6, 54.0, 4.4, -6.0], [128.5, 48.6, 3.7, -3.0], [130.5, 47.6, 3.3, -2.2],
    [133.0, 46.9, 3.1, -2.8], [135.5, 47.4, 3.4, -2.0], [137.5, 46.6, 3.2, -3.4], [139.4, 46.2, 3.0, -2.6],
    // the hunt: it banks away south-west low over the rim, the two hunters closing
    [140.5, 45.9, 3.0, -2.4], [140.85, 44.6, 2.6, -1.0], [141.15, 43.4, 2.2, 0.6], [EV3.kill, 42.9, 2.05, 1.3],
  ];
})();
export const ALLY_KILL_DIR: V3 = norm3({x: -0.55, y: -0.35, z: 0.75});
/** the allied drone's centre (before it is struck), for looks and aiming */
export const allyAt = (t: number): V3 => splV(ALLY3_KEYS, Math.min(t, EV3.kill));
/** the allied drone's flight pose from D3's keys (heading from velocity, nose-down with speed, bank into turns) */
export const allyPose3 = (t: number): {pos: V3; heading: number; pitch: number; roll: number; speed: number} => {
  const at = (q: number) => splV(ALLY3_KEYS, q);
  const p = at(t), v = mul3(sub3(at(t + 0.08), at(t - 0.08)), 6.25);
  const sp = Math.hypot(v.x, v.z);
  const hvd = (q: V3) => (Math.atan2(q.x, -q.z) * 180) / Math.PI;
  // in its face it keeps its nose on the head it is baiting
  const face = t > 118.7 && t < EV3.allyJink ? sub3(H1_EYE_AT(t), p) : t > 123.1 && t < 123.45 ? sub3(H1_HEAD2, p) : null;
  let heading = sp > 0.5 ? hvd(v) : face ? hvd(face) : hvd(sub3(at(t + 0.6), at(t - 0.6)));
  if (face && sp < 2.5) heading = hvd(face);
  const v2 = sub3(at(t + 0.25), at(t)), v1 = sub3(at(t), at(t - 0.25));
  const turn = ((hvd(v2) - hvd(v1) + 540) % 360) - 180;
  const roll = sp > 0.5 ? clamp(-turn * 0.6, -28, 28) : 0;
  const bob = 0.035 * Math.sin(t * 3.1 + 3) + 0.02 * Math.sin(t * 5.3 + 6);
  return {pos: add3(p, {x: 0, y: bob, z: 0}), heading, pitch: -clamp(sp * 3.2, 0, 26), roll, speed: sp};
};
/** where the wreck lands (the FX's allyDrone destroyAt computes it): the ground height there */
export const ALLY_CRASH_GROUND = G(42.2, 2.35);

// ================================================================== HEAVY 1
const H1_HALT = (() => { const h = heavy1(EV3.turn0); const p = h.gait!.path(h.gait!.dist); return {x: p.pos.x, z: p.pos.z, h: norm360(p.heading)}; })();
const H1_ROOT: KR[] = [
  [EV3.turn0, H1_HALT.x, H1_HALT.z, H1_HALT.h],
  [121.9, lerp(H1_HALT.x, H1_AT.x, 0.55), lerp(H1_HALT.z, H1_AT.z, 0.55), lerp(H1_HALT.h, H1_AT.h, 0.5)],
  [EV3.turn1, H1_AT.x, H1_AT.z, H1_AT.h],
];
/** the four feet at the halt (ground contact under the kit's ankles) */
const H1_FEET0: XZ[] = heavyAttach(heavy1(EV3.turn0)).feet.map((f) => ({x: f.x, z: f.z}));
/** quadruped steps from given footholds over a keyed root (lateral sequence; the last cycle sets the final stance) */
const quadFrom = (start: XZ[], root: KR[], cyc: number, lift = 0.55, order = [0, 3, 1, 2]): KP[][] => {
  const legs: KP[][] = start.map((p) => [[root[0][0], p.x, p.z] as KP]);
  for (let s = 1; s < root.length; s++) {
    const a = root[s - 1], b = root[s], dt = b[0] - a[0];
    const n = Math.max(1, Math.round(dt / cyc)), c = dt / n, sw = c / 4;
    for (let ci = 0; ci < n; ci++) order.forEach((i, j) => {
      const t0 = a[0] + ci * c + j * sw, t1 = t0 + sw * 0.92;
      const at = s === root.length - 1 && ci === n - 1 ? b[0] : Math.min(b[0], t1 + c * 0.35);
      const rp = keyRoot(root, at);
      const p = heavyStance(rp.p.x, rp.p.z, rp.h, i);
      const L = legs[i];
      L.push([t0, L[L.length - 1][1], L[L.length - 1][2]], [t1, p[0], p[1], lift]);
    });
    legs.forEach((L) => L.push([b[0], L[L.length - 1][1], L[L.length - 1][2]]));
  }
  return legs;
};
/** heavy 1's keyed footholds after its halt (the swing round and the strain on the pinned leg) */
export const H1_LEGS: KP[][] = (() => {
  const L = quadFrom(H1_FEET0, H1_ROOT, 0.85, 0.5);
  // the pinned front-left: it tries to step back off the pin (south-east) and the cable holds it
  const f = L[0][L[0].length - 1];
  const back = {x: f[1] + 0.3, z: f[2] + 0.34};
  L[0].push([EV3.yank, f[1], f[2]], [EV3.yank + 0.2, back.x, back.z, 0.38], [EV3.yank + 0.42, f[1] + 0.04, f[2] + 0.04, 0]);
  return L;
})();
/** each leg's landings after the halt: [t, leg] (the hull settles on each) */
const H1_PLANTS: {t: number; leg: number}[] = H1_LEGS.flatMap((k, leg) => k.slice(1).filter((kk, j) => Math.hypot(kk[1] - k[j][1], kk[2] - k[j][2]) > 0.05).map((kk) => ({t: kk[0], leg}))).sort((a, b) => a.t - b.t);
const h1Plants = (T: number) => [0, 1, 2, 3].map((leg) => { let t: number | undefined; for (const p of H1_PLANTS) { if (p.t > T) break; if (p.leg === leg) t = p.t; } return t; });
/** the pinned front-left shin: where the clamp bites (on the lower leg, ~1.5 m above the foot) */
export const h1ClampPt = (T: number): V3 => {
  const h = heavy1D3(Math.min(T, EV3.knee));
  const a = heavyAttach(h);
  return lerp3s(a.knees[0], a.feet[0], 0.55);
};
/** the ram's two swipes: at the drone hanging in its face (it jinked up), at the drone diving at its head */
const RAM1_AT: V3 = (() => splV(ALLY3_KEYS, EV3.allyAtEye + 0.04))();
const RAM2_T = 123.45;
const RAM2_AT: V3 = (() => { const p = splV(ALLY3_KEYS, 123.36); return add3(p, {x: 0, y: -0.25, z: 0.2}); })();
export {RAM1_AT, RAM2_AT, RAM2_T};
/** its head swinging blind after the flash: up and away, then sweeping */
const blindLook = (T: number, eye: V3, h: number): V3 => {
  const f = hv(h), r = {x: -f.z, y: 0, z: f.x};
  if (T < EV3.flash + 0.35) {
    const k = smooth((T - EV3.flash) / 0.25);
    return {x: eye.x + f.x * 4 + r.x * 3 * k, y: eye.y + 2 + 6 * k, z: eye.z + f.z * 4 + r.z * 3 * k};
  }
  const s = Math.sin((T - EV3.flash - 0.35) * 4.2);
  return {x: eye.x + f.x * 6 + r.x * 5 * s, y: eye.y + 1.5 - 1.0 * Math.abs(s), z: eye.z + f.z * 6 + r.z * 5 * s};
};
/** the eye washed out by the flash: dark, then flickering back (it sees again by ~121.2) */
const blindEye = (T: number): 'amber' | 'off' => {
  if (T < EV3.flash || T > 121.2) return 'amber';
  if (T < EV3.flash + 0.22) return 'off';
  return rnd(Math.floor(T * 22) * 7 + 3) > 0.45 + 0.3 * smooth((T - 119.8) / 1.4) ? 'off' : 'amber';
};
/** after the halt: the drone's whine (it hunts the thing that blinded it), the pinned leg, the breaker at its knee */
const h1LookAfter = (T: number, h: number): V3 => {
  const eye = H1_EYE_AT(EV3.turn0);
  const ally = allyAt(T);
  const legFL = (() => { const f = H1_LEGS[0][H1_LEGS[0].length - 1]; return on({x: f[1], z: f[2]}, 1.2); })();
  const knee = on({x: H1_AT.x - 1.6, z: H1_AT.z + 3.6}, 1.0);
  let p = T < 121.5 ? lerp3s(blindLook(T, eye, h), ally, smooth((T - EV3.turn0) / 0.5)) : ally;
  p = lerp3s(p, legFL, win(T, 123.75, 124.35, 0.2, 0.15));
  p = lerp3s(p, knee, smooth((T - 124.3) / 0.35));
  return p;
};
export const heavy1D3 = (T: number): HeavySpec => {
  const ram = T < 121.6 ? {t0: EV3.ram1, target: RAM1_AT} : {t0: RAM2_T, target: RAM2_AT};
  const base: HeavySpec = {
    id: HEAVIES_B[0].id, t: T, pos: {x: 0, y: 0, z: 0}, heading: 0, ground, key: 'd3hv1', ram,
    damage: {plateL: {t0: EV3.land + 0.03, dir: {x: -0.15, y: 0.6, z: -1.0}}, dead: {t0: EV3.land + 0.1}},
    kneeBreak: {t0: EV3.knee, leg: 2, dir: {x: -0.45, y: 0, z: -0.9}, limp: true},
    pinned: {t0: EV3.taut, leg: 0, hold: true},
  };
  if (T < EV3.turn0) {
    const h = heavy1(T);
    const p = h.gait!.path(h.gait!.dist);
    const eye = H1_EYE_AT(T);
    const look = T < 117.85 ? h.look : T < EV3.flash ? allyAt(T) : blindLook(T, eye, p.heading);
    // the flash: it rears back off its stride
    return {...h, ...base, pos: h.pos, heading: h.heading, gait: h.gait, look, eye: blindEye(T), lockAt: undefined, fire: undefined, kneeBreak: undefined, damage: undefined,
      stumble: {t0: EV3.flash + 0.06, dir: hv(p.heading + 180), strength: 0.55}};
  }
  const tt = Math.min(T, EV3.knee);
  const r = keyRoot(H1_ROOT, tt);
  const feet = H1_LEGS.map((k) => footAt(k, tt, 0.5));
  // the strain on the pin: the hull lurches as the held leg is pulled back down
  const lurch = win(tt, EV3.yank + 0.15, EV3.yank + 0.75, 0.08, 0.45);
  return {
    ...base, pos: {x: r.p.x, y: 0, z: r.p.z}, heading: r.h, feet, plants: h1Plants(tt), look: h1LookAfter(tt, r.h), eye: blindEye(tt),
    stumble: {t0: EV3.yank + 0.2, dir: hv(r.h + 140), strength: 0.4},
    drop: 0.16 * lurch,
  };
};
/** heavy 1 at the moment the knee splits (the frozen rig the topple rotates), and its wreck at rest */
export const H1_BREAK = () => heavyAttach(heavy1D3(EV3.knee - 0.001));
export const H1_WRECK = () => heavyAttach(heavy1D3(EV3.land + 2));
/** the rear-left knee, where the breaker's ram lands (a touch outside and behind the joint) */
export const KNEE_AT = (): V3 => { const k = H1_BREAK().knees[2]; return {x: k.x - 0.05, y: k.y - 0.06, z: k.z + 0.1}; };
/** the breaker's stance under the leg: 1.05 m from the knee toward the crossing he came through */
export const BRK_STAND: XZ & {h: number} = (() => {
  const k = H1_BREAK().knees[2];
  const d = {x: UNDER.ne.x - k.x, z: UNDER.ne.z - k.z}, l = Math.hypot(d.x, d.z);
  const p = {x: k.x + (d.x / l) * 1.05, z: k.z + (d.z / l) * 1.05};
  return {...p, h: headingTo(p, k)};
})();

// ---- the wreck's footprint (from its own mesh: every vertex within 3 m of the ground, as a convex hull) and height
type Hull = {v: XZ[]; c: XZ; top: number[]; x0: number; z0: number; nx: number; nz: number};
let WRECK: Hull | null = null;
const hull2 = (pts: XZ[]): XZ[] => {
  const P = [...pts].sort((a, b) => a.x - b.x || a.z - b.z);
  const cr = (o: XZ, a: XZ, b: XZ) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lo: XZ[] = [], hi: XZ[] = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
};
export const wreckHull = (): Hull => {
  if (WRECK) return WRECK;
  const its = heavyItems({...heavy1D3(EV3.land + 3), lod: 'full'}) as Item[];
  const pts: V3[] = [];
  its.forEach((it) => {
    if (it.kind !== 'mesh') return;
    const m = it as MeshItem;
    m.mesh.verts.forEach((p, i) => { const q = m.xf ? xfPoint(p, m.xf) : p; pts.push(m.fn ? m.fn(q, i) : q); });
  });
  const low = pts.filter((p) => p.y < G(p.x, p.z) + 3.2);
  const v = hull2(low.map((p) => ({x: p.x, z: p.z})));
  const c = {x: v.reduce((s, q) => s + q.x, 0) / v.length, z: v.reduce((s, q) => s + q.z, 0) / v.length};
  // a 0.5 m height grid over its box (the step-over lifts and the belly clearance read it)
  const x0 = Math.min(...v.map((q) => q.x)) - 0.5, x1 = Math.max(...v.map((q) => q.x)) + 0.5;
  const z0 = Math.min(...v.map((q) => q.z)) - 0.5, z1 = Math.max(...v.map((q) => q.z)) + 0.5;
  const nx = Math.ceil((x1 - x0) / 0.5) + 1, nz = Math.ceil((z1 - z0) / 0.5) + 1;
  const top = new Array(nx * nz).fill(0);
  pts.forEach((p) => {
    const i = Math.round((p.x - x0) / 0.5), j = Math.round((p.z - z0) / 0.5);
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
      top[jj * nx + ii] = Math.max(top[jj * nx + ii], p.y - G(p.x, p.z));
    }
  });
  WRECK = {v, c, top, x0, z0, nx, nz};
  return WRECK;
};
const inPoly = (p: XZ, H: XZ[]) => { let c = false; for (let i = 0, j = H.length - 1; i < H.length; j = i++) if ((H[i].z > p.z) !== (H[j].z > p.z) && p.x < ((H[j].x - H[i].x) * (p.z - H[i].z)) / (H[j].z - H[i].z) + H[i].x) c = !c; return c; };
const segD = (p: XZ, a: XZ, b: XZ) => {
  const dx = b.x - a.x, dz = b.z - a.z, L = dx * dx + dz * dz;
  const t = L > 0 ? clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / L) : 0;
  return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t);
};
/** distance (m) from a ground point to the wreck's footprint (negative inside) */
export const wreckDist = (p: XZ): number => {
  const W = wreckHull();
  let d = 1e9;
  for (let i = 0; i < W.v.length; i++) d = Math.min(d, segD(p, W.v[i], W.v[(i + 1) % W.v.length]));
  return inPoly(p, W.v) ? -d : d;
};
/** the wreck's height above the ground at a point (0 off it) */
export const wreckTop = (p: XZ): number => {
  const W = wreckHull();
  const i = Math.round((p.x - W.x0) / 0.5), j = Math.round((p.z - W.z0) / 0.5);
  if (i < 0 || j < 0 || i >= W.nx || j >= W.nz) return 0;
  return W.top[j * W.nx + i];
};
/** the units' wrecks on the rim and its slopes (D1, D2): ground centres, for paths that step over them */
export const UNIT_WRECKS: XZ[] = UNIT_WRECK_CAPS.flatMap((w) => w.pts);
/** does a polyline pass over a unit wreck (within r of its capsule)? */
export const overWreck = (pts: XZ[], r = 0.35): boolean => {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(2, Math.ceil(L / 0.3));
    for (let k = 0; k <= n; k++) {
      const q = {x: lerp(a.x, b.x, k / n), z: lerp(a.z, b.z, k / n)};
      for (const w of UNIT_WRECK_CAPS) for (let s = 1; s < w.pts.length; s++) if (segD(q, w.pts[s - 1], w.pts[s]) < CAP_R + r) return true;
    }
  }
  return false;
};
/** the wrecks a walk steps over, for the kit's gait.over (low obstacles: the feet lift, the pelvis rises) */
const overList = (pts: XZ[]): {x: number; z: number; r: number; h: number}[] => {
  const out: {x: number; z: number; r: number; h: number}[] = [];
  UNIT_WRECK_CAPS.forEach((w) => {
    const c = w.pts[Math.floor(w.pts.length / 2)];
    let near = false;
    for (let i = 1; i < pts.length && !near; i++) if (segD(c, pts[i - 1], pts[i]) < 1.4) near = true;
    if (near) w.pts.forEach((q) => out.push({x: q.x, z: q.z, r: 0.42, h: 0.55}));
  });
  return out;
};

// ================================================================== HEAVY 2 (tableau 7401; HEAVIES_B[2] at rest)
const H2_SRC = HEAVIES_B[2];
const LINE_F = hv(262);
const onLine = (x: number): XZ => { const s = (x - 55.5) / LINE_F.x; return {x, z: -2.76 + LINE_F.z * s}; };
const H2_PTS: XZ[] = [{x: H2_SRC.rest.x, z: H2_SRC.rest.z}, {x: 143.0, z: -15.3}, {x: 90.0, z: -15.6}, {x: 79.5, z: -14.2}, {x: 75.0, z: -9.6}, onLine(70.0), {x: 55.5, z: -2.76}, onLine(25.8)];
const H2_PATH = linePath(H2_PTS, 2.6);
const H2_DEND = pathLen(H2_PTS.slice(0, 7));
/** D4's own walking speed out of the crater (its walk-in before P4 is that line at that speed) */
const H2_VC = (() => { const a = d4Heavy2Root(M.P4 - 0.2), b = d4Heavy2Root(M.P4); return Math.hypot(b.x - a.x, b.z - a.z) / 0.2; })();
/** speed profile: from rest at H2_T0 (accelerating over A), cruise vmax, slowing to D4's speed by H2_TC */
const H2_T0 = 117.0, H2_A = 2.2, H2_TD = 138.8, H2_TC = 141.0;
const H2_VMAX = (H2_DEND - H2_VC * (M.P4 - H2_TC) - (H2_VC * (H2_TC - H2_TD)) / 2) / (H2_A / 2 + (H2_TD - H2_T0 - H2_A) + (H2_TC - H2_TD) / 2);
export const h2Dist = (T: number): number => {
  if (T <= H2_T0) return 0;
  const u1 = H2_T0 + H2_A;
  if (T < u1) return (H2_VMAX * (T - H2_T0) ** 2) / (2 * H2_A);
  const d1 = (H2_VMAX * H2_A) / 2;
  if (T < H2_TD) return d1 + H2_VMAX * (T - u1);
  const d2 = d1 + H2_VMAX * (H2_TD - u1);
  if (T < H2_TC) { const u = T - H2_TD, D = H2_TC - H2_TD; return d2 + H2_VMAX * u - ((H2_VMAX - H2_VC) * u * u) / (2 * D); }
  const d3 = d2 + ((H2_VMAX + H2_VC) / 2) * (H2_TC - H2_TD);
  return d3 + H2_VC * (T - H2_TC);
};
export const h2Speed = (T: number) => (h2Dist(T + 0.02) - h2Dist(T - 0.02)) / 0.04;
export const h2Root = (T: number): {x: number; z: number; h: number} => {
  if (T >= H2_TX) { const r = d4Heavy2Root(T); return {x: r.x, z: r.z, h: norm360(r.h)}; }
  const p = H2_PATH(h2Dist(T));
  return {x: p.pos.x, z: p.pos.z, h: norm360(p.heading)};
};
/**
 * heavy 2's keyed feet: the lateral sequence (FL, RR, FR, RL) at a cadence tied to its speed, generated back in time
 * from D4's own walk-in: each leg's last landings before P4 are D4's landings (time and foothold, heavy2Footfalls), so
 * from H2_TX (a landing instant: all four feet down) the walk simply IS D4's heavy2At. A step whose swing passes over
 * heavy 1's wreck lifts over its height there and lands clear of it.
 */
const H2_ORDER = [0, 3, 1, 2];
/** D4's landings in the last seconds before P4 and just after (its walk-in): per leg, time order */
const D4_LAND = (() => {
  const all = heavy2Footfalls(M.P4 - 2.1, M.P4 + 0.6);
  return [0, 1, 2, 3].map((leg) => all.filter((l) => l.leg === leg).sort((a, b) => a.t - b.t));
})();
/** the swing time of D4's walk (a quarter of the 3 m stride's cycle at its speed) */
const D4_SW = (0.25 * 3.0) / H2_VC;
/** the hand-over: the last D4 landing before P4 − 0.55 (at that instant all four feet are planted) */
const H2_TX = (() => {
  const ts = D4_LAND.flat().map((l) => l.t).filter((t) => t < M.P4 - 0.55).sort((a, b) => b - a);
  return ts[0] ?? M.P4 - 0.6;
})();
/** the wreck's surface under a foot (its height grid, the max of the cell and its neighbours ±0.3 m: a foot set on it never
 *  sinks into an edge), 0 off it */
const wreckSurf = (q: XZ): number => Math.max(wreckTop(q), wreckTop({x: q.x + 0.3, z: q.z}), wreckTop({x: q.x - 0.3, z: q.z}), wreckTop({x: q.x, z: q.z + 0.3}), wreckTop({x: q.x, z: q.z - 0.3}));
const wreckFlat = (q: XZ): number => {
  const s = [wreckTop(q), wreckTop({x: q.x + 0.4, z: q.z}), wreckTop({x: q.x - 0.4, z: q.z}), wreckTop({x: q.x, z: q.z + 0.4}), wreckTop({x: q.x, z: q.z - 0.4})];
  return Math.max(...s) - Math.min(...s);
};
/** where a foot stands: on the ground, or on top of heavy 1's wreck where it climbs over it */
const h2SurfY = (q: XZ): number => G(q.x, q.z) + (wreckDist(q) < 0.5 ? wreckSurf(q) + 0.02 : 0);
/** per leg, the height of each key's foothold (keys planted on the wreck stand on its top) */
const H2_Y: number[][] = [[], [], [], []];
export const H2_LEGS: KP[][] = (() => {
  // each leg's adopted D4 landings: from the first one after H2_TX − 1.2 s (so every leg has at least one before TX)
  const adopt = D4_LAND.map((L) => L.filter((l) => l.t > H2_TX - 1.3));
  const firstLift = Math.min(...adopt.map((L) => (L[0] ? L[0].t - D4_SW : M.P4)));
  // my own cycles: start times back from the first adopted lift-off
  const taus: number[] = [];
  let tau = firstLift - 0.05;
  const C0 = 1.45;
  while (tau > H2_T0 + 0.6) {
    const v = Math.max(0.6, h2Speed(tau - 0.5));
    tau -= Math.min(2.4, C0 * (H2_VC / v));
    if (tau > H2_T0 + 0.3) taus.push(tau);
  }
  taus.reverse();
  while (taus.length && taus[0] > H2_T0 + 0.4) taus.unshift(Math.max(H2_T0 + 0.05, taus[0] - 1.3));
  const r0 = h2Root(H2_T0);
  const legs: KP[][] = [0, 1, 2, 3].map((i) => [[H2_T0 - 1, ...heavyStance(r0.x, r0.z, r0.h, i)] as KP]);
  const push = (i: number, k: KP) => { legs[i].push(k); H2_Y[i].push(h2SurfY({x: k[1], z: k[2]})); };
  legs.forEach((L, i) => { H2_Y[i] = [h2SurfY({x: L[0][1], z: L[0][2]})]; });
  /** a landing never on the water main, nor on a steep edge of the wreck (moved along the walk to a flat spot) */
  const landAt = (p: XZ, dir: XZ): XZ => {
    // (off the main by ≥1.0 m: whichever way along the walk is nearer)
    let q = p;
    if (pipeAt(p).d < 1.0) {
      let f = p, b = p;
      for (let k = 0; k < 20 && pipeAt(f).d < 1.0; k++) f = {x: f.x + dir.x * 0.15, z: f.z + dir.z * 0.15};
      for (let k = 0; k < 20 && pipeAt(b).d < 1.0; k++) b = {x: b.x - dir.x * 0.15, z: b.z - dir.z * 0.15};
      q = Math.hypot(f.x - p.x, f.z - p.z) <= Math.hypot(b.x - p.x, b.z - p.z) ? f : b;
    }
    if (wreckDist(q) > 0.5) return q;
    for (const k of [0, 1, -1, 2, -2, 3, -3]) { const c = {x: q.x + dir.x * 0.3 * k, z: q.z + dir.z * 0.3 * k}; if (wreckFlat(c) < 0.6 && pipeAt(c).d >= 0.95) return c; }
    return q;
  };
  taus.forEach((t, ci) => {
    const next = ci < taus.length - 1 ? taus[ci + 1] : firstLift;
    const c = next - t, sw = c / 4;
    H2_ORDER.forEach((i, j) => {
      const t0 = t + j * sw, t1 = t0 + sw * 0.92;
      const L = legs[i];
      const prev = {x: L[L.length - 1][1], z: L[L.length - 1][2]};
      const rp = h2Root(Math.min(M.P4, t1 + c * 0.4)); const s = heavyStance(rp.x, rp.z, rp.h, i);
      const dir = {x: hv(h2Root(t1).h).x, z: hv(h2Root(t1).h).z};
      const p = landAt({x: s[0], z: s[1]}, dir);
      if (Math.hypot(p.x - prev.x, p.z - prev.z) < 0.08) { push(i, [t1, prev.x, prev.z]); return; }
      // a high step (over the main, onto / off the wreck) is a slower, deliberate swing: it lifts earlier
      const lf = swingLift(prev, p), dur = clamp(t1 - t0 + 0.11 * Math.max(0, lf - 0.55), t1 - t0, 0.8);
      push(i, [Math.max(L[L.length - 1][0] + 0.25, t1 - dur), prev.x, prev.z]);
      push(i, [t1, p.x, p.z, lf]);
    });
  });
  // each leg's last own landing is D4's own foothold before its first adopted landing (so the step into D4's walk is
  // D4's own step, not a long one from this section's stance)
  adopt.forEach((A, i) => {
    if (!A[0]) return;
    const tA = A[0].t - D4_SW, L = legs[i];
    const pr = heavy2At(tA - 0.02).feet![i]!;
    // (not where D4's own foothold is on the water main: this section's landing is kept clear of it)
    if (pipeAt(pr).d < 1.0) return;
    let j = -1;
    for (let k = 1; k < L.length; k++) if (L[k][0] <= tA && Math.hypot(L[k][1] - L[k - 1][1], L[k][2] - L[k - 1][2]) > 1e-4) j = k;
    if (j < 0) return;
    const ox = L[j][1], oz = L[j][2];
    for (let k = j; k < L.length; k++) if (Math.hypot(L[k][1] - ox, L[k][2] - oz) < 1e-6) { L[k][1] = pr.x; L[k][2] = pr.z; H2_Y[i][k] = h2SurfY(pr); }
    const a = {x: L[j - 1][1], z: L[j - 1][2]};
    L[j] = [L[j][0], pr.x, pr.z, swingLift(a, pr)];
  });
  // D4's landings (its walk-in): lift-off a swing before each, then the landing on D4's own foothold (on the wreck's
  // top where D4's foothold is under it)
  adopt.forEach((A, i) => {
    const L = legs[i];
    A.forEach((l) => {
      const prev = {x: L[L.length - 1][1], z: L[L.length - 1][2]};
      const lf = swingLift(prev, l.pos), dur = clamp(D4_SW + 0.11 * Math.max(0, lf - 0.55), D4_SW, 0.8);
      push(i, [Math.max(L[L.length - 1][0] + 0.02, l.t - dur), prev.x, prev.z]);
      push(i, [l.t, l.pos.x, l.pos.z, lf]);
    });
  });
  // a foot set down across the water main from its own hip would leave the leg spanning the main through it (its
  // shin at the beam's height): that step waits (≤ 0.8 s, never past the leg's next lift) until the hip is nearly over
  // the main. (D4's own landings are left as they are.)
  const side = (q: XZ) => (q.z - q.x + 61) / Math.SQRT2;
  const hipSide = (i: number, T: number) => { const r = h2Root(T), st = heavyStance(r.x, r.z, r.h, i); return side({x: lerp(r.x, st[0], 0.5), z: lerp(r.z, st[1], 0.5)}); };
  legs.forEach((L, i) => {
    for (let k = 2; k < L.length; k++) {
      const a = L[k - 1], b = L[k];
      if (b[0] > H2_TX - 1.3 || Math.hypot(b[1] - a[1], b[2] - a[2]) < 1e-4) continue;
      const pq = pipeAt({x: b[1], z: b[2]});
      if (pq.seg !== 0 || pq.u <= 0 || pq.u >= 1) continue;
      const fs = side({x: b[1], z: b[2]});
      const lim = Math.min(b[0] + 0.8, (L[k + 1]?.[0] ?? 1e9) - 0.3);
      let d = 0;
      while (b[0] + d < lim && fs * hipSide(i, b[0] + d) < 0 && Math.abs(hipSide(i, b[0] + d)) > 0.8) d += 1 / 60;
      if (d > 0) { L[k] = [b[0] + d, b[1], b[2], ...(b.length > 3 ? [b[3]] : [])] as KP; L[k - 1] = [a[0] + d, a[1], a[2], ...(a.length > 3 ? [a[3]] : [])] as KP; }
    }
  });
  return legs;
})();
/** the lift a swing from a to b needs: its foot (from one foothold's height to the other's) stays ≥0.45 m over the
 *  wreck's top (and the water main's) under its path; else the walk's own */
function swingLift(a: XZ, b: XZ): number {
  const ya = h2SurfY(a), yb = h2SurfY(b);
  const under = pipeAt(a).d < 0.9 || pipeAt(b).d < 0.9;
  let need = 0;
  for (let k = 1; k < 12; k++) {
    const u = k / 12, q = {x: lerp(a.x, b.x, u), z: lerp(a.z, b.z, u)};
    const base = lerp(ya, yb, smooth(u)), arc = H2_ARC(u);
    let top = -1e9;
    if (wreckDist(q) < 0.6) top = G(q.x, q.z) + wreckSurf(q) + 0.45;
    // (the main: stepped over — unless a foothold is under its span, D4's own: then the foot swings in under it)
    const pq = pipeAt(q);
    if (pq.d < 0.9 && pq.u > 0 && pq.u < 1 && !under) top = Math.max(top, pq.q.y + 0.45 + 0.45);
    if (top > base) need = Math.max(need, (top - base) / Math.max(0.4, arc));
  }
  return clamp(need, 0.55, 3.0);
}
/** heavy 2's swing arc (0 → 1 → 0): fuller than a sine, so a high step is up early and stays up over the obstacle */
function H2_ARC(u: number): number { return Math.pow(Math.sin(Math.PI * clamp(u)), 0.6); }
/** a heavy-2 foot at T: planted on its foothold (ground or the wreck's top), or swinging (an arc over the line from one
 *  foothold's height to the next) */
const h2FootAt = (leg: number, T: number): V3 => {
  const k = H2_LEGS[leg], Y = H2_Y[leg];
  if (T <= k[0][0]) return {x: k[0][1], y: Y[0], z: k[0][2]};
  for (let i = 1; i < k.length; i++) if (T <= k[i][0]) {
    const a = k[i - 1], b = k[i];
    if (Math.hypot(b[1] - a[1], b[2] - a[2]) < 1e-4) return {x: a[1], y: Y[i - 1], z: a[2]};
    const u = clamp((T - a[0]) / Math.max(1e-6, b[0] - a[0])), e = smooth(u);
    const lift = b.length > 3 ? (b[3] as number) : 0.55;
    return {x: lerp(a[1], b[1], e), y: lerp(Y[i - 1], Y[i], e) + H2_ARC(u) * lift, z: lerp(a[2], b[2], e)};
  }
  const l = k.length - 1;
  return {x: k[l][1], y: Y[l], z: k[l][2]};
};
/** per leg, when D4's own walk takes it over: H2_TX, or (a leg D4 has standing inside the wreck there) its next D4
 *  landing — until then it is this section's own foot, on the wreck's top */
const H2_HAND: number[] = [0, 1, 2, 3].map((leg) => {
  const d4 = heavy2At(H2_TX).feet![leg]!, mine = h2FootAt(leg, H2_TX);
  if (Math.hypot(d4.x - mine.x, d4.y - mine.y, d4.z - mine.z) < 0.02) return H2_TX;
  const nxt = D4_LAND[leg].find((l) => l.t > H2_TX + 1e-3);
  return nxt ? nxt.t : M.P4;
});
/** every step heavy 2 takes: [leg, lift time, landing time, landing point, over the wreck?] (for FX, sound) */
export const H2_FALLS = (() => {
  const out: {leg: number; t0: number; t: number; pos: V3; over: boolean}[] = [];
  H2_LEGS.forEach((k, leg) => k.forEach((kk, j) => {
    if (j === 0) return;
    const prev = k[j - 1];
    if (Math.hypot(kk[1] - prev[1], kk[2] - prev[2]) < 0.05) return;
    out.push({leg, t0: prev[0], t: kk[0], pos: {x: kk[1], y: H2_Y[leg][j], z: kk[2]}, over: (kk[3] ?? 0) > 1});
  }));
  return out.sort((a, b) => a.t - b.t);
})();
const h2Plants = (T: number) => [0, 1, 2, 3].map((leg) => { let t: number | undefined; for (const f of H2_FALLS) { if (f.t > T) break; if (f.leg === leg) t = f.t; } return t; });
const h2PlantsAt = (T: number) => { const own = h2Plants(T); const d4 = T >= H2_TX ? heavy2At(T).plants : undefined; return own.map((p, leg) => (d4 && T >= H2_HAND[leg] ? d4[leg] : p)); };
/** the ground under heavy 2's hull, averaged over its footprint (a kerb or a cross street's edge is no jolt; its feet
 *  are keyed on the real ground). Equal to G on the crater floor where D4 takes it over. */
const H2_GROUND = (x: number, z: number): number => {
  if (x < 66) return G(x, z);
  const k = clamp((x - 66) / 2);
  let sum = 0, wsum = 0;
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { const w = (5 - Math.abs(i)) * (5 - Math.abs(j)); sum += w * G(x + i * 0.55, z + j * 0.55); wsum += w; }
  return lerp(G(x, z), sum / wsum, k);
};
/**
 * heavy 2's hull lowered where a planted foot stands lower than its hip can reach (the avenue's kerb, the crater's
 * bowl): the reach need of its own solved hips (as D4 measures it), a moving max ±0.3 s then a mean ±0.25 s, limited so
 * the belly clears the wreck, and from 149.2 blended into D4's own drop (exact at P4).
 */
const H2_MAXL = (HEAVY_DIM.upperLen + HEAVY_DIM.lowerLen) * 0.985;
const H2_DT = 1 / 30;
const H2_DROP: number[] = (() => {
  const n = Math.ceil((M.P4 - H2_T0) / H2_DT) + 1;
  const raw = Array.from({length: n}, (_, j) => {
    const T = H2_T0 + j * H2_DT;
    const sp = heavy2Bare(T);
    const R0 = solveHeavy(sp);
    let need = 0;
    R0.hip.forEach((H, i) => {
      const f = sp.feet![i]!;
      const A = {x: f.x, y: f.y + 0.22, z: f.z};
      const h = Math.min(H2_MAXL * 0.999, Math.hypot(H.x - A.x, H.z - A.z)), v = H.y - A.y;
      if (h * h + v * v > H2_MAXL * H2_MAXL) need = Math.max(need, v - Math.sqrt(H2_MAXL * H2_MAXL - h * h));
    });
    // the belly (0.81 m under the hull's centre, ±2.3 m long, ±1.45 m wide) clears the wreck under it by 0.1 m: over its
    // top the hull is carried high (as far as the legs on the ground still reach: −0.5 m)
    const r = h2Root(T), f = hv(r.h), rt = {x: -f.z, z: f.x};
    let top = 0;
    for (let a = -2.3; a <= 2.31; a += 0.46) for (let c = -1.45; c <= 1.46; c += 0.36) top = Math.max(top, wreckTop({x: r.x + f.x * a + rt.x * c, z: r.z + f.z * a + rt.z * c}));
    const lim = top > 0 ? HEAVY_DIM.hullY - 0.81 - (top + 0.1) : 1.6;
    return clamp(Math.min(need, lim, 1.6), -0.5, 1.6);
  });
  // the lowering (reach) and the raising (over the wreck) each taken early and eased: a moving max (min) ±0.3 s, then a
  // moving mean ±0.25 s, never less than the frame's own need
  const W = Math.round(0.3 / H2_DT), A = Math.round(0.25 / H2_DT);
  const ease = (v: number[], pick: (a: number, b: number) => number, keep: (a: number, b: number) => number) => {
    const mx = v.map((_, j) => { let m = 0; for (let k = Math.max(0, j - W); k <= Math.min(n - 1, j + W); k++) m = pick(m, v[k]); return m; });
    return mx.map((_, j) => { let s = 0, c = 0; for (let k = Math.max(0, j - A); k <= Math.min(n - 1, j + A); k++) { s += mx[k]; c++; } return keep(v[j], s / c); });
  };
  const lo = ease(raw.map((x) => Math.max(0, x)), Math.max, Math.max), hi = ease(raw.map((x) => Math.min(0, x)), Math.min, Math.min);
  return lo.map((x, j) => x + hi[j]);
})();
const h2Drop = (T: number): number => {
  const u = (T - H2_T0) / H2_DT, j = Math.floor(u);
  const mine = j < 0 ? 0 : j >= H2_DROP.length - 1 ? H2_DROP[H2_DROP.length - 1] : lerp(H2_DROP[j], H2_DROP[j + 1], u - j);
  if (T < 149.2) return mine;
  return lerp(mine, heavy2At(Math.min(T, M.P4)).drop ?? 0, smooth((T - 149.2) / (M.P4 - 149.2)));
};
/** the round's aim and where it bursts: the crest where the decoy maker knelt */
export const BLAST_AT: V3 = on(BLAST_XZ, 0.25);
function heavy2Bare(T: number): HeavySpec {
  const r = h2Root(T);
  const d4 = T >= H2_TX ? heavy2At(T).feet! : null;
  const feet = [0, 1, 2, 3].map((leg) => (d4 && T >= H2_HAND[leg] ? d4[leg]! : h2FootAt(leg, T)));
  return {id: 7401, t: T, pos: {x: r.x, y: 0, z: r.z}, heading: r.h, ground: H2_GROUND, key: 'tb_heavy2', feet};
}
export const heavy2D3 = (T: number): HeavySpec => {
  const b = heavy2Bare(T);
  // looks: the street ahead; the Crew on the rim (from 128.6, amber); the decoy maker on the crest (it was told where
  // the projector is); after the round the Director (D4's own look)
  const look: V3 = T < 128.6 ? {x: b.pos.x - 20, y: 2, z: b.pos.z + 2} : T > 147.0 ? dirHeadAt(T) : T > 143.2 ? on(DEC_SPOT, 1.0) : on({x: 46.5, z: -0.6}, 1.5);
  return {
    ...b, look, eye: T < 128.6 ? 'cyan' : 'amber', drop: h2Drop(T), plants: h2PlantsAt(T),
    // the ram carried up as it climbs over the wreck and the water main (it rested on the wreck, then in the main);
    // lowered again during the gauge insert (D4's own rest pose long before P4)
    ramCarry: smooth((T - 142.45) / 0.5) * (1 - smooth((T - 146.35) / 0.6)),
    aim: T > 143.7 && T < EV3.fire ? BLAST_AT : undefined,
    // (after the shot the pod holds on the crest; from the cut into D3-11e — heavy 2 out of frame — it is D4's own: at
    // rest, no fire)
    ...(T < SH3.d311e ? {fire: {t0: EV3.fire, target: BLAST_AT}} : {}),
  };
};
/** heavy 2's footfalls in (Ta, Tb] */
export const heavy2Falls = (Ta: number, Tb: number) => H2_FALLS.filter((f) => f.t > Ta && f.t <= Tb);
export const H2_INFO = {vmax: H2_VMAX, dEnd: H2_DEND, vc: H2_VC, tx: H2_TX, hand: H2_HAND};

// ================================================================== UNIT PLANS (the escorts and the arc)
type UStep =
  | {k: 'walk'; pts: XZ[]; T0: number; T1: number; A?: number; D?: number; stride?: number; lift?: number}
  | {k: 'keys'; root: KR[]; feet?: {L: KP[]; R: KP[]}; d4?: number}
  /** standing where the step before left it; the kit's own locomotion (turns, moves, press, lunges, falls) from the
   *  act's entries that start in this step */
  | {k: 'kit'; T0: number; at?: {x: number; z: number; h: number}};
type UPlan = {id: number; key: string; steps: UStep[]; act?: (T: number) => Partial<UnitSpec>};
const stepT0 = (s: UStep) => (s.k === 'walk' || s.k === 'kit' ? s.T0 : s.root[0][0]);
const FEET = new WeakMap<object, {L: KP[]; R: KP[]}>();
/** a path whose heading blends from h0 (start) and into h1 (end) over `span` m (positions unchanged) */
const turnPath = (path: Path, L: number, h0?: number, h1?: number, span = 1.0): Path => {
  if (h0 === undefined && h1 === undefined) return path;
  const near = (D: number, ref: number) => (Math.abs(D - ref) > 180 ? D + (D < ref ? 360 : -360) : D);
  const ref0 = h0 !== undefined ? wrapD(path(Math.min(span, L)).heading - h0) : 0;
  const ref1 = h1 !== undefined ? wrapD(h1 - path(Math.max(0, L - span)).heading) : 0;
  return (d) => {
    const p = path(d);
    let h = p.heading;
    if (h0 !== undefined) h = h0 + near(wrapD(h - h0), ref0) * smooth(clamp(d / span));
    if (h1 !== undefined) h = h + near(wrapD(h1 - h), ref1) * smooth(clamp((d - (L - span)) / span));
    return {pos: p.pos, heading: h};
  };
};
const LOCO_KEYS = ['turns', 'moves', 'press', 'brace', 'shove'] as const;
const arr = <X,>(x: X | X[] | undefined): X[] => (x === undefined ? [] : Array.isArray(x) ? x : [x]);
/** the act's fields for a kit step starting at t0: locomotion generators that started before it are dropped */
const kitOnly = (a: Partial<UnitSpec>, t0: number): Partial<UnitSpec> => {
  const o: Partial<UnitSpec> & Record<string, unknown> = {...a};
  const lead: Record<string, number> = {brace: 0.55, shove: 0.22};
  for (const k of LOCO_KEYS) (o as Record<string, unknown>)[k] = (arr((a as Record<string, never>)[k]) as {t0: number}[]).filter((q) => q.t0 - (lead[k] ?? 0) >= t0 - 1e-6);
  o.dodge = arr(a.dodge).filter((d) => (d.kind ?? 'lean') !== 'step' || d.t0 - 0.3 >= t0);
  const sl = [...(a.strike ? [a.strike] : []), ...(a.strikes ?? [])];
  o.strike = undefined;
  o.strikes = sl.map((s) => (s.step && s.t0 - 0.4 < t0 ? {...s, step: undefined} : s));
  o.attend = a.attend?.map((x) => (x.t0 + 0.12 < t0 ? {...x, turn: false} : x));
  if (a.fall && a.fall.t0 < t0 - 1e-6) o.fall = undefined;
  return o;
};
/** the same act inside a walk or a keyed step: no planted-step generators (the gait / the keys move the feet) */
const walkOnly = (a: Partial<UnitSpec>): Partial<UnitSpec> => {
  const o: Partial<UnitSpec> & Record<string, unknown> = {...a};
  for (const k of LOCO_KEYS) (o as Record<string, unknown>)[k] = undefined;
  const sl = [...(a.strike ? [a.strike] : []), ...(a.strikes ?? [])];
  o.strike = undefined;
  o.strikes = sl.map((s) => ({...s, step: undefined}));
  o.attend = a.attend?.map((x) => ({...x, turn: false}));
  o.dodge = arr(a.dodge).filter((d) => (d.kind ?? 'lean') !== 'step');
  o.fall = undefined;
  return o;
};
/** the kit's own pelvis rise over the wrecks a walk steps over (unit.tsx: gait.over), for a unit standing near one */
const OVER_ALL = UNIT_WRECK_CAPS.flatMap((w) => w.pts.map((q) => ({x: q.x, z: q.z, r: 0.42, h: 0.55})));
const overLiftAt = (p: XZ): number => {
  let l = 0;
  for (const o of OVER_ALL) { const d = Math.hypot(p.x - o.x, p.z - o.z); if (d < o.r * 1.5 + 0.4) l = Math.max(l, o.h * 0.4 * (1 - smooth((d - o.r * 0.5) / (o.r + 0.4)))); }
  return l;
};
const ROOT_CACHE = new Map<string, {x: number; z: number; h: number}>();
/** where step i of a plan leaves the unit (root, heading) — the next step starts there */
const stepEnd = (pl: UPlan, i: number): {x: number; z: number; h: number} => {
  const key = `${pl.key}:${i}`;
  const c = ROOT_CACHE.get(key);
  if (c) return c;
  const s = pl.steps[i], next = pl.steps[i + 1];
  let r: {x: number; z: number; h: number};
  if (s.k === 'walk') { const L = pathLen(s.pts), e = linePath(s.pts, 1.2)(L); r = {x: e.pos.x, z: e.pos.z, h: e.heading}; }
  else if (s.k === 'keys') { const k = s.root[s.root.length - 1]; r = {x: k[1], z: k[2], h: k[3]}; }
  else { const T = next ? stepT0(next) - 0.001 : M.P4; const q = unitRoot(unitRun(pl, T)); r = {x: q.pos.x, z: q.pos.z, h: q.heading}; }
  ROOT_CACHE.set(key, r);
  return r;
};
/** a kit step's base root: where the step before it ends */
const kitBase = (pl: UPlan, i: number) => { const s = pl.steps[i]; return s.k === 'kit' && s.at ? s.at : i === 0 ? {x: 0, z: 0, h: 0} : stepEnd(pl, i - 1); };
const unitRun = (pl: UPlan, T: number): UnitSpec => {
  let i = 0;
  pl.steps.forEach((s, k) => { if (T >= stepT0(s)) i = k; });
  const s = pl.steps[i];
  const base: UnitSpec = {id: pl.id, t: T, pos: {x: 0, y: 0, z: 0}, heading: 0, ground, idle: 0.45, eye: 'cyan', key: pl.key};
  const act = pl.act ? pl.act(T) : {};
  let sp: UnitSpec;
  if (s.k === 'walk') {
    const L = pathLen(s.pts), A = s.A ?? 0.5, D = s.D ?? 0.5;
    // the facing before and after the walk: a held unit turns as it steps off (over its first metre) and turns to the
    // next hold's facing over its last metre — never an instant spin at the hand-over
    const prev = pl.steps[i - 1], next = pl.steps[i + 1];
    const h0 = prev ? (prev.k === 'keys' ? keyRoot(prev.root, s.T0).h : prev.k === 'kit' ? stepEnd(pl, i - 1).h : undefined) : undefined;
    const h1 = next && next.k === 'keys' ? next.root[0][3] : undefined;
    const path: Path = turnPath(linePath(s.pts, 1.2), L, h0, h1);
    const dist = runDist(Math.min(T, s.T1), s.T0, s.T1, L, A, D);
    const vc = cruise(s.T0, s.T1, L, A, D);
    const k = clamp(runSpeed(T, s.T0, s.T1, L, A, D) / Math.max(0.5, vc));
    const fast = clamp((vc - 1.8) / 2);
    const end = path(L);
    const over = overList(s.pts);
    sp = {
      ...base, pos: end.pos, heading: end.heading,
      gait: {path, dist, stride: s.stride ?? 1.45 + 0.85 * fast, lift: s.lift ?? 0.14 + 0.08 * fast, start: A > 0.25 ? 0 : undefined, end: D > 0 ? L : undefined, over: over.length ? over : undefined, overSoft: over.length ? true : undefined},
      crouch: (0.03 + 0.16 * fast) * k, lean: (3 + 12 * fast) * k,
    };
    sp = {...sp, ...walkOnly(act), crouch: sp.crouch, lean: sp.lean};
    // the walk straight into D4's start: the pelvis onto D4's own height at its first stride over the last 0.35 s
    if (s.T1 >= M.P4 - 1e-6 && T > M.P4 - 0.35) {
      const a4 = unitAttach(d4UnitAt(d4PlanOf(pl.id), T)), w = smooth(clamp((T - (M.P4 - 0.35)) / 0.35));
      sp.crouch = (sp.crouch ?? 0) + (unitAttach(sp).pelvis.y - a4.pelvis.y) * w;
    }
  } else if (s.k === 'keys') {
    const r = keyRoot(s.root, T);
    let feet = s.feet ?? FEET.get(s);
    if (!feet) FEET.set(s, (feet = autoSteps(s.root, {half: 0.19, stag: -0.04, stepLen: 0.55})));
    sp = {...base, pos: {x: r.p.x, y: 0, z: r.p.z}, heading: r.h, feet: {L: footAt(feet.L, T, 0.11, true), R: footAt(feet.R, T, 0.11, true)}};
    sp = {...sp, ...walkOnly(act)};
    // (standing by a wreck: the pelvis kept as high as the walk's own step-over left it — no drop at the stop)
    const ol = overLiftAt(r.p);
    if (ol > 1e-4) sp.crouch = (sp.crouch ?? 0) - ol;
    // into D4's start: over the last 0.35 s the feet go onto D4's own (its walk may begin with a foot in the air) and
    // the pelvis onto its walk's own height (the bob at its first stride)
    if (s.d4 !== undefined && T > M.P4 - 0.35) {
      const a4 = unitAttach(d4UnitAt(d4PlanOf(s.d4), T)), w = smooth(clamp((T - (M.P4 - 0.35)) / 0.35));
      const to = (p: V3): V3 => ({x: p.x, y: p.y - U_ANKLE, z: p.z});
      sp.feet = {L: lerp3s(sp.feet!.L!, to(a4.footL), w), R: lerp3s(sp.feet!.R!, to(a4.footR), w)};
      const dy = unitAttach(sp).pelvis.y - a4.pelvis.y;
      sp.crouch = (sp.crouch ?? 0) + dy * w;
    }
  } else {
    const at = kitBase(pl, i);
    sp = {...base, pos: {x: at.x, y: 0, z: at.z}, heading: at.h, ...kitOnly(act, s.T0)};
    // the walk's carriage eases out into the stance
    const prev = pl.steps[i - 1];
    if (prev && prev.k === 'walk') sp.lean = (sp.lean ?? 0) + 4 * (1 - smooth(clamp((T - s.T0) / 0.35)));
  }
  return sp;
};

/** D4's plan for a tableau id, and its state at 149.86 (where the walk begins: position, heading) */
const d4PlanOf = (id: number) => Object.values(D4_NAMED).find((p) => p.id === id) ?? RING_PLANS.find((p) => p.id === id)!;
const d4Start = (id: number): {x: number; z: number; h: number} => {
  const s = d4UnitAt(d4PlanOf(id), M.P4);
  const p = s.gait ? s.gait.path(s.gait.dist) : {pos: s.pos, heading: s.heading};
  return {x: p.pos.x, z: p.pos.z, h: norm360(p.heading)};
};

// ---- the people's places the machines aim at (pure marks; marks.ts)
/** a strike target pulled back along the blow, so the kit's follow-through ends at a blocking surface, not in it */
const short = (from: V3, at: V3, d = 0.1): V3 => sub3(at, mul3(norm3(sub3(at, from)), d));
/** the Crew's middle on the rim (the units' look), and the source once she projects */
export const CREW_C: V3 = on({x: 45.4, z: -1.6}, 1.3);
const DECOY_SRC: V3 = on({x: DEC_SPOT.x, z: DEC_SPOT.z}, 1.2);
/** the knee team coming down the south-west slope (U8 reads it from 120.5) */
const TEAM_PT = (t: number): V3 => lerp3s(on({x: 51.3, z: -6.35}, 1.5), on(DIR_MEET, 1.5), smooth((t - 119.45) / 2.6));
/** the beam's top edge by the crossing, where R4's hammer comes down (the breaker has just ducked under it) */
export const PIPE_HIT: V3 = (() => { const q = pipeAt({x: UNDER.mid.x + 0.707 * 0.35, z: UNDER.mid.z + 0.707 * 0.35}).q; return {x: q.x + 0.707 * 0.3, y: q.y + 0.45, z: q.z - 0.707 * 0.3}; })();
/** where the tether's cable runs (post 3 → the clamp on the shin) at fraction u from the post */
const cableAt = (u: number, T: number): V3 => lerp3s(ANCHOR, h1ClampPt(T), u);
/** R3's grip on the cable: 1.5 m from the clamp toward the post */
const R3_GRIP = (T: number): V3 => { const c = h1ClampPt(Math.max(T, EV3.taut)); const d = norm3(sub3(ANCHOR, c)); return add3(c, mul3(d, 1.5)); };

// ---- sources: D2's survivors and the vanguard's front ranks
type Src = {name: string; srcId: number; x: number; z: number; h: number; d2?: string};
const SURV = ['R1', 'R3', 'R4', 'R5', 'R6', 'R7', 'U8'];
const surv: Record<string, Src> = Object.fromEntries(SURV.map((n) => {
  const s = unitD2(n, M.P3);
  const r = unitRoot(s);
  return [n, {name: n, srcId: s.id, x: r.pos.x, z: r.pos.z, h: norm360(r.heading), d2: n}];
}));
/** the vanguard units D3 takes (the front ranks nearest the avenue's middle, none D1/D2 already took): 6 north, 12 south */
const VAN_TAKE = (() => {
  const v = armyUnits().filter((u) => u.g === 'van' && u.rest.x < 93 && !D1_ARMY_IDS.has(u.id) && Math.abs(u.rest.z) < 13.4);
  const src = (u: (typeof v)[number]): Src => ({name: `V${u.id}`, srcId: u.id, x: u.rest.x, z: u.rest.z, h: norm360(u.heading)});
  const north = v.filter((u) => u.rest.z < -3).sort((a, b) => a.rest.x - b.rest.x || a.rest.z - b.rest.z).slice(0, 6).map(src);
  const south = v.filter((u) => u.rest.z > 0.5).sort((a, b) => a.rest.x - b.rest.x || b.rest.z - a.rest.z).slice(0, 12).map(src);
  return {north, south};
})();
/** the vanguard ids D3 takes (leave them out when drawing B's halted army) */
export const VAN_TAKEN = new Set([...VAN_TAKE.north, ...VAN_TAKE.south].map((s) => s.srcId));

// ---- the barrier and the arc (geometry)
const W_C = (): XZ => wreckHull().c;
/** behind the wreck (east of its raised right legs) */
const LINE_NORTH: XZ[] = [{x: 67.9, z: -8.4}, {x: 68.3, z: -6.3}, {x: 68.0, z: -4.2}];
/** along the water main's north-east side from the wreck's tail toward its break (two ranks) */
const LINE_MID: XZ[] = (() => {
  const out: XZ[] = [];
  const n = {x: 0.707, z: -0.707};
  [63.9, 64.9, 65.9, 66.9].forEach((x, i) => {
    const q = pipeAt({x, z: x - 61}).q;
    out.push({x: q.x + n.x * 1.65, z: q.z + n.z * 1.65});
    out.push({x: q.x + n.x * 2.95 + 0.4, z: q.z + n.z * 2.95 + 0.4 * (i % 2 ? 1 : -1) * 0});
  });
  return out;
})();
/** south of the break (the crater's south): the D2 survivors who fell back there and the vanguard who came through */
const LINE_SOUTH: XZ[] = [
  {x: 63.8, z: 9.2}, {x: 65.1, z: 10.0}, {x: 66.3, z: 10.6}, {x: 62.6, z: 8.4}, {x: 64.4, z: 11.4},
  {x: 63.0, z: 10.6}, {x: 61.6, z: 9.4}, {x: 65.6, z: 12.2}, {x: 62.0, z: 11.8}, {x: 60.6, z: 10.6},
];
/** the wing's hold under the girder, north of the cable (the truss is high enough over them there) */
const WING: XZ[] = [{x: 52.4, z: -11.2}, {x: 53.6, z: -10.6}, {x: 54.7, z: -11.7}, {x: 55.8, z: -10.3}, {x: 56.9, z: -11.4}, {x: 58.0, z: -10.0}, {x: 59.1, z: -11.0}];
/** the arc round the Crew on the rim (pivot, radii) at FORMATION and after the advance */
export const ARC1_C = {x: 45.6, z: 0.8};
const arcPt = (b: number, r: number) => { const a = (b * Math.PI) / 180; return {x: ARC1_C.x + Math.sin(a) * r, z: ARC1_C.z - Math.cos(a) * r, h: norm360(b + 180)}; };
const okSlot = (p: XZ) => clearAt(p, {stepH: 0.2}).d > 0.75 && !neOfPipe(p) && pipeAt(p).d > 1.6;
/** n arc slots from bearing lo to hi, alternating two radii, each kept clear of the set and the wrecks */
const arcSlots = (n: number, lo: number, hi: number, r0: number, r1: number) => Array.from({length: n}, (_, k) => {
  const b0 = lo + ((hi - lo) * k) / (n - 1), r = k % 2 ? r1 : r0;
  for (let d = 0; d < 12; d += 0.5) for (const sg of [1, -1]) { const p = arcPt(b0 + sg * d, r); if (okSlot(p)) return p; }
  return arcPt(b0, r);
});
const ARC1 = arcSlots(18, 74, 164, 9.9, 11.1);
const ARC2 = arcSlots(18, 74, 164, 7.9, 9.0).map((p) => { let q: XZ = pushFrom(p, BLAST_XZ, 4.6); q = pushFrom(q, {x: 45.0, z: -1.0}, 6.2); return {...q, h: norm360(headingTo(q, CREW_C))}; });
/** a standing place moved off D1/D2's downed units (both feet clear of their capsules) */
function offWrecks(p: XZ, clear = 0.72): XZ {
  let q = p;
  for (let it = 0; it < 6; it++) for (const w of UNIT_WRECK_CAPS) for (let k = 1; k < w.pts.length; k++) {
    const a = w.pts[k - 1], b = w.pts[k], ab = {x: b.x - a.x, z: b.z - a.z}, L2 = ab.x * ab.x + ab.z * ab.z || 1e-6;
    const u = clamp(((q.x - a.x) * ab.x + (q.z - a.z) * ab.z) / L2), c = {x: a.x + ab.x * u, z: a.z + ab.z * u};
    q = pushFrom(q, c, clear);
  }
  return q;
}
function pushFrom(p: XZ, o: XZ, r: number): XZ { const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz) || 1e-3; return d < r ? {x: o.x + (dx / d) * r, z: o.z + (dz / d) * r} : p; }
/** through the water main's break, north-east → south-west */
const GATE_NE: XZ = {x: 69.1, z: 6.1}, GATE_SW: XZ = {x: 66.9, z: 8.4};
/** round the wreck's nose (north of the ram lying out from it) */
const NOSE: XZ[] = [{x: 66.6, z: -11.6}, {x: 62.4, z: -12.7}];

export type ArcUnit = {id: number; role: string; src: Src; group: 'north' | 'south'; k: number; line: XZ; a1: {x: number; z: number; h: number}; a2: {x: number; z: number; h: number}; fin: {x: number; z: number; h: number}; plan: UPlan};

/** D4's feet at 149.86 (ground x, z) for a tableau id: its walk may begin mid-stride (A ≤ 0.25) */
const d4Feet = (id: number) => { const a = unitAttach(d4UnitAt(d4PlanOf(id), M.P4)); return {L: {x: a.footL.x, z: a.footL.z}, R: {x: a.footR.x, z: a.footR.z}}; };
const stanceAt = (p: XZ, h: number, side: -1 | 1): XZ => { const f = hv(h), r = {x: -f.z, z: f.x}; const fo = side < 0 ? -0.04 : 0.04; return {x: p.x + r.x * 0.19 * side + f.x * fo, z: p.z + r.z * 0.19 * side + f.z * fo}; };
const D4_BOB = 0.0875;
const INTO_T = M.P4 - 0.62;
/** the walk into D4's start: if D4 begins mid-stride the walk stops 0.55 m short and two keyed steps put the feet on
 *  D4's first footholds at 149.86, else straight in */
function intoD4(steps: UStep[], id: number, pts: XZ[], T0: number, fin: {x: number; z: number; h: number}) {
  const F = d4Feet(id), sL = stanceAt(fin, fin.h, -1), sR = stanceAt(fin, fin.h, 1);
  const mid = Math.hypot(F.L.x - sL.x, F.L.z - sL.z) > 0.05 || Math.hypot(F.R.x - sR.x, F.R.z - sR.z) > 0.05;
  if (!mid) { steps.push({k: 'walk', pts, T0, T1: M.P4, A: 0.45, D: 0.55}); return; }
  const f = hv(fin.h), p2 = {x: fin.x - f.x * 0.55, z: fin.z - f.z * 0.55};
  steps.push({k: 'walk', pts: [...pts.slice(0, -1), p2], T0, T1: INTO_T, A: 0.45, D: 0.5});
  const L0 = stanceAt(p2, fin.h, -1), R0 = stanceAt(p2, fin.h, 1);
  steps.push({k: 'keys', d4: id, root: [[INTO_T, p2.x, p2.z, fin.h], [M.P4, fin.x, fin.z, fin.h]], feet: {
    R: [[INTO_T, R0.x, R0.z], [INTO_T + 0.04, R0.x, R0.z], [M.P4 - 0.33, F.R.x, F.R.z, 0.12]],
    L: [[INTO_T, L0.x, L0.z], [M.P4 - 0.32, L0.x, L0.z], [M.P4 - 0.03, F.L.x, F.L.z, 0.13]],
  }});
}
/** a keyed hold [t0 → t1] at p turning to h */
const hold = (p: XZ, t0: number, h0: number, h1: number, t1: number, turnDur = 0.6): UStep => ({k: 'keys', root: [[t0, p.x, p.z, h0], [Math.min(t1, t0 + turnDur), p.x, p.z, h1], [t1, p.x, p.z, h1]]});

// ---- the escorts' own acts (their early steps are written in buildPlan)
const U8_STEP_TO: XZ = {x: 55.35, z: -0.95};
const actU8 = (T: number): Partial<UnitSpec> => ({
  posture: [[M.P3, 'ready'], [119.5, 'guard'], [EV3.e1Fall + 1.2, 'ready'], [128.6, 'guard']],
  attend: [{t0: M.P3, turn: false, at: (t: number) => {
    // the heavy; the flash; the team coming down the slope; the Director's plate; the crossing (the breaker's back)
    let p = on({x: 63.5, z: -5.5}, 3.5);
    const ks: [number, (t: number) => V3, number][] = [[119.4, () => on({x: 62.6, z: -5.2}, 4.6), 0.15], [120.5, TEAM_PT, 0.3], [122.5, dirPlate, 0.25], [EV3.e1Turn - 0.1, () => on(UNDER.sw, 1.2), 0.15],
      [EV3.e1Fall + 0.3, () => on({x: 58.0, z: 1.5}, 0.4), 0.3], [EV3.e1Up, () => CREW_C, 0.5]];
    for (const [t0, f, b] of ks) if (t > t0) p = lerp3s(p, f(t), smooth((t - t0) / b));
    return p;
  }}],
  turns: [{t0: 120.55, to: on(DIR_MEET), dur: 0.5}, {t0: EV3.e1Turn, to: on(UNDER.sw), dur: 0.3}],
  strikes: [{t0: EV3.e1Ham, side: 'R', kind: 'hammer', target: short(add3(dirPlate(EV3.e1Ham), {x: 0, y: 0.8, z: 0}), dirPlate(EV3.e1Ham), 0.05), step: 0.2}],
  press: {t0: EV3.press0, t1: EV3.press1, target: (t) => dirPlate(t), reach: 1.02, beat: 0.27},
  moves: [{t0: EV3.e1Step, t1: EV3.e1Step + 0.42, to: on(U8_STEP_TO), guard: true}, {t0: EV3.e1Up + 0.6, t1: EV3.e1Up + 1.8, to: on({x: 55.2, z: 3.2}), face: CREW_C, guard: true}],
  // the Director's plate in its back as it turns away (it stumbles toward the crossing); the runner's adze round its
  // ankle: it goes down on its face (and gets up after the crash: machines do)
  hits: [{t0: EV3.bash, dir: norm3({x: 0.9, y: 0, z: 0.36}), strength: 1.05}],
  fall: {t0: EV3.e1Fall, dir: norm3({x: 0.5, y: 0, z: 0.86}), getUp: EV3.e1Up},
  eye: 'amber', idle: 0.42,
});
const actR3 = (T: number): Partial<UnitSpec> => ({
  posture: [[M.P3, 'ready'], [119.5, 'guard'], [EV3.r3Grab - 0.3, 'idle'], [EV3.r3Let + 0.1, 'guard'], [127.5, 'ready']],
  attend: [{t0: M.P3, turn: false, at: (t: number) => {
    let p = on({x: 63.5, z: -5.5}, 3.5);
    const ks: [number, (t: number) => V3, number][] = [[119.4, () => on({x: 62.6, z: -5.2}, 4.6), 0.15], [119.9, () => on({x: 50.5, z: -7.5}, 1.5), 0.4],
      [EV3.tBite, (q) => h1ClampPt(q), 0.12], [EV3.r3Grab - 0.2, R3_GRIP, 0.2], [EV3.r3Let, () => W_C() ? on(W_C(), 2.5) : CREW_C, 0.3], [127.6, () => CREW_C, 0.6]];
    for (const [t0, f, b] of ks) if (t > t0) p = lerp3s(p, f(t), smooth((t - t0) / b));
    return p;
  }}],
  turns: [{t0: EV3.tBite + 0.05, to: R3_GRIP(EV3.r3Grab), dur: 0.3}],
  catch: {t0: EV3.r3Grab, side: 'both', at: (t) => R3_GRIP(t), hold: (t) => R3_GRIP(t), t1: EV3.r3Let,
    wrench: {t0: EV3.r3Haul, dir: norm3(sub3(h1ClampPt(EV3.taut), ANCHOR)), dist: 0.35, deg: 10}},
  moves: [{t0: EV3.r3Let + 0.05, t1: EV3.r3Let + 0.85, to: on({x: 59.3, z: -11.3}), face: on(H1_AT, 2), guard: true}],
  hits: [{t0: EV3.land + 0.05, dir: norm3({x: -0.3, y: 0, z: -0.9}), strength: 0.35}],
  lean: 12 * win(T, EV3.r3Haul, EV3.r3Let, 0.12, 0.2),
  eye: 'amber', idle: 0.42,
});
/** R4's stand for the hammer on the beam: on the main's north-east side, south-east of the breaker's crossing (clear of
 *  his dive line by ≈1.25 m), facing the beam */
const R4_HIT_AT: XZ = {x: UNDER.mid.x + 0.707 * 1.3 + 0.707 * 1.15, z: UNDER.mid.z + 0.707 * 1.3 - 0.707 * 1.15};
const actR4 = (T: number): Partial<UnitSpec> => ({
  posture: [[M.P3, 'ready'], [119.5, 'guard']],
  attend: [{t0: M.P3, turn: false, at: (t: number) => {
    let p = on({x: 50.0, z: -4.0}, 1.5);
    const ks: [number, (t: number) => V3, number][] = [[119.4, () => on({x: 62.6, z: -5.2}, 4.6), 0.15], [120.0, () => on({x: 54.0, z: -3.0}, 1.5), 0.5], [123.65, () => on(BRK_STAND, 1.3), 0.15],
      [EV3.e2Hit + 0.2, () => on(UNDER.mid, 0.9), 0.12], [125.5, () => on(W_C(), 2.0), 0.3], [127.6, () => CREW_C, 0.6]];
    for (const [t0, f, b] of ks) if (t > t0) p = lerp3s(p, f(t), smooth((t - t0) / b));
    return p;
  }}],
  turns: [{t0: 123.7, to: on(BRK_STAND), dur: 0.3}],
  moves: [{t0: 123.98, t1: 124.78, to: on(R4_HIT_AT), face: PIPE_HIT, guard: true}, {t0: 125.5, t1: 126.25, to: on({x: 64.6, z: 0.6}), face: on(H1_AT), guard: true}],
  strikes: [{t0: EV3.e2Hit, side: 'R', kind: 'hammer', target: PIPE_HIT, step: 0.15}],
  hits: [{t0: EV3.land + 0.05, dir: norm3({x: 0.7, y: 0, z: 0.5}), strength: 0.45}],
  eye: 'amber', idle: 0.42,
});

/** the eye: as D2 (its survivors locked, amber) or B's army (cyan) left it; at the ADAPT drone's lock the system
 *  re-targets — each takes the state the tableau (D4) gives it */
const eyeFn = (src: Src, id: number) => {
  const s2 = src.d2 ? unitD2(src.d2, M.P3) : null;
  const eyeFrom: 'cyan' | 'amber' = s2 && ((s2.lockAt !== undefined && M.P3 >= s2.lockAt) || s2.eye === 'amber') ? 'amber' : 'cyan';
  const s4 = d4UnitAt(d4PlanOf(id), M.P4);
  const eyeTo: 'cyan' | 'amber' = s4.lockAt !== undefined && M.P4 >= s4.lockAt ? 'amber' : s4.eye === 'amber' ? 'amber' : 'cyan';
  return (T: number) => (T < EV3.lock ? eyeFrom : eyeTo);
};
/** a unit's ankle height over its explicit foothold (the kit's U.ankleH, measured) */
const U_ANKLE = (() => { const sp: UnitSpec = {id: 1, t: 0, pos: {x: 0, y: 0, z: 0}, heading: 0, ground: () => 0, feet: {L: {x: -0.19, y: 0, z: 0}, R: {x: 0.19, y: 0, z: 0}}}; return unitAttach(sp).footL.y; })();
/** the last 0.62 s into D4's start: the look and the idle sway blend into D4's own spec (exact at 149.86) */
const intoD4Act = (id: number, a: Partial<UnitSpec>, T: number): Partial<UnitSpec> => {
  if (T <= INTO_T) return a;
  const s4 = d4UnitAt(d4PlanOf(id), T), w = smooth(clamp((T - INTO_T) / (M.P4 - INTO_T)));
  const look = a.look && s4.look ? lerp3s(a.look, s4.look, w) : w > 0.5 ? s4.look : a.look;
  // (crouch and lean stay this section's: a keyed stance carries the walk's own bob, D4_BOB)
  return {...a, look, idle: lerp(a.idle ?? 0.45, s4.idle ?? 0.45, w), ...(w > 0.5 ? {posture: s4.posture, scan: s4.scan, attend: s4.attend} : {})};
};
/** the step after a plan's last kit step starts here: its early act (the escort's exchange) runs until then */
const earlyEndOf = (steps: UStep[]) => { let k = -1; steps.forEach((s, i) => { if (s.k === 'kit') k = i; }); return k >= 0 && steps[k + 1] ? stepT0(steps[k + 1]) : -1; };
/** D2's own attention / posture for its survivors over D3's first moments (the cut from D2-7 is exact) */
const d2Act = (name: string, T: number): Partial<UnitSpec> => { const s = unitD2(name, T); return {posture: s.posture, attend: s.attend, scan: s.scan, look: s.look, idle: s.idle}; };
const D2_HANDOFF = 117.25;
/** after an escort's own exchange: its posture there at the hand-over, eased into the guard (no snap of the arms) */
const afterEarly = (early: (T: number) => Partial<UnitSpec>, t: number): [number, Posture][] => {
  const p = early(t).posture;
  const c: Posture = Array.isArray(p) ? (p.filter((k) => k[0] <= t).pop() ?? p[0])[1] : p ?? 'ready';
  return [[M.P3, c], [t, 'guard']];
};
/** D2's survivors: D2's own act until the hand-over, then this section's — its posture blended in from D2's (the kit
 *  eases from one posture key to the next over 0.45 s; a new list would snap the arms) */
const withD2 = (name: string | undefined, a: Partial<UnitSpec>, T: number): Partial<UnitSpec> => {
  if (!name) return a;
  if (T < D2_HANDOFF) return {...a, ...d2Act(name, T)};
  type PK = [number, Posture];
  const cur = (p: UnitSpec['posture'], t: number): Posture => (Array.isArray(p) ? (p.filter((k) => k[0] <= t).pop() ?? p[0])[1] : p ?? 'idle');
  const mine = a.posture;
  const after: PK[] = Array.isArray(mine) ? mine.filter((k) => k[0] > D2_HANDOFF) : [];
  // the attention: from where D2 left its eyes (its own attend target, else straight ahead), eased onto this section's
  // first target over 0.5 s — the head turns, the torso follows, no snap at the hand-over
  const s2 = unitD2(name, D2_HANDOFF), r2 = unitRoot(s2);
  const live = (s2.attend ?? []).filter((x) => x.t0 <= D2_HANDOFF && (x.t1 === undefined || x.t1 > D2_HANDOFF)).pop();
  const ptOf = (q: V3 | ((t: number) => V3), t: number) => (typeof q === 'function' ? q(t) : q);
  const f2 = hv(r2.heading);
  const from: V3 = live ? ptOf(live.at, D2_HANDOFF) : {x: r2.pos.x + f2.x * 10, y: r2.pos.y + 1.7, z: r2.pos.z + f2.z * 10};
  const k = smooth(clamp((T - D2_HANDOFF) / 0.5));
  const attend = (a.attend ?? []).map((x, i) => (i === 0 && x.t0 <= D2_HANDOFF ? {...x, t0: D2_HANDOFF, at: (t: number) => lerp3s(from, ptOf(x.at, t), smooth(clamp((t - D2_HANDOFF) / 0.5)))} : x));
  return {...a, attend, idle: lerp(s2.idle ?? 0.45, a.idle ?? 0.45, k), posture: [[M.P3, cur(s2.posture, D2_HANDOFF)], [D2_HANDOFF, cur(mine, D2_HANDOFF)], ...after]};
};
/**
 * (R4) A walk's polyline kept clear of the crater's solids. The straight lines from the line / the break to the arc's slots
 * ran through the burnt car and the chunks, the wing's through girder post 3 and the water main's raised start (a unit's
 * torso 22 cm inside them: probe `crew vs set meshes`). The units step over the wrecks and over the main where it is low
 * (liftSteps); never through anything else. Samples of the path (≤ 0.7 m apart) that come within CLEAR_MIN of a solid are
 * pushed out along the clearance's gradient; the ends stay (the slots and D4's start spots are already clear).
 */
const CLEAR_MIN = 0.62;
const clearW = (p: XZ): number => {
  let d = clearAt(p, {stepH: 0.2, pipe: false, wrecks: false}).d;
  d = Math.min(d, Math.hypot(p.x - ANCHOR.x, p.z - ANCHOR.z) - 0.55); // girder post 3
  const q = pipeAt(p);
  if (q.u > 0.001 && q.u < 0.999 && q.top > 0.75) d = Math.min(d, q.d - PIPE_HALF); // the main where it is too high to step over
  return d;
};
/** a segment is free if every 0.15 m sample along it is ≥ `min` from the solids */
const segFree = (a: XZ, b: XZ, min: number): boolean => {
  const L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(L / 0.15));
  for (let k = 0; k <= n; k++) if (clearW({x: lerp(a.x, b.x, k / n), z: lerp(a.z, b.z, k / n)}) < min) return false;
  return true;
};
/** shortest way round the solids from a to b: A* on a 0.3 m grid over the segment's box (blocked where clearW < CLEAR_MIN),
 *  then pulled straight (a waypoint is dropped while the chord stays ≥ 0.45 m clear) */
const routeSeg = (a: XZ, b: XZ): XZ[] => {
  const C = 0.3, pad = 7;
  const x0 = Math.min(a.x, b.x) - pad, z0 = Math.min(a.z, b.z) - pad;
  const nx = Math.ceil((Math.max(a.x, b.x) + pad - x0) / C) + 1, nz = Math.ceil((Math.max(a.z, b.z) + pad - z0) / C) + 1;
  const cell = (p: XZ) => ({i: Math.round((p.x - x0) / C), j: Math.round((p.z - z0) / C)});
  const world = (i: number, j: number): XZ => ({x: x0 + i * C, z: z0 + j * C});
  const blocked = new Map<number, boolean>();
  const isB = (i: number, j: number) => { const k = j * nx + i; let v = blocked.get(k); if (v === undefined) { v = clearW(world(i, j)) < CLEAR_MIN; blocked.set(k, v); } return v; };
  const s0 = cell(a), g0 = cell(b);
  const open = new Map<number, number>(), came = new Map<number, number>(), gs = new Map<number, number>();
  const key = (i: number, j: number) => j * nx + i;
  const h = (i: number, j: number) => Math.hypot(i - g0.i, j - g0.j);
  gs.set(key(s0.i, s0.j), 0); open.set(key(s0.i, s0.j), h(s0.i, s0.j));
  let found = false, guard = 0;
  while (open.size && guard++ < 60000) {
    let bk = -1, bf = 1e18;
    open.forEach((f, k) => { if (f < bf) { bf = f; bk = k; } });
    open.delete(bk);
    const ci = bk % nx, cj = Math.floor(bk / nx);
    if (ci === g0.i && cj === g0.j) { found = true; break; }
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue;
      const ni = ci + di, nj = cj + dj;
      if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
      const isEnd = (ni === g0.i && nj === g0.j) || (ni === s0.i && nj === s0.j);
      if (!isEnd && isB(ni, nj)) continue;
      const ng = (gs.get(bk) ?? 0) + Math.hypot(di, dj);
      const nk = key(ni, nj);
      if (ng < (gs.get(nk) ?? 1e18)) { gs.set(nk, ng); came.set(nk, bk); open.set(nk, ng + h(ni, nj)); }
    }
  }
  if (!found) return [a, b];
  const cells: XZ[] = [];
  for (let k: number | undefined = key(g0.i, g0.j); k !== undefined; k = came.get(k)) cells.push(world(k % nx, Math.floor(k / nx)));
  cells.reverse();
  cells[0] = a; cells[cells.length - 1] = b;
  const out: XZ[] = [a];
  let from = 0;
  while (from < cells.length - 1) {
    let to = cells.length - 1;
    while (to > from + 1 && !segFree(cells[from], cells[to], 0.45)) to--;
    out.push(cells[to]);
    from = to;
  }
  return out;
};
export const detourPath = (pts: XZ[]): XZ[] => {
  const out: XZ[] = [pts[0]];
  let changed = false;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (segFree(a, b, 0.4)) { out.push(b); continue; }
    const r = routeSeg(a, b);
    r.slice(1).forEach((q) => out.push(q));
    changed = true;
  }
  return changed ? out : pts;
};
const detourSteps = (steps: UStep[]) => steps.forEach((st) => { if (st.k === 'walk' && st.pts.length >= 2) st.pts = detourPath(st.pts); });
/** the units' steps over the wrecks and the main (a high step) */
const liftSteps = (steps: UStep[]) => steps.forEach((st) => { if (st.k !== 'walk') return; const pt = pipeCross(st.pts); if (overWreck(st.pts) || (pt > 0.05 && pt < 1.2)) st.lift = Math.max(0.42, pt < 1.2 ? pt + 0.3 : 0); });
const midInOf = (steps: UStep[]) => steps.some((st) => st.k === 'keys' && !!st.feet);

export const ARC: ArcUnit[] = (() => {
  const order = [...ARC_START].sort((a, b) => a.bearing - b.bearing);
  const finN = order.slice(0, 7), finS = order.slice(7);
  // the north group: R3, three early wing units (down the north edge under the girder), three cut off behind the wreck
  const vn = [...VAN_TAKE.north];
  const north: {src: Src; role: 'r3' | 'wing' | 'lineN'; slot: XZ}[] = [
    {src: surv.R3, role: 'r3', slot: WING[6]},
    ...vn.slice(0, 3).map((s, j) => ({src: s, role: 'wing' as const, slot: WING[j]})),
    ...vn.slice(3, 6).map((s, j) => ({src: s, role: 'lineN' as const, slot: WING[3 + j]})),
  ];
  // the south group: along the main's north-east side (R1, R4, six vanguard), south of the break (R5–R7, U8, six vanguard)
  const vs = [...VAN_TAKE.south].sort((a, b) => a.z - b.z);
  const south: {src: Src; role: 'mid' | 'south' | 'u8' | 'retreat'; slot: XZ}[] = [
    {src: surv.R4, role: 'mid', slot: LINE_MID[0]}, {src: surv.R1, role: 'mid', slot: LINE_MID[1]},
    ...vs.slice(0, 6).map((s, j) => ({src: s, role: 'mid' as const, slot: LINE_MID[2 + j]})),
    {src: surv.U8, role: 'u8', slot: LINE_SOUTH[9]},
    {src: surv.R5, role: 'retreat', slot: LINE_SOUTH[3]}, {src: surv.R6, role: 'retreat', slot: LINE_SOUTH[0]}, {src: surv.R7, role: 'retreat', slot: LINE_SOUTH[1]},
    ...vs.slice(6, 12).map((s, j) => ({src: s, role: 'south' as const, slot: LINE_SOUTH[[2, 4, 5, 6, 7, 8][j]]})),
  ];
  // a1 / a2 / D4: by bearing round the Crew (the south group fans out from the break: the nearest first)
  const sOrder = south.map((u, i) => ({u, i, b: headingTo(ARC1_C, u.slot)})).sort((a, b) => b.b - a.b);
  const out: ArcUnit[] = [];
  north.forEach((u, j) => {
    const a = finN[j];
    const fin = d4Start(a.id);
    const a1 = {...u.slot, h: norm360(headingTo(u.slot, CREW_C))};
    out.push({id: a.id, role: a.role, src: u.src, group: 'north', k: j, line: u.slot, a1, a2: a1, fin, plan: buildNorth(a.id, u.src, u.role, j, u.slot, fin)});
  });
  sOrder.forEach(({u}, j) => {
    const a = finS[finS.length - 1 - j];
    const fin = d4Start(a.id);
    const a1 = ARC1[17 - j], a2 = ARC2[17 - j];
    out.push({id: a.id, role: a.role, src: u.src, group: 'south', k: j, line: u.slot, a1, a2, fin, plan: buildSouth(a.id, u.src, u.role, j, u.slot, a1, a2, fin)});
  });
  return out;
})();

function buildNorth(id: number, src: Src, role: 'r3' | 'wing' | 'lineN', j: number, slot: XZ, fin: {x: number; z: number; h: number}): UPlan {
  const steps: UStep[] = [];
  const at0: XZ = {x: src.x, z: src.z};
  let early: ((T: number) => Partial<UnitSpec>) | null = null;
  const q = role === 'lineN' ? j - 4 : role === 'wing' ? j - 1 : 0;
  if (role === 'r3') {
    // R3: from D2's place (in heavy 1's way) round the west of its swing to the front-left under the girder
    const spot = {x: 60.3, z: -9.7};
    steps.push({k: 'keys', root: [[M.P3, src.x, src.z, src.h], [117.25, src.x, src.z, src.h]]});
    steps.push({k: 'walk', pts: [at0, {x: 60.6, z: -5.2}, {x: 60.1, z: -8.4}, spot], T0: 117.3, T1: 119.9, A: 0.5, D: 0.6});
    steps.push(hold(spot, 119.9, headingTo({x: 60.1, z: -8.4}, spot), 255, EV3.tBite));
    steps.push({k: 'kit', T0: EV3.tBite});
    early = actR3;
    // FORMATION: to its wing slot (north of the cable), keyed steps off the kit's own stance facing the heavy (a walk
    // from there began from a different standing stance: both feet jumped), turning to the Crew; held to the wing's go
    const p0: XZ = {x: 59.3, z: -11.3}, h0 = headingTo(p0, H1_AT), hW = headingTo(p0, slot), hF = headingTo(slot, CREW_C);
    const r0 = EV3.reform + 0.5;
    const root: KR[] = [[r0, p0.x, p0.z, h0], [r0 + 1.1, slot.x, slot.z, h0 + wrapD(hW - h0)], [r0 + 1.7, slot.x, slot.z, hF], [EV3.wingGo + (j % 4) * 0.22, slot.x, slot.z, hF]];
    steps.push({k: 'keys', root, feet: autoSteps(root, {half: 0.19, stag: -0.04, stepLen: 0.55})});
  } else if (role === 'wing') {
    // the early wing: from the vanguard (as heavy 1 swings blind), along the crater's north edge under the girder
    const t0 = 121.8 + q * 0.3;
    const via: XZ[] = [at0, {x: 72.5, z: clamp(src.z, -12.6, -10.2)}, {x: 66.8, z: -12.4 - (q % 2) * 0.5}, {x: 61.2, z: -12.8 + (q % 3) * 0.4}, slot];
    steps.push({k: 'keys', root: [[M.P3, src.x, src.z, src.h], [t0, src.x, src.z, src.h]]});
    steps.push({k: 'walk', pts: via, T0: t0, T1: 129.0 + q * 0.5, A: 0.6, D: 0.7});
  } else {
    // cut off behind the wreck: down the north corridor toward the heavy, held at the wreck; at FORMATION round its
    // nose (north of the ram) to the girder flank
    const t0 = 121.6 + q * 0.25;
    const ln = LINE_NORTH[q];
    steps.push({k: 'keys', root: [[M.P3, src.x, src.z, src.h], [t0, src.x, src.z, src.h]]});
    steps.push({k: 'walk', pts: [at0, {x: 76.5, z: clamp(src.z, -11.0, -6.0)}, ln], T0: t0, T1: EV3.lineSet - 0.3 + q * 0.15, A: 0.6, D: 0.7});
    steps.push(hold(ln, EV3.lineSet - 0.3 + q * 0.15, 260, 268, EV3.reform + (2 - q) * 0.12));
    steps.push({k: 'walk', pts: [ln, NOSE[0], NOSE[1], slot], T0: EV3.reform + (2 - q) * 0.12, T1: 135.2 + q * 0.3, A: 0.45, D: 0.6});
  }
  // the hold north of the cable (the taut cable is a wall at their knees); FLANK_DENIED: over the slack, south-west
  // over D2's wrecks toward the Crew, a stop a step off them; after the blast into D4's start
  const tH = stepT0(steps[steps.length - 1]) + 0.01;
  const press: XZ = offWrecks(pushFrom({x: lerp(slot.x, fin.x, 0.42), z: lerp(slot.z, fin.z, 0.42)}, {x: 45.0, z: -3.6}, 3.6));
  const tPress = EV3.wingGo + (j % 4) * 0.22;
  const endW = steps[steps.length - 1];
  if (endW.k === 'walk') steps.push(hold(slot, endW.T1, headingTo(endW.pts[endW.pts.length - 2], slot), norm360(headingTo(slot, CREW_C)), tPress));
  steps.push({k: 'walk', pts: [slot, press], T0: tPress, T1: 143.4 + (j % 3) * 0.3, A: 0.45, D: 0.6});
  steps.push(hold(press, 143.4 + (j % 3) * 0.3, headingTo(slot, press), norm360(headingTo(press, CREW_C)), 145.6 + (j % 4) * 0.08, 0.5));
  const f = hv(fin.h), pre = {x: fin.x - f.x * 1.1, z: fin.z - f.z * 1.1};
  intoD4(steps, id, [press, pre, {x: fin.x, z: fin.z}], 145.6 + (j % 4) * 0.08, fin);
  detourSteps(steps);
  liftSteps(steps);
  const midIn = midInOf(steps);
  const eye = eyeFn(src, id);
  const earlyEnd = earlyEndOf(steps);
  void tH;
  return {
    id, key: `d3a${id}`, steps,
    act: (T) => intoD4Act(id, withD2(src.d2, {
      ...(early && T < earlyEnd ? early(T) : {
        look: T < 126.4 ? undefined : T < 145.4 ? CREW_C : dirHeadAt(T),
        posture: early ? afterEarly(early, earlyEnd) : [[M.P3, 'ready'], [128.0, 'guard']] as [number, Posture][],
        idle: 0.42,
        // (its own exchange's attention fades out after the hand-over: the torso untwists, no snap)
        ...(early ? {attend: (early(earlyEnd).attend ?? []).map((x) => ({...x, t1: Math.min(x.t1 ?? 1e9, earlyEnd)}))} : {}),
      }),
      eye: eye(T),
      lockAt: undefined,
      ...(midIn && T > INTO_T ? {crouch: D4_BOB * smooth((T - INTO_T) / (M.P4 - INTO_T))} : {}),
    }, T), T),
  };
}

function buildSouth(id: number, src: Src, role: 'mid' | 'south' | 'u8' | 'retreat', j: number, slot: XZ, a1: {x: number; z: number; h: number}, a2: {x: number; z: number; h: number}, fin: {x: number; z: number; h: number}): UPlan {
  const steps: UStep[] = [];
  const at0: XZ = {x: src.x, z: src.z};
  let early: ((T: number) => Partial<UnitSpec>) | null = null;
  // the order out of the line at FORMATION: the south end first (nearest the arc), the middle through the break
  const ripple = role === 'mid' ? 0.35 + (j % 8) * 0.16 : (j % 10) * 0.07;
  if (role === 'u8') {
    // U8: holding the crater's south-west; up the slope at the Director; the fight (kit); down; up; back to the south
    steps.push({k: 'kit', T0: M.P3, at: {x: src.x, z: src.z, h: src.h}});
    steps.push({k: 'walk', pts: [at0, {x: 57.0, z: 0.35}, U8_MEET], T0: 120.95, T1: EV3.e1Meet, A: 0.45, D: 0.55});
    steps.push({k: 'kit', T0: EV3.e1Meet});
    early = actU8;
    steps.push({k: 'walk', pts: [{x: 55.2, z: 3.2}, slot], T0: 129.2, T1: 130.9, A: 0.45, D: 0.5});
  } else if (role === 'retreat') {
    // R5–R7: they fall back through the crater's south to the break as the heavy engages (regroup)
    const t0 = 117.4 + (j % 3) * 0.15;
    steps.push({k: 'keys', root: [[M.P3, src.x, src.z, src.h], [t0, src.x, src.z, src.h]]});
    steps.push({k: 'walk', pts: [at0, slot], T0: t0, T1: t0 + 1.0 + Math.hypot(slot.x - at0.x, slot.z - at0.z) / 2.0, A: 0.5, D: 0.6});
  } else if (role === 'mid' && src.d2 === 'R4') {
    steps.push({k: 'keys', root: [[M.P3, src.x, src.z, src.h], [117.55, src.x, src.z, src.h]]});
    steps.push({k: 'walk', pts: [at0, {x: 64.6, z: -0.9}], T0: 117.6, T1: 119.4, A: 0.5, D: 0.6});
    steps.push(hold({x: 64.6, z: -0.9}, 119.4, headingTo(at0, {x: 64.6, z: -0.9}), 282, 123.7));
    steps.push({k: 'kit', T0: 123.7});
    early = actR4;
    steps.push({k: 'walk', pts: [{x: 64.6, z: 0.6}, slot], T0: 127.8, T1: 128.9, A: 0.4, D: 0.5});
  } else if (role === 'mid' && src.d2 === 'R1') {
    steps.push({k: 'keys', root: [[M.P3, src.x, src.z, src.h], [121.2, src.x, src.z, src.h]]});
    steps.push({k: 'walk', pts: [at0, {x: 74.0, z: -6.0}, {x: 70.4, z: -1.6}, slot], T0: 121.2, T1: EV3.lineSet - 0.2, A: 0.6, D: 0.7});
  } else {
    // the vanguard's southern units: down from the east rim to the heavy's support; the south ones through the break
    const t0 = 121.6 + (j % 6) * 0.2 + (src.x - 81) * 0.08;
    const via: XZ[] = role === 'mid'
      ? [at0, {x: 74.5, z: clamp(src.z, -1.5, 3.0)}, {x: slot.x + 2.4, z: slot.z - 0.6}, slot]
      : [at0, {x: 73.8, z: clamp(src.z, 1.0, 6.0)}, GATE_NE, GATE_SW, slot];
    steps.push({k: 'keys', root: [[M.P3, src.x, src.z, src.h], [t0, src.x, src.z, src.h]]});
    steps.push({k: 'walk', pts: via, T0: t0, T1: EV3.lineSet - 0.3 + (j % 4) * 0.12, A: 0.6, D: 0.7});
  }
  // in line, facing the rim, held (cut off) until FORMATION
  const prev = steps[steps.length - 1];
  const tl = prev.k === 'walk' ? prev.T1 : EV3.lineSet;
  const hFace = role === 'mid' ? 290 : 300;
  // (U8 arrives last, at a jog: its turn to the rim takes 0.6 s and it goes 0.15 s after — no 156° spin in a quarter second)
  const r0 = Math.max(EV3.reform + ripple, prev.k === 'walk' ? tl + 0.75 : -1e9);
  if (prev.k === 'walk') steps.push(hold(slot, tl, headingTo(prev.pts[prev.pts.length - 2], slot), hFace, r0));
  // FORMATION: out of the line into the arc (the middle through the break first); DECOY_FAIL: on at the source,
  // through the light — no stop between; then hold facing the Crew
  const viaGate = role === 'mid' ? [slot, {x: slot.x + 1.4, z: slot.z + 1.2}, GATE_NE, GATE_SW] : [slot];
  // the re-form is quick (a jog into the arc: the south end is in it before DECOY_FAIL, the middle comes round through
  // the break and fills it), then a stop; the advance through the light at the source (DECOY_FAIL) is the walk on to a2
  const toA1: XZ[] = [...viaGate, {x: a1.x, z: a1.z}];
  const tA1 = r0 + Math.max(2.0, pathLen(toA1) / 3.8);
  steps.push({k: 'walk', pts: toA1, T0: r0, T1: tA1, A: 0.4, D: 0.5});
  const tAdv = Math.max(EV3.advance0 + (j % 6) * 0.1, tA1 + 0.35);
  const arcEnd = Math.max(EV3.advance1 + (j % 6) * 0.22, tAdv + 1.2);
  steps.push(hold(a1, tA1, headingTo(toA1[toA1.length - 2], a1), norm360(headingTo(a1, a2)), tAdv, 0.5));
  steps.push({k: 'walk', pts: [{x: a1.x, z: a1.z}, {x: a2.x, z: a2.z}], T0: tAdv, T1: arcEnd, A: 0.5, D: 0.6});
  steps.push(hold(a2, arcEnd, headingTo(a1, a2), a2.h, 145.55 + (j % 5) * 0.07, 0.6));
  // after the blast: they press in, to D4's start (arriving along D4's first heading)
  const f = hv(fin.h), pre = {x: fin.x - f.x * 1.1, z: fin.z - f.z * 1.1};
  intoD4(steps, id, [{x: a2.x, z: a2.z}, pre, {x: fin.x, z: fin.z}], 145.6 + (j % 5) * 0.07, fin);
  detourSteps(steps);
  liftSteps(steps);
  const midIn = midInOf(steps);
  const eye = eyeFn(src, id);
  const earlyEnd = earlyEndOf(steps);
  return {
    id, key: `d3a${id}`, steps,
    act: (T) => intoD4Act(id, withD2(src.d2, {
      ...(early && T < earlyEnd ? early(T) : {
        look: T < 126.4 ? undefined : T < EV3.lineSet ? CREW_C : T < 136.4 ? DECOY_SRC : T < 145.4 ? CREW_C : dirHeadAt(T),
        posture: early ? afterEarly(early, earlyEnd) : [[M.P3, 'ready'], [127.0, 'guard']] as [number, Posture][],
        idle: 0.42,
        // (its own exchange's attention fades out after the hand-over: the torso untwists, no snap)
        ...(early ? {attend: (early(earlyEnd).attend ?? []).map((x) => ({...x, t1: Math.min(x.t1 ?? 1e9, earlyEnd)}))} : {}),
      }),
      eye: eye(T),
      lockAt: undefined,
      ...(midIn && T > INTO_T ? {crouch: D4_BOB * smooth((T - INTO_T) / (M.P4 - INTO_T))} : {}),
    }, T), T),
  };
}
export const arcUnit = (u: ArcUnit, T: number): UnitSpec => unitRun(u.plan, T);
// the chain: a walk that follows a kit step starts where the kit's own locomotion left the unit
ARC.forEach((u) => u.plan.steps.forEach((st, i) => {
  const prev = u.plan.steps[i - 1];
  if (st.k === 'walk' && prev && prev.k === 'kit') { const e = stepEnd(u.plan, i - 1); st.pts[0] = {x: e.x, z: e.z}; }
}));
/** the escorts by name (the Crew's contacts read them) */
export const escort = (name: 'U8' | 'R3' | 'R4', T: number): UnitSpec => arcUnit(ARC.find((u) => u.src.d2 === name)!, T);
/** the D2 survivors' names the arc animates (leave them out of D2's own draw) */
export const ARC_SURVIVORS = SURV;
/** the cable's run for the FX (post 3 → the shin) */
export {cableAt};

// ================================================================== ENEMY DRONES (the tableau's eight)
// From D1/D2's hovering drones (same positions at P3) and two from B's sky. Keys [t, x, y, z]; the last key lands on D4's
// first (droneD4 at 149.86, blended in over the final second).
const D1_HOVER = (id: number, c: V3, T: number, r = 1.2): V3 => ({x: c.x + Math.sin(T * 0.37 + id) * r, y: c.y + Math.sin(T * 0.6 + id * 2) * 0.35, z: c.z + Math.cos(T * 0.29 + id) * r});
type DPlan = {id: number; from: {id: number; c: V3; r: number}; keys: K4[]; eye?: (T: number) => 'cyan' | 'amber'; extra?: (T: number) => Partial<DroneSpec>};
const P = (t: number, x: number, y: number, z: number): K4 => [t, x, y, z];
/** where the diver hits: the tablet in her left hand at EV3.smash (crew.tsx holds it there) */
export const SMASH_AT: V3 = (() => {
  const f = hv(DEC_SPOT.h), r = {x: -f.z, z: f.x};
  const x = DEC_SPOT.x + f.x * 0.42 - r.x * 0.1, z = DEC_SPOT.z + f.z * 0.42 - r.z * 0.1;
  return {x, y: G(DEC_SPOT.x, DEC_SPOT.z) + 1.08, z};
})();
/** the cable cut point: on the girder flank between post 3 and the wreck's leg (set by the FX from the tether) */
export const CUT_AT: V3 = lerp3s(ANCHOR, h1ClampPt(EV3.cut), 0.3);
export const D_PLANS: DPlan[] = [
  // 7605: the ADAPT drone — holds over the crater's east, climbs out of the dust over the wreck, locks on, marks the
  // source; holds high (eyes: amber only while it locks)
  {id: 7605, from: {id: 8153, c: {x: 61, y: 8.5, z: 3}, r: 1.2}, eye: (T) => (T >= EV3.lock && T < 131.9 ? 'amber' : 'cyan'),
    keys: [P(126.0, 0, 0, 0), P(EV3.climb0, 64.6, 5.6, -3.6), P(129.1, 63.6, 11.6, -4.6), P(EV3.climb1, 62.6, 18.8, -5.6), P(131.0, 62.4, 20.4, -6.2), P(140.0, 62.8, 21.4, -7.4), P(M.P4, 64, 22, -8)],
    extra: (T) => ({look: T < 129.0 ? undefined : T < 129.75 ? CREW_C : SMASH_AT, mark: T > EV3.mark0 && T < 131.8 ? {target: SMASH_AT, color: 'amber'} : undefined})},
  // 7601: the diver — from over the crater's south, up high, then straight down onto the tablet (136.35); bounces off
  {id: 7601, from: {id: 8151, c: {x: 63, y: 7.6, z: -5.5}, r: 1.6}, eye: () => 'amber',
    keys: [P(128.0, 0, 0, 0), P(131.5, 57.5, 9.6, 2.6), P(EV3.dive0, 53.6, 9.2, 1.3), P(EV3.smash - 0.32, SMASH_AT.x + 2.2, SMASH_AT.y + 2.3, SMASH_AT.z + 0.9), P(EV3.smash, SMASH_AT.x + 0.05, SMASH_AT.y + 0.08, SMASH_AT.z), P(136.75, SMASH_AT.x + 1.0, 3.0, SMASH_AT.z + 1.9), P(138.4, 49.5, 6.4, 3.5), P(142.0, 47.5, 7.2, 6.0), P(M.P4, 46, 7.5, 7)],
    extra: (T) => ({struck: {t0: EV3.smash, dir: {x: 0.6, y: 0.5, z: 0.4}}, mark: T > 135.2 && T < EV3.smash ? {target: SMASH_AT, color: 'amber'} : undefined})},
  // 7602: the cutter — under the girder from the north-east, low along the cable, the cutter arm out; then holds
  {id: 7602, from: {id: 8152, c: {x: 56, y: 6.5, z: -9}, r: 1.2}, eye: (T) => (T >= 137.4 && T < 139.7 ? 'amber' : 'cyan'),
    keys: [P(136.8, 0, 0, 0), P(EV3.swarm0, 56.0, 4.6, -9.6), P(138.45, CUT_AT.x + 1.6, CUT_AT.y + 0.5, CUT_AT.z - 0.35), P(EV3.cut, CUT_AT.x - 0.05, CUT_AT.y + 0.04, CUT_AT.z), P(139.45, CUT_AT.x - 1.4, CUT_AT.y + 1.2, CUT_AT.z + 0.5), P(141.5, 51.0, 7.0, -7.0), P(M.P4, 50, 9, -6)],
    extra: (T) => ({cutter: clamp((T - 138.1) / 0.35) * (1 - clamp((T - 139.6) / 0.5))})},
  // 7603: swarms the flank with it (over the tether operator), then rises to the north
  {id: 7603, from: {id: 8155, c: {x: 68, y: 9.5, z: -4}, r: 1.2}, eye: (T) => (T >= 137.4 && T < 139.7 ? 'amber' : 'cyan'),
    keys: [P(136.6, 0, 0, 0), P(EV3.swarm0, 58.0, 6.2, -12.2), P(138.6, 50.2, 3.6, -12.6), P(139.6, 47.4, 3.1, -11.4), P(141.0, 46.0, 6.0, -12.0), P(M.P4, 44, 12, -12)]},
  // 7604 and 7607: the hunters — they come in from the south and the east and run the allied drone down
  {id: 7604, from: {id: 8154, c: {x: 54, y: 5.2, z: 9}, r: 1.2}, eye: (T) => (T >= 140.2 && T < 141.9 ? 'amber' : 'cyan'),
    keys: [P(139.6, 0, 0, 0), P(EV3.hunt0, 50.0, 4.2, 4.8), P(140.9, 46.6, 3.1, 1.6), P(141.2, 44.2, 2.5, 1.0), P(EV3.kill, 43.15, 2.25, 1.15), P(141.75, 42.4, 3.4, 2.6), P(143.5, 45.0, 7.5, 7.5), P(M.P4, 48, 10, 12)],
    extra: (T) => ({mark: T > 140.55 && T < EV3.kill ? {target: allyAt(T), color: 'amber'} : undefined})},
  {id: 7607, from: {id: 8156, c: {x: 72, y: 7, z: 8}, r: 1.2}, eye: (T) => (T >= 140.2 && T < 141.9 ? 'amber' : 'cyan'),
    keys: [P(139.0, 0, 0, 0), P(EV3.hunt0, 53.0, 5.6, -0.6), P(140.95, 47.5, 3.8, -1.2), P(141.25, 44.4, 2.6, 0.1), P(141.6, 42.8, 3.2, -0.2), P(143.5, 50.0, 9.0, 4.0), P(M.P4, 70, 17, 12)]},
  // 7606 and 7608: high in the smoke over the avenue (two of B's sky)
  {id: 7606, from: {id: 3310, c: {x: 84, y: 30, z: 6}, r: 0}, keys: [P(117.4, 0, 0, 0), P(121.5, 120.0, 24.0, 2.0), P(125.0, 84, 30, 6), P(M.P4, 84, 30, 6)]},
  {id: 7608, from: {id: 3316, c: {x: 110, y: 34, z: -12}, r: 0}, keys: [P(117.4, 0, 0, 0), P(121.0, 113.0, 22.0, -2.0), P(125.0, 110, 34, -12), P(M.P4, 110, 34, -12)]},
];
/** one of the tableau's drones at T: its hover from D1/D2 until its keys take over, the keys, D4's sway in the last s */
export const droneD3 = (pl: DPlan, T: number): DroneSpec => {
  const k0 = pl.keys[0][0];
  const bi = DRONES_B.findIndex((d) => d.id === pl.from.id);
  const hov = (t: number) => (pl.from.r > 0 ? D1_HOVER(pl.from.id, pl.from.c, t, pl.from.r) : bi >= 0 ? droneSpecB(bi, t).pos : pl.from.c);
  const h1 = hov(k0 + 0.25);
  const keys: K4[] = [[k0, hov(k0).x, hov(k0).y, hov(k0).z], [k0 + 0.25, h1.x, h1.y, h1.z], ...pl.keys.slice(1)];
  const at = (t: number) => (t < k0 ? hov(t) : splV(keys, t));
  let pos = at(T);
  const vel = mul3(sub3(at(T + 0.05), at(T - 0.05)), 10);
  const d4 = T > M.P4 - 1.2 ? droneD4(pl.id, M.P4) : null;
  const w = d4 ? smooth((T - (M.P4 - 1.2)) / 1.2) : 0;
  if (d4) pos = lerp3s(pos, d4.pos, w);
  const sp = Math.hypot(vel.x, vel.z);
  const heading = sp > 0.6 ? (Math.atan2(vel.x, -vel.z) * 180) / Math.PI : 260;
  const look = T < 128 ? on({x: 49, z: -6}, 1.2) : CREW_C;
  const ex = pl.extra ? pl.extra(T) : {};
  return {id: pl.id, t: T, pos, vel, heading: d4 && w > 0.5 ? d4.heading : heading, eye: pl.eye ? pl.eye(T) : 'cyan', ground, key: `tb_d${pl.id}`, ...ex, look: d4 && w > 0.5 ? d4.look : ex.look ?? look};
};
export const dronesD3 = (T: number): DroneSpec[] => D_PLANS.map((p) => droneD3(p, T));
/** the ids of D1/D2's drones and B's sky drones the tableau's eight take over */
export const DRONE_SRC_IDS = new Set(D_PLANS.map((p) => p.from.id));

// (kept imports)
void [RUN_HOOK, GATE, fwdOf, wrapD, PIPE];
