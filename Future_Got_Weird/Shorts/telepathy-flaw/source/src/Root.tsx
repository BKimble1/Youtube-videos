import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import {TOTAL} from './lib/timeline';
import {Lab} from './v2/Lab';
import {Film2} from './v2/Film2';
import {TOTAL2} from './v2/choreo2';

export const Root: React.FC = () => (
  <>
    <Composition id="TelepathyFlaw" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{captions: true}} />
    <Composition id="TelepathyFlawClean" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{captions: false}} />
    <Composition id="TelepathyFlawV2" component={Film2} durationInFrames={TOTAL2} fps={30} width={1080} height={1920} defaultProps={{captions: true}} />
    <Composition id="TelepathyFlawV2Clean" component={Film2} durationInFrames={TOTAL2} fps={30} width={1080} height={1920} defaultProps={{captions: false}} />
    <Composition id="V2Lab" component={Lab as React.FC<any>} durationInFrames={30} fps={30} width={1080} height={1920} defaultProps={{scene: 'column'}} />
  </>
);
