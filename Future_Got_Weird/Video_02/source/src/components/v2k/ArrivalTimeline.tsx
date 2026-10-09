import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {E} from '../../lib/motion';
import {ChipG, Label} from './Labels';
import {clamp01, f2, lerp} from './util';

/**
 * v2 kit · ArrivalTimeline: THE shared full-frame arrival chart (V2.2, V3.4, V4.1, V8.2). Built once, with fixed
 * colours and positions so the viewer recognises it each time: a time axis across the frame, a tall teal spike (the
 * wall echo) at a fixed time and a small saffron bump (the hidden echo) at a fixed later time. Illustrative, always
 * "not to scale". Drawn in the S3_TimingCard style: a cream card with a 4 px ink outline and a hard shadow on paper,
 * flat fills, ink outlines.
 *
 * Coordinates: the chart is drawn in a 1920×1080 DESIGN frame (TL below, all screen px at layoutScale 1). `x`, `y`,
 * `layoutScale` place that design frame on screen: screen = (x + layoutScale·dx, y + layoutScale·dy). Defaults
 * (0, 0, 1) = full frame. Use `fitTimeline()` to shrink the whole chart into a rectangle (the V2.2 → V2.3 sensor-display
 * match) and `timelinePoint()` to find any design point on screen (e.g. the bump's ring for the V4.3 match).
 *
 * All animation props are 0..1 progress (the scene drives them from its cue constants); pure function of its props.
 */

/** Fixed geometry (design px). Scenes match to these. */
export const TL_GEOM = {
  /** the cream card (when bg) */
  card: {x0: 80, y0: 36, x1: 1840, y1: 944, r: 22},
  /** time axis: baseline y, from x0 to x1 (arrowhead at x1) */
  axis: {x0: 220, x1: 1700, y: 700},
  /** the wall echo: a tall narrow teal spike centred at x, peak height h above the baseline, width sigma */
  spike: {x: 520, h: 400, sigma: 20},
  /** the hidden echo: a small saffron bump centred at x (later), peak height h (× hiddenScale), width sigma */
  bump: {x: 1240, h: 92, sigma: 46},
  /** the delay bracket: horizontal line at y from spike.x to bump.x; its label (64 px) above it */
  bracket: {y: 540, labelBaseline: 504},
  /** ring round the bump (centre, radii); a same-size ring elsewhere matches it (V4.3 → V5.1) */
  ring: {cx: 1240, cy: 646, rx: 136, ry: 80},
  /** the single tick (V3.4) at the hidden-echo time: width w, height h above the baseline */
  tick: {x: 1240, w: 14, h: 70},
  /** route strip: icon centres along y */
  route: {y: 150, xs: [330, 650, 970, 1290, 1610] as const},
  /** labels: "wall echo" / "his echo" baseline (under the marks), "time →" baseline (right end) */
  labels: {baseline: 774, size: 48},
  /** route labels: "1 bounce" (start-anchored right of the spike's upper half), "3 bounces" (right of the ring) */
  routeLabels: {spike: {x: 574, y: 380}, bump: {x: 1394, y: 640}, size: 64},
  /** "not to scale" chip: right-anchored, bottom-right of the card */
  notToScale: {x: 1780, y: 868},
} as const;

export const SPIKE_X = TL_GEOM.spike.x;
export const BUMP_X = TL_GEOM.bump.x;
export const BASELINE_Y = TL_GEOM.axis.y;

export type TimelinePlacement = {x?: number; y?: number; layoutScale?: number};

/** Screen position of a design-frame point for a placement. */
export const timelinePoint = (p: {x: number; y: number}, place: TimelinePlacement = {}) => {
  const s = place.layoutScale ?? 1;
  return {x: (place.x ?? 0) + p.x * s, y: (place.y ?? 0) + p.y * s};
};

/**
 * Placement that fits the design frame (or a design-frame sub-rectangle, default the card) into a screen rectangle of
 * width w with its top-left at (x, y). E.g. fitTimeline({x: 812, y: 410, w: 240}) puts the card in a 240 px wide display.
 */
export const fitTimeline = (target: {x: number; y: number; w: number}, src: {x0: number; y0: number; x1: number} = TL_GEOM.card): Required<TimelinePlacement> => {
  const s = target.w / (src.x1 - src.x0);
  return {layoutScale: s, x: target.x - src.x0 * s, y: target.y - src.y0 * s};
};

export type ArrivalTimelineProps = TimelinePlacement & {
  /** 0..1 axis draws on (left to right), then "time →" */
  axis?: number;
  /** 0..1 the wall echo lands: rises from the baseline with a short overshoot and settle */
  wall?: number;
  /** 0..1 the hidden echo lands (same motion, smaller) */
  hidden?: number;
  /** bump height multiplier (default 1; V8.2 'weak laser → fainter echo' takes it to ~0.4) */
  hiddenScale?: number;
  /** 0..1 the delay bracket snaps between spike and bump, then its label cuts in */
  bracket?: number;
  /** bracket label (64 px), default "a few nanoseconds" */
  bracketLabel?: string;
  /** 0..1 "wall echo" / "his echo" labels (48 px, under the marks); a pair times them separately */
  labels?: number | [number, number];
  wallLabel?: string;
  hiddenLabel?: string;
  /** 0..1 a marker ring drawn round the bump */
  ring?: number;
  /** 0..1 the "not to scale" chip (34 px); custom text e.g. "not to scale · far weaker" */
  notToScale?: number;
  notToScaleText?: string;
  /** 0..1 the five-icon route strip above the axis (sensor, wall, him, wall, sensor) */
  routeStrip?: number;
  /** 0..1 a pulse dot travelling the strip (four legs); it shrinks and fades at each bounce */
  routePulse?: number;
  /** optional route labels placed by the spike and the bump (64 px), e.g. ["1 bounce", "3 bounces"] */
  routeLabels?: [string, string];
  /** 0..1 each route label (default: both 1 when routeLabels are given) */
  routeLabelsT?: number | [number, number];
  /** 0..1 a single small ink tick at the hidden-echo time (V3.4 'one blip at one time'; use instead of the bump) */
  tick?: number;
  /** true (default) = full-frame paper field + the cream card; 'card' = the card only (use while shrinking into a
   *  display, so no paper rectangle shows round it); false = transparent, marks only */
  bg?: boolean | 'card';
  /** 0..1 whole-chart opacity (default 1) */
  opacity?: number;
};

/** A narrow gaussian echo shape standing on the baseline (closed path) and its top curve (open path). */
const echoPaths = (cx: number, h: number, sigma: number, base: number) => {
  const n = 40;
  const span = 4 * sigma;
  const top: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = cx - span + (2 * span * i) / n;
    const u = (x - cx) / sigma;
    top.push(`${f2(x)} ${f2(base - h * Math.exp(-0.5 * u * u))}`);
  }
  return {fill: `M ${top.join(' L ')} Z`, line: `M ${top.join(' L ')}`};
};

/** Landing motion: 0..1 → height factor with a ~7 % overshoot and settle (E.back). */
const land = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : E.back(t));

export const ArrivalTimeline: React.FC<ArrivalTimelineProps> = ({
  x = 0,
  y = 0,
  layoutScale = 1,
  axis = 1,
  wall = 0,
  hidden = 0,
  hiddenScale = 1,
  bracket = 0,
  bracketLabel = 'a few nanoseconds',
  labels = 0,
  wallLabel = 'wall echo',
  hiddenLabel = 'his echo',
  ring = 0,
  notToScale = 0,
  notToScaleText = 'not to scale',
  routeStrip = 0,
  routePulse = 0,
  routeLabels,
  routeLabelsT,
  tick = 0,
  bg = true,
  opacity = 1,
}) => {
  const G = TL_GEOM;
  const A = G.axis;
  const ax = E.out(clamp01(axis));
  const [lw, lh] = typeof labels === 'number' ? [labels, labels] : labels;
  const [rl1, rl2] = routeLabelsT === undefined ? [1, 1] : typeof routeLabelsT === 'number' ? [routeLabelsT, routeLabelsT] : routeLabelsT;
  const wallH = G.spike.h * land(clamp01(wall));
  const bumpH = G.bump.h * Math.max(0, hiddenScale) * land(clamp01(hidden));
  const spike = echoPaths(G.spike.x, wallH, G.spike.sigma, A.y);
  const bump = echoPaths(G.bump.x, bumpH, G.bump.sigma, A.y);
  const br = clamp01(bracket);
  const op = clamp01(opacity);
  if (op <= 0) return null;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} opacity={op}>
      <g transform={`translate(${f2(x)} ${f2(y)}) scale(${layoutScale})`}>
        {bg && (
          <g>
            {bg === true && <rect x={0} y={0} width={1920} height={1080} fill={C.paper} />}
            <rect x={G.card.x0 + 10} y={G.card.y0 + 14} width={G.card.x1 - G.card.x0} height={G.card.y1 - G.card.y0} rx={G.card.r} fill={C.shadow} />
            <rect x={G.card.x0} y={G.card.y0} width={G.card.x1 - G.card.x0} height={G.card.y1 - G.card.y0} rx={G.card.r} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
          </g>
        )}

        {/* route strip (above the axis) */}
        {routeStrip > 0 && <RouteStrip t={clamp01(routeStrip)} pulse={routePulse} />}

        {/* the echoes */}
        {wallH > 0.5 && (
          <g>
            <path d={spike.fill} fill={C.teal} />
            <path d={spike.line} fill="none" stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" strokeLinecap="round" />
          </g>
        )}
        {bumpH > 0.5 && (
          <g>
            <path d={bump.fill} fill={C.saffron} />
            <path d={bump.line} fill="none" stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" strokeLinecap="round" />
          </g>
        )}

        {/* the single tick (V3.4): drops onto the axis at the hidden-echo time, small squash on landing */}
        {tick > 0 && <Tick t={clamp01(tick)} />}

        {/* axis (over the echo fills, so the baseline stays one clean line) */}
        {axis > 0 && (
          <g>
            <path d={`M ${A.x0} ${A.y} L ${f2(lerp(A.x0, A.x1, ax))} ${A.y}`} stroke={C.ink} strokeWidth={OUTLINE + 1} strokeLinecap="round" fill="none" />
            <g opacity={f2(clamp01((axis - 0.8) * 5))}>
              <path d={`M ${A.x1 - 22} ${A.y - 14} L ${A.x1 + 2} ${A.y} L ${A.x1 - 22} ${A.y + 14}`} stroke={C.ink} strokeWidth={OUTLINE + 1} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <text x={A.x1} y={G.labels.baseline} textAnchor="end" fontFamily={F.body} fontWeight={800} fontSize={G.labels.size} fill={C.inkSoft}>
                time →
              </text>
            </g>
          </g>
        )}

        {/* labels under the marks */}
        {lw > 0 && (
          <Label asGroup x={G.spike.x} y={G.labels.baseline} size={G.labels.size} anchor="middle" opacity={lw} halo={false}>
            {wallLabel}
          </Label>
        )}
        {lh > 0 && (
          <Label asGroup x={G.bump.x} y={G.labels.baseline} size={G.labels.size} anchor="middle" opacity={lh} halo={false}>
            {hiddenLabel}
          </Label>
        )}

        {/* the delay bracket and its label */}
        {br > 0 && (
          <g>
            {(() => {
              const by = G.bracket.y;
              const xa = G.spike.x;
              const xb = lerp(xa, G.bump.x, E.out(clamp01(br / 0.6)));
              const ends = br >= 0.6;
              return (
                <g>
                  <path d={`M ${xa} ${by - 18} L ${xa} ${by + 18}`} stroke={C.ink} strokeWidth={OUTLINE + 1} strokeLinecap="round" />
                  <path d={`M ${xa} ${by} L ${f2(xb)} ${by}`} stroke={C.ink} strokeWidth={OUTLINE + 1} strokeLinecap="round" />
                  {ends && <path d={`M ${G.bump.x} ${by - 18} L ${G.bump.x} ${by + 18}`} stroke={C.ink} strokeWidth={OUTLINE + 1} strokeLinecap="round" />}
                  {ends && (
                    <Label asGroup x={(G.spike.x + G.bump.x) / 2} y={G.bracket.labelBaseline} size={64} anchor="middle" font="display" opacity={clamp01((br - 0.6) * 4)} halo={false}>
                      {bracketLabel}
                    </Label>
                  )}
                </g>
              );
            })()}
          </g>
        )}

        {/* ring round the bump */}
        {ring > 0 && <MarkerRing cx={G.ring.cx} cy={G.ring.cy} rx={G.ring.rx} ry={G.ring.ry} t={clamp01(ring)} />}

        {/* route labels by the spike and the bump */}
        {routeLabels && rl1 > 0 && (
          <Label asGroup x={G.routeLabels.spike.x} y={G.routeLabels.spike.y} size={G.routeLabels.size} opacity={rl1} halo={false}>
            {routeLabels[0]}
          </Label>
        )}
        {routeLabels && rl2 > 0 && (
          <Label asGroup x={G.routeLabels.bump.x} y={G.routeLabels.bump.y} size={G.routeLabels.size} opacity={rl2} halo={false}>
            {routeLabels[1]}
          </Label>
        )}

        {/* not to scale */}
        {notToScale > 0 && <ChipG text={notToScaleText} x={G.notToScale.x} y={G.notToScale.y} anchor="end" size={34} opacity={notToScale} />}
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ parts */

const Tick: React.FC<{t: number}> = ({t}) => {
  const G = TL_GEOM;
  const fall = clamp01(t / 0.7);
  const dy = -150 * (1 - fall * fall);
  const sq = t > 0.7 ? Math.sin(((t - 0.7) / 0.3) * Math.PI) * 0.18 : 0;
  const w = G.tick.w * (1 + sq);
  const h = G.tick.h * (1 - sq);
  return <rect x={f2(G.tick.x - w / 2)} y={f2(G.axis.y - h + dy)} width={f2(w)} height={f2(h)} rx={f2(w / 2)} fill={C.ink} opacity={f2(clamp01(t * 4))} />;
};

/** A hand-drawn marker loop (draws on with t, overshooting its start like a pen), coral over ink. */
export const MarkerRing: React.FC<{cx: number; cy: number; rx: number; ry: number; t: number}> = ({cx, cy, rx, ry, t}) => {
  const n = 48;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const a = -2.3 + (i / n) * Math.PI * 2 * 1.08;
    const k = 1 + 0.04 * Math.sin(i * 1.3) - 0.05 * (i / n);
    pts.push(`${f2(cx + Math.cos(a) * rx * k)},${f2(cy + Math.sin(a) * ry * k)}`);
  }
  const off = 1 - Math.min(1, t);
  return (
    <g>
      <polyline points={pts.join(' ')} fill="none" stroke={C.ink} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={off} />
      <polyline points={pts.join(' ')} fill="none" stroke={C.coral} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={off} />
    </g>
  );
};

/* ------------------------------------------------------------------ route strip */

const ROUTE_R = [21, 16, 12, 9]; // pulse radius on each leg (thins at each bounce)
const ROUTE_O = [1, 0.85, 0.7, 0.56]; // pulse opacity on each leg
const ROUTE_W = [6, 5, 4, 3]; // connector stroke width on each leg
const ICON_HALF = 56; // connectors start/stop this far from an icon centre

/** The five-icon route strip (sensor, wall, him, wall, sensor) with a pulse that thins at each bounce. */
const RouteStrip: React.FC<{t: number; pulse: number}> = ({t, pulse}) => {
  const {xs, y} = TL_GEOM.route;
  const icon = (i: number) => clamp01((t - i * 0.14) / 0.3);
  const legT = (i: number) => clamp01((t - 0.1 - i * 0.14) / 0.3);
  const p = clamp01(pulse);
  const leg = Math.min(3, Math.floor(p * 4));
  const u = p * 4 - leg;
  const px = lerp(xs[leg] + ICON_HALF * 0.6, xs[leg + 1] - ICON_HALF * 0.6, u);
  // a small bounce ring at the icon the pulse just left (legs 1..3 start at a bounce)
  const bounce = leg > 0 && u < 0.3 ? u / 0.3 : -1;
  return (
    <g>
      {[0, 1, 2, 3].map((i) => {
        const k = legT(i);
        if (k <= 0) return null;
        const xa = xs[i] + ICON_HALF;
        const xb = lerp(xa, xs[i + 1] - ICON_HALF, E.out(k));
        return (
          <g key={i}>
            <path d={`M ${xa} ${y} L ${f2(xb)} ${y}`} stroke={C.ink} strokeWidth={ROUTE_W[i]} strokeDasharray={`${ROUTE_W[i] * 2.4} ${ROUTE_W[i] * 2.2}`} strokeLinecap="round" fill="none" />
            {k >= 1 && <path d={`M ${xs[i + 1] - ICON_HALF - 14} ${y - 11} L ${xs[i + 1] - ICON_HALF} ${y} L ${xs[i + 1] - ICON_HALF - 14} ${y + 11}`} stroke={C.ink} strokeWidth={ROUTE_W[i]} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
          </g>
        );
      })}
      {xs.map((cx, i) => {
        const k = icon(i);
        if (k <= 0) return null;
        const s = 0.85 + 0.15 * E.out(k);
        return (
          <g key={i} opacity={f2(clamp01(k * 2))} transform={`translate(${cx} ${y}) scale(${f2(s)})`}>
            {i === 0 || i === 4 ? <SensorIcon flip={i === 4} /> : i === 2 ? <PersonIcon /> : <WallIcon />}
          </g>
        );
      })}
      {p > 0 && p < 1 && (
        <g>
          {bounce >= 0 && <circle cx={xs[leg]} cy={y} r={f2(20 + 30 * bounce)} fill="none" stroke={C.saffronDeep} strokeWidth={4} opacity={f2(0.9 * (1 - bounce))} />}
          <circle cx={f2(px)} cy={y} r={ROUTE_R[leg]} fill={C.saffron} stroke={C.ink} strokeWidth={3.5} opacity={ROUTE_O[leg]} />
        </g>
      )}
    </g>
  );
};

/** Flat sensor icon (local, centred): teal box with a coral emitter window facing right (flip: facing left). */
const SensorIcon: React.FC<{flip?: boolean}> = ({flip}) => (
  <g transform={flip ? 'scale(-1 1)' : undefined}>
    <rect x={-44} y={-30} width={80} height={60} rx={12} fill={C.teal} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={24} y={-18} width={20} height={36} rx={7} fill={C.coral} stroke={C.ink} strokeWidth={3} />
    <circle cx={-14} cy={0} r={13} fill={C.cream} stroke={C.ink} strokeWidth={3} />
    <circle cx={-14} cy={0} r={5} fill={C.ink} />
  </g>
);

/** Flat wall icon (local, centred): a paper slab with a saffron wall spot. */
const WallIcon: React.FC = () => (
  <g>
    <rect x={-20} y={-56} width={40} height={112} rx={6} fill={C.paperLine} stroke={C.ink} strokeWidth={OUTLINE} />
    <path d="M -20 -26 L 20 -26 M -20 4 L 20 4 M -20 34 L 20 34" stroke={C.inkMuted} strokeWidth={2.5} opacity={0.6} />
    <circle cx={0} cy={0} r={9} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
  </g>
);

/** Flat person icon (local, centred): the guesser's colours (white shirt, saffron stripes, red spiky hair). */
const PersonIcon: React.FC = () => (
  <g>
    <path d="M -38 54 L -38 22 Q -38 -2 -14 -4 L 14 -4 Q 38 -2 38 22 L 38 54 Z" fill={C.white} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
    <path d="M -36 18 L 36 18 M -38 36 L 38 36" stroke={C.saffron} strokeWidth={8} />
    <path d="M -38 54 L -38 22 Q -38 -2 -14 -4 L 14 -4 Q 38 -2 38 22 L 38 54 Z" fill="none" stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
    <path d="M -22 -38 L -16 -58 L -6 -44 L 2 -62 L 10 -44 L 20 -56 L 22 -36 Z" fill="#C0392B" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <circle cx={0} cy={-28} r={22} fill="#F2C9A8" stroke={C.ink} strokeWidth={OUTLINE} />
  </g>
);
