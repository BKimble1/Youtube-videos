// Dev still: the corridor, the shield, the two characters and the torch from a chosen camera preset.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import '../fonts';
import {a3, basis, Cam, m3, n3, s3, v3} from './p3';
import {Corridor, Flashlight} from './Corridor';
import {LOOK_G, LOOK_W, Person, Pose, joints} from './Person';
import {EXP0} from './Head3';
import {HAND_RELAXED} from '../art/Hand';
import {Shield3, ShieldState, gripWorld, viewSide} from './Shield3';

const GRIP = {curl: [0.82, 0.86, 0.88, 0.9] as [number, number, number, number], spread: 0.15, thumb: 34, thumbCurl: 0.7};
export const S0: ShieldState = {c: v3(-0.55, 0.565, 2.95), yaw: 0, tilt: 0, speed: 0};
export const womanHide = (s: ShieldState): Pose => ({
  pos: v3(-0.55, 0, 2.5), yaw: 0, crouch: 1, lean: 0.28, side: 0, twist: 0, bob: 0, headYaw: 0, headPitch: 0.1, headRoll: 0, walk: 0, walkAmt: 0,
  R: {W: gripWorld(s, 1, 0.5), hand: GRIP, pole: v3(1, -0.6, -0.3)}, L: {W: gripWorld(s, -1, 0.5), hand: GRIP, pole: v3(-1, -0.6, -0.3)},
  expr: EXP0, blink: 0, sway: 0,
});
export const guardAt = (z: number, aim: {x: number; y: number; z: number}): Pose => {
  const base: Pose = {pos: v3(-0.35, 0, z), yaw: Math.PI, crouch: 0, lean: 0.05, side: 0, twist: 0, bob: 0, headYaw: 0, headPitch: 0.12, headRoll: 0, walk: 0, walkAmt: 0, R: {hand: GRIP}, L: {hand: HAND_RELAXED}, expr: EXP0, blink: 0, sway: 0, flashlight: true};
  const j = joints(base, LOOK_G.dims);
  const W = a3(a3(j.sh.r, m3(j.F, 0.42)), v3(0, -0.12, 0));
  return {...base, R: {W, hand: GRIP, dir: n3(s3(aim, W)), pole: v3(0.3, -1, 0.4)}};
};
const CAMS: Record<string, Cam> = {
  ots: {pos: v3(-0.78, 1.8, 9.8), tgt: v3(-0.5, 0.65, 2.95), f: 1400},
  side: {pos: v3(1.25, 0.8, 2.7), tgt: v3(-0.8, 0.62, 2.9), f: 900},
  corner: {pos: v3(0.7, 1.35, 0.2), tgt: v3(-0.8, 1.15, 2.4), f: 950},
  top: {pos: v3(0, 26, 4.5), tgt: v3(0, 0, 4.5001), f: 3200},
};
export const Test2: React.FC<{cam: string}> = ({cam}) => {
  const b = basis(CAMS[cam]);
  const s = S0;
  const aim = v3(-0.5, 0.7, 2.95);
  const g = guardAt(9, aim);
  const gj = joints(g, LOOK_G.dims);
  const lensO = a3(gj.R.W, m3(gj.R.dir, 0.3));
  const scene = (
    <g>
      <Corridor id={`c-${cam}`} b={b} t={1} cut={cam === 'top'} />
      <Flashlight id={`fl-${cam}`} b={b} o={lensO} dir={gj.R.dir} on={1} />
    </g>
  );
  const sceneCopy = (
    <g>
      <Corridor id={`cc-${cam}`} b={b} t={1} cut={cam === 'top'} />
      <Flashlight id={`flc-${cam}`} b={b} o={lensO} dir={gj.R.dir} on={1} />
    </g>
  );
  const w = <Person id={`w-${cam}`} b={b} pz={womanHide(s)} look={LOOK_W} />;
  const wc = <Person id={`wr-${cam}`} b={b} pz={womanHide(s)} look={LOOK_W} shadow={false} />;
  const side = viewSide(b, s);
  return (
    <AbsoluteFill style={{background: '#08111A'}}>
      <svg width={1080} height={1920}>
        {scene}
        {side < 0 ? (
          <>
            <Shield3 id={`s-${cam}`} b={b} s={s} t={1} behindScene={sceneCopy} subject={null} />
            {w}
          </>
        ) : (
          <>
            {w}
            <Shield3 id={`s-${cam}`} b={b} s={s} t={1} behindScene={sceneCopy} subject={wc} glint={0.6} />
          </>
        )}
        <Person id={`g-${cam}`} b={b} pz={g} look={LOOK_G} />
      </svg>
    </AbsoluteFill>
  );
};
