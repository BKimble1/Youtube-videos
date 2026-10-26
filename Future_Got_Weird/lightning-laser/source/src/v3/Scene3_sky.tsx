// V3 scenery: the storm sky round the summit, built in world space so every camera sees the same weather.
//   sky      a gradient by elevation above the horizontal (dark overhead, a hazy band at the horizon)
//   high     a higher, farther, softer cloud layer (seen through the gaps of the deck)
//   deck     the storm deck: fewer, larger lobed masses with dark flat bases and lighter near walls. Its base is at
//            about 232 m over the summit (the bolt connects into it) and rises away from the summit, so the distant
//            deck stays above the ranges and fades into the horizon haze
//   ranges   three layered ridge lines at 1.6, 3.1 and 5.2 km, cooler and lighter with distance
// Lighting is local: lobes near the discharge get lit undersides (Scene3_light.ts), the rest stays storm-dark.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {axis3, Cam3, EXIT3, len3, Proj, sub3, v3, V3} from '../v2/p3';
import {boltSamples, lightAt} from './Scene3_light';

type Pt = {x: number; y: number};
const poly = (pts: Pt[]) => (pts.length ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z` : '');
const DEG = Math.PI / 180;

/** the film's loop length (s): the drift clocks are made periodic in it */
export const LOOP = 33.5;
/** cloud base (m) at horizontal distance d (m) from the summit */
export const CB = 232;
export const deckY = (d: number) => CB + 0.16 * Math.max(0, d - 320);

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
// its near side; seen near the horizon, a dark flat bottom under bumpy tops.
type Lobe = {dx: number; dz: number; r: number; dome: number};
type Mass = {x: number; z: number; R: number; lobes: Lobe[]; tone: number; key: number; drift: number};
const mkMass = (x: number, z: number, R: number, key: number, seed: number, stretch: number, drift: number): Mass => {
  // a big inner lobe (and often a second), then a ring of smaller lobes of mixed sizes that scallop the outline
  const a0 = hash(key, seed + 5) * 6.2832;
  const lobes: Lobe[] = [{dx: 0, dz: 0, r: R * (0.66 + 0.08 * hash(key, seed + 6)), dome: 0.5 + 0.3 * hash(key, seed + 7)}];
  if (hash(key, seed + 13) < 0.65) {
    const a = a0 + 2.4;
    lobes.push({dx: Math.cos(a) * R * 0.3 * stretch, dz: Math.sin(a) * R * 0.3, r: R * (0.42 + 0.1 * hash(key, seed + 14)), dome: 0.5 + 0.3 * hash(key, seed + 15)});
  }
  const n = 8 + Math.floor(hash(key, seed + 4) * 6);
  for (let j = 0; j < n; j++) {
    const a = a0 + (j / n) * 6.2832 + 0.5 * (hash(key * 7 + j, seed + 8) - 0.5);
    const rr = R * (0.13 + 0.2 * Math.pow(hash(key * 7 + j, seed + 9), 1.5));
    const reach = (R - rr) * (0.68 + 0.18 * hash(key * 7 + j, seed + 10));
    lobes.push({dx: Math.cos(a) * reach * stretch, dz: Math.sin(a) * reach, r: rr, dome: 0.45 + 0.5 * hash(key * 7 + j, seed + 11)});
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

/** a horizontal disc (centre c, radius r) as a screen polygon; a disc reaching behind the camera (a lobe overhead)
 *  is clipped at a near plane in world space first, so overhead lobes are drawn instead of dropped */
const ZN = 20; // no visible cloud point is this close (the deck is 140+ m away), and it keeps clipped polygons small
const lobeRing = (P: (p: V3) => Proj, c: V3, r: number, f: number): Pt[] | null => {
  const pc = P(c);
  if (pc.z < -r) return null;
  const n = pc.z > r ? clamp(Math.round((f * r) / pc.z / 7), 14, 72) : 64;
  const W: V3[] = [], Z: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832;
    const w = v3(c.x + r * Math.cos(a), c.y, c.z + r * Math.sin(a));
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
const disc = (cx: number, cy: number, r: number) => `M${fmt(cx - r)},${fmt(cy)} a${fmt(r)},${fmt(r)} 0 1,0 ${fmt(2 * r)},0 a${fmt(r)},${fmt(r)} 0 1,0 ${fmt(-2 * r)},0 Z`;
/** screen distance from p to the segment a-b */
export const segDist = (p: Pt, a: Pt, b: Pt) => {
  const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy || 1;
  const u = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / L);
  return Math.hypot(p.x - a.x - u * dx, p.y - a.y - u * dy);
};

/** the cloud layers: the soft high layer first, then the deck far to near. Where the bolt meets the base, the
 *  undersides (and less, the walls) of the masses near it are lit by a local gradient: bright at the attachment,
 *  gone within a few hundred metres; faint while the leader is still climbing. */
export const Clouds: React.FC<{cam: Cam3; P: (p: V3) => Proj; flash: number; s: number; boltTop?: V3; drift: number; id: string}> = ({cam, P, flash, s, boltTop, drift: tau, id}) => {
  if (cam.pos.y > CB - 4) return null;
  // the drift clock is the loop clock (tau3), which steps by a whole loop (33.5 s) at mid-film: a drift periodic in
  // the loop is continuous there as well as across the seam (full speed round the opening, slow at mid-film)
  const drift = (LOOP / (2 * Math.PI)) * Math.sin((2 * Math.PI * tau) / LOOP);
  const pts = s > 0 ? boltSamples(s) : [];
  const f = cam.f;
  // the active beam on screen (from the exit up past the cloud base): clouds right behind it are kept low-contrast
  const bA = P(EXIT3), bB = P(axis3(1000));
  const beamOk = bA.ok && bB.ok;
  // the lit patch on the deck above the bolt top
  let litK = 0;
  let litG: React.ReactNode = null;
  let G0: V3 | null = null;
  if (boltTop && flash > 0.02 && pts.length) {
    const g = v3(boltTop.x, deckY(Math.hypot(boltTop.x, boltTop.z)), boltTop.z);
    const pg = P(g);
    litK = flash * lightAt(g, pts, 70);
    if (pg.ok && litK > 0.02) {
      G0 = g;
      const rx = clamp((f * 220) / pg.z, 80, 4000);
      const sinE = clamp((g.y - cam.pos.y) / len3(sub3(g, cam.pos)), 0.25, 1);
      litG = (
        <radialGradient id={`${id}-lit`} gradientUnits="userSpaceOnUse" cx={fmt(pg.x)} cy={fmt(pg.y)} r={fmt(rx)} gradientTransform={`translate(${fmt(pg.x)},${fmt(pg.y)}) scale(1,${fmt(sinE)}) translate(${fmt(-pg.x)},${fmt(-pg.y)})`}>
          <stop offset="0" stopColor="#AEB7F4" stopOpacity={clamp(0.88 * litK)} />
          <stop offset="0.12" stopColor="#97A1E6" stopOpacity={clamp(0.62 * litK)} />
          <stop offset="0.35" stopColor="#7F89D2" stopOpacity={clamp(0.26 * litK)} />
          <stop offset="0.7" stopColor="#6A74BE" stopOpacity={clamp(0.07 * litK)} />
          <stop offset="1" stopColor="#5A64B0" stopOpacity={0} />
        </radialGradient>
      );
    }
  }
  // Each visible mass becomes paths: domes (walls), the base in the rim colour, the inset dark core, and the lit
  // overlay. The deck round the summit is flat (all bases at CB), where masses that overlap are one cloud: they are
  // merged into single union paths, so no rim or overlay is drawn twice inside them. Farther masses (higher bases)
  // are drawn one by one, far to near, each occluding the ones beyond it.
  type MD = {dc: number; key: string; flat: boolean; lit: boolean; fog: number; bodyD: string[]; baseD: string[]; coreD: string[]; bodyC: string; baseC: string; rimC: string};
  const CF = v3(CELL[0].x + drift * CELL[0].drift, CB, CELL[0].z);
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
      if (pc.ok) {
        const rs = (f * m.R * 1.8) / Math.max(pc.z, 1);
        if (pc.x < -rs || pc.x > 1080 + rs || pc.y < -rs || pc.y > 1920 + rs) continue;
      }
      // colours: the flat summit deck takes them all from one point (its cell centre), so they never jump between masses
      const cc = flat ? CF : c, dcc = flat ? len3(sub3(CF, cam.pos)) : dc, pcc = flat ? P(CF) : pc;
      const fog = Math.pow(clamp((dcc - (high ? 400 : 200)) / (high ? 2400 : 1650)), 0.75);
      const fogC = skyAt(elevOf(cam, cc), flash);
      const tone = flat ? 0.5 : m.tone;
      // near the beam (on screen) the masses lose some contrast, so the thin cyan line reads
      const qb = beamOk && pcc.ok ? clamp((segDist(pcc, bA, bB) - (0.5 * f * (flat ? 260 : m.R)) / Math.max(pcc.z, 1)) / 240) : 1;
      const quiet = 0.3 * (1 - qb) * (1 - fog);
      const eC = elevOf(cam, cc);
      // the walls (domes) show on masses seen at a low angle; overhead, a mass is all underside
      const domeW = clamp((40 - eC) / 24);
      // the high layer is a little lighter than the deck, so the breaks in the deck read as depth
      const hiC = mix(mix('#1E3247', '#283D53', tone), fogC, 0.4);
      const bodyC0 = high ? hiC : mix(mix('#121D29', '#162230', tone), mix('#1B2939', '#27384B', tone), domeW);
      // overhead, the base is the darkest thing in the sky; a mass seen low reads as one silhouette, its flat base only
      // a little darker than its walls (rows of dark ovals would read as spots)
      const baseC0 = high ? hiC : mix(mix('#0A121B', '#131E2A', tone), bodyC0, flat ? 0 : 0.6 * domeW);
      // the lighter rim reads on masses seen from well below; toward the horizon the bases stay plain
      const rimC0 = high ? baseC0 : mix(baseC0, '#22324A', 0.4 * clamp((eC - 14) / 16));
      const midC = mix(baseC0, bodyC0, 0.5);
      const md: MD = {
        dc, key: `${high ? 'h' : 'd'}${m.key}`, flat, fog, bodyD: [], baseD: [], coreD: [],
        lit: !!litG && !!G0 && Math.hypot(x - G0.x, m.z - G0.z) < 520 + m.R && fog < 0.9,
        baseC: mix(mix(baseC0, midC, quiet), fogC, fog), bodyC: mix(mix(bodyC0, midC, quiet), fogC, Math.pow(fog, 1.15)), rimC: mix(mix(rimC0, midC, quiet), fogC, Math.pow(fog, 1.05)),
      };
      for (const l of m.lobes) {
        const lc = v3(x + l.dx, y, m.z + l.dz);
        const ring = lobeRing(P, lc, l.r, f);
        if (!ring) continue;
        md.baseD.push(poly(ring));
        if (high) continue;
        // the dark core of the underside, inset so a thin lighter rim (thinner cloud at the edge) outlines the mass;
        // the rim is a few pixels wide whatever the distance
        const zl = Math.max(P(lc).z, 1);
        const rimW = (clamp((f * (5 + 0.1 * l.r)) / zl, 4, 20) * zl) / f;
        const core = lobeRing(P, lc, Math.max(l.r * 0.5, l.r - rimW), f);
        if (core) md.coreD.push(poly(core));
        const rs = l.r * l.dome;
        const pd = P(v3(lc.x, y + rs, lc.z));
        if (pd.ok && pd.z > 40) md.bodyD.push(disc(pd.x, pd.y, (f * rs) / pd.z));
      }
      if (md.baseD.length) out.push(md);
    }
    return out;
  };
  const litF = `url(#${id}-lit)`;
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
    const all = collect(list, lift0, high).sort((a, b) => b.dc - a.dc);
    const far = all.filter((q) => !q.flat), flat = all.filter((q) => q.flat);
    if (!flat.length) return far.map(draw);
    // the flat deck over the summit, merged into union paths. Its colours follow elevation (screen-space gradients
    // built from the same rules as single masses): darkest overhead, with walls, rim and haze taking over toward the
    // horizon, so its far lobes never turn into dark spots
    const cat = (k: 'bodyD' | 'baseD' | 'coreD') => flat.map((q) => q[k].join(' ')).filter(Boolean).join(' ');
    const anyLit = flat.some((q) => q.lit);
    const flatAt = (e: number) => {
      const dist = (CB - cam.pos.y) / Math.sin(e * DEG);
      const fog = Math.pow(clamp((dist - 200) / 1650), 0.75);
      const fogC = skyAt(e, flash);
      const domeW = clamp((40 - e) / 24);
      const body0 = mix('#141F2C', '#213244', domeW);
      const base0 = mix('#0E1925', body0, 0.6 * domeW);
      const rim0 = mix(base0, '#22324A', 0.3 * clamp((e - 14) / 16));
      return {base: mix(base0, fogC, fog), body: mix(body0, fogC, Math.pow(fog, 1.15)), rim: mix(rim0, fogC, Math.pow(fog, 1.05))};
    };
    const es = [85, 65, 50, 40, 32, 26, 21, 17, 14, 11, 8, 5, 3].filter((e) => Math.abs(e - cam.pitch) < 87);
    const grad = (k: 'base' | 'body' | 'rim') => {
      if (es.length < 2) return null;
      const y0 = elevY(cam, es[0]), y1 = elevY(cam, es[es.length - 1]);
      return (
        <linearGradient id={`${id}-f${k}`} gradientUnits="userSpaceOnUse" x1="0" y1={fmt(y0)} x2="0" y2={fmt(y1)}>
          {es.map((e) => <stop key={e} offset={fmt(clamp((elevY(cam, e) - y0) / (y1 - y0 || 1)))} stopColor={flatAt(e)[k]} />)}
        </linearGradient>
      );
    };
    const fill = (k: 'base' | 'body' | 'rim') => (es.length < 2 ? flatAt(45)[k] : `url(#${id}-f${k})`);
    return [
      ...far.map(draw),
      <g key="flat">
        <defs>{grad('base')}{grad('body')}{grad('rim')}</defs>
        {cat('bodyD') && <path d={cat('bodyD')} fill={fill('body')} />}
        {cat('bodyD') && anyLit && <path d={cat('bodyD')} fill={litF} opacity={0.55} />}
        <path d={cat('baseD')} fill={fill('rim')} />
        <path d={cat('coreD')} fill={fill('base')} />
        {anyLit && <path d={cat('baseD')} fill={litF} />}
      </g>,
    ];
  };
  return (
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
  // the ridges only matter near the horizon; looking down past it, the nearest ridge's fill is the whole background
  if (elevY(cam, 11) > 2200) return null;
  if (elevY(cam, -3) < -300) return <rect x={-20} y={-20} width={1120} height={1960} fill={mix(RIDGES[2].col, RIDGES[2].colF, flash * 0.16)} />;
  return (
    <g>
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
