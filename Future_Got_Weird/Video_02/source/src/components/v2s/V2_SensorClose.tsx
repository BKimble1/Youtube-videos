import React, {useId} from 'react';
import {C} from '../../theme';
import {CAST} from '../cast';
import {PAINT} from './V2_Plan';

/**
 * V2.3 · the time-of-flight sensor, full frame (the S1_SensorStand / HandheldSensor kit box at close-up scale, same
 * design: teal box with a coral accent band, cream readout, saffron LED, the two lens rims of its far, working face
 * peeking over the top edge, on its tripod's mount plate and column). Screen space 1920×1080, flat, ink outlines.
 *
 *  - The far face (toward the wall, away from us) carries the emitter (coral rim) and the receiver (dark rim); as in
 *    the room views they show over the box's top edge. Light leaving the emitter goes "up" the frame, away from us.
 *  - The front face carries the display (DISPLAY: the shared arrival timeline lands in it, the V2.2 → V2.3 match) and,
 *    beside it, a stopwatch glyph that runs while the sensor's own light is out.
 *  - The checker's mitt (coral cardigan cuff, skin mitt with a thumb) enters from the lower left and taps the display.
 *
 * Pure function of its props. Backdrop: the relay wall's paint (the sensor stands facing that wall).
 */

export const CLOSE = {
  box: {x0: 790, y0: 300, x1: 1720, y1: 790, r: 46},
  depth: {dx: 58, dy: -52},
  display: {x: 846, y: 350, w: 640, r: 20},
  stopwatch: {x: 1612, y: 452, r: 64},
  led: {x: 1612, y: 624, r: 16},
  emitter: {x: 990, rx: 70, ry: 26},
  receiver: {x: 1330, rx: 52, ry: 20},
  band: 50,
  stroke: 6,
} as const;

/** Display height for the timeline card's aspect (1760 × 908). */
export const DISPLAY_H = CLOSE.display.w * (908 / 1760);
/** Screen centres of the two lens rims (on the top face's back edge). */
export const LENS = {
  emitter: {x: CLOSE.emitter.x + CLOSE.depth.dx, y: CLOSE.box.y0 + CLOSE.depth.dy},
  receiver: {x: CLOSE.receiver.x + CLOSE.depth.dx, y: CLOSE.box.y0 + CLOSE.depth.dy},
};
/** Where the mitt's palm presses the display (lower-left area, clear of the spike and the bump). */
export const TAP_POINT = {x: CLOSE.display.x + 104, y: CLOSE.display.y + DISPLAY_H - 52};

const f2 = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export type SensorCloseProps = {
  /** what the display shows (screen px; clipped to the display) */
  display?: React.ReactNode;
  /** 0..1 how lit the display is (a small dip on the press) */
  displayLit?: number;
  /** stopwatch hand, turns (0 = top) */
  hand?: number;
  /** 0..1 the stopwatch's running highlight */
  running?: number;
  /** 0..1 emitter rim brightens (firing) */
  firing?: number;
  /** outgoing flash: phase 0..1 (leaves the emitter, rises, fades) */
  flashOut?: number;
  /** returning flash: phase 0..1 (comes down into the receiver) */
  flashBack?: number;
  /** 0..1 receiver rim glints as the light arrives */
  receive?: number;
  /** mitt: 0 = out of frame (lower left), 1 = palm on TAP_POINT; press 0..1 squashes it a touch */
  mitt?: number;
  press?: number;
  led?: number;
};

export const SensorClose: React.FC<SensorCloseProps> = ({display, displayLit = 1, hand = 0, running = 0, firing = 0, flashOut = -1, flashBack = -1, receive = 0, mitt = 0, press = 0, led = 1}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const B = CLOSE.box;
  const D = CLOSE.depth;
  const sw = CLOSE.stroke;
  const ink = {stroke: C.ink, strokeWidth: sw, strokeLinejoin: 'round' as const};
  const top = `M ${B.x0 + 8} ${B.y0 + 6} L ${B.x0 + 8 + D.dx} ${B.y0 + D.dy} L ${B.x1 + D.dx} ${B.y0 + D.dy} L ${B.x1 - 6} ${B.y0 + 6} Z`;
  const side = `M ${B.x1 - 8} ${B.y0 + 4} L ${B.x1 + D.dx} ${B.y0 + D.dy} L ${B.x1 + D.dx} ${B.y1 + D.dy - 6} L ${B.x1 - 8} ${B.y1 - 6} Z`;
  const dsp = CLOSE.display;
  const dh = DISPLAY_H;
  const sw2 = CLOSE.stopwatch;
  const fire = clamp01(firing);
  const em = LENS.emitter;
  const rc = LENS.receiver;
  // flash path: straight up out of the emitter, a returning one straight down into the receiver (away from us = up)
  const outY = (u: number) => em.y - 18 - 230 * u;
  const backY = (u: number) => rc.y - 18 - 230 * (1 - u);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {/* the wall behind the sensor, and a skirting + floor strip far below (the room) */}
      <rect x={-10} y={-10} width={1940} height={1100} fill={PAINT} />
      {/* the stand: column and mount plate */}
      <rect x={(B.x0 + B.x1) / 2 - 40} y={B.y1 - 10} width={80} height={420} rx={14} fill={C.inkSoft} {...ink} />
      <rect x={(B.x0 + B.x1) / 2 - 145} y={B.y1 - 6} width={290} height={42} rx={12} fill={C.tealDeep} {...ink} />
      {/* outgoing flash (behind the box: it leaves the far face) */}
      {flashOut >= 0 && flashOut < 1 && (
        <g opacity={f2(0.95 * (1 - flashOut * 0.5))}>
          <path d={`M ${em.x} ${em.y - 10} L ${em.x} ${f2(outY(flashOut))}`} stroke={C.saffronDeep} strokeWidth={10} strokeDasharray="22 14" strokeLinecap="round" opacity={0.7} />
          <circle cx={em.x} cy={f2(outY(flashOut))} r={f2(32 - 6 * flashOut)} fill={C.saffron} stroke={C.ink} strokeWidth={4} />
        </g>
      )}
      {flashBack >= 0 && flashBack < 1 && (
        <g opacity={f2(0.6 + 0.35 * flashBack)}>
          <path d={`M ${rc.x} ${f2(backY(0))} L ${rc.x} ${f2(backY(flashBack))}`} stroke={C.saffronDeep} strokeWidth={8} strokeDasharray="16 12" strokeLinecap="round" opacity={0.65} />
          <circle cx={rc.x} cy={f2(backY(flashBack))} r={22} fill={C.saffron} stroke={C.ink} strokeWidth={4} />
        </g>
      )}
      {/* lens rims of the far face, over the top edge: emitter (coral), receiver (dark) */}
      {fire > 0.01 && <ellipse cx={em.x} cy={em.y} rx={f2(CLOSE.emitter.rx + 34 * fire)} ry={f2(CLOSE.emitter.ry + 18 * fire)} fill={C.saffron} opacity={f2(0.6 * fire)} />}
      <ellipse cx={em.x} cy={em.y} rx={CLOSE.emitter.rx} ry={CLOSE.emitter.ry} fill={mix(C.coral, C.saffronLight, fire * 0.75)} {...ink} />
      {receive > 0.01 && <ellipse cx={rc.x} cy={rc.y} rx={f2(CLOSE.receiver.rx + 22 * receive)} ry={f2(CLOSE.receiver.ry + 12 * receive)} fill={C.saffron} opacity={f2(0.55 * receive)} />}
      <ellipse cx={rc.x} cy={rc.y} rx={CLOSE.receiver.rx} ry={CLOSE.receiver.ry} fill={mix(C.inkSoft, C.saffronDeep, receive * 0.6)} {...ink} />
      {/* glass glints: the rims are windows */}
      <ellipse cx={em.x - CLOSE.emitter.rx * 0.38} cy={em.y - CLOSE.emitter.ry * 0.35} rx={CLOSE.emitter.rx * 0.22} ry={CLOSE.emitter.ry * 0.22} fill={C.cream} opacity={0.85} />
      <ellipse cx={rc.x - CLOSE.receiver.rx * 0.38} cy={rc.y - CLOSE.receiver.ry * 0.35} rx={CLOSE.receiver.rx * 0.22} ry={CLOSE.receiver.ry * 0.22} fill={C.cream} opacity={0.7} />
      {/* box: side, top, front */}
      <path d={side} fill={C.tealDeep} {...ink} />
      <path d={top} fill={mix(C.teal, C.tealLight, 0.45)} {...ink} />
      <rect x={B.x0} y={B.y0} width={B.x1 - B.x0} height={B.y1 - B.y0} rx={B.r} fill={C.teal} {...ink} />
      <defs>
        <clipPath id={`cf${uid}`}>
          <rect x={B.x0} y={B.y0} width={B.x1 - B.x0} height={B.y1 - B.y0} rx={B.r} />
        </clipPath>
        <clipPath id={`cd${uid}`}>
          <rect x={dsp.x} y={dsp.y} width={dsp.w} height={dh} rx={dsp.r} />
        </clipPath>
      </defs>
      <g clipPath={`url(#cf${uid})`}>
        <rect x={B.x0 - 4} y={B.y1 - CLOSE.band} width={B.x1 - B.x0 + 8} height={CLOSE.band + 4} fill={C.coral} />
        <line x1={B.x0} y1={B.y1 - CLOSE.band} x2={B.x1} y2={B.y1 - CLOSE.band} stroke={C.ink} strokeWidth={5} />
      </g>
      <rect x={B.x0} y={B.y0} width={B.x1 - B.x0} height={B.y1 - B.y0} rx={B.r} fill="none" {...ink} />
      {/* display: cream glass, the timeline inside, an ink bezel */}
      <rect x={dsp.x - 10} y={dsp.y - 10} width={dsp.w + 20} height={dh + 20} rx={dsp.r + 8} fill={C.tealDeep} stroke={C.ink} strokeWidth={4} />
      <rect x={dsp.x} y={dsp.y} width={dsp.w} height={dh} rx={dsp.r} fill={C.cream} />
      <g clipPath={`url(#cd${uid})`} opacity={f2(0.55 + 0.45 * clamp01(displayLit))}>
        {display}
      </g>
      <rect x={dsp.x} y={dsp.y} width={dsp.w} height={dh} rx={dsp.r} fill="none" stroke={C.ink} strokeWidth={5} />
      {/* stopwatch glyph beside the display */}
      <Stopwatch x={sw2.x} y={sw2.y} r={sw2.r} hand={hand} running={running} />
      {/* LED and a small button */}
      <circle cx={CLOSE.led.x} cy={CLOSE.led.y} r={CLOSE.led.r} fill={mix(mix(C.tealDeep, C.inkSoft, 0.4), C.saffron, clamp01(led))} stroke={C.ink} strokeWidth={4} />
      {led > 0.3 && <circle cx={CLOSE.led.x - 4} cy={CLOSE.led.y - 4} r={4} fill={C.cream} opacity={led} />}
      <rect x={CLOSE.led.x - 22} y={CLOSE.led.y + 30} width={44} height={22} rx={7} fill={C.tealLight} stroke={C.ink} strokeWidth={4} />
      {/* the checker's mitt */}
      {mitt > 0.001 && <Mitt t={mitt} press={press} />}
    </svg>
  );
};

/** Stopwatch glyph: cream dial, ink rim, a crown, 12 ticks, one hand. */
const Stopwatch: React.FC<{x: number; y: number; r: number; hand: number; running: number}> = ({x, y, r, hand, running}) => {
  const a = hand * Math.PI * 2;
  const run = clamp01(running);
  return (
    <g>
      <rect x={x - 12} y={y - r - 26} width={24} height={22} rx={6} fill={C.inkSoft} stroke={C.ink} strokeWidth={4} />
      <rect x={x - 20} y={y - r - 34} width={40} height={12} rx={5} fill={mix(C.inkSoft, C.saffron, run)} stroke={C.ink} strokeWidth={4} />
      <circle cx={x} cy={y} r={r} fill={C.cream} stroke={C.ink} strokeWidth={6} />
      {run > 0.01 && <circle cx={x} cy={y} r={r - 9} fill="none" stroke={C.saffron} strokeWidth={6} opacity={f2(0.8 * run)} />}
      {Array.from({length: 12}, (_, i) => {
        const t = (i / 12) * Math.PI * 2;
        const r0 = r - (i % 3 === 0 ? 18 : 12);
        return <line key={i} x1={f2(x + Math.sin(t) * r0)} y1={f2(y - Math.cos(t) * r0)} x2={f2(x + Math.sin(t) * (r - 6))} y2={f2(y - Math.cos(t) * (r - 6))} stroke={C.inkSoft} strokeWidth={i % 3 === 0 ? 4 : 2.5} strokeLinecap="round" />;
      })}
      <line x1={x} y1={y} x2={f2(x + Math.sin(a) * (r - 14))} y2={f2(y - Math.cos(a) * (r - 14))} stroke={C.coralDeep} strokeWidth={6} strokeLinecap="round" />
      <circle cx={x} cy={y} r={7} fill={C.ink} />
    </g>
  );
};

/**
 * The checker's mitt (Character.tsx's mitt-with-thumb, at close-up scale) on her coral cardigan cuff and sleeve, coming
 * in from the lower left. t = 0 (off frame) .. 1 (the palm's edge on TAP_POINT); press squashes the mitt a touch.
 */
const MITT_S = 4.2;
const Mitt: React.FC<{t: number; press: number}> = ({t, press}) => {
  const look = CAST.checker;
  const tip = TAP_POINT;
  // the forearm's direction: from the lower left (her side of the stand), angled up toward the display
  const dir = {x: 0.62, y: -0.78};
  const off = (1 - t) * 760; // slides along its own axis
  const hx = tip.x - dir.x * (36 * MITT_S * 0.5 + off);
  const hy = tip.y - dir.y * (36 * MITT_S * 0.5 + off);
  const ang = (Math.atan2(dir.y, dir.x) * 180) / Math.PI + 90; // the mitt's "up" along the arm
  const sq = 1 - 0.07 * clamp01(press);
  const elbow = {x: hx - dir.x * 520, y: hy - dir.y * 520};
  const W = 30 * MITT_S;
  return (
    <g>
      {/* sleeve (cardigan) and forearm skin, ink outline */}
      <path d={`M ${f2(elbow.x)} ${f2(elbow.y)} L ${f2(hx - dir.x * 40)} ${f2(hy - dir.y * 40)}`} stroke={C.ink} strokeWidth={W + 12} strokeLinecap="round" />
      <path d={`M ${f2(elbow.x)} ${f2(elbow.y)} L ${f2(hx - dir.x * 150)} ${f2(hy - dir.y * 150)}`} stroke={look.overlayColor ?? C.coral} strokeWidth={W} strokeLinecap="round" />
      <path d={`M ${f2(hx - dir.x * 150)} ${f2(hy - dir.y * 150)} L ${f2(hx - dir.x * 40)} ${f2(hy - dir.y * 40)}`} stroke={look.skin} strokeWidth={W} strokeLinecap="butt" />
      {/* cuff line */}
      <path d={`M ${f2(hx - dir.x * 150 - dir.y * W * 0.5)} ${f2(hy - dir.y * 150 + dir.x * W * 0.5)} L ${f2(hx - dir.x * 150 + dir.y * W * 0.5)} ${f2(hy - dir.y * 150 - dir.x * W * 0.5)}`} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
      {/* the mitt with a thumb */}
      <g transform={`translate(${f2(hx)} ${f2(hy)}) rotate(${f2(ang)}) scale(${f2(MITT_S)} ${f2(MITT_S * sq)})`}>
        <ellipse cx={0} cy={-2} rx={20} ry={18} fill={look.skin} stroke={C.ink} strokeWidth={6 / MITT_S} />
        <ellipse cx={14} cy={8} rx={8} ry={10} fill={look.skin} stroke={C.ink} strokeWidth={6 / MITT_S} transform="rotate(30)" />
        <ellipse cx={14} cy={8} rx={6} ry={8} fill={look.skin} transform="rotate(30)" />
      </g>
    </g>
  );
};

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const k = clamp01(t);
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
