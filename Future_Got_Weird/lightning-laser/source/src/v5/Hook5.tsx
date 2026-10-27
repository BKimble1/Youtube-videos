// V5 beat A (0-4.31): the new hook (HOOK owner).
//   A1 0-1.2      inside the control room (Room5.tsx), already moving: the machine is charging (sparks spit from the
//                 panel), the operator's hand is on its way and hits the guarded FIRE control (hazard ring) on "fired"
//                 (0.2, the fingertip exactly on the cap); the cap goes in and lights, and on the relay (0.27) the beam
//                 ignites outside: the glass floods with its light, a bright front races up past the tower into the
//                 storm and the beam blazes with a dense packet train while she looks up at it ("LASER")
//   A2 1.2-2.25   the surge builds in the console (arcs crawl over the panel to her hand, the room light stutters); on
//                 the crack (1.75) the frame flashes white-violet and glitches (RGB split, tears, a shake of the image)
//                 and she flickers into an x-ray skeleton inside her own outline (frames 53, 54, 56: white flash, dark
//                 violet, normal, weaker flash); she snaps her hand back, startled; the thunder flash (2.02, thunder
//                 2.1) lights the window and she looks up
//   A3 2.12-2.6   the whip up (Hook5_fx.tsx: vertical motion blur and streaks), cut on the whip (2.25) to outside: the
//                 camera rockets up from the tower's base beside the beam into the storm (Hook5_ext.tsx)
//   A4 2.6-4.31   the storm deck over the summit flickers from within (2.4, 2.64, 2.8); the upward leader incepts at the
//                 rod tip (2.82), follows the beam's guided section ("FOLLOWED" 3.26) and connects at 3.52 (re-strokes
//                 3.64, 3.83); one push in onto V3's openCam, and from 4.2 the frame is V3's OpenA exactly (A -> B)
import React from 'react';
import {OpenA} from '../v3/Open3';
import {CUT_X, HAND5, roomCam5} from './cams5_hook';
import {Room5} from './Room5';
import {Ext5} from './Hook5_ext';
import {Post5} from './Hook5_fx';
import {Follow5, FOLLOW0, FOLLOW1} from './Hook5_follow';

/** the faster hook (client note: press, shock and lightning within the first two seconds): the shots above are played
 *  on a hook clock T = hookT(t), a smooth monotone time warp. The press stays on "fired" (0.2, real time), the hold on
 *  "LASER" and the surge build are shortened, the x-ray flash plays in real time (0.70-0.85), the recoil and the whip
 *  run a little faster, the rocket up the beam in real time, and the leader's climb is quickened so that it connects
 *  on the loud crack (1.75). From that frame the film is V3's opening itself (openCam/openSt: the connection at 1.75,
 *  the re-strokes at 3.52, 3.64, 3.83 on their sounds, B's start at 4.31), cut on the connection flash. Near t = 0 the
 *  clock is real time, so the loop shot (Loop5) still runs straight into the press. On the caption change (2.52) a
 *  close shot rushes up the guided section with the bolt (Hook5_follow.tsx) and cuts back out on the restrike crack
 *  (3.52), so the connected bolt is not held in one view for 2.5 s. */
const WARP: [number, number][] = [[0, 0], [0.3, 0.3], [0.55, 1.3], [0.7, 1.75], [0.85, 1.9], [1.05, 2.25], [1.45, 2.65], [1.75, 3.52]];
const SLOPE = (() => {
  // Fritsch-Carlson monotone cubic slopes (velocity changes smoothly between the knots), slope 1 at t = 0
  const n = WARP.length, d = WARP.slice(1).map(([u, T], i) => (T - WARP[i][1]) / (u - WARP[i][0]));
  const m = WARP.map((_, i) => (i === 0 ? 1 : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i])));
  return m;
})();
export const hookT = (t: number) => {
  if (t <= 0) return t;
  const i = Math.max(0, Math.min(WARP.length - 2, WARP.findIndex(([u], k) => k < WARP.length - 1 && t < WARP[k + 1][0])));
  const [u0, T0] = WARP[i], [u1, T1] = WARP[i + 1];
  const h = u1 - u0, x = Math.min(1, (t - u0) / h), x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * T0 + (x3 - 2 * x2 + x) * h * SLOPE[i] + (-2 * x3 + 3 * x2) * T1 + (x3 - x2) * h * SLOPE[i + 1];
};
export const HOOK_TO_V3 = 1.75;

export const HookA5: React.FC<{t: number}> = ({t}) => {
  if (t >= FOLLOW0 && t < FOLLOW1) return <Follow5 t={t} />;
  if (t >= HOOK_TO_V3 || t >= HAND5) return <OpenA t={t} />;
  const T = hookT(t);
  const tag = `k5-${Math.round(t * 30)}`;
  return <Post5 t={T} id={`${tag}-post`}>{T < CUT_X ? <Room5 t={T} rc={roomCam5(T)} tag={tag} /> : <Ext5 t={T} tag={tag} />}</Post5>;
};
