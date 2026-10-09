import React from 'react';
import {C, OUTLINE} from '../../theme';
import {ArrivalTimeline, TL_GEOM} from '../v2k/ArrivalTimeline';
import {TeachLabel} from '../v2k/Labels';

/**
 * V3 / V4 shared parts (both scenes are G2's):
 *
 *  - The V3 → V4 hand-off frame: the kit ArrivalTimeline full frame (paper field + card, axis, the ONE tick at the
 *    hidden-echo time, the "not to scale" chip) with "what survives: timing" (64) on the card. V3's last frames draw
 *    exactly <TimelineHandoff/>; V4's first frame draws the same and then lets the label (and later the tick) go, so the
 *    scene cut is invisible ("the timeline rises to fill the frame" → "the shared timeline, full frame").
 *  - The telescopic pointer stick the checker taps with (V3.2 in the room, world px; V4.3 on the board, screen px).
 */

/** "what survives: timing" on the card: centred over the empty middle of the chart, clear of the spike (x 520, top y
 *  300), the tick (x 1240) and the route strip row (y 150). */
export const SURVIVES = {text: 'what survives: timing', x: 900, y: 470, size: 64} as const;

export type HandoffT = {
  /** 0..1 the label */
  label: number;
  /** 0..1 the tick (1 = landed and settled) */
  tick: number;
  /** 0..1 the "not to scale" chip */
  chip: number;
};

/** The full-frame hand-off picture (placement y = 0). */
export const TimelineHandoff: React.FC<{t: HandoffT; y?: number}> = ({t, y = 0}) => (
  <>
    <ArrivalTimeline axis={1} tick={t.tick} notToScale={t.chip} bg y={y} />
    {t.label > 0 && (
      <TeachLabel x={SURVIVES.x} y={SURVIVES.y + y} anchor="middle" size={SURVIVES.size} opacity={t.label} font="display">
        {SURVIVES.text}
      </TeachLabel>
    )}
  </>
);

/** Where the tick stands on the axis (screen px, placement y = 0): its top centre. */
export const TICK_TOP = {x: TL_GEOM.tick.x, y: TL_GEOM.axis.y - TL_GEOM.tick.h};

const f2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The checker's telescopic pointer: a wooden stick with a coral tip cap, from `hand` to `tip` (any px space; draw it
 * over her mitt). `w` is the stick width. A small mitt thumb is drawn over the stick at the hand so the grip reads.
 */
export const PointerStick: React.FC<{hand: {x: number; y: number}; tip: {x: number; y: number}; w?: number; skin: string; thumb?: boolean}> = ({hand, tip, w = 9, skin, thumb = true}) => {
  const L = Math.hypot(tip.x - hand.x, tip.y - hand.y);
  if (L < 1) return null;
  const ux = (tip.x - hand.x) / L;
  const uy = (tip.y - hand.y) / L;
  const cap = Math.min(L * 0.25, w * 1.6);
  const capStart = {x: tip.x - ux * cap, y: tip.y - uy * cap};
  const seg = (a: {x: number; y: number}, b: {x: number; y: number}, sw: number, col: string) => (
    <line x1={f2(a.x)} y1={f2(a.y)} x2={f2(b.x)} y2={f2(b.y)} stroke={col} strokeWidth={sw} strokeLinecap="round" />
  );
  // the telescoping joints: two thin rings at a third and two thirds of the length
  const ringAt = (k: number) => ({x: hand.x + ux * L * k, y: hand.y + uy * L * k});
  return (
    <g>
      {seg(hand, tip, w + OUTLINE * 2 - 1, C.ink)}
      {seg(hand, tip, w - 1, C.woodLight)}
      {seg(capStart, tip, w - 1, C.coralDeep)}
      {L > 60 &&
        [0.4, 0.7].map((k) => {
          const p = ringAt(k);
          const nx = -uy * (w / 2 + 1);
          const ny = ux * (w / 2 + 1);
          return <line key={k} x1={f2(p.x - nx)} y1={f2(p.y - ny)} x2={f2(p.x + nx)} y2={f2(p.y + ny)} stroke={C.ink} strokeWidth={2.5} strokeLinecap="round" />;
        })}
      {thumb && <ellipse cx={f2(hand.x + ux * 4)} cy={f2(hand.y + uy * 4)} rx={w * 0.95} ry={w * 0.75} transform={`rotate(${f2((Math.atan2(uy, ux) * 180) / Math.PI)} ${f2(hand.x + ux * 4)} ${f2(hand.y + uy * 4)})`} fill={skin} stroke={C.ink} strokeWidth={3} />}
    </g>
  );
};
