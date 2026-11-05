// The JIZAI ARMS base unit: a black backpack body on the wearer's back with a white structural frame carrying SIX
// terminals (an upper pair on posts above the shoulders, a middle pair on the pack's sides, a lower pair at the hips).
// The reported design is "a wearable base unit with six terminals and detachable robot arms"; the exact terminal
// placement here is an illustration of that layout, not a measured drawing (see production/SOURCE_NOTES.md).
import React from 'react';
import {Capsule} from '../dc/shade';
import {Deco, Inked, InkPath} from '../dc/ink';
import {lit, shade} from '../dc/color';
import {fmt, P} from '../dc/math';
import {a3, d3, frameZ, Item, k3, M3, n3, Proj, s3, V3, v3} from './m3';
import {BodyFrame} from './body';
import {RC, socketItem} from './robot';

export type TermId = 'UL' | 'UR' | 'ML' | 'MR' | 'LL' | 'LR';
export const TERMS: TermId[] = ['UL', 'UR', 'ML', 'MR', 'LL', 'LR'];
/** body-local terminal centres and axes (+x = the wearer's left) */
const TLOC: Record<TermId, {c: V3; ax: V3}> = {
  UL: {c: v3(13.2, 157.5, -19.5), ax: v3(0.42, 0.88, -0.22)},
  UR: {c: v3(-13.2, 157.5, -19.5), ax: v3(-0.42, 0.88, -0.22)},
  ML: {c: v3(17.2, 127, -21), ax: v3(1, 0.04, -0.28)},
  MR: {c: v3(-17.2, 127, -21), ax: v3(-1, 0.04, -0.28)},
  LL: {c: v3(16.6, 104, -18.5), ax: v3(0.92, -0.36, 0.08)},
  LR: {c: v3(-16.6, 104, -18.5), ax: v3(-0.92, -0.36, 0.08)},
};
export type Term = {id: TermId; c: V3; ax: V3; B: M3; face: V3};
/** World terminal frames for a wearer. B.z = the terminal axis; B.x leans toward the wearer's front. */
export const terminal = (F: BodyFrame, id: TermId): Term => {
  const t = TLOC[id];
  const c = F.toW(t.c);
  const ax = n3(F.dirW(t.ax));
  const B = frameZ(ax, F.dirW(v3(0, 0, 1)));
  return {id, c, ax, B, face: a3(c, k3(ax, 1.6))};
};

const polyD = (pts: {x: number; y: number}[]) => `M${pts.map(P).join(' L')} Z`;

/** Backpack body, frame rails and posts, and the six sockets. `occupied` marks the terminals with an arm plugged in;
 *  `led` 0..1 per terminal (status light). */
export const harnessItems = (Pj: Proj, F: BodyFrame, id: string, occupied: Partial<Record<TermId, boolean>>, led: Partial<Record<TermId, number>> = {}, ink = 0.6): Item[] => {
  const items: Item[] = [];
  const X0 = -14.6, X1 = 14.6, Y0 = 98, Y1 = 151, Z0 = -28.5, Z1 = -12;
  const C = (x: number, y: number, z: number) => F.toW(v3(x, y, z));
  const corners = {
    lbb: C(X0, Y0, Z0), rbb: C(X1, Y0, Z0), lbf: C(X0, Y0, Z1), rbf: C(X1, Y0, Z1),
    ltb: C(X0 + 1.5, Y1, Z0 + 1.5), rtb: C(X1 - 1.5, Y1, Z0 + 1.5), ltf: C(X0 + 1, Y1, Z1), rtf: C(X1 - 1, Y1, Z1),
  };
  const faces: {pts: V3[]; n: V3; col: string; key: string}[] = [
    {pts: [corners.lbb, corners.rbb, corners.rtb, corners.ltb], n: F.dirW(v3(0, 0, -1)), col: '#30363E', key: 'back'},
    {pts: [corners.rbb, corners.rbf, corners.rtf, corners.rtb], n: F.dirW(v3(1, 0, 0)), col: '#2A3038', key: 'sideL'},
    {pts: [corners.lbf, corners.lbb, corners.ltb, corners.ltf], n: F.dirW(v3(-1, 0, 0)), col: '#2A3038', key: 'sideR'},
    {pts: [corners.ltb, corners.rtb, corners.rtf, corners.ltf], n: F.dirW(v3(0, 1, 0.1)), col: '#3A414A', key: 'top'},
    {pts: [corners.lbf, corners.rbf, corners.rbb, corners.lbb], n: F.dirW(v3(0, -1, 0)), col: '#22272E', key: 'bot'},
  ];
  const cen = C(0, (Y0 + Y1) / 2, (Z0 + Z1) / 2);
  const zc = Pj.p(cen).z;
  const k = Pj.k(zc);
  const vis = faces.filter((f) => d3(f.n, s3(Pj.eye, f.pts[0])) > 0);
  items.push({
    z: zc + 4,
    key: `${id}-pack`,
    el: (
      <g>
        <Inked w={ink * k}>
          {vis.map((f) => {
            const pts = f.pts.map((q) => Pj.p(q));
            return <InkPath key={f.key} d={polyD(pts)} fill={f.col} />;
          })}
        </Inked>
        <Deco>
          {vis.map((f) => {
            const pts = f.pts.map((q) => Pj.p(q));
            const c = {x: pts.reduce((s, q) => s + q.x, 0) / 4, y: pts.reduce((s, q) => s + q.y, 0) / 4};
            // fabric panel seam and a soft sheen toward the light
            const inset = pts.map((q) => ({x: c.x + (q.x - c.x) * 0.82, y: c.y + (q.y - c.y) * 0.82}));
            return (
              <g key={f.key}>
                <path d={polyD(inset)} fill="none" stroke="#4E5864" strokeWidth={fmt(0.3 * k)} strokeDasharray={`${fmt(1.1 * k)} ${fmt(0.8 * k)}`} opacity={0.7} />
                <path d={polyD(pts)} fill={lit('#30363E', 0.25)} opacity={0.08} />
              </g>
            );
          })}
        </Deco>
      </g>
    ),
  });
  // white frame: two rails up the pack's outer back corners, a cross bar, and posts to the upper terminals
  const rail = (key: string, a: V3, b: V3, r: number, dz = -0.5) => {
    const A = Pj.p(a), B = Pj.p(b);
    const kk = Pj.k((A.z + B.z) / 2);
    items.push({
      z: (A.z + B.z) / 2 + dz,
      key: `${id}-${key}`,
      el: (
        <Inked w={ink * kk * 0.8}>
          <Capsule id={`${id}-${key}`} a={A} b={B} ra={r * kk} rb={r * kk} color={RC.shell} spec={0.5} k={1.1} />
        </Inked>
      ),
    });
  };
  ([1, -1] as const).forEach((sx) => {
    const s = sx === 1 ? 'L' : 'R';
    rail(`rail${s}`, C(15.2 * sx, 99, -22), C(13.6 * sx, 150, -21), 1.5);
    rail(`post${s}`, C(13.0 * sx, 148.5, -20.5), C(13.2 * sx, 155.6, -19.7), 1.9, -1);
    rail(`midm${s}`, C(14.8 * sx, 127, -21), C(16.2 * sx, 127, -21), 2.2, -1);
    rail(`lowm${s}`, C(14.9 * sx, 104, -19), C(15.8 * sx, 104, -18.8), 2.2, -1);
  });
  rail('cross', C(-14, 140, -29), C(14, 140, -29), 1.4);
  // sockets
  (['UL', 'UR', 'ML', 'MR', 'LL', 'LR'] as TermId[]).forEach((tid) => {
    const t = terminal(F, tid);
    items.push(socketItem(Pj, `${id}-sk${tid}`, t.c, t.ax, t.B, ink, led[tid] ?? (occupied[tid] ? 1 : 0), !!occupied[tid]));
  });
  void shade;
  return items;
};

export const termPos = (Pj: Proj, F: BodyFrame, tid: TermId) => Pj.p(terminal(F, tid).c);
