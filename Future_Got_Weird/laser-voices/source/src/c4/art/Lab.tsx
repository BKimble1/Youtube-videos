// The acoustics lab, in the Weird Crew flat illustration style: a warm, late-afternoon research room. Back wall: a big
// window onto the city at golden hour (drawn on far planes, so it parallaxes behind the glass), a sliding door. Left: an
// optical table with its posts, lenses and mirrors, a shelf of instruments over it. Right: tall equipment shelving and a
// whiteboard. Ceiling: pendant lamps throwing warm pools on a tiled floor. Down the middle: the demonstration lane,
// taped on the floor from the emitter to the listener's mark, with foot ticks and an 8 FT sticker.
import React from 'react';
import {mixHex} from '../lib';
import {INK} from '../rig/cast';
import {B, pathOf, proj, projPoly, V3, v3} from '../rig/geo';
import {AIR, box, cyl, depth, hz, inkPx, Item, poly, seg, tones} from './d3';
import {BZ, EAR0, LENS, LX, ROOM} from '../world';

export const PAL = {
  wall: '#F1E6CC', wallLo: '#1CA7A0', wallLoDeep: '#128078', skirt: '#2E4A55', ceil: '#E9DDC2', floor: '#A9BDC5', floorLine: '#93AAB3',
  frame: '#3F5560', glass: '#FFE9B8', saffron: '#FFC744', coral: '#EF6B55', teal: '#1CA7A0', blue: '#4F7CC9', blueLight: '#D3E1F8', cream: '#FFFBF0',
  steel: '#9FB0BA', steelDark: '#6E8390', table: '#56656E', wood: '#C9924F', woodDeep: '#9E6B30', lamp: '#2E4A55', light: '#FFF2CF',
};
const Y = ROOM.h;

/** the city at golden hour, seen through the window: sky, sun, two layers of rooftops, a water tower, a mast */
const Exterior: React.FC<{b: B; t: number; win: {x: number; y: number}[]}> = ({b, t, win}) => {
  const far = 40, mid = 22;
  const P = (x: number, y: number, z: number) => proj(b, v3(x, y, z));
  const sky0 = P(0, 14, far), sky1 = P(0, 0, far);
  const sun = P(-6 + 0.05 * t, 3.1, far);
  const sunR = (b.c.f * 1.6) / Math.max(1, sun.z);
  const roofs = (z: number, seed: number, base: number, col: string, top: string) => {
    const pts: {x: number; y: number}[] = [];
    let x = -40;
    let k = 0;
    const out: React.ReactNode[] = [];
    while (x < 40) {
      const w = 2.5 + ((seed * 7 + k * 13) % 9) * 0.5;
      const h = base + ((seed * 5 + k * 11) % 7) * 0.9;
      const a = P(x, 0, z), c = P(x + w, h, z);
      out.push(<rect key={`${z}-${k}`} x={a.x} y={c.y} width={Math.max(1, c.x - a.x)} height={Math.max(1, a.y - c.y)} fill={col} />);
      out.push(<rect key={`${z}-${k}t`} x={a.x} y={c.y} width={Math.max(1, c.x - a.x)} height={Math.max(1, (b.c.f * 0.25) / z)} fill={top} />);
      // lit windows on the near layer
      if (z === mid) {
        for (let r = 0; r < Math.floor(h / 1.2); r++)
          for (let q = 0; q < Math.floor(w / 1.1); q++) {
            if (((k * 31 + r * 7 + q * 3) % 5) !== 0) continue;
            const wp = P(x + 0.4 + q * 1.1, 0.8 + r * 1.2, z);
            out.push(<rect key={`${z}-${k}-${r}-${q}`} x={wp.x} y={wp.y} width={(b.c.f * 0.45) / z} height={(b.c.f * 0.5) / z} fill="#FFE29A" opacity={0.85} />);
          }
      }
      x += w + 0.4;
      k++;
    }
    void pts;
    return out;
  };
  const tower = (() => {
    const base = P(4, 9.5, mid), top = P(4, 12.4, mid), legL = P(3.2, 6.2, mid), legR = P(4.8, 6.2, mid);
    const w = (b.c.f * 1.4) / mid;
    return (
      <g>
        <line x1={legL.x} y1={legL.y} x2={base.x - w * 0.4} y2={base.y} stroke="#3B5560" strokeWidth={2} />
        <line x1={legR.x} y1={legR.y} x2={base.x + w * 0.4} y2={base.y} stroke="#3B5560" strokeWidth={2} />
        <rect x={base.x - w / 2} y={top.y} width={w} height={base.y - top.y} rx={3} fill="#4C6A75" stroke="#2C434C" strokeWidth={2} />
        <path d={`M ${base.x - w / 2 - 3} ${top.y} L ${base.x} ${top.y - w * 0.45} L ${base.x + w / 2 + 3} ${top.y} Z`} fill="#3B5560" />
      </g>
    );
  })();
  const mast = P(-9, 16, far), mastB = P(-9, 6, far);
  const blink = Math.sin(t * 4) > 0.3;
  const cloud = (cx: number, cy: number, s: number, k2: number) => {
    const c = P(cx + 0.15 * t * k2, cy, far);
    const r = (b.c.f * s) / far;
    return <g key={cx}><ellipse cx={c.x} cy={c.y} rx={r * 2.2} ry={r * 0.6} fill="#FFF3D6" opacity={0.7} /><ellipse cx={c.x + r * 0.6} cy={c.y - r * 0.35} rx={r * 1.2} ry={r * 0.55} fill="#FFF7E6" opacity={0.7} /></g>;
  };
  return (
    <g>
      <defs>
        <clipPath id="c2win"><path d={pathOf(win)} /></clipPath>
        <linearGradient id="c2sky" gradientUnits="userSpaceOnUse" x1={sky0.x} y1={sky0.y} x2={sky1.x} y2={sky1.y}>
          <stop offset="0" stopColor="#9ED3DA" />
          <stop offset="0.45" stopColor="#FFE0A6" />
          <stop offset="0.8" stopColor="#FFB98A" />
          <stop offset="1" stopColor="#F49A7A" />
        </linearGradient>
      </defs>
      <g clipPath="url(#c2win)">
        <rect x={-4000} y={-4000} width={9000} height={9000} fill="url(#c2sky)" />
        <circle cx={sun.x} cy={sun.y} r={sunR * 1.8} fill="#FFF0C8" opacity={0.5} />
        <circle cx={sun.x} cy={sun.y} r={sunR} fill="#FFF6DA" />
        {cloud(-14, 9, 1.4, 1)}
        {cloud(6, 11, 1.1, 0.7)}
        <line x1={mast.x} y1={mast.y} x2={mastB.x} y2={mastB.y} stroke="#6F8A93" strokeWidth={2} />
        <circle cx={mast.x} cy={mast.y} r={3} fill={blink ? '#EF6B55' : '#8A4A40'} />
        {roofs(far, 3, 4, '#B9A6A0', '#CDB9B2')}
        {roofs(mid, 1, 2.2, '#7D8F96', '#93A6AD')}
        {tower}
      </g>
    </g>
  );
};

/** the whole room, as paint items (shell planes on layer 0) */
export const labItems = (b: B, t: number, o: {lane?: number; tapeLit?: number} = {}): {items: (Item | null)[]; back: React.ReactNode} => {
  const it: (Item | null)[] = [];
  const {x0, x1, z0, z1} = ROOM;
  const Q = v3;
  // ---- shell
  it.push(poly(b, [Q(x0, 0, z0), Q(x1, 0, z0), Q(x1, 0, z1), Q(x0, 0, z1)], PAL.floor, {layer: -2, stroke: false}));
  it.push(poly(b, [Q(x0, Y, z0), Q(x1, Y, z0), Q(x1, Y, z1), Q(x0, Y, z1)], PAL.ceil, {layer: -2, stroke: false}));
  // back wall around the window (four panels so the window is a real opening)
  const W = {x0: -3.3, x1: 2.5, y0: 0.95, y1: 2.85};
  const back = [
    [Q(x0, 0, z1), Q(x1, 0, z1), Q(x1, W.y0, z1), Q(x0, W.y0, z1)],
    [Q(x0, W.y1, z1), Q(x1, W.y1, z1), Q(x1, Y, z1), Q(x0, Y, z1)],
    [Q(x0, W.y0, z1), Q(W.x0, W.y0, z1), Q(W.x0, W.y1, z1), Q(x0, W.y1, z1)],
    [Q(W.x1, W.y0, z1), Q(x1, W.y0, z1), Q(x1, W.y1, z1), Q(W.x1, W.y1, z1)],
  ];
  back.forEach((p) => it.push(poly(b, p, PAL.wall, {layer: -2, stroke: false})));
  it.push(poly(b, [Q(x0, 0, z0), Q(x0, 0, z1), Q(x0, Y, z1), Q(x0, Y, z0)], '#E8DCC0', {layer: -2, stroke: false}));
  it.push(poly(b, [Q(x1, 0, z0), Q(x1, 0, z1), Q(x1, Y, z1), Q(x1, Y, z0)], '#E8DCC0', {layer: -2, stroke: false}));
  // teal dado band and skirting on the three walls
  const band = (y0: number, y1: number, col: string) => {
    it.push(poly(b, [Q(x0, y0, z1 - 0.005), Q(x1, y0, z1 - 0.005), Q(x1, y1, z1 - 0.005), Q(x0, y1, z1 - 0.005)], col, {layer: -1, stroke: false}));
    it.push(poly(b, [Q(x0 + 0.005, y0, z0), Q(x0 + 0.005, y0, z1), Q(x0 + 0.005, y1, z1), Q(x0 + 0.005, y1, z0)], col, {layer: -1, stroke: false}));
    it.push(poly(b, [Q(x1 - 0.005, y0, z0), Q(x1 - 0.005, y0, z1), Q(x1 - 0.005, y1, z1), Q(x1 - 0.005, y1, z0)], col, {layer: -1, stroke: false}));
  };
  band(0.12, 0.86, PAL.wallLo);
  band(0.86, 0.92, PAL.saffron);
  band(0, 0.12, PAL.skirt);
  // corners
  [[x0, z1], [x1, z1]].forEach(([x, z]) => it.push(seg(b, Q(x, 0, z), Q(x, Y, z), INK, 1, {layer: -1})));
  it.push(seg(b, Q(x0, 0, z1), Q(x1, 0, z1), INK, 1, {layer: -1}));
  it.push(seg(b, Q(x0, 0, z0), Q(x0, 0, z1), INK, 1, {layer: -1}));
  it.push(seg(b, Q(x1, 0, z0), Q(x1, 0, z1), INK, 1, {layer: -1}));
  // floor tiles
  for (let x = Math.ceil(x0 / 0.6) * 0.6; x < x1; x += 0.6) it.push(seg(b, Q(x, 0.001, z0), Q(x, 0.001, z1), PAL.floorLine, 0.8, {layer: -1}));
  for (let z = Math.ceil(z0 / 0.6) * 0.6; z < z1; z += 0.6) it.push(seg(b, Q(x0, 0.001, z), Q(x1, 0.001, z), PAL.floorLine, 0.8, {layer: -1}));
  // low sun through the window: warm patches on the floor, one per pane, stretched toward the camera side
  for (let i = 0; i < 4; i++) {
    const xa = W.x0 + ((W.x1 - W.x0) * i) / 4 + 0.06, xb = W.x0 + ((W.x1 - W.x0) * (i + 1)) / 4 - 0.06;
    const sh = -0.35;
    it.push(poly(b, [Q(xa, 0.003, z1 - 0.9), Q(xb, 0.003, z1 - 0.9), Q(xb + sh * 2.2, 0.003, z1 - 3.1), Q(xa + sh * 2.2, 0.003, z1 - 3.1)], '#FFE3A8', {layer: -1, stroke: false, op: 0.55}));
  }
  // the window: frame, mullions, sill
  const winPts = projPoly(b, [Q(W.x0, W.y0, z1), Q(W.x1, W.y0, z1), Q(W.x1, W.y1, z1), Q(W.x0, W.y1, z1)], 0.03);
  const frame = (pts: V3[]) => it.push(poly(b, pts, PAL.frame, {layer: 0}));
  frame([Q(W.x0 - 0.08, W.y1, z1 - 0.01), Q(W.x1 + 0.08, W.y1, z1 - 0.01), Q(W.x1 + 0.08, W.y1 + 0.08, z1 - 0.01), Q(W.x0 - 0.08, W.y1 + 0.08, z1 - 0.01)]);
  frame([Q(W.x0 - 0.08, W.y0 - 0.08, z1 - 0.01), Q(W.x1 + 0.08, W.y0 - 0.08, z1 - 0.01), Q(W.x1 + 0.08, W.y0, z1 - 0.01), Q(W.x0 - 0.08, W.y0, z1 - 0.01)]);
  for (let i = 0; i <= 4; i++) {
    const x = W.x0 + ((W.x1 - W.x0) * i) / 4;
    frame([Q(x - 0.04, W.y0, z1 - 0.01), Q(x + 0.04, W.y0, z1 - 0.01), Q(x + 0.04, W.y1, z1 - 0.01), Q(x - 0.04, W.y1, z1 - 0.01)]);
  }
  frame([Q(W.x0, 1.95, z1 - 0.01), Q(W.x1, 1.95, z1 - 0.01), Q(W.x1, 2.0, z1 - 0.01), Q(W.x0, 2.0, z1 - 0.01)]);
  it.push(box(b, W.x0 - 0.12, W.x1 + 0.12, W.y0 - 0.1, W.y0 - 0.04, z1 - 0.18, z1, '#D9CBAA', {layer: 0}));
  // window glass sheen (two diagonal streaks)
  [[-2.6, 0.9], [0.6, 0.7]].forEach(([x, w]) => it.push(poly(b, [Q(x, W.y0 + 0.1, z1 - 0.02), Q(x + w * 0.3, W.y0 + 0.1, z1 - 0.02), Q(x + w, W.y1 - 0.1, z1 - 0.02), Q(x + w * 0.7, W.y1 - 0.1, z1 - 0.02)], '#FFFFFF', {layer: 0, stroke: false, op: 0.18, glow: true})));
  // the sliding door, back right
  it.push(poly(b, [Q(3.1, 0, z1 - 0.01), Q(4.5, 0, z1 - 0.01), Q(4.5, 2.25, z1 - 0.01), Q(3.1, 2.25, z1 - 0.01)], '#5A7A86', {layer: 0}));
  it.push(poly(b, [Q(3.25, 1.2, z1 - 0.02), Q(4.35, 1.2, z1 - 0.02), Q(4.35, 2.05, z1 - 0.02), Q(3.25, 2.05, z1 - 0.02)], '#BFE8E3', {layer: 0}));
  it.push(poly(b, [Q(3.12, 2.32, z1 - 0.02), Q(4.48, 2.32, z1 - 0.02), Q(4.48, 2.48, z1 - 0.02), Q(3.12, 2.48, z1 - 0.02)], '#3FD18A', {layer: 0, glow: true}));
  // ---- left: optical table along the left wall, instrument shelf above it
  const T = {x0: -5.3, x1: -3.6, z0: 4.9, z1: 7.9, y: 0.86};
  it.push(box(b, T.x0, T.x1, T.y - 0.1, T.y, T.z0, T.z1, {top: '#6D7C85', front: '#56656E', side: '#46545C'}));
  [[T.x0 + 0.1, T.z0 + 0.1], [T.x1 - 0.1, T.z0 + 0.1], [T.x0 + 0.1, T.z1 - 0.1], [T.x1 - 0.1, T.z1 - 0.1]].forEach(([x, z]) => it.push(box(b, x - 0.07, x + 0.07, 0, T.y - 0.1, z - 0.07, z + 0.07, '#3F5560')));
  // hole grid on the table top
  for (let i = 1; i < 6; i++) it.push(seg(b, Q(T.x0 + (i * (T.x1 - T.x0)) / 6, T.y + 0.001, T.z0 + 0.05), Q(T.x0 + (i * (T.x1 - T.x0)) / 6, T.y + 0.001, T.z1 - 0.05), '#7F8F98', 0.35, {bias: 0.02}));
  // posts with lens holders and mirrors along a beam path on the table
  [5.2, 5.75, 6.3, 6.85, 7.4].forEach((z, i) => {
    const x = -4.45 + (i % 2) * 0.18;
    it.push(cyl(b, Q(x, T.y, z), 'y', 0.22, 0.025, PAL.steel));
    if (i % 2 === 0) it.push(cyl(b, Q(x - 0.02, T.y + 0.26, z), 'x', 0.04, 0.07, '#2E4A55', {cap: '#BFE8E3'}));
    else it.push(box(b, x - 0.07, x + 0.07, T.y + 0.2, T.y + 0.34, z - 0.015, z + 0.015, {top: '#E3EDF1', front: '#BFD8E6', side: '#9AB3C0'}));
  });
  it.push(box(b, -5.15, -4.75, T.y, T.y + 0.14, 7.3, 7.75, '#2E4A55'));
  it.push(seg(b, Q(-4.75, T.y + 0.08, 7.5), Q(-4.45, T.y + 0.26, 7.4), '#FF8A3D', 0.6, {bias: -0.05, dash: '4 4'}));
  // a power meter with a green readout
  it.push(box(b, -5.2, -4.85, T.y, T.y + 0.24, 5.0, 5.3, '#3F5560'));
  it.push(poly(b, [Q(-4.84, T.y + 0.06, 5.04), Q(-4.84, T.y + 0.06, 5.26), Q(-4.84, T.y + 0.2, 5.26), Q(-4.84, T.y + 0.2, 5.04)], '#3FD18A', {glow: true}));
  // the shelf above, with instruments: an oscilloscope (live trace), spools, labelled boxes, binders
  it.push(box(b, -5.5, -5.05, 1.62, 1.66, 4.6, 8.3, '#C9924F'));
  it.push(box(b, -5.5, -5.05, 2.25, 2.29, 4.6, 8.3, '#C9924F'));
  it.push(box(b, -5.45, -5.1, 1.66, 2.04, 4.8, 5.45, '#3F5560'));
  const scr = [Q(-5.095, 1.72, 4.88), Q(-5.095, 1.72, 5.37), Q(-5.095, 1.98, 5.37), Q(-5.095, 1.98, 4.88)];
  it.push(poly(b, scr, '#0F2A22', {bias: -0.01}));
  const trace = Array.from({length: 18}, (_, i) => Q(-5.09, 1.85 + 0.07 * Math.sin(i * 0.8 + t * 6) * Math.sin(i * 0.25), 4.9 + i * 0.026));
  for (let i = 0; i < trace.length - 1; i++) it.push(seg(b, trace[i], trace[i + 1], '#5BE08A', 0.5, {bias: -0.03}));
  [[5.6, '#EF6B55'], [5.8, '#FFC744'], [6.0, '#1CA7A0'], [6.2, '#4F7CC9']].forEach(([z, c]) => it.push(cyl(b, Q(-5.25, 1.66, z as number), 'y', 0.16, 0.08, c as string)));
  [[6.6, 0.32, '#FFC744'], [7.0, 0.25, '#D3E1F8'], [7.4, 0.36, '#EF6B55'], [7.85, 0.3, '#BFE8E3']].forEach(([z, h, c]) => it.push(box(b, -5.45, -5.12, 1.66, 1.66 + (h as number), (z as number) - 0.17, (z as number) + 0.17, c as string)));
  [[5.0, '#4F7CC9'], [5.12, '#1CA7A0'], [5.24, '#EF6B55'], [5.36, '#FFC744'], [5.48, '#3F5560'], [5.9, '#D3E1F8'], [6.02, '#4F7CC9']].forEach(([z, c]) => it.push(box(b, -5.45, -5.15, 2.29, 2.62, (z as number) - 0.05, (z as number) + 0.05, c as string)));
  // ---- right: tall shelving with equipment cases, a whiteboard with the lab's sketches
  for (let s = 0; s < 4; s++) it.push(box(b, 4.95, 5.5, 0.3 + s * 0.55, 0.34 + s * 0.55, 4.6, 6.4, '#C9924F'));
  it.push(box(b, 4.95, 5.5, 0, 2.2, 4.55, 4.6, '#9E6B30'));
  it.push(box(b, 4.95, 5.5, 0, 2.2, 6.4, 6.45, '#9E6B30'));
  [[0.34, 4.8, 5.4, '#3F5560'], [0.34, 5.6, 6.2, '#EF6B55'], [0.89, 4.75, 5.3, '#FFC744'], [0.89, 5.5, 6.25, '#D3E1F8'], [1.44, 4.8, 5.6, '#1CA7A0'], [1.44, 5.8, 6.25, '#3F5560']].forEach(([y, a, c2, col]) =>
    it.push(box(b, 5.05, 5.45, y as number, (y as number) + 0.42, a as number, c2 as number, col as string)));
  it.push(poly(b, [Q(5.49, 1.0, 6.9), Q(5.49, 1.0, 8.3), Q(5.49, 2.05, 8.3), Q(5.49, 2.05, 6.9)], '#FFFFFF', {n: v3(-1, 0, 0)}));
  // sketches on the whiteboard: a wave, a circle, an arrow
  const wb = (z: number, y: number) => Q(5.48, y, z);
  for (let i = 0; i < 12; i++) it.push(seg(b, wb(7.0 + i * 0.09, 1.7 + 0.12 * Math.sin(i * 0.9)), wb(7.09 + i * 0.09, 1.7 + 0.12 * Math.sin((i + 1) * 0.9)), '#4F7CC9', 0.5, {bias: -0.01}));
  for (let i = 0; i < 16; i++) it.push(seg(b, wb(7.5 + 0.18 * Math.cos((i / 16) * 6.28), 1.3 + 0.16 * Math.sin((i / 16) * 6.28)), wb(7.5 + 0.18 * Math.cos(((i + 1) / 16) * 6.28), 1.3 + 0.16 * Math.sin(((i + 1) / 16) * 6.28)), '#EF6B55', 0.5, {bias: -0.01}));
  it.push(seg(b, wb(7.1, 1.25), wb(7.3, 1.32), '#3F5560', 0.5, {bias: -0.01}));
  // ---- the demonstration lane: two saffron tape lines, foot ticks on the near one, the listener's mark
  const lane = o.lane ?? 1;
  const xa = LENS.x + 0.1, xb = LX + 0.35;
  [BZ - 0.42, BZ + 0.42].forEach((z, i) => it.push(poly(b, [Q(xa, 0.002, z - 0.025), Q(xa + (xb - xa) * lane, 0.002, z - 0.025), Q(xa + (xb - xa) * lane, 0.002, z + 0.025), Q(xa, 0.002, z + 0.025)], PAL.saffron, {layer: -1, stroke: false, key: `ln${i}`})));
  const FT = 0.3048;
  for (let i = 0; i <= 8; i++) {
    const x = LENS.x + i * FT;
    const lit = (o.tapeLit ?? 0) * 9 - i;
    it.push(poly(b, [Q(x - 0.012, 0.003, BZ - 0.42), Q(x + 0.012, 0.003, BZ - 0.42), Q(x + 0.012, 0.003, BZ - (i % 4 === 0 ? 0.6 : 0.52)), Q(x - 0.012, 0.003, BZ - (i % 4 === 0 ? 0.6 : 0.52))], lit > 0 ? PAL.coral : PAL.frame, {layer: -1, stroke: false}));
  }
  // the listener's floor mark: a saffron square with a pair of feet
  it.push(poly(b, [Q(LX - 0.28, 0.002, BZ - 0.28), Q(LX + 0.28, 0.002, BZ - 0.28), Q(LX + 0.28, 0.002, BZ + 0.28), Q(LX - 0.28, 0.002, BZ + 0.28)], '#FFE9A8', {layer: -1}));
  // ---- ceiling: pendant lamps, warm pools of light on the floor
  [[EAR0.x - 1.1, BZ], [LX + 0.1, BZ - 0.1], [-4.3, 6.4], [3.4, 6.6]].forEach(([x, z], i) => {
    it.push(seg(b, Q(x, Y, z), Q(x, 2.55, z), '#2E4A55', 0.6));
    it.push(cyl(b, Q(x, 2.38, z), 'y', 0.18, 0.2, {top: '#3F5560', front: '#2E4A55', side: '#22383F'}, {cap: PAL.light}));
    const pool = projPoly(b, Array.from({length: 24}, (_, k) => Q(x + Math.cos((k / 24) * 6.28) * 1.1, 0.004, z + Math.sin((k / 24) * 6.28) * 0.75)), 0.03);
    if (pool.length > 2) it.push({d: depth(b, Q(x, 0, z)), layer: -1, node: <path key={`pool${i}`} d={pathOf(pool)} fill="url(#c2pool)" />});
  });
  // ---- wall dressing: a cork board with pinned notes, a wall clock, a poster of the ear, an equipment cabinet,
  // a pipe run along the back wall, ceiling panels and a cable tray
  const zb = z1 - 0.012;
  it.push(poly(b, [Q(-5.1, 1.25, zb), Q(-3.7, 1.25, zb), Q(-3.7, 2.15, zb), Q(-5.1, 2.15, zb)], '#C9924F', {layer: 0}));
  it.push(poly(b, [Q(-5.04, 1.31, zb - 0.002), Q(-3.76, 1.31, zb - 0.002), Q(-3.76, 2.09, zb - 0.002), Q(-5.04, 2.09, zb - 0.002)], '#E2B77A', {layer: 0, stroke: false}));
  [[-4.95, 1.75, 0.3, 0.28, '#FFFFFF'], [-4.55, 1.4, 0.26, 0.3, '#FFE9A8'], [-4.2, 1.8, 0.36, 0.22, '#D3E1F8'], [-4.6, 1.85, 0.22, 0.18, '#BFE8E3'], [-4.05, 1.38, 0.24, 0.3, '#FFFFFF']].forEach(([x, y, w, h, c], i) => {
    it.push(poly(b, [Q(x as number, y as number, zb - 0.004), Q((x as number) + (w as number), y as number, zb - 0.004), Q((x as number) + (w as number), (y as number) + (h as number), zb - 0.004), Q(x as number, (y as number) + (h as number), zb - 0.004)], c as string, {layer: 0, sw: 0.7}));
    for (let k = 0; k < 3; k++) it.push(seg(b, Q((x as number) + 0.04, (y as number) + (h as number) - 0.07 - k * 0.06, zb - 0.005), Q((x as number) + (w as number) * (0.55 + 0.3 * ((i + k) % 2)), (y as number) + (h as number) - 0.07 - k * 0.06, zb - 0.005), '#93AAB3', 0.45, {layer: 0}));
    const pin = proj(b, Q((x as number) + (w as number) / 2, (y as number) + (h as number) - 0.025, zb - 0.006));
    if (pin.z > 0.1) it.push({d: 1e6, layer: 0, node: <circle key={`pin${i}`} cx={pin.x} cy={pin.y} r={Math.max(1, (b.c.f * 0.012) / pin.z)} fill={['#EF6B55', '#1CA7A0', '#4F7CC9'][i % 3]} />});
  });
  // the clock over the door: its hands keep real time from the frame
  {
    const c = Q(3.8, 2.85, zb), cp = proj(b, c);
    if (cp.z > 0.1) {
      const r = (b.c.f * 0.2) / cp.z;
      const mA = (t / 60) * 360 + 50, hA = 300 + t / 120;
      const hand = (a: number, l: number, w: number) => <line x1={cp.x} y1={cp.y} x2={cp.x + Math.sin((a * Math.PI) / 180) * r * l} y2={cp.y - Math.cos((a * Math.PI) / 180) * r * l} stroke={INK} strokeWidth={w} strokeLinecap="round" />;
      it.push({d: 1e6, layer: 0, node: <g key="clock"><circle cx={cp.x} cy={cp.y} r={r} fill="#FFFBF0" stroke={INK} strokeWidth={inkPx(b, cp.z, 1.2)} />{Array.from({length: 12}, (_, k) => <circle key={k} cx={cp.x + Math.sin(k * 0.5236) * r * 0.8} cy={cp.y - Math.cos(k * 0.5236) * r * 0.8} r={r * 0.05} fill="#3F5560" />)}{hand(hA, 0.5, r * 0.1)}{hand(mA, 0.75, r * 0.07)}<circle cx={cp.x} cy={cp.y} r={r * 0.07} fill={PAL.coral} /></g>});
    }
  }
  // ear poster on the left wall: an outline ear with its canal and a few rings
  {
    const xw = x0 + 0.012, P0 = (z: number, y: number) => Q(xw, y, z);
    it.push(poly(b, [P0(1.4, 1.2), P0(2.4, 1.2), P0(2.4, 2.3), P0(1.4, 2.3)], '#FFFBF0', {layer: 0, n: v3(1, 0, 0)}));
    it.push(poly(b, [P0(1.48, 2.12), P0(2.32, 2.12), P0(2.32, 2.22), P0(1.48, 2.22)], PAL.coral, {layer: 0, stroke: false, n: v3(1, 0, 0)}));
    const ear = Array.from({length: 20}, (_, k) => {
      const a = (k / 20) * Math.PI * 2;
      return P0(1.9 + 0.22 * Math.cos(a), 1.65 + 0.32 * Math.sin(a) * (Math.cos(a) > 0 ? 1 : 0.8));
    });
    it.push(poly(b, ear, '#F6C9A0', {layer: 0, n: v3(1, 0, 0)}));
    [0.08, 0.14, 0.2].forEach((r) => {
      for (let k = 0; k < 8; k++) it.push(seg(b, P0(1.6 - r * Math.cos(-0.8 + (k / 8) * 1.6), 1.65 + r * Math.sin(-0.8 + (k / 8) * 1.6)), P0(1.6 - r * Math.cos(-0.8 + ((k + 1) / 8) * 1.6), 1.65 + r * Math.sin(-0.8 + ((k + 1) / 8) * 1.6)), PAL.blue, 0.5, {layer: 0}));
    });
  }
  // a tall equipment cabinet on the right wall, glass doors, instruments inside
  it.push(box(b, 4.9, 5.5, 0, 2.15, 2.3, 3.5, '#D3E1F8'));
  it.push(poly(b, [Q(4.895, 0.9, 2.38), Q(4.895, 0.9, 3.42), Q(4.895, 2.05, 3.42), Q(4.895, 2.05, 2.38)], '#BFE8E3', {n: v3(-1, 0, 0), op: 0.9}));
  [[1.2, 2.5, '#FFC744'], [1.2, 2.95, '#EF6B55'], [1.62, 2.6, '#4F7CC9'], [1.62, 3.1, '#1CA7A0']].forEach(([y, z, c]) => it.push(box(b, 5.0, 5.35, y as number, (y as number) + 0.3, z as number, (z as number) + 0.3, c as string, {bias: 0.3})));
  it.push(seg(b, Q(4.89, 0.9, 2.9), Q(4.89, 2.05, 2.9), PAL.frame, 1));
  // pipe run along the back wall, with brackets
  it.push(cyl(b, Q(x0, 2.98, z1 - 0.12), 'x', x1 - x0, 0.045, '#9FB0BA', {layer: 0}));
  for (let x = -5; x < 5.5; x += 1.5) it.push(box(b, x - 0.03, x + 0.03, 2.9, 3.06, z1 - 0.18, z1 - 0.01, '#6E8390', {layer: 0}));
  // ceiling: panel grid and lit panels, a cable tray across the room
  for (let x = Math.ceil(x0 / 1.2) * 1.2; x < x1; x += 1.2) it.push(seg(b, Q(x, Y - 0.002, z0), Q(x, Y - 0.002, z1), '#D6C8AA', 0.6, {layer: -1}));
  for (let z = Math.ceil(z0 / 1.2) * 1.2; z < z1; z += 1.2) it.push(seg(b, Q(x0, Y - 0.002, z), Q(x1, Y - 0.002, z), '#D6C8AA', 0.6, {layer: -1}));
  [[-3.6, 2.4], [-3.6, 6.0], [2.4, 2.4], [2.4, 6.0], [-0.6, 0.0], [-0.6, 7.2]].forEach(([x, z]) => it.push(poly(b, [Q(x, Y - 0.004, z), Q(x + 1.2, Y - 0.004, z), Q(x + 1.2, Y - 0.004, z + 0.6), Q(x, Y - 0.004, z + 0.6)], '#FFF7DE', {layer: -1, glow: true})));
  it.push(box(b, x0, x1, 2.78, 2.84, 5.6, 5.9, '#9FB0BA', {layer: 0}));
  // ---- V3: a midground workbench behind her mark (depth between the characters and the window): a monitor showing
  // a spectrum, a desk lamp, glassware, a small printer, a stool tucked under
  {
    const bx0 = 0.25, bx1 = 2.85, bz0 = 6.0, bz1 = 6.65, by = 0.9;
    it.push(box(b, bx0, bx1, by - 0.05, by, bz0, bz1, {top: '#E8D2A8', front: '#C9924F', side: '#9E6B30'}));
    [[bx0 + 0.05, bz0 + 0.05], [bx1 - 0.05, bz0 + 0.05], [bx0 + 0.05, bz1 - 0.05], [bx1 - 0.05, bz1 - 0.05]].forEach(([x, z]) => it.push(box(b, x - 0.03, x + 0.03, 0, by - 0.05, z - 0.03, z + 0.03, '#6E8390')));
    it.push(box(b, bx0 + 0.05, bx1 - 0.05, 0.3, 0.34, bz0 + 0.05, bz1 - 0.05, '#9E6B30'));
    // monitor with a live spectrum
    it.push(box(b, 0.55, 1.25, by + 0.08, by + 0.52, 6.32, 6.38, '#2E4A55'));
    it.push(box(b, 0.85, 0.95, by, by + 0.1, 6.36, 6.42, '#3F5560'));
    const mz = 6.315;
    it.push(poly(b, [Q(0.59, by + 0.12, mz), Q(1.21, by + 0.12, mz), Q(1.21, by + 0.48, mz), Q(0.59, by + 0.48, mz)], '#10302A', {bias: -0.02}));
    for (let i = 0; i < 14; i++) {
      const x = 0.62 + i * 0.042, hgt = 0.04 + 0.22 * Math.abs(Math.sin(i * 1.7 + t * 2.2) * Math.sin(i * 0.5 + 0.4));
      it.push(poly(b, [Q(x, by + 0.14, mz - 0.002), Q(x + 0.03, by + 0.14, mz - 0.002), Q(x + 0.03, by + 0.14 + hgt, mz - 0.002), Q(x, by + 0.14 + hgt, mz - 0.002)], i % 3 === 0 ? '#FFC744' : '#5BE08A', {bias: -0.04, stroke: false}));
    }
    // desk lamp (base, arm, shade) with a warm pool on the bench
    it.push(cyl(b, Q(1.55, by, 6.4), 'y', 0.03, 0.08, '#2E4A55'));
    it.push(seg(b, Q(1.55, by + 0.03, 6.4), Q(1.62, by + 0.34, 6.35), '#2E4A55', 2));
    it.push(seg(b, Q(1.62, by + 0.34, 6.35), Q(1.82, by + 0.3, 6.3), '#2E4A55', 2));
    it.push(cyl(b, Q(1.82, by + 0.2, 6.3), 'y', 0.1, 0.07, '#EF6B55', {cap: '#FFF2CF'}));
    // glassware: two flasks and a beaker (cream liquid), a rack of test tubes
    [[2.05, 0.11, '#BFE8E3'], [2.25, 0.15, '#D3E1F8'], [2.45, 0.09, '#BFE8E3']].forEach(([x, h, c]) => it.push(cyl(b, Q(x as number, by, 6.35), 'y', h as number, 0.045, c as string, {cap: '#FFFFFF'})));
    it.push(box(b, 2.55, 2.78, by, by + 0.05, 6.2, 6.32, '#9E6B30'));
    for (let i = 0; i < 4; i++) it.push(cyl(b, Q(2.58 + i * 0.055, by + 0.02, 6.26), 'y', 0.14, 0.012, ['#EF6B55', '#FFC744', '#1CA7A0', '#4F7CC9'][i]));
    // printer
    it.push(box(b, 0.3, 0.52, by, by + 0.14, 6.15, 6.5, '#D3E1F8'));
    it.push(box(b, 0.33, 0.49, by + 0.14, by + 0.15, 6.2, 6.45, '#FFFFFF'));
    // stool under the bench
    it.push(cyl(b, Q(1.95, 0, 6.05), 'y', 0.04, 0.2, '#2E4A55'));
    it.push(cyl(b, Q(1.95, 0.04, 6.05), 'y', 0.5, 0.025, '#9FB0BA'));
    it.push(cyl(b, Q(1.95, 0.54, 6.05), 'y', 0.06, 0.17, '#1CA7A0', {cap: '#3FC7BF'}));
  }
  // ---- foreground props near the front cameras: a stool, a potted plant, a cable reel, a toolbox
  it.push(cyl(b, Q(2.75, 0, 2.2), 'y', 0.05, 0.26, '#2E4A55'));
  it.push(cyl(b, Q(2.75, 0.05, 2.2), 'y', 0.55, 0.03, '#9FB0BA'));
  it.push(cyl(b, Q(2.75, 0.6, 2.2), 'y', 0.07, 0.2, '#EF6B55', {cap: '#F58A76'}));
  it.push(cyl(b, Q(-3.2, 0, 2.6), 'y', 0.42, 0.2, '#C9924F', {cap: '#6E4A2A'}));
  [[-0.25, 0.9, 0.0], [0.2, 1.05, 0.5], [-0.05, 1.15, -0.4], [0.15, 0.8, -0.9], [-0.3, 0.75, 0.8]].forEach(([dx, h, a], i) => {
    const base = Q(-3.2, 0.42, 2.6);
    const tip = Q(-3.2 + dx * 1.6, 0.42 + h * 0.9, 2.6 + Math.sin(a) * 0.25);
    const mid = Q(-3.2 + dx * 0.8, 0.42 + h * 0.6, 2.6 + Math.sin(a) * 0.12);
    const side = Q(0.1 * Math.cos(a), 0, 0.1 * Math.sin(a));
    it.push(poly(b, [base, Q(mid.x + side.x, mid.y, mid.z + side.z), tip, Q(mid.x - side.x, mid.y, mid.z - side.z)], i % 2 ? '#3E9C5C' : '#2F8A4E', {bias: -0.05 * i}));
  });
  it.push(cyl(b, Q(2.0, 0.22, 1.55), 'z', 0.18, 0.22, '#FFC744', {cap: '#2E4A55'}));
  it.push(box(b, -2.2, -1.7, 0, 0.24, 1.7, 1.98, '#EF6B55'));
  it.push(box(b, -2.08, -1.82, 0.24, 0.29, 1.82, 1.86, '#3F5560'));
  // the back node: the exterior through the window, and the shared gradients
  const backNode = (
    <g>
      <defs>
        <radialGradient id="c2pool"><stop offset="0" stopColor="#FFF4D2" stopOpacity={0.55} /><stop offset="1" stopColor="#FFF4D2" stopOpacity={0} /></radialGradient>
      </defs>
      {winPts.length > 2 && <Exterior b={b} t={t} win={winPts} />}
    </g>
  );
  return {items: it, back: backNode};
};

/** warm light cones from the lamps (drawn over the scene, faint) */
export const LampCones: React.FC<{b: B; amt?: number}> = ({b, amt = 1}) => {
  const lamps = [[EAR0.x - 1.1, BZ], [LX + 0.1, BZ - 0.1]];
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={amt}>
      <defs>
        <linearGradient id="c2cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF0C4" stopOpacity={0.2} />
          <stop offset="1" stopColor="#FFF0C4" stopOpacity={0} />
        </linearGradient>
      </defs>
      {lamps.map(([x, z], i) => {
        const P = projPoly(b, [v3(x - 0.17, 2.38, z), v3(x + 0.17, 2.38, z), v3(x + 1.0, 0.05, z), v3(x - 1.0, 0.05, z)], 0.03);
        return P.length > 2 ? <path key={i} d={pathOf(P)} fill="url(#c2cone)" /> : null;
      })}
    </g>
  );
};
export {AIR, hz, inkPx, mixHex, tones};
