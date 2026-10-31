// V4 depth for the muscle world.
//  - FarFibres / NearFibres: parallax layers behind and in front of the main fibre plane (2.5D: they move at different
//    rates as the camera travels, the near ones large and soft), so the camera flies between fibres.
//  - Bundle3D: the hero fascicle as real cylinders on a hexagonal grid, seen under a yaw angle. At 0 deg they are the
//    familiar side-on fibres; at 90 deg we look at their cut ends: the cross-section. The rotation is projected, not faked.
//  - CrossSection: the whole muscle cut across: fascicles (each a bundle of fibre ends) inside perimysium, inside the
//    epimysium, drawn coarse-to-fine; the hero fascicle is the Bundle3D at 90 deg.
import React from 'react';
import {pt} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash} from '../lib';
import {Cam} from './micro';

const PAL = {fib: '#CF3C45', lit: '#F07A78', dk: '#7E1724', fluid: '#2A0A17', peri: '#F2C9C2', end: '#9C2230'};

export const FarFibres: React.FC<{cam: Cam; t: number; op?: number}> = ({cam, t, op = 1}) => {
  const vh = cam.w * (16 / 9);
  const y0 = cam.y - vh * 0.6, y1 = cam.y + vh * 0.6;
  const pitch = 64;
  const rows: React.ReactNode[] = [];
  for (let k = Math.floor(y0 / pitch); k <= Math.ceil(y1 / pitch); k++) {
    const y = k * pitch + 14 * Math.sin(k * 1.7);
    const r = 20 + 6 * hash(k * 3.1);
    rows.push(<rect key={k} x={cam.x - cam.w} y={y - r} width={cam.w * 2} height={2 * r} rx={r} fill={mix(PAL.dk, PAL.fluid, 0.35 + 0.3 * hash(k))} />);
    rows.push(<rect key={`h${k}`} x={cam.x - cam.w} y={y - r * 0.6} width={cam.w * 2} height={r * 0.35} fill={PAL.lit} opacity={0.12} />);
  }
  void t;
  return <g opacity={op}>{rows}</g>;
};
export const NearFibres: React.FC<{cam: Cam; t: number; op?: number}> = ({cam, t, op = 1}) => {
  // two big soft fibres very near the lens, at the top and bottom of the frame, drifting
  const vh = cam.w * (16 / 9);
  return (
    <g opacity={op}>
      {[-0.38, 0.4].map((k, i) => {
        const y = cam.y + k * vh + 10 * Math.sin(t * 0.8 + i);
        const r = cam.w * 0.12;
        return <rect key={i} x={cam.x - cam.w} y={y - r} width={cam.w * 2} height={2 * r} rx={r} fill={i ? '#5E0E1C' : '#6E1422'} opacity={0.85} />;
      })}
    </g>
  );
};

export type Bundle = {theta: number; g: number; gN: number; t: number};
const N = 7;
const PITCH = 80;
/** hexagonal grid of fibres around the hero (0,0): (y, z) and radius */
export const bundleGrid = (b: Bundle) => {
  const out: {i: number; j: number; y: number; z: number; r: number; hero: boolean}[] = [];
  for (let j = -N; j <= N; j++) {
    for (let i = -N; i <= N; i++) {
      const hero = i === 0 && j === 0;
      const sc = hero ? b.g : b.gN;
      const y = (i + (j % 2 ? 0.5 : 0)) * PITCH * Math.max(1, 0.55 + 0.45 * b.gN);
      const z = j * PITCH * 0.866 * Math.max(1, 0.55 + 0.45 * b.gN);
      if (Math.hypot(y, z) > 560 * Math.max(1, 0.55 + 0.45 * b.gN)) continue;
      out.push({i, j, y, z, r: 30 * sc * (hero ? 1 : 0.9 + 0.16 * hash(i * 7.1 + j * 3.3)), hero});
    }
  }
  return out;
};
export const Bundle3D: React.FC<{b: Bundle; cam: Cam; bg?: boolean}> = ({b, cam, bg = true}) => {
  const th = (clamp(b.theta) * Math.PI) / 2;
  const c = Math.cos(th), s = Math.sin(th);
  const L = 1600;
  const fibres = bundleGrid(b).sort((a, q) => q.z * c - a.z * c);
  const idG = uid('b3g'), idE = uid('b3e'), idS = uid('b3s');
  const strOp = clamp(c * 1.4);
  return (
    <g>
      <defs>
        <linearGradient id={idG} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={mix(PAL.dk, '#000000', 0.2)} />
          <stop offset={0.18} stopColor={PAL.fib} />
          <stop offset={0.3} stopColor={mix(PAL.lit, '#FFFFFF', 0.15)} />
          <stop offset={0.55} stopColor={PAL.fib} />
          <stop offset={1} stopColor={mix(PAL.dk, '#000000', 0.5)} />
        </linearGradient>
        <pattern id={idS} patternUnits="userSpaceOnUse" width={10 * Math.max(0.05, c)} height={200}>
          <rect x={0} y={0} width={5.6 * Math.max(0.05, c)} height={200} fill={PAL.dk} opacity={0.45} />
        </pattern>
        {/* a fibre's cut end: myofibrils seen end-on */}
        <pattern id={idE} patternUnits="userSpaceOnUse" width={7} height={6.1}>
          <circle cx={1.8} cy={1.5} r={1.5} fill="#E25A63" />
          <circle cx={5.3} cy={4.55} r={1.5} fill="#E25A63" />
        </pattern>
      </defs>
      {bg && <rect x={cam.x - cam.w} y={cam.y - cam.w * 1.8} width={cam.w * 2} height={cam.w * 3.6} fill={PAL.fluid} />}
      {fibres.map((f, k) => {
        const X0 = (-L / 2) * c + f.z * s, X1 = (L / 2) * c + f.z * s;
        const depth = f.z * c;
        const dk = clamp(0.25 + depth / 900, 0, 0.75) * (1 - s * 0.85);
        return (
          <g key={k}>
            {c > 0.01 && (
              <g>
                <rect x={X0} y={f.y - f.r} width={Math.max(0, X1 - X0)} height={2 * f.r} fill={`url(#${idG})`} />
                {strOp > 0.02 && <rect x={X0} y={f.y - f.r} width={Math.max(0, X1 - X0)} height={2 * f.r} fill={`url(#${idS})`} opacity={strOp * 0.6} />}
              </g>
            )}
            {s > 0.01 && (
              <g>
                <ellipse cx={X1} cy={f.y} rx={f.r * s} ry={f.r} fill={PAL.end} />
                <ellipse cx={X1} cy={f.y} rx={f.r * s * 0.9} ry={f.r * 0.9} fill={`url(#${idE})`} opacity={s} />
                <ellipse cx={X1} cy={f.y} rx={f.r * s} ry={f.r} fill="none" stroke="#FFD0CC" strokeWidth={2.2} opacity={0.75} />
                {f.hero && <ellipse cx={X1} cy={f.y} rx={f.r * s + 4} ry={f.r + 4} fill="none" stroke="#FFE2A0" strokeWidth={2} opacity={0.5 * s} />}
              </g>
            )}
            {dk > 0.01 && <rect x={Math.min(X0, X1 - f.r * s)} y={f.y - f.r} width={Math.max(0, X1 - X0) + f.r * s * 2} height={2 * f.r} fill="#14020A" opacity={dk} />}
          </g>
        );
      })}
    </g>
  );
};

/** the whole muscle cut across: fascicles packed inside the epimysium; the hero fascicle drawn by Bundle3D */
export const MUSCLE_RX = 9000, MUSCLE_RY = 6600;
export const CrossSection: React.FC<{cam: Cam; b: Bundle}> = ({cam, b}) => {
  const sc = 1080 / cam.w;
  const idP = uid('csp'), idC = uid('csc'), idF = uid('csf');
  const fr = 560 * Math.max(1, 0.55 + 0.45 * b.gN);
  const fasc: React.ReactNode[] = [];
  const pitch = fr * 2.08;
  const vh = cam.w * (16 / 9);
  const inView = (x: number, y: number, r: number) => Math.abs(x - cam.x) < cam.w * 0.6 + r && Math.abs(y - cam.y) < vh * 0.6 + r;
  const dotsOp = clamp((60 * sc - 1.5) / 3);
  for (let j = -12; j <= 12; j++) {
    for (let i = -12; i <= 12; i++) {
      if (i === 0 && j === 0) continue;
      const x = (j + (i % 2 ? 0.5 : 0)) * pitch + 60 * (hash(i * 3 + j) - 0.5), y = i * pitch * 0.87 + 60 * (hash(i + j * 7) - 0.5);
      if ((x / MUSCLE_RX) ** 2 + (y / MUSCLE_RY) ** 2 > 0.92) continue;
      const r = fr * (0.86 + 0.2 * hash(i * 1.3 + j * 2.9));
      if (!inView(x, y, r)) continue;
      fasc.push(
        <g key={`${i}_${j}`}>
          <circle cx={x} cy={y} r={r} fill={mix(PAL.end, PAL.dk, 0.25 * hash(i + j))} />
          {dotsOp > 0.01 && <circle cx={x} cy={y} r={r * 0.96} fill={`url(#${idP})`} opacity={dotsOp} />}
          <circle cx={x - r * 0.25} cy={y - r * 0.3} r={r * 0.55} fill="#FF8A8A" opacity={0.12} />
        </g>,
      );
    }
  }
  return (
    <g>
      <defs>
        <pattern id={idP} patternUnits="userSpaceOnUse" width={PITCH} height={PITCH * 1.732}>
          {[[PITCH / 2, PITCH * 0.433], [0, PITCH * 1.299], [PITCH, PITCH * 1.299]].map(([x, y], k) => (
            <g key={k}>
              <circle cx={x} cy={y} r={30} fill={PAL.fib} />
              <circle cx={x} cy={y} r={30} fill="none" stroke="#FFD0CC" strokeWidth={2} opacity={0.5} />
            </g>
          ))}
        </pattern>
        <clipPath id={idC}><ellipse cx={0} cy={0} rx={MUSCLE_RX} ry={MUSCLE_RY} /></clipPath>
        <radialGradient id={idF} cx="0.4" cy="0.35" r="0.7">
          <stop offset={0} stopColor="#F6DCD6" />
          <stop offset={1} stopColor="#D9A9A2" />
        </radialGradient>
      </defs>
      {/* the epimysium round the whole muscle, and the perimysium between fascicles */}
      <ellipse cx={0} cy={0} rx={MUSCLE_RX + 260} ry={MUSCLE_RY + 260} fill="#FFF1EC" />
      <ellipse cx={0} cy={0} rx={MUSCLE_RX} ry={MUSCLE_RY} fill={`url(#${idF})`} />
      <g clipPath={`url(#${idC})`}>{fasc}</g>
      {/* the hero fascicle: its fibres end-on */}
      <circle cx={0} cy={0} r={fr + 40} fill={PAL.fluid} />
      <Bundle3D b={{...b, theta: 1}} cam={cam} bg={false} />
      <circle cx={0} cy={0} r={fr + 40} fill="none" stroke={PAL.peri} strokeWidth={60} />
      <ellipse cx={-MUSCLE_RX * 0.3} cy={-MUSCLE_RY * 0.45} rx={MUSCLE_RX * 0.5} ry={MUSCLE_RY * 0.25} fill="#FFFFFF" opacity={0.06} />
      {void pt}
    </g>
  );
};
