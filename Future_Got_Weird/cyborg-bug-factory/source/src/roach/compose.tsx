// One insect (and its backpack, seated or arriving) as a single depth-ordered group. Inside the group the plates keep
// their anatomical stacking (abdomen and thorax plates, then the pronotum over them), the electrodes always pass under
// the pronotum's rear edge, and the backpack board sits above the thorax: in front of the pronotum when the camera is
// behind or above the insect, behind the pronotum's front when the camera looks at the insect's face. Legs, head and
// antennae keep their own depths, so the near legs pass in front of the body and the far legs behind it.
import React from 'react';
import {Basis, dot3, proj} from '../core/three';
import {Item} from '../core/draw3';
import {packParts, PackState} from '../kit/backpack';
import {roachItems, roachShadow, roachSilhouette, RoachDraw} from './draw';
import {solve, RoachState, Rig} from './rig';

export type CyborgOpts = RoachDraw & {packCamera?: boolean; shadowZ?: number; shadow?: number;
  /** V2: draw the pack with another part builder (same {main, elec} contract) */
  parts?: (B: Basis, pack: any, key: string) => {main: Item[]; elec: Item[]};
  /** V2: a soft rim light behind the body (colour, strength) */
  rim?: {c: string; k: number}};

export const cyborgGroup = (B: Basis, st: RoachState, pack: PackState | any | null, key: string, o: CyborgOpts = {}): {item: Item; rig: Rig} => {
  const R = solve(st);
  const {items, rearZ} = roachItems(B, R, {...o, key});
  const Zb = rearZ;
  const eps = 0.02;
  // the rear group and the pronotum come out of roachItems as the first two items
  items[0] = {...items[0], z: Zb};
  items[1] = {...items[1], z: Zb - eps};
  // seen from above, the body plates cover the leg bases, the head and the antenna sockets (everything that is not a
  // plate is drawn first; what sticks out beyond the body outline stays visible)
  const down = -B.fw[2];
  if (down > 0.42) for (let i = 2; i < items.length; i++) items[i] = {...items[i], z: Zb + 1 + items[i].z * 1e-3};
  const out: Item[] = [...items];
  if (pack) {
    const {main, elec} = o.parts ? o.parts(B, pack, `${key}p`) : packParts(B, pack, `${key}p`, {camera: o.packCamera});
    const fromFront = dot3(B.fw, st.body.f) < -0.35 && dot3(B.fw, [0, 0, -1]) < 0.75;
    const packZ = fromFront ? Zb - 0.5 * eps : Zb - 2 * eps;
    // keep the pack's own internal depth order, but place it as a block
    const zs = main.map((m) => m.z);
    const zmin = Math.min(...zs), zmax = Math.max(...zs);
    main.forEach((m) => out.push({z: packZ - (eps * 0.4 * (zmax - m.z)) / (zmax - zmin || 1), el: m.el}));
    elec.forEach((m, i) => out.push({z: Zb - 0.6 * eps - i * 1e-5, el: m.el}));
  }
  const C = proj(B, st.body.o);
  const el = (
    <g key={key}>
      {(o.shadow ?? 1) > 0 && roachShadow(B, R, o.shadowZ ?? 0, 0.32 * (o.shadow ?? 1))}
      {o.rim && (() => {
        const sp = proj(B, st.body.o).s;
        return <g opacity={o.rim.k} style={{filter: `blur(${(Math.max(2, 0.5 * sp)).toFixed(1)}px)`}}>{roachSilhouette(B, R).map((d, i) => <path key={i} d={d} fill="none" stroke={o.rim!.c} strokeWidth={(Math.max(3, 1.6 * sp)).toFixed(1)} />)}</g>;
      })()}
      {out.filter((it) => it.z > 6).sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>)}
    </g>
  );
  return {item: {z: C.z, el}, rig: R};
};
