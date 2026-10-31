// The timeline: every beat keyed to the measured narration (data/timeline.json via word()), the state of every
// subject at time t, and one continuous camera. Worlds: 'arm' (the character, cm), 'micro' (muscle, u), 'bull' (cm),
// 'lab' (cm). A dive or pull-out between worlds is one zoom about a fixed point, defined in the deeper world and mapped
// into the outer one through the cutaway it passes; the outer world is only dropped once the window covers the frame.
import {P, add, mul, pt, sub} from './core/geo';
import {DUR, FPS, clamp, easeOut, keyS, lerp, noise1, ring, ss, ss5, word} from './lib';
import {ArmState, Face, PersonState, armFrame, tremorAt} from './art/person';
import {Ab, Cam, MicroState, Myo, REC_X, R0, heroR, rowY, zipFront} from './art/micro';
import {BullState, SHOULDER_CUT} from './art/bull';
import {LabState, SAMPLE, PIP_TIP} from './art/lab';

const w = word;
export const T = {
  protein: w('protein').start, your: w('your').start, way: w('WAY').start, bigger: w('bigger').start, biggerEnd: w('bigger').end,
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
  tear0: 0.6, tear1: 1.0, flex: 1.3, cut0: 1.72, dive0: 1.86, dive1: 2.46,
  wipe1: 7.42, wipe1End: 7.86, bullOut0: 8.42, bullOut1: 9.46, cmp0: 9.72, cmp1: 11.48,
  step0: 11.5, plant: 11.86, step1: 12.0, bullIn0: 12.02, bullIn1: 12.5, wipe2: 12.5, wipe2End: 12.8,
  labOut0: 12.8, labOut1: 13.42, press: 13.48, dropFall: 13.66, dropLand: 13.8, labIn0: 13.74, labIn1: 14.26,
  catch1: 14.34, catch2: T.block, catch3: 14.58, release: 14.62, cutX: T.inW,
  xrayOut0: 15.5, xrayOut1: 16.32, curl0: 16.96, liftTop: 17.42, surprise: T.bigger2, elbowIn0: 17.86, elbowIn1: 18.42,
  setDown: 19.62, setDown1: 19.78, elbowOut0: 19.76, elbowOut1: 20.66, raise0: 20.62, raise1: 21.34, flexPulse: 21.62, push0: 22.18,
};

// ---------------------------------------------------------------- the character
export const S_HOOK = pt(-4, -84);
const HOOK_A1 = -0.06, HOOK_A2 = 1.85;
const S_CURL = pt(-6, -80.6);
const CURL_A1 = Math.PI / 2 + 0.03, CURL_A2 = 0.06;
/** muscle mass: already swelling in frame 0, exaggerated by 1.0 s */
const massHook = (t: number) => keyS(t, [[0, 0.08], [0.3, 0.46], [0.6, 0.76], [1.0, 1.0]], (x) => 1 - (1 - x) ** 1.6) + 0.025 * Math.sin(t * 13) * (1 - ss(t, 0.8, 1.2));
export const inHook = (t: number) => t < EV.dive1 + 0.2;
export const armAt = (t: number): ArmState => {
  if (inHook(t)) {
    const m = massHook(t);
    const tearK = t < EV.tear0 ? 0 : t < EV.tear1 ? 0.62 * easeOut((t - EV.tear0) / (EV.tear1 - EV.tear0)) : 0.62 + 0.38 * easeOut((t - EV.tear1) / 0.35);
    const c = t < EV.cut0 ? 0.35 + 0.55 * ss(t, EV.flex - 0.1, EV.flex + 0.3) : 0.9;
    const cutR = 2.7 * ss5(t, EV.cut0, EV.cut0 + 0.24);
    return {S: S_HOOK, a1: HOOK_A1 - 0.03 * ss(t, EV.flex - 0.1, EV.flex + 0.3), a2: HOOK_A2 + 0.06 * ss(t, EV.flex - 0.1, EV.flex + 0.3), m, c, tear: tearK, stretch: clamp(m * 1.5), xray: 0,
      cut: cutR > 0.01 ? {r: cutR, s: 0.52, v: 0.36} : undefined, grip: false, t};
  }
  // the speculative human (x-ray), the twist and the payoff
  const xray = t < EV.xrayOut0 ? 1 : 1 - ss(t, EV.xrayOut0 + 0.2, EV.xrayOut1);
  const m = t < EV.xrayOut0 + 0.4 ? keyS(t, [[EV.cutX, 0.52], [EV.cutX + 0.3, 0.68], [EV.cutX + 0.6, 0.84], [EV.xrayOut0 + 0.4, 1]]) : 1;
  // the curl: a shrug and a little elbow flexion lift the dumbbell about 3 cm, trembling, then it settles back
  const lift = ss(t, EV.curl0, EV.liftTop) * (1 - ss(t, EV.setDown, EV.setDown1));
  const strain = ss(t, EV.curl0 - 0.1, EV.curl0 + 0.2) * (1 - ss(t, EV.setDown, EV.setDown1));
  const tr = tremorAt(t, 0.012 * strain);
  const pulse = t > EV.elbowIn1 && t < EV.setDown ? 0.18 * Math.max(0, Math.sin((t - EV.elbowIn1) * 2 * Math.PI * 1.4)) : 0;
  const raise = ss5(t, EV.raise0, EV.raise1);
  const S = add(lerp2(S_CURL, S_HOOK, raise), pt(0, -2.2 * lift));
  const a1c = CURL_A1 - 0.03 * lift + tr, a2c = CURL_A2 + 0.2 * lift + pulse * 0.12 + tr * 1.5;
  const fp = ss(t, EV.flexPulse - 0.2, EV.flexPulse + 0.15) * (1 - ss(t, EV.push0 + 0.3, LAST - 0.5));
  const a1 = lerp(a1c, HOOK_A1 - 0.03 * fp, raise), a2 = lerp(a2c, HOOK_A2 + 0.06 * fp, raise);
  const flexP = ss(t, EV.flexPulse - 0.2, EV.flexPulse + 0.15) * (1 - 0.4 * ss(t, EV.flexPulse + 0.4, EV.flexPulse + 0.9));
  const c = Math.max(strain * (0.85 + pulse), raise * lerp(0.5 + 0.4 * flexP, 0.35, ss(t, EV.push0 + 0.3, LAST - 0.5)));
  const ec = ss(t, EV.elbowIn0 + 0.2, EV.elbowIn1) * (1 - ss(t, EV.elbowOut0, EV.elbowOut0 + 0.28));
  const glow = ss(t, EV.elbowIn1, EV.elbowIn1 + 0.2) * (1 - ss(t, EV.setDown - 0.1, EV.setDown + 0.1));
  return {S, a1, a2, m, c, tear: 1, stretch: 1, xray, grip: raise < 0.05, elbowCut: ec, fibreGlow: glow, t};
};
const lerp2 = (a: P, b: P, u: number) => pt(lerp(a.x, b.x, u), lerp(a.y, b.y, u));
/** where the dumbbell is: in the hand while lifting, otherwise resting on the floor where the hand left it */
export const dumbbellAt = (t: number, a: ArmState): P => {
  const g = armFrame(a);
  const h = add(g.W, mul(g.f, 4.6));
  const rest = (() => {
    const a0 = armAt(EV.curl0 - 0.2);
    const g0 = armFrame(a0);
    return add(g0.W, mul(g0.f, 4.6));
  })();
  if (t > EV.raise0 || t < EV.curl0) return rest;
  return pt(h.x, Math.min(rest.y, h.y));
};
export const faceAt = (t: number): Face => {
  if (inHook(t)) {
    const wow = ss(t, EV.tear0, EV.tear1);
    return {brow: lerp(0.15, 1, wow), eyes: lerp(0.35, 1, wow), mouth: 0.55 * wow, strain: 0, look: pt(0.9, -0.5)};
  }
  const strain = ss(t, EV.curl0 - 0.05, EV.curl0 + 0.2) * (1 - ss(t, EV.surprise - 0.05, EV.surprise + 0.2));
  const surp = ss(t, EV.surprise - 0.05, EV.surprise + 0.2);
  const dis = ss(t, EV.raise1 - 0.1, T.superhuman);
  const brow = lerp(lerp(-0.2, 1, surp), 0.85, dis);
  return {brow: brow - 0.9 * strain, eyes: lerp(lerp(0.25 - 0.2 * strain, 1, surp), 0.85, dis), mouth: lerp(0.5 * surp * (1 - ss(t, 19.2, 19.7)), 0.35, dis), strain,
    look: t < EV.raise0 ? pt(0.6, 0.8) : lerp2(pt(0.6, 0.8), pt(0.95, -0.45), ss(t, EV.raise0, EV.raise1))};
};
export const personAt = (t: number): PersonState => {
  const arm = armAt(t);
  const look = faceAt(t).look;
  const head = add(pt(arm.S.x - 5, arm.S.y - 20), pt(0.8 * look.x, 0.5 * look.y));
  return {arm, hip: pt(-10, -40), lean: 0, head, headTilt: inHook(t) ? -4 : lerp(10, -20, ss(t, EV.raise0, EV.raise1)) + 4 * ss(t, EV.surprise, EV.surprise + 0.3) * (1 - ss(t, EV.raise0, EV.raise1)), face: faceAt(t), t, xray: arm.xray, farArm: 0};
};

// ---------------------------------------------------------------- the micro world
export const K_ARM = 0.0004, K_BULL = 0.0016, K_LAB = 0.00045;
export const microVariant = (t: number): MicroState['variant'] => (t < (EV.wipe1 + EV.wipe1End) / 2 ? 'human' : t < (EV.wipe2 + EV.wipe2End) / 2 ? 'bull' : 'dish');
type Seg = [number, number]; // [time, rate]
const integrate = (t0: number, t: number, g0: number, rate: (t: number) => number) => {
  let g = g0;
  const n = Math.max(1, Math.round((t - t0) * 120));
  for (let i = 0; i < n; i++) g += rate(t0 + ((i + 0.5) * (t - t0)) / n) * ((t - t0) / n);
  return g;
};
const rateHuman = (t: number) => keyS(t, [[EV.cut0, 0.16], [T.way - 0.15, 0.2], [T.way + 0.05, 0.55], [T.biggerEnd, 0.42], [T.its + 0.15, 0.12], [T.acts, 0.1], [T.brake + 0.05, 0.02], [T.brake + 0.35, 0]]);
const rateBull = (t: number) => keyS(t, [[EV.wipe1, 0.42], [EV.bullOut0, 0.42], [EV.bullOut0 + 0.5, 0.22]]);
const rateDish = (t: number) => keyS(t, [[EV.release, 0], [EV.release + 0.2, 0.26]]);
export const microAt = (t: number): MicroState => {
  const variant = microVariant(t);
  const t0 = variant === 'human' ? EV.cut0 : variant === 'bull' ? (EV.wipe1 + EV.wipe1End) / 2 : (EV.wipe2 + EV.wipe2End) / 2;
  const g0 = variant === 'human' ? 1 : variant === 'bull' ? 1.32 : 1.0;
  const rate = variant === 'human' ? rateHuman : variant === 'bull' ? rateBull : rateDish;
  const g = integrate(t0, t, g0, rate);
  const gR = (tt: number) => integrate(t0, Math.max(t0, tt), g0, rate);
  const qOf = (gg: number) => (R0 * gg - 3) / STR;
  const q = qOf(g);
  const nuc = variant === 'human' ? 1 - 0.85 * ss(t, T.brake - 0.05, T.brake + 0.35) : variant === 'bull' ? 1 : 0.18 + 0.82 * ss(t, EV.release, EV.release + 0.25);
  const flow = variant === 'human' ? 1 - ss(t, T.brake, T.brake + 0.4) : variant === 'bull' ? 1 : ss(t, EV.release, EV.release + 0.3);
  const rh = R0 * g;
  // building blocks: each bead leaves the fluid and arrives at the assembly front of the moment it gets there
  const beads: {p: P; op: number}[] = [];
  const dt = variant === 'bull' ? 0.035 : 0.05;
  const life = 0.55;
  for (let k = Math.floor((t - life) / dt); k <= Math.floor(t / dt); k++) {
    const ts = k * dt;
    if (ts < t0 - 0.2) continue;
    const u = (t - ts) / life;
    if (u < 0 || u > 1) continue;
    const fl = variant === 'human' ? 1 - ss(ts, T.brake, T.brake + 0.4) : variant === 'bull' ? 1 : ss(ts, EV.release, EV.release + 0.3);
    if (fl < 0.05) continue;
    const h1 = hashK(k * 1.7), h2 = hashK(k * 3.1);
    const qa = qOf(gR(ts + life));
    const end = zipFront(qa);
    const start = pt(-150 + 210 * h1, -rh - 30 - 70 * h2);
    const ctrl = pt(lerp(start.x, end.x, 0.5) + 30 * (h2 - 0.5), lerp(start.y, end.y, 0.2) - 10);
    const p = bez(start, ctrl, end, ss(u, 0, 1));
    beads.push({p, op: fl * Math.min(1, u * 5) * Math.min(1, (1 - u) * 8)});
  }
  const myo: Myo[] = [];
  const sig: {p: P; op: number}[] = [];
  const rec = REC_X.map(() => 0);
  const abs: Ab[] = [];
  const nucP = pt(22, -rh + 10);
  const dockAt = (i: number) => pt(REC_X[i], -rh - 13);
  if (variant === 'human') {
    const docks = [T.myoEnd - 0.02, T.myoEnd + 0.22, T.acts + 0.05, T.brake - 0.12];
    const recI = [1, 3, 0, 2];
    docks.forEach((td, i) => {
      const appear = T.myostatin - 0.25 + 0.12 * i;
      if (t < appear) return;
      const ri = recI[i];
      const tgt = dockAt(ri);
      const start = pt(-180 + 70 * i, -rh - 190 + 25 * (i % 2));
      const travel = 1.15;
      const u = clamp((t - (td - travel)) / travel);
      const ctrl = pt(lerp(start.x, tgt.x, 0.5) + (i % 2 ? 40 : -30), lerp(start.y, tgt.y, 0.3));
      const p0 = bez(start, ctrl, tgt, ss5(u, 0, 1));
      const drift = t < td - travel ? pt(14 * (t - appear), 6 * (t - appear)) : pt(0, 0);
      const docked = t >= td;
      myo.push({p: docked ? tgt : add(p0, drift), ang: docked ? 0 : (1 - ss(u, 0.75, 1)) * (1.2 * Math.sin(t * 2.2 + i) + i), op: clamp((t - appear) / 0.25), dock: docked ? 1 : 0, caught: 0});
      if (docked) {
        rec[ri] = Math.max(rec[ri], 0.65 + 0.35 * Math.exp(-(t - td) / 0.25));
        for (let k = 0; k < 3; k++) {
          const s0 = td + 0.06 + 0.1 * k;
          const v = (t - s0) / 0.42;
          if (v > 0 && v < 1) sig.push({p: bez(pt(REC_X[ri], -rh + 3), pt(lerp(REC_X[ri], nucP.x, 0.3), -rh + 18), nucP, ss(v, 0, 1)), op: Math.min(1, v * 6) * Math.min(1, (1 - v) * 4)});
        }
      }
    });
  }
  if (variant === 'dish') {
    // two dimers already docked (the brake is on); three more arrive; antibodies from the drop catch them all
    const freeT = [EV.catch1, EV.catch2, EV.catch3];
    const recFree = [1, 2, 4];
    const docked = [0, 3];
    docked.forEach((ri, i) => {
      const rel = EV.release + 0.05 * i;
      const tgt = dockAt(ri);
      if (t < rel) {
        myo.push({p: tgt, ang: 0, op: 1, dock: 1, caught: 0});
        rec[ri] = 0.65;
      } else {
        // released, and caught by an antibody just above the membrane
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
      // its antibody comes down from the drop above
      const aStart = pt(-60 + 70 * i, -rh - 260);
      const ua = clamp((t - (EV.labIn1 - 0.25)) / (tc - (EV.labIn1 - 0.25)));
      const aP = t < tc ? bez(aStart, pt(aStart.x - 30, lerp(aStart.y, tgt.y, 0.5)), add(tgt, pt(0, -12)), ss5(ua, 0, 1)) : add(p, pt(0, -12));
      abs.push({p: aP, ang: t < tc ? Math.PI + (1 - ua) * 1.2 * Math.sin(t * 1.7 + i) : Math.PI, op: clamp((t - (EV.labIn1 - 0.25)) / 0.2), grip: ss(t, tc - 0.08, tc + 0.05)});
    });
  }
  const gN = 1 + 0.45 * (g - g0) + (variant === 'bull' ? 0.25 : 0);
  return {t, variant, g, gN, q, nuc, flow, beads, rec, myo, abs, sig};
};
const STR = 6;
const hashK = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const bez = (a: P, c: P, b: P, u: number) => pt((1 - u) ** 2 * a.x + 2 * (1 - u) * u * c.x + u * u * b.x, (1 - u) ** 2 * a.y + 2 * (1 - u) * u * c.y + u * u * b.y);
void rowY; void heroR; void noise1; void ring;

// ---------------------------------------------------------------- the bull and the lab
export const bullAt = (t: number): BullState => {
  const step = clamp((t - EV.step0) / (EV.plant - EV.step0));
  const x = 7 * ss(t, EV.step0 + 0.05, EV.plant + 0.05);
  const load = ss(t, EV.plant - 0.08, EV.plant + 0.05) * (1 - 0.5 * ss(t, EV.plant + 0.25, EV.plant + 0.6));
  const cutR = t < 10 ? 9 * (1 - ss(t, EV.bullOut0 + 0.62, EV.bullOut1)) : 9 * ss(t, EV.bullIn0, EV.bullIn0 + 0.2);
  return {x, step: t < EV.step0 ? 0 : step, load, plantT: t - EV.plant, breathe: Math.sin(t * 2.4), headNod: 2.4 * ring(t, EV.plant, 1.6, 0.35) + 1.2 * Math.sin(t * 1.3), cut: cutR > 0.05 ? {r: cutR} : undefined, t};
};
export const bullShoulder = (t: number) => add(SHOULDER_CUT, pt(bullAt(t).x, 0));
export const compareAt = (t: number) => {
  const draw = ss(t, EV.cmp0, EV.cmp0 + 0.45);
  const glow = {s: ss(t, 10.22, 10.5), b: ss(t, 10.6, 10.88), h: ss(t, T.freak + 0.1, T.freak + 0.4)};
  const fade = ss(t, EV.cmp0 - 0.05, EV.cmp0 + 0.1) * (1 - ss(t, EV.cmp1 - 0.25, EV.cmp1));
  return {draw, glow, fade};
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
/** zoom about the one point that keeps its screen position between cameras A and B (log-scale, C2 eased) */
export const zoomAbout = (u: number, A: Cam, B: Cam): Cam => {
  const e = ss5(u, 0, 1);
  const wv = Math.exp(lerp(Math.log(A.w), Math.log(B.w), e));
  if (Math.abs(A.w - B.w) < 1e-9) return {x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), w: wv};
  const P0 = pt((A.x / A.w - B.x / B.w) / (1 / A.w - 1 / B.w), (A.y / A.w - B.y / B.w) / (1 / A.w - 1 / B.w));
  return {x: P0.x + (A.x - P0.x) * (wv / A.w), y: P0.y + (A.y - P0.y) * (wv / A.w), w: wv};
};
const glide = (t: number, keys: [number, Cam][]): Cam => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, A] = keys[i - 1], [t1, B] = keys[i];
      return zoomAbout((t - t0) / (t1 - t0), A, B);
    }
  }
  return keys[keys.length - 1][1];
};
// nest maps: a micro camera seen through each host window
export const hookWindow = () => {
  const a = armAt(EV.dive0);
  const g = armFrame(a);
  return g.UA(0.52, 0.36);
};
export const toHost = (c: Cam, origin: P, k: number): Cam => ({x: origin.x + c.x * k, y: origin.y + c.y * k, w: c.w * k});
export const toMicro = (c: Cam, origin: P, k: number): Cam => ({x: (c.x - origin.x) / k, y: (c.y - origin.y) / k, w: c.w / k});
const M_BRAKE: Cam = {x: 0, y: -58, w: 186};
export const LOOP_CAM: Cam = {x: 18.6, y: -92.5, w: 25};
const HOOK_WIDE: Cam = {x: 11.5, y: -97, w: 46};
const BULL_WIDE: Cam = {x: 8, y: -92, w: 350};
const LAB_WIDE: Cam = {x: -7, y: -34, w: 74};
export const camAt = (t: number): WCam => {
  if (t < EV.dive0) {
    const c = glide(t, [[0, LOOP_CAM], [0.5, HOOK_WIDE], [EV.flex, {x: 12.2, y: -96.5, w: 44}], [EV.dive0, {x: 12.5, y: -92, w: 25}]]);
    return {...c, world: 'arm'};
  }
  if (t < EV.dive1) {
    const Wc = hookWindow();
    const A = toMicro({x: 12.5, y: -92, w: 25}, Wc, K_ARM);
    const c = zoomAbout((t - EV.dive0) / (EV.dive1 - EV.dive0), A, M_BRAKE);
    return {...toHost(c, Wc, K_ARM), world: 'arm'};
  }
  if (t < EV.bullOut0) {
    // the brake, then the collagen sheet, then the bull's fibre (the camera drifts down with the sheet)
    const drift = 30 * ss(t, EV.wipe1, EV.wipe1End);
    const c = glide(t, [[EV.dive1, M_BRAKE], [T.its, {x: 4, y: -66, w: 180}], [EV.wipe1, {x: 10, y: -72, w: 176}], [EV.wipe1End, {x: 0, y: -60, w: 190}], [EV.bullOut0, {x: 4, y: -64, w: 186}]]);
    return {...c, y: c.y + drift * (1 - ss(t, EV.wipe1End, EV.wipe1End + 0.3)), world: 'micro'};
  }
  if (t < EV.bullOut1) {
    const O = bullShoulder(t);
    const A = toHost({x: 4, y: -64, w: 186}, O, K_BULL);
    return {...zoomAbout((t - EV.bullOut0) / (EV.bullOut1 - EV.bullOut0), A, BULL_WIDE), world: 'bull'};
  }
  if (t < EV.bullIn0) {
    const c = glide(t, [[EV.bullOut1, BULL_WIDE], [EV.cmp0 + 0.4, {x: 4, y: -96, w: 340}], [EV.cmp1, {x: -6, y: -100, w: 330}], [EV.step0, {x: 6, y: -96, w: 318}], [EV.bullIn0, {x: 30, y: -100, w: 270}]]);
    const shake = 0.6 * ring(t, EV.plant, 9, 0.08);
    return {...c, y: c.y + shake, world: 'bull'};
  }
  if (t < EV.bullIn1) {
    const O = bullShoulder(t);
    const B = toHost({x: 0, y: -46, w: 236}, O, K_BULL);
    return {...zoomAbout((t - EV.bullIn0) / (EV.bullIn1 - EV.bullIn0), {x: 30, y: -100, w: 270}, B), world: 'bull'};
  }
  if (t < EV.labOut0) {
    const drift = 30 * ss(t, EV.wipe2, EV.wipe2End);
    return {x: 0, y: -46 + drift * (1 - ss(t, EV.wipe2End, EV.labOut0 + 0.2)), w: 236, world: 'micro'};
  }
  if (t < EV.labOut1) {
    const A = toHost({x: 0, y: -46, w: 236}, SAMPLE, K_LAB);
    return {...zoomAbout((t - EV.labOut0) / (EV.labOut1 - EV.labOut0), A, LAB_WIDE), world: 'lab'};
  }
  if (t < EV.labIn0) {
    return {...glide(t, [[EV.labOut1, LAB_WIDE], [EV.labIn0, {x: 2, y: -18, w: 54}]]), world: 'lab'};
  }
  if (t < EV.labIn1) {
    const B = toHost({x: 0, y: -60, w: 250}, SAMPLE, K_LAB);
    return {...zoomAbout((t - EV.labIn0) / (EV.labIn1 - EV.labIn0), {x: 2, y: -18, w: 54}, B), world: 'lab'};
  }
  if (t < EV.cutX) {
    return {...glide(t, [[EV.labIn1, {x: 0, y: -60, w: 250}], [EV.cutX, {x: 0, y: -52, w: 238}]]), world: 'micro'};
  }
  // the speculative arm, the twist, the elbow, the payoff, and the push into frame 0
  const keys: [number, Cam][] = [
    [EV.cutX, {x: 1, y: -56, w: 40}],
    [EV.xrayOut0, {x: 0, y: -56, w: 50}],
    [EV.xrayOut1, {x: 6, y: -62, w: 100}],
    [EV.curl0, {x: 5, y: -60, w: 96}],
    [EV.liftTop, {x: 3, y: -64, w: 80}],
    [EV.elbowIn0, {x: 2, y: -60, w: 72}],
    [EV.elbowIn1, {x: 1, y: -52, w: 36}],
    [EV.setDown, {x: 0, y: -51, w: 34}],
    [EV.elbowOut0, {x: 0, y: -51, w: 35}],
    [EV.elbowOut1, {x: 6, y: -58, w: 104}],
    [EV.raise1, {x: 6, y: -70, w: 100}],
    [EV.push0, {x: 8, y: -76, w: 90}],
    [LAST, LOOP_CAM],
  ];
  return {...glide(t, keys), world: 'arm'};
};
void sub; void noise1;
type Seg2 = Seg;
export type {Seg2};
