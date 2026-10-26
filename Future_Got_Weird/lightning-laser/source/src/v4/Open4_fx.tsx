// V4 A (and H2 across the seam): local emphasis drawn over View3, from the same 3D model so it stays attached as the
// camera moves (V3's OpenFx, retimed to V4's opening; nothing here is text, a badge or a diagram).
//   path     the cyan path made readable: a soft glow either side of the thin line (on through H2, A1, A2 and A3)
//   air      the warm prepared air along the guided section and a little beyond; from the connection it widens so
//            its orange edges stay outside the discharge's violet glow (V3 finding A-2)
//   corona   the field at the rod tip: a violet glow and a few streamers reaching up the prepared path (fieldK)
//   leader   the guided section lifts as the leader rides it; at the connection (3.52) a bright stroke runs up it, and
//            again on each re-stroke (3.64, 3.83); the cloud base is lit where the bolt meets it
// Strength fxK4: in from H2, out by HAND4 (4.2), where V3's own OpenFx (fading) takes over exactly.
import React from 'react';
import {clamp, fmt, noise1} from '../dc/math';
import {ss} from '../lib';
import {axis3, BOLT3, Cam3, projector, Proj, TIP3, V3} from '../v2/p3';
import {PAL} from '../v3/palette';
import {BOLT3V} from '../v3/bolt3';
import {tau3} from '../v3/timeline3';
import {CONNECT4, fieldK, HAND4, INC, openS4, RESTRIKES4} from './states4_open';

type Pt = {x: number; y: number};
const line = (pts: Pt[]) => (pts.length ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}` : '');
/** a projected polyline as short runs whose width follows depth */
const runs = (P: (p: V3) => Proj, pts: V3[], wM: number, f: number, minW: number, maxW: number, step = 4) => {
  const out: {d: string; w: number}[] = [];
  const pp = pts.map(P);
  for (let i = 0; i + 1 < pp.length; i += step) {
    const seg = pp.slice(i, Math.min(pp.length, i + step + 1)).filter((q) => q.ok);
    if (seg.length < 2) continue;
    const z = seg[Math.floor(seg.length / 2)].z;
    out.push({d: line(seg), w: clamp((f * wM) / Math.max(z, 0.5), minW, maxW)});
  }
  return out;
};
/** a ribbon along a projected polyline (width follows depth), one closed path so it never beads */
const ribbon = (pp: Proj[], f: number, wM: number, minW: number, maxW: number) => {
  const q = pp.filter((p) => p.ok);
  if (q.length < 2) return '';
  const L: Pt[] = [], R: Pt[] = [];
  q.forEach((p, i) => {
    const a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1;
    const w = clamp((f * wM) / Math.max(p.z, 0.5), minW, maxW) / 2;
    L.push({x: p.x - (dy / n) * w, y: p.y + (dx / n) * w});
    R.push({x: p.x + (dy / n) * w, y: p.y - (dx / n) * w});
  });
  return `${line([...L, ...R.reverse()])} Z`;
};

/** the effects' strength: on from H2's cut (a new shot), through the seam, out by HAND4 */
export const fxK4 = (t: number) => {
  const tau = tau3(t);
  return tau < 0 ? 1 : 1 - ss(t, 3.95, HAND4);
};
const GUIDED = BOLT3.pts.filter((p) => p.s <= BOLT3.guidedS);
const BEAM_PTS: V3[] = Array.from({length: 61}, (_, i) => axis3(-520 + (1520 * i) / 60));
const CH_H0 = -10;
const CH_PTS: V3[] = Array.from({length: 36}, (_, i) => axis3(CH_H0 + ((520 - CH_H0) * i) / 35));
/** the connection and re-strokes as light pulses */
const STROKES = [CONNECT4, ...RESTRIKES4];
export const strokePulse = (t0: number, tc = 0.08) => {
  const t = tau3(t0);
  return STROKES.reduce((a, r, i) => a + (t >= r ? Math.exp(-(t - r) / tc) * (i === 0 ? 1.15 : 1 - 0.12 * i) : 0), 0);
};

export const OpenFx4: React.FC<{cam: Cam3; t: number; id: string}> = ({cam, t: t0, id}) => {
  const k = fxK4(t0);
  // the opening's events on the loop clock (at the end of the film, tau < 0: before all of them)
  const t = tau3(t0);
  const fk = fieldK(t0);
  if (k <= 0.002 && fk <= 0.01) return null;
  const P = projector(cam);
  const f = cam.f;
  const s = openS4(t0);
  // the cyan path's glow
  const glowW = runs(P, BEAM_PTS, 1.5, f, 6, 30, 3);
  const glowN = runs(P, BEAM_PTS, 0.55, f, 3, 12, 3);
  // the warm prepared air: a sheath wider than the discharge's violet halo once the bolt has connected
  const wide = ss(t, CONNECT4 - 0.1, CONNECT4 + 0.25);
  const chPP = CH_PTS.map(P);
  const ch = ribbon(chPP, f, 6.5 + 7 * wide, 24, 420);
  const chCore = ribbon(chPP, f, 1.2, 5, 90);
  // the guided section: lifts while the leader rides it, strengthens at the connection, re-strokes
  const pulse = strokePulse(t0);
  const ride = s > 0 && t < CONNECT4 ? 0.3 * ss(t, INC, INC + 0.25) : 0;
  const after = t >= CONNECT4 ? clamp(0.35 + 0.25 * ss(t, CONNECT4, CONNECT4 + 0.6) + 0.75 * pulse) : 0;
  const gk = k * Math.max(ride, after) * (t >= CONNECT4 ? 0.96 + 0.04 * noise1(t * 13, 71) : 1);
  const sL = Math.min(s, BOLT3.guidedS);
  const gPts = sL > 1 ? GUIDED.filter((p) => p.s <= sL) : [];
  const gHalo = runs(P, gPts, 6.5, f, 10, 90, 4);
  const gMid = runs(P, gPts, 2.2, f, 4, 30, 4);
  const gCore = runs(P, gPts, 0.85, f, 2.2, 12, 4);
  // fast strokes up the guided section (0.15 s): the connection's and each re-stroke's
  const surges = STROKES.map((t0, i) => {
    const u = (t - t0) / 0.15;
    if (u < 0 || u > 1.5) return null;
    const head = Math.min(1, u) * BOLT3.guidedS, tail = head - 0.4 * BOLT3.guidedS;
    const a = k * (i === 0 ? 1 : 0.9 - 0.08 * i) * (u < 1 ? 1 : 1 - (u - 1) / 0.5);
    const pts = GUIDED.filter((p) => p.s >= tail && p.s <= head);
    return pts.length > 1 && a > 0.01 ? {pts, a} : null;
  }).filter((x): x is {pts: typeof GUIDED; a: number} => !!x);
  // the storm lit where the bolt meets the cloud (local, round, edge-free)
  const top = P(BOLT3V.pts[BOLT3V.pts.length - 1]);
  const lit = t >= CONNECT4 ? k * clamp(0.85 * strokePulse(t0, 0.14) + 0.18 * Math.exp(-(t - CONNECT4) / 0.9)) : 0;
  const rTop = clamp((f * 95) / Math.max(top.z, 1), 160, 260);
  // the field at the rod tip: glow and streamers up the prepared path (gone once the leader is ~12 m long)
  const tip = P(TIP3), up = P(axis3(40));
  const env = s > 0 ? clamp(1 - (s - 2) / 10) : fk;
  const rC = clamp((f * 6.5) / Math.max(tip.z, 1), 18, 170);
  const aUp = Math.atan2(up.y - tip.y, up.x - tip.x);
  const streamers = env > 0.02 && tip.ok ? [0, 1, 2, 3].map((i) => {
    if (noise1(t * 21 + i * 7.3, 63) < -0.15) return '';
    const a = aUp + ((i - 1.5) * 0.42 + 0.25 * noise1(t * 7 + i * 3.1, 61));
    const L = rC * (0.7 + 0.9 * env) * (0.8 + 0.3 * noise1(t * 11 + i, 65));
    const pts: Pt[] = [{x: tip.x, y: tip.y}];
    for (let m = 1; m <= 4; m++) {
      const d = (L * m) / 4, j = 0.16 * L * noise1(t * 30 + i * 5 + m * 1.7, 67);
      pts.push({x: tip.x + Math.cos(a) * d - Math.sin(a) * j, y: tip.y + Math.sin(a) * d + Math.cos(a) * j});
    }
    return line(pts);
  }).filter(Boolean) : [];
  const flick = 0.8 + 0.2 * noise1(t * 26, 69);
  return (
    <g>
      <defs>
        <filter id={`${id}-chb`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={fmt(clamp(f / 85, 4, 20))} />
        </filter>
        <filter id={`${id}-gb`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={fmt(clamp(f / 110, 4, 16))} />
        </filter>
        <radialGradient id={`${id}-cor`}>
          <stop offset="0" stopColor="#F2EEFF" stopOpacity={0.9} />
          <stop offset="0.3" stopColor={PAL.mid} stopOpacity={0.45} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-lit`} gradientUnits="userSpaceOnUse" cx={fmt(top.x)} cy={fmt(top.y)} r={fmt(rTop)}>
          <stop offset="0" stopColor="#E4E8FF" stopOpacity={0.55} />
          <stop offset="0.35" stopColor={PAL.mid} stopOpacity={0.3} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g style={{mixBlendMode: 'screen'}}>
        {env > 0.02 && tip.ok && (
          <g>
            <circle cx={fmt(tip.x)} cy={fmt(tip.y)} r={fmt(rC)} fill={`url(#${id}-cor)`} opacity={clamp((0.35 + 0.65 * env) * env * flick)} />
            <path d={streamers.join(' ')} fill="none" stroke="#E6E0FF" strokeOpacity={clamp(0.9 * env)} strokeWidth={fmt(clamp((f * 0.15) / Math.max(tip.z, 1), 1.4, 5))} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        {k > 0.002 && (
          <g>
            {lit > 0.01 && top.ok && <ellipse cx={fmt(top.x)} cy={fmt(top.y)} rx={fmt(rTop)} ry={fmt(rTop)} fill={`url(#${id}-lit)`} opacity={lit} />}
            {ch && <path d={ch} fill={PAL.channelMacro} fillOpacity={(0.24 + 0.1 * wide) * k} filter={`url(#${id}-chb)`} />}
            {chCore && <path d={chCore} fill={PAL.channelEdge} fillOpacity={0.12 * k} filter={`url(#${id}-chb)`} />}
            {glowW.map((r, i) => <path key={`w${i}`} d={r.d} fill="none" stroke={PAL.laserGlow} strokeOpacity={0.1 * k} strokeWidth={fmt(r.w)} strokeLinecap="round" />)}
            {glowN.map((r, i) => <path key={`n${i}`} d={r.d} fill="none" stroke={PAL.laser} strokeOpacity={0.16 * k} strokeWidth={fmt(r.w)} strokeLinecap="round" />)}
            {gk > 0.01 && gPts.length > 1 && (
              <g>
                <g filter={`url(#${id}-gb)`} opacity={0.3 * gk}>
                  {gHalo.map((r, i) => <path key={`h${i}`} d={r.d} fill="none" stroke={PAL.halo} strokeWidth={fmt(r.w)} strokeLinecap="round" />)}
                </g>
                {gMid.map((r, i) => <path key={`m${i}`} d={r.d} fill="none" stroke={PAL.mid} strokeOpacity={0.45 * gk} strokeWidth={fmt(r.w)} strokeLinecap="round" strokeLinejoin="round" />)}
                {gCore.map((r, i) => <path key={`c${i}`} d={r.d} fill="none" stroke={PAL.core} strokeOpacity={Math.min(1, 0.85 * gk)} strokeWidth={fmt(r.w)} strokeLinecap="round" strokeLinejoin="round" />)}
              </g>
            )}
            {surges.map((sg, j) => (
              <g key={`s${j}`} opacity={clamp(sg.a)}>
                <g filter={`url(#${id}-gb)`} opacity={0.55}>
                  {runs(P, sg.pts, 7, f, 12, 110, 3).map((r, i) => <path key={i} d={r.d} fill="none" stroke={PAL.mid} strokeWidth={fmt(r.w)} strokeLinecap="round" />)}
                </g>
                {runs(P, sg.pts, 1.6, f, 3.5, 22, 3).map((r, i) => <path key={`c${i}`} d={r.d} fill="none" stroke={PAL.core} strokeWidth={fmt(r.w)} strokeLinecap="round" strokeLinejoin="round" />)}
              </g>
            ))}
          </g>
        )}
      </g>
    </g>
  );
};

/** packets close to the lens (A1, beside the telescope): V3's Beam3D and PulseBloom fade out a packet whose projected
 *  4.4 m length exceeds ~110 px (so it never smears into a huge capsule), which near the exit means no packet is seen
 *  leaving the window. Here each such packet is drawn as a short streak of capped length at its head (a bright head and
 *  a fading tail along the beam), cross-faded against V3's fade, so packets visibly leave the exit and climb. */
export const NearPackets4: React.FC<{cam: Cam3; pulses: number[]; k: number; id: string}> = ({cam, pulses, k, id}) => {
  if (k <= 0.01) return null;
  const P = projector(cam);
  const out: React.ReactNode[] = [];
  pulses.forEach((h, i) => {
    if (h < -880 || h > 1000) return;
    const a = P(axis3(h)), b = P(axis3(Math.max(-880, h - 26)));
    if (!a.ok || !b.ok) return;
    const L = Math.hypot(a.x - b.x, a.y - b.y);
    const o = k * clamp((L - 110) / 120) * clamp((h + 880) / 8);
    if (o <= 0.01) return;
    const Lc = Math.min(L, 120);
    const ux = (b.x - a.x) / (L || 1), uy = (b.y - a.y) / (L || 1);
    const tx = a.x + ux * Lc, ty = a.y + uy * Lc;
    const w = clamp((cam.f * 1.4) / Math.max(a.z, 0.5), 3, 16);
    out.push(
      <g key={i} opacity={fmt(o)}>
        <defs>
          <linearGradient id={`${id}-s${i}`} gradientUnits="userSpaceOnUse" x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(tx)} y2={fmt(ty)}>
            <stop offset="0" stopColor={PAL.packet} />
            <stop offset="0.35" stopColor={PAL.laser} stopOpacity={0.7} />
            <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
          </linearGradient>
          <radialGradient id={`${id}-g${i}`}>
            <stop offset="0" stopColor={PAL.packet} stopOpacity={0.7} />
            <stop offset="0.4" stopColor={PAL.laser} stopOpacity={0.25} />
            <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={fmt(a.x)} cy={fmt(a.y)} r={fmt(w * 3.2)} fill={`url(#${id}-g${i})`} />
        <path d={`M${fmt(a.x)},${fmt(a.y)} L${fmt(tx)},${fmt(ty)}`} stroke={`url(#${id}-s${i})`} strokeWidth={fmt(w)} strokeLinecap="round" fill="none" />
        <path d={`M${fmt(a.x)},${fmt(a.y)} L${fmt(a.x + ux * Lc * 0.4)},${fmt(a.y + uy * Lc * 0.4)}`} stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={fmt(w * 0.4)} strokeLinecap="round" fill="none" />
      </g>,
    );
  });
  return out.length ? <g style={{mixBlendMode: 'screen'}}>{out}</g> : null;
};
