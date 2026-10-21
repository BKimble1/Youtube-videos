// Shot list → frames. Each shot renders a full frame for its window; transitions overlap the outgoing shot.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, prog, smoother} from './anim';

export type Tin = 'cut' | 'fade' | 'whipL' | 'whipR' | 'whipU' | 'flash' | 'dip';
export type Shot = {id: string; a: number; b: number; render: (t: number) => React.ReactNode; tin?: Tin; td?: number};

const TD: Record<Tin, number> = {cut: 0, fade: 0.45, whipL: 0.32, whipR: 0.32, whipU: 0.36, flash: 0.25, dip: 0.6};

/** Render the shot(s) active at time t. A shot with a transition-in overlaps the previous shot for td seconds. */
export const Timeline: React.FC<{shots: Shot[]; t: number}> = ({shots, t}) => {
  const i = shots.findIndex((s, k) => t >= s.a && (t < s.b || k === shots.length - 1));
  if (i < 0) return null;
  const cur = shots[i];
  const tin = cur.tin ?? 'cut';
  const td = cur.td ?? TD[tin];
  const u = td > 0 ? clamp((t - cur.a) / td) : 1;
  const prev = i > 0 ? shots[i - 1] : null;
  if (!prev || u >= 1 || tin === 'cut') return <AbsoluteFill>{cur.render(t)}</AbsoluteFill>;
  const k = smoother(u);
  if (tin === 'fade') {
    return (
      <AbsoluteFill>
        <AbsoluteFill>{prev.render(t)}</AbsoluteFill>
        <AbsoluteFill style={{opacity: k}}>{cur.render(t)}</AbsoluteFill>
      </AbsoluteFill>
    );
  }
  if (tin === 'dip') {
    const o = u < 0.5 ? prog(u, 0, 0.5) : 1 - prog(u, 0.5, 1);
    return (
      <AbsoluteFill>
        <AbsoluteFill>{u < 0.5 ? prev.render(t) : cur.render(t)}</AbsoluteFill>
        <AbsoluteFill style={{background: '#05070a', opacity: o}} />
      </AbsoluteFill>
    );
  }
  if (tin === 'flash') {
    const o = 1 - Math.abs(u * 2 - 1);
    return (
      <AbsoluteFill>
        <AbsoluteFill>{u < 0.5 ? prev.render(t) : cur.render(t)}</AbsoluteFill>
        <AbsoluteFill style={{background: '#fff6e6', opacity: o * 0.85}} />
      </AbsoluteFill>
    );
  }
  // whips: both frames slide with a directional blur
  const dir = tin === 'whipL' ? [-1, 0] : tin === 'whipR' ? [1, 0] : [0, 1];
  const W = dir[0] !== 0 ? 1920 : 1080;
  const blur = Math.sin(u * Math.PI) * 18;
  const off = k * W;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${dir[0] * off}px, ${dir[1] * off}px)`, filter: `blur(${blur}px)`}}>{prev.render(t)}</AbsoluteFill>
      <AbsoluteFill style={{transform: `translate(${dir[0] * (off - W)}px, ${dir[1] * (off - W)}px)`, filter: `blur(${blur}px)`}}>{cur.render(t)}</AbsoluteFill>
    </AbsoluteFill>
  );
};
