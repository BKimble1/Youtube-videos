// Refuge lighting by time of day. `time` is a number on a loop (0 morning, 1 day, 2 evening, 3 night, 4 = morning
// again) or a name; values interpolate so a time-lapse (night → dawn) is a smooth change of light, not a cut.
import {mixHex} from '../fx/common';

export type RefTime = 'morning' | 'day' | 'evening' | 'night';
export type RefLight = {skyTop: string; skyLow: string; tint: string; tintOp: number; warm: number; lamps: number; sun: number; water: string; farLights: number};
const KEYS: RefLight[] = [
  {skyTop: '#E9C3A9', skyLow: '#BFD9E6', tint: '#FFD9B8', tintOp: 0.1, warm: 0.6, lamps: 0.15, sun: 0.85, water: '#7FA6B6', farLights: 0.15},   // morning
  {skyTop: '#9FC8DE', skyLow: '#DCEBF0', tint: '#FFFFFF', tintOp: 0, warm: 0.45, lamps: 0, sun: 1, water: '#5D8FA6', farLights: 0},            // day
  {skyTop: '#C9774F', skyLow: '#8C6E8C', tint: '#FFB27A', tintOp: 0.16, warm: 0.85, lamps: 0.7, sun: 0.55, water: '#6C5E78', farLights: 0.6}, // evening
  {skyTop: '#16203A', skyLow: '#2F4268', tint: '#2C4472', tintOp: 0.36, warm: 1, lamps: 1, sun: 0, water: '#1E2E48', farLights: 1},           // night
];
const NAMES: RefTime[] = ['morning', 'day', 'evening', 'night'];
export const refLight = (time: number | RefTime): RefLight => {
  const v = typeof time === 'number' ? ((time % 4) + 4) % 4 : NAMES.indexOf(time);
  const i = Math.floor(v), k = v - i;
  const a = KEYS[i % 4], b = KEYS[(i + 1) % 4];
  const n = (p: number, q: number) => p + (q - p) * k;
  return {
    skyTop: mixHex(a.skyTop, b.skyTop, k), skyLow: mixHex(a.skyLow, b.skyLow, k), tint: mixHex(a.tint, b.tint, k), tintOp: n(a.tintOp, b.tintOp),
    warm: n(a.warm, b.warm), lamps: n(a.lamps, b.lamps), sun: n(a.sun, b.sun), water: mixHex(a.water, b.water, k), farLights: n(a.farLights, b.farLights),
  };
};
