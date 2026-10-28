// working still (V2): a station at time t through a given camera
import React from 'react';
import {Scene3D} from '../Scene3D';
import {cam} from '../lib/campath';
import {earlyItems, lateItems, rampItems2} from '../v2/views';
import {rampXf} from '../world/ramp';

export const CamTest2: React.FC<{t: number; eye: [number, number, number]; target: [number, number, number]; f: number; oy?: number; world?: string}> = ({t, eye, target, f, oy, world = 'early'}) => {
  const c = cam(eye, target, f, {oy});
  if (world === 'ramp') return <Scene3D cam={c} xf={rampXf} build={(P, Pw) => rampItems2(P, Pw, t)} />;
  if (world === 'late') return <Scene3D cam={c} build={(P) => lateItems(P, t)} />;
  return <Scene3D cam={c} build={(P) => earlyItems(P, t)} />;
};
