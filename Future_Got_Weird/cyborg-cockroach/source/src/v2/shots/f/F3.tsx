// F3 (818-847, "crawling toward you..."): close on her face (the whole head, headroom under the slab), eyes up on the
// slab ahead where grit trickles off its edge (something moving inside); a scrape below: her eyes drop to it, her head
// turns and dips to follow, and she sees the cockroach coming along the ledge toward her hand. V5: the first sight is a
// clean STARTLE: over 4 frames her eyes widen, her brows lift, her mouth parts on a small catch of breath, and her
// head and shoulders make a quick small recoil; she holds the breath (no breathing) while her eyes stay on it. Then she
// settles, within half a second, into wary unease (brows drawn together and up a little, eyes still a little wide,
// mouth closed small and tight), her eyes tracking it as it comes; she blinks once. Everything stays on the face rig.
// The camera follows her gaze down to the insect, ending on the two-shot F5 holds.
import React from 'react';
import {sr, keys, lerp} from '../../../lib/ease';
import {P} from '../../roach/ortho';
import {Grit} from '../e/art';
import {ShotProps} from '../index2';
import {PocketFrame, FF, faceTrack, Acting, camAt, F5_CAM} from './pocket';
import {face} from '../../../crew/person/poses';

/** the startle (on the rig's face controls): eyes wide, brows lifted (the inner ends a little more; still well under the
 *  bob's hairline), lids up, the mouth parted small on the catch of breath */
const STARTLE = face({brow: 0.36, browIn: 0.65, lid: 0, wide: 0.9, mw: 8.5, curve: -0.2, open: 0.2});
import {FPS, medicPose, cfView, cardPx, SLAB} from './world';

/** shot frames: grit off the slab's edge, the scrape (her eyes drop), the head turn, the startle (st0 -> st1: eyes
 *  widen, brows lift, the quick recoil, the catch of breath), the held breath (to hold1), the settle into unease
 *  (un0 -> un1), a blink */
export const F3_K = {grit: 0, scrape: 4, eyes: 5, head0: 6, head1: 15, see: 8, st0: 8, st1: 12, hold1: 17, un0: 13, un1: 23, blink: 25};
/** her near hand (handOpen) at F3's end: drawn in tight at the startle (F4 starts from it) */
export const F3_HAND_END = 0.04;
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
const f3Edge = () => cardPx(SLAB.x0 + 4, SLAB.h, SLAB.z0 + 26);
/** her acting at film frame f (shot frame lf) */
export const f3Acting = (f: number, lf: number): Acting => {
  const T = f / FPS;
  const K = F3_K;
  const head = medicHeadPx(T);
  const edge = f3Edge();
  const look = sr(lf, K.eyes, K.eyes + 3);
  const gaze = {x: lerp(edge[0], head.x, look), y: lerp(edge[1] - 20, head.y, look)};
  // the startle: a fast rise (4 frames) and a slower settle; the recoil settles to F4/F5's small lean back (0.3)
  const st = sr(lf, K.st0, K.st1);
  const settle = sr(lf, K.un0, K.un1);
  const a: Acting = {
    recog: 0, recoil: 0.8 * st - 0.5 * settle,
    handOpen: 0.14 - (0.14 - F3_HAND_END) * sr(lf, K.st0, K.st1 + 2), // her fingers draw in tight
    blink: Math.max(0, 1 - Math.abs(lf - K.blink) / 1.6),
    gaze,
    // breathing: the held breath at the startle (the chest stops), then breathing again, shallow, as she settles
    breath: keys(lf, [[0, 0.35], [K.st0, 0.3], [K.st1, 0.05], [K.hold1, 0.05], [29, 0.6]]),
    turn: keys(lf, [[0, 4], [K.head0, 4], [K.head1, 11], [29, 10]]),
    nod: keys(lf, [[0, -4], [K.head0, -4], [K.head1, 11], [29, 12]]),
    tilt: keys(lf, [[0, 2], [K.head1, -2], [29, -2.5]]),
    face: faceTrack(lf, [[0, FF.wary], [K.st0, FF.wary], [K.st1, STARTLE], [K.un0, STARTLE], [K.un1, FF.unease]]),
  };
  return a;
};
export const F3: React.FC<ShotProps> = ({f, lf}) => {
  const T = f / FPS, t = lf / FPS;
  const pose = medicPose(T);
  const edge = f3Edge();
  const a = f3Acting(f, lf);
  const gy0 = edge[1] + 6;
  return (
    <PocketFrame id={`f3f${f}`} cam={f3Cam(lf)} T={T} a={a} medic={pose} fan={0.8} vig={0.5}
      over={<Grit t={t} x={edge[0] + 8} y0={gy0} y1={gy0 + 130} t0={F3_GRIT.t0} dur={F3_GRIT.dur} n={9} g={2400} r={4} spread={14} seed={17} />} />
  );
};
