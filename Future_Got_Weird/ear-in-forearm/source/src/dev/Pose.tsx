import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Torso, UpperArm, ForearmSkin, Hand, Head, EarSiteScar, FIG} from '../world/woman';
import {EarHeight, Relief} from '../world/ear';

// figure check: panels of [x, y, zoom, turn]
export const Pose: React.FC<{v: [number, number, number, number][]}> = ({v}) => {
  const n = v.length, cols = n > 1 ? 2 : 1, k = 1 / cols;
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {v.map(([x, y, z, turn], i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <svg width={1080} height={1920} style={{background: 'radial-gradient(circle at 60% 35%, #5D838E, #2C4650 60%, #16252B)'}}>
            <g transform={`translate(540 960) scale(${z}) translate(${-x} ${-y})`}>
              <Torso ow={1.6} />
              <Head ow={1.6} site={<EarSiteScar />} />
              <UpperArm ow={1.6} />
              <ForearmSkin ow={1.6} turn={turn} hair={Math.min(1, Math.max(0, (z - 2.5) / 3))}>
                <g transform={`translate(${FIG.armEar.x + Math.sin(turn) * 30} ${FIG.armEar.y}) scale(${Math.cos(turn)} 1)`}>
                  <Relief id={`p${i}`} x={-70} y={-200} w={140} h={420} px={z} depth={2.2} blur={2.6} tex={0.02 * Math.min(1, Math.max(0, (z - 2.5) / 3))}>
                    <EarHeight p={{}} />
                  </Relief>
                </g>
              </ForearmSkin>
              <Hand ow={1.6} turn={turn} />
            </g>
          </svg>
        </div>
      ))}
    </AbsoluteFill>
  );
};
