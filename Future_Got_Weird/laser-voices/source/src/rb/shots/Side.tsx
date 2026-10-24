// The side view (angle A): the emitter at the right, the listener eight feet away at the left, a floor tape between.
// Used twice: SIDE (20.0-23.3, "...demonstrated this from eight feet away": the camera tracks from the operator along
// the tape to him) and BLOCK (27.85-30.4: the passerby stands in the path, the emitter still running, the path ending
// on his back; the listener leans to look past him, the operator waves him aside).
import React from 'react';
import {Layer} from '../lib/camera';
import {clamp, lerp} from '../lib/math';
import {spline} from '../lib/motion';
import {dialPoint, Emitter, lensPoint} from '../art/Emitter';
import {E_AMAZED, E_BLANK, E_FOCUS, E_GRIN, E_LISTEN, E_LOST, E_PUZZLED, E_REST, E_STARTLE, mixExpr} from '../art/Face';
import {HAND_BRACE, HAND_CLUTCH, HAND_RELAXED, mixHand} from '../art/Hand';
import {earOf, joints, Person, Pose} from '../art/Person';
import {FloorTape, LightCone, Motes, RoomSide} from '../art/Lab';
import {LISTENER, LISTENER_FIT, OPERATOR, OPERATOR_FIT, PASSERBY, PASSERBY_FIT} from '../cast';
import {BeamPath, blinkAt, breath, eio, ss} from './common';
import {planWalk, walkAt} from './walk';
import {Phone} from './props';

/** the housing's tilt: up from 1.35 m at the lens to his ear (about 1.6 m) over eight feet */
export const EM_TILT = 5.5;
export const SIDE = {floorY: 1250, ceilY: 150, k: 3.3, s: 0.356};
const LEG = (400 + 392) * SIDE.s;
const GROUNDA = SIDE.floorY - 46 * SIDE.s;
export const standY = (gy: number, s: number) => gy - 46 * s - 0.982 * (400 + 392) * s;

/** the listener's pose in the side view (3/4 toward camera-left, his near ear toward the emitter) */
export const listenerSide = (t: number, mode: 'side' | 'block' | 'trace'): {p: Pose; e: ReturnType<typeof mixExpr>; nh: typeof HAND_RELAXED; blink: number} => {
  const s = SIDE.s;
  const x = 230;
  const base: Pose = {
    x, y: standY(SIDE.floorY, s), s, yaw: 0.85, head: 0.32, lean: 3, chest: 2, nod: -2, roll: 0, shrug: 0,
    nU: -20, nV: 500, fU: 30, fV: 505, nElb: 1, fElb: 1, nWr: 8, fWr: 8,
    nAx: x + 20 * s, nAy: GROUNDA, fAx: x - 70 * s, fAy: GROUNDA, breath: breath(t),
  };
  if (mode === 'trace') {
    // 1.0-1.95: just heard it: head turned toward the sound, searching
    return {
      p: {...base, head: lerp(-0.25, -0.1, ss(1.2, 1.8, t)), nod: -3, shrug: 0.4 * (1 - ss(1.0, 1.4, t)), roll: -2},
      e: mixExpr({...E_STARTLE, gx: 0.9}, {...E_PUZZLED, gx: 0.8}, ss(1.2, 1.6, t)),
      nh: HAND_RELAXED,
      blink: blinkAt(t, [1.7]),
    };
  }
  if (mode === 'side') {
    // listening, cupping the near ear; on "eight feet" a delighted look to the camera
    const cup = ss(20.15, 20.6, t) * (1 - ss(22.0, 22.4, t));
    const ear = earOf({...base, head: 0.2}, false);
    const grin = ss(22.1, 22.45, t);
    return {
      p: {...base, head: lerp(0.2, 0.08, grin), nod: lerp(-4, 2, grin), nW: cup, nWx: ear.x + 28 * s, nWy: ear.y + 10 * s, nElb: 1, nPoleU: -260, nPoleV: 120, nWr: lerp(8, -70, cup), shrug: 0.3 * grin, roll: 3 * Math.sin(t * 1.3)},
      e: mixExpr(mixExpr(E_LISTEN, {...E_AMAZED, gx: 0.85}, 0.5), {...E_GRIN, gx: -0.1}, grin),
      nh: mixHand(HAND_RELAXED, HAND_BRACE, cup),
      blink: blinkAt(t, [21.3, 23.0]),
    };
  }
  // block: lost, then leaning to look round the passerby
  const lean = ss(28.4, 29.0, t) * (1 - ss(29.9, 30.3, t));
  return {
    p: {...base, lean: 3 - 9 * lean, head: lerp(0.3, 0.12, lean), nod: lerp(2, -8, lean), shrug: 0.6 * ss(27.9, 28.2, t) * (1 - ss(28.6, 29, t)), fU: lerp(30, 160, ss(27.9, 28.25, t)), fV: lerp(505, 260, ss(27.9, 28.25, t)), fWr: -30},
    e: mixExpr({...E_LOST, gx: 0.6}, {...E_PUZZLED, gx: 0.95, gy: -0.1}, lean),
    nh: HAND_RELAXED,
    blink: blinkAt(t, [28.7, 30.1]),
  };
};

export const SideShot: React.FC<{t: number; mode: 'side' | 'block' | 'trace'}> = ({t, mode}) => {
  const s = SIDE.s;
  const L = listenerSide(t, mode);
  const ear = earOf(L.p, false);
  // the emitter eight feet (2.44 m) from his ear: 330 px per metre
  const lensX = ear.x + 2.44 * 330;
  // the floor at SIDE.floorY: the pedestal's base is 128 cm below the yoke; the housing tilts up toward his ear
  const view = {ox: lensX + 25 * SIDE.k, oy: SIDE.floorY - 128 * SIDE.k, k: SIDE.k, yaw: 0, pitch: 4};
  const tilt = EM_TILT;
  const lens = lensPoint(view, tilt);
  // camera: SIDE tracks from the operator along the tape to him; BLOCK holds a little closer on the path's middle
  // SIDE: from his face, a pull-back that reveals the emitter eight feet away as the tape lights up
  const pull = eio(clamp((t - 20.05) / 2.6));
  const tr = eio(clamp((t - 1.0) / 0.95));
  const cam = mode === 'trace'
    ? {x: lerp(ear.x + 30, lensX - 60, tr), y: lerp(ear.y + 60, ear.y + 70, tr), z: lerp(2.7, 2.3, tr)}
    : mode === 'side'
      ? {x: lerp(ear.x + 60, 745, pull), y: lerp(ear.y + 140, 900, pull), z: lerp(2.6, 0.95, pull)}
      : {x: lerp(735, 725, clamp((t - 27.85) / 2.5)), y: lerp(900, 905, clamp((t - 27.85) / 2.5)), z: lerp(0.98, 1.0, clamp((t - 27.85) / 2.5))};
  // operator behind the emitter, hand on the dial
  const ox = view.ox + 135;
  const dial = dialPoint(view, tilt);
  const twist = mode === 'side' ? ss(20.1, 20.7, t) : mode === 'trace' ? ss(1.5, 1.9, t) : 0;
  const wave = mode === 'block' ? ss(28.8, 29.2, t) * (1 - ss(30.0, 30.3, t)) : 0;
  const opP: Pose = {
    x: ox, y: standY(SIDE.floorY, s), s, yaw: 0.35, head: lerp(0.78, 0.6, wave), lean: 6, chest: 4, nod: 6 - 8 * wave, roll: 0, shrug: 0.2 * wave,
    nU: 200, nV: 330, nW: 1 - wave, nWx: dial.x + 8, nWy: dial.y + 2, nElb: 1, nWr: -10 + 25 * Math.sin(twist * Math.PI),
    fU: lerp(120, 290, wave), fV: lerp(420, 60 + 30 * Math.sin(t * 14), wave), fElb: 1, fWr: -20,
    nAx: ox - 30 * s, nAy: GROUNDA, fAx: ox + 60 * s, fAy: GROUNDA, breath: breath(t + 1),
  };
  // the passerby: SIDE — upstage beside him on his phone, then he turns and wanders off toward the right;
  // BLOCK — standing in the path facing the camera, on his phone, until he glances up and steps on
  const pb = (() => {
    if (mode === 'side' || mode === 'trace') {
      const ps = s * 0.93;
      const gy = SIDE.floorY - 34;
      const g = gy - 46 * ps;
      const w = planWalk(470, 980, 21.7, 0.5, 0.62 * 330 * 0.93, 'f', 70 * ps);
      const st = walkAt(w, t, LEG * 0.93);
      const turning = ss(21.4, 21.8, t);
      const p: Pose = {
        x: st.hipX, y: g - 0.982 * (400 + 392) * ps + st.drop * 0.9, s: ps, yaw: lerp(0.8, 0.1, turning), head: lerp(0.45, 0.9, turning), lean: 4, chest: 6, nod: lerp(20, 8, turning), roll: 0, shrug: 0,
        nU: lerp(150, 40 - 120 * st.swing, turning), nV: lerp(250, 500, turning), fU: lerp(140, 40 + 120 * st.swing, turning), fV: lerp(270, 500, turning), nElb: 1, fElb: 1, nWr: -20, fWr: 0,
        nAx: st.nF.x, nAy: g, fAx: st.fF.x, fAy: g, nLift: st.nF.lift, fLift: st.fF.lift, nPitch: st.nF.pitch, fPitch: st.fF.pitch, breath: breath(t + 2),
      };
      return {p, flip: turning > 0.5, e: {...E_BLANK, gy: lerp(0.8, 0.1, turning)}, phone: 1 - turning, gy};
    }
    const ps = s;
    const gy = SIDE.floorY;
    const g = gy - 46 * ps;
    const midX = lerp(ear.x, lensX, 0.5) + 10;
    const glance = ss(29.6, 29.9, t) * (1 - ss(30.2, 30.4, t));
    const p: Pose = {
      x: midX, y: g - 0.982 * (400 + 392) * ps, s: ps, yaw: 1, head: lerp(0.3, 0.05, glance), lean: 3, chest: 8, nod: lerp(22, 2, glance), roll: 0, shrug: 0,
      nU: 150, nV: 250, fU: 130, fV: 270, nElb: 1, fElb: 1, nWr: -20, fWr: 10,
      nAx: midX + 10 * ps, nAy: g, fAx: midX - 60 * ps, fAy: g, breath: breath(t + 2),
    };
    return {p, flip: false, e: mixExpr({...E_BLANK, gy: 0.85}, {...E_REST, gx: 0.7, browUp: 0.4}, glance), phone: 1, gy};
  })();
  const pbJ = joints(pb.p, pb.flip);
  // where the path is stopped: BLOCK ends it on his back (his torso at the beam's height)
  const blockEnd = mode === 'block' ? clamp((lens.x - (pbJ.Sh.x + 40 * s)) / (lens.x - ear.x)) : 1;
  const tapeLit = mode === 'side' ? clamp((t - 21.2) / 1.3) : mode === 'trace' ? 0 : 1;
  const opExpr = mode === 'side' ? {...E_FOCUS, gx: -0.4} : mixExpr({...E_FOCUS, gx: -0.4}, {...E_PUZZLED, gx: -0.6, open: 0.25}, wave);
  return (
    <g>
      <Layer cam={cam} depth={1.6}>
        <RoomSide id="rs" t={t} x0={-900} x1={2600} floorY={SIDE.floorY} ceilY={SIDE.ceilY} />
      </Layer>
      <Layer cam={cam} depth={1.15}>
        <LightCone id="l1" x={260} top={SIDE.ceilY + 40} floor={SIDE.floorY + 10} w0={34} w1={260} />
        <LightCone id="l2" x={1250} top={SIDE.ceilY + 40} floor={SIDE.floorY + 10} w0={34} w1={260} color="#CFF6F1" alpha={0.17} />
        <Motes x={260} top={SIDE.ceilY + 60} floor={SIDE.floorY} w={240} t={t} />
      </Layer>
      <Layer cam={cam} depth={1}>
        {(mode === 'side' || mode === 'trace') && (
          <Person id="pbs" pose={pb.p} flip={pb.flip} look={PASSERBY} fit={PASSERBY_FIT} expr={pb.e} ground={pb.gy} nHand={HAND_CLUTCH} fHand={HAND_CLUTCH} prop={pb.phone > 0.5 ? <Phone at={pbJ.N.W} ang={pbJ.N.handAng} s={pb.p.s} /> : null} />
        )}
        <FloorTape xa={ear.x} xb={lens.x} y={SIDE.floorY + 24} reveal={1} lit={tapeLit} />
        <Emitter id="em" view={view} led={1} dial={twist * 70} tilt={tilt} />
        <Person id="op" pose={opP} look={OPERATOR} fit={OPERATOR_FIT} expr={{...opExpr, open: opExpr.open + (mode === 'block' ? 0.15 * wave * Math.abs(Math.sin(t * 9)) : 0)}} blink={blinkAt(t, [21.1, 22.7, 28.4, 30.0])} ground={SIDE.floorY} nHand={HAND_CLUTCH} fHand={mode === 'block' ? mixHand(HAND_RELAXED, HAND_BRACE, wave) : HAND_RELAXED} />
        <Person id="ls" pose={L.p} look={LISTENER} fit={LISTENER_FIT} expr={L.e} blink={L.blink} ground={SIDE.floorY} nHand={L.nh} />
        {mode === 'block' && (
          <Person id="pbb" pose={pb.p} look={PASSERBY} fit={PASSERBY_FIT} expr={pb.e} ground={pb.gy} nHand={HAND_CLUTCH} fHand={HAND_CLUTCH} prop={<Phone at={pbJ.N.W} ang={pbJ.N.handAng} s={pb.p.s} />} blink={blinkAt(t, [28.9])} />
        )}
        {mode === 'trace' ? (
          <BeamPath id="bp" a={lens} b={ear} t={t} from={1 - eio(clamp((t - 1.0) / 0.8))} amt={0.95} w={0.9} />
        ) : (
          <BeamPath id="bp" a={lens} b={ear} t={t} end={blockEnd} amt={0.9} w={0.9} />
        )}
      </Layer>
    </g>
  );
};
export {E_REST};
