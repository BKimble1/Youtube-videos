// V3 (copied from v2/Scene3D.tsx, V2 keeps its own): the experiment seen through a perspective camera (p3.ts). V3 colour
// language: the laser path is a thin cyan/teal line with cyan packets; the air it prepares is a restrained warm haze;
// the discharge is white with violet edges, its glow held back so the core and branches stay legible.
// Flat fills with ink contours and gradient shading, as
// in the 2D art; positions come from the 3D model so views agree. Pieces are painter-sorted (far first), so platform
// rings hide the shaft and mast behind them from below.
// Scenery (V3 scenery pass): the storm sky, layered clouds and ranges live in Scene3_sky.tsx, the summit rock in
// Scene3_ground.tsx. The discharge is a local light (Scene3_light.ts): it lights the cloud undersides near the bolt,
// the tower's facing side and top surfaces, the nearby rock and rain, falling off with distance; FlashWash only adds
// a small, restrained bloom round the bolt top and never reaches the caption band.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash} from '../dc/math';
import {add3, axis3, BOLT3, Br3, Cam3, dot3, EXIT3, lerp3, mul3, norm3, P3, projector, Proj, sub3, TW, v3, V3} from '../v2/p3';
import {PAL} from './palette';
import {G} from '../world/site';
import {boltSamples, lightAt, LOW_BOLT, sOfTop} from './Scene3_light';
import {Clouds, LOOP, Ranges, segDist, SkyGrad} from './Scene3_sky';
import {PLAT_R, PLAT_Y, Summit3D} from './Scene3_ground';

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
/** a stable id for one camera/light state (Sky3D has no id prop; several views can share a document) */
const camId = (cam: Cam3, flash: number) => `s3${Math.round(Math.abs(cam.pos.x * 131.7 + cam.pos.y * 71.3 + cam.pos.z * 37.1 + cam.yaw * 13.3 + cam.pitch * 7.7 + cam.f * 0.37 + (cam.cx ?? 0) * 0.11 + (cam.cy ?? 0) * 0.07 + flash * 977) * 100) % 1e9}`;
export const Sky3D: React.FC<{cam: Cam3; flash: number; boltTop?: V3; drift: number; rainT: number; rain?: number; ground?: boolean}> = ({cam, flash, boltTop, drift, rainT, rain = 1, ground = true}) => {
  const P = projector(cam);
  const uid = camId(cam, flash);
  const s = boltTop ? sOfTop(boltTop) : 0;
  const pts = s > 0 ? boltSamples(s) : [];
  // rain: drops in a volume round the camera (world-fixed cells, falling at ~9 m/s), each drawn as its projected fall
  // streak, so every streak points along the projected vertical and density follows perspective naturally. Drops
  // near the discharge catch its light; drops over the caption band and right on the beam are held back.
  const bA = P(EXIT3), bB = P(axis3(1000));
  const beamOk = bA.ok && bB.ok;
  const drops: string[][] = [[], [], [], [], [], []]; // unlit by quiet level 0..2, then lit by quiet level 0..2
  const RC = 9; // cell size (m)
  const cxi = Math.floor(cam.pos.x / RC), cyi = Math.floor(cam.pos.y / RC), czi = Math.floor(cam.pos.z / RC);
  if (rain > 0) {
    for (let ix = -5; ix <= 5; ix++) for (let iy = -4; iy <= 5; iy++) for (let iz = -5; iz <= 5; iz++) {
      const gx = cxi + ix, gy = cyi + iy, gz = czi + iz;
      const k = ((gx * 73856093) ^ (gy * 19349663) ^ (gz * 83492791)) | 0;
      for (let m = 0; m < 2; m++) {
        const hx = hash(k + m * 7, 311), hzz = hash(k + m * 7, 313), hy = hash(k + m * 7, 315);
        // fall speeds are whole cells per loop (n / LOOP, n = 28..38), so the rain is continuous both across the seam
        // and where the loop clock steps by a whole loop at mid-film
        const sp = (28 + Math.floor(hash(k + m, 317) * 11)) / LOOP;
        const fall = (hy * RC + rainT * 9 * sp) % RC;
        const w = v3((gx + hx) * RC, (gy + 1) * RC - fall, (gz + hzz) * RC);
        const p0 = P(w), p1 = P(v3(w.x - 0.25, w.y - 1.1, w.z));
        if (!p0.ok || !p1.ok || p0.z < 1.2) continue;
        if (p0.x < -40 || p0.x > 1120 || p0.y < -40 || p0.y > 1960) continue;
        const L = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        if (L < 6 || L > 140) continue; // end-on drops (specks) and smears right at the lens are left out
        const my = (p0.y + p1.y) / 2;
        // 0: normal, 1: at the edge of the caption band, 2: in the band or right on the beam
        const band = my > 1530 && my < 1790 ? 2 : my > 1470 && my < 1850 ? 1 : 0;
        const quiet = beamOk && segDist({x: (p0.x + p1.x) / 2, y: my}, bA, bB) < 30 ? 2 : band;
        const lit = pts.length > 0 && flash > 0.15 && lightAt(w, pts, 45) * flash > 0.18;
        drops[(lit ? 3 : 0) + quiet].push(`M${fmt(p0.x)},${fmt(p0.y)} L${fmt(p1.x)},${fmt(p1.y)}`);
      }
    }
  }
  const rainC = mix('#8FA6BC', '#C8D2F0', flash * 0.3);
  const rainOp = [0.27, 0.18, 0.11, 0.4, 0.27, 0.16];
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-cap`} gradientUnits="userSpaceOnUse" x1="0" y1="1530" x2="0" y2="1830">
          <stop offset="0" stopColor="#0D1822" stopOpacity={0} />
          <stop offset="0.25" stopColor="#0D1822" stopOpacity={0.26} />
          <stop offset="0.75" stopColor="#0D1822" stopOpacity={0.26} />
          <stop offset="1" stopColor="#0D1822" stopOpacity={0} />
        </linearGradient>
      </defs>
      <SkyGrad cam={cam} flash={flash} id={`${uid}-sky`} />
      <Clouds cam={cam} P={P} flash={flash} s={s} boltTop={boltTop} drift={drift} id={uid} />
      <Ranges cam={cam} P={P} flash={flash} />
      {/* the far background behind the caption band (y about 1560-1760) is held a little darker and flatter */}
      <rect x={-20} y={1530} width={1120} height={300} fill={`url(#${uid}-cap)`} />
      {ground && <Summit3D cam={cam} flash={flash} />}
      {rain > 0 && (
        <g fill="none" strokeLinecap="round" strokeWidth={2}>
          {drops.map((d, i) => (d.length > 0 ? <path key={i} d={d.join(' ')} stroke={i < 3 ? rainC : '#E2E7FF'} strokeOpacity={rainOp[i] * rain} /> : null))}
        </g>
      )}
    </g>
  );
};
export {Summit3D};

// ------------------------------------------------------------------ the tower
type Piece = {z: number; el: React.ReactNode};
const KEY_H = norm3(v3(-0.4, 0, -0.35)); // the storm key light's horizontal direction (the rock uses the same key)
const LIT = '#E2E7FF';
export const Tower3D: React.FC<{cam: Cam3; flash: number; aviation: number; id: string}> = ({cam, flash, aviation, id}) => {
  const P = projector(cam);
  const iw = (z: number, k = 1) => clamp((cam.f * 0.16 * k) / Math.max(1, z), 0.7, 4.5);
  const pieces: Piece[] = [];
  /** the discharge's light on a tower part: strongest at the mast head, falling off down the tower */
  const boltK = (c: V3) => flash * lightAt(c, LOW_BOLT, 72);
  const toBoltH = (c: V3) => norm3(v3(LOW_BOLT[1].x - c.x, 0, LOW_BOLT[1].z - c.z));
  /** a vertical cylinder's shading across its screen width: the storm key from the -X/-Z side, plus the discharge
   *  on the side turned toward the bolt (+X) */
  const shade = (c: V3, dark: string, light: string) => {
    const vh = norm3(v3(c.x - cam.pos.x, 0, c.z - cam.pos.z));
    let rh = v3(vh.z, 0, -vh.x);
    if (P(add3(c, rh)).x < P(c).x) rh = mul3(rh, -1);
    const kB = boltK(c), bh = toBoltH(c);
    return [0, 0.16, 0.38, 0.62, 0.84, 1].map((u) => {
      const sn = clamp(2 * u - 1, -0.995, 0.995), cs = Math.sqrt(1 - sn * sn);
      const n = add3(mul3(vh, -cs), mul3(rh, sn));
      const key = clamp(dot3(n, KEY_H));
      const fb = clamp(0.3 + 0.7 * dot3(n, bh));
      return {u, c: mix(mix(dark, light, 0.16 + 0.84 * key), LIT, clamp(kB * fb * 0.9))};
    });
  };
  type CylOpt = {ring?: boolean; cap?: string; dark?: string; light?: string; z?: number; n?: number; joints?: boolean; seat?: number};
  // the face of a vertical (tapered) cylinder turned to the camera: each rim's arc between the tangent points seen
  // from the camera's horizontal position, joined into a band
  const Dh = Math.hypot(cam.pos.x, cam.pos.z), phi = Math.atan2(cam.pos.z, cam.pos.x);
  const frontArc = (y: number, r: number, m: number) => {
    const al = Math.acos(clamp(r / Dh, -1, 1));
    return Array.from({length: m + 1}, (_, i) => {
      const an = phi - al + (2 * al * i) / m;
      return P(v3(r * Math.cos(an), y, r * Math.sin(an)));
    });
  };
  const cyl = (key: string, y0: number, y1: number, r0: number, r1: number, o: CylOpt = {}) => {
    const n = o.n ?? 28;
    const a = circle3(v3(0, y0, 0), r0, n).map(P), b = circle3(v3(0, y1, 0), r1, n).map(P);
    if (a.some((p) => !p.ok) || b.some((p) => !p.ok)) return;
    // from below its foot, a part standing on something (everything but the overhanging rings) shows only its face:
    // the hull of both rims would also show the underside, which is buried in the rock or the part beneath
    const faceOnly = !o.ring && cam.pos.y < y0 && Dh > Math.max(r0, r1) * 1.02;
    const h = faceOnly ? [...frontArc(y0, r0, 24), ...frontArc(y1, r1, 24).reverse()] : hull([...a, ...b]);
    const c = v3(0, (y0 + y1) / 2, 0);
    const zc = P(c).z;
    const w = iw(zc);
    const xs = h.map((q) => q.x);
    const st = shade(c, o.dark ?? '#46545E', o.light ?? '#9AA6AE');
    const capVis = !!o.cap && cam.pos.y > y1 + 0.05;
    const capCol = o.cap ? mix(o.cap, LIT, clamp(boltK(v3(0, y1, 0)) * 1.15)) : '';
    // block joints on the face turned to the camera (the retaining wall)
    const joints: string[] = [];
    if (o.joints) {
      for (let i = 0; i < 36; i++) {
        const an = (i / 36) * 6.2832 + 0.05;
        const q0 = v3(r0 * Math.cos(an), y0, r0 * Math.sin(an));
        if (dot3(v3(Math.cos(an), 0, Math.sin(an)), sub3(cam.pos, q0)) <= 0) continue;
        const p0 = P(q0), p1 = P(v3(q0.x, y1, q0.z)), pm = P(v3(q0.x, (y0 + y1) / 2, q0.z));
        const q1 = v3(r0 * Math.cos(an + 6.2832 / 36), (y0 + y1) / 2, r0 * Math.sin(an + 6.2832 / 36));
        const pn = P(q1);
        if (!p0.ok || !p1.ok || !pm.ok || !pn.ok) continue;
        // alternate the vertical joints between the two courses, and run the course line along the face
        joints.push(i % 2 ? `M${fmt(pm.x)},${fmt(pm.y)} L${fmt(p1.x)},${fmt(p1.y)}` : `M${fmt(p0.x)},${fmt(p0.y)} L${fmt(pm.x)},${fmt(pm.y)}`);
        joints.push(`M${fmt(pm.x)},${fmt(pm.y)} L${fmt(pn.x)},${fmt(pn.y)}`);
      }
    }
    const seat = o.seat ? circle3(v3(0, y1 + 0.02, 0), o.seat, n).map(P) : null;
    pieces.push({
      z: o.z ?? zc,
      el: (
        <g key={key}>
          <defs>
            <linearGradient id={`${id}-${key}`} gradientUnits="userSpaceOnUse" x1={fmt(Math.min(...xs))} y1="0" x2={fmt(Math.max(...xs))} y2="0">
              {st.map((s) => <stop key={s.u} offset={s.u} stopColor={s.c} />)}
            </linearGradient>
          </defs>
          <path d={poly(h)} fill={`url(#${id}-${key})`} stroke={INK} strokeWidth={fmt(w)} strokeLinejoin="round" />
          {capVis && <path d={poly(b)} fill={capCol} stroke={INK} strokeWidth={fmt(w * 0.8)} strokeLinejoin="round" />}
          {joints.length > 0 && <path d={joints.join(' ')} fill="none" stroke={INK} strokeOpacity={0.32} strokeWidth={fmt(w * 0.55)} />}
          {seat && capVis && seat.every((q) => q.ok) && <path d={poly(seat)} fill="#141C22" fillOpacity={0.45} />}
          {o.ring && !capVis && <path d={poly(b)} fill="none" stroke={INK} strokeWidth={fmt(w * 0.8)} />}
          {o.ring && <path d={poly(a)} fill="none" stroke={INK} strokeOpacity={0.6} strokeWidth={fmt(w * 0.7)} />}
          {o.ring &&
            circle3(v3(0, y1, 0), r1, 16).map((q, i) => {
              const p0 = P(q), p1 = P(add3(q, v3(0, 1.1, 0)));
              return <line key={i} x1={fmt(p0.x)} y1={fmt(p0.y)} x2={fmt(p1.x)} y2={fmt(p1.y)} stroke={INK} strokeWidth={fmt(w * 0.6)} />;
            })}
          {o.ring && <path d={poly(circle3(v3(0, y1 + 1.1, 0), r1).map(P))} fill="none" stroke={INK} strokeWidth={fmt(w * 0.6)} />}
        </g>
      ),
    });
  };
  // footing: a stone retaining wall round the summit platform (it seats the tower on the rock), its paving, and a
  // concrete apron step under the plinth. From below the summit top the wall is in front of the plinth's foot.
  const zPl = P(v3(0, TW.plinthTop / 2, 0)).z;
  const above = cam.pos.y > 0.45;
  const WALL_TOP = 0.35, APRON_TOP = 0.85;
  // seen from below the platform (the terrace), the wall's foot runs further into the rock lip so its face also hides
  // the plinth's foot at the sides (the rock is drawn before the tower, so it cannot hide tower parts itself); the
  // extension grows smoothly as the camera drops below the platform, so a crane past it never pops
  const foot = PLAT_Y - 0.4 - 1.2 * clamp((0.45 - cam.pos.y) / 10);
  cyl('fw', foot, WALL_TOP, PLAT_R - 0.3, PLAT_R - 0.3, {cap: '#56626A', dark: '#283238', light: '#66727A', n: 44, joints: true, z: above ? zPl + 6 : zPl - 0.05});
  cyl('fa', WALL_TOP, APRON_TOP, TW.plinthR + 2.4, TW.plinthR + 2.2, {cap: '#7E8A92', dark: '#3E4A52', light: '#8C98A0', n: 36, z: zPl + 5, seat: TW.plinthR + 0.7});
  // plinth, shaft in three pieces (between the rings), rings
  cyl('pl', 0, TW.plinthTop, TW.plinthR, TW.plinthR * 0.95, {cap: '#808C94'});
  const rAt = (y: number) => TW.shaftR0 + (TW.shaftR1 - TW.shaftR0) * ((y - TW.plinthTop) / (TW.shaftTop - TW.plinthTop));
  cyl('s1', TW.plinthTop, TW.ring1.y, TW.shaftR0, rAt(TW.ring1.y));
  cyl('s2', TW.ring1.y + TW.ring1.h, TW.ring2.y, rAt(TW.ring1.y + TW.ring1.h), rAt(TW.ring2.y));
  cyl('s3', TW.ring2.y + TW.ring2.h, TW.shaftTop, rAt(TW.ring2.y + TW.ring2.h), TW.shaftR1);
  cyl('r1', TW.ring1.y, TW.ring1.y + TW.ring1.h, TW.ring1.r, TW.ring1.r, {ring: true, cap: '#8A969E'});
  cyl('r2', TW.ring2.y, TW.ring2.y + TW.ring2.h, TW.ring2.r, TW.ring2.r, {ring: true, cap: '#8A969E'});
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
      // the faces turned toward the bolt catch its light, most strongly at the mast head
      const facing = clamp(0.3 + 0.7 * dot3(norm3(nrm), toBoltH(mid)));
      const kB = boltK(mid) * facing;
      const col = red ? mix('#A8342D', '#FFA49A', kB * 0.95) : mix('#C9CED2', '#FFFFFF', kB);
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
          <path d={`M${fmt(capA.x - rw)},${fmt(capA.y)} L${fmt(rodT.x - rw * 0.15)},${fmt(rodT.y + rw * 1.5)} L${fmt(rodT.x)},${fmt(rodT.y)} L${fmt(rodT.x + rw * 0.15)},${fmt(rodT.y + rw * 1.5)} L${fmt(capA.x + rw)},${fmt(capA.y)} Z`} fill={mix('#9DA9B1', '#FFFFFF', flash * 0.85)} stroke={INK} strokeWidth={fmt(w * 0.8)} strokeLinejoin="round" />
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

/** the air glow round the discharge: a small, restrained screen-blended bloom centred on the bolt top (the local light
 *  on clouds, tower, rock and rain is done in those pieces). Its size follows the bolt's distance, its peak stays low
 *  so the white core keeps its edge, and it is masked out of the caption band (y about 1560-1760). */
export const FlashWash: React.FC<{cam: Cam3; at: V3; flash: number; id: string}> = ({cam, at, flash, id}) => {
  if (flash <= 0.02) return null;
  const p = projector(cam)(at);
  if (!p.ok) return null;
  const r = clamp((cam.f * 150) / p.z, 260, 1000);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`${id}-fw`} gradientUnits="userSpaceOnUse" cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(r)}>
          <stop offset="0" stopColor="#B4BEFF" stopOpacity={0.2 * flash} />
          <stop offset="0.4" stopColor="#8F9AE6" stopOpacity={0.09 * flash} />
          <stop offset="1" stopColor="#5A68B0" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-fm`} gradientUnits="userSpaceOnUse" x1="0" y1="1300" x2="0" y2="1540">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>
        <mask id={`${id}-fk`} maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
          <rect x={0} y={0} width={1080} height={1920} fill={`url(#${id}-fm)`} />
        </mask>
      </defs>
      <circle cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(r)} fill={`url(#${id}-fw)`} mask={`url(#${id}-fk)`} />
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
