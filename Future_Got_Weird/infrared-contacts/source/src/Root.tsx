import React from 'react';
import {Composition, Still} from 'remotion';
import {W, H, FPS, FRAMES} from './lib';
import {InfraredContacts, FilmStill} from './InfraredContacts';
import {ArtTest, SecTest, TrainTest} from './dev/ArtTest';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="InfraredContacts" component={InfraredContacts} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false, captions: true}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0, captions: false}} />
    <Still id="ArtTest" component={ArtTest} width={W} height={H} defaultProps={{z: 2.4, cx: 0, cy: 0, pose: {}, body: false} as any} />
    <Still id="SecTest" component={SecTest} width={W} height={H} defaultProps={{zl: 4, cx: 30, cy: 0, st: {}} as any} />
    <Still id="TrainTest" component={TrainTest} width={W} height={H} defaultProps={{t: 1, aim: 1}} />
  </>
);
