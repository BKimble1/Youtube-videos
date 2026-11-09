// S8 — THE LOOP (27.82–32.40 s): "So apparently… Even prison bars can't stop a robot anymore."
//
// Back in the jail (a new place/time: deliberate cut). The guard stands before the EMPTY cell (door shut, bars intact),
// alarm off, the cell lamp the only light. He stares, then scratches his head under the cap. On "Even" a single silver
// droplet zips in from screen-left along the floor, swerves round the toe of his shoe and settles in front of the escape
// gap, catching the light. On "can't" he slowly looks down. On "robot" two cyan eyes pop open in the droplet (it bulges
// into a little mound), first peek up at him, then glance at the camera with the robot's mischievous squint; the alarm
// kicks on again (red sweep). Meanwhile the camera eases in and down toward the droplet so that on the LAST frame
// (t = 32.40 - 1/30) the eyes sit EXACTLY where the robot's eyes are on frame 0 of S1 (s1Eyes(0): same centres, size,
// squash, tilt, open, gaze, mood, glow) and the camera has S1's frame-0 orientation and focal: the cut back to frame 0
// continues the same eyes, the same alarm phase (alarm time t - DUR, continuous across the loop) and a gentle push.
import React from 'react';
import {AlarmBeacon, AlarmWash, Bars, JailBack, JailFront, alarmSweep} from '../art/jail';
import {Env, EyesAt, LiquidMetal, V, floorBlob} from '../art/liquid';
import {Guard, GuardAct, GUARD_IDLE, guardFeet} from '../art/guard';
import {C} from '../art/palette';
import {Cam3, P3, project} from '../world';
import {clamp, DUR, keyS, lerp, ss, ss5} from '../lib';
import {SHOTS, T} from '../story';
import {camAt as s1Cam, s1Eyes, s1GuardAct, S1_GUARD} from './S1Hook';

const T_LAST = SHOTS.S8[1] - 1 / 30; // the last rendered frame of the film (32.3667)
const rad = (a: number) => (a * Math.PI) / 180;
const deg = (a: number) => (a * 180) / Math.PI;

// ---- world layout ----
/** where the droplet comes to rest, in front of the escape gap */
const REST = {x: 0.45, d: -1.75};
/** the droplet's path (world x, d): in from the left in front of the guard's shoe, round its toe, back to the gap */
const PATH: {x: number; d: number}[] = [
  {x: -16, d: -6.6}, {x: -8, d: -6.5}, {x: -1.5, d: -6.4}, {x: 2.6, d: -6.3}, {x: 4.4, d: -5.6}, {x: 3.4, d: -4.1}, {x: 1.6, d: -2.6}, REST,
];
const T_IN = T.even - 0.1; // starts sliding (just before "Even")
const T_REST = T.cant + 0.18; // settles at the gap
const T_EYES = T.robot3 - 0.02; // the eyes pop open on "robot"

// ---- helpers ----
const camToWorldDir = (c: {yaw: number; pitch: number}, q: {x: number; y: number; z: number}) => {
  const cp = Math.cos(rad(c.pitch)), sp = Math.sin(rad(c.pitch));
  const y = q.y * cp - q.z * sp;
  const z1 = q.y * sp + q.z * cp;
  const cy = Math.cos(rad(c.yaw)), sy = Math.sin(rad(c.yaw));
  return {x: q.x * cy + z1 * sy, h: y, d: -q.x * sy + z1 * cy};
};
const lookAt = (p: P3, q: P3) => {
  const dx = q.x - p.x, dh = q.h - p.h, dd = q.d - p.d;
  return {yaw: deg(Math.atan2(dx, dd)), pitch: deg(Math.atan2(-dh, Math.hypot(dx, dd)))};
};
const pathAt = (u0: number) => {
  const u = clamp(u0);
  const seg: number[] = [];
  let L = 0;
  for (let i = 1; i < PATH.length; i++) {
    const l = Math.hypot(PATH[i].x - PATH[i - 1].x, PATH[i].d - PATH[i - 1].d);
    seg.push(l);
    L += l;
  }
  // Catmull-Rom through the points, parametrised by arc length (approx)
  let s = u * L, i = 0;
  while (i < seg.length - 1 && s > seg[i]) {
    s -= seg[i];
    i++;
  }
  const k = clamp(s / seg[i]);
  const P = (j: number) => PATH[Math.max(0, Math.min(PATH.length - 1, j))];
  const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
  const cr = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * k + (2 * a - 5 * b + 4 * c - d) * k * k + (-a + 3 * b - 3 * c + d) * k * k * k);
  return {x: cr(p0.x, p1.x, p2.x, p3.x), d: cr(p0.d, p1.d, p2.d, p3.d)};
};
/** droplet progress along its path: zips in fast, decelerates round the toe, eases into the gap */
const slideU = (t: number) => keyS(t, [[T_IN, 0], [T.prison + 0.25, 0.55], [T.cant - 0.1, 0.84], [T_REST, 1]], (x) => {
  const c = clamp(x);
  return 1 - (1 - c) * (1 - c) * (1 - 0.6 * c); // starts with velocity, eases out
});

// ---- the droplet's shape over time ----
const RX_SMALL = 1.9, RX_END = 2.05; // floor radius (x); rd = 0.72 rx
const MOUND_END = 1.75; // dome height at the end (world u), holds the eyes
const EYE_H_END = 0.9; // eye-midpoint height on the mound at the end
const dropletShape = (t: number) => {
  const gather = ss(t, T.cant + 0.05, T_EYES + 0.05); // gathers itself up just before the eyes
  const bulge = ss(t, T_EYES - 0.08, T_EYES + 0.3);
  const rx = lerp(RX_SMALL, RX_END, gather);
  const mound = lerp(0.55, 1.0, gather) * lerp(1, MOUND_END, bulge) + 0.08 * Math.sin((t - T_EYES) * 9) * Math.exp(-Math.max(0, t - T_EYES) * 4) * bulge;
  const eyeH = lerp(0.5, EYE_H_END, bulge);
  return {rx, rd: rx * 0.72, mound, eyeH};
};

// ---- the end camera: S1 frame-0 orientation and focal, positioned so the droplet's eyes land on frame-0's eyes ----
const E0 = s1Eyes(0);
const C0 = s1Cam(0);
const endCam = (): Cam3 => {
  const mid = {x: (E0.l.x + E0.r.x) / 2, y: (E0.l.y + E0.r.y) / 2};
  const z = C0.f / E0.s; // the eyes' depth for the frame-0 scale
  const q = {x: ((mid.x - 540) * z) / C0.f, y: ((960 - mid.y) * z) / C0.f, z};
  const w = camToWorldDir(C0, q);
  const pe = {x: REST.x, h: EYE_H_END, d: REST.d};
  return {x: pe.x - w.x, h: pe.h - w.h, d: pe.d - w.d, yaw: C0.yaw, pitch: C0.pitch, f: C0.f};
};
const END = endCam();
/** the guard: placed so that on the last frame he stands at the same screen x and scale as on S1's frame 0 (the end
 *  camera has frame 0's orientation, so that is S1's spot shifted by the camera offset; only his height differs,
 *  because the end camera sits lower to frame the droplet: ~200 px) */
export const S8_GUARD: P3 = {x: S1_GUARD.x + (END.x - C0.x), h: 0, d: S1_GUARD.d + (END.d - C0.d)};

// ---- camera: a wide, slowly drifting two-shot of the guard and the empty cell, then an ease in and down onto the
// droplet that arrives on frame-0's camera (with a little forward velocity left, like S1's opening drift)
const WIDE_A: P3 = {x: -8.5, h: 13, d: -47};
const WIDE_B: P3 = {x: -4.2, h: 11.2, d: -37.5};
const WIDE_LOOK: P3 = {x: 1.2, h: 10.2, d: -2};
const T_PUSH0 = T.cant - 0.15;
const camAt = (t: number): Cam3 => {
  const t0 = SHOTS.S8[0];
  const u = clamp((t - t0) / (T_LAST - t0));
  // drift: constant velocity from the first frame (no static start)
  const drift = {x: lerp(WIDE_A.x, WIDE_B.x, u), h: lerp(WIDE_A.h, WIDE_B.h, u), d: lerp(WIDE_A.d, WIDE_B.d, u)};
  // the droplet steers the aim once it is in
  const dp = dropletPos(t);
  const aimDrop = ss(t, T.even + 0.3, T_PUSH0 + 0.5) * 0.35;
  const look = {x: lerp(WIDE_LOOK.x, dp.x, aimDrop), h: lerp(WIDE_LOOK.h, 1, aimDrop), d: lerp(WIDE_LOOK.d, dp.d, aimDrop)};
  const o = lookAt(drift, look);
  const wide: Cam3 = {...drift, yaw: o.yaw, pitch: o.pitch, f: C0.f};
  // the push: C2 ease-in, arriving with a small residual velocity (the loop continues S1's gentle push)
  const v = clamp((t - T_PUSH0) / (T_LAST - T_PUSH0));
  const w = v * v * v * (10 - 15 * v + 6 * v * v) * 0.88 + 0.12 * v * v; // ends at 1 with slope 0.24
  return {
    x: lerp(wide.x, END.x, w), h: lerp(wide.h, END.h, w), d: lerp(wide.d, END.d, w),
    yaw: lerp(wide.yaw, END.yaw, w), pitch: lerp(wide.pitch, END.pitch, w), f: C0.f,
  };
};
const dropletPos = (t: number) => (t < T_IN ? PATH[0] : pathAt(slideU(t)));

// ---- the guard ----
// He has a fresh coffee (the same cup-in-hand pose as S1's frame 0, so the loop cut does not pop his hands or conjure
// a cup): a nonchalant sip on "So apparently…" while the droplet is still off screen, a wary stare, then on "can't" he
// slowly looks down; his small start when the eyes open settles back into S1's frame-0 stare by the last frame.
const S1_ACT0 = s1GuardAct(0);
const guardAct = (t: number): GuardAct => {
  const sip = ss(t, 28.02, 28.42) * (1 - ss(t, 28.78, 29.12));
  const down = ss(t, T.cant, T.cant + 0.75);
  const settle = ss(t, 31.85, T_LAST);
  return {
    ...GUARD_IDLE,
    holdCup: 1,
    sip,
    look: lerp(lerp(-0.85, -0.55, down), S1_ACT0.look, settle),
    stare: lerp(0.3 + 0.25 * ss(t, 29.0, 29.5) + 0.2 * ss(t, T_EYES, T_EYES + 0.3), S1_ACT0.stare, settle),
    scratch: 0,
    lookDown: down,
    shock: 0.35 * ss(t, T_EYES + 0.1, T_EYES + 0.3) * (1 - settle),
  };
};

// ---- the droplet's eyes ----
const eyesAt = (t: number) => {
  const open = ss(t, T_EYES, T_EYES + 0.12) * (1.18 - 0.18 * ss(t, T_EYES + 0.4, T_EYES + 0.8));
  const blink = Math.max(0, 1 - Math.abs(t - 31.55) / 0.065);
  // first a peek up at the guard (right, up), then the glance at the camera, settling into frame-0's look
  const peek = ss(t, T_EYES + 0.1, T_EYES + 0.25) * (1 - ss(t, 31.4, 31.7));
  return {
    open: lerp(open, E0.open, ss(t, 31.8, 32.25)) * (1 - 0.95 * blink),
    lookX: lerp(0.85 * peek, E0.lookX, ss(t, 31.4, 31.7)),
    lookY: lerp(-0.5 * peek, E0.lookY, ss(t, 31.4, 31.7)),
    mood: lerp(0.2, E0.mood, ss(t, 31.45, 31.9)),
    glow: E0.glow,
  };
};

const f1 = (n: number) => n.toFixed(1);

export const s8Debug = (t: number) => {
  const c = camAt(t);
  const dp = dropletPos(t);
  const sh = dropletShape(t);
  const pe = project(c, {x: dp.x, h: sh.eyeH, d: dp.d});
  return {c, pe, E0, END};
};

export const S8View: React.FC<{t: number; debug?: boolean}> = ({t, debug}) => {
  const c = camAt(t);
  const ta = t - DUR; // alarm time: continuous with S1's frame 0 across the loop
  const alarm = ss(t, T_EYES + 0.04, T_EYES + 0.16);
  const sw = alarmSweep(ta);
  const env: Env = {top: C.silverLit, bottom: C.navy2, tint: C.red, tintAmt: alarm * (0.1 + 0.32 * sw)};
  // guard
  const gS = project(c, S8_GUARD);
  const act = guardAct(t);
  // droplet
  const dp = dropletPos(t);
  const sh = dropletShape(t);
  const base = project(c, {x: dp.x, h: 0, d: dp.d});
  const on = t >= T_IN;
  const ring = floorBlob(c, dp, sh.rx, sh.rd, t, 9, 40);
  // the mound: a dome standing on the droplet (screen space at the droplet's scale), so the eyes have a face to sit on
  const mound: V[] = [];
  const mw = sh.rx * 0.86;
  for (let i = 0; i <= 20; i++) {
    const xx = -mw + (2 * mw * i) / 20;
    const k = 1 - (xx / mw) ** 2;
    mound.push({x: base.x + xx * base.s, y: base.y - sh.mound * Math.pow(Math.max(0, k), 0.6) * base.s});
  }
  mound.push({x: base.x + mw * base.s, y: base.y + 0.1 * base.s}, {x: base.x - mw * base.s, y: base.y + 0.1 * base.s});
  // a slide stretch while it zips (longer along the motion, thinner)
  const sp = slideU(t);
  const speed = on && t < T_REST ? clamp((slideU(t + 0.02) - sp) / 0.02 / 2.2) : 0;
  const trail: V[] = [];
  if (speed > 0.02) {
    const back = pathAt(Math.max(0, sp - 0.05 * speed));
    trail.push(...floorBlob(c, {x: (dp.x + back.x) / 2, d: (dp.d + back.d) / 2}, sh.rx * 0.8, sh.rd * 0.55, t, 3, 28));
  }
  // eyes: world eye point -> screen, eye pair angle easing to frame-0's tilt; the last frame is EXACTLY frame 0's
  const pe = project(c, {x: dp.x, h: sh.eyeH, d: dp.d});
  const ex = eyesAt(t);
  const ang0 = Math.atan2(E0.r.y - E0.l.y, E0.r.x - E0.l.x);
  const half0 = Math.hypot(E0.r.x - E0.l.x, E0.r.y - E0.l.y) / 2 / E0.s; // world half separation of frame 0's eyes
  const ang = lerp(0, ang0, ss(t, 31.7, 32.3));
  const half = half0 * pe.s;
  let L: V = {x: pe.x - Math.cos(ang) * half, y: pe.y - Math.sin(ang) * half};
  let R: V = {x: pe.x + Math.cos(ang) * half, y: pe.y + Math.sin(ang) * half};
  let es = pe.s;
  const exact = ss(t, T_LAST - 0.2, T_LAST); // numerical safety: lands bit-exact on frame 0's values
  L = {x: lerp(L.x, E0.l.x, exact), y: lerp(L.y, E0.l.y, exact)};
  R = {x: lerp(R.x, E0.r.x, exact), y: lerp(R.y, E0.r.y, exact)};
  es = lerp(es, E0.s, exact);
  // a glint sliding over the droplet as it passes under the cell lamp's light through the bars
  const glint = on ? 0.5 + 0.5 * Math.sin(t * 7.5) : 0;
  const showGuard = gS.z > 3;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <JailBack c={c} t={ta} alarm={alarm} door={0} />
      <Bars c={c} t={ta} door={0} alarm={alarm} />
      <AlarmBeacon c={c} t={ta} alarm={alarm} />
      {/* the droplet is in front of the bar track (d < -1.2) and passes in front of the guard's toe: drawn after both */}
      {showGuard && <Guard x={gS.x} y={gS.y} s={gS.s} t={t} act={act} />}
      {on && (
        <g>
          <LiquidMetal pts={[ring, mound, ...(trail.length ? [trail] : [])]} t={t} env={env} px={base.s} ripple={0.35 * ss(t, T_EYES - 0.05, T_EYES + 0.1) * (1 - ss(t, T_EYES + 0.5, T_EYES + 1.0))} />
          <ellipse cx={f1(base.x - sh.rx * 0.35 * base.s)} cy={f1(base.y - sh.mound * 0.62 * base.s)} rx={f1(Math.max(1.5, sh.rx * 0.22 * base.s))} ry={f1(Math.max(1, sh.rx * 0.07 * base.s))} fill="#FFFFFF" opacity={0.25 + 0.35 * glint} />
          <EyesAt l={L} r={R} s={es} sx={E0.sx} sy={E0.sy} open={ex.open} lookX={ex.lookX} lookY={ex.lookY} mood={ex.mood} glow={ex.glow} opacity={ss(t, T_EYES - 0.02, T_EYES + 0.04)} />
        </g>
      )}
      <JailFront c={c} t={ta} alarm={alarm} />
      <AlarmWash c={c} t={ta} alarm={alarm} />
      {debug && (
        <g>
          <circle cx={E0.l.x} cy={E0.l.y} r={6} fill="none" stroke="#FF00FF" strokeWidth={2} />
          <circle cx={E0.r.x} cy={E0.r.y} r={6} fill="none" stroke="#FF00FF" strokeWidth={2} />
          {(() => {
            const ft = guardFeet(gS.x, gS.y, gS.s);
            return <circle cx={ft.r.x} cy={ft.r.y} r={6} fill="#FFD84A" />;
          })()}
          <text x={20} y={1880} fill="#FFD84A" fontSize={26} fontFamily="monospace">
            t {t.toFixed(3)} cam ({c.x.toFixed(2)},{c.h.toFixed(2)},{c.d.toFixed(2)}) yaw {c.yaw.toFixed(2)} pitch {c.pitch.toFixed(2)} eyes L({L.x.toFixed(1)},{L.y.toFixed(1)}) s {es.toFixed(2)}
          </text>
        </g>
      )}
    </svg>
  );
};

export const S8: React.FC<{t: number}> = ({t}) => <S8View t={t} />;

/** the S1 frame-0 eye contract values, for QA */
export const S8_EYE_TARGET = E0;

// Words: So 27.93 apparently 28.115–28.94 | Even 29.29 prison 29.515 bars 29.955 can't 30.315 stop 30.555 a robot 30.875
// anymore 31.355–31.8
export const CUES_S8 = (): {t: number; kind: string; gain?: number; dur?: number; pan?: number; variant?: number}[] => [
  {t: T_IN - 0.08, kind: 'drip', gain: -4}, // the droplet arrives (in the pause before "Even")
  {t: T_IN, kind: 'flow', dur: 1.15, gain: -8}, // it slithers along the floor
  {t: T_EYES - 0.03, kind: 'mech_click', variant: 2, gain: -3}, // the eyes pop open
  {t: T_EYES + 0.04, kind: 'alarm', dur: DUR - (T_EYES + 0.04)}, // runs to the end and on into frame 0 (no fade-out)
  {t: T.anymoreE + 0.03, kind: 'guard_gulp', gain: -3}, // the guard gulps, after "anymore"
];
void ss5;
