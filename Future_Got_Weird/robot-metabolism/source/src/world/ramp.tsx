// The inclined locomotion test: a 10-degree ramp (the slope used in the paper's speed tests) with two lanes, fixed
// distance marks every 10 cm and a start line. The robot with its walking stick (near lane) and a plain tetrahedron
// of the same links (far lane, faded) set off together; the stick-assisted robot pulls ahead.
// Coordinates are surface-local: x along the ramp (downhill is -x), y the height above the surface, z across.
import React from 'react';
import {add, mul, ss, ss5, V3, v3} from '../lib/v3';
import {box, Item, line, poly, Proj} from '../lib/r3';
import {COL, GY, Link, linkItems, shadowItems} from '../rig/truss';
import {EDGES, lensAdd, regular, tetra, Tet} from '../rig/body';
import {bodyTravel, crawl, strokes, tipTravel} from '../rig/gait';
import {E, T} from '../lib/time';
import {ENV} from './benchArt';
import {INK} from '../dc/ink';

export const SLOPE = (10 * Math.PI) / 180;
/** surface-local -> world: the ramp rises toward +x */
export const rampXf = (p: V3): V3 => ({x: p.x * Math.cos(SLOPE) - p.y * Math.sin(SLOPE), y: p.x * Math.sin(SLOPE) + p.y * Math.cos(SLOPE) + 0.0, z: p.z});

export const R0 = T('helping') + 0.3; // the cut to the ramp
const R1 = T('and if');
const TILT = (27 * Math.PI) / 180;
const LANE_US = 0.22, LANE_P = -0.36;
const X0 = 0.95; // both start with their front edges on the start line

export const tLinks = (tet: Tet, id: string, band: string, led = 1, dim?: number): Link[] =>
  EDGES.map(([a, b], i) => {
    const flip = i % 2 === 1;
    return {id: `${id}${i}`, a: flip ? tet[b] : tet[a], b: flip ? tet[a] : tet[b], band, led, dim};
  });

export const rampState = (t: number) => {
  // ours: walking-stick strokes, 0.47 s period, 0.1 m per push (the stick 0.33 -> 0.425 m)
  const S = strokes(R0 + 0.12, 5, 0.47, 0.1);
  const bx = X0 - bodyTravel(S, t);
  const wob = Math.sin(t * 9) * 0.006;
  const tet = tetra(lensAdd(regular(), {l03: wob, l23: -wob}), {x: bx, z: LANE_US, yaw: 0, tilt: TILT});
  const tip0 = X0 + 0.2547 + 0.3;
  const tipX = tip0 - tipTravel(S, t);
  const X: Link = {id: 'X', a: tet.V1, b: v3(tipX, GY, LANE_US), band: COL.bandX, led: 1};
  // the plain tetrahedron: crawls by stretching its rear links, about half the speed
  const c = crawl(R0 + 0.05, 5, 0.47, 0.05, t);
  const ext = c.ext;
  const half = 0.165;
  const dx = 0.2858 + ext;
  const lr = Math.sqrt(dx * dx + half * half);
  const pt = tetra(lensAdd(regular(), {l01: lr - 0.33, l12: lr - 0.33, l13: ext * 0.6}), {x: X0 - c.front, z: LANE_P, yaw: 0, tilt: 0});
  const links = [...tLinks(tet, 'T', COL.bandT), X];
  const plain = tLinks(pt, 'P', COL.bandP, 1, 0.12);
  return {tet, X, links, plain, bx, px: X0 - c.front};
};

const marks = (P: Proj): (Item | null)[] => {
  const out: (Item | null)[] = [];
  for (let x = 0; x <= 1.5 + 1e-6; x += 0.1) {
    const bold = Math.abs(x - X0) < 1e-6;
    out.push(line(P, [v3(x, 0.0006, -0.62), v3(x, 0.0006, 0.5)], bold ? '#F2A23C' : '#9FB3BE', bold ? 4.5 : 2, {layer: 1, depthBias: 40}));
  }
  // lane divider
  out.push(line(P, [v3(0, 0.0007, -0.06), v3(1.6, 0.0007, -0.06)], '#9FB3BE', 2.5, {layer: 1, depthBias: 39, dash: '14 10'}));
  return out;
};

export const rampArt = (P: Proj, Pw: Proj): (Item | null)[] => {
  const out: (Item | null)[] = [];
  const WZ = -1.25;
  // wall and panel (world)
  out.push(poly(Pw, [v3(-4, -0.4, WZ), v3(4, -0.4, WZ), v3(4, 2.6, WZ), v3(-4, 2.6, WZ)], ENV.wall, {layer: 0, stroke: null, depthBias: 100}));
  out.push(poly(Pw, [v3(-4, -1.2, WZ + 0.001), v3(4, -1.2, WZ + 0.001), v3(4, 0.12, WZ + 0.001), v3(-4, 0.12, WZ + 0.001)], ENV.panel, {layer: 0, stroke: null, depthBias: 99}));
  out.push(poly(Pw, [v3(-4, 0.12, WZ + 0.002), v3(4, 0.12, WZ + 0.002), v3(4, 0.15, WZ + 0.002), v3(-4, 0.15, WZ + 0.002)], ENV.panelDeep, {layer: 0, stroke: null, depthBias: 98}));
  // a wall rack of spare links behind the test (same lab)
  out.push(...box(Pw, v3(0.2, 0.95, WZ + 0.05), v3(0.9, 0.012, 0.05), {top: ENV.shelf, side: ENV.woodFront, front: ENV.woodFront}, {layer: 0}));
  // the platform the ramp stands on (world)
  out.push(poly(Pw, [v3(-3, 0, -1.25), v3(3, 0, -1.25), v3(3, 0, 1.6), v3(-3, 0, 1.6)], '#A9BCC0', {layer: 1, stroke: null, depthBias: 70}));
  // the ramp: board (local), its edges and the side face (world)
  const L = 1.6;
  out.push(poly(P, [v3(0, 0, -0.66), v3(L, 0, -0.66), v3(L, 0, 0.54), v3(0, 0, 0.54)], '#E1E9EC', {layer: 1, sw: 3, depthBias: 60}));
  const top = rampXf(v3(L, 0, 0.54));
  out.push(poly(Pw, [v3(0, 0, 0.54), v3(top.x, top.y, 0.54), v3(top.x, 0, 0.54)], '#C7D3D9', {layer: 1, sw: 3, depthBias: 58}));
  out.push(poly(Pw, [v3(top.x, 0, 0.54), v3(top.x, top.y, 0.54), v3(top.x, top.y, -0.66), v3(top.x, 0, -0.66)], '#B4C2CA', {layer: 1, sw: 3, depthBias: 57}));
  // the runout mat at the foot (flat, x < 0)
  out.push(poly(P, [v3(-1.4, 0.0002, -0.66), v3(0, 0.0002, -0.66), v3(0, 0.0002, 0.54), v3(-1.4, 0.0002, 0.54)], ENV.mat, {layer: 1, sw: 2.4, depthBias: 61}));
  out.push(...marks(P));
  // low side rails along both edges
  for (const z of [-0.66, 0.54]) out.push(line(P, [v3(0, 0.012, z), v3(L, 0.012, z)], INK, 7, {layer: 1, depthBias: 30}));
  for (const z of [-0.66, 0.54]) out.push(line(P, [v3(0, 0.012, z), v3(L, 0.012, z)], '#8796A3', 4, {layer: 1, depthBias: 29}));
  return out;
};

export const rampItems = (P: Proj, Pw: Proj, t: number): (Item | null)[] => {
  const s = rampState(t);
  return [...rampArt(P, Pw), ...shadowItems(P, [...s.links, ...s.plain]), ...s.plain.flatMap((l) => linkItems(P, l)), ...s.links.flatMap((l) => linkItems(P, l))];
};

void add; void mul; void ss; void ss5; void E; void R1;
export const RampView = null as unknown as React.FC;
