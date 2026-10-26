// "That matters because flexible skin moves differently from a rigid metal part. Pull at one point, and the material
// around it stretches too. The controller has to work with the face it actually has."
// The robot's front view at its bench. The camera follows one lip attachment (the left corner) into a local view;
// a lattice of skin points appears around it. Beside it, a rigid metal link turns about its pin and nothing else moves.
// On "Pull at one point" the attachment is pulled and the lattice around it stretches; the explanation completes
// before the camera leaves.
import React from 'react';
import {lipAnchors} from '../art/Robot';
import {Card, Tag, UI} from '../art/Ui';
import {INK} from '../dc/ink';
import {fmt} from '../dc/math';
import {camPath} from '../lib/cam';
import {pr} from '../lib/core';
import {K, robotAt} from '../state';
import {BenchWorld, BW} from './BenchWorld';

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const CORNER = (() => {
  const st = robotAt(Math.round((K.skin + 2) * 30));
  const c = lipAnchors(st).find((a) => a.k === 'cornerL')!.p;
  return {x: BW.head.x + c.x * BW.head.s, y: BW.head.y + c.y * BW.head.s};
})();

/** the rigid comparison: a metal link on a pin, turning; nothing around it deforms */
const Rigid: React.FC<{ang: number}> = ({ang}) => (
  <g>
    {[0, 1, 2, 3, 4].map((i) => (
      <line key={i} x1={40 + i * 50} y1={110} x2={40 + i * 50} y2={260} stroke="#C9C2B0" strokeWidth={2} />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <line key={`h${i}`} x1={30} y1={120 + i * 45} x2={260} y2={120 + i * 45} stroke="#C9C2B0" strokeWidth={2} />
    ))}
    <g transform={`rotate(${fmt(ang)} 90 185)`}>
      <rect x={70} y={170} width={170} height={30} rx={15} fill="#9AA5B1" stroke={INK} strokeWidth={3} />
      <circle cx={220} cy={185} r={7} fill="#5C6670" />
    </g>
    <circle cx={90} cy={185} r={11} fill="#3A4450" stroke={INK} strokeWidth={3} />
  </g>
);

export const Skin: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = robotAt(f);
  const cam = camPath(
    f,
    [
      [K.skin, {x: 960, y: 520, z: 1.08}],
      [K.skin + 1.8, {x: CORNER.x - 60, y: CORNER.y - 10, z: 2.4}],
      [K.controller + 1.6, {x: CORNER.x - 70, y: CORNER.y - 14, z: 2.55}],
      [K.once, {x: 1000, y: 520, z: 1.1}],
    ],
    ease,
  );
  const gk = pr(f, K.skin + 1.0, K.skin + 1.8) * (1 - pr(f, K.controller + 1.2, K.controller + 2.0));
  const rk = pr(f, K.skin + 1.6, K.skin + 2.1) * (1 - pr(f, K.pull + 0.1, K.pull + 0.5));
  const ang = -25 * Math.sin(Math.max(0, t - (K.skin + 2)) * 2.2);
  return (
    <g>
      <BenchWorld id="sk" cam={cam} st={st} grid={gk} gridAt={{u: -40, v: 0, r: 52}} anchors={gk * pr(f, K.pull - 0.4, K.pull)} focusAnchor="cornerL" />
      <g transform="translate(70 230) scale(1.45)"><Card x={0} y={0} w={300} h={300} title="Rigid part" titleSize={34} k={rk} accent={UI.teal}>
        <Rigid ang={ang} />
      </Card></g>
      <Tag x={80} y={200} text="Flexible skin: neighbours move too" k={pr(f, K.pull + 0.1, K.pull + 0.5) * (1 - pr(f, K.controller + 1.2, K.controller + 1.8))} size={26} tone="warm" />
    </g>
  );
};
