// V2 lab shots, keyed to the measured words (it/timing.ts). See production/V2_AUDIT_AND_PLAN.md for the shot plan.
// Every lab shot is drawn by LabView2 from one of these states; the top-down shot (14) has its own renderer.
import {Cam3} from '../it/cam3';
import {T} from '../it/timing';
import {keyS, ss, lerp, clamp} from '../lib';
import {DEV_TOP} from '../it/device';
import {H_POINT, H_FLAT, H_RELAX, H_FIST, HPose, mixH} from '../it/hand';
import {BASE_MAN, EXN} from '../it/cast';
import {mixExpr, Expr} from '../dc/Head';
import {ManPose} from '../dc/Man';
import {V} from '../dc/math';
import {camAt, OrbitK, FY, pulseAge} from '../it/labShots';

export {FY};
export const F0: V = {x: 0, y: -FY};

/** the opening close-up: frame 0 and the loop's end share this camera path (and its dolly speed) */
export const OPEN2 = (t: number): OrbitK => ({t, x: 4, y: FY + 16, d: 104, yaw: -34, pitch: 14});
export const OPEN2_V = -6;

/** the finger's dip into the opening pulse: frame 0 is mid-descent, and the loop's end repeats it */
export const dip2 = (t: number) => {
  const one = (tc: number, w = 0.5) => {
    const u = (t - tc) / w;
    return u < -1 || u > 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * u);
  };
  return 4.5 * (one(0.12) + one(T.end + 0.12)) + 3.5 * one(T.feel0 + 0.04) + 4 * one(T.button3 + 0.04) + 3 * one(T.feel1 + 0.02);
};
export const PULSE_OPEN = [-0.12, T.end - 0.12];

export type Shot2 = {
  shot: number;
  cam: Cam3;
  pose: HPose;
  ang: number;
  pad: V;
  man: ManPose;
  expr: Expr;
  body: boolean;
  billboard: boolean;
  lightbox: number;
  // overlays
  pulse: number;
  pulseOn: number;
  waves: number;
  wavelets: number;
  envelope: number;
  bands: number;
  rays: number;
  waveT0: number;
  focus: number;
  glowOn: number;
  onPalm: number;
  section: number;
  sectionAct: number;
  sectionR: number;
  press: number;
  ripple: number;
  macro: number;
  outline: number;
  /** the fist closing through the focus: draw the focus glow over the fingers (it is not blocked) */
  focusOver: boolean;
};

const base = (t: number): Shot2 => ({
  shot: 0,
  cam: camAt(0, [OPEN2(0), OPEN2(1)]),
  pose: H_POINT,
  ang: 148,
  pad: F0,
  man: BASE_MAN,
  expr: EXN.wonder,
  body: true,
  billboard: true,
  lightbox: 1,
  pulse: 99,
  pulseOn: 0,
  waves: 0,
  wavelets: 0,
  envelope: 0,
  bands: 0,
  rays: 0,
  waveT0: T.fire - 0.25,
  focus: 0,
  glowOn: 0,
  onPalm: 0,
  section: 0,
  sectionAct: 0,
  sectionR: 7,
  press: 0,
  ripple: 0,
  macro: 0,
  outline: 0,
  focusOver: false,
});

const mod4 = (t: number) => 0.5 + 0.5 * Math.cos(2 * Math.PI * 4 * t);

/** the top-down shot (14) covers [TOP_A, TOP_B) */
export const TOP_A = T.spot2 + 0.55; // "Move that spot," ... into "and you can make"
export const TOP_B = T.noGlove - 0.12;

export const lab2At = (t: number): Shot2 | null => {
  const s = base(t);
  // ---------- 1-3. ECU -> orbit -> pull back and drop to gap level
  if (t < T.but0 - 0.03) {
    s.shot = t < 0.5 ? 1 : t < 1.05 ? 2 : 3;
    s.cam = camAt(t, [
      OPEN2(0),
      {...OPEN2(0.5), d: 104 + OPEN2_V * 0.5, yaw: -27},
      {t: 1.05, x: 0, y: FY + 6, d: 150, yaw: 26, pitch: 6},
      {t: T.but0 - 0.03, x: -8, y: 54, d: 430, yaw: 16, pitch: 1},
    ]);
    s.pad = {x: 0, y: -FY + dip2(t)};
    s.pulse = Math.min(...PULSE_OPEN.map((p) => (t >= p ? t - p : 99)));
    s.pulseOn = 1;
    s.focus = 0.5 * (1 - ss(t, 0.45, 0.9));
    // the hook is dark air round the fingertip; the gap's light strip comes up as we pull back to it
    s.lightbox = ss(t, 0.75, 1.45);
    // a subtle reaction: the finger lifts a hair on "exist" and settles
    s.pose = mixH(H_POINT, {...H_POINT, i0: 2, i1: 3, i2: 1}, ss(t, 0.8, 1.05) * (1 - ss(t, 1.2, 1.5)));
    s.body = false;
    return s;
  }
  // ---------- 4. wide three-quarter; the conceptual button outline on "FEEL"
  if (t < T.look - 0.05) {
    s.shot = 4;
    s.cam = camAt(t, [
      {t: T.but0 - 0.03, x: 95, y: FY + 150, d: 1060, yaw: -40, pitch: -13},
      {t: T.look, x: 80, y: FY + 135, d: 960, yaw: -35, pitch: -12},
    ]);
    s.pad = {x: 0, y: -FY + dip2(t)};
    s.outline = ss(t, T.feel0 - 0.18, T.feel0 + 0.06) * (1 - ss(t, T.feel0 + 0.42, T.feel0 + 0.7));
    s.pulse = t >= T.feel0 ? t - T.feel0 : 99;
    s.pulseOn = 1;
    s.expr = mixExpr(EXN.wonder, EXN.delight, ss(t, T.feel0 - 0.15, T.feel0 + 0.25));
    return s;
  }
  // ---------- 5. dive to gap level, glide along the gap (right to left, the hand's direction)
  if (t < T.so - 0.07) {
    s.shot = 5;
    s.cam = camAt(t, [
      {t: T.look - 0.05, x: 80, y: FY + 135, d: 960, yaw: -35, pitch: -12},
      {t: T.look + 0.6, x: 50, y: 50, d: 250, yaw: -22, pitch: -1},
      {t: T.so - 0.07, x: -46, y: 48, d: 215, yaw: 14, pitch: 0},
    ]);
    s.pad = {x: 0, y: -FY + 1.5 * Math.sin((t - T.look) * 2.4)};
    s.expr = EXN.focus;
    return s;
  }
  // ---------- 6. rise to the fingertip ("So why can he feel a button?")
  if (t < T.under - 0.06) {
    s.shot = 6;
    s.cam = camAt(t, [
      {t: T.so - 0.07, x: -46, y: 48, d: 215, yaw: 14, pitch: 0},
      {t: T.feel1 - 0.05, x: -6, y: FY - 8, d: 118, yaw: 10, pitch: 11},
      {t: T.under - 0.06, x: -3, y: FY - 6, d: 100, yaw: 6, pitch: 9},
    ]);
    s.pad = {x: 0, y: -FY + dip2(t)};
    s.pulse = Math.min(...[T.feel1, T.button1 + 0.05].map((p) => (t >= p ? t - p : 99)));
    s.pulseOn = 1;
    s.body = false;
    return s;
  }
  // ---------- 7-12. one connected move through the mechanism
  if (t < T.move - 0.03) {
    const tD = T.under - 0.06; // the dive starts
    const tG = T.hundreds + 0.45; // pull up to the whole grid
    const tS = T.fire - 0.05; // swing to the side section
    const tM = T.meet; // convergence
    const tP = T.making - 0.05; // fingertip macro
    const tX = T.pressure - 0.12; // dive into the cutaway
    s.shot = t < tG ? 7 : t < tS ? 8 : t < tM ? 9 : t < tP ? 10 : t < tX ? 11 : 12;
    s.cam = camAt(t, [
      {t: tD, x: -3, y: FY - 6, d: 100, yaw: 6, pitch: 9},
      // dive past the pad onto the cans and track across them
      {t: tD + 0.68, x: 8, y: DEV_TOP + 6, d: 105, yaw: 18, pitch: -38},
      {t: tG, x: -8, y: DEV_TOP + 4, d: 98, yaw: 24, pitch: -36},
      // pull up to the whole grid
      {t: tS - 0.04, x: 0, y: DEV_TOP, d: 330, yaw: 24, pitch: -60},
      // swing down to the side section and rise with the wavefronts
      {t: tS + 0.55, x: 0, y: 26, d: 300, yaw: 0, pitch: 0},
      {t: tM, x: 0, y: 58, d: 260, yaw: 0, pitch: 0},
      {t: T.exact + 0.15, x: 0, y: FY - 6, d: 150, yaw: 0, pitch: 0},
      {t: tP, x: -1, y: FY - 2, d: 92, yaw: 0, pitch: 0},
      {t: tX, x: -1, y: FY - 1, d: 56, yaw: 0, pitch: 0},
      {t: T.move - 0.03, x: -1, y: FY - 1.5, d: 30, yaw: 0, pitch: 0},
    ]);
    s.body = false;
    s.glowOn = ss(t, tD + 0.25, tD + 0.6) * (1 - ss(t, tS + 0.25, tS + 0.6));
    s.waveT0 = T.fire - 0.25;
    s.waves = ss(t, tS, tS + 0.3);
    s.wavelets = 1 - ss(t, tM + 0.4, tP);
    s.envelope = ss(t, T.ultrasound - 0.1, T.waves);
    s.bands = s.envelope;
    s.rays = ss(t, tM - 0.05, tM + 0.35) * (1 - ss(t, T.exact + 0.25, T.exact + 0.6));
    const arrive = ss(t, tM - 0.1, T.exact + 0.05);
    s.focus = arrive * (0.75 + 0.25 * mod4(t)) * (1 + 0.6 * Math.max(0, 1 - Math.abs(t - T.exact - 0.05) / 0.25));
    s.press = arrive * mod4(t) * ss(t, tP, T.skin);
    s.ripple = ss(t, tP, T.skin) * (1 - ss(t, tX, tX + 0.2));
    s.macro = 0.65 * ss(t, tP - 0.3, tP + 0.1);
    // the cutaway opens on the pad and grows to fill the frame (the dive into the skin)
    s.section = ss(t, tX, tX + 0.25);
    s.sectionR = lerp(7, 34, ss(t, tX, T.move - 0.03));
    s.sectionAct = s.section * (0.55 + 0.45 * mod4(t));
    return s;
  }
  // ---------- 13. pull back out; the hand opens and glides, the focus slides along the palm
  if (t < TOP_A) {
    s.shot = 13;
    const open = ss(t, T.move + 0.05, T.move + 0.45);
    s.pose = mixH(H_POINT, H_FLAT, open);
    s.ang = lerp(148, 176, open);
    const hx = keyS(t, [[T.move, 0], [TOP_A, -26]]);
    s.pad = {x: hx - 28 * open, y: -FY - 2 + 6 * open};
    s.cam = camAt(t, [
      {t: T.move - 0.03, x: -1, y: FY - 1.5, d: 30, yaw: 0, pitch: 0},
      {t: T.move + 0.62, x: -14, y: FY + 6, d: 230, yaw: -6, pitch: -6},
      {t: TOP_A, x: -30, y: FY + 30, d: 300, yaw: -6, pitch: -26},
    ]);
    s.section = 1 - ss(t, T.move - 0.03, T.move + 0.2);
    s.sectionR = lerp(34, 7, ss(t, T.move - 0.03, T.move + 0.2));
    s.sectionAct = s.section;
    s.body = false;
    s.waves = 1;
    s.wavelets = 0;
    s.envelope = 0.85;
    s.bands = 0.85;
    s.focus = 0.8 + 0.2 * mod4(t);
    s.onPalm = open;
    s.glowOn = 0;
    return s;
  }
  return null;
};

/** after the top-down shot: clarity, the press on nothing (then the car), and the return to the lab */
export const lab2EndAt = (t: number, entry?: {sx: number; sy: number; k: number}): Shot2 | null => {
  const s = base(t);
  if (t >= TOP_B && t < T.now - 0.03) {
    if (t < T.no2 - 0.06) {
      // ---------- 15. clarity: no overlays, a bare hand in clean backlit air
      s.shot = 15;
      s.cam = camAt(t, [
        {t: TOP_B, x: -30, y: FY + 10, d: 270, yaw: 42, pitch: 17},
        {t: T.no2, x: -24, y: FY + 8, d: 235, yaw: 30, pitch: 14},
      ]);
      s.body = false;
      s.pose = mixH(H_FLAT, H_RELAX, 0.5 + 0.5 * Math.sin((t - TOP_B) * 7.5));
      s.ang = 172;
      s.pad = {x: -26, y: -FY - 6};
      return s;
    }
    // ---------- 16. high three-quarter wide from the other side: the press on nothing, then the reach
    s.shot = 16;
    const go = clamp((t - (T.button3 + 0.18)) / (T.now - 0.03 - (T.button3 + 0.18)));
    const px = -64 * go * go;
    s.pad = {x: px, y: -FY + dip2(t)};
    s.cam = camAt(t, [
      {t: T.no2 - 0.06, x: 120, y: FY + 170, d: 1350, yaw: 34, pitch: -17},
      {t: T.button3 + 0.15, x: 100, y: FY + 150, d: 1250, yaw: 30, pitch: -15},
      {t: T.now - 0.03, x: px + 40, y: FY + 40, d: 620, yaw: 12, pitch: -6},
    ]);
    s.expr = EXN.wonder;
    return s;
  }
  if (t >= T.and2 - 0.025) {
    // ---------- 21-24. back to the real array: the weird part, the grab, the touch returns, the loop
    const t21 = T.and2 - 0.025;
    const grab = ss(t, T.you + 0.05, T.grab + 0.3) * (1 - ss(t, T.but2 + 0.05, T.skin2 + 0.3));
    const flat = ss(t, t21 + 0.25, t21 + 0.75);
    const back = ss(t, T.feel3 - 0.5, T.end - 0.22);
    s.shot = t < T.you - 0.1 ? 21 : t < T.but2 - 0.06 ? 22 : t < T.feel3 + 0.03 ? 23 : 24;
    s.pose = mixH(mixH(mixH(H_POINT, H_FLAT, flat), H_FIST, grab), H_POINT, back);
    s.ang = lerp(lerp(lerp(150, 174, flat), 168, grab), 148, back);
    s.pad = {x: lerp(lerp(0, -20, flat), 0, back), y: lerp(-FY - 3 * flat + 4 * grab, -FY + dip2(t), back)};
    s.onPalm = flat * (1 - back);
    s.expr = mixExpr(mixExpr(EXN.focus, EXN.puzzled, ss(t, T.grab, T.it3 + 0.1)), EXN.delight, ss(t, T.skin2 + 0.2, T.feel3));
    s.waveT0 = T.and2 - 1.5;
    s.waves = flat * (1 - ss(t, T.feel3 - 0.3, T.feel3)) * 0.85;
    s.envelope = 0.6;
    s.bands = 0.6;
    s.focus = (0.8 + 0.2 * mod4(t)) * flat * (1 - back);
    s.focusOver = true;
    s.press = ss(t, T.but2 + 0.2, T.skin2 + 0.2) * (1 - back) * mod4(t);
    s.pulse = Math.min(...[T.skin2 + 0.12, ...PULSE_OPEN].map((p) => (t >= p ? t - p : 99)));
    s.pulseOn = 1;
    // the opening match: the lobby fingertip's screen point and scale -> pull back to the hand over the array
    const k0 = entry ? entry.k : 6;
    const d0 = 1500 / k0;
    s.cam = camAt(
      t,
      [
        {t: t21, x: 0, y: FY, d: d0, yaw: 0, pitch: 0},
        {t: t21 + 0.75, x: -6, y: FY + 4, d: 360, yaw: -12, pitch: 0},
        {t: T.you - 0.05, x: 92, y: FY + 175, d: 640, yaw: -12, pitch: -2},
        {t: T.it3 + 0.1, x: 96, y: FY + 180, d: 590, yaw: -10, pitch: -2},
        {t: T.skin2 + 0.45, x: -10, y: FY + 10, d: 250, yaw: -16, pitch: 4},
        {t: T.feel3 - 0.05, x: -2, y: FY + 6, d: 170, yaw: -26, pitch: 8},
        {...OPEN2(T.end - 0.3), d: 104 - OPEN2_V * 0.3},
        {...OPEN2(T.end), d: 104},
      ],
      true,
    );
    // in the first frames the lobby fingertip's screen point is matched (the camera target sits on the pad)
    if (entry && t < t21 + 0.7) {
      const u = ss(t, t21, t21 + 0.7);
      void u;
    }
    s.body = t < T.feel3 + 0.1;
    s.lightbox = 1 - ss(t, T.feel3 + 0.05, T.end - 0.3);
    return s;
  }
  return null;
};
