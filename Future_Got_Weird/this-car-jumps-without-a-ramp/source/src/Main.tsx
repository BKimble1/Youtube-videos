// The episode timeline. Each scene is a pure function of the global time t (seconds); scenes hand over on matched
// action or behind an object that fills the frame, never on a panel.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C} from './theme';
import {FPS} from './cues';
import {Stage} from './kit/stage';
import {TyreWall} from './kit/wipes';
import {seg, smooth} from './kit/util';
import {Launch} from './shots/Launch';
import {Bend} from './shots/Bend';
import {SideBrake, BRAKE_IN} from './shots/BrakeRough';
import {Cabin, CABIN_OUT} from './shots/Cabin';
import {Callback, CALLBACK_IN, CALLBACK_OUT} from './shots/Callback';
import {Closing} from './shots/Closing';

export type MainProps = {audio: false | 'narration' | 'mix'};

// the tyre wall whips across the lens; the side view is replaced by the overhead while it fills the frame
export const WIPE1 = {a: 41.5, b: 42.5, cut: 42.0};
// the side view of the brake scene gives way to the cabin scene on a speed whip: the car's own motion smears the frame sideways
export const WIPE2 = {a: 92.85, b: 93.85, cut: 93.35};

/** Horizontal speed smear: the frame is stretched sideways and nudged along the direction of travel, peaking at the cut. */
const Whip: React.FC<{k: number; dir: 1 | -1; children: React.ReactNode}> = ({k, dir, children}) => (
  <AbsoluteFill style={k > 0.005 ? {filter: 'url(#whip-blur)', transform: `translateX(${dir * -90 * k}px) scale(${1 + 0.34 * k})`} : undefined}>
    {k > 0.005 && (
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id="whip-blur" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${(84 * k * k).toFixed(1)} 0`} edgeMode="duplicate" />
        </filter>
      </svg>
    )}
    {children}
  </AbsoluteFill>
);

export const Main: React.FC<MainProps> = ({audio}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const whipK = 1 - smooth(seg(Math.abs(t - WIPE2.cut), 0, 0.34));
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {t < WIPE1.cut && <Launch t={t} />}
      {t >= WIPE1.cut && t < BRAKE_IN && <Bend t={t} />}
      {t >= BRAKE_IN && t < WIPE2.cut && <Whip k={whipK} dir={-1}><SideBrake t={t} /></Whip>}
      {t >= WIPE2.cut && t < CABIN_OUT && <Whip k={whipK} dir={1}><Cabin t={t} frame={f} /></Whip>}
      {t >= CALLBACK_IN && t < CALLBACK_OUT && <Callback t={t} />}
      {t >= CALLBACK_OUT && <Closing t={t} />}
      {t > WIPE1.a && t < WIPE1.b && (
        <Stage bg="transparent">
          <TyreWall p={seg(t, WIPE1.a, WIPE1.b)} />
        </Stage>
      )}
      {audio === 'narration' && <Audio src={staticFile('audio/narration.mp3')} />}
      {audio === 'mix' && <Audio src={staticFile('audio/mix.mp3')} />}
    </AbsoluteFill>
  );
};
