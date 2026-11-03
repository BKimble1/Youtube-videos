// V2: the wet wound over the bonded seam (the "It grips bone even inside a wet, bloody wound" macro). A thin,
// translucent, blood-tinted sheet of fluid flows down (and a little to the right) across the glue-filled transverse
// seam. Its surface ripples are broad crests travelling with the flow, tilted against the seam so they visibly cross it:
// as a crest rides over the raised gel it bends up a touch and its highlight turns to a gel glint, then it carries on
// down the other side. Around "wet, bloody" one stronger, darker wash sweeps across the whole field. The glue's outline
// is redrawn crisp on top (the exact edges FractureBone draws), so the bond visibly stays sealed to both broken faces
// while the fluid passes over it. No strands, no droplets. World millimetres, depth 0; deterministic in st.flow / st.surge.
import React from 'react';
import {P, closed, open, pt} from '../core/geo';
import {mix, rgba} from '../core/color';
import {clamp, noise1, ss} from '../lib';
import {C} from './palette';
import {RADIUS} from './anatomy';
import {SEAM_IDS} from './seams';
import {GLUE_EDGE_COLOR, GLUE_LIP_SIDE, GlueRun, glueRuns} from './fracture';
import {BoneState2} from '../v2state';
import {uid} from '../core/ids';

const RAD = closed(RADIUS, 0.55);
/** the flow direction (down the frame, tilted a little to the right) and the crest direction across it */
const A = 0.36;
const D = pt(Math.sin(A), Math.cos(A));
const E = pt(Math.cos(A), -Math.sin(A));
/** the field's origin and extent along the crests (u) and along the flow (q), mm */
const O = pt(-4, 0);
const U0 = -16, U1 = 16, Q0 = -16, Q1 = 18;
const SPACING = 3.3, SPEED = 2.2;
const at = (u: number, q: number) => pt(O.x + E.x * u + D.x * q, O.y + E.y * u + D.y * q);

type Rows = {x: number; lo: number; hi: number}[];
/** the transverse band's current outline as rows (x -> upper and lower edge y) */
const bandRows = (st: BoneState2): Rows => {
  const rows: Rows = [];
  for (const r of glueRuns('C1', st)) {
    for (let i = 0; i < r.lo.length; i++) {
      const lo = r.lo[i], hi = r.hi[i];
      rows.push({x: (lo.x + hi.x) / 2, lo: Math.min(lo.y, hi.y), hi: Math.max(lo.y, hi.y)});
    }
  }
  rows.sort((a, b) => a.x - b.x);
  return rows;
};
const bandAt = (rows: Rows, x: number): {lo: number; hi: number} | null => {
  if (rows.length < 2 || x < rows[0].x || x > rows[rows.length - 1].x) return null;
  let lo = 0, hi = rows.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (rows[m].x <= x) lo = m; else hi = m;
  }
  const a = rows[lo], b = rows[hi];
  const k = clamp((x - a.x) / (b.x - a.x || 1));
  return {lo: a.lo + (b.lo - a.lo) * k, hi: a.hi + (b.hi - a.hi) * k};
};
/** how far inside the raised band a point is (0 outside, 1 well inside, soft over 0.25 mm) */
const onBand = (rows: Rows, p: P) => {
  const b = bandAt(rows, p.x);
  if (!b) return 0;
  return ss(p.y, b.lo - 0.25, b.lo + 0.1) * (1 - ss(p.y, b.hi - 0.1, b.hi + 0.25));
};

/** one wavy line across the flow at flow-position q (with the ride-up over the gel) */
const crestLine = (rows: Rows, q: number, ph: number, t: number, ride: number): {pts: P[]; gel: number[]} => {
  const pts: P[] = [], gel: number[] = [];
  for (let u = U0; u <= U1; u += 0.25) {
    const wq = q + 0.22 * Math.sin(u * 0.75 + ph + t * 0.9) + 0.14 * noise1(u * 0.5 + ph * 3, 31);
    let p = at(u, wq);
    const g = onBand(rows, p);
    if (g > 0) p = at(u, wq - ride * g);
    pts.push(p);
    gel.push(g);
  }
  return {pts, gel};
};
/** split a polyline into the stretches where gel > 0.5 */
const gelRuns = (pts: P[], gel: number[]): P[][] => {
  const out: P[][] = [];
  let cur: P[] = [];
  pts.forEach((p, i) => {
    if (gel[i] > 0.5) cur.push(p);
    else if (cur.length) { if (cur.length > 1) out.push(cur); cur = []; }
  });
  if (cur.length > 1) out.push(cur);
  return out;
};

export const WetFilm: React.FC<{st: BoneState2}> = ({st}) => {
  const a = st.wet;
  if (a <= 0.001) return null;
  const px = st.px;
  const t = st.flow;
  const rows = bandRows(st);
  const clip = uid('wetclip');
  const grad = uid('wetsurge');
  const out: React.ReactNode[] = [];
  const W = (n: number, min = 0.004) => Math.max(min, n * px);

  // ripple crests travelling with the flow
  const span = Q1 - Q0;
  const n = Math.ceil(span / SPACING);
  for (let k = 0; k < n; k++) {
    const q = Q0 + ((((k * SPACING + t * SPEED) % span) + span) % span);
    const fade = Math.min(1, (q - Q0) / 2.5, (Q1 - q) / 2.5);
    if (fade <= 0) continue;
    const ph = k * 1.7;
    const crest = crestLine(rows, q, ph, t, 0.16);
    const back = crestLine(rows, q - 0.55, ph, t, 0.16).pts;
    const body = closed([...crest.pts, ...[...back].reverse()], 0.5);
    out.push(
      <g key={`c${k}`} opacity={fade}>
        <path d={body} fill="#FFE1E4" opacity={0.34} />
        <path d={open(crestLine(rows, q + 0.2, ph, t, 0.16).pts, 0.5)} stroke={C.bloodDeep} strokeWidth={W(5)} fill="none" opacity={0.34} strokeLinecap="round" />
        <path d={open(crest.pts, 0.5)} stroke="#FFF5F5" strokeWidth={W(4.5)} fill="none" opacity={0.92} strokeLinecap="round" />
        {gelRuns(crest.pts, crest.gel).map((r, i) => (
          <path key={i} d={open(r, 0.5)} stroke={C.glueShine} strokeWidth={W(4.2)} fill="none" opacity={0.85} strokeLinecap="round" />
        ))}
      </g>,
    );
  }

  // the stronger wash on "wet, bloody": a darker sheet with a crisp leading edge sweeps across the field and the seam
  if (st.surge >= 0 && st.surge <= 1) {
    // nearly constant speed across the frame (eased only at the ends), so the sheet crosses the seam at a readable pace
    const u = 0.3 * ss(st.surge, 0, 1) + 0.7 * st.surge;
    const qf = Q0 + 4 + (span - 2) * u;
    const strength = Math.sin(Math.PI * clamp(st.surge)) ** 0.45;
    const lead = crestLine(rows, qf, 0.4, t * 2.5, 0.32);
    const tail = crestLine(rows, qf - 6.5, 0.4, t * 2.5, 0).pts;
    const g0 = at(0, qf - 6.5), g1 = at(0, qf);
    out.push(
      <g key="surge" opacity={strength}>
        <defs>
          <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1={g0.x} y1={g0.y} x2={g1.x} y2={g1.y}>
            <stop offset={0} stopColor={C.bloodLit} stopOpacity={0} />
            <stop offset={0.55} stopColor={C.bloodLit} stopOpacity={0.5} />
            <stop offset={1} stopColor={C.blood} stopOpacity={0.72} />
          </linearGradient>
        </defs>
        <path d={closed([...lead.pts, ...[...tail].reverse()], 0.5)} fill={`url(#${grad})`} />
        <path d={open(lead.pts, 0.5)} stroke={C.bloodDeep} strokeWidth={W(8)} fill="none" opacity={0.8} strokeLinecap="round" />
        <path d={open(lead.pts.map((p) => pt(p.x - D.x * W(5), p.y - D.y * W(5))), 0.5)} stroke="#FFF1F2" strokeWidth={W(2.6)} fill="none" opacity={0.85} strokeLinecap="round" />
        {gelRuns(lead.pts, lead.gel).map((r, i) => (
          <path key={i} d={open(r.map((p) => pt(p.x - D.x * W(5), p.y - D.y * W(5))), 0.5)} stroke={C.glueShine} strokeWidth={W(4.5)} fill="none" opacity={0.9} strokeLinecap="round" />
        ))}
      </g>,
    );
  }

  // the film's lip where it meets the raised gel's upstream edge, and a light roll-off along its downstream edge
  const lipUp: P[] = [], lipDown: P[] = [];
  for (const r of rows) {
    lipUp.push(pt(r.x, r.lo - 0.05));
    lipDown.push(pt(r.x, r.hi + 0.05));
  }

  // the glue stays sealed to both faces: its exact outline redrawn crisp over the film, styled as FractureBone draws it
  // (the shaded face's bone-ink lip on one side, the gel's own soft edge on the other). Each seam's edges are masked
  // where another seam's gel lies, so at the T-junctions no edge line runs across the joined gel.
  const all: GlueRun[] = SEAM_IDS.flatMap((id) => glueRuns(id, st));
  const band = (r: GlueRun) => closed([...r.lo, ...[...r.hi].reverse()], 0.5);
  const ids = [...new Set(all.map((r) => r.id))];
  const mk = {x: -40, y: -40, width: 80, height: 80};
  const masks: Record<string, string> = {};
  ids.forEach((id) => { masks[id] = uid('wetem'); });
  const edges: React.ReactNode[] = [
    <defs key="em">
      {ids.map((id) => (
        <mask key={id} id={masks[id]} maskUnits="userSpaceOnUse" {...mk}>
          <rect {...mk} fill="#FFFFFF" />
          {all.map((r, i) => (r.id !== id ? <path key={i} d={band(r)} fill="#000000" stroke="#000000" strokeWidth={W(3.2, 0.01)} /> : null))}
        </mask>
      ))}
    </defs>,
  ];
  all.forEach((r, i) => {
    const lip = GLUE_LIP_SIDE[r.id];
    // the bone-ink lip as FractureBone draws it: not along a branch's first 0.5 mm (that end lies in C1's gel)
    const k0 = r.id === 'C1' ? 0 : r.s.findIndex((s) => s > 0.5);
    const lipPs = (ps: P[]) => (k0 < 0 ? [] : ps.slice(k0));
    const sides: [P[], boolean][] = [[lip === -1 ? lipPs(r.lo) : r.lo, lip === -1], [lip === 1 ? lipPs(r.hi) : r.hi, lip === 1]];
    edges.push(
      <g key={`e${i}`} mask={`url(#${masks[r.id]})`} fill="none" strokeLinejoin="round" strokeLinecap="round">
        {sides.map(([ps, isLip], k) => (
          <path key={k} d={open(ps, 0.5)} stroke={isLip ? C.boneInk : GLUE_EDGE_COLOR} strokeWidth={isLip ? W(1.8, 0.006) : W(1.25, 0.004)} opacity={0.9} />
        ))}
      </g>,
    );
  });

  // the whole film: a faint blood tint over the bone, a touch redder after the wash
  const tint = 0.2 + 0.025 * Math.sin(t * 1.7) + (st.surge > 0.3 ? 0.1 * ss(st.surge, 0.3, 1) : 0);
  return (
    <g opacity={a}>
      <defs>
        <clipPath id={clip}><path d={RAD} /></clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect x={-30} y={-30} width={60} height={60} fill={rgba(mix(C.blood, C.bloodLit, 0.3), tint)} />
        {out}
        {/* (cut where a branch's gel joins: no film lip across a T-junction's mouth) */}
        <g mask={masks.C1 ? `url(#${masks.C1})` : undefined}>
          {lipUp.length > 2 && <path d={open(lipUp, 0.5)} stroke={C.bloodDeep} strokeWidth={W(5)} fill="none" opacity={0.32} strokeLinecap="round" />}
          {lipDown.length > 2 && <path d={open(lipDown, 0.5)} stroke="#FFF2F2" strokeWidth={W(2)} fill="none" opacity={0.4} strokeLinecap="round" />}
        </g>
      </g>
      {edges}
    </g>
  );
};
