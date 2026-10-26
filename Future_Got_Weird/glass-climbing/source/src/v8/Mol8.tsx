// Glass Climbing V8: the contact at the scale of molecules, and the move into it from the wedge section (Wedge8).
// A schematic in nanometres, in the section's own orientation: the glass on the LEFT (its surface atoms: a dense,
// slightly irregular packing; the outermost atoms' faces at x = 0), the flattened wedge's silicone on the RIGHT
// (polymer chains, strings of beads, roughly parallel to the surface), the gap between them along x.
// `close` 0..1 brings the silicone in: a readable gap (MOL.gap0) narrows to atomic contact distance (MOL.gap1).
// Van der Waals attraction is felt only at this range and is weak per pair, so it is drawn as fine, faint, broken
// marks between facing atoms, and only between pairs that are close enough (no rods, no arcs, no glow); there are
// a great many pairs. Atoms may jiggle (t, seconds) by a tiny amount: the surfaces and the gap stay the subject.
// WedgeToMol is the purposeful move between the two scales: one continuous log zoom from the section (the selected
// wedge's flat contact strip) to the molecular view, with a dissolve at matched geometry (the section's contact line
// IS the molecular gap line: same place, same orientation, glass left). Pure functions of their parameters.
import React from 'react';
import {INK} from '../dc/ink';
import {mix} from '../dc/color';
import {clamp, hash, lerp, V} from '../dc/math';
import {Cam} from '../dc/camera';
import {H, W} from '../lib';
import {camTransform, contactRegion, FACE_SX, FOCUS, FOCUS_SY, View, WCOL, WEDGE_CAM, WedgeContent, WedgeSplit, WedgeState, WedgeView} from './Wedge8';

export const MOL = {
  R: 0.17, // glass atom (O) radius, nm (as drawn)
  Rs: 0.12, // glass atom (Si) radius
  colX: 0.31, // glass column spacing
  rowY: 0.36, // glass row spacing
  Rp: 0.155, // polymer backbone bead radius (Si)
  Ro: 0.115, // polymer backbone bead radius (O)
  chainX: 0.42, // chain spacing
  beadY: 0.29, // bead spacing along a chain
  gap0: 1.8, // close 0: the readable gap (nm, face to face)
  gap1: 0.3, // close 1: contact distance
  reach: 0.95, // attraction marks appear only between faces closer than this (nm)
};
/** the gap (nm) between the glass's outer atom faces and the silicone's, for close 0..1 (linear: ease it outside) */
export const molGapNm = (close: number) => lerp(MOL.gap0, MOL.gap1, clamp(close));

const MC = {
  glassO: '#ADDCD8',
  glassSi: '#77B2B5',
  glassBulk: '#86C2C2',
  poly: '#E3EDEE',
  polyO: '#C9D9DC',
  polyBulk: '#C3D5D8',
  backbone: '#8EA6AD',
  mark: '#F4FBF8',
};
/** the surface layer carries full contrast; deeper atoms sink toward the bulk tone (the surfaces stay the subject) */
const depthK = (j: number) => (j <= 0 ? 1 : j === 1 ? 0.55 : 0.3);
const gFill = (si: boolean, j: number) => mix(MC.glassBulk, si && j < 2 ? MC.glassSi : MC.glassO, 0.25 + 0.75 * depthK(j));
const pFill = (o: boolean, c: number) => mix(MC.polyBulk, o && c < 2 ? MC.polyO : MC.poly, 0.25 + 0.75 * depthK(c));
const sm = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mkF = (z: number, org: V) => {
  const dp = Math.max(2, Math.min(9, Math.ceil(Math.log10(Math.max(1, z))) + 2));
  const n = (v: number) => (Math.abs(v) < 0.5 * 10 ** -dp ? '0' : v.toFixed(dp));
  return {n, x: (v: number) => n(v - org.x), y: (v: number) => n(v - org.y), dp};
};

// the glass lattice: column j (0 = the surface), row r. The interior jitter repeats over 6 x 13 cells, so the bulk
// beyond the drawn band can be the same lattice as an SVG pattern (seamless); the surface column is irregular.
const GP = {cols: 6, rows: 13};
const gAtom = (j: number, r: number) => {
  const jj = ((j % GP.cols) + GP.cols) % GP.cols, rr = ((r % GP.rows) + GP.rows) % GP.rows;
  const key = j === 0 ? r * 7 + 3 : jj * 131 + rr * 17 + 5;
  const si = hash(key, 11) < 0.32;
  const rad = si ? MOL.Rs : MOL.R;
  const x = j === 0 ? -rad - 0.05 * hash(key, 12) : -MOL.R - j * MOL.colX + 0.07 * (hash(key, 13) - 0.5);
  const y = r * MOL.rowY + (j % 2 ? MOL.rowY / 2 : 0) + 0.07 * (hash(key, 14) - 0.5);
  return {x, y, rad, si, key};
};
// polymer chains: chain c (0 = the surface chain) at x = gap + ..., beads every beadY; periodic over 4 chains x 12 beads
const PP = {chains: 4, beads: 12};
const PH = PP.beads * MOL.beadY;
const chainX = (c: number, y: number, gap: number) => {
  if (c === 0) return gap + MOL.Rp + 0.04 * (0.5 + 0.5 * Math.sin((2 * Math.PI * 2 * y) / PH + 0.7));
  const cc = ((c % PP.chains) + PP.chains) % PP.chains;
  return gap + MOL.Rp + c * MOL.chainX + 0.09 * Math.sin((2 * Math.PI * (1 + (cc % 2)) * y) / PH + cc * 1.9);
};
const bead = (c: number, b: number, gap: number) => {
  const cc = ((c % PP.chains) + PP.chains) % PP.chains;
  const y = b * MOL.beadY + cc * 0.11;
  const o = ((b % 2) + 2) % 2 === 1;
  return {x: chainX(c, y, gap), y, rad: o ? MOL.Ro : MOL.Rp, o};
};

/** small thermal jiggle (nm) of atom `key` at time t (s); subordinate by design */
const jig = (key: number, t: number, amp: number) =>
  amp === 0 ? {x: 0, y: 0} : {x: amp * Math.sin(t * (9 + 5 * hash(key, 21)) + 6.28 * hash(key, 22)), y: amp * Math.sin(t * (8 + 5 * hash(key, 23)) + 6.28 * hash(key, 24))};

/** the molecular contact in nm (x = 0 the glass's outer atom faces). `z`: screen px per nm; `view`: the nm rect to
 *  cover; `org`: output origin; `t`: seconds (only for the tiny jiggle and the flicker of the marks). */
export const MolContent: React.FC<{id: string; close: number; z: number; view: View; org?: V; t?: number; bg?: boolean}> = ({id, close, z, view, org = {x: 0, y: 0}, t, bg = true}) => {
  const f = mkF(z, org);
  const gap = molGapNm(close);
  const ink = 1.5 / z;
  // jiggle only when a time is given (so there is no jump at t = 0)
  const amp = t === undefined ? 0 : 0.012;
  const tt = t ?? 0;
  const detail = z >= 45; // highlights and outlines only once the atoms are big enough to carry them
  // the band of explicitly drawn atoms on each side of the gap; beyond it, the same lattice as a pattern
  const band = clamp((5.6 * z) / 160, 1.1, 5.6);
  const r0 = Math.floor(view.y0 / MOL.rowY) - 2, r1 = Math.ceil(view.y1 / MOL.rowY) + 2;
  const jMax = Math.min(Math.ceil(band / MOL.colX), Math.ceil((-view.x0 - MOL.R) / MOL.colX) + 1);
  const Jx = jMax + (jMax % 2); // even, so the pattern's column parity matches
  const glass: React.ReactNode[] = [];
  const surfG: {x: number; y: number; rad: number}[] = [];
  if (view.x0 < 0.2)
    for (let j = 0; j < Jx; j++)
      for (let r = r0; r <= r1; r++) {
        const a = gAtom(j, r);
        const d = jig(a.key, tt, amp);
        const x = a.x + d.x, y = a.y + d.y;
        if (j === 0) surfG.push({x, y, rad: a.rad});
        glass.push(
          <circle key={`g${j}_${r}`} cx={f.x(x)} cy={f.y(y)} r={f.n(a.rad)} fill={gFill(a.si, j)} stroke={detail ? INK : 'none'} strokeWidth={f.n(ink * (j === 0 ? 1.15 : 1))} strokeOpacity={j === 0 ? 0.8 : 0.28} />,
        );
        if (detail && !a.si && j < 2) glass.push(<circle key={`gh${j}_${r}`} cx={f.x(x - a.rad * 0.33)} cy={f.y(y - a.rad * 0.33)} r={f.n(a.rad * 0.3)} fill="#F2FFFD" opacity={j === 0 ? 0.75 : 0.3} />);
      }
  // the glass pattern (columns Jx.. beyond the band)
  const gTileW = GP.cols * MOL.colX, gTileH = GP.rows * MOL.rowY;
  const gx0 = -MOL.R - (Jx - 0.5) * MOL.colX; // the pattern's right edge (between column Jx-1 and Jx)
  const gTile: React.ReactNode[] = [];
  for (let jj = 0; jj < GP.cols; jj++)
    for (let rr = -1; rr <= GP.rows; rr++) {
      const a = gAtom(Jx + jj, rr);
      // tile-local: x measured from the tile's left edge (the tile spans columns Jx+5 .. Jx going right)
      const lx = a.x - (gx0 - gTileW);
      gTile.push(<circle key={`t${jj}_${rr}`} cx={f.n(lx)} cy={f.n(a.y)} r={f.n(a.rad)} fill={gFill(a.si, 9)} stroke={detail ? INK : 'none'} strokeWidth={f.n(ink)} strokeOpacity={0.28} />);
    }
  // polymer: explicit chains within the band, a pattern beyond
  const pRight = gap + MOL.Rp + band;
  const cMax = Math.max(1, Math.min(Math.ceil((pRight - gap) / MOL.chainX), Math.ceil((view.x1 - gap) / MOL.chainX) + 1));
  const Cx = Math.ceil(cMax / PP.chains) * PP.chains; // whole tiles, so the pattern starts on chain 0 of a tile
  const b0 = Math.floor(view.y0 / MOL.beadY) - 2, b1 = Math.ceil(view.y1 / MOL.beadY) + 2;
  const chains: React.ReactNode[] = [];
  const beads: React.ReactNode[] = [];
  const surfP: {x: number; y: number; rad: number; key: number}[] = [];
  if (view.x1 > gap - 0.2)
    for (let c = 0; c < Cx; c++) {
      const pts: V[] = [];
      for (let b = b0; b <= b1; b++) {
        const q = bead(c, b, gap);
        const key = c * 1009 + b * 7 + 1;
        const d = jig(key, tt, amp);
        const p = {x: q.x + d.x, y: q.y + d.y};
        pts.push(p);
        if (c === 0) surfP.push({x: p.x, y: p.y, rad: q.rad, key});
        beads.push(<circle key={`p${c}_${b}`} cx={f.x(p.x)} cy={f.y(p.y)} r={f.n(q.rad)} fill={pFill(q.o, c)} stroke={detail ? INK : 'none'} strokeWidth={f.n(ink * (c === 0 ? 1.15 : 1))} strokeOpacity={c === 0 ? 0.75 : 0.25} />);
        if (detail && !q.o && c < 2) beads.push(<circle key={`ph${c}_${b}`} cx={f.x(p.x - q.rad * 0.33)} cy={f.y(p.y - q.rad * 0.33)} r={f.n(q.rad * 0.3)} fill="#FFFFFF" opacity={c === 0 ? 0.8 : 0.3} />);
      }
      chains.push(<path key={`c${c}`} d={`M${pts.map((p) => `${f.x(p.x)},${f.y(p.y)}`).join(' L')}`} fill="none" stroke={mix(MC.polyBulk, MC.backbone, 0.3 + 0.7 * depthK(c))} strokeWidth={f.n(0.07)} />);
    }
  const pTileW = PP.chains * MOL.chainX;
  const pTile: React.ReactNode[] = [];
  for (let c = 0; c < PP.chains; c++) {
    const pts: V[] = [];
    for (let b = -1; b <= PP.beads + 1; b++) {
      const q = bead(Cx + c, b, gap);
      const lx = q.x - (gap + MOL.Rp + Cx * MOL.chainX - MOL.chainX / 2);
      pts.push({x: lx, y: q.y});
      pTile.push(<circle key={`pt${c}_${b}`} cx={f.n(lx)} cy={f.n(q.y)} r={f.n(q.rad)} fill={pFill(q.o, 9)} stroke={detail ? INK : 'none'} strokeWidth={f.n(ink)} strokeOpacity={0.25} />);
    }
    pTile.unshift(<path key={`pc${c}`} d={`M${pts.map((p) => `${f.n(p.x)},${f.n(p.y)}`).join(' L')}`} fill="none" stroke={mix(MC.polyBulk, MC.backbone, 0.3 + 0.7 * depthK(9))} strokeWidth={f.n(0.07)} />);
  }
  const px0 = gap + MOL.Rp + Cx * MOL.chainX - MOL.chainX / 2;
  // attraction marks: each surface bead of the silicone with its nearest surface atom of the glass, only when close
  const marks: React.ReactNode[] = [];
  const mw = 2.5 / z;
  surfP.forEach((b, i) => {
    let best = surfG[0], dBest = 1e9;
    for (const a of surfG) {
      if (Math.abs(a.y - b.y) > 0.8) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y) - a.rad - b.rad;
      if (d < dBest) {
        dBest = d;
        best = a;
      }
    }
    if (!best || dBest > MOL.reach) return;
    const k = sm(MOL.reach, MOL.gap1 + 0.05, dBest);
    const flick = t === undefined ? 1 : 0.82 + 0.18 * Math.sin(tt * 7 + 6.28 * hash(b.key, 31));
    const o = 0.72 * k * flick;
    if (o < 0.02) return;
    const ux = b.x - best.x, uy = b.y - best.y, ul = Math.hypot(ux, uy) || 1;
    const A = {x: best.x + (ux / ul) * best.rad, y: best.y + (uy / ul) * best.rad};
    const Bp = {x: b.x - (ux / ul) * b.rad, y: b.y - (uy / ul) * b.rad};
    const seg = (s0: number, s1: number) => `M${f.x(lerp(A.x, Bp.x, s0))},${f.y(lerp(A.y, Bp.y, s0))} L${f.x(lerp(A.x, Bp.x, s1))},${f.y(lerp(A.y, Bp.y, s1))}`;
    marks.push(<path key={`m${i}`} d={`${seg(0.1, 0.3)} ${seg(0.41, 0.59)} ${seg(0.7, 0.9)}`} stroke={MC.mark} strokeWidth={f.n(mw)} strokeLinecap="round" opacity={o} />);
  });
  const yA = view.y0 - 1, yB = view.y1 + 1;
  const rect = (x0: number, x1: number) => `M${f.x(x0)},${f.y(yA)} L${f.x(x1)},${f.y(yA)} L${f.x(x1)},${f.y(yB)} L${f.x(x0)},${f.y(yB)} Z`;
  const xL = Math.min(view.x0 - 1, -2), xR = Math.max(view.x1 + 1, gap + 2);
  return (
    <g>
      <defs>
        <pattern id={`${id}-gp`} patternUnits="userSpaceOnUse" x={f.x(gx0 - gTileW)} y={f.y(0)} width={f.n(gTileW)} height={f.n(gTileH)}>
          <rect x={0} y={0} width={f.n(gTileW)} height={f.n(gTileH)} fill={MC.glassBulk} />
          {gTile}
        </pattern>
        <pattern id={`${id}-pp`} patternUnits="userSpaceOnUse" x={f.x(px0)} y={f.y(0)} width={f.n(pTileW)} height={f.n(PH)}>
          <rect x={0} y={0} width={f.n(pTileW)} height={f.n(PH)} fill={MC.polyBulk} />
          {pTile}
        </pattern>
      </defs>
      {bg && <path d={rect(xL, xR)} fill={WCOL.ground} />}
      {/* the bulk behind each surface */}
      <path d={rect(xL, -MOL.R * 0.6)} fill={MC.glassBulk} />
      <path d={rect(xL, gx0)} fill={`url(#${id}-gp)`} />
      <path d={rect(gap + MOL.Rp * 0.6, xR)} fill={MC.polyBulk} />
      {px0 < xR && <path d={rect(px0, xR)} fill={`url(#${id}-pp)`} />}
      {glass}
      {chains}
      {beads}
      {marks}
    </g>
  );
};

/** the molecular view's camera: the glass face at x = FACE_SX and the contact point (0, 0) at FOCUS_SY on screen, as
 *  in the section, so the move between the scales holds the contact line still */
export const MOL_Z = 160; // px per nm
export const MOL_CAM: Cam = {x: -(FACE_SX - W / 2) / MOL_Z, y: -(FOCUS_SY - H / 2) / MOL_Z, z: MOL_Z};
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

const sm5 = (x: number) => {
  const t = clamp(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
/** the move between scales at u (0..1): the section camera (um), the molecular camera (nm), the dissolve (0: all
 *  section, 1: all molecules) and the contact point P (um) that both share. */
export const wedgeToMolCams = (u: number, focus = FOCUS, cam0: Cam = WEDGE_CAM, camMol: Cam = MOL_CAM, close = 0) => {
  const st: WedgeState = {surface: 'glass', approach: 1, shear: 1, focus, molGap: molGapNm(close) / 1000};
  const P = {x: 0, y: contactRegion(st, focus).mid.y};
  const e = sm5(u);
  const z0 = cam0.z, z1 = camMol.z * 1000;
  const z = Math.exp(lerp(Math.log(z0), Math.log(z1), e));
  // the contact point's screen position glides from where the section has it to where the molecular view has it
  const s0 = {x: W / 2 + (P.x - cam0.x) * z0, y: H / 2 + (P.y - cam0.y) * z0};
  const s1 = {x: W / 2 - camMol.x * camMol.z, y: H / 2 - camMol.y * camMol.z};
  const s = {x: lerp(s0.x, s1.x, e), y: lerp(s0.y, s1.y, e)};
  const sec: Cam = {x: P.x - (s.x - W / 2) / z, y: P.y - (s.y - H / 2) / z, z};
  const mol: Cam = {x: (sec.x - P.x) * 1000, y: (sec.y - P.y) * 1000, z: z / 1000};
  // the dissolve, at matched geometry, while the atoms grow from texture (15 px/nm) to readable (80 px/nm)
  const mix01 = sm(Math.log(15), Math.log(80), Math.log(mol.z));
  return {sec, mol, mix: mix01, P, st, e};
};

/** the purposeful move from the section into one contact region (u 0 -> 1) and back out (u 1 -> 0). u = 0 is exactly
 *  WedgeView({glass, approach 1, shear 1, focus}) through cam0; u = 1 is exactly MolView(close) through camMol.
 *  `close` is the molecular state carried through the move (0 on the way in, 1 for the pull-out after the attraction). */
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
          <MolContent id={`${id}-m`} close={close} z={c.mol.z} view={viewOfNm(c.mol)} t={t} />
        </g>
      )}
    </g>
  );
};


// ------------------------------------------------------------------ the recommended timeline (reference driver)
/** keyed scalar: [frame, value][] with smootherstep segments (holds before the first / after the last key) */
const keyF = (f: number, keys: [number, number][]) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++)
    if (f <= keys[i][0]) {
      const [f0, a] = keys[i - 1], [f1, b] = keys[i];
      return lerp(a, b, sm5((f - f0) / (f1 - f0 || 1)));
    }
  return keys[keys.length - 1][1];
};
/** the beat's parameters at film frame f (30 fps): a reference the integrator can use as is or re-time.
 *  222-273 section, unloaded, tips settle onto the glass; 273-350 the pull (shear 0 -> 1, the camera holds);
 *  360-388 the focus wedge is singled out; 388-428 the move into its contact (u 0 -> 1); 432-466 the gap closes and
 *  the attraction marks come up; 473-500 the pull back out (u 1 -> 0, close 1). Later: 930-954 the glass section at
 *  full contact; 1041-1095 the split: glass loads; brick approaches, loads, then slips. */
export const microBeat8 = (f: number) => {
  const approach = keyF(f, [[222, 0.55], [248, 1]]);
  const shear = keyF(f, [[273, 0], [352, 1]]);
  const focusK = keyF(f, [[360, 0], [386, 1]]);
  const u = f < 473 ? keyF(f, [[388, 0], [428, 1]]) : keyF(f, [[473, 1], [500, 0]]);
  const close = f < 473 ? keyF(f, [[432, 0], [466, 1]]) : 1;
  const t = Math.max(0, (f - 388) / 30);
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
  if (p.u > 0 && f >= 388) {
    if (p.u >= 1) return <MolView id={id} close={p.close} t={p.t} />;
    return <WedgeToMol id={id} u={p.u} close={p.close} t={p.t} />;
  }
  return <WedgeView id={id} st={{surface: 'glass', approach: p.approach, shear: p.shear, focus: FOCUS, focusK: p.focusK}} cam={WEDGE_CAM} />;
};
