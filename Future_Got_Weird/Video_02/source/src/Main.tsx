import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SceneOffset} from './lib/SceneFrame';
import {TL} from './lib/timeline';
import {E, tw} from './lib/motion';
import {C} from './theme';
import {S1ColdOpen} from './scenes/S1_ColdOpen';
import {S2Mirror} from './scenes/S2_Mirror';
import {S3Echo} from './scenes/S3_Echo';
import {S4Geometry} from './scenes/S4_Geometry';
import {S5History} from './scenes/S5_History';
import {S6Small} from './scenes/S6_Small';
import {S7Results} from './scenes/S7_Results';
import {S8Warehouse} from './scenes/S8_Warehouse';
import {S9Payoff} from './scenes/S9_Payoff';
import inserts from './data/inserts.json';

export const SCENES: Record<string, React.FC> = {
  S1: S1ColdOpen,
  S2: S2Mirror,
  S3: S3Echo,
  S4: S4Geometry,
  S5: S5History,
  S6: S6Small,
  S7: S7Results,
  S8: S8Warehouse,
  S9: S9Payoff,
};

/**
 * How each scene arrives (keyed by the incoming scene).
 *  cut    — hard cut at the boundary (matched where lib/shots.ts HANDOFF says so)
 *  reveal — the incoming scene is mounted `dur` frames early UNDER the outgoing one, which animates itself away
 *  wipe   — hard-edged paper wipe of `dur` frames centred on the boundary (dir = the way the edge travels)
 */
export type Transition = {type: 'cut'} | {type: 'reveal'; dur: number} | {type: 'wipe'; dur: number; dir: 'left' | 'right'};

export const TRANSITIONS: Record<string, Transition> = {
  S2: {type: 'cut'}, // the room → the mirror bench close-up
  S3: {type: 'cut'}, // postcard / timing bars → raised room view
  S4: {type: 'wipe', dur: 12, dir: 'right'}, // raw-data board → the room, which folds flat
  S5: {type: 'cut'}, // matched: the plan board (HANDOFF.S4S5) rolls up onto the history shelf
  S6: {type: 'cut'}, // the rope clips across the shelf → close-up of the empty fourth plinth
  S7: {type: 'wipe', dur: 12, dir: 'left'}, // the motion plans → the real-data evidence board
  S8: {type: 'wipe', dur: 12, dir: 'right'}, // results → the warehouse
  S9: {type: 'wipe', dur: 12, dir: 'left'}, // warehouse → back in the room
};

const earlyOf = (t: Transition | undefined) => (!t || t.type === 'cut' ? 0 : t.type === 'reveal' ? t.dur : Math.ceil(t.dur / 2));
const lateOf = (t: Transition | undefined) => (!t || t.type === 'cut' || t.type === 'reveal' ? 0 : Math.ceil(t.dur / 2));

export const SceneStack: React.FC<{only?: string[]}> = ({only}) => (
  <>
    {TL.scenes.map((s, i) => {
      const Comp = SCENES[s.id];
      if (!Comp || (only && only.length && !only.includes(s.id))) return null;
      const tin = i === 0 ? undefined : TRANSITIONS[s.id];
      const next = TL.scenes[i + 1];
      const tout = next ? TRANSITIONS[next.id] : undefined;
      const from = Math.max(0, s.from - earlyOf(tin));
      const to = Math.min(TL.durationInFrames, s.to + lateOf(tout));
      const z = 10 + i * 2 + (tout?.type === 'reveal' ? 3 : 0);
      return (
        <Sequence key={s.id} from={from} durationInFrames={Math.max(1, to - from)} name={s.id} style={{zIndex: z}}>
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

/** The incoming side of a wipe; cuts and reveals need nothing here. */
const Arrive: React.FC<{t?: Transition; children: React.ReactNode}> = ({t, children}) => {
  const f = useCurrentFrame();
  if (!t || t.type !== 'wipe') return <AbsoluteFill>{children}</AbsoluteFill>;
  const p = tw(f, 0, t.dur, E.inOut);
  if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  const edge = (1 - p) * 100;
  const clip = t.dir === 'right' ? `inset(0 ${edge}% 0 0)` : `inset(0 0 0 ${edge}%)`;
  return <AbsoluteFill style={{clipPath: clip}}>{children}</AbsoluteFill>;
};

/**
 * Accepted Runway inserts (data/inserts.json): an opaque generated clip replaces the picture for [from, to) global
 * frames. Each insert's start and end frames were rendered from the Remotion shot it replaces, so it begins and ends on
 * the rig. Frames are drawn nearest-frame (no interpolation) at 30 fps from a 24 fps source.
 */
type Insert = {id: string; file: string; from: number; to: number; trimStartFrames?: number; scale?: number};
const InsertLayer: React.FC<{only?: string[]}> = ({only}) => (
  <>
    {(inserts as Insert[]).map((ins) => {
      const sc = TL.scenes.find((s) => ins.from >= s.from && ins.from < s.to);
      if (only && only.length && sc && !only.includes(sc.id)) return null;
      return (
        <Sequence key={ins.id} from={ins.from} durationInFrames={ins.to - ins.from} name={`insert ${ins.id}`} style={{zIndex: 200}}>
          <AbsoluteFill style={{backgroundColor: C.paper}}>
            <OffthreadVideo src={staticFile(ins.file)} muted startFrom={ins.trimStartFrames ?? 0} style={{width: '100%', height: '100%', objectFit: 'cover', transform: ins.scale ? `scale(${ins.scale})` : undefined}} />
          </AbsoluteFill>
        </Sequence>
      );
    })}
  </>
);

export const Main: React.FC<{audio?: 'mix' | 'narration' | 'none'; only?: string[]; inserts?: boolean}> = ({audio = 'mix', only, inserts: showInserts = true}) => (
  <AbsoluteFill style={{backgroundColor: C.paper}}>
    <SceneStack only={only} />
    {showInserts && <InsertLayer only={only} />}
    {audio !== 'none' && <Audio src={staticFile(audio === 'mix' ? 'audio/mix.wav' : 'audio/narration.wav')} />}
  </AbsoluteFill>
);
