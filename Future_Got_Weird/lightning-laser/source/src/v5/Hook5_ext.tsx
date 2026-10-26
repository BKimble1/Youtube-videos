// V5 A3/A4 outside (HOOK owner): the rocket up beside the beam into the storm, the storm deck flickering from within,
// the upward leader following the beam to the cloud (connection 3.52, re-strokes 3.64 and 3.83), and the hand-over to
// V3's opening (from 4.2 the frame is V3's OpenA exactly: the A -> B contract).
//   states   copied from v4/states4_open.ts and re-timed: the leader incepts at INC5 (once the rocket has settled
//            into the wide), climbs the guided section by "FOLLOWED" (3.26), leaves the line, branches and connects at
//            3.52; V3's strike light from there, blended into V3's openSt by HAND5
//   fx       copied from v4/Open4_fx.tsx (OpenFx4) on V5's timing: the cyan path's glow, the warm prepared air, the
//            field at the rod tip, the guided section riding and stroking, the lit cloud base at the connection
//   storm    in-cloud lightning (copied from v4/Open4_cloud.tsx and generalised to several flash points and times): the
//            deck's lobes lit from within, lobe by lobe, with a short channel glimpsed through the base; local light
//            only, never a frame-wide flash
import React from 'react';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {ss} from '../lib';
import {axis3, BOLT3, Cam3, projector, Proj, TIP3, v3, V3} from '../v2/p3';
import {stream} from '../v2/shots3d';
import {PAL} from '../v3/palette';
import {BOLT3V} from '../v3/bolt3';
import {CB, LOOP, magFade} from '../v3/Scene3_sky';
import {EV, openS, strikeLight, tau3} from '../v3/timeline3';
import {openSt} from '../v3/states3';
import {St, View3} from '../v3/view3';
import {OpenFx, openFxK, PulseBloom} from '../v3/Open3_fx';
import {extCam5, HAND5} from './cams5_hook';

// ------------------------------------------------------------------ the leader (re-timed V4 states)
// V5 fix (HOOK-4): the leader incepts earlier, as the in-cloud flashes end (by frame 80), so it is the one bright
// thing on screen and its climb is longer (2.66 -> the connection at 3.52, 0.86 s)
export const INC5 = 2.66; // inception at the rod tip (the rocket has nearly settled into the wide)
export const GUIDED5 = 3.26; // the leader at the top of the guided section ("FOLLOWED")
export const CONNECT5 = 3.52; // connection to the cloud (the quiet crack)
export const RESTRIKES5 = [3.64, 3.83];
const G_S = BOLT3.guidedS, TOTAL = openS(EV.connect);
/** the leader length (m along BOLT3); -1 before inception */
export const openS5 = (t: number) => {
  if (t < INC5) return -1;
  if (t >= CONNECT5) return TOTAL;
  if (t <= GUIDED5) {
    const u = (t - INC5) / (GUIDED5 - INC5);
    return Math.max(0.3, G_S * (0.3 * u + 0.7 * u * u));
  }
  const v0 = (G_S * (0.3 + 1.4)) / (GUIDED5 - INC5);
  const w = t - GUIDED5, W = CONNECT5 - GUIDED5;
  const a = (TOTAL - G_S - v0 * W) / (W * W);
  return Math.min(TOTAL, G_S + v0 * w + a * w * w);
};
/** the field at the rod tip before inception (0..1 envelope): crackling from the cut, strengthening into inception */
export const fieldK5 = (t: number) => (t < INC5 ? 0.5 + 0.5 * ss(t, INC5 - 0.4, INC5) : 0);
const light5 = (t: number) => (t < CONNECT5 ? {core: 0.88, scene: 0.1} : strikeLight(t, CONNECT5, RESTRIKES5, 3.95, 4.7));
/** hand-over weight to openSt (0 until 3.9, 1 from HAND5) */
export const handK5 = (t: number) => ss(t, 3.9, HAND5);
export const openSt5 = (t: number): St => {
  const o = openSt(t);
  if (t >= HAND5) return o;
  const s = openS5(t);
  const L = light5(t);
  const h = handK5(t);
  const core = s > 0 ? L.core + (o.core - L.core) * h : 0;
  const flash0 = s > 0 ? Math.max(L.scene, 0.1) * clamp(s / 16) : 0;
  const flash = flash0 + (o.flash - flash0) * h;
  const fk = fieldK5(t);
  const corona = s > 0 ? clamp(1 - (s - 2) / 10) : fk * (0.5 + 0.5 * Math.abs(Math.sin(t * 23)));
  return {...o, s, core, flash, tipCorona: corona, pulses: stream(tau3(t))};
};

// ------------------------------------------------------------------ the opening's emphasis (OpenFx4, re-timed)
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

/** the effects' strength: on through the exterior, out by HAND5 (V3's own OpenFx takes over) */
export const fxK5 = (t: number) => 1 - ss(t, 3.95, HAND5);
const GUIDED = BOLT3.pts.filter((p) => p.s <= BOLT3.guidedS);
const BEAM_PTS: V3[] = Array.from({length: 61}, (_, i) => axis3(-520 + (1520 * i) / 60));
const CH_H0 = -10;
const CH_PTS: V3[] = Array.from({length: 36}, (_, i) => axis3(CH_H0 + ((520 - CH_H0) * i) / 35));
/** the connection and re-strokes as light pulses */
const STROKES = [CONNECT5, ...RESTRIKES5];
export const strokePulse5 = (t: number, tc = 0.08) => {
  return STROKES.reduce((a, r, i) => a + (t >= r ? Math.exp(-(t - r) / tc) * (i === 0 ? 1.15 : 1 - 0.12 * i) : 0), 0);
};

export const OpenFx5: React.FC<{cam: Cam3; t: number; id: string}> = ({cam, t, id}) => {
  const k = fxK5(t);
  const fk = fieldK5(t);
  if (k <= 0.002 && fk <= 0.01) return null;
  const P = projector(cam);
  const f = cam.f;
  const s = openS5(t);
  // the cyan path's glow
  const glowW = runs(P, BEAM_PTS, 1.5, f, 6, 30, 3);
  const glowN = runs(P, BEAM_PTS, 0.55, f, 3, 12, 3);
  // the warm prepared air: a sheath wider than the discharge's violet halo once the bolt has connected (it widens as
  // the leader nears the cloud, so the connection's glow never covers its orange edges), and it hands over to V3's
  // own (narrower, fading) band over 12 frames, 3.8-4.2 (V4 review A4-7: it went in about 3 frames)
  const wide = ss(t, CONNECT5 - 0.2, CONNECT5 + 0.15);
  const kAir = 1 - ss(t, 3.8, HAND5);
  const chPP = CH_PTS.map(P);
  const ch = ribbon(chPP, f, 6.5 + 9 * wide, 24, 460);
  const chCore = ribbon(chPP, f, 1.2, 5, 90);
  // the guided section: lifts while the leader rides it, strengthens at the connection, re-strokes
  const pulse = strokePulse5(t);
  const ride = s > 0 && t < CONNECT5 ? 0.3 * ss(t, INC5, INC5 + 0.25) : 0;
  const after = t >= CONNECT5 ? clamp(0.35 + 0.25 * ss(t, CONNECT5, CONNECT5 + 0.6) + 0.75 * pulse) : 0;
  const gk = k * Math.max(ride, after) * (t >= CONNECT5 ? 0.96 + 0.04 * noise1(t * 13, 71) : 1);
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
  const lit = t >= CONNECT5 ? k * clamp(0.85 * strokePulse5(t, 0.14) + 0.18 * Math.exp(-(t - CONNECT5) / 0.9)) : 0;
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
        {(k > 0.002 || kAir > 0.002) && (
          <g>
            {lit > 0.01 && top.ok && <ellipse cx={fmt(top.x)} cy={fmt(top.y)} rx={fmt(rTop)} ry={fmt(rTop)} fill={`url(#${id}-lit)`} opacity={lit} />}
            {ch && <path d={ch} fill={PAL.channelMacro} fillOpacity={(0.24 + 0.12 * wide) * kAir} filter={`url(#${id}-chb)`} />}
            {chCore && <path d={chCore} fill={PAL.channelEdge} fillOpacity={0.12 * kAir} filter={`url(#${id}-chb)`} />}
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

// ------------------------------------------------------------------ V3's summit deck (same rules as Scene3_sky, as Open4_cloud)
type Lobe = {dx: number; dz: number; r: number; lv: number; hang: number; rag: number; ph: number};
const HL = 5;
const lobe = (dx: number, dz: number, r: number, lv = 0, o: Partial<Lobe> = {}): Lobe => ({dx, dz, r, lv, hang: HL * lv, rag: 0, ph: 0, ...o});
type Mass = {x: number; z: number; drift: number; lobes: Lobe[]};
const mkMass = (x: number, z: number, R: number, key: number, seed: number, stretch: number, drift: number): Mass => {
  const a0 = hash(key, seed + 5) * 6.2832;
  const lvOf = (h: number) => (h < 0.4 ? 0 : h < 0.78 ? 1 : 2);
  const lobes: Lobe[] = [lobe(0, 0, R * (0.66 + 0.08 * hash(key, seed + 6)))];
  if (hash(key, seed + 13) < 0.65) {
    const a = a0 + 2.4;
    lobes.push(lobe(Math.cos(a) * R * 0.3 * stretch, Math.sin(a) * R * 0.3, R * (0.42 + 0.1 * hash(key, seed + 14)), hash(key, seed + 16) < 0.5 ? 0 : 1));
  }
  const n = 8 + Math.floor(hash(key, seed + 4) * 6);
  for (let j = 0; j < n; j++) {
    const a = a0 + (j / n) * 6.2832 + 0.5 * (hash(key * 7 + j, seed + 8) - 0.5);
    const rr = R * (0.13 + 0.2 * Math.pow(hash(key * 7 + j, seed + 9), 1.5));
    const reach = (R - rr) * (0.68 + 0.18 * hash(key * 7 + j, seed + 10));
    lobes.push(lobe(Math.cos(a) * reach * stretch, Math.sin(a) * reach, rr, lvOf(hash(key * 7 + j, seed + 17))));
  }
  const ni = 3 + Math.floor(hash(key, seed + 18) * 3);
  for (let j = 0; j < ni; j++) {
    const a = hash(key * 11 + j, seed + 19) * 6.2832, rad = R * 0.55 * Math.sqrt(hash(key * 11 + j, seed + 20));
    lobes.push(lobe(Math.cos(a) * rad * stretch, Math.sin(a) * rad, R * (0.15 + 0.13 * hash(key * 11 + j, seed + 21)), hash(key * 11 + j, seed + 22) < 0.55 ? 1 : 2, {rag: 0.1, ph: 6.2832 * hash(key * 11 + j, seed + 23)}));
  }
  return {x, z, drift, lobes};
};
const field = (S: number, x0: number, x1: number, z0: number, z1: number, seed: number, R0: number, R1: number, keep: number, stretch: number, drift: number, hole?: {x: number; z: number; r: number}) => {
  const out: Mass[] = [];
  for (let ix = Math.floor(x0 / S); ix <= Math.ceil(x1 / S); ix++) for (let iz = Math.floor(z0 / S); iz <= Math.ceil(z1 / S); iz++) {
    const key = (ix + 300) * 1000 + (iz + 300);
    if (hash(key, seed) > keep) continue;
    const x = (ix + 0.5 + 0.8 * (hash(key, seed + 1) - 0.5)) * S, z = (iz + 0.5 + 0.8 * (hash(key, seed + 2) - 0.5)) * S;
    if (hole && Math.hypot(x - hole.x, z - hole.z) < hole.r) continue;
    const R = R0 + (R1 - R0) * Math.pow(hash(key, seed + 3), 1.6);
    out.push(mkMass(x, z, R, key, seed, stretch, drift));
  }
  return out;
};
const CELL = [mkMass(40, 30, 175, 1, 901, 1.25, 1.2), mkMass(-130, -70, 130, 2, 903, 1.3, 2.4), mkMass(-170, 170, 140, 3, 905, 1.3, 2.4), mkMass(210, 200, 150, 4, 907, 1.3, 2.4)];
const DECK = [...CELL, ...field(300, -2400, 2400, -1500, 2900, 601, 110, 250, 0.8, 1.35, 4, {x: 20, z: 40, r: 280})];

/** the lowering under the cell where the bolt attaches (as Scene3_sky's LOWER, same rules): it drifts with CELL[0] */
const ATT = {x: BOLT3V.pts[BOLT3V.pts.length - 1].x, z: BOLT3V.pts[BOLT3V.pts.length - 1].z};
const SIDE = {x: -0.67, z: -0.74};
const LOWER: Lobe[] = (() => {
  const out: Lobe[] = [];
  const at = (u: number, v: number) => ({x: ATT.x + u * SIDE.x - v * SIDE.z, z: ATT.z + u * SIDE.z + v * SIDE.x}); // u toward the views, v across
  const add = (u: number, v: number, r: number, lv: number, hang: number, rag: number, j: number) => {
    const p = at(u, v);
    out.push(lobe(p.x, p.z, r, lv, {hang, rag, ph: 6.2832 * hash(j, 941)}));
  };
  // the body of the lowering: a broad lobed mass about 90 m deep and 130 m across
  for (let j = 0; j < 12; j++) add(15 + 80 * hash(j, 931), (hash(j, 933) - 0.5) * 130, 20 + 22 * hash(j, 935), 3, 8 + 5 * hash(j, 937), 0.1 + 0.06 * hash(j, 939), j);
  // its far edge at the attachment, irregular (no row of equal lobes): the bolt top and the upper branches run in here
  for (let j = 0; j < 7; j++) {
    const v = (hash(j, 943) - 0.5) * 120;
    add(2 + 12 * hash(j, 945) - 0.003 * v * v, v, 10 + 14 * hash(j, 947), 3, 9 + 5 * hash(j, 949), 0.13, 20 + j);
  }
  // lumps hanging under the body (no lighter than it: only their lips show), so it is lumpy, not one flat sheet
  for (let j = 0; j < 11; j++) add(14 + 80 * hash(j, 963), (hash(j, 965) - 0.5) * 120, 8 + 12 * hash(j, 967), 4, 14 + 5 * hash(j, 969), 0.14, 40 + j);
  // a few scud fragments under the far edge, scattered round the bolt top
  for (let j = 0; j < 5; j++) add(-10 + 26 * hash(j, 955), (hash(j, 953) - 0.5) * 100, 4 + 7 * hash(j, 957), 5, 18 + 8 * hash(j, 959), 0.22, 60 + j);
  return out;
})();



// ------------------------------------------------------------------ the storm: lightning inside the deck
/** a flash event: where it runs inside the deck, when, how strong */
type Flash = {p: V3; t0: number; a: number};
/** the thunder flash (2.02, thunder 2.1): seen through the control-room window, its afterglow carries across the cut
 *  into the exterior (the same place in the deck, upper left in both) */
export const T_THUNDER = 2.02;
// V5 fix (HOOK-4): the deck flickers while the camera rockets up (2.36, 2.5) and goes dark by frame 80 (FLASH_END),
// before the leader incepts: nothing competes with the leader's climb
const FLASHES: Flash[] = [
  {p: v3(-80, 234, 22), t0: T_THUNDER, a: 0.95},
  {p: v3(-42, 226, 2), t0: 2.36, a: 1},
  {p: v3(-90, 236, -38), t0: 2.5, a: 0.7},
];
const FLASH_END = [2.56, 2.66];
const REACH = 110;
const nearOf = (F: V3) => {
  const out: (Lobe & {mx: number; mz: number; drift: number; k: number})[] = [];
  DECK.forEach((m, mi) => {
    if (Math.hypot(m.x, m.z) >= 420) return;
    m.lobes.forEach((l, li) => {
      const d = Math.hypot(m.x + l.dx - F.x, m.z + l.dz - F.z) - 0.3 * l.r;
      if (d > REACH) return;
      out.push({...l, mx: m.x, mz: m.z, drift: m.drift, k: (0.55 + 0.45 * hash(mi * 53 + li, 1301)) * clamp(1 - d / REACH)});
    });
  });
  LOWER.forEach((l, li) => {
    const d = Math.hypot(l.dx - F.x, l.dz - F.z) - 0.3 * l.r;
    if (d > REACH) return;
    out.push({...l, dx: 0, dz: 0, mx: l.dx, mz: l.dz, drift: CELL[0].drift, k: (0.6 + 0.4 * hash(li, 1307)) * clamp(1 - d / REACH)});
  });
  return out.sort((a, b) => a.lv - b.lv);
};
const NEARS = FLASHES.map((F) => nearOf(F.p));
const ragK = (l: {rag: number; ph: number}, a: number) => (l.rag ? 1 + l.rag * (0.55 * Math.sin(3 * a + l.ph) + 0.3 * Math.sin(5 * a + 2.1 * l.ph) + 0.15 * Math.sin(11 * a + 3.7 * l.ph)) : 1);
const ring = (P: (p: V3) => Proj, c: V3, l: Lobe, n = 40) => {
  const pts: Proj[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832;
    const r = l.r * ragK(l, a);
    pts.push(P(v3(c.x + r * Math.cos(a), c.y, c.z + r * Math.sin(a))));
  }
  return pts.every((q) => q.ok && q.z > 20) ? pts : null;
};
const poly = (pts: {x: number; y: number}[]) => `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z`;
/** a flash's brightness: the stroke and two flickers, a dim afterglow */
export const flashK = (t: number, t0: number) => {
  const p = (s0: number, a: number, d: number) => (t >= s0 - 0.015 ? a * Math.exp(-Math.max(0, t - s0) / d) * clamp((t - s0 + 0.015) / 0.015) : 0);
  return clamp(p(t0, 1, 0.06) + p(t0 + 0.09, 0.7, 0.05) + p(t0 + 0.2, 0.4, 0.07) + p(t0, 0.2, 0.3));
};
const jagRun = (a: V3, b: V3, n: number, amp: number, seed: number) => {
  const pts: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const j = i === 0 || i === n ? 0 : amp * noise1(i * 0.9 + seed, 1311);
    pts.push(v3(a.x + (b.x - a.x) * u + 0.4 * j, a.y + (b.y - a.y) * u + 0.5 * j, a.z + (b.z - a.z) * u - 0.8 * j));
  }
  return pts;
};
const CHS = FLASHES.map((F, i) => jagRun(v3(F.p.x - 30, F.p.y + 1, F.p.z + 16), v3(F.p.x + 34, F.p.y + 4, F.p.z - 10), 14, 6, i * 5));
export const StormFlash5: React.FC<{cam: Cam3; t: number; id: string}> = ({cam, t, id}) => {
  if (cam.pos.y > CB - 4) return null;
  const mk = magFade(cam.f);
  if (mk >= 0.999) return null;
  const P = projector(cam);
  const drift = (LOOP / (2 * Math.PI)) * Math.sin((2 * Math.PI * tau3(t)) / LOOP);
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={fmt(1 - mk)}>
      {FLASHES.map((F, fi) => {
        const k = F.a * flashK(t, F.t0) * (1 - ss(t, FLASH_END[0], FLASH_END[1]));
        if (k <= 0.01) return null;
        const g = P(F.p);
        if (!g.ok) return null;
        const rG = clamp((cam.f * 1.1 * REACH) / Math.max(g.z, 1), 120, 1600);
        const rings: {d: string; a: number}[] = [];
        for (const l of NEARS[fi]) {
          const c = v3(l.mx + drift * l.drift + l.dx, CB - l.hang, l.mz + l.dz);
          const r = ring(P, c, l);
          if (r) rings.push({d: poly(r), a: l.k});
        }
        const ch = CHS[fi].map(P);
        const chOk = ch.every((q) => q.ok);
        const strike = clamp((k / F.a - 0.55) / 0.45);
        const seg = ch.slice(0, -1).map((q, i) => ({d: `M${fmt(q.x)},${fmt(q.y)} L${fmt(ch[i + 1].x)},${fmt(ch[i + 1].y)}`, a: Math.pow(Math.sin((Math.PI * (i + 0.5)) / (ch.length - 1)), 0.7)}));
        const fid = `${id}-${fi}`;
        return (
          <g key={fi}>
            <defs>
              <radialGradient id={`${fid}-g`} gradientUnits="userSpaceOnUse" cx={fmt(g.x)} cy={fmt(g.y)} r={fmt(rG)}>
                <stop offset="0" stopColor="#DADDFF" stopOpacity={0.95} />
                <stop offset="0.16" stopColor="#B0B6F2" stopOpacity={0.68} />
                <stop offset="0.42" stopColor="#7C86D2" stopOpacity={0.28} />
                <stop offset="1" stopColor="#5A64B0" stopOpacity={0} />
              </radialGradient>
              <filter id={`${fid}-bl`} filterUnits="userSpaceOnUse" x={-300} y={-300} width={1680} height={2520}>
                <feGaussianBlur stdDeviation={7} />
              </filter>
              <filter id={`${fid}-b`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
                <feGaussianBlur stdDeviation={fmt(clamp(cam.f / 220, 2.5, 6))} />
              </filter>
            </defs>
            <g filter={`url(#${fid}-bl)`}>
              {rings.map((r, i) => <path key={i} d={r.d} fill={`url(#${fid}-g)`} opacity={fmt(clamp(k * r.a * 1.15))} />)}
            </g>
            {chOk && strike > 0.02 && (
              <g opacity={fmt(strike)}>
                <g filter={`url(#${fid}-b)`}>
                  {seg.map((p, i) => <path key={`h${i}`} d={p.d} fill="none" stroke="#C9CEFF" strokeOpacity={fmt(0.55 * p.a)} strokeWidth={fmt(clamp((cam.f * 2.6) / g.z, 5, 26))} strokeLinecap="round" />)}
                </g>
                {seg.map((p, i) => <path key={`c${i}`} d={p.d} fill="none" stroke="#FFFFFF" strokeOpacity={fmt(clamp(1.1 * p.a))} strokeWidth={fmt(clamp((cam.f * 0.25) / g.z, 1.4, 3.4))} strokeLinecap="round" />)}
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------ the shot
export const Ext5: React.FC<{t: number; tag: string}> = ({t, tag}) => {
  const cam = extCam5(t);
  const st = openSt5(t);
  const h = handK5(t);
  return (
    <View3 cam={cam} st={st} t={t} tag={tag}>
      <StormFlash5 cam={cam} t={t} id={`${tag}-sf`} />
      <OpenFx5 cam={cam} t={t} id={`${tag}-fx`} />
      {h > 0.001 && (
        <g opacity={h} style={{mixBlendMode: 'screen'}}>
          <OpenFx cam={cam} t={t} id={`${tag}-v3fx`} corona={0} />
        </g>
      )}
      <PulseBloom cam={cam} pulses={st.pulses} k={0.85 + (0.4 * openFxK(tau3(t)) - 0.85) * h} id={`${tag}-pb`} />
    </View3>
  );
};
