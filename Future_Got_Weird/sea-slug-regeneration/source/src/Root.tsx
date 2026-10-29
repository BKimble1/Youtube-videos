import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {FPS, FRAMES, H, W} from './lib';
import {ModelBig, ModelSheet} from './dev/ModelSheet';
import {Film, Picture, Sheet} from './Film';
import {Model2, Model2Sheet} from './v2/dev/Model2';
import {Film2, Picture2, Sheet2} from './v2/Film2';

const FrameStill: React.FC<{f: number; captions: boolean}> = ({f, captions}) => <Picture f={f} captions={captions} />;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="SeaSlugV1" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="Frame" component={FrameStill} width={W} height={H} defaultProps={{f: 0, captions: true}} />
    <Still id="Sheet" component={Sheet} width={W} height={H} defaultProps={{fs: [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 39, 45, 51, 57], captions: true}} />
    <Still id="ModelSheet" component={ModelSheet} width={W} height={H} />
    <Composition id="SeaSlugV2" component={Film2} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v2' as string | false, captions: true}} />
    <Still id="Frame2" component={({f, captions}: {f: number; captions: boolean}) => <Picture2 f={f} captions={captions} />} width={W} height={H} defaultProps={{f: 0, captions: true}} />
    <Still id="Sheet2" component={Sheet2} width={W} height={H} defaultProps={{fs: [0, 9, 18, 30], captions: true}} />
    <Still id="Model2" component={Model2} width={W} height={H} defaultProps={{i: 1}} />
    <Still id="Model2Sheet" component={Model2Sheet} width={W} height={H} />
    <Still id="ModelBig" component={ModelBig} width={W} height={H} defaultProps={{tilt: 80, zoom: 11, grow: undefined as number | undefined, xray: 0}} />
  </>
);
