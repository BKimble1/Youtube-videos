// C2 · 0:51.0–0:54.6 · Calm, stable wide. Ahead of the Crew, before they arrive: sensor bars switch on in sequence, a
// coordinated pause — then on the accent (M.HIT_HAULER) the hauler's lights snap on and it pulls out, the cars follow.
// The Director halts the group.
import React from 'react';
import {Cam} from '../../kit/cam';
import {useShot} from '../../film/useShot';
import {look, dmg, CIV} from '../../film/crew';
import {at, Cue} from '../../film/cue';
import {M, shot} from '../../film/timing';
import {ActorProps} from '../../rig/actor';
import {clamp, seg, smooth, lerp} from '../../kit/math';
import {AvenueScene} from './scene';
import {FarDrones, STAIR, linkPair} from './C1';
import {mover, climber, supportPair, stand, G_WALK, G_HURRY, FACE, sk} from './kit';

const ID = 'C2';
const HIT = M.HIT_HAULER - shot(ID).start; // 2.28

export const crewC2 = (t: number, T: number): ActorProps[] => {
  const out: ActorProps[] = [];
  // Director: walks on, sees the lights, halts the group with a raised hand; steps back when the hauler moves
  const dD = sk(t, [[0, 0], [0.9, 150], [1.25, 175]], 0.25);
  const back = sk(t, [[HIT + 0.15, 0], [HIT + 0.8, -75]], 0.15);
  const dX = 7320 + dD + back;
  const halt = smooth(seg(t, 1.25, 1.65));
  const startle = smooth(seg(t, HIT + 0.05, HIT + 0.35));
  const dmv = mover(look('director'), {x0: 7320, dist: dD, dir: 1, ground: 0, gait: G_HURRY, t}, {seed: 31, dmg: dmg('director', T), breath: 0.6});
  const still = stand(look('director'), dX, 0, {t, seed: 31, dmg: dmg('director', T), breath: 0.6}, 40);
  const w = smooth(seg(t, 1.0, 1.3));
  out.push({
    ...(w < 1 ? dmv : still), x: dX,
    lean: lerp(6, -6, startle), drop: 8 + 10 * startle,
    head: {yaw: lerp(0, 10, smooth(seg(t, 0.6, 1.1))), pitch: -4},
    face: startle > 0.2 ? FACE.alarm : FACE.focus,
    armR: halt > 0 ? {fk: {fwd: lerp(10, -38, halt) - 20 * startle, out: lerp(8, 34, halt), bend: lerp(30, 12, halt)}} : dmv.armR,
    handR: halt > 0.5 ? 'open' : 'mitt',
  });
  // Friend: slows, looks back for the pair, drops back and stands at the teammate's far side
  const dF = sk(t, [[0, 0], [0.8, 90], [1.2, 95], [2.9, 40], [3.6, 40]], 0.25);
  const turnF = smooth(seg(t, 0.95, 1.35)) - smooth(seg(t, 2.85, 3.25));
  const frm = t < 1.15
    ? mover(look('friend'), {x0: 6950, dist: Math.max(0, dF), dir: 1, ground: 0, gait: G_WALK, t}, {seed: 33})
    : t < 2.95 ? mover(look('friend'), {x0: 7045, dist: Math.max(0, 95 - dF), dir: -1, ground: 0, gait: G_WALK, t}, {seed: 33})
    : stand(look('friend'), 6950 + dF, 0, {t, seed: 33}, 30);
  out.push({...frm, x: 6950 + dF, z: -70, yaw: lerp(90, -90, turnF), dmg: dmg('friend', T), face: t > HIT ? FACE.alarm : FACE.worry, head: {yaw: t > HIT ? -40 : 0}});
  // the support pair reaches the street and comes on, slowly
  const dP = sk(t, [[0, 0], [3.6, 600]], 0.3);
  const [sup, tm] = supportPair(look('carrier'), look('teammate'), {x: 6420, ground: 0, dist: dP, dir: 1, t, seed: 17, supDmg: dmg('carrier', T), tmDmg: dmg('teammate', T)});
  out.push(sup, tm);
  void linkPair;
  // builder: last treads, then on
  const kB = sk(t, [[0, 9.4], [2.2, 15.6]], 0.15);
  if (kB < 15.4) out.push(climber(look('builder'), STAIR, kB, 1, {t, seed: 37, dmg: dmg('builder', T), face: FACE.tired}));
  else out.push(mover(look('builder'), {x0: 6480, dist: sk(t, [[2.2, 0], [3.6, 270]], 0.2), dir: 1, ground: 0, gait: G_HURRY, t}, {seed: 37, dmg: dmg('builder', T), face: FACE.tired}));
  // civilians down the stairs
  [[0, 7.2, 15.2], [1, 4.6, 12.6], [2, 2.6, 10.4]].forEach(([i, k0, k1]) => {
    const lk = CIV[i];
    out.push(climber(lk, STAIR, lerp(k0, k1, clamp(t / 3.6)), 1, {t, seed: 50 + i, s: lk.height ?? 1, face: FACE.worry}));
  });
  return out;
};

const CAM: Cam = {x: 8450, y: -840, z: 0.3};

export const C2Shot: React.FC = () => {
  const {t, T} = useShot(ID);
  const cam: Cam = {...CAM, z: lerp(0.3, 0.305, t / 3.6)};
  return (
    <AvenueScene id="c2" cam={cam} T={T} crew={crewC2(t, T)} pole={{pan: -58, lock: 1, look: {x: -0.55, y: 0.35}}} drones={<FarDrones T={T} />} />
  );
};

const c = at(shot(ID).start);
export const CUES: Cue[] = [
  c(0.5, 'sensor_lock', {pan: 0.75, dist: 0.6, gain: -2}),
  c(0.85, 'sensor_lock', {pan: 0.6, dist: 0.5, gain: -2, rate: 1.06}),
  c(1.2, 'sensor_lock', {pan: 0.9, dist: 0.7, gain: -3, rate: 0.94}),
  c(HIT, 'servo_heavy', {pan: 0.7, dist: 0.45, gain: 4}),
  c(HIT + 0.05, 'hydraulic', {pan: 0.7, dist: 0.5}),
  c(0, 'breath_ragged', {dur: 3.6, gain: -6, pan: -0.4}),
];
