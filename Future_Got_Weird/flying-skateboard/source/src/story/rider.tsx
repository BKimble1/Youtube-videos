// Board + pilot drawn together, in the right order for the camera: from above the deck the board goes first and the
// pilot stands on it; from below, the deck covers the shoes.
import React from 'react';
import {BD, Board, boardAbove, BoardState} from '../art/Board';
import {Pilot} from '../art/Pilot';
import {pilotJoints, PilotPose} from '../art/rig';
import {d3, Frame, Lens, s3, toW, V3, v3} from '../eng/v3';
import {SUN} from '../eng/draw';

export const Rider: React.FC<{id: string; L: Lens; B: Frame; pose: PilotPose; st: BoardState; coach?: number; noPilot?: boolean; pov?: boolean}> = ({id, L, B, pose, st, coach = 0, noPilot, pov}) => {
  const j = pilotJoints(B, pose);
  const tilt = st.tilt ?? {pitch: 0, roll: 0};
  const board = <Board id={`${id}-b`} L={L} B={B} st={st} />;
  const pilot = noPilot ? null : <Pilot id={`${id}-p`} L={L} j={j} coach={coach} tilt={tilt} thumb={pose.thumb} pov={pov} />;
  return boardAbove(L, B) ? (
    <g>
      {board}
      {pilot}
    </g>
  ) : (
    <g>
      {pilot}
      {board}
    </g>
  );
};

/** The rider's and board's shadow on the ground (y = 0), cast along the sun: it separates from the board as it lifts. */
export const RiderShadow: React.FC<{L: Lens; B: Frame; pose: PilotPose; sun?: V3; minOp?: number; color?: string}> = ({L, B, pose, sun = SUN, minOp = 0.35, color = '#24361F'}) => {
  const onG = (p: V3): V3 => v3(p.x - (sun.x * p.y) / sun.y, 0.004, p.z - (sun.z * p.y) / sun.y);
  const ok = (p: V3) => d3(s3(p, L.pos), L.f) > 0.3;
  const outline = BD.outline.map(([x, z]) => onG(toW(B, v3(x, -BD.thick, z))));
  if (!outline.every(ok)) return null;
  const j = pilotJoints(B, pose);
  const bones: [V3, V3][] = [[j.ankF, j.kneeF], [j.kneeF, j.hipF], [j.ankR, j.kneeR], [j.kneeR, j.hipR], [j.P, j.S], [j.shF, j.elbF], [j.elbF, j.wriF], [j.shR, j.elbR], [j.elbR, j.wriR], [j.shF, j.shR], [j.S, j.Hc]];
  const k = L.p(onG(j.P)).k;
  const d = bones.map(([a, b]) => {
    const pa = L.p(onG(a)), pb = L.p(onG(b));
    return `M${pa.x.toFixed(1)},${pa.y.toFixed(1)}L${pb.x.toFixed(1)},${pb.y.toFixed(1)}`;
  }).join('');
  const hc = L.p(onG(j.Hc));
  const lift = Math.max(0, B.o.y - 0.13);
  const op = 0.3 * Math.max(minOp, 1 - lift / 4);
  return (
    <g opacity={op}>
      <path d={'M' + outline.map((q) => {
        const p = L.p(q);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      }).join(' L') + ' Z'} fill={color} />
      <path d={d} stroke={color} strokeWidth={(0.15 * k).toFixed(1)} strokeLinecap="round" fill="none" />
      {/* (V5: a head no wider than the shoulders' shadow; a larger disc on thin limbs read as a lollipop) */}
      <circle cx={hc.x.toFixed(1)} cy={hc.y.toFixed(1)} r={(0.095 * k).toFixed(1)} fill={color} />
    </g>
  );
};
