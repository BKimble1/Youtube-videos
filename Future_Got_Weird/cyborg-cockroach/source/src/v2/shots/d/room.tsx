// Group D: the lab room. The bench is in insect millimetres, drawn through the same orthographic view as the insect, so
// a push or a pull-back keeps the bench top, its front edge over the teal cabinets, the pale experiment tray and a few
// vials at the back of the bench locked together; the lab wall (Lab2's LabWall2: shelves of jars, the teal stripe) is a
// background plate sitting on the bench top's back edge, as in A1. Depth of field: the wall and the vials can be blurred.
import React from 'react';
import {V3} from '../../../lib/v3';
import {INK} from '../../../lib/ink';
import {lit as litC, shade as shadeC} from '../../../lib/color';
import {View, P, Pd, f2, polyD} from '../../roach/ortho';
import {LabWall2, LAB2} from '../../sets/Lab2';

export const ROOM = {zWall: -300, zFront: 450, slab: 32, wallK: 1.25};

const quad = (v: View, pts: V3[]) => polyD(pts.map((p) => P(v, p)));

/** the wall as a background plate (like A1's): LabWall2 in its own scene px, scaled by `k` about its bench line
 *  (scene y 1080, just under the teal stripe), which sits on the bench top's back edge; `dx` drifts it sideways */
const WallPlate: React.FC<{id: string; v: View; k: number; dx: number}> = ({id, v, k, dx}) => {
  const yJ = P(v, [0, 0, ROOM.zWall])[1];
  return (
    <g transform={`translate(${f2(540 + dx)} ${f2(yJ)}) scale(${k.toFixed(4)}) translate(-540 -1080)`}>
      <LabWall2 id={id} />
    </g>
  );
};

/** bottles and a beaker standing at the back of the bench (flat, in mm) */
const PROPS: {x: number; z: number; r: number; h: number; c: string; cap?: string; neck?: number; fill?: number}[] = [
  {x: -230, z: -255, r: 14, h: 62, c: '#BFD8E6', cap: '#2FA7A0', neck: 0.3, fill: 0.55},
  {x: -196, z: -262, r: 11, h: 78, c: '#E98F7A', cap: '#3B444C', neck: 0.25},
  {x: -120, z: -250, r: 18, h: 44, c: '#E3F1F6', fill: 0.4},
  {x: 150, z: -258, r: 12, h: 72, c: '#F2C46A', cap: '#3B444C', neck: 0.28},
  {x: 180, z: -250, r: 10, h: 56, c: '#9ED0B0', cap: '#E9EEF2', neck: 0.3},
  {x: 290, z: -255, r: 16, h: 48, c: '#BFD8E6', fill: 0.5},
  {x: 360, z: -262, r: 12, h: 80, c: '#7FC9C2', cap: '#3B444C', neck: 0.25},
];

export type BottleSpec = (typeof PROPS)[number];
export const Bottle: React.FC<{v: View; b: BottleSpec; ink: number}> = ({v, b, ink}) => {
  const s = v.s;
  const g = P(v, [b.x, 0, b.z]);
  const up = Pd(v, [0, 1, 0]);
  const hh = Math.hypot(up[0], up[1]) * b.h; // screen height
  const w = b.r * 2 * s;
  const x0 = g[0] - w / 2, x1 = g[0] + w / 2, y1 = g[1], y0 = g[1] - hh;
  const neck = b.neck ?? 0;
  const sh = neck * hh;
  const nw = w * 0.36;
  const body = neck
    ? `M${f2(x0)},${f2(y1)} V${f2(y0 + sh)} Q${f2(x0)},${f2(y0 + sh * 0.55)} ${f2(g[0] - nw / 2)},${f2(y0 + sh * 0.3)} V${f2(y0)} H${f2(g[0] + nw / 2)} V${f2(y0 + sh * 0.3)} Q${f2(x1)},${f2(y0 + sh * 0.55)} ${f2(x1)},${f2(y0 + sh)} V${f2(y1)} Z`
    : `M${f2(x0)},${f2(y1)} V${f2(y0)} H${f2(x1)} V${f2(y1)} Z`;
  return (
    <g>
      <path d={body} fill={b.c} stroke={INK} strokeWidth={f2(ink)} strokeLinejoin="round" opacity={0.95} />
      {b.fill ? <path d={`M${f2(x0 + ink)},${f2(y1 - ink)} V${f2(y1 - hh * b.fill)} H${f2(x1 - ink)} V${f2(y1 - ink)} Z`} fill={shadeC(b.c, 0.25)} opacity={0.6} /> : null}
      <path d={`M${f2(x0 + w * 0.2)},${f2(y1 - hh * 0.12)} V${f2(y0 + sh + hh * 0.1)}`} stroke="#FFFFFF" strokeWidth={f2(w * 0.09)} strokeLinecap="round" opacity={0.55} />
      {b.cap && neck ? <path d={`M${f2(g[0] - nw * 0.62)},${f2(y0 - hh * 0.06)} H${f2(g[0] + nw * 0.62)} V${f2(y0 + hh * 0.05)} H${f2(g[0] - nw * 0.62)} Z`} fill={b.cap} stroke={INK} strokeWidth={f2(ink)} /> : null}
      {neck ? <path d={`M${f2(x0)},${f2(y1 - hh * 0.38)} H${f2(x1)} V${f2(y1 - hh * 0.62)} H${f2(x0)} Z`} fill="#F4F1EA" opacity={0.85} /> : null}
    </g>
  );
};

/** wall, bench top, front edge, cabinets, tray and back props. blur: px of depth-of-field on the wall and props. */
export const LabRoomMM: React.FC<{id: string; v: View; blur?: number; tray?: [number, number, number, number]; props?: boolean; plate?: number; plateDx?: number}> = ({id, v, blur = 0, tray = [-260, 300, -190, 120], props = true, plate = 1.2, plateDx = 0}) => {
  const {zWall: zw, zFront: zf, slab} = ROOM;
  const X0 = -4000, X1 = 4000;
  const ink = Math.max(1.5, Math.min(4, 0.25 * v.s + 1));
  const doors: React.ReactNode[] = [];
  for (let x = -3000; x <= 3000; x += 600) {
    doors.push(<path key={`d${x}`} d={quad(v, [[x - 280, -slab - 40, zf], [x + 280, -slab - 40, zf], [x + 280, -slab - 520, zf], [x - 280, -slab - 520, zf]])} fill="none" stroke="#244852" strokeWidth={f2(Math.max(2, 1.2 * v.s))} strokeLinejoin="round" />);
    const h0 = P(v, [x - 70, -slab - 80, zf]), h1 = P(v, [x + 70, -slab - 80, zf]);
    doors.push(<path key={`h${x}`} d={`M${f2(h0[0])},${f2(h0[1])} L${f2(h1[0])},${f2(h1[1])}`} stroke="#C9D6DC" strokeWidth={f2(Math.max(3, 2.2 * v.s))} strokeLinecap="round" />);
  }
  const bl = blur > 0.3;
  return (
    <g>
      <defs>
        {bl && (
          <filter id={`${id}-bl`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={f2(blur)} />
          </filter>
        )}
      </defs>
      <g filter={bl ? `url(#${id}-bl)` : undefined}>
        <WallPlate id={`${id}-w`} v={v} k={plate} dx={plateDx} />
        {/* the bench top (dark), its back edge against the wall */}
        <path d={quad(v, [[X0, 0, zw], [X1, 0, zw], [X1, 0, zf], [X0, 0, zf]])} fill={LAB2.benchTop} />
        <path d={quad(v, [[X0, 0, zw], [X1, 0, zw], [X1, 0, zw + 14], [X0, 0, zw + 14]])} fill={shadeC(LAB2.benchTop, 0.3)} />
        {props && PROPS.map((b, i) => <Bottle key={i} v={v} b={b} ink={ink} />)}
      </g>
      {/* the bench front: the slab edge and the cabinet fronts below it */}
      <path d={quad(v, [[X0, 0, zf], [X1, 0, zf], [X1, -slab, zf], [X0, -slab, zf]])} fill={LAB2.benchTopLit} stroke={INK} strokeWidth={f2(ink)} />
      <path d={quad(v, [[X0, -slab, zf], [X1, -slab, zf], [X1, -2600, zf], [X0, -2600, zf]])} fill={LAB2.cabinet} />
      {doors}
      <path d={quad(v, [[X0, -slab, zf], [X1, -slab, zf], [X1, -slab - 14, zf], [X0, -slab - 14, zf]])} fill={LAB2.cabinetDeep} opacity={0.8} />
      {/* the pale experiment tray */}
      <path d={quad(v, [[tray[0], 0, tray[2]], [tray[1], 0, tray[2]], [tray[1], 0, tray[3]], [tray[0], 0, tray[3]]])} fill={LAB2.surface} stroke={shadeC(LAB2.surface, 0.18)} strokeWidth={f2(ink * 0.8)} />
      <path d={quad(v, [[tray[0], 0, tray[3]], [tray[1], 0, tray[3]], [tray[1], -3, tray[3]], [tray[0], -3, tray[3]]])} fill={LAB2.surfaceShade} />
      <path d={quad(v, [[X0, 0, zf - 6], [X1, 0, zf - 6], [X1, 0, zf], [X0, 0, zf]])} fill={litC(LAB2.benchTop, 0.15)} />
    </g>
  );
};
