// V2 rig sheet: the flat insect in profile (loaded and deployed), from above (walking), head-on, and the observer.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {poseRoach, straightPath} from '../../rig/roach';
import {Roach2D} from '../roach/Roach2D';
import {Gear2D, deployAt} from '../roach/Gear2D';
import {viewAt} from '../roach/ortho';

export const RigSheet2: React.FC<{t: number}> = ({t}) => {
  const path = straightPath([0, 0, 0], 0);
  const p1 = poseRoach({path, s: t * 40, t, search: 0.8, antL: {yaw: 0.9, pitch: 0.35}, antR: {yaw: 0.9, pitch: 0.35}});
  const p2 = poseRoach({path, s: t * 40 + 9, t: t + 1, search: 0.8});
  const v1 = viewAt(0, 0, 9, [0, 12, 0], 540, 330);
  const dep = deployAt(t, 0.3, 14);
  const v2 = viewAt(0, 90, 6, [0, 0, 0], 330, 900);
  const v3 = viewAt(90, 6, 6, [0, 12, 0], 860, 900);
  const v4 = viewAt(0, 0, 7, [0, 12, 0], 540, 1500);
  return (
    <AbsoluteFill style={{background: '#DCE9EE'}}>
      <svg width={1080} height={1920}>
        <Roach2D pose={p1} v={v1} o={{id: 'a', gear: <Gear2D id="ag" v={v1} f={p1.frame} g={{kind: 'injector', injRear: dep.injRear, latched: dep.latched, heat: dep.heat, led: dep.heat}} />}} />
        <Roach2D pose={p2} v={v2} o={{id: 'b', gear: <Gear2D id="bg" v={v2} f={p2.frame} g={{kind: 'injector'}} />}} />
        <Roach2D pose={p2} v={v3} o={{id: 'c', gear: <Gear2D id="cg" v={v3} f={p2.frame} g={{kind: 'injector'}} />}} />
        <Roach2D pose={p2} v={v4} o={{id: 'd', tint: '#6B4030', gear: <Gear2D id="dg" v={v4} f={p2.frame} g={{kind: 'camera'}} />}} />
      </svg>
    </AbsoluteFill>
  );
};
