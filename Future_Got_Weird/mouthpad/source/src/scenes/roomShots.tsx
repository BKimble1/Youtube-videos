// Every shot set in the gaming room: the hook, the proof, the push into the mouth, the head aim, the click on the
// big screen, the twist (mouth closes) and the versus round that loops back into frame 0.
import React from 'react';
import {mixPose, IDLE, Pose} from '../crew';
import {RoomScene, GState, HState, handsUp, handsBehind, honestHold, gMouth, gHead, H, G, SCREEN, jitter} from '../art/room';
import {MouthState} from '../art/mouth';
import {camAt, CamKey} from '../camera';
import {gameAt} from '../gameplay';
import {T, FIRE} from '../story';
import {clamp, keys, ss, eo, bo, pulse, lerp, wob} from '../lib';

export const WIDE = {x: 556, y: 820, z: 1.1};
const MED = {x: 548, y: 790, z: 1.22};
const ECU = {x: gMouth.x, y: gMouth.y + 6, z: 12};
const SCREENCAM = {x: SCREEN.x + SCREEN.w / 2, y: SCREEN.y + SCREEN.h / 2, z: 1.66};

export const ROOM_CAM: CamKey[] = [
  // hook: wide, then straight into the mouth on "THIS"
  {t: 0, c: WIDE},
  {t: T.this - 0.02, c: {x: 560, y: 812, z: 1.2}},
  {t: T.mouth1 + 0.05, c: ECU, ease: (t, a, b) => ss(t, a, b)},
  {t: T.you2 - 0.1, c: {...ECU, z: 12.6}},
  // pull back so the screen answers the tongue
  {t: T.video1 + 0.05, c: {x: 548, y: 790, z: 1.2}},
  {t: T.tongue1 + 0.3, c: {x: 552, y: 788, z: 1.26}},
  // "Seriously." Honest slides in: the two-shot
  {t: T.seriously + 0.35, c: {x: 455, y: 880, z: 1.16}},
  {t: T.watch - 0.05, c: {x: 470, y: 875, z: 1.18}},
  // "Watch this."
  {t: T.this2 - 0.05, c: {x: 520, y: 820, z: 1.36}},
  {t: T.its - 0.2, c: {x: 530, y: 820, z: 1.4}},
  // "It's called the" — he turns to us and opens wide; the camera goes in to the device
  {t: T.mouthpad - 0.05, c: {x: gMouth.x, y: gMouth.y + 8, z: 14}},
];
export const ROOM_END = T.mouthpad - 0.05; // → the product match cut

// the head-aim beat (back in the room) and the click on the screen
export const AIM_CAM: CamKey[] = [
  {t: T.moves + 0.3, c: MED},
  {t: T.aim + 0.25, c: {x: 552, y: 788, z: 1.27}},
  {t: T.press - 0.08, c: {x: gMouth.x - 20, y: gMouth.y - 10, z: 3.0}},
];
export const CLICK_CAM: CamKey[] = [
  {t: T.click + 0.08, c: SCREENCAM},
  {t: T.and2 - 0.1, c: {...SCREENCAM, z: 1.8}},
];
// the twist and the versus round
export const TWIST_CAM: CamKey[] = [
  {t: T.but - 0.25, c: MED},
  {t: T.part + 0.1, c: {x: gMouth.x, y: gMouth.y - 30, z: 4.2}},
  {t: T.close - 0.05, c: {x: gMouth.x, y: gMouth.y, z: 8.5}},
  {t: T.mouth3 + 0.25, c: {x: gMouth.x, y: gMouth.y - 8, z: 8.0}},
  {t: T.nobody + 0.5, c: {x: 520, y: 860, z: 1.14}, ease: (t, a, b) => eo(t, a, b)},
  {t: T.controller + 0.5, c: {x: 505, y: 870, z: 1.2}},
  {t: T.imagine + 0.2, c: {x: 470, y: 840, z: 1.08}},
  {t: T.someone, c: {x: 480, y: 840, z: 1.1}},
  {t: T.literally + 0.4, c: {x: 700, y: 790, z: 1.75}},
  {t: T.there + 0.1, c: {x: 690, y: 790, z: 1.8}},
  {t: T.mouth4, c: MED},
  {t: FIRE.shut + 0.12, c: {x: 552, y: 788, z: 1.25}},
  {t: FIRE.shut + 0.36, c: {x: 330, y: 960, z: 1.7}, ease: (t, a, b) => ss(t, a, b)},
  {t: 31.42, c: {x: 330, y: 965, z: 1.72}},
  {t: 31.95, c: WIDE},
];

// ---------------------------------------------------------------- the guesser
const tongueOn = (t: number, a: number, b: number) => ss(t, a, a + 0.18) * (1 - ss(t, b - 0.18, b));

export const guesserAt = (t: number): GState => {
  // hands: up ("look, no hands") for the hook; laced behind the head from the head-aim beat; up again to loop
  const behind = ss(t, T.moves + 0.3, T.tilt) * (1 - ss(t, 31.35, 31.8));
  const up = handsUp(1);
  // fingers wiggle a little while the hands are up (keeps the pose alive, shows they are free)
  up.handL = {curl: 0.05 + 0.1 * (0.5 + 0.5 * Math.sin(t * 9)), spread: 1};
  up.handR = {curl: 0.05 + 0.1 * (0.5 + 0.5 * Math.sin(t * 9 + 1.5)), spread: 1};
  let pose: Pose = behind > 0 ? mixPose(up, handsBehind(), behind) : up;
  // look: at the screen (left), at Honest (down-left) after "Seriously", at us on "It's called the"
  const atUs = ss(t, T.its - 0.25, T.its) * (1 - ss(t, T.mouthpad + 0.5, T.mouthpad + 0.6));
  const atHonest = pulse(t, T.seriously + 0.2, T.seriously + 0.4, T.watch - 0.1, T.watch + 0.1);
  const smug = pulse(t, T.controller - 0.3, T.controller, 31.4, 31.9) + pulse(t, -1, -0.5, 0.0, 0.0);
  pose = {
    ...pose,
    lookX: lerp(lerp(-0.85, -1, atHonest), 0, atUs),
    lookY: lerp(lerp(-0.22, 0.35, atHonest), 0, atUs),
    brows: lerp(0.05, -0.2, ss(t, T.tilt, T.tilt + 0.2) * (1 - ss(t, T.aim + 0.4, T.aim + 0.6))) + 0.6 * atHonest + 0.4 * pulse(t, T.mouthpad - 0.6, T.mouthpad - 0.4, T.mouthpad, T.mouthpad + 0.2),
    browAsym: 0.6 * pulse(t, T.literally, T.literally + 0.3, FIRE.shut + 0.2, FIRE.shut + 0.5),
    // head-aim: tilt left, then right onto the goo-bot
    tilt: keys(t, [[T.tilt, 0], [T.head + 0.05, -15], [T.you3 + 0.05, 11], [T.aim + 0.5, 8], [T.press, 0]]) + 3 * Math.sin(t * 2.3) * clamp(t < T.tilt ? 1 : t > T.press ? 1 : 0) * (1 - ss(t, T.its - 0.3, T.mouthpad - 0.3) * (1 - ss(t, T.mouthpad + 0.1, T.mouthpad + 0.3))),
    lean: keys(t, [[T.its - 0.3, 0], [T.its, 3], [T.mouthpad - 0.45, 3], [T.mouthpad - 0.15, 0]]),
    mouth: smug > 0.5 ? 'smirk' : 'smile',
    bob: 0,
  };
  // mouth and tongue
  const open = keys(t, [
    [-1, 0], [T.this - 0.04, 0], [T.this + 0.22, 1.0], [T.you2 + 0.1, 1.0], [T.video1, 0.78], [T.tongue1 + 0.3, 0.75], [T.seriously + 0.2, 0.32],
    [T.watch, 0.35], [T.watch + 0.15, 0.7], [T.its - 0.3, 0.7], [T.its + 0.15, 1.0],
    // (product, section and split happen elsewhere) head aim: mouth relaxed, slightly open
    [T.moves + 0.3, 0.3], [T.press - 0.3, 0.6],
    // the twist: open, tongue working; "Close your mouth" → closed for the rest of the film
    [T.but - 0.3, 0.72], [T.close - 0.02, 0.72], [T.mouth3 + 0.05, 0],
  ]);
  const lift = Math.max(
    tongueOn(t, T.mouth1 + 0.05, FIRE.tongue + 0.3),
    tongueOn(t, T.watch + 0.05, FIRE.watch + 0.3),
    tongueOn(t, T.but - 0.3, T.close + 0.1),
  );
  const u = keys(t, [
    [T.mouth1, 0.25], [T.video1 - 0.05, 0.25], [T.video1 + 0.3, -0.65], [T.games + 0.1, -0.6], [T.games + 0.4, 0], [T.watch + 0.1, 0], [T.this2 - 0.1, 0.1], [T.this2 + 0.1, -0.7], [T.this2 + 0.3, -0.2],
    [T.but - 0.3, 0.2], [T.craziest, -0.5], [T.craziest + 0.4, 0.4], [T.part, -0.3], [T.part + 0.3, 0.3],
  ]);
  const pr = (f: number) => pulse(t, f - 0.1, f - 0.04, f + 0.04, f + 0.14);
  const press = Math.max(pr(FIRE.tongue), pr(FIRE.watch), pr(FIRE.part));
  const m: MouthState = {open, tongueLift: lift, u, v: keys(t, [[T.tongue1 - 0.3, 0.1], [T.tongue1, 0.3]]), press, glow: 1, smile: 0.25 * smug};
  return {pose, m, life: 1 - ss(t, T.its - 0.3, T.mouthpad - 0.3) * (1 - ss(t, T.mouthpad + 0.1, T.mouthpad + 0.3))};
};

// ---------------------------------------------------------------- Honest
export const honestAt = (t: number): HState => {
  // he slides in on his beanbag on "Seriously", is still there for the twist and the versus round, and slumps out of
  // frame left after he loses (the room returns to the frame-0 composition)
  const inX = lerp(-420, H.x, bo(t, T.seriously - 0.3, T.seriously + 0.2, 1.2));
  const outX = lerp(0, -680, ss(t, 31.45, 31.88));
  const x = inX + outX;
  if (t < T.seriously - 0.3 || x < -380 - 200) return null;
  const base = honestHold(x);
  const shock = pulse(t, T.this2 + 0.25, T.this2 + 0.35, 99, 100);
  const peer = pulse(t, T.nobody - 0.2, T.nobody + 0.2, T.controller + 0.3, T.controller + 0.6);
  const lookPad = pulse(t, T.see + 0.1, T.see + 0.25, T.controller + 0.25, T.controller + 0.45);
  const mash = ss(t, T.imagine - 0.2, T.imagine) * (1 - ss(t, FIRE.shut + 0.08, FIRE.shut + 0.16));
  const frozen = ss(t, FIRE.shut + 0.08, FIRE.shut + 0.16);
  const wow = t > T.aim && t < T.and2 + 0.3 ? ss(t, FIRE.click + 0.08, FIRE.click + 0.16) : 0;
  const j = mash * 1;
  const dx = jitter(t, 7 * j, 1), dy = jitter(t, 6 * j, 2);
  let pose: Pose = honestHold(x, dx, dy);
  // the controller hangs at his lap before the versus round (he's watching), comes up for the round, slips at the end
  const padUp = ss(t, T.so - 0.2, T.imagine);
  const drop = ss(t, FIRE.shut + 0.3, FIRE.shut + 0.6);
  pose = {
    ...pose,
    armL: mixPose(honestHold(x, 0, 60), pose, padUp).armL,
    armR: mixPose(honestHold(x, 0, 60), pose, padUp).armR,
    lookX: lerp(lerp(lerp(0.9, 1, peer), 0.6, lookPad), -0.1, frozen * 0) ,
    lookY: lerp(lerp(lerp(-0.45, -0.1, peer), 0.7, lookPad), -0.4, mash),
    brows: Math.max(lerp(lerp(-0.3 + 1.3 * shock * (t < T.its ? 1 : 0.3), 0.8, peer), -0.6, mash) * (1 - frozen) + frozen * 1, wow),
    browAsym: 0.8 * pulse(t, T.seriously - 0.1, T.seriously + 0.1, T.watch + 0.1, T.this2 + 0.3) + 0.6 * lookPad,
    mouth: frozen > 0.5 ? 'o' : mash > 0.5 ? 'grin' : (shock > 0.5 && t < T.its) || wow > 0.5 ? 'o' : lookPad > 0.5 ? 'hmm' : peer > 0.5 ? 'flat' : 'flat',
    lean: keys(t, [[T.seriously, -6], [T.seriously + 0.3, 0], [T.nobody - 0.2, 0], [T.nobody + 0.3, 12], [T.controller + 0.3, 12], [T.controller + 0.6, 0]]) - 18 * ss(t, 31.45, 31.7),
    tilt: 6 * peer + jitter(t, 2 * j, 3) - 10 * frozen,
    blink: frozen > 0.5 ? 1 : undefined,
  };
  const padYdrop = drop * 160;
  return {
    x,
    pose,
    pad: {dx: dx * (1 - drop), dy: dy + (1 - padUp) * 60 + padYdrop, r: jitter(t, 6 * j, 4) + drop * 40, shake: j > 0.5 ? (Math.floor(t * 24) % 2) : 0},
    sweat: clamp((t - (T.game - 0.2)) / 1.4) * (1 - frozen),
  };
};

const camFor = (t: number) => {
  if (t < ROOM_END + 0.5) return camAt(t, ROOM_CAM);
  if (t < T.press) return camAt(t, AIM_CAM);
  if (t < T.and2) return camAt(t, CLICK_CAM);
  return camAt(t, TWIST_CAM);
};

export const RoomShot: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const cam = camFor(t);
  return <RoomScene t={t} frame={frame} cam={cam} g={guesserAt(t)} h={honestAt(t)} game={gameAt(t)} id="rm" />;
};
void IDLE; void wob; void G; void gHead;
