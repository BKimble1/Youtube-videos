import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {SensorTop} from './HandheldSensor';
import {ZoneBox} from './S7_ZoneBox';
import track from '../../data/evidence/tracking_topdown.json';
import ams from '../../data/evidence/ams_U.json';

/**
 * S7 evidence drawings. Everything is drawn from the authors' released numbers in src/data/evidence: no smoothing, no
 * interpolated points (a moving marker jumps to the nearest stored frame), no blur.
 *
 *  TrackPlot  – tracking_topdown.json seen from above, x mirrored for display (display x = -x) so the sensor sits on the
 *               left as in our room. Wall line on top, the 16 measured wall points, the sensor and partition (the
 *               authors' plot constants), and our run of the authors' tracker (`ours_xz`) as a marker with a short
 *               trail. Frames are frame numbers, never seconds.
 *  RasterPanel – the 36 known sensor positions (6×6 serpentine raster, `sensor_positions_xy_m`), x inverted like the
 *               authors' front-view plot, with the 3×3-zone box stepping along it.
 *  UFront     – the cumulative front view `fronts[k-1]` (40×40 cells) as rounded squares on a cream → teal → ink ramp,
 *               value = (cell / max of that view)^3 (the authors' gamma-3 display; matplotlib's imshow scales each
 *               view to its own range), nearest cell only, x inverted (1.1 m at left) as in the authors' plot.
 */

const f2 = (n: number) => Math.round(n * 100) / 100;

type XZ = [number, number];
const T = track as unknown as {
  wall_points_xz: XZ[];
  sensor_xz: XZ;
  occluder_xz: XZ[];
  ours_xz: XZ[];
  num_frames: number;
};
export const TRACK_FRAMES = T.num_frames;

/* ------------------------------------------------------------------ TrackPlot */

/** Display window (metres, display x = -x). */
const DX0 = -0.22;
const DX1 = 1.86;
const DZ0 = -0.15;
const DZ1 = 1.66;
export const TRACK_ASPECT = (DZ1 - DZ0) / (DX1 - DX0);

export type TrackPlotProps = {
  /** plot width in px (height = width × TRACK_ASPECT) */
  width: number;
  /** data frame index (0-based, float; the marker shows floor(idx)) */
  idx: number;
  /** first frame index the trail may reach back to */
  fromIdx?: number;
  /** trail length in data frames (0 = whole run so far) */
  trail?: number;
  /** show the full run as a faint line (the mini card) */
  wholeRun?: boolean;
  /** 0..1 pulses: highlight the wall points / the partition */
  wallPulse?: number;
  partitionPulse?: number;
  /** text labels on the plot (wall, sensor, partition, scale) */
  labels?: boolean;
  fontSize?: number;
  /** marker visibility */
  marker?: number;
  /** 0..1: a "×4" tag pops under each of the four wall-point columns (seen from above, each dot is 4 spots stacked up
   *  the wall: the 16 measured spots of the 4×4 grid only have x and z in the data) */
  stackTag?: number;
};

export const TrackPlot: React.FC<TrackPlotProps> = ({width, idx, fromIdx = 0, trail = 50, wholeRun = false, wallPulse = 0, partitionPulse = 0, labels = true, fontSize = 34, marker = 1, stackTag = 0}) => {
  const K = width / (DX1 - DX0);
  const height = (DZ1 - DZ0) * K;
  const P = (x: number, z: number) => ({x: (-x - DX0) * K, y: (z - DZ0) * K});
  const i = Math.max(0, Math.min(T.ours_xz.length - 1, Math.floor(idx)));
  const i0 = trail > 0 ? Math.max(fromIdx, i - trail) : fromIdx;
  const wallY = P(0, 0).y;
  const occ = T.occluder_xz;
  const oa = P(occ[0][0], occ[0][1]);
  const ob = P(occ[1][0], occ[1][1]);
  const s = P(T.sensor_xz[0], T.sensor_xz[1]);
  const small = width < 500;
  const ink = small ? 3 : OUTLINE;
  // trail: four chunks, older = paler (flat strokes, no gradient)
  const chunks: React.ReactNode[] = [];
  if (marker > 0 && i > i0) {
    const n = i - i0;
    const parts = 4;
    for (let c = 0; c < parts; c++) {
      const a = i0 + Math.floor((n * c) / parts);
      const b = i0 + Math.floor((n * (c + 1)) / parts);
      if (b <= a) continue;
      const d = T.ours_xz.slice(a, b + 1).map(([x, z], j) => `${j ? 'L' : 'M'} ${P(x, z).x.toFixed(1)} ${P(x, z).y.toFixed(1)}`).join(' ');
      chunks.push(<path key={c} d={d} fill="none" stroke={C.tealDeep} strokeWidth={small ? 4 : 6} strokeLinecap="round" strokeLinejoin="round" opacity={(0.18 + 0.6 * ((c + 1) / parts)) * marker} />);
    }
  }
  const whole = wholeRun ? T.ours_xz.slice(6).map(([x, z], j) => `${j ? 'L' : 'M'} ${P(x, z).x.toFixed(1)} ${P(x, z).y.toFixed(1)}`).join(' ') : '';
  const m = P(T.ours_xz[i][0], T.ours_xz[i][1]);
  const fs = fontSize;
  const lab = {fontFamily: F.body, fontWeight: 800, fontSize: fs, fill: C.inkSoft} as const;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display: 'block', overflow: 'visible'}}>
      {/* the relay wall seen from above: a band of wall colour behind a heavy ink line */}
      <rect x={0} y={0} width={width} height={wallY} fill="#F5E4C6" />
      <line x1={0} y1={wallY} x2={width} y2={wallY} stroke={C.ink} strokeWidth={small ? 5 : 8} strokeLinecap="round" />
      {labels && (
        <text x={width - 14} y={wallY - 14} textAnchor="end" {...lab}>
          wall
        </text>
      )}
      {/* partition (authors' plot constant) */}
      <rect x={oa.x - (small ? 6 : 9)} y={oa.y} width={small ? 12 : 18} height={ob.y - oa.y} rx={6} fill={C.coral} stroke={C.ink} strokeWidth={ink} />
      {partitionPulse > 0 && <rect x={oa.x - 16} y={oa.y - 8} width={32} height={ob.y - oa.y + 16} rx={14} fill="none" stroke={C.coralDeep} strokeWidth={4} opacity={partitionPulse} />}
      {labels && (
        <text x={oa.x + 22} y={ob.y - 6} {...lab}>
          partition
        </text>
      )}
      {/* sensor (authors' plot constant), facing the wall */}
      <SensorTop asGroup x={s.x} y={s.y} size={small ? 30 : 64} facing={0} />
      {labels && (
        <text x={s.x} y={s.y + 34 + fs * 0.8} textAnchor="middle" {...lab}>
          sensor
        </text>
      )}
      {/* run so far */}
      {wholeRun && <path d={whole} fill="none" stroke={C.tealDeep} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />}
      {chunks}
      {/* the 16 measured wall points: saffron, as on the opening's board (S1.3) and the plan's wall spots */}
      {T.wall_points_xz.map(([x, z], j) => {
        const p = P(x, z);
        const col = Math.floor(j % 4);
        const pk = Math.max(0, Math.min(1, wallPulse * 1.6 - col * 0.2));
        const r = (small ? 4 : 7.5) * (1 + 0.45 * Math.sin(Math.PI * pk));
        return <circle key={j} cx={p.x} cy={p.y} r={r} fill={C.saffron} stroke={C.ink} strokeWidth={small ? 2 : 2.5} />;
      })}
      {/* "×4" under each wall-point column (the 4 rows of the 4×4 grid overlap when seen from above) */}
      {stackTag > 0 &&
        [0, 1, 2, 3].map((col) => {
          const pts = T.wall_points_xz.filter((_, j) => j % 4 === col);
          const mx = pts.reduce((a, [x]) => a + x, 0) / pts.length;
          const p = P(mx, 0);
          const t = Math.max(0, Math.min(1, stackTag * 1.6 - col * 0.2));
          if (t <= 0) return null;
          const k = 0.7 + 0.3 * Math.min(1, t * 1.2);
          return (
            <text key={`x${col}`} x={p.x} y={p.y + 30 + fs * 0.62} textAnchor="middle" fontFamily={F.mono} fontWeight={600} fontSize={30} fill={C.inkSoft} opacity={Math.min(1, t * 1.5)} transform={`translate(${f2(p.x * (1 - k))} ${f2((p.y + 30) * (1 - k))}) scale(${f2(k)})`}>
              ×4
            </text>
          );
        })}
      {/* the estimated position: the stored frame nearest the clock, no interpolation; teal with a cream highlight, as on
          the opening's board (S1.3), so the callback keeps the colour code (wall points saffron, estimate teal) */}
      {marker > 0 && !wholeRun && (
        <g opacity={marker}>
          <circle cx={m.x} cy={m.y} r={small ? 9 : 17} fill={C.teal} stroke={C.ink} strokeWidth={ink} />
          <circle cx={m.x - (small ? 3 : 5)} cy={m.y - (small ? 3 : 5)} r={small ? 2.5 : 5} fill={C.cream} opacity={0.85} />
        </g>
      )}
      {/* scale bar: 50 cm */}
      {labels && (
        <g>
          {(() => {
            const a = P(-1.3, 1.56);
            const b = P(-1.8, 1.56);
            return (
              <g>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
                <line x1={a.x} y1={a.y - 9} x2={a.x} y2={a.y + 9} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
                <line x1={b.x} y1={b.y - 9} x2={b.x} y2={b.y + 9} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
                <text x={(a.x + b.x) / 2} y={a.y - 18} textAnchor="middle" fontFamily={F.mono} fontWeight={500} fontSize={34} fill={C.inkSoft}>
                  50 cm
                </text>
              </g>
            );
          })()}
        </g>
      )}
    </svg>
  );
};

/* ------------------------------------------------------------------ the U: raster + front view */

const A = ams as unknown as {sensor_positions_xy_m: [number, number][]; fronts: number[][][]};
export const RASTER = A.sensor_positions_xy_m;
export const N_POS = RASTER.length;
const RX0 = 0;
const RX1 = 1.28;
const RY0 = 0.32;
const RY1 = 0.96;

/** Per-view maxima, for the authors' per-image display scaling. */
const MAXES = A.fronts.map((f) => f.reduce((m, row) => row.reduce((mm, v) => Math.max(mm, v), m), 0));

export type RasterPanelProps = {
  width: number;
  /** position along the raster: 1 = first position … 36 = last (float: the box glides between positions) */
  pos: number;
  /** positions measured so far (dots filled) */
  done: number;
  firing?: number;
  boxSize?: number;
  /** 0..1 the box (and path) appear */
  t?: number;
};

/** Margin (px) around the raster inside the panel so the box never crosses the panel edge. */
export const rasterGeom = (width: number, boxSize: number) => {
  const m = boxSize * 0.62;
  const K = (width - 2 * m) / (RX1 - RX0);
  const height = (RY1 - RY0) * K + 2 * m;
  // x inverted (x = 0 at the right), y up
  const P = (x: number, y: number) => ({x: m + (RX1 - x) * K, y: m + (RY1 - y) * K});
  return {K, height, P, m};
};

export const RasterPanel: React.FC<RasterPanelProps> = ({width, pos, done, firing = 0, boxSize = 64, t = 1}) => {
  const {height, P} = rasterGeom(width, boxSize);
  const pts = RASTER.map(([x, y]) => P(x, y));
  const j = Math.max(0, Math.min(N_POS - 1, Math.floor(pos - 1)));
  const u = Math.max(0, Math.min(1, pos - 1 - j));
  const a = pts[j];
  const b = pts[Math.min(N_POS - 1, j + 1)];
  const bx = a.x + (b.x - a.x) * u;
  const by = a.y + (b.y - a.y) * u;
  const nDone = Math.max(0, Math.min(N_POS, Math.floor(done)));
  const path = pts.slice(0, Math.max(1, nDone)).map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display: 'block', overflow: 'visible'}}>
      {nDone > 1 && <path d={path} fill="none" stroke={C.teal} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i < nDone ? 8 : 6} fill={i < nDone ? C.teal : C.cream} stroke={i < nDone ? C.ink : C.inkMuted} strokeWidth={i < nDone ? 3 : 2.5} />
      ))}
      {t > 0 && <ZoneBox asGroup x={bx} y={by - boxSize * 0.12} size={boxSize} firing={firing} listening={firing} opacity={t} scale={0.85 + 0.15 * t} />}
    </svg>
  );
};

/**
 * cream → teal-light → teal → teal-deep → ink, with knots weighted toward the low end (like the authors' 'hot' map,
 * where small values already separate from zero); the values themselves are untouched.
 */
const RAMP = ['#FFFBF0', '#BFE8E3', '#1CA7A0', '#128078', '#162A32'];
const KNOTS = [0, 0.07, 0.28, 0.65, 1];
const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const RAMP_RGB = RAMP.map(hex);
const rampColor = (v: number) => {
  const x = Math.max(0, Math.min(1, v));
  let i = 0;
  while (i < KNOTS.length - 2 && x > KNOTS[i + 1]) i++;
  const f = (x - KNOTS[i]) / (KNOTS[i + 1] - KNOTS[i]);
  const a = RAMP_RGB[i];
  const b = RAMP_RGB[i + 1];
  return `rgb(${a.map((c, k) => Math.round(c + (b[k] - c) * f)).join(',')})`;
};

export type UFrontProps = {
  /** cell size px */
  cell: number;
  /** positions included (1..36); 0 = blank */
  k: number;
  /** 0..1 fade of the cells (only for the very first appearance) */
  t?: number;
};

/** Front view after k positions (40×40 nearest cells, gamma 3, scaled to its own maximum, x inverted). */
export const UFront: React.FC<UFrontProps> = ({cell, k, t = 1}) => {
  const n = 40;
  const size = n * cell;
  const kk = Math.max(0, Math.min(N_POS, Math.floor(k)));
  const cells: React.ReactNode[] = [];
  if (kk > 0) {
    const f = A.fronts[kk - 1];
    const mx = MAXES[kk - 1] || 1;
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const v = Math.pow(Math.max(0, f[row][col]) / mx, 3);
        if (v < 0.012) continue;
        const x = (n - 1 - col) * cell; // x inverted: x = 1.1 m at the left, as in the authors' plot
        const y = (n - 1 - row) * cell; // row 0 = lowest y at the bottom
        cells.push(<rect key={row * n + col} x={x + 0.8} y={y + 0.8} width={cell - 1.6} height={cell - 1.6} rx={cell * 0.24} fill={rampColor(v)} />);
      }
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display: 'block'}}>
      <rect x={0} y={0} width={size} height={size} fill={RAMP[0]} />
      <g opacity={t}>{cells}</g>
      <rect x={0} y={0} width={size} height={size} fill="none" stroke={C.ink} strokeWidth={OUTLINE} rx={6} />
    </svg>
  );
};
