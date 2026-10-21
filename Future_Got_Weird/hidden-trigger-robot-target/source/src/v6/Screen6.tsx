// V6 monitor graphic: the V4 diagram (teal path to the target, the amber branch planted in advance, one request line)
// with a faster, clearer trigger beat. The normal request first shows its plan reaching the apple (teal); the marker
// snaps into the request with one amber flash; its pulse runs down to the fork, the teal route beyond the fork dims as
// the pulse is diverted along the amber branch, the target ring turns amber as it arrives, and the apple is replaced
// by the hand on "switched". A simplified software illustration; no labels.
import React from 'react';
import {mj, clamp01, ramp} from '../v3/proj';
import {K} from '../v3/World3';
import {HandFlat} from '../v3/Screen3';
import {SC4} from '../v4/Screen4';
import {SH6, W3} from './theme6';

const BR = [[566, 742], [800, 756], [870, 840], [690, 890]];
const BRANCH = `M ${BR[0][0]} ${BR[0][1]} C ${BR[1][0]} ${BR[1][1]} ${BR[2][0]} ${BR[2][1]} ${BR[3][0]} ${BR[3][1]}`;
const BRANCH_LEN = 470;
const bez = (u: number) => {
  const m = 1 - u;
  const c = (i: number) => m ** 3 * BR[0][i] + 3 * m * m * u * BR[1][i] + 3 * m * u * u * BR[2][i] + u ** 3 * BR[3][i];
  return {x: c(0), y: c(1)};
};

export type S6 = {
  reveal: number; // the teal path draws from the start node to the target (0..1)
  plant: number; // amber branch grows in (0..1)
  branchLit: number; // 0 dormant .. 1 lit
  req: number;
  marker: number; // marker snaps into the request (0..1)
  flash: number; // amber ring from the seated marker (0..1, -1 none)
  normalDot: number; // the normal plan's teal dot, start -> apple (0..1, -1 none)
  pulse: number; // the trigger pulse: marker -> start -> fork -> branch -> target (0..1, -1 none)
  divert: number; // 0..1: the teal route beyond the fork dims as the pulse takes the branch
  ringAmber: number; // 0..1: the target ring turns amber as the diverted pulse arrives
  revealDot: number; // the reveal's travelling dot
  swap: number; // apple -> hand (0..1)
  land: number; // 0..1 settle of the hand icon after the swap
};

export const screen6 = (t: number): S6 => {
  const s: S6 = {reveal: 1, plant: 1, branchLit: 0, req: 0, marker: 0, flash: -1, normalDot: -1, pulse: -1, divert: 0, ringAmber: 0, revealDot: -1, swap: 0, land: 1};
  if (t < SH6.both) {
    s.reveal = ramp(t, SH6.screen + 0.05, SH6.screen + 0.45);
    s.revealDot = s.reveal > 0 && s.reveal < 1 ? s.reveal : -1;
    s.plant = clamp01((t - (W3.planted + 0.02)) / 0.45);
    s.branchLit = s.plant > 0 ? 1 - ramp(t, W3.planted + 0.55, W3.planted + 1.0) : 0;
    return s;
  }
  if (t < SH6.handMatch) {
    s.req = ramp(t, SH6.request + 0.02, SH6.request + 0.2);
    // the normal request: its plan runs to the apple
    const nd = (t - 16.42) / 0.4;
    s.normalDot = nd > 0 && nd < 1 ? mj(nd) : -1;
    // the trigger: the marker snaps in on "trigger" and flashes once
    s.marker = ramp(t, W3.trigger3 - 0.06, W3.trigger3 + 0.06);
    const fl = (t - (W3.trigger3 + 0.06)) / 0.28;
    s.flash = fl > 0 && fl < 1 ? fl : -1;
    // its pulse: marker -> start (17.00-17.31), start -> fork (-17.56), along the branch to the ring (-18.25)
    const p = (t - 17.0) / 1.25;
    s.pulse = p > 0 && p < 1 ? p : -1;
    s.divert = ramp(t, 17.52, 17.7);
    s.branchLit = ramp(t, 17.5, 17.7);
    s.ringAmber = ramp(t, 18.18, 18.32);
    s.swap = clamp01((t - (W3.switched - 0.04)) / 0.2);
    s.land = clamp01((t - (W3.switched + 0.16)) / 0.16);
    return s;
  }
  // the familiar diagram, no request: the planted branch is still there, waiting
  s.branchLit = 0.3 * ramp(t, SH6.branch + 0.2, SH6.branch + 0.7);
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

export const Screen6: React.FC<{st: S6}> = ({st}) => {
  const {start, fork, end, req, token, icon, k} = SC4;
  const pathTop = start.y + start.r, pathEnd = end.y - end.r;
  const forkTop = fork.y - fork.r, forkBot = fork.y + fork.r;
  const hand = st.swap > 0;
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
  const yAt = (u: number) => pathTop + (pathEnd - pathTop) * u;
  const lowerY = yAt(st.reveal);
  const lowerOp = (hand ? 0.35 : 0.95) * (1 - 0.7 * st.divert);
  return (
    <g>
      <defs>
        <pattern id="v6-scr-dots" x={0} y={0} width={36} height={36} patternUnits="userSpaceOnUse">
          <circle cx={18} cy={18} r={2} fill="#13232C" />
        </pattern>
        <filter id="v6-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#v6-scr-dots)" />
      <g transform={`translate(${start.x} ${start.y}) scale(${k}) translate(${-start.x} ${-start.y})`}>
        {st.req > 0 && (
          <g opacity={st.req} transform={`translate(0 ${(1 - st.req) * -60})`}>
            <rect x={req.x} y={req.y} width={req.w} height={req.h} rx={req.h / 2} fill="#E9F3F6" stroke={st.marker >= 1 ? K.amber : K.teal} strokeWidth={6} />
            <text x={req.x + 56} y={req.y + req.h / 2 + 22} fontFamily='"JetBrains Mono", monospace' fontWeight={700} fontSize={64} fill="#0E1A22">Cut the apple</text>
            {st.marker > 0 && (
              // the marker snaps into the end of the request from the right
              <g transform={`translate(${token.x + (1 - st.marker) * 240} ${token.y}) rotate(45)`} opacity={Math.min(1, st.marker * 3)}>
                <rect x={-24} y={-24} width={48} height={48} rx={7} fill={K.amber} stroke="#FFE0A8" strokeWidth={4} />
              </g>
            )}
            {st.flash >= 0 && <circle cx={token.x} cy={token.y} r={30 + 110 * mj(st.flash)} fill="none" stroke={K.amber} strokeWidth={10 * (1 - st.flash) + 2} opacity={0.85 * (1 - st.flash)} />}
          </g>
        )}
        {/* teal path: start node -> fork (upper) and fork -> target ring (lower, dims when the pulse is diverted) */}
        <line x1={start.x} y1={pathTop} x2={start.x} y2={Math.min(lowerY, forkTop)} stroke="#1F5C5A" strokeWidth={16} strokeLinecap="round" />
        <line x1={start.x} y1={pathTop} x2={start.x} y2={Math.min(lowerY, forkTop)} stroke={K.teal} strokeWidth={8} strokeLinecap="round" opacity={hand ? 0.35 : 0.95} />
        {lowerY > forkBot && (
          <g opacity={lowerOp / 0.95}>
            <line x1={start.x} y1={forkBot} x2={start.x} y2={lowerY} stroke="#1F5C5A" strokeWidth={16} strokeLinecap="round" />
            <line x1={start.x} y1={forkBot} x2={start.x} y2={lowerY} stroke={K.teal} strokeWidth={8} strokeLinecap="round" opacity={0.95} />
          </g>
        )}
        {/* the planted branch */}
        {st.plant > 0 && (
          <g>
            {st.branchLit > 0 && <path d={BRANCH} stroke={K.amber} strokeWidth={34} fill="none" opacity={0.45 * st.branchLit} filter="url(#v6-glow)" />}
            <path d={BRANCH} stroke={K.amber} strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray={BRANCH_LEN} strokeDashoffset={BRANCH_LEN * (1 - st.plant)} opacity={0.55 + 0.45 * st.branchLit} />
          </g>
        )}
        <circle cx={fork.x} cy={fork.y} r={fork.r} fill="#0A131A" stroke={st.plant > 0 ? K.amber : K.teal} strokeWidth={8} opacity={st.reveal > 0.55 ? 1 : 0} />
        <circle cx={start.x} cy={start.y} r={start.r} fill="#0E1E24" stroke={K.teal} strokeWidth={12} />
        <circle cx={start.x} cy={start.y} r={start.r * 0.42} fill={K.teal} opacity={0.9} />
        {/* target ring: the plan's destination is always shown */}
        <g opacity={st.reveal >= 1 ? 1 : 0.35 + 0.65 * st.reveal}>
          <circle cx={end.x} cy={end.y} r={end.r} fill="#0C1A20" stroke={K.teal} strokeWidth={10} />
          {(hand || st.ringAmber > 0) && <circle cx={end.x} cy={end.y} r={end.r} fill="none" stroke={K.amber} strokeWidth={10 + 4 * (hand ? 1 : st.ringAmber)} opacity={hand ? 1 : st.ringAmber} />}
          {/* one decisive replacement: the hand pops in at once behind the apple, which shrinks away over it (the ring
              is never empty), with one amber shock ring */}
          {hand && st.swap < 1 && <circle cx={end.x} cy={end.y} r={end.r + 70 * mj(st.swap)} fill="none" stroke={K.amber} strokeWidth={14 * (1 - st.swap) + 2} opacity={0.8 * (1 - st.swap)} />}
          {hand && (
            <g transform={`translate(${icon.x} ${icon.y}) scale(${(0.72 + 0.28 * mj(st.swap / 0.5)) * iconLand + (st.swap < 1 ? 0.1 * Math.sin(Math.PI * st.swap) : 0)})`}>
              <HandFlat s={icon.s} />
            </g>
          )}
          {st.swap < 0.45 && (
            <g transform={`translate(${icon.x} ${icon.y}) scale(${1.25 * (1 - mj(st.swap / 0.45)) * (st.reveal >= 1 ? 1 : 0.6 + 0.4 * st.reveal)})`}>
              <AppleFlat />
            </g>
          )}
        </g>
        {st.revealDot >= 0 && <Dot x={start.x} y={yAt(st.revealDot)} col={K.teal} />}
        {st.normalDot >= 0 && <Dot x={start.x} y={yAt(st.normalDot)} col={K.teal} />}
        {pd && <Dot x={pd.x} y={pd.y} col={K.amber} />}
      </g>
    </g>
  );
};
