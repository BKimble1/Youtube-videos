import React from 'react';
import {Composition} from 'remotion';
import {LabMan, LabParts} from './dev/Lab';
import {OpeningTest} from './dev/OpeningTest';
import {CloseTest} from './dev/CloseTest';
import {XsTest} from './dev/XsTest';
import {VsTest} from './dev/VsTest';
import {BodyTest} from './dev/BodyTest';
import {Film} from './Film';
import {TOTAL} from './lib/timeline';

export const Root: React.FC = () => (
  <>
    <Composition id="DeathClock" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{captions: true}} />
    <Composition id="DeathClockClean" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{captions: false}} />
    <Composition id="LabMan" component={LabMan} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="LabParts" component={LabParts} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="OpeningTest" component={OpeningTest} durationInFrames={70} fps={30} width={1080} height={1920} />
    <Composition id="CloseTest" component={CloseTest} durationInFrames={5} fps={30} width={1080} height={1920} />
    <Composition id="XsTest" component={XsTest} durationInFrames={400} fps={30} width={1080} height={1920} />
    <Composition id="VsTest" component={VsTest} durationInFrames={420} fps={30} width={1080} height={1920} />
    <Composition id="BodyTest" component={BodyTest} durationInFrames={560} fps={30} width={1080} height={1920} />
  </>
);
