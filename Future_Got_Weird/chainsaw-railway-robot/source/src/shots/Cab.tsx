// The operator's cabin, as an ORIGINAL ILLUSTRATIVE RECONSTRUCTION (no footage of the cabin was screened): the
// operator (the Weird Crew's rig, in work clothes) sits facing the robot side, watches the robot's camera view on two
// monitors and works two hand controllers. The window looks up at the boom; the monitors show the same worksite from
// the robot's head. Cab space is a 1920 x 1080 reference frame; the camera pans/zooms within it.
import React from 'react';
import {add, clamp, easeInOut, easeOut, lerp, mul, V} from '../dc/math';
import {lit, shade} from '../dc/color';
import {H, keys, pr, pulse, W} from '../lib/core';
import {BT, TT} from '../lib/timeline';
import {circ, f, INK, IP, Line, Mat, poly, slab} from '../lib/draw';
import {Man, manJoints, ManPose} from '../dc/Man';
import {Expr, EXPR_NEUTRAL} from '../dc/Head';
import {HandPose} from '../dc/Hand';
import {Worksite, worksite} from './Worksite';
import {Cam} from '../art/World';

const tt = TT;
export const OPERATOR = {skin: '#F2C9A8', hair: '#2B2420', shirt: '#3E6EA8', stripe: null, pants: '#2E3F5C', shoe: '#3A3F45', longSleeve: true};

/** grip positions (cab space) at rest */
export const GRIP_L: V = {x: 1068, y: 662};
export const GRIP_R: V = {x: 1192, y: 650};
const BASE_DY = 150;

/** controller tilt (deg, + = toward the robot / screen-left at the top) and trigger 0..1, as functions of time */
export const controls = (t: number) => {
  const tiltL = keys(t, [
    [0, 0],
    [tt.moves - 0.1, 0],
    [tt.moves + 0.6, 13],
    [tt.controls1 + 0.3, 13],
    [tt.controls1 + 1.2, 4],
    // bilateral: a small push sends the command ...
    [tt.tiny, 0],
    [BT.bilOut, 7.5],
    // ... the feedback arrives: the handle is pushed back against the hand ...
    [BT.bilFelt, 7.5],
    [BT.bilFelt + 0.25, 5.2, easeOut],
    // ... and the operator eases off to a smaller, controlled input
    [BT.bilEase0, 5.2],
    [BT.bilEase1, 3.8],
    [tt.pushingEnd + 0.6, 3.8],
    [tt.imagine, 2],
    // ending: one small movement, pulling the grip toward the operator (its top travels right and down)
    [tt.gave - 0.2, 0],
    [BT.endCut, -9, easeInOut],
  ]);
  const trigL = keys(t, [[0, 0], [tt.gave + 0.05, 0], [BT.endCut, 1, easeOut]]);
  const tiltR = keys(t, [[0, 2], [tt.moves, 2], [tt.moves + 0.8, -3], [tt.controls1 + 1, 1], [tt.gave + 0.3, 1], [tt.mechanical - 0.3, 9]]);
  const trigR = keys(t, [[0, 0], [tt.mechanical - 0.7, 0], [tt.mechanical - 0.4, 1]]);
  // resistance felt: 0..1 (drives the pushback cue on the hand)
  const felt = pulse(t, BT.bilFelt - 0.1, BT.bilFelt + 0.15, tt.pushingEnd + 0.2, tt.imagine);
  return {tiltL, trigL, tiltR, trigR, felt};
};
export const gripAt = (G: V, tilt: number): V => {
  const base = add(G, {x: 0, y: BASE_DY});
  const a = (tilt * Math.PI) / 180;
  return add(base, {x: -Math.sin(a) * BASE_DY, y: -Math.cos(a) * BASE_DY});
};

export const CabDefs: React.FC = () => (
  <defs>
    <linearGradient id="c-wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#E9EEF1" />
      <stop offset="1" stopColor="#C9D3DA" />
    </linearGradient>
    <linearGradient id="c-console" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#4C5966" />
      <stop offset="1" stopColor="#2A333C" />
    </linearGradient>
    <radialGradient id="c-warm" cx="0.75" cy="0.25" r="0.9">
      <stop offset="0" stopColor="#FFE7B8" stopOpacity="0.35" />
      <stop offset="1" stopColor="#FFE7B8" stopOpacity="0" />
    </radialGradient>
    <Mat id="c-grip" c="#2B333B" />
    <Mat id="c-dome" c="#3E4954" />
    <Mat id="c-seat" c="#2F3A46" />
  </defs>
);

/** a hand controller: dome base on the console, a short stick, an upright grip with a trigger */
export const Controller: React.FC<{G: V; tilt: number; trig: number; k?: number; glow?: number}> = ({G, tilt, trig, k = 1, glow = 0}) => {
  const base = add(G, {x: 0, y: BASE_DY});
  const top = gripAt(G, tilt);
  const a = tilt;
  const d = {x: -Math.sin((a * Math.PI) / 180), y: -Math.cos((a * Math.PI) / 180)};
  const gTop = add(top, mul(d, 40 * k));
  return (
    <g>
      <ellipse cx={f(base.x)} cy={f(base.y + 6)} rx={70 * k} ry={22 * k} fill="#1C232A" />
      <path d={`M${f(base.x - 56 * k)} ${f(base.y + 4)} A ${56 * k} ${44 * k} 0 0 1 ${f(base.x + 56 * k)} ${f(base.y + 4)} Z`} fill="url(#c-dome)" stroke={INK} strokeWidth={3} />
      {glow > 0 && <path d={`M${f(base.x - 56 * k)} ${f(base.y + 4)} A ${56 * k} ${44 * k} 0 0 1 ${f(base.x + 56 * k)} ${f(base.y + 4)} Z`} fill="#46CFFF" opacity={glow * 0.5} />}
      <IP d={slab(add(base, {x: 0, y: -20}), top, 9 * k, 8 * k)} fill="#9AA7B2" ink={2.5} />
      <IP d={slab(add(top, mul(d, -26 * k)), gTop, 21 * k, 18 * k)} fill="url(#c-grip)" ink={3} />
      {/* trigger on the grip's front (screen-left) */}
      <IP d={slab(add(add(top, mul(d, -2 * k)), {x: -20 * k + trig * 6, y: 0}), add(add(top, mul(d, 22 * k)), {x: -24 * k + trig * 8, y: 0}), 5 * k, 5 * k)} fill="#EE7A26" ink={2} />
      <path d={circ(add(gTop, mul(d, 6 * k)), 7 * k)} fill="#EE7A26" stroke={INK} strokeWidth={2} />
    </g>
  );
};

const SEATED: ManPose = {
  x: 0, y: 0, s: 0.82, torso: 9, chest: 6, neck: -6, turn: 0.5, pelvis: 0,
  lTu: -300, lTv: -60, lWx: 0, lWy: 0, lW: 1, lElb: 1, lWr: 4,
  rTu: -300, rTv: -30, rWx: 0, rWy: 0, rW: 1, rElb: 1, rWr: 4,
  lHip: 82, lKnee: 84, lAnk: 0, rHip: 80, rKnee: 84, rAnk: 0, lFs: 0.8, lFsh: 1, rFs: 0.8, rFsh: 1, breath: 0.3,
};
const HEAD: V = {x: 1388, y: 300};
export const HOLD: HandPose = {curl: [0.55, 0.6, 0.64, 0.68], spread: 0.25, thumb: 30, thumbCurl: 0.45};

export const operatorPose = (t: number) => {
  const c = controls(t);
  const gl = gripAt(GRIP_L, c.tiltL);
  const gr = gripAt(GRIP_R, c.tiltR);
  const breath = 0.3 + 0.2 * Math.sin(t * 1.6);
  const lean = keys(t, [[0, 0], [tt.cameras, 0], [tt.cameras + 0.8, 3], [tt.looks, 3], [tt.japan2, 2]]);
  const p0: ManPose = {...SEATED, torso: SEATED.torso + lean, lWx: gl.x + 6, lWy: gl.y + 34, rWx: gr.x + 6, rWy: gr.y + 34, breath};
  const j0 = manJoints({...p0, x: 0, y: 0});
  return {...p0, x: HEAD.x - j0.head.x, y: HEAD.y - j0.head.y};
};
export const OP_EXPR: Expr = {...EXPR_NEUTRAL, gx: -0.85, gy: 0.15, smile: 0.12, lid: 0.18};

/** the robot's head-camera view for the monitors: centred between the claw and the saw */
export const feedCam = (t: number): Cam => {
  const s = worksite(t);
  // bilateral: the robot's camera looks at its claw pressing the branch
  if (t > TT.another && t < TT.imagine) return {x: s.g.grip.x + 10, y: s.g.grip.y - 20, z: 2.6};
  const c = {x: (s.g.grip.x + s.g.sawCut.x) / 2, y: (s.g.grip.y + s.g.sawCut.y) / 2 + 20};
  return {x: c.x + 70, y: c.y, z: 3.1};
};

/** a nested view of the worksite inside a rectangle (window or monitor) */
export const WorldView: React.FC<{t: number; cam: Cam; x: number; y: number; w: number; h: number; id: string; lookout?: boolean}> = ({t, cam, x, y, w, h, id}) => (
  <g>
    <clipPath id={id}>
      <rect x={x} y={y} width={w} height={h} rx={10} />
    </clipPath>
    <g clipPath={`url(#${id})`}>
      <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <Worksite t={t} cam={cam} />
      </svg>
    </g>
  </g>
);

export const Cab: React.FC<{t: number; cam: Cam; env?: number; body?: number; feeds?: boolean; desk?: number; deskX0?: number}> = ({t, cam, env = 1, body = 1, feeds = true, desk, deskX0 = -400}) => {
  const c = controls(t);
  const op = operatorPose(t);
  const tr = `translate(${W / 2} ${H / 2}) scale(${cam.z.toFixed(5)}) translate(${f(-cam.x)} ${f(-cam.y)})`;
  // window view: up at the boom and the robot (from the cabin's position on the truck)
  const winCam: Cam = {x: 820, y: -1060, z: 0.62};
  const fc = feedCam(t);
  return (
    <g>
      <CabDefs />
      <g transform={tr}>
        {env > 0 && <g opacity={env}>
          <rect x={-400} y={-300} width={2800} height={1700} fill="url(#c-wall)" />
          {/* window */}
          <rect x={56} y={34} width={960} height={420} rx={18} fill="#22303B" />
          <WorldView t={t} cam={winCam} x={70} y={46} w={932} h={396} id="cab-win" />
          <rect x={70} y={46} width={932} height={396} rx={10} fill="#BFE6F5" opacity={0.12} />
          <path d="M80 60 L260 60 L120 300 Z" fill="#FFFFFF" opacity={0.08} />
          <rect x={56} y={34} width={960} height={420} rx={18} fill="none" stroke={INK} strokeWidth={5} />
          <rect x={530} y={34} width={14} height={420} fill="#3B4754" stroke={INK} strokeWidth={3} />
          {/* monitor bank */}
          <rect x={300} y={470} width={14} height={60} fill="#3B4754" />
          <rect x={760} y={470} width={14} height={60} fill="#3B4754" />
          {[0, 1].map((i) => {
            const mx = 90 + i * 470;
            return (
              <g key={i}>
                <rect x={mx - 10} y={520} width={460} height={262} rx={14} fill="#1B232B" stroke={INK} strokeWidth={4} />
                {feeds && <WorldView t={t} cam={{...fc, x: fc.x + (i ? 6 : -6)}} x={mx} y={530} w={440} h={242} id={`cab-mon${i}`} />}
                <g stroke="#E9F6FF" strokeWidth={3} fill="none" opacity={0.75}>
                  <path d={`M${mx + 14} ${548} l0 -8 l18 0`} transform={`translate(0 0)`} />
                  <path d={`M${mx + 426} ${548} l0 -8 l-18 0`} />
                  <path d={`M${mx + 14} ${756} l0 8 l18 0`} />
                  <path d={`M${mx + 426} ${756} l0 8 l-18 0`} />
                </g>
                <text x={mx + 22} y={570} fill="#E9F6FF" opacity={0.8} style={{font: '700 18px "Nunito Variable"'}}>{i ? 'CAM R' : 'CAM L'}</text>
              </g>
            );
          })}
          {/* seat back behind the operator */}
          <path d="M1430 360 C 1530 360 1560 420 1560 520 L 1560 900 L 1400 900 Z" fill="url(#c-seat)" stroke={INK} strokeWidth={4} />
          <rect x={-400} y={-300} width={2800} height={1700} fill="url(#c-warm)" />
        </g>}
        {/* operator, console, far controller (saw), near controller (claw), hands over the grips */}
        <g opacity={body}>
          <Man id="op" pose={op} expr={OP_EXPR} blink={blinkAt(t)} lHand={HOLD} rHand={HOLD} outfit={OPERATOR} />
        </g>
        <g opacity={desk ?? env}>
          {/* console desk: the operator sits behind it (it hides his legs) */}
          <path d={`M${deskX0} 800 L1440 800 L1470 1400 L${deskX0} 1400 Z`} fill="url(#c-console)" stroke={INK} strokeWidth={4} />
          <path d={`M${deskX0} 800 L1440 800 L1444 822 L${deskX0} 822 Z`} fill="#5F6E7C" />
          {deskX0 < 100 && [0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={160 + i * 70} cy={860} r={12} fill={i === 1 ? '#7CFC9A' : i === 3 ? '#EE7A26' : '#8896A3'} stroke={INK} strokeWidth={2} />
          ))}
          {deskX0 < 500 && <rect x={560} y={845} width={260} height={30} rx={8} fill="#1B232B" />}
        </g>
        <Controller G={GRIP_R} tilt={c.tiltR} trig={c.trigR} />
        <Man id="op-hr" pose={op} expr={OP_EXPR} lHand={HOLD} rHand={HOLD} outfit={OPERATOR} handsOnly handsOnlySide="R" />
        <Controller G={GRIP_L} tilt={c.tiltL} trig={c.trigL} glow={c.felt} />
        {/* the hands drawn again on top of the near grip so the fingers wrap it */}
        <Man id="op-h" pose={op} expr={OP_EXPR} lHand={HOLD} rHand={HOLD} outfit={OPERATOR} handsOnly handsOnlySide="L" />
      </g>
    </g>
  );
};

const blinkAt = (t: number) => {
  const ph = (t * 0.31) % 1;
  return ph < 0.04 ? 1 - Math.abs(ph - 0.02) / 0.02 : 0;
};

export {lerp, clamp, easeInOut, lit, shade, pr, Line, poly};
