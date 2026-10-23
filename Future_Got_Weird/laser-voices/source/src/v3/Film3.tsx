// FGW "This Laser Makes You Hear Voices" V3: motion, character, sound-design and loop polish on the V2 build.
// One room, one fixed projection (V3: the laser stands on a bench in front of the listener, so source, crossing and
// ear share compact portrait framings), one continuous camera (log-zoom dives), the rebuilt bodies, the mechanism in
// the air beside the ear, the laser head's scanning mirror in true perspective, the obstruction and the loop.
// Picture only: the V3 mix (locked narration + the new motif) is muxed in afterwards (tools/mux_v3.py).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import '../fonts';
import {Pt, P, Cam, camMat, matStr, clamp, lerp, ramp, eio, eout, f3} from './lib3';
import {C, ROOM, LIGHT, AIR} from './theme3';
import {FPS, pp, proj, figXf, EAR, EXIT, v3} from './world3';
import {RoomBack, Cart, ControlBox} from './Room3';
import {LaserHead, mirrorDev, outAt} from './Transmitter';
import {LeadFigure} from './art/LeadFigure';
import {EAR_OPEN} from './art/LeadHead';
import {ClerkFigure} from './art/Clerk';
import {leadPose, leadBody, clerkHead, clerkBody, clerkFeet, blocked, received, motifEnv, txOn} from './story3';
import {Captions3} from './Captions3';
import {Mechanism, hazeAt} from './Mechanism3';
import {headMat, headToL0, OV, win, camAt, leadXf, pathDirHead} from './cam3';
import {screenEntry} from './occlude3';

// ---- the illustrative infrared path ----
const dash = (z: number) => `${f3(26 / z)} ${f3(18 / z)}`;
const PathSeg: React.FC<{u0: number; u1: number; z: number; a: number; t: number; dev: number}> = ({u0, u1, z, a, t, dev}) => {
  if (a <= 0.003 || u1 <= u0) return null;
  const p0 = pp(outAt(u0, dev)), p1 = pp(outAt(u1, dev));
  return (
    <g opacity={a}>
      <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={LIGHT.irGlow} strokeWidth={10 / z} strokeLinecap="round" opacity={0.35} />
      <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={LIGHT.ir} strokeWidth={5 / z} strokeDasharray={dash(z)} strokeDashoffset={-(t * 90) / z} strokeLinecap="round" />
    </g>
  );
};
// the received accent at the ear: two short saffron arcs facing the incoming path (never on the companion)
const EarAccent: React.FC<{t: number; zs: number; a: number}> = ({t, zs, a}) => {
  if (a <= 0.003) return null;
  const e = headToL0(EAR_OPEN, t);
  const ex = pp(EXIT), ea = pp(EAR);
  const inc = Math.atan2(ex.y - ea.y, ex.x - ea.x); // toward the source
  const r0 = Math.max(4.5, 15 / zs);
  const ph = (t * 1.6) % 1;
  return (
    <g opacity={a}>
      {[0, 1].map((i) => {
        const r = r0 * (1 + 0.55 * i + 0.3 * ((ph + i * 0.5) % 1));
        const a0 = inc - 0.75, a1 = inc + 0.75;
        return <path key={i} d={`M${f3(e.x + r * Math.cos(a0))} ${f3(e.y + r * Math.sin(a0))} A${f3(r)} ${f3(r)} 0 0 1 ${f3(e.x + r * Math.cos(a1))} ${f3(e.y + r * Math.sin(a1))}`} fill="none" stroke={C.saffron} strokeWidth={Math.max(1.2, 5.5 / zs)} strokeLinecap="round" opacity={1 - 0.45 * i} />;
      })}
    </g>
  );
};
// the selected listening position: a soft warm region around his ear while the localisation is explained
const Region: React.FC<{t: number; a: number}> = ({t, a}) => {
  if (a <= 0.003) return null;
  const e = headToL0(EAR_OPEN, t), s = proj(EAR).s;
  const pulse = 1 + 0.06 * Math.sin(t * 5);
  return (
    <g opacity={a}>
      <defs>
        <radialGradient id="v3-region" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.saffron} stopOpacity={0.55} />
          <stop offset="0.55" stopColor={C.saffron} stopOpacity={0.18} />
          <stop offset="1" stopColor={C.saffron} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={e.x} cy={e.y} rx={0.13 * s * pulse} ry={0.15 * s * pulse} fill="url(#v3-region)" />
    </g>
  );
};
// the swept beam's sound adds up only at the listening position: short arcs along the beam are faint and scattered
// near the source and gather, in step, at his ear
const Wavelets: React.FC<{t: number; z: number; a: number; dev: number}> = ({t, z, a, dev}) => {
  if (a <= 0.003) return null;
  const e0 = pp(EXIT), e1 = pp(EAR);
  const ang = Math.atan2(e1.y - e0.y, e1.x - e0.x);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const u = 0.32 + 0.66 * (i / 11);
    const q = pp(outAt(u, dev));
    const ph = (t * 1.3 + (1 - u) * 2.2 * (1 - Math.pow(u, 5))) % 1;
    const coh = Math.pow(u, 6);
    const r = ((5 + 15 * ph) / z) * (0.7 + 1.3 * coh) * 2.0 * (proj(outAt(u, 0)).s / proj(EAR).s) ** 0.5;
    const op = (0.12 + 0.88 * coh) * (1 - ph);
    [-1, 1].forEach((sd) => {
      const a0 = ang + (sd > 0 ? Math.PI / 2 : -Math.PI / 2) - 0.6, a1 = a0 + 1.2;
      out.push(<path key={`${i}${sd}`} d={`M${f3(q.x + r * Math.cos(a0))} ${f3(q.y + r * Math.sin(a0))} A${f3(r)} ${f3(r)} 0 0 1 ${f3(q.x + r * Math.cos(a1))} ${f3(q.y + r * Math.sin(a1))}`} fill="none" stroke={i > 8 ? C.cream : AIR.band} strokeWidth={Math.max(1, 3 / z)} strokeLinecap="round" opacity={op} />);
    });
  }
  return <g opacity={a}>{out}</g>;
};
// 8 FT: a straight dimension line on the floor under the path, with its label lying on the floor beside it
const FloorDim: React.FC<{t: number}> = ({t}) => {
  const draw = ramp(OV.dimDraw[0], OV.dimDraw[1], t, eout), out = ramp(OV.dimOut[0], OV.dimOut[1], t);
  if (draw <= 0.001 || out >= 0.999) return null;
  const a = v3(EXIT.x + 0.32, 0.004, EXIT.z), b = v3(EAR.x + 0.32, 0.004, EAR.z);
  const m = (k: number) => pp(v3(lerp(a.x, b.x, k), 0.004, lerp(a.z, b.z, k)));
  const k0 = 0.5 - 0.5 * draw, k1 = 0.5 + 0.5 * draw;
  const p0 = m(k0), p1 = m(k1);
  const tick = (k: number) => {
    const c = v3(lerp(a.x, b.x, k), 0.004, lerp(a.z, b.z, k));
    const l = pp(v3(c.x - 0.08, 0.004, c.z)), r = pp(v3(c.x + 0.08, 0.004, c.z));
    return <line x1={l.x} y1={l.y} x2={r.x} y2={r.y} stroke={C.cream} strokeWidth={3.2} strokeLinecap="round" />;
  };
  // the label: an affine patch of the floor plane at the line's midpoint (x along world X, y along world -Z)
  const c = v3(lerp(a.x, b.x, 0.5) + 0.1, 0.004, lerp(a.z, b.z, 0.5) - 0.1);
  const o = pp(c), ux = pp(v3(c.x + 1, 0.004, c.z)), uz = pp(v3(c.x, 0.004, c.z + 1));
  const ex = P(ux.x - o.x, ux.y - o.y), ez = P(uz.x - o.x, uz.y - o.y);
  return (
    <g opacity={1 - out}>
      <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={C.cream} strokeWidth={3.2} strokeLinecap="round" />
      {draw > 0.98 && tick(0)}{draw > 0.98 && tick(1)}
      <g transform={`matrix(${f3(ex.x)} ${f3(ex.y)} ${f3(-ez.x)} ${f3(-ez.y)} ${f3(o.x)} ${f3(o.y)})`} opacity={ramp(OV.dimDraw[1] - 0.25, OV.dimDraw[1], t)}>
        <text x={0} y={0.05} fontFamily='"Fredoka Variable", "Fredoka", sans-serif' fontWeight={600} fontSize={0.26} fill={C.cream} stroke={ROOM.floor} strokeWidth={0.02} paintOrder="stroke" letterSpacing={0.01}>8 FT</text>
      </g>
    </g>
  );
};

export const Scene: React.FC<{t: number; cam?: Cam}> = ({t, cam}) => {
  const c = cam ?? camAt(t);
  const M = camMat(c);
  const z = c.z;
  const cf = figXf(clerkFeet(t));
  const sweep = win(t, OV.sweep);
  const dev = mirrorDev(t, sweep);
  const pathA = win(t, OV.path) * (1 - 0.7 * win(t, OV.pathDim));
  const isBlocked = blocked(t);
  // while she blocks it, the path ends where it first meets her outline on screen (her near side)
  const uEntry = isBlocked ? screenEntry(t) ?? 1 : 1;
  const rec = received(t) ? 1 : 0;
  const acc = rec * (0.3 + 0.7 * motifEnv(t)) * (txOn(t) ? 1 : 0);
  const open = ramp(OV.open[0], OV.open[1], t, eout) * (1 - ramp(OV.close[0], OV.close[1], t, eio));
  const hz = hazeAt(t);
  const zs = z * leadXf.k / 0.17;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <g transform={matStr(M)}>
        <RoomBack id="rb" t={t} />
        <FloorDim t={t} />
        {hz > 0.002 && <rect x={-6000} y={-6000} width={13000} height={14000} fill={AIR.bg} opacity={0.9 * hz} />}
        <g transform={leadXf.str}><LeadFigure p={leadPose(t)} b={leadBody(t)} id="lead" sk={Math.min(1, 14 / (3.2 * z * leadXf.k))} /></g>
        <Region t={t} a={win(t, OV.region)} />
        <EarAccent t={t} zs={zs} a={acc} />
        <g transform={cf.str}><ClerkFigure h={clerkHead(t)} b={clerkBody(t)} id="clerk" /></g>
        {/* the path: to his ear, or (while she blocks it) to the edge of her outline */}
        <PathSeg u0={0} u1={uEntry} z={z} a={pathA} t={t} dev={dev} />
        <Wavelets t={t} z={z} a={win(t, OV.wave)} dev={dev} />
        <Cart />
        <ControlBox on={1} />
        <LaserHead t={t} open={open} sweep={sweep} id="tx" beam={open} />
        <Mechanism t={t} zHead={z * leadXf.k} mat={headMat(t)} dirDeg={pathDirHead(t)} />
      </g>
    </svg>
  );
};

export const Film3: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: ROOM.wallDeep}}>
      <Scene t={t} />
      <Captions3 t={t} />
    </AbsoluteFill>
  );
};
export const Film3Still: React.FC<{t: number; captions?: boolean; cam?: Cam}> = ({t, captions = true, cam}) => (
  <AbsoluteFill style={{background: ROOM.wallDeep}}>
    <Scene t={t} cam={cam} />
    {captions && <Captions3 t={t} />}
  </AbsoluteFill>
);
