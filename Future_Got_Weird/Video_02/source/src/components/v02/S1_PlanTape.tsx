import React from 'react';
import {C, F} from '../../theme';
import {pathCumulative, lerpP, type P2} from '../../lib/optics';
import type {ToPx} from './Optics';

/**
 * S1.7 only: the extra delay as an extra distance, on the "seen from above" PlanCard.
 *
 *  - PlanTapeLanes: the detour wall spot -> him -> wall spot (a polyline whose legs retrace each other) drawn on up
 *    to `head` metres as a saffron line with an ink tick every `stepM` metres of PATH (default c x 1 ns = 0.29979 m),
 *    the out and back legs in two lanes `lane` px apart like LightPath's trail. The kit PlanTape draws a retracing path
 *    on one line, where the out and back ticks of the 2.146 m detour land 4.6 cm (10 px) apart and read as three
 *    double ticks; in lanes a tick-length apart the 7 ticks read as 7 nanoseconds. Ticks continue the count across
 *    the turn (they are path length, not leg length).
 *  - TapeKey: one piece of that tape at the card's scale (stepM metres long), "1 ns" above it and "≈ 30 cm" below:
 *    the S1.7 ruler card's "1 nanosecond ≈ 30 cm" moved into the card as its key.
 *
 * Card px (PlanCard's `marks` render callback). Pure functions of their props.
 */

const f2 = (n: number) => Math.round(n * 100) / 100;
export const NS_M = 0.29979;

export const PlanTapeLanes: React.FC<{points: P2[]; head: number; toPx: ToPx; lane?: number; stepM?: number; width?: number; tick?: number}> = ({
  points,
  head,
  toPx,
  lane = 32,
  stepM = NS_M,
  width = 6,
  tick = 9,
}) => {
  if (head <= 0 || points.length < 2) return null;
  const cum = pathCumulative(points);
  const total = cum[cum.length - 1];
  const end = Math.min(head, total);
  const same = (a: P2, b: P2) => Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.z - b.z) < 1e-9;
  // each leg: card-px ends and its lane offset (half a lane along its own left normal when another leg retraces it)
  const legs = points.slice(0, -1).map((a, i) => {
    const b = points[i + 1];
    const pa = toPx(a);
    const pb = toPx(b);
    const L = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1;
    const nrm = {x: -(pb.y - pa.y) / L, y: (pb.x - pa.x) / L};
    const retraced = points.some((_, j) => j !== i && j + 1 < points.length && same(points[j], b) && same(points[j + 1], a));
    const off = retraced ? lane / 2 : 0;
    const at = (u: number) => {
      const p = toPx(lerpP(a, b, u));
      return {x: p.x + nrm.x * off, y: p.y + nrm.y * off};
    };
    return {s0: cum[i], len: cum[i + 1] - cum[i], at, nrm};
  });
  const locate = (m: number) => {
    let i = 0;
    while (i < legs.length - 1 && m > legs[i].s0 + legs[i].len) i++;
    const lg = legs[i];
    return {i, q: lg.at(lg.len > 0 ? Math.max(0, Math.min(1, (m - lg.s0) / lg.len)) : 0)};
  };
  const lines: React.ReactNode[] = [];
  legs.forEach((lg, i) => {
    if (end <= lg.s0) return;
    const u = Math.min(1, (end - lg.s0) / Math.max(1e-9, lg.len));
    const a = lg.at(0);
    const b = lg.at(u);
    // the turn from the previous lane's end into this lane
    const join = i > 0 ? `M ${f2(legs[i - 1].at(1).x)} ${f2(legs[i - 1].at(1).y)} L ${f2(a.x)} ${f2(a.y)} ` : '';
    lines.push(<path key={`l${i}`} d={`${join}M ${f2(a.x)} ${f2(a.y)} L ${f2(b.x)} ${f2(b.y)}`} fill="none" stroke={C.saffron} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />);
    lines.push(<path key={`e${i}`} d={`${join}M ${f2(a.x)} ${f2(a.y)} L ${f2(b.x)} ${f2(b.y)}`} fill="none" stroke={C.saffronDeep} strokeWidth={2} strokeLinecap="round" opacity={0.6} />);
  });
  const ticks: React.ReactNode[] = [];
  for (let k = 1; k * stepM <= end + 1e-9; k++) {
    const {i, q} = locate(k * stepM);
    const n = legs[i].nrm;
    ticks.push(<path key={`t${k}`} d={`M ${f2(q.x - n.x * tick)} ${f2(q.y - n.y * tick)} L ${f2(q.x + n.x * tick)} ${f2(q.y + n.y * tick)}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />);
  }
  return (
    <g>
      {lines}
      {ticks}
    </g>
  );
};

/** The tape's key (card px): one stepM piece at `ppm`, its left end at (x, y). */
export const TapeKey: React.FC<{x: number; y: number; ppm: number; t: number; stepM?: number; size?: number}> = ({x, y, ppm, t, stepM = NS_M, size = 34}) => {
  if (t <= 0) return null;
  const L = stepM * ppm;
  const tickH = 10;
  const textW = 0.6 * size * 7; // "≈ 30 cm" in the mono face
  return (
    <g opacity={f2(Math.min(1, t))}>
      <rect x={f2(x - 14)} y={f2(y - size - 26)} width={f2(Math.max(L, textW) + 28)} height={f2(2 * size + 56)} rx={12} fill={C.white} stroke={C.inkMuted} strokeWidth={2.5} />
      <path d={`M ${f2(x)} ${f2(y)} L ${f2(x + L)} ${f2(y)}`} stroke={C.saffron} strokeWidth={6} strokeLinecap="round" />
      <path d={`M ${f2(x)} ${f2(y - tickH)} L ${f2(x)} ${f2(y + tickH)} M ${f2(x + L)} ${f2(y - tickH)} L ${f2(x + L)} ${f2(y + tickH)}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      <text x={f2(x + L / 2)} y={f2(y - 18)} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={size} fill={C.saffronDeep}>
        1 ns
      </text>
      <text x={f2(x)} y={f2(y + size + 12)} textAnchor="start" fontFamily={F.mono} fontWeight={700} fontSize={size} fill={C.inkSoft}>
        ≈ 30 cm
      </text>
    </g>
  );
};
