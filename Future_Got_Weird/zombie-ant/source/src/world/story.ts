// The story as pure functions of time, on the measured narration (data/timeline.json).
// Places (mm, z up; the default camera looks from -y):
// - ant #1 (the hook): already infected, it bites the midrib under leaf L1 (high on plant P1), dies, and in a time-lapse
//   a stalk grows from the back of its head and releases spores;
// - ant #2: walking on the floor below, a spore lands on it; the fungus spreads inside it; it walks to plant P2, climbs
//   the stem, crawls under leaf L2 and bites the midrib; it dies, the stalk grows, spores fall onto ant #3 below;
// - the graveyard: other dead ants on nearby leaves; ant #4, alive and infected, approaching a vein (the loop).
import {add3, cross3, len3, lerp3, mul3, norm3, sub3, V3} from '../core/three';
import {dirW, Frame, frame, rotA, slerpF, toL, toW} from '../core/frame';
import {AntState, freeLeg, LegPose, lerpLeg, NECK, planted, REST_FOOT, solve} from '../ant/rig';
import {clamp, keyS, lerp, noise1, ring, ss, ss5, word} from '../lib';
import {Leaf, leafSpine, midrib, MIDRIB_DROP} from './plant';
import {ceilS, cylS, floorS, gaitLegs, pathPose, Seg, straight, arc, unionS} from './gait';
import {ascoma, ostioles, StalkSpec, stalkLine} from '../fungus/fungus';

export const TM = {
  ant: word('ant').start,
  zombie: word('zombie').start,
  you: word('you').start,
  spreads: word('spreads').start,
  body: word('body').start,
  controlling: word('controlling').start,
  muscles: word('muscles').start,
  then: word('then').start,
  climb: word('climb').start,
  plant: word('plant').start,
  bite: word('bite').start,
  down: word('down').start,
  hard: word('hard').start,
  let: word('let').start,
  go: word('go').start,
  dies: word('dies').start,
  but: word('but').start,
  started: word('started').start,
  because: word('because').start,
  days: word('days').start,
  giant: word('giant').start,
  stalk: word('stalk').start,
  grows: word('grows').start,
  head: word('head').start,
  finally: word('finally').start,
  opens: word('opens').start,
  releases: word('releases').start,
  spores: word('spores').start,
  ants2: word('ants', 0).start,
  below: word('below').start,
  beneath: word('beneath').start,
  leaf: word('leaf').start,
  there: word('there').start,
  dozens: word('dozens').start,
  more: word('more').start,
  died: word('died').start,
  exact: word('exact').start,
  way: word('way').start,
};

// ------------------------------------------------------------------ the bite: the head locked to the midrib
/** at the grip, the midrib sits between the mandibles at this point of the head (head coordinates) */
export const MAND_GRIP = 0.27;
export const VEIN_H: V3 = (() => {
  const body = frame([0, 0, 0], [1, 0, 0], [0, 0, 1]);
  const st: AntState = {body, headPitch: 0, headYaw: 0, mand: MAND_GRIP, antSpread: 0.5, antTw: [0, 0], legs: REST_FOOT.map(() => ({ankle: [0, 0, 0] as V3, foot: [1, 0, 0] as V3})), gasterPitch: 0, dead: 0};
  const R = solve(st);
  const m = lerp3(R.mand[0].pts[10], R.mand[1].pts[10], 0.5);
  const a = lerp3(R.mand[0].pts[8], R.mand[1].pts[8], 0.5);
  const p = lerp3(m, a, 0.5);
  const l = toL(R.head, p);
  return [l[0] + 0.05, 0, l[2]] as V3;
})();
export type BiteAnchor = {vein: V3; f: V3; u: V3; leaf: Leaf; ub: number};
/** the bite anchor on a leaf's midrib at u (dorsal side of the ant toward +1 = the leaf tip, -1 = the base) */
export const biteAnchor = (lf: Leaf, ub: number, dorsalToTip = 1): BiteAnchor => {
  const sp = leafSpine(lf);
  const m = midrib(lf, sp, ub);
  return {vein: m.c, f: m.up, u: mul3(m.dir, dorsalToTip), leaf: lf, ub};
};
/** the body frame for a head locked at the vein; approach = mm the head is short of the grip, along -f */
export const biteBody = (A: BiteAnchor, headPitch: number, approach: number, sc = 1): Frame => {
  const Hf = frame([0, 0, 0], A.f, A.u);
  const N = sub3(sub3(A.vein, mul3(dirW(Hf, VEIN_H), sc)), mul3(A.f, approach));
  const bf = rotA(Hf.f, Hf.l, -headPitch), bu = rotA(Hf.u, Hf.l, -headPitch);
  const B0 = frame([0, 0, 0], bf, bu);
  return {...B0, o: sub3(N, mul3(dirW(B0, NECK), sc))};
};
/** the underside surface around a bite (the blade, just above the midrib) */
export const biteCeil = (A: BiteAnchor) => {
  const c = add3(A.vein, mul3(A.f, MIDRIB_DROP + 0.05));
  return {proj: (p: V3) => {
    const d = (p[0] - c[0]) * A.f[0] + (p[1] - c[1]) * A.f[1] + (p[2] - c[2]) * A.f[2];
    return {q: sub3(p, mul3(A.f, d)), n: mul3(A.f, -1), d: Math.abs(d)};
  }};
};
/** relaxed legs of a hanging ant (spread, drooping toward the gaster) */
export const RELAX: [number, number, number, number][] = [[48, 18, 58, 20], [56, 8, 50, 24], [92, 6, 46, 30], [100, -6, 60, 22], [140, -14, 44, 28], [132, -24, 56, 20]];
const baseState = (body: Frame, o: Partial<AntState> = {}): AntState => ({body, headPitch: 0, headYaw: 0, mand: 0.2, antSpread: 0.55, antTw: [0, 0], legs: [], gasterPitch: 4, dead: 0, ...o});

/** the bite sequence, relative to the moment the jaws meet the vein (tc). Used for ant #1 (the hook), ant #2 and
 *  ant #4 (the loop). approach: head short of the grip before contact; pitch: the body swinging down to hang. */
export const biteState = (A: BiteAnchor, t: number, tc: number, k: {hang0: number; hang1: number; tHang: [number, number]; relax: [number, number]; holdFront?: boolean; dead?: number; twitchEnd?: number; hangOf?: (t: number) => number}): AntState => {
  const tau = t - tc;
  // the head closes the last fraction of a millimetre as the jaws shut
  const approach = tau < -0.09 ? 0.75 + (-0.09 - tau) * 1.6 : tau < 0 ? 0.75 * (-tau / 0.09) ** 1.6 : 0;
  const mand = tau < -0.1 ? 1 : tau < 0 ? lerp(MAND_GRIP, 1, (-tau / 0.1) ** 1.8) : MAND_GRIP - 0.04 * Math.exp(-tau / 0.2);
  // the body swings down to hang, with a small settling swing
  const hp = (k.hangOf ? k.hangOf(t) : lerp(k.hang0, k.hang1, ss5(t, k.tHang[0], k.tHang[1]))) + 5 * ring(t, k.tHang[1] - 0.12, 1.4, 0.35);
  const body = biteBody(A, hp, approach);
  const st = baseState(body, {headPitch: hp, mand, dead: k.dead ?? 0});
  const live = 1 - ss(t, k.relax[0], (k.twitchEnd ?? k.relax[1]));
  st.antSpread = 0.55 + 0.25 * live;
  st.antFwd = 0.3;
  st.antTw = [8 * live * noise1(t * 7, 3), 8 * live * noise1(t * 7, 9)];
  const ceil = biteCeil(A);
  const lat = norm3(cross3(A.u, A.f));
  const onLeaf = (a: number, b: number) => add3(add3(A.vein, mul3(A.f, MIDRIB_DROP + 0.05)), add3(mul3(A.u, a), mul3(lat, b)));
  // grips while it bites: front legs wide of the head, middle legs further out, hind legs reaching back
  const GRIP: [number, number][] = [[-1.6, 3.9], [-1.6, -3.9], [-4.2, 5.8], [-4.2, -5.8], [-7.2, 5.0], [-7.2, -5.0]];
  const REACH: [number, number, number, number] = [150, 20, 70, 20];
  const flat = clamp((hp - 40) / 40);
  st.legs = REST_FOOT.map((_, i) => {
    const g = onLeaf(GRIP[i][0], GRIP[i][1]);
    const h = ceil.proj(g);
    let P: LegPose = planted(st, i, h.q, h.n);
    if (i >= 4) P = lerpLeg(freeLeg(st, i, REACH[0], REACH[1], REACH[2], REACH[3]), P, flat);
    const r = RELAX[i];
    const F = freeLeg(st, i, r[0], r[1], r[2], r[3]);
    const stag = [0.25, 0.2, 0.05, 0.1, 0, 0.08][i];
    let wgt = ss(t, k.relax[0] + stag * (k.relax[1] - k.relax[0]), k.relax[1]);
    if (k.holdFront && i < 2) wgt *= 0.25;
    return lerpLeg(P, F, wgt);
  });
  return st;
};

// ------------------------------------------------------------------ places
// leaf L1 (ant #1, the hook) on plant P1
export const P1 = {x: -66, y: 18, top: 58};
export const L1: Leaf = {id: 'L1', base: [-64.6, 17.6, 58.6], dir: norm3([1, -0.22, 0.08]), up: [0, 0, 1], L: 34, Wd: 16, droop: 18, cup: 1.4};
export const P1_STEM: V3[] = [[-66, 18, 0], [-66.6, 18.4, 14], [-66.4, 18.2, 30], [-65.8, 18, 46], [-65.2, 17.8, 56], [-64.6, 17.6, 58.6]];
export const UB1 = 0.4;
/** ant #1's bite anchor follows the leaf as it flexes (defined after leaf1 below) */
export const A1 = (t = 0) => biteAnchor(leaf1(t), UB1, 1);
// plant P2 (ant #2): a straight stem at x = 0, its leaf L2 reaching back toward -x
export const P2 = {x: 0, y: 10, r: 1.5, zc: 27.6};
export const L2: Leaf = {id: 'L2', base: [-1.2, 10, 28.0], dir: norm3([-1, 0, 0.02]), up: [0, 0, 1], L: 27, Wd: 14, droop: 16, cup: 1.1};
export const P2_STEM: V3[] = [[0, 10, -0.5], [0, 10, 8], [0, 10, 16], [0, 10, 24], [-0.4, 10, 27.4], [-1.2, 10, 28.0]];

// ------------------------------------------------------------------ fungus on ant #1
export const SP1: StalkSpec = {seed: 3, len: 17, bend: 0.95, lean: 0.12};
export const HOOK = {
  contact: 0.285, // the jaws meet the vein
  hang: [0.46, 0.86] as [number, number],
  dieEnd: 1.25,
  stalk0: 0.9,
  stalk1: 1.72,
  asc0: 1.36,
  asc1: 1.86,
  open0: 1.86,
  open1: 2.06,
  spore: 2.0, // the hero spore leaves the ascoma
  land: 3.32, // ...and lands on ant #2
};
export const ant1State = (t: number): AntState => {
  const st = biteState(A1(t), t, HOOK.contact, {hang0: 46, hang1: 4, tHang: HOOK.hang, relax: [0.5, 0.95], holdFront: true});
  st.dead = ss(t, 0.85, HOOK.dieEnd);
  return st;
};
export const fungus1 = (t: number) => ({
  g: keyS(t, [[HOOK.stalk0, 0], [1.38, 0.5], [HOOK.stalk1, 1]], (x) => x),
  asc: ss(t, HOOK.asc0, HOOK.asc1),
  open: ss(t, HOOK.open0, HOOK.open1),
  teth: ss(t, 0.95, 1.7),
});
/** the leaf L1 reacting: a dent where the jaws clamp, a flex at contact, a slight sag under the hanging ant */
export function leaf1(t: number): Leaf {
  return {
  ...L1,
  dip: 2.2 * ss(t, 0.45, 0.95) + 3.0 * ring(t, HOOK.contact, 5.5, 0.16),
  dent: {u: UB1, d: 0.34 * ss(t, HOOK.contact - 0.02, HOOK.contact + 0.04) + 0.12 * ring(t, HOOK.contact + 0.03, 7, 0.1)},
  };
}

// ------------------------------------------------------------------ ant #2's path
const H2 = 1.6; // thorax height above the surface
const RHO = 1.7; // corner radius
const XW = P2.x - P2.r; // the stem face it climbs
export const X0 = -90; // where its path starts
const ZC = P2.zc;
export const PATH2: Seg[] = [
  straight([X0, P2.y, H2], [XW - H2 - RHO, P2.y, H2], [1, 0, 0], [0, 0, 1]),
  arc([XW - H2 - RHO, P2.y, H2 + RHO], [0, 0, -RHO], [RHO, 0, 0], [1, 0, 0], [0, 0, 1], [0, 0, 1], [-1, 0, 0]),
  straight([XW - H2, P2.y, H2 + RHO], [XW - H2, P2.y, ZC - H2 - RHO], [0, 0, 1], [-1, 0, 0]),
  arc([XW - H2 - RHO, P2.y, ZC - H2 - RHO], [RHO, 0, 0], [0, 0, RHO], [0, 0, 1], [-1, 0, 0], [-1, 0, 0], [0, 0, -1]),
  straight([XW - H2 - RHO, P2.y, ZC - H2], [XW - H2 - RHO - 8, P2.y, ZC - H2], [-1, 0, 0], [0, 0, -1]),
];
export const SURF2 = unionS([floorS, cylS(P2.x, P2.y, P2.r, 0, ZC), ceilS(ZC, -28, P2.x - 0.5, P2.y - 7, P2.y + 7)]);
/** distance along ant #2's path from a piecewise-linear speed profile (mm/s) */
const V2: [number, number][] = [[0, 9.5], [3.3, 9.5], [4.4, 6], [5.4, 0.8], [5.9, 0]];
const integ = (keys: [number, number][], t: number) => {
  let s = 0;
  for (let i = 1; i < keys.length; i++) {
    const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
    if (t <= t0) break;
    const te = Math.min(t, t1);
    const ve = v0 + ((v1 - v0) * (te - t0)) / (t1 - t0);
    s += ((v0 + ve) / 2) * (te - t0);
  }
  const [tl, vl] = keys[keys.length - 1];
  if (t > tl) s += vl * (t - tl);
  return s;
};
export const S2_START = 21.125; // path distance at t = 0: the spore lands at x = -37.5, and it stops on a whole stride (s = 64.6)
export const s2 = (t: number) => S2_START + integ(V2, t);
export const ant2Walk = (t: number): AntState => {
  const s = s2(t);
  const wob = noise1(t * 2.3, 5);
  const bodyAt = (ss_: number) => pathPose(PATH2, ss_);
  const body = bodyAt(s);
  const st = baseState(body, {headPitch: 16 + 6 * noise1(t * 3, 2), headYaw: 7 * wob, mand: 0.15, antSpread: 0.75});
  st.antTw = [10 * noise1(t * 5, 1), 10 * noise1(t * 5, 4)];
  st.legs = gaitLegs(st, bodyAt, s, SURF2);
  return st;
};
/** where the hero spore sticks on ant #2 (body coordinates: the right side of the propodeum) */
export const LAND2: V3 = [-0.75, -0.5, 0.62];

// ------------------------------------------------------------------ spores
/** the hero spore of ant #1: shot from an ostiole, then falling and drifting onto ant #2 */
export const heroSpore1 = (t: number): {p: V3; d: V3; on: boolean} | null => {
  if (t < HOOK.spore) return null;
  const R1 = solve(ant1State(HOOK.spore));
  const line = stalkLine(R1, SP1);
  const A = ascoma(line, 1, 1);
  const O = ostioles(A)[3];
  const st2 = ant2Walk(HOOK.land);
  const Lp = toW(st2.body, LAND2);
  if (t >= HOOK.land) {
    const st = ant2Walk(t);
    return {p: toW(st.body, LAND2), d: st.body.f, on: true};
  }
  const P0 = O, P1v = add3(O, mul3(A.out, 3.2)), P2v = add3(Lp, [-3, -1.5, 14]), P3 = Lp;
  const tt = t - HOOK.spore, T = HOOK.land - HOOK.spore;
  // fast ejection, then a steady fall that settles onto the ant
  const u = tt < 0.16 ? 0.1 * (1 - (1 - tt / 0.16) ** 2) : 0.1 + 0.9 * (1 - (1 - (tt - 0.16) / (T - 0.16)) ** 1.35);
  const b = (a: V3, c: V3, d: V3, e: V3, x: number): V3 => {
    const m = 1 - x;
    return add3(add3(mul3(a, m * m * m), mul3(c, 3 * m * m * x)), add3(mul3(d, 3 * m * x * x), mul3(e, x * x * x)));
  };
  const p = b(P0, P1v, P2v, P3, u);
  const sway: V3 = [1.2 * Math.sin(tt * 5.1) * u * (1 - u) * 4, 0.8 * Math.sin(tt * 3.7 + 1) * u * (1 - u) * 4, 0];
  const p2 = b(P0, P1v, P2v, P3, Math.min(1, u + 0.01));
  return {p: add3(p, sway), d: norm3(sub3(p2, p)), on: false};
};
/** a burst of spores from ant #1's ascoma at the end of the hook (they drift down and fade) */
export const burst1 = (t: number) => {
  const out: {p: V3; d: V3; a: number}[] = [];
  if (t < HOOK.open0 + 0.05 || t > 4.2) return out;
  const R1 = solve(ant1State(HOOK.spore));
  const line = stalkLine(R1, SP1);
  const A = ascoma(line, 1, 1);
  const os = ostioles(A);
  for (let k = 0; k < 16; k++) {
    const te = HOOK.open0 + 0.06 + k * 0.045;
    if (t < te) continue;
    const tau = t - te;
    const O = os[(k * 7) % os.length];
    const v0 = norm3(add3(A.out, [Math.sin(k * 2.3) * 0.6, Math.cos(k * 1.7) * 0.6, -0.3]));
    const p = add3(add3(O, mul3(v0, 3.0 * (1 - Math.exp(-tau / 0.12)))), [Math.sin(tau * 3 + k) * 0.8, 0, -9 * tau]);
    out.push({p, d: norm3(add3(v0, [0, 0, -1.5 * Math.min(1, tau * 4)])), a: clamp(1 - tau / 1.6)});
  }
  return out;
};

// ------------------------------------------------------------------ sound events (exported for tools/make_audio.py)
export const EVENTS: Record<string, number> = {
  grip: 0.0, // legs gripping the leaf as it reaches the vein
  contact1: HOOK.contact, // the jaws meet the vein
  swing1: HOOK.hang[0], // the body swings down to hang
  grow1a: HOOK.stalk0, // the stalk starts (time-lapse)
  grow1b: HOOK.stalk1,
  asc1: HOOK.asc0,
  open1: HOOK.open0, // the cushion opens; spores go
  spore1: HOOK.spore,
  land1: HOOK.land, // the spore lands on ant #2
  walk2a: 2.3, // ant #2's steps while it is close
};
