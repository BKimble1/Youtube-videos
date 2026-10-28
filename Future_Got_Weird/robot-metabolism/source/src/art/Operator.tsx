// The operator station, at the end of the same bench: the Weird Crew's guesser (his existing rig, dc/Man, unchanged)
// at a keyboard, watching a monitor that carries the live bench camera. His key presses drive the robot; the feed
// shows the response in the same moment (the bench world is a pure function of time, so the feed is the same robot).
import React from 'react';
import {Expr, EXPR_NEUTRAL} from '../dc/Head';
import {GUESSER, Man, manJoints, ManPose} from '../dc/Man';
import {HAND_RELAXED, HandPose} from '../dc/Hand';
import {INK} from '../dc/ink';
import {lit, shade} from '../dc/color';
import {Scene3D} from '../Scene3D';
import {benchState} from '../world/bench';
import {benchItems} from '../world/benchView';
import {Cam} from '../lib/r3';
import {ss} from '../lib/v3';

const SEAT: ManPose = {
  x: 0, y: 0, s: 1, torso: 9, chest: 6, neck: -2, turn: 0.55, pelvis: 0,
  lTu: -340, lTv: -60, lWx: 0, lWy: 0, lW: 1, lElb: 1, lWr: 8,
  rTu: -340, rTv: -30, rWx: 0, rWy: 0, rW: 1, rElb: 1, rWr: 8,
  lHip: 80, lKnee: 80, lAnk: 0, rHip: 80, rKnee: 80, rAnk: 0, lFs: 1, lFsh: 1, rFs: 1, rFsh: 1, breath: 0.3,
};
const FOCUS: Expr = {...EXPR_NEUTRAL, smile: 0.12, lid: 0.2, squint: 0.12, browIn: 0.35, browDown: 0.1, gx: -0.8, gy: 0.12, flush: 0.12};
const PRESS: HandPose = {curl: [0.38, 0.3, 0.34, 0.38], spread: 0.3, thumb: 20, thumbCurl: 0.4};

const placePose = (hx: number, hy: number, s: number, pose: Partial<ManPose>): ManPose => {
  const p0: ManPose = {...SEAT, ...pose, x: 0, y: 0, s};
  const j = manJoints(p0);
  return {...p0, x: hx - j.head.x, y: hy - j.head.y};
};

// desk geometry (screen px)
const DESK_TOP = 1330;
const DESK_FRONT = 1392;
const MON = {x: 70, y: 620, w: 600, h: 360};

/** the camera the monitor shows: the bench from the operator's side (the shot after this one opens on it) */
export const FEED_CAM = (t: number): Cam => ({eye: {x: -0.2, y: 0.42, z: 0.95}, target: {x: 0.12, y: 0.1, z: 0.0}, f: 1350 - 0 * t, ox: 0, oy: 0});

export const Operator: React.FC<{t: number; keyT: number[]}> = ({t, keyT}) => {
  // a key press: the right index finger and wrist go down for ~0.18 s
  const press = Math.max(0, ...keyT.map((k) => Math.max(0, 1 - Math.abs(t - k) / 0.12)));
  const rHand: HandPose = {
    curl: HAND_RELAXED.curl.map((c, i) => c + (PRESS.curl[i] - c) * (i === 0 ? press : press * 0.3)) as HandPose['curl'],
    spread: HAND_RELAXED.spread, thumb: HAND_RELAXED.thumb, thumbCurl: HAND_RELAXED.thumbCurl,
  };
  const breathe = Math.sin(t * 2.1) * 0.5 + 0.5;
  const lean = ss(7.9, 8.6, t) * 2;
  const pose = placePose(785, 760, 1.08, {
    lWx: 505, lWy: DESK_TOP - 18, rWx: 640, rWy: DESK_TOP - 22 + press * 7,
    torso: 9 + lean, breath: 0.3 + breathe * 0.2,
  });
  const s = benchState(t);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      {/* wall and panel */}
      <rect x={0} y={0} width={1080} height={1920} fill="#F2E8D5" />
      <rect x={0} y={1010} width={1080} height={400} fill="#8DB3AC" />
      <rect x={0} y={1004} width={1080} height={12} fill="#76A097" />
      {/* a pin board behind him with test sheets */}
      <rect x={720} y={180} width={300} height={240} rx={8} fill="#D8B98E" stroke={INK} strokeWidth={4} />
      {[[745, 205, 110, 140, '#FFFFFF'], [870, 215, 125, 90, '#FFF4D8'], [880, 320, 110, 80, '#FFFFFF']].map(([x, y, w, h, c], i) => (
        <g key={i}>
          <rect x={x as number} y={y as number} width={w as number} height={h as number} fill={c as string} stroke={INK} strokeWidth={3} />
          {[0, 1, 2, 3].map((k) => <line key={k} x1={(x as number) + 12} x2={(x as number) + (w as number) - 14} y1={(y as number) + 22 + k * 20} y2={(y as number) + 22 + k * 20} stroke="#B9C6CF" strokeWidth={4} />)}
          <circle cx={(x as number) + (w as number) / 2} cy={(y as number) + 6} r={6} fill="#E26D5A" stroke={INK} strokeWidth={2} />
        </g>
      ))}
      {/* the operator (clipped at the desk top: he sits behind the desk) */}
      <defs>
        <clipPath id="opclip">
          <rect x={0} y={0} width={1080} height={DESK_TOP + 6} />
        </clipPath>
      </defs>
      <g clipPath="url(#opclip)">
        <Man id="op" pose={pose} expr={FOCUS} blink={0} lHand={HAND_RELAXED} rHand={rHand} outfit={GUESSER} />
      </g>
      {/* desk top and front */}
      <path d={`M0 ${DESK_TOP} L1080 ${DESK_TOP} L1080 ${DESK_FRONT} L0 ${DESK_FRONT} Z`} fill="#D29E6A" stroke={INK} strokeWidth={4} />
      <rect x={0} y={DESK_FRONT} width={1080} height={1920 - DESK_FRONT} fill="#B9844F" />
      <line x1={0} x2={1080} y1={DESK_FRONT + 3} y2={DESK_FRONT + 3} stroke={INK} strokeWidth={4} />
      <rect x={0} y={DESK_FRONT + 40} width={1080} height={10} fill={shade('#B9844F', 0.25)} />
      {/* keyboard */}
      <path d={`M420 ${DESK_TOP + 6} L760 ${DESK_TOP + 6} L784 ${DESK_TOP + 40} L398 ${DESK_TOP + 40} Z`} fill="#3A4859" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {[0, 1, 2].map((r) =>
        Array.from({length: 13}, (_, k) => {
          const y = DESK_TOP + 11 + r * 9.5;
          const x0 = 428 - r * 7 + k * 26.5 + r * 0.5;
          const lit2 = press > 0.3 && r === 1 && k === 9;
          return <rect key={`${r}-${k}`} x={x0} y={y} width={21} height={7} rx={2} fill={lit2 ? '#FFD84A' : '#5C6E82'} />;
        }),
      )}
      {/* the monitor: stand, bezel, live feed */}
      <rect x={MON.x + MON.w / 2 - 22} y={MON.y + MON.h + 14} width={44} height={DESK_TOP - (MON.y + MON.h + 14)} fill="#4C5D72" stroke={INK} strokeWidth={4} />
      <path d={`M${MON.x + MON.w / 2 - 90} ${DESK_TOP + 2} L${MON.x + MON.w / 2 + 90} ${DESK_TOP + 2} L${MON.x + MON.w / 2 + 70} ${DESK_TOP - 12} L${MON.x + MON.w / 2 - 70} ${DESK_TOP - 12} Z`} fill="#3A4859" stroke={INK} strokeWidth={4} />
      <rect x={MON.x - 16} y={MON.y - 16} width={MON.w + 32} height={MON.h + 32} rx={14} fill="#2A3744" stroke={INK} strokeWidth={5} />
      <svg x={MON.x} y={MON.y} width={MON.w} height={MON.h} viewBox={`0 ${960 - 540} 1080 1080`} preserveAspectRatio="xMidYMid slice">
        <Scene3D cam={FEED_CAM(t)} build={(P) => benchItems(P, s)} idp="mon" />
      </svg>
      <rect x={MON.x} y={MON.y} width={MON.w} height={MON.h} fill="none" stroke={lit('#2A3744', 0.2)} strokeWidth={3} />
      <circle cx={MON.x + MON.w - 10} cy={MON.y + MON.h + 6} r={4} fill="#45E38E" />
      {/* a mug */}
      <path d={`M880 ${DESK_TOP - 70} L960 ${DESK_TOP - 70} L954 ${DESK_TOP + 4} L886 ${DESK_TOP + 4} Z`} fill="#E26D5A" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M958 ${DESK_TOP - 56} q34 4 30 28 q-4 20 -34 18`} fill="none" stroke={INK} strokeWidth={4} />
    </svg>
  );
};
