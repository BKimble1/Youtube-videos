// Drone: a small quadcopter with a sensor gimbal. Hover, bank with velocity, dive, ram, observe from a vantage point
// (gimbal looks at a target), mark (thin beam), cut a cable (extending cutter arm), get hit (tumble and crash, wreck
// persists) or be smashed apart (pieces thrown). Pose is a pure function of time and the caller's position/velocity.
import React from 'react';
import {V3, add3, sub3, mul3, norm3, len3, clamp, lerp, rnd, noise, smooth, easeIn, f2} from '../../kit/math';
import {Item, project, toView, shade} from '../engine';
import {DRONE, DRONE_ROTORS, DEBRIS} from './parts';
import {Pose3, rotHeading, rcomp, euler, lookFrame, rmul, apply, rotAxisM, segFrame, I3} from './mat3';
import {Ground, FLAT, partItem, partItemS, eyeGlow, beam, makeThrow, thrownPose, spray} from './kit';
import {Impact} from './unit';

export type DroneSpec = {
  id: number;
  t: number;
  pos: V3;
  heading: number;
  /** current velocity (m/s) — tilts the body into the motion */
  vel?: V3;
  /** gimbal looks at this world point */
  look?: V3;
  eye?: 'cyan' | 'amber' | 'off';
  lockAt?: number;
  /** marking/scan beam to a target between t0 and t1 */
  mark?: {target: V3; t0?: number; t1?: number; color?: 'cyan' | 'amber'};
  /** cutter arm extension 0..1 */
  cutter?: number;
  /** hit: tumbles from where it was at t0 and crashes (wreck stays) */
  hit?: {t0: number; dir: V3};
  /** smashed apart at t0 (pieces thrown along dir) */
  smash?: {t0: number; dir: V3; speed?: number};
  /** shielding: hovering in front of someone and taking a blow — shake + sparks at t0 */
  struck?: {t0: number; dir: V3};
  scale?: number;
  ground?: Ground;
  lod?: 'full' | 'far';
  key?: string;
};

const UP: V3 = {x: 0, y: 1, z: 0};

/** Body pose at t (before any hit/smash). */
const bodyPose = (sp: DroneSpec, t: number): Pose3 => {
  const sc = sp.scale ?? 1;
  const wob = {x: noise(t * 1.3, sp.id) * 0.05, y: noise(t * 1.7, sp.id + 4) * 0.06, z: noise(t * 1.1, sp.id + 8) * 0.05};
  let pos = add3(sp.pos, mul3(wob, sc));
  // tilt into velocity: forward pitch with forward speed, roll with lateral speed (relative to heading)
  const h = (sp.heading * Math.PI) / 180;
  const f = {x: Math.sin(h), y: 0, z: -Math.cos(h)}, r = {x: Math.cos(h), y: 0, z: Math.sin(h)};
  const v = sp.vel ?? {x: 0, y: 0, z: 0};
  const pitch = clamp((v.x * f.x + v.z * f.z) * 5, -32, 38) + noise(t * 2.1, sp.id + 2) * 2;
  const roll = clamp((v.x * r.x + v.z * r.z) * -5, -35, 35) + noise(t * 1.9, sp.id + 3) * 2;
  let R = rcomp(rotHeading(sp.heading), euler(0, pitch, roll));
  if (sp.struck) {
    const u = t - sp.struck.t0;
    if (u > 0 && u < 1.2) {
      const e = Math.exp(-u * 4);
      pos = add3(pos, mul3(norm3(sp.struck.dir), 0.35 * Math.sin(Math.min(u * 10, Math.PI / 2)) * e));
      R = rcomp(R, euler(Math.sin(u * 25) * 18 * e, Math.sin(u * 19) * 14 * e, Math.sin(u * 23) * 22 * e));
    }
  }
  return {pos, R};
};

/** World attach points: body, eye, cutter tip. */
export const droneAttach = (sp: DroneSpec) => {
  const P = droneWorldPose(sp, sp.t);
  const sc = sp.scale ?? 1;
  const gim = gimbalPose(sp, P, sc);
  return {body: P.pos, eye: apply(gim, {x: 0, y: -0.055 * sc, z: -0.075 * sc}), cutterTip: apply(P, {x: 0, y: -0.02 * sc, z: (-0.30 - 0.12 * (sp.cutter ?? 0)) * sc})};
};

const gimbalPose = (sp: DroneSpec, P: Pose3, sc: number): Pose3 => {
  const mount = apply(P, {x: 0, y: -0.05 * sc, z: -0.1 * sc});
  if (sp.look) {
    const d = norm3(sub3(sp.look, mount));
    return {pos: mount, R: lookFrame(d, rmul(P.R, UP))};
  }
  return {pos: mount, R: rcomp(P.R, euler(0, 12, 0))};
};

/** Tumbling fall after a hit: spins down along a curve and crashes; returns pose (lands and stays). */
const droneWorldPose = (sp: DroneSpec, t: number): Pose3 => {
  if (!sp.hit || t < sp.hit.t0) return bodyPose(sp, t);
  const g = sp.ground ?? FLAT;
  const P0 = bodyPose(sp, sp.hit.t0);
  const th = makeThrow(sp.hit.t0, P0.pos, sp.hit.dir, 3.2, sp.id * 41, 0.2);
  return thrownPose(th, t, g, P0.R, 0.06 * (sp.scale ?? 1));
};

export const droneImpacts = (sp: DroneSpec): Impact[] => {
  const out: Impact[] = [];
  if (sp.hit) out.push({t: sp.hit.t0, pos: bodyPose(sp, sp.hit.t0).pos, dir: sp.hit.dir, strength: 2, kind: 'blow'});
  if (sp.smash) out.push({t: sp.smash.t0, pos: bodyPose(sp, sp.smash.t0).pos, dir: sp.smash.dir, strength: 3, kind: 'plate'});
  if (sp.struck) out.push({t: sp.struck.t0, pos: bodyPose(sp, sp.struck.t0).pos, dir: sp.struck.dir, strength: 2, kind: 'blow'});
  return out;
};

export const drone = (sp: DroneSpec): Item[] => {
  const t = sp.t;
  const key = sp.key ?? `d${sp.id}`;
  const sc = sp.scale ?? 1;
  const g = sp.ground ?? FLAT;
  const eyeState = (sp.hit && t > sp.hit.t0 + 0.2) || (sp.smash && t >= sp.smash.t0) ? 'off' : sp.lockAt !== undefined && t >= sp.lockAt ? 'amber' : sp.eye ?? 'cyan';
  if (sp.lod === 'far') {
    const P = droneWorldPose(sp, t);
    return [{
      kind: 'sprite', pos: P.pos, key: `${key}_far`,
      draw: (c) => {
        const w = 0.75 * sc * c.k;
        if (w < 0.6) return null;
        const col = shade(c.light, {base: '#4C5D69'}, c.lit);
        return (
          <g>
            <rect x={f2(c.x - w / 2)} y={f2(c.y - w * 0.07)} width={f2(w)} height={f2(Math.max(0.8, w * 0.14))} rx={f2(w * 0.05)} fill={col} />
            {eyeState !== 'off' && <circle cx={f2(c.x)} cy={f2(c.y + w * 0.1)} r={f2(Math.max(0.6, w * 0.06))} fill={eyeState === 'cyan' ? '#62D6EA' : '#FFB23F'} />}
          </g>
        );
      },
    }];
  }
  const items: Item[] = [];
  const remap = eyeState === 'amber' ? {m_eye: 'm_eyeLock'} : eyeState === 'off' ? {m_eye: 'm_eyeOff'} : undefined;
  if (sp.smash && t >= sp.smash.t0) {
    // pieces: body, gimbal, four arms/rotors, shards
    const P0 = bodyPose(sp, sp.smash.t0);
    const pieces: {mesh: keyof typeof DRONE | 'shard'; off: V3}[] = [
      {mesh: 'body', off: {x: 0, y: 0, z: 0}}, {mesh: 'gimbal', off: {x: 0, y: -0.05, z: -0.1}},
      {mesh: 'shard', off: {x: 0.2, y: 0, z: 0.1}}, {mesh: 'shard', off: {x: -0.2, y: 0, z: -0.1}}, {mesh: 'shard', off: {x: 0.1, y: 0.02, z: -0.2}},
    ];
    pieces.forEach((pc, k) => {
      const p0 = apply(P0, mul3(pc.off, sc));
      const th = makeThrow(sp.smash!.t0, p0, add3(sp.smash!.dir, mul3(norm3(pc.off.x || pc.off.z ? pc.off : {x: 0.1, y: 0, z: 0}), 0.8)), sp.smash!.speed ?? 5, sp.id * 53 + k);
      const Q = thrownPose(th, t, g, P0.R, 0.04);
      const mesh = pc.mesh === 'shard' ? DEBRIS.shard : DRONE[pc.mesh];
      items.push(partItemS(mesh, Q, sc, `${key}_pc${k}`, {remap}));
    });
    DRONE_ROTORS.forEach((rp, k) => {
      const p0 = apply(P0, mul3(rp, sc));
      const th = makeThrow(sp.smash!.t0, p0, add3(sp.smash!.dir, mul3(norm3({x: rp.x, y: 0.3, z: rp.z}), 1.2)), (sp.smash!.speed ?? 5) * 1.1, sp.id * 59 + k);
      items.push(partItemS(DRONE.rotor, thrownPose(th, t, g, P0.R, 0.02), sc, `${key}_rt${k}`));
    });
    items.push(...spray(t, sp.smash.t0, P0.pos, sp.smash.dir, 16, 4.5, 'spark', sp.id * 7, `${key}_sp`, g, 0.55));
    return items;
  }
  const P = droneWorldPose(sp, t);
  items.push(partItemS(DRONE.body, P, sc, `${key}_body`));
  items.push(partItemS(DRONE.arms, P, sc, `${key}_arms`));
  const crashed = sp.hit && t > sp.hit.t0;
  DRONE_ROTORS.forEach((rp, k) => {
    const Pr: Pose3 = {pos: apply(P, mul3(rp, sc)), R: P.R};
    if (!crashed || k % 2 === 0) items.push(partItemS(DRONE.rotor, Pr, sc, `${key}_r${k}`));
  });
  const gim = gimbalPose(sp, P, sc);
  items.push(partItemS(DRONE.gimbal, gim, sc, `${key}_gim`, {remap}));
  if ((sp.cutter ?? 0) > 0.01 && !crashed) {
    const ext = sp.cutter ?? 0;
    const Pc: Pose3 = {pos: apply(P, {x: 0, y: -0.02 * sc, z: (0.05 - 0.12 * ext) * sc}), R: rcomp(P.R, euler(0, 10 * (1 - ext), 0))};
    items.push(partItemS(DRONE.cutter, Pc, sc, `${key}_cut`));
  }
  const eyeW = apply(gim, {x: 0, y: -0.055 * sc, z: -0.075 * sc});
  if (eyeState !== 'off') items.push(eyeGlow(eyeW, eyeState, 0.9, 0.025 * sc, `${key}_eg`));
  if (sp.mark && eyeState !== 'off' && t >= (sp.mark.t0 ?? -1e9) && t <= (sp.mark.t1 ?? 1e9)) {
    const k = smooth((t - (sp.mark.t0 ?? -1e9)) / 0.15) * (1 - smooth((t - (sp.mark.t1 ?? 1e9) + 0.15) / 0.15));
    items.push(beam(eyeW, sp.mark.target, sp.mark.color ?? (eyeState === 'amber' ? 'amber' : 'cyan'), 0.85 * k, `${key}_bm`));
  }
  if (sp.struck) items.push(...spray(t, sp.struck.t0, P.pos, sp.struck.dir, 12, 3.5, 'spark', sp.id * 9, `${key}_ss`, g, 0.5));
  if (sp.hit) {
    items.push(...spray(t, sp.hit.t0, P.pos, sp.hit.dir, 10, 3, 'spark', sp.id * 11, `${key}_hs`, g, 0.5));
  }
  return items;
};
void [len3, lerp, rnd, easeIn, rotAxisM, segFrame, I3, project, toView, rmul];
