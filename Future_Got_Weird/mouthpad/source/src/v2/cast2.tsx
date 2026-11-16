// V2 acting: the guesser (the MouthPad player) and Honest (his friend, then his opponent), as functions of film time.
// Poses come from the approved rig; every change is interpolated (no pose ever switches in one frame).
import {mixPose, IDLE, Pose, reach} from '../crew';
import React from 'react';
import {GState, HState, handsUp, handsBehind, honestHold, H, G, gMouth} from '../art/room';
import {MagnifierProp} from './fx';
import {MouthState} from '../art/mouth';
import {T} from '../story';
import {FIRE2} from './play2';
import {clamp, keys, ss, pulse, lerp, bo} from '../lib';

const C2_START_G = 5.78; // the lift out of the mouth (device2.tsx C2_START)
const on = (t: number, a: number, b: number, r = 0.15) => ss(t, a, a + r) * (1 - ss(t, b - r, b));
const gch = {x: G.x, y: G.ground, scale: G.scale};

/** the guesser checking his fingernails (right hand up in front of his chest, fingers curled toward him) */
const nails = (): Pose => ({...handsBehind(), armR: reach(gch, 1, G.x + 70, G.ground - 470), handR: {curl: 0.75, spread: 0.2}, lookX: 0.45, lookY: 0.75});

export const guesser2 = (t: number): GState => {
  // hands: up for the hook (fingers wiggle), behind the head from the head-aim beat, nails in the versus round, up
  // again before the loop
  const up = handsUp(1);
  up.handL = {curl: 0.05 + 0.12 * (0.5 + 0.5 * Math.sin(t * 9)), spread: 1};
  up.handR = {curl: 0.05 + 0.12 * (0.5 + 0.5 * Math.sin(t * 9 + 1.5)), spread: 1};
  const behind = ss(t, T.moves, T.tilt - 0.05) * (1 - ss(t, 31.4, 31.8));
  const nail = on(t, T.whos - 0.25, T.with2 - 0.05, 0.25);
  let pose: Pose = behind > 0 ? mixPose(up, handsBehind(), behind) : up;
  if (nail > 0) pose = mixPose(pose, nails(), nail);
  const atUs = on(t, T.its - 0.25, T.mouthpad, 0.18) + on(t, 30.9, 31.5, 0.15);
  const atHonest = on(t, T.seriously + 0.1, T.watch, 0.15) + on(t, T.controller - 0.3, T.so + 0.2, 0.15);
  const calm = on(t, T.mouth3 + 0.1, T.see - 0.1, 0.2) + on(t, T.whos, T.with2, 0.2) + on(t, T.mouth4 - 0.1, 30.9, 0.15);
  const lookX = lerp(lerp(lerp(-0.85, -1, clamp(atHonest)), 0, clamp(atUs)), pose.lookX, nail);
  const lookY = lerp(lerp(lerp(-0.22, 0.35, clamp(atHonest)), 0, clamp(atUs)), pose.lookY, nail);
  pose = {
    ...pose,
    lookX, lookY,
    brows: 0.05 + 0.5 * pulse(t, T.its - 0.3, T.its - 0.15, T.mouthpad - 0.2, T.mouthpad) - 0.25 * on(t, T.tilt, T.aim + 0.4) + 0.5 * pulse(t, 31.0, 31.12, 31.3, 31.45) + 0.4 * clamp(atHonest),
    browAsym: 0.7 * on(t, T.controller - 0.3, T.so + 0.2) + 0.6 * on(t, 31.0, 31.6),
    // head aim: tilt left on "head", right onto the target on "you AIM"
    tilt: keys(t, [[T.tilt - 0.05, 0], [T.head + 0.06, -14], [T.you3 + 0.1, 12], [T.aim + 0.4, 9], [T.press, 0]]),
    lean: 0,
    blink: calm > 0.5 ? 0.5 + 0.5 * (1 - calm) : undefined,
    mouth: 'smile',
    bob: 0,
  };
  // mouth: closed (smile) at frame 0; opens on "THIS" as the reticle arrives; the tongue taps the pad
  const open = keys(t, [
    [-1, 0], [T.this + 0.2, 0], [T.this + 0.45, 1.0], [T.tongue1 - 0.9, 1.0], [T.tongue1 - 0.6, 0.55], [T.seriously, 0.35], [T.watch - 0.05, 0.35], [T.watch + 0.1, 0.55],
    [T.its - 0.2, 0.55], [T.its + 0.15, 1.0], [T.mouthpad + 0.4, 1.0], [T.mouthpad + 0.6, 0],
    // the aim beat: relaxed, closed
    // the twist: open, working; "Close your mouth" → closed for good
    [T.and2 + 3.6, 0], [T.but - 0.15, 0.85], [T.close + 0.05, 0.85], [T.mouth3 + 0.15, 0],
  ]);
  const lift = Math.max(on(t, T.mouth1 + 0.12, T.video1 - 0.15, 0.22), on(t, T.games - 0.1, T.tongue1 + 0.6, 0.2), on(t, T.watch, T.this2 + 0.45, 0.12), on(t, T.but, T.close + 0.1, 0.2));
  const u = keys(t, [[T.mouth1, 0.15], [T.watch, 0], [T.watch + 0.1, -0.6], [T.watch + 0.24, 0.6], [T.watch + 0.38, -0.4], [T.this2 + 0.1, 0], [T.but, 0], [T.heres + 0.3, -0.55], [T.craziest + 0.2, 0.5], [T.part, -0.3], [T.close, 0.2]]);
  const pr = (f: number) => pulse(t, f - 0.12, f - 0.05, f + 0.03, f + 0.12);
  const press = Math.max(pr(T.can + 0.02), pr(FIRE2.tongue), pr(FIRE2.watchA), pr(FIRE2.watchB));
  const smile = 0.35 + 0.5 * clamp(atUs) * (t > 30 ? 1 : 0) + 0.3 * calm;
  const m: MouthState = {open, tongueLift: lift, u, v: 0.25, press, glow: 1, smile, smirk: 0.8 * on(t, T.mouth4 - 0.1, 31.6, 0.2), device: t < C2_START_G || t > T.and2 ? 1 : 0};
  const still = 1 - on(t, T.its - 0.1, T.mouthpad + 0.1, 0.12);
  return {pose, m, life: still, front: nail > 0.01 ? 'R' : 'none'};
};

/** a magnifying glass, held in Honest's right hand (hand-local coordinates) */
export const Magnifier = (s = 1) => ({s});

export const honest2 = (t: number): HState => {
  // slides in on "Seriously" (leaning into the low-angle shot), stays, rolls closer with a magnifying glass for "SEE
  // the controller", mashes his controller in the versus round, stands up straining, freezes when he loses, and is
  // gone (slumped out of frame) by the loop
  const inX = lerp(-420, H.x, bo(t, T.seriously - 0.25, T.seriously + 0.15, 1.1));
  const closer = on(t, T.even - 0.15, T.so - 0.05, 0.3);
  const outX = lerp(0, -700, ss(t, 31.1, 31.6));
  const x = inX + 230 * closer + outX;
  if (t < T.seriously - 0.3 || x < -600) return null;
  const mash = on(t, T.imagine - 0.25, FIRE2.ko + 0.1, 0.15);
  const frozen = ss(t, FIRE2.ko + 0.08, FIRE2.ko + 0.14);
  const rise = 130 * on(t, T.just - 0.15, 31.05, 0.2);
  const jit = (s: number, a: number) => (Math.sin(t * 61 + s) * 0.6 + Math.sin(t * 37 + s * 2) * 0.4) * a;
  const j = mash * (1 + 0.8 * on(t, T.just - 0.15, FIRE2.ko, 0.1));
  const dx = jit(1, 8 * j), dy = jit(2, 7 * j);
  let pose: Pose = honestHold(x, dx, dy - rise * 0);
  const padUp = ss(t, T.so - 0.3, T.imagine);
  const low = honestHold(x, 0, 60);
  pose = {...pose, armL: mixPose(low, pose, padUp).armL, armR: mixPose(low, pose, padUp).armR};
  // the magnifier: right hand up at the guesser's face
  if (closer > 0) {
    const ch = {x, y: H.ground, scale: H.scale};
    const mag = {...pose, armR: reach(ch, 1, gMouth.x - 8, gMouth.y + 206, 1), handR: {curl: 0.8}};
    pose = mixPose(pose, mag, closer);
  }
  const skeptic = on(t, T.seriously - 0.1, T.watch + 0.2, 0.12);
  const jaw = on(t, FIRE2.watchB + 0.05, T.its + 0.1, 0.06);
  const peer = closer;
  pose = {
    ...pose,
    lookX: lerp(lerp(0.9, 1, peer), -0.2, frozen * 0) - 0.3 * jaw,
    lookY: lerp(lerp(-0.45, -0.25, peer), -0.5, mash),
    brows: Math.max(lerp(-0.25 + 1.3 * jaw, 0.6, peer) * (1 - mash) - 0.7 * mash * (1 - frozen), frozen),
    browAsym: 0.9 * skeptic + 0.5 * peer,
    mouth: frozen > 0.5 ? 'o' : mash > 0.5 ? 'grin' : jaw > 0.5 ? 'o' : peer > 0.5 ? 'hmm' : skeptic > 0.5 ? 'hmm' : 'flat',
    lean: 14 * skeptic + 8 * mash * on(t, T.just - 0.15, FIRE2.ko, 0.1) - 20 * ss(t, 31.1, 31.35),
    tilt: 6 * peer + jit(3, 2 * j) - 8 * frozen,
    blink: frozen > 0.5 ? 1 : undefined,
  };
  const drop = ss(t, FIRE2.ko + 0.6, FIRE2.ko + 0.95);
  return {
    x, pose, rise,
    holdR: closer > 0.5 ? React.createElement(MagnifierProp) : undefined,
    pad: closer > 0.5 ? null : {dx: dx * (1 - drop), dy: dy + (1 - padUp) * 60 + drop * 170, r: jit(4, 6 * j) + drop * 40, shake: j > 0.5 ? (Math.floor(t * 24) % 2) : 0},
    sweat: clamp((t - (T.game - 0.2)) / 1.2) * (1 - frozen),
    paint: ss(t, 30.32, 30.4) * (1 - ss(t, 31.1, 31.2)),
  };
};
void IDLE;
