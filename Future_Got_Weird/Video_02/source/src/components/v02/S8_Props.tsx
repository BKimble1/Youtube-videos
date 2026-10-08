import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {rand} from '../../lib/anim';
import {E} from '../../lib/motion';
import {WH_COLORS, type WhPt, type WhViewState, whProjectWith} from './Warehouse';

/**
 * S8 props (scene-local): the robot's fuzzy blob estimate, a cardboard carton standing in the warehouse projection,
 * impact marks, and a screen-space label with a leader line. Everything is a pure function of its props.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const f2 = (n: number) => (Math.round(n * 100) / 100).toString();

/** Closed Catmull-Rom path through px points (smooth blob outline). */
const smoothClosed = (pts: {x: number; y: number}[]) => {
  const n = pts.length;
  let d = `M ${f2(pts[0].x)} ${f2(pts[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = {x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6};
    const c2 = {x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6};
    d += ` C ${f2(c1.x)} ${f2(c1.y)} ${f2(c2.x)} ${f2(c2.y)} ${f2(p2.x)} ${f2(p2.y)}`;
  }
  return d + ' Z';
};

/** Radial wobble factors of blob shape k (seeded): 9 lobes, ±14 %. */
const lobes = (seed: number, k: number) => Array.from({length: 9}, (_, i) => 1 + 0.14 * (rand(seed * 131 + k * 17 + i * 7) * 2 - 1));

/**
 * The robot's estimate: a soft, wobbly teal blob (flat fills, no blur), bigger than a person. `shape` is a continuous
 * shape index: integer values are seeded shapes, fractions blend two neighbours (ease it between sensor updates so the
 * outline never pops). `question` 0..1 brings in a "?" (the blob cannot say who).
 */
export const S8Blob: React.FC<{cx: number; cy: number; rx: number; ry: number; shape?: number; seed?: number; opacity?: number; question?: number}> = ({
  cx,
  cy,
  rx,
  ry,
  shape = 0,
  seed = 5,
  opacity = 1,
  question = 0,
}) => {
  if (opacity <= 0.001) return null;
  const k0 = Math.floor(shape);
  const u = shape - k0;
  const a = lobes(seed, k0);
  const b = lobes(seed, k0 + 1);
  const ring = (sc: number) =>
    a.map((fa, i) => {
      const f = fa + (b[i] - fa) * u;
      const th = (i / a.length) * Math.PI * 2 + 0.3;
      return {x: cx + Math.cos(th) * rx * f * sc, y: cy + Math.sin(th) * ry * f * sc};
    });
  const q = clamp01(question);
  const qs = q > 0 ? E.back(q) : 0;
  const fs = Math.min(rx, ry) * 0.95;
  return (
    <g opacity={opacity}>
      <path d={smoothClosed(ring(1))} fill={C.teal} fillOpacity={0.22} stroke={C.tealDeep} strokeWidth={3.5} strokeLinejoin="round" />
      <path d={smoothClosed(ring(0.56))} fill={C.teal} fillOpacity={0.28} />
      {q > 0.001 && (
        <text x={cx} y={cy + fs * 0.36} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={fs} fill={C.tealDeep} opacity={q} transform={`translate(${cx} ${cy}) scale(${qs}) translate(${-cx} ${-cy})`}>
          ?
        </text>
      )}
    </g>
  );
};

export type CartonBox = {x0: number; x1: number; z0: number; z1: number; h: number};

/**
 * A cardboard carton standing on the warehouse floor, drawn through the set's projection (front view: we see its -x
 * face, its +z face and its top). `tip` (deg) rocks it about the bottom edge it pivots on (screen space).
 */
export const S8Carton: React.FC<{s: WhViewState; box: CartonBox; tip?: number; opacity?: number}> = ({s, box, tip = 0, opacity = 1}) => {
  const {x0, x1, z0, z1, h} = box;
  const P = (pts: WhPt[]) =>
    pts
      .map((p, i) => {
        const q = whProjectWith(s, p);
        return `${i ? 'L' : 'M'} ${f2(q.x)} ${f2(q.y)}`;
      })
      .join(' ') + ' Z';
  const left = P([{x: x0, z: z0, h: 0}, {x: x0, z: z1, h: 0}, {x: x0, z: z1, h}, {x: x0, z: z0, h}]);
  const front = P([{x: x0, z: z1, h: 0}, {x: x1, z: z1, h: 0}, {x: x1, z: z1, h}, {x: x0, z: z1, h}]);
  const top = P([{x: x0, z: z0, h}, {x: x1, z: z0, h}, {x: x1, z: z1, h}, {x: x0, z: z1, h}]);
  const xm = (x0 + x1) / 2;
  const tape = P([{x: xm - 0.03, z: z0, h: h + 0.001}, {x: xm + 0.03, z: z0, h: h + 0.001}, {x: xm + 0.03, z: z1, h: h + 0.001}, {x: xm - 0.03, z: z1, h: h + 0.001}]);
  const tapeFront = P([{x: xm - 0.03, z: z1 + 0.001, h: h - 0.1}, {x: xm + 0.03, z: z1 + 0.001, h: h - 0.1}, {x: xm + 0.03, z: z1 + 0.001, h}, {x: xm - 0.03, z: z1 + 0.001, h}]);
  const pivot = whProjectWith(s, {x: x1, z: z1, h: 0});
  const shadow = P([{x: x0 - 0.02, z: z0, h: 0}, {x: x1 + 0.1, z: z0, h: 0}, {x: x1 + 0.1, z: z1 + 0.06, h: 0}, {x: x0 - 0.02, z: z1 + 0.06, h: 0}]);
  const ink = {stroke: C.ink, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const};
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity}}>
      <path d={shadow} fill={WH_COLORS.floorShadow} />
      <g transform={`rotate(${f2(tip)} ${f2(pivot.x)} ${f2(pivot.y)})`}>
        <path d={left} fill={WH_COLORS.boxTape} {...ink} />
        <path d={front} fill={WH_COLORS.box} {...ink} />
        <path d={tapeFront} fill={WH_COLORS.boxTape} />
        <path d={top} fill="#EDC992" {...ink} />
        <path d={tape} fill={WH_COLORS.boxTape} />
      </g>
    </svg>
  );
};

/** Three short ink strokes radiating from a contact point (comic impact marks), 0..1 over their short life. */
export const S8ImpactMarks: React.FC<{x: number; y: number; t: number; dir?: number; size?: number}> = ({x, y, t, dir = 180, size = 34}) => {
  if (t <= 0 || t >= 1) return null;
  const grow = E.out(clamp01(t / 0.35));
  const fade = 1 - clamp01((t - 0.55) / 0.45);
  return (
    <g opacity={fade} stroke={C.ink} strokeWidth={4.5} strokeLinecap="round">
      {[-40, 0, 40].map((da) => {
        const a = ((dir + da) * Math.PI) / 180;
        const r0 = 14 + 6 * grow;
        const r1 = r0 + size * (da === 0 ? 1 : 0.75) * grow;
        return <line key={da} x1={x + Math.cos(a) * r0} y1={y + Math.sin(a) * r0} x2={x + Math.cos(a) * r1} y2={y + Math.sin(a) * r1} />;
      })}
    </g>
  );
};

/** A pill label (screen px, vertically centred on y) with an optional ink leader line (explicit px ends, drawn from
 *  `leader.from` toward `leader.to`). Pops in with `t` (0..1) and then stays put. */
export const S8Label: React.FC<{
  x: number;
  y: number;
  text: React.ReactNode;
  t: number;
  size?: number;
  tone?: 'ink' | 'teal' | 'saffron' | 'paper' | 'coral';
  anchor?: 'left' | 'center' | 'right';
  leader?: {from: {x: number; y: number}; to: {x: number; y: number}};
}> = ({x, y, text, t, size = 34, tone = 'paper', anchor = 'left', leader}) => {
  if (t <= 0.001) return null;
  const map = {
    ink: {bg: C.ink, fg: C.paper, bd: C.ink},
    teal: {bg: C.teal, fg: C.white, bd: C.tealDeep},
    saffron: {bg: C.saffron, fg: C.ink, bd: C.ink},
    coral: {bg: C.coral, fg: C.white, bd: C.coralDeep},
    paper: {bg: C.cream, fg: C.ink, bd: C.ink},
  }[tone];
  const s = E.back(clamp01(t));
  const op = clamp01(t * 2.5);
  const tx = anchor === 'left' ? '0%' : anchor === 'center' ? '-50%' : '-100%';
  const h = Math.round(size * 1.62);
  const lt = E.out(clamp01(t * 1.3));
  return (
    <>
      {leader && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: op}}>
          <line x1={leader.from.x} y1={leader.from.y} x2={leader.from.x + (leader.to.x - leader.from.x) * lt} y2={leader.from.y + (leader.to.y - leader.from.y) * lt} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
          <circle cx={leader.to.x} cy={leader.to.y} r={7 * clamp01(t * 1.5 - 0.5)} fill={C.ink} />
        </svg>
      )}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y - h / 2,
          height: h,
          transform: `translateX(${tx}) scale(${s})`,
          transformOrigin: anchor === 'left' ? '0% 50%' : anchor === 'center' ? '50% 50%' : '100% 50%',
          opacity: op,
          display: 'flex',
          alignItems: 'center',
          boxSizing: 'border-box',
          padding: `0 ${Math.round(size * 0.62)}px`,
          borderRadius: 999,
          background: map.bg,
          color: map.fg,
          border: `4px solid ${map.bd}`,
          fontFamily: F.body,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          boxShadow: `5px 6px 0 ${C.shadow}`,
        }}
      >
        {text}
      </div>
    </>
  );
};

/** Inline pill (for rows of pills laid out by flexbox): pops in with `t`, keeps its layout box from the start so
 *  neighbours never shift. */
export const S8Pill: React.FC<{t: number; text: React.ReactNode; size?: number; tone?: 'ink' | 'teal' | 'saffron' | 'paper' | 'coral'}> = ({t, text, size = 40, tone = 'paper'}) => {
  const map = {
    ink: {bg: C.ink, fg: C.paper, bd: C.ink},
    teal: {bg: C.teal, fg: C.white, bd: C.tealDeep},
    saffron: {bg: C.saffron, fg: C.ink, bd: C.ink},
    coral: {bg: C.coral, fg: C.white, bd: C.coralDeep},
    paper: {bg: C.cream, fg: C.ink, bd: C.ink},
  }[tone];
  const h = Math.round(size * 1.62);
  return (
    <div
      style={{
        height: h,
        transform: `scale(${t > 0 ? E.back(clamp01(t)) : 0.001})`,
        transformOrigin: '0% 50%',
        opacity: clamp01(t * 2.5),
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        padding: `0 ${Math.round(size * 0.62)}px`,
        borderRadius: 999,
        background: map.bg,
        color: map.fg,
        border: `4px solid ${map.bd}`,
        fontFamily: F.body,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        boxShadow: `5px 6px 0 ${C.shadow}`,
      }}
    >
      {text}
    </div>
  );
};

/** A left-anchored row of pills, vertically centred on y (screen px). */
export const S8PillRow: React.FC<{x: number; y: number; size?: number; gap?: number; children: React.ReactNode}> = ({x, y, size = 40, gap = 14, children}) => (
  <div style={{position: 'absolute', left: x, top: y - Math.round(size * 1.62) / 2, display: 'flex', gap}}>{children}</div>
);

/**
 * A thought bubble with a "?" rising from a head point (x, y) (screen px): two small trailing circles, then a round
 * cream bubble up and to the left. Pops in with `t` (0..1) and stays put.
 */
export const S8ThinkBubble: React.FC<{x: number; y: number; t: number; r?: number}> = ({x, y, t, r = 62}) => {
  if (t <= 0.001) return null;
  const k = E.back(clamp01(t));
  const op = clamp01(t * 2.5);
  const c = {x: x - 96, y: y - 150};
  const dots = [
    {x: x - 16, y: y - 26, r: 8, d: 0},
    {x: x - 42, y: y - 62, r: 13, d: 0.15},
  ];
  return (
    <g opacity={op}>
      {dots.map((d, i) => {
        const s = E.back(clamp01((t - d.d) / (1 - d.d)));
        return <circle key={i} cx={d.x} cy={d.y} r={d.r * s} fill={C.cream} stroke={C.ink} strokeWidth={4} />;
      })}
      <g transform={`translate(${f2(c.x)} ${f2(c.y)}) scale(${f2(k)})`}>
        <circle cx={5} cy={6} r={r} fill={C.shadow} />
        <circle r={r} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
        <text y={r * 0.42} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={r * 1.35} fill={C.tealDeep}>
          ?
        </text>
      </g>
    </g>
  );
};
