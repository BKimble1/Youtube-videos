// Section D1: a shot = a camera on the one battle (battle.tsx). Every shot samples the same choreography at film time T.
import React from 'react';
import {Stage, useShotTime, camPath, CamKey} from '../../film/stage';
import {V3} from '../../../kit/math';
import {d1Items, d1FxAt, D1Opts} from './battle';
import {G} from './motion';

/** a ground-relative world point: (x, z) and metres above the ground there */
export const g = (x: number, z: number, up: number): V3 => ({x, y: G(x, z) + up, z});
export type ShotOpts = {
  /** camera key easing (0 linear … 1 smooth per segment) */
  ease?: number;
  /** handheld drift (m) */
  drift?: number;
  /** scale of the FX impact shake for this lens */
  shake?: number;
  /** per-frame battle options (anchors for close cuts, LOD radius) */
  opts?: (T: number) => D1Opts;
};
/** every D1 camera (film start → keys, easing), for tools that need the lens at a film time (sound pan/dist, QA) */
export const D1_CAMS: {start: number; keys: CamKey[]; ease: number}[] = [];
/** a shot component: camera keys in shot-local seconds; the battle at film time T */
export const shotOf = (start: number, keys: CamKey[], o: ShotOpts = {}): React.FC => {
  D1_CAMS.push({start, keys, ease: o.ease ?? 0.5});
  const Shot: React.FC = () => {
    const {t, T} = useShotTime(start);
    const cam = camPath(keys, t, o.ease ?? 0.5);
    const f = d1FxAt(T);
    const op = o.opts ? o.opts(T) : {};
    return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake * (o.shake ?? 1)} drift={o.drift ?? 0.02} items={(v) => [...d1Items(v, T, {full: 30, ...op}), ...f.items]} />;
  };
  return Shot;
};
