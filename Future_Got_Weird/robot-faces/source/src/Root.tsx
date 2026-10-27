import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {RobotSheet} from './dev/Sheets';
import {ArmSheet} from './dev/Arms';
import {Film, FilmStill, Sheet} from './Film';
import {FPS, FRAMES, H, W} from './lib/core';
import {Film2, Sheet2, ShotSheet, Still2} from './v2/Film2';
import {Dev2} from './v2/dev2';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="RobotFaces" component={Film} durationInFrames={FRAMES} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix' as string | false}} />
    <Still id="FilmStill" component={FilmStill} width={W} height={H} defaultProps={{t: 0}} />
    <Still id="Sheet" component={Sheet} width={W} height={H} defaultProps={{ts: [0], cols: 4}} />
    <Composition id="RobotFacesFinal" component={Film2} durationInFrames={6400} fps={FPS} width={W} height={H} defaultProps={{audio: 'mix_v2' as string | false}} />
    <Still id="Still2" component={Still2} width={W} height={H} defaultProps={{t: 0}} />
    <Still id="Sheet2" component={Sheet2} width={W} height={H} defaultProps={{ts: [0], cols: 4}} />
    <Still id="ShotSheet" component={ShotSheet} width={W} height={H} defaultProps={{page: 0, at: 0.5}} />
    <Still id="Dev2" component={Dev2} width={W} height={H} />
    <Still id="ArmSheet" component={ArmSheet} width={1920} height={1080} />
    <Still id="RobotSheet" component={RobotSheet} width={1920} height={1080} />
  </>
);
