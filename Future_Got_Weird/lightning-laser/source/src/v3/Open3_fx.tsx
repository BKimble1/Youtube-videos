// V3 beats A and H: local emphasis drawn over View3 (screen space, from the same 3D model, so it stays attached as the
// camera moves). Nothing here is text, a badge or a diagram: it is light on the objects already in the shot.
//   OpenFx       the opening (A, and the end of H on the loop clock): the cyan path made readable ahead of and below
//                the leader, the warm prepared air along it, the guided section strengthened at the connection and
//                re-brightened by the restrikes, and the storm lit locally where the bolt meets the cloud. Its
//                strength fades in during H's crane (by 32.9) and out by 4.28, so B starts from the plain View3.
//   ChannelGrow  H1: the prepared air building upward from the rod tip (a warm front that climbs with channelTop)
//   PlacedLaser  H2: the detailed 2D telescope composited on the projected EXIT3, scaled with the projection
import React from 'react';
import {clamp, fmt, noise1} from '../dc/math';
import {ss} from '../lib';
import {add3, axis3, BEAM_DIR, BOLT3, Cam3, EXIT3, projector, Proj, TIP3, V3, v3} from '../v2/p3';
import {PAL} from './palette';
import {DUR, EV, LOOP0, openLight, openS, tau3} from './timeline3';
import {exitOf3, LaserArt3} from './Open3_laser';

type Pt = {x: number; y: number};
const line = (pts: Pt[]) => (pts.length ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}` : '');
/** a projected polyline as short runs whose width follows depth (as Scene3's strokeRuns) */
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
/** a ribbon along a projected polyline (width follows depth), as one closed path so it never beads */
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

// ------------------------------------------------------------------ the opening's emphasis
/** strength on the loop clock: fully in by 32.9 (tau -0.6, the leader's inception), out by 4.28 */
export const openFxK = (tau: number) => ss(tau, -1.6, -0.6) * (1 - ss(tau, 3.95, 4.28));
/** the connection and the restrikes as light pulses (sound-locked: 1.75, 3.52, 3.64, 3.83) */
const strokes = [EV.connect, ...EV.restrikes];
const pulseAt = (tau: number, tc = 0.08) => strokes.reduce((a, r, i) => a + (tau >= r ? Math.exp(-(tau - r) / tc) * (i === 0 ? 1.15 : 1 - 0.12 * (i - 1)) : 0), 0);
const GUIDED = BOLT3.pts.filter((p) => p.s <= BOLT3.guidedS);
/** brightness surges running up the guided section from the tip, along the laser path: the connection and the three
 *  restrikes (sound-locked), plus two faint ones in the held channel so it is never a frozen image */
const SURGES: [number, number][] = [[EV.connect, 1], [2.32, 0.4], [2.92, 0.45], [EV.restrikes[0], 1], [EV.restrikes[1], 0.85], [EV.restrikes[2], 0.8]];
const SURGE_T = 0.15; // s to run the guided section
/** "air" in "using the AIR ITSELF" (src/data/timeline.json: 32.44-32.68; timeline3 EV has no entry for it) */
const WORD_AIR_H = 32.44;
const BEAM_PTS: V3[] = Array.from({length: 61}, (_, i) => axis3(-520 + (1520 * i) / 60));
/** the prepared air from the rod tip itself (axis3(-10) is level with TIP3, 0.15 m beside it) to channelTop */
const CH_H0 = -10;
const CH_PTS: V3[] = Array.from({length: 30}, (_, i) => axis3(CH_H0 + ((360 - CH_H0) * i) / 29));

export const OpenFx: React.FC<{cam: Cam3; t: number; id: string; corona?: number}> = ({cam, t, id, corona = 0}) => {
  const tau = tau3(t);
  const k = openFxK(tau);
  if (k <= 0.002 && corona <= 0.02 && !(tau3(t) > EV.fieldBuilds - DUR && tau3(t) < 0.2)) return null;
  const P = projector(cam);
  const f = cam.f;
  // the cyan path: a soft glow either side of the thin line, so it reads on a phone (ahead of the leader, below it)
  const glowW = runs(P, BEAM_PTS, 1.5, f, 6, 30, 3);
  const glowN = runs(P, BEAM_PTS, 0.55, f, 3, 12, 3);
  // the warm prepared air along the guided section and a little beyond (Beam3D's default channelTop, G + 60)
  const ch = ribbon(CH_PTS.map(P), f, 3.6, 14, 240);
  const chCore = ribbon(CH_PTS.map(P), f, 1.2, 5, 90);
  // on "using the AIR ITSELF" (32.44-33.15) the prepared air swells a little, back to its base level before the seam
  const airK = ss(tau, WORD_AIR_H - DUR - 0.05, WORD_AIR_H - DUR + 0.25) * (1 - ss(tau, -0.5, -0.15));
  // the guided section: a quiet lift while the leader rides it, then strengthened at the connection; restrikes
  const L = openLight(tau);
  const pre = 0.22 * ss(tau, 0.25, 0.9);
  const after = tau >= EV.connect ? clamp(0.3 + 0.25 * Math.min(1, L.core) + 0.75 * pulseAt(tau)) : 0;
  const gk = k * Math.max(pre, after) * (tau >= EV.connect ? 0.9 + 0.1 * noise1(tau * 13, 71) : 1);
  const surges = SURGES.map(([t0, a]) => {
    const u = (tau - t0) / SURGE_T;
    if (u < 0 || u > 1.5) return null;
    const head = Math.min(1, u) * BOLT3.guidedS, tail = head - 0.4 * BOLT3.guidedS;
    const pts = GUIDED.filter((p) => p.s >= tail && p.s <= head);
    return pts.length > 1 ? {pts, a: k * a * (u < 1 ? 1 : 1 - (u - 1) / 0.5)} : null;
  }).filter((x): x is {pts: typeof GUIDED; a: number} => !!x);
  const sL = Math.min(openS(tau), BOLT3.guidedS);
  const gPts = sL > 2 ? GUIDED.filter((p) => p.s <= sL) : [];
  const gHalo = runs(P, gPts, 6.5, f, 10, 90, 4);
  const gMid = runs(P, gPts, 2.2, f, 4, 30, 4);
  const gCore = runs(P, gPts, 0.85, f, 2.2, 12, 4);
  // the storm lit where the bolt meets the cloud (local, never the caption band)
  const top = P(BOLT3.pts[BOLT3.pts.length - 1]);
  const lit = k * clamp(0.85 * pulseAt(tau, 0.14) + (tau >= EV.connect ? 0.18 * Math.exp(-(tau - EV.connect) / 0.9) : 0));
  const rTop = clamp((f * 95) / Math.max(top.z, 1), 180, 620);
  // the field building at the rod tip before the leader incepts (openSt's tipCorona: 31.88-32.9, gone once the
  // leader is ~12 m long, so frame 0 has none): a violet glow and a few streamers reaching up the prepared path
  const tip = P(TIP3), up = P(axis3(40));
  // a smooth envelope for the glow (openSt's own ramp, without its flicker): builds 31.88-32.9, fades as the leader
  // grows from 2 to 12 m; the streamers flicker with the corona itself
  const fb0 = EV.fieldBuilds - DUR;
  const env = tau < LOOP0 ? clamp((tau - fb0) / (LOOP0 - fb0)) : clamp(1 - (openS(tau) - 2) / 10);
  const cK = corona > 0.01 || env > 0.01 ? Math.max(corona, 0.6 * env) : 0;
  const rC = clamp((f * 6.5) / Math.max(tip.z, 1), 28, 170);
  const aUp = Math.atan2(up.y - tip.y, up.x - tip.x);
  const streamers = cK > 0.02 ? [0, 1, 2, 3].map((i) => {
    if (noise1(t * 21 + i * 7.3, 63) < -0.15) return '';
    const a = aUp + ((i - 1.5) * 0.42 + 0.25 * noise1(t * 7 + i * 3.1, 61));
    const L = rC * (0.7 + 0.9 * cK) * (0.8 + 0.3 * noise1(t * 11 + i, 65));
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
        {cK > 0.02 && tip.ok && (
          <g>
            <circle cx={fmt(tip.x)} cy={fmt(tip.y)} r={fmt(rC)} fill={`url(#${id}-cor)`} opacity={clamp((0.35 + 0.65 * env) * env * flick)} />
            <path d={streamers.join(' ')} fill="none" stroke="#E6E0FF" strokeOpacity={clamp(0.9 * cK)} strokeWidth={fmt(clamp((f * 0.15) / Math.max(tip.z, 1), 1.6, 5))} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        {lit > 0.01 && top.ok && <ellipse cx={fmt(top.x)} cy={fmt(top.y)} rx={fmt(rTop * 1.25)} ry={fmt(rTop * 0.8)} fill={`url(#${id}-lit)`} opacity={lit} />}
        {ch && <path d={ch} fill={PAL.channel} fillOpacity={(0.22 + 0.16 * airK) * k} filter={`url(#${id}-chb)`} />}
        {chCore && <path d={chCore} fill={PAL.channelEdge} fillOpacity={(0.12 + 0.12 * airK) * k} filter={`url(#${id}-chb)`} />}
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
    </g>
  );
};

/** a soft cyan-white bloom on each laser packet (oriented along the beam), so the packet train reads on a phone */
export const PulseBloom: React.FC<{cam: Cam3; pulses: number[]; k: number; id: string; size?: number}> = ({cam, pulses, k, id, size = 1}) => {
  if (k <= 0.01) return null;
  const P = projector(cam);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`${id}-pb`}>
          <stop offset="0" stopColor={PAL.packet} stopOpacity={0.75} />
          <stop offset="0.35" stopColor={PAL.laser} stopOpacity={0.32} />
          <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
        </radialGradient>
      </defs>
      {pulses.map((h, i) => {
        if (h < -880 || h > 1000) return null;
        const a = P(axis3(h)), b = P(axis3(Math.max(-880, h - 26)));
        if (!a.ok || !b.ok) return null;
        const L = Math.hypot(a.x - b.x, a.y - b.y);
        const near = clamp(1 - (L - 110) / 120); // as Beam3D: packets smearing past the lens fade out
        const emerge = clamp((h + 880) / 26); // grows out of the exit window
        const o = k * near * emerge;
        if (o <= 0.01) return null;
        const r = clamp((cam.f * 2.6 * size) / a.z, 8, 64);
        const ang = (Math.atan2(a.y - b.y, a.x - b.x) * 180) / Math.PI;
        const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        return <ellipse key={i} cx={fmt(cx)} cy={fmt(cy)} rx={fmt(r + L * 0.6)} ry={fmt(r)} transform={`rotate(${fmt(ang)} ${fmt(cx)} ${fmt(cy)})`} fill={`url(#${id}-pb)`} opacity={o} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ H1: the prepared air building up from the tip
export const ChannelGrow: React.FC<{cam: Cam3; t: number; top: number; id: string; k?: number}> = ({cam, t, top, id, k = 1}) => {
  if (top <= 0 || k <= 0.002) return null;
  const P = projector(cam);
  const f = cam.f;
  const n = 34;
  const pts: V3[] = Array.from({length: n}, (_, i) => axis3(CH_H0 + ((top - CH_H0) * i) / (n - 1)));
  const pp = pts.map(P);
  const body = ribbon(pp, f, 2.2, 10, 220);
  const core = ribbon(pp, f, 0.7, 3, 70);
  const fr = P(axis3(top)), fb = P(axis3(Math.max(CH_H0, top - 40)));
  const growing = clamp(1 - ss(t, 30.6, 31.0));
  const rF = clamp((f * 3.0) / Math.max(fr.z, 1), 22, 150);
  const angF = (Math.atan2(fr.y - fb.y, fr.x - fb.x) * 180) / Math.PI;
  // the newest part of the channel is a little brighter (the growing front), the base glows where it leaves the tip
  const lead = ribbon(pts.filter((_, i) => i >= n * 0.62).map(P), f, 1.6, 6, 150);
  const base = P(axis3(CH_H0));
  const rB = clamp((f * 2.2) / Math.max(base.z, 1), 16, 120);
  const baseK = ss(t, EV.channelExtends, EV.channelExtends + 0.4);
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={k}>
      <defs>
        <filter id={`${id}-b`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={fmt(clamp(f / 100, 5, 24))} />
        </filter>
        <radialGradient id={`${id}-fr`}>
          <stop offset="0" stopColor={PAL.channelEdge} stopOpacity={0.6} />
          <stop offset="0.45" stopColor={PAL.channel} stopOpacity={0.25} />
          <stop offset="1" stopColor={PAL.channel} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={body} fill={PAL.channel} fillOpacity={0.2} filter={`url(#${id}-b)`} />
      <path d={core} fill={PAL.channelEdge} fillOpacity={0.14} filter={`url(#${id}-b)`} />
      {lead && <path d={lead} fill={PAL.channelEdge} fillOpacity={0.16 * growing} filter={`url(#${id}-b)`} />}
      {base.ok && baseK > 0.01 && <circle cx={fmt(base.x)} cy={fmt(base.y)} r={fmt(rB)} fill={`url(#${id}-fr)`} opacity={0.55 * baseK} />}
      {fr.ok && growing > 0.02 && <ellipse cx={fmt(fr.x)} cy={fmt(fr.y)} rx={fmt(rF * 1.5)} ry={fmt(rF * 0.75)} transform={`rotate(${fmt(angF)} ${fmt(fr.x)} ${fmt(fr.y)})`} fill={`url(#${id}-fr)`} opacity={0.7 * growing} />}
    </g>
  );
};

// ------------------------------------------------------------------ H2: the composited telescope
const along = (d: number) => add3(EXIT3, v3(BEAM_DIR.x * d, BEAM_DIR.y * d, BEAM_DIR.z * d));
export const exitScreen = (cam: Cam3) => {
  const P = projector(cam);
  const a = P(EXIT3), b = P(along(30));
  return {x: a.x, y: a.y, z: a.z, ok: a.ok && b.ok, ang: (Math.atan2(b.x - a.x, -(b.y - a.y)) * 180) / Math.PI};
};
/** LaserArt3 with its exit window on the projected EXIT3, its tube along the projected beam, and its scale k0 at the
 *  reference camera (f0 / z0) carried by the projection (k = k0 * (f / z) / (f0 / z0)) as the camera moves */
export const PlacedLaser: React.FC<{cam: Cam3; k0: number; fz0: number; flash: number; fire: number; tick: number; t: number; id: string}> = ({cam, k0, fz0, flash, fire, tick, t, id}) => {
  const b = exitScreen(cam);
  if (!b.ok || b.z < 1) return null;
  const k = (k0 * (cam.f / b.z)) / fz0;
  // off-screen: the exit's glow reaches 170 local units round the window, the tube and mount about 700 below/beside
  if (b.y - 200 * k > 1920 || b.x + 700 * k < 0 || b.x - 700 * k > 1080) return null;
  const e = exitOf3(b.ang);
  return (
    <g transform={`translate(${fmt(b.x - e.x * k)} ${fmt(b.y - e.y * k)}) scale(${fmt(k)})`}>
      <LaserArt3 id={id} ang={b.ang} flash={flash} fire={fire} tick={tick} t={t} detail="telescope" />
    </g>
  );
};
