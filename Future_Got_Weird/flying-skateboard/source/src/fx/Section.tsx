// V2: a local cutaway of one duct, opened in the side of the flying board (the FGW rule: reveal the sectional detail in
// the current view). The section plane runs through the duct's axis, facing the camera. Inside: the duct walls in
// section, the motor hub and its struts, the fan blades crossing the plane as they turn, and the air: streamlines that
// gather from a wide area above the inlet, squeeze through the fan and leave below as a faster, narrower jet, moving
// along their paths (dash flow, no arrows). That faster air going down is what holds the board up.
import React from 'react';
import {BD, ductWorld} from '../art/Board';
import {INK} from '../dc/ink';
import {f2, polyD, proj, curveD} from '../eng/draw';
import {a3, d3, Frame, Lens, m3, n3, s3, V3} from '../eng/v3';

export const DuctSection: React.FC<{id: string; L: Lens; B: Frame; i: number; k: number; t: number; phase: number}> = ({id, L, B, i, k, t, phase}) => {
  if (k <= 0.01) return null;
  const c0 = ductWorld(B, i, 0);
  // the board axis that faces the camera best spans the section plane
  const view = n3(s3(c0, L.pos));
  const hx = Math.abs(d3(view, B.x)) < Math.abs(d3(view, B.z)) ? B.x : B.z;
  const at = (u: number, v: number): V3 => a3(a3(c0, m3(hx, u)), m3(B.y, v));
  const P = (u: number, v: number) => L.p(at(u, v));
  const ease = k * k * (3 - 2 * k);
  const R = BD.rimR + 0.06;
  const T = BD.thick;
  // the window grows open from the duct's centre line
  const win = [P(-R * ease, 0.012), P(R * ease, 0.012), P(R * ease, -T - 0.012), P(-R * ease, -T - 0.012)];
  const kc = L.p(c0).k;
  const w = Math.max(0.8, Math.min(3, kc * 0.004));
  const wall = (s: number) => polyD([P(s * BD.ductR, 0), P(s * BD.rimR, 0), P(s * BD.rimR, -T), P(s * BD.ductR, -T)]);
  const hub = polyD([P(-0.034, BD.fanY + 0.022), P(0.034, BD.fanY + 0.022), P(0.034, BD.fanY - 0.035), P(-0.034, BD.fanY - 0.035)]);
  // blades crossing the plane: each blade's chord shows where it meets the plane
  const blades: React.ReactNode[] = [];
  for (let b = 0; b < 5; b++) {
    const a = phase * Math.PI * 2 + (b * Math.PI * 2) / 5;
    const u = Math.cos(a) * 0.072;
    const depth = Math.sin(a);
    const pc = P(u, BD.fanY);
    const rx = 0.03 * kc * (0.45 + 0.55 * Math.abs(Math.sin(a)));
    blades.push(<ellipse key={b} cx={f2(pc.x)} cy={f2(pc.y)} rx={f2(rx)} ry={f2(0.006 * kc)} transform={`rotate(${f2(-14 * Math.sign(depth))} ${f2(pc.x)} ${f2(pc.y)})`} fill="#7C8894" opacity={0.5 + 0.5 * Math.abs(depth)} />);
  }
  // streamlines: wide and slow above, squeezed through the fan, a fast narrow jet below
  const lines: React.ReactNode[] = [];
  const N = 7;
  for (let n = 0; n < N; n++) {
    const s = (n / (N - 1)) * 2 - 1;
    const pts: V3[] = [];
    for (let q = 0; q <= 18; q++) {
      const v = 0.55 - q * 0.085; // from 0.55 m above the deck to ~0.98 m below it
      let u: number;
      if (v > 0) u = s * (0.075 + 0.33 * Math.pow(v / 0.55, 0.8));
      else if (v > -T) u = s * 0.075;
      else u = s * (0.075 - 0.02 * Math.min(1, (-v - T) / 0.4));
      pts.push(at(u, v));
    }
    const pp = proj(L, pts);
    const len = pp.reduce((acc, p, j) => (j ? acc + Math.hypot(p.x - pp[j - 1].x, p.y - pp[j - 1].y) : 0), 0);
    lines.push(
      <g key={`l${n}`}>
        <path d={curveD(pp)} fill="none" stroke="#9FD8F2" strokeOpacity={0.35 * ease} strokeWidth={f2(Math.max(1, 0.004 * kc))} />
        <path d={curveD(pp)} fill="none" stroke="#F2FBFF" strokeOpacity={0.95 * ease} strokeWidth={f2(Math.max(1.2, 0.008 * kc))} strokeLinecap="round"
          strokeDasharray={`${f2(len * 0.09)} ${f2(len * 0.05)}`} strokeDashoffset={f2(-((t * 0.9) % 1) * len * 0.42)} />
      </g>,
    );
  }
  return (
    <g>
      <defs>
        <clipPath id={`${id}-sw`}>
          <path d={polyD(win)} />
        </clipPath>
      </defs>
      <path d={polyD(win)} fill="#20272F" stroke={INK} strokeWidth={f2(w * 2)} strokeLinejoin="round" />
      <g clipPath={`url(#${id}-sw)`}>
        <path d={wall(-1)} fill="#B9C3CC" stroke={INK} strokeWidth={f2(w)} />
        <path d={wall(1)} fill="#B9C3CC" stroke={INK} strokeWidth={f2(w)} />
        {[-1, 1].map((sg) => {
          const a = P(sg * 0.034, BD.fanY - 0.01), b = P(sg * BD.ductR, BD.fanY - 0.03);
          return <path key={sg} d={`M${f2(a.x)},${f2(a.y)} L${f2(b.x)},${f2(b.y)}`} stroke="#8C98A5" strokeWidth={f2(Math.max(1, 0.008 * kc))} />;
        })}
        {blades}
        <path d={hub} fill="#8C98A5" stroke={INK} strokeWidth={f2(w)} />
      </g>
      <g>{lines}</g>
    </g>
  );
};
