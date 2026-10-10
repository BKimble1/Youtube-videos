import React from 'react';
import {C, OUTLINE} from '../../theme';
import {CAST} from '../cast';
import {Character2, reach2, type Pose2} from '../v02/Cast2';
import {ROOM_COLORS} from '../v02/RoomSet';

/**
 * V9 only: a copy of the S4 face inset (components/v02/S4_Inset FaceInset) whose rig scales with the bubble, so a
 * smaller bubble still frames head and shoulders (S4's rig scale is fixed for r = 165). The guesser's head and
 * shoulders against the relay wall, the coral partition edge at the left that he can lean on, and a wedge tail that
 * points at his plan token and stops at its edge. Plan tokens are faceless, so his reactions play here.
 *
 * `open` 0..1 scales the bubble from its centre (0 = not drawn).
 */
export type V9InsetProps = {
  cx: number;
  cy: number;
  r: number;
  open: number;
  frame: number;
  pose: Pose2;
  lean?: number;
  tail?: {x: number; y: number; r: number};
  /** 0..1 the tail's opacity (default 1), so it can fade while his token leaves the frame */
  tailOpacity?: number;
  seed?: number;
  life?: number;
};

/** S4's framing at r = 165: rig scale 1.3, head centre 0.17 r right of the bubble centre, feet 352·scale below it. */
const REF_R = 165;
const REF = {scale: 1.3, dx: 0.17, headY: 352};

export const V9Inset: React.FC<V9InsetProps> = ({cx, cy, r, open, frame, pose, lean = 0, tail, tailOpacity = 1, seed = 5, life = 0.5}) => {
  if (open <= 0.001) return null;
  const size = 2 * r;
  const s = REF.scale * (r / REF_R);
  const rig = {x: r + REF.dx * r, y: r + REF.headY * s, scale: s, frame, seed, life};
  const stripX = 0.36 * r;
  let p = pose;
  if (lean > 0.001) {
    const arm = reach2(rig, pose, -1, stripX + 2, rig.y - 318 * s, 1);
    const t = Math.min(1, lean);
    p = {...pose, armL: {a: pose.armL.a + (arm.a - pose.armL.a) * t, b: pose.armL.b + (arm.b - pose.armL.b) * t}, armsFront: 'L'};
  }
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
        <svg width={size} height={size} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: Math.max(0, Math.min(1, tailOpacity))}}>
          <path d={tailD} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
        </svg>
      )}
      <div style={{position: 'absolute', left: 8, top: 10, width: size, height: size, borderRadius: '50%', background: C.shadow}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: ROOM_COLORS.relayWall}}>
        <svg width={size} height={size} style={{position: 'absolute', left: 0, top: 0}}>
          <rect x={-20} y={-20} width={stripX + 20} height={size + 40} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} />
          <path d={`M ${stripX - 16} ${-10} L ${stripX - 16} ${size + 10}`} stroke={C.coralDeep} strokeWidth={4} />
        </svg>
        <Character2 look={CAST.guesser} pose={p} frame={frame} seed={seed} x={rig.x} y={rig.y} scale={s} life={life} shadow={false} />
      </div>
      <div style={{position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: '50%', boxSizing: 'border-box', border: `${OUTLINE + 1}px solid ${C.ink}`}} />
    </div>
  );
};
