// Glass Climbing V2: the wedge field in 2.5D. The same wedges as the section (V1 scenes/Micro.tsx, a schematic: thin
// silicone blades about 100 um long), extruded across the tile as ridges, so the camera can look at them from any angle:
// face-on from the glass side (rows of fine ridges, as through the glass), three-quarter (blades with depth, light and
// shadow), or edge-on (the section). Coordinates in microns: x toward the backing (the surface at x <= 0), y down,
// z across the tile. View: yaw `alpha` (0 = from the glass side, 1 = side-on) and pitch `beta` (deg, looking down).
// Surfaces: smooth glass (contact strips run the full length of every ridge) or rough brick (a height field that
// varies along the ridges too: only the few spots on peaks touch, the rest of each ridge hangs over gaps).
import React from 'react';
import {mix, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {clamp, fmt, P, V} from '../dc/math';
import {Cam, Layer} from '../dc/camera';
import {brickX, MW} from '../scenes/Micro';
import {B0, wedgeShape2, WedgeShape} from './microGeo';

const SILK = '#D7E6EA';
const BACK = '#C2D6DC';
const GROUND = '#18232B';

export type FieldState = {
  alpha: number;
  beta: number;
  lam: number;
  surface: 'glass' | 'brick' | 'none';
  gx: number; // the surface's offset (negative: still away from the tips)
  slip: number; // brick: the backing slides down (um)
  back: number; // backing retreat (release)
  y0: number;
  count: number;
  zF: number;
  zN: number;
  /** contact patches' cue on the glass face (0..1) */
  cue?: number;
  /** depth fog over the far ridges (0..1) */
  fog?: number;
};

/** the brick surface across the tile: the section's profile, shifted and scaled along z so peaks come and go */
export const brickXZ = (y: number, z: number) => brickX(y + 160 * Math.sin(z * 0.006 + 0.8) + 0.35 * z) * (0.85 + 0.3 * Math.sin(z * 0.011 + 2));

export const FieldContent: React.FC<{id: string; st: FieldState; z: number; segs?: number}> = ({id, st, z: zoom, segs}) => {
  const a = (clamp(st.alpha) * Math.PI) / 2, b = (st.beta * Math.PI) / 180;
  const sa = Math.sin(a), ca = Math.cos(a), sb = Math.sin(b), cb = Math.cos(b);
  // orthographic yaw + pitch; depth increases away from the viewer
  const pr = (x: number, y: number, zz: number): V => ({x: x * sa + zz * ca, y: y * cb - (x * ca - zz * sa) * sb});
  const ink = (1.1 / Math.max(1e-6, zoom)) * 1.6;
  const shear = MW.shear * st.lam + st.slip;
  const B = B0 - MW.approach * st.lam + st.back;
  const rows = Array.from({length: st.count}).map((_, i) => st.y0 + i * MW.pitch + shear);
  const yTop = st.y0 - 400, yBot = st.y0 + st.count * MW.pitch + 400;
  const brick = st.surface === 'brick';
  const nSeg = segs ?? (brick ? 18 : 1);
  const zs = Array.from({length: nSeg + 1}).map((_, i) => st.zF + ((st.zN - st.zF) * i) / nSeg);
  const surfAt = (zz: number) => (y: number) => (st.surface === 'none' ? -1e6 : brick ? brickXZ(y - st.slip, zz) + st.gx : st.gx);
  const poly = (pts: V[]) => `M${pts.map((p) => P(p)).join(' L')} Z`;
  const ribbon = (line: V[], z0: number, z1: number) => poly([...line.map((p) => pr(p.x, p.y, z0)), ...line.slice().reverse().map((p) => pr(p.x, p.y, z1))]);
  const cap = (s: WedgeShape, zz: number) => poly([...s.left.map((p) => pr(p.x, p.y, zz)), ...s.right.slice().reverse().map((p) => pr(p.x, p.y, zz))]);
  const side = clamp(st.alpha * 2.2 - 0.6); // how much of the blades' cut ends we see (edge-on: all)

  const segment = (j: number) => {
    const z0 = zs[j], z1 = zs[j + 1], zm = (z0 + z1) / 2;
    const surf = surfAt(zm);
    const shapes = rows.map((y) => wedgeShape2({x: B, y}, st.lam, surf, brick ? 0.3 : 1));
    const out: React.ReactNode[] = [];
    // the backing's face in this slab
    out.push(<path key="bk" d={poly([pr(B, yTop, z0), pr(B, yTop, z1), pr(B, yBot, z1), pr(B, yBot, z0)])} fill={shade(BACK, 0.12)} />);
    if (brick) {
      // the brick slab: its rough profile at the slab's near face, filled back to deep inside the brick
      const pts: V[] = [];
      for (let y = yTop; y <= yBot; y += 3) pts.push({x: surf(y), y});
      out.push(<path key="br" d={poly([pr(-1600, yTop, z1), ...pts.map((p) => pr(p.x, p.y, z1)), pr(-1600, yBot, z1)])} fill="#A4573E" stroke={INK} strokeWidth={fmt(ink * 0.8)} />);
      out.push(<path key="brt" d={`M${pts.map((p) => P(pr(p.x, p.y, z1))).join(' L')}`} fill="none" stroke="#E2A07F" strokeWidth={fmt(ink * 1.4)} opacity={0.6} />);
    }
    // wedges, the lowest row first (each overlaps the one beneath it as it lies down)
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      out.push(
        <g key={`w${i}`}>
          <path d={ribbon(s.right, z0, z1)} fill={`url(#${id}-lo)`} stroke={INK} strokeWidth={fmt(ink * 0.6)} strokeLinejoin="round" />
          <path d={ribbon(s.left, z0, z1)} fill={`url(#${id}-up)`} stroke={INK} strokeWidth={fmt(ink * 0.6)} strokeLinejoin="round" />
          {side > 0.01 && <path d={cap(s, z1)} fill={shade(SILK, 0.06)} stroke={INK} strokeWidth={fmt(ink)} opacity={side} strokeLinejoin="round" />}
          {s.strip && (
            // the contact patch: where the blade lies on the surface (dark: light passes into the glass there)
            <path d={poly([pr(s.strip[0].x + 0.2, s.strip[0].y, z0), pr(s.strip[0].x + 0.2, s.strip[0].y, z1), pr(s.strip[1].x + 0.2, s.strip[1].y, z1), pr(s.strip[1].x + 0.2, s.strip[1].y, z0)])}
              fill="#2B5662" opacity={0.75 * Math.min(1, s.l / 0.2)} />
          )}
        </g>,
      );
    }
    return out;
  };
  const slabs: React.ReactNode[] = [];
  for (let j = 0; j < nSeg; j++) slabs.push(<g key={j}>{segment(j)}</g>);
  // the backing's near end and the glass (in front: we look at the blades through it from the glass side)
  const yb0 = yTop, yb1 = yBot;
  const glassFace = poly([pr(st.gx, yb0, st.zF), pr(st.gx, yb0, st.zN), pr(st.gx, yb1, st.zN), pr(st.gx, yb1, st.zF)]);
  const glassEnd = poly([pr(-1600 + st.gx, yb0, st.zN), pr(st.gx, yb0, st.zN), pr(st.gx, yb1, st.zN), pr(-1600 + st.gx, yb1, st.zN)]);
  // the blades' faces: lit near the camera, falling into shadow along the ridge (the key light is upper left)
  const gz0 = pr(0, 0, st.zN), gz1 = pr(0, 0, st.zF);
  const grad = (gid: string, near: string, far: string) => (
    <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={fmt(gz0.x)} y1={fmt(gz0.y)} x2={fmt(gz1.x)} y2={fmt(gz1.y)}>
      <stop offset="0" stopColor={near} />
      <stop offset="1" stopColor={far} />
    </linearGradient>
  );
  return (
    <g>
      <defs>
        {grad(`${id}-up`, mix(SILK, '#FFFFFF', 0.35), mix(shade(SILK, 0.25), '#5E7C86', 0.25 * (1 - side)))}
        {grad(`${id}-lo`, shade(SILK, 0.22), shade(SILK, 0.55))}
      </defs>
      <path d={poly([pr(-3000, yTop - 3000, st.zF), pr(3000, yTop - 3000, st.zF), pr(3000, yBot + 3000, st.zF), pr(-3000, yBot + 3000, st.zF)])} fill={GROUND} />
      {slabs}
      {(st.fog ?? 0) > 0.001 && (
        <path d={poly([pr(-1600, yTop - 2000, st.zF), pr(B + 1200, yTop - 2000, st.zF), pr(B + 1200, yBot + 2000, st.zF), pr(-1600, yBot + 2000, st.zF), pr(-1600, yBot + 2000, st.zN), pr(-1600, yTop - 2000, st.zN)])}
          fill={`url(#${id}-fog)`} />
      )}
      <defs>
        <linearGradient id={`${id}-fog`} gradientUnits="userSpaceOnUse" x1={fmt(pr(0, 0, st.zF).x)} y1={fmt(pr(0, 0, st.zF).y)} x2={fmt(pr(0, 0, st.zN).x)} y2={fmt(pr(0, 0, st.zN).y)}>
          <stop offset="0" stopColor={GROUND} stopOpacity={0.92 * (st.fog ?? 0)} />
          <stop offset="0.65" stopColor={GROUND} stopOpacity={0.25 * (st.fog ?? 0)} />
          <stop offset="1" stopColor={GROUND} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={poly([pr(B, yb0, st.zN), pr(B + 1200, yb0, st.zN), pr(B + 1200, yb1, st.zN), pr(B, yb1, st.zN)])} fill={BACK} opacity={side} />
      {st.surface === 'glass' && (
        <g>
          <defs>
            <linearGradient id={`${id}-ge`} gradientUnits="userSpaceOnUse" x1={fmt(pr(-900 + st.gx, 0, st.zN).x)} y1={fmt(pr(-900 + st.gx, 0, st.zN).y)} x2={fmt(pr(st.gx, 0, st.zN).x)} y2={fmt(pr(st.gx, 0, st.zN).y)}>
              <stop offset="0" stopColor="#2F6A72" />
              <stop offset="0.75" stopColor="#7DBDC0" />
              <stop offset="0.97" stopColor="#B9E6E6" />
              <stop offset="1" stopColor="#D9F6F5" />
            </linearGradient>
          </defs>
          <path d={glassEnd} fill={`url(#${id}-ge)`} opacity={0.92 * side + 0.05} />
          <path d={glassFace} fill="#BFE6E8" opacity={0.18 * (1 - side) + 0.06} />
          <path d={`M${P(pr(st.gx, yb0, st.zN))} L${P(pr(st.gx, yb1, st.zN))}`} stroke="#F4FFFF" strokeWidth={fmt(Math.min(ink * 2, 1.6))} opacity={0.9} />
          <path d={`M${P(pr(st.gx, yb0, st.zF))} L${P(pr(st.gx, yb0, st.zN))} M${P(pr(st.gx, yb1, st.zF))} L${P(pr(st.gx, yb1, st.zN))}`} stroke="#E8FBFB" strokeWidth={fmt(ink)} opacity={0.5} />
        </g>
      )}
      <rect x={-1} y={-1} width={0} height={0} id={id} />
    </g>
  );
};

export const FieldView: React.FC<{id: string; st: FieldState; cam: Cam; segs?: number}> = ({id, st, cam, segs}) => (
  <Layer cam={cam} depth={1}>
    <FieldContent id={id} st={st} z={cam.z} segs={segs} />
  </Layer>
);
