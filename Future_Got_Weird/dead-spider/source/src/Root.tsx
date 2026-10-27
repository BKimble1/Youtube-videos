import React from 'react';
import {Composition, Still} from 'remotion';
import {RigSheet} from './dev/RigSheet';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES, H, W} from './lib';
import './fonts';
import {Film2, Sheet2} from './v2/Film2';
import {FRAMES as FRAMES2} from './v2/lib2';
import {Film3, Sheet3} from './v3/Film3';
import {Film3 as Film4, Sheet3 as Sheet4} from './v4/Film3';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="DeadSpider" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="Sheet" component={Sheet} width={W} height={1920} defaultProps={{fs: [0, 10, 20, 30], captions: false}} />
    <Composition id="DeadSpiderV2" component={Film2} durationInFrames={FRAMES2} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v2' as string | false, captions: true}} />
    <Still id="Sheet2" component={Sheet2} width={W} height={1920} defaultProps={{fs: [0, 10, 20, 30], captions: false}} />
    <Composition id="DeadSpiderV3" component={Film3} durationInFrames={FRAMES2} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v3' as string | false, captions: true}} />
    <Still id="Sheet3" component={Sheet3} width={W} height={1920} defaultProps={{fs: [0, 10, 20, 30], captions: false}} />
    <Composition id="DeadSpiderV4" component={Film4} durationInFrames={FRAMES2} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v4' as string | false, captions: true}} />
    <Still id="Sheet4" component={Sheet4} width={W} height={1920} defaultProps={{fs: [0, 10, 20, 30], captions: false}} />
    <Still id="RigSheet" component={RigSheet} width={1080} height={1920} defaultProps={{es: [0, 0.5, 1]}} />
  </>
);
