import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {E} from '../../lib/motion';
import {LAYOUT, WALL_T, type Layout} from '../../lib/room';
import {pathCumulative, lerpP, type P2} from '../../lib/optics';
import {polyD, type ToPx} from './Optics';
import {CheckerToken, GuesserToken, tokenSize} from './Tokens';
import {SensorTop, facingOf} from './HandheldSensor';
import {PLAN_CARD_AREA, PLAN_CARD_RECT} from '../../lib/shots';

/**
 * "Seen from above": a top-down plan card (screen space) shown beside the raised room view while a light path runs
 * there (S1.4-S1.5, the S1.7 light tape, S3.1, S9.2). From the room's front-left camera the opening between the
 * partition's far end and the relay wall lies behind the far end, so in the room a wall -> person leg goes behind the
 * far end's edge and is hidden until it reaches him (lib/room assertAroundTheEnd); in the plan the same path, drawn by
 * the same components on the same schedule, visibly threads that opening: "round the end, by way of the wall".
 *
 * Drawn from layout.json like every other plan in the episode (S4's plan board look: cream floor, ink relay wall,
 * coral partition bar, the overhead tokens and the sensor top), framed by a PlanView (default PLAN_VIEW).
 * The card styling follows the house cards (S1.3 evidence board: white card, 4 px ink outline, tape, hard shadow).
 * Default size 480 x 408 px (PLAN_AREA). Beside a raised path shot the card sits in lib/shots PLAN_CARD_RECT, 432 x 372
 * (PLAN_CARD_AREA, inside the 5 % safe margin): pass area={PLAN_CARD_AREA} and view={viewForArea(view, PLAN_CARD_AREA)}.
 * The strip of tape sits inside the card's right edge (`tape`, default 'inside'), so nothing pokes past the card.
 *
 * Scenes pass render callbacks that receive the card's plan -> px map:
 *  - `light`: drawn over the floor and UNDER the partition and the people (seen from above, the 2 m partition and the
 *    people stand over light travelling in the 0.95 m light-path plane), e.g. <LightPath asGroup toPx={toPx} .../>.
 *  - `marks`: drawn over everything (crosses, spots, tape ticks).
 * Plan coordinates are the layout's metres, so the paths are exactly the scene's paths (no re-derivation). Strokes:
 * paths 6 px, pulses r 11, so they read at 40 % phone scale.
 */

const f2 = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * What the card shows: plan x `cx` at the plan area's centre, plan z `zTop` at its top edge (just beyond the relay
 * wall), `ppm` px per metre. The plan area has a fixed size (PLAN_AREA), so changing ppm zooms the plan in the card.
 */
export type PlanView = {cx: number; zTop: number; ppm: number};
/** Plan area (px): the card is PLAN_AREA plus the title row and a margin. */
export const PLAN_AREA = {w: 448, h: 330};
/** Default view: the wall half of the room at 218 px/m: x 0.95..3.0 (both people, the sensor), z -0.14..1.37 (the
 *  wall, the 0.65 m opening, the partition's far end; the partition runs off the bottom, so the only end in view is
 *  the one the light goes round). The gap is ~142 px, a person token ~109 px across. */
export const PLAN_VIEW: PlanView = {cx: 1.975, zTop: -0.14, ppm: 218};
/** The whole partition in view (S9.3: his walk to its near end and the push), same card size. */
export const PLAN_VIEW_FULL: PlanView = {cx: 1.975, zTop: -0.14, ppm: PLAN_AREA.h / 2.54};
const PAD = 16;
const HEAD = 62;

export type PlanArea = {w: number; h: number};

/** Card size (screen px) for a plan area. */
export const planCardSize = (area: PlanArea = PLAN_AREA) => ({w: area.w + 2 * PAD, h: HEAD + area.h + PAD});

/** lib/shots PLAN_CARD_RECT is the card of PLAN_CARD_AREA, inside the 5 % safe margin (x 96..1824, y >= 54). */
{
  const sz = planCardSize(PLAN_CARD_AREA);
  const r = PLAN_CARD_RECT;
  const bad: string[] = [];
  if (sz.w !== r.w || sz.h !== r.h) bad.push(`PLAN_CARD_RECT is ${r.w} x ${r.h} but planCardSize(PLAN_CARD_AREA) is ${sz.w} x ${sz.h}`);
  if (r.x + r.w > 1920 * 0.95) bad.push(`its right edge ${r.x + r.w} is past the 5 % margin (${1920 * 0.95})`);
  if (r.y < 1080 * 0.05) bad.push(`its top ${r.y} is above the 5 % margin (${1080 * 0.05})`);
  if (r.x < 1920 * 0.05) bad.push(`its left edge ${r.x} is past the 5 % margin`);
  if (bad.length) throw new Error(`lib/shots PLAN_CARD_RECT: ${bad.join('; ')}`);
}

/** Plan -> card-local px. */
export const planCardToPx = (v: PlanView = PLAN_VIEW, area: PlanArea = PLAN_AREA): ToPx => (p) => ({x: PAD + area.w / 2 + (p.x - v.cx) * v.ppm, y: HEAD + (p.z - v.zTop) * v.ppm});

/** The same framing as `v` in a different plan area (scaled to the area's width). */
export const viewForArea = (v: PlanView, area: PlanArea): PlanView => ({...v, ppm: (v.ppm * area.w) / PLAN_AREA.w});

/** A view between a and b (u 0..1; ppm glides geometrically, like the room camera's zoom). */
export const mixPlanView = (a: PlanView, b: PlanView, u: number): PlanView => ({
  cx: a.cx + (b.cx - a.cx) * u,
  zTop: a.zTop + (b.zTop - a.zTop) * u,
  ppm: a.ppm * Math.pow(b.ppm / a.ppm, u),
});

export type PlanFigure = {x: number; z: number; facing?: number; opacity?: number};

export type PlanCardProps = {
  /** top-left corner, screen px */
  x: number;
  y: number;
  /** 0..1 in (slides in from the right and fades up); pass in * (1 - out) */
  t: number;
  /**
   * The strip of tape at the top right: 'inside' (default) keeps it inside the card's right edge (it still overlaps
   * the top edge by ~18 px); 'overhang' is the old look, poking ~26 px past the right edge; 'none' draws no tape.
   */
  tape?: 'inside' | 'overhang' | 'none';
  layout?: Layout;
  view?: PlanView;
  /** plan area size (px); default PLAN_AREA */
  area?: PlanArea;
  checker?: PlanFigure | null;
  guesser?: PlanFigure | null;
  /** the sensor top at S (faces the aim point on the wall unless `facing` is given); `burst` / `burstRing` are
   *  SensorTop's opt-in flash (default off) */
  sensor?: {firing?: number; facing?: number; burst?: number; burstRing?: number} | null;
  /** 0..1 the opening between the partition's far end and the wall, marked like the room view's gap marker */
  gap?: number;
  label?: string;
  light?: (toPx: ToPx, ppm: number) => React.ReactNode;
  marks?: (toPx: ToPx, ppm: number) => React.ReactNode;
};

export const PlanCard: React.FC<PlanCardProps> = ({x, y, t, tape = 'inside', layout = LAYOUT, view = PLAN_VIEW, area = PLAN_AREA, checker, guesser, sensor, gap = 0, label = 'seen from above', light, marks}) => {
  if (t <= 0) return null;
  const {w, h} = planCardSize(area);
  const toPx = planCardToPx(view, area);
  const ppm = view.ppm;
  const k = E.out(clamp01(t));
  const dx = (1 - k) * 56;
  const op = clamp01(t * 1.6);
  const id = `plancard${Math.round(x)}x${Math.round(y)}`;
  // plan area (card-local)
  const ax0 = PAD;
  const ay0 = HEAD;
  const aw = w - 2 * PAD;
  const ah = h - HEAD - PAD;
  // relay wall: an ink band (z in [-WALL_T, 0], at least 7 px) with the wall colour beyond it
  const wallIn = toPx({x: 0, z: 0}).y;
  const wallT = Math.max(7, WALL_T * ppm);
  // partition: a coral bar with an ink outline, at least 13 px wide (the real 4 cm is ~5 px)
  const oc = layout.occluder;
  const barW = Math.max(14, oc.thickness * ppm);
  const p0 = toPx({x: oc.x, z: oc.z0});
  const p1 = toPx({x: oc.x, z: oc.z1});
  // the gap: from the wall's face to the partition's far end, on the partition's line
  const gapT = clamp01(gap);
  const gapLen = p0.y - wallIn;
  const tok = tokenSize(ppm);
  const S = toPx({x: LAYOUT.sensor.x, z: LAYOUT.sensor.z});
  const aim = toPx({x: (LAYOUT.sensor as {aimX?: number}).aimX ?? LAYOUT.sensor.x, z: 0});
  const fig = (f: PlanFigure | null | undefined, who: 'checker' | 'guesser') => {
    if (!f || (f.opacity ?? 1) <= 0.001) return null;
    const q = toPx(f);
    const Tok = who === 'checker' ? CheckerToken : GuesserToken;
    return <Tok asGroup x={q.x} y={q.y} size={tok} facing={f.facing ?? (who === 'checker' ? facingOf(S.x - q.x, S.y - q.y) : -90)} opacity={f.opacity ?? 1} />;
  };
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <g transform={`translate(${f2(x + dx)} ${f2(y)})`} opacity={f2(op)}>
        {/* card: hard shadow, white body, ink outline, a strip of tape */}
        <rect x={9} y={11} width={w} height={h} rx={16} fill={C.shadow} />
        <rect x={0} y={0} width={w} height={h} rx={16} fill={C.white} stroke={C.ink} strokeWidth={OUTLINE} />
        <text x={PAD + 4} y={44} fontFamily={F.body} fontWeight={800} fontSize={34} fill={C.inkSoft}>
          {label}
        </text>
        <defs>
          <clipPath id={`${id}-area`}>
            <rect x={ax0} y={ay0} width={aw} height={ah} rx={10} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-area)`}>
          {/* floor (the plan board's cream) and the wall beyond the relay wall */}
          <rect x={ax0} y={ay0} width={aw} height={ah} fill={C.cream} />
          <rect x={ax0} y={ay0} width={aw} height={f2(wallIn - wallT - ay0)} fill="#F5E4C6" />
          <rect x={ax0 - 2} y={f2(wallIn - wallT)} width={aw + 4} height={f2(wallT)} fill={C.ink} />
          {/* the opening between the partition's far end and the wall: white, dashed outline (as in the room view) */}
          {gapT > 0 && gapLen > 2 && (
            <rect x={f2(p0.x - barW / 2)} y={f2(wallIn + 2)} width={f2(barW)} height={f2(Math.max(0, gapLen - 4))} rx={3} fill={C.white} stroke={C.inkMuted} strokeWidth={3} strokeDasharray="7 6" opacity={f2(gapT)} />
          )}
          {/* light (under the partition and the people) */}
          {light && light(toPx, ppm)}
          {/* the partition */}
          <rect x={f2(p0.x - barW / 2)} y={f2(p0.y)} width={f2(barW)} height={f2(p1.y - p0.y)} rx={4} fill={C.coral} stroke={C.ink} strokeWidth={3.5} />
          {/* people and the sensor */}
          {fig(checker, 'checker')}
          {fig(guesser, 'guesser')}
          {sensor && <SensorTop asGroup x={S.x} y={S.y} size={0.26 * ppm} facing={sensor.facing ?? facingOf(aim.x - S.x, aim.y - S.y)} firing={sensor.firing ?? 0} burst={sensor.burst ?? 0} burstRing={sensor.burstRing} />}
          {marks && marks(toPx, ppm)}
        </g>
        <rect x={ax0} y={ay0} width={aw} height={ah} rx={10} fill="none" stroke={C.inkMuted} strokeWidth={2.5} />
        {/* tape: inside the right edge (its rotated corners end ~6 px inside it), or the old overhang */}
        {tape !== 'none' && (
          <rect x={tape === 'overhang' ? w - 70 : w - 104} y={-12} width={96} height={28} fill="rgba(255,233,168,0.92)" stroke="rgba(22,42,50,0.25)" strokeWidth={2} transform={`rotate(8 ${tape === 'overhang' ? w - 22 : w - 56} 2)`} />
        )}
      </g>
    </svg>
  );
};

/** A dashed route along a plan polyline, drawn on up to `head` metres (card px; nothing is hidden from above). */
export const PlanRoute: React.FC<{points: P2[]; head: number; toPx: ToPx; opacity?: number; width?: number; dash?: string; color?: string}> = ({points, head, toPx, opacity = 1, width = 4.5, dash = '11 9', color = C.saffronDeep}) => {
  if (head <= 0 || opacity <= 0) return null;
  const cum = pathCumulative(points);
  const pts = [toPx(points[0])];
  for (let i = 0; i < points.length - 1; i++) {
    if (head >= cum[i + 1]) pts.push(toPx(points[i + 1]));
    else {
      pts.push(toPx(lerpP(points[i], points[i + 1], (head - cum[i]) / (cum[i + 1] - cum[i]))));
      break;
    }
  }
  return <path d={polyD(pts)} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" strokeLinejoin="round" opacity={f2(opacity)} />;
};

/** A blocked mark (coral cross on ink), card px. */
export const PlanCross: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) =>
  s <= 0.3 ? null : (
    <g transform={`translate(${f2(x)} ${f2(y)})`}>
      <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
      <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={C.coral} strokeWidth={4} strokeLinecap="round" />
    </g>
  );

/** The lit wall spot (saffron diamond), card px; pops with E.back. */
export const PlanSpot: React.FC<{x: number; y: number; t: number; r?: number}> = ({x, y, t, r = 9}) => {
  if (t <= 0) return null;
  const s = r * E.back(clamp01(t));
  return <path d={`M ${f2(x)} ${f2(y - s)} L ${f2(x + s)} ${f2(y)} L ${f2(x)} ${f2(y + s)} L ${f2(x - s)} ${f2(y)} Z`} fill={C.saffron} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />;
};

/**
 * Facing (deg, clockwise from screen-up) of a token that walks along a plan track: the motion direction while it moves
 * (centred difference over ±`span` frames), easing back to `rest` when it stands. `at(frame)` gives the plan position.
 */
export const facingFromMotion = (at: (f: number) => {x: number; z: number}, g: number, rest: number, span = 4, still = 0.02) => {
  const a = at(g - span);
  const b = at(g + span);
  const vx = b.x - a.x;
  const vz = b.z - a.z;
  const v = Math.hypot(vx, vz);
  const wgt = clamp01(v / still);
  const r = (rest * Math.PI) / 180;
  // blend unit vectors (screen: x right, y = z down); facing 0 = up (toward the wall)
  const ux = Math.sin(r) * (1 - wgt) + (v > 1e-9 ? vx / v : 0) * wgt;
  const uy = -Math.cos(r) * (1 - wgt) + (v > 1e-9 ? vz / v : 0) * wgt;
  return facingOf(ux, uy);
};

/**
 * The S1.7 light tape on the card: the detour (e.g. [W, H, W]) drawn on up to `head` metres as a saffron line with an
 * ink tick every `stepM` metres of path (default one nanosecond of light, c * 1 ns = 0.29979 m) and "1 ns" beside the
 * first piece once it is complete. Card px; nothing is hidden from above.
 */
export const PlanTape: React.FC<{points: P2[]; head: number; toPx: ToPx; stepM?: number; width?: number; label?: string}> = ({points, head, toPx, stepM = 0.29979, width = 6, label = '1 ns'}) => {
  if (head <= 0) return null;
  const cum = pathCumulative(points);
  const at = (m: number) => {
    let i = 0;
    while (i < points.length - 2 && m > cum[i + 1]) i++;
    const u = Math.max(0, Math.min(1, (m - cum[i]) / Math.max(1e-9, cum[i + 1] - cum[i])));
    return {p: lerpP(points[i], points[i + 1], u), i};
  };
  const end = Math.min(head, cum[cum.length - 1]);
  const pts = [toPx(points[0])];
  for (let i = 1; i < points.length && cum[i] < end; i++) pts.push(toPx(points[i]));
  pts.push(toPx(at(end).p));
  const ticks: React.ReactNode[] = [];
  for (let m = stepM, k = 0; m <= end + 1e-9; m += stepM, k++) {
    const {p, i} = at(m);
    const a = toPx(points[i]);
    const b = toPx(points[i + 1]);
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / l;
    const ny = (b.x - a.x) / l;
    const q = toPx(p);
    ticks.push(<path key={k} d={`M ${f2(q.x - nx * 11)} ${f2(q.y - ny * 11)} L ${f2(q.x + nx * 11)} ${f2(q.y + ny * 11)}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />);
  }
  const first = end >= stepM ? toPx(at(stepM / 2).p) : null;
  return (
    <g>
      <path d={polyD(pts)} fill="none" stroke={C.saffron} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      {ticks}
      {first && (
        <text x={f2(first.x + 16)} y={f2(first.y - 14)} fontFamily={F.mono} fontWeight={700} fontSize={30} fill={C.saffronDeep} stroke={C.white} strokeWidth={6} paintOrder="stroke">
          {label}
        </text>
      )}
    </g>
  );
};
