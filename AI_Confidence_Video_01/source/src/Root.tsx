import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {Main} from './Main';
import {TL} from './lib/timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={TL.durationInFrames} fps={30} width={1920} height={1080} defaultProps={{audio: 'mix' as const}} />
    <Composition id="Preview" component={Main} durationInFrames={TL.durationInFrames} fps={30} width={1920} height={1080} defaultProps={{audio: 'narration' as const}} />
  </>
);
