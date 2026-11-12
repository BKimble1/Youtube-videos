// V4: V3's earthquake scene without the banner; the insect made easier to follow (a sunlit ground patch under it, a
// stronger warm rim, the frame's vignette centred on it).
// V3 F (20.6-26.74): "And here's the crazy part. They've already sent cyborg cockroaches into a real earthquake disaster
// zone." A collapsed building at true scale: two floor slabs fallen against each other make a tight V-shaped crevice
// (the insect, ~6 cm, is tiny against metre-scale concrete); more slabs, a column stump, a broken facade, rebar, loose
// rubble in the foreground (parallax), restrained dust. One cyborg (the first-generation field backpack with its camera
// module; the 2025 Myanmar units carried infrared cameras and sensors) walks the route through. No feed, no detection,
// no survivor: the deployment is real; finding people was not reported.
import React from 'react';
import {add3, basis, Basis, P2, proj, V3} from '../core/three';
import {cylinderItem, Item, resetIds} from '../core/draw3';
import {obbItem} from '../core/obb';
import {frame, Frame} from '../core/frame';
import {at, cam, chain} from '../camera';
import {hash, noise1, ss} from '../lib';
import {Path, walkState} from '../roach/gait';
import {cyborgGroup} from '../roach/compose';
import {resetRoachIds} from '../roach/draw';
import {seatFrame} from '../kit/backpack';
import {PACK_SEAT} from '../roach/rig';
import {packParts2, Pack2} from '../v2/pack2';
import {projPolyClip} from '../v2/clip';

export const F0_3 = 20.6, G0_3 = 26.74;
const CONC = ['#B7B0A4', '#A69F93', '#C5BEB1', '#968F84', '#ADA699'];

/** a slab whose bottom edge lies along y at (x, z=0), width W rising at `tilt` toward side s (-1 = -x), thickness th */
const slab = (x: number, y0: number, y1: number, W: number, tilt: number, s: number, th: number): {F: Frame; h: V3} => {
  const r = (tilt * Math.PI) / 180;
  const w: V3 = [s * Math.cos(r), 0, Math.sin(r)];
  const u: V3 = [-s * Math.sin(r), 0, Math.cos(r)];
  const E: V3 = [x, (y0 + y1) / 2, 0];
  const c = add3(E, add3([w[0] * W / 2, 0, w[2] * W / 2], [u[0] * th / 2, 0, u[2] * th / 2]));
  return {F: frame(c, [0, 1, 0], u), h: [(y1 - y0) / 2, W / 2, th / 2]};
};
export const CREV = {x: 23, y0: 110, y1: 350};
export const SLABS: {F: Frame; h: V3; c: string}[] = [
  {...slab(-CREV.x, CREV.y0, CREV.y1, 360, 56, -1, 34), c: CONC[0]},
  {...slab(CREV.x, CREV.y0 + 20, CREV.y1 - 10, 320, 60, 1, 30), c: CONC[1]},
  {F: frame([-420, 560, 60], [0.95, 0.3, 0.05], [0.1, -0.2, 1]), h: [300, 220, 34], c: CONC[2]},
  {F: frame([480, 520, 90], [0.8, -0.55, 0.3], [0.25, 0.1, 1]), h: [280, 200, 32], c: CONC[3]},
  {F: frame([-520, 120, 40], [0.9, 0.4, 0.1], [0, 0, 1]), h: [220, 160, 40], c: CONC[4]},
  {F: frame([560, 60, 30], [0.7, 0.7, 0.05], [0, 0.1, 1]), h: [200, 150, 30], c: CONC[2]},
  {F: frame([-260, 900, 260], [1, 0.1, 0], [0, 0, 1]), h: [80, 80, 260], c: CONC[3]}, // column stump
  {F: frame([300, 980, 200], [1, -0.05, 0.05], [0, 0.4, 1]), h: [380, 34, 200], c: CONC[0]}, // broken wall
];
const REBAR: [V3, V3][] = [[[-120, 330, 230], [-60, 260, 380]], [[-150, 300, 220], [-110, 210, 360]], [[140, 300, 250], [210, 230, 380]], [[260, 980, 400], [330, 900, 520]], [[200, 990, 380], [180, 880, 520]]];
// loose rubble: chunks near the route's sides (some close to the low cameras: foreground parallax) and bricks
export const CHUNKS: {p: V3; h: V3; yaw: number; c: string}[] = Array.from({length: 40}, (_, i) => {
  const near = i < 16;
  const y = near ? -120 + hash(i * 2.3) * 240 : 360 + hash(i * 5.1) * 400;
  let x = (hash(i * 3.3) - 0.5) * (near ? 260 : 900);
  if (Math.abs(x) < 40) x = Math.sign(x || 1) * (40 + hash(i) * 30);
  const sz = near ? 6 + hash(i * 7.7) * 16 : 10 + hash(i * 7.7) * 40;
  return {p: [x, y, sz * 0.45] as V3, h: [sz, sz * (0.6 + 0.4 * hash(i * 1.9)), sz * 0.5] as V3, yaw: hash(i * 9.1) * 180, c: CONC[i % 5]};
}).filter((c) => c.p[1] < 360 || Math.abs(c.p[0]) > 260);

// the route: in from the open floor, through the crevice, out at the far end
const ROUTE: Path = {p0: [0, -130, 0], yaw0: 90, segs: [{len: 200}, {len: 30, turn: -6}, {len: 260}, {len: 60, turn: 20}, {len: 2000}]};
const sAt = (t: number) => 58 * Math.max(0, t - 20.2);
export const bugF = (t: number) => {
  const sw = 8 * Math.sin(t * 2.9);
  const inC = ss(sAt(t), 200, 240) * (1 - ss(sAt(t), 470, 500));
  const st = walkState(ROUTE, sAt(t), {antTw: [16 + sw, 16 - sw], antLift: [14, 12], headPitch: -4, breathe: 0.5}, {spread: 1 - 0.18 * inC});
  return {st, pack: {F: seatFrame(st.body, PACK_SEAT), led: 0.85 + 0.15 * Math.sin(t * 7), hook: 1, batt: 1, camera: true} as Pack2};
};
const bugPos = (t: number) => bugF(t).st.body.o;

export const camF3 = (t: number) => chain(t, (tt) => at(add3(bugPos(tt), [0, 210, 90 - 20 * ss(tt, 20.6, 22.3)]), 2, 16, 0.85 + 0.9 * ss(tt, 20.6, 22.3), 1060), [
  // low, following it toward the crevice; loose rubble slides past in the foreground
  {a: 22.1, b: 23.0, o: (tt) => at(add3(bugPos(tt), [0, 18, 6]), 10, 8, 9, 1080)},
  // inside: the walls tower over it
  {a: 23.45, b: 24.3, o: (tt) => at(add3(bugPos(tt), [0, 12, 8]), -4, 13, 10, 1040)},
  // the route, from above
  {a: 24.75, b: 25.35, o: () => at([0, 200, 0], 0, 80, 1.5, 980)},
  // ahead of it at the far end, looking back as it comes out into the light
  {a: 25.75, b: 26.45, o: (tt) => at(add3(bugPos(tt), [0, 6, 7]), 180, 12, 9, 1060)},
]);

const Facade: React.FC<{B: Basis}> = ({B}) => {
  const W = (x: number, z: number): V3 => [x, 3000, z];
  const outline: [number, number][] = [[-3400, 0], [-3400, 1700], [-2400, 1700], [-2100, 1350], [-1500, 1560], [-1100, 980], [-600, 1240], [-200, 800], [300, 1060], [800, 680], [1300, 1420], [1800, 1280], [3400, 1600], [3400, 0]];
  if (proj(B, W(0, 500)).z < 10) return null;
  const d = `M${outline.map(([x, z]) => P2(proj(B, W(x, z)))).join(' L')} Z`;
  return <path d={d} fill="#8A8072" opacity={0.6} />;
};

export const Rubble4: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  resetIds(fkey);
  resetRoachIds(fkey + 'r');
  const O = camF3(t);
  const B = basis(cam(O));
  const items: Item[] = [];
  // the two crevice walls are always drawn behind the insect walking between them (the painter's sort on their
  // centres would otherwise put a whole wall over it)
  SLABS.forEach((s, i) => items.push(obbItem(B, s.F, s.h, s.c, {key: `s${i}`, zBias: i < 2 ? 1e4 : 0})));
  CHUNKS.forEach((c, i) => items.push(obbItem(B, frame(c.p, [Math.cos(c.yaw), Math.sin(c.yaw), 0], [0, 0, 1]), c.h, c.c, {key: `c${i}`})));
  REBAR.forEach(([a, b], i) => items.push(cylinderItem(B, a, b, 4, '#6B4A3A', {key: `r${i}`})));
  const b = bugF(t);
  items.push(cyborgGroup(B, b.st, b.pack, 'fb', {parts: (BB, p: Pack2, k) => packParts2(BB, p, k), rim: {c: '#FFF4E0', k: 0.9}}).item);
  // floor, the crevice's shade, cracks, grit
  const floor = projPolyClip(B, [[-2500, -1500, 0], [2500, -1500, 0], [2500, 3500, 0], [-2500, 3500, 0]], 4);
  const shade = projPolyClip(B, [[-60, CREV.y0, 0.3], [60, CREV.y0, 0.3], [60, CREV.y1, 0.3], [-60, CREV.y1, 0.3]], 4);
  const cracks = [[[-300, -40], [-150, 10], [-40, -20], [80, 60]], [[120, -100], [180, 20], [300, 60]], [[-520, 300], [-380, 280], [-300, 340]]].map((c, i) => (
    <path key={`cr${i}`} d={`M${c.map(([x, y]) => P2(proj(B, [x, y, 0.2]))).join(' L')}`} stroke="#4F483F" strokeWidth={Math.max(2, 3 * proj(B, [c[0][0], c[0][1], 0]).s)} fill="none" />
  ));
  const grit = Array.from({length: 140}, (_, i) => {
    const x = -700 + hash(i * 1.9) * 1400, y = -300 + hash(i * 2.3) * 1200;
    if (Math.abs(x) < 30 && y > -150 && y < 520) return null;
    const p = proj(B, [x, y, 0.3]);
    if (p.z < 6) return null;
    return <circle key={`g${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={((1.5 + hash(i * 4.1) * 5) * p.s).toFixed(1)} fill={i % 3 ? '#6F685E' : '#B4AC9E'} opacity={0.75} />;
  });
  const motes = Array.from({length: 30}, (_, i) => {
    const p: V3 = [-600 + hash(i * 1.3) * 1200 + 30 * noise1(t * 0.3 + i, i), -200 + hash(i * 2.1) * 1200, 20 + hash(i * 3.7) * 400 + 20 * noise1(t * 0.2 + i * 3, i)];
    const P = proj(B, p);
    if (P.z < 8) return null;
    return <circle key={`m${i}`} cx={P.x.toFixed(1)} cy={P.y.toFixed(1)} r={((1.4 + 2 * hash(i * 9)) * P.s).toFixed(1)} fill="#EADFCB" opacity={0.16} />;
  });
  // the route from above
  const routeA = ss(t, 24.8, 25.05) * (1 - ss(t, 25.6, 25.8));
  let route: React.ReactNode = null;
  if (routeA > 0) {
    const pts: string[] = [];
    for (let s = 0; s <= 640; s += 10) {
      const q = walkState(ROUTE, s).body.o;
      const p = proj(B, [q[0], q[1], 1]);
      pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    route = <g opacity={routeA}><polyline points={pts.join(' ')} fill="none" stroke="#0E1E2B" strokeWidth={14} opacity={0.5} strokeLinecap="round" /><polyline points={pts.join(' ')} fill="none" stroke="#5CF2FF" strokeWidth={7} strokeDasharray="16 12" strokeLinecap="round" /></g>;
  }
  const light = ss(t, 25.8, 26.5);
  // subject contrast: a soft sunlit patch on the ground under the insect and a vignette centred on it
  const bo = b.st.body.o;
  const pool = projPolyClip(B, Array.from({length: 24}, (_, i) => { const an = (i / 24) * 2 * Math.PI; return [bo[0] + 70 * Math.cos(an), bo[1] + 90 * Math.sin(an), 0.4] as V3; }), 4);
  const BP = proj(B, add3(bo, [0, 0, 6]));
  const bx = BP.z > 5 ? Math.max(150, Math.min(930, BP.x)) : 540, by = BP.z > 5 ? Math.max(300, Math.min(1500, BP.y)) : 960;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id={`${fkey}sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CDBB9F" /><stop offset="0.55" stopColor="#A49784" /><stop offset="1" stopColor="#6E665B" /></linearGradient>
          <radialGradient id={`${fkey}vig`} gradientUnits="userSpaceOnUse" cx={bx.toFixed(0)} cy={by.toFixed(0)} r={1150}><stop offset="0.28" stopColor="#120E0A" stopOpacity="0" /><stop offset="1" stopColor="#120E0A" stopOpacity="0.62" /></radialGradient>
          <radialGradient id={`${fkey}sun`} cx="0.5" cy="0.35" r="0.6"><stop offset="0" stopColor="#FFF4DC" stopOpacity={(0.35 * light).toFixed(2)} /><stop offset="1" stopColor="#FFF4DC" stopOpacity="0" /></radialGradient>
          <filter id={`${fkey}pb`} filterUnits="userSpaceOnUse" x={-80} y={-80} width={1240} height={2080}><feGaussianBlur stdDeviation={Math.max(6, 10 * BP.s).toFixed(1)} /></filter>
        </defs>
        <rect width={1080} height={1920} fill={`url(#${fkey}sky)`} />
        <Facade B={B} />
        <path d={floor} fill="#8D857A" />
        <path d={shade} fill="#2A251F" opacity={0.55} />
        <path d={pool} fill="#F4EBDA" opacity={0.5} filter={`url(#${fkey}pb)`} />
        {cracks}
        {grit}
        {route}
        {items.filter((i) => i.z > 8).sort((a, c) => c.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>)}
        {motes}
        <rect width={1080} height={1920} fill={`url(#${fkey}sun)`} />
        <rect width={1080} height={1920} fill={`url(#${fkey}vig)`} />
      </svg>
    </div>
  );
};
