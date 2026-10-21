import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {AssetSheet} from './dev/AssetSheet';
import {Main} from './Main';
import {Thumb} from './dev/Thumb';
import {NARR_DUR} from './kit/anim';
import {Lab} from './v2/Lab';
import {MainV2} from './v2/MainV2';
import {FILM_END} from './v2/time';

export const DURATION = Math.ceil((NARR_DUR + 1.6) * 30);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} width={1920} height={1080} fps={30} durationInFrames={DURATION} defaultProps={{audio: 'mix' as string | false}} />
    <Still id="ThumbA" component={Thumb} width={1280} height={720} defaultProps={{variant: 'A' as const}} />
    <Still id="ThumbB" component={Thumb} width={1280} height={720} defaultProps={{variant: 'B' as const}} />
    <Still id="AssetSheet" component={AssetSheet} width={1920} height={1080} />
    <Composition id="MainV2" component={MainV2} width={1920} height={1080} fps={30} durationInFrames={Math.ceil(FILM_END * 30)} defaultProps={{audio: 'mix' as string | false}} />
    <Composition id="V2Lab" component={Lab} width={1920} height={1080} fps={30} durationInFrames={3} defaultProps={{page: 0}} />
  </>
);
