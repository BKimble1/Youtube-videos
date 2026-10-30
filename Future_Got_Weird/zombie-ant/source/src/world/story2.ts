// Ant #2 from the landing of the spore to its death, and the fungus that grows out of it; the ants below it.
import {add3, len3, lerp3, mul3, norm3, sub3, V3} from '../core/three';
import {frame, Frame, pitchF, rollF, slerpF, toW, yawF} from '../core/frame';
import {AntState, LegPose, lerpLeg, solve} from '../ant/rig';
import {clamp, keyS, lerp, noise1, ring, ss, ss5} from '../lib';
import {Leaf} from './plant';
import {biteAnchor, biteBody, biteState, L2, P2, PATH2, SURF2, s2, TM, ant2Walk} from './story';
import {gaitLegs, pathLen, pathPose, STRIDE, straight, floorS, bob} from './gait';
import {ascoma, ostioles, StalkSpec, stalkLine} from '../fungus/fungus';
import {NET_END} from '../fungus/hyphae';
import {CELLS_END} from '../fungus/hyphae2';

// ------------------------------------------------------------------ the infection inside ant #2 (4.0 - 8.3 s)
export const INF = {
  germ0: 3.28, // the germ tube pierces the cuticle under the landed spore
  germ1: 3.7,
  cell0: 3.5, // fungal cells bud and multiply in the tissue under it
  cell1: 5.4,
  net0: TM.spreads + 0.1, // the network spreads through the body
  net1: TM.muscles + 0.3, // ...and has wrapped the muscles
  xr0: 3.36, // the shell turns translucent round the entry point
  xr1: TM.body + 0.1, // ...then over the whole body
  xrOut0: TM.then - 0.3, // and closes again: back to the intact ant
  xrOut1: TM.then + 0.08,
};
/** network time (s of growth) at film time t */
export const netTime = (t: number) => keyS(t, [[INF.net0, 0], [TM.controlling, NET_END * 0.62], [INF.net1, NET_END]], (x) => x);
/** growth time of the fungal cells in the close-up tissue */
export const cellTime = (t: number) => keyS(t, [[INF.cell0, 0], [INF.cell1, CELLS_END + 0.3]], (x) => x);
/** muscle contraction pulses as the fungus takes control (strongest on "MUSCLES") */
export const SPASMS = [TM.controlling + 0.2, TM.controlling + 0.5, TM.muscles, TM.muscles + 0.32];
export const pulseAt = (t: number) => SPASMS.reduce((a, s, k) => Math.max(a, (k === 2 ? 1 : 0.6) * Math.exp(-(((t - s) / 0.07) ** 2))), 0);
export const xrayAt = (t: number) => ({
  r: keyS(t, [[INF.xr0, 0], [INF.xr0 + 0.4, 470], [4.7, 520], [INF.xr1, 1800]], (x) => x * x * (3 - 2 * x)),
  a: 1 - ss(t, INF.xrOut0, INF.xrOut1),
});

// ------------------------------------------------------------------ the forced walk, the climb and the bite
export const TC2 = 10.97; // the jaws meet L2's midrib
export const UB2 = 0.36;
export function leaf2(t: number): Leaf {
  return {
    ...L2,
    dip: 1.4 * ss(t, 11.3, 12.9) + 1.2 * ss(t, TM.go - 0.05, TM.go + 0.2) + 3.4 * ring(t, TC2, 5, 0.16) + 1.8 * ring(t, TM.go, 3.2, 0.22),
    dent: {u: UB2, d: 0.36 * ss(t, TC2 - 0.02, TC2 + 0.04) + 0.12 * ring(t, TC2 + 0.03, 7, 0.1)},
  };
}
export const A2 = (t: number) => biteAnchor(leaf2(t), UB2, 1);
const BITE2 = {
  hang0: 90,
  hang1: 5,
  tHang: [11.4, 12.9] as [number, number],
  relax: [12.25, TM.go + 0.1] as [number, number],
  twitchEnd: TM.dies + 0.05,
  close: 0.16,
  // it swings partly down as it reaches for the vein, bites, holds, then hangs as its legs let go
  hangOf: (t: number) => keyS(t, [[10.45, 90], [10.8, 50], [11.0, 46], [11.5, 44], [12.9, 5]]),
};
export const W_END = 10.45; // the walk ends under the leaf
export const B_IN = 10.78; // fully in the bite pose
const S_STOP = 64.6;
/** where the crawl must end so the body meets the bite pose */
const S_ARR = (() => {
  const Ob = biteBody(A2(W_END), 90, 0.9).o;
  const L = pathLen(PATH2);
  const xEnd = pathPose(PATH2, L).o[0];
  return L - (Ob[0] - xEnd); // the crawl runs toward -x: x(s) = xEnd + (L - s)
})();
/** trapezoid speed profile 0..1 over x in [0,1] (accelerate, cruise, slow) */
const trap = (x: number, a = 0.18, d = 0.14) => {
  x = clamp(x);
  const v = 1 / (1 - a / 2 - d / 2);
  if (x < a) return (v * x * x) / (2 * a);
  if (x < 1 - d) return v * (a / 2 + (x - a));
  const y = 1 - x;
  return 1 - (v * y * y) / (2 * d);
};
export const s2b = (t: number) => {
  if (t <= 8.15) return s2(t);
  const x = (t - 8.15) / (W_END - 8.15);
  // purposeful, with a slight uneven, compelled rhythm
  return S_STOP + (S_ARR - S_STOP) * trap(x) + 0.45 * Math.sin(2 * Math.PI * 2.3 * (t - 8.15)) * Math.sin(Math.PI * clamp(x));
};
const walk2 = (t: number): AntState => {
  const s = Math.min(s2b(t), S_ARR);
  const bodyAt = (q: number) => pathPose(PATH2, q);
  let body = bob(bodyAt(s), s);
  const moving = ss(t, 8.1, 8.4);
  // compelled, slightly abnormal: a sway of the body while it walks
  body = yawF(body, 6 * moving * noise1(t * 3.1, 11));
  body = rollF(body, 4 * moving * noise1(t * 2.7, 13));
  const sp = pulseAt(t);
  body = pitchF(body, -4 * sp);
  const st: AntState = {body, headPitch: 16 + 5 * noise1(t * 3, 2) - 10 * sp, headYaw: 6 * noise1(t * 2.3, 5), mand: 0.15 + 0.6 * sp, antSpread: 0.75, antTw: [10 * noise1(t * 5, 1), 10 * noise1(t * 5, 4)], legs: [], gasterPitch: 4 + 6 * sp, dead: 0};
  st.legs = gaitLegs(st, bodyAt, s, SURF2);
  // spasms: legs jerk up and out on each pulse
  if (sp > 0.02) {
    st.legs = st.legs.map((L, i) => {
      const k = [0.6, 1, 0.8, 0.5, 1, 0.7][i];
      const lift = add3(mul3(body.u, 0.9 * sp * k), mul3(body.l, (i % 2 === 0 ? 1 : -1) * 0.5 * sp * k));
      return {...L, ankle: add3(L.ankle, lift), foot: add3(L.foot, mul3(lift, 1.3))};
    });
  }
  return st;
};
const blendState = (a: AntState, b: AntState, w: number): AntState => ({
  ...b,
  body: slerpF(a.body, b.body, w),
  headPitch: lerp(a.headPitch, b.headPitch, w),
  headYaw: lerp(a.headYaw, b.headYaw, w),
  mand: lerp(a.mand, b.mand, w),
  antSpread: lerp(a.antSpread, b.antSpread, w),
  antTw: [lerp(a.antTw[0], b.antTw[0], w), lerp(a.antTw[1], b.antTw[1], w)],
  gasterPitch: lerp(a.gasterPitch, b.gasterPitch, w),
  legs: a.legs.map((L, i) => lerpLeg(L, b.legs[i], w)),
  dead: lerp(a.dead, b.dead, w),
});
export const ant2State = (t: number): AntState => {
  if (t < 3.9) return ant2Walk(t);
  if (t < W_END) return walk2(t);
  const bite = biteState(A2(t), t, TC2, BITE2);
  bite.dead = ss(t, TM.dies - 0.1, TM.dies + 0.8);
  // (final pass) the moment of death: one last small spasm of the gaster, then it sags and everything is still
  bite.gasterPitch += 7 * ring(t, TM.dies, 5, 0.12) - 7 * ss(t, TM.dies + 0.05, TM.dies + 0.6);
  if (t < B_IN) return blendState(walk2(W_END), bite, ss5(t, W_END, B_IN));
  return bite;
};

// ------------------------------------------------------------------ the fungus on ant #2
export const SP2: StalkSpec = {seed: 11, len: 18, bend: 0.85, lean: -0.1, nape: true};
export const fungus2 = (t: number) => ({
  e: ss(t, TM.but + 0.1, TM.started - 0.1),
  teth: ss(t, TM.but, TM.started + 0.3),
  // (final pass) continuous growth from the bud to full length: no plateau
  g: keyS(t, [[TM.started - 0.2, 0], [TM.because + 0.3, 0.16], [TM.head + 0.1, 1]], (x) => x),
  asc: ss(t, TM.head - 1.1, TM.finally),
  open: ss(t, TM.finally + 0.1, TM.opens + 0.25),
});
/** day and night passing during the time-lapse (1 = day) */
export const daysAt = (t: number) => {
  if (t < TM.because || t > TM.head + 0.3) return 1;
  const u = (t - TM.because) / (TM.head + 0.3 - TM.because);
  return 1 - 0.45 * Math.sin(Math.PI * u * 3) ** 2;
};

// ------------------------------------------------------------------ the ants below ant #2, and the spores onto them
export const ANT3_T = {start: 21.6, land: TM.below + 0.25};
const PATH3 = [straight([-46, 14, 1.6], [30, 14, 1.6], [1, 0, 0], [0, 0, 1])];
const s3 = (t: number) => 4 + 9 * (t - ANT3_T.start);
export const ant3State = (t: number): AntState => {
  const bodyAt = (q: number) => pathPose(PATH3, q);
  const s = s3(t);
  const body = yawF(bob(bodyAt(s), s), 5 * noise1(t * 2, 21));
  const st: AntState = {body, headPitch: 15, headYaw: 6 * noise1(t * 2.5, 22), mand: 0.15, antSpread: 0.8, antTw: [10 * noise1(t * 5, 23), 10 * noise1(t * 5, 24)], legs: [], gasterPitch: 5, dead: 0};
  st.legs = gaitLegs(st, bodyAt, s, floorS);
  return st;
};
const PATH5 = [straight([24, 30, 1.6], [-60, 26, 1.6], [-1, -0.05, 0], [0, 0, 1])];
export const ant5State = (t: number): AntState => {
  const bodyAt = (q: number) => pathPose(PATH5, q);
  const s = 8 * (t - 21.5);
  const body = bob(bodyAt(s), s);
  const st: AntState = {body, headPitch: 15, headYaw: 5 * noise1(t * 2.5, 32), mand: 0.15, antSpread: 0.8, antTw: [10 * noise1(t * 5, 33), 10 * noise1(t * 5, 34)], legs: [], gasterPitch: 5, dead: 0};
  st.legs = gaitLegs(st, bodyAt, s, floorS);
  return st;
};
export const LAND3: V3 = [-0.55, 0.45, 0.66];
/** the cushion of ant #2 (at full growth) and its openings */
const asc2 = () => ascoma(stalkLine(solve(ant2State(22)), SP2), 1, 1);
/** spores shot from ant #2's cushion: a few puffs; one of them falls onto ant #3 */
export const SPORE2 = {t0: TM.releases - 0.05, hero: TM.spores - 0.05};
export const burst2 = (t: number) => {
  const out: {p: V3; d: V3; a: number}[] = [];
  if (t < SPORE2.t0 || t > 30.6) return out;
  const A = asc2();
  const os = ostioles(A);
  for (let k = 0; k < 34; k++) {
    const te = SPORE2.t0 + (k % 17) * 0.11 + Math.floor(k / 17) * 0.05;
    if (t < te) continue;
    const tau = t - te;
    const O = os[(k * 5) % os.length];
    const v0 = norm3(add3(A.out, [Math.sin(k * 2.1) * 0.7, Math.cos(k * 1.3) * 0.7, -0.2]));
    const p = add3(add3(O, mul3(v0, 3.2 * (1 - Math.exp(-tau / 0.13)))), [Math.sin(tau * 2.4 + k) * 1.2, Math.cos(tau * 1.9 + k) * 0.8, -6.5 * tau]);
    if (p[2] < 0.2) continue;
    out.push({p, d: norm3(add3(v0, [0, 0, -1.6 * Math.min(1, tau * 4)])), a: clamp(1 - tau / 3.2)});
  }
  return out;
};
export const heroSpore2 = (t: number): {p: V3; d: V3; on: boolean} | null => {
  if (t < SPORE2.hero) return null;
  if (t >= ANT3_T.land) {
    const st = ant3State(t);
    return {p: toW(st.body, LAND3), d: st.body.f, on: true};
  }
  const A = asc2();
  const O = ostioles(A)[6];
  const Lp = toW(ant3State(ANT3_T.land).body, LAND3);
  const tt = t - SPORE2.hero, T = ANT3_T.land - SPORE2.hero;
  const u = tt < 0.14 ? 0.1 * (1 - (1 - tt / 0.14) ** 2) : 0.1 + 0.9 * (1 - (1 - (tt - 0.14) / (T - 0.14)) ** 1.4);
  const P1 = add3(O, mul3(A.out, 3)), P2v = add3(Lp, [2, -1, 9]);
  const b = (x: number): V3 => {
    const m = 1 - x;
    return add3(add3(mul3(O, m * m * m), mul3(P1, 3 * m * m * x)), add3(mul3(P2v, 3 * m * x * x), mul3(Lp, x * x * x)));
  };
  const p = b(u), q = b(Math.min(1, u + 0.01));
  return {p: add3(p, [0.8 * Math.sin(tt * 5) * u * (1 - u) * 4, 0, 0]), d: norm3(sub3(q, p)), on: false};
};

// ------------------------------------------------------------------ sound events after the hook (tools/make_audio.py)
export const EVENTS2: Record<string, number> = {
  germ: INF.germ0, // the germ tube pierces the cuticle
  spread0: INF.net0, // the network spreads
  spread1: INF.net1,
  spasm0: SPASMS[0],
  spasm1: SPASMS[1],
  spasm2: SPASMS[2],
  spasm3: SPASMS[3],
  walk2b0: 8.2, // the compelled walk and the climb
  walk2b1: W_END,
  onLeaf: 10.2, // it reaches the underside of the leaf
  contact2: TC2, // the jaws meet the vein
  hard: TM.hard, // the grip tightens
  release: TM.go - 0.05, // the legs let go; the body drops to hang
  dies: TM.dies,
  teth0: TM.but, // mycelium breaks out of the joints
  emerge2: TM.but + 0.4, // the back of the head splits
  bud: TM.started + 0.05, // the stalk bud pushes out
  grow2a: TM.because,
  grow2b: TM.head + 0.1,
  open2: TM.opens, // the cushion opens
  spore2: SPORE2.t0,
  hero2: SPORE2.hero,
  land3: ANT3_T.land,
  ants3: 23.9, // the ants walking below
  reveal: TM.there, // the graveyard opens out
};
