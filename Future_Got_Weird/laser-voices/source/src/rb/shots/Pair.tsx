// 1.95-8.55: the two of them (medium), then one continuous push into his ear.
//  1.95-4.95 "you could hear a voice that nobody beside you hears": he hears it again, searches, turns to the passerby
//            ("did you hear that?"); the passerby glances up, blank, shrugs, back to his phone. A slow push toward him.
//  4.95-8.55 "And you wouldn't need anything in your ears. The beam is invisible.": he turns his head away (presenting
//            the ear), the camera pushes straight in; his fingertip checks the ear - nothing in it; then the path (an
//            instructional overlay he cannot see) draws in from the right and enters the canal; the push continues into
//            the air at the opening (the micro world takes over at 8.55).
import React from 'react';
import {Layer} from '../lib/camera';
import {clamp, lerp} from '../lib/math';
import {spline} from '../lib/motion';
import {E_BLANK, E_LISTEN, E_PUZZLED, E_REST, E_STARTLE, E_LOST, mixExpr} from '../art/Face';
import {HAND_CLUTCH, HAND_OPEN, HAND_POINT, HAND_RELAXED, mixHand} from '../art/Hand';
import {earOf, joints, Person, Pose} from '../art/Person';
import {Bokeh, LightCone} from '../art/Lab';
import {LISTENER, LISTENER_FIT, PASSERBY, PASSERBY_FIT} from '../cast';
import {BeamPath, blinkAt, breath, eio, ss} from './common';
import {Phone} from './props';

const LS = 1.05;
const PS = 0.94;
/** the listener in the pair: waist-up, three-quarter toward camera-left */
export const listenerPair = (t: number) => {
  const turnToFriend = ss(2.85, 3.15, t) * (1 - ss(3.9, 4.25, t));
  const present = ss(5.0, 5.6, t); // turns away, presenting the ear
  const head = spline(t, [
    [1.95, 0.18],
    [2.3, 0.05, 'hit'],
    [2.6, 0.3],
    [2.85, 0.25],
    [3.15, -0.42, 'stop'],
    [3.9, -0.38],
    [4.25, 0.25],
    [4.95, 0.3],
    [5.6, 0.97, 'stop'],
    [8.6, 0.99],
  ]);
  const gesture = ss(3.0, 3.3, t) * (1 - ss(3.85, 4.2, t));
  // the fingertip check of the ear (5.65-6.75)
  const check = ss(5.6, 5.95, t) * (1 - ss(6.55, 6.95, t));
  const base: Pose = {
    x: 430, y: 1345, s: LS, yaw: 0.9, head, lean: 2 + 3 * gesture, chest: 2, nod: lerp(-2, 4, present) + 4 * turnToFriend, roll: 4 * Math.sin(t * 1.1) * (1 - present) - 3 * present, shrug: 0.25 * gesture,
    nU: lerp(-10, 210, gesture), nV: lerp(500, 330, gesture), fU: 30, fV: 505, nElb: 1, fElb: 1, nWr: lerp(8, -60, gesture), fWr: 8,
    nAx: 430 + 30, nAy: 2200, fAx: 430 - 80, fAy: 2200, breath: breath(t),
  };
  const ear = earOf({...base, head: 0.97}, false);
  // the fingertip goes to the tragus: the hand points up at it from the jaw line, the elbow out to the side
  const tip = {x: ear.x - 8 * LS, y: ear.y + 8 * LS};
  const ha = -100 + 6 * Math.sin(t * 9) * check;
  const u = {x: Math.cos((ha * Math.PI) / 180), y: Math.sin((ha * Math.PI) / 180)};
  const pose: Pose = check > 0.001 ? {...base, nW: check, nWx: tip.x - u.x * 0.86 * 150 * LS, nWy: tip.y - u.y * 0.86 * 150 * LS, nPoleU: -320, nPoleV: 120, nHandAng: ha} : base;
  // expression: hears it (startle), searches, asks, is shrugged off, then puzzled feeling his ear
  const e1 = mixExpr({...E_STARTLE, gx: 0.9}, {...E_LISTEN, gx: 0.6, gy: -0.2}, ss(2.3, 2.7, t));
  const e2 = mixExpr(e1, {...E_PUZZLED, gx: 0.3, open: 0.22, browUp: 0.7}, turnToFriend);
  const e3 = mixExpr(e2, {...E_LOST, gx: -0.1}, ss(4.2, 4.6, t));
  const e4 = mixExpr(e3, {...E_PUZZLED, gx: -0.4, gy: 0.2, cock: 0.9}, ss(5.4, 5.9, t));
  const hand = check > 0.001 ? mixHand(HAND_RELAXED, HAND_POINT, check) : mixHand(HAND_RELAXED, HAND_OPEN, gesture);
  return {pose, expr: e4, hand, blink: blinkAt(t, [2.62, 4.4, 7.1]), present};
};
const passerbyPair = (t: number) => {
  const glance = ss(3.25, 3.45, t) * (1 - ss(3.95, 4.2, t));
  const shrug = ss(3.5, 3.65, t) * (1 - ss(3.85, 4.0, t));
  const x = 840;
  const p: Pose = {
    x, y: 1360, s: PS, yaw: 0.85, head: lerp(0.35, -0.15, glance), lean: 4, chest: 8, nod: lerp(24, 4, glance), roll: 0, shrug,
    nU: 160, nV: 260, fU: 140, fV: 280, nElb: 1, fElb: 1, nWr: -20, fWr: 10,
    nAx: x + 20, nAy: 2200, fAx: x - 70, fAy: 2200, breath: breath(t + 1.4),
  };
  const e = mixExpr({...E_BLANK, gy: 0.85, gx: -0.1}, {...E_REST, gx: -0.8, browUp: 0.45, smile: -0.05, mw: 0.85}, glance);
  // the thumb scrolls
  return {p, e, blink: blinkAt(t, [2.4, 4.6]), scroll: Math.sin(t * 7) * 0.5 + 0.5};
};

export const pairCam = (t: number, ear: {x: number; y: number}) => {
  const a = eio(clamp((t - 1.95) / 3.0));
  const base = {x: lerp(560, 520, a), y: lerp(900, 860, a), z: lerp(1, 1.12, a)};
  // the push into the ear: fast at first, then a slow creep, then on into the opening (8.0-8.55)
  const p1 = eio(clamp((t - 4.95) / 1.05));
  const z = t < 4.95 ? base.z : t < 6.0 ? Math.exp(lerp(Math.log(base.z), Math.log(10), p1)) : t < 8.0 ? lerp(10, 12.5, (t - 6) / 2) : Math.exp(lerp(Math.log(12.5), Math.log(34), Math.pow(clamp((t - 8.0) / 0.55), 2)));
  const canal = {x: ear.x - 2.5 * 0.97 * LS, y: ear.y + 0};
  const k = ss(7.6, 8.3, t);
  const goal = {x: lerp(ear.x + 4 * LS, canal.x, k), y: lerp(ear.y, canal.y, k)};
  const tx = t < 4.95 ? base.x : lerp(base.x, goal.x, eio(clamp((t - 4.95) / 1.05)));
  const ty = t < 4.95 ? base.y : lerp(base.y, goal.y, eio(clamp((t - 4.95) / 1.05)));
  return {x: tx, y: ty, z};
};

export const PairShot: React.FC<{t: number}> = ({t}) => {
  const L = listenerPair(t);
  const P = passerbyPair(t);
  const ear = earOf(L.pose, false);
  const cam = pairCam(t, ear);
  const inkK = 1 / Math.pow(Math.max(1, cam.z), 0.92);
  const pj = joints(P.p, false);
  // the path: from far off to the right (the emitter, out of frame) into the canal; drawn in on "invisible"
  const canal = {x: ear.x - 2.5 * 0.97 * LS, y: ear.y + 6 * LS * 0};
  const from = {x: ear.x + 3000, y: ear.y - 120};
  const reveal = ss(7.3, 7.95, t);
  return (
    <g>
      <Layer cam={cam} depth={2.4}>
        <Bokeh id="pb" t={t} />
      </Layer>
      <Layer cam={cam} depth={1.5}>
        <LightCone id="pl" x={460} top={-120} floor={1500} w0={40} w1={420} alpha={0.12} />
      </Layer>
      <Layer cam={cam} depth={1}>
        {cam.z < 3 && (
          <Person id="pp" pose={P.p} look={PASSERBY} fit={PASSERBY_FIT} expr={P.e} blink={P.blink} nHand={HAND_CLUTCH} fHand={HAND_CLUTCH} prop={<Phone at={pj.N.W} ang={pj.N.handAng} s={PS} glow={0.8 + 0.2 * P.scroll} />} />
        )}
        <Person id="pl1" pose={L.pose} look={LISTENER} fit={LISTENER_FIT} expr={L.expr} blink={L.blink} nHand={L.hand} inkK={inkK} earDetail={ss(4.95, 5.8, t)} />
        <BeamPath id="pbp" a={from} b={canal} t={t} reveal={reveal} amt={ss(7.25, 7.4, t)} w={Math.max(0.12, 1 / cam.z)} />
      </Layer>
    </g>
  );
};
