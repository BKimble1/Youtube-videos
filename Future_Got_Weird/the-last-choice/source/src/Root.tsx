import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {ModelSheet} from './dev/ModelSheet';
import {Main} from './film/Main';
import {FRAMES} from './film/timing';
import {PoseSheet} from './dev/PoseSheet';
import {MechSheet} from './dev/MechSheet';
import {CitySheet} from './dev/CitySheet';
import {RefugeSheet} from './dev/RefugeSheet';
import {FxSheet} from './dev/FxSheet';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="LastChoice" component={Main} durationInFrames={FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: false as const}} />
    <Composition id="LastChoice4K" component={Main} durationInFrames={FRAMES} fps={30} width={3840} height={2160} defaultProps={{audio: false as const}} />
    <Composition id="ModelSheet" component={ModelSheet} durationInFrames={1} fps={30} width={1920} height={1080} defaultProps={{page: 0}} />
    <Composition id="PoseSheet" component={PoseSheet} durationInFrames={60} fps={30} width={1920} height={1080} defaultProps={{page: 0}} />
    <Composition id="MechSheet" component={MechSheet} durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={{page: 0}} />
    <Composition id="CitySheet" component={CitySheet} durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={{page: 0}} />
    <Composition id="RefugeSheet" component={RefugeSheet} durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={{page: 0}} />
    <Composition id="FxSheet" component={FxSheet} durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={{page: 0}} />
  </>
);
