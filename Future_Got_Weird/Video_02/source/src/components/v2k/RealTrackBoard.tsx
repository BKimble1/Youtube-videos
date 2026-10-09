import React, {useId} from 'react';
import {C, F, OUTLINE} from '../../theme';
import {E} from '../../lib/motion';
import track from '../../data/evidence/tracking_topdown.json';
import {EvidenceCard} from './EvidenceCard';
import {Chip, Label, Overlay} from './Labels';
import {clamp01, f2, lerp} from './util';

/**
 * v2 kit · RealTrackBoard: the R8 real-data board (V1.3, V10.1, V10.2, V10.4), adapted from v1 S1_TrackingBoard.
 *
 * What it plots (src/data/evidence/tracking_topdown.json, seen from above, x mirrored for display so the sensor sits
 * at left as in our room):
 *  - the 16 measured wall points along the top (saffron), the wall line;
 *  - the sensor marker and the partition line: the authors' plot constants, not measurements;
 *  - the estimated position = `stored_xz` (the authors' saved estimate). NEVER `ours_xz`, never a halo from
 *    `ours_std_xz` (those belong to our re-run and are not used here).
 *
 * Replay (EVIDENCE_BRIEF_V2 §1.3): one plotted position per video frame, data index = 6 + 2·(frame − start), clamped at
 * 474, no interpolation between data frames (the dot jumps from one stored position to the next). See REPLAY and
 * replayIndex(). 235 plotted frames ≈ 7.8 s at 30 fps, tagged "sped up". The trail joins only previously PLOTTED
 * positions (idx − 2, idx − 4, …), never the skipped data frames.
 *
 * Module load checks (throws if the data disagree): every stored index ≥ REPLAY.start plots on the hidden side of the
 * plotted partition line (beyond its x, and the straight sensor → estimate segment crosses the partition segment).
 * Indices 0–3 do not (the filter converging), which is why the replay starts at 6.
 *
 * Layout (screen px, column 0): the hidden side (from the partition at x 570 to the panel edge at 1796) spans 64 % of the
 * frame width, 70 % of the card width and 73 % of the plot panel; the dot is 40 px across (+ 4 px ink outline).
 *
 * Every element has its own 0..1 progress prop (fade only; labels never spring or move by themselves). Pure function
 * of its props; the scene drives everything from its cue constants.
 */

type XZ = [number, number];
const DATA = track as unknown as {
  num_frames: number;
  mirror_x_for_display: boolean;
  wall_points_xz: XZ[];
  sensor_xz: XZ;
  occluder_xz: XZ[];
  stored_xz: XZ[];
};

/** Total data frames in the record (475). */
export const TRACK_FRAMES = DATA.num_frames;

/** The replay mapping for the source record: data index 6 → 474, every 2nd data frame, 235 plotted frames. */
export const REPLAY = {start: 6, step: 2, end: 474, frames: 235} as const;

export type ReplaySpec = {start: number; step: number; end: number};

/**
 * Data index plotted at global frame `frame` for a replay that starts (index `start`) on global frame `startFrame`:
 * start + step·(frame − startFrame), clamped to `end` (the dot then holds); −1 before startFrame. One data index per
 * video frame, no interpolation.
 */
export const replayIndex = (frame: number, startFrame: number, opts: ReplaySpec = REPLAY): number => {
  const k = Math.floor(frame - startFrame);
  if (k < 0) return -1;
  return Math.min(opts.end, opts.start + opts.step * k);
};

/** Global frame on which a replay that starts on `startFrame` reaches its last index (it holds from there). */
export const replayEndFrame = (startFrame: number, opts: ReplaySpec = REPLAY) => startFrame + Math.ceil((opts.end - opts.start) / opts.step);

/* ------------------------------------------------------------------ data, display frame, module checks */

const mx = DATA.mirror_x_for_display ? -1 : 1;
/** display coordinates (metres): dx = mirrored x, z = distance from the wall */
const disp = (p: XZ) => ({dx: mx * p[0], z: p[1]});
const SENSOR_D = disp(DATA.sensor_xz);
const OCC_D = DATA.occluder_xz.map(disp);
const PART_DX = OCC_D[0].dx;
const PART_Z0 = Math.min(OCC_D[0].z, OCC_D[1].z);
const PART_Z1 = Math.max(OCC_D[0].z, OCC_D[1].z);

/** true if the stored estimate at index i is on the hidden side of the plotted partition line. */
export const isHiddenSide = (i: number) => {
  const p = disp(DATA.stored_xz[i]);
  const beyond = (p.dx - PART_DX) * (SENSOR_D.dx - PART_DX) < 0; // opposite side of the partition's x from the sensor
  if (!beyond) return false;
  const u = (PART_DX - SENSOR_D.dx) / (p.dx - SENSOR_D.dx);
  const zz = SENSOR_D.z + (p.z - SENSOR_D.z) * u;
  return zz >= PART_Z0 && zz <= PART_Z1; // the straight sight line meets the partition segment
};

/** Result of the module-load check (also stated in KIT_V2.md). */
export const HIDDEN_SIDE_CHECK = (() => {
  if (REPLAY.frames !== (REPLAY.end - REPLAY.start) / REPLAY.step + 1) throw new Error('RealTrackBoard: REPLAY.frames disagrees with start/step/end');
  if (REPLAY.end > DATA.num_frames - 1) throw new Error('RealTrackBoard: REPLAY.end is past the last data frame');
  const notHidden: number[] = [];
  for (let i = 0; i < DATA.num_frames; i++) if (!isHiddenSide(i)) notHidden.push(i);
  const bad = notHidden.filter((i) => i >= REPLAY.start);
  if (bad.length) throw new Error(`RealTrackBoard: stored_xz indices ${bad.join(', ')} plot on the sensor's side of the partition line`);
  return {checked: DATA.num_frames - REPLAY.start, fromIndex: REPLAY.start, allHidden: true, notHiddenIndices: notHidden};
})();

/** Centroid of the replayed (plotted) positions: the default aim of the "blocked" sight line. */
const AIM_D = (() => {
  let sx = 0;
  let sz = 0;
  let n = 0;
  for (let i = REPLAY.start; i <= REPLAY.end; i += REPLAY.step) {
    const p = disp(DATA.stored_xz[i]);
    sx += p.dx;
    sz += p.z;
    n++;
  }
  return {dx: sx / n, z: sz / n};
})();

/* ------------------------------------------------------------------ geometry */

/** Plot mapping at column 0 (full width) and column 1 (provenance column shown). K = px per metre. */
const MAP0 = {K: 500, sx: 420, wy: 200, panelX1: 1796};
const MAP1 = {K: 430, sx: 400, wy: 200, panelX1: 1104};
const PANEL = {x0: 124, y0: 146, y1: 868, r: 18};
/** Provenance column (screen px, column 1). */
export const TRACK_COLUMN = {x0: 1150, x1: 1790, y0: 172, gap: 28};
const DOT_R = 20;
/** "estimated position": right-anchored beside the track, at its mid-height (column 0); the leader follows the dot. */
const DOT_LABEL = {x: 1760, y: 676};

export type TrackGeom = {
  /** px per metre */
  K: number;
  /** screen point of an authors' (x, z) point (mirrored for display) */
  P: (p: XZ) => {x: number; y: number};
  /** screen point of a display-frame (dx, z) point */
  D: (dx: number, z: number) => {x: number; y: number};
  sensor: {x: number; y: number};
  wallY: number;
  partition: {x: number; y0: number; y1: number};
  panel: {x0: number; y0: number; x1: number; y1: number};
};

/**
 * Screen geometry of the board's plot for a column progress (0 = V1.3 full width, 1 = V10.2 with the right-hand
 * column), without push. Use it for match cuts (the V1 → V2 match holds the sensor marker, wall line and partition).
 */
export const trackGeom = (column = 0): TrackGeom => {
  const c = E.inOut(clamp01(column));
  const K = lerp(MAP0.K, MAP1.K, c);
  const sx = lerp(MAP0.sx, MAP1.sx, c);
  const wy = lerp(MAP0.wy, MAP1.wy, c);
  const D = (dx: number, z: number) => ({x: sx + (dx - SENSOR_D.dx) * K, y: wy + z * K});
  const P = (p: XZ) => {
    const d = disp(p);
    return D(d.dx, d.z);
  };
  const s = D(SENSOR_D.dx, SENSOR_D.z);
  const pa = D(PART_DX, PART_Z0);
  const pb = D(PART_DX, PART_Z1);
  return {K, P, D, sensor: s, wallY: wy, partition: {x: pa.x, y0: pa.y, y1: pb.y}, panel: {x0: PANEL.x0, y0: PANEL.y0, x1: lerp(MAP0.panelX1, MAP1.panelX1, c), y1: PANEL.y1}};
};

/** The V1.3 geometry (column 0, no push): sensor marker, wall line, partition, panel. */
export const TRACK_GEOM = (() => {
  const g = trackGeom(0);
  return {K: g.K, sensor: g.sensor, wallY: g.wallY, partition: g.partition, panel: g.panel, dotDiameter: DOT_R * 2};
})();

/** Screen position (column 0, no push) of the stored estimate at data index i. */
export const trackPoint = (i: number, column = 0) => trackGeom(column).P(DATA.stored_xz[Math.max(0, Math.min(DATA.num_frames - 1, Math.round(i)))]);

/* ------------------------------------------------------------------ props */

export type ProvenanceItem = {text: string; size?: number; t: number};

export type RealTrackBoardProps = {
  /** data index to plot now (replayIndex(g, startFrame)); −1 = no dot yet */
  idx: number;
  /** replay mapping used for the trail (default REPLAY) */
  replay?: ReplaySpec;
  /** 0..1 plot layout draws on: wall + wall points, sensor, partition (default 1 = drawn) */
  layout?: number;
  /** 0..1 the estimated-position dot and its trail (default 1) */
  dot?: number;
  /** trail length in PLOTTED positions (default 14 ≈ 0.47 s); 0 = no trail */
  trail?: number;
  /** 0..1 "sensor" label, 64 px (default 1) */
  sensorLabel?: number;
  /** 0..1 the blocked sight line (dashed, sensor → partition) and its X (default 1) */
  blocked?: number;
  /** aim the sight line at this data index (default: the centroid of the replayed track, so the X holds still) */
  blockedAimIdx?: number;
  /** 0..1 "blocked" label, 64 px (default 1) */
  blockedLabel?: number;
  /** 0..1 "estimated position" label, 64 px, with a leader to the dot (default 1; fades out as the column comes in) */
  dotLabel?: number;
  /** 0..1 a one-shot "brighten" of the dot label (highlight swash peaks at 0.5) and a ring from the dot */
  labelBrighten?: number;
  /** 0..1 headline "Real data" (default 1) */
  headline?: number;
  /** 0..1 the source line (default 1) and its text */
  source?: number;
  sourceText?: string;
  /** 0..1 corner tag "sped up" (default 1) */
  spedUp?: number;
  /** 0..1 a slow 5 % push toward the dot (eased inside; the plot scales about the focus, card and texts stay) */
  push?: number;
  /** data index the push centres on (default: the current dot) */
  pushFocusIdx?: number;
  /** 0..1 the right-hand provenance column comes in: the plot shrinks and shifts left (eased inside) */
  column?: number;
  /** column items (cut/fade in one at a time with their own t); default size 40 */
  columnItems?: ProvenanceItem[];
  /** 0..1 counter "frame N of 475" in the column (30 px; frame numbers only) */
  counter?: number;
  /** a small chip at the bottom of the column (30 px, wraps) */
  chip?: {text: string; t: number};
  /** 0..1 pale field-of-view wedge from the sensor to the wall points (default 0) */
  fov?: number;
  /** 0..1 a 50 cm scale bar, bottom-right of the plot (default 0) */
  scaleBar?: number;
  /** flat paper field behind the card (default true) */
  background?: boolean;
};

export const SOURCE_R8 = 'Real data · Somasundaram et al., Nature 2026 · ST sensor kit, held still';

/* ------------------------------------------------------------------ component */

export const RealTrackBoard: React.FC<RealTrackBoardProps> = ({
  idx,
  replay = REPLAY,
  layout = 1,
  dot = 1,
  trail = 14,
  sensorLabel = 1,
  blocked = 1,
  blockedAimIdx,
  blockedLabel = 1,
  dotLabel = 1,
  labelBrighten = 0,
  headline = 1,
  source = 1,
  sourceText = SOURCE_R8,
  spedUp = 1,
  push = 0,
  pushFocusIdx,
  column = 0,
  columnItems,
  counter = 0,
  chip,
  fov = 0,
  scaleBar = 0,
  background = true,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const col = clamp01(column);
  const G = trackGeom(col);
  const N = DATA.num_frames;
  const i = idx < 0 ? -1 : Math.min(N - 1, Math.floor(idx));
  const cur = i >= 0 ? G.P(DATA.stored_xz[i]) : null;

  // push: scale about the focus (the dot by default)
  const s = 1 + 0.05 * E.inOut(clamp01(push));
  const fi = pushFocusIdx ?? i;
  const focus = fi >= 0 ? G.P(DATA.stored_xz[Math.min(N - 1, fi)]) : G.D(AIM_D.dx, AIM_D.z);
  const T = (p: {x: number; y: number}) => ({x: focus.x + (p.x - focus.x) * s, y: focus.y + (p.y - focus.y) * s});
  const xform = s === 1 ? undefined : `translate(${f2(focus.x)} ${f2(focus.y)}) scale(${f2(s * 10000) / 10000}) translate(${f2(-focus.x)} ${f2(-focus.y)})`;

  // layout stages
  const L = clamp01(layout);
  const kWall = E.out(clamp01(L / 0.45));
  const kSensor = clamp01((L - 0.2) / 0.3);
  const kPart = E.out(clamp01((L - 0.35) / 0.4));
  const kPts = (j: number) => {
    const t = clamp01((L - 0.15 - j * 0.02) / 0.25);
    return t <= 0 ? 0 : t >= 1 ? 1 : E.back(t);
  };

  // the blocked sight line: sensor → aim, stopped where it meets the partition line
  const aim = blockedAimIdx !== undefined ? G.P(DATA.stored_xz[Math.max(0, Math.min(N - 1, blockedAimIdx))]) : G.D(AIM_D.dx, AIM_D.z);
  const sx = G.sensor.x;
  const sy = G.sensor.y;
  const uHit = (G.partition.x - 13 - sx) / (aim.x - sx);
  const hit = {x: sx + (aim.x - sx) * uHit, y: sy + (aim.y - sy) * uHit};
  const dirL = Math.hypot(aim.x - sx, aim.y - sy);
  const startOff = 50;
  const bStart = {x: sx + ((aim.x - sx) / dirL) * startOff, y: sy + ((aim.y - sy) / dirL) * startOff};
  const bk = clamp01(blocked);
  const bLine = E.out(clamp01(bk / 0.7));
  const bEnd = {x: lerp(bStart.x, hit.x, bLine), y: lerp(bStart.y, hit.y, bLine)};
  const xk = clamp01((bk - 0.65) / 0.35);

  // the wall points and the field of view
  const wp = DATA.wall_points_xz.map(G.P);
  const wpMinX = Math.min(...wp.map((p) => p.x));
  const wpMaxX = Math.max(...wp.map((p) => p.x));
  const wallMid = {x: (wpMinX + wpMaxX) / 2, y: G.wallY};
  const facing = (Math.atan2(wallMid.x - sx, -(wallMid.y - sy)) * 180) / Math.PI;

  // trail of previously plotted positions
  const dk = clamp01(dot);
  const trailSegs: React.ReactNode[] = [];
  if (cur && dk > 0 && trail > 0) {
    for (let k = 1; k <= trail; k++) {
      const a = i - k * replay.step;
      const b = i - (k - 1) * replay.step;
      if (a < replay.start) break;
      const pa = G.P(DATA.stored_xz[a]);
      const pb = G.P(DATA.stored_xz[b]);
      const age = (k - 1) / trail;
      trailSegs.push(<line key={k} x1={f2(pa.x)} y1={f2(pa.y)} x2={f2(pb.x)} y2={f2(pb.y)} stroke={C.tealDeep} strokeWidth={f2(lerp(13, 5, age))} strokeLinecap="round" opacity={f2(0.9 * (1 - age * 0.72))} />);
    }
  }

  // labels (screen px; anchors follow the push, font sizes do not scale)
  const sensorLab = T({x: sx - 62, y: sy + 22});
  const blockedLab = T({x: G.partition.x - 26, y: hit.y + 112});
  const dotLabAt = T({x: DOT_LABEL.x, y: DOT_LABEL.y});
  const dotLabOp = clamp01(dotLabel) * (1 - clamp01(col * 4)); // gone before the panel narrows under it
  const curT = cur ? T(cur) : null;
  const br = clamp01(labelBrighten);

  // column
  const colGate = clamp01((col - 0.5) * 2);
  const C0 = TRACK_COLUMN;

  return (
    <EvidenceCard headlineT={headline} source={sourceText} sourceT={source} tag="sped up" tagT={spedUp} background={background}>
      <Overlay>
        <defs>
          <clipPath id={`rtb${uid}`}>
            <rect x={G.panel.x0} y={G.panel.y0} width={f2(G.panel.x1 - G.panel.x0)} height={G.panel.y1 - G.panel.y0} rx={PANEL.r} />
          </clipPath>
        </defs>
        {/* the floor panel (not scaled by the push) */}
        <rect x={G.panel.x0} y={G.panel.y0} width={f2(G.panel.x1 - G.panel.x0)} height={G.panel.y1 - G.panel.y0} rx={PANEL.r} fill={C.paper} />
        <g clipPath={`url(#rtb${uid})`}>
          <g transform={xform}>
            {/* the relay wall seen from above: a band of wall colour behind a heavy ink line */}
            <g opacity={f2(kWall)}>
              <rect x={-1000} y={f2(G.wallY - 400)} width={4000} height={400} fill={C.paperLine} />
              <line x1={G.panel.x0 - 60} y1={f2(G.wallY)} x2={f2(lerp(G.panel.x0 - 60, G.panel.x1 + 120, kWall))} y2={f2(G.wallY)} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
            </g>

            {/* pale field of view: sensor → the span of the wall points (optional) */}
            {fov > 0 && <path d={`M ${f2(sx)} ${f2(sy)} L ${f2(wpMinX - 18)} ${f2(G.wallY + 5)} L ${f2(wpMaxX + 18)} ${f2(G.wallY + 5)} Z`} fill={C.saffronLight} opacity={f2(0.7 * E.out(clamp01(fov)))} />}

            {/* the partition (authors' plot constant), running off the panel's bottom edge */}
            {kPart > 0 && (
              <g>
                <line x1={f2(G.partition.x)} y1={f2(G.partition.y0)} x2={f2(G.partition.x)} y2={f2(lerp(G.partition.y0, G.partition.y1, kPart))} stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
                <line x1={f2(G.partition.x)} y1={f2(G.partition.y0)} x2={f2(G.partition.x)} y2={f2(lerp(G.partition.y0, G.partition.y1, kPart))} stroke={C.coral} strokeWidth={13} strokeLinecap="round" />
              </g>
            )}

            {/* the 16 measured wall points (in four overlapping columns: that is the data, seen from above) */}
            {wp.map((p, j) => {
              const k = kPts(j);
              return k > 0 ? <circle key={j} cx={f2(p.x)} cy={f2(p.y)} r={f2(10 * k)} fill={C.saffron} stroke={C.ink} strokeWidth={3} /> : null;
            })}

            {/* the blocked sight line and its X */}
            {bk > 0 && (
              <g>
                <path d={`M ${f2(bStart.x)} ${f2(bStart.y)} L ${f2(bEnd.x)} ${f2(bEnd.y)}`} stroke={C.coralDeep} strokeWidth={6} strokeDasharray="14 12" strokeLinecap="round" fill="none" />
                {xk > 0 && (
                  <g transform={`translate(${f2(hit.x - 4)} ${f2(hit.y)}) scale(${f2(xk)})`}>
                    <path d="M -15 -15 L 15 15 M 15 -15 L -15 15" stroke={C.ink} strokeWidth={12} strokeLinecap="round" />
                    <path d="M -15 -15 L 15 15 M 15 -15 L -15 15" stroke={C.coral} strokeWidth={6} strokeLinecap="round" />
                  </g>
                )}
              </g>
            )}

            {/* the sensor (authors' plot constant), a mounted kit facing the wall points */}
            {kSensor > 0 && (
              <g opacity={f2(clamp01(kSensor * 2))} transform={`translate(${f2(sx)} ${f2(sy)}) rotate(${f2(facing)})`}>
                <KitSensorMark />
              </g>
            )}

            {/* scale bar (optional): 50 cm, bottom-right of the plot */}
            {scaleBar > 0 && (
              <g opacity={f2(clamp01(scaleBar))}>
                {(() => {
                  const y = G.panel.y1 - 40;
                  const x1 = G.panel.x1 - 40;
                  const x0 = x1 - 0.5 * G.K;
                  return (
                    <g>
                      <path d={`M ${f2(x0)} ${y} L ${f2(x1)} ${y} M ${f2(x0)} ${y - 10} L ${f2(x0)} ${y + 10} M ${f2(x1)} ${y - 10} L ${f2(x1)} ${y + 10}`} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
                      <text x={f2((x0 + x1) / 2)} y={y - 18} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={30} fill={C.inkSoft}>
                        50 cm
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}

            {/* the estimated position: trail of previously plotted positions, then the dot (no interpolation) */}
            {cur && dk > 0 && (
              <g opacity={f2(dk)}>
                {trailSegs}
                {br > 0 && br < 1 && <circle cx={f2(cur.x)} cy={f2(cur.y)} r={f2(DOT_R + 6 + 34 * E.out(br))} fill="none" stroke={C.tealDeep} strokeWidth={f2(6 * (1 - br) + 1.5)} opacity={f2(1 - br)} />}
                <circle cx={f2(cur.x)} cy={f2(cur.y)} r={DOT_R} fill={C.teal} stroke={C.ink} strokeWidth={OUTLINE} />
                <circle cx={f2(cur.x - 6)} cy={f2(cur.y - 6)} r={5.5} fill={C.cream} opacity={0.9} />
              </g>
            )}
          </g>
        </g>

        {/* labels: fixed 64 px; their anchors follow the push only */}
        {sensorLabel > 0 && (
          <Label asGroup x={sensorLab.x} y={sensorLab.y} size={64} anchor="end" opacity={sensorLabel * clamp01(kSensor * 2)}>
            sensor
          </Label>
        )}
        {blockedLabel > 0 && (
          <Label asGroup x={blockedLab.x} y={blockedLab.y} size={64} anchor="end" color={C.coralDeep} opacity={blockedLabel}>
            blocked
          </Label>
        )}
        {dotLabOp > 0 && (
          <Label asGroup x={dotLabAt.x} y={dotLabAt.y} size={64} anchor="end" opacity={dotLabOp} highlight={Math.sin(Math.PI * br)} leader={curT && dk > 0 ? {x: curT.x, y: curT.y, gap: DOT_R * s + 10, color: C.ink} : undefined}>
            estimated position
          </Label>
        )}
      </Overlay>

      {/* provenance column (V10.2): items in a fixed stack, each fading in with its own t */}
      {colGate > 0 && (columnItems?.length || counter > 0 || chip) && (
        <div style={{position: 'absolute', left: C0.x0, top: C0.y0, width: C0.x1 - C0.x0, display: 'flex', flexDirection: 'column', gap: C0.gap}}>
          {(columnItems ?? []).map((it, j) => (
            <div key={j} style={{fontFamily: F.body, fontWeight: 800, fontSize: it.size ?? 40, lineHeight: 1.18, color: C.ink, opacity: f2(clamp01(it.t) * colGate)}}>
              {it.text}
            </div>
          ))}
          {counter > 0 && (
            <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 30, lineHeight: 1.2, color: C.inkSoft, opacity: f2(clamp01(counter) * colGate)}}>{`frame ${Math.max(0, i) + 1} of ${N}`}</div>
          )}
          {chip && (
            <div style={{position: 'relative', opacity: f2(clamp01(chip.t) * colGate)}}>
              <Chip x={0} y={0} size={30} maxWidth={C0.x1 - C0.x0} style={{position: 'relative'}}>
                {chip.text}
              </Chip>
            </div>
          )}
        </div>
      )}
    </EvidenceCard>
  );
};

/** The kit sensor seen from above (mounted, no grip): teal box, front window toward local −y. */
const KitSensorMark: React.FC = () => (
  <g>
    <rect x={-40} y={-22} width={86} height={52} rx={12} fill={C.shadow} />
    <rect x={-44} y={-27} width={88} height={54} rx={12} fill={C.teal} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={-26} y={-34} width={52} height={16} rx={6} fill={C.coral} stroke={C.ink} strokeWidth={3.5} />
    <rect x={-30} y={6} width={60} height={10} rx={5} fill={C.tealDeep} />
  </g>
);
