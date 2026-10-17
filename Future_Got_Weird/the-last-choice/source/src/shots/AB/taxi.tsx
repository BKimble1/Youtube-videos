// The opening wreck (A1–A3): the overturned yellow taxi propped up at its west (−x) end, the teammate pinned prone in
// the gap under the raised end, head and arms out toward the west, reaching. Shared geometry so the three shots match.
import React from 'react';
import {ActorProps} from '../../rig/actor';
import {look, dmg} from '../../film/crew';
import {Face} from '../../rig/actor';
import {V2, lerp} from '../../kit/math';
import {TaxiProps, taxiPoints} from '../../sets/city';
import {CITY} from '../../theme';
import {Flames} from '../../sets/city';

export const GROUND = 60; // the lane the taxi lies on
export const TAXI: TaxiProps = {x: 0, y: GROUND, overturned: true, tilt: -11, seed: 2};
export const taxiAt = (o: Partial<TaxiProps>): TaxiProps => ({...TAXI, ...o});
export const SUPPORT = () => taxiPoints(TAXI).support;

/** Pelvis rest position of the pinned teammate (prone, head west). */
export const PIN = {x: -470, y: GROUND - 40};

/** Rotate a world point into the pre-roll frame of an actor rolled by `roll` degrees about `pv`. */
export const unroll = (q: V2, pv: V2, roll: number): V2 => {
  const a = (-roll * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const dx = q.x - pv.x, dy = q.y - pv.y;
  return {x: pv.x + dx * c - dy * s, y: pv.y + dx * s + dy * c};
};

/** The teammate prone (face down, head toward −x), pelvis at P (world), chest lifted by `lift` deg, head raised by
 *  `head` deg, hands at world targets (on the ground ahead) — handled through the whole-body roll. */
export const prone = (T: number, o: {P: V2; lift?: number; head?: number; handL?: V2; handR?: V2; face?: Face; s?: number; legBend?: number; handLShape?: ActorProps['handL']; headYaw?: number; roll?: number}): ActorProps => {
  const s = o.s ?? 1;
  const roll = o.roll ?? -90;
  const P = o.P;
  const pre = (q?: V2) => (q ? unroll(q, P, roll) : undefined);
  const hL = pre(o.handL), hR = pre(o.handR);
  const lb = o.legBend ?? 0;
  return {
    look: look('teammate'), t: T, seed: 3, s, x: P.x, y: P.y + 165 * s, yaw: -90, roll, rollPivot: P, shadow: false,
    lean: -(o.lift ?? 14), dmg: dmg('teammate', T), breath: 0.9,
    head: {pitch: -(o.head ?? 55), yaw: o.headYaw ?? 0},
    face: o.face ?? {mouth: 'pain', lids: 0.45, worry: 0.8, brows: 0.2},
    armL: hL ? {hand: {x: hL.x, y: hL.y, z: 30}, pole: {x: 0, y: 1, z: 0.6}} : {fk: {fwd: 40, out: 20, bend: 60}},
    armR: hR ? {hand: {x: hR.x, y: hR.y, z: -30}, pole: {x: 0, y: 1, z: -0.6}} : {fk: {fwd: 40, out: 20, bend: 60}},
    handL: o.handLShape ?? 'mitt',
    legL: {fk: {fwd: 4 + lb, knee: 8 + lb * 1.5}},
    legR: {fk: {fwd: -2, knee: 4}},
  };
};

/** Fire reflected in a puddle: burning facade silhouettes and flames (local to the puddle, surface line at y = 0). */
export const FireReflection: React.FC<{t: number; x: number; y: number; w: number}> = ({t, x, y, w}) => (
  <g>
    <rect x={x - w} y={y - 2600} width={w * 2} height={2620} fill="#5A2626" />
    <rect x={x - w * 0.9} y={y - 2300} width={w * 0.5} height={2300} fill={CITY.brickDark} />
    <rect x={x - w * 0.25} y={y - 1900} width={w * 0.55} height={1900} fill="#4A2A26" />
    <rect x={x + w * 0.4} y={y - 2500} width={w * 0.45} height={2500} fill={CITY.brickDark} />
    {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={x - w * 0.8 + i * w * 0.3} y={y - 1600 + (i % 2) * 300} width={w * 0.07} height={w * 0.1} fill={CITY.windowLit} opacity={0.8} />)}
    <g transform={`translate(${x - w * 0.45} ${y - 900})`}><Flames w={w * 0.5} h={900} t={t} seed={3} /></g>
    <g transform={`translate(${x + w * 0.35} ${y - 1300})`}><Flames w={w * 0.4} h={800} t={t} seed={8} /></g>
    <g transform={`translate(${x - w * 0.05} ${y - 300})`}><Flames w={w * 0.6} h={500} t={t} seed={11} /></g>
  </g>
);

export const mixP = (a: V2, b: V2, k: number): V2 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)});
