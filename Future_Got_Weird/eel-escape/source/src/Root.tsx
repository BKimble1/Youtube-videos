import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {ProtoSheet} from './proto';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ProtoSheet" component={ProtoSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ts: [0, 1, 2], cols: 5}} />
  </>
);
