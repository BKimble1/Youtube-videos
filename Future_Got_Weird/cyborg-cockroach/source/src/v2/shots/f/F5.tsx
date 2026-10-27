// F5 (873-891, "actually want"): the two-shot (her whole head upper left, her near hand, the cockroach on the ledge
// lower right, nearly across, its loaded injector on its back). Her eyes, uneasy, go from its head to the device as
// light glints along the barrel: she recognises the auto-injector. Her brows ease and lift softly in the middle, her
// mouth relaxes into a closed almost-smile, she breathes out and leans in a little: cautious hope. Her near hand
// relaxes and opens (fingers spread, palm down on the floor) and slides a few centimetres toward it. Static camera.
import React from 'react';
import {sr, keys, lerp, clamp} from '../../../lib/ease';
import {P} from '../../roach/ortho';
import {ShotProps} from '../index2';
import {PocketFrame, FF, faceTrack, Acting, camAt, F5_CAM} from './pocket';
import {medicHeadPx} from './F3';
import {F4_HAND} from './F4';
import {FPS, medicPose, cfView, onBody, BARREL} from './world';

/** shot frames: the glance to the device, the glint, the change of face, the breath out, the hand opening and sliding */
export const F5_K = {glance0: 1, glance1: 4, glint: 4.5, back: 11, hope0: 4, hope1: 13, ex0: 6, ex1: 17, open0: 5, open1: 13, slide0: 8, slide1: 18};
export const f5Cam = () => camAt(F5_CAM.x, F5_CAM.y, 540, 960, F5_CAM.z);
export const f5Glint = (lf: number) => clamp(1 - Math.abs(lf - F5_K.glint) / 4);
/** her acting at film frame f (shot frame lf) */
export const f5Acting = (f: number, lf: number): Acting => {
  const T = f / FPS;
  const K = F5_K;
  const pose = medicPose(T);
  const head = medicHeadPx(T);
  const dev = P(cfView(), onBody(pose, BARREL));
  const g = sr(lf, K.glance0, K.glance1) * (1 - sr(lf, K.back, K.back + 4));
  const gaze = {x: lerp(head.x, dev[0], g), y: lerp(head.y, dev[1], g)};
  const h = sr(lf, K.hope0, K.hope1);
  const a: Acting = {
    recog: 0.6 * h, recoil: 0.3 * (1 - sr(lf, K.hope0 - 1, K.hope1)),
    handOpen: F4_HAND.to + (1 - F4_HAND.to) * sr(lf, K.open0, K.open1), handSlide: 0.2 * sr(lf, K.slide0, K.slide1),
    gaze,
    exhale: clamp(Math.sin(Math.PI * clamp((lf - K.ex0) / (K.ex1 - K.ex0)))),
    breath: 0.8,
    turn: keys(lf, [[0, 10], [K.hope0, 10], [K.hope1, 13]]), // a little more toward it
    nod: keys(lf, [[0, 12], [K.hope0, 12], [K.hope1, 9]]),
    tilt: keys(lf, [[0, -2.5], [K.hope1, 2]]),
    face: faceTrack(lf, [[0, FF.unease], [K.hope0, FF.unease], [K.hope1, FF.hope]]),
  };
  return a;
};
export const F5: React.FC<ShotProps> = ({f, lf}) => {
  const T = f / FPS;
  const pose = medicPose(T);
  const a = f5Acting(f, lf);
  return <PocketFrame id={`f5f${f}`} cam={f5Cam()} T={T} a={a} medic={pose} glint={f5Glint(lf)} fan={0.8} vig={0.45} />;
};
