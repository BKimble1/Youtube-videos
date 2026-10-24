// V5 S11: the lab demonstration, in one locked composition. The transmitter stands on its optical post at the bench
// (screen right); the listener stands eight feet away (screen left) at the end of a yellow floor tape, with a
// colleague beside him. The scientist turns the key; the LASER IN USE light comes on; the beam's thin visualisation
// draws to his ear; he hears, startles, grins and cups his ear; the colleague hears nothing. On "eight feet" the
// tape's foot marks light up in turn to the 8 FT mark at his feet.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {basis, B, proj, v3, V3} from '../v4/rig/geo4';
import {INK, BODY_P, CHECKER, EXTRAS} from '../v4/rig/cast4';
import {Item, poly, box, cyl, paint, polyNode, lineNode, depthOf} from '../v4/draw3';
import {transmitter, exitRay} from '../v4/transmitter4';
import {kv, ss, clamp, lerp, W, H, lookCam} from '../v4/core4';
import {charItem, Who} from '../v4/atriumScene4';
import {stand, face, mix} from '../v4/rig/poses4';
import {Face4, Arm4} from '../v4/rig/Crew4';
import {CharState, earOf, aimAt} from './stage5';
import {BeamLine} from './AtriumV5';
import {WHISPER_LAB} from './cues5';

const L = {
  floor: '#D9DDDA', floorDark: '#C7CCC9', wall: '#EEF1EE', wallShade: '#DDE3E0', trim: '#1CA7A0', ceil: '#E4E8E5', light: '#FFFFFF',
  table: '#3A444B', tableTop: '#55626A', hole: '#2B3338', rack: '#2E3A41', rackFace: '#3D4C54', tape: '#FFC744', red: '#E0483A', redOff: '#7A2E28',
};
const ROOM = {x0: -2.6, x1: 5.2, z0: -4.5, z1: 2.9, h: 3.0};
const FT = 0.3048;
const PIVOT = v3(0, 1.24, 0);
const TABLE = {x0: -0.8, x1: 0.28, z0: -0.45, z1: 0.45, y: 0.84};
const LISTEN_G = v3(8 * FT + 0.24, 0, 0);
const T_ON = 20.42; // the key turns

// ---------------------------------------------------------------- people
const blink = (t: number, ts: number[]) => Math.max(0, ...ts.map((b) => clamp(1 - Math.abs(t - b) / 0.075)));
const lerpV = (a: V3, b: V3, u: number) => v3(lerp(a.x, b.x, u), lerp(a.y, b.y, u), lerp(a.z, b.z, u));
export const listenerAt = (t: number): CharState => {
  const b = BODY_P;
  const hear = ss(WHISPER_LAB[0], WHISPER_LAB[0] + 0.12, t);
  const grin = ss(21.7, 22.0, t);
  const f0 = face({brow: 0.2, mw: 13, curve: 0.2, lid: 0.1, gx: 0.5});
  const fS = face({brow: 1, browIn: 0.3, wide: 1, mw: 11, curve: -0.1, open: 0.35, gx: 0.6});
  const fG = face({brow: 0.9, browIn: 0.2, wide: 0.8, mw: 16, curve: 0.9, open: 0.4, teeth: 0.6, squint: 0.2, gx: -0.6});
  const f: Face4 = {...mix(mix(f0, fS, hear), fG, grin), blink: blink(t, [20.6, 22.9])};
  const p = stand(b, f);
  const cup = ss(21.45, 21.8, t);
  const rest = p.armL.hand;
  const hand = lerpV(rest, v3(b.R + 34, b.hipY + b.spine + b.headUp - 6, -14), cup);
  // he points at his ear for the colleague (22.4..23.1)
  return {ground: LISTEN_G, heading: 180, pose: {...p,
    hy: kv(t, [[20, 10], [21.05, 10], [21.2, 34], [21.7, 26], [22.3, 20], [22.5, -38], [23.37, -34]]), hr: kv(t, [[21.05, 0], [21.3, 10], [23.37, 8]]), hp: kv(t, [[21.05, 2], [21.2, -6], [21.8, 0]]),
    armL: {hand, shape: cup > 0.5 ? 'open' : undefined, pole: v3(1, -0.9, 0.1), wrist: -20}}};
};
export const nearAt = (t: number): CharState => {
  const b = BODY_P;
  const look = ss(22.45, 22.75, t), shrug = kv(t, [[22.75, 0], [22.95, 1], [23.25, 1], [23.37, 0.8]]);
  const f: Face4 = {...mix(face({brow: 0.1, mw: 12, curve: 0.2, lid: 0.3, gy: 0.6}), face({brow: 0.6, browIn: 0.9, asym: 0.8, mw: 11, curve: -0.3, smirk: -0.3, gx: 0.6}), look), blink: blink(t, [20.9, 22.2])};
  const p = stand(b, f);
  const board = v3(10, b.hipY + b.spine - 40, 52);
  const palm = v3(-b.shW - 30, b.hipY + b.spine - 70, 40);
  return {ground: v3(3.2, 0, 0.62), heading: -150, pose: {...p, hy: lerp(-8, 40, look) + 6 * Math.sin(t * 9) * shrug * 0.4, hp: lerp(18, 2, look),
    armL: {hand: board, shape: 'grip'}, armR: {hand: lerpV(p.armR.hand, palm, shrug), shape: shrug > 0.4 ? 'open' : undefined}}};
};
export const sciAt = (t: number): CharState => {
  const b = BODY_P;
  const press = kv(t, [[20.05, 0], [T_ON - 0.02, 1], [20.75, 1], [21.1, 0.2]]);
  const p = stand(b, {...face({brow: -0.2, browIn: -0.3, mw: 13, curve: 0.3, lid: 0.15, gy: 0.5}), blink: blink(t, [21.4, 22.8])});
  const sw = v3(-20, b.hipY + b.spine - 50, 70);
  return {ground: v3(-0.5, 0, 1.12), heading: 180, pose: {...p, hp: kv(t, [[20, 16], [20.8, 16], [21.1, 4]]), hy: kv(t, [[20, 0], [20.8, 0], [21.2, -40]]),
    armR: {hand: lerpV(p.armR.hand, sw, press), shape: press > 0.5 ? 'fist' : undefined}}};
};
const LISTEN_EAR = earOf(listenerAt(20));
const AIM = aimAt(PIVOT, LISTEN_EAR);
const RAY = exitRay(PIVOT, AIM.yaw, AIM.pitch);

// ---------------------------------------------------------------- lettering on the floor and the back wall
// the camera looks along +z, so +x is screen-left: text reads along -x
const planeText = (b: B, c: V3, along: V3, down: V3, text: string, size: number, key: string, fill: string, op = 1) => {
  const e = 0.05;
  const p0 = proj(b, c), pa = proj(b, v3(c.x + along.x * e, c.y + along.y * e, c.z + along.z * e)), pd = proj(b, v3(c.x + down.x * e, c.y + down.y * e, c.z + down.z * e));
  if (p0.z < 0.3) return null;
  return (
    <g key={key} transform={`matrix(${(pa.x - p0.x) / e} ${(pa.y - p0.y) / e} ${(pd.x - p0.x) / e} ${(pd.y - p0.y) / e} ${p0.x} ${p0.y})`} opacity={op}>
      <text x={0} y={0} fontSize={size} fontFamily='"Nunito Variable", "Nunito", sans-serif' fontWeight={900} fill={fill} textAnchor="middle" dominantBaseline="middle">{text}</text>
    </g>
  );
};
const LabShell: React.FC<{b: B; on: number; lit: number; t: number}> = ({b, on, lit, t}) => {
  const {x0, x1, z0, z1, h} = ROOM;
  const o: React.ReactNode[] = [];
  const Q = v3;
  o.push(polyNode(b, [Q(x0, 0, z0), Q(x1, 0, z0), Q(x1, 0, z1), Q(x0, 0, z1)], {fill: L.floor}, 'fl'));
  for (let i = Math.ceil(x0 / 0.6); i <= x1 / 0.6; i++) o.push(lineNode(b, Q(i * 0.6, 0.001, z0), Q(i * 0.6, 0.001, z1), {stroke: L.floorDark, sw: 1.2}, `gx${i}`));
  for (let k = Math.ceil(z0 / 0.6); k <= z1 / 0.6; k++) o.push(lineNode(b, Q(x0, 0.001, k * 0.6), Q(x1, 0.001, k * 0.6), {stroke: L.floorDark, sw: 1.2}, `gz${k}`));
  o.push(polyNode(b, [Q(x0, 0, z1), Q(x1, 0, z1), Q(x1, h, z1), Q(x0, h, z1)], {fill: L.wall}, 'wb'));
  o.push(polyNode(b, [Q(x0, 0, z0), Q(x0, 0, z1), Q(x0, h, z1), Q(x0, h, z0)], {fill: L.wallShade}, 'wl'));
  o.push(polyNode(b, [Q(x1, 0, z0), Q(x1, 0, z1), Q(x1, h, z1), Q(x1, h, z0)], {fill: L.wallShade}, 'wr'));
  o.push(lineNode(b, Q(x0, 0.12, z1 - 0.01), Q(x1, 0.12, z1 - 0.01), {stroke: L.trim, sw: 5}, 'skb'));
  o.push(polyNode(b, [Q(x0, h, z0), Q(x1, h, z0), Q(x1, h, z1), Q(x0, h, z1)], {fill: L.ceil}, 'c'));
  for (let i = 0; i < 4; i++) o.push(polyNode(b, [Q(-1.8 + i * 1.9, h - 0.01, 0.2), Q(-0.8 + i * 1.9, h - 0.01, 0.2), Q(-0.8 + i * 1.9, h - 0.01, 1.4), Q(-1.8 + i * 1.9, h - 0.01, 1.4)], {fill: L.light, stroke: '#AEB8B4', sw: 2}, `cl${i}`));
  // back wall: a whiteboard, a door, the LASER IN USE light
  o.push(polyNode(b, [Q(-2.2, 1.0, z1 - 0.02), Q(-0.6, 1.0, z1 - 0.02), Q(-0.6, 2.1, z1 - 0.02), Q(-2.2, 2.1, z1 - 0.02)], {fill: '#FFFFFF', stroke: '#8C9A98', sw: 4}, 'wbd'));
  [[-2.0, 1.8, -1.4, 1.55], [-2.0, 1.45, -1.0, 1.7], [-1.2, 1.3, -0.75, 1.85]].forEach(([a, b1, c, d], i) => o.push(lineNode(b, Q(a, b1, z1 - 0.03), Q(c, d, z1 - 0.03), {stroke: i === 2 ? L.red : '#3B6FB6', sw: 3}, `scr${i}`)));
  o.push(polyNode(b, [Q(3.7, 0, z1 - 0.01), Q(4.6, 0, z1 - 0.01), Q(4.6, 2.1, z1 - 0.01), Q(3.7, 2.1, z1 - 0.01)], {fill: '#8FA3AD', stroke: INK, sw: 3}, 'door'));
  o.push(polyNode(b, [Q(0.05, 2.28, z1 - 0.02), Q(1.25, 2.28, z1 - 0.02), Q(1.25, 2.62, z1 - 0.02), Q(0.05, 2.62, z1 - 0.02)], {fill: on > 0.5 ? L.red : L.redOff, stroke: INK, sw: 3}, 'sign'));
  if (on > 0.5) o.push(<g key="glow" opacity={0.3 + 0.1 * Math.sin(t * 6)}>{polyNode(b, [Q(-0.1, 2.18, z1 - 0.03), Q(1.4, 2.18, z1 - 0.03), Q(1.4, 2.72, z1 - 0.03), Q(-0.1, 2.72, z1 - 0.03)], {fill: L.red})}</g>);
  o.push(planeText(b, Q(0.65, 2.45, z1 - 0.03), v3(-1, 0, 0), v3(0, -1, 0), 'LASER IN USE', 0.16, 'signt', on > 0.5 ? '#FFFFFF' : '#C9A6A2'));
  // the floor measurement: tape, a tick each foot (lit in turn on "eight feet"), numbers, 8 FT painted at his feet
  const ox = RAY.o.x;
  o.push(polyNode(b, [Q(ox, 0.002, -0.05), Q(ox + 8 * FT, 0.002, -0.05), Q(ox + 8 * FT, 0.002, 0.05), Q(ox, 0.002, 0.05)], {fill: L.tape, stroke: INK, sw: 1.5}, 'tape'));
  for (let i = 0; i <= 8; i++) {
    const x = ox + i * FT;
    const l = clamp(lit - i);
    o.push(lineNode(b, Q(x, 0.003, 0.05), Q(x, 0.003, i % 4 === 0 ? -0.14 : -0.1), {stroke: l > 0 ? '#E0483A' : INK, sw: 2.5 + 2.5 * l}, `tk${i}`));
    if (i > 0 && i < 8) o.push(planeText(b, Q(x, 0.003, -0.24), v3(-1, 0, 0), v3(0, 0, -1), `${i}`, 0.1, `tn${i}`, l > 0 ? '#C0392B' : INK, 0.85));
  }
  const eight = clamp(lit - 8);
  o.push(planeText(b, Q(ox + 8 * FT + 0.02, 0.003, -0.52), v3(-1, 0, 0), v3(0, 0, -1), '8 FT', 0.28, 'eight', eight > 0 ? '#E0483A' : '#B8483B'));
  return <g>{o}</g>;
};

const labItems = (b: B, t: number, on: number): Item[] => {
  const it: Item[] = [];
  it.push(box(b, TABLE.x0, TABLE.x1, TABLE.y - 0.06, TABLE.y, TABLE.z0, TABLE.z1, {top: L.tableTop, side: L.table, front: L.table}, 'tt'));
  const holes: React.ReactNode[] = [];
  for (let i = 0; i < 10; i++) for (let k = 0; k < 8; k++) {
    const p = proj(b, v3(TABLE.x0 + 0.06 + i * 0.1, TABLE.y + 0.001, TABLE.z0 + 0.06 + k * 0.11));
    if (p.z > 0.1) holes.push(<circle key={`${i}-${k}`} cx={p.x} cy={p.y} r={Math.max(0.8, (0.009 * b.c.f) / p.z)} fill={L.hole} />);
  }
  it.push({d: depthOf(b, v3((TABLE.x0 + TABLE.x1) / 2, TABLE.y, 0)) - 0.01, node: <g key="holes">{holes}</g>});
  for (const [x, z] of [[TABLE.x0 + 0.08, TABLE.z0 + 0.08], [TABLE.x1 - 0.08, TABLE.z0 + 0.08], [TABLE.x0 + 0.08, TABLE.z1 - 0.08], [TABLE.x1 - 0.08, TABLE.z1 - 0.08]]) it.push(cyl(b, x, z, 0.06, 0, TABLE.y - 0.06, {side: L.table, top: L.table}, `leg${x}${z}`));
  it.push(box(b, -0.55, -0.35, TABLE.y, TABLE.y + 0.08, 0.3, 0.42, {top: '#E9E2D2', side: '#C9C0AE', front: '#D8D0BE'}, 'sw'));
  const k = proj(b, v3(-0.45, TABLE.y + 0.085, 0.36));
  if (k.z > 0.1) it.push({d: depthOf(b, v3(-0.45, TABLE.y + 0.1, 0.36)) - 0.01, node: <circle key="key" cx={k.x} cy={k.y} r={(0.022 * b.c.f) / k.z} fill={on > 0.5 ? L.red : L.redOff} stroke={INK} strokeWidth={2} />});
  for (let r = 0; r < 3; r++) {
    const x0 = 1.6 + r * 0.7;
    it.push(box(b, x0, x0 + 0.6, 0, 1.9, ROOM.z1 - 0.65, ROOM.z1 - 0.05, {top: L.rack, side: L.rack, front: L.rackFace}, `rk${r}`));
    const leds: React.ReactNode[] = [];
    for (let s = 0; s < 6; s++) for (let c = 0; c < 4; c++) {
      const p = proj(b, v3(x0 + 0.12 + c * 0.11, 0.35 + s * 0.26, ROOM.z1 - 0.66));
      const onL = Math.sin(t * (2 + ((s * 7 + c * 3 + r) % 5)) + s + c) > 0.3;
      if (p.z > 0.1) leds.push(<circle key={`${s}${c}`} cx={p.x} cy={p.y} r={Math.max(1.2, (0.014 * b.c.f) / p.z)} fill={onL ? (c === 0 ? '#5BE08A' : '#FFC744') : '#22302F'} />);
    }
    it.push({d: depthOf(b, v3(x0 + 0.3, 1, ROOM.z1 - 0.66)) - 0.01, node: <g key={`rl${r}`}>{leds}</g>});
  }
  it.push(box(b, -2.5, -1.4, 0, 0.9, 1.6, 2.6, {top: '#E9E2D2', side: '#C9C0AE', front: '#D8D0BE'}, 'bench'));
  it.push(box(b, -2.2, -1.75, 0.9, 1.22, 1.9, 2.3, {top: '#3D4C54', side: '#2E3A41', front: '#2E3A41'}, 'scope'));
  const sc = [v3(-2.15, 0.95, 1.89), v3(-1.8, 0.95, 1.89), v3(-1.8, 1.17, 1.89), v3(-2.15, 1.17, 1.89)];
  it.push(poly(b, sc, {fill: '#0F2A22', stroke: INK, sw: 1.5}, 'scr', -0.02));
  const trace: V3[] = Array.from({length: 24}, (_, i) => v3(-1.82 - i * 0.0137, 1.06 + 0.04 * Math.sin(i * 0.9 + t * 6) * (on > 0.5 ? 1 : 0.15), 1.885));
  it.push({d: depthOf(b, v3(-1.97, 1.06, 1.88)) - 0.03, node: <path key="tr" d={trace.map((p, i) => { const q = proj(b, p); return `${i ? 'L' : 'M'}${q.x.toFixed(1)},${q.y.toFixed(1)}`; }).join('')} fill="none" stroke="#5BE08A" strokeWidth={2} />});
  it.push(...transmitter(b, PIVOT, AIM.yaw, AIM.pitch, {key: 'ltx', mount: 'post', mountTop: TABLE.y, led: on, spin: 0, open: 0}));
  return it;
};

// one locked composition: from the front, a little high; the bench on the right, the listener on the left
const CAM = lookCam(v3(1.35, 1.85, -3.3), v3(1.35, 0.9, 0.35), 900);
export const Lab5: React.FC<{t: number}> = ({t}) => {
  const b = basis({...CAM, f: CAM.f * (1 + 0.02 * clamp((t - 20) / 3.37))});
  const on = t >= T_ON ? 1 : 0;
  const lit = clamp((t - 21.75) / 0.42) * 9; // 0..9 (the ninth is the 8 FT mark), on "eight feet" (22.12)
  const who: Who[] = [
    {s: listenerAt(t), look: EXTRAS[1], id: 'lis'},
    {s: nearAt(t), look: EXTRAS[4], id: 'near'},
    {s: sciAt(t), look: CHECKER, id: 'sci'},
  ];
  const items = labItems(b, t, on);
  for (const w of who) items.push(charItem(b, w, t));
  const beam = ss(T_ON + 0.05, T_ON + 0.2, t);
  const reveal = clamp((t - T_ON - 0.05) / 0.55);
  return (
    <AbsoluteFill style={{background: '#1B2A31'}}>
      <svg width={W} height={H}>
        <LabShell b={b} on={on} lit={lit} t={t} />
        {paint(items)}
        <BeamLine b={b} o={RAY.o} e={LISTEN_EAR} t={t} amt={beam * 0.9} id="lb5" reveal={reveal} />
      </svg>
    </AbsoluteFill>
  );
};
