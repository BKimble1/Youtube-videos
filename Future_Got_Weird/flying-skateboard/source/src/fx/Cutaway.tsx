// V7: the inside of the electric board, drawn in the board's own 3D frame so the camera can travel from the flying
// board's underside into one propulsion unit without a cut.
//
// BoardInterior: seen from below, the underside skin is cut away by an iris that opens from the spine (a bright cut
// edge marks it), showing the frame ribs, a battery and power runs out to the ten units, with pulses travelling
// along them as the motors take current. The power layout is CONCEPTUAL: the real wiring and battery placement are
// not published (the tag in the corner says so).
//
// UnitSection: a vertical section through one ducted unit, facing the camera. The near half is cut away; we see the
// cut faces of the duct wall and the deck skins (hatched), and behind the section plane the far half of the unit:
// the duct's inner wall, the outrunner motor's bell with its magnets turning, the stator coils energised in sequence
// (the brushless commutation that makes the bell turn), the shaft, and the five blades turning in the duct. Air is
// drawn as streamlines that gather above the inlet, speed through the fan and leave below as a faster, narrower jet.
import React from 'react';
import {BD, ductWorld} from '../art/Board';
import {INK} from '../dc/ink';
import {curveD, f2, polyD, proj} from '../eng/draw';
import {a3, c3, d3, Frame, Lens, m3, n3, s3, toW, V3, v3} from '../eng/v3';

const sst = (a: number, b: number, x: number) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

/** clip a 3D polygon to the half-space d3(p - o, n) <= 0 (Sutherland-Hodgman) */
const clipHalf = (poly: V3[], o: V3, n: V3): V3[] => {
  const out: V3[] = [];
  const side = (p: V3) => d3(s3(p, o), n);
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const sa = side(a), sb = side(b);
    if (sa <= 0) out.push(a);
    if ((sa <= 0) !== (sb <= 0)) {
      const u = sa / (sa - sb);
      out.push(a3(a, m3(s3(b, a), u)));
    }
  }
  return out;
};

/** The board's interior seen from below. k = 0..1 iris opening; pulse = clock for the power pulses; load 0..1 */
export const BoardInterior: React.FC<{id: string; L: Lens; B: Frame; k: number; t: number; load: number}> = ({id, L, B, k, t, load}) => {
  if (k <= 0.01) return null;
  if (d3(s3(L.pos, B.o), B.y) > -BD.thick) return null; // only from below the bottom plane
  const y = -BD.thick - 0.002;
  const P = (x: number, z: number) => L.p(toW(B, v3(x, y, z)));
  const kc = L.p(B.o).k;
  const w = Math.max(0.8, Math.min(3, kc * 0.004));
  const e = k * k * (3 - 2 * k);
  // the iris: an ellipse in the bottom plane growing from the spine
  const iris = Array.from({length: 40}, (_, i) => {
    const a = (i / 40) * Math.PI * 2;
    return P(Math.cos(a) * 0.55 * e, Math.sin(a) * 1.05 * e);
  });
  const cav = BD.outline.map(([x, z]) => P(x * 0.9, z * 0.93));
  const holes = BD.ducts.map(([x, z]) => polyD(Array.from({length: 24}, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return P(x + Math.cos(a) * BD.rimR * 1.04, z + Math.sin(a) * BD.rimR * 1.04);
  })));
  // ribs: two along the spine edges, cross ribs between the duct rows
  const ribs: string[] = [];
  for (const x of [-0.165, 0.165]) ribs.push(polyD([P(x, -0.74), P(x, 0.78)], false));
  for (const z of [-0.65, -0.39, -0.13, 0.13, 0.39, 0.65]) ribs.push(polyD([P(-0.42, z), P(-0.165, z)], false), polyD([P(0.165, z), P(0.42, z)], false));
  // conceptual power runs: from the pack on the spine out to each motor
  const runs = BD.ducts.map(([x, z]) => [P(Math.sign(x) * 0.1, z * 0.55), P(Math.sign(x) * 0.15, z), P(x - Math.sign(x) * 0.05, z)]);
  const runD = runs.map((r) => polyD(r, false)).join(' ');
  const runLen = runs.reduce((acc, r) => acc + Math.hypot(r[1].x - r[0].x, r[1].y - r[0].y) + Math.hypot(r[2].x - r[1].x, r[2].y - r[1].y), 0) / runs.length;
  const pack = [P(-0.1, -0.32), P(0.1, -0.32), P(0.1, 0.32), P(-0.1, 0.32)];
  const motors = BD.ducts.map(([x, z], i) => {
    const c = P(x, z);
    const r = 0.036 * L.p(toW(B, v3(x, y, z))).k;
    const lit = 0.35 + 0.65 * load * (0.5 + 0.5 * Math.sin(t * 22 + i * 1.3));
    return <circle key={i} cx={f2(c.x)} cy={f2(c.y)} r={f2(r)} fill="#59636F" stroke={lit > 0.6 ? '#FFC768' : INK} strokeWidth={f2(w * 1.4)} />;
  });
  return (
    <g>
      <defs>
        <clipPath id={`${id}-ir`}>
          <path d={polyD(iris)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-ir)`}>
        <path d={`${polyD(cav)} ${holes.join(' ')}`} fillRule="evenodd" fill="#38414B" />
        <path d={ribs.join(' ')} stroke="#5D6873" strokeWidth={f2(w * 3)} strokeLinecap="round" fill="none" />
        <path d={polyD(pack)} fill="#2A3038" stroke="#59636F" strokeWidth={f2(w * 1.5)} />
        <path d={runD} stroke="#C0392B" strokeWidth={f2(w * 1.8)} fill="none" strokeLinejoin="round" />
        {load > 0.01 && (
          <path d={runD} stroke="#FFE08A" strokeOpacity={f2(0.9 * load)} strokeWidth={f2(w * 2.2)} fill="none" strokeLinecap="round"
            strokeDasharray={`${f2(runLen * 0.12)} ${f2(runLen * 0.3)}`} strokeDashoffset={f2(-((t * 1.6) % 1) * runLen * 0.42)} />
        )}
        {motors}
      </g>
      {/* the cut edge of the skin, bright where the iris has cut it */}
      {e < 0.98 && <path d={polyD(iris)} fill="none" stroke="#EAF6FF" strokeOpacity={0.85} strokeWidth={f2(w * 2)} />}
    </g>
  );
};

/** One unit in section. k = 0..1 section opening; spin = rotor angle (turns); rps = for the coil sequence and blur;
 *  air 0..1 flow strength; t = clock for the streamlines. i = which duct. */
export const UnitSection: React.FC<{id: string; L: Lens; B: Frame; i: number; k: number; spin: number; rps: number; air: number; t: number; power: number}> = ({id, L, B, i, k, spin, rps, air, t, power}) => {
  if (k <= 0.01) return null;
  const c0 = ductWorld(B, i, 0);
  // the section plane: vertical through the duct axis, facing the camera (spanned by the board axis that faces it best)
  const view = n3(s3(c0, L.pos));
  const ha = Math.abs(d3(view, B.x)) < Math.abs(d3(view, B.z)) ? B.x : B.z;
  let nrm = n3(c3(ha, B.y));
  if (d3(nrm, s3(L.pos, c0)) < 0) nrm = m3(nrm, -1); // toward the camera
  const at = (u: number, v: number, w = 0): V3 => a3(a3(a3(c0, m3(ha, u)), m3(B.y, v)), m3(nrm, w));
  const P = (u: number, v: number, w = 0) => L.p(at(u, v, w));
  const kc = L.p(c0).k;
  const lw = Math.max(0.8, Math.min(4, kc * 0.0035));
  const e = k * k * (3 - 2 * k);
  const T = BD.thick, R = BD.ductR, RR = BD.rimR;
  const ring = (v: number, r: number, a0: number, a1: number, n = 20) => Array.from({length: n + 1}, (_, j) => {
    const a = a0 + ((a1 - a0) * j) / n;
    return at(Math.cos(a) * r, v, -Math.abs(Math.sin(a)) * r);
  });
  // ---- the window: the section opens from the duct's axis outward
  const W = 0.36 * e;
  const winD = polyD([P(-W, 0.03), P(W, 0.03), P(W, -T - 0.03), P(-W, -T - 0.03)]);
  // ---- behind the plane: the duct's far inner wall (a half cylinder), shaded darker toward its middle
  const wallFar = proj(L, [...ring(0, R, 0, Math.PI), ...ring(-T, R, Math.PI, 0)]);
  // ---- the board slice around the duct, cut (skins and the cavity between them)
  const skin = (u0: number, u1: number, v0: number, v1: number) => polyD([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]);
  const cuts = [
    skin(-W, -RR, 0, -0.012), skin(RR, W, 0, -0.012), skin(-W, -RR, -T + 0.012, -T), skin(RR, W, -T + 0.012, -T),
    // the duct walls in section (with a rounded inlet lip)
    polyD([P(-RR, 0.004), P(-R + 0.004, 0.004), P(-R, -0.012), P(-R, -T), P(-RR, -T)]),
    polyD([P(RR, 0.004), P(R - 0.004, 0.004), P(R, -0.012), P(R, -T), P(RR, -T)]),
  ].join(' ');
  const cavity = [skin(-W, -RR, -0.012, -T + 0.012), skin(RR, W, -0.012, -T + 0.012)].join(' ');
  // hatch lines over the cut faces (clipped to them)
  const hatch: string[] = [];
  for (let h = -0.5; h <= 0.5; h += 0.012) hatch.push(polyD([P(h, 0.01), P(h + 0.12, -T - 0.01)], false));
  // ---- the motor (outrunner): the bell's far half with its magnets, the stator and its coils, the shaft
  const yTop = BD.fanY - 0.004, yBot = BD.fanY - 0.05, rb = 0.032, rs = 0.022;
  const bellFar = proj(L, [...ring(yTop, rb, 0, Math.PI, 16), ...ring(yBot, rb, Math.PI, 0, 16)]);
  const bellCut = [polyD([P(-rb, yTop), P(-rb + 0.004, yTop), P(-rb + 0.004, yBot), P(-rb, yBot)]), polyD([P(rb - 0.004, yTop), P(rb, yTop), P(rb, yBot), P(rb - 0.004, yBot)]), polyD([P(-rb, yTop + 0.004), P(rb, yTop + 0.004), P(rb, yTop), P(-rb, yTop)])].join(' ');
  const ang = spin * Math.PI * 2;
  const mags: React.ReactNode[] = [];
  const NM = 12;
  for (let m = 0; m < NM; m++) {
    const a = ang + (m / NM) * Math.PI * 2;
    const sw = Math.sin(a);
    if (sw < 0.05) continue; // only the far half (w < 0) is still there
    const half = (Math.PI / NM) * 0.75;
    const quad = [at(Math.cos(a - half) * (rb - 0.004), yTop - 0.006, -Math.sin(a - half) * (rb - 0.004)), at(Math.cos(a + half) * (rb - 0.004), yTop - 0.006, -Math.sin(a + half) * (rb - 0.004)), at(Math.cos(a + half) * (rb - 0.004), yBot + 0.006, -Math.sin(a + half) * (rb - 0.004)), at(Math.cos(a - half) * (rb - 0.004), yBot + 0.006, -Math.sin(a - half) * (rb - 0.004))];
    mags.push(<path key={m} d={polyD(proj(L, quad))} fill={m % 2 ? '#C94A3C' : '#3E6FB0'} opacity={f2(0.55 + 0.45 * sw)} />);
  }
  // stator: a laminated core with six coils; the coils carrying current glow in turn, stepping round with the bell
  const coils: React.ReactNode[] = [];
  const NC = 6;
  const step = Math.floor(((spin * NC) % NC + NC) % NC);
  for (let cI = 0; cI < NC; cI++) {
    const a = (cI / NC) * Math.PI * 2 + Math.PI / NC;
    const sw = Math.sin(a);
    if (sw < -0.05) continue;
    const hot = power > 0.02 && (cI === step || cI === (step + 3) % NC);
    const q = [at(Math.cos(a - 0.32) * rs, yTop - 0.012, -Math.max(0, Math.sin(a - 0.32)) * rs), at(Math.cos(a + 0.32) * rs, yTop - 0.012, -Math.max(0, Math.sin(a + 0.32)) * rs), at(Math.cos(a + 0.32) * rs, yBot + 0.012, -Math.max(0, Math.sin(a + 0.32)) * rs), at(Math.cos(a - 0.32) * rs, yBot + 0.012, -Math.max(0, Math.sin(a - 0.32)) * rs)];
    coils.push(<path key={cI} d={polyD(proj(L, q))} fill={hot ? '#FFB347' : '#B87333'} stroke={hot ? '#FFF1C4' : '#6E4320'} strokeWidth={f2(lw * (hot ? 1.6 : 0.8))} opacity={f2(hot ? Math.min(1, 0.6 + power) : 1)} />);
  }
  const core = polyD([P(-0.008, yTop - 0.01), P(0.008, yTop - 0.01), P(0.008, yBot + 0.004), P(-0.008, yBot + 0.004)]);
  const shaft = polyD([P(-0.003, BD.fanY + 0.02), P(0.003, BD.fanY + 0.02), P(0.003, yBot), P(-0.003, yBot)]);
  // struts from the motor to the duct wall (in the plane, cut)
  const struts = [polyD([P(-R, yBot + 0.004), P(-rb, yBot + 0.004), P(-rb, yBot - 0.004), P(-R, yBot - 0.004)]), polyD([P(rb, yBot + 0.004), P(R, yBot + 0.004), P(R, yBot - 0.004), P(rb, yBot - 0.004)])].join(' ');
  // ---- the blades: five, turning with the bell; each clipped at the section plane (the near half is cut away)
  const bladeOp = Math.max(0.25, Math.min(1, 1 - (rps - 4) / 20));
  const blades: React.ReactNode[] = [];
  for (let b = 0; b < 5; b++) {
    const a = ang + (b / 5) * Math.PI * 2;
    const pts = [0.036, 0.11].flatMap((r, j) => {
      const da = j === 0 ? 0.3 : 0.15;
      return [a - da, a + da].map((aa) => at(Math.cos(aa) * r, BD.fanY + (j ? 0.004 : -0.004), -Math.sin(aa) * r));
    });
    const poly = clipHalf([pts[0], pts[2], pts[3], pts[1]], c0, nrm);
    if (poly.length < 3) continue;
    blades.push(<path key={b} d={polyD(proj(L, poly))} fill="#8C98A5" stroke="#4A535C" strokeWidth={f2(lw * 0.8)} opacity={f2(bladeOp)} />);
  }
  const hubCap = proj(L, ring(BD.fanY + 0.012, 0.034, 0, Math.PI, 12).concat(ring(BD.fanY - 0.006, 0.034, Math.PI, 0, 12)));
  // a faint blur disc for the blades' sweep once they are fast
  const blurK = Math.min(1, Math.max(0, (rps - 4) / 14));
  const disc = proj(L, ring(BD.fanY, 0.112, 0, Math.PI, 24).concat([at(-0.112, BD.fanY, 0), at(0.112, BD.fanY, 0)]));
  // ---- the power feed (conceptual): two leads in from the board's cavity to the motor base, with current pulses
  const lead = (off: number) => proj(L, [at(-W, -0.07 + off), at(-RR - 0.01, -0.07 + off), at(-R + 0.005, yBot - 0.006 + off), at(-rb, yBot + 0.008 + off)]);
  const leads = [lead(0), lead(-0.01)];
  const leadLen = Math.hypot(leads[0][0].x - leads[0][3].x, leads[0][0].y - leads[0][3].y) * 1.2;
  // ---- the air: streamlines that gather above the inlet, speed through the fan and leave below as a narrower jet
  const lines: React.ReactNode[] = [];
  if (air > 0.01) {
    const N = 7;
    for (let n = 0; n < N; n++) {
      const s = (n / (N - 1)) * 2 - 1;
      const pts: V3[] = [];
      for (let q = 0; q <= 22; q++) {
        const v = 0.42 - q * 0.05;
        let u: number;
        if (v > 0) u = s * (0.075 + 0.28 * Math.pow(v / 0.42, 0.8));
        else if (v > -T) u = s * 0.075;
        else u = s * (0.075 - 0.025 * Math.min(1, (-v - T) / 0.4));
        pts.push(at(u, v, -0.03));
      }
      const pp = proj(L, pts);
      const len = pp.reduce((acc, p, j) => (j ? acc + Math.hypot(p.x - pp[j - 1].x, p.y - pp[j - 1].y) : 0), 0);
      lines.push(
        <g key={n}>
          <path d={curveD(pp)} fill="none" stroke="#9FD8F2" strokeOpacity={f2(0.3 * air)} strokeWidth={f2(Math.max(1, 0.004 * kc))} />
          <path d={curveD(pp)} fill="none" stroke="#F2FBFF" strokeOpacity={f2(0.95 * air)} strokeWidth={f2(Math.max(1.2, 0.007 * kc))} strokeLinecap="round"
            strokeDasharray={`${f2(len * 0.07)} ${f2(len * 0.05)}`} strokeDashoffset={f2(-((t * (0.4 + 1.1 * air)) % 1) * len * 0.36)} />
        </g>,
      );
    }
  }
  return (
    <g opacity={e < 0.999 ? undefined : undefined}>
      <defs>
        <clipPath id={`${id}-w`}>
          <path d={winD} />
        </clipPath>
        <clipPath id={`${id}-h`}>
          <path d={cuts} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-w)`}>
        {/* the cavity of the board, its far wall dark */}
        <path d={cavity} fill="#2E363F" />
        <path d={polyD(wallFar)} fill="#26303A" />
        <path d={polyD(disc)} fill="#A9B5C1" opacity={f2(0.35 * blurK)} />
        {blades}
        <path d={polyD(bellFar)} fill="#4A535C" stroke={INK} strokeWidth={f2(lw)} />
        {mags}
        {coils}
        <path d={core} fill="#7D8891" stroke={INK} strokeWidth={f2(lw * 0.8)} />
        <path d={shaft} fill="#C6CED6" stroke={INK} strokeWidth={f2(lw * 0.6)} />
        <path d={polyD(hubCap)} fill="#8C98A5" stroke={INK} strokeWidth={f2(lw * 0.8)} />
        <path d={struts} fill="#5D6873" stroke={INK} strokeWidth={f2(lw * 0.6)} />
        <path d={bellCut} fill="#C6CED6" stroke={INK} strokeWidth={f2(lw * 0.8)} />
        {leads.map((ld, j) => (
          <g key={j}>
            <path d={curveD(ld)} stroke={j ? '#20262D' : '#C0392B'} strokeWidth={f2(lw * 2.2)} fill="none" strokeLinecap="round" />
            {power > 0.02 && <path d={curveD(ld)} stroke="#FFE08A" strokeOpacity={f2(0.95 * power)} strokeWidth={f2(lw * 1.6)} fill="none" strokeLinecap="round" strokeDasharray={`${f2(leadLen * 0.1)} ${f2(leadLen * 0.16)}`} strokeDashoffset={f2(-((t * 2.2) % 1) * leadLen * 0.52)} />}
          </g>
        ))}
        {/* the cut faces: white, hatched, outlined */}
        <path d={cuts} fill="#EEF2F5" stroke={INK} strokeWidth={f2(lw * 1.2)} />
        <g clipPath={`url(#${id}-h)`}>
          <path d={hatch.join(' ')} stroke="#9AA8B5" strokeWidth={f2(lw * 0.7)} />
        </g>
        {lines}
      </g>
      {/* the window's edge */}
      <path d={winD} fill="none" stroke="#EAF6FF" strokeOpacity={0.9} strokeWidth={f2(lw * 1.6)} />
    </g>
  );
};

/** a small corner tag: the interior layout is a conceptual reconstruction */
export const ConceptTag: React.FC<{k: number}> = ({k}) =>
  k <= 0.01 ? null : (
    <g opacity={f2(k)}>
      <rect x={44} y={1468} width={330} height={44} rx={10} fill="#0E1A22" opacity={0.55} />
      <text x={60} y={1498} fontFamily="Nunito Variable, Nunito, sans-serif" fontSize={24} fontWeight={700} fill="#EAF6FF" letterSpacing={1}>
        ILLUSTRATIVE CUTAWAY
      </text>
    </g>
  );
