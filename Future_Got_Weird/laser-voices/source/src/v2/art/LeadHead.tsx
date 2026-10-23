// The lead: the red-haired Weird Crew character, head PORTED from FGW Infrared Contacts (source/src/art/Lead.tsx,
// `LeadHead`): same silhouette, spiky hair, near eye, lids, lashes, brow, nose wing and mouth, same colours.
// V2 changes (documented in production/V2_QA_REPORT.md):
//   - a visible profile ear, drawn over the head and under the hair edge (the Contacts head hid its ear behind the
//     skin fill). EAR_OPEN is the entrance of the ear canal: the anchor for every ear close-up and the mechanism.
//   - expression controls for this film: `open` (mouth), `knit` (inner brow down / outer up), negative `lid` (eye
//     widened), negative `smirk` (mouth corner down).
// L1 units: the near eye's fissure centre is the origin, the head is ~630 units tall, the figure faces right.
import React from 'react';
import {LEADC as L, C} from '../theme2';
import {Pt, P, lerp, smooth, clamp} from '../lib2';

export type LeadPose = {
  lid: number; // -0.35 widened .. 0 open .. 1 closed
  squeeze: number; // lower lid lift
  brow: number; // -1 low .. 1 raised
  knit: number; // 0 .. 1 inner end of the brow pulled down (concentration, puzzlement)
  smirk: number; // -1 corner down .. 1 corner up
  open: number; // 0 .. 1 mouth open
  gx: number; gy: number; // gaze
  tilt: number; // head rotation (deg) about NECK
};
export const POSE0: LeadPose = {lid: 0, squeeze: 0, brow: 0.25, knit: 0, smirk: 0, open: 0, gx: 0.15, gy: 0, tilt: 0};
export const NECK = P(-30, 250);
export const EAR_OPEN = P(-146, 44); // ear canal entrance (head coords)
export const EAR_RIM = P(-196, 34); // back of the helix

export const EYE = {L: P(-46, 4), M: P(44, 8), iris: P(16, 3), irx: 17, iry: 24};
const cub = (a: Pt, c1: Pt, c2: Pt, b: Pt) => `M${a.x} ${a.y}C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`;
const bez = (a: Pt, c1: Pt, c2: Pt, b: Pt, t: number): Pt => {
  const u = 1 - t;
  return {x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x, y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y};
};
export const upperLid = (k: number) => ({a: EYE.L, c1: P(lerp(-22, -18, k), lerp(-44, 24, k)), c2: P(20, lerp(-43, 27, k)), b: EYE.M});
export const lowerLid = (sq: number) => ({a: EYE.M, c1: P(20, lerp(31, 22, sq)), c2: P(-20, lerp(30, 21, sq)), b: EYE.L});
export const fissurePath = (k: number, sq: number) => {
  const u = upperLid(k), l = lowerLid(sq);
  return `M${u.a.x} ${u.a.y}C${u.c1.x} ${u.c1.y} ${u.c2.x} ${u.c2.y} ${u.b.x} ${u.b.y}C${l.c1.x} ${l.c1.y} ${l.c2.x} ${l.c2.y} ${l.b.x} ${l.b.y}Z`;
};

export const HEAD = smooth([
  P(-262, -40), P(-236, -190), P(-150, -292), P(-30, -334), P(70, -300), P(122, -214), P(132, -126), P(122, -64),
  P(112, -26), P(126, 18), P(150, 58), P(160, 76), P(146, 92), P(128, 96), P(124, 108), P(132, 122), P(124, 132),
  P(128, 146), P(120, 160), P(116, 192), P(98, 222), P(62, 238), P(10, 232), P(-50, 208), P(-104, 168), P(-140, 120),
  P(-170, 90), P(-214, 70), P(-252, 30),
], true, 0.17);
const HAIR_BACK = smooth([
  P(-280, 10), P(-292, -90), P(-270, -170), P(-300, -214), P(-238, -228), P(-232, -292), P(-170, -288), P(-150, -350),
  P(-96, -318), P(-62, -384), P(-18, -336), P(30, -392), P(58, -330), P(110, -366), P(118, -292), P(162, -290),
  P(134, -232), P(108, -212), P(60, -214), P(10, -186), P(-40, -150), P(-80, -96), P(-96, -40), P(-110, -6), P(-140, -30),
  P(-176, -40), P(-210, -10), P(-236, 40),
], true, 0.14);
const HAIR_LOCKS = [
  [P(-62, -384), P(-48, -330), P(-60, -280)],
  [P(30, -392), P(26, -330), P(6, -282)],
  [P(110, -366), P(84, -310), P(54, -262)],
  [P(-150, -350), P(-136, -300), P(-150, -246)],
  [P(-232, -292), P(-210, -250), P(-212, -200)],
  [P(162, -290), P(120, -262), P(80, -236)],
];
// the ear (new in V2): helix rim at the back, lobe, antihelix, concha and the canal entrance facing forward-down
const EAR_OUT = smooth([P(-128, -6), P(-150, -26), P(-182, -22), P(-200, 8), P(-198, 46), P(-186, 78), P(-166, 98), P(-146, 96), P(-136, 82), P(-132, 66)], false, 0.18);
export const EarShape: React.FC<{accent?: number; sk?: number}> = ({accent = 0, sk = 1}) => (
  <g>
    <path d={EAR_OUT + 'C-128 50 -120 30 -122 14Z'} fill={L.skin} stroke={C.ink} strokeWidth={3.2 * sk} strokeLinejoin="round" />
    {/* helix fold along the rim */}
    <path d="M-140 -10 C-168 -20 -190 0 -188 34 C-186 60 -176 80 -160 88" fill="none" stroke={L.skinDeep} strokeWidth={4.5 * Math.max(sk, 0.5)} strokeLinecap="round" />
    {/* antihelix and concha */}
    <path d="M-150 4 C-170 10 -176 34 -166 58" fill="none" stroke={L.skinShade} strokeWidth={4 * Math.max(sk, 0.5)} strokeLinecap="round" />
    <path d="M-156 30 C-166 40 -164 56 -150 60 C-140 58 -136 48 -140 38 Z" fill={L.skinDeep} opacity={0.55} />
    {/* canal entrance and tragus */}
    <ellipse cx={EAR_OPEN.x} cy={EAR_OPEN.y} rx={6} ry={8} fill="#7A4A3A" />
    <path d="M-128 30 C-122 38 -124 50 -132 56" fill="none" stroke={L.skinDeep} strokeWidth={3.4 * Math.max(sk, 0.5)} strokeLinecap="round" />
    {accent > 0.01 && <ellipse cx={EAR_OPEN.x - 4} cy={EAR_OPEN.y} rx={30} ry={38} fill="none" stroke={C.saffron} strokeWidth={5} opacity={accent} />}
  </g>
);

export const LeadHead: React.FC<{p: LeadPose; id: string; accent?: number; sk?: number}> = ({p, id, accent = 0, sk = 1}) => {
  const u = upperLid(p.lid), lo = lowerLid(p.squeeze);
  const fis = fissurePath(p.lid, p.squeeze);
  const ir = {x: EYE.iris.x + p.gx * 6, y: EYE.iris.y + p.gy * 5};
  const browY = -66 - p.brow * 13;
  const kn = p.knit;
  const k = clamp(p.lid);
  const crease = cub(P(-44, -4 + 4 * k), P(-20, lerp(-60, -16, k) - 8 * clamp(-p.lid / 0.35)), P(22, lerp(-60, -14, k) - 8 * clamp(-p.lid / 0.35)), P(42, lerp(-4, 4, k)));
  const lashes = Array.from({length: 9}, (_, i) => {
    const s = 0.1 + i * 0.1;
    const b = bez(u.a, u.c1, u.c2, u.b, s);
    const ln = lerp(13, 8, Math.abs(s - 0.25) * 1.2);
    const ang = lerp(-118, -4, k) + lerp(-26, 24, s) * (1 - k * 0.6);
    const r = (ang * Math.PI) / 180;
    const tip = P(b.x + Math.cos(r) * ln, b.y + Math.sin(r) * ln);
    const mid = P((b.x + tip.x) / 2 - Math.sin(r) * 2.5, (b.y + tip.y) / 2 + Math.cos(r) * 2.5);
    return `M${b.x} ${b.y}Q${mid.x} ${mid.y} ${tip.x} ${tip.y}`;
  });
  const mouthNear = P(100, 135 - 10 * p.smirk);
  const op = clamp(p.open);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-skin`} cx="0.62" cy="0.38" r="0.75">
          <stop offset="0" stopColor={L.skinLight} />
          <stop offset="0.55" stopColor={L.skin} />
          <stop offset="1" stopColor={L.skinShade} />
        </radialGradient>
        <radialGradient id={`${id}-iris`} cx="0.45" cy="0.42" r="0.6">
          <stop offset="0" stopColor={L.irisLight} />
          <stop offset="0.65" stopColor={L.iris} />
          <stop offset="1" stopColor={L.irisDeep} />
        </radialGradient>
        <linearGradient id={`${id}-hair`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={L.hairLight} />
          <stop offset="0.6" stopColor={L.hair} />
          <stop offset="1" stopColor={L.hairShade} />
        </linearGradient>
        <radialGradient id={`${id}-sclera`} cx="0.55" cy="0.45" r="0.6">
          <stop offset="0.6" stopColor={L.sclera} />
          <stop offset="1" stopColor={L.scleraShade} />
        </radialGradient>
        <clipPath id={`${id}-fis`}><path d={fis} /></clipPath>
        <clipPath id={`${id}-head`}><path d={HEAD} /></clipPath>
      </defs>
      <path d={HEAD} fill={`url(#${id}-skin)`} stroke={C.ink} strokeWidth={3.2 * sk} strokeLinejoin="round" />
      <g clipPath={`url(#${id}-head)`}>
        <path d="M-120 150 C-60 214 30 246 110 210 L130 300 L-160 300 Z" fill={L.skinShade} opacity={0.45} />
        <ellipse cx={30} cy={80} rx={40} ry={20} fill={C.coral} opacity={0.32} />
        <path d="M64 -40 C80 -10 90 30 96 52" stroke={L.skinShade} strokeWidth={10} fill="none" opacity={0.35} strokeLinecap="round" />
        {/* soft shadow the ear casts on the cheek */}
        <path d="M-128 0 C-112 30 -112 70 -128 96 L-150 96 L-150 0 Z" fill={L.skinShade} opacity={0.35} />
      </g>
      <EarShape accent={accent} sk={sk} />
      <path d="M118 78 C108 70 108 92 124 92" fill="none" stroke={L.skinDeep} strokeWidth={3.4} strokeLinecap="round" />
      {/* mouth: closed line (longer than the Contacts one so the corner reads at phone size), or an open oval */}
      {op > 0.04 ? (
        <g>
          <path d={`M88 ${136 - 4 * op} C92 ${124 - 8 * op} 124 ${122 - 8 * op} 128 ${132 - 2 * op} C130 ${146 + 22 * op} 98 ${152 + 26 * op} 88 ${136 - 4 * op}Z`} fill="#6E2F28" stroke={L.lip} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M98 ${146 + 18 * op} Q110 ${138 + 16 * op} 122 ${144 + 16 * op}`} fill="none" stroke="#C25A55" strokeWidth={7} opacity={0.75 * op} strokeLinecap="round" />
          <path d={`M96 ${128 - 6 * op} Q110 ${124 - 7 * op} 124 ${128 - 5 * op}`} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.8 * op} strokeLinecap="round" />
        </g>
      ) : (
        <path d={`M${mouthNear.x - 14} ${mouthNear.y + 4 * p.smirk} Q${mouthNear.x - 2} ${mouthNear.y + 1} ${mouthNear.x} ${mouthNear.y} Q114 ${136 - 2 * p.smirk} 127 131`} fill="none" stroke={L.lip} strokeWidth={5} strokeLinecap="round" />
      )}
      {p.smirk > 0.05 && op < 0.04 && <path d={`M${mouthNear.x - 4} ${mouthNear.y - 6} q-3 6 1 11`} fill="none" stroke={L.skinDeep} strokeWidth={2.5} strokeLinecap="round" opacity={p.smirk} />}
      {/* the near eye */}
      <g clipPath={`url(#${id}-fis)`}>
        <path d={fis} fill={`url(#${id}-sclera)`} />
        <ellipse cx={ir.x} cy={ir.y} rx={EYE.irx} ry={EYE.iry} fill={`url(#${id}-iris)`} />
        {Array.from({length: 14}, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          return <line key={i} x1={ir.x + Math.cos(a) * 8} y1={ir.y + Math.sin(a) * 11} x2={ir.x + Math.cos(a) * 15.5} y2={ir.y + Math.sin(a) * 22} stroke={L.irisDeep} strokeWidth={1} opacity={0.35} />;
        })}
        <ellipse cx={ir.x} cy={ir.y} rx={EYE.irx} ry={EYE.iry} fill="none" stroke={L.irisDeep} strokeWidth={2} />
        <ellipse cx={ir.x + 0.6} cy={ir.y} rx={7.2} ry={10.2} fill="#120D0A" />
        <ellipse cx={ir.x - 5} cy={ir.y - 9} rx={4.2} ry={5} fill="#FFFFFF" opacity={0.95} />
        <circle cx={ir.x + 6} cy={ir.y + 8} r={1.8} fill="#FFFFFF" opacity={0.75} />
        <path d={cub(u.a, P(u.c1.x, u.c1.y + 7), P(u.c2.x, u.c2.y + 7), u.b)} fill="none" stroke="#8C6A5E" strokeWidth={8} opacity={0.28} />
      </g>
      <path d={`${cub(u.a, u.c1, u.c2, u.b)}C${EYE.M.x - 2} ${lerp(-30, 0, k)} ${EYE.L.x + 2} ${lerp(-30, -2, k)} ${EYE.L.x} ${EYE.L.y}Z`} fill={L.skinShade} opacity={0.18 + 0.12 * k} />
      <path d={crease} fill="none" stroke={L.skinDeep} strokeWidth={2.6} strokeLinecap="round" opacity={0.75 * (1 - 0.85 * k)} />
      <path d={cub(u.a, u.c1, u.c2, u.b)} fill="none" stroke={L.lash} strokeWidth={4.6} strokeLinecap="round" />
      <path d={cub(lo.a, lo.c1, lo.c2, lo.b)} fill="none" stroke={L.skinDeep} strokeWidth={2.4} strokeLinecap="round" opacity={0.9 * (1 - 0.7 * k)} />
      <path d={lashes.join('')} fill="none" stroke={L.lash} strokeWidth={2.6} strokeLinecap="round" />
      <circle cx={EYE.M.x - 1} cy={EYE.M.y} r={2.6} fill="#E99A90" />
      {/* brow: `knit` drops the inner (nose-side) end and lifts the outer end */}
      <path d={`M-52 ${browY + 10 - 6 * kn} C-30 ${browY - 8 - 4 * kn} 20 ${browY - 14 + 4 * kn} 60 ${browY - 2 + p.brow * 3 + 14 * kn} C40 ${browY + 2 + 10 * kn} -10 ${browY + 2} -52 ${browY + 10 - 6 * kn}Z`} fill={L.brow} stroke={L.brow} strokeWidth={6} strokeLinejoin="round" />
      {kn > 0.1 && <path d={`M58 ${browY + 6 + 10 * kn} q8 -10 6 -22`} fill="none" stroke={L.skinDeep} strokeWidth={2.4} opacity={kn * 0.8} strokeLinecap="round" />}
      <path d={HAIR_BACK} fill={`url(#${id}-hair)`} stroke={C.ink} strokeWidth={3.2 * sk} strokeLinejoin="round" />
      {HAIR_LOCKS.map((pts, i) => <path key={i} d={smooth(pts)} fill="none" stroke={L.hairShade} strokeWidth={4} strokeLinecap="round" opacity={0.8} />)}
    </g>
  );
};
