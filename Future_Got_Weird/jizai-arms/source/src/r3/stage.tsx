// One frame of the world: room, props, wearers with their harness and plugged arms, a carried (detached) arm, the
// half-scale controller on its stand, and the operator. Everything goes into one depth-sorted list.
import React from 'react';
import {Inked, InkPath} from '../dc/ink';
import {Limb} from '../dc/limb';
import {fmt} from '../dc/math';
import {a3, Cam, Draw, Item, k3, M3, proj, Proj, v3, V3} from './m3';
import {bodyFrame, bodyGeo, Look, personItems, Pose3, torsoShape} from './body';
import {harnessItems, terminal, TermId} from './harness';
import {ArmGeo, armFK, armItems, ArmPose} from './robot';
import {boxItem, cupItem, ENV, Room} from './env';

export type ArmSlot = {tid: TermId; pose: ArmPose; plugOut?: number; collar?: number; led?: number; band?: string; side?: 1 | -1};
export type Wearer = {id: string; look: Look; pose: Pose3; arms: ArmSlot[]; ghost?: number; legs?: boolean; termLed?: Partial<Record<TermId, number>>};
export type FreeArm = {id: string; base: V3; B: M3; pose: ArmPose; side: 1 | -1; band?: string; collar?: number};
export type Mini = {base: V3; B: M3; pose: ArmPose; side: 1 | -1; stand: V3};
export type Person = {id: string; look: Look; pose: Pose3; legs?: boolean};
export type StageState = {
  cam: Cam;
  wearers: Wearer[];
  people?: Person[];
  free?: FreeArm[];
  mini?: Mini;
  cart?: V3 | null;
  table?: V3 | null;
  cup?: {pos: V3; zBias?: number} | null;
  /** fully custom extra items */
  extra?: (Pj: Proj) => Item[];
};

export const sideOf = (tid: TermId): 1 | -1 => (tid.endsWith('L') ? 1 : -1);

/** Geometry of a plugged arm (for hand targets, camera targets and the controller mirror). */
export const plugged = (w: Wearer, slot: ArmSlot): ArmGeo => {
  const F = bodyFrame(w.pose);
  const t = terminal(F, slot.tid);
  return armFK(t.face, t.B, slot.pose, slot.side ?? sideOf(slot.tid), 1, slot.plugOut ?? 0);
};

/** Translucent body (the x-ray isolation used while the camera goes round the back to the six terminals). */
const ghostItems = (Pj: Proj, w: Wearer, alpha: number): Item[] => {
  const g = bodyGeo(w.pose);
  const F = g.F;
  const tor = torsoShape(Pj, F);
  const pts = tor.path;
  const d = `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z`;
  const hc = Pj.p(g.head);
  const k = Pj.k(hc.z);
  const zc = Pj.p(F.toW(v3(0, 118, 0))).z;
  const col = '#BFE6F2';
  const arm = (S: V3, E: V3, W: V3, key: string) => {
    const A = Pj.p(S), B = Pj.p(E), C = Pj.p(W);
    const kk = Pj.k(B.z);
    return <Limb key={key} id={`${w.id}-gh${key}`} A={A} B={B} C={C} rA={4.9 * kk} rB={4.0 * kk} rC={3.2 * kk} color={col} />;
  };
  return [
    {
      z: zc - 6,
      key: `${w.id}-ghost`,
      el: (
        <g opacity={alpha * 0.42}>
          <Inked w={0.35 * k}>
            <InkPath d={d} fill={col} />
            <ellipse cx={fmt(hc.x)} cy={fmt(hc.y)} rx={fmt(15 * k)} ry={fmt(16.5 * k)} fill={col} />
            {arm(g.lS, g.lE, g.lW, 'L')}
            {arm(g.rS, g.rE, g.rW, 'R')}
          </Inked>
        </g>
      ),
    },
  ];
};

export const stageItems = (Pj: Proj, st: StageState): Item[] => {
  const items: Item[] = [];
  if (st.cart) items.push(boxItem(Pj, 'cart', st.cart, v3(13, st.cart.y, 13), {top: '#DCE3E8', side: '#8EA3B0', front: '#A9BAC5'}));
  if (st.table) {
    const T = st.table;
    const top = T.y * 2;
    items.push(boxItem(Pj, 'tabletop', v3(T.x, top - 2, T.z), v3(19, 2, 23), {top: ENV.table, side: '#A89A82', front: '#B9AC94'}, 0.5, 2));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b], i) => items.push(boxItem(Pj, `tleg${i}`, v3(T.x + a * 16.5, (top - 4) / 2, T.z + b * 20.5), v3(1.4, (top - 4) / 2, 1.4), {top: '#5B6672', side: '#3E4852', front: '#4A5560'}, 0.45)));
  }
  if (st.cup) items.push(cupItem(Pj, 'cup', st.cup.pos, st.cup.zBias ?? 0));
  st.wearers.forEach((w) => {
    const F = bodyFrame(w.pose);
    const occ: Partial<Record<TermId, boolean>> = {};
    w.arms.forEach((a) => {
      if ((a.plugOut ?? 0) < 0.6) occ[a.tid] = true;
    });
    const gh = w.ghost ?? 0;
    if (gh < 1) {
      const pi = personItems(Pj, w.pose, {id: w.id, look: w.look, harness: true, legs: w.legs});
      if (gh > 0) pi.forEach((it) => items.push({...it, el: <g opacity={1 - gh}>{it.el}</g>}));
      else items.push(...pi);
    }
    if (gh > 0) items.push(...ghostItems(Pj, w, gh));
    items.push(...harnessItems(Pj, F, `${w.id}-hn`, occ, w.termLed ?? {}));
    w.arms.forEach((a) => {
      const g = plugged(w, a);
      items.push(...armItems(Pj, g, {id: `${w.id}-${a.tid}`, collar: a.collar, led: a.led ?? 1, band: a.band}));
    });
  });
  (st.free ?? []).forEach((fa) => {
    const g = armFK(fa.base, fa.B, fa.pose, fa.side, 1, 0);
    items.push(...armItems(Pj, g, {id: fa.id, collar: fa.collar ?? 60, led: 0, band: fa.band}));
  });
  if (st.mini) {
    const m = st.mini;
    // stand: a small dark plinth and a white post up to the model's base terminal
    items.push(boxItem(Pj, 'mstand', m.stand, v3(7, 2.2, 7), {top: '#3A414A', side: '#22272E', front: '#2A3038'}, 0.45, 3));
    const g = armFK(m.base, m.B, m.pose, m.side, 0.5, 0);
    const postA = Pj.p(a3(m.stand, v3(0, 2, 0)));
    const postB = Pj.p(m.base);
    const kk = Pj.k(postB.z);
    items.push({
      z: (postA.z + postB.z) / 2 + 1,
      key: 'mpost',
      el: (
        <Inked w={0.4 * kk}>
          <InkPath d={`M${fmt(postA.x - 1.3 * kk)},${fmt(postA.y)} L${fmt(postB.x - 1.1 * kk)},${fmt(postB.y)} L${fmt(postB.x + 1.1 * kk)},${fmt(postB.y)} L${fmt(postA.x + 1.3 * kk)},${fmt(postA.y)} Z`} fill="#E9EDF0" />
        </Inked>
      ),
    });
    items.push(...armItems(Pj, g, {id: 'mini', collar: 0, led: 1, ink: 0.5}));
  }
  (st.people ?? []).forEach((p) => items.push(...personItems(Pj, p.pose, {id: p.id, look: p.look, legs: p.legs})));
  if (st.extra) items.push(...st.extra(Pj));
  return items;
};

export const Stage: React.FC<{st: StageState}> = ({st}) => {
  const Pj = proj(st.cam);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <rect x={0} y={0} width={1080} height={1920} fill={ENV.wall} />
      <Room Pj={Pj} />
      <Draw items={stageItems(Pj, st)} />
    </svg>
  );
};

export {k3, plugged as pluggedGeo};
