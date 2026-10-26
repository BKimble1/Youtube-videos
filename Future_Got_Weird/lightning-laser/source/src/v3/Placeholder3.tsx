import React from 'react';
export const Placeholder3: React.FC<{label: string}> = ({label}) => (
  <g>
    <rect x={0} y={0} width={1080} height={1920} fill="#1A2430" />
    <text x={540} y={960} fill="#FFF" fontSize={90} textAnchor="middle">{label}</text>
  </g>
);
