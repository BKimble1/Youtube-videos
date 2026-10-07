import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {easeInOut} from './lib/anim';
import {SceneOffset} from './lib/SceneFrame';
import {TL} from './lib/timeline';
import {C} from './theme';
import {S1Counter} from './scenes/S1_Counter';
import {S2ShortVersion} from './scenes/S2_ShortVersion';
import {S3Tokens} from './scenes/S3_Tokens';
import {S4Library} from './scenes/S4_Library';
import {S5Record} from './scenes/S5_Record';
import {S6GameShow} from './scenes/S6_GameShow';
import {S7Benchmarks} from './scenes/S7_Benchmarks';
import {S8Helps} from './scenes/S8_Helps';
import {S9Verify} from './scenes/S9_Verify';
import {S10Payoff} from './scenes/S10_Payoff';

export const SCENES: Record<string, React.FC> = {
  S1: S1Counter,
  S2: S2ShortVersion,
  S3: S3Tokens,
  S4: S4Library,
  S5: S5Record,
  S6: S6GameShow,
  S7: S7Benchmarks,
  S8: S8Helps,
  S9: S9Verify,
  S10: S10Payoff,
};

export const SceneStack: React.FC<{only?: string[]}> = ({only}) => (
  <>
    {TL.scenes.map((s, i) => {
      const Comp = SCENES[s.id];
      if (!Comp || (only && !only.includes(s.id))) return null;
      // Scenes are mounted a few frames early and late so transitions can overlap without a cross-fade.
      const from = Math.max(0, s.from - (i === 0 ? 0 : 6));
      const to = i === TL.scenes.length - 1 ? s.to : s.to + 6;
      return (
        <Sequence key={s.id} from={from} durationInFrames={to - from} name={s.id}>
          <SceneOffset from={from}>
            <Wipe first={i === 0} dir={i % 2 === 0 ? 'right' : 'left'}>
              <Comp />
            </Wipe>
          </SceneOffset>
        </Sequence>
      );
    })}
  </>
);

/** Paper wipe: the new scene slides a hard edge across the old one over 12 frames (no cross-fade ghosting). */
const Wipe: React.FC<{first: boolean; dir: 'left' | 'right'; children: React.ReactNode}> = ({first, dir, children}) => {
  const f = useCurrentFrame();
  const t = first ? 1 : easeInOut(Math.min(1, f / 12));
  const edge = (1 - t) * 100;
  const clip = dir === 'right' ? `inset(0 ${edge}% 0 0)` : `inset(0 0 0 ${edge}%)`;
  return <AbsoluteFill style={{clipPath: t >= 1 ? undefined : clip}}>{children}</AbsoluteFill>;
};

export const Main: React.FC<{audio?: 'mix' | 'narration' | 'none'; only?: string[]}> = ({audio = 'mix', only}) => (
  <AbsoluteFill style={{backgroundColor: C.paper}}>
    <SceneStack only={only} />
    {audio !== 'none' && <Audio src={staticFile(audio === 'mix' ? 'audio/mix.wav' : 'audio/narration.wav')} />}
  </AbsoluteFill>
);
