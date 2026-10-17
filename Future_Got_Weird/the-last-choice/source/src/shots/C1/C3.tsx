// C3 · 0:54.6–0:58.6 · The hauler slams the gap: it rams the burned taxi at the narrow point, shoves it west and
// stops wedged — sealed. Glass explodes, debris sprays across the escape line. The carrier turns the teammate away
// into the builder's arms and takes a flying door on his raised forearm; he's thrown down (the gash appears at
// C3 + 1.4 s, crew.ts). The friend hauls him up; from here he guards the arm and limps.
import React from 'react';
import {Cam, mixCam, shake, smoothCam} from '../../kit/cam';
import {useShot} from '../../film/useShot';
import {look, dmg, CIV} from '../../film/crew';
import {at, Cue} from '../../film/cue';
import {shot} from '../../film/timing';
import {ActorProps, solve, handCenter} from '../../rig/actor';
import {clamp, seg, smooth, lerp, keys, rad, f2, easeOut} from '../../kit/math';
import {GlassShards, Debris, Sparks, Dust, Smoke} from '../../fx';
import {C} from '../../theme';
import {AvenueScene} from './scene';
import {FarDrones, STAIR} from './C1';
import {mover, climber, supportPair, stand, G_HURRY, FACE, sk} from './kit';
import {T_CONTACT} from './machines';

const ID = 'C3';
const S0 = shot(ID).start;
export const TC = T_CONTACT - S0; // 0.6
export const T_HIT = 1.38; // the door hits the carrier's forearm

// the flying door: launched from the taxi at contact, hits the carrier's raised forearm, drops
const DOOR0 = {x: 9000, y: -330}, DOOR_HIT = {x: 7105, y: -352};
const G = 1500;
const door = (t: number) => {
  const t0 = TC + 0.04, fl = T_HIT - t0;
  const vx = (DOOR_HIT.x - DOOR0.x) / fl, vy = (DOOR_HIT.y - DOOR0.y - 0.5 * G * fl * fl) / fl;
  if (t < t0) return null;
  if (t <= T_HIT) {
    const a = t - t0;
    return {x: DOOR0.x + vx * a, y: DOOR0.y + vy * a + 0.5 * G * a * a, rot: -20 - 540 * a};
  }
  // deflected: pops up off the arm and falls flat on the asphalt
  const a = t - T_HIT;
  const ground = 40;
  const x = DOOR_HIT.x + 260 * a * Math.exp(-a * 1.2);
  const yFree = DOOR_HIT.y - 420 * a + 0.5 * 2400 * a * a;
  const y = Math.min(ground - 20, yFree);
  const landed = yFree >= ground - 20;
  const rotHit = -20 - 540 * fl;
  return {x, y, rot: landed ? -178 : rotHit + 300 * a};
};
const Door: React.FC<{t: number; ink: number}> = ({t, ink}) => {
  const d = door(t);
  if (!d) return null;
  return (
    <g transform={`translate(${f2(d.x)} ${f2(d.y)}) rotate(${f2(d.rot)})`}>
      <path d="M -120 -70 L 110 -74 L 124 60 L -116 66 Z" fill="#F6B91C" stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
      <path d="M -100 -60 L 90 -62 L 70 -4 L -96 -2 Z" fill="#1A1418" stroke={C.ink} strokeWidth={ink * 0.7} />
      <path d="M -96 -2 L 40 -50" stroke="#7A93A6" strokeWidth={ink * 1.2} />
      <rect x={30} y={14} width={44} height={10} rx={4} fill="#C98E0A" />
    </g>
  );
};

export const crewC3 = (t: number, T: number): ActorProps[] => {
  const out: ActorProps[] = [];
  const brace = smooth(seg(t, 0.78, 1.12));
  // ---- the pair walks on until the crash
  const dP = 600 + sk(t, [[0, 0], [TC, 12], [TC + 0.2, 14]], 0.1);
  const [sup0, tm0] = supportPair(look('carrier'), look('teammate'), {x: 6420, ground: 0, dist: dP, dir: 1, t, seed: 17, supDmg: dmg('carrier', T), tmDmg: dmg('teammate', T), supFace: FACE.grit, tmFace: FACE.pain});
  // ---- carrier: brace and guard, hit, thrown down, hauled up
  const fall = smooth(seg(t, T_HIT, T_HIT + 0.45));
  const rise = smooth(seg(t, 2.45, 3.2));
  const cx = keys(t, [[0, sup0.x], [0.8, sup0.x], [1.12, sup0.x + 40], [T_HIT, sup0.x + 44], [T_HIT + 0.45, 6930, easeOut], [2.45, 6930], [3.2, 6952]]);
  const sitting = fall * (1 - rise);
  const carrier: ActorProps = {
    look: look('carrier'), t, seed: 35, dmg: dmg('carrier', T), breath: 0.8,
    x: cx, y: 0, z: 46, yaw: lerp(90, 58, brace) + 6 * rise,
    drop: lerp(10, 20, brace) + 104 * sitting,
    lean: t < T_HIT ? lerp(9, 14, brace) : lerp(-30, -14, smooth(seg(t, T_HIT + 0.2, T_HIT + 0.6))) * (1 - rise) + lerp(0, 30, smooth(seg(t, 2.35, 2.6))) * (1 - smooth(seg(t, 2.9, 3.3))) + 4 * rise,
    legL: {foot: {x: (sitting > 0.3 ? cx + 70 : cx - 34), y: -10}, pitch: 0},
    legR: {foot: {x: (sitting > 0.3 ? cx + 118 : cx + 40), y: -10}},
    face: t < T_HIT ? FACE.grit : {mouth: 'pain', brows: -0.5, worry: 0.6, lids: t < 2.3 ? 0.5 : 0.2},
    head: {pitch: t > T_HIT + 0.3 ? 14 : 0, roll: t > T_HIT && t < T_HIT + 0.4 ? -12 : 0},
  };
  const rc = solve(carrier);
  const guard = brace * (1 - smooth(seg(t, T_HIT + 0.05, T_HIT + 0.35)));
  const clutch = smooth(seg(t, 1.9, 2.2)) * (1 - smooth(seg(t, 2.3, 2.45))) + smooth(seg(t, 3.15, 3.5));
  const leftForearm = {x: rc.P.x + 52, y: rc.P.y - 70, z: rc.P.z + 30};
  carrier.armL = guard > 0.01
    ? {hand: {x: rc.headC.x + 58, y: rc.headC.y + 10, z: rc.P.z + 60}, w: guard, pole: {x: 0, y: 1, z: -0.6}}
    : t > T_HIT ? {hand: leftForearm, pole: {x: -0.4, y: 1, z: 0.4}} : sup0.armL;
  carrier.handL = 'fist';
  // ---- friend: at the teammate's far side; goes to the carrier, grips his hand with both hands, hauls him up
  const fx = keys(t, [[0, 6990], [1.75, 6990], [2.15, 7042]]);
  const reach = smooth(seg(t, 1.95, 2.3));
  const haul = smooth(seg(t, 2.45, 3.1));
  const friendBase: ActorProps = {
    look: look('friend'), t, seed: 33, dmg: dmg('friend', T),
    x: fx, y: 0, z: lerp(-70, 90, smooth(seg(t, 1.7, 2.1))), yaw: lerp(90, -60, smooth(seg(t, 1.6, 2.0))),
    drop: 8 + 50 * reach * (1 - haul) + 18 * haul, lean: 34 * reach * (1 - haul) - 14 * haul,
    legL: {foot: {x: fx + 36, y: -10}}, legR: {foot: {x: fx - 40, y: -10}},
    face: t < 1.6 ? FACE.alarm : FACE.grit, head: {pitch: 18 * reach * (1 - haul)},
  };
  const rf = solve(friendBase);
  // the clasp: halfway between her reach and his right hand
  const carrierHand = handCenter(rc, 1);
  const clasp = {x: lerp(carrierHand.x, rf.P.x - 70, 0.55), y: lerp(carrierHand.y, rf.P.y - 40, 0.4), z: 40};
  const holding = reach > 0.01 && t < 3.25;
  const friend: ActorProps = {
    ...friendBase,
    armL: holding ? {hand: {x: clasp.x + 6, y: clasp.y - 8, z: clasp.z - 10}, w: reach} : t < 1.6 ? {fk: {fwd: 30, out: 20, bend: 60}} : undefined,
    armR: holding ? {hand: {x: clasp.x - 6, y: clasp.y + 6, z: clasp.z + 10}, w: reach} : t < 1.6 ? {fk: {fwd: 40, out: 10, bend: 70}} : undefined,
  };
  if (holding && reach > 0.6) carrier.armR = {hand: {x: clasp.x, y: clasp.y, z: clasp.z}, pole: {x: 0, y: 1, z: 0.5}};
  else if (clutch > 0.01) carrier.armR = {hand: {x: leftForearm.x - 30, y: leftForearm.y - 8, z: leftForearm.z + 14}, w: clutch, pole: {x: 0, y: 1, z: 1}};
  // ---- teammate: pushed back into the builder's arms; leans on her
  const push = smooth(seg(t, 0.82, 1.18));
  const tx = lerp(tm0.x, 6938, push);
  const teammate: ActorProps = push < 0.01 ? tm0 : {
    look: look('teammate'), t, seed: 36, dmg: dmg('teammate', T), breath: 1,
    x: tx, y: 0, z: -18, yaw: 90, drop: 28, lean: lerp(12, -14, push) + 6 * smooth(seg(t, 1.6, 2.4)), side: 4,
    legR: {foot: {x: tx + 10, y: -10}}, legL: {foot: {x: tx - 30, y: -36}, pitch: 30},
    armL: {hand: {x: tx + 36, y: -260, z: 20}, pole: {x: -0.3, y: 1, z: 0.6}}, handL: 'fist',
    armR: {fk: {fwd: lerp(40, 60, push), out: 30, bend: 40}},
    face: {mouth: 'open', open: 0.3, worry: 0.9, brows: 0.3}, head: {yaw: 20 * smooth(seg(t, 1.5, 2.0)), pitch: 6},
  };
  // ---- builder: catches her, holds her up by the shoulders
  const bx = keys(t, [[0, 6750], [0.6, 6790], [0.9, 6800], [1.15, 6875]]);
  const catchB = smooth(seg(t, 0.92, 1.15));
  const rt = solve(teammate);
  const builder: ActorProps = {
    ...(t < 0.6 ? mover(look('builder'), {x0: 6480, dist: 270 + 40 * (t / 0.6), dir: 1, ground: 0, gait: G_HURRY, t}) : stand(look('builder'), bx, 0, {t}, 36)),
    seed: 37, dmg: dmg('builder', T), x: bx, z: -40, face: t < TC ? FACE.tired : FACE.alarm, lean: 6 * catchB, drop: 10 + 8 * catchB,
    armR: catchB > 0.01 ? {hand: {x: rt.sh[1].x - 10, y: rt.sh[1].y + 10, z: rt.sh[1].z + 6}, w: catchB} : undefined,
    armL: catchB > 0.01 ? {hand: {x: rt.P.x - 40, y: rt.P.y - 60, z: rt.P.z - 30}, w: catchB} : undefined,
  };
  out.push(carrier, teammate, friend, builder);
  // ---- Director: ducks the debris, rises, turns back, goes to the carrier
  const duck = smooth(seg(t, 0.38, 0.62)) * (1 - smooth(seg(t, 1.3, 1.65)));
  const turnD = smooth(seg(t, 1.5, 1.85));
  const dDist = sk(t, [[1.8, 0], [3.0, 330], [3.3, 340]], 0.2);
  const dirW = t > 1.8 && t < 3.25;
  const dBase = dirW ? mover(look('director'), {x0: 7420, dist: dDist, dir: -1, ground: 0, gait: G_HURRY, t}) : stand(look('director'), 7420 - dDist, 0, {t}, 40);
  out.push({
    ...dBase, seed: 31, dmg: dmg('director', T), breath: 0.7,
    yaw: lerp(90, -90, turnD) + (turnD > 0.99 && !dirW ? 20 : 0), drop: (dBase.drop ?? 6) + 70 * duck, lean: (dBase.lean ?? 3) + 30 * duck,
    armL: duck > 0.01 ? {fk: {fwd: 150, out: 20, bend: 110}} : dBase.armL, armR: duck > 0.01 ? {fk: {fwd: 140, out: 30, bend: 120}} : dBase.armR,
    face: duck > 0.3 ? {mouth: 'grit', brows: -0.8, lids: 0.6} : t > 3.2 ? FACE.worry : FACE.alarm,
    head: {pitch: duck * 30 + (t > 3.1 ? 16 : 0)},
  });
  // ---- civilians at the stair foot cower, then straighten
  const cower = smooth(seg(t, 0.62, 0.85)) * (1 - smooth(seg(t, 1.9, 2.5)));
  [[0, 15.2], [1, 12.6], [2, 10.4]].forEach(([i, k]) => {
    const lk = CIV[i];
    const base = climber(lk, STAIR, k + (i === 0 ? 0.4 * clamp(t / 0.6) : 0), 1, {t, seed: 50 + i, s: lk.height ?? 1, face: cower > 0.3 ? {mouth: 'grit', brows: 0.4, lids: 0.6} : FACE.worry});
    out.push({...base, drop: (base.drop ?? 0) + 60 * cower, lean: (base.lean ?? 0) + 24 * cower, armR: cower > 0.05 ? {fk: {fwd: 130, out: 20, bend: 120}} : base.armR});
  });
  return out;
};

const camAt = (t: number): Cam => {
  const a = {x: 8250, y: -460, z: 0.5}, b = {x: 7250, y: -360, z: 0.7};
  return mixCam(a, b, smooth(seg(t, 0.8, 2.6)));
};

export const C3Shot: React.FC = () => {
  const {t, T} = useShot(ID);
  let cam = smoothCam(camAt, t, 0.2);
  const amp = 22 * Math.exp(-6 * Math.max(0, t - TC)) * (t >= TC ? 1 : 0) + 7 * Math.exp(-8 * Math.max(0, t - T_HIT)) * (t >= T_HIT ? 1 : 0);
  cam = shake(cam, t, amp, 7, 14);
  const ink = 4 / cam.z;
  const fx = (
    <g>
      <Sparks x={9175} y={-230} t={T} t0={T_CONTACT} n={30} dir={-150} spread={110} speed={[700, 1900]} seed={3} width={5} />
      <GlassShards x={9060} y={-300} t={T} t0={T_CONTACT} n={36} dir={-160} spread={70} speed={[800, 2500]} ground={40} seed={5} ink={ink} size={[7, 20]} />
      <Debris x={9180} y={-200} t={T} t0={T_CONTACT} n={14} dir={-152} spread={60} speed={[600, 1900]} ground={40} material="metal" seed={7} ink={ink} size={[10, 34]} />
      <Debris x={9120} y={-40} t={T} t0={T_CONTACT + 0.03} n={16} dir={-172} spread={36} speed={[500, 1500]} ground={40} material="asphalt" seed={8} ink={ink} size={[10, 26]} />
      <Dust x={9100} y={40} t={T} t0={T_CONTACT} size={460} n={14} seed={9} dir={-1} />
      <Dust x={6950} y={20} t={T} t0={S0 + T_HIT + 0.42} size={160} n={8} seed={10} />
      <Smoke mode="column" x={9140} y={-200} t={T} t0={T_CONTACT} t1={T_CONTACT + 3} rate={5} life={3} vx={-40} vy={-120} size={70} grow={90} color="#4A3F42" opacity={0.6} seed={12} id="c3cs" />
      <Door t={t} ink={ink} />
    </g>
  );
  return <AvenueScene id="c3" cam={cam} T={T} crew={crewC3(t, T)} drones={<FarDrones T={T} />} front={fx} grade={{flash: 0.35 * Math.max(0, 1 - (t - TC) / 0.12) * (t >= TC ? 1 : 0)}} />;
};

const c = at(S0);
export const CUES: Cue[] = [
  c(0, 'servo_heavy', {pan: 0.8, dist: 0.25, gain: 3}),
  c(TC, 'wreck_slam', {pan: 0.55, dist: 0.15, gain: 3}),
  c(TC + 0.02, 'glass_shatter', {pan: 0.5, dist: 0.2, gain: 2}),
  c(TC + 0.06, 'metal_tear', {pan: 0.55, dist: 0.25}),
  c(TC + 0.25, 'debris_rain', {pan: 0.1, dist: 0.2, gain: -2}),
  c(T_HIT, 'body_fall', {pan: -0.3, dist: 0.1, gain: 2}),
  c(T_HIT + 0.45, 'body_fall', {pan: -0.35, dist: 0.1, gain: -2, rate: 0.85}),
  c(T_HIT + 0.05, 'breath_exert', {pan: -0.3, gain: -2}),
  c(2.5, 'breath_exert', {pan: -0.3, gain: -4, rate: 0.95}),
  c(TC + 0.2, 'sparks', {pan: 0.55, dist: 0.3, gain: -4}),
];
void rad; void clamp;
