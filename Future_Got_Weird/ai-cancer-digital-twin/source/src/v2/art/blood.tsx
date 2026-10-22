// Blood scale. The vessel interior is a side view of a tube along +x (vessel units: red blood cell ≈ 80 across,
// a migrating cancer cell r≈95, a vein lumen radius ≈ 560). Three depth layers of red blood cells (far, mid, near)
// parallax around the same camera; the back wall carries elongated endothelial cells. Flow is +x.
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {rand, mixHex, noise, smooth, clamp01, lerp} from '../../kit/core';
import {P} from '../palette';

/** Biconcave red blood cell; tilt 0 = face-on (disc with central dimple), 1 = edge-on (dumbbell). */
export const RBC: React.FC<{x: number; y: number; r?: number; tilt?: number; rot?: number; dark?: number}> = ({x, y, r = 40, tilt = 0, rot = 0, dark = 0}) => {
  const ry = r * lerp(1, 0.32, tilt);
  const c = mixHex(P.rbc, '#2A0008', dark), cl = mixHex(P.rbcLight, '#3A0A10', dark), cd = mixHex(P.rbcDeep, '#1A0004', dark);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <ellipse rx={r} ry={ry} fill={cd} />
      <ellipse rx={r * 0.94} ry={ry * 0.9} fill={c} />
      <ellipse rx={r * 0.94} ry={ry * 0.9} fill="url(#vol)" opacity={0.8} />
      {tilt < 0.75 ? (
        <ellipse cx={r * 0.04} cy={ry * 0.05} rx={r * 0.44} ry={ry * 0.42} fill={cd} opacity={0.55 * (1 - tilt)} />
      ) : (
        <ellipse rx={r * 0.25} ry={ry * 0.55} fill={cd} opacity={0.4} />
      )}
      <ellipse cx={-r * 0.3} cy={-ry * 0.42} rx={r * 0.3} ry={ry * 0.16} fill={cl} opacity={0.55} />
    </g>
  );
};

/** Deterministic RBC stream in a horizontal strip; returns elements in the camera's view. */
const stream = (cam: Cam, depth: number, t: number, flow: number, lum: (x: number) => number, seed: number, r: number, spacing: number, dark: number, maxN = 140) => {
  const z = cam.z * depth;
  const hw = W / 2 / z + r * 2;
  const out: React.ReactNode[] = [];
  const shift = flow * t;
  const i0 = Math.floor((cam.x - hw - shift) / spacing), i1 = Math.ceil((cam.x + hw - shift) / spacing);
  for (let i = i0; i <= i1 && out.length < maxN; i++) {
    for (let k = 0; k < 3; k++) {
      const sd = (((i % 997) + 997) % 997) * 7 + k * 131 + seed;
      const x = i * spacing + rand(sd) * spacing + shift + 30 * noise(t * 0.8 + sd, seed);
      const L = lum(x);
      const y = (rand(sd + 1) * 2 - 1) * (L - r * 1.1) + 20 * noise(t * 0.6 + sd * 0.3, seed + 1);
      const tilt = clamp01(0.5 + 0.5 * Math.sin(t * (0.8 + rand(sd + 2)) + sd));
      out.push(<RBC key={`${i}-${k}`} x={x} y={y} r={r * (0.9 + 0.2 * rand(sd + 3))} tilt={tilt} rot={rand(sd + 4) * 180 + t * 30 * (rand(sd + 5) - 0.5)} dark={dark} />);
    }
  }
  return out;
};

export type TunnelProps = {
  cam: Cam; t: number;
  lumen?: (x: number) => number;   // lumen radius along x
  flow?: number;                    // RBC speed (units/s, world frame)
  wallFlow?: number;                // not used: walls are static in the world frame
  children?: React.ReactNode;       // things inside the lumen at the mid depth (drawn between RBC layers)
  front?: React.ReactNode;
  tint?: number;                    // 0..1 tumour-ward tint of the plasma (leaky tumour vessel)
};
/** Vessel interior world. */
export const BloodTunnel: React.FC<TunnelProps> = ({cam, t, lumen = () => 560, flow = 420, children, front, tint = 0}) => {
  const z = cam.z;
  const hw = W / 2 / z + 400;
  // back wall: endothelial cells (long, flat, with nuclei) at depth 0.55
  const bd = 0.55;
  const bcam = cam;
  const endo: React.ReactNode[] = [];
  const S = 360;
  const bz = cam.z * bd, bhw = W / 2 / bz + 400;
  for (let i = Math.floor((cam.x - bhw) / S); i <= Math.ceil((cam.x + bhw) / S); i++)
    for (let j = -3; j <= 3; j++) {
      const sd = (((i % 499) + 499) % 499) * 13 + j * 7;
      const x = i * S + (j % 2 ? S / 2 : 0), y = j * 210 + 30 * rand(sd);
      endo.push(
        <g key={`${i},${j}`}>
          <ellipse cx={x} cy={y} rx={S * 0.56} ry={100} fill={mixHex('#B83A48', '#8E2236', rand(sd + 1))} />
          <ellipse cx={x + 30 * rand(sd + 2)} cy={y} rx={60} ry={26} fill="#7A1A2C" opacity={0.75} />
        </g>,
      );
    }
  // wall edges (top and bottom) in the main plane
  const edge = (sgn: number) => {
    const pts: string[] = [];
    for (let x = cam.x - hw; x <= cam.x + hw; x += 40) pts.push(`${x.toFixed(0)} ${(sgn * lumen(x) + sgn * 8 * Math.sin(x * 0.02)).toFixed(1)}`);
    const far = sgn * 4000;
    return `M ${pts[0].split(' ')[0]} ${far} L ${pts.join(' L ')} L ${pts[pts.length - 1].split(' ')[0]} ${far} Z`;
  };
  const lum = (x: number) => lumen(x);
  return (
    <g>
      <rect width={W} height={H} fill={mixHex(P.blood, '#5A0A2A', tint * 0.6)} />
      <g transform={camTransform(bcam, bd)}>{endo}</g>
      <rect width={W} height={H} fill={mixHex(P.bloodDeep, '#3A0628', tint * 0.6)} opacity={0.45} />
      <g transform={camTransform(cam, 0.72)}>{stream(cam, 0.72, t, flow * 0.8, (x) => lum(x) * 1.2, 11, 34, 150, 0.45)}</g>
      <g transform={camTransform(cam)}>
        {stream(cam, 1, t, flow, lum, 23, 42, 230, 0.12)}
        {children}
      </g>
      <g transform={camTransform(cam)}>
        <path d={edge(-1)} fill="#4A0E1C" />
        <path d={edge(1)} fill="#4A0E1C" />
        <path d={edge(-1)} fill="none" stroke={P.vesselWall} strokeWidth={46} />
        <path d={edge(1)} fill="none" stroke={P.vesselWall} strokeWidth={46} />
        <path d={edge(-1)} fill="none" stroke={P.vesselWallLight} strokeWidth={8} opacity={0.6} transform="translate(0 14)" />
        <path d={edge(1)} fill="none" stroke={P.vesselWallLight} strokeWidth={8} opacity={0.5} transform="translate(0 -14)" />
      </g>
      <g transform={camTransform(cam, 1.45)}>{stream(cam, 1.45, t, flow * 1.25, (x) => lum(x) * 0.9, 37, 52, 520, 0.0, 18)}</g>
      {front && <g transform={camTransform(cam)}>{front}</g>}
      <rect width={W} height={H} fill="url(#vig2)" />
    </g>
  );
};
export const _bl = {smooth};
