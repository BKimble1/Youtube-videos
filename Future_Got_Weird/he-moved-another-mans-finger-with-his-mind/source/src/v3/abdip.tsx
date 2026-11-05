// V3 A/B/H: the diptych. Two room cameras, side by side: Rao's lab frame-left, Stocco's frame-right, separated by a
// narrow gutter of open sky that the network cable crosses. Each panel has a stone window frame, because each
// panel IS a lab window: as `m` goes 0 -> 1 the panels shrink and slide into the two windows of two different
// buildings on the campus (exactly: at m = 1 the panel rect is the window's projected rect and the room camera shows
// the whole room at the window's scale, which is how the campus draws it), and the cable across the gutter
// straightens into the network line that runs down one facade, under the lawn and up the other.
import React from 'react';
import {clamp, fmt, lerp} from '../dc/math';
import {INK, K} from '../art/kit';
import {camLerp, CamS, camT, EXT, Lw, polyOf, Pulse, Rw, RS, toScr, WL, WR} from './abworld';

type V = {x: number; y: number};
export type Rect = {x0: number; y0: number; x1: number; y1: number};
/** a panel: a screen rect, and the room camera (room point cam.x/y at the rect centre, zoom cam.z) */
export type Panel = {rect: Rect; cam: CamS};
export const rc = (r: Rect) => ({x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2});
export const r2s = (pn: Panel, p: V): V => {
  const c = rc(pn.rect);
  return {x: c.x + (p.x - pn.cam.x) * pn.cam.z, y: c.y + (p.y - pn.cam.y) * pn.cam.z};
};
export const s2r = (pn: Panel, p: V): V => {
  const c = rc(pn.rect);
  return {x: pn.cam.x + (p.x - c.x) / pn.cam.z, y: pn.cam.y + (p.y - c.y) / pn.cam.z};
};
export const panelT = (pn: Panel) => {
  const c = rc(pn.rect);
  return `translate(${c.x.toFixed(4)} ${c.y.toFixed(4)}) scale(${pn.cam.z.toFixed(6)}) translate(${(-pn.cam.x).toFixed(4)} ${(-pn.cam.y).toFixed(4)})`;
};
const lerpRect = (a: Rect, b: Rect, k: number): Rect => ({x0: lerp(a.x0, b.x0, k), y0: lerp(a.y0, b.y0, k), x1: lerp(a.x1, b.x1, k), y1: lerp(a.y1, b.y1, k)});
/** the window (CW units) projected under the campus camera */
export const winRect = (C: CamS, w: {x: number; y: number; w: number; h: number}): Rect => {
  const a = toScr(C, {x: w.x, y: w.y}), b = toScr(C, {x: w.x + w.w, y: w.y + w.h});
  return {x0: a.x, y0: a.y, x1: b.x, y1: b.y};
};
/** the full-frame diptych rects for a gutter centred at gx */
export const dipRects = (gx: number, gw = 74): [Rect, Rect] => [
  {x0: -60, y0: -60, x1: gx - gw / 2, y1: 1140},
  {x0: gx + gw / 2, y0: -60, x1: 1980, y1: 1140},
];
/** panel at merge m: rect and room camera move to the window's projection under C */
export const mergePanel = (p: Panel, C: CamS, side: 'L' | 'R', m: number): Panel => {
  if (m <= 0) return p;
  const wr = winRect(C, side === 'L' ? WL : WR);
  const winCam: CamS = {x: 960, y: 540, z: (wr.x1 - wr.x0) / 1920};
  return {rect: lerpRect(p.rect, wr, m), cam: camLerp(p.cam, winCam, m)};
};

/** where a room route crosses a panel's vertical edge (room x = xe): the last crossing for the outgoing route (L),
 *  the first for the incoming one (R) */
const crossing = (pts: V[], xe: number, last: boolean): V | null => {
  let hit: V | null = null;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if ((a.x - xe) * (b.x - xe) <= 0 && a.x !== b.x) {
      const u = (xe - a.x) / (b.x - a.x);
      const p = {x: xe, y: lerp(a.y, b.y, u)};
      if (!last) return p;
      hit = p;
    }
  }
  return hit;
};

/** the cable across the gutter (screen space): from where Rao's route leaves the left panel to where Stocco's
 *  route enters the right one. At m = 1 it is exactly the projected campus network line. */
export const bridgePts = (L: Panel, R: Panel, C: CamS, m: number, routeL: V[], routeR: V[]): V[] => {
  const xl = s2r(L, {x: L.rect.x1, y: 0}).x;
  const xr = s2r(R, {x: R.rect.x0, y: 0}).x;
  const exR = xl >= routeL[routeL.length - 1].x ? routeL[routeL.length - 1] : crossing(routeL, xl, true) ?? routeL[routeL.length - 1];
  const enR = xr <= routeR[0].x ? routeR[0] : crossing(routeR, xr, false) ?? routeR[0];
  const ex = r2s(L, exR), en = r2s(R, enR);
  const gx = (L.rect.x1 + R.rect.x0) / 2;
  const ext = EXT.pts.map((p) => toScr(C, p));
  const z: V[] = EXT.pts.map((_, i) => {
    if (i === 0) return ex;
    if (i === EXT.pts.length - 1) return en;
    if (i <= 3) return {x: gx, y: ex.y};
    if (i >= 10) return {x: gx, y: en.y};
    return {x: gx, y: lerp(ex.y, en.y, (i - 3) / 7)};
  });
  return z.map((q, i) => ({x: lerp(q.x, ext[i].x, m), y: lerp(q.y, ext[i].y, m)}));
};

/** the stone window frame of a panel (at m = 1 it matches the campus Facade's window surround) */
const Frame: React.FC<{r: Rect; bw: number; zc: number; sill: number}> = ({r, bw, zc, sill}) => (
  <g>
    <rect x={fmt(r.x0 - bw)} y={fmt(r.y0 - bw)} width={fmt(r.x1 - r.x0 + 2 * bw)} height={fmt(r.y1 - r.y0 + 2 * bw)} rx={fmt(6 * zc)} fill={K.stone} stroke={INK} strokeWidth={fmt(6 * zc)} />
    {sill > 0.001 && <rect x={fmt(r.x0 - 34 * zc)} y={fmt(r.y1 + 20 * zc)} width={fmt(r.x1 - r.x0 + 68 * zc)} height={fmt(20 * zc)} fill={K.stone} stroke={INK} strokeWidth={fmt(5 * zc)} opacity={sill} />}
  </g>
);

export type DipProps = {
  id: string;
  L: Panel;
  R: Panel;
  roomL: React.ReactNode;
  roomR: React.ReactNode;
  /** campus camera and merge 0..1; the campus is drawn behind (it shows in the gutter and around the panels) */
  C: CamS;
  m: number;
  campus: React.ReactNode;
  /** the cable across: lit wire 0..1 and a pulse head 0..1 (< 0 off) */
  lit?: number;
  sig?: number;
  routeL: V[];
  routeR: V[];
  /** hide one panel entirely (it is off screen) */
  only?: 'L' | 'R';
};
export const Diptych: React.FC<DipProps> = ({id, L, R, roomL, roomR, C, m, campus, lit = 0, sig = -1, routeL, routeR, only}) => {
  const pL = mergePanel(L, C, 'L', m), pR = mergePanel(R, C, 'R', m);
  const zc = C.z;
  const bw = lerp(16, 22 * zc, m);
  const sill = clamp((m - 0.5) / 0.5);
  const br = polyOf(bridgePts(pL, pR, C, m, routeL, routeR));
  const cw = lerp(9, Math.max(3, 10 * Math.sqrt(zc) * 0.7), m);
  const brD = `M${br.pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')}`;
  const panel = (p: Panel, room: React.ReactNode, side: string) => (
    <g>
      <Frame r={p.rect} bw={bw} zc={lerp(1.4, zc, m)} sill={sill} />
      <defs>
        <clipPath id={`${id}-${side}`}>
          <rect x={fmt(p.rect.x0)} y={fmt(p.rect.y0)} width={fmt(p.rect.x1 - p.rect.x0)} height={fmt(p.rect.y1 - p.rect.y0)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-${side})`}>
        <g transform={panelT(p)}>{room}</g>
        {m > 0.3 && <path d={`M${p.rect.x0 + 40 * zc},${p.rect.y0} L${p.rect.x0 + 150 * zc},${p.rect.y0} L${p.rect.x0 + 30 * zc},${p.rect.y1} L${p.rect.x0 - 80 * zc},${p.rect.y1} Z`} fill="#FFFFFF" opacity={0.1 * clamp((m - 0.3) / 0.7)} />}
      </g>
      <rect x={fmt(p.rect.x0)} y={fmt(p.rect.y0)} width={fmt(p.rect.x1 - p.rect.x0)} height={fmt(p.rect.y1 - p.rect.y0)} fill="none" stroke={INK} strokeWidth={fmt(lerp(6, 5 * zc, m))} />
    </g>
  );
  return (
    <g>
      {campus}
      {/* the network cable across the gap */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={brD} stroke={INK} strokeWidth={fmt(cw * 1.9)} />
        <path d={brD} stroke="#5D6B76" strokeWidth={fmt(cw)} />
        {lit > 0.01 && <path d={brD} stroke={K.saffron} strokeWidth={fmt(cw * 2.8)} opacity={0.35 * lit} />}
        {lit > 0.01 && <path d={brD} stroke={K.saffron} strokeWidth={fmt(cw * 0.95)} opacity={lit} />}
      </g>
      {sig >= 0 && <Pulse P={br} k={sig} len={0.18} w={cw * 0.95} color={K.saffron} />}
      {only !== 'R' && panel(pL, roomL, 'L')}
      {only !== 'L' && panel(pR, roomR, 'R')}
    </g>
  );
};

/** the room point and zoom that put the WHOLE room into a window (for checks) */
export const windowCamOf = (C: CamS, side: 'L' | 'R'): Panel => {
  const wr = winRect(C, side === 'L' ? WL : WR);
  return {rect: wr, cam: {x: 960, y: 540, z: (wr.x1 - wr.x0) / 1920}};
};
export {Lw, Rw, RS, camT};
