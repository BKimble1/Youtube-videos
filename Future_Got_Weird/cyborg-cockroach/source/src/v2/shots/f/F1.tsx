// F1 (758-792, "So if you're trapped"): her pocket. She lies tired and dusty under the slab, eyes down on her hands,
// breathing slowly; ahead of her hands daylight leaks under a broken slab and spreads a fan of light on the floor. A
// small shadow slides out of the dark into that light (the unseen insect walking in the gap). Her eyes catch it, her lids
// open, her head turns and dips to follow it as it comes along toward her; she holds her breath. The camera eases a
// little toward it with her gaze.
import React from 'react';
import {sr, keys, lerp} from '../../../lib/ease';
import {ShotProps} from '../index2';
import {PocketFrame, FF, faceTrack, Acting, camAt, herLayout} from './pocket';
import {R1, FPS, slitWalkX, slitShadowPx} from './world';

/** shot frames: the shadow's head comes into the light; she sees it; her head follows */
export const F1_K = {enter: 4, eyes: 9, head0: 12, head1: 26};
/** the shadow's leading point (pocket px) at film second T */
export const f1ShadowAt = (T: number) => {
  const [x, y] = slitShadowPx([slitWalkX(T) + 26, 10, 0]);
  return {x, y};
};
/** close on her face, then the camera follows her gaze down to the light on the floor ahead of her hand, keeping her
 *  whole face (eyes, nose, mouth) in the top-left corner (V4: the move ends 45 px earlier and a little wider, so the
 *  frame edge no longer cuts through her face) */
export const f1Cam = (lf: number) => {
  const u = sr(lf, F1_K.eyes + 1, R1.to - R1.from - 1);
  return camAt(lerp(600, 820, u), lerp(830, 1000, u), 540, 960, lerp(1.4, 1.5, u));
};

/** her acting at film frame f (shot frame lf) */
export const f1Acting = (f: number, lf: number): Acting => {
  const T = f / FPS;
  const K = F1_K;
  // her eyes: down on her near hand, then a flick to the shadow, then they stay on it
  const rest0 = herLayout(T, {recog: 0, recoil: 0, handOpen: 0.3, gaze: {x: 0, y: 0}, face: FF.tired});
  const hand = {x: rest0.nearTip.x - 30, y: rest0.nearTip.y + 20};
  const sh = f1ShadowAt(T);
  const look = sr(lf, K.eyes, K.eyes + 3);
  const gaze = {x: lerp(hand.x, sh.x, look), y: lerp(hand.y, sh.y, look)};
  const a: Acting = {
    recog: 0, recoil: 0.12 * sr(lf, K.eyes, K.eyes + 5) * (1 - sr(lf, K.head1, 34)),
    handOpen: 0.3 - 0.25 * sr(lf, K.eyes + 2, K.eyes + 10), // fingers draw in a little
    blink: Math.max(0, 1 - Math.abs(lf - 4.5) / 2.2),
    gaze,
    breath: keys(lf, [[0, 1], [K.eyes, 1], [K.eyes + 6, 0.25]]),
    turn: keys(lf, [[K.head0, 0], [K.head1, 10], [34, 12]]),
    nod: keys(lf, [[0, 4], [8, 5], [K.head0, 2], [K.head1, 9], [34, 10]]),
    tilt: keys(lf, [[0, -2], [K.head1, 2]]),
    face: faceTrack(lf, [[0, FF.tired], [K.eyes, FF.tired], [K.eyes + 6, FF.wary]]),
  };
  return a;
};
export const F1: React.FC<ShotProps> = ({f, lf}) => {
  const T = f / FPS;
  const a = f1Acting(f, lf);
  return <PocketFrame id={`f1f${f}`} cam={f1Cam(lf)} T={T} a={a} shadow fan={1} vig={0.55} />;
};
