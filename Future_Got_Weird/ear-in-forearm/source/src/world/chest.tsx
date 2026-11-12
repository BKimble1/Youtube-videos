// The rib harvest: a local opening in the chest over her lower ribs, the costal cartilages joining the sternum, and
// the block of fused cartilage (where the 6th and 7th rib cartilages join) that is cut out and lifted toward us.
// Ribs are bone (ivory) laterally and cartilage (pearly blue-white) toward the sternum.
import React from 'react';
import {ANAT, SK, INK} from './pal';
import {clamp, ss} from '../lib';
import {B} from './story';
import {sample, at, partial} from './geom';
import {Scalpel, slideIn} from './tools';

const ln = (w: number) => ({stroke: INK, strokeWidth: w, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});
export const WIN = {x: 372, y: 1118, r: 175};
/** where the block sits in the chest (piece-local coordinates are the ear's: see ear.tsx) */
export const PIECE_HOME = {x: 398, y: 1131, rot: -78};
/** the raw block of rib cartilage, in piece-local units (it contains the whole framework) */
export const BLOCK = 'M -22 -52 C -6 -56 22 -54 33 -46 C 40 -30 41 0 38 24 C 36 36 32 42 18 44 C 0 46 -16 44 -24 38 C -30 20 -31 -10 -29 -34 C -28 -44 -27 -50 -22 -52 Z';

type Rib = {bone: string; cart: string; w: number};
// her left side (screen right of the sternum, toward us) and her right side (foreshortened, screen left)
const RIBS: Rib[] = [
  {bone: 'M 600 948 C 560 952 500 968 452 990', cart: 'M 452 990 C 410 1004 360 1002 322 990', w: 20},
  {bone: 'M 604 1000 C 560 1006 506 1024 458 1046', cart: 'M 458 1046 C 412 1062 364 1056 324 1042', w: 21},
  {bone: 'M 606 1054 C 566 1062 512 1082 466 1104', cart: 'M 466 1104 C 420 1120 372 1112 328 1094', w: 22},
  {bone: 'M 610 1110 C 572 1120 520 1142 478 1162', cart: 'M 478 1162 C 430 1180 372 1170 336 1146', w: 22},
  {bone: 'M 614 1168 C 580 1178 536 1200 500 1222', cart: 'M 500 1222 C 462 1236 428 1220 404 1190', w: 20},
  {bone: 'M 618 1226 C 590 1236 556 1256 528 1278', cart: 'M 528 1278 C 498 1290 470 1270 452 1234', w: 18},
];
const RIBS_R: Rib[] = [
  {bone: 'M 150 956 C 186 966 228 984 258 994', cart: 'M 258 994 C 272 998 284 996 290 992', w: 15},
  {bone: 'M 146 1010 C 182 1022 222 1042 252 1052', cart: 'M 252 1052 C 268 1056 282 1052 288 1046', w: 16},
  {bone: 'M 144 1066 C 178 1080 218 1102 248 1112', cart: 'M 248 1112 C 266 1116 280 1108 286 1098', w: 16},
  {bone: 'M 142 1124 C 176 1140 214 1162 242 1172', cart: 'M 242 1172 C 262 1176 278 1164 282 1148', w: 16},
  {bone: 'M 140 1184 C 172 1200 206 1222 232 1232', cart: 'M 232 1232 C 250 1236 262 1220 268 1200', w: 15},
];

const Band: React.FC<{d: string; w: number; base: string; light: string; deep: string; ow: number; glow?: number}> = ({d, w, base, light, deep, glow = 0}) => (
  <g>
    {glow > 0.01 && <path d={d} fill="none" stroke="#CFF6FF" strokeWidth={w + 10} strokeLinecap="round" opacity={0.55 * glow} filter="url(#soft5)" />}
    <path d={d} fill="none" stroke={INK} strokeWidth={w + 2.2} strokeLinecap="round" />
    <path d={d} fill="none" stroke={deep} strokeWidth={w} strokeLinecap="round" />
    <path d={d} fill="none" stroke={base} strokeWidth={w * 0.72} strokeLinecap="round" transform="translate(-1 -1.6)" />
    <path d={d} fill="none" stroke={light} strokeWidth={w * 0.22} strokeLinecap="round" opacity="0.8" transform="translate(-1.5 -4)" />
    {glow > 0.01 && <path d={d} fill="none" stroke="#F4FDFF" strokeWidth={w * 0.6} strokeLinecap="round" opacity={0.35 * glow} />}
  </g>
);

/** The chest opening. `open` 0..1 grows the window; `taken` 0..1 shows the cavity left by the removed block. */
export const RibWindow: React.FC<{open: number; taken: number; t: number; ow: number}> = ({open, taken, t, ow}) => {
  if (open <= 0.001) return null;
  const r = WIN.r * (0.15 + 0.85 * ss(open, 0, 1));
  const cut = clamp((t - B.cut[0]) / (B.cut[1] - B.cut[0]));
  const outline = sample(BLOCK, 16);
  // "rib cartilage": the cartilage parts of the ribs light up (the bone does not), then settle
  const glow = ss(t, B.ident[0], B.ident[0] + 0.2) * (1 - 0.6 * ss(t, B.ident[1] - 0.1, B.ident[1] + 0.3));
  return (
    <g opacity={ss(open, 0, 0.25)}>
      <defs>
        <radialGradient id="ribFeather">
          <stop offset="0" stopColor="#FFF" />
          <stop offset="0.84" stopColor="#FFF" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id="ribWin">
          <ellipse cx={WIN.x} cy={WIN.y} rx={r * 1.05} ry={r * 1.12} fill="url(#ribFeather)" />
        </mask>
        <radialGradient id="ribBg" cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#9C4A45" />
          <stop offset="0.75" stopColor="#7E3536" />
          <stop offset="1" stopColor="#5A2629" />
        </radialGradient>
      </defs>
      <g mask="url(#ribWin)">
        <rect x={WIN.x - 200} y={WIN.y - 200} width={400} height={400} fill="url(#ribBg)" />
        {/* intercostal muscle fibres */}
        {Array.from({length: 26}, (_, i) => (
          <path key={i} d={`M ${200 + i * 16} ${930} l 60 380`} stroke={ANAT.muscleDeep} strokeWidth="1.4" opacity="0.35" />
        ))}
        {/* sternum and xiphoid */}
        <path d="M 286 930 C 300 926 316 926 330 932 L 336 1150 C 334 1176 324 1200 312 1226 C 300 1200 292 1176 288 1150 Z" fill={ANAT.bone} {...ln(ow)} />
        <path d="M 330 932 L 336 1150 C 334 1176 324 1200 312 1226 L 318 1150 L 314 934 Z" fill={ANAT.boneShade} opacity="0.55" />
        <path d="M 300 940 L 304 1150" stroke={ANAT.boneShade} strokeWidth="5" opacity="0.6" />
        <ellipse cx={WIN.x} cy={WIN.y} rx={r * 0.98} ry={r * 1.05} fill="none" stroke={ANAT.fat} strokeWidth={10} opacity="0.55" />
        <ellipse cx={WIN.x} cy={WIN.y} rx={r * 1.02} ry={r * 1.09} fill="none" stroke="#B07A60" strokeWidth={8} opacity="0.7" />
        {RIBS_R.map((rb, i) => (
          <g key={i}>
            <Band d={rb.bone} w={rb.w} base={ANAT.bone} light="#FFF8EA" deep={ANAT.boneShade} ow={ow} />
            <Band d={rb.cart} w={rb.w * 0.9} base={ANAT.cartilage} light={ANAT.cartilageLight} deep={ANAT.cartilageShade} ow={ow} glow={glow} />
          </g>
        ))}
        {RIBS.map((rb, i) => (
          <g key={i}>
            <Band d={rb.bone} w={rb.w} base={ANAT.bone} light="#FFF8EA" deep={ANAT.boneShade} ow={ow} />
            <Band d={rb.cart} w={rb.w * 0.92} base={ANAT.cartilage} light={ANAT.cartilageLight} deep={ANAT.cartilageShade} ow={ow} glow={glow} />
          </g>
        ))}
        {/* the 6th and 7th cartilages fuse into a plate here: the block that will be taken */}
        <g transform={`translate(${PIECE_HOME.x} ${PIECE_HOME.y}) rotate(${PIECE_HOME.rot})`}>
          {taken < 1 && (
            <g opacity={1 - taken}>
              <path d={BLOCK} fill={ANAT.cartilageShade} />
              <path d="M -12 -46 C -14 -10 -14 20 -12 40" fill="none" stroke={ANAT.cartilage} strokeWidth="18" strokeLinecap="round" />
              <path d="M 22 -46 C 25 -12 25 16 22 38" fill="none" stroke={ANAT.cartilage} strokeWidth="17" strokeLinecap="round" />
              <path d="M -15 -44 C -17 -10 -17 18 -15 36" fill="none" stroke={ANAT.cartilageLight} strokeWidth="4" strokeLinecap="round" opacity="0.8" />
              <path d="M 19 -44 C 22 -12 22 14 19 34" fill="none" stroke={ANAT.cartilageLight} strokeWidth="4" strokeLinecap="round" opacity="0.8" />
            </g>
          )}
          {taken > 0 && (
            <g opacity={taken}>
              <path d={BLOCK} fill={ANAT.cavity} />
              <path d={BLOCK} fill="none" stroke={ANAT.muscleDeep} strokeWidth="4" opacity="0.7" />
              <path d="M -18 -40 C 0 -44 20 -42 28 -34" fill="none" stroke={ANAT.tissueDeep} strokeWidth="3" opacity="0.6" />
            </g>
          )}
          {/* the cut being traced */}
          {cut > 0 && taken < 1 && <path d={partial(outline, cut)} fill="none" stroke="#5A1418" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />}
        </g>
      </g>
      {/* the scalpel tracing the block: it comes in along its own axis, cuts, and leaves the same way */}
      {t > B.cut[0] - 0.22 && t < B.cut[1] + 0.25 && (() => {
        const q = at(outline, cut);
        const cs = Math.cos((PIECE_HOME.rot * Math.PI) / 180), sn = Math.sin((PIECE_HOME.rot * Math.PI) / 180);
        const tip = {x: PIECE_HOME.x + q.p.x * cs - q.p.y * sn, y: PIECE_HOME.y + q.p.x * sn + q.p.y * cs};
        const k = ss(t, B.cut[0] - 0.22, B.cut[0]) * (1 - ss(t, B.cut[1], B.cut[1] + 0.25));
        const p = slideIn(tip, -150, k, 280);
        return <Scalpel x={p.x} y={p.y} a={-150} s={0.8} ow={ow} />;
      })()}
    </g>
  );
};
