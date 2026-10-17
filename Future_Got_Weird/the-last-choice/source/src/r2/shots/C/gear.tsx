// Section C gear the rig kit does not draw yet, in the rig's own space (so it never floats off a grip), in the kit's
// palette (rig/props.tsx):
//   flareBag()        host's canvas satchel of flares and smoke canisters on the left hip, its strap across the chest
//   breakerCarry()    honest's breaker carried in one hand by the tube (the tank and the ram head either side of the fist)
//   controllerHold()  checker's controller in one hand (before her drone is up)
import React from 'react';
import {C} from '../../../theme';
import {V3, f2, clamp} from '../../../kit/math';
import type {HoldFn, Rig2, Part} from '../../rig';
import {at} from '../../rig';

const METAL = '#8E989F', METAL_D = '#5B646B', RUBBER = '#26292C';
const CANVAS = '#7A6A4C', CANVAS_D = '#5E5139', FLARE = '#C0392B';

const P = (q: {x: number; y: number}) => `${f2(q.x)} ${f2(q.y)}`;

/** The satchel on the left hip (strap over the right shoulder): flap, buckle, two flares and a canister poking out. */
export const flareBag = (o: {open?: number} = {}) => (r: Rig2): Part[] => {
  const s = r.s, ink = r.ink;
  const c = at(r.P, r.base, -84 * s, -14 * s, -8 * s); // bag centre (left hip, a little back)
  const fwd = r.base.F, rt = r.base.R;
  // the bag's outline: a box seen from this side (width along the body's forward axis, depth across)
  const w = 92 * s, h = 74 * s, d = 30 * s;
  const ax = {x: fwd.x * w, y: fwd.y * w}, ay = {x: 0, y: h}, az = {x: -rt.x * d, y: -rt.y * d};
  const corner = (i: number, j: number, k: number) => ({x: c.x + ax.x * i + ay.x * j + az.x * k, y: c.y + ax.y * i + ay.y * j + az.y * k});
  const front = [corner(-0.5, -0.5, 0.5), corner(0.5, -0.5, 0.5), corner(0.5, 0.5, 0.5), corner(-0.5, 0.5, 0.5)];
  const side = rt.z < 0 ? 1 : -1; // which end of the bag shows
  const end = [corner(side * 0.5, -0.5, 0.5), corner(side * 0.5, -0.5, -0.5), corner(side * 0.5, 0.5, -0.5), corner(side * 0.5, 0.5, 0.5)];
  const flap = [corner(-0.52, -0.52, 0.55), corner(0.52, -0.52, 0.55), corner(0.5, -0.05, 0.56), corner(-0.5, -0.05, 0.56)];
  const zBag = -rt.z > 0.05 ? r.torsoZ + 32 : r.torsoZ - 32; // the bag is on his left: in front when his left faces us
  // flares and a canister standing out of the top behind the flap
  const top = (u: number) => corner(u, -0.5, 0);
  const sticks = [-0.3, -0.12, 0.18].map((u, i) => {
    const b = top(u), t = {x: b.x, y: b.y - (i === 2 ? 22 : 34) * s};
    return i === 2
      ? <rect key={i} x={b.x - 11 * s} y={t.y} width={22 * s} height={26 * s} rx={4 * s} fill="#7D8A90" stroke={C.ink} strokeWidth={ink * 0.6} />
      : <g key={i}><path d={`M ${P(b)} L ${P(t)}`} stroke={C.ink} strokeWidth={12 * s + ink} strokeLinecap="round" /><path d={`M ${P(b)} L ${P(t)}`} stroke={FLARE} strokeWidth={12 * s} strokeLinecap="round" /></g>;
  });
  const bag = (
    <g strokeLinejoin="round">
      {sticks}
      <path d={'M ' + end.map(P).join(' L ') + ' Z'} fill={CANVAS_D} stroke={C.ink} strokeWidth={ink * 0.8} />
      <path d={'M ' + front.map(P).join(' L ') + ' Z'} fill={CANVAS} stroke={C.ink} strokeWidth={ink * 0.9} />
      <path d={'M ' + flap.map(P).join(' L ') + ' Z'} fill={CANVAS_D} stroke={C.ink} strokeWidth={ink * 0.8} opacity={1 - clamp(o.open ?? 0) * 0.6} />
      <rect x={corner(0, -0.12, 0.56).x - 5 * s} y={corner(0, -0.12, 0.56).y - 4 * s} width={10 * s} height={8 * s} rx={2 * s} fill={METAL} stroke={C.ink} strokeWidth={ink * 0.5} />
    </g>
  );
  // the strap: from the right shoulder over the chest (or the back) to the bag's ends
  const shR = r.sh[1];
  const chestF = r.up.F.z > 0; // his chest faces us
  const mid = at(r.P, r.up, 10 * s, 70 * s, chestF ? 38 * s : -38 * s);
  const a = corner(-0.45, -0.5, 0.2), b = corner(0.45, -0.5, 0.2);
  const strapD = `M ${P(shR)} Q ${P(mid)} ${P(chestF ? a : b)}`;
  const strap = <path d={strapD} fill="none" stroke={CANVAS} strokeWidth={10 * s} strokeLinecap="round" />;
  const strapInk = <path d={strapD} fill="none" stroke={C.ink} strokeWidth={10 * s + ink * 1.4} strokeLinecap="round" />;
  return [
    {z: zBag, key: 'cBag', el: bag},
    {z: chestF ? r.torsoZ + 1.5 : r.torsoZ - 45, key: 'cBagStrap', el: <g>{strapInk}{strap}</g>},
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
      {/* tank under the rear */}
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
void METAL; void ([] as V3[]);
