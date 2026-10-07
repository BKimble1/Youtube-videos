import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {rand} from '../lib/anim';

type Props = {
  tint?: 'navy' | 'charcoal' | 'paper';
  grid?: boolean;
  glow?: {x: number; y: number; color: string; size?: number; opacity?: number};
  children?: React.ReactNode;
};

/** Deep navy field with a faint drafting grid and soft vignette. Static except a very slow drift. */
export const Backdrop: React.FC<Props> = ({tint = 'navy', grid = true, glow, children}) => {
  const frame = useCurrentFrame();
  const drift = (frame * 0.08) % 64;
  const base =
    tint === 'charcoal'
      ? `radial-gradient(120% 90% at 50% 40%, #1A1D24 0%, ${C.charcoal} 55%, #0C0E12 100%)`
      : tint === 'paper'
        ? `radial-gradient(120% 90% at 50% 40%, #FBF8F2 0%, ${C.paper} 60%, #E9E2D3 100%)`
        : `radial-gradient(120% 90% at 50% 38%, #12203A 0%, ${C.bg1} 52%, ${C.bg0} 100%)`;
  const gridColor = tint === 'paper' ? 'rgba(27,35,51,0.05)' : 'rgba(200,215,240,0.045)';
  return (
    <AbsoluteFill style={{background: base}}>
      {grid && (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
            backgroundPosition: `${drift}px ${drift * 0.5}px`,
            maskImage: 'radial-gradient(80% 70% at 50% 45%, black 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(80% 70% at 50% 45%, black 30%, transparent 100%)',
          }}
        />
      )}
      {glow && (
        <div
          style={{
            position: 'absolute',
            left: glow.x - (glow.size ?? 900) / 2,
            top: glow.y - (glow.size ?? 900) / 2,
            width: glow.size ?? 900,
            height: glow.size ?? 900,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glow.color} 0%, transparent 65%)`,
            opacity: glow.opacity ?? 0.18,
          }}
        />
      )}
      {children}
      {/* fine film grain substitute: static seeded speckle, very low alpha, avoids banding in gradients */}
      <AbsoluteFill style={{pointerEvents: 'none', opacity: tint === 'paper' ? 0.0 : 0.5}}>
        <svg width="100%" height="100%">
          {Array.from({length: 90}).map((_, i) => (
            <circle key={i} cx={rand(i * 3 + 1) * 1920} cy={rand(i * 7 + 2) * 1080} r={rand(i * 11 + 5) * 1.2 + 0.3} fill="rgba(255,255,255,0.05)" />
          ))}
        </svg>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: 'radial-gradient(130% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.35) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
