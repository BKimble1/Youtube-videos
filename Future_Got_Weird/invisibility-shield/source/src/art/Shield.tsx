// The shield: one rigid, flat, clear lens-array panel (vertical lens ridges), held by two upright grips on its back.
// The optical treatment is confined to the panel's outline and built from the real scene layers:
//   1. the same wall, redrawn with a strong horizontal-only blur and a slight horizontal magnification about the panel
//      centre (vertical lenses spread light sideways: horizontal joints and painted bands survive, vertical plank ends,
//      the pipe and the socket smear out);
//   2. the person (and the grips) redrawn with a much wider horizontal blur at low opacity: the residual subject light
//      that the lenses spread sideways. It rises while the panel moves and when the viewer is off-axis;
//   3. an optional, lightly blurred silhouette ("ghost") for the off-axis view;
//   4. the lens ridges, a faint cool lift, the bevelled rim and a sliding glint, so the panel stays perceptible.
// Nothing outside the panel's outline is altered: exposed parts of the person render normally.
import React from 'react';
import {clamp, fmt, inv} from '../lib/math';
import {SoftShadow} from '../lib/shade';
import {GROUND, PANEL, PanelState, RIDGE} from '../world';

export const panelRect = (p: PanelState) => ({x: p.cx - PANEL.w / 2, y: p.top, w: PANEL.w, h: PANEL.h});

export const PanelOptics: React.FC<{
  id: string;
  p: PanelState;
  wall: React.ReactNode;
  figure: React.ReactNode;
  ghostFig?: React.ReactNode;
  resid: number;
  ghost: number;
  ridgeK: number; // lens ridge visibility (grows with zoom)
  smear?: number; // horizontal blur radius (world px)
  children?: React.ReactNode; // diagram overlays inside the panel
}> = ({id, p, wall, figure, ghostFig, resid, ghost, ridgeK, smear = 34, children}) => {
  const r = panelRect(p);
  const pad = 260;
  const fr = {x: r.x - pad, y: r.y - 6, w: r.w + 2 * pad, h: r.h + 12};
  const ridgeA = clamp(ridgeK);
  return (
    <g>
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect x={fmt(r.x)} y={fmt(r.y)} width={r.w} height={r.h} rx={PANEL.r} />
        </clipPath>
        <filter id={`${id}-hb`} filterUnits="userSpaceOnUse" x={fmt(fr.x)} y={fmt(fr.y)} width={fmt(fr.w)} height={fmt(fr.h)} colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${fmt(smear)} 0`} />
        </filter>
        <filter id={`${id}-hb2`} filterUnits="userSpaceOnUse" x={fmt(fr.x)} y={fmt(fr.y)} width={fmt(fr.w)} height={fmt(fr.h)} colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="92 1.5" />
        </filter>
        <filter id={`${id}-gh`} filterUnits="userSpaceOnUse" x={fmt(fr.x)} y={fmt(fr.y)} width={fmt(fr.w)} height={fmt(fr.h)} colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="24 3" />
        </filter>
        {/* one lens: a narrow vertical cylinder, lit from the upper left */}
        <pattern id={`${id}-rdg`} patternUnits="userSpaceOnUse" x={fmt(r.x)} y={0} width={RIDGE} height={40}>
          <rect x={0} y={0} width={RIDGE} height={40} fill={`url(#${id}-rg)`} />
        </pattern>
        <linearGradient id={`${id}-rg`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3A3020" stopOpacity={0.12} />
          <stop offset="0.16" stopColor="#FFFFFF" stopOpacity={0.45} />
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0.12} />
          <stop offset="0.75" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="1" stopColor="#3A3020" stopOpacity={0.16} />
        </linearGradient>
        <linearGradient id={`${id}-glint`} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5C8A96" stopOpacity={0.28} />
          <stop offset="0.035" stopColor="#5C8A96" stopOpacity={0} />
          <stop offset="0.965" stopColor="#5C8A96" stopOpacity={0} />
          <stop offset="1" stopColor="#2E5560" stopOpacity={0.36} />
        </linearGradient>
      </defs>
      {/* contact shadow on the floor when the panel is carried low */}
      {(() => {
        const gap = GROUND - (r.y + r.h);
        const a = 0.34 * clamp(1 - gap / 140);
        return a > 0.01 ? <SoftShadow id={`${id}-cs`} c={{x: p.cx + 10, y: GROUND + 6}} rx={r.w * 0.62} ry={16} alpha={a} color="#3A2A1C" /> : null;
      })()}
      <g clipPath={`url(#${id}-clip)`}>
        {/* 1. the background seen through the lenses: horizontally smeared and slightly magnified about the centre */}
        <g filter={`url(#${id}-hb)`}>
          <g transform={`translate(${fmt(p.cx)} 0) scale(1.08 1) translate(${fmt(-p.cx)} 0)`}>{wall}</g>
        </g>
        {/* 2. residual light from the person, spread sideways */}
        {resid > 0.003 && (
          <g filter={`url(#${id}-hb2)`} opacity={fmt(clamp(resid))}>
            {figure}
          </g>
        )}
        {/* 3. a faint outline when seen from off the frontal line */}
        {ghost > 0.003 && ghostFig && (
          <g filter={`url(#${id}-gh)`} opacity={fmt(clamp(ghost))}>
            {ghostFig}
          </g>
        )}
        {/* 4. the panel itself: a faint cool lift, the lens ridges, a sliding glint, thickness at the side edges */}
        <rect x={fmt(r.x)} y={fmt(r.y)} width={r.w} height={r.h} fill="#E6F4F6" opacity={fmt(0.06 * ridgeA)} />
        <rect x={fmt(r.x)} y={fmt(r.y)} width={r.w} height={r.h} fill={`url(#${id}-rdg)`} opacity={fmt(0.09 + 0.91 * ridgeA)} />
        {(() => {
          // the glint is fixed relative to the key light: it slides across the panel as the panel moves
          const gx = r.x - 260 + ((p.cx * 0.9 + p.top * 0.7) % 1400) * 0.66;
          return <rect x={fmt(gx)} y={fmt(r.y - 40)} width={150} height={r.h + 80} fill={`url(#${id}-glint)`} opacity={0.22} transform={`translate(${fmt(gx)} ${fmt(r.y)}) skewX(-14) translate(${fmt(-gx)} ${fmt(-r.y)})`} />;
        })()}
        <rect x={fmt(r.x)} y={fmt(r.y)} width={r.w} height={r.h} fill={`url(#${id}-edge)`} />
        {children}
      </g>
      {/* rim: bevelled polycarbonate edge */}
      <rect x={fmt(r.x + 1.5)} y={fmt(r.y + 1.5)} width={r.w - 3} height={r.h - 3} rx={PANEL.r - 1} fill="none" stroke="#FFFFFF" strokeWidth={4.5} opacity={0.85} />
      <rect x={fmt(r.x + 6)} y={fmt(r.y + 6)} width={r.w - 12} height={r.h - 12} rx={PANEL.r - 4} fill="none" stroke="#7FB3BE" strokeWidth={2} opacity={0.55} />
      <rect x={fmt(r.x)} y={fmt(r.y)} width={r.w} height={r.h} rx={PANEL.r} fill="none" stroke="#24434E" strokeWidth={2.8} opacity={0.85} />
      {/* top-left catchlight on the bevel */}
      <path d={`M${fmt(r.x + 4)},${fmt(r.y + 120)} L${fmt(r.x + 4)},${fmt(r.y + PANEL.r)} Q${fmt(r.x + 4)},${fmt(r.y + 4)} ${fmt(r.x + PANEL.r)},${fmt(r.y + 4)} L${fmt(r.x + 140)},${fmt(r.y + 4)}`} fill="none" stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" />
    </g>
  );
};

// the grips on the panel's back (drawn as part of the hidden scene: seen only through the lenses, as residual light)
export const Grips: React.FC<{p: PanelState}> = ({p}) => (
  <g>
    {[-1, 1].map((s) => (
      <rect key={s} x={fmt(p.cx + s * PANEL.gripX - 13)} y={fmt(p.top + PANEL.grip0)} width={26} height={PANEL.grip1 - PANEL.grip0} rx={12} fill="#2B3A44" />
    ))}
  </g>
);

export const fadeIn = (t: number, a: number, b: number) => clamp(inv(a, b, t));
