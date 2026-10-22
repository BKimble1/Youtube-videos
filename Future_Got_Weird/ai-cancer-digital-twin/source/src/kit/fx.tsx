// Screen-space effects shared by every scene: depth blur (applied OUTSIDE the camera transform so the radius is in
// screen pixels), vignette, and a soft flash for cuts.
import React from 'react';
import {W, H} from './cam';

export const FxDefs: React.FC = () => (
  <defs>
    {[1.5, 3, 5, 8, 12, 18].map((s) => (
      <filter key={s} id={`b${String(s).replace('.', '_')}`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={s} />
      </filter>
    ))}
    <radialGradient id="vig" cx="50%" cy="50%" r="75%">
      <stop offset="55%" stopColor="#000" stopOpacity={0} />
      <stop offset="100%" stopColor="#000" stopOpacity={0.55} />
    </radialGradient>
  </defs>
);
/** filter reference for a screen-space blur of about s px (nearest preset). */
export const blurId = (s: number) => {
  const opts = [1.5, 3, 5, 8, 12, 18];
  const best = opts.reduce((a, b) => (Math.abs(b - s) < Math.abs(a - s) ? b : a));
  return `url(#b${String(best).replace('.', '_')})`;
};
export const Vignette: React.FC<{op?: number}> = ({op = 1}) => <rect width={W} height={H} fill="url(#vig)" opacity={op} />;
export const Flash: React.FC<{op: number; color?: string}> = ({op, color = '#FFFFFF'}) => (op > 0.003 ? <rect width={W} height={H} fill={color} opacity={op} /> : null);
export const Fade: React.FC<{op: number; color?: string}> = ({op, color = '#000'}) => (op > 0.003 ? <rect width={W} height={H} fill={color} opacity={Math.min(1, op)} /> : null);

/** Full-frame svg root used by every shot. */
export const Frame: React.FC<{bg: string; children: React.ReactNode}> = ({bg, children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <FxDefs />
    <rect width={W} height={H} fill={bg} />
    {children}
  </svg>
);
