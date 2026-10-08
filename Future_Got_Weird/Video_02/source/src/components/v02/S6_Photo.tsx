import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {CAST} from '../cast';
import {Character2, EXPR, phaseFromDistance, walkPose, withPose} from './Cast2';

/**
 * S6.5 photo gag: a long-exposure snapshot of the guesser walking across a room, which comes out as a smear of
 * overlapping see-through copies. A cream instant-photo card (HTML, screen px), centred on (x, y), rotated `rot` deg,
 * popping in with `t` (0..1, may overshoot). The copies are the Cast2 rig in a walk, placed so their planted feet
 * follow the gait (the copies are snapshots of one walk, not a crowd).
 */
export const PHOTO = {w: 440, h: 520, pad: 24, capH: 108};

export const LongExposurePhoto: React.FC<{x: number; y: number; rot?: number; t: number; frame: number}> = ({x, y, rot = -4, t, frame}) => {
  if (t <= 0) return null;
  const {w, h, pad, capH} = PHOTO;
  const pw = w - pad * 2;
  const ph = h - pad - capH;
  const floorY = ph * 0.86;
  const scale = 0.5;
  const n = 7;
  const gap = 36;
  const x0 = 80;
  const copies = Array.from({length: n}, (_, i) => {
    const d = i * gap;
    const pose = withPose(walkPose(phaseFromDistance(d, scale, 'walk'), {style: 'walk', dir: 1}), {...EXPR.smug, lookX: 0.45, mouth: 'smirk'});
    return {i, x: x0 + d, pose};
  });
  const s = 0.86 + 0.14 * t;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        transform: `rotate(${rot}deg) scale(${s})`,
        transformOrigin: '50% 50%',
        opacity: Math.min(1, t * 1.8),
      }}
    >
      <div style={{position: 'absolute', left: 12, top: 14, width: w, height: h, borderRadius: 10, background: C.shadow}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, borderRadius: 10, background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, boxSizing: 'border-box'}} />
      <div style={{position: 'absolute', left: pad, top: pad, width: pw, height: ph, overflow: 'hidden', borderRadius: 4, border: `3px solid ${C.ink}`, boxSizing: 'border-box', background: '#F5E4C6'}}>
        <div style={{position: 'absolute', left: 0, top: floorY, width: pw, height: ph - floorY, background: C.woodLight, borderTop: `3px solid ${C.ink}`}} />
        {copies.map((c) => (
          <Character2 key={c.i} look={CAST.guesser} pose={c.pose} frame={frame} seed={11} life={0} x={c.x} y={floorY + 4} scale={scale} shadow={c.i === n - 1} style={{opacity: 0.3}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, top: h - capH + 4, width: w, textAlign: 'center', fontFamily: F.display, fontWeight: 600, fontSize: 40, color: C.inkSoft, lineHeight: `${capH - 30}px`}}>
        long exposure
      </div>
    </div>
  );
};

