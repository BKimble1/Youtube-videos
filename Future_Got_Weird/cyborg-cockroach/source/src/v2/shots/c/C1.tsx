// C1 (315-344, "A second cockroach"): two insects, two jobs, in one high three-quarter view of the lab tray at the
// start of the foam course. Far (upper right): the medic, launch tube loaded (spring, amber injector, latch line).
// Near (lower left): the observer, a shade lighter, with the dark camera module and its round lens on its back and a
// short aerial. Both walk screen-right in a tripod gait, antennae searching; the observer is a little faster and
// draws level. The view drifts with them (one slow move).
import React from 'react';
import {V3} from '../../../lib/v3';
import {clamp, sr} from '../../../lib/ease';
import {poseRoach, straightPath, RoachPose} from '../../../rig/roach';
import {Roach2D, R2} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P, f2} from '../../roach/ortho';
import {Surface2D, Box2D, Target2D, LAB2} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {OBS_TINT} from './C2';
import {TrayPlane, Beyond2D, farForLip} from './tray';

export const C1_FROM = 315, C1_TO = 345;
const T0 = C1_FROM / 30;
const MEDIC_PATH = straightPath([-40, 0, -48], 0);
const OBS_PATH = straightPath([28, 0, 48], 0);
export const c1Medic = (f: number): RoachPose => {
  const t = f / 30;
  return poseRoach({path: MEDIC_PATH, s: 48 * (t - T0), t, seed: 1, search: 0.8, antL: {yaw: 0.75, pitch: 0.3}, antR: {yaw: 0.75, pitch: 0.3}});
};
export const c1Obs = (f: number): RoachPose => {
  const t = f / 30;
  return poseRoach({path: OBS_PATH, s: 52 * (t - T0), t, seed: 4, search: 0.9, antL: {yaw: 0.8, pitch: 0.34}, antR: {yaw: 0.8, pitch: 0.34}});
};
export const C1_AZ = 40, C1_EL = 36;
export const c1View = (f: number): View => {
  const u = sr(f, C1_FROM - 6, C1_TO + 4);
  const x = 0 + 42 * u; // follows the pair at a little less than their pace
  return viewAt(C1_AZ, C1_EL, 6.6 + 0.3 * u, [x, 10, 0], 540, 960);
};

/** foam blocks and curb pieces at the start of the course (world mm, axis-aligned) */
const PROPS: {b: [number, number, number, number, number, number]; c: string}[] = [
  {b: [-260, -190, 0, 62, -190, -130], c: LAB2.foamB},
  {b: [-170, -110, 0, 48, -205, -150], c: LAB2.foamY},
  {b: [190, 255, 0, 56, 150, 205], c: LAB2.foamR},
  {b: [270, 330, 0, 44, 140, 190], c: '#9ED0B0'},
];
const curbRow = (z: number, x0: number, x1: number, k0: number) => {
  const out: {b: [number, number, number, number, number, number]; c: string}[] = [];
  let k = k0;
  for (let x = x0; x < x1; x += 26, k++) out.push({b: [x, x + 20, 0, 6, z - 3.5, z + 3.5], c: k % 2 ? '#F4F1EA' : z < 0 ? LAB2.foamB : LAB2.foamR});
  return out;
};
const CURBS = [...curbRow(-102, -320, 330, 0), ...curbRow(98, -320, 330, 1)];

export const C1Scene: React.FC<{f: number; id: string}> = ({f, id}) => {
  const v = c1View(f);
  const med = c1Medic(f), obs = c1Obs(f);
  const shadowBox = (b: [number, number, number, number, number, number], i: number) => {
    const q = [P(v, [b[0] + 6, 0, b[4] + 4]), P(v, [b[1] + 10, 0, b[4] + 4]), P(v, [b[1] + 10, 0, b[5] + 9]), P(v, [b[0] + 6, 0, b[5] + 9])];
    return <path key={`s${i}`} d={`M${q.map((p) => `${f2(p[0])},${f2(p[1])}`).join(' L')} Z`} fill={R2.shadow} opacity={0.1} />;
  };
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Beyond2D id={`${id}-lb`} lipY={150} k={1.15} dx={-0.6 * (v.ox - c1View(C1_FROM).ox)} />
      <TrayPlane v={v} c={[20, 0, 0]} far={farForLip(v, [20, 0, 0], 150)} />
      {PROPS.map((p, i) => shadowBox(p.b, i))}
      {CURBS.map((c, i) => (
        <Box2D key={`c${i}`} id={`${id}-c${i}`} v={v} b={c.b} color={c.c} />
      ))}
      {PROPS.filter((p) => p.b[4] < 0).map((p, i) => (
        <Box2D key={`pb${i}`} id={`${id}-pb${i}`} v={v} b={p.b} color={p.c} />
      ))}
      <Target2D id={`${id}-tg`} v={v} face={330} dir={1} />
      <Roach2D pose={med} v={v} o={{id: `${id}-m`, gear: <Gear2D id={`${id}-mg`} v={v} f={med.frame} g={{kind: 'injector'}} />}} />
      <Roach2D pose={obs} v={v} o={{id: `${id}-o`, tint: OBS_TINT, gear: <Gear2D id={`${id}-og`} v={v} f={obs.frame} g={{kind: 'camera'}} />}} />
      {PROPS.filter((p) => p.b[4] > 0).map((p, i) => (
        <Box2D key={`pf${i}`} id={`${id}-pf${i}`} v={v} b={p.b} color={p.c} />
      ))}
    </svg>
  );
};

export const C1: React.FC<ShotProps> = ({f}) => <C1Scene f={f} id={`c1-${f}`} />;
void clamp;
void ([0, 0, 0] as V3);
