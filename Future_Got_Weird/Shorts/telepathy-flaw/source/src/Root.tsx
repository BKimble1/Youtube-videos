import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import {TOTAL} from './lib/timeline';
import {Lab} from './v2/Lab';
import {Film2} from './v2/Film2';
import {TOTAL2} from './v2/choreo2';
import {Film3} from './v3/Film3';
import {TOTAL3} from './v3/choreo3';
import {Lab4} from './v4/lab/Lab4';
import {Film4} from './v4/Film4';
import {TOTAL4} from './v4/plan4';
import {Lab5} from './v5/lab/Lab5';
import {Lab6} from './v6/lab/Lab6';
import {Film5} from './v5/Film5';
import {Film6} from './v6/Film6';
import {TOTAL4 as TOTAL5} from './v5/plan5';
import {TOTAL4 as TOTAL6} from './v6/plan6';

export const Root: React.FC = () => (
  <>
    <Composition id="TelepathyFlaw" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{captions: true}} />
    <Composition id="TelepathyFlawClean" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{captions: false}} />
    <Composition id="TelepathyFlawV2" component={Film2} durationInFrames={TOTAL2} fps={30} width={1080} height={1920} defaultProps={{captions: true}} />
    <Composition id="TelepathyFlawV2Clean" component={Film2} durationInFrames={TOTAL2} fps={30} width={1080} height={1920} defaultProps={{captions: false}} />
    <Composition id="TelepathyFlawV3" component={Film3} durationInFrames={TOTAL3} fps={30} width={1080} height={1920} defaultProps={{captions: true}} />
    <Composition id="TelepathyFlawV3Clean" component={Film3} durationInFrames={TOTAL3} fps={30} width={1080} height={1920} defaultProps={{captions: false}} />
    <Composition id="TelepathyFlawV4" component={Film4} durationInFrames={TOTAL4} fps={30} width={1080} height={1920} defaultProps={{captions: true}} />
    <Composition id="TelepathyFlawV4Clean" component={Film4} durationInFrames={TOTAL4} fps={30} width={1080} height={1920} defaultProps={{captions: false}} />
    <Composition id="V4Lab" component={Lab4 as React.FC<any>} durationInFrames={30} fps={30} width={1080} height={1920} defaultProps={{scene: 'heads'}} />
    <Composition id="TelepathyFlawV5" component={Film5} durationInFrames={TOTAL5} fps={30} width={1080} height={1920} defaultProps={{captions: true}} />
    <Composition id="TelepathyFlawV5Clean" component={Film5} durationInFrames={TOTAL5} fps={30} width={1080} height={1920} defaultProps={{captions: false}} />
    <Composition id="V5Lab" component={Lab5 as React.FC<any>} durationInFrames={30} fps={30} width={1080} height={1920} defaultProps={{scene: 'heads'}} />
    <Composition id="TelepathyFlawV6" component={Film6} durationInFrames={TOTAL6} fps={30} width={1080} height={1920} defaultProps={{captions: true}} />
    <Composition id="TelepathyFlawV6Clean" component={Film6} durationInFrames={TOTAL6} fps={30} width={1080} height={1920} defaultProps={{captions: false}} />
    <Composition id="V6Lab" component={Lab6 as React.FC<any>} durationInFrames={30} fps={30} width={1080} height={1920} defaultProps={{scene: 'heads'}} />
    <Composition id="V2Lab" component={Lab as React.FC<any>} durationInFrames={30} fps={30} width={1080} height={1920} defaultProps={{scene: 'column'}} />
  </>
);
