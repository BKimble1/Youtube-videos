// The Telepathy Flaw interface language, in the Death Clock device-screen finish: deep-navy glass with cyan lines for
// normal operation, crimson for the privacy failure. Only the labels the story needs exist:
//   "Hey" (the one intended message), UNFILTERED THOUGHT DETECTED, Message Delivered, and a short "Motor cortex" tag.
// All pure functions of their props; text uses the channel's Barlow Condensed (UI) and Fredoka (captions) faces.
import React from 'react';
import {lit, mix, shade} from '../lib/color';
import {clamp, fmt, V} from '../lib/math';
import {UI_FONT} from '../fontNames';
import {ALERT, ALERT_DEEP, SIG, SIG_DEEP} from './Section';

export const NAVY = '#0E2540';
export const INKC = '#172B3A';

const tone = (t: number, a: string, b: string) => mix(a, b, clamp(t));

/** a route between the sender's chip and the receiver's view: a cubic bezier, the shared path of every packet */
export type RouteGeo = {A: V; C1: V; C2: V; B: V};
export const routePoint = (r: RouteGeo, u: number): V => {
  const q = 1 - u;
  const a = q * q * q;
  const b = 3 * q * q * u;
  const c = 3 * q * u * u;
  const d = u * u * u;
  return {x: a * r.A.x + b * r.C1.x + c * r.C2.x + d * r.B.x, y: a * r.A.y + b * r.C1.y + c * r.C2.y + d * r.B.y};
};
export const routeAngle = (r: RouteGeo, u: number) => {
  const p0 = routePoint(r, clamp(u - 0.01));
  const p1 = routePoint(r, clamp(u + 0.01));
  return (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI;
};
const routeD = (r: RouteGeo, from = 0, to = 1) => {
  const n = 24;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const p = routePoint(r, from + ((to - from) * i) / n);
    d += `${i === 0 ? 'M' : 'L'}${fmt(p.x)},${fmt(p.y)} `;
  }
  return d;
};

/** the communication path: a thin line with a soft glow and a slow dash, drawn between u0 and u1 */
export const Route: React.FC<{r: RouteGeo; u0?: number; u1?: number; alpha: number; red?: number; phase?: number}> = ({r, u0 = 0, u1 = 1, alpha, red = 0, phase = 0}) => {
  if (alpha <= 0.01 || u1 <= u0) return null;
  const col = tone(red, SIG, ALERT);
  const d = routeD(r, u0, u1);
  return (
    <g opacity={alpha}>
      <path d={d} fill="none" stroke={col} strokeWidth={14} strokeLinecap="round" opacity={0.16} />
      <path d={d} fill="none" stroke={col} strokeWidth={5} strokeLinecap="round" opacity={0.4} />
      <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeDasharray="2 14" strokeDashoffset={fmt(-phase)} opacity={0.9} />
    </g>
  );
};

/** compact message packet: a small chat-bubble token; red carries the dark abstract mark */
export const Packet: React.FC<{c: V; s?: number; red?: number; rot?: number; alpha?: number; id: string; glow?: number}> = ({c, s = 1, red = 0, rot = 0, alpha = 1, id, glow = 1}) => {
  if (alpha <= 0.01) return null;
  const body = tone(red, '#2F7BFF', ALERT);
  const deep = tone(red, '#173FA8', ALERT_DEEP);
  const lite = tone(red, '#9BE8FF', '#FFB3B8');
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) rotate(${fmt(rot)}) scale(${fmt(s)})`} opacity={alpha}>
      <defs>
        <linearGradient id={`${id}-pk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(body, 0.4)} />
          <stop offset="0.55" stopColor={body} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
        <radialGradient id={`${id}-pg`}>
          <stop offset="0" stopColor={lite} stopOpacity={0.75} />
          <stop offset="1" stopColor={lite} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle r={52} fill={`url(#${id}-pg)`} opacity={0.7 * glow} />
      <path d="M-24,-17 Q-24,-23 -18,-23 L18,-23 Q24,-23 24,-17 L24,9 Q24,15 18,15 L-4,15 L-14,25 L-13,15 L-18,15 Q-24,15 -24,9 Z" fill={`url(#${id}-pk)`} stroke={INKC} strokeWidth={3} strokeLinejoin="round" />
      <path d="M-20,-18 Q-20,-20 -17,-20 L12,-20" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
      {red < 0.5 ? (
        <g fill="#FFFFFF">
          <circle cx={-10} cy={-4} r={3.4} />
          <circle cx={0} cy={-4} r={3.4} />
          <circle cx={10} cy={-4} r={3.4} />
        </g>
      ) : (
        <path d="M-12,8 L-9,-9 L-4,2 L0,-12 L4,2 L9,-9 L12,8 Q0,12 -12,8 Z" fill="#1A0B14" opacity={0.92} />
      )}
    </g>
  );
};

/** the dark abstract silhouette of the unwanted thought: a faceless bust with ragged edges; never a quote, never violent */
export const SilhouetteMark: React.FC<{c: V; s?: number; alpha?: number; id: string; rim?: number}> = ({c, s = 1, alpha = 1, id, rim = 1}) => {
  if (alpha <= 0.01) return null;
  const d = 'M-70,86 C-76,40 -56,22 -34,14 C-44,2 -46,-18 -34,-36 C-26,-50 -10,-56 4,-54 C20,-54 34,-44 38,-28 C44,-12 40,4 30,14 C52,22 74,38 70,86 Z';
  const ragged = 'M-70,86 L-76,56 L-62,50 L-70,30 L-52,28 L-44,8 L-52,-8 L-38,-14 L-40,-36 L-26,-40 L-20,-58 L-6,-48 L4,-62 L16,-48 L30,-54 L34,-34 L46,-30 L42,-10 L52,2 L38,10 L48,28 L66,32 L62,52 L76,60 L70,86 Z';
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) scale(${fmt(s)})`} opacity={alpha}>
      <defs>
        <radialGradient id={`${id}-sg`} cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#3B1E4A" />
          <stop offset="1" stopColor="#0C0612" />
        </radialGradient>
      </defs>
      <path d={ragged} fill="none" stroke={ALERT} strokeWidth={10} strokeLinejoin="round" opacity={0.28 * rim} />
      <path d={ragged} fill="none" stroke={ALERT} strokeWidth={4} strokeLinejoin="round" opacity={0.7 * rim} />
      <path d={d} fill={`url(#${id}-sg)`} />
      <path d={ragged} fill="#120A1A" opacity={0.85} />
    </g>
  );
};

/** the intended message: a speech bubble, "Hey" */
export const HeyBubble: React.FC<{c: V; w?: number; red?: number; alpha?: number; id: string; s?: number; tail?: 'left' | 'right'}> = ({c, w = 150, red = 0, alpha = 1, id, s = 1, tail = 'left'}) => {
  if (alpha <= 0.01) return null;
  const h = w * 0.62;
  const fill = tone(red, '#F5FBFF', '#FFE6E8');
  const flip = tail === 'right' ? -1 : 1;
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) scale(${fmt(s * flip)} ${fmt(s)})`} opacity={alpha}>
      <defs>
        <linearGradient id={`${id}-hb`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={tone(red, '#CFE9F7', '#F6B7BD')} />
        </linearGradient>
      </defs>
      <path d={`M${-w / 2 + 22},${-h / 2} L${w / 2 - 22},${-h / 2} Q${w / 2},${-h / 2} ${w / 2},${-h / 2 + 22} L${w / 2},${h / 2 - 22} Q${w / 2},${h / 2} ${w / 2 - 22},${h / 2} L${-w / 2 + 52},${h / 2} L${-w / 2 + 14},${h / 2 + 30} L${-w / 2 + 22},${h / 2} Q${-w / 2},${h / 2} ${-w / 2},${h / 2 - 22} L${-w / 2},${-h / 2 + 22} Q${-w / 2},${-h / 2} ${-w / 2 + 22},${-h / 2} Z`} fill={`url(#${id}-hb)`} stroke={INKC} strokeWidth={4.5} strokeLinejoin="round" />
      <path d={`M${-w / 2 + 14},${-h / 2 + 12} L${w / 2 - 40},${-h / 2 + 12}`} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
      {red < 0.5 ? (
        <text x={0} y={h * 0.12} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={w * 0.42} fill={INKC} transform={`scale(${flip} 1)`}>
          Hey
        </text>
      ) : (
        <SilhouetteMark c={{x: 0, y: h * 0.06}} s={h / 235} id={`${id}-sm`} rim={0.8} />
      )}
    </g>
  );
};

/** rounded glass panel (the device-screen finish): navy ground, tone-coloured edge, soft outer glow, top-left sheen */
export const Glass: React.FC<{id: string; c: V; w: number; h: number; red?: number; alpha?: number; r?: number; children?: React.ReactNode; pulse?: number}> = ({id, c, w, h, red = 0, alpha = 1, r = 26, children, pulse = 0}) => {
  if (alpha <= 0.01) return null;
  const edge = tone(red, SIG, ALERT);
  const ground = tone(red, NAVY, '#3A0A14');
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)})`} opacity={alpha}>
      <defs>
        <linearGradient id={`${id}-gl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(ground, 0.18)} stopOpacity={0.94} />
          <stop offset="1" stopColor={shade(ground, 0.3)} stopOpacity={0.94} />
        </linearGradient>
      </defs>
      <rect x={-w / 2 - 6} y={-h / 2 - 6} width={w + 12} height={h + 12} rx={r + 5} fill="none" stroke={edge} strokeWidth={10 + 8 * pulse} opacity={0.14 + 0.2 * pulse} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={`url(#${id}-gl)`} stroke={edge} strokeWidth={3.5} />
      <path d={`M${-w / 2 + r},${-h / 2 + 4} L${w / 2 - r * 2},${-h / 2 + 4}`} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.28} />
      {children}
    </g>
  );
};

/** the sender's outgoing-message panel. normal: the queued "Hey"; failure: UNFILTERED THOUGHT DETECTED on two lines */
export const SenderPanel: React.FC<{
  id: string;
  c: V;
  alpha: number;
  /** 0 normal .. 1 failure */
  red: number;
  /** text reveal of the failure labels */
  warn: number;
  /** blink of the alert 0..1 */
  blink?: number;
  /** the queued Hey bubble alpha (normal mode) */
  hey?: number;
}> = ({id, c, alpha, red, warn, blink = 0, hey = 1}) => {
  const w = 460;
  const h = 250;
  const a1 = clamp(warn * 1.6);
  const a2 = clamp(warn * 1.6 - 0.45);
  return (
    <Glass id={id} c={c} w={w} h={h} red={red} alpha={alpha} pulse={blink}>
      {/* normal: a status row and the queued message */}
      <g opacity={1 - clamp(red * 2.2)}>
        <circle cx={-w / 2 + 38} cy={-h / 2 + 38} r={10} fill={SIG} opacity={0.9} />
        <rect x={-w / 2 + 62} y={-h / 2 + 31} width={150} height={14} rx={7} fill={SIG} opacity={0.35} />
        <HeyBubble c={{x: 0, y: 28}} w={176} id={`${id}-q`} alpha={hey} />
      </g>
      {/* failure: hazard mark and the two readable lines */}
      <g opacity={clamp(red * 1.6 - 0.3)}>
        <g transform={`translate(${fmt(-w / 2 + 58)} ${fmt(-4)})`}>
          <path d="M0,-34 L34,26 L-34,26 Z" fill="#FF4B57" stroke="#FFD7DA" strokeWidth={4} strokeLinejoin="round" />
          <path d="M0,-14 L0,6" stroke="#2A0610" strokeWidth={7} strokeLinecap="round" />
          <circle cx={0} cy={17} r={4.2} fill="#2A0610" />
        </g>
        <text x={-w / 2 + 112} y={-6} fontFamily={UI_FONT} fontWeight={800} fontSize={46} textLength={328} lengthAdjust="spacingAndGlyphs" fill="#FFE9EA" opacity={a1}>
          UNFILTERED THOUGHT
        </text>
        <text x={-w / 2 + 112} y={54} fontFamily={UI_FONT} fontWeight={800} fontSize={46} letterSpacing={3} fill="#FF8A92" opacity={a2}>
          DETECTED
        </text>
      </g>
    </Glass>
  );
};

/** the cancel button under the panel: a round x; `ring` is a slow progress ring after it is tapped */
export const CancelButton: React.FC<{c: V; red: number; press: number; ring: number; alpha: number; flash?: number}> = ({c, red, press, ring, alpha, flash = 0}) => {
  if (alpha <= 0.01) return null;
  const edge = tone(red, SIG, '#FF5A66');
  const r = 40;
  const circ = 2 * Math.PI * (r + 9);
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) scale(${fmt(1 - 0.1 * press)})`} opacity={alpha}>
      <circle r={r + 8} fill={edge} opacity={0.12 + 0.3 * press + 0.4 * flash} />
      <circle r={r} fill={mix('#0A1B30', tone(red, '#163A60', '#5A1522'), press)} stroke={edge} strokeWidth={4} />
      <path d="M-14,-14 L14,14 M14,-14 L-14,14" stroke="#EAF8FF" strokeWidth={7} strokeLinecap="round" />
      {ring > 0.01 && <circle r={r + 9} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" strokeDasharray={`${fmt(circ * clamp(ring))} ${fmt(circ)}`} transform="rotate(-90)" opacity={0.9} />}
    </g>
  );
};

/** the receiver's augmented-reality view of the incoming message, with its progress indicator and the delivery label */
export const ReceiverHud: React.FC<{
  id: string;
  c: V;
  alpha: number;
  /** 0 blue .. 1 red message */
  red: number;
  /** message bubble alpha */
  msg: number;
  /** progress bar 0..1 (the sending line) */
  progress: number;
  /** "Message Delivered" 0..1 */
  delivered: number;
  /** the red packet has landed (0..1): the bubble shows the abstract silhouette */
  landed?: number;
}> = ({id, c, alpha, red, msg, progress, delivered, landed = 0}) => {
  const w = 360;
  const h = 270;
  const barW = w - 60;
  const done = clamp(delivered * 1.4);
  const typing = clamp(1 - msg) * clamp(alpha);
  return (
    <Glass id={id} c={c} w={w} h={h} red={red} alpha={alpha} pulse={delivered * (1 - delivered) * 2}>
      <HeyBubble c={{x: 0, y: -36}} w={190} red={landed} alpha={msg} id={`${id}-m`} tail="right" />
      {typing > 0.05 && (
        <g opacity={typing * 0.9}>
          {[-26, 0, 26].map((x, i) => (
            <circle key={i} cx={x} cy={-30 - 7 * Math.max(0, Math.sin(progress * 22 - i * 1.2))} r={9} fill={tone(red, SIG, '#FF5A66')} />
          ))}
        </g>
      )}
      {/* progress indicator: a line that fills, then snaps to the delivery label */}
      <rect x={-barW / 2} y={50} width={barW} height={12} rx={6} fill={tone(red, '#1B3B5E', '#5A1522')} />
      <rect x={-barW / 2} y={50} width={barW * clamp(progress)} height={12} rx={6} fill={tone(red, SIG, '#FF5A66')} />
      <g opacity={done}>
        <circle cx={-barW / 2 + 22} cy={96} r={19} fill={tone(red, '#21B883', '#FF5A66')} />
        <path d="M-9,0 L-2,8 L11,-8" transform={`translate(${fmt(-barW / 2 + 22)} 96)`} fill="none" stroke="#FFFFFF" strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
        <text x={-barW / 2 + 50} y={108} fontFamily={UI_FONT} fontWeight={800} fontSize={36} textLength={228} lengthAdjust="spacingAndGlyphs" fill="#EAF8FF">
          Message Delivered
        </text>
      </g>
    </Glass>
  );
};

/** small unboxed tag, with a leader dot, used once for the motor-cortex reveal */
export const Tag: React.FC<{c: V; text: string; alpha: number; size?: number; anchor?: 'start' | 'end'}> = ({c, text, alpha, size = 40, anchor = 'start'}) => {
  if (alpha <= 0.01) return null;
  return (
    <g opacity={alpha}>
      <text x={fmt(c.x)} y={fmt(c.y)} textAnchor={anchor} fontFamily={UI_FONT} fontWeight={800} fontSize={size} letterSpacing={2} fill="#FFFFFF" stroke={INKC} strokeWidth={size * 0.2} strokeLinejoin="round" paintOrder="stroke">
        {text}
      </text>
    </g>
  );
};
