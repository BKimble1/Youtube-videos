import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {E} from '../../lib/motion';
import {LAYOUT as OLAYOUT} from '../../lib/optics';
import raw from '../../data/evidence/ams_wall_vs_echo.json';
import {EVIDENCE} from '../v2k/EvidenceCard';
import {Label} from '../v2k/Labels';

/**
 * V4.2 / V4.3 · the real waveform (record R10, claim C12), the plot that sits inside the kit EvidenceCard: the authors'
 * released RAW histogram of the centre zone of the ams 3×3-zone sensor (data/evidence/ams_wall_vs_echo.json, iter_22),
 * one point per 88 ps bin, straight segments between them, no smoothing, no invented points, the whole released time
 * range on a LINEAR count axis from 0. Adapted from S3_EchoBoard (v1 S3.3):
 *
 *  - the trace is complete on the first frame (no blank-axis build);
 *  - a bar magnifier slides along the tail; inside it the SAME data are drawn with the height multiplied by the factor on
 *    its "zoom ×N" tab (the time axis is not stretched, zero stays on the baseline); N animates 1 → ZOOM (250);
 *  - labels at the v2 sizes: "wall echo" (48), "hundreds of times weaker (this capture)" (48), axis text 34;
 *  - `push` (V4.3): the plot scales about the bump so the bump's ring centre lands on PUSH_TARGET (the V4 → V5 graphic
 *    match point), clipped to the card's content area; the card, headline, icon and source stay put.
 *
 * Every number is computed here from the data and cross-checked against the file's zone_measures (module load throws if
 * they disagree). Pure function of its props.
 */

type EchoData = {
  counts: number[];
  time_ns_after_wall_peak: number[];
  wall_peak_bin: number;
  zone_measures: {
    wall_peak_bin: number;
    late_return_peak_bin: number;
    late_return_time_after_wall_ns: number;
    late_return_extra_path_cm: number;
    wall_peak_to_late_excess_ratio: number;
  };
};
const D = raw as unknown as EchoData;
const N = D.counts.length;
const T = D.time_ns_after_wall_peak;
const CNT = D.counts;

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
const FLOOR_BIN = argmin(CNT, PEAK_BIN + 1, PEAK_BIN + 50);
const BUMP_BIN = argmax(CNT, FLOOR_BIN, N);
const HUMP_END = (() => {
  const lim = CNT[FLOOR_BIN] + 0.25 * (CNT[BUMP_BIN] - CNT[FLOOR_BIN]);
  for (let i = BUMP_BIN; i < N; i++) if (CNT[i] < lim) return i;
  return N - 1;
})();

/** Echo numbers, computed from the plotted counts and checked against the file. */
export const ECHO = (() => {
  const peak = CNT[PEAK_BIN];
  const bump = CNT[BUMP_BIN];
  const floor = CNT[FLOOR_BIN];
  const bumpNs = T[BUMP_BIN] - T[PEAK_BIN];
  const extraM = bumpNs * OLAYOUT.c_m_per_ns;
  const ratio = peak / (bump - floor);
  const ZM = D.zone_measures;
  const check = (ok: boolean, what: string) => {
    if (!ok) throw new Error(`V4_EchoBoard: ${what} disagrees with zone_measures in ams_wall_vs_echo.json`);
  };
  check(PEAK_BIN === D.wall_peak_bin && PEAK_BIN === ZM.wall_peak_bin, 'wall peak bin');
  check(BUMP_BIN === ZM.late_return_peak_bin, 'late bump bin');
  check(Math.abs(bumpNs - ZM.late_return_time_after_wall_ns) < 1e-6, 'bump time');
  check(Math.abs(extraM * 100 - ZM.late_return_extra_path_cm) < 0.5, 'extra path');
  check(Math.abs(ratio - ZM.wall_peak_to_late_excess_ratio) < 0.01, 'peak-to-bump ratio');
  check(ratio >= 100 && ratio < 1000, '"hundreds of times" (ratio not in the hundreds)');
  return {peak, bump, floor, bumpNs, extraM, ratio};
})();

/** One decimal, e.g. "3.7". */
export const d1 = (v: number) => (Math.round(v * 10) / 10).toFixed(1);
if (d1(ECHO.bumpNs) !== '3.7' || d1(ECHO.extraM) !== '1.1') throw new Error(`V4_EchoBoard: labels expect ≈ 3.7 ns / ≈ 1.1 m (got ${d1(ECHO.bumpNs)} / ${d1(ECHO.extraM)})`);

/* ------------------------------------------------------------------ geometry (screen px at push 0) */

export const PLOT = {x0: 300, x1: 1560, y0: 270, base: 760, t0: -2.7, t1: 8.6, yMax: 1.4e6};
const plotH = PLOT.base - PLOT.y0;
export const X = (ns: number) => PLOT.x0 + ((ns - PLOT.t0) / (PLOT.t1 - PLOT.t0)) * (PLOT.x1 - PLOT.x0);
export const Y = (c: number, z = 1) => PLOT.base - ((c * z) / PLOT.yMax) * plotH;
if (T[0] < PLOT.t0 || T[N - 1] > PLOT.t1) throw new Error('V4_EchoBoard: the time axis must show every released bin');

/** The zoom factor: the bump's peak at about 55 % of the plot height, rounded to a multiple of 50. */
export const ZOOM = Math.max(50, Math.round((0.55 * PLOT.yMax) / ECHO.bump / 50) * 50);
if (ZOOM !== 250) throw new Error(`V4_EchoBoard: the zoom factor is ${ZOOM}, the shot plan's tab says ×250`);

/** Magnifier: fixed width in ns; slides from beside the spike over the tail. */
export const LENS = {w: 5.6, from: 0.4, to: 2.3, top: PLOT.base - 0.62 * plotH, r: 18};
if (Y(ECHO.bump, ZOOM) < LENS.top + 30) throw new Error('V4_EchoBoard: the zoomed bump reaches the lens top');

/** The bump in the zoomed lens: peak (bin), and the hump's middle (for the ring). */
export const BUMP = {x: X(T[BUMP_BIN]), y: Y(CNT[BUMP_BIN], ZOOM), midX: (X(T[FLOOR_BIN]) + X(T[HUMP_END])) / 2};
export const SPIKE = {x: X(0), y: Y(ECHO.peak)};

/** V4.3 push: the plot scales by PUSH_K about the ring anchor so it lands on PUSH_TARGET (the V5 match point); the bump's
 *  peak sits RING_PEAK_DY above the ring centre, so the ring (r 90) circles the top of the hump. */
export const PUSH_TARGET = {x: 960, y: 520};
export const RING_R = 90;
export const PUSH_K = 1.25;
const RING_PEAK_DY = 42;
export const ANCHOR = {x: BUMP.midX, y: BUMP.y + RING_PEAK_DY / PUSH_K};

/** Screen position of a plot point at push progress e (0..1, already eased). */
export const pushed = (p: {x: number; y: number}, e: number) => {
  const k = 1 + (PUSH_K - 1) * e;
  const ax = ANCHOR.x + (PUSH_TARGET.x - ANCHOR.x) * e;
  const ay = ANCHOR.y + (PUSH_TARGET.y - ANCHOR.y) * e;
  return {x: ax + k * (p.x - ANCHOR.x), y: ay + k * (p.y - ANCHOR.y)};
};
const pushXf = (e: number) => {
  const k = 1 + (PUSH_K - 1) * e;
  const ax = ANCHOR.x + (PUSH_TARGET.x - ANCHOR.x) * e;
  const ay = ANCHOR.y + (PUSH_TARGET.y - ANCHOR.y) * e;
  return `translate(${f2(ax - k * ANCHOR.x)} ${f2(ay - k * ANCHOR.y)}) scale(${f2(k * 10000) / 10000})`;
};
/** The plot is clipped to the card's content area while it is pushed. */
const CLIP = EVIDENCE.content;
{
  // after the push the whole spike-to-bump interval and the lens are on screen
  const sp = pushed(SPIKE, 1);
  const bp = pushed({x: BUMP.x, y: BUMP.y}, 1);
  if (sp.x < CLIP.x0 + 60 || sp.y < CLIP.y0 + 40) throw new Error(`V4_EchoBoard: the pushed spike leaves the content area (${sp.x.toFixed(0)}, ${sp.y.toFixed(0)})`);
  if (Math.hypot(bp.x - PUSH_TARGET.x, bp.y - PUSH_TARGET.y) > RING_R - 24) throw new Error('V4_EchoBoard: the bump peak is not well inside the ring');
}

/** The ratio callout (push 0): above the lens, right of the spike's label. */
const RATIO_AT = {x: 1090, y: 334, dy: 58};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const f2 = (n: number) => Math.round(n * 100) / 100;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const pop = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : E.back(t));

export type EchoPlotT = {
  /** 0..1 "wall echo" label and the peak dot (fade in) */
  spikeLabel: number;
  /** 0..1 the words "wall echo" alone (default spikeLabel): V4.3 fades them when the dimension line draws (V2-R1-23) */
  spikeText?: number;
  /** 0..1 phase of a one-shot pulse ring on the spike's peak */
  spikePulse?: number;
  /** 0..1 magnifier appears; lensSlide 0..1 from beside the spike to over the tail */
  lens: number;
  lensSlide: number;
  /** 0..1 the height stretch inside the lens (factor = ZOOM^zoom, shown on the tab) */
  zoom: number;
  /** 0..1 "hundreds of times weaker (this capture)" */
  ratio: number;
  /** 0..1 the axis titles and the count labels (they fade while the plot is pushed: they would leave the card) */
  axisTitle: number;
  /** 0..1 eased push progress */
  push: number;
};

const Txt: React.FC<{x: number; y: number; size?: number; children: React.ReactNode; color?: string; anchor?: 'start' | 'middle' | 'end'; weight?: number; font?: string}> = ({x, y, size = 34, children, color = C.inkSoft, anchor = 'start', weight = 600, font = F.mono}) => (
  <text x={f2(x)} y={f2(y)} fontFamily={font} fontWeight={weight} fontSize={size} fill={color} textAnchor={anchor}>
    {children}
  </text>
);

/** Polyline of the data (all bins, or those from `from`), height × z. */
const curveD = (z = 1, from = -Infinity, upTo = Infinity) => {
  const pts: string[] = [];
  for (let i = 0; i < N; i++) {
    const t = T[i];
    if (t < from || t > upTo) continue;
    pts.push(`${f2(X(t))} ${f2(Y(CNT[i], z))}`);
  }
  return pts.length > 1 ? 'M ' + pts.join(' L ') : '';
};
const CURVE_ALL = curveD();

export const EchoPlot: React.FC<{t: EchoPlotT}> = ({t}) => {
  const zf = Math.pow(ZOOM, clamp01(t.zoom));
  const zShown = Math.round(zf);
  const lensT0 = lerp(LENS.from, LENS.to, E.inOut(clamp01(t.lensSlide)));
  const lx0 = X(lensT0);
  const lx1 = X(lensT0 + LENS.w);
  const lensIn = clamp01(t.lens);
  const lensK = pop(lensIn);
  const lensH = PLOT.base - LENS.top;
  const pulse = clamp01(t.spikePulse ?? 0);
  const yTicks = [0, 5e5, 1e6];
  const xTicks = [-2, 0, 2, 4, 6, 8];
  // the ratio callout's leader touches the hump's right flank (zoomed)
  const leadA = {x: X(T[BUMP_BIN + 5]) + 10, y: Y(CNT[BUMP_BIN + 5], zf)};
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id="v4content">
          <rect x={CLIP.x0} y={CLIP.y0} width={CLIP.x1 - CLIP.x0} height={CLIP.y1 - CLIP.y0} />
        </clipPath>
        <clipPath id="v4lens">
          <rect x={f2(lx0)} y={f2(LENS.top)} width={f2(lx1 - lx0)} height={f2(lensH)} rx={LENS.r} />
        </clipPath>
        <clipPath id="v4plot">
          <rect x={PLOT.x0} y={PLOT.y0 - 60} width={PLOT.x1 - PLOT.x0 + 4} height={plotH + 62} />
        </clipPath>
      </defs>
      <g clipPath="url(#v4content)">
        <g transform={pushXf(clamp01(t.push))}>
          {/* axes */}
          <path d={`M ${PLOT.x0} ${PLOT.y0 - 24} L ${PLOT.x0} ${PLOT.base} L ${PLOT.x1 + 14} ${PLOT.base}`} fill="none" stroke={C.ink} strokeWidth={OUTLINE} strokeLinecap="round" strokeLinejoin="round" />
          {yTicks.map((v) => (
            <g key={v}>
              <path d={`M ${PLOT.x0 - 12} ${f2(Y(v))} L ${PLOT.x0} ${f2(Y(v))}`} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
              {v > 0 && <path d={`M ${PLOT.x0 + 2} ${f2(Y(v))} L ${PLOT.x1} ${f2(Y(v))}`} stroke={C.paperLine} strokeWidth={2} strokeDasharray="3 10" strokeLinecap="round" />}
              <g opacity={f2(clamp01(t.axisTitle))}>
                <Txt x={PLOT.x0 - 18} y={Y(v) + 12} anchor="end">
                  {v === 0 ? '0' : `${(v / 1e6).toFixed(1)} M`}
                </Txt>
              </g>
            </g>
          ))}
          <text x={0} y={0} transform={`translate(${PLOT.x0 - 140} ${f2((PLOT.y0 + PLOT.base) / 2)}) rotate(-90)`} textAnchor="middle" fontFamily={F.body} fontWeight={700} fontSize={34} fill={C.inkSoft} opacity={f2(clamp01(t.axisTitle))}>
            counts (linear)
          </text>
          {xTicks.map((v) => (
            <g key={v}>
              <path d={`M ${f2(X(v))} ${PLOT.base} L ${f2(X(v))} ${PLOT.base + 12}`} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
              <Txt x={X(v)} y={PLOT.base + 48} anchor="middle">
                {v < 0 ? `−${-v}` : `${v}`}
              </Txt>
            </g>
          ))}
          <g opacity={f2(clamp01(t.axisTitle))}>
            <Txt x={(PLOT.x0 + PLOT.x1) / 2} y={PLOT.base + 92} anchor="middle" font={F.body} weight={700}>
              time after the wall echo (ns)
            </Txt>
          </g>

          {/* the data, ×1, complete from the first frame */}
          <g clipPath="url(#v4plot)">
            <path d={CURVE_ALL} fill="none" stroke={C.tealDeep} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
          </g>
          {pulse > 0 && pulse < 1 && <circle cx={f2(SPIKE.x)} cy={f2(SPIKE.y)} r={f2(12 + 40 * E.out(pulse))} fill="none" stroke={C.tealDeep} strokeWidth={f2(5 * (1 - pulse) + 1)} opacity={f2(0.9 * (1 - pulse))} />}
          {t.spikeLabel > 0 && (
            <g opacity={f2(clamp01(t.spikeLabel))}>
              <circle cx={f2(SPIKE.x)} cy={f2(SPIKE.y)} r={f2(9 * (1 + 0.5 * Math.sin(Math.PI * pulse)))} fill={C.teal} stroke={C.ink} strokeWidth={3} />
              {(t.spikeText ?? 1) > 0 && (
                <Label asGroup x={SPIKE.x + 26} y={SPIKE.y + 16} size={48} opacity={clamp01((t.spikeText ?? t.spikeLabel) / Math.max(1e-6, t.spikeLabel))}>
                  wall echo
                </Label>
              )}
            </g>
          )}

          {/* the magnifier: same data, height × factor, time axis unchanged */}
          {lensIn > 0 && (
            <g opacity={f2(clamp01(lensIn * 3))} transform={`translate(${f2((lx0 + lx1) / 2)} ${PLOT.base}) scale(${f2(lensK)}) translate(${f2(-(lx0 + lx1) / 2)} ${-PLOT.base})`}>
              {/* the handle, level, from the right side (clear of the callouts above the lens) */}
              <path d={`M ${f2(lx1 - 6)} ${f2(LENS.top + lensH * 0.55)} L ${f2(lx1 + 58)} ${f2(LENS.top + lensH * 0.55)}`} stroke={C.ink} strokeWidth={30} strokeLinecap="round" />
              <path d={`M ${f2(lx1 - 6)} ${f2(LENS.top + lensH * 0.55)} L ${f2(lx1 + 58)} ${f2(LENS.top + lensH * 0.55)}`} stroke={C.woodDeep} strokeWidth={20} strokeLinecap="round" />
              <rect x={f2(lx0)} y={f2(LENS.top)} width={f2(lx1 - lx0)} height={f2(lensH)} rx={LENS.r} fill="#EEF8F6" />
              <g clipPath="url(#v4lens)">
                <path d={curveD(zf, lensT0 - 0.2, lensT0 + LENS.w + 0.2)} fill="none" stroke={C.tealDeep} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
                <path d={`M ${f2(lx0)} ${PLOT.base} L ${f2(lx1)} ${PLOT.base}`} stroke={C.ink} strokeWidth={OUTLINE} />
              </g>
              <rect x={f2(lx0)} y={f2(LENS.top)} width={f2(lx1 - lx0)} height={f2(lensH)} rx={LENS.r} fill="none" stroke={C.ink} strokeWidth={OUTLINE + 6} />
              <rect x={f2(lx0)} y={f2(LENS.top)} width={f2(lx1 - lx0)} height={f2(lensH)} rx={LENS.r} fill="none" stroke={C.saffron} strokeWidth={6} />
              <path d={`M ${f2(lx0 + 26)} ${f2(LENS.top + 70)} Q ${f2(lx0 + 28)} ${f2(LENS.top + 30)} ${f2(lx0 + 66)} ${f2(LENS.top + 26)}`} fill="none" stroke={C.white} strokeWidth={7} strokeLinecap="round" opacity={0.9} />
              {/* the factor actually used: a tab sitting on the lens's top edge, at its right end */}
              <rect x={f2(lx1 - 268)} y={f2(LENS.top - 29)} width={240} height={58} rx={29} fill={C.saffronLight} stroke={C.ink} strokeWidth={3} />
              <Txt x={lx1 - 148} y={LENS.top + 12} size={34} anchor="middle" color={C.ink} weight={700}>
                {`zoom ×${zShown}`}
              </Txt>
            </g>
          )}

          {/* callout: hundreds of times weaker (this capture) */}
          {t.ratio > 0 && (
            <g opacity={f2(clamp01(t.ratio))}>
              <path d={`M ${RATIO_AT.x + 40} ${RATIO_AT.y + RATIO_AT.dy + 22} L ${f2(leadA.x + 12)} ${f2(leadA.y - 6)}`} stroke={C.white} strokeWidth={10} strokeLinecap="round" />
              <path d={`M ${RATIO_AT.x + 40} ${RATIO_AT.y + RATIO_AT.dy + 22} L ${f2(leadA.x + 12)} ${f2(leadA.y - 6)}`} stroke={C.coralDeep} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 10" />
              <Label asGroup x={RATIO_AT.x} y={RATIO_AT.y} size={48}>
                hundreds of times weaker
              </Label>
              <Label asGroup x={RATIO_AT.x} y={RATIO_AT.y + RATIO_AT.dy} size={48}>
                (this capture)
              </Label>
            </g>
          )}
        </g>
      </g>
    </svg>
  );
};
