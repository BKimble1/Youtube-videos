// F: "They've already sent cyborg cockroaches into a real earthquake disaster zone."
// A collapsed building (concrete slabs, a pancaked floor leaning on a broken wall, bricks, rebar, dust), at true scale:
// the insect is a few centimetres long against slabs a metre across. A cyborg cockroach wearing the field version of
// the backpack (a tiny forward camera module, as on the units Singapore's team took to the 2025 Myanmar earthquake)
// walks over the rubble and into a crack under a leaning slab; an inset shows its camera feed scanning. Nothing is
// found on screen: the deployment is real, but it did not report locating a survivor.
import React from 'react';
import {add3, basis, Basis, P2, proj, projPoly, smoothClosed, V3} from '../core/three';
import {cylinderItem, Item, resetIds} from '../core/draw3';
import {obbItem} from '../core/obb';
import {frame, Frame} from '../core/frame';
import {at, cam, chain} from '../camera';
import {hash, noise1, ss, clamp} from '../lib';
import {walkState, Path} from '../roach/gait';
import {cyborgGroup} from '../roach/compose';
import {resetRoachIds} from '../roach/draw';
import {seatFrame} from '../kit/backpack';
import {PACK_SEAT} from '../roach/rig';
import {Tag} from './overlays';

export const F0 = 22.27, F1 = 26.74;
const CONC = ['#B9B4AA', '#A7A196', '#C9C3B6', '#99938A'];

type Slab = {F: Frame; h: V3; c: string};
// the big pieces: a pancaked floor slab leaning down onto a broken wall stub, leaving a low triangular void (the crack
// the insect goes into), more slabs and a column stump around
const SLABS: Slab[] = [
  {F: frame([60, 280, 130], [1, 0, 0], [0, -0.48, 1]), h: [560, 270, 36], c: CONC[0]}, // leaning floor slab
  {F: frame([60, 470, 90], [1, 0, 0], [0, 0, 1]), h: [420, 40, 90], c: CONC[1]}, // broken wall stub it rests on
  {F: frame([-420, 120, 40], [0.9, 0.3, 0.1], [0, 0, 1]), h: [260, 200, 40], c: CONC[2]},
  {F: frame([520, 80, 60], [0.8, -0.5, 0.25], [0.1, 0.1, 1]), h: [220, 180, 34], c: CONC[3]},
  {F: frame([-300, 520, 160], [1, 0.1, 0], [0, 0, 1]), h: [80, 80, 160], c: CONC[1]}, // column stump
  {F: frame([-160, -260, 22], [0.7, 0.7, 0.05], [0, 0.1, 1]), h: [160, 110, 22], c: CONC[2]},
];
const BRICKS: {p: V3; yaw: number; tilt: number}[] = Array.from({length: 26}, (_, i) => {
  const x = -480 + hash(i * 3.3) * 960, y = -300 + hash(i * 5.1) * 520;
  return {p: [x, y, 26 + hash(i) * 10] as V3, yaw: hash(i * 7.7) * 180, tilt: (hash(i * 2.2) - 0.5) * 40};
}).filter((b) => !(b.p[0] > -80 && b.p[0] < 220 && b.p[1] > -270 && b.p[1] < 260));
const REBAR: [V3, V3][] = [
  [[-200, 140, 150], [-120, 60, 260]], [[-160, 150, 150], [-60, 110, 280]], [[300, 200, 170], [380, 120, 320]], [[320, 230, 160], [440, 210, 300]],
];
/** the insect's route: across the debris floor to the void under the leaning slab */
const route: Path = {p0: [10, -240, 0], yaw0: 90, segs: [{len: 120}, {len: 80, turn: -20}, {len: 90, turn: 26}, {len: 600}]};
const sAt = (t: number) => 46 * Math.max(0, t - F0 + 0.4);

export const rubbleCam = (t: number) => chain(t, (tt) => at([20, -60 + 20 * (tt - F0), 90], 14, 8, 1.3, 1060), [
  {a: F0 + 0.7, b: F0 + 2.3, o: (tt) => at(add3(walkState(route, sAt(tt)).body.o, [0, 0, 10]), 22, 22, 5.6, 1120)},
  {a: F0 + 2.4, b: F0 + 4.3, o: (tt) => at(add3(walkState(route, sAt(tt)).body.o, [0, 10, 10]), 58, 12, 8.5, 1060)},
]);

const dust = (B: Basis, t: number) => Array.from({length: 40}, (_, i) => {
  const p: V3 = [-500 + hash(i * 1.3) * 1000 + 40 * noise1(t * 0.3 + i, i), -300 + hash(i * 2.1) * 700, 20 + hash(i * 3.7) * 300 + 20 * noise1(t * 0.2 + i * 3, i)];
  const P = proj(B, p);
  if (P.z < 5) return null;
  return <circle key={i} cx={P.x.toFixed(1)} cy={P.y.toFixed(1)} r={(1.5 + 2.5 * hash(i * 9)) * P.s} fill="#E8DFCF" opacity={0.18} />;
});

export const Rubble: React.FC<{t: number; fkey: string}> = ({t, fkey}) => {
  resetIds(fkey);
  resetRoachIds(fkey + 'r');
  const O = rubbleCam(t);
  const B = basis(cam(O));
  const items: Item[] = [];
  SLABS.forEach((s, i) => items.push(obbItem(B, s.F, s.h, s.c, {key: `s${i}`})));
  BRICKS.forEach((b, i) => items.push(obbItem(B, frame(b.p, [Math.cos(b.yaw), Math.sin(b.yaw), 0], [Math.sin((b.tilt * Math.PI) / 180), 0, 1]), [95, 45, 30], i % 3 ? '#A9765E' : '#94644F', {key: `b${i}`})));
  REBAR.forEach(([a, b], i) => items.push(cylinderItem(B, a, b, 4, '#6B4A3A', {key: `r${i}`})));
  const st = walkState(route, sAt(t), {antTw: [20 + 8 * Math.sin(t * 3), 20 - 8 * Math.sin(t * 3)], antLift: [14, 12], headPitch: -4, breathe: 0.5});
  items.push(cyborgGroup(B, st, {F: seatFrame(st.body, PACK_SEAT), led: 0.85 + 0.15 * Math.sin(t * 8), hook: 1}, 'rb', {packCamera: true}).item);
  // the floor: debris-covered ground with cracks
  const floor = projPoly(B, [[-1500, -1200, 0], [1500, -1200, 0], [1500, 1500, 0], [-1500, 1500, 0]], 4);
  const cracks = [[[-300, -100], [-120, -60], [-40, -140], [120, -110]], [[140, -260], [200, -120], [330, -60]], [[-520, 40], [-380, 20], [-300, 80]]].map((c, i) => (
    <path key={i} d={`M${c.map(([x, y]) => P2(proj(B, [x, y, 0.2]))).join(' L')}`} stroke="#5E574E" strokeWidth={Math.max(2, 4 * proj(B, [c[0][0], c[0][1], 0]).s)} fill="none" strokeLinejoin="round" />
  ));
  const grit = Array.from({length: 120}, (_, i) => {
    const x = -600 + hash(i * 1.9) * 1200, y = -400 + hash(i * 2.3) * 800;
    const p = proj(B, [x, y, 0.3]);
    if (p.z < 4) return null;
    return <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={(2 + hash(i * 4.1) * 6) * p.s} fill={i % 3 ? '#8E877C' : '#CFC8BA'} opacity={0.75} />;
  });
  // the void under the leaning slab: a dark band where the slab meets the floor
  const voidP = projPoly(B, [[-200, 300, 0.4], [320, 300, 0.4], [320, 420, 0.4], [-200, 420, 0.4]], 4);
  const tagA = ss(t, F0 + 0.15, F0 + 0.45) * (1 - ss(t, F1 - 0.2, F1));
  const feedA = ss(t, 24.55, 24.85) * (1 - ss(t, F1 - 0.18, F1));
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id={`${fkey}sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#C9B79C" />
            <stop offset="0.5" stopColor="#A59886" />
            <stop offset="1" stopColor="#6F675C" />
          </linearGradient>
          <radialGradient id={`${fkey}haze`} cx="0.5" cy="0.25" r="0.8">
            <stop offset="0" stopColor="#F2E3C6" stopOpacity="0.35" />
            <stop offset="1" stopColor="#F2E3C6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill={`url(#${fkey}sky)`} />
        {/* the broken building behind, a flat silhouette far away */}
        <BuildingBack B={B} />
        <path d={floor} fill="#A39B8D" />
        <path d={voidP} fill="#2B2620" opacity={0.85} />
        {cracks}
        {grit}
        {items.filter((i) => i.z > 2).sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>)}
        {dust(B, t)}
        <rect width={1080} height={1920} fill={`url(#${fkey}haze)`} />
      </svg>
      <Tag text="MYANMAR EARTHQUAKE · 2025" sub="real search-and-rescue deployment" a={tagA} y={200} color="#FFB347" />
      <Feed t={t} a={feedA} />
    </div>
  );
};

/** a far broken facade (in the world, so it parallaxes) */
const BuildingBack: React.FC<{B: Basis}> = ({B}) => {
  const W = (x: number, z: number): V3 => [x, 2400, z];
  const outline: [number, number][] = [[-2600, 0], [-2600, 1500], [-1900, 1500], [-1700, 1250], [-1300, 1420], [-900, 900], [-600, 1100], [-200, 700], [300, 950], [700, 600], [1100, 1300], [1600, 1180], [2600, 1400], [2600, 0]];
  const d = `M${outline.map(([x, z]) => P2(proj(B, W(x, z)))).join(' L')} Z`;
  const wins: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) {
    const x = -2400 + i * 520, z = 200 + j * 280;
    const top = outline.reduce((m, [ox, oz], k) => (k && ox >= x ? Math.min(m, oz) : m), 1e9);
    if (z + 160 > top) continue;
    wins.push(<path key={`${i}${j}`} d={`M${[W(x, z), W(x + 180, z), W(x + 180, z + 160), W(x, z + 160)].map((p) => P2(proj(B, p))).join(' L')} Z`} fill="#4A443C" opacity={0.7} />);
  }
  return <g opacity={0.55}><path d={d} fill="#857B6C" />{wins}</g>;
};

/** the insect's camera feed: a false-colour thermal-style scan of rubble (cool), a sweep line, "SCANNING" */
const Feed: React.FC<{t: number; a: number}> = ({t, a}) => {
  if (a <= 0.01) return null;
  const sweep = ((t - 24.55) * 0.9) % 1;
  const blobs = Array.from({length: 14}, (_, i) => ({x: 30 + hash(i * 3.3) * 400, y: 30 + hash(i * 6.1) * 230, r: 30 + hash(i * 2.7) * 70, c: ['#1B1F6B', '#2B2F8F', '#3A2A8A', '#20407A'][i % 4]}));
  return (
    <div style={{position: 'absolute', left: 560, top: 360, width: 460, opacity: a, transform: `scale(${(0.9 + 0.1 * a).toFixed(3)})`, transformOrigin: 'right top'}}>
      <div style={{borderRadius: 22, overflow: 'hidden', border: '5px solid #FFB347', background: '#101436', boxShadow: '0 10px 30px rgba(0,0,0,0.4)'}}>
        <svg width={450} height={290} viewBox="0 0 460 300" style={{display: 'block'}}>
          <rect width={460} height={300} fill="#141A55" />
          {blobs.map((b, i) => <ellipse key={i} cx={b.x + 6 * Math.sin(t + i)} cy={b.y} rx={b.r} ry={b.r * 0.6} fill={b.c} opacity={0.9} style={{filter: 'blur(14px)'}} />)}
          <path d="M0,220 L120,160 L240,190 L330,120 L460,170 L460,300 L0,300 Z" fill="#232B7A" opacity={0.9} />
          <rect x={0} y={sweep * 300} width={460} height={8} fill="#7FE7FF" opacity={0.45} />
          <path d="M210,150 h40 M230,130 v40" stroke="#FFFFFF" strokeWidth={3} opacity={0.7} />
        </svg>
        <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px 16px', background: 'rgba(14,30,43,0.95)', fontFamily: '"Nunito Variable", sans-serif', fontWeight: 900, fontSize: 26, color: '#FFB347', letterSpacing: '0.05em'}}>
          <span>INSECT CAMERA · THERMAL</span>
          <span style={{color: '#FFFFFF', opacity: 0.6 + 0.4 * Math.sin(t * 8)}}>SCANNING…</span>
        </div>
      </div>
    </div>
  );
};
export {smoothClosed, clamp};
