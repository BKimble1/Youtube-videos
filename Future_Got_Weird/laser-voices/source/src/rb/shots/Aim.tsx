// The view from behind the emitter, down the path to the listener (camera at ear height, so the path runs level along
// the horizon). Used three times:
//  aim   17.8-20.0 "concentrates the sound where you're standing": from the lens, the camera travels back down the path to
//        frame him; the sound collects at his ear (a small zone of ripples there, none round the passerby beside him)
//  cross 23.3-26.3 "But if someone walks between you and the laser...": the passerby walks across the path and stops in
//        it, eyes on his phone; on frame 786 (26.2 s) his head and shoulders cut the path, and the voice stops
//  leave 30.4-32.0 "And the second they move...": he looks up, realises, steps on; the path clears on frame 958 (31.93 s)
import React from 'react';
import {Layer} from '../lib/camera';
import {clamp, fmt, lerp} from '../lib/math';
import {Emitter, lensPoint} from '../art/Emitter';
import {E_AMAZED, E_BLANK, E_GRIN, E_LISTEN, E_LOST, E_PUZZLED, E_REST, E_STARTLE, mixExpr} from '../art/Face';
import {HAND_BRACE, HAND_CLUTCH, HAND_RELAXED, mixHand} from '../art/Hand';
import {earOf, joints, Person, Pose} from '../art/Person';
import {LightCone, Motes, RoomSide} from '../art/Lab';
import {LISTENER, LISTENER_FIT, PASSERBY, PASSERBY_FIT} from '../cast';
import {T_BLOCK, T_CLEAR, FPS} from '../beats';
import {BeamPath, blinkAt, breath, eio, ss} from './common';
import {planWalk, walkAt, Walk} from './walk';
import {Phone} from './props';

export const HOR = 700; // ear height on screen (the horizon)
const LEGU = 400 + 392;
/** a standing pose whose ear is at the horizon */
const atEar = (x: number, s: number, o: Partial<Pose>, flip = false): Pose => {
  const base: Pose = {
    x, y: 0, s, yaw: 0.6, head: 0.85, lean: 2, chest: 2, nod: 0, roll: 0, shrug: 0,
    nU: -14, nV: 500, fU: 24, fV: 505, nElb: 1, fElb: 1, nWr: 6, fWr: 6,
    nAx: x, nAy: 0, fAx: x, fAy: 0, ...o,
  };
  const hipToAnkle = 0.982 * LEGU * s;
  const probe = {...base, y: 0, nAy: hipToAnkle, fAy: hipToAnkle};
  const e = earOf(probe, flip);
  const dy = HOR - e.y;
  return {...base, y: dy, nAy: (o.nAy ?? 0) + hipToAnkle + dy, fAy: (o.fAy ?? 0) + hipToAnkle + dy};
};
/** ground line (screen y) for a figure of scale s */
export const groundOf = (s: number) => atEar(0, s, {}).nAy + 46 * s;

// ---------------------------------------------------------------- the listener
const LX = 360;
const LSC = 0.4;
export const listenerAim = (t: number, mode: 'aim' | 'cross' | 'leave') => {
  const o: Partial<Pose> = {yaw: 0.55, head: 0.86, nAx: LX + 18, fAx: LX - 40, breath: breath(t)};
  if (mode === 'aim') {
    const cup = ss(18.35, 18.75, t);
    const p = atEar(LX, LSC, {...o, lean: 1, nod: -3 + 4 * cup, roll: 2 * Math.sin(t * 1.4)});
    const ear = earOf(p);
    const q = cup > 0 ? {...p, nW: cup, nWx: ear.x + 34 * LSC, nWy: ear.y + 40 * LSC, nPoleU: -260, nPoleV: 140, nHandAng: -110} : p;
    return {p: q, e: mixExpr({...E_LISTEN, gx: -0.4}, {...E_GRIN, gx: -0.2}, ss(18.8, 19.3, t)), hand: mixHand(HAND_RELAXED, HAND_BRACE, cup), blink: blinkAt(t, [19.6])};
  }
  if (mode === 'cross') {
    const p = atEar(LX, LSC, {...o, nod: -2, roll: 1.5 * Math.sin(t * 1.2)});
    return {p, e: mixExpr({...E_LISTEN, gx: -0.3}, {...E_REST, smile: 0.4, gx: -0.3}, ss(23.6, 24.4, t)), hand: HAND_RELAXED, blink: blinkAt(t, [24.6, 25.9])};
  }
  // leave: lost, looking toward the emitter; the voice back at T_CLEAR: a jolt
  const back = ss(T_CLEAR, T_CLEAR + 0.12, t);
  const p = atEar(LX, LSC, {...o, head: lerp(0.55, 0.8, back), nod: lerp(4, -3, back), shrug: 0.5 * Math.exp(-(((t - T_CLEAR - 0.05) / 0.12) ** 2)), fU: 120, fV: 300 + 40 * Math.sin(t * 2)});
  return {p, e: mixExpr({...E_LOST, gx: 0.7}, {...E_STARTLE, gx: 0.6}, back), hand: HAND_RELAXED, blink: blinkAt(t, [30.8])};
};

// ---------------------------------------------------------------- the passerby
const PSC = 0.62;
const PG = () => groundOf(PSC);
const STRIDE = 0.7 * 480;
const STEP = 0.54;
const STEP_IN = 0.64; // an unhurried wander, eyes on his phone
/** the path's crossing point at his depth (a fixed fraction of the way from the lens to the ear on screen) */
const U_P = 0.5;
let LENS_CACHE: {x: number; y: number} | null = null;
export const EM_VIEW = (() => {
  const v = {ox: 0, oy: 0, k: 11, yaw: -62, pitch: 3, f: 140};
  const l = lensPoint(v);
  return {...v, ox: 840 - l.x, oy: HOR - 6 - l.y};
})();
const lensPt = () => (LENS_CACHE ??= lensPoint(EM_VIEW));
const earPt = () => earOf(atEar(LX, LSC, {yaw: 0.55, head: 0.86}));
export const crossPoint = () => {
  const a = lensPt();
  const b = earPt();
  return {x: lerp(a.x, b.x, U_P), y: lerp(a.y, b.y, U_P)};
};
const passerbyWalkPose = (w: Walk, t: number, extra: Partial<Pose>): Pose => {
  const g = PG() - 46 * PSC;
  const st = walkAt(w, t, LEGU * PSC);
  const sw = clamp(st.swing * 1.4, -1, 1);
  const base = atEar(st.hipX, PSC, {
    yaw: 0.12, head: 0.92, lean: 4 * (st.moving ? 1 : 0), chest: 3, nod: 4,
    nU: 70 * sw, nV: 500 - 30 * Math.abs(sw), fU: -70 * sw, fV: 500 - 30 * Math.abs(sw), nWr: 10, fWr: 10,
    ...extra,
  }, true);
  return {...base, y: base.y + st.drop * 0.85, nAx: st.nF.x, nAy: g, fAx: st.fF.x, fAy: g, nLift: st.nF.lift, fLift: st.fF.lift, nPitch: st.nF.pitch, fPitch: st.fF.pitch};
};
/** is the path blocked by his head/neck/shoulders at the crossing point? */
const blockedBy = (p: Pose) => {
  const j = joints(p, true);
  const c = crossPoint();
  const half = 96 * PSC;
  return Math.abs(j.head.x - c.x) < half && Math.abs(j.head.y - c.y) < 200 * PSC;
};
// walk 1: in from the left; walk 2: out to the right. Their starts are solved (with the full pose, phone and all) so
// that the first blocked frame is T_BLOCK and the first clear frame is T_CLEAR exactly.
const STOP_X = crossPoint().x - 52;
const walkIn = (t0: number) => planWalk(-180, STOP_X, t0, STEP_IN, STRIDE * 0.85, 'n', 70 * PSC);
const walkOut = (t0: number) => planWalk(STOP_X, 1500, t0, STEP, STRIDE, 'f', 70 * PSC);
const poseFor = (t: number, wi: Walk, wo: Walk) => {
  const outStarted = t >= wo.steps[0].t0 - 0.2;
  const w = outStarted ? wo : wi;
  const phone = ss(wi.steps[wi.steps.length - 2].t0, wi.steps[wi.steps.length - 1].t1, t) * (1 - ss(30.85, 31.1, t));
  const look = ss(30.85, 31.1, t);
  const extra: Partial<Pose> = {
    nod: lerp(4, 22, phone) - 6 * look,
    head: lerp(0.92, 0.75, phone),
    ...(phone > 0.01 ? {nU: lerp(0, 150, phone), nV: lerp(500, 250, phone), nWr: -20} : {}),
  };
  return {p: passerbyWalkPose(w, t, extra), phone, look};
};
const TB = Math.round(T_BLOCK * FPS);
const TC = Math.round(T_CLEAR * FPS);
const FAR = walkOut(99);
const firstBlocked = (wi: Walk) => {
  for (let f = Math.round(22 * FPS); f <= Math.round(29 * FPS); f++) if (blockedBy(poseFor(f / FPS, wi, FAR).p)) return f;
  return 99999;
};
let t0in = 21.5;
{
  let lo = 21.0;
  let hi = 26.0;
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    if (firstBlocked(walkIn(m)) >= TB) hi = m;
    else lo = m;
  }
  t0in = hi;
}
export const W_IN = walkIn(t0in);
const firstClear = (wo: Walk) => {
  for (let f = Math.round(29 * FPS); f <= Math.round(34 * FPS); f++) if (!blockedBy(poseFor(f / FPS, W_IN, wo).p)) return f;
  return 99999;
};
let t0out = 31;
{
  let lo = 29.5;
  let hi = 33.0;
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    if (firstClear(walkOut(m)) >= TC) hi = m;
    else lo = m;
  }
  t0out = hi;
}
export const W_OUT = walkOut(t0out);
/** the passerby in the aim world at time t (walk in, stand on the phone, walk out) */
export const passerbyAim = (t: number) => {
  const {p, phone, look} = poseFor(t, W_IN, W_OUT);
  const e = mixExpr(mixExpr({...E_REST, gx: -0.5}, {...E_BLANK, gy: 0.85, gx: -0.6}, phone), {...E_PUZZLED, gx: -0.9, gy: -0.1, open: 0.18}, look);
  return {p, e, phone, standing: false, blocked: blockedBy(p)};
};
export const blockedAt = (t: number) => t >= T_BLOCK && t < T_CLEAR;

// ---------------------------------------------------------------- the shot
export const AimShot: React.FC<{t: number; mode: 'aim' | 'cross' | 'leave'}> = ({t, mode}) => {
  const L = listenerAim(t, mode);
  const ear = earOf(L.p);
  const lens = lensPt();
  // aim: from close on the lens, back along the path to frame him; cross/leave: a held wide with a slow drift
  const travel = eio(clamp((t - 17.8) / 1.25));
  const cam =
    mode === 'aim'
      ? {x: lerp(lens.x - 40, 560, travel), y: lerp(HOR, 860, travel), z: Math.exp(lerp(Math.log(2.6), Math.log(1.0), travel))}
      : {x: 560, y: 860, z: 1 + 0.02 * clamp((t - (mode === 'cross' ? 23.3 : 30.4)) / 3)};
  // the passerby beside him in 'aim' (on his phone); walking in 'cross' and 'leave'
  const stand: Pose = atEar(LX + 230, 0.39, {yaw: 0.8, head: 0.4, nod: 22, nU: 150, nV: 250, fU: 130, fV: 270, nWr: -20, fWr: 10, nAx: LX + 240, fAx: LX + 200, breath: breath(t + 1)});
  const pb = mode === 'aim' ? null : passerbyAim(t);
  const pbJ = pb ? joints(pb.p, true) : joints(stand, false);
  const blocked = mode !== 'aim' && blockedAt(t);
  const cross = crossPoint();
  // the path stops at his head while blocked
  const end = blocked ? clamp((lens.x - (pbJ.head.x + 40 * PSC)) / (lens.x - ear.x)) : 1;
  const zone = mode === 'aim' ? ss(18.0, 18.4, t) : mode === 'cross' ? 1 - ss(T_BLOCK - 0.02, T_BLOCK + 0.02, t) : ss(T_CLEAR, T_CLEAR + 0.06, t);
  const roomG = groundOf(LSC);
  return (
    <g>
      <Layer cam={cam} depth={1.5}>
        <RoomSide id="ars" t={t} x0={-900} x1={2100} floorY={roomG - 30} ceilY={-60} />
      </Layer>
      <Layer cam={cam} depth={1.1}>
        <LightCone id="al1" x={LX + 60} top={60} floor={roomG + 10} w0={30} w1={250} alpha={0.2} />
        <LightCone id="al2" x={1060} top={60} floor={roomG + 10} w0={30} w1={220} color="#CFF6F1" alpha={0.12} />
        <Motes x={LX + 60} top={90} floor={roomG} w={240} t={t} />
      </Layer>
      <Layer cam={cam} depth={1}>
        {/* the floor tape: from the emitter's base to his feet */}
        <path d={`M${fmt(LX + 30)},${fmt(roomG + 4)} L${fmt(1010)},${fmt(2050)} L${fmt(1090)},${fmt(2050)} L${fmt(LX + 46)},${fmt(roomG + 4)} Z`} fill="#F2C14E" opacity={0.75} />
        <Person id="al" pose={L.p} look={LISTENER} fit={LISTENER_FIT} expr={L.e} blink={L.blink} nHand={L.hand} ground={roomG} />
        {mode === 'aim' && (
          <Person id="ap0" pose={stand} look={PASSERBY} fit={PASSERBY_FIT} expr={{...E_BLANK, gy: 0.85}} blink={blinkAt(t, [18.9])} nHand={HAND_CLUTCH} fHand={HAND_CLUTCH} ground={groundOf(0.39)} prop={<Phone at={pbJ.N.W} ang={pbJ.N.handAng} s={0.39} />} />
        )}
        {/* the sound zone at his ear (and only his) */}
        {zone > 0.01 && (
          <g opacity={zone}>
            {[0, 1, 2].map((k) => {
              const ph = ((t * 1.6 + k / 3) % 1);
              return <circle key={k} cx={fmt(ear.x)} cy={fmt(ear.y)} r={fmt(10 + 46 * ph)} fill="none" stroke="#BFF6FF" strokeWidth={3} opacity={0.7 * (1 - ph)} />;
            })}
            <circle cx={fmt(ear.x)} cy={fmt(ear.y)} r={22} fill="#BFF6FF" opacity={0.18} />
          </g>
        )}
        {mode !== 'aim' && pb && (
          <Person id="ap" pose={pb.p} flip look={PASSERBY} fit={PASSERBY_FIT} expr={pb.e} blink={blinkAt(t, [24.9, 30.6])} nHand={pb.phone > 0.3 ? HAND_CLUTCH : HAND_RELAXED} fHand={HAND_RELAXED} ground={PG()} prop={pb.phone > 0.3 ? <Phone at={pbJ.N.W} ang={pbJ.N.handAng} s={PSC} /> : null} />
        )}
        <BeamPath id="abp" a={lens} b={ear} t={t} reveal={mode === 'aim' ? ss(17.85, 18.4, t) : 1} amt={0.95} end={end} w={1.35} />
        {blocked && <circle cx={fmt(lerp(lens.x, ear.x, end))} cy={fmt(lerp(lens.y, ear.y, end))} r={16} fill="#FF8A3D" opacity={0.35} />}
        {/* the emitter in the foreground (same layer as the path, so the path always leaves its lens) */}
        <Emitter id="aem" view={EM_VIEW} led={1} />
      </Layer>
      {void cross}
    </g>
  );
};
