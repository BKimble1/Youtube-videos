// V4 story: every character state and camera as a pure function of film time t (s), keyed to the locked narration
// words (data/timeline.json). World in metres (layout4.ts). She hides at (LAY.xp, LAY.zp) facing -Z; the guard comes
// from -Z. The chase (opening and ending) runs in chase time tau = t (opening) or t - DUR (after the bolt), in the
// unwrapped coordinates where the bolt starts two corridor modules behind the hiding spot.
import {BODY_G, BODY_P} from './cast4';
import {Arm4, FACE0, Face4, joints4, Pose4} from './Crew4';
import {add3, Cam, cardToWorld, mul3, norm3, sub3, U, V3, v3, worldToCard, yawV} from './geo4';
import {BOLT, DUR, herDist, herSpeed, LAY, RUN, TAU0} from './layout4';
import {FACES, keyed, mix} from './poses4';
import {ShieldPose, SH} from './Shield4';
import {footAt, Plant, runPlants} from './steps4';

const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
export const ss = (t: number, a: number, b: number) => sm((t - a) / (b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const M2 = 2 * LAY.mod;
export const ZB = LAY.zp - M2; // the bolt starts here (chase coordinates)
const XP = LAY.xp, ZP = LAY.zp;
export const PANEL_Z = ZP - 0.4; // panel plane while she hides
const GAP = 0.4 * U; // panel in front of her pelvis, rig units

export type Char = {g: V3; h: number; pose: Pose4; sh?: ShieldPose; torch?: {o: V3; dir: V3; on: number}; cuffs?: number; prone?: number};

// ------------------------------------------------------------------ panel poses (her card-local units)
const n3 = (x: number, y: number, z: number) => norm3(v3(x, y, z));
const panel = (c: V3, ua: V3, va: V3): ShieldPose => ({c, ua: norm3(ua), va: norm3(va)});
const P_FRONT = panel(v3(0, SH.h / 2, GAP), v3(1, 0, 0), v3(0, 1, 0)); // standing on the floor in front of her
const P_UNDER = panel(v3(BODY_P.shW + 30, 168, 6), v3(0, 1, 0), v3(0, 0, 1)); // tucked under her left arm, long side forward
const P_MID = panel(v3(34, 205, 66), v3(1, 0, 0.25), v3(0, 1, 0)); // swung upright, close in front of her
const P_SIDE_R = panel(v3(-BODY_P.shW - 46, SH.h / 2 + 2, 26), v3(0, 0, 1), v3(0, 1, 0)); // lowered to her right side, on its edge
const mixPanel = (a: ShieldPose, b: ShieldPose, u: number): ShieldPose => {
  const ua = norm3(mix(a.ua, b.ua, u));
  let va = mix(a.va, b.va, u);
  va = norm3(sub3(va, mul3(ua, va.x * ua.x + va.y * ua.y + va.z * ua.z)));
  return {c: mix(a.c, b.c, u), ua, va};
};
/** rotate a panel pose about her vertical axis (used while she turns, so the panel keeps its world placement) */
const yawPanel = (s: ShieldPose, a: number): ShieldPose => ({c: yawV(s.c, a), ua: yawV(s.ua, a), va: yawV(s.va, a)});
export const onPanel = (s: ShieldPose, a: number, b: number, n: number): V3 => {
  const nn = v3(s.ua.y * s.va.z - s.ua.z * s.va.y, s.ua.z * s.va.x - s.ua.x * s.va.z, s.ua.x * s.va.y - s.ua.y * s.va.x);
  return add3(add3(add3(s.c, mul3(s.ua, a)), mul3(s.va, b)), mul3(nn, n));
};

/** the swing at the stop: up out from under her arm to upright beside her, then set down in front */
const swing = (t: number) => (t < 1.9 ? mixPanel(P_UNDER, P_MID, ss(t, 1.55, 1.9)) : mixPanel(P_MID, P_FRONT, ss(t, 1.9, 2.2)));
// ------------------------------------------------------------------ her chase
const herZc = (tau: number) => ZB + herDist(tau);
const RUN_TS = 0.165, RUN_PHASE = 0.02;
const herRun = runPlants({t0: TAU0 + 0.17, t1: RUN.brake1 - 0.02, ts: RUN_TS, phase: RUN_PHASE, contact: 0.1, zAt: herZc, vAt: herSpeed, x: XP, half: 0.1, lead: 0.12, dirZ: 1});
// before the first run step: standing face to face with him (facing -Z: her left is -X)
const stance0L: Plant = {t0: -99, t1: (herRun.L[0]?.t0 ?? 0) - 0.13, x: XP - 0.13, z: ZB};
const stance0R: Plant = {t0: -99, t1: (herRun.R[0]?.t0 ?? 0) - 0.13, x: XP + 0.13, z: ZB + 0.03};
// after the brake: two pivot steps into the hiding stance (facing -Z), then the crouch stance
const HIDE_L = {x: XP - 0.142, z: ZP - 0.07}, HIDE_R = {x: XP + 0.142, z: ZP - 0.01};
const herPlantsL: Plant[] = [stance0L, ...herRun.L, {t0: 1.98, t1: 99, ...HIDE_L}];
const herPlantsR: Plant[] = [stance0R, ...herRun.R, {t0: 2.12, t1: 99, ...HIDE_R}];
const lastRun = (pl: Plant[]) => pl[pl.length - 2];
// make sure the last running plant lifts before the pivot step
lastRun(herPlantsL).t1 = Math.min(lastRun(herPlantsL).t1, 1.86);
lastRun(herPlantsR).t1 = Math.min(lastRun(herPlantsR).t1, 2.0);
export const HER_PLANTS = {L: herPlantsL, R: herPlantsR};

const herHeadingChase = (tau: number) => {
  // 180 = facing -Z (at the bolt and at the hiding spot); 360 = running +Z. Both turns go through 270 (facing -X,
  // toward the side the cameras work from), so we see her face as she turns.
  if (tau < 1.0) return lerp(180, 360, ss(tau, TAU0 + 0.05, TAU0 + 0.34));
  return lerp(360, 180, ss(tau, 1.5, 2.02));
};

const runArms = (tau: number, v: number, carry: boolean): {L: Arm4; R: Arm4} => {
  const ph = (2 * Math.PI * (tau - RUN_PHASE)) / (2 * RUN_TS);
  const a = Math.min(1, v / 3);
  const sw = Math.sin(ph);
  const R: Arm4 = {hand: v3(-BODY_P.shW - 6, 200 + 34 * a * Math.max(0, sw) - 10 * a * Math.max(0, -sw), 18 + 74 * a * sw), shape: 'fist', pole: v3(-0.3, -0.6, -0.8)};
  const L: Arm4 = carry ? {hand: v3(BODY_P.shW + 26, 158, 62), shape: 'grip', pole: v3(0.6, -0.2, -0.6)} : {hand: v3(BODY_P.shW + 6, 200 + 34 * a * Math.max(0, -sw), 18 - 74 * a * sw), shape: 'fist', pole: v3(0.3, -0.6, -0.8)};
  return {L, R};
};

// ------------------------------------------------------------------ her poses at the hiding spot
const F = (o: Partial<Face4>, base: Face4 = FACE0): Face4 => ({...base, ...o});
const handsOnTop = (s: ShieldPose): {L: Arm4; R: Arm4} => ({L: {hand: onPanel(s, 72, SH.h / 2 - 6, -12), shape: 'grip'}, R: {hand: onPanel(s, -72, SH.h / 2 - 6, -12), shape: 'grip'}});
const handsOnGrips = (s: ShieldPose, dy = 0): {L: Arm4; R: Arm4} => ({L: {hand: onPanel(s, 62, 10 + dy, -14), shape: 'grip', pole: v3(0.25, -0.9, -0.35)}, R: {hand: onPanel(s, -62, 10 + dy, -14), shape: 'grip', pole: v3(-0.25, -0.9, -0.35)}});
const base = (pel: V3, pitch: number, hp: number, face: Face4, arms: {L: Arm4; R: Arm4}, extra: Partial<Pose4> = {}): Pose4 => ({
  pel, hipYaw: 0, pitch, roll: 0, twist: 0, hy: 0, hp, hr: 0, footL: v3(0, 0, 0), footR: v3(0, 0, 0), toeL: 0, toeR: 0, armL: arms.L, armR: arms.R, face, ...extra,
});

/** Her state over the whole film. */
export const herAt = (t: number): Char => {
  const chase = t < 2.25 || t >= BOLT;
  const tau = t >= BOLT ? t - DUR : t;
  if (chase && (t >= BOLT || tau < 1.8)) return herChase(tau, t);
  return herHide(t);
};

const herChase = (tau: number, t: number): Char => {
  const z = herZc(tau);
  const h = herHeadingChase(tau);
  const g = v3(XP, 0, z);
  const v = herSpeed(tau);
  const acc = (herSpeed(tau + 0.02) - herSpeed(tau - 0.02)) / 0.04;
  const run = Math.min(1, v / 1.2);
  const ph = (2 * Math.PI * (tau - RUN_PHASE)) / RUN_TS;
  const bob = -13 * run - 6 * run * Math.cos(ph - 0.6);
  const pitch = 3 + 11 * (v / 3) + 1.6 * acc;
  // the panel: lowered at her right side at the bolt, swung under her left arm as she turns away
  let sh: ShieldPose;
  if (tau < 0) {
    const u = ss(tau, TAU0 + 0.3, TAU0 + 0.52);
    // keep the panel's world side during the turn: express the lowered pose in the turning frame
    const turned = yawPanel(P_SIDE_R, -(h - 180));
    sh = mixPanel(u < 1 ? turned : P_UNDER, P_UNDER, u);
  } else sh = P_UNDER;
  const arms = runArms(tau, v, true);
  const boltArmsR: Arm4 = {hand: onPanel(sh, 0, SH.h / 2 - 44, -10), shape: 'grip'};
  const armR = tau < TAU0 + 0.3 ? {...arms.R, hand: mix(boltArmsR.hand, arms.R.hand, ss(tau, TAU0 + 0.08, TAU0 + 0.3))} : arms.R;
  const armL = {...arms.L, hand: mix(onPanel(sh, -40, SH.h / 2 - 10, 8), arms.L.hand, ss(tau, TAU0 + 0.12, TAU0 + 0.42))};
  // head: looks back over her right shoulder twice (the guard behind her), forward in between
  const look = Math.max(ss(tau, -0.5, -0.32) * (1 - ss(tau, 0.12, 0.3)), ss(tau, 0.62, 0.8) * (1 - ss(tau, 1.12, 1.28)));
  // (she looks back over her right shoulder, toward the side the tracking camera runs on, so her face stays readable)
  const face = mix(mix(FACES.run, FACES.alarm, look), FACES.focus, ss(tau, 1.22, 1.4));
  const fl = footAt(HER_PLANTS.L, tau), fr = footAt(HER_PLANTS.R, tau);
  const toLocal = (f: {x: number; y: number; z: number}) => {
    const p = worldToCard(g, h, v3(f.x, 0, f.z));
    return v3(p.x, 14 + f.y * U, p.z);
  };
  const pose: Pose4 = {
    pel: v3(0, BODY_P.hipY + bob, 0), hipYaw: 0, pitch, roll: 0, twist: -18 * look + 6 * run * Math.sin(ph / 2), hy: -66 * look, hp: -4 * look, hr: 0,
    footL: toLocal(fl), footR: toLocal(fr), toeL: fl.toe, toeR: fr.toe, armL, armR, face,
  };
  // pivot at the stop: the panel swings from under her arm up in front of her
  if (tau >= 1.4) {
    sh = swing(tau);
    const top = handsOnTop(sh);
    pose.armL = {...pose.armL, hand: mix(pose.armL.hand, top.L.hand, ss(tau, 1.5, 1.9))};
    pose.armR = {...pose.armR, hand: mix(pose.armR.hand, top.R.hand, ss(tau, 1.45, 1.85)), shape: 'grip'};
  }
  void t;
  return {g, h, pose, sh};
};

const herHide = (t: number): Char => {
  const g = v3(XP, 0, ZP);
  const h = t < 2.25 ? herHeadingChase(t) : 180;
  // panel: swings up (until 2.2), lands on the floor (2.25, thunk), held; small realign 15.3-15.8; lowered 24.0-24.9
  let sh = swing(t);
  const land = t - 2.2;
  if (land > 0 && land < 0.5) sh = {...sh, c: add3(sh.c, v3(0, -5 * Math.exp(-9 * land) * Math.sin(20 * land), 0))};
  const shift = ss(t, 15.35, 15.8) * (1 - ss(t, 22.6, 23.1) * 0);
  sh = {...sh, c: add3(sh.c, v3(-10 * shift, 0, 4 * shift)), ua: norm3(v3(1, 0, -0.08 * shift))};
  const lowerU = ss(t, 24.02, 24.9);
  if (lowerU > 0) sh = mixPanel(sh, P_SIDE_R, lowerU);
  // body: stand behind it, then sink into the crouch on "disappear", lower on "the right position", rise on "lower"
  const standHold = base(v3(0, BODY_P.hipY - 6, -6), 6, -6, FACES.alarm, handsOnTop(sh));
  const crouchHold = base(v3(0, 66, -48), 26, -12, FACES.focus, handsOnGrips(sh), {twist: 0});
  const crouchLow = base(v3(0, 56, -62), 29, -8, FACES.hold, handsOnGrips(sh, -6));
  // breathing while hidden (small, continuous): never a frozen hold
  const br = Math.sin(t * 2 * Math.PI * 0.42);
  const freeze = ss(t, 15.95, 16.1) * (1 - ss(t, 17.95, 18.1));
  let p = keyed(t, [
    [2.2, standHold],
    [2.95, standHold],
    [3.75, crouchHold, (x) => 1 - Math.pow(1 - x, 2.4)],
    [13.7, crouchHold],
    [14.35, crouchLow],
    [18.05, crouchLow],
    [18.45, {...crouchLow, pel: v3(0, 53, -64), pitch: 31}],
  ]);
  p = {...p, pel: add3(p.pel, v3(0, 1.6 * br * (1 - freeze), 0)), pitch: p.pitch + 0.8 * br * (1 - freeze)};
  // the dip as the panel lands
  if (land > 0 && land < 0.45) p = {...p, pel: add3(p.pel, v3(0, -9 * Math.sin(Math.PI * land / 0.45), 0))};
  // faces
  const fk = keyed(t, [
    [2.2, FACES.alarm], [2.9, F({brow: 0.5, browIn: 0.6, wide: 0.6, mw: 10, curve: -0.2, gy: 0.1})], [3.6, FACES.focus],
    [5.3, FACES.focus], [5.6, F({brow: 0.2, browIn: 0.5, mw: 9, curve: -0.2, gx: -0.4, blush: 0.3})],
    // in the macro every rib holds a sliver of her eyes: her glances read in all of them at once
    [8.4, F({brow: 0.2, browIn: 0.5, mw: 9, curve: -0.2, gx: -0.6, gy: 0.1, blush: 0.3})], [8.75, F({brow: 0.5, browIn: 0.6, mw: 9, curve: -0.2, gx: 0.7, gy: -0.1, wide: 0.5, blush: 0.3})],
    [9.6, F({brow: 0.5, browIn: 0.6, mw: 9, curve: -0.2, gx: 0.7, gy: -0.1, wide: 0.5, blush: 0.3})], [9.95, F({brow: 0.1, browIn: 0.4, mw: 9, curve: -0.2, gx: -0.5, gy: 0.2, blush: 0.3})],
    [13.8, F({brow: 0.2, browIn: 0.5, mw: 9, curve: -0.2, gx: -0.2, blush: 0.3})],
    [14.3, FACES.hold], [15.9, FACES.hold], [16.05, F({...FACES.hold, wide: 1, brow: 1, gx: -0.5})], [17.0, F({...FACES.hold, wide: 1, brow: 1, gx: -0.7})],
    [17.6, F({...FACES.hold, wide: 0.8, brow: 0.8, gx: 0.3})], [18.05, F({...FACES.hold, gx: 0.2})], [18.3, FACES.relief], [18.7, F({...FACES.relief, lid: 0.2})],
    [19.0, F({brow: 0.3, browIn: -0.2, mw: 15, curve: 0.6, smirk: 0.4, gx: -0.3})], [20.4, F({brow: 0.3, browIn: -0.2, mw: 15, curve: 0.7, smirk: 0.5, gx: -0.4})],
    [21.8, F({brow: 0.4, mw: 15, curve: 0.8, smirk: 0.5, gx: -0.5})], [22.6, F({...FACES.giggle, gx: -0.3})], [23.25, FACES.giggle],
    [23.85, F({...FACES.giggle, squint: 0.75})], [24.3, F({brow: 0.5, browIn: 0.1, mw: 15, curve: 0.7, gx: -0.1})], [25.3, FACES.smug], [27.2, FACES.smug],
    [27.95, FACES.smug], [28.15, FACES.uhoh],
  ]);
  p = {...p, face: fk};
  // eye blinks (deterministic, between performance beats)
  const blinkAt = [3.1, 6.7, 8.55, 9.45, 10.35, 12.4, 14.9, 18.25, 21.1, 25.0, 26.4];
  const bl = blinkAt.reduce((m, b) => Math.max(m, 1 - Math.min(1, Math.abs(t - b) / 0.07)), 0);
  p.face = {...p.face, blink: Math.max(p.face.blink, bl * (1 - freeze))};
  // the giggle: shoulders shake, her free hand comes to her mouth
  const gig = ss(t, 22.65, 22.85) * (1 - ss(t, 23.75, 23.95));
  p = {...p, pel: add3(p.pel, v3(0, 2.2 * gig * Math.sin(t * 2 * Math.PI * 7), 0)), twist: p.twist + 3 * gig * Math.sin(t * 2 * Math.PI * 7 + 1)};
  // the reach around the panel's left edge (her left = the -X side), the float, the wave and the dart back
  const R0 = 18.62, R1 = 20.1, BACK0 = 22.3, BACK1 = 22.62;
  const reach = ss(t, R0, R1) * (1 - ss(t, BACK0, BACK1));
  if (t > R0 - 0.3 && t < BACK1 + 0.6) {
    const edge = SH.w / 2;
    const out = onPanel(sh, edge + 32, -8, -44), around = onPanel(sh, edge + 28, 0, 24), front = onPanel(sh, edge - 10, 4, 34);
    const u = ss(t, R0, R1);
    const path = u < 0.45 ? mix(handsOnGrips(sh).L.hand, out, sm(u / 0.45)) : u < 0.75 ? mix(out, around, sm((u - 0.45) / 0.3)) : mix(around, front, sm((u - 0.75) / 0.25));
    const backU = ss(t, BACK0, BACK1);
    const hand = backU > 0 ? mix(path, handsOnGrips(sh).L.hand, backU) : path;
    const wig = (k: number) => 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * (t > 21.75 ? 4.2 : 1.6) + k * 1.1);
    const wave = ss(t, 21.8, 21.95) * (1 - ss(t, 22.25, 22.35));
    p = {
      ...p,
      twist: p.twist + 14 * reach,
      pitch: p.pitch - 4 * reach,
      armL: {hand, shape: reach > 0.6 ? 'open' : 'grip', splay: 0.5 + 0.4 * reach, curl: [0, 1, 2, 3].map((k) => (t > 20.0 ? 0.35 * wig(k) : 0)), wrist: (t > 20.1 ? 10 * Math.sin(t * 2 * Math.PI * 0.8) : 0) + 22 * wave * Math.sin(t * 2 * Math.PI * 4), pole: v3(0.9, -0.5, -0.4)},
    };
  }
  if (gig > 0) {
    const jj = joints4(BODY_P, p);
    const mouth = add3(add3(jj.Hc, mul3(jj.hz, 74)), mul3(jj.hy, -30));
    p = {...p, armL: {hand: mix(p.armL.hand, mouth, gig), shape: 'mitt', pole: v3(0.7, -0.7, 0)}, hp: p.hp + 6 * gig};
  }
  // rise and lower: one move, she straightens as the panel comes down to her right side
  if (lowerU > 0 || t > 23.9) {
    const rise = ss(t, 23.98, 24.85);
    const standUp: Pose4 = {...base(v3(0, BODY_P.hipY, -2), 2, 0, p.face, {L: {hand: v3(BODY_P.shW + 18, 140, 30), shape: 'mitt'}, R: {hand: onPanel(sh, 0, SH.h / 2 - 8, 6), shape: 'grip', pole: v3(-0.8, -0.5, -0.2)}})};
    const q = mix(p, standUp, rise);
    q.armR = {hand: mix(p.armR.hand, onPanel(sh, 0, SH.h / 2 - 8, 6), ss(t, 23.95, 24.4)), shape: 'grip', pole: v3(-0.8, -0.5, -0.2)};
    if (rise < 1) q.armL = {...q.armL, hand: mix(p.armL.hand, standUp.armL.hand, ss(t, 23.95, 24.6))};
    p = q;
    // the little wave (left hand) as she is revealed, then a hand on the hip
    const wv = ss(t, 25.25, 25.45) * (1 - ss(t, 25.95, 26.2));
    const hip = ss(t, 26.1, 26.5);
    p.armL = {
      hand: mix(mix(p.armL.hand, v3(BODY_P.shW + 78, 372, 70), wv), v3(BODY_P.shW + 10, 175, -6), hip),
      shape: wv > 0.5 ? 'open' : 'mitt', splay: 0.8, curl: [0, 1, 2, 3].map((k) => 0.3 * (0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 3.5 + k))),
      wrist: 18 * wv * Math.sin(t * 2 * Math.PI * 3), pole: hip > 0.5 ? v3(1, 0.1, -0.5) : undefined,
    };
    p.hy = 6 * Math.sin(t * 1.3) * ss(t, 25, 26);
    p.hr = 6 * ss(t, 26.3, 26.8) * (1 - ss(t, 27.9, 28.1));
  }
  // feet: the pivot steps, then the hiding stance
  const fl = footAt(HER_PLANTS.L, t), fr = footAt(HER_PLANTS.R, t);
  const toLocal = (f: {x: number; y: number; z: number}) => {
    const q = worldToCard(g, h, v3(f.x, 0, f.z));
    return v3(q.x, 14 + f.y * U, q.z);
  };
  p.footL = toLocal(fl);
  p.footR = toLocal(fr);
  p.toeL = fl.toe;
  p.toeR = fr.toe;
  // while the pivot is still running (before 2.25) blend from the chase pose
  if (t < 2.25) {
    const c = herChase(t, t);
    const u = ss(t, 1.8, 2.25);
    return {g: mix(c.g, g, u), h, pose: {...mix(c.pose, p, u), footL: p.footL, footR: p.footR}, sh};
  }
  return {g, h, pose: p, sh};
};

// ------------------------------------------------------------------ guard
// chase: standing in front of her at the bolt, lunges, lands flat, scrambles up, runs, slows as he watches her vanish
const G0 = {z: ZB - 1.2, lungeEnd: 0.8};
const GR = {a0: 0.62, a1: 1.12, d0: 2.0, d1: 2.9};
const gStopZ = ZP - 2.45;
const gProneZ = G0.z + G0.lungeEnd;
const gRunD = gStopZ - gProneZ; // covered by the run (chase coords = real coords here)
const gV = gRunD / ((GR.a1 - GR.a0) / 2 + (GR.d0 - GR.a1) + (GR.d1 - GR.d0) / 2);
const gSpeed = (tau: number) => {
  if (tau < GR.a0) return 0;
  if (tau < GR.a1) return gV * ss(tau, GR.a0, GR.a1);
  if (tau < GR.d0) return gV;
  if (tau < GR.d1) return gV * (1 - ss(tau, GR.d0, GR.d1));
  return 0;
};
const gDist = (tau: number) => {
  let d = 0;
  const n = 60, a = GR.a0, b = Math.min(tau, GR.d1);
  if (b <= a) return 0;
  const h = (b - a) / n;
  for (let i = 0; i < n; i++) d += gSpeed(a + (i + 0.5) * h) * h;
  return d;
};
const gZchase = (tau: number) => {
  if (tau < TAU0 + 0.1) return G0.z;
  if (tau < GR.a0) return G0.z + G0.lungeEnd * ss(tau, TAU0 + 0.14, TAU0 + 0.52);
  return gProneZ + gDist(tau);
};
const GTS = 0.19, GPH = 0.05;
const gRun = runPlants({t0: GR.a0 + 0.05, t1: GR.d1, ts: GTS, phase: GPH, contact: 0.12, zAt: gZchase, vAt: gSpeed, x: LAY.gx, half: 0.12, lead: 0.12, dirZ: 1});
// his steps after the stop (real coordinates): closer (13.7-14.4), the reach step (21.8), the recoil hop (22.55),
// the creep back in (23.3-23.8)
const gStepsL: Plant[] = [
  {t0: -99, t1: TAU0 + 0.12, x: LAY.gx + 0.13, z: G0.z + 0.05},
  ...gRun.L,
  {t0: 2.95, t1: 13.72, x: LAY.gx + 0.13, z: gStopZ + 0.02},
  {t0: 13.95, t1: 14.2, x: LAY.gx + 0.13, z: gStopZ + 0.3},
  {t0: 14.42, t1: 21.74, x: LAY.gx + 0.13, z: ZP - 1.76},
  {t0: 21.92, t1: 22.52, x: LAY.gx + 0.13, z: ZP - 1.52},
  {t0: 22.74, t1: 23.3, x: LAY.gx + 0.13, z: ZP - 1.95},
  {t0: 23.5, t1: 23.64, x: LAY.gx + 0.13, z: ZP - 1.62},
  {t0: 23.84, t1: 99, x: LAY.gx + 0.13, z: ZP - 1.15},
];
const gStepsR: Plant[] = [
  {t0: -99, t1: TAU0 + 0.16, x: LAY.gx - 0.13, z: G0.z - 0.05},
  ...gRun.R,
  {t0: 3.05, t1: 13.96, x: LAY.gx - 0.13, z: gStopZ - 0.08},
  {t0: 14.18, t1: 21.9, x: LAY.gx - 0.13, z: ZP - 1.84},
  {t0: 22.05, t1: 22.5, x: LAY.gx - 0.13, z: ZP - 1.7},
  {t0: 22.72, t1: 23.48, x: LAY.gx - 0.13, z: ZP - 2.0},
  {t0: 23.7, t1: 99, x: LAY.gx - 0.13, z: ZP - 1.27},
];
export const G_PLANTS = {L: gStepsL, R: gStepsR};

/** the guard's pelvis Z after the stop (real coordinates) */
const gZhide = (t: number) => keyed(t, [
  [2.9, gStopZ], [13.72, gStopZ], [14.1, gStopZ + 0.22], [14.45, ZP - 1.8], [21.75, ZP - 1.8], [22.05, ZP - 1.62], [22.5, ZP - 1.62], [22.72, ZP - 1.98], [23.32, ZP - 1.98], [23.58, ZP - 1.74], [23.8, ZP - 1.42], [24.05, ZP - 1.2], [28.3, ZP - 1.2],
]);

const torchArm = (aimLocal: V3): Arm4 => {
  // his left hand holds the flashlight out along the line to the aim point
  const sh = v3(BODY_G.shW, BODY_G.hipY + BODY_G.spine, 0);
  const d = norm3(sub3(aimLocal, sh));
  return {hand: add3(add3(sh, mul3(d, 120)), v3(0, -34, 0)), shape: 'grip', pole: v3(0.5, -0.8, -0.3)};
};

export const guardAt = (t: number): Char => {
  const chase = t < 2.9 || t >= BOLT;
  const tau = t >= BOLT ? t - DUR : t;
  const z = chase ? gZchase(tau) : gZhide(t);
  const g = v3(LAY.gx, 0, z);
  // heading: toward her (+Z), with search turns
  const h = chase ? 0 : keyed(t, [[2.9, 0], [4.55, 0], [4.75, -24], [4.95, 18], [5.15, 0], [17.3, 0], [17.7, 10], [18.1, -32], [18.9, -40], [19.6, 0], [28.3, 0]]);
  const fl = footAt(G_PLANTS.L, tau), fr = footAt(G_PLANTS.R, tau);
  const toLocal = (f: {x: number; y: number; z: number}) => {
    const q = worldToCard(g, h, v3(f.x, 0, f.z));
    return v3(q.x, 14 + f.y * U, q.z);
  };
  const v = chase ? gSpeed(tau) : 0;
  const run = Math.min(1, v / 1.2);
  const ph = (2 * Math.PI * (tau - GPH)) / GTS;
  // where the flashlight points (world)
  let aim = v3(LAY.xp, 0.6, PANEL_Z);
  if (chase && tau < 1.95) aim = v3(LAY.xp + 0.6 * Math.sin(tau * 3.1), 0.9 + 0.4 * Math.sin(tau * 2.3), z + 4);
  else if (!chase) {
    aim = keyed(t, [
      [2.9, v3(LAY.xp, 0.7, PANEL_Z)], [4.5, v3(LAY.xp, 0.8, PANEL_Z)], [4.75, v3(-0.9, 0.9, PANEL_Z + 1)], [4.95, v3(1.0, 1.0, PANEL_Z + 1.2)], [5.2, v3(LAY.xp, 0.8, PANEL_Z)],
      [12.6, v3(LAY.xp - 0.6, 0.8, PANEL_Z)], [13.4, v3(LAY.xp + 0.5, 0.75, PANEL_Z)], [14.6, v3(LAY.xp, 0.85, PANEL_Z)], [15.15, v3(LAY.xp, 0.2, PANEL_Z)],
      [17.4, v3(LAY.xp, 0.35, PANEL_Z)], [17.9, v3(LAY.xp + 0.6, 1.0, PANEL_Z + 3)], [18.9, v3(-0.8, 1.1, PANEL_Z + 4)], [19.7, v3(LAY.xp, 0.8, PANEL_Z)],
      [20.2, v3(LAY.xp - 0.52, 0.9, PANEL_Z - 0.2)], [22.5, v3(LAY.xp - 0.52, 0.9, PANEL_Z - 0.2)], [22.62, v3(1.2, 2.4, PANEL_Z + 2)], [22.85, v3(-1.2, 0.3, PANEL_Z + 1)],
      [23.2, v3(LAY.xp - 0.3, 0.7, PANEL_Z)], [24.3, v3(LAY.xp, 1.1, PANEL_Z + 0.2)], [27.2, v3(LAY.xp, 1.3, ZP)], [28.3, v3(LAY.xp, 1.2, ZP)],
    ]);
  }
  if (t >= BOLT) aim = v3(LAY.xp + 0.8 * Math.sin(tau * 5), 0.4 + 0.5 * Math.sin(tau * 3.7 + 1), z + 3);
  const aimL = worldToCard(g, h, aim, 1);
  // ---- body
  const bob = -17 * run - 6 * run * Math.cos(ph - 0.6);
  const lean = keyed(t, [[2.9, 2], [3.35, 2], [4.4, 12], [4.55, 12], [4.8, 16], [5.15, 6], [15.95, 6], [16.12, 32], [17.0, 30], [17.5, 10], [21.75, 8], [21.95, 18], [22.5, 16], [22.62, -14], [22.9, -4], [23.4, 4], [23.8, 10], [24.4, -6], [25.3, -2], [28.3, 2]]);
  const face = chase ? (tau < 0 ? mix(FACES.gGotcha, FACES.gShock, ss(tau, TAU0 + 0.08, TAU0 + 0.2)) : mix(FACES.gShock, FACES.gSearch, ss(tau, 0.3, 0.8))) : keyed(t, [
    [2.9, FACES.gSearch], [4.5, FACES.gPuzzle], [5.2, FACES.gPuzzle], [6.0, FACES.gSearch], [14.5, FACES.gSquint], [16.0, FACES.gSquint], [16.2, F({...FACES.gSquint, lid: 0.6})],
    [17.6, FACES.gPuzzle], [18.2, FACES.gSearch], [20.85, FACES.gSearch], [21.1, FACES.gShock], [21.75, F({...FACES.gShock, open: 0.3})], [22.5, F({...FACES.gShock, open: 0.3})],
    [22.6, FACES.gJaw], [23.2, FACES.gSquint], [24.3, FACES.gSquint], [24.6, FACES.gJaw], [26.1, FACES.gJaw], [26.4, FACES.gStern], [27.2, FACES.gStern], [27.6, FACES.gGotcha],
  ]);
  let pose: Pose4 = {
    pel: v3(0, BODY_G.hipY + bob, 0), hipYaw: 0, pitch: chase ? 4 + 12 * (v / 3) : lean, roll: 0, twist: chase ? 5 * run * Math.sin(ph / 2) : 0,
    hy: 0, hp: 0, hr: 0, footL: toLocal(fl), footR: toLocal(fr), toeL: fl.toe, toeR: fr.toe,
    armL: torchArm(aimL), armR: {hand: v3(-BODY_G.shW - 14, BODY_G.hipY + 20, 16), shape: 'mitt'}, face,
  };
  if (chase && v > 0.2) {
    const a = Math.min(1, v / 2.6), sw = Math.sin(ph / 2);
    pose.armR = {hand: v3(-BODY_G.shW - 6, 210 + 30 * a * Math.max(0, -sw), 20 - 80 * a * sw), shape: 'fist', pole: v3(-0.3, -0.6, -0.8)};
  }
  // head search turns and the sudden lean (the head leads)
  if (!chase) {
    pose.hy = keyed(t, [[2.9, 0], [3.45, -10], [4.05, 12], [4.5, 0], [4.62, 30], [4.82, -34], [5.05, 10], [5.25, 0], [17.4, 0], [17.7, 22], [18.4, -10], [21.0, 0], [28.3, 0]]);
    pose.hp = keyed(t, [[2.9, 0], [14.5, 0], [15.0, 12], [15.9, 10], [16.12, -6], [17.2, -4], [17.6, 4], [21.0, 0], [21.2, -6], [28.3, 0]]);
    pose.hr = keyed(t, [[2.9, 0], [4.6, 0], [4.9, 10], [5.2, 0], [16.4, 0], [16.6, -8], [17.2, -6], [17.6, 0], [26.3, 0], [26.5, -9], [26.9, 0]]);
  }
  // the reach for the floating hand: right hand out, then the recoil (arms up, flashlight swinging)
  if (!chase) {
    const rch = ss(t, 21.75, 22.15) * (1 - ss(t, 22.5, 22.62));
    pose.pel = add3(pose.pel, v3(0, -14 * rch, 0));
    const stepDip = Math.sin(Math.PI * ss(t, 13.72, 14.5)) + Math.sin(Math.PI * ss(t, 23.3, 24.0));
    pose.pel = add3(pose.pel, v3(0, -16 * stepDip, 0));
    const handW = v3(LAY.xp - 0.32, 0.98, PANEL_Z - 0.62);
    const tgt = worldToCard(g, h, handW, 1);
    pose.armR = {hand: mix(pose.armR.hand, tgt, rch), shape: rch > 0.5 ? 'open' : 'mitt', splay: 0.6, pole: v3(-0.6, -0.6, -0.4)};
    const rec = ss(t, 22.52, 22.66) * (1 - ss(t, 23.0, 23.4));
    if (rec > 0) {
      pose.armR = {hand: mix(pose.armR.hand, v3(-BODY_G.shW - 40, 380, 40), rec), shape: 'open', splay: 1};
      pose.pel = add3(pose.pel, v3(0, 12 * Math.sin(Math.PI * ss(t, 22.52, 22.78)), 0));
    }
    // hand to the belt, cuffs out and up
    const belt = ss(t, 27.18, 27.4);
    const up = ss(t, 27.45, 27.75);
    if (belt > 0) {
      const beltP = v3(-BODY_G.torsoWh - 4, BODY_G.hipY + 4, 8), raised = v3(-BODY_G.shW - 10, 300, 70);
      pose.armR = {hand: mix(mix(pose.armR.hand, beltP, belt), raised, up), shape: 'grip', pole: v3(-0.7, -0.6, -0.3)};
    }
  }
  // chase: the cuffs hand and the lunge, the fall, the scramble up
  let prone = 0;
  if (chase && tau < GR.a0 + 0.1) {
    const lu = ss(tau, TAU0 + 0.12, TAU0 + 0.44);
    const down = ss(tau, TAU0 + 0.3, TAU0 + 0.52);
    const upU = ss(tau, -0.18, 0.55);
    prone = down * (1 - upU);
    const lunge: Pose4 = {...pose, pel: v3(0, 120, 10), pitch: 52, armR: {hand: v3(-40, 300, 190), shape: 'open', splay: 1}, armL: {hand: v3(40, 300, 190), shape: 'grip'}, face: FACES.gShock,
      footL: v3(30, 30, -40), footR: v3(-30, 60, -150), toeL: 30, toeR: 40};
    const flat: Pose4 = {...pose, pel: v3(0, 36, -10), pitch: 84, hp: -50, armR: {hand: v3(-82, 36, 250), shape: 'open', splay: 1}, armL: {hand: v3(82, 40, 240), shape: 'grip'}, face: F({...FACES.gJaw, wide: 0.5}),
      footL: v3(28, 20, -150), footR: v3(-28, 24, -155), toeL: 80, toeR: 80};
    const kneel: Pose4 = {...pose, pel: v3(0, 100, -20), pitch: 30, hp: -20, armR: {hand: v3(-60, 40, 110), shape: 'mitt'}, armL: {hand: v3(60, 60, 120), shape: 'grip'}, face: FACES.gStern,
      footL: v3(30, 14, 60), footR: v3(-30, 20, -90), toeL: 0, toeR: 60};
    let q = mix(pose, lunge, lu);
    q = mix(q, flat, down);
    if (upU > 0) q = mix(q, mix(kneel, pose, ss(tau, 0.15, 0.6)), Math.min(1, upU * 1.6));
    pose = q;
  }
  // flashlight: lens at the end of the torch in his left hand, pointing along the forearm
  return {g, h, pose, torch: {o: v3(0, 0, 0), dir: v3(0, 0, 1), on: 1}, cuffs: !chase ? ss(t, 27.2, 27.4) : t >= BOLT ? 1 : 0, prone};
};

// ------------------------------------------------------------------ shots
export type Shot = {id: string; t0: number; t1: number};
export const SHOTS: Shot[] = [
  {id: 'track', t0: 0, t1: 1.95},
  {id: 'pov', t0: 1.95, t1: 4.42},
  {id: 'rev', t0: 4.42, t1: 5.25},
  {id: 'behind', t0: 5.25, t1: 5.92},
  {id: 'lens', t0: 5.92, t1: 13.6},
  {id: 'behind2', t0: 13.6, t1: 14.5},
  {id: 'torchCU', t0: 14.5, t1: 15.2},
  {id: 'gripCU', t0: 15.2, t1: 15.9},
  {id: 'lean', t0: 15.9, t1: 16.6},
  {id: 'faceCU', t0: 16.6, t1: 17.3},
  {id: 'pov2', t0: 17.3, t1: 18.0},
  {id: 'sigh', t0: 18.0, t1: 18.5},
  {id: 'reach', t0: 18.5, t1: 20.05},
  {id: 'pov3', t0: 20.05, t1: 20.9},
  {id: 'gCU', t0: 20.9, t1: 21.72},
  {id: 'pov4', t0: 21.72, t1: 22.52},
  {id: 'recoil', t0: 22.52, t1: 23.2},
  {id: 'giggle', t0: 23.2, t1: 23.9},
  {id: 'two', t0: 23.9, t1: 25.22},
  {id: 'pov5', t0: 25.22, t1: 26.0},
  {id: 'gCU2', t0: 26.0, t1: 26.62},
  {id: 'herCU', t0: 26.62, t1: 27.18},
  {id: 'belt', t0: 27.18, t1: 27.55},
  {id: 'cuffs', t0: 27.55, t1: 28.0},
  {id: 'herCU2', t0: 28.0, t1: BOLT},
  {id: 'bolt', t0: BOLT, t1: 28.72},
  {id: 'track', t0: 28.72, t1: DUR + 0.01},
];
export const shotAt = (t: number) => SHOTS.find((s) => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];

const look = (pos: V3, tgt: V3, f: number, cy = 960, cx = 540, roll = 0): Cam => {
  const d = sub3(tgt, pos);
  const yaw = (Math.atan2(d.x, d.z) * 180) / Math.PI;
  const pitch = (Math.atan2(d.y, Math.hypot(d.x, d.z)) * 180) / Math.PI;
  return {pos, yaw, pitch, f, cx, cy, roll};
};
export const headWorld = (c: Char, b = BODY_G) => cardToWorld(c.g, c.h, v3(c.pose.pel.x, c.pose.pel.y + b.spine + b.headUp, c.pose.pel.z + Math.sin((c.pose.pitch * Math.PI) / 180) * (b.spine + b.headUp)), 1);

/** The guard's eye line (for the POV shots), with the bob of his own steps. */
export const povCam = (t: number, f = 1000, aim?: V3): Cam => {
  const g = guardAt(t);
  const hd = headWorld(g);
  const pos = v3(g.g.x + 0.02, Math.min(1.72, hd.y + 0.02), g.g.z + 0.1 + Math.sin((g.pose.pitch * Math.PI) / 180) * 0.55);
  const tgt = aim ?? v3(LAY.xp - 0.04, 0.72, PANEL_Z + 0.6);
  const c = look(pos, tgt, f, 880);
  return {...c, yaw: c.yaw + (g.pose.hy ?? 0) * 0.5 + (g.h ?? 0) * 0.6};
};

export const LENS = {push0: 6.2, push1: 8.05, drift0: 8.05, drift1: 10.6, pull0: 10.6, pull1: 13.35, fMacro: 23000};
const fLens = (t: number) => {
  const L0 = Math.log(1000), L1 = Math.log(LENS.fMacro);
  if (t < LENS.push0) return 1000;
  if (t < LENS.push1) return Math.exp(lerp(L0, L1, sm((t - LENS.push0) / (LENS.push1 - LENS.push0))));
  if (t < LENS.pull0) return Math.exp(L1 - 0.12 * ss(t, LENS.drift0, LENS.drift1));
  return Math.exp(lerp(L1 - 0.12, L0, sm((t - LENS.pull0) / (LENS.pull1 - LENS.pull0))));
};

export const camAt = (t: number): Cam => {
  const s = shotAt(t);
  const her = herAt(t), g = guardAt(t);
  switch (s.id) {
    case 'track': {
      const tau = t >= BOLT ? t - DUR : t;
      const zc = herZc(Math.min(tau, 1.62)) + 1.95 + 0.25 * ss(tau, 1.3, 1.95);
      const pos = v3(-0.92, 1.02, zc);
      const tgt = v3(XP + 0.05, 0.98, herZc(Math.min(tau, 1.62)) - 1.4);
      return look(pos, tgt, 860, 900);
    }
    case 'pov': return povCam(t, 980);
    case 'rev': {
      const hd = headWorld(g);
      const u = ss(t, s.t0, s.t1);
      return look(v3(0.62, 1.32, PANEL_Z - 0.42 + 0.05 * u), v3(hd.x, hd.y - 0.12, hd.z), 1050 + 120 * u, 900);
    }
    case 'behind':
    case 'behind2': {
      const u = ss(t, s.t0, s.t1);
      return look(v3(0.92 - 0.06 * u, 1.45, ZP + 1.25 - 0.1 * u), v3(LAY.xp - 0.35, 0.92, ZP - 1.6), 720, 960);
    }
    case 'lens': {
      const f = fLens(t);
      const c = povCam(t, f);
      // aim the push at her face height on the panel; drift sideways across the ribs in the macro
      const dr = ss(t, LENS.drift0 - 0.3, LENS.drift1 + 0.3);
      const pc = v3(LAY.xp + 0.07 - 0.15 * dr, 0.97 - 0.05 * dr, PANEL_Z);
      const k = ss(t, LENS.push0 - 0.2, LENS.push1) * (1 - ss(t, LENS.pull0, LENS.pull1 - 0.5));
      const toPanel = look(c.pos, pc, f, 960);
      return {...c, yaw: lerp(c.yaw, toPanel.yaw, k), pitch: lerp(c.pitch, toPanel.pitch, k), cy: lerp(880, 960, k)};
    }
    case 'torchCU': {
      const hw = cardToWorld(g.g, g.h, g.pose.armL.hand, 1);
      return look(v3(hw.x + 0.9, hw.y + 0.12, hw.z + 0.45), v3(hw.x + 0.05, hw.y - 0.05, hw.z + 0.12), 1500, 860);
    }
    case 'gripCU': {
      return look(v3(XP + 0.8, 0.78, ZP + 0.2), v3(XP + 0.02, 0.6, PANEL_Z + 0.06), 950, 980);
    }
    case 'lean': {
      const u = ss(t, s.t0, s.t1);
      return look(v3(-1.12, 1.18, ZP - 0.82 + 0.04 * u), v3(0.4, 1.0, ZP - 0.82), 640 + 40 * u, 1000);
    }
    case 'faceCU':
    case 'sigh':
    case 'giggle': {
      const hd = cardToWorld(her.g, her.h, v3(0, her.pose.pel.y + 150, 30), 1);
      const u = ss(t, s.t0, s.t1);
      const wide = s.id === 'giggle' ? 0.15 : 0;
      return look(v3(XP - 0.78 - wide, hd.y + 0.1, ZP + 0.12 - 0.03 * u), v3(hd.x, hd.y + 0.02, hd.z), (s.id === 'faceCU' ? 1180 : s.id === 'giggle' ? 900 : 1050) + 70 * u, 900);
    }
    case 'pov2': {
      const c = povCam(t, 1150);
      return {...c, yaw: c.yaw + 10 * ss(t, 17.55, 17.95)};
    }
    case 'reach': {
      const u = ss(t, s.t0, s.t1);
      return look(v3(-1.15, 0.95, ZP - 0.36 - 0.05 * u), v3(0.3, 0.8, ZP - 0.36), 760, 1000);
    }
    case 'pov3': {
      // his view, closer on the edge where the hand appears
      const u = ss(t, s.t0, s.t1);
      return povCam(t, 1500 + 250 * u, v3(LAY.xp - 0.22, 0.72, PANEL_Z));
    }
    case 'pov4': {
      const u = ss(t, s.t0, s.t1);
      return povCam(t, 1650 - 150 * u, v3(LAY.xp - 0.2, 0.72, PANEL_Z));
    }
    case 'ots': {
      // over his right shoulder: his hand goes out toward the floating hand
      const u = ss(t, s.t0, s.t1);
      return look(v3(LAY.gx - 0.58, 1.66, g.g.z - 0.25 + 0.06 * u), v3(LAY.xp - 0.16, 0.74, PANEL_Z - 0.1), 1000, 980);
    }
    case 'pov5': return povCam(t, 1000);
    case 'gCU':
    case 'gCU2': {
      const hd = headWorld(g);
      const u = ss(t, s.t0, s.t1);
      return look(v3(0.42, hd.y - 0.06, hd.z + 1.05), v3(hd.x, hd.y - 0.05, hd.z), 1300 + (s.id === 'gCU' ? 900 : 300) * u, 820);
    }
    case 'recoil':
    case 'two':
    case 'bolt': {
      const u = ss(t, s.t0, s.t1);
      const zc = ZP - 0.75 + (s.id === 'bolt' ? 0.5 * ss(t, BOLT, 28.72) : 0);
      // after the bolt the world is in chase coordinates (two modules back; the corridor repeats, so nothing moves)
      const shift = s.id === 'bolt' ? -M2 : 0;
      return look(v3(-1.2, 1.05, zc + shift + (s.id === 'two' ? 0.05 * u : 0)), v3(0.4, 0.95, zc + shift), s.id === 'recoil' ? 520 : 560, 1010);
    }
    case 'herCU':
    case 'herCU2': {
      const hd = cardToWorld(her.g, her.h, v3(0, her.pose.pel.y + 190, 0), 1);
      const u = ss(t, s.t0, s.t1);
      return look(v3(LAY.gx + 0.15, hd.y + 0.05, hd.z - 0.95 + 0.06 * u), v3(hd.x, hd.y + 0.02, hd.z), 1500 + 100 * u, 900);
    }
    case 'belt': {
      const hp = cardToWorld(g.g, g.h, v3(-BODY_G.torsoWh, BODY_G.hipY + 30, 0), 1);
      return look(v3(hp.x - 0.85, hp.y + 0.3, hp.z + 0.35), v3(hp.x, hp.y + 0.15, hp.z + 0.05), 1050, 900);
    }
    case 'cuffs':
    default:
      return look(v3(-0.6, 1.4, ZP - 0.6), v3(0, 1.2, ZP - 1.2), 1000);
  }
};
export {M2, GAP};
