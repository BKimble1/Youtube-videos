// One in-gut frame: background, the wall (far half, painter-sorted), the cut faces, the robot (painter-sorted) and any
// extra items (tools, dye) sorted with the robot.
import React from 'react';
import {Basis} from '../core/three';
import {Item, Light} from '../core/render';
import {gutItems, GutOpts, loopItems} from '../world/gut';
import {C} from '../art/palette';
import {RenderItems} from './RenderItems';

export const GutShot: React.FC<{B: Basis; Lt: Light; gut: GutOpts; robot: Item[]; extra?: Item[]; bg?: string}> = ({B, Lt, gut, robot, extra = [], bg}) => {
  const g = gutItems(B, Lt, gut);
  const loops = loopItems(B, Lt, gut.sFrom, gut.sTo);
  const back = [...g.back].sort((a, b) => b.z - a.z);
  const front = [...robot, ...extra].sort((a, b) => b.z - a.z);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id="cav" cx="50%" cy="45%" r="75%">
          <stop offset="0%" stopColor={bg ?? C.cavity} />
          <stop offset="100%" stopColor={C.cavityDeep} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#cav)" />
      <RenderItems items={loops} />
      <RenderItems items={back} />
      <RenderItems items={g.rims} />
      <RenderItems items={front} />
    </svg>
  );
};
