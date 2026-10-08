import React from 'react';
import {AbsoluteFill} from 'remotion';
import layoutJson from '../../data/layout.json';
import {C} from '../../theme';
import {Camera, Layer} from '../../lib/camera';
import {HANDOFF} from '../../lib/shots';
import {figureMix, projectWith, tokenAt, viewAt} from '../../lib/room';
import {possibleCloud, type P2, type ScalarField} from '../../lib/optics';
import {RoomSet, type RoomItem} from './RoomSet';
import {CheckerToken, GuesserToken} from './Tokens';
import {PossibleCloud} from './Optics';
import {SensorTop, facingOf} from './HandheldSensor';
import {LIKELY_CLOUD, LIKELY_DIM, LIKELY_RING, LikelyRing} from './S4_Parts';

/**
 * S5 only: the plan board exactly as S4 leaves it (HANDOFF.S4S5): RoomSet at tilt 1 framed by CAM_PLAN_ACT, the two
 * overhead tokens, the sensor glyph at S and the teal likely-location blob from the same four ±3.75 cm bands S4 uses
 * (layout.json frame A, confocal circles). Labels and wall spots are already cleared at the hand-off.
 * Review r1 D28: the blob, its marker ring and his dimmed token use S4_Parts' LIKELY_* values, the same ones S4 draws
 * with, so S4's last frame and S5's first stay pixel-identical (the S4 builder owns this file).
 *
 * Plus the paper scroll the board rolls up into (`ScrollRoll`), drawn in world px.
 */

const L = layoutJson;
const Hp: P2 = {x: L.hidden.x, z: L.hidden.z};
const Sp: P2 = {x: L.sensor.x, z: L.sensor.z};
const OPp: P2 = {x: L.operator.x, z: L.operator.z};
const WALL: P2[] = L.wallSamples.map((w) => ({x: w.x, z: L.relayWall.z}));
const RADII = L.confocalA.map((c) => c.circle_radius_m);
/** the same field S4 settles on at s24 (grid and bands copied from S4's FINAL_FIELD) */
const FINAL_FIELD: ScalarField = possibleCloud({x0: 2.2, x1: 3.0, z0: 0.5, z1: 1.2, step: 0.008}, WALL.map((w, i) => ({W: w, r: RADII[i], halfWidth: L.bandHalfWidth.oneBin})));

export const PlanBoard: React.FC = () => {
  const tilt = 1;
  const st = viewAt(tilt);
  const mix = figureMix(tilt);
  const toW = (p: P2) => {
    const q = projectWith(st, {x: p.x, z: p.z, h: 0});
    return {x: q.x, y: q.y};
  };
  const tokOp = tokenAt(OPp.x, OPp.z, tilt);
  const tokH = tokenAt(Hp.x, Hp.z, tilt);
  const sW = projectWith(st, {x: Sp.x, z: Sp.z, h: L.sensor.h});
  const opFacing = facingOf(sW.x - tokOp.x, sW.y - tokOp.y);
  const aim = projectWith(st, {x: L.sensor.aimX, z: L.relayWall.z, h: L.sensor.h});
  const sensorFacing = facingOf(aim.x - sW.x, aim.y - sW.y);

  const items: RoomItem[] = [
    {
      key: 'stand',
      x: Sp.x,
      z: Sp.z,
      w: 0.24,
      height: 1.35,
      node: (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <SensorTop asGroup x={sW.x} y={sW.y} size={0.22 * st.ppm} facing={sensorFacing} opacity={mix.token} scale={mix.tokenScale} />
        </svg>
      ),
    },
  ];
  const backdrop = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <GuesserToken asGroup x={tokH.x} y={tokH.y} size={2 * tokH.r} scale={tokH.scale} opacity={tokH.opacity * LIKELY_DIM} facing={200} />
      <PossibleCloud asGroup toPx={toW} field={FINAL_FIELD} t={1} tone="teal" {...LIKELY_CLOUD} />
      <LikelyRing cx={toW(Hp).x} cy={toW(Hp).y} r={LIKELY_RING.rM * st.ppm} t={1} k={1 / HANDOFF.S4S5.cam.zoom} />
    </svg>
  );
  const top = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <CheckerToken asGroup x={tokOp.x} y={tokOp.y} size={2 * tokOp.r} scale={tokOp.scale} opacity={tokOp.opacity} facing={opFacing} />
    </svg>
  );
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Camera cam={HANDOFF.S4S5.cam}>
        <Layer depth={1}>
          <RoomSet tilt={tilt} items={items} backdrop={backdrop}>
            {top}
          </RoomSet>
        </Layer>
      </Camera>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ the scroll */

const f2 = (n: number) => Math.round(n * 100) / 100;

/**
 * A rolled paper sheet seen from the front and a little from the right: a horizontal cylinder of length `len` and
 * radius `r` centred on (cx, cy) in the parent's px; the right end shows the wound spiral (rotating with `spin`, rad),
 * the left end is the cylinder's silhouette. `sw` = ink outline width in the parent's px.
 */
export const ScrollRoll: React.FC<{cx: number; cy: number; len: number; r: number; spin?: number; sw?: number; sx?: number; sy?: number}> = ({cx, cy, len, r, spin = 0, sw = 4, sx = 1, sy = 1}) => {
  const x0 = -len / 2;
  const x1 = len / 2;
  const ex = Math.max(4, r * 0.3); // ellipse half-width of the end faces
  // spiral on the right end face
  const pts: string[] = [];
  const turns = 2.6;
  const n = 64;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const th = u * turns * Math.PI * 2 + spin;
    const rr = r * (0.18 + 0.66 * u);
    pts.push(`${i ? 'L' : 'M'} ${f2(x1 + rr * 0.3 * Math.cos(th))} ${f2(rr * Math.sin(th))}`);
  }
  const body = `M ${f2(x0)} ${f2(-r)} L ${f2(x1)} ${f2(-r)} A ${f2(ex)} ${f2(r)} 0 0 1 ${f2(x1)} ${f2(r)} L ${f2(x0)} ${f2(r)} A ${f2(ex)} ${f2(r)} 0 0 1 ${f2(x0)} ${f2(-r)} Z`;
  return (
    <g transform={`translate(${f2(cx)} ${f2(cy)}) scale(${f2(sx)} ${f2(sy)})`}>
      {/* soft contact shadow under the roll */}
      <ellipse cx={0} cy={r * 0.92} rx={len / 2} ry={Math.max(3, r * 0.22)} fill={C.shadow} />
      <path d={body} fill={C.paper} />
      {/* flat light band near the top and a flat shade band at the bottom (cutout shading, no gradient) */}
      <rect x={x0} y={-r * 0.72} width={len} height={r * 0.32} fill={C.cream} />
      <rect x={x0} y={r * 0.42} width={len} height={r * 0.58} fill={C.paperDeep} />
      {/* the sheet's free edge running along the roll */}
      <line x1={x0 + ex * 0.5} y1={r * 0.18} x2={x1 - ex * 0.2} y2={r * 0.18} stroke={C.paperLine} strokeWidth={sw * 0.8} strokeLinecap="round" />
      <path d={body} fill="none" stroke={C.ink} strokeWidth={sw} strokeLinejoin="round" />
      <ellipse cx={x1} cy={0} rx={ex} ry={r} fill={C.paperDeep} stroke={C.ink} strokeWidth={sw} />
      <path d={pts.join(' ')} fill="none" stroke={C.ink} strokeWidth={sw * 0.6} strokeLinecap="round" opacity={0.75} />
    </g>
  );
};
