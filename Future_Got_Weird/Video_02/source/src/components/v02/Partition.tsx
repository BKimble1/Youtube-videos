import React from 'react';
import {interpolateColors} from 'remotion';
import {C, OUTLINE} from '../../theme';
import {DEFAULT_VIEW, LAYOUT, Layout, PARTITION_ARCH, PARTITION_FOOT_H, PlanPt, ViewConfig, ViewState, hull, projectWith, smoothstep, viewAt} from '../../lib/room';

/**
 * The partition: a coral three-panel folding screen on stubby feet, standing on the floor along the z axis at
 * layout.occluder (perpendicular to the relay wall). Opaque, 2 m tall (taller than a person).
 *
 * Room view: we look almost along it, so we see its long side face (the face turned toward the camera, i.e. the
 * sensor's side) as a tall receding panel, plus its near end and its scalloped top (one gentle arch per panel, so
 * it reads as a folding screen even edge-on). Plan view (tilt 1): a thick coral bar with an ink outline exactly on the
 * occluder footprint (never thinner than 18 px so it reads).
 *
 * `wobble` (about -1..1, e.g. from motion.ring()) leans the screen about its base by up to 6 degrees for a comic
 * nudge: positive leans toward +x (toward H). The physics (layout) never moves; this is acting.
 *
 * Renders one full-world <svg> (1920x1080, overflow visible): put it in a RoomSet item or any world-px layer.
 */
export type PartitionProps = {
  tilt: number;
  /** comic lean, about -1..1 (1 = 6 degrees toward +x) */
  wobble?: number;
  view?: ViewConfig;
  layout?: Layout;
  opacity?: number;
  style?: React.CSSProperties;
};

const FOOT_H = PARTITION_FOOT_H; // panels stand this high on their feet (shared with lib/room's occlusion tests)
const ARCH = PARTITION_ARCH; // panel tops: corners are this much lower than the middle
const LEAN_MAX = 6; // degrees at wobble = 1
const CORAL_TOP = '#F7A08F';

type V3 = [number, number, number]; // local (dx from the centre line, z, h)

export const Partition: React.FC<PartitionProps> = ({tilt, wobble = 0, view = DEFAULT_VIEW, layout = LAYOUT, opacity = 1, style}) => {
  const s: ViewState = viewAt(tilt, view);
  const o = layout.occluder;
  const ht = o.thickness / 2;
  const H = o.height;
  const L = o.z1 - o.z0;
  const Lp = L / 3;
  // seen from straight above a lean reads as the bar sliding sideways, so the plan view plays it much smaller
  const leanScale = 1 - 0.75 * smoothstep(0.7, 1, tilt);
  const th = (Math.max(-1.5, Math.min(1.5, wobble)) * leanScale * LEAN_MAX * Math.PI) / 180;
  const cs = Math.cos(th);
  const sn = Math.sin(th);
  // local -> plan, leaning about the base line (x = o.x, h = 0)
  const toPlan = ([dx, z, h]: V3): PlanPt => ({x: o.x + dx * cs + h * sn, z, h: -dx * sn + h * cs});
  const Q = (v: V3) => projectWith(s, toPlan(v));
  const d = (vs: V3[], closed = true) =>
    vs.map((v, i) => {
      const q = Q(v);
      return `${i ? 'L' : 'M'} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`;
    }).join(' ') + (closed ? ' Z' : '');

  // which long face looks at the camera (the camera stands front-left in the room view: the -x face)
  const nx = -sn; // h-component of the rotated +x normal is -sin(th); its x-component is cos(th)
  const plusX = cs * s.toCam[0] + nx * s.toCam[2];
  const side = plusX >= 0 ? 1 : -1;
  const sideX = side * ht;

  const planT = smoothstep(0.82, 1, tilt);
  const roomT = 1 - smoothstep(0.5, 0.85, tilt); // details fade as the screen turns into a plan symbol
  const ink = {stroke: C.ink, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const};
  const faces = s.height > 0.003;

  // scalloped top: one arch per panel
  const topH = (z: number) => {
    const u = Math.max(0, Math.min(1, (z - o.z0) / Lp - Math.floor(Math.min(2.9999, (z - o.z0) / Lp))));
    return H - ARCH * (1 - Math.sin(Math.PI * u));
  };
  const N = 30; // samples along the top
  const prof = (dx: number, reverse = false): V3[] => {
    const pts: V3[] = [];
    for (let k = 0; k <= N; k++) {
      const z = o.z0 + (L * k) / N;
      pts.push([dx, z, topH(z)]);
    }
    return reverse ? pts.reverse() : pts;
  };
  const hb = FOOT_H;
  const sideFace: V3[] = [[sideX, o.z0, hb], [sideX, o.z1, hb], ...prof(sideX, true)];
  const endFace: V3[] = [[-ht, o.z1, hb], [ht, o.z1, hb], [ht, o.z1, topH(o.z1)], [-ht, o.z1, topH(o.z1)]];
  const ribbon: V3[] = [...prof(-ht), ...prof(ht, true)];

  // one inset outline per panel, following the arch
  const inset = (i: number): V3[] => {
    const za = o.z0 + i * Lp + 0.08;
    const zb = o.z0 + (i + 1) * Lp - 0.08;
    const pts: V3[] = [[sideX, za, hb + 0.12], [sideX, zb, hb + 0.12]];
    for (let k = 0; k <= 10; k++) {
      const z = zb - ((zb - za) * k) / 10;
      pts.push([sideX, z, topH(z) - 0.12]);
    }
    return pts;
  };
  const hinges = [o.z0 + Lp, o.z0 + 2 * Lp];

  // stubby feet: two per panel, a little wider than the panel
  const feet: number[] = [];
  for (let i = 0; i < 3; i++) feet.push(o.z0 + i * Lp + 0.1, o.z0 + (i + 1) * Lp - 0.1);
  const foot = (zf: number) => {
    const pts: {x: number; y: number}[] = [];
    for (const dx of [-ht - 0.025, ht + 0.025]) for (const z of [zf - 0.04, zf + 0.04]) for (const h of [0, hb + 0.02]) pts.push(Q([dx, z, h]));
    return hull(pts).map((q, i) => `${i ? 'L' : 'M'} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`).join(' ') + ' Z';
  };

  // floor contact shadow (does not lean)
  const shadow = [
    {x: o.x - 0.14, z: o.z0 - 0.03},
    {x: o.x + 0.14, z: o.z0 - 0.03},
    {x: o.x + 0.14, z: o.z1 + 0.03},
    {x: o.x - 0.14, z: o.z1 + 0.03},
  ].map((p, i) => {
    const q = projectWith(s, {x: p.x, z: p.z, h: 0});
    return `${i ? 'L' : 'M'} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`;
  }).join(' ') + ' Z';

  // plan symbol: a bar on the footprint (at least 18 px wide incl. outline)
  const pw = Math.max(ht, (9 - OUTLINE / 2) / s.ppm);
  const planBar: V3[] = [[-pw, o.z0, H], [pw, o.z0, H], [pw, o.z1, H], [-pw, o.z1, H]];
  const topColor = interpolateColors(smoothstep(0.5, 1, tilt), [0, 1], [CORAL_TOP, C.coral]);

  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity, ...style}}>
      <path d={shadow} fill={C.shadow} opacity={roomT} />
      {faces && roomT > 0.001 && feet.map((zf, i) => <path key={`f${i}`} d={foot(zf)} fill={C.coralDeep} {...ink} strokeWidth={3} opacity={roomT} />)}
      {/* top (drawn first: where the arch turns away, the side face covers it) */}
      <path d={d(ribbon)} fill={topColor} {...ink} />
      {faces && (
        <g>
          <path d={d(sideFace)} fill={C.coral} {...ink} />
          {roomT > 0.001 && (
            <g opacity={roomT}>
              {[0, 1, 2].map((i) => (
                <path key={`in${i}`} d={d(inset(i))} fill="none" stroke={C.coralDeep} strokeWidth={3} strokeLinejoin="round" />
              ))}
              {hinges.map((zh, i) => (
                <g key={`h${i}`}>
                  <path d={d([[sideX, zh, hb], [sideX, zh, topH(zh)]], false)} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
                  {[0.35, H - 0.4].map((hc) => (
                    <path key={hc} d={d([[sideX, zh - 0.03, hc - 0.06], [sideX, zh + 0.03, hc - 0.06], [sideX, zh + 0.03, hc + 0.06], [sideX, zh - 0.03, hc + 0.06]])} fill={C.saffronDeep} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
                  ))}
                </g>
              ))}
            </g>
          )}
          <path d={d(endFace)} fill={C.coralDeep} {...ink} />
        </g>
      )}
      {planT > 0.001 && <path d={d(planBar)} fill={C.coral} {...ink} opacity={planT} />}
    </svg>
  );
};
