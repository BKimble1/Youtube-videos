// The crack, the narrow ledge and the crevice (V3, group F), modelled in the insect's millimetres (crack frame: x along
// the walk toward her hand, y up, z across; the hole's face is the plane x = 0) and drawn flat through any orthographic
// view (v2/roach/ortho.ts), so the extreme close-up (F2), the side view on the ledge (F4) and the two-shots in her
// pocket (F3, F5: cfView in world.ts) all show the same rubble:
//   - the block: a low broken slab lying on the floor (crack.tsx's construction, lower), a jagged hole at its base;
//   - the ledge: a strip of broken floor slab, 70 mm wide, running from the hole's mouth to her floor (x = LEDGE.x1);
//   - the crevice: the drop around the ledge (from z0 to z1 across, deep), dark inside, its walls lit at the rim.
// The insect still inside the block is clipped to "everything except the block's faces, plus the hole" (exact for
// this geometry without depth sorting), as in crack.tsx.
import React from 'react';
import {V3} from '../../../lib/v3';
import {INK} from '../../../lib/ink';
import {mix, shade as shadeC, lit as litC} from '../../../lib/color';
import {View, P, facing} from '../../roach/ortho';
import {RB, Pt, poly, line, jag, f2} from '../e/art';
import {LEDGE, CREVICE} from './world';

export const CK = {
  back: -210,
  zL: -125,
  zR: 118,
  h: 66,
  /** the hole in the face x = 0, as (z, y) points, floor to floor */
  hole: [[-45, 0], [-43, 10], [-36, 19], [-27, 24], [-19, 33], [-8, 38], [4, 36], [15, 39], [26, 32], [35, 24], [42, 12], [44, 0]] as [number, number][],
};

const fp = (v: View, x: number, y: number, z: number): Pt => P(v, [x, y, z] as V3) as Pt;
const visible = (v: View, n: V3) => facing(v, n) > 0.02;

/** the block's faces on screen (straight edges, for clipping) */
export const blockFaces = (v: View) => {
  const face: Pt[] = [fp(v, 0, 0, CK.zL), fp(v, 0, 0, CK.zR), fp(v, 0, CK.h, CK.zR), fp(v, 0, CK.h, CK.zL)];
  const top: Pt[] = [fp(v, 0, CK.h, CK.zL), fp(v, 0, CK.h, CK.zR), fp(v, CK.back, CK.h, CK.zR), fp(v, CK.back, CK.h, CK.zL)];
  // the end facing the viewer (+z or -z)
  const zs = visible(v, [0, 0, 1]) ? CK.zR : CK.zL;
  const side: Pt[] = [fp(v, 0, 0, zs), fp(v, CK.back, 0, zs), fp(v, CK.back, CK.h, zs), fp(v, 0, CK.h, zs)];
  const hole: Pt[] = CK.hole.map(([z, y]) => fp(v, 0, y, z));
  return {face, top, side, hole};
};
/** clip path for the insect: the whole screen minus the block's faces, plus the hole (evenodd) */
export const blockClipD = (v: View) => {
  const {face, top, side, hole} = blockFaces(v);
  return `M-4000,-4000 H6000 V6000 H-4000 Z ${poly(face)} ${poly(hole)} ${poly(top)} ${poly(side)}`;
};

/** the block (draw before the insect); lit: 0..1 how much of the daylight from the upper right falls on its face */
export const Block: React.FC<{id: string; v: View; w?: number; dark?: number}> = ({id, v, w = 4, dark = 0}) => {
  const {face, top, side, hole} = blockFaces(v);
  const c = mix(RB.conc, RB.deep, dark);
  const k = v.s;
  const faceJ = jag([face[0], face[1], face[2], face[3]], 4 * k * 0.4, 81, 20 * k);
  const topJ = jag(top, 3 * k * 0.4, 82, 24 * k);
  const holeC = hole.reduce((a, p) => [a[0] + p[0] / hole.length, a[1] + p[1] / hole.length], [0, 0]);
  const deep = fp(v, -60, 16, 0);
  const crk = (pts: [number, number, number][]) => line(pts.map(([x, y, z]) => fp(v, x, y, z)));
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-fg`} gradientUnits="userSpaceOnUse" x1={0} y1={f2(fp(v, 0, CK.h, 0)[1])} x2={0} y2={f2(fp(v, 0, 0, 0)[1])}>
          <stop offset="0" stopColor={litC(c, 0.14)} />
          <stop offset="1" stopColor={shadeC(c, 0.2)} />
        </linearGradient>
        <linearGradient id={`${id}-hg`} gradientUnits="userSpaceOnUse" x1={f2(deep[0])} y1={f2(deep[1])} x2={f2(holeC[0])} y2={f2(holeC[1] + (hole[0][1] - holeC[1]) * 0.9)}>
          <stop offset="0" stopColor="#0B0A0A" />
          <stop offset="1" stopColor={mix(RB.crevice, RB.concDark, 0.25)} />
        </linearGradient>
      </defs>
      <path d={poly(jag(side, 3 * k * 0.4, 83, 24 * k))} fill={shadeC(c, 0.38)} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
      <path d={poly(topJ)} fill={litC(c, 0.34)} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
      <path d={`${poly(faceJ)} ${poly(hole)}`} fillRule="evenodd" fill={`url(#${id}-fg)`} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
      <path d={poly(hole)} fill={`url(#${id}-hg)`} />
      <path d={crk([[0, 42, -10], [0, 52, -22], [0, 66, -12]])} stroke={shadeC(c, 0.62)} strokeWidth={f2(Math.max(2, 0.45 * k))} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={crk([[0, 30, 40], [0, 44, 66], [0, 50, 100]])} stroke={shadeC(c, 0.62)} strokeWidth={f2(Math.max(2, 0.4 * k))} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={crk([[0, 24, -50], [0, 36, -84], [0, 33, -118]])} stroke={shadeC(c, 0.62)} strokeWidth={f2(Math.max(2, 0.4 * k))} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* daylight on the top edge (from the upper right) */}
      <path d={line([topJ[0], topJ[1]])} stroke={RB.day} strokeWidth={f2(w * 1.2)} strokeLinecap="round" opacity={0.55} />
    </g>
  );
};

/** darkness on the insect where it is still in the hole (draw over the insect), as crack.tsx's CrackShadow */
export const HoleShadow: React.FC<{id: string; v: View; a: number}> = ({id, v, a}) => {
  const {hole} = blockFaces(v);
  const o = fp(v, 0, 10, 0), ex = fp(v, 1, 10, 0), ez = fp(v, 0, 10, 1);
  const zx = ez[0] - o[0], zy = ez[1] - o[1], zl = Math.hypot(zx, zy) || 1;
  let px = -zy / zl, py = zx / zl;
  const kk0 = (ex[0] - o[0]) * px + (ex[1] - o[1]) * py;
  if (kk0 < 0) { px = -px; py = -py; }
  const kk = Math.abs(kk0);
  const hi: Pt = [o[0] - px * kk * 24, o[1] - py * kk * 24], lo: Pt = [o[0] + px * kk * 8, o[1] + py * kk * 8];
  return (
    <g>
      <defs>
        <clipPath id={`${id}-sc`}>
          <path d={poly(hole)} />
        </clipPath>
        <linearGradient id={`${id}-sg`} gradientUnits="userSpaceOnUse" x1={f2(hi[0])} y1={f2(hi[1])} x2={f2(lo[0])} y2={f2(lo[1])}>
          <stop offset="0" stopColor="#0A0909" stopOpacity={a} />
          <stop offset="0.6" stopColor="#0A0909" stopOpacity={a * 0.5} />
          <stop offset="1" stopColor="#0A0909" stopOpacity={0} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-sc)`}>
        <rect x={-4000} y={-4000} width={10000} height={10000} fill={`url(#${id}-sg)`} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- the crevice and the ledge
/** the ledge's two long edges (z at x), slightly irregular, narrowing a little toward the middle */
export const ledgeZ = (x: number): [number, number] => {
  const u = Math.min(1, Math.max(0, x / LEDGE.x1));
  const pinch = 4 * Math.sin(Math.PI * u);
  return [LEDGE.zN + pinch + 2.5 * Math.sin(x * 0.09 + 1), LEDGE.zF - pinch + 2 * Math.sin(x * 0.07 + 2.3)];
};
const LX = Array.from({length: 13}, (_, i) => (LEDGE.x1 * i) / 12);

/** the crevice opening and its inner walls (draw over the floor, before the ledge); pieces seen from inside are left
 *  out; near: false drops the wall on the viewer's side (a camera that stands inside the crevice, F4) */
export const Crevice: React.FC<{id: string; v: View; w?: number; near?: boolean}> = ({id, v, w = 4, near = true}) => {
  const {z0, z1, deep} = CREVICE, x1 = LEDGE.x1, k = v.s;
  const rim: Pt[] = jag([fp(v, 0, 0, z0), fp(v, x1, 0, z0), fp(v, x1, 0, z1), fp(v, 0, 0, z1)], 4 * k * 0.4, 61, 26 * k);
  const walls: {pts: Pt[]; n: V3; lit: number}[] = [
    {pts: [fp(v, 0, 0, z0), fp(v, 0, 0, z1), fp(v, 0, -deep, z1), fp(v, 0, -deep, z0)], n: [1, 0, 0], lit: 0.1},
    {pts: [fp(v, x1, 0, z0), fp(v, x1, 0, z1), fp(v, x1, -deep, z1), fp(v, x1, -deep, z0)], n: [-1, 0, 0], lit: 0.28},
    {pts: [fp(v, 0, 0, z0), fp(v, x1, 0, z0), fp(v, x1, -deep, z0), fp(v, 0, -deep, z0)], n: [0, 0, 1], lit: 0.2},
    {pts: [fp(v, 0, 0, z1), fp(v, x1, 0, z1), fp(v, x1, -deep, z1), fp(v, 0, -deep, z1)], n: [0, 0, -1], lit: 0.16},
  ];
  const top = fp(v, 0, 0, 0), bot = fp(v, 0, -deep * 0.55, 0);
  const vis = walls.filter((wl) => visible(v, wl.n) && (near || wl.n[2] >= 0));
  return (
    <g>
      <defs>
        <clipPath id={`${id}-cc`}>
          <path d={poly(rim)} />
        </clipPath>
        <linearGradient id={`${id}-wg`} gradientUnits="userSpaceOnUse" x1={0} y1={f2(top[1])} x2={0} y2={f2(bot[1])}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-wm`} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={10000} height={10000}>
          <rect x={-4000} y={-4000} width={10000} height={10000} fill={`url(#${id}-wg)`} />
        </mask>
      </defs>
      <g clipPath={near ? `url(#${id}-cc)` : undefined}>
        {near && <path d={poly(rim)} fill="#0E0C0B" />}
        <g mask={`url(#${id}-wm)`}>
          {vis.map((wl, i) => (
            <path key={i} d={poly(wl.pts)} fill={mix(RB.crevice, RB.concDark, wl.lit)} />
          ))}
        </g>
      </g>
      {near && <path d={poly(rim)} fill="none" stroke={INK} strokeWidth={w} strokeLinejoin="round" />}
    </g>
  );
};

/** the narrow ledge: its top (a broken strip of slab, lit, a few chips) and the long side faces seen from here */
export const Ledge: React.FC<{id: string; v: View; w?: number; dark?: number}> = ({id, v, w = 4, dark = 0}) => {
  const c = mix(RB.concLit, RB.deep, dark);
  const T = LEDGE.thick;
  const topPts: Pt[] = [...LX.map((x) => fp(v, x, 0, ledgeZ(x)[0])), ...[...LX].reverse().map((x) => fp(v, x, 0, ledgeZ(x)[1]))];
  // the broken underside of a side face (jagged)
  const sideFace = (s: 0 | 1): Pt[] => {
    const up = LX.map((x) => fp(v, x, 0, ledgeZ(x)[s]));
    const dn = [...LX].reverse().map((x, i) => fp(v, x, -T * (0.75 + 0.35 * Math.abs(Math.sin(i * 1.7 + s))), ledgeZ(x)[s]));
    return [...up, ...dn];
  };
  const sides = ([0, 1] as const).filter((s) => visible(v, [0, 0, s === 1 ? 1 : -1]));
  const a = fp(v, 0, 0, 0), b = fp(v, LEDGE.x1, 0, 0);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-lg`} gradientUnits="userSpaceOnUse" x1={f2(a[0])} y1={f2(a[1])} x2={f2(b[0])} y2={f2(b[1])}>
          <stop offset="0" stopColor={shadeC(c, 0.1)} />
          <stop offset="1" stopColor={litC(c, 0.16)} />
        </linearGradient>
      </defs>
      {sides.map((s) => (
        <path key={s} d={poly(sideFace(s))} fill={shadeC(mix(RB.conc, RB.deep, dark), 0.3)} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
      ))}
      <path d={poly(topPts)} fill={`url(#${id}-lg)`} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
      {/* a hairline crack across the slab and grit on top */}
      <path d={line([fp(v, 96, 0, ledgeZ(96)[0]), fp(v, 102, 0, -6), fp(v, 99, 0, 12), fp(v, 104, 0, ledgeZ(104)[1])])} stroke={shadeC(c, 0.5)} strokeWidth={f2(Math.max(1.5, 0.3 * v.s))} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {[[22, -20], [48, 24], [71, -27], [130, 22], [150, -24], [118, -8]].map(([x, z], i) => {
        const p = fp(v, x, 0, z);
        return <circle key={i} cx={f2(p[0])} cy={f2(p[1])} r={f2(Math.max(1.2, (0.8 + (i % 3) * 0.35) * v.s))} fill={i % 2 ? RB.dust : shadeC(c, 0.3)} opacity={0.85} />;
      })}
    </g>
  );
};
