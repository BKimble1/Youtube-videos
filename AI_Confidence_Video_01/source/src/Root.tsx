import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {Main} from './Main';
import {TL} from './lib/timeline';
import {ThumbA, ThumbB, ThumbC} from './Thumbnails';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={TL.durationInFrames} fps={30} width={1920} height={1080} defaultProps={{audio: 'mix' as const}} />
    <Composition id="Preview" component={Main} durationInFrames={TL.durationInFrames} fps={30} width={1920} height={1080} defaultProps={{audio: 'narration' as const}} />
    <Still id="ThumbA" component={ThumbA} width={1280} height={720} />
    <Still id="ThumbB" component={ThumbB} width={1280} height={720} />
    <Still id="ThumbC" component={ThumbC} width={1280} height={720} />
  </>
);
