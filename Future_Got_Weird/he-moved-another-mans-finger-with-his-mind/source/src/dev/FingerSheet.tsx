import React from 'react';
import {AbsoluteFill} from 'remotion';
import {F_DOWN, F_HOVER, F_JERK, F_LIFT, F_REST, FingerECU, pressPose} from '../v2/finger';
import {K} from '../art/kit';
const poses = [['hover', F_HOVER, 0, -1], ['lift', F_LIFT, 0, -1], ['down', pressPose(1), 1, 0.6], ['jerk', F_JERK, 0, 0.9], ['rest', F_REST, 0, -1], ['downTouch', F_DOWN, 0, -1]] as const;
export const FingerSheet: React.FC = () => (
  <AbsoluteFill style={{background: '#222'}}>
    {poses.map(([n, p, pr, dr], i) => (
      <div key={n} style={{position: 'absolute', left: (i % 3) * 640, top: Math.floor(i / 3) * 360, width: 640, height: 360, overflow: 'hidden', background: K.stoccoWall}}>
        <svg width={640} height={360} viewBox="0 0 1920 1080"><FingerECU id={`fs${i}`} pose={p} press={pr} keyGlow={pr} drive={dr} /></svg>
        <div style={{position: 'absolute', left: 6, top: 4, color: '#000', fontSize: 20}}>{n}</div>
      </div>
    ))}
  </AbsoluteFill>
);
