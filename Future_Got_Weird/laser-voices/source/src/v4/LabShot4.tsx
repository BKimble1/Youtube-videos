// V4 worlds 4 and 5: the lab (an MIT-style photoacoustics bench: optical table, the transmitter on an optical post,
// racks, a LASER IN USE light, an 8 ft floor measurement) and the transmitter's optics seen through its open top.
//   D (15.0..20.05, infrared view): match cut from the eardrum to the beam leaving the window; back to reveal the
//   transmitter; into it (the polygon mirror sweeping the beam across a narrow arc); out along the beam to the
//   listener; up and round to the overhead view: the sweep's sound arrives at the listener all at once.
//   E (20.05..23.4): the scientist switches on; a fast track along the floor tape to the 8 FT mark; the listener hears,
//   the colleague beside him doesn't; push to his ear (match cut to the atrium).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {basis, B, proj, v3, V3, cardOf} from './rig/geo4';
import {INK, BODY_P, CHECKER, EXTRAS} from './rig/cast4';
import {Item, poly, line, box, cyl, paint, polyNode, lineNode, depthOf} from './draw3';
import {transmitter, exitRay, outDir} from './transmitter4';
import {CK, camPath, kv, ss, clamp, lerp, W, H, Cam} from './core4';
import {charItem, Who} from './atriumScene4';
import {CharState, earOf, aimAt} from './story4';
import {stand, face, mix} from './rig/poses4';
import {Face4, Pose4} from './rig/Crew4';
import {IR_FILTER, BeamViz} from './AtriumShot4';
import {WHISPER_LAB} from './cues4';

const L = {
  floor: '#D9DDDA', floorDark: '#C7CCC9', wall: '#EEF1EE', wallShade: '#DDE3E0', trim: '#1CA7A0', ceil: '#E4E8E5', light: '#FFFFFF',
  table: '#3A444B', tableTop: '#55626A', hole: '#2B3338', rack: '#2E3A41', rackFace: '#3D4C54', tape: '#FFC744', tapeInk: '#162A32', red: '#E0483A', redOff: '#7A2E28',
};
const ROOM = {x0: -2.6, x1: 5.2, z0: -3.2, z1: 2.9, h: 3.0};
const FT = 0.3048;
// the bench
export const PIVOT = v3(0, 1.24, 0);
const TABLE = {x0: -0.8, x1: 0.28, z0: -0.45, z1: 0.45, y: 0.84};
// the listener stands side-on with his left ear eight feet from the window
const LISTEN_G = v3(8 * FT + 0.24, 0, 0);
const LISTEN_H = 180;

// ---------------------------------------------------------------- people
const P_LIST = EXTRAS[1], P_NEAR = EXTRAS[4];
const blink = (t: number, ts: number[]) => Math.max(0, ...ts.map((b) => clamp(1 - Math.abs(t - b) / 0.07)));
export const listenerAt = (t: number): CharState => {
  const b = BODY_P;
  const hear = ss(WHISPER_LAB[0], WHISPER_LAB[0] + 0.12, t);
  const f: Face4 = mix(face({brow: 0.2, mw: 13, curve: 0.2, lid: 0.1}), face({brow: 1, browIn: 0.2, wide: 1, mw: 15, curve: 0.75, open: 0.5, teeth: 0.3}), hear);
  const p = stand(b, {...f, blink: blink(t, [16.4, 19.1, 21.0])});
  const cup = ss(22.45, 22.75, t);
  const hand = v3(lerp(b.shW + 16, b.R + 22, cup), lerp(b.hipY + b.spine - b.upper - b.fore + 12, b.hipY + b.spine + b.headUp - 6, cup), lerp(10, -22, cup));
  return {ground: LISTEN_G, heading: LISTEN_H, pose: {...p, hy: kv(t, [[20, 0], [22.3, 0], [22.45, 14], [23.4, 10]]), hr: kv(t, [[22.3, 0], [22.5, 10], [23.4, 12]]), hp: 2, armL: {hand, shape: cup > 0.5 ? 'open' : undefined, pole: v3(0.9, -0.4, -0.3)}}};
};
export const nearAt = (t: number): CharState => {
  const b = BODY_P;
  const look = ss(22.55, 22.85, t);
  const f: Face4 = mix(face({brow: 0.1, mw: 12, curve: 0.2, lid: 0.3}), face({brow: 0.5, browIn: 0.8, asym: 0.8, mw: 11, curve: -0.3, smirk: -0.3}), look);
  const p = stand(b, {...f, blink: blink(t, [17.2, 20.6, 22.0])});
  const board = v3(10, b.hipY + b.spine - 40, 52);
  return {ground: v3(3.55, 0, 0.55), heading: -120, pose: {...p, hy: lerp(-6, 42, look), hp: lerp(16, 2, look), armR: {hand: board, shape: 'grip'}, armL: {hand: v3(30, b.hipY + b.spine - 30, 50), shape: 'open'}}};
};
export const sciAt = (t: number): CharState => {
  const b = BODY_P;
  const press = kv(t, [[20.1, 0], [20.37, 1], [20.6, 1], [20.9, 0.3]]);
  const p = stand(b, {...face({brow: -0.2, browIn: -0.3, mw: 13, curve: 0.3, lid: 0.15}), blink: blink(t, [16.9, 21.4])});
  const rest = p.armR.hand;
  const sw = v3(-20, b.hipY + b.spine - 50, 70);
  return {ground: v3(-0.5, 0, 1.12), heading: 180, pose: {...p, hp: 14, hy: kv(t, [[19.8, 0], [20.7, 0], [21.1, 40]]), armR: {hand: v3(lerp(rest.x, sw.x, press), lerp(rest.y, sw.y, press), lerp(rest.z, sw.z, press)), shape: press > 0.5 ? 'fist' : undefined}}};
};
export const LISTEN_EAR = earOf(listenerAt(20));

// ---------------------------------------------------------------- the beam
const AIM = aimAt(PIVOT, LISTEN_EAR);
const RAY = exitRay(PIVOT, AIM.yaw, AIM.pitch);
// D: the sweep (slow motion): the beam's far end travels along an arc onto his ear at the visual "speed of sound";
// every point it passes emits a little sound, timed so all of it arrives at his ear together
const SWEEP = {t0: 18.55, t1: 19.55, a0: -24, a1: 0};
const C_VIS = (() => {
  const R = Math.hypot(LISTEN_EAR.x - RAY.o.x, LISTEN_EAR.z - RAY.o.z);
  return (R * (Math.abs(SWEEP.a0) * Math.PI) / 180) / (SWEEP.t1 - SWEEP.t0);
})();
const sweepAngle = (t: number) => {
  // before the slow-motion sweep the spinning mirror repeats it fast, one sweep per facet
  if (t < SWEEP.t0 - 0.12) return lerp(SWEEP.a0, SWEEP.a1, ((t * 3.3) % 1));
  if (t < SWEEP.t0) return SWEEP.a0;
  if (t > SWEEP.t1) return SWEEP.a1;
  return lerp(SWEEP.a0, SWEEP.a1, (t - SWEEP.t0) / (SWEEP.t1 - SWEEP.t0));
};
const beamEnd = (deg: number): V3 => {
  const o = RAY.o, e = LISTEN_EAR;
  const R = Math.hypot(e.x - o.x, e.z - o.z), base = Math.atan2(e.z - o.z, e.x - o.x) + (deg * Math.PI) / 180;
  return v3(o.x + R * Math.cos(base), e.y, o.z + R * Math.sin(base));
};

// ---------------------------------------------------------------- the room
// floor lettering: reads along +z, its top toward +x (for the camera running down the tape from the -z side)
const floorText = (b: B, c: V3, text: string, size: number, key: string, fill: string, op = 1) => {
  // a local affine fit (5 cm basis), only when the whole patch is well in front of the camera
  const e = 0.05;
  const p0 = proj(b, c), px = proj(b, v3(c.x, c.y, c.z + e)), pz = proj(b, v3(c.x - e, c.y, c.z));
  const far = [v3(c.x - size * 2, c.y, c.z - size * 3), v3(c.x + size * 2, c.y, c.z + size * 3), v3(c.x - size * 2, c.y, c.z + size * 3), v3(c.x + size * 2, c.y, c.z - size * 3)];
  if (p0.z < 0.3 || far.some((q) => proj(b, q).z < 0.3)) return null;
  return (
    <g key={key} transform={`matrix(${(px.x - p0.x) / e} ${(px.y - p0.y) / e} ${(pz.x - p0.x) / e} ${(pz.y - p0.y) / e} ${p0.x} ${p0.y})`} opacity={op}>
      <text x={0} y={0} fontSize={size} fontFamily='"Nunito Variable", "Nunito", sans-serif' fontWeight={900} fill={fill} textAnchor="middle" dominantBaseline="middle">{text}</text>
    </g>
  );
};
const wallText = (b: B, c: V3, text: string, size: number, key: string, fill: string) => {
  // on the wall x = ROOM.x1 (facing -x): text runs along +z
  const e = 0.05;
  const p0 = proj(b, c), pa = proj(b, v3(c.x, c.y, c.z + e)), pd = proj(b, v3(c.x, c.y - e, c.z));
  if (p0.z < 0.3) return null;
  return <g key={key} transform={`matrix(${(pa.x - p0.x) / e} ${(pa.y - p0.y) / e} ${(pd.x - p0.x) / e} ${(pd.y - p0.y) / e} ${p0.x} ${p0.y})`}><text x={0} y={0} fontSize={size} fontFamily='"Nunito Variable", "Nunito", sans-serif' fontWeight={900} fill={fill} textAnchor="middle" dominantBaseline="middle">{text}</text></g>;
};
const LabShell: React.FC<{b: B; on: number}> = ({b, on}) => {
  const {x0, x1, z0, z1, h} = ROOM;
  const o: React.ReactNode[] = [];
  const Q = v3;
  o.push(polyNode(b, [Q(x0, 0, z0), Q(x1, 0, z0), Q(x1, 0, z1), Q(x0, 0, z1)], {fill: L.floor}, 'fl'));
  for (let i = Math.ceil(x0 / 0.6); i <= x1 / 0.6; i++) o.push(lineNode(b, Q(i * 0.6, 0.001, z0), Q(i * 0.6, 0.001, z1), {stroke: L.floorDark, sw: 1.2}, `gx${i}`));
  for (let k = Math.ceil(z0 / 0.6); k <= z1 / 0.6; k++) o.push(lineNode(b, Q(x0, 0.001, k * 0.6), Q(x1, 0.001, k * 0.6), {stroke: L.floorDark, sw: 1.2}, `gz${k}`));
  // walls
  o.push(polyNode(b, [Q(x0, 0, z1), Q(x1, 0, z1), Q(x1, h, z1), Q(x0, h, z1)], {fill: L.wall}, 'wb'));
  o.push(polyNode(b, [Q(x0, 0, z0), Q(x1, 0, z0), Q(x1, h, z0), Q(x0, h, z0)], {fill: L.wall}, 'wf'));
  o.push(polyNode(b, [Q(x0, 0, z0), Q(x0, 0, z1), Q(x0, h, z1), Q(x0, h, z0)], {fill: L.wallShade}, 'wl'));
  o.push(polyNode(b, [Q(x1, 0, z0), Q(x1, 0, z1), Q(x1, h, z1), Q(x1, h, z0)], {fill: L.wallShade}, 'wr'));
  for (const [a, c, k] of [[Q(x0, 0.12, z1 - 0.01), Q(x1, 0.12, z1 - 0.01), 'skb'], [Q(x0, 0.12, z0 + 0.01), Q(x1, 0.12, z0 + 0.01), 'skf']] as [V3, V3, string][]) o.push(lineNode(b, a, c, {stroke: L.trim, sw: 5}, k));
  o.push(polyNode(b, [Q(x0, h, z0), Q(x1, h, z0), Q(x1, h, z1), Q(x0, h, z1)], {fill: L.ceil}, 'c'));
  for (let i = 0; i < 4; i++) o.push(polyNode(b, [Q(-1.8 + i * 1.9, h - 0.01, -0.6), Q(-0.8 + i * 1.9, h - 0.01, -0.6), Q(-0.8 + i * 1.9, h - 0.01, 0.6), Q(-1.8 + i * 1.9, h - 0.01, 0.6)], {fill: L.light, stroke: '#AEB8B4', sw: 2}, `cl${i}`));
  // a whiteboard on the back wall, a door + the LASER IN USE light on the right wall
  o.push(polyNode(b, [Q(-1.9, 1.0, z1 - 0.02), Q(0.6, 1.0, z1 - 0.02), Q(0.6, 2.1, z1 - 0.02), Q(-1.9, 2.1, z1 - 0.02)], {fill: '#FFFFFF', stroke: '#8C9A98', sw: 4}, 'wbd'));
  [[-1.6, 1.8, -0.9, 1.55], [-1.6, 1.45, -0.4, 1.7], [-0.2, 1.3, 0.4, 1.85]].forEach(([a, b1, c, d], i) => o.push(lineNode(b, Q(a, b1, z1 - 0.03), Q(c, d, z1 - 0.03), {stroke: i === 2 ? L.red : '#3B6FB6', sw: 3}, `scr${i}`)));
  o.push(polyNode(b, [Q(x1 - 0.01, 0, -2.4), Q(x1 - 0.01, 0, -1.4), Q(x1 - 0.01, 2.1, -1.4), Q(x1 - 0.01, 2.1, -2.4)], {fill: '#8FA3AD', stroke: INK, sw: 3}, 'door'));
  o.push(polyNode(b, [Q(x1 - 0.02, 2.25, -2.5), Q(x1 - 0.02, 2.25, -1.3), Q(x1 - 0.02, 2.6, -1.3), Q(x1 - 0.02, 2.6, -2.5)], {fill: on > 0.5 ? L.red : L.redOff, stroke: INK, sw: 3}, 'sign'));
  o.push(wallText(b, Q(x1 - 0.03, 2.425, -1.9), 'LASER IN USE', 0.17, 'signt', on > 0.5 ? '#FFFFFF' : '#C9A6A2'));
  if (on > 0.5) o.push(<g key="glow" opacity={0.35}>{polyNode(b, [Q(x1 - 0.03, 2.15, -2.6), Q(x1 - 0.03, 2.15, -1.2), Q(x1 - 0.03, 2.7, -1.2), Q(x1 - 0.03, 2.7, -2.6)], {fill: L.red})}</g>);
  // the floor measurement: a yellow tape from under the window to the listener, a tick every foot, 8 FT stencilled
  const ox = RAY.o.x;
  o.push(polyNode(b, [Q(ox, 0.002, -0.05), Q(ox + 8 * FT, 0.002, -0.05), Q(ox + 8 * FT, 0.002, 0.05), Q(ox, 0.002, 0.05)], {fill: L.tape, stroke: INK, sw: 1.5}, 'tape'));
  for (let i = 0; i <= 8; i++) {
    const x = ox + i * FT;
    o.push(lineNode(b, Q(x, 0.003, 0.05), Q(x, 0.003, i % 4 === 0 ? -0.14 : -0.09), {stroke: INK, sw: 2.5}, `tk${i}`));
    if (i > 0 && i < 8) o.push(floorText(b, Q(x, 0.003, -0.22), `${i}`, 0.09, `tn${i}`, INK, 0.8));
  }
  o.push(floorText(b, Q(ox + 8 * FT - 0.17, 0.003, -0.5), '8 FT', 0.26, 'eight', '#C0392B'));
  return <g>{o}</g>;
};

const labItems = (b: B, t: number, o: {open: number; spin: number; on: number; ir: number}): Item[] => {
  const it: Item[] = [];
  // optical table: top with a hole grid, legs
  it.push(box(b, TABLE.x0, TABLE.x1, TABLE.y - 0.06, TABLE.y, TABLE.z0, TABLE.z1, {top: L.tableTop, side: L.table, front: L.table}, 'tt'));
  const holes: React.ReactNode[] = [];
  for (let i = 0; i < 10; i++) for (let k = 0; k < 8; k++) {
    const p = proj(b, v3(TABLE.x0 + 0.06 + i * 0.1, TABLE.y + 0.001, TABLE.z0 + 0.06 + k * 0.11));
    if (p.z > 0.1) holes.push(<circle key={`${i}-${k}`} cx={p.x} cy={p.y} r={Math.max(0.8, (0.009 * b.c.f) / p.z)} fill={L.hole} />);
  }
  it.push({d: depthOf(b, v3((TABLE.x0 + TABLE.x1) / 2, TABLE.y, 0)) - 0.01, node: <g key="holes">{holes}</g>});
  for (const [x, z] of [[TABLE.x0 + 0.08, TABLE.z0 + 0.08], [TABLE.x1 - 0.08, TABLE.z0 + 0.08], [TABLE.x0 + 0.08, TABLE.z1 - 0.08], [TABLE.x1 - 0.08, TABLE.z1 - 0.08]]) it.push(cyl(b, x, z, 0.06, 0, TABLE.y - 0.06, {side: L.table, top: L.table}, `leg${x}${z}`));
  // switch box on the table's near edge
  it.push(box(b, -0.55, -0.35, TABLE.y, TABLE.y + 0.08, 0.3, 0.42, {top: '#E9E2D2', side: '#C9C0AE', front: '#D8D0BE'}, 'sw'));
  const k = proj(b, v3(-0.45, TABLE.y + 0.085, 0.36));
  if (k.z > 0.1) it.push({d: depthOf(b, v3(-0.45, TABLE.y + 0.1, 0.36)) - 0.01, node: <circle key="key" cx={k.x} cy={k.y} r={(0.022 * b.c.f) / k.z} fill={o.on > 0.5 ? L.red : L.redOff} stroke={INK} strokeWidth={2} />});
  // racks along the back wall with blinking status lights
  for (let r = 0; r < 3; r++) {
    const x0 = 1.0 + r * 0.7;
    it.push(box(b, x0, x0 + 0.6, 0, 1.9, ROOM.z1 - 0.65, ROOM.z1 - 0.05, {top: L.rack, side: L.rack, front: L.rackFace}, `rk${r}`));
    const leds: React.ReactNode[] = [];
    for (let s = 0; s < 6; s++) for (let c = 0; c < 4; c++) {
      const p = proj(b, v3(x0 + 0.12 + c * 0.11, 0.35 + s * 0.26, ROOM.z1 - 0.66));
      const onL = Math.sin(t * (2 + ((s * 7 + c * 3 + r) % 5)) + s + c) > 0.3;
      if (p.z > 0.1) leds.push(<circle key={`${s}${c}`} cx={p.x} cy={p.y} r={Math.max(1.2, (0.014 * b.c.f) / p.z)} fill={onL ? (c === 0 ? '#5BE08A' : '#FFC744') : '#22302F'} />);
    }
    it.push({d: depthOf(b, v3(x0 + 0.3, 1, ROOM.z1 - 0.66)) - 0.01, node: <g key={`rl${r}`}>{leds}</g>});
  }
  // a bench with an oscilloscope by the left wall
  it.push(box(b, -2.5, -1.4, 0, 0.9, 1.6, 2.6, {top: '#E9E2D2', side: '#C9C0AE', front: '#D8D0BE'}, 'bench'));
  it.push(box(b, -2.2, -1.75, 0.9, 1.22, 2.0, 2.4, {top: '#3D4C54', side: '#2E3A41', front: '#2E3A41'}, 'scope'));
  const sc = [v3(-2.15, 0.95, 1.99), v3(-1.8, 0.95, 1.99), v3(-1.8, 1.17, 1.99), v3(-2.15, 1.17, 1.99)];
  it.push(poly(b, sc, {fill: '#0F2A22', stroke: INK, sw: 1.5}, 'scr', -0.02));
  const trace: V3[] = Array.from({length: 24}, (_, i) => v3(-2.13 + i * 0.0137, 1.06 + 0.04 * Math.sin(i * 0.9 + t * 6) * (o.on > 0.5 ? 1 : 0.15), 1.985));
  it.push({d: depthOf(b, v3(-1.97, 1.06, 1.98)) - 0.03, node: <path key="tr" d={trace.map((p, i) => { const q = proj(b, p); return `${i ? 'L' : 'M'}${q.x.toFixed(1)},${q.y.toFixed(1)}`; }).join('')} fill="none" stroke="#5BE08A" strokeWidth={2} />});
  // the transmitter on its optical post
  it.push(...transmitter(b, PIVOT, AIM.yaw + (o.ir > 0 ? 0 : 0), AIM.pitch, {key: 'ltx', mount: 'post', mountTop: TABLE.y, led: o.on, spin: o.spin, open: o.open}));
  return it;
};

// ---------------------------------------------------------------- camera
const E = LISTEN_EAR;
const add = (a: V3, x: number, y: number, z: number) => v3(a.x + x, a.y + y, a.z + z);
const k = (t: number, pos: V3, at: V3, f: number): CK => ({t, pos, at, f});
const W0 = RAY.o;
const KEYS: CK[] = [
  // D (infrared view): the beam leaving the window, matching the canal it has just left
  k(15.0, add(W0, 0.38, 0.03, 0.55), add(W0, 0.3, 0, 0), 1250),
  k(15.55, v3(0.45, 1.55, 1.35), v3(-0.05, 1.12, 0), 1100),
  // into the machine: down through its open top
  k(16.05, add(PIVOT, 0.0, 0.62, 0.16), add(PIVOT, 0.0, 0.09, 0), 1300),
  k(17.25, add(PIVOT, 0.04, 0.55, 0.14), add(PIVOT, 0.03, 0.09, 0), 1400),
  // out of the window and along the beam
  k(17.65, add(W0, 0.25, 0.12, 0.38), add(W0, 0.9, -0.02, 0), 1050),
  k(18.35, add(E, -0.9, 0.25, -0.65), add(E, 0, -0.05, 0), 1050),
  // up and round: the overhead view of the sweep
  k(18.85, add(E, -0.75, 1.35, -1.35), add(E, -0.6, -0.5, 0.1), 860),
  k(19.95, add(E, -1.0, 1.45, -1.75), add(E, -0.85, -0.6, 0.1), 760),
  // E (normal view): the scientist at the switch
  k(20.3, v3(-1.0, 1.55, -0.95), v3(-0.45, 1.0, 0.6), 1100),
  k(20.7, v3(-0.8, 1.35, -1.1), v3(-0.4, 0.95, 0.5), 1200),
  // along the floor tape, fast and low
  k(21.05, v3(0.55, 0.42, -0.85), v3(1.4, 0.08, -0.1), 900),
  k(21.75, v3(1.6, 0.42, -0.66), v3(2.45, 0.03, -0.2), 950),
  // 8 FT, then up to the listener (and the colleague behind him who hears nothing)
  k(22.2, v3(1.95, 1.1, -0.85), v3(2.45, 0.02, -0.35), 1000),
  k(22.6, v3(2.1, 1.6, -1.6), v3(2.75, 1.2, 0.25), 1000),
  k(23.0, v3(2.15, 1.58, -1.45), v3(2.72, 1.25, 0.2), 1080),
  // push to his ear: match cut to the atrium
  k(23.4, add(E, -0.55, 0.05, -0.36), add(E, 0, 0.02, 0), 1700),
];
export const labCam = (t: number): Cam => camPath(KEYS, t);

// ---------------------------------------------------------------- the shot
const SPIN_RATE = 2.2; // rev/s (slow motion)
export const LabShot: React.FC<{t: number}> = ({t}) => {
  const b = basis(labCam(t));
  const D = t < 20.2;
  const open = D ? ss(15.7, 16.05, t) * (1 - ss(17.3, 17.6, t)) : 0;
  const ir = D ? (1 - ss(15.75, 16.0, t) * (1 - ss(17.3, 17.55, t))) * (1 - ss(19.95, 20.2, t)) : 0; // the cutaway is a diagram, not the IR view
  const on = t < 19.95 ? 1 : t < 20.37 ? 0 : 1;
  const spin = t * SPIN_RATE * 2 * Math.PI;
  const who: Who[] = [
    {s: listenerAt(t), look: P_LIST, id: 'lis'},
    {s: nearAt(t), look: P_NEAR, id: 'near'},
    {s: sciAt(t), look: CHECKER, id: 'sci'},
  ];
  const items = labItems(b, t, {open, spin, on, ir});
  for (const w of who) items.push(charItem(b, w, t));
  // the clipboard (screen-space, at the colleague's hands)
  const scene = (
    <g>
      <LabShell b={b} on={on} />
      {paint(items)}
    </g>
  );
  // the beam in the infrared view: fixed on his ear, except during the sweep demonstration
  const swept = t > 17.6 && t < 20.2;
  const end = swept ? beamEnd(sweepAngle(t)) : E;
  // the sweep's wavelets (horizontal rings at ear height): each passed point emits as the beam passes it
  const rings: React.ReactNode[] = [];
  if (D && t > SWEEP.t0) {
    const n = 14;
    for (let i = 0; i < n; i++) {
      const ti = lerp(SWEEP.t0, SWEEP.t1, i / (n - 1));
      if (ti > t) break;
      const r = C_VIS * (t - ti);
      const c = beamEnd(lerp(SWEEP.a0, SWEEP.a1, i / (n - 1)));
      const pts = Array.from({length: 40}, (_, q) => proj(b, v3(c.x + r * Math.cos((q / 40) * 2 * Math.PI), c.y, c.z + r * Math.sin((q / 40) * 2 * Math.PI))));
      if (pts.some((p) => p.z < 0.1)) continue;
      const op = 0.95 * clamp(1 - r / 2.2);
      rings.push(<path key={i} d={`M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')}Z`} fill="none" stroke="#BFE9F0" strokeWidth={4} opacity={op} />);
    }
  }
  // where they all meet: his ear, at the end of the sweep
  const meet = D ? clamp(1 - Math.abs(t - SWEEP.t1) / 0.25) : 0;
  const me = proj(b, E);
  return (
    <AbsoluteFill style={{background: '#1B2A31'}}>
      <svg width={W} height={H}>
        <defs>{IR_FILTER('lirf')}</defs>
        {ir < 1 && <g opacity={1}>{scene}</g>}
        {ir > 0 && <g opacity={ir}><g filter="url(#lirf)">{scene}</g></g>}
        {ir > 0 && <BeamViz b={b} o={RAY.o} e={end} t={t} id="lbv" amt={ir} />}
        {ir > 0 && <g opacity={ir}>{rings}</g>}
        {meet > 0 && me.z > 0.1 && <circle cx={me.x} cy={me.y} r={(0.1 + 0.15 * meet) * b.c.f / me.z} fill="#BFE9F0" opacity={0.45 * meet} />}
      </svg>
    </AbsoluteFill>
  );
};
export {LISTEN_G, outDir, line, cardOf};
