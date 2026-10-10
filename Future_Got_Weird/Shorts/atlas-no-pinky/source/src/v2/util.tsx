import React from 'react';
import {Character, IDLE, Pose} from '../components/Character';
import {CAST} from '../components/cast';
import {C, OUTLINE} from '../film/common';
import {V} from '../hand/Hand';

/** Guide character placed anywhere (the rig draws itself with CSS offsets, so wrap it in a translated group). */
export const GuideAt: React.FC<{g: number; x: number; y: number; scale: number; pose: Pose; flip?: boolean}> = ({g, x, y, scale, pose, flip}) => (
  <g transform={`translate(${x - 200 * scale} ${y - 500 * scale})`}>
    <Character look={CAST.checker} pose={pose} frame={g} seed={5} x={200 * scale} y={500 * scale} scale={scale} flip={flip} shadow={false} />
  </g>
);

export const basePose = (over: Partial<Pose> = {}): Pose => ({...IDLE, mouth: 'flat', brows: 0.15, ...over});

/** The guide's sleeved arm seen from above: coral cardigan sleeve + cuff + mitt (same palette/skin as the rig). */
export const GuideArm: React.FC<{from: V; to: V; w?: number; mitt?: boolean; children?: React.ReactNode}> = ({from, to, w = 84, mitt = true, children}) => {
  const dx = to.x - from.x, dy = to.y - from.y;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const len = Math.hypot(dx, dy);
  const cuffAt = Math.max(0, len - 70);
  return (
    <g>
      <g transform={`translate(${from.x} ${from.y}) rotate(${ang})`}>
        <rect x={0} y={-w / 2} width={len - 30} height={w} rx={w / 2} fill={C.ink} />
        <rect x={OUTLINE} y={-w / 2 + OUTLINE} width={len - 30 - OUTLINE * 2} height={w - OUTLINE * 2} rx={w / 2 - OUTLINE} fill={C.coral} />
        <rect x={cuffAt - 6} y={-w / 2 + 2} width={26} height={w - 4} rx={8} fill={C.cream} stroke={C.ink} strokeWidth={4} />
        <rect x={20} y={-w / 2 + 14} width={Math.max(0, cuffAt - 40)} height={9} rx={4} fill="#FFFFFF" opacity={0.28} />
      </g>
      {mitt && (
        <g transform={`translate(${to.x} ${to.y}) rotate(${ang})`}>
          <ellipse cx={-6} cy={0} rx={44} ry={40} fill={CAST.checker.skin} stroke={C.ink} strokeWidth={OUTLINE} />
          <ellipse cx={-26} cy={-38} rx={26} ry={18} fill={CAST.checker.skin} stroke={C.ink} strokeWidth={OUTLINE} transform="rotate(-24 -26 -38)" />
        </g>
      )}
      {children}
    </g>
  );
};
