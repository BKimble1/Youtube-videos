import React from 'react';
import {C, OUTLINE} from '../../theme';
import {CAST} from '../cast';
import {Character2, reach2, type Pose2} from './Cast2';
import {ROOM_COLORS} from './RoomSet';

/**
 * S4 only: the round face inset for J3 (the guesser's reaction while the arcs are drawn). A screen-space bubble:
 * the guesser's head and shoulders (Character2, on-model) against the relay wall, with the edge of the coral
 * partition on the left that he can lean on (his left hand reaches it with reach2, so the hand touches the panel).
 * A wedge tail points at his plan token, so the face reads as "him, down there".
 *
 * `lean` 0..1 blends his left arm from its pose onto the partition edge (the scene drives his lean and face in `pose`).
 * `open` 0..1 scales the bubble in from its centre (0 = not drawn).
 */
export type FaceInsetProps = {
  cx: number;
  cy: number;
  r: number;
  open: number;
  frame: number;
  pose: Pose2;
  lean: number;
  /** screen point the tail points at (the token's centre) and the token's radius (px): the tail stops at its edge */
  tail?: {x: number; y: number; r: number};
  seed?: number;
  life?: number;
};

export const INSET_RIG = {scale: 1.3, dx: 0.17, headY: 352};

export const FaceInset: React.FC<FaceInsetProps> = ({cx, cy, r, open, frame, pose, lean, tail, seed = 5, life = 0.5}) => {
  if (open <= 0.001) return null;
  const size = 2 * r;
  const s = INSET_RIG.scale;
  const rig = {x: r + INSET_RIG.dx * r, y: r + INSET_RIG.headY * s, scale: s, frame, seed, life};
  const stripX = 0.36 * r;
  let p = pose;
  if (lean > 0.001) {
    const arm = reach2(rig, pose, -1, stripX + 2, rig.y - 318 * s, 1);
    const t = Math.min(1, lean);
    p = {...pose, armL: {a: pose.armL.a + (arm.a - pose.armL.a) * t, b: pose.armL.b + (arm.b - pose.armL.b) * t}, armsFront: 'L'};
  }
  // tail: a wedge from the bubble's rim toward the token, stopping at the token's edge
  let tailD: string | null = null;
  if (tail) {
    const dx = tail.x - cx;
    const dy = tail.y - cy;
    const d = Math.hypot(dx, dy);
    const reachLen = d - tail.r - 6;
    if (reachLen > r + 20) {
      const ang = Math.atan2(dy, dx);
      const half = 0.2;
      const b0 = {x: r + Math.cos(ang - half) * (r - 4), y: r + Math.sin(ang - half) * (r - 4)};
      const b1 = {x: r + Math.cos(ang + half) * (r - 4), y: r + Math.sin(ang + half) * (r - 4)};
      const tip = {x: r + Math.cos(ang) * reachLen, y: r + Math.sin(ang) * reachLen};
      tailD = `M ${b0.x.toFixed(1)} ${b0.y.toFixed(1)} Q ${((b0.x + tip.x) / 2).toFixed(1)} ${((b0.y + tip.y) / 2).toFixed(1)} ${tip.x.toFixed(1)} ${tip.y.toFixed(1)} Q ${((b1.x + tip.x) / 2).toFixed(1)} ${((b1.y + tip.y) / 2).toFixed(1)} ${b1.x.toFixed(1)} ${b1.y.toFixed(1)} Z`;
    }
  }
  const k = Math.max(0, open);
  return (
    <div style={{position: 'absolute', left: cx - r, top: cy - r, width: size, height: size, transform: `scale(${k.toFixed(4)})`, transformOrigin: '50% 50%'}}>
      {tailD && (
        <svg width={size} height={size} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <path d={tailD} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
        </svg>
      )}
      {/* soft drop shadow (flat, offset) */}
      <div style={{position: 'absolute', left: 8, top: 10, width: size, height: size, borderRadius: '50%', background: C.shadow}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: ROOM_COLORS.relayWall}}>
        <svg width={size} height={size} style={{position: 'absolute', left: 0, top: 0}}>
          {/* the partition's edge: a coral panel with an inset line, standing at the left */}
          <rect x={-20} y={-20} width={stripX + 20} height={size + 40} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} />
          <path d={`M ${stripX - 16} ${-10} L ${stripX - 16} ${size + 10}`} stroke={C.coralDeep} strokeWidth={4} />
        </svg>
        <Character2 look={CAST.guesser} pose={p} frame={frame} seed={seed} x={rig.x} y={rig.y} scale={s} life={life} shadow={false} />
      </div>
      <div style={{position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: '50%', boxSizing: 'border-box', border: `${OUTLINE + 1}px solid ${C.ink}`}} />
    </div>
  );
};
