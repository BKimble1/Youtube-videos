// C1 · 0:47.0–0:51.0 · Down off the terrace into the avenue, toward the gap under the viaduct. The pole camera at the
// corner turns from the street and fixes on them (cyan → amber).
import React from 'react';
import {Cam, smoothCam, mixCam} from '../../kit/cam';
import {useShot} from '../../film/useShot';
import {look, dmg, CIV} from '../../film/crew';
import {at, Cue} from '../../film/cue';
import {shot} from '../../film/timing';
import {ActorProps, Cast, solve} from '../../rig/actor';
import {clamp, seg, smooth, lerp, V2, keys} from '../../kit/math';
import {terraceStairStep} from '../../sets/city';
import {AvenueScene, Drone} from './scene';
import {mover, climber, treads, G_WALK, G_HURRY, FACE, sk} from './kit';

const ID = 'C1';
// terrace east stairs (descending): the terrace top, 15 treads, then the street
export const STAIR: V2[] = [{x: 5600, y: -700}, ...Array.from({length: 15}, (_, i) => terraceStairStep(5650, i)), ...Array.from({length: 6}, (_, i) => ({x: 6470 + i * 110, y: 0}))];

/** The Crew at shot-local time t (positions continue into C2). */
export const crewC1 = (t: number, T: number): ActorProps[] => {
  const out: ActorProps[] = [];
  // Director: already down, waits and beckons, then leads east
  const dDist = sk(t, [[0, 0], [0.9, 0], [4, 760]], 0.3);
  const turn = smooth(seg(t, 0.75, 1.15));
  const dir = mover(look('director'), {x0: 6560, dist: dDist, dir: 1, ground: 0, gait: G_HURRY, t, s: 1}, {seed: 31, dmg: dmg('director', T), face: t < 1 ? {...FACE.focus, lookX: -0.4, lookY: -0.4} : FACE.focus, breath: 0.6});
  const beckon = (1 - turn) * Math.max(0, Math.sin(t * 7)) * 0.6;
  out.push({...dir, yaw: lerp(-70, 90, turn), armR: t < 1.1 ? {fk: {fwd: 70 + 40 * beckon, out: 18, bend: 60 + 40 * beckon}} : dir.armR, head: {yaw: lerp(-20, 0, turn), pitch: lerp(-14, 0, turn)}});
  // Friend: off the last treads, then walks east just behind the Director
  const kF = sk(t, [[0, 11.5], [1.6, 15.8]], 0.2);
  if (kF < 15.4) out.push(climber(look('friend'), STAIR, kF, 1, {t, seed: 33, dmg: dmg('friend', T), face: FACE.focus, head: {pitch: 10}}, {lean: 6}));
  else out.push(mover(look('friend'), {x0: 6480, dist: sk(t, [[1.6, 0], [4, 470]], 0.2), dir: 1, ground: 0, gait: G_WALK, t}, {seed: 33, dmg: dmg('friend', T), face: {...FACE.focus, lookX: -0.3}, head: {yaw: -25}}));
  // the support pair on the stairs: the carrier steps every tread; the teammate hops on her right foot
  const kC = sk(t, [[0, 6.2], [4, 15.2]], 0.15);
  const car = climber(look('carrier'), STAIR, kC, 1, {t, seed: 35, dmg: dmg('carrier', T), face: FACE.grit, breath: 0.7}, {drop: 26, lean: 4});
  const kT = kC - 0.55;
  const qt = treads(STAIR, kT);
  const hop = Math.abs(Math.sin(Math.PI * (kT % 1)));
  const tmP: ActorProps = {
    look: look('teammate'), t, seed: 36, dmg: dmg('teammate', T), face: FACE.pain, breath: 0.9,
    x: (qt.footR.x + qt.footL.x) / 2 - 18, y: Math.max(qt.footR.y, qt.footL.y), z: -30, yaw: 90, drop: 30 + 10 * hop, lean: 6, side: 5,
    legR: {foot: {x: (hop > 0.5 ? qt.footR.x : qt.footL.x), y: Math.max(qt.footR.y, qt.footL.y) - 10}},
    legL: {foot: {x: (qt.footR.x + qt.footL.x) / 2 - 40, y: Math.max(qt.footR.y, qt.footL.y) - 46}, pitch: 30},
    head: {pitch: 12},
  };
  out.push(...linkPair(car, tmP));
  // builder: terrace → stairs
  const kB = sk(t, [[0, -1], [0.7, 0.4], [4, 9.4]], 0.2);
  if (kB < 0) out.push(mover(look('builder'), {x0: 5300, dist: 300 + kB * 300, dir: 1, ground: -700, gait: G_WALK, t}, {seed: 37, dmg: dmg('builder', T), face: FACE.tired}));
  else out.push(climber(look('builder'), STAIR, kB, 1, {t, seed: 37, dmg: dmg('builder', T), face: FACE.tired, armL: {fk: {fwd: 6, out: 14, bend: 20}}}));
  // civilians: woman, older man, teen — along the terrace, then down
  [[0, 5050, 1.3, 7.2], [1, 4900, 2.3, 4.6], [2, 4760, 3.1, 2.6]].forEach(([i, x0, tStair, kEnd]) => {
    const lk = CIV[i];
    const sd = 50 + i;
    if (t < tStair) out.push(mover(lk, {x0, dist: (5600 - x0) * clamp(t / tStair), dir: 1, ground: -700, gait: G_WALK, t, s: lk.height ?? 1}, {seed: sd, face: FACE.worry}));
    else out.push(climber(lk, STAIR, sk(t, [[tStair, 0], [4, kEnd * clamp((4 - tStair) / (4 - tStair))]], 0.1), 1, {t, seed: sd, s: lk.height ?? 1, face: FACE.worry}));
  });
  return out;
};

/** Join the carrier and the teammate: her right arm over his shoulders, his left arm round her back. */
export const linkPair = (car: ActorProps, tm: ActorProps): ActorProps[] => {
  const rc = solve({...car, z: 0.05}), rt = solve({...tm, z: 0});
  const sh = rc.sh[1];
  const hip = rt.hip[0];
  return [
    {...car, z: 0.05, armL: {hand: {x: hip.x - 4, y: hip.y - 26, z: hip.z - 10}, pole: {x: -0.2, y: 1, z: -1}}, zArm: [-110, undefined]},
    {...tm, z: 0, armR: {hand: {x: sh.x + 6, y: sh.y + 4, z: sh.z + 12}, pole: {x: 0, y: -0.4, z: -1}}, armL: {hand: {x: rt.P.x + 38, y: rt.P.y - 92, z: rt.P.z + 30}, pole: {x: -0.3, y: 1, z: 0.6}}, zArm: [undefined, -170], zHand: [undefined, 110], handL: 'fist'},
  ];
};

const camAt = (t: number): Cam => mixCam({x: 6280, y: -760, z: 0.57}, {x: 6720, y: -830, z: 0.55}, smooth(seg(t, 0, 4.4)));

export const C1Shot: React.FC = () => {
  const {t, T} = useShot(ID);
  const cam = smoothCam(camAt, t, 0.3);
  const pan = keys(t, [[0, 55], [1.1, 52], [2.1, -58]]);
  const lock = smooth(seg(t, 2.15, 2.75));
  return (
    <AvenueScene id="c1" cam={cam} T={T} crew={crewC1(t, T)} pole={{pan, lock, look: {x: -0.5 * smooth(seg(t, 1.6, 2.4)), y: 0.35}}}
      drones={<FarDrones T={T} />} />
  );
};

/** The distant formation over the avenue (continuity with the assembly view). */
export const FarDrones: React.FC<{T: number; dy?: number}> = ({T, dy = 0}) => (
  <g>{[0, 1, 2].map((i) => <Drone key={i} x={8700 + i * 420} y={-2500 - (i % 2) * 120 + dy} s={0.8} t={T} seed={60 + i} face={-0.4} look={{x: -0.4, y: 0.6}} />)}</g>
);

const c = at(shot(ID).start);
export const CUES: Cue[] = [
  c(0, 'steps_gravel', {dur: 4, gain: -2, pan: -0.2, fade: 0.4}),
  c(0.2, 'breath_ragged', {dur: 3.6, gain: -2, pan: -0.3}),
  c(1.15, 'servo_whir', {pan: 0.7, dist: 0.3, gain: 2}),
  c(2.45, 'sensor_lock', {pan: 0.7, dist: 0.3}),
];
void clamp;
