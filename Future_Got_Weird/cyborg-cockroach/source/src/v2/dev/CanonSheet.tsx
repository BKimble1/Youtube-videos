// V5 canonical model sheet: the ONE cockroach and its two equipment variants (medic: launch tube, spring, injector;
// observer: camera module and aerial) drawn by the film's own renderer (Roach2D + Gear2D) from the views the film uses.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {poseRoach, straightPath} from '../../rig/roach';
import {Roach2D} from '../roach/Roach2D';
import {Gear2D} from '../roach/Gear2D';
import {viewAt} from '../roach/ortho';

const VIEWS: {name: string; az: number; el: number}[] = [
  {name: 'side', az: 0, el: 8},
  {name: 'three-quarter', az: 30, el: 22},
  {name: 'high three-quarter', az: 30, el: 45},
  {name: 'front', az: 90, el: 10},
  {name: 'top', az: 0, el: 90},
];
export const CanonSheet: React.FC = () => {
  const path = straightPath([0, 0, 0], 0);
  const pose = poseRoach({path, s: 30, t: 0.4, search: 0.6, antL: {yaw: 1.0, pitch: 0.5, curl: 0.6}, antR: {yaw: 1.0, pitch: 0.5, curl: 0.6}});
  const W = 2160, rowH = 520;
  return (
    <AbsoluteFill style={{background: '#E9EEF0'}}>
      <svg width={W} height={rowH * VIEWS.length + 120}>
        <text x={60} y={80} fontFamily="Nunito, sans-serif" fontWeight={900} fontSize={54} fill="#172B3A">Cyborg cockroach: canonical model (medic | observer)</text>
        {VIEWS.map((q, i) => {
          const y = 120 + rowH * i + rowH / 2 + 40;
          const v1 = viewAt(q.az, q.el, 6.2, [0, 12, 0], 560, y);
          const v2 = viewAt(q.az, q.el, 6.2, [0, 12, 0], 1600, y);
          return (
            <g key={q.name}>
              <text x={60} y={120 + rowH * i + 60} fontFamily="Nunito, sans-serif" fontWeight={800} fontSize={40} fill="#3A4A55">{`${q.name} (az ${q.az}, el ${q.el})`}</text>
              <Roach2D pose={pose} v={v1} o={{id: `m${i}`, gear: <Gear2D id={`mg${i}`} v={v1} f={pose.frame} g={{kind: 'injector', heat: 0.4, led: 1}} />}} />
              <Roach2D pose={pose} v={v2} o={{id: `o${i}`, tint: '#6B4030', gear: <Gear2D id={`og${i}`} v={v2} f={pose.frame} g={{kind: 'camera', led: 1}} />}} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
