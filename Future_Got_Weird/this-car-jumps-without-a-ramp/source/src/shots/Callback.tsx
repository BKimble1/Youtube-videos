// 1:48–2:00 — "Watch the jump again." The real clip plays on its own frames (front half of the car this time), the illustrated
// car takes over at the same wheel position, and the same four beats are told in the fewest pictures:
//   contact patch  ->  the suspension pushes  ->  separation  ->  airborne (gravity), landing
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';
import {w, we} from '../cues';
import {SideCar, bodyToWorld, STRUT_TOP} from '../car/side';
import {Arrow} from '../car/parts';
import {AXLE_F, AXLE_R, COM, WHEEL_R} from '../car/geom';
import {Cam, Caption, Label, Stage, camKeys, toScreen, World} from '../kit/stage';
import {ProvingSide} from '../kit/proving';
import {CarForces, ContactPatch, MOTION_LIFT} from '../kit/forces';
import {RealClip, REAL, FILM, JUMP_CROP, alignFixed, alignMatrix, camFromAlign, realFrameAt, realEnd} from '../footage';
import {LAUNCH, LaunchState, MTOT, G, sampleLaunch, STATIC} from '../sim/launch';
import {clamp01, easeInOut, pchip, seg, smooth, win} from '../kit/util';

export const T6 = {
  watch: w('b6', 'watch'),
  again: w('b6', 'again'),
  suspension: w('b6', 'suspension'),
  builds: w('b6', 'builds'),
  launch: w('b6', 'launch'),
  tires: w('b6', 'tires'),
  grounded: w('b6', 'grounded'),
  then: w('b6', 'then'),
  contact: w('b6', 'contact'),
  breaks: w('b6', 'breaks'),
  gravity: w('b6', 'gravity'),
  flight: w('b6', 'flight'),
  hop: w('b6', 'hop'),
  spectacular: w('b6', 'spectacular'),
  demonstration: w('b6', 'demonstration'),
  useful: w('b6', 'useful'),
  flightEnd: we('b6', 'flight'),
};
export const CALLBACK_IN = REAL.replay.frame0 / 30; // 108.04: the first real frame
export const CALLBACK_OUT = T6.useful - 0.14; // = the closing's first frame

const KEYS: [number, number][] = [[110.42, 0.4], [110.7, 0.5], [111.75, 0.92], [113.75, 1.104], [115.15, 1.254], [116.55, 1.404], [117.2, 1.62], [118.1, 1.9]];
const sim = (t: number) => (t < 110.42 ? 0 : pchip(t, KEYS));
export const CALLBACK_EV = {crouch: 110.7, push: 111.75, take: 113.75, apex: 115.15, land: 116.55};
const poseAt = (t: number) => {
  const st: LaunchState = sampleLaunch(LAUNCH, Math.max(0, sim(t)));
  return {st, dz: (st.zb - LAUNCH[0].zb) * 1000, wz: (st.zw - STATIC.zw) * 1000, force: Math.max(-1, Math.min(1, st.Fa / 30e3)), n: st.N / 2 / (MTOT * G), v: st.vb, air: st.air};
};

const CAMR = camFromAlign(REAL.replay.crop, 328);
const CAM_F: Cam = {x: AXLE_F - 120, y: 560, z: 0.72};
// where the wheels of BYD's side jump sit at its recording frame 336 (nose just lifting): the illustration's camera frames the
// car exactly there before the dissolve into the real flight
const JM = alignFixed(JUMP_CROP, [646, 682], [1250, 668]);
const CAM_JUMP: Cam = JM.cam;
const CAM_OUT: Cam = {x: -40, y: 780, z: 0.31};
/** film time of the real side jump's first frame (recording frame 316); its frame 336 lands on the takeoff of the model. */
export const JUMP_T0 = CALLBACK_EV_TAKE() - 20 / 30;
function CALLBACK_EV_TAKE() {
  return 113.75;
}
export const JUMP_CLIP = FILM.jump(JUMP_T0);
export const JUMP_END = (JUMP_CLIP.frame0 + (JUMP_CLIP.to - JUMP_CLIP.from + 1)) / 30;
export const HOVER_CLIP = FILM.hover(JUMP_END); // frame-exact: the first hover frame follows the last jump frame
export const HOVER_END = (HOVER_CLIP.frame0 + (HOVER_CLIP.to - HOVER_CLIP.from + 1)) / 30;
const camAt = (t: number): Cam =>
  t >= HOVER_END ? CAM_OUT : camKeys(t, [[0, CAMR], [110.45, CAMR], [111.4, CAM_F], [112.35, CAM_F], [113.6, CAM_JUMP], [HOVER_END, CAM_JUMP]], easeInOut);

export const Callback: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t);
  const px = cam.z;
  const toS = (x: number, y: number) => toScreen(cam, x, y);
  const realEndT = realEnd(REAL.replay);
  const n = realFrameAt(REAL.replay, t);
  const al = alignMatrix(REAL.replay.crop, n);
  // match cut: the illustration over the real car (aligned frame by frame), then the photographic backdrop gives way
  const carA = 0; // crisp match cut: no overlay, no double image
  const bgA = t < realEndT ? 0 : 1;
  const overlay = t < realEndT;

  const lp = poseAt(t);
  const sag = 18 * smooth(seg(t, 110.4, 111.0));
  const dz = -sag + lp.dz, wf = -sag + lp.wz, wr = -sag + lp.wz;
  const pose = {x: 0, dz, pitch: 0};
  const com = bodyToWorld(pose, COM.x, COM.y);
  const ax: [number, number] = [AXLE_R, AXLE_F];
  const grounded = !lp.air;

  // the front window: shown while the suspension builds the launch, closed before the car leaves the ground
  const open = smooth(seg(t, 110.4, 110.95)) * (1 - smooth(seg(t, 112.75, 113.2)));
  const push = smooth(seg(t, CALLBACK_EV.crouch, CALLBACK_EV.crouch + 0.5));
  const wells = open > 0.001 ? [{axle: 'f' as const, open, spring: 1, damper: 1, actuator: 1, slide: 1, force: lp.force * push, springGlow: 0, damperGlow: 0}] : [];

  // real side jump (BYD): takes over from the illustration at the same wheel position, one frame per frame, uninterrupted
  const hoverT0 = HOVER_CLIP.frame0 / 30;
  const realOut = smooth(seg(t, HOVER_END - 0.1, HOVER_END + 0.15));
  const realJ = smooth(seg(t, JUMP_T0 + 0.6, JUMP_T0 + 0.75)) * (t < hoverT0 ? 1 : 0);
  const realH = t >= hoverT0 && t < HOVER_END + 0.15 ? 1 - realOut : 0;
  const vecA = t < JUMP_T0 + 0.78 ? 1 : t < HOVER_END - 0.1 ? 0 : 1; // opaque under both dissolves, so no cream shows through
  const carOnly = t >= JUMP_T0 + 0.6 && t < HOVER_END - 0.1; // arrows stay on the real flight, the drawn car does not

  const patchVis = win(t, T6.tires - 0.35, CALLBACK_EV.take + 0.02, 0.25, 0.03) * (grounded ? 1 : 0);
  const chord = (() => {
    const dd = Math.max(0, sag - lp.wz);
    return 2 * Math.sqrt(Math.max(0, 2 * WHEEL_R * dd - dd * dd));
  })();
  const topF = bodyToWorld(pose, AXLE_F, STRUT_TOP);
  const pushPair = win(t, T6.builds + 0.2, JUMP_T0 + 0.55, 0.3, 0.12) * (grounded ? 1 : 0);
  const forces = win(t, T6.grounded - 0.3, CALLBACK_EV.land + 0.3, 0.4, 0.4);
  const road = win(t, T6.grounded - 0.3, CALLBACK_EV.take + 0.02, 0.3, 0.02);
  const motion = win(t, T6.gravity - 0.2, CALLBACK_EV.land - 0.1, 0.3, 0.3);
  const slow = win(t, CALLBACK_EV.crouch, JUMP_T0 + 0.55, 0.4, 0.2);
  const mpos = toS(com[0] + 80, com[1] + MOTION_LIFT);
  const gtip = toS(com[0], com[1] - 450);
  const split = smooth(seg(t, CALLBACK_EV.take - 0.2, CALLBACK_EV.take + 0.25)) * (1 - smooth(seg(t, CALLBACK_EV.take + 1.0, CALLBACK_EV.take + 1.5)));
  const gap = toS(AXLE_F, -150);
  const realCap = win(t, JUMP_T0 + 0.6, HOVER_END - 0.1, 0.3, 0.3);
  return (
    <AbsoluteFill>
      <RealClip spec={REAL.replay} opacity={t < realEndT ? 1 : 0} />
      <Stage bg="transparent">
        <g opacity={bgA * vecA}>
          <ProvingSide cam={cam} zone="launch" />
        </g>
        {overlay ? (
          <g opacity={carA}>
            <g transform={al.m}>
              <SideCar x={0} px={al.s} shadow={0} id="match2" />
            </g>
          </g>
        ) : (
          <World cam={cam}>
            <g opacity={vecA}>
              <ContactPatch cx={ax[0]} chord={chord} px={px} opacity={patchVis} />
              <ContactPatch cx={ax[1]} chord={chord} px={px} opacity={patchVis} />
              <SideCar x={0} dz={dz} pitch={0} wf={wf} wr={wr} px={px} wells={wells} shadow={bgA} id="callback" />
              {pushPair > 0 && (
                <g>
                  <Arrow x={topF[0] + 260} y={topF[1] + 20} dx={0} dy={240} px={px} color={C.teal} opacity={pushPair} />
                  <Arrow x={AXLE_F + 250} y={WHEEL_R + wf - 20} dx={0} dy={-240} px={px} color={C.teal} opacity={pushPair} />
                </g>
              )}
            </g>
            {!carOnly && <CarForces px={px} com={com} axles={ax} n={lp.n} v={lp.v} road={forces * road} gravity={forces} motion={motion} pair={0} />}
          </World>
        )}
        {/* separation: where the tyre has left the road */}
        <Label x={mpos.x + 100} y={mpos.y} text="MOTION" color={C.saffronLight} size={30} opacity={motion * forces * (Math.abs(lp.v) > 0.3 ? 1 : 0) * (carOnly ? 0 : 1)} />
        <Label x={gtip.x} y={gtip.y + 38} text="GRAVITY" color={C.blueLight} size={30} opacity={win(t, T6.gravity - 0.2, CALLBACK_EV.land - 0.2, 0.3, 0.3) * forces * (carOnly ? 0 : 1)} />
      </Stage>
      {/* the real jump is drawn over the illustration but under the arrows, so its layer is inserted between: arrows re-drawn on top */}
      <RealClip spec={JUMP_CLIP} opacity={realJ} />
      <RealClip spec={HOVER_CLIP} opacity={realH} />
      <Stage bg="transparent">
        {carOnly && (
          <World cam={cam}>
            <CarForces px={px} com={com} axles={ax} n={lp.n} v={lp.v} road={0} gravity={forces} motion={motion} pair={0} />
          </World>
        )}
        {carOnly && <Label x={mpos.x + 100} y={mpos.y} text="MOTION" color={C.saffronLight} size={30} opacity={motion * forces * (Math.abs(lp.v) > 0.3 ? 1 : 0)} />}
        {carOnly && <Label x={gtip.x} y={gtip.y + 38} text="GRAVITY" color={C.blueLight} size={30} opacity={win(t, T6.gravity - 0.2, CALLBACK_EV.land - 0.2, 0.3, 0.3) * forces} />}
        <Caption text="BYD DEMONSTRATION VIDEO" opacity={Math.max(win(t, CALLBACK_IN + 0.1, CALLBACK_IN + 1.6, 0.3, 0.4), realCap)} />
        <Caption text="SLOW MOTION · SIMPLIFIED MODEL" opacity={slow} />
      </Stage>
    </AbsoluteFill>
  );
};
void clamp01;
