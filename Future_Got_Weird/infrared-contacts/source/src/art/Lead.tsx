// The lead: the red-haired Weird Crew contestant (cast "guesser") redrawn for close-ups in the FGW Shorts style.
// L1 units: the near eye's fissure centre is the origin, the head is ~600 units tall, the figure faces right (3/4
// profile, near eye in 3/4). One rig serves the extreme close-up (lens insertion), the face shots and the seated figure
// in the train. The head group rotates about NECK; the eye section (L2) is attached to the same head transform.
import React from 'react';
import {LEADC as L, C} from '../theme';
import {Pt, P, lerp, lerpP, smooth, clamp, NECK, rot} from '../lib';

export type LeadPose = {
  lid: number; // 0 open .. 1 closed (upper lid)
  squeeze: number; // 0 .. 1 lower lid lift (reflex on lens contact)
  brow: number; // -1 relaxed/low .. 1 raised
  smirk: number; // 0 .. 1 near mouth corner lifts
  gx: number; // gaze -1..1 (x)
  gy: number; // gaze -1..1 (y)
  tilt: number; // head tilt (deg, + = clockwise, chin down/forward)
  lensOn: number; // 0 .. 1 lens seated on the eye (rim spreads as it settles)
  breath: number; // -1..1
  arm: number; // 0 near hand in lap .. 1 raised (unused in close-ups)
};
export const POSE0: LeadPose = {lid: 0, squeeze: 0, brow: 0.25, smirk: 0, gx: 0.15, gy: 0, tilt: 0, lensOn: 0, breath: 0, arm: 0};

// ---- eye geometry (L1, in head-group coordinates) ----
export const EYE = {
  L: P(-46, 4), // lateral corner (toward the ear)
  M: P(44, 8), // medial corner (toward the nose)
  iris: P(16, 3), irx: 17, iry: 24,
  lens: {rx: 23, ry: 31},
};
const cub = (a: Pt, c1: Pt, c2: Pt, b: Pt) => `M${a.x} ${a.y}C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`;
const bez = (a: Pt, c1: Pt, c2: Pt, b: Pt, t: number): Pt => {
  const u = 1 - t;
  return {x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x, y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y};
};
// upper lid margin control points for closure k (open lid arches over the eyeball, closed lid rests on the lower lid
// and still bulges a little: the lid wraps the cornea)
export const upperLid = (k: number) => {
  const e = k; // linear in control space reads as a smooth wrap
  return {a: EYE.L, c1: P(lerp(-22, -18, e), lerp(-44, 24, e)), c2: P(lerp(20, 20, e), lerp(-43, 27, e)), b: EYE.M};
};
export const lowerLid = (sq: number) => ({a: EYE.M, c1: P(20, lerp(31, 22, sq)), c2: P(-20, lerp(30, 21, sq)), b: EYE.L});
export const fissurePath = (k: number, sq: number) => {
  const u = upperLid(k), l = lowerLid(sq);
  return `M${u.a.x} ${u.a.y}C${u.c1.x} ${u.c1.y} ${u.c2.x} ${u.c2.y} ${u.b.x} ${u.b.y}C${l.c1.x} ${l.c1.y} ${l.c2.x} ${l.c2.y} ${l.b.x} ${l.b.y}Z`;
};

// ---- head silhouette (3/4 profile facing right) ----
const HEAD = smooth([
  P(-262, -40), P(-236, -190), P(-150, -292), P(-30, -334), P(70, -300), P(122, -214), P(132, -126), P(122, -64),
  P(112, -26), P(126, 18), P(150, 58), P(160, 76), P(146, 92), P(128, 96), P(124, 108), P(132, 122), P(124, 132),
  P(128, 146), P(120, 160), P(116, 192), P(98, 222), P(62, 238), P(10, 232), P(-50, 208), P(-104, 168), P(-140, 120),
  P(-170, 90), P(-214, 70), P(-252, 30),
], true, 0.17);
// hair: spiky crown and back, over the cranium; hairline across the temple; sideburn in front of the ear
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

export const LeadHead: React.FC<{p: LeadPose; id: string; frame: number; detail?: number; eyeContent?: React.ReactNode}> = ({p, id, frame, detail = 1, eyeContent}) => {
  const u = upperLid(p.lid), lo = lowerLid(p.squeeze);
  const fis = fissurePath(p.lid, p.squeeze);
  const ir = {x: EYE.iris.x + p.gx * 6, y: EYE.iris.y + p.gy * 5};
  const browY = -66 - p.brow * 9;
  const crease = (() => {
    // the lid crease travels down and flattens as the lid unfolds over the eye
    const k = p.lid;
    return cub(P(-44, -4 + 4 * k), P(-20, lerp(-60, -16, k)), P(22, lerp(-60, -14, k)), P(42, lerp(-4, 4, k)));
  })();
  // lashes along the upper margin: point up/out when open, down/out when closed
  const lashes = Array.from({length: 9}, (_, i) => {
    const s = 0.1 + i * 0.1;
    const b = bez(u.a, u.c1, u.c2, u.b, s);
    const len = lerp(13, 8, Math.abs(s - 0.25) * 1.2);
    const ang = lerp(-118, -4, p.lid) + lerp(-26, 24, s) * (1 - p.lid * 0.6); // degrees, 0 = +x
    const r = (ang * Math.PI) / 180;
    const tip = P(b.x + Math.cos(r) * len, b.y + Math.sin(r) * len);
    const mid = P((b.x + tip.x) / 2 - Math.sin(r) * 2.5, (b.y + tip.y) / 2 + Math.cos(r) * 2.5);
    return `M${b.x} ${b.y}Q${mid.x} ${mid.y} ${tip.x} ${tip.y}`;
  });
  const mouthNear = P(100, 135 - 7 * p.smirk);
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
        <clipPath id={`${id}-fis`}>
          <path d={fis} />
        </clipPath>
        <clipPath id={`${id}-head`}>
          <path d={HEAD} />
        </clipPath>
      </defs>
      {/* ear (behind the hair edge) */}
      <path d="M-128 6 C-176 -28 -196 40 -172 76 C-160 96 -134 96 -124 78" fill={L.skin} stroke={C.ink} strokeWidth={3} />
      <path d="M-140 26 C-166 14 -170 50 -150 66" fill="none" stroke={L.skinDeep} strokeWidth={4} strokeLinecap="round" />
      {/* head */}
      <path d={HEAD} fill={`url(#${id}-skin)`} stroke={C.ink} strokeWidth={3.2} strokeLinejoin="round" />
      {/* jaw shadow and cheek */}
      <g clipPath={`url(#${id}-head)`}>
        <path d="M-120 150 C-60 214 30 246 110 210 L130 300 L-160 300 Z" fill={L.skinShade} opacity={0.45} />
        <ellipse cx={30} cy={80} rx={40} ry={20} fill={C.coral} opacity={0.32} />
        <path d="M64 -40 C80 -10 90 30 96 52" stroke={L.skinShade} strokeWidth={10} fill="none" opacity={0.35} strokeLinecap="round" />
      </g>
      {/* nostril wing and nose shading */}
      <path d="M118 78 C108 70 108 92 124 92" fill="none" stroke={L.skinDeep} strokeWidth={3.4} strokeLinecap="round" />
      {/* mouth: lips in profile; near corner can lift */}
      <path d={`M${mouthNear.x} ${mouthNear.y} Q114 ${136 - 2 * p.smirk} 127 131`} fill="none" stroke={L.lip} strokeWidth={4} strokeLinecap="round" />
      {p.smirk > 0.05 && <path d={`M${mouthNear.x - 4} ${mouthNear.y - 6} q-3 6 1 11`} fill="none" stroke={L.skinDeep} strokeWidth={2.5} strokeLinecap="round" opacity={p.smirk} />}
      {/* ---- the near eye ---- */}
      <g clipPath={`url(#${id}-fis)`}>
        <path d={fis} fill={`url(#${id}-sclera)`} />
        {eyeContent}
        {!eyeContent && <>
        <ellipse cx={ir.x} cy={ir.y} rx={EYE.irx} ry={EYE.iry} fill={`url(#${id}-iris)`} />
        {detail > 0.5 && Array.from({length: 14}, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          return <line key={i} x1={ir.x + Math.cos(a) * 8} y1={ir.y + Math.sin(a) * 11} x2={ir.x + Math.cos(a) * 15.5} y2={ir.y + Math.sin(a) * 22} stroke={L.irisDeep} strokeWidth={1} opacity={0.35} />;
        })}
        <ellipse cx={ir.x} cy={ir.y} rx={EYE.irx} ry={EYE.iry} fill="none" stroke={L.irisDeep} strokeWidth={2} />
        <ellipse cx={ir.x + 0.6} cy={ir.y} rx={7.2} ry={10.2} fill="#120D0A" />
        <ellipse cx={ir.x - 5} cy={ir.y - 9} rx={4.2} ry={5} fill="#FFFFFF" opacity={0.95} />
        <circle cx={ir.x + 6} cy={ir.y + 8} r={1.8} fill="#FFFFFF" opacity={0.75} />
        {/* contact lens: a thin transparent shell over the cornea; its rim reads just outside the iris */}
        {p.lensOn > 0.001 && (
          <g opacity={clamp(p.lensOn * 1.4)}>
            <ellipse cx={EYE.iris.x + 1} cy={EYE.iris.y} rx={lerp(10, EYE.lens.rx, p.lensOn)} ry={EYE.lens.ry} fill="#E8FBFF" opacity={0.12} stroke="#9FDDE6" strokeWidth={1.6} />
            <path d={`M${EYE.iris.x - 12} ${EYE.iris.y - 22} Q${EYE.iris.x + 4} ${EYE.iris.y - 31} ${EYE.iris.x + 17} ${EYE.iris.y - 18}`} fill="none" stroke="#FFFFFF" strokeWidth={2.4} opacity={0.55} strokeLinecap="round" />
          </g>
        )}
        </>}
        {/* the upper lid's shadow on the eyeball */}
        <path d={`M${u.a.x - 4} ${u.a.y - 30}L${u.b.x + 4} ${u.b.y - 30}L${u.b.x} ${u.b.y}C${u.c2.x} ${u.c2.y} ${u.c1.x} ${u.c1.y} ${u.a.x} ${u.a.y}Z`} fill="none" />
        <path d={cub(u.a, P(u.c1.x, u.c1.y + 7), P(u.c2.x, u.c2.y + 7), u.b)} fill="none" stroke="#8C6A5E" strokeWidth={8} opacity={0.28} />
      </g>
      {/* lid skin shading above the margin (the lid is a rounded shell over the eyeball) */}
      <path d={`${cub(u.a, u.c1, u.c2, u.b)}C${EYE.M.x - 2} ${lerp(-30, 0, p.lid)} ${EYE.L.x + 2} ${lerp(-30, -2, p.lid)} ${EYE.L.x} ${EYE.L.y}Z`} fill={L.skinShade} opacity={0.18 + 0.12 * p.lid} />
      <path d={crease} fill="none" stroke={L.skinDeep} strokeWidth={2.6} strokeLinecap="round" opacity={0.75 * (1 - 0.85 * p.lid)} />
      {/* margins: upper lid line (thick, ink) and the lower lid rim */}
      <path d={cub(u.a, u.c1, u.c2, u.b)} fill="none" stroke={L.lash} strokeWidth={4.6} strokeLinecap="round" />
      <path d={cub(lo.a, lo.c1, lo.c2, lo.b)} fill="none" stroke={L.skinDeep} strokeWidth={2.4} strokeLinecap="round" opacity={0.9 * (1 - 0.7 * p.lid)} />
      <path d={lashes.join('')} fill="none" stroke={L.lash} strokeWidth={2.6} strokeLinecap="round" />
      <circle cx={EYE.M.x - 1} cy={EYE.M.y} r={2.6} fill="#E99A90" />
      {/* brow */}
      <path d={`M-52 ${browY + 10} C-30 ${browY - 8} 20 ${browY - 14} 60 ${browY - 2 + p.brow * 3} C40 ${browY + 2} -10 ${browY + 2} -52 ${browY + 10}Z`} fill={L.brow} stroke={L.brow} strokeWidth={6} strokeLinejoin="round" />
      {/* hair */}
      <path d={HAIR_BACK} fill={`url(#${id}-hair)`} stroke={C.ink} strokeWidth={3.2} strokeLinejoin="round" />
      {HAIR_LOCKS.map((pts, i) => (
        <path key={i} d={smooth(pts)} fill="none" stroke={L.hairShade} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
      ))}
    </g>
  );
};

// ---- the finger that places the lens (L1 head coords). tip = fingertip pad centre; dir = degrees of the finger axis
// from tip toward the hand. The lens cup rides on the pad until handoff.
export const Finger: React.FC<{tip: Pt; dir: number; lens: number; lensRx: number; id: string}> = ({tip, dir, lens, lensRx, id}) => {
  const w = 44, len = 330;
  return (
    <g transform={`translate(${tip.x} ${tip.y}) rotate(${dir})`}>
      <defs>
        <linearGradient id={`${id}-fin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6CDB0" />
          <stop offset="0.55" stopColor="#E9B08F" />
          <stop offset="1" stopColor="#CF8E6E" />
        </linearGradient>
      </defs>
      {/* hand knuckles beyond the finger (curled middle finger) */}
      <path d={`M${len - 40} ${-w / 2 - 6} C${len + 30} ${-w / 2 - 30} ${len + 90} ${w / 2 + 50} ${len + 20} ${w / 2 + 70} C${len - 30} ${w / 2 + 80} ${len - 60} ${w / 2 + 30} ${len - 70} ${w / 2 + 10}Z`} fill={L.skinShade} stroke={C.ink} strokeWidth={3} />
      <path d={`M${len - 110} ${w / 2 + 2} C${len - 80} ${w / 2 + 50} ${len - 20} ${w / 2 + 60} ${len + 10} ${w / 2 + 40}`} fill={L.skin} stroke={C.ink} strokeWidth={3} />
      {/* soft contact shadow cast on the face */}
      <path d={`M${len} ${-w / 2 + 14} L${w * 0.5} ${-w / 2 + 14} C${-w * 0.2} ${-w / 2 + 14} ${-w * 0.42} ${-w * 0.1} ${-w * 0.4} ${w * 0.2} C${-w * 0.3} ${w * 0.5} ${0} ${w / 2 + 14} ${w * 0.5} ${w / 2 + 14} L${len} ${w / 2 + 18} Z`} fill="#6B3A2C" opacity={0.09} transform="translate(-4 -6)" />
      {/* index finger */}
      <path d={`M${len} ${-w / 2} L${w * 0.5} ${-w / 2} C${-w * 0.15} ${-w / 2} ${-w * 0.42} ${-w * 0.22} ${-w * 0.42} 0 C${-w * 0.42} ${w * 0.24} ${-w * 0.12} ${w / 2} ${w * 0.5} ${w / 2} L${len} ${w / 2 + 4} Z`} fill={`url(#${id}-fin)`} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      {/* nail on the back of the finger (upper side) */}
      <path d={`M${w * 0.1} ${-w / 2 + 3} C${w * 0.3} ${-w / 2 - 2} ${w * 1.1} ${-w / 2 - 1} ${w * 1.25} ${-w / 2 + 5} C${w * 1.0} ${-w / 2 + 10} ${w * 0.35} ${-w / 2 + 10} ${w * 0.1} ${-w / 2 + 3}Z`} fill="#F7DCCB" stroke={L.skinDeep} strokeWidth={1.6} />
      {/* knuckle creases */}
      {[w * 2.1, w * 2.3, w * 4.3, w * 4.5].map((x, i) => (
        <path key={i} d={`M${x} ${-w / 2 + 8} q-4 ${w / 2 - 8} 0 ${w - 14}`} fill="none" stroke={L.skinDeep} strokeWidth={1.8} opacity={0.6} />
      ))}
      {/* the lens on the pad: a delicate curved cup, concave toward the eye */}
      {lens > 0.001 && (
        <g opacity={lens}>
          <path d={`M${-w * 0.36} ${-lensRx * 1.35} C${-w * 0.82} ${-lensRx * 0.9} ${-w * 0.82} ${lensRx * 0.9} ${-w * 0.36} ${lensRx * 1.35}`} fill="#E8FBFF" fillOpacity={0.25} stroke="#7CCFDA" strokeWidth={2.2} />
          <path d={`M${-w * 0.36} ${-lensRx * 1.35} C${-w * 0.66} ${-lensRx * 0.9} ${-w * 0.66} ${lensRx * 0.9} ${-w * 0.36} ${lensRx * 1.35}`} fill="none" stroke="#FFFFFF" strokeWidth={1.4} opacity={0.7} />
        </g>
      )}
    </g>
  );
};

// ---- seated body (L1), facing right; the head group is drawn by the caller between `back` and `front` passes ----
const TORSO = smooth([P(-92, 262), P(40, 262), P(150, 330), P(170, 520), P(160, 720), P(176, 900), P(-170, 930), P(-206, 720), P(-206, 470), P(-180, 330)], true, 0.16);
export const LeadBody: React.FC<{id: string; breath: number; pass: 'back' | 'front'}> = ({id, breath, pass}) => {
  const b = breath * 3;
  if (pass === 'back') {
    return (
      <g>
        <defs>
          <clipPath id={`${id}-torso`}>
            <path d={TORSO} />
          </clipPath>
        </defs>
        {/* neck */}
        <path d="M-80 170 L-86 310 L46 310 L40 200 Z" fill={L.skinShade} stroke={C.ink} strokeWidth={3.2} />
        {/* legs: thigh along the seat, shin down to the floor */}
        <path d="M-150 830 L360 852 C430 858 450 930 430 990 L-150 1000 Z" fill={L.trousers} stroke={C.ink} strokeWidth={3.4} strokeLinejoin="round" />
        <path d="M318 900 C350 980 350 1200 344 1420 L440 1420 C446 1200 452 1000 432 950 Z" fill={L.trousers} stroke={C.ink} strokeWidth={3.4} strokeLinejoin="round" />
        <path d="M336 1410 C360 1392 452 1392 512 1418 C536 1436 526 1466 502 1468 L338 1468 Z" fill={L.shoe} stroke={C.ink} strokeWidth={3.4} />
        <path d="M150 870 C250 880 330 884 380 900" fill="none" stroke="#24344F" strokeWidth={5} opacity={0.6} strokeLinecap="round" />
        {/* torso (breathes) */}
        <g transform={`translate(0 ${900}) scale(1 ${1 + b / 300}) translate(0 ${-900})`}>
          <path d={TORSO} fill={L.shirt} stroke={C.ink} strokeWidth={3.4} strokeLinejoin="round" />
          <g clipPath={`url(#${id}-torso)`}>
            {Array.from({length: 9}, (_, i) => (
              <rect key={i} x={-260} y={310 + i * 74} width={480} height={32} fill={L.stripe} />
            ))}
            <path d="M-206 400 C-176 600 -176 800 -140 930 L-260 930 L-260 400 Z" fill={L.shirtShade} opacity={0.5} />
          </g>
          {/* collar */}
          <path d="M-84 262 C-50 314 24 314 52 262 L48 290 C18 334 -56 334 -88 290 Z" fill={L.shirt} stroke={C.ink} strokeWidth={3.2} />
        </g>
      </g>
    );
  }
  // front pass: the near arm (shoulder -> elbow -> hand relaxed on the thigh)
  const sh = P(-34, 360), el = P(-6, 650), wr = P(200, 812);
  const arm = `M${sh.x} ${sh.y}Q${sh.x - 30} ${(sh.y + el.y) / 2} ${el.x} ${el.y}Q${el.x + 70} ${el.y + 110} ${wr.x} ${wr.y}`;
  return (
    <g>
      <path d={arm} fill="none" stroke={C.ink} strokeWidth={84} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${sh.x} ${sh.y}Q${sh.x - 30} ${(sh.y + el.y) / 2} ${el.x} ${el.y}`} fill="none" stroke="#F0EADD" strokeWidth={77} strokeLinecap="round" />
      <path d={`M${el.x} ${el.y}Q${el.x + 70} ${el.y + 110} ${wr.x} ${wr.y}`} fill="none" stroke="#F0EADD" strokeWidth={72} strokeLinecap="round" />
      {[400, 480, 560].map((y, i) => <path key={i} d={`M${-76 + i * 3} ${y} L${12 + i * 4} ${y + 6}`} stroke={L.stripe} strokeWidth={22} strokeLinecap="round" />)}
      {[ [40, 720], [100, 765], [158, 798] ].map(([x, y], i) => <path key={'s' + i} d={`M${x - 14} ${y - 30} L${x + 16} ${y + 28}`} stroke={L.stripe} strokeWidth={20} strokeLinecap="round" />)}
      {/* hand */}
      <path d="M186 786 C240 776 296 794 306 832 C296 856 246 862 198 846 C178 836 176 800 186 786 Z" fill={L.skin} stroke={C.ink} strokeWidth={3.2} />
      <path d="M236 806 C258 812 276 826 284 842" fill="none" stroke={L.skinDeep} strokeWidth={2.2} />
      <path d="M190 790 C176 776 190 762 214 774" fill={L.skin} stroke={C.ink} strokeWidth={3} />
    </g>
  );
};

// pivot used by the head group (L1)
export const headTransform = (tilt: number) => `rotate(${tilt} ${NECK.x} ${NECK.y})`;
export {rot, lerpP};
