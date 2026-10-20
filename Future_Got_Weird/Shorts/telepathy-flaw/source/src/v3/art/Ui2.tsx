// V2 interface pieces, in the Death Clock device finish (deep-navy glass, cyan for normal, crimson for the failure):
//  - ArCard: the compact augmented-reality message beside the receiver's eye line (typing dots -> bubble -> delivered);
//  - UndoChip: the sender's cancel control, a round x with a draining timer ring;
//  - WarnCard: UNFILTERED THOUGHT DETECTED (the only warning, shown once);
//  - Silhouette: the faceless dark bust of the unwanted thought (never a quote, never violent).
import React from 'react';
import {lit, mix, shade} from '../../lib/color';
import {clamp, fmt, V} from '../../lib/math';
import {UI_FONT} from '../../fontNames';
import {ALERT, ALERT_DEEP, SIG} from '../../art/Section';
import {Glass, HeyBubble, INKC, NAVY} from '../../art/Ui';

const tone = (t: number, a: string, b: string) => mix(a, b, clamp(t));

/** the compact AR card. msg: bubble alpha, typing: dots alpha, red: 0 blue .. 1 red, done: the delivered row 0..1 */
export const ArCard: React.FC<{id: string; c: V; s?: number; alpha: number; red: number; typing: number; msg: number; done: number; tick: number; sil: number; pulse?: number}> = ({id, c, s = 1, alpha, red, typing, msg, done, tick, sil, pulse = 0}) => {
  if (alpha <= 0.01) return null;
  const w = 250;
  const h = 186;
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) scale(${fmt(s)})`}>
      <Glass id={id} c={{x: 0, y: 0}} w={w} h={h} red={red} alpha={alpha} pulse={pulse} r={24}>
        {/* typing dots */}
        {typing > 0.02 && (
          <g opacity={typing}>
            {[-26, 0, 26].map((x, i) => (
              <circle key={i} cx={x} cy={-18 - 8 * Math.max(0, Math.sin(tick * 14 - i * 1.3))} r={9} fill={tone(red, SIG, '#FF5A66')} />
            ))}
          </g>
        )}
        {/* the message: the friendly bubble, or the dark silhouette in a red-edged bubble */}
        {msg > 0.02 && sil < 0.5 && <HeyBubble c={{x: 0, y: -22}} w={150} id={`${id}-m`} alpha={msg} tail="right" />}
        {msg > 0.02 && sil >= 0.5 && (
          <g opacity={msg}>
            <rect x={-70} y={-62} width={140} height={90} rx={22} fill="#FFE9EB" stroke={INKC} strokeWidth={4} />
            <Silhouette id={`${id}-s`} c={{x: 0, y: -16}} h={74} alpha={1} rim={0.8} />
          </g>
        )}
        {/* delivery row */}
        <g opacity={done}>
          <circle cx={-w / 2 + 38} cy={h / 2 - 34} r={17} fill={tone(red, '#21B883', '#FF5A66')} />
          <path d="M-8,0 L-2,7 L10,-7" transform={`translate(${fmt(-w / 2 + 38)} ${fmt(h / 2 - 34)})`} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <text x={-w / 2 + 64} y={h / 2 - 22} fontFamily={UI_FONT} fontWeight={800} fontSize={34} textLength={150} lengthAdjust="spacingAndGlyphs" fill="#EAF8FF">
            Message Delivered
          </text>
        </g>
      </Glass>
    </g>
  );
};

/** the cancel control: dark disc, white x, a ring that drains while the message is still before the gate, and a short
 *  track beside it showing the gate and the packet (blue or red) - once the packet is past the gate the ring is spent. */
export const UndoChip: React.FC<{c: V; s?: number; alpha: number; ring: number; spent: number; press: number; shake: number; prog: number; red: number; showTrack: number}> = ({c, s = 1, alpha, ring, spent, press, shake, prog, red, showTrack}) => {
  if (alpha <= 0.01) return null;
  const r = 36;
  const col = mix(SIG, '#7E8A96', spent);
  const circ = 2 * Math.PI * (r + 8);
  // track: a gentle curve from the chip toward the upper right
  const tp = (u: number): V => ({x: r + 20 + 120 * u, y: -r * 0.6 - 130 * u * u - 30 * u});
  const gateU = 0.5;
  const g = tp(gateU);
  const closed = prog > gateU ? 1 : 0;
  const pk = tp(clamp(prog));
  const dots = Array.from({length: 17}, (_, i) => tp(i / 16));
  return (
    <g transform={`translate(${fmt(c.x + shake * 5 * Math.sin(shake * 60))} ${fmt(c.y)}) scale(${fmt(s)})`} opacity={alpha}>
      {showTrack > 0.02 && (
        <g opacity={showTrack}>
          <path d={dots.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join(' ')} fill="none" stroke="#6D8399" strokeWidth={3} strokeLinecap="round" strokeDasharray="1 9" opacity={0.9} />
          <rect x={fmt(g.x - 4)} y={fmt(g.y - 22)} width={8} height={44} rx={4} fill={closed ? '#FF5A66' : '#46CFFF'} opacity={closed ? 0.95 : 0.7} transform={`rotate(-35 ${fmt(g.x)} ${fmt(g.y)})`} />
          <g transform={`translate(${fmt(pk.x)} ${fmt(pk.y)}) scale(0.78)`}>
            <path d="M-17,-12 Q-17,-16 -13,-16 L13,-16 Q17,-16 17,-12 L17,6 Q17,10 13,10 L-3,10 L-10,17 L-9,10 L-13,10 Q-17,10 -17,6 Z" fill={red > 0.5 ? '#EF3340' : '#2F7BFF'} stroke={INKC} strokeWidth={2.5} strokeLinejoin="round" />
            {red > 0.5 ? <path d="M-8,5 L-6,-6 L-3,1 L0,-8 L3,1 L6,-6 L8,5 Q0,8 -8,5 Z" fill="#1A0B14" /> : <g fill="#FFF"><circle cx={-7} cy={-3} r={2.4} /><circle cx={0} cy={-3} r={2.4} /><circle cx={7} cy={-3} r={2.4} /></g>}
          </g>
        </g>
      )}
      <circle r={r + 8} fill={col} opacity={0.12 + 0.25 * press} />
      <circle r={r} fill={mix('#0A1B30', '#16283A', spent)} stroke={col} strokeWidth={4} />
      <path d="M-13,-13 L13,13 M13,-13 L-13,13" stroke={mix('#EAF8FF', '#9AA7B2', spent)} strokeWidth={7} strokeLinecap="round" />
      <circle r={r + 8} fill="none" stroke="#33485C" strokeWidth={4} opacity={0.6} />
      {ring > 0.01 && <circle r={r + 8} fill="none" stroke={col} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${fmt(circ * clamp(ring))} ${fmt(circ)}`} transform="rotate(-90)" />}
    </g>
  );
};

/** UNFILTERED THOUGHT DETECTED: one compact red card, two lines, a hazard mark */
export const WarnCard: React.FC<{id: string; c: V; s?: number; alpha: number; blink: number}> = ({id, c, s = 1, alpha, blink}) => {
  if (alpha <= 0.01) return null;
  const w = 380;
  const h = 150;
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) scale(${fmt(s)})`}>
      <Glass id={id} c={{x: 0, y: 0}} w={w} h={h} red={1} alpha={alpha} pulse={blink} r={24}>
        <g transform={`translate(${fmt(-w / 2 + 52)} 2)`}>
          <path d="M0,-30 L31,24 L-31,24 Z" fill="#FF4B57" stroke="#FFD7DA" strokeWidth={4} strokeLinejoin="round" />
          <path d="M0,-12 L0,6" stroke="#2A0610" strokeWidth={6.5} strokeLinecap="round" />
          <circle cx={0} cy={16} r={4} fill="#2A0610" />
        </g>
        <text x={-w / 2 + 100} y={-8} fontFamily={UI_FONT} fontWeight={800} fontSize={40} textLength={262} lengthAdjust="spacingAndGlyphs" fill="#FFE9EA">
          UNFILTERED THOUGHT
        </text>
        <text x={-w / 2 + 100} y={38} fontFamily={UI_FONT} fontWeight={800} fontSize={40} letterSpacing={3} fill="#FF8A92">
          DETECTED
        </text>
      </Glass>
    </g>
  );
};

/** a faceless head-and-shoulders silhouette: clean smooth body, a ragged red rim, a darker void at the core */
export const Silhouette: React.FC<{id: string; c: V; h: number; alpha: number; rim?: number; jitter?: number}> = ({id, c, h, alpha, rim = 1, jitter = 0}) => {
  if (alpha <= 0.01) return null;
  const k = h / 200;
  // smooth bust: head circle on a neck into broad shoulders
  const body = 'M-92,100 C-92,58 -62,40 -30,32 C-42,22 -46,8 -46,-8 C-46,-38 -26,-60 0,-60 C26,-60 46,-38 46,-8 C46,8 42,22 30,32 C62,40 92,58 92,100 Z';
  // the same shape with a torn edge for the rim
  const jag = (n: number) => {
    const pts: string[] = [];
    const base: [number, number][] = [[-92, 100], [-92, 58], [-62, 40], [-30, 32], [-44, 18], [-46, -8], [-44, -34], [-26, -58], [0, -62], [26, -58], [44, -34], [46, -8], [44, 18], [30, 32], [62, 40], [92, 58], [92, 100]];
    base.forEach(([x, y], i) => {
      const o = i % 2 ? 1 : -1;
      pts.push(`${i ? 'L' : 'M'}${fmt(x + o * (3 + 2 * Math.sin(i * 2.3 + n)) + jitter * 3 * Math.sin(i * 7 + n))},${fmt(y + o * (3 + 2 * Math.cos(i * 1.7 + n)))}`);
    });
    return pts.join(' ') + ' Z';
  };
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) scale(${fmt(k)})`} opacity={alpha}>
      <defs>
        <radialGradient id={`${id}-sg`} cx="0.5" cy="0.38" r="0.75">
          <stop offset="0" stopColor="#3A1B4A" />
          <stop offset="1" stopColor="#0B0510" />
        </radialGradient>
      </defs>
      <path d={jag(0)} fill="none" stroke={ALERT} strokeWidth={14} strokeLinejoin="round" opacity={0.22 * rim} />
      <path d={jag(1)} fill="none" stroke={ALERT} strokeWidth={5} strokeLinejoin="round" opacity={0.85 * rim} />
      <path d={body} fill={`url(#${id}-sg)`} />
      <path d="M-20,-20 Q0,-30 20,-20" fill="none" stroke={shade(ALERT_DEEP, 0.2)} strokeWidth={0} />
    </g>
  );
};

export {lit, NAVY};

/** the throat lens: a round see-through window on the neck showing the larynx; the folds are at rest (inactive) */
export const NeckLens: React.FC<{id: string; c: V; r: number; open: number; mark: number; dim: number}> = ({id, c, r, open, mark, dim}) => {
  const o = clamp(open);
  if (o <= 0.01) return null;
  const rr = r * (0.2 + 0.8 * o);
  const k = (r / 100) * 1.45;
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)})`} opacity={clamp(o * 2)}>
      <defs>
        <clipPath id={`${id}-nc`}>
          <circle r={fmt(rr)} />
        </clipPath>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6C7BC" />
          <stop offset="1" stopColor="#D98E88" />
        </linearGradient>
        <linearGradient id={`${id}-air`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6E3040" />
          <stop offset="0.5" stopColor="#A9505E" />
          <stop offset="1" stopColor="#6E3040" />
        </linearGradient>
        <radialGradient id={`${id}-mk`}>
          <stop offset="0.55" stopColor="#BFF1FF" stopOpacity={0} />
          <stop offset="0.8" stopColor="#BFF1FF" stopOpacity={0.6} />
          <stop offset="1" stopColor="#BFF1FF" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle r={fmt(rr + 6)} fill={INKC} opacity={0.85} />
      <g clipPath={`url(#${id}-nc)`}>
        <rect x={-rr} y={-rr} width={rr * 2} height={rr * 2} fill={`url(#${id}-wall)`} />
        <g transform={`scale(${fmt(k)})`}>
          {/* the airway tube */}
          <path d="M-22,-70 L-22,-16 Q-22,-4 -12,8 L-12,70 L12,70 L12,8 Q22,-4 22,-16 L22,-70 Z" fill={`url(#${id}-air)`} stroke="#4A1E2B" strokeWidth={2} />
          {/* tracheal rings below */}
          {[22, 34, 46, 58].map((y) => (
            <path key={y} d={`M-12,${y} Q0,${y + 5} 12,${y}`} fill="none" stroke="#F3DCC4" strokeWidth={2.6} strokeLinecap="round" opacity={0.85} />
          ))}
          {/* the thyroid cartilage round it */}
          <path d="M-42,-34 Q-42,-58 -20,-58 L0,-48 L20,-58 Q42,-58 42,-34 Q42,-4 12,12 L0,18 L-12,12 Q-42,-4 -42,-34 Z" fill="#F7EEDC" stroke="#B9A47C" strokeWidth={2.4} opacity={0.88} />
          {/* the two vocal folds, at rest: a V with a still slit between them */}
          <path d="M-20,-26 Q-14,-6 -3,4 L-3,-4 Q-10,-14 -16,-32 Z" fill="#EFA2A8" stroke="#8A3A48" strokeWidth={1.6} />
          <path d="M20,-26 Q14,-6 3,4 L3,-4 Q10,-14 16,-32 Z" fill="#EFA2A8" stroke="#8A3A48" strokeWidth={1.6} />
          <path d="M0,-28 L0,2" stroke="#2A0E18" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
          <ellipse cx={-10} cy={-12} rx={3} ry={5} transform="rotate(30 -10 -12)" fill="#FFFFFF" opacity={0.5} />
          <ellipse cx={10} cy={-12} rx={3} ry={5} transform="rotate(-30 10 -12)" fill="#FFFFFF" opacity={0.5} />
          {mark > 0.02 && <circle cx={0} cy={-10} r={46 + 8 * mark} fill={`url(#${id}-mk)`} opacity={mark} />}
        </g>
        <rect x={-rr} y={-rr} width={rr * 2} height={rr * 2} fill="#0E2540" opacity={0.55 * clamp(dim)} />
      </g>
      <circle r={fmt(rr)} fill="none" stroke="#F1B9A0" strokeWidth={5} />
      <circle r={fmt(rr)} fill="none" stroke={INKC} strokeWidth={2.4} opacity={0.9} />
      <path d={`M${fmt(-rr * 0.7)},${fmt(-rr * 0.45)} A${fmt(rr * 0.85)},${fmt(rr * 0.85)} 0 0 1 ${fmt(-rr * 0.2)},${fmt(-rr * 0.82)}`} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.55} />
    </g>
  );
};

/** the communication path: screen-constant line widths (the camera zoom changes by 20x across the film) */
export const Route2: React.FC<{pts: V[]; alpha: number; red: number; phase: number; z: number}> = ({pts, alpha, red, phase, z}) => {
  if (alpha <= 0.01 || pts.length < 2) return null;
  const col = tone(red, SIG, ALERT);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join(' ');
  const k = 1 / Math.max(1, z);
  return (
    <g opacity={alpha}>
      <path d={d} fill="none" stroke={col} strokeWidth={12 * k} strokeLinecap="round" opacity={0.16} />
      <path d={d} fill="none" stroke={col} strokeWidth={4.5 * k} strokeLinecap="round" opacity={0.4} />
      <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={2.2 * k} strokeLinecap="round" strokeDasharray={`${2 * k} ${14 * k}`} strokeDashoffset={fmt(-phase * k)} opacity={0.9} />
    </g>
  );
};
