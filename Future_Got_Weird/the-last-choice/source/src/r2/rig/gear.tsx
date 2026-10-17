// Carried gear drawn in the rig's own space (so it never floats off a hip or a grip), in the kit's palette (props.tsx):
//   satchelParts(r, sat, ink, col)  host's canvas satchel on the left hip, strap over the right shoulder; its flares and
//                                   smoke canisters stand out of the top. figureParts draws it from dmg.satchel, which
//                                   dmgR2('flares', T) sets for the whole film, so every caller gets it with the right fill.
//   breakerCarry()                  honest's breaker carried in one hand by the tube (tank and ram head either side of the fist)
//   controllerHold()                checker's drone controller in one hand (before her drone is up)
// Only type imports from figure.tsx (figure.tsx imports this file).
import React from 'react';
import {C} from '../../theme';
import {V3, f2, clamp} from '../../kit/math';
import type {HoldFn, Rig2, Part, Basis} from './figure';

const METAL = '#8E989F', METAL_D = '#5B646B', RUBBER = '#26292C';
const CANVAS = '#7A6A4C', CANVAS_D = '#5E5139', FLARE = '#C0392B', CAN = '#7D8A90';

const P = (q: {x: number; y: number}) => `${f2(q.x)} ${f2(q.y)}`;
const at3 = (o: V3, b: Basis, r: number, u: number, f: number): V3 => ({
  x: o.x + b.R.x * r + b.U.x * u + b.F.x * f, y: o.y + b.R.y * r + b.U.y * u + b.F.y * f, z: o.z + b.R.z * r + b.U.z * u + b.F.z * f,
});

/** What is left in the satchel (counts; the bag sags as it empties). */
export type Satchel = {flares: number; canisters: number};

/** The satchel on the left hip (strap over the right shoulder): flap, buckle, the flares and canisters still in it. */
export const satchelParts = (r: Rig2, sat: Satchel, inkC: string = C.ink, col: (c: string) => string = (c) => c): Part[] => {
  const s = r.s, ink = r.ink;
  const nF = Math.max(0, Math.min(3, Math.round(sat.flares))), nC = Math.max(0, Math.min(2, Math.round(sat.canisters)));
  const sag = 1 - (nF + nC) / 4; // 0 full … 1 empty
  const c = at3(r.P, r.base, -84 * s, -14 * s - 6 * sag * s, -8 * s); // bag centre (left hip, a little back)
  const fwd = r.base.F, rt = r.base.R;
  // the bag: a box seen from this side (width along the body's forward axis, depth across); flatter when empty
  const w = 92 * s, h = (74 - 12 * sag) * s, d = (30 - 12 * sag) * s;
  const ax = {x: fwd.x * w, y: fwd.y * w}, ay = {x: 0, y: h}, az = {x: -rt.x * d, y: -rt.y * d};
  const corner = (i: number, j: number, k: number) => ({x: c.x + ax.x * i + ay.x * j + az.x * k, y: c.y + ax.y * i + ay.y * j + az.y * k});
  const front = [corner(-0.5, -0.5, 0.5), corner(0.5, -0.5, 0.5), corner(0.5, 0.5, 0.5), corner(-0.5, 0.5, 0.5)];
  const side = rt.z < 0 ? 1 : -1; // which end of the bag shows
  const end = [corner(side * 0.5, -0.5, 0.5), corner(side * 0.5, -0.5, -0.5), corner(side * 0.5, 0.5, -0.5), corner(side * 0.5, 0.5, 0.5)];
  const flapDrop = -0.05 + 0.12 * sag;
  const flap = [corner(-0.52, -0.52, 0.55), corner(0.52, -0.52, 0.55), corner(0.5, flapDrop, 0.56), corner(-0.5, flapDrop, 0.56)];
  const zBag = -rt.z > 0.05 ? r.torsoZ + 32 : r.torsoZ - 32; // the bag is on his left: in front when his left faces us
  // flares (red sticks) and canisters (slate cans) standing out of the top behind the flap
  const top = (u: number) => corner(u, -0.5, 0);
  const items: React.ReactNode[] = [];
  const flareU = [-0.3, -0.12, 0.04].slice(0, nF), canU = [0.2, 0.34].slice(0, nC);
  canU.forEach((u, i) => {
    const b = top(u), y0 = b.y - 22 * s;
    items.push(<g key={`c${i}`}>
      <rect x={b.x - 11 * s} y={y0} width={22 * s} height={26 * s} rx={4 * s} fill={col(CAN)} stroke={inkC} strokeWidth={ink * 0.6} />
      <rect x={b.x - 11 * s} y={y0} width={22 * s} height={7 * s} rx={3 * s} fill={col('#3E4A50')} />
    </g>);
  });
  flareU.forEach((u, i) => {
    const b = top(u), t = {x: b.x, y: b.y - 34 * s};
    items.push(<g key={`f${i}`}><path d={`M ${P(b)} L ${P(t)}`} stroke={inkC} strokeWidth={12 * s + ink} strokeLinecap="round" /><path d={`M ${P(b)} L ${P(t)}`} stroke={col(FLARE)} strokeWidth={12 * s} strokeLinecap="round" /></g>);
  });
  const buckle = corner(0, flapDrop - 0.07, 0.56);
  const bag = (
    <g strokeLinejoin="round">
      {items}
      <path d={'M ' + end.map(P).join(' L ') + ' Z'} fill={col(CANVAS_D)} stroke={inkC} strokeWidth={ink * 0.8} />
      <path d={'M ' + front.map(P).join(' L ') + ' Z'} fill={col(CANVAS)} stroke={inkC} strokeWidth={ink * 0.9} />
      <path d={'M ' + flap.map(P).join(' L ') + ' Z'} fill={col(CANVAS_D)} stroke={inkC} strokeWidth={ink * 0.8} />
      <rect x={buckle.x - 5 * s} y={buckle.y - 4 * s} width={10 * s} height={8 * s} rx={2 * s} fill={col(METAL)} stroke={inkC} strokeWidth={ink * 0.5} />
    </g>
  );
  // the strap: from the right shoulder over the chest (or the back) to the bag's ends
  const shR = r.sh[1];
  const chestF = r.up.F.z > 0; // his chest faces us
  const mid = at3(r.P, r.up, 10 * s, 70 * s, chestF ? 38 * s : -38 * s);
  const a = corner(-0.45, -0.5, 0.2), b = corner(0.45, -0.5, 0.2);
  const strapD = `M ${P(shR)} Q ${P(mid)} ${P(chestF ? a : b)}`;
  return [
    {z: zBag, key: 'satchel', el: bag},
    {z: chestF ? r.torsoZ + 1.5 : r.torsoZ - 45, key: 'satchelStrap', el: (
      <g>
        <path d={strapD} fill="none" stroke={inkC} strokeWidth={10 * s + ink * 1.4} strokeLinecap="round" />
        <path d={strapD} fill="none" stroke={col(CANVAS)} strokeWidth={10 * s} strokeLinecap="round" />
      </g>
    )},
  ];
};

/**
 * The breaker carried in one hand by its tube, hanging (hand-local: the tube runs across the palm, along +y = the
 * thumb side; the yellow rear and the tank on one side of the fist, the ram head on the other). Same tool as the kit's
 * two-handed breaker(): yellow rear, slate tube, red tank with the gauge, steel ram head.
 */
export const breakerCarry = (o: {gauge?: number; flip?: boolean} = {}): HoldFn => (h, s, ink, col) => {
  const k = s, g = clamp(o.gauge ?? 1);
  const dir = o.flip ? -1 : 1;
  const L0 = -150, L1 = 140; // rear end … ram end along the tube (rig units)
  return (
    <g transform={`translate(${f2(21 * k)} 0) rotate(${dir > 0 ? 90 : -90})`}>
      <rect x={(L0 + 4) * k} y={8 * k} width={62 * k} height={26 * k} rx={13 * k} fill={col('#B8483A')} stroke={C.ink} strokeWidth={ink * 0.9} />
      <circle cx={(L0 + 46) * k} cy={21 * k} r={9 * k} fill={col('#F2EEE4')} stroke={C.ink} strokeWidth={ink * 0.6} />
      <line x1={(L0 + 46) * k} y1={21 * k} x2={(L0 + 46 + Math.cos(Math.PI * (1.15 - g * 1.3)) * 7) * k} y2={(21 - Math.sin(Math.PI * (1.15 - g * 1.3)) * 7) * k} stroke={C.ink} strokeWidth={ink * 0.6} strokeLinecap="round" />
      <rect x={L0 * k} y={-11 * k} width={(L1 - L0) * k} height={22 * k} rx={8 * k} fill={col(METAL_D)} stroke={C.ink} strokeWidth={ink} />
      <rect x={L0 * k} y={-11 * k} width={74 * k} height={22 * k} rx={8 * k} fill={col('#E8C547')} stroke={C.ink} strokeWidth={ink * 0.9} />
      <path d={`M ${L1 * k} ${-15 * k} L ${(L1 + 26) * k} ${-11 * k} L ${(L1 + 34) * k} 0 L ${(L1 + 26) * k} ${11 * k} L ${L1 * k} ${15 * k} Z`} fill={col(METAL)} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
      <path d={`M ${(L0 + 8) * k} ${-11 * k} q ${-10 * k} ${-24 * k} ${-26 * k} ${-14 * k}`} fill="none" stroke={col(RUBBER)} strokeWidth={5 * k} strokeLinecap="round" />
    </g>
  );
};

/** The drone controller in one hand (a small slate pad, its stub antenna). */
export const controllerHold = (o: {lit?: number} = {}): HoldFn => (h, s, ink, col) => {
  const k = s;
  return (
    <g transform={`translate(${f2(18 * k)} ${f2(-4 * k)})`}>
      <rect x={-6 * k} y={-30 * k} width={34 * k} height={60 * k} rx={12 * k} fill={col('#4A555C')} stroke={C.ink} strokeWidth={ink * 0.9} />
      <rect x={1 * k} y={-16 * k} width={20 * k} height={30 * k} rx={3 * k} fill={col('#2A4A55')} />
      {(o.lit ?? 1) > 0 && <circle cx={11 * k} cy={0} r={3 * k} fill="#9FF0FF" />}
      <line x1={22 * k} y1={-28 * k} x2={34 * k} y2={-50 * k} stroke={C.ink} strokeWidth={2.4 * k} strokeLinecap="round" />
    </g>
  );
};
