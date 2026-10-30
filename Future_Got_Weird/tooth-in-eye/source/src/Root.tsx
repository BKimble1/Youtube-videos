import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FRAMES} from './lib';
import {Film, Sheet} from './Film';
import {ModelSheet} from './dev/ModelSheet';
import {P2Test} from './dev/P2Test';
import {F2Test} from './dev/F2Test';

// V5 (V4's source is at commit 483f2bef, V3's at 50ef7a50, V2's at 82638d8d, V1's at 73ce4c9d)
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ToothEyeV5" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: 'mix_v5' as string | false, captions: true}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 6, 12, 24, 40, 60, 70, 80, 90, 100, 115, 130, 150, 170, 190, 210], captions: true, cols: 4}} />
    <Composition id="ModelSheet" component={ModelSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="P2Test" component={P2Test} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{z: 60, x: 14, y: 0, win: 1, smile: 0, brow: 0, open: 0, tissue: 0.25}} />
    <Composition id="F2Test" component={F2Test} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{mode: 'face'}} />
  </>
);
