// V5 E1 (15.83-16.92) "That gave electricity": from the rod tip, looking up the channel into the storm.
//   15.83-15.98  the camera hangs beside the rod, 4 m below its tip and 9 m out, looking up past it: the rod rises
//                from the bottom of the frame to its tip, the cyan line and the warm channel climb from just beside the
//                tip up into the storm deck overhead, packets racing up it. The field builds at the tip: it glows from
//                the cut, and violet corona sparks crackle and reach toward the channel, brighter frame by frame.
//   15.98        (E's leader crackle starts) the upward leader leaps from the tip into the channel: a flash at the tip,
//                then a stepped leader (white core, violet edges) climbs the channel step by step, stalled side jabs
//                brushing out behind its tip.
//   15.98-16.92  the camera rises with the leader to the rod tip's height and tilts up after it (one eased move),
//                which carries the tip quickly down through the caption band and out of the frame (by about 16.4),
//                then settles while the leader climbs on up the frame to where E2's molecular leader tip is in E2's
//                first frame (about (605, 925)), with the channel running up and to the right at about MICRO_ANG: the
//                cut to E2 reads as "closer, into the channel".
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {ss} from '../lib';
import {axis3, Cam3, lerp3, projector, TIP3, v3, V3} from '../v2/p3';
import {beamOnScreen, View3} from '../v3/view3';
import {PAL} from '../v3/palette';
import {BOLT3V} from '../v3/bolt3';
import {PulseBloom} from '../v3/Open3_fx';
import {lookAtScreen} from '../v3/Open3_end';
import {MICRO_ANG} from '../v3/cams3';
import {stormPulses} from './Channel5_storm';

export const E1_T0 = 15.83, E1_T1 = 16.92;
export const INC_E1 = 15.98;

// ------------------------------------------------------------------ the stepped leader (s: m along BOLT3V)
/** step k starts at STEP_T[k] and adds STEP_L[k] metres, drawn on over ~0.02 s; the first is the leap off the tip */
const STEPS = (() => {
  const ts: number[] = [], ls: number[] = [];
  let t = INC_E1, k = 0;
  while (t < E1_T1 + 0.2) {
    ts.push(t);
    ls.push(k === 0 ? 2.4 : 1.05 + 0.75 * hash(k, 731));
    t += k === 0 ? 0.07 : 0.052 + 0.03 * hash(k, 733);
    k++;
  }
  return {ts, ls};
})();
export const leaderS = (t: number) => {
  if (t < INC_E1) return -1;
  let s = 0.25;
  for (let k = 0; k < STEPS.ts.length; k++) {
    if (t < STEPS.ts[k]) break;
    s += STEPS.ls[k] * ss(t, STEPS.ts[k], STEPS.ts[k] + 0.022);
  }
  return s;
};
/** how recently the last step fired (1 on a step, decaying): each new step flashes */
const stepFlash = (t: number) => {
  let a = 0;
  for (let k = 0; k < STEPS.ts.length; k++) {
    const d = t - STEPS.ts[k];
    if (d >= 0) a = Math.max(a, Math.exp(-d / 0.03) * (k === 0 ? 1.6 : 1));
  }
  return a;
};
const ptAtS = (s: number): V3 => {
  const pts = BOLT3V.pts;
  for (let i = 1; i < pts.length; i++) if (pts[i].s >= s) {
    const a = pts[i - 1], b = pts[i], u = (s - a.s) / (b.s - a.s || 1);
    return v3(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u);
  }
  return pts[pts.length - 1];
};

// ------------------------------------------------------------------ the camera
/** a camera at pos with world point `at` on screen point (sx, sy), lens f, rolled so the channel runs at screen angle
 *  ang (degrees clockwise from straight up) where it passes axis height h (a few Newton steps; evaluated at load) */
const camChannel = (pos: V3, at: V3, sx: number, sy: number, f: number, h: number, ang: number): Cam3 => {
  const mk = (r: number) => lookAtScreen(pos, at, f, sx, sy, r);
  const A = (r: number) => beamOnScreen(mk(r), h).ang;
  let r = 0;
  for (let i = 0; i < 10; i++) r -= (A(r) - ang) / ((A(r + 0.01) - A(r - 0.01)) / 0.02);
  return mk(r);
};
/** beside the rod, 4 m below its tip and 9 m out (toward the main views' side); the camera then rises with the leader
 *  to the tip's own height, so the tip drops out of the bottom of the frame (it never parks behind the caption) */
const POS0 = v3(-5, 120, -8.4), POS1 = v3(-5, 124.6, -8.4);
/** start: the rod tip low centre, the channel climbing up-right through the frame toward the storm deck */
const K0 = camChannel(POS0, TIP3, 470, 1300, 760, 60, 19);
/** end: the leader tip where E2's starts (about (604, 926)), the channel there at MICRO_ANG as in E2 */
const S_END = leaderS(E1_T1);
const K1 = camChannel(POS1, ptAtS(S_END), 604, 926, 820, (ptAtS(S_END).y - 125.7) / 0.1615, MICRO_ANG);
/** the move: held (a slow creep) while the field builds, then up with the leader as it leaps off the tip, carrying
 *  the tip through the caption band and out of the frame by about 16.4; it settles as the leader climbs on up the
 *  frame into E2's start (still moving a little at the cut) */
const tiltK = (t: number) => {
  const u = clamp((t - 15.93) / (17.0 - 15.93));
  const w = u * u * (3 - 2 * u);
  return 1 - (1 - w) ** 3;
};
export const tipCam = (t: number): Cam3 => {
  const k = tiltK(t);
  return {
    pos: lerp3(POS0, POS1, k),
    yaw: K0.yaw + (K1.yaw - K0.yaw) * k,
    pitch: K0.pitch + (K1.pitch - K0.pitch) * k,
    roll: (K0.roll ?? 0) + ((K1.roll ?? 0) - (K0.roll ?? 0)) * k,
    f: Math.exp(Math.log(K0.f) + (Math.log(K1.f) - Math.log(K0.f)) * k),
  };
};

// ------------------------------------------------------------------ the field at the tip (close view corona)
/** violet-white corona filaments from the rod tip (flickering, reaching up toward the channel), and a soft glow; k is
 *  the field (0..1). From the cut the tip already glows and crackles, and both build until the leader leaps */
const Corona: React.FC<{cam: Cam3; t: number; k: number; id: string}> = ({cam, t, k, id}) => {
  if (k <= 0.01) return null;
  const P = projector(cam);
  const tp = P(TIP3);
  if (!tp.ok) return null;
  const sc = clamp(cam.f / tp.z, 20, 260); // screen px per metre at the tip
  const fl: string[] = [];
  for (let i = 0; i < 9; i++) {
    // each filament lives ~2-3 frames, re-seeded on its own clock (deterministic)
    const ph = t * (14 + 5 * hash(i, 751)) + hash(i, 753);
    const gen = Math.floor(ph);
    const life = ph - gen;
    if (life > 0.72 || hash(gen * 13 + i, 755) > 0.4 + 0.5 * k) continue;
    const ang = (-80 + 160 * hash(gen * 17 + i, 757)) * (Math.PI / 180); // from straight up
    const L = sc * (0.8 + 1.5 * hash(gen * 19 + i, 759)) * (0.55 + 0.45 * k);
    let x = tp.x, y = tp.y, a = ang;
    let d = `M${fmt(x)},${fmt(y)}`;
    const n = 5;
    for (let j = 0; j < n; j++) {
      a += (hash(gen * 23 + i * 7 + j, 761) - 0.5) * 0.9;
      x += Math.sin(a) * (L / n);
      y -= Math.cos(a) * (L / n);
      d += ` L${fmt(x)},${fmt(y)}`;
    }
    fl.push(d);
  }
  const fk = 0.75 + 0.25 * Math.abs(noise1(t * 24, 765));
  const r = sc * (1.0 + 0.7 * k) * (1 + 0.15 * noise1(t * 30, 763));
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`${id}-cg`}>
          <stop offset="0" stopColor="#F4F2FF" stopOpacity={0.85} />
          <stop offset="0.22" stopColor={PAL.mid} stopOpacity={0.42} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={fmt(tp.x)} cy={fmt(tp.y)} r={fmt(r)} fill={`url(#${id}-cg)`} opacity={fmt(clamp((0.45 + 0.4 * k) * fk))} />
      <path d={fl.join(' ')} fill="none" stroke={PAL.halo} strokeOpacity={0.5 * k} strokeWidth={fmt(clamp(sc * 0.1, 7, 16))} strokeLinecap="round" strokeLinejoin="round" />
      <path d={fl.join(' ')} fill="none" stroke="#F0EEFF" strokeOpacity={clamp(0.6 + 0.4 * k)} strokeWidth={fmt(clamp(sc * 0.032, 2.4, 4.5))} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};
/** the leap at inception and each new step: a short white flash at the leader's tip */
const StepFlash: React.FC<{cam: Cam3; s: number; a: number; id: string}> = ({cam, s, a, id}) => {
  if (s <= 0 || a <= 0.02) return null;
  const p = projector(cam)(ptAtS(s));
  if (!p.ok) return null;
  const r = clamp((cam.f * 1.6) / p.z, 30, 170);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`${id}-sf`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.85} />
          <stop offset="0.3" stopColor="#D2DAFF" stopOpacity={0.4} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(r)} fill={`url(#${id}-sf)`} opacity={fmt(clamp(a * 0.7))} />
    </g>
  );
};


// ------------------------------------------------------------------ close-view parts: the rod, the channel as a tube
const INK = '#0B151C';
type Pt = {x: number; y: number};
const poly = (pts: Pt[]) => `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z`;
/** a ribbon of half-width w(i) along projected points */
const ribbonPts = (q: Pt[], w: (i: number) => number) => {
  const L: Pt[] = [], R: Pt[] = [];
  q.forEach((p, i) => {
    const a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1;
    const h = w(i);
    L.push({x: p.x - (dy / n) * h, y: p.y + (dx / n) * h});
    R.push({x: p.x + (dy / n) * h, y: p.y - (dx / n) * h});
  });
  return [...L, ...R.reverse()];
};
/** the air terminal itself, close: a tapered steel rod from the mast head to its point (V3 Tower3D draws it only when
 *  its foot is in front of the camera), cylinder-shaded from the storm key, catching the discharge's violet light */
const ROD_Y0 = 112.45, ROD_Y1 = 124;
const rodR = (y: number) => {
  const u = (y - ROD_Y0) / (ROD_Y1 - ROD_Y0);
  return u < 0.94 ? 0.13 - 0.085 * (u / 0.94) : 0.045 * (1 - (u - 0.94) / 0.06) + 0.004;
};
const Rod: React.FC<{cam: Cam3; lit: number; id: string}> = ({cam, lit, id}) => {
  const P = projector(cam);
  const ys = Array.from({length: 40}, (_, i) => ROD_Y0 + ((ROD_Y1 - ROD_Y0) * i) / 39);
  const q = ys.map((y) => ({y, p: P(v3(0, y, 0))})).filter((r) => r.p.ok && r.p.z > 0.6);
  if (q.length < 2) return null;
  const pts = q.map((r) => r.p);
  const outline = ribbonPts(pts, (i) => clamp((cam.f * rodR(q[i].y)) / pts[i].z, 0.8, 90));
  const a = pts[0], b = pts[pts.length - 1];
  const dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1;
  const nx = -dy / n, ny = dx / n;
  const w0 = clamp((cam.f * rodR(q[0].y)) / a.z, 0.8, 90);
  const mid = pts[Math.floor(pts.length / 2)];
  const lt = (col: string) => mix(col, '#ECE8FF', 0.6 * clamp(lit));
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-rg`} gradientUnits="userSpaceOnUse" x1={fmt(mid.x - nx * w0)} y1={fmt(mid.y - ny * w0)} x2={fmt(mid.x + nx * w0)} y2={fmt(mid.y + ny * w0)}>
          <stop offset="0" stopColor={lt('#4A565E')} />
          <stop offset="0.3" stopColor={lt('#8E9AA3')} />
          <stop offset="0.55" stopColor={lt('#D6DDE2')} />
          <stop offset="0.75" stopColor={lt('#8E9AA3')} />
          <stop offset="1" stopColor={lt('#56626A')} />
        </linearGradient>
      </defs>
      <path d={poly(outline)} fill={`url(#${id}-rg)`} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
    </g>
  );
};
/** the prepared air seen from beside the tip: a warm tube in perspective (wide where it leaves the tip beside the
 *  camera, narrowing up into the storm), soft-edged, fading into the cloud base */
const CH_R = 0.85;
/** the channel's radius along the axis: it starts narrow at the tip and opens to its full width over ~5 m */
const chR = (h: number) => CH_R * (0.3 + 0.7 * ss(h, -10, 22));
const Tube: React.FC<{cam: Cam3; t: number; id: string}> = ({cam, t, id}) => {
  const P = projector(cam);
  const hs = Array.from({length: 56}, (_, i) => -10 + 670 * ((i / 55) ** 1.7)).filter((h) => P(axis3(h)).ok && P(axis3(h)).z > 1);
  const q = hs.map((h) => P(axis3(h)));
  if (q.length < 2) return null;
  const w = (k: number) => (i: number) => clamp((cam.f * chR(hs[i]) * k) / q[i].z, 2, 200);
  const a = q[0], b = q[q.length - 1];
  const shimmer = 0.92 + 0.08 * noise1(t * 7, 97);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <filter id={`${id}-tb`} filterUnits="userSpaceOnUse" x={-300} y={-300} width={1680} height={2520}>
          <feGaussianBlur stdDeviation={10} />
        </filter>
        <linearGradient id={`${id}-tf`} gradientUnits="userSpaceOnUse" x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.35} />
          <stop offset="0.08" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.8" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-tm`} maskUnits="userSpaceOnUse" x={-300} y={-300} width={1680} height={2520}>
          <rect x={-300} y={-300} width={1680} height={2520} fill={`url(#${id}-tf)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-tm)`} filter={`url(#${id}-tb)`} opacity={fmt(shimmer)}>
        <path d={poly(ribbonPts(q, w(1.25)))} fill={PAL.channelMacro} fillOpacity={0.26} />
        <path d={poly(ribbonPts(q, w(0.75)))} fill={PAL.channel} fillOpacity={0.22} />
        <path d={poly(ribbonPts(q, w(0.32)))} fill={PAL.channelEdge} fillOpacity={0.14} />
      </g>
    </g>
  );
};

export const camKeys = () => ({K0, K1});
export const TipE1: React.FC<{t: number}> = ({t}) => {
  const cam = tipCam(t);
  const s = leaderS(t);
  const pulses = stormPulses(t);
  const tag = `e1-${Math.round(t * 30)}`;
  // the field at the tip: glowing from the cut, building to the leap; a little corona stays under the climbing leader
  const field = s > 0 ? 0.3 + 0.7 * clamp(1 - (s - 1) / 3) : 0.5 + 0.5 * ss(t, E1_T0, INC_E1 - 0.02);
  const sf = stepFlash(t);
  const st = {s, core: s > 0 ? 0.9 + 0.25 * sf : 0, flash: s > 0 ? 0.16 + 0.3 * sf : 0, beam: 0.9, pulses, channel: 0, tipCorona: 0};
  return (
    <View3 cam={cam} st={st} t={t} tag={tag}>
      <Tube cam={cam} t={t} id={`${tag}-tu`} />
      <Rod cam={cam} lit={clamp(0.25 * sf + (s > 0 ? 0.15 : 0.12 * field))} id={`${tag}-rod`} />
      <PulseBloom cam={cam} pulses={pulses} k={0.8} id={`${tag}-pb`} />
      <Corona cam={cam} t={t} k={field} id={`${tag}-co`} />
      <StepFlash cam={cam} s={s} a={sf} id={`${tag}-sf`} />
    </View3>
  );
};
