// working still: a station at time t through a given camera (framing tests)
import React from 'react';
import {Scene3D} from '../Scene3D';
import {benchState} from '../world/bench';
import {benchItems} from '../world/benchView';
import {rampItems, rampXf} from '../world/ramp';
import {runoutItems} from '../world/runout';
import {cam} from '../lib/campath';

export const CamTest: React.FC<{t: number; eye: [number, number, number]; target: [number, number, number]; f: number; oy?: number; world?: string}> = ({t, eye, target, f, oy, world = 'bench'}) => {
  const c = cam(eye, target, f, {oy});
  if (world === 'ramp') return <Scene3D cam={c} xf={rampXf} build={(P, Pw) => rampItems(P, Pw, t)} />;
  if (world === 'runout') return <Scene3D cam={c} build={(P) => runoutItems(P, t)} />;
  const s = benchState(t);
  return <Scene3D cam={c} build={(P) => benchItems(P, s)} />;
};
