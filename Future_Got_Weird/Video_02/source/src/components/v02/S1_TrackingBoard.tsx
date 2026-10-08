import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {E} from '../../lib/motion';
import track from '../../data/evidence/tracking_topdown.json';
import {SensorTop, facingOf} from './HandheldSensor';

/**
 * S1.3 evidence board (screen space, 1920x1080): the authors' released ST evaluation-kit tracking data, seen from
 * above, drawn from data/evidence/tracking_topdown.json without smoothing or invented points.
 *
 *  - x is mirrored for display (display x = -x) so the sensor is on the left and the person on the right, as in our
 *    room; the source chip says so.
 *  - wall points: the 16 measured (calibrated) wall points; sensor and partition: the authors' plot constants.
 *  - the moving marker is the estimated position (ours_xz: the authors' unmodified code and settings, run by us; a
 *    stochastic particle filter, so it differs from the authors' stored estimate by a few cm, median ~8 cm), one data
 *    frame at a time (nearest frame, no interpolation), with a short fading trail of the previous frames. Frames are
 *    counted, never converted to seconds: the capture's frame rate is not recorded. The conditions box says so:
 *    "authors' code, run by us" (review r1 D13; OPENING_EVIDENCE §4, the wording S7 uses for the same track).
 *
 * Pure function of its props; the scene drives every `t` from its cue constants.
 */

type XZ = [number, number];
const DATA = track as unknown as {
  num_frames: number;
  wall_points_xz: XZ[];
  sensor_xz: XZ;
  occluder_xz: XZ[];
  ours_xz: XZ[];
};
export const BOARD_FRAMES = DATA.num_frames;

// card and plot geometry (screen px)
export const CARD = {x0: 100, y0: 34, x1: 1820, y1: 944};
const PLOT = {x0: 168, y0: 176, ppm: 366, dx0: -0.24, z0: -0.1};
const X = (dx: number) => PLOT.x0 + (dx - PLOT.dx0) * PLOT.ppm;
const Y = (z: number) => PLOT.y0 + (z - PLOT.z0) * PLOT.ppm;
/** Display position (mirrored x) of an authors' (x, z) point. */
const D = (p: XZ) => ({x: X(-p[0]), y: Y(p[1])});
export const boardPoint = D;
/** Plot centre on screen (for the camera push). */
export const PLOT_CENTRE = {x: X(0.8), y: Y(0.78)};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const f2 = (n: number) => Math.round(n * 100) / 100;
const pop = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : E.back(t));

export type BoardT = {
  /** 0..1 the card's content fades up (the card itself is drawn by the scene's swing). */
  content: number;
  /** 0..1 plot layout draws on (wall, wall points, sensor, partition). */
  layout: number;
  /** data frame index 0..num_frames-1 shown now, or -1 before the replay */
  idx: number;
  /** 0..1 the estimated-position marker and legend appear */
  marker: number;
  /** 0..1 pale field-of-view wedge from the sensor to the wall points ("aimed at a wall") */
  fov: number;
  /** 0..1 pop of the sensor marker ("a small sensor") */
  sensorPop: number;
  /** 0..1 dashed straight line sensor -> estimate, stopped at the partition ("never saw directly") */
  blocked: number;
  /** 0..1 conditions box / source chip / fine print */
  conditions: number;
  source: number;
  fine: number;
};

const Txt: React.FC<{x: number; y: number; size?: number; children: React.ReactNode; color?: string; anchor?: 'start' | 'middle' | 'end'; weight?: number; font?: string; opacity?: number; halo?: boolean}> = ({x, y, size = 34, children, color = C.ink, anchor = 'start', weight = 800, font = F.body, opacity = 1, halo}) => (
  <text x={f2(x)} y={f2(y)} fontFamily={font} fontWeight={weight} fontSize={size} fill={color} textAnchor={anchor} opacity={opacity} stroke={halo ? C.white : undefined} strokeWidth={halo ? 8 : undefined} strokeLinejoin="round" paintOrder="stroke">
    {children}
  </text>
);

const TRAIL = 70; // data frames of trail behind the marker

export const TrackingBoard: React.FC<{t: BoardT}> = ({t}) => {
  const L = clamp01(t.layout);
  const sensor = D(DATA.sensor_xz);
  const occ = DATA.occluder_xz.map(D);
  const wallY = Y(0);
  const wallX0 = X(-0.18);
  const wallX1 = X(1.66);
  const wp = DATA.wall_points_xz.map(D);
  const wpMinX = Math.min(...wp.map((p) => p.x));
  const wpMaxX = Math.max(...wp.map((p) => p.x));
  const aim = {x: (wpMinX + wpMaxX) / 2, y: wallY};
  const idx = Math.min(DATA.num_frames - 1, Math.floor(t.idx));
  const cur = idx >= 0 ? D(DATA.ours_xz[idx]) : null;
  const sPop = 1 + 0.25 * Math.sin(Math.PI * clamp01(t.sensorPop));
  // the straight line from the sensor toward the estimate, stopped where it meets the partition line
  let block: {x: number; y: number} | null = null;
  if (cur && t.blocked > 0) {
    const u = (occ[0].x - sensor.x) / (cur.x - sensor.x);
    const y = sensor.y + (cur.y - sensor.y) * u;
    if (u > 0 && u < 1 && y >= Math.min(occ[0].y, occ[1].y) && y <= Math.max(occ[0].y, occ[1].y)) block = {x: occ[0].x - 12, y: sensor.y + (cur.y - sensor.y) * ((occ[0].x - 12 - sensor.x) / (cur.x - sensor.x))};
  }
  const bk = clamp01(t.blocked);
  const RX = 1060; // right column
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g opacity={clamp01(t.content)}>
        {/* headline */}
        <Txt x={160} y={112} size={62} font={F.display} weight={600}>
          Real measurements · published 2026
        </Txt>
        <Txt x={164} y={160} size={34} color={C.inkMuted}>
          seen from above
        </Txt>

        {/* field of view: sensor -> the wall points */}
        {t.fov > 0 && (
          <path
            d={`M ${f2(sensor.x)} ${f2(sensor.y)} L ${f2(wpMinX - 16)} ${f2(wallY + 4)} L ${f2(wpMaxX + 16)} ${f2(wallY + 4)} Z`}
            fill={C.saffronLight}
            opacity={0.75 * E.out(clamp01(t.fov))}
          />
        )}

        {/* the relay wall */}
        <g opacity={E.out(clamp01(L * 3))}>
          <rect x={f2(wallX0)} y={f2(wallY - 26)} width={f2((wallX1 - wallX0) * E.out(clamp01(L * 2)))} height={26} fill="#F5E4C6" />
          <line x1={f2(wallX0)} y1={f2(wallY)} x2={f2(wallX0 + (wallX1 - wallX0) * E.out(clamp01(L * 2)))} y2={f2(wallY)} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
          <Txt x={wallX1 + 18} y={wallY + 12} size={34} color={C.inkSoft}>
            wall
          </Txt>
        </g>
        {/* the 16 measured wall points (they overlap in four columns: that is the data) */}
        {wp.map((p, i) => {
          const k = pop(clamp01((L - 0.2 - i * 0.02) * 4));
          return k > 0 ? <circle key={i} cx={f2(p.x)} cy={f2(p.y)} r={f2(9 * k)} fill={C.saffron} stroke={C.ink} strokeWidth={3} /> : null;
        })}
        <Txt x={(wpMinX + wpMaxX) / 2} y={wallY + 58} size={32} anchor="middle" color={C.inkSoft} opacity={clamp01((L - 0.5) * 3)} halo>
          wall points (measured)
        </Txt>

        {/* partition (authors' plot constant) */}
        <g opacity={clamp01((L - 0.35) * 3)}>
          <line x1={f2(occ[0].x)} y1={f2(occ[0].y)} x2={f2(occ[0].x)} y2={f2(occ[0].y + (occ[1].y - occ[0].y) * E.out(clamp01((L - 0.35) * 2)))} stroke={C.ink} strokeWidth={20} strokeLinecap="round" />
          <line x1={f2(occ[0].x)} y1={f2(occ[0].y)} x2={f2(occ[0].x)} y2={f2(occ[0].y + (occ[1].y - occ[0].y) * E.out(clamp01((L - 0.35) * 2)))} stroke={C.coral} strokeWidth={12} strokeLinecap="round" />
          <Txt x={occ[1].x - 22} y={occ[1].y - 4} size={34} anchor="end" color={C.coralDeep}>
            partition
          </Txt>
        </g>

        {/* sensor (authors' plot constant), facing the wall points */}
        <g opacity={clamp01((L - 0.25) * 3)}>
          <SensorTop asGroup x={sensor.x} y={sensor.y} size={74} scale={sPop} facing={facingOf(aim.x - sensor.x, aim.y - sensor.y)} />
          <Txt x={sensor.x} y={sensor.y + 74} size={34} anchor="middle" color={C.tealDeep}>
            sensor
          </Txt>
        </g>

        {/* never saw directly: the straight line is stopped by the partition */}
        {block && (
          <g opacity={E.out(clamp01(bk * 2))}>
            <path d={`M ${f2(sensor.x + 30)} ${f2(sensor.y + ((block.y - sensor.y) * 30) / Math.max(1, block.x - sensor.x))} L ${f2(block.x)} ${f2(block.y)}`} stroke={C.coral} strokeWidth={5} strokeDasharray="13 11" strokeLinecap="round" fill="none" />
            {(() => {
              const s = 13 * pop(clamp01((bk - 0.3) * 2.5));
              return (
                <g transform={`translate(${f2(block.x - 4)} ${f2(block.y)})`}>
                  <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
                  <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={C.coral} strokeWidth={5} strokeLinecap="round" />
                </g>
              );
            })()}
          </g>
        )}

        {/* estimated position: trail of the previous data frames (straight segments, fading) and the marker */}
        {idx >= 0 && t.marker > 0 && (
          <g opacity={clamp01(t.marker * 2)}>
            {Array.from({length: Math.min(TRAIL, idx)}).map((_, j) => {
              const a = D(DATA.ours_xz[idx - j - 1]);
              const b = D(DATA.ours_xz[idx - j]);
              const age = j / TRAIL;
              return <line key={j} x1={f2(a.x)} y1={f2(a.y)} x2={f2(b.x)} y2={f2(b.y)} stroke={C.tealDeep} strokeWidth={f2(8 * (1 - age * 0.55))} strokeLinecap="round" opacity={f2(0.9 * (1 - age * 0.85))} />;
            })}
            {cur && (
              <g transform={`translate(${f2(cur.x)} ${f2(cur.y)}) scale(${f2(pop(clamp01(t.marker)))})`}>
                <circle r={17} fill={C.teal} stroke={C.ink} strokeWidth={OUTLINE} />
                <circle cx={-5} cy={-5} r={5} fill={C.cream} opacity={0.85} />
              </g>
            )}
          </g>
        )}

        {/* scale bar */}
        <g opacity={clamp01((L - 0.6) * 3)}>
          <line x1={f2(X(1.18))} y1={f2(Y(1.58))} x2={f2(X(1.68))} y2={f2(Y(1.58))} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
          <line x1={f2(X(1.18))} y1={f2(Y(1.58) - 10)} x2={f2(X(1.18))} y2={f2(Y(1.58) + 10)} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
          <line x1={f2(X(1.68))} y1={f2(Y(1.58) - 10)} x2={f2(X(1.68))} y2={f2(Y(1.58) + 10)} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
          <Txt x={X(1.43)} y={Y(1.58) - 20} size={30} anchor="middle" font={F.mono} weight={700} color={C.inkSoft}>
            50 cm
          </Txt>
        </g>

        {/* right column: legend, frame counter, conditions, fine print */}
        <g opacity={clamp01(t.marker * 2)}>
          <circle cx={RX + 22} cy={238} r={17} fill={C.teal} stroke={C.ink} strokeWidth={OUTLINE} />
          <circle cx={RX + 17} cy={233} r={5} fill={C.cream} opacity={0.85} />
          <line x1={RX - 18} y1={250} x2={RX + 4} y2={243} stroke={C.teal} strokeWidth={6} strokeLinecap="round" opacity={0.6} />
          <Txt x={RX + 56} y={251} size={40}>
            estimated position
          </Txt>
          <Txt x={RX + 56} y={302} size={34} color={C.inkMuted}>
            a position estimate, not an image
          </Txt>
          <Txt x={RX + 56} y={380} size={44} font={F.mono} weight={700}>
            {`frame ${String(Math.max(1, idx + 1)).padStart(3, ' ')} of ${DATA.num_frames}`}
          </Txt>
          <Txt x={RX + 56} y={426} size={32} color={C.inkMuted}>
            frame numbers, not seconds
          </Txt>
        </g>
        <g opacity={clamp01(t.conditions * 2)} transform={`translate(0 ${f2((1 - E.out(clamp01(t.conditions))) * 14)})`}>
          <rect x={RX + 32} y={478} width={700} height={176} rx={22} fill={C.cream} stroke={C.inkMuted} strokeWidth={3} />
          {["authors' released data", 'evaluation-kit sensor, held still', "authors' code, run by us"].map((s, i) => (
            <Txt key={i} x={RX + 62} y={528 + i * 50} size={34} color={C.inkSoft}>
              {s}
            </Txt>
          ))}
        </g>
        <g opacity={clamp01(t.fine * 2)}>
          <Txt x={RX + 56} y={714} size={30} color={C.inkMuted}>
            wall points: measured
          </Txt>
          <Txt x={RX + 56} y={754} size={30} color={C.inkMuted}>
            {"sensor & partition: from the authors' plot"}
          </Txt>
          <Txt x={RX + 56} y={794} size={30} color={C.inkMuted}>
            what the person wore: not documented
          </Txt>
        </g>

        {/* source chip */}
        <g opacity={clamp01(t.source * 2)} transform={`translate(0 ${f2((1 - E.out(clamp01(t.source))) * 14)})`}>
          <rect x={160} y={856} width={1150} height={58} rx={29} fill={C.ink} />
          <Txt x={190} y={896} size={30} color={C.paper}>
            Somasundaram et al., Nature 2026 · plot mirrored to match our room
          </Txt>
        </g>
      </g>
    </svg>
  );
};

/** The taped card the board is printed on (screen space). */
export const BoardCard: React.FC<{children?: React.ReactNode}> = ({children}) => {
  const w = CARD.x1 - CARD.x0;
  const h = CARD.y1 - CARD.y0;
  return (
    <div style={{position: 'absolute', left: CARD.x0, top: CARD.y0, width: w, height: h}}>
      <div style={{position: 'absolute', inset: 0, background: C.white, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 12, boxShadow: `12px 14px 0 ${C.shadow}`}} />
      {children}
      <div style={{position: 'absolute', left: -34, top: -10, width: 130, height: 34, background: 'rgba(255,233,168,0.92)', border: '2px solid rgba(22,42,50,0.25)', transform: 'rotate(-9deg)'}} />
      <div style={{position: 'absolute', right: -34, top: -10, width: 130, height: 34, background: 'rgba(255,233,168,0.92)', border: '2px solid rgba(22,42,50,0.25)', transform: 'rotate(8deg)'}} />
    </div>
  );
};
