// V3 lab renderer: V2's (v2/LabView2.tsx) plus the pass-through outline of the grab, split into a back arc (behind
// the hand) and a front arc (over it), so the closing fingers visibly pass through its plane: nothing stops them.
import React from 'react';
import {LabView2, focusOf} from '../v2/LabView2';
import {Shot3} from './shots3';
import {project} from '../it/cam3';
import {CYAN, CYAN_HI} from '../it/fx';

export const LabView3: React.FC<{s: Shot3; t: number; id: string}> = ({s, t, id}) => {
  const a = s.passOutline;
  // the outline in screen space, pinned at the focus (the lab draws the figure as a billboard at the pad)
  const pp = project(s.cam, {x: s.pad.x, y: -s.pad.y, z: 0});
  const F = focusOf(s);
  const fx = pp.x + (F.x - s.pad.x) * pp.k, fy = pp.y + (F.y - s.pad.y) * pp.k;
  const r = 24 * pp.k, ry = r * 0.3;
  const arc = (front: boolean) =>
    `M${(fx - r).toFixed(1)},${fy.toFixed(1)} A${r.toFixed(1)},${ry.toFixed(1)} 0 0 ${front ? 0 : 1} ${(fx + r).toFixed(1)},${fy.toFixed(1)}`;
  const dash = `${(0.9 * pp.k).toFixed(1)} ${(0.6 * pp.k).toFixed(1)}`;
  return (
    <g>
      {a > 0.01 && (
        <g opacity={a}>
          <ellipse cx={fx} cy={fy} rx={r} ry={ry} fill={CYAN} opacity={0.14} />
          <path d={arc(false)} fill="none" stroke={CYAN_HI} strokeWidth={Math.max(3, 0.32 * pp.k)} strokeDasharray={dash} opacity={0.9} />
        </g>
      )}
      <LabView2 s={s} t={t} id={id} />
      {a > 0.01 && (
        <g opacity={a}>
          <path d={arc(true)} fill="none" stroke={CYAN} strokeWidth={Math.max(9, 0.9 * pp.k)} opacity={0.18} />
          <path d={arc(true)} fill="none" stroke={CYAN_HI} strokeWidth={Math.max(3.5, 0.4 * pp.k)} strokeDasharray={dash} />
        </g>
      )}
    </g>
  );
};
