// The outdoor practice area beside the workshop shed in the hills: a mown field with a beaten dirt pad where the board
// takes off, the corrugated-roof shed (the same building the workshop scenes are inside), a few trees, a fence, rolling
// hills and the gorge mountains behind. Fallen leaves on the pad are blown out by the downwash, and dust rings spread
// from under the board. Ground: y = 0; the pad is centred on the origin.
import React from 'react';
import {hash, noise1} from '../dc/math';
import {circ3, f2, mix, polyD, proj, shade, lit} from '../eng/draw';
import {clipNear, d3, H, Lens, s3, V3, v3, W} from '../eng/v3';
import {horizon, Sky} from './River';

const PALF = {
  grass: '#8DB26B',
  grassFar: '#A9C48E',
  grassDeep: '#6E9555',
  dirt: '#C9AE84',
  dirtDeep: '#A88D66',
  hill: ['#7FA67A', '#9DBBA0', '#BCD0CB'],
  plank: '#A2774E',
  plankDeep: '#7A5638',
  tin: '#9FAAB1',
  tree: '#5E8A4E',
  trunk: '#6B4E36',
};

/** a ring of hills at radius R around the field (quads between successive crest samples) */
const HillRing: React.FC<{L: Lens; R: number; base: number; amp: number; color: string; seed: number}> = ({L, R, base, amp, color, seed}) => {
  const n = 120;
  const ds: string[] = [];
  const crest: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const h = base + amp * (0.55 + 0.45 * noise1(i / 7, seed) + 0.25 * noise1(i / 2.3, seed + 1));
    crest.push(v3(Math.cos(a) * R, h, Math.sin(a) * R));
  }
  for (let i = 0; i < n; i++) {
    const a = crest[i], b = crest[i + 1];
    const q = clipNear(L, [a, b, v3(b.x, -2, b.z), v3(a.x, -2, a.z)], 1);
    if (q.length < 3) continue;
    const pp = proj(L, q);
    if (pp.every((p) => p.x < -50) || pp.every((p) => p.x > W + 50)) continue;
    ds.push(polyD(pp));
  }
  return <path d={ds.join(' ')} fill={color} stroke={color} strokeWidth={1} />;
};

const SHED_X = -17, SHED_Z = 21;
const TREES: {x: number; z: number; h: number; r: number}[] = Array.from({length: 26}, (_, i) => {
  const a = hash(i, 71) * Math.PI * 2;
  const d = 16 + hash(i, 72) * 46;
  return {x: Math.cos(a) * d, z: Math.sin(a) * d, h: 4 + hash(i, 73) * 5, r: 1.6 + hash(i, 74) * 1.6};
}).filter((t) => !(t.x < SHED_X + 7 && t.x > SHED_X - 7 && t.z > SHED_Z - 7 && t.z < SHED_Z + 7));

const Tree: React.FC<{L: Lens; x: number; z: number; h: number; r: number; i: number; wind: number}> = ({L, x, z, h, r, i, wind}) => {
  const base = v3(x, 0, z);
  const crown = v3(x + wind * 0.12 * Math.sin(i), h * 0.72, z);
  // V5: a tree is drawn only when its base and its crown are both well in front of the camera; a crown almost level
  // with the camera plane projected to circles (and a ground shadow) tens of thousands of pixels across, which tinted
  // the whole frame until the camera turned away from it
  if (d3(s3(base, L.pos), L.f) < 2 || d3(s3(crown, L.pos), L.f) < 2) return null;
  const top = L.p(v3(x, h * 0.55, z));
  const b = L.p(base);
  const c = L.p(crown);
  const R = r * c.k;
  if (R > 4000) return null;
  const col = mix(PALF.tree, '#7AA06A', hash(i, 75) * 0.5);
  return (
    <g>
      <ellipse cx={f2(b.x)} cy={f2(b.y)} rx={f2(r * 1.1 * b.k)} ry={f2(r * 0.25 * b.k)} fill="#3F5E35" opacity={0.25} />
      <path d={`M${f2(b.x)},${f2(b.y)} L${f2(top.x)},${f2(top.y)}`} stroke={PALF.trunk} strokeWidth={f2(Math.max(1, 0.22 * b.k))} strokeLinecap="round" />
      {[[-0.45, 0.15, 0.7], [0.4, 0.1, 0.75], [0, -0.35, 0.85], [0, 0.1, 0.9]].map(([u, v, s], k) => (
        <circle key={k} cx={f2(c.x + u * R)} cy={f2(c.y + v * R)} r={f2(s * R)} fill={k === 3 ? lit(col, 0.1) : shade(col, 0.08 * k)} stroke="#2F4A2A" strokeWidth={f2(Math.max(0.6, 0.012 * c.k))} paintOrder="stroke" />
      ))}
    </g>
  );
};

/** the workshop shed: plank walls, a corrugated tin roof, a wide open door (same building as the interior set) */
// (V5: further left and back, so its roofline never runs into his helmet in the standing cameras)
export const SHED = {x: -17, z: 21, w: 9, d: 7, h: 3.2, roof: 4.4};
const Shed: React.FC<{L: Lens}> = ({L}) => {
  const {x, z, w, d, h, roof} = SHED;
  const P = (px: number, py: number, pz: number) => v3(x + px, py, z + pz);
  const faces: {pts: V3[]; color: string; n: V3}[] = [
    {pts: [P(-w / 2, 0, -d / 2), P(w / 2, 0, -d / 2), P(w / 2, h, -d / 2), P(-w / 2, h, -d / 2)], color: PALF.plank, n: v3(0, 0, -1)},
    {pts: [P(w / 2, 0, -d / 2), P(w / 2, 0, d / 2), P(w / 2, h, d / 2), P(w / 2, roof, 0), P(w / 2, h, -d / 2)], color: shade(PALF.plank, 0.15), n: v3(1, 0, 0)},
    {pts: [P(-w / 2, 0, d / 2), P(-w / 2, 0, -d / 2), P(-w / 2, h, -d / 2), P(-w / 2, roof, 0), P(-w / 2, h, d / 2)], color: shade(PALF.plank, 0.25), n: v3(-1, 0, 0)},
    {pts: [P(-w / 2, 0, d / 2), P(w / 2, 0, d / 2), P(w / 2, h, d / 2), P(-w / 2, h, d / 2)], color: shade(PALF.plank, 0.2), n: v3(0, 0, 1)},
    {pts: [P(-w / 2 - 0.3, h - 0.05, -d / 2 - 0.4), P(w / 2 + 0.3, h - 0.05, -d / 2 - 0.4), P(w / 2 + 0.3, roof, 0), P(-w / 2 - 0.3, roof, 0)], color: PALF.tin, n: v3(0, 0.8, -0.6)},
    {pts: [P(-w / 2 - 0.3, h - 0.05, d / 2 + 0.4), P(w / 2 + 0.3, h - 0.05, d / 2 + 0.4), P(w / 2 + 0.3, roof, 0), P(-w / 2 - 0.3, roof, 0)], color: shade(PALF.tin, 0.2), n: v3(0, 0.8, 0.6)},
  ];
  const vis = faces.filter((f) => {
    const c = f.pts.reduce((a, q) => v3(a.x + q.x / f.pts.length, a.y + q.y / f.pts.length, a.z + q.z / f.pts.length), v3(0, 0, 0));
    return d3(s3(L.pos, c), f.n) > 0;
  });
  // door opening on the front face
  const door = clipNear(L, [P(-1.6, 0, -d / 2 - 0.01), P(1.6, 0, -d / 2 - 0.01), P(1.6, 2.5, -d / 2 - 0.01), P(-1.6, 2.5, -d / 2 - 0.01)], 0.5);
  const planks = Array.from({length: 13}, (_, i) => {
    const px = -w / 2 + (i + 1) * (w / 14);
    const a = clipNear(L, [P(px, 0, -d / 2 - 0.005), P(px, h, -d / 2 - 0.005)], 0.5, false);
    return a.length === 2 ? `M${f2(L.p(a[0]).x)},${f2(L.p(a[0]).y)} L${f2(L.p(a[1]).x)},${f2(L.p(a[1]).y)}` : '';
  }).join(' ');
  const frontVis = vis.some((f) => f.n.z === -1 && f.n.y === 0);
  return (
    <g>
      {vis.map((f, i) => {
        const q = clipNear(L, f.pts, 0.5);
        return q.length > 2 ? <path key={i} d={polyD(proj(L, q))} fill={f.color} stroke="#3A2A1C" strokeWidth={1.4} strokeLinejoin="round" /> : null;
      })}
      {frontVis && <path d={planks} stroke={PALF.plankDeep} strokeWidth={1.2} opacity={0.6} />}
      {frontVis && door.length > 2 && <path d={polyD(proj(L, door))} fill="#2B2620" stroke="#3A2A1C" strokeWidth={1.4} />}
    </g>
  );
};

/** grass tufts: world-fixed short strokes on the field (two levels of detail) */
const Grass: React.FC<{L: Lens; wind: number; t: number}> = ({L, wind, t}) => {
  const g = v3(L.pos.x, 0, L.pos.z);
  const segs: Record<string, string[]> = {};
  for (const [cell, r1, r0] of [[0.5, 9, 0], [1.6, 32, 9], [5, 110, 32]] as [number, number, number][]) {
    const i0 = Math.floor((g.x - r1) / cell), i1 = Math.ceil((g.x + r1) / cell);
    const k0 = Math.floor((g.z - r1) / cell), k1 = Math.ceil((g.z + r1) / cell);
    for (let i = i0; i <= i1; i++)
      for (let k = k0; k <= k1; k++) {
        const x = i * cell + hash(i * 131 + k, 81) * cell, z = k * cell + hash(i * 37 + k, 82) * cell;
        const dd = Math.hypot(x - g.x, z - g.z);
        if (dd > r1 || dd < r0) continue;
        if (Math.hypot(x, z) < 3.4) continue; // the dirt pad
        const q = v3(x, 0, z);
        if (d3(s3(q, L.pos), L.f) < 0.6) continue;
        const a = L.p(q);
        if (a.x < -20 || a.x > W + 20 || a.y < -20 || a.y > H + 20) continue;
        const hh = cell * (0.25 + hash(i + k * 7, 83) * 0.25);
        const sway = wind * (0.3 + 0.7 * Math.sin(t * 3 + x * 0.7)) * hh * 0.5;
        const b = L.p(v3(x + sway + hh * 0.15, hh, z));
        const wd = Math.max(0.6, Math.min(3, cell * 0.06 * a.k * 0.4));
        const dark = hash(i * 3 + k, 84) > 0.55;
        const key = `${dark ? 'D' : 'L'}|${wd.toFixed(1)}`;
        (segs[key] ??= []).push(`M${f2(a.x)},${f2(a.y)}L${f2(b.x)},${f2(b.y)}`);
      }
  }
  return (
    <g>
      {Object.entries(segs).map(([k, s]) => (
        <path key={k} d={s.join('')} stroke={k[0] === 'D' ? PALF.grassDeep : lit(PALF.grass, 0.25)} strokeWidth={k.split('|')[1]} strokeLinecap="round" opacity={0.8} />
      ))}
    </g>
  );
};

/** fallen leaves on the pad, blown outward from under the board once the rotors spin up (onset t0) */
const LEAVES = Array.from({length: 46}, (_, i) => {
  const a = hash(i, 91) * Math.PI * 2;
  const d = 0.5 + hash(i, 92) * 3.2;
  return {x: Math.cos(a) * d, z: Math.sin(a) * d, a, d, c: ['#D9A23A', '#C9682F', '#B8C35A', '#E2C15A', '#9E5A2B'][i % 5], s: 0.05 + hash(i, 93) * 0.04, rot: hash(i, 94) * 360};
});
export const Leaves: React.FC<{L: Lens; t: number; t0: number; at: V3}> = ({L, t, t0, at}) => (
  <g>
    {LEAVES.map((lf, i) => {
      const e = Math.max(0, t - t0 - lf.d * 0.08);
      const push = (1 - Math.exp(-e / 0.7)) * (3.5 + (4 - lf.d) * 1.4);
      const lift = Math.sin(Math.min(Math.PI, e * 2.2)) * 0.5 * Math.exp(-e * 0.6) * (1.2 - lf.d / 4);
      const dx = Math.cos(lf.a), dz = Math.sin(lf.a);
      const q = v3(at.x + lf.x + dx * push, Math.max(0.01, lift), at.z + lf.z + dz * push);
      if (d3(s3(q, L.pos), L.f) < 0.3) return null;
      const p = L.p(q);
      const r = lf.s * p.k;
      const spin = lf.rot + e * 400 * (i % 2 ? 1 : -1);
      return <ellipse key={i} cx={f2(p.x)} cy={f2(p.y)} rx={f2(r)} ry={f2(r * 0.45)} transform={`rotate(${f2(spin)} ${f2(p.x)} ${f2(p.y)})`} fill={lf.c} stroke="#5A3A1E" strokeWidth={f2(Math.max(0.4, 0.004 * p.k))} />;
    })}
  </g>
);

export const FieldBack: React.FC<{id: string; L: Lens; t: number; tint?: number; wind?: number}> = ({id, L, t, tint = 0, wind = 0.3}) => {
  const h = horizon(L);
  const gq = clipNear(L, [v3(-3000, 0, -3000), v3(3000, 0, -3000), v3(3000, 0, 3000), v3(-3000, 0, 3000)], 0.3);
  const gp = proj(L, gq);
  const dx = h.b.x - h.a.x, dy = h.b.y - h.a.y;
  const ln = Math.hypot(dx, dy) || 1;
  const nx = -dy / ln, ny = dx / ln;
  const hy = h.a.y + (h.b.y - h.a.y) * ((W / 2 - h.a.x) / (dx || 1));
  const pad = clipNear(L, circ3(v3(0, 0.002, 0), v3(1, 0, 0), v3(0, 0, 1), 3.6, 40), 0.3);
  const night = Math.max(0, tint - 1);
  const trees = TREES.map((tr, i) => ({tr, i, dd: d3(s3(v3(tr.x, 0, tr.z), L.pos), L.f)})).sort((a, b) => b.dd - a.dd);
  const shedD = d3(s3(v3(SHED.x, 0, SHED.z), L.pos), L.f);
  return (
    <g>
      <Sky id={id} L={L} tint={Math.min(1, tint)} />
      <HillRing L={L} R={2600} base={300} amp={330} color={mix(PALF.hill[2], '#F1C9A0', Math.min(1, tint) * 0.3)} seed={5} />
      <HillRing L={L} R={1300} base={120} amp={220} color={PALF.hill[1]} seed={7} />
      <HillRing L={L} R={420} base={25} amp={45} color={PALF.hill[0]} seed={9} />
      {gp.length > 2 && (
        <g>
          <defs>
            <linearGradient id={`${id}-gr`} gradientUnits="userSpaceOnUse" x1={f2(W / 2)} y1={f2(hy)} x2={f2(W / 2 + nx * 1600)} y2={f2(hy + ny * 1600)}>
              <stop offset="0" stopColor={PALF.grassFar} />
              <stop offset="0.3" stopColor={PALF.grass} />
              <stop offset="1" stopColor={shade(PALF.grass, 0.2)} />
            </linearGradient>
          </defs>
          <path d={polyD(gp)} fill={`url(#${id}-gr)`} />
        </g>
      )}
      {pad.length > 2 && <path d={polyD(proj(L, pad))} fill={PALF.dirt} opacity={0.95} />}
      {pad.length > 2 && <path d={polyD(proj(L, clipNear(L, circ3(v3(0.4, 0.003, -0.3), v3(1, 0, 0), v3(0, 0, 1), 2.2, 30), 0.3)))} fill={PALF.dirtDeep} opacity={0.35} />}
      <Grass L={L} wind={wind} t={t} />
      {trees.filter((x) => x.dd > shedD).map(({tr, i}) => <Tree key={i} L={L} {...tr} i={i} wind={wind} />)}
      <Shed L={L} />
      {trees.filter((x) => x.dd <= shedD).map(({tr, i}) => <Tree key={i} L={L} {...tr} i={i} wind={wind} />)}
      {night > 0 && <rect x={0} y={0} width={W} height={H} fill="#1B2A4A" opacity={night * 0.5} />}
    </g>
  );
};
