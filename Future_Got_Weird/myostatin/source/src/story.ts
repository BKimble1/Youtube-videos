// V4 timeline: every beat keyed to the measured narration (data/timeline.json via word()), the state of every subject
// at time t, and one camera. Worlds: 'arm' (the character, cm), 'micro' (muscle, u), 'cross' (the muscle cut across, u),
// 'bull' (cm), 'lab' (cm). A dive or pull-out between worlds is one zoom about a fixed point, defined in the deeper world
// and mapped into the outer one through the window it passes; the outer world is dropped once that window covers the frame.
//
//   0.00-0.65  frame 0: the flexed arm already growing; 0.15-0.65 the biceps balloons, stretching the sleeve
//   0.65-1.10  shock: eyes wide, brows up, mouth open; head and eyes follow the muscle
//   1.10-1.60  the camera pushes through the skin of the growing biceps: skin, fat, fascia, fascicles
//   1.60-3.90  inside (by 1.5 s): flying between fibres as they swell around the camera; settle on one fibre ("WAY bigger")
//   4.05-5.25  one myostatin molecule, followed in from deep between the fibres ("It's called myostatin")
//   5.25-5.55  it binds: the receptor closes on it ("and it acts")
//   5.55-6.45  the brake: a signal runs along the membrane and in to the nucleus, which goes dark; assembly stops
//   6.45-7.40  the fibre tries to swell, twice, and is pulled back ("on muscle growth")
//   7.43-8.45  cut on "But": an animal born without the brake: a misshapen myostatin cannot bind, and the fibres thicken
//   8.45-9.70  the bundle turns 90 degrees into a cross-section; out to the whole muscle cut across
//   9.70-12.52 out of a window in the cow's thigh to the whole cow; it walks; a heavy plant on "huge"
//   12.52-14.93 the lab: the scientist taps and presses a syringe of treatment into a sample; down the needle and in:
//               antibodies catch myostatin, the fibres thicken ("block it")
//   14.93-16.32 cut on "in": the character's arm, translucent, fibre bundles thickening (a visualisation); he grins
//   16.32-22.95 the twist: curious, he grips; a controlled curl; inside the elbow the muscle bulges while the bone barely
//               turns; the stall, straining ("superhuman"); the weight sinks back ("without actually")
//   22.95-24.57 his face, concerned; he raises the arm into the flex and the camera arrives on frame 0's framing as the
//               biceps begins to swell: the last 1.4 s are the opening's own timeline just before t = 0 (the loop)
import {P, add, mul, pt} from './core/geo';
import {DUR, FPS, FRAMES, clamp, easeOut, keyS, lerp, ring, ss, ss5, word} from './lib';
import {ArmState, Face, PersonState, armFrame, headFor, tremorAt} from './art/person';
import {Ab, Cam, MicroState, Myo, REC_X, R0, zipFront} from './art/micro';
import {BullState} from './art/bull';
import {LabState, SAMPLE} from './art/lab';
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
export const LAST = (Math.round(DUR * FPS) - 1) / FPS; // time of the final frame
export const LOOP_T = FRAMES / FPS;                      // the time at which the film wraps back to frame 0
export const EV = {
  grow0: 0.15, grow1: 0.65, react0: 0.65, react1: 1.1, cut0: 1.02, dive0: 1.1, dive1: 1.78,
  settle: 3.9, lead0: 4.02, lead1: 5.25, bind: 5.3, wave0: 5.58, wave1: 6.4, dome1: 6.56, dome2: 6.96,
  cutBull: T.but, bump: 7.9, yaw0: 8.45, yaw1: 9.0, crossOut1: 9.7, cowOut1: 10.32, walk0: 10.2, plant: 11.86, cutLab: T.sci,
  lift0: 12.56, tap1: 12.86, tap2: 13.02, lower0: 13.1, lower1: 13.4, press: 13.44, press1: 13.74, labIn0: 13.66, labIn1: 14.24,
  catch1: 14.34, catch2: T.block, catch3: 14.58, release: 14.62, cutX: T.inW,
  xrayOut0: 15.5, xrayOut1: 16.32, grip: 16.9, curl0: 17.5, curlTop: 18.9, elbowIn0: 18.15, elbowIn1: 18.6, elbowOut0: 19.55, elbowOut1: 20.5,
  sink0: 22.42, sink1: 22.92, faceCU: 22.95, reset: 23.12, raise0: 23.22, raise1: 23.86,
  wipe1: -9, wipe1End: -9, wipe2: -9, wipe2End: -9, out0: -9, out1: -9,
};

// ---------------------------------------------------------------- the character
export const S_FLEX = pt(-4, -84);
const FLEX_A1 = -0.08, FLEX_A2 = 1.68;
const S_CURL = pt(-6, -80.6);
const CURL_A1 = Math.PI / 2 + 0.03, CURL_A2 = 0.06;
export const M_START = 0.42; // the arm as the opening lead-in begins (just before frame 0)
/** the hook's mass on its own clock tau (tau = t near the start; tau = t - LOOP_T near the end): already rising at
 *  tau = 0, ballooning over 0.15-0.65 */
export const massHook = (tau: number) => M_START + 0.66 * ss5(tau, -0.3, 0.68) + 0.04 * ss(tau, T.protein - 0.05, T.protein + 0.3) + 0.012 * Math.sin(tau * 15) * ss(tau, 0, 0.3) * (1 - ss(tau, 0.7, 1));
export const M0 = massHook(0);
const hookTau = (t: number) => (t > EV.raise0 - 0.02 ? t - LOOP_T : t);
export const inHook = (t: number) => t < EV.dive1 + 0.4 || t > EV.raise0 - 0.02;
const flexArm = (tau: number, m: number, c: number, cutR = 0): ArmState => ({
  S: S_FLEX, a1: FLEX_A1, a2: FLEX_A2 + 0.05 * c, m, c, tear: 0, pops: 0, stretch: clamp((m - 0.3) / 0.6), xray: 0, grip: false, t: tau,
  cut: cutR > 0.01 ? {r: cutR, s: 0.52, v: 0.36, c: hookWindow()} : undefined,
});
const hookC = (tau: number) => 0.45 + 0.4 * ss(tau, 0.1, 0.6);
/** the curl-and-twist arm (also used for the last moments before the raise) */
const curlArm = (t: number): ArmState => {
  const xray = t < EV.xrayOut0 ? 1 : 1 - ss(t, EV.xrayOut0 + 0.2, EV.xrayOut1);
  const m = t < EV.xrayOut0 + 0.4 ? keyS(t, [[EV.cutX, 0.55], [EV.cutX + 0.3, 0.7], [EV.cutX + 0.6, 0.88], [EV.xrayOut0 + 0.4, 1.06]]) : 1.06;
  const rise = ss(t, EV.curl0, EV.curlTop) * (1 - ss(t, EV.sink0, EV.sink1));
  const strain = ss(t, EV.curl0 - 0.15, EV.curl0 + 0.25) * (1 - ss(t, EV.sink1 - 0.1, EV.sink1 + 0.15));
  const tr = tremorAt(t, 0.016 * strain * (0.6 + 0.4 * ss(t, EV.curlTop - 0.3, EV.curlTop + 0.5)));
  const pulse = t > EV.elbowIn1 && t < EV.elbowOut0 ? 0.16 * Math.max(0, Math.sin((t - EV.elbowIn1) * 2 * Math.PI * 1.4)) : 0;
  const S = add(S_CURL, pt(0, -1.6 * rise));
  const a1 = CURL_A1 - 0.03 * rise + tr, a2 = CURL_A2 + 0.42 * rise + pulse * 0.05 + tr * 1.6;
  const ec = ss(t, EV.elbowIn0 + 0.15, EV.elbowIn1) * (1 - ss(t, EV.elbowOut0, EV.elbowOut0 + 0.28));
  const glow = ss(t, EV.elbowIn1, EV.elbowIn1 + 0.2) * (1 - ss(t, EV.elbowOut0 - 0.1, EV.elbowOut0 + 0.1));
  return {S, a1, a2, m, c: strain * (0.88 + pulse), tear: 0, pops: 0, stretch: 1, xray, grip: true, gripK: clamp((t - EV.grip) / 0.25), elbowCut: ec, fibreGlow: glow, t};
};
export const armAt = (t: number): ArmState => {
  if (inHook(t)) {
    const tau = hookTau(t);
    const m = massHook(tau);
    const cutR = tau > 0 ? 2.7 * ss5(tau, EV.cut0, EV.cut0 + 0.16) : 0;
    const flex = flexArm(tau, m, hookC(tau), cutR);
    flex.pops = tau > 0.3 && tau < 0.85 ? (tau - 0.3) / 0.55 : 0;
    if (tau >= 0) return flex;
    // the end: the arm (reset to the opening's size while the camera holds on his face) rises from the dumbbell into the flex
    const raise = ss5(t, EV.raise0, EV.raise1);
    const hang = {...curlArm(EV.raise0), m: lerp(1.06, m, ss(t, EV.reset - 0.1, EV.reset + 0.1)), grip: false};
    if (raise <= 0) return hang;
    return {...flex, S: lerp2(hang.S, S_FLEX, raise), a1: lerp(hang.a1, flex.a1, raise), a2: lerp(hang.a2, flex.a2, raise), c: lerp(0, flex.c, raise), grip: raise < 0.05};
  }
  // the hidden reset happens under the face close-up (the arm is below the frame)
  if (t > EV.faceCU) return {...curlArm(t), m: lerp(1.06, M_START, ss(t, EV.reset - 0.1, EV.reset + 0.1))};
  return curlArm(t);
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
/** the face. The hook's face is on the hook's clock too, so the last frames hand over to frame 0 exactly. */
const hookFace = (tau: number): Face => {
  // focus on the arm -> shock (0.65-1.1: eyes wide, brows shoot up, mouth opens) -> amazement
  const shock = ss(tau, EV.react0, EV.react0 + 0.18);
  const amaze = ss(tau, EV.react1, EV.react1 + 0.3);
  return {brow: lerp(0.25, 1.25, shock) - 0.2 * amaze, eyes: lerp(0.62, 1, shock), mouth: lerp(0, 0.85, shock) * (1 - 0.35 * amaze), strain: 0, look: lerp2(pt(0.9, 0.05), pt(1, 0.35), ss(tau, 0, 1)), smile: 0, grin: 0.4 * amaze, quiz: 0.6 * (1 - shock)};
};
export const faceAt = (t: number): Face => {
  if (t < EV.dive1 + 0.4) return hookFace(t);
  if (t > EV.raise0 - 0.02) {
    // concern turns into the opening's focused look as the arm comes up
    const u = ss(t, EV.raise0, EV.raise1 + 0.2);
    const h = hookFace(t - LOOP_T);
    const c = CONCERN;
    return {brow: lerp(c.brow, h.brow, u), eyes: lerp(c.eyes, h.eyes, u), mouth: lerp(c.mouth, h.mouth, u), strain: 0, look: lerp2(c.look, h.look, u), smile: 0, grin: 0, concern: lerp(1, 0, u), quiz: lerp(0, h.quiz ?? 0, u)};
  }
  const excite = ss(t, EV.cutX + 0.3, EV.cutX + 0.7) * (1 - ss(t, T.but2 - 0.1, T.but2 + 0.2));
  const curious = ss(t, T.but2 - 0.1, T.but2 + 0.2) * (1 - ss(t, EV.curl0 - 0.15, EV.curl0 + 0.05));
  const strain = ss(t, EV.curl0 - 0.05, EV.curl0 + 0.25) * (1 - ss(t, EV.sink1 - 0.1, EV.sink1 + 0.1));
  const surp = ss(t, T.bigger2 - 0.05, T.bigger2 + 0.25) * (1 - ss(t, T.bigger2 + 0.8, T.bigger2 + 1.1));
  const concern = ss(t, EV.sink0 + 0.1, EV.faceCU);
  return {
    brow: 0.4 * excite + 0.3 * curious + 0.9 * surp + 0.15 * concern - 0.1, eyes: 0.55 + 0.35 * excite + 0.2 * curious + 0.4 * surp + 0.2 * concern - 0.25 * strain,
    mouth: 0, strain: strain * (1 - 0.5 * surp), look: concern > 0.01 ? lerp2(pt(0.55, 0.85), CONCERN.look, concern) : pt(0.55 + 0.3 * excite, 0.85 - 1.2 * excite),
    smile: 0, grin: excite, concern, quiz: curious,
  };
};
const CONCERN: Face = {brow: 0.2, eyes: 0.8, mouth: 0, strain: 0, look: pt(0.6, 0.9), concern: 1};
const BUILD = 1.0; // the torso and head keep one build; only the arm swells and resets
export const personAt = (t: number): PersonState => {
  const arm = armAt(t);
  const tau = hookTau(t);
  // head: follows the swelling muscle in the hook (a restrained nod toward it, then a recoil of shock)
  const hookTilt = -6 + 4 * ss(tau, 0, 0.6) - 5 * ss(tau, EV.react0, EV.react0 + 0.2) + 3 * ss(tau, EV.react1, EV.react1 + 0.4);
  const tilt = inHook(t) && (t < EV.dive1 + 0.4 || t > EV.raise1) ? hookTilt
    : t > EV.raise0 - 0.02 ? lerp(10, hookTilt, ss(t, EV.raise0, EV.raise1))
    : lerp(lerp(4, 8, ss(t, EV.curl0, EV.curl0 + 0.5)), 10, ss(t, EV.sink0, EV.faceCU)) - 6 * ss(t, EV.cutX + 0.3, EV.cutX + 0.7) * (1 - ss(t, T.but2, T.but2 + 0.3));
  return {arm, hip: pt(-10, -40), lean: 0, head: headFor(arm.S, BUILD), headTilt: tilt, face: faceAt(t), t, xray: arm.xray, farArm: 0, build: BUILD};
};

// ---------------------------------------------------------------- the micro world
export const K_ARM = 0.0004, K_LAB = 0.00045;
export const K_COW = 17 / (MUSCLE_RX + 260); // the whole-muscle cross-section fills a 17 cm window in the cow's thigh
export const microVariant = (t: number): MicroState['variant'] => (t < T.but ? 'human' : t < 12 ? 'bull' : 'dish');
const integrate = (t0: number, t: number, g0: number, rate: (t: number) => number) => {
  let g = g0;
  const n = Math.max(1, Math.round((t - t0) * 120));
  for (let i = 0; i < n; i++) g += rate(t0 + ((i + 0.5) * (t - t0)) / n) * ((t - t0) / n);
  return g;
};
const rateHuman = (t: number) => keyS(t, [[EV.cut0, 0.5], [2.6, 0.42], [T.way, 0.6], [EV.settle, 0.2], [EV.bind, 0.15], [EV.wave0 + 0.2, 0.02], [EV.wave0 + 0.5, 0]]);
const rateDish = (t: number) => keyS(t, [[EV.release, 0], [EV.release + 0.2, 0.32]]);
const rateBull = (t: number) => keyS(t, [[T.but, 0.2], [EV.bump, 0.3], [EV.bump + 0.12, 1.25], [EV.yaw0, 0.9], [EV.yaw1, 0.2]]);
const LEAD_REC = 2;
export const microAt = (t: number): MicroState => {
  const variant = microVariant(t);
  const t0 = variant === 'human' ? EV.cut0 : variant === 'bull' ? T.but : 12.5;
  const g0 = variant === 'bull' ? 1.28 : 1.0;
  const rate = variant === 'human' ? rateHuman : variant === 'bull' ? rateBull : rateDish;
  const g = integrate(t0, t, g0, rate);
  const gR = (tt: number) => integrate(t0, Math.max(t0, tt), g0, rate);
  const qOf = (gg: number) => (R0 * gg - 3) / STR;
  const q = qOf(g);
  const brakeT = EV.wave0 + 0.25;
  const nuc = variant === 'human' ? 1 - 0.85 * ss(t, brakeT - 0.1, brakeT + 0.3) : variant === 'bull' ? 1 : 0.18 + 0.82 * ss(t, EV.release, EV.release + 0.25);
  const flowAt = (tt: number) => (variant === 'human' ? 1 - ss(tt, brakeT, brakeT + 0.35) : variant === 'bull' ? 1 : ss(tt, EV.release, EV.release + 0.3));
  const spawnAt = (tt: number) => (variant === 'human' ? 1 - ss(tt, brakeT + 0.55, brakeT + 1.0) : flowAt(tt));
  const bounced = (tt: number) => variant === 'human' && tt > brakeT - 0.2;
  const flow = flowAt(t);
  const rh = R0 * g;
  const beads: {p: P; op: number}[] = [];
  const dt = 0.045, life = 0.5;
  for (let k = Math.floor((t - life) / dt); k <= Math.floor(t / dt); k++) {
    const ts = k * dt;
    if (ts < t0 - 0.2) continue;
    const u = (t - ts) / life;
    if (u < 0 || u > 1) continue;
    const fl = spawnAt(ts);
    if (fl < 0.05) continue;
    const h1 = hashK(k * 1.7), h2 = hashK(k * 3.1);
    const end = zipFront(qOf(gR(ts + life)));
    const start = pt(-150 + 210 * h1, -rh - 30 - 70 * h2);
    if (bounced(ts)) {
      const hit = pt(end.x, -rh - 2.5);
      const away = pt(hit.x + 46 * (h1 - 0.5), hit.y - 34 - 18 * h2);
      const p = u < 0.55 ? bez(start, pt(lerp(start.x, hit.x, 0.5), lerp(start.y, hit.y, 0.2) - 10), hit, ss(u / 0.55, 0, 1)) : bez(hit, pt(hit.x + 10 * (h1 - 0.5), hit.y - 6), away, easeOut((u - 0.55) / 0.45));
      beads.push({p, op: fl * Math.min(1, u * 5) * (u < 0.55 ? 1 : 1 - (u - 0.55) / 0.45)});
      continue;
    }
    const ctrl = pt(lerp(start.x, end.x, 0.5) + 30 * (h2 - 0.5), lerp(start.y, end.y, 0.2) - 10);
    beads.push({p: bez(start, ctrl, end, ss(u, 0, 1)), op: fl * Math.min(1, u * 5) * Math.min(1, (1 - u) * 8)});
  }
  const myo: Myo[] = [];
  const sig: {p: P; op: number}[] = [];
  const rec = REC_X.map(() => 0);
  const abs: Ab[] = [];
  const nucP = pt(22, -rh + 12);
  const dockAt = (i: number) => pt(REC_X[i], -rh - 13);
  const out: MicroState = {t, variant, g, gN: 1, q, nuc, flow, beads, rec, myo, abs, sig};
  if (variant === 'human') {
    // the lead molecule: in from deep between the fibres (blurred, small), sharpening as it nears; it binds
    if (t > EV.lead0 - 0.1) {
      const u = clamp((t - EV.lead0) / (EV.lead1 - EV.lead0));
      const tgt = dockAt(LEAD_REC);
      const start = pt(-190, -rh - 120);
      const p = t < EV.bind ? bez(start, pt(-110, -rh - 30), add(tgt, pt(0, -8)), ss(u, 0, 1)) : lerp2(add(tgt, pt(0, -8)), tgt, ss(t, EV.bind, EV.bind + 0.18));
      out.lead = {p, ang: (1 - ss(u, 0.7, 1)) * 1.6 * Math.sin(t * 2.6), depth: 1 - ss(u, 0, 0.75), op: clamp((t - EV.lead0 + 0.1) / 0.25)};
      if (t > EV.bind) rec[LEAD_REC] = 0.6 + 0.4 * Math.exp(-(t - EV.bind) / 0.3);
      for (let k = 0; k < 4; k++) {
        const s0 = EV.wave0 + 0.06 * k;
        const v = (t - s0) / 0.42;
        if (v > 0 && v < 1) sig.push({p: bez(pt(REC_X[LEAD_REC], -rh + 3), pt(lerp(REC_X[LEAD_REC], nucP.x, 0.3), -rh + 18), nucP, ss(v, 0, 1)), op: Math.min(1, v * 6) * Math.min(1, (1 - v) * 4)});
      }
    }
    out.wave = {x: REC_X[LEAD_REC], u: clamp((t - EV.wave0) / (EV.wave1 - EV.wave0))};
    // more molecules arrive and dock as the brake spreads along the fibre
    [[0, EV.wave0 + 0.35], [3, EV.wave0 + 0.55], [1, EV.wave0 + 0.75], [4, EV.dome2 + 0.1]].forEach(([ri, td], i) => {
      const appear = td - 0.75;
      if (t < appear) return;
      const tgt = dockAt(ri);
      const start = pt(REC_X[ri] - 60 + 30 * i, -rh - 140);
      const u = clamp((t - appear) / 0.75);
      myo.push({p: t >= td ? tgt : bez(start, pt(lerp(start.x, tgt.x, 0.5) + 25, lerp(start.y, tgt.y, 0.4)), tgt, ss5(u, 0, 1)), ang: t >= td ? 0 : 1.1 * Math.sin(t * 2 + i), op: clamp((t - appear) / 0.2), dock: t >= td ? 1 : 0, caught: 0});
      if (t >= td) rec[ri] = 0.65;
    });
    // the fibre pushes to swell, and is pulled back (twice)
    const push = (tc: number) => Math.max(0, Math.sin(Math.PI * clamp((t - tc) / 0.34))) * (t < tc + 0.34 ? 1 : 0);
    const recoil = (tc: number) => ring(t, tc + 0.34, 5, 0.08) * 3;
    const h = 24 * push(EV.dome1) + 20 * push(EV.dome2) + recoil(EV.dome1) + recoil(EV.dome2);
    out.dome = {x: 60, h: Math.max(0, h)};
  } else if (variant === 'bull') {
    // no working myostatin: a misshapen copy drifts to a receptor, cannot fit, and bounces off; nothing signals
    const tgt = dockAt(LEAD_REC);
    const start = pt(-170, -rh - 110);
    const p = t < EV.bump ? bez(start, pt(-100, -rh - 40), add(tgt, pt(0, -10)), ss(clamp((t - T.but) / (EV.bump - T.but)), 0, 1))
      : bez(add(tgt, pt(0, -10)), add(tgt, pt(20, -26)), add(tgt, pt(70, -90)), easeOut(clamp((t - EV.bump) / 0.55)));
    out.bad = [{p, ang: t < EV.bump ? 0.8 * Math.sin(t * 2.2) : 2.4 * (t - EV.bump), op: 1 - ss(t, EV.bump + 0.35, EV.bump + 0.6)}];
  } else {
    const freeT = [EV.catch1, EV.catch2, EV.catch3];
    const recFree = [1, 2, 4];
    [0, 3].forEach((ri, i) => {
      const rel = EV.release + 0.05 * i;
      const tgt = dockAt(ri);
      if (t < rel) {
        myo.push({p: tgt, ang: 0, op: 1, dock: 1, caught: 0});
        rec[ri] = 0.65;
      } else {
        const u = clamp((t - rel) / 0.3);
        const p = add(tgt, pt(-6 * u + 4 * i, -26 * ss(u, 0, 1)));
        myo.push({p, ang: 0.4 * u, op: 1, dock: 0, caught: 1});
        rec[ri] = 0.65 * (1 - u);
        abs.push({p: add(p, pt(0, -12)), ang: Math.PI, op: 1, grip: 1});
      }
    });
    freeT.forEach((tc, i) => {
      const ri = recFree[i];
      const tgt = add(dockAt(ri), pt(0, -10 - (i === 1 ? 0 : 24)));
      const start = pt(-160 + 120 * i, -rh - 150);
      const u = clamp((t - (tc - 1.3)) / 1.3);
      const pm = bez(start, pt(lerp(start.x, tgt.x, 0.4) + 30, lerp(start.y, tgt.y, 0.5)), tgt, ss(u, 0, 1));
      const after = clamp((t - tc) / 0.5);
      const p = t < tc ? pm : add(tgt, pt(8 * after, -30 * ss(after, 0, 1)));
      myo.push({p, ang: t < tc ? 1.4 * Math.sin(t * 2 + i) : 0.3 * after, op: 1, dock: 0, caught: t >= tc ? 1 : 0});
      const aStart = pt(-60 + 70 * i, -rh - 260);
      const ua = clamp((t - (EV.labIn1 - 0.25)) / (tc - (EV.labIn1 - 0.25)));
      const aP = t < tc ? bez(aStart, pt(aStart.x - 30, lerp(aStart.y, tgt.y, 0.5)), add(tgt, pt(0, -12)), ss5(ua, 0, 1)) : add(p, pt(0, -12));
      abs.push({p: aP, ang: t < tc ? Math.PI + (1 - ua) * 1.2 * Math.sin(t * 1.7 + i) : Math.PI, op: clamp((t - (EV.labIn1 - 0.25)) / 0.2), grip: ss(t, tc - 0.08, tc + 0.05)});
    });
  }
  out.gN = variant === 'bull' ? 1.15 + 0.95 * (g - g0) : 1 + 0.5 * (g - g0);
  return out;
};
const STR = 6;
const hashK = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const bez = (a: P, c: P, b: P, u: number) => pt((1 - u) ** 2 * a.x + 2 * (1 - u) * u * c.x + u * u * b.x, (1 - u) ** 2 * a.y + 2 * (1 - u) * u * c.y + u * u * b.y);
/** the bundle's turn into a cross-section (0 side-on .. 1 end-on) */
export const yawAt = (t: number) => ss5(t, EV.yaw0, EV.yaw1);

// ---------------------------------------------------------------- the cow and the lab
/** the cow's walk: a gait phase that runs until the heavy plant of the near fore on "huge", then stops */
const PERIOD = 1.5;
const walkAt = (t: number) => {
  if (t < EV.walk0) return undefined;
  const run = Math.min(t, EV.plant) - EV.plant;
  const after = t > EV.plant ? 0.05 * ss(t, EV.plant, EV.plant + 0.3) : 0;
  return 0.75 + run / PERIOD + after;
};
const STRIDE = 52;
const walkX = (t: number) => {
  const ph = walkAt(t);
  if (ph === undefined) return 0;
  return (ph - (0.75 + (EV.walk0 - EV.plant) / PERIOD)) * STRIDE;
};
export const bullAt = (t: number): BullState => {
  const load = ss(t, EV.plant - 0.08, EV.plant + 0.05) * (1 - 0.5 * ss(t, EV.plant + 0.25, EV.plant + 0.6));
  const anat = 1 - ss(t, EV.crossOut1 + 0.15, EV.cowOut1 + 0.25);
  const cutR = t < EV.crossOut1 + 0.25 ? 17 : 17 * (1 - ss(t, EV.crossOut1 + 0.25, EV.cowOut1 - 0.05));
  const ph = walkAt(t);
  const x = walkX(t);
  const bob = ph === undefined ? 0 : 1.6 * Math.sin(ph * 4 * Math.PI) * (t < EV.plant ? 1 : 0);
  return {x, step: 0, load, plantT: t - EV.plant, breathe: Math.sin(t * 2.4), headNod: 2.4 * ring(t, EV.plant, 1.6, 0.35) + 1.6 * Math.sin((ph ?? t) * 2 * Math.PI), anat, cut: cutR > 0.05 ? {r: cutR} : undefined, walk: ph, bob, t};
};
/** the window in the cow's thigh (the round), where the cross-section sits */
export const COW_NEST: P = pt(-80, -100);
export const labAt = (t: number): LabState => {
  const lift = 7 * ss(t, EV.lift0, EV.lift0 + 0.28) * (1 - ss(t, EV.lower0, EV.lower1));
  const tap = Math.max(ring(t, EV.tap1, 9, 0.06), ring(t, EV.tap2, 9, 0.06), 0) * 1.5;
  const press = ss(t, EV.press, EV.press1);
  return {t, press, drop: 0, dropY: 0, ripple: 0, look: 0.5 + 0.5 * Math.sin(t * 1.2), dim: 0, lift, tap, glow: ss(t, EV.press + 0.1, EV.press1 + 0.3)};
};

// ---------------------------------------------------------------- the camera
export type World = 'arm' | 'micro' | 'cross' | 'bull' | 'lab';
export type WCam = Cam & {world: World};
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
let WC: P | undefined;
export const hookWindow = (): P => {
  if (!WC) WC = armFrame({S: S_FLEX, a1: FLEX_A1, a2: FLEX_A2 + 0.05 * 0.85, m: massHook(EV.cut0), c: 0.85, tear: 0, stretch: 1, xray: 0, grip: false, t: 0}).UA(0.52, 0.36);
  return WC;
};
export const toHost = (c: Cam, origin: P, k: number): Cam => ({x: origin.x + c.x * k, y: origin.y + c.y * k, w: c.w * k});
export const toMicro = (c: Cam, origin: P, k: number): Cam => ({x: (c.x - origin.x) / k, y: (c.y - origin.y) / k, w: c.w / k});
// the opening: frame 0 tight on the growing arm; the reaction framing; the biceps close-up the camera pushes through
const flexPeak = (m: number, c: number) => armFrame({S: S_FLEX, a1: FLEX_A1, a2: FLEX_A2 + 0.05 * c, m, c, tear: 0, stretch: 1, xray: 0, grip: false, t: 0}).UA(0.62, 1);
export const TIGHT0: Cam = (() => {
  const p = flexPeak(M0, hookC(0));
  return {x: p.x + 2, y: p.y + 8, w: 27};
})();
const REACT: Cam = {x: 9, y: -99, w: 47};
const BICEPS_CLOSE: Cam = {x: 12.5, y: -91.5, w: 27};
const FACE_CU: Cam = {x: 4, y: -104, w: 32};
/** the hook's camera on its own clock: tau < 0 is the end of the film arriving on frame 0 */
const hookCam = (tau: number): Cam => glide(tau, [
  [-1.62, FACE_CU], [-0.62, {x: 10, y: -95, w: 34}], [0, TIGHT0], [EV.react0, REACT], [EV.react1, BICEPS_CLOSE],
]);
const M_FLY: Cam = {x: -380, y: -40, w: 420};
const M_HERO: Cam = {x: -40, y: -66, w: 200};
const LEAD_CAM = (t: number): Cam => ({x: lerp(-90, -8, ss(t, EV.lead0, EV.bind)), y: -70, w: 200});
const BIND_CAM: Cam = {x: REC_X[LEAD_REC], y: -60, w: 128};
const WAVE_CAM: Cam = {x: 30, y: -66, w: 236};
const DOME_CAM: Cam = {x: 44, y: -70, w: 214};
const BULL_M: Cam = {x: 10, y: -66, w: 236};
const COW_WIDE: Cam = {x: -36, y: -104, w: 290};
const LAB_WIDE: Cam = {x: -9, y: -34, w: 64};
export const camAt = (t: number): WCam => {
  if (t < EV.dive0 || t > EV.raise0 - 0.02) {
    // the tail of the film leads into the opening: the face close-up, then on to frame 0's framing
    if (t > EV.faceCU && t < EV.raise0 - 0.02) return {...glide(t, [[EV.faceCU, FACE_CU], [EV.raise0 - 0.02, hookCam(EV.raise0 - 0.02 - LOOP_T)]]), world: 'arm'};
    return {...hookCam(hookTau(t)), world: 'arm'};
  }
  const Wc = hookWindow();
  if (t < EV.dive1) {
    const A = toMicro(BICEPS_CLOSE, Wc, K_ARM);
    return {...toHost(zoomAbout((t - EV.dive0) / (EV.dive1 - EV.dive0), A, M_FLY), Wc, K_ARM), world: 'arm'};
  }
  if (t < T.but) {
    if (t < EV.lead0) return {...glide(t, [[EV.dive1, M_FLY], [EV.settle, M_HERO]]), world: 'micro'};
    if (t < EV.bind) return {...zoomAbout((t - EV.lead0) / 0.25, M_HERO, LEAD_CAM(t), (x) => x), world: 'micro'};
    return {...glide(t, [[EV.bind, LEAD_CAM(EV.bind)], [EV.bind + 0.3, BIND_CAM], [EV.wave1, WAVE_CAM], [EV.dome2 + 0.3, DOME_CAM], [T.but, DOME_CAM]]), world: 'micro'};
  }
  if (t < EV.yaw0) return {...glide(t, [[T.but, BULL_M], [EV.yaw0, {x: 0, y: -40, w: 320}]]), world: 'micro'};
  if (t < EV.crossOut1) return {...glide(t, [[EV.yaw0, {x: 0, y: -40, w: 320}], [EV.yaw1, {x: 0, y: 0, w: 1500}], [EV.crossOut1, {x: 0, y: 0, w: 2 * MUSCLE_RX * 1.5}]]), world: 'cross'};
  if (t < EV.cutLab) {
    if (t < EV.cowOut1) {
      const A = toHost({x: 0, y: 0, w: 2 * MUSCLE_RX * 1.5}, COW_NEST, K_COW);
      return {...zoomAbout((t - EV.crossOut1) / (EV.cowOut1 - EV.crossOut1), A, COW_WIDE), world: 'bull'};
    }
    // tracking the walking cow, then settling for the heavy plant
    const c = glide(t, [[EV.cowOut1, COW_WIDE], [10.95, {x: 0, y: -108, w: 300}], [EV.plant, {x: 30, y: -110, w: 300}], [EV.cutLab, {x: 36, y: -108, w: 290}]]);
    return {...c, y: c.y + 0.8 * ring(t, EV.plant, 9, 0.08), world: 'bull'};
  }
  if (t < EV.labIn0) return {...glide(t, [[EV.cutLab, LAB_WIDE], [EV.lower1, {x: 2, y: -24, w: 48}], [EV.labIn0, {x: 10, y: -14, w: 40}]]), world: 'lab'};
  if (t < EV.labIn1) {
    // down the barrel and the needle into the sample
    const B = toHost({x: 0, y: -60, w: 250}, SAMPLE, K_LAB);
    return {...zoomAbout((t - EV.labIn0) / (EV.labIn1 - EV.labIn0), {x: 10, y: -14, w: 40}, B), world: 'lab'};
  }
  if (t < EV.cutX) return {...glide(t, [[EV.labIn1, {x: 0, y: -60, w: 250}], [EV.cutX, {x: 0, y: -52, w: 238}]]), world: 'micro'};
  const keys: Key[] = [
    [EV.cutX, {x: 1, y: -60, w: 44}],
    [EV.xrayOut0, {x: 2, y: -70, w: 56}],
    [EV.xrayOut1, {x: 6, y: -64, w: 98}],
    [EV.curl0, {x: 5, y: -62, w: 90}],
    [EV.elbowIn0, {x: 3, y: -58, w: 70}],
    [EV.elbowIn1, {x: -1, y: -57, w: 31}],
    [EV.elbowOut0, {x: -1, y: -56, w: 29}],
    [EV.elbowOut1, {x: 3, y: -62, w: 74}],
    [T.superhuman + 0.2, {x: 3, y: -66, w: 62}],
    [EV.sink0, {x: 2, y: -70, w: 56}],
    [EV.faceCU, FACE_CU],
  ];
  return {...glide(t, keys), world: 'arm'};
};
