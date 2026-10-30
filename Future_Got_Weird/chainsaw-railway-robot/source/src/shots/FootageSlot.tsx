// Cleared source footage, when it exists: a slot from data/footage.json plays its clip (muted; the mix carries the
// sound) over the illustration, with its credit. With no cleared clip (V1), nothing is drawn here and the
// illustration with its PREVIS tag stays on screen.
import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import FOOT from '../data/footage.json';
import {FPS} from '../lib/core';
import {BT, TT} from '../lib/timeline';

type Slot = {id: string; a: string; b: string; source: string; beat?: string; file: string | null; in: number; credit: string; cleared: boolean};
const at = (k: string) => {
  if (k === 'start') return 0;
  if (k === 'end') return TT.dur;
  const [name, off] = k.split('+');
  const v = name.startsWith('BT.') ? (BT as Record<string, number>)[name.slice(3)] : (TT as Record<string, number>)[name];
  return v + (off ? parseFloat(off) : 0);
};
export const SLOTS = (FOOT.slots as Slot[]).map((s) => ({...s, t0: at(s.a), t1: at(s.b)}));
export const clearedAt = (t: number) => SLOTS.find((s) => s.cleared && s.file && t >= s.t0 && t < s.t1);

export const FootageSlots: React.FC = () => (
  <>
    {SLOTS.filter((s) => s.cleared && s.file).map((s) => (
      <Sequence key={s.id} from={Math.round(s.t0 * FPS)} durationInFrames={Math.round((s.t1 - s.t0) * FPS)}>
        <AbsoluteFill>
          <OffthreadVideo src={staticFile(`footage/${s.file}`)} startFrom={Math.round(s.in * FPS)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          <div style={{position: 'absolute', left: 40, bottom: 34, color: '#fff', font: '700 22px "Nunito Variable"', textShadow: '0 0 6px #000'}}>{s.credit}</div>
        </AbsoluteFill>
      </Sequence>
    ))}
  </>
);
