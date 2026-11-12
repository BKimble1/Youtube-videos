import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {RobotWorld} from './RobotWorld';
import {SignalWorld} from './SignalWorld';
import {FPS, SEG} from './timing';
import {ss} from '../lib';
import {C, INK} from '../palette';

const W = 1080, H = 1920;
/** V2: picture only (no captions, labels, tags or graph panels). */
export const FilmV2: React.FC<{audio: string | false}> = ({audio}) => {
  const t = useCurrentFrame() / FPS;
  const showA = t < SEG.matchA1 || t >= SEG.wipe0;
  const showB = t >= SEG.matchA0 && t < SEG.wipe1;
  const bOp = t < SEG.matchA1 ? ss(SEG.matchA0, SEG.matchA1, t) : 1;
  // the air line passes the lens: the macro world above its centre line, the robot world below
  const wk = ss(SEG.wipe0, SEG.wipe1, t);
  const lineY = H + 380 - wk * (H + 760), tilt = -120;
  const wiping = t >= SEG.wipe0 && t < SEG.wipe1;
  return (
    <AbsoluteFill style={{background: '#0C171F'}}>
      {showA && <RobotWorld t={t} />}
      {showB && (
        <div style={{position: 'absolute', inset: 0, opacity: bOp,
          clipPath: wiping ? `polygon(0 0, ${W}px 0, ${W}px ${lineY + tilt / 2}px, 0 ${lineY - tilt / 2}px)` : undefined}}>
          <SignalWorld t={t} />
        </div>
      )}
      {wiping && (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs><filter id="fblur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="10" /></filter></defs>
          <g filter="url(#fblur)">
            <path d={`M-60 ${lineY - tilt / 2 + 60}L${W + 60} ${lineY + tilt / 2 + 60}`} stroke={INK} strokeWidth={330} opacity={0.9} />
            <path d={`M-60 ${lineY - tilt / 2 + 60}L${W + 60} ${lineY + tilt / 2 + 60}`} stroke={C.tube} strokeWidth={290} opacity={0.95} />
            <path d={`M-60 ${lineY - tilt / 2 + 10}L${W + 60} ${lineY + tilt / 2 + 10}`} stroke="#FFFFFF" strokeWidth={60} opacity={0.8} />
            {[0, 1, 2].map((k) => <circle key={k} cx={300 + k * 260 + wk * 200} cy={lineY + 60 - (300 + k * 260 + wk * 200 - W / 2) * (tilt / W)} r={80} fill="#FFFFFF" opacity={0.7} />)}
          </g>
        </svg>
      )}
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
