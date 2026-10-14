// Renders a posed robot from any camera: projected ring hulls, depth-sorted parts, light/glow gradients,
// surface decals that stay attached to the body (never mirrored), and an optional y-plane cut (molten surface).
import React from 'react';
import {Proj} from '../engine/camera';
import {V3, add, dot, len, mulS, norm, sub} from '../engine/math';
import {bbox, clipPolyline, clipRings, hull, polyOpen, smoothClosed, smoothOpen, Pt, inFront} from '../engine/draw';
import {Pose, solve, Skeleton} from './rig';
import {Decal, MatKey, ModelKind, Part, buildParts, dirWorld, partCenter, ringLoops, ringRadius, surfLocal, toWorld} from './model';
import {SYMBOL_POLY} from '../brand/figureSymbol';
import {polyClosed} from '../engine/draw';

type Mat = {base: string; lit: string; shade: string};
type Finish = {
  mats: Record<MatKey, Mat>;
  outline: string;
  seam: string;
  seamLight: string;
  panel: string;
  vent: string;
  visor: string;
  visorHi: string;
  lens: string;
  marker: string;
  accent: string;
  dark: string;
  recess: string;
  fillOpacity?: number;
};

export const FINISH: Record<ModelKind, Finish> = {
  F02: {
    mats: {
      shell: {base: '#2A3036', lit: '#4C5660', shade: '#13171B'},
      joint: {base: '#4E5862', lit: '#8C97A3', shade: '#252B31'},
      visor: {base: '#08090B', lit: '#171C21', shade: '#040506'},
      mesh: {base: '#1E2429', lit: '#363F47', shade: '#101418'},
      sole: {base: '#121518', lit: '#24292E', shade: '#0A0C0E'},
      skin: {base: '#2A3036', lit: '#4C5660', shade: '#13171B'},
      band: {base: '#4E5862', lit: '#8C97A3', shade: '#252B31'},
      glove: {base: '#3E464E', lit: '#6E7882', shade: '#1E2328'},
      pack: {base: '#31383F', lit: '#58636E', shade: '#171C21'},
    },
    outline: '#090D10', seam: '#0C1013', seamLight: '#7A8794', panel: '#363E46', vent: '#0E1215', visor: '#060708', visorHi: '#A9BCCD',
    lens: '#9FB6C8', marker: '#FFFFFF', accent: '#8C97A3', dark: '#0E1215', recess: '#14181C',
  },
  F03: {
    mats: {
      shell: {base: '#D7D2C9', lit: '#F1EEE8', shade: '#ACA496'},
      joint: {base: '#2C3034', lit: '#4A5056', shade: '#181B1E'},
      visor: {base: '#0B0D10', lit: '#1C2228', shade: '#060709'},
      mesh: {base: '#C7C0B3', lit: '#DDD7CD', shade: '#A0988B'},
      sole: {base: '#33373B', lit: '#50565C', shade: '#1F2225'},
      skin: {base: '#D7D2C9', lit: '#F1EEE8', shade: '#ACA496'},
      band: {base: '#2C3034', lit: '#4A5056', shade: '#181B1E'},
      glove: {base: '#CBC5BB', lit: '#E6E2DA', shade: '#A0988A'},
      pack: {base: '#D7D2C9', lit: '#F1EEE8', shade: '#ACA496'},
    },
    outline: '#3A3731', seam: '#A2998B', seamLight: '#FBF8F2', panel: '#CFC9BE', vent: '#9C9488', visor: '#090B0D', visorHi: '#B6C3CE',
    lens: '#9FB6C8', marker: '#FFFFFF', accent: '#B9B1A4', dark: '#1A1D21', recess: '#B3AC9F',
  },
  SIM: {
    mats: {
      shell: {base: '#9FC2EC', lit: '#DCEBFF', shade: '#6E97CF'},
      joint: {base: '#86AEE2', lit: '#C6DCFA', shade: '#557FBC'},
      visor: {base: '#3A5FA0', lit: '#4F7CC9', shade: '#2C4A80'},
      mesh: {base: '#86AEE2', lit: '#C6DCFA', shade: '#557FBC'},
      sole: {base: '#557FBC', lit: '#6E97CF', shade: '#3A5FA0'},
      skin: {base: '#9FC2EC', lit: '#DCEBFF', shade: '#6E97CF'},
      band: {base: '#86AEE2', lit: '#C6DCFA', shade: '#557FBC'},
      glove: {base: '#86AEE2', lit: '#C6DCFA', shade: '#557FBC'},
      pack: {base: '#9FC2EC', lit: '#DCEBFF', shade: '#6E97CF'},
    },
    outline: '#2C4A80', seam: '#5D86C2', seamLight: '#EAF3FF', panel: '#A9CAF0', vent: '#5D86C2', visor: '#2E4E86', visorHi: '#BFD7F7',
    lens: '#FFFFFF', marker: '#FFFFFF', accent: '#EAF3FF', dark: '#2C4A80', recess: '#6E97CF', fillOpacity: 0.92,
  },
  PERF: {
    mats: {
      shell: {base: '#7656C2', lit: '#9C83DD', shade: '#4E3591'},
      joint: {base: '#6A4BB4', lit: '#8F76D2', shade: '#45308A'},
      visor: {base: '#2B1E52', lit: '#3A2A6B', shade: '#1E153A'},
      mesh: {base: '#6A4BB4', lit: '#8F76D2', shade: '#45308A'},
      sole: {base: '#2E2840', lit: '#433B5A', shade: '#1D1929'},
      skin: {base: '#7656C2', lit: '#9C83DD', shade: '#4E3591'},
      band: {base: '#6A4BB4', lit: '#8F76D2', shade: '#45308A'},
      glove: {base: '#7656C2', lit: '#9C83DD', shade: '#4E3591'},
      pack: {base: '#7656C2', lit: '#9C83DD', shade: '#4E3591'},
    },
    outline: '#22163F', seam: '#5A3FA0', seamLight: '#B9A6EC', panel: '#7656C2', vent: '#4E3591', visor: '#2B1E52', visorHi: '#8F76D2',
    lens: '#FFFFFF', marker: '#FFFFFF', accent: '#FFFFFF', dark: '#22163F', recess: '#4E3591',
  },
};

export type Glow = {pos: V3; color: string; strength: number; falloff: number};
export type Light = {dir: V3; glow?: Glow; ambient?: number; rim?: string};
export const DEFAULT_LIGHT: Light = {dir: norm([-0.45, 0.8, 0.55])};

export type RobotProps = {
  pr: Proj;
  pose: Pose;
  kind?: ModelKind;
  id: string;
  clipY?: number;
  opacity?: number;
  light?: Light;
  explode?: number;
  /** Multiplies outline width. */
  line?: number;
  /** Hide parts by id prefix (e.g. ['thigh', 'shin'] for a cutaway). */
  hide?: string[];
  /** Overlay colour per part id prefix (e.g. highlight a sensor or knee). */
  highlight?: {prefix: string; color: string; amount: number}[];
  /** Parts within `range` cm above `level` take an orange heat tint. */
  heat?: {level: number; range: number};
  /** Draw only the outline (for ghost trails). */
  ghost?: {stroke: string; fill: string; fillOpacity: number; width?: number};
};

type Item = {z: number; key: string; el: React.ReactNode};

const sampleCurve = (pts: [number, number][], per = 5): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    for (let k = 0; k < per; k++) {
      const t = k / per;
      out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

export type Bound = {pts: V3[]; bb: [number, number, number, number]};
export const renderRobotItems = (props: RobotProps): {items: Item[]; defs: React.ReactNode[]; sk: Skeleton; bound: Bound} => {
  const {pr, pose, kind = 'F02', id, clipY, light = DEFAULT_LIGHT, explode, hide, highlight, ghost} = props;
  const fin = FINISH[kind];
  const sk = solve(pose);
  const ps = pr.p(sk.pelvis).s;
  const parts = buildParts(sk, {kind, detailHands: ps > 1.15, explode});
  const items: Item[] = [];
  const defs: React.ReactNode[] = [];
  const lineW = Math.max(1.1, Math.min(4.2, 2.1 * Math.sqrt(ps / 1.1))) * (props.line ?? 1);
  const L = norm(light.dir);
  const boundPts: V3[] = [];
  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;

  for (const part of parts) {
    if (hide && hide.some((h) => part.id.startsWith(h))) continue;
    const loops = ringLoops(part);
    const pts3: V3[] = inFront(pr, clipY !== undefined ? clipRings(loops, clipY) : loops.flat());
    if (pts3.length < 3) continue;
    const h = hull(pts3.map((q) => pr.p(q)));
    if (h.length < 3) continue;
    for (let k = 0; k < pts3.length; k += 3) boundPts.push(pts3[k]);
    for (const q of h) {
      if (q.x < bx0) bx0 = q.x; if (q.x > bx1) bx1 = q.x;
      if (q.y < by0) by0 = q.y; if (q.y > by1) by1 = q.y;
    }
    const d = smoothClosed(h);
    const C = partCenter(part);
    const c2 = pr.p(C);
    const z = c2.z - (part.bias ?? 0);
    const gid = `${id}-${part.id}`;
    const key = gid;

    if (ghost) {
      items.push({z, key, el: <path key={key} d={d} fill={ghost.fill} fillOpacity={ghost.fillOpacity} stroke={ghost.stroke} strokeWidth={ghost.width ?? 1.6} strokeLinejoin="round" />});
      continue;
    }

    const mat = fin.mats[part.mat];
    const bb = bbox(h);
    const R = Math.max(bb.w, bb.h) * 0.62 + 1;
    const l2 = pr.p(add(C, mulS(L, 18)));
    let gx = l2.x - c2.x, gy = l2.y - c2.y;
    const gl = Math.hypot(gx, gy);
    if (gl < 1e-3) {
      gx = -0.5; gy = -0.85;
    } else {
      gx /= gl; gy /= gl;
    }
    const facing = dot(L, pr.toCam(C)); // >0: we see the lit side
    const sEnd = Math.max(0.12, Math.min(0.7, 0.42 - 0.22 * facing));
    const lStart = Math.max(sEnd + 0.12, Math.min(0.95, 0.78 - 0.16 * facing));
    defs.push(
      <linearGradient key={gid + '-g'} id={gid + '-g'} gradientUnits="userSpaceOnUse" x1={c2.x - gx * R} y1={c2.y - gy * R} x2={c2.x + gx * R} y2={c2.y + gy * R}>
        <stop offset={0} stopColor={mat.shade} />
        <stop offset={sEnd} stopColor={mat.shade} />
        <stop offset={Math.min(0.99, sEnd + 0.1)} stopColor={mat.base} />
        <stop offset={lStart} stopColor={mat.base} />
        <stop offset={1} stopColor={mat.lit} />
      </linearGradient>,
    );
    const els: React.ReactNode[] = [];
    els.push(<path key="b" d={d} fill={`url(#${gid}-g)`} fillOpacity={fin.fillOpacity ?? 1} stroke={fin.outline} strokeWidth={lineW} strokeLinejoin="round" />);
    // rim light: the outline brightens on the side facing the key light (separates dark shells from dark sets)
    if (light.rim) {
      defs.push(
        <linearGradient key={gid + '-r'} id={gid + '-r'} gradientUnits="userSpaceOnUse" x1={c2.x - gx * R} y1={c2.y - gy * R} x2={c2.x + gx * R} y2={c2.y + gy * R}>
          <stop offset={0.55} stopColor={light.rim} stopOpacity={0} />
          <stop offset={0.85} stopColor={light.rim} stopOpacity={0.55} />
          <stop offset={1} stopColor={light.rim} stopOpacity={0.95} />
        </linearGradient>,
      );
      els.push(<path key="r" d={d} fill="none" stroke={`url(#${gid}-r)`} strokeWidth={lineW * 0.95} strokeLinejoin="round" />);
    }

    // glow from a hot source (molten steel): warm gradient on the side facing it
    if (light.glow) {
      const G = light.glow;
      const dist = len(sub(C, G.pos));
      const I = Math.min(0.62, G.strength / (1 + (dist / G.falloff) ** 2));
      if (I > 0.02) {
        const g2 = pr.p(G.pos);
        let hx = g2.x - c2.x, hy = g2.y - c2.y;
        const hl = Math.hypot(hx, hy) || 1;
        hx /= hl; hy /= hl;
        defs.push(
          <linearGradient key={gid + '-h'} id={gid + '-h'} gradientUnits="userSpaceOnUse" x1={c2.x - hx * R} y1={c2.y - hy * R} x2={c2.x + hx * R} y2={c2.y + hy * R}>
            <stop offset={0.25} stopColor={G.color} stopOpacity={0} />
            <stop offset={0.8} stopColor={G.color} stopOpacity={I * 0.7} />
            <stop offset={1} stopColor={G.color} stopOpacity={I} />
          </linearGradient>,
        );
        els.push(<path key="h" d={d} fill={`url(#${gid}-h)`} style={{mixBlendMode: 'screen'}} />);
        els.push(<path key="hr" d={d} fill="none" stroke={`url(#${gid}-h)`} strokeWidth={lineW * 1.1} strokeLinejoin="round" />);
      }
    }
    if (props.heat) {
      const minY = Math.min(...pts3.map((q) => q[1]));
      const k = 1 - (minY - props.heat.level) / props.heat.range;
      if (k > 0) els.push(<path key="heat" d={d} fill="#FF6A1A" fillOpacity={Math.min(0.42, k * 0.42)} />);
    }
    if (highlight) {
      for (const hl of highlight) {
        if (part.id.startsWith(hl.prefix) && hl.amount > 0) els.push(<path key={'hl' + hl.prefix} d={d} fill={hl.color} fillOpacity={hl.amount} stroke={hl.color} strokeOpacity={hl.amount} strokeWidth={lineW * 1.6} />);
      }
    }

    // decals
    (part.decals ?? []).forEach((dc, di) => {
      const el = renderDecal(pr, part, dc, fin, lineW, clipY, `${gid}-d${di}`, light);
      if (el) els.push(el);
    });
    items.push({z, key, el: <g key={key}>{els}</g>});
  }
  return {items, defs, sk, bound: {pts: boundPts, bb: [bx0, by0, bx1, by1]}};
};

const visible = (pr: Proj, p: V3, n: V3) => dot(n, pr.toCam(p));

/** Map an outline given in (y, theta) onto a part; hidden points slide along theta onto the visible silhouette. */
const mapOutline = (pr: Proj, part: Part, pts: [number, number][], lift: number, clipY: number | undefined, densify: boolean): Pt[] | null => {
  const dense: [number, number][] = [];
  if (densify) {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(b[1] - a[1]) / 4, Math.abs(b[0] - a[0]) / 1.2)));
      for (let k = 0; k < steps; k++) dense.push([a[0] + ((b[0] - a[0]) * k) / steps, a[1] + ((b[1] - a[1]) * k) / steps]);
    }
  } else dense.push(...pts);
  const at = (y: number, t: number) => {
    const s = surfLocal(part.rings, y, t, lift);
    const p = toWorld(part, s.p);
    return {p, v: visible(pr, p, dirWorld(part, s.n))};
  };
  const bestT = new Map<number, number>();
  const facing = (y: number) => {
    const k = Math.round(y * 2);
    if (bestT.has(k)) return bestT.get(k)!;
    let bt = 0, bv = -2;
    for (let t = -180; t < 180; t += 15) {
      const v = at(y, t).v;
      if (v > bv) { bv = v; bt = t; }
    }
    bestT.set(k, bt);
    return bt;
  };
  const out: Pt[] = [];
  let anyVis = false;
  const VMIN = 0.02;
  for (const [y, t] of dense) {
    let s = at(y, t);
    if (s.v < VMIN) {
      const tc = facing(y);
      const delta = ((tc - t + 540) % 360) - 180;
      if (at(y, t + delta).v < VMIN) continue;
      let lo = 0, hi = 1;
      for (let it = 0; it < 12; it++) {
        const m = (lo + hi) / 2;
        if (at(y, t + delta * m).v < VMIN) lo = m;
        else hi = m;
      }
      s = at(y, t + delta * hi);
    } else anyVis = true;
    if (clipY !== undefined && s.p[1] < clipY) return null;
    out.push(pr.p(s.p));
  }
  return anyVis && out.length >= 3 ? out : null;
};

const inPoly = (pts: [number, number][], y: number, t: number) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [yi, ti] = pts[i], [yj, tj] = pts[j];
    if ((yi > y) !== (yj > y) && t < ((tj - ti) * (y - yi)) / (yj - yi) + ti) c = !c;
  }
  return c;
};

/** Reflections on a glossy visor: where the surface normal bisects the light and the view (moves with lighting). */
const visorHighlight = (pr: Proj, part: Part, outline: [number, number][], light: Light): {x: number; y: number; r: number; color: string; a: number}[] => {
  const ys = outline.map((q) => q[0]), ts = outline.map((q) => q[1]);
  const y0 = Math.min(...ys), y1 = Math.max(...ys), t0 = Math.min(...ts), t1 = Math.max(...ts);
  const srcs: {dir: (p: V3) => V3; color: string; k: number}[] = [{dir: () => norm(light.dir), color: '#C9D7E3', k: 0.55}];
  if (light.glow) {
    const g = light.glow;
    srcs.push({dir: (p: V3) => norm(sub(g.pos, p)), color: g.color, k: Math.min(0.85, g.strength / (1 + (len(sub(partCenter(part), g.pos)) / g.falloff) ** 2))});
  }
  const res: {x: number; y: number; r: number; color: string; a: number}[] = [];
  for (const src of srcs) {
    let best = -1, bp: V3 | null = null;
    for (let i = 0; i <= 8; i++) for (let j = 0; j <= 10; j++) {
      const y = y0 + ((y1 - y0) * i) / 8, t = t0 + ((t1 - t0) * j) / 10;
      if (!inPoly(outline, y, t)) continue;
      const sp = surfLocal(part.rings, y, t, 0.3);
      const p = toWorld(part, sp.p);
      const n = dirWorld(part, sp.n);
      const V = pr.toCam(p);
      if (dot(n, V) < 0.05) continue;
      const Hh = norm(add(src.dir(p), V));
      const sc = dot(n, Hh);
      if (sc > best) { best = sc; bp = p; }
    }
    if (!bp || best < 0.8) continue;
    const q = pr.p(bp);
    const span = (y1 - y0) * q.s;
    res.push({x: q.x, y: q.y, r: span * 0.28, color: src.color, a: Math.min(0.6, (best - 0.8) * 3) * src.k * 1.4});
  }
  return res;
};

const renderDecal = (pr: Proj, part: Part, dc: Decal, fin: Finish, lineW: number, clipY: number | undefined, key: string, light: Light): React.ReactNode => {
  if (dc.kind === 'curve') {
    const samples = sampleCurve(dc.pts).map(([y, t]) => {
      const s = surfLocal(part.rings, y, t);
      const p = toWorld(part, s.p);
      return {p, v: visible(pr, p, dirWorld(part, s.n))};
    });
    // split into visible runs (and above the cut plane)
    const runs: V3[][] = [];
    let cur: V3[] = [];
    for (const s of samples) {
      if (s.v > 0.06) cur.push(s.p);
      else if (cur.length) {
        runs.push(cur);
        cur = [];
      }
    }
    if (cur.length) runs.push(cur);
    const paths: string[] = [];
    for (const r of runs) {
      const pieces = clipY !== undefined ? clipPolyline(r, clipY) : [r];
      for (const pc of pieces) if (pc.length > 1) paths.push(smoothOpen(pc.map((q) => pr.p(q))));
    }
    if (!paths.length) return null;
    const col = dc.mat === 'seamLight' ? fin.seamLight : dc.mat === 'accent' ? fin.accent : fin.seam;
    return <path key={key} d={paths.join(' ')} fill="none" stroke={col} strokeWidth={lineW * (dc.w ?? 0.55)} strokeLinecap="round" strokeOpacity={dc.op ?? (dc.mat === 'seamLight' ? 0.55 : 0.9)} />;
  }
  if (dc.kind === 'poly' || dc.kind === 'symbol') {
    // exact outline mapped onto the ring surface; points that wrap past the silhouette slide back onto it
    let outline: [number, number][];
    let lift = 0.25;
    if (dc.kind === 'symbol') {
      const c0 = surfLocal(part.rings, dc.y, dc.t, 0.3);
      const vc = visible(pr, toWorld(part, c0.p), dirWorld(part, c0.n));
      if (vc < 0.2) return null;
      outline = SYMBOL_POLY.map(([sx, sy]) => {
        const y = dc.y + sy * dc.h;
        return [y, dc.t + ((sx * dc.h) / ringRadius(part.rings, y)) * (180 / Math.PI)] as [number, number];
      });
      lift = 0.32;
    } else outline = dc.pts;
    const pts = mapOutline(pr, part, outline, lift, clipY, dc.kind === 'poly');
    if (!pts) return null;
    if (dc.kind === 'symbol') {
      const c0 = surfLocal(part.rings, dc.y, dc.t, 0.3);
      const vc = visible(pr, toWorld(part, c0.p), dirWorld(part, c0.n));
      const op = Math.min(1, (vc - 0.2) / 0.2);
      return <path key={key} d={polyClosed(pts)} fill={dc.color === 'dark' ? fin.dark : '#E9ECEE'} fillOpacity={op} />;
    }
    const d = polyClosed(pts);
    if (dc.mat === 'visor') {
      const hl = visorHighlight(pr, part, dc.pts, light);
      const cid = key + '-clip';
      return (
        <g key={key}>
          <defs>
            <clipPath id={cid}><path d={d} /></clipPath>
            {hl.map((h, i) => (
              <radialGradient key={i} id={`${cid}-g${i}`}>
                <stop offset={0} stopColor={h.color} stopOpacity={h.a} />
                <stop offset={0.45} stopColor={h.color} stopOpacity={h.a * 0.45} />
                <stop offset={1} stopColor={h.color} stopOpacity={0} />
              </radialGradient>
            ))}
          </defs>
          <path d={d} fill={fin.visor} stroke={fin.outline} strokeWidth={lineW * 0.7} strokeLinejoin="round" />
          <g clipPath={`url(#${cid})`}>
            {hl.map((h, i) => <ellipse key={i} cx={h.x} cy={h.y} rx={h.r} ry={h.r * 0.72} fill={`url(#${cid}-g${i})`} />)}
          </g>
        </g>
      );
    }
    const fill = dc.mat === 'vent' ? fin.vent : dc.mat === 'dark' ? fin.dark : dc.mat === 'accent' ? fin.accent : dc.mat === 'recess' ? fin.recess : fin.panel;
    return <path key={key} d={d} fill={fill} fillOpacity={dc.mat === 'panel' ? 0.9 : 0.95} stroke={fin.seam} strokeWidth={lineW * 0.5} strokeOpacity={0.85} strokeLinejoin="round" />;
  }
  if (dc.kind === 'patch') {
    const pts: Pt[] = [];
    const NY = 7, NT = 11;
    let vis = 0;
    for (let i = 0; i <= NY; i++) {
      for (let j = 0; j <= NT; j++) {
        const u = i / NY, w = j / NT;
        if (dc.round && (u === 0 || u === 1) && (w === 0 || w === 1)) continue;
        if (dc.round && dc.round > 0.4 && (u === 0 || u === 1) && (j === 1 || j === NT - 1)) continue;
        const y = dc.y0 + (dc.y1 - dc.y0) * u;
        const t = dc.t0 + (dc.t1 - dc.t0) * w;
        const s = surfLocal(part.rings, y, t, 0.25);
        const p = toWorld(part, s.p);
        if (clipY !== undefined && p[1] < clipY) continue;
        if (visible(pr, p, dirWorld(part, s.n)) > 0.03) {
          pts.push(pr.p(p));
          vis++;
        }
      }
    }
    if (vis < 4) return null;
    const h = hull(pts);
    const d = smoothClosed(h);
    if (dc.mat === 'visor') {
      // glossy face panel + a reflection streak; molten light reflects low on the panel when a glow is present
      const hi: Pt[] = [];
      for (let i = 0; i <= 6; i++) for (let j = 0; j <= 1; j++) {
        const u = i / 6;
        const s = surfLocal(part.rings, dc.y0 + (dc.y1 - dc.y0) * (0.42 + 0.46 * u), dc.t0 + (dc.t1 - dc.t0) * (0.16 + 0.2 * u + 0.07 * j), 0.3);
        const p = toWorld(part, s.p);
        if (visible(pr, p, dirWorld(part, s.n)) > 0.05) hi.push(pr.p(p));
      }
      const glowEl = (() => {
        if (!light.glow) return null;
        const g: Pt[] = [];
        for (let i = 0; i <= 2; i++) for (let j = 0; j <= 6; j++) {
          const s = surfLocal(part.rings, dc.y0 + (dc.y1 - dc.y0) * (0.02 + 0.22 * (i / 2)), dc.t0 + (dc.t1 - dc.t0) * (0.1 + 0.8 * (j / 6)), 0.3);
          const p = toWorld(part, s.p);
          if (visible(pr, p, dirWorld(part, s.n)) > 0.05) g.push(pr.p(p));
        }
        const C = partCenter(part);
        const I = Math.min(0.9, light.glow.strength / (1 + (len(sub(C, light.glow.pos)) / light.glow.falloff) ** 2));
        return g.length > 3 && I > 0.03 ? <path d={smoothClosed(hull(g))} fill={light.glow.color} fillOpacity={I * 0.85} /> : null;
      })();
      return (
        <g key={key}>
          <path d={d} fill={fin.visor} stroke={fin.outline} strokeWidth={lineW * 0.7} />
          {hi.length > 3 ? <path d={smoothClosed(hull(hi))} fill={fin.visorHi} fillOpacity={0.34} /> : null}
          {glowEl}
        </g>
      );
    }
    const fill = dc.mat === 'vent' ? fin.vent : dc.mat === 'dark' ? fin.dark : dc.mat === 'accent' ? fin.accent : fin.panel;
    return <path key={key} d={d} fill={fill} fillOpacity={dc.mat === 'panel' ? 0.55 : 0.95} stroke={fin.seam} strokeWidth={lineW * 0.5} strokeOpacity={0.85} />;
  }
  // dot
  const s = surfLocal(part.rings, dc.y, dc.t, 0.3);
  const p = toWorld(part, s.p);
  if (clipY !== undefined && p[1] < clipY) return null;
  const v = visible(pr, p, dirWorld(part, s.n));
  if (v < 0.08) return null;
  const q = pr.p(p);
  const r = dc.r * q.s * Math.sqrt(Math.min(1, v + 0.15));
  const fill = dc.mat === 'lens' ? fin.lens : dc.mat === 'marker' ? fin.marker : fin.accent;
  return <circle key={key} cx={q.x} cy={q.y} r={Math.max(0.6, r)} fill={fill} stroke={fin.outline} strokeWidth={Math.max(0.5, lineW * 0.35)} />;
};

/** Standalone robot (its own depth sort). Use renderRobotItems to interleave with set pieces. */
export const Robot: React.FC<RobotProps> = (props) => {
  const {items, defs} = renderRobotItems(props);
  items.sort((a, b) => b.z - a.z);
  return (
    <g opacity={props.opacity ?? 1}>
      <defs>{defs}</defs>
      {items.map((it) => it.el)}
    </g>
  );
};

export {polyOpen};
