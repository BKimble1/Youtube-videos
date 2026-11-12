// V5 insect group: V3's anatomy and plate stacking, with two depth-order rules that used to SWITCH (a visible pop as
// the camera tilted or swung round) turned into short crossfades, and an optional gripper merged into the pack block:
//  1. legs / head vs the plates: seen from above (down > 0.42) the plates covered the leg bases; below, the near legs
//     passed in front. The order flipped in one frame as a moving camera crossed 25 deg of elevation. Now the
//     "from above" order is drawn and the near parts are laid over it with an opacity that fades across 19-31 deg.
//  2. backpack vs pronotum: in front of the pronotum from behind / above, behind its front edge from the front. Now a
//     second copy of the pack, in front of the pronotum, fades in and out across the boundary.
//  3. a gripper holding the module ON the insect: its fingers and pads are sorted with the module's own parts (the far
//     finger behind the grasping tab, the near finger in front), not as one block in front of or behind the insect.
import React from 'react';
import {Basis, dot3, proj} from '../core/three';
import {Item} from '../core/draw3';
import {Frame} from '../core/frame';
import {ss} from '../lib';
import {roachItems, roachShadow, roachSilhouette} from '../roach/draw';
import {solve, RoachState, Rig} from '../roach/rig';
import {CyborgOpts} from '../roach/compose';

export type Grip = {items: Item[]; tool: Frame};
/** order a gripper's fingers around a module's tab: far-side finger parts behind the tab, near-side in front */
export const gripAroundTab = (B: Basis, main: Item[], grip: Grip): Item[] => {
  const tab = main.find((m) => String((m.el as React.ReactElement).key ?? '').endsWith('tab'));
  const tz = tab ? tab.z : proj(B, grip.tool.o).z;
  return grip.items.map((g, i) => {
    const s = i < grip.items.length / 2 ? 1 : -1;
    const far = dot3(B.fw, grip.tool.l) * s > 0;
    return {z: far ? tz + 0.05 + i * 1e-4 : tz - 0.05 - i * 1e-4, el: g.el};
  });
};

export const cyborgGroup5 = (B: Basis, st: RoachState, pack: any | null, key: string, o: CyborgOpts & {grip?: Grip} = {}): {item: Item; rig: Rig} => {
  const R = solve(st);
  const {items, rearZ} = roachItems(B, R, {...o, key});
  const Zb = rearZ;
  const eps = 0.02;
  items[0] = {...items[0], z: Zb};
  items[1] = {...items[1], z: Zb - eps};
  const down = -B.fw[2];
  const kDown = ss(down, 0.33, 0.52); // 0: near legs in front (low camera) .. 1: plates cover them (from above)
  const low: Item[] = [...items];
  const high: Item[] = items.map((it, i) => (i < 2 ? it : {...it, z: Zb + 1 + it.z * 1e-3}));
  const packItems: Item[] = [];
  const packOver: Item[] = [];
  let kFront = 0;
  if (pack) {
    const {main, elec} = o.parts!(B, pack, `${key}p`);
    const all = o.grip ? [...main, ...gripAroundTab(B, main, o.grip)] : main;
    // 1 = seen from the front (the pronotum's front covers the pack), 0 = from behind / above (pack over the pronotum)
    kFront = ss(-dot3(B.fw, st.body.f), 0.25, 0.45) * (1 - ss(-B.fw[2], 0.7, 0.8));
    const zs = all.map((m) => m.z);
    const zmin = Math.min(...zs), zmax = Math.max(...zs);
    const rel = (m: Item) => (eps * 0.4 * (zmax - m.z)) / (zmax - zmin || 1);
    all.forEach((m) => packItems.push({z: Zb - 0.5 * eps - rel(m) * 0.4, el: m.el}));
    if (kFront < 0.999) all.forEach((m) => packOver.push({z: Zb - 2 * eps - rel(m), el: m.el}));
    elec.forEach((m, i) => packItems.push({z: Zb - 0.6 * eps - i * 1e-5, el: m.el}));
  }
  const sorted = (list: Item[]) => list.filter((it) => it.z > 6).sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>);
  // the "over" layer: the pack copy in front of the pronotum, fading out as the camera comes round to the front
  const overLayer = (base: Item[]) => (packOver.length && kFront < 0.999 ? <g opacity={(1 - kFront).toFixed(3)}>{sorted([...base.filter((it) => it.z < Zb - 1.5 * eps), ...packOver])}</g> : null);
  // the near-part layer: what the low-camera order draws in front of the body, laid over the high order
  const nearLayer = kDown < 0.999 ? <g opacity={(1 - kDown).toFixed(3)}>{sorted([...low.filter((it) => it.z < Zb), ...packItems.filter((it) => it.z < Zb)])}{overLayer(low.filter((it) => it.z < Zb))}</g> : null;
  const C = proj(B, st.body.o);
  const el = (
    <g key={key}>
      {(o.shadow ?? 1) > 0 && roachShadow(B, R, o.shadowZ ?? 0, 0.32 * (o.shadow ?? 1))}
      {o.rim && (() => {
        const sp = proj(B, st.body.o).s;
        return <g opacity={o.rim.k} style={{filter: `blur(${(Math.max(2, 0.5 * sp)).toFixed(1)}px)`}}>{roachSilhouette(B, R).map((d, i) => <path key={i} d={d} fill="none" stroke={o.rim!.c} strokeWidth={(Math.max(3, 1.6 * sp)).toFixed(1)} />)}</g>;
      })()}
      {kDown > 0.001 ? sorted([...high, ...packItems]) : sorted([...low, ...packItems])}
      {kDown > 0.001 ? overLayer(high.filter((it, i) => i < 2)) : overLayer(low.filter((it) => it.z < Zb))}
      {kDown > 0.001 ? nearLayer : null}
    </g>
  );
  return {item: {z: C.z, el}, rig: R};
};
