// V5 story: every character state and camera as a pure function of film time t (s), keyed to the locked narration
// words (data/timeline.json). World in metres (layout5.ts). She hides at (LAY.xp, LAY.zp) facing -Z; the guard comes
// from -Z. The chase (opening and ending) runs in chase time tau = t (opening) or t - DUR (after the bolt), in the
// unwrapped coordinates where the bolt starts two corridor modules behind the hiding spot.
//
// V5 opening (the hook): already mid-chase, the guard about two metres behind her, reaching; she brakes, turns and
// swings the panel up between them (0.4-1.3), plants it a little off to one side, then slides it across herself
// while he creeps in, so from his line the smear sweeps over her body (1.5-2.4) before she sinks out of sight.
import {BODY_G, BODY_P} from './cast6';
import {Arm4, FACE0, Face4, joints4, Pose4, pouchLocal} from './Crew6';
import {add3, Cam, cardToWorld, mul3, norm3, sub3, U, V3, v3, worldToCard, yawV} from './geo6';
import {BOLT, DUR, herDist, herSpeed, LAY, RUN, TAU0} from './layout6';
import {FACES, keyed, mix} from './poses6';
import {ShieldPose, SH} from './Shield6';
import {footAt, Plant, runPlants} from './steps6';

const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
export const ss = (t: number, a: number, b: number) => sm((t - a) / (b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const M2 = 2 * LAY.mod;
export const ZB = LAY.zp - M2; // the bolt starts here (chase coordinates)
const XP = LAY.xp, ZP = LAY.zp;
export const PANEL_Z = ZP - LAY.shieldGap; // panel plane while she hides
const GAP = LAY.shieldGap * U; // panel in front of her pelvis, rig units

export type Char = {g: V3; h: number; pose: Pose4; sh?: ShieldPose; cuffs?: number; reach?: number};

// ------------------------------------------------------------------ panel poses (her card-local units)
const panel = (c: V3, ua: V3, va: V3): ShieldPose => ({c, ua: norm3(ua), va: norm3(va)});
const P_FRONT = panel(v3(0, SH.h / 2, GAP), v3(1, 0, 0), v3(0, 1, 0)); // standing on the floor in front of her
const P_OFF = panel(v3(58, SH.h / 2, GAP), v3(1, 0, 0.08), v3(0, 1, 0)); // planted in a hurry, a little to her left
const P_CARRY = panel(v3(BODY_P.shW + 50, 196, 64), v3(0.18, 0, 1), v3(0, 1, 0)); // carried at her left side, upright, leading edge out in front
const P_LIFT = panel(v3(78, 236, 86), v3(0.75, 0.05, 0.66), v3(0, 1, 0)); // swung up and round, mid-air
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

// V6 reveal timing (narration: "Then" 23.93, "lower the shield" 24.05-24.93, "and reveal" 25.28-25.81)
export const REVEAL = {lift0: 23.72, lift1: 24.12, low0: 24.12, low1: 24.78, slide0: 25.25, slide1: 25.8, turn0: 25.95, turn1: 26.7, LIFT: 78, SLIDE: -200};

// the swing: up from her side and round in front (0.5-1.25, lands on the floor), then slid across her (1.6-2.3)
export const SWING = {up0: 0.5, up1: 0.88, down1: 1.25, slide0: 1.6, slide1: 2.3};
const swing = (t: number) => {
  if (t < SWING.up1) return mixPanel(P_CARRY, P_LIFT, ss(t, SWING.up0, SWING.up1));
  if (t < SWING.down1) return mixPanel(P_LIFT, P_OFF, ss(t, SWING.up1, SWING.down1));
  return mixPanel(P_OFF, P_FRONT, ss(t, SWING.slide0, SWING.slide1));
};

// ------------------------------------------------------------------ her chase
export const herZc = (tau: number) => ZB + herDist(tau);
const RUN_TS = 0.16, RUN_PHASE = 0.02;
const herRun = runPlants({t0: TAU0 + 0.16, t1: RUN.brake1 - 0.12, ts: RUN_TS, phase: RUN_PHASE, contact: 0.1, zAt: herZc, vAt: herSpeed, x: XP, half: 0.1, lead: 0.12, dirZ: 1});
const stance0L: Plant = {t0: -99, t1: (herRun.L[0]?.t0 ?? 0) - 0.13, x: XP - 0.13, z: ZB};
const stance0R: Plant = {t0: -99, t1: (herRun.R[0]?.t0 ?? 0) - 0.13, x: XP + 0.13, z: ZB + 0.03};
// the brace: a wide staggered stance facing -Z (her left is -X), feet planted as the panel comes round
const BRACE_L = {x: XP - 0.17, z: ZP - 0.08}, BRACE_R = {x: XP + 0.17, z: ZP + 0.1};
const herPlantsL: Plant[] = [stance0L, ...herRun.L, {t0: 0.92, t1: 99, ...BRACE_L}];
const herPlantsR: Plant[] = [stance0R, ...herRun.R, {t0: 1.06, t1: 99, ...BRACE_R}];
const lastRun = (pl: Plant[]) => pl[pl.length - 2];
lastRun(herPlantsL).t1 = Math.min(lastRun(herPlantsL).t1, 0.78);
lastRun(herPlantsR).t1 = Math.min(lastRun(herPlantsR).t1, 0.9);
export const HER_PLANTS = {L: herPlantsL, R: herPlantsR};

const herHeadingChase = (tau: number) => {
  // 180 = facing -Z (at the bolt and at the hiding spot); 360 = running +Z. Both turns go through 270 (facing -X,
  // the side the tracking camera runs on), so we see her face as she turns.
  if (tau < 0.2) return lerp(180, 360, ss(tau, TAU0 + 0.04, TAU0 + 0.3));
  return lerp(360, 180, ss(tau, 0.48, 1.02));
};

const F = (o: Partial<Face4>, base: Face4 = FACE0): Face4 => ({...base, ...o});
const handsOnTop = (s: ShieldPose): {L: Arm4; R: Arm4} => ({L: {hand: onPanel(s, 72, SH.h / 2 - 6, -12), shape: 'grip'}, R: {hand: onPanel(s, -72, SH.h / 2 - 6, -12), shape: 'grip'}});
const handsOnGrips = (s: ShieldPose, dy = 0): {L: Arm4; R: Arm4} => ({L: {hand: onPanel(s, 62, 10 + dy, -14), shape: 'grip', pole: v3(0.25, -0.9, -0.35)}, R: {hand: onPanel(s, -62, 10 + dy, -14), shape: 'grip', pole: v3(-0.25, -0.9, -0.35)}});
const base = (pel: V3, pitch: number, hp: number, face: Face4, arms: {L: Arm4; R: Arm4}, extra: Partial<Pose4> = {}): Pose4 => ({
  pel, hipYaw: 0, pitch, roll: 0, twist: 0, hy: 0, hp, hr: 0, footL: v3(0, 0, 0), footR: v3(0, 0, 0), toeL: 0, toeR: 0, armL: arms.L, armR: arms.R, face, ...extra,
});

/** Her state over the whole film. */
export const herAt = (t: number): Char => {
  const tau = t >= BOLT ? t - DUR : t;
  if (t >= BOLT || tau < 0.9) return herChase(tau);
  return herHide(t);
};

const herChase = (tau: number): Char => {
  const z = herZc(tau);
  const h = herHeadingChase(tau);
  const g = v3(XP, 0, z);
  const v = herSpeed(tau);
  const acc = (herSpeed(tau + 0.02) - herSpeed(tau - 0.02)) / 0.04;
  const run = Math.min(1, v / 1.2);
  const ph = (2 * Math.PI * (tau - RUN_PHASE)) / RUN_TS;
  const bob = -13 * run - 6 * run * Math.cos(ph - 0.6);
  const pitch = 4 + 12 * (v / 3) + 1.4 * acc;
  // the panel: lowered at her right side at the bolt, swung to her left side as she turns away
  let sh: ShieldPose;
  if (tau < -0.6) {
    const u = ss(tau, TAU0 + 0.26, TAU0 + 0.55);
    const turned = yawPanel(P_SIDE_R, -(h - 180));
    sh = mixPanel(turned, P_CARRY, u);
  } else sh = tau < SWING.up0 ? P_CARRY : swing(tau);
  // arms: the right swings with the run (reaching back for balance when she looks back), the left holds the panel
  const a = Math.min(1, v / 3), sw = Math.sin(ph / 2);
  let armR: Arm4 = {hand: v3(-BODY_P.shW - 8, 205 + 30 * a * Math.max(0, sw) - 12 * a * Math.max(0, -sw), 16 + 76 * a * sw), shape: 'fist', pole: v3(-0.3, -0.6, -0.8)};
  let armL: Arm4 = {hand: onPanel(sh, 0, 34, 14), shape: 'grip', pole: v3(0.7, -0.4, -0.5)};
  if (tau < -0.6) {
    const boltR: Arm4 = {hand: onPanel(sh, 0, SH.h / 2 - 44, -10), shape: 'grip'};
    armR = {...armR, hand: mix(boltR.hand, armR.hand, ss(tau, TAU0 + 0.08, TAU0 + 0.3))};
    armL = {...armL, hand: mix(v3(BODY_P.shW + 20, 160, 30), armL.hand, ss(tau, TAU0 + 0.2, TAU0 + 0.5))};
  }
  // head: alarmed look back over her right shoulder (toward the camera side), flicking forward once
  const look = Math.max(ss(tau, -0.62, -0.46) * (1 - ss(tau, -0.3, -0.18)), ss(tau, -0.12, 0.0) * (1 - ss(tau, 0.36, 0.5)));
  const face = mix(mix(FACES.run, F({...FACES.alarm, wide: 1, open: 0.7, brow: 1}), look), F({...FACES.focus, brow: -0.1, browIn: 0.6, open: 0.4, mw: 12}), ss(tau, 0.45, 0.62));
  const fl = footAt(HER_PLANTS.L, tau), fr = footAt(HER_PLANTS.R, tau);
  const toLocal = (f: {x: number; y: number; z: number}) => {
    const p = worldToCard(g, h, v3(f.x, 0, f.z));
    return v3(p.x, 14 + f.y * U, p.z);
  };
  const pose: Pose4 = {
    pel: v3(0, BODY_P.hipY + bob, 0), hipYaw: 0, pitch, roll: 0, twist: -26 * look + 8 * run * sw, hy: -58 * look, hp: -8 * look, hr: 6 * look,
    footL: toLocal(fl), footR: toLocal(fr), toeL: fl.toe, toeR: fr.toe, armL, armR, face,
    sway: 7 * run * Math.sin(ph / 2 + 0.9) + 0.06 * (herHeadingChase(tau - 0.06) - herHeadingChase(tau)) * 10,
  };
  // the brace and the swing: knees bend, both hands go to the panel, the right catches its far edge
  if (tau >= 0.4) {
    const top = handsOnTop(sh);
    const bend = ss(tau, 0.45, 0.85);
    pose.pel = add3(pose.pel, v3(0, -26 * bend, -10 * bend));
    pose.armL = {hand: mix(pose.armL.hand, onPanel(sh, 70, 60, -12), ss(tau, 0.45, 0.8)), shape: 'grip', pole: v3(0.6, -0.6, -0.4)};
    pose.armR = {hand: mix(pose.armR.hand, top.R.hand, ss(tau, 0.62, 0.95)), shape: ss(tau, 0.62, 0.95) > 0.7 ? 'grip' : 'open', splay: 0.9, pole: v3(-0.6, -0.5, -0.5)};
  }
  return {g, h, pose, sh};
};

const herHide = (t: number): Char => {
  const g = v3(XP, 0, ZP);
  const h = t < 1.1 ? herHeadingChase(t) : 180;
  let sh = swing(t);
  const land = t - SWING.down1;
  if (land > 0 && land < 0.5) sh = {...sh, c: add3(sh.c, v3(0, -5 * Math.exp(-9 * land) * Math.sin(20 * land), 0))};
  // grip adjustments: the quick re-grip (15.55) and the shift as he peers round the side (16.6-17.0)
  const shift = ss(t, 16.55, 16.95) * (1 - ss(t, 18.6, 19.0));
  sh = {...sh, c: add3(sh.c, v3(-12 * shift, 0, 5 * shift)), ua: norm3(v3(1, 0, -0.1 * shift))};
  const R = REVEAL;
  const lift = ss(t, R.lift0, R.lift1) * (1 - ss(t, R.low0, R.low1));
  const slide = ss(t, R.slide0, R.slide1);
  const set = t - R.low1;
  sh = {...sh, c: add3(sh.c, v3(R.SLIDE * slide, R.LIFT * lift + (set > 0 && set < 0.4 ? -4 * Math.exp(-10 * set) * Math.sin(24 * set) : 0), 0))};
  const turnU = ss(t, R.turn0, R.turn1);
  if (turnU > 0) sh = mixPanel(sh, P_SIDE_R, turnU);
  // body
  const standHold = base(v3(0, BODY_P.hipY - 22, -14), 8, -6, FACES.alarm, handsOnTop(sh));
  const crouchHold = base(v3(0, 66, -48), 26, -12, FACES.focus, handsOnGrips(sh));
  const leanBack = base(v3(0, 64, -66), 16, -16, FACES.hold, handsOnGrips(sh));
  const crouchLow = base(v3(0, 54, -64), 29, -8, FACES.hold, handsOnGrips(sh, -6));
  const br = Math.sin(t * 2 * Math.PI * 0.42);
  const freeze = ss(t, 17.4, 17.55) * (1 - ss(t, 17.95, 18.1));
  let p = keyed(t, [
    [1.1, standHold],
    [2.35, standHold],
    [3.05, crouchHold, (x) => 1 - Math.pow(1 - x, 2.4)],
    [14.75, crouchHold],
    [15.15, leanBack], // the beam comes straight at her: she leans back from the panel
    [15.9, leanBack],
    [16.3, crouchHold],
    [16.7, crouchLow], // he peers round the side: she sinks lower and edges away
    [18.2, crouchLow],
    [18.55, {...crouchLow, pel: v3(0, 53, -64), pitch: 31}],
  ]);
  const sideLean = ss(t, 16.6, 17.0) * (1 - ss(t, 18.3, 18.7));
  p = {...p, roll: p.roll - 8 * sideLean, pel: add3(p.pel, v3(-12 * sideLean, 1.6 * br * (1 - freeze), 0)), pitch: p.pitch + 0.8 * br * (1 - freeze)};
  if (land > 0 && land < 0.45) p = {...p, pel: add3(p.pel, v3(0, -10 * Math.sin(Math.PI * land / 0.45), 0))};
  // the quick re-grip: hands come off the grips and back (15.5-15.8)
  const regrip = Math.sin(Math.PI * ss(t, 15.5, 15.82));
  if (regrip > 0.01) {
    p.armL = {...p.armL, hand: add3(p.armL.hand, v3(10 * regrip, 22 * regrip, -16 * regrip)), shape: regrip > 0.5 ? 'open' : 'grip', splay: 0.7};
    p.armR = {...p.armR, hand: add3(p.armR.hand, v3(-6 * regrip, 14 * regrip, -10 * regrip))};
  }
  // faces: her eyes follow his flashlight
  const fk = keyed(t, [
    [1.1, F({...FACES.focus, brow: -0.1, browIn: 0.6, open: 0.4, mw: 12})], [1.6, F({brow: 0.5, browIn: 0.7, wide: 0.7, mw: 10, curve: -0.3, open: 0.2, gy: 0.1})],
    [2.4, F({brow: 0.6, browIn: 0.8, wide: 0.9, mw: 9, curve: -0.3, gx: -0.3})], [3.1, FACES.focus],
    [3.9, F({...FACES.focus, gx: 0.6, brow: 0.3})], [4.6, F({...FACES.hold, gx: -0.3})], [5.3, F({brow: 0.2, browIn: 0.5, mw: 9, curve: -0.2, gx: -0.4, blush: 0.3})],
    [13.8, F({brow: 0.2, browIn: 0.5, mw: 9, curve: -0.2, gx: -0.2, blush: 0.3})],
    [14.8, F({...FACES.hold, gx: -0.6, gy: -0.2})], [15.2, F({...FACES.hold, wide: 1, brow: 1, gx: 0.5, gy: -0.3})], [15.6, F({...FACES.hold, wide: 1, brow: 1, gx: -0.4, gy: 0.1})],
    [16.1, F({...FACES.hold, wide: 0.8, brow: 0.7, gx: 0.6})], [16.7, F({...FACES.hold, wide: 1, brow: 1, gx: -0.7})], [17.45, F({...FACES.hold, wide: 1, brow: 1, gx: -0.8, sweat: 1})],
    [17.95, F({...FACES.hold, gx: 0.3, sweat: 1})], [18.25, F({...FACES.relief, sweat: 0.6})], [18.55, F({...FACES.relief, lid: 0.25, sweat: 0})],
    [18.9, F({brow: 0.3, browIn: -0.2, mw: 15, curve: 0.6, smirk: 0.4, gx: -0.3})], [20.4, F({brow: 0.3, browIn: -0.2, mw: 15, curve: 0.7, smirk: 0.5, gx: -0.4})],
    [21.6, F({brow: 0.4, mw: 15, curve: 0.8, smirk: 0.5, gx: -0.5})], [22.5, F({...FACES.giggle, gx: -0.3})], [23.25, FACES.giggle],
    [23.85, F({...FACES.giggle, squint: 0.75})], [24.3, F({brow: 0.5, browIn: 0.1, mw: 15, curve: 0.7, gx: -0.1})], [25.2, FACES.smug], [27.3, FACES.smug],
    [27.5, F({...FACES.smug, brow: 0.6, curve: 0.2})], [27.72, F({...FACES.uhoh, open: 0.45, wide: 1})],
  ]);
  p = {...p, face: fk, sway: 3 * Math.sin(t * 1.9) * (1 - freeze) + 9 * Math.sin(Math.PI * ss(t, 16.55, 17.1)) - 8 * Math.sin(Math.PI * ss(t, 23.95, 24.7))};
  const blinkAt = [3.3, 6.6, 12.4, 14.65, 19.2, 21.0, 24.95, 26.3];
  const bl = blinkAt.reduce((m, b) => Math.max(m, 1 - Math.min(1, Math.abs(t - b) / 0.07)), 0);
  p.face = {...p.face, blink: Math.max(p.face.blink, bl * (1 - freeze))};
  // the giggle: shoulders shake, her free hand comes to her mouth
  const gig = ss(t, 22.75, 22.95) * (1 - ss(t, 23.55, 23.75));
  p = {...p, pel: add3(p.pel, v3(0, 2.2 * gig * Math.sin(t * 2 * Math.PI * 7), 0)), twist: p.twist + 3 * gig * Math.sin(t * 2 * Math.PI * 7 + 1)};
  // the reach round the panel's left edge (her left = the -X side): out, round, the float, the wiggle and the snatch back
  const R0 = 18.55, R1 = 19.75, BACK0 = 22.28, BACK1 = 22.5;
  const reach = ss(t, R0, R1) * (1 - ss(t, BACK0, BACK1));
  if (t > R0 - 0.3 && t < BACK1 + 0.6) {
    const edge = SH.w / 2;
    const out = onPanel(sh, edge + 32, -8, -44), around = onPanel(sh, edge + 28, 0, 24), front = onPanel(sh, edge - 10, 6, 36);
    const u = ss(t, R0, R1);
    const path = u < 0.45 ? mix(handsOnGrips(sh).L.hand, out, sm(u / 0.45)) : u < 0.75 ? mix(out, around, sm((u - 0.45) / 0.3)) : mix(around, front, sm((u - 0.75) / 0.25));
    const backU = ss(t, BACK0, BACK1);
    // the float: a slow drift, then the wiggle (21.55-21.95), then she holds still as his hand comes in
    const drift = v3(0, 6 * Math.sin(t * 2.4), 4 * Math.sin(t * 1.7));
    const hand = backU > 0 ? mix(add3(path, drift), handsOnGrips(sh).L.hand, backU) : add3(path, mul3(drift, ss(t, R1 - 0.2, R1 + 0.3)));
    const wig = (k: number) => 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 4.6 + k * 1.2);
    const wiggle = ss(t, 21.55, 21.65) * (1 - ss(t, 21.9, 22.0));
    p = {
      ...p,
      twist: p.twist + 14 * reach,
      pitch: p.pitch - 4 * reach,
      armL: {hand, shape: reach > 0.55 ? 'open' : 'grip', splay: 0.45 + 0.45 * reach,
        curl: [0, 1, 2, 3].map((k) => 0.12 + 0.55 * wiggle * wig(k) + (1 - reach) * 0.4),
        wrist: 8 * Math.sin(t * 2 * Math.PI * 0.7) * reach + 14 * wiggle * Math.sin(t * 2 * Math.PI * 2.3), pole: v3(0.9, -0.5, -0.4)},
    };
  }
  if (gig > 0) {
    const jj = joints4(BODY_P, p);
    const mouth = add3(add3(jj.Hc, mul3(jj.hz, 74)), mul3(jj.hy, -30));
    p = {...p, armL: {hand: mix(p.armL.hand, mouth, gig), shape: 'mitt', pole: v3(0.7, -0.7, 0)}, hp: p.hp + 6 * gig};
  }
  // the reveal: she rises behind the panel lifting it with her, lowers it to the floor (its top edge uncovers her face),
  // slides it aside to her right, then (off screen) stands it on its edge at her right side
  if (t > R.lift0 - 0.05) {
    const R6 = REVEAL;
    const rise = ss(t, R6.lift0 - 0.04, R6.lift1 + 0.04);
    const lowK = Math.sin(Math.PI * ss(t, R6.low0, R6.low1));
    // grips a little narrower than the hiding grips, elbows down and in, so nothing shows past the panel's sides
    const grips = {L: {hand: onPanel(sh, 40, 12, -14), shape: 'grip' as const, pole: v3(-0.25, -0.6, 0.75)}, R: {hand: onPanel(sh, -40, 12, -14), shape: 'grip' as const, pole: v3(0.25, -0.6, 0.75)}};
    // half-standing (knees bent) while hidden, so a short lift keeps her covered; she straightens once it is down
    const tall = ss(t, R6.low1 + 0.02, R6.slide0 - 0.05);
    const stand: Pose4 = base(v3(0, BODY_P.hipY - 30 + 20 * tall, -6), 4 + 7 * lowK, -2 - 6 * lowK, p.face, grips, {footL: p.footL, footR: p.footR});
    const q = mix(p, stand, rise);
    // hands stay on the grips through the lift and the lowering (they move with the panel)
    q.armL = {...grips.L};
    q.armR = {...grips.R};
    if (rise < 1) {
      q.armL = {...q.armL, hand: mix(p.armL.hand, grips.L.hand, ss(t, R6.lift0 - 0.12, R6.lift0 + 0.1))};
      q.armR = {...q.armR, hand: mix(p.armR.hand, grips.R.hand, ss(t, R6.lift0 - 0.12, R6.lift0 + 0.1))};
    }
    // the slide: her right hand moves to the panel's near edge and pushes it out to her right; the left lets go
    // her right hand stays on the panel and slides along it as it goes out to her right (the hand itself moves
    // steadily out to her right side, never across her)
    const toEdge = ss(t, R6.slide0 - 0.25, R6.slide0 + 0.02);
    const edgeR: Arm4 = {hand: onPanel(sh, -40 + 90 * slide, 12 + 10 * toEdge, -14), shape: 'grip', pole: v3(0.1, -0.7, 0.6)};
    const restR: Arm4 = {hand: onPanel(sh, 0, SH.h / 2 - 8, 6), shape: 'grip', pole: v3(-0.8, -0.5, -0.2)};
    if (toEdge > 0) q.armR = edgeR;
    if (turnU > 0) q.armR = {...restR, hand: mix(edgeR.hand, restR.hand, turnU)};
    const letGo = ss(t, R6.slide0 + 0.12, R6.slide0 + 0.32);
    if (letGo > 0) q.armL = {hand: mix(q.armL.hand, v3(BODY_P.shW + 18, 150, 34), letGo), shape: letGo > 0.6 ? 'mitt' : 'grip'};
    q.twist = q.twist - 9 * Math.sin(Math.PI * slide);
    q.pel = add3(q.pel, v3(-10 * Math.sin(Math.PI * slide), 0, 0));
    p = q;
    // the little wave (left hand) as he startles, then a hand on the hip, then the start of the bolt
    const wv = ss(t, 25.55, 25.72) * (1 - ss(t, 26.0, 26.2));
    const hip = ss(t, 26.15, 26.45) * (1 - ss(t, 27.55, 27.8));
    p.armL = {
      hand: mix(mix(p.armL.hand, v3(BODY_P.shW + 88, 418, 58), wv), v3(BODY_P.shW + 10, 175, -6), hip),
      shape: wv > 0.5 ? 'open' : p.armL.shape ?? 'mitt', splay: 0.8, curl: [0, 1, 2, 3].map((k) => 0.3 * (0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 3.5 + k))),
      wrist: 18 * wv * Math.sin(t * 2 * Math.PI * 3), pole: hip > 0.5 ? v3(1, 0.1, -0.5) : wv > 0.3 ? undefined : p.armL.pole,
    };
    p.hy = 6 * Math.sin(t * 1.3) * ss(t, 25, 26) - 14 * ss(t, 27.45, 27.6); // she glances down at the cuffs
    p.hp = p.hp + 10 * ss(t, 27.45, 27.6);
    p.hr = 7 * ss(t, 26.1, 26.5) * (1 - ss(t, 27.4, 27.6));
    // the panic: a flinch back before the turn
    const flinch = ss(t, 27.62, 27.85);
    p.pel = add3(p.pel, v3(0, -8 * flinch, -12 * flinch));
    p.pitch = p.pitch - 6 * flinch;
  }
  const fl = footAt(HER_PLANTS.L, t), fr = footAt(HER_PLANTS.R, t);
  const toLocal = (f: {x: number; y: number; z: number}) => {
    const q = worldToCard(g, h, v3(f.x, 0, f.z));
    return v3(q.x, 14 + f.y * U, q.z);
  };
  p.footL = toLocal(fl);
  p.footR = toLocal(fr);
  p.toeL = fl.toe;
  p.toeR = fr.toe;
  // blend in from the swing (the chase pose) while the pivot completes
  if (t < 1.45) {
    const c = herChase(t);
    const u = ss(t, 0.9, 1.45);
    return {g: mix(c.g, g, u), h, pose: {...mix(c.pose, p, u), footL: p.footL, footR: p.footR}, sh};
  }
  return {g, h, pose: p, sh, reach};
};

// ------------------------------------------------------------------ guard
// the handcuffs: stowed in the belt pouch just after the dead stop (the hand is out of shot), drawn from it at the end
export const CUFFS = {stow0: 2.5, stowIn: 2.68, stow1: 2.95, draw: 26.45};
// chase: at the bolt he stands in front of her with the cuffs, grabs at air, stumbles, then sprints after her,
// reaching. He is about two metres behind her at frame 0, brakes hard as the panel comes up (0.3-0.75), creeps in with
// his hand out (0.9-2.45) and stops dead as she vanishes.
const G0 = {z: ZB - 1.2};
const GS = {lunge0: TAU0 + 0.1, lunge1: TAU0 + 0.42, acc0: TAU0 + 0.6, acc1: TAU0 + 1.0, v: 3.3, d0: 0.3, d1: 0.75};
const gSpeedRun = (tau: number) => {
  if (tau < GS.lunge0) return 0;
  if (tau < GS.lunge1) return 1.1 * Math.sin(Math.PI * (tau - GS.lunge0) / (GS.lunge1 - GS.lunge0));
  if (tau < GS.acc0) return 0.25;
  if (tau < GS.acc1) return 0.25 + (GS.v - 0.25) * ss(tau, GS.acc0, GS.acc1);
  if (tau < GS.d0) return GS.v;
  if (tau < GS.d1) return GS.v * (1 - ss(tau, GS.d0, GS.d1));
  return 0;
};
const integ = (f: (x: number) => number, a: number, b: number, n = 120) => {
  if (b <= a) return 0;
  const h = (b - a) / n;
  let s = 0;
  for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h) * h;
  return s;
};
const G_DIST_T: number[] = [];
const G_T0 = TAU0 - 0.05, G_DT = 1 / 240;
for (let i = 0, d = 0; i < 1200; i++) {
  G_DIST_T.push(d);
  d += gSpeedRun(G_T0 + (i + 0.5) * G_DT) * G_DT;
}
const gDistRun = (tau: number) => {
  const x = (tau - G_T0) / G_DT;
  if (x <= 0) return 0;
  const i = Math.min(G_DIST_T.length - 2, Math.floor(x));
  return G_DIST_T[i] + (G_DIST_T[i + 1] - G_DIST_T[i]) * (x - i);
};
void integ;
const gBrakeZ = G0.z + gDistRun(GS.d1 + 0.01);
// the creep: small steps in with his hand out, then the dead stop
const CREEP = {z1: gBrakeZ + 0.42, t0: 0.9, t1: 2.42};
const gZchase = (tau: number) => {
  const z = G0.z + gDistRun(Math.min(tau, GS.d1 + 0.01));
  if (tau < CREEP.t0) return z;
  return lerp(gBrakeZ, CREEP.z1, ss(tau, CREEP.t0, CREEP.t1));
};
export const gStopZ = CREEP.z1;
const GTS = 0.18, GPH = 0.05;
const gRun = runPlants({t0: GS.acc0, t1: GS.d1 - 0.05, ts: GTS, phase: GPH, contact: 0.11, zAt: (x) => G0.z + gDistRun(x), vAt: gSpeedRun, x: LAY.gx, half: 0.12, lead: 0.12, dirZ: 1});
// the lunge (a half step), then the hiding-scene steps (real coordinates)
const gStepsL: Plant[] = [
  {t0: -99, t1: TAU0 + 0.1, x: LAY.gx + 0.13, z: G0.z + 0.05},
  {t0: TAU0 + 0.36, t1: GS.acc0 + 0.02, x: LAY.gx + 0.13, z: G0.z + 0.42},
  ...gRun.L,
  {t0: 0.82, t1: 1.1, x: LAY.gx + 0.13, z: gBrakeZ + 0.06},
  {t0: 1.28, t1: 1.9, x: LAY.gx + 0.13, z: gBrakeZ + 0.2},
  {t0: 2.08, t1: 4.98, x: LAY.gx + 0.15, z: CREEP.z1 + 0.06},
  {t0: 5.28, t1: 13.75, x: LAY.gx + 0.13, z: CREEP.z1 + 0.3},
  {t0: 14.08, t1: 21.72, x: LAY.gx + 0.13, z: ZP - 1.62},
  {t0: 21.85, t1: 22.52, x: LAY.gx + 0.13, z: ZP - 1.42},
  {t0: 22.74, t1: 23.3, x: LAY.gx + 0.13, z: ZP - 1.88},
  {t0: 23.5, t1: 23.64, x: LAY.gx + 0.13, z: ZP - 1.55},
  {t0: 23.95, t1: 99, x: LAY.gx + 0.13, z: ZP - 1.15},
];
const gStepsR: Plant[] = [
  {t0: -99, t1: TAU0 + 0.16, x: LAY.gx - 0.13, z: G0.z - 0.05},
  ...gRun.R,
  {t0: 0.95, t1: 1.35, x: LAY.gx - 0.13, z: gBrakeZ - 0.06},
  {t0: 1.52, t1: 2.25, x: LAY.gx - 0.13, z: gBrakeZ + 0.28},
  {t0: 2.42, t1: 5.1, x: LAY.gx - 0.15, z: CREEP.z1 - 0.06},
  {t0: 5.42, t1: 13.95, x: LAY.gx - 0.13, z: CREEP.z1 + 0.18},
  {t0: 14.2, t1: 21.92, x: LAY.gx - 0.13, z: ZP - 1.74},
  {t0: 22.08, t1: 22.5, x: LAY.gx - 0.13, z: ZP - 1.5},
  {t0: 22.72, t1: 23.48, x: LAY.gx - 0.13, z: ZP - 1.95},
  {t0: 23.74, t1: 99, x: LAY.gx - 0.13, z: ZP - 1.3},
];
// the opening's run plants must belong to the left/right lists in time order
const sortP = (a: Plant, b: Plant) => a.t0 - b.t0;
gStepsL.sort(sortP);
gStepsR.sort(sortP);
export const G_PLANTS = {L: gStepsL, R: gStepsR};

/** the guard's pelvis Z after the creep (real coordinates) */
const gZhide = (t: number) => keyed(t, [
  [2.45, CREEP.z1], [4.98, CREEP.z1], [5.6, CREEP.z1 + 0.24], [13.75, CREEP.z1 + 0.24], [14.35, ZP - 1.68], [21.7, ZP - 1.68], [22.2, ZP - 1.4], [22.5, ZP - 1.4],
  [22.72, ZP - 1.92], [23.32, ZP - 1.92], [23.58, ZP - 1.66], [23.8, ZP - 1.42], [24.05, ZP - 1.2], [BOLT, ZP - 1.2],
]);

const torchArm = (aimLocal: V3): Arm4 => {
  const sh = v3(BODY_G.shW, BODY_G.hipY + BODY_G.spine, 0);
  const d = norm3(sub3(aimLocal, sh));
  return {hand: add3(add3(sh, mul3(d, 120)), v3(0, -30, 0)), shape: 'grip', pole: v3(0.5, -0.8, -0.3)};
};

export const guardAt = (t: number): Char => {
  const tau = t >= BOLT ? t - DUR : t;
  const chase = t < 2.45 || t >= BOLT;
  const z = chase ? gZchase(tau) : gZhide(t);
  const g = v3(LAY.gx, 0, z);
  // heading: toward her (+Z), with the search turns
  const h = chase ? 0 : keyed(t, [[2.45, 0], [3.2, 0], [3.38, -28], [3.6, -6], [16.3, 0], [16.7, 14], [17.6, 14], [17.95, -30], [18.6, -36], [19.5, 0], [BOLT, 0]]);
  const fl = footAt(G_PLANTS.L, tau), fr = footAt(G_PLANTS.R, tau);
  const toLocal = (f: {x: number; y: number; z: number}) => {
    const q = worldToCard(g, h, v3(f.x, 0, f.z));
    return v3(q.x, 14 + f.y * U, q.z);
  };
  const v = chase ? gSpeedRun(tau) : 0;
  const run = Math.min(1, v / 1.2);
  const ph = (2 * Math.PI * (tau - GPH)) / GTS;
  // where the flashlight points (world): at her while chasing, across the panel as she vanishes, then the search
  const herNow = herAt(t);
  let aim = v3(LAY.xp, 1.0, herNow.g.z);
  if (chase && tau > 0.2) aim = keyed(tau, [[0.2, v3(LAY.xp, 1.0, herNow.g.z)], [0.9, v3(LAY.xp + 0.25, 0.95, PANEL_Z)], [1.6, v3(LAY.xp - 0.3, 0.85, PANEL_Z)], [2.1, v3(LAY.xp + 0.4, 0.8, PANEL_Z)], [2.45, v3(LAY.xp, 0.8, PANEL_Z)]]);
  if (!chase) {
    aim = keyed(t, [
      [2.45, v3(LAY.xp, 0.8, PANEL_Z)], [3.2, v3(LAY.xp, 0.75, PANEL_Z)], [3.42, v3(-1.1, 0.9, CREEP.z1 + 1.2)], [3.7, v3(LAY.xp - 0.2, 0.8, PANEL_Z)],
      [4.9, v3(LAY.xp + 0.3, 0.75, PANEL_Z)], [5.6, v3(LAY.xp, 0.8, PANEL_Z)],
      [12.9, v3(LAY.xp - 0.6, 0.8, PANEL_Z)], [13.6, v3(LAY.xp + 0.5, 0.75, PANEL_Z)], [14.6, v3(LAY.xp, 0.8, PANEL_Z)], [15.1, v3(LAY.xp + 0.05, 0.62, PANEL_Z)],
      [15.6, v3(LAY.xp - 0.15, 0.7, PANEL_Z)], [16.2, v3(LAY.xp + 0.1, 0.55, PANEL_Z)], [16.9, v3(LAY.xp - 0.5, 0.6, PANEL_Z)], [17.5, v3(LAY.xp - 0.45, 0.55, PANEL_Z + 0.2)],
      [18.0, v3(LAY.xp + 0.6, 1.0, PANEL_Z + 3)], [18.9, v3(-0.8, 1.1, PANEL_Z + 4)], [19.6, v3(LAY.xp, 0.8, PANEL_Z)],
      [20.2, v3(LAY.xp - 0.52, 0.9, PANEL_Z - 0.2)], [22.45, v3(LAY.xp - 0.52, 0.9, PANEL_Z - 0.2)], [22.58, v3(1.2, 2.4, PANEL_Z + 2)], [22.8, v3(-1.2, 0.3, PANEL_Z + 1)],
      [23.2, v3(LAY.xp - 0.3, 0.7, PANEL_Z)], [24.3, v3(LAY.xp, 0.95, PANEL_Z + 0.2)], [24.8, v3(LAY.xp, 0.8, PANEL_Z + 0.2)], [24.92, v3(LAY.xp + 0.2, 1.3, PANEL_Z + 0.2)], [25.25, v3(LAY.xp, 0.72, PANEL_Z + 0.2)], [26.9, v3(LAY.xp, 0.75, ZP)], [BOLT, v3(LAY.xp, 0.85, ZP)],
    ]);
  }
  if (t >= BOLT && tau < -0.3) aim = v3(LAY.xp + 0.8 * Math.sin(tau * 5), 0.7 + 0.4 * Math.sin(tau * 3.7 + 1), z + 3);
  const aimL = worldToCard(g, h, aim, 1);
  // ---- body
  const bob = -17 * run - 6 * run * Math.cos(ph - 0.6);
  const lean = keyed(t, [[2.45, 8], [2.55, -6], [2.8, 2], [3.2, 4], [3.45, 10], [3.7, 4], [5.0, 4], [5.5, 10], [13.75, 8], [14.4, 6], [15.0, 14], [15.6, 22], [16.2, 18],
    [16.7, 10], [17.2, 26], [17.6, 24], [17.95, 6], [21.72, 8], [21.95, 18], [22.45, 20], [22.58, -14], [22.85, -4], [23.4, 4], [23.8, 10], [24.4, -2], [24.95, -16], [25.25, -6], [25.9, 0], [BOLT, 2]]);
  const face = chase ? (tau < 0 ? (tau < TAU0 + 0.45 ? mix(FACES.gGotcha, FACES.gShock, ss(tau, TAU0 + 0.06, TAU0 + 0.16)) : F({...FACES.gStern, open: 0.5, mw: 14}))
    : keyed(tau, [[0, F({...FACES.gStern, open: 0.5, mw: 14})], [0.5, F({...FACES.gSearch, brow: 0.3})], [1.4, F({...FACES.gStern, brow: -0.6})], [2.3, F({...FACES.gStern, brow: -0.4})], [2.45, F({...FACES.gShock, open: 0.4})]]))
    : keyed(t, [
      [2.45, F({...FACES.gShock, open: 0.4})], [3.0, F({...FACES.gShock, open: 0.5})], [3.4, F({...FACES.gShock, gx: -0.8})], [3.65, F({...FACES.gPuzzle, gx: 0.3})], [4.9, FACES.gPuzzle], [5.4, FACES.gSearch],
      [14.0, FACES.gSearch], [14.6, FACES.gSquint], [15.3, F({...FACES.gSquint, gx: 0.3})], [15.8, F({...FACES.gPuzzle, asym: 1, gx: -0.3})], [16.4, F({...FACES.gSquint, lid: 0.6, gx: 0.5})],
      [17.2, F({...FACES.gSquint, lid: 0.55, gx: 0.8})], [17.6, F({...FACES.gPuzzle, gx: 0.2})], [18.1, FACES.gSearch], [20.4, FACES.gSearch], [20.7, F({...FACES.gPuzzle, gx: -0.4, brow: 0.6})],
      [21.05, FACES.gShock], [21.4, F({...FACES.gPuzzle, asym: 1, brow: 0.7, open: 0.2})], [21.8, F({...FACES.gSquint, open: 0.15, lid: 0.3})], [22.45, F({...FACES.gSquint, open: 0.15})],
      [22.55, FACES.gJaw], [23.2, FACES.gSquint], [24.3, FACES.gSquint], [24.6, F({...FACES.gPuzzle, brow: 0.9, gy: 0.3})], [24.85, FACES.gShock], [25.15, FACES.gJaw], [25.6, FACES.gShock], [26.05, F({...FACES.gShock, open: 0.55, brow: 0.7})], [26.35, FACES.gStern], [26.8, FACES.gGotcha],
    ]);
  let pose: Pose4 = {
    pel: v3(0, BODY_G.hipY + bob, 0), hipYaw: 0, pitch: chase ? 4 + 13 * (v / 3) : lean, roll: 0, twist: chase ? 6 * run * Math.sin(ph / 2) : 0,
    hy: 0, hp: 0, hr: 0, footL: toLocal(fl), footR: toLocal(fr), toeL: fl.toe, toeR: fr.toe,
    armL: torchArm(aimL), armR: {hand: v3(-BODY_G.shW - 14, BODY_G.hipY + 20, 16), shape: 'mitt'}, face,
  };
  // chasing: his right hand reaches out for her with the cuffs in his fist (he has had them out since the bolt)
  if (chase && tau > TAU0 + 0.5 && tau < 2.6) {
    const rch = ss(tau, -0.6, -0.3) * (1 - ss(tau, 2.45, 2.6));
    const jab = 0.5 + 0.5 * Math.sin(tau * 2 * Math.PI * 1.8);
    pose.armR = {hand: mix(pose.armR.hand, v3(-34, 296 - 12 * jab, 160 + 8 * jab), rch), shape: 'grip', pole: v3(-0.5, -0.7, -0.4)};
  }
  // the dead stop as she vanishes: a flinch back, eyes wide
  if (chase && tau > 2.3) {
    const fl2 = ss(tau, 2.42, 2.55);
    pose.pitch = lerp(pose.pitch, -6, fl2);
    pose.pel = add3(pose.pel, v3(0, 6 * Math.sin(Math.PI * fl2), -8 * fl2));
  }
  if (!chase) {
    pose.hy = keyed(t, [[2.45, 0], [3.2, 0], [3.38, -46], [3.62, -10], [3.9, 6], [4.9, 0], [14.6, 0], [15.0, -8], [15.4, 10], [15.9, -12], [16.4, 4], [17.2, 18], [17.6, 22], [17.9, 0], [20.5, 0], [20.75, -18], [21.0, -8], [28, 0]]);
    pose.hp = keyed(t, [[2.45, 0], [3.0, -4], [13.75, 0], [14.6, 6], [15.2, 10], [15.6, 4], [16.2, 8], [17.2, 4], [17.6, 2], [21.0, 0], [21.2, -6], [28, 0]]);
    pose.hr = keyed(t, [[2.45, 0], [3.1, 0], [3.3, 6], [3.7, 0], [15.4, 0], [15.6, 12], [15.95, -10], [16.3, 0], [21.2, 0], [21.4, 10], [21.7, 0], [26.2, 0], [26.4, -9], [26.8, 0]]);
    pose.roll = keyed(t, [[16.6, 0], [17.1, -10], [17.6, -12], [17.95, 0]]);
  }
  if (!chase) {
    // his cautious hand toward the floating hand, then the recoil
    const rch = ss(t, 21.78, 22.3) * (1 - ss(t, 22.42, 22.55));
    pose.pel = add3(pose.pel, v3(0, -14 * rch, 0));
    const stepDip = Math.sin(Math.PI * ss(t, 13.75, 14.4)) + Math.sin(Math.PI * ss(t, 23.3, 24.0)) + Math.sin(Math.PI * ss(t, 4.98, 5.6));
    pose.pel = add3(pose.pel, v3(0, -16 * stepDip, 0));
    const handW = v3(LAY.xp - 0.36, 0.72, PANEL_Z - 0.3);
    const tgt = worldToCard(g, h, handW, 1);
    pose.armR = {hand: mix(pose.armR.hand, tgt, rch), shape: rch > 0.4 ? 'open' : 'mitt', splay: 0.4 + 0.2 * rch, curl: [0.3, 0.1, 0.2, 0.35], pole: v3(-0.6, -0.6, -0.4)};
    const rec = ss(t, 22.48, 22.6) * (1 - ss(t, 23.0, 23.4));
    if (rec > 0) {
      pose.armR = {hand: mix(pose.armR.hand, v3(-BODY_G.shW - 40, 380, 40), rec), shape: 'open', splay: 1};
      pose.pel = add3(pose.pel, v3(0, 12 * Math.sin(Math.PI * ss(t, 22.48, 22.74)), 0));
    }
    // the startle at the reveal: arms up a little and back
    const st = Math.sin(Math.PI * ss(t, 24.8, 25.5));
    if (st > 0.01) pose.armR = {hand: mix(pose.armR.hand, v3(-BODY_G.shW + 6, 318, 150), st), shape: 'open', splay: 1, pole: v3(-0.7, -0.6, -0.2)};
    // the cuffs go back in the pouch on his belt after the chase (out of shot, behind him in his over-the-shoulder)...
    const pouchP = add3(pouchLocal(BODY_G, joints4(BODY_G, pose)), v3(0, 10, 6));
    const stow = ss(t, CUFFS.stow0, CUFFS.stowIn) * (1 - ss(t, CUFFS.stowIn + 0.02, CUFFS.stow1));
    if (stow > 0) pose.armR = {hand: mix(pose.armR.hand, pouchP, stow), shape: 'grip', pole: v3(-0.7, -0.6, -0.3), front: stow > 0.3};
    // ...and come out of it at the end: hand to the pouch, cuffs out and up
    const belt = ss(t, 26.15, CUFFS.draw);
    const up = ss(t, 26.6, 26.95);
    if (belt > 0) {
      const raised = v3(-BODY_G.shW - 10, 300, 70);
      // drawn over the torso while at the pouch, so the cuffs come out in his visible hand
      pose.armR = {hand: mix(mix(pose.armR.hand, pouchP, belt), raised, up), shape: 'grip', pole: v3(-0.7, -0.6, -0.3), front: belt > 0.3 ? true : undefined};
    }
  }
  // the bolt: he grabs at air where she was, stumbles, then runs after her
  if (chase && tau < TAU0 + 0.7) {
    const lu = Math.sin(Math.PI * ss(tau, TAU0 + 0.06, TAU0 + 0.5));
    const lunge: Pose4 = {...pose, pel: v3(0, BODY_G.hipY - 30, 20), pitch: 30, armR: {hand: v3(-40, 290, 200), shape: 'grip', pole: v3(-0.5, -0.7, -0.4)}, face: FACES.gShock, footL: v3(30, 14, 70), footR: v3(-30, 40, -60), toeL: 0, toeR: 30};
    pose = mix(pose, lunge, lu);
    if (tau < TAU0 + 0.1) pose.armR = {hand: v3(-BODY_G.shW - 10, 300, 70), shape: 'grip', pole: v3(-0.7, -0.6, -0.3)};
  }
  // the cuffs are in his hand from the draw (26.45) through the bolt and the loop into the opening chase, until stowed
  return {g, h, pose, cuffs: t >= CUFFS.draw - 0.02 || t < CUFFS.stowIn ? 1 : 0};
};

// ------------------------------------------------------------------ shots
export type Shot = {id: string; t0: number; t1: number};
export const SHOTS: Shot[] = [
  {id: 'track', t0: 0, t1: 1.45}, // tracking close: the chase, the brake, the swing
  {id: 'ots', t0: 1.45, t1: 3.0}, // over his shoulder into his eye line: the disappearance
  {id: 'gLow', t0: 3.0, t1: 3.65}, // his face: eyes wide, a look down the corridor
  {id: 'glide', t0: 3.65, t1: 4.95}, // round the panel's edge (she is there) and back onto his line
  {id: 'push', t0: 4.95, t1: 6.95}, // his step closer, the push into the surface
  {id: 'demo', t0: 6.95, t1: 13.1}, // the optical cutaway
  {id: 'pull', t0: 13.1, t1: 13.75}, // back out to his view, the beam across the panel
  {id: 'lowApproach', t0: 13.75, t1: 14.7}, // low angle: he comes closer
  {id: 'edgeFG', t0: 14.7, t1: 16.3}, // past the panel's edge: her face, his beam, him peering
  {id: 'sideWide', t0: 16.3, t1: 17.5}, // side: he leans round one side, she shifts lower
  {id: 'herCU', t0: 17.5, t1: 18.55}, // her eyes; he turns away; relief
  {id: 'reach', t0: 18.55, t1: 19.9},
  {id: 'otsHand', t0: 19.9, t1: 21.0},
  {id: 'gPush', t0: 21.0, t1: 21.55},
  {id: 'otsHand2', t0: 21.55, t1: 22.55},
  {id: 'recoil', t0: 22.55, t1: 23.25},
  {id: 'giggle', t0: 23.25, t1: 23.6},
  {id: 'two', t0: 23.6, t1: 25.9}, // V6: his view of the panel, the lowering, then a glide round to the two of them
  {id: 'gCU2', t0: 25.9, t1: 26.85},
  {id: 'cuffs', t0: 26.85, t1: 27.45},
  {id: 'herCU2', t0: 27.45, t1: BOLT},
  {id: 'bolt', t0: BOLT, t1: 28.35},
  {id: 'track', t0: 28.35, t1: DUR + 0.01},
];
export const shotAt = (t: number) => SHOTS.find((s) => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];

export const look = (pos: V3, tgt: V3, f: number, cy = 960, cx = 540, roll = 0): Cam => {
  const d = sub3(tgt, pos);
  const yaw = (Math.atan2(d.x, d.z) * 180) / Math.PI;
  const pitch = (Math.atan2(d.y, Math.hypot(d.x, d.z)) * 180) / Math.PI;
  return {pos, yaw, pitch, f, cx, cy, roll};
};
export const headWorld = (c: Char, b = BODY_G) => {
  const j = joints4(b, c.pose);
  return cardToWorld(c.g, c.h, j.Hc, 1);
};

/** The guard's eye line, with the bob of his own steps. */
export const povCam = (t: number, f = 1000, aim?: V3): Cam => {
  const g = guardAt(t);
  const hd = headWorld(g);
  const pos = v3(g.g.x + 0.02, hd.y + 0.03, hd.z + 0.08);
  const tgt = aim ?? v3(LAY.xp - 0.04, 0.72, PANEL_Z + 0.6);
  return look(pos, tgt, f, 900);
};

export const PUSH = {step0: 4.95, push0: 5.7, push1: 6.95, fEnd: 9000};
export const pushF = (t: number) => Math.exp(lerp(Math.log(1050), Math.log(PUSH.fEnd), Math.pow(ss(t, PUSH.push0, PUSH.push1), 1.15)));
export const PULL = {t0: 13.1, t1: 13.75};

/** the tracking camera of the chase (opening and ending): close and long-lensed, ahead of her and to her right */
const trackCam = (tau: number): Cam => {
  const zt = herZc(Math.min(tau, 0.75));
  const settle = ss(tau, 0.4, 1.4);
  // ahead of her and to her right at face height; as she brakes and turns the camera drifts round to her side
  const pos = v3(lerp(-0.72, -1.05, settle), lerp(1.45, 1.3, settle), zt + lerp(1.6, 1.15, settle));
  const tgt = v3(lerp(XP + 0.12, XP + 0.05, settle), lerp(1.16, 1.0, settle), zt - lerp(1.5, 1.2, settle));
  return look(pos, tgt, lerp(1380, 1000, settle), 860);
};

export const camAt = (t: number): Cam => {
  const s = shotAt(t);
  const her = herAt(t), g = guardAt(t);
  const u = ss(t, s.t0, s.t1);
  switch (s.id) {
    case 'track': return trackCam(t >= BOLT ? t - DUR : t);
    case 'ots': {
      // from behind his right shoulder, gliding in to just behind his right ear as he creeps forward
      const hd = headWorld(g);
      const k = ss(t, 1.45, 2.55);
      // kept well off his head (the Crew head is big) so it frames the left edge instead of filling the shot
      const pos = v3(hd.x + lerp(0.78, 0.6, k), hd.y + lerp(0.22, 0.16, k), hd.z + lerp(-0.9, -0.7, k));
      return look(pos, v3(LAY.xp + lerp(0.02, 0.04, k), lerp(0.98, 0.84, k), PANEL_Z + 0.3), lerp(1500, 1800, k), 960);
    }
    case 'gLow': {
      const hd = headWorld(g);
      return look(v3(hd.x + 0.34, 0.92, hd.z + 1.35 - 0.08 * u), v3(hd.x, hd.y - 0.12, hd.z), 880 + 120 * u, 820);
    }
    case 'glide': {
      // round the panel's +X edge (her right side): she is plainly crouched there; then back onto his line
      const hd = headWorld(g);
      const out = Math.sin(Math.PI * Math.min(1, ss(t, 3.65, 4.95) * 1.0));
      const pos = v3(lerp(hd.x + 0.12, 1.02, out), lerp(hd.y - 0.05, 1.18, out), lerp(hd.z + 0.25, PANEL_Z - 0.35, out));
      const tgt = v3(lerp(LAY.xp, LAY.xp + 0.05, out), lerp(0.78, 0.62, out), lerp(PANEL_Z + 0.3, ZP - 0.1, out));
      return look(pos, tgt, lerp(1100, 900, out), 940);
    }
    case 'push': {
      const c = povCam(t, pushF(t));
      const k = ss(t, PUSH.push0 - 0.3, PUSH.push1);
      const toPanel = look(c.pos, v3(LAY.xp + 0.06, 0.92, PANEL_Z), c.f, 960);
      return {...c, yaw: lerp(c.yaw, toPanel.yaw, k), pitch: lerp(c.pitch, toPanel.pitch, k), cy: lerp(900, 960, k)};
    }
    case 'demo':
    case 'pull': {
      // (the demo is an illustration; the pull returns from the matched macro to his eye line)
      const fEnd = PUSH.fEnd;
      const k = s.id === 'demo' ? 1 : 1 - ss(t, PULL.t0, PULL.t1);
      const f = Math.exp(lerp(Math.log(1050), Math.log(fEnd), Math.pow(k, 1.6)));
      const c = povCam(t, f);
      const toPanel = look(c.pos, v3(LAY.xp + 0.06, 0.92, PANEL_Z), f, 960);
      return {...c, yaw: lerp(c.yaw, toPanel.yaw, k), pitch: lerp(c.pitch, toPanel.pitch, k), cy: lerp(900, 960, k)};
    }
    case 'lowApproach':
      return look(v3(LAY.xp + 0.72, 0.36, PANEL_Z - 0.2 + 0.05 * u), v3(LAY.gx - 0.05, 1.05, g.g.z), 820 + 60 * u, 900);
    case 'edgeFG': {
      // behind and beside the panel's +X edge: her face and shoulder in the foreground, him beyond, peering
      const hd = headWorld(g);
      const hh = cardToWorld(her.g, her.h, joints4(BODY_P, her.pose).Hc, 1);
      const tgt = v3(lerp(hh.x, hd.x, 0.55), lerp(hh.y, hd.y, 0.45), lerp(hh.z, hd.z, 0.5));
      void hd; void tgt;
      return look(v3(hh.x + 0.66 - 0.04 * u, hh.y + 0.1, hh.z - 0.42), v3(hh.x - 0.05, hh.y - 0.06, hh.z - 0.08), 980 + 80 * u, 900);
    }
    case 'sideWide':
      return look(v3(-1.18, 1.1, ZP - 0.95 + 0.06 * u), v3(0.4, 0.95, ZP - 0.95), 560 + 40 * u, 1000);
    case 'herCU':
    case 'giggle': {
      const hd = cardToWorld(her.g, her.h, v3(0, her.pose.pel.y + 150, 30), 1);
      const wide = s.id === 'giggle' ? 0.15 : 0;
      return look(v3(XP - 0.78 - wide, hd.y + 0.1, ZP - 0.24 - 0.03 * u), v3(hd.x, hd.y + 0.02, hd.z), (s.id === 'herCU' ? 1150 : 900) + 70 * u, 900);
    }
    case 'reach':
      return look(v3(-1.15, 0.95, ZP - 0.38 - 0.06 * u), v3(0.3, 0.8, ZP - 0.38), 780 + 30 * u, 1000);
    case 'otsHand':
    case 'otsHand2': {
      // his view: the hand floats beside the panel's edge; in the second beat his own hand comes in
      return s.id === 'otsHand' ? povCam(t, 1350 + 250 * u, v3(LAY.xp - 0.22, 0.72, PANEL_Z)) : povCam(t, 1600 - 120 * u, v3(LAY.xp - 0.24, 0.74, PANEL_Z));
    }
    case 'gPush': {
      const hd = headWorld(g);
      return look(v3(0.42, hd.y - 0.06, hd.z + 1.05), v3(hd.x, hd.y - 0.05, hd.z), 1450 + 700 * u, 820);
    }
    case 'two': {
      // his own view (first person) for the whole reveal: the panel face-on with her hidden, lifted a little and
      // lowered to the floor so her face comes up over its edge straight at him, then slid aside: she is right there.
      // The camera rides his head (his creep in, the startle).
      return povCam(t, lerp(820, 760, ss(t, 25.2, 25.9)), v3(LAY.xp - 0.06, lerp(1.1, 0.98, ss(t, 25.2, 25.9)), PANEL_Z));
    }
    case 'recoil':
    case 'bolt': {
      // the recoil frames on the midpoint of the two (he hops back to ZP - 1.92), so he stays whole in frame
      const zc = (s.id === 'recoil' ? ZP - 1.2 - 0.06 * u : ZP - 0.72) + (s.id === 'bolt' ? 0.55 * ss(t, BOLT, 28.35) : 0);
      const shift = s.id === 'bolt' ? -M2 : 0;
      return look(v3(-1.2, 1.08, zc + shift), v3(0.4, 0.98, zc + shift), s.id === 'recoil' ? 490 : 580, 1000);
    }
    case 'gCU2': {
      const hd = headWorld(g);
      return look(v3(hd.x + 0.38, hd.y - 0.32, hd.z + 1.0), v3(hd.x, hd.y - 0.22, hd.z), 1000 + 160 * u, 800);
    }
    case 'herCU2': {
      const hd = cardToWorld(her.g, her.h, v3(0, her.pose.pel.y + 190, 0), 1);
      return look(v3(LAY.gx + 0.15, hd.y + 0.05, hd.z - 0.95 + 0.06 * u), v3(hd.x, hd.y + 0.02, hd.z), 1500 + 100 * u, 900);
    }
    case 'cuffs':
    default:
      return look(v3(-0.6, 1.4, ZP - 0.6), v3(0, 1.2, ZP - 1.2), 1000);
  }
};
export {M2, GAP};
