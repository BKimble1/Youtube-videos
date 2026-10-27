// E2 (655-679, "beneath collapsed"): low behind the medic at the wedge-shaped opening under the fallen slab (E1's
// slab, now close: its broken front face runs diagonally down to the right). A gloved hand (the operator's light blue
// glove and white sleeve) rests flat on the floor at the right where it has just set the insect down: the fingers alone
// are as long as the opening is high, too small for a person. The camera follows the insect in: the slab's lip, the
// propping block and the hand open out past the frame (nearer layers faster) while the medic walks on into the dark;
// the daylight behind falls off.
import React from 'react';
import {poseRoach, straightPath, RoachPose} from '../../../../rig/roach';
import {Roach2D} from '../../../roach/Roach2D';
import {Gear2D} from '../../../roach/Gear2D';
import {viewAt} from '../../../roach/ortho';
import {Layer, Cam} from '../../../dc/camera';
import {smoother, clamp, sr} from '../../../../lib/ease';
import {INK} from '../../../../lib/ink';
import {mix} from '../../../../lib/color';
import {RB, Pt, Slab, Rebar, Pebbles, Glow2, Motes, Shaft, jag, poly, f2} from '../art';
import {GloveArm} from '../../b/common';
import {HAND_RELAXED} from '../../../dc/Hand';
import {ShotProps} from '../../index2';
import {idf, FPS} from './kit';

export const E2_N = 25;
/** where the camera goes: the gap under the slab, at the insect's level (start-frame px) */
const G = {x: 560, y: 1340};
const Z1 = 3.4;
export const e2U = (lf: number) => smoother(clamp((lf + 3) / (E2_N + 1)));
export const e2Cam = (lf: number): Cam => {
  const u = e2U(lf);
  // zoom in log space so the forward move reads at an even rate
  const z = Math.exp(Math.log(Z1) * u);
  const w = (1 - 1 / z) / (1 - 1 / Z1);
  return {x: 540 + (G.x - 540) * w, y: 960 + (G.y - 960) * w, z};
};
const D_IN = 4, D_SLAB = 0.95, D_NEAR = 0.42;

// ---------------------------------------------------------------- the medic (screen space; the camera trails it)
const V_MM = 52;
export const e2Pose = (lf: number): RoachPose => {
  const t = lf / FPS;
  return poseRoach({path: straightPath([0, 0, 0], 0), s: 70 + V_MM * t, t: t + 21.8, search: 0.6, antL: {yaw: 0.42, pitch: 0.3}, antR: {yaw: 0.4, pitch: 0.32}, seed: 5});
};
const e2View = (lf: number, pose: RoachPose) => {
  const u = e2U(lf);
  return viewAt(-80, 15, 3.7 - 0.5 * u, [pose.frame.o[0], 0, 0], E2_AT.x, E2_AT.y - 60 * u);
};

/** the slab's underside edge (start-frame px) */
const UND = (x: number) => 1010 + 0.3 * x;
const T = 190; // its broken front face
/** the gap under its lip: where the floor runs in (px below the lip) */
const FLOOR = 205;
/** the insect's ground point on screen at the start */
export const E2_AT = {x: 548, y: 1392};

const Inside: React.FC<{id: string; t: number}> = ({id, t}) => (
  <g>
    <rect x={-1500} y={-1500} width={4000} height={5000} fill="#14100E" />
    {/* the passage beyond (seen once the lip is overhead): a low ceiling, rubble walls closing in, a gritty floor
        and, far in, a thin shaft of daylight through a crack, dust turning in it */}
    <path d={poly(jag([[-400, 990], [1500, 975], [1500, 1700], [-400, 1700]], 10, 201, 40))} fill="#3A322C" />
    <Glow2 id={`${id}-fl`} cx={640} cy={1010} rx={420} ry={110} color={RB.day} a={0.22} />
    <Slab id={`${id}-wl`} face={jag([[-400, 820], [330, 900], [470, 980], [420, 1060], [-400, 1200]], 8, 203, 40)} tone={RB.concDark} w={4} dark={0.6} specks={8} />
    <Slab id={`${id}-wr`} face={jag([[1500, 840], [880, 910], [790, 975], [850, 1050], [1500, 1180]], 8, 204, 40)} tone={RB.conc} w={4} dark={0.64} specks={8} />
    <Shaft id={`${id}-sh`} pts={[[690, 520], [760, 520], [710, 1015], [590, 1015]]} from={[720, 520]} to={[650, 1010]} a={0.85} />
    <Motes id={`${id}-mo`} t={t} n={14} x0={590} y0={600} x1={760} y1={1000} r={2.6} seed={206} clip={poly([[690, 560], [750, 560], [700, 1010], [600, 1010]])} />
    <Glow2 id={`${id}-sp`} cx={650} cy={1004} rx={110} ry={22} color={RB.dayHot} a={0.8} />
    <Pebbles id={`${id}-fp`} a={[420, 1040]} b={[820, 1035]} n={8} size={8} seed={205} tone={RB.concDark} dark={0.5} />
  </g>
);

const SlabFront: React.FC<{id: string}> = ({id}) => {
  const L = -500, R = 1600;
  const lower: Pt[] = jag([[L, UND(L)], [R, UND(R)]], 10, 211, 50, false);
  const upper: Pt[] = jag([[L, UND(L) - T], [R, UND(R) - T - 20]], 10, 212, 50, false);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-fl`} x1="0" y1="1250" x2="0" y2="1920" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5E554D" />
          <stop offset="0.45" stopColor="#A2937F" />
          <stop offset="1" stopColor="#C2B39E" />
        </linearGradient>
      </defs>
      {/* the floor in front of the slab (lit by the daylight behind the camera), running in under it */}
      <path d={poly([[L, UND(L) + FLOOR], [R, UND(R) + FLOOR], [R, 2700], [L, 2700]])} fill={`url(#${id}-fl)`} />
      <path d={`M120,${UND(120) + FLOOR + 60} L260,${UND(260) + FLOOR + 90} L300,${UND(300) + FLOOR + 160}`} stroke="#6A5F55" strokeWidth={3} fill="none" opacity={0.7} />
      <path d={`M760,${UND(760) + FLOOR + 40} L700,${UND(700) + FLOOR + 120}`} stroke="#6A5F55" strokeWidth={3} fill="none" opacity={0.7} />
      <Pebbles id={`${id}-p4`} a={[200, UND(200) + FLOOR + 70]} b={[900, UND(900) + FLOOR + 50]} n={10} size={6} seed={216} tone={RB.concLit} dark={0.25} />
      <Pebbles id={`${id}-p5`} a={[100, UND(100) + FLOOR + 170]} b={[1000, UND(1000) + FLOOR + 130]} n={8} size={9} seed={217} tone={RB.conc} dark={0.2} />
      <Pebbles id={`${id}-p3`} a={[300, UND(300) + FLOOR + 6]} b={[1000, UND(1000) + FLOOR + 6]} n={9} size={9} seed={215} tone={RB.concLit} dark={0.35} />
      {/* the underside going in: a dark ceiling band (seen when the lip has passed overhead) */}
      <path d={poly([[L, UND(L) - 4], [R, UND(R) - 4], [R, UND(R) + 60], [L, UND(L) + 60]])} fill="#231E1B" />
      <Slab id={`${id}-sf`} face={[...upper, ...lower.slice().reverse()]} tone={RB.conc} w={6} dark={0.28} specks={40} topTone={RB.concLit}
        cracks={[[[180, 920], [220, 1010], [205, 1060]], [[760, 1060], [800, 1150], [790, 1220]]]}
        rim={upper} />
      <Slab id={`${id}-st`} face={[[L, -1600], [R, -1600], ...upper.slice().reverse()]} tone={mix(RB.concLit, RB.day, 0.3)} w={6} dark={0.02} specks={50}
        cracks={[[[60, 700], [140, 760], [170, 860]], [[640, 520], [700, 640], [760, 700]], [[300, 300], [330, 420]]]} />
      <Glow2 id={`${id}-sun`} cx={160} cy={300} rx={700} ry={500} color={RB.dayHot} a={0.45} />
      <Rebar pts={[[330, UND(330) - 6], [350, UND(330) + 50], [330, UND(330) + 90]]} w={10} dark={0.4} />
      <Rebar pts={[[900, UND(900) - 6], [880, UND(900) + 40], [920, UND(900) + 70]]} w={10} dark={0.4} />
      {/* the propping block at the left */}
      <Slab id={`${id}-bl`} face={jag([[L, UND(L) - 20], [110, UND(110) - 4], [150, 1500], [L, 1560]], 10, 214, 50)} tone={RB.concDark} w={6} dark={0.3} specks={20} rim={[[110, UND(110)], [150, 1500]]} rimColor={mix(RB.day, RB.concLit, 0.4)} />
    </g>
  );
};

const Near: React.FC<{id: string; t: number}> = ({id, t}) => (
  <g>
    {/* the floor in front of the slab, lit by the daylight behind the camera */}
    <defs>
      <linearGradient id={`${id}-fl`} x1="0" y1="1380" x2="0" y2="1920" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#6F655C" />
        <stop offset="0.5" stopColor="#A89A88" />
        <stop offset="1" stopColor="#C2B39E" />
      </linearGradient>
    </defs>
    <Glow2 id={`${id}-pool`} cx={560} cy={1700} rx={620} ry={260} color={RB.dayHot} a={0.3} />
    <Pebbles id={`${id}-p0`} a={[-80, 1560]} b={[300, 1700]} n={8} size={22} seed={222} tone={RB.concLit} />
    <Pebbles id={`${id}-p1`} a={[180, 1840]} b={[520, 1900]} n={5} size={30} seed={223} tone={RB.conc} />
    <Pebbles id={`${id}-p2`} a={[380, 1470]} b={[740, 1460]} n={7} size={12} seed={224} tone={RB.concLit} />
    {/* the gloved hand that set it down: flat on the floor, fingers toward the opening */}
    <GloveArm id={`${id}-ga`} a={{wrist: {x: 1190, y: 1770}, ang: -162, L: 600, ts: 1, pose: {...HAND_RELAXED, spread: 0.3}, fore: 14}} ink={11} shadow={{alpha: 0.32, offset: {x: 18, y: 34}}} />
    <Motes id={`${id}-m`} t={t} n={16} x0={-100} y0={900} x1={1200} y1={1800} r={4.5} seed={225} a={0.55} />
  </g>
);

export const E2: React.FC<ShotProps> = ({f, lf}) => {
  const id = idf('e3b', f);
  const t = lf / FPS;
  const cam = e2Cam(lf);
  const u = e2U(lf);
  const pose = e2Pose(lf);
  const v = e2View(lf, pose);
  // the light falls off: the daylight behind is cut off as the lip passes overhead
  const dark = 0.62 * sr(u, 0.35, 1);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Layer cam={cam} depth={D_IN}>
        <Inside id={`${id}i`} t={t} />
      </Layer>
      <Layer cam={cam} depth={D_SLAB}>
        <SlabFront id={`${id}s`} />
      </Layer>
      <Layer cam={cam} depth={D_NEAR}>
        <Near id={`${id}n`} t={t} />
      </Layer>
      <defs>
        <radialGradient id={`${id}-dk`} cx="0.5" cy="0.66" r="0.7">
          <stop offset="0" stopColor="#0A0807" stopOpacity={dark * 0.55} />
          <stop offset="1" stopColor="#0A0807" stopOpacity={dark} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${id}-dk)`} />
      <Roach2D pose={pose} v={v} o={{id: `${id}-r`, gear: <Gear2D id={`${id}-g`} v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
      <rect x={0} y={0} width={1080} height={1920} fill="#0A0807" opacity={(dark * 0.45).toFixed(3)} />
      {/* the last of the daylight on its back */}
      <Glow2 id={`${id}-rim`} cx={E2_AT.x} cy={E2_AT.y - 40 - 60 * u} rx={220} ry={120} color={RB.day} a={0.16 * (1 - u)} />
    </svg>
  );
};
void f2;
void INK;
