// S2–S4: "Scientists locked it inside a tiny cage. / But instead of breaking the bars… It MELTED. / Its entire body turned
// into liquid metal. Then it slipped straight through the bars."
//
// ONE continuous camera for the three shots (3.24 → 13.55 s). The camera is a sum of overlapping C2 moves (ss5), each one
// motivated by the action, so velocity carries across every beat and no move ever stops dead:
//   SWING  (S2)  match-cut top-down on the robot's head → rises over the header → tilts to a frontal view of the cell
//   PUSH   (S2–S3) a slow push-in with a little lateral drift while the door slams, the robot walks, presses, melts
//   LOW    (S3–S4) the push continues LOW toward the floor, ending with the lens in the escape gap, just inside the cell
//   OUT    (S4)  "slipped": the liquid rushes at the lens; the camera backs out through the gap ahead of the leading
//                edge (crossing inside → outside), cranes up and tilts down onto the silver collecting in the corridor
// The camera is a look-at rig (position + target + focal), so the subject stays framed by construction.
//
// Layer order per frame: JailBack → (inside liquid / robot) → Bars → (liquid in front of the bar line, redrawn) →
// AlarmBeacon → guard → JailFront → AlarmWash → screen overlays (thermometer, grip, heat shimmer).
import React from 'react';
import {SHOTS, T} from '../story';
import {clamp, lerp, noise1, ring, ss, ss5} from '../lib';
import {BAR_R, BAR_XS, Cam3, DOOR, GUARD_AT, H, P3, W, project, toCam} from '../world';
import {C, INK, NS} from '../art/palette';
import {uid} from '../core/ids';
import {mix} from '../core/color';
import {POSE_ANNOYED, POSE_IDLE, POSE_SURPRISED, Robot, RobotPose, mixPose, robotHandScreen} from '../art/robot';
import {ENV_DEFAULT, Env, LiquidMetal, ShapeFilter, V, boxOf, puddleOutline, smoothPath} from '../art/liquid';
import {AlarmBeacon, AlarmWash, Bars, DOOR_D, FIXED_D, JailBack, JailFront, SILL_H, alarmSweep, polyD} from '../art/jail';
import {GUARD_IDLE, Guard, GuardAct} from '../art/guard';

type Cue = {t: number; kind: string; gain?: number; dur?: number; pan?: number; variant?: number};
type X3 = [number, number, number];

const f1 = (n: number) => n.toFixed(1);
const add3 = (a: X3, b: X3, k = 1): X3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const lerp3 = (a: X3, b: X3, u: number): X3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const bez3 = (p0: X3, p1: X3, p2: X3, p3: X3, u: number): X3 => {
  const a = 1 - u;
  const w = [a * a * a, 3 * a * a * u, 3 * a * u * u, u * u * u];
  return [0, 1, 2].map((i) => w[0] * p0[i] + w[1] * p1[i] + w[2] * p2[i] + w[3] * p3[i]) as X3;
};
/** inverse of the smoothstep x²(3-2x) on [0,1] */
const invSS = (u: number) => 0.5 - Math.sin(Math.asin(clamp(1 - 2 * u, -1, 1)) / 3);
const DEG = 180 / Math.PI;

// =====================================================================================================================
// CAMERA
// =====================================================================================================================
/** look-at camera: yaw/pitch from position → target (the rig always looks roughly toward +d) */
const lookAt = (p: X3, tg: X3, f: number): Cam3 => {
  const dx = tg[0] - p[0], dy = tg[1] - p[1], dd = tg[2] - p[2];
  const yaw = Math.abs(dd) < 1e-6 ? 0 : Math.atan(dx / dd);
  const fw = dx * Math.sin(yaw) + dd * Math.cos(yaw);
  const pitch = Math.atan2(-dy, fw);
  return {x: p[0], h: p[1], d: p[2], yaw: yaw * DEG, pitch: pitch * DEG, f};
};

// robot stand / walk (world): it stands at (0, 0, 4) in S2 (the match cut), two small steps bring it to the bars
const ROBOT_X = 0;
const D_START = 4.0, D_MID = 3.25, D_BARS = 2.5;
// the escaped liquid: where the silver collects outside (world floor)
const OUT_C = {x: 6.5, d: -7.4}; // toward the guard's feet

// moves (film seconds)
const SW0 = T.scientists - 0.02, SW1 = 4.75;            // swing: top-down → frontal
const PU0 = 4.35, PU1 = 9.0;                             // slow push-in while the door slams / walk / melt
const LO0 = 8.55, LO1 = 11.8;                            // low push toward the floor, in front of the escape gap
const OU0 = T.slipped - 0.16, OU1 = 13.38;               // out: back off + crane up with the leading edge
const LOW_P: X3 = [0.8, 4.3, -5.9], LOW_T: X3 = [0.1, 0.4, 3.0], LOW_F = 1000;
// REVEAL ("through the bars"): the crane-back widens onto the guard, whose face reads in frame while the silver crawls
// toward his shoes; then DOWN: he looks down and the camera tilts/pushes down with his gaze onto the puddle (S5 contract:
// the END pose puts the puddle at (540, 1040), 300 × 140 px, so the final lock is a near-identity)
const RV0 = 12.1, RV1 = 12.62, DN0 = 12.7, DN1 = 13.36;
const REV_P: X3 = [2.6, 8.6, -27.5], REV_T: X3 = [9.0, 10.4, -9.5], REV_F = 850;
const END_P: X3 = [6.5, 16.0, -18.6], END_T: X3 = [6.5, 0, -5.92], END_F = 1330;

export const camAt = (t: number): Cam3 => {
  // SWING: head-on top-down (contract: head circle centred (540, 980), r ≈ 150) → the camera backs out of the cell
  // through the OPEN doorway, under the top rail (the header wall above the bars would otherwise wipe across the
  // robot), tilting continuously to a frontal view. The focal length is set from the distance so the robot's on-screen
  // size shrinks monotonically (an even pull-back: 76.7 → 40 px per unit at the look-at point).
  const u1 = ss5(t, SW0, SW1);
  let p = bez3([0, 26, 4.26], [0, 20.5, 1.2], [0, 16.5, -16], [0, 9.6, -33.5], u1);
  let tg = lerp3([0, 8.4, 4.26], [0, 7.0, 4.0], u1);
  const sz = 76.7 * Math.pow(40 / 76.7, u1);
  let f = sz * Math.hypot(p[0] - tg[0], p[1] - tg[1], p[2] - tg[2]);
  // the door slam: a small motivated recoil (the heavy door hits the frame the camera hangs from)
  const kick = ring(t, T.cage, 6.5, 0.11);
  p = add3(p, [0, -0.1, 0], kick);
  tg = add3(tg, [0, -0.14, 0], kick);
  // PUSH: gentle push-in with a little lateral drift (to the left, so the bar the robot grabs stays clear of it)
  const u2 = ss5(t, PU0, PU1);
  p = add3(p, [-0.6, -3.4, 15.2], u2);
  tg = add3(tg, [-0.12, 0.1, -1.3], u2);
  // LOW: push low toward the floor, in front of the escape gap (the pool seen between the two door bars)
  const u3 = ss5(t, LO0, LO1);
  p = lerp3(p, LOW_P, u3);
  tg = lerp3(tg, LOW_T, u3);
  f = lerp(f, LOW_F, u3);
  // OUT: "slipped" — the silver rushes at the lens; the camera backs off and cranes up, keeping the LEADING EDGE in
  // frame as it crosses the bar line, then settles looking down on the puddle collecting in the corridor
  const u4 = ss5(t, OU0, RV1 + 0.12);
  if (u4 > 0) {
    // back out + crane up to the reveal, then (overlapping, so it never stops) on to the end pose
    p = bez3(p, add3(p, [0.3, 0.2, -3.6]), [REV_P[0] - 0.6, REV_P[1] - 2.2, REV_P[2] + 4.0], REV_P, u4);
    p = lerp3(p, END_P, ss5(t, DN0 - 0.12, DN1));
    const e = pathAt(edgeAt(t));
    const follow = ss(t, OU0, 12.25);
    const tE: X3 = [e.x, 0.25, e.d];
    tg = lerp3(lerp3(tg, tE, follow), REV_T, ss5(t, RV0, RV1));
    tg = lerp3(tg, END_T, ss5(t, DN0, DN1));
    f = lerp(lerp(f, REV_F, ss5(t, OU0, RV1)), END_F, ss5(t, DN0, DN1));
  }
  return lookAt(p, tg, f);
};

// =====================================================================================================================
// ROBOT PERFORMANCE
// =====================================================================================================================
type RobotState = {pose: RobotPose; melt: number; d: number; grip: number};

const k01 = (t: number, a: number, b: number) => ss(t, a, b);
/** a quick blink (0..1..0) centred at tc */
const blinkAt = (t: number, tc: number, w = 0.075) => clamp(1 - Math.abs(t - tc) / w);

export const robotAt = (t: number): RobotState => {
  // ---- S2: curious under the camera, follows the incoming door, flinches at the slam, bars, then us
  let P: RobotPose = {...POSE_IDLE};
  const sway = 0.5 * Math.sin(t * 2.1) + 0.3 * Math.sin(t * 3.3 + 1);
  P.headTilt = 2.5 * sway * ss(t, SW0 + 0.1, SW0 + 0.6); // exactly level on the match-cut frame
  P.lean = 0.6 * Math.sin(t * 1.7 + 0.4) * ss(t, SW0 + 0.1, SW0 + 0.6);
  // looks up at the camera while it is overhead (gaze follows the swing)
  const up = 1 - ss5(t, SW0 + 0.2, SW1);
  P.lookY = -0.6 * up;
  P.lookX = 0.12 * Math.sin(t * 2.6);
  // hears the door, turns to watch it come in from the right
  const door = doorAt(t);
  const watch = k01(t, 4.3, 4.5) * (1 - k01(t, T.cage + 0.02, T.cage + 0.18));
  const doorEdge = lerp(0.95, -0.2, ss(1 - door, 0.0, 1.0));
  P.headTurn = lerp(P.headTurn, 0.32 * doorEdge + 0.05, watch);
  P.lookX = lerp(P.lookX, 0.85 * doorEdge, watch);
  P.lookY = lerp(P.lookY, 0.08, watch);
  // flinch at the slam (arms up, eyes wide, a squash)
  const fl = k01(t, T.cage, T.cage + 0.07) * (1 - k01(t, T.cage + 0.32, T.cage + 0.62));
  P = mixPose(P, {...POSE_SURPRISED, headTilt: -3, lookX: 0, lookY: -0.05}, fl);
  P.bob += -0.07 * ring(t, T.cage, 3.2, 0.12);
  // looks at the bars (right, a little down), then at the viewer
  const atBars = k01(t, T.cage + 0.3, T.cage + 0.42) * (1 - k01(t, T.cage + 0.52, T.cage + 0.64));
  P.lookX = lerp(P.lookX, 0.75, atBars);
  P.lookY = lerp(P.lookY, 0.18, atBars);
  P.headTurn = lerp(P.headTurn, 0.22, atBars);
  const atUs = k01(t, T.cage + 0.52, T.cage + 0.64);
  P.mood = lerp(P.mood, -0.25, atUs * (1 - k01(t, 5.85, 6.0)));
  P.eyeOpen = lerp(P.eyeOpen, 1.12, atUs * (1 - k01(t, 5.95, 6.1)));
  // blinks
  P.eyeOpen *= 1 - 0.95 * Math.max(blinkAt(t, 3.78), blinkAt(t, 4.62), blinkAt(t, 5.78, 0.06));

  // ---- S3: two small steps up to the bars
  const st1 = k01(t, 5.9, 6.1), st2 = k01(t, 6.06, 6.27);
  const lift1 = Math.sin(Math.PI * clamp((t - 5.9) / 0.2)), lift2 = Math.sin(Math.PI * clamp((t - 6.06) / 0.21));
  P.lKnee += 48 * lift1;
  P.lHip += 6 * lift1;
  P.rKnee += 48 * lift2;
  P.rHip += 6 * lift2;
  P.lean += 3.2 * lift1 - 3.2 * lift2; // weight shifts onto the standing foot
  P.lSh += 10 * lift2 - 4 * lift1;
  P.rSh += 10 * lift1 - 4 * lift2;
  P.bob += 0.035 * (lift1 + lift2);
  const d = lerp(lerp(D_START, D_MID, st1), D_BARS, st2);
  // reach and press (hand on the bar at "breaking"), strain, nothing moves
  const reach = k01(t, 6.16, T.breaking - 0.02) * (1 - k01(t, T.bars1 + 0.06, T.bars1 + 0.32));
  const strain = k01(t, T.breaking + 0.05, T.breaking + 0.16) * (1 - k01(t, T.bars1 - 0.04, T.bars1 + 0.1));
  const trem = strain * (noise1(t * 16, 3) * 1.1);
  P.lean += reach * 2.5 + strain * (3.5 + trem);
  P.headTurn = lerp(P.headTurn, 0.3, reach);
  P.lookX = lerp(P.lookX, 0.8, reach);
  P.lookY = lerp(P.lookY, 0.05, reach);
  P.mood = lerp(P.mood, -0.45, strain);
  P.eyeOpen = lerp(P.eyeOpen, 0.72, strain);
  P.bob += -0.035 * strain;
  P.lSh = lerp(P.lSh, 18, strain);
  P.lEl = lerp(P.lEl, 30, strain);
  // annoyed at the viewer ("bars")
  const ann = k01(t, T.bars1 - 0.02, T.bars1 + 0.16) * (1 - k01(t, 7.95, 8.3));
  P = mixPose(P, {...POSE_ANNOYED, headTilt: POSE_ANNOYED.headTilt + sway, lookX: 0.05}, ann);
  P.reachX = 0; // set below (solved per frame so the hand lands on the bar)
  // the heat: glance down at the glowing floor, eyes widen, back to us
  const down = k01(t, 7.2, 7.32) * (1 - k01(t, 7.5, 7.62));
  P.lookY = lerp(P.lookY, 0.75, down);
  P.lookX = lerp(P.lookX, -0.15, down);
  const wide = k01(t, 7.3, 7.45);
  P.eyeOpen = lerp(P.eyeOpen, 1.3, wide);
  P.mood = lerp(P.mood, -0.2, wide);
  P.headTilt = lerp(P.headTilt, 0, wide * 0.7);
  // the melt: surprised, arms rise a little as the body sinks, eyes on us
  const mlt = k01(t, T.it2, T.melted + 0.2);
  P = mixPose(P, {...POSE_SURPRISED, lookY: 0.05, lookX: 0, eyeOpen: 1.3, mood: -0.1}, mlt * 0.85);
  P.eyeOpen *= 1 - 0.9 * blinkAt(t, 7.08, 0.06);
  const melt = clamp(0.2 * ss(t, T.it2, T.melted) + 0.75 * ss(t, T.melted, 8.6) + 0.05 * ss(t, 8.6, 9.05), 0, 1);
  return {pose: {...P, reachX: reach}, melt, d, grip: reach};
};

// the door (S2): 1 = open (slid right), 0 = shut. Accelerates in, hits on "cage", a small rebound.
export const doorAt = (t: number) => {
  const a = 4.38, b = T.cage;
  if (t < a) return 1;
  if (t < b) return 1 - Math.pow((t - a) / (b - a), 1.8);
  return 0.014 * Math.abs(ring(t, b, 4.5, 0.09));
};

// =====================================================================================================================
// LIQUID (S4)
// =====================================================================================================================
const OUT_RX = 4.4, OUT_RD = 2.5;
const IN_C = {x: 0, d: 3.15};
/** transfer of volume from the cell to the corridor: 0 → 1 */
const flowAt = (t: number) => ss(t, T.slipped - 0.05, 13.0);
/** leading edge along the escape path (0 inside → 1 at the outside puddle) */
const edgeAt = (t: number) => ss(t, T.slipped - 0.12, 12.75);

/** escape path (world floor): from the inside pool through the gap at x = 0, over the sill, into the corridor */
const PATH: {x: number; d: number}[] = [
  {x: 0, d: 2.7}, {x: 0, d: 1.2}, {x: 0, d: 0}, {x: 0.25, d: -1.5}, {x: 1.7, d: -3.6}, {x: 4.2, d: -5.8}, {x: OUT_C.x, d: OUT_C.d},
];
const pathLen = (() => {
  let L = 0;
  for (let i = 1; i < PATH.length; i++) L += Math.hypot(PATH[i].x - PATH[i - 1].x, PATH[i].d - PATH[i - 1].d);
  return L;
})();
const pathAt = (u: number) => {
  let s = clamp(u) * pathLen;
  for (let i = 1; i < PATH.length; i++) {
    const l = Math.hypot(PATH[i].x - PATH[i - 1].x, PATH[i].d - PATH[i - 1].d);
    if (s <= l || i === PATH.length - 1) {
      const k = l ? clamp(s / l) : 0;
      return {x: lerp(PATH[i - 1].x, PATH[i].x, k), d: lerp(PATH[i - 1].d, PATH[i].d, k)};
    }
    s -= l;
  }
  return PATH[PATH.length - 1];
};
/** sill height bump: the liquid rides up over the door's bottom rail */
const sillH = (d: number) => (SILL_H + 0.06) * clamp(1 - Math.abs(d) / 1.05) ** 0.6;

/** a stream along the escape path between ABSOLUTE path params u0..u1 (world), half width w(u) (absolute u), with a
 *  height profile over the sill. Samples sit on a fixed grid of the whole path, so any sub-range is the exact same
 *  outline (the front redraw over the sill uses a short sub-range). */
const U_GAP = 2.7 / pathLen; // the bar line (d = 0) along the path
const stream3 = (c: Cam3, u0: number, u1: number, width: (u: number) => number, t: number, hOff = 0): V[] => {
  if (u1 - u0 < 0.004) return [];
  const NA = 180;
  const us: number[] = [u0];
  for (let k = Math.floor(u0 * NA) + 1; k / NA < u1 - 1e-4; k++) us.push(k / NA);
  us.push(u1);
  const N = us.length - 1;
  const C0 = us.map((u) => pathAt(u));
  const left: P3[] = [], right: P3[] = [];
  for (let i = 0; i <= N; i++) {
    const a = C0[Math.max(0, i - 1)], b = C0[Math.min(N, i + 1)];
    const tx = b.x - a.x, td = b.d - a.d, tl = Math.hypot(tx, td) || 1;
    const nx = -td / tl, nd = tx / tl;
    const u = us[i];
    const w = Math.max(0.03, width(u)) * (1 + 0.06 * noise1(u * 7 - t * 1.6, 11));
    const wl = w * (1 + 0.05 * Math.sin(u * 19 + t * 2.3)), wr = w * (1 + 0.05 * Math.sin(u * 17 - t * 1.9 + 2));
    const q = C0[i];
    left.push({x: q.x + nx * wl, h: sillH(q.d + nd * wl) + hOff, d: q.d + nd * wl});
    right.push({x: q.x - nx * wr, h: sillH(q.d - nd * wr) + hOff, d: q.d - nd * wr});
  }
  const cap = (i: number, sign: number) => {
    const a = C0[Math.max(0, i - 1)], b = C0[Math.min(N, i + 1)];
    const tx = b.x - a.x, td = b.d - a.d, tl = Math.hypot(tx, td) || 1;
    const ux = (tx / tl) * sign, ud = (td / tl) * sign, nx = -td / tl, nd = tx / tl;
    const w = Math.max(0.03, width(us[i]));
    const out: P3[] = [];
    for (let k = 1; k < 8; k++) {
      const th = (k / 8) * Math.PI;
      const x = C0[i].x + nx * w * Math.cos(th) * sign + ux * w * Math.sin(th);
      const dd = C0[i].d + nd * w * Math.cos(th) * sign + ud * w * Math.sin(th);
      out.push({x, h: sillH(dd) + hOff, d: dd});
    }
    return out;
  };
  const ring3 = [...left, ...cap(N, 1), ...right.reverse(), ...cap(0, -1).reverse()];
  return ring3.map((q) => {
    const p = project(c, q);
    return {x: p.x, y: p.y};
  });
};

/** a puddle on the floor (world centre / radii), projected */
const blob = (c: Cam3, cx: number, cd: number, rx: number, rd: number, t: number, seed: number, n = 48, h = 0): V[] =>
  puddleOutline(cx, cd, rx, rd, t, seed, n).map((q) => {
    const p = project(c, {x: q.x, h, d: q.y});
    return {x: p.x, y: p.y};
  });

/** the robot's own melt-1 liquid silhouette (robot.tsx: puddle ring + dome, plus the collapsed body mound), in its
 *  billboard frame (x, y = feet base, s px/u, view): drawn with LiquidMetal it takes over from <Robot> invisibly */
const ROBOT_POOL_R = 5.2, ROBOT_POOL_PH = 0.6;
const robotPool = (x: number, y: number, s: number, view: number, t: number): V[][] => {
  const u = ss(clamp(view), 0, 1);
  const cv = Math.cos((u * Math.PI) / 2);
  const sc = (q: V): V => ({x: x + q.x * s, y: y - q.y * s});
  const pr = ROBOT_POOL_R, ry = pr * lerp(0.17, 0.97, u);
  const ring: V[] = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const w = 1 + 0.05 * Math.sin(2 * a + t * 0.9 + 1) + 0.035 * Math.sin(3 * a - t * 1.3) + 0.025 * Math.sin(5 * a + t * 1.7);
    ring.push(sc({x: Math.cos(a) * pr * w, y: Math.sin(a) * ry * w}));
  }
  const out = [ring];
  if (cv > 0.05) {
    const dome: V[] = [];
    const dw = pr * 0.9;
    for (let i = 0; i <= 24; i++) {
      const xx = -dw + (2 * dw * i) / 24;
      const k = 1 - (xx / dw) ** 2;
      dome.push(sc({x: xx, y: ROBOT_POOL_PH * Math.pow(Math.max(0, k), 0.55) * cv * (1 + 0.04 * Math.sin(xx * 2 + t * 2))}));
    }
    dome.push(sc({x: dw, y: -0.05}), sc({x: -dw, y: -0.05}));
    out.push(dome);
    // the collapsed body: a soft mound (≈ 1.35 u high, 2.7 u half-width)
    const mound: V[] = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const yy = Math.sin(a) > 0 ? 0.62 + 0.72 * Math.sin(a) : 0.62 + 0.62 * Math.sin(a);
      mound.push(sc({x: Math.cos(a) * 2.7, y: yy * cv}));
    }
    out.push(mound);
  }
  return out;
};

// =====================================================================================================================
// OVERLAYS
// =====================================================================================================================
/** small warm thermometer icon (screen px): the heat indicator */
const Thermo: React.FC<{x: number; y: number; k: number; level: number; t: number}> = ({x, y, k, level, t}) => {
  if (k <= 0.01) return null;
  const id = uid('thg');
  const h = 190, w = 34, br = 30;
  const top = y - h, lv = clamp(level);
  const fillTop = lerp(y - 12, top + 18, lv);
  const col = mix(C.yellow, C.heat, lv);
  const pulse = 0.5 + 0.5 * Math.sin(t * 9);
  return (
    <g opacity={k} transform={`translate(${f1(x)} ${f1(y)}) scale(${(0.75 + 0.25 * k).toFixed(3)}) translate(${f1(-x)} ${f1(-y)})`}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={C.heat} stopOpacity={0.5} />
          <stop offset="1" stopColor={C.heat} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y + 8} r={br * (2.4 + 0.3 * pulse * lv)} fill={`url(#${id})`} opacity={lv} />
      {/* tube + bulb */}
      <rect x={x - w / 2} y={top} width={w} height={h} rx={w / 2} fill="#F4F1EA" stroke={INK} strokeWidth={3} />
      <circle cx={x} cy={y + 8} r={br} fill="#F4F1EA" stroke={INK} strokeWidth={3} />
      {/* mercury */}
      <rect x={x - w / 2 + 8} y={fillTop} width={w - 16} height={y - fillTop + 8} rx={(w - 16) / 2} fill={col} />
      <circle cx={x} cy={y + 8} r={br - 8} fill={col} />
      <circle cx={x - 7} cy={y + 1} r={5} fill="#FFFFFF" opacity={0.75} />
      {/* ticks */}
      {[0.25, 0.45, 0.65, 0.85].map((q, i) => (
        <line key={i} x1={x + w / 2 - 1} x2={x + w / 2 + 12} y1={lerp(y - 12, top + 18, q)} y2={lerp(y - 12, top + 18, q)} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      ))}
      {/* warm "up" chevrons rising beside it */}
      {[0, 1].map((i) => {
        const ph = (t * 1.4 + i * 0.5) % 1;
        const cy = lerp(y - 40, top + 10, ph);
        return <path key={i} d={`M${x - w / 2 - 34},${cy + 10} L${x - w / 2 - 22},${cy} L${x - w / 2 - 10},${cy + 10}`} fill="none" stroke={col} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={lv * Math.sin(Math.PI * ph)} />;
      })}
    </g>
  );
};

/** the mitten wrapped round the front of the bar (the hand itself is behind the bar) */
const Grip: React.FC<{x0: number; x1: number; y: number; s: number; k: number}> = ({x0, x1, y, s, k}) => {
  if (k <= 0.02) return null;
  const id = uid('grp');
  const hgt = 0.62 * s, r = hgt * 0.45;
  const xa = x0 - 0.06 * s, xb = lerp(x0, x1, 0.82);
  return (
    <g opacity={clamp(k * 3)}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.silverLit} />
          <stop offset="0.45" stopColor={C.silver} />
          <stop offset="1" stopColor={C.silverDark} />
        </linearGradient>
      </defs>
      {[-1, 1].map((j) => (
        <rect key={j} x={xa} y={y + j * hgt * 0.5 - hgt * 0.5} width={xb - xa} height={hgt * 0.95} rx={r} fill={`url(#${id})`} stroke={INK} strokeWidth={1.8} />
      ))}
    </g>
  );
};

/** the header wall above the bars (x ±60, h 27.4–34, d 1–2.6), redrawn over the robot when the camera is high enough to
 *  look down past it: the module paints it inside JailBack (behind everything in the cell), which is right only for
 *  cameras below it. Drawn before Bars when the camera is in front of it (the top rail is then nearer), after Bars when
 *  the camera is above the cell (the rail is then farther). */
const HeaderOccluder: React.FC<{c: Cam3}> = ({c}) => {
  if (!(c.h > 27.4)) return null;
  const P = (x: number, h: number, d: number): P3 => ({x, h, d});
  const faces: {d: string; fill: string}[] = [];
  if (c.d > 2.6) faces.push({d: polyD(c, [P(-60, 27.4, 2.6), P(60, 27.4, 2.6), P(60, 34, 2.6), P(-60, 34, 2.6)]), fill: C.navy1});
  if (c.d < 1) faces.push({d: polyD(c, [P(-60, 27.4, 1), P(60, 27.4, 1), P(60, 34, 1), P(-60, 34, 1)]), fill: mix(C.wall, C.navy1, 0.35)});
  if (c.h > 34) faces.push({d: polyD(c, [P(-60, 34, 1), P(60, 34, 1), P(60, 34, 2.6), P(-60, 34, 2.6)]), fill: mix(C.navy2, C.navy1, 0.4)});
  return (
    <g>
      {faces.filter((q) => q.d).map((q, i) => <path key={i} d={q.d} fill={q.fill} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" vectorEffect={NS} />)}
    </g>
  );
};

/** the bars (and the top rail) reflected in the liquid in FRONT of them: mirror images below the floor plane, clipped
 *  to the merged liquid silhouette (same goo as LiquidMetal), so a flat pool reads as a mirror, not grey plastic */
const BarReflections: React.FC<{c: Cam3; pts: V[][]; px: number; k: number; door: number; alarm: number; t: number}> = ({c, pts, px, k, door, alarm, t}) => {
  const sets = pts.filter((q) => q.length > 2);
  if (k <= 0.01 || !sets.length) return null;
  const goo = clamp(px * 0.22, 1.5, 22);
  const b0 = boxOf(sets);
  const box = {x0: b0.x0 - goo * 3 - 8, y0: b0.y0 - goo * 3 - 8, x1: b0.x1 + goo * 3 + 8, y1: b0.y1 + goo * 3 + 8};
  const idS = uid('rfS'), idM = uid('rfM'), idG = uid('rfG');
  const ox = door * (DOOR.x1 - DOOR.x0);
  const bars = BAR_XS.map((x) => (x > DOOR.x0 && x < DOOR.x1 ? {x: x + ox, d: DOOR_D} : {x, d: FIXED_D}));
  const quads = bars.map((b) => polyD(c, [
    {x: b.x - BAR_R, h: 0, d: b.d}, {x: b.x + BAR_R, h: 0, d: b.d}, {x: b.x + BAR_R, h: -14, d: b.d}, {x: b.x - BAR_R, h: -14, d: b.d},
  ]));
  const glints = bars.map((b) => polyD(c, [
    {x: b.x - BAR_R * 0.55, h: 0, d: b.d - 0.1}, {x: b.x - BAR_R * 0.25, h: 0, d: b.d - 0.1}, {x: b.x - BAR_R * 0.25, h: -9, d: b.d - 0.1}, {x: b.x - BAR_R * 0.55, h: -9, d: b.d - 0.1},
  ]));
  const fade0 = project(c, {x: 0, h: 0, d: 0}), fade1 = project(c, {x: 0, h: -12, d: 0});
  const red = alarm * (0.3 + 0.7 * alarmSweep(t));
  return (
    <g opacity={k}>
      <defs>
        <ShapeFilter id={idS} box={box} goo={goo} />
        <mask id={idM} maskUnits="userSpaceOnUse" x={f1(box.x0)} y={f1(box.y0)} width={f1(box.x1 - box.x0)} height={f1(box.y1 - box.y0)}>
          <g filter={`url(#${idS})`}>{sets.map((q, i) => <path key={i} d={smoothPath(q)} fill="#FFFFFF" />)}</g>
        </mask>
        <linearGradient id={idG} gradientUnits="userSpaceOnUse" x1={f1(fade0.x)} y1={f1(fade0.y)} x2={f1(fade1.x)} y2={f1(fade1.y)}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0.45} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <mask id={idM + 'f'} maskUnits="userSpaceOnUse" x={f1(box.x0)} y={f1(box.y0)} width={f1(box.x1 - box.x0)} height={f1(box.y1 - box.y0)}>
          <rect x={f1(box.x0)} y={f1(box.y0)} width={f1(box.x1 - box.x0)} height={f1(box.y1 - box.y0)} fill={`url(#${idG})`} />
        </mask>
      </defs>
      <g mask={`url(#${idM})`}>
        <g mask={`url(#${idM + 'f'})`}>
          {quads.map((d, i) => d && <path key={i} d={d} fill={mix(C.navy1, C.redDeep, red * 0.5)} opacity={0.5} />)}
          {glints.map((d, i) => d && <path key={'g' + i} d={d} fill={mix(C.steelLit, C.redGlow, red)} opacity={0.35} />)}
        </g>
      </g>
    </g>
  );
};

/** chrome accents on the free pool (inside the cell): the room's dark horizon reflected across it (+ a thin bright
 *  floor-bounce line), and on "liquid metal" a bright glint sweeping across the surface; clipped to the merged
 *  silhouette (same goo as LiquidMetal) */
const PoolAccents: React.FC<{pts: V[][]; px: number; k: number; sweep: number}> = ({pts, px, k, sweep}) => {
  const sets = pts.filter((q) => q.length > 2);
  if (k <= 0.01 || !sets.length) return null;
  const goo = clamp(px * 0.22, 1.5, 22);
  const b0 = boxOf(sets);
  const box = {x0: b0.x0 - goo * 3 - 8, y0: b0.y0 - goo * 3 - 8, x1: b0.x1 + goo * 3 + 8, y1: b0.y1 + goo * 3 + 8};
  const idS = uid('paS'), idM = uid('paM'), idH = uid('paH'), idW = uid('paW');
  const w = b0.x1 - b0.x0, h = b0.y1 - b0.y0;
  const yb = b0.y0 + h * 0.36, hb = Math.max(3, h * 0.2);
  const gx = lerp(b0.x0 - w * 0.3, b0.x1 + w * 0.3, sweep);
  return (
    <g opacity={k}>
      <defs>
        <ShapeFilter id={idS} box={box} goo={goo} />
        <mask id={idM} maskUnits="userSpaceOnUse" x={f1(box.x0)} y={f1(box.y0)} width={f1(box.x1 - box.x0)} height={f1(box.y1 - box.y0)}>
          <g filter={`url(#${idS})`}>{sets.map((q, i) => <path key={i} d={smoothPath(q)} fill="#FFFFFF" />)}</g>
        </mask>
        <linearGradient id={idH} gradientUnits="userSpaceOnUse" x1="0" y1={f1(yb - hb)} x2="0" y2={f1(yb + hb)}>
          <stop offset="0" stopColor={C.navy2} stopOpacity={0} />
          <stop offset="0.45" stopColor={C.navy2} stopOpacity={0.5} />
          <stop offset="0.8" stopColor={C.navy2} stopOpacity={0.32} />
          <stop offset="1" stopColor={C.navy2} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={idW} gradientUnits="userSpaceOnUse" x1={f1(gx - w * 0.12)} y1="0" x2={f1(gx + w * 0.12)} y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.85} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
      </defs>
      <g mask={`url(#${idM})`}>
        <rect x={f1(b0.x0)} y={f1(yb - hb)} width={f1(w)} height={f1(hb * 2)} fill={`url(#${idH})`} />
        <path d={`M${f1(b0.x0 + w * 0.1)},${f1(yb + hb * 1.15)} Q${f1(b0.x0 + w * 0.5)},${f1(yb + hb * 1.45)} ${f1(b0.x1 - w * 0.1)},${f1(yb + hb * 1.15)}`} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(1.2, h * 0.03)} strokeLinecap="round" opacity={0.5} />
        {sweep > 0 && sweep < 1 && (
          <rect x={f1(gx - w * 0.12)} y={f1(b0.y0)} width={f1(w * 0.24)} height={f1(h)} fill={`url(#${idW})`} transform={`skewX(-28)`} style={{transformBox: 'fill-box', transformOrigin: 'center'}} opacity={Math.sin(Math.PI * sweep)} />
        )}
      </g>
    </g>
  );
};

/** screen-space half-plane nearer than the floor line d = d0 (assumes the camera is in front of it and above) */
const nearClip = (c: Cam3, d0: number, h = 0) => {
  const a = project(c, {x: -60, h, d: d0}), b = project(c, {x: 60, h, d: d0});
  const k = (b.y - a.y) / (b.x - a.x || 1e-6);
  const yAt = (x: number) => a.y + k * (x - a.x);
  return `M-300,${f1(yAt(-300))} L${W + 300},${f1(yAt(W + 300))} L${W + 300},${H + 600} L-300,${H + 600} Z`;
};

// =====================================================================================================================
// THE SCENE
// =====================================================================================================================
const placeRobot = (c: Cam3, x: number, d: number) => {
  const F = project(c, {x, h: 0, d});
  const Hd = project(c, {x, h: 8.4, d});
  const s = Hd.s;
  const cv = clamp((F.y - Hd.y) / (8.4 * s), 0, 1);
  const u = (Math.acos(cv) * 2) / Math.PI;
  return {x: lerp(Hd.x, F.x, cv), y: Hd.y + 8.4 * cv * s, s, view: invSS(u), F};
};

/** jail.tsx draws the guard desk lamp's warm floor pool (centre (20, 0, -14), screen blend ≈ 0.1 WARM over the corridor
 *  floor) with an affine linearisation that blows up as its centre nears the camera plane and is culled at z < 0.7:
 *  the floor brightened, then popped dark in one frame when this camera dollies past d ≈ -14 (9.87 s; again at ≈ 12.2 s
 *  on the way back). Where the module has culled it, this layer carries the same warm screen on the corridor floor and
 *  eases it out (or in, before it reappears) over ≈ 0.45 s, so the change is a fade, not a pop. */
const WARM_O: P3 = {x: 20, h: 0, d: -14};
const WARM_ZN = 0.7;
const warmOn = (t: number) => toCam(camAt(t), WARM_O).z >= WARM_ZN;
const WARM_X: number[] = (() => {
  const out: number[] = [];
  let prev = warmOn(SHOTS.S2[0]);
  for (let t = SHOTS.S2[0]; t <= SHOTS.S4[1]; t += 1 / 600) {
    const on = warmOn(t);
    if (on !== prev) out.push(t);
    prev = on;
  }
  return out;
})();
const warmFixAt = (t: number) => {
  if (warmOn(t)) return 0;
  let k = 0;
  for (const tc of WARM_X) k = Math.max(k, 1 - ss(Math.abs(t - tc), 0, 0.45));
  return k;
};
const WarmFix: React.FC<{c: Cam3; k: number}> = ({c, k}) => {
  if (k <= 0.004) return null;
  const d = polyD(c, [{x: -60, h: 0, d: -60}, {x: 60, h: 0, d: -60}, {x: 60, h: 0, d: 0}, {x: -60, h: 0, d: 0}]);
  if (!d) return null;
  return <path d={d} fill="#FFC56B" opacity={0.1 * k} style={{mixBlendMode: 'screen'}} />;
};

const alarmAt = (t: number) => ss(t, 12.38, 12.62);
// the induction coil: on at 7.0 (melts it), eased back once it is liquid (it only has to stay molten)
const heatAt = (t: number) => ss(t, 7.0, 7.65) * (1 - 0.55 * ss(t, 9.2, 10.4));

const Scene: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t);
  const R = robotAt(t);
  const door = doorAt(t);
  const shake = clamp(Math.exp(-(t - T.cage) / 0.32)) * (t >= T.cage ? 1 : 0);
  const alarm = alarmAt(t);
  const heat = heatAt(t);
  const sw = alarmSweep(t);
  const env: Env = {...ENV_DEFAULT, tint: C.red, tintAmt: alarm * (0.25 + 0.75 * sw)};

  // ---- robot (solid → melt) until the hand-off to free liquid
  const HAND = 9.15;
  const rb = placeRobot(c, ROBOT_X, R.d);
  // the startled hop at the slam (feet leave the floor for a few frames)
  const hop = 0.42 * Math.sin(Math.PI * clamp((t - T.cage - 0.02) / 0.26));
  rb.y -= hop * rb.s;
  let reachX = 0;
  let hand: {x: number; y: number} | null = null;
  let barSpan: {x0: number; x1: number} | null = null;
  if (R.grip > 0.001) {
    // solve reachX so the right mitten lands just left of the bar centre (it presses from inside the cell)
    const target = (rx: number) => {
      const hs = robotHandScreen(rb.x, rb.y, rb.s, {...R.pose, reachX: rx}, R.melt, rb.view);
      const hh = (rb.y - hs.r.y) / rb.s; // hand height (robot units ≈ world)
      const b0 = project(c, {x: 2.6 - BAR_R, h: hh, d: 0}), b1 = project(c, {x: 2.6 + BAR_R, h: hh, d: 0});
      return {hs, b0, b1};
    };
    let lo = 0, hi = 1;
    for (let i = 0; i < 14; i++) {
      const m = (lo + hi) / 2;
      const q = target(m);
      if (q.hs.r.x < lerp(q.b0.x, q.b1.x, 0.32)) lo = m;
      else hi = m;
    }
    reachX = ((lo + hi) / 2) * R.grip;
    const q = target(reachX);
    hand = q.hs.r;
    barSpan = {x0: q.b0.x, x1: q.b1.x};
  }
  const pose = {...R.pose, reachX};
  const showRobot = t < HAND + 0.3;
  const robotOp = 1 - ss(t, HAND + 0.1, HAND + 0.3); // the free liquid is already fully on top by then

  // ---- free liquid (S4). Hand-off: <Robot> (melt 1) → the same silhouette as free LiquidMetal (crossfade on identical
  // shapes), which then GATHERS into the world-space pool (perspective-correct, with a little thickness), streams
  // through the gap at x = 0 over the sill, and collects outside. Volume moves from the pool to the outside puddle.
  const fl = flowAt(t), ed = edgeAt(t);
  const gather = ss(t, 10.95, T.slipped);
  const liquidIn = t >= HAND;
  // two layers: INSIDE (pool + the stream up to just past the sill) is drawn before the bars; FRONT (the stream from
  // just behind the sill on + the outside puddle) after them, clipped to the near side of the floor line d = 0.8, so
  // the bars stand in front of the pool while the escaping silver flows over the sill and in front of everything
  const inside: V[][] = [], front: V[][] = [];
  let px = rb.s * 1.14;
  const U_A = 0.035, U_B = 0.36; // stream overlap of the two layers (d ≈ 1.8 … -2.0)
  if (liquidIn) {
    const vol = 1 - fl;
    // anticipation: before it slips, the pool draws itself together into a taller bead and leans toward the gap
    const rx = lerp(5.0, 3.5, gather) * Math.sqrt(Math.max(0.02, vol));
    const rd = lerp(2.4, 2.0, gather) * Math.sqrt(Math.max(0.02, vol));
    const cd = lerp(lerp(IN_C.d, 2.35, gather), 1.6, ss(fl, 0.35, 1));
    const thick = lerp(0.85, 1.3, gather) * Math.sqrt(Math.max(0.02, vol)); // gallium beads up: a thick, rounded pool
    const morph = ss(t, HAND + 0.25, 10.6); // billboard silhouette → world pool
    if (vol > 0.03) {
      const w0 = blob(c, IN_C.x, cd, rx, rd, t, 4, 40), w1 = blob(c, IN_C.x, cd, rx * 0.86, rd * 0.72, t, 4, 40, thick);
      if (morph < 1) {
        const rp = robotPool(rb.x, rb.y, rb.s, rb.view, t);
        inside.push(rp[0].map((q, i) => ({x: lerp(q.x, w0[i].x, morph), y: lerp(q.y, w0[i].y, morph)})));
        const cy = rb.y, cx = rb.x;
        const top = w1.reduce((m, q) => Math.min(m, q.y), 1e9);
        for (const sh of rp.slice(1)) {
          // dome / mound settle into the pool's raised top
          const k = 1 - morph;
          inside.push(sh.map((q) => ({x: cx + (q.x - cx) * (0.4 + 0.6 * k), y: lerp(Math.max(top, cy), q.y, k)})));
        }
        if (morph > 0) {
          inside.push(w1.map((q, i) => ({x: lerp(rp[0][i].x, q.x, morph), y: lerp(rp[0][i].y, q.y, morph)})));
          inside.push(blob(c, IN_C.x, cd, rx * 0.96, rd * 0.9, t, 4, 40, thick * 0.55 * morph));
        }
      } else {
        inside.push(w0, blob(c, IN_C.x, cd, rx * 0.96, rd * 0.9, t, 4, 40, thick * 0.55), w1);
      }
    }
    px = lerp(rb.s * 1.14, project(c, {x: 0, h: 0, d: cd}).s * 1.14, morph);
    // stream: tail at the pool, head = leading edge (two layers for thickness)
    if (ed > 0.001) {
      const tailU = clamp(ss(fl, 0.55, 1.0) * 0.98);
      const headU = clamp(ed);
      const wide = 1.55, neck = 1.42;
      const width = (uu: number) => {
        const gap = Math.exp(-(((uu - U_GAP) / 0.05) ** 2));
        const v = (uu - tailU) / Math.max(1e-3, headU - tailU);
        const ends = Math.min(1, v / 0.08, (1 - v) / 0.06);
        return (wide + (neck - wide) * gap) * (0.6 + 0.4 * clamp(ends)) * (0.7 + 0.3 * (1 - ss(fl, 0.7, 1)));
      };
      const piece = (u0: number, u1: number) => [stream3(c, u0, u1, width, t), stream3(c, u0, u1, (u) => width(u) * 0.8, t, 0.3)].filter((q) => q.length);
      inside.push(...piece(tailU, Math.min(headU, U_B)));
      front.push(...piece(Math.max(tailU, U_A), headU));
    }
    // the outside puddle IS the stream's head swelling (centred on the leading edge, so it never detaches)
    const outV = ss(ed, 0.55, 1) * (0.3 + 0.7 * fl);
    if (outV > 0.01) {
      const hp = pathAt(ed);
      const ox = lerp(hp.x, OUT_C.x, ss(ed, 0.85, 1)), od = lerp(hp.d, OUT_C.d, ss(ed, 0.85, 1));
      const k = Math.sqrt(outV);
      front.push(blob(c, ox, od, OUT_RX * k * 0.9, OUT_RD * k * 0.82, t, 7, 48, 0.45 * k));
      front.push(blob(c, ox, od, OUT_RX * k, OUT_RD * k, t, 7, 48));
    }
    px = lerp(px, project(c, {x: OUT_C.x, h: 0, d: OUT_C.d}).s * 1.14, ss(fl, 0.3, 1));
  }
  // the S4 → S5 contract: in the last frames the outside puddle IS puddleOutline(540, 1040, 300, 140, t, 7) — blend the
  // world puddle into it over 0.3 s, then draw exactly that (alone) with LiquidMetal
  const lockK = ss(t, 13.05, 13.35);
  const LOCK_T = 13.35 - 1e-6;
  let frontF = front;
  if (lockK > 0 && front.length) {
    const tgt = puddleOutline(540, 1040, 300, 140, t, 7, 48);
    const o = front[front.length - 1];
    const merged = o.map((q, i) => ({x: lerp(q.x, tgt[i].x, lockK), y: lerp(q.y, tgt[i].y, lockK)}));
    frontF = t >= LOCK_T ? [tgt] : [...front.slice(0, -1), merged];
  }
  // LiquidMetal's own default bevel for this outline (unit = 80 px) by the lock, so S5's first frame renders identically
  px = lerp(Math.min(px, 110), 80, lockK);
  const outF = t >= LOCK_T ? frontF : frontF.slice(Math.max(0, frontF.length - 2)); // the outside puddle (reflections)
  const refK = ss(t, 12.88, 13.15);
  const rip = ripplAt(t);
  const clipId = uid('s4clip');
  const pxL = t >= LOCK_T ? undefined : px;
  // the free pool reflects the dim cell (a cooler, darker top than the robot's chrome), eased in after the hand-off
  const envL: Env = {...env, top: mix(C.silverLit, C.steelLit, 0.45 * ss(t, 9.5, 10.5))};

  // ---- guard
  const g = project(c, GUARD_AT);
  // he hears the alarm and sees the silver crawling at him: a recoil, a frozen stare (with a glance at us: "did you see
  // that?"), then he looks down at it — the camera follows his gaze down
  const gAct: GuardAct = {
    ...GUARD_IDLE,
    look: lerp(lerp(lerp(-0.35, -0.7, ss(t, 12.14, 12.32)), -0.12, ss(t, 12.44, 12.56)), -0.45, ss(t, 12.68, 12.9)),
    stare: ss(t, 12.28, 12.5),
    shock: ss(t, 12.16, 12.3) * (1 - ss(t, 12.5, 12.9)) * 0.8,
    lookDown: ss(t, 12.66, 13.1) * 0.85,
    sip: 0,
    holdCup: 1,
  };
  const showGuard = g.z > 3 && g.x > -400 && g.x < W + 600 && t > 10.5;

  // ---- overlays
  const thermoK = ss(t, 7.0, 7.22) * (1 - ss(t, 8.35, 8.6));
  const thermoLv = ss(t, 7.05, 7.9);
  const head = project(c, {x: ROBOT_X, h: 8.4, d: R.d});

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <JailBack c={c} t={t} alarm={alarm} heat={heat} door={door} />
      <WarmFix c={c} k={warmFixAt(t)} />
      {showRobot && (
        <Robot x={rb.x} y={rb.y} s={rb.s} t={t} pose={pose} melt={R.melt} heat={heat} view={rb.view} env={env} opacity={robotOp} />
      )}
      {liquidIn && inside.length > 0 && (
        <LiquidMetal pts={inside} t={t} env={envL} ripple={rip} px={pxL} opacity={ss(t, HAND, HAND + 0.12)} />
      )}
      {liquidIn && inside.length > 0 && <PoolAccents pts={inside} px={px} k={ss(t, HAND + 0.2, HAND + 0.8) * (1 - ss(t, 11.75, 12.2))} sweep={clamp((t - (T.liquid - 0.12)) / 0.6)} />}
      {c.d <= 1.8 && <HeaderOccluder c={c} />}
      <Bars c={c} t={t} door={door} alarm={alarm} shake={shake * 0.8} />
      {c.d > 1.8 && <HeaderOccluder c={c} />}
      {liquidIn && frontF.length > 0 && (
        <g clipPath={inside.length ? `url(#${clipId})` : undefined}>
          {inside.length > 0 && (
            <defs>
              <clipPath id={clipId}>
                <path d={nearClip(c, 0.75, SILL_H + 0.02)} />
              </clipPath>
            </defs>
          )}
          <LiquidMetal pts={frontF} t={t} env={envL} ripple={rip} px={pxL} />
          <BarReflections c={c} pts={outF} px={px} k={refK} door={door} alarm={alarm} t={t} />
        </g>
      )}
      {hand && barSpan && <Grip x0={barSpan.x0} x1={barSpan.x1} y={hand.y} s={rb.s} k={R.grip} />}
      <AlarmBeacon c={c} t={t} alarm={alarm} />
      {showGuard && <Guard x={g.x} y={g.y} s={g.s} t={t} act={gAct} />}
      <JailFront c={c} t={t} alarm={alarm} />
      <AlarmWash c={c} t={t} alarm={alarm} />
      <Thermo x={head.x + 3.6 * head.s + 30} y={head.y + 2.6 * head.s} k={thermoK} level={thermoLv} t={t} />
    </svg>
  );
};
const ripplAt = (t: number) => (0.2 + 0.8 * ss(t, T.liquid - 0.1, T.liquid + 0.08)) * (1 - ss(t, T.metalE, 11.6)); // settled (0) before the stream starts

export const S2: React.FC<{t: number}> = ({t}) => <Scene t={t} />;
export const S3: React.FC<{t: number}> = ({t}) => <Scene t={t} />;
export const S4: React.FC<{t: number}> = ({t}) => <Scene t={t} />;

// =====================================================================================================================
// SOUND (film seconds; kinds from tools/sfx_lib.py)
// =====================================================================================================================
export const CUES_S2 = (): Cue[] => [
  {t: SW0 + 0.3, kind: 'swish', gain: -3, dur: 0.6},          // the camera rises off the head and swings round
  {t: 4.3, kind: 'servo', gain: -4},                           // head turns toward the door
  {t: 4.4, kind: 'door_slide', dur: T.cage - 4.4},             // the barred door rolls in from the right
  {t: T.cage, kind: 'door_slam'},                              // SLAM on "cage"
  {t: T.cage + 0.08, kind: 'mech_click', variant: 2, gain: -2}, // the robot's flinch
  {t: T.cageE + 0.05, kind: 'mech_click', variant: 1, gain: -4}, // looks at the bars, then us
];
export const CUES_S3 = (): Cue[] => [
  {t: 5.92, kind: 'mech_click', variant: 0, gain: -3},          // step
  {t: 6.1, kind: 'mech_click', variant: 3, gain: -3},           // step
  {t: 6.3, kind: 'bar_tap'},                                    // hand on the bar (just before "breaking")
  {t: 6.42, kind: 'servo', gain: -2, dur: 0.4},                 // strain: nothing moves
  {t: T.bars1 + 0.03, kind: 'mech_click', variant: 1, gain: -3}, // annoyed turn to us
  {t: 7.0, kind: 'heat_coil', dur: 1.6},                        // the induction coil under the floor powers up
  {t: 7.04, kind: 'pop', gain: -4},                             // the thermometer icon pops in
  {t: T.it2 - 0.03, kind: 'melt', dur: 1.2},                     // feet go, then the body collapses on "MELTED"
];
export const CUES_S4 = (): Cue[] => [
  {t: 10.36, kind: 'drip', gain: -4},                           // the pool shivers (just before "liquid")
  {t: 11.7, kind: 'flow', dur: 1.5},                            // slipping through the gap
  {t: 12.38, kind: 'alarm', dur: 0.95},                         // the escape trips the alarm (fades out by the cut)
  {t: 13.33, kind: 'guard_gulp', gain: -2},                     // the guard, after "bars."
];
