// Designed hand shapes for the R2 rig, in the approved rounded-mitt language but able to grip, brace, reach and point.
// Hand-local frame: origin at the wrist, +x toward the fingertips (along the projected forearm), +y toward the thumb
// side when `thumb` = +1. Units are rig units (scaled by s). `pv` is how much the palm (+) or the back (−) faces the
// viewer; edge-on hands narrow (a flat hand seen edge-on IS narrow) and lose the palm/back details.
// A held object (`holding`) is drawn between the palm layer and the curled-finger layer, so grips close around it
// (only the 'grip' shape holds things: a pose that carries a prop must use it).
// Palm toward the viewer: the thumb lies across the front, palm creases show. Back toward the viewer: the thumb drops
// behind the hand (only its tip clears the edge), knuckles and tendons show, and a held handle passes behind.
import React from 'react';
import {BLOOD} from '../../theme';
import {lerp, clamp, f2} from '../../kit/math';
import {blobPath} from './util';

export type HandShape = 'relaxed' | 'fist' | 'open' | 'grip' | 'brace' | 'reach' | 'point' | 'limp' | 'pinch';

type HG = {s: number; ink: number; skin: string; inkC: string; pv: number; thumb: number; blood?: number; dirt?: number; spread?: number; holding?: React.ReactNode; shadeC?: string;
  /** the caller draws the glyph in the hand's own plane (figure.tsx handM: thumb side and edge-on width included), so
   *  the glyph is not narrowed or mirrored here */
  framed?: boolean;
  /** blood colour (silhouettes) */
  bloodC?: string};

const cap = (x0: number, y0: number, x1: number, y1: number, w: number, k: number) => {
  // capsule path between two points, width w (rig units), scaled by k
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L, r = w / 2;
  const a = (x: number, y: number) => `${f2(x * k)} ${f2(y * k)}`;
  return `M ${a(x0 + nx * r, y0 + ny * r)} L ${a(x1 + nx * r, y1 + ny * r)} A ${f2(r * k)} ${f2(r * k)} 0 0 0 ${a(x1 - nx * r, y1 - ny * r)} L ${a(x0 - nx * r, y0 - ny * r)} A ${f2(r * k)} ${f2(r * k)} 0 0 0 ${a(x0 + nx * r, y0 + ny * r)} Z`;
};
const rrect = (x0: number, y0: number, x1: number, y1: number, r: number, k: number) => {
  const w = (x1 - x0) * k, h = (y1 - y0) * k;
  return <rect x={x0 * k} y={y0 * k} width={w} height={h} rx={Math.min(r * k, w / 2, h / 2)} />;
};

/** Returns [behind-the-held-object, in-front-of-it] layers. */
export const handGlyph = (shape: HandShape, o: HG): [React.ReactElement, React.ReactElement] => {
  const k = o.s;
  const ws = lerp(0.55, 1, clamp(Math.abs(o.pv)));
  const edge = Math.abs(o.pv) < 0.35;
  const palm = o.pv > 0;
  const th = o.thumb >= 0 ? 1 : -1;
  const sty = {fill: o.skin, stroke: o.inkC, strokeWidth: o.ink, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};
  const line = {fill: 'none', stroke: o.inkC, strokeWidth: o.ink * 0.6, strokeLinecap: 'round' as const};
  const back: React.ReactNode[] = [];
  const front: React.ReactNode[] = [];
  // everything is drawn with y scaled by ws * th (thumb side and edge-on narrowing)
  const wrap = (els: React.ReactNode[], key: string) => (o.framed ? <g key={key}>{els}</g> : <g key={key} transform={`scale(1 ${f2(ws * th)})`}>{els}</g>);
  const sp = o.spread ?? 1;
  switch (shape) {
    case 'relaxed':
    case 'limp': {
      const L = shape === 'limp' ? 31 : 35;
      const thumbEl = <ellipse key="t" cx={15 * k} cy={15 * k} rx={9.5 * k} ry={6.5 * k} transform={`rotate(${shape === 'limp' ? 18 : 32} ${15 * k} ${15 * k})`} {...sty} />;
      if (!palm && !edge) back.push(thumbEl);
      back.push(<path key="b" d={`M 0 ${-11 * k} C ${10 * k} ${-16 * k} ${(L - 6) * k} ${-17 * k} ${L * k} ${-7 * k} C ${(L + 3) * k} ${2 * k} ${(L - 3) * k} ${12 * k} ${(L - 12) * k} ${14 * k} L ${8 * k} ${13 * k} C ${3 * k} ${12 * k} 0 ${11 * k} 0 ${11 * k} Z`} {...sty} />);
      if (palm || edge) {
        back.push(thumbEl);
        back.push(<path key="tf" d={`M ${7 * k} ${9 * k} L ${20 * k} ${9 * k}`} stroke={o.skin} strokeWidth={6 * k} />);
      }
      if (!edge) [-5, 3].forEach((y, i) => back.push(<path key={`f${i}`} d={`M ${(L - 7) * k} ${y * k} L ${(L - 1) * k} ${(y + 0.5) * k}`} {...line} />));
      if (!edge && !palm) [-7, 0, 7].forEach((y, i) => back.push(<path key={`kn${i}`} d={`M ${(L - 16) * k} ${(y - 1.5) * k} q ${2 * k} ${1.5 * k} 0 ${3 * k}`} {...line} opacity={0.7} />));
      break;
    }
    case 'fist':
    case 'grip': {
      // palm block
      const knuckles = (arr: React.ReactNode[], x: number) => [-10, -3.5, 3, 9.5].forEach((y, i) => arr.push(<path key={`kb${i}`} d={`M ${x * k} ${(y - 2.6) * k} q ${3 * k} ${2.6 * k} 0 ${5.2 * k}`} {...line} />));
      if (shape === 'grip') {
        if (palm || edge) {
          back.push(<g key="p" {...sty}>{rrect(-1, -14, 27, 14, 11, k)}</g>);
          if (o.holding) back.push(<g key="hold">{o.holding}</g>);
          // fingers curled over the handle (in front of it), the thumb closing across them
          front.push(<g key="fb" {...sty}>{rrect(14, -15, 32, 13, 8, k)}</g>);
          if (!edge) [-8, -1, 6].forEach((y, i) => front.push(<path key={`k${i}`} d={`M ${16 * k} ${y * k} L ${30 * k} ${(y + 0.5) * k}`} {...line} />));
          front.push(<path key="th" d={cap(8, 13, 24, 9, 9, k)} {...sty} />);
        } else {
          // back of the hand toward us: the handle runs behind the hand, the thumb wraps out of sight
          if (o.holding) back.push(<g key="hold">{o.holding}</g>);
          front.push(<path key="th" d={cap(10, 12, 24, 12, 8, k)} {...sty} />);
          front.push(<g key="p" {...sty}>{rrect(-1, -14, 27, 14, 11, k)}</g>);
          front.push(<g key="fb" {...sty}>{rrect(18, -15, 32, 13, 7, k)}</g>);
          knuckles(front, 19);
          [-6, 0, 6].forEach((y, i) => front.push(<path key={`td${i}`} d={`M ${4 * k} ${(y * 0.6) * k} L ${14 * k} ${y * k}`} {...line} opacity={0.45} />));
        }
      } else {
        const thumbEl = <path key="th" d={cap(6, 13, 20, 7, 9, k)} {...sty} />;
        if (!palm && !edge) back.push(<path key="th" d={cap(8, 12, 21, 12, 8, k)} {...sty} />);
        back.push(<g key="p" {...sty}>{rrect(-1, -14, 27, 14, 11, k)}</g>);
        if (!edge) {
          if (palm) [-8, -1, 6].forEach((y, i) => back.push(<path key={`c${i}`} d={`M ${12 * k} ${y * k} Q ${22 * k} ${(y + 3) * k} ${25 * k} ${y * k}`} {...line} />));
          else { knuckles(back, 21); [-6, 0, 6].forEach((y, i) => back.push(<path key={`td${i}`} d={`M ${3 * k} ${(y * 0.6) * k} L ${15 * k} ${y * k}`} {...line} opacity={0.45} />)); }
        }
        if (palm || edge) back.push(thumbEl);
      }
      break;
    }
    case 'open':
    case 'reach':
    case 'brace': {
      const spread = (shape === 'open' ? 1 : shape === 'reach' ? 0.55 : 0.15) * sp;
      const fl = shape === 'brace' ? [21, 23, 22, 18] : [19, 21, 20, 16];
      const ys = [-9, -3, 3, 9];
      // fingers first (behind the palm edge), then the palm, then the thumb
      ys.forEach((y, i) => {
        const a = ((i - 1.5) * 9 * spread * Math.PI) / 180;
        const x0 = 22, y0 = y * 0.9;
        const x1 = x0 + Math.cos(a) * fl[3 - i] , y1 = y0 + Math.sin(a) * fl[3 - i] - (shape === 'brace' ? 0 : 0);
        back.push(<path key={`f${i}`} d={cap(x0, y0, x1, y1, 7.6, k)} {...sty} />);
      });
      const ta = ((shape === 'brace' ? 40 : 55) * Math.PI) / 180;
      const thumbEl = <path key="t" d={cap(9, 11, 9 + Math.cos(ta) * 17, 11 + Math.sin(ta) * 17, 9, k)} {...sty} />;
      if (!palm && !edge) back.unshift(thumbEl); // from the back the thumb is behind the palm and the fingers
      back.push(<path key="p" d={`M 0 ${-11 * k} C ${8 * k} ${-15 * k} ${20 * k} ${-15 * k} ${25 * k} ${-12 * k} L ${25 * k} ${12 * k} C ${18 * k} ${15 * k} ${8 * k} ${14 * k} 0 ${11 * k} Z`} {...sty} />);
      back.push(<path key="pc" d={`M ${20 * k} ${-12 * k} L ${20 * k} ${12 * k}`} stroke={o.skin} strokeWidth={4 * k} />);
      if (!edge && palm) back.push(<path key="crease" d={`M ${6 * k} ${6 * k} Q ${13 * k} ${0} ${19 * k} ${-6 * k}`} {...line} />);
      if (!edge && !palm) ys.forEach((y, i) => back.push(<path key={`td${i}`} d={`M ${5 * k} ${(y * 0.55) * k} L ${19 * k} ${(y * 0.9) * k}`} {...line} opacity={0.45} />));
      if (palm || edge) back.push(thumbEl);
      break;
    }
    case 'pinch': {
      // thumb and index close on a small round object (a dial knob) at (PINCH_X, 0); the other three fingers curl into
      // the palm. The space between the two fingertips stays open so the knob shows between them.
      const thumbEl = <path key="th" d={cap(9, 12, 26, 9, 8.5, k)} {...sty} />;
      const thumbTip = <path key="tt" d={cap(26, 9, PINCH_X - 1, 6.2, 7.4, k)} {...sty} />;
      if (!palm && !edge) back.push(thumbEl, thumbTip);
      back.push(<g key="p" {...sty}>{rrect(-1, -13, 25, 13, 10, k)}</g>);
      back.push(<g key="cf" {...sty}>{rrect(14, -4, 28, 13, 6.5, k)}</g>);
      if (!edge) [1.5, 7].forEach((y, i) => back.push(<path key={`ck${i}`} d={`M ${17 * k} ${y * k} L ${26 * k} ${(y + 0.4) * k}`} {...line} />));
      back.push(<path key="ix1" d={cap(20, -8, 30, -8.6, 7.6, k)} {...sty} />);
      back.push(<path key="ix2" d={cap(30, -8.6, PINCH_X + 1, -6, 7, k)} {...sty} />);
      if (palm || edge) back.push(thumbEl, thumbTip);
      break;
    }
    case 'point': {
      if (!palm && !edge) back.push(<path key="th" d={cap(8, 12, 21, 11, 8, k)} {...sty} />);
      back.push(<g key="p" {...sty}>{rrect(-1, -14, 26, 13, 11, k)}</g>);
      back.push(<path key="ix" d={cap(22, 8, 44, 8, 7.6, k)} {...sty} />);
      if (palm || edge) back.push(<path key="th" d={cap(6, 13, 20, 9, 9, k)} {...sty} />);
      if (!edge && palm) [-9, -2].forEach((y, i) => back.push(<path key={`c${i}`} d={`M ${12 * k} ${y * k} Q ${20 * k} ${(y + 3) * k} ${23 * k} ${y * k}`} {...line} />));
      if (!edge && !palm) [-10, -3.5, 3].forEach((y, i) => back.push(<path key={`kb${i}`} d={`M ${20 * k} ${(y - 2.6) * k} q ${3 * k} ${2.6 * k} 0 ${5.2 * k}`} {...line} />));
      break;
    }
  }
  // blood is on the palm (cut on the rubble): full on the palm side, only a smear over the knuckles from the back
  if ((o.blood ?? 0) > 0) (front.length ? front : back).push(palm && !edge
    ? <path key="bl" d={blobPath(9 * k, 21, 8, 0.5)} transform={`translate(${f2(14 * k)} ${f2(-2 * k)})`} fill={o.bloodC ?? BLOOD.main} opacity={o.blood} />
    : <path key="bl" d={blobPath(4.5 * k, 23, 7, 0.55, 1.6, 0.7)} transform={`translate(${f2(19 * k)} ${f2(4 * k)})`} fill={o.bloodC ?? BLOOD.main} opacity={(o.blood ?? 0) * 0.55} />);
  if ((o.dirt ?? 0) > 0) back.push(<path key="dt" d={blobPath(7 * k, 5, 8, 0.5)} transform={`translate(${f2(8 * k)} ${f2(-6 * k)})`} fill="rgba(60,45,40,0.3)" opacity={o.dirt} />);
  return [wrap(back, 'hb'), wrap(front, 'hf')];
};

/** Approximate world-ish grip offset: where a held handle's centre sits in hand-local units (for props). */
export const GRIP_X = 21;
/** Where a pinched knob's centre sits in hand-local units (between the thumb and index tips). */
export const PINCH_X = 37;
