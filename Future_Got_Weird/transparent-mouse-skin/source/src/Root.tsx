import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {Film, FilmProps} from './Film';
import {Sheet} from './Sheet';
import {Cover} from './Cover';
import {FilmV2, FilmV2Props} from './v2/FilmV2';
import {FilmV3, FilmV3Props} from './v3/FilmV3';
import {FRAMES, FPS} from './lib';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="MouseSkin" component={Film} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{audio: 'mix', captions: true} as FilmProps} />
    <Composition id="FilmStill" component={Film} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{audio: null, captions: true} as FilmProps} />
    <Still id="Cover" component={Cover} width={1080} height={1920} defaultProps={{f: 120, title: false}} />
    <Composition id="MouseSkinV2" component={FilmV2} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{audio: 'mix_v2', captions: true} as FilmV2Props} />
    <Composition id="MouseSkinV3" component={FilmV3} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{audio: 'mix_v2', captions: true} as FilmV3Props} />
    <Composition id="FilmStillV2" component={FilmV2} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{audio: null, captions: true} as FilmV2Props} />
    <Still id="Sheet" component={Sheet} width={1920} height={1440} defaultProps={{frames: [0, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 700], captions: true}} />
  </>
);
