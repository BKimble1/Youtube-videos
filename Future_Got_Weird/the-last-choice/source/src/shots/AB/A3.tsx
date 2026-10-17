// A3 — the pull (0:06.4–0:10.4). Medium, side on. The Director's hand reaches into frame and grips the teammate's
// wrist; the Director drops into a crouch, braces and pulls with their whole weight, shuffling back; the teammate
// slides clear of the raised end. The recovery arm lets go and the taxi slams down where they were (≈0:08.9): dust,
// debris, a jolt. Both sprawl. On the first solo note (M.FIRST_NOTE) the Director lifts the gripping hand and sees a
// small blood mark on the palm — the teammate's — then looks at them.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useShot} from '../../film/useShot';
import {M} from '../../film/timing';
import {look, dmg} from '../../film/crew';
import {Cast, ActorProps, solve, rolled, handCenter} from '../../rig/actor';
import {Cam, Frame, Grade, Layer, shake, mixCam, smoothCam} from '../../kit/cam';
import {clamp, lerp, noise, smooth, easeOut, easeIn, keys} from '../../kit/math';
import {CITY} from '../../theme';
import {Taxi, Rubble, Street, Facades, taxiPoint} from '../../sets/city';
import {RecoveryArm} from '../../mech';
import {Smoke, Dust} from '../../fx/smoke';
import {Embers, Fire} from '../../fx/fire';
import {Debris, GlassShards} from '../../fx/particles';
import {BurningSky, ink as inkL, ease, Place, inkAt, screenY} from './kit';
import {GROUND, PIN, prone, taxiAt, SUPPORT} from './taxi';
import {liftState, ARM_X} from './A2';
import {gait, HURRY} from '../../rig/gait';
import {at, Cue} from '../../film/cue';

const START = 6.4;
const GRIP = 0.62, H0 = 0.85, CYC = 0.3, HD = 0.16, STEP = 0.07, HEAVES = 5, RELEASE = 2.32, SLAM = 2.5;
const NOTE = M.FIRST_NOTE - START; // ≈ 3.14
const STEP_IN = [80, 80, 80, 80, 100]; // each heave's pull (the last one is the yank): 420 in all

/** Distance the teammate has been pulled at time t: only during heaves (the Director's feet step between them). */
const pullAt = (t: number) => STEP_IN.reduce((d, v, k) => d + v * smooth(clamp((t - (H0 + k * CYC)) / HD)), 0);
/** Lean-back bump per heave (weight back through the hips), recovering while the feet step. */
const heaveAt = (t: number) => STEP_IN.reduce((m, _, k) => {
  const a = H0 + k * CYC;
  return Math.max(m, smooth(clamp((t - a) / HD)) * (1 - smooth(clamp((t - a - HD) / (2 * STEP)))));
}, 0);
type V = {x: number; y: number};
const lerpV = (a: V, b: V, k: number): V => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)});

/** The teammate (prone, sliding) and where the Director's hands close on them — one source for both rigs. */
const teammateAt = (T: number, t: number) => {
  const tt = Math.min(t, SLAM);
  const pulled = pullAt(tt);
  const P = {x: PIN.x - 12 - pulled, y: PIN.y};
  const k = pulled / 420;
  const rise = ease(t, GRIP - 0.34, GRIP - 0.06) * (t < SLAM + 0.05 ? 1 : 0); // she lifts her hand to meet the grip
  const spent = ease(t, SLAM + 0.1, SLAM + 0.6);
  const rest = {x: P.x - 335, y: GROUND - 20};
  const up = {x: P.x - 345, y: GROUND - 112 - k * 10};
  const tm = prone(T, {
    P, lift: lerp(16, 24, k) - spent * 14, head: lerp(62, 70, k) - spent * 30, headYaw: lerp(-25, -10, k),
    handR: t < SLAM + 0.05 ? lerpV(rest, up, rise) : {x: P.x - 380, y: GROUND - 6}, handL: {x: P.x - 180 - k * 20, y: GROUND + 2},
    handLShape: 'fist', legBend: k * 10,
    face: {mouth: t < SLAM ? (rise > 0.5 ? 'grit' : 'o') : 'pant', open: 0.4, lids: lerp(0.15, 0.55, spent), worry: 0.9, brows: rise > 0.5 ? -0.3 : 0.5, lookX: -0.6},
  });
  const rig = solve(tm);
  const W = rolled(rig, rig.wr[1]), E = rolled(rig, rig.el[1]), Hc = rolled(rig, handCenter(rig, 1));
  return {tm, P, gripR: lerpV(W, Hc, 0.25), gripL: lerpV(W, E, 0.45)};
};

/** The Director's pelvis x that puts the right shoulder an arm's length (≈150) behind the grip, for a given lean/drop. */
const pelvisFor = (T: number, grip: V, lean: number, drop: number) => {
  const probe: ActorProps = {look: look('director'), t: T, s: 1, x: 0, y: GROUND, yaw: 74, lean, drop};
  const r = solve(probe);
  const sh = r.sh[1];
  const dy = grip.y - sh.y;
  const dx = Math.sqrt(Math.max(0, 150 * 150 - dy * dy));
  return grip.x - dx - sh.x;
};
const leanAt = (t: number) => lerp(36, -22, ease(t, GRIP, H0 + 0.05)) - 16 * heaveAt(t);
const dropAt = (t: number) => lerp(30, 58, ease(t, 0.45, 0.8)) + 10 * heaveAt(t);
const pxAt = (T: number, t: number) => pelvisFor(T, teammateAt(T, t).gripR, leanAt(t), dropAt(t));

export const A3: React.FC = () => {
  const {t, T} = useShot('A3');
  const slamK = Math.max(0, 1 - Math.abs(t - SLAM - 0.03) / 0.35);
  // a push in on the grab, easing back out for the slam
  const camKey = (u: number): Cam => {
    const K: [number, Cam][] = [[0, {x: -1010, y: -130, z: 1.12}], [0.95, {x: -930, y: -104, z: 1.36}], [2.05, {x: -1060, y: -120, z: 1.2}], [4.0, {x: -1090, y: -120, z: 1.18}]];
    for (let i = 1; i < K.length; i++) if (u <= K[i][0]) return mixCam(K[i - 1][1], K[i][1], smooth(clamp((u - K[i - 1][0]) / (K[i][0] - K[i - 1][0]))));
    return K[K.length - 1][1];
  };
  const cam0 = smoothCam(camKey, t, 0.35, 9);
  const horizon = screenY(cam0, -100);
  const cam = shake(cam0, t, 16 * slamK * slamK + 0.5, 7, 13);
  const ik = inkL(cam);

  // ---------------- the wreck: hanging from the claw (A2's end state), released, slams down
  const s0 = liftState(3.2 + Math.min(t, RELEASE));
  const fall = easeIn(clamp((t - RELEASE) / (SLAM - RELEASE)));
  const bounce = Math.max(0, Math.sin(Math.PI * clamp((t - SLAM) / 0.22))) * 10 * (t > SLAM ? 1 : 0);
  const taxi = taxiAt({lift: lerp(s0.lift, 0, fall) + bounce, tilt: lerp(s0.tilt, -1.2, fall), shiftX: s0.shiftX, t: T});
  const clawTgt = taxiPoint(taxi, 300, -72);
  const clawOpen = lerp(0.08, 0.7, ease(t, RELEASE - 0.12, RELEASE + 0.1));
  const clawPos = t < RELEASE ? clawTgt : {x: clawTgt.x, y: Math.min(clawTgt.y, taxiPoint(taxiAt({...s0, t: T}), 300, -72).y) - ease(t, RELEASE, RELEASE + 0.8) * 120};

  // ---------------- the teammate, and the grip points on her wrist / forearm
  const {tm, gripR, gripL} = teammateAt(T, t);

  // ---------------- the Director: hurries in reaching, crouches and grips, heaves (feet planted) and steps between heaves
  const pxGrab = pxAt(T, GRIP);
  const enter = clamp(t / GRIP);
  const xIn = lerp(-2150, pxGrab, easeOut(enter));
  const fallBack = easeOut(clamp((t - SLAM + 0.02) / 0.42)); // thrown down hard at the slam
  const g = gait(-2150, xIn + 2150, 1, {...HURRY, s: 1});
  const footY = (f: {lift: number}) => GROUND - 10 - f.lift;
  // planted footing: back foot 150 behind, front foot 60 ahead of the pelvis; each steps back after its heave
  const plants: number[] = [pxAt(T, H0)];
  for (let k = 0; k < HEAVES; k++) plants.push(pxAt(T, H0 + k * CYC + HD));
  const footAt = (off: number, delay: number) => {
    let x = plants[0] + off, lift = 0;
    for (let k = 0; k < HEAVES; k++) {
      const a = H0 + k * CYC + HD + delay;
      const u = clamp((t - a) / STEP);
      x = lerp(x, plants[k + 1] + off, smooth(u));
      if (u > 0 && u < 1) lift = Math.sin(Math.PI * u) * 22;
    }
    return {x, lift};
  };
  const bF = footAt(-170, 0), fF = footAt(55, STEP);
  const settle = ease(t, GRIP - 0.02, GRIP + 0.15); // from the running stride into the planted crouch
  const gL = {x: g.L.x, y: footY(g.L)}, gR = {x: g.R.x, y: footY(g.R)};
  const crouch = ease(t, 0.45, 0.8);
  const palm = ease(t, NOTE - 0.25, NOTE + 0.3) * (1 - ease(t, 3.75, 4.05) * 0.5);
  const lookTm = ease(t, 3.6, 3.95);
  const reachW = ease(t, 0.38, GRIP); // the reaching hand homes onto the wrist
  let dir: ActorProps;
  const base = {look: look('director'), t: T, seed: 4, s: 1, z: 0.2, dmg: dmg('director', T)};
  if (t < SLAM) {
    const lean = t < GRIP ? lerp(26, 36, crouch) : leanAt(t);
    const drop = t < GRIP ? g.drop + 26 + crouch * 30 : dropAt(t);
    const px = t < GRIP ? xIn : pelvisFor(T, gripR, lean, drop);
    const gripped = t >= GRIP;
    dir = {...base, x: px, y: GROUND, yaw: lerp(82, 74, settle), drop, lean: lean + Math.sin(t * 9) * 1.2 * (t > H0 ? 1 : 0),
      head: {pitch: lerp(-14, 4, settle)},
      legL: {foot: {x: lerp(gL.x, bF.x, settle), y: lerp(gL.y, GROUND - 10 - bF.lift, settle), z: -12}, pitch: (1 - settle) * g.L.pitch},
      legR: {foot: {x: lerp(gR.x, fF.x, settle), y: lerp(gR.y, GROUND - 10 - fF.lift, settle), z: 14}, pitch: (1 - settle) * g.R.pitch},
      armR: {fk: {fwd: 78, out: 6, bend: 8}, hand: {x: gripR.x, y: gripR.y, z: 26}, w: gripped ? 1 : reachW, pole: {x: 0, y: 1, z: 0.6}},
      armL: gripped ? {hand: {x: gripL.x, y: gripL.y, z: 6}, w: ease(t, GRIP, GRIP + 0.18), fk: {fwd: 40, out: 8, bend: 40}, pole: {x: 0, y: 1, z: -0.4}} : {fk: {fwd: 30 + g.armL, out: 8, bend: 40}},
      handR: gripped ? 'fist' : 'open', handL: gripped && t > GRIP + 0.12 ? 'fist' : 'mitt', zHand: [70, 70],
      face: {mouth: 'grit', brows: gripped ? -0.8 : -0.6, squint: gripped ? 0.6 : 0, lookX: 0.6}, breath: 0.9};
  } else {
    // sprawled: thrown back onto the ground by the slam (blended from the last pull pose), propped on the left hand;
    // the right hand comes up — the palm
    const end = teammateAt(T, SLAM - 0.001);
    const sx0 = pelvisFor(T, end.gripR, leanAt(SLAM), dropAt(SLAM));
    const sx = sx0 - fallBack * 170; // thrown back, away from her
    const fb = fallBack;
    const fL = lerpV({x: plants[HEAVES] - 170, y: GROUND - 10}, {x: sx + 120, y: GROUND - 12}, fb);
    const fR = lerpV({x: plants[HEAVES] + 55, y: GROUND - 10}, {x: sx + 190, y: GROUND - 12}, fb);
    const hL = lerpV(end.gripL, {x: sx - 120, y: GROUND - 6}, fb);
    const hR0 = lerpV(end.gripR, {x: sx + 70, y: GROUND - 14}, fb);
    dir = {...base, x: sx, y: GROUND, yaw: lerp(74, 60, fb), drop: lerp(dropAt(SLAM), 128, fb), lean: lerp(leanAt(SLAM), -14, fb) + palm * 10,
      legL: {foot: {x: fL.x, y: fL.y, z: -14}, pole: {x: 0.3, y: lerp(0, -1, fb), z: 0}}, legR: {foot: {x: fR.x, y: fR.y, z: 14}, pole: {x: 0.3, y: lerp(0, -1, fb), z: 0}},
      armL: {hand: {x: hL.x, y: hL.y, z: -20}, pole: {x: -0.3, y: lerp(1, -1, fb), z: 0}},
      armR: palm > 0.02 ? {hand: {x: sx + lerp(60, 82, palm), y: lerp(GROUND - 20, -150, palm), z: 70}, pole: {x: 0.2, y: 1, z: 0.5}} : {hand: {x: hR0.x, y: hR0.y, z: 30}},
      handR: palm > 0.3 ? 'open' : fb < 0.5 ? 'fist' : 'mitt', handL: fb < 0.5 ? 'fist' : 'mitt',
      head: {pitch: lerp(0, 30, palm) * (1 - lookTm) - (1 - fb) * 6, yaw: lookTm * 26 + palm * 12 * (1 - lookTm)},
      face: {mouth: fb < 0.6 ? 'grit' : palm > 0.3 && lookTm < 0.5 ? 'flat' : 'pant', brows: 0.2 + palm * 0.3, worry: 0.6 + lookTm * 0.3, lids: 0.2, lookY: palm * 0.7 * (1 - lookTm), lookX: lookTm * 0.6}, breath: 1};
  }
  const sp = SUPPORT();
  const crushed = t > SLAM ? 0.25 : 1;
  return (
    <AbsoluteFill>
      <Frame bg={CITY.skyTop}>
        <BurningSky id="a3sky" glowY={560} glow={0.7} />
        <Place wx={-1200} wy={-140} sx={960 + (cam.x + 1010) * 0.25} sy={horizon + 6} k={0.3}>
          <Facades x0={-5200} x1={2400} base={-140} t={T} ink={inkAt(0.3, 2.2)} seed={6} burn={0.45} />
        </Place>
        <Smoke mode="cloud" x={900} y={200} w={1900} h={380} n={8} t={T} seed={33} color={CITY.smoke} opacity={0.5} drift={18} />
        <Layer cam={cam} p={1}>
                    <Street x0={-2600} x1={1600} t={T} ink={ik} puddles={false} debris={1.1} seed={8} />
          <Fire x={-1850} y={-90} w={200} h={240} t={T} seed={6} />
          <Rubble x={sp.x - 10} y={GROUND - 4} w={320} h={(GROUND - sp.y + 10) * crushed} ink={ik} seed={7} />
          <Taxi {...taxi} ink={ik} />
          <RecoveryArm x={ARM_X} y={GROUND + 10} dir={-1} s={1} t={T} target={clawPos} clawAng={90} open={clawOpen} lock={0.25} ink={ik} />
          <Cast actors={[{...tm, ink: ik}, {...dir, ink: ik}]} />
          <Dust x={-560} y={GROUND} t={T} t0={SLAM} size={260} n={18} life={2.4} opacity={0.9} seed={4} />
          <Debris x={-560} y={GROUND - 30} t={T} t0={SLAM} n={18} dir={-120} spread={70} speed={[250, 800]} size={[6, 16]} ground={GROUND + 8} material="asphalt" ink={ik * 0.6} />
          <GlassShards x={-470} y={-60} t={T} t0={SLAM} n={14} dir={-100} spread={90} speed={[300, 700]} size={[5, 12]} ground={GROUND + 6} ink={ik * 0.6} seed={9} />
        </Layer>
        <Embers x={0} y={0} w={1920} h={1080} t={T} seed={6} n={14} />
        <Grade vignette={0.45} id="a3vg" tint="#3A1810" tintOp={0.1} flash={slamK > 0.9 ? 0.06 : 0} />
      </Frame>
    </AbsoluteFill>
  );
};

export const CUES_A3: Cue[] = (() => {
  const c = at(START);
  return [
    c(0.1, 'steps_gravel', {gain: -4, pan: -0.6}),
    c(GRIP, 'breath_exert', {gain: -2, pan: -0.3}),
    c(H0 + HD, 'steps_gravel', {gain: -8, pan: -0.2, rate: 0.8}),
    c(H0 + 2 * CYC + HD, 'steps_gravel', {gain: -9, pan: -0.25, rate: 0.85}),
    c(1.35, 'breath_exert', {gain: -4, pan: -0.3, rate: 0.95}),
    c(RELEASE, 'hydraulic', {gain: -6, pan: 0.6, dist: 0.2}),
    c(SLAM, 'taxi_drop', {gain: 0, pan: 0.05}),
    c(SLAM + 0.05, 'debris_rain', {gain: -4, pan: 0.0}),
    c(SLAM + 0.02, 'glass_shatter', {gain: -8, pan: 0.0}),
    c(SLAM + 0.3, 'body_fall', {gain: -6, pan: -0.4}),
  ];
})();
