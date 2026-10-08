import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {rand} from '../../lib/anim';
import {E, drop, tw} from '../../lib/motion';
import {DeliveryBotG, mixEyes} from './DeliveryBot';
import {WH_COLORS} from './Warehouse';

/**
 * S8.4 (s43): "what's still hard" as a 2×2 strip of small vignettes, one tile per spoken beat, on a paper board that
 * the scene slides over the warehouse. Every tile is set up (its props visible) when the board lands; its action and
 * its label start on its cue word, then it settles and holds.
 *
 *   1 "short range"                  the robot's pulses fade out before they reach a far wall
 *   2 "dark or shiny walls"          a dark wall swallows a pulse; a shiny wall bounces one away (not back)
 *   3 "bright sunlight"              the sun floods the robot's sensor; the robot squints
 *   4 "fast math on small hardware"  a heap of numbers pours in beside a tiny chip, which sweats
 *
 * and, on "early-stage", a tag across the middle: "early-stage prototype (authors)".
 * All motion is a pure function of `g` (global frame) and the cue frames.
 */
export type VignetteCues = {
  short: number;
  dark: number;
  shiny: number;
  bright: number;
  sunlight: number;
  fast: number;
  math: number;
  small: number;
  early: number;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ink = (w = OUTLINE) => ({stroke: C.ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});

/** Tile geometry (board px). */
export const TILE = {w: 810, h: 370, x0: 130, x1: 980, y0: 60, y1: 456};
/** Floor line inside every tile (tile px). */
const FLOOR = 336;
const TILES = [
  {x: TILE.x0, y: TILE.y0},
  {x: TILE.x1, y: TILE.y0},
  {x: TILE.x0, y: TILE.y1},
  {x: TILE.x1, y: TILE.y1},
];

/** The robot's sensor head on a little stand, facing +x (same shapes and colours as DeliveryBot's head). */
const SensorHead: React.FC<{x: number; y: number; s?: number; flash?: number}> = ({x, y, s = 1.7, flash = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-6} y={0} width={13} height={44} rx={4} fill={C.cream} {...ink(3.5 / s)} />
    <rect x={-22} y={42} width={44} height={12} rx={6} fill={C.teal} {...ink(3.5 / s)} />
    <rect x={-20} y={-15} width={42} height={29} rx={9} fill={C.teal} {...ink(OUTLINE / s)} />
    <path d="M 22 -15 L 39 -17 L 39 12 L 22 14 Z" fill={C.tealDeep} {...ink(OUTLINE / s)} />
    <path d="M 25.5 -9.5 L 35.5 -10.8 L 35.5 6.8 L 25.5 8 Z" fill="#1D3540" stroke={C.ink} strokeWidth={2.5 / s} />
    <circle cx={30.5} cy={-1.3} r={3.4 + flash * 1.2} fill={flash > 0.05 ? C.saffronLight : C.saffron} />
  </g>
);

/** A travelling pulse dot (flat, ink outline, cream core), `I` 0..1 intensity (paler, smaller). */
const Dot: React.FC<{x: number; y: number; r?: number; I?: number; op?: number}> = ({x, y, r = 13, I = 1, op = 1}) => (
  <g opacity={op}>
    <circle cx={x} cy={y} r={r * (0.55 + 0.45 * I)} fill={I > 0.5 ? C.saffron : C.saffronLight} stroke={C.ink} strokeWidth={3.5} />
    <circle cx={x - r * 0.25} cy={y - r * 0.25} r={r * 0.28 * (0.55 + 0.45 * I)} fill={C.cream} opacity={0.7} />
  </g>
);

const Label: React.FC<{text: string; t: number}> = ({text, t}) => {
  if (t <= 0) return null;
  const s = 0.86 + 0.14 * E.back(clamp01(t));
  return (
    <text
      x={30}
      y={62}
      fontFamily={F.display}
      fontWeight={600}
      fontSize={48}
      fill={C.ink}
      opacity={clamp01(t * 2.2)}
      transform={`translate(30 46) scale(${s}) translate(-30 -46)`}
    >
      {text}
    </text>
  );
};

/* ------------------------------------------------------------------ tile 1: short range */

const TileRange: React.FC<{f: number}> = ({f}) => {
  // f: frames since "short"
  const bot = {x: 150, y: FLOOR, s: 0.9};
  const em = {x: bot.x + 40 * bot.s, y: bot.y - 199 * bot.s};
  const fade = 330; // px from the window to where a pulse has faded to nothing
  const speed = 12; // px per frame
  const emits = [-2, 12, 26];
  const pulseOf = (k: number) => {
    const age = f - emits[k];
    if (age < 0) return null;
    const d = age * speed;
    if (d > fade) return null;
    return d;
  };
  // the settled trail: dots that a pulse has passed stay, paler with distance
  const trail = [40, 85, 130, 175, 220, 265, 300];
  const first = f - emits[0];
  const ping = emits.reduce((acc, e) => {
    const a = f - e;
    return a >= 0 && a < 16 ? a / 16 : acc;
  }, 0);
  return (
    <g>
      <line x1={26} y1={bot.y} x2={784} y2={bot.y} {...ink()} />
      {/* the far wall */}
      <rect x={706} y={96} width={52} height={bot.y - 96} rx={6} fill={WH_COLORS.relayWall} {...ink()} />
      <rect x={706} y={bot.y - 16} width={52} height={16} fill={C.cream} {...ink(3)} />
      {trail.map((d, i) => {
        if (first * speed < d) return null;
        const I = 1 - d / fade;
        return <circle key={i} cx={em.x + d} cy={em.y} r={4 + 6 * I} fill={C.saffronDeep} opacity={0.25 + 0.6 * I} />;
      })}
      {emits.map((_, k) => {
        const d = pulseOf(k);
        if (d === null) return null;
        const I = 1 - d / fade;
        return <Dot key={k} x={em.x + d} y={em.y} r={14} I={I} op={clamp01(I * 1.6)} />;
      })}
      <g transform={`translate(${bot.x} ${bot.y}) scale(${bot.s})`}>
        <DeliveryBotG eyes="neutral" pulse={ping} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ tile 2: dark or shiny walls */

const TileWalls: React.FC<{fd: number; fs: number}> = ({fd, fs}) => {
  // left half: the dark wall swallows the pulse
  const sL = {x: 70, y: FLOOR - 92};
  const emL = {x: sL.x + 39 * 1.7, y: sL.y - 1.3 * 1.7};
  const wallL = 318;
  const travelL = 16;
  const uL = clamp01(fd / travelL);
  const pL = {x: emL.x + (wallL - emL.x) * uL, y: emL.y};
  const swallow = clamp01((fd - travelL) / 7);
  // right half: the shiny wall bounces it away
  const sR = {x: 470, y: FLOOR - 92};
  const emR = {x: sR.x + 39 * 1.7, y: sR.y - 1.3 * 1.7};
  const hitR = {x: 718, y: 186};
  const dir = {x: hitR.x - emR.x, y: hitR.y - emR.y};
  const out = {x: hitR.x - dir.x * 0.72, y: hitR.y + dir.y * 0.72};
  const inDur = 13;
  const outDur = 13;
  const uIn = clamp01(fs / inDur);
  const uOut = clamp01((fs - inDur) / outDur);
  const pIn = {x: emR.x + dir.x * uIn, y: emR.y + dir.y * uIn};
  const pOut = {x: hitR.x + (out.x - hitR.x) * uOut, y: hitR.y + (out.y - hitR.y) * uOut};
  const ringU = clamp01((fs - inDur) / 12);
  const arrowA = Math.atan2(out.y - hitR.y, out.x - hitR.x);
  const ah = (a: number) => ({x: out.x - Math.cos(arrowA + a) * 26, y: out.y - Math.sin(arrowA + a) * 26});
  const sub = (text: string, x: number, t: number) =>
    t > 0 ? (
      <text x={x} y={128} fontFamily={F.body} fontWeight={800} fontSize={36} fill={C.inkSoft} opacity={clamp01(t * 2)}>
        {text}
      </text>
    ) : null;
  return (
    <g>
      <line x1={405} y1={96} x2={405} y2={FLOOR + 10} stroke={C.paperLine} strokeWidth={4} strokeLinecap="round" />
      <line x1={26} y1={FLOOR} x2={384} y2={FLOOR} {...ink()} />
      <line x1={426} y1={FLOOR} x2={784} y2={FLOOR} {...ink()} />
      {/* dark wall */}
      <rect x={wallL} y={140} width={40} height={FLOOR - 140} rx={5} fill={C.inkSoft} {...ink()} />
      {sub('dark', 40, tw(fd, 0, 8))}
      {fd > 0 && <line x1={emL.x} y1={emL.y} x2={Math.min(pL.x, wallL)} y2={pL.y} stroke={C.saffronDeep} strokeWidth={6} strokeLinecap="round" opacity={0.85} />}
      {fd > 0 && swallow < 1 && <Dot x={pL.x} y={pL.y} r={14 * (1 - swallow)} I={1 - swallow * 0.7} op={1 - swallow * 0.5} />}
      <SensorHead x={sL.x} y={sL.y} flash={fd > 0 && fd < 10 ? Math.sin((fd / 10) * Math.PI) : 0} />
      {/* shiny wall: pale blue with two flat glints */}
      <rect x={718} y={140} width={40} height={FLOOR - 140} rx={5} fill={C.blueLight} {...ink()} />
      <line x1={728} y1={234} x2={748} y2={208} stroke={C.white} strokeWidth={6} strokeLinecap="round" />
      <line x1={728} y1={272} x2={748} y2={246} stroke={C.white} strokeWidth={4} strokeLinecap="round" />
      {sub('shiny', 440, tw(fs, 0, 8))}
      {fs > 0 && <line x1={emR.x} y1={emR.y} x2={pIn.x} y2={pIn.y} stroke={C.saffronDeep} strokeWidth={6} strokeLinecap="round" opacity={0.85} />}
      {uOut > 0 && <line x1={hitR.x} y1={hitR.y} x2={pOut.x} y2={pOut.y} stroke={C.saffronDeep} strokeWidth={5} strokeLinecap="round" opacity={0.75} />}
      {uOut >= 1 && <path d={`M ${ah(0.5).x} ${ah(0.5).y} L ${out.x} ${out.y} L ${ah(-0.5).x} ${ah(-0.5).y}`} fill="none" stroke={C.saffronDeep} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />}
      {ringU > 0 && ringU < 1 && <circle cx={hitR.x} cy={hitR.y} r={8 + 30 * E.out(ringU)} fill="none" stroke={C.saffronDeep} strokeWidth={4} opacity={(1 - ringU) * 0.9} />}
      {fs > 0 && uOut < 1 && <Dot x={uIn < 1 ? pIn.x : pOut.x} y={uIn < 1 ? pIn.y : pOut.y} r={13} I={uIn < 1 ? 1 : 0.8} />}
      <SensorHead x={sR.x} y={sR.y} flash={fs > 0 && fs < 10 ? Math.sin((fs / 10) * Math.PI) : 0} />
    </g>
  );
};

/* ------------------------------------------------------------------ tile 3: bright sunlight */

const TileSun: React.FC<{fb: number; fl: number}> = ({fb, fl}) => {
  // fb: frames since "bright" (the sun comes up); fl: frames since "sunlight" (it floods the sensor)
  const bot = {x: 210, y: FLOOR, s: 0.9};
  const head = {x: bot.x + 30 * bot.s, y: bot.y - 199 * bot.s};
  const rise = E.out(clamp01(fb / 16));
  const sun = {x: 640, y: 400 - 272 * rise, r: 54};
  const flood = E.out(clamp01(fl / 10));
  const squint = clamp01((fl - 4) / 6);
  // the light wedge: from the sun's disc to a wide patch round the sensor head
  const wedgeR = 34 + 62 * flood;
  const ang = Math.atan2(head.y - sun.y, head.x - sun.x);
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);
  const wedge = [
    {x: sun.x + nx * sun.r * 0.9, y: sun.y + ny * sun.r * 0.9},
    {x: head.x + nx * wedgeR, y: head.y + ny * wedgeR},
    {x: head.x - nx * wedgeR, y: head.y - ny * wedgeR},
    {x: sun.x - nx * sun.r * 0.9, y: sun.y - ny * sun.r * 0.9},
  ];
  const ping = fb >= -2 && fb < 14 ? clamp01((fb + 2) / 16) : 0;
  return (
    <g>
      <defs>
        <clipPath id="s8-sunclip">
          <rect x={4} y={4} width={TILE.w - 8} height={TILE.h - 8} rx={18} />
        </clipPath>
      </defs>
      <g clipPath="url(#s8-sunclip)">
        {flood > 0 && (
          // one group opacity, so the wedge and the disc read as one flat patch of light (no darker overlap)
          <g opacity={0.9 * flood}>
            <path d={`M ${wedge.map((p) => `${p.x} ${p.y}`).join(' L ')} Z`} fill={C.saffronLight} />
            <circle cx={head.x} cy={head.y} r={wedgeR} fill={C.saffronLight} />
          </g>
        )}
        {fb > 0 && (
          <g transform={`translate(${sun.x} ${sun.y})`}>
            {Array.from({length: 12}, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const r0 = sun.r + 10;
              const r1 = sun.r + 34;
              const w = 0.13;
              return <path key={i} d={`M ${Math.cos(a - w) * r0} ${Math.sin(a - w) * r0} L ${Math.cos(a) * r1} ${Math.sin(a) * r1} L ${Math.cos(a + w) * r0} ${Math.sin(a + w) * r0} Z`} fill={C.saffron} {...ink(3)} />;
            })}
            <circle r={sun.r} fill={C.saffron} {...ink()} />
          </g>
        )}
      </g>
      <line x1={26} y1={bot.y} x2={784} y2={bot.y} {...ink()} />
      <g transform={`translate(${bot.x} ${bot.y}) scale(${bot.s})`}>
        <DeliveryBotG eyes={mixEyes('neutral', 'cautious', squint)} look={-0.2 * squint} blink={fl > 3 && fl < 7 ? 0.2 : 1} pulse={flood > 0.3 ? 0 : ping} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ tile 4: fast math on small hardware */

const HEAP: {x: number; y: number; d: string; rot: number; tone: string}[] = (() => {
  // a mound of digits, bottom row first (the pour fills it bottom-up)
  const rows = [
    {n: 12, y: 328, hw: 205},
    {n: 11, y: 296, hw: 186},
    {n: 9, y: 264, hw: 160},
    {n: 8, y: 232, hw: 134},
    {n: 6, y: 200, hw: 102},
    {n: 4, y: 168, hw: 68},
    {n: 2, y: 138, hw: 28},
  ];
  const cx = 296;
  const out: {x: number; y: number; d: string; rot: number; tone: string}[] = [];
  let k = 0;
  for (const r of rows) {
    for (let i = 0; i < r.n; i++) {
      const u = r.n === 1 ? 0.5 : i / (r.n - 1);
      out.push({
        x: cx - r.hw + 2 * r.hw * u + (rand(400 + k) - 0.5) * 12,
        y: r.y + (rand(500 + k) - 0.5) * 8,
        d: String(Math.floor(rand(600 + k) * 10)),
        rot: (rand(700 + k) - 0.5) * 36,
        tone: rand(800 + k) > 0.82 ? C.tealDeep : rand(900 + k) > 0.82 ? C.coralDeep : C.ink,
      });
      k++;
    }
  }
  return out;
})();

/** Half-width of the heap at height y (tile px), interpolated between its rows. */
const HEAP_ROWS = [
  {y: 328, hw: 205},
  {y: 296, hw: 186},
  {y: 264, hw: 160},
  {y: 232, hw: 134},
  {y: 200, hw: 102},
  {y: 168, hw: 68},
  {y: 138, hw: 28},
];
const heapHalfWidth = (y: number) => {
  for (let i = 0; i < HEAP_ROWS.length - 1; i++) {
    const a = HEAP_ROWS[i];
    const b = HEAP_ROWS[i + 1];
    if (y <= a.y && y >= b.y) return a.hw + ((b.hw - a.hw) * (a.y - y)) / (a.y - b.y);
  }
  return y > HEAP_ROWS[0].y ? HEAP_ROWS[0].hw : HEAP_ROWS[HEAP_ROWS.length - 1].hw;
};

/**
 * Late digits that land on the heap's slopes after "small" (one every 10 frames until the tag). Each one is placed
 * just outside the heap where it overlaps no heap digit and no earlier late digit (so glyphs never print on top of
 * each other), and stays left of the chip's legs.
 */
const TRICKLE = (() => {
  const out: {x: number; y: number; d: string; rot: number; tone: string}[] = [];
  const clear = (x: number, y: number) => [...HEAP, ...out].every((h) => Math.abs(h.x - x) >= 30 || Math.abs(h.y - y) >= 32);
  for (let j = 0; j < 10; j++) {
    const side = j % 2 ? 1 : -1;
    const y = 300 - Math.floor(j / 2) * 34 + (rand(1200 + j) - 0.5) * 6;
    let off = heapHalfWidth(y) + 30 + (rand(1100 + j) - 0.5) * 6;
    let x = 296 + side * off;
    while (!clear(x, y) && off < heapHalfWidth(y) + 90) {
      off += 4;
      x = 296 + side * off;
    }
    x = Math.max(36, Math.min(556, x));
    out.push({x, y, d: String(Math.floor(rand(1300 + j) * 10)), rot: (rand(1400 + j) - 0.5) * 40, tone: j % 3 === 0 ? C.tealDeep : C.ink});
  }
  return out;
})();

const TileChip: React.FC<{ff: number; fm: number; fsm: number; fe: number}> = ({ff, fm, fsm, fe}) => {
  // ff: frames since "fast"; fm: since "math"; fsm: since "small"
  const chip = {x: 640, y: FLOOR - 49, w: 96, h: 74};
  // the digits pour in, bottom rows first: arrival spread over "fast" .. "small"
  const span = Math.max(12, fsm - ff);
  const n = HEAP.length;
  const strain = clamp01(fsm / 10);
  const lookL = clamp01(ff / 8);
  const alarm = clamp01(fm / 6);
  const sweat = (delay: number) => {
    const a = fsm - delay;
    if (a < 0) return null;
    const u = clamp01(a / 22);
    return {y: 18 * E.inOut(u), op: 1};
  };
  const s1 = sweat(2);
  const s2 = sweat(12);
  const squash = 1 - 0.05 * strain;
  return (
    <g>
      <defs>
        <clipPath id="s8-heapclip">
          <rect x={0} y={90} width={TILE.w} height={TILE.h - 90} />
        </clipPath>
      </defs>
      <line x1={26} y1={FLOOR} x2={784} y2={FLOOR} {...ink()} />
      <g clipPath="url(#s8-heapclip)">
      {HEAP.map((h, i) => {
        // landing frame of digit i, in frames since "fast" (bottom rows first, all in before "small")
        const land = (i / n) * span;
        if (ff < land - 9) return null;
        const dy = drop(ff, land, 230, 9);
        return (
          <text
            key={i}
            x={h.x}
            y={h.y + dy}
            textAnchor="middle"
            fontFamily={F.mono}
            fontWeight={700}
            fontSize={36}
            fill={h.tone}
            transform={`rotate(${h.rot} ${h.x} ${h.y + dy - 14})`}
          >
            {h.d}
          </text>
        );
      })}
      {/* the numbers keep coming, a few more at a time, until the tag lands */}
      {TRICKLE.map((h, j) => {
        const window = fsm - fe; // frames from "small" to "early-stage"
        const land = 8 + j * 10;
        if (land > window - 4 || fsm < land - 9) return null;
        const dy = drop(fsm, land, 200, 9);
        return (
          <text key={`tr${j}`} x={h.x} y={h.y + dy} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={36} fill={h.tone} transform={`rotate(${h.rot} ${h.x} ${h.y + dy - 14})`}>
            {h.d}
          </text>
        );
      })}
      </g>
      {/* the tiny chip: legs, body, eyes looking at the heap, a strained mouth */}
      <g transform={`translate(${chip.x} ${chip.y + chip.h / 2}) scale(${1 + 0.04 * strain} ${squash}) translate(${-chip.x} ${-(chip.y + chip.h / 2)})`}>
        {[0, 1, 2, 3].map((i) => {
          const y = chip.y - chip.h / 2 + 14 + i * 16;
          return (
            <g key={i}>
              <line x1={chip.x - chip.w / 2 - 14} y1={y} x2={chip.x - chip.w / 2} y2={y} {...ink(5)} />
              <line x1={chip.x + chip.w / 2} y1={y} x2={chip.x + chip.w / 2 + 14} y2={y} {...ink(5)} />
            </g>
          );
        })}
        {[0, 1, 2, 3].map((i) => {
          const x = chip.x - chip.w / 2 + 18 + i * 20;
          return <line key={`b${i}`} x1={x} y1={chip.y + chip.h / 2} x2={x} y2={chip.y + chip.h / 2 + 12} {...ink(5)} />;
        })}
        <rect x={chip.x - chip.w / 2} y={chip.y - chip.h / 2} width={chip.w} height={chip.h} rx={10} fill={C.blue} {...ink()} />
        <circle cx={chip.x - chip.w / 2 + 12} cy={chip.y - chip.h / 2 + 12} r={4} fill={C.blueLight} />
        {/* eyes */}
        {[-1, 1].map((sd) => (
          <g key={sd}>
            <ellipse cx={chip.x + sd * 18} cy={chip.y - 6} rx={11 + 2 * alarm} ry={12 + 3 * alarm - 5 * strain} fill={C.white} {...ink(3)} />
            <circle cx={chip.x + sd * 18 - 5 * lookL} cy={chip.y - 6} r={4.5} fill={C.ink} />
          </g>
        ))}
        <path d={`M ${chip.x - 16} ${chip.y + 20} Q ${chip.x - 8} ${chip.y + 14 + 6 * strain} ${chip.x} ${chip.y + 20} Q ${chip.x + 8} ${chip.y + 26 - 6 * strain} ${chip.x + 16} ${chip.y + 20}`} fill="none" {...ink(3.5)} />
      </g>
      {/* sweat drops */}
      {[s1, s2].map((s, i) =>
        s ? (
          <path
            key={i}
            d={`M 0 -13 Q 9 0 0 8 Q -9 0 0 -13 Z`}
            transform={`translate(${chip.x + chip.w / 2 + 6 - i * 16} ${chip.y - chip.h / 2 - 10 + s.y + i * 8}) scale(1.6)`}
            fill={C.tealLight}
            {...ink(2)}
            opacity={s.op}
          />
        ) : null,
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ the board */

export const VignetteBoard: React.FC<{g: number; cues: VignetteCues; y?: number; tag?: number; setup?: number}> = ({g, cues, y = 0, tag = 0, setup = -Infinity}) => {
  const tiles: {label: string; t: number; node: React.ReactNode}[] = [
    {label: 'short range', t: tw(g, cues.short, 12, E.linear), node: <TileRange f={g - cues.short} />},
    {label: 'dark or shiny walls', t: tw(g, cues.dark, 12, E.linear), node: <TileWalls fd={g - cues.dark} fs={g - cues.shiny} />},
    {label: 'bright sunlight', t: tw(g, cues.bright, 12, E.linear), node: <TileSun fb={g - cues.bright} fl={g - cues.sunlight} />},
    {label: 'fast math on small hardware', t: tw(g, cues.fast, 12, E.linear), node: <TileChip ff={g - cues.fast} fm={g - cues.math} fsm={g - cues.small} fe={g - cues.early} />},
  ];
  const tagS = tag > 0 ? 1 + 0.22 * (1 - E.out(clamp01(tag))) : 1;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `translateY(${y}px)`}}>
      <div style={{position: 'absolute', left: -40, top: -40, width: 2000, height: 1160, background: C.paper, borderBottom: `${OUTLINE}px solid ${C.ink}`, boxSizing: 'border-box'}} />
      {TILES.map((p, i) => (
        <div key={i} style={{position: 'absolute', left: p.x, top: p.y, width: TILE.w, height: TILE.h, background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 22, boxShadow: `8px 9px 0 ${C.shadow}`, boxSizing: 'border-box', overflow: 'hidden'}}>
          <svg viewBox={`0 0 ${TILE.w} ${TILE.h}`} width={TILE.w - 2 * OUTLINE} height={TILE.h - 2 * OUTLINE} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            {(() => {
              // setup: each tile's props pop in, one after another, as the board lands
              const u = tw(g, setup + i * 6, 12, E.linear);
              if (u <= 0) return null;
              const k = 0.9 + 0.1 * E.back(u);
              return (
                <g opacity={clamp01(u * 2)} transform={`translate(${TILE.w / 2} ${FLOOR}) scale(${k}) translate(${-TILE.w / 2} ${-FLOOR})`}>
                  {tiles[i].node}
                </g>
              );
            })()}
            <Label text={tiles[i].label} t={tiles[i].t} />
          </svg>
        </div>
      ))}
      {tag > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 960,
            top: TILE.y1 + TILE.h + 66,
            transform: `translate(-50%, -50%) rotate(-2deg) scale(${tagS})`,
            opacity: clamp01(tag * 4),
            padding: '16px 40px',
            background: C.saffron,
            border: `${OUTLINE}px solid ${C.ink}`,
            borderRadius: 18,
            boxShadow: `7px 8px 0 ${C.ink}`,
            fontFamily: F.display,
            fontWeight: 600,
            fontSize: 50,
            color: C.ink,
            whiteSpace: 'nowrap',
            lineHeight: 1.05,
          }}
        >
          early-stage prototype <span style={{fontFamily: F.body, fontWeight: 800, fontSize: 40, color: C.inkSoft}}>(authors)</span>
        </div>
      )}
    </div>
  );
};
