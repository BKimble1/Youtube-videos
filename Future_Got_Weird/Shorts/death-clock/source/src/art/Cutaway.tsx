// V3 torso cutaway: an oval window in the same man's chest (tee, skin and the layers under them cut cleanly),
// drawn on the torso's own frame so it turns and breathes with him. It is not a flat panel: the rim has
// thickness (the far inner wall shows the cut layers), the cavity darkens with depth, and the organs sit
// deeper than the rim, so they shift against it when the camera moves (parallax). One organ (the liver) dims
// under amber sensors; the heart beats, then turns irregular. Where the near arm crosses the window, the arm
// is seen through (x-ray), so the heart is never hidden behind it.
import React from 'react';
import {lit, mix, shade} from '../lib/color';
import {add, clamp, fmt, lerp, mul, V} from '../lib/math';
import {Glow, SoftShadow} from '../lib/shade';
import {Heart2} from './Interior';

const up = (a: number): V => ({x: -Math.sin((a * Math.PI) / 180), y: -Math.cos((a * Math.PI) / 180)});
const px = (a: number): V => ({x: Math.cos((a * Math.PI) / 180), y: -Math.sin((a * Math.PI) / 180)});

export type CutGeo = {c: V; rx: number; ry: number; ang: number; tc: number; s: number; loc: (u: number, v: number) => V};

/** The window's frame on the chest: centred between the shoulders and the waist, a little toward his front. */
export const cutGeo = (C: V, tc: number, s: number, open: number): CutGeo => {
  const loc = (u: number, v: number) => add(C, add(mul(up(tc), u * s), mul(px(tc), v * s)));
  const e = clamp(open);
  return {c: loc(74, -40), rx: 74 * s * e, ry: 62 * s * Math.pow(e, 0.8), ang: -tc, tc, s, loc};
};

export const cutPathD = (g: CutGeo) => {
  const {c, rx, ry, ang} = g;
  const a = (ang * Math.PI) / 180;
  const pts: V[] = [];
  for (let i = 0; i < 48; i++) {
    const t = (i / 48) * Math.PI * 2;
    // slightly flattened on the far (back) side: the window follows the chest's curve
    const k = 1 - 0.08 * Math.max(0, Math.cos(t));
    const x = Math.cos(t) * rx * k;
    const y = Math.sin(t) * ry;
    pts.push({x: c.x + x * Math.cos(a) - y * Math.sin(a), y: c.y + x * Math.sin(a) + y * Math.cos(a)});
  }
  return `M${pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')} Z`;
};

type Props = {
  id: string;
  f: number;
  g: CutGeo;
  /** camera centre, for parallax of the deep layers */
  cam: {x: number; y: number};
  open: number;
  /** liver failing 0..1 */
  organ: number;
  /** heart irregular 0..1 */
  chaos: number;
  organSense: number;
  heartSense: number;
  /** settling after treatment 0..1 (calms the chaos already given) */
  heartPos: V;
  heartSize: number;
  /** the torso's outline: the window never reaches past the body */
  bodyD?: string;
};

export const ChestCut: React.FC<Props> = ({id, f, g, cam, open, organ, chaos, organSense, heartSense, heartPos, heartSize, bodyD}) => {
  const e = clamp(open);
  if (e <= 0.01) return null;
  const d = cutPathD(g);
  const s = g.s;
  // deep layers move less than the rim when the camera moves: the organs sit inside the body
  const par = (k: number): V => ({x: (cam.x - g.c.x) * k, y: (cam.y - g.c.y) * k});
  const deep = par(0.1);
  const mid = par(0.05);
  const liver = add(g.loc(26, -30), deep);
  const lungA = add(g.loc(112, -62), mid);
  const lungB = add(g.loc(96, 6), mid);
  const heart = add(heartPos, deep);
  const liverCol = mix('#A0453A', '#6E5A52', organ);
  // the far inner wall (the cut layers seen inside the window): a crescent on the window's upper/back side
  const wallOff = mul(up(g.tc), -16 * s);
  const ring = 0.8 * e;
  return (
    <g clipPath={bodyD ? `url(#${id}-body)` : undefined}>
      <defs>
        {bodyD && (
          <clipPath id={`${id}-body`}>
            <path d={bodyD} />
          </clipPath>
        )}
        <clipPath id={`${id}-c`}>
          <path d={d} />
        </clipPath>
        <radialGradient id={`${id}-cav`} gradientUnits="userSpaceOnUse" cx={fmt(g.c.x + deep.x)} cy={fmt(g.c.y + deep.y)} r={fmt(Math.max(1, g.rx * 1.1))}>
          <stop offset="0" stopColor="#5A1A20" />
          <stop offset="0.65" stopColor="#3A0E14" />
          <stop offset="1" stopColor="#1E060A" />
        </radialGradient>
        <radialGradient id={`${id}-lv`} gradientUnits="userSpaceOnUse" cx={fmt(liver.x - 20 * s)} cy={fmt(liver.y - 18 * s)} r={fmt(80 * s)}>
          <stop offset="0" stopColor={lit(liverCol, 0.3)} />
          <stop offset="0.6" stopColor={liverCol} />
          <stop offset="1" stopColor={shade(liverCol, 0.45)} />
        </radialGradient>
        <radialGradient id={`${id}-lg`} gradientUnits="userSpaceOnUse" cx={fmt(lungA.x)} cy={fmt(lungA.y)} r={fmt(70 * s)}>
          <stop offset="0" stopColor="#F4B3B8" />
          <stop offset="1" stopColor="#B86A74" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <path d={d} fill={`url(#${id}-cav)`} />
        {/* lungs, behind and around the heart */}
        <ellipse cx={fmt(lungA.x)} cy={fmt(lungA.y)} rx={fmt(62 * s)} ry={fmt(46 * s)} transform={`rotate(${fmt(-g.tc - 20)} ${fmt(lungA.x)} ${fmt(lungA.y)})`} fill={`url(#${id}-lg)`} opacity={0.85} />
        <ellipse cx={fmt(lungB.x)} cy={fmt(lungB.y)} rx={fmt(54 * s)} ry={fmt(40 * s)} transform={`rotate(${fmt(-g.tc + 10)} ${fmt(lungB.x)} ${fmt(lungB.y)})`} fill={`url(#${id}-lg)`} opacity={0.7} />
        {/* ribs: pale arcs over the deep layers, at the rim's depth */}
        {[-1, 0, 1, 2].map((k) => {
          const a = add(g.loc(40 + k * 34, -150), mid);
          const b = add(g.loc(62 + k * 34, 40), mid);
          const c2 = add(g.loc(30 + k * 34, -50), mid);
          return <path key={k} d={`M${fmt(a.x)},${fmt(a.y)} Q${fmt(c2.x)},${fmt(c2.y)} ${fmt(b.x)},${fmt(b.y)}`} fill="none" stroke="#F3E2D2" strokeOpacity={0.2} strokeWidth={fmt(12 * s)} strokeLinecap="round" />;
        })}
        {/* the liver: dims and greys under amber-flagged sensors when it starts failing */}
        <path
          d={`M${fmt(liver.x - 86 * s)},${fmt(liver.y + 6 * s)} C${fmt(liver.x - 70 * s)},${fmt(liver.y - 52 * s)} ${fmt(liver.x + 64 * s)},${fmt(liver.y - 56 * s)} ${fmt(liver.x + 82 * s)},${fmt(liver.y - 4 * s)} C${fmt(liver.x + 70 * s)},${fmt(liver.y + 30 * s)} ${fmt(liver.x - 40 * s)},${fmt(liver.y + 44 * s)} ${fmt(liver.x - 86 * s)},${fmt(liver.y + 6 * s)} Z`}
          fill={`url(#${id}-lv)`}
        />
        <ellipse cx={fmt(liver.x - 30 * s)} cy={fmt(liver.y - 22 * s)} rx={fmt(26 * s)} ry={fmt(7 * s)} fill="#FFFFFF" opacity={0.35 * (1 - organ * 0.7)} transform={`rotate(-12 ${fmt(liver.x - 30 * s)} ${fmt(liver.y - 22 * s)})`} />
        {organSense > 0.01 &&
          Array.from({length: 7}).map((_, i) => {
            const t = i / 7;
            const p = add(liver, {x: (Math.cos(t * 6.28 + f * 0.05) * 60 - 10) * s, y: (Math.sin(t * 6.28 + f * 0.05) * 22 - 4) * s});
            const col = organ > 0.3 ? '#FFB23E' : '#BFF3FF';
            return (
              <g key={i} opacity={organSense}>
                <Glow id={`${id}-os${i}`} c={p} r={14 * s} color={col} alpha={0.6} />
                <circle cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(4.2 * s)} fill="#FFFFFF" />
              </g>
            );
          })}
        {/* the heart */}
        <SoftShadow id={`${id}-hs`} c={add(heart, {x: 10 * s, y: 18 * s})} rx={60 * s} ry={40 * s} alpha={0.5} color="#12040A" />
        <Heart2 id={`${id}-ht`} c={heart} size={heartSize} rot={-g.tc * 0.4 - 18} chaos={chaos} f={f} />
        {heartSense > 0.01 &&
          Array.from({length: 6}).map((_, i) => {
            const t = i / 6;
            const p = add(heart, {x: Math.cos(t * 6.28 - f * 0.07) * 64 * s, y: Math.sin(t * 6.28 - f * 0.07) * 56 * s});
            const col = chaos > 0.3 ? '#FF4A5A' : '#BFF3FF';
            return (
              <g key={i} opacity={heartSense}>
                <Glow id={`${id}-hn${i}`} c={p} r={14 * s} color={col} alpha={0.65} />
                <circle cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(4.4 * s)} fill="#FFFFFF" />
              </g>
            );
          })}
        {/* the far inner wall of the cut: skin, fat and muscle layers seen edge-on inside the window */}
        <g transform={`translate(${fmt(wallOff.x)} ${fmt(wallOff.y)})`}>
          <path d={d} fill="none" stroke="#7E2E2E" strokeWidth={fmt(26 * s)} opacity={0.75} />
          <path d={d} fill="none" stroke="#F2C86A" strokeWidth={fmt(12 * s)} opacity={0.55} transform={`translate(${fmt(-wallOff.x * 0.3)} ${fmt(-wallOff.y * 0.3)})`} />
        </g>
        {/* depth shading toward the rim */}
        <path d={d} fill="none" stroke="#12040A" strokeWidth={fmt(34 * s)} opacity={0.35} />
      </g>
      {/* the clean rim: cut skin (lit edge) and the tee's edge around it */}
      <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={fmt(9 * s)} opacity={ring} />
      <path d={d} fill="none" stroke="#F6C7A8" strokeWidth={fmt(5 * s)} opacity={ring} />
      <path d={d} fill="none" stroke="#172B3A" strokeWidth={fmt(1.6 * s)} opacity={0.6 * e} />
    </g>
  );
};

/** The opening edge while the window grows: a bright line that sweeps round the rim. */
export const CutEdge: React.FC<{g: CutGeo; t: number}> = ({g, t}) => {
  if (t <= 0 || t >= 1) return null;
  const d = cutPathD(g);
  const L = 2 * Math.PI * Math.sqrt((g.rx * g.rx + g.ry * g.ry) / 2);
  return <path d={d} fill="none" stroke="#FFF4E0" strokeWidth={fmt(5 * g.s)} strokeDasharray={`${fmt(L * 0.18)} ${fmt(L)}`} strokeDashoffset={fmt(-L * t)} strokeLinecap="round" opacity={lerp(1, 0.6, t)} />;
};
