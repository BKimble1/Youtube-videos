// Cutaway drawing for the mechanism shots (S09 launch, S10 delivery): the medic's launch tube cut open along its
// length (far half kept, clean hatched cut faces) with the spring, the injector, the latch line through the holes at the
// mouth, the nichrome coil on the line and the fine wire from the board to the coil; the injector cut along its axis
// (activator chamber in the plunger, gas, dose, needle bore); the silicone target block and its cradle cut at z = 0.
// Everything is drawn through the shot camera from the body frame of the insect (or the injector / world frame), in the
// Weird Crew finish: ink #172B3A contours, gradient fills from the fixed upper-left key light.
//
// Local copies (adapted) of shared code: StimWire is rig/Gear.tsx's Wire (not exported there); Helix is Gear's Spring
// with colour and width parameters; PackBase is the top half of Gear (wires, saddle, board, chips, cell) split into the
// parts behind and in front of the tube's cut plane.
import React from 'react';
import {Cam, proj, scaleAt} from '../lib/cam';
import {V3, V2, Frame, toW, add, sub, mul, dot, norm, cross, lerp3, len} from '../lib/v3';
import {fmt, polyPath, openPath, closedPath} from '../lib/g3';
import {INK} from '../lib/ink';
import {lit, shade, mix} from '../lib/color';
import {PACK, INJ, wiresOn, WirePt} from './gear';
import {GEAR_COL, BoxSolid, CylSolid, Spring, alongPolyline} from './Gear';
import {loftSilhouette} from '../lib/loft';
import {PRONOTUM} from './roach';
import {clamp, easeOut, smoother} from '../lib/ease';

// ---------------------------------------------------------------------------------------------------------------
// Geometry of the cutaway (body frame, mm). The tube is PACK.tube; the line holes sit just inside the mouth, in the
// cut plane, so the section shows the line threading them.
// ---------------------------------------------------------------------------------------------------------------
const TY = PACK.tube.a[1];
const TOP = TY + PACK.tube.r;
export const SEC = {
  y: TY,
  rOut: PACK.tube.r,
  rIn: PACK.tube.r - 0.55,
  xRear: PACK.tube.a[0],
  xPlug: PACK.tube.a[0] + 1.5,
  xMouth: PACK.tube.b[0],
  hole: PACK.tube.b[0] - 0.55, // x of the two line holes (top and bottom wall)
  holeW: 0.45,
  /** the injector's rear in the loaded tube for the cutaway (a little behind INJ.loadedRear so the line's run in front of
   *  the collar reads) */
  loadedRear: 5.4,
  /** where the line's upper end is tied off on top of the tube (a glue bead) */
  tie: [PACK.tube.b[0] - 4.9, TOP + 0.32, 0] as V3,
  /** the line runs lifted off the tube through the coil */
  lineLift: TOP + 0.78,
  coil: [PACK.tube.b[0] - 3.2, PACK.tube.b[0] - 1.2] as [number, number],
  coilR: 0.52,
  coilTurns: 5.5,
  /** spring free length: its front stops here once the injector has left */
  springFree: PACK.tube.b[0] - 2.5,
};
/** the line parts in the middle of the coil */
export const CUT_X = (SEC.coil[0] + SEC.coil[1]) / 2;

/** the fine power wire from the board to the coil (body frame): up behind the tube's rear plug, along its top */
export const COIL_WIRE: V3[] = [
  [-8.6, 23.82, 2.6],
  [-11.0, 24.15, 1.7],
  [-12.05, 25.5, 0.7],
  [-12.2, 28.4, 0.3],
  [-11.7, 30.5, 0.2],
  [-10.5, TOP + 0.16, 0.15],
  [SEC.tie[0] - 0.9, TOP + 0.16, 0.15],
  [SEC.coil[0] - 0.75, TOP + 0.4, 0.1],
  [SEC.coil[0] - 0.15, SEC.lineLift + SEC.coilR * 0.9, 0],
];
export const COIL_WIRE_COL = '#B83A2E';

// ---------------------------------------------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------------------------------------------
const P2 = (p: V2) => `${fmt(p[0])} ${fmt(p[1])}`;
const line = (pts: V2[]) => (pts.length ? `M${pts.map(P2).join(' L')}` : '');

/** Hatch pattern that travels with the object it fills (anchored at a projected reference point) and scales with it. */
export const Hatch: React.FC<{id: string; at: V2; sp: number; color: string; ink?: number; alpha?: number; angle?: number}> = ({id, at, sp, color, ink = 1.1, alpha = 0.42, angle = 45}) => (
  <defs>
    <pattern id={id} patternUnits="userSpaceOnUse" width={fmt(sp)} height={fmt(sp)} patternTransform={`translate(${fmt(at[0])} ${fmt(at[1])}) rotate(${angle})`}>
      <rect x={0} y={0} width={fmt(sp)} height={fmt(sp)} fill={color} />
      <line x1={0} y1={0} x2={0} y2={fmt(sp)} stroke={INK} strokeWidth={fmt(ink)} opacity={alpha} />
    </pattern>
  </defs>
);

/** a helix along a -> b (back half darker, front half inked), any colour: Gear's Spring with colours */
export const Helix: React.FC<{cam: Cam; a: V3; b: V3; r: number; turns: number; wire: number; color: string; back?: string; inkW?: number; glow?: string}> = ({cam, a, b, r, turns, wire, color, back, inkW = 1.4}) => {
  const ax = norm(sub(b, a));
  const u = norm(Math.abs(ax[1]) < 0.9 ? cross(ax, [0, 1, 0]) : cross(ax, [1, 0, 0]));
  const w = cross(ax, u);
  const n = Math.max(12, Math.round(turns * 20));
  const backR: V2[][] = [], frontR: V2[][] = [];
  let cur: V2[] = [], curFront: boolean | null = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n, ang = t * turns * Math.PI * 2;
    const off = add(mul(u, r * Math.cos(ang)), mul(w, r * Math.sin(ang)));
    const p = add(lerp3(a, b, t), off);
    const isFront = dot(off, sub(cam.eye, p)) > 0;
    if (curFront === null || isFront === curFront) cur.push(proj(cam, p));
    else {
      cur.push(proj(cam, p));
      (curFront ? frontR : backR).push(cur);
      cur = [proj(cam, p)];
    }
    curFront = isFront;
  }
  if (cur.length > 1) (curFront ? frontR : backR).push(cur);
  const sw = Math.max(1, wire * scaleAt(cam, lerp3(a, b, 0.5)));
  return (
    <g fill="none" strokeLinecap="round">
      {backR.map((r2, i) => <path key={`b${i}`} d={openPath(r2)} stroke={back ?? shade(color, 0.45)} strokeWidth={sw} />)}
      {frontR.map((r2, i) => <path key={`i${i}`} d={openPath(r2)} stroke={INK} strokeWidth={sw + inkW} />)}
      {frontR.map((r2, i) => <path key={`f${i}`} d={openPath(r2)} stroke={color} strokeWidth={sw} />)}
    </g>
  );
};

/** a pulse: white core with a soft yellow halo (Gear's wire pulse) */
export const Pulse: React.FC<{at: V2; w: number}> = ({at, w}) => (
  <g>
    <circle cx={fmt(at[0])} cy={fmt(at[1])} r={fmt(w * 3.2)} fill={GEAR_COL.pulse} opacity={0.35} />
    <circle cx={fmt(at[0])} cy={fmt(at[1])} r={fmt(w * 1.9)} fill={GEAR_COL.pulse} opacity={0.35} />
    <circle cx={fmt(at[0])} cy={fmt(at[1])} r={fmt(w * 1.35)} fill="#FFFFFF" />
  </g>
);

/** soft radial glow (no blur filter) */
export const SoftGlow: React.FC<{id: string; at: V2; r: number; color: string; alpha: number; ry?: number}> = ({id, at, r, color, alpha, ry}) =>
  alpha <= 0.002 ? null : (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity={alpha} />
          <stop offset="0.4" stopColor={color} stopOpacity={alpha * 0.55} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={fmt(at[0])} cy={fmt(at[1])} rx={fmt(r)} ry={fmt(ry ?? r)} fill={`url(#${id})`} />
    </g>
  );

// ---------------------------------------------------------------------------------------------------------------
// Stimulation wires and the backpack base (copied from rig/Gear.tsx and split by the cut plane)
// ---------------------------------------------------------------------------------------------------------------
const inPoly = (q: V2, poly: V2[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (a[1] > q[1] !== b[1] > q[1] && q[0] < ((b[0] - a[0]) * (q[1] - a[1])) / (b[1] - a[1] + 1e-12) + a[0]) c = !c;
  }
  return c;
};
/** rig/Gear.tsx Wire (a stimulation wire lying on the shell, drawn where its surface faces the camera) */
const StimWire: React.FC<{cam: Cam; pts: WirePt[]; color: string; proHull: V2[] | null; camFront: boolean}> = ({cam, pts, color, proHull, camFront}) => {
  const P3 = pts.map((q) => q.p);
  const S: {p: V3; vis: boolean}[] = [];
  const nS = 36;
  for (let i = 0; i <= nS; i++) {
    const tt = i / nS;
    const p = alongPolyline(P3, tt);
    const segs = pts.length - 1;
    const k = Math.min(segs - 1, Math.floor(tt * segs));
    const a = pts[k], b = pts[k + 1];
    const n = a.n && b.n ? norm(lerp3(a.n, b.n, tt * segs - k)) : a.n ?? b.n;
    let vis = !n || dot(n, sub(cam.eye, p)) > 0;
    if (vis && proHull && camFront && (a.behindPro || b.behindPro) && inPoly(proj(cam, p), proHull)) vis = false;
    S.push({p, vis});
  }
  const runs: V2[][] = [];
  let cur: V2[] = [];
  for (const q of S) {
    if (q.vis) cur.push(proj(cam, q.p));
    else if (cur.length) {
      if (cur.length > 1) runs.push(cur);
      cur = [];
    }
  }
  if (cur.length > 1) runs.push(cur);
  const sc = scaleAt(cam, P3[Math.floor(P3.length / 2)]);
  const w = Math.max(1.1, 0.42 * sc);
  const endVis = S[S.length - 1].vis;
  const end = proj(cam, P3[P3.length - 1]);
  const er = Math.max(1.6, 0.9 * scaleAt(cam, P3[P3.length - 1]));
  return (
    <g>
      {runs.map((r, i) => <path key={`i${i}`} d={openPath(r)} fill="none" stroke={INK} strokeWidth={w + 1.6} strokeLinecap="round" strokeLinejoin="round" />)}
      {runs.map((r, i) => <path key={`c${i}`} d={openPath(r)} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />)}
      {endVis && <circle cx={fmt(end[0])} cy={fmt(end[1])} r={fmt(er + 0.8)} fill={INK} />}
      {endVis && <circle cx={fmt(end[0])} cy={fmt(end[1])} r={fmt(er)} fill={GEAR_COL.electrode} />}
    </g>
  );
};

/** The backpack below the tube: stimulation wires, saddle, board, chips, coin cell. `part` = 'back' draws what lies
 *  behind the tube's cut plane (body z >= 0 for a camera on the insect's left), 'front' the parts nearer the camera. */
export const PackBase: React.FC<{cam: Cam; f: Frame; part: 'back' | 'front'; ink?: number}> = ({cam, f, part, ink = 1.6}) => {
  const W = wiresOn(f);
  const L = (p: V3) => toW(f, p);
  const proHull = loftSilhouette(f, PRONOTUM, cam, 14, 24);
  const camFront = dot(sub(cam.eye, toW(f, [10, 15, 0])), f.x) > 0;
  const wp = {cam, proHull, camFront};
  // which side of the body faces the camera (z < 0 = the insect's left)
  const nearZ = dot(sub(cam.eye, f.o), f.z) < 0 ? -1 : 1;
  const near = (z: number) => z * nearZ > 0;
  if (part === 'back')
    return (
      <g>
        <StimWire {...wp} pts={W.cerL} color={GEAR_COL.wireB} />
        <StimWire {...wp} pts={W.cerR} color={GEAR_COL.wireB} />
        <StimWire {...wp} pts={W.antL} color={GEAR_COL.wireA} />
        <StimWire {...wp} pts={W.antR} color={GEAR_COL.wireA} />
        <BoxSolid cam={cam} f={f} c={PACK.saddle.c} h={PACK.saddle.h} color={GEAR_COL.saddle} ink={ink * 0.9} />
        <BoxSolid cam={cam} f={f} c={PACK.board.c} h={PACK.board.h} color={GEAR_COL.board} ink={ink * 0.9} />
        {!near(PACK.chipA.c[2]) && <BoxSolid cam={cam} f={f} c={PACK.chipA.c} h={PACK.chipA.h} color={GEAR_COL.chip} ink={ink * 0.7} />}
        {!near(PACK.chipB.c[2]) && <BoxSolid cam={cam} f={f} c={PACK.chipB.c} h={PACK.chipB.h} color={GEAR_COL.chip} ink={ink * 0.7} />}
        {!near(PACK.cell.c[2]) && <CylSolid id="pb-cell-b" cam={cam} a={L(add(PACK.cell.c, [0, -PACK.cell.h / 2, 0]))} b={L(add(PACK.cell.c, [0, PACK.cell.h / 2, 0]))} r={PACK.cell.r} color={GEAR_COL.cell} ink={ink * 0.75} />}
      </g>
    );
  return (
    <g>
      {near(PACK.chipA.c[2]) && <BoxSolid cam={cam} f={f} c={PACK.chipA.c} h={PACK.chipA.h} color={GEAR_COL.chip} ink={ink * 0.7} />}
      {near(PACK.chipB.c[2]) && <BoxSolid cam={cam} f={f} c={PACK.chipB.c} h={PACK.chipB.h} color={GEAR_COL.chip} ink={ink * 0.7} />}
      {near(PACK.cell.c[2]) && <CylSolid id="pb-cell-f" cam={cam} a={L(add(PACK.cell.c, [0, -PACK.cell.h / 2, 0]))} b={L(add(PACK.cell.c, [0, PACK.cell.h / 2, 0]))} r={PACK.cell.r} color={GEAR_COL.cell} ink={ink * 0.75} />}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The latch line: intact (tie bead -> through the coil -> down through the top hole -> round the needle hub in front of
// the collar -> through the bottom hole -> knot), or parted at the coil (the stub stays tied; the free strand whips
// forward out of the mouth about the bottom hole and hangs from it).
// ---------------------------------------------------------------------------------------------------------------
type P2D = [number, number];
const LINE_HUB_X = SEC.loadedRear + INJ.collarAt + 0.3 + 0.18; // just in front of the loaded collar's face
/** the free strand from the bottom hole's inner edge to the cut point, as body (x, y) points (intact shape) */
const STRAND0: P2D[] = [
  [SEC.hole, SEC.y - SEC.rIn],
  [LINE_HUB_X, SEC.y - INJ.needleR - 0.3],
  [LINE_HUB_X, SEC.y + INJ.needleR + 0.3],
  [SEC.hole, SEC.y + SEC.rIn],
  [SEC.hole, TOP],
  [SEC.hole - 0.12, SEC.lineLift - 0.12],
  [SEC.coil[1], SEC.lineLift],
  [CUT_X, SEC.lineLift],
];
/** resample a polyline to n equal segments: lengths and angles */
const chainOf = (pts: P2D[], n: number) => {
  const segL = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segL.reduce((a, b) => a + b, 0);
  const at = (d: number): P2D => {
    let r = d;
    for (let i = 0; i < segL.length; i++) {
      if (r <= segL[i] || i === segL.length - 1) {
        const u = clamp(r / segL[i]);
        return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u];
      }
      r -= segL[i];
    }
    return pts[pts.length - 1];
  };
  const q = Array.from({length: n + 1}, (_, k) => at((k / n) * total));
  const ang = q.slice(1).map((p, k) => Math.atan2(p[1] - q[k][1], p[0] - q[k][0]));
  return {seg: total / n, ang};
};
const NCH = 28;
const CH0 = chainOf(STRAND0, NCH);
// unwrap the intact angles into one continuous sequence
for (let k = 1; k < CH0.ang.length; k++) {
  while (CH0.ang[k] - CH0.ang[k - 1] > Math.PI) CH0.ang[k] -= 2 * Math.PI;
  while (CH0.ang[k] - CH0.ang[k - 1] < -Math.PI) CH0.ang[k] += 2 * Math.PI;
}
/** hanging angles: forward along the bore to the lip, over it, down in front of the mouth with a slight curl */
const hangAng = (k: number, swing: number) => {
  const u = k / (NCH - 1);
  const a = u < 0.08 ? -0.05 : -0.05 - 1.5 * smoother((u - 0.08) / 0.45) - 0.2 * smoother((u - 0.6) / 0.4);
  return a + swing * (0.2 + 0.8 * u);
};

export type LineState = {
  /** seconds since the line parted (null: intact) */
  cutT: number | null;
};
export const LatchLine: React.FC<{cam: Cam; f: Frame; s: LineState; sc: number}> = ({cam, f, s, sc}) => {
  const P = (x: number, y: number, z = 0) => proj(cam, toW(f, [x, y, z]));
  const lw = Math.max(1.4, 0.24 * sc);
  const ink = lw + Math.max(1.2, 0.11 * sc);
  const stroke = (pts: V2[], k: string) => (
    <g key={k}>
      <path d={openPath(pts)} fill="none" stroke={INK} strokeWidth={ink} strokeLinecap="round" strokeLinejoin="round" />
      <path d={openPath(pts)} fill="none" stroke={GEAR_COL.line} strokeWidth={lw} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  const bead = (x: number, y: number, r: number, k: string) => {
    const c = P(x, y);
    return (
      <g key={k}>
        <circle cx={fmt(c[0])} cy={fmt(c[1])} r={fmt(r * sc + 0.8)} fill={INK} />
        <circle cx={fmt(c[0])} cy={fmt(c[1])} r={fmt(r * sc)} fill={lit(GEAR_COL.line, 0.2)} />
        <circle cx={fmt(c[0] - r * sc * 0.3)} cy={fmt(c[1] - r * sc * 0.35)} r={fmt(r * sc * 0.35)} fill="#FFFFFF" opacity={0.8} />
      </g>
    );
  };
  // bottom: through the wall to the knot below the hole
  const bottom = [P(SEC.hole, SEC.y - SEC.rIn), P(SEC.hole, SEC.y - SEC.rOut - 0.35)];
  // stub: tie bead -> along the coil to the cut point (after the cut its end lifts and draws back a little)
  const c = s.cutT === null ? 0 : easeOut(clamp(s.cutT / 0.1), 2);
  const stub: V2[] = [P(SEC.tie[0], SEC.tie[1]), P(SEC.tie[0] + 0.6, SEC.lineLift - 0.05), P(SEC.coil[0] - 0.2, SEC.lineLift), P(CUT_X - 0.35 * c, SEC.lineLift + 0.28 * c)];
  let strand: V2[];
  if (s.cutT === null) strand = STRAND0.map(([x, y]) => P(x, y));
  else {
    // the free strand: angles blend from the taut shape to hanging (rotating forward about the bottom hole), the far end
    // lagging, then a small damped swing
    const dt = s.cutT;
    const swing = 0.22 * Math.exp(-dt / 0.18) * Math.sin(dt * 26);
    let x = STRAND0[0][0], y = STRAND0[0][1];
    strand = [P(x, y)];
    for (let k = 0; k < NCH; k++) {
      const w = easeOut(clamp((dt - 0.004 * k) / 0.11), 2.2);
      let a1 = hangAng(k, swing);
      while (a1 > CH0.ang[k]) a1 -= 2 * Math.PI; // always rotate forward (clockwise in the side view)
      const a = CH0.ang[k] + (a1 - CH0.ang[k]) * w;
      x += CH0.seg * Math.cos(a);
      y += CH0.seg * Math.sin(a);
      strand.push(P(x, y));
    }
  }
  return (
    <g>
      {stroke(bottom, 'bt')}
      {stroke(strand, 'st')}
      {stroke(stub, 'sb')}
      {bead(SEC.tie[0], SEC.tie[1], 0.36, 'tie')}
      {bead(SEC.hole, SEC.y - SEC.rOut - 0.4, 0.3, 'knot')}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The nichrome coil on the line, and the fine wire from the board (with an optional pulse)
// ---------------------------------------------------------------------------------------------------------------
export const Coil: React.FC<{id: string; cam: Cam; f: Frame; heat: number; sc: number}> = ({id, cam, f, heat, sc}) => {
  const a = toW(f, [SEC.coil[0], SEC.lineLift, 0]), b = toW(f, [SEC.coil[1], SEC.lineLift, 0]);
  const h = clamp(heat);
  const col = mix(GEAR_COL.nichrome, h < 0.5 ? mix('#D2552E', GEAR_COL.hot, 0) : GEAR_COL.hot, h < 0.5 ? h * 1.4 : 0.7 + 0.6 * (h - 0.5));
  const c = proj(cam, lerp3(a, b, 0.5));
  const L = (SEC.coil[1] - SEC.coil[0]) * sc;
  return (
    <g>
      <SoftGlow id={`${id}-g1`} at={c} r={L * 2.4} ry={L * 1.8} color={GEAR_COL.hot} alpha={0.55 * h * h} />
      <Helix cam={cam} a={a} b={b} r={SEC.coilR} turns={SEC.coilTurns} wire={0.17} color={mix(col, '#FFF4C8', Math.max(0, h - 0.75) * 1.6)} back={shade(col, 0.35 - 0.25 * h)} inkW={Math.max(1, 0.1 * sc)} />
      <SoftGlow id={`${id}-g2`} at={c} r={L * 0.7} ry={L * 0.45} color="#FFE7A0" alpha={0.55 * Math.max(0, h - 0.45) * 1.8} />
    </g>
  );
};

export const CoilWire: React.FC<{cam: Cam; f: Frame; pulse: number | null; sc: number; pulseW?: number}> = ({cam, f, pulse, sc, pulseW}) => {
  const pts = COIL_WIRE.map((p) => proj(cam, toW(f, p)));
  const w = Math.max(1.1, 0.2 * sc);
  const pad = proj(cam, toW(f, COIL_WIRE[0]));
  const pw = pulseW ?? Math.max(1.6, 0.55 * sc);
  return (
    <g>
      <ellipse cx={fmt(pad[0])} cy={fmt(pad[1])} rx={fmt(0.75 * sc + 0.8)} ry={fmt(0.35 * sc + 0.8)} fill={INK} />
      <ellipse cx={fmt(pad[0])} cy={fmt(pad[1])} rx={fmt(0.75 * sc)} ry={fmt(0.35 * sc)} fill={GEAR_COL.electrode} />
      <path d={openPath(pts)} fill="none" stroke={INK} strokeWidth={w + Math.max(1.2, 0.1 * sc)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={openPath(pts)} fill="none" stroke={COIL_WIRE_COL} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      {pulse !== null && pulse > 0 && pulse < 1 && <Pulse at={proj(cam, alongPolyline(COIL_WIRE.map((p) => toW(f, p)), pulse))} w={pw} />}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The launch tube in section with its contents
// ---------------------------------------------------------------------------------------------------------------
export type TubeState = {
  /** body x of the injector's rear while it is in (or leaving) the tube; null once it is drawn on its own */
  injRear: number | null;
  /** body x of the spring's front end */
  springFront: number;
  line: LineState;
  heat: number;
  /** fraction 0..1 of the pulse along the coil wire (null: none) */
  pulse: number | null;
};
export const TUBE_CUT_COL = '#8FB8C9';

/** the tube cut along its length, the parts inside it, the line, the coil and its wire; pass the posed body frame.
 *  `injector` draws the injector given its world frame (the shot supplies it so trails and states stay in one place). */
export const SectionTube: React.FC<{id: string; cam: Cam; f: Frame; s: TubeState; injector?: (fr: Frame) => React.ReactNode}> = ({id, cam, f, s, injector}) => {
  const P = (x: number, y: number, z = 0) => proj(cam, toW(f, [x, y, z]));
  const sc = scaleAt(cam, toW(f, [6, SEC.y, 0]));
  const ink = Math.max(1.3, 0.15 * sc);
  const {y, rIn, rOut, xRear, xPlug, xMouth, hole, holeW} = SEC;
  const quad = (x0: number, y0: number, x1: number, y1: number) => [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)];
  // interior (the far half's concave inner surface)
  const inTop = P(0, y + rIn), inBot = P(0, y - rIn);
  const interior = quad(xPlug, y - rIn, xMouth, y + rIn);
  // cut faces: rear plug, top wall and bottom wall (each wall interrupted by its line hole)
  const h0 = hole - holeW / 2, h1 = hole + holeW / 2;
  const cuts = [
    quad(xRear, y - rOut, xPlug, y + rOut),
    quad(xPlug - 0.01, y + rIn, h0, y + rOut),
    quad(h1, y + rIn, xMouth, y + rOut),
    quad(xPlug - 0.01, y - rOut, h0, y - rIn),
    quad(h1, y - rOut, xMouth, y - rIn),
  ];
  const outline = [P(xMouth, y + rOut), P(xRear, y + rOut), P(xRear, y - rOut), P(xMouth, y - rOut)];
  const anchor = P(xRear, y - rOut);
  const tube = GEAR_COL.tube;
  const injF = s.injRear === null ? null : ({o: toW(f, [s.injRear, y, 0]), x: f.x, y: f.y, z: f.z} as Frame);
  return (
    <g>
      <Hatch id={`${id}-h`} at={anchor} sp={Math.max(3.5, 0.42 * sc)} color={TUBE_CUT_COL} ink={Math.max(0.8, 0.07 * sc)} alpha={0.55} />
      <defs>
        <linearGradient id={`${id}-in`} gradientUnits="userSpaceOnUse" x1={fmt(inTop[0])} y1={fmt(inTop[1])} x2={fmt(inBot[0])} y2={fmt(inBot[1])}>
          <stop offset="0" stopColor={shade(tube, 0.42)} />
          <stop offset="0.3" stopColor={shade(tube, 0.16)} />
          <stop offset="0.72" stopColor={lit(tube, 0.15)} />
          <stop offset="1" stopColor={tube} />
        </linearGradient>
      </defs>
      {/* the clamps behind the far wall, seen through the clear plastic */}
      {PACK.clamps.map((x, i) => (
        <g key={i} opacity={0.75}>
          <BoxSolid cam={cam} f={f} c={[x, 25.0, 1.95]} h={[1.6, 1.4, 1.95]} color={GEAR_COL.clamp} ink={ink * 0.8} />
        </g>
      ))}
      <path d={polyPath(interior)} fill={`url(#${id}-in)`} opacity={0.82} />
      {/* a soft reflection along the lower inner wall */}
      <path d={line([P(xPlug + 1, y - rIn * 0.62), P(xMouth - 1, y - rIn * 0.62)])} stroke="#FFFFFF" strokeWidth={fmt(Math.max(1, 0.35 * sc))} opacity={0.35} strokeLinecap="round" />
      {/* the spring between the rear plug and the injector (or its free length) */}
      <Spring cam={cam} a={toW(f, [xPlug, y, 0])} b={toW(f, [Math.max(xPlug + 1, s.springFront), y, 0])} r={rOut * 0.72} turns={9} wire={0.42} />
      {injF && injector?.(injF)}
      {/* cut faces */}
      {cuts.map((q, i) => <path key={i} d={polyPath(q)} fill={`url(#${id}-h)`} />)}
      {/* inner edges of the cut walls (a light line where the cut meets the bore) */}
      {[y + rIn, y - rIn].map((yy, i) => (
        <path key={`e${i}`} d={line([P(xPlug, yy), P(h0, yy)]) + ' ' + line([P(h1, yy), P(xMouth, yy)])} stroke={lit(TUBE_CUT_COL, 0.55)} strokeWidth={fmt(Math.max(0.8, 0.07 * sc))} />
      ))}
      <path d={polyPath(outline, false)} fill="none" stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
      {[0, 1, 2, 3, 4].map((i) => <path key={`o${i}`} d={polyPath(cuts[i])} fill="none" stroke={INK} strokeWidth={fmt(ink * 0.55)} strokeLinejoin="round" />)}
      <CoilWire cam={cam} f={f} pulse={s.pulse} sc={sc} />
      <LatchLine cam={cam} f={f} s={s.line} sc={sc} />
      <Coil id={`${id}-coil`} cam={cam} f={f} heat={s.heat} sc={sc} />
    </g>
  );
};
