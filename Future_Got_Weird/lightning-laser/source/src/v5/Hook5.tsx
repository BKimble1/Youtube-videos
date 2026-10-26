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

export const HookA5: React.FC<{t: number}> = ({t}) => {
  if (t >= HAND5) return <OpenA t={t} />;
  const tag = `k5-${Math.round(t * 30)}`;
  return <Post5 t={t} id={`${tag}-post`}>{t < CUT_X ? <Room5 t={t} rc={roomCam5(t)} tag={tag} /> : <Ext5 t={t} tag={tag} />}</Post5>;
};
