import React from 'react';
import {Composition, Still} from 'remotion';
import {FPS, FRAMES, H, W} from './world';
import {ModelSheet} from './ModelSheet';
import {Test} from './Test';
import {Film, FilmStill} from './Film';
import {CastSheet} from './v2/CastSheet';
import {Film2, Film2Still} from './v2/Film2';
import {Film3, Film3Still} from './v3/Film3';
import {CastSheet3} from './v3/CastSheet3';
import {CastSheet4} from './v4/CastSheet4';
import {TestV4} from './v4/TestV4';
import {Film4, Film4Still} from './v4/Film4';
import {TestV5} from './v5/TestV5';
import {Film5, Film5Still} from './v5/Film5';
import {RigSheet6} from './v6/RigSheet6';
import {Film6, Film6Still} from './v6/Film6';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="LaserVoices" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="ModelSheet" component={ModelSheet} width={W} height={H} defaultProps={{row: 0}} />
    <Still id="Test" component={Test} width={W} height={H} defaultProps={{t: 0, pos: [-0.6, 2.3, 3.2], tgt: [1.3, 1.1, 0], f: 1100, sec: 0}} />
    <Composition id="LaserVoicesV2" component={Film2} durationInFrames={FRAMES} fps={FPS} width={W} height={H} />
    <Still id="V2Still" component={Film2Still} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Composition id="LaserVoicesV3" component={Film3} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v3' as string | false, captions: true}} />
    <Still id="V3Still" component={Film3Still} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Composition id="LaserVoicesV4" component={Film4} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v4' as string | false, captions: true}} />
    <Still id="V4Still" component={Film4Still} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Composition id="LaserVoicesV5" component={Film5} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v5' as string | false, captions: true}} />
    <Still id="V5Still" component={Film5Still} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Composition id="LaserVoicesV6" component={Film6} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v6' as string | false, captions: true}} />
    <Still id="V6Still" component={Film6Still} width={W} height={H} defaultProps={{t: 0, captions: true}} />
    <Still id="RigSheet6" component={RigSheet6} width={W} height={H} defaultProps={{row: 0}} />
    <Still id="TestV5" component={TestV5} width={W} height={H} defaultProps={{t: 0, pos: [0, 1.6, 0], at: [0, 1.4, 3.5], f: 1100, beam: 0, visitor: false}} />
    <Still id="TestV4" component={TestV4} width={W} height={H} defaultProps={{t: 0, pos: [0, 1.6, 0], at: [0, 1.4, 3.5], f: 1100}} />
    <Still id="V4Cast" component={CastSheet4} width={W} height={H} defaultProps={{row: 0}} />
    <Still id="V3Cast" component={CastSheet3} width={W} height={H} defaultProps={{row: 0}} />
    <Still id="V2Cast" component={CastSheet} width={W} height={H} defaultProps={{row: 0}} />
  </>
);
