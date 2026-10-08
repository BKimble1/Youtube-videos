import React from 'react';
import {C, OUTLINE} from '../../theme';
import {DEFAULT_VIEW, LAYOUT, PTS, ViewConfig, project, rigAt, viewAt} from '../../lib/room';
import {HandheldSensor, SENSOR, sensorPoint, type HandheldSensorProps} from './HandheldSensor';

/**
 * S3 copy of S1_SensorStand (same design, so the cut from S1/S2 matches): the kit HandheldSensor standing on a small tripod (acts 1-3: the opening data was captured with the sensor
 * held still). The sensor's working (far) face sits exactly on the projected layout sensor point S, so light paths
 * start on the prop; the tripod's three legs are drawn from projected floor points, so the stand stays on the floor
 * at every tilt. Like the rigs, the sensor itself is an upright billboard whose size follows the rig scale at the
 * operator's spot (0.6 of the model, about 0.2 m wide, the same proportion dev/KitRoom uses for the hand-held prop).
 *
 * World px (the RoomSet's space): draw <SensorStand/> as a RoomSet item at {x: S.x, z: S.z}.
 */

/** Sensor size relative to the rig scale (KitRoom's hand-held proportion). */
export const STAND_SENSOR_K = 0.6;

const f2 = (n: number) => Math.round(n * 100) / 100;

/** Where everything of the stand lands at a tilt (world px). */
export const standGeometry = (tilt: number, view: ViewConfig = DEFAULT_VIEW) => {
  const s = viewAt(tilt, view);
  const k = STAND_SENSOR_K * rigAt(LAYOUT.operator.x, LAYOUT.operator.z, tilt, {view}).scale;
  const S = project(PTS.S, tilt, view);
  const ff = sensorPoint('farFace', k);
  // the sensor's (0,0) is the bottom of its grip hand-hold: the tripod's mount plate sits under it
  const mount = {x: S.x - ff.x, y: S.y - ff.y};
  const at = (lx: number, ly: number) => ({x: mount.x + lx * k, y: mount.y + ly * k});
  const b = SENSOR.box;
  const box = {x0: mount.x + b.x0 * k, y0: mount.y + b.y0 * k + SENSOR.depth.dy * k, x1: mount.x + (b.x1 + SENSOR.depth.dx) * k, y1: mount.y + b.y1 * k};
  const sc = SENSOR.screen;
  const screen = {x: mount.x + sc.x0 * k, y: mount.y + sc.y0 * k, w: sc.w * k, h: sc.h * k};
  // height (m) of the mount plate above the floor at this tilt (the billboard is not squashed, the stand is)
  const plateY = mount.y + 22 * k;
  const hPlate = s.height > 1e-6 ? PTS.S.h! - (plateY - S.y) / (s.ppm * s.height) : 0;
  return {k, S: {x: S.x, y: S.y}, mount, at, box, screen, plateY, hPlate, ppm: s.ppm};
};

export type SensorStandProps = {
  tilt: number;
  view?: ViewConfig;
  /** Forwarded to the HandheldSensor (readout, LED, firing). */
  sensor?: Omit<HandheldSensorProps, 'scale' | 'skin' | 'rotate' | 'mirrored'>;
};

/** The tripod stand plus the sensor on it (one world-px <svg>). */
export const SensorStand: React.FC<SensorStandProps> = ({tilt, view = DEFAULT_VIEW, sensor}) => {
  const geo = standGeometry(tilt, view);
  const {k, mount} = geo;
  const P = (x: number, z: number, h = 0) => project({x, z, h}, tilt, view);
  const Sx = PTS.S.x;
  const Sz = PTS.S.z;
  // hub where the three legs meet: 58 % of the way up to the plate, directly under the mount
  const hubH = Math.max(0.05, geo.hPlate * 0.58);
  const hubP = P(Sx, Sz, hubH);
  const hub = {x: mount.x + (hubP.x - P(Sx, Sz, geo.hPlate).x), y: hubP.y};
  const feet = [
    P(Sx - 0.16, Sz + 0.1),
    P(Sx + 0.17, Sz + 0.08),
    P(Sx + 0.01, Sz - 0.17),
  ];
  // back leg first (it is behind the column), then the column, then the two front legs
  const leg = (f: {x: number; y: number}, key: string) => (
    <g key={key}>
      <path d={`M ${f2(hub.x)} ${f2(hub.y)} L ${f2(f.x)} ${f2(f.y)}`} stroke={C.ink} strokeWidth={9 + OUTLINE} strokeLinecap="round" />
      <path d={`M ${f2(hub.x)} ${f2(hub.y)} L ${f2(f.x)} ${f2(f.y)}`} stroke={C.inkSoft} strokeWidth={9 - OUTLINE / 2} strokeLinecap="round" />
      <ellipse cx={f2(f.x)} cy={f2(f.y)} rx={9} ry={5} fill={C.ink} />
    </g>
  );
  const shadow = [P(Sx - 0.24, Sz - 0.2), P(Sx + 0.26, Sz - 0.2), P(Sx + 0.26, Sz + 0.16), P(Sx - 0.24, Sz + 0.16)];
  const sh = (() => {
    const cx = shadow.reduce((a, p) => a + p.x, 0) / 4;
    const cy = shadow.reduce((a, p) => a + p.y, 0) / 4;
    const rx = (Math.max(...shadow.map((p) => p.x)) - Math.min(...shadow.map((p) => p.x))) / 2;
    const ry = Math.max(6, (Math.max(...shadow.map((p) => p.y)) - Math.min(...shadow.map((p) => p.y))) / 2);
    return {cx, cy, rx, ry};
  })();
  const plateW = 46 * k;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <ellipse cx={f2(sh.cx)} cy={f2(sh.cy)} rx={f2(sh.rx)} ry={f2(sh.ry)} fill={C.shadow} />
      {leg(feet[2], 'back')}
      {/* centre column and mount plate */}
      <path d={`M ${f2(hub.x)} ${f2(hub.y)} L ${f2(mount.x)} ${f2(geo.plateY)}`} stroke={C.ink} strokeWidth={12 + OUTLINE} strokeLinecap="round" />
      <path d={`M ${f2(hub.x)} ${f2(hub.y)} L ${f2(mount.x)} ${f2(geo.plateY)}`} stroke={C.inkSoft} strokeWidth={12 - OUTLINE / 2} strokeLinecap="round" />
      {leg(feet[0], 'fl')}
      {leg(feet[1], 'fr')}
      <rect x={f2(hub.x - 13)} y={f2(hub.y - 9)} width={26} height={18} rx={6} fill={C.tealDeep} stroke={C.ink} strokeWidth={3} />
      <rect x={f2(mount.x - plateW / 2)} y={f2(geo.plateY - 8)} width={f2(plateW)} height={12} rx={4} fill={C.tealDeep} stroke={C.ink} strokeWidth={3} />
      <g transform={`translate(${f2(mount.x)} ${f2(mount.y)})`}>
        <HandheldSensor {...sensor} scale={k} />
      </g>
    </svg>
  );
};
