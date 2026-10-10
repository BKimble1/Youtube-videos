import React from 'react';
import {C, F} from '../../theme';
import {PLINTH} from '../../lib/shots';
import {worldToScreen, type Cam} from '../../lib/camera';
import {MU} from '../v02/S5_Museum';

/**
 * V7 only: the history shelf for the v2 museum bridge, in WORLD px (draw it inside one camera <Layer>). Adapted from
 * the v1 gallery (components/v02/S5_Museum: same wall, lamps, pools of light, plinth proportions, rope and stool art)
 * with a tighter plinth spacing for a brisk truck, the wall ledge moved left (so V7's first, close framing on the
 * rolled-up board sees only bare wall: the V6 → V7 roll-up match), the rope across the three research exhibits only,
 * and the cheap-sensor stool far enough past the empty fourth plinth that no framing of that plinth ever reaches its
 * card (SHOTPLAN V7.2: the stool card stays out of every later framing).
 *
 * Plinth-local px for the exhibits: origin at the plinth's centre on top of its slab (y up is negative), as S5.
 */

export const MU7 = {
  floorY: 930,
  skirtH: 26,
  slabTop: 512,
  slabH: 44,
  slabW: 640,
  bodyW: 584,
  plaque: {w: 480, h: 144, y0: 586},
  /** plinth centres: 2012 · MIT, 2018 · Stanford, 2021 · Wisconsin + Milan, the empty fourth plinth */
  P: [1000, 1800, 2600, 3400] as const,
  /** rope posts in front of the gaps: the rope crosses the three research exhibits only */
  posts: [600, 1400, 2200, 3000] as const,
  ropeY: 700,
  sag: 100,
  postFoot: 1010,
  /** the wall ledge the rolled board lands on (left of everything: V7's first framing sees bare wall above it) */
  ledge: {x0: -320, x1: 80, y: 430, t: 26},
  /** the cheap-sensor side exhibit at the shelf's end */
  stool: {x: 4900, seat: 730},
  card: {x: 4900, y0: 300, w: 960, h: 196},
  railY: -200,
  pool: {dy: -212, rx: 380, ry: 330},
};

// the v1 rope / stool art (S5_Museum RopePost, RopeSpan, SensorStool) is reused and reads these from S5's MU
{
  const same: [string, number, number][] = [
    ['ropeY', MU7.ropeY, MU.ropeY],
    ['postFoot', MU7.postFoot, MU.postFoot],
    ['floorY', MU7.floorY, MU.floorY],
    ['stool.seat', MU7.stool.seat, MU.stool.seat],
    ['sag', MU7.sag, MU.sag],
  ];
  const bad = same.filter(([, a, b]) => a !== b);
  if (bad.length) throw new Error(`V7_Set: MU7 no longer matches S5_Museum MU for the reused art: ${bad.map(([n]) => n).join(', ')}`);
}

const SW = 3.5; // set outline (world px), as S5
const ink = (w = SW) => ({stroke: C.ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});
const f2 = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** The wall, lamps over each plinth, flat pools of light, skirting and floor (extends far past every framing). */
export const Hall7: React.FC<{pools?: number}> = ({pools = 1}) => {
  const fy = MU7.floorY;
  return (
    <g>
      <rect x={-4000} y={-3000} width={14000} height={3000 + fy} fill={PLINTH.wall} />
      {MU7.P.map((x) => (
        <ellipse key={`pool${x}`} cx={x} cy={MU7.slabTop + MU7.pool.dy} rx={MU7.pool.rx} ry={MU7.pool.ry} fill={C.cream} opacity={f2(0.55 * clamp01(pools))} />
      ))}
      <rect x={-4000} y={MU7.railY - 9} width={14000} height={18} fill={C.inkMuted} {...ink()} />
      {[...MU7.P, MU7.stool.x].map((x) => (
        <g key={`lamp${x}`} transform={`translate(${x} ${MU7.railY + 9})`}>
          <rect x={-6} y={0} width={12} height={34} fill={C.inkSoft} {...ink(3)} />
          <g transform="translate(0 40)">
            <path d="M -30 -10 L 30 -10 L 40 46 L -40 46 Z" fill={C.cream} {...ink()} />
            <rect x={-42} y={42} width={84} height={12} rx={5} fill={C.saffronLight} {...ink(3)} />
          </g>
        </g>
      ))}
      <rect x={-4000} y={fy - MU7.skirtH} width={14000} height={MU7.skirtH} fill={C.cream} {...ink()} />
      <rect x={-4000} y={fy} width={14000} height={2000} fill={C.paperDeep} {...ink()} />
    </g>
  );
};

/** The short wooden wall ledge at the start of the gallery. */
export const Ledge7: React.FC = () => {
  const l = MU7.ledge;
  return (
    <g>
      {[l.x0 + 70, l.x1 - 70].map((x) => (
        <path key={x} d={`M ${x - 10} ${l.y + l.t - 2} L ${x + 10} ${l.y + l.t - 2} L ${x + 10} ${l.y + l.t + 64} Q ${x - 4} ${l.y + l.t + 40} ${x - 10} ${l.y + l.t + 8} Z`} fill={PLINTH.post} {...ink(3)} />
      ))}
      <rect x={l.x0 + 6} y={l.y + 8} width={l.x1 - l.x0} height={l.t} rx={6} fill={C.shadow} />
      <rect x={l.x0} y={l.y} width={l.x1 - l.x0} height={l.t} rx={6} fill={PLINTH.top} {...ink()} />
    </g>
  );
};

/** One plinth (shadow, body, wood slab, saffron plaque with two screws) and up to two plaque lines, each fading in.
 *  `plate` 0..1 fades the whole plaque (plate, screws and lines) off the plinth body. */
export const Plinth7: React.FC<{x: number; line1?: string; line2?: string; t1?: number; t2?: number; size1?: number; size2?: number; plate?: number}> = ({x, line1, line2, t1 = 1, t2 = 1, size1 = 66, size2 = 44, plate = 1}) => {
  const fy = MU7.floorY;
  const top = MU7.slabTop;
  const po = clamp01(plate);
  return (
    <g>
      <ellipse cx={x + 24} cy={fy + 6} rx={MU7.bodyW / 2 + 50} ry={18} fill={C.shadow} />
      <rect x={x - MU7.bodyW / 2} y={top + MU7.slabH - 4} width={MU7.bodyW} height={fy - top - MU7.slabH + 4} fill={PLINTH.body} {...ink()} />
      <rect x={x - MU7.slabW / 2} y={top} width={MU7.slabW} height={MU7.slabH} rx={10} fill={PLINTH.top} {...ink()} />
      {po > 0.001 && <PlaqueFace x={x} line1={line1} line2={line2} t1={t1} t2={t2} size1={size1} size2={size2} opacity={po} />}
    </g>
  );
};

const PlaqueFace: React.FC<{x: number; line1?: string; line2?: string; t1: number; t2: number; size1: number; size2: number; opacity: number}> = ({x, line1, line2, t1, t2, size1, size2, opacity}) => {
  const pq = MU7.plaque;
  return (
    <g opacity={opacity >= 0.999 ? undefined : f2(opacity)}>
      <rect x={x - pq.w / 2} y={pq.y0} width={pq.w} height={pq.h} rx={14} fill={PLINTH.plaque} {...ink()} />
      {[x - pq.w / 2 + 18, x + pq.w / 2 - 18].map((sx) => (
        <circle key={sx} cx={sx} cy={pq.y0 + 18} r={4.5} fill={C.saffronDeep} stroke={C.ink} strokeWidth={2.5} />
      ))}
      {line1 && t1 > 0.001 && (
        <text x={x} y={pq.y0 + 56} textAnchor="middle" dominantBaseline="central" fontFamily={F.display} fontWeight={600} fontSize={size1} fill={C.ink} opacity={clamp01(t1)}>
          {line1}
        </text>
      )}
      {line2 && t2 > 0.001 && (
        <text x={x} y={pq.y0 + 112} textAnchor="middle" dominantBaseline="central" fontFamily={F.body} fontWeight={800} fontSize={size2} fill={C.ink} opacity={clamp01(t2)}>
          {line2}
        </text>
      )}
    </g>
  );
};

/** The sign hanging from the rope by two strings from one hook: pivot at (x, y), rotation `rot` (deg). */
export const RopeSign7: React.FC<{x: number; y: number; rot: number; text: string; size?: number; w?: number}> = ({x, y, rot, text, size = 70, w = 760}) => {
  const h = 112;
  const top = 44;
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)})`}>
      <path d={`M ${-w / 2 + 40} ${top + 6} L 0 0 L ${w / 2 - 40} ${top + 6}`} fill="none" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={0} cy={0} r={8} fill={C.saffronDeep} {...ink(3)} />
      <rect x={-w / 2 + 8} y={top + 10} width={w} height={h} rx={16} fill={C.shadow} />
      <rect x={-w / 2} y={top} width={w} height={h} rx={16} fill={C.cream} {...ink()} />
      {[-w / 2 + 40, w / 2 - 40].map((sx) => (
        <circle key={sx} cx={sx} cy={top + 10} r={5} fill={C.saffronDeep} stroke={C.ink} strokeWidth={2.5} />
      ))}
      <text x={0} y={top + h / 2 + 2} textAnchor="middle" dominantBaseline="central" fontFamily={F.display} fontWeight={600} fontSize={size} fill={C.ink}>
        {text}
      </text>
    </g>
  );
};

/** The 2021 cheap-sensor card on the wall above the stool (world px; `size` world px per line), leader to the board.
 *  It fades in and out only (labels do not spring). 44 world px = 48 px on screen in the stool framing (zoom 1.1). */
export const SideCard7: React.FC<{t: number; size?: number}> = ({t, size = 44}) => {
  if (t <= 0.001) return null;
  const c = MU7.card;
  const x0 = c.x - c.w / 2;
  return (
    <g opacity={clamp01(t)}>
      <path d={`M ${c.x} ${c.y0 + c.h} L ${c.x} ${MU7.stool.seat - 52}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      <circle cx={c.x} cy={MU7.stool.seat - 50} r={7} fill={C.cream} stroke={C.ink} strokeWidth={3.5} />
      <rect x={x0 + 10} y={c.y0 + 12} width={c.w} height={c.h} rx={18} fill={C.shadow} />
      <rect x={x0} y={c.y0} width={c.w} height={c.h} rx={18} fill={C.cream} {...ink()} />
      <text x={c.x} y={c.y0 + 66} textAnchor="middle" dominantBaseline="central" fontFamily={F.body} fontWeight={800} fontSize={size} fill={C.ink}>
        2021 · tracking with a cheap sensor kit
      </text>
      <text x={c.x} y={c.y0 + 132} textAnchor="middle" dominantBaseline="central" fontFamily={F.body} fontWeight={800} fontSize={size} fill={C.inkSoft}>
        (Callenberg et al.)
      </text>
    </g>
  );
};

/* ------------------------------------------------------------------ the museum spotlight (screen overlay) */

const ellD = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${f2(cx - rx)} ${f2(cy)} A ${f2(rx)} ${f2(ry)} 0 1 0 ${f2(cx + rx)} ${f2(cy)} A ${f2(rx)} ${f2(ry)} 0 1 0 ${f2(cx - rx)} ${f2(cy)} Z`;

/**
 * A museum spotlight (world px): a cone of light from the lamp on the rail, straight above `x`, down to a flat pool on
 * the surface it lands on (`y`, the floor or a plinth's slab). `top` is the cone's half-width at the lamp, `rx` its
 * half-width at the pool, `ry` the pool's half-height; `dim` the veil over the rest of the hall.
 */
export type Spot = {x: number; y: number; rx: number; ry: number; top: number; dim: number};

/** Max dim of the hall outside a spotlight (flat ink veil). */
export const SPOT_DIM = 0.42;
/** The lamp the spot shines from: on the rail, straight above the pool (world y of the lamp's lens). */
export const LAMP_Y = MU7.railY + 9 + 40 + 50;

export const lerpSpot = (a: Spot, b: Spot, t: number): Spot => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  rx: a.rx + (b.rx - a.rx) * t,
  ry: a.ry + (b.ry - a.ry) * t,
  top: a.top + (b.top - a.top) * t,
  dim: a.dim + (b.dim - a.dim) * t,
});

/**
 * The spotlight as a flat, hard-edged screen overlay: the hall is veiled with flat ink at `dim`, except the cone and its
 * pool, which stay clear; the pool gets a faint flat cream wash (cutout look: no gradient, no glow). Placed through the
 * camera, so it stays on its exhibit while the camera moves.
 */
export const Spotlight: React.FC<{cam: Cam; spot: Spot}> = ({cam, spot}) => {
  const id = 'spot' + React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  if (spot.dim <= 0.001) return null;
  const c = worldToScreen(cam, spot.x, spot.y);
  const rx = spot.rx * cam.zoom;
  const ry = spot.ry * cam.zoom;
  const lamp = worldToScreen(cam, spot.x, LAMP_Y);
  const lw = spot.top * cam.zoom;
  const cone = `M ${f2(lamp.x - lw)} ${f2(lamp.y)} L ${f2(lamp.x + lw)} ${f2(lamp.y)} L ${f2(c.x + rx)} ${f2(c.y)} L ${f2(c.x - rx)} ${f2(c.y)} Z`;
  const pool = ellD(c.x, c.y, rx, ry);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-50} y={-50} width={2020} height={1180}>
          <rect x={-50} y={-50} width={2020} height={1180} fill="#fff" />
          <path d={cone} fill="#000" />
          <path d={pool} fill="#000" />
        </mask>
      </defs>
      <rect x={-50} y={-50} width={2020} height={1180} fill={C.ink} opacity={f2(spot.dim)} mask={`url(#${id})`} />
    </svg>
  );
};

/** The spot's pool of light on the surface it lands on, in WORLD px: a flat cream wash drawn in the world under the
 *  exhibits (so it never washes over the thing it lights). */
export const SpotPool: React.FC<{spot: Spot}> = ({spot}) => {
  const k = clamp01(spot.dim / SPOT_DIM);
  if (k <= 0.001) return null;
  return <ellipse cx={f2(spot.x)} cy={f2(spot.y)} rx={f2(spot.rx)} ry={f2(spot.ry)} fill={C.cream} opacity={f2(0.4 * k)} />;
};
