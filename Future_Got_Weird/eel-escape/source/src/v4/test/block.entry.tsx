// Blocking sheet for the exterior shots: stand-in predator + the V4 eel (escape.ts) through candidate cameras.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {resetIds} from '../../core/ids';
import {basis, Cam3, orbitCam, V3} from '../three';
import {StandInFish} from '../standin';
import {Eel3D} from '../eelV4';
import {escapeAt} from '../escape';

export const CAMS: Record<string, (t: number) => Cam3> = {
  follows: () => orbitCam({target: [-8, -8, 6], az: 30, el: 45, d: 80, f: 1234}),
  head: () => orbitCam({target: [-24.5, -6, 6], az: 40, el: 15, d: 30, f: 1470}),
  release: () => orbitCam({target: [-20, -12, 10], az: 15, el: -14, d: 70, f: 1375}),
  wide: () => orbitCam({target: [-5, -5, 5], az: 20, el: 25, d: 140, f: 1300}),
  top: () => orbitCam({target: [-5, -5, 5], az: 0, el: 89, d: 140, f: 1300}),
};
const Cell: React.FC<{cam: string; t: number}> = ({cam, t}) => {
  resetIds(`${cam}${Math.round(t * 100)}_`);
  const B = basis(CAMS[cam](t));
  const e = escapeAt(t);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <rect width={1080} height={1920} fill="#558F89" />
      <StandInFish B={B} />
      <Eel3D B={B} pose={e} t={t} from={e.free ? 0 : Math.max(0, e.crossI)} />
      <text x={30} y={1880} fontSize={60} fill="#FF0">{`${cam} ${t.toFixed(2)}`}</text>
    </svg>
  );
};
const Sheet: React.FC<{cells: [string, number][]; cols: number}> = ({cells, cols}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {cells.map(([c, t], i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Cell cam={c} t={t} />
        </div>
      ))}
    </AbsoluteFill>
  );
};
const Root: React.FC = () => (
  <Composition id="Block" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{cells: [['wide', 15]] as [string, number][], cols: 4}} />
);
registerRoot(Root);
