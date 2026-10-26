// Station E (19.83 - 23.86): a separate demonstration, the load test. It opens on the rising motion carried over from
// D's lift: close on the closed legs round a small polymer weight on a balance pan ("into a claw"); the camera draws
// back to the balance as the support lifts. The weight clears the pan on "lift", the shadow under it opens out, and the
// balance reading falls from the weight's 43.6 mg to zero (Yap et al. 2022: the gripper, 33.5 mg, lifted 1.3 times its
// own mass). The support arm and post stay in view: the gripper is carried, it does not lift itself.
import React from 'react';
import {Balance, BenchTop, FlatShadow, LabWallFar, needleItems, tube, weightItems} from '../apparatus';
import {Item} from '../draw3';
import {clamp, ss5} from '../lib';
import {LOOK_A, spiderItems} from '../SpiderDraw';
import {add3, lerpOrbit, Orbit, orbitCam, proj} from '../three';
import {BENCH_BACK, CUT, E_POS, E_READ, E_WEIGHT_C, E_X, E_YAW, E_Z, gripperPose, needleEntry, PAN_TOP, TM, tubeRoute, WALL_Y, WEIGHT} from '../world';
import {Scene} from './common';

const O_E1: Orbit = {target: [E_X, 0, PAN_TOP + 4.2], az: 18, el: 5, d: 26, f: 1400, cy: 960};
const O_E1b: Orbit = {...O_E1, target: [E_X, 0, PAN_TOP + 4.7], d: 25};
const O_E2: Orbit = {target: [E_X + 4.5, 4, PAN_TOP + 2.2], az: 14, el: 8, d: 46, f: 1320, cy: 1000};

export const camE = (t: number) => {
  const a = lerpOrbit(O_E1, O_E1b, ss5(t, CUT.load, 20.7));
  const o = lerpOrbit(a, O_E2, ss5(t, 20.55, TM.claw + 0.25));
  // the camera rises gently with the load once it is off the pan
  return orbitCam({...o, target: add3(o.target, [0, 0, 0.12 * (E_Z(t) - E_Z(0))])});
};

export const ShotE: React.FC<{t: number}> = ({t}) => {
  const cam = camE(t);
  const P = gripperPose(t, 'E');
  const entry = needleEntry(P);
  const rig = {entry, tipAbove: -0.9, glue: 1, armDir: 152, armLen: 30, postFoot: 0};
  const wc = E_WEIGHT_C(t);
  const rise = wc[2] - (PAN_TOP + WEIGHT.h);
  const hubTop = add3(entry, [0, 0, -0.9 + 18]);
  return (
    <Scene
      id={`E${Math.round(t * 30)}`}
      cam={cam}
      back={(B) => (
        <>
          <LabWallFar B={B} id="Ew" wallY={WALL_Y} blur={10} />
          <BenchTop B={B} z={0} back={BENCH_BACK} />
          <Balance B={B} x={E_X} reading={E_READ(t)} id="bal" />
        </>
      )}
      floor={(B) => (
        <>
          <FlatShadow B={B} c={[wc[0] + 0.3, wc[1] + 0.3, PAN_TOP]} rx={WEIGHT.r * (1.05 + 0.25 * clamp(rise / 4))} ry={WEIGHT.r * (0.95 + 0.25 * clamp(rise / 4))} alpha={0.5 * (1 - 0.55 * clamp(rise / 4))} />
          <FlatShadow B={B} c={[E_POS(t)[0] - 1.5, 0, PAN_TOP]} rx={6.5} ry={5} alpha={0.12} yaw={E_YAW} />
        </>
      )}
      items={(B) => {
        const it: Item[] = [];
        it.push(...spiderItems(B, P, LOOK_A, {id: 'se'}));
        it.push(...needleItems(B, rig));
        it.push(...weightItems(B, wc));
        const tb = tubeRoute(hubTop, 0);
        it.push(tube(B, tb, {z: proj(B, tb[1]).z + 25}));
        return it;
      }}
    />
  );
};
