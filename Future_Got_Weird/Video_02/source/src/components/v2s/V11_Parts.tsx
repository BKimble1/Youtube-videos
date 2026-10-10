import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {rand} from '../../lib/anim';
import {E, drop} from '../../lib/motion';

/**
 * V11 parts (scene-local drawing for V11_Warehouse): the warehouse labels (fade-only pills), and the pieces of the
 * V11.4 limit tiles that are not plan geometry: the travelling pulse with a fading trail, the sun, the glare burst, and
 * the tiny chip that sweats over a heap of numbers (adapted from v1 S8_Vignettes TileChip, re-drawn for a callout).
 * Pure functions of their props; screen or world px as stated.
 */

const clamp01 = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v);
const f2 = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ labels */

export type PillTone = 'paper' | 'teal' | 'coral' | 'saffron';
const TONES: Record<PillTone, {bg: string; fg: string; bd: string}> = {
  paper: {bg: C.cream, fg: C.ink, bd: C.ink},
  teal: {bg: C.teal, fg: C.white, bd: C.tealDeep},
  coral: {bg: C.coral, fg: C.white, bd: C.coralDeep},
  saffron: {bg: C.saffron, fg: C.ink, bd: C.ink},
};

/** A pill label (screen px, vertically centred on y). Fades in with `t` (no springing) and then stays put. */
export const WhPill: React.FC<{x: number; y: number; text: string; t: number; size?: number; tone?: PillTone; anchor?: 'left' | 'center' | 'right'; shadow?: boolean}> = ({
  x,
  y,
  text,
  t,
  size = 48,
  tone = 'paper',
  anchor = 'left',
  shadow = true,
}) => {
  if (t <= 0.001) return null;
  const m = TONES[tone];
  const h = Math.round(size * 1.5);
  const tx = anchor === 'left' ? '0%' : anchor === 'center' ? '-50%' : '-100%';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y - h / 2,
        height: h,
        transform: `translateX(${tx})`,
        opacity: clamp01(t),
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        padding: `0 ${Math.round(size * 0.55)}px`,
        borderRadius: 999,
        background: m.bg,
        color: m.fg,
        border: `4px solid ${m.bd}`,
        fontFamily: F.body,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        boxShadow: shadow ? `5px 6px 0 ${C.shadow}` : undefined,
      }}
    >
      {text}
    </div>
  );
};

/* ------------------------------------------------------------------ pulses */

type Px = {x: number; y: number};

/**
 * A pulse along a screen polyline at constant speed: `d` = distance travelled (px). Intensity falls with distance as
 * `I(s)` (1 → 0); the trail is drawn in short pieces whose width and opacity follow I, and the dot shrinks with it. When
 * I reaches 0 the pulse is gone (short range). `trailFade` 0..1 fades the whole trail afterwards.
 */
export const FadingPulse: React.FC<{pts: Px[]; d: number; I: (s: number) => number; width?: number; r?: number; trailFade?: number; color?: string}> = ({pts, d, I, width = 8, r = 15, trailFade = 0, color = C.saffronDeep}) => {
  if (d <= 0) return null;
  const segs: React.ReactNode[] = [];
  let acc = 0;
  let head: Px | null = null;
  let headI = 0;
  const STEP = 14;
  for (let i = 0; i < pts.length - 1 && acc < d; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    for (let s = 0; s < L && acc + s < d; s += STEP) {
      const e = Math.min(L, s + STEP, d - acc);
      const k = I(acc + s);
      if (k <= 0.02) break;
      const p0 = {x: a.x + ((b.x - a.x) * s) / L, y: a.y + ((b.y - a.y) * s) / L};
      const p1 = {x: a.x + ((b.x - a.x) * e) / L, y: a.y + ((b.y - a.y) * e) / L};
      segs.push(<line key={`${i}.${s}`} x1={f2(p0.x)} y1={f2(p0.y)} x2={f2(p1.x)} y2={f2(p1.y)} stroke={color} strokeWidth={f2(width * (0.35 + 0.65 * k))} strokeLinecap="round" opacity={f2((0.25 + 0.75 * k) * (1 - clamp01(trailFade)))} />);
      head = p1;
      headI = I(acc + e);
    }
    acc += L;
  }
  return (
    <g>
      {segs}
      {head && headI > 0.04 && (
        <g opacity={f2(clamp01(headI * 1.6))}>
          <circle cx={f2(head.x)} cy={f2(head.y)} r={f2(r * (0.45 + 0.55 * headI))} fill={headI > 0.5 ? C.saffron : C.saffronLight} stroke={C.ink} strokeWidth={3.5} />
          <circle cx={f2(head.x - r * 0.25)} cy={f2(head.y - r * 0.25)} r={f2(r * 0.25 * (0.45 + 0.55 * headI))} fill={C.cream} opacity={0.8} />
        </g>
      )}
    </g>
  );
};

/** Length of a screen polyline. */
export const polyLen = (pts: Px[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);

/* ------------------------------------------------------------------ the sun and the glare */

/** A flat sun: disc and 12 rays, radius r, rising with `t` (opacity). */
export const Sun: React.FC<{x: number; y: number; r?: number; t: number}> = ({x, y, r = 58, t}) => {
  if (t <= 0) return null;
  return (
    <g transform={`translate(${f2(x)} ${f2(y)})`} opacity={f2(clamp01(t))}>
      {Array.from({length: 12}, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r0 = r + 10;
        const r1 = r + 38;
        const w = 0.13;
        return <path key={i} d={`M ${f2(Math.cos(a - w) * r0)} ${f2(Math.sin(a - w) * r0)} L ${f2(Math.cos(a) * r1)} ${f2(Math.sin(a) * r1)} L ${f2(Math.cos(a + w) * r0)} ${f2(Math.sin(a + w) * r0)} Z`} fill={C.saffron} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />;
      })}
      <circle r={r} fill={C.saffron} stroke={C.ink} strokeWidth={OUTLINE} />
    </g>
  );
};

/** Glare round a flooded sensor: a flat saffron-light disc and short spikes, size by `t`. */
export const Glare: React.FC<{x: number; y: number; t: number; r?: number}> = ({x, y, t, r = 120}) => {
  const k = E.out(clamp01(t));
  if (k <= 0) return null;
  return (
    <g transform={`translate(${f2(x)} ${f2(y)})`}>
      <circle r={f2(r * k)} fill="none" stroke={C.saffronLight} strokeWidth={f2(r * k * 0.5)} opacity={0.85} />
      {Array.from({length: 10}, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + 0.2;
        const r0 = r * k * 0.55;
        const r1 = r * k * (1.15 + 0.12 * (i % 2));
        return <line key={i} x1={f2(Math.cos(a) * r0)} y1={f2(Math.sin(a) * r0)} x2={f2(Math.cos(a) * r1)} y2={f2(Math.sin(a) * r1)} stroke={C.saffronDeep} strokeWidth={5} strokeLinecap="round" opacity={0.8} />;
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ the tiny chip and its heap of numbers */

const HEAP_ROWS = [
  {n: 12, y: 328, hw: 205},
  {n: 11, y: 296, hw: 186},
  {n: 9, y: 264, hw: 160},
  {n: 8, y: 232, hw: 134},
  {n: 6, y: 200, hw: 102},
  {n: 4, y: 168, hw: 68},
  {n: 2, y: 138, hw: 28},
];
const HEAP = (() => {
  const cx = 296;
  const out: {x: number; y: number; d: string; rot: number; tone: string}[] = [];
  let k = 0;
  for (const r of HEAP_ROWS) {
    for (let i = 0; i < r.n; i++) {
      const u = r.n === 1 ? 0.5 : i / (r.n - 1);
      out.push({
        x: cx - r.hw + 2 * r.hw * u + (rand(400 + k) - 0.5) * 12,
        y: r.y + (rand(500 + k) - 0.5) * 8,
        d: String(Math.floor(rand(600 + k) * 10)),
        rot: (rand(700 + k) - 0.5) * 36,
        tone: rand(800 + k) > 0.82 ? C.tealDeep : rand(900 + k) > 0.82 ? C.coralDeep : C.ink,
      });
      k++;
    }
  }
  return out;
})();
/** Late digits that keep landing on the heap's slopes after "small" (one every 6 frames), each placed clear of the heap
 *  and of the earlier ones (v1 S8_Vignettes TRICKLE). */
const heapHalfWidth = (y: number) => {
  for (let i = 0; i < HEAP_ROWS.length - 1; i++) {
    const a = HEAP_ROWS[i];
    const b = HEAP_ROWS[i + 1];
    if (y <= a.y && y >= b.y) return a.hw + ((b.hw - a.hw) * (a.y - y)) / (a.y - b.y);
  }
  return y > HEAP_ROWS[0].y ? HEAP_ROWS[0].hw : HEAP_ROWS[HEAP_ROWS.length - 1].hw;
};
const TRICKLE = (() => {
  const out: {x: number; y: number; d: string; rot: number; tone: string}[] = [];
  const clear = (x: number, y: number) => [...HEAP, ...out].every((h) => Math.abs(h.x - x) >= 30 || Math.abs(h.y - y) >= 32);
  for (let j = 0; j < 10; j++) {
    const side = j % 2 ? 1 : -1;
    const y = 300 - Math.floor(j / 2) * 34 + (rand(1200 + j) - 0.5) * 6;
    let off = heapHalfWidth(y) + 30 + (rand(1100 + j) - 0.5) * 6;
    let x = 296 + side * off;
    while (!clear(x, y) && off < heapHalfWidth(y) + 90) {
      off += 4;
      x = 296 + side * off;
    }
    x = Math.max(36, Math.min(556, x));
    out.push({x, y, d: String(Math.floor(rand(1300 + j) * 10)), rot: (rand(1400 + j) - 0.5) * 40, tone: j % 3 === 0 ? C.tealDeep : C.ink});
  }
  return out;
})();

/** Local frame of the chip drawing: 810 × 370, floor line y 336 (v1 tile coordinates). */
export const CHIP_FRAME = {w: 810, h: 370, floor: 336};

/**
 * The tiny chip at (640, 287) beside a heap of digits that pours in bottom rows first between "fast" and "small"; it
 * looks at the heap, its eyes widen on "math", it strains and sweats on "small". ff, fm, fsm = frames since those words.
 * Draw inside a <g> scaled into place (local frame CHIP_FRAME).
 */
export const TinyChip: React.FC<{ff: number; fm: number; fsm: number}> = ({ff, fm, fsm}) => {
  const ink = (w = OUTLINE) => ({stroke: C.ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});
  const chip = {x: 640, y: CHIP_FRAME.floor - 49, w: 96, h: 74};
  const span = Math.max(12, fsm - ff);
  const n = HEAP.length;
  const strain = clamp01(fsm / 10);
  const lookL = clamp01(ff / 8);
  const alarm = clamp01(fm / 6);
  // review r1 (V2-R1-36): the chip tile now holds longer, so the chip keeps sweating: a drop beads on its corner every
  // 13 frames after "small", runs down its side and falls away (each drop alternates sides), and it trembles with the
  // strain; no frame of the tile is still
  const drops = Array.from({length: 6}, (_, k) => {
    const a = fsm - (2 + 13 * k);
    if (a < 0 || a > 28) return null;
    return {k, y: 34 * E.in(clamp01(a / 22)), op: 1 - clamp01((a - 20) / 8)};
  });
  const tremble = fsm > 10 ? 2.4 * strain * Math.sin(fsm * 2.3) : 0;
  const squash = 1 - 0.05 * strain;
  return (
    <g>
      <line x1={26} y1={CHIP_FRAME.floor} x2={784} y2={CHIP_FRAME.floor} {...ink()} />
      {HEAP.map((h, i) => {
        const land = (i / n) * span;
        if (ff < land - 9) return null;
        const dy = drop(ff, land, 230, 9);
        if (h.y + dy < 60) return null;
        return (
          <text key={i} x={h.x} y={h.y + dy} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={36} fill={h.tone} transform={`rotate(${h.rot} ${h.x} ${h.y + dy - 14})`}>
            {h.d}
          </text>
        );
      })}
      {TRICKLE.map((h, j) => {
        const land = 6 + j * 6;
        if (fsm < land - 9) return null;
        const dy = drop(fsm, land, 200, 9);
        if (h.y + dy < 60) return null;
        return (
          <text key={`tr${j}`} x={h.x} y={h.y + dy} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={36} fill={h.tone} transform={`rotate(${h.rot} ${h.x} ${h.y + dy - 14})`}>
            {h.d}
          </text>
        );
      })}
      <g transform={`translate(${f2(chip.x + tremble)} ${chip.y + chip.h / 2}) scale(${1 + 0.04 * strain} ${squash}) translate(${-chip.x} ${-(chip.y + chip.h / 2)})`}>
        {[0, 1, 2, 3].map((i) => {
          const y = chip.y - chip.h / 2 + 14 + i * 16;
          return (
            <g key={i}>
              <line x1={chip.x - chip.w / 2 - 14} y1={y} x2={chip.x - chip.w / 2} y2={y} {...ink(5)} />
              <line x1={chip.x + chip.w / 2} y1={y} x2={chip.x + chip.w / 2 + 14} y2={y} {...ink(5)} />
            </g>
          );
        })}
        {[0, 1, 2, 3].map((i) => {
          const x = chip.x - chip.w / 2 + 18 + i * 20;
          return <line key={`b${i}`} x1={x} y1={chip.y + chip.h / 2} x2={x} y2={chip.y + chip.h / 2 + 12} {...ink(5)} />;
        })}
        <rect x={chip.x - chip.w / 2} y={chip.y - chip.h / 2} width={chip.w} height={chip.h} rx={10} fill={C.blue} {...ink()} />
        <circle cx={chip.x - chip.w / 2 + 12} cy={chip.y - chip.h / 2 + 12} r={4} fill={C.blueLight} />
        {[-1, 1].map((sd) => (
          <g key={sd}>
            <ellipse cx={chip.x + sd * 18} cy={chip.y - 6} rx={11 + 2 * alarm} ry={12 + 3 * alarm - 5 * strain} fill={C.white} {...ink(3)} />
            <circle cx={chip.x + sd * 18 - 5 * lookL} cy={chip.y - 6} r={4.5} fill={C.ink} />
          </g>
        ))}
        <path d={`M ${chip.x - 16} ${chip.y + 20} Q ${chip.x - 8} ${chip.y + 14 + 6 * strain} ${chip.x} ${chip.y + 20} Q ${chip.x + 8} ${chip.y + 26 - 6 * strain} ${chip.x + 16} ${chip.y + 20}`} fill="none" {...ink(3.5)} />
      </g>
      {drops.map((d) =>
        d ? (
          <path
            key={d.k}
            d="M 0 -13 Q 9 0 0 8 Q -9 0 0 -13 Z"
            transform={`translate(${f2(chip.x + (d.k % 2 ? -1 : 1) * (chip.w / 2 + 6) + tremble)} ${f2(chip.y - chip.h / 2 - 10 + d.y)}) scale(1.6)`}
            fill={C.tealLight}
            opacity={f2(d.op)}
            {...ink(2)}
          />
        ) : null,
      )}
    </g>
  );
};
