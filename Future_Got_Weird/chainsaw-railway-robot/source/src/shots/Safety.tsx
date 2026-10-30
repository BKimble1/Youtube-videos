// Why it matters: maintenance high above an electrified line (ORIGINAL ILLUSTRATION, a different and generic place,
// not the Koumi Line, which is not electrified). Calm and non-sensational: no contact with live equipment and no
// accident is shown. Then the same job is done by the machine while its operator stays in the cabin at ground level.
import React from 'react';
import {add, clamp, easeIn, easeInOut, easeOut, lerp, mul, V} from '../dc/math';
import {keys, pr, pulse, zkeys, H, W, hash} from '../lib/core';
import {TT} from '../lib/timeline';
import {circ, f, INK, IP, Line, poly, slab} from '../lib/draw';
import {Backdrop, Cam, Layer, Track, WorldDefs} from '../art/World';
import {Machine, MachineDefs, MachinePose, Truck} from '../art/Machine';
import {Man, manJoints, ManPose} from '../dc/Man';
import {EXPR_NEUTRAL} from '../dc/Head';
import {HAND_CLUTCH, HAND_RELAXED} from '../dc/Hand';
import {WORKER} from './Worksite';

const tt = TT;
const MASTS = [-1400, 400, 2200];
const CW = -560; // contact wire height
const MW = -700; // messenger wire
const BRACKET: V = {x: 400, y: -640};

const Mast: React.FC<{x: number}> = ({x}) => (
  <g>
    <IP d={poly([{x: x - 16, y: -10}, {x: x + 16, y: -10}, {x: x + 12, y: -860}, {x: x - 12, y: -860}])} fill="url(#m-steel)" ink={3} />
    {Array.from({length: 14}, (_, i) => <Line key={i} a={{x: x - 12, y: -40 - i * 58}} b={{x: x + 12, y: -70 - i * 58}} w={2} c="#6E7B86" />)}
    {/* cantilever bracket toward the track (screen-right), insulators at the mast end */}
    <Line a={{x: x + 10, y: -780}} b={{x: x + 260, y: MW}} w={7} c="#5B6670" />
    <Line a={{x: x + 10, y: -620}} b={{x: x + 260, y: CW - 20}} w={7} c="#5B6670" />
    {[0, 1, 2, 3].map((i) => (
      <ellipse key={i} cx={x + 28 + i * 10} cy={-780 + i * 4} rx={6} ry={14} fill="#B5643B" stroke={INK} strokeWidth={2} />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <ellipse key={`b${i}`} cx={x + 28 + i * 10} cy={-620 + i * 1.5} rx={6} ry={14} fill="#B5643B" stroke={INK} strokeWidth={2} />
    ))}
    <Line a={{x: x + 260, y: MW}} b={{x: x + 260, y: CW}} w={3} c="#5B6670" />
  </g>
);

const standing = (s: number): ManPose => ({
  x: 0, y: 0, s, torso: 4, chest: 2, neck: -8, turn: -0.35, pelvis: 0,
  lTu: 200, lTv: -30, lWx: 0, lWy: 0, lW: 0, lElb: 1, lWr: 0,
  rTu: 200, rTv: 20, rWx: 0, rWy: 0, rW: 0, rElb: 1, rWr: 0,
  lHip: 4, lKnee: 4, lAnk: 0, rHip: -4, rKnee: 2, rAnk: 0, lFs: 1, lFsh: 1, rFs: 1, rFsh: 1, breath: 0.3,
});
const placeFeet = (p: ManPose, foot: V) => {
  const j = manJoints({...p, x: 0, y: 0});
  const low = Math.max(j.lLeg.A.y, j.rLeg.A.y);
  return {...p, x: foot.x - j.H.x, y: foot.y - low - 10};
};

export const safetyCam = (t: number): Cam => ({
  x: keys(t, [[tt.stunt, 600], [tt.workers, 500], [tt.high + 0.6, 560], [tt.overhead + 0.6, 640], [tt.climbing, -1100], [tt.climbing + 0.9, -1150], [tt.tools, 480], [tt.fall + 0.4, 560], [tt.moving, 300], [tt.moving + 1.8, 120], [tt.reason, 160]]),
  y: keys(t, [[tt.stunt, -420], [tt.workers, -360], [tt.high + 0.6, -560], [tt.overhead + 0.6, -620], [tt.climbing, -420], [tt.climbing + 0.9, -440], [tt.tools, -560], [tt.fall + 0.4, -380], [tt.moving, -420], [tt.moving + 1.8, -440], [tt.reason, -440]]),
  z: zkeys(t, [[tt.stunt, 0.62], [tt.workers, 0.9], [tt.high + 0.6, 1.5], [tt.overhead + 0.6, 2.0], [tt.climbing, 1.2], [tt.climbing + 0.9, 1.25], [tt.tools, 1.6], [tt.fall + 0.4, 1.05], [tt.moving, 0.9], [tt.moving + 1.8, 0.68], [tt.reason, 0.66]]),
});

export const Safety: React.FC<{t: number}> = ({t}) => {
  const cam = safetyCam(t);
  const ghost = 1 - pr(t, tt.moving, tt.moving + 0.9);
  // work platform vehicle (left) with a raised deck at bracket height
  const deckY = -420;
  const deckX0 = 120;
  const deckX1 = 330;
  // worker on the platform, reaching up to the bracket; heavy fitting in the hands during "tools"
  const lift = pr(t, tt.tools, tt.tools + 0.8);
  const wp0 = standing(0.2);
  const reachUp = {...wp0, lW: 1, rW: 1, lWx: BRACKET.x - 10, lWy: lerp(BRACKET.y + 30, BRACKET.y + 70, lift), rWx: BRACKET.x - 40, rWy: lerp(BRACKET.y + 40, BRACKET.y + 80, lift), lElb: -1, rElb: -1, turn: -0.6, neck: -18};
  const worker = placeFeet(reachUp, {x: 300, y: deckY});
  // climber on the far mast ladder (climbing)
  const climb = pr(t, tt.climbing - 0.4, tt.climbing + 1.2);
  const climbY = lerp(-60, -280, climb);
  const cp0 = {...standing(0.2), lW: 1, rW: 1, lWx: -1440, lWy: climbY - 160 + Math.sin(t * 4) * 6, rWx: -1430, rWy: climbY - 120 - Math.sin(t * 4) * 6, lHip: 30, lKnee: 50, rHip: -10, rKnee: 20, turn: 0.2};
  const climber = placeFeet(cp0, {x: -1410, y: climbY});
  // the falling fitting: dashed path from the bracket to the track
  const fo = pulse(t, tt.fall - 0.1, tt.fall + 0.3, tt.moving - 0.2, tt.moving + 0.4);
  const fu = pr(t, tt.fall + 0.1, tt.fall + 1.0, easeIn);
  const fp = {x: BRACKET.x + 30 + fu * 60, y: lerp(BRACKET.y + 30, -14, fu)};
  // clearance zone round the live equipment
  const zone = pr(t, tt.overhead, tt.overhead + 0.8) * (1 - 0.6 * pr(t, tt.moving, tt.moving + 1));
  // the machine takes over: truck rolls in on the rails, the arm reaches the same bracket
  const mIn = pr(t, tt.moving - 0.4, tt.moving + 1.6, easeOut);
  const mx = lerp(-2600, -1100, mIn);
  const reachT = pr(t, tt.moving + 1.2, tt.risk);
  const mpose: MachinePose = {
    x: mx, b1: lerp(20, 32, reachT), b2: lerp(-10, 2, reachT), l2: lerp(520, 640, reachT),
    claw: {w: {x: lerp(mx + 1100, BRACKET.x - 60, reachT), y: lerp(-420, BRACKET.y + 10, reachT)}, a: -20, side: -1},
    saw: {w: {x: mx + 1000, y: -380}, a: 70, side: -1},
    open: lerp(0.8, 0.45, pr(t, tt.risk - 0.4, tt.risk + 0.2)), squeeze: 0, run: 0, chain: 0, head: 0, shake: 0,
  };
  const distO = pr(t, tt.risk - 0.2, tt.risk + 0.5);
  const cabPt = {x: mx + 271, y: -262};
  return (
    <g>
      <defs>
        <WorldDefs />
        <MachineDefs />
      </defs>
      <Backdrop cam={cam} t={t} />
      <Layer cam={cam}>
        <Track />
        {MASTS.map((x) => <Mast key={x} x={x} />)}
        {/* wires */}
        <path d={`M-4000 ${MW} Q ${MASTS[0] + 900} ${MW + 40} ${MASTS[1] + 260} ${MW} Q ${MASTS[1] + 1160} ${MW + 40} ${MASTS[2] + 260} ${MW} L 6000 ${MW}`} fill="none" stroke="#3B4650" strokeWidth={4} />
        <path d={`M-4000 ${CW} L6000 ${CW}`} stroke="#3B4650" strokeWidth={5} />
        {Array.from({length: 40}, (_, i) => <Line key={i} a={{x: -3800 + i * 240, y: MW + 22 + Math.abs(Math.sin(i)) * 10}} b={{x: -3800 + i * 240, y: CW}} w={2} c="#56616B" />)}
        {zone > 0.001 && <rect x={-4000} y={MW - 80} width={10000} height={CW - MW + 150} rx={60} fill="#F05A4A" opacity={0.1 * zone} stroke="#F05A4A" strokeWidth={4} strokeDasharray="22 16" strokeOpacity={0.6 * zone} />}
        {/* people doing the job by hand (fade out when the machine takes over) */}
        <g opacity={ghost}>
          {/* work platform vehicle */}
          <IP d={poly([{x: -150, y: -60}, {x: 520, y: -60}, {x: 520, y: -150}, {x: -150, y: -150}])} fill="url(#m-truck)" ink={3} />
          {[-60, 420].map((x) => <path key={x} d={circ({x, y: -48}, 36)} fill="#2A2F35" stroke={INK} strokeWidth={3} />)}
          <Line a={{x: 180, y: -150}} b={{x: 200, y: deckY + 20}} w={14} c="#9AA7B2" />
          <Line a={{x: 260, y: -150}} b={{x: 230, y: deckY + 20}} w={14} c="#9AA7B2" />
          <IP d={poly([{x: deckX0, y: deckY}, {x: deckX1, y: deckY}, {x: deckX1, y: deckY + 24}, {x: deckX0, y: deckY + 24}])} fill="url(#m-accent)" ink={3} />
          <path d={`M${deckX0} ${deckY} L${deckX0} ${deckY - 100} L${deckX1} ${deckY - 100} L${deckX1} ${deckY}`} fill="none" stroke="#F2B33A" strokeWidth={6} />
          <Man id="sw" pose={worker} expr={{...EXPR_NEUTRAL, gx: 0.3, gy: -0.8}} lHand={HAND_CLUTCH} rHand={HAND_CLUTCH} outfit={WORKER} />
          {/* heavy fitting in the hands */}
          <g opacity={pulse(t, tt.tools - 0.1, tt.tools + 0.4, tt.fall, tt.fall + 0.1)}>
            <IP d={poly([{x: BRACKET.x - 60, y: BRACKET.y + 50 + lift * 30}, {x: BRACKET.x + 20, y: BRACKET.y + 50 + lift * 30}, {x: BRACKET.x + 20, y: BRACKET.y + 90 + lift * 30}, {x: BRACKET.x - 60, y: BRACKET.y + 90 + lift * 30}])} fill="url(#m-steel)" ink={3} />
          </g>
          {/* ladder on the far mast + climber */}
          <g opacity={pr(t, tt.climbing - 0.6, tt.climbing)}>
            <Line a={{x: -1470, y: -10}} b={{x: -1470, y: -700}} w={5} c="#C9D2DA" />
            <Line a={{x: -1430, y: -10}} b={{x: -1430, y: -700}} w={5} c="#C9D2DA" />
            {Array.from({length: 18}, (_, i) => <Line key={i} a={{x: -1470, y: -30 - i * 38}} b={{x: -1430, y: -30 - i * 38}} w={4} c="#C9D2DA" />)}
            <Man id="climber" pose={climber} expr={{...EXPR_NEUTRAL, gx: 0.2, gy: -0.9}} lHand={HAND_CLUTCH} rHand={HAND_CLUTCH} outfit={WORKER} />
          </g>
        </g>
        {/* the fitting that could fall (illustration of the hazard) */}
        {fo > 0.001 && (
          <g opacity={fo}>
            <path d={`M${BRACKET.x + 30} ${BRACKET.y + 30} Q ${BRACKET.x + 70} ${BRACKET.y + 300} ${BRACKET.x + 90} -14`} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeDasharray="14 12" />
            <rect x={f(fp.x - 18)} y={f(fp.y - 10)} width={36} height={20} rx={4} fill="#9AA7B2" stroke={INK} strokeWidth={3} transform={`rotate(${f(fu * 160)} ${f(fp.x)} ${f(fp.y)})`} />
          </g>
        )}
        {/* the machine doing the job; its operator stays in the cabin on the ground */}
        {mIn > 0.001 && <Machine p={mpose} cabinLight={1} />}
        {distO > 0.001 && (
          <g opacity={distO}>
            <Line a={add(cabPt, {x: 30, y: -10})} b={{x: BRACKET.x - 30, y: BRACKET.y + 40}} w={5} c="#FFFFFF" dash="16 12" />
            <path d={circ(add(cabPt, {x: 30, y: -10}), 14)} fill="#FFFFFF" />
            <path d={circ({x: BRACKET.x - 30, y: BRACKET.y + 40}, 14)} fill="#FFFFFF" />
          </g>
        )}
      </Layer>
    </g>
  );
};

export {hash, H, W, Truck, HAND_RELAXED, easeInOut, mul, slab, clamp};
