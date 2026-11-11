// V2 graphics, screen space (no camera transforms): the wrist camera's segmentation of the pronotum (the paper used a
// TransUNet model to find the pronotum and the midpoint of its rear edge, the implant reference point), a wireless
// command (a few cyan arcs travelling to the backpack's antenna), the before/after trajectory, and the telemetry strip.
import React from 'react';
import {smoothClosed} from '../core/three';
import {ss} from '../lib';

const CYAN = '#5CF2FF';
const YEL = '#FFD84A';
const NAVY = '#0E1E2B';
const f1 = (n: number) => n.toFixed(1);

export const SegOverlay: React.FC<{pts: {x: number; y: number}[]; refPt: {x: number; y: number}; a: number; lock: number}> = ({pts, refPt, a, lock}) => {
  if (a <= 0.01) return null;
  const d = smoothClosed(pts);
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs) - 30, y0 = Math.min(...ys) - 30;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: a}}>
      <path d={d} fill={CYAN} fillOpacity={0.28 * ss(lock, 0, 0.5)} stroke={CYAN} strokeWidth={4} strokeDasharray={lock < 1 ? '10 8' : undefined} />
      <g opacity={ss(lock, 0.5, 1)}>
        <circle cx={f1(refPt.x)} cy={f1(refPt.y)} r={16} fill="none" stroke={YEL} strokeWidth={5} />
        <path d={`M${f1(refPt.x - 30)},${f1(refPt.y)} h20 M${f1(refPt.x + 10)},${f1(refPt.y)} h20 M${f1(refPt.x)},${f1(refPt.y - 30)} v20 M${f1(refPt.x)},${f1(refPt.y + 10)} v20`} stroke={YEL} strokeWidth={4} strokeLinecap="round" />
      </g>
      <g transform={`translate(${f1(Math.max(20, x0))},${f1(Math.max(150, y0 - 20))})`}>
        <rect x={0} y={-40} width={380} height={50} rx={14} fill="rgba(14,30,43,0.88)" />
        <text x={16} y={-6} fill={lock > 0.95 ? YEL : CYAN} style={{fontFamily: '"Nunito Variable", sans-serif', fontWeight: 900, fontSize: 28, letterSpacing: '0.04em'}}>{lock > 0.95 ? 'IMPLANT POINT FOUND' : 'CAMERA: FINDING PRONOTUM'}</text>
      </g>
    </svg>
  );
};

/** a wireless command: three arcs travel from `from` to `to`, then a ring at the antenna */
export const Wireless: React.FC<{from: {x: number; y: number}; to: {x: number; y: number}; a: number; phase: number}> = ({from, to, a, phase}) => {
  if (a <= 0.01) return null;
  const dx = to.x - from.x, dy = to.y - from.y;
  const L = Math.hypot(dx, dy) || 1;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: a}}>
      <line x1={f1(from.x)} y1={f1(from.y)} x2={f1(to.x)} y2={f1(to.y)} stroke={CYAN} strokeWidth={2} strokeDasharray="4 14" opacity={0.35} />
      {[0, 0.33, 0.66].map((o, i) => {
        const u = Math.min(1, Math.max(0, phase - o));
        if (u <= 0 || u >= 1) return null;
        const x = from.x + dx * u, y = from.y + dy * u;
        return <path key={i} d="M-14,-26 Q8,0 -14,26" transform={`translate(${f1(x)},${f1(y)}) rotate(${f1(ang)})`} fill="none" stroke={CYAN} strokeWidth={6} strokeLinecap="round" opacity={0.9 * Math.sin(Math.PI * u) + 0.1} style={{filter: `drop-shadow(0 0 6px ${CYAN})`}} />;
      })}
      {phase > 0.9 && <circle cx={f1(to.x)} cy={f1(to.y)} r={f1(10 + 30 * Math.min(1, phase - 0.9))} fill="none" stroke={CYAN} strokeWidth={4} opacity={Math.max(0, 1 - (phase - 0.9))} />}
      <text x={f1(from.x + dx * 0.25 + (dx > 0 ? 10 : -10))} y={f1(from.y + dy * 0.25 - 14)} textAnchor={dx > 0 ? 'start' : 'end'} fill={CYAN} opacity={0.9} style={{fontFamily: '"Nunito Variable", sans-serif', fontWeight: 900, fontSize: 26, letterSpacing: '0.06em'}}>WIRELESS COMMAND</text>
      {void L}
    </svg>
  );
};

/** before/after: the straight path it was on (dashed grey, ending at the block), the turn it took (cyan) */
export const Trajectory: React.FC<{a: number; straight: {x: number; y: number}[]; took: {x: number; y: number}[]}> = ({a, straight, took}) => (
  <g opacity={a}>
    <polyline points={straight.map((p) => `${f1(p.x)},${f1(p.y)}`).join(' ')} fill="none" stroke="#9FB0BD" strokeWidth={7} strokeDasharray="14 14" strokeLinecap="round" opacity={0.8} />
    {took.length > 1 && <polyline points={took.map((p) => `${f1(p.x)},${f1(p.y)}`).join(' ')} fill="none" stroke={NAVY} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />}
    {took.length > 1 && <polyline points={took.map((p) => `${f1(p.x)},${f1(p.y)}`).join(' ')} fill="none" stroke={CYAN} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" style={{filter: `drop-shadow(0 0 5px ${CYAN})`}} />}
  </g>
);

/** telemetry: a small strip of signal bars and a data trickle, anchored near a point */
export const Telemetry: React.FC<{p: {x: number; y: number}; a: number; t: number}> = ({p, a, t}) => {
  if (a <= 0.01) return null;
  const bars = [0, 1, 2, 3].map((i) => 0.4 + 0.6 * Math.abs(Math.sin(t * 5 + i * 1.3)));
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: a}}>
      {[0, 1, 2].map((i) => {
        const r = 24 + ((t * 70 + i * 40) % 120);
        return <circle key={i} cx={f1(p.x)} cy={f1(p.y)} r={f1(r)} fill="none" stroke={CYAN} strokeWidth={3} opacity={Math.max(0, 0.7 - r / 170)} />;
      })}
      <g transform={`translate(${f1(Math.min(800, p.x + 60))},${f1(p.y - 120)})`}>
        <rect x={0} y={0} width={230} height={64} rx={14} fill="rgba(14,30,43,0.88)" stroke={CYAN} strokeWidth={3} />
        {bars.map((b, i) => <rect key={i} x={16 + i * 14} y={48 - 32 * b} width={9} height={32 * b} rx={2} fill={CYAN} />)}
        <text x={82} y={40} fill="#FFFFFF" style={{fontFamily: '"Nunito Variable", sans-serif', fontWeight: 900, fontSize: 24, letterSpacing: '0.05em'}}>DATA LINK</text>
      </g>
    </svg>
  );
};
