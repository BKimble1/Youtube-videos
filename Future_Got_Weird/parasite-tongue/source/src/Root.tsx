import React from 'react';
import {Composition} from 'remotion';
import {IsoTest} from './dev/IsoTest';
import {Film, Sheet} from './Film';
import {FRAMES} from './lib';
import {FrontTest} from './dev/FrontTest';
import {SideTest} from './dev/SideTest';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ParasiteTongue" component={Film} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{audio: false as string | false}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 10, 25, 45], cols: 4}} />
    <Composition id="IsoTest" component={IsoTest} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="FrontTest" component={FrontTest} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{eye: [-100, 0, 22] as [number, number, number], target: [10, 0, 14] as [number, number, number], f: 1500, g: 0.9, tongue: 0, tuck: 0}} />
    <Composition id="SideTest" component={SideTest} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{c: [62, 8] as [number, number], D: 230, cut: 0, flare: 0.3, shrink: 1, k: 0, juv: [100, -22, -8] as [number, number, number] | null}} />
  </>
);
