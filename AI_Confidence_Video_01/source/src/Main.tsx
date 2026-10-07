import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SceneOffset} from './lib/SceneFrame';
import {TL, isDraftVoice} from './lib/timeline';
import {C, F} from './theme';
import {S1Hook} from './scenes/S1_Hook';
import {S2Scene} from './scenes/S2_Rest';
import {S3Convincing} from './scenes/S3_Convincing';
import {S4Incentive} from './scenes/S4_Incentive';
import {S5Helps} from './scenes/S5_Helps';
import {S6Payoff} from './scenes/S6_Payoff';

const SCENES: Record<string, React.FC> = {
  S1: S1Hook,
  S2: S2Scene,
  S3: S3Convincing,
  S4: S4Incentive,
  S5: S5Helps,
  S6: S6Payoff,
};

const OVERLAP = 10; // frames of cross-fade between scenes

export const SceneStack: React.FC<{only?: string[]}> = ({only}) => (
  <>
    {TL.scenes.map((s, i) => {
      const Comp = SCENES[s.id];
      if (!Comp || (only && !only.includes(s.id))) return null;
      const from = Math.max(0, s.from - (i === 0 ? 0 : OVERLAP));
      const to = i === TL.scenes.length - 1 ? s.to : s.to + 2;
      return (
        <Sequence key={s.id} from={from} durationInFrames={to - from} name={s.id}>
          <SceneOffset from={from}>
            <Fade first={i === 0} len={to - from}>
              <Comp />
            </Fade>
          </SceneOffset>
        </Sequence>
      );
    })}
  </>
);

// Cross-fade in, plus a very slow push (2% over the whole scene) so long reading holds never look frozen.
const Fade: React.FC<{first: boolean; len: number; children: React.ReactNode}> = ({first, len, children}) => {
  const f = useCurrentFrame();
  const o = first ? 1 : Math.min(1, f / OVERLAP);
  const push = 1 + 0.02 * Math.min(1, f / Math.max(1, len));
  return <AbsoluteFill style={{opacity: o, transform: `scale(${push})`}}>{children}</AbsoluteFill>;
};

const DraftBug: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      right: 36,
      top: 28,
      fontFamily: F.sans,
      fontSize: 17,
      fontWeight: 650,
      letterSpacing: '0.12em',
      color: C.muted,
      opacity: 0.55,
      border: `1px solid ${C.line}`,
      borderRadius: 999,
      padding: '5px 12px',
    }}
  >
    DRAFT · TEMPORARY VOICE
  </div>
);

export const Main: React.FC<{audio?: 'mix' | 'narration' | 'none'; only?: string[]}> = ({audio = 'mix', only}) => (
  <AbsoluteFill style={{backgroundColor: C.bg0}}>
    <SceneStack only={only} />
    {isDraftVoice() && <DraftBug />}
    {audio !== 'none' && <Audio src={staticFile(audio === 'mix' ? 'audio/mix.wav' : 'audio/narration.wav')} />}
  </AbsoluteFill>
);
