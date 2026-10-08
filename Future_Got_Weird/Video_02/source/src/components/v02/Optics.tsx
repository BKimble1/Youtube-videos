/**
 * Drawing components for the optics primitives (lib/optics.ts), in the Video 01 flat cutout style.
 *
 * Plan-space components (LightPath, ScatterFan, CandidateArc, Band, PossibleCloud, WallMarker, SensorGlyph,
 * SightLine) take geometry in METRES plus a mapping `toPx(p) -> {x, y}` to the parent's pixel space, so the same
 * component draws in the plan view, the oblique room view, or any tilt between (straight plan segments map to straight
 * screen segments under any projective mapping; curves are sampled in plan space before mapping).
 *
 * Each returns an absolutely positioned, overflow-visible <svg> (drop it into any HTML layer), or a bare <g> with
 * `asGroup` to nest inside a parent <svg>. Screen-space components (ArrivalHistogram, TimingRuler, PulseDot) take pixel
 * sizes. Everything is a pure function of the props: drive `t` from the frame.
 *
 * SensorGlyph is a plan-space wrapper round the on-model <SensorTop/> (components/v02/HandheldSensor.tsx).
 *
 * Scene recipe (see dev/KitOptics.tsx):
 *   const sched = pathSchedule(path, {start: 30});           // shared PULSE_SPEED: longer paths arrive later
 *   <LightPath points={path} toPx={toPx} t={sched.progress(g)} layout={LAYOUT} />   // layout: throws on a bad leg
 *   <ScatterFan origin={W} ... t={tw(g, sched.vertexFrames[1], 10)} />             // fans cue on the bounces
 *   <TimingRuler ... marker={sched.nsAt(g)} />
 * Room view: toPx = (p) => project({...p, h: LAYOUT.sensor.h}, tilt), and pass
 *   hidden = (p) => isHiddenByOccluder({...p, h: LAYOUT.sensor.h}, tilt)
 * to LightPath / ScatterFan / CandidateArc so the stretches behind the partition are not drawn (Band and
 * PossibleCloud have no `hidden`: layer them below the partition instead).
 */
import React, {useId} from 'react';
import {C, F, OUTLINE} from '../../theme';
import {rand} from '../../lib/anim';
import {E} from '../../lib/motion';
import {textWidth} from '../../lib/measure';
import {SensorTop, facingOf} from './HandheldSensor';
import {
  arcRectIntervals,
  assertPath,
  extractContours,
  firstOccluderHit,
  len,
  lerpP,
  occluderRect,
  pathCumulative,
  polar,
  roomRect,
  sampleArc,
  segmentRectNearest,
  visibleIntervals,
  type OpticsLayout,
  type P2,
  type Rect,
  type ScalarField,
  type ScatterDir,
} from '../../lib/optics';

/* ------------------------------------------------------------------ shared helpers */

/** Maps a plan point (metres) to the parent's pixel space. */
export type ToPx = (p: P2) => {x: number; y: number};
type Px = {x: number; y: number};

export type Tone = 'saffron' | 'teal' | 'coral' | 'blue' | 'ink';
export const TONES: Record<Tone, {main: string; deep: string; light: string}> = {
  saffron: {main: C.saffron, deep: C.saffronDeep, light: C.saffronLight},
  teal: {main: C.teal, deep: C.tealDeep, light: C.tealLight},
  coral: {main: C.coral, deep: C.coralDeep, light: C.coralLight},
  blue: {main: C.blue, deep: C.blueDeep, light: C.blueLight},
  ink: {main: C.inkSoft, deep: C.ink, light: C.paperLine},
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerpPx = (a: Px, b: Px, t: number): Px => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
const hyp = (a: Px, b: Px) => Math.hypot(b.x - a.x, b.y - a.y);
const f2 = (n: number) => (Math.round(n * 100) / 100).toString();

/** Mix two #rrggbb colours (t = 0 → a, 1 → b). */
export const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const k = clamp01(t);
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, '0')).join('');
};

/** Polyline → SVG path data. */
export const polyD = (pts: Px[], closed = false) =>
  pts.length ? `M ${pts.map((p) => `${f2(p.x)} ${f2(p.y)}`).join(' L ')}${closed ? ' Z' : ''}` : '';

/** A stable, url()-safe id for <defs>. */
const useSafeId = (prefix: string) => prefix + useId().replace(/[^a-zA-Z0-9_-]/g, '');

/** Clip polygon (pixel space) of a plan rectangle under the mapping. */
const rectPolyD = (r: Rect, toPx: ToPx) =>
  polyD([toPx({x: r.x0, z: r.z0}), toPx({x: r.x1, z: r.z0}), toPx({x: r.x1, z: r.z1}), toPx({x: r.x0, z: r.z1})], true);

/** Wraps output either as a free-floating overlay <svg> or as a <g> for a parent <svg>. */
const Out: React.FC<{asGroup?: boolean; opacity?: number; children: React.ReactNode}> = ({asGroup, opacity = 1, children}) =>
  asGroup ? (
    <g opacity={opacity}>{children}</g>
  ) : (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <g opacity={opacity}>{children}</g>
    </svg>
  );

/** Overshooting ease for markers popping in. */
const backOut = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : E.back(t));

/** Distance (px) from point q to the segment [a, b]. */
const pxSegDist = (q: Px, a: Px, b: Px) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  const u = l2 > 0 ? clamp01(((q.x - a.x) * dx + (q.y - a.y) * dy) / l2) : 0;
  return Math.hypot(q.x - a.x - u * dx, q.y - a.y - u * dy);
};

/**
 * Splits a sampled plan polyline into the px runs whose points are visible (`hidden(p)` false). Where visibility
 * changes between two samples the edge is found by bisection on the chord, so a cut lands on the occluder's outline
 * rather than on the nearest sample.
 */
const visibleRunsPx = (plan: P2[], toPx: ToPx, hidden?: (p: P2) => boolean): Px[][] => {
  if (!hidden) return plan.length > 1 ? [plan.map(toPx)] : [];
  const runs: Px[][] = [];
  let cur: Px[] = [];
  let prevVis = plan.length ? !hidden(plan[0]) : false;
  if (prevVis) cur.push(toPx(plan[0]));
  for (let i = 1; i < plan.length; i++) {
    const v = !hidden(plan[i]);
    if (v !== prevVis) {
      let lo = 0;
      let hi = 1;
      for (let it = 0; it < 14; it++) {
        const m = (lo + hi) / 2;
        if (!hidden(lerpP(plan[i - 1], plan[i], m)) === prevVis) lo = m;
        else hi = m;
      }
      const edge = toPx(lerpP(plan[i - 1], plan[i], (lo + hi) / 2));
      if (prevVis) {
        cur.push(edge);
        if (cur.length > 1) runs.push(cur);
        cur = [];
      } else cur = [edge];
    }
    if (v) cur.push(toPx(plan[i]));
    prevVis = v;
  }
  if (cur.length > 1) runs.push(cur);
  return runs;
};

/* ------------------------------------------------------------------ PulseDot */

export type PulseDotProps = {x: number; y: number; r?: number; color?: string; intensity?: number; opacity?: number};

/** The travelling light pulse: a bright flat dot with an ink outline and a cream core (pixel space, SVG). */
export const PulseDot: React.FC<PulseDotProps> = ({x, y, r = 13, color = C.saffron, intensity = 1, opacity = 1}) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={r} fill={mixHex(color, C.paper, (1 - intensity) * 0.45)} stroke={C.ink} strokeWidth={3.5} />
    <circle cx={x - r * 0.28} cy={y - r * 0.28} r={r * 0.32} fill={C.cream} opacity={0.5 + 0.5 * intensity} />
  </g>
);

/* ------------------------------------------------------------------ LightPath */

export type LightPathProps = {
  /** Plan polyline; straight segments between reflections. Pass `layout` so a leg through the occluder throws. */
  points: P2[];
  toPx: ToPx;
  /** Progress of the pulse head along the path, 0..1 by length (constant speed). Use pathSchedule(...).progress(frame). */
  t: number;
  /** Number of pulse marks in the train (1 = a single dot). */
  pulses?: number;
  /** Spacing between train marks, metres along the path. */
  pulseGap?: number;
  /** Draw each pulse mark as a short dash aligned with the path instead of a dot. */
  dash?: boolean;
  /** Intensity kept per bounce (0..1). Later segments are drawn thinner and paler; the pulse shrinks a little. */
  intensityFalloff?: number;
  /** Trail colour. */
  color?: string;
  /** Pulse fill colour. */
  pulseColor?: string;
  /** Trail stroke width (px) of the first segment. */
  width?: number;
  pulseRadius?: number;
  /** Draw the whole path statically (no pulse, no bounce rings). */
  showFull?: boolean;
  /** Opacity of a faint preview of the not-yet-travelled remainder (0 = none). */
  ghost?: number;
  /** Pixel separation of out-and-back legs that retrace each other (they run in two lanes). 0 = overlap. */
  lane?: number;
  /** An expanding ring at each reflection as the pulse passes it. */
  bounceRings?: boolean;
  /** Final radius (px) of a bounce ring. */
  ringRadius?: number;
  /** What the pulse does at t ≥ 1: disappear (absorbed by the detector) or stay. */
  arrive?: 'hide' | 'hold';
  /**
   * Clip the bounce rings to this plan rectangle so a ring at a wall point does not enter the wall. Defaults to the
   * room of `layout` when `layout` is given; pass it explicitly otherwise.
   */
  ringClip?: Rect;
  /**
   * The layout the path lives in. When given: (1) assertPath runs on every render, so a leg through the occluder
   * throws with the leg named; (2) a leg that grazes the partition (W1 → H passes 2.7 cm from its corner on the
   * provisional layout) has its lanes nudged sideways so the drawn strokes keep `clearPx` px off the footprint.
   */
  layout?: OpticsLayout;
  /** With `layout`: minimum px gap between a stroke's edge and the occluder footprint (0 = never nudge). */
  clearPx?: number;
  /**
   * Room view: true for plan points the camera cannot see (e.g. p => isHiddenByOccluder({...p, h: 1.2}, tilt) from
   * lib/room). Those stretches of the trail, the pulse marks and the bounce rings are not drawn.
   */
  hidden?: (p: P2) => boolean;
  opacity?: number;
  asGroup?: boolean;
};

/**
 * A light path that travels: a pulse dot (or dash train) moves along the plan polyline at progress t; the travelled
 * part stays as a line that thins and pales after each bounce (intensity × falloff per reflection). Pulse positions
 * are mapped point by point (toPx of the plan point), so constant plan speed is exact under any mapping.
 */
export const LightPath: React.FC<LightPathProps> = ({
  points,
  toPx,
  t,
  pulses = 1,
  pulseGap = 0.16,
  dash = false,
  intensityFalloff = 0.6,
  color = C.saffronDeep,
  pulseColor = C.saffron,
  width = 7,
  pulseRadius = 13,
  showFull = false,
  ghost = 0,
  lane = 14,
  bounceRings = true,
  ringRadius = 56,
  arrive = 'hide',
  ringClip: ringClipProp,
  layout,
  clearPx = 6,
  hidden,
  opacity = 1,
  asGroup,
}) => {
  const ringClipId = useSafeId('ringclip');
  const n = points.length;
  if (n < 2) return null;
  if (layout) assertPath(points, layout);
  const ringClip = ringClipProp ?? (layout ? roomRect(layout) : undefined);
  const cum = pathCumulative(points);
  const total = cum[n - 1];
  const prog = showFull ? 1 : clamp01(t);
  const head = prog * total;
  const same = (a: P2, b: P2) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.z - b.z) < 1e-6;
  const strokeOf = (I: number) => mixHex(color, C.paper, (1 - I) * 0.6);
  const widthOf = (I: number) => width * (0.4 + 0.6 * I);
  const occ = layout && clearPx > 0 ? occluderRect(layout) : null;

  // 1. Each leg: px ends, left normal, the leg that retraces it (out and back), its lane offset, and how far it must
  //    move away from the partition so its stroke edge keeps clearPx px clear.
  const raw = Array.from({length: n - 1}, (_, i) => {
    const a = points[i];
    const b = points[i + 1];
    const pa = toPx(a);
    const pb = toPx(b);
    const L = Math.max(1e-6, hyp(pa, pb));
    const nrm = {x: -(pb.y - pa.y) / L, y: (pb.x - pa.x) / L};
    const partner = points.findIndex((_, j) => j !== i && j + 1 < n && same(points[j], b) && same(points[j + 1], a));
    const base = partner >= 0 ? lane / 2 : 0;
    const I = Math.pow(intensityFalloff, i);
    let away = {x: 0, y: 0};
    let need = 0;
    if (occ) {
      const q = toPx(segmentRectNearest(a, b, occ).onRect);
      const side = (q.x - pa.x) * nrm.x + (q.y - pa.y) * nrm.y >= 0 ? 1 : -1; // +1: the partition is on the normal's side
      away = {x: -side * nrm.x, y: -side * nrm.y};
      const edgeGap = pxSegDist(q, pa, pb) - base * side - widthOf(I) / 2;
      need = Math.max(0, clearPx - edgeGap);
    }
    return {a, b, nrm, partner, base, away, need, s0: cum[i], len: cum[i + 1] - cum[i], I};
  });
  // 2. Retracing pairs move together (by the larger need), so their lanes never cross.
  const segs = raw.map((s) => {
    const shift = Math.max(s.need, s.partner >= 0 ? raw[s.partner].need : 0);
    const off = {x: s.nrm.x * s.base + s.away.x * shift, y: s.nrm.y * s.base + s.away.y * shift};
    const at = (u: number): Px => {
      const p = toPx(lerpP(s.a, s.b, u));
      return {x: p.x + off.x, y: p.y + off.y};
    };
    const runs: [number, number][] = hidden ? visibleIntervals(s.a, s.b, hidden) : [[0, 1]];
    return {...s, off, at, runs, qa: at(0), qb: at(1)};
  });

  const trail: React.ReactNode[] = [];
  const ghosts: React.ReactNode[] = [];
  segs.forEach((s, i) => {
    const u = s.len > 0 ? clamp01((head - s.s0) / s.len) : 1;
    s.runs.forEach(([u0, u1], k) => {
      // the joint from the previous leg's lane end, when this leg's start (the bounce point) is visible
      const joint = u0 === 0 && i > 0 ? [segs[i - 1].qb] : [];
      const e = Math.min(u1, u);
      if (e > u0) {
        trail.push(<path key={`t${i}.${k}`} d={polyD([...joint, s.at(u0), s.at(e)])} fill="none" stroke={strokeOf(s.I)} strokeWidth={widthOf(s.I)} strokeLinecap="round" strokeLinejoin="round" />);
      }
      if (ghost > 0 && u1 > Math.max(u0, u)) {
        const from = Math.max(u0, u);
        ghosts.push(<path key={`g${i}.${k}`} d={polyD([...(u > u0 ? [] : joint), s.at(from), s.at(u1)])} fill="none" stroke={strokeOf(s.I)} strokeWidth={Math.max(2, widthOf(s.I) * 0.5)} strokeLinecap="round" strokeDasharray="2 12" opacity={ghost} />);
      }
    });
  });

  const rings: React.ReactNode[] = [];
  if (bounceRings && !showFull) {
    const ringLen = Math.min(0.55, total * 0.12);
    for (let v = 1; v < n - 1; v++) {
      const age = head - cum[v];
      if (age <= 0 || age >= ringLen || (hidden && hidden(points[v]))) continue;
      const u = age / ringLen;
      const p = toPx(points[v]);
      const I = segs[v - 1].I;
      rings.push(<circle key={`r${v}`} cx={p.x} cy={p.y} r={10 + (ringRadius - 10) * E.out(u)} fill="none" stroke={strokeOf(I)} strokeWidth={5 * (1 - u * 0.6)} opacity={(1 - u) * 0.9} />);
    }
  }

  const dots: React.ReactNode[] = [];
  const showPulse = !showFull && prog > 0 && (prog < 1 || arrive === 'hold');
  if (showPulse) {
    for (let k = pulses - 1; k >= 0; k--) {
      const d = head - k * pulseGap;
      if (d < 0 || d > total) continue;
      let i = segs.findIndex((s) => d <= s.s0 + s.len);
      if (i < 0) i = segs.length - 1;
      const s = segs[i];
      const u = s.len > 0 ? (d - s.s0) / s.len : 0;
      if (hidden && hidden(lerpP(s.a, s.b, u))) continue;
      const p = s.at(u);
      // trailing marks shrink with k but never below 2.5 px (a long train must not produce zero or negative sizes)
      const r = Math.max(2.5, pulseRadius * (0.72 + 0.28 * s.I) * (k === 0 ? 1 : 0.62 - k * 0.1));
      const op = k === 0 ? 1 : Math.max(0.25, 0.85 - k * 0.2);
      if (dash) {
        const L = Math.max(1e-6, hyp(s.qa, s.qb));
        const ux = (s.qb.x - s.qa.x) / L;
        const uy = (s.qb.y - s.qa.y) / L;
        const h = r * 1.3;
        const d2 = polyD([{x: p.x - ux * h, y: p.y - uy * h}, {x: p.x + ux * h, y: p.y + uy * h}]);
        dots.push(
          <g key={`p${k}`} opacity={op}>
            <path d={d2} stroke={C.ink} strokeWidth={r * 1.5 + 7} strokeLinecap="round" />
            <path d={d2} stroke={mixHex(pulseColor, C.paper, (1 - s.I) * 0.45)} strokeWidth={r * 1.5} strokeLinecap="round" />
          </g>,
        );
      } else if (k === 0) {
        dots.push(<PulseDot key={`p${k}`} x={p.x} y={p.y} r={r} color={pulseColor} intensity={s.I} opacity={op} />);
      } else {
        dots.push(<circle key={`p${k}`} cx={p.x} cy={p.y} r={r} fill={strokeOf(s.I)} opacity={op} />);
      }
    }
  }

  return (
    <Out asGroup={asGroup} opacity={opacity}>
      {ringClip && rings.length > 0 && (
        <defs>
          <clipPath id={ringClipId}>
            <path d={rectPolyD(ringClip, toPx)} />
          </clipPath>
        </defs>
      )}
      {ghosts}
      {trail}
      <g clipPath={ringClip && rings.length > 0 ? `url(#${ringClipId})` : undefined}>{rings}</g>
      {dots}
    </Out>
  );
};

/* ------------------------------------------------------------------ ScatterFan */

export type ScatterFanProps = {
  /** Point the light scatters from (plan): a wall point, or the hidden person. */
  origin: P2;
  /** From scatterDirections(normal, n, seed): unit directions with cosine weights. */
  dirs: ScatterDir[];
  /** Length of a ray along the normal (metres); others scale with their cosine weight. */
  length: number;
  toPx: ToPx;
  /** Draw-on 0..1 (rays grow out from the origin, slightly staggered). Start it at pathSchedule(...).vertexFrames[k]. */
  t: number;
  /** 0..1: the rays' tails leave the origin and run out to the tips (the scattered light departs). */
  release?: number;
  color?: string;
  width?: number;
  /** Seeds the per-ray length variation and stagger. */
  seed?: number;
  /** A small dot at each ray tip. */
  tips?: boolean;
  /** If given, each ray stops `stopMargin` metres short of the occluder. */
  layout?: OpticsLayout;
  /** Gap (metres) left between a stopped ray's tip and the occluder footprint. */
  stopMargin?: number;
  /** Room view: true for plan points the camera cannot see; those parts of the rays (and their tips) are not drawn. */
  hidden?: (p: P2) => boolean;
  opacity?: number;
  asGroup?: boolean;
};

/** Short rays fanning from a scattering point (uneven lengths for cosine weighting), drawn on with t. */
export const ScatterFan: React.FC<ScatterFanProps> = ({origin, dirs, length, toPx, t, release = 0, color = C.saffronDeep, width = 4.5, seed = 1, tips = true, layout, stopMargin = 0.05, hidden, opacity = 1, asGroup}) => {
  if (t <= 0 || release >= 1) return null;
  const stagger = 0.3;
  const rel = clamp01(release);
  return (
    <Out asGroup={asGroup} opacity={opacity}>
      {dirs.map((d, i) => {
        const L = length * (0.3 + 0.7 * d.w) * (0.85 + 0.3 * rand(seed * 53 + i * 7));
        let end: P2 = {x: origin.x + d.x * L, z: origin.z + d.z * L};
        if (layout) end = lerpP(origin, end, firstOccluderHit(origin, end, layout, stopMargin));
        const delay = rand(seed * 17 + i * 3) * stagger;
        const ti = E.out(clamp01((t - delay) / (1 - stagger)));
        if (ti <= 0) return null;
        const u0 = 0.8 * E.inOut(rel) * ti; // tail
        const u1 = ti; // head
        const P = (u: number) => toPx(lerpP(origin, end, u));
        const runs = (hidden ? visibleIntervals(origin, end, hidden, 16) : [[0, 1] as [number, number]]).map(([a, b]) => [Math.max(a, u0), Math.min(b, u1)]).filter(([a, b]) => b > a);
        const tipShown = tips && !(hidden && hidden(lerpP(origin, end, u1)));
        if (!runs.length && !tipShown) return null;
        const head = P(u1);
        return (
          <g key={i} opacity={1 - E.in(rel)}>
            {runs.map(([a, b], k) => (
              <path key={k} d={polyD([P(a), P(b)])} stroke={color} strokeWidth={width * (0.75 + 0.25 * d.w)} strokeLinecap="round" fill="none" />
            ))}
            {tipShown && <circle cx={head.x} cy={head.y} r={width * 1.15} fill={C.saffron} stroke={C.ink} strokeWidth={2.5} />}
          </g>
        );
      })}
    </Out>
  );
};

/* ------------------------------------------------------------------ CandidateArc */

export type CandidateArcProps = {
  center: P2;
  /** Radius in metres. */
  r: number;
  toPx: ToPx;
  /** Draw-on 0..1 along the visible part of the arc. */
  t: number;
  /** Plan angles (radians, 0 = +x, π/2 = into the room). Default: the half circle in front of the wall. */
  a0?: number;
  a1?: number;
  tone?: Tone;
  /** Plan rectangle the arc is clipped to (the room's floor area). */
  clip?: Rect;
  width?: number;
  /** A pen-tip dot at the drawing head while 0 < t < 1. */
  pen?: boolean;
  /** Optional dash pattern (px) for a "candidate" look. */
  dashArray?: string;
  /** Room view: true for plan points the camera cannot see; those stretches of the arc are not drawn. */
  hidden?: (p: P2) => boolean;
  opacity?: number;
  asGroup?: boolean;
};

/** An arc drawn on progressively, clipped to the floor: every point on it fits one arrival time. */
export const CandidateArc: React.FC<CandidateArcProps> = ({center, r, toPx, t, a0 = 0, a1 = Math.PI, tone = 'blue', clip, width = 6, pen = true, dashArray, hidden, opacity = 1, asGroup}) => {
  const clipId = useSafeId('arcclip');
  if (t <= 0 || r <= 0) return null;
  const col = TONES[tone];
  const intervals = clip ? arcRectIntervals(center, r, clip, a0, a1) : [[a0, a1] as [number, number]];
  const runsPlan = intervals.map(([s, e]) => sampleArc(center, r, s, e, Math.max(4, Math.ceil(Math.abs(e - s) / (Math.PI / 120)))));
  const runsPx = runsPlan.map((pts) => pts.map(toPx));
  const lens = runsPx.map((pts) => pts.slice(1).reduce((acc, p, i) => acc + hyp(pts[i], p), 0));
  const total = lens.reduce((a, b) => a + b, 0);
  let budget = clamp01(t) * total;
  const ds: string[] = [];
  let tip: P2 | null = null;
  // shorten the visible arc point by point (by drawn length), then drop the stretches the camera cannot see
  for (let k = 0; k < runsPlan.length && budget > 0; k++) {
    const pl = runsPlan[k];
    const px = runsPx[k];
    const out: P2[] = [pl[0]];
    for (let i = 1; i < pl.length && budget > 0; i++) {
      const l = hyp(px[i - 1], px[i]);
      if (l <= budget) {
        out.push(pl[i]);
        budget -= l;
      } else {
        out.push(lerpP(pl[i - 1], pl[i], budget / l));
        budget = 0;
      }
    }
    for (const run of visibleRunsPx(out, toPx, hidden)) ds.push(polyD(run));
    tip = out[out.length - 1];
  }
  const tipPx = tip && pen && t < 1 && !(hidden && hidden(tip)) ? toPx(tip) : null;
  return (
    <Out asGroup={asGroup} opacity={opacity}>
      {clip && (
        <defs>
          <clipPath id={clipId}>
            <path d={rectPolyD(clip, toPx)} />
          </clipPath>
        </defs>
      )}
      {ds.length > 0 && (
        <g clipPath={clip ? `url(#${clipId})` : undefined}>
          <path d={ds.join(' ')} fill="none" stroke={col.main} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashArray} />
        </g>
      )}
      {tipPx && <circle cx={tipPx.x} cy={tipPx.y} r={width * 1.25} fill={col.deep} stroke={C.ink} strokeWidth={2.5} />}
    </Out>
  );
};

/* ------------------------------------------------------------------ Band */

export type BandProps = {
  center: P2;
  /** Radius (metres) of the band's centre line. */
  r: number;
  /** Half-width (metres): the timing uncertainty turned into distance. */
  halfWidth: number;
  toPx: ToPx;
  /** Fade-in 0..1. */
  t: number;
  a0?: number;
  a1?: number;
  tone?: Tone;
  clip?: Rect;
  /** Fill opacity at t = 1 (overlaps of several bands get visibly denser). */
  fillOpacity?: number;
  /**
   * Thin lines along both edges of the band. Off by default: where several bands converge (near the relay wall) their
   * edge lines stack into a run of 2-3 px stripes a few px apart, which shimmers as soon as the camera moves. Turn
   * it on only for a single isolated band.
   */
  edges?: boolean;
  asGroup?: boolean;
};

/** A translucent ring band of half-width `halfWidth` around a candidate circle. */
export const Band: React.FC<BandProps> = ({center, r, halfWidth, toPx, t, a0 = 0, a1 = Math.PI, tone = 'blue', clip, fillOpacity = 0.2, edges = false, asGroup}) => {
  const clipId = useSafeId('bandclip');
  if (t <= 0 || halfWidth <= 0) return null;
  const col = TONES[tone];
  const n = Math.max(24, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 160)));
  const ro = r + halfWidth;
  const ri = Math.max(0, r - halfWidth);
  const outer = sampleArc(center, ro, a0, a1, n).map(toPx);
  const inner = sampleArc(center, ri, a0, a1, n).map(toPx);
  const fillD = polyD([...outer, ...inner.slice().reverse()], true);
  return (
    <Out asGroup={asGroup} opacity={clamp01(t)}>
      {clip && (
        <defs>
          <clipPath id={clipId}>
            <path d={rectPolyD(clip, toPx)} />
          </clipPath>
        </defs>
      )}
      <g clipPath={clip ? `url(#${clipId})` : undefined}>
        <path d={fillD} fill={col.main} fillOpacity={fillOpacity} stroke="none" />
        {edges && (
          <>
            <path d={polyD(outer)} fill="none" stroke={col.main} strokeWidth={2.5} strokeOpacity={0.55} />
            {ri > 0 && <path d={polyD(inner)} fill="none" stroke={col.main} strokeWidth={2.5} strokeOpacity={0.55} />}
          </>
        )}
      </g>
    </Out>
  );
};

/* ------------------------------------------------------------------ PossibleCloud */

export type PossibleCloudProps = {
  toPx: ToPx;
  /** Smooth closed polygons (plan) from extractContours, drawn as one level. */
  contours?: P2[][];
  /** Or: the field from possibleCloud(); contours are extracted at each of `levels`. */
  field?: ScalarField;
  /** Thresholds for `field`, outer to inner (default [0.25, 0.6]): nested fills, denser toward the middle. */
  levels?: number[];
  /** Appear 0..1 (grows from its centre and fades in). */
  t: number;
  tone?: Tone;
  /**
   * Blur radius (px) of a soft edge (feGaussianBlur on the blob only). Default 0: the house style is flat fills with no
   * glow, so the softness comes from the nested levels (a pale outer level round a denser inner one). A blur reads as
   * a glow halo along the bands; use it only if a scene explicitly asks for it.
   */
  blur?: number;
  /** A crisp thin line on the innermost level. */
  outline?: boolean;
  asGroup?: boolean;
};

/** The "possible locations" region: nested flat fills (pale outer level, denser inner level, crisp inner line), computed
 *  from the same bands. */
export const PossibleCloud: React.FC<PossibleCloudProps> = ({toPx, contours, field, levels = [0.25, 0.6], t, tone = 'teal', blur = 0, outline = true, asGroup}) => {
  const filterId = useSafeId('cloudblur');
  if (t <= 0) return null;
  const col = TONES[tone];
  const sets: P2[][][] = contours ? [contours] : field ? levels.map((lv) => extractContours(field, lv)) : [];
  const pxSets = sets.map((loops) => loops.map((l) => l.map(toPx)));
  const all = pxSets.flat(2);
  if (!all.length) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  let cx = 0;
  let cy = 0;
  for (const p of all) {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x);
    y1 = Math.max(y1, p.y);
    cx += p.x;
    cy += p.y;
  }
  cx /= all.length;
  cy /= all.length;
  const k = E.out(clamp01(t));
  const s = 0.55 + 0.45 * k;
  const pad = blur * 4;
  const nLv = pxSets.length;
  return (
    <Out asGroup={asGroup} opacity={Math.min(1, clamp01(t) * 1.4)}>
      {blur > 0 && (
        <defs>
          <filter id={filterId} filterUnits="userSpaceOnUse" x={x0 - pad} y={y0 - pad} width={x1 - x0 + pad * 2} height={y1 - y0 + pad * 2}>
            <feGaussianBlur stdDeviation={blur} />
          </filter>
        </defs>
      )}
      <g transform={`translate(${f2(cx)} ${f2(cy)}) scale(${s.toFixed(4)}) translate(${f2(-cx)} ${f2(-cy)})`}>
        <g filter={blur > 0 ? `url(#${filterId})` : undefined}>
          {pxSets.map((loops, i) => (
            <path key={i} d={loops.map((l) => polyD(l, true)).join(' ')} fill={i === nLv - 1 && nLv > 1 ? col.main : mixHex(col.light, col.main, 0.35)} fillOpacity={nLv > 1 ? 0.55 + 0.35 * (i / (nLv - 1)) : 0.75} fillRule="evenodd" />
          ))}
        </g>
        {outline && <path d={pxSets[nLv - 1].map((l) => polyD(l, true)).join(' ')} fill="none" stroke={col.deep} strokeWidth={3} strokeOpacity={0.85} strokeLinejoin="round" />}
      </g>
    </Out>
  );
};

/* ------------------------------------------------------------------ WallMarker */

export type WallMarkerProps = {
  /** Point on the relay wall (plan). */
  p: P2;
  toPx: ToPx;
  label?: string;
  /** Pop-in 0..1. */
  t?: number;
  /** 0..1 highlight (filled with the tone, slightly larger): "this one is being measured". */
  active?: number;
  tone?: Tone;
  /** Half-diagonal of the diamond, px. */
  size?: number;
  /** Label position relative to the marker, px. */
  labelOffset?: {x: number; y: number};
  fontSize?: number;
  asGroup?: boolean;
};

/** A sampled wall point: a small diamond on the wall line with a mono label. */
export const WallMarker: React.FC<WallMarkerProps> = ({p, toPx, label, t = 1, active = 0, tone = 'saffron', size = 15, labelOffset = {x: 0, y: -40}, fontSize = 30, asGroup}) => {
  if (t <= 0) return null;
  const c = toPx(p);
  const sc = backOut(clamp01(t)) * (1 + 0.22 * clamp01(active));
  const col = TONES[tone];
  const s = size;
  return (
    <Out asGroup={asGroup}>
      <g transform={`translate(${f2(c.x)} ${f2(c.y)}) scale(${f2(sc)})`}>
        <path d={`M 0 ${-s} L ${s} 0 L 0 ${s} L ${-s} 0 Z`} fill={mixHex(C.cream, col.main, clamp01(active))} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
      </g>
      {label && (
        <text x={c.x + labelOffset.x} y={c.y + labelOffset.y} textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={fontSize} fill={C.ink} opacity={clamp01(t * 1.5)}>
          {label}
        </text>
      )}
    </Out>
  );
};

/* ------------------------------------------------------------------ SensorGlyph */

export type SensorGlyphProps = {
  /** Sensor position (plan). */
  p: P2;
  /** Direction the working face points (plan vector, need not be unit length), e.g. sub(W, S). */
  dir: P2;
  toPx: ToPx;
  /** Body width across the facing direction, px (the real module is about 0.22 m: 0.22 × pixels-per-metre). */
  size?: number;
  /** Pop-in 0..1 (small overshoot). */
  t?: number;
  /** 0..1: the emitter window lights up (firing). */
  firing?: number;
  opacity?: number;
  asGroup?: boolean;
};

/**
 * The sensor in the plan view, placed and aimed in plan space: the on-model <SensorTop/> prop (teal box, coral emitter
 * notch on the working face) from components/v02/HandheldSensor.tsx, so it matches the HandheldSensor the operator
 * holds in the room view. The facing is measured through `toPx`, so it stays correct under the oblique mapping.
 */
export const SensorGlyph: React.FC<SensorGlyphProps> = ({p, dir, toPx, size = 52, t = 1, firing = 0, opacity = 1, asGroup}) => {
  if (t <= 0) return null;
  const c = toPx(p);
  const d = len(dir) > 0 ? dir : {x: 0, z: -1};
  const k = 0.1 / Math.max(1e-9, len(d));
  const ahead = toPx({x: p.x + d.x * k, z: p.z + d.z * k});
  return <SensorTop x={c.x} y={c.y} size={size} facing={facingOf(ahead.x - c.x, ahead.y - c.y)} firing={clamp01(firing)} scale={backOut(clamp01(t))} opacity={opacity} asGroup={asGroup} />;
};

/* ------------------------------------------------------------------ SightLine */

export type SightLineProps = {
  a: P2;
  b: P2;
  toPx: ToPx;
  /** If given, the line stops at the occluder and a cross marks the block. */
  layout?: OpticsLayout;
  /** Draw-on 0..1. */
  t: number;
  tone?: Tone;
  width?: number;
  asGroup?: boolean;
};

/** A dashed line of sight from a toward b that stops where the occluder blocks it, with a cross at the block. */
export const SightLine: React.FC<SightLineProps> = ({a, b, toPx, layout, t, tone = 'coral', width = 5, asGroup}) => {
  if (t <= 0) return null;
  const hit = layout ? firstOccluderHit(a, b, layout) : 1;
  const blocked = hit < 1;
  const end = lerpP(a, b, blocked ? hit : 1);
  const pa = toPx(a);
  const pe = toPx(end);
  const k = clamp01(t);
  const head = lerpPx(pa, pe, E.out(clamp01(k / 0.8)));
  const crossT = blocked ? clamp01((k - 0.75) / 0.25) : 0;
  const L = Math.max(1e-6, hyp(pa, pe));
  const ux = (pe.x - pa.x) / L;
  const uy = (pe.y - pa.y) / L;
  const cxp = {x: pe.x - ux * 22, y: pe.y - uy * 22};
  const s = 15 * backOut(crossT);
  const col = TONES[tone];
  return (
    <Out asGroup={asGroup}>
      <path d={polyD([pa, head])} stroke={col.main} strokeWidth={width} strokeLinecap="round" strokeDasharray="14 12" fill="none" />
      {crossT > 0 && (
        <g transform={`translate(${f2(cxp.x)} ${f2(cxp.y)})`}>
          <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={C.ink} strokeWidth={width + 5} strokeLinecap="round" />
          <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={col.main} strokeWidth={width} strokeLinecap="round" />
        </g>
      )}
    </Out>
  );
};

/* ------------------------------------------------------------------ ArrivalHistogram (screen space) */

export type HistPeak = {bin: number; label: string; tone?: Tone; /** extra lift of the callout, px */ dy?: number};

export type ArrivalHistogramProps = {
  /** Bin edges in ns (length = values.length + 1). */
  bins: number[];
  /** Bar heights (relative; scaled so the max, or yMax, fills the plot). */
  values: number[];
  /** Callouts above particular bars (the bar takes the peak's tone). */
  peaks?: HistPeak[];
  /** 0..1: a time cursor sweeps left to right and bars rise as it passes (arrivals accumulate). */
  t: number;
  width: number;
  height: number;
  /** Axis labels. */
  labels?: {x?: string; y?: string};
  /** Tick positions on the time axis (ns). Default: every 10 ns. */
  ticksNs?: number[];
  /** Highlight a bin range (inclusive) with a soft panel behind it and recoloured bars. */
  highlight?: {from: number; to: number; tone?: Tone; label?: string; t?: number};
  /** Default bar tone. */
  tone?: Tone;
  yMax?: number;
  /** Show the sweeping cursor line while 0 < t < 1. */
  cursor?: boolean;
  /** Reveal 0..1 of the peak callouts (default: follows the sweep). */
  peaksT?: number;
  fontSize?: number;
  style?: React.CSSProperties;
};

/** A clean bar histogram of arrival times in the house style: rounded bars, ink axis, mono tick labels. */
export const ArrivalHistogram: React.FC<ArrivalHistogramProps> = ({
  bins,
  values,
  peaks = [],
  t,
  width,
  height,
  labels = {x: 'arrival time (ns)', y: 'photons'},
  ticksNs,
  highlight,
  tone = 'blue',
  yMax,
  cursor = true,
  peaksT,
  fontSize = 30,
  style,
}) => {
  const n = values.length;
  const t0 = bins[0];
  const t1 = bins[n];
  // paddings scale with the font so a larger fontSize never pushes the y label into the axis or a callout off the top
  const padL = labels.y ? Math.round(fontSize * 1.95) : 18;
  const padR = 22;
  const padT = peaks.length || highlight?.label ? Math.round(fontSize * 1.45 + 52) : 24;
  const padB = fontSize * 1.3 + (labels.x ? fontSize * 1.5 : 0) + 24;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const base = padT + plotH;
  const X = (ns: number) => padL + ((ns - t0) / (t1 - t0)) * plotW;
  const ym = yMax ?? Math.max(1e-9, ...values);
  const sweep = clamp01(t);
  const cursorNs = t0 + sweep * (t1 - t0) * 1.06;
  const binNs = (t1 - t0) / n;
  const hl = highlight;
  const hlT = hl ? clamp01(hl.t ?? 1) : 0;
  const ticks = ticksNs ?? Array.from({length: Math.floor((t1 - t0) / 10) + 1}, (_, i) => t0 + i * 10);
  const peakTone = new Map(peaks.map((p) => [p.bin, p.tone ?? 'saffron'] as [number, Tone]));
  const labelFont = `800 ${fontSize}px ${F.body}`;

  const bar = (i: number) => {
    const grow = E.out(clamp01((cursorNs - bins[i]) / (binNs * 2.2)));
    const h = (values[i] / ym) * plotH * grow;
    if (h < 1.5) return null;
    const x0 = X(bins[i]) + (X(bins[i + 1]) - X(bins[i])) * 0.14;
    const w = (X(bins[i + 1]) - X(bins[i])) * 0.72;
    const r = Math.min(w / 2, h, 9);
    const y = base - h;
    const inHl = hl && i >= hl.from && i <= hl.to && hlT > 0;
    const tn: Tone = peakTone.get(i) ?? (inHl ? hl!.tone ?? 'teal' : tone);
    const fill = inHl && !peakTone.has(i) ? mixHex(TONES[tone].main, TONES[tn].main, hlT) : TONES[tn].main;
    return (
      <path
        key={i}
        d={`M ${f2(x0)} ${f2(base)} L ${f2(x0)} ${f2(y + r)} Q ${f2(x0)} ${f2(y)} ${f2(x0 + r)} ${f2(y)} L ${f2(x0 + w - r)} ${f2(y)} Q ${f2(x0 + w)} ${f2(y)} ${f2(x0 + w)} ${f2(y + r)} L ${f2(x0 + w)} ${f2(base)} Z`}
        fill={fill}
        stroke={C.ink}
        strokeWidth={h > 6 ? 3 : 2}
        strokeLinejoin="round"
      />
    );
  };

  const callout = (pk: HistPeak, k: number) => {
    const reveal = peaksT ?? clamp01((cursorNs - bins[pk.bin + 1]) / (binNs * 3));
    if (reveal <= 0) return null;
    const cx = (X(bins[pk.bin]) + X(bins[pk.bin + 1])) / 2;
    const top = base - (values[pk.bin] / ym) * plotH;
    const tw = textWidth(pk.label, labelFont);
    const bw = tw + fontSize * 0.9;
    const bh = fontSize * 1.45;
    const by = Math.max(4, top - 24 - bh - (pk.dy ?? 0));
    const bx = Math.max(padL - 10, Math.min(width - bw - 4, cx - bw / 2));
    const col = TONES[pk.tone ?? 'saffron'];
    return (
      <g key={`pk${k}`} opacity={clamp01(reveal * 1.6)}>
        <path d={`M ${f2(cx)} ${f2(by + bh)} L ${f2(cx)} ${f2(top - 6)}`} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
        <rect x={bx} y={by} width={bw} height={bh} rx={bh / 2} fill={col.light} stroke={C.ink} strokeWidth={3} />
        <text x={bx + bw / 2} y={by + bh / 2 + 1} textAnchor="middle" dominantBaseline="central" fontFamily={F.body} fontWeight={800} fontSize={fontSize} fill={C.ink}>
          {pk.label}
        </text>
      </g>
    );
  };

  return (
    <svg width={width} height={height} style={{overflow: 'visible', display: 'block', ...style}}>
      {hl && hlT > 0 && (
        <g opacity={hlT}>
          <rect x={X(bins[hl.from]) - 6} y={padT - 8} width={X(bins[hl.to + 1]) - X(bins[hl.from]) + 12} height={plotH + 8} rx={14} fill={TONES[hl.tone ?? 'teal'].light} opacity={0.7} />
          {hl.label && (
            <text x={(X(bins[hl.from]) + X(bins[hl.to + 1])) / 2} y={padT - 26} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={fontSize} fill={TONES[hl.tone ?? 'teal'].deep}>
              {hl.label}
            </text>
          )}
        </g>
      )}
      {values.map((_, i) => bar(i))}
      {/* axes */}
      <path d={`M ${padL} ${padT - 10} L ${padL} ${f2(base)} L ${f2(padL + plotW + 10)} ${f2(base)}`} fill="none" stroke={C.ink} strokeWidth={OUTLINE} strokeLinecap="round" strokeLinejoin="round" />
      {ticks.map((ns) => (
        <g key={ns}>
          <path d={`M ${f2(X(ns))} ${f2(base)} L ${f2(X(ns))} ${f2(base + 12)}`} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
          <text x={X(ns)} y={base + 14 + fontSize * 0.95} textAnchor="middle" fontFamily={F.mono} fontWeight={500} fontSize={fontSize} fill={C.inkSoft}>
            {Number.isInteger(ns) ? ns : ns.toFixed(1)}
          </text>
        </g>
      ))}
      {labels.x && (
        <text x={padL + plotW / 2} y={height - 6} textAnchor="middle" fontFamily={F.body} fontWeight={700} fontSize={fontSize} fill={C.inkSoft}>
          {labels.x}
        </text>
      )}
      {labels.y && (
        <text x={0} y={0} transform={`translate(${f2(padL - fontSize * 0.73)} ${f2(padT + plotH / 2)}) rotate(-90)`} textAnchor="middle" fontFamily={F.body} fontWeight={700} fontSize={fontSize} fill={C.inkSoft}>
          {labels.y}
        </text>
      )}
      {cursor && sweep > 0 && sweep < 1 && (
        <g>
          <path d={`M ${f2(Math.min(X(t1), X(cursorNs)))} ${padT - 6} L ${f2(Math.min(X(t1), X(cursorNs)))} ${f2(base)}`} stroke={C.saffronDeep} strokeWidth={4} strokeLinecap="round" />
          <circle cx={Math.min(X(t1), X(cursorNs))} cy={padT - 6} r={7} fill={C.saffron} stroke={C.ink} strokeWidth={2.5} />
        </g>
      )}
      {peaks.map(callout)}
    </svg>
  );
};

/* ------------------------------------------------------------------ TimingRuler (screen space) */

export type TimingRulerProps = {
  /** The ruler runs from 0 to `ns` nanoseconds. */
  ns: number;
  width: number;
  /** Draw-on 0..1 (ticks appear left to right). */
  t?: number;
  minor?: number;
  major?: number;
  height?: number;
  /** true → "about 30 cm per nanosecond"; or a custom string. */
  rateLabel?: boolean | string;
  /** Where the rate label sits: under the ruler (default) or to the right of the "ns" unit. */
  ratePosition?: 'below' | 'right';
  /** A moving marker at this time (ns), e.g. the elapsed time of a pulse. */
  marker?: number;
  /** Text above the marker (default: the time, e.g. "30.6 ns"). */
  markerLabel?: string;
  fontSize?: number;
  style?: React.CSSProperties;
};

/** A ruler from 0 to N ns with mono numbers, an optional elapsed-time marker and the "about 30 cm per ns" note. */
export const TimingRuler: React.FC<TimingRulerProps> = ({ns, width, t = 1, minor = 1, major = 5, height = 74, rateLabel, ratePosition = 'below', marker, markerLabel, fontSize = 30, style}) => {
  const clipId = useSafeId('rulerclip');
  const pad = Math.max(16, fontSize * 0.9);
  const X = (v: number) => pad + (v / ns) * (width - pad * 2);
  const k = E.out(clamp01(t));
  const ticks: number[] = [];
  for (let v = 0; v <= ns + 1e-9; v += minor) ticks.push(Math.round(v * 1000) / 1000);
  const rate = rateLabel === true ? 'about 30 cm per nanosecond' : rateLabel || '';
  const mk = marker !== undefined ? Math.max(0, Math.min(ns, marker)) : undefined;
  return (
    <svg width={width} height={height} style={{overflow: 'visible', display: 'block', ...style}}>
      <defs>
        <clipPath id={clipId}>
          <rect x={-10} y={-80} width={(width + 20) * k} height={height + 200} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x={0} y={0} width={width} height={height} rx={12} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
        {ticks.map((v) => {
          const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-6;
          return <path key={v} d={`M ${f2(X(v))} 2 L ${f2(X(v))} ${f2(isMajor ? height * 0.3 : height * 0.17)}`} stroke={C.ink} strokeWidth={isMajor ? 3.5 : 2.5} strokeLinecap="round" />;
        })}
        {ticks
          .filter((v) => Math.abs(v / major - Math.round(v / major)) < 1e-6)
          .map((v) => (
            <text key={`n${v}`} x={X(v)} y={height - 10} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={fontSize} fill={C.ink}>
              {v}
            </text>
          ))}
      </g>
      <text x={width + 14} y={height - 10} fontFamily={F.mono} fontWeight={700} fontSize={fontSize} fill={C.inkSoft} opacity={k}>
        ns
      </text>
      {mk !== undefined && (
        <g>
          <path d={`M ${f2(X(mk))} -4 L ${f2(X(mk))} ${height - 46}`} stroke={C.saffronDeep} strokeWidth={5} strokeLinecap="round" />
          <path d={`M ${f2(X(mk) - 12)} -22 L ${f2(X(mk) + 12)} -22 L ${f2(X(mk))} -4 Z`} fill={C.saffron} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
          <text x={Math.min(width - 10, Math.max(10, X(mk)))} y={-32} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={fontSize} fill={C.ink}>
            {markerLabel ?? `${mk.toFixed(1)} ns`}
          </text>
        </g>
      )}
      {rate && (
        <text
          x={ratePosition === 'right' ? width + 14 + fontSize * 1.6 + 26 : 0}
          y={ratePosition === 'right' ? height / 2 : height + fontSize + 10}
          dominantBaseline={ratePosition === 'right' ? 'central' : undefined}
          fontFamily={F.body}
          fontWeight={800}
          fontSize={fontSize}
          fill={C.inkSoft}
          opacity={k}
        >
          {rate}
        </text>
      )}
    </svg>
  );
};

/** Convenience: an arc's px points (e.g. to place a label on it). */
export const arcPointPx = (center: P2, r: number, a: number, toPx: ToPx) => toPx(polar(center, r, a));
