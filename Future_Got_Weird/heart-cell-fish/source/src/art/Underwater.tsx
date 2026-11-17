// One underwater frame: the tank behind, far motes, the wake, the fish, near motes in front.
import React from 'react';
import {Basis, proj} from '../core/cam';
import {Fish, FishLook} from '../fish/Fish';
import {FishPose, L} from '../fish/model';
import {Motes, Swirl, Wake, WaterBG} from './water';

export const Underwater: React.FC<{id: string; B: Basis; t: number; pose: FishPose; swirls?: Swirl[]; look?: FishLook; grid?: number; over?: React.ReactNode; under?: React.ReactNode}> = ({id, B, t, pose, swirls = [], look = {}, grid = 1, over, under}) => {
  const zf = proj(B, pose.pos).z;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <WaterBG id={`${id}-w`} B={B} t={t} grid={grid} shadow={[{p: pose.pos, len: L, yaw: pose.yaw, op: 1 - (look.xray ?? 0) * 0.6}]} />
      <Motes id={`${id}-mf`} B={B} t={t} zMin={zf + 20} />
      {under}
      <Wake B={B} swirls={swirls} />
      <Fish id={`${id}-f`} B={B} pose={pose} look={{haze: 0.06, hazeColor: '#5FA9B6', ...look}} />
      <Motes id={`${id}-mn`} B={B} t={t} zMax={zf + 20} />
      {over}
    </svg>
  );
};
