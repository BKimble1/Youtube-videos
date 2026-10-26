// Mirror reveal. Match on the mouth corner: the hook ends close on the robot's corner; this shot opens equally close
// on the same corner in the mirror and pulls back, so the mirror's frame enters, then the robot's own head in the
// foreground: by "a mirror" the robot is plainly looking at its reflection. The pull-back is one move with a
// controlled start and a readable arrival.
import React from 'react';
import {lipAnchors} from '../art/Robot';
import {camPath} from '../lib/cam';
import {K, robotAt} from '../state';
import {MIR, MirrorSet, reflectYaw} from './MirrorSet';

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** the reflected corner, in world units of the mirror layer (depth 1.35; the camera layer transform handles it) */
const RCORNER = (() => {
  const st = robotAt(Math.round(K.mirrorCut * 30));
  const c = lipAnchors({...st, yaw: reflectYaw(st.yaw)}).find((a) => a.k === 'cornerR')!.p;
  return {x: MIR.refl.x - c.x * MIR.refl.s, y: MIR.refl.y + c.y * MIR.refl.s};
})();
// a camera at depth-1 coordinates that centres a depth-1.35 point: layer centre cx' = AX + (cam.x - AX)/d
const D = 1.35;
const camFor = (p: {x: number; y: number}, zLayer: number) => ({x: 960 + (p.x - 960) * D, y: 540 + (p.y - 540) * D, z: 1 + (zLayer - 1) * D});
export const mirrorCam = (f: number) =>
  camPath(
    f,
    [
      [K.mirrorCut, camFor(RCORNER, 4.875 / MIR.refl.s)],
      [K.mirrorCut + 0.5, camFor({x: RCORNER.x + 4, y: RCORNER.y - 2}, 4.6 / MIR.refl.s)],
      [K.mirrorWord + 0.2, {x: 1000, y: 520, z: 1.06}],
      [K.columbia, {x: 996, y: 518, z: 1.045}],
    ],
    ease,
  );
export const MirrorReveal: React.FC<{f: number}> = ({f}) => <MirrorSet id="mr" cam={mirrorCam(f)} st={robotAt(f)} />;
