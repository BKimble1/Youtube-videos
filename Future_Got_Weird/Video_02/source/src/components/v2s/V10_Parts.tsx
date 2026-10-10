import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {DEFAULT_VIEW, type ViewConfig} from '../../lib/room';
import type {P2} from '../../lib/optics';
import {S8PersonTokenG} from '../v02/S8_PersonToken';
import {CAST} from '../cast';

/**
 * V10 parts (scene-local drawing for V10_KitClip): the plan close-up map and its pulses (V10.3), the generic target
 * with its reflective strip seen from above (V10.3), the kit board's provenance column (V10.2, V10.4), the "clothing:
 * not recorded" stamp (V10.4), and the film strip of
 * our drawing of the authors' separate test with the generic cast "person" in its frames (V10.5; v1 FilmFrames used the
 * guesser's token, which never appears on R1 material). Everything is screen space and a pure function of its props.
 */

const f2 = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v);

/* ------------------------------------------------------------------ plan map (plan metres -> screen px) */

export type PlanMap = {k: number; pivot: P2; anchor: {x: number; y: number}};
export const planToPx = (m: PlanMap) => (p: P2) => ({x: m.anchor.x + m.k * (p.x - m.pivot.x), y: m.anchor.y + m.k * (p.z - m.pivot.z)});
/** RoomSet's view for a plan map (only the tilt-1 half is used). */
export const planViewOf = (m: PlanMap): ViewConfig => ({
  room: DEFAULT_VIEW.room,
  plan: {ppm: m.k, anchor: {x: m.anchor.x, y: m.anchor.y}},
  pivot: {x: m.pivot.x, z: m.pivot.z, h: 0},
});

/* ------------------------------------------------------------------ pulses on a screen polyline with lanes */

type Px = {x: number; y: number};
export type Leg = {a: Px; b: Px; width: number; color: string; dash?: string};

/** Unit normal (to the right of travel) of a screen segment. */
export const normalOf = (a: Px, b: Px) => {
  const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return {x: -(b.y - a.y) / L, y: (b.x - a.x) / L};
};
/** Shift a segment sideways by `off` px along a fixed normal. */
export const shiftLeg = (a: Px, b: Px, n: Px, off: number) => ({a: {x: a.x + n.x * off, y: a.y + n.y * off}, b: {x: b.x + n.x * off, y: b.y + n.y * off}});

/**
 * One travelling pulse along screen legs at constant speed (by length): the travelled part stays as a trail (each leg
 * its own width and colour), the head is a flat dot. `u` 0..1 is the progress by length. Returns the trail and the dot.
 */
export const PulseRun: React.FC<{legs: Leg[]; u: number; dot?: {r: number[]; fill: string}; opacity?: number; hideDotAtEnd?: boolean}> = ({legs, u, dot, opacity = 1, hideDotAtEnd = true}) => {
  if (u <= 0 || opacity <= 0.001) return null;
  const lens = legs.map((l) => Math.hypot(l.b.x - l.a.x, l.b.y - l.a.y));
  const total = lens.reduce((s, v) => s + v, 0);
  let head = clamp01(u) * total;
  const trail: React.ReactNode[] = [];
  let at: Px | null = null;
  let legIdx = 0;
  for (let i = 0; i < legs.length; i++) {
    const L = lens[i];
    const l = legs[i];
    if (head <= 0) break;
    const k = Math.min(1, head / L);
    const e = {x: l.a.x + (l.b.x - l.a.x) * k, y: l.a.y + (l.b.y - l.a.y) * k};
    trail.push(<path key={i} d={`M ${f2(l.a.x)} ${f2(l.a.y)} L ${f2(e.x)} ${f2(e.y)}`} stroke={l.color} strokeWidth={l.width} strokeLinecap="round" strokeDasharray={l.dash} fill="none" />);
    at = e;
    legIdx = i;
    head -= L;
  }
  const done = u >= 1;
  const r = dot ? dot.r[Math.min(dot.r.length - 1, legIdx)] : 0;
  return (
    <g opacity={f2(opacity)}>
      {trail}
      {dot && at && !(done && hideDotAtEnd) && (
        <g>
          <circle cx={f2(at.x)} cy={f2(at.y)} r={f2(r)} fill={dot.fill} stroke={C.ink} strokeWidth={3.5} />
          <circle cx={f2(at.x - r * 0.3)} cy={f2(at.y - r * 0.3)} r={f2(r * 0.3)} fill={C.cream} opacity={0.85} />
        </g>
      )}
    </g>
  );
};

/** An expanding ring at a bounce, phase t 0..1. */
export const Ring: React.FC<{p: Px; t: number; color: string; r0?: number; r1?: number; w?: number}> = ({p, t, color, r0 = 12, r1 = 60, w = 6}) =>
  t > 0 && t < 1 ? <circle cx={f2(p.x)} cy={f2(p.y)} r={f2(r0 + (r1 - r0) * (1 - (1 - t) * (1 - t)))} fill="none" stroke={color} strokeWidth={f2(w * (1 - t) + 1.5)} opacity={f2(0.9 * (1 - t))} /> : null;

/** A four-point sparkle (flat shape) centred at (x, y), radius 16·k px. */
export const Sparkle: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) =>
  k > 0.01 ? (
    <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(k)})`}>
      <path d="M 0 -16 L 4 -4 L 16 0 L 4 4 L 0 16 L -4 4 L -16 0 L -4 -4 Z" fill={C.white} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </g>
  ) : null;

/* ------------------------------------------------------------------ the target from above, and its reflective strip */

/**
 * A generic target seen from above: a round post top with bullseye rings (it reads as "a target", never as a person),
 * an ink outline and a flat shadow. `strip` 0..1 wraps a safety-vest style strip (hi-vis saffron edges, a pale silver
 * band) round the side that faces `faceAngle` (radians, screen: the direction of the incoming light, i.e. toward the
 * wall spot), drawing on from the middle outward; `stripGlint` 0..1 a sparkle on it. (x, y) = centre, r = radius px.
 */
export const TargetTop: React.FC<{x: number; y: number; r: number; faceAngle: number; strip?: number; spanDeg?: number; stripGlint?: number; rim?: number}> = ({x, y, r, faceAngle, strip = 0, spanDeg = 110, stripGlint = 0, rim = 0}) => {
  const s = clamp01(strip);
  const half = ((spanDeg / 2) * Math.PI) / 180 * s;
  const sr = r + 13; // strip centre radius (just outside the post)
  const band = 22;
  const arc = (rad: number) => {
    const a0 = faceAngle - half;
    const a1 = faceAngle + half;
    return `M ${f2(x + Math.cos(a0) * rad)} ${f2(y + Math.sin(a0) * rad)} A ${f2(rad)} ${f2(rad)} 0 0 1 ${f2(x + Math.cos(a1) * rad)} ${f2(y + Math.sin(a1) * rad)}`;
  };
  const gp = {x: x + Math.cos(faceAngle - 0.35) * (sr + 18), y: y + Math.sin(faceAngle - 0.35) * (sr + 18)};
  return (
    <g>
      <circle cx={f2(x + 8)} cy={f2(y + 10)} r={f2(r)} fill={C.shadow} />
      {rim > 0.01 && <circle cx={f2(x)} cy={f2(y)} r={f2(r + 7)} fill="none" stroke={C.saffron} strokeWidth={10} opacity={f2(clamp01(rim))} />}
      <circle cx={f2(x)} cy={f2(y)} r={f2(r)} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
      <circle cx={f2(x)} cy={f2(y)} r={f2(r * 0.7)} fill={C.coral} stroke={C.ink} strokeWidth={3} />
      <circle cx={f2(x)} cy={f2(y)} r={f2(r * 0.45)} fill={C.cream} stroke={C.ink} strokeWidth={3} />
      <circle cx={f2(x)} cy={f2(y)} r={f2(r * 0.2)} fill={C.coral} stroke={C.ink} strokeWidth={3} />
      {s > 0.01 && (
        <g>
          <path d={arc(sr)} stroke={C.ink} strokeWidth={band + 7} strokeLinecap="round" fill="none" />
          <path d={arc(sr)} stroke={C.saffron} strokeWidth={band} strokeLinecap="round" fill="none" />
          <path d={arc(sr)} stroke="#DCE5E8" strokeWidth={band * 0.48} strokeLinecap="butt" fill="none" />
          <path d={arc(sr)} stroke={C.white} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.9} />
        </g>
      )}
      <Sparkle x={gp.x} y={gp.y} k={1.4 * clamp01(stripGlint)} />
    </g>
  );
};

/* ------------------------------------------------------------------ the stamp (V10.4) */

/**
 * A rubber-stamp mark, lowercase (the shot plan's exact wording), coral-deep ink, multiply blend. `t` 0..1: it slams
 * down (scale 1.22 -> 1 over the first 40 %, ink at full from contact) and then stays still. Centre (x, y).
 */
export const StampOn: React.FC<{x: number; y: number; text: string; t: number; size?: number; rotate?: number}> = ({x, y, text, t, size = 40, rotate = -6}) => {
  if (t <= 0) return null;
  const k = clamp01(t / 0.4);
  const sc = 1 + 0.22 * (1 - k) * (1 - k);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${f2(sc)})`,
        padding: `${f2(size * 0.2)}px ${f2(size * 0.45)}px`,
        border: `${f2(Math.max(4, size * 0.13))}px solid ${C.coralDeep}`,
        borderRadius: f2(size * 0.24),
        color: C.coralDeep,
        fontFamily: F.display,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        background: 'rgba(255,251,240,0.55)',
        mixBlendMode: 'multiply',
        opacity: k > 0 ? 0.95 : 0,
      }}
    >
      {text}
    </div>
  );
};

/* ------------------------------------------------------------------ the provenance column (V10.2, V10.4) */

/**
 * The kit board's right-hand provenance column, drawn here instead of by the kit (v2 review r1, V2-R1-09: the kit's
 * 40 px items and 30 px counter and chip were 6–8 px at phone width). Fixed slots, top to bottom, each fading in with its
 * own t (nothing moves when a later item arrives): the three condition items at 48 px (explicit line breaks, one
 * idea per line), the counter "frame N of 475" at 40 px mono, and the software-check chip at 40 px, wrapped to the full
 * column width. Screen px; the column sits right of the kit's plot panel at column = 1 (panel x1 1104).
 */
export const V10_COLUMN = {x0: 1140, x1: 1800, y0: 166, gap: 20, size: 48, lineHeight: 1.12, counterSize: 40, chipSize: 40} as const;

export type ColumnItem = {lines: string[]; t: number};

export const ProvenanceColumn: React.FC<{items: ColumnItem[]; counter: {text: string; t: number}; chip: {text: string; t: number}; gate: number}> = ({items, counter, chip, gate}) => {
  const k = clamp01(gate);
  if (k <= 0) return null;
  const Q = V10_COLUMN;
  return (
    <div style={{position: 'absolute', left: Q.x0, top: Q.y0, width: Q.x1 - Q.x0, display: 'flex', flexDirection: 'column', gap: Q.gap}}>
      {items.map((it, j) => (
        <div key={j} style={{fontFamily: F.body, fontWeight: 800, fontSize: Q.size, lineHeight: Q.lineHeight, color: C.ink, opacity: f2(clamp01(it.t) * k)}}>
          {it.lines.map((l, i) => (
            <div key={i} style={{whiteSpace: 'nowrap'}}>
              {l}
            </div>
          ))}
        </div>
      ))}
      <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: Q.counterSize, lineHeight: 1.2, color: C.inkSoft, whiteSpace: 'nowrap', opacity: f2(clamp01(counter.t) * k)}}>{counter.text}</div>
      <div
        style={{
          boxSizing: 'border-box',
          width: Q.x1 - Q.x0,
          padding: `${f2(Q.chipSize * 0.42)}px ${f2(Q.chipSize * 0.66)}px`,
          borderRadius: Math.round(Q.chipSize * 0.66),
          background: C.cream,
          color: C.ink,
          border: `3px solid ${C.ink}`,
          fontFamily: F.body,
          fontWeight: 800,
          fontSize: Q.chipSize,
          lineHeight: 1.22,
          letterSpacing: '0.01em',
          opacity: f2(clamp01(chip.t) * k),
        }}
      >
        {chip.text}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ film strip with the generic person (V10.5) */

export const filmStripHeight = (cell: number) => Math.round(cell * 0.62) + 60;

/**
 * A film strip of mini plan frames: the wall line, the partition bar and the generic person's overhead token at its
 * position for that frame (a walk behind the partition). The newest frame enters at the right; the strip slides left by
 * one cell per tick. Adapted from v1 S7_Props FilmFrames (the guesser's token replaced by CAST.person).
 */
export const PersonFilmFrames: React.FC<{width: number; cell?: number; pos: number}> = ({width, cell = 140, pos}) => {
  const ch = Math.round(cell * 0.62);
  const band = 30;
  const H = filmStripHeight(cell);
  const pitch = cell + 14;
  const first = Math.floor(pos) - Math.ceil(width / pitch) - 1;
  const cells: React.ReactNode[] = [];
  const holes: React.ReactNode[] = [];
  for (let i = first; i <= Math.floor(pos) + 1; i++) {
    if (i < 0) continue;
    const x = width - pitch * (pos - i + 1) + 7;
    const hx = x + cell / 2 - 14;
    holes.push(<rect key={`a${i}`} x={f2(hx)} y={8} width={28} height={14} rx={5} fill={C.paperDeep} stroke={C.ink} strokeWidth={2.5} />);
    holes.push(<rect key={`b${i}`} x={f2(hx)} y={H - 22} width={28} height={14} rx={5} fill={C.paperDeep} stroke={C.ink} strokeWidth={2.5} />);
    if (x > width || x + pitch < 0) continue;
    const u = (i % 12) / 11;
    const walk = u < 0.5 ? 1 - u * 2 : (u - 0.5) * 2;
    const tx = cell * (0.5 + 0.38 * walk);
    const ty = ch * 0.6;
    cells.push(
      <g key={i} transform={`translate(${f2(x)} ${band})`}>
        <rect x={0} y={0} width={cell} height={ch} rx={8} fill={C.cream} stroke={C.ink} strokeWidth={3} />
        <line x1={10} y1={14} x2={cell - 10} y2={14} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
        <rect x={cell * 0.36 - 5} y={ch * 0.3} width={10} height={ch * 0.62} rx={4} fill={C.coral} stroke={C.ink} strokeWidth={2.5} />
        <S8PersonTokenG x={tx} y={ty} size={ch * 0.46} look={CAST.person} facing={walk > 0.5 ? 90 : -90} />
      </g>,
    );
  }
  return (
    <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} style={{display: 'block', overflow: 'hidden'}}>
      <rect x={-10} y={0} width={width + 20} height={H} fill={C.inkSoft} />
      {holes}
      {cells}
      <line x1={-10} y1={1.5} x2={width + 10} y2={1.5} stroke={C.ink} strokeWidth={3} />
      <line x1={-10} y1={H - 1.5} x2={width + 10} y2={H - 1.5} stroke={C.ink} strokeWidth={3} />
    </svg>
  );
};
