import React from 'react';
import {Composition, Still} from 'remotion';
import {HiddenTrigger} from './HiddenTrigger';
import {Cover} from './Cover';
import {W, H, FPS, DURATION} from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="HiddenTriggerV1" component={HiddenTrigger} durationInFrames={DURATION} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false}} />
    <Still id="HiddenTriggerCover" component={Cover} width={W} height={H} />
  </>
);
