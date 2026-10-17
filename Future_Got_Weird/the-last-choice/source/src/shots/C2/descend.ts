// Group C2, C16: down the landing stairs to the waterfront and along the esplanade to the refuge doors. A new
// arrangement after the cut: the Director and the carrier carry the friend between them; the builder supports the
// teammate; the three civilians go ahead. Two set-ups: the stairs (C16a) and the esplanade (C16b).
import {ActorProps} from '../../rig/actor';
import {look, CIV} from '../../film/crew';
import {clamp, easeOut, lerp} from '../../kit/math';
import {stairPoint} from '../../sets/refugeFar';
import {carry3, supportedBy, Placed} from './blocking';
import {mover, path, WALK, HURRY} from './pose';
import {REF_X} from './world';

export const C16_CUT = 120.9;
export const DOOR_X = REF_X + 290;
const ST = {x0: 13500, y0: -1600, x1: 14500, y1: 0};
const N = Math.max(6, Math.round(Math.abs(ST.y1 - ST.y0) / 46));
/** Tread surface under x on the landing stairs (stepped), street level beyond. */
export const stairY = (x: number) => {
  if (x <= ST.x0) return ST.y0;
  if (x >= ST.x1) return 0;
  const k = Math.floor(((x - ST.x0) / (ST.x1 - ST.x0)) * N);
  return stairPoint(ST.x0, ST.y0, ST.x1, ST.y1, k / N).y;
};
/** The smooth line of the stair (for the pelvis). */
const lineY = (x: number) => (x <= ST.x0 ? ST.y0 : x >= ST.x1 ? 0 : lerp(ST.y0, ST.y1, (x - ST.x0) / (ST.x1 - ST.x0)));
const groundAt = (x: number) => Math.max(stairY(x), lineY(x) - 20);

/** Everyone in C16 at T. */
export const descendAt = (T: number): Placed[] => {
  const out: Placed[] = [];
  const a = T < C16_CUT;
  // the carry: on the stairs (a), then the esplanade (b)
  const xc = a ? path(T, [[118.0, 13980], [C16_CUT, 14400, (u: number) => u]]) : path(T, [[C16_CUT, 14520], [124.75, DOOR_X - 150, easeOut]]);
  const lean = a ? -10 : 0;
  const moving = a || T < 124.6 ? 1 : 0;
  const c = carry3(T, xc, groundAt, 'carrier', 1, moving, lean);
  const stairDrop = a ? 20 : 0;
  out.push({slot: 'front', key: 'friend', p: {...c.friend, y: lineY(xc), drop: (c.friend.drop ?? 0) + stairDrop}});
  out.push({slot: 'front', key: 'director', p: {...c.dir, y: lineY(xc + 18), face: {mouth: 'pant', brows: -0.6, worry: 0.7, lookX: 0.3}, head: {pitch: 10, yaw: 0}}});
  out.push({slot: 'front', key: 'carrier', p: {...c.far, y: lineY(xc - 12), face: {mouth: 'grit', brows: -0.5, worry: 0.5}}});
  // the builder with the teammate, behind
  const xb = xc - 330;
  const bp = mover(look('builder'), T, a ? [[118.0, 13650], [C16_CUT, xb + 0.0001, (u: number) => u]] : [[C16_CUT, 14190], [124.75, DOOR_X - 480, easeOut]], {...WALK, stride: 110}, groundAt, {t: T, seed: 51, yaw: 70, face: {mouth: 'pant', brows: -0.4, worry: 0.6}});
  const bpp = {...bp, y: lineY(bp.x), z: 0.5};
  out.push({slot: 'front', key: 'builder', p: bpp});
  out.push({slot: 'front', key: 'teammate', p: {...supportedBy(bpp, T), face: {mouth: 'pant', worry: 0.9, brows: 0.1, lids: 0.25, lookX: 0.6}, head: {pitch: -6}}});
  // civilians ahead
  CIV.forEach((lk, i) => {
    const s = 0.96 * (lk.height ?? 1);
    const k: [number, number, ((u: number) => number)?][] = a ? [[118.0, 14180 + i * 110], [C16_CUT, 14520 + i * 140, (u: number) => u]] : [[C16_CUT, 14700 + i * 150], [124.5, DOOR_X + 40 + i * 120, easeOut]];
    const p = mover(lk, T, k, {...HURRY, stride: 130}, groundAt, {t: T, seed: 61 + i, s, yaw: 74, face: {mouth: 'flat', worry: 0.6, brows: 0.2, lookX: 0.4}});
    out.push({slot: 'front', key: `civ${i}`, p: {...p, y: lineY(p.x), z: -0.6 - i * 0.2}});
  });
  void clamp;
  return out;
};
export type {ActorProps};
