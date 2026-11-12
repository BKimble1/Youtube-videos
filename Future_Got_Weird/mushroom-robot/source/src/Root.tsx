import React from 'react';
import {Composition, useCurrentFrame, AbsoluteFill} from 'remotion';
import './fonts';
import {RobotWorld} from './RobotWorld';
import {FRAMES, FPS} from './timing';
import {Film} from './Film';
import {FilmV2} from './v2/Film';
import {FilmV3} from './v3/Film';
import {DiagWalk} from './v4/Diag';
import {FilmV4} from './v4/Film';
import {RobotWorld as RobotWorldV2} from './v2/RobotWorld';

const AOnly: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#000'}}><RobotWorld t={f / FPS} /></AbsoluteFill>;
};
const AOnlyV2: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#000'}}><RobotWorldV2 t={f / FPS} /></AbsoluteFill>;
};
export const Root: React.FC = () => (
  <>
    <Composition id="MushroomRobotV1" component={Film} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{audio: 'mix_v1', captions: false}} />
    <Composition id="MushroomRobotV2" component={FilmV2} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{audio: 'mix_v2'}} />
    <Composition id="MushroomRobotV3" component={FilmV3} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{audio: 'mix_v3'}} />
    <Composition id="MushroomRobotV4" component={FilmV4} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{audio: 'mix_v4'}} />
    <Composition id="DiagA1" component={DiagWalk} durationInFrames={210} fps={FPS} width={1080} height={1920} defaultProps={{t0: 0, yawRel: 40, pitch: 24, dist: 40}} />
    <Composition id="DiagA2" component={DiagWalk} durationInFrames={270} fps={FPS} width={1080} height={1920} defaultProps={{t0: 12.5, yawRel: -100, pitch: 12, dist: 36}} />
    <Composition id="DiagA3" component={DiagWalk} durationInFrames={180} fps={FPS} width={1080} height={1920} defaultProps={{t0: 17.4, yawRel: 6, pitch: 6, dist: 26}} />
    <Composition id="WorldAV2" component={AOnlyV2} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="WorldA" component={AOnly} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} />
  </>
);
