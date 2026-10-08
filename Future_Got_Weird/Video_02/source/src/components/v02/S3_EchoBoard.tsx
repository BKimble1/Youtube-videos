import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {E} from '../../lib/motion';
import {LAYOUT as OLAYOUT} from '../../lib/optics';
import raw from '../../data/evidence/ams_wall_vs_echo.json';
import {ZoneBox} from './S3_ZoneBox';

/**
 * S3.3 evidence board (screen space, 1920×1080): the authors' released RAW histogram of the centre zone of the ams
 * 3×3-zone sensor (data/evidence/ams_wall_vs_echo.json, iter_22), plotted as numbers: one point per 88 ps bin, straight
 * segments between them, no smoothing, no invented points.
 *
 *  - LINEAR count axis from 0: the wall's echo is one tall spike; the hidden object's bump is invisible at this scale.
 *  - A bar magnifier slides over the tail. Inside it the SAME data are drawn with the height multiplied by the factor
 *    shown on its tab (the time axis is not stretched, zero stays on the baseline); the factor animates from ×1 to
 *    ZOOM and the tab always shows the factor actually used.
 *  - Every number on the board is computed here from the data and cross-checked against the file's zone_measures
 *    (module load throws if they disagree): the bump's time after the wall echo, the extra path (time × c), the
 *    peak-to-bump ratio ("hundreds of times weaker"), the zoom factor.
 *
 * Pure function of its props; the scene drives every `t` from its cue constants.
 */

type EchoData = {
  counts: number[];
  time_ns_after_wall_peak: number[];
  bin_width_ns: number;
  wall_peak_bin: number;
  zone_measures: {
    wall_peak_bin: number;
    wall_peak_counts: number;
    late_return_peak_bin: number;
    late_return_peak_counts: number;
    late_return_time_after_wall_ns: number;
    late_return_extra_path_cm: number;
    late_return_local_floor_counts: number;
    late_return_excess_counts: number;
    wall_peak_to_late_excess_ratio: number;
  };
};
const D = raw as unknown as EchoData;
const N = D.counts.length;
const T = D.time_ns_after_wall_peak;
const CNT = D.counts;

/* ------------------------------------------------------------------ numbers, from the data */

const argmax = (a: number[], i0 = 0, i1 = a.length) => {
  let k = i0;
  for (let i = i0; i < i1; i++) if (a[i] > a[k]) k = i;
  return k;
};
const argmin = (a: number[], i0 = 0, i1 = a.length) => {
  let k = i0;
  for (let i = i0; i < i1; i++) if (a[i] < a[k]) k = i;
  return k;
};
const PEAK_BIN = argmax(CNT);
// the floor between the wall echo's tail and the late bump: the lowest bin in the 50 bins after the peak
const FLOOR_BIN = argmin(CNT, PEAK_BIN + 1, PEAK_BIN + 50);
// the late bump: the highest bin after that floor
const BUMP_BIN = argmax(CNT, FLOOR_BIN, N);
// end of the hump: the first bin after the bump that is back within a quarter of the excess above the floor
const HUMP_END = (() => {
  const lim = CNT[FLOOR_BIN] + 0.25 * (CNT[BUMP_BIN] - CNT[FLOOR_BIN]);
  for (let i = BUMP_BIN; i < N; i++) if (CNT[i] < lim) return i;
  return N - 1;
})();
const ZM = D.zone_measures;
const C_M_PER_NS = OLAYOUT.c_m_per_ns;

/** Echo numbers, all computed from the plotted counts. */
export const ECHO = (() => {
  const peak = CNT[PEAK_BIN];
  const bump = CNT[BUMP_BIN];
  const floor = CNT[FLOOR_BIN];
  const bumpNs = T[BUMP_BIN] - T[PEAK_BIN];
  const extraM = bumpNs * C_M_PER_NS;
  const ratio = peak / (bump - floor);
  const check = (ok: boolean, what: string) => {
    if (!ok) throw new Error(`S3_EchoBoard: ${what} disagrees with zone_measures in ams_wall_vs_echo.json`);
  };
  check(PEAK_BIN === D.wall_peak_bin && PEAK_BIN === ZM.wall_peak_bin, 'wall peak bin');
  check(BUMP_BIN === ZM.late_return_peak_bin, 'late bump bin');
  check(Math.abs(bumpNs - ZM.late_return_time_after_wall_ns) < 1e-6, 'bump time');
  check(Math.abs(extraM * 100 - ZM.late_return_extra_path_cm) < 0.5, 'extra path');
  check(Math.abs(ratio - ZM.wall_peak_to_late_excess_ratio) < 0.01, 'peak-to-bump ratio');
  check(ratio >= 100 && ratio < 1000, '"hundreds of times" (ratio not in the hundreds)');
  return {peak, bump, floor, bumpNs, extraM, ratio, peakBin: PEAK_BIN, bumpBin: BUMP_BIN};
})();

/* ------------------------------------------------------------------ board geometry (screen px) */

export const CARD = {x0: 80, y0: 30, x1: 1840, y1: 944};
const PLOT = {x0: 260, x1: 1190, y0: 300, base: 760, t0: -2.7, t1: 8.6, yMax: 1.4e6};
const plotH = PLOT.base - PLOT.y0;
const X = (ns: number) => PLOT.x0 + ((ns - PLOT.t0) / (PLOT.t1 - PLOT.t0)) * (PLOT.x1 - PLOT.x0);
const Y = (c: number, z = 1) => PLOT.base - ((c * z) / PLOT.yMax) * plotH;

/** The zoom factor: the bump's peak at about 55 % of the plot height, rounded to a multiple of 50. */
export const ZOOM = Math.max(50, Math.round((0.55 * PLOT.yMax) / ECHO.bump / 50) * 50);

/** Magnifier: fixed width in ns; slides from just right of the spike to over the tail. */
const LENS = {w: 5.7, from: 0.55, to: 2.9, top: PLOT.base - 0.8 * plotH, r: 18};

const RIGHT = 1252; // right column x
const BOX = {x: 1588, y: 150, size: 128};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const f2 = (n: number) => Math.round(n * 100) / 100;
const pop = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : E.back(t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Formats like "3.7" (one decimal). */
const d1 = (v: number) => (Math.round(v * 10) / 10).toFixed(1);

export type EchoBoardT = {
  /** 0..1 the card's printed content fades up */
  content: number;
  /** 0..1 axes draw on */
  axes: number;
  /** 0..1 conditions chip */
  chip: number;
  /** 0..1 the 3×3 box pops; boxCentre marks the centre zone */
  box: number;
  boxCentre: number;
  /** curve drawn up to this time (ns after the wall echo); below PLOT.t0 = nothing */
  drawNs: number;
  /** 0..1 opacity of the pen-head dot at the curve's drawn end (default 1; the scene fades it while the curve waits) */
  pen?: number;
  /** 0..1 "wall's echo" label */
  spikeLabel: number;
  /** 0..1 phase of a one-shot pulse on the spike's peak (dot 1 -> 1.5 -> 1 and a ring; default none) */
  spikePulse?: number;
  /** 0..1 magnifier appears; lensSlide 0..1 from beside the spike to over the tail */
  lens: number;
  lensSlide: number;
  /** 0..1 the height stretch inside the lens (factor = ZOOM^zoom, shown on the tab) */
  zoom: number;
  /** 0..1 callout: hundreds of times weaker */
  ratio: number;
  /** 0..1 marker ring round the bump */
  ring: number;
  /** 0..1 the 0 -> bump time dimension */
  dim: number;
  /** 0..1 callout: extra path */
  extra: number;
  /** 0..1 source chip */
  source: number;
};

const Txt: React.FC<{x: number; y: number; size?: number; children: React.ReactNode; color?: string; anchor?: 'start' | 'middle' | 'end'; weight?: number; font?: string; opacity?: number; halo?: string}> = ({x, y, size = 34, children, color = C.ink, anchor = 'start', weight = 800, font = F.body, opacity = 1, halo}) => (
  <text x={f2(x)} y={f2(y)} fontFamily={font} fontWeight={weight} fontSize={size} fill={color} textAnchor={anchor} opacity={opacity} stroke={halo} strokeWidth={halo ? 9 : undefined} strokeLinejoin="round" paintOrder="stroke">
    {children}
  </text>
);

/** Polyline of the data up to time `upTo` (an interpolated end point), with the height multiplied by z. */
const curveD = (upTo: number, z = 1, from = -Infinity) => {
  const pts: string[] = [];
  for (let i = 0; i < N; i++) {
    const t = T[i];
    if (t < from) continue;
    if (t > upTo) {
      if (i > 0 && T[i - 1] <= upTo) {
        const u = (upTo - T[i - 1]) / (t - T[i - 1]);
        pts.push(`${f2(X(upTo))} ${f2(Y(lerp(CNT[i - 1], CNT[i], u), z))}`);
      }
      break;
    }
    pts.push(`${f2(X(t))} ${f2(Y(CNT[i], z))}`);
  }
  return pts.length > 1 ? 'M ' + pts.join(' L ') : '';
};

export const EchoBoard: React.FC<{t: EchoBoardT}> = ({t}) => {
  const content = clamp01(t.content);
  const ax = E.out(clamp01(t.axes));
  const zf = Math.pow(ZOOM, clamp01(t.zoom)); // the factor actually used inside the lens
  const zShown = Math.round(zf);
  const lensT0 = lerp(LENS.from, LENS.to, E.inOut(clamp01(t.lensSlide)));
  const lx0 = X(lensT0);
  const lx1 = X(lensT0 + LENS.w);
  const lensIn = clamp01(t.lens);
  const lensK = pop(lensIn);
  const bumpX = X(T[BUMP_BIN]);
  const bumpY = Y(CNT[BUMP_BIN], zf);
  const peakX = X(0);
  const peakY = Y(ECHO.peak);
  const ringT = clamp01(t.ring);
  // the ring encloses the hump: from its rise to its fall (the bins above the local floor), peak to near the floor
  const humpT0 = T[FLOOR_BIN];
  const humpT1 = T[HUMP_END];
  // a round loop over the top of the hump (as one circles a bump on a printed plot)
  const ringC = {x: (X(humpT0) + X(humpT1)) / 2 + 4, y: Y(ECHO.bump, ZOOM) + 50};
  const ringR = {x: (X(humpT1) - X(humpT0)) / 2 + 36, y: 72};
  const yTicks = [0, 5e5, 1e6];
  const xTicks = [-2, 0, 2, 4, 6, 8];
  const lensH = PLOT.base - LENS.top;
  const showCurve = t.drawNs > PLOT.t0;
  const pen = clamp01(t.pen ?? 1);
  const pulse = clamp01(t.spikePulse ?? 0);
  // the ratio callout's leader touches the hump's right flank (inside the ring once it is drawn)
  const leadA = {x: X(T[BUMP_BIN + 4]) + 12, y: Y(CNT[BUMP_BIN + 4], zf)};
  const dimY = Y(ECHO.bump, ZOOM) - 58; // above the bump (and its ring), below the lens top
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id="s3lens">
          <rect x={f2(lx0)} y={f2(LENS.top)} width={f2(lx1 - lx0)} height={f2(lensH)} rx={LENS.r} />
        </clipPath>
        <clipPath id="s3plot">
          <rect x={PLOT.x0} y={PLOT.y0 - 60} width={PLOT.x1 - PLOT.x0 + 4} height={plotH + 62} />
        </clipPath>
      </defs>
      <g opacity={content}>
        {/* headline + conditions */}
        <Txt x={150} y={112} size={66} font={F.display} weight={600}>
          Real measurements
        </Txt>
        <g opacity={clamp01(t.chip * 2)} transform={`translate(0 ${f2((1 - E.out(clamp01(t.chip))) * 12)})`}>
          <rect x={150} y={146} width={1000} height={56} rx={28} fill={C.cream} stroke={C.inkMuted} strokeWidth={3} />
          <Txt x={178} y={185} size={32} color={C.inkSoft}>
            same team · a different sensor (3×3 zones) and hidden object
          </Txt>
        </g>

        {/* the 3×3-zone sensor (icon) */}
        {t.box > 0 && (
          <g>
            <ZoneBox asGroup x={BOX.x} y={BOX.y} size={BOX.size} scale={pop(clamp01(t.box))} listening={0.15} centre={clamp01(t.boxCentre)} />
            <g opacity={clamp01((t.box - 0.4) * 2.5)}>
              <Txt x={BOX.x + 6} y={BOX.y + 102} size={34} anchor="middle" color={C.tealDeep}>
                3×3-zone sensor
              </Txt>
            </g>
            <g opacity={clamp01(t.boxCentre * 2)}>
              <Txt x={BOX.x + 6} y={BOX.y + 142} size={30} anchor="middle" color={C.inkMuted}>
                plotted: the centre zone
              </Txt>
            </g>
          </g>
        )}

        {/* axes */}
        <g opacity={clamp01(t.axes * 3)}>
          <path
            d={`M ${PLOT.x0} ${f2(lerp(PLOT.base, PLOT.y0 - 24, ax))} L ${PLOT.x0} ${PLOT.base} L ${f2(lerp(PLOT.x0, PLOT.x1 + 14, ax))} ${PLOT.base}`}
            fill="none"
            stroke={C.ink}
            strokeWidth={OUTLINE}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g opacity={clamp01((t.axes - 0.5) * 2)}>
            {yTicks.map((v) => (
              <g key={v}>
                <path d={`M ${PLOT.x0 - 12} ${f2(Y(v))} L ${PLOT.x0} ${f2(Y(v))}`} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
                {v > 0 && <path d={`M ${PLOT.x0 + 2} ${f2(Y(v))} L ${PLOT.x1} ${f2(Y(v))}`} stroke={C.paperLine} strokeWidth={2} strokeDasharray="3 10" strokeLinecap="round" />}
                <Txt x={PLOT.x0 - 18} y={Y(v) + 12} size={34} anchor="end" font={F.mono} weight={500} color={C.inkSoft}>
                  {v === 0 ? '0' : `${(v / 1e6).toFixed(1)} M`}
                </Txt>
              </g>
            ))}
            {/* 34 px, body text (review r1 D21: it was 32): glyphs ~x 99..131, inside the 96 px margin, ~12 px clear of the ticks */}
            <text x={0} y={0} transform={`translate(${PLOT.x0 - 136} ${f2((PLOT.y0 + PLOT.base) / 2)}) rotate(-90)`} textAnchor="middle" fontFamily={F.body} fontWeight={700} fontSize={34} fill={C.inkSoft}>
              counts (linear scale)
            </text>
            {xTicks.map((v) => (
              <g key={v}>
                <path d={`M ${f2(X(v))} ${PLOT.base} L ${f2(X(v))} ${PLOT.base + 12}`} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
                <Txt x={X(v)} y={PLOT.base + 50} size={34} anchor="middle" font={F.mono} weight={500} color={C.inkSoft}>
                  {v < 0 ? `−${-v}` : `${v}`}
                </Txt>
              </g>
            ))}
            <Txt x={(PLOT.x0 + PLOT.x1) / 2} y={PLOT.base + 94} size={34} anchor="middle" weight={700} color={C.inkSoft}>
              time after the wall's echo (ns)
            </Txt>
          </g>
        </g>

        {/* the data, ×1 */}
        {showCurve && (
          <g clipPath="url(#s3plot)">
            <path d={curveD(t.drawNs)} fill="none" stroke={C.tealDeep} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
            {t.drawNs < T[N - 1] - 0.01 && pen > 0.001 && (() => {
              const k = Math.max(1, T.findIndex((v) => v > t.drawNs));
              const u = clamp01((t.drawNs - T[k - 1]) / (T[k] - T[k - 1]));
              return <circle cx={f2(X(t.drawNs))} cy={f2(Y(lerp(CNT[k - 1], CNT[k], u)))} r={8} fill={C.teal} stroke={C.ink} strokeWidth={3} opacity={f2(pen)} />;
            })()}
          </g>
        )}
        {pulse > 0 && pulse < 1 && <circle cx={f2(peakX)} cy={f2(peakY)} r={f2(12 + 40 * E.out(pulse))} fill="none" stroke={C.tealDeep} strokeWidth={f2(5 * (1 - pulse) + 1)} opacity={f2(0.9 * (1 - pulse))} />}
        {t.spikeLabel > 0 && (
          <g opacity={clamp01(t.spikeLabel * 2)} transform={`translate(${f2((1 - E.out(clamp01(t.spikeLabel))) * -10)} 0)`}>
            <circle cx={f2(peakX)} cy={f2(peakY)} r={f2(9 * (1 + 0.5 * Math.sin(Math.PI * pulse)))} fill={C.teal} stroke={C.ink} strokeWidth={3} />
            <Txt x={peakX + 24} y={peakY + 12} size={38}>
              wall's echo
            </Txt>
          </g>
        )}

        {/* the magnifier: same data, height × factor, time axis unchanged */}
        {lensIn > 0 && (
          <g opacity={clamp01(lensIn * 3)} transform={`translate(${f2((lx0 + lx1) / 2)} ${PLOT.base}) scale(${f2(lensK)}) translate(${f2(-(lx0 + lx1) / 2)} ${-PLOT.base})`}>
            {/* handle (behind the frame), from the top-right corner */}
            <path d={`M ${f2(lx1 - 8)} ${f2(LENS.top + 8)} L ${f2(lx1 + 58)} ${f2(LENS.top - 58)}`} stroke={C.ink} strokeWidth={30} strokeLinecap="round" />
            <path d={`M ${f2(lx1 - 8)} ${f2(LENS.top + 8)} L ${f2(lx1 + 58)} ${f2(LENS.top - 58)}`} stroke={C.woodDeep} strokeWidth={20} strokeLinecap="round" />
            <rect x={f2(lx0)} y={f2(LENS.top)} width={f2(lx1 - lx0)} height={f2(lensH)} rx={LENS.r} fill="#EEF8F6" />
            <g clipPath="url(#s3lens)">
              {/* faint reference lines of the zoomed scale */}
              <path d={curveD(Math.min(t.drawNs, lensT0 + LENS.w), zf, lensT0 - 0.2)} fill="none" stroke={C.tealDeep} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
              <path d={`M ${f2(lx0)} ${PLOT.base} L ${f2(lx1)} ${PLOT.base}`} stroke={C.ink} strokeWidth={OUTLINE} />
            </g>
            <rect x={f2(lx0)} y={f2(LENS.top)} width={f2(lx1 - lx0)} height={f2(lensH)} rx={LENS.r} fill="none" stroke={C.ink} strokeWidth={OUTLINE + 6} />
            <rect x={f2(lx0)} y={f2(LENS.top)} width={f2(lx1 - lx0)} height={f2(lensH)} rx={LENS.r} fill="none" stroke={C.saffron} strokeWidth={6} />
            <path d={`M ${f2(lx0 + 26)} ${f2(LENS.top + 70)} Q ${f2(lx0 + 28)} ${f2(LENS.top + 30)} ${f2(lx0 + 66)} ${f2(LENS.top + 26)}`} fill="none" stroke={C.white} strokeWidth={7} strokeLinecap="round" opacity={0.9} />
            {/* the factor actually used */}
            <g>
              <rect x={f2(lx1 - 290)} y={f2(LENS.top + 16)} width={272} height={58} rx={29} fill={C.saffronLight} stroke={C.ink} strokeWidth={3} />
              <Txt x={lx1 - 154} y={LENS.top + 57} size={36} anchor="middle" font={F.mono} weight={700}>
                {`height ×${zShown}`}
              </Txt>
            </g>
          </g>
        )}

        {/* the 0 -> bump time */}
        {t.dim > 0 && (
          <g opacity={clamp01(t.dim * 2.5)}>
            {(() => {
              // a dimension line from the wall's echo (t = 0) to the bump's peak, with end ticks and a guide down to
              // the peak; it measures exactly the interval it labels
              const u = E.inOut(clamp01(t.dim));
              const xa = peakX;
              const xb = lerp(xa, bumpX, u);
              const guide = clamp01((t.dim - 0.7) * 4);
              const lx = Math.min((xa + bumpX) / 2, lx0 - 110);
              return (
                <>
                  {guide > 0 && <path d={`M ${f2(bumpX)} ${f2(dimY)} L ${f2(bumpX)} ${f2(lerp(dimY, bumpY - 8, guide))}`} stroke={C.saffronDeep} strokeWidth={4} strokeDasharray="3 9" strokeLinecap="round" />}
                  <path d={`M ${f2(xa)} ${f2(dimY)} L ${f2(xb)} ${f2(dimY)}`} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
                  <path d={`M ${f2(xa)} ${f2(dimY)} L ${f2(xb)} ${f2(dimY)}`} stroke={C.saffron} strokeWidth={5} strokeLinecap="round" />
                  <path d={`M ${f2(xa)} ${f2(dimY - 16)} L ${f2(xa)} ${f2(dimY + 16)}`} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
                  {u > 0.98 && <path d={`M ${f2(xb)} ${f2(dimY - 16)} L ${f2(xb)} ${f2(dimY + 16)}`} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />}
                  {/* the value sits under the line, in the clear space between the spike and the lens (above the
                      line it crowded the spike and its label) */}
                  <g opacity={clamp01((t.dim - 0.55) * 3)}>
                    <rect x={f2(lx - 100)} y={f2(dimY + 22)} width={200} height={62} rx={31} fill={C.white} stroke={C.saffronDeep} strokeWidth={3} />
                    <Txt x={lx} y={dimY + 68} size={44} anchor="middle" font={F.mono} weight={700}>
                      {`${d1(ECHO.bumpNs)} ns`}
                    </Txt>
                  </g>
                </>
              );
            })()}
          </g>
        )}

        {/* marker ring round the bump */}
        {ringT > 0 && <Ring cx={ringC.x} cy={ringC.y} rx={ringR.x} ry={ringR.y} t={ringT} />}

        {/* callout: hundreds of times weaker */}
        {t.ratio > 0 && (
          <g opacity={clamp01(t.ratio * 2)}>
            {(() => {
              const u = E.out(clamp01(t.ratio * 1.4));
              const ax0 = RIGHT - 14;
              const ay0 = 470;
              return <path d={`M ${f2(ax0)} ${ay0} L ${f2(lerp(ax0, leadA.x, u))} ${f2(lerp(ay0, leadA.y, u))}`} stroke={C.coralDeep} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 10" />;
            })()}
            <g transform={`translate(${f2((1 - E.out(clamp01(t.ratio))) * 14)} 0)`}>
              <Txt x={RIGHT} y={460} size={46}>
                hundreds of times
              </Txt>
              <Txt x={RIGHT} y={514} size={46}>
                weaker
              </Txt>
              <Txt x={RIGHT + 166} y={514} size={32} weight={700} color={C.inkMuted}>
                (this capture)
              </Txt>
            </g>
          </g>
        )}

        {/* callout: extra path */}
        {t.extra > 0 && (
          <g opacity={clamp01(t.extra * 2)} transform={`translate(${f2((1 - E.out(clamp01(t.extra))) * 14)} 0)`}>
            <rect x={RIGHT - 22} y={600} width={540} height={150} rx={22} fill={C.saffronLight} stroke={C.ink} strokeWidth={OUTLINE} />
            <Txt x={RIGHT + 6} y={664} size={50}>
              {`≈ ${d1(ECHO.extraM)} m extra path`}
            </Txt>
            <Txt x={RIGHT + 6} y={720} size={34} font={F.mono} weight={500} color={C.inkSoft}>
              {`${d1(ECHO.bumpNs)} ns × 30 cm per ns`}
            </Txt>
          </g>
        )}

        {/* source chip */}
        <g opacity={clamp01(t.source * 2)} transform={`translate(0 ${f2((1 - E.out(clamp01(t.source))) * 12)})`}>
          <rect x={150} y={870} width={1060} height={56} rx={28} fill={C.ink} />
          <Txt x={178} y={909} size={30} color={C.paper}>
            authors' released raw data · Somasundaram et al., Nature 2026
          </Txt>
        </g>
      </g>
    </svg>
  );
};

/** A hand-drawn marker loop (draws on with t, overshooting its start like a real pen). */
const Ring: React.FC<{cx: number; cy: number; rx: number; ry: number; t: number}> = ({cx, cy, rx, ry, t}) => {
  const n = 48;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const a = -2.3 + (i / n) * Math.PI * 2 * 1.08;
    const k = 1 + 0.04 * Math.sin(i * 1.3) - 0.05 * (i / n);
    pts.push(`${f2(cx + Math.cos(a) * rx * k)},${f2(cy + Math.sin(a) * ry * k)}`);
  }
  return (
    <g>
      <polyline points={pts.join(' ')} fill="none" stroke={C.ink} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, t)} />
      <polyline points={pts.join(' ')} fill="none" stroke={C.coral} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, t)} />
    </g>
  );
};

/** The taped card the board is printed on (screen space), on a full paper field. */
export const EchoCard: React.FC<{children?: React.ReactNode}> = ({children}) => {
  const w = CARD.x1 - CARD.x0;
  const h = CARD.y1 - CARD.y0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, background: C.paper}}>
      <div style={{position: 'absolute', left: CARD.x0, top: CARD.y0, width: w, height: h}}>
        <div style={{position: 'absolute', inset: 0, background: C.white, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 12, boxShadow: `12px 14px 0 ${C.shadow}`}} />
        <div style={{position: 'absolute', left: -34, top: -10, width: 130, height: 34, background: 'rgba(255,233,168,0.92)', border: '2px solid rgba(22,42,50,0.25)', transform: 'rotate(-9deg)'}} />
        <div style={{position: 'absolute', right: -34, top: -10, width: 130, height: 34, background: 'rgba(255,233,168,0.92)', border: '2px solid rgba(22,42,50,0.25)', transform: 'rotate(8deg)'}} />
      </div>
      {children}
    </div>
  );
};
