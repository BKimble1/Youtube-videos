// The miniature jail set, drawn in the 2.5D world of world.ts (Weird Crew vector finish).
//
// Layers (draw in this order, the robot / liquid / guard go between them):
//   <JailBack/>     everything behind the bar row + the WHOLE floor (cell and corridor), the heat coil, cell lighting
//   ...robot in the cell / liquid...
//   <Bars/>         the bar row (fixed bars at FIXED_D, the sliding door section at DOOR_D = 0), rails, rivets
//   <AlarmBeacon/>  the red rotating beacon above the bars
//   ...guard, things in the corridor...
//   <JailFront/>    sparse corridor foreground (drain grate, guard desk + lamp, a thick foreground pillar)
//   <AlarmWash/>    screen-space red sweep (last, under the captions)
//
// Depth layout of the bar row: the DOOR section (x in [-10.4, 10.4], bars at +-2.6 / +-7.8) stands exactly on d = 0,
// so the escape gap at x = 0 is on d = 0. The FIXED bars stand a little in front (d = FIXED_D = -2), which is what lets
// the door slide right BEHIND them. Everything is a pure function of its props (t in seconds).
import React from 'react';
import {ALARM, BAR_H, BAR_R, BAR_XS, CELL_D, CELL_HALF, Cam3, DOOR, H, P3, RAIL_H, W, WALL_H, toCam} from '../world';
import {C, INK, NS} from './palette';
import {lit, mix, shade} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash} from '../lib';

// ---- local colours (not in the shared palette) ----
const COOL = '#A9CDF2';        // the cell's cool overhead light
const COPPER = '#B8693F';      // induction coil copper (cold)
const COPPER_DK = '#4B2C22';   // coil copper in shadow
const HOT_CORE = '#FFE2B0';    // white-hot coil core
const WARM = '#FFC56B';        // guard desk lamp
const VOID = '#0A1322';        // the unlit dark beyond the set
const WASH_RED = '#FF1E12';    // saturated beam red (screen-blended it stays red on navy instead of turning pink)
const WASH_HOT = '#FF6A4A';
const SPEC = '#DCE6F0';        // crisp specular streak on the bars

// ---- set constants ----
export const DOOR_D = 0;                         // the door section's plane (escape gap)
export const FIXED_D = -2;                       // the fixed bars' plane (in front, so the door can slide behind)
export const DOOR_W = DOOR.x1 - DOOR.x0;         // 20.8: door=1 slides it right by its own width
export const COIL = {x: 0, d: 3.5, r: 4.5};      // induction coil centre / radius (cell floor)
const LAMP: P3 = {x: 0, h: WALL_H, d: 8};        // the cell's overhead light (off-frame, motivates the light)
const RAIL_D0 = -2.9, RAIL_D1 = 0.75;             // top rail / floor track depth extent
const TRACK_H = 0.08;
export const SILL_H = 0.4;                       // the door's bottom rail top (low: the liquid flows over it)
const BAR_GAP_HALF = 2.6;                            // floor track height (flush, the liquid flows over it)
const HEAD_D = 1.0;                              // header wall face above the bars
const CORR_D = -50;                              // the corridor's far wall
const PART_T = 1.4;                              // partition (side wall) thickness
const ROT_PERIOD = 2.0;                          // beacon reflector revolution (s): two beams -> one flash per 1.0 s
const SWEEP_T0 = 0.12;                           // phase: a beam faces the viewer at t = 0.12 + k * 1.0

// =====================================================================================================================
// geometry: near-plane clipping + projection (world.project clamps z, which breaks polygons that reach behind the camera)
// =====================================================================================================================
type Q = {x: number; y: number; z: number};
type S2 = {x: number; y: number};
const ZN = 0.35;
const LIM = 60000;
const cl = (v: number) => Math.max(-LIM, Math.min(LIM, v));
const sp = (c: Cam3, q: Q): S2 => ({x: cl(W / 2 + (q.x * c.f) / q.z), y: cl(H / 2 - (q.y * c.f) / q.z)});
const lq = (a: Q, b: Q, u: number): Q => ({x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u});
const f1 = (n: number) => n.toFixed(1);

/** project a world polygon, clipped against the camera's near plane */
export const clipPoly = (c: Cam3, pts: P3[]): S2[] => {
  const q = pts.map((p) => toCam(c, p));
  const out: Q[] = [];
  for (let i = 0; i < q.length; i++) {
    const A = q[i], B = q[(i + 1) % q.length];
    const ia = A.z >= ZN, ib = B.z >= ZN;
    if (ia) out.push(A);
    if (ia !== ib) out.push(lq(A, B, (ZN - A.z) / (B.z - A.z)));
  }
  return out.map((p) => sp(c, p));
};
const pathS = (s: S2[], close = true) => (s.length < 2 ? '' : 'M' + s.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L') + (close ? 'Z' : ''));
/** SVG path of a clipped, projected world polygon ('' if fully behind the camera) */
export const polyD = (c: Cam3, pts: P3[]) => {
  const s = clipPoly(c, pts);
  return s.length < 3 ? '' : pathS(s);
};
/** projected polyline (open), clipped per segment */
const lineD = (c: Cam3, pts: P3[]) => {
  const q = pts.map((p) => toCam(c, p));
  let d = '';
  let pen = false;
  for (let i = 0; i < q.length - 1; i++) {
    let A = q[i], B = q[i + 1];
    if (A.z < ZN && B.z < ZN) {
      pen = false;
      continue;
    }
    if (A.z < ZN) A = lq(A, B, (ZN - A.z) / (B.z - A.z));
    if (B.z < ZN) B = lq(A, B, (ZN - A.z) / (B.z - A.z));
    const a = sp(c, A), b = sp(c, B);
    if (!pen) d += `M${f1(a.x)},${f1(a.y)}`;
    d += `L${f1(b.x)},${f1(b.y)}`;
    pen = q[i + 1].z >= ZN;
  }
  return d;
};
/** projected point (z clamped) with its scale s = px per world unit */
const pr = (c: Cam3, p: P3) => {
  const q = toCam(c, p);
  const z = Math.max(ZN, q.z);
  return {...sp(c, {...q, z}), s: c.f / z, z: q.z};
};
const P = (x: number, h: number, d: number): P3 => ({x, h, d});
const floorRect = (x0: number, x1: number, d0: number, d1: number, h = 0) => [P(x0, h, d0), P(x1, h, d0), P(x1, h, d1), P(x0, h, d1)];
const wallRect = (x0: number, x1: number, h0: number, h1: number, d: number) => [P(x0, h0, d), P(x1, h0, d), P(x1, h1, d), P(x0, h1, d)];
const sideRect = (d0: number, d1: number, h0: number, h1: number, x: number) => [P(x, h0, d0), P(x, h0, d1), P(x, h1, d1), P(x, h1, d0)];
/** a circle on a horizontal plane */
const floorCircle = (x: number, d: number, r: number, h = 0, n = 48) =>
  Array.from({length: n}, (_, i) => P(x + r * Math.cos((i / n) * Math.PI * 2), h, d + r * Math.sin((i / n) * Math.PI * 2)));

/** affine map (tangent of the perspective at o) taking the unit square of (u, v) world vectors to the screen:
 *  gives perspective-plausible radial gradients on floors and walls. null if o is behind the camera. */
const affine = (c: Cam3, o: P3, u: P3, v: P3) => {
  if (toCam(c, o).z < ZN * 2) return null;
  const e = 0.01;
  const p0 = pr(c, o);
  const pu = pr(c, P(o.x + u.x * e, o.h + u.h * e, o.d + u.d * e));
  const pv = pr(c, P(o.x + v.x * e, o.h + v.h * e, o.d + v.d * e));
  const m = [(pu.x - p0.x) / e, (pu.y - p0.y) / e, (pv.x - p0.x) / e, (pv.y - p0.y) / e, p0.x, p0.y];
  return `matrix(${m.map((x) => x.toFixed(3)).join(' ')})`;
};

type Stop = [number, string, number];
/** a radial pool (light or shadow) on a plane: centre o, in-plane radius vectors u, v; fills the path d */
const Pool: React.FC<{c: Cam3; o: P3; u: P3; v: P3; d: string; stops: Stop[]; blend?: 'screen' | 'normal' | 'multiply'; opacity?: number}> = ({
  c, o, u, v, d, stops, blend = 'normal', opacity = 1,
}) => {
  const tr = affine(c, o, u, v);
  if (!tr || !d || opacity <= 0.002) return null;
  const id = uid('pool');
  return (
    <g style={blend === 'normal' ? undefined : {mixBlendMode: blend}} opacity={opacity}>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={1} gradientTransform={tr}>
          {stops.map(([o2, col, a], i) => (
            <stop key={i} offset={o2} stopColor={col} stopOpacity={a} />
          ))}
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
    </g>
  );
};
/** a linear gradient between two projected world points */
const LinW: React.FC<{c: Cam3; a: P3; b: P3; d: string; stops: Stop[]; blend?: 'screen' | 'normal'; opacity?: number}> = ({c, a, b, d, stops, blend = 'normal', opacity = 1}) => {
  if (!d) return null;
  const A = pr(c, a), B = pr(c, b);
  const id = uid('lin');
  return (
    <g style={blend === 'normal' ? undefined : {mixBlendMode: blend}} opacity={opacity}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f1(A.x)} y1={f1(A.y)} x2={f1(B.x)} y2={f1(B.y)}>
          {stops.map(([o, col, al], i) => (
            <stop key={i} offset={o} stopColor={col} stopOpacity={al} />
          ))}
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
    </g>
  );
};

// ---- boxes (architecture, furniture) ----
type Bx = {x0: number; x1: number; h0: number; h1: number; d0: number; d1: number};
type BoxCol = {top: string; front: string; left: string; right: string; back?: string; bottom?: string};
/** flat box colours lit from the upper left */
const boxCol = (base: string, k = 1): BoxCol => ({
  top: lit(base, 0.16 * k), front: base, left: lit(base, 0.07 * k), right: shade(base, 0.28 * k), back: shade(base, 0.2 * k), bottom: shade(base, 0.45 * k),
});
const boxFaces = (c: Cam3, b: Bx, col: BoxCol) => {
  const F: {pts: P3[]; fill: string; k: string}[] = [];
  const {x0, x1, h0, h1, d0, d1} = b;
  if (c.h > h1) F.push({k: 'top', fill: col.top, pts: [P(x0, h1, d0), P(x1, h1, d0), P(x1, h1, d1), P(x0, h1, d1)]});
  if (c.h < h0) F.push({k: 'bottom', fill: col.bottom ?? col.front, pts: [P(x0, h0, d0), P(x1, h0, d0), P(x1, h0, d1), P(x0, h0, d1)]});
  if (c.d < d0) F.push({k: 'front', fill: col.front, pts: wallRect(x0, x1, h0, h1, d0)});
  if (c.d > d1) F.push({k: 'back', fill: col.back ?? col.front, pts: wallRect(x0, x1, h0, h1, d1)});
  if (c.x < x0) F.push({k: 'left', fill: col.left, pts: sideRect(d0, d1, h0, h1, x0)});
  if (c.x > x1) F.push({k: 'right', fill: col.right, pts: sideRect(d0, d1, h0, h1, x1)});
  return F;
};
const Box: React.FC<{c: Cam3; b: Bx; col: BoxCol; ink?: number; inkA?: number}> = ({c, b, col, ink = 1.6, inkA = 0.85}) => (
  <g>
    {boxFaces(c, b, col).map((f, i) => {
      const d = polyD(c, f.pts);
      if (!d) return null;
      // vertical faces: a gentle top-lit gradient (lighter at the top edge, darker toward the floor)
      const vert = f.k !== 'top' && f.k !== 'bottom';
      const mx = (b.x0 + b.x1) / 2, md = (b.d0 + b.d1) / 2;
      const fx = f.k === 'left' ? b.x0 : f.k === 'right' ? b.x1 : mx, fd = f.k === 'front' ? b.d0 : f.k === 'back' ? b.d1 : md;
      return (
        <g key={i}>
          <path d={d} fill={f.fill} />
          {vert && (
            <LinW c={c} a={P(fx, b.h1, fd)} b={P(fx, b.h0, fd)} d={d}
              stops={[[0, '#FFFFFF', 0.07], [0.35, '#FFFFFF', 0], [1, C.navy0, 0.22]]} />
          )}
          {f.k === 'top' && (
            <LinW c={c} a={P(b.x0, b.h1, b.d0)} b={P(b.x1, b.h1, b.d1)} d={d}
              stops={[[0, '#FFFFFF', 0.08], [0.5, '#FFFFFF', 0], [1, C.navy0, 0.16]]} />
          )}
          <path d={d} fill="none" stroke={INK} strokeOpacity={inkA} strokeWidth={ink} strokeLinejoin="round" vectorEffect={NS} />
        </g>
      );
    })}
  </g>
);
/** camera-space depth of a world point (for painter's sorting) */
const zOf = (c: Cam3, p: P3) => toCam(c, p).z;

// =====================================================================================================================
// alarm timing (shared by every alarm-driven element so reflections stay in sync)
// =====================================================================================================================
/** beacon reflector angle (rad) around the vertical axis: 0 = beam 1 points straight at the viewer (-d) */
const beamAngle = (t: number) => (2 * Math.PI * (t - SWEEP_T0)) / ROT_PERIOD;
/** 0..1: how strongly a beacon beam points at the viewer right now (sharp flash once per 1.0 s, peaks at 0.12 + k) */
export const alarmSweep = (t: number) => Math.abs(Math.cos(beamAngle(t))) ** 4;

// =====================================================================================================================
// JailBack
// =====================================================================================================================
const bunkBox: Bx = {x0: -19, x1: -8, h0: 3.5, h1: 4.4, d0: 19.4, d1: CELL_D};

/** the projected coil ellipse (approx): centre and radii in px */
export const coilScreen = (c: Cam3) => {
  const o = pr(c, P(COIL.x, 0, COIL.d));
  const pts = clipPoly(c, floorCircle(COIL.x, COIL.d, COIL.r, 0, 32));
  if (pts.length < 3) return {cx: o.x, cy: o.y, rx: 0, ry: 0};
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return {cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, rx: (x1 - x0) / 2, ry: (y1 - y0) / 2};
};

/** shadow-casting elements of the bar row, as seen from the cell lamp (for the light spilling into the corridor) */
const barCasters = (door: number) => {
  const ox = door * DOOR_W;
  const L: {x: number; d: number; r: number; h0: number; h1: number}[] = [];
  for (const x of BAR_XS) {
    if (x > DOOR.x0 && x < DOOR.x1) L.push({x: x + ox, d: DOOR_D, r: BAR_R, h0: 0, h1: BAR_H});
    else if (Math.abs(x) < CELL_HALF + 2) L.push({x, d: FIXED_D, r: BAR_R, h0: 0, h1: BAR_H});
  }
  L.push({x: DOOR.x0 + 0.45 + ox, d: DOOR_D, r: 0.45, h0: 0, h1: BAR_H});
  L.push({x: DOOR.x1 - 0.45 + ox, d: DOOR_D, r: 0.45, h0: 0, h1: BAR_H});
  return L;
};
/** floor point where the lamp's ray through p lands */
const lampHit = (p: P3) => {
  const k = LAMP.h / Math.max(0.5, LAMP.h - p.h);
  return P(LAMP.x + (p.x - LAMP.x) * k, 0, LAMP.d + (p.d - LAMP.d) * k);
};

const CoilArt: React.FC<{c: Cam3; t: number; heat: number}> = ({c, t, heat}) => {
  const {x: cx, d: cd, r} = COIL;
  const o = pr(c, P(cx, 0, cd));
  if (o.z < ZN * 2) return null;
  const s = o.s;
  const pit = polyD(c, floorCircle(cx, cd, r + 0.55, 0, 56));
  const rimOut = floorCircle(cx, cd, r + 0.95, 0, 56), rimIn = floorCircle(cx, cd, r + 0.45, 0, 56);
  const rim = polyD(c, rimOut) + ' ' + polyD(c, rimIn.slice().reverse());
  // flat spiral coil (5 turns), drawn as a world-space ribbon so its width follows the perspective
  const turns = 5.2, n = 240;
  const ribbon = (w: number, off = 0) => {
    const o: P3[] = [], i2: P3[] = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const a = u * turns * Math.PI * 2 + 0.6;
      const rr = 0.7 + u * (r - 0.55) + off;
      o.push(P(cx + (rr + w / 2) * Math.cos(a), 0.02, cd + (rr + w / 2) * Math.sin(a)));
      i2.push(P(cx + Math.max(0, rr - w / 2) * Math.cos(a), 0.02, cd + Math.max(0, rr - w / 2) * Math.sin(a)));
    }
    return polyD(c, o.concat(i2.reverse()));
  };
  const hot = clamp(heat);
  const clipId = uid('coilClip');
  const chord = Math.sqrt(Math.max(0, (r + 0.95) ** 2 - (cd - RAIL_D1) ** 2));
  const flick = 0.92 + 0.08 * Math.sin(t * 23) * Math.sin(t * 7.3);
  const coilCol = mix(mix(COPPER_DK, COPPER, 0.5), C.heat, clamp(hot * 1.3));
  // grate slats across the pit (along x)
  const slats: string[] = [];
  for (let k = -5; k <= 5; k++) {
    const dd = k * 0.82;
    const half = Math.sqrt(Math.max(0, (r + 0.5) ** 2 - dd * dd));
    if (half < 0.3) continue;
    slats.push(polyD(c, floorRect(cx - half, cx + half, cd + dd - 0.13, cd + dd + 0.13, 0.06)));
  }
  return (
    <g>
      {/* hot glow on the floor around the pit */}
      {hot > 0.01 && (
        <Pool c={c} o={P(cx, 0, cd)} u={P(r * 2.6, 0, 0)} v={P(0, 0, r * 2.6)} d={polyD(c, floorCircle(cx, cd, r * 2.6, 0, 56))} blend="screen"
          stops={[[0, C.heat, 0.55 * hot * flick], [0.32, C.heatDeep, 0.32 * hot], [1, C.heatDeep, 0]]} />
      )}
      {/* the pit stops at the bar track: clipped to the cell side, with a straight rim along the track */}
      <defs>
        <clipPath id={clipId}>
          <path d={polyD(c, floorRect(-60, 60, RAIL_D1, 40))} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
      {/* recessed pit */}
      <path d={pit} fill="#0C1626" />
      <Pool c={c} o={P(cx, 0, cd)} u={P(r + 0.55, 0, 0)} v={P(0, 0, r + 0.55)} d={pit}
        stops={[[0, mix('#1A2638', C.heatDeep, hot), 0.9], [0.75, mix('#121D2E', C.heatDeep, hot * 0.6), 0.6], [1, '#0A1220', 0.0]]} />
      {/* the coil: glow, body (inked), bright core */}
      {hot > 0.01 && <path d={ribbon(0.95)} fill={C.heat} opacity={0.4 * hot * flick} style={{mixBlendMode: 'screen'}} />}
      <path d={ribbon(0.42)} fill={coilCol} stroke={mix(INK, '#3A1608', hot)} strokeWidth={1.1} strokeLinejoin="round" vectorEffect={NS} />
      <path d={ribbon(0.12, 0.06)} fill={hot > 0.01 ? mix(C.heat, HOT_CORE, hot) : lit(COPPER, 0.3)} opacity={0.4 + 0.6 * hot} />
      {/* grate slats + steel rim */}
      {slats.map((d, i) => (
        <path key={i} d={d} fill={mix(C.steelDark, '#1D2735', 0.35)} stroke={INK} strokeOpacity={0.8} strokeWidth={0.9} vectorEffect={NS} />
      ))}
      <path d={rim} fillRule="evenodd" fill={mix(C.rail, C.floorTile, 0.35)} stroke={INK} strokeWidth={1.4} vectorEffect={NS} />
      {/* rim bolts */}
      {Array.from({length: 8}, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.39;
        const q = pr(c, P(cx + (r + 0.7) * Math.cos(a), 0.05, cd + (r + 0.7) * Math.sin(a)));
        return q.z > ZN ? <circle key={i} cx={f1(q.x)} cy={f1(q.y)} r={Math.max(0.8, 0.16 * q.s)} fill={lit(C.rail, 0.25)} stroke={INK} strokeWidth={0.8} vectorEffect={NS} /> : null;
      })}
      {chord > 0 && <path d={polyD(c, floorRect(cx - chord, cx + chord, RAIL_D1, RAIL_D1 + 0.5, 0.01))} fill={mix(C.rail, C.floorTile, 0.35)} stroke={INK} strokeWidth={1.4} vectorEffect={NS} />}
      </g>
      {/* warm haze rising off the coil (reads from low cameras too) */}
      {hot > 0.01 && (() => {
        const hz = pr(c, P(cx, 2.2, cd));
        const gid = uid('haze');
        return (
          <g style={{mixBlendMode: 'screen'}}>
            <defs>
              <radialGradient id={gid}>
                <stop offset={0} stopColor={C.heat} stopOpacity={0.32 * hot * flick} />
                <stop offset={0.5} stopColor={C.heatDeep} stopOpacity={0.12 * hot} />
                <stop offset={1} stopColor={C.heatDeep} stopOpacity={0} />
              </radialGradient>
            </defs>
            <ellipse cx={f1(hz.x)} cy={f1(hz.y)} rx={f1(7 * hz.s)} ry={f1(4.2 * hz.s)} fill={`url(#${gid})`} />
          </g>
        );
      })()}
      {/* heat shimmer: short, soft wavy wisps rising off the coil. Widths are in world units (clamped in px) and the
          wisps fade out when the camera gets close (s large), so low / crossing cameras never show stray hairlines. */}
      {hot > 0.01 && (() => {
        const near = clamp((150 - s) / 70); // 1 while the coil is >= ~12 u from the lens (s <= 80 px/u), 0 when very close
        if (near <= 0.01) return null;
        return Array.from({length: 7}, (_, i) => {
          const ph = (t * 0.55 + hash(i + 3)) % 1;
          const x0 = cx - 3.0 + i * 1.0 + (hash(i + 9) - 0.5) * 0.5;
          const dd = cd - 1.2 + (i % 3) * 1.1;
          const base = 0.6 + ph * 5.2;
          const len = 1.9;
          const pts = Array.from({length: 10}, (_, j) => {
            const hh = base + (j / 9) * len;
            return P(x0 + 0.22 * Math.sin(hh * 2.3 - t * 6 + i * 1.7), hh, dd);
          });
          const q = pr(c, P(x0, base, dd));
          const env = Math.sin(Math.PI * ph) ** 1.5;
          const wpx = Math.min(9, Math.max(1.4, 0.13 * q.s));
          return (
            <path key={i} d={lineD(c, pts)} fill="none" stroke={mix(C.heat, '#FFD2A0', 0.55)} strokeOpacity={0.32 * hot * env * near} strokeWidth={wpx}
              strokeLinecap="round" style={{mixBlendMode: 'screen'}} />
          );
        });
      })()}
    </g>
  );
};

export const JailBack: React.FC<{c: Cam3; t: number; alarm: number; heat?: number; dim?: number; door?: number}> = ({c, t, alarm, heat = 0, dim = 0, door = 0}) => {
  const al = clamp(alarm);
  const sw = alarmSweep(t);
  const xL = -60, xR = 60, dFar = -60;
  const PX = CELL_HALF + PART_T; // partition outer face
  const steep = clamp((72 - c.pitch) / 22); // fade vertical light shafts for top-down views

  // ---- back wall ----
  const backWall = polyD(c, wallRect(xL, xR, 0, WALL_H, CELL_D));
  const panelSeams: string[] = [];
  for (let k = -7; k <= 7; k++) {
    const x = 4 + 8 * k;
    if (x < xL || x > xR) continue;
    panelSeams.push(polyD(c, wallRect(x - 0.1, x + 0.1, 1.3, WALL_H, CELL_D - 0.01)));
  }
  const hSeams = [12, 23.5].map((h) => polyD(c, wallRect(xL, xR, h - 0.1, h + 0.1, CELL_D - 0.01)));
  const hBevel = [12, 23.5].map((h) => polyD(c, wallRect(xL, xR, h - 0.32, h - 0.12, CELL_D - 0.02)));
  const vBevel: string[] = [];
  for (let k = -7; k <= 7; k++) {
    const x = 4 + 8 * k;
    vBevel.push(polyD(c, wallRect(x + 0.12, x + 0.3, 1.3, WALL_H, CELL_D - 0.02)));
  }
  const baseboard = polyD(c, wallRect(xL, xR, 0, 1.3, CELL_D - 0.02));
  // ---- corridor far wall (faces the cell) ----
  const corrWall = c.d > CORR_D ? polyD(c, wallRect(xL, xR, 0, 40, CORR_D)) : '';
  const corrSeams = corrWall ? Array.from({length: 13}, (_, k) => polyD(c, wallRect(-48 + k * 8 - 0.1, -48 + k * 8 + 0.1, 0, 40, CORR_D + 0.01))) : [];
  // ---- tally marks scratched on the back wall above the bunk (a small jail gag, low contrast) ----
  const tally: P3[][] = [];
  [[-17.4, 8.2], [-14.2, 8.4]].forEach(([x0, h0], g) => {
    for (let k = 0; k < 4; k++) tally.push([P(x0 + k * 0.55, h0 + (hash(g * 9 + k) - 0.5) * 0.2, CELL_D - 0.03), P(x0 + k * 0.55 + 0.08, h0 + 2.1, CELL_D - 0.03)]);
    tally.push([P(x0 - 0.35, h0 + 0.4, CELL_D - 0.03), P(x0 + 2.05, h0 + 1.7, CELL_D - 0.03)]);
  });
  const tq = pr(c, P(-15, 9, CELL_D));
  // ---- floors ----
  const tiles: React.ReactNode[] = [];
  const TS = 4;
  for (let i = -CELL_HALF / TS; i < CELL_HALF / TS; i++) {
    for (let j = 0; j < CELL_D / TS; j++) {
      const x0 = i * TS - 1, x1 = Math.min(CELL_HALF, (i + 1) * TS - 1);
      const xa = Math.max(-CELL_HALF, x0);
      const d = polyD(c, floorRect(xa, x1, j * TS, (j + 1) * TS));
      if (!d) continue;
      const hv = hash(i * 7.13 + j * 3.71);
      tiles.push(<path key={`c${i}_${j}`} d={d} fill={mix(C.floorTile, C.floor, 0.15 + 0.35 * hv)} stroke={mix(C.floorTile, C.navy1, 0.6)} strokeWidth={1.1} vectorEffect={NS} />);
    }
    // the last partial column at the right
  }
  {
    const d = polyD(c, floorRect(CELL_HALF - 1, CELL_HALF, 0, CELL_D));
    if (d) tiles.push(<path key="cR" d={d} fill={mix(C.floorTile, C.floor, 0.3)} stroke={mix(C.floorTile, C.navy1, 0.6)} strokeWidth={1.1} vectorEffect={NS} />);
  }
  const slabs: React.ReactNode[] = [];
  const SS = 6;
  for (let i = xL / SS; i < xR / SS; i++) {
    for (let j = dFar / SS; j < 0; j++) {
      const d = polyD(c, floorRect(i * SS, (i + 1) * SS, j * SS, Math.min(RAIL_D0, (j + 1) * SS)));
      if (!d) continue;
      const hv = hash(i * 5.31 + j * 9.17 + 40);
      slabs.push(<path key={`s${i}_${j}`} d={d} fill={mix('#131E30', '#1B2940', 0.38 + 0.3 * hv)} stroke={mix('#0F1828', C.navy0, 0.3)} strokeWidth={1.1} vectorEffect={NS} />);
    }
  }
  // strip between the corridor slabs and the bar track
  const stripD = polyD(c, floorRect(xL, xR, RAIL_D0 - 0.01, 0.02));
  const cellFloor = polyD(c, floorRect(-CELL_HALF, CELL_HALF, 0, CELL_D));
  const corridor = polyD(c, floorRect(xL, xR, dFar, 0));
  const nbFloorL = polyD(c, floorRect(xL, -PX, 0, CELL_D));
  const nbFloorR = polyD(c, floorRect(PX, xR, 0, CELL_D));

  // light spilling through the bars into the corridor, with the bars' shadows cut out
  const spillPts = [P(-CELL_HALF, 0, 0), P(CELL_HALF, 0, 0), lampHit(P(CELL_HALF, BAR_H, 0)), lampHit(P(-CELL_HALF, BAR_H, 0))];
  const spill = polyD(c, spillPts);
  const casters = barCasters(door);
  const shadowD = casters.map((b) => polyD(c, [P(b.x - b.r, 0, b.d), P(b.x + b.r, 0, b.d), lampHit(P(b.x + b.r, b.h1, b.d)), lampHit(P(b.x - b.r, b.h1, b.d))])).join(' ');
  const ox = door * DOOR_W;
  const xbarShadow = polyD(c, [lampHit(P(DOOR.x0 + ox, 24.2, 0)), lampHit(P(DOOR.x1 + ox, 24.2, 0)), lampHit(P(DOOR.x1 + ox, 25.6, 0)), lampHit(P(DOOR.x0 + ox, 25.6, 0))]);
  const lockShadow = polyD(c, [lampHit(P(DOOR.x1 - 1.6 + ox, 11.2, -0.5)), lampHit(P(DOOR.x1 + 0.2 + ox, 11.2, -0.5)), lampHit(P(DOOR.x1 + 0.2 + ox, 14.6, -0.5)), lampHit(P(DOOR.x1 - 1.6 + ox, 14.6, -0.5))]);
  const maskId = uid('spillM');

  // ---- partitions, header, ceiling ----
  const partL: Bx = {x0: -PX, x1: -CELL_HALF, h0: 0, h1: WALL_H, d0: 0, d1: CELL_D};
  const partR: Bx = {x0: CELL_HALF, x1: PX, h0: 0, h1: WALL_H, d0: 0, d1: CELL_D};
  const partCol = (lt: boolean): BoxCol => ({
    top: C.wallLit, front: mix(C.wall, C.navy2, 0.2), back: C.navy1,
    left: lt ? C.navy1 : mix(C.wall, C.navy1, 0.42), right: lt ? mix(C.wall, C.navy1, 0.42) : C.navy1, bottom: C.navy1,
  });
  const header: Bx = {x0: xL, x1: xR, h0: BAR_H + RAIL_H, h1: WALL_H, d0: HEAD_D, d1: 2.6};
  const ceiling = polyD(c, floorRect(xL, xR, HEAD_D, CELL_D, WALL_H));

  // ---- alarm light on the back wall: the beam that points away from the viewer sweeps the back wall ----
  const ang = beamAngle(t);
  const beams = [ang, ang + Math.PI].map((a) => ({dx: Math.sin(a), dd: -Math.cos(a)}));
  const wallHit = beams.filter((b) => b.dd > 0.12).map((b) => ({x: ALARM.x + (b.dx * (CELL_D - ALARM.d)) / b.dd, k: b.dd}));

  const shaft = polyD(c, [P(-1.6, WALL_H, LAMP.d), P(1.6, WALL_H, LAMP.d), P(15, 0, LAMP.d), P(-15, 0, LAMP.d)]);

  return (
    <g>
      <rect x={-50} y={-50} width={W + 100} height={H + 100} fill={VOID} />
      {/* the corridor's far wall (only seen when looking back out of the cell) */}
      {corrWall && (
        <g>
          <path d={corrWall} fill={mix(C.wall, C.navy0, 0.72)} />
          {corrSeams.map((d, i) => d && <path key={`cs${i}`} d={d} fill={C.navy0} opacity={0.6} />)}
          <LinW c={c} a={P(0, 0, CORR_D)} b={P(0, 30, CORR_D)} d={corrWall} stops={[[0, C.navy0, 0.5], [0.4, C.navy0, 0], [1, C.navy0, 0.5]]} />
        </g>
      )}
      {/* ceiling (dark) and back wall */}
      {ceiling && <path d={ceiling} fill={C.navy0} />}
      {backWall && <path d={backWall} fill={mix(C.wall, C.navy0, 0.62)} />}
      <Pool c={c} o={P(0, 15, CELL_D)} u={P(30, 0, 0)} v={P(0, 22, 0)} d={backWall}
        stops={[[0, C.wallLit, 0.95], [0.38, C.wall, 0.75], [0.75, C.wall, 0.25], [1, C.wall, 0]]} />
      {panelSeams.map((d, i) => d && <path key={`ps${i}`} d={d} fill={C.wallMortar} opacity={0.85} />)}
      {vBevel.map((d, i) => d && <path key={`vb${i}`} d={d} fill={C.wallLit} opacity={0.22} />)}
      {hSeams.map((d, i) => d && <path key={`hs${i}`} d={d} fill={C.wallMortar} opacity={0.85} />)}
      {hBevel.map((d, i) => d && <path key={`hb${i}`} d={d} fill={'#000'} opacity={0.12} />)}
      {baseboard && <path d={baseboard} fill={mix(C.wallMortar, C.navy0, 0.3)} />}
      {tq.z > ZN * 2 && (
        <path d={tally.map((l) => lineD(c, l)).join(' ')} fill="none" stroke={C.wallLit} strokeOpacity={0.55} strokeWidth={Math.max(0.8, 0.13 * tq.s)} strokeLinecap="round" />
      )}
      {/* top darkening of the back wall (no ceiling light) */}
      <LinW c={c} a={P(0, WALL_H, CELL_D)} b={P(0, 18, CELL_D)} d={backWall} stops={[[0, C.navy0, 0.75], [1, C.navy0, 0]]} />
      {/* alarm: the far beam's red spot sliding across the back wall */}
      {al > 0.01 &&
        wallHit.map((hw, i) => (
          <Pool key={`aw${i}`} c={c} o={P(hw.x, 26, CELL_D - 0.05)} u={P(7 / hw.k, 0, 0)} v={P(0, 14, 0)} d={backWall} blend="screen"
            stops={[[0, C.redGlow, 0.5 * al * hw.k], [0.45, C.red, 0.22 * al * hw.k], [1, C.redDeep, 0]]} />
        ))}

      {/* neighbouring cells (unlit) */}
      {nbFloorL && <path d={nbFloorL} fill={mix(C.floorTile, C.navy0, 0.55)} />}
      {nbFloorR && <path d={nbFloorR} fill={mix(C.floorTile, C.navy0, 0.55)} />}
      <LinW c={c} a={P(0, 0, 0)} b={P(0, 0, CELL_D)} d={[nbFloorL, nbFloorR].filter(Boolean).join(' ')} stops={[[0, C.navy0, 0.1], [1, C.navy0, 0.6]]} />
      {/* cell floor */}
      {cellFloor && <path d={cellFloor} fill={C.floorTile} />}
      {tiles}
      <Pool c={c} o={P(0, 0, 8)} u={P(19, 0, 0)} v={P(0, 0, 15)} d={cellFloor}
        stops={[[0, lit(C.floorLit, 0.12), 0.85], [0.4, C.floorLit, 0.5], [0.8, C.floorLit, 0.1], [1, C.floorLit, 0]]} />
      {/* contact shadows: wall/floor seams, bunk */}
      <LinW c={c} a={P(0, 0, CELL_D)} b={P(0, 0, CELL_D - 3.2)} d={cellFloor} stops={[[0, C.navy0, 0.55], [1, C.navy0, 0]]} />
      <LinW c={c} a={P(-CELL_HALF, 0, 10)} b={P(-CELL_HALF + 3.2, 0, 10)} d={cellFloor} stops={[[0, C.navy0, 0.5], [1, C.navy0, 0]]} />
      <LinW c={c} a={P(CELL_HALF, 0, 10)} b={P(CELL_HALF - 3.2, 0, 10)} d={cellFloor} stops={[[0, C.navy0, 0.5], [1, C.navy0, 0]]} />
      <Pool c={c} o={P(-13.5, 0, 22)} u={P(8, 0, 0)} v={P(0, 0, 4)} d={polyD(c, floorRect(-22, -5, 17, 24))} stops={[[0, C.navy0, 0.6], [0.6, C.navy0, 0.3], [1, C.navy0, 0]]} />

      {/* corridor floor */}
      {corridor && <path d={corridor} fill={'#152133'} />}
      {slabs}
      {stripD && <path d={stripD} fill={'#18243A'} />}
      {/* corridor falloff: darker away from the bars */}
      <LinW c={c} a={P(0, 0, -1.5)} b={P(0, 0, -20)} d={corridor} stops={[[0, C.navy0, 0.0], [0.35, C.navy0, 0.35], [0.7, C.navy0, 0.6], [1, C.navy0, 0.75]]} />
      {/* light spilling through the bars, bar shadows cut out */}
      {spill && (
        <g>
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x={-LIM} y={-LIM} width={LIM * 2} height={LIM * 2}>
              <path d={spill} fill="#fff" />
              <path d={shadowD} fill="#000" />
              {xbarShadow && <path d={xbarShadow} fill="#000" />}
              {lockShadow && <path d={lockShadow} fill="#000" />}
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>
            {/* perspective-correct falloff (a radial pool on the floor plane): a screen-space linear gradient left a
                hard-edged lit band beyond the door's crossbar shadow on yawed cameras */}
            {affine(c, P(0, 0, 0), P(1, 0, 0), P(0, 0, 1)) ? (
              <Pool c={c} o={P(0, 0, 0)} u={P(36, 0, 0)} v={P(0, 0, 22)} d={spill} blend="screen"
                stops={[[0, COOL, 0.27], [0.35, COOL, 0.15], [0.75, COOL, 0.04], [1, COOL, 0]]} />
            ) : (
              <LinW c={c} a={P(0, 0, 0)} b={lampHit(P(0, BAR_H, 0))} d={spill} blend="screen"
                stops={[[0, COOL, 0.2], [0.22, COOL, 0.1], [0.55, COOL, 0.02], [0.7, COOL, 0]]} />
            )}
          </g>
        </g>
      )}
      {/* warm spill of the guard desk lamp on the corridor floor (right) */}
      <Pool c={c} o={P(20, 0, -14)} u={P(12, 0, 0)} v={P(0, 0, 9)} d={corridor} blend="screen" stops={[[0, WARM, 0.12], [0.5, WARM, 0.05], [1, WARM, 0]]} />

      {/* heat coil (cell floor) */}
      <CoilArt c={c} t={t} heat={heat} />

      {/* bunk against the back wall */}
      {[{x0: -18.2, x1: -17.2}, {x0: -9.8, x1: -8.8}].map((q, i) => (
        <Box key={`bl${i}`} c={c} b={{x0: q.x0, x1: q.x1, h0: 0, h1: 3.5, d0: 21.6, d1: CELL_D}} col={boxCol(mix(C.rail, C.navy2, 0.5))} ink={1.2} />
      ))}
      <Box c={c} b={bunkBox} col={boxCol(mix(C.rail, C.wall, 0.4), 1.2)} ink={1.4} />

      {/* partitions (cell side walls) */}
      <Box c={c} b={partL} col={partCol(true)} ink={1.6} />
      <Box c={c} b={partR} col={partCol(false)} ink={1.6} />
      {/* inner faces: soft lamp light near the top, dark at the floor seam */}
      {c.x > -CELL_HALF && <Pool c={c} o={P(-CELL_HALF, 20, 10)} u={P(0, 0, 16)} v={P(0, 18, 0)} d={polyD(c, sideRect(0, CELL_D, 0, WALL_H, -CELL_HALF))} stops={[[0, C.wallLit, 0.35], [1, C.wallLit, 0]]} />}
      {c.x < CELL_HALF && <Pool c={c} o={P(CELL_HALF, 20, 10)} u={P(0, 0, 16)} v={P(0, 18, 0)} d={polyD(c, sideRect(0, CELL_D, 0, WALL_H, CELL_HALF))} stops={[[0, C.wallLit, 0.35], [1, C.wallLit, 0]]} />}

      {/* the lamp's soft light shaft in the cell */}
      {steep > 0.01 && (
        <LinW c={c} a={P(0, WALL_H, LAMP.d)} b={P(0, 0, LAMP.d)} d={shaft} blend="screen" opacity={steep}
          stops={[[0, COOL, 0.12], [0.6, COOL, 0.05], [1, COOL, 0.0]]} />
      )}
      {/* header wall above the bars */}
      <Box c={c} b={header} col={{...boxCol(mix(C.wall, C.navy1, 0.35)), front: mix(C.wall, C.navy1, 0.35), top: mix(C.navy2, C.navy1, 0.4)}} ink={1.6} />
      {al > 0.01 && (
        <Pool c={c} o={P(ALARM.x, ALARM.h, HEAD_D - 0.02)} u={P(9, 0, 0)} v={P(0, 7, 0)} d={polyD(c, wallRect(xL, xR, BAR_H + RAIL_H, WALL_H, HEAD_D - 0.02))} blend="screen"
          stops={[[0, C.redGlow, al * (0.25 + 0.45 * sw)], [1, C.red, 0]]} />
      )}

      {/* overall alarm ambience (red bounce) */}
      {al > 0.01 && <rect x={-50} y={-50} width={W + 100} height={H + 100} fill={C.redDeep} opacity={al * (0.012 + 0.03 * sw)} style={{mixBlendMode: 'screen'}} />}
      {dim > 0 && <rect x={-50} y={-50} width={W + 100} height={H + 100} fill={C.navy0} opacity={clamp(dim) * 0.65} />}
    </g>
  );
};

// =====================================================================================================================
// Bars
// =====================================================================================================================
/** convex hull (monotone chain) of screen points */
const hull = (pts: S2[]): S2[] => {
  const p = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3) return p;
  const cr = (o: S2, a: S2, b: S2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: S2[] = [], up: S2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};

/** a vertical steel cylinder: exact silhouette = hull of its two projected end discs; shaded across its width
 *  (lit upper-left, dark right, optional red alarm rim on the right edge); its top disc shows when seen from above */
const Cyl: React.FC<{c: Cam3; x: number; d: number; h0: number; h1: number; r: number; rim: number; capTop?: boolean; aoOn?: string}> = ({c, x, d, h0, h1, r, rim, capTop = true, aoOn}) => {
  const axial = c.pitch < 75;
  let A = toCam(c, P(x, h0, d)), B = toCam(c, P(x, h1, d));
  if (A.z < ZN && B.z < ZN) return null;
  let ha = h0, hb = h1;
  if (A.z < ZN) {
    const u = (ZN - A.z) / (B.z - A.z);
    A = lq(A, B, u);
    ha = h0 + (h1 - h0) * u;
  }
  if (B.z < ZN) {
    const u = (ZN - B.z) / (A.z - B.z);
    B = lq(B, A, u);
    hb = h1 + (h0 - h1) * u;
  }
  const N = 28;
  const disc = (h: number) => {
    const pts = Array.from({length: N}, (_, i) => P(x + r * Math.cos((i / N) * Math.PI * 2), h, d + r * Math.sin((i / N) * Math.PI * 2)));
    const q = clipPoly(c, pts);
    return q;
  };
  const da = disc(ha), db = disc(hb);
  const sil = hull(da.concat(db));
  if (sil.length < 3) return null;
  const a = sp(c, A), b = sp(c, B);
  const ra = (r * c.f) / A.z, rb = (r * c.f) / B.z;
  const ax = {x: b.x - a.x, y: b.y - a.y};
  const L = Math.hypot(ax.x, ax.y);
  let n = L > 0.5 ? {x: -ax.y / L, y: ax.x / L} : {x: -1, y: 0};
  if (n.x * -0.62 + n.y * -0.78 < 0) n = {x: -n.x, y: -n.y}; // n points toward the key light (upper-left)
  // shade across the width at the visible point of the axis nearest the frame's middle (robust to near clipping)
  let best = {u: 0.5, score: Infinity};
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const q = sp(c, lq(A, B, u));
    const off = Math.max(0, Math.abs(q.x - W / 2) - W / 2) + Math.abs(q.y - H / 2) * 0.6;
    if (off < best.score) best = {u, score: off};
  }
  const Mq = lq(A, B, best.u);
  const mid = sp(c, Mq);
  const rm = (r * c.f) / Mq.z;
  const id = uid('bar');
  const rk = clamp(rim);
  const showCap = capTop && c.h > h1 && hb === h1;
  return (
    <g>
      {/* contact shadow on the surface the bar stands on (aoOn = that surface's path: clips the pool to it) */}
      {aoOn && c.h > h0 && (
        <Pool c={c} o={P(x + 0.12, h0 + 0.004, d)} u={P(r * 2.1, 0, 0)} v={P(0, 0, r * 1.9)} d={aoOn}
          stops={[[0, C.navy0, 0.75], [0.45, C.navy0, 0.55], [0.75, C.navy0, 0.18], [1, C.navy0, 0]]} />
      )}
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f1(mid.x + n.x * rm)} y1={f1(mid.y + n.y * rm)} x2={f1(mid.x - n.x * rm)} y2={f1(mid.y - n.y * rm)}>
          <stop offset={0} stopColor={mix(C.steel, C.steelDark, 0.35)} />
          <stop offset={0.12} stopColor={mix(C.steel, C.steelLit, 0.55)} />
          <stop offset={0.17} stopColor={lit(C.steelLit, 0.12)} />
          <stop offset={0.195} stopColor={SPEC} />
          <stop offset={0.22} stopColor={lit(C.steelLit, 0.1)} />
          <stop offset={0.3} stopColor={mix(C.steel, C.steelLit, 0.45)} />
          <stop offset={0.48} stopColor={C.steel} />
          <stop offset={0.72} stopColor={mix(C.steel, C.steelDark, 0.75)} />
          <stop offset={0.8} stopColor={mix(C.steelDark, '#18202C', 0.35)} />
          <stop offset={0.86} stopColor={mix(mix(C.steelDark, '#18202C', 0.2), C.redDeep, rk * 0.35)} />
          <stop offset={0.94} stopColor={mix(C.steelDark, C.redDeep, rk * 0.85)} />
          <stop offset={1} stopColor={rk > 0.01 ? mix(mix(C.steelDark, C.steel, 0.4), C.redGlow, rk * 0.9) : mix(C.steelDark, C.steel, 0.4)} />
        </linearGradient>
      </defs>
      <path d={pathS(sil)} fill={`url(#${id})`} stroke={INK} strokeWidth={2} strokeLinejoin="round" vectorEffect={NS} />
      {axial && (() => {
        // light falls off toward the top of the bar (the cell lamp sits mid-height) and a little toward the floor
        const t0 = pr(c, P(x, h1, d)), t1 = pr(c, P(x, h0, d));
        const gid = uid('barAx');
        const k = (h: number) => clamp((h - h0) / (h1 - h0 || 1));
        return (
          <g>
            <defs>
              <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={f1(t1.x)} y1={f1(t1.y)} x2={f1(t0.x)} y2={f1(t0.y)}>
                <stop offset={0} stopColor={C.navy0} stopOpacity={0.3} />
                <stop offset={k(5)} stopColor={C.navy0} stopOpacity={0} />
                <stop offset={k(15)} stopColor={C.navy0} stopOpacity={0} />
                <stop offset={1} stopColor={C.navy0} stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <path d={pathS(sil)} fill={`url(#${gid})`} />
          </g>
        );
      })()}
      {showCap && db.length > 2 && <path d={pathS(db)} fill={mix(C.steel, C.steelLit, 0.35)} stroke={INK} strokeWidth={1.4} vectorEffect={NS} />}
    </g>
  );
};

/** a rivet head on a face (billboard dot with a gloss) */
const Rivet: React.FC<{c: Cam3; p: P3; r?: number}> = ({c, p, r = 0.28}) => {
  const q = pr(c, p);
  if (q.z < ZN * 2) return null;
  const R = Math.max(1.2, r * q.s);
  return (
    <g>
      <circle cx={f1(q.x)} cy={f1(q.y)} r={f1(R)} fill={C.steel} stroke={INK} strokeWidth={1.1} vectorEffect={NS} />
      <circle cx={f1(q.x - R * 0.3)} cy={f1(q.y - R * 0.35)} r={f1(R * 0.38)} fill={C.steelLit} opacity={0.9} />
    </g>
  );
};

export const Bars: React.FC<{c: Cam3; t: number; door: number; alarm: number; shake?: number; only?: 'all' | 'door' | 'fixed'}> = ({c, t, door, alarm, shake = 0, only = 'all'}) => {
  const al = clamp(alarm);
  const rim = al * (0.15 + 0.85 * alarmSweep(t));
  const sk = clamp(shake);
  const vib = sk * (0.32 * Math.sin(t * 2 * Math.PI * 13) + 0.12 * Math.sin(t * 2 * Math.PI * 21 + 1));
  const ox = clamp(door) * DOOR_W + vib;
  const showDoor = only !== 'fixed', showFixed = only !== 'door';
  const steelBox = boxCol(C.rail, 1.1);
  const xr = BAR_XS[BAR_XS.length - 1] + 2.5;

  // ---- fixed bars (sorted far to near) ----
  const fixedXs = BAR_XS.filter((x) => x < DOOR.x0 || x > DOOR.x1);
  const fixed = fixedXs
    .map((x) => ({x, z: zOf(c, P(x, BAR_H / 2, FIXED_D))}))
    .sort((a, b) => b.z - a.z)
    .map((b) => <Cyl key={`f${b.x}`} c={c} x={b.x} d={FIXED_D} h0={TRACK_H} h1={BAR_H} r={BAR_R} rim={rim}
      aoOn={polyD(c, floorRect(b.x - 1.6, b.x + 1.6, RAIL_D0, RAIL_D1, TRACK_H + 0.006))} />);

  // ---- door section ----
  const doorBarXs = BAR_XS.filter((x) => x > DOOR.x0 && x < DOOR.x1);
  const dX0 = DOOR.x0 + ox, dX1 = DOOR.x1 + ox;
  const doorBars = doorBarXs
    .map((x) => ({x: x + ox, z: zOf(c, P(x + ox, BAR_H / 2, DOOR_D))}))
    .sort((a, b) => b.z - a.z)
    .map((b) => <Cyl key={`d${b.x.toFixed(2)}`} c={c} x={b.x} d={DOOR_D} h0={SILL_H} h1={24.3} r={BAR_R} rim={rim}
      aoOn={polyD(c, floorRect(b.x - 1.6, b.x + 1.6, DOOR_D - 0.75, DOOR_D + 0.75, SILL_H + 0.006))} />);
  const stile = (x0: number, x1: number) => ({x0, x1, h0: TRACK_H, h1: 25.6, d0: DOOR_D - 0.7, d1: DOOR_D + 0.7});
  const lockB: Bx = {x0: dX1 - 1.9, x1: dX1 + 0.15, h0: 11.0, h1: 14.8, d0: DOOR_D - 1.3, d1: DOOR_D - 0.7};
  const kq = pr(c, P(lockB.x0 + 0.95, 12.6, lockB.d0 - 0.01));
  const lockBox = <Box c={c} b={lockB} col={boxCol(mix(C.rail, C.steelDark, 0.25), 1.2)} ink={1.8} />;
  const doorFrame = (
    <g>
      <Box c={c} b={{x0: dX0, x1: dX1, h0: TRACK_H + 0.04, h1: SILL_H, d0: DOOR_D - 0.75, d1: DOOR_D + 0.75}} col={{...boxCol(mix(C.steelDark, C.rail, 0.55)), top: mix(C.rail, C.steel, 0.3)}} ink={1.6} />
      {/* worn bright edge along the sill's front lip (catches the cell light) */}
      {(() => {
        const lipD = c.d < DOOR_D ? DOOR_D - 0.75 : DOOR_D + 0.75;
        const lip = polyD(c, floorRect(dX0 + 0.9, dX1 - 0.9, lipD + (c.d < DOOR_D ? 0 : -0.12), lipD + (c.d < DOOR_D ? 0.12 : 0), SILL_H + 0.003));
        return lip ? <path d={lip} fill={C.steelLit} opacity={0.35} /> : null;
      })()}
      {/* diamond tread plate on the sill top: only resolves when the camera is low and close (S4 crossing) */}
      {c.h > SILL_H && (() => {
        const sq = pr(c, P(clamp(c.x, dX0 + 1, dX1 - 1), SILL_H, DOOR_D));
        const k = clamp((sq.s - 70) / 80);
        if (k <= 0.01 || sq.z < ZN) return null;
        const marks: string[] = [], shadows: string[] = [];
        const hT = SILL_H + 0.004;
        const lz = (x: number, dd: number, sg: number, off = 0) => {
          const a = 0.12, w = 0.035; // half-length, half-width of one raised lozenge (diamond plate)
          return polyD(c, [P(x - a + off, hT, dd - sg * a - off), P(x - w + off, hT, dd + sg * w - off), P(x + a + off, hT, dd + sg * a - off), P(x + w + off, hT, dd - sg * w - off)]);
        };
        for (let i = 0; dX0 + 1.2 + i * 0.5 < dX1 - 1.0; i++) {
          for (let j = -1; j <= 1; j++) {
            const x = dX0 + 1.2 + i * 0.5 + (j % 2 === 0 ? 0 : 0.25);
            if (Math.abs(x - c.x) > 9) continue;
            const dd = DOOR_D + j * 0.45;
            const sg = i % 2 === 0 ? 1 : -1;
            const m = lz(x, dd, sg), sh = lz(x, dd, sg, 0.025);
            if (m) marks.push(m);
            if (sh) shadows.push(sh);
          }
        }
        return (
          <g opacity={k * 0.8}>
            <path d={shadows.join(' ')} fill={C.navy0} opacity={0.45} />
            <path d={marks.join(' ')} fill={lit(mix(C.rail, C.steel, 0.35), 0.12)} />
          </g>
        );
      })()}
      {c.d > DOOR_D && lockBox}
      {doorBars}
      <Box c={c} b={{x0: dX0, x1: dX1, h0: 24.2, h1: 25.6, d0: DOOR_D - 0.75, d1: DOOR_D + 0.75}} col={steelBox} ink={1.8} />
      <Box c={c} b={stile(dX0, dX0 + 0.9)} col={steelBox} ink={1.8} />
      <Box c={c} b={stile(dX1 - 0.9, dX1)} col={steelBox} ink={1.8} />
      {c.d < DOOR_D - 0.8 && [dX0 + 0.45, dX0 + 5.2, ox, dX1 - 5.2, dX1 - 0.45].map((x, i) => <Rivet key={`dr${i}`} c={c} p={P(x, 24.9, DOOR_D - 0.76)} r={0.24} />)}
      {/* lock box with keyhole (corridor side) */}
      {c.d <= DOOR_D && lockBox}
      {c.d < lockB.d0 && kq.z > ZN * 2 && (
        <g>
          <circle cx={f1(kq.x)} cy={f1(kq.y)} r={Math.max(1, 0.2 * kq.s)} fill={C.navy0} />
          <path d={`M${f1(kq.x - 0.09 * kq.s)},${f1(kq.y)} L${f1(kq.x + 0.09 * kq.s)},${f1(kq.y)} L${f1(kq.x + 0.15 * kq.s)},${f1(kq.y + 0.6 * kq.s)} L${f1(kq.x - 0.15 * kq.s)},${f1(kq.y + 0.6 * kq.s)} Z`} fill={C.navy0} />
          <Rivet c={c} p={P(lockB.x0 + 0.35, lockB.h1 - 0.4, lockB.d0 - 0.01)} r={0.16} />
          <Rivet c={c} p={P(lockB.x1 - 0.35, lockB.h1 - 0.4, lockB.d0 - 0.01)} r={0.16} />
          <Rivet c={c} p={P(lockB.x0 + 0.35, lockB.h0 + 0.4, lockB.d0 - 0.01)} r={0.16} />
          <Rivet c={c} p={P(lockB.x1 - 0.35, lockB.h0 + 0.4, lockB.d0 - 0.01)} r={0.16} />
        </g>
      )}
    </g>
  );

  // ---- floor track (with base occlusion) and top rail ----
  const slot = polyD(c, floorRect(-xr, xr, DOOR_D - 0.5, DOOR_D + 0.5, TRACK_H + 0.005));
  const slotF = polyD(c, floorRect(-xr, xr, FIXED_D - 0.75, FIXED_D + 0.75, TRACK_H + 0.005));
  const track = (
    <g>
      <Box c={c} b={{x0: -xr, x1: xr, h0: 0, h1: TRACK_H, d0: RAIL_D0, d1: RAIL_D1}} col={{...boxCol(mix(C.steelDark, C.navy1, 0.4), 0.8), top: mix(C.steelDark, C.navy2, 0.3)}} ink={1.2} inkA={0.7} />
      {slot && <path d={slot} fill={mix(C.steelDark, C.navy0, 0.55)} />}
      {slotF && <path d={slotF} fill={mix(C.steelDark, C.navy0, 0.3)} />}
    </g>
  );
  const aoD = polyD(c, floorRect(-xr, xr, RAIL_D0 - 1.2, RAIL_D1 + 1.2, 0.01));
  const ao = (
    <LinW c={c} a={P(0, 0, RAIL_D0 - 1.2)} b={P(0, 0, RAIL_D1 + 1.2)} d={aoD}
      stops={[[0, C.navy0, 0], [0.35, C.navy0, 0.38], [0.65, C.navy0, 0.38], [1, C.navy0, 0]]} />
  );
  const rail = <Box c={c} b={{x0: -xr, x1: xr, h0: BAR_H, h1: BAR_H + RAIL_H, d0: RAIL_D0, d1: RAIL_D1}} col={{...steelBox, top: mix(C.rail, C.navy2, 0.35), bottom: mix(C.steelDark, C.navy1, 0.3)}} ink={2} />;
  const railRivets = c.d < RAIL_D0
    ? BAR_XS.map((x) => <Rivet key={`rr${x}`} c={c} p={P(x, BAR_H + RAIL_H / 2, RAIL_D0 - 0.02)} r={0.3} />)
    : null;
  const trackRivets = c.h > TRACK_H
    ? fixedXs.map((x) => <Rivet key={`tr${x}`} c={c} p={P(x + BAR_GAP_HALF, TRACK_H + 0.01, (RAIL_D0 + FIXED_D) / 2 - 0.1)} r={0.22} />)
    : null;

  // door plane vs fixed plane: draw the farther plane first
  const corridorSide = c.d < (DOOR_D + FIXED_D) / 2;
  const fixedG = showFixed ? <g>{fixed}</g> : null;
  const doorG = showDoor ? doorFrame : null;
  return (
    <g>
      {showFixed && ao}
      {showFixed && track}
      {showFixed && trackRivets}
      {corridorSide ? (
        <>
          {doorG}
          {fixedG}
        </>
      ) : (
        <>
          {fixedG}
          {doorG}
        </>
      )}
      {showFixed && rail}
      {showFixed && railRivets}
    </g>
  );
};

// =====================================================================================================================
// JailFront: sparse corridor foreground
// =====================================================================================================================
export const PILLAR: Bx = {x0: -33, x1: -27, h0: 0, h1: 80, d0: -17, d1: -11};
const DESK: Bx = {x0: 19.5, x1: 36, h0: 0, h1: 11, d0: -21, d1: -12.5};
const DRAIN = {x: -11, d: -6, r: 1.6};

export const JailFront: React.FC<{c: Cam3; t: number; alarm: number}> = ({c, t, alarm}) => {
  const al = clamp(alarm);
  const sw = alarmSweep(t);
  // drain grate
  const {x: gx, d: gd, r: gr} = DRAIN;
  const drainFrame = polyD(c, floorRect(gx - gr - 0.35, gx + gr + 0.35, gd - gr - 0.35, gd + gr + 0.35, 0.02));
  const drainHole = polyD(c, floorRect(gx - gr, gx + gr, gd - gr, gd + gr, 0.03));
  const drainSlats = Array.from({length: 5}, (_, i) => {
    const x = gx - gr + ((i + 0.5) / 5) * gr * 2;
    return polyD(c, floorRect(x - 0.16, x + 0.16, gd - gr, gd + gr, 0.04));
  });
  // desk
  const top: Bx = {x0: DESK.x0 - 0.6, x1: DESK.x1, h0: DESK.h1, h1: DESK.h1 + 0.8, d0: DESK.d0 - 0.4, d1: DESK.d1 + 0.6};
  const deskCol = boxCol(mix(C.navy3, C.rail, 0.35), 1.1);
  const topCol = boxCol(mix('#5B4A3E', C.navy3, 0.35), 1.2); // local: dark wood desktop
  // lamp on the desk
  const L0 = P(22.6, top.h1, -15.2);
  const lb = pr(c, L0);
  const lh = pr(c, P(L0.x + 0.6, top.h1 + 4.6, L0.d));
  const lsh = pr(c, P(L0.x + 2.4, top.h1 + 4.2, L0.d));
  const showLamp = lb.z > ZN * 2;
  const s = lb.s;
  const glowId = uid('lampG');
  const pillarDark = mix(C.navy1, C.navy0, 0.35);
  return (
    <g>
      {/* drain */}
      {drainFrame && (
        <g>
          <Pool c={c} o={P(gx, 0, gd)} u={P(gr * 2.2, 0, 0)} v={P(0, 0, gr * 2.2)} d={polyD(c, floorCircle(gx, gd, gr * 2.2, 0.01))} stops={[[0, C.navy0, 0.35], [1, C.navy0, 0]]} />
          <path d={drainFrame} fill={mix(C.rail, C.navy2, 0.45)} stroke={INK} strokeWidth={1.3} vectorEffect={NS} />
          <path d={drainHole} fill={C.navy0} />
          {drainSlats.map((d, i) => d && <path key={i} d={d} fill={mix(C.steel, C.navy2, 0.35)} stroke={INK} strokeWidth={0.8} vectorEffect={NS} />)}
        </g>
      )}
      {/* guard desk (right) */}
      <Pool c={c} o={P((DESK.x0 + DESK.x1) / 2, 0, (DESK.d0 + DESK.d1) / 2)} u={P(11, 0, 0)} v={P(0, 0, 7.5)} d={polyD(c, floorCircle((DESK.x0 + DESK.x1) / 2, (DESK.d0 + DESK.d1) / 2, 11, 0.01))}
        stops={[[0, C.navy0, 0.55], [0.6, C.navy0, 0.3], [1, C.navy0, 0]]} />
      <Box c={c} b={DESK} col={deskCol} ink={1.8} />
      <Box c={c} b={top} col={topCol} ink={2} />
      {c.h > top.h1 && (
        <Pool c={c} o={P(L0.x + 2.5, top.h1 + 0.01, L0.d)} u={P(8, 0, 0)} v={P(0, 0, 6)} d={polyD(c, floorRect(top.x0, top.x1, top.d0, top.d1, top.h1 + 0.01))} blend="screen"
          stops={[[0, WARM, 0.5], [0.5, WARM, 0.18], [1, WARM, 0]]} />
      )}
      {c.d < top.d0 && (
        <Pool c={c} o={P(L0.x + 2.5, top.h1, top.d0 - 0.01)} u={P(7, 0, 0)} v={P(0, 3, 0)} d={polyD(c, wallRect(top.x0, top.x1, top.h0, top.h1, top.d0 - 0.01))} blend="screen"
          stops={[[0, WARM, 0.25], [1, WARM, 0]]} />
      )}
      {showLamp && (
        <g>
          <defs>
            <radialGradient id={glowId}>
              <stop offset={0} stopColor={WARM} stopOpacity={0.55} />
              <stop offset={0.4} stopColor={WARM} stopOpacity={0.18} />
              <stop offset={1} stopColor={WARM} stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={f1(lsh.x)} cy={f1(lsh.y + 0.9 * s)} rx={f1(6 * s)} ry={f1(6 * s)} fill={`url(#${glowId})`} style={{mixBlendMode: 'screen'}} />
          {/* base, arm, shade */}
          <ellipse cx={f1(lb.x)} cy={f1(lb.y)} rx={f1(1.3 * s)} ry={f1(0.42 * s)} fill={C.steelDark} stroke={INK} strokeWidth={1.6} vectorEffect={NS} />
          <path d={`M${f1(lb.x)},${f1(lb.y)} L${f1(lh.x)},${f1(lh.y)} L${f1(lsh.x)},${f1(lsh.y)}`} fill="none" stroke={INK} strokeWidth={0.42 * s + 2.4} strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${f1(lb.x)},${f1(lb.y)} L${f1(lh.x)},${f1(lh.y)} L${f1(lsh.x)},${f1(lsh.y)}`} fill="none" stroke={C.steel} strokeWidth={0.42 * s} strokeLinecap="round" strokeLinejoin="round" />
          <path
            d={`M${f1(lsh.x - 1.0 * s)},${f1(lsh.y - 0.5 * s)} Q${f1(lsh.x)},${f1(lsh.y - 1.6 * s)} ${f1(lsh.x + 1.0 * s)},${f1(lsh.y - 0.5 * s)} L${f1(lsh.x + 1.9 * s)},${f1(lsh.y + 0.9 * s)} L${f1(lsh.x - 1.9 * s)},${f1(lsh.y + 0.9 * s)} Z`}
            fill={'#2F5D4A'} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" vectorEffect={NS} />
          <path d={`M${f1(lsh.x - 0.7 * s)},${f1(lsh.y - 0.55 * s)} Q${f1(lsh.x - 0.3 * s)},${f1(lsh.y - 1.05 * s)} ${f1(lsh.x + 0.2 * s)},${f1(lsh.y - 0.95 * s)}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={0.18 * s} strokeLinecap="round" />
          <ellipse cx={f1(lsh.x)} cy={f1(lsh.y + 0.9 * s)} rx={f1(1.9 * s)} ry={f1(0.35 * s)} fill={lit(WARM, 0.5)} stroke={INK} strokeWidth={1.4} vectorEffect={NS} />
        </g>
      )}
      {/* foreground pillar (motivated wipe) */}
      <Box c={c} b={PILLAR} col={{top: mix(C.navy2, C.navy1, 0.3), front: pillarDark, left: mix(pillarDark, C.navy2, 0.25), right: mix(C.navy0, pillarDark, 0.4), bottom: C.navy0}} ink={2.4} />
      {c.x > PILLAR.x1 && (
        <LinW c={c} a={P(PILLAR.x1, 20, PILLAR.d1)} b={P(PILLAR.x1, 20, PILLAR.d0)} d={polyD(c, sideRect(PILLAR.d0, PILLAR.d1, 0, PILLAR.h1, PILLAR.x1))}
          stops={[[0, COOL, 0.16], [0.25, COOL, 0.04], [1, COOL, 0]]} blend="screen" />
      )}
      {c.d < PILLAR.d0 && al > 0.01 && (
        <LinW c={c} a={P(PILLAR.x1, 20, PILLAR.d0)} b={P(PILLAR.x1 - 2, 20, PILLAR.d0)} d={polyD(c, wallRect(PILLAR.x0, PILLAR.x1, 0, PILLAR.h1, PILLAR.d0))}
          stops={[[0, C.red, 0.4 * al * (0.3 + 0.7 * sw)], [1, C.red, 0]]} blend="screen" />
      )}
    </g>
  );
};

// =====================================================================================================================
// AlarmBeacon
// =====================================================================================================================
export const AlarmBeacon: React.FC<{c: Cam3; t: number; alarm: number}> = ({c, t, alarm}) => {
  const al = clamp(alarm);
  const q = pr(c, ALARM);
  if (q.z < ZN * 3) return null;
  const s = q.s;
  const ang = beamAngle(t);
  const sw = alarmSweep(t);
  // mounting: bracket from the header wall + a short cylinder base
  const baseTop = pr(c, P(ALARM.x, ALARM.h - 0.1, ALARM.d));
  const baseBot = pr(c, P(ALARM.x, ALARM.h - 1.1, ALARM.d));
  const bx = baseTop.x, by = baseTop.y;
  const R = 1.35 * s; // dome radius
  const domeH = 1.75 * s;
  const domeD = `M${f1(bx - R)},${f1(by)} C${f1(bx - R)},${f1(by - domeH * 1.05)} ${f1(bx + R)},${f1(by - domeH * 1.05)} ${f1(bx + R)},${f1(by)} Z`;
  const ids = {dome: uid('bDome'), glow: uid('bGlow'), refl: uid('bRef'), clip: uid('bClip')};
  // the rotating reflector: seen from the front its bright face slides across the dome
  const refl = [ang, ang + Math.PI].map((a) => ({x: Math.sin(a), face: Math.max(0, -Math.cos(a))}));
  const offC = '#5E1018';
  return (
    <g>
      <defs>
        <radialGradient id={ids.dome} cx="38%" cy="35%" r="75%">
          <stop offset={0} stopColor={al > 0 ? mix('#FF9A8A', C.red, 1 - al) : '#C2414A'} />
          <stop offset={0.45} stopColor={al > 0 ? mix(C.redDeep, C.red, al) : C.redDeep} />
          <stop offset={1} stopColor={al > 0 ? mix(offC, C.redDeep, al) : offC} />
        </radialGradient>
        <radialGradient id={ids.glow}>
          <stop offset={0} stopColor={C.redGlow} stopOpacity={0.75} />
          <stop offset={0.3} stopColor={C.red} stopOpacity={0.3} />
          <stop offset={1} stopColor={C.red} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={ids.refl}>
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset={0.35} stopColor="#FFD6C8" stopOpacity={0.9} />
          <stop offset={1} stopColor={C.red} stopOpacity={0} />
        </radialGradient>
        <clipPath id={ids.clip}>
          <path d={domeD} />
        </clipPath>
      </defs>
      {/* bracket plate on the wall */}
      <rect x={f1(bx - 1.9 * s)} y={f1(baseBot.y - 0.1 * s)} width={f1(3.8 * s)} height={f1(1.3 * s)} rx={f1(0.25 * s)} fill={C.steelDark} stroke={INK} strokeWidth={1.6} vectorEffect={NS} />
      <rect x={f1(bx - 1.6 * s)} y={f1(by)} width={f1(3.2 * s)} height={f1(Math.max(2, baseBot.y - by))} fill={C.steel} stroke={INK} strokeWidth={1.6} vectorEffect={NS} />
      <rect x={f1(bx - 1.6 * s)} y={f1(by)} width={f1(3.2 * s)} height={f1(0.25 * s)} fill={C.steelLit} opacity={0.7} />
      {/* dome */}
      <path d={domeD} fill={`url(#${ids.dome})`} stroke={INK} strokeWidth={2} vectorEffect={NS} />
      {al > 0.01 && (
        <g clipPath={`url(#${ids.clip})`}>
          {refl.map((r, i) => (
            <ellipse key={i} cx={f1(bx + r.x * R * 0.62)} cy={f1(by - domeH * 0.42)} rx={f1(R * (0.18 + 0.55 * r.face))} ry={f1(domeH * 0.48)}
              fill={`url(#${ids.refl})`} opacity={al * (0.35 + 0.65 * r.face)} />
          ))}
        </g>
      )}
      {/* dome gloss + cage ribs */}
      <path d={`M${f1(bx - R * 0.62)},${f1(by - domeH * 0.35)} Q${f1(bx - R * 0.5)},${f1(by - domeH * 0.82)} ${f1(bx - R * 0.05)},${f1(by - domeH * 0.86)}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={Math.max(1.2, 0.16 * s)} strokeLinecap="round" />
      {[-0.5, 0, 0.5].map((k, i) => (
        <path key={i} d={`M${f1(bx + k * R * 1.1)},${f1(by)} Q${f1(bx + k * R * 1.25)},${f1(by - domeH * 0.8)} ${f1(bx)},${f1(by - domeH * 0.79)}`} fill="none" stroke={INK} strokeOpacity={0.55} strokeWidth={Math.max(1, 0.1 * s)} />
      ))}
      {al > 0.01 && <ellipse cx={f1(bx)} cy={f1(by - domeH * 0.45)} rx={f1(R * (2.4 + 3.5 * sw))} ry={f1(R * (2.2 + 3.0 * sw))} fill={`url(#${ids.glow})`} opacity={al * (0.55 + 0.45 * sw)} style={{mixBlendMode: 'screen'}} />}
    </g>
  );
};

// =====================================================================================================================
// AlarmWash (screen space)
// =====================================================================================================================
export const AlarmWash: React.FC<{c: Cam3; t: number; alarm: number}> = ({c, t, alarm}) => {
  const al = clamp(alarm);
  if (al <= 0.001) return null;
  const sw = alarmSweep(t);
  const qc = toCam(c, ALARM);
  // beacon on screen; if it is behind the camera, emit from above the frame
  const b = qc.z > ZN ? sp(c, qc) : {x: W * 0.7, y: -300};
  const bx = clamp(b.x, -900, W + 900), by = clamp(b.y, -1400, H + 600);
  const aim = Math.atan2(H * 0.52 - by, W * 0.5 - bx);
  const ang = beamAngle(t);
  const Lc = 3400;
  const id = uid('wash');
  const vg = uid('washV');
  const cones = [ang, ang + Math.PI].map((a) => aim + a);
  const wedge = (a: number, half: number) => {
    const p1 = {x: bx + Lc * Math.cos(a - half), y: by + Lc * Math.sin(a - half)};
    const p2 = {x: bx + Lc * Math.cos(a + half), y: by + Lc * Math.sin(a + half)};
    return `M${f1(bx)},${f1(by)} L${f1(p1.x)},${f1(p1.y)} L${f1(p2.x)},${f1(p2.y)} Z`;
  };
  const halves = [0.05, 0.09, 0.14];
  return (
    <g pointerEvents="none">
      {/* red-dark edges (multiply keeps the centre clean) */}
      <rect x={0} y={0} width={W} height={H} fill={`url(#${vg})`} opacity={al * (0.35 + 0.25 * sw)} style={{mixBlendMode: 'multiply'}} />
      <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={f1(bx)} cy={f1(by)} r={Lc}>
          <stop offset={0} stopColor={WASH_HOT} stopOpacity={1} />
          <stop offset={0.3} stopColor={WASH_RED} stopOpacity={0.8} />
          <stop offset={0.75} stopColor={WASH_RED} stopOpacity={0.4} />
          <stop offset={1} stopColor={WASH_RED} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={vg} cx="50%" cy="48%" r="72%">
          <stop offset={0.35} stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset={0.8} stopColor="#7A2030" stopOpacity={0.7} />
          <stop offset={1} stopColor="#4A0A16" stopOpacity={1} />
        </radialGradient>
      </defs>
      {cones.map((a, i) => (
        <g key={i}>
          {halves.map((h, j) => (
            <path key={j} d={wedge(a, h)} fill={`url(#${id})`} opacity={al * 0.1} />
          ))}
        </g>
      ))}
      {/* pulse in sync with the sweep: a faint overall red lift */}
      <rect x={0} y={0} width={W} height={H} fill={C.redDeep} opacity={al * (0.01 + 0.03 * sw)} />
      </g>
    </g>
  );
};
