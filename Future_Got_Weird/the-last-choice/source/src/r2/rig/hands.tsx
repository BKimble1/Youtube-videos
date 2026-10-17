// Designed hand shapes for the R2 rig, in the approved rounded-mitt language but able to grip, brace, reach and point.
// Hand-local frame: origin at the wrist, +x toward the fingertips (along the projected forearm), +y toward the thumb
// side when `thumb` = +1. Units are rig units (scaled by s). `pv` is how much the palm (+) or the back (−) faces the
// viewer; edge-on hands narrow (a flat hand seen edge-on IS narrow) and lose the palm/back details.
// A held object (`holding`) is drawn between the palm layer and the curled-finger layer, so grips close around it.
import React from 'react';
import {BLOOD} from '../../theme';
import {lerp, clamp, f2} from '../../kit/math';
import {blobPath} from './util';

export type HandShape = 'relaxed' | 'fist' | 'open' | 'grip' | 'brace' | 'reach' | 'point' | 'limp';

type HG = {s: number; ink: number; skin: string; inkC: string; pv: number; thumb: number; blood?: number; dirt?: number; spread?: number; holding?: React.ReactNode; shadeC?: string};

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
  const wrap = (els: React.ReactNode[], key: string) => <g key={key} transform={`scale(1 ${f2(ws * th)})`}>{els}</g>;
  const sp = o.spread ?? 1;
  switch (shape) {
    case 'relaxed':
    case 'limp': {
      const L = shape === 'limp' ? 31 : 35;
      back.push(<path key="b" d={`M 0 ${-11 * k} C ${10 * k} ${-16 * k} ${(L - 6) * k} ${-17 * k} ${L * k} ${-7 * k} C ${(L + 3) * k} ${2 * k} ${(L - 3) * k} ${12 * k} ${(L - 12) * k} ${14 * k} L ${8 * k} ${13 * k} C ${3 * k} ${12 * k} 0 ${11 * k} 0 ${11 * k} Z`} {...sty} />);
      back.push(<ellipse key="t" cx={15 * k} cy={15 * k} rx={9.5 * k} ry={6.5 * k} transform={`rotate(${shape === 'limp' ? 18 : 32} ${15 * k} ${15 * k})`} {...sty} />);
      back.push(<path key="tf" d={`M ${7 * k} ${9 * k} L ${20 * k} ${9 * k}`} stroke={o.skin} strokeWidth={6 * k} />);
      if (!edge) [-5, 3].forEach((y, i) => back.push(<path key={`f${i}`} d={`M ${(L - 7) * k} ${y * k} L ${(L - 1) * k} ${(y + 0.5) * k}`} {...line} />));
      break;
    }
    case 'fist':
    case 'grip': {
      // palm block
      back.push(<g key="p" {...sty}>{rrect(-1, -14, 27, 14, 11, k)}</g>);
      if (shape === 'grip') {
        if (o.holding) back.push(<g key="hold">{o.holding}</g>);
        // fingers curled over the handle (in front of it)
        front.push(<g key="fb" {...sty}>{rrect(14, -15, 32, 13, 8, k)}</g>);
        if (!edge) [-8, -1, 6].forEach((y, i) => front.push(<path key={`k${i}`} d={`M ${16 * k} ${y * k} L ${30 * k} ${(y + 0.5) * k}`} {...line} />));
        front.push(<path key="th" d={cap(8, 13, 24, 9, 9, k)} {...sty} />);
      } else {
        if (!edge) {
          if (palm) [-8, -1, 6].forEach((y, i) => back.push(<path key={`c${i}`} d={`M ${12 * k} ${y * k} Q ${22 * k} ${(y + 3) * k} ${25 * k} ${y * k}`} {...line} />));
          else back.push(<path key="kn" d={`M ${22 * k} ${-12 * k} Q ${26 * k} 0 ${22 * k} ${11 * k}`} {...line} />);
        }
        back.push(<path key="th" d={cap(6, 13, 20, 7, 9, k)} {...sty} />);
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
      back.push(<path key="p" d={`M 0 ${-11 * k} C ${8 * k} ${-15 * k} ${20 * k} ${-15 * k} ${25 * k} ${-12 * k} L ${25 * k} ${12 * k} C ${18 * k} ${15 * k} ${8 * k} ${14 * k} 0 ${11 * k} Z`} {...sty} />);
      back.push(<path key="pc" d={`M ${20 * k} ${-12 * k} L ${20 * k} ${12 * k}`} stroke={o.skin} strokeWidth={4 * k} />);
      if (!edge && palm) back.push(<path key="crease" d={`M ${6 * k} ${6 * k} Q ${13 * k} ${0} ${19 * k} ${-6 * k}`} {...line} />);
      const ta = ((shape === 'brace' ? 40 : 55) * Math.PI) / 180;
      back.push(<path key="t" d={cap(9, 11, 9 + Math.cos(ta) * 17, 11 + Math.sin(ta) * 17, 9, k)} {...sty} />);
      break;
    }
    case 'point': {
      back.push(<g key="p" {...sty}>{rrect(-1, -14, 26, 13, 11, k)}</g>);
      back.push(<path key="ix" d={cap(22, 8, 44, 8, 7.6, k)} {...sty} />);
      back.push(<path key="th" d={cap(6, 13, 20, 9, 9, k)} {...sty} />);
      if (!edge && !palm) back.push(<path key="kn" d={`M ${22 * k} ${-12 * k} Q ${25 * k} ${-3 * k} ${21 * k} ${4 * k}`} {...line} />);
      break;
    }
  }
  if ((o.blood ?? 0) > 0) (front.length ? front : back).push(<path key="bl" d={blobPath(9 * k, 21, 8, 0.5)} transform={`translate(${f2(14 * k)} ${f2(-2 * k)})`} fill={BLOOD.main} opacity={o.blood} />);
  if ((o.dirt ?? 0) > 0) back.push(<path key="dt" d={blobPath(7 * k, 5, 8, 0.5)} transform={`translate(${f2(8 * k)} ${f2(-6 * k)})`} fill="rgba(60,45,40,0.3)" opacity={o.dirt} />);
  return [wrap(back, 'hb'), wrap(front, 'hf')];
};

/** Approximate world-ish grip offset: where a held handle's centre sits in hand-local units (for props). */
export const GRIP_X = 21;
