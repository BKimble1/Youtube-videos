// The refuge's machines: the medical Attendant (hovering, white, a soft teal ring for a face), the small ServiceBot
// (tray + one arm) and the CoverSheet the attendant draws over a still figure. They share the street machines' ring
// motif and a tiny system mark — the help is real, and it is the same system.
import React from 'react';
import {V2, clamp, lerp, rnd, f2, pt, smoothPath} from '../kit/math';
import {INK, M, SysMark, capsule, rrect, mixHex, Glow} from './common';
import {ik2d} from './heavy';

export type AttendantProps = {
  x: number; y: number; s?: number; t: number; seed?: number; ink?: number;
  hover?: number; face?: number; urgent?: number; stopped?: number;
  handL?: V2; handR?: V2; scan?: {amt: number; x: number; y: number}; holdSheet?: boolean; tilt?: number;
};

/** Attendant: anchor is the floor point below it; ~375 tall (1.5 m) at s = 1. face −1..1 turns its ring toward screen
 *  left/right. urgent 0..1 = fast bright pulse; stopped 0..1 = the ring dims and holds steady. Hand targets in world. */
export const Attendant: React.FC<AttendantProps> = (p) => {
  const s = p.s ?? 1, ink = p.ink ?? 4 * s, seed = p.seed ?? 1;
  const hov = (p.hover ?? 60) + Math.sin(p.t * 2.1 + seed) * 5;
  const face = clamp(p.face ?? 0, -1, 1);
  const urg = clamp(p.urgent ?? 0), stop = clamp(p.stopped ?? 0);
  const pulse = 0.5 + 0.5 * Math.sin(p.t * Math.PI * 2 * lerp(0.6, 2.4, urg) + seed);
  const ringAmt = lerp(lerp(0.7, 0.55 + 0.45 * pulse, urg), 0.32, stop);
  const ringCol = mixHex(M.teal, '#9FB9B4', stop * 0.6);
  // local frame (s = 1), origin at the floor point
  const by = -hov - 120; // body centre
  const body = `M -96 ${by - 80} Q -100 ${by - 112} -60 ${by - 116} L 60 ${by - 116} Q 100 ${by - 112} 96 ${by - 80} Q 92 ${by + 40} 40 ${by + 104} Q 0 ${by + 124} -40 ${by + 104} Q -92 ${by + 40} -96 ${by - 80} Z`;
  const hy = by - 190; // head centre
  const ringX = face * 44, ringSq = 1 - Math.abs(face) * 0.55;
  const sh = (sd: number) => ({x: sd * 92, y: by - 86});
  const arm = (sd: number, tgtW?: V2) => {
    const S = sh(sd);
    const rest = {x: sd * 120 + face * 16, y: by + 104};
    const tg = tgtW ? {x: (tgtW.x - p.x) / s, y: (tgtW.y - p.y) / s} : rest;
    // pick the elbow that sits outward and low (natural for hanging and for reaching forward)
    const A1 = ik2d(S, tg, 112, 108, 1), A2 = ik2d(S, tg, 112, 108, -1);
    const score = (q: V2) => sd * q.x + q.y;
    const {elbow, end} = score(A1.elbow) >= score(A2.elbow) ? A1 : A2;
    return (
      <g key={sd}>
        <path d={capsule(S, elbow, 17, 15)} fill={M.warmWhite} stroke={INK} strokeWidth={ink / s} />
        <path d={capsule(elbow, end, 15, 13)} fill={M.warmWhite} stroke={INK} strokeWidth={ink / s} />
        <circle cx={elbow.x} cy={elbow.y} r={9} fill={M.softShade} />
        <ellipse cx={end.x} cy={end.y} rx={20} ry={17} fill={M.warmWhite} stroke={INK} strokeWidth={ink / s} />
        <path d={`M ${end.x - 10} ${end.y + 4} Q ${end.x} ${end.y + 10} ${end.x + 10} ${end.y + 4}`} fill="none" stroke={M.softDeep} strokeWidth={3} />
        {p.holdSheet && sd === -1 && <path d={rrect(end.x, end.y + 22, 70, 40, 10)} fill="#F7F5EF" stroke={INK} strokeWidth={ink / s} />}
      </g>
    );
  };
  const farSide = face >= 0 ? -1 : 1;
  const gid0 = `at${seed}_${Math.round(p.x)}_${Math.round(p.y)}`.replace(/-/g, 'm');
  return (
    <g>
      {p.scan && p.scan.amt > 0 && (() => {
        const o = {x: p.x + ringX * s, y: p.y + hy * s};
        const tg = {x: p.scan.x, y: p.scan.y};
        const dx = tg.x - o.x, dy = tg.y - o.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
        const wdt = L * 0.32;
        const a = {x: tg.x + nx * wdt, y: tg.y + ny * wdt}, b = {x: tg.x - nx * wdt, y: tg.y - ny * wdt};
        const u = (p.t * 1.6) % 1;
        const sl = (k: number) => { const q = (u + k) % 1; return <line key={k} x1={lerp(o.x, a.x, q)} y1={lerp(o.y, a.y, q)} x2={lerp(o.x, b.x, q)} y2={lerp(o.y, b.y, q)} stroke={M.tealCore} strokeWidth={3 * s} opacity={0.7 * p.scan!.amt * (1 - q * 0.5)} />; };
        return (
          <g>
            <path d={`M ${pt(o)} L ${pt(a)} L ${pt(b)} Z`} fill={M.teal} opacity={0.18 * p.scan.amt} />
            {sl(0)}{sl(0.5)}
          </g>
        );
      })()}
      <g transform={`translate(${f2(p.x)} ${f2(p.y)}) scale(${f2(s)}) rotate(${f2(p.tilt ?? 0)} 0 ${by})`}>
        <Glow x={0} y={0} r={130} color={M.teal} op={0.22 * ringAmt + 0.06} id={`${gid0}g`} sy={0.25} />
        {arm(farSide, farSide < 0 ? p.handL : p.handR)}
        {/* hover emitter */}
        <ellipse cx={0} cy={by + 116} rx={34} ry={10} fill={M.frame} stroke={INK} strokeWidth={ink / s} />
        <ellipse cx={0} cy={by + 126} rx={24} ry={6} fill={M.teal} opacity={0.6 * ringAmt + 0.2} />
        {/* body */}
        <path d={body} fill={M.warmWhite} stroke={INK} strokeWidth={ink / s} strokeLinejoin="round" />
        <path d={`M ${-face * 10 + 50} ${by - 100} Q ${-face * 10 + 86} ${by - 20} ${-face * 10 + 34} ${by + 96} Q ${-face * 10 + 70} ${by + 20} ${-face * 10 + 50} ${by - 100} Z`} fill={M.softShade} opacity={0.9} />
        <path d={`M -92 ${by - 70} Q 0 ${by - 54} 92 ${by - 70}`} fill="none" stroke={ringCol} strokeWidth={5} opacity={0.55 + 0.45 * ringAmt} />
        <SysMark x={-face * 30 - 30} y={by - 20} r={11} opacity={0.5} color="#9FC3C9" />
        {/* neck and head */}
        <rect x={-22} y={hy + 40} width={44} height={by - 116 - hy - 38} rx={10} fill={M.softShade} stroke={INK} strokeWidth={ink / s} />
        <path d={`M -78 ${hy + 18} Q -80 ${hy - 62} 0 ${hy - 64} Q 80 ${hy - 62} 78 ${hy + 18} Q 70 ${hy + 52} 0 ${hy + 54} Q -70 ${hy + 52} -78 ${hy + 18} Z`} fill={M.warmWhite} stroke={INK} strokeWidth={ink / s} strokeLinejoin="round" />
        <path d={`M -60 ${hy - 34} Q 0 ${hy - 58} 56 ${hy - 40}`} fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" opacity={0.9} />
        <g transform={`translate(${f2(ringX)} ${f2(hy + 4)}) scale(${f2(ringSq)} 1)`}>
          <Glow x={0} y={0} r={70} color={ringCol} op={0.5 * ringAmt} id={`${gid0}r`} />
          <circle cx={0} cy={0} r={30} fill={mixHex('#DDEFEB', '#E9ECEB', stop)} stroke={INK} strokeWidth={ink / s * 0.8} />
          <circle cx={0} cy={0} r={21} fill="none" stroke={ringCol} strokeWidth={9} opacity={0.35 + 0.65 * ringAmt} />
          <circle cx={0} cy={0} r={7} fill={M.tealCore} opacity={0.5 + 0.5 * ringAmt} />
        </g>
        {arm(-farSide, -farSide < 0 ? p.handL : p.handR)}
      </g>
    </g>
  );
};

export type ServiceBotProps = {x: number; y: number; s?: number; t: number; seed?: number; ink?: number; dir?: 1 | -1; dist?: number; reach?: V2; grip?: number; children?: React.ReactNode; light?: number};
/** Small service unit (~230 tall): rolling base, body, a tray (children are drawn on the tray, origin = the tray surface
 *  centre, unscaled world units) and one arm (reach = world target for the gripper; grip 0 open .. 1 closed). */
export const ServiceBot: React.FC<ServiceBotProps> = (p) => {
  const s = p.s ?? 1, ink = p.ink ?? 4 * s, d = p.dir ?? 1, seed = p.seed ?? 1;
  const ang = (((p.dist ?? 0) / (30 * s)) * 180) / Math.PI;
  const S = {x: 62, y: -150};
  const tgt = p.reach ? {x: ((p.reach.x - p.x) / s) * d, y: (p.reach.y - p.y) / s} : {x: 96, y: -78};
  const {elbow, end} = ik2d(S, tgt, 88, 84, -1);
  const g = clamp(p.grip ?? 0);
  const fa = Math.atan2(end.y - elbow.y, end.x - elbow.x);
  const finger = (sd: number) => {
    const a = fa + sd * (0.55 - 0.45 * g);
    return <path key={sd} d={`M ${pt(end)} l ${f2(Math.cos(a) * 26)} ${f2(Math.sin(a) * 26)} l ${f2(Math.cos(fa) * 10)} ${f2(Math.sin(fa) * 10)}`} fill="none" stroke={M.frame} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />;
  };
  return (
    <g>
      <g transform={`translate(${f2(p.x)} ${f2(p.y)}) scale(${f2(s * d)} ${f2(s)})`}>
        <ellipse cx={0} cy={3} rx={95} ry={12} fill="rgba(10,10,14,0.2)" />
        {[-48, 48].map((wx) => <g key={wx} transform={`translate(${wx} -30) rotate(${f2(ang)})`}><circle cx={0} cy={0} r={30} fill={M.rubber} stroke={INK} strokeWidth={ink / s} /><line x1={-16} y1={0} x2={16} y2={0} stroke={M.hub} strokeWidth={5} /></g>)}
        <path d={rrect(0, -120, 160, 150, 34)} fill={M.warmWhite} stroke={INK} strokeWidth={ink / s} />
        <path d={rrect(30, -110, 60, 110, 26)} fill={M.softShade} opacity={0.8} />
        <circle cx={-30} cy={-130} r={18} fill="#DDEFEB" stroke={INK} strokeWidth={ink / s * 0.7} />
        <circle cx={-30} cy={-130} r={11} fill="none" stroke={M.teal} strokeWidth={6} opacity={p.light ?? 0.9} />
        <SysMark x={30} y={-82} r={9} opacity={0.45} color="#9FC3C9" />
        {/* tray */}
        <rect x={-8} y={-212} width={16} height={20} fill={M.frame} />
        <path d={rrect(0, -216, 190, 14, 6)} fill={M.softShade} stroke={INK} strokeWidth={ink / s} />
        <path d={`M -95 -223 L -95 -212 M 95 -223 L 95 -212`} stroke={INK} strokeWidth={ink / s} strokeLinecap="round" />
        {/* arm */}
        <path d={capsule(S, elbow, 13, 11)} fill={M.warmWhite} stroke={INK} strokeWidth={ink / s} />
        <path d={capsule(elbow, end, 11, 9)} fill={M.warmWhite} stroke={INK} strokeWidth={ink / s} />
        <circle cx={elbow.x} cy={elbow.y} r={8} fill={M.softShade} stroke={INK} strokeWidth={ink / s * 0.6} />
        {finger(-1)}{finger(1)}
        <circle cx={end.x} cy={end.y} r={10} fill={M.frame} stroke={INK} strokeWidth={ink / s * 0.6} />
      </g>
      {p.children ? <g transform={`translate(${f2(p.x)} ${f2(p.y - 223 * s)})`}>{p.children}</g> : null}
    </g>
  );
};
/** World position of the ServiceBot's gripper (for handing an item from tray to hand etc.). */
export const serviceGrip = (p: ServiceBotProps): V2 => {
  const s = p.s ?? 1, d = p.dir ?? 1;
  const S = {x: 62, y: -150};
  const tgt = p.reach ? {x: ((p.reach.x - p.x) / s) * d, y: (p.reach.y - p.y) / s} : {x: 96, y: -78};
  const {end} = ik2d(S, tgt, 88, 84, -1);
  return {x: p.x + end.x * s * d, y: p.y + end.y * s};
};

export type CoverSheetProps = {x0: number; x1: number; ySurf: number; top: (x: number) => number; progress: number; ink?: number; seed?: number; lift?: number; drape?: number; dir?: 1 | -1};
/** A white sheet drawn over a still figure lying on a surface from x0 toward x1 (dir follows x1 − x0). top(x) is the
 *  world y of the body's upper contour; the cloth rests a little above it and hangs over the bed edge (drape). */
export const CoverSheet: React.FC<CoverSheetProps> = ({x0, x1, ySurf, top, progress, ink = 4, seed = 1, lift = 0, drape = 70}) => {
  const pr = clamp(progress);
  if (pr <= 0.001) return null;
  const xe = lerp(x0, x1, pr);
  const n = 22;
  const up: V2[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = lerp(x0, xe, u);
    const bodyY = Math.min(top(x), ySurf);
    const lu = clamp((u - 0.55) / 0.45);
    const y = Math.min(bodyY - 10, ySurf - 6) - lift * lu * lu * (3 - 2 * lu) + Math.sin(u * 9 + seed) * 2;
    up.push({x, y});
  }
  const lo: V2[] = [{x: xe + Math.sign(x1 - x0) * 10, y: up[n].y + 24}, {x: xe + Math.sign(x1 - x0) * 4, y: ySurf + drape * 0.8 - lift * 0.3}, {x: lerp(xe, x0, 0.5), y: ySurf + drape + 6}, {x: x0 - Math.sign(x1 - x0) * 8, y: ySurf + drape * 0.85}];
  const pts = [...up, ...lo];
  const folds = [0.2, 0.45, 0.7].map((k, i) => {
    const x = lerp(x0, xe, k);
    const y0 = up[Math.round(k * n)].y;
    return <path key={i} d={`M ${f2(x)} ${f2(y0 + 8)} q ${f2(12 + 6 * rnd(seed + i))} ${f2((ySurf - y0) * 0.5)} ${f2(-4)} ${f2(ySurf - y0 + drape * 0.7)}`} fill="none" stroke="#D9D6CC" strokeWidth={ink * 0.8} strokeLinecap="round" />;
  });
  return (
    <g>
      <path d={smoothPath(pts, true, 0.5)} fill="#F7F5EF" stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      {folds}
    </g>
  );
};
