// clerkB's decoy: she sketches four walking figures with a fingertip on a battered tablet, taps, and a clip-on
// projector throws them as giant walking light-figures onto the smoke. The figures live on a vertical plane in the
// smoke volume: each body part is as bright as the smoke under it is dense (they break up where the smoke thins), they
// sort in depth with the smoke and the machines, and seen edge-on they collapse into a flat sheet of light (what the
// adapting drone sees in D3). Smashing the device makes them flicker out.
import React from 'react';
import {V3, add3, sub3, mul3, lerp, clamp, norm3, cross3, dot3, len3, rnd, noise} from '../../kit/math';
import {Item, project, PointLight} from '../engine';
import {FxOut, fx, combine, f1, glowEl, gid, glowTone} from './core';

// ------------------------------------------------------------------ the figure (local units: height 1, x = forward)
type P2 = {x: number; y: number};
type Part = {pts: P2[]; w: number; kind: 'line' | 'poly'};
/** A walking figure at walk phase `ph` (radians). Lines have width w (fraction of height). */
export const figureParts = (ph: number, seed = 0): Part[] => {
  const s = Math.sin(ph), c2 = Math.cos(ph);
  const lean = 0.03 + 0.01 * rnd(seed);
  const hip = {x: lean * 0.4, y: 0.47 + 0.012 * Math.abs(c2)};
  const sh = {x: lean, y: 0.78};
  const leg = (sgn: number): P2[] => {
    const a = 0.42 * s * sgn; // thigh swing
    const knee = {x: hip.x + Math.sin(a) * 0.24, y: hip.y - Math.cos(a) * 0.24};
    const bend = Math.max(0, -Math.sin(ph + (sgn > 0 ? 0 : Math.PI) + 0.6)) * 0.7;
    const b = a - bend;
    return [hip, knee, {x: knee.x + Math.sin(b) * 0.24, y: knee.y - Math.cos(b) * 0.24}];
  };
  const arm = (sgn: number): P2[] => {
    const a = -0.38 * s * sgn;
    const el = {x: sh.x + Math.sin(a) * 0.15, y: sh.y - Math.cos(a) * 0.15};
    const b = a - 0.25;
    return [sh, el, {x: el.x + Math.sin(b) * 0.15, y: el.y - Math.cos(b) * 0.15}];
  };
  const head = Array.from({length: 12}, (_, i) => ({x: lean * 1.2 + Math.cos((i / 12) * Math.PI * 2) * 0.075, y: 0.9 + Math.sin((i / 12) * Math.PI * 2) * 0.075}));
  return [
    {pts: leg(-1), w: 0.065, kind: 'line'},
    {pts: arm(-1), w: 0.05, kind: 'line'},
    {pts: [{x: sh.x - 0.085, y: 0.81}, {x: sh.x + 0.085, y: 0.81}, {x: hip.x + 0.07, y: hip.y + 0.01}, {x: hip.x - 0.07, y: hip.y + 0.01}], w: 0, kind: 'poly'},
    {pts: leg(1), w: 0.065, kind: 'line'},
    {pts: arm(1), w: 0.05, kind: 'line'},
    {pts: head, w: 0, kind: 'poly'},
  ];
};

/** Thick polyline → closed outline polygon (local 2D). */
const thick = (pts: P2[], w: number): P2[] => {
  const L: P2[] = [], R: P2[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    L.push({x: p.x + nx * w / 2, y: p.y + ny * w / 2});
    R.push({x: p.x - nx * w / 2, y: p.y - ny * w / 2});
  });
  // rounded-ish ends: extend the end points a little
  return [...L, ...R.reverse()];
};

// ------------------------------------------------------------------ the tablet screen (2D)
export type DecoyScreenProps = {
  w: number; h: number; t: number;
  /** sketch start; strokes take `sketchDur` s */ t0: number; sketchDur?: number;
  /** tap = figures fill and start walking (default t0 + sketchDur + 0.25) */ tapAt?: number;
  /** device smashed */ deadAt?: number;
  ink?: number;
};
const SLOTS = [0.17, 0.39, 0.61, 0.83];
/** Strokes of the four sketched figures in screen-local px (in drawing order). */
const sketchStrokes = (w: number, h: number): P2[][] => {
  const out: P2[][] = [];
  SLOTS.forEach((sx, j) => {
    const fh = h * 0.62, x0 = w * sx, y0 = h * 0.86; // feet
    const parts = figureParts(0.6 + j * 0.9, j);
    const T = (p: P2) => ({x: x0 + p.x * fh, y: y0 - p.y * fh});
    // head (circle), body (spine), legs, arms
    out.push(parts[5].pts.concat([parts[5].pts[0]]).map(T));
    out.push([T({x: 0.02, y: 0.82}), T({x: 0.0, y: 0.48})]);
    out.push(parts[0].pts.map(T), parts[3].pts.map(T), parts[1].pts.map(T), parts[4].pts.map(T));
  });
  return out;
};
const plen = (pts: P2[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);
const partial = (pts: P2[], u: number): P2[] => {
  const L = plen(pts) * clamp(u);
  const out: P2[] = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (acc + d >= L) { const k = (L - acc) / (d || 1); out.push({x: lerp(pts[i - 1].x, pts[i].x, k), y: lerp(pts[i - 1].y, pts[i].y, k)}); return out; }
    acc += d; out.push(pts[i]);
  }
  return out;
};

/** Where the fingertip is on the screen (0..1 of w, h): on the stroke being drawn, then on the tap point. */
export const decoyFinger = (p: {w?: number; h?: number; t: number; t0: number; sketchDur?: number; tapAt?: number}): {u: number; v: number; down: boolean} => {
  const w = p.w ?? 1, h = p.h ?? 0.66, dur = p.sketchDur ?? 2.6, tap = p.tapAt ?? p.t0 + dur + 0.25;
  const S = sketchStrokes(w, h);
  if (p.t < p.t0) return {u: 0.12, v: 0.95, down: false};
  if (p.t < p.t0 + dur) {
    const total = S.reduce((s, q) => s + plen(q), 0);
    let L = ((p.t - p.t0) / dur) * total;
    for (const q of S) { const l = plen(q); if (L <= l) { const e = partial(q, L / l); const tip = e[e.length - 1]; return {u: tip.x / w, v: tip.y / h, down: true}; } L -= l; }
  }
  const k = clamp((p.t - p.t0 - dur) / Math.max(0.05, tap - p.t0 - dur));
  return {u: lerp(0.83, 0.5, k), v: lerp(0.7, 0.93, k), down: Math.abs(p.t - tap) < 0.12};
};

/** The battered tablet's screen content, drawn in a local w × h box (top-left origin). */
export const DecoyScreen: React.FC<DecoyScreenProps> = ({w, h, t, t0, sketchDur = 2.6, tapAt, deadAt, ink = 2}) => {
  const tap = tapAt ?? t0 + sketchDur + 0.25;
  const dead = deadAt !== undefined && t >= deadAt;
  const S = sketchStrokes(w, h);
  const total = S.reduce((s, q) => s + plen(q), 0);
  let L = clamp((t - t0) / sketchDur) * total;
  const live = t >= tap;
  const lw = Math.max(1.2, h * 0.035);
  const glow = '#FFE9A8';
  const strokes: React.ReactElement[] = [];
  if (!live) {
    S.forEach((q, i) => {
      if (L <= 0) return;
      const l = plen(q);
      const e = L >= l ? q : partial(q, L / l);
      L -= l;
      strokes.push(<polyline key={i} points={e.map((p) => `${f1(p.x)},${f1(p.y)}`).join(' ')} fill="none" stroke={glow} strokeWidth={f1(lw)} strokeLinecap="round" strokeLinejoin="round" />);
    });
  } else {
    const ph = (t - tap) * 2 * Math.PI * 1.2;
    const scroll = ((t - tap) * w * 0.05) % (w * 0.22);
    SLOTS.forEach((sx, j) => {
      const fh = h * 0.62, x0 = w * sx - scroll, y0 = h * 0.86;
      const T = (p: P2) => ({x: x0 + p.x * fh, y: y0 - p.y * fh});
      figureParts(ph + j * 0.9, j).forEach((pt, k) => {
        const P = (pt.kind === 'line' ? thick(pt.pts, pt.w) : pt.pts).map(T);
        strokes.push(<polygon key={`${j}_${k}`} points={P.map((p) => `${f1(p.x)},${f1(p.y)}`).join(' ')} fill={glow} />);
      });
    });
  }
  const tapFlash = clamp(1 - Math.abs(t - tap) / 0.15);
  return (
    <g>
      <defs><clipPath id={gid('decoyscr', Math.round(w), Math.round(h))}><rect x={0} y={0} width={w} height={h} /></clipPath></defs>
      <rect x={0} y={0} width={w} height={h} fill={dead ? '#050708' : '#122631'} />
      {!dead && (
        <g clipPath={`url(#${gid('decoyscr', Math.round(w), Math.round(h))})`}>
          {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={0} y1={h * g} x2={w} y2={h * g} stroke="#1E3B48" strokeWidth={1} />)}
          <line x1={0} y1={h * 0.86} x2={w} y2={h * 0.86} stroke="#2E5566" strokeWidth={1.2} />
          {strokes}
          {tapFlash > 0 && <circle cx={w * 0.5} cy={h * 0.93} r={h * (0.05 + 0.2 * (1 - tapFlash))} fill="none" stroke="#FFFFFF" strokeWidth={1.4} opacity={tapFlash} />}
          {live && <circle cx={w * 0.93} cy={h * 0.1} r={h * 0.04} fill={Math.sin(t * 12) > 0 ? '#FFB24A' : '#6A4A20'} />}
        </g>
      )}
      {/* old crack across the battered screen; more when smashed */}
      <path d={`M ${f1(w * 0.08)} ${f1(h * 0.02)} L ${f1(w * 0.2)} ${f1(h * 0.3)} L ${f1(w * 0.16)} ${f1(h * 0.48)}`} fill="none" stroke="#DCEBF0" strokeWidth={0.9} opacity={0.55} />
      {dead && [0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${f1(w * 0.55)} ${f1(h * 0.45)} L ${f1(w * (0.55 + Math.cos(i * 1.3) * 0.5))} ${f1(h * (0.45 + Math.sin(i * 1.3) * 0.6))}`} stroke="#9FB2BA" strokeWidth={1} />)}
      <rect x={0} y={0} width={w} height={h} fill="none" stroke="#162A32" strokeWidth={ink} />
    </g>
  );
};

// ------------------------------------------------------------------ projection into the smoke
export type DecoyOpts = {
  key: string; t: number;
  /** projector lens position (clipped to clerkB's tablet; from the rig) */
  projector: (t: number) => V3;
  /** centre of the projected group (mid-height), inside the smoke */
  center: V3;
  /** direction the figures walk (heading degrees; 270 = west) */
  walkHeading: number;
  /** figure height (m) and spacing (m) */
  height?: number; spacing?: number; walkSpeed?: number;
  on: number; off?: number;
  /** smoke density sampler (smokeDensity bound to the shot's smoke sources) */
  density: (p: V3, t: number) => number;
  /**
   * light lands on the cloud's near surface: the figures are drawn over smoke puffs up to this many metres in front of
   * their plane (default 3.5) while solid things nearer than that still cover them
   */
  surface?: number;
  seed?: number;
};

/** 0..1 brightness of the projection: startup flicker after `on`, die-flicker after `off` (smashed). */
export const decoyPower = (t: number, on: number, off?: number, seed = 1): number => {
  if (t < on) return 0;
  let p = clamp((t - on) / 0.35);
  if (t - on < 0.45) p *= rnd(Math.floor((t - on) * 30) + seed * 17) > 0.35 ? 1 : 0.15;
  if (off !== undefined && t >= off) {
    const a = t - off;
    if (a > 0.5) return 0;
    p *= rnd(Math.floor(a * 30) + seed * 23) > 0.45 + a ? 0.9 : 0.05;
  }
  return p * (0.94 + 0.06 * noise(t * 9, seed));
};

const hull = (P: {x: number; y: number}[]) => {
  const pts = [...P].sort((a, b) => a.x - b.x || a.y - b.y);
  const cr = (o: {x: number; y: number}, a: {x: number; y: number}, b: {x: number; y: number}) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: typeof pts = [], up: typeof pts = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};

export const decoyItems = (o: DecoyOpts): FxOut => {
  const pw = decoyPower(o.t, o.on, o.off, o.seed ?? 1);
  if (pw <= 0.001) return fx();
  const H = o.height ?? 7, sp = o.spacing ?? H * 0.42, t = o.t;
  const U = {x: Math.sin((o.walkHeading * Math.PI) / 180), y: 0, z: -Math.cos((o.walkHeading * Math.PI) / 180)};
  const V = {x: 0, y: 1, z: 0};
  const N = norm3(cross3(U, V));
  const drift = (o.walkSpeed ?? 0.8) * (t - o.on);
  const base = add3(o.center, {x: 0, y: -H / 2, z: 0});
  const P0 = o.projector(t);
  const items: Item[] = [];
  const glowC = '#FFEDB5';
  // the giant figures
  for (let j = 0; j < 4; j++) {
    const foot = add3(base, mul3(U, (j - 1.5) * sp + drift + (rnd(j * 3 + 1) - 0.5) * 0.3 * sp));
    const ph = (t - o.on) * 2 * Math.PI * 0.55 + j * 1.7;
    const parts = figureParts(ph, j);
    const W = (p: P2): V3 => add3(foot, add3(mul3(U, p.x * H), mul3(V, p.y * H)));
    const mid = W({x: 0, y: 0.6});
    items.push({
      kind: 'sprite', pos: mid, key: `${o.key}_fig${j}`, bias: o.surface ?? 3.5,
      draw: (c) => {
        const out: React.ReactElement[] = [];
        // edge-on factor: how flat the plane is to this camera
        const toCam = norm3(sub3(c.view.pos, mid));
        const e = Math.abs(dot3(N, toCam));
        let dAvg = 0;
        // parts grouped into three brightness bands by the smoke density under them; each band is one path (union),
        // so overlapping limbs don't double up; parts over thin smoke drop out (the figure breaks up)
        const bands: string[] = ['', '', ''];
        parts.forEach((pt) => {
          const loc = pt.kind === 'line' ? thick(pt.pts, pt.w * 1.15) : pt.pts;
          // long limbs are split in two so each half reads its own density
          const pieces = pt.kind === 'line' ? [thick(pt.pts.slice(0, 2), pt.w * 1.15), thick(pt.pts.slice(1), pt.w * 1.15)] : [loc];
          pieces.forEach((pc) => {
            const ctr = pc.reduce((s2, p) => ({x: s2.x + p.x / pc.length, y: s2.y + p.y / pc.length}), {x: 0, y: 0});
            const dens = o.density(W(ctr), t) * pw;
            dAvg += dens / (parts.length * 1.6);
            if (dens < 0.22) return;
            const S = pc.map((p) => project(c.view, W(p)));
            if (S.some((s2) => s2.z < c.view.near)) return;
            const b = dens < 0.36 ? 0 : dens < 0.62 ? 1 : 2;
            bands[b] += 'M' + S.map((s2) => `${f1(s2.x)} ${f1(s2.y)}`).join('L') + 'Z';
          });
        });
        bands.forEach((d, b) => {
          if (d) out.push(<path key={b} d={d} fill={glowTone(c, b === 2 ? '#FFFBEA' : glowC, 0.25)} opacity={[0.32, 0.6, 0.9][b]} />);
        });
        // scattered light around the figure, in the smoke
        const g = glowEl(gid(o.key, 'g', j), c.x, c.y, H * 0.55 * c.k * Math.max(0.25, e), glowTone(c, glowC, 0.3), 0.32 * dAvg * pw, 0, 1.6 / Math.max(0.25, e));
        // seen edge-on: a flat sheet of light, nothing behind it
        const sheet = e < 0.3 ? (() => {
          const C = [W({x: -0.25, y: 0}), W({x: 0.25, y: 0}), W({x: 0.25, y: 1}), W({x: -0.25, y: 1})].map((p) => project(c.view, p));
          if (C.some((s) => s.z < c.view.near)) return null;
          return <polygon points={C.map((s) => `${f1(s.x)},${f1(s.y)}`).join(' ')} fill={glowTone(c, '#FFF7DA', 0.2)} opacity={f1((1 - e / 0.3) * 0.55 * pw)} />;
        })() : null;
        return <g>{g}{out}{sheet}</g>;
      },
    });
  }
  // the beam: one faint wedge from the lens to each figure, brighter where it crosses smoke (it lights the smoke, not
  // the air); a fainter overall wedge ties them together
  for (let j = 0; j < 4; j++) {
    const fx0 = (j - 1.5) * sp + drift;
    const a = add3(add3(base, mul3(V, H * 0.15)), mul3(U, fx0 - H * 0.12)), b = add3(add3(base, mul3(V, H * 0.95)), mul3(U, fx0 + H * 0.12));
    const ctr = add3(add3(base, mul3(V, H * 0.55)), mul3(U, fx0));
    const dB = [0.5, 0.75, 0.92].reduce((s2, k) => s2 + o.density(add3(P0, mul3(sub3(ctr, P0), k)), t), 0) / 3;
    items.push({
      kind: 'sprite', pos: add3(P0, mul3(sub3(ctr, P0), 0.8)), key: `${o.key}_beam${j}`, bias: -0.3,
      draw: (c) => {
        const S = [P0, a, b].map((p) => project(c.view, p));
        if (S.some((s2) => s2.z < c.view.near)) return null;
        return <polygon points={S.map((s2) => `${f1(s2.x)},${f1(s2.y)}`).join(' ')} fill={glowTone(c, '#FFF0C8', 0.3)} opacity={f1((0.025 + 0.12 * dB) * pw)} />;
      },
    });
  }
  // the lens itself
  items.push({
    kind: 'sprite', pos: P0, key: `${o.key}_lens`, bias: 0.1,
    draw: (c) => glowEl(gid(o.key, 'lens'), c.x, c.y, Math.max(6, 0.35 * c.k), glowTone(c, '#FFF6D8', 0.2), 0.9 * pw, 0.25),
  });
  const lights: PointLight[] = [{pos: add3(o.center, mul3(U, drift)), color: '#FFE7B0', power: 0.45 * pw, radius: H * 2, flicker: 0.05, seed: 5}];
  return combine(fx(items, lights));
};

