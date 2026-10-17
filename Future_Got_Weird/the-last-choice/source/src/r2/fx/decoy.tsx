// clerkB's decoy: she sketches four walking figures with a fingertip on a battered tablet, taps, and a clip-on
// projector throws them as giant walking light-figures onto the smoke. The figures live on a vertical plane in the
// smoke volume: each body part is as bright as the smoke under it is dense (they break up where the smoke thins), they
// sort in depth with the smoke and the machines, and seen edge-on they collapse into a flat sheet of light (what the
// adapting drone sees in D3). Smashing the device makes them flicker out.
import React from 'react';
import {V3, add3, sub3, mul3, lerp, lerp3, clamp, norm3, cross3, dot3, len3, rnd, noise} from '../../kit/math';
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
  /** the visible beam from the lens (cone, rays, dust motes); default true */
  beam?: boolean;
  /** dust motes drifting in the beam (default 26) */
  motes?: number;
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

const smoothK = (x: number) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const pathOf = (S: {x: number; y: number}[], close = true) => 'M' + S.map((s2) => `${f1(s2.x)} ${f1(s2.y)}`).join('L') + (close ? 'Z' : '');
const BRIGHT = ['#FFE2A0', '#FFE9B8', '#FFF1CF', '#FFF8E6'];

/**
 * The projection: light on smoke, not paper. Each figure is a warm-white glowing core inside a translucent body with a
 * soft halo, added onto the smoke (screen blend) so the billows show through; every limb piece is as bright as the smoke
 * under it is dense, so the figures break up and fade where the smoke thins; faint scan bands roll up through them and
 * they flicker. A visible beam (a cone from the lens, brightest at the source, with dust motes) ties them to the
 * projector, and point lights spill their light onto the smoke and onto whatever stands in front of it.
 */
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
  const blend = {mixBlendMode: 'screen' as const};
  // the giant figures
  for (let j = 0; j < 4; j++) {
    const foot = add3(base, mul3(U, (j - 1.5) * sp + drift + (rnd(j * 3 + 1) - 0.5) * 0.3 * sp));
    const ph = (t - o.on) * 2 * Math.PI * 0.55 + j * 1.7;
    const parts = figureParts(ph, j);
    const W = (p: P2): V3 => add3(foot, add3(mul3(U, p.x * H), mul3(V, p.y * H)));
    const mid = W({x: 0, y: 0.6});
    // per-figure flicker: a soft shimmer and, now and then, a brief dip
    const flick = (0.9 + 0.1 * noise(t * 11 + j * 3.1, 40 + j)) * (rnd(Math.floor(t * 24) * 7 + j * 131) > 0.97 ? 0.55 : 1);
    // pieces: each limb segment in two halves, the torso in an upper and a lower half, the head
    type Piece = {line?: P2[]; poly?: P2[]; w: number};
    const pieces: Piece[] = [];
    parts.forEach((pt) => {
      if (pt.kind === 'line') {
        for (let i = 0; i < pt.pts.length - 1; i++) {
          const a = pt.pts[i], b = pt.pts[i + 1], m = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
          pieces.push({line: [a, m], w: pt.w}, {line: [m, b], w: pt.w});
        }
      } else if (pt.pts.length === 4) {
        const [s0, s1, h1, h0] = pt.pts;
        const m0 = {x: (s0.x + h0.x) / 2, y: (s0.y + h0.y) / 2}, m1 = {x: (s1.x + h1.x) / 2, y: (s1.y + h1.y) / 2};
        pieces.push({poly: [s0, s1, m1, m0], w: 0}, {poly: [m0, m1, h1, h0], w: 0});
      } else pieces.push({poly: pt.pts, w: 0});
    });
    // smoke density under each piece (independent of the camera)
    const lit = pieces.map((pc) => {
      const pts = pc.line ?? pc.poly!;
      const ctr = pts.reduce((s2, p) => ({x: s2.x + p.x / pts.length, y: s2.y + p.y / pts.length}), {x: 0, y: 0});
      const d = o.density(W(ctr), t);
      return smoothK((d * pw * flick - 0.15) / 0.5);
    });
    const dAvg = lit.reduce((s2, b) => s2 + b, 0) / lit.length;
    items.push({
      kind: 'sprite', pos: mid, key: `${o.key}_fig${j}`, bias: o.surface ?? 3.5,
      draw: (c) => {
        // edge-on factor: how flat the plane is to this camera
        const toCam = norm3(sub3(c.view.pos, mid));
        const e = Math.abs(dot3(N, toCam));
        const k = c.k, fpx = H * k; // figure height in px
        // four brightness bands, each one union path (overlapping limbs don't double up); the core runs along the limbs,
        // up the spine and in the head
        const body = ['', '', '', ''], core = ['', '', '', ''];
        let all = '';
        pieces.forEach((pc, i) => {
          const b = lit[i];
          if (b < 0.05) return;
          const band = Math.min(3, Math.floor(b * 4));
          const outline = pc.line ? thick(pc.line, pc.w * 1.1) : pc.poly!;
          const S = outline.map((p) => project(c.view, W(p)));
          if (S.some((s2) => s2.z < c.view.near)) return;
          const dP = pathOf(S);
          body[band] += dP; all += dP;
          const pts = pc.line ?? pc.poly!;
          const ctr = pts.reduce((s2, p) => ({x: s2.x + p.x / pts.length, y: s2.y + p.y / pts.length}), {x: 0, y: 0});
          if (pc.line) core[band] += pathOf(pc.line.map((p) => project(c.view, W(p))), false);
          else if (pts.length === 4) {
            // torso half: a spine segment through its middle
            const top = {x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2}, bot = {x: (pts[2].x + pts[3].x) / 2, y: (pts[2].y + pts[3].y) / 2};
            core[band] += pathOf([project(c.view, W(top)), project(c.view, W(bot))], false);
          } else core[band] += pathOf(pts.map((p) => project(c.view, W({x: ctr.x + (p.x - ctr.x) * 0.45, y: ctr.y + (p.y - ctr.y) * 0.45}))));
        });
        if (!all) return null;
        const coreW = Math.max(1, 0.036 * fpx);
        const fBig = gid(o.key, 'fb', j), fSoft = gid(o.key, 'fs', j), pid = gid(o.key, 'scan', j);
        const per = Math.max(3, fpx / 24);
        const glowCol = glowTone(c, '#FFD69A', 0.25), coreCol = glowTone(c, '#FFFBEC', 0.2);
        // the light: a wide soft bloom of the whole figure; then the translucent body, its warm-white core and the scan
        // bands, all softened so no outline is crisp
        const soft = (
          <g filter={`url(#${fSoft})`}>
            {body.map((d, bi) => (d ? <path key={`b${bi}`} d={d} fill={glowTone(c, BRIGHT[bi], 0.25)} opacity={f1(0.14 + 0.36 * ((bi + 0.6) / 4))} /> : null))}
            {core.map((d, bi) => (d ? <path key={`c${bi}`} d={d} fill={coreCol} stroke={coreCol} strokeWidth={f1(coreW)} strokeLinecap="round" strokeLinejoin="round" opacity={f1(0.15 + 0.6 * ((bi + 0.6) / 4))} /> : null))}
            {fpx > 60 && <path d={all} fill={`url(#${pid})`} opacity={f1(0.16 * pw * flick)} />}
          </g>
        );
        const defs = (
          <defs>
            <filter id={fBig} x="-60%" y="-25%" width="220%" height="150%"><feGaussianBlur stdDeviation={f1(Math.max(1.5, 0.03 * fpx))} /></filter>
            <filter id={fSoft} x="-20%" y="-10%" width="140%" height="120%"><feGaussianBlur stdDeviation={f1(Math.max(0.6, 0.006 * fpx))} /></filter>
            <pattern id={pid} patternUnits="userSpaceOnUse" width={16} height={f1(per)} patternTransform={`translate(0 ${f1(-((t * 1.4 * per) % per))})`}>
              <rect x={0} y={0} width={16} height={f1(per * 0.42)} fill="#FFF6DD" />
            </pattern>
          </defs>
        );
        const bloom = <path d={all} fill={glowCol} filter={`url(#${fBig})`} opacity={f1(0.55 * (0.4 + 0.6 * dAvg) * pw * flick)} />;
        // scattered light around the figure, in the smoke
        const g = glowEl(gid(o.key, 'g', j), c.x, c.y, H * 0.6 * k * Math.max(0.25, e), glowTone(c, glowC, 0.3), 0.36 * dAvg * pw * flick, 0, 1.5 / Math.max(0.25, e));
        // seen edge-on: a flat sheet of light, nothing behind it
        const sheet = e < 0.3 ? (() => {
          const C = [W({x: -0.25, y: 0}), W({x: 0.25, y: 0}), W({x: 0.25, y: 1}), W({x: -0.25, y: 1})].map((p) => project(c.view, p));
          if (C.some((s) => s.z < c.view.near)) return null;
          return <polygon points={C.map((s) => `${f1(s.x)},${f1(s.y)}`).join(' ')} fill={glowTone(c, '#FFF7DA', 0.2)} opacity={f1((1 - e / 0.3) * 0.55 * pw)} />;
        })() : null;
        return <g style={blend}>{defs}{g}{bloom}{soft}{sheet}</g>;
      },
    });
  }
  // ---- the beam: a cone from the lens over the whole group, brightest at the source; it shows where it crosses
  // smoke (and a little in the dusty air); drawn in three depth slices so it sorts with what stands in it
  if (o.beam !== false) {
    const lo = -1.5 * sp + drift - 0.35 * H, hi = 1.5 * sp + drift + 0.35 * H;
    const C4 = [add3(base, mul3(U, lo)), add3(base, mul3(U, hi)), add3(add3(base, mul3(U, hi)), mul3(V, H * 1.02)), add3(add3(base, mul3(U, lo)), mul3(V, H * 1.02))];
    const gc = add3(add3(base, mul3(V, H * 0.5)), mul3(U, drift));
    const along = (u: number) => o.density(add3(P0, mul3(sub3(gc, P0), u)), t);
    const haze = 0.35 + 0.65 * Math.max(along(0.55), along(0.75), along(0.9));
    const slices: [number, number][] = [[0, 0.22], [0.22, 0.55], [0.55, 0.97]];
    const nM = o.motes ?? 26;
    slices.forEach(([u0, u1], si) => {
      const at = (p: V3, u: number) => add3(P0, mul3(sub3(p, P0), u));
      items.push({
        kind: 'sprite', pos: at(gc, (u0 + u1) / 2), key: `${o.key}_cone${si}`, bias: -0.3,
        draw: (c) => {
          const pts3 = u0 === 0 ? [P0, ...C4.map((p) => at(p, u1))] : [...C4.map((p) => at(p, u0)), ...C4.map((p) => at(p, u1))];
          const S = pts3.map((p) => project(c.view, p));
          if (S.some((s2) => s2.z < c.view.near)) return null;
          const A = project(c.view, P0), B = project(c.view, gc);
          if (A.z < c.view.near || B.z < c.view.near) return null;
          const id = gid(o.key, 'cone', si);
          const col = glowTone(c, '#FFF0C8', 0.3);
          const motes: React.ReactElement[] = [];
          for (let m = 0; m < nM; m++) {
            const u = 0.03 + 0.92 * rnd(m * 7 + 3);
            if (u < u0 || u >= u1) continue;
            const a = rnd(m * 11 + 5), b = rnd(m * 13 + 9);
            const tgt = add3(lerp3(C4[0], C4[1], a), mul3(V, H * (0.1 + 0.85 * b)));
            const p = add3(at(tgt, u), {x: 0.15 * noise(t * 0.4 + m, 3), y: 0.12 * noise(t * 0.3 + m, 5) + 0.05 * Math.sin(t * 0.7 + m), z: 0.15 * noise(t * 0.35 + m, 7)});
            const q = project(c.view, p);
            if (q.z < c.view.near) continue;
            const tw = 0.5 + 0.5 * noise(t * 2.2 + m * 1.7, 11);
            motes.push(<circle key={m} cx={f1(q.x)} cy={f1(q.y)} r={f1(Math.max(0.7, 0.025 * q.k))} fill="#FFF7E0" opacity={f1((0.25 + 0.55 * (1 - u)) * tw * pw)} />);
          }
          return (
            <g style={blend}>
              <defs>
                <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f1(A.x)} y1={f1(A.y)} x2={f1(B.x)} y2={f1(B.y)}>
                  <stop offset="0" stopColor={col} stopOpacity={0.6} />
                  <stop offset="0.1" stopColor={col} stopOpacity={0.3} />
                  <stop offset="0.5" stopColor={col} stopOpacity={0.04 + 0.1 * haze} />
                  <stop offset="1" stopColor={col} stopOpacity={0.04 + 0.16 * haze} />
                </linearGradient>
              </defs>
              <path d={pathOf(hull(S))} fill={`url(#${id})`} opacity={f1(0.75 * pw)} />
              {motes}
            </g>
          );
        },
      });
    });
    // a ray from the lens to each figure, brighter where it crosses smoke
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
          return <polygon style={blend} points={S.map((s2) => `${f1(s2.x)},${f1(s2.y)}`).join(' ')} fill={glowTone(c, '#FFF0C8', 0.3)} opacity={f1((0.02 + 0.09 * dB) * pw)} />;
        },
      });
    }
  }
  // the lens itself: a hot point with a soft bloom
  items.push({
    kind: 'sprite', pos: P0, key: `${o.key}_lens`, bias: 0.1,
    draw: (c) => (
      <g style={blend}>
        {glowEl(gid(o.key, 'lensb'), c.x, c.y, Math.max(14, 1.1 * c.k), glowTone(c, '#FFE9B8', 0.2), 0.5 * pw, 0)}
        {glowEl(gid(o.key, 'lens'), c.x, c.y, Math.max(6, 0.35 * c.k), glowTone(c, '#FFF6D8', 0.2), 0.95 * pw, 0.25)}
      </g>
    ),
  });
  // light spill: on the smoke around the figures, and toward the projector side (onto what stands in the beam)
  const toP = norm3({x: P0.x - o.center.x, y: 0, z: P0.z - o.center.z});
  const lights: PointLight[] = [
    {pos: add3(o.center, mul3(U, drift)), color: '#FFE7B0', power: 0.5 * pw, radius: H * 2, flicker: 0.06, seed: 5},
    {pos: add3(add3(o.center, mul3(U, drift)), add3(mul3(toP, 2.6), {x: 0, y: -H * 0.22, z: 0})), color: '#FFEFCB', power: 0.4 * pw, radius: H * 1.4, flicker: 0.06, seed: 9},
  ];
  return combine(fx(items, lights));
};
