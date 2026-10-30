// HOOK 06 environment: a damp, softly lit plant layer. Far background (out of focus foliage and light), midground
// blades, the twig the robin uses (bird plane), and the big leaf the snail crawls on (subject plane).
import React from 'react';
import {hash, noise1} from '../shared/lib';
import {lit, shade} from '../shared/color';
import {INK} from '../shared/ink';
import {P, poly, V} from './geo';

const f2 = (n: number) => n.toFixed(2);

// ---------- far background (design px, centred on the screen centre at t = 0) ----------
export const Background: React.FC<{t: number}> = ({t}) => {
  const bokeh = Array.from({length: 26}, (_, k) => ({
    x: -700 + hash(k * 1.9) * 1400, y: -1100 + hash(k * 3.3) * 1500, r: 16 + hash(k * 5.1) * 60, a: 0.08 + hash(k * 7.3) * 0.2, ph: hash(k) * 6,
  }));
  const leaves = Array.from({length: 9}, (_, k) => ({x: -800 + k * 200 + hash(k * 2.2) * 120, y: -900 + hash(k * 4.4) * 900, r: 120 + hash(k * 6.6) * 140, ang: hash(k * 8.8) * 180}));
  return (
    <g>
      <defs>
        <linearGradient id="h06-sky" x1="0" y1="-1300" x2="0" y2="1300" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1B3530" />
          <stop offset="0.38" stopColor="#2F5444" />
          <stop offset="0.58" stopColor="#4F7652" />
          <stop offset="1" stopColor="#2A4A34" />
        </linearGradient>
      </defs>
      <rect x={-1400} y={-1500} width={2800} height={3000} fill="url(#h06-sky)" />
      <g filter="url(#h06-blurBg)">
        {/* a soft shaft of light from upper left */}
        <path d={`M${f2(-900 + 30 * Math.sin(t * 0.4))},-1300 L${f2(-420 + 30 * Math.sin(t * 0.4))},-1300 L300,300 L-60,300Z`} fill="#F2EFC4" opacity={0.08} />
        {leaves.map((l, k) => (
          <ellipse key={k} cx={f2(l.x + 8 * Math.sin(t * 0.5 + k))} cy={l.y} rx={l.r} ry={l.r * 0.42} transform={`rotate(${f2(l.ang)} ${f2(l.x)} ${f2(l.y)})`} fill={k % 3 === 0 ? '#5E8A55' : '#16302A'} opacity={k % 3 === 0 ? 0.35 : 0.55} />
        ))}
        {bokeh.map((b, k) => (
          <circle key={k} cx={f2(b.x + 6 * Math.sin(t * 0.7 + b.ph))} cy={f2(b.y)} r={b.r} fill="#D8EBA8" opacity={b.a * (0.75 + 0.25 * Math.sin(t * 1.1 + b.ph))} />
        ))}
      </g>
    </g>
  );
};

// ---------- midground blades (design px at t = 0) ----------
export const Midground: React.FC<{t: number}> = ({t}) => {
  const blades = [
    {x: -520, h: 700, bend: 120, w: 34, c: '#2B4F38'},
    {x: -360, h: 560, bend: -80, w: 26, c: '#36603F'},
    {x: 380, h: 760, bend: 140, w: 38, c: '#284A35'},
    {x: 560, h: 620, bend: -60, w: 30, c: '#335C3E'},
    {x: 120, h: 480, bend: 90, w: 22, c: '#3A6644'},
  ];
  return (
    <g filter="url(#h06-blurMid)">
      {blades.map((b, k) => {
        const sw = 14 * Math.sin(t * 0.9 + k * 1.3);
        const y0 = 120;
        const tip = V(b.x + b.bend + sw, y0 - b.h);
        const d = `M${b.x - b.w / 2},${y0} Q${f2(b.x + b.bend * 0.3)},${f2(y0 - b.h * 0.6)} ${f2(tip.x)},${f2(tip.y)} Q${f2(b.x + b.bend * 0.3 + b.w * 0.6)},${f2(y0 - b.h * 0.6)} ${b.x + b.w / 2},${y0}Z`;
        return <path key={k} d={d} fill={b.c} opacity={0.85} />;
      })}
    </g>
  );
};

// ---------- the twig in the bird plane (design px at the end camera) ----------
export const twigY = (x: number) => -205 - (x + 760) * 0.035 + 7 * Math.sin(x / 95);
export const Twig: React.FC<{t: number}> = ({t}) => {
  const pts: P[] = [];
  const top: P[] = [], bot: P[] = [];
  for (let x = -1100; x <= 60; x += 20) {
    const y = twigY(x);
    const th = 22 - ((x + 1100) / 1160) * 12;
    pts.push(V(x, y));
    top.push(V(x, y - th / 2 + 7));
    bot.push(V(x, y + th / 2 + 7));
  }
  const d = poly([...top, ...bot.reverse()]);
  const leaf = (x: number, ang: number, s: number, k: number) => {
    const y = twigY(x) + 6;
    const a = ang + 4 * Math.sin(t * 1.4 + k);
    return (
      <g key={k} transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(a)}) scale(${s})`}>
        <path d="M0,0 C20,-18 70,-24 104,-4 C70,12 22,12 0,0Z" fill="#4F7A3C" stroke={INK} strokeWidth={1.2} strokeOpacity={0.6} />
        <path d="M2,0 C40,-6 70,-6 100,-4" fill="none" stroke="#86AE5E" strokeWidth={1.6} />
      </g>
    );
  };
  return (
    <g>
      <defs>
        <linearGradient id="h06-twig" x1="0" y1="-230" x2="0" y2="-170" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8A7052" />
          <stop offset="1" stopColor="#3E2F22" />
        </linearGradient>
      </defs>
      {/* a short side shoot and leaves */}
      <path d={`M-150,${f2(twigY(-150) + 6)} Q-120,${f2(twigY(-150) - 50)} -70,${f2(twigY(-150) - 80)}`} fill="none" stroke="#5A4632" strokeWidth={6} strokeLinecap="round" />
      {leaf(-70, -30, 0.7, 1)}
      {leaf(-560, 150, 0.8, 2)}
      {leaf(-30, 20, 0.85, 3)}
      <path d={d} fill="url(#h06-twig)" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      {[-640, -470, -300].map((x, k) => <ellipse key={k} cx={x} cy={f2(twigY(x) + 7)} rx={6} ry={8} fill="#4A3828" opacity={0.6} />)}
      <path d={poly(top.map((p) => V(p.x, p.y + 2.5)), false)} fill="none" stroke="#B49A76" strokeWidth={2} opacity={0.55} />
    </g>
  );
};

// ---------- the leaf (subject plane, world units) ----------
const EDGE_Y = -345;
export const leafEdge = (x: number) => EDGE_Y + 14 * Math.sin(x / 260 + 0.6) + 5 * Math.sin(x / 47);
export const Leaf: React.FC<{t: number; px: number}> = ({t, px}) => {
  const edge: P[] = [];
  for (let x = -1900; x <= 2300; x += 30) edge.push(V(x, leafEdge(x)));
  const d = poly([...edge, V(2300, 2200), V(-1900, 2200)]);
  // midrib from near lower left to the far edge
  const A = V(-1300, 1500), B = V(700, leafEdge(700) + 4);
  const rib = (k: number) => V(A.x + (B.x - A.x) * k, A.y + (B.y - A.y) * k);
  const veins: string[] = [];
  for (let k = 0; k < 16; k++) {
    const u = 0.08 + k * 0.058;
    const p = rib(u);
    const side = k % 2 === 0 ? 1 : -1;
    const lenV = 520 * (1.05 - u * 0.6);
    const e = side > 0 ? V(p.x + lenV * 0.95, p.y + lenV * 0.18) : V(p.x - lenV * 0.25, p.y - lenV * 0.62);
    const c = side > 0 ? V(p.x + lenV * 0.45, p.y - lenV * 0.12) : V(p.x - lenV * 0.02, p.y - lenV * 0.38);
    veins.push(`M${f2(p.x)},${f2(p.y)} Q${f2(c.x)},${f2(c.y)} ${f2(e.x)},${f2(Math.max(e.y, leafEdge(e.x) + 10))}`);
  }
  const dapples = Array.from({length: 7}, (_, k) => ({
    x: -900 + k * 330 + 40 * noise1(t * 0.35 + k * 3, k), y: -200 + hash(k * 3.7) * 700 + 25 * noise1(t * 0.3 + k, k + 9), rx: 120 + hash(k * 5.5) * 140, ry: 40 + hash(k * 2.5) * 40,
  }));
  return (
    <g>
      <defs>
        <linearGradient id="h06-leaf" x1="0" y1={EDGE_Y} x2="0" y2="1300" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9BC874" />
          <stop offset="0.12" stopColor="#7DB25C" />
          <stop offset="0.45" stopColor="#5B9746" />
          <stop offset="1" stopColor="#36682F" />
        </linearGradient>
        <clipPath id="h06-leafclip"><path d={d} /></clipPath>
      </defs>
      <path d={d} fill="url(#h06-leaf)" />
      <g clipPath="url(#h06-leafclip)">
        {dapples.map((q, k) => <ellipse key={k} cx={f2(q.x)} cy={f2(q.y)} rx={f2(q.rx * 1.5)} ry={f2(q.ry * 1.5)} fill="url(#h06-dapple)" />)}
        {veins.map((v, k) => <path key={k} d={v} fill="none" stroke="#A9D07E" strokeWidth={5} opacity={0.4} />)}
        {veins.map((v, k) => <path key={`s${k}`} d={v} fill="none" stroke="#2F5E2A" strokeWidth={3} opacity={0.18} transform="translate(2 4)" />)}
        <path d={`M${A.x},${A.y} L${f2(B.x)},${f2(B.y)}`} stroke="#B9DB8C" strokeWidth={22} opacity={0.55} />
        <path d={`M${A.x},${A.y} L${f2(B.x)},${f2(B.y)}`} stroke="#2E5A28" strokeWidth={6} opacity={0.25} transform="translate(6 10)" />
        {/* the lit rim where the leaf blade turns away at its far edge */}
        <path d={poly(edge.map((p) => V(p.x, p.y + 7)), false)} fill="none" stroke="#D2EAA6" strokeWidth={9} opacity={0.6} />
      </g>
      <path d={poly(edge, false)} fill="none" stroke={INK} strokeWidth={1.8 * px} opacity={0.8} />
    </g>
  );
};

// slime trail behind the snail (world units); x0 = tail tip
export const Slime: React.FC<{x0: number; t: number}> = ({x0, t}) => (
  <g>
    <path d={`M${f2(x0 + 10)},-5 L-2200,-3 L-2200,14 L${f2(x0 + 10)},9Z`} fill="#EEF5E4" opacity={0.2} />
    <path d={`M${f2(x0)},-1 L-2200,1`} stroke="#FFFFFF" strokeWidth={2.4} opacity={0.45} />
    {Array.from({length: 10}, (_, k) => {
      const x = x0 - 60 - k * 140 - hash(k) * 60;
      return <ellipse key={k} cx={f2(x)} cy={2} rx={10 + hash(k * 3) * 10} ry={2.2} fill="#FFFFFF" opacity={0.35 + 0.25 * Math.sin(t * 2 + k)} />;
    })}
  </g>
);

// drifting motes (design px at t = 0), in a plane just in front of the background
export const Motes: React.FC<{t: number}> = ({t}) => (
  <g>
    {Array.from({length: 22}, (_, k) => {
      const x = -560 + hash(k * 2.7) * 1120 + 30 * noise1(t * 0.5 + k, k) + 14 * t;
      const y = -900 + hash(k * 4.9) * 1700 - 18 * t * (0.5 + hash(k));
      const r = 1.6 + hash(k * 6.1) * 2.6;
      return <circle key={k} cx={f2(x)} cy={f2(y)} r={f2(r)} fill="#F4F2D0" opacity={0.25 + 0.3 * hash(k * 9.3)} />;
    })}
  </g>
);

export const shadeLeaf = shade;
export const litLeaf = lit;
