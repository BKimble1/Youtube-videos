// V2 hardware: Starship (upper stage) and Super Heavy, built as true cylinders seen from any azimuth.
// Local frame: metres, origin at the centre of the engine plane, +y DOWN (SVG), vehicle extends to negative y.
// `az` = the azimuth the camera looks from, measured around the vehicle axis from the centre of the ship's heat shield
// (az 0: looking straight at the black tiles; az 90: side profile, tiles on the left; az 180: steel leeward side).
// Every surface feature (tile boundary, flaps, fittings, grid fins, engines) is placed at its own azimuth and projected,
// so a camera change shows the same hardware from a new angle instead of a stretched sprite.
//
// Reference envelope (SpaceX published figures, V3): ship ≈ 52 m, booster ≈ 72 m, both 9 m diameter. Ship: two forward
// flaps on the nose (shifted leeward), two aft flaps, heat-shield tiles on the windward side, 3 sea-level + 3 vacuum
// Raptors. Super Heavy V3: 33 Raptors, three larger grid fins, integrated hot-stage ring. Flight 5 era booster: four grid
// fins and separate catch pins. The ship's support fittings are drawn as small generic hard points (not published).
import React from 'react';
import {noise} from '../kit/anim';

export const R = 4.5;
export const SHIP_LEN = 52;
export const BOOSTER_LEN = 72;
export const INK = '#1c232b';
const D = Math.PI / 180;
const NS = {vectorEffect: 'non-scaling-stroke' as const};

export type Pal = 'day' | 'dusk' | 'night' | 'space' | 'studio';
type PalDef = {hi: string; mid: string; lo: string; rim: string; tile: string; tileHi: string; out: string};
export const PAL: Record<Pal, PalDef> = {
  day: {hi: '#f3f6f8', mid: '#c2cad2', lo: '#7e8994', rim: '#a9b4bf', tile: '#1f2328', tileHi: '#3b424b', out: INK},
  dusk: {hi: '#f6dcc6', mid: '#b9a8a6', lo: '#5d6270', rim: '#e8a27c', tile: '#1b1d22', tileHi: '#3f3a3d', out: INK},
  night: {hi: '#9fb0c4', mid: '#5e6b7c', lo: '#2b3340', rim: '#6f86a6', tile: '#121519', tileHi: '#2a3038', out: '#0b0e12'},
  space: {hi: '#ffffff', mid: '#b8c2cc', lo: '#4a5562', rim: '#7fb0ff', tile: '#16191d', tileHi: '#353b44', out: INK},
  studio: {hi: '#f4f6f8', mid: '#c9d0d7', lo: '#86919c', rim: '#b8c3cd', tile: '#22262b', tileHi: '#3d444d', out: INK},
};

const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

/** Body shading overlay across the projected cylinder: light from the upper left of the frame. */
const ShadeDefs: React.FC<{id: string; p: PalDef}> = ({id, p}) => (
  <defs>
    <linearGradient id={`${id}_steel`} gradientUnits="userSpaceOnUse" x1={-R} x2={R} y1={0} y2={0}>
      <stop offset="0" stopColor={p.lo} />
      <stop offset="0.1" stopColor={p.mid} />
      <stop offset="0.3" stopColor={p.hi} />
      <stop offset="0.5" stopColor={p.mid} />
      <stop offset="0.8" stopColor={p.lo} />
      <stop offset="0.94" stopColor={p.lo} />
      <stop offset="1" stopColor={p.rim} />
    </linearGradient>
    <linearGradient id={`${id}_tile`} gradientUnits="userSpaceOnUse" x1={-R} x2={R} y1={0} y2={0}>
      <stop offset="0" stopColor={p.tile} />
      <stop offset="0.28" stopColor={p.tileHi} />
      <stop offset="0.55" stopColor={p.tile} />
      <stop offset="1" stopColor={p.tile} />
    </linearGradient>
    <linearGradient id={`${id}_bell`} x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stopColor="#2a2522" />
      <stop offset="0.35" stopColor="#8a7b6e" />
      <stop offset="0.6" stopColor="#4d443d" />
      <stop offset="1" stopColor="#201c1a" />
    </linearGradient>
    <pattern id={`${id}_hex`} width={0.62} height={0.54} patternUnits="userSpaceOnUse">
      <path d="M0 0.27 L0.155 0 L0.465 0 L0.62 0.27 L0.465 0.54 L0.155 0.54 Z" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={0.04} />
    </pattern>
    <radialGradient id={`${id}_heat`} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#fff1d6" stopOpacity="0.95" />
      <stop offset="0.35" stopColor="#ff9a52" stopOpacity="0.75" />
      <stop offset="0.7" stopColor="#e2486e" stopOpacity="0.35" />
      <stop offset="1" stopColor="#8a2fa8" stopOpacity="0" />
    </radialGradient>
  </defs>
);

/** Polygon of a band of the surface between azimuths [a0, a1] (relative to windward), following radius profile r(y). */
const band = (prof: [number, number][], a0: number, a1: number, az: number) => {
  // clip to the visible half (|θ-az| < 90)
  const lo = Math.max(a0, az - 90), hi = Math.min(a1, az + 90);
  if (hi <= lo) return null;
  const left = prof.map(([y, r]) => [r * Math.sin((lo - az) * D), y]);
  const right = prof.map(([y, r]) => [r * Math.sin((hi - az) * D), y]).reverse();
  return [...left, ...right].map((p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`).join(' ');
};

/** Visible tile region(s) for a tile arc centred on 0 with half-width hw (handles wrap-around). */
const tileBands = (prof: [number, number][], hw: number, az: number) => {
  const a = wrap(az);
  const out: string[] = [];
  for (const off of [-360, 0, 360]) {
    const b = band(prof, -hw + off, hw + off, a);
    if (b) out.push(b);
  }
  return out;
};

// ---------------- plume ----------------
export const Plume: React.FC<{x?: number; w: number; len: number; k: number; t: number; seed?: number}> = ({x = 0, w, len, k, t, seed = 0}) => {
  if (k <= 0.01) return null;
  const f = 1 + 0.06 * noise(t * 9, seed) + 0.03 * noise(t * 23, seed + 4);
  const L = len * k * f;
  const W = w * (0.7 + 0.3 * k);
  const outer = `M${x - W * 0.5} 0 C ${x - W * 0.95} ${L * 0.25}, ${x - W * 1.1} ${L * 0.6}, ${x} ${L} C ${x + W * 1.1} ${L * 0.6}, ${x + W * 0.95} ${L * 0.25}, ${x + W * 0.5} 0 Z`;
  const core = `M${x - W * 0.34} 0 C ${x - W * 0.48} ${L * 0.18}, ${x - W * 0.4} ${L * 0.42}, ${x} ${L * 0.6} C ${x + W * 0.4} ${L * 0.42}, ${x + W * 0.48} ${L * 0.18}, ${x + W * 0.34} 0 Z`;
  return (
    <g>
      <ellipse cx={x} cy={L * 0.3} rx={W * 2.4} ry={L * 0.55} fill="url(#glowWarm)" opacity={0.5 * k} />
      <path d={outer} fill="url(#plumeOuter)" opacity={0.95} />
      <path d={core} fill="url(#plumeCore)" />
      {[0.14, 0.27, 0.39].map((u, i) => (
        <ellipse key={i} cx={x} cy={L * u} rx={W * (0.2 - i * 0.035)} ry={W * 0.1} fill="#fff" opacity={0.5 * k} />
      ))}
    </g>
  );
};

// ---------------- Starship ----------------
const SHIP_PROF: [number, number][] = (() => {
  const p: [number, number][] = [[0.6, R * 0.97], [0, R]];
  for (let y = -1; y >= -33; y -= 4) p.push([y, R]);
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    p.push([-33 - u * 19, R * Math.pow(Math.cos((u * Math.PI) / 2), 0.62)]);
  }
  return p;
})();
const shipR = (y: number) => {
  if (y > -33) return R;
  const u = Math.min(1, (-33 - y) / 19);
  return R * Math.pow(Math.cos((u * Math.PI) / 2), 0.62);
};

type Flap = {th: number; y0: number; y1: number; ty0: number; ty1: number; span: number; side: 1 | -1};
const FLAPS: {fwd: Flap[]; aft: Flap[]} = {
  fwd: [1, -1].map((s) => ({th: 112 * s, y0: -34.5, y1: -45.5, ty0: -36.6, ty1: -42.2, span: 2.5, side: s as 1 | -1})),
  aft: [1, -1].map((s) => ({th: 97 * s, y0: -0.6, y1: -14.2, ty0: -1.8, ty1: -10.6, span: 4.3, side: s as 1 | -1})),
};

/** Project a flap plate. defl: 0 = sticking straight out, + = folded toward the leeward (steel) side. */
const flapGeom = (f: Flap, defl: number, az: number, radiusAt: (y: number) => number) => {
  const th = f.th * D, td = (f.th + f.side * defl) * D, a = az * D;
  const ex = [-Math.sin(a), Math.cos(a)], cv = [Math.cos(a), Math.sin(a)];
  const pt = (y: number, out: number) => {
    const r = radiusAt(y);
    const P = [r * Math.cos(th) + out * Math.cos(td), r * Math.sin(th) + out * Math.sin(td)];
    return {x: P[0] * ex[0] + P[1] * ex[1], d: P[0] * cv[0] + P[1] * cv[1], y};
  };
  const q = [pt(f.y0, 0), pt(f.y1, 0), pt(f.ty1, f.span), pt(f.ty0, f.span)];
  const n = [-Math.sin(td), Math.cos(td)]; // plate normal
  const facing = n[0] * cv[0] + n[1] * cv[1];
  const windwardFace = n[0] * 1 > 0 ? 1 : -1; // which side of the plate faces the heat-shield direction
  const tileVisible = facing * windwardFace > 0;
  const depth = (q[0].d + q[2].d) / 2;
  return {q, depth, tileVisible, edge: Math.abs(facing)};
};

export type ShipProps = {
  az?: number; flapFwd?: number; flapAft?: number; engines?: number; t?: number; pal?: Pal; heat?: number; detail?: boolean;
  fittings?: number; id?: string; plumeLen?: number; ghost?: boolean;
};

export const Ship: React.FC<ShipProps> = ({az = 90, flapFwd = 0, flapAft = 0, engines = 0, t = 0, pal = 'day', heat = 0, detail = false, fittings = 0, id = 'ship', plumeLen = 26, ghost = false}) => {
  const p = PAL[pal];
  const gid = `${id}_${pal}`;
  const a = wrap(az);
  const flaps = [...FLAPS.fwd.map((f) => ({f, g: flapGeom(f, flapFwd, a, shipR)})), ...FLAPS.aft.map((f) => ({f, g: flapGeom(f, flapAft, a, shipR)}))];
  const back = flaps.filter((x) => x.g.depth < 0);
  const front = flaps.filter((x) => x.g.depth >= 0);
  const outline = [...SHIP_PROF.map(([y, r]) => `${-r},${y}`), ...SHIP_PROF.slice().reverse().map(([y, r]) => `${r},${y}`)].join(' ');
  const tiles = tileBands(SHIP_PROF.filter(([y]) => y <= 0.3), 100, a);
  const FlapEl = ({g}: {g: ReturnType<typeof flapGeom>}) => (
    <polygon
      points={g.q.map((v) => `${v.x.toFixed(3)},${v.y.toFixed(3)}`).join(' ')}
      fill={g.tileVisible ? p.tile : p.mid}
      stroke={p.out} strokeWidth={2} strokeLinejoin="round" {...NS}
    />
  );
  // engines: 3 sea-level (inner, r 1.25) and 3 vacuum (outer, r 3.0), sorted back to front
  const eng = [
    ...[0, 120, 240].map((th) => ({th, r: 1.25, vac: false})),
    ...[60, 180, 300].map((th) => ({th, r: 3.0, vac: true})),
  ]
    .map((e) => ({...e, x: e.r * Math.sin((e.th - a) * D), d: e.r * Math.cos((e.th - a) * D)}))
    .sort((m, n) => m.d - n.d);
  const fit = [90, -90].map((th) => ({x: (R + 0.35) * Math.sin((th - a) * D), d: Math.cos((th - a) * D)}));
  return (
    <g opacity={ghost ? 0.35 : 1}>
      <ShadeDefs id={gid} p={p} />
      {engines > 0.01 ? (
        <g>
          {[-1.1, 0, 1.1].map((x, i) => <Plume key={i} x={x * Math.abs(Math.cos(a * D)) * 0.4 + x * 0.6} w={1.6} len={plumeLen} k={engines} t={t} seed={i} />)}
        </g>
      ) : null}
      {eng.map((e, i) => (
        <path key={i}
          d={e.vac
            ? `M${e.x - 0.75} -0.3 L${e.x + 0.75} -0.3 L${e.x + 1.15} 0.9 L${e.x - 1.15} 0.9 Z`
            : `M${e.x - 0.3} -0.3 L${e.x + 0.3} -0.3 L${e.x + 0.42} 0.5 C ${e.x + 0.6} 1.2, ${e.x + 0.66} 1.6, ${e.x + 0.66} 1.9 L${e.x - 0.66} 1.9 C ${e.x - 0.66} 1.6, ${e.x - 0.6} 1.2, ${e.x - 0.42} 0.5 Z`}
          fill={`url(#${gid}_bell)`} stroke={p.out} strokeWidth={1.4} {...NS} />
      ))}
      {back.map((x, i) => <FlapEl key={`b${i}`} g={x.g} />)}
      <polygon points={outline} fill={`url(#${gid}_steel)`} />
      {tiles.map((b, i) => (
        <g key={i}>
          <polygon points={b} fill={`url(#${gid}_tile)`} />
          {detail ? <polygon points={b} fill={`url(#${gid}_hex)`} /> : null}
        </g>
      ))}
      {/* ring welds on the barrel */}
      {Array.from({length: 17}, (_, i) => -1.83 * (i + 1)).map((y, i) => (
        <line key={i} x1={-R} x2={R} y1={y} y2={y} stroke="rgba(20,26,32,0.16)" strokeWidth={1} {...NS} />
      ))}
      {/* light: soft highlight and terminator over everything */}
      <polygon points={outline} fill="none" stroke={p.out} strokeWidth={2.4} strokeLinejoin="round" {...NS} />
      {/* aft skirt band */}
      <rect x={-R} y={-0.9} width={2 * R} height={0.9} fill="rgba(20,24,30,0.22)" />
      {fittings > 0
        ? fit.filter((f) => f.d > -0.2).map((f, i) => (
          <g key={i} opacity={Math.min(1, fittings)}>
            <rect x={f.x - 0.7} y={-36.4} width={1.4} height={1.3} rx={0.2} fill="#ffc93c" stroke={p.out} strokeWidth={1.6} {...NS} />
          </g>
        ))
        : fit.filter((f) => f.d > -0.2).map((f, i) => <rect key={i} x={f.x - 0.55} y={-36.2} width={1.1} height={1.0} rx={0.15} fill={p.lo} stroke={p.out} strokeWidth={1.2} {...NS} />)}
      {front.map((x, i) => <FlapEl key={`f${i}`} g={x.g} />)}
      {heat > 0.01 ? <ShipHeat az={a} k={heat} t={t} gid={gid} /> : null}
    </g>
  );
};

/** Reentry heating: a bright shock layer hugging the windward surface, a halo, and a wake streaming off the leeward side.
 *  Kept to the vehicle and its flow; the frame is not washed in orange. */
const ShipHeat: React.FC<{az: number; k: number; t: number; gid: string}> = ({az, k, t, gid}) => {
  const wx = -Math.sin(az * D); // screen side of the heat shield (−1 left … +1 right)
  const faceOn = Math.abs(Math.cos(az * D));
  const side = Math.abs(wx) < 0.15 ? 1 : Math.sign(wx);
  const f = 1 + 0.06 * noise(t * 7, 2);
  const ys = Array.from({length: 26}, (_, i) => 1 - i * 2);
  const outer = ys.map((y) => [side * (shipR(y) * Math.max(0.35, Math.abs(wx)) + (2.2 + 1.4 * Math.sin((-y / 50) * Math.PI)) * f), y]);
  const inner = ys.slice().reverse().map((y) => [side * shipR(y) * Math.max(0.3, Math.abs(wx)) * 0.55, y]);
  const pts = [...outer, ...inner].map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
  const gx = `${gid}_shock${side > 0 ? 'r' : 'l'}`;
  return (
    <g opacity={k}>
      <defs>
        <linearGradient id={gx} gradientUnits="userSpaceOnUse" x1={0} x2={side * (R + 4)} y1={0} y2={0}>
          <stop offset="0.45" stopColor="#fff6e8" stopOpacity="0.95" />
          <stop offset="0.7" stopColor="#ffb06a" stopOpacity="0.85" />
          <stop offset="0.88" stopColor="#f0508a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#7a3ad0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx={side * 1.5} cy={-25} rx={R * 2.4} ry={34 * f} fill={`url(#${gid}_heat)`} opacity={0.45 + 0.25 * faceOn} />
      <polygon points={pts} fill={`url(#${gx})`} opacity={0.95 - 0.35 * faceOn} />
      {faceOn > 0.3 ? <polygon points={SHIP_PROF.map(([y, r]) => `${-r * 0.92},${y}`).concat(SHIP_PROF.slice().reverse().map(([y, r]) => `${r * 0.92},${y}`)).join(' ')} fill={`url(#${gid}_heat)`} opacity={0.55 * faceOn} /> : null}
    </g>
  );
};

// ---------------- Super Heavy ----------------
export type BoosterProps = {
  az?: number; version?: 'v3' | 'v1'; engines?: number; t?: number; pal?: Pal; fins?: number; id?: string; plumeLen?: number; catchHi?: number; ghost?: boolean;
};

const FIN_Y = {v3: -63.2, v1: -66.2};

export const Booster: React.FC<BoosterProps> = ({az = 90, version = 'v3', engines = 0, t = 0, pal = 'day', fins = 24, id = 'bst', plumeLen = 40, catchHi = 0, ghost = false}) => {
  const p = PAL[pal];
  const gid = `${id}_${pal}`;
  const a = wrap(az);
  const L = BOOSTER_LEN;
  const outline = `${-R},${0.4} ${-R},${-L} ${R},${-L} ${R},${0.4}`;
  const finAz = version === 'v3' ? [0, 120, 240] : [45, 135, 225, 315];
  const span = version === 'v3' ? 4.6 : 3.6;
  const wid = version === 'v3' ? 4.0 : 3.0;
  const fy = FIN_Y[version];
  const finEls = finAz
    .map((th) => {
      const s = Math.sin((th - a) * D), c = Math.cos((th - a) * D);
      // corners: radial r in {R, R+span}, tangential ±wid/2 → x = r s ± (w/2) c
      const xs = [R * s - (wid / 2) * c, R * s + (wid / 2) * c, (R + span) * s + (wid / 2) * c, (R + span) * s - (wid / 2) * c];
      const thick = 0.7 + Math.abs(Math.sin(fins * D)) * (version === 'v3' ? 3.4 : 2.6) * (0.35 + 0.65 * Math.abs(c));
      return {th, c, s, xs, thick};
    })
    .sort((m, n) => m.c - n.c);
  const FinEl = ({f}: {f: (typeof finEls)[number]}) => {
    const x0 = Math.min(...f.xs), x1 = Math.max(...f.xs);
    const top = fy - f.thick / 2, bot = fy + f.thick / 2;
    return (
      <g>
        <rect x={x0} y={top} width={Math.max(0.4, x1 - x0)} height={f.thick} fill={p.lo} stroke={p.out} strokeWidth={2} {...NS} />
        {x1 - x0 > 1.2 && f.thick > 1.2
          ? <g>
            {Array.from({length: Math.floor((x1 - x0) / 0.5)}, (_, i) => (
              <line key={i} x1={x0 + 0.25 + i * 0.5} x2={x0 + 0.25 + i * 0.5 + f.thick * 0.5} y1={top + 0.1} y2={bot - 0.1} stroke="rgba(15,18,22,0.75)" strokeWidth={1} {...NS} />
            ))}
            {Array.from({length: Math.floor((x1 - x0) / 0.5)}, (_, i) => (
              <line key={`r${i}`} x1={x0 + 0.25 + i * 0.5 + f.thick * 0.5} x2={x0 + 0.25 + i * 0.5} y1={top + 0.1} y2={bot - 0.1} stroke="rgba(15,18,22,0.75)" strokeWidth={1} {...NS} />
            ))}
          </g>
          : null}
        {/* fin actuator housing at the root */}
        <rect x={R * f.s - 0.7} y={fy - 1.3} width={1.4} height={2.6} fill={p.mid} stroke={p.out} strokeWidth={1.4} {...NS} opacity={f.c > -0.2 ? 1 : 0} />
      </g>
    );
  };
  const pins = version === 'v1' ? [90, 270].map((th) => ({x: (R + 0.5) * Math.sin((th - a) * D), d: Math.cos((th - a) * D)})) : [];
  const bells = Array.from({length: 20}, (_, i) => i * 18).map((th) => ({x: 3.8 * Math.sin((th - a) * D), d: Math.cos((th - a) * D)})).filter((b) => b.d > -0.3).sort((m, n) => m.d - n.d);
  return (
    <g opacity={ghost ? 0.35 : 1}>
      <ShadeDefs id={gid} p={p} />
      {engines > 0.01 ? (
        <g>
          {[-2.2, 0, 2.2].map((x, i) => <Plume key={i} x={x} w={2.4} len={plumeLen} k={engines} t={t} seed={i + 3} />)}
        </g>
      ) : null}
      {bells.map((b, i) => (
        <path key={i} d={`M${b.x - 0.32} 0 L${b.x + 0.32} 0 L${b.x + 0.62} 1.6 L${b.x - 0.62} 1.6 Z`} fill={`url(#${gid}_bell)`} stroke={p.out} strokeWidth={1.2} {...NS} />
      ))}
      {finEls.filter((f) => f.c < 0).map((f, i) => <FinEl key={`b${i}`} f={f} />)}
      <polygon points={outline} fill={`url(#${gid}_steel)`} />
      {/* ring welds */}
      {Array.from({length: 38}, (_, i) => -1.83 * (i + 1)).map((y, i) => (
        <line key={i} x1={-R} x2={R} y1={y} y2={y} stroke="rgba(20,26,32,0.14)" strokeWidth={1} {...NS} />
      ))}
      {/* aft skirt / engine section, darker sooted band */}
      <rect x={-R} y={-5.5} width={2 * R} height={5.9} fill="rgba(40,36,34,0.35)" />
      {/* hot-stage ring at the top: V3 integrated vented ring; V1 separate ring */}
      <rect x={-R} y={-L} width={2 * R} height={version === 'v3' ? 2.6 : 2.2} fill="rgba(30,34,40,0.55)" />
      {Array.from({length: 7}, (_, i) => -R + 0.9 + i * 1.2).map((x, i) => (
        <rect key={i} x={x} y={-L + 0.6} width={0.7} height={version === 'v3' ? 1.4 : 1.0} fill="#0f1215" opacity={0.85} />
      ))}
      {(() => {
        const rc = Math.cos((200 - a) * D);
        const rx = R * Math.sin((200 - a) * D);
        return rc > 0 ? <rect x={rx - 0.35} y={-L + 3} width={0.7} height={L - 9} fill={p.mid} stroke="rgba(20,26,32,0.5)" strokeWidth={1} {...NS} /> : null;
      })()}
      <polygon points={outline} fill="none" stroke={p.out} strokeWidth={2.4} strokeLinejoin="round" {...NS} />
      {pins.filter((q) => q.d > -0.2).map((q, i) => (
        <rect key={i} x={q.x - 0.6} y={-L + 4.6} width={1.2} height={1.0} rx={0.15} fill={catchHi > 0 ? '#ffc93c' : p.lo} stroke={p.out} strokeWidth={1.4} {...NS} />
      ))}
      {finEls.filter((f) => f.c >= 0).map((f, i) => <FinEl key={`f${i}`} f={f} />)}
      {version === 'v3' && catchHi > 0
        ? finEls.filter((f) => f.c >= -0.1).map((f, i) => (
          <rect key={i} x={R * f.s - 0.8} y={fy - 1.9} width={1.6} height={0.8} rx={0.15} fill="#ffc93c" stroke={p.out} strokeWidth={1.4} opacity={catchHi} {...NS} />
        ))
        : null}
    </g>
  );
};

/** The two-stage stack: booster with the ship on top. */
export const Stack: React.FC<{az?: number; t?: number; pal?: Pal; engines?: number; id?: string}> = ({az = 90, t = 0, pal = 'day', engines = 0, id = 'stk'}) => (
  <g>
    <Booster az={az} pal={pal} t={t} engines={engines} id={`${id}b`} plumeLen={70} />
    <g transform={`translate(0 ${-BOOSTER_LEN})`}>
      <Ship az={az} pal={pal} t={t} id={`${id}s`} />
    </g>
  </g>
);

/** Underside (end-on) view of the ship's engine plane: 3 sea-level inside, 3 larger vacuum bells outside. */
export const ShipEngineView: React.FC<{lit?: number; hiSea?: number; t?: number}> = ({lit = 0, hiSea = 0, t = 0}) => (
  <g>
    <circle r={R} fill="#3a4049" stroke={INK} strokeWidth={3} {...NS} />
    <circle r={R * 0.92} fill="#2a2f36" />
    {[60, 180, 300].map((th, i) => {
      const x = 3.0 * Math.sin(th * D), y = -3.0 * Math.cos(th * D);
      return (
        <g key={`v${i}`}>
          <circle cx={x} cy={y} r={1.2} fill="#5a4f47" stroke={INK} strokeWidth={2.4} {...NS} />
          <circle cx={x} cy={y} r={0.95} fill="#1a1715" />
          <circle cx={x} cy={y} r={0.25} fill="#4a413b" />
        </g>
      );
    })}
    {[0, 120, 240].map((th, i) => {
      const x = 1.25 * Math.sin(th * D), y = -1.25 * Math.cos(th * D);
      const g = lit * (0.85 + 0.15 * noise(t * 11, i));
      return (
        <g key={`s${i}`}>
          <circle cx={x} cy={y} r={0.66} fill="#6d5f55" stroke={hiSea > 0 ? '#ffc93c' : INK} strokeWidth={hiSea > 0 ? 3.5 : 2.2} {...NS} />
          <circle cx={x} cy={y} r={0.5} fill="#1a1715" />
          {g > 0.01 ? <circle cx={x} cy={y} r={0.5} fill="#fff3d0" opacity={g} /> : null}
          {g > 0.01 ? <circle cx={x} cy={y} r={1.1} fill="url(#glowWarm)" opacity={g} /> : null}
        </g>
      );
    })}
  </g>
);

/** Oblique view from above the booster's top: the three V3 grid fins (lattice in the horizontal plane) and their catch
 *  features, so the fins can be counted. elev = camera elevation above the horizon (deg); rot = booster roll (deg). */
export const FinTopView: React.FC<{elev?: number; rot?: number; catchHi?: number; ver?: 'v3' | 'v1'}> = ({elev = 32, rot = 0, catchHi = 0, ver = 'v3'}) => {
  const se = Math.sin(elev * D), ce = Math.cos(elev * D);
  const P = (x: number, y: number, z: number): [number, number] => [x, z * se - y * ce];
  const fy = 0; // fin plane height (local)
  const span = ver === 'v3' ? 4.6 : 3.6, wid = ver === 'v3' ? 4.0 : 3.0;
  const fins = (ver === 'v3' ? [0, 120, 240] : [45, 135, 225, 315]).map((a0) => {
    const a = (a0 + rot) * D;
    const ur = [Math.sin(a), Math.cos(a)], ut = [Math.cos(a), -Math.sin(a)];
    const pt = (r: number, w: number) => P(ur[0] * r + ut[0] * w, fy, ur[1] * r + ut[1] * w);
    return {a, depth: ur[1], ur, ut, pt};
  });
  const topH = 9; // body above the fins
  const body = (
    <g>
      <path d={`M${-R} ${P(0, -30, 0)[1]} L${-R} ${P(0, topH, 0)[1]} A ${R} ${R * se} 0 0 1 ${R} ${P(0, topH, 0)[1]} L${R} ${P(0, -30, 0)[1]} Z`} fill="url(#steelCyl)" stroke={INK} strokeWidth={2.4} {...NS} />
      <ellipse cx={0} cy={P(0, topH, 0)[1]} rx={R} ry={R * se} fill="#3a4049" stroke={INK} strokeWidth={2.4} {...NS} />
      <ellipse cx={0} cy={P(0, topH, 0)[1]} rx={R * 0.8} ry={R * 0.8 * se} fill="#59616c" />
      {Array.from({length: 24}, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const x = R * Math.sin(a), z = R * Math.cos(a);
        if (z < 0) return null;
        const p1 = P(x, topH - 0.6, z), p2 = P(x, topH - 2.4, z);
        return <line key={i} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke="#0f1215" strokeWidth={3} {...NS} />;
      })}
    </g>
  );
  const Fin = ({f}: {f: (typeof fins)[number]}) => {
    const c = [f.pt(R, -wid / 2), f.pt(R + span, -wid / 2), f.pt(R + span, wid / 2), f.pt(R, wid / 2)];
    const grid: React.ReactNode[] = [];
    for (let i = 1; i < 8; i++) {
      const u = i / 8;
      const a1 = f.pt(R + span * u, -wid / 2), a2 = f.pt(R + span * u, wid / 2);
      const b1 = f.pt(R, -wid / 2 + wid * u), b2 = f.pt(R + span, -wid / 2 + wid * u);
      grid.push(<line key={`a${i}`} x1={a1[0]} y1={a1[1]} x2={a2[0]} y2={a2[1]} stroke="#1f252c" strokeWidth={2} {...NS} />);
      grid.push(<line key={`b${i}`} x1={b1[0]} y1={b1[1]} x2={b2[0]} y2={b2[1]} stroke="#1f252c" strokeWidth={2} {...NS} />);
    }
    const cf = [f.pt(R - 0.2, -0.8), f.pt(R + 1.2, -0.8), f.pt(R + 1.2, 0.8), f.pt(R - 0.2, 0.8)];
    return (
      <g>
        <polygon points={c.map((p) => p.join(',')).join(' ')} fill="#8d98a3" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" {...NS} />
        {grid}
        <polygon points={cf.map((p) => p.join(',')).join(' ')} fill={catchHi > 0 ? '#ffc93c' : '#5d6670'} stroke={INK} strokeWidth={2} opacity={ver === 'v3' ? 1 : 0} {...NS} />
      </g>
    );
  };
  return (
    <g>
      {fins.filter((f) => f.depth < 0).map((f, i) => <Fin key={`b${i}`} f={f} />)}
      {body}
      {fins.filter((f) => f.depth >= 0).map((f, i) => <Fin key={`f${i}`} f={f} />)}
    </g>
  );
};
