import React from 'react';
import {Composition, Still} from 'remotion';
import './fonts';
import {TL} from './lib/timeline';
import {Main} from './Main';
import {KitRoom} from './dev/KitRoom';
import {KitOptics} from './dev/KitOptics';
import {KitCast} from './dev/KitCast';
import {KitWarehouse} from './dev/KitWarehouse';
import {KitV2} from './dev/KitV2';
import {ThumbA, ThumbB, ThumbC, ThumbD} from './Thumbnails';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={TL.durationInFrames} fps={30} width={1920} height={1080} defaultProps={{audio: 'mix' as const}} />
    <Composition id="Preview" component={Main} durationInFrames={TL.durationInFrames} fps={30} width={1920} height={1080} defaultProps={{audio: 'none' as const}} />
    <Composition id="KitRoom" component={KitRoom} durationInFrames={240} fps={30} width={1920} height={1080} />
    <Composition id="KitOptics" component={KitOptics} durationInFrames={240} fps={30} width={1920} height={1080} />
    <Composition id="KitCast" component={KitCast} durationInFrames={240} fps={30} width={1920} height={1080} />
    <Composition id="KitWarehouse" component={KitWarehouse} durationInFrames={240} fps={30} width={1920} height={1080} />
    <Composition id="KitV2" component={KitV2} durationInFrames={420} fps={30} width={1920} height={1080} />
    <Still id="ThumbA" component={ThumbA} width={1920} height={1080} />
    <Still id="ThumbB" component={ThumbB} width={1920} height={1080} />
    <Still id="ThumbC" component={ThumbC} width={1920} height={1080} />
    <Still id="ThumbD" component={ThumbD} width={1920} height={1080} />
  </>
);
