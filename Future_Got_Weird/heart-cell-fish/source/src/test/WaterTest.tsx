import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {basis} from '../core/cam';
import {Fish} from '../fish/Fish';
import {swimTrack} from '../fish/swim';
import {Motes, WaterBG, Wake} from '../art/water';

const tr = swimTrack({t0: 0, t1: 6, start: [-300, 0, 0], yaw: () => 0, freq: () => 2.2, amp: () => 0.5});
export const WaterTest: React.FC<{t?: number}> = ({t: tt}) => {
  const fr = useCurrentFrame();
  const t = tt ?? fr / 60;
  const p = tr.at(t);
  const B = basis({eye: [p.pos[0] - 60, 30, 260], target: [p.pos[0] + 10, 5, 0], f: 1500});
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg width={1080} height={1920}>
        <WaterBG id="w" B={B} t={t} shadow={[{p: p.pos, len: 140, yaw: p.yaw}]} />
        <Motes id="m1" B={B} t={t} zMin={260} />
        <Wake B={B} swirls={tr.swirls(t)} />
        <Fish id="f" B={B} pose={p} look={{haze: 0.08}} />
        <Motes id="m2" B={B} t={t} zMax={260} />
      </svg>
    </AbsoluteFill>
  );
};
