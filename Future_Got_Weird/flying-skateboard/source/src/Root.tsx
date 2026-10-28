import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {RigTest} from './dev/RigTest';
import {HeadTest} from './dev/HeadTest';
import {H, W} from './eng/v3';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES} from './story/time';
import {Film2, FilmStill2, Sheet2} from './v2/Film2';
import {Film3, FilmStill3, Sheet3} from './v3/Film3';
import {Film4, FilmStill4, Sheet4} from './v4/Film4';
import {Film5, FilmStill5, Sheet5} from './v5/Film5';
import {Film6, FilmStill6, Sheet6} from './v6/Film6';
import {Film7, FilmStill7, Sheet7} from './v7/Film7';
import {Film8, FilmStill8, Sheet8} from './v8/Film8';
import {FRAMES as FRAMES8} from './v8/time8';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="FlyingSkateboardV1" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v1' as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0, captions: false}} />
    <Still id="Sheet" component={Sheet} width={4320} height={5760} defaultProps={{ts: [0], captions: false}} />
    <Composition id="FlyingSkateboardV2" component={Film2} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v2' as string | false, captions: true}} />
    <Still id="FilmStillV2" component={FilmStill2} width={W} height={H} defaultProps={{t: 0, captions: false}} />
    <Still id="SheetV2" component={Sheet2} width={4320} height={5760} defaultProps={{ts: [0], captions: false}} />
    <Composition id="FlyingSkateboardV3" component={Film3} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v3' as string | false, captions: true}} />
    <Still id="FilmStillV3" component={FilmStill3} width={W} height={H} defaultProps={{t: 0, captions: false}} />
    <Still id="SheetV3" component={Sheet3} width={4320} height={5760} defaultProps={{ts: [0], captions: false}} />
    <Composition id="FlyingSkateboardV4" component={Film4} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v4' as string | false, captions: true}} />
    <Still id="FilmStillV4" component={FilmStill4} width={W} height={H} defaultProps={{t: 0, captions: false}} />
    <Still id="SheetV4" component={Sheet4} width={4320} height={5760} defaultProps={{ts: [0], captions: false}} />
    <Composition id="FlyingSkateboardV5" component={Film5} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v5' as string | false, captions: true}} />
    <Still id="FilmStillV5" component={FilmStill5} width={W} height={H} defaultProps={{t: 0, captions: false}} />
    <Still id="SheetV5" component={Sheet5} width={4320} height={5760} defaultProps={{ts: [0], captions: false}} />
    <Composition id="FlyingSkateboardV6" component={Film6} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v6' as string | false, captions: true}} />
    <Still id="FilmStillV6" component={FilmStill6} width={W} height={H} defaultProps={{t: 0, captions: false}} />
    <Still id="SheetV6" component={Sheet6} width={4320} height={5760} defaultProps={{ts: [0], captions: false}} />
    <Composition id="FlyingSkateboardV7" component={Film7} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v7' as string | false, captions: true}} />
    <Still id="FilmStillV7" component={FilmStill7} width={W} height={H} defaultProps={{t: 0, captions: false}} />
    <Still id="SheetV7" component={Sheet7} width={4320} height={5760} defaultProps={{ts: [0], captions: false}} />
    <Composition id="FlyingSkateboardV8" component={Film8} durationInFrames={FRAMES8} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v8' as string | false, captions: true}} />
    <Still id="FilmStillV8" component={FilmStill8} width={W} height={H} defaultProps={{t: 0, captions: false}} />
    <Still id="SheetV8" component={Sheet8} width={4320} height={5760} defaultProps={{ts: [0], captions: false}} />
    <Still id="HeadTest" component={HeadTest} width={W} height={H} defaultProps={{}} />
    <Still id="RigTest" component={RigTest} width={W} height={H} defaultProps={{}} />
  </>
);
