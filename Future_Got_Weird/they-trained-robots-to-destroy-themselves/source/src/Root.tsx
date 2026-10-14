import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {KitRobot} from './dev/KitRobot';
import {Proto, PROTO_FRAMES, ProtoTrain, PROTO_TRAIN_FRAMES} from './Proto';
import {Main, MAIN_FRAMES} from './Main';
import {ThumbA, ThumbB} from './Thumbs';
import {RobotSheet} from './v2/dev/RobotSheet';
import {HookFoundry, HOOK_FOUNDRY_END} from './v2/shots/HookFoundry';
import {ProtoV2, PROTO_V2_FRAMES} from './v2/dev/Proto';
import {MainV2, MAIN_V2_FRAMES} from './v2/MainV2';
import {ThumbV2A, ThumbV2B} from './v2/dev/ThumbsV2';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={MAIN_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'mix' as const}} />
    <Composition id="Preview" component={Main} durationInFrames={MAIN_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'narration' as const}} />
    <Composition id="Proto" component={Proto} durationInFrames={PROTO_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: true}} />
    <Composition id="ProtoTrain" component={ProtoTrain} durationInFrames={PROTO_TRAIN_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: true}} />
    <Composition id="ThumbA" component={ThumbA} durationInFrames={1} fps={30} width={1280} height={720} />
    <Composition id="ThumbB" component={ThumbB} durationInFrames={1} fps={30} width={1280} height={720} />
    <Composition id="V2Main" component={MainV2} durationInFrames={MAIN_V2_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'mix' as const}} />
    <Composition id="V2Proto" component={ProtoV2} durationInFrames={PROTO_V2_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: true}} />
    <Composition id="V2Hook" component={HookFoundry} durationInFrames={Math.round(HOOK_FOUNDRY_END * 30)} fps={30} width={1920} height={1080} />
    <Composition id="V2ThumbA" component={ThumbV2A} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="V2ThumbB" component={ThumbV2B} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="V2RobotSheet" component={RobotSheet} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="KitRobot" component={KitRobot} durationInFrames={1} fps={30} width={1920} height={1080} />
  </>
);
