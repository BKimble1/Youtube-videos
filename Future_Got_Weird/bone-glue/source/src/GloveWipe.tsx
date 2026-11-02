// The loop's foreground wipe: the surgeon's gowned forearm and gloved hand sweep down across the lens (very near the
// camera, so large and a little soft). The sleeve covers the frame for a few frames; the timeline resets behind it,
// and it has left the frame entirely by the last frame, so the last frame flows straight into frame 0.
import React from 'react';
import {Hand, HandPose} from './dc/Hand';
import {Inked, INK} from './dc/ink';
import {mix} from './core/color';
import {C} from './art/palette';
import {ss} from './lib';

const POSE: HandPose = {curl: [0.3, 0.34, 0.38, 0.42], spread: 0.3, thumb: 26, thumbCurl: 0.35};

export const GloveWipe: React.FC<{u: number; fkey: string}> = ({u, fkey}) => {
  if (u <= 0 || u >= 1) return null;
  // the band's centre sweeps from above the frame to below it; it grows a little as it passes nearest the lens
  const yc = -1500 + 4900 * ss(u, 0, 1) * 0.15 + 4900 * u * 0.85;
  const sc = 1.25 + 0.38 * Math.sin(Math.PI * u);
  const tilt = -16 + 8 * u; // the gloved hand (screen left) leads down into the frame
  const H = 1750; // sleeve thickness (local units)
  const sleeve = `M-200 ${-H / 2}C200 ${-H / 2 - 60} 1400 ${-H / 2 - 40} 2600 ${-H / 2 + 20}L2600 ${H / 2 - 20}C1400 ${H / 2 + 40} 200 ${H / 2 + 60} -200 ${H / 2}Z`;
  const cuff = `M-360 ${-H * 0.3}C-300 ${-H * 0.36} -180 ${-H * 0.38} -100 ${-H * 0.34}L-60 ${H * 0.34}C-160 ${H * 0.39} -300 ${H * 0.36} -360 ${H * 0.3}Z`;
  const gid = `${fkey}gw-sl`;
  return (
    <div style={{position: 'absolute', inset: 0, filter: 'blur(3.5px)'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset={0} stopColor={mix(C.gown, '#FFFFFF', 0.28)} />
            <stop offset={0.35} stopColor={C.gown} />
            <stop offset={0.8} stopColor={C.gownDeep} />
            <stop offset={1} stopColor={mix(C.gownDeep, '#0B1A33', 0.35)} />
          </linearGradient>
        </defs>
        <g transform={`translate(540 ${yc.toFixed(1)}) rotate(${tilt.toFixed(2)}) scale(${sc.toFixed(4)})`}>
          <Inked w={26}>
            <path d={sleeve} fill={`url(#${gid})`} />
            <Hand id={`${fkey}gw-h`} wrist={{x: -300, y: 0}} ang={188} L={1250} thumbSide={1} view="back" pose={POSE} color={C.glove} sheen={0.3} />
            <path d={cuff} fill={mix(C.glove, '#FFFFFF', 0.12)} />
          </Inked>
          {/* gown folds */}
          {[-0.28, 0.02, 0.3].map((f, i) => (
            <path key={i} d={`M${300 + i * 380} ${H * f - 200}C${600 + i * 380} ${H * f - 60} ${900 + i * 380} ${H * f + 80} ${1300 + i * 380} ${H * f + 160}`} stroke={INK} strokeWidth={14} fill="none" opacity={0.35} strokeLinecap="round" />
          ))}
        </g>
      </svg>
    </div>
  );
};
