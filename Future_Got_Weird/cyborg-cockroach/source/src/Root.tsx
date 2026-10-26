import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {RigSheet} from './dev/RigSheet';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="RigSheet" component={RigSheet} durationInFrames={90} fps={30} width={1080} height={1920} defaultProps={{}} />
  </>
);
