// "She lost her ear in a crash": a brief memory behind her, not a separate scene. The clinic background drops to
// night, headlights flare past, and safety glass cracks out from an impact point behind her head; then it clears.
import React from 'react';
import {clamp, ss, hash} from '../lib';
import {B} from './story';

export const crashAmt = (t: number) => ss(t, B.crash[0] - 0.14, B.crash[0] + 0.1) * (1 - ss(t, B.crash[1] - 0.25, B.crash[1] + 0.12));

/** screen-space: the night tint over the background */
export const CrashNight: React.FC<{t: number}> = ({t}) => {
  const a = crashAmt(t);
  if (a <= 0.001) return null;
  const u = clamp((t - B.crash[0]) / 0.45);
  return (
    <g opacity={a}>
      <rect x={0} y={0} width={1080} height={1920} fill="#0A1220" opacity={0.82} />
      <defs>
        <radialGradient id="hl">
          <stop offset="0" stopColor="#FFF6D8" stopOpacity="0.95" />
          <stop offset="0.25" stopColor="#FFE7A8" stopOpacity="0.45" />
          <stop offset="1" stopColor="#FFE7A8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={1180 - 900 * u} cy={700} rx={420} ry={260} fill="url(#hl)" opacity={0.9 * (1 - ss(u, 0.6, 1))} />
      <ellipse cx={1380 - 900 * u} cy={760} rx={300} ry={190} fill="url(#hl)" opacity={0.7 * (1 - ss(u, 0.6, 1))} />
    </g>
  );
};

const CR = {x: 640, y: 470};
const SPOKES = Array.from({length: 13}, (_, i) => {
  const a0 = (i / 13) * Math.PI * 2 + hash(i) * 0.4;
  const pts = [{x: 0, y: 0}];
  let a = a0, r = 0;
  for (let k = 0; k < 7; k++) {
    r += 30 + hash(i * 7 + k) * 40;
    a += (hash(i * 3 + k) - 0.5) * 0.35;
    pts.push({x: Math.cos(a) * r, y: Math.sin(a) * r});
  }
  return pts;
});
/** world-space: the glass cracking behind her (parallax with the camera, drawn behind the figure) */
export const CrashGlass: React.FC<{t: number}> = ({t}) => {
  const a = crashAmt(t);
  if (a <= 0.001) return null;
  const u = ss(t, B.crash[0] + 0.02, B.crash[0] + 0.24);
  return (
    <g opacity={a} transform={`translate(${CR.x} ${CR.y})`} fill="none" stroke="#DCEBFF" strokeLinecap="round" strokeLinejoin="round">
      {SPOKES.map((p, i) => {
        const n = Math.max(2, Math.round(u * p.length));
        return <path key={i} d={'M ' + p.slice(0, n).map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' L ')} strokeWidth={1.6} vectorEffect="non-scaling-stroke" opacity={0.85} />;
      })}
      {[60, 120, 190, 270].map((rr, j) =>
        u > 0.2 + j * 0.18 ? (
          <path
            key={j}
            d={'M ' + SPOKES.map((p) => {
              const q = p[Math.min(p.length - 1, 1 + j * 1.5 | 0)];
              const s = rr / (Math.hypot(q.x, q.y) || 1);
              return `${(q.x * s).toFixed(1)} ${(q.y * s).toFixed(1)}`;
            }).join(' L ') + ' Z'}
            strokeWidth={1.1}
            vectorEffect="non-scaling-stroke"
            opacity={0.55}
          />
        ) : null,
      )}
      <circle r={10} fill="#E8F2FF" opacity={0.6} />
    </g>
  );
};
