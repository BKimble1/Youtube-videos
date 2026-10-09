import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SceneOffset} from './lib/SceneFrame';
import {TL} from './lib/timeline';
import {E, tw} from './lib/motion';
import {C} from './theme';
import {V1HideTrack} from './scenes/V1_HideTrack';
import {V2LongWay} from './scenes/V2_LongWay';
import {V3MirrorPaint} from './scenes/V3_MirrorPaint';
import {V4LaterWeaker} from './scenes/V4_LaterWeaker';
import {V5DelayPlace} from './scenes/V5_DelayPlace';
import {V6RealU} from './scenes/V6_RealU';
import {V7Museum} from './scenes/V7_Museum';
import {V8SmallSensor} from './scenes/V8_SmallSensor';
import {V9Fusion} from './scenes/V9_Fusion';
import {V10KitClip} from './scenes/V10_KitClip';
import {V11Warehouse} from './scenes/V11_Warehouse';
import {V12Callback} from './scenes/V12_Callback';
import {V13EndScreen} from './scenes/V13_EndScreen';
import inserts from './data/inserts.json';

export const SCENES: Record<string, React.FC> = {
  V1: V1HideTrack,
  V2: V2LongWay,
  V3: V3MirrorPaint,
  V4: V4LaterWeaker,
  V5: V5DelayPlace,
  V6: V6RealU,
  V7: V7Museum,
  V8: V8SmallSensor,
  V9: V9Fusion,
  V10: V10KitClip,
  V11: V11Warehouse,
  V12: V12Callback,
  V13: V13EndScreen,
};

/**
 * How each scene arrives (keyed by the incoming scene).
 *  cut    — hard cut at the boundary (matched where lib/shots.ts HANDOFF says so)
 *  reveal — the incoming scene is mounted `dur` frames early UNDER the outgoing one, which animates itself away
 *  wipe   — hard-edged paper wipe of `dur` frames centred on the boundary (dir = the way the edge travels)
 */
export type Transition = {type: 'cut'} | {type: 'reveal'; dur: number} | {type: 'wipe'; dur: number; dir: 'left' | 'right'};

// v2: every scene boundary is a hard cut; matches are staged inside the scenes so the last and first frames line up
// (v2/SHOTPLAN_V2.md "Transitions"). The v1 map (wipes into S4, S7, S8, S9) is in git history at 40183b0.
export const TRANSITIONS: Record<string, Transition> = {};

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
 * the rig. Frames are drawn nearest-frame (no interpolation) at 30 fps from a 24 fps source. Inserts flagged `inScene`
 * are drawn by their scene (components/v02/RunwayInsert) beneath its labels, not here.
 */
type Insert = {id: string; file: string; from: number; to: number; trimStartFrames?: number; scale?: number; inScene?: boolean; playbackRate?: number};
const InsertLayer: React.FC<{only?: string[]}> = ({only}) => (
  <>
    {(inserts as Insert[]).filter((ins) => !ins.inScene).map((ins) => {
      const sc = TL.scenes.find((s) => ins.from >= s.from && ins.from < s.to);
      if (only && only.length && sc && !only.includes(sc.id)) return null;
      return (
        <Sequence key={ins.id} from={ins.from} durationInFrames={ins.to - ins.from} name={`insert ${ins.id}`} style={{zIndex: 200}}>
          <AbsoluteFill style={{backgroundColor: C.paper}}>
            <OffthreadVideo src={staticFile(ins.file)} muted startFrom={ins.trimStartFrames ?? 0} playbackRate={ins.playbackRate ?? 1} style={{width: '100%', height: '100%', objectFit: 'cover', transform: ins.scale ? `scale(${ins.scale})` : undefined}} />
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
