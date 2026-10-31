// V5 timeline: every beat keyed to the measured narration (data/timeline.json via word()), the state of every subject
// at time t, and one camera. Worlds: 'arm' (the character, cm), 'micro' (muscle, u), 'cross' (the muscle cut across,
// u), 'bull' (cm), 'lab' (cm). A dive or pull-out between worlds is one zoom about a fixed point, defined in the deeper
// world and mapped into the outer one through the window it passes; the outer world is dropped once that window covers
// the frame. One continuous narrative:
//
//   0.00-0.25  the flexed arm is already growing (camera composed on the biceps and his face)
//   0.25-0.80  the biceps balloons, the sleeve stretches, he reacts
//   0.80-1.40  the camera approaches the swelling muscle; 1.40-1.85 through the skin into the fibres
//   1.85-3.90  between recognisable fibres; settle on one: its nucleus streams building material to the myofibril
//              being assembled, and the fibre widens ("WAY bigger")
//   4.05-5.35  one myostatin molecule, followed toward a receptor; 5.35 it binds
//   5.50-6.35  the signal runs into the cell to the nucleus; its stream stops; assembly stops ("brake")
//   6.45-7.25  the fibre tries to thicken, twice, and is held back ("on muscle growth")
//   7.20-7.85  "But some animals": the camera travels down through a sheet of connective tissue into another muscle,
//              whose fibres are far larger and have no signal (born without the brake); they thicken
//   8.55-9.60  out through the tissue and a window in the shoulder to the cow; it stands in its field, shifting its
//              weight and moving its head; a heavier shift on "huge"
//   12.52-14.20 the lab: the scientist dispenses treatment from a syringe onto a sample; the camera follows the drop in
//   14.20-15.25 the second visit, framed close on one receptor: an antibody catches myostatin before it can bind; no
//              signal; the bundle turns end-on and its fibres thicken
//   15.25-16.30 the camera follows the thickening fibres out through a window in the character's biceps: the enlarged arm
//   16.30-22.92 confident, he grips; the controlled curl strains; inside the elbow the muscle bulges while the bone barely
//              turns; the stall; the weight sinks back
//   22.92-24.57 disappointment: his arm relaxes; he looks at it and flexes; the camera approaches as it begins to swell:
//               the last 1.35 s run on the opening's own clock (the loop)
import {P, add, mul, pt} from './core/geo';
import {DUR, FPS, FRAMES, clamp, easeOut, keyS, lerp, ring, ss, ss5, word} from './lib';
import {ArmState, Face, PersonState, armFrame, headFor, tremorAt} from './art/person';
import {Ab, Cam, MicroState, Myo, NUC_DY, NUC_X, REC_X, R0} from './art/micro';
import {BullState} from './art/bull';
import {SAMPLE, SciState, sciNeedle} from './art/lab';
import {MUSCLE_RX} from './art/micro3d';

const w = word;
export const T = {
  blocked: w('blocked').start, protein: w('protein').start, your: w('your').start, way: w('WAY').start, bigger: w('bigger').start, biggerEnd: w('bigger').end,
  its: w("It's").start, myostatin: w('myostatin').start, myoEnd: w('myostatin').end, acts: w('acts').start, brake: w('brake').start,
  growth: w('growth').start, growthEnd: w('growth').end,
  but: w('But').start, animals: w('animals').start, born: w('born').start, without: w('without').start, brake2: w('brake', 1).start, brake2End: w('brake', 1).end,
  and2: w('and', 1).start, muscles2: w('muscles', 1).start, grow2: w('grow', 1).start, freak: w('freakishly').start, huge: w('huge').start, hugeEnd: w('huge').end,
  sci: w('Scientists').start, developing: w('developing').start, drugs: w('drugs').start, block: w('block').start, inW: w('in').start, humans: w('humans').start, humansEnd: w('humans').end,
  but2: w('But', 1).start, weird: w('weird').start, part: w('part').start, partEnd: w('part').end,
  bigger2: w('bigger', 1).start, dont: w("don't").start, strength: w('strength').start, strengthEnd: w('strength').end,
  so: w('So').start, looking: w('looking').start, superhuman: w('superhuman').start, without2: w('without', 1).start, superW: w('super').start, strongEnd: w('strong').end,
};
export const LAST = (Math.round(DUR * FPS) - 1) / FPS;
export const LOOP_T = FRAMES / FPS;
export const EV = {
  grow0: 0.25, grow1: 0.8, react0: 0.3, react1: 0.85, approach0: 0.8, cut0: 1.3, dive0: 1.4, dive1: 1.85,
  settle: 3.9, lead0: 4.05, bind: 5.35, sig0: 5.5, sig1: 6.05, dome1: 6.48, dome2: 6.88,
  cross0: 7.2, crossSwitch: 7.52, cross1: 7.85, cowOut0: 8.55, cowOut1: 9.6, shift: T.huge, cutLab: T.sci,
  press: 13.28, dropFall: 13.55, dropLand: 13.68, labIn0: 13.62, labIn1: 14.2,
  catch1: 14.3, catch2: T.block, release: 14.62, yaw0: 14.92, yaw1: 15.28, armOut0: 15.25, armOut1: 16.25,
  grip: 16.9, curl0: 17.5, curlTop: 18.9, elbowIn0: 18.15, elbowIn1: 18.6, elbowOut0: 19.55, elbowOut1: 20.5,
  sink0: 22.42, sink1: 22.92, slump0: 22.95, slump1: 23.4, raise0: 23.22, raise1: 23.9,
  // (names used by older passes; not in this cut)
  wipe1: -9, wipe1End: -9, wipe2: -9, wipe2End: -9, out0: -9, out1: -9, cutX: T.inW, xrayOut0: -9, xrayOut1: -9,
};

// ---------------------------------------------------------------- the character
export const S_FLEX = pt(-4, -84);
const FLEX_A1 = -0.08, FLEX_A2 = 1.68;
const S_CURL = pt(-6, -80.6);
const CURL_A1 = Math.PI / 2 + 0.03, CURL_A2 = 0.06;
/** the relaxed big arm (the end) and the pumped one (the rest of the film) */
export const M_REST = 0.72, M_PUMP = 1.16;
/** the hook's mass on its own clock tau (tau = t at the start; t - LOOP_T at the end): starting to rise just before
 *  frame 0, ballooning over 0.25-0.80 */
export const massHook = (tau: number) => M_REST + (M_PUMP - M_REST) * ss5(tau, -0.22, 0.82) + 0.012 * Math.sin(tau * 15) * ss(tau, 0, 0.3) * (1 - ss(tau, 0.8, 1.1));
export const M0 = massHook(0);
const hookTau = (t: number) => (t > EV.raise0 - 0.02 ? t - LOOP_T : t);
export const inHook = (t: number) => t < EV.dive1 + 0.4 || t > EV.raise0 - 0.02;
let WC: P | undefined;
export const hookWindow = (): P => {
  if (!WC) WC = armFrame({S: S_FLEX, a1: FLEX_A1, a2: FLEX_A2 + 0.05 * 0.85, m: massHook(EV.cut0), c: 0.85, tear: 0, stretch: 1, xray: 0, grip: false, t: 0}).UA(0.52, 0.36);
  return WC;
};
const hookC = (tau: number) => 0.45 + 0.4 * ss(tau, 0.15, 0.7);
const flexArm = (tau: number, m: number, c: number, cutR = 0): ArmState => ({
  S: S_FLEX, a1: FLEX_A1, a2: FLEX_A2 + 0.05 * c, m, c, tear: 0, pops: 0, stretch: clamp((m - 0.45) / 0.65), xray: 0, grip: false, t: tau,
  cut: cutR > 0.01 ? {r: cutR, s: 0.52, v: 0.36, c: hookWindow()} : undefined,
});
/** the curl arm; the window the second visit's fibres come out through sits on its biceps */
const curlArm = (t: number): ArmState => {
  const rise = ss(t, EV.curl0, EV.curlTop) * (1 - ss(t, EV.sink0, EV.sink1));
  const strain = ss(t, EV.curl0 - 0.15, EV.curl0 + 0.25) * (1 - ss(t, EV.sink1 - 0.1, EV.sink1 + 0.15));
  const tr = tremorAt(t, 0.016 * strain * (0.6 + 0.4 * ss(t, EV.curlTop - 0.3, EV.curlTop + 0.5)));
  const pulse = t > EV.elbowIn1 && t < EV.elbowOut0 ? 0.16 * Math.max(0, Math.sin((t - EV.elbowIn1) * 2 * Math.PI * 1.4)) : 0;
  const S = add(S_CURL, pt(0, -1.6 * rise));
  const a1 = CURL_A1 - 0.03 * rise + tr, a2 = CURL_A2 + 0.42 * rise + pulse * 0.05 + tr * 1.6;
  const ec = ss(t, EV.elbowIn0 + 0.15, EV.elbowIn1) * (1 - ss(t, EV.elbowOut0, EV.elbowOut0 + 0.28));
  const glow = ss(t, EV.elbowIn1, EV.elbowIn1 + 0.2) * (1 - ss(t, EV.elbowOut0 - 0.1, EV.elbowOut0 + 0.1));
  // disappointment: as the weight settles his arm relaxes and the pump goes out of it
  const m = lerp(M_PUMP, M_REST, ss(t, EV.slump0, EV.slump1));
  return {S, a1, a2, m, c: strain * (0.88 + pulse), tear: 0, pops: 0, stretch: 1, xray: 0, grip: true, gripK: clamp((t - EV.grip) / 0.25), elbowCut: ec, fibreGlow: glow, t};
};
export const ARM_NEST = (() => armFrame(curlArm(EV.armOut0)).UA(0.5, 0.42))();
export const K_ARMX = 5.2 / (MUSCLE_RX + 260); // the whole-muscle cross-section fills a 5.2 cm window in the biceps
export const armWindowR = (t: number) => (t < EV.armOut1 - 0.35 ? 5.2 : 5.2 * (1 - ss(t, EV.armOut1 - 0.35, EV.armOut1 - 0.02)));
export const armAt = (t: number): ArmState => {
  if (inHook(t)) {
    const tau = hookTau(t);
    const m = massHook(tau);
    const cutR = tau > 0 ? 2.7 * ss5(tau, EV.cut0, EV.cut0 + 0.16) : 0;
    const flex = flexArm(tau, m, hookC(tau), cutR);
    flex.pops = tau > 0.35 && tau < 0.95 ? (tau - 0.35) / 0.6 : 0;
    if (tau >= 0) return flex;
    // the end: from the dumbbell, he lifts the relaxed arm into the opening's flex (its size already the opening's)
    const raise = ss5(t, EV.raise0, EV.raise1);
    const hang = curlArm(Math.min(t, EV.raise0));
    if (raise <= 0) return hang;
    return {...flex, S: lerp2(hang.S, S_FLEX, raise), a1: lerp(hang.a1, flex.a1, raise), a2: lerp(hang.a2, flex.a2, raise), m: lerp(hang.m, flex.m, ss(raise, 0, 0.6)), c: lerp(0, flex.c, raise), grip: raise < 0.05, gripK: 1};
  }
  const a = curlArm(t);
  // the second visit comes out through a window on his biceps
  if (t > EV.armOut0 - 0.1 && t < EV.armOut1) {
    const r = armWindowR(t);
    if (r > 0.01) a.cut = {r, s: 0.5, v: 0.42, c: ARM_NEST};
  }
  return a;
};
const lerp2 = (a: P, b: P, u: number) => pt(lerp(a.x, b.x, u), lerp(a.y, b.y, u));
const REST = (() => {
  const a0 = {S: S_CURL, a1: CURL_A1, a2: CURL_A2, m: 1, c: 0, tear: 0, stretch: 1, xray: 0, grip: true, t: 0} as ArmState;
  const g0 = armFrame(a0);
  return add(g0.W, mul(g0.f, 4.6));
})();
export const dumbbellAt = (t: number, a: ArmState): P => {
  if (t > EV.raise0 || t < EV.curl0) return REST;
  const g = armFrame(a);
  const h = add(g.W, mul(g.f, 4.6));
  return pt(h.x, Math.min(REST.y, h.y));
};
/** faces. The hook's face runs on the hook's clock, so the last frames hand over to frame 0 exactly. */
const hookFace = (tau: number): Face => {
  // a proud flex -> shock as it balloons (eyes wide, brows up, mouth open) -> amazement as the camera closes in
  const shock = ss(tau, EV.react0, EV.react0 + 0.2);
  const amaze = ss(tau, EV.react1, EV.react1 + 0.35);
  return {brow: lerp(0.1, 1.25, shock) - 0.25 * amaze, eyes: lerp(0.58, 1, shock), mouth: lerp(0, 0.85, shock) * (1 - 0.45 * amaze), strain: 0, look: lerp2(pt(0.9, 0.1), pt(1, 0.35), ss(tau, 0, 1)), smile: 0.35 * (1 - shock), grin: 0.45 * amaze};
};
const DISAPPOINT: Face = {brow: -0.1, eyes: 0.45, mouth: 0, strain: 0, look: pt(0.6, 0.9), concern: 1};
export const faceAt = (t: number): Face => {
  if (t < EV.dive1 + 0.4) return hookFace(t);
  if (t > EV.raise0 - 0.02) {
    // from disappointment he looks at his arm as it comes up; the face meets the opening's proud look
    const u = ss(t, EV.raise0, EV.raise1 + 0.2);
    const h = hookFace(t - LOOP_T), c = DISAPPOINT;
    return {brow: lerp(c.brow, h.brow, u), eyes: lerp(c.eyes, h.eyes, u), mouth: 0, strain: 0, look: lerp2(c.look, h.look, u), smile: lerp(0, h.smile ?? 0, u), grin: 0, concern: lerp(1, 0, u)};
  }
  // confidence -> strain -> disappointment
  const confident = ss(t, EV.armOut1 - 0.2, EV.armOut1 + 0.2) * (1 - ss(t, EV.curl0 - 0.1, EV.curl0 + 0.15));
  const strain = ss(t, EV.curl0 - 0.05, EV.curl0 + 0.25) * (1 - ss(t, EV.sink1 - 0.1, EV.sink1 + 0.1));
  const surp = ss(t, T.bigger2 - 0.05, T.bigger2 + 0.25) * (1 - ss(t, T.bigger2 + 0.8, T.bigger2 + 1.1));
  const dis = ss(t, EV.sink0 + 0.15, EV.slump0 + 0.1);
  return {
    brow: -0.15 * confident + 0.8 * surp - 0.1 * dis, eyes: 0.55 + 0.4 * surp - 0.2 * strain - 0.1 * dis, mouth: 0, strain: strain * (1 - 0.5 * surp),
    look: dis > 0.01 ? lerp2(pt(0.55, 0.85), DISAPPOINT.look, dis) : pt(0.55, 0.85), smile: 0.75 * confident, grin: 0, concern: dis, quiz: 0.3 * confident,
  };
};
const BUILD = 1.0;
export const personAt = (t: number): PersonState => {
  const arm = armAt(t);
  const tau = hookTau(t);
  // head: follows the swelling muscle, recoils in shock, then leans in; at the end it drops, then lifts to the arm
  const hookTilt = -6 + 3 * ss(tau, 0, 0.3) - 5 * ss(tau, EV.react0, EV.react0 + 0.2) + 4 * ss(tau, EV.react1, EV.react1 + 0.5);
  const tilt = t < EV.dive1 + 0.4 ? hookTilt
    : t > EV.raise0 - 0.02 ? lerp(12, hookTilt, ss(t, EV.raise0, EV.raise1))
    : lerp(lerp(lerp(2, -3, ss(t, EV.armOut1 - 0.2, EV.armOut1 + 0.3)), 8, ss(t, EV.curl0, EV.curl0 + 0.5)), 12, ss(t, EV.sink0, EV.slump1));
  return {arm, hip: pt(-10, -40), lean: 0, head: headFor(arm.S, BUILD), headTilt: tilt, face: faceAt(t), t, xray: 0, farArm: 0, build: BUILD};
};

// ---------------------------------------------------------------- the micro world
export const K_ARM = 0.0004, K_LAB = 0.00045, K_BULLM = 0.0016;
export const microVariant = (t: number): MicroState['variant'] => (t < EV.crossSwitch ? 'human' : t < 12 ? 'bull' : 'dish');
/** the sheet of connective tissue between the two muscles (human world y), and where the cow's muscle sits below it */
export const BAND = {y0: 300, y1: 900}, BULL_SHIFT = 1270;
const integrate = (t0: number, t: number, g0: number, rate: (t: number) => number) => {
  let g = g0;
  const n = Math.max(1, Math.round((t - t0) * 120));
  for (let i = 0; i < n; i++) g += rate(t0 + ((i + 0.5) * (t - t0)) / n) * ((t - t0) / n);
  return g;
};
const rateHuman = (t: number) => keyS(t, [[EV.cut0, 0.45], [2.6, 0.38], [T.way, 0.55], [EV.settle, 0.22], [EV.bind, 0.2], [EV.sig1, 0.03], [EV.sig1 + 0.3, 0]]);
const rateBull = (t: number) => keyS(t, [[EV.crossSwitch, 0.4], [EV.cross1, 1.2], [EV.cowOut0, 0.8], [EV.cowOut1, 0.2]]);
const rateDish = (t: number) => keyS(t, [[EV.release, 0], [EV.release + 0.2, 0.7], [EV.armOut1, 0.3]]);
const FOCUS = 2;
export const microAt = (t: number): MicroState => {
  const variant = microVariant(t);
  const t0 = variant === 'human' ? EV.cut0 : variant === 'bull' ? EV.crossSwitch : 12.5;
  const g0 = variant === 'bull' ? 1.75 : variant === 'dish' ? 1.15 : 1.0;
  const rate = variant === 'human' ? rateHuman : variant === 'bull' ? rateBull : rateDish;
  const g = integrate(t0, t, g0, rate);
  const qOf = (gg: number) => (R0 * gg - 3) / STR;
  const q = qOf(g);
  const rh = R0 * g;
  const nucP = pt(NUC_X, -rh + NUC_DY);
  const dockAt = (i: number) => pt(REC_X[i], -rh - 13);
  const myo: Myo[] = [];
  const sig: {p: P; op: number}[] = [];
  const rec = REC_X.map(() => 0);
  const abs: Ab[] = [];
  const out: MicroState = {t, variant, g, gN: 1, q, nuc: 1, flow: 1, beads: [], rec, myo, abs, sig, minimal: true, focus: FOCUS, stream: 1};
  if (variant === 'human') {
    // one molecule, followed in from deep between the fibres; it binds the target receptor
    if (t > EV.lead0 - 0.1) {
      const u = clamp((t - EV.lead0) / (EV.bind - 0.05 - EV.lead0));
      const tgt = dockAt(FOCUS);
      const start = pt(-200, -rh - 130);
      const p = t < EV.bind ? bez(start, pt(-120, -rh - 40), add(tgt, pt(0, -10)), ss(u, 0, 1)) : lerp2(add(tgt, pt(0, -10)), tgt, ss(t, EV.bind, EV.bind + 0.18));
      out.lead = {p, ang: (1 - ss(u, 0.7, 1)) * 1.4 * Math.sin(t * 2.4), depth: 1 - ss(u, 0, 0.7), op: clamp((t - EV.lead0 + 0.1) / 0.25)};
      if (t > EV.bind) rec[FOCUS] = 0.6 + 0.4 * Math.exp(-(t - EV.bind) / 0.3);
    }
    // the signal: pulses run down from the receptor through the cell to the nucleus
    for (let k = 0; k < 5; k++) {
      const s0 = EV.sig0 + 0.09 * k;
      const v = (t - s0) / 0.42;
      if (v > 0 && v < 1) sig.push({p: bez(pt(REC_X[FOCUS], -rh + 3), pt(lerp(REC_X[FOCUS], nucP.x, 0.3), -rh + 20), nucP, ss(v, 0, 1)), op: Math.min(1, v * 6) * Math.min(1, (1 - v) * 4)});
    }
    out.wave = {x: REC_X[FOCUS], u: clamp((t - EV.sig0) / 0.75)};
    out.nuc = 1 - 0.85 * ss(t, EV.sig1 - 0.1, EV.sig1 + 0.25);
    out.stream = 1 - ss(t, EV.sig1 - 0.05, EV.sig1 + 0.3);
    out.flow = out.stream;
    // the fibre pushes to thicken, and is held back (twice)
    const push = (tc: number) => Math.max(0, Math.sin(Math.PI * clamp((t - tc) / 0.34))) * (t < tc + 0.34 ? 1 : 0);
    const recoil = (tc: number) => ring(t, tc + 0.34, 5, 0.08) * 3;
    out.dome = {x: 26, h: Math.max(0, 24 * push(EV.dome1) + 20 * push(EV.dome2) + recoil(EV.dome1) + recoil(EV.dome2))};
    out.band = BAND;
  } else if (variant === 'bull') {
    // born without the brake: receptors empty, no molecule, the nucleus streaming; the fibres thicken fast
    out.band = {y0: BAND.y0 - BULL_SHIFT, y1: BAND.y1 - BULL_SHIFT};
  } else {
    // the second visit: myostatin arrives but an antibody catches it first; the receptor stays empty; growth runs
    out.minimal = true;
    const tgt = dockAt(FOCUS);
    [EV.catch1, EV.catch2].forEach((tc, i) => {
      const start = pt(-170 + 300 * i, -rh - 150);
      const meet = add(tgt, pt(-18 + 40 * i, -34 - 14 * i));
      const u = clamp((t - (tc - 0.8)) / 0.8);
      const p = t < tc ? bez(start, pt(lerp(start.x, meet.x, 0.5), lerp(start.y, meet.y, 0.3)), meet, ss(u, 0, 1)) : add(meet, pt(-20 * (i ? -1 : 1) * clamp((t - tc) / 0.6), -40 * ss(clamp((t - tc) / 0.6), 0, 1)));
      myo.push({p, ang: t < tc ? 1.2 * Math.sin(t * 2 + i) : 0.4, op: 1 - ss(t, EV.yaw0 - 0.1, EV.yaw0 + 0.1), dock: 0, caught: t >= tc ? 1 : 0});
      const aStart = pt(-60 + 120 * i, -rh - 240);
      const ua = clamp((t - (EV.labIn1 - 0.2)) / (tc - (EV.labIn1 - 0.2)));
      const aP = t < tc ? bez(aStart, pt(aStart.x - 30, lerp(aStart.y, meet.y, 0.5)), add(meet, pt(0, -12)), ss5(ua, 0, 1)) : add(p, pt(0, -12));
      abs.push({p: aP, ang: t < tc ? Math.PI + (1 - ua) * 1.0 * Math.sin(t * 1.7 + i) : Math.PI, op: clamp((t - (EV.labIn1 - 0.2)) / 0.2) * (1 - ss(t, EV.yaw0 - 0.1, EV.yaw0 + 0.1)), grip: ss(t, tc - 0.08, tc + 0.05)});
    });
    out.nuc = 0.55 + 0.45 * ss(t, EV.release, EV.release + 0.25);
    out.stream = 0.3 + 0.7 * ss(t, EV.release, EV.release + 0.3);
  }
  out.gN = variant === 'bull' ? 1.6 + 0.95 * (g - g0) : variant === 'dish' ? 1.1 + 0.9 * (g - g0) : 1 + 0.5 * (g - g0);
  return out;
};
const STR = 6;
const bez = (a: P, c: P, b: P, u: number) => pt((1 - u) ** 2 * a.x + 2 * (1 - u) * u * c.x + u * u * b.x, (1 - u) ** 2 * a.y + 2 * (1 - u) * u * c.y + u * u * b.y);
/** the second visit's bundle turning end-on */
export const yawAt = (t: number) => ss5(t, EV.yaw0, EV.yaw1);

// ---------------------------------------------------------------- the cow and the lab
export const BULL_NEST: P = pt(49, -110);
export const bullAt = (t: number): BullState => {
  // standing in its field: a slow shift of weight and a turn of the head; a heavier shift on "huge" loads the shoulder
  const sway = 2.4 * Math.sin((t - EV.cowOut1) * 1.9) * ss(t, EV.cowOut1 - 0.1, EV.cowOut1 + 0.5);
  const heavy = ss(t, EV.shift - 0.15, EV.shift + 0.2) * (1 - 0.6 * ss(t, EV.shift + 0.5, EV.shift + 0.9));
  const load = heavy;
  const anat = 1 - ss(t, EV.cowOut0 + 0.5, EV.cowOut1 + 0.25);
  const cutR = t < EV.cowOut0 + 0.6 ? 9 : 9 * (1 - ss(t, EV.cowOut0 + 0.6, EV.cowOut1 - 0.05));
  const headNod = 5 * Math.sin((t - EV.cowOut1) * 1.3) * ss(t, EV.cowOut1, EV.cowOut1 + 0.5) - 4 * heavy;
  return {x: sway + 3 * heavy, step: 0, load, plantT: t - EV.shift, breathe: Math.sin(t * 2.4), headNod, anat, cut: cutR > 0.05 ? {r: cutR} : undefined, t};
};
export const sciAt = (t: number): SciState => {
  const press = ss(t, EV.press, EV.press + 0.4);
  const lean = ss(t, EV.cutLab - 0.1, EV.press);
  const tip = sciNeedle({t, press, lean, drop: 0, dropY: 0, ripple: 0, glow: 0});
  const form = ss(t, EV.press + 0.05, EV.dropFall);
  const fall = clamp((t - EV.dropFall) / (EV.dropLand - EV.dropFall));
  const dropY = t < EV.dropFall ? tip.y + 0.4 * form : lerp(tip.y + 0.4, SAMPLE.y - 0.3, fall * fall);
  return {t, press, lean, drop: t < EV.dropLand ? form : 0, dropY, ripple: clamp((t - EV.dropLand) / 0.45), glow: ss(t, EV.dropLand, EV.dropLand + 0.4)};
};

// ---------------------------------------------------------------- the camera
export type World = 'arm' | 'micro' | 'cross' | 'bull' | 'lab';
export type WCam = Cam & {world: World; band?: number};
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
export const toHost = (c: Cam, origin: P, k: number): Cam => ({x: origin.x + c.x * k, y: origin.y + c.y * k, w: c.w * k});
export const toMicro = (c: Cam, origin: P, k: number): Cam => ({x: (c.x - origin.x) / k, y: (c.y - origin.y) / k, w: c.w / k});
// the opening: composed on the biceps and his face throughout (it never pulls back past the shoulder)
const flexPeak = (m: number, c: number) => armFrame({S: S_FLEX, a1: FLEX_A1, a2: FLEX_A2 + 0.05 * c, m, c, tear: 0, stretch: 1, xray: 0, grip: false, t: 0}).UA(0.62, 1);
export const TIGHT0: Cam = (() => {
  const p = flexPeak(M0, hookC(0));
  return {x: p.x + 1, y: p.y + 3, w: 33};
})();
const REACT: Cam = {x: 10, y: -97, w: 37};
const BICEPS_CLOSE: Cam = {x: 11.9, y: -90.4, w: 19};
const LOOK: Cam = {x: 6, y: -92, w: 46};
const hookCam = (tau: number): Cam => glide(tau, [[-1.35, LOOK], [0, TIGHT0], [EV.grow1, REACT], [EV.dive0, BICEPS_CLOSE]]);
const M_FLY: Cam = {x: -380, y: -40, w: 420};
const M_HERO: Cam = {x: -30, y: -40, w: 230};
const LEAD_CAM = (t: number): Cam => ({x: lerp(-100, -10, ss(t, EV.lead0, EV.bind)), y: -52, w: 220});
const BIND_CAM: Cam = {x: REC_X[FOCUS], y: -44, w: 140};
const SIG_CAM: Cam = {x: 40, y: -36, w: 220};
const DOME_CAM: Cam = {x: 30, y: -44, w: 220};
const COW_FIBRE: Cam = {x: 10, y: -40, w: 250};
const COW_WIDE: Cam = {x: 4, y: -106, w: 300};
const LAB_WIDE: Cam = {x: -4, y: -40, w: 68};
const RECEPTOR_CAM: Cam = {x: REC_X[FOCUS] + 6, y: -70, w: 150};
const ARM_SEATED: Cam = {x: 4, y: -60, w: 78};
export const camAt = (t: number): WCam => {
  if (t < EV.dive0 || t > EV.raise0 - 0.02) return {...hookCam(hookTau(t)), world: 'arm'};
  // disappointment: from the curl framing up to his face and arm, arriving exactly where the opening's camera starts
  if (t > EV.slump0) return {...glide(t, [[EV.slump0, {x: 1, y: -72, w: 58}], [EV.raise0 - 0.02, hookCam(EV.raise0 - 0.02 - LOOP_T)]]), world: 'arm'};
  const Wc = hookWindow();
  if (t < EV.dive1) {
    const A = toMicro(BICEPS_CLOSE, Wc, K_ARM);
    return {...toHost(zoomAbout((t - EV.dive0) / (EV.dive1 - EV.dive0), A, M_FLY), Wc, K_ARM), world: 'arm'};
  }
  if (t < EV.cross0) {
    if (t < EV.lead0) return {...glide(t, [[EV.dive1, M_FLY], [EV.settle, M_HERO]]), world: 'micro'};
    if (t < EV.bind) return {...zoomAbout((t - EV.lead0) / 0.3, M_HERO, LEAD_CAM(t), (x) => x), world: 'micro'};
    return {...glide(t, [[EV.bind, LEAD_CAM(EV.bind)], [EV.bind + 0.25, BIND_CAM], [EV.sig1 + 0.1, SIG_CAM], [EV.dome2, DOME_CAM], [EV.cross0, DOME_CAM]]), world: 'micro'};
  }
  // down through the connective tissue into the cow's muscle (one camera move in one space)
  if (t < EV.cowOut0) {
    const yH = lerp(DOME_CAM.y, BULL_SHIFT + COW_FIBRE.y, ss5(t, EV.cross0, EV.cross1));
    const xH = lerp(DOME_CAM.x, COW_FIBRE.x, ss5(t, EV.cross0, EV.cross1));
    const wH = lerp(DOME_CAM.w, COW_FIBRE.w, ss5(t, EV.cross0, EV.cross1));
    const c = t < EV.crossSwitch ? {x: xH, y: yH, w: wH} : {x: xH, y: yH - BULL_SHIFT, w: wH};
    return {...c, world: 'micro'};
  }
  if (t < EV.cowOut1) {
    const A = toHost(COW_FIBRE, BULL_NEST, K_BULLM);
    return {...zoomAbout((t - EV.cowOut0) / (EV.cowOut1 - EV.cowOut0), A, COW_WIDE), world: 'bull'};
  }
  if (t < EV.cutLab) {
    const c = glide(t, [[EV.cowOut1, COW_WIDE], [EV.shift - 0.2, {x: 18, y: -110, w: 280}], [EV.cutLab, {x: 22, y: -112, w: 268}]]);
    return {...c, y: c.y + 0.7 * ring(t, EV.shift, 9, 0.08), world: 'bull'};
  }
  if (t < EV.labIn0) return {...glide(t, [[EV.cutLab, LAB_WIDE], [EV.press, {x: 6, y: -24, w: 48}], [EV.labIn0, {x: 14, y: -9, w: 30}]]), world: 'lab'};
  if (t < EV.labIn1) {
    const B = toHost(RECEPTOR_CAM, SAMPLE, K_LAB);
    return {...zoomAbout((t - EV.labIn0) / (EV.labIn1 - EV.labIn0), {x: 14, y: -9, w: 30}, B), world: 'lab'};
  }
  if (t < EV.yaw0) return {...glide(t, [[EV.labIn1, RECEPTOR_CAM], [EV.yaw0, {x: 0, y: -40, w: 300}]]), world: 'micro'};
  if (t < EV.armOut0 + 0.05) return {...glide(t, [[EV.yaw0, {x: 0, y: -40, w: 300}], [EV.yaw1, {x: 0, y: 0, w: 1400}]]), world: 'cross'};
  if (t < EV.armOut1) {
    // out of the cross-section through the window in his biceps
    const A = toHost({x: 0, y: 0, w: 1400}, ARM_NEST, K_ARMX);
    return {...zoomAbout((t - EV.armOut0 - 0.05) / (EV.armOut1 - EV.armOut0 - 0.05), A, ARM_SEATED), world: 'arm'};
  }
  const keys: Key[] = [
    [EV.armOut1, ARM_SEATED],
    [EV.grip, {x: 5, y: -66, w: 92}],
    [EV.curl0, {x: 5, y: -70, w: 90}],
    [EV.elbowIn0, {x: 3, y: -64, w: 84}],
    [EV.elbowIn1, {x: -1, y: -57, w: 31}],
    [EV.elbowOut0, {x: -1, y: -56, w: 29}],
    [EV.elbowOut1, {x: 3, y: -62, w: 74}],
    [T.superhuman + 0.2, {x: 3, y: -66, w: 62}],
    [EV.sink0, {x: 2, y: -68, w: 58}],
    [EV.slump0, {x: 1, y: -72, w: 58}],
  ];
  return {...glide(t, keys), world: 'arm'};
};
void easeOut;
