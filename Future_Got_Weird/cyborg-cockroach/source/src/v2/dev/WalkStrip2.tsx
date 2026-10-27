// V2 walk strip: 8 phases of the side-view gait, and four camera angles of one pose.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {poseRoach, straightPath} from '../../rig/roach';
import {Roach2D} from '../roach/Roach2D';
import {Gear2D} from '../roach/Gear2D';
import {viewAt} from '../roach/ortho';

export const WalkStrip2: React.FC<{az: number; el: number}> = ({az, el}) => {
  const path = straightPath([0, 0, 0], 0);
  return (
    <AbsoluteFill style={{background: '#DCE9EE'}}>
      <svg width={1080} height={1920}>
        {Array.from({length: 8}, (_, i) => {
          const s = (i / 8) * 26;
          const p = poseRoach({path, s, t: i * 0.1, search: 0.7});
          const v = viewAt(0, 0, 4.2, [s, 12, 0], 270 + (i % 2) * 540, 130 + Math.floor(i / 2) * 230);
          return <Roach2D key={i} pose={p} v={v} o={{id: `w${i}`, gear: <Gear2D id={`wg${i}`} v={v} f={p.frame} g={{kind: 'injector'}} />}} />;
        })}
        {[[az, el], [30, 25], [60, 15], [135, 20]].map(([a, e], i) => {
          const p = poseRoach({path, s: 9, t: 1, search: 0.7});
          const v = viewAt(a, e, 4.6, [0, 12, 0], 270 + (i % 2) * 540, 1180 + Math.floor(i / 2) * 400);
          return <Roach2D key={`v${i}`} pose={p} v={v} o={{id: `v${i}`, gear: <Gear2D id={`vg${i}`} v={v} f={p.frame} g={{kind: 'injector'}} />}} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
