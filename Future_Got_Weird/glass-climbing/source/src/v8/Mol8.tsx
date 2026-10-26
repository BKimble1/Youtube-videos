// Glass Climbing V8: the contact at the scale of molecules, and the move into it from the wedge section (Wedge8).
// A schematic in nanometres, in the section's own orientation: the glass on the LEFT (its surface atoms: a dense,
// slightly irregular packing; the outermost atoms' faces at x = 0), the flattened wedge's silicone on the RIGHT
// (polymer chains: beads joined by visible backbone bonds, roughly parallel to the surface), the gap between them.
// `close` 0..1 brings the silicone in: a readable gap (MOL.gap0) narrows to atomic contact distance (MOL.gap1).
// Van der Waals attraction is felt only at this range and is weak per pair, so it is drawn as short, pale, broken
// marks (two dashes) straight across the gap between facing atoms, and only between pairs that are close enough
// (no rods, no arcs, no glow); there are a great many pairs. Atoms may jiggle (t, seconds) by a tiny amount: the
// surfaces and the gap stay the subject. Only the two surface layers carry contrast; the bulk behind is quiet.
// WedgeToMol is the purposeful move between the two scales: one continuous log zoom from the section (the selected
// wedge's flat contact strip) to the molecular view, with a long dissolve at matched geometry (the section's contact
// line IS the molecular gap line: same place, same orientation, glass left), and matched tones (the section's flat
// fields take the molecular view's mean tones deep in the zoom, so the dissolve changes texture, not brightness).
// Pure functions of their parameters.
import React from 'react';
import {INK} from '../dc/ink';
import {lit, mix, shade} from '../dc/color';
import {clamp, hash, lerp, V} from '../dc/math';
import {Cam} from '../dc/camera';
import {H, W} from '../lib';
import {camTransform, contactRegion, FACE_SX, FOCUS, FOCUS_SY, View, WCOL, WEDGE_CAM, WedgeContent, WedgeSplit, WedgeState, WedgeView} from './Wedge8';

export const MOL = {
  R: 0.17, // glass atom (O) radius, nm (as drawn)
  Rs: 0.12, // glass atom (Si) radius
  colX: 0.31, // glass column spacing
  rowY: 0.36, // glass row spacing
  Rp: 0.135, // polymer backbone bead radius (Si)
  Ro: 0.095, // polymer backbone bead radius (O)
  chainX: 0.44, // chain spacing
  beadY: 0.315, // bead spacing along a chain (the bond between beads shows)
  gap0: 1.8, // close 0: the readable gap (nm, face to face)
  gap1: 0.3, // close 1: contact distance
  reach: 1.05, // attraction marks appear only between faces closer than this (nm)
};
/** the gap (nm) between the glass's outer atom faces and the silicone's, for close 0..1 (linear: ease it outside) */
export const molGapNm = (close: number) => lerp(MOL.gap0, MOL.gap1, clamp(close));

// tones: each side's mean tone equals the section's deep-zoom tone (WCOL.glassAtomic / siliconeAtomic)
const GA = WCOL.glassAtomic, PA = WCOL.siliconeAtomic;
const MC = {
  glassBg: shade(GA, 0.11),
  glassO: lit(GA, 0.2),
  glassSi: shade(GA, 0.22),
  glassDeep: mix(GA, '#FFFFFF', 0.05),
  glassDeepSi: mix(GA, '#FFFFFF', 0.03),
  polyBg: shade(PA, 0.05),
  poly: lit(PA, 0.42),
  polyO: mix(PA, '#B9CDD2', 0.6),
  polyDeep: lit(PA, 0.13),
  bond: shade(PA, 0.42),
  bondDeep: shade(PA, 0.16),
  mark: '#F3FBF8',
};
const sm = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mkF = (z: number, org: V) => {
  const dp = Math.max(2, Math.min(9, Math.ceil(Math.log10(Math.max(1, z))) + 2));
  const n = (v: number) => (Math.abs(v) < 0.5 * 10 ** -dp ? '0' : v.toFixed(dp));
  return {n, x: (v: number) => n(v - org.x), y: (v: number) => n(v - org.y), dp};
};

// the glass lattice: column j (0 = the surface), row r. Fully periodic over 12 x 23 cells (3.7 x 8.3 nm; 8.3 nm is
// about the height of the frame at the molecular zoom), and the bulk Si and O share one quiet tone, so the bulk can be the same lattice as an SVG pattern and the switch from
// pattern to explicit atoms (at ZEXP) moves nothing; only the surface column's x is aligned to the face.
const GP = {cols: 12, rows: 23};
const gAtom = (j: number, r: number, surface = true) => {
  const jj = ((j % GP.cols) + GP.cols) % GP.cols, rr = ((r % GP.rows) + GP.rows) % GP.rows;
  const key = jj * 131 + rr * 17 + 5;
  const si = hash(key, 11) < 0.3;
  const rad = si ? MOL.Rs : MOL.R;
  const x = j === 0 && surface ? -rad - 0.04 * hash(key, 12) : -MOL.R - j * MOL.colX + 0.07 * (hash(key, 13) - 0.5);
  const y = r * MOL.rowY + (((j % 2) + 2) % 2 ? MOL.rowY / 2 : 0) + 0.07 * (hash(key, 14) - 0.5);
  return {x, y, rad, si, key: j * 7919 + r * 31 + 3};
};
// polymer chains: chain c (0 = the surface chain) at x = gap + ..., beads every beadY; periodic over 4 chains x 12 beads
const PP = {chains: 4, beads: 12};
const PH = PP.beads * MOL.beadY;
const chainX = (c: number, y: number, gap: number, surface = true) => {
  const cc = ((c % PP.chains) + PP.chains) % PP.chains;
  if (c === 0 && surface) return gap + MOL.Rp + 0.03 * (0.5 + 0.5 * Math.sin((2 * Math.PI * 2 * y) / PH + 0.7));
  return gap + MOL.Rp + c * MOL.chainX + 0.08 * Math.sin((2 * Math.PI * (1 + (cc % 2)) * y) / PH + cc * 1.9);
};
const bead = (c: number, b: number, gap: number, surface = true) => {
  const cc = ((c % PP.chains) + PP.chains) % PP.chains;
  const y = b * MOL.beadY + cc * 0.12;
  const o = ((b % 2) + 2) % 2 === 1;
  return {x: chainX(c, y, gap, surface), y, rad: o ? MOL.Ro : MOL.Rp, o};
};
/** the surface layers carry full contrast; deeper atoms sink toward the bulk tone (the surfaces stay the subject) */
const depthK = (j: number) => (j <= 0 ? 1 : j === 1 ? 0.4 : j === 2 ? 0.16 : 0);

/** small thermal jiggle (nm) of atom `key` at time t (s); subordinate by design */
const jig = (key: number, t: number, amp: number) =>
  amp === 0 ? {x: 0, y: 0} : {x: amp * Math.sin(t * (9 + 5 * hash(key, 21)) + 6.28 * hash(key, 22)), y: amp * Math.sin(t * (8 + 5 * hash(key, 23)) + 6.28 * hash(key, 24))};

/** below this zoom (px/nm) the atoms are a texture: both sides are drawn as their periodic patterns only */
const ZEXP = 18;

/** the molecular contact in nm (x = 0 the glass's outer atom faces). `z`: screen px per nm; `view`: the nm rect to
 *  cover; `org`: output origin; `t`: seconds (only for the tiny jiggle and the slight flicker of the marks). */
export const MolContent: React.FC<{id: string; close: number; z: number; view: View; org?: V; t?: number; bg?: boolean}> = ({id, close, z, view, org = {x: 0, y: 0}, t, bg = true}) => {
  const f = mkF(z, org);
  const gap = molGapNm(close);
  const ink = 1.6 / z;
  // jiggle only when a time is given (so there is no jump at t = 0)
  const amp = t === undefined ? 0 : 0.012;
  const tt = t ?? 0;
  const explicit = z >= ZEXP;
  // the surfaces' contrast comes up as the atoms become readable; outlines and highlights after it (no pop)
  const surfK = sm(ZEXP, 45, z);
  const det = sm(35, 75, z);
  // the band of explicitly drawn atoms on each side of the gap; beyond it, the same lattice as a pattern
  const band = clamp((5.6 * z) / 160, 1.1, 5.6);
  const r0 = Math.floor(view.y0 / MOL.rowY) - 2, r1 = Math.ceil(view.y1 / MOL.rowY) + 2;
  const jMax = explicit ? Math.min(Math.ceil(band / MOL.colX), Math.max(1, Math.ceil((-view.x0 - MOL.R) / MOL.colX) + 1)) : 0;
  const Jx = jMax + (jMax % 2); // even, so the pattern's column parity matches
  const glass: React.ReactNode[] = [];
  const surfG: {x: number; y: number; rad: number; r: number}[] = []; // (V8 QA) at rest: the marks pair atoms without the jiggle
  const gFill = (si: boolean, j: number) => mix(si ? MC.glassDeepSi : MC.glassDeep, si ? MC.glassSi : MC.glassO, depthK(j) * surfK);
  if (explicit && view.x0 < 0.2)
    for (let j = 0; j < Jx; j++)
      for (let r = r0; r <= r1; r++) {
        const a = gAtom(j, r);
        const d = jig(a.key, tt, amp);
        const x = a.x + d.x, y = a.y + d.y;
        if (j === 0) surfG.push({x: a.x, y: a.y, rad: a.rad, r});
        const dk = depthK(j);
        glass.push(<circle key={`g${j}_${r}`} cx={f.x(x)} cy={f.y(y)} r={f.n(a.rad)} fill={gFill(a.si, j)} stroke={INK} strokeWidth={f.n(ink * (j === 0 ? 1.2 : 1))} strokeOpacity={det * (0.12 + 0.68 * dk)} />);
        if (!a.si && dk > 0.3 && det > 0.01) glass.push(<circle key={`gh${j}_${r}`} cx={f.x(x - a.rad * 0.33)} cy={f.y(y - a.rad * 0.33)} r={f.n(a.rad * 0.28)} fill="#F2FFFD" opacity={det * 0.7 * dk} />);
      }
  // the glass pattern (columns Jx.. beyond the band), in the bulk tone
  const gTileW = GP.cols * MOL.colX, gTileH = GP.rows * MOL.rowY;
  const gx0 = -MOL.R - (Jx - 0.5) * MOL.colX; // the pattern's right edge (between column Jx-1 and Jx)
  const gTile: React.ReactNode[] = [];
  for (let jj = 0; jj < GP.cols; jj++)
    for (let rr = -1; rr <= GP.rows; rr++) {
      const a = gAtom(Jx + jj, rr, false);
      const lx = a.x - (gx0 - gTileW);
      gTile.push(<circle key={`t${jj}_${rr}`} cx={f.n(lx)} cy={f.n(a.y)} r={f.n(a.rad)} fill={a.si ? MC.glassDeepSi : MC.glassDeep} stroke={INK} strokeWidth={f.n(ink)} strokeOpacity={det * 0.12} />);
    }
  // polymer: explicit chains within the band, a pattern beyond
  const pRight = gap + MOL.Rp + band;
  const cMax = explicit ? Math.max(1, Math.min(Math.ceil((pRight - gap) / MOL.chainX), Math.ceil((view.x1 - gap) / MOL.chainX) + 1)) : 0;
  const Cx = Math.ceil(cMax / PP.chains) * PP.chains; // whole tiles, so the pattern starts on chain 0 of a tile
  const b0 = Math.floor(view.y0 / MOL.beadY) - 2, b1 = Math.ceil(view.y1 / MOL.beadY) + 2;
  const chains: React.ReactNode[] = [];
  const beads: React.ReactNode[] = [];
  const surfP: {x: number; y: number; rad: number; key: number}[] = [];
  const pFill = (o: boolean, c: number) => mix(o ? mix(MC.polyDeep, MC.polyO, 0.35) : MC.polyDeep, o ? MC.polyO : MC.poly, depthK(c) * surfK);
  if (explicit && view.x1 > gap - 0.2)
    for (let c = 0; c < Cx; c++) {
      const pts: V[] = [];
      const dk = depthK(c);
      for (let b = b0; b <= b1; b++) {
        const q = bead(c, b, gap);
        const key = c * 1009 + b * 7 + 1;
        const d = jig(key, tt, amp);
        const p = {x: q.x + d.x, y: q.y + d.y};
        pts.push(p);
        if (c === 0) surfP.push({x: q.x, y: q.y, rad: q.rad, key});
        beads.push(<circle key={`p${c}_${b}`} cx={f.x(p.x)} cy={f.y(p.y)} r={f.n(q.rad)} fill={pFill(q.o, c)} stroke={INK} strokeWidth={f.n(ink * (c === 0 ? 1.2 : 1))} strokeOpacity={det * (0.1 + 0.65 * dk)} />);
        if (!q.o && dk > 0.3 && det > 0.01) beads.push(<circle key={`ph${c}_${b}`} cx={f.x(p.x - q.rad * 0.33)} cy={f.y(p.y - q.rad * 0.33)} r={f.n(q.rad * 0.28)} fill="#FFFFFF" opacity={det * 0.75 * dk} />);
      }
      chains.push(<path key={`c${c}`} d={`M${pts.map((p) => `${f.x(p.x)},${f.y(p.y)}`).join(' L')}`} fill="none" stroke={mix(MC.bondDeep, MC.bond, dk * surfK)} strokeWidth={f.n(0.062)} strokeLinejoin="round" />);
    }
  const pTileW = PP.chains * MOL.chainX;
  const pTile: React.ReactNode[] = [];
  const px0 = gap + MOL.Rp + Cx * MOL.chainX - MOL.chainX / 2;
  for (let c = 0; c < PP.chains; c++) {
    const pts: V[] = [];
    const circ: React.ReactNode[] = [];
    for (let b = -1; b <= PP.beads + 1; b++) {
      const q = bead(Cx + c, b, gap, false);
      const lx = q.x - (px0 - (Cx === 0 ? 0 : 0));
      pts.push({x: lx, y: q.y});
      circ.push(<circle key={`pt${c}_${b}`} cx={f.n(lx)} cy={f.n(q.y)} r={f.n(q.rad)} fill={q.o ? mix(MC.polyDeep, MC.polyO, 0.35) : MC.polyDeep} stroke={INK} strokeWidth={f.n(ink)} strokeOpacity={det * 0.1} />);
    }
    pTile.push(<path key={`pc${c}`} d={`M${pts.map((p) => `${f.n(p.x)},${f.n(p.y)}`).join(' L')}`} fill="none" stroke={MC.bondDeep} strokeWidth={f.n(0.062)} />, ...circ);
  }
  // the pattern's left edge: when nothing is explicit, chain 0 starts the pattern (its own tile column)
  const pxStart = Cx === 0 ? gap + MOL.Rp - MOL.chainX / 2 : px0;
  // attraction marks: one per mutually nearest pair of surface atoms (glass atom, silicone bead; paired at rest, so a
  // mark never blinks on and off with the jiggle), only when the two
  // faces are within reach; drawn straight across the gap (horizontal), as two short pale dashes
  const marks: React.ReactNode[] = [];
  const mw = 7 / z; // (V8 QA) bolder, to read at phone size
  const zK = sm(26, 60, z);
  if (explicit && zK > 0.01) {
    const nearG = (b: {x: number; y: number; rad: number}) => {
      let best = -1, dB = 1e9;
      surfG.forEach((a, k) => {
        if (Math.abs(a.y - b.y) > 0.6) return;
        const d = Math.hypot(a.x - b.x, a.y - b.y) - a.rad - b.rad;
        if (d < dB) {
          dB = d;
          best = k;
        }
      });
      return {k: best, d: dB};
    };
    const nearP = (a: {x: number; y: number; rad: number}) => {
      let best = -1, dB = 1e9;
      surfP.forEach((b, k) => {
        if (Math.abs(a.y - b.y) > 0.6) return;
        const d = Math.hypot(a.x - b.x, a.y - b.y) - a.rad - b.rad;
        if (d < dB) {
          dB = d;
          best = k;
        }
      });
      return best;
    };
    surfP.forEach((b, i) => {
      const g = nearG(b);
      if (g.k < 0 || g.d > MOL.reach) return;
      if (nearP(surfG[g.k]) !== i) return; // mutual only
      const a = surfG[g.k];
      const y = (a.y + b.y) / 2;
      const da = Math.abs(y - a.y), db = Math.abs(y - b.y);
      if (da > a.rad * 0.85 || db > b.rad * 0.85) return;
      const xa = a.x + Math.sqrt(a.rad * a.rad - da * da), xb = b.x - Math.sqrt(b.rad * b.rad - db * db);
      if (xb - xa < 0.08) return;
      // weak per pair and steeply distance dependent: the closest pairs read strongest, so the marks vary
      const k = sm(MOL.reach, MOL.gap1 + 0.08, g.d) ** 2 * (0.5 + 0.5 * sm(0.62, 0.32, g.d));
      const flick = t === undefined ? 1 : 0.92 + 0.08 * Math.sin(tt * 6 + 6.28 * hash(b.key, 31));
      const o = Math.min(1, 0.95 * k * flick * zK);
      if (o < 0.02) return;
      const seg = (s0: number, s1: number) => `M${f.x(lerp(xa, xb, s0))},${f.y(y)} L${f.x(lerp(xa, xb, s1))},${f.y(y)}`;
      marks.push(<path key={`m${i}`} d={`${seg(0.12, 0.4)} ${seg(0.6, 0.88)}`} stroke={MC.mark} strokeWidth={f.n(mw)} strokeLinecap="round" opacity={o} />);
    });
  }
  const yA = view.y0 - 1, yB = view.y1 + 1;
  const rect = (x0: number, x1: number) => `M${f.x(x0)},${f.y(yA)} L${f.x(x1)},${f.y(yA)} L${f.x(x1)},${f.y(yB)} L${f.x(x0)},${f.y(yB)} Z`;
  const xL = Math.min(view.x0 - 1, -2), xR = Math.max(view.x1 + 1, gap + 2);
  // the glass bulk's right edge: behind the surface atoms when they are explicit, the face itself when not
  const gEdge = explicit ? -MOL.R * 0.6 : 0;
  const gPatEdge = explicit ? gx0 : 0;
  const pEdge = explicit ? gap + MOL.Rp * 0.6 : gap;
  return (
    <g>
      <defs>
        <pattern id={`${id}-gp`} patternUnits="userSpaceOnUse" x={f.x(gx0 - gTileW)} y={f.y(0)} width={f.n(gTileW)} height={f.n(gTileH)}>
          <rect x={0} y={0} width={f.n(gTileW)} height={f.n(gTileH)} fill={MC.glassBg} />
          {gTile}
        </pattern>
        <pattern id={`${id}-pp`} patternUnits="userSpaceOnUse" x={f.x(pxStart)} y={f.y(0)} width={f.n(pTileW)} height={f.n(PH)}>
          <rect x={0} y={0} width={f.n(pTileW)} height={f.n(PH)} fill={MC.polyBg} />
          {pTile}
        </pattern>
      </defs>
      {bg && <path d={rect(xL, xR)} fill={WCOL.ground} />}
      {/* the bulk behind each surface */}
      <path d={rect(xL, gEdge)} fill={MC.glassBg} />
      <path d={rect(xL, gPatEdge)} fill={`url(#${id}-gp)`} />
      <path d={rect(pEdge, xR)} fill={MC.polyBg} />
      {pxStart < xR && <path d={rect(Math.max(pxStart, pEdge), xR)} fill={`url(#${id}-pp)`} />}
      {glass}
      {chains}
      {beads}
      {marks}
    </g>
  );
};

/** the molecular view's camera: the glass face (x = 0) at screen x MOL_FACE_SX and the contact point (0, 0) at
 *  FOCUS_SY. The move from the section glides the contact point from (FACE_SX, FOCUS_SY) to here. */
export const MOL_Z = 160; // px per nm
export const MOL_FACE_SX = 200; // (V8 QA: 400 put the closing gap under the top-right captions)
export const MOL_CAM: Cam = {x: -(MOL_FACE_SX - W / 2) / MOL_Z, y: -(FOCUS_SY - H / 2) / MOL_Z, z: MOL_Z};
const viewOfNm = (cam: Cam, m = 60): View => ({x0: cam.x - (W / 2 + m) / cam.z, x1: cam.x + (W / 2 + m) / cam.z, y0: cam.y - (H / 2 + m) / cam.z, y1: cam.y + (H / 2 + m) / cam.z});

/** full-frame molecular view (cam in nm; default MOL_CAM) */
export const MolView: React.FC<{id: string; close: number; cam?: Cam; t?: number}> = ({id, close, cam = MOL_CAM, t}) => (
  <g>
    <rect x={0} y={0} width={W} height={H} fill={WCOL.ground} />
    <g transform={camTransform(cam)}>
      <MolContent id={id} close={close} z={cam.z} view={viewOfNm(cam)} t={t} />
    </g>
  </g>
);

/** how much faster the move runs through the featureless middle scales than at its ends (0: a plain log zoom) */
const ZWARP = 0.4;
/** the move's easing: u is LINEAR progress (drive it linearly in frames); this is the only easing applied */
const ease = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
/** the move between scales at u (0..1, linear in time): the section camera (um), the molecular camera (nm), the
 *  molecular layer's opacity (drawn over the section) and the contact point P (um) that both share. */
export const wedgeToMolCams = (u: number, focus = FOCUS, cam0: Cam = WEDGE_CAM, camMol: Cam = MOL_CAM, close = 0) => {
  const st: WedgeState = {surface: 'glass', approach: 1, shear: 1, focus, molGap: molGapNm(close) / 1000};
  const P = {x: 0, y: contactRegion(st, focus).mid.y};
  const e = ease(u);
  const z0 = cam0.z, z1 = camMol.z * 1000;
  // the log zoom runs faster through the middle scales (where the frame holds only the two flat faces and the line
  // between them) and slower at both ends (the wedges; the atoms)
  const w = e - (ZWARP / (2 * Math.PI)) * Math.sin(2 * Math.PI * e);
  const z = Math.exp(lerp(Math.log(z0), Math.log(z1), w));
  // the contact point's screen position glides from where the section has it to where the molecular view has it
  const s0 = {x: W / 2 + (P.x - cam0.x) * z0, y: H / 2 + (P.y - cam0.y) * z0};
  const s1 = {x: W / 2 - camMol.x * camMol.z, y: H / 2 - camMol.y * camMol.z};
  const g = sm(0.15, 0.85, e);
  const s = {x: lerp(s0.x, s1.x, g), y: lerp(s0.y, s1.y, g)};
  const sec: Cam = {x: P.x - (s.x - W / 2) / z, y: P.y - (s.y - H / 2) / z, z};
  const mol: Cam = {x: (sec.x - P.x) * 1000, y: (sec.y - P.y) * 1000, z: z / 1000};
  // the dissolve, at matched geometry and tone: a faint atomic texture from 2 px/nm, then the atoms resolve and
  // take over by 80 px/nm
  const lz = Math.log(Math.max(1e-9, mol.z));
  const mix01 = 0.45 * sm(Math.log(2), Math.log(12), lz) + 0.55 * sm(Math.log(12), Math.log(80), lz);
  return {sec, mol, mix: mix01, P, st, e};
};

/** the purposeful move from the section into one contact region (u 0 -> 1) and back out (u 1 -> 0). u = 0 is exactly
 *  WedgeView({glass, approach 1, shear 1, focus, focusK 1}) through cam0; u = 1 is exactly MolView(close) through
 *  camMol. u is linear progress (the easing is inside). `close` is the molecular state carried through the move (0 on
 *  the way in, 1 for the pull-out after the attraction). */
export const WedgeToMol: React.FC<{id: string; u: number; close?: number; focus?: number; t?: number; cam0?: Cam; camMol?: Cam}> = ({id, u, close = 0, focus = FOCUS, t, cam0 = WEDGE_CAM, camMol = MOL_CAM}) => {
  const c = wedgeToMolCams(u, focus, cam0, camMol, close);
  const vSec: View = {x0: c.sec.x - (W / 2 + 60) / c.sec.z, x1: c.sec.x + (W / 2 + 60) / c.sec.z, y0: c.sec.y - (H / 2 + 60) / c.sec.z, y1: c.sec.y + (H / 2 + 60) / c.sec.z};
  // the focus emphasis is full at the start of the move and eases off as the strip fills the frame
  const st: WedgeState = {...c.st, focusK: 1 - sm(0.25, 0.6, c.e)};
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={WCOL.ground} />
      {c.mix < 0.999 && (
        <g transform={camTransform(c.sec, c.P)}>
          <WedgeContent id={`${id}-s`} st={st} z={c.sec.z} view={vSec} org={c.P} />
        </g>
      )}
      {c.mix > 0.001 && (
        <g opacity={c.mix} transform={camTransform(c.mol)}>
          <MolContent id={`${id}-m`} close={close} z={c.mol.z} view={viewOfNm(c.mol)} t={t} bg={c.mix > 0.999} />
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------------ the recommended timeline (reference driver)
const sm3 = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
/** keyed scalar: [frame, value][] with smoothstep segments (holds before the first / after the last key) */
const keyF = (f: number, keys: [number, number][]) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++)
    if (f <= keys[i][0]) {
      const [f0, a] = keys[i - 1], [f1, b] = keys[i];
      return lerp(a, b, sm3((f - f0) / (f1 - f0 || 1)));
    }
  return keys[keys.length - 1][1];
};
/** keyed scalar with LINEAR segments (for the move's u: WedgeToMol eases it itself) */
const keyLin = (f: number, keys: [number, number][]) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++)
    if (f <= keys[i][0]) {
      const [f0, a] = keys[i - 1], [f1, b] = keys[i];
      return lerp(a, b, clamp((f - f0) / (f1 - f0 || 1)));
    }
  return keys[keys.length - 1][1];
};
/** the beat's parameters at film frame f (30 fps): a reference the integrator can use as is or re-time.
 *  222-250 the section, unloaded, tips settle onto the glass (hold to 274); 274-350 the pull (shear 0 -> 1, eased,
 *  the camera holds); 352-378 the focus wedge is singled out; 380-424 the move into its contact (u 0 -> 1, LINEAR:
 *  WedgeToMol eases it once); 424-450 the gap closes, the attraction marks come up by about 446 and hold at full
 *  strength to the pull-out; 473-500 the pull back out (u 1 -> 0, linear, close 1). */
export const microBeat8 = (f: number) => {
  const approach = keyF(f, [[222, 0.55], [250, 1]]);
  const shear = keyF(f, [[274, 0], [350, 1]]);
  const focusK = keyF(f, [[352, 0], [378, 1]]);
  const u = f < 473 ? keyLin(f, [[380, 0], [424, 1]]) : keyLin(f, [[473, 1], [500, 0]]);
  const close = f < 473 ? keyF(f, [[424, 0], [450, 1]]) : 1;
  const t = Math.max(0, (f - 380) / 30);
  return {approach, shear, focusK, u, close, t};
};
/** the whole wedge beat as drawn at film frame f (a full-frame <g>; wrap it in an <svg> W x H) */
export const MicroBeat8: React.FC<{f: number; id?: string}> = ({f, id = `mb${f}`}) => {
  if (f >= 1041) {
    const glass: WedgeState = {surface: 'glass', approach: 1, shear: keyF(f, [[1041, 0], [1062, 1]])};
    const brick: WedgeState = {surface: 'brick', approach: keyF(f, [[1041, 0.4], [1052, 1]]), shear: keyF(f, [[1052, 0], [1068, 1]]), slip: keyF(f, [[1072, 0], [1095, 1]])};
    return <WedgeSplit id={id} glass={glass} brick={brick} />;
  }
  if (f >= 900) return <WedgeView id={id} st={{surface: 'glass', approach: 1, shear: keyF(f, [[930, 0.8], [946, 1]])}} cam={WEDGE_CAM} />;
  const p = microBeat8(f);
  if (p.u > 0 && f >= 380) {
    if (p.u >= 1) return <MolView id={id} close={p.close} t={p.t} />;
    return <WedgeToMol id={id} u={p.u} close={p.close} t={p.t} />;
  }
  return <WedgeView id={id} st={{surface: 'glass', approach: p.approach, shear: p.shear, focus: FOCUS, focusK: p.focusK}} cam={WEDGE_CAM} />;
};
