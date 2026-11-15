// A: proof first. Frame 0 already shows the traced stretch lifting out of the scan; Greek is legible by ~2 s.
import React from 'react';
import {FPS} from '../lib/core';
import {clamp, easeInOut, lerp} from '../lib/math';
import {TM} from '../lib/time';
import {OpenComp, ROLL} from './Open';

/** the roll's pose in the damage sequence (B starts from exactly this state) */
export const ROLL_B = {x: 960, y: 500, s: 1.6};

export const SeqA: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const u = lerp(0.16, 1, easeInOut(clamp(t / 1.55)));
  const open = easeInOut(clamp((t - 1.2) / 0.85));
  const pushP = 0.07 * easeInOut(clamp((t - 2.1) / 5));
  const crumbs = clamp((t - TM.crumble - 0.05) / 1.3) * 1.3;
  // into B: the scan panel slides off to the right and the roll comes to the centre
  const k = easeInOut(clamp((t - (TM.book - 0.75)) / 0.95));
  const roll = {x: lerp(ROLL.x, ROLL_B.x, k), y: lerp(ROLL.y, ROLL_B.y, k), s: lerp(ROLL.s, ROLL_B.s, k)};
  return <OpenComp f={f} st={{u, open, split: 1 - k, roll, crumbs: crumbs > 0 ? crumbs : 0, pushP, leader: 1 - clamp(k * 2.5), chips: 1}} />;
};
