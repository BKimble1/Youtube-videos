// Test only: the recovered hand (skin over the arm) at any curl / thumb / spread, at the follow-up framing.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {Cam, Layer} from '../camera';
import {ArmSkin, ArmState} from '../art/arm';
import {resetIds} from '../core/ids';

type P = {curl: number; thumb: number; spread: number; cam: Cam};
const One: React.FC<{c: P}> = ({c}) => {
  const s: ArmState = {curl: c.curl, thumb: c.thumb, spread: c.spread, incision: 0, sutures: 0, scar: 1, window: null};
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Layer c={c.cam} z={-10} maxBlur={0}>
        <ArmSkin id={`h${c.curl}_${c.thumb}_${c.spread}`} s={s} />
      </Layer>
    </div>
  );
};
const Sheet: React.FC<{ps: P[]}> = ({ps}) => {
  resetIds('hs');
  return (
    <AbsoluteFill style={{background: '#2C5F85'}}>
      {ps.map((p, n) => (
        <div key={n} style={{position: 'absolute', left: (n % 4) * 270, top: Math.floor(n / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <One c={p} />
        </div>
      ))}
    </AbsoluteFill>
  );
};
const CAM: Cam = {x: -6, y: -76, w: 182, k: 1, focus: 0};
registerRoot(() => (
  <Composition id="H" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920}
    defaultProps={{ps: [0.25, 0.5, 0.75, 0.9, 1.0, 1.15, 1.3, 1.5].map((curl) => ({curl, thumb: Math.min(1.2, curl), spread: 0, cam: CAM}))}} />
));
