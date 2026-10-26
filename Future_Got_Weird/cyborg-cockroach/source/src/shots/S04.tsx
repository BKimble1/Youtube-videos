// S04 (5.00-9.10 s) "Scientists strapped a tiny launcher onto a living cockroach, then used electrical pulses"
// One continuous camera move at insect height. The medic insect (injector loaded and latched) walks slowly to screen-left
// across the grid mat; the camera, on its LEFT flank, overtakes it a little so the view slides along the mounted
// hardware from the rear of the backpack (coin cell, board, cerci wires) to its front (tube mouth, needle, collar), then
// eases forward and down along the orange antenna wire to the left antenna-base electrode. On "electrical" a short train
// of pulses leaves the board and runs down that wire; when it arrives the electrode glows briefly, the left antenna
// twitches and, in the last frames, the body starts to veer RIGHT (left antenna stimulated -> right turn).
import React from 'react';
import {Cam, lookAt, depth, proj} from '../lib/cam';
import {fmt} from '../lib/g3';
import {V3, add, mul, toW, Frame} from '../lib/v3';
import {clamp, lerp, ramp, smoother, sr, noise1} from '../lib/ease';
import {poseRoach, splinePath, straightPath, Path} from '../rig/roach';
import {Roach} from '../rig/Roach';
import {Gear} from '../rig/Gear';
import {LabBackdrop, ArenaFloor} from '../sets/Lab';
import {ShotProps} from './index';
import {FPS, word} from '../timeline';

// ---------------------------------------------------------------------------------------------------------------
// The medic's walk through S04 and S06 (one world, one path): straight along -x, then a right turn of 90 degrees
// (toward world -z) that starts when the first pulse reaches the left antenna and tightens after the second.
// ---------------------------------------------------------------------------------------------------------------
export const RUN_T0 = 5.0; // S04 start (s)
export const RUN_X0 = 150; // body origin x at RUN_T0 (heading -x, z = 0)
const S_OFF = 60; // the path starts this far behind, so the gait never samples it near arc length 0
const V0 = 36; // mm/s, the slow walk of S04
const V1 = 46; // mm/s after the stimulus (S06)
const TV0 = 9.0, TV1 = 9.6; // speed-up window
const intSm = (u: number) => u * u * u * u * (u * u - 3 * u + 2.5); // integral of smoother over [0, u]
/** distance walked since RUN_T0 (mm) */
export const runS = (t: number) => {
  const base = S_OFF + V0 * (t - RUN_T0);
  const T = TV1 - TV0;
  const extra = t <= TV0 ? 0 : t >= TV1 ? (V1 - V0) * (T * 0.5 + (t - TV1)) : (V1 - V0) * T * intSm((t - TV0) / T);
  return base + extra;
};
/** the stimulation times: pulse train 1 leaves the board on "electrical" and reaches the electrode by ~9.0 s */
export const PULSE1 = {leave: word('electrical').start, arrive: word('pulses').start - 0.04};
export const PULSE2 = {leave: 9.18, arrive: 9.36};
const S_TURN1 = runS(PULSE1.arrive + 0.02); // the turn starts as the first pulse arrives
const S_TURN2 = runS(PULSE2.arrive + 0.02);
/** heading change progress 0..1 (0 = heading -x, 1 = heading -z, a right turn) by distance */
const turnH = (s: number) => 0.14 * sr(s, S_TURN1, S_TURN1 + 9) + 0.86 * sr(s, S_TURN2 - 4, S_TURN2 + 40);
const RUN_PATH: Path = (() => {
  const pts: [number, number][] = [];
  let x = RUN_X0 + S_OFF, z = 0;
  const ds = 2;
  for (let s = 0; s <= 400; s += ds) {
    pts.push([x, z]);
    const yaw = Math.PI - (Math.PI / 2) * turnH(s + ds / 2);
    x += Math.cos(yaw) * ds;
    z -= Math.sin(yaw) * ds;
  }
  return splinePath(pts, 1400);
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
  // breathing: the abdomen pumps slowly; a slight rise of the hind body (pitch about the thorax)
  const br = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 0.9);
  const pose = poseRoach({
    path: RUN_PATH, s, t, seed: 3, search: 0.85,
    pitch: -0.006 * (br - 0.5),
    antL: {yaw: 0.58 + 0.22 * tw, pitch: 0.1 + 0.42 * tw, curl: 0.9 - 0.35 * tw},
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
// Camera: one eased move. It rides with the insect's straight line of travel (no gait bob, and it does not turn with
// the insect at the end) and slides forward relative to the body: rear of the backpack -> front of the tube -> the
// left antenna electrode, lowering and swinging slightly round toward the front as it pushes in.
// ---------------------------------------------------------------------------------------------------------------
type CamKey = {tgt: V3; az: number; el: number; D: number; cy: number};
const DEG = Math.PI / 180;
export const S04_F = 1700;
const KEYS: [number, CamKey][] = [
  [0, {tgt: [-8, 22, -2], az: -25 * DEG, el: 32 * DEG, D: 85, cy: 640}],
  [0.45, {tgt: [14, 20, -3], az: 5 * DEG, el: 28 * DEG, D: 82, cy: 700}],
  [1, {tgt: [35, 14, -7], az: 30 * DEG, el: 14 * DEG, D: 70, cy: 840}],
];
// relative slide speed (arbitrary units): eases in, steady through phase A, rises for the push, eases out at the end
const slideW = (t: number) => (0.55 * sr(t, 5.0, 5.8) + 1.5 * sr(t, 7.5, 8.3)) * (1 - sr(t, 8.55, 9.06));
const M_TAB = (() => {
  const n = 600, t0 = 5.0, t1 = 9.1, out: number[] = [0];
  let acc = 0;
  for (let i = 1; i <= n; i++) {
    const ta = t0 + ((i - 1) / n) * (t1 - t0), tb = t0 + (i / n) * (t1 - t0);
    acc += ((slideW(ta) + slideW(tb)) / 2) * ((t1 - t0) / n);
    out.push(acc);
  }
  return out.map((x) => x / acc);
})();
export const camM = (t: number) => {
  const u = clamp((t - 5.0) / 4.1) * (M_TAB.length - 1);
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
      <Roach pose={pose} cam={cam} o={{id: `${id}r`, gear: <Gear id={`${id}g`} cam={cam} f={pose.frame} g={g} />}} />
    </svg>
  );
};
