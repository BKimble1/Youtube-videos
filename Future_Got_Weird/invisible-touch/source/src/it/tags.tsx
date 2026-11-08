// Small explanatory tags (screen-readable at phone size): a rounded pill, used sparingly to mark what is a concept
// and what is the mechanism.
import React from 'react';

export const Conceptag: React.FC<{x: number; y: number; label: string; s?: number; color?: string; anchor?: 'start' | 'middle'}> = ({x, y, label, s = 1, color = '#E7F2FF', anchor = 'start'}) => {
  const w = label.length * 11.5 + 22;
  const x0 = anchor === 'middle' ? -w / 2 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={x0} y={-15} width={w} height={30} rx={15} fill="#0B1E2B" opacity={0.72} stroke={color} strokeWidth={2} />
      <text x={x0 + w / 2} y={6} textAnchor="middle" fontFamily="Nunito Variable, sans-serif" fontWeight={900} fontSize={17} letterSpacing="0.08em" fill={color}>{label}</text>
    </g>
  );
};
