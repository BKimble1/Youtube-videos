import React from 'react';
import {C, OUTLINE} from '../../theme';
import {E} from '../../lib/motion';
import {LAYOUT, extractContours, type P2, type ScalarField} from '../../lib/optics';
import layoutJson from '../../data/layout.json';
import {PossibleCloud} from '../v02/Optics';
import {SensorTop, facingOf} from '../v02/HandheldSensor';

/**
 * V12 copy of v1 S9_Readout (components/v02/S9_Readout.tsx), changed only where noted "V12": the blob is drawn with a
 * pale outer halo (an extra low level of the same field, with a crisp outer line) so the one-pulse reading reads as a
 * soft blob at phone size rather than a thin sliver; the ids are V12's own.
 *
 * S9 · the sensor's readout, magnified: a teal bezel (the sensor's own back face: teal body, coral band, status LED)
 * around a cream screen that shows the reading as a small plan (relay wall at the top, the partition, the sensor) with
 * the likely-location blob (the same field as S4.7: all four wall spots, one-bin bands). Screen-space component.
 *
 * `blob` grows the blob in, `lit` flashes a ring round it (the clue lights), `blank` empties the screen (no echo came
 * back: the reading is gone), `t` pops the whole inset in (scale about its centre, with a small overshoot). With
 * `exiting`, `t` going 1 -> 0 is a calm exit instead (review r1 D40): it shrinks to 94 % and fades out, rather than
 * running the pop backwards (a swell, then a snap).
 *
 * MiniReadout is the same reading at the size of the real sensor's screen (sensor-local px), so the prop in the room
 * shows what the inset magnifies.
 */

const f2 = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** The plan window the readout shows (metres): x from MAP_X0 over MAP_W, z from MAP_Z0 down. */
const MAP_X0 = 1.4;
const MAP_W = 1.6;
const MAP_Z0 = -0.1;

/** where the sensor is aimed on the wall (layout.json sensor.aimX): its glyph faces that way */
const SPOT_AIM: P2 = {x: layoutJson.sensor.aimX, z: 0};

type ReadoutMapProps = {
  /** screen size, px */
  w: number;
  h: number;
  field: ScalarField;
  /** 0..1 blob grows in */
  blob: number;
  /** 0..1 the clue lights: a ring expands once, the blob deepens */
  lit: number;
  /** 0..1 the screen empties (1 = blank) */
  blank: number;
  /** partition z0 (plan metres) drawn on the map */
  occZ0?: number;
};

/** V12: a pale, rounded halo round the field's low level (a thick round-joined stroke in the light tone), grown in about
 *  its centre like the cloud itself. */
const Halo: React.FC<{toPx: (p: P2) => {x: number; y: number}; field: ScalarField; t: number}> = ({toPx, field, t}) => {
  if (t <= 0) return null;
  const loops = extractContours(field, 0.006).map((l) => l.map(toPx));
  const all = loops.flat();
  if (!all.length) return null;
  const cx = all.reduce((a, p) => a + p.x, 0) / all.length;
  const cy = all.reduce((a, p) => a + p.y, 0) / all.length;
  const s = 0.55 + 0.45 * E.out(clamp01(t));
  const d = loops.map((l) => l.map((p, i) => `${i ? 'L' : 'M'} ${f2(p.x)} ${f2(p.y)}`).join(' ') + ' Z').join(' ');
  return (
    <g transform={`translate(${f2(cx)} ${f2(cy)}) scale(${s.toFixed(4)}) translate(${f2(-cx)} ${f2(-cy)})`} opacity={Math.min(1, clamp01(t) * 1.4)}>
      <path d={d} fill={C.tealLight} stroke={C.tealLight} strokeWidth={34} strokeLinejoin="round" />
    </g>
  );
};

const ReadoutMap: React.FC<ReadoutMapProps> = ({w, h, field, blob, lit, blank, occZ0 = LAYOUT.occluder.z0}) => {
  const k = w / MAP_W;
  const toPx = (p: P2) => ({x: (p.x - MAP_X0) * k, y: (p.z - MAP_Z0) * k});
  const o = LAYOUT.occluder;
  const show = 1 - clamp01(blank);
  if (show <= 0.001) return null;
  const wallY = toPx({x: 0, z: 0}).y;
  const px0 = toPx({x: o.x, z: occZ0});
  const pw = Math.max(14, o.thickness * k);
  const S = toPx({x: LAYOUT.sensor.x, z: LAYOUT.sensor.z});
  const A = toPx(SPOT_AIM);
  const H = toPx({x: LAYOUT.hidden.x, z: LAYOUT.hidden.z});
  const ringT = clamp01(lit);
  return (
    <g opacity={show}>
      {/* the relay wall (a band above the ink wall line) */}
      <rect x={-10} y={-10} width={w + 20} height={wallY + 10} fill="#F5E4C6" />
      <line x1={-10} y1={f2(wallY)} x2={w + 10} y2={f2(wallY)} stroke={C.ink} strokeWidth={6} />
      {/* the partition */}
      <rect x={f2(px0.x - pw / 2)} y={f2(px0.y)} width={f2(pw)} height={f2(h * 2)} rx={4} fill={C.coral} stroke={C.ink} strokeWidth={3.5} />
      {/* the likely location */}
      {blob > 0 && (
        <g>
          {/* V12: a pale rounded halo round the S9 levels, so the one-pulse reading reads as a soft blob */}
          <Halo toPx={toPx} field={field} t={blob} />
          <PossibleCloud asGroup toPx={toPx} field={field} levels={[0.08, 0.5]} t={blob} tone="teal" />
          {ringT > 0 && ringT < 1 && (
            <ellipse cx={f2(H.x)} cy={f2(H.y)} rx={f2(26 + 70 * E.out(ringT))} ry={f2(18 + 48 * E.out(ringT))} fill="none" stroke={C.tealDeep} strokeWidth={f2(6 * (1 - ringT) + 1)} opacity={1 - ringT} />
          )}
        </g>
      )}
      {/* the sensor */}
      <SensorTop asGroup x={S.x} y={S.y} size={0.24 * k} facing={facingOf(A.x - S.x, A.y - S.y)} />
    </g>
  );
};

export type V12ReadoutInsetProps = Omit<ReadoutMapProps, 'w' | 'h'> & {
  /** top-left corner and size of the whole inset (bezel included), screen px */
  x: number;
  y: number;
  w: number;
  h: number;
  /** 0..1 pop in */
  t: number;
  /** status LED 0..1 */
  led?: number;
  /** `t` is the exit (1 -> 0): scale 0.94 + 0.06 t, opacity t */
  exiting?: boolean;
};

export const V12_READOUT_BEZEL = {side: 22, top: 22, bottom: 44};

/** The magnified readout (screen-space <svg>). */
export const V12ReadoutInset: React.FC<V12ReadoutInsetProps> = ({x, y, w, h, t, led = 1, exiting = false, ...map}) => {
  if (t <= 0) return null;
  const s = t >= 1 ? 1 : exiting ? 0.94 + 0.06 * clamp01(t) : E.back(clamp01(t));
  const op = exiting ? clamp01(t) : Math.min(1, t * 2);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const b = V12_READOUT_BEZEL;
  const sw = w - b.side * 2;
  const sh = h - b.top - b.bottom;
  const id = 'v12readout';
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g transform={`translate(${f2(cx)} ${f2(cy)}) scale(${s.toFixed(4)}) translate(${f2(-cx)} ${f2(-cy)})`} opacity={op}>
        {/* soft drop shadow */}
        <rect x={x + 8} y={y + 12} width={w} height={h} rx={28} fill={C.shadow} />
        <defs>
          <clipPath id={`${id}-body`}>
            <rect x={x} y={y} width={w} height={h} rx={28} />
          </clipPath>
          <clipPath id={`${id}-screen`}>
            <rect x={x + b.side} y={y + b.top} width={sw} height={sh} rx={14} />
          </clipPath>
        </defs>
        <rect x={x} y={y} width={w} height={h} rx={28} fill={C.teal} />
        <g clipPath={`url(#${id}-body)`}>
          <rect x={x - 2} y={y + h - 22} width={w + 4} height={24} fill={C.coral} />
          <line x1={x} y1={y + h - 22} x2={x + w} y2={y + h - 22} stroke={C.ink} strokeWidth={3} />
        </g>
        <rect x={x} y={y} width={w} height={h} rx={28} fill="none" stroke={C.ink} strokeWidth={OUTLINE} />
        {/* screen */}
        <rect x={x + b.side} y={y + b.top} width={sw} height={sh} rx={14} fill={C.cream} />
        <g clipPath={`url(#${id}-screen)`}>
          <g transform={`translate(${x + b.side} ${y + b.top})`}>
            <ReadoutMap {...map} w={sw} h={sh} />
          </g>
        </g>
        <rect x={x + b.side} y={y + b.top} width={sw} height={sh} rx={14} fill="none" stroke={C.ink} strokeWidth={3.5} />
        {/* status LED in the bezel's corner */}
        <circle cx={x + w - 34} cy={y + h - 33} r={8} fill={led > 0.5 ? C.saffron : C.inkMuted} stroke={C.ink} strokeWidth={3} opacity={1} />
      </g>
    </svg>
  );
};

/**
 * The same reading on the real sensor's tiny screen (sensor-local px, 0..w × 0..h): the wall line, the partition and a
 * teal blob where he is. Strokes are thin (the screen is ~36 px wide in the room).
 */
export const V12MiniReadout: React.FC<{w: number; h: number; blob: number; blank: number; occZ0?: number}> = ({w, h, blob, blank, occZ0 = LAYOUT.occluder.z0}) => {
  const show = 1 - clamp01(blank);
  const k = w / MAP_W;
  const toPx = (p: P2) => ({x: (p.x - MAP_X0) * k, y: (p.z - MAP_Z0) * k});
  const wallY = toPx({x: 0, z: 0}).y;
  const p0 = toPx({x: LAYOUT.occluder.x, z: occZ0});
  const H = toPx({x: LAYOUT.hidden.x, z: LAYOUT.hidden.z});
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} fill={C.cream} />
      {show > 0.001 && (
        <g opacity={show}>
          <rect x={0} y={0} width={w} height={wallY} fill="#F5E4C6" />
          <line x1={0} y1={f2(wallY)} x2={w} y2={f2(wallY)} stroke={C.ink} strokeWidth={1.6} />
          <rect x={f2(p0.x - 1.6)} y={f2(p0.y)} width={3.2} height={h} fill={C.coral} />
          {blob > 0 && <ellipse cx={f2(H.x)} cy={f2(H.y)} rx={f2(6 * E.out(clamp01(blob)))} ry={f2(3.6 * E.out(clamp01(blob)))} fill={C.teal} stroke={C.tealDeep} strokeWidth={1} />}
        </g>
      )}
    </g>
  );
};
