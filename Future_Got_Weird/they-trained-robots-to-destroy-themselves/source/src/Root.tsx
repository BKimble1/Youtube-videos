import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {KitRobot} from './dev/KitRobot';
import {Proto, PROTO_FRAMES, ProtoTrain, PROTO_TRAIN_FRAMES} from './Proto';
import {Main, MAIN_FRAMES} from './Main';
import {ThumbA, ThumbB} from './Thumbs';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={MAIN_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'mix' as const}} />
    <Composition id="Preview" component={Main} durationInFrames={MAIN_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'narration' as const}} />
    <Composition id="Proto" component={Proto} durationInFrames={PROTO_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: true}} />
    <Composition id="ProtoTrain" component={ProtoTrain} durationInFrames={PROTO_TRAIN_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: true}} />
    <Composition id="ThumbA" component={ThumbA} durationInFrames={1} fps={30} width={1280} height={720} />
    <Composition id="ThumbB" component={ThumbB} durationInFrames={1} fps={30} width={1280} height={720} />
    <Composition id="KitRobot" component={KitRobot} durationInFrames={1} fps={30} width={1920} height={1080} />
  </>
);
