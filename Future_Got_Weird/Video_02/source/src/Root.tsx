import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {TL} from './lib/timeline';
import {Main} from './Main';
import {KitRoom} from './dev/KitRoom';
import {KitOptics} from './dev/KitOptics';
import {KitCast} from './dev/KitCast';
import {KitWarehouse} from './dev/KitWarehouse';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={TL.durationInFrames} fps={30} width={1920} height={1080} defaultProps={{audio: 'mix' as const}} />
    <Composition id="Preview" component={Main} durationInFrames={TL.durationInFrames} fps={30} width={1920} height={1080} defaultProps={{audio: 'none' as const}} />
    <Composition id="KitRoom" component={KitRoom} durationInFrames={240} fps={30} width={1920} height={1080} />
    <Composition id="KitOptics" component={KitOptics} durationInFrames={240} fps={30} width={1920} height={1080} />
    <Composition id="KitCast" component={KitCast} durationInFrames={240} fps={30} width={1920} height={1080} />
    <Composition id="KitWarehouse" component={KitWarehouse} durationInFrames={240} fps={30} width={1920} height={1080} />
  </>
);
