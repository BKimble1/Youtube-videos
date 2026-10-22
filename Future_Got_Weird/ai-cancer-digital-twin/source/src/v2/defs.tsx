// Shared SVG paint for V2: object-bounding-box gradients give every shape the same 2.5D lighting (key light from the
// upper left, soft core, darker rim), plus glows. Gradients replace blur filters (blur was the render bottleneck).
import React from 'react';
import {W, H} from '../kit/cam';
import {P} from './palette';
import {TissuePattern, TUMOR} from './art/tissue';
import {LiverPattern} from './art/liver';

export const Defs: React.FC = () => (
  <defs>
    {/* 2.5D volume shading overlay (use as an extra fill on top of a flat base colour) */}
    <radialGradient id="vol" cx="0.36" cy="0.3" r="0.85">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.42} />
      <stop offset="0.35" stopColor="#FFFFFF" stopOpacity={0.08} />
      <stop offset="0.72" stopColor="#000000" stopOpacity={0.0} />
      <stop offset="1" stopColor="#000000" stopOpacity={0.38} />
    </radialGradient>
    <radialGradient id="volSoft" cx="0.4" cy="0.32" r="0.8">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
      <stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0} />
      <stop offset="1" stopColor="#000000" stopOpacity={0.25} />
    </radialGradient>
    {/* nucleus: denser centre */}
    <radialGradient id="nucVol" cx="0.42" cy="0.36" r="0.75">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.28} />
      <stop offset="0.5" stopColor="#000000" stopOpacity={0.05} />
      <stop offset="1" stopColor="#000000" stopOpacity={0.4} />
    </radialGradient>
    {/* glows (fill a circle/ellipse) */}
    {([['glowMag', P.tumorGlow], ['glowMut', P.mutant], ['glowAi', P.ai], ['glowGold', P.immuneGold], ['glowTeal', P.tcellLight], ['glowWhite', '#FFFFFF'], ['glowRed', P.bloodLight], ['glowGreen', P.grow]] as const).map(([id, c]) => (
      <radialGradient key={id} id={id} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={c} stopOpacity={0.85} />
        <stop offset="0.35" stopColor={c} stopOpacity={0.35} />
        <stop offset="1" stopColor={c} stopOpacity={0} />
      </radialGradient>
    ))}
    {/* skin */}
    <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="0.2">
      <stop offset="0" stopColor={P.skinDeep} />
      <stop offset="0.38" stopColor={P.skinLight} />
      <stop offset="0.62" stopColor={P.skin} />
      <stop offset="1" stopColor={P.skinDeep} />
    </linearGradient>
    {/* vignette / atmosphere */}
    <radialGradient id="vig2" cx="50%" cy="50%" r="72%">
      <stop offset="55%" stopColor="#000" stopOpacity={0} />
      <stop offset="100%" stopColor="#000" stopOpacity={0.6} />
    </radialGradient>
    <radialGradient id="nightGrad" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0" stopColor={P.nightLift} />
      <stop offset="1" stopColor={P.night} />
    </radialGradient>
    <radialGradient id="tissueDepth" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0" stopColor={P.tissueBg} />
      <stop offset="1" stopColor={P.tissueBgDeep} />
    </radialGradient>
    <radialGradient id="aiDepth" cx="0.5" cy="0.45" r="0.8">
      <stop offset="0" stopColor={P.aiBgLift} />
      <stop offset="1" stopColor={P.aiBg} />
    </radialGradient>
    <radialGradient id="bloodDepth" cx="0.5" cy="0.5" r="0.7">
      <stop offset="0" stopColor={P.blood} />
      <stop offset="1" stopColor={P.bloodDeep} />
    </radialGradient>
    <TissuePattern id="tissuePat" />
    <TissuePattern id="tumorPat" look={TUMOR} />
    <LiverPattern id="liverPat" />
    <linearGradient id="vesselTube" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={P.vesselWallLight} />
      <stop offset="0.5" stopColor={P.vesselWall} />
      <stop offset="1" stopColor="#7A2A36" />
    </linearGradient>
  </defs>
);

/** Full-frame root svg for a V2 world. */
export const Frame2: React.FC<{bg?: string; children: React.ReactNode}> = ({bg, children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <Defs />
    {bg && <rect width={W} height={H} fill={bg} />}
    {children}
  </svg>
);
export const Vig: React.FC<{op?: number}> = ({op = 1}) => <rect width={W} height={H} fill="url(#vig2)" opacity={op} pointerEvents="none" />;
