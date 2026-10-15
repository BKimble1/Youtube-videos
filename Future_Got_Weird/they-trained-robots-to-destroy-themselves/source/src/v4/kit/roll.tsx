// A paper roll that sweeps across the frame (foreground occluder): the world behind it changes where it has passed.
// The roll is wide enough to cover the boundary completely, so no seam and no doubled robot is ever visible.
import React from 'react';
import {easeInOut} from './scene';

/** Screen x of the roll's centre for progress k (0..1); dir -1 = right→left. */
export const rollX = (k: number, dir: -1 | 1 = -1) => {
  const e = easeInOut(k);
  return dir < 0 ? 2160 - e * 2400 : -240 + e * 2400;
};

/** Render: `before` where the roll has not passed yet, `after` where it has, and the roll on top. */
export const RollWipe: React.FC<{k: number; dir?: -1 | 1; before: React.ReactNode; after: React.ReactNode; tone?: 'blueprint' | 'steel'}> = ({k, dir = -1, before, after, tone = 'blueprint'}) => {
  if (k <= 0) return <>{before}</>;
  if (k >= 1) return <>{after}</>;
  const x = rollX(k, dir);
  const W = 230;
  const afterClip = dir < 0 ? `polygon(${x}px 0, 1920px 0, 1920px 1080px, ${x}px 1080px)` : `polygon(0 0, ${x}px 0, ${x}px 1080px, 0 1080px)`;
  const beforeClip = dir < 0 ? `polygon(0 0, ${x}px 0, ${x}px 1080px, 0 1080px)` : `polygon(${x}px 0, 1920px 0, 1920px 1080px, ${x}px 1080px)`;
  const face = tone === 'blueprint' ? ['#3A5FA0', '#5B83C7', '#2C4A80'] : ['#5A4A48', '#7A6662', '#3A2E2D'];
  return (
    <>
      <div style={{position: 'absolute', inset: 0, clipPath: beforeClip}}>{before}</div>
      <div style={{position: 'absolute', inset: 0, clipPath: afterClip}}>{after}</div>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="rollG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={face[2]} /><stop offset="0.35" stopColor={face[1]} /><stop offset="0.6" stopColor={face[0]} /><stop offset="1" stopColor={face[2]} />
          </linearGradient>
        </defs>
        <rect x={x - W / 2} y={-40} width={W} height={1160} rx={W / 2} fill="url(#rollG)" stroke="#162A32" strokeWidth={6} />
        {Array.from({length: 9}, (_, i) => <line key={i} x1={x - W / 2 + 14} y1={i * 130 + 30} x2={x + W / 2 - 14} y2={i * 130 + 30} stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={3} />)}
        <rect x={x - W / 2 + 26} y={-40} width={18} height={1160} fill="#FFFFFF" opacity={0.18} />
      </svg>
    </>
  );
};
