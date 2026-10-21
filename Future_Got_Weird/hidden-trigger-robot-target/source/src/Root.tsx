import React from 'react';
import {Composition, Still} from 'remotion';
import {HiddenTrigger} from './HiddenTrigger';
import {Cover} from './Cover';
import {HiddenTriggerV2} from './v2/HiddenTriggerV2';
import {Test3} from './v3/Test3';
import {HiddenTriggerV3} from './v3/HiddenTriggerV3';
import {DURATION3, FPS3} from './v3/theme3';
import {HiddenTriggerV4} from './v4/HiddenTriggerV4';
import {HiddenTriggerV5} from './v5/HiddenTriggerV5';
import {W, H, FPS, DURATION} from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="HiddenTriggerV1" component={HiddenTrigger} durationInFrames={DURATION} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false}} />
    <Composition id="HiddenTriggerV2" component={HiddenTriggerV2} durationInFrames={DURATION} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false}} />
    <Composition id="HiddenTriggerV3" component={HiddenTriggerV3} durationInFrames={DURATION3} fps={FPS3} width={W} height={H} defaultProps={{audio: 'mix' as string | false}} />
    <Composition id="HiddenTriggerV4" component={HiddenTriggerV4} durationInFrames={DURATION3} fps={FPS3} width={W} height={H} defaultProps={{audio: 'mix' as string | false}} />
    <Composition id="HiddenTriggerV5" component={HiddenTriggerV5} durationInFrames={DURATION3} fps={FPS3} width={W} height={H} defaultProps={{audio: 'mix' as string | false}} />
    <Still id="V3ArtTest" component={Test3} width={W} height={H} defaultProps={{cam: {x: 560, d: 0, h: 600, z: 0.75, e: 20, ay: 860}, pose: {x: 790, h: 509, phi: 90}}} />
    <Still id="HiddenTriggerCover" component={Cover} width={W} height={H} />
  </>
);
