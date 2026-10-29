// The V2 seabed set (scene 5): a shallow rocky bottom in the slug's world units (1 unit ~ 0.2 mm), seen through
// green-blue water. Back to front: the water column with soft surface light, fogged reef shapes far behind, the
// rock floor (mottled with coralline crust, turf and sand pockets, fading into the water with distance), and a
// tuft of Bryopsis: soft siphonous fronds, a bare stalk branching into two rows of curved, tapering pinnules
// (a pyramidal outline), translucent and swaying. One frond is the food: where the slug pierces it, its
// contents drain and the emptied filament turns pale and clear.
import React from 'react';
import {Basis, P2, V3, depth, proj, projPoly} from '../../kit/three';
import {Item} from '../../kit/draw3';
import {mix} from '../../kit/dc/color';
import {clamp, lerp, rng} from '../../lib';

export const WATER = '#2C7A7C';
const WATER_TOP = '#7CC1AE', WATER_DEEP = '#164E5C';
// the live palette (V2-V4 muted; V5 vivid): set per frame by the compositor
export const PAL = {water: WATER, top: WATER_TOP, deep: WATER_DEEP, floor: '#948C72', reef: '#3F6E63'};
export const seaPalette = (vivid: boolean) => {
  Object.assign(PAL, vivid ? {water: '#1C8C95', top: '#8EE0CF', deep: '#0A4766', floor: '#B7A57A', reef: '#2E7D6E'} : {water: WATER, top: WATER_TOP, deep: WATER_DEEP, floor: '#948C72', reef: '#3F6E63'});
};

type Frond = {base: V3; h: number; phi: number; lean: number; seed: number; ph: number; food?: boolean; fore?: boolean};
/** the tuft, placed round the feeding point FEED (the stalk the slug pierces) */
export const FEED: V3 = [0.4, 36.6, 0];
const FR = rng(515);
export const FRONDS: Frond[] = [{base: FEED, h: 84, phi: 1.62, lean: 0.18, seed: 1, ph: 0, food: true}];
for (let i = 0; i < 22; i++) {
  const a = FR() * Math.PI * 2, r = 12 + FR() * 60;
  FRONDS.push({base: [FEED[0] + Math.cos(a) * r, FEED[1] + 22 + Math.abs(Math.sin(a)) * r, 0], h: 55 + FR() * 85, phi: FR() * Math.PI, lean: 0.1 + FR() * 0.3, seed: i + 2, ph: FR() * 6});
}
// a few further off (soft, behind) and two close to the lens (very soft, in front)
for (let i = 0; i < 14; i++) FRONDS.push({base: [-200 + FR() * 400, 140 + FR() * 300, 0], h: 80 + FR() * 120, phi: FR() * Math.PI, lean: 0.1 + FR() * 0.2, seed: 40 + i, ph: FR() * 6});
// nothing grows where the slug lies (its regrowing body runs back along +y from the feeding point)
for (let i = FRONDS.length - 1; i > 0; i--) {
  const b = FRONDS[i].base;
  if (Math.abs(b[0] - FEED[0]) < 22 && b[1] > FEED[1] - 4 && b[1] < FEED[1] + 130) FRONDS.splice(i, 1);
}
FRONDS.push({base: [-34, -30, 0], h: 70, phi: 1.2, lean: 0.3, seed: 70, ph: 1, fore: true});
FRONDS.push({base: [40, -44, 0], h: 85, phi: 2.0, lean: 0.25, seed: 71, ph: 2.5, fore: true});

const fog = (B: Basis, focusZ: number, p: V3) => clamp((depth(B, p) - focusZ) / (focusZ * 3.2), 0, 1);
const blurOf = (z: number, focusZ: number) => {
  const d = (z - focusZ) / focusZ;
  return d > 0 ? clamp(d * 7, 0, 10) : clamp(-d * 14, 0, 10);
};
const pickBlur = (b: number) => (b < 1 ? 0 : [2, 4, 7, 10].reduce((a, c) => (Math.abs(c - b) < Math.abs(a - b) ? c : a), 2));

/** frond geometry: the stalk and, at stations along it, pinnules either side in the frond's plane */
const frondGeo = (fr: Frond, t: number) => {
  const n = 22;
  const ax: V3[] = [];
  const dx = Math.cos(fr.phi), dy = Math.sin(fr.phi);
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const sw = Math.sin(t * 0.9 + fr.ph + u * 1.6) * 3.2 * u * u + Math.sin(t * 2.1 + fr.ph * 2 + u * 3) * 0.7 * u;
    const lean = fr.lean * fr.h * u * u;
    ax.push([fr.base[0] + dx * (lean + sw) - dy * sw * 0.4, fr.base[1] + dy * (lean + sw) + dx * sw * 0.4, fr.h * u * (1 - 0.12 * u * fr.lean)]);
  }
  const at = (u: number): V3 => {
    const x = u * n, i = Math.min(n - 1, Math.floor(x)), k = x - i;
    return [ax[i][0] + (ax[i + 1][0] - ax[i][0]) * k, ax[i][1] + (ax[i + 1][1] - ax[i][1]) * k, ax[i][2] + (ax[i + 1][2] - ax[i][2]) * k];
  };
  const R = rng(fr.seed * 31);
  const pins: {u: number; side: number; pts: V3[]}[] = [];
  const u0 = 0.16;
  for (let u = u0; u < 0.985; u += 1.7 / fr.h) {
    for (const side of [1, -1]) {
      const uu = u + (side > 0 ? 0 : 0.85 / fr.h);
      const L = (2 + 11 * Math.pow(1 - (uu - u0) / (1 - u0), 0.9)) * (0.8 + R() * 0.35);
      const p0 = at(uu), p1 = at(Math.min(1, uu + 0.01));
      const tz: V3 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
      const tl = Math.hypot(tz[0], tz[1], tz[2]) || 1;
      const up: V3 = [tz[0] / tl, tz[1] / tl, tz[2] / tl];
      // out along the frond plane, then curving up toward the tip; a little flutter
      const fl = Math.sin(t * 2.4 + uu * 30 + fr.ph) * 0.12;
      const ang = 1.05 - 0.25 * R() + fl;
      const out: V3 = [dx * side, dy * side, 0];
      const pts: V3[] = [];
      for (let k = 0; k <= 4; k++) {
        const s = k / 4;
        const a = ang - s * (0.22 + 0.12 * R());
        const o = Math.sin(a) * L * s, w = Math.cos(a) * L * s;
        pts.push([p0[0] + out[0] * o + up[0] * w, p0[1] + out[1] * o + up[1] * w, p0[2] + out[2] * o + up[2] * w]);
      }
      pins.push({u: uu, side, pts});
    }
  }
  return {ax, at, pins};
};

const GREEN = '#63B947', GREEN_HI = '#B4E487', GREEN_DK = '#2F7430', EMPTY = '#DDEBCB';

/** depth-sorted items for the fronds (blurred by distance from the focal plane, fogged behind) */
export const frondItems = (B: Basis, id: string, t: number, focusZ: number, feed: {u: number; drain: number; down?: boolean; flow?: number; gone?: number}, fade = 0): Item[] =>
  FRONDS.map((fr, i) => {
    if (fade > 0.99) return {z: 0, el: null};
    const G = frondGeo(fr, t);
    const mid = G.at(0.35);
    const z = depth(B, mid);
    if (z < 4 || (!fr.fore && !fr.food && z < focusZ * 0.92)) return {z, el: null};
    const fg = fog(B, focusZ, mid);
    const b = pickBlur(blurOf(z, focusZ));
    const s = proj(B, mid).s;
    // the food frond drains from the puncture outward: the emptied part is pale and clear
    // V2: drains outward from the puncture. V3 (down): the contents run down to the puncture, so the frond clears
    // from its tips toward the stalk base
    const drained = (u: number) => (!fr.food ? 0 : feed.down ? clamp((feed.drain * 1.35 - (1 - u)) * 3, 0, 1) : clamp((feed.drain * 1.3 - Math.abs(u - feed.u) * 1.6) * 3, 0, 1));
    const col = (c: string, u: number) => mix(mix(c, EMPTY, drained(u) * 0.9), PAL.water, fg * 0.85);
    const P = (p: V3) => proj(B, p);
    const axPts = G.ax.map(P);
    const els: React.ReactNode[] = [];
    // pinnules, back side first
    G.pins.forEach((pn, k) => {
      const q = pn.pts.map(P);
      const d = `M${P2(q[0])} C${P2(q[1])} ${P2(q[2])} ${P2(q[3])} S${P2(q[4])} ${P2(q[4])}`;
      const w = Math.max(0.9, 0.42 * q[0].s);
      const dr = drained(pn.u);
      els.push(
        <g key={k} opacity={1 - 0.35 * dr}>
          <path d={d} stroke={col(GREEN_DK, pn.u)} strokeWidth={w * 1.6} fill="none" strokeLinecap="round" opacity={0.55} />
          <path d={d} stroke={col(GREEN, pn.u)} strokeWidth={w} fill="none" strokeLinecap="round" />
          <path d={d} stroke={col(GREEN_HI, pn.u)} strokeWidth={w * 0.32} fill="none" strokeLinecap="round" opacity={0.8} />
        </g>,
      );
    });
    // the stalk: one smooth tapering stroke, with the drained part over it in pale
    const sd = (pts: typeof axPts) => `M${P2(pts[0])} ` + pts.slice(1).map((q, k) => `Q${P2(pts[k])} ${P2({x: (pts[k].x + q.x) / 2, y: (pts[k].y + q.y) / 2})}`).join(' ') + ` L${P2(pts[pts.length - 1])}`;
    const wS = Math.max(1.2, 0.75 * axPts[2].s);
    const dS = sd(axPts);
    els.push(<path key="s0" d={dS} stroke={col(GREEN_DK, 0.5)} strokeWidth={wS * 1.3} fill="none" strokeLinecap="round" opacity={0.6} />);
    els.push(<path key="s1" d={dS} stroke={col(GREEN, 0.5)} strokeWidth={wS} fill="none" strokeLinecap="round" />);
    if (fr.food && feed.drain > 0) {
      const n = axPts.length - 1;
      if (feed.down) {
        const from = Math.round(clamp(1 - feed.drain * 1.35, 0, 1) * n);
        if (from < n) els.push(<path key="s2" d={sd(axPts.slice(from))} stroke={EMPTY} strokeWidth={wS * 0.95} fill="none" strokeLinecap="round" opacity={0.92} />);
      } else {
        const top = Math.round(clamp((feed.drain * 1.3) / 1.6 + feed.u, 0, 1) * n);
        if (top >= 1) els.push(<path key="s2" d={sd(axPts.slice(0, top + 1))} stroke={EMPTY} strokeWidth={wS * 0.95} fill="none" strokeLinecap="round" opacity={0.92} />);
      }
    }
    // V3: chloroplast-green cytoplasm streaming down the stalk into the puncture while the slug feeds
    if (fr.food && (feed.flow ?? 0) > 0.01) {
      const n = axPts.length - 1;
      for (let k = 0; k < 16; k++) {
        const ph = ((t * 1.6 + k / 16) % 1 + 1) % 1; // 0 at the top of the green part .. 1 at the puncture
        const uTop = clamp(1 - feed.drain * 1.35, feed.u + 0.08, 0.8);
        const u = lerp(uTop, feed.u, ph);
        const x = u * n, j = Math.min(n - 1, Math.floor(x)), r = x - j;
        const q = {x: axPts[j].x + (axPts[j + 1].x - axPts[j].x) * r, y: axPts[j].y + (axPts[j + 1].y - axPts[j].y) * r};
        els.push(<ellipse key={`fl${k}`} cx={q.x} cy={q.y} rx={wS * 0.42} ry={wS * 0.32} fill="#1F6B22" stroke="#C8F09A" strokeWidth={Math.max(0.8, wS * 0.06)} opacity={(feed.flow ?? 0) * Math.sin(Math.PI * ph)} />);
      }
    }
    els.push(<path key="s3" d={dS} stroke={GREEN_HI} strokeWidth={wS * 0.28} fill="none" strokeLinecap="round" opacity={0.55 * (1 - fg)} />);
    // the base: a small holdfast of rhizoids on the rock
    const bp = P(fr.base);
    els.push(<ellipse key="hf" cx={bp.x} cy={bp.y} rx={1.6 * bp.s} ry={0.6 * bp.s} fill={mix('#3E6A34', PAL.water, fg * 0.8)} opacity={0.8} />);
    void s;
    return {z, el: <g key={`fd${i}`} filter={b ? `url(#${id}rb${b})` : undefined} opacity={0.94 * (1 - fade) * (fr.food ? 1 - (feed.gone ?? 0) : 1)}>{els}</g>};
  });

const blob = (c: V3, rx: number, ry: number, rot: number, n: number, R: () => number): V3[] =>
  Array.from({length: n}, (_, k) => {
    const a = (k / n) * Math.PI * 2, r = 1 + (R() - 0.5) * 0.5;
    const x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r;
    return [c[0] + x * Math.cos(rot) - y * Math.sin(rot), c[1] + x * Math.sin(rot) + y * Math.cos(rot), c[2]];
  });
const PR = rng(909);
const PATCHES = Array.from({length: 150}, () => {
  const k = PR();
  return {c: [(PR() - 0.5) * 700, (PR() - 0.4) * 900, 0.04] as V3, r: 4 + PR() * 22, rot: PR() * 6, col: k < 0.35 ? '#B88E8C' : k < 0.6 ? '#6F7C46' : k < 0.85 ? '#A89F82' : '#7E7764', seed: Math.floor(PR() * 1e6)};
});
const REEF = Array.from({length: 9}, (_, i) => ({c: [-700 + i * 175 + (PR() - 0.5) * 80, 1300 + PR() * 500, 0] as V3, w: 120 + PR() * 160, h: 60 + PR() * 130}));

export const SeaBack: React.FC<{B: Basis; id: string; t: number; focusZ: number}> = ({B, id, t, focusZ}) => {
  // the floor in bands from near to far, each fogged toward the water colour
  const bands: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const y0 = -300 + i * i * 6, y1 = -300 + (i + 1) * (i + 1) * 6;
    const fg = fog(B, focusZ, [0, (y0 + y1) / 2, 0]);
    bands.push(<path key={i} d={projPoly(B, [[-3000, y0, 0], [3000, y0, 0], [3000, y1 + 2, 0], [-3000, y1 + 2, 0]])} fill={mix(PAL.floor, PAL.water, 0.2 + Math.pow(fg, 0.8) * 0.8)} />);
  }
  const patches = PATCHES.map((p, i) => {
    const fg = fog(B, focusZ, p.c);
    if (depth(B, p.c) < 5) return null;
    return <path key={i} d={projPoly(B, blob(p.c, p.r, p.r * 0.7, p.rot, 9, rng(p.seed)))} fill={mix(p.col, PAL.water, 0.2 + fg * 0.8)} opacity={0.85} />;
  });
  const rays = [0, 1, 2, 3, 4].map((k) => {
    const x = 120 + k * 230 + Math.sin(t * 0.35 + k * 1.7) * 40;
    return <path key={k} d={`M${x - 60},-40 L${x + 70},-40 L${x + 330},1500 L${x + 80},1500Z`} fill="#E9FFF2" opacity={0.07 + 0.03 * Math.sin(t * 0.8 + k)} />;
  });
  const hy = proj(B, [0, 6000, 0]).y;
  const SR = rng(12);
  const snow = Array.from({length: 46}, (_, k) => {
    const x = ((SR() * 1080 + t * (6 + SR() * 10)) % 1120) - 20, y = ((SR() * 1920 - t * (8 + SR() * 8)) % 1920 + 1920) % 1920;
    return <circle key={k} cx={x} cy={y} r={1 + SR() * 2.6} fill="#F2FFF6" opacity={0.18 + SR() * 0.25} />;
  });
  return (
    <g>
      <defs>
        <linearGradient id={`${id}wg`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={Math.max(200, hy)}>
          <stop offset="0" stopColor={PAL.top} />
          <stop offset="1" stopColor={mix(PAL.floor, PAL.water, 1)} />
        </linearGradient>
        <filter id={`${id}sb`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={18} /></filter>
        <filter id={`${id}pb`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={2.2} /></filter>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${id}wg)`} />
      <g filter={`url(#${id}sb)`}>
        {REEF.map((r, i) => {
          const pts: V3[] = Array.from({length: 14}, (_, k) => {
            const a = (k / 13) * Math.PI;
            return [r.c[0] + Math.cos(a) * r.w, r.c[1], Math.sin(a) * r.h * (0.8 + 0.2 * Math.sin(k * 2.3 + i))];
          });
          return <path key={i} d={projPoly(B, pts)} fill={mix(PAL.reef, PAL.water, 0.55)} opacity={0.8} />;
        })}
        {rays}
      </g>
      {bands}
      <g filter={`url(#${id}pb)`}>{patches}</g>
      {snow}
    </g>
  );
};

/** water-light over everything (a gentle top-down falloff and vignette) */
export const SeaOver: React.FC<{id: string}> = ({id}) => (
  <g>
    <defs>
      <radialGradient id={`${id}sv`} cx="0.5" cy="0.45" r="0.8">
        <stop offset="0.6" stopColor={PAL.deep} stopOpacity={0} />
        <stop offset="1" stopColor={PAL.deep} stopOpacity={0.45} />
      </radialGradient>
    </defs>
    <rect width={1080} height={1920} fill={`url(#${id}sv)`} />
  </g>
);
