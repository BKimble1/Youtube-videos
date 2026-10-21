import React from 'react';
import {Composition, Still} from 'remotion';
import {HiddenTrigger} from './HiddenTrigger';
import {Cover} from './Cover';
import {HiddenTriggerV2} from './v2/HiddenTriggerV2';
import {W, H, FPS, DURATION} from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="HiddenTriggerV1" component={HiddenTrigger} durationInFrames={DURATION} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false}} />
    <Composition id="HiddenTriggerV2" component={HiddenTriggerV2} durationInFrames={DURATION} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false}} />
    <Still id="HiddenTriggerCover" component={Cover} width={W} height={H} />
  </>
);
