// V2 timeline: every beat keyed to the measured narration (data/timeline.json via word()), the state of every subject
// at time t, and one camera. Worlds: 'arm' (the character, cm), 'micro' (muscle, u), 'bull' (cm), 'lab' (cm). A dive
// or pull-out between worlds is one zoom about a fixed point, defined in the deeper world and mapped into the outer one
// through the window it passes; the outer world is only dropped once that window covers the frame.
//
//   0.00-3.40  already flexing; the biceps swells in surges on "blocked", "protein", "WAY", "bigger"; sleeve tightens
//   3.25-4.05  push through the swelling biceps (a clean cutaway opens on the peak)
//   4.05-6.55  the fibre: new myofibrils zip in; myostatin docks ("myostatin"); signal; growth stops ("brake")
//   6.55-7.40  back out to the visibly enlarged biceps
//   7.40-7.80  the skin turns translucent over the biceps; cut on "animals" to the Belgian Blue's muscles, same view
//   7.80-12.52 pull out to the whole bull; glide to its double-muscled rear; back out for one heavy step on "huge"
//   12.52-14.93 the lab: a drop of drug; into the sample: antibodies catch myostatin ("block it")
//   14.93-16.30 cut on "in": the character's arm, translucent, its fibre bundles thickening (a visualisation)
//   16.30-23.20 the twist: a controlled curl; the huge biceps contracts, the weight barely rises; inside the elbow the
//               muscle bulges while the bone barely turns; it stalls, trembling ("superhuman"), and sinks back
//   23.20-24.57 he lets go and flexes: the last frame is frame 0's framing and pose (the loop)
import {P, add, mul, pt} from './core/geo';
import {DUR, FPS, clamp, easeOut, keyS, lerp, ring, ss, ss5, word} from './lib';
import {ArmState, Face, PersonState, armFrame, headFor, tremorAt} from './art/person';
import {Ab, Cam, MicroState, Myo, REC_X, R0, zipFront} from './art/micro';
import {BullState} from './art/bull';
import {LabState, SAMPLE, PIP_TIP} from './art/lab';

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
export const EV = {
  cut0: 3.22, dive0: 3.3, dive1: 4.06,
  out0: 6.52, out1: 7.38, xr0: 7.42, cutBull: T.animals,
  bullOut1: 9.25, rear0: 9.6, rear1: 10.95, full1: 11.62, step0: 11.5, plant: 11.86, cutLab: T.sci,
  press: 13.46, dropFall: 13.64, dropLand: 13.78, labIn0: 13.72, labIn1: 14.24,
  catch1: 14.34, catch2: T.block, catch3: 14.58, release: 14.62, cutX: T.inW,
  xrayOut0: 15.5, xrayOut1: 16.32, grip: 16.9, curl0: 17.5, curlTop: 18.9, elbowIn0: 18.15, elbowIn1: 18.6, elbowOut0: 19.55, elbowOut1: 20.5,
  sink0: 22.5, sink1: 23.05, raise0: 23.22, raise1: 23.95,
  wipe1: -9, wipe1End: -9, wipe2: -9, wipe2End: -9, // (V1 collagen sheets: not used in V2)
};

// ---------------------------------------------------------------- the character
export const S_FLEX = pt(-4, -84);
const FLEX_A1 = -0.08, FLEX_A2 = 1.68;
const S_CURL = pt(-6, -80.6);
const CURL_A1 = Math.PI / 2 + 0.03, CURL_A2 = 0.06;
export const M0 = 0.34; // an athletic arm, already flexing, in frame 0
/** the mass: surges on the narration's beats; the first starts at full speed in frame 0 */
export const massHook = (t: number) =>
  M0 + 0.2 * easeOut(t / 0.5) + 0.15 * ss(t, T.protein - 0.05, T.protein + 0.35) + 0.07 * ss(t, T.your, T.way - 0.2) + 0.14 * ss(t, T.way - 0.06, T.way + 0.2) + 0.1 * ss(t, T.bigger, T.bigger + 0.3)
  + 0.02 * Math.sin(t * 15) * (1 - ss(t, 3.2, 3.6));
export const inHook = (t: number) => t < EV.xr0 + 0.5;
const flexArm = (t: number, m: number, c: number, xray = 0, cutR = 0): ArmState => ({
  S: S_FLEX, a1: FLEX_A1, a2: FLEX_A2 + 0.05 * c, m, c, tear: 0, pops: 0, stretch: clamp((m - 0.28) / 0.62), xray, grip: false, t,
  cut: cutR > 0.01 ? {r: cutR, s: 0.52, v: 0.36, c: hookWindow()} : undefined,
});
export const armAt = (t: number): ArmState => {
  if (inHook(t)) {
    const m = Math.min(1.02, massHook(t));
    // each surge flexes it harder
    const c = 0.45 + 0.35 * Math.max(ss(t, T.protein - 0.05, T.protein + 0.3) * (1 - ss(t, 1.8, 2.4)), ss(t, T.way - 0.1, T.way + 0.2)) + 0.1 * ss(t, 0, 0.4);
    const cutR = t < EV.out0 ? 2.7 * ss5(t, EV.cut0, EV.cut0 + 0.22) : 2.7 * (1 - ss5(t, EV.out1 - 0.32, EV.out1 - 0.04));
    const a = flexArm(t, m, c, ss(t, EV.xr0, EV.cutBull - 0.04), cutR);
    // the seam strains: stitches pop on the two big surges (the sleeve tightens but holds)
    a.pops = t > T.protein && t < T.protein + 0.5 ? (t - T.protein) / 0.5 : t > T.way && t < T.way + 0.55 ? (t - T.way) / 0.55 : 0;
    return a;
  }
  // the speculative arm, the twist and its curl, the flex into the loop
  const xray = t < EV.xrayOut0 ? 1 : 1 - ss(t, EV.xrayOut0 + 0.2, EV.xrayOut1);
  const m = t < EV.xrayOut0 + 0.4 ? keyS(t, [[EV.cutX, 0.5], [EV.cutX + 0.3, 0.66], [EV.cutX + 0.6, 0.82], [EV.xrayOut0 + 0.4, 1]]) : 1;
  // the controlled curl: a slow rise of the forearm that stalls a few centimetres up, trembling, then sinks back
  const rise = ss(t, EV.curl0, EV.curlTop) * (1 - ss(t, EV.sink0, EV.sink1));
  const strain = ss(t, EV.curl0 - 0.15, EV.curl0 + 0.25) * (1 - ss(t, EV.sink1 - 0.1, EV.sink1 + 0.15));
  const tr = tremorAt(t, 0.016 * strain * (0.6 + 0.4 * ss(t, EV.curlTop - 0.3, EV.curlTop + 0.5)));
  const pulse = t > EV.elbowIn1 && t < EV.elbowOut0 ? 0.16 * Math.max(0, Math.sin((t - EV.elbowIn1) * 2 * Math.PI * 1.4)) : 0;
  const raise = ss5(t, EV.raise0, EV.raise1);
  const S = add(lerp2(S_CURL, S_FLEX, raise), pt(0, -1.6 * rise));
  const a1c = CURL_A1 - 0.03 * rise + tr, a2c = CURL_A2 + 0.42 * rise + pulse * 0.05 + tr * 1.6;
  const a1 = lerp(a1c, FLEX_A1, raise), a2 = lerp(a2c, FLEX_A2 + 0.05 * 0.85, raise);
  const c = Math.max(strain * (0.88 + pulse), lerp(0, 0.85, raise));
  const ec = ss(t, EV.elbowIn0 + 0.15, EV.elbowIn1) * (1 - ss(t, EV.elbowOut0, EV.elbowOut0 + 0.28));
  const glow = ss(t, EV.elbowIn1, EV.elbowIn1 + 0.2) * (1 - ss(t, EV.elbowOut0 - 0.1, EV.elbowOut0 + 0.1));
  const grip = clamp((t - EV.grip) / 0.25) * (1 - ss(t, EV.raise0 - 0.05, EV.raise0 + 0.1));
  return {S, a1, a2, m, c, tear: 0, pops: 0, stretch: 1, xray, grip: raise < 0.05, gripK: grip, elbowCut: ec, fibreGlow: glow, t};
};
const lerp2 = (a: P, b: P, u: number) => pt(lerp(a.x, b.x, u), lerp(a.y, b.y, u));
/** the dumbbell: in the hand while it is off the floor, otherwise resting where the hand left it */
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
const DETERMINED: Face = {brow: -0.15, eyes: 0.5, mouth: 0, strain: 0, look: pt(0.95, -0.55), smile: 0.55};
export const faceAt = (t: number): Face => {
  if (inHook(t)) {
    // frame 0: a confident flex; the first surge widens his eyes; by "protein" he is astonished; then delighted
    const wow = ss(t, 0.25, 0.7);
    const awe = ss(t, T.your, T.way);
    return {brow: lerp(-0.15, 1, wow), eyes: lerp(0.5, 1, wow), mouth: lerp(0, 0.6, wow) * (1 - 0.5 * awe), strain: 0, look: pt(0.95, -0.55), smile: lerp(0.55, 0, wow) + 0.7 * awe};
  }
  const confident = ss(t, EV.xrayOut1 - 0.3, EV.xrayOut1);
  const strain = ss(t, EV.curl0 - 0.05, EV.curl0 + 0.25) * (1 - ss(t, EV.sink1 - 0.1, EV.sink1 + 0.15));
  const surp = ss(t, T.bigger2 - 0.05, T.bigger2 + 0.25) * (1 - ss(t, T.so - 0.2, T.so + 0.2));
  const dis = ss(t, EV.sink0, EV.sink1);
  const end = ss(t, EV.raise0, EV.raise1);
  let f: Face = {brow: lerp(0.2, -0.1, confident) + 1.1 * surp + 0.9 * dis, eyes: 0.5 + 0.45 * surp + 0.4 * dis, mouth: 0.35 * dis, strain: strain * (1 - 0.6 * surp), look: pt(0.55, 0.85), smile: 0.45 * confident * (1 - ss(t, EV.curl0 - 0.2, EV.curl0))};
  if (end > 0) f = {brow: lerp(f.brow, DETERMINED.brow, end), eyes: lerp(f.eyes, DETERMINED.eyes, end), mouth: lerp(f.mouth, 0, end), strain: f.strain * (1 - end), look: lerp2(f.look, DETERMINED.look, end), smile: lerp(f.smile ?? 0, DETERMINED.smile ?? 0, end)};
  return f;
};
export const personAt = (t: number): PersonState => {
  const arm = armAt(t);
  const tilt = inHook(t) ? -6 + 3 * ss(t, 0.25, 0.7) : lerp(lerp(4, 8, ss(t, EV.curl0, EV.curl0 + 0.5)), -6, ss(t, EV.raise0, EV.raise1));
  return {arm, hip: pt(-10, -40), lean: 0, head: headFor(arm.S, arm.m), headTilt: tilt, face: faceAt(t), t, xray: arm.xray, farArm: 0};
};

// ---------------------------------------------------------------- the micro world
export const K_ARM = 0.0004, K_BULL = 0.0016, K_LAB = 0.00045;
export const microVariant = (t: number): MicroState['variant'] => (t < 12 ? 'human' : 'dish');
const integrate = (t0: number, t: number, g0: number, rate: (t: number) => number) => {
  let g = g0;
  const n = Math.max(1, Math.round((t - t0) * 120));
  for (let i = 0; i < n; i++) g += rate(t0 + ((i + 0.5) * (t - t0)) / n) * ((t - t0) / n);
  return g;
};
const rateHuman = (t: number) => keyS(t, [[EV.cut0, 0.5], [EV.dive1, 0.5], [T.myostatin, 0.22], [T.acts, 0.16], [T.brake + 0.02, 0.05], [T.brake + 0.3, 0]]);
const rateDish = (t: number) => keyS(t, [[EV.release, 0], [EV.release + 0.2, 0.26]]);
export const microAt = (t: number): MicroState => {
  const variant = microVariant(t);
  const t0 = variant === 'human' ? EV.cut0 : 12.5;
  const g0 = 1.0;
  const rate = variant === 'human' ? rateHuman : rateDish;
  const g = integrate(t0, t, g0, rate);
  const gR = (tt: number) => integrate(t0, Math.max(t0, tt), g0, rate);
  const qOf = (gg: number) => (R0 * gg - 3) / STR;
  const q = qOf(g);
  const nuc = variant === 'human' ? 1 - 0.85 * ss(t, T.brake - 0.05, T.brake + 0.3) : 0.18 + 0.82 * ss(t, EV.release, EV.release + 0.25);
  const flowAt = (tt: number) => (variant === 'human' ? 1 - ss(tt, T.brake, T.brake + 0.35) : ss(tt, EV.release, EV.release + 0.3));
  const flow = flowAt(t);
  const rh = R0 * g;
  // building blocks: each bead leaves the fluid and arrives at the assembly front of the moment it gets there
  const beads: {p: P; op: number}[] = [];
  const dt = 0.045, life = 0.5;
  for (let k = Math.floor((t - life) / dt); k <= Math.floor(t / dt); k++) {
    const ts = k * dt;
    if (ts < t0 - 0.2) continue;
    const u = (t - ts) / life;
    if (u < 0 || u > 1) continue;
    const fl = flowAt(ts);
    if (fl < 0.05) continue;
    const h1 = hashK(k * 1.7), h2 = hashK(k * 3.1);
    const end = zipFront(qOf(gR(ts + life)));
    const start = pt(-150 + 210 * h1, -rh - 30 - 70 * h2);
    const ctrl = pt(lerp(start.x, end.x, 0.5) + 30 * (h2 - 0.5), lerp(start.y, end.y, 0.2) - 10);
    beads.push({p: bez(start, ctrl, end, ss(u, 0, 1)), op: fl * Math.min(1, u * 5) * Math.min(1, (1 - u) * 8)});
  }
  const myo: Myo[] = [];
  const sig: {p: P; op: number}[] = [];
  const rec = REC_X.map(() => 0);
  const abs: Ab[] = [];
  const nucP = pt(22, -rh + 12);
  const dockAt = (i: number) => pt(REC_X[i], -rh - 13);
  if (variant === 'human') {
    const docks = [T.myostatin + 0.42, T.myostatin + 0.62, T.acts - 0.05, T.brake - 0.12];
    const recI = [1, 3, 0, 2];
    docks.forEach((td, i) => {
      const appear = T.myostatin - 0.3 + 0.1 * i;
      if (t < appear) return;
      const ri = recI[i];
      const tgt = dockAt(ri);
      const start = pt(-170 + 70 * i, -rh - 170 + 25 * (i % 2));
      const travel = 0.85;
      const u = clamp((t - (td - travel)) / travel);
      const ctrl = pt(lerp(start.x, tgt.x, 0.5) + (i % 2 ? 40 : -30), lerp(start.y, tgt.y, 0.3));
      const p0 = bez(start, ctrl, tgt, ss5(u, 0, 1));
      const drift = t < td - travel ? pt(14 * (t - appear), 6 * (t - appear)) : pt(0, 0);
      const docked = t >= td;
      myo.push({p: docked ? tgt : add(p0, drift), ang: docked ? 0 : (1 - ss(u, 0.75, 1)) * (1.2 * Math.sin(t * 2.2 + i) + i), op: clamp((t - appear) / 0.2), dock: docked ? 1 : 0, caught: 0});
      if (docked) {
        rec[ri] = Math.max(rec[ri], 0.65 + 0.35 * Math.exp(-(t - td) / 0.25));
        for (let k = 0; k < 3; k++) {
          const s0 = td + 0.05 + 0.09 * k;
          const v = (t - s0) / 0.36;
          if (v > 0 && v < 1) sig.push({p: bez(pt(REC_X[ri], -rh + 3), pt(lerp(REC_X[ri], nucP.x, 0.3), -rh + 18), nucP, ss(v, 0, 1)), op: Math.min(1, v * 6) * Math.min(1, (1 - v) * 4)});
        }
      }
    });
  } else {
    // two dimers already docked (the brake is on); three more arrive; antibodies from the drop catch them all
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
  const gN = 1 + 0.45 * (g - g0);
  return {t, variant, g, gN, q, nuc, flow, beads, rec, myo, abs, sig};
};
const STR = 6;
const hashK = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const bez = (a: P, c: P, b: P, u: number) => pt((1 - u) ** 2 * a.x + 2 * (1 - u) * u * c.x + u * u * b.x, (1 - u) ** 2 * a.y + 2 * (1 - u) * u * c.y + u * u * b.y);

// ---------------------------------------------------------------- the bull and the lab
export const bullAt = (t: number): BullState => {
  const step = clamp((t - EV.step0) / (EV.plant - EV.step0));
  const x = 7 * ss(t, EV.step0 + 0.05, EV.plant + 0.05);
  const load = ss(t, EV.plant - 0.08, EV.plant + 0.05) * (1 - 0.5 * ss(t, EV.plant + 0.25, EV.plant + 0.6));
  // the hide is translucent over the musculature as we arrive from the human arm, and fills in as we pull out
  const anat = 1 - ss(t, EV.cutBull + 0.35, EV.cutBull + 1.15);
  return {x, step: t < EV.step0 ? 0 : step, load, plantT: t - EV.plant, breathe: Math.sin(t * 2.4), headNod: 2.4 * ring(t, EV.plant, 1.6, 0.35) + 1.2 * Math.sin(t * 1.3), anat, t};
};
export const labAt = (t: number): LabState => {
  const press = ss(t, EV.press, EV.press + 0.12) * (1 - ss(t, EV.dropLand, EV.dropLand + 0.3));
  const form = ss(t, EV.press + 0.04, EV.dropFall);
  const tip = PIP_TIP(press);
  const fall = clamp((t - EV.dropFall) / (EV.dropLand - EV.dropFall));
  const dropY = t < EV.dropFall ? tip.y + 0.35 * form : lerp(tip.y + 0.35, SAMPLE.y - 0.1, fall * fall);
  return {t, press, drop: t < EV.dropLand ? form : 0, dropY, ripple: clamp((t - EV.dropLand) / 0.45), look: 0.5 + 0.5 * Math.sin(t * 1.2), dim: 0};
};

// ---------------------------------------------------------------- the camera
export type World = 'arm' | 'micro' | 'bull' | 'lab';
export type WCam = Cam & {world: World};
/** zoom about the one point that keeps its screen position between cameras A and B (log-scale) */
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
// the biceps window the dives pass through (fixed: the flex pose at full mass)
let WC: P | undefined;
export const hookWindow = (): P => {
  if (!WC) {
    const a: ArmState = {S: S_FLEX, a1: FLEX_A1, a2: FLEX_A2 + 0.05 * 0.8, m: 1, c: 0.8, tear: 0, stretch: 1, xray: 0, grip: false, t: 0};
    WC = armFrame(a).UA(0.52, 0.36);
  }
  return WC;
};
export const toHost = (c: Cam, origin: P, k: number): Cam => ({x: origin.x + c.x * k, y: origin.y + c.y * k, w: c.w * k});
export const toMicro = (c: Cam, origin: P, k: number): Cam => ({x: (c.x - origin.x) / k, y: (c.y - origin.y) / k, w: c.w / k});
const M_BRAKE: Cam = {x: 0, y: -60, w: 186};
/** frame 0 (and the last frame): a medium three-quarter shot of the flex, face and biceps */
export const OPEN_CAM: Cam = {x: 10.5, y: -98, w: 52};
const OPEN_IN: Cam = {x: 11.5, y: -96, w: 43};
const BICEPS_CLOSE: Cam = {x: 12.5, y: -92, w: 28};
const easeO = (x: number) => 1 - (1 - x) ** 3, easeI = (x: number) => x ** 3;
const BULL_CLOSE: Cam = {x: 48, y: -110, w: 72};
const BULL_WIDE: Cam = {x: 8, y: -108, w: 300};
const BULL_REAR: Cam = {x: -50, y: -106, w: 210};
const LAB_WIDE: Cam = {x: -7, y: -34, w: 74};
export const camAt = (t: number): WCam => {
  if (t < EV.dive0) {
    // already moving in frame 0 (the same speed the last frame arrives with)
    const c = glide(t, [[0, OPEN_CAM], [1.1, OPEN_IN, easeO], [T.protein + 0.45, {x: 11, y: -97.5, w: 46}], [T.way - 0.1, {x: 12.5, y: -94, w: 34}], [EV.dive0, BICEPS_CLOSE]]);
    return {...c, world: 'arm'};
  }
  const Wc = hookWindow();
  if (t < EV.dive1) {
    const A = toMicro(BICEPS_CLOSE, Wc, K_ARM);
    return {...toHost(zoomAbout((t - EV.dive0) / (EV.dive1 - EV.dive0), A, M_BRAKE), Wc, K_ARM), world: 'arm'};
  }
  if (t < EV.out0) {
    return {...glide(t, [[EV.dive1, M_BRAKE], [T.acts, {x: 4, y: -68, w: 178}], [EV.out0, {x: 6, y: -72, w: 172}]]), world: 'micro'};
  }
  const OUT_TO: Cam = {x: 12, y: -93, w: 34};
  if (t < EV.out1) {
    const A = toHost({x: 6, y: -72, w: 172}, Wc, K_ARM);
    return {...zoomAbout((t - EV.out0) / (EV.out1 - EV.out0), A, OUT_TO), world: 'arm'};
  }
  if (t < EV.cutBull) return {...glide(t, [[EV.out1, OUT_TO], [EV.cutBull, {x: 12.5, y: -93.5, w: 31}]]), world: 'arm'};
  if (t < EV.cutLab) {
    const c = glide(t, [[EV.cutBull, BULL_CLOSE], [EV.bullOut1, BULL_WIDE], [EV.rear0, {x: -4, y: -108, w: 288}], [EV.rear1, BULL_REAR], [EV.full1, {x: 8, y: -108, w: 300}], [EV.cutLab, {x: 14, y: -108, w: 284}]]);
    return {...c, y: c.y + 0.7 * ring(t, EV.plant, 9, 0.08), world: 'bull'};
  }
  if (t < EV.labIn0) return {...glide(t, [[EV.cutLab, {x: -9, y: -36, w: 80}], [EV.labIn0, {x: 2, y: -18, w: 54}]]), world: 'lab'};
  if (t < EV.labIn1) {
    const B = toHost({x: 0, y: -60, w: 250}, SAMPLE, K_LAB);
    return {...zoomAbout((t - EV.labIn0) / (EV.labIn1 - EV.labIn0), {x: 2, y: -18, w: 54}, B), world: 'lab'};
  }
  if (t < EV.cutX) return {...glide(t, [[EV.labIn1, {x: 0, y: -60, w: 250}], [EV.cutX, {x: 0, y: -52, w: 238}]]), world: 'micro'};
  // the speculative arm, the twist (one controlled curl), the elbow, the stall, and the flex into frame 0
  const keys: Key[] = [
    [EV.cutX, {x: 1, y: -56, w: 40}],
    [EV.xrayOut0, {x: 0, y: -56, w: 50}],
    [EV.xrayOut1, {x: 6, y: -64, w: 98}],
    [EV.curl0, {x: 5, y: -62, w: 90}],
    [EV.elbowIn0, {x: 3, y: -58, w: 70}],
    [EV.elbowIn1, {x: 1, y: -52, w: 38}],
    [EV.elbowOut0, {x: 1, y: -51, w: 36}],
    [EV.elbowOut1, {x: 3, y: -62, w: 74}],
    [T.superhuman + 0.2, {x: 3, y: -66, w: 62}],
    [EV.sink0, {x: 2, y: -64, w: 58}],
    [EV.sink1, {x: 3, y: -66, w: 66}],
    [EV.raise0, {x: 5, y: -72, w: 72}],
    [LAST - 0.95, {x: 9.5, y: -96, w: 60}],
    [LAST + 1 / FPS, OPEN_CAM, easeI],
  ];
  return {...glide(t, keys), world: 'arm'};
};
