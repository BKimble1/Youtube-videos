// "Watch the smile again. The robot has learned a movement. You're the one deciding what it means."
// The opening geometry exactly (the hook's camera from frame 0 and the same set), the same exchange again. On "has
// learned a movement" a faint mark on the robot's mouth corner; on "You're the one deciding" the camera eases toward
// the visitor and holds on his face as the expression resolves.
import React from 'react';
import {camPath} from '../lib/cam';
import {K, robotAt, visitorAt} from '../state';
import {hookCam} from './Hook';
import {INT, IntSet} from './IntSet';
import {Notebook} from '../art/Lab';

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const Callback: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const t0 = K.again;
  // the hook's camera, replayed from its own frame 0
  const base = hookCam(Math.round((t - t0) * 30));
  const cam = camPath(
    f,
    [
      [K.deciding - 0.1, base],
      [K.deciding + 1.8, {x: INT.visitor.x + 10, y: INT.visitor.y + 20, z: 2.05}],
      [K.end + 3, {x: INT.visitor.x + 6, y: INT.visitor.y + 20, z: 2.1}],
    ],
    ease,
  );
  const useCam = t < K.deciding - 0.1 ? base : cam;
  return <IntSet id="cb" cam={useCam} robot={robotAt(f)} vis={visitorAt(f)} onBench={<Notebook x={1180} y={INT.benchY + 42} rot={-6} open w={220} h={120} />} />;
};
