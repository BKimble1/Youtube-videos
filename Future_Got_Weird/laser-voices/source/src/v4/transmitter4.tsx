// V4 transmitter: a research-grade infrared laser head (not a consumer gadget): a ventilated housing on a tilt yoke,
// a front exit window, a status LED and a cable; on a tripod (atrium demonstration) or an optical post (lab).
// Its cutaway (`open`) shows the inside from above: the laser module fires sideways into a spinning hexagonal mirror
// (a polygon scanner on its motor), whose facets throw the beam forward through the window and sweep it across a
// narrow arc. Local frame: x forward (the aim), y to the side, z up; metres.
import React from 'react';
import {B, proj, V3, v3, pathOf} from './rig/geo4';
import {INK} from './rig/cast4';
import {Item, Frame, frameAt, obox, depthOf, polyNode, lineNode, aimFrame} from './draw3';

export const TX = {
  dark: '#2B3138', darkLight: '#3C444D', darker: '#1E2328', teal: '#1CA7A0', metal: '#8FA3AD', metalDeep: '#5E727C', metalLight: '#C9D6DC',
  cream: '#FAF3DF', saffron: '#FFC744', glass: '#2A1418', glassRim: '#5E727C', ir: '#F2A93B', irGlow: '#C9771C',
};
export const HOUSING = {x0: -0.22, x1: 0.14, y0: -0.1, y1: 0.1, z0: -0.07, z1: 0.09};
export const WINDOW_C = {x: 0.14, y: 0, z: 0.005}, WINDOW_R = 0.045;
export const POLY = {x: 0.03, y: -0.01, z: 0.0, r: 0.045, h: 0.04};
export const DIODE = {x: 0.03, y: 0.085, z: 0.0};
/** polygon scanner: facet normal angle (rad, about the up axis) of the facet that faces the incoming beam */
export const facetAngle = (spin: number) => {
  // the incoming beam travels toward -y; a facet reflects it forward when its normal bisects +x and +y (45 deg)
  const th = spin % (Math.PI / 3);
  return Math.PI / 4 + (th - Math.PI / 6) * 0.22; // simplified: a narrow sweep
};
/** the output direction in the local frame for a given spin (reflection of -y about the facet normal) */
export const outDir = (spin: number) => {
  const a = facetAngle(spin);
  const n = {x: Math.cos(a), y: Math.sin(a)};
  const d = {x: 0, y: -1};
  const k = 2 * (d.x * n.x + d.y * n.y);
  return {x: d.x - k * n.x, y: d.y - k * n.y}; // unit
};
const circleIn = (fr: Frame, cx: number, cy: number, cz: number, r: number, axis: 'x' | 'z', n = 24): V3[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * 2 * Math.PI;
    return axis === 'x' ? frameAt(fr, cx, cy + r * Math.cos(a), cz + r * Math.sin(a)) : frameAt(fr, cx + r * Math.cos(a), cy + r * Math.sin(a), cz);
  });

export type TxOpts = {open?: number; spin?: number; led?: number; beamIn?: number; mount?: 'tripod' | 'post'; mountTop?: number; key: string};
/** The transmitter, mounted with its pivot at `pivot` (world), aimed by yaw/pitch (deg). Returns paint items. */
export const transmitter = (b: B, pivot: V3, yaw: number, pitch: number, o: TxOpts): Item[] => {
  const fr = aimFrame(v3(pivot.x, pivot.y + 0.1, pivot.z), yaw, pitch);
  const items: Item[] = [];
  const open = o.open ?? 0, H = HOUSING;
  const P = (x: number, y: number, z: number) => frameAt(fr, x, y, z);
  // ---- mount
  const flat = aimFrame(pivot, yaw, 0);
  if (o.mount === 'post') {
    const top = o.mountTop ?? 0.9;
    items.push(obox(b, {...flat, c: v3(pivot.x, (top + pivot.y) / 2, pivot.z)}, -0.018, 0.018, -0.018, 0.018, -(pivot.y - top) / 2, (pivot.y - top) / 2, {top: TX.metal, side: TX.metalDeep, front: TX.metal}, `${o.key}-post`));
    items.push(obox(b, {...flat, c: v3(pivot.x, top + 0.008, pivot.z)}, -0.07, 0.07, -0.06, 0.06, -0.008, 0.008, {top: TX.metal, side: TX.metalDeep, front: TX.metalDeep}, `${o.key}-base`));
  } else {
    // tripod: three legs from the head down to the floor, a centre column and a spreader
    const head = v3(pivot.x, pivot.y - 0.02, pivot.z);
    [0, 120, 240].forEach((a, i) => {
      const r = ((yaw + 30 + a) * Math.PI) / 180;
      const foot = v3(pivot.x + Math.sin(r) * 0.45, 0, pivot.z + Math.cos(r) * 0.45);
      items.push({d: depthOf(b, v3((head.x + foot.x) / 2, pivot.y / 2, (head.z + foot.z) / 2)), node: <g key={`${o.key}-leg${i}`}>{lineNode(b, head, foot, {stroke: INK, sw: 9})}{lineNode(b, head, foot, {stroke: TX.darkLight, sw: 5})}</g>});
    });
    items.push({d: depthOf(b, v3(pivot.x, pivot.y * 0.6, pivot.z)), node: <g key={`${o.key}-col`}>{lineNode(b, head, v3(pivot.x, pivot.y * 0.45, pivot.z), {stroke: INK, sw: 10})}{lineNode(b, head, v3(pivot.x, pivot.y * 0.45, pivot.z), {stroke: TX.metal, sw: 6})}</g>});
  }
  // yoke
  items.push(obox(b, {...flat, c: v3(pivot.x, pivot.y + 0.02, pivot.z)}, -0.03, 0.03, -0.12, 0.12, -0.02, 0.02, {top: TX.metalDeep, side: TX.darker, front: TX.metalDeep}, `${o.key}-yoke`));
  // ---- housing (top and the near side removed when open)
  const skip = open > 0.01 ? ['top'] : [];
  items.push(obox(b, fr, H.x0, H.x1, H.y0, H.y1, H.z0, H.z1, {top: TX.darkLight, side: TX.dark, front: TX.darker, back: TX.dark}, `${o.key}-housing`, skip));
  const hd = depthOf(b, fr.c);
  const parts: React.ReactNode[] = [];
  // teal accent stripe on both sides, a cream label, fins on top
  [H.y0, H.y1].forEach((y, i) => parts.push(polyNode(b, [P(H.x0 + 0.02, y, -0.01), P(H.x1 - 0.02, y, -0.01), P(H.x1 - 0.02, y, 0.01), P(H.x0 + 0.02, y, 0.01)], {fill: TX.teal, stroke: INK, sw: 1.2}, `st${i}`)));
  parts.push(polyNode(b, [P(-0.17, H.y1, 0.03), P(-0.07, H.y1, 0.03), P(-0.07, H.y1, 0.065), P(-0.17, H.y1, 0.065)], {fill: TX.cream, stroke: INK, sw: 1.2}, 'lab'));
  if (open < 0.01) for (let k = 0; k < 6; k++) parts.push(polyNode(b, [P(H.x0 + 0.03 + k * 0.045, H.y0 + 0.02, H.z1 + 0.001), P(H.x0 + 0.05 + k * 0.045, H.y0 + 0.02, H.z1 + 0.001), P(H.x0 + 0.05 + k * 0.045, H.y1 - 0.02, H.z1 + 0.001), P(H.x0 + 0.03 + k * 0.045, H.y1 - 0.02, H.z1 + 0.001)], {fill: TX.darker}, `fin${k}`));
  // exit window: a dark lens in a metal ring (front face)
  parts.push(polyNode(b, circleIn(fr, H.x1 + 0.004, 0, WINDOW_C.z, WINDOW_R + 0.014, 'x'), {fill: TX.glassRim, stroke: INK, sw: 1.6}, 'rim'));
  parts.push(polyNode(b, circleIn(fr, H.x1 + 0.006, 0, WINDOW_C.z, WINDOW_R, 'x'), {fill: TX.glass, stroke: INK, sw: 1.2}, 'lens'));
  parts.push(polyNode(b, circleIn(fr, H.x1 + 0.007, 0.012, WINDOW_C.z + 0.014, WINDOW_R * 0.3, 'x', 12), {fill: '#FFFFFF', op: 0.35}, 'glint'));
  // status LED
  const led = proj(b, P(-0.02, H.y1 + 0.001, 0.05));
  if (led.z > 0.05) parts.push(<g key="led"><circle cx={led.x} cy={led.y} r={Math.max(2, 4000 / led.z / 600)} fill={(o.led ?? 0) > 0.5 ? TX.saffron : '#5A4A20'} stroke={INK} strokeWidth={1} />{(o.led ?? 0) > 0.5 && <circle cx={led.x} cy={led.y} r={Math.max(4, 9000 / led.z / 600)} fill={TX.saffron} opacity={0.3 * (o.led ?? 0)} />}</g>);
  // cable from the back
  parts.push(lineNode(b, P(H.x0, -0.04, -0.03), v3(pivot.x - Math.sin((yaw * Math.PI) / 180) * 0.4, 0.02, pivot.z - Math.cos((yaw * Math.PI) / 180) * 0.4), {stroke: INK, sw: 4}, 'cable'));
  items.push({d: hd - 0.001, node: <g key={`${o.key}-parts`}>{parts}</g>});
  if (open > 0.01) items.push({d: hd - 0.002, node: <g key={`${o.key}-inside`} opacity={Math.min(1, open * 1.5)}>{interior(b, fr, o.spin ?? 0, o.beamIn ?? 1)}</g>});
  return items;
};

/** The inside, seen through the open top: floor, the laser module, the polygon scanner on its motor, the beam. */
const interior = (b: B, fr: Frame, spin: number, beam: number): React.ReactNode => {
  const H = HOUSING;
  const P = (x: number, y: number, z: number) => frameAt(fr, x, y, z);
  const out: React.ReactNode[] = [];
  out.push(polyNode(b, [P(H.x0 + 0.01, H.y0 + 0.01, H.z0 + 0.01), P(H.x1 - 0.01, H.y0 + 0.01, H.z0 + 0.01), P(H.x1 - 0.01, H.y1 - 0.01, H.z0 + 0.01), P(H.x0 + 0.01, H.y1 - 0.01, H.z0 + 0.01)], {fill: '#3B5560'}, 'floor'));
  // driver board at the back
  out.push(obox(b, fr, H.x0 + 0.02, H.x0 + 0.13, H.y0 + 0.02, H.y1 - 0.02, H.z0 + 0.01, H.z0 + 0.025, {top: '#2F6F5A', side: '#24584A', front: '#24584A', sw: 1.2}, 'board').node);
  [0, 1, 2].forEach((k) => out.push(obox(b, fr, H.x0 + 0.035 + k * 0.03, H.x0 + 0.055 + k * 0.03, -0.05, -0.02, H.z0 + 0.025, H.z0 + 0.04, {top: '#1A2228', side: '#12181C', front: '#12181C', sw: 1}, `chip${k}`).node));
  // laser module (fires toward -y into the scanner)
  out.push(obox(b, fr, DIODE.x - 0.02, DIODE.x + 0.02, DIODE.y - 0.005, DIODE.y + 0.06, -0.02, 0.02, {top: '#5E7883', side: '#3E525B', front: '#4F6670', sw: 1.4}, 'diode').node);
  out.push(obox(b, fr, DIODE.x - 0.008, DIODE.x + 0.008, DIODE.y - 0.013, DIODE.y - 0.004, -0.008, 0.008, {top: TX.irGlow, side: '#8A4A18', front: TX.irGlow, sw: 1}, 'ap').node);
  // motor under the scanner
  out.push(polyNode(b, Array.from({length: 20}, (_, i) => P(POLY.x + 0.03 * Math.cos((i / 20) * 2 * Math.PI), POLY.y + 0.03 * Math.sin((i / 20) * 2 * Math.PI), H.z0 + 0.03)), {fill: TX.metalDeep, stroke: INK, sw: 1.2}, 'motor'));
  // the hexagonal mirror: top face + the facets turned toward the camera (bright, mirrored)
  const hex = (z: number) => Array.from({length: 6}, (_, i) => {
    const a = spin + (i / 6) * 2 * Math.PI + Math.PI / 6;
    return P(POLY.x + POLY.r * Math.cos(a), POLY.y + POLY.r * Math.sin(a), z);
  });
  const lo = hex(-POLY.h / 2), hi = hex(POLY.h / 2);
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const quad = [lo[i], lo[j], hi[j], hi[i]];
    const mid = v3((lo[i].x + lo[j].x) / 2, (lo[i].y + lo[j].y) / 2, (lo[i].z + lo[j].z) / 2);
    const nrm = v3(mid.x - fr.c.x - (P(POLY.x, POLY.y, 0).x - fr.c.x), 0, 0);
    void nrm;
    const ctr = P(POLY.x, POLY.y, 0);
    const n = v3(mid.x - ctr.x, mid.y - ctr.y, mid.z - ctr.z);
    const toCam = v3(b.c.pos.x - mid.x, b.c.pos.y - mid.y, b.c.pos.z - mid.z);
    if (n.x * toCam.x + n.y * toCam.y + n.z * toCam.z > 0) out.push(polyNode(b, quad, {fill: i % 2 ? '#DDEBF0' : '#B8CED8', stroke: INK, sw: 1.6}, `f${i}`));
  }
  out.push(polyNode(b, hi, {fill: '#9FB7C2', stroke: INK, sw: 1.6}, 'hextop'));
  const cp = proj(b, P(POLY.x, POLY.y, POLY.h / 2 + 0.002));
  if (cp.z > 0.05) out.push(<circle key="axle" cx={cp.x} cy={cp.y} r={Math.max(2.5, 5200 / cp.z / 600)} fill={TX.saffron} stroke={INK} strokeWidth={1.2} />);
  // beam inside: module -> facet -> out through the window (illustrative amber)
  if (beam > 0.01) {
    const a = facetAngle(spin), nx = Math.cos(a), ny = Math.sin(a);
    const hit = {x: POLY.x + nx * POLY.r * 0.87, y: POLY.y + ny * POLY.r * 0.87};
    const od = outDir(spin);
    const L = (H.x1 - hit.x) / Math.max(0.2, od.x);
    const ex = {x: hit.x + od.x * L, y: hit.y + od.y * L};
    const segs: [V3, V3][] = [[P(DIODE.x, DIODE.y - 0.013, 0), P(hit.x, hit.y, 0)], [P(hit.x, hit.y, 0), P(ex.x, ex.y, 0)]];
    segs.forEach(([p, q], k) => {
      out.push(<g key={`bm${k}`} opacity={beam}>{lineNode(b, p, q, {stroke: TX.irGlow, sw: 7, op: 0.45})}{lineNode(b, p, q, {stroke: TX.ir, sw: 3})}</g>);
    });
  }
  return <g>{out}</g>;
};
/** World position of the exit window centre and the current output direction (world unit vector). */
export const exitRay = (pivot: V3, yaw: number, pitch: number, spin = 0, swept = false) => {
  const fr = aimFrame(v3(pivot.x, pivot.y + 0.1, pivot.z), yaw, pitch);
  const o = frameAt(fr, HOUSING.x1 + 0.01, 0, WINDOW_C.z);
  const d = swept ? outDir(spin) : {x: 1, y: 0};
  const tip = frameAt(fr, HOUSING.x1 + 0.01 + d.x, d.y, WINDOW_C.z);
  const dir = v3(tip.x - o.x, tip.y - o.y, tip.z - o.z);
  return {o, dir};
};
export {pathOf};
