// V3 BEAT B (7.80 - 13.48): "You see, spiders use fluid pressure to straighten their legs. And when they die, that
// pressure disappears."
// A living wolf spider on a leaf, one front leg raised and bent. One continuous camera path through its anatomy:
//  7.80  the whole spider; the camera closes in on the raised leg's femur-patella joint
//  8.70  the leg opens into a section: the blue hemolymph inside, the joint's flexible membrane, its flexor muscle
//  9.20  "fluid pressure": the fluid brightens and runs down the leg, the membrane swells
//  9.92  "straighten": the joint straightens and the leg comes down to the leaf; the camera rides along it
// 11.00  "and when they die": back along the leg toward the body, now sectioned too; the flow stops on "die"
// 12.24  "pressure disappears": the fluid thins, the membranes go slack, every leg folds and the body sinks
// 12.90  out to the whole spider, curled on the leaf, the section closing back to the outside
import React from 'react';
import {mix} from '../../dc/color';
import {Item} from '../../draw3';
import {clamp, keyS, lerp, ss, ss5} from '../../lib';
import {LOOK_A, spiderItems} from '../../SpiderDraw';
import {legLocal, SpiderPose, toWorld} from '../../spider';
import {lerp3, lerpOrbit, Orbit, orbitCam, V3} from '../../three';
import {JointDetail} from '../../shots/C';
import {Scene} from '../../shots/common';
import {LeafGround} from '../env3';
import {B_ALIVE, B_GROUND, B_LEG, B_PRESS, B_SQUEEZE, CUT, leafPose, TM} from '../world3';
import {GroundShadow, lifeLook} from './Nature3';

export const HEMO = '#5EAFC4';
const HEMO_DIM = '#9BAAAE';
const jointW = (P: SpiderPose, k: number): V3 => toWorld(P, legLocal(B_LEG, P.e[B_LEG], P.dth?.[B_LEG] ?? 0)[k]);
const L1: Orbit = {target: [-0.6, -0.8, B_GROUND + 2.6], az: 50, el: 16, d: 92, f: 5400, cy: 1000};
const L2 = (P: SpiderPose): Orbit => ({target: jointW(P, 2), az: 66, el: 12, d: 32, f: 5400, cy: 960});
const L3 = (P: SpiderPose, u: number): Orbit => ({target: lerp3(jointW(P, 2), jointW(P, 3), u), az: 74, el: 14, d: 36, f: 5400, cy: 960});
const L4 = (P: SpiderPose): Orbit => ({target: lerp3(P.pos, jointW(P, 2), 0.35), az: 40, el: 26, d: 50, f: 5400, cy: 960});
const L5 = (P: SpiderPose): Orbit => ({target: [-1.2, -0.4, B_GROUND + 1.6], az: 24, el: 36, d: 90, f: 5400, cy: 980});
export const camLeaf = (t: number) => {
  const P = leafPose(t);
  let o: Orbit;
  if (t < 9.6) o = lerpOrbit(L1, L2(P), ss5(t, CUT.leaf, 8.75));
  else if (t < 10.96) o = lerpOrbit(L2(P), L3(P, ss5(t, TM.straighten, 10.8)), ss5(t, 9.6, 10.2));
  else if (t < 12.85) o = lerpOrbit(L3(P, 1), L4(P), ss5(t, 10.96, 11.9));
  else o = lerpOrbit(L4(P), L5(P), ss5(t, 12.85, 13.48));
  return orbitCam(o);
};
/** how far into the section the picture is (0 outside .. 1) */
const SEC = (t: number) => ss(t, 8.55, 8.95) * (1 - ss(t, 12.95, 13.4));

export const Leaf3: React.FC<{t: number}> = ({t}) => {
  const cam = camLeaf(t);
  const P = leafPose(t);
  const id = `B${Math.round(t * 30)}`;
  const sec = SEC(t);
  const live = B_ALIVE(t);
  const pr = B_PRESS(t);
  const fluid = mix(HEMO_DIM, HEMO, live);
  const bodySec = sec * ss(t, 10.9, 11.4);
  const flow = live > 0.05 && t > TM.fluid - 0.1 ? (t - CUT.leaf) * (1.6 + 2.2 * B_SQUEEZE(t)) * live : undefined;
  return (
    <Scene
      id={id}
      cam={cam}
      bg="#B9D3B0"
      back={(B) => <LeafGround B={B} id={`${id}l`} z={B_GROUND} />}
      floor={(B) => (
        <>
          <GroundShadow B={B} P={P} z={B_GROUND} id={id} />
          {sec > 0.01 && <rect width={1080} height={1920} fill="#0F2420" opacity={0.38 * sec} />}
        </>
      )}
      items={(B) => {
        const it: Item[] = [];
        it.push(...spiderItems(B, P, lifeLook(lerp(1, 0.55, 1 - live)), {id: 'sb', cut: sec > 0.01 ? {fluid, core: lerp(0.32, 0.62, pr) * sec, flow, soft: true, squeeze: B_SQUEEZE(t), dim: 1 - live, chamber: bodySec} : undefined, cutLegs: t < 10.9 ? [B_LEG] : undefined, cutBody: bodySec > 0.01}));
        return it;
      }}
      over={(B) => <JointDetail B={B} P={P} pr={pr} live={live} op={clamp(sec * (1 - ss(t, 11.6, 12.0)) + sec * ss(t, 12.0, 12.2) * 0.7)} leg={B_LEG} color={fluid} />}
    />
  );
};
void keyS;
void LOOK_A;
