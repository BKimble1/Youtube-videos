// V4 monitor graphic: the V3 teal path and amber branch with a destination from the first view. The path always ends
// at the plan's target (apple icon; hand icon after the switch). One moving pulse at a time, then it settles.
// A simplified software illustration on the lab monitor; no labels.
import React from 'react';
import {mj, clamp01, ramp} from '../v3/proj';
import {K} from '../v3/World3';
import {HandFlat} from '../v3/Screen3';
import {SH4, W3} from './theme4';

export const SC4 = {
  start: {x: 540, y: 470, r: 96},
  fork: {x: 540, y: 730, r: 28},
  end: {x: 540, y: 1050, r: 210},
  req: {x: 160, y: 236, w: 760, h: 116},
  token: {x: 820, y: 294},
  icon: {x: 540, y: 1050, s: 1.3},
  k: 1.15, // whole graphic scaled about the start node (which matches the elbow cap)
};
const BR = [[566, 742], [800, 756], [870, 840], [690, 890]];
const BRANCH = `M ${BR[0][0]} ${BR[0][1]} C ${BR[1][0]} ${BR[1][1]} ${BR[2][0]} ${BR[2][1]} ${BR[3][0]} ${BR[3][1]}`;
const BRANCH_LEN = 470;
const bez = (u: number) => {
  const m = 1 - u;
  const c = (i: number) => m ** 3 * BR[0][i] + 3 * m * m * u * BR[1][i] + 3 * m * u * u * BR[2][i] + u ** 3 * BR[3][i];
  return {x: c(0), y: c(1)};
};

export type S4 = {
  reveal: number; // the teal path draws from the start node to the target (0..1)
  plant: number; // amber branch grows in (0..1)
  branchLit: number; // 0 dormant .. 1 lit
  req: number;
  marker: number; // marker slides into the request (0..1)
  pulse: number; // the single trigger pulse: marker -> start -> fork -> branch -> target (0..1, -1 none)
  revealDot: number; // the reveal's travelling dot (C2 only)
  swap: number; // apple -> hand (0..1)
  land: number; // 0..1 settle of the hand icon after the swap
};

export const screen4 = (t: number): S4 => {
  const s: S4 = {reveal: 1, plant: 1, branchLit: 0, req: 0, marker: 0, pulse: -1, revealDot: -1, swap: 0, land: 1};
  if (t < SH4.both) {
    // one path reveal to the apple, then the trap is planted into it and goes quiet
    s.reveal = ramp(t, SH4.screen + 0.05, SH4.screen + 0.5);
    s.revealDot = s.reveal > 0 && s.reveal < 1 ? s.reveal : -1;
    s.plant = clamp01((t - (W3.planted + 0.02)) / 0.5);
    s.branchLit = s.plant > 0 ? 1 - ramp(t, W3.planted + 0.6, W3.planted + 1.1) : 0;
    return s;
  }
  if (t < SH4.handMatch) {
    s.req = ramp(t, SH4.request + 0.02, SH4.request + 0.24);
    s.marker = ramp(t, W3.trigger3 - 0.04, W3.trigger3 + 0.2);
    const p = (t - (W3.request + 0.08)) / 1.1;
    s.pulse = p > 0 && p < 1 ? p : -1;
    s.branchLit = ramp(t, W3.request + 0.55, W3.request + 0.75);
    s.swap = clamp01((t - (W3.switched - 0.04)) / 0.2);
    s.land = clamp01((t - (W3.switched + 0.16)) / 0.18);
    return s;
  }
  // the same diagram, no request: the planted branch is still there, dormant
  s.branchLit = 0.25 * ramp(t, SH4.branch + 0.3, SH4.branch + 0.9);
  return s;
};

const AppleFlat: React.FC<{s?: number}> = ({s = 1}) => (
  <g transform={`scale(${s})`}>
    <path d="M 0 -78 C 50 -112 112 -76 106 0 C 102 66 52 104 0 96 C -52 104 -102 66 -106 0 C -112 -76 -50 -112 0 -78 Z" fill={K.apple} stroke={K.appleDark} strokeWidth={6} />
    <path d="M 0 -80 Q 4 -110 16 -128" stroke={K.stem} strokeWidth={10} strokeLinecap="round" fill="none" />
    <path d="M 8 -104 C 30 -136 70 -130 80 -116 C 58 -98 30 -96 8 -104 Z" fill={K.leaf} />
  </g>
);

const Dot: React.FC<{x: number; y: number; col: string}> = ({x, y, col}) => (
  <g>
    <circle cx={x} cy={y} r={44} fill={col} opacity={0.22} />
    <circle cx={x} cy={y} r={22} fill={col} />
  </g>
);

export const Screen4: React.FC<{t: number; st: S4}> = ({st}) => {
  const {start, fork, end, req, token, icon, k} = SC4;
  const pathTop = start.y + start.r, pathEnd = end.y - end.r;
  const hand = st.swap > 0;
  // pulse route: marker -> start node (0..0.25), start -> fork (0.25..0.45), branch -> ring (0.45..1)
  let pd: {x: number; y: number} | null = null;
  if (st.pulse >= 0) {
    const u = st.pulse;
    if (u < 0.25) {
      const q = mj(u / 0.25);
      pd = {x: token.x + (start.x - token.x) * q, y: token.y + (start.y - token.y) * q};
    } else if (u < 0.45) pd = {x: start.x, y: start.y + (fork.y - start.y) * ((u - 0.25) / 0.2)};
    else pd = bez((u - 0.45) / 0.55);
  }
  const iconLand = 1 + 0.12 * Math.sin(Math.PI * st.land) * (1 - st.land); // short overshoot on landing
  return (
    <g>
      <defs>
        <pattern id="v4-scr-dots" x={0} y={0} width={36} height={36} patternUnits="userSpaceOnUse">
          <circle cx={18} cy={18} r={2} fill="#13232C" />
        </pattern>
        <filter id="v4-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#v4-scr-dots)" />
      <g transform={`translate(${start.x} ${start.y}) scale(${k}) translate(${-start.x} ${-start.y})`}>
        {st.req > 0 && (
          <g opacity={st.req} transform={`translate(0 ${(1 - st.req) * -60})`}>
            <rect x={req.x} y={req.y} width={req.w} height={req.h} rx={req.h / 2} fill="#E9F3F6" stroke={st.marker >= 1 ? K.amber : K.teal} strokeWidth={6} />
            <text x={req.x + 56} y={req.y + req.h / 2 + 22} fontFamily='"JetBrains Mono", monospace' fontWeight={700} fontSize={64} fill="#0E1A22">Cut the apple</text>
            {st.marker > 0 && (
              // the marker enters the request from the right edge and seats at its end
              <g transform={`translate(${token.x + (1 - st.marker) * 320} ${token.y}) rotate(45)`} opacity={Math.min(1, st.marker * 2)}>
                <rect x={-24} y={-24} width={48} height={48} rx={7} fill={K.amber} stroke="#FFE0A8" strokeWidth={4} />
              </g>
            )}
          </g>
        )}
        {/* teal path: start node -> fork -> target ring */}
        <line x1={start.x} y1={pathTop} x2={start.x} y2={pathTop + (pathEnd - pathTop) * st.reveal} stroke="#1F5C5A" strokeWidth={16} strokeLinecap="round" />
        <line x1={start.x} y1={pathTop} x2={start.x} y2={pathTop + (pathEnd - pathTop) * st.reveal} stroke={K.teal} strokeWidth={8} strokeLinecap="round" opacity={hand ? 0.35 : 0.95} />
        {/* the planted branch */}
        {st.plant > 0 && (
          <g>
            {st.branchLit > 0 && <path d={BRANCH} stroke={K.amber} strokeWidth={34} fill="none" opacity={0.45 * st.branchLit} filter="url(#v4-glow)" />}
            <path d={BRANCH} stroke={K.amber} strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray={BRANCH_LEN} strokeDashoffset={BRANCH_LEN * (1 - st.plant)} opacity={0.55 + 0.45 * st.branchLit} />
          </g>
        )}
        <circle cx={fork.x} cy={fork.y} r={fork.r} fill="#0A131A" stroke={st.plant > 0 ? K.amber : K.teal} strokeWidth={8} opacity={st.reveal > 0.55 ? 1 : 0} />
        <circle cx={start.x} cy={start.y} r={start.r} fill="#0E1E24" stroke={K.teal} strokeWidth={12} />
        <circle cx={start.x} cy={start.y} r={start.r * 0.42} fill={K.teal} opacity={0.9} />
        {/* target ring: the plan's destination is always shown */}
        <g opacity={st.reveal >= 1 ? 1 : 0.35 + 0.65 * st.reveal}>
          <circle cx={end.x} cy={end.y} r={end.r} fill="#0C1A20" stroke={hand ? K.amber : K.teal} strokeWidth={hand ? 14 : 10} />
          {/* one decisive replacement: the apple shrinks away as the hand lands in its place with a short overshoot */}
          {st.swap < 0.6 && (
            <g transform={`translate(${icon.x} ${icon.y}) scale(${1.25 * (1 - mj(st.swap / 0.6)) * (st.reveal >= 1 ? 1 : 0.6 + 0.4 * st.reveal)})`}>
              <AppleFlat />
            </g>
          )}
          {hand && st.swap >= 0.35 && (
            <g transform={`translate(${icon.x} ${icon.y}) scale(${mj((st.swap - 0.35) / 0.65) * iconLand + (st.swap < 1 ? 0.12 * Math.sin(Math.PI * clamp01((st.swap - 0.35) / 0.65)) : 0)})`}>
              <HandFlat s={icon.s} />
            </g>
          )}
        </g>
        {st.revealDot >= 0 && <Dot x={start.x} y={pathTop + (pathEnd - pathTop) * st.revealDot} col={K.teal} />}
        {pd && <Dot x={pd.x} y={pd.y} col={K.amber} />}
      </g>
    </g>
  );
};
