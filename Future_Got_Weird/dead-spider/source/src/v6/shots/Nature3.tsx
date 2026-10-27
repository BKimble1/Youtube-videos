// V3 BEAT A (4.52 - 7.80): "Because when a spider dies, all its legs curl inward."
// A match on the open silhouette: the same camera and pose as the hook's last frame, but the needle, syringe and mat
// are gone and a living wolf spider stands on a weathered stone, its feet on the rock. One continuous camera move
// rises and turns round it. On "dies" its colour drains; on "curl inward" the pressure that held the legs out is gone:
// each leg folds at its joints, the feet sliding in over the rock, and the body sinks onto the stone.
import React from 'react';
import {mix} from '../../dc/color';
import {Item} from '../../draw3';
import {clamp, ss5} from '../../lib';
import {LOOK_A, SpiderLook, spiderItems} from '../../SpiderDraw';
import {SpiderPose} from '../../spider';
import {Basis, lerpOrbit, Orbit, orbitCam, proj, toOrbit} from '../../three';
import {Scene} from '../../shots/common';
import {RockGround} from '../env3';
import {A_GROUND, A_LIFE, CUT, natPose, TM} from '../world3';
import {camHook3} from './Hook3';

const N1: Orbit = {target: [-1.8, 0, A_GROUND + 2.2], az: 6, el: 22, d: 84, f: 5400, cy: 1000};
const N2: Orbit = {target: [-1.2, 0, A_GROUND + 0.9], az: 28, el: 15, d: 62, f: 5400, cy: 1000};
export const camNat = (t: number) => {
  const o0 = toOrbit(camHook3(CUT.nature));
  const a = lerpOrbit(o0, N1, ss5(t, CUT.nature, TM.curl - 0.4));
  // a slow push down with the body as it sinks
  return orbitCam(lerpOrbit(a, N2, ss5(t, TM.curl - 0.5, CUT.leaf + 0.2)));
};
const DEAD_LOOK: SpiderLook = {leg: '#7E6E5E', legBand: '#4C4036', cara: '#4A3E35', caraBand: '#9C8C78', abd: '#655648', heart: '#3C3129', spot: '#B0A08A', eye: '#1A1F24'};
export const lifeLook = (life: number): SpiderLook => {
  const o = {} as SpiderLook;
  (Object.keys(LOOK_A) as (keyof SpiderLook)[]).forEach((k) => (o[k] = mix(DEAD_LOOK[k], LOOK_A[k], life)));
  return o;
};
export const GroundShadow: React.FC<{B: Basis; P: SpiderPose; z: number; id: string}> = ({B, P, z, id}) => {
  const c = proj(B, [P.pos[0] - 1.6, P.pos[1] + 0.5, z]);
  const k = clamp(P.e.reduce((a, b) => a + b, 0) / 8);
  const h = P.pos[2] - z;
  return (
    <g opacity={0.55 - 0.15 * clamp((h - 2) / 3)}>
      <defs>
        <radialGradient id={`${id}sh`}>
          <stop offset="0" stopColor="#2A2016" stopOpacity={0.75} />
          <stop offset="1" stopColor="#2A2016" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} rx={((5 + 5.5 * k) * c.s).toFixed(1)} ry={((3.8 + 4 * k) * c.s).toFixed(1)} fill={`url(#${id}sh)`} />
    </g>
  );
};

export const Nature3: React.FC<{t: number}> = ({t}) => {
  const cam = camNat(t);
  const P = natPose(t);
  const id = `N${Math.round(t * 30)}`;
  return (
    <Scene
      id={id}
      cam={cam}
      bg="#C8D6BE"
      back={(B) => <RockGround B={B} id={`${id}r`} z={A_GROUND} />}
      floor={(B) => <GroundShadow B={B} P={P} z={A_GROUND} id={id} />}
      items={(B) => {
        const it: Item[] = [];
        it.push(...spiderItems(B, P, lifeLook(A_LIFE(t)), {id: 'sn', occlusion: true}));
        return it;
      }}
    />
  );
};
