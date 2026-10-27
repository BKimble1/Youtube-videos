// F3 (818-847, "crawling toward you..."): close on her face, eyes up on the slab ahead where grit trickles off its edge
// (something moving inside); a scrape below: her eyes drop, her head turns and dips, and she sees it, the cockroach
// pushing out of the crack onto the ledge: disgust (brows down and knitted, nose wrinkled, upper lip pulled up on one
// side, a squint) and a recoil (head pulls back, fingers curl in), a small shudder. The camera follows her gaze down to
// the insect, ending on the two-shot.
import React from 'react';
import {sr, keys, lerp} from '../../../lib/ease';
import {P} from '../../roach/ortho';
import {Grit} from '../e/art';
import {ShotProps} from '../index2';
import {PocketFrame, FF, faceTrack, Acting, camAt, F5_CAM} from './pocket';
import {FPS, medicPose, cfView, cardPx, SLAB} from './world';

/** shot frames: grit off the slab's edge, the scrape (her eyes drop), the head turn, disgust and recoil */
export const F3_K = {grit: 0, scrape: 4, eyes: 5, head0: 6, head1: 13, see: 10, disg0: 10, disg1: 16, rec0: 11, rec1: 17};
/** the grit trickle off the slab's top edge (pocket px), shot seconds */
export const F3_GRIT = {t0: 0.0, dur: 0.4};
/** close on her face through the turn and the disgust, then the camera follows her gaze down to the insect, ending on
 *  the two-shot F5 holds */
export const f3Cam = (lf: number) => {
  const u = sr(lf, 14, 29);
  return camAt(lerp(590, F5_CAM.x, u), lerp(800, F5_CAM.y, u), 540, 960, lerp(1.4, F5_CAM.z, u));
};
export const F3: React.FC<ShotProps> = ({f, lf}) => {
  const T = f / FPS, t = lf / FPS;
  const K = F3_K;
  const pose = medicPose(T);
  const v = cfView();
  const fr = pose.frame;
  const headPt = P(v, [fr.o[0] + fr.x[0] * 33, fr.o[1] + 10, fr.o[2] + fr.x[2] * 33]);
  const edge = cardPx(SLAB.x0 + 4, SLAB.h, SLAB.z0 + 26);
  const look = sr(lf, K.eyes, K.eyes + 3);
  const gaze = {x: lerp(edge[0], headPt[0], look), y: lerp(edge[1] - 20, headPt[1], look)};
  const rc = sr(lf, K.rec0, K.rec1);
  // a small shudder after the recoil (decaying)
  const sh = lf > K.rec1 ? Math.sin(((lf - K.rec1) / 3.2) * Math.PI * 2) * Math.exp(-(lf - K.rec1) / 6) : 0;
  const a: Acting = {
    recog: 0, recoil: 0.85 * rc,
    handOpen: 0.2 - 0.2 * sr(lf, K.rec0, K.rec0 + 5),
    blink: lf >= K.disg0 && lf < K.disg0 + 4 ? 0.35 * Math.sin(((lf - K.disg0) / 4) * Math.PI) : 0,
    gaze,
    breath: keys(lf, [[0, 0.3], [K.rec0, 0.3], [K.rec1, 1.4], [29, 1.1]]),
    turn: keys(lf, [[0, 4], [K.head0, 4], [K.head1, 12], [K.rec1 + 1, 5], [29, 6]]) + 2.2 * sh, // she turns to it, then a little away (side-eye)
    nod: keys(lf, [[0, -4], [K.head0, -4], [K.head1, 12], [29, 11]]),
    tilt: keys(lf, [[0, 2], [K.head1, -3]]) + 1.5 * sh,
    face: faceTrack(lf, [[0, FF.wary], [K.disg0, FF.wary], [K.disg1, FF.disgust]]),
    wrinkle: sr(lf, K.disg0 + 1, K.disg1),
  };
  const gy0 = edge[1] + 6;
  return (
    <PocketFrame id="f3" cam={f3Cam(lf)} T={T} a={a} medic={pose} fan={0.8} vig={0.5}
      over={<Grit t={t} x={edge[0] + 8} y0={gy0} y1={gy0 + 130} t0={F3_GRIT.t0} dur={F3_GRIT.dur} n={9} g={2400} r={4} spread={14} seed={17} />} />
  );
};
