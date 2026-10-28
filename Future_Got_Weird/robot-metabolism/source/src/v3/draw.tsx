// V3 drawing of resolved links: every piece is one convex solid (sphere or flat-ended cylinder) carrying its camera-
// space geometry for the exact paint order (lib/solid.ts, r3 sort3). Same ink style as V1/V2: fixed upper-left key
// light, gradient across each cylinder, contour weight from its screen size.
import React from 'react';
import {Item, lw, LIGHT2, nid, NEAR, Proj, f2} from '../lib/r3';
import {add, cross, dot, len, mul, norm, sub, V3, v3} from '../lib/v3';
import {lit, rgba, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {COL, L_MAX, L_MIN, R_HOUS, R_MOTOR, R_NECK, R_ROD, RB, ResolvedLink, S_H1, S_M0, S_M1, S_NECK0, S_ROD_IN} from './rig';

type P2 = {x: number; y: number};

/** blend two #rrggbb colours */
const mixHex = (a: string, b: string, k: number) => {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return '#' + [0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * k).toString(16).padStart(2, '0')).join('');
};

/** a flat-ended cylinder a-b (world) of radius r; `inner` draws extra marks inside its group (screen-space helpers) */
export const cyl = (
  P: Proj, a: V3, b: V3, r: number, color: string,
  o: {layer?: number; k?: number; spec?: number; opacity?: number; inner?: (g: CylGeo) => React.ReactNode; grp?: string; axr?: [number, number]; axP?: V3; axU?: V3; key?: string} = {},
): Item | null => {
  const g = cylGeo(P, a, b, r);
  if (!g) return null;
  const id = nid('cg');
  const k = (o.k ?? 1) * (0.55 + 0.45 * Math.sqrt(Math.abs(g.m)));
  const R = (g.Ra + g.Rb) / 2;
  const sw = lw(R * 2);
  const face = g.face ? (
    <ellipse cx={f2(g.face.c.x)} cy={f2(g.face.c.y)} rx={f2(g.face.R)} ry={f2(Math.max(0.01, g.face.R * g.face.k))} transform={`rotate(${f2(g.rot)} ${f2(g.face.c.x)} ${f2(g.face.c.y)})`} fill={lit(color, 0.12)} stroke={INK} strokeWidth={sw * 0.8} />
  ) : null;
  const el = (
    <g key={o.key ?? nid('c')} opacity={o.opacity}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f2(g.mid.x + g.nl.x * R)} y1={f2(g.mid.y + g.nl.y * R)} x2={f2(g.mid.x - g.nl.x * R)} y2={f2(g.mid.y - g.nl.y * R)}>
          <stop offset="0" stopColor={lit(color, 0.32 * k)} />
          <stop offset="0.38" stopColor={color} />
          <stop offset="1" stopColor={shade(color, 0.42 * k)} />
        </linearGradient>
      </defs>
      <path d={g.d} fill={`url(#${id})`} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      {(o.spec ?? 0) > 0 && R > 2.5 && g.len > 2 && (
        <path d={`M${f2(g.sa.x + g.nl.x * g.Ra * 0.5)} ${f2(g.sa.y + g.nl.y * g.Ra * 0.5)} L${f2(g.sb.x + g.nl.x * g.Rb * 0.5)} ${f2(g.sb.y + g.nl.y * g.Rb * 0.5)}`} stroke={rgba('#FFFFFF', o.spec!)} strokeWidth={Math.max(1, R * 0.2)} strokeLinecap="round" />
      )}
      {face}
      {o.inner?.(g)}
    </g>
  );
  return {
    layer: o.layer ?? 3, depth: (g.A.z + g.B.z) / 2, key: nid('k'), el,
    cs: {k: 'y', a: g.A, b: g.B, r}, sh: {p: g.sa, q: g.sb, rp: g.Ra, rq: g.Rb},
    grp: o.grp, axr: o.axr, axP: o.axP, axU: o.axU,
  };
};

export type CylGeo = {A: V3; B: V3; sa: P2; sb: P2; Ra: number; Rb: number; ax: P2; n: P2; nl: P2; m: number; rot: number; mid: P2; len: number; d: string; face: {c: P2; R: number; k: number} | null};

/** screen geometry of a flat-ended cylinder: side lines, elliptical end caps (outer halves), the visible end face */
export const cylGeo = (P: Proj, a: V3, b: V3, r: number): CylGeo | null => {
  const A = P.camSpace(a), B = P.camSpace(b);
  if (A.z < NEAR || B.z < NEAR) return null;
  const sa = P.toScreen(A), sb = P.toScreen(B);
  const f = P.cam.f;
  const Ra = (f * r) / A.z, Rb = (f * r) / B.z;
  const w = norm(sub(B, A));
  const ka = Math.abs(dot(w, norm(A))), kb = Math.abs(dot(w, norm(B)));
  const dx = sb.x - sa.x, dy = sb.y - sa.y;
  const L = Math.hypot(dx, dy);
  const ax = L > 1e-6 ? {x: dx / L, y: dy / L} : {x: 1, y: 0};
  const n = {x: -ax.y, y: ax.x};
  // lit side of the normal for the gradient
  const m = n.x * LIGHT2.x + n.y * LIGHT2.y;
  const nl = m < 0 ? {x: -n.x, y: -n.y} : n;
  const rot = (Math.atan2(n.y, n.x) * 180) / Math.PI;
  const ey = {x: -n.y, y: n.x};
  const sweep = ax.x * ey.x + ax.y * ey.y > 0 ? 1 : 0;
  const P1 = {x: sa.x + n.x * Ra, y: sa.y + n.y * Ra}, P2_ = {x: sb.x + n.x * Rb, y: sb.y + n.y * Rb};
  const P3 = {x: sb.x - n.x * Rb, y: sb.y - n.y * Rb}, P4 = {x: sa.x - n.x * Ra, y: sa.y - n.y * Ra};
  const ra2 = Math.max(0.01, Ra * ka), rb2 = Math.max(0.01, Rb * kb);
  const d = `M${f2(P1.x)} ${f2(P1.y)} L${f2(P2_.x)} ${f2(P2_.y)} A${f2(Rb)} ${f2(rb2)} ${f2(rot)} 0 ${sweep} ${f2(P3.x)} ${f2(P3.y)} L${f2(P4.x)} ${f2(P4.y)} A${f2(Ra)} ${f2(ra2)} ${f2(rot)} 0 ${sweep} ${f2(P1.x)} ${f2(P1.y)} Z`;
  // the end face the camera can see (eye at the origin of camera space)
  let face: CylGeo['face'] = null;
  if (dot(w, A) > 0) face = {c: sa, R: Ra, k: ka};
  else if (dot(w, B) < 0) face = {c: sb, R: Rb, k: kb};
  return {A, B, sa, sb, Ra, Rb, ax, n, nl, m, rot, mid: {x: (sa.x + sb.x) / 2, y: (sa.y + sb.y) / 2}, len: L, d, face};
};

/** a connector ball (sphere) with optional marks drawn over it */
export const ball = (P: Proj, c: V3, color: string, o: {layer?: number; deco?: (s: P2, R: number) => React.ReactNode; opacity?: number; grp?: string; axr?: [number, number]; axP?: V3; axU?: V3; k?: number; r?: number} = {}): Item | null => {
  const r = o.r ?? RB;
  const C = P.camSpace(c);
  if (C.z < NEAR) return null;
  const s = P.toScreen(C);
  const R = (P.cam.f * r) / C.z;
  const id = nid('bg');
  const k = o.k ?? 1;
  const el = (
    <g key={nid('b')} opacity={o.opacity}>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={f2(s.x + LIGHT2.x * R * 0.42)} cy={f2(s.y + LIGHT2.y * R * 0.42)} r={f2(R * 1.35)}>
          <stop offset="0" stopColor={lit(color, 0.38 * k)} />
          <stop offset="0.45" stopColor={color} />
          <stop offset="1" stopColor={shade(color, 0.45 * k)} />
        </radialGradient>
      </defs>
      <circle cx={f2(s.x)} cy={f2(s.y)} r={f2(R)} fill={`url(#${id})`} stroke={INK} strokeWidth={lw(R * 2)} />
      {o.deco?.(s, R)}
    </g>
  );
  return {layer: o.layer ?? 3, depth: C.z, key: nid('k'), el, cs: {k: 's', c: C, r}, sh: {p: s, q: s, rp: R, rq: R}, grp: o.grp, axr: o.axr, axP: o.axP, axU: o.axU};
};

/** the magnet window on a ball (facing `w`), or the ball's cut-away: the sphere magnet in its holder and its spring */
const ballDeco = (P: Proj, c: V3, w0: V3 | null, sec: number, rel: number) => (s: P2, R: number) => {
  const toCam = norm(sub(P.cam.eye, c));
  const w = w0 ?? toCam;
  const facing = w0 ? dot(w, toCam) : -1;
  const tip = P.proj(add(c, mul(w, RB * 0.62 * (1 - 0.45 * rel))));
  const dx = tip.x - s.x, dy = tip.y - s.y;
  const els: React.ReactNode[] = [];
  if (sec < 0.98 && facing > -0.35) {
    const k = Math.max(0, Math.min(1, (facing + 0.35) / 0.6)) * (1 - sec);
    const wr = R * 0.42 * (1 - 0.4 * rel);
    els.push(<ellipse key="w" cx={f2(s.x + dx)} cy={f2(s.y + dy)} rx={f2(wr)} ry={f2(wr * (0.45 + 0.55 * Math.abs(facing)))} transform={`rotate(${f2((Math.atan2(dy, dx) * 180) / Math.PI)} ${f2(s.x + dx)} ${f2(s.y + dy)})`} fill={COL.magnetWin} opacity={k} />);
  }
  if (sec > 0.02) {
    // cross-section: shell ring, the sphere magnet (N red / S blue) turned to face w, its cup, and the conical spring
    const al = Math.hypot(dx, dy);
    const u = al > 1e-6 ? {x: dx / al, y: dy / al} : {x: 1, y: 0};
    const n = {x: -u.y, y: u.x};
    const rm = R * 0.46;
    const mc = {x: s.x + u.x * R * 0.14 * (1 - rel), y: s.y + u.y * R * 0.14 * (1 - rel)};
    let spring = `M${f2(mc.x - u.x * rm)} ${f2(mc.y - u.y * rm)}`;
    for (let i = 1; i <= 10; i++) {
      const t = i / 10;
      const p = {x: mc.x - u.x * (rm + t * R * 0.42), y: mc.y - u.y * (rm + t * R * 0.42)};
      const ww = (i % 2 ? 1 : -1) * R * (0.26 - 0.12 * t);
      spring += ` L${f2(p.x + n.x * ww)} ${f2(p.y + n.y * ww)}`;
    }
    els.push(
      <g key="sec" opacity={sec}>
        <circle cx={f2(s.x)} cy={f2(s.y)} r={f2(R * 0.9)} fill="#25323F" />
        <circle cx={f2(s.x)} cy={f2(s.y)} r={f2(R * 0.9)} fill="none" stroke={COL.shell} strokeWidth={f2(R * 0.13)} />
        <path d={`M${f2(mc.x + n.x * rm * 1.22 - u.x * rm * 0.25)} ${f2(mc.y + n.y * rm * 1.22 - u.y * rm * 0.25)} A${f2(rm * 1.22)} ${f2(rm * 1.22)} 0 0 0 ${f2(mc.x - n.x * rm * 1.22 - u.x * rm * 0.25)} ${f2(mc.y - n.y * rm * 1.22 - u.y * rm * 0.25)}`} fill="none" stroke="#8796A3" strokeWidth={f2(R * 0.1)} />
        <path d={spring} fill="none" stroke="#B9C4CC" strokeWidth={f2(R * 0.07)} strokeLinejoin="round" />
        <circle cx={f2(mc.x)} cy={f2(mc.y)} r={f2(rm)} fill="#D9E1E7" stroke={INK} strokeWidth={f2(Math.max(1, R * 0.05))} />
        <path d={`M${f2(mc.x + n.x * rm)} ${f2(mc.y + n.y * rm)} A${f2(rm)} ${f2(rm)} 0 0 1 ${f2(mc.x - n.x * rm)} ${f2(mc.y - n.y * rm)} Z`} fill="#E25A4F" />
        <path d={`M${f2(mc.x + n.x * rm)} ${f2(mc.y + n.y * rm)} A${f2(rm)} ${f2(rm)} 0 0 0 ${f2(mc.x - n.x * rm)} ${f2(mc.y - n.y * rm)} Z`} fill="#4A86C8" />
        <circle cx={f2(mc.x - rm * 0.35)} cy={f2(mc.y - rm * 0.4)} r={f2(rm * 0.26)} fill="#FFFFFF" opacity={0.75} />
      </g>,
    );
  }
  return <>{els}</>;
};

/** the housing opened: copper windings in the motor, the lead screw, and the nut on the inner rod that rides it */
const housingCut = (P: Proj, at: (s: number) => V3, Lp: number, k: number) => {
  const A = P.proj(at(S_M0 + 0.004)), B = P.proj(at(S_H1 - 0.004));
  if (A.z < NEAR || B.z < NEAR) return null;
  const ax = {x: B.x - A.x, y: B.y - A.y};
  const al = Math.hypot(ax.x, ax.y);
  if (al < 8) return null;
  const n = {x: -ax.y / al, y: ax.x / al};
  const ra = P.rad(at(S_M0), R_HOUS * 0.82), rb = P.rad(at(S_H1), R_HOUS * 0.82);
  const pt = (t: number, w: number) => {
    const r = ra + (rb - ra) * t;
    return {x: A.x + ax.x * t + n.x * w * r, y: A.y + ax.y * t + n.y * w * r};
  };
  const q = (p: P2) => `${f2(p.x)} ${f2(p.y)}`;
  const win = `M${q(pt(0, 1))} L${q(pt(1, 1))} L${q(pt(1, -1))} L${q(pt(0, -1))} Z`;
  const motorEnd = (S_M1 - S_M0) / (S_H1 - S_M0);
  const e = Math.max(0, Math.min(1, (Lp - L_MIN) / (L_MAX - L_MIN)));
  // the nut travels the screw from near the motor (contracted) to the open end (extended)
  const tn = motorEnd + 0.08 + (0.95 - motorEnd - 0.08) * e;
  const els: React.ReactNode[] = [<path key="w" d={win} fill="#22303D" />];
  for (let i = 0; i < 7; i++) {
    const t0 = 0.03 + i * (motorEnd - 0.06) / 7;
    els.push(<path key={`m${i}`} d={`M${q(pt(t0, 0.86))} L${q(pt(t0 + 0.035, 0.86))} L${q(pt(t0 + 0.035, -0.86))} L${q(pt(t0, -0.86))} Z`} fill={i % 2 ? '#C9773A' : '#E0954F'} />);
  }
  els.push(<path key="sc" d={`M${q(pt(motorEnd, 0))} L${q(pt(1, 0))}`} stroke="#A9B6C1" strokeWidth={f2(Math.max(1.5, (ra + rb) * 0.3))} strokeLinecap="round" />);
  // thread marks that shift with the nut: the screw visibly turns as the rod moves
  const pitch = 0.055;
  const ph = ((tn / pitch) * 3.1) % 1;
  for (let t = motorEnd + pitch * ph; t < 1; t += pitch) els.push(<path key={`th${t.toFixed(3)}`} d={`M${q(pt(t, 0.24))} L${q(pt(t + pitch * 0.45, -0.24))}`} stroke="#5E6F7E" strokeWidth={f2(Math.max(1, (ra + rb) * 0.1))} />);
  els.push(<path key="rod" d={`M${q(pt(tn, 0.52))} L${q(pt(1.01, 0.52))} L${q(pt(1.01, -0.52))} L${q(pt(tn, -0.52))} Z`} fill={COL.rod} opacity={0.9} />);
  els.push(<path key="nut" d={`M${q(pt(tn - 0.04, 0.96))} L${q(pt(tn + 0.04, 0.96))} L${q(pt(tn + 0.04, -0.96))} L${q(pt(tn - 0.04, -0.96))} Z`} fill="#D9A441" stroke={INK} strokeWidth={1.2} />);
  els.push(<path key="edge" d={win} fill="none" stroke={INK} strokeWidth={f2(Math.max(1.2, (ra + rb) * 0.12))} />);
  return <g key="cut" opacity={k}>{els}</g>;
};

export type LinkDraw = {
  /** magnet window direction override per end (world); default from the joint centre / straight out */
  winA?: V3;
  winB?: V3;
  layer?: number;
};

/** every piece of a resolved link, as sortable solids */
export const linkItems3 = (P: Proj, l: ResolvedLink, jc: {A?: V3; B?: V3} = {}, o: {layer?: number} = {}): Item[] => {
  const out: (Item | null)[] = [];
  const u = l.u;
  const at = (s: number) => add(l.Ca, mul(u, s));
  const grp = l.id;
  const axP = P.camSpace(l.Ca);
  const ue = P.camSpace(add(l.Ca, u));
  const axU = sub(ue, axP);
  const g = {grp, axP, axU};
  const layer = o.layer ?? 3;
  const dead = !!l.dead;
  const tone = (c: string) => (dead ? shade(c, 0.12) : c);
  // ends: window toward the cluster centre when joined, straight out when free, unless set
  // magnet windows: shown on free ends (facing out) or where a choreography turns one toward a partner; a joined
  // magnet faces into its cluster and is not drawn (its partner covers it)
  const winA = l.winA ?? (jc.A ? ((l.secA ?? 0) > 0.01 ? norm(sub(jc.A, l.Ca)) : null) : mul(u, -1));
  const winB = l.winB ?? (jc.B ? ((l.secB ?? 0) > 0.01 ? norm(sub(jc.B, l.Cb)) : null) : u);
  out.push(ball(P, l.Ca, tone(COL.shell), {layer, ...g, axr: [-RB, RB], deco: ballDeco(P, l.Ca, winA, l.secA ?? 0, l.relA ?? 0)}));
  out.push(cyl(P, at(S_NECK0), at(S_M0), R_NECK, tone('#7D8B98'), {layer, ...g, axr: [S_NECK0, S_M0], k: 0.8}));
  // motor block with the status light on the side facing the camera (turning with the link's roll)
  const sLed = S_M0 + 0.024;
  const toCam = norm(sub(P.cam.eye, at(sLed)));
  let side = sub(toCam, mul(u, dot(toCam, u)));
  side = len(side) > 1e-4 ? norm(side) : norm(cross(u, v3(0, 1, 0)));
  const side2 = norm(cross(u, side));
  const rl = l.roll ?? 0;
  const ledDir = add(mul(side, Math.cos(rl)), mul(side2, Math.sin(rl)));
  const ledVis = Math.cos(rl) > 0.2;
  const ledP = add(at(sLed), mul(ledDir, R_MOTOR * 0.97));
  out.push(cyl(P, at(S_M0), at(S_M1), R_MOTOR, tone(COL.motor), {layer, ...g, axr: [S_M0, S_M1], inner: () => {
    if (!ledVis) return null;
    const s = P.proj(ledP);
    const R = Math.max(1.4, P.rad(ledP, 0.0047));
    const col = l.ledCol ?? COL.ledOn;
    const on = l.led;
    return (
      <g key="led">
        {on > 0.02 && <circle cx={f2(s.x)} cy={f2(s.y)} r={f2(R * 1.75)} fill={rgba(col, 0.32 * on)} />}
        <circle cx={f2(s.x)} cy={f2(s.y)} r={f2(R)} fill={on > 0.98 ? col : on > 0.02 ? mixHex(COL.ledOff, col, on) : COL.ledOff} stroke={INK} strokeWidth={f2(Math.max(0.8, R * 0.35))} />
      </g>
    );
  }}));
  // housing with the identity band (and the cut-away / crack)
  out.push(cyl(P, at(S_M1), at(S_H1), R_HOUS, tone(COL.housing), {layer, ...g, axr: [S_M1, S_H1], spec: 0.16, inner: () => {
    const band = cylGeo(P, at(S_M1 + 0.012), at(S_M1 + 0.032), R_HOUS * 1.05);
    const els: React.ReactNode[] = [];
    if (band) {
      const id = nid('bd');
      const R = (band.Ra + band.Rb) / 2;
      els.push(
        <g key="band">
          <defs>
            <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f2(band.mid.x + band.nl.x * R)} y1={f2(band.mid.y + band.nl.y * R)} x2={f2(band.mid.x - band.nl.x * R)} y2={f2(band.mid.y - band.nl.y * R)}>
              <stop offset="0" stopColor={lit(tone(l.band), 0.25)} />
              <stop offset="0.4" stopColor={tone(l.band)} />
              <stop offset="1" stopColor={shade(tone(l.band), 0.35)} />
            </linearGradient>
          </defs>
          <path d={band.d} fill={`url(#${id})`} stroke={INK} strokeWidth={f2(lw(R * 2) * 0.75)} strokeLinejoin="round" />
        </g>,
      );
    }
    if ((l.cut ?? 0) > 0.01) els.push(housingCut(P, at, l.Lp, l.cut!));
    if (l.crack) {
      const c0 = P.proj(at(S_M1 + 0.05));
      const R = P.rad(at(S_M1 + 0.05), R_HOUS);
      const ax2 = P.proj(at(S_M1 + 0.08));
      const a = Math.atan2(ax2.y - c0.y, ax2.x - c0.x) + Math.PI / 2;
      const nn = {x: Math.cos(a), y: Math.sin(a)};
      const pts = [-1.05, -0.5, 0, 0.55, 1.05].map((kk, i) => ({x: c0.x + nn.x * kk * R + (i % 2 ? 1 : -1) * R * 0.25, y: c0.y + nn.y * kk * R}));
      els.push(<path key="crack" d={pts.map((p, i) => `${i ? 'L' : 'M'}${f2(p.x)} ${f2(p.y)}`).join(' ')} fill="none" stroke={INK} strokeWidth={f2(lw(R * 2) * 0.8)} strokeLinejoin="bevel" />);
    }
    return <>{els}</>;
  }}));
  // the inner rod, out of the housing to the far ball
  out.push(cyl(P, at(S_H1), at(l.Lp - S_ROD_IN), R_ROD, tone(COL.rod), {layer, ...g, axr: [S_H1, l.Lp - S_ROD_IN], spec: 0.55}));
  if (!l.noBallB) out.push(ball(P, l.Cb, tone(COL.shell), {layer, ...g, axr: [l.Lp - RB, l.Lp + RB], deco: ballDeco(P, l.Cb, winB, l.secB ?? 0, l.relB ?? 0)}));
  else {
    // snapped-off connector: a jagged stub of the holder
    out.push(cyl(P, at(l.Lp - S_ROD_IN), at(l.Lp - 0.004), R_NECK * 1.5, shade(COL.shell, 0.25), {layer, ...g, axr: [l.Lp - S_ROD_IN, l.Lp - 0.004]}));
  }
  return out.filter(Boolean) as Item[];
};

export {L_MIN, L_MAX};
