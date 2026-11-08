// The lab shots as pure functions of time, keyed to the narration (timing.ts). One world, one camera rig; cuts only
// where a new place or a deliberate new angle is needed (see production/SHOTS_AND_TRANSITIONS.md).
import {Cam3, orbit} from './cam3';
import {T} from './timing';
import {keyS, ss, clamp, lerp} from '../lib';
import {DEV_TOP} from './device';
import {H_POINT, H_FLAT, H_RELAX, H_CUP, H_FIST, HPose, mixH} from './hand';
import {BASE_MAN, EXN} from './cast';
import {mixExpr, Expr} from '../dc/Head';
import {ManPose} from '../dc/Man';
import {V} from '../dc/math';

export const FY = DEV_TOP + 72; // focal height above the bench (world Y) = 84.5 u (about 15 cm above the array)
export const F0: V = {x: 0, y: -FY}; // the focal point in the figure plane (v down)

export type OrbitK = {t: number; x: number; y: number; d: number; yaw: number; pitch: number; f?: number; roll?: number};
/** keyed orbit camera; the last key's easing can be linear (`lin`) to carry a velocity across a cut or the loop */
export const camAt = (t: number, ks: OrbitK[], lin = false): Cam3 => {
  const k = (sel: (o: OrbitK) => number) => keyS(t, ks.map((o) => [o.t, sel(o)] as [number, number]));
  let tg = {x: k((o) => o.x), y: k((o) => o.y), z: 0};
  let d = k((o) => o.d), yaw = k((o) => o.yaw), pitch = k((o) => o.pitch), f = k((o) => o.f ?? 1500), roll = k((o) => o.roll ?? 0);
  if (lin && t > ks[ks.length - 2].t) {
    const a = ks[ks.length - 2], b = ks[ks.length - 1];
    const u = clamp((t - a.t) / (b.t - a.t));
    tg = {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: 0};
    d = lerp(a.d, b.d, u); yaw = lerp(a.yaw, b.yaw, u); pitch = lerp(a.pitch, b.pitch, u);
  }
  return orbit(tg, d, yaw, pitch, f, roll);
};

/** the opening (and closing) close-up: frame 0 and the loop's last frames share this camera path */
export const OPEN_K = (t0: number): OrbitK => ({t: t0, x: 8, y: FY + 30, d: 190, yaw: -22, pitch: 15});
export const OPEN_V = -7; // its dolly speed (u/s): the camera eases in toward the fingertip

/** pulse events (time) for the fingertip pulse ring */
export const PULSES = [-0.2, T.feel0 + 0.02, T.end - 0.2];
export const pulseAge = (t: number, list = PULSES) => {
  let best = 99;
  list.forEach((te) => {
    if (t >= te && t - te < best) best = t - te;
  });
  return best;
};

/** the finger's press: a small dip into the focal spot and a rise, a function of time (loops seamlessly) */
export const pressDip = (t: number) => {
  // frame 0 starts mid-dip (descending) ; the loop's end repeats the same descent
  const dip = (tc: number) => {
    const u = (t - tc) / 0.55;
    return u < -1 || u > 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * u);
  };
  return 5 * (dip(0.08) + dip(T.end + 0.08) + dip(T.feel0 + 0.05) * 0.8 + dip(T.button3 + 0.05) * 0.9);
};

export type LabShot = {
  cam: Cam3;
  pose: HPose;
  ang: number;
  pad: V;
  man: ManPose;
  expr: Expr;
  /** overlays */
  pulse: number; // pulse age (s)
  pulseOn: number;
  waves: number;
  wavelets: number;
  envelope: number;
  waveT0: number;
  focus: number;
  glowOn: number;
  section: number;
  sectionAct: number;
  press: number;
  macro: number; // the illustrative macro treatment (dark vignette, pulse rings at the pad)
  card: number | null; // card centre x in the gap (figure plane), null = no card
  trail: {x: number; z: number}[] | null; // the moving focal point's recent path (world x, z) under the palm
  focusZ: number;
  /** 0: the focus sits on the index pad, 1: on the centre of the palm */
  onPalm: number;
  body: boolean;
  label: string | null;
};

const base = (t: number): LabShot => ({
  cam: orbit({x: 0, y: FY, z: 0}, 600, 0, 0, 1500),
  pose: H_POINT,
  ang: 148,
  pad: F0,
  man: BASE_MAN,
  expr: EXN.wonder,
  pulse: pulseAge(t),
  pulseOn: 1,
  waves: 0,
  wavelets: 0,
  envelope: 0,
  waveT0: 0,
  focus: 0,
  glowOn: 0,
  section: 0,
  sectionAct: 0,
  press: 0,
  macro: 0,
  card: null,
  trail: null,
  focusZ: 0,
  onPalm: 0,
  body: true,
  label: null,
});

// the circle the focal point traces under the flat palm ("make an invisible button feel like it's moving")
export const CIRCLE = {cx: 6, cz: 0, r: 13, t0: T.invisible - 0.45, rate: 0.9};
export const circlePt = (t: number) => {
  const a = 2 * Math.PI * CIRCLE.rate * (t - CIRCLE.t0) - Math.PI / 2;
  return {x: CIRCLE.cx + CIRCLE.r * Math.cos(a), z: CIRCLE.cz + CIRCLE.r * Math.sin(a)};
};

/** where the flat hand's palm centre is relative to its index pad, so the focus can sit on the palm */
export const PALM_FROM_PAD = {x: 28, y: -2};

export const labAt = (t: number): LabShot | null => {
  const s = base(t);
  // ---------- 1. hook: ECU -> arc round the fingertip -> pull back to the medium shot (0 -> Look)
  if (t < T.look - 0.05) {
    s.cam = camAt(t, [
      OPEN_K(0),
      {...OPEN_K(0.62), d: 190 + OPEN_V * 0.62},
      {t: 1.55, x: -2, y: FY + 2, d: 300, yaw: 26, pitch: -6},
      {t: 2.6, x: 120, y: FY + 120, d: 1500, yaw: 8, pitch: -5},
      {t: 3.2, x: 128, y: FY + 124, d: 1560, yaw: 6, pitch: -5},
    ]);
    s.pad = {x: 0, y: -FY + pressDip(t) - 2};
    s.expr = mixExpr(EXN.wonder, EXN.delight, ss(t, T.feel0 - 0.25, T.feel0 + 0.25));
    // a subtle reaction: the finger lifts a little and settles on "exist"
    s.pose = mixH(H_POINT, {...H_POINT, i1: 2, i2: 0, i0: 0}, ss(t, 0.9, 1.15) * (1 - ss(t, 1.3, 1.6)));
    s.focus = 0.35 * (1 - ss(t, 0.5, 1.0)) + 0.4 * Math.max(0, 1 - Math.abs(t - T.feel0 - 0.1) / 0.35);
    s.body = t > 1.2;
    return s;
  }
  // ---------- 2. low angle through the gap; the near hand passes a card through it ("Nothing is touching")
  if (t < T.so - 0.07) {
    s.cam = camAt(t, [
      {t: T.look - 0.05, x: 30, y: 50, d: 330, yaw: 7, pitch: 0},
      {t: T.so, x: -26, y: 50, d: 300, yaw: -7, pitch: 0},
    ]);
    s.pulseOn = 0;
    s.pad = {x: 0, y: -FY + 2 * Math.sin((t - T.look) * 2.2)};
    s.man = {...BASE_MAN, torso: lerp(10, 20, ss(t, T.look, T.look + 0.4))};
    s.card = keyS(t, [[T.look, 190], [T.nothing, 160], [T.touching + 0.3, -4], [T.so - 0.07, -12]]);
    s.expr = EXN.focus;
    return s;
  }
  // ---------- 3. close on the finger ("So why can he")
  if (t < T.feel1 - 0.06) {
    s.cam = camAt(t, [
      {t: T.so - 0.07, x: 4, y: FY + 6, d: 300, yaw: 14, pitch: -2},
      {t: T.feel1, x: 2, y: FY + 2, d: 250, yaw: 10, pitch: -2},
    ]);
    s.pulseOn = 0;
    s.body = false;
    return s;
  }
  // ---------- 4. one connected move through the mechanism (feel a button? ... pressure.)
  if (t < T.move - 0.03) {
    const t1 = T.under - 0.06; // dive starts
    const t2 = T.hundreds - 0.02; // over the array
    const t3 = T.fire - 0.05; // side cross-section
    const t4 = T.meet; // follow the wavefront up
    const t5 = T.spot + 0.25; // fingertip macro
    const t6 = T.pressure - 0.1; // the cutaway opens
    const padW = {x: 0, y: FY};
    s.cam = camAt(t, [
      // match cut to the illustrative macro of the same fingertip, same place on screen
      {t: T.feel1 - 0.06, x: -2, y: FY + 1, d: 120, yaw: 10, pitch: -2},
      {t: t1, x: -1, y: FY - 2, d: 105, yaw: 8, pitch: -3},
      // the dive: down past the fingertip and over the array
      {t: t1 + 0.55, x: 0, y: DEV_TOP + 30, d: 230, yaw: 16, pitch: -38},
      {t: t2, x: 0, y: DEV_TOP, d: 330, yaw: 22, pitch: -56},
      {t: t3 - 0.15, x: 0, y: DEV_TOP, d: 360, yaw: 28, pitch: -60},
      // swing down to the side cross-section, level with the gap
      {t: t3 + 0.55, x: 0, y: 48, d: 340, yaw: 0, pitch: -1},
      {t: t4, x: 0, y: 46, d: 330, yaw: 0, pitch: -1},
      // ride a converging crest up to the fingertip
      {t: t5, x: -1, y: FY - 1, d: 64, yaw: 0, pitch: -1},
      {t: t6, x: -1, y: FY - 1, d: 46, yaw: 0, pitch: -1},
      {t: T.move, x: -1, y: FY, d: 40, yaw: 0, pitch: -1},
    ]);
    s.pulseOn = 0;
    s.body = false;
    s.macro = (1 - ss(t, t1 + 0.1, t1 + 0.5)) + ss(t, t5 - 0.3, t5 + 0.1);
    // the pulse at the pad in the first macro beat ("feel a button?")
    s.pulse = pulseAge(t, [T.feel1 + 0.02, T.button1 + 0.1]);
    s.pulseOn = 1 - ss(t, t1, t1 + 0.2);
    s.glowOn = ss(t, t1 + 0.3, t2) * (1 - ss(t, t3 + 0.3, t3 + 0.6)) + ss(t, t3 + 0.3, t3 + 0.6) * 0.0;
    s.waveT0 = T.fire - 0.25;
    s.waves = ss(t, t3, t3 + 0.35);
    s.wavelets = 1 - ss(t, t4 + 0.3, t5);
    s.envelope = ss(t, T.ultrasound, T.waves);
    const arrive = ss(t, T.meet - 0.2, T.exact + 0.1);
    const mod = 0.75 + 0.25 * Math.cos(2 * Math.PI * 4 * t);
    s.focus = arrive * mod;
    s.press = arrive * (0.5 + 0.5 * Math.cos(2 * Math.PI * 4 * t)) * ss(t, T.making, T.skin);
    s.section = ss(t, t6, t6 + 0.45);
    s.sectionAct = s.section * (0.55 + 0.45 * Math.cos(2 * Math.PI * 4 * t));
    void padW;
    return s;
  }
  // ---------- 5. move the spot: the hand opens flat and moves; the focus stays on the palm; then traces a circle
  if (t < T.noGlove - 0.12) {
    const open = ss(t, T.move - 0.03, T.move + 0.4);
    s.pose = mixH(H_POINT, H_FLAT, open);
    s.ang = lerp(148, 176, open);
    // the hand glides left then back while the focal point follows the palm
    const hx = keyS(t, [[T.move, 0], [T.spot2 + 0.2, -22], [T.invisible - 0.4, -14], [T.end, -14]]);
    const hy = -FY - 2 + 6 * open;
    s.pad = {x: hx - PALM_FROM_PAD.x * open + 0, y: hy};
    s.cam = camAt(t, [
      {t: T.move - 0.03, x: -1, y: FY, d: 40, yaw: 0, pitch: -1},
      {t: T.move + 0.55, x: hx - 6, y: FY + 6, d: 330, yaw: 0, pitch: -6},
      {t: T.spot2 + 0.4, x: -16, y: FY + 4, d: 330, yaw: 0, pitch: -8},
      {t: T.invisible - 0.2, x: -8, y: FY - 14, d: 240, yaw: -6, pitch: 13},
      {t: T.noGlove, x: -4, y: FY - 14, d: 220, yaw: -10, pitch: 14},
    ]);
    s.pulseOn = 0;
    s.body = false;
    s.waveT0 = T.fire - 0.25;
    s.waves = 1;
    s.wavelets = 0;
    s.envelope = 0.8;
    s.focus = 0.8 + 0.2 * Math.cos(2 * Math.PI * 4 * t);
    s.glowOn = 0;
    s.onPalm = open;
    if (t > CIRCLE.t0) {
      // the focus traces a circle under the palm; the wave overlay fades so the moving point reads
      const tr: {x: number; z: number}[] = [];
      for (let k = 0; k < 14; k++) tr.push(circlePt(t - k * 0.045));
      s.trail = tr;
      s.envelope = 0.8 * (1 - ss(t, CIRCLE.t0, CIRCLE.t0 + 0.4));
    }
    return s;
  }
  return null;
};

/** lab after the applications: the weird part (grab) and the return to the opening */
export const labEndAt = (t: number): LabShot | null => {
  const s = base(t);
  if (t >= T.noGlove - 0.12 && t < T.now - 0.03) {
    // ---------- 6. clarity: no overlays; a plain hand in empty air; then the press on nothing
    s.pulseOn = 0;
    if (t < T.no2 - 0.06) {
      s.cam = camAt(t, [
        {t: T.noGlove - 0.12, x: -10, y: FY + 18, d: 360, yaw: -30, pitch: 6},
        {t: T.no2, x: -6, y: FY + 16, d: 330, yaw: -36, pitch: 6},
      ]);
      s.body = false;
      // a slow turn of the fingers: open, relaxed, open (a bare hand)
      s.pose = mixH(H_FLAT, H_RELAX, 0.5 + 0.5 * Math.sin((t - T.noGlove) * 7));
      s.ang = 172;
      s.pad = {x: -24, y: -FY - 6};
    } else {
      s.cam = camAt(t, [
        {t: T.no2 - 0.06, x: 110, y: FY + 120, d: 1250, yaw: 4, pitch: -4},
        {t: T.now, x: 90, y: FY + 110, d: 1150, yaw: 2, pitch: -4},
      ]);
      s.pose = H_POINT;
      s.ang = 148;
      s.pad = {x: -10 * ss(t, T.button3 + 0.3, T.now), y: -FY + pressDip(t) - 3};
      s.expr = EXN.wonder;
    }
    return s;
  }
  if (t >= T.and2 - 0.06) {
    s.pulseOn = 0;
    // flat hand over the array, focus on the palm; then the grab closes through it
    const grab = ss(t, T.you - 0.25, T.grab + 0.15) * (1 - ss(t, T.but2 - 0.05, T.but2 + 0.35));
    const back = ss(t, T.feel3 - 0.55, T.end - 0.25); // back to the opening's pointing pose
    s.pose = mixH(mixH(H_FLAT, H_FIST, grab), H_POINT, back);
    s.ang = lerp(lerp(174, 168, grab), 148, back);
    s.pad = {x: lerp(-20, 0, back), y: lerp(-FY - 4, -FY + pressDip(t) - 2, back) + 4 * grab};
    s.expr = mixExpr(mixExpr(EXN.focus, EXN.puzzled, ss(t, T.grab - 0.1, T.grab + 0.3)), EXN.delight, ss(t, T.skin2, T.feel3));
    s.waveT0 = T.and2 - 1;
    s.waves = (1 - ss(t, T.feel3, T.feel3 + 0.3));
    s.envelope = 0.55 * (1 - grab * 0.5);
    s.wavelets = 0;
    s.focus = (0.8 + 0.2 * Math.cos(2 * Math.PI * 4 * t)) * (1 - back);
    s.press = ss(t, T.but2, T.skin2) * (1 - back) * (0.5 + 0.5 * Math.cos(2 * Math.PI * 4 * t));
    s.cam = camAt(
      t,
      [
        {t: T.and2 - 0.06, x: -4, y: FY + 30, d: 520, yaw: -8, pitch: -6},
        {t: T.you - 0.1, x: 20, y: FY + 60, d: 640, yaw: -4, pitch: -5},
        {t: T.grab + 0.3, x: 50, y: FY + 120, d: 860, yaw: 0, pitch: -5},
        {t: T.skin2, x: 30, y: FY + 70, d: 600, yaw: -6, pitch: -5},
        {t: T.feel3 - 0.1, x: 4, y: FY + 20, d: 380, yaw: -16, pitch: -4},
        {...OPEN_K(T.end - 0.3), d: 190 - OPEN_V * 0.3},
        {...OPEN_K(T.end), d: 190},
      ],
      true,
    );
    s.onPalm = 1 - back;
    s.pulse = pulseAge(t, [T.feel3 + 0.05, T.end - 0.2]);
    s.pulseOn = 1;
    s.body = t < T.feel3 + 0.2;
    return s;
  }
  return null;
};
