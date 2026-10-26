// Glass Climbing V7: working stills.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {H, W} from '../lib';
import {BayWorld5 as BayWorld7} from './Bay7';
import {climbAt, climbTop} from './climb7';

/** up to 12 frames of the bay, 4 across at quarter size; follow: the camera centred on his hips (cx, cy offsets);
 *  top: the frames in the top coordinates (climbTop), for the seam */
export const BaySheet7: React.FC<{fs: number[]; cx: number; cy: number; z: number; follow: boolean; top?: boolean}> = ({fs, cx, cy, z, follow, top}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => {
      const st = top ? climbTop(f) : climbAt(f);
      const cam = follow ? {x: st.pose.x - 140 + cx, y: st.pose.y - 60 + cy, z} : {x: cx, y: cy, z};
      return (
        <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <BayWorld7 id={`b7s${i}`} st={st} cam={cam} k={1 / Math.sqrt(Math.max(0.4, z))} f={f} />
          </svg>
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{f}</div>
        </div>
      );
    })}
  </AbsoluteFill>
);
