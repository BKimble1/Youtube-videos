// V6 (from V5) D and C2: the lab demonstration (and, in the same lab, the sweep explanation).
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
import {charItem, Who, BeamLine} from './AtriumV6';
import {stand, face, mix} from '../v4/rig/poses4';
import {Face4, Arm4} from './rig/Crew6';
import {CharState, earOf, aimAt} from './stage6';
import {WHISPER_LAB} from './cues6';

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
const NEAR_G = v3(0.35, 0, 1.6); // the colleague: a metre from his ear, behind the beam, clear of him in both shots

// ---------------------------------------------------------------- people
const blink = (t: number, ts: number[]) => Math.max(0, ...ts.map((b) => clamp(1 - Math.abs(t - b) / 0.075)));
const lerpV = (a: V3, b: V3, u: number) => v3(lerp(a.x, b.x, u), lerp(a.y, b.y, u), lerp(a.z, b.z, u));
const via = (a: V3, m: V3, c: V3, u: number) => lerpV(lerpV(a, m, u), lerpV(m, c, u), u);
export const listenerAt = (t: number): CharState => {
  const b = BODY_P;
  const hear = ss(WHISPER_LAB[0] + 0.05, WHISPER_LAB[0] + 0.2, t);
  const grin = ss(21.75, 22.05, t);
  const f0 = face({brow: 0.2, mw: 13, curve: 0.2, lid: 0.1, gx: 0.2});
  const fS = face({brow: 1, browIn: 0.3, wide: 1, mw: 11, curve: -0.1, open: 0.35, gx: 0.9});
  const fG = face({brow: 0.9, browIn: 0.2, wide: 0.8, mw: 16, curve: 0.9, open: 0.4, teeth: 0.6, squint: 0.2, gx: -0.7});
  const f: Face4 = {...mix(mix(f0, fS, hear), fG, grin), blink: blink(t, [20.6, 22.9])};
  const p = stand(b, f);
  // the arm comes up (elbow leading) to cup the ear, then points at it for the colleague
  const cup = kv(t, [[21.25, 0], [21.7, 1], [22.3, 1], [22.45, 0.6]]), pt = kv(t, [[22.3, 0], [22.55, 1], [23.37, 1]]);
  const restL = p.armL.hand, chest = v3(b.shW + 30, b.hipY + b.spine - 40, 40);
  const cupAt = v3(b.R + 22, b.hipY + b.spine + b.headUp - 18, 2), tipAt = v3(b.R + 6, b.hipY + b.spine + b.headUp - 16, 14);
  let armL: Arm4 = {...p.armL, shape: 'relax'};
  if (pt > 0.001) armL = {hand: lerpV(cupAt, tipAt, ss(0, 1, pt)), shape: pt > 0.4 ? 'point' : 'cup', pole: v3(1, -0.35, 0)};
  else if (cup > 0.001) armL = {hand: via(restL, chest, cupAt, ss(0, 1, cup)), shape: cup > 0.7 ? 'cup' : 'relax', pole: v3(1, lerp(-0.9, -0.25, cup), lerp(0.3, -0.1, cup)), wrist: lerp(0, 170, ss(0.55, 1, cup))};
  const lift = kv(t, [[21.1, 0], [21.25, 1], [21.8, 0]]);
  p.pel = v3(0, b.hipY + 4 * lift, 0);
  return {ground: LISTEN_G, heading: 180, pose: {...p, armL,
    hy: kv(t, [[20, 4], [21.1, 4], [21.25, 34], [21.65, -20], [22.3, -16], [22.6, 62], [23.37, 58]]), hr: kv(t, [[21.1, 0], [21.35, 10], [23.37, 8]]), hp: kv(t, [[21.1, 2], [21.25, -6], [21.8, 0]])}};
};
export const nearAt = (t: number): CharState => {
  const b = BODY_P;
  const look = ss(22.5, 22.75, t), shrug = kv(t, [[22.8, 0], [23.0, 1], [23.37, 1]]);
  const f: Face4 = {...mix(face({brow: 0.1, mw: 12, curve: 0.2, lid: 0.3, gy: 0.6}), face({brow: 0.6, browIn: 0.9, asym: 0.8, mw: 11, curve: -0.3, smirk: -0.3, gx: 0.6}), look), blink: blink(t, [20.9, 22.2])};
  const p = stand(b, f);
  // writing on the clipboard until she looks up; then a shrug, the free hand palm-up
  const write = (1 - look) * Math.sin(t * 9) * 4;
  const board = v3(10, b.hipY + b.spine - 40, 52);
  const pen = v3(-30 + write, b.hipY + b.spine - 32 + write * 0.5, 64);
  const palm = v3(-b.shW - 32, b.hipY + b.spine - 70, 44);
  return {ground: NEAR_G, heading: 190, pose: {...p, hy: lerp(0, -50, look) + 4 * Math.sin(t * 8) * shrug, hp: lerp(18, 2, look),
    pel: v3(0, b.hipY + 3 * shrug, 0),
    armL: {hand: board, shape: 'fist'}, armR: {hand: lerpV(pen, palm, shrug), shape: shrug > 0.4 ? 'open' : 'fist', wrist: lerp(0, 140, shrug)}}};
};
export const sciAt = (t: number): CharState => {
  const b = BODY_P;
  // reach (elbow leads), a quarter-turn of the key with the wrist, release, look up at the listener
  const reach = kv(t, [[20.05, 0], [T_ON - 0.12, 1], [20.85, 1], [21.2, 0]]), twist = kv(t, [[T_ON - 0.12, 0], [T_ON + 0.02, 1], [20.85, 1]]);
  const p = stand(b, {...face({brow: -0.2, browIn: -0.3, mw: 13, curve: 0.3, lid: 0.15, gy: 0.6}), blink: blink(t, [21.4, 22.8])});
  const key = v3(-20, b.hipY + b.spine - 52, 72), mid = v3(-b.shW - 10, b.hipY + b.spine - 40, 40);
  return {ground: v3(-0.5, 0, 1.12), heading: 180, pose: {...p, hp: kv(t, [[20, 18], [20.85, 18], [21.15, 2]]), hy: kv(t, [[20, 0], [20.85, 0], [21.25, -40]]),
    armR: {hand: via(p.armR.hand, mid, key, ss(0, 1, reach)), shape: reach > 0.7 ? 'point' : 'relax', wrist: -70 * twist, pole: v3(-0.8, -0.8, -0.2)}}};
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

export const labPeople = (t: number): Who[] => [
  {s: listenerAt(t), look: EXTRAS[1], id: 'lis'},
  {s: nearAt(t), look: EXTRAS[4], id: 'near'},
  {s: sciAt(t), look: CHECKER, id: 'sci'},
];
// D: one locked composition from the front-left, a little high: the listener large in the foreground on the left,
// the 8 FT tape running away from him to the bench and the scientist on the right
const CAM = lookCam(v3(4.15, 1.55, -2.55), v3(1.25, 0.74, 0.35), 1020);
export const Lab6: React.FC<{t: number}> = ({t}) => {
  const b = basis({...CAM, f: CAM.f * (1 + 0.02 * clamp((t - 20) / 3.37))});
  const on = t >= T_ON ? 1 : 0;
  const lit = clamp((t - 21.75) / 0.42) * 9; // 0..9 (the ninth is the 8 FT mark), on "eight feet" (22.12)
  const items = labItems(b, t, on);
  for (const w of labPeople(t)) items.push(charItem(b, w, t));
  const beam = ss(T_ON + 0.05, T_ON + 0.2, t);
  const reveal = clamp((t - T_ON - 0.05) / 0.55);
  return (
    <AbsoluteFill style={{background: '#1B2A31'}}>
      <svg width={W} height={H}>
        <LabShell b={b} on={on} lit={lit} t={t} />
        {paint(items)}
        <BeamLine b={b} o={RAY.o} e={LISTEN_EAR} t={t} amt={beam * 0.9} id="lb6" reveal={reveal} />
      </svg>
    </AbsoluteFill>
  );
};

// C2: the sweep, explained in the same lab (17.75..20.0), from above the bench, locked. Slowed right down: the
// mirror swings the beam so its far end moves across the air toward his ear at the speed of sound. The air the beam
// lights gives off a small sound wherever it is lit; because the lit spot keeps pace with its own sound, those sounds
// arrive at his ear together and stack into one strong sound there. The colleague a metre away gets them one at a
// time, weak. (Every sound here is made in the air, along the beam, not in the machine.)
const SW = {t0: 18.05, t1: 19.3, a0: 22};
const SWEEP_CAM = lookCam(v3(-0.5, 2.85, -3.5), v3(1.2, 1.1, 0.35), 1080);
export const LabSweep6: React.FC<{t: number}> = ({t}) => {
  const b = basis(SWEEP_CAM);
  const items = labItems(b, t, 1);
  const people = labPeople(20.0);
  for (const w of people) items.push(charItem(b, w, t));
  const o = RAY.o, e = LISTEN_EAR;
  const R = Math.hypot(e.x - o.x, e.z - o.z), base = Math.atan2(e.z - o.z, e.x - o.x);
  const ang = t < SW.t0 ? SW.a0 : t > SW.t1 ? 0 : SW.a0 * (1 - (t - SW.t0) / (SW.t1 - SW.t0));
  const tip = (deg: number) => v3(o.x + R * Math.cos(base + (deg * Math.PI) / 180), e.y, o.z + R * Math.sin(base + (deg * Math.PI) / 180));
  const cV = (R * (SW.a0 * Math.PI) / 180) / (SW.t1 - SW.t0);
  const ring = (c: V3, r: number) => {
    const pts = Array.from({length: 48}, (_, i) => proj(b, v3(c.x + r * Math.cos((i / 48) * 2 * Math.PI), c.y, c.z + r * Math.sin((i / 48) * 2 * Math.PI))));
    return `M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')}Z`;
  };
  const rings: React.ReactNode[] = [];
  const n = 12;
  for (let i = 0; i < n; i++) {
    const ti = lerp(SW.t0, SW.t1, i / (n - 1));
    if (t < ti) break;
    const r = cV * (t - ti);
    rings.push(<path key={i} d={ring(tip(SW.a0 * (1 - i / (n - 1))), Math.max(0.01, r))} fill="none" stroke="#2F8FA8" strokeWidth={3} opacity={0.85 * clamp(1 - r / 1.3)} />);
  }
  const meet = clamp(1 - Math.abs(t - SW.t1 - 0.05) / 0.3), after = clamp((t - SW.t1) / 0.7);
  const ep = proj(b, e);
  const arcPts = Array.from({length: 24}, (_, i) => proj(b, tip(SW.a0 * (1 - i / 23))));
  const tp = tip(ang);
  return (
    <AbsoluteFill style={{background: '#1B2A31'}}>
      <svg width={W} height={H}>
        <defs><filter id="ls6blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={8} /></filter></defs>
        <LabShell b={b} on={1} lit={0} t={t} />
        {paint(items)}
        <path d={`M${arcPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')}`} fill="none" stroke="#E0A040" strokeWidth={3} strokeDasharray="8 9" opacity={0.7} />
        <BeamLine b={b} o={o} e={tp} t={t} amt={0.95} id="sw6" />
        {rings}
        {meet > 0 && <circle cx={ep.x} cy={ep.y} r={16 + 26 * meet} fill="#7FD3E6" opacity={0.45 * meet} filter="url(#ls6blur)" />}
        {after > 0 && [0, 1, 2].map((k) => <path key={k} d={ring(e, 0.12 + (t - SW.t1) * 1.4 + k * 0.08)} fill="none" stroke="#2F8FA8" strokeWidth={6 - k * 1.5} opacity={(1 - after) * 0.9} />)}
      </svg>
    </AbsoluteFill>
  );
};
