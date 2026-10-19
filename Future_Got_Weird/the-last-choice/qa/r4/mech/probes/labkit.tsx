import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Scene, Item, makeView, orbit, prep, terrain, strut, LightRig, Material, Cam3, View} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {MECH_MATS} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/mech';

export const MATS: Record<string, Material> = {...MECH_MATS, g_ground: {base: '#6B625C'}, g_asphalt: {base: '#46413F'}, g_line: {base: '#B9AE8E'}};
export const LIGHT: LightRig = {
  sun: {x: -0.84, y: 0.32, z: 0.2}, sunColor: '#FFC08A', ambient: '#4A5878',
  lights: [], fogColor: '#9C7E73', fogStart: 40, fogEnd: 700, skyTop: '#3B3446', skyHorizon: '#C88466', ink: '#162A32',
};
export const GROUND = prep(terrain(-80, 420, -90, 90, 10, () => 0, (x, z) => (Math.abs(z) < 14 ? 'g_asphalt' : 'g_ground')));
export const svgOf = (v: View, items: Item[], t: number, title = '', ground: any = GROUND, mats = MATS, light = LIGHT) =>
  renderToStaticMarkup(
    <Scene view={v} light={light} mats={mats} items={[{kind: 'mesh', mesh: ground, key: 'g', sortKey: 'max'} as Item, ...items]} t={t}
      over={<g><text x={20} y={50} fill="#fff" fontSize={30} fontFamily="sans-serif" stroke="#000" strokeWidth={4} paintOrder="stroke">{title}</text></g>} />,
  );
export {makeView, orbit};
export type {Cam3, View, Item};
export const bumpGround = (fn: (x: number, z: number) => number, half = 12, cell = 0.5) => prep(terrain(-half, half, -half, half, cell, fn, () => 'g_ground'));
export const terrainOf = (fn: (x: number, z: number) => number, x0: number, x1: number, z0: number, z1: number, cell = 0.7, mat = 'g_ground') => prep(terrain(x0, x1, z0, z1, cell, fn, () => mat));
export {strut, prep};
