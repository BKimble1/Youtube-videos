import React from 'react';
import {Composition} from 'remotion';
import {LabMan, LabParts} from './dev/Lab';
import {DeviceTest} from './dev/DeviceTest';
import {JourneyTest} from './dev/JourneyTest';
import {Film} from './Film';
import {TOTAL} from './lib/timeline';

export const Root: React.FC = () => (
  <>
    <Composition id="DeathClock" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{captions: true}} />
    <Composition id="DeathClockClean" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{captions: false}} />
    <Composition id="JourneyTest" component={JourneyTest} durationInFrames={900} fps={30} width={1080} height={1920} />
    <Composition id="DeviceTest" component={DeviceTest} durationInFrames={3} fps={30} width={1080} height={1920} />
    <Composition id="LabMan" component={LabMan} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="LabParts" component={LabParts} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
