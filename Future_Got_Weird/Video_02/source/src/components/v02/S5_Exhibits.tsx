import React from 'react';
import {C, F} from '../../theme';

/**
 * S5 exhibits: generic, simplified lab equipment (no brands, no copies of paper figures), drawn in plinth-local px
 * (origin at the plinth's centre on top of its wood slab; y up is negative). Each exhibit is a <g> for the one world
 * SVG of the gallery. Outlines are 3 px world (≈ 4 px on screen in the 1.4× close-ups).
 *
 *  - Exhibit2012: a lab table filled edge to edge: a boxy laser with a streak-camera box on a riser above it, a rod
 *    with two mirrors, a small coral screen, a tiny wooden artist's mannequin, and a small upright wall. The beam goes
 *    laser → mirror → mirror → wall; light scatters wall → mannequin → wall → camera (later bounces thinner, paler).
 *    `sketch` draws the recovered 3D outline of the mannequin rising out of the exhibit.
 *  - Exhibit2018: a compact laser + detector unit on a stand aimed at a small board facing us (the spot glyph hops
 *    across it in a raster), a laptop, a coral screen and a small reflective exit sign (a pictogram, no text).
 *    `WallClock` hangs on the gallery wall next to it.
 *  - Exhibit2021: a big laser box with a monitor and a strip-shaped detector on top, a coral screen, ordinary objects
 *    (a ball and a wooden block) and a small upright wall. The monitor plays a blobby picture updated 5 times a second.
 */

export type Pt = {x: number; y: number};
const OL = 3;
const ink = (w = OL) => ({stroke: C.ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});
const f2 = (n: number) => Math.round(n * 100) / 100;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const E_inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** gentle overshoot ease (as motion E.back) without importing remotion here */
const E_back = (t: number) => {
  const c1 = 1.70158 * 0.6;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/* ------------------------------------------------------------------ shared glyphs */

/** The wall-spot glyph used in the plan (S4's lit wall spot): a saffron diamond with an ink outline. */
export const SpotGlyph: React.FC<{x: number; y: number; s?: number; t?: number}> = ({x, y, s = 13, t = 1}) => {
  if (t <= 0.001) return null;
  const k = s * Math.min(1.15, t);
  return <path d={`M ${f2(x)} ${f2(y - k)} L ${f2(x + k)} ${f2(y)} L ${f2(x)} ${f2(y + k)} L ${f2(x - k)} ${f2(y)} Z`} fill={C.saffron} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" opacity={Math.min(1, t * 2)} />;
};

/** A straight light segment drawn from a toward b (t = 0..1). */
export const Seg: React.FC<{a: Pt; b: Pt; t: number; color?: string; w?: number; op?: number; dash?: string}> = ({a, b, t, color = C.coral, w = 4, op = 1, dash}) => {
  if (t <= 0.001 || op <= 0.001) return null;
  const e = {x: lerp(a.x, b.x, clamp01(t)), y: lerp(a.y, b.y, clamp01(t))};
  return <line x1={f2(a.x)} y1={f2(a.y)} x2={f2(e.x)} y2={f2(e.y)} stroke={color} strokeWidth={w} strokeLinecap="round" opacity={op} strokeDasharray={dash} />;
};

/** A stadium (capsule) path from a to b with width w. */
const capsule = (a: Pt, b: Pt, w: number) => {
  const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const u = {x: (b.x - a.x) / L, y: (b.y - a.y) / L};
  const n = {x: -u.y, y: u.x};
  const r = w / 2;
  return `M ${f2(a.x + n.x * r)} ${f2(a.y + n.y * r)} L ${f2(b.x + n.x * r)} ${f2(b.y + n.y * r)} A ${f2(r)} ${f2(r)} 0 0 0 ${f2(b.x - n.x * r)} ${f2(b.y - n.y * r)} L ${f2(a.x - n.x * r)} ${f2(a.y - n.y * r)} A ${f2(r)} ${f2(r)} 0 0 0 ${f2(a.x + n.x * r)} ${f2(a.y + n.y * r)} Z`;
};

/* ------------------------------------------------------------------ the mannequin */

type MannequinPart = {kind: 'cap'; a: Pt; b: Pt; w: number} | {kind: 'ell'; c: Pt; rx: number; ry: number};
/** A small wooden artist's mannequin, feet at (0, 0), about 100 px tall. Painted back to front. */
const MANNEQUIN: MannequinPart[] = [
  {kind: 'cap', a: {x: -6, y: -44}, b: {x: -9, y: -4}, w: 9},
  {kind: 'cap', a: {x: 6, y: -44}, b: {x: 9, y: -4}, w: 9},
  {kind: 'cap', a: {x: -12, y: -75}, b: {x: -18, y: -44}, w: 7},
  {kind: 'ell', c: {x: 0, y: -48}, rx: 11, ry: 8},
  {kind: 'ell', c: {x: 0, y: -57}, rx: 4.5, ry: 4.5},
  {kind: 'ell', c: {x: 0, y: -69}, rx: 13, ry: 12},
  {kind: 'cap', a: {x: 12, y: -75}, b: {x: 18, y: -44}, w: 7},
  {kind: 'cap', a: {x: 0, y: -79}, b: {x: 0, y: -84}, w: 5},
  {kind: 'ell', c: {x: 0, y: -91}, rx: 7.5, ry: 9.5},
];
/** cross-sections that make the sketch read as a 3D shape */
const SECTIONS = [
  {c: {x: 0, y: -69}, rx: 14.5, ry: 4},
  {c: {x: 0, y: -48}, rx: 12.5, ry: 3.6},
  {c: {x: 0, y: -91}, rx: 8.5, ry: 2.6},
  {c: {x: -7.5, y: -24}, rx: 5.5, ry: 1.8},
  {c: {x: 7.5, y: -24}, rx: 5.5, ry: 1.8},
];

export const Mannequin: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${f2(x)} ${f2(y)}) scale(${s})`}>
    <ellipse cx={0} cy={-1} rx={20} ry={5} fill={C.woodDeep} {...ink(2.5)} />
    <rect x={-2} y={-46} width={4} height={44} fill={C.woodDeep} />
    {MANNEQUIN.map((p, i) =>
      p.kind === 'cap' ? (
        <path key={i} d={capsule(p.a, p.b, p.w)} fill={C.woodLight} {...ink(2.5)} />
      ) : (
        <ellipse key={i} cx={p.c.x} cy={p.c.y} rx={p.rx} ry={p.ry} fill={i === 4 ? C.wood : C.woodLight} {...ink(2.5)} />
      ),
    )}
  </g>
);

/** The recovered shape as a sketchy teal 3D outline: `draw` 0..1 draws the strokes on. Feet at (x, y), scale s. */
export const MannequinSketch: React.FC<{x: number; y: number; s: number; draw: number; opacity?: number}> = ({x, y, s, draw, opacity = 1}) => {
  if (draw <= 0.001) return null;
  const d = clamp01(draw);
  const sw = 3.2 / s; // keep the on-screen pen weight independent of the sketch scale
  const dash = (k: number) => ({pathLength: 1, strokeDasharray: `${f2(clamp01(d * 1.25 - k * 0.25))} 1`});
  const outline = (dx: number, dy: number, w: number, op: number, key: string) => (
    <g key={key} transform={`translate(${dx} ${dy})`} opacity={op}>
      {MANNEQUIN.map((p, i) =>
        p.kind === 'cap' ? (
          <path key={i} d={capsule(p.a, p.b, p.w)} fill="none" stroke={C.tealDeep} strokeWidth={w} strokeLinecap="round" {...dash(i / MANNEQUIN.length)} />
        ) : (
          <ellipse key={i} cx={p.c.x} cy={p.c.y} rx={p.rx} ry={p.ry} fill="none" stroke={C.tealDeep} strokeWidth={w} strokeLinecap="round" {...dash(i / MANNEQUIN.length)} />
        ),
      )}
    </g>
  );
  const secT = clamp01((d - 0.45) / 0.55);
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(s)})`} opacity={opacity}>
      {/* a pale fill so the shape reads as a solid seen through its outline */}
      <g opacity={0.35 * secT}>
        {MANNEQUIN.map((p, i) =>
          p.kind === 'cap' ? <path key={i} d={capsule(p.a, p.b, p.w)} fill={C.tealLight} /> : <ellipse key={i} cx={p.c.x} cy={p.c.y} rx={p.rx} ry={p.ry} fill={C.tealLight} />,
        )}
      </g>
      {outline(0.9, -0.7, sw * 0.55, 0.45, 'b')}
      {outline(0, 0, sw, 1, 'a')}
      {SECTIONS.map((e, i) => (
        <ellipse key={`s${i}`} cx={e.c.x} cy={e.c.y} rx={e.rx} ry={e.ry} fill="none" stroke={C.teal} strokeWidth={sw * 0.7} strokeDasharray={`${f2(3 / s * 1.6)} ${f2(2.4 / s * 1.6)}`} opacity={secT} />
      ))}
    </g>
  );
};

/* ------------------------------------------------------------------ world labels */

/** A museum label card (cream, ink outline) with a leader to the thing it names. World px. `t` 0..1 pop. */
export const WLabel: React.FC<{x: number; y: number; w: number; text: string; t: number; to?: Pt; from?: Pt; size?: number; h?: number; mono?: boolean}> = ({x, y, w, text, t, to, from, size = 28, h = 52, mono}) => {
  if (t <= 0.001) return null;
  const s = 0.9 + 0.1 * Math.min(1.08, t);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const a = from ?? {x: x + w, y: cy};
  return (
    <g opacity={Math.min(1, t * 1.8)}>
      {to && (
        <g>
          <path d={`M ${f2(a.x)} ${f2(a.y)} L ${f2(to.x)} ${f2(to.y)}`} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
          <circle cx={to.x} cy={to.y} r={5.5} fill={C.cream} stroke={C.ink} strokeWidth={2.5} />
        </g>
      )}
      <g transform={`translate(${f2(cx)} ${f2(cy)}) scale(${f2(s)}) translate(${f2(-cx)} ${f2(-cy)})`}>
        <rect x={x + 6} y={y + 7} width={w} height={h} rx={12} fill={C.shadow} />
        <rect x={x} y={y} width={w} height={h} rx={12} fill={C.cream} {...ink()} />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontFamily={mono ? F.mono : F.body} fontWeight={mono ? 600 : 800} fontSize={size} fill={C.ink}>
          {text}
        </text>
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ 2012 */

/** Plinth-local anchor points of the 2012 exhibit (before hops). */
export const E12 = {
  surface: -62,
  laserPort: {x: -100, y: -92},
  m1: {x: -40, y: -92},
  m2: {x: -40, y: -200},
  wallSpot: {x: 232, y: -222},
  camLens: {x: -22, y: -251},
  mannequin: {x: 182, y: -62},
  chest: {x: 182, y: -131},
  laserLeft: {x: -300, y: -96},
  camLeft: {x: -306, y: -262},
  sketchTo: {x: 440, y: -150},
};

export type Exhibit2012Props = {
  x: number;
  y: number;
  /** item hops (px, negative = up): [laser + camera, mirror rod, screen, mannequin, wall] */
  hop?: number[];
  /** main beam draw-on 0..1 (three segments) */
  beam?: number;
  /** scatter wall → mannequin → wall, 0..1 */
  scatter?: number;
  /** wall → camera, 0..1 */
  view?: number;
  /** laser port flash 0..1 */
  flash?: number;
  sketch?: {draw: number; rise: number};
  /** the camera's direct line toward the mannequin, stopped by the screen (0..1 draw, then a cross) */
  sight?: number;
  /** a marker ring round the tiny mannequin (0..1 draw) */
  ring?: number;
  /** the streak on the camera's panel (0..1 draw; default drawn) */
  streak?: number;
  /** a saffron bracket along the whole table ("filled a table") */
  tableMark?: {draw: number; op: number};
};

export const Exhibit2012: React.FC<Exhibit2012Props> = ({x, y, hop = [0, 0, 0, 0, 0], beam = 0, scatter = 0, view = 0, flash = 0, sketch, sight = 0, ring = 0, streak = 1, tableMark}) => {
  const [hL, hM, hS, hP, hW] = hop;
  const off = (p: Pt, dy: number): Pt => ({x: p.x, y: p.y + dy});
  const port = off(E12.laserPort, hL);
  const m1 = off(E12.m1, hM);
  const m2 = off(E12.m2, hM);
  const spot = off(E12.wallSpot, hW);
  const lens = off(E12.camLens, hL);
  const chest = off(E12.chest, hP);
  const back = off({x: 232, y: -206}, hW);
  // mirror angles: each bisects the incoming and outgoing beam
  const mirrorAngle = (inDir: Pt, outDir: Pt) => {
    const n = {x: outDir.x - inDir.x, y: outDir.y - inDir.y};
    return (Math.atan2(n.y, n.x) * 180) / Math.PI + 90;
  };
  const norm = (v: Pt) => {
    const l = Math.hypot(v.x, v.y) || 1;
    return {x: v.x / l, y: v.y / l};
  };
  const a1 = mirrorAngle({x: 1, y: 0}, {x: 0, y: -1});
  const a2 = mirrorAngle({x: 0, y: -1}, norm({x: E12.wallSpot.x - E12.m2.x, y: E12.wallSpot.y - E12.m2.y}));
  const b1 = clamp01(beam * 3);
  const b2 = clamp01(beam * 3 - 1);
  const b3 = clamp01(beam * 3 - 2);
  const sc1 = clamp01(scatter * 2);
  const sc2 = clamp01(scatter * 2 - 1);
  const sk = sketch && sketch.draw > 0.001 ? sketch : null;
  const rise = sk ? clamp01(sk.rise) : 0;
  const mirror = (c: Pt, ang: number) => (
    <g transform={`translate(${f2(c.x)} ${f2(c.y)}) rotate(${f2(ang)})`}>
      <rect x={-21} y={-6} width={42} height={12} rx={4} fill={C.blueLight} {...ink(2.5)} />
      <line x1={-12} y1={-1.5} x2={8} y2={-1.5} stroke={C.white} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* the lab table */}
      {[-284, 284].map((lx) => (
        <rect key={lx} x={lx - 9} y={-46} width={18} height={46} fill={C.inkSoft} {...ink()} />
      ))}
      <rect x={-312} y={-62} width={624} height={22} rx={6} fill={C.inkMuted} {...ink()} />
      {tableMark && tableMark.draw > 0.001 && tableMark.op > 0.001 && (
        <path d="M -312 -40 L -312 -24 L 312 -24 L 312 -40" fill="none" stroke={C.saffronDeep} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${f2(clamp01(tableMark.draw))} 1`} opacity={tableMark.op} />
      )}

      {/* wall (item 4) */}
      <g transform={`translate(0 ${f2(hW)})`}>
        <rect x={220} y={-70} width={44} height={10} rx={3} fill={C.inkMuted} {...ink(2.5)} />
        <rect x={232} y={-300} width={20} height={234} rx={3} fill={C.cream} {...ink()} />
      </g>
      {/* mannequin (item 3) */}
      <Mannequin x={E12.mannequin.x} y={E12.mannequin.y + hP} />
      {/* screen (item 2) */}
      <g transform={`translate(0 ${f2(hS)})`}>
        <rect x={108} y={-70} width={32} height={8} rx={3} fill={C.coralDeep} {...ink(2.5)} />
        <path d="M 112 -66 L 112 -178 Q 112 -192 124 -192 Q 136 -192 136 -178 L 136 -66 Z" fill={C.coral} {...ink()} />
      </g>
      {/* mirror rod (item 1), under the camera's lens */}
      <g transform={`translate(0 ${f2(hM)})`}>
        <rect x={-60} y={-70} width={40} height={9} rx={3} fill={C.inkSoft} {...ink(2.5)} />
        <rect x={-34} y={-210} width={8} height={144} rx={3} fill={C.inkMuted} {...ink(2.5)} />
        <rect x={-38} y={-100} width={14} height={14} rx={3} fill={C.inkSoft} {...ink(2)} />
        <rect x={-38} y={-207} width={14} height={14} rx={3} fill={C.inkSoft} {...ink(2)} />
      </g>
      {mirror(m1, a1)}
      {mirror(m2, a2)}
      {/* laser + camera stack (item 0) */}
      <g transform={`translate(0 ${f2(hL)})`}>
        <rect x={-300} y={-124} width={188} height={62} rx={8} fill={C.saffron} {...ink()} />
        <rect x={-284} y={-111} width={86} height={34} rx={6} fill={C.saffronLight} {...ink(2.5)} />
        <circle cx={-172} cy={-100} r={8} fill={C.cream} {...ink(2.5)} />
        <circle cx={-144} cy={-100} r={8} fill={C.coral} {...ink(2.5)} />
        <rect x={-112} y={-103} width={13} height={22} rx={3} fill={flash > 0.5 ? C.saffronLight : C.inkSoft} {...ink(2.5)} />
        {/* riser */}
        <rect x={-276} y={-192} width={12} height={70} fill={C.inkMuted} {...ink(2.5)} />
        <rect x={-152} y={-192} width={12} height={70} fill={C.inkMuted} {...ink(2.5)} />
        {/* streak camera */}
        <rect x={-306} y={-312} width={240} height={122} rx={12} fill={C.blue} {...ink()} />
        <rect x={-288} y={-294} width={124} height={66} rx={8} fill={C.blueLight} {...ink(2.5)} />
        {streak > 0.001 && <path d="M -270 -246 Q -236 -244 -214 -262 Q -200 -274 -184 -276" fill="none" stroke={C.saffronDeep} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={`${f2(clamp01(streak))} 1`} />}
        <circle cx={-118} cy={-262} r={16} fill={C.cream} {...ink(2.5)} />
        <line x1={-118} y1={-262} x2={-110} y2={-272} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
        <rect x={-146} y={-226} width={60} height={16} rx={5} fill={C.blueDeep} {...ink(2)} />
        <rect x={-66} y={-276} width={40} height={50} rx={6} fill={C.inkSoft} {...ink()} />
        <ellipse cx={-26} cy={-251} rx={8} ry={24} fill={C.blueLight} {...ink(2.5)} />
      </g>

      {/* light: laser → mirror → mirror → wall (bright), wall → mannequin → wall (paler, thinner), wall → camera */}
      <Seg a={port} b={m1} t={b1} w={5} />
      <Seg a={m1} b={m2} t={b2} w={5} />
      <Seg a={m2} b={spot} t={b3} w={5} />
      <Seg a={spot} b={chest} t={sc1} w={3.2} op={0.7} />
      <Seg a={off({x: 186, y: -124}, hP)} b={back} t={sc2} w={2.6} op={0.5} />
      <Seg a={back} b={lens} t={view} w={2.6} op={0.55} color={C.blueDeep} dash="9 8" />
      <SpotGlyph x={spot.x} y={spot.y} s={11} t={clamp01(b3 * 1.6 - 0.6)} />
      {flash > 0.001 && <circle cx={port.x + 4} cy={port.y} r={10 + 18 * flash} fill="none" stroke={C.saffronDeep} strokeWidth={3} opacity={1 - flash * 0.8} />}

      {/* "around a corner": the camera's straight line to the mannequin ends at the screen */}
      {sight > 0.001 && (() => {
        const hitT = (112 - lens.x) / (chest.x - lens.x);
        const hit = {x: 112, y: lerp(lens.y, chest.y, hitT)};
        const d = clamp01(sight * 1.6);
        const xT = clamp01(sight * 1.6 - 0.75) / 0.85;
        return (
          <g opacity={Math.min(1, sight * 3)}>
            <Seg a={lens} b={hit} t={d} color={C.ink} w={3} dash="7 7" />
            {xT > 0.001 && (
              <g transform={`translate(${f2(hit.x - 6)} ${f2(hit.y)}) scale(${f2(Math.min(1.1, E_back(xT)))})`}>
                <path d="M -9 -9 L 9 9 M 9 -9 L -9 9" stroke={C.cream} strokeWidth={9} strokeLinecap="round" />
                <path d="M -9 -9 L 9 9 M 9 -9 L -9 9" stroke={C.coralDeep} strokeWidth={4.5} strokeLinecap="round" />
              </g>
            )}
          </g>
        );
      })()}
      {ring > 0.001 && (
        <circle cx={E12.mannequin.x} cy={E12.mannequin.y - 50 + hP} r={66} fill="none" stroke={C.saffronDeep} strokeWidth={4.5} strokeLinecap="round" pathLength={1} strokeDasharray={`${f2(clamp01(ring))} 1`} transform={`rotate(-110 ${E12.mannequin.x} ${f2(E12.mannequin.y - 50 + hP)})`} />
      )}

      {/* the recovered 3D shape rising out of the exhibit */}
      {sk && <MannequinSketch x={lerp(E12.mannequin.x, E12.sketchTo.x, rise)} y={lerp(E12.mannequin.y, E12.sketchTo.y, rise)} s={lerp(1.05, 2.05, rise)} draw={sk.draw} />}
    </g>
  );
};

/* ------------------------------------------------------------------ 2018 */

/** Plinth-local raster positions on the 2018 board (row-major, left → right, top → bottom). */
export const RASTER: Pt[] = [-262, -212, -162].flatMap((ry) => [62, 96, 130, 164, 198].map((rx) => ({x: rx, y: ry})));
export const E18 = {
  emitter: {x: -186, y: -214},
  detector: {x: -180, y: -173},
  sign: {x: 293, y: -67},
  clock: {x: -440, y: -330, r: 70},
};

export type Exhibit2018Props = {
  x: number;
  y: number;
  spot?: Pt | null;
  spotT?: number;
  beam?: number;
  laptop?: number;
  rebuild?: number;
  oneS?: number;
  glint?: number;
  /** "the math got simpler": scribbles draw on the laptop (draw) and collapse to one short line (collapse) */
  math?: {draw: number; collapse: number; op: number};
  /** "reflective": spot → sign (pale) and a strong return sign → spot (0..1 each) */
  retro?: {out: number; back: number; op: number};
  /** "exit sign": the sign hops and swells once (0..1 progress; 0 or 1 = at rest) */
  signPop?: number;
};

const ExitPictogram: React.FC<{cx: number; cy: number; k?: number; color?: string; w?: number}> = ({cx, cy, k = 1, color = C.cream, w = 2.6}) => (
  <g transform={`translate(${cx} ${cy}) scale(${k})`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={3} cy={-10} r={2.6} fill={color} stroke="none" />
    <path d="M 1 -5 L -2 3" />
    <path d="M -2 3 L 3 7 L 2 12" />
    <path d="M -2 3 L -7 6 L -10 4" />
    <path d="M 0 -3 L 6 0 L 9 -3" />
    <path d="M 0 -3 L -5 -2 L -8 1" />
    <path d="M 10 -10 L 16 -10 M 13 -13 L 16 -10 L 13 -7" />
  </g>
);

const wave = (x0: number, x1: number, y0: number, amp: number, n: number, ph: number) => {
  const pts: string[] = [];
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    pts.push(`${i ? 'L' : 'M'} ${f2(lerp(x0, x1, u))} ${f2(y0 + amp * Math.sin(u * n * Math.PI * 2 + ph))}`);
  }
  return pts.join(' ');
};

export const Exhibit2018: React.FC<Exhibit2018Props> = ({x, y, spot, spotT = 0, beam = 0, laptop = 0, rebuild = 0, oneS = 0, glint = 0, math, retro, signPop = 0}) => {
  const rb = clamp01(rebuild);
  // the sign's pop: a short hop with a swell, scaled about the foot of its post (294, 0)
  const sp = clamp01(signPop);
  const swell = sp > 0 && sp < 1 ? Math.sin(Math.PI * sp) : 0;
  const signK = 1 + 0.28 * swell;
  const signDy = -14 * swell;
  const rest = RASTER[RASTER.length - 1];
  const signTop = {x: 288, y: -86};
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* board facing us, on two legs */}
      {[48, 196].map((lx) => (
        <rect key={lx} x={lx} y={-118} width={12} height={118} fill={C.inkMuted} {...ink(2.5)} />
      ))}
      <rect x={30} y={-300} width={200} height={186} rx={8} fill={C.cream} {...ink()} />
      {/* coral screen + the exit sign behind it */}
      <rect x={242} y={-8} width={28} height={8} rx={3} fill={C.coralDeep} {...ink(2.5)} />
      <path d="M 246 -4 L 246 -88 Q 246 -100 256 -100 Q 266 -100 266 -88 L 266 -4 Z" fill={C.coral} {...ink()} />
      <g transform={`translate(294 ${f2(signDy)}) scale(${f2(signK)}) translate(-294 0)`}>
        <rect x={290} y={-50} width={7} height={50} fill={C.inkMuted} {...ink(2)} />
        <rect x={270} y={-86} width={48} height={36} rx={5} fill={C.teal} {...ink(2.5)} />
        <ExitPictogram cx={290} cy={-68} k={1.05} />
      </g>
      {glint > 0.001 && (
        <g transform={`translate(${E18.sign.x + 18} ${E18.sign.y - 22}) scale(${f2(0.4 + 0.8 * Math.sin(Math.PI * clamp01(glint)))})`} opacity={Math.sin(Math.PI * clamp01(glint))}>
          <path d="M 0 -16 Q 2 -2 16 0 Q 2 2 0 16 Q -2 2 -16 0 Q -2 -2 0 -16 Z" fill={C.white} {...ink(2)} />
        </g>
      )}
      {/* laptop */}
      <rect x={-162} y={-136} width={164} height={122} rx={9} fill={C.inkSoft} {...ink()} />
      <rect x={-152} y={-126} width={144} height={102} rx={5} fill={laptop > 0.5 ? C.cream : C.inkMuted} {...ink(2.5)} />
      {laptop > 0.5 && math && math.op > 0.001 && math.draw > 0.001 && (
        <g opacity={math.op}>
          {[-102, -78, -54].map((ly, i) => {
            const c = E_inOut(clamp01(math.collapse));
            const cx = -80;
            const half = lerp(58 - i * 8, 18, c);
            return (
              <path
                key={ly}
                d={wave(cx - half, cx + half, lerp(ly, -78, c), lerp(7, 0, c), 2.5 + i, i * 1.3)}
                fill="none"
                stroke={i === 1 ? C.blueDeep : C.inkSoft}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={`${f2(clamp01(math.draw * 1.4 - i * 0.2))} 1`}
                opacity={i === 1 ? 1 : 1 - c}
              />
            );
          })}
        </g>
      )}
      {laptop > 0.5 && rb > 0.001 && (
        <g opacity={Math.min(1, rb * 2.5)}>
          {/* the rebuilt picture of the sign: blobby, as a reconstruction is */}
          <ellipse cx={-110} cy={-70} rx={f2(10 + 24 * rb)} ry={f2(8 + 17 * rb)} fill={C.tealLight} />
          <ellipse cx={-110} cy={-70} rx={f2(6 + 15 * rb)} ry={f2(5 + 10 * rb)} fill={C.teal} />
          {rb > 0.6 && <ExitPictogram cx={-112} cy={-69} k={0.9} color={C.tealLight} w={3} />}
        </g>
      )}
      {/* the rebuild's progress bar: fills in exactly the rebuild time ("about a second"), then stays full */}
      {laptop > 0.5 && rb > 0.001 && (
        <g>
          <rect x={-144} y={-38} width={128} height={9} rx={4.5} fill={C.paperLine} stroke={C.ink} strokeWidth={2} />
          <rect x={-144} y={-38} width={f2(Math.max(9, 128 * rb))} height={9} rx={4.5} fill={C.teal} stroke={C.ink} strokeWidth={2} />
        </g>
      )}
      {laptop > 0.5 && oneS > 0.001 && (
        <g transform={`translate(-46 -66) scale(${f2(0.85 + 0.15 * Math.min(1.08, oneS))})`} opacity={Math.min(1, oneS * 2)}>
          <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontWeight={700} fontSize={36} fill={C.ink}>
            <tspan fontFamily={F.mono}>1</tspan>
            <tspan fontFamily={F.body} fontWeight={800} dx={5}>s</tspan>
          </text>
        </g>
      )}
      <rect x={-176} y={-16} width={192} height={16} rx={5} fill={C.inkMuted} {...ink()} />
      {/* laser + detector unit on its stand */}
      <rect x={-284} y={-10} width={84} height={10} rx={4} fill={C.inkSoft} {...ink(2.5)} />
      <rect x={-247} y={-152} width={10} height={144} fill={C.inkMuted} {...ink(2.5)} />
      <rect x={-300} y={-196} width={112} height={46} rx={7} fill={C.blue} {...ink()} />
      <rect x={-300} y={-234} width={112} height={38} rx={7} fill={C.saffron} {...ink()} />
      <rect x={-192} y={-224} width={10} height={20} rx={3} fill={beam > 0.001 ? C.saffronLight : C.coral} {...ink(2)} />
      <circle cx={-188} cy={-173} r={12} fill={C.blueLight} {...ink(2.5)} />
      <rect x={-284} y={-186} width={46} height={26} rx={5} fill={C.blueLight} {...ink(2)} />
      {/* beam to the spot and the detector's line back */}
      {spot && beam > 0.001 && (
        <g>
          <line x1={E18.emitter.x} y1={E18.emitter.y} x2={spot.x} y2={spot.y} stroke={C.coral} strokeWidth={3.5} strokeLinecap="round" opacity={beam} />
          <line x1={E18.detector.x} y1={E18.detector.y} x2={spot.x} y2={spot.y + 3} stroke={C.blueDeep} strokeWidth={2.6} strokeLinecap="round" strokeDasharray="9 8" opacity={0.6 * beam} />
        </g>
      )}
      {/* "reflective": light from the spot reaches the sign, and a strong share comes straight back */}
      {retro && retro.op > 0.001 && (
        <g opacity={retro.op}>
          <Seg a={rest} b={signTop} t={retro.out} w={2.6} op={0.6} />
          <Seg a={{x: signTop.x + 8, y: signTop.y}} b={{x: rest.x + 6, y: rest.y + 5}} t={retro.back} w={6} op={0.95} />
        </g>
      )}
      {spot && <SpotGlyph x={spot.x} y={spot.y} s={12} t={spotT} />}
    </g>
  );
};

/** A plain wall clock: the minute hand sweeps to `minutes` from 12; the swept wedge fills pale saffron. */
export const WallClock: React.FC<{x: number; y: number; r: number; minutes: number; wedge?: number}> = ({x, y, r, minutes, wedge = 1}) => {
  const a = (minutes / 60) * Math.PI * 2;
  const hx = (ang: number, len: number) => ({x: x + Math.sin(ang) * len, y: y - Math.cos(ang) * len});
  const m = hx(a, r * 0.78);
  const hourA = ((10 + minutes / 60) / 12) * Math.PI * 2;
  const h = hx(hourA, r * 0.5);
  const wr = r * 0.86;
  const we = hx(a, wr);
  const large = a > Math.PI ? 1 : 0;
  return (
    <g>
      <circle cx={x + 7} cy={y + 9} r={r + 6} fill={C.shadow} />
      <circle cx={x} cy={y} r={r + 6} fill={C.woodDeep} {...ink()} />
      <circle cx={x} cy={y} r={r - 4} fill={C.cream} {...ink(2.5)} />
      {a > 0.01 && wedge > 0.001 && <path d={`M ${x} ${y} L ${x} ${y - wr} A ${wr} ${wr} 0 ${large} 1 ${f2(we.x)} ${f2(we.y)} Z`} fill={C.saffronLight} opacity={wedge} />}
      {Array.from({length: 12}, (_, i) => {
        const ang = (i / 12) * Math.PI * 2;
        const p0 = hx(ang, r * 0.8);
        const p1 = hx(ang, r * (i % 3 === 0 ? 0.62 : 0.7));
        return <line key={i} x1={f2(p0.x)} y1={f2(p0.y)} x2={f2(p1.x)} y2={f2(p1.y)} stroke={C.ink} strokeWidth={i % 3 === 0 ? 4 : 2.5} strokeLinecap="round" />;
      })}
      <line x1={x} y1={y} x2={f2(h.x)} y2={f2(h.y)} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
      <line x1={x} y1={y} x2={f2(m.x)} y2={f2(m.y)} stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />
      <circle cx={x} cy={y} r={6} fill={C.coral} {...ink(2)} />
    </g>
  );
};

/**
 * The wall clock's readout (world px): a museum label card beside the clock with a short leader to its rim. While the
 * hand sweeps it counts the minutes (JetBrains Mono digit; "≈" and "to measure" wait at low opacity), then it settles
 * to the result, "≈ 7 min to measure", with a small swell. The text is laid out in its final form from the first frame
 * and the digit is monospaced, so nothing in the card shifts while it counts or settles.
 *  `t` 0..1 pop (as WLabel); `minutes` the clock hand's minutes; `settle` 0..1 progress of the settle (linear).
 */
export const ClockLabel: React.FC<{x: number; y: number; w: number; h: number; size: number; t: number; minutes: number; settle: number; final: number; to?: Pt; from?: Pt}> = ({x, y, w, h, size, t, minutes, settle, final, to, from}) => {
  if (t <= 0.001) return null;
  const st = clamp01(settle);
  const swell = 1 + 0.06 * Math.sin(Math.PI * st);
  const s = (0.9 + 0.1 * Math.min(1.08, t)) * swell;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const a = from ?? {x, y: cy};
  const digit = st > 0 ? final : Math.max(0, Math.min(final - 1, Math.floor(minutes)));
  const rest = lerp(0.28, 1, Math.min(1, st * 2));
  return (
    <g opacity={Math.min(1, t * 1.8)}>
      {to && (
        <g>
          <path d={`M ${f2(a.x)} ${f2(a.y)} L ${f2(to.x)} ${f2(to.y)}`} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
          <circle cx={to.x} cy={to.y} r={5.5} fill={C.cream} stroke={C.ink} strokeWidth={2.5} />
        </g>
      )}
      <g transform={`translate(${f2(cx)} ${f2(cy)}) scale(${f2(s * 1000) / 1000}) translate(${f2(-cx)} ${f2(-cy)})`}>
        <rect x={x + 6} y={y + 7} width={w} height={h} rx={12} fill={C.shadow} />
        <rect x={x} y={y} width={w} height={h} rx={12} fill={C.cream} {...ink()} />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontFamily={F.body} fontWeight={800} fontSize={size} fill={C.ink}>
          <tspan opacity={rest}>≈ </tspan>
          <tspan fontFamily={F.mono} fontWeight={700}>
            {digit}
          </tspan>
          <tspan> min</tspan>
          <tspan opacity={rest}> to measure</tspan>
        </text>
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ 2021 */

/** The 2021 shot fact as a card on the exhibit, stacked above the "5 frames/s" readout (plinth-local px; 26 world px
 *  text = 36 px on screen in the 1.4× close-up). Drawn only when Exhibit2021's opt-in `live` is above 0. */
export const LIVE_CARD = {x: -370, y: -402, w: 300, h: 50, size: 26, text: 'live · ordinary objects'};
/** The "5 frames/s" readout card (plinth-local px). */
export const COUNTER_CARD = {x: -345, y: -340, w: 250, h: 86};

export const E21 = {
  port: {x: -42, y: -51},
  stripEnd: {x: -36, y: -119},
  wallSpot: {x: 284, y: -205},
  ballRange: [198, 236] as [number, number],
  laserLeft: {x: -320, y: -47},
  strip: {x: -90, y: -132},
};

export type Exhibit2021Props = {
  x: number;
  y: number;
  beam?: number;
  view?: number;
  /** number of strip cells lit (0..8, fractional = the next one fading in) */
  cells?: number;
  monitor?: number;
  /** ball x (plinth-local) now, and as sampled at the latest video frame */
  ballX: number;
  frameBallX: number;
  /** index of the latest video frame (jitter seed); < 0 = no video yet */
  frameIdx: number;
  /** the counter readout: 0..1 visible, `ticks` boxes filled (0..5) */
  counter?: number;
  ticks?: number;
  /** opt-in: the "live · ordinary objects" card above the counter (LIVE_CARD), 0..1 pop; default 0 (not drawn) */
  live?: number;
};

const jit = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
};

export const Exhibit2021: React.FC<Exhibit2021Props> = ({x, y, beam = 0, view = 0, cells = 0, monitor = 0, ballX, frameBallX, frameIdx, counter = 0, ticks = 0, live = 0}) => {
  const mapX = (bx: number) => -284 + (bx - 186) * 1.3;
  const n = frameIdx;
  const ballRot = ((ballX - E21.ballRange[0]) / 16) * (180 / Math.PI);
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* small upright wall */}
      <rect x={272} y={-9} width={44} height={9} rx={3} fill={C.inkMuted} {...ink(2.5)} />
      <rect x={284} y={-312} width={20} height={304} rx={3} fill={C.cream} {...ink()} />
      {/* ordinary objects: a wooden block and a ball */}
      <rect x={246} y={-30} width={30} height={30} rx={4} fill={C.woodLight} {...ink(2.5)} />
      <g transform={`translate(${f2(ballX)} -17) rotate(${f2(ballRot)})`}>
        <circle cx={0} cy={0} r={16} fill={C.saffron} {...ink(2.5)} />
        <path d="M -15 -3 Q 0 5 15 -3" fill="none" stroke={C.saffronDeep} strokeWidth={3} />
      </g>
      {/* coral screen */}
      <rect x={146} y={-8} width={30} height={8} rx={3} fill={C.coralDeep} {...ink(2.5)} />
      <path d="M 150 -4 L 150 -110 Q 150 -122 161 -122 Q 172 -122 172 -110 L 172 -4 Z" fill={C.coral} {...ink()} />
      {/* the powerful laser */}
      <rect x={-320} y={-94} width={264} height={94} rx={10} fill={C.blue} {...ink()} />
      <rect x={-302} y={-78} width={120} height={52} rx={7} fill={C.blueLight} {...ink(2.5)} />
      <circle cx={-142} cy={-48} r={20} fill={C.saffron} {...ink(2.5)} />
      <line x1={-142} y1={-48} x2={-132} y2={-60} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      <rect x={-104} y={-74} width={30} height={14} rx={4} fill={C.blueDeep} {...ink(2)} />
      <rect x={-58} y={-63} width={16} height={24} rx={4} fill={beam > 0.001 ? C.saffronLight : C.coral} {...ink(2.5)} />
      {/* strip detector on the laser */}
      {[-136, -70].map((fx) => (
        <rect key={fx} x={fx - 4} y={-108} width={8} height={14} fill={C.inkSoft} {...ink(2)} />
      ))}
      <rect x={-146} y={-132} width={110} height={26} rx={6} fill={C.blue} {...ink()} />
      {Array.from({length: 8}, (_, i) => {
        const lit = clamp01(cells - i);
        return <rect key={i} x={f2(-142 + i * 13.3)} y={-126} width={9.5} height={14} rx={2} fill={lit > 0.5 ? C.saffron : C.cream} stroke={C.ink} strokeWidth={1.8} />;
      })}
      {/* monitor on the laser */}
      <rect x={-238} y={-112} width={16} height={20} fill={C.inkSoft} {...ink(2.5)} />
      <rect x={-312} y={-242} width={164} height={132} rx={10} fill={C.inkSoft} {...ink()} />
      <rect x={-300} y={-230} width={140} height={106} rx={5} fill={monitor > 0.5 ? C.cream : C.inkMuted} {...ink(2.5)} />
      {monitor > 0.5 && n >= 0 && (
        <g>
          {/* wooden block blob (static) and ball blob (moves), redrawn 5 times a second */}
          <ellipse cx={f2(mapX(261) + jit(n, 1) * 1.5)} cy={f2(-160 + jit(n, 2) * 1.5)} rx={f2(19 + jit(n, 3) * 2)} ry={f2(22 + jit(n, 4) * 2)} fill={C.tealLight} />
          <ellipse cx={f2(mapX(261) + jit(n, 5))} cy={f2(-158 + jit(n, 6))} rx={10} ry={12} fill={C.teal} opacity={0.75} />
          <ellipse cx={f2(mapX(frameBallX) + jit(n, 7) * 2)} cy={f2(-153 + jit(n, 8) * 1.5)} rx={f2(23 + jit(n, 9) * 2.5)} ry={f2(19 + jit(n, 10) * 2)} fill={C.tealLight} />
          <ellipse cx={f2(mapX(frameBallX) + jit(n, 11))} cy={f2(-153 + jit(n, 12))} rx={13} ry={11} fill={C.teal} />
        </g>
      )}
      {/* the shot fact above the counter (opt-in): pops as a card, scaled about its centre */}
      {live > 0.001 && (
        <g opacity={Math.min(1, live * 1.8)}>
          <g transform={`translate(${LIVE_CARD.x + LIVE_CARD.w / 2} ${LIVE_CARD.y + LIVE_CARD.h / 2}) scale(${f2((0.9 + 0.1 * Math.min(1.08, live)) * 1000) / 1000}) translate(${-(LIVE_CARD.x + LIVE_CARD.w / 2)} ${-(LIVE_CARD.y + LIVE_CARD.h / 2)})`}>
            <rect x={LIVE_CARD.x} y={LIVE_CARD.y} width={LIVE_CARD.w} height={LIVE_CARD.h} rx={10} fill={C.cream} {...ink()} />
            <text x={LIVE_CARD.x + LIVE_CARD.w / 2} y={LIVE_CARD.y + LIVE_CARD.h / 2 + 1} textAnchor="middle" dominantBaseline="central" fontFamily={F.body} fontWeight={800} fontSize={LIVE_CARD.size} fill={C.ink}>
              {LIVE_CARD.text}
            </text>
          </g>
        </g>
      )}
      {/* the counter readout above the monitor */}
      {counter > 0.001 && (
        <g opacity={Math.min(1, counter * 1.8)}>
          <rect x={COUNTER_CARD.x} y={COUNTER_CARD.y} width={COUNTER_CARD.w} height={COUNTER_CARD.h} rx={10} fill={C.cream} {...ink()} />
          <text x={-220} y={-311} textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={32} fill={C.ink}>
            5 frames/s
          </text>
          {Array.from({length: 5}, (_, i) => (
            <rect key={i} x={-295 + i * 32} y={-279} width={22} height={12} rx={3} fill={i < ticks ? C.teal : C.paperLine} stroke={C.ink} strokeWidth={2} />
          ))}
        </g>
      )}
      {/* beam to the wall and the detector's line back */}
      {beam > 0.001 && (
        <g>
          <Seg a={E21.port} b={E21.wallSpot} t={beam} w={5.5} />
          <Seg a={E21.stripEnd} b={{x: E21.wallSpot.x, y: E21.wallSpot.y - 6}} t={view} w={2.6} op={0.6} color={C.blueDeep} dash="9 8" />
          <SpotGlyph x={E21.wallSpot.x} y={E21.wallSpot.y} s={11} t={clamp01(beam * 2.5 - 1.5)} />
        </g>
      )}
    </g>
  );
};
