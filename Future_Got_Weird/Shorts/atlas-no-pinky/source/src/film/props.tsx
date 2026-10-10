import React from 'react';
import {C, F, OUTLINE, SURF, Shadow} from './common';
import {mix} from '../hand/Hand';

/** Tape: used for the wipe strip and the wrap band. Shared look: Boston-blue tape with sheen and torn ends. */
export const TapeBand: React.FC<{cx: number; cy: number; len: number; h: number; rot: number; o?: number}> = ({cx, cy, len, h, rot, o = 1}) => (
  <g transform={`translate(${cx} ${cy}) rotate(${rot})`} opacity={o}>
    <rect x={-len / 2} y={-h / 2} width={len} height={h} rx={9} fill={C.blue} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={-len / 2 + 8} y={-h / 2 + 7} width={len - 16} height={7} rx={3} fill="#FFFFFF" opacity={0.35} />
    <rect x={-len / 2 + 8} y={h / 2 - 15} width={len - 16} height={5} rx={2} fill={C.blueDeep} opacity={0.5} />
  </g>
);

/** Decision card. Flat on the bench it is foreshortened; `up` (0..1) lifts it to face the viewer about its near edge. */
export const Card: React.FC<{x: number; yb: number; w?: number; h?: number; up: number; children?: React.ReactNode; squash?: number}> = ({x, yb, w = 540, h = 270, up, children, squash = 1}) => {
  const sy = (0.34 + 0.66 * up) * squash;
  return (
    <g transform={`translate(${x} ${yb}) scale(1 ${sy}) translate(0 ${-h})`}>
      <rect x={-w / 2 + 6} y={10} width={w} height={h} rx={22} fill={C.ink} opacity={0.2} />
      <rect x={-w / 2} y={0} width={w} height={h} rx={22} fill={C.white} stroke={C.ink} strokeWidth={OUTLINE + 1} />
      <text x={-w / 2 + 28} y={52} fontFamily={F.body} fontWeight={800} fontSize={40} fill={C.inkSoft}>
        DECISION
      </text>
      {children}
    </g>
  );
};

/** Rubber stamp in the hand's local frame (hand at 0,0). Base bottom sits at y = +BASE_BOTTOM. */
export const STAMP_K = 1.85;
export const STAMP_BASE_BOTTOM = 52;
export const Stamp: React.FC = () => (
  <g transform={`scale(${STAMP_K})`}>
    <rect x={-22} y={-52} width={44} height={22} rx={11} fill={C.woodDeep} stroke={C.ink} strokeWidth={3} />
    <rect x={-13} y={-34} width={26} height={44} rx={6} fill={C.wood} stroke={C.ink} strokeWidth={3} />
    <rect x={-80} y={8} width={160} height={30} rx={8} fill={C.woodDeep} stroke={C.ink} strokeWidth={3} />
    <rect x={-76} y={36} width={152} height={16} rx={5} fill={C.coralDeep} stroke={C.ink} strokeWidth={3} />
  </g>
);

export const Dial: React.FC<{x: number; y: number; r?: number; angle: number; kick?: number}> = ({x, y, r = 64, angle, kick = 0}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r + 8} fill={C.ink} opacity={0.2} cy={7} />
    <circle r={r} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
    {Array.from({length: 12}).map((_, i) => (
      <line key={i} x1={0} y1={-r + 8} x2={0} y2={-r + (i % 3 === 0 ? 24 : 16)} stroke={C.ink} strokeWidth={i % 3 === 0 ? 5 : 3} strokeLinecap="round" transform={`rotate(${i * 30})`} />
    ))}
    <g transform={`rotate(${angle + kick})`}>
      <line x1={0} y1={8} x2={0} y2={-r + 20} stroke={C.coral} strokeWidth={8} strokeLinecap="round" />
    </g>
    <circle r={9} fill={C.ink} />
  </g>
);

export const Washer: React.FC<{x: number; y: number; r?: number; rot?: number}> = ({x, y, r = 44, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d={`M ${-r} 0 A ${r} ${r} 0 1 0 ${r} 0 A ${r} ${r} 0 1 0 ${-r} 0 Z M ${-r * 0.42} 0 A ${r * 0.42} ${r * 0.42} 0 1 1 ${r * 0.42} 0 A ${r * 0.42} ${r * 0.42} 0 1 1 ${-r * 0.42} 0 Z`} fill={C.blueLight} stroke={C.ink} strokeWidth={5} fillRule="evenodd" />
    <path d={`M ${-r * 0.72} ${-r * 0.2} A ${r * 0.74} ${r * 0.74} 0 0 1 ${-r * 0.2} ${-r * 0.72}`} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.85} />
  </g>
);

/** Compact object with an orientation arrow, so rotation is unmistakable. */
export const Die: React.FC<{x: number; y: number; s?: number; rot: number}> = ({x, y, s = 84, rot}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={14} fill={C.saffron} stroke={C.ink} strokeWidth={5} />
    <path d={`M 0 ${-s * 0.3} L ${s * 0.2} ${s * 0.02} L ${s * 0.07} ${s * 0.02} L ${s * 0.07} ${s * 0.3} L ${-s * 0.07} ${s * 0.3} L ${-s * 0.07} ${s * 0.02} L ${-s * 0.2} ${s * 0.02} Z`} fill={C.coral} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </g>
);

/**
 * Pistol-grip tool in HAND-LOCAL coords (side view, hand pointing right). Handle spans x 52..112, y -68..82 so the palm
 * backs it and the fingers wrap its front. `press` 0..1 depresses the trigger and lights the LED.
 */
export const TOOL = {handleX0: 52, handleX1: 112, handleY0: -68, handleY1: 82, trigX: 112, trigY: -36};
export const Tool: React.FC<{press: number}> = ({press}) => (
  <g>
    {/* body */}
    <rect x={-86} y={-156} width={236} height={90} rx={24} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={150} y={-142} width={52} height={62} rx={10} fill={C.blue} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={202} y={-120} width={44} height={18} rx={6} fill={C.inkMuted} stroke={C.ink} strokeWidth={4} />
    <rect x={-70} y={-146} width={90} height={14} rx={7} fill="#FFFFFF" opacity={0.35} />
    <circle cx={110} cy={-142} r={9} fill={press > 0.5 ? C.saffron : mix(C.coral, C.ink, 0.35)} stroke={C.ink} strokeWidth={3} />
    {/* handle */}
    <rect x={TOOL.handleX0} y={TOOL.handleY0} width={TOOL.handleX1 - TOOL.handleX0} height={TOOL.handleY1 - TOOL.handleY0} rx={18} fill={C.inkSoft} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={TOOL.handleX0 + 8} y={TOOL.handleY0 + 14} width={9} height={TOOL.handleY1 - TOOL.handleY0 - 40} rx={4} fill="#FFFFFF" opacity={0.18} />
    {/* trigger lever pivoting at the top, swings back when pressed */}
    <g transform={`rotate(${-14 * press} ${TOOL.trigX - 4} ${TOOL.trigY - 20})`}>
      <path d={`M ${TOOL.trigX - 6} ${TOOL.trigY - 20} L ${TOOL.trigX + 20} ${TOOL.trigY - 8} L ${TOOL.trigX + 18} ${TOOL.trigY + 34} L ${TOOL.trigX - 6} ${TOOL.trigY + 30} Z`} fill={C.saffron} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    </g>
  </g>
);

export const Mug: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M -65 -58 A 52 52 0 0 0 -65 52" fill="none" stroke={C.ink} strokeWidth={30} strokeLinecap="round" />
    <path d="M -65 -58 A 52 52 0 0 0 -65 52" fill="none" stroke={C.blue} strokeWidth={20} strokeLinecap="round" />
    <rect x={-66} y={-78} width={132} height={132} rx={22} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE + 1} />
    <rect x={-66} y={-34} width={132} height={26} fill={C.blue} stroke={C.ink} strokeWidth={4} />
    <rect x={-66} y={-78} width={132} height={16} rx={8} fill={C.paperDeep} stroke={C.ink} strokeWidth={4} />
  </g>
);

export const Knob: React.FC<{x: number; y: number; turn: number}> = ({x, y, turn}) => {
  // cylinder with ridges that slide as it turns; pointer follows
  const w = 118;
  const sh = (turn / 60) * 24;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2 - 14} y={30} width={w + 28} height={26} rx={8} fill={C.woodDeep} stroke={C.ink} strokeWidth={4} />
      <rect x={-w / 2} y={-86} width={w} height={118} rx={20} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE + 1} />
      <clipPath id="knobclip">
        <rect x={-w / 2} y={-86} width={w} height={118} rx={20} />
      </clipPath>
      <g clipPath="url(#knobclip)" stroke={C.coralDeep} strokeWidth={6}>
        {Array.from({length: 7}).map((_, i) => {
          const px = ((i * 24 + sh + 120) % 168) - 72;
          return <line key={i} x1={px} y1={-80} x2={px} y2={26} />;
        })}
      </g>
      <rect x={-w / 2} y={-86} width={w} height={14} rx={7} fill="#FFFFFF" opacity={0.3} />
      <circle cx={Math.sin((turn * Math.PI) / 180) * 34} cy={-52} r={9} fill={C.cream} stroke={C.ink} strokeWidth={3} />
    </g>
  );
};

export const Tray: React.FC<{x: number; y?: number; w?: number; h?: number; children?: React.ReactNode}> = ({x, y = SURF, w = 470, h = 74, children}) => (
  <g transform={`translate(${x} ${y})`}>
    <Shadow x={0} y={4} rx={w / 2 + 18} />
    {children}
    <path d={`M ${-w / 2} ${-h} L ${w / 2} ${-h} L ${w / 2 - 14} 0 L ${-w / 2 + 14} 0 Z`} fill={C.blueLight} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" opacity={1} />
  </g>
);

/** Actuator unit: stubby cylinder with a saffron end cap. */
export const Actuator: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-34} y={-30} width={68} height={60} rx={12} fill={C.blue} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={-34} y={-30} width={22} height={60} rx={10} fill={C.blueDeep} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={34} y={-14} width={20} height={28} rx={5} fill={C.saffron} stroke={C.ink} strokeWidth={OUTLINE - 1} />
    <circle cx={8} cy={0} r={7} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
  </g>
);

export const Wrench: React.FC<{x: number; y: number; rot?: number; s?: number}> = ({x, y, rot = 0, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-70} y={-9} width={110} height={18} rx={9} fill={C.inkMuted} stroke={C.ink} strokeWidth={4} />
    <path d="M 40 -26 L 70 -26 L 70 -10 L 56 -10 L 56 10 L 70 10 L 70 26 L 40 26 A 30 30 0 0 1 40 -26 Z" fill={C.inkMuted} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </g>
);

export const RegisterBox: React.FC<{x: number; y: number; drawer: number}> = ({x, y, drawer}) => (
  <g transform={`translate(${x} ${y})`}>
    <Shadow x={0} y={2} rx={110} />
    <rect x={-96} y={-18 + drawer * 0} width={192} height={18 + drawer * 22} rx={6} fill={C.woodDeep} stroke={C.ink} strokeWidth={4} />
    <rect x={-100} y={-96} width={200} height={84} rx={12} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={-70} y={-150} width={140} height={60} rx={10} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={-54} y={-136} width={108} height={14} rx={4} fill={C.tealLight} />
    <rect x={-54} y={-116} width={60} height={8} rx={4} fill={C.inkMuted} opacity={0.5} />
    {[-60, -30, 0, 30, 60].map((px) => (
      <circle key={px} cx={px} cy={-58} r={9} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
    ))}
  </g>
);

/** Price-tag-shaped prop, deliberately blank (no price). */
export const Tag: React.FC<{x: number; y: number; rot?: number; s?: number}> = ({x, y, rot = 0, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -60 -34 L 38 -34 L 66 0 L 38 34 L -60 34 Z" fill={C.saffron} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
    <circle cx={34} cy={0} r={8} fill={C.cream} stroke={C.ink} strokeWidth={3} />
    <rect x={-44} y={-8} width={50} height={16} rx={4} fill={C.cream} stroke={C.ink} strokeWidth={3} />
  </g>
);

/** Quick curl of paper: receipt strip rising from the register. */
export const Receipt: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => {
  const h = 230 * t;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M -34 0 L -34 ${-h} Q -30 ${-h - 18} -8 ${-h - 22} L 34 ${-h - 14} L 34 0 Z`} fill={C.white} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      {Array.from({length: Math.floor(h / 34)}).map((_, i) => (
        <line key={i} x1={-20} y1={-18 - i * 34} x2={i % 2 ? 6 : 20} y2={-18 - i * 34} stroke={C.inkMuted} strokeWidth={4} strokeLinecap="round" />
      ))}
    </g>
  );
};
