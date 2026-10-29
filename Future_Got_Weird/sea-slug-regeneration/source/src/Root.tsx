import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {FPS, FRAMES, H, W} from './lib';
import {ModelBig, ModelSheet} from './dev/ModelSheet';
import {Film, Picture, Sheet} from './Film';

const FrameStill: React.FC<{f: number; captions: boolean}> = ({f, captions}) => <Picture f={f} captions={captions} />;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="SeaSlugV1" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="Frame" component={FrameStill} width={W} height={H} defaultProps={{f: 0, captions: true}} />
    <Still id="Sheet" component={Sheet} width={W} height={H} defaultProps={{fs: [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 39, 45, 51, 57], captions: true}} />
    <Still id="ModelSheet" component={ModelSheet} width={W} height={H} />
    <Still id="ModelBig" component={ModelBig} width={W} height={H} defaultProps={{tilt: 80, zoom: 11, grow: undefined as number | undefined, xray: 0}} />
  </>
);
