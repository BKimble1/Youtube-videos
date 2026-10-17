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
import {Cast, ActorProps} from '../../rig/actor';
import {Cam, Frame, Grade, Layer, shake} from '../../kit/cam';
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
const GRIP = 0.62, PULL0 = 0.85, PULL1 = 2.15, RELEASE = 2.32, SLAM = 2.5;
const NOTE = M.FIRST_NOTE - START; // ≈ 3.14

export const A3: React.FC = () => {
  const {t, T} = useShot('A3');
  const slamK = Math.max(0, 1 - Math.abs(t - SLAM - 0.03) / 0.35);
  const cam0: Cam = {x: lerp(-1010, -1080, smooth(t / 4)), y: lerp(-130, -120, smooth(t / 4)), z: lerp(1.12, 1.18, smooth(t / 4))};
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

  // ---------------- the teammate slides out
  const slide = smooth(clamp((t - PULL0) / (PULL1 - PULL0)));
  const yank = easeOut(clamp((t - PULL1 + 0.15) / 0.3));
  const P = {x: PIN.x - 12 - slide * 330 - yank * 130, y: PIN.y};
  const gripOn = t >= GRIP && t < SLAM + 0.05;
  const G = gripOn ? {x: P.x - 372 + noise(t * 6, 2) * 3, y: GROUND - 58 - slide * 18} : {x: P.x - 335, y: GROUND - 20};
  const spent = ease(t, SLAM + 0.1, SLAM + 0.6);
  const tm = prone(T, {
    P, lift: lerp(16, 24, slide) - spent * 14, head: lerp(62, 70, slide) - spent * 30, headYaw: lerp(-25, -10, slide),
    handR: t < SLAM + 0.05 ? G : {x: P.x - 380, y: GROUND - 6}, handL: {x: P.x - 250 - slide * 30, y: GROUND + 4},
    handLShape: 'fist', legBend: slide * 10,
    face: {mouth: t < SLAM ? (gripOn ? 'grit' : 'o') : 'pant', open: 0.4, lids: lerp(0.15, 0.55, spent), worry: 0.9, brows: gripOn ? -0.3 : 0.5, lookX: -0.6},
  });

  // ---------------- the Director: hurries in reaching, drops to a crouch, pulls, falls back, sees the palm
  const enter = clamp(t / 0.6);
  const xIn = lerp(-2100, -1250, easeOut(enter));
  const back = slide * 165 + yank * 100;                   // shuffles back while pulling
  const fallBack = easeOut(clamp((t - SLAM + 0.02) / 0.42)); // thrown down hard at the slam
  const px = t < 0.6 ? xIn : -1250 - back - fallBack * 40;
  const g = gait(-2100, xIn + 2100, 1, {...HURRY, s: 1});
  const footY = (f: {lift: number}) => GROUND - 10 - f.lift;
  // crouch footing (planted): back foot steps at 1.25 and 1.75 while pulling
  const backFoot = keys(t, [[0.6, -1360], [1.2, -1360], [1.45, -1450], [1.7, -1450], [1.95, -1540], [SLAM, -1540]]);
  const backLift = Math.max(0, Math.sin(Math.PI * clamp((t - 1.2) / 0.25))) * 30 + Math.max(0, Math.sin(Math.PI * clamp((t - 1.7) / 0.25))) * 30;
  const frontFoot = keys(t, [[0.6, -1120], [1.45, -1120], [1.7, -1230], [2.2, -1230], [2.4, -1300]]);
  const frontLift = Math.max(0, Math.sin(Math.PI * clamp((t - 1.45) / 0.25))) * 26;
  const crouch = ease(t, 0.45, 0.8);
  const palm = ease(t, NOTE - 0.25, NOTE + 0.3) * (1 - ease(t, 3.75, 4.05) * 0.5);
  const lookTm = ease(t, 3.6, 3.95);
  let dir: ActorProps;
  const base = {look: look('director'), t: T, seed: 4, s: 1, z: 0.2, dmg: dmg('director', T)};
  if (t < 0.6) {
    dir = {...base, x: px, y: GROUND, yaw: 82, drop: g.drop + 26 + crouch * 30, lean: 26 + crouch * 8, head: {pitch: -14},
      legL: {foot: {x: g.L.x, y: footY(g.L)}, pitch: g.L.pitch}, legR: {foot: {x: g.R.x, y: footY(g.R)}, pitch: g.R.pitch},
      armR: {fk: {fwd: 78, out: 6, bend: 8}}, armL: {fk: {fwd: 30 + g.armL, out: 8, bend: 40}}, handR: 'open',
      face: {mouth: 'grit', brows: -0.6, lookX: 0.5}, breath: 0.6};
  } else if (t < SLAM) {
    const pullLean = lerp(8, -26, ease(t, PULL0 - 0.1, PULL0 + 0.35)) - yank * 8 + Math.sin(t * 9) * 1.5 * (t > PULL0 ? 1 : 0);
    dir = {...base, x: px, y: GROUND, yaw: 74, drop: lerp(40, 92, crouch) - backLift * 0.3, lean: pullLean,
      legL: {foot: {x: backFoot, y: GROUND - 10 - backLift, z: -12}}, legR: {foot: {x: frontFoot, y: GROUND - 10 - frontLift, z: 14}},
      armR: {hand: {x: G.x - 4, y: G.y + 2, z: 18}, pole: {x: 0, y: 1, z: 0.6}}, armL: {hand: {x: G.x - 22, y: G.y - 4, z: -8}, pole: {x: 0, y: 1, z: -0.4}},
      handR: 'fist', handL: 'fist', zHand: [undefined, 60],
      face: {mouth: 'grit', brows: -0.8, squint: 0.6, lookX: 0.6}, breath: 0.9};
  } else {
    // sprawled: thrown back onto the ground by the slam (blended from the pull pose), propped on the left hand; the
    // right hand comes up — the palm
    const sx = px;
    const fb = fallBack;
    const Gend = {x: P.x - 372, y: GROUND - 76};
    const lerpP = (a: {x: number; y: number}, b: {x: number; y: number}) => ({x: lerp(a.x, b.x, fb), y: lerp(a.y, b.y, fb)});
    const fL = lerpP({x: -1540, y: GROUND - 10}, {x: sx + 120, y: GROUND - 12});
    const fR = lerpP({x: -1300, y: GROUND - 10}, {x: sx + 190, y: GROUND - 12});
    const hL = lerpP({x: Gend.x - 22, y: Gend.y - 4}, {x: sx - 120, y: GROUND - 6});
    const hR0 = lerpP({x: Gend.x - 4, y: Gend.y + 2}, {x: sx + 70, y: GROUND - 14});
    dir = {...base, x: sx, y: GROUND, yaw: lerp(74, 60, fb), drop: lerp(92, 128, fb), lean: lerp(-34, -14, fb) + palm * 10,
      legL: {foot: {x: fL.x, y: fL.y, z: -14}, pole: {x: 0.3, y: lerp(0, -1, fb), z: 0}}, legR: {foot: {x: fR.x, y: fR.y, z: 14}, pole: {x: 0.3, y: lerp(0, -1, fb), z: 0}},
      armL: {hand: {x: hL.x, y: hL.y, z: -20}, pole: {x: -0.3, y: lerp(1, -1, fb), z: 0}},
      armR: palm > 0.02 ? {hand: {x: sx + lerp(60, 105, palm), y: lerp(GROUND - 20, -150, palm), z: 70}, pole: {x: 0.2, y: 1, z: 0.5}} : {hand: {x: hR0.x, y: hR0.y, z: 30}},
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
    c(PULL0 + 0.2, 'steps_gravel', {gain: -8, pan: -0.2, rate: 0.8}),
    c(1.35, 'breath_exert', {gain: -4, pan: -0.3, rate: 0.95}),
    c(RELEASE, 'hydraulic', {gain: -6, pan: 0.6, dist: 0.2}),
    c(SLAM, 'taxi_drop', {gain: 0, pan: 0.05}),
    c(SLAM + 0.05, 'debris_rain', {gain: -4, pan: 0.0}),
    c(SLAM + 0.02, 'glass_shatter', {gain: -8, pan: 0.0}),
    c(SLAM + 0.3, 'body_fall', {gain: -6, pan: -0.4}),
  ];
})();
