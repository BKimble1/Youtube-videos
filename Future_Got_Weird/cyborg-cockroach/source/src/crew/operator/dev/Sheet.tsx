// Test sheets for the operator (dev only).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Remote} from '../Remote';
import {RemoteCloseUp, RemoteCloseUpProps} from '../RemoteCloseUp';

const Panel: React.FC<{x: number; y: number; w: number; h: number; label: string; children: React.ReactNode; bg?: string}> = ({x, y, w, h, label, children, bg = '#DCE6EC'}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect width={w} height={h} fill={bg} stroke="#172B3A" strokeWidth={2} />
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="hidden">{children}</svg>
    <text x={10} y={24} fontSize={20} fontFamily="monospace" fill="#172B3A">{label}</text>
  </g>
);

export const RemoteSheet: React.FC<{tilt?: number}> = ({tilt = 35}) => (
  <AbsoluteFill style={{background: '#CFD8DE'}}>
    <svg width={1080} height={1920}>
      <Panel x={0} y={0} w={1080} h={640} label={`k=12 tilt=${tilt} press 0`}>
        <Remote id="a" view={{c: {x: 540, y: 340}, k: 12, rot: 0, tilt}} press={0} led="armed" />
      </Panel>
      <Panel x={0} y={640} w={1080} h={640} label={`k=12 tilt=${tilt} press 1 fired`}>
        <Remote id="b" view={{c: {x: 540, y: 340}, k: 12, rot: -8, tilt}} press={1} led="fired" />
      </Panel>
      {[0, 20, 45, 65, 75].map((t, i) => (
        <Panel key={i} x={i * 216} y={1280} w={216} h={320} label={`t${t}`}>
          <Remote id={`c${i}`} view={{c: {x: 108, y: 170}, k: 2.4, rot: 0, tilt: t}} press={i % 2} led={i % 2 ? 'fired' : 'armed'} />
        </Panel>
      ))}
      {[1.0, 1.4, 4].map((k, i) => (
        <Panel key={i} x={i * 360} y={1600} w={360} h={320} label={`k${k}`}>
          <Remote id={`d${i}`} view={{c: {x: 180, y: 170}, k, rot: -12, tilt: 60}} press={0} led="armed" />
        </Panel>
      ))}
    </svg>
  </AbsoluteFill>
);

export const OperatorSheet: React.FC = () => <AbsoluteFill style={{background: '#CFD8DE'}} />;

/** one close-up frame at full size (dev) */
export const CloseUpStill: React.FC<RemoteCloseUpProps> = (p) => (
  <AbsoluteFill style={{background: '#DCE6EC'}}>
    <svg width={1080} height={1920}>
      <RemoteCloseUp {...p} />
    </svg>
  </AbsoluteFill>
);
