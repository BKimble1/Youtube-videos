// dev still: one test rig (a tetrahedron with a fourth link at its rear vertex) from a given camera
import React from 'react';
import {Item, order3, projector, resetIds} from '../lib/r3';
import {cam} from '../lib/campath';
import {v3} from '../lib/v3';
import {RigState, resolve, COL} from '../v3/rig';
import {linkItems3} from '../v3/draw';
import {Paint3} from '../lib/r3';

export const testRig = (): RigState => {
  const RB = 0.017;
  const V0 = v3(0, RB, 0.182), V2 = v3(0, RB, -0.182), V1 = v3(-0.315, RB, 0), V3 = v3(-0.105, RB + 0.297, 0);
  return {
    joints: {V0, V1, V2, V3},
    order: {V0: ['e02:a', 'e03:a', 'L:a'], V2: ['e02:b', 'e23:a', 'e12:b'], V1: ['e12:a', 'e13:a', 'L:b', 'S:a'], V3: ['e03:b', 'e13:b', 'e23:b']},
    links: [
      {id: 'e02', a: {j: 'V0'}, b: {j: 'V2'}, band: COL.bandT, led: 1},
      {id: 'e03', a: {j: 'V0'}, b: {j: 'V3'}, band: COL.bandT, led: 1},
      {id: 'e23', a: {j: 'V2'}, b: {j: 'V3'}, band: COL.bandT, led: 1},
      {id: 'e12', a: {j: 'V1'}, b: {j: 'V2'}, band: COL.bandT, led: 1},
      {id: 'e13', a: {j: 'V1'}, b: {j: 'V3'}, band: COL.bandT, led: 1},
      {id: 'L', a: {j: 'V0'}, b: {j: 'V1'}, band: COL.bandX, led: 1},
      {id: 'S', a: {j: 'V1'}, b: {p: v3(-0.62, RB, 0.05)}, band: COL.bandS, led: 1},
    ],
  };
};

export const Rig3Test: React.FC<{eye: [number, number, number]; target: [number, number, number]; f: number}> = ({eye, target, f}) => {
  resetIds('t');
  const c = cam(eye, target, f);
  const P = projector(c);
  const R = resolve(testRig());
  const items: Item[] = [];
  for (const l of R.links) items.push(...linkItems3(P, l, {A: l.jA ? R.joints[l.jA] : undefined, B: l.jB ? R.joints[l.jB] : undefined}));
  const {stats} = order3(items, P);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <rect width={1080} height={1920} fill="#DCE6EA" />
      <Paint3 items={items} P={P} />
      <text x={30} y={60} fontSize={36} fill="#333">pairs {stats.map((s) => s.pairs).join(',')} cycles {stats.map((s) => s.cycles).join(',')}</text>
    </svg>
  );
};
