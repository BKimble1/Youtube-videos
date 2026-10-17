// Engine smoke test: a mound, a crater, buildings, rubble, a slab and a figure (the R1 rig as a sprite), seen from an
// orbiting camera. Not part of the film.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Scene, Item, makeView, orbit, prep, terrain, box, chunk, slab, cylinder, extrude, LightRig, Material, figureView} from '../engine';
import {Actor} from '../../rig/actor';
import {CAST} from '../../rig/looks';
import {rnd} from '../../kit/math';

const MATS: Record<string, Material> = {
  ground: {base: '#6E625A'},
  rubble: {base: '#8C8279'},
  asphalt: {base: '#45413F'},
  concrete: {base: '#A39A8F'},
  brick: {base: '#8A4A3A'},
  dark: {base: '#3A3533'},
  steel: {base: '#5B646B'},
  glow: {base: '#FFB45A', emissive: true},
};
const LIGHT: LightRig = {
  sun: {x: -0.75, y: 0.32, z: 0.15}, sunColor: '#FFC08A', ambient: '#4A5878',
  lights: [{pos: {x: 14, y: 2, z: 6}, color: '#FF8A3A', power: 1.1, radius: 18, seed: 3}],
  fogColor: '#9C7E73', fogStart: 25, fogEnd: 420, skyTop: '#3B3446', skyHorizon: '#C88466', ink: '#162A32',
  groundHaze: {height: 3, amount: 0.25},
};
const H = (x: number, z: number) => {
  const ridge = 5 * Math.exp(-((x + 2) ** 2) / 30 - (z ** 2) / 260) + 0.4 * Math.sin(x * 1.3 + z * 0.7) * Math.exp(-((x + 2) ** 2) / 30);
  const cr = Math.hypot(x - 45, z);
  const crater = cr < 16 ? -3.5 * (1 - (cr / 16) ** 2) : cr < 20 ? 0.6 * (1 - Math.abs(cr - 18) / 2) : 0;
  return ridge + crater;
};
const TERRAIN = prep(terrain(-30, 120, -40, 40, 2, H, (x, z, sl) => (sl > 25 ? 'rubble' : Math.abs(z) < 14 && x > 6 ? 'asphalt' : 'ground')));
const BLDG = [
  prep(box({x: 20, y: 0, z: -45}, {x: 38, y: 26, z: -30}, ['dark', 'dark', 'brick', 'brick', 'brick', 'brick'])),
  prep(box({x: 44, y: 0, z: -48}, {x: 60, y: 40, z: -30}, ['dark', 'dark', 'concrete', 'concrete', 'concrete', 'concrete'])),
  prep(box({x: 26, y: 0, z: 30}, {x: 52, y: 18, z: 44}, ['dark', 'dark', 'brick', 'brick', 'brick', 'brick'])),
  prep(extrude([{x: 70, z: -50}, {x: 90, z: -46}, {x: 86, z: -30}, {x: 72, z: -32}], 0, 55, 'dark', 'concrete')),
];
const RUBBLE = Array.from({length: 26}, (_, i) => ({m: prep(chunk(0.6 + rnd(i) * 1.6, 0.4 + rnd(i + 9) * 1.2, 0.6 + rnd(i + 3) * 1.4, i, 'rubble')), x: -6 + rnd(i * 7) * 14, z: -10 + rnd(i * 11) * 20, yaw: rnd(i * 5) * 360}));
const SLAB = prep(slab({x: 8, y: 0, z: 4}, {x: 0.3, y: 0.95, z: 0}, {x: 0, y: 0, z: 1}, [{u: 0, v: 0}, {u: 4, v: -0.5}, {u: 4.6, v: 3}, {u: 0.5, v: 3.6}], 0.35, 'concrete', 'rubble'));
const TANK = prep(cylinder(1.2, 3, 10, 'steel', 'steel'));

export const EngineLab: React.FC<{page?: number}> = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const cam = orbit({x: 2, y: 4, z: 0}, 22, 150 + f * 3, 12, 40);
  const v = makeView(cam);
  const fig = {x: -2, y: H(-2, 0), z: 0};
  const items: Item[] = [
    {kind: 'mesh', mesh: TERRAIN, key: 'ter'},
    ...BLDG.map((m, i) => ({kind: 'mesh' as const, mesh: m, key: `b${i}`})),
    ...RUBBLE.map((r, i) => ({kind: 'mesh' as const, mesh: r.m, key: `r${i}`, xf: {pos: {x: r.x, y: H(r.x, r.z) - 0.2, z: r.z}, yaw: r.yaw}})),
    {kind: 'mesh', mesh: SLAB, key: 'slab'},
    {kind: 'mesh', mesh: TANK, key: 'tank', xf: {pos: {x: 14, y: 0, z: -8}}},
    {
      kind: 'sprite', pos: fig, key: 'dir', draw: (c) => {
        const fv = figureView(c.view, fig, 90);
        return <Actor look={CAST.clerkC} t={t} x={fv.x} y={fv.y} s={fv.s250} yaw={fv.yaw} ink={Math.max(1.2, fv.s250 * 4)} />;
      },
    },
  ];
  return <Scene view={v} light={LIGHT} mats={MATS} items={items} t={t} debug />;
};
