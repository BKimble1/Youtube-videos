import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F} from '../theme';
import {pop} from '../lib/anim';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const stroke = (w: number) => ({WebkitTextStroke: `${w}px ${C.ink}`, paintOrder: 'stroke fill' as const});

/** One attribution for the opening footage: legible, but smaller and quieter than the car and the caption. */
export const SourceChip4: React.FC<{until: number}> = ({until}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const o = interpolate(t, [until - 0.3, until], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', top: 150, left: 0, width: 1080, textAlign: 'center', opacity: o}}>
      <span style={{fontFamily: F.body, fontWeight: 800, fontSize: 31, color: C.ink, background: 'rgba(255,251,240,0.86)', border: `2px solid ${C.ink}`, borderRadius: 22, padding: '6px 20px'}}>
        Tesla reveal footage · Oct 15, 2026
      </span>
    </div>
  );
};

/**
 * 0–60, simplified. Over the stream's timed run (rec_225218, its timer stops at 01.00): one dominant block with
 * Tesla's claimed best (0.81 s, a separate run Tesla timed itself), and one secondary plate for the run shown.
 * The 0.81 never counts up in sync with the launch, so the shown run isn't presented as proof of the claim.
 */
export const ZeroSixty4: React.FC<{start: number; cues: {zero: number; num: number; shown: number}}> = ({start, cues}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = start + frame / fps;
  const head = interpolate(t, [cues.zero - 0.05, cues.zero + 0.12], [0, 1], clamp);
  const claim = pop(frame, fps, (cues.num - start) * fps, 16);
  const shown = interpolate(t, [cues.shown - 0.05, cues.shown + 0.12], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 900, background: 'linear-gradient(rgba(5,10,14,0.7), rgba(5,10,14,0.4) 65%, rgba(5,10,14,0))', opacity: head}} />
      <div style={{position: 'absolute', top: 230, width: 1080, textAlign: 'center', opacity: head}}>
        <span style={{fontFamily: F.display, fontWeight: 700, fontSize: 64, color: C.cream, letterSpacing: 2, ...stroke(10)}}>0–60 MPH</span>
      </div>
      <div style={{position: 'absolute', top: 330, width: 1080, textAlign: 'center', opacity: Math.min(1, claim * 1.5), transform: `scale(${0.85 + 0.15 * claim})`}}>
        <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 50, color: C.cream, letterSpacing: 1, ...stroke(9)}}>Tesla's claimed best</div>
        <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 230, lineHeight: 1.0, color: C.saffron, ...stroke(16)}}>
          0.81<span style={{fontSize: 110}}> s</span>
        </div>
      </div>
      <div style={{position: 'absolute', top: 690, width: 1080, textAlign: 'center', opacity: shown}}>
        <span style={{fontFamily: F.body, fontWeight: 800, fontSize: 46, color: C.cream, background: 'rgba(5,10,14,0.8)', border: `3px solid ${C.cream}`, borderRadius: 24, padding: '6px 24px'}}>
          Shown run: 1.00 s
        </span>
      </div>
    </AbsoluteFill>
  );
};
