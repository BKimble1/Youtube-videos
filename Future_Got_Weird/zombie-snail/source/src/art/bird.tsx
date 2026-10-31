// A small thrush-like songbird in side view, facing -x (left). World millimetres: about 120 mm from beak to tail tip.
// Brown back and wings, a buff breast with dark drop-shaped spots, a pale eye-ring. The head moves on a neck that can
// stretch (the peck), the beak opens, the throat bulges on a swallow, the tail lifts. With xray > 0 the body turns
// glassy and its gut shows (drawn by the caller, in body-local coordinates).
import React from 'react';
import {add, closed, lerpP, mul, open, P, pt, rot, sub, tube} from '../core/geo';
import {uid} from '../core/ids';
import {clamp, hash, lerp, sm} from '../lib';

export type BirdState = {
  o: P; // body centre (world)
  ang: number; // body pitch (radians, SVG rotation: negative tips the beak down)
  head: P; // head centre relative to the body centre, in body coordinates (before pitch)
  headAng: number; // head rotation (radians, SVG rotation: negative tips the beak down)
  beak: number; // 0 closed .. 1 open
  gulp?: number; // throat bulge 0..1
  tail?: number; // tail lift 0..1
  wing?: number; // 0 folded .. 1 spread (landing)
  wingBeat?: number; // -0.5 .. 0.5: the beat's phase while spread
  blink?: number;
  xray?: number;
  interior?: () => React.ReactNode; // drawn in body coordinates inside the glassy body
  inBeak?: React.ReactNode; // drawn at the beak tip (head coordinates)
  inside?: number; // 0..1: the camera is inside the body; tissue fills the frame and the outside is hidden
  perch?: boolean;
  k?: number;
};
export const HEAD_REST: P = pt(-21, -19);

const BODY_PTS: P[] = [
  pt(-22, -9), pt(-24.5, -1), pt(-22, 7), pt(-15, 13.5), pt(-4, 16.5), pt(8, 15), pt(18, 10.5), pt(26, 5.5), pt(28, 1), pt(22, -6.5), pt(10, -12.5), pt(-4, -14.5), pt(-14, -14),
];
const SPOTS = Array.from({length: 46}, (_, i) => {
  const x = -22 + hash(i * 3.7) * 26;
  const y = -6 + hash(i * 5.1) * 19;
  return {x, y, r: 0.9 + hash(i * 2.2) * 0.8};
}).filter((s) => (s.x + 6) * (s.x + 6) / 340 + (s.y - 5) * (s.y - 5) / 120 < 1 && s.y > -5);

/** world position of the beak tip and the throat */
export const birdPoints = (b: BirdState) => {
  const k = b.k ?? 1;
  const W = (p: P) => add(b.o, mul(rot(p, b.ang), k));
  const H = (p: P) => W(add(b.head, rot(p, b.headAng)));
  return {beakTip: H(pt(-22.5, 2.6)), beakMid: H(pt(-16, 2.2)), eye: H(pt(0, 0)), headC: H(pt(0, 0)), vent: W(pt(22, 8)), W, H};
};

export const Bird: React.FC<{b: BirdState}> = ({b}) => {
  const id = uid('bd');
  const k = b.k ?? 1;
  const xr = b.xray ?? 0;
  const tail = b.tail ?? 0;
  const wing = b.wing ?? 0;
  const gulp = b.gulp ?? 0;
  const hd = b.head;
  const ha = b.headAng;
  const HP = (p: P) => add(hd, rot(p, ha));
  // neck: a soft column from the shoulders to the back of the head
  const neckA = pt(-15, -9.5), neckB = HP(pt(4, 4));
  const neckLen = Math.hypot(neckB.x - neckA.x, neckB.y - neckA.y);
  const nC: P[] = [], nR: number[] = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    const m = lerpP(neckA, neckB, u);
    nC.push(add(m, mul({x: -(neckB.y - neckA.y), y: neckB.x - neckA.x}, (0.07 * Math.sin(Math.PI * u)) / Math.max(1, neckLen / 10))));
    nR.push(lerp(10, 8.2, u) * (1 - 0.12 * clamp((neckLen - 14) / 20)) + gulp * 2.2 * Math.exp(-Math.pow((u - 0.45 + 0.3 * gulp) / 0.18, 2)));
  }
  const neck = tube(nC, nR, true, true);
  // the tail: a fan of long feathers
  const tailAng = -0.32 - 0.5 * tail;
  const tailPts = [pt(20, -3), add(pt(22, -1), rot(pt(32, -2.6), tailAng)), add(pt(22, -1), rot(pt(33.5, 1.4), tailAng)), add(pt(22, -1), rot(pt(31, 4.6), tailAng)), pt(22, 6)];
  // folded wing on the near side
  const wingPts = [pt(-12, -8), pt(-2, -11), pt(12, -9), pt(26, -4), pt(36, -1.5), pt(30, 1.8), pt(16, 4.5), pt(2, 6.5), pt(-9, 3.5)];
  // spread wing (landing): a broad wing from the shoulder with fingered primaries, beating up and down
  const sh = pt(-6, -8);
  const spread = [pt(0, 0), pt(-6, -14), pt(-8, -30), pt(-4, -44), pt(0, -47), pt(4, -42), pt(9, -45), pt(12, -39), pt(17, -40), pt(19, -33), pt(24, -32), pt(24, -24), pt(20, -12), pt(12, -2)]
    .map((p) => add(sh, mul(rot(p, -0.25 - 1.15 * (b.wingBeat ?? 0)), clamp(wing * 2.2))));
  const wingD = closed(wingPts, 0.9);
  const spreadD = wing > 0.01 ? closed(spread, 0.5) : null;
  const ins = b.inside ?? 0;
  const glass = (1 - 0.8 * xr) * (1 - ins);
  // beak
  const open_ = b.beak;
  const upper = [pt(-8.6, -1.6), pt(-15, -0.4), pt(-22.5, 1.9), pt(-21.5, 2.7), pt(-15, 2.4), pt(-8.4, 2.4)];
  const lowerBase = [pt(-8.4, 2.6), pt(-15, 2.6), pt(-21.4, 2.9), pt(-20.6, 3.8), pt(-14, 4.6), pt(-8, 5.2)];
  const lower = lowerBase.map((p) => add(pt(-8, 3.2), rot(sub(p, pt(-8, 3.2)), 0.42 * open_)));
  const featherMarks: React.ReactNode[] = [];
  for (let i = 0; i < 70; i++) {
    const x = -20 + hash(i * 1.37) * 44;
    const y = -12 + hash(i * 4.11) * 24;
    if ((x - 2) * (x - 2) / 650 + (y - 1) * (y - 1) / 190 > 1) continue;
    featherMarks.push(<path key={i} d={`M${x - 1.6} ${y - 0.4} Q${x} ${y + 1} ${x + 1.6} ${y - 0.4}`} fill="none" stroke={y < -2 ? '#3B2814' : '#9C7A50'} strokeWidth={0.32} strokeOpacity={0.35} />);
  }
  const blink = b.blink ?? 0;
  return (
    <g transform={`translate(${b.o.x} ${b.o.y}) rotate(${(b.ang * 180) / Math.PI}) scale(${k})`}>
      <defs>
        <radialGradient id={`${id}b`} cx="-8" cy="-10" r="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E9D6AE" />
          <stop offset="0.55" stopColor="#CDB083" />
          <stop offset="1" stopColor="#8E6E46" />
        </radialGradient>
        <linearGradient id={`${id}back`} x1="0" y1="-15" x2="0" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6B4A26" />
          <stop offset="0.6" stopColor="#7E5A31" stopOpacity={0.85} />
          <stop offset="1" stopColor="#7E5A31" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="-10" y1="-10" x2="30" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#80592F" />
          <stop offset="0.6" stopColor="#5F4122" />
          <stop offset="1" stopColor="#3E2A15" />
        </linearGradient>
        <radialGradient id={`${id}h`} cx="-3" cy="-6" r="14" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8A6438" />
          <stop offset="1" stopColor="#5A3D1E" />
        </radialGradient>
        <linearGradient id={`${id}n`} gradientUnits="userSpaceOnUse" x1={nC[5].x + 9 * (neckB.y - neckA.y) / neckLen} y1={nC[5].y - 9 * (neckB.x - neckA.x) / neckLen} x2={nC[5].x - 9 * (neckB.y - neckA.y) / neckLen} y2={nC[5].y + 9 * (neckB.x - neckA.x) / neckLen}>
          <stop offset="0" stopColor="#E3CC9E" />
          <stop offset="0.45" stopColor="#C9A877" />
          <stop offset="0.75" stopColor="#7E5A31" />
          <stop offset="1" stopColor="#62441F" />
        </linearGradient>
        <filter id={`${id}tx`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={3} seed={11} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.16  0 0 0 0 0.1  0 0 0 0 0.04  0 0 0 -1.8 1.0" />
        </filter>
        <filter id={`${id}s`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
        <clipPath id={`${id}c`}>
          <path d={closed(BODY_PTS, 0.95)} />
        </clipPath>
      </defs>
      <g opacity={glass}>
        {/* tail */}
        <path d={closed(tailPts, 0.6)} fill="#5A3E20" />
        <path d={open([tailPts[0], tailPts[2]])} stroke="#3A2812" strokeWidth={0.5} opacity={0.5} />
        {/* far leg */}
        {b.perch !== false && <path d="M2 14 L0 24 L-3 27 M0 24 L4 27" fill="none" stroke="#B48A62" strokeWidth={1.3} strokeLinecap="round" />}
        {/* body */}
        <path d={closed(BODY_PTS, 0.95)} fill={`url(#${id}b)`} />
        <g clipPath={`url(#${id}c)`}>
          <path d={closed(BODY_PTS, 0.95)} fill={`url(#${id}back)`} />
          {SPOTS.map((s, i) => (
            <path key={i} d={`M${s.x} ${s.y - s.r * 1.3} C${s.x + s.r} ${s.y - s.r * 0.2} ${s.x + s.r * 0.8} ${s.y + s.r} ${s.x} ${s.y + s.r} C${s.x - s.r * 0.8} ${s.y + s.r} ${s.x - s.r} ${s.y - s.r * 0.2} ${s.x} ${s.y - s.r * 1.3}Z`} fill="#3A2614" opacity={0.75} />
          ))}
          {featherMarks}
          <rect x={-30} y={-20} width={62} height={40} filter={`url(#${id}tx)`} opacity={0.45} />
          <ellipse cx={4} cy={16} rx={26} ry={6} fill="#5E4428" opacity={0.35} filter={`url(#${id}s)`} />
        </g>
      </g>
      {/* gut, seen through the glassy body */}
      {ins > 0.01 && <rect x={-400} y={-400} width={800} height={800} fill="#3A1414" opacity={ins} />}
      {xr > 0.01 && b.interior && (
        <g opacity={sm(xr)}>
          <g clipPath={ins > 0.5 ? undefined : `url(#${id}c)`}>{b.interior()}</g>
          <path d={closed(BODY_PTS, 0.95)} fill="none" stroke="#F3EDE0" strokeWidth={0.5} strokeOpacity={0.6 * xr * (1 - ins)} />
        </g>
      )}
      <g opacity={glass}>
        {/* wing */}
        <path d={wingD} fill={`url(#${id}w)`} />
        {spreadD && <path d={spreadD} fill={`url(#${id}w)`} />}
        {wing < 0.3 && (
          <g>
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={i} d={open([pt(8 + i * 4.2, -6 + i * 0.7), pt(16 + i * 4, -1.4 + i * 0.6), pt(22 + i * 2.6, 1.2 + i * 0.3)])} fill="none" stroke="#C9A06A" strokeWidth={0.45} strokeOpacity={0.55} />
            ))}
            {[0, 1, 2, 3, 4, 5].map((i) => <ellipse key={i} cx={-4 + i * 3.3} cy={-6.5 + i * 0.4} rx={1.1} ry={0.7} fill="#D9B98A" opacity={0.6} />)}
          </g>
        )}
        {/* neck */}
        <path d={closed(neck.outline, 0.9)} fill={`url(#${id}n)`} />
        {/* head */}
        <g transform={`translate(${hd.x} ${hd.y}) rotate(${(ha * 180) / Math.PI})`}>
          <ellipse cx={1.5} cy={0.5} rx={10.2} ry={9.2} fill={`url(#${id}h)`} />
          <path d="M-9 1.5 C-7 7 -1 10.5 6 9 C3 10.5 -4 11 -8.5 7 Z" fill="#E8D3A8" />
          <path d="M-6 6.5 C-3 8.6 0 9 2.6 8.8" fill="none" stroke="#3E2A16" strokeWidth={0.9} strokeOpacity={0.7} />

          {Array.from({length: 22}, (_, i) => {
            const x = -6 + hash(i * 2.9 + 1) * 15;
            const y = -8.5 + hash(i * 6.3 + 2) * 9;
            return <path key={i} d={`M${x - 1.1} ${y} Q${x} ${y + 0.8} ${x + 1.1} ${y}`} fill="none" stroke="#3E2A14" strokeWidth={0.28} strokeOpacity={0.4} />;
          })}
          {/* eye */}
          <circle cx={0} cy={0} r={2.75} fill="#B9A27A" />
          <circle cx={0} cy={0} r={2.35} fill="#0B0806" />
          <circle cx={-0.2} cy={-0.1} r={1.6} fill="#2A1A10" opacity={0.6} />
          <ellipse cx={-0.85} cy={-0.85} rx={0.5} ry={0.4} fill="#FFFFFF" opacity={0.7} />
          {blink > 0.02 && <ellipse cx={0} cy={-2.8 + 2.8 * blink} rx={2.9} ry={2.8 * blink} fill="#6E4F2B" />}
          {/* beak */}
          <path d={closed(lower, 0.6)} fill="#C2A27A" />
          <path d={closed(upper, 0.6)} fill="#4A3A2A" />
          <path d={open([pt(-9, -0.8), pt(-16, 0.3), pt(-21, 1.9)])} fill="none" stroke="#8A7458" strokeWidth={0.35} opacity={0.7} />
          {b.inBeak}
        </g>
        {/* near leg and toes round the perch */}
        {b.perch !== false && <path d="M8 13 L9 23 L5 26.5 M9 23 L13 26.5 M9 23 L9.5 27" fill="none" stroke="#C49B70" strokeWidth={1.4} strokeLinecap="round" />}
      </g>
    </g>
  );
};
void sm;
