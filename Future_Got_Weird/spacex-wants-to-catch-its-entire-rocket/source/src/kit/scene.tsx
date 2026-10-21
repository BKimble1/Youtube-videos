// Shared scene pieces: the catch-tower set (sky, distant shore, ground, tower, vehicle between the arms) and clouds
// that drift with the camera.
import React from 'react';
import {Cam, Cloud, Parallax, Sky, SkyKind, Stars, World} from '../assets/env';
import {Ground, Tower, VEH_X} from '../assets/tower';
import {rnd} from './anim';

export type Light = 'day' | 'dusk' | 'night';

/** Cloud field in world-ish units drawn through a parallax layer. */
export const CloudField: React.FC<{cam: Cam; k: number; seed?: number; n?: number; y0?: number; y1?: number; x0?: number; x1?: number; tint?: string; shade?: string; o?: number; s?: number}> = ({
  cam, k, seed = 1, n = 10, y0 = -400, y1 = -150, x0 = -500, x1 = 600, tint, shade, o = 1, s = 0.5,
}) => (
  <Parallax cam={cam} k={k}>
    {Array.from({length: n}, (_, i) => (
      <Cloud key={i} x={x0 + rnd(i, seed) * (x1 - x0)} y={y0 + rnd(i, seed + 1) * (y1 - y0)} s={s * (0.6 + rnd(i, seed + 2) * 0.9)} tint={tint} shade={shade} o={o} />
    ))}
  </Parallax>
);

/** Distant shoreline / Gulf horizon in world units (y = 0 ground). */
export const Shore: React.FC<{light: Light}> = ({light}) => {
  const sea = light === 'day' ? '#4c86b3' : light === 'dusk' ? '#8a6470' : '#152036';
  const dune = light === 'day' ? '#cbbf9c' : light === 'dusk' ? '#7a6658' : '#283028';
  return (
    <g>
      <rect x={-2000} y={-3} width={4000} height={3} fill={sea} />
      <path d="M-2000 -1 C -1500 -6, -1200 -2, -900 -5 C -600 -8, -300 -3, 0 -4 C 400 -6, 900 -2, 2000 -4 L2000 2 L-2000 2 Z" fill={dune} opacity={0.9} />
    </g>
  );
};

export const skyFor = (l: Light): SkyKind => (l === 'day' ? 'day' : l === 'dusk' ? 'dusk' : 'night');

/** The full catch-tower set seen broadside. `vehicle` is in tower coordinates. */
export const TowerSet: React.FC<{
  cam: Cam; light: Light; carY: number; openNear: number; openFar: number; vehicle?: React.ReactNode; armLen?: number; clouds?: boolean; t: number; ghostOldArms?: number; showMount?: boolean; foreground?: React.ReactNode;
}> = ({cam, light, carY, openNear, openFar, vehicle, armLen, clouds = true, t, ghostOldArms = 0, showMount = true, foreground}) => (
  <>
    <Sky kind={skyFor(light)} />
    {light === 'night' ? <Stars o={0.8} t={t} /> : null}
    {clouds ? <CloudField cam={cam} k={0.35} n={9} tint={light === 'dusk' ? '#f3c7a8' : light === 'night' ? '#2d3a55' : undefined} shade={light === 'dusk' ? '#c98d7e' : light === 'night' ? '#222c44' : undefined} /> : null}
    <World cam={cam}>
      <Shore light={light} />
      <Ground light={light} />
      <Tower light={light} carY={carY} openNear={openNear} openFar={openFar} vehicle={vehicle} armLen={armLen} ghostOldArms={ghostOldArms} showMount={showMount} />
      {foreground}
    </World>
  </>
);

export {VEH_X};
