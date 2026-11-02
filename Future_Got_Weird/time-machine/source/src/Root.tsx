import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FRAMES} from './lib';
import {Film, Sheet} from './Film';
import {CharTest} from './dev/CharTest';
import {Film2, Sheet2} from './v2/Film2';
import {Film3, Sheet3} from './v3/Film3';
import {Film4, Sheet4} from './v4/Film4';
import {FRAMES4} from './v4/warp';
import {Film5, Sheet5} from './v5/Film5';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TimeMachineV1" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: 'mix_v1' as string | false, captions: true}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 9, 18, 30, 42, 54, 66, 72], captions: true, cols: 4}} />
    <Composition id="CharTest" component={CharTest} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="TimeMachineV2" component={Film2} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: 'mix_v2' as string | false, captions: true}} />
    <Composition id="Sheet2" component={Sheet2} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 9, 18, 30, 42, 54, 66, 72], captions: true, cols: 4}} />
    <Composition id="TimeMachineV3" component={Film3} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: 'mix_v3' as string | false, captions: true}} />
    <Composition id="Sheet3" component={Sheet3} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 30, 60, 90], captions: true, cols: 4}} />
    <Composition id="TimeMachineV4" component={Film4} durationInFrames={FRAMES4} fps={30} width={1080} height={1920} defaultProps={{audio: 'mix_v4' as string | false, captions: true}} />
    <Composition id="TimeMachineV5" component={Film5} durationInFrames={FRAMES4} fps={30} width={1080} height={1920} defaultProps={{audio: 'mix_v4' as string | false, captions: true}} />
    <Composition id="Sheet5" component={Sheet5} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 30, 60, 90], captions: true, cols: 4}} />
    <Composition id="Sheet4" component={Sheet4} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 30, 60, 90], captions: true, cols: 4}} />
  </>
);
