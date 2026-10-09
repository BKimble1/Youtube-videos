import React from 'react';
import {C, OUTLINE} from '../../theme';
import {rand} from '../../lib/anim';
import {E} from '../../lib/motion';

/**
 * V7 / V8 props (SVG groups in the parent's px).
 *
 *  - DotModule: the team's smartphone-grade research device as a drawn type: a saffron phone-sized slab that is NOT a
 *    phone (no screen, no buttons, no brand), with a sensor window holding an UNCOUNTABLE dot field (a jittered,
 *    irregular field of about a hundred dots of mixed size: the sources give only "about 100 pixels", never a layout,
 *    so nothing on it forms a countable grid; v1 review D33), an emitter lens and a cable port. Adapted from
 *    components/v02/S6_ResearchModule (same slab, colours and proportions).
 *  - FrameFan: "their new idea": a stack of faint frames fanning out from the sensor like cards, each a tiny faint
 *    plan (wall, partition, a figure dot) with a small "what moved" arrow from where the figure was in the previous
 *    frame to where it is now.
 */

const ink = {stroke: C.ink, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const f2 = (n: number) => Math.round(n * 100) / 100;

export const MODULE = {w: 236, h: 430, r: 40, win: 196};

/** The dot field (module-local px, window top-left at (0, 0)): a jittered hex field, seeded, irregular. */
const DOTS: {x: number; y: number; r: number; diag: number}[] = (() => {
  const out: {x: number; y: number; r: number; diag: number}[] = [];
  const win = MODULE.win;
  const m = 11;
  const s = 17.6;
  const rowH = s * 0.866;
  let k = 0;
  for (let row = 0; m + row * rowH <= win - m + 0.01; row++) {
    const off = row % 2 ? s / 2 : 0;
    for (let col = 0; m + off + col * s <= win - m + 0.01; col++) {
      k++;
      // drop a few at random so no row has the same count as its neighbour twice running
      if (rand(k * 13 + 7) < 0.07) continue;
      const x = m + off + col * s + (rand(k * 31 + 1) - 0.5) * 6.5;
      const y = m + row * rowH + (rand(k * 47 + 3) - 0.5) * 6.5;
      out.push({x, y, r: 3.4 + 2.4 * rand(k * 59 + 5), diag: (x + y) / (2 * win)});
    }
  }
  return out;
})();
/** how many dots the field holds (about a hundred; never printed) */
export const DOT_COUNT = DOTS.length;
if (DOT_COUNT < 85 || DOT_COUNT > 125) throw new Error(`V7_Props: the dot field has ${DOT_COUNT} dots (about a hundred)`);

/**
 * The research device centred on (x, y). `dots` 0..1 pops the dots in as a diagonal wave; `listen` 0..1 sends a ring
 * out of each dot along the same diagonal ("listening spots"; 0 or 1 = no rings); `opacity` for the whole device.
 */
export const DotModule: React.FC<{x: number; y: number; scale?: number; dots?: number; listen?: number; opacity?: number}> = ({x, y, scale = 1, dots = 1, listen = 0, opacity = 1}) => {
  const {w, h, r, win} = MODULE;
  const wx = -win / 2;
  const wy = -h / 2 + 46;
  const lensY = Math.round((wy + win + 8 + (h / 2 - 34)) / 2);
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(scale * 1000) / 1000})`} opacity={opacity}>
      <rect x={-w / 2 + 12} y={-h / 2 + 16} width={w} height={h} rx={r} fill={C.shadow} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={C.saffron} {...ink} />
      <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={h - 24} rx={r - 12} fill="none" stroke={C.saffronDeep} strokeWidth={3} />
      <rect x={wx - 8} y={wy - 8} width={win + 16} height={win + 16} rx={14} fill={C.cream} {...ink} />
      <g transform={`translate(${wx} ${wy})`}>
        {DOTS.map((d, i) => {
          const pop = clamp01(clamp01(dots) * 1.5 - d.diag * 0.5);
          const s = pop <= 0 ? 0 : pop >= 1 ? 1 : E.back(pop);
          if (s <= 0.01) return null;
          const lt = listen > 0 && listen < 1 ? clamp01((listen - d.diag * 0.65) / 0.35) : 0;
          return (
            <g key={i}>
              {lt > 0 && lt < 1 && <circle cx={f2(d.x)} cy={f2(d.y)} r={f2(d.r * (1 + 1.2 * lt))} fill="none" stroke={C.teal} strokeWidth={2.2} opacity={f2(1 - lt)} />}
              <circle cx={f2(d.x)} cy={f2(d.y)} r={f2(d.r * s)} fill={lt > 0 && lt < 1 ? C.teal : C.tealDeep} />
            </g>
          );
        })}
      </g>
      <circle cx={0} cy={lensY} r={20} fill={C.inkSoft} {...ink} />
      <circle cx={-6} cy={lensY - 6} r={6} fill={C.cream} opacity={0.8} />
      <rect x={-34} y={h / 2 - 34} width={68} height={14} rx={7} fill={C.saffronDeep} stroke={C.ink} strokeWidth={3} />
    </g>
  );
};

/* ------------------------------------------------------------------ the frame fan (V7.5) */

/** The fan: six cards on a wide arc round the sensor (about ±78°), so neighbours overlap by only about a fifth of a
 *  card and every card's middle (its partition, figure and arrow) stays in view (outer cards are drawn first). */
export const FAN = {n: 6, cardW: 214, cardH: 120, cardScale: 1.3, radius: 400, spreadDeg: 78};

/** Where card k sits (relative to the pivot) when the fan is open `f` (0 = tucked behind the sensor, 1 = open). */
export const fanPose = (k: number, f: number) => {
  const u = FAN.n === 1 ? 0 : k / (FAN.n - 1) - 0.5; // −0.5 .. 0.5
  const ang = 2 * FAN.spreadDeg * u * f;
  const rad = (ang * Math.PI) / 180;
  const R = FAN.radius * f;
  return {x: R * Math.sin(rad), y: -R * Math.cos(rad) - 40 * f, rot: ang * 0.55, s: (0.35 + 0.65 * f) * FAN.cardScale};
};

/** Card-local layout of one frame (our plan, top-down): the wall along the top, the sensor at left, the partition, and
 *  the figure on the HIDDEN side (right of the partition, never on it or in front of it). Everything that matters sits
 *  in the card's middle (|x| <= 62), the part a neighbouring card never covers. */
export const FRAME_CARD = {
  wallY: -40,
  sensor: {x0: -58, x1: -38, y0: 6, y1: 18},
  partitionX: -28,
  partitionY: [-14, 48] as [number, number],
  figR: 10,
  /** where the figure is in card k (it walks a little further in each frame), and how far it moved since the last one */
  figX: (k: number) => 12 + 8 * k,
  figY: (k: number) => 16 + 4 * Math.sin(k * 1.3),
  step: 22,
};
{
  const fc = FRAME_CARD;
  for (let k = 0; k < FAN.n; k++) {
    const prevLeft = fc.figX(k) - fc.step - fc.figR;
    if (!(prevLeft > fc.partitionX + 4)) throw new Error(`V7_Props: frame ${k}'s figure is not clear of the partition (hidden side)`);
    if (!(fc.figX(k) + fc.figR <= 62)) throw new Error(`V7_Props: frame ${k}'s figure leaves the card's uncovered middle`);
  }
}

/** One faint frame: a tiny plan (wall along the top, the partition, the sensor, the figure on the hidden side) and its
 *  "what moved" arrow, from where the figure was (dashed) to where it is now. Card-local px, centred. `arrow` 0..1
 *  draws the arrow. */
const FrameCard: React.FC<{k: number; arrow: number}> = ({k, arrow}) => {
  const {cardW: w, cardH: h} = FAN;
  const fc = FRAME_CARD;
  const fx = fc.figX(k);
  const fy = fc.figY(k);
  const px = fx - fc.step;
  const py = fc.figY(k - 1);
  const a = clamp01(arrow);
  // the arrow runs above the two positions, from the old one's left edge to past the new one
  const ay = Math.min(fy, py) - fc.figR - 12;
  const ax0 = px - 6;
  const ax1 = fx + 10;
  const tipX = ax0 + (ax1 - ax0) * a;
  return (
    <g>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={12} fill={C.shadow} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={12} fill={C.cream} stroke={C.inkMuted} strokeWidth={3} />
      <g opacity={0.6}>
        {/* the wall (top), the partition and the sensor, as in our plan */}
        <line x1={-w / 2 + 14} y1={fc.wallY} x2={w / 2 - 14} y2={fc.wallY} stroke={C.inkMuted} strokeWidth={5} strokeLinecap="round" />
        <line x1={fc.partitionX} y1={fc.partitionY[0]} x2={fc.partitionX} y2={fc.partitionY[1]} stroke={C.coral} strokeWidth={5} strokeLinecap="round" />
        <rect x={fc.sensor.x0} y={fc.sensor.y0} width={fc.sensor.x1 - fc.sensor.x0} height={fc.sensor.y1 - fc.sensor.y0} rx={3} fill={C.tealLight} stroke={C.inkMuted} strokeWidth={2} />
      </g>
      {/* where the figure was (dashed) and where it is now */}
      <circle cx={f2(px)} cy={f2(py)} r={fc.figR} fill="none" stroke={C.inkMuted} strokeWidth={2.4} strokeDasharray="3.5 3" opacity={0.85} />
      <circle cx={f2(fx)} cy={f2(fy)} r={fc.figR} fill={C.saffronLight} stroke={C.inkSoft} strokeWidth={2.6} />
      {a > 0.001 && (
        <g fill="none" stroke={C.coralDeep} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
          <line x1={f2(ax0)} y1={f2(ay)} x2={f2(tipX)} y2={f2(ay)} />
          {a > 0.5 && <path d={`M ${f2(tipX - 9)} ${f2(ay - 8)} L ${f2(tipX + 1)} ${f2(ay)} L ${f2(tipX - 9)} ${f2(ay + 8)}`} />}
        </g>
      )}
    </g>
  );
};

/**
 * The fan, pivoting on (x, y) (the sensor box's centre, parent px) at `scale`. `open` per card 0..1 (staggered by the
 * caller), `arrow` per card 0..1, `opacity` per card. Cards are drawn back to front (the outer ones first).
 */
export const FrameFan: React.FC<{x: number; y: number; scale?: number; open: number[]; arrow: number[]; opacity: number[]}> = ({x, y, scale = 1, open, arrow, opacity}) => {
  const order = Array.from({length: FAN.n}, (_, k) => k).sort((a, b) => Math.abs(b - (FAN.n - 1) / 2) - Math.abs(a - (FAN.n - 1) / 2));
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(scale * 1000) / 1000})`}>
      {order.map((k) => {
        const op = clamp01(opacity[k] ?? 0);
        if (op <= 0.001) return null;
        const p = fanPose(k, clamp01(open[k] ?? 0));
        return (
          <g key={k} transform={`translate(${f2(p.x)} ${f2(p.y)}) rotate(${f2(p.rot)}) scale(${f2(p.s * 1000) / 1000})`} opacity={f2(op)}>
            <FrameCard k={k} arrow={arrow[k] ?? 0} />
          </g>
        );
      })}
    </g>
  );
};
