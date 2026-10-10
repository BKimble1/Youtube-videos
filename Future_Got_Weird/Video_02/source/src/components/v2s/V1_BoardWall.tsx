import React, {useId} from 'react';
import {C} from '../../theme';
import {E} from '../../lib/motion';
import track from '../../data/evidence/tracking_topdown.json';
import {ROOM_COLORS} from '../v02/RoomSet';
import {TRACK_GEOM, trackGeom, trackPoint} from '../v2k/RealTrackBoard';

/**
 * V1.3 · the real board's wall band, in the room's wall colour, with one pulse of the measured wall points (v2 review
 * r1, V2-R1-18: nothing on the board said the top band is the wall the light bounces off; no label is added, the
 * opening board keeps its three).
 *
 * Drawn OVER the kit RealTrackBoard (column 0) with the board's own push transform (scale 1 + 0.05·E.inOut(push) about
 * the stored estimate at `focusIdx`, clipped to the plot panel): the band above the wall line in ROOM_COLORS.relayWall,
 * the colour the wall has in the room shots just before (V1.1/V1.2), then the kit's wall line and the 16 measured wall
 * points redrawn exactly as the kit draws them (same geometry, sizes, colours). Only the band is covered: nothing else
 * of the board is up there (the partition starts at y 525, the track never comes above y 479, the labels sit lower).
 *
 * `pulse` 0..1 (one shot): each wall point swells and a saffron ring runs out of it. Pure function of its props.
 */

type XZ = [number, number];
const WALL_PTS = (track as unknown as {wall_points_xz: XZ[]}).wall_points_xz;
/** The kit's plot panel corner radius (RealTrackBoard PANEL.r, not exported). */
const PANEL_R = 18;

const f2 = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const BOARD_WALL_COLOR = ROOM_COLORS.relayWall;

export const BoardWall: React.FC<{push: number; focusIdx: number; pulse: number}> = ({push, focusIdx, pulse}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const G = trackGeom(0);
  const pan = TRACK_GEOM.panel;
  const s = 1 + 0.05 * E.inOut(clamp01(push));
  const focus = trackPoint(focusIdx);
  const xform = s === 1 ? undefined : `translate(${f2(focus.x)} ${f2(focus.y)}) scale(${f2(s * 10000) / 10000}) translate(${f2(-focus.x)} ${f2(-focus.y)})`;
  const pts = WALL_PTS.map(G.P);
  const t = clamp01(pulse);
  const swell = t > 0 && t < 1 ? Math.sin(Math.PI * t) : 0;
  const ring = t > 0 && t < 1;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <clipPath id={`bw${uid}`}>
          <rect x={pan.x0} y={pan.y0} width={f2(pan.x1 - pan.x0)} height={pan.y1 - pan.y0} rx={PANEL_R} />
        </clipPath>
      </defs>
      <g clipPath={`url(#bw${uid})`}>
        <g transform={xform}>
          <rect x={-1000} y={f2(G.wallY - 400)} width={4000} height={400} fill={BOARD_WALL_COLOR} />
          <line x1={pan.x0 - 60} y1={f2(G.wallY)} x2={pan.x1 + 120} y2={f2(G.wallY)} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
          {ring &&
            pts.map((p, j) => (
              <circle key={`r${j}`} cx={f2(p.x)} cy={f2(p.y)} r={f2(12 + 34 * E.out(t))} fill="none" stroke={C.saffronDeep} strokeWidth={f2(6 * (1 - t) + 1.5)} opacity={f2(0.85 * (1 - t))} />
            ))}
          {pts.map((p, j) => (
            <circle key={j} cx={f2(p.x)} cy={f2(p.y)} r={f2(10 * (1 + 0.45 * swell))} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
          ))}
        </g>
      </g>
    </svg>
  );
};
