// HOOK 09: the pistol shrimp. One continuous camera move: close on the cocked claw -> the snap and jet -> follow the
// cavitation bubble into extreme macro -> collapse, pinpoint flash, shockwave -> pull out past the stunned prey to the
// whole (tiny) shrimp re-cocking its claw. Event times: ./timeline.ts (mirrored in tools/audio/h09.py).
import React from 'react';
import {HookFrame, HookProps} from '../shared/HookFrame';
import {camAt, dactylOpen, tau, W9, worldTransform} from './timeline';
import {Backdrop, Bokeh, Floor, Particles} from './Env';
import {Shrimp, ShrimpShadow} from './Shrimp';
import {Fish} from './Fish';
import {Bubble, Flash, flashI, Jet, Shock} from './Fx';

const Scene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t);
  const ta = tau(t);
  const w = 2.5 / (0.72 * cam.s); // ~2.5 px ink contour at any zoom
  const fl = flashI(t);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Backdrop cam={cam} t={t} tau={ta} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={worldTransform(cam)}>
          <Floor tau={ta} />
          <ShrimpShadow />
          <Shrimp t={t} tau={ta} open={dactylOpen(t)} w={w} />
          <Fish t={t} tau={ta} w={w} />
        </g>
        <Jet cam={cam} t={t} />
        <Particles cam={cam} t={t} tau={ta} flash={fl} />
        <Bubble cam={cam} t={t} />
        <Shock cam={cam} t={t} />
        <Flash cam={cam} t={t} />
        <Bokeh cam={cam} tau={ta} />
      </svg>
    </div>
  );
};

export const Hook: React.FC<HookProps> = (props) => (
  <HookFrame hook="09" W={W9} bg="#1F4F53" capY={[1500, 1500]} props={props}>
    {(t) => <Scene t={t} />}
  </HookFrame>
);
