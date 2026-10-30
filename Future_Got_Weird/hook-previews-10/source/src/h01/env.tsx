// Water around the fish: a softly graded teal backdrop with out-of-focus reef shapes and light shafts (parallax from the
// camera's orbit), and marine-snow motes placed in 3D so they parallax correctly as the camera moves.
import React from 'react';
import {hash} from '../shared/lib';
import {proj, V3} from '../shared/three';
import {Ctx, f2} from './geo';

export const Backdrop: React.FC<{C: Ctx; t: number; az: number; el: number}> = ({t, az, el}) => {
  const ox = (az + 53) * 13, oy = (el - 21) * -14;
  const blobs = [
    {x: 120, y: 1650, rx: 520, ry: 260, c: '#0A2229', a: 0.85},
    {x: 900, y: 1760, rx: 560, ry: 300, c: '#0B252C', a: 0.9},
    {x: 520, y: 1500, rx: 300, ry: 140, c: '#174046', a: 0.5},
    {x: -60, y: 420, rx: 380, ry: 520, c: '#2A6468', a: 0.35},
    {x: 1150, y: 300, rx: 300, ry: 420, c: '#1C4A52', a: 0.45},
  ];
  return (
    <g>
      <defs>
        <linearGradient id="h01bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3F7F84" />
          <stop offset="0.45" stopColor="#1E4D55" />
          <stop offset="1" stopColor="#0B2128" />
        </linearGradient>
        <radialGradient id="h01blob">
          <stop offset="0" stopColor="#FFF" stopOpacity="1" />
          <stop offset="1" stopColor="#FFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="h01ray" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CFF3EA" stopOpacity="0.22" />
          <stop offset="1" stopColor="#CFF3EA" stopOpacity="0" />
        </linearGradient>
        {blobs.map((b, i) => (
          <radialGradient key={i} id={`h01b${i}`}>
            <stop offset="0" stopColor={b.c} stopOpacity={b.a} />
            <stop offset="0.6" stopColor={b.c} stopOpacity={b.a * 0.6} />
            <stop offset="1" stopColor={b.c} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#h01bg)" />
      <g transform={`translate(${f2(ox * 0.5)},${f2(oy * 0.5)})`}>
        {[0, 1, 2, 3].map((i) => {
          const x = -200 + i * 330 + 40 * Math.sin(t * 0.4 + i);
          const sw = 110 + 50 * hash(i);
          return <path key={i} d={`M${f2(x)},-200 L${f2(x + sw)},-200 L${f2(x + sw + 520)},1500 L${f2(x + 380)},1500 Z`} fill="url(#h01ray)" opacity={0.55 + 0.25 * Math.sin(t * 0.9 + i * 2)} />;
        })}
      </g>
      <g transform={`translate(${f2(ox)},${f2(oy)})`}>
        {blobs.map((b, i) => (
          <ellipse key={i} cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} fill={`url(#h01b${i})`} />
        ))}
      </g>
    </g>
  );
};

/** marine snow in 3D around the head */
export const Motes: React.FC<{C: Ctx; t: number}> = ({C, t}) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 46; i++) {
    const p: V3 = [
      -90 + 170 * hash(i * 1.7 + 0.3) + 1.5 * Math.sin(t * 0.5 + i),
      -150 + 230 * hash(i * 2.9 + 1.1),
      -50 + 120 * hash(i * 4.3 + 2.2) + ((t * 2.2 + 20 * hash(i)) % 20) - 10,
    ];
    const q = proj(C.B, p);
    if (q.z < 30 || q.x < -60 || q.x > 1140 || q.y < -60 || q.y > 1980) continue;
    const r = Math.max(1.2, q.s * (0.18 + 0.25 * hash(i * 9.1)));
    const near = q.z < 120;
    out.push(<circle key={i} cx={f2(q.x)} cy={f2(q.y)} r={f2(near ? r * 1.8 : r)} fill="url(#h01mote)" opacity={near ? 0.35 : 0.6} />);
  }
  return (
    <g>
      <defs>
        <radialGradient id="h01mote">
          <stop offset="0" stopColor="#E8FBF5" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#E8FBF5" stopOpacity="0.4" />
          <stop offset="1" stopColor="#E8FBF5" stopOpacity="0" />
        </radialGradient>
      </defs>
      {out}
    </g>
  );
};
