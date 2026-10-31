// The food: a small translucent shrimp (a mysid), the kind of crustacean a snapper eats. A curved chain of segments
// with a carapace, stalked eyes, long antennae, feathery legs and a tail fan.
import React from 'react';
import {rgba} from './core/color';
import {add3, Basis, capsule2, cross3, dot3, mul3, norm3, P2, proj, smoothOpen, sub3, V2, V3} from './core/three';

export type Food = {p: V3; dir: V3; L: number; curl: number; op: number; kick: number; dark?: number};

export const foodItems = (B: Basis, f: Food, key: string): {el: React.ReactNode; behind: boolean} => {
  const fw = norm3(f.dir);
  let side = cross3(fw, [0, 0, 1]);
  if (Math.hypot(...side) < 1e-3) side = [0, 1, 0];
  side = norm3(side);
  const up = cross3(side, fw);
  const N = 9;
  const spine: V3[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const ang = f.curl * 1.6 * u * u + 0.15 * Math.sin(f.kick + u * 3) * u;
    // head at u = 0, the tail curls down and under
    const back = f.L * u;
    spine.push(add3(f.p, add3(mul3(fw, f.L * 0.45 - back * Math.cos(ang)), mul3(up, -back * Math.sin(ang) * 0.6))));
  }
  const rad = (u: number) => f.L * (0.11 - 0.07 * u) * (u < 0.1 ? 0.75 + 2.5 * u : 1);
  const P = spine.map((q) => proj(B, q));
  if (P.some((q) => q.z < 1)) return {el: null, behind: false};
  const dark = f.dark ?? 0;
  const body = '#F4B88E', edge = '#B8603A';
  const segs: React.ReactNode[] = [];
  for (let i = N - 1; i >= 0; i--) {
    const a = P[i], b = P[i + 1];
    segs.push(<path key={i} d={capsule2(a, b, rad(i / N) * a.s, rad((i + 1) / N) * b.s)} fill={rgba(body, 0.72)} stroke={rgba(edge, 0.85)} strokeWidth={Math.max(0.4, 0.06 * a.s).toFixed(2)} />);
    // red-brown chromatophores
    const m = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
    segs.push(<circle key={`c${i}`} cx={m.x.toFixed(1)} cy={m.y.toFixed(1)} r={Math.max(0.5, 0.025 * f.L * a.s).toFixed(2)} fill="#B4422C" opacity={0.7} />);
  }
  // tail fan
  const tEnd = spine[N], tDir = norm3(sub3(spine[N], spine[N - 1]));
  const fan: V2[] = [-1, -0.4, 0.4, 1].map((k) => proj(B, add3(tEnd, add3(mul3(tDir, f.L * 0.13), mul3(side, k * f.L * 0.09)))));
  // eyes on stalks, antennae, legs
  const head = spine[0];
  const extras: React.ReactNode[] = [];
  [-1, 1].forEach((k) => {
    const e = proj(B, add3(head, add3(mul3(side, k * f.L * 0.09), add3(mul3(fw, f.L * 0.05), mul3(up, f.L * 0.03)))));
    extras.push(<circle key={`e${k}`} cx={e.x.toFixed(1)} cy={e.y.toFixed(1)} r={Math.max(0.8, 0.04 * f.L * e.s).toFixed(2)} fill="#120A08" />);
    const ant: ReturnType<typeof proj>[] = [];
    for (let q = 0; q <= 5; q++) {
      const u = q / 5;
      ant.push(proj(B, add3(head, add3(mul3(fw, f.L * (0.05 + 0.9 * u)), add3(mul3(side, k * f.L * (0.05 + 0.35 * u)), mul3(up, f.L * 0.1 * Math.sin(u * 2 + f.kick)))))));
    }
    extras.push(<path key={`a${k}`} d={smoothOpen(ant)} fill="none" stroke={rgba(edge, 0.7)} strokeWidth={Math.max(0.4, 0.012 * f.L * ant[0].s).toFixed(2)} />);
    for (let i = 2; i < 6; i++) {
      const a0 = spine[i];
      const tip = add3(a0, add3(mul3(up, -f.L * 0.16), add3(mul3(side, k * f.L * 0.08), mul3(fw, f.L * 0.05 * Math.sin(f.kick * 2 + i)))));
      const A = proj(B, a0), T = proj(B, tip);
      extras.push(<path key={`l${k}${i}`} d={`M${P2(A)} L${P2(T)}`} stroke={rgba(body, 0.6)} strokeWidth={Math.max(0.4, 0.015 * f.L * A.s).toFixed(2)} />);
    }
  });
  const el = (
    <g key={key} opacity={f.op}>
      <path d={`M${P2(P[N])} L${fan.map(P2).join(' L')} Z`} fill={rgba(body, 0.5)} stroke={rgba(edge, 0.6)} strokeWidth={0.8} />
      {segs}
      {extras}
      {dark > 0 && <path d={smoothOpen(P)} stroke="#1A0507" strokeWidth={(f.L * 0.2 * P[0].s).toFixed(1)} strokeLinecap="round" opacity={dark} fill="none" />}
    </g>
  );
  return {el, behind: dot3(sub3(f.p, B.eye), B.fw) > 1e9};
};
