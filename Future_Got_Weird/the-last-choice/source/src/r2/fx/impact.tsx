// The impact kit. Graded so that big effects are rare:
//   impact()     small/medium contact: metal & armour → sparks + chips; concrete/asphalt → dust + chips; flesh →
//                one restrained cloth-dust puff (no gore)
//   breakerHit() the pneumatic ram striking armour: a piston flash, a hard spark cone, armour chips, an air puff
//   plateHit()   the Director's barrier plate being struck: 'dent' (flash ring + sparks), 'crack' (+ plate chips),
//                'shatter' (the plate bursts into fragments). plateState()/BarrierPlate let the rig draw the plate
//                in the same state.
//   blast()      the heavy's launcher round: flash, fireball, smoke column, thrown concrete, a scorch on the ground,
//                a dust wave; strongest shake
//   muzzle()     launcher / tether muzzle flash
import React from 'react';
import {V3, add3, sub3, mul3, clamp, lerp, rnd, noise, norm3, len3} from '../../kit/math';
import {Item, PointLight, prep, Mesh, project} from '../engine';
import {FxOut, fx, combine, f1, glowEl, gid, glowTone, tone, inkTone, inkPx, shakeAt, basisAround, blobPath} from './core';
import {sparks3, chips3, dust3, ring3, flash3, ChipMat} from './particles';
import {smokeItems, columnSource} from './smoke';
import {CITY} from '../../theme';
import {mix} from '../engine/color';

export type ImpactMat = 'metal' | 'armor' | 'concrete' | 'asphalt' | 'flesh';
export type ImpactOpts = {at: V3; normal: V3; t: number; t0: number; key: string; strength?: number; material?: ImpactMat; ground?: number; seed?: number;
  /** R4 (opt-in): terrain height at (x, z) so the chips land on the terrain (see ChipsOpts.groundFn), not on the flat `ground` */
  groundFn?: (x: number, z: number) => number};

export const impact = (o: ImpactOpts): FxOut => {
  const s = o.strength ?? 1, m = o.material ?? 'metal', seed = o.seed ?? 1;
  const n = norm3(o.normal);
  if (o.t < o.t0) return fx();
  if (m === 'flesh') {
    return fx(dust3({at: o.at, t: o.t, t0: o.t0, key: o.key, n: 3, size: 0.08, grow: 0.25, speed: 0.4, life: 0.9, dir: n, spread: 60, color: '#B8AEA4', opacity: 0.5 * Math.min(1, s), seed}), [], shakeAt(o.t, o.t0, 0.015 * s));
  }
  if (m === 'metal' || m === 'armor') {
    return combine(
      fx(sparks3({at: o.at, t: o.t, t0: o.t0, key: `${o.key}_sp`, n: Math.round(8 + 18 * s), dir: n, spread: 70, speed: [2.5, 9 * Math.sqrt(s)], ground: o.ground, seed, flash: 0.22 * s})),
      fx(chips3({at: o.at, t: o.t, t0: o.t0, key: `${o.key}_ch`, n: Math.round(2 + 4 * s), dir: n, spread: 55, speed: [1.5, 5], size: [0.03, 0.09 * s], material: m === 'armor' ? 'armor' : 'metal', ground: o.ground, groundFn: o.groundFn, seed: seed + 3})),
      s > 0.7 ? fx(ring3({at: o.at, normal: n, t: o.t, t0: o.t0, key: `${o.key}_rg`, r0: 0.1, speed: 6 * s, dur: 0.18, width: 0.05})) : null,
      fx([], [], shakeAt(o.t, o.t0, 0.03 * s)),
    );
  }
  // concrete / asphalt
  return combine(
    fx(dust3({at: o.at, t: o.t, t0: o.t0, key: `${o.key}_du`, n: Math.round(3 + 3 * s), size: 0.18 * s, grow: 0.7 * s, speed: 1.2 * s, life: 1.8, dir: n, spread: 70, color: m === 'asphalt' ? '#7E7671' : '#A89E94', seed})),
    fx(chips3({at: o.at, t: o.t, t0: o.t0, key: `${o.key}_ch`, n: Math.round(5 + 8 * s), dir: n, spread: 60, speed: [2, 6 * Math.sqrt(s)], size: [0.04, 0.14 * s], material: m === 'asphalt' ? 'asphalt' : 'concrete', ground: o.ground, groundFn: o.groundFn, seed: seed + 5})),
    fx([], [], shakeAt(o.t, o.t0, 0.04 * s)),
  );
};

/** The breaker's piston strike on armour; `dir` = the tool's striking direction. */
export const breakerHit = (o: {at: V3; dir: V3; t: number; t0: number; key: string; ground?: number; seed?: number; strength?: number; groundFn?: (x: number, z: number) => number}): FxOut => {
  if (o.t < o.t0) return fx();
  const s = o.strength ?? 1, back = mul3(norm3(o.dir), -1), seed = o.seed ?? 1;
  const tau = o.t - o.t0;
  const star: Item[] = tau < 0.09 ? [{
    kind: 'sprite', pos: o.at, key: `${o.key}_star`, bias: 0.3,
    draw: (c) => {
      const R = Math.max(12, 0.55 * c.k) * (1 - tau / 0.09) * s;
      const pts = Array.from({length: 16}, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const r = i % 2 ? R * 0.32 : R * (0.8 + 0.4 * rnd(seed * 7 + i));
        return `${f1(c.x + Math.cos(a) * r)},${f1(c.y + Math.sin(a) * r)}`;
      }).join(' ');
      return <g>{glowEl(gid(o.key, 'bh'), c.x, c.y, R * 1.6, glowTone(c, '#FFF3D6', 0.2), 0.9, 0.2)}<polygon points={pts} fill={glowTone(c, '#FFFDF4', 0.2)} /></g>;
    },
  }] : [];
  return combine(
    fx(star, tau < 0.1 ? [{pos: add3(o.at, mul3(back, 0.4)), color: '#FFE6B0', power: 1.4 * s, radius: 6}] : [], shakeAt(o.t, o.t0, 0.07 * s)),
    fx(sparks3({at: o.at, t: o.t, t0: o.t0, key: `${o.key}_sp`, n: 30, dir: back, spread: 80, speed: [3, 11], ground: o.ground, seed, flash: 0})),
    fx(chips3({at: o.at, t: o.t, t0: o.t0, key: `${o.key}_ch`, n: 7, dir: back, spread: 70, speed: [2, 6], size: [0.04, 0.12], material: 'armor', ground: o.ground, groundFn: o.groundFn, seed: seed + 2})),
    fx(ring3({at: o.at, normal: back, t: o.t, t0: o.t0, key: `${o.key}_rg`, r0: 0.08, speed: 7, dur: 0.16, width: 0.05})),
    // compressed-air puff from the tool's exhaust (behind the strike)
    fx(dust3({at: add3(o.at, mul3(back, 0.75)), t: o.t, t0: o.t0 + 0.02, key: `${o.key}_air`, n: 2, size: 0.1, grow: 0.35, speed: 0.6, life: 0.7, dir: {x: 0, y: 1, z: 0}, color: '#E8E6E0', opacity: 0.55, seed: seed + 9})),
  );
};

// ------------------------------------------------------------------ the barrier plate
export type PlateEvents = {dentAt?: number; dent2At?: number; crackAt?: number; shatterAt?: number};
/** Damage state of the Director's plate at t (0..1 each); shattered = fraction of the plate gone. */
export const plateState = (t: number, e: PlateEvents) => ({
  dent: clamp((e.dentAt !== undefined && t >= e.dentAt ? 0.6 : 0) + (e.dent2At !== undefined && t >= e.dent2At ? 0.4 : 0)),
  crack: e.crackAt !== undefined && t >= e.crackAt ? clamp(0.55 + (t - e.crackAt) * 0.02) : 0,
  shattered: e.shatterAt !== undefined && t >= e.shatterAt ? 1 : 0,
  /** a short white flash on the plate surface after any hit */
  flash: Math.max(...[e.dentAt, e.dent2At, e.crackAt, e.shatterAt].map((x) => (x !== undefined && t >= x ? clamp(1 - (t - x) / 0.12) : 0))),
});

/**
 * The plate as drawn by the rig, in plate-local px: a slightly curved, scuffed composite panel (w × h, centre origin,
 * long axis along x = the forearm). dent: dented hollows with highlight rims; crack: a crack network; shattered: only
 * jagged remnants stay strapped on. `strap` draws the two straps. Colours are pre-lit by the caller (pass toned fills).
 */
export const BarrierPlate: React.FC<{w: number; h: number; dent?: number; crack?: number; shattered?: number; flash?: number; ink?: number; fill?: string; shade?: string; light?: string; inkC?: string; seed?: number; strap?: string}> = ({w, h, dent = 0, crack = 0, shattered = 0, flash = 0, ink = 2, fill = '#8E9AA0', shade = '#6F7B82', light = '#C3CBCF', inkC = '#162A32', seed = 7, strap = '#3B2F2A'}) => {
  const outline = `M ${f1(-w / 2)} ${f1(-h * 0.38)} Q ${f1(-w * 0.1)} ${f1(-h * 0.62)} ${f1(w / 2)} ${f1(-h * 0.42)} L ${f1(w * 0.47)} ${f1(h * 0.4)} Q ${f1(-w * 0.05)} ${f1(h * 0.6)} ${f1(-w * 0.48)} ${f1(h * 0.42)} Z`;
  // strap ends: the straps run behind the plate round the forearm; only their ends show past the edges
  const straps = (
    <g>
      <rect x={f1(-w * 0.2)} y={f1(-h * 0.66)} width={f1(w * 0.09)} height={f1(h * 1.32)} rx={f1(w * 0.015)} fill={strap} stroke={inkC} strokeWidth={ink * 0.7} />
      <rect x={f1(w * 0.08)} y={f1(-h * 0.66)} width={f1(w * 0.09)} height={f1(h * 1.32)} rx={f1(w * 0.015)} fill={strap} stroke={inkC} strokeWidth={ink * 0.7} />
    </g>
  );
  if (shattered >= 1) {
    // a jagged remnant still strapped on (about half the plate), its broken edges raw
    const rem = `M ${f1(-w * 0.34)} ${f1(-h * 0.36)} L ${f1(-w * 0.12)} ${f1(-h * 0.5)} L ${f1(w * 0.02)} ${f1(-h * 0.3)} L ${f1(w * 0.12)} ${f1(-h * 0.48)} L ${f1(w * 0.3)} ${f1(-h * 0.28)} L ${f1(w * 0.22)} ${f1(-h * 0.02)} L ${f1(w * 0.34)} ${f1(h * 0.2)} L ${f1(w * 0.12)} ${f1(h * 0.44)} L ${f1(-w * 0.04)} ${f1(h * 0.26)} L ${f1(-w * 0.18)} ${f1(h * 0.48)} L ${f1(-w * 0.36)} ${f1(h * 0.3)} L ${f1(-w * 0.26)} ${f1(h * 0.02)} Z`;
    return (
      <g>
        {straps}
        <path d={rem} fill={fill} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />
        <path d={`M ${f1(-w * 0.3)} ${f1(h * 0.18)} L ${f1(w * 0.26)} ${f1(h * 0.16)}`} stroke={shade} strokeWidth={ink * 1.6} strokeLinecap="round" />
        <path d={`M ${f1(-w * 0.2)} ${f1(-h * 0.2)} L ${f1(w * 0.02)} ${f1(-h * 0.02)} L ${f1(w * 0.18)} ${f1(-h * 0.14)}`} fill="none" stroke={inkC} strokeWidth={ink * 0.7} strokeLinejoin="round" />
      </g>
    );
  }
  const dents = dent > 0 ? [{x: w * 0.18, y: -h * 0.08, r: h * 0.16 * Math.min(1, dent / 0.6)}, ...(dent > 0.6 ? [{x: -w * 0.22, y: h * 0.12, r: h * 0.13}] : [])] : [];
  const cracks = crack > 0 ? [
    `M ${f1(w * 0.18)} ${f1(-h * 0.08)} L ${f1(w * 0.3)} ${f1(-h * 0.36)} L ${f1(w * 0.36)} ${f1(-h * 0.46)}`,
    `M ${f1(w * 0.18)} ${f1(-h * 0.08)} L ${f1(w * 0.02)} ${f1(h * 0.12)} L ${f1(-w * 0.2)} ${f1(h * 0.18)} L ${f1(-w * 0.36)} ${f1(h * 0.4)}`,
    `M ${f1(w * 0.02)} ${f1(h * 0.12)} L ${f1(w * 0.08)} ${f1(h * 0.44)}`,
    `M ${f1(w * 0.18)} ${f1(-h * 0.08)} L ${f1(w * 0.42)} ${f1(h * 0.1)}`,
  ].slice(0, 2 + Math.round(crack * 2)) : [];
  return (
    <g>
      {straps}
      <path d={outline} fill={fill} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />
      <path d={`M ${f1(-w * 0.44)} ${f1(h * 0.2)} Q ${f1(-w * 0.05)} ${f1(h * 0.42)} ${f1(w * 0.45)} ${f1(h * 0.2)} L ${f1(w * 0.47)} ${f1(h * 0.4)} Q ${f1(-w * 0.05)} ${f1(h * 0.6)} ${f1(-w * 0.48)} ${f1(h * 0.42)} Z`} fill={shade} />
      <path d={`M ${f1(-w * 0.4)} ${f1(-h * 0.3)} Q ${f1(-w * 0.1)} ${f1(-h * 0.48)} ${f1(w * 0.38)} ${f1(-h * 0.34)}`} fill="none" stroke={light} strokeWidth={ink * 0.9} strokeLinecap="round" />
      {/* scuffs from earlier use */}
      {[0, 1, 2].map((i) => <line key={i} x1={f1(-w * 0.3 + i * w * 0.2)} y1={f1(-h * 0.05 + i * h * 0.05)} x2={f1(-w * 0.18 + i * w * 0.2)} y2={f1(-h * 0.12 + i * h * 0.05)} stroke={shade} strokeWidth={ink * 0.6} strokeLinecap="round" />)}
      {dents.map((d, i) => (
        <g key={i}>
          <ellipse cx={f1(d.x)} cy={f1(d.y)} rx={f1(d.r * 1.3)} ry={f1(d.r)} fill={shade} />
          <path d={`M ${f1(d.x - d.r * 1.2)} ${f1(d.y + d.r * 0.3)} Q ${f1(d.x)} ${f1(d.y + d.r * 1.2)} ${f1(d.x + d.r * 1.2)} ${f1(d.y + d.r * 0.3)}`} fill="none" stroke={light} strokeWidth={ink * 0.7} strokeLinecap="round" />
        </g>
      ))}
      {cracks.map((d, i) => <path key={i} d={d} fill="none" stroke={inkC} strokeWidth={ink * 0.75} strokeLinejoin="round" strokeLinecap="round" />)}
      {flash > 0 && <path d={outline} fill="#FFFFFF" opacity={0.75 * flash} />}
    </g>
  );
};

/** World-space effects of a hit on the plate (the plate itself is drawn by the rig with plateState/BarrierPlate). */
export const plateHit = (o: {at: V3; normal: V3; t: number; t0: number; key: string; stage: 'dent' | 'crack' | 'shatter'; ground?: number; seed?: number; groundFn?: (x: number, z: number) => number}): FxOut => {
  if (o.t < o.t0) return fx();
  const n = norm3(o.normal), seed = o.seed ?? 1;
  const big = o.stage === 'shatter' ? 1.6 : o.stage === 'crack' ? 1.15 : 0.85;
  return combine(
    fx(sparks3({at: o.at, t: o.t, t0: o.t0, key: `${o.key}_sp`, n: Math.round(16 * big), dir: n, spread: 75, speed: [2.5, 8 * big], ground: o.ground, seed, flash: 0.3 * big})),
    fx(ring3({at: o.at, normal: n, t: o.t, t0: o.t0, key: `${o.key}_rg`, r0: 0.12, speed: 7 * big, dur: 0.18, width: 0.06})),
    o.stage !== 'dent' ? fx(chips3({at: o.at, t: o.t, t0: o.t0, key: `${o.key}_ch`, n: o.stage === 'shatter' ? 11 : 4, dir: n, spread: o.stage === 'shatter' ? 85 : 50, speed: o.stage === 'shatter' ? [3, 8] : [1.5, 4], size: o.stage === 'shatter' ? [0.06, 0.16] : [0.025, 0.06], material: 'plate', ground: o.ground, groundFn: o.groundFn, seed: seed + 4, spin: 1300})) : null,
    fx([], [], shakeAt(o.t, o.t0, 0.035 * big)),
  );
};

// ------------------------------------------------------------------ blast
const scorchCache = new Map<string, ReturnType<typeof prep>>();
/** Scorch: a flat irregular mark split into 0.5 m cells, sorted by each cell's farthest point (drawn right after the ground it lies on, before anything standing on it). */
const scorchMesh = (at: V3, R: number, seed: number, groundH?: (x: number, z: number) => number) => {
  const key = `${f1(at.x)}_${f1(at.z)}_${f1(R)}_${seed}`;
  const hit = scorchCache.get(key);
  if (hit) return hit;
  const verts: V3[] = [];
  const faces: {v: number[]; mat: string}[] = [];
  const cell = 0.5, n = Math.ceil((R * 1.3) / cell);
  const inside = (x: number, z: number) => {
    const a = Math.atan2(z, x);
    const rr = R * (0.75 + 0.25 * noise(a * 2.2 + 10, seed) + 0.15 * noise(a * 5.1, seed + 3));
    return Math.hypot(x, z) / rr;
  };
  for (let j = -n; j < n; j++) for (let i = -n; i < n; i++) {
    const cx = (i + 0.5) * cell, cz = (j + 0.5) * cell;
    const q = inside(cx, cz);
    if (q > 1.15) continue;
    const y = (x: number, z: number) => (groundH ? groundH(at.x + x, at.z + z) : at.y) + 0.025;
    const o = verts.length;
    [[i, j], [i, j + 1], [i + 1, j + 1], [i + 1, j]].forEach(([a, b]) => verts.push({x: at.x + a * cell, y: y(a * cell, b * cell), z: at.z + b * cell}));
    faces.push({v: [o, o + 1, o + 2, o + 3], mat: q > 0.85 ? 'fx_scorch_rim' : 'fx_scorch'});
  }
  const m: Mesh = {verts, faces, twoSided: true, inkBoundary: false, sortKey: 'max', bias: 0.03};
  const p = prep(m);
  scorchCache.set(key, p);
  return p;
};

export type BlastOpts = {at: V3; t: number; t0: number; key: string; size?: number; ground?: number; groundH?: (x: number, z: number) => number; seed?: number; debris?: ChipMat; dir?: V3;
  /** R4 (opt-in): the debris lands on `groundH`'s terrain where it comes down, not on the flat plane `ground` (which left chunks hovering on a slope) */
  terrainChips?: boolean};
/** The launcher round's blast: fireball radius ≈ size (m, default 2.2). Fragments are concrete/metal, not people. */
export const blast = (o: BlastOpts): FxOut => {
  const a = o.t - o.t0;
  if (a < 0) return fx();
  const size = o.size ?? 2.2, seed = o.seed ?? 1, g = o.ground ?? o.at.y;
  const items: Item[] = [];
  // fireball: blobs expanding, rising, cooling to smoke
  const nB = 9;
  for (let i = 0; i < nB; i++) {
    const sd = seed * 31 + i;
    const ang = rnd(sd * 3) * Math.PI * 2, el = rnd(sd * 5) * 0.9;
    const grow = 1 - Math.exp(-7 * a);
    const off = size * 0.55 * Math.sqrt(rnd(sd * 7)) * grow;
    const p = add3(o.at, {x: Math.cos(ang) * Math.cos(el) * off, y: Math.sin(el) * off + a * size * 0.45 * (0.5 + rnd(sd * 9)), z: Math.sin(ang) * Math.cos(el) * off});
    const r = size * (0.32 + 0.22 * rnd(sd * 11)) * (0.35 + 0.65 * grow);
    const cool = clamp((a - 0.04 - 0.08 * rnd(sd * 13)) / 0.95);
    const op = clamp(1.25 - Math.max(0, a - 0.75) / 0.55);
    if (op <= 0) continue;
    items.push({
      kind: 'sprite', pos: p, key: `${o.key}_fb${i}`, bias: 0.05,
      draw: (c) => {
        const R = r * c.k;
        if (R < 1) return null;
        const rim = cool < 0.35 ? mix(CITY.fire, CITY.ember, cool / 0.35) : mix(CITY.ember, '#3A2F33', (cool - 0.35) / 0.45);
        const body = cool < 0.3 ? mix(CITY.fireCore, CITY.fireHot, cool / 0.3) : mix(CITY.fireHot, CITY.ember, (cool - 0.3) / 0.4);
        const bk = clamp(1 - (cool - 0.5) / 0.3), ck = clamp(1 - cool / 0.28);
        const rot = rnd(sd) * 6;
        return (
          <g opacity={f1(op)}>
            <path d={blobPath(c.x, c.y, R, sd, 8, 0.3, 1, 0.95, rot)} fill={cool > 0.6 ? tone(c, rim, 1) : glowTone(c, rim, 0.4)} />
            {bk > 0 && <path d={blobPath(c.x - R * 0.06, c.y - R * 0.14, R * 0.7 * (0.6 + 0.4 * bk), sd + 1, 7, 0.3, 1, 0.95, rot)} fill={glowTone(c, body, 0.3)} opacity={f1(bk)} />}
            {ck > 0 && <path d={blobPath(c.x - R * 0.1, c.y - R * 0.22, R * 0.38 * ck, sd + 2, 6, 0.25, 1, 1, rot)} fill={glowTone(c, CITY.fireCore, 0.2)} />}
          </g>
        );
      },
    });
  }
  // the flash and the light it throws
  if (a < 0.22) items.push({kind: 'sprite', pos: o.at, key: `${o.key}_flash`, bias: 0.6, draw: (c) => glowEl(gid(o.key, 'fl'), c.x, c.y, size * c.k * (2 + a * 12), glowTone(c, '#FFF4D0', 0.2), 1 - a / 0.22, 0.22)});
  const lights: PointLight[] = [];
  if (a < 1.8) lights.push({pos: add3(o.at, {x: 0, y: size * 0.6, z: 0}), color: '#FF9440', power: 2.2 * Math.exp(-2.2 * a) + (a < 0.1 ? 1.5 : 0), radius: size * 5.5, flicker: 0.25, seed});
  // scorch on the ground
  if (o.ground !== undefined || o.groundH) items.push({kind: 'mesh', mesh: scorchMesh({x: o.at.x, y: g, z: o.at.z}, size * 1.2, seed, o.groundH), key: `${o.key}_scorch`, opacity: clamp(a / 0.15)});
  const smoke = columnSource({x: o.at.x, y: g + size * 0.3, z: o.at.z}, o.t0 + 0.15, o.t0 + 2.4, seed + 7, size * 0.55, '#2E272B');
  return combine(
    fx(items, lights, shakeAt(o.t, o.t0, 0.22 * (size / 2.2), 3.5)),
    fx(smokeItems(o.t, [smoke], `${o.key}_sm`)),
    // (R4) the debris lands where the blast's `ground` is given, else on the terrain: R3 used the blast's own height as the landing plane when no `ground` was passed, so A1's blow-out (64 m up the tower) and truck blast (3.3 m up) left their shards hanging in the air
    fx(chips3({at: o.at, t: o.t, t0: o.t0, key: `${o.key}_deb`, n: 18, dir: o.dir ?? {x: 0, y: 1, z: 0}, spread: 80, speed: [5, 14], size: [0.08, 0.3], material: o.debris ?? 'concrete', ground: o.ground, life: 6, seed: seed + 3, groundFn: o.terrainChips ? o.groundH : undefined})),
    fx(sparks3({at: o.at, t: o.t, t0: o.t0, key: `${o.key}_sp`, n: 28, spread: 110, speed: [5, 16], ground: o.ground, seed: seed + 5, flash: 0})),
    fx(dust3({at: {x: o.at.x, y: g, z: o.at.z}, t: o.t, t0: o.t0 + 0.04, key: `${o.key}_wave`, ring: size * 0.6, n: 12, speed: size * 3.2, size: size * 0.35, grow: size * 0.45, life: 3, rise: 0.5, color: '#8E8378', opacity: 0.8, seed: seed + 9})),
    fx(ring3({at: add3(o.at, {x: 0, y: 0.1, z: 0}), normal: {x: 0, y: 1, z: 0}, t: o.t, t0: o.t0, key: `${o.key}_shock`, r0: size * 0.5, speed: size * 18, dur: 0.25, width: size * 0.06})),
  );
};

/** A muzzle flash along `dir` (launcher, tether gun). */
export const muzzle = (o: {at: V3; dir: V3; t: number; t0: number; key: string; size?: number; color?: string}): FxOut => {
  const a = o.t - o.t0;
  if (a < 0 || a > 0.1) return fx();
  const size = o.size ?? 0.45;
  const k = 1 - a / 0.1;
  return fx([{
    kind: 'sprite', pos: o.at, key: `${o.key}_mz`, bias: 0.3,
    draw: (c) => {
      const tip = project(c.view, add3(o.at, mul3(norm3(o.dir), size * 1.6)));
      if (tip.z < c.view.near) return null;
      const ang = Math.atan2(tip.y - c.y, tip.x - c.x);
      const L = Math.hypot(tip.x - c.x, tip.y - c.y) * k, W = size * 0.45 * c.k * k;
      const px = Math.cos(ang + Math.PI / 2), py = Math.sin(ang + Math.PI / 2);
      const pts = [
        [c.x + px * W * 0.4, c.y + py * W * 0.4], [c.x + Math.cos(ang) * L * 0.5 + px * W, c.y + Math.sin(ang) * L * 0.5 + py * W],
        [c.x + Math.cos(ang) * L, c.y + Math.sin(ang) * L], [c.x + Math.cos(ang) * L * 0.5 - px * W, c.y + Math.sin(ang) * L * 0.5 - py * W], [c.x - px * W * 0.4, c.y - py * W * 0.4],
      ].map(([x, y]) => `${f1(x)},${f1(y)}`).join(' ');
      return <g>{glowEl(gid(o.key, 'mz'), c.x, c.y, size * 1.4 * c.k, glowTone(c, o.color ?? '#FFE9B0', 0.2), k, 0.2)}<polygon points={pts} fill={glowTone(c, '#FFFBEA', 0.2)} opacity={f1(k)} /></g>;
    },
  }], a < 0.08 ? [{pos: o.at, color: o.color ?? '#FFE0A0', power: 1.2 * k, radius: 5}] : [], shakeAt(o.t, o.t0, 0.015));
};

