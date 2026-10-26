// V4 beat C3 (9.67-11.42), V3's reveal (v3/Machine3_reveal.tsx RevealC3) rebuilt round V4's physically sized telescope
// (Open4_laser PlacedLaser4, 2.3 m on its fork mount on the terrace beside the summit station; V3's 38 m tube made the
// station read as a doll's house). V4 review ST-2/W-5: at V3's distance (95 m) that telescope is a speck, smaller than
// each packet it fires, and the C2 -> C3 cut lost V3's match from C2's optics duct to the telescope. So:
//   - the shot opens close on the telescope (about 6 m away): the tube large, its exit window on E0, where C2's duct
//     leads, the beam leaving it up and to the right at MICRO_ANG, as the duct ran: "the pulses leave the machine";
//   - the packets leave the window on the sound-locked ticks (EV.windowPackets + k/9) as small packets in proportion to
//     the tube (Demo4_packets: about 0.6 m long, their glow inside the aperture), leaving the window at C2's duct
//     speed on screen (about 1,300 px/s, so the train carries straight on across the cut), then accelerating up the
//     beam and growing to V3's size as they leave the terrace; each packet follows V3's motion exactly from 0.8 s
//     after its tick (pktH4), so the packet the camera pushes into, and the train round it, are V3's from 10.74 on;
//   - the camera holds the telescope while the first packets leave (rising and backing off slowly, the window sinking
//     a little), then, from just after the pushed-into packet leaves (9.96), hands over to V3's crane (v3 c3Cam) by
//     one quintic blend of every parameter that ends at the push swell (10.98): it cranes up and back along the beam,
//     past the summit station beside the telescope and up the tower, the zoom only ever tightening. From 10.98 on it
//     is V3's shot exactly: the push into one packet with FollowGlow and EndLine, so the C3 -> D contract (342 | 343:
//     the packet glow centred on (540, 960), moving up the beam at MICRO_ANG) is V3's (frames 340, 342 and 343 are
//     pixel-identical to V3's).
import React from 'react';
import {clamp, fmt} from '../dc/math';
import {ss} from '../lib';
import {axis3, Cam3, EXIT3, len3, projector, sub3, v3, V3} from '../v2/p3';
import {camScreen} from '../v2/Composite';
import {beamOnScreen, View3} from '../v3/view3';
import {quietSt} from '../v3/states3';
import {MICRO_ANG} from '../v3/cams3';
import {PAL} from '../v3/palette';
import {B, EV} from '../v3/timeline3';
import {BeamGlow} from '../v3/Machine3_fx';
import {C3_V, c3Cam, c3Tick, E0, exitT, hF, K_F, pktClock} from '../v3/Machine3_reveal';
import {EXIT_H} from '../world/site';
import {PlacedLaser4, telescopeOnScreen} from './Open4_laser';
import {ExitGlow4} from './End4_fx';
import {q5, Q5} from './cams4_demo';
import {Packets4} from './Demo4_packets';

const T0 = B.C3, T_PUSH = EV.pushIntoPulse, T2 = B.D;
const RAD = (MICRO_ANG * Math.PI) / 180;
const UP = {x: Math.sin(RAD), y: -Math.cos(RAD)};

// ------------------------------------------------------------------ the packet train
/** a packet's distance from the exit window (site px) at age tau (s on V3's train clock since its tick): it leaves at
 *  V0 and accelerates (C2 quintic) onto V3's constant speed C3_V, on which it is exactly V3's packet from TAU1 on */
const V0 = 46; // site px/s: about 7.8 m/s, which the opening's ~170 px/m turns into C2's duct speed (~1,300 px/s)
const TAU1 = 0.8;
const G_KEYS: Q5[] = [[0, 0, V0, 0], [TAU1, C3_V * TAU1, C3_V, 0]];
const gOf = (tau: number) => (tau < 0 ? -1 : tau >= TAU1 ? C3_V * tau : q5(tau, G_KEYS));
/** packet k's height on the beam axis (site px; below EXIT_H: not yet fired) */
export const pktH4 = (k: number, t: number) => EXIT_H + gOf(pktClock(t) - exitT(k));
/** the packet the camera pushes into (V3's K_F: it leaves on the fourth tick, 9.94; equal to V3's hF from 10.74) */
export const hF4 = (t: number) => pktH4(K_F, t);
const pulsesAt = (t: number) => {
  const out: number[] = [];
  for (let k = -30; k <= 30; k++) {
    const h = pktH4(k, t);
    if (h >= EXIT_H && h <= 1000) out.push(h);
  }
  return out;
};
// ------------------------------------------------------------------ the camera
/** (V3's solveCam) a camera at pos with axis3(h) at screen (sx, sy), focal length f, and the roll that runs the beam at
 *  MICRO_ANG */
const solveCam = (pos: V3, h: number, f: number, sx: number, sy: number): Cam3 => {
  const aim = axis3(h);
  let roll = 0;
  let c = camScreen(pos, aim, f, sx, sy, roll);
  for (let i = 0; i < 6; i++) {
    const b = beamOnScreen(c, h);
    roll += MICRO_ANG - b.ang;
    c = camScreen(pos, aim, f, sx, sy, roll);
  }
  return c;
};
/** V3's camera parameters read back from c3Cam (position, focal length, the pushed-into packet's screen point) */
const v3Rig = (t: number) => {
  const c = c3Cam(t);
  const p = projector(c)(axis3(hF(t)));
  return {pos: c.pos, lf: Math.log(c.f), sx: p.x, sy: p.y, h: hF(t)};
};
/** the telescope rig (the opening): about 5.6 m from the exit window, from V3's direction (a little right of and above
 *  the window, in front of the beam), on V3's opening focal length, looking at the window, which sits on E0 (where C2's
 *  duct leads) with the beam leaving it at MICRO_ANG; the camera rises and backs off slowly (it was already moving at
 *  the cut, as C2's tilt up the duct was) while the window sinks a little in the frame */
const OPEN_D = 5.6, OPEN_DIR = v3(0.121, 0.195, -0.973), OPEN_LF = Math.log(931);
const telRig = (t: number) => {
  const u = t - T0;
  const pos = v3(EXIT3.x + OPEN_DIR.x * OPEN_D + 0.2 * u + 0.25 * u * u, EXIT3.y + OPEN_DIR.y * OPEN_D + 2.0 * u + 3 * u * u, EXIT3.z + OPEN_DIR.z * OPEN_D - 1.5 * u - 4 * u * u);
  const k = ss(t, T0, T0 + 0.6);
  return {pos, lf: OPEN_LF, sx: E0.x - 22 * k, sy: E0.y + 90 * k, h: EXIT_H};
};
/** the hand-over from the telescope rig to V3's crane: from just after the pushed-into packet leaves the window (9.94)
 *  to the push swell, every parameter blended with one quintic smoothstep (its rate and acceleration vanish at both
 *  ends, so the camera is C2 into V3's push). The focal length blends in ln f between 931 and V3's (which only grows),
 *  so it never widens */
const B0 = 9.96, B1 = T_PUSH;
const sm5 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (10 - 15 * x + 6 * x * x));
export const c3Cam4 = (t: number): Cam3 => {
  if (t >= B1) return c3Cam(t);
  const a = telRig(Math.max(t, T0));
  const w = sm5((t - B0) / (B1 - B0));
  if (w <= 0) return solveCam(a.pos, a.h, Math.exp(a.lf), a.sx, a.sy);
  const b = v3Rig(t);
  const m = (x: number, y: number, k = w) => x + (y - x) * k;
  // the camera backs away from the beam plane a little ahead of the rest of the blend (it reaches V3's distance 0.2 s
  // before the push), so it does not pass as close to the tower as a plain blend would (it would crowd the frame)
  const wz = sm5((t - B0) / (B1 - 0.2 - B0));
  return solveCam(v3(m(a.pos.x, b.pos.x), m(a.pos.y, b.pos.y), m(a.pos.z, b.pos.z, wz)), m(a.h, b.h), Math.exp(m(a.lf, b.lf)), m(a.sx, b.sx), m(a.sy, b.sy));
};

// ------------------------------------------------------------------ the pushed-into packet (V3, unchanged)
/** (V3) the scale at the pushed-into packet (screen px per metre): the camera's f over its distance to the packet */
const zAim = (t: number) => {
  const tt = Math.min(t, T2);
  const c = c3Cam(tt);
  return c.f / len3(sub3(axis3(hF(tt)), c.pos));
};
/** (V3, unchanged) D's opening packet, in screen px along MICRO_ANG */
const D_PKT = {bloomR: 430, halo: {rx: 118 * 1.35 * 1.32, ry: 250 * 1.35 * 1.32}, core: {rx: 30 * 1.21 * 1.32, ry: 118 * 1.21 * 1.32}, white: {rx: 9 * 1.32, ry: 62 * 1.32}};
const FollowGlow: React.FC<{cam: Cam3; t: number; id: string}> = ({cam, t, id}) => {
  const k = ss(t, T_PUSH - 0.1, T_PUSH + 0.12);
  if (k <= 0.005) return null;
  const p = projector(cam)(axis3(hF(t)));
  if (!p.ok) return null;
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

// ------------------------------------------------------------------ the shot
export const RevealC3V4: React.FC<{t: number}> = ({t}) => {
  const tag = `c3v4-${Math.round(t * 30)}`;
  const cam = c3Cam4(t);
  const end = ss(t, 11.05, T2);
  const pulses = pulsesAt(t).filter((h) => Math.abs(h - hF(t)) > 1 || t < T_PUSH + 0.12);
  // View3 draws the beam line; the packets are drawn here (sized to the telescope near it)
  const st = {...quietSt(t, 0), pulses: [] as number[], beam: 0.9 * (1 - end)};
  const tick = c3Tick(t);
  // the exit window's wide-view glow only once the telescope is small on screen (close, its own window glows)
  const tel = telescopeOnScreen(cam);
  const exitK = 1 - ss(tel.k, 0.07, 0.16);
  return (
    <g>
      <View3 cam={cam} st={st} t={t} tag={tag} rain={1 - ss(t, 10.7, 11.2)}>
        <BeamGlow cam={cam} h0={EXIT_H} h1={1000} k={0.8 * (1 - end)} />
        <ExitGlow4 cam={cam} k={exitK * (1 - ss(t, 10.5, 10.9))} tick={clamp(tick)} id={`${tag}-eg`} />
      </View3>
      <PlacedLaser4 cam={cam} flash={0} fire={clamp(0.62 + 0.38 * tick)} tick={tick} t={t} id={`${tag}-l`} />
      <Packets4 cam={cam} pulses={pulses} alpha={0.9 * (1 - end)} bloom={0.55} id={`${tag}-pk`} />
      {end > 0.01 && <rect x={0} y={0} width={1080} height={1920} fill="#131D2B" opacity={fmt(end * (0.78 + 0.22 * end ** 3))} />}
      {end > 0.01 && <EndLine cam={cam} t={t} k={end} />}
      <FollowGlow cam={cam} t={t} id={`${tag}-fg`} />
    </g>
  );
};
