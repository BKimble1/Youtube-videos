// "The movements still had flaws. The team reported difficulties with sounds like "B" and "W." A small error is easy to
// notice when you're watching a mouth." Close on the robot's mouth. "B" needs the lips fully closed: the target line is
// drawn and the robot's lips stop just short of it (a labelled, deliberate illustration of the reported difficulty).
// "W" needs rounded, pushed-out lips: the target ring and a smaller rounding. Then the camera moves in on the gap.
import React from 'react';
import {lipAnchors} from '../art/Robot';
import {Tag, UI} from '../art/Ui';
import {fmt} from '../dc/math';
import {camPath, toScreen} from '../lib/cam';
import {pr, T} from '../lib/core';
import {K, robotAt} from '../state';
import {BenchWorld, BW} from './BenchWorld';

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const Flaws: React.FC<{f: number}> = ({f}) => {
  const st = robotAt(f);
  const A = lipAnchors(st);
  const w = (k: string) => {
    const p = A.find((a) => a.k === k)!.p;
    return {x: BW.head.x + p.x * BW.head.s, y: BW.head.y + p.y * BW.head.s};
  };
  const mouth = {x: (w('cornerL').x + w('cornerR').x) / 2, y: (w('upperC').y + w('lowerC').y) / 2};
  const cam = camPath(
    f,
    [
      [K.flaws, {x: 960, y: 560, z: 1.35}],
      [K.bw - 0.6, {x: mouth.x, y: mouth.y - 30, z: 2.6}],
      [K.small + 0.2, {x: mouth.x, y: mouth.y - 20, z: 2.7}],
      [K.small + 1.6, {x: mouth.x, y: mouth.y, z: 4.2}],
      [K.another, {x: mouth.x, y: mouth.y, z: 4.4}],
    ],
    ease,
  );
  const tB = pr(f, K.bw - 0.25, K.bw) * (1 - pr(f, T('“W.”') - 0.2, T('“W.”')));
  const tB2 = pr(f, K.small + 0.3, K.small + 0.7);
  const tW = pr(f, T('“W.”') - 0.15, T('“W.”') + 0.1) * (1 - pr(f, K.small - 0.3, K.small));
  const sL = toScreen(cam, w('cornerL'));
  const sR = toScreen(cam, w('cornerR'));
  const sU = toScreen(cam, w('upperC'));
  const sD = toScreen(cam, w('lowerC'));
  const midY = (sU.y + sD.y) / 2;
  const bAll = Math.max(tB, tB2);
  return (
    <g>
      <BenchWorld id="fl" cam={cam} st={st} />
      {/* B: the closed-lip target line, and the gap the robot leaves */}
      {bAll > 0.01 && (
        <g opacity={bAll}>
          <path d={`M${fmt(sL.x)},${fmt(midY)} L${fmt(sR.x)},${fmt(midY)}`} stroke="#FFF" strokeWidth={3} strokeDasharray="10 8" />
          <path d={`M${fmt(sU.x + 70)},${fmt(sU.y - 14)} l14,0 l0,${fmt(sD.y - sU.y + 28)} l-14,0`} fill="none" stroke={UI.amber} strokeWidth={4} />
        </g>
      )}
      {/* W: the rounded target */}
      {tW > 0.01 && <ellipse cx={fmt((sL.x + sR.x) / 2)} cy={fmt(midY)} rx={fmt((sR.x - sL.x) * 0.36)} ry={fmt((sR.x - sL.x) * 0.3)} fill="none" stroke="#FFF" strokeWidth={3} strokeDasharray="10 8" opacity={tW} />}
      <Tag x={70} y={90} text="Illustration of the reported difficulty" k={pr(f, K.flaws + 0.4, K.flaws + 0.8)} size={26} />
      <Tag x={70} y={1000} text="“B”: lips should fully close" k={tB} size={30} tone="warm" />
      <Tag x={70} y={1000} text="“W”: lips should round and push out" k={tW} size={30} tone="warm" />
      <Tag x={70} y={1000} text="Illustration: a small gap is easy to see" k={tB2} size={30} tone="warm" />
    </g>
  );
};
