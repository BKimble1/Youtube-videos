import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SceneOffset} from './lib/SceneFrame';
import {TL} from './lib/timeline';
import {E, tw} from './lib/motion';
import {C, OUTLINE} from './theme';
import {H56} from './lib/handoffs';
import {S1Counter} from './scenes/S1_Counter';
import {S2ShortVersion} from './scenes/S2_ShortVersion';
import {S3Tokens} from './scenes/S3_Tokens';
import {S4Library} from './scenes/S4_Library';
import {S5Record, S5_LENS_ZOOM} from './scenes/S5_Record';
import {MAG_RIM} from './components/v2/S5_Magnifier';
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

/**
 * How each scene arrives (keyed by the incoming scene). V2 uses a handful of motivated transitions and plain cuts or
 * short paper wipes everywhere else (see V2_DIRECTION.md, "Transitions and hand-offs").
 *  cut    — hard cut at the boundary; the outgoing scene's last frame and the incoming's first are designed to match
 *  reveal — the incoming scene is mounted `dur` frames early UNDER the outgoing one, which animates itself away
 *  wipe   — hard-edged paper wipe of `dur` frames centred on the boundary (dir = the way the edge travels)
 *  iris   — the incoming scene opens through a growing circle centred on (x, y), `dur` frames centred on the boundary;
 *           `rim` (a zoom factor) draws the magnifier's rim on the opening edge at that scale, fading as it widens
 */
export type Transition =
  | {type: 'cut'}
  | {type: 'reveal'; dur: number}
  | {type: 'wipe'; dur: number; dir: 'left' | 'right'}
  | {type: 'iris'; dur: number; x: number; y: number; r0?: number; rim?: number};

export const TRANSITIONS: Record<string, Transition> = {
  S2: {type: 'cut'}, // slip A lifts off the counter and becomes S2's slip (S1 ↔ S2 share liftPose)
  S3: {type: 'reveal', dur: 14}, // S2's title card swings up and away, revealing the conveyor
  S4: {type: 'cut'}, // match cut: S3 pushes into a token, S4 opens on the same word on a book spine
  S5: {type: 'wipe', dur: 12, dir: 'left'}, // the sealed slip exits frame-left; the wipe follows it
  S6: {type: 'iris', dur: 18, x: H56.x, y: H56.y, r0: H56.r, rim: S5_LENS_ZOOM}, // the magnifier lens becomes the spotlight
  S7: {type: 'wipe', dur: 10, dir: 'right'},
  S8: {type: 'wipe', dur: 10, dir: 'right'},
  S9: {type: 'wipe', dur: 10, dir: 'left'},
  S10: {type: 'cut'}, // the failed claim comes back to the counter (H910)
};

const earlyOf = (t: Transition | undefined) => (!t || t.type === 'cut' ? 0 : t.type === 'reveal' ? t.dur : Math.ceil(t.dur / 2));
const lateOf = (t: Transition | undefined) => (!t || t.type === 'cut' || t.type === 'reveal' ? 0 : Math.ceil(t.dur / 2));

export const SceneStack: React.FC<{only?: string[]}> = ({only}) => (
  <>
    {TL.scenes.map((s, i) => {
      const Comp = SCENES[s.id];
      if (!Comp || (only && !only.includes(s.id))) return null;
      const tin = i === 0 ? undefined : TRANSITIONS[s.id];
      const next = TL.scenes[i + 1];
      const tout = next ? TRANSITIONS[next.id] : undefined;
      const from = Math.max(0, s.from - earlyOf(tin));
      const to = Math.min(TL.durationInFrames, s.to + lateOf(tout));
      // an outgoing scene that "reveals" the next one stays on top of it
      const z = 10 + i * 2 + (tout?.type === 'reveal' ? 3 : 0);
      return (
        <Sequence key={s.id} from={from} durationInFrames={to - from} name={s.id} style={{zIndex: z}}>
          <SceneOffset from={from}>
            <Arrive t={tin}>
              <Comp />
            </Arrive>
          </SceneOffset>
        </Sequence>
      );
    })}
  </>
);

/** The incoming side of a transition (wipe edge or iris); cuts and reveals need nothing here. */
const Arrive: React.FC<{t?: Transition; children: React.ReactNode}> = ({t, children}) => {
  const f = useCurrentFrame();
  if (!t || t.type === 'cut' || t.type === 'reveal') return <AbsoluteFill>{children}</AbsoluteFill>;
  const p = tw(f, 0, t.dur, E.inOut);
  if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  if (t.type === 'wipe') {
    const edge = (1 - p) * 100;
    const clip = t.dir === 'right' ? `inset(0 ${edge}% 0 0)` : `inset(0 0 0 ${edge}%)`;
    return <AbsoluteFill style={{clipPath: clip}}>{children}</AbsoluteFill>;
  }
  const r = (t.r0 ?? 0) + p * (1250 - (t.r0 ?? 0));
  const opened = <AbsoluteFill style={{clipPath: `circle(${r}px at ${t.x}px ${t.y}px)`}}>{children}</AbsoluteFill>;
  const rimOp = t.rim ? 1 - tw(r, 400, 300) : 0;
  if (rimOp <= 0 || !t.rim) return opened;
  const ink = OUTLINE * t.rim;
  const band = MAG_RIM * t.rim;
  return (
    <>
      {opened}
      <AbsoluteFill style={{opacity: rimOp}}>
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
          <circle cx={t.x} cy={t.y} r={r + band / 2} fill="none" stroke={C.saffron} strokeWidth={band} />
          <circle cx={t.x} cy={t.y} r={r} fill="none" stroke={C.ink} strokeWidth={ink} />
          <circle cx={t.x} cy={t.y} r={r + band} fill="none" stroke={C.ink} strokeWidth={ink} />
        </svg>
      </AbsoluteFill>
    </>
  );
};

export const Main: React.FC<{audio?: 'mix' | 'narration' | 'none'; only?: string[]}> = ({audio = 'mix', only}) => (
  <AbsoluteFill style={{backgroundColor: C.paper}}>
    <SceneStack only={only} />
    {audio !== 'none' && <Audio src={staticFile(audio === 'mix' ? 'audio/mix.wav' : 'audio/narration.wav')} />}
  </AbsoluteFill>
);
