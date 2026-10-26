// Hook: the exchange is already underway at frame 0. One continuous camera: a slow push on the pair while the
// visitor's small cue grows into a smile and the robot joins it; then one reframe into the robot's mouth corner on
// "That takes more than moving the corners of a mouth", where the corner and the skin around it move together.
import React from 'react';
import {easeInOut} from '../dc/math';
import {camPath} from '../lib/cam';
import {K, robotAt, visitorAt} from '../state';
import {INT, IntSet} from './IntSet';
import {Notebook} from '../art/Lab';
import {lipAnchors} from '../art/Robot';

const ease2 = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
/** the robot's right mouth corner (screen-right, the side facing the visitor) at the end of the push, in world units */
const CORNER = (() => {
  const st = robotAt(Math.round((K.corner + 1.8) * 30));
  const c = lipAnchors(st).find((a) => a.k === 'cornerL')!.p;
  return {x: INT.robot.x + c.x * INT.robot.s, y: INT.robot.y + c.y * INT.robot.s};
})();
export const hookCam = (f: number) =>
  camPath(
    f,
    [
      [0, {x: 985, y: 410, z: 1.34}],
      [K.corner - 0.15, {x: 982, y: 402, z: 1.5}],
      [K.corner + 1.8, {x: CORNER.x + 10, y: CORNER.y - 6, z: 3.6}],
      [K.mirrorCut, {x: CORNER.x + 10, y: CORNER.y - 6, z: 3.75}],
    ],
    ease2,
  );

export const Hook: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const rob = robotAt(f);
  const vis = visitorAt(f);
  // in the corner close-up the lip anchors appear faintly: the corner is not one point but a patch of skin pulled
  // by several attachments together
  const a = Math.min(1, Math.max(0, (t - (K.corner + 1.2)) / 0.6)) * Math.min(1, Math.max(0, (K.mirrorCut - 0.25 - t) / 0.5));
  return <IntSet id="hk" cam={hookCam(f)} robot={rob} vis={vis} grid={a * 0.85} gridAt={{u: -40, v: -2, r: 44}} onBench={<Notebook x={1180} y={INT.benchY + 40} rot={-6} />} />;
};
export {lipAnchors, easeInOut};
