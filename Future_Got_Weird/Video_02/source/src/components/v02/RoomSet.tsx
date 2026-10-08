import React from 'react';
import {interpolateColors} from 'remotion';
import {C, OUTLINE} from '../../theme';
import {rand} from '../../lib/anim';
import {
  Box,
  DEFAULT_VIEW,
  DepthItem,
  LAYOUT,
  Layout,
  PlanPt,
  SLAB_T,
  ViewConfig,
  ViewState,
  WALL_T,
  depthSort,
  figureMix,
  occluderBox,
  projectWith,
  smoothstep,
  viewAt,
} from '../../lib/room';
import {Partition} from './Partition';

/**
 * RoomSet: the one room of the episode, drawn from layout.json through lib/room's projection.
 *
 * tilt 0 = the dollhouse room view: a cut-away room on the paper backdrop. Plain matte relay wall (back, z = 0) with a
 * cream skirting board, the right side wall (the oblique camera stands front-left, so we see its inner face) with a
 * door near the front, a wood floor with a few wide planks, the coral partition, a potted plant in the back-left
 * corner for scale. The left side and the front are open so nothing ever blocks the view; walls and floor are slabs
 * with cream cut edges. Door and plant are > 0.6 m from every S -> W -> H path of the layout, and the plant's leaves
 * stay clear of the wall samples (and their labels) at every tilt.
 *
 * During the tilt: planks fade (0.4..0.8), the floor turns to the cream board (0.55..0.95), the side-wall door and
 * skirting fade while that wall is still broad (gone by ~0.75), wall tops and cut ends go cream -> ink (0.78..0.97),
 * the plan door gap and the 0.5 m ticks fade in (0.75..1 / 0.78..1).
 *
 * tilt 1 = the PlanBoard: a cream board on the paper, ink wall lines (relay wall and right wall, with the door as a
 * gap), faint 0.5 m ticks along the relay wall only, the partition as a thick coral bar. No grid.
 *
 * Everything in between is the same geometry seen from a rising camera, so it can be animated continuously.
 *
 * Slots, all in world px (the same 1920x1080 space the projection maps to; wrap the whole set and every projected
 * overlay in one camera <Layer>):
 *  - `backdrop`: drawn on the room shell (wall/floor decals: light spots, floor marks, light paths), behind everything
 *    standing: people, the partition and the plant then hide exactly the stretches they stand in front of.
 *  - `items`: things standing in the room, painted far -> near with depthSort (partition and plant included).
 *  - `children`: overlays on top of everything (light paths, labels).
 */
export type RoomItem = DepthItem & {key?: string; node: React.ReactNode};

export type RoomSetProps = {
  tilt: number;
  items?: RoomItem[];
  backdrop?: React.ReactNode;
  children?: React.ReactNode;
  /** draw the partition (default true) */
  partition?: boolean;
  /** comic nudge of the partition, about -1..1 */
  wobble?: number;
  /** door on the right side wall, near the front (default true) */
  door?: boolean;
  /** potted plant: true = the default spot in the back-left corner (PLANT), false = none, or a custom spot */
  plant?: boolean | {x: number; z: number; heightM?: number};
  view?: ViewConfig;
  layout?: Layout;
  /**
   * Opt-in (metres, default 0): continue the relay wall, its skirting and wall top, the floor, the slab's front face and
   * the drop shadow this far LEFT of the room's left end (x0 - extendLeft), and drop the left cut ends (the slab's side
   * face and the wall's end cap), so a framing that looks past the open left end sees wall and floor running on out of
   * frame. The room's layout (x0) and the existing planks are unchanged; the extension gets its own planks (own seeds).
   * Turn it on only once the left end is out of frame (a cut-away end that pops to a continued wall would show).
   */
  extendLeft?: number;
  /**
   * Opt-in (metres, default 0): the right-hand counterpart for a framing that looks past the room's RIGHT end. The relay
   * wall, its skirting, the floor, the slab's front face and the drop shadow run on to xR = x1 + extendRight, the wall
   * top covers the relay wall's strip only, and the right side wall goes: its inner face, its skirting, the door on it,
   * the plan's door gap and its front cut-end cap are not drawn. The extension gets planks of the same width with their
   * own seeds (the existing planks are unchanged). Use it only on a framing that never shows the side wall (it is
   * removed, not continued) and whose frame never reaches xR (the set's new right end), e.g. a fixed card framing.
   * With 0 the set is drawn exactly as before.
   */
  extendRight?: number;
};

/* palette for the set (light, warm, flat) */
export const ROOM_COLORS = {
  backdrop: C.paper,
  relayWall: '#F5E4C6',
  sideWall: '#EAD2AC',
  cut: C.cream,
  skirting: C.cream,
  floor: C.woodLight,
  plank: C.wood,
  slabFront: C.wood,
  slabSide: C.woodDeep,
  board: C.cream,
  door: C.blueLight,
  doorPanel: C.blue,
  leaf: '#4F9A6B',
  leafDeep: '#3B7C53',
  pot: C.blue,
  potRim: C.blueDeep,
  soil: '#6B4A2E',
};

// wall and slab thickness live in lib/room (roomBounds uses them too); re-exported here for set code
export {WALL_T};
const SKIRT_H = 0.1;
const PLANK_W = 0.55; // 8 wide planks across 4.4 m
/** Door on the right side wall (x = room.x1): z range and height (m). Far from every light path. */
export const DOOR = {z0: 2.35, z1: 3.2, h: 2.0};
/** Plant in the back-left corner (plan position and height, m). Its leaves stay left of W1's label at every tilt. */
export const PLANT = {x: 0.4, z: 0.32, heightM: 1.3};

type P3 = [number, number, number];

export const RoomSet: React.FC<RoomSetProps> = ({tilt, items = [], backdrop, children, partition = true, wobble = 0, door = true, plant = true, view = DEFAULT_VIEW, layout = LAYOUT, extendLeft = 0, extendRight = 0}) => {
  const s = viewAt(tilt, view);
  const {x0, x1, z0, z1, wallHeight: HW} = layout.room;
  const T = WALL_T;
  // extendLeft: the shell (wall, skirting, wall top, floor, slab front, shadow) starts at xL; x0 stays the room's end
  const ext = Math.max(0, extendLeft);
  const xL = x0 - ext;
  // extendRight: the relay wall's shell runs to xR and the right side wall is not drawn (extR 0: exactly the old set,
  // whose floor, slab front and shadow end under the side wall at x1 + T and whose relay wall ends at x1)
  const extR = Math.max(0, extendRight);
  const xR = x1 + extR;
  const xFloorR = extR > 0 ? xR : x1 + T;
  const xWallR = extR > 0 ? xR : x1;
  const sideWall = extR === 0;
  const d = (pts: P3[], closed = true) =>
    pts.map(([x, z, h], i) => {
      const q = projectWith(s, {x, z, h});
      return `${i ? 'L' : 'M'} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`;
    }).join(' ') + (closed ? ' Z' : '');
  const P = (x: number, z: number, h = 0) => projectWith(s, {x, z, h});

  const faces = s.height > 0.004; // vertical faces still have area
  const planT = smoothstep(0.55, 0.95, tilt); // wood floor -> paper board
  const inkT = smoothstep(0.78, 0.97, tilt); // cream wall tops -> ink wall lines (late and quick: no long grey phase)
  const plankOp = 1 - smoothstep(0.4, 0.8, tilt);
  const tickOp = smoothstep(0.78, 1, tilt);
  // side-wall door: gone by tilt ~0.75 (height scale 0.32), before the side wall turns into a thin sliver
  const doorOp = smoothstep(0.32, 0.55, s.height);
  const floorColor = interpolateColors(planT, [0, 1], [ROOM_COLORS.floor, ROOM_COLORS.board]);
  const topColor = interpolateColors(inkT, [0, 1], [ROOM_COLORS.cut, C.ink]);
  const ink = {stroke: C.ink, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const};

  // planks: a few wide boards running toward the wall, with staggered end joints (seeded, static)
  const plankLines: React.ReactNode[] = [];
  if (plankOp > 0.001) {
    const n = Math.round((x1 - x0) / PLANK_W);
    const pw = (x1 - x0) / n;
    for (let k = 1; k < n; k++) {
      const a = P(x0 + k * pw, z0);
      const b = P(x0 + k * pw, z1);
      plankLines.push(<line key={`pl${k}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />);
    }
    for (let k = 0; k < n; k++) {
      const joints = [0.35 + rand(k * 7 + 3) * 1.1, 1.9 + rand(k * 13 + 5) * 1.2];
      joints.forEach((zj, j) => {
        const a = P(x0 + k * pw + 0.02, z0 + zj);
        const b = P(x0 + (k + 1) * pw - 0.02, z0 + zj);
        plankLines.push(<line key={`pj${k}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />);
      });
    }
    // extendLeft: planks of the same width continuing left from x0 (the room's left end becomes a plank seam), with
    // their own joint seeds; the last one is cut at xL
    for (let k = 0; ext > 0 && x0 - k * pw > xL + 1e-6; k++) {
      const xr = x0 - k * pw;
      const xl = Math.max(xL, xr - pw);
      const a = P(xr, z0);
      const b = P(xr, z1);
      plankLines.push(<line key={`xl${k}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />);
      if (xr - xl < 0.1) continue;
      const joints = [0.35 + rand(1000 + k * 7 + 3) * 1.1, 1.9 + rand(1000 + k * 13 + 5) * 1.2];
      joints.forEach((zj, j) => {
        const pa = P(xl + (xl > xL ? 0.02 : 0), z0 + zj);
        const pb = P(xr - 0.02, z0 + zj);
        plankLines.push(<line key={`xj${k}-${j}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} />);
      });
    }
    // extendRight: planks of the same width continuing right from x1 (the room's right end becomes a plank seam), with
    // their own joint seeds; the last one is cut at xR
    for (let k = 0; extR > 0 && x1 + k * pw < xR - 1e-6; k++) {
      const xl = x1 + k * pw;
      const xr = Math.min(xR, xl + pw);
      const a = P(xl, z0);
      const b = P(xl, z1);
      plankLines.push(<line key={`xr${k}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />);
      if (xr - xl < 0.1) continue;
      const joints = [0.35 + rand(2000 + k * 7 + 3) * 1.1, 1.9 + rand(2000 + k * 13 + 5) * 1.2];
      joints.forEach((zj, j) => {
        const pa = P(xl + 0.02, z0 + zj);
        const pb = P(xr - (xr < xR ? 0.02 : 0), z0 + zj);
        plankLines.push(<line key={`xk${k}-${j}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} />);
      });
    }
  }

  // skirting runs (side wall interrupted by the door)
  const sideSkirt: [number, number][] = door ? [[z0, DOOR.z0 - 0.08], [DOOR.z1 + 0.08, z1]] : [[z0, z1]];

  // plan ticks: every 0.5 m along the relay wall, outside the room
  const ticks: React.ReactNode[] = [];
  if (tickOp > 0.001) {
    for (let x = x0; x <= x1 + 1e-6; x += 0.5) {
      const a = P(x, z0 - T - 0.03, HW);
      const b = P(x, z0 - T - (Math.abs((x - x0) % 1) < 1e-6 ? 0.16 : 0.1), HW);
      ticks.push(<line key={`t${x.toFixed(1)}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />);
    }
  }

  // diorama drop shadow: slab footprint, pushed down-right a touch
  const shadow = d([[xL, z0 - T, -SLAB_T], [xFloorR, z0 - T, -SLAB_T], [xFloorR, z1, -SLAB_T], [xL, z1, -SLAB_T]]);

  // the standing things: user items + partition + plant
  const occ = occluderBox(layout);
  const all: RoomItem[] = [...items];
  if (partition) all.push({key: '__partition', z: (occ.z0 + occ.z1) / 2, box: occ as Box, node: <Partition tilt={tilt} wobble={wobble} view={view} layout={layout} />});
  if (plant) {
    const pl = plant === true ? PLANT : {x: plant.x, z: plant.z, heightM: plant.heightM ?? PLANT.heightM};
    all.push({key: '__plant', x: pl.x, z: pl.z, w: 0.45 * (pl.heightM / 1.45), height: pl.heightM, node: <PottedPlant x={pl.x} z={pl.z} tilt={tilt} view={view} heightM={pl.heightM} />});
  }
  const sorted = depthSort(all, tilt, view);

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {/* paper backdrop, far past the frame */}
        <rect x={-4000} y={-4000} width={12000} height={12000} fill={ROOM_COLORS.backdrop} />
        <path d={shadow} fill={C.shadow} transform="translate(10 14)" />

        {/* floor slab edges (front, left) */}
        {faces && <path d={d([[xL, z1, 0], [xFloorR, z1, 0], [xFloorR, z1, -SLAB_T], [xL, z1, -SLAB_T]])} fill={ROOM_COLORS.slabFront} {...ink} />}
        {faces && ext === 0 && <path d={d([[x0, z0 - T, 0], [x0, z1, 0], [x0, z1, -SLAB_T], [x0, z0 - T, -SLAB_T]])} fill={ROOM_COLORS.slabSide} {...ink} />}
        {/* floor */}
        <path d={d([[xL, z0 - T, 0], [xFloorR, z0 - T, 0], [xFloorR, z1, 0], [xL, z1, 0]])} fill={floorColor} {...ink} />
        <g stroke={ROOM_COLORS.plank} strokeWidth={3} strokeLinecap="round" opacity={plankOp}>
          {plankLines}
        </g>

        {faces && (
          <g>
            {/* relay wall: plain matte face */}
            <path d={d([[xL, z0, 0], [xWallR, z0, 0], [xWallR, z0, HW], [xL, z0, HW]])} fill={ROOM_COLORS.relayWall} {...ink} />
            {/* right side wall, inner face (not drawn with extendRight) */}
            {sideWall && <path d={d([[x1, z0, 0], [x1, z1, 0], [x1, z1, HW], [x1, z0, HW]])} fill={ROOM_COLORS.sideWall} {...ink} />}
            {/* skirting boards */}
            <path d={d([[xL, z0 + 0.012, 0], [xWallR, z0 + 0.012, 0], [xWallR, z0 + 0.012, SKIRT_H], [xL, z0 + 0.012, SKIRT_H]])} fill={ROOM_COLORS.skirting} {...ink} strokeWidth={3} />
            {/* side-wall skirting fades with the door: on an edge-on wall its ends would read as notches in the wall line */}
            {sideWall && doorOp > 0.001 && (
              <g opacity={doorOp}>
                {sideSkirt.map(([a, b], i) => (
                  <path key={`ss${i}`} d={d([[x1 - 0.012, a, 0], [x1 - 0.012, b, 0], [x1 - 0.012, b, SKIRT_H], [x1 - 0.012, a, SKIRT_H]])} fill={ROOM_COLORS.skirting} {...ink} strokeWidth={3} />
                ))}
              </g>
            )}
            {/* door on the side wall */}
            {/* (fades while the side wall is still broad: an edge-on door would only read as a stray sliver) */}
            {sideWall && door && doorOp > 0.001 && (
              <g opacity={doorOp}>
                <DoorOnSideWall s={s} x={x1 - 0.006} />
              </g>
            )}
            {/* cut ends of the walls: the same colour as the wall tops, so they merge into the plan's ink wall lines */}
            {ext === 0 && <path d={d([[x0, z0 - T, 0], [x0, z0, 0], [x0, z0, HW], [x0, z0 - T, HW]])} fill={topColor} {...ink} />}
            {sideWall && <path d={d([[x1, z1, 0], [x1 + T, z1, 0], [x1 + T, z1, HW], [x1, z1, HW]])} fill={topColor} {...ink} />}
          </g>
        )}
        {/* wall tops: cream cut edges in the room view, the ink wall lines of the plan (extendRight: the relay wall's
            strip only) */}
        {sideWall ? (
          <path d={d([[xL, z0 - T, HW], [x1 + T, z0 - T, HW], [x1 + T, z1, HW], [x1, z1, HW], [x1, z0, HW], [xL, z0, HW]])} fill={topColor} {...ink} />
        ) : (
          <path d={d([[xL, z0 - T, HW], [xR, z0 - T, HW], [xR, z0, HW], [xL, z0, HW]])} fill={topColor} {...ink} />
        )}
        {/* plan: the door as a gap in the side wall line, with the closed door leaf in it */}
        {sideWall && door && planT > 0.001 && (
          <g opacity={smoothstep(0.75, 1, tilt)}>
            <path d={d([[x1 - 0.01, DOOR.z0, HW], [x1 + T + 0.01, DOOR.z0, HW], [x1 + T + 0.01, DOOR.z1, HW], [x1 - 0.01, DOOR.z1, HW]])} fill={ROOM_COLORS.board} />
            <path d={d([[x1 + T * 0.28, DOOR.z0, HW], [x1 + T * 0.72, DOOR.z0, HW], [x1 + T * 0.72, DOOR.z1, HW], [x1 + T * 0.28, DOOR.z1, HW]])} fill={ROOM_COLORS.door} stroke={C.ink} strokeWidth={2.5} />
            <path d={d([[x1, DOOR.z0 - 0.002, HW], [x1 + T, DOOR.z0 - 0.002, HW]], false)} stroke={C.ink} strokeWidth={OUTLINE} />
            <path d={d([[x1, DOOR.z1 + 0.002, HW], [x1 + T, DOOR.z1 + 0.002, HW]], false)} stroke={C.ink} strokeWidth={OUTLINE} />
          </g>
        )}
        {/* plan: faint 0.5 m ticks along the relay wall only */}
        <g stroke={C.inkMuted} strokeWidth={3} strokeLinecap="round" opacity={tickOp * 0.85}>
          {ticks}
        </g>
      </svg>

      {backdrop}

      {sorted.map((it, i) => (
        <div key={it.key ?? `item${i}`} style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>
          {it.node}
        </div>
      ))}

      {children}
    </div>
  );
};

/** Door, casing and knob drawn on the side wall's inner face (plane x = const). */
const DoorOnSideWall: React.FC<{s: ViewState; x: number}> = ({s, x}) => {
  const d = (pts: [number, number][]) =>
    pts.map(([z, h], i) => {
      const q = projectWith(s, {x, z, h});
      return `${i ? 'L' : 'M'} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`;
    }).join(' ') + ' Z';
  const rect = (za: number, zb: number, ha: number, hb: number): [number, number][] => [[za, ha], [zb, ha], [zb, hb], [za, hb]];
  const {z0, z1, h} = DOOR;
  const ink = {stroke: C.ink, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const};
  // the knob is a disc ON the wall plane (foreshortens with it): wall-plane (z, h) metres -> world px
  const o = projectWith(s, {x, z: 0, h: 0});
  const knobM = `matrix(${s.ppm * s.shear} ${s.ppm * s.floor} 0 ${-s.ppm * s.height} ${o.x} ${o.y})`;
  return (
    <g>
      <path d={d(rect(z0 - 0.08, z1 + 0.08, 0, h + 0.08))} fill={ROOM_COLORS.cut} {...ink} />
      <path d={d(rect(z0, z1, 0, h))} fill={ROOM_COLORS.door} {...ink} />
      <path d={d(rect(z0 + 0.12, z1 - 0.12, 1.12, h - 0.14))} fill="none" stroke={ROOM_COLORS.doorPanel} strokeWidth={3} strokeLinejoin="round" />
      <path d={d(rect(z0 + 0.12, z1 - 0.12, 0.16, 0.88))} fill="none" stroke={ROOM_COLORS.doorPanel} strokeWidth={3} strokeLinejoin="round" />
      <circle transform={knobM} cx={z1 - 0.13} cy={1.0} r={0.035} fill={C.saffron} stroke={C.ink} strokeWidth={3} vectorEffect="non-scaling-stroke" />
    </g>
  );
};

/**
 * A potted plant for scale. Upright cutout in the room view (uniform scale, never squashed), a top-down rosette in the
 * plan view, crossfading with the same timing as the characters (figureMix).
 */
export const PottedPlant: React.FC<{x: number; z: number; tilt: number; view?: ViewConfig; heightM?: number}> = ({x, z, tilt, view = DEFAULT_VIEW, heightM = PLANT.heightM}) => {
  const s = viewAt(tilt, view);
  const m = figureMix(tilt);
  const foot = projectWith(s, {x, z, h: 0});
  // px per metre for the cutout: on the set's height scale like the rigs (lib/room rigScale), uniformly
  const k = Math.max(1e-3, (s.ppm * s.height * heightM) / 1.45);
  const sw = OUTLINE / k;
  const top = projectWith(s, {x, z, h: 0.75 * (heightM / 1.45)});
  const r = s.ppm; // px per metre, plan rosette
  // leaves (drawn at a 1.45 m design height, then scaled): angle from vertical (deg), stem length, leaf length, leaf
  // half-width (m). Upright habit: the half-span is ~0.48 m at design height (~0.43 m at the default 1.3 m).
  const leaves: [number, number, number, number][] = [
    [-48, 0.2, 0.38, 0.12],
    [46, 0.22, 0.38, 0.12],
    [-28, 0.42, 0.42, 0.14],
    [26, 0.44, 0.42, 0.14],
    [-9, 0.62, 0.42, 0.14],
    [11, 0.58, 0.42, 0.13],
  ];
  const leafPath = (L: number, w: number) => `M 0 0 Q ${w * 1.25} ${-L * 0.45} 0 ${-L} Q ${-w * 1.25} ${-L * 0.45} 0 0 Z`;
  const base = -0.42;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {m.rig > 0.001 && (
        <g opacity={m.rig} transform={`translate(${foot.x} ${foot.y}) scale(${k * m.rigScaleX} ${k * m.rigScaleY})`}>
          <ellipse cx={0} cy={0} rx={0.3} ry={0.045} fill={C.shadow} />
          {/* stems */}
          {leaves.map(([a, st], i) => {
            const ar = (a * Math.PI) / 180;
            return <line key={`so${i}`} x1={0} y1={base} x2={Math.sin(ar) * st} y2={base - Math.cos(ar) * st} stroke={C.ink} strokeWidth={sw * 2.6} strokeLinecap="round" />;
          })}
          {leaves.map(([a, st], i) => {
            const ar = (a * Math.PI) / 180;
            return <line key={`si${i}`} x1={0} y1={base} x2={Math.sin(ar) * st} y2={base - Math.cos(ar) * st} stroke={ROOM_COLORS.leafDeep} strokeWidth={sw * 0.9} strokeLinecap="round" />;
          })}
          {/* leaves */}
          {leaves.map(([a, st, L, w], i) => {
            const ar = (a * Math.PI) / 180;
            const bx = Math.sin(ar) * st;
            const by = base - Math.cos(ar) * st;
            const spread = a * 0.25;
            return (
              <g key={`l${i}`} transform={`translate(${bx} ${by}) rotate(${a + spread})`}>
                <path d={leafPath(L, w)} fill={ROOM_COLORS.leaf} stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />
                <path d={`M 0 ${-L * 0.08} L 0 ${-L * 0.8}`} stroke={ROOM_COLORS.leafDeep} strokeWidth={sw * 0.75} strokeLinecap="round" />
              </g>
            );
          })}
          {/* pot */}
          <path d="M -0.19 -0.36 L 0.19 -0.36 L 0.15 -0.03 Q 0.145 0 0.12 0 L -0.12 0 Q -0.145 0 -0.15 -0.03 Z" fill={ROOM_COLORS.pot} stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />
          <rect x={-0.225} y={-0.44} width={0.45} height={0.1} rx={0.03} fill={ROOM_COLORS.potRim} stroke={C.ink} strokeWidth={sw} />
        </g>
      )}
      {m.token > 0.001 && (
        <g opacity={m.token} transform={`translate(${top.x} ${top.y}) scale(${m.tokenScale})`}>
          <circle cx={0} cy={0} r={0.2 * r} fill={ROOM_COLORS.potRim} stroke={C.ink} strokeWidth={OUTLINE} />
          <circle cx={0} cy={0} r={0.15 * r} fill={ROOM_COLORS.soil} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const a = i * (360 / 7) + 12;
            const L = (0.29 + 0.04 * rand(i + 41)) * r;
            const w = 0.1 * r;
            return (
              <g key={i} transform={`rotate(${a})`}>
                <path d={leafPath(L, w)} fill={ROOM_COLORS.leaf} stroke={C.ink} strokeWidth={OUTLINE * 0.8} strokeLinejoin="round" />
                <path d={`M 0 ${-L * 0.1} L 0 ${-L * 0.78}`} stroke={ROOM_COLORS.leafDeep} strokeWidth={3} strokeLinecap="round" />
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
};

/** Re-exported for scenes that build their own item lists. */
export type {PlanPt};

/**
 * The opening between the partition's far end and the relay wall, marked in INK on the floor (a construction aid:
 * never the light's saffron): the partition's line continued to the wall as a dashed threshold over a pale floor patch.
 * Put it in RoomSet's `backdrop` (the stand, the people and the partition paint over it). `t` 0..1 draws it on from the
 * wall; with a moved layout (S9's push) it shrinks with the gap and vanishes when the far end meets the wall.
 * Opt-in (defaults unchanged): `patchOpacity` (default 0.55) for a brighter patch; `outline` adds a 3 px inkMuted dashed
 * edge round the patch (ink and white only, PATH_LEGIBILITY_PLAN).
 */
export const GapMarker: React.FC<{tilt: number; t: number; layout?: Layout; view?: ViewConfig; halfW?: number; patchOpacity?: number; outline?: boolean}> = ({tilt, t, layout = LAYOUT, view = DEFAULT_VIEW, halfW = 0.12, patchOpacity = 0.55, outline = false}) => {
  const o = layout.occluder;
  const zEnd = o.z0 - 0.02;
  if (t <= 0 || zEnd < 0.04) return null;
  const s = viewAt(tilt, view);
  const P = (x: number, z: number) => projectWith(s, {x, z, h: 0});
  const d = (pts: {x: number; y: number}[]) => pts.map((q, i) => `${i ? 'L' : 'M'} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`).join(' ') + ' Z';
  const a = P(o.x, 0.01);
  const b = P(o.x, 0.01 + (zEnd - 0.01) * Math.min(1, t));
  const patch = d([P(o.x - halfW, 0.02), P(o.x + halfW, 0.02), P(o.x + halfW, zEnd), P(o.x - halfW, zEnd)]);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <path d={patch} fill={C.white} opacity={patchOpacity * Math.min(1, t)} />
      {outline && <path d={patch} fill="none" stroke={C.inkMuted} strokeWidth={3} strokeDasharray="10 8" strokeLinejoin="round" opacity={Math.min(1, t)} />}
      <path d={`M ${a.x.toFixed(2)} ${a.y.toFixed(2)} L ${b.x.toFixed(2)} ${b.y.toFixed(2)}`} stroke={C.inkMuted} strokeWidth={4} strokeDasharray="12 9" strokeLinecap="round" fill="none" />
    </svg>
  );
};
