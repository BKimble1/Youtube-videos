// The tissue, magnified (units u; 1 u = 2 µm, nested into the back muscle at MICRO_B). A cross-section of muscle:
// polygonal fibre profiles, each with its membrane, its fine myofibril stipple and a nucleus at its edge, packed with
// thin extracellular spaces between them, and one capillary running through (frog red cells are oval and nucleated).
// Freezing: ice grows only in the spaces BETWEEN the cells. Water is drawn out of the cells toward the ice (blue beads
// cross the membrane), so the cells shrink and one, near the capillary, starts to crumple.
// Protection: glucose rings arrive along the capillary, leave it, pass the membrane through transporters into the cells
// and stay dissolved inside; the crumpled cell rounds out again and holds its size, the ice stops at its membrane, and
// the inside stays liquid (the rings keep drifting while the ice outside is rigid).
import React from 'react';
import {P, add, closed, dir, len, mul, nrm, open, pt, sub} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, lerp, noise1, ss} from '../lib';
import {Glucose} from './anatomy';

export type MicroState = {
  t: number;
  ice: number;      // 0..1 ice in the extracellular spaces
  front: number;    // the ice front's position along FRONT (u)
  shrink: number;   // 0..1 dehydration of all cells (water drawn out to the ice)
  water: number;    // 0..1 visible water leaving the cells
  crumple: number;  // 0..1 the hero cell's crumpling
  sugar: number;    // 0..1 glucose arriving
  sc: number;       // seconds since the glucose began arriving
  hold: number;     // 0..1 the hero cell protected: rounded out, its interior liquid
  spikes: number;   // 0..1 ice needles pressing on the hero cell's membrane (they stop at it)
  blood: number;    // 0..1 plasma flow speed in the capillary
  melt: number;     // 0..1 ice gone
};
export const FRONT = nrm(pt(0.55, 0.84));
const SP = 150;
// the capillary: a gently curved channel across the field (flow from +x toward -x)
export const CAP: P[] = [pt(1900, -40), pt(900, 10), pt(300, -30), pt(-200, -110), pt(-700, -150), pt(-1900, -120)];
const CAP_R = 34;
const capY = (x: number) => {
  for (let i = 1; i < CAP.length; i++) {
    const a = CAP[i - 1], b = CAP[i];
    if (x <= a.x && x >= b.x) return lerp(a.y, b.y, (a.x - x) / (a.x - b.x));
  }
  return CAP[CAP.length - 1].y;
};
type Cell = {s: P; poly: P[]; c: P; r: number; nucA: number; i: number; rad: number[]};
const NA = 28;
const CELLS: Cell[] = (() => {
  const seeds: P[] = [];
  const rows = Math.ceil(4600 / (SP * 0.87));
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < 26; i++) {
      const x = -1950 + i * SP + (j % 2) * SP * 0.5 + (hash(i * 7.1 + j * 3.3) - 0.5) * SP * 0.38;
      const y = -2300 + j * SP * 0.87 + (hash(i * 2.7 + j * 9.1) - 0.5) * SP * 0.34;
      const dy = y - capY(x);
      if (Math.abs(dy) < CAP_R + 58) continue; // keep the capillary's channel clear
      seeds.push(pt(x, y));
    }
  }
  // Voronoi cells by half-plane clipping against near neighbours; the capillary wall is one more half-plane
  const out: Cell[] = [];
  seeds.forEach((s, k) => {
    let poly: P[] = [0, 1, 2, 3, 4, 5].map((q) => add(s, mul(dir((q * Math.PI) / 3 + 0.3), SP * 1.2)));
    const clip = (n: P, d: number) => {
      // keep points with dot(p, n) <= d
      const res: P[] = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const da = a.x * n.x + a.y * n.y - d, db = b.x * n.x + b.y * n.y - d;
        if (da <= 0) res.push(a);
        if (da * db < 0) res.push(add(a, mul(sub(b, a), da / (da - db))));
      }
      poly = res;
    };
    for (const o of seeds) {
      if (o === s) continue;
      const v = sub(o, s);
      const L = len(v);
      if (L > SP * 2.2) continue;
      const n = mul(v, 1 / L);
      const m = add(s, mul(v, 0.5));
      clip(n, m.x * n.x + m.y * n.y);
    }
    // the capillary wall
    const cy = capY(s.x);
    if (s.y > cy) clip(pt(0, -1), -(cy + CAP_R + 14));
    else clip(pt(0, 1), cy - CAP_R - 14);
    if (poly.length < 3) return;
    const c = mul(poly.reduce((acc, p) => add(acc, p), pt(0, 0)), 1 / poly.length);
    const r = Math.min(...poly.map((p) => len(sub(p, c))));
    // the outline as a radius per angle (ray cast from the centre), for smooth shrinking
    const rad: number[] = [];
    for (let q = 0; q < NA; q++) {
      const d = dir((q / NA) * Math.PI * 2);
      let best = 1e9;
      for (let i = 0; i < poly.length; i++) {
        const a = sub(poly[i], c), b = sub(poly[(i + 1) % poly.length], c);
        const e = sub(b, a);
        const den = d.x * e.y - d.y * e.x;
        if (Math.abs(den) < 1e-9) continue;
        const tt = (a.x * e.y - a.y * e.x) / den, uu = (a.x * d.y - a.y * d.x) / den;
        if (tt > 0 && uu >= 0 && uu <= 1) best = Math.min(best, tt);
      }
      rad.push(best);
    }
    out.push({s, poly, c, r, nucA: hash(k * 4.7) * Math.PI * 2, i: k, rad});
  });
  return out;
})();
/** the cell the story follows: just below the capillary near the frame centre */
export const HERO = (() => CELLS.reduce((b, c) => (len(sub(c.c, pt(60, 120))) < len(sub(b.c, pt(60, 120))) ? c : b), CELLS[0]))();
const NEIGH = CELLS.filter((c) => c !== HERO && len(sub(c.c, HERO.c)) < SP * 2.4 && c.c.y > capY(c.c.x));
// transporters: on the hero and its neighbours, on the side facing the capillary
type Port = {cell: Cell; p: P; n: P};
const portsOf = (cell: Cell, k: number): Port[] => {
  const out: Port[] = [];
  const ps = cell.poly;
  const scored = ps.map((p, i) => ({i, y: p.y + (hash(cell.i + i) - 0.5) * 30}));
  scored.sort((a, b) => a.y - b.y);
  for (let q = 0; q < Math.min(k, ps.length); q++) {
    const i = scored[q].i;
    const a = ps[i], b = ps[(i + 1) % ps.length];
    const m = add(a, mul(sub(b, a), 0.5));
    out.push({cell, p: m, n: nrm(sub(m, cell.c))});
  }
  return out;
};
const PORTS: Port[] = [...portsOf(HERO, 3), ...NEIGH.flatMap((c) => portsOf(c, 1))];

/** cell outline after dehydration and crumpling: the polygon's radius profile, pulled in by the gap, scaled by the
 * water loss and rounded (a dehydrated cell rounds and shrinks; the hero cell also buckles) */
const cellShape = (c: Cell, m: MicroState, gap: number) => {
  const hero = c === HERO;
  const k = 1 - 0.14 * m.shrink * (0.7 + 0.6 * hash(c.i * 1.3)) - (hero ? 0.14 * m.crumple * (1 - m.hold) : 0) + (hero ? 0.02 * m.hold : 0);
  const round = 0.25 + 0.35 * m.shrink;
  const pts: P[] = [];
  for (let q = 0; q < NA; q++) {
    const ang = (q / NA) * Math.PI * 2;
    let r = Math.max(0, c.rad[q] - gap);
    r = lerp(r, c.r * 0.98, round * 0.6) * k;
    if (hero && m.crumple > 0) r *= 1 - 0.09 * m.crumple * (1 - m.hold) * (0.5 + 0.5 * Math.sin(ang * 6 + 1.3 + 0.8 * Math.sin(ang * 3)));
    pts.push(add(c.c, mul(dir(ang), r)));
  }
  return pts;
};

// ice plates (extracellular): a triangulated field, drawn under the cells so it shows only in the spaces between them
type Facet = {pts: P[]; c: P; a: number; th: number};
const FACETS: Facet[] = (() => {
  const step = 64, x0 = -2000, y0 = -2400, nx = 63, ny = 75;
  const g: P[][] = [];
  for (let j = 0; j <= ny; j++) {
    g.push([]);
    for (let i = 0; i <= nx; i++) g[j].push(pt(x0 + i * step + (hash(i * 13.1 + j * 7.7) - 0.5) * step * 0.7, y0 + j * step + (hash(i * 3.9 + j * 11.3) - 0.5) * step * 0.7));
  }
  const out: Facet[] = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const q = [g[j][i], g[j][i + 1], g[j + 1][i + 1], g[j + 1][i]];
    const tris = hash(i + j * 31) > 0.5 ? [[q[0], q[1], q[2]], [q[0], q[2], q[3]]] : [[q[0], q[1], q[3]], [q[1], q[2], q[3]]];
    for (const t of tris) {
      const c = pt((t[0].x + t[1].x + t[2].x) / 3, (t[0].y + t[1].y + t[2].y) / 3);
      out.push({pts: t, c, a: hash(c.x * 0.73 + c.y * 0.31), th: hash(c.x * 0.13 + c.y * 0.97)});
    }
  }
  return out;
})();
const frontD = (p: P) => p.x * FRONT.x + p.y * FRONT.y;

// glucose choreography: rings arrive along the capillary; a share leave it and enter cells through the transporters
type Ring = {t0: number; exitX: number; port?: Port; inside: P; a: number};
const RINGS: Ring[] = Array.from({length: 120}, (_, i) => {
  const port = i % 3 === 2 ? undefined : PORTS[(i * 7) % PORTS.length];
  const exitX = port ? port.p.x + (hash(i * 3.3) - 0.5) * 60 : -99999;
  const inside = port ? add(port.cell.c, mul(dir(hash(i * 1.9) * 6.283), port.cell.r * (0.15 + 0.5 * hash(i * 2.7)))) : pt(0, 0);
  return {t0: i * 0.022 + hash(i * 5.1) * 0.08, exitX, port, inside, a: hash(i * 8.8) * 6.28};
});
const CAP_V = 820; // u/s
/** where a transporter sits on its cell's current (shrunk) outline */
const portAt = (q: Port, m: MicroState, gap: number) => {
  const ang = Math.atan2(q.n.y, q.n.x);
  const pts = cellShape(q.cell, m, gap);
  const idx = Math.round((((ang / (Math.PI * 2)) % 1) + 1) % 1 * NA) % NA;
  return pts[idx];
};
const capPoint = (x: number, lane: number) => pt(x, capY(x) + lane);
const ringPos = (r: Ring, sc: number, i: number, m: MicroState, gap: number): {p: P; op: number} | null => {
  const tau = sc - r.t0;
  if (tau < 0) return null;
  const lane = (hash(i * 4.4) - 0.5) * CAP_R * 1.2;
  const x0 = 700;
  const x = x0 - CAP_V * tau;
  if (!r.port || x > r.exitX) {
    if (x < -1900) return null;
    return {p: capPoint(x, lane), op: 1};
  }
  // leave the capillary at exitX, cross the space to the transporter, pass it, then drift inside
  const tExit = (x0 - r.exitX) / CAP_V;
  const u = tau - tExit;
  const A = capPoint(r.exitX, lane);
  const pp = portAt(r.port, m, gap);
  const portOut = add(pp, mul(r.port.n, 30));
  const portIn = add(pp, mul(r.port.n, -26));
  const inside = add(r.port.cell.c, mul(sub(r.inside, r.port.cell.c), 0.85 - 0.12 * m.shrink));
  if (u < 0.42) {
    const k = ss(u, 0, 0.42);
    return {p: add(A, mul(sub(portOut, A), k)), op: 1};
  }
  if (u < 0.62) return {p: add(portOut, mul(sub(portIn, portOut), ss(u, 0.42, 0.62))), op: 1};
  const k = ss(u, 0.62, 1.4);
  const drift = pt(14 * noise1(u * 1.3, i), 14 * noise1(u * 1.1, i + 7));
  return {p: add(add(portIn, mul(sub(inside, portIn), k)), mul(drift, k)), op: 1};
};

export const Micro: React.FC<{m: MicroState; view: {x0: number; y0: number; x1: number; y1: number}}> = ({m, view}) => {
  const id = {cell: uid('mc'), stip: uid('ms'), nuc: uid('mn'), cap: uid('mp'), ice: uid('mi'), heroIn: uid('mh')};
  const pad = 200;
  const vis = (p: P, r = SP) => p.x > view.x0 - pad - r && p.x < view.x1 + pad + r && p.y > view.y0 - pad - r && p.y < view.y1 + pad + r;
  const ice = clamp(m.ice) * (1 - clamp(m.melt));
  const facetG = (f: Facet) => clamp((ice * 1.3 - f.th * 0.5) / 0.4) * ss(m.front - frontD(f.c), -60, 140);
  const gap = 10 + 10 * m.shrink;
  const cells = CELLS.filter((c) => vis(c.c));
  // capillary path
  const capD = open(CAP);
  const flowT = m.t * m.blood;
  // red cells parked (or barely moving) in the capillary
  const rbcs = Array.from({length: 26}, (_, i) => {
    const x = 1700 - ((i * 160 + flowT * 140) % 3600);
    const p = capPoint(x, (hash(i * 3.3) - 0.5) * 18);
    return <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${(hash(i) - 0.5) * 40})`}>
      <ellipse rx={30} ry={17} fill={mix('#C23A3A', '#8E6A78', 0.4 * ice)} stroke="#3A0A12" strokeWidth={2} />
      <ellipse rx={10} ry={6} fill={mix('#7A1E2A', '#5E4656', 0.4 * ice)} />
    </g>;
  });
  const rings = m.sugar > 0 ? RINGS.map((r, i) => {
    const q = ringPos(r, m.sc, i, m, gap);
    if (!q || !vis(q.p, 20)) return null;
    return <Glucose key={i} p={q.p} r={9.5} a={r.a + m.t * (0.6 + hash(i) * 0.6)} op={q.op * clamp(m.sugar * 2)} />;
  }) : null;
  // water leaving the cells (blue beads crossing outward through the membrane)
  const water: React.ReactNode[] = [];
  if (m.water > 0.01) {
    cells.forEach((c) => {
      for (let q = 0; q < 2; q++) {
        const ph = (m.t * 0.8 + hash(c.i * 3.1 + q)) % 1;
        const a = hash(c.i * 7.7 + q * 2.2) * Math.PI * 2;
        const p = add(c.c, mul(dir(a), c.r * (0.45 + 0.85 * ph)));
        water.push(<circle key={`${c.i}_${q}`} cx={p.x} cy={p.y} r={9 * (1 - 0.4 * ph)} fill="#9EDCFF" stroke="#13304E" strokeWidth={2} opacity={m.water * Math.sin(Math.PI * ph)} />);
      }
    });
  }
  // ice needles pressing on the hero cell; they stop at its membrane
  const heroPts = cellShape(HERO, m, gap);
  const spikes: React.ReactNode[] = [];
  if (m.spikes > 0.01) {
    heroPts.forEach((p, i) => {
      if (i % 2) return;
      const v = nrm(sub(p, HERO.c));
      const g = clamp(m.spikes * 1.4 - hash(i) * 0.4);
      if (g <= 0) return;
      // each needle grows inward from the ice and stops 6 u short of the membrane
      const tip = add(p, mul(v, 6 + 40 * (1 - g)));
      const base = add(p, mul(v, 60));
      const side = mul(pt(-v.y, v.x), 7);
      spikes.push(<path key={i} d={`M${tip.x} ${tip.y}L${base.x + side.x} ${base.y + side.y}L${base.x - side.x} ${base.y - side.y}Z`} fill="#EAF8FF" stroke="#7FB4D8" strokeWidth={1.6} strokeLinejoin="round" opacity={0.95} />);
    });
  }
  return (
    <g>
      <defs>
        <radialGradient id={id.cell} cx="0.42" cy="0.38" r="0.7">
          <stop offset={0} stopColor="#DA6A6E" />
          <stop offset={0.65} stopColor="#B7404C" />
          <stop offset={1} stopColor="#7E2234" />
        </radialGradient>
        <radialGradient id={id.heroIn} cx="0.45" cy="0.4" r="0.7">
          <stop offset={0} stopColor={mix('#DA6A6E', '#F2A65A', 0.35 * m.hold)} />
          <stop offset={0.65} stopColor={mix('#B7404C', '#C9603E', 0.3 * m.hold)} />
          <stop offset={1} stopColor="#7E2234" />
        </radialGradient>
        <pattern id={id.stip} width={14} height={12} patternUnits="userSpaceOnUse">
          <circle cx={3} cy={3} r={1.6} fill="#5E1424" opacity={0.45} />
          <circle cx={10} cy={9} r={1.6} fill="#5E1424" opacity={0.45} />
        </pattern>
      </defs>
      {/* the extracellular matrix: dark fluid, then ice plates growing into it */}
      <rect x={view.x0 - pad} y={view.y0 - pad} width={view.x1 - view.x0 + 2 * pad} height={view.y1 - view.y0 + 2 * pad} fill={mix('#2E0F1C', '#20304A', 0.55 * ice)} />
      {ice > 0.01 && FACETS.filter((f) => vis(f.c, 70)).map((f, i) => {
        const k = facetG(f);
        if (k <= 0.01) return null;
        const pts = f.pts.map((q) => add(f.c, mul(sub(q, f.c), 0.3 + 0.7 * k)));
        return <path key={i} d={'M' + pts.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join('L') + 'Z'} fill={mix('#BFE6FA', '#FFFFFF', f.a * 0.6)} fillOpacity={(0.55 + 0.35 * f.a) * k} stroke="#FFFFFF" strokeOpacity={0.9 * k} strokeWidth={2.2} strokeLinejoin="round" />;
      })}
      {/* the capillary: wall, plasma, parked red cells */}
      <path d={capD} stroke="#E79AA4" strokeWidth={CAP_R * 2 + 16} fill="none" strokeLinecap="round" />
      <path d={capD} stroke="#3A0C16" strokeWidth={CAP_R * 2 + 20} fill="none" strokeLinecap="round" opacity={0.0} />
      <path d={capD} stroke={mix('#5A1A2A', '#3E4A66', 0.5 * ice)} strokeWidth={CAP_R * 2} fill="none" strokeLinecap="round" />
      <path d={capD} stroke="#F6C9CF" strokeWidth={3} fill="none" opacity={0.6} transform={`translate(0 ${-CAP_R - 4})`} />
      {rbcs}
      {/* cells */}
      {cells.map((c) => {
        const pts = c === HERO ? heroPts : cellShape(c, m, gap);
        const d = closed(pts, 0.6);
        const nuc = add(c.c, mul(dir(c.nucA), c.r * 0.62));
        const frostEdge = ice * ss(m.front - frontD(c.c), -40, 160);
        return (
          <g key={c.i}>
            {/* ice pressed against the membrane from outside */}
            {frostEdge > 0.02 && <path d={d} fill="none" stroke="#E8F8FF" strokeWidth={9} opacity={0.75 * frostEdge} />}
            <path d={d} fill={c === HERO ? `url(#${id.heroIn})` : `url(#${id.cell})`} stroke="#2A0710" strokeWidth={4.5} />
            <path d={d} fill={`url(#${id.stip})`} />
            <path d={d} fill="none" stroke="#F5A3A8" strokeWidth={2.2} opacity={0.75} transform={`translate(${c.c.x} ${c.c.y}) scale(0.965) translate(${-c.c.x} ${-c.c.y})`} />
            <ellipse cx={nuc.x} cy={nuc.y} rx={c.r * 0.26} ry={c.r * 0.15} transform={`rotate(${(c.nucA * 180) / Math.PI + 90} ${nuc.x} ${nuc.y})`} fill="#5B3480" stroke="#21102E" strokeWidth={2} />
          </g>
        );
      })}
      {/* transporters in the membranes facing the capillary */}
      {m.sugar > 0.01 && PORTS.filter((q) => vis(q.p, 30)).map((q, i) => {
        const a = (Math.atan2(q.n.y, q.n.x) * 180) / Math.PI;
        const open_ = 0.5 + 0.5 * Math.sin(m.t * 9 + i);
        const at = portAt(q, m, gap);
        return (
          <g key={i} transform={`translate(${at.x} ${at.y}) rotate(${a})`} opacity={clamp(m.sugar * 3)}>
            <rect x={-11} y={-12 - 2 * open_} width={22} height={9} rx={4.5} fill="#43C2B0" stroke="#0E2E2A" strokeWidth={2.2} />
            <rect x={-11} y={3 + 2 * open_} width={22} height={9} rx={4.5} fill="#43C2B0" stroke="#0E2E2A" strokeWidth={2.2} />
          </g>
        );
      })}
      {water}
      {spikes}
      {rings}
    </g>
  );
};
export const microBounds = (x: number, y: number, w: number, roll = 0) => {
  const h = (w * 16) / 9;
  const r = Math.abs(Math.sin(roll)) * 0.5 + 1;
  return {x0: x - (w / 2) * r * 1.2, y0: y - (h / 2) * r, x1: x + (w / 2) * r * 1.2, y1: y + (h / 2) * r};
};
