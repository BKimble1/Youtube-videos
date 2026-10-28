// Heat and fire for the jet prototype test, drawn in the crew's flat style (layered tongues, no photo textures).
// Exhaust: hot jets from each nozzle that hit the floor and spread. Recirculation: shimmering hot air curling back up
// past the deck edge toward the intakes. Flames: tongues anchored to 3D points, flickering with smooth noise.
// Smoke: soft puffs that rise and spread. All pure functions of time.
import React from 'react';
import {hash, noise1} from '../dc/math';
import {f2} from '../eng/draw';
import {d3, Lens, s3, V3, v3} from '../eng/v3';

/** nozzle exhaust: a short hot core and a spreading jet down to the floor, a glowing splash where it hits */
export const Exhaust: React.FC<{id: string; L: Lens; nozzles: V3[]; floorY: number; k: number; t: number}> = ({id, L, nozzles, floorY, k, t}) => {
  if (k <= 0.01) return null;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-sp`}>
          <stop offset="0" stopColor="#FFE7A8" stopOpacity={0.9} />
          <stop offset="0.4" stopColor="#FF9A3C" stopOpacity={0.5} />
          <stop offset="1" stopColor="#FF6A2A" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-jt`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CFE6FF" stopOpacity={0.9} />
          <stop offset="0.3" stopColor="#FFC56A" stopOpacity={0.6} />
          <stop offset="1" stopColor="#FF8A3A" stopOpacity={0.05} />
        </linearGradient>
      </defs>
      {nozzles.map((n, i) => {
        const f = v3(n.x, floorY, n.z);
        if (d3(s3(n, L.pos), L.f) < 0.1 || d3(s3(f, L.pos), L.f) < 0.1) return null;
        const a = L.p(n), b = L.p(f);
        const r = 0.05 * a.k;
        const fl = 1 + 0.12 * noise1(t * 14 + i * 3, 3);
        const sp = 0.35 * b.k * k * fl;
        return (
          <g key={i}>
            <path d={`M${f2(a.x - r)},${f2(a.y)} L${f2(a.x + r)},${f2(a.y)} L${f2(b.x + sp * 0.8)},${f2(b.y)} L${f2(b.x - sp * 0.8)},${f2(b.y)} Z`} fill={`url(#${id}-jt)`} opacity={0.55 * k} />
            <ellipse cx={f2(b.x)} cy={f2(b.y)} rx={f2(sp * 1.6)} ry={f2(sp * 0.45)} fill={`url(#${id}-sp)`} opacity={k} />
          </g>
        );
      })}
    </g>
  );
};

/** hot air curling back up: wavy translucent strands rising from the floor splash around the deck edge */
export const Recirc: React.FC<{L: Lens; from: V3[]; to: V3[]; k: number; t: number; smooth?: boolean}> = ({L, from, to, k, t, smooth = false}) => {
  if (k <= 0.01) return null;
  const strands: React.ReactNode[] = [];
  from.forEach((a, i) => {
    const b = to[i % to.length];
    for (let s = 0; s < 4; s++) {
      const ph = (t * 1.1 + s / 4 + hash(i, 5)) % 1;
      const pts: string[] = [];
      // V5 (smooth): finer sampling, so the visible stretch slides along the strand instead of jumping between samples
      const nU = smooth ? 40 : 10;
      for (let u = 0; u <= nU; u++) {
        const q = u / nU;
        if (q > ph + 0.35 || q < ph - 0.05) continue;
        // out from the splash, up past the deck edge, and in over the top toward the intake
        const out = Math.sin(q * Math.PI) * 0.45;
        const dx = b.x - a.x, dz = b.z - a.z;
        const dl = Math.hypot(dx, dz) || 1;
        const p = v3(a.x + dx * q + (dx / dl) * out * 0 + Math.sign(a.x || 1) * out + Math.sin(t * 6 + u + s) * 0.02, a.y + (b.y - a.y) * q, a.z + dz * q + Math.sign(a.z || 1) * out * 0.6);
        if (d3(s3(p, L.pos), L.f) < 0.1) continue;
        const pp = L.p(p);
        pts.push(`${f2(pp.x)},${f2(pp.y)}`);
      }
      if (pts.length > 1) {
        // (V5 smooth: each strand fades in and out over its run, so none appears or vanishes at full length)
        const life = smooth ? Math.sin(Math.PI * Math.min(1, Math.max(0, ph))) : 1;
        strands.push(<path key={`${i}-${s}g`} d={`M${pts.join(' L')}`} stroke="#FFB765" strokeOpacity={0.22 * k * life} strokeWidth={12} fill="none" strokeLinecap="round" />);
        strands.push(<path key={`${i}-${s}`} d={`M${pts.join(' L')}`} stroke={s ? '#FFE2B0' : '#FFF6E6'} strokeOpacity={0.6 * k * life} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeDasharray={smooth ? undefined : '14 9'} />);
      }
    }
  });
  return <g>{strands}</g>;
};

/** flame tongues at 3D anchor points; size in metres; k = intensity 0..1 */
export const Flames: React.FC<{id: string; L: Lens; at: V3[]; size: number; k: number; t: number; grow?: boolean}> = ({id, L, at, size, k, t, grow = false}) => {
  if (k <= 0.01) return null;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-fo`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FFB13B" />
          <stop offset="0.6" stopColor="#FF6B2B" />
          <stop offset="1" stopColor="#E8361F" />
        </linearGradient>
        <linearGradient id={`${id}-fi`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FFFBE0" />
          <stop offset="1" stopColor="#FFD449" />
        </linearGradient>
      </defs>
      {at.map((a, i) => {
        if (d3(s3(a, L.pos), L.f) < 0.15) return null;
        const p = L.p(a);
        const tongues = [];
        for (let j = 0; j < 5; j++) {
          const h0 = size * k * (0.6 + 0.5 * hash(i * 9 + j, 7)) * (1 + 0.35 * noise1(t * 7 + j * 2.3 + i, 11));
          // (V5 grow: a young flame is narrow as well as short, so a new tongue of fire does not appear at full width)
          const gw = grow ? 0.25 + 0.75 * k : 1;
          const wd = size * 0.32 * (0.7 + 0.5 * hash(i * 5 + j, 8)) * gw;
          const off = (j - 2) * size * 0.16 * gw;
          const sway = noise1(t * 5 + j + i * 1.7, 12) * size * 0.2;
          tongues.push({h: h0 * p.k, w: wd * p.k, off: off * p.k, sway: sway * p.k});
        }
        const shape = (tg: {h: number; w: number; off: number; sway: number}, s: number) => {
          const x = p.x + tg.off, y = p.y;
          const h = tg.h * s, wd = tg.w * s;
          return `M${f2(x - wd)},${f2(y)} C${f2(x - wd)},${f2(y - h * 0.45)} ${f2(x + tg.sway - wd * 0.2)},${f2(y - h * 0.7)} ${f2(x + tg.sway)},${f2(y - h)} C${f2(x + tg.sway + wd * 0.2)},${f2(y - h * 0.7)} ${f2(x + wd)},${f2(y - h * 0.45)} ${f2(x + wd)},${f2(y)} Z`;
        };
        return (
          <g key={i}>
            <ellipse cx={f2(p.x)} cy={f2(p.y)} rx={f2(size * 1.4 * p.k * k)} ry={f2(size * 0.9 * p.k * k)} fill="#FF8A3A" opacity={0.18 * k} style={{mixBlendMode: 'screen'}} />
            {tongues.map((tg, j) => <path key={`o${j}`} d={shape(tg, 1)} fill={`url(#${id}-fo)`} stroke="#B3261A" strokeWidth={f2(Math.max(0.6, 0.004 * p.k))} />)}
            {tongues.map((tg, j) => <path key={`i${j}`} d={shape(tg, 0.55)} fill={`url(#${id}-fi)`} />)}
          </g>
        );
      })}
    </g>
  );
};

/** V5 (final): a bed of flame over several anchors (each with its own size and intensity) drawn as ONE silhouette:
 *  every tongue's outline first as an ink underlay, then all the fills, then the hot cores, so no tongue's base or
 *  edge shows inside the fire (V5 first cut: separate clusters with stroked flat bases stacked into a staircase).
 *  Tongue bases are rounded, each anchor keeps its own shapes (hashed by its index), the glow is a soft radial
 *  gradient, and a dying flame narrows as well as shortening and fades as it goes. */
export const FlameBed: React.FC<{id: string; L: Lens; items: {at: V3; size: number; k: number}[]; t: number}> = ({id, L, items, t}) => {
  const outer: string[] = [], inner: string[] = [];
  const glows: React.ReactNode[] = [];
  let sw = 0.6;
  items.forEach((it, i) => {
    const k = it.k;
    if (k <= 0.01 || d3(s3(it.at, L.pos), L.f) < 0.15) return;
    const p = L.p(it.at);
    const size = it.size;
    sw = Math.max(sw, 0.004 * p.k);
    const gw = 0.15 + 0.85 * k;
    for (let j = 0; j < 5; j++) {
      const h = size * k * (0.6 + 0.5 * hash(i * 9 + j, 7)) * (1 + 0.35 * noise1(t * 7 + j * 2.3 + i * 1.9, 11)) * p.k;
      const wd = size * 0.32 * (0.7 + 0.5 * hash(i * 5 + j, 8)) * gw * p.k;
      const x = p.x + (j - 2) * size * 0.16 * gw * p.k, y = p.y;
      const sway = noise1(t * 5 + j + i * 1.7, 12) * size * 0.2 * p.k;
      const shape = (sc: number) => {
        const hh = h * sc, ww = wd * sc;
        return `M${f2(x - ww)},${f2(y)} C${f2(x - ww)},${f2(y - hh * 0.45)} ${f2(x + sway - ww * 0.2)},${f2(y - hh * 0.7)} ${f2(x + sway)},${f2(y - hh)} C${f2(x + sway + ww * 0.2)},${f2(y - hh * 0.7)} ${f2(x + ww)},${f2(y - hh * 0.45)} ${f2(x + ww)},${f2(y)} C${f2(x + ww)},${f2(y + ww * 0.75)} ${f2(x - ww)},${f2(y + ww * 0.75)} ${f2(x - ww)},${f2(y)} Z`;
      };
      outer.push(shape(1));
      inner.push(shape(0.55));
    }
    glows.push(<ellipse key={i} cx={f2(p.x)} cy={f2(p.y - size * 0.3 * p.k * k)} rx={f2(size * 1.6 * p.k * k)} ry={f2(size * 1.1 * p.k * k)} fill={`url(#${id}-gl)`} opacity={f2(Math.min(1, k * 1.5))} />);
  });
  // the anchors along the trail joined by a ribbon of flame (outer and core), so the fire reads as one band along the
  // line instead of a staircase of separate lobes
  const live = items.filter((it) => it.k > 0.01 && d3(s3(it.at, L.pos), L.f) > 0.15);
  for (let i = 0; i + 1 < live.length; i++) {
    const a = live[i], b = live[i + 1];
    const pa = L.p(a.at), pb = L.p(b.at);
    const wa = a.size * 0.3 * (0.15 + 0.85 * a.k) * pa.k, wb = b.size * 0.3 * (0.15 + 0.85 * b.k) * pb.k;
    const ha = a.size * a.k * 0.55 * pa.k, hb = b.size * b.k * 0.55 * pb.k;
    // (wound the same way as the tongues, so the nonzero fill merges them instead of cutting holes)
    const quad = (sc: number) => {
      let q = [{x: pa.x, y: pa.y + wa * 0.5 * sc}, {x: pa.x, y: pa.y - ha * sc}, {x: pb.x, y: pb.y - hb * sc}, {x: pb.x, y: pb.y + wb * 0.5 * sc}];
      const area = q.reduce((acc, v, k) => acc + v.x * q[(k + 1) % 4].y - q[(k + 1) % 4].x * v.y, 0);
      if (area < 0) q = q.reverse();
      return `M${q.map((v) => `${f2(v.x)},${f2(v.y)}`).join(' L')} Z`;
    };
    outer.push(quad(1));
    inner.push(quad(0.55));
  }
  if (!outer.length) return null;
  const kMax = Math.max(...items.map((it) => it.k));
  return (
    <g opacity={f2(Math.min(1, kMax / 0.25))}>
      <defs>
        <linearGradient id={`${id}-fo`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FFB13B" />
          <stop offset="0.6" stopColor="#FF6B2B" />
          <stop offset="1" stopColor="#E8361F" />
        </linearGradient>
        <linearGradient id={`${id}-fi`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FFFBE0" />
          <stop offset="1" stopColor="#FFD449" />
        </linearGradient>
        <radialGradient id={`${id}-gl`}>
          <stop offset="0" stopColor="#FF9A45" stopOpacity={0.4} />
          <stop offset="0.55" stopColor="#FF8A3A" stopOpacity={0.16} />
          <stop offset="1" stopColor="#FF7A2A" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g style={{mixBlendMode: 'screen'}}>{glows}</g>
      <path d={outer.join(' ')} fill="#B3261A" stroke="#B3261A" strokeWidth={f2(sw * 2)} strokeLinejoin="round" />
      <path d={outer.join(' ')} fill={`url(#${id}-fo)`} />
      <path d={inner.join(' ')} fill={`url(#${id}-fi)`} />
    </g>
  );
};

/** smoke puffs from 3D sources, rising and spreading; born at t0 */
export const Smoke: React.FC<{L: Lens; at: V3[]; t: number; t0: number; k?: number; dark?: number}> = ({L, at, t, t0, k = 1, dark = 0.6}) => {
  if (t < t0) return null;
  const puffs: React.ReactNode[] = [];
  at.forEach((a, i) => {
    for (let j = 0; j < 7; j++) {
      const born = t0 + j * 0.22 + hash(i * 7 + j, 31) * 0.2;
      const age = t - born;
      if (age < 0 || age > 2.6) continue;
      const q = v3(a.x + noise1(age * 0.8 + j, 33) * 0.25 + age * 0.15, a.y + age * 0.7, a.z + noise1(age * 0.7 + j, 34) * 0.25);
      if (d3(s3(q, L.pos), L.f) < 0.2) continue;
      const p = L.p(q);
      const r = (0.12 + age * 0.28) * p.k;
      const g = Math.round(70 + 90 * (1 - dark) + age * 25);
      puffs.push(<circle key={`${i}-${j}`} cx={f2(p.x)} cy={f2(p.y)} r={f2(r)} fill={`rgb(${g},${g - 4},${g - 8})`} opacity={k * 0.42 * Math.min(1, age * 3) * (1 - age / 2.6)} filter="url(#smokeSoft)" />);
    }
  });
  return (
    <g>
      <defs>
        <filter id="smokeSoft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      {puffs}
    </g>
  );
};

/** the ignition flash: a brief warm bloom over the frame, centred on the fire */
export const Flash: React.FC<{id: string; c: {x: number; y: number}; k: number}> = ({id, c, k}) =>
  k <= 0.01 ? null : (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`${id}-fl`} gradientUnits="userSpaceOnUse" cx={f2(c.x)} cy={f2(c.y)} r="1400">
          <stop offset="0" stopColor="#FFF4D6" stopOpacity={0.95 * k} />
          <stop offset="0.25" stopColor="#FFB45A" stopOpacity={0.55 * k} />
          <stop offset="1" stopColor="#FF7A2A" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-50} y={-50} width={1180} height={2020} fill={`url(#${id}-fl)`} />
    </g>
  );
