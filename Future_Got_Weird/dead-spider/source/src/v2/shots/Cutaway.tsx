// BEAT B (7.80 - 13.48): "You see, spiders use fluid pressure to straighten their legs. And when they die, that
// pressure disappears."
// A clean vector cutaway of a living spider (a pale shell with the blood-like hemolymph showing), not the specimen.
// B1 (7.80): the whole spider, standing; the camera dives in to the femur-patella joint of one leg. The leg bends (its
//   flexor muscle pulls), then on "fluid pressure" the body muscles squeeze the fluid space, the fluid brightens and
//   runs down the leg, the joint membrane swells and on "straighten" the leg straightens. Only that leg moves.
// B2 (10.96): a new angle on the whole spider. On "die" the flow stops and the fluid dulls; on "pressure disappears"
//   the fluid thins, the membranes go slack and every leg curls inward: the same motion run backwards.
import React from 'react';
import {mix} from '../../dc/color';
import {Item} from '../../draw3';
import {clamp, keyS, lerp, ss, ss5} from '../../lib';
import {LOOK_CUT, spiderItems} from '../../SpiderDraw';
import {legLocal, SpiderPose, toWorld} from '../../spider';
import {basis, lerp3, lerpOrbit, Orbit, orbitCam, proj, V3} from '../../three';
import {C_LEG, FLUID, JointDetail} from '../../shots/C';
import {Scene} from '../../shots/common';
import {AIR, legTracks, SpringParams} from '../spring';
import {CUT, H_YAW, TM} from '../world2';

const FLUID_DIM = '#8FA9B1';
const BODY: V3 = [0, 0, 3.6];
const T_CURL = TM.disappears + 0.05;
const DEATH: SpringParams = {open: [1.4, 0.9], close: [1.3, 0.8]};
const focusCmd = (t: number) => keyS(t, [[0, 1], [8.3, 1], [8.95, 0.26], [TM.straighten - 0.12, 0.26], [TM.straighten + 0.05, 1]]);
const FOCUS = legTracks(focusCmd, AIR, CUT.leg - 0.2, CUT.body + 0.4);
const DIE = legTracks((t) => keyS(t, [[0, 1], [T_CURL, 1], [T_CURL + 0.3, 0]]), DEATH, CUT.body - 0.2, CUT.lab + 0.2);
export const cutPose = (t: number): SpiderPose => {
  const f = FOCUS(t), d = DIE(t);
  return {pos: BODY, yaw: H_YAW, e: d.map((x, i) => (i === C_LEG && t < CUT.body ? f[i] : x))};
};
/** pressure (inflates the joint membrane), life (flow and colour), squeeze of the body's fluid space */
const pressure = (t: number) => keyS(t, [[0, 0.62], [8.3, 0.62], [8.95, 0.34], [TM.pressure1 - 0.15, 0.34], [TM.pressure1 + 0.3, 1], [TM.pressure2 - 0.1, 1], [TM.pressure2 + 0.55, 0.12]]);
const alive = (t: number) => 1 - ss(t, TM.die - 0.1, TM.die + 0.4);
const squeeze = (t: number) => keyS(t, [[0, 0.2], [TM.fluid - 0.1, 0.2], [TM.pressure1 + 0.15, 1], [TM.legs2, 0.72], [TM.die - 0.1, 0.72], [TM.die + 0.45, 0]]);

const jointAt = (e: number) => toWorld({pos: BODY, yaw: H_YAW, e: Array(8).fill(e)}, legLocal(C_LEG, e)[2]);
const J_MID = lerp3(jointAt(1), jointAt(0.26), 0.5);
const K1: Orbit = {target: [-1.5, 0, 3.2], az: -4, el: 22, d: 44, f: 1650, cy: 940};
const K2: Orbit = {target: J_MID, az: 6, el: 15, d: 24, f: 3600, cy: 930};
const K3: Orbit = {...K2, az: 14, el: 11, d: 22.5};
const K4: Orbit = {target: [-1.6, 0, 2.4], az: -54, el: 30, d: 40, f: 1750, cy: 930};
const K4b: Orbit = {...K4, az: -44, el: 25, d: 35};
export const camB = (t: number) => {
  if (t < CUT.body) {
    const a = lerpOrbit(K1, K2, ss5(t, CUT.leg + 0.12, TM.fluid - 0.05));
    return orbitCam(lerpOrbit(a, K3, ss5(t, TM.fluid, CUT.body)));
  }
  return orbitCam(lerpOrbit(K4, K4b, ss5(t, CUT.body, CUT.lab)));
};

export const Cutaway: React.FC<{t: number}> = ({t}) => {
  const cam = camB(t);
  const P = cutPose(t);
  const pr = pressure(t);
  const live = alive(t);
  const B0 = basis(cam);
  const zoom = proj(B0, toWorld(P, legLocal(C_LEG, P.e[C_LEG])[2])).s;
  const detail = clamp((zoom - 60) / 60);
  const fluid = mix(FLUID_DIM, FLUID, live);
  const flowRate = 1.6 + 2.2 * squeeze(t);
  const focus = t < CUT.body ? detail : 0.35;
  return (
    <Scene
      id={`B${Math.round(t * 30)}`}
      cam={cam}
      bg="#DCE9EE"
      back={() => (
        <g>
          <defs>
            <radialGradient id="bbg" cx="540" cy="900" r="1250" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={t < CUT.body ? '#EEF5F8' : '#F1F4F2'} />
              <stop offset="1" stopColor={t < CUT.body ? '#C6DAE3' : '#CBD6D6'} />
            </radialGradient>
          </defs>
          <rect width={1080} height={1920} fill="url(#bbg)" />
        </g>
      )}
      items={(B) => {
        const it: Item[] = [];
        it.push(...spiderItems(B, P, LOOK_CUT, {id: 'sb', focusLeg: C_LEG, focus, cut: {fluid, core: lerp(0.45, 0.95, pr), flow: live > 0.05 ? (t - CUT.leg) * flowRate * live : undefined, squeeze: squeeze(t), dim: 1 - live}}));
        return it;
      }}
      over={(B) => <JointDetail B={B} P={P} pr={pr} live={live} op={detail} />}
    />
  );
};
