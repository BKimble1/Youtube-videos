import React from 'react';
import {C, F, OUTLINE} from '../../theme';

/**
 * S4's card catalogue: a variant of components/v2/Catalogue (CatalogueV2) built on the same idea and drawing language
 * (wood body, woodLight drawer fronts, cream label plates, saffron pulls; the open drawer comes forward = down and a
 * little larger, and its box — side walls, floor, standing cards — fills the space, so the slot is never an empty
 * hole). Changes for S4: a 3 × 3 cabinet on short legs sized to the clerk, label plates large enough to read on a phone
 * in the medium shot, cards that rattle when the drawer stops, an `open` value that may overshoot past 1 (the drawer
 * runs on and settles), and exported geometry so the scene can put a hand exactly on the pull and lift the frontmost
 * card out of the box. Origin: the cabinet's bottom centre on the floor (world coords via `x`, `y`).
 */
export const CAT = {
  leg: 44,
  dw: 150,
  dh: 72,
  gap: 9,
  cols: 3,
  rows: 3,
  out: 58, // how far the front travels down (towards the viewer) when fully open
  grow: 0.14, // and how much larger it gets
};
export const CAT_W = CAT.cols * CAT.dw + (CAT.cols + 1) * CAT.gap;
export const CAT_H = CAT.rows * CAT.dh + (CAT.rows + 1) * CAT.gap;
const BODY_TOP = -(CAT.leg + CAT_H);
export const CAT_TOP = BODY_TOP - 18; // top of the cap (local y)

const drawerXY = (r: number, c: number) => ({x: -CAT_W / 2 + CAT.gap + c * (CAT.dw + CAT.gap), y: BODY_TOP + CAT.gap + r * (CAT.dh + CAT.gap)});

/** Geometry of drawer (r, c) at an opening `k` (local coords). */
export const drawerGeom = (r: number, c: number, k: number) => {
  const {x, y} = drawerXY(r, c);
  const kk = Math.max(0, k);
  const g = 1 + CAT.grow * kk;
  const fw = CAT.dw * g;
  const fh = CAT.dh * g;
  const fx = x + CAT.dw / 2 - fw / 2;
  const fy = y + CAT.out * kk;
  return {
    x, y, fx, fy, fw, fh, g,
    pull: {x: fx + fw / 2, y: fy + fh * 0.7},
    label: {x: fx + fw / 2, y: fy + fh * 0.29},
    /** the frontmost card standing in the box: its top edge and width (it is clipped by the front's top edge) */
    card: {cx: fx + fw / 2, top: fy - 12 * kk, w: 136},
  };
};
export const CARD_IN_W = 136;

export const Catalogue: React.FC<{
  x: number;
  y: number;
  row: number;
  col: number;
  open: number; // 0 shut … 1 fully out (may overshoot slightly)
  labels: string[]; // row-major
  litLabel?: number;
  rattle?: number; // px jiggle of the cards inside
  hideFrontCard?: boolean; // the frontmost card has been taken out
  tapLabel?: number; // 0..1 a fingertip press on the label (the plate dips 1 px)
}> = ({x, y, row, col, open, labels, litLabel = 0, rattle = 0, hideFrontCard, tapLabel = 0}) => {
  const k = Math.max(0, open);
  const d = drawerGeom(row, col, k);
  const W0 = CAT_W + 60;
  const H0 = CAT.leg + CAT_H + 60;
  const face = (fx: number, fy: number, fw: number, fh: number, i: number, lit = 0, press = 0) => (
    <g key={i}>
      <rect x={fx} y={fy} width={fw} height={fh} rx={6} fill={C.woodLight} stroke={C.ink} strokeWidth={3} />
      <rect x={fx + fw * 0.16} y={fy + fh * 0.1 + press} width={fw * 0.68} height={fh * 0.38} rx={3} fill={lit > 0 ? mixHex(C.cream, C.saffronLight, lit) : C.cream} stroke={C.ink} strokeWidth={2.5} />
      <text x={fx + fw / 2} y={fy + fh * 0.1 + fh * 0.38 * 0.74 + press} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={fh * 0.29} fill={C.ink}>
        {labels[i]}
      </text>
      <rect x={fx + fw * 0.33} y={fy + fh * 0.62} width={fw * 0.34} height={fh * 0.16} rx={5} fill={C.saffronDeep} stroke={C.ink} strokeWidth={2.5} />
      {lit > 0 && <rect x={fx - 5} y={fy - 5} width={fw + 10} height={fh + 10} rx={10} fill="none" stroke={C.saffron} strokeWidth={6} opacity={lit} />}
    </g>
  );
  const cards = 8;
  return (
    <svg
      viewBox={`${-W0 / 2} ${-H0} ${W0} ${H0 + 30}`}
      width={W0}
      height={H0 + 30}
      style={{position: 'absolute', left: x - W0 / 2, top: y - H0, overflow: 'visible'}}
    >
      {/* floor shadow and legs */}
      <ellipse cx={0} cy={2} rx={CAT_W * 0.52} ry={13} fill={C.shadow} />
      {[-1, 1].map((s) => (
        <rect key={s} x={s * (CAT_W / 2 - 30) - 14} y={-CAT.leg - 6} width={28} height={CAT.leg + 4} rx={5} fill={C.woodDeep} stroke={C.ink} strokeWidth={OUTLINE} />
      ))}
      {/* body and cap */}
      <rect x={-CAT_W / 2} y={BODY_TOP} width={CAT_W} height={CAT_H} rx={10} fill={C.wood} stroke={C.ink} strokeWidth={OUTLINE} />
      <rect x={-CAT_W / 2 - 10} y={CAT_TOP} width={CAT_W + 20} height={20} rx={6} fill={C.woodDeep} stroke={C.ink} strokeWidth={OUTLINE} />
      {Array.from({length: CAT.rows}).map((_, r) =>
        Array.from({length: CAT.cols}).map((_, c) => {
          if (r === row && c === col) return null;
          const p = drawerXY(r, c);
          return face(p.x, p.y, CAT.dw, CAT.dh, r * CAT.cols + c);
        }),
      )}
      {/* the drawer's slot: the dark back of the opening, then the drawer box drawn over it */}
      <rect x={d.x} y={d.y} width={CAT.dw} height={CAT.dh} rx={6} fill={C.ink} opacity={0.82} />
      {k > 0.005 && (
        <g>
          {/* floor of the box, seen from above */}
          <path d={`M ${d.x + 5} ${d.y + 7} L ${d.x + CAT.dw - 5} ${d.y + 7} L ${d.fx + d.fw - 7} ${d.fy + 5} L ${d.fx + 7} ${d.fy + 5} Z`} fill={C.woodDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
          {/* the cards standing in the box: their top edges, back to front; a brass rod runs through them */}
          {Array.from({length: cards}).map((_, j) => {
            if (hideFrontCard && j === cards - 1) return null;
            const u = (j + 1) / (cards + 1);
            const yy = d.y + 7 + (d.fy - d.y) * u - 3 + rattle * Math.sin(j * 1.9 + 0.7) * (0.5 + 0.5 * u);
            const xl = d.x + 9 + (d.fx + 9 - (d.x + 9)) * u;
            const xr = d.x + CAT.dw - 9 + (d.fx + d.fw - 9 - (d.x + CAT.dw - 9)) * u;
            const tab = j === 2;
            return (
              <g key={j}>
                <rect x={xl} y={yy - 9 * d.g} width={xr - xl} height={9 * d.g} rx={2} fill={C.cream} stroke={C.inkMuted} strokeWidth={1.6} />
                {tab && <rect x={xl + (xr - xl) * 0.62} y={yy - 17 * d.g} width={26 * d.g} height={10 * d.g} rx={2} fill={C.coralLight} stroke={C.inkMuted} strokeWidth={1.6} />}
              </g>
            );
          })}
          {/* side walls of the box */}
          <path d={`M ${d.x} ${d.y + 4} L ${d.fx} ${d.fy + 3} L ${d.fx} ${d.fy + d.fh * 0.55} L ${d.x} ${d.y + CAT.dh * 0.55} Z`} fill={C.wood} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
          <path d={`M ${d.x + CAT.dw} ${d.y + 4} L ${d.fx + d.fw} ${d.fy + 3} L ${d.fx + d.fw} ${d.fy + d.fh * 0.55} L ${d.x + CAT.dw} ${d.y + CAT.dh * 0.55} Z`} fill={C.wood} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
          {/* the pulled front throws a soft shadow on the drawer below */}
          <rect x={d.fx + 6} y={d.fy + d.fh - 2} width={d.fw - 12} height={10 * k} rx={4} fill={C.shadow} />
        </g>
      )}
      {face(d.fx, d.fy, d.fw, d.fh, row * CAT.cols + col, litLabel, tapLabel * 1.5)}
    </svg>
  );
};

const hx = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, t: number) => {
  const A = hx(a);
  const B = hx(b);
  const m = A.map((v, i) => Math.round(v + (B[i] - v) * Math.max(0, Math.min(1, t))));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
};
