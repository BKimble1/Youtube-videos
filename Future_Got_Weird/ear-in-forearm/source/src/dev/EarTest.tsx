import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EarHeight, Relief} from '../world/ear';

// relief check: the same ear under skin at several zooms (props z: zoom per panel)
export const EarTest: React.FC<{z: number[]; blur: number; depth: number}> = ({z, blur, depth}) => (
  <AbsoluteFill style={{backgroundColor: '#24363E'}}>
    <svg width={1080} height={1920}>
      {z.map((k, i) => {
        const cx = 270 + (i % 2) * 540, cy = 480 + Math.floor(i / 2) * 960;
        return (
          <g key={i} transform={`translate(${cx} ${cy}) scale(${k})`}>
            <rect x={-48} y={-150} width={96} height={300} rx={40} fill="#C99271" />
            <Relief id={`r${i}`} x={-60} y={-70} w={120} h={140} px={k} depth={depth} blur={blur}>
              <EarHeight p={{}} />
            </Relief>
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);
