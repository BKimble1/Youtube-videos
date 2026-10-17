// D2 — The friend on a bed, urgent care. The Director kneels holding their hand; the visor slips off onto the floor; the
// friend's eyes open toward the teammate they saved, and a faint smile. Hope. (4.5 s, no music after Portals resolves.)
import React from 'react';
import {useShot} from '../../film/useShot';
import {look, dmg, visorOn, CIV} from '../../film/crew';
import {Cast, ActorProps, solve} from '../../rig/actor';
import {Attendant} from '../../mech';
import {Frame, Layer, Grade, camAt, inkFor, smoothCam, Cam} from '../../kit/cam';
import {keys, clamp, lerp, seg, smooth, easeIn2, V3} from '../../kit/math';
import {SoftFigure} from '../../sets/refugePlants';
import {InteriorBack, Tint, Visor, headBasis, reclined, kneeling, seated, unroll, basis, Basis3, Motes} from './common';
import {BED, MATTRESS, FRIEND, DIRECTOR, CLASP, GURNEY, VISOR_REST, VISOR_REST_B, Backrest, Monitor, BayFurniture, MedicalBed, Gurney} from './bedSet';
import {gurneyTop} from '../../sets/refugeInterior';
import {add3, mul3, norm3, cross3, sub3, dot3} from '../../kit/math';

const ID = 'D2';
export const TIME_OF_DAY = 1.55; // late afternoon light (refLight scale), continuing from D1
export const VISOR_SWAP = 1.6;   // visorOn(T) turns false at D2 start + 1.6 s

/** Blend two bases (orthonormalised). */
export const mixBasis = (a: Basis3, b: Basis3, k: number): Basis3 => {
  const F = norm3(add3(mul3(a.F, 1 - k), mul3(b.F, k)));
  let U = add3(mul3(a.U, 1 - k), mul3(b.U, k));
  U = norm3(sub3(U, mul3(F, dot3(U, F))));
  return {R: cross3(U, F), U, F};
};

/** The friend's pose on the bed at local time t (shared with D3/D4 continuity). */
export const friendProps = (T: number, t: number, o: {settle: number; eyes: number; smile: number; still?: number}): ActorProps => {
  const still = o.still ?? 0;
  const incline = lerp(42, BED.incline, o.settle);
  const base = reclined(look('friend'), FRIEND.x, FRIEND.ySurf, incline, {t, s: 1, seed: 31, yaw: 62});
  const P = base.rollPivot!;
  const roll = base.roll!;
  const handR = unroll({x: CLASP.x - 18, y: CLASP.y + 4, z: 70}, P, roll);
  const handL = unroll({x: FRIEND.x - 40, y: FRIEND.ySurf - 70, z: -40}, P, roll);
  const breathe = (1 - still) * 0.5;
  return {
    ...base,
    breath: breathe,
    head: {yaw: lerp(30, 44, o.eyes), pitch: lerp(4, 18, o.eyes) + still * 4, roll: lerp(10, 22, o.eyes)},
    face: {
      closed: o.eyes < 0.3, lids: lerp(0.75, 0.5, o.eyes) + 0.1 * o.smile, lookX: 0.2, lookY: 0.9 * o.eyes,
      mouth: o.smile > 0.5 ? 'soft' : still > 0.5 ? 'flat' : 'sad', brows: lerp(-0.2, 0.2, o.smile), worry: lerp(0.6, 0.2, o.smile), blink: o.eyes > 0.3 ? undefined : false,
    },
    armR: {hand: handR, pole: {x: 0.2, y: 1, z: 0.4}},
    armL: {hand: handL, pole: {x: 0, y: 1, z: -0.5}},
    handR: still > 0.5 ? 'limp' : 'mitt', handL: 'limp',
    zArm: [undefined, 60], zHand: [undefined, 70],
    dmg: dmg('friend', T),
    visor: visorOn(T),
  };
};

export const directorProps = (T: number, t: number, o: {lookUp: number; hope: number; grief?: number}): ActorProps => {
  const g = o.grief ?? 0;
  return kneeling(look('director'), DIRECTOR.x, 0, {
    t, s: 1, yaw: -68, z: DIRECTOR.z, seed: 32, lean: 14 + 6 * g, breath: 0.35,
    head: {yaw: -8, pitch: lerp(-10, 8, g) - 6 * o.lookUp, roll: -4},
    armR: {hand: {x: CLASP.x + 6, y: CLASP.y + 12, z: 70}, pole: {x: 0.3, y: 1, z: 0.5}},
    armL: {hand: {x: CLASP.x + 14, y: CLASP.y - 10, z: 82}, pole: {x: 0.4, y: 0.6, z: 1}},
    handR: 'fist', handL: 'mitt',
    zArm: [70, 60], zHand: [80, 70],
    face: {mouth: o.hope > 0.5 ? 'soft' : g > 0.5 ? 'sad' : 'flat', brows: lerp(-0.3, 0.25, o.hope) - 0.2 * g, worry: lerp(0.85, 0.5, o.hope) + 0.3 * g, lookX: -0.4, lookY: -0.2 + 0.3 * g, lids: 0.15 + 0.3 * g},
    dmg: dmg('director', T),
  });
};

/** The teammate sits on the gurney (sling), watching. */
export const teammateOnGurney = (T: number, t: number, o: {look: number; hope: number; head?: number}): ActorProps => {
  const top = gurneyTop(GURNEY.y, GURNEY.s);
  const p = seated(look('teammate'), GURNEY.x, GURNEY.y, top, {t, s: GURNEY.s, yaw: -38, z: -200, seed: 33, knees: 60, spread: 30, breath: 0.4});
  return {
    ...p,
    lean: 6, head: {yaw: -20 + (o.head ?? 0), pitch: 6, roll: 0},
    armR: {hand: {x: GURNEY.x + 40, y: top - 4, z: -170}},
    face: {mouth: o.hope > 0.5 ? 'soft' : 'sad', worry: lerp(0.8, 0.45, o.hope), brows: lerp(-0.1, 0.2, o.hope), lookX: -0.8 * o.look, lookY: 0.15},
    dmg: dmg('teammate', T),
  };
};

const D2: React.FC = () => {
  const {t, T} = useShot(ID);
  // timing
  const settle = smooth(seg(t, 0.1, 1.6));                     // laid back onto the raised backrest (head meets the pillow at 1.6)
  const eyes = smooth(seg(t, 2.1, 2.6));                       // eyes open toward the teammate
  const smile = smooth(seg(t, 3.05, 3.6));
  const urgent = 1;
  // camera: medium two-shot, a slow drift in toward the faces
  const camF = (tt: number): Cam => {
    const k = smooth(clamp(tt / 4.5));
    return camAt(lerp(170, 120, k), lerp(-280, -300, k), 960, 540, lerp(1.6, 1.82, k));
  };
  const cam = smoothCam(camF, t, 0.2, 5);
  const ink = inkFor(cam.z, 1);
  const ink2 = inkFor(cam.z * 0.6, 0.85);

  const friend = friendProps(T, t, {settle, eyes, smile});
  const fr = solve(friend);
  // the visor: worn until VISOR_SWAP; then a free prop falling off the head to the floor
  let visorEl: React.ReactElement | null = null;
  if (t >= VISOR_SWAP) {
    const hb = headBasis(fr);
    const hc = {x: fr.headC.x, y: fr.headC.y};
    const pv = fr.pivot, a = (fr.roll * Math.PI) / 180;
    const hcW = {x: pv.x + (hc.x - pv.x) * Math.cos(a) - (hc.y - pv.y) * Math.sin(a), y: pv.y + (hc.x - pv.x) * Math.sin(a) + (hc.y - pv.y) * Math.cos(a)};
    // knocked off as the head meets the pillow: a short slide back off the crown, then a free fall (g ≈ 9.8 m/s² =
    // 2450 units/s²) off the bed's front edge to the floor, a small bounce, and it settles where D4/D5 find it
    const tt = t - VISOR_SWAP;
    const slide = smooth(clamp(tt / 0.16));
    const start = {x: hcW.x - 20 * slide, y: hcW.y - 6 * slide};
    const tf = Math.max(0, tt - 0.12);
    const drop = VISOR_REST.y - start.y;
    const tLand = Math.sqrt((2 * drop) / 2450);
    const fallK = Math.min(1, (0.5 * 2450 * tf * tf) / drop);
    const x = lerp(start.x, VISOR_REST.x, smooth(clamp(tf / tLand)));
    const y = lerp(start.y, VISOR_REST.y, fallK);
    const tb = tf - tLand;
    const bounce = tb > 0 ? Math.max(0, Math.sin(tb * 16) * Math.exp(-tb * 10)) * 12 : 0;
    const b = mixBasis(hb, VISOR_REST_B, smooth(clamp(tt / (tLand + 0.15))));
    visorEl = <Visor x={x} y={y - bounce} s={1} b={b} ink={ink} />;
  }
  const dir = directorProps(T, t, {lookUp: 0.5, hope: smile});
  const mate = teammateOnGurney(T, t, {look: 1, hope: smooth(seg(t, 2.8, 3.4)), head: -6 * smooth(seg(t, 2.6, 3.1))});
  const scanAmt = 1 - smooth(seg(t, 3.8, 4.4)) * 0.4;
  const cv = CIV[0];
  void cv;
  return (
    <Frame bg="#EFE6D2">
      <Layer cam={cam} p={0.8}>
        <InteriorBack x0={-2400} x1={3000} t={t} time={TIME_OF_DAY} ink={ink2} people={1} seed={5} wallY={-330} top={-1900} />
      </Layer>
      <Layer cam={cam} p={1}>
        <BayFurniture t={t} ink={ink} />
        {/* far side: the urgent attendant at the head end, scanning */}
        <Attendant x={-330} y={-60} s={0.92} t={t} seed={4} urgent={urgent} face={0.75} ink={ink}
          scan={{amt: scanAmt, x: -60, y: MATTRESS - 110}} handR={{x: -150, y: MATTRESS - 150}} />
        <Gurney x={GURNEY.x} y={GURNEY.y} s={GURNEY.s} ink={ink} headDir={1} />
        <Cast actors={[mate]} />
        <SoftFigure x={1080} y={-60} s={0.8} t={t} seed={8} seated ink={ink} color="#7F9A88" />
        <MedicalBed x={BED.x} y={BED.y} s={BED.s} headDir={-1} ink={ink} />
        <Backrest ink={ink} incline={lerp(42, BED.incline, settle)} />
        <Monitor x={-230} y={MATTRESS - 10} t={t} urgent={urgent} stopped={0} ink={ink} />
        <Cast actors={[friend, dir]} />
        {visorEl}
      </Layer>
      <Tint time={TIME_OF_DAY} />
      <Motes t={t + 131} n={10} op={0.25} />
      <Grade vignette={0.32} id="vgD2" />
    </Frame>
  );
};
export default D2;
