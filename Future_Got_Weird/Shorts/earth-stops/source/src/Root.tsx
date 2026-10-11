import React from 'react';
import {Composition, Still} from 'remotion';
import {H, W} from './theme';
import {PoseLab} from './opening/PoseLab';
import {Opening} from './opening/Opening';
import {FPS, N} from './opening/choreo';

export const Root: React.FC = () => (
  <>
    <Still id="PoseLab" component={PoseLab} width={W} height={H} />
    {/* E-A opening prototype: 90 frames = 3.0 s at 30 fps, native 1080x1920. The sound version is the same picture muxed with the synthesized Foley (see tools/). */}
    <Composition id="OpeningEA" component={Opening} width={W} height={H} fps={FPS} durationInFrames={N} defaultProps={{marker: true, streaks: true, ghost: false}} />
    <Composition id="OpeningEA-Bike" component={Opening} width={W} height={H} fps={FPS} durationInFrames={N} defaultProps={{marker: true, streaks: true, bike: true}} />
    {/* direction A/B test variants (frame-0 stills only) */}
    <Composition id="DirTest-Trail" component={Opening} width={W} height={H} fps={FPS} durationInFrames={N} defaultProps={{marker: false, streaks: true, ghost: true, armMode: 'trail' as const}} />
    <Composition id="DirTest-Brace" component={Opening} width={W} height={H} fps={FPS} durationInFrames={N} defaultProps={{marker: false, streaks: true, ghost: true, armMode: 'brace' as const}} />
    <Composition id="DirTest-NoGhost" component={Opening} width={W} height={H} fps={FPS} durationInFrames={N} defaultProps={{marker: false, streaks: true, ghost: false, armMode: 'up' as const}} />
    <Composition id="DirTest-MarkCenter" component={Opening} width={W} height={H} fps={FPS} durationInFrames={N} defaultProps={{marker: true, streaks: true, ghost: false, markerPos: 'center' as const}} />
    <Composition id="DirTest-MarkRight" component={Opening} width={W} height={H} fps={FPS} durationInFrames={N} defaultProps={{marker: true, streaks: true, ghost: false, markerPos: 'right' as const}} />
    <Composition id="OpeningEA-NoMarker" component={Opening} width={W} height={H} fps={FPS} durationInFrames={N} defaultProps={{marker: false, streaks: true, ghost: false}} />
  </>
);
