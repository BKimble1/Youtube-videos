import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {H, W} from '../film/common';
import {OpenerHud, OpenerWorld, PinchSpec} from './opener';

/** dev-only: renders the opener function at t = frame - 22 (frames 0..21 are the loop pre-roll); frame >= 200 shows the pinch variant grid at t = 0. */
const VARIANTS: PinchSpec[] = [
  {gx: -170, gy: -12, r: 52, phiI: -62, phiT: 128},
  {gx: -176, gy: -20, r: 52, phiI: -70, phiT: 150},
  {gx: -168, gy: 0, r: 56, phiI: -40, phiT: 120},
  {gx: -160, gy: -30, r: 56, phiI: -80, phiT: 100},
  {gx: -182, gy: -16, r: 56, phiI: -55, phiT: 165},
  {gx: -150, gy: -4, r: 50, phiI: -90, phiT: 90},
];
export const Probe3: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= 200) {
    return (
      <AbsoluteFill>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {VARIANTS.map((v, i) => (
            <g key={i} transform={`translate(${(i % 3) * 360} ${Math.floor(i / 3) * 640}) scale(0.333)`}>
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                <OpenerWorld t={0} spec={v} />
              </svg>
            </g>
          ))}
        </svg>
      </AbsoluteFill>
    );
  }
  const t = f - 22;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <OpenerWorld t={t} />
        <OpenerHud t={t} />
      </svg>
    </AbsoluteFill>
  );
};
