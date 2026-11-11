// Screen-space graphics in the channel's UI style (Fredoka for numbers and tags, Nunito for labels, navy ink, the
// signal cyan): the 68-second timer, the vision system's target bracket, component callouts, and small context tags.
// None of these inherit a camera transform; callouts are anchored to projected world points.
import React from 'react';
import {clamp, ss} from '../lib';

const NAVY = '#0E1E2B';
const CYAN = '#5CF2FF';
const YEL = '#FFD84A';
const f1 = (n: number) => n.toFixed(1);

/** the cycle timer: counts 0 -> 68 s over [t0, t1], pops on arrival; a progress ring and a "time-lapse" note */
export const Timer68: React.FC<{t: number; t0: number; t1: number; out: number; note?: string}> = ({t, t0, t1, out, note}) => {
  const a = ss(t, t0 - 0.12, t0 + 0.05) * (1 - ss(t, out, out + 0.18));
  if (a <= 0) return null;
  const u = clamp((t - t0) / (t1 - t0));
  const n = Math.round(68 * (u < 1 ? 1 - Math.pow(1 - u, 1.35) : 1));
  const pop = 1 + 0.16 * Math.exp(-Math.max(0, t - t1) / 0.09) * (t >= t1 ? 1 : 0);
  const R = 74, C = 2 * Math.PI * R;
  return (
    <div style={{position: 'absolute', left: 0, top: 210, width: 1080, display: 'flex', justifyContent: 'center', opacity: a, transform: `translateY(${f1((1 - a) * -30)}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 26, padding: '22px 40px 22px 26px', borderRadius: 40, background: 'rgba(14,30,43,0.86)', border: `4px solid ${CYAN}`, boxShadow: '0 10px 30px rgba(0,0,0,0.35)'}}>
        <svg width={180} height={180} viewBox="0 0 180 180">
          <circle cx={90} cy={90} r={R} fill="none" stroke="rgba(92,242,255,0.22)" strokeWidth={16} />
          <circle cx={90} cy={90} r={R} fill="none" stroke={CYAN} strokeWidth={16} strokeLinecap="round" strokeDasharray={`${f1(C * u)} ${f1(C)}`} transform="rotate(-90 90 90)" />
          <rect x={80} y={4} width={20} height={14} rx={4} fill={CYAN} />
          <line x1={90} y1={90} x2={90 + 52 * Math.sin(2 * Math.PI * u)} y2={90 - 52 * Math.cos(2 * Math.PI * u)} stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" />
          <circle cx={90} cy={90} r={9} fill="#FFFFFF" />
        </svg>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
          <div style={{fontFamily: '"Fredoka Variable", sans-serif', fontWeight: 600, fontSize: 150, lineHeight: 0.95, color: u >= 1 ? YEL : '#FFFFFF', transform: `scale(${pop.toFixed(3)})`, transformOrigin: 'left center', fontVariantNumeric: 'tabular-nums'}}>
            {n}
            <span style={{fontSize: 64, marginLeft: 10, color: '#FFFFFF'}}>SECONDS</span>
          </div>
          <div style={{fontFamily: '"Nunito Variable", sans-serif', fontWeight: 800, fontSize: 32, color: CYAN, letterSpacing: '0.06em'}}>{note ?? 'PER INSECT · SHOWN SPED UP'}</div>
        </div>
      </div>
    </div>
  );
};

/** the vision system's corner bracket around a screen box, a crosshair on the target and a status line */
export const VisionBracket: React.FC<{box: {x: number; y: number; w: number; h: number}; target: {x: number; y: number}; a: number; lock: number}> = ({box, target, a, lock}) => {
  if (a <= 0.01) return null;
  const L = 46;
  const {x, y, w, h} = box;
  const corners = [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]];
  const r = 26 + 40 * (1 - lock);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: a}}>
      {corners.map(([cx, cy, sx, sy], i) => (
        <path key={i} d={`M${f1(cx)},${f1(cy + sy * L)} L${f1(cx)},${f1(cy)} L${f1(cx + sx * L)},${f1(cy)}`} fill="none" stroke={CYAN} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <circle cx={f1(target.x)} cy={f1(target.y)} r={f1(r)} fill="none" stroke={lock > 0.95 ? YEL : CYAN} strokeWidth={5} />
      <path d={`M${f1(target.x - r - 18)},${f1(target.y)} h${f1(30)} M${f1(target.x + r - 12)},${f1(target.y)} h${f1(30)} M${f1(target.x)},${f1(target.y - r - 18)} v${f1(30)} M${f1(target.x)},${f1(target.y + r - 12)} v${f1(30)}`} stroke={lock > 0.95 ? YEL : CYAN} strokeWidth={5} strokeLinecap="round" />
      <g transform={`translate(${f1(x)},${f1(y - 26)})`}>
        <rect x={0} y={-36} width={330} height={46} rx={12} fill="rgba(14,30,43,0.85)" />
        <text x={16} y={-4} fill={lock > 0.95 ? YEL : CYAN} style={{fontFamily: '"Nunito Variable", sans-serif', fontWeight: 900, fontSize: 28, letterSpacing: '0.05em'}}>{lock > 0.95 ? 'ATTACH SITE FOUND' : 'VISION: SCANNING…'}</text>
      </g>
    </svg>
  );
};

/** a callout: a dot on the part, a leader, a pill label */
export const Callout: React.FC<{p: {x: number; y: number}; to: {x: number; y: number}; text: string; a: number; color?: string; align?: 'left' | 'right'}> = ({p, to, text, a, color = CYAN, align = 'right'}) => {
  if (a <= 0.01) return null;
  const k = ss(a, 0, 1);
  const ex = p.x + (to.x - p.x) * k, ey = p.y + (to.y - p.y) * k;
  const w = text.length * 21 + 40;
  // keep the label inside the frame (never clipped at an edge)
  const lx = Math.min(1060 - w, Math.max(20, align === 'right' ? to.x : to.x - w));
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: clamp(a * 1.5)}}>
      <circle cx={f1(p.x)} cy={f1(p.y)} r={11} fill={color} stroke={NAVY} strokeWidth={4} />
      <line x1={f1(p.x)} y1={f1(p.y)} x2={f1(ex)} y2={f1(ey)} stroke={NAVY} strokeWidth={9} strokeLinecap="round" />
      <line x1={f1(p.x)} y1={f1(p.y)} x2={f1(ex)} y2={f1(ey)} stroke={color} strokeWidth={4.5} strokeLinecap="round" />
      <g opacity={ss(a, 0.5, 1)}>
        <rect x={f1(lx)} y={f1(to.y - 30)} width={w} height={60} rx={18} fill={NAVY} stroke={color} strokeWidth={4} />
        <text x={f1(lx + w / 2)} y={f1(to.y + 11)} textAnchor="middle" fill="#FFFFFF" style={{fontFamily: '"Nunito Variable", sans-serif', fontWeight: 900, fontSize: 32, letterSpacing: '0.04em'}}>{text}</text>
      </g>
    </svg>
  );
};

/** a small context tag (top-left, under the status bar) */
export const Tag: React.FC<{text: string; sub?: string; a: number; y?: number; color?: string}> = ({text, sub, a, y = 200, color = CYAN}) => {
  if (a <= 0.01) return null;
  return (
    <div style={{position: 'absolute', left: 60, top: y, opacity: a, transform: `translateX(${f1((1 - a) * -24)}px)`}}>
      <div style={{display: 'inline-flex', flexDirection: 'column', padding: '14px 26px', borderRadius: 22, background: 'rgba(14,30,43,0.86)', borderLeft: `10px solid ${color}`}}>
        <span style={{fontFamily: '"Nunito Variable", sans-serif', fontWeight: 900, fontSize: 38, color: '#FFFFFF', letterSpacing: '0.04em'}}>{text}</span>
        {sub && <span style={{fontFamily: '"Nunito Variable", sans-serif', fontWeight: 800, fontSize: 28, color, letterSpacing: '0.04em'}}>{sub}</span>}
      </div>
    </div>
  );
};

/** a pulse readout: a little square-wave strip with a travelling bright segment */
export const PulseTag: React.FC<{x: number; y: number; a: number; phase: number}> = ({x, y, a, phase}) => {
  if (a <= 0.01) return null;
  const pts: string[] = [];
  for (let i = 0; i <= 6; i++) {
    const x0 = i * 44;
    pts.push(`${x0},40 ${x0 + 10},40 ${x0 + 10},6 ${x0 + 24},6 ${x0 + 24},40 ${x0 + 44},40`);
  }
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: a}}>
      <g transform={`translate(${f1(x)},${f1(y)})`}>
        <rect x={-18} y={-58} width={340} height={124} rx={22} fill="rgba(14,30,43,0.88)" stroke={CYAN} strokeWidth={4} />
        <text x={0} y={-22} fill={CYAN} style={{fontFamily: '"Nunito Variable", sans-serif', fontWeight: 900, fontSize: 28, letterSpacing: '0.06em'}}>ELECTRICAL PULSE</text>
        <g transform="translate(0,4) scale(1,1)">
          <polyline points={pts.join(' ')} fill="none" stroke="rgba(92,242,255,0.35)" strokeWidth={5} strokeLinejoin="round" />
          <polyline points={pts.join(' ')} fill="none" stroke={CYAN} strokeWidth={6} strokeLinejoin="round" strokeDasharray="70 900" strokeDashoffset={f1(-phase * 520)} style={{filter: `drop-shadow(0 0 6px ${CYAN})`}} />
        </g>
      </g>
    </svg>
  );
};
