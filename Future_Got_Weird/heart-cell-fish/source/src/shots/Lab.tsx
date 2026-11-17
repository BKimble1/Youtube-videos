// Shots 11-13: the time-lapse at the tank, the pull-out to the scientist and the heart model, the heart itself.
// 11  Days pass at the tank (window light and the room's grade cycle, a pipette blinks in to change the medium each
//     morning). Each day the tissue is redder and thicker, the beat quicker and the fish faster. No numbers, no graph.
// 12  The camera pulls out of the tank: the fish is a speck beside the scientist. A pan along the bench to the
//     anatomical heart model.
// 13  A push into the model; a cut, in place, to the living heart beating; a push into its muscular wall.
import React from 'react';
import {basis, Basis} from '../core/cam';
import {Layer, Cam as Cam2} from '../dc/camera';
import {Man} from '../dc/Man';
import {mixExpr} from '../dc/Head';
import {INK} from '../dc/ink';
import {Fish} from '../fish/Fish';
import {cycle, FishPose} from '../fish/model';
import {Bench, HEART_AT, HeartModel, LabWall, TankBack, TankFront, TANKL, BENCH_Y, TMID} from '../lab/set';
import {UnderwaterG} from '../art/Underwater';
import {TANK} from '../art/water';
import {BASE, EXPR_LAB, EXPR_LOOK_R, EXPR_PROUD, H_FLAT, H_REST, HERO_LAB, LS, placeHand} from '../lab/cast';
import {Heart, beatAt, LV_WALL, LV_FIBRE_DEG} from '../art/heart';
import {clamp, lerp, ss, T, W} from '../lib';

// ------------------------------------------------------------------ the days
const night1 = () => W('matured').start + 0.2;
const night2 = () => W('actually', 2).start + 0.05;
const NIGHT = 0.2;
type Day = {t0: number; phi0: number; v: number; freq: number; amp: number; mature: number};
const days = (): Day[] => [
  {t0: T.s11 - 0.3, phi0: 0, v: 50, freq: 1.0, amp: 0.26, mature: 0.12},
  {t0: night1() + NIGHT, phi0: 0, v: 100, freq: 1.8, amp: 0.4, mature: 0.55},
  {t0: night2() + NIGHT, phi0: 0, v: 150, freq: 2.6, amp: 0.48, mature: 1},
];
/** the light of day: 1 by day, 0 at the bottom of each night */
const dayLight = (t: number) => {
  let d = 1;
  for (const n of [night1(), night2()]) d = Math.min(d, 1 - Math.sin(Math.PI * clamp((t - n) / NIGHT)));
  return d;
};
const dayIndex = (t: number) => {
  const D = days();
  let k = 0;
  for (let i = 0; i < D.length; i++) if (t >= D[i].t0) k = i;
  return k;
};
const dayOf = (t: number) => days()[dayIndex(t)];
/** each day the fish crosses in front of the camera, side-on, at that day's speed (real scale: the mature fish
 *  swims about one body length a second); centred in frame at the middle of its day */
export const tankPose = (t: number): FishPose => {
  const D = days();
  const k = dayIndex(t);
  const d = D[k];
  const end = k + 1 < D.length ? D[k + 1].t0 - NIGHT : T.s12 + 0.6;
  const mid = (d.t0 + end) / 2;
  const c = cycle(2 * Math.PI * d.freq * (t - d.t0) + 0.6, d.amp);
  return {pos: [-20 + d.v * (t - mid), 40 + 12 * Math.sin(t * 0.9), 180], yaw: -5 * c.A, A: c.A, actA: c.actA, actB: c.actB, mature: d.mature, TK: 1};
};

// ------------------------------------------------------------------ camera
const logLerp = (a: number, b: number, u: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * u);
const HEART_FOCUS = {x: HEART_AT.x + LV_WALL[0] * HEART_AT.s, y: HEART_AT.y + LV_WALL[1] * HEART_AT.s};
export const labCam = (t: number): Cam2 => {
  // 11: through the front glass, close (the tank interior is drawn in 3D from this camera)
  const c11 = {x: TMID.x - 2, y: TMID.y + 2.5, z: lerp(40, 36, ss(t, T.s11, T.s12))};
  if (t < T.s12) return c11;
  // 12: out to the scientist, then along the bench to the model
  const out = ss(t, T.s12, T.s12 + 1.15);
  const pan = ss(t, T.s12 + 1.25, T.s13 + 0.1);
  const wide = {x: 470, y: 1000, z: 1.18};
  const atModel = {x: HEART_AT.x - 40, y: HEART_AT.y - 40, z: 1.9};
  const zOut = logLerp(c11.z, wide.z, out);
  let c = {x: lerp(c11.x, wide.x, ss(out, 0.15, 1)), y: lerp(c11.y, wide.y, ss(out, 0.15, 1)), z: zOut};
  if (pan > 0) c = {x: lerp(c.x, atModel.x, pan), y: lerp(c.y, atModel.y, pan), z: logLerp(c.z, atModel.z, pan)};
  // 13: into the model, then into the living wall
  const push = ss(t, T.s13 - 0.05, W('how').start + 0.05);
  const deep = ss(t, W('how').start + 0.1, T.s14);
  if (push > 0) c = {x: lerp(c.x, HEART_FOCUS.x - 14, push), y: lerp(c.y, HEART_FOCUS.y - 40, push), z: logLerp(c.z, 5.2, push)};
  if (deep > 0) c = {x: lerp(c.x, HEART_FOCUS.x, deep), y: lerp(c.y, HEART_FOCUS.y, deep), z: logLerp(c.z, 46, deep * deep)};
  return c;
};
/** the 3D camera inside the tank that sees exactly what the lab camera sees through the front glass */
const tankBasis = (cam: Cam2): Basis => {
  const D = 15000 / cam.z;
  const ex = (cam.x - TMID.x) * 10, ey = (cam.y - TMID.y) * 10;
  return basis({eye: [ex, ey, TANK.z1 + D], target: [ex, ey, TANK.z1], f: 1500});
};
export const liveHeart = (t: number) => t >= W('how').start + 0.02;
/** beat: about 75 per minute, phased so a full systole lands on "heart" */
export const heartBeat = (t: number) => beatAt((t - W('heart', 4).start) * 1.25 + 0.2);

// ------------------------------------------------------------------ the scientist by the tank
const scientist = (t: number) => {
  let p = {...BASE, x: 690, y: 1500, s: LS, torso: 9, chest: 6, neck: 6, turn: 0.45};
  p = placeHand(p, 'L', {x: 520, y: BENCH_Y - 8}, 160, 0.55, 0.05);
  p = placeHand(p, 'R', {x: 600, y: BENCH_Y - 8}, 170, 0.55, 0.05);
  const look = ss(t, T.s12 + 1.2, T.s12 + 1.7);
  const expr = mixExpr(mixExpr(EXPR_LAB, EXPR_PROUD, ss(t, T.s12 + 0.5, T.s12 + 1.0)), EXPR_LOOK_R, look);
  return {p, expr};
};

const Pipette: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => (
  <g>
    <path d={`M${x - 2},${y} L${x - 5},${y - 70} L${x + 5},${y - 70} L${x + 2},${y} Z`} fill="#F3F6F8" stroke={INK} strokeWidth={0.8 * k} opacity={0.9} />
    <path d={`M${x - 7},${y - 70} h14 v-40 h-14 Z`} fill="#4F86C6" stroke={INK} strokeWidth={0.8 * k} />
  </g>
);

export const ShotLab: React.FC<{t: number}> = ({t}) => {
  const cam = labCam(t);
  const k = 1 / Math.max(1, cam.z * 0.6);
  const day = t < T.s12 ? dayLight(t) : 1;
  const hours = 9 + (t - T.s11) * 7.5 + (t > night1() ? 12 : 0) + (t > night2() ? 12 : 0);
  const pose = tankPose(t);
  const B = tankBasis(cam);
  const sc = (x: number, y: number) => ({x: 540 + (x - cam.x) * cam.z, y: 960 + (y - cam.y) * cam.z});
  const g0 = sc(TANKL.x0, TANKL.top), g1 = sc(TANKL.x1, TANKL.floor);
  const live = liveHeart(t);
  const {p, expr} = scientist(t);
  // the medium change each morning: a pipette blinks in at the tank's top for a few frames
  const pip = [night1(), night2()].some((n) => t > n + NIGHT * 0.6 && t < n + NIGHT * 0.6 + 0.07);
  // sunlight across the wall: a soft patch that moves with the hour
  const sunX = -200 + (((hours - 6) % 24) / 12) * 900;
  const heartScreen = {x: 540 + (HEART_AT.x - cam.x) * cam.z, y: 960 + (HEART_AT.y - cam.y) * cam.z, s: HEART_AT.s * cam.z};
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <Layer cam={cam} depth={2.2}>
        <LabWall id="lw" day={day} hours={hours} />
        {day > 0.3 && <path d={`M${sunX},${300} l260,0 l140,900 l-260,0 Z`} fill="#FFF4D6" opacity={0.16 * day} />}
      </Layer>
      <Layer cam={cam} depth={1}>
        <Man id="lm" pose={p} expr={expr} lHand={H_FLAT} rHand={H_REST} outfit={HERO_LAB} inkK={0.9} />
        <Bench id="lb" k={1} />
        <TankBack id="lt" k={k} />
      </Layer>
      <defs>
        <clipPath id={`tankclip${Math.round(t * 60)}`}>
          <rect x={g0.x} y={g0.y} width={g1.x - g0.x} height={g1.y - g0.y} />
        </clipPath>
      </defs>
      <g clipPath={`url(#tankclip${Math.round(t * 60)})`}>
        <UnderwaterG id="lu" B={B} t={t} pose={pose} />
        <rect x={0} y={0} width={1080} height={1920} fill="#0E1B3A" opacity={0.5 * (1 - day)} />
      </g>
      <Layer cam={cam} depth={1}>
        <TankFront id="lt" k={k} />
        {pip && <Pipette x={TMID.x + 30} y={TANKL.surf + 14} k={k} />}
        {!live && <HeartModel id="hm" k={k} />}
        <rect x={-3000} y={-1500} width={6500} height={4700} fill="#14213D" opacity={0.38 * (1 - day)} />
      </Layer>
      {live && (() => {
        // the living heart, alone in the dark, where the model was; the push into its wall rolls the fibres level
        const deep = ss(t, W('how').start + 0.1, T.s14);
        const roll = -LV_FIBRE_DEG * ss(deep, 0.2, 1);
        const fade = ss(t, W('how').start, W('how').start + 0.12);
        return (
          <g>
            <defs>
              <radialGradient id="lhbg" cx="540" cy="900" r="1200" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#4A1220" />
                <stop offset="1" stopColor="#14060B" />
              </radialGradient>
            </defs>
            <rect x={-20} y={-20} width={1120} height={1960} fill="url(#lhbg)" opacity={fade} />
            <g transform={`rotate(${roll.toFixed(2)} 540 960) translate(${heartScreen.x.toFixed(2)} ${heartScreen.y.toFixed(2)}) scale(${heartScreen.s.toFixed(4)})`}>
              <Heart id="lh" style="live" beat={heartBeat(t)} ink={2.6 / heartScreen.s} detail={1} micro={ss(deep, 0.25, 0.7)} gloss={1 - ss(deep, 0.5, 0.9)} />
            </g>
          </g>
        );
      })()}
    </svg>
  );
};
export {H_FLAT};
