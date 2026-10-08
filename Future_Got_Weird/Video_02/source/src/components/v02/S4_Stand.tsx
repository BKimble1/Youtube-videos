import React from 'react';
import {C, OUTLINE} from '../../theme';
import {DEFAULT_VIEW, PTS, figureMix, projectWith, rigScale, viewAt, type PlanPt, type ViewConfig} from '../../lib/room';
import {HandheldSensor, SensorTop, facingOf, sensorPoint} from './HandheldSensor';

/**
 * S4 only: the kit sensor on its small tripod stand (acts 1-3 continuity: the opening data was captured with the
 * sensor held still), drawn through lib/room's projection so it folds with the room. Same design and geometry as the
 * S1/S2/S3/S9 stand (teal hub and mount plate, three thin legs), copied here so S4 matches them.
 *
 *  - The sensor cutout is an upright billboard on the SET's height scale, like the people: 0.6 of the rig scale
 *    (lib/room rigScale, about a 0.2 m box), with its working (far) face exactly on the projected layout sensor point
 *    S (h = layout sensor.h, 0.95 m, the light-path plane) at every tilt. (The first S4 stand sized the cutout with the
 *    old full-height rig scale and hung it from a fixed column height: during the fold it grew to the size of her head
 *    and rose above her shoulders while the set-scaled people shrank.)
 *  - The tripod (three legs, hub, column, plate) is projected geometry under the mount: it flattens as the camera rises.
 *    The cutout and the tripod fade with figureMix().rig, so the plan view shows only the overhead sensor glyph.
 *  - SensorTop (the overhead glyph) fades in at the projected sensor point S with the tokens (figureMix().token),
 *    facing `aim` (a plan point on the wall). Unchanged: S5 picks it up at the cut.
 */
export const STAND_SENSOR_K = 0.6;

const f2 = (n: number) => Math.round(n * 100) / 100;

/** Where the stand lands at a tilt (world px): sensor scale, the projected S, the sensor's mount (grip bottom), plate. */
export const s4StandGeometry = (tilt: number, view: ViewConfig = DEFAULT_VIEW) => {
  const s = viewAt(tilt, view);
  const k = STAND_SENSOR_K * rigScale(s);
  const S = projectWith(s, PTS.S);
  const ff = sensorPoint('farFace', k);
  // the sensor's (0,0) is the bottom of its grip: the tripod's mount plate sits just under it
  const mount = {x: S.x - ff.x, y: S.y - ff.y};
  const plateY = mount.y + 22 * k;
  // height (m) of the mount plate above the floor at this tilt (the billboard is not squashed, the stand is)
  const hPlate = s.height > 1e-6 ? (PTS.S.h ?? 0.95) - (plateY - S.y) / (s.ppm * s.height) : 0;
  // hub where the three legs meet: 58 % of the way up to the plate, directly under the mount (the column is vertical)
  const hubH = Math.max(0.05, hPlate * 0.58);
  const hubP = projectWith(s, {x: PTS.S.x, z: PTS.S.z, h: hubH});
  const plateP = projectWith(s, {x: PTS.S.x, z: PTS.S.z, h: hPlate});
  const hub = {x: mount.x + (hubP.x - plateP.x), y: hubP.y};
  return {s, k, S: {x: S.x, y: S.y}, mount, plateY, hPlate, hub};
};

/** A point on the stand's centre column at world-px height y (clamped between the hub and the mount plate): where a
 *  hand can hold the stand. */
export const s4ColumnAt = (tilt: number, y: number, view: ViewConfig = DEFAULT_VIEW) => {
  const geo = s4StandGeometry(tilt, view);
  const y0 = geo.plateY + 10;
  const y1 = geo.hub.y;
  const yy = Math.max(Math.min(y0, y1), Math.min(Math.max(y0, y1), y));
  const u = Math.abs(y1 - y0) > 1e-6 ? (yy - y0) / (y1 - y0) : 0;
  return {x: geo.mount.x + (geo.hub.x - geo.mount.x) * u, y: yy};
};

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
  const geo = s4StandGeometry(tilt, view);
  const {s: st, k, mount} = geo;
  const S = PTS.S;
  const sh = S.h ?? 0.95;
  const mix = figureMix(tilt);
  const P = (x: number, z: number, h = 0) => projectWith(st, {x, z, h});
  const hub = geo.hub;
  const feet = [P(S.x - 0.16, S.z + 0.1), P(S.x + 0.17, S.z + 0.08), P(S.x + 0.01, S.z - 0.17)];
  const leg = (f: {x: number; y: number}, key: string) => (
    <g key={key}>
      <path d={`M ${f2(hub.x)} ${f2(hub.y)} L ${f2(f.x)} ${f2(f.y)}`} stroke={C.ink} strokeWidth={9 + OUTLINE} strokeLinecap="round" />
      <path d={`M ${f2(hub.x)} ${f2(hub.y)} L ${f2(f.x)} ${f2(f.y)}`} stroke={C.inkSoft} strokeWidth={9 - OUTLINE / 2} strokeLinecap="round" />
      <ellipse cx={f2(f.x)} cy={f2(f.y)} rx={9} ry={5} fill={C.ink} />
    </g>
  );
  // floor shadow: the bounding ellipse of a projected floor rectangle round the feet
  const shadow = [P(S.x - 0.24, S.z - 0.2), P(S.x + 0.26, S.z - 0.2), P(S.x + 0.26, S.z + 0.16), P(S.x - 0.24, S.z + 0.16)];
  const shCx = shadow.reduce((a, p) => a + p.x, 0) / 4;
  const shCy = shadow.reduce((a, p) => a + p.y, 0) / 4;
  const shRx = (Math.max(...shadow.map((p) => p.x)) - Math.min(...shadow.map((p) => p.x))) / 2;
  const shRy = Math.max(6, (Math.max(...shadow.map((p) => p.y)) - Math.min(...shadow.map((p) => p.y))) / 2);
  const plateW = 46 * k;
  // the overhead glyph
  const sTop = P(S.x, S.z, sh);
  const aimPt = aim ?? {x: (PTS.W.W1.x + PTS.W.W4.x) / 2, z: 0};
  const a = P(aimPt.x, aimPt.z, sh);
  const facing = facingOf(a.x - sTop.x, a.y - sTop.y);
  const standOp = mix.rig;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {standOp > 0.001 && (
        <g opacity={standOp}>
          <ellipse cx={f2(shCx)} cy={f2(shCy)} rx={f2(shRx)} ry={f2(shRy)} fill={C.shadow} />
          {leg(feet[2], 'back')}
          {/* centre column and mount plate */}
          <path d={`M ${f2(hub.x)} ${f2(hub.y)} L ${f2(mount.x)} ${f2(geo.plateY)}`} stroke={C.ink} strokeWidth={12 + OUTLINE} strokeLinecap="round" />
          <path d={`M ${f2(hub.x)} ${f2(hub.y)} L ${f2(mount.x)} ${f2(geo.plateY)}`} stroke={C.inkSoft} strokeWidth={12 - OUTLINE / 2} strokeLinecap="round" />
          {leg(feet[0], 'fl')}
          {leg(feet[1], 'fr')}
          <rect x={f2(hub.x - 13)} y={f2(hub.y - 9)} width={26} height={18} rx={6} fill={C.tealDeep} stroke={C.ink} strokeWidth={3} />
          <rect x={f2(mount.x - plateW / 2)} y={f2(geo.plateY - 8)} width={f2(plateW)} height={12} rx={4} fill={C.tealDeep} stroke={C.ink} strokeWidth={3} />
          <g transform={`translate(${f2(mount.x)} ${f2(mount.y)})`}>
            <HandheldSensor scale={k} led={led} firing={firing} />
          </g>
        </g>
      )}
      {mix.token > 0.001 && <SensorTop asGroup x={sTop.x} y={sTop.y} size={0.22 * st.ppm} facing={facing} firing={firing} opacity={mix.token} scale={mix.tokenScale} />}
    </svg>
  );
};
