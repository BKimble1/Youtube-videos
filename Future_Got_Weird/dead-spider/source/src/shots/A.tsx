// Shot A (0.00 - 4.10): the hook. Frame 0 is already mid-experiment: a curled, dead wolf spider on a white specimen
// pad, the needle just above the front body section and coming down. Contact by 0.42 s, a short insertion, the glue
// bead. On "into the dead spider" the operator's thumb starts down on the plunger and the camera eases back and up the
// tube to reveal the syringe and the gloved hand; the spider stays large in the lower half. On "and its legs opened"
// all eight legs unfold together (a few frames apart) as the pressure arrives, and the camera widens with them.
import React from 'react';
import {ss5} from '../lib';
import {BenchTop, FlatShadow, LabWallFar, needleItems, Pad, standItems, syringeClampItems, syringeGeo, syringeItems, tube} from '../apparatus';
import {Item} from '../draw3';
import {LOOK_A, spiderItems} from '../SpiderDraw';
import {add3, Cam3, lerpCam, norm3, proj, sub3, unproj, V3} from '../three';
import {A_GLUE, A_NEEDLE, A_PLUNGER, A_YAW, B_SYR_AXIS, B_SYR_TIP, BENCH_BACK, BENCH_Z, gripperPose, needleEntry, tubeRoute, WALL_Y} from '../world';
import {PressHand, Scene} from './common';

// the camera aims at the spider and places it with the lens shift (cy), so the view above it can open up without
// tipping the spider out of the frame
const CAM0: Cam3 = {eye: [-11, -26, 19], target: [-0.3, 0.3, 3.4], f: 1380, cy: 1060};
const CAM1: Cam3 = {eye: [-9, -27, 16.5], target: [0, 0, 3.6], f: 1150, cy: 1200};
const CAM2: Cam3 = {eye: [-10, -29.5, 17.5], target: [0, 0, 3.4], f: 1110, cy: 1190};
export const camA = (t: number): Cam3 => {
  const u = ss5(t, 0.95, 2.25);
  const c = lerpCam(CAM0, CAM1, u);
  return lerpCam(c, CAM2, ss5(t, 2.3, 3.9));
};

/** the syringe at A: held tip-down above and behind the specimen */
export const A_SYR_TIP: V3 = B_SYR_TIP;
export const A_SYR_AXIS: V3 = B_SYR_AXIS;

export const ShotA: React.FC<{t: number}> = ({t}) => {
  const cam = camA(t);
  const P = gripperPose(t, 'A');
  const entry = needleEntry(P);
  const rig = {entry, tipAbove: A_NEEDLE(t), glue: A_GLUE(t), armDir: 18, armLen: 26, postFoot: BENCH_Z};
  const hubTop = add3(entry, [0, 0, A_NEEDLE(t) + 11 + 7]);
  const g = syringeGeo(A_SYR_TIP, A_SYR_AXIS, A_PLUNGER(t));
  const tubePts = tubeRoute(hubTop, BENCH_Z);
  return (
    <Scene
      id={`A${Math.round(t * 30)}`}
      cam={cam}
      back={(B) => (
        <>
          <LabWallFar B={B} id="Aw" wallY={WALL_Y} blur={10} />
          <BenchTop B={B} z={BENCH_Z} back={BENCH_BACK} />
        </>
      )}
      floor={(B) => (
        <>
          <Pad B={B} c={[0, 0, 0]} half={24} th={3} />
          <FlatShadow B={B} c={[P.pos[0] - 1.2, P.pos[1] + 0.6, 0]} rx={6.5 + 3 * P.e[0]} ry={5 + 2.5 * P.e[0]} alpha={0.32} yaw={A_YAW} />
          <FlatShadow B={B} c={[25, 8, 0]} rx={4} ry={4} alpha={0.25} />
        </>
      )}
      items={(B) => {
        const it: Item[] = [];
        it.push(...spiderItems(B, P, LOOK_A, {id: 'sa'}));
        it.push(...needleItems(B, rig));
        it.push(tube(B, tubePts, {z: proj(B, hubTop).z + 40}));
        it.push(...syringeItems(B, A_SYR_TIP, A_SYR_AXIS, A_PLUNGER(t)));
        it.push(...syringeClampItems(B, g.at(60), A_SYR_AXIS, [-0.83, 0.55, 0], 36));
        it.push(...standItems(B, [A_SYR_TIP[0], A_SYR_TIP[1], BENCH_Z], 300));
        return it;
      }}
      over={(B) => {
        const Tr = proj(B, g.thumb), N = proj(B, g.nozzle);
        return <PressHand id="Ah" rest={Tr} down={{x: N.x - Tr.x, y: N.y - Tr.y}} L={185 * Tr.s} lift={1 - Math.min(1, A_PLUNGER(t) * 8)} />;
      }}
    />
  );
};
