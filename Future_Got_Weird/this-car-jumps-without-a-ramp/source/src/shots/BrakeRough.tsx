// 1:10–1:33 — braking, then a rough patch, each in its own view.
//   70.5   the car runs through the lens of the front view; the side view opens on its red door and pulls back
//   71.2   hard braking: the tyres brake the car, the nose dives (a ghost marks the level car)
//   74.3   a window opens at the front corner: the actuator pushes up and the dive shrinks
//   77.3   a bump rolls toward the front tyre; the camera follows it into the wheel arch, shows the stroke, and tilts up
//          to the cabin: the wheel moves a lot, the cabin much less
//   82.5   one wide view for the balancing act (body control, tyre contact, comfort), one label at a time
//   87.9   slow motion on a bigger bump: the stroke runs out and the bump stop takes it, shown where it is
//   92     the car drives off
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';
import {w} from '../cues';
import {SideCar, bodyToWorld, STRUT_TOP} from '../car/side';
import {Arrow, BUMP} from '../car/parts';
import {AXLE_F, AXLE_R, COM, WHEEL_R} from '../car/geom';
import {Cam, Callout, Caption, Label, Stage, toScreen, World} from '../kit/stage';
import {ProvingSide} from '../kit/proving';
import {simulateHalf, sampleHalf} from '../sim/halfcar';
import {clamp01, easeInOut, keys, lerp, rand, seg, smooth, wheelBlur, win} from '../kit/util';

export const T4 = {
  brake: w('b4', 'brake'),
  pitch: w('b4', 'pitch'),
  active: w('b4', 'active'),
  oppose: w('b4', 'oppose'),
  dive: w('b4', 'dive'),
  hit: w('b4', 'hit'),
  uneven: w('b4', 'uneven'),
  wheels: w('b4', 'wheels'),
  room: w('b4', 'room'),
  cabin: w('b4', 'cabin'),
  copy: w('b4', 'copy'),
  movement: w('b4', 'movement'),
  balancing: w('b4', 'balancing'),
  bodyCtl: w('b4', 'body', 1),
  tire: w('b4', 'tire'),
  comfort: w('b4', 'comfort'),
  system: w('b4', 'system'),
  limited: w('b4', 'limited'),
  travel: w('b4', 'travel'),
  force: w('b4', 'force'),
  cant: w('b4', "can't"),
  rough: w('b4', 'rough'),
  smooth: w('b4', 'smooth'),
  one: w('b4', 'one'),
  and5: w('b5', 'and'),
};
export const BRAKE_IN = T4.brake - 0.65;
export const BRAKE_HOLD = T4.smooth + 0.3; // the camera stops following; the car drives off
export const BRAKE_OUT = T4.and5 + 0.3;

// slow motion: scene time runs slower than video time inside the windows, so the wheel's trip over a bump and the bump
// stop can be seen; everything physical in the shot runs on scene time. Two windows: the first bumps, and the big one.
const SLOW0 = T4.limited - 0.35, SLOW_LEN = 2.3, SLOW_K = 0.3;
const SLOWS = [{a: T4.hit + 0.16, len: 2.2, k: 0.35}, {a: SLOW0, len: SLOW_LEN, k: SLOW_K}];
export const sceneT = (t: number) => {
  let shift = 0;
  for (const s of SLOWS) if (t > s.a) shift += (Math.min(t, s.a + s.len) - s.a) * (1 - s.k);
  return t - shift;
};
export const videoT = (ts: number) => {
  let t = ts;
  for (const s of SLOWS) {
    const tsA = sceneT(s.a);
    if (ts > tsA) {
      const inside = Math.min(ts - tsA, s.len * s.k);
      t += inside * (1 / s.k - 1);
    }
  }
  return t;
};
export const SLOW_WINS = SLOWS.map((s) => [s.a, s.a + s.len]);
const inSlow = (t: number, fi = 0.2, fo = 0.2) => Math.max(...SLOWS.map((s) => win(t, s.a - 0.05, s.a + s.len + 0.05, fi, fo)));

// speed (m/s): cruise, brake down to a low speed, roll on over the patch, then drive off
const V0 = 20, V1 = 8;
const tb0 = T4.brake + 0.12, tb1 = T4.dive + 0.1;
const tOff = sceneT(BRAKE_HOLD);
const vAt = (t: number) => (t < tb0 ? V0 : t < tb1 ? V0 + (V1 - V0) * ((t - tb0) / (tb1 - tb0)) : t < tOff ? V1 : V1 + 4 * (t - tOff));
const xAt = (t: number) => {
  let x = V0 * Math.max(0, Math.min(t, tb0) - BRAKE_IN);
  if (t > tb0) {
    const u = Math.min(t, tb1) - tb0;
    x += V0 * u + ((V1 - V0) / (tb1 - tb0)) * u * u * 0.5;
  }
  if (t > tb1) x += V1 * (Math.min(t, tOff) - tb1);
  if (t > tOff) x += V1 * (t - tOff) + 2 * (t - tOff) ** 2;
  return x;
};

// road: small humps from "Hit" on, two clear bumps the camera follows, and a bigger one at "limited travel"
const xf = (ts: number) => xAt(ts) + 1.45; // front axle position when the car is at scene time ts
const PATCH0 = xf(T4.hit - 0.1);
const F1 = {c: xf(T4.hit + 0.16 + 0.3), len: 1.0, h: 0.07};
const F2 = {c: xf(T4.hit + 0.16 + 0.8), len: 1.1, h: 0.05};
const BIG = {c: xf(sceneT(SLOW0) + 0.42), len: 1.5, h: 0.13};
const PATCH1 = xf(sceneT(BRAKE_HOLD)) + 6;
const hump = (s: number, c: number, len: number, h: number) => {
  const u = (s - (c - len / 2)) / len;
  return u > 0 && u < 1 ? h * Math.sin(Math.PI * u) ** 2 : 0;
};
const FEATURES: [number, number, number][] = (() => {
  const out: [number, number, number][] = [[F1.c, F1.len, F1.h], [F2.c, F2.len, F2.h], [BIG.c, BIG.len, BIG.h]];
  let s = PATCH0 + 0.6;
  let i = 0;
  while (s < PATCH1) {
    if (Math.abs(s - F1.c) > 1.4 && Math.abs(s - F2.c) > 1.4 && Math.abs(s - BIG.c) > 3.2) {
      const long = rand(41 + i) < 0.25;
      out.push([s, long ? 2.4 + 1.0 * rand(7 + i) : 0.5 + 0.4 * rand(9 + i), long ? 0.015 + 0.01 * rand(3 + i) : 0.02 + 0.02 * rand(5 + i)]);
    }
    s += 1.0 + 1.8 * rand(13 + i);
    i++;
  }
  return out;
})();
export const roadAt = (x: number) => {
  if (x < PATCH0 || x > PATCH1) return 0;
  let h = 0;
  for (const [c, len, hh] of FEATURES) h = Math.max(h, hump(x, c, len, hh));
  return h;
};
export let HALF_DEBUG: unknown;
let _lim = -1;
export const BRAKE_EV = {limitT: () => _lim, tb0, tb1, xAt, sceneT, videoT, big: BIG.c, bigT: videoT(sceneT(SLOW0) + 0.42), f1: F1.c, f2: F2.c};
const HALF = simulateHalf(BRAKE_IN - 0.5, sceneT(BRAKE_OUT) + 0.5, xAt, roadAt, (t) => smooth(seg(t, T4.hit - 1.2, T4.hit - 0.5)));
HALF_DEBUG = HALF;
_lim = (() => { const h = HALF.find((s) => s.t > sceneT(SLOW0) && (s.limF > 0.5 || s.limR > 0.5)); return h ? videoT(h.t) : -1; })();

// ------------------------------------------------------------------------------------------------ camera
type K = {dx: number; y: number; z: number};
const KEYS: [number, K][] = [
  [BRAKE_IN, {dx: 150, y: 640, z: 2.3}],
  [BRAKE_IN + 1.15, {dx: 200, y: 700, z: 0.34}],
  [T4.active - 0.4, {dx: 200, y: 700, z: 0.34}],
  [T4.active + 0.4, {dx: AXLE_F - 250, y: 600, z: 0.58}],
  [T4.dive + 0.3, {dx: AXLE_F - 250, y: 600, z: 0.58}],
  [T4.hit - 0.1, {dx: 200, y: 700, z: 0.36}],
  [T4.hit + 0.5, {dx: AXLE_F - 150, y: 330, z: 0.8}],
  [T4.cabin - 1.0, {dx: AXLE_F - 150, y: 330, z: 0.8}],
  [T4.cabin - 0.25, {dx: 80, y: 930, z: 0.5}],
  [T4.movement + 0.4, {dx: 80, y: 930, z: 0.5}],
  [T4.balancing - 0.1, {dx: 200, y: 700, z: 0.34}],
  [T4.limited - 1.0, {dx: 200, y: 700, z: 0.34}],
  [T4.limited + 0.15, {dx: AXLE_F - 100, y: 470, z: 1.05}],
  [T4.cant + 0.35, {dx: AXLE_F - 100, y: 470, z: 1.05}],
  [T4.cant + 1.5, {dx: 200, y: 700, z: 0.34}],
  [BRAKE_HOLD, {dx: 200, y: 700, z: 0.34}],
  [BRAKE_HOLD + 0.5, {dx: 200, y: 700, z: 0.31}],
];
const camK = (t: number): K => {
  const ex = (a: number, b: number, u: number) => lerp(a, b, easeInOut(u));
  if (t <= KEYS[0][0]) return KEYS[0][1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (t <= KEYS[i + 1][0]) {
      const u = (t - KEYS[i][0]) / (KEYS[i + 1][0] - KEYS[i][0]);
      const a = KEYS[i][1], b = KEYS[i + 1][1];
      // zoom geometrically, position follows the zoom so the framing stays anchored
      const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), easeInOut(u)));
      const kz = Math.abs(b.z - a.z) < 1e-9 ? easeInOut(u) : (1 / z - 1 / a.z) / (1 / b.z - 1 / a.z);
      return {dx: lerp(a.dx, b.dx, kz), y: lerp(a.y, b.y, kz), z};
    }
    void ex;
  }
  return KEYS[KEYS.length - 1][1];
};

export const SideBrake: React.FC<{t: number}> = ({t}) => {
  const ts = sceneT(t);
  const X = xAt(ts) * 1000; // car position (mm)
  const speed = vAt(ts) * 1000;
  const hs = sampleHalf(HALF, ts);
  // braking pitch (kinematic): passive dive, then the actuators take most of it out; ends when braking ends
  const passive = -2.6, active = -0.7;
  let brakePitch = keys(t, [[tb0, 0], [tb0 + 0.7, passive * 1.08], [tb0 + 1.1, passive]], easeInOut);
  if (t > T4.active - 0.1) brakePitch = keys(t, [[T4.active - 0.1, passive], [T4.oppose + 0.25, active]], easeInOut);
  brakePitch *= 1 - smooth(seg(t, tb1 - 0.1, tb1 + 0.5));
  const pitch = brakePitch + (hs.th * 180) / Math.PI;
  const dz = hs.z * 1000 + brakePitch * 4; // the nose dives about the rear axle region: a small heave to match
  const wf = hs.zf * 1000, wr = hs.zr * 1000;
  const rot = -(X / (2 * Math.PI * WHEEL_R)) * 360;

  // camera
  const kk = camK(t);
  const camX = xAt(Math.min(ts, tOff)) * 1000 + kk.dx;
  const cam: Cam = {x: camX, y: kk.y, z: kk.z};
  const px = cam.z;
  const toS = (x: number, y: number) => toScreen(cam, x, y);

  // the front window: braking comparison, the rough-road stroke, the travel limit
  const open = Math.max(
    smooth(seg(t, T4.active - 0.5, T4.active + 0.1)) * (1 - smooth(seg(t, T4.dive + 0.3, T4.dive + 0.7))),
    smooth(seg(t, T4.hit + 0.1, T4.hit + 0.55)) * (1 - smooth(seg(t, T4.cabin - 1.0, T4.cabin - 0.45))),
    smooth(seg(t, T4.limited - 0.55, T4.limited + 0.05)) * (1 - smooth(seg(t, T4.cant + 0.5, T4.cant + 1.1))),
  );
  const isActive = t > T4.active - 0.15;
  const actOn = smooth(seg(t, T4.active - 0.2, T4.active + 0.3));
  // actuator forces: braking phase (front pushes the body up, rear pulls it down), then the half-car active forces on the patch
  const brakeAct = isActive ? actOn * (1 - smooth(seg(t, tb1 - 0.1, tb1 + 0.4))) : 0;
  const forceF = brakeAct * 0.9 + clamp01(1 - brakeAct) * (hs.Ff / 7000) * (t > T4.hit - 0.6 ? 1 : 0);
  const limit = win(t, T4.limited - 0.1, T4.cant + 0.5, 0.15, 0.4) * hs.limF;
  const wells = open > 0.001 ? [{axle: 'f' as const, open, spring: 1, damper: 1, actuator: 1, slide: 1, force: forceF, springGlow: 0, damperGlow: 0, limit}] : [];

  const pose = {x: X, dz, pitch};
  const ghost = win(t, tb0 + 0.35, tb1, 0.3, 0.3);
  const ghostPitch = keys(t, [[T4.active - 0.1, 0], [T4.active + 0.4, passive]], easeInOut);
  const brakeArrows = win(t, tb0 + 0.1, tb1 - 0.05, 0.25, 0.25);
  const topF = bodyToWorld(pose, AXLE_F, STRUT_TOP), topR = bodyToWorld(pose, AXLE_R, STRUT_TOP);
  const pairVis = win(t, T4.active - 0.1, T4.dive + 0.3, 0.3, 0.3);

  // where the bump stop is: on the front damper, below the cylinder (the part the limit label points at)
  const hub: [number, number] = [X + AXLE_F, WHEEL_R + wf];
  const dl = Math.hypot(hub[0] - topF[0], hub[1] - topF[1]);
  const ux = (hub[0] - topF[0]) / dl, uy = (hub[1] - topF[1]) / dl;
  const nx = uy, ny = -ux; // side = -1 for the front corner
  const stopW: [number, number] = [topF[0] + ux * (BUMP.body + BUMP.stop) - 150 * nx, topF[1] + uy * (BUMP.body + BUMP.stop) - 150 * ny];
  const stopS = toS(stopW[0], stopW[1]);

  // the bump a tyre meets, and the reference line the cabin is measured against
  const cabinRef = win(t, T4.room + 0.3, T4.movement + 0.5, 0.4, 0.4);
  const refY = 1240; // roof height at rest (mm)
  const tagBody = toS(X - 300, 1500 + dz), tagTire = toS(X + AXLE_F, -360), tagComfort = toS(X - 700, 1150 + dz);
  const caption = (
    <g>
      <Caption text="SIMPLIFIED CUTAWAY" opacity={open * (1 - inSlow(t))} />
      <Caption text="SLOW MOTION · SIMPLIFIED MODEL" opacity={inSlow(t)} />
    </g>
  );
  return (
    <AbsoluteFill>
      <Stage bg={C.paper}>
        <ProvingSide cam={cam} zone="rough" profile={(xmm) => roadAt(xmm / 1000) * 1000} signs={[{x: (xAt(T4.hit) - 6) * 1000, kind: 'bumps'}, {x: xAt(BRAKE_IN + 1.5) * 1000 + 14000, kind: 'brake'}]} />
        <World cam={cam}>
          {ghost > 0 && <g opacity={ghost}><SideCar x={X} dz={ghostPitch * 4} pitch={ghostPitch} px={px} ghost id="bghost" /></g>}
          <SideCar x={X} dz={dz} pitch={pitch} wf={wf} wr={wr} rot={rot} px={px} wells={wells} brake={brakeArrows} blur={wheelBlur(speed)} id="brake" />
          {/* the tyres brake the car: rearward road forces at the contact patches (front larger) */}
          {brakeArrows > 0 && (
            <g>
              <Arrow x={X + AXLE_F + 40} y={30} dx={-560} dy={0} px={px} color={C.coral} width={16} opacity={brakeArrows} />
              <Arrow x={X + AXLE_R + 40} y={30} dx={-340} dy={0} px={px} color={C.coral} width={16} opacity={brakeArrows} />
            </g>
          )}
          {/* actuators against the dive: front pushes the body up, rear pulls it down */}
          {pairVis > 0 && (
            <g>
              <Arrow x={topF[0] + 260} y={topF[1] + 40} dx={0} dy={260} px={px} color={C.teal} opacity={pairVis} />
              <Arrow x={topR[0] - 160} y={topR[1] + 300} dx={0} dy={-240} px={px} color={C.blue} opacity={pairVis} />
            </g>
          )}
          {/* a level line at roof height: the cabin stays near it while the wheel travels */}
          {cabinRef > 0 && <line x1={X - 2600} y1={refY} x2={X + 2600} y2={refY} stroke={C.saffronDeep} strokeWidth={4 / px} strokeDasharray={`${22 / px} ${14 / px}`} opacity={0.9 * cabinRef} />}
        </World>
        <Label x={toS(X + AXLE_F - 900, 0).x} y={toS(0, -420).y} text="TIRES BRAKE THE CAR" color={C.coralLight} size={34} opacity={win(t, tb0 + 0.2, T4.active - 0.3, 0.3, 0.3)} />
        <Label x={tagBody.x} y={tagBody.y} text="BODY CONTROL" color={C.white} size={34} opacity={win(t, T4.bodyCtl - 0.1, T4.tire - 0.05, 0.25, 0.25)} />
        <Label x={tagTire.x} y={tagTire.y} text="TIRE CONTACT" color={C.tealLight} size={34} opacity={win(t, T4.tire - 0.1, T4.comfort - 0.05, 0.25, 0.25)} />
        <Label x={tagComfort.x} y={tagComfort.y} text="COMFORT" color={C.saffronLight} size={34} opacity={win(t, T4.comfort - 0.1, T4.system + 0.1, 0.25, 0.3)} />
        <Callout x={stopS.x + 380} y={stopS.y - 150} tx={stopS.x} ty={stopS.y} text="TRAVEL LIMIT" color={C.coral} fg={C.white} size={36} opacity={smooth(limit * 2.2) * open} />
        <MotionTrace t={t} opacity={Math.max(win(t, T4.copy - 0.35, T4.movement + 0.4, 0.4, 0.4), win(t, T4.cant + 0.1, T4.rough + 1.9, 0.4, 0.5))} />
        {caption}
      </Stage>
    </AbsoluteFill>
  );
};

/** A small illustrative trace of the last few seconds: how far the front wheel moves versus the cabin above it (same scale,
 *  from the teaching model, not a measurement). */
const MotionTrace: React.FC<{t: number; opacity: number}> = ({t, opacity}) => {
  if (opacity <= 0.001) return null;
  const x0 = 1230, y0 = 70, w = 650, h = 260, span = 2.6, k = 1.6; // px per mm
  const base = y0 + h * 0.6;
  const pts = (f: (st: ReturnType<typeof sampleHalf>) => number) => {
    const out: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const tt = t - span + (span * i) / 120;
      const v = f(sampleHalf(HALF, sceneT(tt))) * 1000 * k;
      out.push(`${x0 + 24 + ((w - 48) * i) / 120},${Math.max(y0 + 12, Math.min(y0 + h - 62, base - v))}`);
    }
    return out.join(' ');
  };
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y0} width={w} height={h} rx={22} fill={C.white} opacity={0.94} stroke={C.ink} strokeWidth={4} />
      <line x1={x0 + 24} y1={base} x2={x0 + w - 24} y2={base} stroke={C.inkMuted} strokeWidth={2} strokeDasharray="8 8" />
      <polyline points={pts((st) => st.zf)} fill="none" stroke={C.blue} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={pts((st) => st.z + 0.6 * st.th)} fill="none" stroke={C.coral} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
      <line x1={x0 + 34} y1={y0 + h - 34} x2={x0 + 74} y2={y0 + h - 34} stroke={C.blue} strokeWidth={6} strokeLinecap="round" />
      <text x={x0 + 86} y={y0 + h - 23} fontFamily="'Fredoka Variable'" fontWeight={700} fontSize={30} fill={C.ink}>WHEEL</text>
      <line x1={x0 + 240} y1={y0 + h - 34} x2={x0 + 280} y2={y0 + h - 34} stroke={C.coral} strokeWidth={7} strokeLinecap="round" />
      <text x={x0 + 292} y={y0 + h - 23} fontFamily="'Fredoka Variable'" fontWeight={700} fontSize={30} fill={C.ink}>CABIN</text>
      <text x={x0 + w - 24} y={y0 + h - 23} textAnchor="end" fontFamily="'Nunito Variable'" fontWeight={800} fontSize={22} fill={C.inkMuted} letterSpacing={1.4}>ILLUSTRATIVE</text>
    </g>
  );
};
void COM;
