// 1:11–1:33, side view, driving: hard braking (tyres supply the braking force, the nose dives; the actuators oppose
// the dive), then an uneven patch run through the half-car model (wheels follow the road, the cabin moves less but
// still moves), and a bigger bump that uses up the travel.
import React from 'react';
import {C} from '../theme';
import {w} from '../cues';
import {SideCar, bodyToWorld, STRUT_TOP} from '../car/side';
import {Arrow} from '../car/parts';
import {AXLE_F, AXLE_R, COM, WHEEL_R} from '../car/geom';
import {Cam, Chip, Label, toScreen, World} from '../kit/stage';
import {SideWorld} from '../kit/sideworld';
import {simulateHalf, sampleHalf} from '../sim/halfcar';
import {clamp01, easeInOut, keys, rand, seg, smooth, win} from '../kit/util';
import {CORNER_OUT} from './FrontCorner';

const T = {
  brake: w('b4', 'brake'),
  pitch: w('b4', 'pitch'),
  active: w('b4', 'active'),
  oppose: w('b4', 'oppose'),
  dive: w('b4', 'dive'),
  hit: w('b4', 'hit'),
  cabin: w('b4', 'cabin'),
  balancing: w('b4', 'balancing'),
  bodyCtl: w('b4', 'body', 1), // "body control" (the first is "the body tends to pitch")
  tire: w('b4', 'tire'),
  comfort: w('b4', 'comfort'),
  system: w('b4', 'system'),
  limited: w('b4', 'limited'),
  travel: w('b4', 'travel'),
  force: w('b4', 'force'),
  cant: w('b4', "can't"),
  smooth: w('b4', 'smooth'),
  one: w('b4', 'one'),
  and5: w('b5', 'and'),
};
export const BRAKE_IN = CORNER_OUT + 0.12;
export const BRAKE_HOLD = T.one + 0.25; // camera stops tracking; the car drives out of frame
export const BRAKE_OUT = BRAKE_HOLD + 1.3;

// speed (m/s): cruise, brake down to a low speed, roll on over the patch
const V0 = 18, V1 = 8;
const tb0 = T.brake + 0.1, tb1 = T.dive + 0.35;
const vAt = (t: number) => (t < tb0 ? V0 : t < tb1 ? V0 + (V1 - V0) * ((t - tb0) / (tb1 - tb0)) : V1);
const xAt = (t: number) => {
  // integral of vAt from BRAKE_IN (m)
  const a = Math.min(t, tb0) - BRAKE_IN;
  let x = V0 * Math.max(0, a);
  if (t > tb0) {
    const u = Math.min(t, tb1) - tb0;
    x += V0 * u + ((V1 - V0) / (tb1 - tb0)) * u * u * 0.5;
  }
  if (t > tb1) x += V1 * (t - tb1);
  return x;
};
const decel = (t: number) => (t > tb0 && t < tb1 ? 1 : 0);

// road: an uneven patch starting where the front wheels are at "Hit", plus one bigger bump at "limited travel"
const PATCH0 = xAt(T.hit + 0.05) + 1.45;
const BIG = xAt(T.travel - 0.15) + 1.45;
const PATCH1 = xAt(BRAKE_OUT + 1) + 3;
const hump = (s: number, c: number, len: number, h: number) => {
  const u = (s - (c - len / 2)) / len;
  return u > 0 && u < 1 ? h * Math.sin(Math.PI * u) ** 2 : 0;
};
const FEATURES: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  let s = PATCH0 + 0.25;
  let i = 0;
  while (s < PATCH1) {
    if (Math.abs(s - BIG) > 3.5) {
      const long = rand(41 + i) < 0.2;
      out.push([s, long ? 2.6 + 1.2 * rand(7 + i) : 0.5 + 0.5 * rand(9 + i), long ? 0.02 + 0.012 * rand(3 + i) : 0.04 + 0.03 * rand(5 + i)]);
    }
    s += 1.6 + 2.2 * rand(13 + i);
    i++;
  }
  out.push([BIG, 1.5, 0.13]);
  return out;
})();
export const roadAt = (x: number) => {
  if (x < PATCH0 || x > PATCH1) return 0;
  let h = 0;
  for (const [c, len, hh] of FEATURES) h = Math.max(h, hump(x, c, len, hh));
  return h;
};
export const BRAKE_EV = {tb0: () => tb0, tb1: () => tb1, xAt: (t: number) => xAt(t), big: () => BIG};
const HALF = simulateHalf(BRAKE_IN - 0.5, BRAKE_OUT + 0.5, xAt, roadAt, (t) => smooth(seg(t, T.hit - 1, T.hit - 0.5)));

export const SideBrake: React.FC<{t: number}> = ({t}) => {
  const X = xAt(t) * 1000; // car position (mm)
  const hs = sampleHalf(HALF, t);
  // braking pitch (kinematic): passive dive, then the actuators take most of it out; ends when braking ends
  const passive = -2.6, active = -0.7;
  let brakePitch = keys(t, [[tb0, 0], [tb0 + 0.7, passive * 1.08], [tb0 + 1.1, passive]], easeInOut);
  if (t > T.active - 0.1) brakePitch = keys(t, [[T.active - 0.1, passive], [T.oppose + 0.25, active]], easeInOut);
  brakePitch *= 1 - smooth(seg(t, tb1 - 0.1, tb1 + 0.5));
  const pitch = brakePitch + (hs.th * 180) / Math.PI;
  const dzBrake = brakePitch * 4; // the nose dives about the rear axle region: small heave to match
  const dz = hs.z * 1000 + dzBrake;
  const wf = (hs.zf) * 1000, wr = (hs.zr) * 1000;
  const rot = -(X / (2 * Math.PI * WHEEL_R)) * 360;

  // camera tracks the car, then holds while it drives out of frame
  const camX = (tt: number) => xAt(Math.min(tt, BRAKE_HOLD)) * 1000 + 200;
  const camZ = keys(t, [[BRAKE_IN, 0.33], [T.hit - 0.8, 0.34], [T.hit + 0.2, 0.36], [BRAKE_HOLD - 0.3, 0.36], [BRAKE_HOLD + 0.3, 0.31]], easeInOut);
  const cam: Cam = {x: camX(t), y: 700, z: camZ};
  const px = cam.z;
  const cutaway = smooth(seg(t, BRAKE_IN + 0.5, BRAKE_IN + 1.1)) * (1 - smooth(seg(t, BRAKE_HOLD - 0.4, BRAKE_HOLD + 0.2)));
  const isActive = t > T.active - 0.15;
  const actOn = smooth(seg(t, T.active - 0.2, T.active + 0.3));
  // actuator forces: braking phase (front push, rear pull), then the half-car active forces on the patch
  const brakeAct = isActive ? actOn * (1 - smooth(seg(t, tb1 - 0.1, tb1 + 0.4))) : 0;
  const forceF = brakeAct * 0.9 + clamp01(1 - brakeAct) * (hs.Ff / 7000) * (t > T.hit - 0.6 ? 1 : 0);
  const forceR = -brakeAct * 0.7 + clamp01(1 - brakeAct) * (hs.Fr / 7000) * (t > T.hit - 0.6 ? 1 : 0);

  const pose = {x: X, dz, pitch};
  // comparison ghost: the level car while the passive body dives, then the passive dive while the actuators level it
  const ghost = win(t, tb0 + 0.35, tb1, 0.3, 0.3);
  const ghostPitch = keys(t, [[T.active - 0.1, 0], [T.active + 0.4, passive]], easeInOut);
  const brakeArrows = win(t, tb0 + 0.1, tb1 - 0.05, 0.25, 0.25);
  const topF = bodyToWorld(pose, AXLE_F, STRUT_TOP), topR = bodyToWorld(pose, AXLE_R, STRUT_TOP);
  const pairVis = win(t, T.active - 0.1, T.dive + 0.3, 0.3, 0.3);
  const s = (x: number, y: number) => toScreen(cam, x, y);
  const limit = Math.max(hs.limF, hs.limR) * win(t, T.limited - 0.6, T.cant + 0.6, 0.2, 0.4);
  const tagPos = {
    body: s(X - 300, 1500 + dz),
    tire: s(X + AXLE_F, -360),
    comfort: s(X - 700, 1150 + dz),
    limit: s(X + AXLE_F, 1350 + dz),
  };
  return (
    <g>
      <SideWorld cam={cam} profile={(xmm) => roadAt(xmm / 1000) * 1000} patches={[[PATCH0 * 1000 - 400, PATCH1 * 1000]]} />
      <World cam={cam}>
        {ghost > 0 && <g opacity={ghost}><SideCar x={X} dz={ghostPitch * 4} pitch={ghostPitch} px={px} ghost id="bghost" /></g>}
        <SideCar x={X} dz={dz} pitch={pitch} wf={wf} wr={wr} rot={rot} px={px} cutaway={cutaway} actuator={1} forceF={forceF} forceR={forceR} brake={brakeArrows} id="brake" limitF={hs.limF * limit} limitR={hs.limR * limit} />
        {/* the tyres brake the car: rearward road forces at the contact patches (front larger) */}
        {brakeArrows > 0 && (
          <g>
            <Arrow x={X + AXLE_F + 40} y={30} dx={-560} dy={0} px={px} color={C.coral} width={16} opacity={brakeArrows} />
            <Arrow x={X + AXLE_R + 40} y={30} dx={-340} dy={0} px={px} color={C.coral} width={16} opacity={brakeArrows} />
          </g>
        )}
        {/* actuators against the dive: front pushes the body up, rear pulls it down */}
        {pairVis > 0 && (
          <g>
            <Arrow x={topF[0] + 160} y={topF[1] + 40} dx={0} dy={260} px={px} color={C.teal} opacity={pairVis} />
            <Arrow x={topR[0] - 160} y={topR[1] + 300} dx={0} dy={-240} px={px} color={C.blue} opacity={pairVis} />
          </g>
        )}
      </World>
      <Label x={s(X + AXLE_F - 900, 0).x} y={s(0, -420).y} text="TIRES BRAKE THE CAR" color={C.coralLight} size={34} opacity={win(t, tb0 + 0.2, T.active - 0.2, 0.3, 0.3)} />
      <Label x={tagPos.body.x} y={tagPos.body.y} text="BODY CONTROL" color={C.white} size={34} opacity={win(t, T.bodyCtl - 0.1, T.system, 0.25, 0.35)} />
      <Label x={tagPos.tire.x} y={tagPos.tire.y} text="TIRE CONTACT" color={C.tealLight} size={34} opacity={win(t, T.tire - 0.1, T.system, 0.25, 0.35)} />
      <Label x={tagPos.comfort.x} y={tagPos.comfort.y} text="COMFORT" color={C.saffronLight} size={34} opacity={win(t, T.comfort - 0.1, T.system + 0.2, 0.25, 0.35)} />
      <Label x={tagPos.limit.x} y={tagPos.limit.y} text="TRAVEL LIMIT" color={C.coral} fg={C.white} size={36} opacity={win(t, T.travel - 0.2, T.cant + 0.4, 0.2, 0.4)} />
      <Chip x={40} y={40} text={isActive ? 'ACTIVE' : 'PASSIVE (FOR COMPARISON)'} opacity={win(t, BRAKE_IN + 0.4, T.hit - 0.4, 0.3, 0.3)} />
      <Chip x={40} y={92} text="SIMPLIFIED" opacity={cutaway * 0.95} dark={false} size={22} />
    </g>
  );
};
export const brakeCarScreenTail = (t: number) => {
  const X = xAt(t) * 1000;
  const camx = xAt(Math.min(t, BRAKE_HOLD)) * 1000 + 200;
  return 960 + (X - 2526 - camx) * 0.31; // camera zoom is back to 0.31 by the time the car leaves
};
