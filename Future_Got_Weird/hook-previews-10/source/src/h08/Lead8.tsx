// The lead (Weird Crew "guesser": red spiky hair, green eyes), copied from the Infrared Contacts V2 rig
// (art/Lead.tsx + v2/Eye2.tsx) and adapted for HOOK 08:
//  - thinner, non-scaling ink contours (the round's thin #172B3A contour) and a moody key from the upper left;
//  - the contact lens is a nearly invisible shell over the iris (thin rim, faint tint, a glint sweep);
//  - the closed upper lid can light faintly from within (green, converted light scattered back out through the lid);
//  - the eyeball shifts a little under the closed lid (the lid bulge follows it), and the brow reacts to each flash.
import React from 'react';
import {Pt, P, lerp, clamp, smooth} from './geo';

export const INK = '#172B3A';
export const L = {
  skin: '#F2C9A8', skinShade: '#DDA586', skinDeep: '#C88B6C', skinLight: '#FBDDC4', lip: '#C9705E',
  hair: '#C0392B', hairShade: '#962A20', hairLight: '#DB5440', brow: '#9E3024',
  iris: '#5A7F6E', irisDeep: '#34503F', irisLight: '#8DB09A', sclera: '#FBF8F1', scleraShade: '#E6DCD0',
  lash: '#3A1E18', shirt: '#FFFFFF', stripe: '#FFC744', shirtShade: '#E9E2D2', coral: '#EF6B55',
};
export const GREEN = {core: '#B9FFD0', mid: '#62F08E', deep: '#22B35A'};
const ns = {vectorEffect: 'non-scaling-stroke' as const};

export type LeadPose = {
  lid: number; // 0 open .. 1 closed (upper lid)
  brow: number; // -1 relaxed .. 1 raised
  smirk: number;
  gx: number; gy: number; // gaze (-1..1); under a closed lid it moves the cornea bulge
  lensOn: number;
  glint: number; // -1 none, 0..1 sweep across the lens
  lidGlow: number; // 0..1 green light from inside the closed lid
  breath: number;
};

export const EYE = {
  L: P(-46, 4), M: P(44, 8),
  iris: P(16, 3), irx: 17, iry: 24,
  lens: {rx: 23, ry: 31},
};
const cub = (a: Pt, c1: Pt, c2: Pt, b: Pt) => `M${a.x} ${a.y}C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`;
const bez = (a: Pt, c1: Pt, c2: Pt, b: Pt, t: number): Pt => {
  const u = 1 - t;
  return {x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x, y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y};
};
export const upperLid = (k: number, gx = 0) => ({a: EYE.L, c1: P(lerp(-22, -18, k) + gx * 4 * k, lerp(-44, 24, k)), c2: P(20 + gx * 5 * k, lerp(-43, 27, k)), b: EYE.M});
export const lowerLid = () => ({a: EYE.M, c1: P(20, 31), c2: P(-20, 30), b: EYE.L});
export const fissurePath = (k: number, gx = 0) => {
  const u = upperLid(k, gx), l = lowerLid();
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
const TORSO = smooth([P(-92, 262), P(40, 262), P(150, 330), P(170, 520), P(160, 720), P(-206, 720), P(-206, 470), P(-180, 330)], true, 0.16);

// ---- the eye behind the fissure: iris, pupil and the soft lens (from Eye2) ----
const Iris: React.FC<{gx: number; gy: number; id: string}> = ({gx, gy, id}) => {
  const ir = {x: EYE.iris.x + gx * 6, y: EYE.iris.y + gy * 5};
  return (
    <g>
      <ellipse cx={ir.x} cy={ir.y} rx={EYE.irx} ry={EYE.iry} fill={`url(#${id}-iris)`} />
      {Array.from({length: 18}, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        return <line key={i} x1={ir.x + Math.cos(a) * 8.3} y1={ir.y + Math.sin(a) * 11.7} x2={ir.x + Math.cos(a) * 15.5} y2={ir.y + Math.sin(a) * 22} stroke={L.irisDeep} strokeWidth={0.9} opacity={0.35} />;
      })}
      <ellipse cx={ir.x} cy={ir.y} rx={EYE.irx * 0.62} ry={EYE.iry * 0.62} fill="none" stroke="#B9CDB2" strokeWidth={1.2} opacity={0.35} />
      <ellipse cx={ir.x} cy={ir.y} rx={EYE.irx} ry={EYE.iry} fill="none" stroke={L.irisDeep} strokeWidth={2.2} />
      <ellipse cx={ir.x + 0.6} cy={ir.y} rx={7.2} ry={10.2} fill="#110C0A" />
      <ellipse cx={ir.x - 5} cy={ir.y - 9} rx={4.2} ry={5} fill="#FFFFFF" opacity={0.95} />
      <circle cx={ir.x + 6} cy={ir.y + 8} r={1.8} fill="#FFFFFF" opacity={0.75} />
    </g>
  );
};
const EyeContent: React.FC<{p: LeadPose; id: string}> = ({p, id}) => {
  const c = P(EYE.iris.x + 1 + p.gx * 6, EYE.iris.y + p.gy * 5);
  const rx = EYE.lens.rx, ry = EYE.lens.ry;
  return (
    <g>
      <Iris gx={p.gx} gy={p.gy} id={id} />
      {p.lensOn > 0.001 && (
        <g opacity={p.lensOn}>
          <defs>
            <clipPath id={`${id}-lc`}>
              <ellipse cx={c.x} cy={c.y} rx={rx} ry={ry} />
            </clipPath>
            <radialGradient id={`${id}-lt`} cx="0.35" cy="0.3" r="0.8">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.2} />
              <stop offset="0.6" stopColor="#DFF8FC" stopOpacity={0.05} />
              <stop offset="1" stopColor="#9FE0EA" stopOpacity={0.22} />
            </radialGradient>
          </defs>
          <g clipPath={`url(#${id}-lc)`}>
            <ellipse cx={c.x} cy={c.y} rx={rx} ry={ry} fill={`url(#${id}-lt)`} />
            {p.glint > -0.5 && p.glint < 1.5 && (
              <rect x={c.x - rx * 2 + p.glint * rx * 4} y={c.y - ry * 1.4} width={rx * 0.32} height={ry * 2.8} fill="#FFFFFF" opacity={0.4} transform={`rotate(24 ${c.x} ${c.y})`} />
            )}
          </g>
          <ellipse cx={c.x} cy={c.y} rx={rx} ry={ry} fill="none" stroke="#8FD6E0" strokeWidth={1.6} opacity={0.85} />
          <ellipse cx={c.x} cy={c.y} rx={rx - 1.2} ry={ry - 1.2} fill="none" stroke="#FFFFFF" strokeWidth={0.8} opacity={0.5} />
          <path d={`M${c.x - rx * 0.62} ${c.y - ry * 0.55} Q${c.x - rx * 0.05} ${c.y - ry * 1.02} ${c.x + rx * 0.62} ${c.y - ry * 0.62}`} fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" opacity={0.7} />
          <circle cx={c.x - rx * 0.38} cy={c.y - ry * 0.5} r={1.8} fill="#FFFFFF" />
        </g>
      )}
    </g>
  );
};

export const LeadHead: React.FC<{p: LeadPose; id: string; inkW: number; eyeA?: number}> = ({p, id, inkW, eyeA = 1}) => {
  const u = upperLid(p.lid, p.gx), lo = lowerLid();
  const fis = fissurePath(p.lid, p.gx);
  const browY = -66 - p.brow * 9;
  const k = p.lid;
  const crease = cub(P(-44, -4 + 4 * k), P(-20, lerp(-60, -16, k)), P(22, lerp(-60, -14, k)), P(42, lerp(-4, 4, k)));
  const lashes = Array.from({length: 9}, (_, i) => {
    const s = 0.1 + i * 0.1;
    const b = bez(u.a, u.c1, u.c2, u.b, s);
    const len = lerp(13, 8, Math.abs(s - 0.25) * 1.2);
    const ang = lerp(-118, -4, p.lid) + lerp(-26, 24, s) * (1 - p.lid * 0.6);
    const r = (ang * Math.PI) / 180;
    const tip = P(b.x + Math.cos(r) * len, b.y + Math.sin(r) * len);
    const mid = P((b.x + tip.x) / 2 - Math.sin(r) * 2.5, (b.y + tip.y) / 2 + Math.cos(r) * 2.5);
    return `M${b.x} ${b.y}Q${mid.x} ${mid.y} ${tip.x} ${tip.y}`;
  });
  const mouthNear = P(100, 135 - 7 * p.smirk);
  const sw = inkW; // contour width in L1 units (kept thin at every zoom by the caller)
  // the lid skin between crease and margin (where light from inside shows through)
  const lidShell = `${cub(u.a, u.c1, u.c2, u.b)}C${EYE.M.x - 2} ${lerp(-30, 0, k)} ${EYE.L.x + 2} ${lerp(-30, -2, k)} ${EYE.L.x} ${EYE.L.y}Z`;
  const gc = P(EYE.iris.x + p.gx * 5, 12);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-skin`} cx="0.62" cy="0.36" r="0.78">
          <stop offset="0" stopColor={L.skinLight} />
          <stop offset="0.5" stopColor={L.skin} />
          <stop offset="1" stopColor="#C99278" />
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
        <linearGradient id={`${id}-cool`} x1="1" y1="0" x2="0" y2="0.3">
          <stop offset="0" stopColor="#0E2230" stopOpacity={0} />
          <stop offset="0.55" stopColor="#0E2230" stopOpacity={0.12} />
          <stop offset="1" stopColor="#0E2230" stopOpacity={0.5} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={GREEN.core} stopOpacity={0.95} />
          <stop offset="0.4" stopColor={GREEN.mid} stopOpacity={0.55} />
          <stop offset="1" stopColor={GREEN.mid} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-fis`}>
          <path d={fis} />
        </clipPath>
        <clipPath id={`${id}-head`}>
          <path d={HEAD} />
        </clipPath>
      </defs>
      {/* neck, shirt and collar */}
      <path d="M-80 170 L-86 310 L46 310 L40 200 Z" fill={L.skinShade} stroke={INK} strokeWidth={sw} />
      <g transform={`translate(0 720) scale(1 ${1 + p.breath * 0.006}) translate(0 -720)`}>
        <path d={TORSO} fill={L.shirt} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        <clipPath id={`${id}-torso`}>
          <path d={TORSO} />
        </clipPath>
        <g clipPath={`url(#${id}-torso)`}>
          {Array.from({length: 6}, (_, i) => <rect key={i} x={-260} y={310 + i * 74} width={480} height={32} fill={L.stripe} />)}
          <path d="M-206 300 L60 300 L-206 720 Z" fill="#0E2230" opacity={0.18} />
        </g>
        <path d="M-84 262 C-50 314 24 314 52 262 L48 290 C18 334 -56 334 -88 290 Z" fill={L.shirt} stroke={INK} strokeWidth={sw} />
      </g>
      {/* ear */}
      <path d="M-128 6 C-176 -28 -196 40 -172 76 C-160 96 -134 96 -124 78" fill={L.skinShade} stroke={INK} strokeWidth={sw} />
      <path d="M-140 26 C-166 14 -170 50 -150 66" fill="none" stroke={L.skinDeep} strokeWidth={4} strokeLinecap="round" />
      {/* head */}
      <path d={HEAD} fill={`url(#${id}-skin)`} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <g clipPath={`url(#${id}-head)`}>
        <path d="M-120 150 C-60 214 30 246 110 210 L130 300 L-160 300 Z" fill={L.skinShade} opacity={0.45} />
        <ellipse cx={30} cy={80} rx={40} ry={20} fill={L.coral} opacity={0.3} />
        <path d="M64 -40 C80 -10 90 30 96 52" stroke={L.skinShade} strokeWidth={10} fill="none" opacity={0.18} strokeLinecap="round" />
        <rect x={-300} y={-400} width={480} height={700} fill={`url(#${id}-cool)`} />
      </g>
      <path d="M118 78 C108 70 108 92 124 92" fill="none" stroke={L.skinDeep} strokeWidth={3.4} strokeLinecap="round" />
      <path d={`M${mouthNear.x} ${mouthNear.y} Q114 ${136 - 2 * p.smirk} 127 131`} fill="none" stroke={L.lip} strokeWidth={4} strokeLinecap="round" />
      {/* ---- the near eye ---- */}
      {k < 0.995 && (
        <g clipPath={`url(#${id}-fis)`}>
          <path d={fis} fill={`url(#${id}-sclera)`} />
          <EyeContent p={p} id={id} />
          <path d={cub(u.a, P(u.c1.x, u.c1.y + 7), P(u.c2.x, u.c2.y + 7), u.b)} fill="none" stroke="#8C6A5E" strokeWidth={8} opacity={0.28} />
        </g>
      )}
      {/* lid skin shading above the margin, the crease, the cornea bulge under the closed lid (faded under a cutaway) */}
      <g opacity={eyeA}>
      <path d={lidShell} fill={L.skinShade} opacity={0.18 + 0.12 * k} />
      {k > 0.6 && <ellipse cx={gc.x + 4} cy={4} rx={22} ry={9} fill={L.skinLight} opacity={0.22 * inv01(k, 0.6, 1)} />}
      {/* light from inside the closed lid: the lid skin takes on a faint green tint, strongest over the cornea */}
      {p.lidGlow > 0.004 && (
        <g>
          <clipPath id={`${id}-lidc`}>
            <path d={lidShell} />
          </clipPath>
          <g clipPath={`url(#${id}-lidc)`}>
            <ellipse cx={gc.x} cy={gc.y} rx={44} ry={30} fill={`url(#${id}-glow)`} opacity={0.62 * p.lidGlow} />
          </g>
          <path d={cub(u.a, u.c1, u.c2, u.b)} fill="none" stroke={GREEN.mid} strokeWidth={7} opacity={0.32 * p.lidGlow} strokeLinecap="round" />
        </g>
      )}
      <path d={crease} fill="none" stroke={L.skinDeep} strokeWidth={2.6} strokeLinecap="round" opacity={0.75 * (1 - 0.8 * k)} />
      <path d={cub(u.a, u.c1, u.c2, u.b)} fill="none" stroke={L.lash} strokeWidth={4.2} strokeLinecap="round" />
      <path d={cub(lo.a, lo.c1, lo.c2, lo.b)} fill="none" stroke={L.skinDeep} strokeWidth={2.4} strokeLinecap="round" opacity={0.9 * (1 - 0.7 * k)} />
      <path d={lashes.join('')} fill="none" stroke={L.lash} strokeWidth={2.6} strokeLinecap="round" />
      <circle cx={EYE.M.x - 1} cy={EYE.M.y} r={2.6} fill="#E99A90" />
      </g>
      {/* brow */}
      <path d={`M-52 ${browY + 10} C-30 ${browY - 8} 20 ${browY - 14} 60 ${browY - 2 + p.brow * 3} C40 ${browY + 2} -10 ${browY + 2} -52 ${browY + 10}Z`} fill={L.brow} stroke={L.brow} strokeWidth={6} strokeLinejoin="round" />
      {/* hair */}
      <path d={HAIR_BACK} fill={`url(#${id}-hair)`} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      {HAIR_LOCKS.map((pts, i) => <path key={i} d={smooth(pts)} fill="none" stroke={L.hairShade} strokeWidth={4} strokeLinecap="round" opacity={0.8} />)}
    </g>
  );
};
const inv01 = (x: number, a: number, b: number) => clamp((x - a) / (b - a));
export {ns};
