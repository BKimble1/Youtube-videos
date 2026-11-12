import React from 'react';
import {Composition, useCurrentFrame, AbsoluteFill} from 'remotion';
import './fonts';
import {RobotWorld} from './RobotWorld';
import {FRAMES, FPS} from './timing';
import {Film} from './Film';
import {FilmV2} from './v2/Film';
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
    <Composition id="WorldAV2" component={AOnlyV2} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="WorldA" component={AOnly} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} />
  </>
);
