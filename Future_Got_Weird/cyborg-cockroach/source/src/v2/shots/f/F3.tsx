// F3 (818-847, "crawling toward you..."): close on her face (the whole head, headroom under the slab), eyes up on the
// slab ahead where grit trickles off its edge (something moving inside); a scrape below: her eyes drop to it, her head
// turns and dips to follow, and she sees the cockroach coming along the ledge toward her hand. Restrained unease: her
// eyes widen slightly, her brows draw together and up a little, her mouth closes small and tight, she leans back a
// little and her fingers tighten. Her eyes keep tracking it as it comes; she blinks once. The camera follows her gaze
// down to the insect, ending on the two-shot F5 holds.
import React from 'react';
import {sr, keys, lerp} from '../../../lib/ease';
import {P} from '../../roach/ortho';
import {Grit} from '../e/art';
import {ShotProps} from '../index2';
import {PocketFrame, FF, faceTrack, Acting, camAt, F5_CAM} from './pocket';
import {FPS, medicPose, cfView, cardPx, SLAB} from './world';

/** shot frames: grit off the slab's edge, the scrape (her eyes drop), the head turn, the unease, the lean back, a blink */
export const F3_K = {grit: 0, scrape: 4, eyes: 5, head0: 6, head1: 14, see: 9, un0: 9, un1: 17, lean0: 11, lean1: 19, blink: 22};
/** the grit trickle off the slab's top edge (pocket px), shot seconds */
export const F3_GRIT = {t0: 0.0, dur: 0.4};
/** close on her face through the turn and the reaction, then the camera follows her gaze down to the insect, ending
 *  on the two-shot F5 holds */
export const F3_CAM0 = {x: 505, y: 765, z: 1.6};
export const f3Cam = (lf: number) => {
  const u = sr(lf, 13, 29);
  return camAt(lerp(F3_CAM0.x, F5_CAM.x, u), lerp(F3_CAM0.y, F5_CAM.y, u), 540, 960, lerp(F3_CAM0.z, F5_CAM.z, u));
};
/** the insect's head (pocket px) in the two-shots */
export const medicHeadPx = (T: number) => {
  const fr = medicPose(T).frame;
  const p = P(cfView(), [fr.o[0] + fr.x[0] * 33, fr.o[1] + 10, fr.o[2] + fr.x[2] * 33]);
  return {x: p[0], y: p[1]};
};
export const F3: React.FC<ShotProps> = ({f, lf}) => {
  const T = f / FPS, t = lf / FPS;
  const K = F3_K;
  const pose = medicPose(T);
  const head = medicHeadPx(T);
  const edge = cardPx(SLAB.x0 + 4, SLAB.h, SLAB.z0 + 26);
  const look = sr(lf, K.eyes, K.eyes + 3);
  const gaze = {x: lerp(edge[0], head.x, look), y: lerp(edge[1] - 20, head.y, look)};
  const lean = sr(lf, K.lean0, K.lean1);
  const a: Acting = {
    recog: 0, recoil: 0.3 * lean,
    handOpen: 0.14 - 0.12 * sr(lf, K.lean0, K.lean0 + 6), // her fingers tighten a little
    blink: Math.max(0, 1 - Math.abs(lf - K.blink) / 1.6),
    gaze,
    breath: keys(lf, [[0, 0.35], [K.un0, 0.3], [K.lean1, 0.6], [29, 0.7]]),
    turn: keys(lf, [[0, 4], [K.head0, 4], [K.head1, 11], [29, 10]]),
    nod: keys(lf, [[0, -4], [K.head0, -4], [K.head1, 11], [29, 12]]),
    tilt: keys(lf, [[0, 2], [K.head1, -2], [29, -2.5]]),
    face: faceTrack(lf, [[0, FF.wary], [K.un0, FF.wary], [K.un1, FF.unease]]),
  };
  const gy0 = edge[1] + 6;
  return (
    <PocketFrame id={`f3f${f}`} cam={f3Cam(lf)} T={T} a={a} medic={pose} fan={0.8} vig={0.5}
      over={<Grit t={t} x={edge[0] + 8} y0={gy0} y1={gy0 + 130} t0={F3_GRIT.t0} dur={F3_GRIT.dur} n={9} g={2400} r={4} spread={14} seed={17} />} />
  );
};
