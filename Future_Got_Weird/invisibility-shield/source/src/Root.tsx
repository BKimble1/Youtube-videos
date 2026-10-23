import React from 'react';
import {Composition, Still} from 'remotion';
import {Film, FilmStill} from './Film';
import {FPS, FRAMES, H, W} from './world';
import {ModelSheet} from './v2/ModelSheet';
import {Test2} from './v2/Test2';
import {FilmV2, StillV2} from './v2/FilmV2';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="InvisibilityShield" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0, captions: false} as {t: number; captions: boolean}} />
    <Composition id="InvisibilityShieldV2" component={FilmV2} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v2' as string | false, captions: true}} />
    <Still id="StillV2" component={StillV2} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="Test2" component={Test2} width={W} height={H} defaultProps={{cam: 'ots'}} />
    <Still id="ModelSheet" component={ModelSheet} width={W} height={H} defaultProps={{row: 0}} />
  </>
);
