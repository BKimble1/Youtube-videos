import React from 'react';
import {C, OUTLINE} from '../../theme';
import {DEFAULT_VIEW, PTS, figureMix, projectWith, viewAt, type PlanPt, type ViewConfig} from '../../lib/room';
import {HandheldSensor, SensorTop, facingOf} from './HandheldSensor';

/**
 * S4 only: the kit sensor on its small tripod stand (acts 1-3 continuity: the opening data was captured with the
 * sensor held still), drawn through lib/room's projection so it folds with the room.
 *
 *  - The tripod (three legs, hub, column) is real projected geometry: it flattens correctly as the camera rises. Like
 *    the people, it fades with figureMix().rig so the plan view shows only the overhead sensor glyph (the standard
 *    plan board that S5 picks up).
 *  - The HandheldSensor cutout (frontal, readout toward us) sits on the column top with its grip in the clamp; it is
 *    a cutout, so it fades with the rigs (figureMix().rig).
 *  - SensorTop (the overhead glyph) fades in at the projected sensor point S with the tokens (figureMix().token),
 *    facing `aim` (a plan point on the wall).
 *
 * Geometry: S from layout.json (h = 1.2 m). The column top is placed so that, in the room view, the sensor's working
 * face sits at S: the HandheldSensor far face is 91 + 14 = 105 model px above the grip's bottom; at the room-view
 * rig scale × 0.6 (a ~0.2 m box) that is 0.243 m.
 */
export const STAND = {hub: 0.6, footR: 0.21, legW: 7, colW: 10, sensorK: 0.6, faceAboveTop: 0.243};

export type SensorStandProps = {
  tilt: number;
  /** plan point the sensor faces (default: the layout aim point on the wall) */
  aim?: PlanPt;
  /** 0..1 emitter flash on both the cutout and the glyph */
  firing?: number;
  led?: number;
  view?: ViewConfig;
};

export const SensorStand: React.FC<SensorStandProps> = ({tilt, aim, firing = 0, led = 1, view = DEFAULT_VIEW}) => {
  const st = viewAt(tilt, view);
  const S = PTS.S;
  const sh = S.h ?? 1.2;
  const mix = figureMix(tilt);
  const P = (x: number, z: number, h: number) => projectWith(st, {x, z, h});
  const top = sh - STAND.faceAboveTop;
  const hub = P(S.x, S.z, STAND.hub);
  // legs: one toward the camera (+z), two behind; painted far -> near
  const legs = [Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 + (4 * Math.PI) / 3]
    .map((a) => ({a, foot: {x: S.x + STAND.footR * Math.cos(a), z: S.z + STAND.footR * Math.sin(a)}}))
    .sort((p, q) => p.foot.z - q.foot.z);
  const back = legs.filter((l) => l.foot.z < S.z);
  const front = legs.filter((l) => l.foot.z >= S.z);
  const leg = (l: (typeof legs)[number], i: number) => {
    const f = P(l.foot.x, l.foot.z, 0);
    const d = `M ${hub.x.toFixed(2)} ${hub.y.toFixed(2)} L ${f.x.toFixed(2)} ${f.y.toFixed(2)}`;
    return (
      <g key={i}>
        <path d={d} stroke={C.ink} strokeWidth={STAND.legW + OUTLINE * 2} strokeLinecap="round" fill="none" />
        <path d={d} stroke={C.inkMuted} strokeWidth={STAND.legW} strokeLinecap="round" fill="none" />
        <circle cx={f.x} cy={f.y} r={6} fill={C.ink} />
      </g>
    );
  };
  const colTop = P(S.x, S.z, top);
  const colBot = P(S.x, S.z, STAND.hub - 0.06);
  const colD = `M ${colBot.x.toFixed(2)} ${colBot.y.toFixed(2)} L ${colTop.x.toFixed(2)} ${colTop.y.toFixed(2)}`;
  // floor shadow (an ellipse on the floor plane, projected)
  const sc = P(S.x, S.z, 0);
  const shadowRx = 0.26 * st.ppm;
  const shadowRy = Math.max(2, 0.26 * st.ppm * st.floor);
  // the cutout: the room-view rig scale x 0.6 (a ~0.2 m box), grip bottom (model y +14) in the column's clamp
  const rigScale = (1.7 * st.ppm) / 440;
  const k = STAND.sensorK * rigScale;
  const grip = {x: colTop.x, y: colTop.y - 14 * k};
  // the overhead glyph
  const s = P(S.x, S.z, sh);
  const aimPt = aim ?? {x: (PTS.W.W1.x + PTS.W.W4.x) / 2, z: 0};
  const a = P(aimPt.x, aimPt.z, sh);
  const facing = facingOf(a.x - s.x, a.y - s.y);
  const standOp = mix.rig;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {standOp > 0.001 && (
        <g opacity={standOp}>
          <ellipse cx={sc.x} cy={sc.y} rx={shadowRx} ry={shadowRy} fill={C.shadow} />
          {back.map(leg)}
          <path d={colD} stroke={C.ink} strokeWidth={STAND.colW + OUTLINE * 2} strokeLinecap="round" fill="none" />
          <path d={colD} stroke={C.inkSoft} strokeWidth={STAND.colW} strokeLinecap="round" fill="none" />
          <circle cx={hub.x} cy={hub.y} r={11} fill={C.inkSoft} stroke={C.ink} strokeWidth={OUTLINE} />
          {front.map((l, i) => leg(l, 10 + i))}
          {/* clamp at the column top */}
          <rect x={colTop.x - 14} y={colTop.y - 6} width={28} height={14} rx={4} fill={C.inkSoft} stroke={C.ink} strokeWidth={OUTLINE} />
          <g transform={`translate(${grip.x.toFixed(2)} ${grip.y.toFixed(2)})`}>
            <HandheldSensor scale={k} led={led} firing={firing} />
          </g>
        </g>
      )}
      {mix.token > 0.001 && <SensorTop asGroup x={s.x} y={s.y} size={0.22 * st.ppm} facing={facing} firing={firing} opacity={mix.token} scale={mix.tokenScale} />}
    </svg>
  );
};
