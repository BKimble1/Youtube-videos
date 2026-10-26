// Shot C: inside the control shelter. The window shows the site through the same camera as the wide that cuts to it
// (a matched cut on the tower and the bolt); the operator stands at the console in the foreground, completing a turn
// of the acquisition control as her eyes lift to follow the discharge. She is drawn on the rig mirrored so she faces
// the window (screen-right); the window light falls on her from that side.
import React from 'react';
import {Cam} from '../dc/camera';
import {mix} from '../dc/color';
import {Man, ManPose, lerpPose} from '../dc/Man';
import {mixHand} from '../dc/Hand';
import {mixExpr} from '../dc/Head';
import {clamp, fmt, rot, V} from '../dc/math';
import {E_FOCUS, E_TRACK, H_PINCH, H_REST, OPERATOR, P} from '../cast';
import {ss} from '../lib';
import {SiteState, SiteWorld} from './Site';

export const WIN = {x0: 452, y0: 300, x1: 1080, y1: 1200};
/** the knob she turns (screen position in the mirrored rig's space is computed below) */
const KNOB: V = {x: 560, y: 1430};
const MIRROR_X = 540; // mirror line

// rig space (before mirroring): she faces screen-left, so the window is on her front side once mirrored
const mx = (p: V): V => ({x: 2 * MIRROR_X - p.x, y: p.y});
const knobR = mx(KNOB);
const BASE_OP: ManPose = P({x: 820, y: 1520, s: 1.02, torso: 12, chest: 7, neck: -4, turn: 0.55, lW: 1, lWx: knobR.x, lWy: knobR.y - 24, lElb: -1, lWr: -20, rTu: -300, rTv: -80, rElb: 1, rW: 0, lHip: 6, rHip: -6});

export const opPose = (t: number, t0: number): ManPose => {
  const u = t - t0;
  // the hand finishes turning the knob (0.0-0.3 s), stays a moment, then lifts off as she straightens to watch
  const turn = ss(u, -0.2, 0.32);
  const kAng = -50 + 50 * turn;
  const g = rot({x: knobR.x, y: knobR.y - 26}, -kAng, knobR);
  const lift = ss(u, 0.7, 1.15);
  const a: ManPose = {...BASE_OP, lWx: g.x, lWy: g.y, lWr: -20 - kAng * 0.6};
  const b: ManPose = {...BASE_OP, torso: 3, chest: 2, neck: 12, lW: 0.0, lTu: -300, lTv: 40, lWr: -10};
  const p = lerpPose(a, b, lift);
  return {...p, neck: p.neck + 10 * ss(u, 0.15, 0.9)};
};
export const knobAngle = (t: number, t0: number) => -50 + 50 * ss(t - t0, -0.2, 0.32);

export const InteriorScene: React.FC<{t: number; t0: number; siteCam: Cam; st: SiteState; drift: number}> = ({t, t0, siteCam, st, drift}) => {
  const u = t - t0;
  const p = opPose(t, t0);
  const expr = mixExpr({...E_FOCUS, gx: -0.4, gy: 0.75}, {...E_TRACK, gx: -0.55, gy: -0.85}, ss(u, 0.12, 0.75));
  const hand = mixHand(H_PINCH, H_REST, ss(u, 0.75, 1.1));
  const fl = st.flash;
  const kA = knobAngle(t, t0);
  const wallC = mix('#1B2D33', '#3C4A6E', fl * 0.5);
  return (
    <g>
      {/* the view out of the window: the site through (nearly) the wide's camera */}
      <defs>
        <clipPath id="in-win">
          <rect x={WIN.x0} y={WIN.y0} width={WIN.x1 - WIN.x0} height={WIN.y1 - WIN.y0} />
        </clipPath>
        <radialGradient id="in-light" gradientUnits="userSpaceOnUse" cx={900} cy={600} r={1100}>
          <stop offset="0" stopColor="#C9D2FF" stopOpacity={0.5} />
          <stop offset="1" stopColor="#7E8CD0" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="in-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix('#4A5A62', '#8A96C8', fl * 0.4)} />
          <stop offset="1" stopColor="#1C262C" />
        </linearGradient>
      </defs>
      <g clipPath="url(#in-win)">
        <SiteWorld id="in-site" cam={siteCam} st={st} />
        {/* rain running down the glass */}
        {Array.from({length: 14}, (_, i) => {
          const x = WIN.x0 + 30 + i * 44 + 10 * Math.sin(i * 7);
          const y = WIN.y0 + ((i * 137 + (t + drift) * 140) % (WIN.y1 - WIN.y0));
          return <path key={i} d={`M${fmt(x)},${fmt(y)} q3,30 -1,60`} stroke="#B8C8D8" strokeOpacity={0.35} strokeWidth={3} fill="none" strokeLinecap="round" />;
        })}
        <rect x={WIN.x0} y={WIN.y0} width={WIN.x1 - WIN.x0} height={WIN.y1 - WIN.y0} fill="#8FA4C0" opacity={0.06} />
      </g>
      {/* walls around the window, frame and mullion */}
      <path d={`M0,0 L1080,0 L1080,${WIN.y0} L${WIN.x0},${WIN.y0} L${WIN.x0},${WIN.y1} L1080,${WIN.y1} L1080,1920 L0,1920 Z`} fill={wallC} />
      {[160, 320].map((x) => <line key={x} x1={x} y1={0} x2={x} y2={1920} stroke="#0D181C" strokeOpacity={0.5} strokeWidth={3} />)}
      <rect x={WIN.x0 - 14} y={WIN.y0 - 14} width={WIN.x1 - WIN.x0 + 28} height={WIN.y1 - WIN.y0 + 28} fill="none" stroke="#2C3C42" strokeWidth={28} />
      <rect x={WIN.x0 - 14} y={WIN.y0 - 14} width={WIN.x1 - WIN.x0 + 28} height={WIN.y1 - WIN.y0 + 28} fill="none" stroke="#0B151C" strokeWidth={3} />
      <line x1={WIN.x0} y1={WIN.y0 + 470} x2={WIN.x1} y2={WIN.y0 + 470} stroke="#2C3C42" strokeWidth={16} />
      {/* a ceiling lamp glow, warm */}
      <ellipse cx={200} cy={0} rx={300} ry={120} fill="#E8B46A" opacity={0.18} />
      {/* the operator (mirrored), lit from the window */}
      <g transform={`translate(${2 * MIRROR_X} 0) scale(-1 1)`}>
        <Man id="op" pose={p} expr={expr} lHand={hand} rHand={H_REST} outfit={OPERATOR} />
      </g>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#in-light)" opacity={0.25 + 0.75 * fl} style={{mixBlendMode: 'screen'}} />
      {/* the console in the foreground: a slanted desk with controls (no readable text) */}
      <path d="M-20,1400 L1100,1360 L1100,1920 L-20,1920 Z" fill="url(#in-desk)" stroke="#0B151C" strokeWidth={4} />
      <path d="M-20,1400 L1100,1360 L1100,1384 L-20,1424 Z" fill={mix('#6E7E86', '#B0BAE6', fl * 0.5)} />
      {/* screen with a live trace */}
      <g>
        <rect x={700} y={1450} width={300} height={170} rx={10} fill="#0E1A20" stroke="#0B151C" strokeWidth={4} />
        <path d={Array.from({length: 40}, (_, i) => `${i ? 'L' : 'M'}${fmt(714 + i * 7)},${fmt(1560 - 40 * clamp(fl * 1.2) * Math.abs(Math.sin(i * 1.7 + t * 9)) - 8 * Math.sin(i * 0.6 + t * 4))}`).join(' ')} fill="none" stroke="#5BF0C8" strokeWidth={3} />
      </g>
      {/* indicator lights and toggles */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <circle cx={150 + i * 56} cy={1520} r={12} fill={i === 1 ? '#5BF08A' : i === 3 ? '#F0B85B' : '#2E4A3C'} stroke="#0B151C" strokeWidth={3} />
          <rect x={138 + i * 56} y={1570} width={24} height={44} rx={6} fill="#B9C3CA" stroke="#0B151C" strokeWidth={3} />
        </g>
      ))}
      {/* the knob she turns (a pointer cap), with its scale ticks */}
      <g>
        {[-60, -40, -20, 0, 20, 40, 60].map((a) => {
          const p0 = rot({x: KNOB.x, y: KNOB.y - 62}, a, KNOB), p1 = rot({x: KNOB.x, y: KNOB.y - 76}, a, KNOB);
          return <line key={a} x1={fmt(p0.x)} y1={fmt(p0.y)} x2={fmt(p1.x)} y2={fmt(p1.y)} stroke="#C9D0D6" strokeWidth={4} />;
        })}
        <circle cx={KNOB.x} cy={KNOB.y} r={52} fill="#2A363E" stroke="#0B151C" strokeWidth={4} />
        <g transform={`rotate(${fmt(kA)} ${KNOB.x} ${KNOB.y})`}>
          <circle cx={KNOB.x} cy={KNOB.y} r={40} fill="#C9D0D6" stroke="#0B151C" strokeWidth={4} />
          <rect x={KNOB.x - 7} y={KNOB.y - 44} width={14} height={40} rx={5} fill="#E2B33C" stroke="#0B151C" strokeWidth={3} />
        </g>
      </g>
      {/* her near forearm and hand are drawn again over the desk edge (clipped to the arm's region) while she
          reaches the knob, so the arm stays whole in front of the console */}
      <defs>
        <clipPath id="in-arm">
          <rect x={400} y={1240} width={320} height={260} />
        </clipPath>
      </defs>
      <g clipPath="url(#in-arm)">
        <g transform={`translate(${2 * MIRROR_X} 0) scale(-1 1)`}>
          <Man id="opa" pose={p} expr={expr} lHand={hand} rHand={H_REST} outfit={OPERATOR} />
        </g>
      </g>
    </g>
  );
};
