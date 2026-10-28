import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {RigTest} from './dev/RigTest';
import {H, W} from './eng/v3';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES} from './story/time';
import {Film2, FilmStill2, Sheet2} from './v2/Film2';
import {Film3, FilmStill3, Sheet3} from './v3/Film3';

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
    <Still id="RigTest" component={RigTest} width={W} height={H} defaultProps={{}} />
  </>
);
