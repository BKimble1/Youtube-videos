// Draws the backpack, launch tube, injector, camera module and stimulation wires (rig/gear.ts) through a camera.
import React from 'react';
import {Cam, proj, scaleAt, depth} from '../lib/cam';
import {V3, V2, Frame, toW, dirW, add, sub, mul, dot, norm, len, cross, lerp3} from '../lib/v3';
import {boxFaces, cylOutline, closedPath, openPath, polyPath, fmt, centroid} from '../lib/g3';
import {INK, Inked, Deco} from '../lib/ink';
import {lit, shade, mix} from '../lib/color';
import {PACK, INJ, wiresOn, WireKey, WirePt} from './gear';
import {loftSilhouette} from '../lib/loft';
import {PRONOTUM} from './roach';
import {shellHides} from './Roach';
import {clamp} from '../lib/ease';

/** world key light, consistent with the 2D rig's upper-left screen light */
export const lightW = (cam: Cam): V3 => norm(add(add(mul(cam.right, -0.6), mul(cam.up, 0.78)), mul(cam.fwd, -0.45)));
const faceTone = (cam: Cam, n: V3, color: string) => {
  const k = dot(n, lightW(cam));
  return k >= 0 ? lit(color, 0.38 * k) : shade(color, -0.42 * k);
};

export const GEAR_COL = {
  saddle: '#3B4652',
  board: '#2F7D5B',
  boardEdge: '#1F5A40',
  chip: '#22272E',
  cell: '#C9CED4',
  tube: '#DCEFF6',
  clamp: '#EDEFF1',
  spring: '#B4BEC7',
  barrel: '#EEF6F8',
  liquid: '#F2A93B',
  plunger: '#3A4048',
  collar: '#F4F1E8',
  needle: '#D9DEE3',
  line: '#F7F3E6',
  nichrome: '#B5643A',
  hot: '#FFB347',
  wireA: '#D9773A',
  wireB: '#3E86C9',
  electrode: '#D8DDE2',
  camBody: '#2A3038',
  lens: '#1C3F66',
  pulse: '#FFF3A6',
};

export const BoxSolid: React.FC<{cam: Cam; f: Frame; c: V3; h: V3; color: string; ink?: number}> = ({cam, f, c, h, color, ink = 1.6}) => {
  const faces = boxFaces(cam, f, c, h);
  return (
    <g>
      {faces.map((fc, i) => (
        <path key={i} d={polyPath(fc.pts)} fill={faceTone(cam, fc.n, color)} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      ))}
    </g>
  );
};

export const CylSolid: React.FC<{id: string; cam: Cam; a: V3; b: V3; r: number; color: string; ink?: number; alpha?: number; cap?: string}> = ({id, cam, a, b, r, color, ink = 1.6, alpha = 1, cap}) => {
  const o = cylOutline(cam, a, b, r, 36);
  // gradient across the axis on screen, from the lit side
  const pa = proj(cam, a), pb = proj(cam, b);
  const ax: V2 = [pb[0] - pa[0], pb[1] - pa[1]];
  const L = Math.hypot(ax[0], ax[1]) || 1;
  let n: V2 = [-ax[1] / L, ax[0] / L];
  if (n[0] * -0.62 + n[1] * -0.78 < 0) n = [-n[0], -n[1]];
  const m: V2 = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2];
  const rr = r * scaleAt(cam, lerp3(a, b, 0.5));
  const capPts = o.capB ? o.rb : o.ra;
  return (
    <g opacity={alpha}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={fmt(m[0] + n[0] * rr)} y1={fmt(m[1] + n[1] * rr)} x2={fmt(m[0] - n[0] * rr)} y2={fmt(m[1] - n[1] * rr)}>
          <stop offset="0" stopColor={lit(color, 0.35)} />
          <stop offset="0.3" stopColor={lit(color, 0.12)} />
          <stop offset="0.65" stopColor={color} />
          <stop offset="1" stopColor={shade(color, 0.35)} />
        </linearGradient>
      </defs>
      <path d={polyPath(o.hull)} fill={`url(#${id})`} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      <path d={polyPath(capPts)} fill={cap ?? lit(color, 0.18)} stroke={INK} strokeWidth={ink * 0.8} strokeLinejoin="round" />
    </g>
  );
};

/** helix (spring) between two points of the tube axis */
export const Spring: React.FC<{cam: Cam; a: V3; b: V3; r: number; turns: number; wire: number}> = ({cam, a, b, r, turns, wire}) => {
  const ax = norm(sub(b, a));
  const u = norm(Math.abs(ax[1]) < 0.9 ? cross(ax, [0, 1, 0]) : cross(ax, [1, 0, 0]));
  const w = cross(ax, u);
  const n = Math.max(8, Math.round(turns * 18));
  const back: V2[][] = [], front: V2[][] = [];
  let cur: V2[] = [], curFront: boolean | null = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n, ang = t * turns * Math.PI * 2;
    const off = add(mul(u, r * Math.cos(ang)), mul(w, r * Math.sin(ang)));
    const p = add(lerp3(a, b, t), off);
    const isFront = dot(off, sub(cam.eye, p)) > 0;
    if (curFront === null || isFront === curFront) cur.push(proj(cam, p));
    else {
      cur.push(proj(cam, p));
      (curFront ? front : back).push(cur);
      cur = [proj(cam, p)];
    }
    curFront = isFront;
  }
  if (cur.length > 1) (curFront ? front : back).push(cur);
  const sw = wire * scaleAt(cam, lerp3(a, b, 0.5));
  return (
    <g fill="none" strokeLinecap="round">
      {back.map((r2, i) => <path key={`b${i}`} d={openPath(r2)} stroke={shade(GEAR_COL.spring, 0.4)} strokeWidth={sw} />)}
      {front.map((r2, i) => (
        <g key={`f${i}`}>
          <path d={openPath(r2)} stroke={INK} strokeWidth={sw + 1.6} />
          <path d={openPath(r2)} stroke={GEAR_COL.spring} strokeWidth={sw} />
        </g>
      ))}
    </g>
  );
};

export type InjState = {
  /** world frame of the injector: x along the needle, origin at the barrel rear */
  f: Frame;
  /** 0 = plunger at the rear (full), 1 = plunger at the front (delivered) */
  plunger: number;
  /** latch line still tied (loaded) */
  latched?: boolean;
  /** section view: draw the barrel cut open (for the cutaway shots) */
  section?: boolean;
  /** gas bubbles behind the plunger 0..1 */
  gas?: number;
  /** the activator released into the front chamber 0..1 (section view) */
  mixRelease?: number;
  /** injector-local x beyond which the needle is hidden (inside the target) */
  needleEnd?: number;
};

/** The auto-injector: clear barrel with the dose, plunger, collar, 31-gauge needle. */
export const Injector: React.FC<{id: string; cam: Cam; s: InjState}> = ({id, cam, s}) => {
  const P = (x: number, y = 0, z = 0) => toW(s.f, [x, y, z]);
  const pl = clamp(s.plunger);
  const plRear = 0.4 + pl * (INJ.barrelLen - INJ.plungerLen - 1.2);
  const plFront = plRear + INJ.plungerLen;
  const liqFront = INJ.barrelLen - 0.5;
  return (
    <g>
      {/* needle */}
      <CylSolid id={`${id}-nd`} cam={cam} a={P(INJ.barrelLen)} b={P(Math.min(s.needleEnd ?? 1e9, INJ.barrelLen + 1.2 + INJ.needleLen))} r={INJ.needleR} color={GEAR_COL.needle} ink={0.9} />
      {/* barrel shell (back half), dose, plunger, gas */}
      <CylSolid id={`${id}-br`} cam={cam} a={P(0)} b={P(INJ.barrelLen)} r={INJ.barrelR} color={GEAR_COL.barrel} ink={1.3} />
      {liqFront - plFront > 0.2 && <CylSolid id={`${id}-lq`} cam={cam} a={P(plFront)} b={P(liqFront)} r={INJ.barrelR * 0.82} color={GEAR_COL.liquid} ink={0.6} />}
      <CylSolid id={`${id}-pl`} cam={cam} a={P(plRear)} b={P(plFront)} r={INJ.barrelR * 0.86} color={GEAR_COL.plunger} ink={0.8} />
      {/* collar near the needle */}
      <CylSolid id={`${id}-co`} cam={cam} a={P(INJ.collarAt - 0.9)} b={P(INJ.collarAt + 0.3)} r={INJ.collarR} color={GEAR_COL.collar} ink={1.1} />
      {/* clear barrel highlight over the contents */}
      <CylSolid id={`${id}-bg`} cam={cam} a={P(0)} b={P(INJ.barrelLen)} r={INJ.barrelR} color="#FFFFFF" ink={1.0} alpha={0.22} cap="none" />
    </g>
  );
};

/** a pulse travelling along a polyline: returns the screen position at fraction t */
export const alongPolyline = (pts: V3[], t: number): V3 => {
  const segs = pts.slice(1).map((p, i) => len(sub(p, pts[i])));
  const total = segs.reduce((a, b) => a + b, 0);
  let d = clamp(t) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i]) return lerp3(pts[i], pts[i + 1], d / segs[i]);
    d -= segs[i];
  }
  return pts[pts.length - 1];
};

export type GearState = {
  kind: 'injector' | 'camera';
  /** injector held in the tube (null = launched) */
  loaded: boolean;
  /** plunger progress of the loaded injector (always 0 in the tube) */
  springExt?: number; // 0 = compressed against the loaded injector, 1 = released to the tube mouth
  latched?: boolean; // the line still holds the collar
  heat?: number; // nichrome wire glow 0..1
  /** pulses on wires: key -> list of fractions along the wire (0 at the board, 1 at the electrode) */
  pulses?: Partial<Record<WireKey, number[]>>;
  /** glow at electrodes 0..1 */
  zap?: Partial<Record<WireKey, number>>;
  /** draw the tube cut open (section) */
  section?: boolean;
};

/** point-in-polygon (screen) */
const inPoly = (q: V2, poly: V2[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (a[1] > q[1] !== b[1] > q[1] && q[0] < ((b[0] - a[0]) * (q[1] - a[1])) / (b[1] - a[1] + 1e-12) + a[0]) c = !c;
  }
  return c;
};

/** A stimulation wire lying on the shell: drawn only where its surface faces the camera and (for the cerci wires, which
 *  lie on the plates behind the pronotum) where the pronotum does not hide it. Its free span, from the board edge down
 *  to the shell (a span with no surface normal at one end), is drawn wherever the shell does not stand between it and the
 *  camera, so it runs on until it passes behind the shell's outline instead of stopping in mid-air. */
const Wire: React.FC<{cam: Cam; f: Frame; pts: WirePt[]; color: string; pulses?: number[]; zap?: number; id: string; proHull: V2[] | null; camFront: boolean}> = ({cam, f, pts, color, pulses, zap, id, proHull, camFront}) => {
  // resample by arc length (as alongPolyline) with normals interpolated along the span each sample lies on
  const P3 = pts.map((q) => q.p);
  const nS = 36;
  const segL = P3.slice(1).map((q, i) => len(sub(q, P3[i])));
  const total = segL.reduce((x, y) => x + y, 0);
  const visAt = (tt: number) => {
    const p = alongPolyline(P3, tt);
    let k = 0, d = tt * total;
    while (k < segL.length - 1 && d > segL[k]) d -= segL[k++];
    const a = pts[k], b = pts[k + 1];
    const na = a.n, nb = b.n;
    let vis = na && nb ? dot(norm(lerp3(na, nb, clamp(d / Math.max(1e-9, segL[k])))), sub(cam.eye, p)) > 0 : !shellHides(f, p, cam.eye);
    if (vis && proHull && camFront && (a.behindPro || b.behindPro) && inPoly(proj(cam, p), proHull)) vis = false;
    return {p, vis};
  };
  const S = Array.from({length: nS + 1}, (_, i) => visAt(i / nS));
  // visible runs, each ended where the visibility flips (bisected between the samples, so the wire meets the outline it
  // passes behind)
  const flip = (i: number): V2 => {
    let lo = (i - 1) / nS, hi = i / nS;
    for (let k = 0; k < 10; k++) {
      const m = (lo + hi) / 2;
      if (visAt(m).vis === S[i - 1].vis) lo = m;
      else hi = m;
    }
    return proj(cam, alongPolyline(P3, S[i - 1].vis ? lo : hi));
  };
  const runs: V2[][] = [];
  let cur: V2[] = [];
  S.forEach((q, i) => {
    if (i > 0 && q.vis !== S[i - 1].vis) {
      if (q.vis) cur = [flip(i)];
      else {
        cur.push(flip(i));
        if (cur.length > 1) runs.push(cur);
        cur = [];
      }
    }
    if (q.vis) cur.push(proj(cam, q.p));
  });
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
      {(pulses ?? []).filter((t) => t >= 0 && t <= 1).map((t, i) => {
        const p3 = alongPolyline(P3, t);
        const si = Math.round(t * nS);
        if (!S[Math.min(nS, Math.max(0, si))].vis) return null;
        const q = proj(cam, p3);
        return (
          <g key={i}>
            <circle cx={fmt(q[0])} cy={fmt(q[1])} r={fmt(w * 3.2)} fill={GEAR_COL.pulse} opacity={0.35} />
            <circle cx={fmt(q[0])} cy={fmt(q[1])} r={fmt(w * 1.35)} fill="#FFFFFF" />
          </g>
        );
      })}
      {endVis && zap !== undefined && zap > 0 && (
        <g>
          <defs>
            <radialGradient id={`${id}-z`}>
              <stop offset="0" stopColor={GEAR_COL.pulse} stopOpacity={0.9 * zap} />
              <stop offset="1" stopColor={GEAR_COL.pulse} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={fmt(end[0])} cy={fmt(end[1])} r={fmt(er * 4)} fill={`url(#${id}-z)`} />
        </g>
      )}
    </g>
  );
};

/** Everything mounted on the insect, drawn above the shell (pass the posed body frame). */
export const Gear: React.FC<{id: string; cam: Cam; f: Frame; g: GearState}> = ({id, cam, f, g}) => {
  const W = wiresOn(f);
  const L = (p: V3) => toW(f, p);
  const tubeA = L(PACK.tube.a), tubeB = L(PACK.tube.b);
  const injRear = g.loaded ? INJ.loadedRear : PACK.tube.b[0] - 2;
  const [s0, s1] = [PACK.tube.a[0] + 1.5, g.loaded ? INJ.loadedRear : PACK.tube.a[0] + 1.5 + (PACK.tube.b[0] - PACK.tube.a[0] - 4) * clamp(g.springExt ?? 1)];
  const injF: Frame = {o: L([injRear, PACK.tube.a[1], 0]), x: f.x, y: f.y, z: f.z};
  const mouth = PACK.tube.b[0];
  const heat = clamp(g.heat ?? 0);
  const proHull = loftSilhouette(f, PRONOTUM, cam, 14, 24);
  const camFront = dot(sub(cam.eye, toW(f, [10, 15, 0])), f.x) > 0;
  const wp = {cam, f, proHull, camFront};
  return (
    <g>
      {/* wires run under the board edge, over the shell */}
      <Wire id={`${id}-wcl`} {...wp} pts={W.cerL} color={GEAR_COL.wireB} pulses={g.pulses?.cerL} zap={g.zap?.cerL} />
      <Wire id={`${id}-wcr`} {...wp} pts={W.cerR} color={GEAR_COL.wireB} pulses={g.pulses?.cerR} zap={g.zap?.cerR} />
      <Wire id={`${id}-wal`} {...wp} pts={W.antL} color={GEAR_COL.wireA} pulses={g.pulses?.antL} zap={g.zap?.antL} />
      <Wire id={`${id}-war`} {...wp} pts={W.antR} color={GEAR_COL.wireA} pulses={g.pulses?.antR} zap={g.zap?.antR} />
      <BoxSolid cam={cam} f={f} c={PACK.saddle.c} h={PACK.saddle.h} color={GEAR_COL.saddle} ink={1.4} />
      <BoxSolid cam={cam} f={f} c={PACK.board.c} h={PACK.board.h} color={GEAR_COL.board} ink={1.4} />
      <BoxSolid cam={cam} f={f} c={PACK.chipA.c} h={PACK.chipA.h} color={GEAR_COL.chip} ink={1.1} />
      <BoxSolid cam={cam} f={f} c={PACK.chipB.c} h={PACK.chipB.h} color={GEAR_COL.chip} ink={1.1} />
      <CylSolid id={`${id}-cell`} cam={cam} a={L(add(PACK.cell.c, [0, -PACK.cell.h / 2, 0]))} b={L(add(PACK.cell.c, [0, PACK.cell.h / 2, 0]))} r={PACK.cell.r} color={GEAR_COL.cell} ink={1.2} />
      {g.kind === 'injector' && (
        <g>
          {PACK.clamps.map((x, i) => (
            <BoxSolid key={i} cam={cam} f={f} c={[x, 25.4, 0]} h={[1.6, 1.8, 3.9]} color={GEAR_COL.clamp} ink={1.2} />
          ))}
          {/* inside the clear tube: spring, then the loaded injector */}
          <Spring cam={cam} a={L([s0, PACK.tube.a[1], 0])} b={L([Math.max(s0 + 1, s1), PACK.tube.a[1], 0])} r={PACK.tube.r * 0.72} turns={9} wire={0.42} />
          {g.loaded && <Injector id={`${id}-inj`} cam={cam} s={{f: injF, plunger: 0, latched: g.latched}} />}
          <CylSolid id={`${id}-tube`} cam={cam} a={tubeA} b={tubeB} r={PACK.tube.r} color={GEAR_COL.tube} ink={1.4} alpha={0.42} cap="rgba(255,255,255,0.15)" />
          {/* latch line through the tube mouth, and the nichrome coil that cuts it */}
          {g.latched !== false && g.loaded && (() => {
            const c = L([INJ.loadedRear + INJ.collarAt, PACK.tube.a[1], 0]);
            const h1 = L([mouth - 0.6, PACK.tube.a[1] + PACK.tube.r, 1.2]), h2 = L([mouth - 0.6, PACK.tube.a[1] - PACK.tube.r, -1.2]);
            const pc = proj(cam, c), p1 = proj(cam, h1), p2 = proj(cam, h2);
            const lw = Math.max(0.9, 0.22 * scaleAt(cam, c));
            return <path d={`M${fmt(p1[0])} ${fmt(p1[1])} L${fmt(pc[0])} ${fmt(pc[1])} L${fmt(p2[0])} ${fmt(p2[1])}`} fill="none" stroke={GEAR_COL.line} strokeWidth={lw} strokeLinecap="round" />;
          })()}
          {(() => {
            // coil around the line just outside the top hole
            const base: V3 = [mouth - 0.6, PACK.tube.a[1] + PACK.tube.r + 0.9, 1.0];
            const pts: V2[] = [];
            for (let i = 0; i <= 40; i++) {
              const a = (i / 40) * Math.PI * 2 * 4;
              pts.push(proj(cam, L([base[0] + 0.7 * Math.cos(a), base[1] + (i / 40) * 1.2 - 0.6, base[2] + 0.7 * Math.sin(a)])));
            }
            const sw = Math.max(0.9, 0.24 * scaleAt(cam, L(base)));
            const col = mix(GEAR_COL.nichrome, GEAR_COL.hot, heat);
            const pc = pts[20];
            return (
              <g>
                {heat > 0 && <circle cx={fmt(pc[0])} cy={fmt(pc[1])} r={fmt(3.2 * scaleAt(cam, L(base)) * heat)} fill={GEAR_COL.hot} opacity={0.35 * heat} />}
                <path d={openPath(pts)} fill="none" stroke={INK} strokeWidth={sw + 1.2} />
                <path d={openPath(pts)} fill="none" stroke={col} strokeWidth={sw} />
              </g>
            );
          })()}
        </g>
      )}
      {g.kind === 'camera' && (
        <g>
          <path d={(() => {
            const a = proj(cam, L(PACK.aerial.a)), b = proj(cam, L(PACK.aerial.b));
            return `M${fmt(a[0])} ${fmt(a[1])} L${fmt(b[0])} ${fmt(b[1])}`;
          })()} stroke={INK} strokeWidth={Math.max(1.4, 0.5 * scaleAt(cam, L(PACK.aerial.a)))} strokeLinecap="round" />
          <BoxSolid cam={cam} f={f} c={PACK.cam.c} h={PACK.cam.h} color={GEAR_COL.camBody} ink={1.4} />
          <CylSolid id={`${id}-lens`} cam={cam} a={L([PACK.cam.c[0] + PACK.cam.h[0], PACK.cam.c[1], 0])} b={L([PACK.cam.c[0] + PACK.cam.h[0] + 1.4, PACK.cam.c[1], 0])} r={PACK.cam.lens} color="#3A4048" ink={1.2} cap={GEAR_COL.lens} />
          {(() => {
            const c = proj(cam, L([PACK.cam.c[0] + PACK.cam.h[0] + 1.45, PACK.cam.c[1] + 0.9, -0.9]));
            const r = 0.7 * scaleAt(cam, L(PACK.cam.c));
            return dot(sub(cam.eye, L(PACK.cam.c)), f.x) > 0 ? <ellipse cx={fmt(c[0])} cy={fmt(c[1])} rx={fmt(r)} ry={fmt(r * 0.6)} fill="#FFFFFF" opacity={0.8} /> : null;
          })()}
        </g>
      )}
    </g>
  );
};
