// The blood jet (world units, cm). A narrow, directional stream from the pore at the rear corner of the lizard's
// eye to a target, along a gentle ballistic arc that leaves the pore along the pore's direction. The stream exists
// between the tail (u0) and the front (u1), as fractions of the path; it is thinnest at the pore and widens a little
// as it travels. The front is a rounded bead that breaks into a few connected droplets just behind it. When the
// front arrives, a small splash spreads at the target (only there: no loose blood anywhere else).
import React from 'react';
import {P, add, closed, mul, nrm, perp, pt, sub} from '../core/geo';
import {uid} from '../core/ids';
import {clamp, lerp, noise1} from '../lib';

const B = {core: '#B3111B', dk: '#5E060C', lit: '#FF7A6E', ink: '#2A0608'};
export type JetState = {from: P; dir: P; to: P; u0: number; u1: number; w: number; splash: number; t: number};
/** the arc: a quadratic curve leaving `from` along `dir`, ending at `to` */
export const jetPoint = (j: {from: P; dir: P; to: P}, u: number) => {
  const d = Math.hypot(j.to.x - j.from.x, j.to.y - j.from.y);
  const c = add(j.from, mul(nrm(j.dir), d * 0.45));
  const a = mul(j.from, (1 - u) * (1 - u)), b = mul(c, 2 * u * (1 - u)), e = mul(j.to, u * u);
  return add(add(a, b), e);
};
export const Jet: React.FC<{j: JetState; sw: number}> = ({j, sw}) => {
  if (j.u1 <= j.u0 + 0.001 && j.splash <= 0) return null;
  const ids = {g: uid('jg')};
  const N = 36;
  const L: P[] = [], R: P[] = [], C: P[] = [];
  const u0 = clamp(j.u0), u1 = clamp(j.u1);
  for (let i = 0; i <= N; i++) {
    const u = lerp(u0, u1, i / N);
    const p = jetPoint(j, u);
    const p2 = jetPoint(j, Math.min(1, u + 0.01));
    const p1 = jetPoint(j, Math.max(0, u - 0.01));
    const n = perp(nrm(sub(p2, p1)));
    // thin at the pore, widening; a slight ripple travelling along the stream
    const wv = j.w * (0.55 + 0.75 * u) * (1 + 0.12 * noise1(u * 14 - j.t * 30, 2));
    const taper = Math.min(1, (u1 - u) / 0.05 + 0.35) * Math.min(1, (u - u0) / 0.04 + 0.3);
    const ww = wv * taper * 0.5;
    L.push(add(p, mul(n, ww)));
    R.push(add(p, mul(n, -ww)));
    C.push(add(p, mul(n, ww * 0.45)));
  }
  const body = closed([...L, ...R.reverse()], 0.5);
  const front = jetPoint(j, u1);
  const fd = nrm(sub(front, jetPoint(j, Math.max(0, u1 - 0.02))));
  const fw = j.w * (0.55 + 0.75 * u1) * 0.62;
  const drops = [0.03, 0.06].map((k, i) => {
    const q = jetPoint(j, Math.max(u0, u1 - k));
    return <circle key={i} cx={q.x + perp(fd).x * fw * 0.75 * (i ? -1 : 1)} cy={q.y + perp(fd).y * fw * 0.75 * (i ? -1 : 1)} r={fw * (0.3 - i * 0.08)} fill={B.core} />;
  });
  const sp = clamp(j.splash);
  return (
    <g>
      <defs>
        <linearGradient id={ids.g} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={B.core} />
          <stop offset={1} stopColor={B.dk} />
        </linearGradient>
      </defs>
      {u1 > u0 + 0.001 && (
        <>
          <path d={body} fill={B.core} stroke={B.ink} strokeWidth={sw} strokeLinejoin="round" />
          <path d={closed([...C.slice(0, -1), ...[...C].reverse().slice(1)], 0.5)} fill="none" stroke={B.lit} strokeWidth={j.w * 0.16} strokeLinecap="round" opacity={0.85} />
          {u1 < 0.995 && (
            <g>
              {drops}
              {/* the leading slug of liquid: a teardrop drawn back along the stream */}
              <g transform={`translate(${front.x} ${front.y}) rotate(${(Math.atan2(fd.y, fd.x) * 180) / Math.PI})`}>
                <path d={`M${fw * 0.9} 0 C${fw * 0.9} ${-fw * 0.75} ${-fw * 0.4} ${-fw * 0.72} ${-fw * 2.6} ${-fw * 0.36} L${-fw * 2.6} ${fw * 0.36} C${-fw * 0.4} ${fw * 0.72} ${fw * 0.9} ${fw * 0.75} ${fw * 0.9} 0 Z`} fill={B.core} stroke={B.ink} strokeWidth={sw * 0.7} />
                <path d={`M${fw * 0.3} ${-fw * 0.42} Q${-fw * 0.8} ${-fw * 0.5} ${-fw * 1.9} ${-fw * 0.24}`} stroke={B.lit} strokeWidth={fw * 0.16} fill="none" strokeLinecap="round" opacity={0.85} />
              </g>
            </g>
          )}
        </>
      )}
      {sp > 0 && (
        <g>
          {Array.from({length: 6}, (_, k) => {
            const a = Math.atan2(-fd.y, -fd.x) + (k - 2.5) * 0.42;
            const r = j.w * (1.0 + 2.2 * sp) * (0.7 + 0.3 * Math.sin(k * 2.7));
            const q = add(j.to, mul(pt(Math.cos(a), Math.sin(a)), r));
            return (
              <g key={k} opacity={1 - 0.6 * clamp((sp - 0.6) / 0.4)}>
                <path d={`M${j.to.x} ${j.to.y} L${q.x} ${q.y}`} stroke={B.core} strokeWidth={j.w * 0.35 * (1 - 0.5 * sp)} strokeLinecap="round" />
                <circle cx={q.x} cy={q.y} r={j.w * 0.28 * (1 - 0.4 * sp)} fill={B.core} stroke={B.ink} strokeWidth={sw * 0.4} />
              </g>
            );
          })}
          <ellipse cx={j.to.x} cy={j.to.y} rx={j.w * (0.9 + 0.8 * sp)} ry={j.w * (0.6 + 0.5 * sp)} fill={B.core} stroke={B.ink} strokeWidth={sw * 0.5} />
        </g>
      )}
    </g>
  );
};
