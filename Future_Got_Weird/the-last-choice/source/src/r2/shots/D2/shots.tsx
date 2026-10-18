// Section D2 shots: one battle (battle.tsx: crew.tsx, machines.ts, fx.tsx) sampled by physical cameras (cams.ts).
// Every shot draws the girder itself (SET_D2) so it can shudder at the crash; the inserts are in Insert.tsx.
import React from 'react';
import {Stage, useShotTime, camPath} from '../../film/stage';
import {d2Items, d2FxAt, SET_D2} from './battle';
import {SHOT_CAMS, ShotCam} from './cams';
import {TabletInsert} from './Insert';

const camOf = (id: string): ShotCam => SHOT_CAMS.find((s) => s.id === id)!;
/** full-mesh radius per shot (the close ones need fewer machines at full detail) */
const FULL: Record<string, number> = {'D2-3b': 22, 'D2-4b': 18};
const live = (id: string): React.FC => {
  const s = camOf(id);
  const C: React.FC = () => {
    const {t, T} = useShotTime(s.start);
    const cam = camPath(s.keys, t, 0.55);
    const f = d2FxAt(T);
    return <Stage T={T} cam={cam} set={SET_D2} lights={f.lights} shake={f.shake} drift={s.drift} items={(v) => [...d2Items(v, T, {full: FULL[id] ?? 30, girder: true}), ...f.items]} />;
  };
  C.displayName = `D2_${id}`;
  return C;
};
const insert = (id: string): React.FC => {
  const s = camOf(id);
  const C: React.FC = () => {
    const {T} = useShotTime(s.start);
    return <TabletInsert T={T} />;
  };
  C.displayName = `D2_${id}`;
  return C;
};

export const D2_1 = live('D2-1');
export const D2_2a = insert('D2-2a');
export const D2_2b = live('D2-2b');
export const D2_2c = insert('D2-2c');
export const D2_2d = live('D2-2d');
export const D2_3a = live('D2-3a');
export const D2_3b = live('D2-3b');
export const D2_3c = live('D2-3c');
export const D2_4 = live('D2-4');
export const D2_4b = live('D2-4b');
export const D2_4c = live('D2-4c');
export const D2_5a = live('D2-5a');
export const D2_5b = live('D2-5b');
export const D2_5c = live('D2-5c');
export const D2_6 = live('D2-6');
export const D2_7a = live('D2-7a');
export const D2_7b = live('D2-7b');
