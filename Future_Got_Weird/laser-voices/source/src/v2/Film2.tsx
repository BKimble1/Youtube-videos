// FGW "This Laser Makes You Hear Voices" V2: a visual rebuild on the LOCKED V1 audio. One room, one fixed projection,
// one continuous 2D camera (log-zoom dives between keyed framings, Infrared Contacts style). Picture only: the
// approved V1 audio stream is muxed in afterwards unchanged (see README).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import '../fonts';
import {Pt, P, Cam, camMat, matStr, mmul, T, S, R, apply, Mat, keyCam, camFlow, FlowKey, clamp, lerp, ramp, fadeWin, inv, eio, eout, lin, f3} from './lib2';
import {C, ROOM, LIGHT, AIR} from './theme2';
import {FPS, DUR, pp, proj, figXf, LEAD_FEET, EAR, EXIT, beamAt, WALK_Z, MPU, GROUND_U, v3, V3, w, we, T_BLOCK, T_CLEAR} from './world2';
import {RoomBack, Cart, ControlBox} from './Room2';
import {LaserHead, txToL0, TX_K, mirrorDev} from './Transmitter';
import {LeadFigure} from './art/LeadFigure';
import {NECK, EAR_OPEN} from './art/LeadHead';
import {ClerkFigure} from './art/Clerk';
import {leadPose, leadBody, clerkHead, clerkBody, clerkFeet, blocked, received, BODY} from './story2';
import {Captions2} from './Captions2';
import {Mechanism, MECH} from './Mechanism2';

import {headMat, headToL0, OV, win, camAt, leadXf} from './cam2';

// ---- path overlay pieces ----
const dash = (z: number) => `${f3(26 / z)} ${f3(18 / z)}`;
const bodyEntryU = (t: number) => {
  // first point of the path inside the clerk's torso box (the near-side silhouette), or 1 if clear
  if (!blocked(t)) return 1;
  const xp = clerkFeet(t).x, d = {x: EAR.x - EXIT.x, z: EAR.z - EXIT.z};
  const uZ = (WALK_Z - BODY.half - EXIT.z) / d.z, uX = (xp - BODY.front - EXIT.x) / d.x;
  return Math.max(uZ, uX);
};
const uNearPlane = (WALK_Z - BODY.half - EXIT.z) / (EAR.z - EXIT.z);
const PathSeg: React.FC<{u0: number; u1: number; z: number; a: number; t: number}> = ({u0, u1, z, a, t}) => {
  if (a <= 0.003 || u1 <= u0) return null;
  const p0 = pp(beamAt(u0)), p1 = pp(beamAt(u1));
  return (
    <g opacity={a}>
      <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={LIGHT.irGlow} strokeWidth={10 / z} strokeLinecap="round" opacity={0.35} />
      <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={LIGHT.ir} strokeWidth={5 / z} strokeDasharray={dash(z)} strokeDashoffset={-(t * 90) / z} strokeLinecap="round" />
    </g>
  );
};
// the received accent at the ear: two short saffron arcs facing the incoming path (never on the clerk)
const EarAccent: React.FC<{t: number; z: number; a: number}> = ({t, z, a}) => {
  if (a <= 0.003) return null;
  const e = headToL0(EAR_OPEN, t);
  const r0 = Math.max(4.5, 16 / z);
  const ph = (t * 1.6) % 1;
  return (
    <g opacity={a}>
      {[0, 1].map((i) => {
        const r = r0 * (1 + 0.55 * i + 0.3 * ((ph + i * 0.5) % 1));
        const ang0 = 150, ang1 = 240;
        const pa = P(e.x + r * Math.cos((ang0 * Math.PI) / 180), e.y + r * Math.sin((ang0 * Math.PI) / 180));
        const pb = P(e.x + r * Math.cos((ang1 * Math.PI) / 180), e.y + r * Math.sin((ang1 * Math.PI) / 180));
        return <path key={i} d={`M${f3(pa.x)} ${f3(pa.y)} A${f3(r)} ${f3(r)} 0 0 1 ${f3(pb.x)} ${f3(pb.y)}`} fill="none" stroke={C.saffron} strokeWidth={Math.max(1.2, 6 / z)} strokeLinecap="round" opacity={1 - 0.45 * i} />;
      })}
    </g>
  );
};
// the swept beam's sound adds up only at the listening distance: wavelets along the path are faint and scattered,
// and gather into a coherent cluster at the ear (drawn while the camera follows the beam to the listener)
const Wavelets: React.FC<{t: number; z: number; a: number}> = ({t, z, a}) => {
  if (a <= 0.003) return null;
  const e0 = pp(EXIT), e1 = pp(EAR);
  const ang = Math.atan2(e1.y - e0.y, e1.x - e0.x);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const u = 0.35 + 0.65 * (i / 13);
    const q = pp(beamAt(u));
    const ph = (t * 1.4 + i * 0.37) % 1;
    const coh = Math.pow(u, 6);
    const r = (6 + 16 * ph) / z * (0.6 + 1.4 * coh) * 2.2;
    const op = (0.15 + 0.85 * coh) * (1 - ph);
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    [-1, 1].forEach((sd) => {
      const c = P(q.x + nx * sd * 0, q.y + ny * sd * 0);
      const a0 = ang + (sd > 0 ? Math.PI / 2 : -Math.PI / 2) - 0.6, a1 = a0 + 1.2;
      out.push(<path key={`${i}${sd}`} d={`M${f3(c.x + r * Math.cos(a0))} ${f3(c.y + r * Math.sin(a0))} A${f3(r)} ${f3(r)} 0 0 1 ${f3(c.x + r * Math.cos(a1))} ${f3(c.y + r * Math.sin(a1))}`} fill="none" stroke={i > 10 ? C.cream : AIR.band} strokeWidth={Math.max(1, 3.2 / z)} strokeLinecap="round" opacity={op} />);
    });
  }
  return <g opacity={a}>{out}</g>;
};

// 8 FT: a straight dimension line on the floor under the path, drawn on and then removed
const FloorDim: React.FC<{t: number; z: number}> = ({t, z}) => {
  const draw = ramp(OV.dimDraw[0], OV.dimDraw[1], t, eout), out = ramp(OV.dimOut[0], OV.dimOut[1], t);
  if (draw <= 0.001 || out >= 0.999) return null;
  const a = v3(EXIT.x, 0.004, EXIT.z), b = v3(EAR.x, 0.004, EAR.z);
  const m = (k: number) => pp(v3(lerp(a.x, b.x, k), 0.004, lerp(a.z, b.z, k)));
  const k0 = 0.5 - 0.5 * draw, k1 = 0.5 + 0.5 * draw;
  const p0 = m(k0), p1 = m(k1), mid = m(0.5);
  const ang = (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI;
  const s = proj(v3(lerp(a.x, b.x, 0.5), 0, lerp(a.z, b.z, 0.5))).s;
  const tick = (p: Pt) => <line x1={p.x - 0.07 * s * Math.sin((ang * Math.PI) / 180)} y1={p.y + 0.07 * s * Math.cos((ang * Math.PI) / 180) * 0.4} x2={p.x + 0.07 * s * Math.sin((ang * Math.PI) / 180)} y2={p.y - 0.07 * s * Math.cos((ang * Math.PI) / 180) * 0.4} stroke={C.cream} strokeWidth={3.2} strokeLinecap="round" />;
  return (
    <g opacity={1 - out}>
      <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={C.cream} strokeWidth={3.2} strokeLinecap="round" />
      {draw > 0.98 && tick(m(0))}{draw > 0.98 && tick(m(1))}
      <g transform={`translate(${f3(mid.x)} ${f3(mid.y)}) rotate(${f3(ang)}) scale(1 0.7)`} opacity={ramp(OV.dimDraw[1] - 0.25, OV.dimDraw[1], t)}>
        <rect x={-0.3 * s} y={-0.12 * s} width={0.6 * s} height={0.24 * s} fill={ROOM.floor} />
        <text x={0} y={0.08 * s} textAnchor="middle" fontFamily='"Fredoka Variable", "Fredoka", sans-serif' fontWeight={600} fontSize={0.23 * s} fill={C.cream} letterSpacing={0.01 * s}>8 FT</text>
      </g>
    </g>
  );
};

export const Scene: React.FC<{t: number; cam?: Cam}> = ({t, cam}) => {
  const c = cam ?? camAt(t);
  const M = camMat(c);
  const z = c.z;
  const cf = figXf(clerkFeet(t));
  const pathA = Math.max(win(t, OV.hookPath), win(t, OV.travel), win(t, OV.follow), win(t, OV.cross));
  const uEnd = bodyEntryU(t);
  const acc = received(t) ? 1 : 0;
  const open = ramp(OV.open[0], OV.open[1], t, eout) * (1 - ramp(OV.close[0], OV.close[1], t, eio));
  const sweep = win(t, OV.sweep);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <g transform={matStr(M)}>
        <RoomBack id="rb" t={t} />
        <g transform={leadXf.str}><LeadFigure p={leadPose(t)} b={leadBody(t)} id="lead" sk={Math.min(1, 14 / (3.2 * z * leadXf.k))} /></g>
        <EarAccent t={t} z={z * leadXf.k / 0.17} a={acc} />
        {/* while she is clear of it, the path passes behind her (hidden where her figure overlaps it on screen) */}
        {!blocked(t) && <PathSeg u0={0} u1={1} z={z} a={pathA} t={t} />}
        <g transform={cf.str}><ClerkFigure h={clerkHead(t)} b={clerkBody(t)} id="clerk" /></g>
        {/* while she blocks it, the path is drawn over her and ends where it enters her near side */}
        {blocked(t) && <PathSeg u0={0} u1={uEnd} z={z} a={pathA} t={t} />}
        <Cart />
        <ControlBox on={1} />
        <LaserHead t={t} open={open} sweep={sweep} id="tx" />
        <FloorDim t={t} z={z} />
        <Wavelets t={t} z={z} a={win(t, [17.85, 18.3, 19.7, 20.0]) * (received(t) || t > 19.8 ? 1 : 0)} />
        <Mechanism t={t} zHead={z * leadXf.k} mat={headMat(t)} />
      </g>
    </svg>
  );
};

export const Film2: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: ROOM.wallDeep}}>
      <Scene t={t} />
      <Captions2 t={t} />
    </AbsoluteFill>
  );
};
export const Film2Still: React.FC<{t: number; captions?: boolean; cam?: Cam}> = ({t, captions = true, cam}) => (
  <AbsoluteFill style={{background: ROOM.wallDeep}}>
    <Scene t={t} cam={cam} />
    {captions && <Captions2 t={t} />}
  </AbsoluteFill>
);
