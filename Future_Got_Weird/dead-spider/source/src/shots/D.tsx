// Station D (12.17 - 19.83): the experiment proper, on the specimen that opened in shot A.
//  D1 12.17  match from the cutaway's curled silhouette to the real, curled specimen on its needle above the block
//  D2 12.98  the operator station: he presses the plunger ("push air"); the camera follows the tube from the syringe
//            back along the bench to the needle hub ("through the needle") and settles low beside the specimen:
//            the legs spread open over the block ("spread them open again"), then the support lowers it so the open
//            legs surround the block
//  D3 16.73  the syringe: his finger comes off and the plunger rises ("released the pressure")
//  D4 17.40  side view at bench level: with the air gone the legs close onto the block ("snapped shut"), the feet
//            settle on its faces, and the support lifts gripper and block together; the gap under the block grows
import React from 'react';
import {BenchTop, blockItems, FlatShadow, LabWallFar, needleItems, standItems, syringeClampItems, syringeGeo, syringeItems, tube} from '../apparatus';
import {INK} from '../dc/ink';
import {Item} from '../draw3';
import {clamp, keyS, ss, ss5} from '../lib';
import {LOOK_A, spiderItems} from '../SpiderDraw';
import {add3, basis, Cam3, len3, lerp3, lerpOrbit, mul3, norm3, Orbit, orbitCam, proj, sub3, V3} from '../three';
import {B_PLUNGER, B_SYR_AXIS, B_SYR_TIP, BENCH_BACK, BLOCK, CUT, D_BLOCK_LIFT, D_POS, D_YAW, gripperPose, needleEntry, TM, tubeRoute, WALL_Y} from '../world';
import {PressHand, Scene} from './common';
import {Operator} from './Operator';

const hubTopAt = (t: number) => add3(needleEntry(gripperPose(t, 'D')), [0, 0, -0.9 + 11 + 7]);
export const dTube = (t: number) => tubeRoute(hubTopAt(t), 0);
/** a point at fraction u along a polyline (by length) */
const along = (pts: V3[], u: number): V3 => {
  const seg = pts.slice(1).map((p, i) => len3(sub3(p, pts[i])));
  const tot = seg.reduce((a, b) => a + b, 0);
  let d = clamp(u) * tot;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) return lerp3(pts[i], pts[i + 1], d / seg[i]);
    d -= seg[i];
  }
  return pts[pts.length - 1];
};

/** where the operator stands and where his hands go */
const OP_HIP: V3 = [B_SYR_TIP[0] + 68, 1010, 70];
const opRest: V3 = [B_SYR_TIP[0] + 115, 760, 4];

// ------------------------------------------------------------------ cameras
const O_D1: Orbit = {target: add3(D_POS(CUT.specimenD), [0, 0, -0.3]), az: 4, el: 12, d: 44, f: 1650, cy: 900};
const O_D1b: Orbit = {...O_D1, d: 41};
const O_OP: Orbit = {target: [B_SYR_TIP[0] + 10, 760, 300], az: 4, el: 7, d: 1180, f: 1330, cy: 930};
const O_OPb: Orbit = {...O_OP, d: 1120};
const O_HUB = (t: number): Orbit => ({target: hubTopAt(t), az: -24, el: 16, d: 70, f: 1300, cy: 900});
const O_LOW: Orbit = {target: [BLOCK.c[0], 0, 7.6], az: -32, el: 3.5, d: 38, f: 1320, cy: 1060};
const O_LOWb: Orbit = {...O_LOW, d: 35, target: [BLOCK.c[0], 0, 5.6]};
const O_INS: Orbit = {target: add3(B_SYR_TIP, [0, 0, 165]), az: -18, el: 10, d: 250, f: 1500, cy: 1040};
const O_SIDE: Orbit = {target: [BLOCK.c[0] + 0.5, 0, 4.6], az: 12, el: 1.2, d: 34, f: 1420, cy: 1080};

export const camD = (t: number): Cam3 => {
  if (t < CUT.operator) return orbitCam(lerpOrbit(O_D1, O_D1b, ss5(t, CUT.specimenD, CUT.operator)));
  if (t < CUT.insert) {
    const follow0 = TM.push + 0.42, follow1 = TM.needle2 + 0.4, low1 = TM.spread + 0.42;
    if (t < follow0) return orbitCam(lerpOrbit(O_OP, O_OPb, ss5(t, CUT.operator, follow0)));
    if (t < follow1) {
      // along the tube from the syringe back to the hub: the aim slides along the tube while the eye closes in on the
      // hub from the front at an even zoom rate (it never passes near the specimen)
      const u = ss5(t, follow0, follow1);
      const hub = hubTopAt(t);
      const e0 = orbitCam(O_OPb).eye, e1 = orbitCam(O_HUB(t)).eye;
      const d0 = len3(sub3(e0, hub)), d1 = len3(sub3(e1, hub));
      const dir = norm3(lerp3(norm3(sub3(e0, hub)), norm3(sub3(e1, hub)), u));
      const d = d0 * Math.pow(d1 / d0, u);
      return {eye: add3(hub, mul3(dir, d)), target: lerp3(O_OPb.target, hub, ss5(u, 0, 0.8)), f: O_OPb.f * Math.pow(O_HUB(t).f / O_OPb.f, u), cy: 930 + (900 - 930) * u};
    }
    if (t < low1) return orbitCam(lerpOrbit(O_HUB(t), O_LOW, ss5(t, follow1, low1)));
    return orbitCam(lerpOrbit(O_LOW, O_LOWb, ss5(t, TM.again - 0.3, CUT.insert)));
  }
  if (t < CUT.side) return orbitCam({...O_INS, d: O_INS.d * (1 - 0.05 * ss5(t, CUT.insert, CUT.side))});
  return orbitCam({...O_SIDE, target: add3(O_SIDE.target, [0, 0, 0.55 * D_BLOCK_LIFT(t)]), d: O_SIDE.d * (1 - 0.06 * ss5(t, CUT.side, CUT.load))});
};

export const ShotD: React.FC<{t: number}> = ({t}) => {
  const cam = camD(t);
  const P = gripperPose(t, 'D');
  const entry = needleEntry(P);
  const rig = {entry, tipAbove: -0.9, glue: 1, armDir: 118, armLen: 28, postFoot: 0};
  const lift = D_BLOCK_LIFT(t);
  const blockC = add3(BLOCK.c, [0, 0, lift]);
  const plunger = B_PLUNGER(t);
  const g = syringeGeo(B_SYR_TIP, B_SYR_AXIS, plunger);
  const insert = t >= CUT.insert && t < CUT.side;
  const wide = t >= CUT.operator && t < CUT.insert;
  const fingerLift = ss(t, CUT.insert + 0.1, CUT.insert + 0.3);
  const B0 = basis(cam);
  const showOp = wide && proj(B0, OP_HIP).s < 2.2;
  // depth of field: the operator softens once the camera is down at the specimen
  const opBlur = clamp((proj(B0, cam.target).s / Math.max(0.05, proj(B0, OP_HIP).s) - 3) / 4, 0, 1) * 7;
  return (
    <Scene
      id={`D${Math.round(t * 30)}`}
      cam={cam}
      back={(B) => (
        <>
          <LabWallFar B={B} id="Dw" wallY={WALL_Y} blur={clamp(proj(B, [0, WALL_Y, 300]).s * 4, 0.5, 10)} />
          {showOp && (
            <g filter={opBlur > 0.3 ? 'url(#opb)' : undefined}>
              <defs>
                <filter id="opb" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation={opBlur.toFixed(2)} />
                </filter>
              </defs>
              <Operator B={B} id="op" hip={OP_HIP} press={g.thumb} pressAng={118} restR={opRest} />
            </g>
          )}
          <BenchTop B={B} z={0} back={BENCH_BACK} />
        </>
      )}
      floor={(B) => (
        <>
          <FlatShadow B={B} c={[BLOCK.c[0], BLOCK.c[1], 0]} rx={3.6 + 0.2 * lift} ry={3.4 + 0.2 * lift} alpha={0.42 * (1 - clamp(lift / 8))} yaw={BLOCK.yaw} />
          <FlatShadow B={B} c={[P.pos[0] - 1.5, P.pos[1], 0]} rx={7 + 3 * P.e[0]} ry={5.5 + 2 * P.e[0]} alpha={0.22 * (1 - clamp((P.pos[2] - 6) / 14))} yaw={D_YAW} />
          <FlatShadow B={B} c={[B_SYR_TIP[0] - 30, B_SYR_TIP[1] + 20, 0]} rx={60} ry={42} alpha={0.2} />
        </>
      )}
      items={(B) => {
        const it: Item[] = [];
        it.push(...spiderItems(B, P, LOOK_A, {id: 'sd'}));
        it.push(...needleItems(B, rig));
        it.push(...blockItems(B, blockC, BLOCK.h, BLOCK.yaw));
        const tb = dTube(t);
        it.push(tube(B, tb, {z: proj(B, tb[1]).z + 25}));
        it.push(...syringeItems(B, B_SYR_TIP, B_SYR_AXIS, plunger));
        it.push(...syringeClampItems(B, g.at(60), B_SYR_AXIS, [-0.83, 0.55, 0], 36));
        it.push(...standItems(B, [B_SYR_TIP[0], B_SYR_TIP[1], 0], 300));
        return it;
      }}
      over={(B) => {
        if (!insert) return null;
        const Tr = proj(B, g.thumb), N = proj(B, g.nozzle);
        return <PressHand id="Dh" rest={Tr} down={{x: N.x - Tr.x, y: N.y - Tr.y}} L={185 * Tr.s} lift={fingerLift} />;
      }}
    />
  );
};
void keyS;
void INK;
