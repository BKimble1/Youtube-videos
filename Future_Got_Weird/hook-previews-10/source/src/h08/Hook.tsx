// HOOK 08: infrared contact lenses. One continuous 6.0 s shot.
//   0.0-1.0  close on the lead's face in a dim lab: the lid is already closing over an eye that wears a nearly
//            invisible soft lens; a small near-infrared LED beside the face pulses; deep-red dashed packets (the
//            stylised invisible signal) reach the closed lid, and the lid lights faintly green from within.
//   1.0-2.5  the camera pushes in; a soft clearing opens in the closed lid (side cut through the eye): packets cross
//            the lid into the lens, the lens glints green and the green light crosses the eye to the retina.
//   2.5-4.4  continuous dive into the lens material at the point where the signal enters: hexagonal upconversion
//            nanocrystals in the hydrogel each catch two near-infrared packets (deep-red core) and release ONE green
//            packet toward the pupil; on "closed" a run of crystals converts together.
//   4.4-6.0  pull back out through the section to the closed-eyed face: the emitter keeps flashing and the closed lid
//            keeps lighting faintly green in step; the camera is still drifting out on the last frame.
import React from 'react';
import {HookFrame, HookProps} from '../shared/HookFrame';
import WORDS from '../data/h08_words.json';
import {Words, wordAt} from '../shared/lib';
import {Pt, P, clamp, lerp, lerpP, ramp, eio, eout, rnd, Cam, camMat, mmul, matStr, apply, invMat, M21, L2toL1, R, NECK, Mat} from './geo';
import {LeadHead, LeadPose, EYE} from './Lead8';
import {Emitter} from './Emitter';
import {Section8, HERO, CRYSTALS, Crystal, CState, EYE2, RETINA_C, NIR} from './Section8';
import {GREEN} from './Lead8';

const W = WORDS as Words;
const wDetect = wordAt(W, 'detect').start; // 1.20
const wInfrared = wordAt(W, 'infrared').start; // 1.60
const wSignals = wordAt(W, 'signals').start; // 2.16
const wEven = wordAt(W, 'even').start; // 2.93
const wEyes = wordAt(W, 'eyes').start; // 3.52
const wClosed = wordAt(W, 'closed').start; // 3.96

// ---------------- event timeline (mirrored in tools/audio/h08.py) ----------------
export const TL = {
  lidShut: 0.45,
  clear0: wDetect - 0.25, clear1: wDetect + 0.3, // clearing opens in the closed lid
  dive0: wSignals - 0.24, dive1: wEven + 0.07, // push into the lens material
  out0: wClosed + 0.06, // pull back out
  unclear0: 4.92, unclear1: 5.42, // clearing closes
};
// near-infrared pulses: arrival windows at the lens (the emitter fires earlier, by the travel time)
export const PULSES: [number, number][] = [
  [0.2, 0.56],
  [1.3, 1.62],
  [wInfrared + 0.3, wInfrared + 0.64],
  [wEven - 0.05, wEven + 0.3],
  [wEyes + 0.08, wEyes + 0.4],
  [4.3, 4.6],
  [5.0, 5.32],
  [5.7, 6.1],
];
// the marked (hero) crystal: two packets absorbed, one green emission, twice
const HERO_EV = [
  {a1: wEven + 0.0, a2: wEven + 0.24, e: wEyes - 0.16},
  {a1: wEyes + 0.12, a2: wEyes + 0.32, e: wClosed + 0.02},
];
export const BURST = wClosed + 0.02;
// every other crystal: per pulse, about a third catch two packets and emit one green packet (more on "closed")
type Ev = {a1: number; a2: number; e: number};
const crystalEvents = (c: Crystal): Ev[] => {
  const out: Ev[] = [];
  PULSES.forEach(([p0, p1], k) => {
    const burst = k === 4;
    if (rnd(c.i * 7.13 + k * 3.31) > (burst ? 0.42 : 0.16)) return;
    const a1 = p0 + rnd(c.i * 1.7 + k) * (p1 - p0 - 0.14);
    const a2 = a1 + 0.1 + 0.12 * rnd(c.i * 2.3 + k * 5);
    const e = burst ? BURST + 0.12 * rnd(c.i * 4.1) : a2 + 0.07 + 0.12 * rnd(c.i * 3.9 + k);
    out.push({a1, a2: Math.min(a2, e - 0.04), e});
  });
  return out;
};
const EVENTS = new Map<number, Ev[]>(CRYSTALS.map((c) => [c.i, crystalEvents(c)]));
const stateOf = (evs: Ev[], t: number): CState => {
  let q = 0, g = 0;
  for (const ev of evs) {
    if (t < ev.a1 - 0.01) continue;
    if (t < ev.e) q = Math.max(q, clamp((t - ev.a1) / 0.06) + clamp((t - ev.a2) / 0.06));
    else g = Math.max(g, clamp((t - ev.e) / 0.04) * Math.exp(-(t - ev.e) / 0.32));
  }
  return {q, g};
};
// perceived response: the green light the lens makes from each pulse
const resp = (t: number) => PULSES.reduce((m, [a, b]) => Math.max(m, clamp((t - a - 0.06) / 0.08) * (1 - clamp((t - b - 0.1) / 0.22))), 0);

// ---------------- camera ----------------
const HERO1 = L2toL1(HERO); // the lens point where the signal enters (L1)
// monotone cubic (no overshoot, continuous velocity)
const pchip = (t: number, keys: [number, number][]) => {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  const d = keys.slice(0, -1).map((k, i) => (keys[i + 1][1] - k[1]) / (keys[i + 1][0] - k[0]));
  const m = keys.map((_, i) => {
    if (i === 0) return d[0];
    if (i === n - 1) return d[n - 2];
    if (d[i - 1] * d[i] <= 0) return 0;
    const h0 = keys[i][0] - keys[i - 1][0], h1 = keys[i + 1][0] - keys[i][0];
    const w1 = 2 * h1 + h0, w2 = h1 + 2 * h0;
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  let i = 0;
  while (t > keys[i + 1][0]) i++;
  const h = keys[i + 1][0] - keys[i][0], u = (t - keys[i][0]) / h;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * keys[i][1] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * keys[i + 1][1] + (u3 - u2) * h * m[i + 1];
};
const CAMK: [number, number, number, number][] = [
  // t, zoom (px per L1 unit), screen x, screen y of the entry point
  [-0.6, 3.15, 365, 878],
  [0.0, 3.4, 395, 880],
  [0.75, 4.2, 480, 880],
  [TL.clear1 + 0.05, 9.4, 800, 880],
  [TL.dive0, 10.6, 830, 884],
  [TL.dive1, 640, 450, 900],
  [TL.out0, 700, 470, 892],
  [4.92, 10.0, 810, 882],
  [5.56, 4.1, 470, 878],
  [6.0, 3.15, 385, 880],
  [6.6, 2.9, 350, 880],
];
export const tiltAt = (t: number) => 0.5 * Math.sin(t * 2 * Math.PI * 0.25 - 0.6);
const camAt = (t: number): Cam => ({
  F: apply(R(tiltAt(t), NECK), HERO1),
  z: Math.exp(pchip(t, CAMK.map((k) => [k[0], Math.log(k[1])]))),
  S: P(pchip(t, CAMK.map((k) => [k[0], k[2]])), pchip(t, CAMK.map((k) => [k[0], k[3]]))),
});
// beam packets keep a steady SCREEN speed whatever the zoom: precompute the travelled L1 distance G(t)
const SPEED = 1700; // px/s
const DT = 1 / 240, T0 = -1.2;
const GT: number[] = (() => {
  const g = [0];
  for (let i = 1; T0 + i * DT <= 6.8; i++) g.push(g[i - 1] + (SPEED / camAt(T0 + (i - 0.5) * DT).z) * DT);
  return g;
})();
const G = (t: number) => {
  const x = (t - T0) / DT, i = clamp(Math.floor(x), 0, GT.length - 2);
  return lerp(GT[i], GT[i + 1], x - i);
};
const timeAtG = (g: number) => {
  let lo = T0, hi = 6.8;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (G(mid) < g) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
};

// ---------------- the emitter and the beam ----------------
const E_TIP = P(178, -62); // L1
const E_ANG = (Math.atan2(E_TIP.y - HERO1.y, E_TIP.x - HERO1.x) * 180) / Math.PI;
const E_SCALE = 1.5;
const BEAM_DIR = (() => {
  const dx = HERO1.x - E_TIP.x, dy = HERO1.y - E_TIP.y, l = Math.hypot(dx, dy);
  return P(dx / l, dy / l);
})();
// entry point on the lens for a lateral offset (L2 units across the cornea)
const lensEntry = (off: number): Pt => {
  const rm = (EYE2.lensRi + EYE2.lensRo) / 2;
  const y = HERO.y + off;
  return P(EYE2.lensC.x + Math.sqrt(rm * rm - y * y), y);
};
type Beam = {tA: number; off: number; end1: Pt; len: number; tE: number};
const BEAMS: Beam[] = PULSES.flatMap(([a, b], k) => {
  const out: Beam[] = [];
  for (let j = 0, tA = a; tA <= b; j++, tA += 0.12) {
    const off = (rnd(k * 31 + j * 7.7) - 0.5) * 64;
    const end1 = L2toL1(lensEntry(off));
    const len = Math.hypot(end1.x - E_TIP.x, end1.y - E_TIP.y);
    out.push({tA, off, end1, len, tE: timeAtG(G(tA) - len)});
  }
  return out;
});
const emitterOn = (t: number) => BEAMS.reduce((m, b) => Math.max(m, clamp((t - b.tE + 0.03) / 0.03) * clamp((b.tE + 0.09 - t) / 0.03)), 0);

// ---------------- wave packets (screen space) ----------------
type PK = {pts: Pt[]; d: number; len: number; lam: number; amp: number; w: number; col: string; glow: string; dash?: string; a: number};
const Packet: React.FC<{k: PK}> = ({k}) => {
  const {pts, d, len, lam, amp, w, col, glow, dash, a} = k;
  if (a <= 0.003) return null;
  const seg: number[] = [0];
  for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = seg[seg.length - 1];
  const head = Math.min(d, total), tail = d - len;
  if (d < 0 || tail >= total) return null;
  const at = (s: number) => {
    let i = 1;
    while (i < seg.length - 1 && seg[i] < s) i++;
    const u = (s - seg[i - 1]) / Math.max(1e-6, seg[i] - seg[i - 1]);
    const A = pts[i - 1], B = pts[i];
    const dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy) || 1;
    return {p: P(A.x + dx * u, A.y + dy * u), n: P(-dy / l, dx / l)};
  };
  const out: string[] = [];
  const n = 40;
  const s0 = Math.max(0, tail);
  for (let q = 0; q <= n; q++) {
    const s = lerp(s0, head, q / n);
    const {p, n: nn} = at(s);
    const env = Math.sin(Math.PI * clamp((s - tail) / len)) ** 0.8;
    const off = Math.sin(((s - d) / lam) * Math.PI * 2) * amp * env;
    out.push(`${q ? 'L' : 'M'}${(p.x + nn.x * off).toFixed(1)} ${(p.y + nn.y * off).toFixed(1)}`);
  }
  const ds = out.join('');
  return (
    <g opacity={a}>
      <path d={ds} fill="none" stroke={glow} strokeWidth={w * 3} strokeOpacity={0.3} strokeLinecap="round" />
      <path d={ds} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />
    </g>
  );
};
const nirPK = (pts: Pt[], d: number, a: number, s = 1): PK => ({pts, d, len: 170 * s, lam: 70 * s, amp: 15 * s, w: 6 * s, col: NIR.core, glow: NIR.glow, dash: `${14 * s} ${9 * s}`, a});
const grnPK = (pts: Pt[], d: number, a: number, s = 1): PK => ({pts, d, len: 120 * s, lam: 28 * s, amp: 13 * s, w: 6 * s, col: '#8DF7AE', glow: GREEN.deep, a});

// ---------------- the lead ----------------
const poseAt = (t: number, glow: number): LeadPose => ({
  lid: ramp(-0.42, TL.lidShut, t, eio),
  brow: 0.1 + 0.22 * glow + 0.1 * Math.sin(t * 1.1),
  smirk: 0.5 * ramp(5.2, 6.2, t, eio),
  gx: 0.15 + 0.12 * Math.sin(t * 1.4 + 0.5), gy: 0,
  lensOn: 1,
  glint: lerp(-0.25, 1.25, clamp(t / 0.42)),
  lidGlow: glow,
  breath: Math.sin(t * 2 * Math.PI * 0.25),
});

// ---------------- background (screen space, soft and out of focus, gentle parallax) ----------------
const Background: React.FC<{cam: Cam}> = ({cam}) => {
  const lz = Math.log(cam.z / 3.6);
  const px = -(cam.S.x - 420) * 0.12 - lz * 30, py = -(cam.S.y - 860) * 0.1;
  const k = 1 + 0.06 * clamp(lz, 0, 2);
  return (
    <g>
      <defs>
        <linearGradient id="h8bg" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#1E3640" />
          <stop offset="0.55" stopColor="#152A33" />
          <stop offset="1" stopColor="#0D1C23" />
        </linearGradient>
        <filter id="h8blur" x="-0.3" y="-0.3" width="1.6" height="1.6">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <radialGradient id="h8lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#5E8C8E" stopOpacity={0.5} />
          <stop offset="1" stopColor="#5E8C8E" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#h8bg)" />
      <g transform={`translate(${540 + px} ${960 + py}) scale(${k}) translate(-540 -960)`} filter="url(#h8blur)">
        {/* lab shelving far back on the right, a cool window glow, a bench edge */}
        <rect x={700} y={120} width={520} height={26} rx={10} fill="#2A4650" />
        <rect x={700} y={420} width={520} height={26} rx={10} fill="#2A4650" />
        {[740, 820, 905, 1000].map((x, i) => <rect key={i} x={x} y={146 + (i % 2) * 40} width={46 + (i % 3) * 14} height={274 - (i % 2) * 40} rx={18} fill={i % 2 ? '#24414B' : '#2E5058'} />)}
        {[760, 880, 1010].map((x, i) => <rect key={'b' + i} x={x} y={446} width={60} height={150 + i * 20} rx={20} fill="#203A43" />)}
        <ellipse cx={980} cy={260} rx={260} ry={220} fill="url(#h8lamp)" />
        <rect x={640} y={1180} width={600} height={60} rx={20} fill="#1B323B" />
        <rect x={640} y={1240} width={600} height={700} fill="#0F2028" />
      </g>
    </g>
  );
};

// ---------------- the frame ----------------
const Scene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t);
  const tilt = tiltAt(t);
  const C = camMat(cam);
  const MHead: Mat = mmul(C, R(tilt, NECK));
  const M2: Mat = mmul(MHead, M21);
  const zl2 = cam.z * 0.36;
  const inv2 = invMat(M2);
  const c0 = apply(inv2, P(0, 0)), c1 = apply(inv2, P(1080, 1920));
  const view = {x0: Math.min(c0.x, c1.x), x1: Math.max(c0.x, c1.x), y0: Math.min(c0.y, c1.y), y1: Math.max(c0.y, c1.y)};
  const s1 = (p: Pt) => apply(MHead, p);
  const s2 = (p: Pt) => apply(M2, p);
  const lidC = ramp(TL.lidShut - 0.12, TL.lidShut, t, (x) => x);
  const r = resp(t);
  const glow = r * lidC;
  const pose = poseAt(t, glow);
  const reveal = ramp(TL.clear0, TL.clear1, t, eout) * (1 - ramp(TL.unclear0, TL.unclear1, t, eio));
  const on = emitterOn(t);
  const inkW = 4.5 / cam.z; // thin contours: a constant 4.5 px on screen

  // ---- packets ----
  const pk: PK[] = [];
  // (a) beam packets from the LED to the eye, constant screen speed; visible until the dive gets deep
  const aBeam = 1 - clamp((zl2 - 14) / 16);
  if (aBeam > 0.01) {
    const tip = apply(C, E_TIP);
    for (const b of BEAMS) {
      if (t < b.tE - 0.05 || t > b.tA + 0.3) continue;
      const travelled = b.len - (G(b.tA) - G(t)); // L1 units from the tip
      // at the face scale the packets ride one line into the eye; closer in they spread across the cornea
      const spread = clamp((cam.z - 4.5) / 5);
      const end = s1(lerpP(HERO1, b.end1, spread));
      const Ls = Math.hypot(end.x - tip.x, end.y - tip.y);
      pk.push(nirPK([tip, end], (travelled / b.len) * Ls, aBeam * 0.95, 1.2));
    }
  }
  // (b) material scale: packets into each converting crystal, one green packet out toward the pupil
  const aMat = clamp((zl2 - 40) / 30);
  const crystal = (c: Crystal) => stateOf(EVENTS.get(c.i)!, t);
  if (aMat > 0.01) {
    const sc = clamp(zl2 / 210, 0.5, 1.15);
    const inView = (p: Pt) => p.x > view.x0 - 3 && p.x < view.x1 + 3 && p.y > view.y0 - 3 && p.y < view.y1 + 3;
    const addFor = (p: Pt, evs: Ev[], big: number) => {
      for (const ev of evs) {
        for (const a of [ev.a1, ev.a2]) {
          if (t < a - 0.45 || t > a + 0.02) continue;
          const from = P(p.x - BEAM_DIR.x * 4, p.y - BEAM_DIR.y * 4);
          const A = s2(from), B = s2(p);
          const Ls = Math.hypot(B.x - A.x, B.y - A.y);
          pk.push(nirPK([A, B], ((t - (a - 0.45)) / 0.45) * Ls + 6, aMat, sc * big));
        }
        if (t > ev.e && t < ev.e + 0.75) {
          const dir = P(RETINA_C.x - p.x, (RETINA_C.y - p.y) * 0.4);
          const l = Math.hypot(dir.x, dir.y);
          const A = s2(p), B = s2(P(p.x + (dir.x / l) * 5, p.y + (dir.y / l) * 5));
          const Ls = Math.hypot(B.x - A.x, B.y - A.y);
          pk.push(grnPK([A, B], ((t - ev.e) / 0.75) * (Ls + 100 * sc), aMat * (1 - clamp((t - ev.e - 0.55) / 0.2)), sc * big));
        }
      }
    };
    CRYSTALS.forEach((c) => inView(c.p) && addFor(c.p, EVENTS.get(c.i)!, 1));
    addFor(HERO, HERO_EV, 1.35);
  }
  // (c) section scale: green light leaving the lens through the pupil to the retina
  const aSec = clamp((zl2 - 2.5) / 2) * (1 - clamp((zl2 - 30) / 20)) * reveal;
  if (aSec > 0.01) {
    PULSES.forEach(([a, b], k) => {
      for (let j = 0; j < 3; j++) {
        const t0 = a + 0.12 + j * ((b - a) / 3);
        if (t < t0 || t > t0 + 0.7) continue;
        const y = (j - 1) * 9 + (rnd(k * 5 + j) - 0.5) * 4;
        const path = [P(HERO.x - 2, y - 4), P(88, y * 0.5), P(74, y * 0.25), P(RETINA_C.x + 2, y * 0.6)].map(s2);
        const tot = path.reduce((s, p, i) => (i ? s + Math.hypot(p.x - path[i - 1].x, p.y - path[i - 1].y) : 0), 0);
        pk.push(grnPK(path, ((t - t0) / 0.55) * (tot + 90), aSec * (1 - clamp((t - t0 - 0.5) / 0.2)), 0.9));
      }
    });
  }
  const wash = resp(t - 0.08) * reveal;
  const retina = resp(t - 0.3) * reveal;
  const heroSt = HERO_EV.length ? stateOf(HERO_EV, t) : {q: 0, g: 0};

  // the ghost of the beam (only while packets are in flight), stylised and faint
  const beamA = BEAMS.reduce((m, b) => Math.max(m, t > b.tE && t < b.tA + 0.05 ? 1 : 0), 0) * aBeam;
  const tipS = s1(E_TIP), eyeS = s1(HERO1);
  const bd = P(eyeS.x - tipS.x, eyeS.y - tipS.y), bl = Math.hypot(bd.x, bd.y) || 1, bn = P(-bd.y / bl, bd.x / bl);
  const w0 = 10 * cam.z, w1 = 26 * cam.z;
  const beamPoly = `M${tipS.x + bn.x * w0 * 0.3} ${tipS.y + bn.y * w0 * 0.3}L${eyeS.x + bn.x * w1} ${eyeS.y + bn.y * w1}L${eyeS.x - bn.x * w1} ${eyeS.y - bn.y * w1}L${tipS.x - bn.x * w0 * 0.3} ${tipS.y - bn.y * w0 * 0.3}Z`;

  return (
    <svg width={1080} height={1920} style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="h8beam" x1={tipS.x} y1={tipS.y} x2={eyeS.x} y2={eyeS.y} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={NIR.core} stopOpacity={0.22} />
          <stop offset="1" stopColor={NIR.glow} stopOpacity={0.04} />
        </linearGradient>
      </defs>
      <Background cam={cam} />
      {cam.z < 200 && (
        <g transform={matStr(MHead)}>
          <LeadHead p={pose} id="h8lead" inkW={inkW} eyeA={1 - clamp(reveal * 1.6)} />
        </g>
      )}
      {reveal > 0.001 && (
        <g transform={matStr(M2)}>
          <Section8 t={t} zl={zl2} view={view} reveal={reveal} wash={wash} retina={retina} lidTint={r * reveal}
            crystal={crystal} hero={heroSt} sparkle={(c) => (zl2 < 60 ? crystal(c).g : 0)} id="h8sec" />
        </g>
      )}
      {cam.z < 60 && (
        <g transform={matStr(mmul(C, [Math.cos((E_ANG * Math.PI) / 180) * E_SCALE, Math.sin((E_ANG * Math.PI) / 180) * E_SCALE, -Math.sin((E_ANG * Math.PI) / 180) * E_SCALE, Math.cos((E_ANG * Math.PI) / 180) * E_SCALE, E_TIP.x, E_TIP.y]))}>
          <Emitter on={on} id="h8em" inkW={inkW / E_SCALE} />
        </g>
      )}
      {pk.map((k, i) => <Packet key={i} k={k} />)}
    </svg>
  );
};

export const Hook: React.FC<HookProps> = (props) => (
  <HookFrame hook="08" W={W} bg="#152A33" capY={1500} props={props}>
    {(t) => <Scene t={t} />}
  </HookFrame>
);
export {EYE};
