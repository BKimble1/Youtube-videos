// V3 Sequence C, part 3 (ecu -> 81.47 s): the money shot and the payoff.
//  - Hand ECU (FingerECU): the stimulation pathway's drive glow arrives along the back of the hand; the wrist is
//    yanked UP (F_JERK on a stiff spring, no anticipation, overshoot and a decaying tremor), then the hand drops; the
//    pad meets the space bar exactly (solved geometrically each frame) and the key travels down with it.
//  - Match cut on the bottom of the key travel to the cannon firing in Rao's game; the camera rides the shot to the
//    rocket, which bursts on "shoots".
//  - Pull back out of Rao's monitor (the same R world as the start of the sequence): Rao exhales, grins, and pumps
//    his fist; the upward pump is the matched cut to Stocco's hand coming up off the key (c_stocco).
import React from 'react';
import {lit, shade} from '../dc/color';
import {Inked} from '../dc/ink';
import {clamp, easeIn, easeInOut, easeOut, fmt, lerp, smooth} from '../dc/math';
import {Capsule} from '../dc/shade';
import {arcPt, CANNON} from '../art/game';
import {K} from '../art/kit';
import {CamS, sp} from './core2';
import {F_DOWN, F_HOVER, F_JERK, FingerECU, FPose, KEY, keyTopY, mixF, padPt} from './c_finger';
import {camPath, camT} from './c_cam';
import {RaoRoom, SCR} from './c_rao';
import {ct, G_DUR, G_FIRE, gameClock} from './c_time';

// ---------------------------------------------------------------- the hand ECU
/** the DOWN pose pushed through the key travel, solved so the pad stays exactly on the moving cap */
const pressExact = (press: number): FPose => {
  const want = keyTopY(press);
  let lo = 0, hi = 4;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (padPt({...F_DOWN, wrist: F_DOWN.wrist + mid}).y < want) lo = mid;
    else hi = mid;
  }
  return {...F_DOWN, wrist: F_DOWN.wrist + (lo + hi) / 2};
};
/** the wrist pose that brings the pad to height y (between the jerk and the contact), for a gravity-like drop */
export const ecuState = (t: number, f: number) => {
  const c = ct();
  const press = t < c.contact ? 0 : clamp((t - c.contact) / (2 / 30));
  // the involuntary jerk: a stiff spring toward the extension, with overshoot, then a decaying tremor while held,
  // and a slight sag as the stimulated muscles let go just before the hand falls
  const upAt = (tt: number) => {
    const ff = tt * 30;
    const k = sp(ff, c.jerk, {damping: 16, stiffness: 620});
    const held = tt - c.jerk;
    const trem = held > 0.16 ? Math.exp(-(held - 0.16) * 3.2) * Math.sin((held - 0.16) * 26) * 0.09 : 0;
    const sag = 0.16 * smooth(clamp((held - 0.35) / 0.5));
    return mixF(F_HOVER, F_JERK, k + trem - sag);
  };
  let pose: FPose;
  if (t < c.drop) pose = upAt(t);
  else if (t < c.contact) {
    // the hand falls (accelerating) from wherever the jerk left it onto the key
    const u = clamp((t - c.drop) / (c.contact - c.drop));
    pose = mixF(upAt(c.drop), F_DOWN, easeIn(u) * 0.85 + u * 0.15);
  } else pose = pressExact(press);
  const drive = t < c.ecu ? -1 : (t - c.ecu) / 0.3;
  const keyGlow = t >= c.contact ? 1 - clamp((t - c.contact - 0.05) / 0.4) : 0;
  return {pose, press, drive, keyGlow};
};
export const EcuShot: React.FC<{t: number; f: number}> = ({t, f}) => {
  const c = ct();
  const st = ecuState(t, f);
  const START: CamS = {x: KEY.x + 70, y: 735, z: 1.05};
  const UP: CamS = {x: KEY.x + 120, y: 585, z: 0.86};
  const DOWNC: CamS = {x: KEY.x + 60, y: 725, z: 1.0};
  const cam = camPath(t, [
    [c.ecu, START],
    [c.jerk, {...START, z: 1.07}],
    [c.jerk + 0.3, UP, easeOut],
    [c.drop, {...UP, y: 600, z: 0.93}],
    [c.contact, DOWNC, easeIn],
    [c.cut, {...DOWNC, z: 1.03}],
  ]);
  return (
    <g>
      <defs>
        <linearGradient id="vc-ecu-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.stoccoWall, 0.25)} />
          <stop offset="1" stopColor={K.stoccoWall} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#vc-ecu-wall)" />
      <g transform={camT(cam)}>
        <FingerECU id="vc-ecu" pose={st.pose} press={st.press} keyGlow={st.keyGlow} drive={st.drive} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- the cannon, then out of the screen to Rao
const FLY = 0.32;
const shotGeo = () => {
  const uHit = (G_FIRE + FLY) / G_DUR;
  const hp = arcPt(uHit);
  const want = Math.atan2(hp.y - CANNON.y, hp.x - CANNON.x);
  const m0 = {x: CANNON.x + Math.cos(want) * 50, y: CANNON.y + Math.sin(want) * 50};
  return {hp, m0};
};
const ballAt = (g: number) => {
  const {hp, m0} = shotGeo();
  const k = clamp((g - G_FIRE) / FLY);
  return {x: m0.x + (hp.x - CANNON.x) * k, y: m0.y + (hp.y - CANNON.y) * k};
};
const gameR = (p: {x: number; y: number}) => ({x: SCR.x + p.x, y: SCR.y + p.y});
/** keep a camera framed inside Rao's screen (no bezel) */
const inGame = (cm: CamS): CamS => {
  const hw = 960 / cm.z, hh = 540 / cm.z;
  return {...cm, x: clamp(cm.x, SCR.x + hw, SCR.x + 640 - hw), y: clamp(cm.y, SCR.y + hh, SCR.y + 400 - hh)};
};
export const cannonCam = (t: number): CamS => {
  const c = ct();
  const g = gameClock(t);
  const {hp} = shotGeo();
  if (t < c.hit) {
    // ride the cannonball: start framed on the cannon (where the key was), follow the ball up, widening for the rocket
    const u = clamp((t - c.cut) / (c.hit - c.cut));
    const b = gameR(ballAt(g));
    const c0 = gameR({x: CANNON.x + 40, y: CANNON.y - 12});
    const follow = smooth(clamp((u - 0.05) / 0.5));
    return inGame({x: lerp(c0.x, b.x + 20, follow), y: lerp(c0.y, b.y + 30, follow), z: lerp(7.2, 4.6, smooth(u))});
  }
  const H = inGame({...gameR({x: hp.x + 20, y: hp.y + 30}), z: 4.0});
  const RX: CamS = {x: 1000, y: 430, z: 1.12};
  return camPath(t, [
    [c.hit, inGame({...H, z: 4.6})],
    [c.hit + 0.6, H],
    [c.disappears + 0.1, {x: SCR.x + 320, y: SCR.y + 200, z: 2.6}],
    [c.disW + 0.5, RX],
    [c.front, {...RX, x: 960, z: 1.18}],
  ]);
};
export const CannonRaoShot: React.FC<{t: number; f: number}> = ({t, f}) => {
  const cam = cannonCam(t);
  return <g transform={camT(cam)}><RaoRoom t={t} f={f} cam={cam} /></g>;
};
