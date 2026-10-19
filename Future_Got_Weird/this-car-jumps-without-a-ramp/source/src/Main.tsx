// The episode timeline. Each scene is a pure function of the global time t (seconds); scenes hand over on matched
// action or behind an object that fills the frame, never on a panel.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C} from './theme';
import {FPS} from './cues';
import {Stage} from './kit/stage';
import {TyreWall} from './kit/wipes';
import {seg} from './kit/util';
import {Launch} from './shots/Launch';
import {Bend} from './shots/Bend';
import {SideBrake, BRAKE_IN} from './shots/BrakeRough';
import {Cabin, CABIN_OUT} from './shots/Cabin';
import {Callback, CALLBACK_IN, CALLBACK_OUT} from './shots/Callback';
import {Closing} from './shots/Closing';

export type MainProps = {audio: false | 'narration' | 'mix'};

// the tyre wall whips across the lens; the side view is replaced by the overhead while it fills the frame
export const WIPE1 = {a: 41.5, b: 42.5, cut: 42.0};
// second tyre wall: the side view of the brake scene gives way to the cabin scene
export const WIPE2 = {a: 92.85, b: 93.85, cut: 93.35};

export const Main: React.FC<MainProps> = ({audio}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {t < WIPE1.cut && <Launch t={t} />}
      {t >= WIPE1.cut && t < BRAKE_IN && <Bend t={t} />}
      {t >= BRAKE_IN && t < WIPE2.cut && <SideBrake t={t} />}
      {t >= WIPE2.cut && t < CABIN_OUT && <Cabin t={t} frame={f} />}
      {t >= CALLBACK_IN && t < CALLBACK_OUT && <Callback t={t} />}
      {t >= CALLBACK_OUT && <Closing t={t} />}
      {t > WIPE1.a && t < WIPE1.b && (
        <Stage bg="transparent">
          <TyreWall p={seg(t, WIPE1.a, WIPE1.b)} />
        </Stage>
      )}
      {t > WIPE2.a && t < WIPE2.b && (
        <Stage bg="transparent">
          <TyreWall p={seg(t, WIPE2.a, WIPE2.b)} seed={5} />
        </Stage>
      )}
      {audio === 'narration' && <Audio src={staticFile('audio/narration.mp3')} />}
      {audio === 'mix' && <Audio src={staticFile('audio/mix.mp3')} />}
    </AbsoluteFill>
  );
};
