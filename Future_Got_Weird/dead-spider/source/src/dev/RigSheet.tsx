// Rig test sheet: the spider at three extensions from three cameras.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Items, resetIds} from '../draw3';
import {LOOK_A} from '../SpiderDraw';
import {spiderItems} from '../SpiderDraw';
import {basis, Cam3} from '../three';

const cams: Cam3[] = [
  {eye: [-14, -34, 30], target: [0, 0, -1], f: 640 * 1.1},
  {eye: [0, -60, 2], target: [0, 0, -1], f: 640 * 1.6},
  {eye: [0, 0.01, 60], target: [0, 0, 0], f: 640 * 1.5},
];
export const RigSheet: React.FC<{es: number[]}> = ({es}) => {
  resetIds();
  return (
    <AbsoluteFill style={{background: '#E9F0F3'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {cams.map((c, ci) =>
          es.map((e, ei) => {
            const B = basis({...c, cx: 180 + ei * 360, cy: 320 + ci * 640});
            return <Items key={`${ci}${ei}`} items={spiderItems(B, {pos: [0, 0, 0], yaw: 200, e: Array(8).fill(e)}, LOOK_A, {id: `r${ci}${ei}`})} />;
          }),
        )}
      </svg>
    </AbsoluteFill>
  );
};
