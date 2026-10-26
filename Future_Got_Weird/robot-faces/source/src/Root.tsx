import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {RobotSheet} from './dev/Sheets';
import {ArmSheet} from './dev/Arms';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES, H, W} from './lib/core';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="RobotFaces" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0}} />
    <Still id="Sheet" component={Sheet} width={W} height={H} defaultProps={{ts: [0], cols: 4}} />
    <Still id="ArmSheet" component={ArmSheet} width={1920} height={1080} />
    <Still id="RobotSheet" component={RobotSheet} width={1920} height={1080} />
  </>
);
