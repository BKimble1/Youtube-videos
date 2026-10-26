// Station F (23.86 - 30.00): "They even made it reach down... and pick up another spider."
// A low camera behind the rim of a shallow tray: the support lowers the gripper into view and air opens its legs on the
// way down (the support does the reaching; the specimen does not move itself). On "and pick up" the camera rises over
// the rim and looks down; "another spider" reveals the second specimen lying curled in the tray: a separate, inert wolf
// spider (paler, so the two bodies stay distinct). The gripper settles round its body, the air is let out, the legs
// close on it, and the support lifts both clear of the tray. The pickup completes and holds.
import React from 'react';
import {BenchTop, FlatShadow, LabWallFar, needleItems, TrayFloor, trayRimItems, tube} from '../apparatus';
import {Item} from '../draw3';
import {clamp, ss5} from '../lib';
import {LOOK_A, LOOK_B, spiderItems} from '../SpiderDraw';
import {add3, lerpOrbit, Orbit, orbitCam, proj} from '../three';
import {BENCH_BACK, CUT, F_POS, F_X, F_YAW, F_Z, gripperPose, needleEntry, S2_AT, S2_LIFT, TM, TRAY_FLOOR, tubeRoute, WALL_Y} from '../world';
import {Scene} from './common';

export const TRAY_HALF: [number, number] = [19, 15];
export const RIM_H = 5.6;
const O_F1: Orbit = {target: [F_X, 0, 15.5], az: -8, el: -2, d: 60, f: 1320, cy: 900};
const O_F1b: Orbit = {...O_F1, target: [F_X, 0, 12.5], d: 57};
const O_F2: Orbit = {target: [F_X - 0.5, 1, 7.6], az: -14, el: 30, d: 44, f: 1350, cy: 1000};
const O_F3: Orbit = {target: [F_X - 0.5, 1, 11.5], az: -24, el: 8, d: 36, f: 1350, cy: 1020};

export const camF = (t: number) => {
  const a = lerpOrbit(O_F1, O_F1b, ss5(t, CUT.tray, TM.and4));
  const b = lerpOrbit(a, O_F2, ss5(t, TM.and4 - 0.15, TM.another + 0.15));
  return orbitCam(lerpOrbit(b, O_F3, ss5(t, TM.spider4 + 0.2, 29.3)));
};

export const ShotF: React.FC<{t: number}> = ({t}) => {
  const cam = camF(t);
  const P = gripperPose(t, 'F');
  const S2 = S2_AT(t);
  const entry = needleEntry(P);
  const rig = {entry, tipAbove: -0.9, glue: 1, armDir: 104, armLen: 32, postFoot: 0};
  const hubTop = add3(entry, [0, 0, -0.9 + 18]);
  const lift = S2_LIFT(t);
  return (
    <Scene
      id={`F${Math.round(t * 30)}`}
      cam={cam}
      back={(B) => (
        <>
          <LabWallFar B={B} id="Fw" wallY={WALL_Y} blur={10} />
          <BenchTop B={B} z={0} back={BENCH_BACK} />
        </>
      )}
      floor={(B) => (
        <>
          <TrayFloor B={B} x={F_X} floor={TRAY_FLOOR} half={TRAY_HALF} />
          <FlatShadow B={B} c={[S2.pos[0] - 1.6, S2.pos[1] + 0.4, TRAY_FLOOR]} rx={6.2 + 0.6 * clamp(lift / 5)} ry={4.8} alpha={0.36 * (1 - 0.5 * clamp(lift / 6))} yaw={S2.yaw} />
          <FlatShadow B={B} c={[F_POS(t)[0] + 1.5, 0.4, TRAY_FLOOR]} rx={8} ry={6} alpha={0.2 * (1 - clamp((F_Z(t) - 8) / 14))} yaw={F_YAW} />
        </>
      )}
      items={(B) => {
        const it: Item[] = [];
        it.push(...spiderItems(B, S2, LOOK_B, {id: 's2'}));
        it.push(...spiderItems(B, P, LOOK_A, {id: 'sf'}));
        it.push(...needleItems(B, rig));
        it.push(...trayRimItems(B, F_X, TRAY_FLOOR, TRAY_HALF, RIM_H));
        const tb = tubeRoute(hubTop, 0);
        it.push(tube(B, tb, {z: proj(B, tb[1]).z + 25}));
        return it;
      }}
    />
  );
};
