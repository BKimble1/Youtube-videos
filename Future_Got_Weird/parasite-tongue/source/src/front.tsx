// The front set: the fish's face and the inside of its open mouth, in 3D. The cavity is a mesh (lit through the
// opening, darker toward the throat), the gill arches and their slits line the back of the side walls, the lips carry
// the teeth, and the face is a plane around the lips. Everything is projected through the shot's camera, so the push
// from the full face into the mouth and through the gills is one continuous move.
import React from 'react';
import {lit, mix, rgba, shade} from './core/color';
import {add3, Basis, cross3, dot3, lerp3, mul3, norm3, P2, proj, smoothClosed, smoothOpen, sub3, V2, V3} from './core/three';

/** a world polygon clipped to the space in front of the camera, projected, then clipped to a box around the frame
 *  (very near walls otherwise project to huge coordinates, which the blur filter cannot rasterise) */
const projPoly = (B: Basis, pts: V3[], near = 0.8): string => {
  const dz = (p: V3) => dot3(sub3(p, B.eye), B.fw);
  const front: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const da = dz(a) - near, db = dz(b) - near;
    if (da >= 0) front.push(a);
    if ((da >= 0) !== (db >= 0)) front.push(lerp3(a, b, da / (da - db)));
  }
  if (front.length < 3) return '';
  let poly: V2[] = front.map((p) => proj(B, p));
  const edges: [(p: V2) => number, (a: V2, b: V2, t: number) => V2][] = [];
  const box = [-800, -800, 1880, 2720];
  const cut = (f: (p: V2) => number) => {
    const out: V2[] = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const fa = f(a), fb = f(b);
      if (fa >= 0) out.push(a);
      if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t}); }
    }
    poly = out;
  };
  cut((p) => p.x - box[0]); cut((p) => box[2] - p.x); cut((p) => p.y - box[1]); cut((p) => box[3] - p.y);
  void edges;
  if (poly.length < 3) return '';
  return `M${poly.map(P2).join(' L')} Z`;
};
import {ARCH_X, floorAt, halfW, roofAt, roofZ, THROAT, tongueSurf, wall, XS} from './anatomy';
import {IsoPose, isopodItems} from './isopod';
import {clamp, hash, lerp} from './lib';
import {Food, foodItems} from './food';

type It = {z: number; el: React.ReactNode};
const LIGHT: V3 = norm3([-0.75, 0, 0.66]);
const DARK = '#3A1215';
const NTH = 30;

const r0 = (arr: It[]) => arr.sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>);
const thAt = (j: number) => -Math.PI / 2 + (2 * Math.PI * j) / NTH; // j=0 floor centre
const regionColor = (th: number) => {
  const s = Math.sin(th);
  // floor -> wall -> roof (palate paler)
  if (s < 0) return mix('#C77F77', '#B5615B', Math.pow(-s, 3));
  return mix('#C77F77', '#DDB3AA', Math.pow(s, 1.5));
};

export type TongueState = {shrink: number; pale: number; flow: number; biteX: number | null; bead: number};
export type FrontState = {B: Basis; g: number; iso: IsoPose | null; isoLight?: V3; food?: Food | null; swallow?: number; t: number; fkey: string; tongue?: TongueState | null};

export const FrontSet: React.FC<{s: FrontState}> = ({s}) => {
  const {B, g, t} = s;
  const items: It[] = [];
  const under: It[] = []; // drawn before the parasite whatever their depth (the floor under it)
  const toCam = (p: V3) => norm3(sub3(B.eye, p));
  const dz = (p: V3) => dot3(sub3(p, B.eye), B.fw);
  let uid = 0;
  // inside the mouth the light travels with the camera (falls off with distance from it)
  const inside = clamp((B.eye[0] + 3) / 8);
  const attAt = (p: V3, x: number) => lerp(Math.exp(-Math.max(0, x - 1) / 34), Math.exp(-Math.hypot(...sub3(p, B.eye)) / 34), inside);
  const id = (p: string) => `${s.fkey}${p}${uid++}`;

  // ---------------- throat: the dark opening at the back
  {
    const ring: V3[] = [];
    for (let j = 0; j < NTH; j++) ring.push(wall(THROAT, thAt(j), g));
    const d = projPoly(B, ring, 1);
    if (d) {
      const c = proj(B, [THROAT, 0, (floorAt(THROAT) + roofZ(THROAT, g)) / 2]);
      const r = halfW(THROAT) * c.s * 1.1;
      const gid = id('th');
      const sw = s.swallow ?? 0;
      items.push({
        z: 1e6,
        el: (
          <g key={gid}>
            <defs>
              <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} r={Math.max(1, r).toFixed(1)}>
                <stop offset="0" stopColor="#140406" />
                <stop offset={(0.4 - 0.25 * sw).toFixed(2)} stopColor="#2A090C" />
                <stop offset="1" stopColor="#6A2226" />
              </radialGradient>
            </defs>
            <path d={d} fill={`url(#${gid})`} />
          </g>
        ),
      });
    }
  }

  // ---------------- cavity mesh
  for (let i = XS.length - 2; i >= 0; i--) {
    const x0 = XS[i], x1 = XS[i + 1];
    for (let j = 0; j < NTH; j++) {
      const t0 = thAt(j), t1 = thAt(j + 1);
      const q = [wall(x0, t0, g), wall(x1, t0, g), wall(x1, t1, g), wall(x0, t1, g)];
      const c = mul3(add3(add3(q[0], q[1]), add3(q[2], q[3])), 0.25);
      let n = norm3(cross3(sub3(q[1], q[0]), sub3(q[3], q[0])));
      const axis: V3 = [c[0], 0, (floorAt(c[0]) + roofZ(c[0], g)) / 2];
      if (dot3(n, sub3(axis, c)) < 0) n = mul3(n, -1);
      if (dot3(n, toCam(c)) < -0.08) continue; // the wall seen from outside (a cutaway through it)
      const d = projPoly(B, q, 0.8);
      if (!d) continue;
      const thm = (t0 + t1) / 2;
      const lamb = lerp(0.3 + 0.7 * Math.max(0, dot3(n, LIGHT)), 0.35 + 0.65 * Math.max(0, dot3(n, toCam(c))), inside);
      const att = attAt(c, c[0]);
      const base = regionColor(thm);
      const col = mix(DARK, mix(shade(base, 0.5), lit(base, 0.08), lamb), att);
      under.push({z: dz(c), el: <path key={id('q')} d={d} fill={col} stroke={col} strokeWidth={0.6} strokeLinejoin="round" />});
    }
  }

  // ---------------- gill arches and slits on both side walls (the gill slits lead out under the gill covers)
  [-1, 1].forEach((side) => {
    ARCH_X.forEach((ax, k) => {
      const thA = side > 0 ? -0.85 : Math.PI + 0.85, thB = side > 0 ? 0.85 : Math.PI - 0.85;
      const N = 10;
      // the slit behind this arch (dark red, with filaments glimpsed through it)
      const slit: V3[] = [];
      const sx0 = ax + 1.3, sx1 = ax + 3.4;
      for (let q = 0; q <= N; q++) slit.push(wall(sx0, lerp(thA, thB, q / N), g, 0.15));
      for (let q = N; q >= 0; q--) slit.push(wall(sx1, lerp(thA, thB, q / N), g, 0.15));
      const ds = projPoly(B, slit, 0.8);
      const cS = wall((sx0 + sx1) / 2, 0, g);
      const att = lerp(Math.exp(-Math.max(0, ax - 1) / 40), Math.exp(-Math.hypot(...sub3(cS, B.eye)) / 40), inside);
      if (ds) {
        const fil: React.ReactNode[] = [];
        for (let q = 0; q < 22; q++) {
          const xx = lerp(sx0 + 0.1, sx1 - 0.1, (q + 0.5) / 22);
          const pts: V2[] = [];
          for (let r = 0; r <= 6; r++) {
            const p = wall(xx, lerp(thA + 0.12, thB - 0.12, r / 6), g, 0.2);
            if (dz(p) < 1) break;
            pts.push(proj(B, p));
          }
          if (pts.length > 2) fil.push(<path key={q} d={smoothOpen(pts)} fill="none" stroke={mix('#C43A3E', '#7E1A20', hash(q + k * 9))} strokeWidth={Math.max(0.5, 0.07 * proj(B, cS).s).toFixed(2)} strokeLinecap="round" opacity={0.9} />);
        }
        items.push({
          z: dz(cS) - 0.3,
          el: (
            <g key={id('sl')} opacity={clamp(att * 1.4)}>
              <path d={ds} fill={mix('#3A0A0E', '#8E1D24', att)} />
              {fil}
            </g>
          ),
        });
      }
      // the arch: a pale bony bar with gill rakers along its inner edge
      const bar: V3[] = [];
      const bx0 = ax - 0.6, bx1 = ax + 1.2;
      for (let q = 0; q <= N; q++) bar.push(wall(bx0, lerp(thA, thB, q / N), g, 0.35));
      for (let q = N; q >= 0; q--) bar.push(wall(bx1, lerp(thA, thB, q / N), g, 0.35));
      const db = projPoly(B, bar, 0.8);
      if (db) {
        const rk: React.ReactNode[] = [];
        for (let q = 1; q < 12; q++) {
          const p0 = wall(bx0 + 0.3, lerp(thA, thB, q / 12), g, 0.4);
          const p1 = add3(p0, [-1.4, -side * 0.6, 0]);
          if (dz(p0) < 1 || dz(p1) < 1) continue;
          const A = proj(B, p0), C = proj(B, p1);
          rk.push(<path key={q} d={`M${P2(A)} L${P2(C)}`} stroke={mix(DARK, '#EAD3C8', att)} strokeWidth={Math.max(0.5, 0.3 * A.s).toFixed(2)} strokeLinecap="round" />);
        }
        const cB = wall(ax, 0.5, g);
        items.push({
          z: dz(cB) - 0.4,
          el: (
            <g key={id('ar')}>
              <path d={db} fill={mix(DARK, '#CFA59A', att)} stroke={mix(DARK, '#8E4E4A', att)} strokeWidth={0.8} />
              {rk}
            </g>
          ),
        });
      }
    });
  });

  // ---------------- tissue texture: small papillae and mucus specks fixed on the walls
  for (let q = 0; q < 240; q++) {
    const x = lerp(-0.5, 38, Math.pow(hash(q * 5.3 + 2), 1.3));
    const th = thAt(0) + 2 * Math.PI * hash(q * 9.1 + 3);
    const p = wall(x, th, g, 0.03);
    if (dz(p) < 2) continue;
    const P = proj(B, p);
    if (P.x < -20 || P.x > 1100 || P.y < -20 || P.y > 1940) continue;
    const att = Math.exp(-x / 26);
    const light = hash(q * 2.2) > 0.55;
    items.push({z: dz(p) - 0.1, el: <ellipse key={id('sp')} cx={P.x.toFixed(1)} cy={P.y.toFixed(1)} rx={((0.18 + 0.3 * hash(q)) * P.s).toFixed(2)} ry={((0.12 + 0.2 * hash(q + 1)) * P.s).toFixed(2)} fill={light ? '#F4D2C8' : '#7A2E30'} opacity={(0.35 * att).toFixed(3)} />});
  }

  // ---------------- wet highlights on the tissue (fixed points on the mesh; they glint as the view changes)
  for (let q = 0; q < 70; q++) {
    const x = lerp(-0.5, 40, hash(q * 3.1));
    const th = thAt(0) + 2 * Math.PI * hash(q * 7.7 + 1);
    const p = wall(x, th, g, 0.05);
    if (dz(p) < 2) continue;
    const axis: V3 = [x, 0, (floorAt(x) + roofZ(x, g)) / 2];
    const n = norm3(sub3(axis, p));
    const h = norm3(add3(LIGHT, toCam(p)));
    const sp = Math.pow(Math.max(0, dot3(n, h)), 12) * Math.exp(-x / 30);
    if (sp < 0.04) continue;
    const P = proj(B, p);
    items.push({z: dz(p) - 0.2, el: <ellipse key={id('w')} cx={P.x.toFixed(1)} cy={P.y.toFixed(1)} rx={(0.7 * P.s).toFixed(2)} ry={(0.35 * P.s).toFixed(2)} fill="#FFF3EE" opacity={(0.55 * sp).toFixed(3)} />});
  }

  // ---------------- the tongue: a pad on the floor, with its blood vessels on the surface
  const tongueEls: React.ReactNode[] = [];
  if (s.tongue) {
    const T = s.tongue;
    const NU = 16, NV = 12;
    const base = mix('#D97C74', '#C9A39B', T.pale);
    const quads: It[] = [];
    for (let i = 0; i < NU; i++) {
      for (let j = 0; j < NV; j++) {
        const u0 = i / NU, u1 = (i + 1) / NU, v0 = -1 + (2 * j) / NV, v1 = -1 + (2 * (j + 1)) / NV;
        const q = [tongueSurf(u0, v0, T.shrink), tongueSurf(u1, v0, T.shrink), tongueSurf(u1, v1, T.shrink), tongueSurf(u0, v1, T.shrink)];
        const c = mul3(add3(add3(q[0], q[1]), add3(q[2], q[3])), 0.25);
        let n = norm3(cross3(sub3(q[1], q[0]), sub3(q[3], q[0])));
        if (n[2] < 0) n = mul3(n, -1);
        if (dot3(n, toCam(c)) < -0.05) continue;
        const d = projPoly(B, q, 0.8);
        if (!d) continue;
        const lamb = lerp(0.35 + 0.65 * Math.max(0, dot3(n, LIGHT)), 0.4 + 0.6 * Math.max(0, dot3(n, toCam(c))), inside);
        const col = mix(DARK, mix(shade(base, 0.45), lit(base, 0.12), lamb), attAt(c, c[0]) * 0.6 + 0.4);
        quads.push({z: dz(c), el: <path key={id('tq')} d={d} fill={col} stroke={col} strokeWidth={0.7} strokeLinejoin="round" />});
      }
    }
    tongueEls.push(<g key="tq" filter={`url(#${s.fkey}tsoft)`}>{r0(quads)}</g>);
    // papillae and wet glints
    for (let q = 0; q < 70; q++) {
      const u = 0.05 + 0.9 * hash(q * 3.7 + 11), v = -0.85 + 1.7 * hash(q * 5.1 + 7);
      const p = tongueSurf(u, v, T.shrink, 0.03);
      if (dz(p) < 1.5) continue;
      const P = proj(B, p);
      tongueEls.push(<circle key={id('tp')} cx={P.x.toFixed(1)} cy={P.y.toFixed(1)} r={Math.max(0.5, 0.16 * P.s).toFixed(2)} fill={hash(q) > 0.5 ? '#F6CFC6' : '#A8564F'} opacity={0.45} />);
    }
    // blood vessels: a midline vessel and two branches, from the base toward the tip
    const vessel = (vs: (u: number) => number, u0: number, u1: number) => {
      const pts: V3[] = [];
      for (let k = 0; k <= 14; k++) { const u = lerp(u0, u1, k / 14); pts.push(tongueSurf(u, vs(u), T.shrink, 0.06)); }
      return pts;
    };
    const vessels = [vessel(() => 0, 0.97, 0.1), vessel((u) => 0.5 * Math.sin((u - 0.15) * 2.4), 0.85, 0.2), vessel((u) => -0.5 * Math.sin((u - 0.15) * 2.4), 0.85, 0.2)];
    const pulse = 0.5 + 0.5 * Math.cos((2 * Math.PI * t) / 0.75);
    vessels.forEach((pts, vi) => {
      if (pts.some((p) => dz(p) < 1.5)) return;
      const P = pts.map((p) => proj(B, p));
      const w = (vi === 0 ? 0.3 : 0.2) * P[4].s * (0.45 + 0.55 * T.flow);
      tongueEls.push(<path key={id('vs')} d={smoothOpen(P)} fill="none" stroke="#9A1C28" strokeWidth={Math.max(0.6, w).toFixed(2)} strokeLinecap="round" opacity={0.25 + 0.35 * T.flow} />);
      tongueEls.push(<path key={id('vc')} d={smoothOpen(P)} fill="none" stroke="#D8343E" strokeWidth={Math.max(0.4, w * 0.4 * (0.8 + 0.2 * pulse)).toFixed(2)} strokeLinecap="round" opacity={0.45 * T.flow} />);
      // flow: bright pulses moving along the vessel (toward the bite while the parasite feeds)
      for (let k = 0; k < 6; k++) {
        const u = (((k / 6 + t * 0.7) % 1) + 1) % 1;
        const idx = Math.min(13, Math.floor(u * 14)), fr = u * 14 - idx;
        const a = P[idx], b = P[idx + 1];
        tongueEls.push(<circle key={id('fp')} cx={(a.x + (b.x - a.x) * fr).toFixed(1)} cy={(a.y + (b.y - a.y) * fr).toFixed(1)} r={Math.max(0.6, w * 0.5).toFixed(2)} fill="#FF6A70" opacity={(0.55 * T.flow * Math.sin(Math.PI * u)).toFixed(2)} />);
      }
    });
    // wrinkles as it withers
    if (T.pale > 0.05) {
      for (let k = 0; k < 6; k++) {
        const u = 0.15 + 0.13 * k;
        const pts: V3[] = [];
        for (let m = 0; m <= 8; m++) pts.push(tongueSurf(u + 0.03 * Math.sin(m + k), -0.85 + (1.7 * m) / 8, T.shrink, 0.04));
        if (pts.some((p) => dz(p) < 1.5)) continue;
        const P = pts.map((p) => proj(B, p));
        tongueEls.push(<path key={id('wr')} d={smoothOpen(P)} fill="none" stroke="#7E5A55" strokeWidth={Math.max(0.5, 0.12 * P[4].s).toFixed(2)} opacity={0.55 * T.pale} />);
      }
    }
    // the bite: blood beading where the mouthparts went in
    if (T.biteX !== null && T.bead > 0.01) {
      const p = tongueSurf(clamp((T.biteX - tongueSurf(0, 0, T.shrink)[0]) / (27 - tongueSurf(0, 0, T.shrink)[0]), 0, 1), 0, T.shrink, 0.15);
      if (dz(p) > 1.5) {
        const P = proj(B, p);
        tongueEls.push(<ellipse key={id('bd')} cx={P.x.toFixed(1)} cy={P.y.toFixed(1)} rx={(0.9 * T.bead * (0.85 + 0.15 * pulse) * P.s).toFixed(2)} ry={(0.6 * T.bead * P.s).toFixed(2)} fill="#B3101C" opacity={0.9} />);
        tongueEls.push(<ellipse key={id('bh')} cx={(P.x - 0.25 * P.s).toFixed(1)} cy={(P.y - 0.2 * P.s).toFixed(1)} rx={(0.25 * T.bead * P.s).toFixed(2)} ry={(0.12 * T.bead * P.s).toFixed(2)} fill="#FFFFFF" opacity={0.6} />);
      }
    }
  }

  // ---------------- the parasite (and food)
  const isoIt = s.iso ? isopodItems(B, s.iso, s.isoLight ?? [-0.5, 0, 1]) : [];
  const isoGroup: It = {z: 0, el: <g key="iso">{isoIt.sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>)}</g>};
  const foodIt = s.food ? foodItems(B, s.food, id('fd')) : null;

  // ---------------- lips and teeth
  const lipFront: React.ReactNode[] = [];
  {
    const outer: V3[] = [], inner: V3[] = [];
    for (let j = 0; j <= NTH; j++) {
      const th = thAt(j);
      const o = wall(-1, th, g, -3.4 - 1.2 * Math.max(0, Math.sin(th)));
      outer.push([-3.2, o[1], o[2]]);
      inner.push(wall(0.6, th, g));
    }
    const dOut = projPoly(B, outer, 0.8), dIn = projPoly(B, inner, 0.8);
    if (dOut && dIn && outer.every((p) => dz(p) > 1.5) && inner.every((p) => dz(p) > 1.5)) {
      const gid = id('lp');
      const mid: V2[] = [], inn: V2[] = [], up: V2[] = [];
      for (let j = 0; j < NTH; j++) {
        const th = thAt(j);
        const extra = 1.2 * Math.max(0, Math.sin(th));
        const m = wall(-1.1, th, g, -1.7 - extra / 2);
        mid.push(proj(B, [-1.1, m[1], m[2]]));
        inn.push(proj(B, wall(0.4, th, g, -0.3)));
        if (Math.sin(th) > 0.15) { const u = wall(-1.6, th, g, -2.4 - extra); up.push(proj(B, [-1.6, u[1], u[2]])); }
      }
      const sc = proj(B, [-1, 0, roofAt(g) / 2]).s;
      lipFront.push(
        <g key={gid}>
          <path d={`${dOut} ${dIn}`} fillRule="evenodd" fill="#A2433F" />
          <path d={smoothClosed(mid)} fill="none" stroke="#B4554E" strokeWidth={(1.8 * sc).toFixed(1)} opacity={0.9} />
          <path d={smoothClosed(inn)} fill="none" stroke="#6E2226" strokeWidth={(1.1 * sc).toFixed(1)} opacity={0.85} />
          {up.length > 2 && <path d={smoothOpen(up)} fill="none" stroke="#EBA696" strokeWidth={(0.7 * sc).toFixed(1)} strokeLinecap="round" opacity={0.55} />}
        </g>,
      );
      // teeth: small conical teeth along both jaws, two larger canines at the front of the upper jaw
      const teeth: React.ReactNode[] = [];
      for (let q = 0; q < 34; q++) {
        const upper = q < 18;
        const f = upper ? (q + 0.5) / 18 : (q - 18 + 0.5) / 16;
        const th = upper ? lerp(0.35, Math.PI - 0.35, f) : lerp(-Math.PI + 0.55, -0.55, f);
        const base = wall(0.4, th, g, -0.2);
        const canine = upper && (q === 6 || q === 11);
        const len = canine ? 2.3 : 0.9 + 0.35 * hash(q);
        const axis: V3 = [0.4, 0, (floorAt(0.4) + roofZ(0.4, g)) / 2];
        const dir = norm3(sub3(axis, base));
        const tip = add3(add3(base, mul3(dir, len)), [len * 0.35, 0, 0]);
        const side = norm3(cross3(dir, [1, 0, 0]));
        const w = canine ? 0.55 : 0.3;
        const a = add3(base, mul3(side, w)), b = add3(base, mul3(side, -w));
        if (dz(a) < 1 || dz(b) < 1 || dz(tip) < 1) continue;
        const A = proj(B, a), Bp = proj(B, b), T = proj(B, tip);
        teeth.push(<path key={q} d={`M${P2(A)} Q${P2({x: (A.x + T.x) / 2, y: (A.y + T.y) / 2})} ${P2(T)} Q${P2({x: (Bp.x + T.x) / 2, y: (Bp.y + T.y) / 2})} ${P2(Bp)} Z`} fill="#EFE5D6" fillOpacity={0.92} stroke="#B9A08E" strokeWidth={Math.max(0.3, 0.06 * A.s).toFixed(2)} />);
      }
      lipFront.push(<g key={id('tt')}>{teeth}</g>);
    }
  }

  // ---------------- the face (a plane around the lips): head outline, eyes, nostrils, jaw lines, fins
  const face: React.ReactNode[] = [];
  const fins: React.ReactNode[] = [];
  const faceOp = clamp((-B.eye[0] - 5) / 5);
  if (faceOp > 0.001 && dz([-4, 0, 10]) > 4 && dz([-4, 21, 40]) > 4 && dz([-4, -21, 40]) > 4) {
    const HP: [number, number][] = [[80, 2], [74, 7], [64, 12.5], [54, 17], [46, 20.2], [36, 21], [24, 20.6], [12, 20.2], [2, 19.6], [-8, 17.8], [-18, 14.6], [-27, 10.5], [-35, 6], [-40, 1.5]];
    const outline: V3[] = [];
    const fx = (z: number) => -4 + Math.max(0, z - 34) * 0.85 + Math.max(0, -z - 6) * 0.7;
    HP.forEach(([z, w]) => outline.push([fx(z), w, z]));
    for (let q = HP.length - 1; q >= 0; q--) outline.push([fx(HP[q][0]), -HP[q][1], HP[q][0]]);
    const pts = outline.map((p) => proj(B, p));
    const hole: V3[] = [];
    for (let j = 0; j < NTH; j++) {
      const th = thAt(j);
      const o = wall(-1, th, g, -3.4 - 1.2 * Math.max(0, Math.sin(th)));
      hole.push([-3.2, o[1], o[2]]);
    }
    const hp = hole.map((p) => proj(B, p));
    const top = proj(B, [36, 0, 80]), bot = proj(B, [20, 0, -40]);
    const gid = id('fc');
    // pectoral fins (splayed out at the sides), beating slowly; drawn behind the head and the mouth
    [-1, 1].forEach((side) => {
      const beat = Math.sin((2 * Math.PI * t) / 2 + (side > 0 ? 0 : 0.6));
      const root: V3 = [40, side * 17, -16];
      const fin: V3[] = [root, [52, side * (30 + 3 * beat), -26], [58, side * (33 + 4 * beat), -12 + 2 * beat], [48, side * 19, -10]];
      const fp = fin.map((p) => proj(B, p));
      fins.push(<path key={`pf${side}`} d={smoothClosed(fp)} fill={rgba('#F0A898', 0.32)} stroke={rgba('#C27066', 0.5)} strokeWidth={Math.max(0.5, 0.2 * fp[0].s).toFixed(2)} />);
      for (let r = 1; r < 6; r++) {
        const a = proj(B, root), b = proj(B, add3(root, mul3(sub3(lerpV(fin[1], fin[2], r / 6), root), 0.95)));
        fins.push(<path key={`pr${side}${r}`} d={`M${P2(a)} L${P2(b)}`} stroke={rgba('#B8665C', 0.45)} strokeWidth={Math.max(0.4, 0.12 * a.s).toFixed(2)} />);
      }
    });
    face.push(
      <g key={gid}>
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={top.x.toFixed(1)} y1={top.y.toFixed(1)} x2={bot.x.toFixed(1)} y2={bot.y.toFixed(1)}>
            <stop offset="0" stopColor="#A9363A" />
            <stop offset="0.3" stopColor="#C9574F" />
            <stop offset="0.55" stopColor="#DC8676" />
            <stop offset="0.78" stopColor="#E8BDB0" />
            <stop offset="1" stopColor="#EFDCD3" />
          </linearGradient>
          <radialGradient id={`${gid}r`} gradientUnits="userSpaceOnUse" cx={proj(B, [-4, 0, 15]).x.toFixed(1)} cy={proj(B, [-4, 0, 15]).y.toFixed(1)} r={(26 * top.s).toFixed(1)}>
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#3A0C10" stopOpacity={0.45} />
          </radialGradient>
        </defs>
        <path d={`${smoothClosed(pts)} ${smoothClosed(hp)}`} fillRule="evenodd" fill={`url(#${gid})`} />
        <path d={`${smoothClosed(pts)} ${smoothClosed(hp)}`} fillRule="evenodd" fill={`url(#${gid}r)`} />
      </g>,
    );
    // jaw lines: the maxilla running back from the mouth corners, the lower jaw's V
    [-1, 1].forEach((side) => {
      const m = [proj(B, [-4, side * 15.5, roofAt(g) * 0.75]), proj(B, [-4, side * 18.5, roofAt(g) * 0.95 + 4]), proj(B, [-4, side * 19.8, roofAt(g) + 9])];
      face.push(<path key={`mx${side}`} d={smoothOpen(m)} fill="none" stroke={rgba('#7E2A2E', 0.5)} strokeWidth={Math.max(0.6, 0.35 * m[0].s).toFixed(2)} strokeLinecap="round" />);
      const j = [proj(B, [-4, side * 13, -3.5]), proj(B, [-4, side * 7, -12]), proj(B, [-4, side * 1.5, -19])];
      face.push(<path key={`jw${side}`} d={smoothOpen(j)} fill="none" stroke={rgba('#9C6A62', 0.45)} strokeWidth={Math.max(0.6, 0.3 * j[0].s).toFixed(2)} strokeLinecap="round" />);
      // nostrils
      [[side * 6.5, roofAt(g) + 14], [side * 8.6, roofAt(g) + 15.5]].forEach(([y, z], q) => {
        const n = proj(B, [-4, y, z]);
        face.push(<ellipse key={`n${side}${q}`} cx={n.x.toFixed(1)} cy={n.y.toFixed(1)} rx={(0.7 * n.s).toFixed(2)} ry={(0.5 * n.s).toFixed(2)} fill="#5A1A1E" opacity={0.7} />);
      });
    });
    // eyes: lateral, seen from the front as discs at the sides of the head, set back from the lips
    [-1, 1].forEach((side) => {
      const c = proj(B, [14, side * 19.2, 46]);
      const rx = 3.4 * c.s, ry = 7.2 * c.s;
      const eid = id('ey');
      face.push(
        <g key={eid}>
          <defs>
            <radialGradient id={eid} gradientUnits="userSpaceOnUse" cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} r={ry.toFixed(1)}>
              <stop offset="0" stopColor="#080505" />
              <stop offset="0.5" stopColor="#0C0707" />
              <stop offset="0.56" stopColor="#5A2818" />
              <stop offset="0.82" stopColor="#B07A3A" />
              <stop offset="1" stopColor="#6E2A22" />
            </radialGradient>
          </defs>
          <ellipse cx={(c.x + side * rx * 0.2).toFixed(1)} cy={c.y.toFixed(1)} rx={(rx * 1.3).toFixed(1)} ry={(ry * 1.15).toFixed(1)} fill="#8E3433" />
          <ellipse cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} rx={rx.toFixed(1)} ry={ry.toFixed(1)} fill={`url(#${eid})`} />
          <ellipse cx={(c.x - side * rx * 0.2).toFixed(1)} cy={(c.y - ry * 0.45).toFixed(1)} rx={(rx * 0.22).toFixed(1)} ry={(ry * 0.1).toFixed(1)} fill="#FFFFFF" opacity={0.5} />
        </g>,
      );
    });
    // scales on the face: rows of small overlapping arcs fixed on the head
    const sc: React.ReactNode[] = [];
    for (let zi = -30; zi <= 70; zi += 3.2) {
      const hw = HP.reduce((acc, [z, w], q) => (q > 0 && zi <= HP[q - 1][0] && zi >= z ? lerp(w, HP[q - 1][1], (zi - z) / (HP[q - 1][0] - z)) : acc), 0);
      for (let yi = -hw + 1.5; yi <= hw - 1.5; yi += 3.4) {
        const yy = yi + ((Math.round(zi / 3.2) % 2) * 1.7);
        if (Math.abs(yy) > hw - 1.5) continue;
        if (zi > -6 && zi < roofAt(g) + 6 && Math.abs(yy) < 19) continue; // not on the lips and jaws
        const x0 = fx(zi);
        const a = proj(B, [x0, yy - 1.5, zi]), m = proj(B, [x0, yy, zi - 1.4]), b2 = proj(B, [x0, yy + 1.5, zi]);
        sc.push(<path key={`${zi}_${yy}`} d={`M${P2(a)} Q${P2(m)} ${P2(b2)}`} fill="none" stroke="#5A1A1E" strokeWidth={Math.max(0.4, 0.14 * a.s).toFixed(2)} opacity={0.18} />);
      }
    }
    face.push(<g key="sc">{sc}</g>);
  }

  // The cavity is convex: seen through the opening (or from inside) no wall hides another wall or the parasite, so
  // the walls go first (far to near), then what lies on them, then the parasite and the food, then the lips and face.
  const r = (arr: It[]) => arr.sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>);
  const thr = items.filter((i) => i.z > 9e5), rest = items.filter((i) => i.z <= 9e5);
  return (
    <g>
      {faceOp > 0 && <g opacity={faceOp}>{fins}</g>}
      <defs>
        <filter id={`${s.fkey}tsoft`} filterUnits="userSpaceOnUse" x="-60" y="-60" width="1200" height="2040"><feGaussianBlur stdDeviation="1.1" /></filter>
        <filter id={`${s.fkey}soft`} filterUnits="userSpaceOnUse" x="-60" y="-60" width="1200" height="2040"><feGaussianBlur stdDeviation={(B.eye[0] > -2 ? 1.6 : clamp(0.16 * proj(B, s.iso ? s.iso.o : [15, 0, 2]).s, 1.4, 9)).toFixed(2)} /></filter>
      </defs>
      <g filter={`url(#${s.fkey}soft)`}>
        {r(thr)}
        {r(under)}
        {r(rest)}
      </g>
      {tongueEls}
      {foodIt && foodIt.behind && foodIt.el}
      {isoGroup.el}
      {foodIt && !foodIt.behind && !(s.food && s.food.p[0] < -2.5) && foodIt.el}
      {lipFront}
      <g opacity={faceOp}>{face}</g>
      {foodIt && s.food && s.food.p[0] < -2.5 && foodIt.el}
    </g>
  );
};
const lerpV = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
