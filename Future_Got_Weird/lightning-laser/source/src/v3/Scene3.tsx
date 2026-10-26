// V3 (copied from v2/Scene3D.tsx, V2 keeps its own): the experiment seen through a perspective camera (p3.ts). V3 colour
// language: the laser path is a thin cyan/teal line with cyan packets; the air it prepares is a restrained warm haze;
// the discharge is white with violet edges, its glow held back so the core and branches stay legible.
// Flat fills with ink contours and gradient shading, as
// in the 2D art; positions come from the 3D model so views agree. Pieces are painter-sorted (far first), so platform
// rings hide the shaft and mast behind them from below. The discharge lights the tower's facing side, the cloud deck
// near the bolt, the rain and the ground.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {add3, axis3, BOLT3, Br3, Cam3, cross3, dot3, EXIT3, len3, lerp3, mul3, norm3, P3, projector, Proj, sub3, TW, v3, V3} from '../v2/p3';
import {PAL} from './palette';
import {G} from '../world/site';

const INK = '#0B151C';
type Pt = {x: number; y: number};
const hull = (pts: Pt[]): Pt[] => {
  const p = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3) return p;
  const cr = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: Pt[] = [], up: Pt[] = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
const poly = (pts: Pt[]) => (pts.length ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z` : '');
const line = (pts: Pt[]) => (pts.length ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}` : '');
const circle3 = (c: V3, r: number, n = 28): V3[] => Array.from({length: n}, (_, i) => v3(c.x + r * Math.cos((i / n) * 6.2832), c.y, c.z + r * Math.sin((i / n) * 6.2832)));

// ------------------------------------------------------------------ sky, clouds, ranges, ground, rain
export const Sky3D: React.FC<{cam: Cam3; flash: number; boltTop?: V3; drift: number; rainT: number; rain?: number; ground?: boolean}> = ({cam, flash, boltTop, drift, rainT, rain = 1, ground = true}) => {
  const P = projector(cam);
  const fwdH = v3(Math.sin((cam.yaw * Math.PI) / 180), 0, Math.cos((cam.yaw * Math.PI) / 180));
  const hz = P(add3(cam.pos, v3(fwdH.x * 1e5, 0, fwdH.z * 1e5))).y; // horizon line on screen
  // the cloud deck (seen from below): large, irregular cells on a plane at about 232 m, far first, fading into haze
  const CB = 232;
  const puffs: {p: Proj; r: number; lit: number; k: number; fog: number}[] = [];
  if (cam.pos.y < CB) {
    for (let ix = -9; ix <= 9; ix++) for (let iz = -6; iz <= 16; iz++) {
      const k = (ix + 20) * 100 + iz;
      const w = v3(ix * 105 + 60 * (hash(k, 3) - 0.5) + drift * 4, CB + 26 * hash(k, 5), iz * 105 + 60 * (hash(k, 7) - 0.5));
      const p = P(w);
      if (!p.ok || p.z < 8) continue;
      const r = (cam.f * (62 + 46 * hash(k, 9))) / p.z;
      if (p.x < -r * 2 || p.x > 1080 + r * 2 || p.y < -r * 2 || p.y > 1920 + r * 2) continue;
      const lit = boltTop ? Math.exp(-len3(sub3(w, boltTop)) / 190) : 0;
      puffs.push({p, r, lit, k, fog: clamp((len3(sub3(w, cam.pos)) - 300) / 1300)});
    }
    puffs.sort((a, b) => b.p.z - a.p.z);
  }
  const range = (seed: number, amp: number, col: string, k: number) => {
    const pts: Pt[] = [{x: -200, y: 2400}];
    for (let x = -200; x <= 1280; x += 60) pts.push({x, y: hz - amp * (0.3 + 0.7 * Math.abs(noise1((x + cam.yaw * 18 * k) / 170, seed)))});
    pts.push({x: 1280, y: 2400});
    return <path d={poly(pts)} fill={col} />;
  };
  // rain: drops in a volume round the camera (world-fixed cells, falling at ~9 m/s), each drawn as its projected fall
  // streak, so every streak points along the projected vertical and density follows perspective naturally
  const drops: string[] = [];
  const RC = 9; // cell size (m)
  const cxi = Math.floor(cam.pos.x / RC), cyi = Math.floor(cam.pos.y / RC), czi = Math.floor(cam.pos.z / RC);
  for (let ix = -5; ix <= 5; ix++) for (let iy = -4; iy <= 5; iy++) for (let iz = -5; iz <= 5; iz++) {
    const gx = cxi + ix, gy = cyi + iy, gz = czi + iz;
    const k = ((gx * 73856093) ^ (gy * 19349663) ^ (gz * 83492791)) | 0;
    for (let m = 0; m < 2; m++) {
      const hx = hash(k + m * 7, 311), hz = hash(k + m * 7, 313), hy = hash(k + m * 7, 315);
      const fall = (hy * RC + rainT * 9 * (0.85 + 0.3 * hash(k + m, 317))) % RC;
      const w = v3((gx + hx) * RC, (gy + 1) * RC - fall, (gz + hz) * RC);
      const p0 = P(w), p1 = P(v3(w.x - 0.25, w.y - 1.1, w.z));
      if (!p0.ok || !p1.ok || p0.z < 1.2) continue;
      if (p0.x < -40 || p0.x > 1120 || p0.y < -40 || p0.y > 1960) continue;
      const L = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      if (L < 3 || L > 140) continue;
      drops.push(`M${fmt(p0.x)},${fmt(p0.y)} L${fmt(p1.x)},${fmt(p1.y)}`);
    }
  }
  const skyTop = mix('#081320', '#3A4878', flash * 0.35), skyLow = mix('#2C5464', '#7088B0', flash * 0.3);
  return (
    <g>
      <defs>
        <linearGradient id="s3-sky" gradientUnits="userSpaceOnUse" x1="0" y1={fmt(hz - 1600)} x2="0" y2={fmt(hz)}>
          <stop offset="0" stopColor={skyTop} />
          <stop offset="0.7" stopColor={mix('#14293A', '#4C5E8C', flash * 0.3)} />
          <stop offset="1" stopColor={skyLow} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#s3-sky)" />
      {hz < 2100 && hz > -400 && (
        <g>
          {range(31, 150, mix('#223F4E', '#4A5E84', flash * 0.3), 1)}
          {range(37, 90, mix('#162A38', '#3A4C70', flash * 0.3), 1.6)}
        </g>
      )}
      <defs>
        <filter id="s3-cb" filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <g filter="url(#s3-cb)">
      {puffs.map(({p, r, lit, k, fog}) => {
        const base = mix(mix('#0F1924', '#1C2A3A', hash(k, 11)), mix('#26404E', '#56688F', flash * 0.3), fog * 0.85);
        const c = mix(base, '#AEB8F0', clamp(flash * lit * 1.3));
        const ry = r * 0.58;
        return (
          <g key={k}>
            <ellipse cx={fmt(p.x)} cy={fmt(p.y)} rx={fmt(r)} ry={fmt(ry)} fill={c} />
            <ellipse cx={fmt(p.x - r * 0.1)} cy={fmt(p.y + ry * 0.42)} rx={fmt(r * 0.7)} ry={fmt(ry * 0.36)} fill={mix(c, '#DDE3FF', 0.08 + 0.45 * flash * lit)} opacity={0.55} />
          </g>
        );
      })}
      </g>
      {ground && <Summit3D cam={cam} flash={flash} />}
      {rain > 0 && <path d={drops.join(' ')} stroke={mix('#8FA6BC', '#E2E8FF', flash * 0.6)} strokeOpacity={0.32 * rain} strokeWidth={2} strokeLinecap="round" fill="none" />}
    </g>
  );
};

/** the summit: a low-poly rock mesh on a polar grid round the tower (flat top for the tower, a ledge for the laser
 *  terrace on the -X side), facets flat-shaded from a cool storm light plus the discharge, thin ink edges */
const MESH = (() => {
  const R = [0, 14, 24, 38, 52, 70, 95, 130, 175, 230, 300];
  const NA = 40;
  const hAt = (r: number, a: number, i: number, j: number) => {
    if (r <= 14) return 0;
    let h = -Math.pow(r - 12, 1.12) * (0.5 + 0.28 * (0.5 + 0.5 * Math.sin(a * 3 + 1.3)) + 0.14 * Math.sin(a * 7)) - 9 * hash(i * 97 + j, 501) * (r > 20 ? 1 : 0);
    // the laser terrace: a level ledge at -19 m round the -X direction (angle near pi)
    const da = Math.abs(((a - Math.PI + 9.42) % 6.283) - 3.1416);
    if (r >= 30 && r <= 66 && da < 0.42) h = -19.2 - (r > 60 ? (r - 60) * 1.2 : 0);
    return h;
  };
  const pts: V3[][] = R.map((r, i) => Array.from({length: NA}, (_, j) => {
    const a = (j / NA) * 6.2832 + (i % 2) * (3.1416 / NA);
    const rr = r * (1 + 0.12 * (hash(i * 31 + j, 503) - 0.5) * (r > 30 ? 1 : 0));
    return v3(Math.cos(a) * rr, hAt(rr, a, i, j), Math.sin(a) * rr);
  }));
  const tris: [V3, V3, V3][] = [];
  for (let i = 0; i + 1 < R.length; i++) for (let j = 0; j < NA; j++) {
    const a = pts[i][j], b = pts[i][(j + 1) % NA], c = pts[i + 1][j], d = pts[i + 1][(j + 1) % NA];
    tris.push([a, c, d], [a, d, b]);
  }
  return tris;
})();
const LIGHT3 = norm3(v3(-0.4, 0.85, -0.35));
export const Summit3D: React.FC<{cam: Cam3; flash: number}> = ({cam, flash}) => {
  const P = projector(cam);
  const items: {z: number; d: string; c: string}[] = [];
  for (const [a, b, c] of MESH) {
    const pa = P(a), pb = P(b), pc = P(c);
    if (!pa.ok || !pb.ok || !pc.ok) continue;
    const xs = [pa.x, pb.x, pc.x], ys = [pa.y, pb.y, pc.y];
    if (Math.max(...xs) < -50 || Math.min(...xs) > 1130 || Math.max(...ys) < -50 || Math.min(...ys) > 1970) continue;
    const n = norm3(cross3(sub3(b, a), sub3(c, a)));
    const nn = n.y < 0 ? mul3(n, -1) : n;
    const lam = clamp(dot3(nn, LIGHT3) * 0.8 + 0.2);
    const up = clamp(nn.y);
    const base = mix('#121A21', '#46555E', lam * lam);
    const col = mix(base, '#A8B2E6', flash * 0.55 * up);
    items.push({z: (pa.z + pb.z + pc.z) / 3, d: `M${fmt(pa.x)},${fmt(pa.y)} L${fmt(pb.x)},${fmt(pb.y)} L${fmt(pc.x)},${fmt(pc.y)} Z`, c: col});
  }
  items.sort((p, q) => q.z - p.z);
  return (
    <g>
      {items.map((it, i) => <path key={i} d={it.d} fill={it.c} stroke={it.c} strokeWidth={1.2} strokeLinejoin="round" />)}
      {items.map((it, i) => (i % 3 === 0 ? <path key={`e${i}`} d={it.d} fill="none" stroke="#0B151C" strokeOpacity={0.22} strokeWidth={1.4} strokeLinejoin="round" /> : null))}
    </g>
  );
};

// ------------------------------------------------------------------ the tower
type Piece = {z: number; el: React.ReactNode};
export const Tower3D: React.FC<{cam: Cam3; flash: number; aviation: number; id: string}> = ({cam, flash, aviation, id}) => {
  const P = projector(cam);
  const iw = (z: number, k = 1) => clamp((cam.f * 0.16 * k) / Math.max(1, z), 0.7, 4.5);
  const pieces: Piece[] = [];
  const conc = mix('#8A97A0', '#D4DAF8', flash * 0.4), concD = mix('#4A5862', '#8890C0', flash * 0.35);
  const grad = (gid: string, pts: Pt[]) => {
    const xs = pts.map((q) => q.x);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    return (
      <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={fmt(x0)} y1="0" x2={fmt(x1)} y2="0">
        <stop offset="0" stopColor={concD} />
        <stop offset="0.35" stopColor={conc} />
        <stop offset="0.75" stopColor={mix(conc, concD, 0.55)} />
        <stop offset="1" stopColor={mix(concD, '#EEF0FF', flash * 0.8)} />
      </linearGradient>
    );
  };
  const cyl = (key: string, y0: number, y1: number, r0: number, r1: number, ring = false) => {
    const a = circle3(v3(0, y0, 0), r0).map(P), b = circle3(v3(0, y1, 0), r1).map(P);
    if (a.some((p) => !p.ok) || b.some((p) => !p.ok)) return;
    const h = hull([...a, ...b]);
    const zc = P(v3(0, (y0 + y1) / 2, 0)).z;
    const w = iw(zc);
    pieces.push({
      z: zc,
      el: (
        <g key={key}>
          <defs>{grad(`${id}-${key}`, h)}</defs>
          <path d={poly(h)} fill={`url(#${id}-${key})`} stroke={INK} strokeWidth={fmt(w)} strokeLinejoin="round" />
          {ring && <path d={poly(b)} fill="none" stroke={INK} strokeWidth={fmt(w * 0.8)} />}
          {ring && <path d={poly(a)} fill="none" stroke={INK} strokeOpacity={0.6} strokeWidth={fmt(w * 0.7)} />}
          {ring &&
            circle3(v3(0, y1, 0), r1, 16).map((q, i) => {
              const p0 = P(q), p1 = P(add3(q, v3(0, 1.1, 0)));
              return <line key={i} x1={fmt(p0.x)} y1={fmt(p0.y)} x2={fmt(p1.x)} y2={fmt(p1.y)} stroke={INK} strokeWidth={fmt(w * 0.6)} />;
            })}
          {ring && <path d={poly(circle3(v3(0, y1 + 1.1, 0), r1).map(P))} fill="none" stroke={INK} strokeWidth={fmt(w * 0.6)} />}
        </g>
      ),
    });
  };
  // plinth, shaft in three pieces (between the rings), rings
  cyl('pl', 0, TW.plinthTop, TW.plinthR, TW.plinthR * 0.95);
  const rAt = (y: number) => TW.shaftR0 + (TW.shaftR1 - TW.shaftR0) * ((y - TW.plinthTop) / (TW.shaftTop - TW.plinthTop));
  cyl('s1', TW.plinthTop, TW.ring1.y, TW.shaftR0, rAt(TW.ring1.y));
  cyl('s2', TW.ring1.y + TW.ring1.h, TW.ring2.y, rAt(TW.ring1.y + TW.ring1.h), rAt(TW.ring2.y));
  cyl('s3', TW.ring2.y + TW.ring2.h, TW.shaftTop, rAt(TW.ring2.y + TW.ring2.h), TW.shaftR1);
  cyl('r1', TW.ring1.y, TW.ring1.y + TW.ring1.h, TW.ring1.r, TW.ring1.r, true);
  cyl('r2', TW.ring2.y, TW.ring2.y + TW.ring2.h, TW.ring2.r, TW.ring2.r, true);
  // lattice mast: four legs, nine bays, aviation bands on the faces turned to the camera
  const mw = (y: number) => TW.mastW0 + (TW.mastW1 - TW.mastW0) * ((y - TW.shaftTop) / (TW.mastTop - TW.shaftTop));
  const corner = (y: number, i: number) => {
    const w = mw(y);
    const c = [[1, 1], [-1, 1], [-1, -1], [1, -1]][i];
    return v3(c[0] * w, y, c[1] * w);
  };
  for (let b = 0; b < TW.bays; b++) {
    const y0 = TW.shaftTop + ((TW.mastTop - TW.shaftTop) * b) / TW.bays, y1 = TW.shaftTop + ((TW.mastTop - TW.shaftTop) * (b + 1)) / TW.bays;
    for (let f = 0; f < 4; f++) {
      const a0 = corner(y0, f), a1 = corner(y0, (f + 1) % 4), b0 = corner(y1, f), b1 = corner(y1, (f + 1) % 4);
      const mid = v3((a0.x + a1.x + b0.x + b1.x) / 4, (y0 + y1) / 2, (a0.z + a1.z + b0.z + b1.z) / 4);
      const nrm = v3(mid.x, 0, mid.z);
      const toCam = sub3(cam.pos, mid);
      const front = nrm.x * toCam.x + nrm.z * toCam.z > 0;
      const pp = [a0, a1, b1, b0].map(P);
      if (pp.some((p) => !p.ok)) continue;
      const z = P(mid).z + (front ? -0.5 : 0.5);
      const w = iw(z, 0.7);
      const red = b % 2 === 0;
      const facing = clamp(0.5 + 0.5 * (nrm.x / (Math.hypot(nrm.x, nrm.z) || 1)));
      const col = red ? mix('#A8342D', '#FF8A80', flash * 0.4 * facing) : mix('#C9CED2', '#FFFFFF', flash * 0.5 * facing);
      pieces.push({
        z,
        el: (
          <g key={`m${b}-${f}`} opacity={front ? 1 : 0.55}>
            <path d={poly(pp)} fill={col} opacity={front ? 0.82 : 0.45} />
            <path d={`M${fmt(pp[0].x)},${fmt(pp[0].y)} L${fmt(pp[2].x)},${fmt(pp[2].y)} M${fmt(pp[1].x)},${fmt(pp[1].y)} L${fmt(pp[3].x)},${fmt(pp[3].y)} M${fmt(pp[3].x)},${fmt(pp[3].y)} L${fmt(pp[2].x)},${fmt(pp[2].y)}`} stroke={INK} strokeWidth={fmt(w)} fill="none" />
            <path d={`M${fmt(pp[0].x)},${fmt(pp[0].y)} L${fmt(pp[3].x)},${fmt(pp[3].y)} M${fmt(pp[1].x)},${fmt(pp[1].y)} L${fmt(pp[2].x)},${fmt(pp[2].y)}`} stroke={INK} strokeWidth={fmt(w * 1.6)} fill="none" />
          </g>
        ),
      });
    }
  }
  // mast cap, aviation light and the rod
  const capA = P(v3(0, TW.mastTop, 0)), rodT = P(v3(0, TW.rodTop, 0));
  if (capA.ok && rodT.ok) {
    const z = capA.z - 1;
    const w = iw(z);
    const rw = clamp((cam.f * 0.35) / Math.max(1, z), 1.2, 30);
    const av = P(v3(1.4, TW.mastTop + 0.6, 0));
    pieces.push({
      z,
      el: (
        <g key="rod">
          <path d={`M${fmt(capA.x - rw)},${fmt(capA.y)} L${fmt(rodT.x - rw * 0.15)},${fmt(rodT.y + rw * 1.5)} L${fmt(rodT.x)},${fmt(rodT.y)} L${fmt(rodT.x + rw * 0.15)},${fmt(rodT.y + rw * 1.5)} L${fmt(capA.x + rw)},${fmt(capA.y)} Z`} fill={mix('#9DA9B1', '#FFFFFF', flash * 0.8)} stroke={INK} strokeWidth={fmt(w * 0.8)} strokeLinejoin="round" />
          <circle cx={fmt(av.x)} cy={fmt(av.y)} r={fmt(clamp((cam.f * 0.45) / z, 1.5, 22))} fill="#FF4A3C" opacity={0.4 + 0.6 * aviation} />
          <circle cx={fmt(av.x)} cy={fmt(av.y)} r={fmt(clamp((cam.f * 1.6) / z, 4, 70))} fill="#FF4A3C" opacity={0.2 * aviation} />
        </g>
      ),
    });
  }
  pieces.sort((a, b) => b.z - a.z);
  return <g>{pieces.map((p) => p.el)}</g>;
};

// ------------------------------------------------------------------ the discharge, the beam, the channel
const partial = (pts: P3[], s: number) => {
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (pts[i].s <= s) out.push(pts[i]);
    else {
      if (i > 0) {
        const a = pts[i - 1], b = pts[i];
        const u = (s - a.s) / (b.s - a.s || 1);
        out.push(v3(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u));
      }
      break;
    }
  }
  return out;
};
/** a projected polyline as a stroke whose width follows its depth (thinner far away), split into short runs */
const strokeRuns = (P: (p: V3) => Proj, pts: V3[], wM: number, f: number, minW: number, maxW: number) => {
  const runs: {d: string; w: number}[] = [];
  const pp = pts.map(P);
  for (let i = 0; i + 1 < pp.length; i += 4) {
    const seg = pp.slice(i, Math.min(pp.length, i + 5)).filter((q) => q.ok);
    if (seg.length < 2) continue;
    const z = seg[Math.floor(seg.length / 2)].z;
    runs.push({d: line(seg), w: clamp((f * wM) / Math.max(z, 0.5), minW, maxW)});
  }
  return runs;
};

export const Discharge3D: React.FC<{cam: Cam3; s: number; core: number; id: string; branchK?: number; streamT?: number}> = ({cam, s, core, id, branchK = 1}) => {
  if (s <= 0) return null;
  const P = projector(cam);
  const c = clamp(core, 0, 1.8);
  const main = partial(BOLT3.pts, s);
  const brs = BOLT3.branches.map((b: Br3) => ({b, l: Math.min(b.len, (s - b.s0) * 0.6)})).filter((x) => x.l > 0).map((x) => partial(x.b.pts, x.l));
  // stalled streamers light briefly as the tip passes them, then fade (but stay faintly while the channel is hot)
  const sts = BOLT3.streamers
    .map((st) => {
      const age = (s - st.at) / 30; // metres of leader growth since it passed
      if (age <= 0) return null;
      const grow = clamp(age * 3);
      const fade = clamp(1.25 - age) * 0.8 + 0.2 * clamp(c - 0.9);
      return {pts: partial(st.pts, st.len * grow), a: fade};
    })
    .filter((x): x is {pts: V3[]; a: number} => !!x && x.a > 0.02);
  const f = cam.f;
  const draw = (pts: V3[], k: number, key: string, a = 1) => {
    const halo = strokeRuns(P, pts, 5 * k, f, 5, 70);
    const mid = strokeRuns(P, pts, 1.9 * k, f, 3, 26);
    const cor = strokeRuns(P, pts, 0.7 * k * (0.8 + 0.25 * c), f, 1.8, 11);
    return (
      <g key={key} opacity={a}>
        {halo.map((r, i) => <path key={`h${i}`} d={r.d} fill="none" stroke="#6C78FF" strokeOpacity={0.14 * c} strokeWidth={fmt(r.w)} strokeLinecap="round" strokeLinejoin="round" />)}
        {mid.map((r, i) => <path key={`m${i}`} d={r.d} fill="none" stroke="#B4C2FF" strokeOpacity={0.5 * Math.min(1, c)} strokeWidth={fmt(r.w)} strokeLinecap="round" strokeLinejoin="round" />)}
        {cor.map((r, i) => <path key={`c${i}`} d={r.d} fill="none" stroke="#FFFFFF" strokeOpacity={Math.min(1, 0.6 + 0.4 * c)} strokeWidth={fmt(r.w)} strokeLinecap="round" strokeLinejoin="round" />)}
      </g>
    );
  };
  const tip = main[main.length - 1];
  const tp = P(tip);
  const growing = s < BOLT3.total - 0.5;
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`${id}-tip`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.3" stopColor="#D2DAFF" stopOpacity={0.55} />
          <stop offset="1" stopColor="#7A84FF" stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}-bl`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={fmt(clamp(f / 60, 6, 26))} />
        </filter>
      </defs>
      {/* atmospheric glow: a blurred copy of the whole discharge */}
      <g filter={`url(#${id}-bl)`} opacity={0.32 * Math.min(1.2, c)}>
        {strokeRuns(P, main, 7, f, 8, 130).map((r, i) => <path key={i} d={r.d} fill="none" stroke="#8C96FF" strokeWidth={fmt(r.w)} strokeLinecap="round" />)}
      </g>
      {sts.map((st, i) => draw(st.pts, 0.45, `s${i}`, st.a))}
      {brs.map((b, i) => draw(b, 0.6 * branchK, `b${i}`))}
      {draw(main, 1, 'm')}
      {growing && tp.ok && <circle cx={fmt(tp.x)} cy={fmt(tp.y)} r={fmt(clamp((f * 4.5) / tp.z, 12, 80))} fill={`url(#${id}-tip)`} />}
    </g>
  );
};

/** the infrared beam as a thin cyan/teal explanatory line with brighter cyan packets, and the air it has prepared as a
 *  restrained warm haze along the same axis (from the tower tip up to channelTop) */
export const Beam3D: React.FC<{cam: Cam3; alpha: number; pulses?: number[]; channel: number; channelTop?: number; id: string; hTop?: number}> = ({cam, alpha, pulses = [], channel, channelTop = G + 60, id, hTop = G + 700}) => {
  const P = projector(cam);
  const a = P(EXIT3), b = P(axis3(hTop));
  const f = cam.f;
  const pts: V3[] = Array.from({length: 96}, (_, i) => axis3(-880 + ((hTop + 880) * i) / 95));
  const beamGlow = strokeRuns(P, pts, 0.7, f, 3, 16);
  const beamRuns = strokeRuns(P, pts, 0.16, f, 1.6, 5);
  // the prepared air as one continuous ribbon (width follows depth), so it never beads where stroke runs overlap
  const ch: V3[] = Array.from({length: 40}, (_, i) => axis3(-6 + ((channelTop + 6) * i) / 39));
  const chP = ch.map(P).filter((q) => q.ok);
  const ribbon = (() => {
    if (chP.length < 2) return '';
    const L: Pt[] = [], R: Pt[] = [];
    chP.forEach((q, i) => {
      const a = chP[Math.max(0, i - 1)], b = chP[Math.min(chP.length - 1, i + 1)];
      const dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1;
      const w = clamp((f * 3.0) / Math.max(q.z, 0.5), 6, 260) / 2;
      L.push({x: q.x - (dy / n) * w, y: q.y + (dx / n) * w});
      R.push({x: q.x + (dy / n) * w, y: q.y - (dx / n) * w});
    });
    return poly([...L, ...R.reverse()]);
  })();
  return (
    <g>
      {channel > 0 && (
        <g style={{mixBlendMode: 'screen'}}>
          <defs>
            <filter id={`${id}-cb`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
              <feGaussianBlur stdDeviation={fmt(clamp(f / 70, 5, 22))} />
            </filter>
          </defs>
          <path d={ribbon} fill={PAL.channel} fillOpacity={0.2 * channel} filter={`url(#${id}-cb)`} />
        </g>
      )}
      {alpha > 0 && (a.ok || b.ok) && (
        <g style={{mixBlendMode: 'screen'}}>
          {beamGlow.map((r, i) => <path key={`g${i}`} d={r.d} fill="none" stroke={PAL.laserGlow} strokeOpacity={alpha * 0.22} strokeWidth={fmt(r.w)} strokeLinecap="round" />)}
          {beamRuns.map((r, i) => <path key={i} d={r.d} fill="none" stroke={PAL.laser} strokeOpacity={alpha * 0.9} strokeWidth={fmt(r.w)} strokeLinecap="round" />)}
        </g>
      )}
      {pulses.map((h, i) => {
        if (h < -880 || h > hTop) return null;
        const p0 = P(axis3(Math.max(-880, h - 26))), p1 = P(axis3(h));
        if (!p0.ok || !p1.ok) return null;
        const w = clamp((f * 1.4) / p1.z, 3, 12);
        // packets passing close to the lens would smear into huge capsules: fade those out
        const near = clamp(1 - (Math.hypot(p1.x - p0.x, p1.y - p0.y) - 110) / 120);
        if (near <= 0.02) return null;
        return (
          <g key={`p${i}`} opacity={alpha * near} style={{mixBlendMode: 'screen'}}>
            <line x1={fmt(p0.x)} y1={fmt(p0.y)} x2={fmt(p1.x)} y2={fmt(p1.y)} stroke={PAL.laserGlow} strokeOpacity={0.45} strokeWidth={fmt(w * 2.4)} strokeLinecap="round" />
            <line x1={fmt(p0.x)} y1={fmt(p0.y)} x2={fmt(p1.x)} y2={fmt(p1.y)} stroke={PAL.packet} strokeWidth={fmt(w * 0.7)} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};

/** the light the discharge throws on things: a screen-blended wash centred on the bolt (for scene-wide coherence) */
export const FlashWash: React.FC<{cam: Cam3; at: V3; flash: number; id: string}> = ({cam, at, flash, id}) => {
  if (flash <= 0.01) return null;
  const p = projector(cam)(at);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`${id}-fw`} gradientUnits="userSpaceOnUse" cx={fmt(p.x)} cy={fmt(p.y)} r={1500}>
          <stop offset="0" stopColor="#B9C4FF" stopOpacity={0.35 * flash} />
          <stop offset="1" stopColor="#5A68B0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${id}-fw)`} />
    </g>
  );
};
// ------------------------------------------------------------------ the launch telescope, its enclosure, the terrace
const box = (P: (p: V3) => Proj, a: V3, b: V3) => {
  const cs = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => P(v3(i & 1 ? b.x : a.x, i & 2 ? b.y : a.y, i & 4 ? b.z : a.z)));
  return cs;
};
export const TEL_L = 4.6, TEL_R = 0.72;
export const Apparatus3D: React.FC<{cam: Cam3; flash: number; fire: number; id: string}> = ({cam, flash, fire, id}) => {
  const P = projector(cam);
  const iw = (z: number) => clamp((cam.f * 0.03) / Math.max(0.5, z), 0.8, 5);
  const bot = sub3(EXIT3, v3(0.309 * TEL_L, 0.951 * TEL_L, 0));
  // terrace slab
  const slab = [v3(-62, -19.2, -9), v3(-36, -19.2, -9), v3(-36, -19.2, 9), v3(-62, -19.2, 9)].map(P);
  // enclosure box, frame legs
  const enc = box(P, v3(-57.5, -18.6, -1.3), v3(-48.6, -16.4, 1.3));
  const encH = hull(enc.filter((q) => q.ok));
  const zEnc = P(v3(-53, -17.5, 0)).z;
  // telescope tube as a hull of its two end circles (perpendicular to the beam)
  const ring = (c: V3, r: number) => Array.from({length: 24}, (_, i) => {
    const a = (i / 24) * 6.2832;
    const n1 = v3(0.95, -0.31, 0), n2 = v3(0, 0, 1);
    return P(add3(c, add3(v3(n1.x * r * Math.cos(a), n1.y * r * Math.cos(a), 0), v3(0, 0, n2.z * r * Math.sin(a)))));
  });
  const rb = ring(bot, TEL_R), rt = ring(EXIT3, TEL_R * 1.08);
  const tube = hull([...rb, ...rt].filter((q) => q.ok));
  const zTel = P(lerp3(bot, EXIT3, 0.5)).z;
  const pedestal = box(P, v3(bot.x - 0.5, -19.2, -0.6), v3(bot.x + 0.6, bot.y + 0.3, 0.6));
  const ok = rt.every((q) => q.ok);
  const winC = P(EXIT3);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-win`}>
          <stop offset="0" stopColor={PAL.packet} stopOpacity={0.95 * fire} />
          <stop offset="0.4" stopColor={PAL.laser} stopOpacity={0.5 * fire} />
          <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
        </radialGradient>
      </defs>
      {slab.every((q) => q.ok) && <path d={poly(slab)} fill={mix('#4C5A62', '#8A94C0', flash * 0.4)} stroke={INK} strokeWidth={2.5} />}
      {encH.length > 2 && zEnc > 0 && (
        <g>
          <path d={poly(encH)} fill={mix('#C3CBD0', '#EEF0FF', flash * 0.5)} stroke={INK} strokeWidth={fmt(iw(zEnc))} strokeLinejoin="round" />
          {[0.25, 0.5, 0.75].map((u) => {
            const a = P(v3(-57.5 + 8.9 * u, -18.6, -1.3)), b = P(v3(-57.5 + 8.9 * u, -16.4, -1.3));
            return a.ok && b.ok ? <line key={u} x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} stroke={INK} strokeOpacity={0.35} strokeWidth={fmt(iw(zEnc) * 0.7)} /> : null;
          })}
          {(() => {
            const a = P(v3(-57.5, -18.0, -1.31)), b = P(v3(-48.6, -18.0, -1.31)), c = P(v3(-48.6, -17.8, -1.31)), d = P(v3(-57.5, -17.8, -1.31));
            return [a, b, c, d].every((q) => q.ok) ? <path d={poly([a, b, c, d])} fill="#E2B33C" /> : null;
          })()}
          {(() => {
            const l = P(v3(-49.2, -16.8, -1.32));
            return l.ok ? <circle cx={fmt(l.x)} cy={fmt(l.y)} r={fmt(clamp((cam.f * 0.06) / l.z, 1.5, 14))} fill={fire > 0.05 ? '#5BF08A' : '#2E5A3C'} /> : null;
          })()}
        </g>
      )}
      {pedestal.every((q) => q.ok) && <path d={poly(hull(pedestal))} fill={mix('#56646E', '#9AA4D0', flash * 0.4)} stroke={INK} strokeWidth={fmt(iw(zTel))} />}
      {ok && tube.length > 2 && (
        <g>
          <defs>
            <linearGradient id={`${id}-tb`} gradientUnits="userSpaceOnUse" x1={fmt(Math.min(...tube.map((q) => q.x)))} y1="0" x2={fmt(Math.max(...tube.map((q) => q.x)))} y2="0">
              <stop offset="0" stopColor={mix('#7E8B94', '#AEB6E0', flash * 0.5)} />
              <stop offset="0.4" stopColor={mix('#C2CBD1', '#F0F2FF', flash * 0.4)} />
              <stop offset="1" stopColor={mix('#6E7A82', '#C8CEF4', flash * 0.6)} />
            </linearGradient>
          </defs>
          <path d={poly(tube)} fill={`url(#${id}-tb)`} stroke={INK} strokeWidth={fmt(iw(zTel))} strokeLinejoin="round" />
          {[0.25, 0.7].map((u) => <path key={u} d={line(ring(lerp3(bot, EXIT3, u), TEL_R * 1.01).filter((q) => q.ok))} fill="none" stroke="#2E3A42" strokeWidth={fmt(iw(zTel) * 3)} />)}
          <path d={poly(rt)} fill="#1A2440" stroke={INK} strokeWidth={fmt(iw(zTel))} />
          <path d={poly(ring(EXIT3, TEL_R * 0.7))} fill="#3D4F86" opacity={0.85} />
          {fire > 0 && winC.ok && <circle cx={fmt(winC.x)} cy={fmt(winC.y)} r={fmt(clamp((cam.f * 1.2) / winC.z, 8, 300))} fill={`url(#${id}-win)`} style={{mixBlendMode: 'screen'}} />}
        </g>
      )}
    </g>
  );
};
export {EXIT3};
