import React from 'react';

/** the channel's caption treatment as SVG text: Nunito Black, white with a dark stroke, emphasis in yellow */
export const CapText: React.FC<{x: number; y: number; size: number; parts: [string, boolean][]; anchor?: 'middle' | 'start'}> = ({x, y, size, parts, anchor = 'middle'}) => (
  <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontFamily='"Nunito Variable", Nunito, sans-serif' fontWeight={900} fontSize={size}
    stroke="rgba(6,9,14,0.94)" strokeWidth={size * 0.15} paintOrder="stroke fill" strokeLinejoin="round" style={{filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.55))'}}>
    {parts.map(([s, hi], k) => <tspan key={k} fill={hi ? '#FFD84A' : '#FFFFFF'}>{s}</tspan>)}
  </text>
);
