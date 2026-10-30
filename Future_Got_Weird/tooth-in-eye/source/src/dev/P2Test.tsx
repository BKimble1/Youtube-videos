import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Profile2, Rays2} from '../profile2';
import {EYE0} from '../profile';
import {camT} from '../cam';

export const P2Test: React.FC<{z: number; x: number; y: number; win: number; smile: number; brow: number; open: number; tissue: number}> = ({z, x, y, win, smile, brow, open, tissue}) => {
  const s = {st: {...EYE0, scar: 1}, implDx: 0, implOn: 1, tissue, vessels: tissue, rays: 'clear' as const, rayT: 1};
  return (
    <AbsoluteFill style={{backgroundColor: '#22303B'}}>
      <svg width={1080} height={1920}>
        <g transform={camT({x, y, z})}>
          <Profile2 s={s} px={1 / z} id="p" win={win} expr={{smile, brow, open}} />
          {win > 0 && <Rays2 mode="clear" T={1} px={1 / z} />}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
