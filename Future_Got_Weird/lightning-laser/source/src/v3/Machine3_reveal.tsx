// V3 beat C3 (9.67-11.42): one continuous reveal. The telescope (the composited 2D LaserArt3 on the projected EXIT3,
// scaled with the projection exactly as beat H places it) sends its packet train up the beam: a packet leaves the exit
// window on each window tick (EV.windowPackets + k/9, k = 0..6; the train keeps running after the last tick). The
// camera follows the train up the beam in one crane (View3, quiet sky, no discharge): the telescope drops away below,
// the beam climbs beside the upper tower and passes its tip; then (the push swell 10.98-11.43) it pushes into one
// packet as the train slows (illustrative slow motion), so that at 11.42 that packet's glow is centred on (540, 960),
// moving up the beam, which runs at MICRO_ANG on screen (the C -> D contract; D's Packet look, Channel3.tsx).
// The beam's on-screen direction is MICRO_ANG through the whole shot (the camera roll is solved for it), the same
// direction as C2's duct at the cut.
import React from 'react';
import {clamp, fmt} from '../dc/math';
import {ss} from '../lib';
import {axis3, Cam3, len3, lookAt, projector, sub3, v3, V3} from '../v2/p3';
import {camScreen} from '../v2/Composite';
import {EXIT_H} from '../world/site';
import {beamOnScreen, View3} from './view3';
import {quietSt} from './states3';
import {MICRO_ANG} from './cams3';
import {PAL} from './palette';
import {B, EV} from './timeline3';
import {exitScreen, PlacedLaser, PulseBloom} from './Open3_fx';
import {LOW} from './Open3_end';
import {BeamGlow} from './Machine3_fx';

// ------------------------------------------------------------------ the packet train
/** drawn packet speed along the beam (site px per second; 820 px is about 139 m) */
export const C3_V = 820;
export const C3_GAP = 1 / 9; // s between packets (the ticks)
const T_PUSH = EV.pushIntoPulse; // 10.98
/** the train slows to this fraction of its speed by 11.42 (illustrative slow motion as we push into one packet) */
const S_END = 0.05;
/** the train's clock: film time until the push, then slowed (smoothstep on the rate) */
export const pktClock = (t: number) => {
  if (t <= T_PUSH) return t;
  const d = B.D - T_PUSH;
  const x = Math.min(1, (t - T_PUSH) / d);
  const base = T_PUSH + d * (x - (1 - S_END) * (x * x * x - (x * x * x * x) / 2));
  return t > B.D ? base + (t - B.D) * S_END : base;
};
/** packet k leaves the exit window at EV.windowPackets + k/9 (k < 0: already climbing at the cut) */
export const exitT = (k: number) => EV.windowPackets + k * C3_GAP;
export const pktH = (k: number, t: number) => EXIT_H + C3_V * (pktClock(t) - exitT(k));
/** every packet on the beam (h between the exit and the cloud base) */
export const c3Pulses = (t: number) => {
  const out: number[] = [];
  for (let k = -30; k <= 30; k++) {
    const h = pktH(k, t);
    if (h >= EXIT_H && h <= 1000) out.push(h);
  }
  return out;
};
/** the packet the camera pushes into (it leaves on the fourth tick, 9.94) */
export const K_F = 3;
export const hF = (t: number) => pktH(K_F, t);
/** exit-window flare on each sound-locked tick (k = 0..6) */
export const c3Tick = (t: number) => Array.from({length: 7}, (_, k) => exitT(k)).reduce((a, k) => a + (t >= k - 0.02 ? Math.exp(-Math.max(0, t - k) / 0.09) : 0), 0);

// ------------------------------------------------------------------ the camera
type HK = [number, number, number];
const herm = (t: number, keys: HK[]) => {
  if (t <= keys[0][0]) return keys[0][1] + keys[0][2] * (t - keys[0][0]);
  for (let i = 0; i + 1 < keys.length; i++) {
    const [t0, v0, m0] = keys[i], [t1, v1, m1] = keys[i + 1];
    if (t > t1) continue;
    const h = t1 - t0, x = (t - t0) / h, x2 = x * x, x3 = x2 * x;
    return (2 * x3 - 3 * x2 + 1) * v0 + (x3 - 2 * x2 + x) * h * m0 + (-2 * x3 + 3 * x2) * v1 + (x3 - x2) * h * m1;
  }
  const [tl, vl, ml] = keys[keys.length - 1];
  return vl + ml * (t - tl);
};
const T0 = B.C3, T2 = B.D;
/** the camera position (metres): in front of the beam, low beside the telescope, craning up the beam past the tower */
const PX: HK[] = [[T0, -34, 0.5], [T_PUSH, -24, 14], [T2, -9, 8]];
const PY: HK[] = [[T0, 2, 3], [T_PUSH, 104, 120], [T2, 140, 25]];
const PZ: HK[] = [[T0, -92, 1], [T_PUSH, -62, 45], [T2, -40, 14]];
/** scale at the aim point (screen px per metre) through the push; its log rate at 11.42 is D's (it sets f from T_PUSH on: fAt) */
const LZ: HK[] = [[T0, Math.log(8.5), 0.15], [T_PUSH, Math.log(24), 2.0], [T2, Math.log(100), 0.3]];
/** E0: where the exit window sits on screen at the cut (C2's duct line runs through it at MICRO_ANG) */
export const E0 = {x: 476, y: 1240};
const RAD = (MICRO_ANG * Math.PI) / 180;
const UP = {x: Math.sin(RAD), y: -Math.cos(RAD)};
/** packet F's screen speed at 11.42 (D opens with its packet moving up the axis at about this rate) */
const V_END = 420;
/** a camera at pos with axis3(h) at screen (sx, sy), focal length f, and the roll that runs the beam at MICRO_ANG */
const solveCam = (pos: V3, h: number, f: number, sx: number, sy: number): Cam3 => {
  const aim = axis3(h);
  // (a roll turns the image about the screen centre, so it turns the beam's on-screen direction by the same angle)
  let roll = 0;
  let c = camScreen(pos, aim, f, sx, sy, roll);
  for (let i = 0; i < 6; i++) {
    const b = beamOnScreen(c, h);
    roll += MICRO_ANG - b.ang;
    c = camScreen(pos, aim, f, sx, sy, roll);
  }
  return c;
};
const posAt = (t: number) => v3(herm(t, PX), herm(t, PY), herm(t, PZ));
const zAt = (t: number) => Math.exp(herm(Math.min(t, T2), LZ));
/** the camera's distance to F's point on the axis */
const distAt = (t: number) => len3(sub3(axis3(hF(t)), posAt(t)));
/** the focal length: one push-in, it never decreases. From the push swell (T_PUSH) on it is the aim scale Z times the
 *  distance (so the push lands on D's scale and rate at 11.42). Before it, Z alone is not enough: F climbs toward the
 *  camera's height, so its distance shrinks faster than Z grows and f (everything on screen) would shrink for the first
 *  third of a second (a pull-back). So from the cut ln f follows one accelerating curve (an exponential ease-in) that
 *  meets that value and rate at T_PUSH: f grows from the cut on, slowly at first */
const lnFNat = (t: number) => Math.log(zAt(t) * distAt(t));
const F_IN = (() => {
  const H = T_PUSH - T0;
  const l0 = lnFNat(T0), l1 = lnFNat(T_PUSH);
  const m1 = (lnFNat(T_PUSH + 1e-3) - l1) / 1e-3;
  // ln f = l0 + A (e^{k (t - T0)} - 1): value l1 and slope m1 at T_PUSH  =>  y e^y / (e^y - 1) = m1 H / (l1 - l0), y = k H
  const R = Math.max(1.0001, (m1 * H) / (l1 - l0));
  let lo = 1e-6, hi = 60;
  for (let i = 0; i < 80; i++) {
    const y = (lo + hi) / 2;
    if ((y * Math.exp(y)) / Math.expm1(y) < R) lo = y;
    else hi = y;
  }
  const k = (lo + hi) / 2 / H;
  return {l0, k, A: (l1 - l0) / Math.expm1(k * H)};
})();
const fAt = (t: number) => (t >= T_PUSH ? Math.exp(lnFNat(Math.min(t, T2))) : Math.exp(F_IN.l0 + F_IN.A * Math.expm1(F_IN.k * (t - T0))));
/** the scale at F (screen px per metre): Z from the push on */
const zAim = (t: number) => fAt(t) / distAt(t);
/** F's screen path. The camera aims at F's point on the beam axis from the start (while F is still inside the
 *  telescope that point lies on the axis below the exit, so the exit window sits exactly at E0 at the cut). F's screen
 *  point starts at a little less than its natural speed, so the camera is already tilting up with the train (the world
 *  only ever moves down the screen); F eases to a hold just below the centre while the camera rides with the train,
 *  then rises through the centre at V_END (every key monotonic: no bounce) */
const NAT = (() => {
  const c = solveCam(posAt(T0), EXIT_H, fAt(T0), E0.x, E0.y);
  const P = projector(c);
  const dt = 0.004;
  const a = P(axis3(hF(T0))), b = P(axis3(hF(T0 + dt)));
  return {x: a.x, y: a.y, vx: (b.x - a.x) / dt, vy: (b.y - a.y) / dt};
})();
const LEAD = 0.9; // F's starting screen speed as a fraction of its natural speed
const FX: HK[] = [[T0, NAT.x, LEAD * NAT.vx], [10.36, 524, 0], [T_PUSH, 512, 0], [T2, 540, V_END * UP.x]];
const FY: HK[] = [[T0, NAT.y, LEAD * NAT.vy], [10.36, 1075, 0], [T_PUSH, 1050, -40], [T2, 960, V_END * UP.y]];
export const c3Cam = (t: number): Cam3 => {
  const tt = Math.min(t, T2);
  return solveCam(posAt(tt), hF(tt), fAt(tt), herm(tt, FX), herm(tt, FY));
};

// ------------------------------------------------------------------ the pushed-into packet (screen space)
/** D's opening packet (Channel3.tsx Packet at 11.42: micro scale 1.32, bloom 1), in screen px along MICRO_ANG */
const D_PKT = {bloomR: 430, halo: {rx: 118 * 1.35 * 1.32, ry: 250 * 1.35 * 1.32}, core: {rx: 30 * 1.21 * 1.32, ry: 118 * 1.21 * 1.32}, white: {rx: 9 * 1.32, ry: 62 * 1.32}};
const FollowGlow: React.FC<{cam: Cam3; t: number; id: string}> = ({cam, t, id}) => {
  const k = ss(t, T_PUSH - 0.1, T_PUSH + 0.12);
  if (k <= 0.005) return null;
  const P = projector(cam);
  const p = P(axis3(hF(t)));
  if (!p.ok) return null;
  // the glow's size follows the push (the aim scale), reaching D's packet exactly at 11.42
  const g = zAim(Math.min(t, T2)) / 100;
  const bloom = ss(t, 11.08, T2);
  const sc = (r: number) => fmt(r * g);
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={fmt(k)} transform={`translate(${fmt(p.x)} ${fmt(p.y)}) rotate(${MICRO_ANG.toFixed(4)})`}>
      <defs>
        <radialGradient id={`${id}-h`}>
          <stop offset="0" stopColor={PAL.laser} stopOpacity={0.55} />
          <stop offset="0.45" stopColor={PAL.laserGlow} stopOpacity={0.26} />
          <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-c`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.5" stopColor={PAL.packet} stopOpacity={0.95} />
          <stop offset="1" stopColor={PAL.laser} stopOpacity={0} />
        </radialGradient>
      </defs>
      {bloom > 0.01 && <circle cx={0} cy={0} r={sc(D_PKT.bloomR)} fill={`url(#${id}-h)`} opacity={fmt(bloom)} />}
      <ellipse cx={0} cy={0} rx={sc(D_PKT.halo.rx)} ry={sc(D_PKT.halo.ry)} fill={`url(#${id}-h)`} />
      <ellipse cx={0} cy={0} rx={sc(D_PKT.core.rx)} ry={sc(D_PKT.core.ry)} fill={`url(#${id}-c)`} />
      <ellipse cx={0} cy={0} rx={sc(D_PKT.white.rx)} ry={sc(D_PKT.white.ry)} fill="#FFFFFF" />
    </g>
  );
};

// ------------------------------------------------------------------ the shot
/** the telescope's world scale: the same as beat H's (k0 1.4 at H's low camera), so the two shots agree */
const FZ0 = (() => {
  const e = exitScreen({...lookAt(LOW.pos, LOW.target, LOW.f), roll: LOW.roll});
  return LOW.f / e.z;
})();

export const RevealC3: React.FC<{t: number}> = ({t}) => {
  const tag = `c3-${Math.round(t * 30)}`;
  const cam = c3Cam(t);
  const pulses = c3Pulses(t);
  // near the end the push isolates one packet: the storm recedes (rain out, the sky darkens toward D's air)
  const end = ss(t, 11.05, T2);
  const st = {...quietSt(t, 0), pulses: pulses.filter((h) => Math.abs(h - hF(t)) > 1 || t < T_PUSH + 0.12), beam: 0.9 * (1 - end)};
  const tick = c3Tick(t);
  return (
    <g>
      <View3 cam={cam} st={st} t={t} tag={tag} rain={1 - ss(t, 10.7, 11.2)}>
        <BeamGlow cam={cam} h0={EXIT_H} h1={1000} k={0.8 * (1 - end)} />
        <PulseBloom cam={cam} pulses={st.pulses} k={0.55} id={`${tag}-pb`} />
      </View3>
      <PlacedLaser cam={cam} k0={1.4} fz0={FZ0} flash={0} fire={clamp(0.62 + 0.38 * tick)} tick={tick} t={t} id={`${tag}-l`} />
      {/* the sky darkens to D's air: in the last frames it closes to D's flat background (#131D2B) exactly */}
      {end > 0.01 && <rect x={0} y={0} width={1080} height={1920} fill="#131D2B" opacity={fmt(end * (0.78 + 0.22 * end ** 3))} />}
      {end > 0.01 && <EndLine cam={cam} t={t} k={end} />}
      <FollowGlow cam={cam} t={t} id={`${tag}-fg`} />
    </g>
  );
};
/** the beam over the darkened sky in the last frames, drawn as D draws its axis at the hand-over (Channel3.tsx Micro:
 *  a 2.2 px PAL.laser line at 0.42 over a 9 px PAL.laserGlow glow at 0.1), through F along the beam (a straight 3D
 *  line projects to a straight line, so this is exactly the beam's projection) */
const EndLine: React.FC<{cam: Cam3; t: number; k: number}> = ({cam, t, k}) => {
  const p = projector(cam)(axis3(hF(t)));
  if (!p.ok) return null;
  const a = {x: p.x - UP.x * 2400, y: p.y - UP.y * 2400}, b = {x: p.x + UP.x * 2400, y: p.y + UP.y * 2400};
  const d = `M${fmt(a.x)},${fmt(a.y)} L${fmt(b.x)},${fmt(b.y)}`;
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={fmt(k)}>
      <path d={d} stroke={PAL.laserGlow} strokeOpacity={0.1} strokeWidth={9} />
      <path d={d} stroke={PAL.laser} strokeOpacity={0.42} strokeWidth={2.2} />
    </g>
  );
};
