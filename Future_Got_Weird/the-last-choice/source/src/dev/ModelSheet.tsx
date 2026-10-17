// Rig check: the approved cast at front / three-quarter / profile / back, and action poses. Compare with
// can-you-hurt-something-that-isnt-alive/production/approved_cast/cast_rig_check.png.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Actor, ActorProps} from '../rig/actor';
import {CAST} from '../rig/looks';
import {C, F} from '../theme';

const names = ['clerkC', 'checker', 'clerkA', 'clerkB', 'honest'];
export const ModelSheet: React.FC<{page: number}> = ({page}) => {
  const f = useCurrentFrame();
  const t = f / 30 + 0.7;
  const rows: {label: string; p: Partial<ActorProps>}[] =
    page === 0 ? [{label: 'front', p: {yaw: 0}}, {label: '3/4', p: {yaw: 40}}]
      : page === 1 ? [{label: 'profile', p: {yaw: 90}}, {label: 'back 3/4', p: {yaw: 150}}]
        : [{label: 'back', p: {yaw: 180}}, {label: '3/4 left', p: {yaw: -45}}];
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: C.paper}}>
      {rows.map((row, ri) => (
        <g key={ri}>
          <text x={30} y={ri * 520 + 60} fontFamily={F.display} fontSize={34} fill={C.ink}>{row.label}</text>
          {names.map((n, i) => (
            <g key={n}>
              <Actor look={CAST[n]} t={t} seed={i + 1} x={220 + i * 370} y={ri * 520 + 500} s={0.98} face={{mouth: 'smile', lookX: 0, lookY: 0}} {...row.p} />
              <text x={220 + i * 370} y={ri * 520 + 520} textAnchor="middle" fontFamily={F.body} fontSize={22} fill={C.inkSoft}>{n}</text>
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
};
