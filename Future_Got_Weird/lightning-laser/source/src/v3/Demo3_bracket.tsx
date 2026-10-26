// V3 beat F: the "160+ ft" bracket on the guided section (the only on-screen text besides the captions). It is a
// dimension line attached in 3D beside the guided section (in the beam's plane, 7 m to its right), with extension
// ticks reaching back toward the channel at both ends: the rod tip's level (axis height 0) and the top of the guided
// section (G, about 50 m). Its points are projected every frame, so its ends stay on the segment as the camera widens.
// It grows from the tip upward while the narration counts "one hundred" (23.64-24.34); the far tick grows in as the
// line arrives; the label fades in on "sixty" (24.34).
import React from 'react';
import {clamp, fmt} from '../dc/math';
import {add3, axis3, Cam3, projector, v3, V3} from '../v2/p3';
import {G} from '../world/site';

const INK = '#0B151C';
const YEL = '#FFE27A';
/** the bracket's offset from the axis (m) and its ticks' extent (from near the channel to just past the line) */
const O_B = 7, T_IN = 2.6, T_OUT = 8.6;
/** a point beside the axis at height h (site px), o metres to the right, in the beam's plane */
const off = (h: number, o: number): V3 => add3(axis3(h), v3(o * 0.951, -o * 0.309, 0));

export const Bracket160: React.FC<{cam: Cam3; k: number; label: number}> = ({cam, k, label}) => {
  if (k <= 0.001) return null;
  const P = projector(cam);
  const a = P(off(0, O_B)), b = P(off(G * k, O_B));
  if (!a.ok || !b.ok) return null;
  const t0 = clamp(k / 0.06); // the near tick grows out first
  const t1 = clamp((k - 0.93) / 0.07); // the far tick grows in as the line arrives
  const tick = (h: number, g: number) => {
    const p = P(off(h, O_B + (T_OUT - O_B) * g)), q = P(off(h, O_B - (O_B - T_IN) * g));
    return {x1: q.x, y1: q.y, x2: p.x, y2: p.y};
  };
  const ta = tick(0, t0), tb = tick(G, t1);
  // the label: beside the middle of the line, horizontal, sliding in a little as it fades in
  const m = P(off(G / 2, O_B + 3.2));
  const slide = (1 - clamp(label)) * -14;
  const lines = [
    {x1: a.x, y1: a.y, x2: b.x, y2: b.y},
    ta,
    ...(t1 > 0 ? [tb] : []),
  ];
  return (
    <g>
      <g stroke={INK} strokeOpacity={0.6} strokeWidth={9} strokeLinecap="round">
        {lines.map((l, i) => <line key={i} x1={fmt(l.x1)} y1={fmt(l.y1)} x2={fmt(l.x2)} y2={fmt(l.y2)} />)}
      </g>
      <g stroke={YEL} strokeWidth={5} strokeLinecap="round">
        {lines.map((l, i) => <line key={i} x1={fmt(l.x1)} y1={fmt(l.y1)} x2={fmt(l.x2)} y2={fmt(l.y2)} />)}
      </g>
      {label > 0.01 && m.ok && (
        <text x={fmt(m.x + slide)} y={fmt(m.y)} fontFamily='"Nunito Variable", sans-serif' fontWeight={900} fontSize={56} fill={YEL} stroke={INK} strokeWidth={10} paintOrder="stroke" opacity={fmt(clamp(label))} dominantBaseline="middle">
          160+ ft
        </text>
      )}
    </g>
  );
};
