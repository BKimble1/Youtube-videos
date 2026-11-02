import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import '../../fonts';
import {TwoShot, TS, helmetWorld} from '../twoShot';
import {camT} from '../../story';

const z = 3.55 / TS.s;
const hw = helmetWorld();
const cam = {x: (TS.ax + TS.fx) / 2, y: hw.y + 8 * TS.s + (960 - 603) / z, z};
const Test: React.FC<{age: number}> = ({age}) => (
  <AbsoluteFill style={{background: '#BFE3EE'}}>
    <svg width={1080} height={1920}>
      <g transform={camT(cam)}>
        <rect x={0} y={1630} width={3000} height={400} fill="#D9D2C3" />
        <TwoShot age={age} id="t" frame={0} astroE={{wide: 0.6, mouth: 'o', open: 0.3, brows: 0.6, lookX: 0.7, lookY: 0.2}} friendE={{mouth: 'soft', lookX: -0.7}} />
      </g>
    </svg>
  </AbsoluteFill>
);
const Root: React.FC = () => (
  <>
    <Composition id="TwoShot0" component={Test} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{age: 0.05}} />
    <Composition id="TwoShot1" component={Test} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{age: 1}} />
  </>
);
registerRoot(Root);
