// F5 (873-891, "actually want"): the two-shot: the cockroach on the narrow ledge, nearly across, its loaded injector
// on its back. Her eyes (still disgusted, recoiled) go to the device as light glints along the barrel: recognition. Her
// brows lift, the wrinkle and the sneer let go, she breathes out and leans in a little; her near hand uncurls and slides
// a few centimetres toward it, open and relaxed on the floor: cautious hope. Static camera.
import React from 'react';
import {sr, keys, lerp, clamp} from '../../../lib/ease';
import {P} from '../../roach/ortho';
import {ShotProps} from '../index2';
import {PocketFrame, FF, faceTrack, Acting, camAt} from './pocket';
import {R5, FPS, medicPose, cfView, onBody, BARREL} from './world';

/** shot frames: the glance to the device, the glint, the change of face, the breath out, the hand */
export const F5_K = {glance0: 1, glance1: 4, glint: 4, back: 9, hope0: 4, hope1: 13, ex0: 6, ex1: 17, open0: 6, open1: 16, slide0: 8, slide1: 18};
export const f5Cam = () => camAt(800, 975, 540, 960, 1.25);
export const f5Glint = (lf: number) => clamp(1 - Math.abs(lf - F5_K.glint) / 3.5);
export const F5: React.FC<ShotProps> = ({f, lf}) => {
  const T = f / FPS;
  const K = F5_K;
  const pose = medicPose(T);
  const v = cfView();
  const fr = pose.frame;
  const headPt = P(v, [fr.o[0] + fr.x[0] * 33, fr.o[1] + 10, fr.o[2] + fr.x[2] * 33]);
  const dev = P(v, onBody(pose, BARREL));
  const g = sr(lf, K.glance0, K.glance1) * (1 - sr(lf, K.back, K.back + 4));
  const gaze = {x: lerp(headPt[0], dev[0], g), y: lerp(headPt[1], dev[1], g)};
  const h = sr(lf, K.hope0, K.hope1);
  const a: Acting = {
    recog: 0.65 * h, recoil: 0.85 * (1 - sr(lf, K.hope0 - 1, K.hope1)),
    handOpen: sr(lf, K.open0, K.open1), handSlide: 0.4 * sr(lf, K.slide0, K.slide1),
    gaze,
    exhale: clamp(Math.sin(Math.PI * clamp((lf - K.ex0) / (K.ex1 - K.ex0)))),
    breath: 1,
    turn: keys(lf, [[0, 6], [K.hope0, 6], [K.hope1, 14]]), // back toward it
    nod: keys(lf, [[0, 11], [K.hope0, 11], [K.hope1, 6]]),
    tilt: keys(lf, [[0, -3], [K.hope1, 2]]),
    face: faceTrack(lf, [[0, FF.disgust], [K.hope0, FF.disgust], [K.hope1, FF.hope]]),
    wrinkle: 1 - sr(lf, K.hope0, K.hope0 + 5),
  };
  return <PocketFrame id="f5" cam={f5Cam()} T={T} a={a} medic={pose} glint={f5Glint(lf)} fan={0.8} vig={0.45} />;
};
void R5;
