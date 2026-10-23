import React from 'react';
import {Composition, Still} from 'remotion';
import {FPS, FRAMES, H, W} from './world';
import {ModelSheet} from './ModelSheet';
import {Test} from './Test';
import {Film, FilmStill} from './Film';
import {CastSheet} from './v2/CastSheet';
import {Film2, Film2Still} from './v2/Film2';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="LaserVoices" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="ModelSheet" component={ModelSheet} width={W} height={H} defaultProps={{row: 0}} />
    <Still id="Test" component={Test} width={W} height={H} defaultProps={{t: 0, pos: [-0.6, 2.3, 3.2], tgt: [1.3, 1.1, 0], f: 1100, sec: 0}} />
    <Composition id="LaserVoicesV2" component={Film2} durationInFrames={FRAMES} fps={FPS} width={W} height={H} />
    <Still id="V2Still" component={Film2Still} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="V2Cast" component={CastSheet} width={W} height={H} defaultProps={{row: 0}} />
  </>
);
