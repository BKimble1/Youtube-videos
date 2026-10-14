import React from 'react';
import {Composition} from 'remotion';
import {AftTest, DispTest, J3Test, RigCollapse, RigElbow} from './dev/RigTest';
import {LabMan, LabParts} from './dev/Lab';
import {DeviceTest} from './dev/DeviceTest';
import {Film} from './Film';
import {TOTAL} from './lib/timeline3';

export const Root: React.FC = () => (
  <>
    <Composition id="DeathClock" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{captions: true}} />
    <Composition id="DeathClockClean" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{captions: false}} />
    <Composition id="DeviceTest" component={DeviceTest} durationInFrames={3} fps={30} width={1080} height={1920} />
    <Composition id="RigCollapse" component={RigCollapse} durationInFrames={120} fps={30} width={1080} height={1920} />
    <Composition id="J3Test" component={J3Test} durationInFrames={760} fps={30} width={1080} height={1920} />
    <Composition id="DispTest" component={DispTest} durationInFrames={930} fps={30} width={1080} height={1920} />
    <Composition id="AftTest" component={AftTest} durationInFrames={1350} fps={30} width={1080} height={1920} />
    <Composition id="RigElbow" component={RigElbow} durationInFrames={8} fps={30} width={1080} height={1920} />
    <Composition id="LabMan" component={LabMan} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="LabParts" component={LabParts} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
