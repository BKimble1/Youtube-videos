// V3 scenery: the storm sky round the summit, built in world space so every camera sees the same weather.
//   sky      a gradient by elevation above the horizontal (dark overhead, a hazy band at the horizon)
//   high     a higher, farther, softer cloud layer (seen through the gaps of the deck)
//   deck     the storm deck: fewer, larger lobed masses with dark flat bases and lighter near walls. Its base is at
//            about 232 m over the summit (the bolt connects into it) and rises away from the summit, so the distant
//            deck stays above the ranges and fades into the horizon haze. Over the summit the base is lumpy: its lobes
//            hang at a few levels, each with a lighter lip on its far side, so seen from below it reads as a cloud
//            base rather than as sky; where the bolt attaches, a darker ragged lowering hangs under it (with a little
//            scud), whose far edge crosses the main views just above the bolt top, so the branches visibly enter it
//   ranges   three layered ridge lines at 1.6, 3.1 and 5.2 km, cooler and lighter with distance
// Lighting is local: the lobes near the attachment get lit undersides (Scene3_light.ts), lobe by lobe, so the lit
// region is broken up by the lobes' lips and its outline follows them; the rest stays storm-dark.
// Magnified views (f well past every main view's) fade clouds and ridges into the sky gradient (magFade), so a
// zoom about a point of the channel shows soft haze instead of the polygons of a cloud edge.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {axis3, BOLT3, Cam3, EXIT3, len3, Proj, sub3, v3, V3} from '../v2/p3';
import {boltSamples, lightAt} from './Scene3_light';

type Pt = {x: number; y: number};
const poly = (pts: Pt[]) => (pts.length ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z` : '');
const DEG = Math.PI / 180;

/** the film's loop length (s): the drift clocks are made periodic in it */
export const LOOP = 33.5;
/** cloud base (m) at horizontal distance d (m) from the summit */
export const CB = 232;
export const deckY = (d: number) => CB + 0.16 * Math.max(0, d - 320);
/** 0 up to the longest focal length a main view uses (G's and H's close views reach 2750), 1 once a view is about
 *  2.8x past it (F's opening zoom, B's and C's pushes): clouds and ridges fade into the sky gradient in between */
export const magFade = (f: number) => clamp(Math.log(Math.max(f, 1) / 3000) / Math.log(2.8));

// ------------------------------------------------------------------ sky colour by elevation (degrees)
const SKY: [number, string][] = [[-10, '#16283A'], [0, '#284354'], [3, '#31505F'], [7, '#2B4758'], [12, '#203749'], [22, '#162839'], [40, '#0F1B2B'], [70, '#0A1422']];
const skyRaw = (e: number) => {
  if (e <= SKY[0][0]) return SKY[0][1];
  for (let i = 1; i < SKY.length; i++) if (e <= SKY[i][0]) return mix(SKY[i - 1][1], SKY[i][1], (e - SKY[i - 1][0]) / (SKY[i][0] - SKY[i - 1][0]));
  return SKY[SKY.length - 1][1];
};
/** the sky (and the haze everything distant fades into) at elevation e; the flash lifts the low haze a little */
export const skyAt = (e: number, flash: number) => mix(skyRaw(e), '#56688E', flash * 0.2 * clamp(1 - e / 25));
/** screen y of elevation e (degrees) in the camera's vertical plane (roll ignored: the gradient stays vertical) */
export const elevY = (cam: Cam3, e: number) => (cam.cy ?? 960) - cam.f * Math.tan(clamp(e - cam.pitch, -88, 88) * DEG);
export const elevOf = (cam: Cam3, p: V3) => Math.atan2(p.y - cam.pos.y, Math.hypot(p.x - cam.pos.x, p.z - cam.pos.z)) / DEG;

export const SkyGrad: React.FC<{cam: Cam3; flash: number; id: string}> = ({cam, flash, id}) => {
  const eTop = Math.min(70, cam.pitch + 86), eBot = Math.max(-10, cam.pitch - 86);
  const y0 = elevY(cam, eTop), y1 = elevY(cam, eBot);
  const stops = [eTop, ...SKY.map((s) => s[0]).filter((e) => e < eTop && e > eBot), eBot];
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={fmt(y0)} x2="0" y2={fmt(y1)}>
          {stops.map((e, i) => <stop key={i} offset={fmt(clamp((elevY(cam, e) - y0) / (y1 - y0 || 1)))} stopColor={skyAt(e, flash)} />)}
        </linearGradient>
      </defs>
      <rect x={-20} y={-20} width={1120} height={1960} fill={`url(#${id})`} />
    </g>
  );
};

// ------------------------------------------------------------------ cloud masses (world space)
// A mass is a cluster of lobes: each lobe is a flat disc on the cloud base (the dark underside) with a dome sitting on
// it (the lighter wall turned to the camera), so seen from below a mass has a flat dark base and rounded bulges on
// its near side; seen near the horizon, a dark flat bottom under bumpy tops. Under the summit deck the lobes hang at
// a few levels (lv 0-2, HL m apart), drawn highest first, so the lower lobes' lips outline them against the ones
// above; lv 3 is the lowering where the bolt attaches, lv 4 the lumps under it, lv 5 its scud.
type Lobe = {dx: number; dz: number; r: number; dome: number; lv: number; hang: number; rag: number; ph: number; inner?: boolean};
type Mass = {x: number; z: number; R: number; lobes: Lobe[]; tone: number; key: number; drift: number};
const HL = 5;
const NLV = 6;
const lobe = (dx: number, dz: number, r: number, dome: number, lv = 0, o: Partial<Lobe> = {}): Lobe => ({dx, dz, r, dome, lv, hang: HL * lv, rag: 0, ph: 0, ...o});
const mkMass = (x: number, z: number, R: number, key: number, seed: number, stretch: number, drift: number): Mass => {
  // a big inner lobe (and often a second), then a ring of smaller lobes of mixed sizes that scallop the outline
  const a0 = hash(key, seed + 5) * 6.2832;
  const lvOf = (h: number) => (h < 0.4 ? 0 : h < 0.78 ? 1 : 2);
  const lobes: Lobe[] = [lobe(0, 0, R * (0.66 + 0.08 * hash(key, seed + 6)), 0.5 + 0.3 * hash(key, seed + 7))];
  if (hash(key, seed + 13) < 0.65) {
    const a = a0 + 2.4;
    lobes.push(lobe(Math.cos(a) * R * 0.3 * stretch, Math.sin(a) * R * 0.3, R * (0.42 + 0.1 * hash(key, seed + 14)), 0.5 + 0.3 * hash(key, seed + 15), hash(key, seed + 16) < 0.5 ? 0 : 1));
  }
  const n = 8 + Math.floor(hash(key, seed + 4) * 6);
  for (let j = 0; j < n; j++) {
    const a = a0 + (j / n) * 6.2832 + 0.5 * (hash(key * 7 + j, seed + 8) - 0.5);
    const rr = R * (0.13 + 0.2 * Math.pow(hash(key * 7 + j, seed + 9), 1.5));
    const reach = (R - rr) * (0.68 + 0.18 * hash(key * 7 + j, seed + 10));
    lobes.push(lobe(Math.cos(a) * reach * stretch, Math.sin(a) * reach, rr, 0.45 + 0.5 * hash(key * 7 + j, seed + 11), lvOf(hash(key * 7 + j, seed + 17))));
  }
  // under the summit deck only: smaller, slightly ragged lobes hanging under the inner part, so the base is lumpy
  const ni = 3 + Math.floor(hash(key, seed + 18) * 3);
  for (let j = 0; j < ni; j++) {
    const a = hash(key * 11 + j, seed + 19) * 6.2832, rad = R * 0.55 * Math.sqrt(hash(key * 11 + j, seed + 20));
    lobes.push(lobe(Math.cos(a) * rad * stretch, Math.sin(a) * rad, R * (0.15 + 0.13 * hash(key * 11 + j, seed + 21)), 0, hash(key * 11 + j, seed + 22) < 0.55 ? 1 : 2, {inner: true, rag: 0.1, ph: 6.2832 * hash(key * 11 + j, seed + 23)}));
  }
  return {x, z, R, lobes, tone: hash(key, seed + 12), key, drift};
};
/** a jittered grid with gaps, sizes skewed toward medium with a few large masses, stretched along x (storm rolls) */
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
// the storm cell over the summit (the bolt connects into its base) drifts slowly; the deck round it a little faster
const CELL = [mkMass(40, 30, 175, 1, 901, 1.25, 1.2), mkMass(-130, -70, 130, 2, 903, 1.3, 2.4), mkMass(-170, 170, 140, 3, 905, 1.3, 2.4), mkMass(210, 200, 150, 4, 907, 1.3, 2.4)];
const DECK = [...CELL, ...field(300, -2400, 2400, -1500, 2900, 601, 110, 250, 0.8, 1.35, 4, {x: 20, z: 40, r: 280})];
const HIGH = field(460, -3200, 3200, -2400, 3800, 701, 220, 400, 0.66, 1.7, 2.2);

/** where BOLT3 meets the base (horizontal position), and the side the main views (A, F, the end of H) look from */
const ATT = {x: BOLT3.pts[BOLT3.pts.length - 1].x, z: BOLT3.pts[BOLT3.pts.length - 1].z};
const SIDE = {x: -0.67, z: -0.74};
/** the lowering under the cell where the bolt attaches (world x/z, drifting with CELL[0]): ragged dark lobes hanging
 *  8-14 m under the base (lv 3) with lumps hanging under them (lv 4), from just past the attachment back toward the
 *  main views' side (so, seen from there, its far edge crosses the frame through the bolt's upper branches), and
 *  small scud fragments (lv 5) under that edge */
const LOWER: Lobe[] = (() => {
  const out: Lobe[] = [];
  const at = (u: number, v: number) => ({x: ATT.x + u * SIDE.x - v * SIDE.z, z: ATT.z + u * SIDE.z + v * SIDE.x}); // u toward the views, v across
  const add = (u: number, v: number, r: number, lv: number, hang: number, rag: number, j: number) => {
    const p = at(u, v);
    out.push(lobe(p.x, p.z, r, 0, lv, {hang, rag, ph: 6.2832 * hash(j, 941)}));
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

/** the lobe's outline radius factor round its rim (1 for a round lobe; periodic, so a ragged ring closes) */
const ragK = (l: {rag: number; ph: number}, a: number) => (l.rag ? 1 + l.rag * (0.55 * Math.sin(3 * a + l.ph) + 0.3 * Math.sin(5 * a + 2.1 * l.ph) + 0.15 * Math.sin(11 * a + 3.7 * l.ph)) : 1);
/** a horizontal disc (centre c, radius r, optionally ragged) as a screen polygon; a disc reaching behind the camera (a
 *  lobe overhead) is clipped at a near plane in world space first, so overhead lobes are drawn instead of dropped */
const ZN = 20; // no visible cloud point is this close (the deck is 110+ m away), and it keeps clipped polygons small
const lobeRing = (P: (p: V3) => Proj, c: V3, r: number, f: number, sh?: {rag: number; ph: number}): Pt[] | null => {
  const pc = P(c);
  if (pc.z < -r) return null;
  const n = pc.z > r ? clamp(Math.round((f * r) / pc.z / 4), sh?.rag ? 28 : 14, 160) : 72;
  const W: V3[] = [], Z: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832;
    const rr = sh ? r * ragK(sh, a) : r;
    const w = v3(c.x + rr * Math.cos(a), c.y, c.z + rr * Math.sin(a));
    W.push(w);
    Z.push(P(w).z);
  }
  if (Z.every((z) => z >= ZN)) return W.map(P);
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    if (Z[i] >= ZN) out.push(P(W[i]));
    if ((Z[i] - ZN) * (Z[j] - ZN) < 0) {
      const t = (ZN - Z[i]) / (Z[j] - Z[i]);
      out.push(P(v3(W[i].x + (W[j].x - W[i].x) * t, W[i].y, W[i].z + (W[j].z - W[i].z) * t)));
    }
  }
  return out.length > 2 ? out : null;
};
/** a dome seen from the side: a cap a little wider than tall, so isolated lobes never read as balls or discs */
const domeE = (cx: number, cy: number, r: number) => {
  const rx = r * 1.08, ry = r * 0.8;
  return `M${fmt(cx - rx)},${fmt(cy)} a${fmt(rx)},${fmt(ry)} 0 1,0 ${fmt(2 * rx)},0 a${fmt(rx)},${fmt(ry)} 0 1,0 ${fmt(-2 * rx)},0 Z`;
};
/** screen distance from p to the segment a-b */
export const segDist = (p: Pt, a: Pt, b: Pt) => {
  const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy || 1;
  const u = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / L);
  return Math.hypot(p.x - a.x - u * dx, p.y - a.y - u * dy);
};
/** lip thickness per summit-deck level: the lowering's (lv 3) is its edge against the higher base beyond, so it is
 *  the boldest; the scud's the finest */
const LIPK = [1, 1, 1, 1.45, 1, 0.8];
/** the lit region's reach round the attachment (m): lobes whose centres lie within about this distance catch light */
const RL = 80;

/** the cloud layers: the soft high layer first, then the deck far to near, then the summit deck level by level.
 *  Where the bolt meets the base, the lobes near it (the lowering first) are lit by a local gradient: bright at the
 *  attachment, gone within about a hundred metres; faint while the leader is still climbing, and a dim glow stays
 *  on the lobes round the bolt top while the channel holds after the connection. */
export const Clouds: React.FC<{cam: Cam3; P: (p: V3) => Proj; flash: number; s: number; boltTop?: V3; drift: number; id: string}> = ({cam, P, flash, s, boltTop, drift: tau, id}) => {
  if (cam.pos.y > CB - 4) return null;
  const mk = magFade(cam.f);
  if (mk >= 0.999) return null;
  // the drift clock is the loop clock (tau3), which steps by a whole loop (33.5 s) at mid-film: a drift periodic in
  // the loop is continuous there as well as across the seam (full speed round the opening, slow at mid-film)
  const drift = (LOOP / (2 * Math.PI)) * Math.sin((2 * Math.PI * tau) / LOOP);
  const pts = s > 0 ? boltSamples(s) : [];
  const f = cam.f;
  // the active beam on screen (from the exit up past the cloud base): clouds right behind it are kept low-contrast
  const bA = P(EXIT3), bB = P(axis3(1000));
  const beamOk = bA.ok && bB.ok;
  // the lit patch on the base round the bolt top
  let litK = 0;
  let litG: React.ReactNode = null;
  let G0: V3 | null = null;
  if (boltTop && flash > 0.02 && pts.length) {
    const g = v3(boltTop.x, deckY(Math.hypot(boltTop.x, boltTop.z)), boltTop.z);
    const pg = P(g);
    const k0 = flash * lightAt(g, pts, 70);
    // once connected, the held channel keeps a dim glow on the base it runs into (the flash itself is ~0.1 then)
    litK = (s >= BOLT3.total - 0.5 ? Math.pow(k0, 0.6) : k0) * (1 - mk);
    if (pg.ok && litK > 0.02) {
      G0 = g;
      const rx = clamp((f * 1.25 * RL) / pg.z, 60, 2600);
      const sinE = clamp((g.y - cam.pos.y) / len3(sub3(g, cam.pos)), 0.25, 1);
      litG = (
        <radialGradient id={`${id}-lit`} gradientUnits="userSpaceOnUse" cx={fmt(pg.x)} cy={fmt(pg.y)} r={fmt(rx)} gradientTransform={`translate(${fmt(pg.x)},${fmt(pg.y)}) scale(1,${fmt(sinE)}) translate(${fmt(-pg.x)},${fmt(-pg.y)})`}>
          <stop offset="0" stopColor="#C4CAF8" stopOpacity={clamp(0.9 * litK)} />
          <stop offset="0.14" stopColor="#A3ACEC" stopOpacity={clamp(0.7 * litK)} />
          <stop offset="0.36" stopColor="#8790D8" stopOpacity={clamp(0.38 * litK)} />
          <stop offset="0.62" stopColor="#6E78C2" stopOpacity={clamp(0.15 * litK)} />
          <stop offset="1" stopColor="#5A64B0" stopOpacity={0} />
        </radialGradient>
      );
    }
  }
  const litF = `url(#${id}-lit)`;
  /** whether a lobe (undrifted centre x/z, radius r, stable key) is near enough the attachment to catch the light (-1:
   *  no; 0: fully; 1: partly, turned a little away): the lit region is the union of those lobes, so its outline follows
   *  them, and neighbouring lobes catch different amounts, so it breaks up lobe by lobe. It is fixed per lobe (the
   *  attachment point and the undrifted positions), so no lobe pops in or out as the leader climbs or the deck drifts */
  const litLobe = (x: number, z: number, r: number, key: number, reach = 1) => (!G0 || Math.hypot(x - ATT.x, z - ATT.z) - 0.3 * r >= RL * reach * (0.55 + 0.7 * hash(key, 971)) ? -1 : hash(key, 973) < 0.45 ? 1 : 0);
  /** the core of a lobe: shrunk a little and shifted toward the camera, so a lighter lip (thinner cloud at the edge)
   *  shows as a crescent on its far side only (5-20 px on screen at its thickest, times k) */
  const coreOf = (lc: V3, l: {r: number; rag: number; ph: number}, k = 1) => {
    const zl = Math.max(P(lc).z, 1);
    // lip L at its thickest: the core is 0.3 L smaller and 0.7 L nearer the camera, so the lip thins to 0.3 L at the
    // sides and the core covers the near edge (it overhangs it by 0.4 L, a few pixels)
    const L = Math.min(l.r * 0.4, (clamp((0.045 * f * l.r) / zl, 5, 20) * k * zl) / f);
    const th = Math.hypot(cam.pos.x - lc.x, cam.pos.z - lc.z) || 1;
    const cc = v3(lc.x + ((cam.pos.x - lc.x) / th) * 0.7 * L, lc.y, lc.z + ((cam.pos.z - lc.z) / th) * 0.7 * L);
    return lobeRing(P, cc, l.r - 0.3 * L, f, l);
  };
  // Each visible mass beyond the summit deck becomes paths: domes (walls), the base in the rim colour, the dark core
  // and the lit overlay, drawn one by one, far to near, each occluding the ones beyond it. The summit deck (all bases
  // near CB) is gathered by level instead: lobes on one level that overlap are one cloud (merged union paths), and
  // the levels are drawn highest first, which for horizontal bases seen from below is exactly the occlusion order.
  type MD = {dc: number; key: string; lit: boolean; fog: number; bodyD: string[]; baseD: string[]; coreD: string[]; bodyC: string; baseC: string; rimC: string};
  type LvB = {rim: string[]; core: string[]; litRim: string[][]; litCore: string[][]};
  const lvB: LvB[] = Array.from({length: NLV}, () => ({rim: [], core: [], litRim: [[], []], litCore: [[], []]}));
  const flatBody: string[] = [], flatLitBody: string[] = [];
  const onScreen = (pc: Proj, R: number) => {
    if (!pc.ok) return true;
    const rs = (f * R * 1.8) / Math.max(pc.z, 1);
    return !(pc.x < -rs || pc.x > 1080 + rs || pc.y < -rs || pc.y > 1920 + rs);
  };
  /** a summit-deck lobe into its level's paths (and its dome into the deck's walls) */
  const addFlat = (lc: V3, l: Lobe, lit: number) => {
    const ring = lobeRing(P, lc, l.r, f, l);
    if (!ring) return;
    const b = lvB[l.lv];
    const rp = poly(ring);
    b.rim.push(rp);
    if (lit >= 0) b.litRim[lit].push(rp);
    const core = coreOf(lc, l, LIPK[l.lv]);
    if (core) {
      const cp = poly(core);
      b.core.push(cp);
      if (lit >= 0) b.litCore[lit].push(cp);
    }
    if (l.dome > 0) {
      const rs = l.r * l.dome;
      const pd = P(v3(lc.x, lc.y + rs, lc.z));
      if (pd.ok && pd.z > 40) {
        const dd = domeE(pd.x, pd.y, (f * rs) / pd.z);
        flatBody.push(dd);
        if (lit >= 0) flatLitBody.push(dd);
      }
    }
  };
  const collect = (list: Mass[], lift0: number, high: boolean) => {
    const out: MD[] = [];
    for (const m of list) {
      const x = m.x + drift * m.drift;
      const dS = Math.hypot(x, m.z);
      // membership of the flat summit deck is fixed per mass (by its undrifted position), so nothing pops as it drifts
      const flat = !high && Math.hypot(m.x, m.z) < 330;
      const y = flat ? CB : deckY(dS) + lift0;
      const c = v3(x, y, m.z);
      const dc = len3(sub3(c, cam.pos));
      if (dc > (high ? 3600 : 2700)) continue;
      const pc = P(c);
      if (pc.z < -m.R * 1.6) continue;
      if (!onScreen(pc, m.R)) continue;
      if (flat) {
        m.lobes.forEach((l, i) => {
          const lc = v3(x + l.dx, CB - l.hang, m.z + l.dz);
          addFlat(lc, l, litLobe(m.x + l.dx, m.z + l.dz, l.r, m.key * 41 + i));
        });
        continue;
      }
      const fog = Math.max(mk, Math.pow(clamp((dc - (high ? 400 : 200)) / (high ? 2400 : 1650)), 0.75));
      const fogC = skyAt(elevOf(cam, c), flash);
      const tone = m.tone;
      // near the beam (on screen) the masses lose some contrast, so the thin cyan line reads
      const qb = beamOk && pc.ok ? clamp((segDist(pc, bA, bB) - (0.5 * f * m.R) / Math.max(pc.z, 1)) / 240) : 1;
      const quiet = 0.3 * (1 - qb) * (1 - fog);
      const eC = elevOf(cam, c);
      // the walls (domes) show on masses seen at a low angle; overhead, a mass is all underside
      const domeW = clamp((40 - eC) / 24);
      // the high layer is a little lighter than the deck, so the breaks in the deck read as depth
      const hiC = mix(mix('#1E3247', '#283D53', tone), fogC, 0.4);
      const bodyC0 = high ? hiC : mix(mix('#121D29', '#162230', tone), mix('#1B2939', '#27384B', tone), domeW);
      // a mass seen low reads as one silhouette, its flat base only a little darker than its walls (rows of dark
      // ovals would read as spots)
      const baseC0 = high ? hiC : mix(mix('#0A121B', '#131E2A', tone), bodyC0, 0.6 * domeW);
      // the lighter lip reads on masses seen from well below; toward the horizon the bases stay plain
      const rimC0 = high ? baseC0 : mix(baseC0, '#22324A', 0.4 * clamp((eC - 14) / 16));
      const midC = mix(baseC0, bodyC0, 0.5);
      const md: MD = {
        dc, key: `${high ? 'h' : 'd'}${m.key}`, fog, bodyD: [], baseD: [], coreD: [],
        lit: !!G0 && Math.hypot(m.x - ATT.x, m.z - ATT.z) < 1.6 * RL + m.R && fog < 0.9,
        baseC: mix(mix(baseC0, midC, quiet), fogC, fog), bodyC: mix(mix(bodyC0, midC, quiet), fogC, Math.pow(fog, 1.15)), rimC: mix(mix(rimC0, midC, quiet), fogC, Math.pow(fog, 1.05)),
      };
      for (const l of m.lobes) {
        if (l.inner) continue;
        const lc = v3(x + l.dx, y, m.z + l.dz);
        const ring = lobeRing(P, lc, l.r, f);
        if (!ring) continue;
        md.baseD.push(poly(ring));
        if (high) continue;
        const core = coreOf(lc, {r: l.r, rag: 0, ph: 0});
        if (core) md.coreD.push(poly(core));
        const rs = l.r * l.dome;
        const pd = P(v3(lc.x, y + rs, lc.z));
        if (pd.ok && pd.z > 40) md.bodyD.push(domeE(pd.x, pd.y, (f * rs) / pd.z));
      }
      if (md.baseD.length) out.push(md);
    }
    return out;
  };
  const draw = (q: MD) => (
    <g key={q.key}>
      {q.bodyD.length > 0 && <path d={q.bodyD.join(' ')} fill={q.bodyC} />}
      {q.bodyD.length > 0 && q.lit && <path d={q.bodyD.join(' ')} fill={litF} opacity={0.55 * (1 - q.fog)} />}
      <path d={q.baseD.join(' ')} fill={q.coreD.length ? q.rimC : q.baseC} />
      {q.coreD.length > 0 && <path d={q.coreD.join(' ')} fill={q.baseC} />}
      {q.lit && <path d={q.baseD.join(' ')} fill={litF} opacity={(q.key[0] === 'h' ? 0.35 : 1) * (1 - q.fog)} />}
    </g>
  );
  const render = (list: Mass[], lift0: number, high: boolean) => {
    const far = collect(list, lift0, high).sort((a, b) => b.dc - a.dc);
    if (high) return far.map(draw);
    // the lowering where the bolt attaches drifts with its cell
    const dx0 = drift * CELL[0].drift;
    LOWER.forEach((l, i) => {
      const lc = v3(l.dx + dx0, CB - l.hang, l.dz);
      addFlat(lc, l, litLobe(l.dx, l.dz, l.r, 7000 + i, 1.25));
    });
    if (!lvB.some((b) => b.rim.length)) return far.map(draw);
    // the summit deck's colours follow elevation (screen-space gradients built from the same rules as single masses):
    // darkest overhead, with walls and haze taking over toward the horizon, so its far lobes never turn into spots.
    // Overhead the levels separate by tone (the lower lobes a little lighter), the lips are lighter still, and the
    // lowering is the darkest thing in the sky.
    const flatAt = (e: number) => {
      const dist = (CB - cam.pos.y) / Math.sin(Math.max(e, 0.5) * DEG);
      const fog = Math.max(mk, Math.pow(clamp((dist - 200) / 1650), 0.75));
      const fogC = skyAt(e, flash);
      const domeW = clamp((40 - e) / 24);
      const over = clamp((e - 12) / 20);
      const body0 = mix('#141F2C', '#213244', domeW);
      const base0 = mix('#0E1925', body0, 0.6 * domeW);
      const lip0 = mix(base0, '#2C3E56', 0.18 + 0.4 * over);
      const fb = (c: string) => mix(c, fogC, fog), fl = (c: string) => mix(c, fogC, Math.pow(fog, 1.05));
      const low = mix(base0, '#04080D', 0.4);
      const core = [base0, mix(base0, lip0, 0.17 * over), mix(base0, lip0, 0.32 * over), low, mix(low, '#04080D', 0.12), mix(low, '#04080D', 0.2)];
      const rim = [lip0, lip0, lip0, mix(lip0, '#3A4E68', 0.25 * over), mix(lip0, low, 0.15), mix(lip0, low, 0.3)];
      return {body: mix(body0, fogC, Math.pow(fog, 1.15)), core: core.map(fb), rim: rim.map(fl)};
    };
    const es = [85, 65, 50, 40, 32, 26, 21, 17, 14, 11, 8, 5, 3].filter((e) => Math.abs(e - cam.pitch) < 87);
    const cols = es.map(flatAt);
    const y0 = es.length > 1 ? elevY(cam, es[0]) : 0, y1 = es.length > 1 ? elevY(cam, es[es.length - 1]) : 1;
    const gradDefs: React.ReactNode[] = [];
    const fillOf = (key: string, pick: (c: ReturnType<typeof flatAt>) => string) => {
      if (es.length < 2) return pick(flatAt(45));
      gradDefs.push(
        <linearGradient key={key} id={`${id}-f${key}`} gradientUnits="userSpaceOnUse" x1="0" y1={fmt(y0)} x2="0" y2={fmt(y1)}>
          {es.map((e, i) => <stop key={e} offset={fmt(clamp((elevY(cam, e) - y0) / (y1 - y0 || 1)))} stopColor={pick(cols[i])} />)}
        </linearGradient>,
      );
      return `url(#${id}-f${key})`;
    };
    const bodyF = flatBody.length ? fillOf('b', (c) => c.body) : '';
    const levels = lvB.map((b, lv) => (b.rim.length ? {b, lv, rimF: fillOf(`r${lv}`, (c) => c.rim[lv]), coreF: fillOf(`c${lv}`, (c) => c.core[lv])} : null)).filter((x): x is NonNullable<typeof x> => !!x);
    // the light on each level: the lips (thin cloud) catch a little more than the cores, so lit lobes stay separate
    const litR = [0.8, 0.85, 0.9, 1, 1, 1], litC = [0.62, 0.66, 0.7, 0.76, 0.8, 0.8];
    return [
      ...far.map(draw),
      <g key="flat">
        <defs>{gradDefs}</defs>
        {flatBody.length > 0 && <path d={flatBody.join(' ')} fill={bodyF} />}
        {flatLitBody.length > 0 && litG && <path d={flatLitBody.join(' ')} fill={litF} opacity={0.5} />}
        {levels.map(({b, lv, rimF, coreF}) => (
          <g key={lv}>
            <path d={b.rim.join(' ')} fill={rimF} />
            {litG && b.litRim.map((d, k) => (d.length > 0 ? <path key={`r${k}`} d={d.join(' ')} fill={litF} opacity={fmt(litR[lv] * (k ? 0.6 : 1))} /> : null))}
            {b.core.length > 0 && <path d={b.core.join(' ')} fill={coreF} />}
            {litG && b.litCore.map((d, k) => (d.length > 0 ? <path key={`c${k}`} d={d.join(' ')} fill={litF} opacity={fmt(litC[lv] * (k ? 0.5 : 1))} /> : null))}
          </g>
        ))}
      </g>,
    ];
  };
  const body = (
    <g>
      <defs>
        <filter id={`${id}-hb`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation="7" />
        </filter>
        {litG}
      </defs>
      <g filter={`url(#${id}-hb)`}>{render(HIGH, 360, true)}</g>
      {render(DECK, 0, false)}
    </g>
  );
  // magnified, the layers fade as one into the sky gradient behind them (soft haze, no doubled edges)
  return mk > 0.001 ? <g opacity={fmt(1 - mk)}>{body}</g> : body;
};

// ------------------------------------------------------------------ the ranges (three ridge lines in world space)
// Each ridge is a ring of peaks at distance D round the summit, its profile a function of world azimuth (so it never
// swims when the camera turns): a broad massif shape, sharp ridged peaks and a little rocky jag. Farther ridges are
// taller on screen, lighter and closer to the haze; the nearest is darkest and closes the ground below the horizon.
type Ridge = {D: number; e0: number; e1: number; scale: number; peakW: number; seed: number; col: string; colF: string};
const RIDGES: Ridge[] = [
  {D: 5200, e0: 3.2, e1: 9.0, scale: 15, peakW: 0.5, seed: 211, col: '#253B4D', colF: '#4C5F88'},
  {D: 3100, e0: 1.6, e1: 6.6, scale: 11, peakW: 0.42, seed: 223, col: '#182A3A', colF: '#3B4D72'},
  {D: 1600, e0: -1.2, e1: 3.8, scale: 8, peakW: 0.3, seed: 227, col: '#0E1A25', colF: '#2A3856'},
];
const EYE = 90; // the ridge heights are designed as elevations seen from the tower's mid height
const ridgeE = (L: Ridge, th: number) => {
  const a = th / L.scale;
  // broad massifs, a few sharper summits on them, a little rocky texture
  const mass = clamp(0.5 + 0.5 * (0.7 * noise1(a * 0.6, L.seed) + 0.3 * noise1(a * 1.5 + 2.3, L.seed + 1)));
  const peak = Math.pow(1 - Math.abs(noise1(a * 1.1 + 5.3, L.seed + 3)), 2.2) * (0.4 + 0.6 * mass);
  const jag = noise1(a * 5 + 0.7, L.seed + 4) * 0.6 + noise1(a * 9 + 0.3, L.seed + 5) * 0.4;
  return L.e0 + (L.e1 - L.e0) * clamp((1 - L.peakW) * mass + L.peakW * peak + 0.035 * jag);
};
const RSTEP = 0.3; // ridge samples at fixed world azimuths (degrees), so the silhouettes never swim as a camera turns
export const Ranges: React.FC<{cam: Cam3; P: (p: V3) => Proj; flash: number}> = ({cam, P, flash}) => {
  // magnified views see the ridges as soft haze (see magFade)
  const mk = magFade(cam.f);
  if (mk >= 0.999) return null;
  // the ridges only matter near the horizon; looking down past it, the nearest ridge's fill is the whole background
  if (elevY(cam, 11) > 2200) return null;
  if (elevY(cam, -3) < -300) return <rect x={-20} y={-20} width={1120} height={1960} fill={mix(RIDGES[2].col, RIDGES[2].colF, flash * 0.16)} opacity={fmt(1 - mk)} />;
  return (
    <g opacity={mk > 0.001 ? fmt(1 - mk) : undefined}>
      {RIDGES.map((L, li) => {
        const top: Pt[] = [];
        for (let i = Math.floor((cam.yaw - 88) / RSTEP); i <= Math.ceil((cam.yaw + 88) / RSTEP); i++) {
          const th = i * RSTEP;
          const e = ridgeE(L, th);
          const h = EYE + L.D * Math.tan(e * DEG);
          const q = P(v3(L.D * Math.sin(th * DEG), h, L.D * Math.cos(th * DEG)));
          if (q.ok) top.push(q);
        }
        if (top.length < 2) return null;
        const d = poly([...top, {x: top[top.length - 1].x, y: 4000}, {x: top[0].x, y: 4000}]);
        return <path key={li} d={d} fill={mix(L.col, L.colF, flash * 0.16)} />;
      })}
    </g>
  );
};
