import {ThumbV4A, ThumbV4B} from './v4/dev/ThumbsV4';
import {MainV5, MAIN_V5_FRAMES} from './v5/MainV5';
import {MainV6, MAIN_V6_FRAMES} from './v6/MainV6';
import {MainV4, MAIN_V4_FRAMES} from './v4/MainV4';
import {Sheet4} from './v4/dev/Sheet4';
import {CamTest} from './v3/dev/CamTest';
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
import {MainV3, MAIN_V3_FRAMES} from './v3/MainV3';
import {ThumbV3A, ThumbV3B} from './v3/dev/ThumbsV3';
import {RobotSheetV3} from './v3/dev/RobotSheet';
import {Diagnostic, DIAG_FRAMES} from './v3/dev/Diagnostic';

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
    <Composition id="V3Main" component={MainV3} durationInFrames={MAIN_V3_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'narration' as const}} />
    <Composition id="V3ThumbA" component={ThumbV3A} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="V3ThumbB" component={ThumbV3B} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="V3SheetF02" component={RobotSheetV3} durationInFrames={1} fps={30} width={1920} height={1080} defaultProps={{page: 0}} />
    <Composition id="V3SheetF03" component={RobotSheetV3} durationInFrames={1} fps={30} width={1920} height={1080} defaultProps={{page: 1}} />
    <Composition id="V3SheetID" component={RobotSheetV3} durationInFrames={1} fps={30} width={1920} height={1080} defaultProps={{page: 2}} />
    <Composition id="V4Main" component={MainV4} durationInFrames={MAIN_V4_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'narration' as const}} />
    <Composition id="V5Main" component={MainV5} durationInFrames={MAIN_V5_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'narration' as const}} />
    <Composition id="V6Main" component={MainV6} durationInFrames={MAIN_V6_FRAMES} fps={30} width={1920} height={1080} defaultProps={{audio: 'narration' as const}} />
    <Composition id="V4ThumbA" component={ThumbV4A} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="V4ThumbB" component={ThumbV4B} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="V4Sheet0" component={Sheet4} durationInFrames={1} fps={30} width={1920} height={1080} defaultProps={{page: 0}} />
    <Composition id="V4Sheet1" component={Sheet4} durationInFrames={1} fps={30} width={1920} height={1080} defaultProps={{page: 1}} />
    <Composition id="V4Sheet2" component={Sheet4} durationInFrames={1} fps={30} width={1920} height={1080} defaultProps={{page: 2}} />
    <Composition id="V3CamTest" component={CamTest} durationInFrames={40} fps={30} width={1920} height={1080} defaultProps={{shots: []}} />
    <Composition id="V3Diag" component={Diagnostic} durationInFrames={DIAG_FRAMES} fps={30} width={1920} height={1080} defaultProps={{kind: 'F02' as const}} />
    <Composition id="KitRobot" component={KitRobot} durationInFrames={1} fps={30} width={1920} height={1080} />
  </>
);
