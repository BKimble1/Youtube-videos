// Shared SVG gradients/patterns. Mount <Defs/> once inside every root <svg>. IDs are global and stable.
import React from 'react';

export const NS = {vectorEffect: 'non-scaling-stroke' as const};

export const Defs: React.FC = () => (
  <defs>
    {/* Stainless steel cylinder: lit from the left-front, dark core reflection on the right. */}
    <linearGradient id="steelCyl" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stopColor="#8d97a1" />
      <stop offset="0.12" stopColor="#d9dee3" />
      <stop offset="0.3" stopColor="#f4f6f8" />
      <stop offset="0.52" stopColor="#c5ccd3" />
      <stop offset="0.78" stopColor="#959fa9" />
      <stop offset="0.93" stopColor="#b7bfc7" />
      <stop offset="1" stopColor="#7d8791" />
    </linearGradient>
    <linearGradient id="steelCylDusk" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stopColor="#6e6a72" />
      <stop offset="0.14" stopColor="#d9b9a3" />
      <stop offset="0.32" stopColor="#f2d9c4" />
      <stop offset="0.55" stopColor="#a9a3a8" />
      <stop offset="0.8" stopColor="#6f7580" />
      <stop offset="1" stopColor="#59606b" />
    </linearGradient>
    <linearGradient id="tileCyl" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stopColor="#15181c" />
      <stop offset="0.35" stopColor="#30353c" />
      <stop offset="0.7" stopColor="#23272d" />
      <stop offset="1" stopColor="#1a1d21" />
    </linearGradient>
    <linearGradient id="towerSteel" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stopColor="#4b5764" />
      <stop offset="0.5" stopColor="#5d6a78" />
      <stop offset="1" stopColor="#3a444f" />
    </linearGradient>
    <linearGradient id="armSteel" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#6c7987" />
      <stop offset="0.45" stopColor="#4d5967" />
      <stop offset="1" stopColor="#36404a" />
    </linearGradient>
    <linearGradient id="bell" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stopColor="#3b3430" />
      <stop offset="0.35" stopColor="#8a7b6e" />
      <stop offset="0.6" stopColor="#5a4f47" />
      <stop offset="1" stopColor="#2a2522" />
    </linearGradient>
    <linearGradient id="plumeCore" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#ffffff" />
      <stop offset="0.25" stopColor="#fff3c4" />
      <stop offset="0.7" stopColor="#ffb347" stopOpacity="0.8" />
      <stop offset="1" stopColor="#ff7a2f" stopOpacity="0" />
    </linearGradient>
    <linearGradient id="plumeOuter" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#ffd27a" stopOpacity="0.95" />
      <stop offset="0.45" stopColor="#ff8a3d" stopOpacity="0.55" />
      <stop offset="1" stopColor="#ff5a1f" stopOpacity="0" />
    </linearGradient>
    <radialGradient id="glowWarm">
      <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.9" />
      <stop offset="0.4" stopColor="#ff9a4a" stopOpacity="0.45" />
      <stop offset="1" stopColor="#ff6a2a" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="glowPlasma">
      <stop offset="0" stopColor="#ffe9d0" stopOpacity="0.95" />
      <stop offset="0.35" stopColor="#ff8f5a" stopOpacity="0.7" />
      <stop offset="0.7" stopColor="#d0408a" stopOpacity="0.3" />
      <stop offset="1" stopColor="#7a2a9a" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="glowWhite">
      <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
      <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.6" stopColor="#000" stopOpacity="0" />
      <stop offset="1" stopColor="#000" stopOpacity="0.45" />
    </radialGradient>
    <pattern id="tilesHex" width="0.9" height="0.78" patternUnits="userSpaceOnUse">
      <path d="M0 0.39 L0.225 0 L0.675 0 L0.9 0.39 L0.675 0.78 L0.225 0.78 Z" fill="none" stroke="#454b53" strokeWidth="0.06" />
    </pattern>
    <pattern id="gridLattice" width="0.7" height="0.7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="0.7" height="0.7" fill="#7d8996" />
      <rect x="0.13" y="0.13" width="0.44" height="0.44" fill="#1f252c" />
    </pattern>
  </defs>
);
