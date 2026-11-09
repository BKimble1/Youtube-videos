// S1 — THE IMPOSSIBLE ESCAPE (0.00–3.24 s): "This robot escaped JAIL… by MELTING."
//
// Frame 0 already holds the payoff: the silver robot squeezes through the escape gap (x = 0) of the cell door, its
// upper body still a humanoid gripping the two door bars, its lower body melted into liquid metal that flows THROUGH
// the gap toward us and pools on the corridor floor; cyan eyes on the viewer; the red alarm sweeping; the guard at the
// right frozen in disbelief, coffee in hand. The camera is already trucking sideways with the escape (+ a subtle push).
//
// Beats (word times from story.ts):
//   0.00–0.85  eyes on the viewer (mischievous); the stream surges through the gap, then eases (controlled flow ramp)
//   ~0.88      eyes widen …  ~1.05–T.jail glance at the guard (eyes + head turn)
//   ~1.40      the guard's take: shock, fingers open, the cup pops out of his hand (tossed up and toward us)
//   T.melting  the visible transformation surges (melt 0.42 -> 0.73) with a jelly ripple through the body; the eyes
//              stay. World time slows meanwhile (speed ramp: cup, coffee, guard, alarm beacon) and snaps back.
//   2.70–3.12  motivated camera whip DOWN following the falling cup (crane up + tilt to pitch 90)
//   3.02       the cup lands: CoffeeSplash (view 1) settling to u 0.85 at (540, 980), r 150 px at t = 3.24.
//
// Draw order: JailBack -> Robot (+ its liquid stream/pool) -> Bars (masked where the liquid lies in front of the bar
// line) -> front-pool reflections / flow streaks -> AlarmBeacon -> Guard -> flying cup -> JailFront -> AlarmWash.
import React from 'react';
import {AlarmBeacon, AlarmWash, Bars, JailBack, JailFront, alarmSweep} from '../art/jail';
import {POSE_IDLE, Robot, RobotPose, mixPose, robotEyeScreen, robotHandScreen, robotHeadScreen} from '../art/robot';
import {Env, V, floorBlob, floorStream, smoothPath} from '../art/liquid';
import {Guard, GuardAct, GUARD_IDLE, guardCupHand, guardHead} from '../art/guard';
import {CoffeeCup, CoffeeSplash} from '../art/cup';
import {C, INK} from '../art/palette';
import {uid} from '../core/ids';
import {mix} from '../core/color';
import {Cam3, P3, project, toCam} from '../world';
import {clamp, keyS, lerp, ring, ss, ss5} from '../lib';
import {SHOTS, T} from '../story';

// ---------------------------------------------------------------------------------------------------------------
// world layout of the shot (world units, see world.ts)
export const S1_ROBOT_BASE: P3 = {x: 0.35, h: 0, d: 0.85}; // feet base of the robot, just behind the door bars
export const S1_GUARD: P3 = {x: 6.9, h: 0, d: -1.7}; // the guard, close to the bar row, right of the door (see notes)
export const S1_CUP_LAND: P3 = {x: 1.3, h: 0, d: -9.7}; // where the cup lands (just right of the silver pool)
const SPLASH_R = 150; // px at the boundary (CONTRACTS S1->S2)
const SPLASH_Y = 980;
const F = 1450; // focal (px)
const SPLASH_RW = 1.3; // splash radius in world units
const H_END = (F * SPLASH_RW) / SPLASH_R; // camera height over the floor at the end (s = 150 / 1.3 px/u)
const YAW_END = 30; // ~ the pre-whip heading (no unmotivated image rotation)
const T_REL = 1.47; // the cup leaves the guard's hand
const T_LAND = 3.02; // the cup hits the floor
const W0 = 2.66, W1 = 3.2; // the whip (crane + tilt) window
const T0 = SHOTS.S1[0], T1 = SHOTS.S1[1];

const rad = (a: number) => (a * Math.PI) / 180;
const deg = (a: number) => (a * 180) / Math.PI;

// ---------------------------------------------------------------------------------------------------------------
// speed ramp: world time tw(t). Rate 1, slowed to ~0.38 around the melt surge, then back up (slightly fast) into the
// whip. Integrated numerically (deterministic, cheap).
const rate = (t: number) => 1 - 0.62 * ss(t, 1.98, 2.2) * (1 - ss(t, 2.5, 2.72)) + 0.12 * ss(t, 2.68, 2.9);
export const s1WorldTime = (t: number) => {
  if (t <= 1.9) return t;
  const n = Math.ceil((t - 1.9) / 0.005);
  const h = (t - 1.9) / n;
  let acc = 1.9;
  for (let i = 0; i < n; i++) acc += rate(1.9 + (i + 0.5) * h) * h;
  return acc;
};

// ---------------------------------------------------------------------------------------------------------------
// camera
const lookAt = (p: {x: number; h: number; d: number}, q: {x: number; h: number; d: number}) => {
  const dx = q.x - p.x, dh = q.h - p.h, dd = q.d - p.d;
  const yaw = deg(Math.atan2(dx, dd));
  const pitch = deg(Math.atan2(-dh, Math.hypot(dx, dd)));
  return {yaw, pitch};
};
/** camera space -> world (inverse of world.toCam) */
const camToWorld = (c: Cam3, q: {x: number; y: number; z: number}): P3 => {
  const cp = Math.cos(rad(c.pitch)), sp = Math.sin(rad(c.pitch));
  const y = q.y * cp - q.z * sp;
  const z1 = q.y * sp + q.z * cp;
  const cy = Math.cos(rad(c.yaw)), sy = Math.sin(rad(c.yaw));
  const x = q.x * cy + z1 * sy;
  const z = -q.x * sy + z1 * cy;
  return {x: x + c.x, h: y + c.h, d: z + c.d};
};
/** world point on the billboard plane of an anchor: screen px -> world */
const screenToWorldAt = (c: Cam3, sx: number, sy: number, zc: number): P3 => camToWorld(c, {x: ((sx - 540) * zc) / c.f, y: ((960 - sy) * zc) / c.f, z: zc});

// the face target the camera frames before the whip (robot head height while melting)
const FACE: P3 = {x: S1_ROBOT_BASE.x, h: 4.4, d: S1_ROBOT_BASE.d};
// pre-whip camera: already moving at frame 0 (constant-ish velocity, a subtle push), easing slightly into the whip
const camPos = (t: number): P3 => {
  // already moving at frame 0 (no ease-in): a sideways track toward the guard + a subtle push, decelerating a little
  const u = t / 2.7;
  const e = u - 0.12 * u * u;
  return {x: lerp(-12.4, -9.3, e), h: lerp(9.6, 9.5, e), d: lerp(-18.2, -18.9, e)};
};
export const preCam = (t: number): Cam3 => {
  const p = camPos(t);
  const o = lookAt(p, FACE);
  // frame the face a little below the centre (captions above) and a little left of centre (the guard at the right)
  return {...p, yaw: o.yaw + deg(Math.atan(75 / F)), pitch: o.pitch - deg(Math.atan(100 / F)), f: F};
};
const endCam = (): Cam3 => {
  const s = F / H_END;
  const z1 = -(SPLASH_Y - 960) / s;
  const sy = Math.sin(rad(YAW_END)), cy = Math.cos(rad(YAW_END));
  return {x: S1_CUP_LAND.x - z1 * sy, h: H_END, d: S1_CUP_LAND.d - z1 * cy, yaw: YAW_END, pitch: 90, f: F};
};

// ---------------------------------------------------------------------------------------------------------------
// the guard's performance (act keyed on film t; his breathing/blinks run on world time)
export const s1GuardAct = (t: number): GuardAct => {
  const take = ss(t, 1.36, 1.5);
  return {
    ...GUARD_IDLE,
    look: -0.95,
    stare: 0.62 * (1 - take) + 0.85 * ss(t, 2.35, 2.9),
    shock: take * (1 - 0.55 * ss(t, 2.3, 2.9)),
    drop: ss(t, 1.4, 1.47) * (1 - ss(t, 1.9, 2.4)),
    holdCup: t < T_REL ? 1 : 0,
    sip: 0,
  };
};

// ---------------------------------------------------------------------------------------------------------------
// the robot's performance
const POSE_MISCHIEF: RobotPose = {...POSE_IDLE, mood: 0.78, eyeOpen: 1, lookX: 0, lookY: 0, headTilt: 7, headTurn: 0, glow: 1};
const robotPose = (t: number): RobotPose => {
  const widen = ss(t, 0.8, 0.94) * (1 - ss(t, 1.55, 1.85));
  const glance = ss(t, 0.98, 1.2) * (1 - ss(t, 1.64, 1.94));
  const smug = ss(t, 1.72, 2.02);
  let p = {...POSE_MISCHIEF};
  p = mixPose(p, {...p, eyeOpen: 1.36, mood: 0, lookY: -0.05, headTilt: 0}, widen);
  p.lookX = 1.0 * glance;
  p.lookY = lerp(p.lookY, -0.15, glance);
  p.headTurn = 0.95 * glance;
  p.headTilt = lerp(p.headTilt, -8, glance);
  p.lean = 7 * glance;
  p = mixPose(p, {...p, mood: 0.95, headTilt: 9, eyeOpen: 0.96, lookX: 0, headTurn: 0}, smug);
  // a blink as the eyes come back to the viewer
  const bl = Math.max(0, 1 - Math.abs(t - 1.88) / 0.07);
  p.eyeOpen = p.eyeOpen * (1 - 0.95 * bl);
  return p;
};
/** melt amount: holds ~0.4 (half liquid), surges on "MELTING" */
export const s1Melt = (t: number) => keyS(t, [[0, 0.385], [2.08, 0.415], [2.2, 0.46], [2.7, 0.7], [3.24, 0.74]]);

// arms: solve the shoulder/elbow angles so each mitten lands just outside its door bar (gripping it from behind).
// The rig relaxes the arms as the body melts (lerp to -4 deg with ss(m, .16, .48)); we pre-compensate that relax so the
// hands stay on the bars until the surge, where the relax is allowed to win (the arms slide off and fuse).
const relaxA = (m: number) => ss(m, 0.16, 0.48);
const solveArms = (base: RobotPose, x: number, y: number, s: number, m: number, tgtL: V, tgtR: V, grip: number): RobotPose => {
  const ra = relaxA(m);
  const k = Math.max(0.02, 1 - ra);
  // desired effective angles a (deg): pose angle so that lerp(pose, -4, ra) = a
  const toPose = (a: number) => (a + 4 * ra) / k;
  let aL = {sh: 70, el: 30}, aR = {sh: 70, el: 30};
  const pose = (L: {sh: number; el: number}, R: {sh: number; el: number}): RobotPose => ({
    ...base,
    lSh: lerp(base.lSh, toPose(L.sh), grip), lEl: lerp(base.lEl, toPose(L.el), grip),
    rSh: lerp(base.rSh, toPose(R.sh), grip), rEl: lerp(base.rEl, toPose(R.el), grip),
  });
  // a few Gauss-Newton steps with a numeric Jacobian (each side independent)
  for (let it = 0; it < 6; it++) {
    const h0 = robotHandScreen(x, y, s, pose(aL, aR), m);
    const e = 0.5;
    const hS = robotHandScreen(x, y, s, pose({sh: aL.sh + e, el: aL.el}, {sh: aR.sh + e, el: aR.el}), m);
    const hE = robotHandScreen(x, y, s, pose({sh: aL.sh, el: aL.el + e}, {sh: aR.sh, el: aR.el + e}), m);
    const step = (side: 'l' | 'r', a: {sh: number; el: number}, tg: V) => {
      const r = {x: tg.x - h0[side].x, y: tg.y - h0[side].y};
      const j11 = (hS[side].x - h0[side].x) / e, j21 = (hS[side].y - h0[side].y) / e;
      const j12 = (hE[side].x - h0[side].x) / e, j22 = (hE[side].y - h0[side].y) / e;
      const det = j11 * j22 - j12 * j21;
      if (Math.abs(det) < 1e-6) return a;
      let dSh = (j22 * r.x - j12 * r.y) / det, dEl = (-j21 * r.x + j11 * r.y) / det;
      const mx = Math.max(Math.abs(dSh), Math.abs(dEl));
      if (mx > 25) {
        dSh *= 25 / mx;
        dEl *= 25 / mx;
      }
      return {sh: clamp(a.sh + dSh, -10, 175), el: clamp(a.el + dEl, -20, 150)};
    };
    aL = step('l', aL, tgtL);
    aR = step('r', aR, tgtR);
  }
  return pose(aL, aR);
};

// ---------------------------------------------------------------------------------------------------------------
// the liquid on the floor: the stream from under the robot, through the gap, toward us; the leading pool
/** leading-edge advance (world units): surges at frame 0 and eases (flow speed ramp), then a second push on MELTING */
const lead = (t: number) => 1.3 * (1 - Math.exp(-t / 0.5)) + 0.32 * t + 1.2 * ss(t, 2.15, 2.9);
export const streamPath = (t: number) => {
  const a = lead(t);
  const tip = {x: -1.7 - 0.5 * a, d: -4.3 - 0.9 * a};
  return {pts: [{x: 0.2, d: 1.75}, {x: 0.08, d: 0.85}, {x: 0, d: 0}, {x: -0.38, d: -1.35}, {x: -1.05, d: -2.9}, tip], tip};
};
/** the liquid rides over the door's low sill (SILL_H 0.4 for |d| < 0.75) */
const SILL_TOP = 0.47;
export const streamH = (d: number) => SILL_TOP * ss(d, -1.15, -0.62);
export const streamWidth = (t: number) => {
  const surge = 1 + 0.16 * ss(t, 2.2, 2.8);
  return (u: number) => {
    // under the robot ~1.55, a neck at the gap (u ~ 0.27) that fits the 3.96 u clear gap, widening toward the pool
    const neck = Math.exp(-(((u - 0.27) / 0.13) ** 2));
    const w = lerp(1.6, 1.42, neck) * (u < 0.27 ? 1 : lerp(1, 1.3, clamp((u - 0.27) / 0.73)));
    const ends = Math.min(1, u / 0.04 + 0.7);
    return w * surge * clamp(ends, 0, 1);
  };
};
/** world.floorStream with a height profile (local copy: the module's stream lies flat on h = 0) */
export const streamRing = (c: Cam3, path: {x: number; d: number}[], width: (u: number) => number, t: number, hOf: (d: number) => number): V[] => {
  const segL: number[] = [];
  let L = 0;
  for (let i = 1; i < path.length; i++) {
    const l = Math.hypot(path[i].x - path[i - 1].x, path[i].d - path[i - 1].d);
    segL.push(l);
    L += l;
  }
  const at = (u: number) => {
    let sAcc = u * L;
    for (let i = 0; i < segL.length; i++) {
      if (sAcc <= segL[i] || i === segL.length - 1) {
        const k = segL[i] ? clamp(sAcc / segL[i]) : 0;
        return {x: path[i].x + (path[i + 1].x - path[i].x) * k, d: path[i].d + (path[i + 1].d - path[i].d) * k};
      }
      sAcc -= segL[i];
    }
    return path[path.length - 1];
  };
  const N = 64;
  const C0 = Array.from({length: N + 1}, (_, i) => at(i / N));
  const left: {x: number; d: number}[] = [], right: {x: number; d: number}[] = [];
  const nrm = (i: number) => {
    const a = C0[Math.max(0, i - 1)], b = C0[Math.min(N, i + 1)];
    const tx = b.x - a.x, td = b.d - a.d, tl = Math.hypot(tx, td) || 1;
    return {nx: -td / tl, nd: tx / tl, ux: tx / tl, ud: td / tl};
  };
  for (let i = 0; i <= N; i++) {
    const {nx, nd} = nrm(i);
    const u = i / N;
    const w = Math.max(0.02, width(u)) * (1 + 0.05 * Math.sin(u * 13 - t * 2.3));
    const wl = w * (1 + 0.05 * Math.sin(u * 19 + t * 2.1)), wr = w * (1 + 0.05 * Math.sin(u * 17 - t * 1.7 + 2));
    left.push({x: C0[i].x + nx * wl, d: C0[i].d + nd * wl});
    right.push({x: C0[i].x - nx * wr, d: C0[i].d - nd * wr});
  }
  const cap = (i: number, sign: number) => {
    const {nx, nd, ux, ud} = nrm(i);
    const w = Math.max(0.02, width(i / N));
    const out: {x: number; d: number}[] = [];
    for (let k = 1; k < 8; k++) {
      const th = (k / 8) * Math.PI;
      out.push({x: C0[i].x + nx * w * Math.cos(th) * sign + ux * sign * w * Math.sin(th), d: C0[i].d + nd * w * Math.cos(th) * sign + ud * sign * w * Math.sin(th)});
    }
    return out;
  };
  const ring = [...left, ...cap(N, 1), ...right.reverse(), ...cap(0, -1)];
  return ring.map((q) => {
    const p = project(c, {x: q.x, h: hOf(q.d), d: q.d});
    return {x: p.x, y: p.y};
  });
};
/** screen region nearer than the door sill's back edge (the liquid there lies in front of the bars) */
const nearRegion = (c: Cam3) => {
  const a = project(c, {x: -30, h: SILL_TOP, d: 0.8}), b = project(c, {x: 30, h: SILL_TOP, d: 0.8});
  const k = (b.y - a.y) / (b.x - a.x || 1e-6);
  const yAt = (x: number) => a.y + k * (x - a.x);
  return `M-300,${yAt(-300).toFixed(1)} L1380,${yAt(1380).toFixed(1)} L1380,2400 L-300,2400 Z`;
};

// ---------------------------------------------------------------------------------------------------------------
// cup flight (world space, world time)
type CupState = {p: P3; rot: number; spill: number; landed: boolean; k: number};
export const cupLaunch = (camAt: (t: number) => Cam3) => {
  const tr = T_REL;
  const c = camAt(tr);
  const gS = project(c, S1_GUARD);
  const tw = s1WorldTime(tr);
  const hand = guardCupHand(gS.x, gS.y, gS.s, s1GuardAct(tr), tw);
  // the hand is drawn on the guard's billboard plane; the physical cup starts on the same view ray, just in front of
  // him (d = S1_GUARD.d - 0.9). Its drawn size hands off from the billboard's scale (k0) to its true scale.
  const pb = screenToWorldAt(c, hand.x, hand.y, gS.z);
  const cam = {x: c.x, h: c.h, d: c.d};
  const dTarget = S1_GUARD.d - 0.9;
  const k = (dTarget - cam.d) / (pb.d - cam.d);
  const p0 = {x: cam.x + (pb.x - cam.x) * k, h: cam.h + (pb.h - cam.h) * k, d: dTarget};
  return {p0, rot0: hand.ang, tw0: tw, k0: gS.s / project(c, p0).s};
};
export const cupAt = (t: number, L: {p0: P3; rot0: number; tw0: number; k0: number}): CupState => {
  const tw = s1WorldTime(t), twL = s1WorldTime(T_LAND);
  const D = twL - L.tw0;
  const u = clamp((tw - L.tw0) / D);
  const tau = tw - L.tw0;
  // vertical: pops up ~3.4 u above the hand, falls to the floor at T_LAND
  const h0 = L.p0.h, apex = 1.1;
  const vz = (2 * apex * (1 + Math.sqrt(1 + h0 / apex))) / D; // h(D) = 0 with the apex `apex` above the hand
  const g = (vz * vz) / (2 * apex);
  const h = Math.max(0, h0 + vz * Math.min(tau, D) - 0.5 * g * Math.min(tau, D) ** 2);
  // horizontal: eases a touch (air drag) toward the landing point
  const uh = u * (1.15 - 0.15 * u);
  const p = {x: lerp(L.p0.x, S1_CUP_LAND.x, uh), h, d: lerp(L.p0.d, S1_CUP_LAND.d, uh)};
  return {p, rot: L.rot0 - 300 * tau - 60 * tau * tau, spill: clamp(tau / 0.25), landed: t >= T_LAND, k: lerp(L.k0, 1, ss(tau, 0, 0.45))};
};

// ---------------------------------------------------------------------------------------------------------------
// the full camera (pre-whip + whip following the cup)
export const camAt = (t: number): Cam3 => {
  const pre = preCam(t);
  if (t <= W0) return pre;
  const E = endCam();
  const w = ss5(t, W0, W1); // crane up and over toward the landing point (carries the track's velocity in)
  const pos = {x: lerp(pre.x, E.x, w), h: lerp(pre.h, E.h, w), d: lerp(pre.d, E.d, w)};
  // aim: from the face to the falling cup, then straight down on the landing point
  const L = cupLaunch(preCam);
  const cp = cupAt(Math.min(t, T_LAND), L).p;
  const wa = ss5(t, W0 - 0.06, W0 + 0.22);
  const tgt = {x: lerp(FACE.x, cp.x, wa), h: lerp(FACE.h, cp.h, wa), d: lerp(FACE.d, cp.d, wa)};
  const o = lookAt(pos, tgt);
  const k0 = ss5(t, W0, W0 + 0.16);
  let pitch = lerp(pre.pitch, o.pitch, k0);
  const kE = ss5(t, T_LAND - 0.1, W1);
  pitch = lerp(pitch, E.pitch, kE);
  // heading: one monotonic ease (a look-at yaw is unstable near pitch 90 and would spin the image)
  const yaw = lerp(pre.yaw, E.yaw, ss5(t, W0, W1));
  return {...pos, yaw, pitch, f: F};
};

// ---------------------------------------------------------------------------------------------------------------
// frame-0 values (exported for S8's loop match)
export const s1RobotFrame = (t: number) => {
  const c = camAt(t);
  const b = project(c, robotBaseAt(t));
  const m = s1Melt(t);
  const view = robotView(c);
  return {c, x: b.x, y: b.y, s: b.s, m, view};
};
const robotBaseAt = (t: number): P3 => ({...S1_ROBOT_BASE, d: S1_ROBOT_BASE.d - 0.35 * ss(t, 2.2, 2.9)});
const robotView = (c: Cam3) => clamp((c.pitch - 12) / 70);

/** the robot's eyes at film time t (S8 matches t = 0 exactly): screen centres, px per unit, squash and expression */
export const s1Eyes = (t = 0) => {
  const R = s1RobotFrame(t);
  const pose = robotPoseFull(t, R);
  const e = robotEyeScreen(R.x, R.y, R.s, pose, R.m, R.view);
  return {l: e.l, r: e.r, s: R.s, sx: eyeSxOf(R.m), sy: eyeSyOf(R.m), open: pose.eyeOpen, lookX: pose.lookX, lookY: pose.lookY, mood: pose.mood, glow: pose.glow, headTurn: pose.headTurn};
};

// replicas of the rig's eye squash (robot.tsx: rig() eyeSx / eyeSy) for the loop match
const mono = (xs: number[], ys: number[], x: number) => {
  const n = xs.length;
  if (x <= xs[0]) return ys[0] + (x - xs[0]) * ((ys[1] - ys[0]) / (xs[1] - xs[0]));
  if (x >= xs[n - 1]) return ys[n - 1] + (x - xs[n - 1]) * ((ys[n - 1] - ys[n - 2]) / (xs[n - 1] - xs[n - 2]));
  const d: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) {
      const tt = 3 / Math.sqrt(s);
      m[i] = tt * a * d[i];
      m[i + 1] = tt * b * d[i];
    }
  }
  let i = 0;
  while (i < n - 2 && x > xs[i + 1]) i++;
  const h = xs[i + 1] - xs[i], u = (x - xs[i]) / h;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
};
const curve = (m: number, ks: [number, number][]) => mono(ks.map((k) => k[0]), ks.map((k) => k[1]), clamp(m));
const latticeY = (m0: number) => {
  const m = clamp(m0);
  const ml = ss(m, 0.0, 0.3);
  const Lh = curve(m, [[0, 3.95], [0.1, 3.3], [0.2, 2.25], [0.3, 1.45], [0.45, 1.0], [0.65, 0.78], [0.85, 0.62], [1, 0.5]]);
  const Th = curve(m, [[0, 2.67], [0.2, 2.62], [0.32, 2.25], [0.45, 1.6], [0.6, 0.9], [0.8, 0.38], [1, 0.16]]);
  const Nh = 0.33 * (1 - ss(m, 0.22, 0.55));
  const Hh = curve(m, [[0, 3.05], [0.45, 3.0], [0.58, 2.7], [0.7, 2.05], [0.8, 1.5], [0.9, 1.05], [1, 0.72]]);
  const H0 = [0, 1.85, 3.95, 6.62, 6.95, 8.4, 10];
  const legLow = 1.85 / 3.95;
  const Yk = [0, Lh * lerp(legLow, 0.3, ml), Lh, Lh + Th, Lh + Th + Nh, Lh + Th + Nh + Hh * (1.45 / 3.05), Lh + Th + Nh + Hh];
  return (h: number) => mono(H0, Yk, h);
};
const eyeSyOf = (m: number) => {
  const Y = latticeY(m);
  return clamp((Y(8.2 + 0.05) - Y(8.2 - 0.05)) / 0.1, 0.5, 1);
};
const eyeSxOf = (m0: number) => {
  const m = clamp(m0);
  const mt = ss(m, 0.2, 0.62), mh = ss(m, 0.5, 0.86), mf = ss(m, 0.8, 1), ml = ss(m, 0, 0.3);
  const Sk = [1 + 1.25 * ml, 1 + 0.32 * ml, 1 + 0.12 * ml + 0.62 * mt, 1 - 0.12 * mt + 0.3 * mh, 1 - 0.05 * mt + 0.3 * mh, 1 + 0.34 * mh + 0.28 * mf, 1 + 0.12 * mh + 0.28 * mf];
  return clamp(mono([0, 1.85, 3.95, 6.62, 6.95, 8.4, 10], Sk, 8.2), 1, 1.22);
};

// the robot's full pose at t (expression + arms gripping the door bars)
const robotPoseFull = (t: number, R: {c: Cam3; x: number; y: number; s: number; m: number; view: number}): RobotPose => {
  const base = robotPose(t);
  const c = R.c;
  // grip targets: just outside each door bar, at ~h 4.3 (screen)
  const bL = project(c, {x: -2.6, h: 3.6, d: 0}), bR = project(c, {x: 2.6, h: 3.6, d: 0});
  const off = 0.62 + 0.25;
  const tgtL = {x: bL.x - off * bL.s, y: bL.y}, tgtR = {x: bR.x + off * bR.s, y: bR.y};
  const grip = 1 - ss(t, 2.12, 2.5);
  if (grip <= 0.001) return base;
  return solveArms(base, R.x, R.y, R.s, R.m, tgtL, tgtR, grip);
};

// ---------------------------------------------------------------------------------------------------------------
const f1 = (n: number) => n.toFixed(1);

export const S1View: React.FC<{t: number; debug?: boolean; dbg?: string}> = ({t, debug, dbg = ''}) => {
  const tw = s1WorldTime(t);
  const c = camAt(t);
  const R = s1RobotFrame(t);
  const pose = robotPoseFull(t, R);
  const m = R.m;
  const sw = alarmSweep(tw);
  const env: Env = {top: C.silverLit, bottom: C.navy2, tint: C.red, tintAmt: 0.1 + 0.32 * sw};
  // the jelly ripple through the body on MELTING (volume-preserving squash/stretch around the base)
  const rip = 0.11 * ring(t, 2.16, 3.0, 0.34) + 0.05 * ring(t, 2.46, 4.2, 0.26);
  // the melt surge glows: the wet melt front sweeps up the body warm (the heat that melts it)
  const heat = 0.85 * ss(t, 2.08, 2.25) * (1 - ss(t, 2.75, 3.0));
  // liquid on the floor: one stream (rides over the sill) + the leading pool
  const sp = streamPath(tw);
  const streamPts = streamRing(c, sp.pts, streamWidth(t), tw, streamH);
  const leadA = lead(tw);
  const blobPts = floorBlob(c, {x: sp.tip.x - 0.1, d: sp.tip.d - 0.2}, 2.05 + 0.22 * leadA, 1.5 + 0.12 * leadA, tw, 4);
  const pool = [streamPts, blobPts];
  const showRobot = true; // leaves the frame naturally through the whip (no pop)
  // guard
  const gS = project(c, S1_GUARD);
  const act = s1GuardAct(t);
  const showGuard = gS.z > 2;
  // cup
  const L = cupLaunch(preCam);
  const cup = cupAt(t, L);
  const cpS = project(c, cup.p);
  const splashOn = t >= T_LAND;
  const Ls = project(c, S1_CUP_LAND);
  const splashU = 0.85 * (1 - Math.pow(1 - clamp((t - T_LAND) / (T1 - T_LAND)), 1.6));
  const ids = {bm: uid('s1bm'), fc: uid('s1fc'), nc: uid('s1nc'), rg: uid('s1rg'), rr: uid('s1rr')};
  const W = 1080, H = 1920;
  // bars mask: hide the bars where the liquid lies in front of them (the liquid inside the near region)
  const nearD = nearRegion(c);
  // reflections in the pool: the door bars mirrored in the liquid (dark, fading with distance from the bar foot)
  const mirror = (x0: number, x1: number, h1: number) => {
    const a = project(c, {x: x0, h: 0, d: 0}), b = project(c, {x: x1, h: 0, d: 0});
    const a2 = project(c, {x: x0, h: -h1, d: 0}), b2 = project(c, {x: x1, h: -h1, d: 0});
    return {d: `M${f1(a.x)},${f1(a.y)} L${f1(b.x)},${f1(b.y)} L${f1(b2.x)},${f1(b2.y)} L${f1(a2.x)},${f1(a2.y)} Z`, y0: (a.y + b.y) / 2, y1: (a2.y + b2.y) / 2};
  };
  const refl = [-2.6, 2.6].map((bx) => mirror(bx - 0.62, bx + 0.62, 9));
  const gapM = mirror(-1.98, 1.98, 12);
  // flow streaks: short glints travelling along the stream centreline toward us
  const streaks: string[] = [];
  const pathPts = sp.pts.slice(2);
  const segLen: number[] = [];
  let Ltot = 0;
  for (let i = 1; i < pathPts.length; i++) {
    const l = Math.hypot(pathPts[i].x - pathPts[i - 1].x, pathPts[i].d - pathPts[i - 1].d);
    segLen.push(l);
    Ltot += l;
  }
  const along = (u: number) => {
    let s = clamp(u) * Ltot;
    for (let i = 0; i < segLen.length; i++) {
      if (s <= segLen[i] || i === segLen.length - 1) {
        const k = segLen[i] ? clamp(s / segLen[i]) : 0;
        return {x: lerp(pathPts[i].x, pathPts[i + 1].x, k), d: lerp(pathPts[i].d, pathPts[i + 1].d, k)};
      }
      s -= segLen[i];
    }
    return pathPts[pathPts.length - 1];
  };
  const flowPhase = 0.75 * tw + 1.1 * (1 - Math.exp(-tw / 0.45)) + 0.5 * ss(tw, 2.15, 2.9);
  for (let k = 0; k < 5; k++) {
    const u0 = ((flowPhase + k / 5) % 1) * 0.92;
    const off = [-0.55, 0.35, -0.1, 0.6, -0.35][k];
    const len = 0.1 + 0.04 * (k % 3);
    const fade = Math.sin(Math.PI * clamp(u0 / 0.92));
    const L2: string[] = [], R2: string[] = [];
    for (let j = 0; j <= 6; j++) {
      const uj = u0 + (len * j) / 6;
      const p = along(uj), pn = along(uj + 0.01);
      const tx = pn.x - p.x, td = pn.d - p.d, tl = Math.hypot(tx, td) || 1;
      const nx = -td / tl, nd = tx / tl;
      const w = 0.07 * Math.sin((Math.PI * j) / 6) * fade;
      const hh = streamH(p.d) + 0.06;
      const ql = project(c, {x: p.x + nx * (off + w), h: hh, d: p.d + nd * (off + w)});
      const qr = project(c, {x: p.x + nx * (off - w), h: hh, d: p.d + nd * (off - w)});
      L2.push(`${f1(ql.x)},${f1(ql.y)}`);
      R2.unshift(`${f1(qr.x)},${f1(qr.y)}`);
    }
    streaks.push(`M${L2.join('L')}L${R2.join('L')}Z`);
  }
  const ux = (u: number) => clamp(Math.sin(Math.PI * clamp(u)) * 1.4);
  void ux;
  // the robot group: jelly ripple about its base
  const rx = R.x, ry = R.y;
  const sx = 1 + rip, sy = 1 - rip;
  // the floor liquid must not ripple with the body: pre-apply the inverse of the group's squash to the pool outlines
  const poolLocal = pool.map((p) => p.map((q) => ({x: rx + (q.x - rx) / sx, y: ry + (q.y - ry) / sy})));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      <JailBack c={c} t={tw} alarm={1} />
      {showRobot && (
        <g transform={`translate(${f1(rx)} ${f1(ry)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${f1(-rx)} ${f1(-ry)})`}>
          <Robot x={rx} y={ry} s={R.s} t={t} pose={pose} melt={m} heat={heat} view={R.view} env={env} pool={poolLocal} eyesOnMelt={1} />
        </g>
      )}
      <defs>
        <clipPath id={ids.nc}>
          <path d={nearD} />
        </clipPath>
        <mask id={ids.bm} maskUnits="userSpaceOnUse" x={-200} y={-200} width={W + 400} height={H + 400}>
          <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#FFFFFF" />
          {showRobot && (
            <g clipPath={`url(#${ids.nc})`}>
              {pool.map((p, i) => (
                <path key={i} d={smoothPath(p)} fill="#000000" stroke="#000000" strokeWidth={6} strokeLinejoin="round" />
              ))}
            </g>
          )}
        </mask>
        <clipPath id={ids.fc}>
          {pool.map((p, i) => (
            <path key={i} d={smoothPath(p)} />
          ))}
        </clipPath>
        <linearGradient id={ids.rg} gradientUnits="userSpaceOnUse" x1="0" y1={f1(refl[0].y0)} x2="0" y2={f1(refl[0].y1)}>
          <stop offset="0" stopColor={C.navy0} stopOpacity={0.32} />
          <stop offset="0.5" stopColor={C.navy0} stopOpacity={0.1} />
          <stop offset="1" stopColor={C.navy0} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={ids.rr} gradientUnits="userSpaceOnUse" x1="0" y1={f1(gapM.y0)} x2="0" y2={f1(gapM.y1)}>
          <stop offset="0" stopColor={mix(C.red, '#FFFFFF', 0.25)} stopOpacity={0.5} />
          <stop offset="1" stopColor={C.red} stopOpacity={0} />
        </linearGradient>
      </defs>
      {!dbg.includes('nobars') && (
        <g mask={`url(#${ids.bm})`}>
          <Bars c={c} t={tw} door={0} alarm={1} />
        </g>
      )}
      {showRobot && !dbg.includes('noov') && (
        <g clipPath={`url(#${ids.fc})`}>
          <g clipPath={`url(#${ids.nc})`}>
            {refl.map((r, i) => (
              <path key={i} d={r.d} fill={`url(#${ids.rg})`} />
            ))}
          </g>
          <path d={streaks.join(' ')} fill="#FFFFFF" opacity={0.6} />
        </g>
      )}
      <AlarmBeacon c={c} t={tw} alarm={1} />
      {showGuard && !dbg.includes('noguard') && <Guard x={gS.x} y={gS.y} s={gS.s} t={tw} act={act} />}
      {splashOn && Ls.z > 0.5 && (
        <CoffeeSplash cx={Ls.x} cy={Ls.y} r={SPLASH_RW * Ls.s} u={splashU} view={1} />
      )}
      {t >= T_REL && !splashOn && cpS.z > 0.6 && <CoffeeCup x={cpS.x} y={cpS.y} s={cpS.s * cup.k} rot={cup.rot} spill={cup.spill} t={tw} />}
      {splashOn && Ls.z > 0.5 && (() => {
        // the cup ricochets off the floor and tumbles out of frame (lower right), leaving a clean round splash
        const k = (tw - s1WorldTime(T_LAND)) / 0.2;
        if (k > 1.2) return null;
        const r = SPLASH_RW * Ls.s;
        return <CoffeeCup x={Ls.x + r * (0.3 + 4.2 * k)} y={Ls.y + r * (0.15 + 2.6 * k + 1.2 * k * k)} s={Ls.s * (1 + 0.25 * k)} rot={cup.rot - 260 * k} empty />;
      })()}
      <JailFront c={c} t={tw} alarm={1} />
      <AlarmWash c={c} t={tw} alarm={1} />
      {debug && (
        <g>
          <text x={20} y={1880} fill="#FFD84A" fontSize={28} fontFamily="monospace">
            t {t.toFixed(3)} tw {tw.toFixed(3)} m {m.toFixed(3)} cam ({c.x.toFixed(1)},{c.h.toFixed(1)},{c.d.toFixed(1)}) yaw {c.yaw.toFixed(1)} pitch {c.pitch.toFixed(1)} s {R.s.toFixed(1)}
          </text>
          {(() => {
            const e = robotEyeScreen(R.x, R.y, R.s, pose, m, R.view);
            const hd = robotHeadScreen(R.x, R.y, R.s, pose, m, R.view);
            const gh = guardHead(gS.x, gS.y, gS.s, act, tw);
            return (
              <g>
                <circle cx={e.l.x} cy={e.l.y} r={4} fill="#FF00FF" />
                <circle cx={e.r.x} cy={e.r.y} r={4} fill="#FF00FF" />
                <circle cx={hd.cx} cy={hd.cy} r={hd.r} fill="none" stroke="#FF00FF" strokeDasharray="6 6" />
                <circle cx={gh.x} cy={gh.y} r={gh.r} fill="none" stroke="#00FF88" strokeDasharray="6 6" />
                <rect x={110} y={250} width={760} height={170} fill="none" stroke="#FFD84A" strokeDasharray="8 8" />
                <text x={20} y={1840} fill="#FFD84A" fontSize={28} fontFamily="monospace">
                  eyes L({e.l.x.toFixed(1)},{e.l.y.toFixed(1)}) R({e.r.x.toFixed(1)},{e.r.y.toFixed(1)}) head r {hd.r.toFixed(1)} guard head ({gh.x.toFixed(0)},{gh.y.toFixed(0)})
                </text>
              </g>
            );
          })()}
          {dbg.includes('poly') && pool.map((p, i) => <path key={'pp' + i} d={'M' + p.map((q) => `${f1(q.x)},${f1(q.y)}`).join('L') + 'Z'} fill="none" stroke={i ? '#00FF00' : '#FF00FF'} strokeWidth={2} />)}
          {splashOn && <circle cx={Ls.x} cy={Ls.y} r={SPLASH_RW * Ls.s} fill="none" stroke="#00FFFF" strokeDasharray="4 6" />}
        </g>
      )}
    </svg>
  );
};

export const S1: React.FC<{t: number}> = ({t}) => <S1View t={t} />;

// ---------------------------------------------------------------------------------------------------------------
// sound cues (film seconds). Words: This 0–.28 robot .28–.75 escaped .76–1.24 JAIL 1.24–1.61 | by 1.86 MELTING 2.135–2.87
export const CUES_S1 = (): {t: number; kind: string; gain?: number; dur?: number; pan?: number; variant?: number}[] => [
  {t: 0, kind: 'alarm', dur: 3.0}, // continues from the loop (no fade-in at t = 0)
  {t: 3.0, kind: 'alarm_tail', dur: 0.3}, // ends as S1 cuts to the calm, earlier S2
  {t: 0, kind: 'flow', dur: 1.7, gain: -2}, // the stream surging through the gap
  {t: 0.88, kind: 'mech_click', variant: 1, gain: -4}, // eyes widen
  {t: 1.04, kind: 'servo', gain: -6, dur: 0.22}, // the glance at the guard (head turn)
  {t: T_REL - 0.02, kind: 'cup_drop', gain: -2}, // the cup pops out of his fingers
  {t: 1.62, kind: 'guard_gasp'}, // his take, voiced in the pause after "JAIL"
  {t: T.melting - 0.04, kind: 'melt', dur: 0.95}, // the melt surge on "MELTING"
  {t: 2.78, kind: 'whoosh', dur: 0.4, gain: -2}, // the whip down after the cup
  {t: T_LAND, kind: 'splash'}, // coffee hits the floor (the cut lands on it)
];
void INK;
void mix;
void toCam;
void T0;
