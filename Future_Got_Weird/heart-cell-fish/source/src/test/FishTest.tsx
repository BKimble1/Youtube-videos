import React from 'react';
import {AbsoluteFill} from 'remotion';
import {basis, orbit} from '../core/cam';
import {Fish} from '../fish/Fish';
import {cycle, FishPose} from '../fish/model';

const views: {yaw: number; pitch: number; A: number; ph: number; TK: number; xr?: number}[] = [
  {yaw: 0, pitch: 4, A: 0, ph: 0, TK: 1},
  {yaw: 0, pitch: 72, A: 0.5, ph: 0.6, TK: 2.6},
  {yaw: 20, pitch: 64, A: -0.5, ph: 2.4, TK: 2.6},
  {yaw: 0, pitch: 89, A: 0.55, ph: 0.9, TK: 2.6},
  {yaw: 0, pitch: 89, A: -0.55, ph: 3.9, TK: 2.6},
  {yaw: 60, pitch: 8, A: 0.2, ph: 0, TK: 1, xr: 1},
];
export const FishTest: React.FC = () => (
  <AbsoluteFill style={{background: '#2E6F7E'}}>
    <svg width={1080} height={1920}>
      {views.map((v, k) => {
        const cx = 270 + (k % 2) * 540, cy = 320 + Math.floor(k / 2) * 640;
        const up = v.pitch > 80 ? ([-1, 0, 0] as [number, number, number]) : undefined;
        const B = basis({...orbit([0, 0, 0], v.yaw, v.pitch, 400, 900, up), cx, cy});
        const c = cycle(v.ph, 0.55);
        const pose: FishPose = {pos: [0, 0, 0], yaw: 0, A: v.A, actA: c.actA, actB: c.actB, mature: 1, TK: v.TK, waveB: k === 3 ? 0.5 : -1};
        return <Fish key={k} id={`t${k}`} B={B} pose={pose} look={{xray: v.xr ?? 0}} />;
      })}
    </svg>
  </AbsoluteFill>
);
