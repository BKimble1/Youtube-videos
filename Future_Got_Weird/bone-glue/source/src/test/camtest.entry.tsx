// Test only: the wrist world at a given time through an arbitrary camera (framing studies), with the captions.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {WristWorld} from '../Scene';
import {Captions} from '../Captions';
import {resetIds} from '../core/ids';
import {Cam} from '../camera';

const V: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  resetIds('ct');
  return (
    <AbsoluteFill style={{background: '#111'}}>
      <WristWorld t={t} c={cam} fkey="ct" />
      <Captions t={t} />
    </AbsoluteFill>
  );
};
registerRoot(() => <Composition id="V" component={V} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{t: 3.9, cam: {x: 10, y: -27, w: 112, k: 0.98, focus: -5}}} />);
