// V6 timeline. Every beat is keyed to the measured narration (data/timeline.json via word()). Worlds: 'arm' (the
// character, cm), 'fibre' (the muscle bundle, u), 'cow' (cm), 'lab' (cm), and 'match' (the bundle's curved surface
// dissolving into the cow's shoulder line). One continuous story:
//
//   0.00-0.62  tight on his face and flexed biceps (already big): the biceps' contour swells; his eyes follow it, his
//              brows rise, then delighted disbelief
//   0.00-1.55  one forward move toward the swelling muscle; from 0.84 the skin thins away from the biceps (a soft tissue
//              reveal that spreads to the whole frame): inside the muscle by about 1.5 s
//   1.55-4.15  one bundle fills the frame and thickens; its boundaries spread ("WAY bigger")
//   4.15-7.25  close on its surface: one pink myostatin beside it ("It's called MYOSTATIN"), docking into one receptor
//              ("BRAKE"); the expansion slows and stops; hold
//   7.25-8.60  pull back; the bundle's curved surface dissolves into a cow's shoulder line; out to the whole animal (an
//              ordinary build), which lifts its head
//   10.05-10.68 "their muscles grow": shoulder, hindquarters and neck thicken; the belly stays lean
//   10.9-12.45 the new build moves: a weight shift and one heavy step; the camera moves in on the shoulder and quarters
//   12.52-14.25 the scientist dispenses a drop onto a muscle sample; the camera goes into it
//   14.25-15.90 the same muscle environment: the teal inhibitor wraps the pink myostatin ("block"); it cannot dock;
//              the receptor stays empty and the fibres thicken; pull back on the thickened bundle
//   15.92-20.20 already gripping: confident; one continuous curl attempt that slows into strain; a disappointed glance at
//              his biceps
//   20.20-24.57 he lowers the weight, raises the arm into the flex ("looking SUPERHUMAN"); the camera closes in to the
//              opening's exact framing and rig state (the loop: the swell starts again at frame 0)
import {P, add, mul, pt, sub} from './core/geo';
const dot = (a: P, b: P) => a.x * b.x + a.y * b.y;
import {FPS, FRAMES, DUR, clamp, keyS, lerp, ss, ss5, word} from './lib';
import {ArmState, Face, PersonState, armFrame, headFor} from './art/person';
import {FibreState, INH_BOTTOM, dockPoint, topY} from './art/fibre';
import {CowState} from './art/cow';
import {SAMPLE, SciState, sciNeedle} from './art/lab';

const w = word;
export const T = {
  blocked: w('blocked').start, protein: w('protein').start, way: w('WAY').start, bigger: w('bigger').start, biggerEnd: w('bigger').end,
  its: w("It's").start, myostatin: w('myostatin').start, myoEnd: w('myostatin').end, acts: w('acts').start, brake: w('brake').start, growthEnd: w('growth').end,
  but: w('But').start, animals: w('animals').start, born: w('born').start, brake2: w('brake', 1).start, brake2End: w('brake', 1).end,
  and2: w('and', 1).start, muscles2: w('muscles', 1).start, grow2: w('grow', 1).start, freak: w('freakishly').start, huge: w('huge').start, hugeEnd: w('huge').end,
  sci: w('Scientists').start, drugs: w('drugs').start, block: w('block').start, inW: w('in').start, humans: w('humans').start, humansEnd: w('humans').end,
  but2: w('But', 1).start, weird: w('weird').start, partEnd: w('part').end,
  bigger2: w('bigger', 1).start, strength: w('strength').start, strengthEnd: w('strength').end,
  so: w('So').start, looking: w('looking').start, superhuman: w('superhuman').start, without2: w('without', 1).start, strongEnd: w('strong').end,
};
export const LAST = (Math.round(DUR * FPS) - 1) / FPS;
export const LOOP_T = FRAMES / FPS;
export const EV = {
  grow0: 0.04, grow1: 0.62, reveal0: 0.84, inside: 1.55,
  close0: 4.15, close1: 4.75, myoIn: 4.3, dock: 6.14, docked: 6.36, stop: 6.85,
  back0: 7.25, back1: 7.62, mix0: 7.46, mix1: 7.8, cowFull: 8.6, headUp0: 8.45, headUp1: 9.2, tail0: 9.05,
  grow2a: 10.05, grow2b: 10.68, shift0: 10.95, step0: 11.35, step1: 11.9, cutLab: T.sci,
  press: 12.95, dropFall: 13.24, dropLand: 13.38, labIn0: 13.62, labIn1: 14.25,
  wrap0: 14.46, wrap1: 14.68, contact: 14.86, away: 15.0, out0: 15.25, out1: 15.88, cutGym: T.but2,
  lift0: T.bigger2, slow: 18.3, strain0: 19.1, glance0: 19.86, glance1: 20.4, lower0: 20.2, lower1: 20.92, release: 20.95, raise0: 21.0, raise1: 21.9,
  doubt0: 22.25, doubt1: 23.0, settle: 23.7,
};

// ---------------------------------------------------------------- the character
export const S_FLEX = pt(-4, -84);
const FLEX_A1 = -0.08, FLEX_A2 = 1.68;
const S_CURL = pt(-6, -80.6);
const CURL_A1 = Math.PI / 2 + 0.03, CURL_A2 = 0.06;
/** the arm's size at the loop seam (and through the strength scene), and after the opening swell */
export const M_A = 0.84, M_B = 1.22;
export const massHook = (tau: number) => (tau <= 0 ? M_A : M_A + (M_B - M_A) * ss5(tau, EV.grow0, EV.grow1));
const hookC = (tau: number) => 0.8 + 0.12 * ss(tau, 0.05, 0.6);
/** the hook's clock: t at the start, t - LOOP_T once the arm is back in the flex at the end */
const hookTau = (t: number) => (t >= EV.raise1 ? t - LOOP_T : t);
export const inHook = (t: number) => t < EV.inside + 0.3 || t >= EV.raise1;
const flexArm = (tau: number): ArmState => {
  const m = massHook(tau), c = hookC(tau);
  return {S: S_FLEX, a1: FLEX_A1, a2: FLEX_A2 + 0.05 * c, m, c, tear: 0, pops: tau > 0.25 && tau < 0.85 ? (tau - 0.25) / 0.6 : 0, stretch: clamp((m - 0.45) / 0.65), xray: 0, grip: false, t: tau};
};
/** where the reveal opens, on the swollen biceps, and the micro world's mapping into the arm */
export const REVEAL_C = (() => armFrame(flexArm(1)).UA(0.56, 0.42))();
export const K_ARM = 0.0028, ARM_ROLL = FLEX_A1;
export const revealR = (tau: number) => (tau < EV.reveal0 ? 0 : 2.4 * Math.exp(6.2 * (tau - 0.92)) * ss(tau, EV.reveal0, EV.reveal0 + 0.12));
// the curl: one continuous attempt (fast start, slowing, nearly stalled under strain), then lowered
const curlA2 = (t: number) => keyS(t, [[EV.lift0, CURL_A2], [EV.slow, 0.86], [EV.strain0, 1.18], [EV.lower0, 1.3], [EV.lower1, CURL_A2]], (x) => x);
const curlEase = (t: number) => {
  // velocity-continuous through the attempt: ease out of the start, then slower and slower
  if (t <= EV.lift0) return CURL_A2;
  if (t >= EV.lower0) {
    const u = ss(t, EV.lower0, EV.lower1);
    return lerp(1.3, CURL_A2, u);
  }
  const u = (t - EV.lift0) / (EV.lower0 - EV.lift0);
  return CURL_A2 + (1.3 - CURL_A2) * (1 - (1 - u) ** 2.6);
};
void curlA2;
const setAt = (t: number) => ss(t, 16.35, 16.9) * (1 - ss(t, EV.lift0 - 0.1, EV.lift0 + 0.2));
const breathAt = (t: number) => Math.sin(Math.PI * clamp((t - 17.05) / 0.6)) * (t > 17.05 && t < 17.65 ? 1 : 0);
const strainAt = (t: number) => ss(t, EV.slow - 0.1, EV.strain0 + 0.1) * (1 - ss(t, EV.lower0 + 0.1, EV.lower1));
const curlArm = (t: number): ArmState => {
  const a2 = curlEase(t);
  const st = strainAt(t);
  const lift = ss(t, EV.lift0, EV.lift0 + 0.3) * (1 - ss(t, EV.lower0, EV.lower1));
  // before the lift: he sits up and sets his shoulder, takes a breath; then the attempt
  return {S: add(S_CURL, pt(0.6 * setAt(t), -1.4 * st - 1.3 * setAt(t) - 0.8 * breathAt(t))), a1: CURL_A1 - 0.04 * lift + 0.03 * setAt(t), a2, m: M_A, c: 0.3 + 0.62 * st + 0.2 * lift, tear: 0, pops: 0, stretch: 1, xray: 0, grip: t < EV.release, gripK: lerp(0.55, 1, ss(t, EV.cutGym + 0.05, EV.cutGym + 0.45)) + 0.2 * st, t};
};
const lerp2 = (a: P, b: P, u: number) => pt(lerp(a.x, b.x, u), lerp(a.y, b.y, u));
export const armAt = (t: number): ArmState => {
  if (t < EV.inside + 0.3 || t >= EV.raise1) {
    const tau = hookTau(t);
    const a = flexArm(tau);
    const r = revealR(tau);
    if (tau > 0 && r > 0.01) a.reveal = {c: REVEAL_C, r, ang: ARM_ROLL};
    return a;
  }
  if (t >= EV.raise0) {
    // from the lowered weight up into the opening's flex (its size is the same throughout)
    const u = ss5(t, EV.raise0, EV.raise1);
    const h = curlArm(EV.raise0), f = flexArm(-1);
    return {...f, S: lerp2(h.S, f.S, u), a1: lerp(h.a1, f.a1, u), a2: lerp(h.a2, f.a2, u), c: lerp(h.c, f.c, u), grip: false};
  }
  return curlArm(t);
};
const REST = (() => {
  const g0 = armFrame({S: S_CURL, a1: CURL_A1, a2: CURL_A2, m: M_A, c: 0, tear: 0, stretch: 1, xray: 0, grip: true, t: 0});
  return add(g0.W, mul(g0.f, 4.6));
})();
export const dumbbellAt = (t: number, a: ArmState): P => {
  if (t < EV.lift0 || t > EV.lower1) return REST;
  const g = armFrame(a);
  const h = add(g.W, mul(g.f, 4.6));
  return pt(h.x, Math.min(REST.y, h.y));
};
// faces. The hook face runs on the hook clock, so the last frames hand over to frame 0 exactly.
const PROUD: Face = {brow: 0.05, eyes: 0.62, mouth: 0, strain: 0, look: pt(0.9, 0.15), smile: 0.45};
const hookFace = (tau: number): Face => {
  if (tau <= 0) return PROUD;
  const follow = ss(tau, 0.04, 0.42), brows = ss(tau, 0.18, 0.42), joy = ss(tau, 0.42, 0.78);
  // the eyes follow the swelling along the arm; the brows rise; then delighted disbelief (wide eyes, raised brows, an
  // open grin)
  return {
    brow: lerp(PROUD.brow, 1.15, brows) - 0.1 * joy, eyes: lerp(PROUD.eyes, 1, brows), mouth: 0.45 * brows * (1 - joy), strain: 0,
    look: lerp2(PROUD.look, pt(1, 0.45), follow), smile: PROUD.smile! * (1 - brows), grin: 0.95 * joy,
  };
};
const CONF: Face = {brow: -0.12, eyes: 0.62, mouth: 0, strain: 0, look: pt(0.55, 0.85), smile: 0.8, quiz: 0.25};
const DISAPPOINTED: Face = {brow: -0.12, eyes: 0.48, mouth: 0, strain: 0, look: pt(-0.2, 0.95), concern: 1};
const mixFace = (a: Face, b: Face, u: number): Face => ({
  brow: lerp(a.brow, b.brow, u), eyes: lerp(a.eyes, b.eyes, u), mouth: lerp(a.mouth, b.mouth, u), strain: lerp(a.strain, b.strain, u), look: lerp2(a.look, b.look, u),
  smile: lerp(a.smile ?? 0, b.smile ?? 0, u), grin: lerp(a.grin ?? 0, b.grin ?? 0, u), concern: lerp(a.concern ?? 0, b.concern ?? 0, u), quiz: lerp(a.quiz ?? 0, b.quiz ?? 0, u),
});
export const faceAt = (t: number): Face => {
  if (t < EV.inside + 0.3) return hookFace(t);
  if (t >= EV.settle) return hookFace(t - LOOP_T);
  // gripping, confident, a glance up to us (expecting an easy lift), back to the weight
  const toCam: Face = {...CONF, look: pt(-0.3, 0.05), smile: 0.95, brow: 0.1};
  let f = mixFace(CONF, toCam, ss(t, 16.45, 16.75) * (1 - ss(t, 17.25, 17.55)));
  // the weight is slower than expected: surprise, then concentrated strain
  const surprise: Face = {brow: 0.75, eyes: 0.92, mouth: 0.15, strain: 0, look: pt(0.4, 0.9), smile: 0};
  const strain: Face = {brow: -0.05, eyes: 0.42, mouth: 0, strain: 1, look: pt(0.4, 0.85)};
  f = mixFace(f, surprise, ss(t, EV.slow - 0.1, EV.slow + 0.25));
  f = mixFace(f, strain, ss(t, EV.slow + 0.35, EV.strain0));
  // a disappointed glance at the oversized biceps
  f = mixFace(f, DISAPPOINTED, ss(t, EV.glance0 - 0.05, EV.glance1));
  // flexing: proud again ("looking SUPERHUMAN"), a flicker of doubt, then the opening's proud look at the biceps
  const flexProud: Face = {...PROUD, smile: 0.7};
  f = mixFace(f, flexProud, ss(t, EV.raise0 + 0.2, EV.raise1));
  const doubt: Face = {brow: 0.2, eyes: 0.55, mouth: 0, strain: 0, look: pt(0.3, 0.8), smile: 0.2, concern: 0.55};
  f = mixFace(f, doubt, ss(t, EV.doubt0, EV.doubt0 + 0.3) * (1 - ss(t, EV.doubt1, EV.settle)));
  return mixFace(f, PROUD, ss(t, EV.doubt1, EV.settle));
};
const BUILD = 1.0;
const hookTilt = (tau: number) => -6 + 3 * ss(tau, 0.1, 0.45) - 3 * ss(tau, 0.45, 0.8);
export const personAt = (t: number): PersonState => {
  const arm = armAt(t);
  let tilt: number;
  if (t < EV.inside + 0.3) tilt = hookTilt(t);
  else if (t >= EV.raise1) tilt = hookTilt(t - LOOP_T);
  else {
    tilt = lerp(2, 7, ss(t, EV.slow, EV.strain0)) + 5 * ss(t, EV.glance0, EV.glance1) - 4 * ss(t, 16.45, 16.75) * (1 - ss(t, 17.25, 17.6));
    tilt = lerp(tilt, hookTilt(-1), ss(t, EV.raise0, EV.raise1));
  }
  return {arm, hip: pt(-10, -40), lean: 0, head: headFor(arm.S, BUILD), headTilt: tilt, face: faceAt(t), t, xray: 0, farArm: 0, build: BUILD};
};

// ---------------------------------------------------------------- the muscle bundle (both visits)
const integrate = (t0: number, t: number, rate: (t: number) => number) => {
  let g = 0;
  const n = Math.max(1, Math.round((t - t0) * 120));
  for (let i = 0; i < n; i++) g += rate(t0 + ((i + 0.5) * (t - t0)) / n) * ((t - t0) / n);
  return g;
};
const rate1 = (t: number) => keyS(t, [[0.9, 0.02], [1.6, 0.05], [2.4, 0.08], [T.way, 0.16], [T.biggerEnd, 0.1], [EV.close0, 0.13], [EV.dock, 0.17], [EV.docked, 0.07], [EV.stop, 0]]);
const rate2 = (t: number) => keyS(t, [[EV.contact, 0], [EV.away, 0.16], [15.25, 0.34], [EV.out1, 0.26]]);
export const visit = (t: number): 1 | 2 => (t < 10 ? 1 : 2);
export const gAt = (t: number) => (visit(t) === 1 ? 1 + integrate(0.9, Math.max(0.9, Math.min(t, 7.9)), rate1) : 1 + integrate(EV.contact, Math.max(EV.contact, t), rate2));
const bez = (a: P, c: P, b: P, u: number) => pt((1 - u) ** 2 * a.x + 2 * (1 - u) * u * c.x + u * u * b.x, (1 - u) ** 2 * a.y + 2 * (1 - u) * u * c.y + u * u * b.y);
export const fibreAt = (t: number): FibreState => {
  const g = gAt(t);
  const rec = pt(0, topY(g));
  const dock = dockPoint(rec);
  const rel = (x: number, y: number) => add(rec, pt(x, y));
  if (visit(t) === 1) {
    const recOp = ss(t, EV.close0, EV.close0 + 0.35);
    if (t < EV.myoIn - 0.05) return {t, g, recOp};
    // one protein, beside the surface, drifting to the receptor; it docks on "brake" and stays
    const u = clamp((t - EV.myoIn) / (EV.dock - EV.myoIn));
    const start = rel(-175, -235), mid = rel(-150, -70);
    const above = add(dock, pt(0, -46));
    let p = bez(start, mid, above, ss(u, 0, 1) * 0.15 + 0.85 * (1 - (1 - u) ** 1.6));
    if (t >= EV.dock) p = lerp2(above, dock, ss(t, EV.dock, EV.docked));
    const ang = t < EV.dock ? 0.16 * Math.sin((t - EV.myoIn) * 2.1) * (1 - ss(u, 0.7, 1)) - 0.25 * (1 - ss(u, 0, 0.8)) : 0;
    return {t, g, recOp, myo: {p, ang, op: clamp((t - EV.myoIn + 0.05) / 0.3)}};
  }
  // visit 2: the protein heads for the receptor; the inhibitor wraps it on "block"; the pair cannot seat, bumps the rim
  // and drifts away; the receptor stays empty
  const start = rel(-200, -300), meet = rel(-70, -175);
  let p: P;
  if (t < EV.wrap0) p = lerp2(start, meet, ss(t, EV.labIn1 - 0.4, EV.wrap0 + 0.06) * 1.0);
  else if (t < EV.contact) p = lerp2(lerp2(start, meet, ss(EV.wrap0, EV.labIn1 - 0.4, EV.wrap0 + 0.06)), rel(-8, -INH_BOTTOM - 4), ss(t, EV.wrap0, EV.contact));
  else {
    const c0 = rel(-8, -INH_BOTTOM - 4);
    const bounce = 12 * Math.sin(Math.PI * clamp((t - EV.contact) / 0.22)) * (t < EV.contact + 0.22 ? 1 : 0);
    const drift = ss(t, EV.away, EV.out1 + 0.2);
    p = add(c0, pt(-190 * drift, -bounce - 260 * drift));
  }
  const iStart = rel(280, -470);
  const ip = t < EV.wrap0 ? lerp2(iStart, add(p, pt(0, -6)), ss(t, EV.labIn1 - 0.35, EV.wrap0)) : p;
  const ang = t < EV.contact ? 0.12 * Math.sin(t * 2.4) : -0.15 * ss(t, EV.away, EV.out1);
  return {t, g, myo: {p, ang, op: 1}, inh: {p: ip, ang, op: clamp((t - (EV.labIn1 - 0.45)) / 0.2), wrap: ss(t, EV.wrap0, EV.wrap1)}};
};

// ---------------------------------------------------------------- the cow and the lab
export const cowAt = (t: number): CowState => {
  const mu = ss5(t, EV.grow2a, EV.grow2b);
  const back = -3 * ss(t, EV.shift0, EV.shift0 + 0.35) * (1 - ss(t, EV.step0, EV.step0 + 0.3));
  const fwd = 9 * ss(t, EV.step0, EV.step1 + 0.1);
  const land = 1.2 * ss(t, EV.step1 - 0.1, EV.step1) * (1 - ss(t, EV.step1, EV.step1 + 0.4));
  return {
    mu, bx: back + fwd, by: land, step: clamp((t - EV.step0) / (EV.step1 - EV.step0)), stepDx: 17,
    head: 14 * (1 - ss(t, EV.headUp0, EV.headUp1)) + 3 * land, tail: Math.sin(Math.PI * 2 * clamp((t - EV.tail0) / 0.7)) * (t > EV.tail0 && t < EV.tail0 + 0.7 ? 1 : 0),
    breathe: Math.sin(t * 2.2), t,
  };
};
export const sciAt = (t: number): SciState => {
  const press = ss(t, EV.press, EV.press + 0.4);
  const lean = ss(t, EV.cutLab - 0.1, EV.press);
  const tip = sciNeedle({t, press, lean, drop: 0, dropY: 0, ripple: 0, glow: 0});
  const form = ss(t, EV.press + 0.05, EV.dropFall);
  const fall = clamp((t - EV.dropFall) / (EV.dropLand - EV.dropFall));
  const dropY = t < EV.dropFall ? tip.y + 0.4 * form : lerp(tip.y + 0.4, SAMPLE.y - 0.3, fall * fall);
  return {t, press, lean, drop: t < EV.dropLand ? form : 0, dropY, ripple: clamp((t - EV.dropLand) / 0.45), glow: 0};
};
export const K_LAB = 0.0006;

// ---------------------------------------------------------------- the camera
export type Cam = {x: number; y: number; w: number};
export type World = 'arm' | 'fibre' | 'cow' | 'lab' | 'match';
export type WCam = Cam & {world: World; roll?: number; cam2?: Cam; mix?: number};
export const zoomAbout = (u: number, A: Cam, B: Cam, ease: (x: number) => number = (x) => ss5(x, 0, 1)): Cam => {
  const e = ease(clamp(u));
  const wv = Math.exp(lerp(Math.log(A.w), Math.log(B.w), e));
  if (Math.abs(A.w - B.w) < 1e-9) return {x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), w: wv};
  const P0 = pt((A.x / A.w - B.x / B.w) / (1 / A.w - 1 / B.w), (A.y / A.w - B.y / B.w) / (1 / A.w - 1 / B.w));
  return {x: P0.x + (A.x - P0.x) * (wv / A.w), y: P0.y + (A.y - P0.y) * (wv / A.w), w: wv};
};
type Key = [number, Cam, ((x: number) => number)?];
const glide = (t: number, keys: Key[]): Cam => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, A] = keys[i - 1], [t1, B, e] = keys[i];
      return zoomAbout((t - t0) / (t1 - t0), A, B, e);
    }
  }
  return keys[keys.length - 1][1];
};
// micro <-> host mappings (the arm's is rotated so the fibres run along the upper arm)
const rotP = (p: P, a: number) => pt(p.x * Math.cos(a) - p.y * Math.sin(a), p.x * Math.sin(a) + p.y * Math.cos(a));
export const toHost = (c: Cam, origin: P, k: number, a = 0): Cam => {
  const q = add(origin, mul(rotP(pt(c.x, c.y), a), k));
  return {x: q.x, y: q.y, w: c.w * k};
};
export const toMicro = (c: Cam, origin: P, k: number, a = 0): Cam => {
  const q = rotP(mul(sub(pt(c.x, c.y), origin), 1 / k), -a);
  return {x: q.x, y: q.y, w: c.w / k};
};
/** the opening (and the loop seam): his face and the flexed biceps, the biceps' peak at the centre right */
export const TIGHT0: Cam = (() => {
  const p = armFrame(flexArm(0)).UA(0.6, 1);
  return {x: p.x - 4, y: p.y - 3.5, w: 39};
})();
const M_BUNDLE: Cam = {x: 0, y: 0, w: 860};
const IN_ARM = toHost(M_BUNDLE, REVEAL_C, K_ARM, ARM_ROLL);
const hookCam = (tau: number): Cam => zoomAbout(tau / EV.inside, TIGHT0, IN_ARM, (x) => ss5(x * x, 0, 1));
const closeCam = (gDock: number, w0: number, below: number): Cam => ({x: -12, y: topY(gDock) - below * w0 * (16 / 9), w: w0});
const C1 = closeCam(1.53, 440, 0.08);
const C2 = closeCam(1.0, 440, 0.12);
const WIDE1: Cam = {x: 0, y: -300, w: 1000};
// the cow: the match framing puts the withers where the bundle's crest is on screen
const MATCH_SCREEN_Y = 960 + (topY(1.56) - 7 * 1.12 - WIDE1.y) * (1080 / WIDE1.w);
const COW_MATCH: Cam = (() => {
  const wv = 130;
  return {x: 44, y: -151 - (MATCH_SCREEN_Y - 960) * (wv / 1080), w: wv};
})();
const COW_FULL: Cam = {x: 6, y: -110, w: 330};
const COW_HOLD: Cam = {x: 4, y: -108, w: 334};
const COW_IN: Cam = {x: -4, y: -104, w: 292};
const LAB_WIDE: Cam = {x: -4, y: -40, w: 68};
const LAB_HANDS: Cam = {x: 11, y: -16, w: 38};
const LAB_DISH: Cam = {x: 14, y: -5.5, w: 20};
const CURL_A: Cam = {x: 4, y: -57, w: 94};
const FLEX_MED: Cam = {x: 6, y: -90, w: 54};
export const camAt = (t: number): WCam => {
  if (t < EV.inside) {
    const c = hookCam(t);
    const a = armAt(t);
    void a;
    return {...c, world: 'arm'};
  }
  const fibreKeys: Key[] = [[EV.inside, M_BUNDLE], [EV.close0, {x: 0, y: -6, w: 850}], [EV.close1, C1], [EV.back0, C1], [EV.back1, WIDE1]];
  if (t < EV.mix0) return {...glide(t, fibreKeys), world: 'fibre', roll: ARM_ROLL * (1 - ss(t, 1.75, 2.7))};
  if (t < EV.mix1) {
    // the bundle's crest dissolves into the cow's withers line (both cameras keep pulling back)
    const c1 = t < EV.back1 ? glide(t, fibreKeys) : zoomAbout((t - EV.back1) / (EV.mix1 - EV.back1), WIDE1, {...WIDE1, w: WIDE1.w * 1.12}, (x) => x);
    const c2 = zoomAbout((t - EV.mix0) / (EV.cowFull - EV.mix0), COW_MATCH, COW_FULL, (x) => 1 - (1 - x) ** 2.2);
    return {...c1, world: 'match', cam2: c2, mix: ss(t, EV.mix0, EV.mix1)};
  }
  if (t < EV.cutLab) {
    if (t < EV.cowFull) return {...zoomAbout((t - EV.mix0) / (EV.cowFull - EV.mix0), COW_MATCH, COW_FULL, (x) => 1 - (1 - x) ** 2.2), world: 'cow'};
    return {...glide(t, [[EV.cowFull, COW_FULL], [EV.grow2a - 0.1, COW_HOLD], [EV.shift0, COW_HOLD], [EV.cutLab, COW_IN]]), world: 'cow'};
  }
  if (t < EV.labIn1) {
    if (t < EV.labIn0) return {...glide(t, [[EV.cutLab, LAB_WIDE], [EV.press, LAB_HANDS], [EV.labIn0, LAB_DISH]]), world: 'lab'};
    const B = toHost(C2, SAMPLE, K_LAB);
    return {...zoomAbout((t - EV.labIn0) / (EV.labIn1 - EV.labIn0), LAB_DISH, B, (x) => ss5(x, 0, 1)), world: 'lab'};
  }
  if (t < EV.cutGym) return {...glide(t, [[EV.labIn1, C2], [EV.out0, C2], [EV.out1, {x: 0, y: -120, w: 980}]]), world: 'fibre'};
  // the strength scene, then up into the flex and in to the opening framing
  const keys: Key[] = [
    [EV.cutGym, CURL_A],
    [EV.lift0, {x: 3, y: -59, w: 88}],
    [EV.strain0, {x: 2, y: -68, w: 80}],
    [EV.glance1, {x: 0, y: -72, w: 76}],
    [EV.raise1, FLEX_MED],
    [LOOP_T, TIGHT0],
  ];
  return {...glide(t, keys), world: 'arm'};
};
/** is the screen point (world p) inside the upper arm's silhouette? */
export const insideUpper = (a: ArmState, p: P) => {
  const g = armFrame(a);
  const d = sub(p, a.S);
  const s = dot(d, g.u) / 31, v = dot(d, g.an);
  return s > 0.1 && s < 0.95 && v < g.ra(s) * 0.97 && v > -g.rp(s) * 0.97;
};
