// V2 D-F, one continuous world (14.89-26.74):
//  D  "So now, instead of building tiny robots from scratch...": a tiny wheeled robot drives along the lab floor (the
//     camera tracks alongside) to a rough 10 mm ledge; its small wheels can't get over the edge (it bumps, rocks back,
//     tries again). Match cut on direction to a cyborg cockroach approaching the same ledge in the next lane
//     ("scientists can use actual living insects"): it climbs over on alternating tripods, body pitching, and slips
//     through a narrow gap between two rocks. Overhead, both lanes at once. No speeds, endurance or costs are claimed;
//     a robot is not shown as hopeless, only this one at this ledge.
//  E  "And here's the crazy part": the camera follows the insect on; the lab floor behind gives way to cracked
//     concrete and rubble, the light turns dusty.
//  F  "They've already sent cyborg cockroaches into a real earthquake disaster zone": pull back, a collapsed building
//     at true scale (the insect is a few centimetres against metre-scale slabs); follow it into the low void under a
//     leaning floor slab; the field backpack's camera scans and its data link pulses (the 2025 Myanmar units carried
//     infrared cameras and sensors and sent data back wirelessly; they found no survivors, and none is shown);
//     a see-through view of the route under the slab; then on toward the bright opening at the far end.
import React from 'react';
import {add3, basis, Basis, P2, proj, V3} from '../core/three';
import {projPolyClip} from './clip';
import {cylinderItem, Item, resetIds} from '../core/draw3';
import {obbItem} from '../core/obb';
import {frame, Frame, toW} from '../core/frame';
import {at, cam, chain} from '../camera';
import {clamp, hash, noise1, ring, ss} from '../lib';
import {Path, pathAt, walkState} from '../roach/gait';
import {cyborgGroup} from '../roach/compose';
import {resetRoachIds} from '../roach/draw';
import {seatFrame} from '../kit/backpack';
import {PACK_SEAT} from '../roach/rig';
import {packParts2, Pack2} from './pack2';
import {robotItemsAt} from './lab2';
import {Tag} from '../scenes/overlays';
import {Telemetry} from './overlays2';

export const D0 = 14.89, MC = 17.93, E0 = 20.6, F0 = 22.27, G0 = 26.74;
const LEDGE_Y = 55, LEDGE_H = 10;
const LANE_BOT = -100, LANE_BUG = 100;
/** terrain height: lab floor, then a rounded 10 mm step up onto the concrete */
export const ground2 = (x: number, y: number) => LEDGE_H * clamp((y - LEDGE_Y) / 2.4) + (y > LEDGE_Y + 3 ? 0.5 * Math.sin(x * 0.09) * Math.sin(y * 0.07) : 0);
const parts = (B: Basis, p: Pack2, k: string) => packParts2(B, p, k);

// ------------------------------------------------------------------ actors
const botY = (t: number) => {
  const u = t - D0;
  const yHit = LEDGE_Y - 13 - 4.6 - 0.4;
  if (u < 1.7) return -40 + (yHit + 40) * Math.pow(ss(u, -0.3, 1.7), 0.8);
  return yHit - 4 * Math.abs(Math.sin((u - 1.7) * 2.6)) * Math.exp(-(u - 1.7) * 0.25);
};
const botPitch = (t: number) => {
  const u = t - D0;
  return u > 1.7 ? 9 * Math.abs(ring(u, 1.7, 1.3, 0.5)) + 6 * Math.abs(ring(u, 2.9, 1.3, 0.5)) + 5 * Math.abs(ring(u, 4.1, 1.3, 0.5)) : 0;
};
const BUG_PATH: Path = {p0: [LANE_BUG, -60, 0], yaw0: 90, segs: [{len: 2000}], ground: ground2};
/** the insect's travel: 40 mm/s through the comparison, 55 mm/s on into the rubble (it reaches the ledge ~18.6 s,
 *  the rock gap ~20.1 s, the void ~23.4 s and the bright far end ~26.6 s) */
const bugS = (t: number) => {
  const a = 17.2;
  const u = t - a;
  if (u <= 0) return 0;
  const v1 = 40, v2 = 55;
  const s1 = v1 * (u < 0.4 ? (u * u) / 0.8 : u - 0.2);
  const w = ss(t, 20.4, 21.2);
  return s1 + (v2 - v1) * Math.max(0, t - 20.8) * w;
};
export const bugState2 = (t: number) => {
  const s = bugS(t);
  const sw = 7 * Math.sin(t * 2.7);
  const st = walkState(BUG_PATH, s, {antTw: [18 + sw, 18 - sw], antLift: [16, 13], headPitch: -6, breathe: 0.5}, {spread: 0.9});
  const pack: Pack2 = {F: seatFrame(st.body, PACK_SEAT), led: 0.85 + 0.15 * Math.sin(t * 7), hook: 1, batt: 1, camera: true};
  return {st, pack, s};
};
const bugPos = (t: number) => bugState2(t).st.body.o;

// ------------------------------------------------------------------ set pieces
const ROCKS: {p: V3; h: V3; yaw: number; c: string}[] = [
  // the ledge's rough lip in both lanes
  ...Array.from({length: 18}, (_, i) => {
    const x = -260 + i * 30 + 12 * hash(i * 3.1);
    const near = Math.abs(x - LANE_BUG) < 34 || Math.abs(x - LANE_BOT) < 34;
    const sz = near ? 3 + 2 * hash(i) : 5 + 7 * hash(i * 5.7);
    return {p: [x, LEDGE_Y + 6 + 18 * hash(i * 7.3), LEDGE_H + sz * 0.4] as V3, h: [sz, sz * 0.8, sz * 0.5] as V3, yaw: hash(i * 9.1) * 180, c: ['#8E8576', '#7A7266', '#A39886'][i % 3]};
  }),
  // the narrow gap in the insect's lane
  {p: [LANE_BUG - 40, 125, LEDGE_H + 13], h: [22, 16, 13], yaw: 8, c: '#857C6E'},
  {p: [LANE_BUG + 40, 128, LEDGE_H + 15], h: [22, 18, 15], yaw: -12, c: '#958B7B'},
];
const BRICKS: {p: V3; yaw: number; tilt: number}[] = Array.from({length: 34}, (_, i) => {
  const x = -620 + hash(i * 3.3) * 1240, y = 150 + hash(i * 5.1) * 420;
  return {p: [x, y, LEDGE_H + 26 + hash(i) * 10] as V3, yaw: hash(i * 7.7) * 180, tilt: (hash(i * 2.2) - 0.5) * 40};
}).filter((b) => b.p[0] < -220 || b.p[0] > 380);
// the leaning floor slab over the void: low edge (~22 mm clear) at y 270, rising to ~180 mm at y 520 (the bright end)
const SLAB_TILT = 32;
const slabF = (): Frame => {
  const r = (SLAB_TILT * Math.PI) / 180;
  return frame([60, 395, LEDGE_H + 22 + 79 + 18], [0, Math.cos(r), Math.sin(r)], [0, -Math.sin(r), Math.cos(r)]);
};
const BIG: {F: Frame; h: V3; c: string}[] = [
  {F: frame([60, 560, LEDGE_H + 95], [1, 0, 0], [0, 0, 1]), h: [300, 26, 95], c: '#A9A296'}, // the wall stub the slab rests on
  {F: frame([-260, 300, LEDGE_H + 14], [1, 0.1, 0], [0, 0, 1]), h: [60, 40, 14], c: '#9C9488'}, // debris under the low edge (left)
  {F: frame([235, 300, LEDGE_H + 16], [1, -0.1, 0], [0, 0, 1]), h: [60, 40, 16], c: '#A39B8E'}, // and right
  {F: frame([-560, 380, LEDGE_H + 60], [0.9, 0.3, 0.2], [0, -0.2, 1]), h: [260, 200, 30], c: '#B3ACA0'},
  {F: frame([680, 300, LEDGE_H + 70], [0.8, -0.5, 0.35], [0.2, 0.1, 1]), h: [240, 190, 32], c: '#A79F92'},
  {F: frame([-330, 760, LEDGE_H + 200], [1, 0.1, 0], [0, 0, 1]), h: [70, 70, 200], c: '#9E978B'}, // column stump
  {F: frame([380, 820, LEDGE_H + 120], [1, -0.05, 0.05], [0, 0.4, 1]), h: [320, 30, 120], c: '#AFA89C'},
];
const REBAR: [V3, V3][] = [[[-200, 560, 190], [-140, 470, 330]], [[-150, 565, 190], [-60, 520, 340]], [[260, 560, 190], [330, 480, 350]], [[300, 570, 180], [420, 560, 330]], [[-40, 268, 34], [-10, 230, 70]]];

// ------------------------------------------------------------------ cameras
// after the match cut: the insect lane (the cut itself is the switch from camBot)
export const camD_F = (t: number) => chain(t, (tt) => at(add3(bugPos(tt), [0, 6, 8]), 92, 16, 12, 1040), [
  {a: 18.4, b: 19.3, o: (tt) => at(add3(bugPos(tt), [0, 8, 8]), 96, 12, 14, 1040)},
  {a: 19.2, b: 20.1, o: (tt) => at(add3(bugPos(tt), [0, 10, 8]), 34, 14, 13, 1040)},
  {a: 20.05, b: 20.6, o: () => at([0, 70, 10], 20, 80, 2.7, 960)},
  {a: 20.6, b: 21.6, o: (tt) => at(add3(bugPos(tt), [0, 14, 8]), 12, 17, 10, 1060)},
  // pull back: the collapsed building
  {a: 22.1, b: 23.05, o: () => at([60, 330, 120], 22, 20, 0.95, 1000)},
  // follow it into the void
  {a: 23.1, b: 24.0, o: (tt) => at(add3(bugPos(tt), [0, 16, 8]), 14, 9, 12, 1060)},
  // see-through route view
  {a: 24.0, b: 24.8, o: (tt) => at(add3(bugPos(tt), [0, 4, 7]), -78, 4, 14, 1080)},
  {a: 24.85, b: 25.45, o: () => at([100, 390, 20], 4, 80, 1.9, 980)},
  // on toward the bright far end, from above (the slab still see-through)
  {a: 25.5, b: 26.4, o: (tt) => at(add3(bugPos(tt), [0, 40, 0]), 4, 60, 4.2, 1000)},
]);
const camBot = (t: number) => chain(t, (tt) => at([LANE_BOT, botY(tt) + 4, 10], 92, 16, 11.5, 1040), [
  {a: 16.0, b: 17.4, o: (tt) => at([LANE_BOT, botY(tt) + 10, 12], 106, 22, 13, 1040)},
]);
const camAt = (t: number) => (t < MC ? camBot(t) : camD_F(t));

// ------------------------------------------------------------------ drawing
export const Terrain2: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  resetIds(fkey);
  resetRoachIds(fkey + 'r');
  const O = camAt(t);
  const B = basis(cam(O));
  const dust = ss(t, 20.7, 22.2);
  const items: Item[] = [];
  const seeThrough = ss(t, 24.8, 25.1);
  ROCKS.forEach((r, i) => items.push(obbItem(B, frame(r.p, [Math.cos(r.yaw), Math.sin(r.yaw), 0], [0, 0, 1]), r.h, r.c, {key: `k${i}`})));
  BRICKS.forEach((b, i) => (seeThrough > 0.5 && b.p[1] < 520 && b.p[1] > 250 && Math.abs(b.p[0] - 100) < 260) || items.push(obbItem(B, frame(b.p, [Math.cos(b.yaw), Math.sin(b.yaw), 0], [Math.sin((b.tilt * Math.PI) / 180), 0, 1]), [95, 45, 30], i % 3 ? '#9C7462' : '#8A6453', {key: `bk${i}`})));
  BIG.forEach((b, i) => items.push(obbItem(B, b.F, b.h, b.c, {key: `bg${i}`})));
  REBAR.forEach(([a, b], i) => items.push(cylinderItem(B, a, b, 4, '#6B4A3A', {key: `rb${i}`})));
  items.push(obbItem(B, slabF(), [148, 210, 18], '#B8B1A5', {key: 'slab', opacity: 1 - 0.75 * seeThrough}));
  // the robot (until the overhead)
  if (t < 21.0) items.push(...robotItemsAt(B, [LANE_BOT, botY(t), 0], 90, botPitch(t), (t - D0) * (t - D0 > 1.7 ? 22 : 9), 'bot', 1));
  const bs = bugState2(t);
  items.push(cyborgGroup(B, bs.st, bs.pack, 'bug', {parts, rim: {c: t < 21 ? '#8FD6E6' : '#FFF1D6', k: 0.5}, shadowZ: ground2(bs.st.body.o[0], bs.st.body.o[1])}).item);
  // the route trail in the see-through view
  if (seeThrough > 0.01) {
    const pts: string[] = [];
    for (let tt = 22.3; tt <= Math.min(t + 1.2, 26.7); tt += 0.1) {
      const p = proj(B, add3(bugPos(tt), [0, 0, 1]));
      pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    items.push({z: 1, el: <g key="route" opacity={seeThrough}><polyline points={pts.join(' ')} fill="none" stroke="#0E1E2B" strokeWidth={14} strokeLinecap="round" opacity={0.5} /><polyline points={pts.join(' ')} fill="none" stroke="#5CF2FF" strokeWidth={7} strokeDasharray="16 12" strokeLinecap="round" /></g>});
  }
  // ground
  const lab = projPolyClip(B, [[-1500, -900, 0], [1500, -900, 0], [1500, LEDGE_Y, 0], [-1500, LEDGE_Y, 0]], 4);
  const face = projPolyClip(B, [[-1500, LEDGE_Y, 0], [1500, LEDGE_Y, 0], [1500, LEDGE_Y + 2.4, LEDGE_H], [-1500, LEDGE_Y + 2.4, LEDGE_H]], 4);
  const conc = projPolyClip(B, [[-1500, LEDGE_Y + 2.4, LEDGE_H], [1500, LEDGE_Y + 2.4, LEDGE_H], [1500, 3000, LEDGE_H], [-1500, 3000, LEDGE_H]], 4);
  const grid: React.ReactNode[] = [];
  for (let x = -400; x <= 400; x += 20) grid.push(<path key={`gx${x}`} d={projPolyClip(B, [[x - 0.3, -600, 0.02], [x + 0.3, -600, 0.02], [x + 0.3, LEDGE_Y, 0.02], [x - 0.3, LEDGE_Y, 0.02]], 6)} fill="#2A3D4B" opacity={0.6} />);
  for (let y = -600; y < LEDGE_Y; y += 20) grid.push(<path key={`gy${y}`} d={projPolyClip(B, [[-400, y - 0.3, 0.02], [400, y - 0.3, 0.02], [400, y + 0.3, 0.02], [-400, y + 0.3, 0.02]], 6)} fill="#2A3D4B" opacity={0.6} />);
  const cracks = [[[-300, 80], [-150, 120], [-60, 100], [40, 160]], [[140, 70], [170, 200], [250, 260], [420, 300]], [[-520, 200], [-380, 180], [-300, 240]], [[60, 200], [90, 240], [80, 300]]].map((c, i) => {
    const p0 = proj(B, [c[0][0], c[0][1], LEDGE_H]);
    return <path key={`cr${i}`} d={`M${c.map(([x, y]) => P2(proj(B, [x, y, LEDGE_H + 0.2]))).join(' L')}`} stroke="#4F483F" strokeWidth={Math.max(2, 3 * p0.s)} fill="none" strokeLinejoin="round" />;
  });
  const grit = Array.from({length: 150}, (_, i) => {
    const x = -700 + hash(i * 1.9) * 1400, y = LEDGE_Y + 10 + hash(i * 2.3) * 700;
    const p = proj(B, [x, y, LEDGE_H + 0.3]);
    if (p.z < 6) return null;
    return <circle key={`gr${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={((1.5 + hash(i * 4.1) * 5) * p.s).toFixed(1)} fill={i % 3 ? '#6F685E' : '#B4AC9E'} opacity={0.75} />;
  });
  // the bright far end of the void
  const glowC = proj(B, [LANE_BUG, 520, LEDGE_H + 60]);
  const glowA = glowC.z > 10 ? ss(t, 23.0, 23.6) * (1 + 0.6 * ss(t, 25.6, 26.6)) : 0;
  const motes = Array.from({length: 46}, (_, i) => {
    const p: V3 = [-600 + hash(i * 1.3) * 1200 + 40 * noise1(t * 0.3 + i, i), -100 + hash(i * 2.1) * 900, 20 + hash(i * 3.7) * 320 + 20 * noise1(t * 0.2 + i * 3, i)];
    const P = proj(B, p);
    if (P.z < 8) return null;
    return <circle key={`m${i}`} cx={P.x.toFixed(1)} cy={P.y.toFixed(1)} r={((1.4 + 2.2 * hash(i * 9)) * P.s).toFixed(1)} fill="#EADFCB" opacity={0.2 * dust} />;
  });
  const tagA = ss(t, F0 + 0.1, F0 + 0.4) * (1 - ss(t, 24.6, 24.85));
  const telA = ss(t, 24.05, 24.3) * (1 - ss(t, 24.8, 25.0));
  const bp = proj(B, add3(bs.st.body.o, [0, 0, 16]));
  const feedA = ss(t, 24.0, 24.3) * (1 - ss(t, 25.5, 25.75));
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id={`${fkey}bgl`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#081019" /><stop offset="1" stopColor="#13222E" /></linearGradient>
          <linearGradient id={`${fkey}bgd`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CDBB9F" /><stop offset="0.55" stopColor="#A49784" /><stop offset="1" stopColor="#6E665B" /></linearGradient>
          <radialGradient id={`${fkey}glow`} gradientUnits="userSpaceOnUse" cx={glowC.x.toFixed(1)} cy={glowC.y.toFixed(1)} r={(Math.max(60, 260 * glowC.s)).toFixed(1)}>
            <stop offset="0" stopColor="#FFF6DD" stopOpacity="0.95" /><stop offset="0.4" stopColor="#FFE9B8" stopOpacity="0.5" /><stop offset="1" stopColor="#FFE9B8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${fkey}vig`} cx="0.5" cy="0.45" r="0.78"><stop offset="0.5" stopColor="#04090E" stopOpacity="0" /><stop offset="1" stopColor="#04090E" stopOpacity={(0.6 - 0.25 * dust).toFixed(2)} /></radialGradient>
        </defs>
        <rect width={1080} height={1920} fill={`url(#${fkey}bgl)`} />
        <rect width={1080} height={1920} fill={`url(#${fkey}bgd)`} opacity={dust} />
        {dust > 0.01 && <Facade B={B} a={dust} />}
        <path d={lab} fill="#1C2A35" />
        {grid}
        <path d={conc} fill="#8D857A" />
        <path d={face} fill="#5C5650" />
        {cracks}
        {grit}
        <path d={projPolyClip(B, [[-150, 262, LEDGE_H + 0.4], [250, 262, LEDGE_H + 0.4], [250, 540, LEDGE_H + 0.4], [-150, 540, LEDGE_H + 0.4]], 4)} fill="#211C17" opacity={0.62 * (1 - 0.6 * seeThrough)} />
        {glowA > 0 && <ellipse cx={glowC.x.toFixed(1)} cy={glowC.y.toFixed(1)} rx={(Math.max(60, 260 * glowC.s)).toFixed(1)} ry={(Math.max(40, 150 * glowC.s)).toFixed(1)} fill={`url(#${fkey}glow)`} opacity={glowA} />}
        {items.filter((i) => i.z > 8).sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>)}
        {items.filter((i) => i.z === 1).map((it, i) => <React.Fragment key={`r${i}`}>{it.el}</React.Fragment>)}
        {motes}
        <rect width={1080} height={1920} fill={`url(#${fkey}vig)`} />
      </svg>
      <Tag text="TINY ROBOT" sub="built from scratch" a={ss(t, D0 + 0.15, D0 + 0.45) * (1 - ss(t, MC - 0.25, MC - 0.05))} y={200} color="#8FB3E8" />
      <Tag text="LIVING INSECT" sub="+ electronic backpack" a={ss(t, MC + 0.05, MC + 0.3) * (1 - ss(t, E0 - 0.1, E0 + 0.1))} y={200} color="#FFD84A" />
      <Tag text="MYANMAR EARTHQUAKE · 2025" sub="first field deployment of cyborg insects" a={tagA} y={200} color="#FFB347" />
      <Telemetry p={bp} a={telA} t={t} />
      <Feed t={t} a={feedA} />
    </div>
  );
};

const Facade: React.FC<{B: Basis; a: number}> = ({B, a}) => {
  const W = (x: number, z: number): V3 => [x, 2600, z];
  const outline: [number, number][] = [[-3000, 0], [-3000, 1600], [-2200, 1600], [-1900, 1300], [-1400, 1500], [-1000, 950], [-600, 1180], [-200, 760], [300, 1000], [800, 640], [1200, 1380], [1700, 1240], [3000, 1500], [3000, 0]];
  if (proj(B, W(0, 500)).z < 10) return null;
  const d = `M${outline.map(([x, z]) => P2(proj(B, W(x, z)))).join(' L')} Z`;
  const wins: React.ReactNode[] = [];
  for (let i = 0; i < 10; i++) for (let j = 0; j < 4; j++) {
    const x = -2800 + i * 560, z = 220 + j * 300;
    const top = outline.reduce((m, [ox, oz], k) => (k && ox >= x ? Math.min(m, oz) : m), 1e9);
    if (z + 170 > top) continue;
    wins.push(<path key={`${i}${j}`} d={`M${[W(x, z), W(x + 190, z), W(x + 190, z + 170), W(x, z + 170)].map((p) => P2(proj(B, p))).join(' L')} Z`} fill="#4A443C" opacity={0.7} />);
  }
  return <g opacity={0.55 * a}><path d={d} fill="#857B6C" />{wins}</g>;
};

/** the insect camera's view: a cool thermal-style scan of rubble, a sweep, SCANNING (nothing is found) */
const Feed: React.FC<{t: number; a: number}> = ({t, a}) => {
  if (a <= 0.01) return null;
  const sweep = ((t - 24.0) * 0.9) % 1;
  const blobs = Array.from({length: 12}, (_, i) => ({x: 30 + hash(i * 3.3) * 400, y: 30 + hash(i * 6.1) * 230, r: 30 + hash(i * 2.7) * 70, c: ['#1B1F6B', '#2B2F8F', '#3A2A8A', '#20407A'][i % 4]}));
  return (
    <div style={{position: 'absolute', left: 560, top: 380, width: 460, opacity: a, transform: `scale(${(0.9 + 0.1 * a).toFixed(3)})`, transformOrigin: 'right top'}}>
      <div style={{borderRadius: 22, overflow: 'hidden', border: '5px solid #FFB347', background: '#101436', boxShadow: '0 10px 30px rgba(0,0,0,0.4)'}}>
        <svg width={450} height={260} viewBox="0 0 460 270" style={{display: 'block'}}>
          <rect width={460} height={270} fill="#141A55" />
          {blobs.map((b, i) => <ellipse key={i} cx={b.x + 6 * Math.sin(t + i)} cy={b.y} rx={b.r} ry={b.r * 0.6} fill={b.c} opacity={0.9} style={{filter: 'blur(14px)'}} />)}
          <path d="M0,200 L120,150 L240,175 L330,110 L460,160 L460,270 L0,270 Z" fill="#232B7A" opacity={0.9} />
          <rect x={0} y={sweep * 270} width={460} height={8} fill="#7FE7FF" opacity={0.45} />
        </svg>
        <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px 16px', background: 'rgba(14,30,43,0.95)', fontFamily: '"Nunito Variable", sans-serif', fontWeight: 900, fontSize: 25, color: '#FFB347', letterSpacing: '0.05em'}}>
          <span>INSECT CAMERA · THERMAL</span>
          <span style={{color: '#FFFFFF', opacity: 0.6 + 0.4 * Math.sin(t * 8)}}>SCANNING…</span>
        </div>
      </div>
    </div>
  );
};
export {toW, pathAt};
