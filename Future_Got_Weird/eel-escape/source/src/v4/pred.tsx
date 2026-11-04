// The predator, as the film's exterior shots use it. Until art/pred3d.tsx (builder P) lands this re-exports the
// stand-in with the same API; then it re-exports pred3d.
import React from 'react';
import {Basis, proj, V3} from './three';
import {StandInFish} from './standin';
import {EXIT0} from './escape';

export type PredPose = {t: number; gill: number; mouth: number; bend: number; finPhase: number; startle: number; look: V3 | null};
export const PRED_REST: PredPose = {t: 0, gill: 0.15, mouth: 0, bend: 0, finPhase: 0, startle: 0, look: null};
export const Predator: React.FC<{B: Basis; pose: PredPose; dim?: number}> = ({B}) => <StandInFish B={B} />;
export const predGeom = (B: Basis, pose: PredPose) => {
  // a small crescent at the exit
  const c = EXIT0.p;
  const pts: V3[] = Array.from({length: 16}, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return [c[0] + 1.2 * Math.cos(a) - 0.5, c[1] + 3.5 * Math.sin(a) + 1, c[2] + 0.2] as V3;
  });
  const gap = 'M' + pts.map((p) => proj(B, p)).map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join('L') + 'Z';
  const e = proj(B, [-40.6, -7, 6.2]);
  return {outline: '', gap, mouthHole: '', exit: {p: EXIT0.p, out: EXIT0.out, n: [0, 0, 1] as V3}, mouthIn: {p: [-50, 1, 0] as V3, dir: [1, 0, 0] as V3}, eye: {x: e.x, y: e.y, r: 2.4 * e.s}, gill: pose.gill};
};
