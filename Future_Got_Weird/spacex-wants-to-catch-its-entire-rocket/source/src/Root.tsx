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
import {MainV3} from './v3/MainV3';
import {FILM_END as FILM_END_V3} from './v3/time';
import {V3Probe} from './v3/Probe';
import {V4Lab, V4Pose} from './v4/Lab4';
import {MainV4, FILM_END_V4} from './v4/MainV4';
import {MainV5, FILM_END_V5} from './v5/MainV5';
import {V5Lab} from './v5/Lab5';
import {V3Compare} from './v3/Compare';

export const DURATION = Math.ceil((NARR_DUR + 1.6) * 30);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} width={1920} height={1080} fps={30} durationInFrames={DURATION} defaultProps={{audio: 'mix' as string | false}} />
    <Still id="ThumbA" component={Thumb} width={1280} height={720} defaultProps={{variant: 'A' as const}} />
    <Still id="ThumbB" component={Thumb} width={1280} height={720} defaultProps={{variant: 'B' as const}} />
    <Still id="AssetSheet" component={AssetSheet} width={1920} height={1080} />
    <Composition id="MainV2" component={MainV2} width={1920} height={1080} fps={30} durationInFrames={Math.ceil(FILM_END * 30)} defaultProps={{audio: 'mix' as string | false}} />
    <Composition id="MainV3" component={MainV3} width={1920} height={1080} fps={30} durationInFrames={Math.ceil(FILM_END_V3 * 30)} defaultProps={{audio: 'mix' as string | false}} />
    <Composition id="V3Probe" component={V3Probe} width={1920} height={1080} fps={30} durationInFrames={600} defaultProps={{file: '09_Recovered_Ship40_Heatshield_4K.mp4', src0: 0, scale: 1, cx: 0.5, cy: 0.5}} />
    <Composition id="MainV4" component={MainV4} width={1920} height={1080} fps={30} durationInFrames={Math.ceil(FILM_END_V4 * 30)} defaultProps={{audio: 'mix' as string | false}} />
    <Composition id="MainV5" component={MainV5} width={1920} height={1080} fps={30} durationInFrames={Math.ceil(FILM_END_V5 * 30)} defaultProps={{audio: 'mix' as string | false}} />
    <Still id="V5Lab" component={V5Lab} width={1920} height={1080} defaultProps={{view: 0}} />
    <Still id="V4Pose" component={V4Pose} width={1920} height={1080} defaultProps={{i: 0}} />
    <Still id="V4Lab" component={V4Lab} width={1920} height={1080} defaultProps={{view: 0}} />
    <Still id="V3Compare" component={V3Compare} width={1920} height={540} />
    <Composition id="V2Lab" component={Lab} width={1920} height={1080} fps={30} durationInFrames={3} defaultProps={{page: 0}} />
  </>
);
