// V4 lab shots: a focused polish of V3 (v3/shots3.ts). New: the reaching hook and its skin-localised pulse, three
// distinct views at 3.1-7.0 s, no laser rays, the dive into the fingertip, the A -> B -> C oblique demonstration, the
// pinch payoff and the reach-in loop. Unchanged V2/V3 segments are taken as they are. Boundaries are word onsets.
import {T} from '../it/timing';
import {keyS, ss, lerp, clamp} from '../lib';
import {DEV_TOP} from '../it/device';
import {H_POINT, H_FLAT, HPose, mixH, handGeo} from '../it/hand';
import {EXN} from '../it/cast';
import {mixExpr} from '../dc/Head';
import {camAt, FY} from '../it/labShots';
import {lab2At, OPEN2, OPEN2_V, Shot2} from '../v2/shots2';
import {lab3At, lab3EndAt, Shot3, flinch} from '../v3/shots3';
import {V} from '../dc/math';

export type Shot4 = Shot3 & {
  /** skin-localised tactile pulse: event times (its age is computed per frame) */
  tactile: number[];
  /** the dive into the fingertip: reveal 0..1 and receptor response 0..1 */
  cut: number;
  cutAct: number;
  /** a sensation spot elsewhere on the hand (the A -> B -> C demonstration), in figure coords, and its event times */
  spot: V | null;
  spotEvents: number[];
  /** the pinch: where the imaginary button is (figure coords) and how visible its dashed outline is */
  pinchAt: V | null;
};

export const H_PINCH_OPEN: HPose = {i0: 14, i1: 20, i2: 12, m: 0.62, r: 0.72, l: 0.8, t0: 4, t1: -8, t2: -8, wr: 0};
export const H_PINCH: HPose = {i0: 40, i1: 60, i2: 36, m: 0.7, r: 0.8, l: 0.85, t0: 20, t1: 10, t2: 7, wr: 0};

/** the opening contact: the finger reaches in and arrives at the focal spot at 0.12 s */
export const CONTACT = 0.12;
/** the reach: an offset along the finger's line, from lifted (tau = -0.55) to the spot (tau = CONTACT) */
export const reach = (tau: number): V => {
  const u = clamp((tau + 0.55) / (CONTACT + 0.55));
  const e = 1 - Math.pow(1 - u, 3); // arrives decelerating
  return {x: lerp(6, 0, e), y: lerp(-8, 0, e)};
};
/** the loop's reach-in: the same function before the seam (tau = t - end) and after it (tau = t) */
export const reachAt = (t: number) => (t > T.end - 0.6 ? reach(t - T.end) : reach(t));

const toShot4 = (s: Shot2 | Shot3): Shot4 => ({slab: 0, passOutline: 0, ...s, tactile: [], cut: 0, cutAct: 0, spot: null, spotEvents: [], pinchAt: null, pulseOn: 0, rays: 0});

export const HOOK_PULSES = [CONTACT, T.exist + 0.06];

export const OBL_A = T.button2 + 0.3; // the overhead A -> B -> C runs [TOP_A, OBL_A); the oblique view [OBL_A, TOP_B)

export const lab4At = (t: number): Shot4 | null => {
  // ---------- 1-3. the hook: the finger reaches in, a pulse on the skin at contact, a flinch; drop to the gap
  if (t < T.but0 - 0.03) {
    const s = toShot4(lab3At(t)!);
    const r = reachAt(t);
    const fl = flinch(t, HOOK_PULSES);
    s.pad = {x: r.x, y: -FY + r.y - fl};
    s.tactile = [...HOOK_PULSES, T.end + CONTACT];
    return s;
  }
  // ---------- 4. the establishing wide (V2): the dashed outline on FEEL, the pulse on the skin
  if (t < T.look - 0.05) {
    const s = toShot4(lab3At(t)!);
    s.tactile = [T.feel0];
    return s;
  }
  // ---------- 5a-5c. three distinct views: hand and device with the gap; a low path beneath the finger; the dive
  if (t < T.under - 0.06) {
    const s = toShot4(lab2At(T.look - 0.06)!);
    const tB = T.touching + 0.2; // the low path beneath the finger begins
    const tC = T.feel1 + 0.12; // the dive begins after the pulse on "feel"
    s.shot = t < tB ? 51 : t < tC ? 52 : 53;
    s.cam = camAt(t, [
      {t: T.look - 0.05, x: 80, y: FY + 135, d: 960, yaw: -35, pitch: -12},
      {t: T.look + 0.5, x: -6, y: 46, d: 430, yaw: -44, pitch: -20},
      {t: tB, x: -14, y: 46, d: 395, yaw: -34, pitch: -18},
      {t: tB + 0.75, x: 30, y: 54, d: 165, yaw: -38, pitch: 4},
      {t: tC, x: -22, y: 54, d: 150, yaw: 28, pitch: 7},
      {t: T.under - 0.06, x: 4, y: DEV_TOP + 6, d: 112, yaw: 18, pitch: -38},
    ]);
    s.body = t < tB + 0.45;
    s.pad = {x: 0, y: -FY - flinch(t, [T.feel1, T.button1 + 0.05])};
    s.expr = EXN.focus;
    s.outline = 0;
    s.tactile = [T.feel1, T.button1 + 0.05];
    // the cans begin to fire, coordinated, as the camera turns down to them
    s.glowOn = 0.9 * ss(t, T.button1 - 0.1, T.under - 0.1);
    s.waves = 0;
    return s;
  }
  // ---------- 7-8. across the coordinated emitters, then the whole grid
  if (t < T.fire - 0.05) {
    const s = toShot4(lab2At(t)!);
    const tD = T.under - 0.06;
    const tG = T.hundreds + 0.45;
    s.cam = camAt(t, [
      {t: tD, x: 4, y: DEV_TOP + 6, d: 112, yaw: 18, pitch: -38},
      {t: tG, x: -8, y: DEV_TOP + 4, d: 104, yaw: 24, pitch: -36},
      {t: T.fire - 0.05, x: 0, y: DEV_TOP, d: 330, yaw: 24, pitch: -60},
    ]);
    s.glowOn = 1;
    return s;
  }
  // ---------- 9-11. the side section and convergence (V2), with the laser-like rays removed
  if (t < T.skin + 0.12) {
    const s = toShot4(lab2At(t)!);
    s.rays = 0;
    return s;
  }
  // ---------- 12-13. the dive into the same fingertip at the focal spot, and back out on the same axis
  if (t < T.spot2 + 0.55) {
    const s = toShot4(lab2At(Math.min(t, T.move - 0.04))!);
    s.rays = 0;
    s.section = 0;
    s.ripple = 0;
    s.macro = 0.55;
    const tIn = T.skin + 0.12, tOut = T.move - 0.15;
    s.cam = camAt(t, [
      {t: tIn, x: -1, y: FY - 1, d: 74, yaw: 0, pitch: 0},
      {t: T.pressure - 0.08, x: 1, y: FY - 1.5, d: 24, yaw: 2, pitch: 0},
      {t: tOut, x: 1.5, y: FY - 1.5, d: 22, yaw: 4, pitch: 0},
      {t: T.move + 0.35, x: -4, y: FY, d: 90, yaw: 0, pitch: -2},
      {t: T.spot2 + 0.55, x: -16, y: FY + 6, d: 230, yaw: -6, pitch: -6},
    ]);
    s.cut = ss(t, T.skin + 0.36, T.pressure + 0.05) * (1 - ss(t, tOut - 0.05, T.move + 0.1));
    s.cutAct = ss(t, T.pressure - 0.05, T.pressure + 0.2);
    if (t >= T.move - 0.04) {
      // back out: the hand opens and glides; the focus slides along the palm (V3 shot 13)
      const v = lab3At(t)!;
      s.pose = v.pose;
      s.ang = v.ang;
      s.pad = v.pad;
      s.onPalm = v.onPalm;
      s.macro = 0.55 * (1 - ss(t, T.move, T.move + 0.3));
    }
    s.focus = Math.max(0.5, s.focus);
    return s;
  }
  // ---------- 14b. the oblique tracking view of the moving spot (the overhead A -> B -> C runs before it)
  if (t >= OBL_A && t < T.noGlove - 0.12) {
    const s = toShot4(lab3At(T.spot2 + 0.5) ?? lab2At(T.spot2 + 0.5)!);
    s.shot = 142;
    s.pose = H_FLAT;
    s.ang = 176;
    s.pad = {x: -50, y: -FY - 4};
    s.onPalm = 1;
    s.focus = 0;
    s.waves = 0.7;
    s.envelope = 0.7;
    s.bands = 0.7;
    s.wavelets = 0;
    const dir = {x: Math.cos((176 * Math.PI) / 180), y: Math.sin((176 * Math.PI) / 180)};
    const g0 = handGeo({W: {x: 0, y: 0}, dir, L: 96}, H_FLAT);
    const W = {x: s.pad.x - g0.pad.x, y: s.pad.y - g0.pad.y};
    const g = handGeo({W, dir, L: 96}, H_FLAT);
    // C (palm heel) -> D (the knuckles) -> E (the fingertip): it keeps moving, toward the fingers
    const pts = [g.at(0.18, 0.115), g.at(0.42, 0.075), add2(g.pad, {x: 0, y: 0.6})];
    const ev = [OBL_A + 0.08, OBL_A + 0.5, OBL_A + 0.92];
    let p = pts[0];
    for (let i = 1; i < pts.length; i++) {
      const u = ss(t, ev[i] - 0.16, ev[i] - 0.02);
      p = {x: lerp(p.x, pts[i].x, u), y: lerp(p.y, pts[i].y, u)};
    }
    s.spot = p;
    s.spotEvents = ev;
    s.cam = camAt(t, [
      {t: OBL_A, x: -30, y: FY - 2, d: 190, yaw: -34, pitch: 13},
      {t: T.noGlove - 0.12, x: -62, y: FY - 2, d: 175, yaw: -20, pitch: 12},
    ]);
    s.body = false;
    return s;
  }
  return null;
};
const add2 = (a: V, b: V): V => ({x: a.x + b.x, y: a.y + b.y});

/** the end: the press on nothing and the reach (V2), then the pinch through empty air, the pulse, the reach-in loop */
export const lab4EndAt = (t: number, entry?: {sx: number; sy: number; k: number}): Shot4 | null => {
  if (t < T.and2 - 0.025) {
    const b = lab3EndAt(t);
    return b ? toShot4(b) : null;
  }
  const s = toShot4(lab3EndAt(t, entry)!);
  const t21 = T.and2 - 0.025;
  const open = ss(t, t21 + 0.3, t21 + 0.9);
  const close = ss(t, T.you + 0.2, T.grab + 0.05);
  const release = ss(t, T.it3 + 0.05, T.but2 + 0.3);
  const point = ss(t, T.but2 + 0.1, T.skin2 + 0.02);
  // the pinch, then the pointing pose of the opening
  let pose = mixH(H_POINT, H_PINCH_OPEN, open);
  pose = mixH(pose, H_PINCH, close * (1 - release));
  pose = mixH(pose, H_POINT, point);
  const fl = flinch(t, [T.skin2 + 0.06]);
  s.pose = pose;
  s.ang = lerp(lerp(150, 158, open), 148, point);
  // the hand stays put during the pinch; the imaginary button sits where the closed pinch's tips meet. After the
  // pulse it settles, lifts back along its line, and reaches in again exactly as on frame 0 (the same function)
  const base = {x: lerp(0, -6, open * (1 - point)), y: -FY - 2 * open * (1 - point)};
  if (t > T.end - 0.6) {
    const r = reachAt(t);
    s.pad = {x: r.x, y: -FY + r.y};
  } else {
    const lift = ss(t, T.feel3 - 0.25, T.end - 0.6);
    s.pad = {x: base.x + 6 * lift, y: base.y - fl - 8 * lift};
  }
  const dir = {x: Math.cos((s.ang * Math.PI) / 180), y: Math.sin((s.ang * Math.PI) / 180)};
  const gc0 = handGeo({W: {x: 0, y: 0}, dir, L: 96}, H_PINCH);
  const gp0 = handGeo({W: {x: 0, y: 0}, dir, L: 96}, pose);
  const W = {x: s.pad.x - gp0.pad.x, y: s.pad.y - gp0.pad.y};
  const meet = {x: W.x + (gc0.index.tip.x + gc0.thumb.tip.x) / 2, y: W.y + (gc0.index.tip.y + gc0.thumb.tip.y) / 2};
  s.pinchAt = open * (1 - point) > 0.05 ? meet : null;
  s.passOutline = ss(t, t21 + 0.6, t21 + 1.0) * (1 - ss(t, T.it3, T.but2 + 0.15));
  s.onPalm = 0;
  s.focus = 0;
  s.waves = 0.75 * open * (1 - point);
  s.envelope = 0.7;
  s.bands = 0.7;
  s.tactile = [T.skin2 + 0.06, T.end + CONTACT];
  s.pulseOn = 0;
  s.expr = mixExpr(mixExpr(EXN.focus, EXN.puzzled, ss(t, T.grab, T.it3 + 0.1)), EXN.delight, ss(t, T.skin2, T.feel3));
  const k0 = entry ? entry.k : 4;
  s.cam = camAt(
    t,
    [
      {t: t21, x: 0, y: FY, d: 1500 / k0, yaw: 0, pitch: 0},
      {t: t21 + 0.8, x: -12, y: FY + 6, d: 300, yaw: -14, pitch: 2},
      {t: T.you + 0.1, x: -26, y: FY + 6, d: 175, yaw: -20, pitch: 5},
      {t: T.it3 + 0.1, x: -26, y: FY + 6, d: 165, yaw: -18, pitch: 5},
      {t: T.skin2 + 0.25, x: -8, y: FY + 8, d: 160, yaw: -24, pitch: 8},
      {...OPEN2(T.end - 0.3), d: 104 - OPEN2_V * 0.3},
      {...OPEN2(T.end), d: 104},
    ],
    true,
  );
  s.lightbox = 1 - ss(t, T.feel3 - 0.2, T.end - 0.4);
  s.body = false;
  return s;
};
void H_FLAT;
