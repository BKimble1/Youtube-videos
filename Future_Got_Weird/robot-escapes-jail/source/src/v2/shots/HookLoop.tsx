// H1 (0-3.40) THE HOOK and J1 (27.90-32.40) THE LOOP (owner A). Jail dramatization of the V2 robot (robot2).
//
// ONE loop clock. Both shots are driven by the LOOP TIME tau: H1 uses tau = t, J1 uses tau = t - DUR (so J1's last frame
// is tau = -1/30 and the next frame, frame 0, is tau = 0). Everything that has to flow across the loop cut is a single
// function of tau shared by both shots: the camera spline (J1's approach keys and H1's hook keys are ONE Catmull-Rom
// spline, so position, direction and velocity carry through the cut), the robot's base / pose / state (the face press,
// the softening and the squeeze progress are one smooth curve through tau = 0), the alarm's beacon phase and level, and
// the chrome wobble clock. Nothing is reset at the cut; frame 0 is simply the next frame of J1's push.
//
// H1 beats (film t = tau):
//   0.00  ECU (3/4 from the left, high): the robot grips the two door bars either side of the escape gap, its face already
//         pressed and bulging into the too-narrow gap (head soft, squeeze begun)          [squeeze + tension]
//   0.35  head and shoulders liquid, the face stretched through the neck, metal pours out of the gap; the camera cranes
//         up and left so inside -> neck -> outside reads left to right                    [stream]
//   0.85  the whole body squeezes through, collects in a lump on the corridor floor
//   1.42  the last of it leaves the gap ("JAIL" 1.24-1.61)                                [escape]
//   1.42-1.76 the body rises and the head SNAPS into its exact shape, eyes straight at us [reform -> snap 1.75]
//   1.76-1.90 deadpan hold, one blink                                                     [mech_click 1.84]
//   1.90-2.78 pull back ("by MELTING"): the robot outside, the cell door still shut with its big padlock, silver
//         smears on the two bars and a residue on the sill, the red beacon sweeping
//   2.78-3.30 a glint runs over the robot's dome, the camera is drawn into the reflection: the head's surface becomes the
//         full-frame chrome                                                               [glint 2.90, enter 3.24]
//   3.30-3.40 exactly <ChromeSurface t={t}/> (contract H1 -> LB)
//
// J1 beats (film t):
//   27.90 shape match: the robot's head centred (540, 900), r = 130 px, framed in the escape gap (contract FU -> J1)
//   27.95-28.95 ("So apparently...") pull back + crane: the robot back in its cell, whose security has been absurdly
//         escalated (a heavy chain across the door, a hanging cluster of padlocks ending in one comically
//         huge padlock, a heap of spare chain); the guard in the corridor foreground, deadpan, sipping his coffee
//   28.22-28.95 the robot's half-lidded glance at the guard / padlocks, then (28.95) its deadpan look back at us                                      [comic]
//   29.35-30.25 ("Even prison bars") it marches up to the bars                            [mech_click steps]
//   30.30 ("can't") it grips the same two bars                                            [bar_tap]
//   30.9-31.5 ("a robot anymore") one last deadpan look at the camera; 31.0-31.85 the camera pushes into frame 0's
//         framing and the face presses into the gap
//   31.80 the alarm trips and the squeeze begins: the last frame flows into frame 0      [alarm, tension]
import React from 'react';
import {C, INK} from '../../art/palette';
import {mix} from '../../core/color';
import {uid} from '../../core/ids';
import {clamp, DUR, keyS, lerp, ss, ss5} from '../../lib';
import {Cam3, P3, project} from '../../world';
import {AlarmBeacon, AlarmWash, alarmSweep, Bars, JailBack, JailFront} from '../../art/jail';
import {Guard, GuardAct, GUARD_IDLE} from '../../art/guard';
import {POSE_IDLE, RobotPose} from '../../art/robot';
import {ChromeBody, ChromeSurface} from '../liquid/Chrome';
import {Prim3, projectPrims} from '../liquid/sdf';
import {camLook, HERO, HERO_BASE, HERO_CAM_KEYS, HERO_OUT_POSE, heroPose, R2, Robot2, Robot2Base, Robot2Pose, robot2Rig, Robot2State, snapEase, splineKeys} from '../robot2';
import {Tag} from '../Tag';
import {SHOTS2} from '../story2';

export type Cue = {t: number; kind: string; gain?: number; dur?: number; pan?: number; variant?: number};

const f1 = (n: number) => n.toFixed(1);
const P = (x: number, h: number, d: number): P3 => ({x, h, d});
const lerp3 = (a: P3, b: P3, u: number): P3 => ({x: lerp(a.x, b.x, u), h: lerp(a.h, b.h, u), d: lerp(a.d, b.d, u)});

/** loop time of a film time in J1 (tau < 0) */
export const loopTau = (t: number) => t - DUR;

// =====================================================================================================================
// THE ROBOT through the loop (tau in [-4.5, 3.4])
// =====================================================================================================================
const S = HERO.s;
/** where it stands in its cell at the start of J1 (deep in the cell, behind the escape gap) */
const J1_HOME: P3 = {x: 0, h: 0, d: 6.5};
const T_WALK0 = 29.36 - DUR, T_WALK1 = 30.22 - DUR; // the march to the bars (tau)
const T_GRIP0 = 30.12 - DUR, T_GRIP1 = 30.34 - DUR; // hands up onto the two bars
const STEPS = 3;

/** squeeze progress through the loop: the face is pressed in J1, the flow starts in J1's last 0.6 s and runs on in H1
 *  (one C1 curve through tau = 0: no stall at the cut) */
const KU: [number, number][] = [[-0.62, 0], [0, 0.07], [0.35, 0.2], [0.75, 0.55], [1.18, 1]];
export const loopU = (tau: number) => clamp(splineKeys(tau, KU));
const T_REFORM0 = 1.18, T_REFORM1 = 1.7;

/** the robot's base, pose and state at loop time tau (H1: tau = t, J1: tau = t - DUR) */
const j1Pose = (tau: number): RobotPose => {
  const w = ss(tau, T_WALK0, T_WALK1);
  // walk: knees alternate (a frontal march toward us), body bobs and waddles
  const ph = w * STEPS * Math.PI;
  const walking = ss(tau, T_WALK0 - 0.04, T_WALK0 + 0.1) * (1 - ss(tau, T_WALK1 - 0.12, T_WALK1));
  const kneeL = walking * 34 * Math.max(0, Math.sin(ph)), kneeR = walking * 34 * Math.max(0, -Math.sin(ph));
  // deadpan: half-lidded eyes; glances right at the padlocks / guard during the reveal, then straight at us (28.95)
  const lookAway = ss(tau, 28.22 - DUR, 28.5 - DUR) * (1 - ss(tau, 28.78 - DUR, 28.98 - DUR));
  const blink = Math.max(0, 1 - Math.abs(tau - (29.12 - DUR)) / 0.07);
  const det = ss(tau, T_WALK0 - 0.15, T_WALK0 + 0.1); // determination as it sets off
  return {
    ...POSE_IDLE,
    lookX: 0.62 * lookAway,
    lookY: 0.05 * lookAway,
    headTurn: 0.16 * lookAway,
    headTilt: -3 * (1 - lookAway) * (1 - det),
    eyeOpen: lerp(lerp(0.66, 0.78, lookAway), 0.95, det) * (1 - 0.92 * blink),
    mood: lerp(-0.35, -0.1, det),
    lean: walking * 2.5 * Math.sin(ph),
    bob: walking * 0.035 * Math.abs(Math.cos(ph)),
    lSh: 9 + walking * 10 * Math.max(0, -Math.sin(ph)),
    rSh: 9 + walking * 10 * Math.max(0, Math.sin(ph)),
    lEl: 6 + walking * 14,
    rEl: 6 + walking * 14,
    lKnee: kneeL,
    rKnee: kneeR,
    lHip: 3 + kneeL * 0.12,
    rHip: 3 + kneeR * 0.12,
  };
};

/** the robot's base, pose and state at loop time tau (H1: tau = t, J1: tau = t - DUR) */
export const loopRobot = (tau: number): {base: Robot2Base; pose: Robot2Pose; state: Robot2State} => {
  const hp = heroPose(0);
  if (tau >= 0) {
    // Robot2 draws the eyes' EXPRESSION from `pose` (outPose only shapes the reformed body), so the reformed robot's look
    // (eyes to camera, the deadpan blink, the smug lids, the shut-eyed dive) is blended into the pose here
    const op = outPose(tau);
    const k = ss(tau, T_REFORM0 + 0.22, T_REFORM1);
    const pose: Robot2Pose = {...hp, eyeOpen: lerp(hp.eyeOpen, op.eyeOpen, k), mood: lerp(hp.mood, op.mood, k), lookX: lerp(hp.lookX, op.lookX, k), lookY: lerp(hp.lookY, op.lookY, k)};
    return {base: HERO_BASE, pose, state: hookState(tau)};
  }
  const w = ss(tau, T_WALK0, T_WALK1);
  const base: Robot2Base = {...lerp3(J1_HOME, HERO_BASE, w), s: S};
  if (tau < T_GRIP0) return {base, pose: j1Pose(tau), state: {}};
  // the grip, then the press (one curve with the hook through tau = 0)
  const g = ss(tau, T_GRIP0, T_GRIP1);
  const pose: Robot2Pose = {...hp, ...mixP(j1Pose(tau), hp, ss(tau, T_GRIP0 - 0.02, T_GRIP1 + 0.45)), gripL: hp.gripL, gripR: hp.gripR, grip: g};
  // "a robot anymore": one last deadpan, slightly smug look at us (the camera, screen-left), then eyes front, wide, and
  // the face goes into the gap (exactly heroPose(0) from tau = -0.45 on)
  const look = ss(tau, 30.82 - DUR, 31.02 - DUR) * (1 - ss(tau, 31.5 - DUR, 31.95 - DUR));
  pose.lookX = lerp(pose.lookX, -0.42, look);
  pose.lookY = lerp(pose.lookY, 0.04, look);
  pose.eyeOpen = lerp(pose.eyeOpen, 0.6, look);
  pose.mood = lerp(pose.mood, 0.15, look);
  pose.headTilt = lerp(pose.headTilt, -5, look);
  return {base, pose, state: hookState(tau)};
};
const hookState = (tau: number): Robot2State => ({
  // press: the face pushes into the gap ("a robot anymore")
  press: ss(tau, 30.95 - DUR, 31.85 - DUR),
  // frame 0 is still a clean robot silhouette (head only just softening where the face presses into the gap); the head
  // goes liquid over the first 0.4 s, the shoulders / arms by 0.5 s, the legs by 0.75 s
  soften: {head: clamp(splineKeys(tau, KSOFT)), upper: ss(tau, 0.1, 0.5), lower: ss(tau, 0.1, 0.45)},
  squeeze: {gap: HERO.gap, out: HERO.out, u: loopU(tau), outPose: outPose(tau)},
  reform: keyS(tau, [[T_REFORM0, 0], [T_REFORM1, 1]], (x) => 0.5 * x + 0.5 * x * x * (3 - 2 * x)),
});
const KSOFT: [number, number][] = [[-0.45, 0], [0, 0.18], [0.2, 0.62], [0.4, 1]];

const mixP = (a: RobotPose, b: RobotPose, u: number): RobotPose => {
  const o = {...a} as Record<string, number>;
  for (const k of Object.keys(b) as (keyof RobotPose)[]) {
    const va = (a[k] as number | undefined) ?? 0, vb = (b[k] as number | undefined) ?? 0;
    if (typeof vb === 'number') o[k] = lerp(va, vb, u);
  }
  return o as unknown as RobotPose;
};

/** the reformed robot's pose outside: eyes straight at us, one deadpan blink in the hold, a hint of smugness while the
 *  camera pulls back, then a squint as the camera is drawn into its dome */
const T_BLINK = 1.76;
const outPose = (tau: number): Robot2Pose => {
  const blink = Math.max(0, 1 - Math.abs(tau - T_BLINK) / 0.06);
  const smug = ss(tau, 1.95, 2.4);
  return {
    ...HERO_OUT_POSE,
    // ...and as the camera dives into its dome it shuts its eyes in smug content (no cyan left to ghost under the surface)
    eyeOpen: lerp(1.05, 0.92, smug) * (1 - 0.95 * blink) * (1 - 0.9 * ss(tau, 2.8, 3.02)),
    mood: lerp(0.35, 0.85, smug),
    headTilt: 4 * smug - 4 * ss(tau, 2.62, 3.0),
  };
};

// =====================================================================================================================
// THE CAMERA through the loop: one C1 spline over tau
// =====================================================================================================================
type CK = {t: number; p: P3; at: P3; f: number};
/** the shape-match key (tau = 27.90 - DUR): solved so the robot's head is centred (540, 900) with r = 130 px */
const MATCH = {x: 540, y: 900, r: 130};
const T_J0 = SHOTS2.J1[0] - DUR;
const matchKey = (): CK => {
  const {base, pose, state} = loopRobot(T_J0);
  const rig = robot2Rig(base, pose, state, T_J0);
  const hc = rig.head.c;
  const p = P(hc.x, hc.h + 0.4, -16.5);
  let at = {...hc};
  let f = 1000;
  for (let i = 0; i < 6; i++) {
    const cam = camLook(p, at, f);
    const s = project(cam, hc);
    const r = R2.headHW * rig.s * s.s;
    at = {...at, h: at.h - (s.y - MATCH.y) / s.s};
    f *= MATCH.r / r;
  }
  return {t: T_J0, p, at, f};
};
const T_PUSH0 = 2.52, T_PUSH1 = 3.3;
export const F0_KEY: CK = {t: 0, p: P(-2.6, 15.8, -8.0), at: P(0.3, 11.3, -0.5), f: 1240};
let KEYS_CACHE: CK[] | null = null;
const camKeys = (): CK[] => {
  if (KEYS_CACHE) return KEYS_CACHE;
  const hk = HERO_CAM_KEYS;
  const m = matchKey();
  KEYS_CACHE = [
    m,
    // "So apparently...": pull back and arc left: the escalated door, the padlocks, the guard deadpan in the foreground
    {t: 28.9 - DUR, p: P(-5.6, 12.6, -25), at: P(5.9, 10.3, 0), f: 1030},
    {t: 29.35 - DUR, p: P(-5.4, 12.7, -22.8), at: P(4.3, 10.5, 0), f: 1050},
    // the march: the camera pushes in with it (the guard slides out past the right edge)
    {t: 30.3 - DUR, p: P(-4.4, 13.9, -15.8), at: P(0.8, 10.8, 0.4), f: 1110},
    {t: 31.2 - DUR, p: P(-3.4, 14.9, -11.2), at: P(0.4, 10.9, -0.3), f: 1200},
    // frame 0: a 3/4 ECU from the left, a touch high: the face squeezing into the gap between the two gripped bars
    F0_KEY,
    // the crane up and left with the flow (inside -> neck -> outside reads left to right): the engine's hook keys,
    // retimed to the faster squeeze (it is through by 1.18)
    {...hk[1], t: 0.35},
    {t: 0.75, p: P(-4.5, 17.3, -11.3), at: P(0.8, 6.3, -1.9), f: 960},
    // follow the material down into the lump as it collects outside
    {t: 1.12, p: P(-3.3, 13.4, -14.0), at: P(1.3, 4.6, -3.4), f: 960},
    // rise with it as it stands up, swinging round in front of it (eyes to camera at the snap, 1.64)
    {t: 1.46, p: P(-1.0, 11.4, -16.9), at: P(1.9, 9.9, -5.0), f: 1110},
    {t: 1.7, p: P(1.2, 11.3, -17.6), at: P(2.0, 9.9, -5.2), f: 1215},
    // a breath of settle in the deadpan hold, then the pull back on "by MELTING"
    {t: 1.84, p: P(1.75, 11.35, -18.1), at: P(2.0, 10.1, -5.2), f: 1215},
    {t: T_PUSH0, p: P(4.6, 14.4, -29), at: P(3.7, 9.4, -4.5), f: 1150},
  ];
  return KEYS_CACHE;
};
const spl3 = (t: number, keys: [number, P3][]): P3 => ({
  x: splineKeys(t, keys.map(([a, b]) => [a, b.x] as [number, number])),
  h: splineKeys(t, keys.map(([a, b]) => [a, b.h] as [number, number])),
  d: splineKeys(t, keys.map(([a, b]) => [a, b.d] as [number, number])),
});

/** the point on the reformed robot's dome the camera is drawn into (world) and its head centre */
const DOME_AIM = 0.42;
const domePoint = () => {
  const {base, pose, state} = loopRobot(2.6);
  const rig = robot2Rig(base, pose, state, 2.6);
  const c = rig.head.c;
  return {c, F: P(c.x, c.h + DOME_AIM * S, c.d - 0.6 * S)};
};
let DOME: ReturnType<typeof domePoint> | null = null;
export const loopCam = (tau: number): Cam3 => {
  const K = camKeys();
  if (tau <= T_PUSH0) {
    const p = spl3(tau, K.map((k) => [k.t, k.p] as [number, P3]));
    const a = spl3(tau, K.map((k) => [k.t, k.at] as [number, P3]));
    const f = splineKeys(tau, K.map((k) => [k.t, k.f] as [number, number]));
    return camLook(p, a, f);
  }
  // the push into the dome: log-distance eased (drawn in, decelerating onto the surface)
  DOME = DOME ?? domePoint();
  const k = K[K.length - 1];
  const F = DOME.F;
  const e = ss5(tau, T_PUSH0, T_PUSH1);
  const e2 = ss5(tau, T_PUSH0, T_PUSH1 - 0.08);
  const d0 = Math.hypot(k.p.x - F.x, k.p.h - F.h, k.p.d - F.d);
  const d1 = 1.15;
  const dist = Math.exp(lerp(Math.log(d0), Math.log(d1), e));
  // approach direction swings from the wide camera's to straight-on (slightly from above)
  const dw = {x: (k.p.x - F.x) / d0, h: (k.p.h - F.h) / d0, d: (k.p.d - F.d) / d0};
  const dn = {x: 0, h: 0.18, d: -1};
  const nl = Math.hypot(dn.x, dn.h, dn.d);
  const dir = {x: lerp(dw.x, dn.x / nl, e2), h: lerp(dw.h, dn.h / nl, e2), d: lerp(dw.d, dn.d / nl, e2)};
  const dl = Math.hypot(dir.x, dir.h, dir.d);
  const p = P(F.x + (dir.x / dl) * dist, F.h + (dir.h / dl) * dist, F.d + (dir.d / dl) * dist);
  const at = lerp3(k.at, F, e2);
  return camLook(p, at, lerp(k.f, 1180, e2));
};

// =====================================================================================================================
// ALARM through the loop (beacon phase on tau, so the sweep is continuous across the cut)
// =====================================================================================================================
const ALARM_ON = 31.8 - DUR;
const alarmLevel = (tau: number) => (tau < 0 ? 0.7 * ss(tau, ALARM_ON - 0.05, ALARM_ON + 0.35) : 0.7 * (1 - ss(tau, 3.0, 3.3)));
const envOf = (tau: number, al: number) => ({tint: C.red, amt: al * (0.22 + 0.22 * alarmSweep(tau))});

// =====================================================================================================================
// SET DRESSING (local art in the jail world)
// =====================================================================================================================
/** a brass padlock hanging at world point p (top of the shackle), size k (world units of body width), swing angle */
const Padlock: React.FC<{c: Cam3; p: P3; k: number; rot?: number; tone?: number}> = ({c, p, k, rot = 0, tone = 0}) => {
  const q = project(c, p);
  if (q.z < 0.6) return null;
  const s = q.s * k;
  const id = uid('pl');
  const brass = mix('#C9A043', '#9C8A6A', tone), brassLit = mix('#F4D77A', '#D6CBB4', tone), brassDk = mix('#7A5A1E', '#55493A', tone);
  const w = 1.0 * s, h = 0.82 * s, sh = 0.62 * s;
  const lw = Math.max(1.2, 0.07 * s);
  return (
    <g transform={`rotate(${f1(rot)} ${f1(q.x)} ${f1(q.y)})`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={brassLit} />
          <stop offset="0.45" stopColor={brass} />
          <stop offset="1" stopColor={brassDk} />
        </linearGradient>
      </defs>
      {/* shackle */}
      <path d={`M${f1(q.x - 0.3 * s)},${f1(q.y + sh)} L${f1(q.x - 0.3 * s)},${f1(q.y + 0.3 * s)} A${f1(0.3 * s)},${f1(0.3 * s)} 0 0 1 ${f1(q.x + 0.3 * s)},${f1(q.y + 0.3 * s)} L${f1(q.x + 0.3 * s)},${f1(q.y + sh)}`}
        fill="none" stroke={INK} strokeWidth={f1(0.15 * s + 2 * lw)} strokeLinecap="round" />
      <path d={`M${f1(q.x - 0.3 * s)},${f1(q.y + sh)} L${f1(q.x - 0.3 * s)},${f1(q.y + 0.3 * s)} A${f1(0.3 * s)},${f1(0.3 * s)} 0 0 1 ${f1(q.x + 0.3 * s)},${f1(q.y + 0.3 * s)} L${f1(q.x + 0.3 * s)},${f1(q.y + sh)}`}
        fill="none" stroke={C.steelLit} strokeWidth={f1(0.15 * s)} strokeLinecap="round" />
      {/* body */}
      <rect x={f1(q.x - w / 2)} y={f1(q.y + sh)} width={f1(w)} height={f1(h)} rx={f1(0.16 * s)} fill={`url(#${id})`} stroke={INK} strokeWidth={f1(lw)} />
      <rect x={f1(q.x - w / 2 + 0.1 * s)} y={f1(q.y + sh + 0.08 * s)} width={f1(w * 0.36)} height={f1(h * 0.18)} rx={f1(0.05 * s)} fill="#FFFFFF" opacity={0.45} />
      <circle cx={f1(q.x)} cy={f1(q.y + sh + h * 0.45)} r={f1(0.09 * s)} fill={INK} />
      <path d={`M${f1(q.x)},${f1(q.y + sh + h * 0.45)} L${f1(q.x)},${f1(q.y + sh + h * 0.72)}`} stroke={INK} strokeWidth={f1(Math.max(1, 0.07 * s))} strokeLinecap="round" />
    </g>
  );
};

/** a chain along a world polyline: alternating face-on rings and edge-on links */
const Chain: React.FC<{c: Cam3; pts: P3[]; link?: number}> = ({c, pts, link = 0.62}) => {
  // resample the polyline at link spacing
  const seg: {p: P3; ang: number; s: number}[] = [];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const L = Math.hypot(b.x - a.x, b.h - a.h, b.d - a.d);
    while (acc <= L) {
      const p = lerp3(a, b, acc / L);
      const qa = project(c, a), qb = project(c, b);
      seg.push({p, ang: (Math.atan2(qb.y - qa.y, qb.x - qa.x) * 180) / Math.PI, s: 0});
      acc += link * 0.5;
    }
    acc -= L;
  }
  const out: React.ReactNode[] = [];
  seg.forEach((g, i) => {
    const q = project(c, g.p);
    if (q.z < 0.6) return;
    const s = q.s;
    const lw = Math.max(1, 0.06 * s);
    if (i % 2 === 0)
      out.push(
        <g key={i} transform={`rotate(${f1(g.ang)} ${f1(q.x)} ${f1(q.y)})`}>
          <ellipse cx={f1(q.x)} cy={f1(q.y)} rx={f1(link * 0.55 * s)} ry={f1(link * 0.33 * s)} fill="none" stroke={INK} strokeWidth={f1(0.13 * s + 2 * lw)} />
          <ellipse cx={f1(q.x)} cy={f1(q.y)} rx={f1(link * 0.55 * s)} ry={f1(link * 0.33 * s)} fill="none" stroke={C.steel} strokeWidth={f1(0.13 * s)} />
          <path d={`M${f1(q.x - link * 0.4 * s)},${f1(q.y - link * 0.22 * s)} Q${f1(q.x)},${f1(q.y - link * 0.38 * s)} ${f1(q.x + link * 0.36 * s)},${f1(q.y - link * 0.24 * s)}`} fill="none" stroke={C.steelLit} strokeWidth={f1(Math.max(0.8, 0.05 * s))} strokeLinecap="round" />
        </g>,
      );
    else
      out.push(
        <g key={i} transform={`rotate(${f1(g.ang)} ${f1(q.x)} ${f1(q.y)})`}>
          <rect x={f1(q.x - link * 0.55 * s)} y={f1(q.y - 0.1 * s)} width={f1(link * 1.1 * s)} height={f1(0.2 * s)} rx={f1(0.1 * s)} fill={mix(C.steel, C.steelDark, 0.4)} stroke={INK} strokeWidth={f1(lw)} />
        </g>,
      );
  });
  return <g>{out}</g>;
};

/** a sagging chain between two world points (catenary-ish) */
const sagPts = (a: P3, b: P3, sag: number, n = 10): P3[] =>
  Array.from({length: n + 1}, (_, i) => {
    const u = i / n;
    const p = lerp3(a, b, u);
    return {...p, h: p.h - sag * 4 * u * (1 - u)};
  });

/** the escalated security (J1): a heavy chain across the top of the door, a chain down to a cluster of padlocks hanging
 *  from the lock box, a heap of spare chain. All of it sits OUTSIDE
 *  frame 0's framing (frame 0 sees the two gripped bars from h ~ 3 to ~ 17 only). */
const Escalation: React.FC<{c: Cam3; tau: number}> = ({c, tau}) => {
  // the padlocks were just added: they still swing a little (decaying), the cluster settles during the reveal
  const sw = (i: number) => 9 * Math.exp(-(tau - T_J0) / 1.4) * Math.sin(2 * Math.PI * (1.1 + 0.13 * i) * (tau - T_J0) + i * 1.7);
  const topA = P(-10.6, 21.2, -0.95), topB = P(10.6, 21.2, -0.95);
  const top = sagPts(topA, topB, 1.6, 16);
  // the chain from the top chain's left end down the left stile, wrapped around it, to a cluster of padlocks
  const drop = [P(10.4, 21.0, -0.95), P(10.6, 17.5, -1.0), P(9.9, 16.4, -1.3), P(10.8, 15.8, -1.3), P(9.9, 15.2, -1.3), P(9.5, 14.3, -1.5)];
  const LX = 9.45;
  const locks: {p: P3; k: number; tone: number}[] = [
    {p: P(LX, 13.9, -1.55), k: 1.25, tone: 0},
    {p: P(LX - 0.7, 12.65, -1.6), k: 0.95, tone: 0.6},
    {p: P(LX + 0.6, 12.4, -1.62), k: 1.05, tone: 0.2},
    {p: P(LX - 0.1, 11.3, -1.66), k: 1.15, tone: 0.8},
    {p: P(LX - 0.95, 10.6, -1.68), k: 0.85, tone: 0.3},
    {p: P(LX + 0.65, 10.3, -1.7), k: 0.9, tone: 0.5},
    {p: P(LX - 0.15, 9.35, -1.72), k: 1.0, tone: 0.1},
    // ...and one comically huge padlock at the bottom of the bunch
    {p: P(LX + 0.1, 8.55, -1.95), k: 2.9, tone: 0},
  ];
  // heap of chain at the foot of the door (left)
  const heap: P3[] = [];
  for (let i = 0; i <= 26; i++) {
    const a = i * 0.55;
    const r = 1.5 - i * 0.04;
    heap.push(P(-7.4 + r * Math.cos(a), 0.25 + i * 0.045, -4.6 + 0.55 * r * Math.sin(a)));
  }
  // top chain across: wraps behind each door bar (tiny dips)
  return (
    <g>
      <Chain c={c} pts={heap} link={0.62} />
      <Chain c={c} pts={top} link={0.68} />
      <Chain c={c} pts={drop} link={0.62} />
      {locks.map((l, i) => <Padlock key={i} c={c} p={l.p} k={l.k} rot={sw(i)} tone={l.tone} />)}
    </g>
  );
};

/** the cell door's ordinary padlock (H1: "the cell still locked") */
const DoorPadlock: React.FC<{c: Cam3}> = ({c}) => <Padlock c={c} p={P(9.45, 13.2, -1.5)} k={2.1} />;

/** silver smears left on the two bars and the sill by the squeeze: a film wiped down the gap-side face of each bar from
 *  where the hands melted on it (grip height), born under the melting hand, then slowly running down into a drip that
 *  stays attached to the bar (one continuous streak, never a loose drop) */
const Smears: React.FC<{c: Cam3; tau: number}> = ({c, tau}) => {
  const born = ss(tau, 0.42, 0.66);
  if (born <= 0.01) return null;
  const prims: Prim3[] = [];
  for (const side of [-1, 1]) {
    const x = side * (HERO.barX - 0.42);
    const dd = -0.42;
    const top = HERO.gripH + 0.35 + 0.25 * side;
    // the film runs down (decelerating), the drip at its foot swells a little as it collects
    const run = 1 - (1 - ss(tau, 0.42, 1.9 + 0.2 * side)) ** 2;
    const len = 0.3 + (2.8 + 0.6 * side) * run;
    const w = 0.12 * born;
    prims.push({k: 'cap3', a: P(x, top, dd), b: P(x, top - len, dd), ra: w * 1.0, rb: w * 1.35});
    prims.push({k: 's', p: P(x, top - len - 0.05, dd - 0.02), r: w * (1.5 + 0.25 * run)});
  }
  // a little residue on the sill where it poured over
  const g = ss(tau, 0.55, 1.25);
  if (g > 0.01) prims.push({k: 'disc3', p: P(0.5, 0.42, -0.95), rx: 1.3 * g, rd: 0.45 * g, flat: 1} as Prim3);
  const pr = projectPrims(c, prims);
  const o = project(c, P(0, 10, -0.4));
  return <ChromeBody prims={pr} blend={0.12 * o.s} R={0.25 * o.s} specs={1} />;
};

/** a soft contact shadow under a standing robot */
const FootShadow: React.FC<{c: Cam3; at: P3; k: number}> = ({c, at, k}) => {
  if (k <= 0.01) return null;
  const o = project(c, at);
  if (o.z < 0.6) return null;
  const a = project(c, P(at.x - 2.4, 0, at.d)), b = project(c, P(at.x + 2.4, 0, at.d));
  const n = project(c, P(at.x, 0, at.d - 1.3)), fr = project(c, P(at.x, 0, at.d + 1.3));
  const id = uid('fs');
  return (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor="#050A14" stopOpacity={0.55 * k} />
          <stop offset="0.6" stopColor="#050A14" stopOpacity={0.25 * k} />
          <stop offset="1" stopColor="#050A14" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={f1(o.x)} cy={f1(o.y)} rx={f1(Math.abs(b.x - a.x) / 2)} ry={f1(Math.max(2, Math.abs(n.y - fr.y) / 2))} fill={`url(#${id})`} />
    </g>
  );
};

// =====================================================================================================================
// THE JAIL FRAME (shared by H1 and J1)
// =====================================================================================================================
const GUARD_J1: P3 = P(7.8, 0, -13);

export type FrameOv = {cam?: Cam3; state?: Partial<Robot2State>};
export const JailFrame: React.FC<{tau: number; escalated: boolean; guard?: {p: P3; act: GuardAct; t: number} | null; ov?: FrameOv}> = ({tau, escalated, guard, ov}) => {
  const c = ov?.cam ?? loopCam(tau);
  const lr = loopRobot(tau);
  const {base, pose} = lr;
  const state = {...lr.state, ...(ov?.state ?? {})};
  const al = alarmLevel(tau);
  const env = envOf(tau, al);
  const sq = state.squeeze;
  const standOut = sq && sq.u >= 1 ? ss(state.reform ?? 0, 0.3, 1) : 0;
  const standIn = sq ? 1 - ss(sq.u, 0.0, 0.5) : 1;
  const gS = guard ? project(c, guard.p) : null;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
      <JailBack c={c} t={tau} alarm={al} />
      <FootShadow c={c} at={P(base.x, 0, base.d)} k={standIn} />
      <Robot2 cam={c} t={tau} base={base} pose={pose} state={state} part="back" d0={0} env={env} />
      <Bars c={c} t={tau} door={0} alarm={al} />
      {escalated ? <Escalation c={c} tau={tau} /> : <DoorPadlock c={c} />}
      {!escalated && <Smears c={c} tau={tau} />}
      {sq && <FootShadow c={c} at={P(HERO.out.x, 0, HERO.out.d)} k={standOut} />}
      <Robot2 cam={c} t={tau} base={base} pose={pose} state={state} part="front" d0={0} env={env} />
      <AlarmBeacon c={c} t={tau} alarm={al} />
      {guard && gS && gS.z > 3 && <Guard x={gS.x} y={gS.y} s={gS.s} t={guard.t} act={guard.act} />}
      <JailFront c={c} t={tau} alarm={al} />
      <AlarmWash c={c} t={tau} alarm={al} />
    </svg>
  );
};

// =====================================================================================================================
// H1
// =====================================================================================================================
/** the dome's screen superellipse (for the surface hand-off) */
const domeScreen = (c: Cam3, tau: number) => {
  const {base, pose, state} = loopRobot(tau);
  const rig = robot2Rig(base, pose, state, tau);
  const q = project(c, rig.head.c);
  const s = q.s * rig.s;
  return {x: q.x, y: q.y, rx: R2.headHW * s, ryT: R2.headTop * s, ryB: R2.headBot * s, eyeY: project(c, rig.eyes.l).y, s: q.s};
};
const supPath = (cx: number, cy: number, rx: number, ryT: number, ryB: number, nT: number, nB: number, k = 1) => {
  const pts: string[] = [];
  const N = 72;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const n = sa < 0 ? nT : nB, ry = sa < 0 ? ryT : ryB;
    const x = cx + k * rx * Math.sign(ca) * Math.abs(ca) ** (2 / n);
    const y = cy + k * ry * Math.sign(sa) * Math.abs(sa) ** (2 / n);
    pts.push(`${f1(x)},${f1(y)}`);
  }
  return 'M' + pts.join('L') + 'Z';
};

const T_SURF = 3.3;
const T_GLINT0 = 2.55;
const ENTER0 = 2.84;

export const H1: React.FC<{t: number}> = ({t}) => {
  const tau = t;
  if (tau >= T_SURF)
    return (
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <ChromeSurface t={t} />
      </svg>
    );
  const c = loopCam(tau);
  // the surface hand-off: inside the dome, the chrome texture we are about to enter grows in above the eyes
  const enter = ss(tau, ENTER0, ENTER0 + 0.12);
  let over: React.ReactNode = null;
  if (enter > 0.001) {
    const d = domeScreen(c, tau);
    // the surface pattern fills the dome's box, and grows with it to exactly the full frame at T_SURF
    const kEnd = ss(tau, 3.0, 3.26);
    // (never larger than the final frame: once the dome outgrows the frame the texture only slides into place, it never
    // shrinks while the camera pushes in)
    const k = lerp(Math.min(1, (2 * d.rx) / 1080), 1, kEnd);
    const ids = {clip: uid('h1dc'), m: uid('h1dm'), g: uid('h1dg')};
    // anchored on the point the camera dives into (it converges on the frame centre as the push lands), so the texture's
    // edges never show inside the dome
    DOME = DOME ?? domePoint();
    const fq = project(c, DOME.F);
    const fx = lerp(fq.x, 540, kEnd), fy = lerp(fq.y, 960, kEnd);
    over = (
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <defs>
          <clipPath id={ids.clip}>
            <path d={supPath(d.x, d.y, d.rx, d.ryT, d.ryB, R2.headNT, R2.headNB, 0.975)} />
          </clipPath>
          <linearGradient id={ids.g} gradientUnits="userSpaceOnUse" x1="0" y1={f1(lerp(d.eyeY - 0.9 * d.s * S, 2100, kEnd))} x2="0" y2={f1(lerp(d.eyeY - 0.35 * d.s * S, 2300, kEnd))}>
            <stop offset="0" stopColor="#fff" stopOpacity={1} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id={ids.m} maskUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
            <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${ids.g})`} />
          </mask>
        </defs>
        <g clipPath={`url(#${ids.clip})`}>
          <g mask={`url(#${ids.m})`} opacity={enter}>
            <g transform={`translate(${f1(fx - 540 * k)} ${f1(fy - 960 * k)}) scale(${k.toFixed(5)})`}>
              <ChromeSurface t={t} />
            </g>
          </g>
        </g>
      </svg>
    );
  }
  // the motivating glint: a window reflection sweeps across the dome (left -> right) and the camera follows it in
  let glint: React.ReactNode = null;
  const gk = ss(tau, T_GLINT0, T_GLINT0 + 0.32);
  if (gk > 0 && gk < 1) {
    const d = domeScreen(c, tau);
    const id = uid('h1gl');
    const x = d.x + lerp(-1.3, 1.3, gk) * d.rx;
    const a = Math.sin(Math.PI * gk);
    const w = 0.16 * d.rx;
    const y0 = d.y - d.ryT * 1.1, y1 = d.y + d.ryB * 0.2;
    const sk = 0.35 * (y1 - y0);
    glint = (
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <defs>
          <clipPath id={id}>
            <path d={supPath(d.x, d.y, d.rx, d.ryT, d.ryB, R2.headNT, R2.headNB, 0.96)} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id})`} opacity={0.85 * a}>
          <path d={`M${f1(x - w + sk)},${f1(y0)} L${f1(x + w + sk)},${f1(y0)} L${f1(x + w - sk)},${f1(y1)} L${f1(x - w - sk)},${f1(y1)} Z`} fill="#FFFFFF" />
          <path d={`M${f1(x + 1.9 * w + sk)},${f1(y0)} L${f1(x + 2.4 * w + sk)},${f1(y0)} L${f1(x + 2.4 * w - sk)},${f1(y1)} L${f1(x + 1.9 * w - sk)},${f1(y1)} Z`} fill="#FFFFFF" opacity={0.7} />
        </g>
      </svg>
    );
  }
  return (
    <>
      <JailFrame tau={tau} escalated={false} guard={null} />
      {glint}
      {over}
      <Tag text="STYLIZED RECREATION" t={t} t0={1.7} t1={3.05} x={56} y={150} size={28} />
    </>
  );
};

export const CUES_H1 = (): Cue[] => [
  // the alarm is already sounding at frame 0 (continued from J1's last 0.6 s); it fades as we enter the metal
  {t: 0, kind: 'alarm', dur: 3.12},
  {t: 3.12, kind: 'alarm_tail', dur: 0.3},
  // frame 0: the face already squeezing into the gap -> the sharp transformation sound + metallic stress
  {t: 0.02, kind: 'squeeze', gain: 0},
  {t: 0.0, kind: 'tension', dur: 0.9, gain: -3},
  // the body pours through the neck and collects outside
  {t: 0.36, kind: 'stream', dur: 0.85, gain: -2},
  // the last of it leaves the gap, it rises and the head snaps into shape (the snap sits right after "JAIL")
  {t: 1.15, kind: 'escape', gain: -4},
  {t: 1.18, kind: 'reform', dur: 0.48},
  {t: 1.62, kind: 'snap'},
  // deadpan blink in the hold
  {t: T_BLINK - 0.02, kind: 'mech_click', variant: 1, gain: -2},
  // a glint runs over the dome (the wide), the camera is drawn in after it, into the metal
  {t: T_GLINT0 + 0.06, kind: 'glint', gain: -2},
  {t: 3.17, kind: 'enter'},
];

// =====================================================================================================================
// J1
// =====================================================================================================================
const guardActJ1 = (tau: number): GuardAct => {
  const t = tau + DUR;
  // deadpan, satisfied: watching the cell, a slow sip during the reveal, cup down, a glance at us; a flicker of doubt
  // when the robot grips the bars
  const sip = ss(t, 28.2, 28.55) * (1 - ss(t, 28.95, 29.3));
  const look = lerp(-0.55, -0.15, ss(t, 29.0, 29.3)) + lerp(0, -0.4, ss(t, 30.2, 30.5));
  return {...GUARD_IDLE, look, sip: 0.15 + 0.75 * sip, stare: 0.25 * ss(t, 30.3, 30.6), blink: Math.max(0, 1 - Math.abs(t - 29.6) / 0.07)};
};

export const J1: React.FC<{t: number}> = ({t}) => {
  const tau = loopTau(t);
  return (
    <>
      <JailFrame tau={tau} escalated guard={{p: GUARD_J1, act: guardActJ1(tau), t}} />
      <Tag text="STYLIZED RECREATION" t={t} t0={28.05} t1={29.35} x={56} y={150} size={28} />
    </>
  );
};

/** film times of the march's footfalls */
const footfalls = () => {
  const out: number[] = [];
  for (let k = 1; k <= STEPS; k++) {
    let a = T_WALK0, b = T_WALK1;
    for (let i = 0; i < 40; i++) {
      const m = (a + b) / 2;
      if (ss(m, T_WALK0, T_WALK1) < k / STEPS) a = m;
      else b = m;
    }
    out.push(+(a + DUR).toFixed(3));
  }
  return out;
};

export const CUES_J1 = (): Cue[] => [
  // the padlock cluster still swinging as the reveal finds it
  {t: 28.3, kind: 'chain', gain: -7, pan: 0.45},
  // the robot's deadpan look at us (pause after "apparently")
  {t: 28.98, kind: 'comic', variant: 2, gain: -2},
  // the march to the bars: a little servo tick on each footfall (a knee returns to 0 at w = k / STEPS)
  ...footfalls().map((t, i) => ({t, kind: 'mech_click', variant: i % 4, gain: -6})),
  // it grips the two bars
  {t: 30.31, kind: 'bar_tap', gain: -2},
  // the face presses into the gap
  {t: 31.0, kind: 'tension', dur: 0.8, gain: -8},
  // the alarm trips and the squeeze starts: runs to 32.40 and continues into frame 0
  {t: 31.82, kind: 'alarm', dur: 0.58},
  {t: 31.84, kind: 'tension', dur: 0.56, gain: -5},
];

/** debug: the loop's internal values */
export const hookLoopDebug = {loopCam, loopRobot, alarmLevel, MATCH, T_J0, domeScreen, snapEase};
