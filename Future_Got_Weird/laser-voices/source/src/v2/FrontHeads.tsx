// Cast-sheet only: front views of the two Crew heads, redrawn from the 3/4 designs (not used in the film).
import React from 'react';
import {LEADC as L, SENDC as S, C} from './theme2';

export const LeadFront: React.FC = () => (
  <g>
    <ellipse cx={-205} cy={40} rx={34} ry={56} fill={L.skin} stroke={C.ink} strokeWidth={3.2} />
    <ellipse cx={205} cy={40} rx={34} ry={56} fill={L.skin} stroke={C.ink} strokeWidth={3.2} />
    <path d="M-200 -60 C-210 -260 210 -260 200 -60 C200 80 140 220 0 236 C-140 220 -200 80 -200 -60 Z" fill={L.skin} stroke={C.ink} strokeWidth={3.2} />
    <path d="M-236 -20 C-260 -200 -200 -300 -120 -330 L-90 -390 L-40 -336 L10 -400 L50 -334 L110 -380 L120 -310 L190 -330 L180 -260 C230 -200 236 -100 222 -20 C200 -120 150 -170 80 -190 C20 -150 -60 -150 -120 -180 C-170 -150 -200 -100 -236 -20 Z" fill={L.hair} stroke={C.ink} strokeWidth={3.2} strokeLinejoin="round" />
    {[-1, 1].map((k) => (
      <g key={k} transform={`translate(${k * 86} 20)`}>
        <path d="M-40 0 C-20 -30 20 -30 40 0 C20 22 -20 22 -40 0 Z" fill={L.sclera} stroke={L.lash} strokeWidth={4} />
        <circle cx={0} cy={0} r={17} fill={L.iris} /><circle cx={0} cy={0} r={8} fill="#120D0A" /><circle cx={-5} cy={-6} r={4} fill="#FFF" />
        <path d={`M-46 -54 C-20 -70 20 -70 46 -56`} fill="none" stroke={L.brow} strokeWidth={12} strokeLinecap="round" />
        <ellipse cx={k * 10} cy={64} rx={34} ry={16} fill={C.coral} opacity={0.3} />
      </g>
    ))}
    <path d="M-8 60 C-14 90 -10 104 6 106" fill="none" stroke={L.skinDeep} strokeWidth={3.4} strokeLinecap="round" />
    <path d="M-34 150 Q0 162 34 150" fill="none" stroke={L.lip} strokeWidth={5} strokeLinecap="round" />
  </g>
);
export const ClerkFront: React.FC = () => (
  <g>
    <ellipse cx={-200} cy={40} rx={32} ry={52} fill={S.skin} stroke={C.ink} strokeWidth={3.2} />
    <ellipse cx={200} cy={40} rx={32} ry={52} fill={S.skin} stroke={C.ink} strokeWidth={3.2} />
    <circle cx={-204} cy={102} r={11} fill={S.earring} stroke={C.ink} strokeWidth={2.5} />
    <circle cx={204} cy={102} r={11} fill={S.earring} stroke={C.ink} strokeWidth={2.5} />
    <circle cx={0} cy={-370} r={80} fill={S.hair} stroke={C.ink} strokeWidth={3} />
    <path d="M-196 -60 C-206 -250 206 -250 196 -60 C196 80 136 218 0 234 C-136 218 -196 80 -196 -60 Z" fill={S.skin} stroke={C.ink} strokeWidth={3.2} />
    <path d="M-206 -40 C-226 -250 -110 -320 0 -320 C110 -320 226 -250 206 -40 C190 -130 150 -190 0 -196 C-150 -190 -190 -130 -206 -40 Z" fill={S.hair} stroke={C.ink} strokeWidth={3} />
    {[-1, 1].map((k) => (
      <g key={k} transform={`translate(${k * 84} 10)`}>
        <path d="M-40 0 C-20 -30 20 -30 40 0 C20 20 -20 20 -40 0 Z" fill="#FBF8F1" stroke={C.ink} strokeWidth={3} />
        <circle cx={0} cy={0} r={13} fill="#3B2A20" /><circle cx={0} cy={0} r={6} fill="#0E0906" /><circle cx={-4} cy={-5} r={3.5} fill="#FFF" />
        <rect x={-58} y={-36} width={116} height={70} rx={14} fill="#FFF" fillOpacity={0.12} stroke={S.glasses} strokeWidth={6} />
        <path d="M-50 -60 C-20 -74 20 -74 50 -60" fill="none" stroke={S.hair} strokeWidth={11} strokeLinecap="round" />
      </g>
    ))}
    <path d="M-26 0 L26 0" stroke={S.glasses} strokeWidth={6} />
    <path d="M-8 60 C-14 92 -8 104 8 104" fill="none" stroke={S.skinShade} strokeWidth={3.4} strokeLinecap="round" />
    <path d="M-30 150 Q0 160 30 150" fill="none" stroke={S.lip} strokeWidth={5} strokeLinecap="round" />
  </g>
);
