import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {CarSheet, FrontSheet} from './dev/CarSheet';
import {Main, MainProps} from './Main';
import {Thumb} from './dev/Thumb';
import {FitCheck} from './dev/FitCheck';
import {LoftSheet} from './dev/LoftSheet';
import {TrackSheet} from './dev/TrackSheet';
import {DURATION_FRAMES, FPS} from './cues';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={DURATION_FRAMES} fps={FPS} width={1920} height={1080} defaultProps={{audio: false} as MainProps} />
    <Composition id="FitCheck" component={FitCheck} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="Thumb" component={Thumb} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="FrontSheet" component={FrontSheet} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="LoftSheet" component={LoftSheet} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="TrackSheet" component={TrackSheet} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="CarSheet" component={CarSheet} durationInFrames={1} fps={30} width={1920} height={1080} />
  </>
);
