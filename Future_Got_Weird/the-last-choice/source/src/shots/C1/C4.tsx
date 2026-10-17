// C4 · 0:58.6–1:04.6 · The Director signals: up the maintenance stair at pier 1, into the crash dust drifting west.
// Hold on the sealed gap — sealed for nobody. The pole camera loses them and searches; drones sweep the street along
// the forecast route, find nothing, then the lead drone tilts its sensor up — the correction — and they rise toward
// the viaduct.
import React from 'react';
import {Cam, mixCam, smoothCam} from '../../kit/cam';
import {useShot} from '../../film/useShot';
import {look, dmg, CIV, limpOf} from '../../film/crew';
import {at, Cue} from '../../film/cue';
import {shot} from '../../film/timing';
import {ActorProps} from '../../rig/actor';
import {clamp, seg, smooth, lerp, keys, noise, V2} from '../../kit/math';
import {pierStairSteps, CATWALK} from '../../sets/city';
import {Smoke, Dust} from '../../fx';
import {AvenueScene, Drone} from './scene';
import {FarDrones, STAIR, linkPair} from './C1';
import {mover, climber, stand, G_HURRY, G_WALK, FACE, sk} from './kit';

const ID = 'C4';
// the pier stair: approach on the street, 25 treads to the catwalk, then along the catwalk
export const PIER: V2[] = [{x: 6470, y: 0}, {x: 6540, y: 0}, ...pierStairSteps(), {x: 7520, y: CATWALK}, {x: 7620, y: CATWALK}, {x: 7720, y: CATWALK}];
const kOf = (t: number, t0: number, rate: number, k0 = 0) => Math.max(k0, k0 + (t - t0) * rate);

export const crewC4 = (t: number, T: number): ActorProps[] => {
  const out: ActorProps[] = [];
  // Director: signals (points up at the stair), waits for the others, goes up last
  const point = smooth(seg(t, 0.15, 0.5)) * (1 - smooth(seg(t, 1.5, 1.9)));
  const dGo = sk(t, [[1.7, 0], [2.6, 470]], 0.2);
  if (t < 2.6) {
    const base = t < 1.7 ? stand(look('director'), 7090, 0, {t}, 40, -1) : mover(look('director'), {x0: 7090, dist: dGo, dir: -1, ground: 0, gait: G_HURRY, t});
    out.push({...base, seed: 31, dmg: dmg('director', T), breath: 0.7, yaw: t < 1.7 ? lerp(-90, -40, point) : -90,
      armR: point > 0.01 ? {fk: {fwd: lerp(10, 150, point), out: 20, bend: 10}} : base.armR, handR: point > 0.5 ? 'open' : 'mitt',
      head: {pitch: -20 * point, yaw: 0}, face: FACE.focus});
  } else out.push(climber(look('director'), PIER, kOf(t, 2.6, 3.4, 0.4), 1, {t, seed: 31, dmg: dmg('director', T), face: FACE.focus, breath: 0.7}, {lean: 12}));
  // the friend now supports the teammate; they go up slowly, the teammate hopping
  const kP = kOf(t, 1.0, 1.7);
  const pairSup = climber(look('friend'), PIER, kP, 1, {t, seed: 33, dmg: dmg('friend', T), face: FACE.grit, breath: 0.7}, {drop: 26, lean: 6});
  const kT = kP - 0.55;
  const tm: ActorProps = (() => {
    const lk = look('teammate');
    if (kT <= 0.05) return {...stand(lk, 6938 - 300 * smooth(seg(t, 0.4, 1.0)), 0, {t}, 20), seed: 36, dmg: dmg('teammate', T), face: FACE.pain, z: -30, lean: 8, drop: 24, legL: {foot: {x: 6900, y: -36}, pitch: 30}};
    const h = PIER[Math.min(PIER.length - 1, Math.max(0, Math.floor(kT + 0.5)))];
    return {look: lk, t, seed: 36, dmg: dmg('teammate', T), face: FACE.pain, breath: 0.9, x: h.x - 14, y: h.y, z: -30, yaw: 90, drop: 30 + 8 * Math.abs(Math.sin(Math.PI * kT)), lean: 8, side: 5,
      legR: {foot: {x: h.x, y: h.y - 10}}, legL: {foot: {x: h.x - 36, y: h.y - 44}, pitch: 30}, head: {pitch: 10}};
  })();
  // before they reach the treads, walk them over as a pair (the friend from 7042 → the stair base)
  if (kP <= 0.05) {
    const fx = lerp(7042, 6560, smooth(seg(t, 0.35, 1.0)));
    out.push(...linkPair({...stand(look('friend'), fx, 0, {t}, 30), seed: 33, dmg: dmg('friend', T), face: FACE.grit}, {...tm, x: fx - 36}));
  } else out.push(...linkPair(pairSup, tm));
  // builder: up quickly ahead of them
  const kB = kOf(t, 0.7, 3.2);
  out.push(kB < 0.05
    ? {...mover(look('builder'), {x0: 6875, dist: 335 * smooth(seg(t, 0.25, 0.7)), dir: -1, ground: 0, gait: G_HURRY, t}), seed: 37, dmg: dmg('builder', T), face: FACE.tired}
    : climber(look('builder'), PIER, kB, 1, {t, seed: 37, dmg: dmg('builder', T), face: FACE.tired, breath: 0.7}));
  // carrier: limps to the stair, climbs with his good hand on the rail, the cut forearm held in
  const kC = kOf(t, 1.6, 2.1);
  const limp = limpOf('carrier', T);
  const cBase = kC < 0.05
    ? mover(look('carrier'), {x0: 6952, dist: 400 * smooth(seg(t, 0.3, 1.6)), dir: -1, ground: 0, gait: {...G_WALK, limp}, t})
    : climber(look('carrier'), PIER, kC, 1, {t}, {lean: 10});
  out.push({...cBase, seed: 35, dmg: dmg('carrier', T), face: FACE.pain, breath: 0.8, armL: {fk: {fwd: 40, out: 4, bend: 110}}, handL: 'fist'});
  // civilians: off the terrace stairs and straight up the pier stair
  [[0, 15.6, 0.0, 3.6], [1, 12.6, 0.0, 3.2], [2, 10.4, 0.0, 3.4]].forEach(([i, k0, , rate]) => {
    const lk = CIV[i];
    // continue down the terrace stairs to the street, then the pier stair
    const kDown = Math.min(STAIR.length - 1, k0 + t * 3.4);
    const tDown = Math.max(0, (16.5 - k0) / 3.4);
    if (t < tDown) out.push(climber(lk, STAIR, kDown, 1, {t, seed: 50 + i, s: lk.height ?? 1, face: FACE.worry}));
    else out.push(climber(lk, PIER, kOf(t, tDown + 0.25 * i, rate), 1, {t, seed: 50 + i, s: lk.height ?? 1, face: FACE.worry}));
  });
  return out;
};

const camAt = (t: number): Cam => mixCam({x: 7850, y: -760, z: 0.42}, {x: 7900, y: -880, z: 0.42}, smooth(seg(t, 3.8, 6)));

// three drones sweep west low over the street, then the lead one looks up and they rise
const drone = (i: number, t: number) => {
  const t0 = 1.2 + i * 0.35;
  const sweep = smooth(seg(t, t0, t0 + 2.8));
  const up = smooth(seg(t, 4.35 + i * 0.12, 6.2));
  const x = lerp(10500 + i * 260, 7980 + i * 300, sweep) - 120 * up;
  const y = lerp(-400 - i * 60, -430 - i * 50, sweep) - 1150 * up + 14 * noise(t * 1.3, i);
  const lookUp = i === 0 ? smooth(seg(t, 4.0, 4.3)) : smooth(seg(t, 4.4, 4.7));
  const scan = Math.sin(t * 2.4 + i) * 0.5 * (1 - lookUp);
  return {x, y, tilt: -10 * (1 - up) * sweep + 14 * up, look: {x: lerp(scan, -0.2, lookUp), y: lerp(0.85, -0.85, lookUp)}, lock: i === 0 ? smooth(seg(t, 4.05, 4.25)) : 0, face: -0.6 + 0.3 * up};
};

export const C4Shot: React.FC = () => {
  const {t, T} = useShot(ID);
  const cam = smoothCam(camAt, t, 0.3);
  const lost = smooth(seg(t, 2.6, 3.3));
  const pole = {pan: -58 + 35 * Math.sin(t * 1.6) * lost, lock: 1 - lost, look: {x: -0.5 + 0.6 * noise(t * 1.8, 3) * lost, y: 0.3}};
  const dust = smooth(seg(t, 1.6, 3.6));
  const drones = (
    <g>
      <FarDrones T={T} />
      {[0, 1, 2].map((i) => { const d = drone(i, t); return <Drone key={i} x={d.x} y={d.y} s={2.1} t={T} seed={70 + i} face={d.face} tilt={d.tilt} look={d.look} lock={d.lock} />; })}
    </g>
  );
  const front = (
    <g>
      <Smoke mode="cloud" x={6900} y={-420} w={1300} h={800} n={10} t={T} drift={-30} color="#A8978A" opacity={0.55 * dust} seed={21} id="c4d1" />
      <Smoke mode="cloud" x={7600} y={-260} w={1500} h={520} n={8} t={T} drift={-50} color="#9C8C80" opacity={0.45 * dust} seed={22} id="c4d2" />
      <Dust x={8400} y={40} t={T} t0={shot(ID).start - 0.2} size={500} n={12} seed={23} dir={-1} life={4} />
    </g>
  );
  return <AvenueScene id="c4" cam={cam} T={T} crew={crewC4(t, T)} pole={pole} drones={drones} front={front} />;
};

const c = at(shot(ID).start);
export const CUES: Cue[] = [
  c(0.8, 'step_grate', {dur: 4.6, pan: -0.5, dist: 0.35, gain: -2, fade: 0.3}),
  c(1.2, 'drone_rotor', {dur: 4.8, pan: 0.4, dist: 0.3, gain: 4, fade: 0.8}),
  c(2.8, 'servo_whir', {pan: 0.1, dist: 0.3, gain: -2}),
  c(4.05, 'sensor_lock', {pan: 0.2, dist: 0.3, gain: 1}),
  c(4.4, 'servo_whir', {pan: 0.1, dist: 0.35, gain: -1, rate: 1.15}),
  c(0, 'breath_ragged', {dur: 3, gain: -5, pan: -0.4}),
];
void keys; void clamp;
