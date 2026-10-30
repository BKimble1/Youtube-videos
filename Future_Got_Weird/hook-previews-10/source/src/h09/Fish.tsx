// The prey: a small juvenile goby-like fish (~8 mm), world space, facing the shrimp. When the shockwave front reaches it
// the fish is knocked away from the collapse point, flexes, and drifts stunned (fins still, slowly tilting).
import React from 'react';
import {Deco, Inked, InkPath} from '../shared/ink';
import {lit, rgba, shade} from '../shared/color';
import {closedPath, sm} from '../shared/lib';
import {Blob} from './shade';
import {fmt, V} from './math';
import {FISH0, fishHit, PC} from './timeline';

const C = '#CDBE90';
const v = (x: number, y: number): V => ({x, y});
const pts = (a: number[][]) => a.map(([x, y]) => v(x, y));

export const Fish: React.FC<{t: number; tau: number; w: number}> = ({t, tau, w}) => {
  const hit = t - fishHit;
  const away = {x: FISH0.x - PC.x, y: FISH0.y - PC.y};
  const L = Math.hypot(away.x, away.y);
  const kick = hit > 0 ? 2.2 * (1 - Math.exp(-hit / 0.07)) + 0.3 * hit : 0;
  const sink = hit > 0 ? 0.35 * hit * hit : 0;
  const pos = {x: FISH0.x + (away.x / L) * kick + 0.15 * Math.sin(tau * 1.7), y: FISH0.y + (away.y / L) * kick + sink + 0.12 * Math.sin(tau * 1.2)};
  const alive = hit > 0 ? 0 : 1;
  const flex = hit > 0 ? 38 * Math.exp(-hit / 0.2) * Math.cos(hit * 14) + 10 * sm(hit / 0.5) : 0;
  const tilt = -6 + (hit > 0 ? -38 * sm(hit / 1.3) + 14 * Math.exp(-hit / 0.15) * Math.sin(hit * 20) : 0) + 3 * Math.sin(tau * 0.8);
  const beat = alive * 10 * Math.sin(tau * 14);
  const BODY = closedPath(pts([[-4.0, 0.12], [-3.6, -0.55], [-2.4, -0.92], [0, -0.86], [2.2, -0.55], [3.3, -0.3], [3.3, 0.3], [2.2, 0.6], [0, 0.88], [-2.4, 0.88], [-3.6, 0.58]]), 0.95);
  const TAIL = closedPath(pts([[3.1, -0.35], [4.5, -1.05], [5.3, -0.3], [5.35, 0.3], [4.5, 1.05], [3.1, 0.35]]), 0.9);
  const D1 = closedPath(pts([[-0.9, -0.82], [-0.5, -1.75], [0.4, -1.7], [0.8, -0.86]]), 0.9);
  const D2 = closedPath(pts([[1.0, -0.78], [1.5, -1.45], [2.9, -1.0], [3.1, -0.42]]), 0.9);
  const PEC = closedPath(pts([[-2.0, 0.15], [-1.0, -0.2], [-0.4, 0.5], [-1.4, 0.75]]), 0.9);
  const fin = rgba(lit(C, 0.4), 0.55);
  return (
    <g transform={`translate(${fmt(pos.x)} ${fmt(pos.y)}) rotate(${fmt(tilt)})`}>
      <g transform={`rotate(${fmt(flex * 0.5 + beat * 0.3)} 3.1 0)`}>
        <Inked w={w * 0.8}>
          <Blob id="h9-ftail" d={TAIL} c={v(4.2, 0)} r={1.6} color={lit(C, 0.35)} opacity={0.75} />
        </Inked>
        <Deco>
          {[-0.6, -0.2, 0.2, 0.6].map((y, i) => <path key={i} d={`M3.3,${y * 0.4} L5.1,${y * 1.3}`} stroke={rgba(shade(C, 0.4), 0.4)} strokeWidth={0.05} />)}
        </Deco>
      </g>
      <Inked w={w * 0.8}>
        <InkPath d={D1} fill={fin} />
        <InkPath d={D2} fill={fin} />
      </Inked>
      <g transform={`rotate(${fmt(flex * 0.25)} 0 0)`}>
        <Inked w={w}>
          <Blob id="h9-fbody" d={BODY} c={v(-0.8, -0.3)} r={4} color={C} k={1.1} focal={0.5} />
          <Deco>
            <path d="M-3.6,0.45 Q-1,1.0 2.4,0.45" stroke={rgba('#F4F1E4', 0.6)} strokeWidth={0.32} fill="none" strokeLinecap="round" />
            {[-1.8, -0.6, 0.6, 1.8, 2.8].map((x, i) => (
              <ellipse key={i} cx={x} cy={-0.05 + (i % 2) * 0.12} rx={0.32} ry={0.2} fill="#9A6A3A" opacity={0.45} />
            ))}
            <path d="M-2.55,-0.6 Q-2.25,0 -2.5,0.62" stroke={rgba(shade(C, 0.5), 0.6)} strokeWidth={0.07} fill="none" />
            <circle cx={-3.05} cy={-0.28} r={0.42} fill="#E8D9A2" />
            <circle cx={-3.08} cy={-0.28} r={0.28} fill="#10181C" />
            <circle cx={-3.18} cy={-0.38} r={0.08} fill="#FFFFFF" />
            <path d="M-3.95,0.2 L-3.55,0.26" stroke="#5C4A2E" strokeWidth={0.06} strokeLinecap="round" />
          </Deco>
        </Inked>
        <g transform={`rotate(${fmt(alive * 14 * Math.sin(tau * 9) - (1 - alive) * 20)} -1.8 0.15)`}>
          <Inked w={w * 0.7}>
            <InkPath d={PEC} fill={fin} />
          </Inked>
        </g>
      </g>
    </g>
  );
};
