import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {Film, FilmProps} from './Film';
import {Sheet} from './Sheet';
import {Cover} from './Cover';
import {FRAMES, FPS} from './lib';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="MouseSkin" component={Film} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{audio: 'mix', captions: true} as FilmProps} />
    <Composition id="FilmStill" component={Film} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{audio: null, captions: true} as FilmProps} />
    <Still id="Cover" component={Cover} width={1080} height={1920} defaultProps={{f: 120, title: false}} />
    <Still id="Sheet" component={Sheet} width={1920} height={1440} defaultProps={{frames: [0, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 700], captions: true}} />
  </>
);
