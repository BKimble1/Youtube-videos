// The CTA: a distinct next question the long video answers (the upside-down part is fan suction, not the jets).
//   Inverted  "It also drives": Tesla's aerial of the second run driving along the underside of the ramp (rec_224730
//             2:16.60-2:17.45, after the broadcast's dissolve and before any exhaust shows near the car). The crop
//             follows the car with a slight push-in; the broadcast bug stays out of frame.
//   Hang      "upside down. Tap the linked breakdown.": the first run's hang, close-up from below (rec_224730 1:17.50 up
//             to Tesla's cut at 1:19.90). Shown whole (the car is wider than a 9:16 crop): scaled 1.08x into a band
//             across the frame with soft fades to black, so the reveal's on-screen gauges (downforce, pitch, altitude
//             figures) at the bottom corners are out of frame.
//   Cue       one short text cue, "How it drives upside down", near the top (below the Shorts controls); it clears
//             0.4 s before the last frame. The clickable link itself is the Short's Related Video (upload notes).
import React from 'react';
import {AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {DURATION, FPS, HANG_FILE0, HANG_SRC, HANG_T, INV_FILE0, INV_SRC, INV_T, T} from './data';

const W = 1080, H = 1920;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Inverted: React.FC = () => {
  const frame = useCurrentFrame();
  const u = frame / FPS / (HANG_T - INV_T);
  // the car stays near source (1120, 482) through this stretch (measured at 2:16.75, 2:17.05, 2:17.35)
  const S = (H / 1080) * (1.1 + 0.1 * u);
  const vw = 1920 * S, vh = 1080 * S;
  const left = Math.min(0, Math.max(W - vw, W / 2 - (1122 / 1920) * vw));
  const top = Math.min(0, Math.max(H - vh, H * 0.46 - (482 / 1080) * vh));
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <OffthreadVideo src={staticFile('footage/rk_inv.mp4')} trimBefore={Math.round((INV_SRC - INV_FILE0) * FPS)} muted
        style={{position: 'absolute', left, top, width: vw, height: vh}} />
    </AbsoluteFill>
  );
};

const HANG = {s: 1.08, x0: 420, top: 242};          // source x 420-1420 across the frame; source y 0 at output y 242
export const Hang: React.FC = () => {
  const vw = 1920 * HANG.s, vh = 1080 * HANG.s;
  const fadeA = HANG.top, fadeB = HANG.top + 150, fadeC = 1040, fadeD = 1180;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <OffthreadVideo src={staticFile('footage/rk_hang.mp4')} trimBefore={Math.round((HANG_SRC - HANG_FILE0) * FPS)} muted
        style={{position: 'absolute', left: -HANG.x0 * HANG.s, top: HANG.top, width: vw, height: vh}} />
      <AbsoluteFill style={{background: `linear-gradient(180deg, #000 0px, #000 ${fadeA}px, rgba(0,0,0,0) ${fadeB}px, rgba(0,0,0,0) ${fadeC}px, #000 ${fadeD}px, #000 100%)`}} />
    </AbsoluteFill>
  );
};

export const CtaCue: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const o = interpolate(t, [T.upside - 0.05, T.upside + 0.2, DURATION - 0.62, DURATION - 0.4], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 236, width: W, textAlign: 'center', opacity: o, transform: `translateY(${(1 - o) * -10}px)`}}>
        <span style={{display: 'inline-block', fontFamily: F.display, fontWeight: 700, fontSize: 54, letterSpacing: 0.5, color: C.cream, background: 'rgba(10,16,20,0.72)', border: `3px solid ${C.saffron}`, borderRadius: 22, padding: '8px 26px'}}>
          How it drives upside down
        </span>
      </div>
    </AbsoluteFill>
  );
};
