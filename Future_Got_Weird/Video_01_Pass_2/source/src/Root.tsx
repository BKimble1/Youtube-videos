import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {CastTest} from './CastTest';
import {ThumbA, ThumbB, ThumbC} from './Thumbnails';
import {Main} from './Main';
import {TL} from './lib/timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={TL.durationInFrames} fps={30} width={1920} height={1080} defaultProps={{audio: 'mix' as const}} />
    <Composition id="Preview" component={Main} durationInFrames={TL.durationInFrames} fps={30} width={1920} height={1080} defaultProps={{audio: 'none' as const}} />
    <Still id="CastTest" component={CastTest} width={1920} height={1080} />
    <Still id="ThumbA" component={ThumbA} width={1920} height={1080} />
    <Still id="ThumbB" component={ThumbB} width={1920} height={1080} />
    <Still id="ThumbC" component={ThumbC} width={1920} height={1080} />
  </>
);
