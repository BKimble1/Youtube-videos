import React from 'react';
import {C, OUTLINE} from '../../theme';
import {rand} from '../../lib/anim';
import {ROOM_COLORS} from '../v02/RoomSet';
import * as V2Plan from './V2_Plan';
import {ArrivalTimeline, TL_GEOM} from '../v2k/ArrivalTimeline';
import {TeachLabel} from '../v2k/Labels';

/**
 * V3 / V4 shared parts (both scenes are G2's):
 *
 *  - The V2 → V3 hand-off paint (v2 review r1, V2-R1-02): the relay wall's paint colour with its static paint grain, the
 *    frame V2 ends on (G1's V2_Plan PAINT_GRAIN) and V3 opens on; and the same grain on the wall face while V3.1 pulls
 *    back out of the paint (it shrinks with the zoom and fades before it would read as texture).
 *  - The V3 → V4 hand-off frame: the kit ArrivalTimeline full frame (paper field + card, axis, the ONE tick at the
 *    hidden-echo time, the "not to scale" chip) with "what survives: timing" (64) on the card. V3's last frames draw
 *    exactly <TimelineHandoff/>; V4's first frame draws the same and then lets the label (and later the tick) go, so the
 *    scene cut is invisible ("the timeline rises to fill the frame" → "the shared timeline, full frame").
 *  - The telescopic pointer stick the checker taps with (V3.2 in the room, world px; V4.3 on the board, screen px).
 */

const f2 = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ the hand-off paint grain (V2 → V3) */

/**
 * The paint grain, generated exactly as G1's V2_Plan.tsx PAINT_GRAIN (the shared, documented recipe): flat cutout
 * ellipses in SCREEN px at the hand-off framing (the frame is all paint), from lib/anim `rand` with the seeds
 * GRAIN_SEED = {bump: 4100, fleck: 5200}:
 *  - bumps: a 12 × 7 jittered grid, r 13–30 px, flatness 0.6; each bump = a shade crescent (+0.2 r, +0.24 r), the bump in
 *    the paint colour (0.9 r) and a highlight (−0.3 r, −0.3 ry; 0.38 r × 0.26 ry); rotation ±25°;
 *  - flecks: a 16 × 9 jittered grid, r 2.4–5 px, flatness 0.5, rotation ±75°;
 *  - every item kept 4 px (plus its shade offset) inside the frame; tones GRAIN_TONES.
 * When V2_Plan exports PAINT_GRAIN / GRAIN_TONES (G1's file, after the merge), those are used, so V3's first frame is
 * always V2's last frame; this copy is the fallback, and a dev warning reports any difference.
 */
export type GrainItem = {x: number; y: number; rx: number; ry: number; rot: number; tone: 'shade' | 'body' | 'light' | 'fleck'};
export const PAINT = ROOM_COLORS.relayWall;
const GRAIN_SEED = {bump: 4100, fleck: 5200};
const GRAIN_TONES_LOCAL: Record<GrainItem['tone'], string> = {shade: '#EAD3A9', body: PAINT, light: '#FCF4E3', fleck: '#DCC193'};
const PAINT_GRAIN_LOCAL: GrainItem[] = (() => {
  const out: GrainItem[] = [];
  const field = (cols: number, rows: number, r0: number, r1: number, flat: number, seed: number, pad: number, emit: (x: number, y: number, r: number, ry: number, rot: number) => void) => {
    const cw = 1920 / cols;
    const chh = 1080 / rows;
    let s = seed;
    for (let j = 0; j < cols * rows; j++) {
      const R = () => rand(s++);
      const r = r0 + (r1 - r0) * R();
      const ry = r * (flat + (1 - flat) * R());
      const cx = ((j % cols) + 0.15 + 0.7 * R()) * cw;
      const cy = (Math.floor(j / cols) + 0.15 + 0.7 * R()) * chh;
      const m = r * (1 + pad) + 4;
      emit(Math.max(m, Math.min(1920 - m, cx)), Math.max(m, Math.min(1080 - m, cy)), r, ry, (R() - 0.5) * 50);
    }
  };
  const E = (x: number, y: number, rx: number, ry: number, rot: number, tone: GrainItem['tone']) => out.push({x: f2(x), y: f2(y), rx: f2(rx), ry: f2(ry), rot: f2(rot), tone});
  field(12, 7, 13, 30, 0.6, GRAIN_SEED.bump, 0.3, (x, y, r, ry, rot) => {
    E(x + 0.2 * r, y + 0.24 * r, r, ry, rot, 'shade');
    E(x, y, 0.9 * r, 0.9 * ry, rot, 'body');
    E(x - 0.3 * r, y - 0.3 * ry, 0.38 * r, 0.26 * ry, rot, 'light');
  });
  field(16, 9, 2.4, 5, 0.5, GRAIN_SEED.fleck, 0, (x, y, r, ry, rot) => E(x, y, r, ry, rot * 3, 'fleck'));
  return out;
})();
/** G1's exports when present (looked up by name, so this file compiles before and after the merge). */
const fromV2 = (name: string): unknown => (V2Plan as unknown as Record<string, unknown>)[name];
const G1_GRAIN = fromV2('PAINT_GRAIN') as GrainItem[] | undefined;
const G1_TONES = fromV2('GRAIN_TONES') as Record<GrainItem['tone'], string> | undefined;
export const PAINT_GRAIN: GrainItem[] = Array.isArray(G1_GRAIN) && G1_GRAIN.length > 0 ? G1_GRAIN : PAINT_GRAIN_LOCAL;
export const GRAIN_TONES: Record<GrainItem['tone'], string> = G1_TONES ?? GRAIN_TONES_LOCAL;
/** True when G1's grain (if present) equals this copy item for item. */
export const GRAIN_MATCHES_V2 = !G1_GRAIN || (G1_GRAIN.length === PAINT_GRAIN_LOCAL.length && G1_GRAIN.every((it, i) => JSON.stringify(it) === JSON.stringify(PAINT_GRAIN_LOCAL[i])));
if (!GRAIN_MATCHES_V2 && typeof console !== 'undefined') console.warn('V3_Parts: V2_Plan PAINT_GRAIN differs from the documented recipe; V3 uses V2_Plan\'s (the hand-off still matches).');
if ((V2Plan as unknown as Record<string, unknown>).PAINT !== undefined && V2Plan.PAINT !== PAINT) throw new Error('V3_Parts: the hand-off paint colour differs from V2_Plan PAINT');

const grainEl = (key: string, it: GrainItem, x: number, y: number, q: number, opacity: number) => (
  <ellipse key={key} cx={f2(x)} cy={f2(y)} rx={f2(it.rx * q)} ry={f2(it.ry * q)} transform={`rotate(${it.rot} ${f2(x)} ${f2(y)})`} fill={GRAIN_TONES[it.tone]} opacity={opacity < 1 ? f2(opacity) : undefined} />
);

/** The hand-off frame's grain in screen space (a full-frame <svg>; put it over a PAINT fill): V2's last 4 frames, V3's
 *  first 4. */
export const PaintGrain: React.FC = () => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
    {PAINT_GRAIN.map((it, i) => grainEl(`g${i}`, it, it.x, it.y, 1, 1))}
  </svg>
);

/**
 * The same grain on the wall face in WORLD px while a camera pulls back out of the paint: the hand-off list (frame centre
 * at `anchor`, scale 1/z0, i.e. exactly the hand-off frame when the camera is at zoom z0 on the anchor), tiled in x and
 * y, clipped to the wall face polygon `clip` (world px). Screen size scale q = zoom / z0; the whole layer is multiplied
 * by `opacity` and items under 0.75 px on screen are skipped. `view` is the world rectangle on screen (only the tiles
 * that reach it are drawn).
 */
export const WallGrain: React.FC<{anchor: {x: number; y: number}; z0: number; zoom: number; clip: {x: number; y: number}[]; view: {x0: number; y0: number; x1: number; y1: number}; opacity: number; id: string}> = ({anchor, z0, zoom, clip, view, opacity, id}) => {
  if (opacity <= 0) return null;
  const q = zoom / z0;
  const tw = 1920 / z0;
  const th = 1080 / z0;
  const i0 = Math.floor((view.x0 - anchor.x) / tw - 0.5);
  const i1 = Math.ceil((view.x1 - anchor.x) / tw + 0.5);
  const j0 = Math.floor((view.y0 - anchor.y) / th - 0.5);
  const j1 = Math.ceil((view.y1 - anchor.y) / th + 0.5);
  const items: React.ReactNode[] = [];
  for (let i = i0; i <= i1; i++)
    for (let j = j0; j <= j1; j++)
      PAINT_GRAIN.forEach((it, k) => {
        if (it.rx * q < 0.75) return;
        const x = anchor.x + (it.x - 960 + i * 1920) / z0;
        const y = anchor.y + (it.y - 540 + j * 1080) / z0;
        const r = it.rx / z0;
        if (x + r < view.x0 || x - r > view.x1 || y + r < view.y0 || y - r > view.y1) return;
        items.push(grainEl(`${i}_${j}_${k}`, it, x, y, 1 / z0, 1));
      });
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id={id}>
          <polygon points={clip.map((p) => `${f2(p.x)},${f2(p.y)}`).join(' ')} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`} opacity={opacity < 1 ? f2(opacity) : undefined}>
        {items}
      </g>
    </svg>
  );
};

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
