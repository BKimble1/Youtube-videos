import React from 'react';
import {Composition, Still} from 'remotion';
import {H, W} from './theme';
import {PoseLab} from './opening/PoseLab';
import {Opening} from './opening/Opening';
import {FPS, N} from './opening/choreo';
import {PoseLab2} from './v2/PoseLab2';
import {Opening2} from './v2/Opening2';
import {N as N2, FPS as FPS2} from './v2/choreo2';
import {OpeningEC} from './v2/OpeningEC';
import {FPS_EC, N_EC} from './v2/choreoEC';
import {OpeningH1} from './v2/OpeningH1';
import {FPS_H, N_H} from './v2/choreoH';

export const Root: React.FC = () => (
  <>
    <Still id="PoseLab" component={PoseLab} width={W} height={H} />
    <Still id="PoseLab2" component={PoseLab2} width={1920} height={1080} />
    {/* E-A opening prototype: 90 frames = 3.0 s at 30 fps, native 1080x1920. The sound version is the same picture muxed with the synthesized Foley (see tools/). */}
    <Composition id="OpeningEA" component={Opening} width={W} height={H} fps={FPS} durationInFrames={N} defaultProps={{marker: true, streaks: true, ghost: false}} />
    <Composition id="OpeningEA-Bike" component={Opening} width={W} height={H} fps={FPS} durationInFrames={N} defaultProps={{marker: true, streaks: true, bike: true}} />
    {/* direction A/B test variants (frame-0 stills only) */}
    <Composition id="DirTest-Trail" component={Opening} width={W} height={H} fps={FPS} durationInFrames={N} defaultProps={{marker: false, streaks: true, ghost: true, armMode: 'trail' as const}} />
    <Composition id="DirTest-Brace" component={Opening} width={W} height={H} fps={FPS} durationInFrames={N} defaultProps={{marker: false, streaks: true, ghost: true, armMode: 'brace' as const}} />
    <Composition id="DirTest-NoGhost" component={Opening} width={W} height={H} fps={FPS} durationInFrames={N} defaultProps={{marker: false, streaks: true, ghost: false, armMode: 'up' as const}} />
    <Composition id="DirTest-MarkCenter" component={Opening} width={W} height={H} fps={FPS} durationInFrames={N} defaultProps={{marker: true, streaks: true, ghost: false, markerPos: 'center' as const}} />
    <Composition id="DirTest-MarkRight" component={Opening} width={W} height={H} fps={FPS} durationInFrames={N} defaultProps={{marker: true, streaks: true, ghost: false, markerPos: 'right' as const}} />
    {/* v2: side-view hero, recomposed street, camera-brake reveal, bicycle, tapered fluid */}
    <Composition id="EA2" component={Opening2} width={W} height={H} fps={FPS2} durationInFrames={N2} defaultProps={{marker: true}} />
    <Composition id="EA2-NoMarker" component={Opening2} width={W} height={H} fps={FPS2} durationInFrames={N2} defaultProps={{marker: false}} />
    {/* E-C minimal alternative: globe (cause) over the same street scene (effect) */}
    <Composition id="EC1" component={OpeningEC} width={W} height={H} fps={FPS_EC} durationInFrames={N_EC} defaultProps={{marker: true}} />
    <Composition id="EC1-NoMarker" component={OpeningEC} width={W} height={H} fps={FPS_EC} durationInFrames={N_EC} defaultProps={{marker: false}} />
    {/* H1 hybrid hook (E-C cause + E-A v2 street action), 6.0 s */}
    <Composition id="HookH1" component={OpeningH1} width={W} height={H} fps={FPS_H} durationInFrames={N_H} defaultProps={{marker: true, captions: true, graphics: true}} />
    <Composition id="HookH1-Clean" component={OpeningH1} width={W} height={H} fps={FPS_H} durationInFrames={N_H} defaultProps={{marker: false, captions: false, graphics: false}} />
    <Composition id="OpeningEA-NoMarker" component={Opening} width={W} height={H} fps={FPS} durationInFrames={N} defaultProps={{marker: false, streaks: true, ghost: false}} />
  </>
);
