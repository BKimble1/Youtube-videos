// "Enough to turn a delayed copy into a shared-looking moment." -> "...how much meaning we attach to a well-timed
// response." Back in the interaction set: the shared-looking smile; on "These were studies of facial movement" the
// x-ray shows the motors under the smile (a controlled physical movement, no emotion meter); then a possible use,
// labelled as such: the visitor's notebook open on the bench, the robot speaking (silently) and matching his
// expression; finally the camera drifts toward the visitor for the question.
import React from 'react';
import {Notebook} from '../art/Lab';
import {Tag} from '../art/Ui';
import {camPath} from '../lib/cam';
import {pr, T} from '../lib/core';
import {K, robotAt, visitorAt} from '../state';
import {INT, IntSet} from './IntSet';

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const Together: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const cam = camPath(
    f,
    [
      [K.enough, {x: 985, y: 410, z: 1.34}],
      [K.these, {x: 980, y: 400, z: 1.42}],
      [T('A successful') + 1.5, {x: 860, y: 400, z: 1.62}],
      [K.picture + 0.3, {x: 985, y: 420, z: 1.3}],
      [K.question - 0.3, {x: 1000, y: 410, z: 1.42}],
      [K.again, {x: 985, y: 410, z: 1.34}],
    ],
    ease,
  );
  const xr = pr(f, K.these + 0.3, K.these + 0.9) * (1 - pr(f, T('A successful') + 1.6, T('A successful') + 2.4));
  const use = t > K.picture - 0.2;
  const tutor = pr(f, K.tutor, K.tutor + 0.4) * (1 - pr(f, T('or a robotic') - 0.1, T('or a robotic') + 0.3));
  const assist = pr(f, T('or a robotic') - 0.1, T('or a robotic') + 0.3) * (1 - pr(f, K.question - 0.2, K.question + 0.3));
  const st = robotAt(f);
  return (
    <g>
      <IntSet
        id="tg"
        cam={cam}
        robot={st}
        vis={visitorAt(f)}
        onBench={use ? <Notebook x={1180} y={INT.benchY + 42} rot={-6} open w={220} h={120} /> : <Notebook x={1180} y={INT.benchY + 40} rot={-6} />}
        xray={xr}
      />
      <Tag x={70} y={90} text="Possible use" k={pr(f, K.picture - 0.1, K.picture + 0.3) * (1 - pr(f, K.question + 1.0, K.question + 1.5))} size={26} />
      <Tag x={70} y={145} text="a tutor" k={tutor} size={26} tone="warm" />
      <Tag x={70} y={145} text="an assistant" k={assist} size={26} tone="warm" />
    </g>
  );
};
