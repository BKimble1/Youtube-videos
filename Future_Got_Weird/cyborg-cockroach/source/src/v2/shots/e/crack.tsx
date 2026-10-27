// The crack the medic comes out of (F2-F4): a broken concrete block lying on the floor slab, with a low jagged hole at
// its base, modelled in the insect's millimetres (x toward the open floor, y up, z to the insect's right) and drawn
// flat through any orthographic view (v2/roach/ortho.ts), so the extreme close-up (F2) and the two-shots (F3, F4) show
// the same crack. The hole's face is the plane x = 0; the insect walks out along +x.
// Occlusion is exact for this geometry without depth sorting: insect parts still inside the block can only be seen
// through the hole, so the insect is clipped to "everything except the block's visible faces, plus the hole".
import React from 'react';
import {V3} from '../../../lib/v3';
import {INK} from '../../../lib/ink';
import {mix, shade as shadeC, lit as litC} from '../../../lib/color';
import {View, P} from '../../roach/ortho';
import {RB, Pt, poly, line, jag, f2} from './art';

export const CRK = {
  back: -260, // the block's back (x)
  zL: -150, // its right-hand end (z, insect's right is +z... the far end from the viewer's left)
  zR: 120, // the end toward the viewer's left
  h: 120, // height
  /** the hole in the face x = 0, as (z, y) points, floor to floor */
  hole: [[-60, 0], [-58, 13], [-48, 25], [-36, 31], [-28, 41], [-11, 47], [5, 43], [18, 46], [34, 38], [46, 28], [55, 15], [58, 0]] as [number, number][],
};

const fp = (v: View, x: number, y: number, z: number): Pt => P(v, [x, y, z] as V3) as Pt;
/** the block's faces on screen (straight edges, for clipping) */
export const crackFaces = (v: View) => {
  const face: Pt[] = [fp(v, 0, 0, CRK.zL), fp(v, 0, 0, CRK.zR), fp(v, 0, CRK.h, CRK.zR), fp(v, 0, CRK.h, CRK.zL)];
  const top: Pt[] = [fp(v, 0, CRK.h, CRK.zL), fp(v, 0, CRK.h, CRK.zR), fp(v, CRK.back, CRK.h, CRK.zR), fp(v, CRK.back, CRK.h, CRK.zL)];
  const side: Pt[] = [fp(v, 0, 0, CRK.zR), fp(v, CRK.back, 0, CRK.zR), fp(v, CRK.back, CRK.h, CRK.zR), fp(v, 0, CRK.h, CRK.zR)];
  const hole: Pt[] = CRK.hole.map(([z, y]) => fp(v, 0, y, z));
  return {face, top, side, hole};
};
/** clip path for the insect: the whole screen minus the block's faces, plus the hole (evenodd) */
export const crackClipD = (v: View) => {
  const {face, top, side, hole} = crackFaces(v);
  return `M-4000,-4000 H6000 V6000 H-4000 Z ${poly(face)} ${poly(hole)} ${poly(top)} ${poly(side)}`;
};

/** the block (draw before the insect) */
export const CrackBlock: React.FC<{id: string; v: View; w?: number; dark?: number}> = ({id, v, w = 4, dark = 0}) => {
  const {face, top, side, hole} = crackFaces(v);
  const c = mix(RB.conc, RB.deep, dark);
  const faceJ = jag([face[0], face[1], face[2], face[3]], 5 * v.s * 0.4, 91, 22 * v.s);
  const topJ = jag(top, 4 * v.s * 0.4, 92, 26 * v.s);
  const inner: Pt[] = [...hole, ...CRK.hole.slice().reverse().map(([z, y]) => fp(v, -40, y * 0.9, z * 0.9))];
  const holeC = hole.reduce((a, p) => [a[0] + p[0] / hole.length, a[1] + p[1] / hole.length], [0, 0]);
  const deep = fp(v, -60, 20, 0);
  const crk = (pts: [number, number, number][]) => line(pts.map(([x, y, z]) => fp(v, x, y, z)));
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-fg`} gradientUnits="userSpaceOnUse" x1={0} y1={f2(fp(v, 0, CRK.h, 0)[1])} x2={0} y2={f2(fp(v, 0, 0, 0)[1])}>
          <stop offset="0" stopColor={litC(c, 0.08)} />
          <stop offset="1" stopColor={shadeC(c, 0.28)} />
        </linearGradient>
        <linearGradient id={`${id}-hg`} gradientUnits="userSpaceOnUse" x1={f2(deep[0])} y1={f2(deep[1])} x2={f2(holeC[0])} y2={f2(holeC[1] + (hole[0][1] - holeC[1]) * 0.9)}>
          <stop offset="0" stopColor="#0B0A0A" />
          <stop offset="1" stopColor={RB.crevice} />
        </linearGradient>
      </defs>
      <path d={poly(jag(side, 4 * v.s * 0.4, 93, 26 * v.s))} fill={shadeC(c, 0.42)} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
      <path d={poly(topJ)} fill={litC(c, 0.3)} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
      <path d={`${poly(faceJ)} ${poly(hole)}`} fillRule="evenodd" fill={`url(#${id}-fg)`} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
      <path d={poly(hole)} fill={`url(#${id}-hg)`} />
      <path d={poly(inner)} fill="#0D0B0B" opacity={0.35} />
      {/* cracks running out of the hole */}
      <path d={crk([[0, 50, -12], [0, 72, -20], [0, 92, -6], [0, 120, -14]])} stroke={shadeC(c, 0.7)} strokeWidth={f2(Math.max(2, 0.5 * v.s))} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={crk([[0, 40, 38], [0, 58, 62], [0, 64, 96]])} stroke={shadeC(c, 0.7)} strokeWidth={f2(Math.max(2, 0.45 * v.s))} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={crk([[0, 30, -52], [0, 46, -86], [0, 44, -120]])} stroke={shadeC(c, 0.7)} strokeWidth={f2(Math.max(2, 0.45 * v.s))} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* the hole's lit lower lip */}
      <path d={line([hole[0], ...CRK.hole.slice(1, -1).filter(([, y]) => y < 1).map(([z, y]) => fp(v, 0, y, z)), hole[hole.length - 1]])} stroke={RB.dust} strokeWidth={f2(w * 1.2)} strokeLinecap="round" opacity={0.7} />
      {/* rim light on the face's upper-left edges */}
      <path d={line([faceJ[faceJ.length - 1], faceJ[0]])} stroke={RB.day} strokeWidth={f2(w)} opacity={0.0} />
    </g>
  );
};

/** darkness on the insect where it is still in the hole (draw over the insect): a ramp along the insect's projected
 *  heading, black a little inside the mouth, clear just outside it (measured at mid-body height), clipped to the hole */
export const CrackShadow: React.FC<{id: string; v: View; a: number}> = ({id, v, a}) => {
  const {hole} = crackFaces(v);
  const hi = fp(v, -22, 12, 0), lo = fp(v, 10, 12, 0);
  return (
    <g>
      <defs>
        <clipPath id={`${id}-sc`}>
          <path d={poly(hole)} />
        </clipPath>
        <linearGradient id={`${id}-sg`} gradientUnits="userSpaceOnUse" x1={f2(hi[0])} y1={f2(hi[1])} x2={f2(lo[0])} y2={f2(lo[1])}>
          <stop offset="0" stopColor="#0A0909" stopOpacity={a} />
          <stop offset="0.6" stopColor="#0A0909" stopOpacity={a * 0.6} />
          <stop offset="1" stopColor="#0A0909" stopOpacity={0} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-sc)`}>
        <rect x={-4000} y={-4000} width={10000} height={10000} fill={`url(#${id}-sg)`} />
      </g>
    </g>
  );
};

/** the floor slab the insect comes out onto (top surface in the view, broken front face), drawn first */
export const CrackFloor: React.FC<{id: string; v: View; x0: number; x1: number; z0: number; z1: number; drop?: number; w?: number; dark?: number}> = ({id, v, x0, x1, z0, z1, drop = 260, w = 4, dark = 0}) => {
  const c = mix(RB.concLit, RB.deep, dark);
  const top: Pt[] = jag([fp(v, x0, 0, z0), fp(v, x1, 0, z0), fp(v, x1, 0, z1), fp(v, x0, 0, z1)], 3 * v.s * 0.4, 95, 30 * v.s);
  const front: Pt[] = jag([fp(v, x0, 0, z1), fp(v, x1, 0, z1), fp(v, x1, -drop, z1), fp(v, x0, -drop, z1)], 5 * v.s * 0.4, 96, 30 * v.s);
  const a = fp(v, x0, 0, z0), b = fp(v, x0, 0, z1);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-tg`} gradientUnits="userSpaceOnUse" x1={f2(a[0])} y1={f2(a[1])} x2={f2(b[0])} y2={f2(b[1])}>
          <stop offset="0" stopColor={shadeC(c, 0.12)} />
          <stop offset="1" stopColor={litC(c, 0.12)} />
        </linearGradient>
      </defs>
      <path d={poly(front)} fill={shadeC(mix(RB.conc, RB.deep, dark), 0.35)} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
      <path d={poly(top)} fill={`url(#${id}-tg)`} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
    </g>
  );
};
