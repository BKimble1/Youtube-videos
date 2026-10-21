// V2 shot list → frames. A shot renders a full frame over [a, b); its transition-in overlaps the outgoing shot.
// 'column' is the tower-column wipe: a dark lattice column crosses the frame and the new shot is revealed behind it.
import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {clamp, prog, smoother} from '../kit/anim';

export type Tin = 'cut' | 'fade' | 'dip' | 'column' | 'columnL' | 'flash';
export type Shot = {id: string; a: number; b: number; render: (t: number) => React.ReactNode; tin?: Tin; td?: number};

const TD: Record<Tin, number> = {cut: 0, fade: 0.5, dip: 0.7, column: 0.42, columnL: 0.42, flash: 0.22};

const Column: React.FC<{u: number; dir: 1 | -1}> = ({u, dir}) => {
  const W = 230;
  const x = dir === 1 ? -W + u * (1920 + 2 * W) - W / 2 : 1920 + W - u * (1920 + 2 * W) - W / 2;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(${x} 0)`}>
        <rect x={0} y={-10} width={W} height={1100} fill="#151a20" />
        {Array.from({length: 16}, (_, i) => (
          <g key={i} stroke="#2d3540" strokeWidth={9}>
            <line x1={0} y1={i * 72} x2={W} y2={i * 72 + 72} />
            <line x1={W} y1={i * 72} x2={0} y2={i * 72 + 72} />
          </g>
        ))}
        <rect x={0} y={-10} width={16} height={1100} fill="#0b0e12" />
        <rect x={W - 16} y={-10} width={16} height={1100} fill="#0b0e12" />
      </g>
    </svg>
  );
};

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
        <AbsoluteFill style={{background: '#fff6e6', opacity: o * 0.7}} />
      </AbsoluteFill>
    );
  }
  // column wipe: new shot revealed on the trailing side of the moving column
  const dir: 1 | -1 = tin === 'column' ? 1 : -1;
  const W = 230;
  const cx = dir === 1 ? -W + k * (1920 + 2 * W) : 1920 + W - k * (1920 + 2 * W);
  const clipCur = dir === 1 ? `inset(0 ${Math.max(0, 1920 - cx)}px 0 0)` : `inset(0 0 0 ${Math.max(0, cx)}px)`;
  return (
    <AbsoluteFill>
      <AbsoluteFill>{prev.render(t)}</AbsoluteFill>
      <AbsoluteFill style={{clipPath: clipCur}}>{cur.render(t)}</AbsoluteFill>
      <Column u={k} dir={dir} />
    </AbsoluteFill>
  );
};

/** Real footage: plays the source from `src0` seconds, starting at film time `a`. Crop = scale about (cx, cy) in 0..1. */
export const Footage: React.FC<{
  file: string; a: number; src0: number; scale?: number; cx?: number; cy?: number; dx?: number; dy?: number; grade?: string; children?: React.ReactNode;
}> = ({file, a, src0, scale = 1, cx = 0.5, cy = 0.5, dx = 0, dy = 0, grade = 'contrast(1.04) saturate(0.96)', children}) => (
  <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
    <Sequence from={Math.round(a * 30)} layout="none">
      <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(${scale})`, transformOrigin: `${cx * 100}% ${cy * 100}%`, filter: grade}}>
        <OffthreadVideo src={staticFile(`media/real/${file}`)} startFrom={Math.round(src0 * 30)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
    </Sequence>
    {children}
  </AbsoluteFill>
);

export const F5 = '01_Flight5_BoosterCatch.mp4';
export const F14R = '02_Flight14_Reentry_4K.mp4';
/** The Flight 14 ocean-return excerpt. Not supplied yet: the ocean-return beat uses original animation until it is. */
export const F14O = '03_Flight14_OceanReturn_4K.mp4';
export const HAS_OCEAN_CLIP = false;
