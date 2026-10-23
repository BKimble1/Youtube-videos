import React from 'react';
import {Composition, Still} from 'remotion';
import {Film, FilmStill} from './Film';
import {FPS, FRAMES, H, W} from './world';
import {ModelSheet} from './v2/ModelSheet';
import {Test2} from './v2/Test2';
import {FilmV2, StillV2} from './v2/FilmV2';
import {ModelSheet3} from './v3/ModelSheet3';
import {FilmV3, StillV3} from './v3/FilmV3';
import {Blocking3} from './v3/Blocking3';
import {ModelSheet4} from './v4/ModelSheet4';
import {Test4} from './v4/Test4';
import {FilmV4, StillV4} from './v4/FilmV4';
import {FilmV5, StillV5} from './v5/FilmV5';
import {FilmV6, StillV6} from './v6/FilmV6';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="InvisibilityShield" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0, captions: false} as {t: number; captions: boolean}} />
    <Composition id="InvisibilityShieldV2" component={FilmV2} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v2' as string | false, captions: true}} />
    <Still id="StillV2" component={StillV2} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="Test2" component={Test2} width={W} height={H} defaultProps={{cam: 'ots'}} />
    <Still id="ModelSheet" component={ModelSheet} width={W} height={H} defaultProps={{row: 0}} />
    <Composition id="InvisibilityShieldV3" component={FilmV3} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v3' as string | false, captions: true}} />
    <Still id="StillV3" component={StillV3} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="Blocking3" component={Blocking3} width={1920} height={1080} defaultProps={{}} />
    <Still id="ModelSheet3" component={ModelSheet3} width={W} height={H} defaultProps={{who: 'w' as 'w' | 'g'}} />
    <Composition id="InvisibilityShieldV4" component={FilmV4} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v4' as string | false, captions: true}} />
    <Still id="StillV4" component={StillV4} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Composition id="InvisibilityShieldV5" component={FilmV5} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v5' as string | false, captions: true}} />
    <Still id="StillV5" component={StillV5} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Composition id="InvisibilityShieldV6" component={FilmV6} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v5' as string | false, captions: true}} />
    <Still id="StillV6" component={StillV6} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="Test4" component={Test4} width={W} height={H} defaultProps={{cam: 'side'}} />
    <Still id="ModelSheet4" component={ModelSheet4} width={W} height={H} defaultProps={{page: 'turn'}} />
  </>
);
