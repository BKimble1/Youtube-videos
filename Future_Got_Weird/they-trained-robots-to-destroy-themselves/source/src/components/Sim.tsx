import React from 'react';
import {C, F} from '../theme';
import {rand} from '../lib/anim';
import {E, kf} from '../lib/motion';
import {RobotSide, Finish} from './Robot';
import {jumpPose, standPose} from '../lib/moves';
import {mixRobot, RobotPose, STAND, STAND_HEIGHT} from '../lib/robot';

/**
 * Simulation-world kit for the training explanation. Everything here is a teaching illustration of how
 * simulation-based training generally works; none of it depicts Figure's actual training runs, numbers or logs.
 */
export const SIMC = {bg: '#E9F1FC', grid: '#CCDCF3', deck: '#9DB8E6', deckDark: '#6F93D1', pad: '#1CA7A0', ink: C.ink};

/** Light-blue grid floor + horizon, world px. Grid spacing is coarse (no fine lines that could shimmer). */
export const SimBackdrop: React.FC<{horizon?: number}> = ({horizon = 640}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', overflow: 'visible'}}>
    <rect x={-2000} y={-1500} width={6000} height={4000} fill={SIMC.bg} />
    {Array.from({length: 41}).map((_, i) => (
      <line key={`v${i}`} x1={-2000 + i * 120} y1={-1500} x2={-2000 + i * 120} y2={2500} stroke={SIMC.grid} strokeWidth={3} />
    ))}
    {Array.from({length: 34}).map((_, i) => (
      <line key={`h${i}`} x1={-2000} y1={-1500 + i * 120} x2={4000} y2={-1500 + i * 120} stroke={SIMC.grid} strokeWidth={3} />
    ))}
    <rect x={-2000} y={horizon} width={6000} height={3000} fill="#DCE8F8" opacity={0.6} />
  </svg>
);

export type Outcome = 'good' | 'short' | 'over' | 'flop';
/** Outcome of attempt k in lane `seed`; `skill` 0..1 raises the share of good attempts. */
export const outcomeOf = (seed: number, k: number, skill: number): Outcome => {
  const r = rand(seed * 977 + k * 131);
  if (r < 0.15 + 0.8 * skill) return 'good';
  const q = rand(seed * 37 + k * 71);
  return q < 0.34 ? 'short' : q < 0.67 ? 'over' : 'flop';
};

const PERIOD = 60;

/**
 * One mini simulation lane: a ledge on the left, a target pad on the right, a virtual robot attempting the jump on a
 * loop. (x, y) = top-left of the lane box in world px; the lane is w x h. Returns SVG content (put it in an <svg>).
 */
export const Lane: React.FC<{x: number; y: number; w?: number; h?: number; g: number; seed: number; skill: number; showMark?: boolean; finish?: Finish; forced?: Outcome; startAt?: number; hold?: boolean}> = ({x, y, w = 340, h = 200, g, seed, skill, showMark = true, finish = 'SIM', forced, startAt, hold}) => {
  const s = 0.2 * (w / 340);
  const ground = y + h - 34;
  const ledgeTop = ground - 52 * (w / 340);
  const ledgeR = x + w * 0.34;
  const padX = x + w * 0.76;
  // startAt: run one attempt starting on that frame (and hold its end state if `hold`), instead of the free loop
  const phase = startAt !== undefined ? -startAt : Math.floor(rand(seed * 13) * PERIOD);
  const raw = g + phase;
  const k = Math.floor(raw / PERIOD);
  const t = startAt !== undefined && hold && raw >= PERIOD - 1 ? PERIOD - 1 : startAt !== undefined && raw < 0 ? 0 : ((raw % PERIOD) + PERIOD) % PERIOD;
  const out = forced ?? outcomeOf(seed, k, skill);
  const missX = out === 'short' ? -w * 0.2 : out === 'over' ? w * 0.18 : 0;
  const J = {crouchAt: 4, takeoff: 14, entry: 30, edgeX: ledgeR - 14 * (w / 340), groundY: ledgeTop, target: {x: padX + missX, y: ground}, scale: s, apex: 34 * (w / 340)};
  let pose: RobotPose;
  let rotExtra = 0;
  if (t < J.entry) pose = jumpPose(t, J).pose;
  else {
    const u = t - J.entry;
    const land = standPose(padX + missX, ground, s, g);
    if (out === 'good') pose = mixRobot({...land, y: land.y + 6}, land, Math.min(1, u / 6));
    else if (out === 'flop') {
      const lie: RobotPose = {...STAND, rot: 84, lean: 0, hipN: 0, kneeN: 0, hipF: 0, kneeF: 0, shN: 150, elN: 10, shF: 150, elF: 10, x: land.x + 40 * s * 4, y: ground - 40 * s};
      pose = mixRobot(land, lie, E.in(Math.min(1, u / 9)));
    } else if (out === 'over') {
      const back: RobotPose = {...STAND, rot: -80, lean: 0, hipN: 10, kneeN: 20, hipF: 0, kneeF: 10, shN: 60, elN: 20, shF: 50, elF: 20, x: land.x - 30 * s * 4, y: ground - 40 * s};
      pose = mixRobot(land, back, E.in(Math.min(1, u / 9)));
    } else {
      // short: drops into the gap below the deck line, clipped by the lane box
      pose = {...land, y: land.y + Math.min(400, u * u * 0.9)};
    }
  }
  const clipId = `lane-${seed}`;
  const markOn = showMark && t > J.entry + 8;
  const good = out === 'good';
  return (
    <g>
      <defs>
        <clipPath id={clipId}><rect x={x} y={y} width={w} height={h} rx={14} /></clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={14} fill="#F5F9FF" stroke={SIMC.deckDark} strokeWidth={3} />
      <g clipPath={`url(#${clipId})`}>
        {/* ledge */}
        <rect x={x - 10} y={ledgeTop} width={ledgeR - x + 10} height={h} fill={SIMC.deck} stroke={SIMC.deckDark} strokeWidth={3} />
        {/* floor beyond the gap */}
        <rect x={x + w * 0.56} y={ground} width={w} height={h} fill={SIMC.deck} stroke={SIMC.deckDark} strokeWidth={3} />
        {/* target pad */}
        <ellipse cx={padX} cy={ground} rx={w * 0.09} ry={6 * (w / 340)} fill={SIMC.pad} stroke={C.ink} strokeWidth={2.5} />
        <g transform={`rotate(${rotExtra} ${pose.x} ${pose.y})`}>
          <RobotSide pose={pose} scale={s} finish={finish} />
        </g>
      </g>
      {markOn && (
        <g transform={`translate(${x + w - 34} ${y + 30})`}>
          <circle r={18} fill={good ? C.teal : C.coral} stroke={C.ink} strokeWidth={3} />
          {good ? <path d="M -8 0 L -2 7 L 9 -7" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /> : <path d="M -7 -7 L 7 7 M 7 -7 L -7 7" stroke="#fff" strokeWidth={4} strokeLinecap="round" />}
        </g>
      )}
    </g>
  );
};

/** Lane cycle helpers for scenes that need the current attempt's timing. */
export const laneT = (g: number, seed: number) => (g + Math.floor(rand(seed * 13) * PERIOD)) % PERIOD;

/** Slider control (HTML). value 0..1 */
export const Slider: React.FC<{label: string; value: number; x: number; y: number; w?: number; tone?: string; ghost?: number}> = ({label, value, x, y, w = 520, tone = C.blue, ghost}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w}}>
    <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 32, color: C.ink}}>{label}</div>
    <div style={{position: 'relative', marginTop: 12, height: 18, borderRadius: 9, background: C.blueLight, border: `3px solid ${C.ink}`}}>
      {ghost !== undefined && <div style={{position: 'absolute', left: `calc(${ghost * 100}% - 14px)`, top: -10, width: 28, height: 34, borderRadius: 8, border: `3px dashed ${C.inkMuted}`}} />}
      <div style={{position: 'absolute', left: `calc(${value * 100}% - 16px)`, top: -12, width: 32, height: 38, borderRadius: 9, background: tone, border: `3px solid ${C.ink}`}} />
    </div>
  </div>
);

/** A point moving around a closed polyline at constant speed. u in [0,1). */
export const alongLoop = (pts: [number, number][], u: number) => {
  const segs = pts.map((p, i) => [p, pts[(i + 1) % pts.length]] as const);
  const lens = segs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  const total = lens.reduce((a, b) => a + b, 0);
  let d = (((u % 1) + 1) % 1) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= lens[i]) {
      const [a, b] = segs[i];
      const k = d / lens[i];
      return {x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k};
    }
    d -= lens[i];
  }
  return {x: pts[0][0], y: pts[0][1]};
};

/** Reflex hammer, pivot at the handle end. angle in degrees. */
export const ReflexHammer: React.FC<{x: number; y: number; angle: number; scale?: number}> = ({x, y, angle, scale = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
    <rect x={-6} y={-150} width={12} height={150} rx={6} fill={C.inkSoft} stroke={C.ink} strokeWidth={3} />
    <path d="M -46 -168 Q 0 -196 46 -168 L 40 -148 Q 0 -160 -40 -148 Z" fill={C.coral} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </g>
);

/** Number formatting with thousands separators (en-US). */
export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/** Smooth step key track (re-export for scenes). */
export const track = kf;
