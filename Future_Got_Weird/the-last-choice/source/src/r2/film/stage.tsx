// The shared stage for every R2 shot: one battlefield set, one light rig per moment, one atmosphere, one material
// table. A shot supplies the film time, a camera and its own items (Crew, machines, FX); everything else comes from
// the world kit, so geography, light and haze match from shot to shot.
//
//   const {t, T} = useShotTime(START);                     // shot-local seconds and film seconds
//   const cam = camPath(KEYS, t);                          // keyed perspective camera (Catmull-Rom, eased)
//   <Stage T={T} cam={cam} items={[...]} lights={fx.lights} shake={fx.shake} />
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Scene, Item, makeView, Cam3, View, PointLight, shake3} from '../engine';
import {setItems, atmosItems, lightFor, MATS} from '../world';
import type {SetOpts, AtmosOpts, LightOpts} from '../world';
import {MECH_MATS} from '../mech';
import {FX_MATS} from '../fx';
import {V3, add3, clamp, smooth} from '../../kit/math';
import {FPS} from '../timing';

export const ALL_MATS = {...MATS, ...MECH_MATS, ...FX_MATS};

/** Shot-local time: `t` seconds since the shot's first frame, `T` film seconds (= start + t), `f` local frame. */
export const useShotTime = (start: number) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  return {f, t, T: start + t};
};

/** Catmull-Rom through points (u in 0..1, uniform in segments). */
export const spline3 = (P: V3[], u: number): V3 => {
  if (P.length === 1) return P[0];
  const n = P.length - 1;
  const x = clamp(u) * n;
  const i = Math.min(n - 1, Math.floor(x));
  const f = x - i;
  const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
  const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * f + (2 * a - 5 * b + 4 * cc - d) * f * f + (-a + 3 * b - 3 * cc + d) * f * f * f);
  return {x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y), z: c(p0.z, p1.z, p2.z, p3.z)};
};

export type CamKey = {t: number; pos: V3; target: V3; fov?: number; roll?: number};
/**
 * Keyed camera: positions and targets pass through every key (Catmull-Rom), timing eased between keys
 * (`ease` 0 = linear, 1 = full smoothstep per segment; default 0.5 keeps motion continuous through middle keys).
 */
export const camPath = (keys: CamKey[], t: number, ease = 0.5): Cam3 => {
  if (keys.length === 1 || t <= keys[0].t) return {pos: keys[0].pos, target: keys[0].target, fov: keys[0].fov ?? 38, roll: keys[0].roll ?? 0};
  const last = keys[keys.length - 1];
  if (t >= last.t) return {pos: last.pos, target: last.target, fov: last.fov ?? 38, roll: last.roll ?? 0};
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1];
  const lin = (t - a.t) / (b.t - a.t);
  const e = lin + (smooth(lin) - lin) * ease;
  const u = (i + e) / (keys.length - 1);
  const fa = a.fov ?? 38, fb = b.fov ?? 38;
  return {
    pos: spline3(keys.map((k) => k.pos), u),
    target: spline3(keys.map((k) => k.target), u),
    fov: fa + (fb - fa) * e,
    roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * e,
  };
};

/** Handheld drift (small, continuous) plus impact shake, both in metres, applied to the camera. */
export const withShake = (cam: Cam3, T: number, amp: number, drift = 0): Cam3 => {
  const a = amp + drift;
  if (a <= 0) return cam;
  return {...cam, pos: add3(cam.pos, shake3(T, a)), target: add3(cam.target, shake3(T, a * 1.4, 7))};
};

export type StageProps = {
  /** film seconds (drives light phase, fires, smoke, the failing tower) */
  T: number;
  cam: Cam3;
  items?: Item[] | ((view: View) => Item[]);
  set?: SetOpts | false;
  atmos?: AtmosOpts | false;
  lights?: PointLight[];
  light?: Omit<LightOpts, 'extra'>;
  /** impact shake (m) from FX/mech, plus handheld drift (m) */
  shake?: number;
  drift?: number;
  under?: React.ReactNode;
  over?: React.ReactNode | ((view: View) => React.ReactNode);
  /** 0..1 dip to black (cuts, the title bridge) */
  black?: number;
  /** screen-space vignette strength (default 0.5) */
  vignette?: number;
  sky?: boolean;
  debug?: boolean;
};

export const Stage: React.FC<StageProps> = ({T, cam, items, set, atmos, lights, light, shake = 0, drift = 0, under, over, black = 0, vignette = 0.5, sky, debug}) => {
  const view = makeView(withShake(cam, T, shake, drift));
  const rig = lightFor(T, {...light, extra: lights});
  const its: Item[] = [
    ...(set === false ? [] : setItems(view, T, set)),
    ...(atmos === false ? [] : atmosItems(view, T, atmos)),
    ...(typeof items === 'function' ? items(view) : items ?? []),
  ];
  const ov = typeof over === 'function' ? over(view) : over;
  return (
    <Scene
      view={view}
      light={rig}
      mats={ALL_MATS}
      items={its}
      t={T}
      sky={sky}
      debug={debug}
      under={under}
      over={
        <>
          {ov}
          {vignette > 0 ? <Vignette k={vignette} /> : null}
          {black > 0 ? <rect width={1920} height={1080} fill="#000" opacity={clamp(black)} /> : null}
        </>
      }
    />
  );
};

let vid = 0;
export const Vignette: React.FC<{k: number}> = ({k}) => {
  const id = React.useMemo(() => `r2vig${vid++}`, []);
  return (
    <>
      <defs>
        <radialGradient id={id} cx="50%" cy="48%" r="75%">
          <stop offset="55%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.55 * k} />
        </radialGradient>
      </defs>
      <rect width={1920} height={1080} fill={`url(#${id})`} />
    </>
  );
};

/** Fade helpers for shot heads/tails (seconds, shot-local). */
export const fadeIn = (t: number, d: number) => (d <= 0 ? 0 : 1 - smooth(clamp(t / d)));
export const fadeOut = (t: number, dur: number, d: number) => (d <= 0 ? 0 : smooth(clamp((t - (dur - d)) / d)));
