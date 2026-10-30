// V1 additions on the same bench: a clear acrylic stage beside the coil pad, a second flat induction coil inside it, a
// transparent stomach-shaped experimental model (a clear shell with an esophagus tube) lying on the stage, and the
// small ball trapped inside it.
import React from 'react';
import {INK, Inked} from '../shared/ink';
import {Cam, ellipsoid, poly, project, SP, V3, v3} from './cam';
import {boxFaces, ZT} from './props';
import {Sphere, SoftShadow} from './shade';
import {COIL2, MODEL_O, STAGE, TUBE} from './timeline';

// ---------------------------------------------------------------- acrylic stage + its coil
export const Stage: React.FC<{c: Cam; ink: number; t: number; power: number}> = ({c, ink, t, power}) => {
  const faces = boxFaces(c, v3(STAGE.x0, STAGE.y0, 0), v3(STAGE.x1, STAGE.y1, ZT), {top: '#BFE6EA', nx: '#8CC6CF', px: '#6FAAB4', ny: '#9FD3DA', py: '#7DB7C0'});
  const a = project(c, v3(STAGE.x0, STAGE.y0, 0)), b = project(c, v3(STAGE.x1, STAGE.y1, 0));
  return (
    <g>
      <SoftShadow id="stg-sh" c={{x: (a.x + b.x) / 2 + 20, y: (a.y + b.y) / 2 + 20}} rx={Math.abs(b.x - a.x) * 0.62} ry={Math.abs(b.y - a.y) * 0.6} alpha={0.22} color="#071417" />
      <Coil c={c} ctr={COIL2} rH={1.6} rS={1.3} t={t} power={power} ink={ink} id="c2" />
      {faces.map((f, i) => (
        <path key={i} d={f.d} fill={f.col} fillOpacity={f.top ? 0.16 : 0.07} stroke="#E4F7F9" strokeOpacity={0.55} strokeWidth={Math.max(1, ink * 0.3)} strokeLinejoin="round" />
      ))}
      {faces.map((f, i) => (
        <path key={`i${i}`} d={f.d} fill="none" stroke={INK} strokeOpacity={0.55} strokeWidth={Math.max(1, ink * 0.22)} strokeLinejoin="round" />
      ))}
    </g>
  );
};

/** a flat pancake coil seen through a clear top (the same hardware as the pad's) */
export const Coil: React.FC<{c: Cam; ctr: V3; rH: number; rS: number; t: number; power: number; ink: number; id: string}> = ({c, ctr, rH, rS, t, power, ink, id}) => {
  const disc = poly(Array.from({length: 73}, (_, i) => project(c, v3(ctr.x + rH * Math.cos((i / 72) * 2 * Math.PI), ctr.y + rH * Math.sin((i / 72) * 2 * Math.PI), ctr.z - 0.08))));
  const turns = 7, n = turns * 60;
  const sp: SP[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * turns * 2 * Math.PI;
    const r = 0.3 + (rS - 0.3) * (i / n);
    sp.push(project(c, v3(ctr.x + r * Math.cos(a + 0.6), ctr.y + r * Math.sin(a + 0.6), ctr.z - 0.06)));
  }
  const spD = poly(sp, false);
  const k = project(c, ctr).k;
  const wire = 0.11 * k;
  const p0 = project(c, v3(ctr.x - rH, ctr.y - rH, ctr.z)), p1 = project(c, v3(ctr.x + rH, ctr.y + rH, ctr.z));
  const led = project(c, v3(ctr.x + rH * 0.93 * Math.cos(-2.2), ctr.y + rH * 0.93 * Math.sin(-2.2), ctr.z));
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-cu`} gradientUnits="userSpaceOnUse" x1={p0.x.toFixed(0)} y1={p1.y.toFixed(0)} x2={p1.x.toFixed(0)} y2={p0.y.toFixed(0)}>
          <stop offset="0" stopColor="#C98A5A" />
          <stop offset="0.5" stopColor="#9A5C34" />
          <stop offset="1" stopColor="#5E3420" />
        </linearGradient>
        <clipPath id={`${id}-cl`}>
          <path d={disc} />
        </clipPath>
      </defs>
      <path d={disc} fill="#1A242A" stroke={INK} strokeWidth={ink * 0.5} />
      <g clipPath={`url(#${id}-cl)`}>
        <path d={spD} fill="none" stroke="#1A1410" strokeWidth={wire * 1.18} strokeLinecap="round" />
        <path d={spD} fill="none" stroke={`url(#${id}-cu)`} strokeWidth={wire} strokeLinecap="round" />
        <path d={spD} fill="none" stroke="#FFE2BC" strokeWidth={wire * 0.22} strokeLinecap="round" opacity={0.3} transform={`translate(${(-wire * 0.18).toFixed(1)} ${(-wire * 0.22).toFixed(1)})`} />
        {power > 0.01 && (
          <path d={spD} fill="none" stroke="#FFE6C4" strokeWidth={wire * 0.5} strokeLinecap="round" strokeDasharray={`${(k * 0.18).toFixed(1)} ${(k * 0.9).toFixed(1)}`}
            strokeDashoffset={(-t * k * 3.2).toFixed(1)} opacity={power * (0.22 + 0.1 * Math.sin(t * 2 * Math.PI * 2.3))} />
        )}
        <path d={disc} fill="#0E171C" opacity={0.82} />
      </g>
      <circle cx={led.x} cy={led.y} r={0.06 * k} fill={power > 0.05 ? '#FFB347' : '#6B5A48'} stroke={INK} strokeWidth={ink * 0.4} />
      {power > 0.05 && <circle cx={led.x} cy={led.y} r={0.2 * k} fill={`url(#${id}-led)`} opacity={power} />}
      <defs>
        <radialGradient id={`${id}-led`}>
          <stop offset="0" stopColor="#FFC870" stopOpacity={0.7} />
          <stop offset="1" stopColor="#FFC870" stopOpacity={0} />
        </radialGradient>
      </defs>
    </g>
  );
};

// ---------------------------------------------------------------- the stomach model
// footprint in the model's local plan (u right, w away), J-shaped: cardia at left (the esophagus tube joins there),
// fundus top-left, greater curvature round the right, antrum and pylorus bottom-left, lesser curvature inside
const FP: [number, number][] = [
  [-1.62, 1.38], [-1.95, 1.95], [-1.55, 2.55], [-0.65, 2.88], [0.45, 2.8], [1.55, 2.42], [2.45, 1.7], [2.98, 0.68], [3.05, -0.45],
  [2.62, -1.48], [1.82, -2.16], [0.8, -2.45], [-0.2, -2.36], [-0.98, -1.98], [-1.42, -1.62], [-1.1, -1.25],
  [-0.72, -0.85], [-0.62, -0.3], [-0.78, 0.2], [-1.2, 0.52], [-1.62, 0.74],
];
const FPS: [number, number][] = (() => {
  // Catmull-Rom upsampling of the footprint (smooth shell outlines)
  const out: [number, number][] = [];
  const n = FP.length;
  for (let i = 0; i < n; i++) {
    const p0 = FP[(i - 1 + n) % n], p1 = FP[i], p2 = FP[(i + 1) % n], p3 = FP[(i + 2) % n];
    for (let k = 0; k < 4; k++) {
      const u = k / 4, u2 = u * u, u3 = u2 * u;
      const f = (a: number, b: number, c2: number, d: number) => 0.5 * (2 * b + (-a + c2) * u + (2 * a - 5 * b + 4 * c2 - d) * u2 + (-a + 3 * b - 3 * c2 + d) * u3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
})();
const CEN = {u: 0.55, w: 0.3};
const H = 1.9;
const ring = (sc: number, z: number): V3[] => FPS.map(([u, w]) => v3(MODEL_O.x + CEN.u + (u - CEN.u) * sc, MODEL_O.y + CEN.w + (w - CEN.w) * sc, z));
const smoothRing = (c: Cam, pts: V3[]) => {
  const p = pts.map((q) => project(c, q));
  const n = p.length;
  let d = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    d += ` C${(p1.x + (p2.x - p0.x) / 6).toFixed(1)},${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)},${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d + 'Z';
};
const RINGS = [
  {sc: 1, z: ZT},
  {sc: 1.02, z: ZT + 0.45 * H},
  {sc: 0.94, z: ZT + 0.78 * H},
  {sc: 0.72, z: ZT + H},
];

/** the floor of the model (under its contents): faint pink plastic, rugae folds, the base rim */
export const ModelFloor: React.FC<{c: Cam; ink: number}> = ({c, ink}) => {
  const base = smoothRing(c, ring(1, ZT + 0.005));
  const k = project(c, MODEL_O).k;
  const fold = (sc: number, i0: number, i1: number) => {
    const r = ring(sc, ZT + 0.01).slice(i0, i1).map((q) => project(c, q));
    return r.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  };
  return (
    <g>
      <path d={base} fill="#F3C2BC" fillOpacity={0.2} />
      {[0.82, 0.66].map((sc, i) => (
        <path key={i} d={fold(sc, 4, 52)} fill="none" stroke="#D98F88" strokeWidth={Math.max(1, 0.035 * k)} strokeLinecap="round" opacity={0.4} />
      ))}
      <path d={base} fill="none" stroke="#B9726B" strokeWidth={Math.max(1.2, ink * 0.45)} opacity={0.8} />
    </g>
  );
};

/** the clear shell over the contents: one even tint for the whole dome, rim lines and glints */
export const ModelShell: React.FC<{c: Cam; ink: number}> = ({c, ink}) => {
  const kz = project(c, MODEL_O).k;
  const op = 0.3 - 0.17 * Math.min(1, Math.max(0, (kz - 150) / 350));
  const rs = RINGS.map((r) => ring(r.sc, r.z));
  const bands: string[] = [];
  for (let j = 0; j < rs.length - 1; j++)
    for (let i = 0; i < FPS.length; i++) {
      const a = rs[j][i], b = rs[j][(i + 1) % FPS.length], cc = rs[j + 1][(i + 1) % FPS.length], d = rs[j + 1][i];
      bands.push(poly([a, b, cc, d].map((q) => project(c, q))));
    }
  const roof = smoothRing(c, rs[3]);
  const mid = smoothRing(c, rs[1]);
  const k = project(c, MODEL_O).k;
  const glint = rs[2].slice(0, 22).map((q) => project(c, q));
  const glint2 = rs[1].slice(2, 18).map((q) => project(c, q));
  const pl = (p: SP[]) => p.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
  return (
    <g>
      <g opacity={op}>
        {bands.map((d, i) => (
          <path key={i} d={d} fill="#F7CFC9" stroke="#F7CFC9" strokeWidth={1.2} strokeLinejoin="round" />
        ))}
        <path d={roof} fill="#F7CFC9" />
      </g>
      <path d={mid} fill="none" stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={Math.max(1.2, ink * 0.4)} />
      <path d={roof} fill="none" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={Math.max(1.2, ink * 0.45)} />
      <path d={mid} fill="none" stroke="#9E5A55" strokeOpacity={0.75} strokeWidth={Math.max(1.5, ink * 0.5)} />
      <path d={pl(glint)} fill="none" stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={Math.max(2, 0.06 * k)} strokeLinecap="round" />
      <path d={pl(glint2)} fill="none" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={Math.max(1.5, 0.035 * k)} strokeLinecap="round" />
    </g>
  );
};

/** the esophagus tube: a clear cylinder from its open end to the cardia */
export const Tube: React.FC<{c: Cam; ink: number}> = ({c, ink}) => {
  const zc = ZT + TUBE.r;
  const A = project(c, v3(TUBE.x0, TUBE.y, zc)), B = project(c, v3(TUBE.x1, TUBE.y, zc));
  const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const ra = TUBE.r * A.k, rb = TUBE.r * B.k;
  const q = [{x: A.x + nx * ra, y: A.y + ny * ra}, {x: B.x + nx * rb, y: B.y + ny * rb}, {x: B.x - nx * rb, y: B.y - ny * rb}, {x: A.x - nx * ra, y: A.y - ny * ra}];
  const rim = ellipsoid(c, v3(TUBE.x0, TUBE.y, zc), [v3(0, TUBE.r, 0), v3(0, 0, TUBE.r), v3(0.002, 0, 0)]);
  const line = (p: {x: number; y: number}, r: {x: number; y: number}) => `M${p.x.toFixed(1)},${p.y.toFixed(1)} L${r.x.toFixed(1)},${r.y.toFixed(1)}`;
  return (
    <g>
      <path d={poly(q)} fill="#F7CFC9" opacity={0.15} />
      <path d={line(q[0], q[1])} stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={Math.max(1.2, ink * 0.45)} />
      <path d={line(q[3], q[2])} stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={Math.max(1.2, ink * 0.4)} />
      {/* a glint along the top of the tube */}
      <path d={line({x: A.x + nx * ra * 0.55, y: A.y + ny * ra * 0.55}, {x: B.x + nx * rb * 0.55, y: B.y + ny * rb * 0.55})} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={Math.max(1.5, 0.04 * A.k)} strokeLinecap="round" />
      <ellipse cx={rim.cx} cy={rim.cy} rx={rim.rx} ry={rim.ry} transform={`rotate(${rim.rot.toFixed(2)} ${rim.cx.toFixed(1)} ${rim.cy.toFixed(1)})`} fill="none" stroke={INK} strokeOpacity={0.6} strokeWidth={Math.max(1.5, ink * 0.5) + 2} />
      <ellipse cx={rim.cx} cy={rim.cy} rx={rim.rx} ry={rim.ry} transform={`rotate(${rim.rot.toFixed(2)} ${rim.cx.toFixed(1)} ${rim.cy.toFixed(1)})`} fill="none" stroke="#FFFFFF" strokeOpacity={0.8} strokeWidth={Math.max(1.5, ink * 0.5)} />
    </g>
  );
};

/** the trapped ball */
export const Ball: React.FC<{c: Cam; p: V3; r: number; ink: number}> = ({c, p, r, ink}) => {
  const e = ellipsoid(c, p, [v3(r, 0, 0), v3(0, r, 0), v3(0, 0, r)]);
  const g = project(c, v3(p.x, p.y, p.z - r));
  return (
    <g>
      <SoftShadow id="ball-sh" c={{x: g.x + 0.08 * g.k, y: g.y + 0.04 * g.k}} rx={r * 1.1 * g.k} ry={r * 0.5 * g.k} alpha={0.45} color="#3A1A16" />
      <Inked w={ink}>
        <Sphere id="ball" c={{x: e.cx, y: e.cy}} r={e.rx} ry={e.ry} rotate={e.rot} color="#3F7FD9" spec={0.85} k={1.2} />
      </Inked>
    </g>
  );
};
export const ballDisk = (c: Cam, p: V3, r: number) => ellipsoid(c, p, [v3(r, 0, 0), v3(0, r, 0), v3(0, 0, r)]);

/** the duodenum stub at the pylorus (closed): helps the model read as a stomach */
export const Stub: React.FC<{c: Cam; ink: number}> = ({c, ink}) => {
  const r = 0.36;
  const a3d = v3(MODEL_O.x - 1.25, MODEL_O.y - 1.72, ZT + r), b3d = v3(MODEL_O.x - 2.3, MODEL_O.y - 2.05, ZT + r);
  const A = project(c, a3d), B = project(c, b3d);
  const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const ra = r * A.k, rb = r * B.k;
  const q = [{x: A.x + nx * ra, y: A.y + ny * ra}, {x: B.x + nx * rb, y: B.y + ny * rb}, {x: B.x - nx * rb, y: B.y - ny * rb}, {x: A.x - nx * ra, y: A.y - ny * ra}];
  const ax = {x: b3d.x - a3d.x, y: b3d.y - a3d.y};
  const al = Math.hypot(ax.x, ax.y);
  const cap = ellipsoid(c, b3d, [v3((-ax.y / al) * r, (ax.x / al) * r, 0), v3(0, 0, r), v3((ax.x / al) * 0.002, (ax.y / al) * 0.002, 0)]);
  return (
    <g>
      <path d={poly(q)} fill="#F7CFC9" opacity={0.22} />
      <path d={`M${q[0].x.toFixed(1)},${q[0].y.toFixed(1)} L${q[1].x.toFixed(1)},${q[1].y.toFixed(1)}`} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={Math.max(1.2, ink * 0.4)} />
      <path d={`M${q[3].x.toFixed(1)},${q[3].y.toFixed(1)} L${q[2].x.toFixed(1)},${q[2].y.toFixed(1)}`} stroke="#9E5A55" strokeOpacity={0.7} strokeWidth={Math.max(1.2, ink * 0.45)} />
      <ellipse cx={cap.cx} cy={cap.cy} rx={cap.rx} ry={cap.ry} transform={`rotate(${cap.rot.toFixed(2)} ${cap.cx.toFixed(1)} ${cap.cy.toFixed(1)})`} fill="#F7CFC9" fillOpacity={0.35} stroke="#9E5A55" strokeOpacity={0.7} strokeWidth={Math.max(1.2, ink * 0.45)} />
    </g>
  );
};
