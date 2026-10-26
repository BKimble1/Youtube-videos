// S04 (5.00-9.10 s) "Scientists strapped a tiny launcher onto a living cockroach, then used electrical pulses"
// One continuous camera move at insect scale. The medic insect (injector loaded and latched) walks slowly (36 mm/s) to
// screen-left across the grid mat; the camera, on its LEFT flank, travels a little faster than the insect, so the view
// slides along the mounted hardware from the rear of the backpack (coin cell, board, blue cerci wires) to its front (tube
// mouth, needle, collar, head), then eases forward and down along the orange antenna wire to the left antenna-base
// electrode. On "electrical" a short train of pulses leaves the board and runs down that wire; as it arrives (~9.0 s) the
// electrode glows briefly, the left antenna flicks up and, in the last frames, the body starts to veer RIGHT (left
// antenna stimulated -> right turn). S06 continues the same walk (medicPose / medicGear are shared).
import React from 'react';
import {Cam, lookAt, proj, scaleAt} from '../lib/cam';
import {fmt} from '../lib/g3';
import {V3, V2, add, sub, mul, norm, dot, toW, toL, lerp3, len, Frame} from '../lib/v3';
import {clamp, lerp, smoother, sr} from '../lib/ease';
import {poseRoach, splinePath, straightPath, Path, LegPose, RoachPose, PLATES, PRONOTUM} from '../rig/roach';
import {Roach, RoachDrawOpts, CHITIN} from '../rig/Roach';
import {Inked, Deco} from '../lib/ink';
import {Capsule} from '../lib/shade';
import type {LoftDef} from '../lib/loft';
import {Gear} from '../rig/Gear';
import {LabBackdrop, ArenaFloor} from '../sets/Lab';
import {ShotProps} from './index';
import {FPS, word, wordIn} from '../timeline';
import {SHOT_FRAMES} from '../cuts';

// ---------------------------------------------------------------------------------------------------------------
// The medic's walk through S04 and S06 (one world, one path): straight along -x, then a right turn of 90 degrees
// (toward world -z) that starts when the first pulse reaches the left antenna and tightens after the second.
// ---------------------------------------------------------------------------------------------------------------
const cutAt = (id: string) => SHOT_FRAMES.find(([k]) => k === id)![1] / FPS;
export const S04_T0 = cutAt('S04'), S04_T1 = cutAt('S06'), S06_T1 = cutAt('S07');
export const RUN_T0 = S04_T0; // S04 start (s)
export const RUN_X0 = 150; // body origin x at RUN_T0 (heading -x, z = 0)
const S_OFF = 75; // the path starts this far behind (the gait never samples it near arc length 0); sets the gait phase:
// the near front leg (L1) is in late stance, pulled back from the face, while the pulse arrives
const V0 = 36; // mm/s, the slow walk of S04
const V1 = 46; // mm/s after the stimulus (S06)
/** the stimulation times: pulse train 1 leaves the board on "electrical" and reaches the electrode by "pulses" (~9.0 s);
 *  train 2 leaves as S06 opens and lands just before "to steer it" */
export const PULSE1 = {leave: word('electrical').start, arrive: word('pulses').start - 0.04};
export const PULSE2 = {leave: S04_T1, arrive: wordIn('to steer it').start - 0.13};
const TV0 = PULSE1.arrive + 0.03, TV1 = TV0 + 0.6; // speed-up window after the first stimulus
const intSm = (u: number) => u * u * u * u * (u * u - 3 * u + 2.5); // integral of smoother over [0, u]
/** distance walked since RUN_T0 (mm) */
export const runS = (t: number) => {
  const base = S_OFF + V0 * (t - RUN_T0);
  const T = TV1 - TV0;
  const extra = t <= TV0 ? 0 : t >= TV1 ? (V1 - V0) * (T * 0.5 + (t - TV1)) : (V1 - V0) * T * intSm((t - TV0) / T);
  return base + extra;
};
const S_TURN1 = runS(PULSE1.arrive + 0.02); // the turn starts as the first pulse arrives
const S_TURN2 = runS(PULSE2.arrive + 0.02);
/** the body's heading change 0..1 (0 = heading -x, 1 = heading -z: a right turn of 90 degrees) by distance walked */
const turnBody = (s: number) => 0.22 * sr(s, S_TURN1, S_TURN1 + 4.5) + 0.78 * sr(s, S_TURN2 - 4, S_TURN2 + 40);
/** the path (and so the planted feet) follows the body's heading a few millimetres later: the body pivots over its
 *  planted feet first, then the steps carry it round (both are monotonic, so the turn never reverses) */
const TURN_LAG = 5;
const turnPath = (s: number) => turnBody(s - TURN_LAG);
export const bodyYawAdd = (s: number) => -(Math.PI / 2) * (turnBody(s) - turnPath(s));
const RUN_PATH: Path = (() => {
  const pts: [number, number][] = [];
  let x = RUN_X0 + S_OFF, z = 0;
  const ds = 2;
  for (let s = 0; s <= 400; s += ds) {
    pts.push([x, z]);
    const yaw = Math.PI - (Math.PI / 2) * turnPath(s + ds / 2);
    x += Math.cos(yaw) * ds;
    z -= Math.sin(yaw) * ds;
  }
  return splinePath(pts, 1600);
})();
export const RUN_STRAIGHT: Path = straightPath([RUN_X0 + S_OFF, 0, 0], Math.PI);
export const runPath = RUN_PATH;

/** short envelope: fast rise, slower decay */
const blip = (t: number, at: number, rise = 0.035, fall = 0.22) => (t < at ? 0 : t < at + rise ? smoother((t - at) / rise) : Math.exp(-(t - at - rise) / fall));
/** fractions along the left antenna wire for a pulse train leaving at `leave` and reaching the electrode at `arrive` */
export const pulseTrain = (t: number, p: {leave: number; arrive: number}, n = 3, gap = 0.09) => {
  const u = (t - p.leave) / (p.arrive - p.leave);
  return Array.from({length: n}, (_, k) => u - k * gap).filter((x) => x >= 0 && x <= 1);
};
/** electrode glow after each pulse of a train arrives */
export const zapOf = (t: number, p: {leave: number; arrive: number}, n = 3, gap = 0.09) => {
  const dt = (p.arrive - p.leave) * gap;
  let z = 0;
  for (let k = 0; k < n; k++) z = Math.max(z, blip(t, p.arrive + k * dt, 0.03, 0.12) * (1 - 0.15 * k));
  return z;
};
/** the left antenna's twitch (0..1) after a train arrives */
export const twitchOf = (t: number, p: {leave: number; arrive: number}) => blip(t, p.arrive + 0.01, 0.06, 0.25);

/** the posed medic at time t (shared by S04 and S06) */
export const medicPose = (t: number) => {
  const s = runS(t);
  const tw = twitchOf(t, PULSE1) + twitchOf(t, PULSE2);
  // breathing (0.9 Hz): pose.breath is set, plus a very slight body rock (rig/Roach.tsx does not yet draw breath)
  const br = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 0.9);
  const pose = poseRoach({
    path: RUN_PATH, s, t, seed: 3, search: 0.85,
    pitch: -0.006 * (br - 0.5), yawAdd: bodyYawAdd(s),
    antL: {yaw: 0.58 + 0.3 * tw, pitch: 0.1 + 0.55 * tw, curl: 0.9 - 0.45 * tw},
    antR: {yaw: 0.64},
    breathe: br,
  });
  return {pose, s};
};
export const medicGear = (t: number) => {
  const pulses = [...pulseTrain(t, PULSE1), ...pulseTrain(t, PULSE2)];
  const zap = Math.max(zapOf(t, PULSE1), zapOf(t, PULSE2));
  return {kind: 'injector' as const, loaded: true, latched: true, pulses: {antL: pulses}, zap: {antL: zap}};
};

// ---------------------------------------------------------------------------------------------------------------
// Near legs at close range (local adaptation of rig/Roach.tsx's Leg). The shared Roach draws a near leg whole, on top
// of the shell, which reads right from low cameras (S01) but, from above the margin, makes the femur look as if it grew
// out of the side wall (and lets a front knee show through the pronotum). Here every leg is drawn behind the body
// (legsBehind) and each near leg is drawn again on top only from where it leaves the body's plan footprint.
// ---------------------------------------------------------------------------------------------------------------
const loftW = (d: LoftDef, x: number) => {
  const u = (x - d.x0) / (d.x1 - d.x0);
  return u < 0 || u > 1 ? 0 : d.w(u);
};
const footW = (x: number) => Math.max(loftW(PLATES, x), loftW(PRONOTUM, x));
const inFoot = (fr: Frame, p: V3, m = 0.4) => {
  const q = toL(fr, p);
  return Math.abs(q[2]) < footW(q[0]) + m;
};
const legOutward = (fr: Frame, p: LegPose): V3 => {
  const fw = p.def.front ? 0.6 : p.def.coxa[0] < 0 ? -0.6 : 0;
  return norm(add(mul(fr.z, p.def.side), mul(fr.x, fw)));
};
/** where along the leg chain (segment 0 femur, 1 tibia, 2 tarsus; fraction t) it leaves the footprint for good */
const exitOf = (fr: Frame, p: LegPose): {seg: number; t: number} | null => {
  const chain = [p.coxa, p.knee, p.ankle, p.foot];
  const N = 24;
  let last: {seg: number; i: number} | null = null;
  for (let sg = 0; sg < 3; sg++) for (let i = 0; i <= N; i++) if (inFoot(fr, lerp3(chain[sg], chain[sg + 1], i / N))) last = {seg: sg, i};
  if (!last) return {seg: 0, t: 0};
  if (last.seg === 2 && last.i >= N) return null;
  let seg = last.seg, lo = last.i / N, hi = (last.i + 1) / N;
  if (last.i >= N) (seg += 1), (lo = 0), (hi = 1 / N);
  // bisect the crossing so the redrawn part starts at a continuous place from frame to frame
  for (let k = 0; k < 14; k++) {
    const m = (lo + hi) / 2;
    if (inFoot(fr, lerp3(chain[seg], chain[seg + 1], m))) lo = m;
    else hi = m;
  }
  // step a little back under the margin so the redrawn part tucks under the shell edge
  const segLen = len(sub(chain[seg + 1], chain[seg]));
  return {seg, t: clamp(hi - 0.9 / Math.max(1, segLen))};
};
const LegOuter: React.FC<{id: string; p: LegPose; cam: Cam; inkW: number; from: {seg: number; t: number}}> = ({id, p, cam, inkW, from}) => {
  const L = p.def;
  const s = (q: V3) => scaleAt(cam, q);
  const V = (q: V2) => ({x: q[0], y: q[1]});
  const rF0 = L.rFem, rK0 = L.rFem * 0.78, rT0 = L.rTib * 0.8, rA0 = L.rTib * 0.55, rTa0 = 0.95, rFo0 = 0.55;
  const tib = sub(p.ankle, p.knee);
  const outw = norm(add(sub(p.knee, p.coxa), [0, -6, 0]));
  const nSp = L.front ? 4 : 5;
  const spines: [V2, V2][] = [];
  for (let i = 1; i <= nSp; i++) {
    const t = i / (nSp + 0.6);
    if (from.seg > 1 || (from.seg === 1 && t < from.t + 0.04)) continue;
    const base = add(p.knee, mul(tib, t));
    const dir = norm(add(mul(norm(tib), 0.55), mul(outw, 0.8)));
    spines.push([proj(cam, base), proj(cam, add(base, mul(dir, L.front ? 3.6 + 0.6 * i : 2.8)))]);
  }
  const parts: React.ReactNode[] = [];
  const cap = (k: string, a: V3, b: V3, ra: number, rb: number, color: string, spec: number) =>
    parts.push(<Capsule key={k} id={`${id}-${k}`} a={V(proj(cam, a))} b={V(proj(cam, b))} ra={ra * s(a)} rb={rb * s(b)} color={color} spec={spec} />);
  if (from.seg === 0) cap('fe', lerp3(p.coxa, p.knee, from.t), p.knee, lerp(rF0, rK0, from.t), rK0, CHITIN.leg, 0.35);
  if (from.seg <= 1) cap('ti', from.seg === 1 ? lerp3(p.knee, p.ankle, from.t) : p.knee, p.ankle, from.seg === 1 ? lerp(rT0, rA0, from.t) : rT0, rA0, CHITIN.legDeep, 0.25);
  cap('ta', from.seg === 2 ? lerp3(p.ankle, p.foot, from.t) : p.ankle, p.foot, from.seg === 2 ? lerp(rTa0, rFo0, from.t) : rTa0, rFo0, CHITIN.legDeep, 0);
  const rA = rA0 * s(p.ankle);
  return (
    <Inked w={inkW} id={id}>
      {parts}
      <Deco>
        {spines.map(([b, t], i) => (
          <path key={i} d={`M${fmt(b[0])} ${fmt(b[1])} L${fmt(t[0])} ${fmt(t[1])}`} stroke={CHITIN.spine} strokeWidth={Math.max(1.2, rA * (L.front ? 0.8 : 0.6))} strokeLinecap="round" />
        ))}
      </Deco>
    </Inked>
  );
};
/** the shared Roach with near legs split at the body footprint (see above) */
export const RoachSplit: React.FC<{pose: RoachPose; cam: Cam; o: RoachDrawOpts}> = ({pose, cam, o}) => {
  const fr = pose.frame;
  const sc = scaleAt(cam, fr.o);
  const inkW = o.ink ?? Math.max(2.4, Math.min(8, sc * 0.42));
  const camAbove = dot(norm(sub(cam.eye, fr.o)), fr.y) > 0.76;
  const near = camAbove ? [] : pose.legs.filter((p) => dot(sub(cam.eye, p.coxa), legOutward(fr, p)) > 0);
  return (
    <g>
      <Roach pose={pose} cam={cam} o={{...o, legsBehind: true}} />
      {near.map((p) => {
        const e = exitOf(fr, p);
        return e ? <LegOuter key={p.def.name} id={`${o.id}-n${p.def.name}`} p={p} cam={cam} inkW={inkW * 0.85} from={e} /> : null;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Camera: one eased move. It rides with the insect's straight line of travel (no gait bob, and it does not turn with
// the insect at the end) and slides forward relative to the body: rear of the backpack -> front of the tube -> the
// left antenna electrode, lowering, pushing in and swinging from a high rear quarter round to a near profile. The
// relative progress m(t) is the integral of a smooth, always-positive speed profile, so the move never stops or reverses
// until it settles on the head just before the pulse arrives; every key parameter is monotonic in m.
// ---------------------------------------------------------------------------------------------------------------
type CamKey = {tgt: V3; az: number; el: number; D: number; cy: number};
const DEG = Math.PI / 180;
export const S04_F = 1700;
// (azimuth stays negative-to-zero: the eye never passes in front of the head, so the view is a near profile at the end)
const KEYS: [number, CamKey][] = [
  [0, {tgt: [-5, 22, -2], az: -25 * DEG, el: 28 * DEG, D: 85, cy: 580}],
  [0.45, {tgt: [19, 20, -3], az: -12 * DEG, el: 24 * DEG, D: 80, cy: 640}],
  [1, {tgt: [33, 13, -6], az: -4 * DEG, el: 17 * DEG, D: 72, cy: 800}],
];
// relative slide speed (arbitrary units): eases in, steady through phase A, rises for the push (centred on the end of
// "cockroach"), eases out and settles on the head just as the first pulse reaches the electrode
const PUSH = wordIn('living cockroach', 1).end, SETTLE = PULSE1.arrive + 0.09;
const slideW = (t: number) => (0.55 * sr(t, S04_T0, S04_T0 + 0.8) + 1.5 * sr(t, PUSH - 0.43, PUSH + 0.37)) * (1 - sr(t, SETTLE - 0.51, SETTLE));
const M_TAB = (() => {
  const n = 600, t0 = S04_T0, t1 = S04_T1, out: number[] = [0];
  let acc = 0;
  for (let i = 1; i <= n; i++) {
    const ta = t0 + ((i - 1) / n) * (t1 - t0), tb = t0 + (i / n) * (t1 - t0);
    acc += ((slideW(ta) + slideW(tb)) / 2) * ((t1 - t0) / n);
    out.push(acc);
  }
  return out.map((x) => x / acc);
})();
export const camM = (t: number) => {
  const u = clamp((t - S04_T0) / (S04_T1 - S04_T0)) * (M_TAB.length - 1);
  const i = Math.min(M_TAB.length - 2, Math.floor(u));
  return lerp(M_TAB[i], M_TAB[i + 1], u - i);
};
/** C1 Hermite through the keys (tangents from the neighbours' secants) */
const herm = (m: number, get: (k: CamKey) => number) => {
  const K = KEYS;
  let i = 0;
  while (i < K.length - 2 && m > K[i + 1][0]) i++;
  const [m0, k0] = K[i], [m1, k1] = K[i + 1];
  const tan = (j: number) => {
    const a = K[Math.max(0, j - 1)], b = K[Math.min(K.length - 1, j + 1)];
    return (get(b[1]) - get(a[1])) / (b[0] - a[0]);
  };
  const h = m1 - m0, u = clamp((m - m0) / h);
  const p0 = get(k0), p1 = get(k1), d0 = tan(i) * h, d1 = tan(i + 1) * h;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * d0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * d1;
};
/** camera from explicit parameters in the insect's straight-travel frame (body axes while heading -x) */
export const camFrom = (t: number, c: CamKey & {f?: number}): Cam => {
  const pp = RUN_STRAIGHT(runS(t));
  const ref: Frame = {o: pp.p, x: [-1, 0, 0], y: [0, 1, 0], z: [0, 0, -1]};
  const dir: V3 = [Math.cos(c.el) * Math.sin(c.az), Math.sin(c.el), -Math.cos(c.el) * Math.cos(c.az)];
  return lookAt(toW(ref, add(c.tgt, mul(dir, c.D))), toW(ref, c.tgt), c.f ?? S04_F, 540, c.cy);
};
export const s04Key = (t: number): CamKey => {
  const m = camM(t);
  const g = (fn: (k: CamKey) => number) => herm(m, fn);
  return {tgt: [g((k) => k.tgt[0]), g((k) => k.tgt[1]), g((k) => k.tgt[2])], az: g((k) => k.az), el: g((k) => k.el), D: g((k) => k.D), cy: g((k) => k.cy)};
};
export const s04Cam = (t: number): Cam => camFrom(t, s04Key(t));
export type {CamKey};

/** macro depth of field on the mat: a blurred copy everywhere, the sharp mat only in a band around the insect's feet */
export const DofFloor: React.FC<{id: string; cam: Cam; body: Frame; blur: number; children: React.ReactNode}> = ({id, cam, body, blur, children}) => {
  const far = proj(cam, toW(body, [0, 0, 34])), near = proj(cam, toW(body, [0, 0, -34]));
  const y0 = Math.min(far[1], near[1]), y1 = Math.max(far[1], near[1]);
  const pad = 0.35 * (y1 - y0) + 40;
  const a = (y0 - pad) / 1920, b = y0 / 1920, c = y1 / 1920, d = (y1 + pad * 1.6) / 1920;
  return (
    <g>
      <defs>
        <filter id={`${id}-bl`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={blur} />
        </filter>
        <linearGradient id={`${id}-gr`} x1="0" y1="0" x2="0" y2="1920" gradientUnits="userSpaceOnUse">
          <stop offset={fmt(clamp(a))} stopColor="#000" />
          <stop offset={fmt(clamp(b))} stopColor="#FFF" />
          <stop offset={fmt(clamp(c))} stopColor="#FFF" />
          <stop offset={fmt(clamp(d))} stopColor="#000" />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1920">
          <rect x={0} y={0} width={1080} height={1920} fill={`url(#${id}-gr)`} />
        </mask>
      </defs>
      <g filter={`url(#${id}-bl)`}>{children}</g>
      <g mask={`url(#${id}-m)`}>{children}</g>
    </g>
  );
};

export const S04: React.FC<ShotProps & {k?: string; cam?: Cam}> = ({f, k = '', cam: camO}) => {
  const t = f / FPS;
  const cam = camO ?? s04Cam(t);
  const {pose} = medicPose(t);
  const g = medicGear(t);
  const id = `s04${k}`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <LabBackdrop id={`${id}b`} cam={cam} blur={18} />
      <DofFloor id={`${id}d`} cam={cam} body={pose.frame} blur={7}>
        <ArenaFloor id={`${id}f`} cam={cam} x0={-400} x1={420} z0={-420} z1={200} fade={520} />
      </DofFloor>
      <RoachSplit pose={pose} cam={cam} o={{id: `${id}r`, gear: <Gear id={`${id}g`} cam={cam} f={pose.frame} g={g} />}} />
    </svg>
  );
};
