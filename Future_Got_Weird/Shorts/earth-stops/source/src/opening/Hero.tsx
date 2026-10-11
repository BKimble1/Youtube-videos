import React from 'react';
import {Character, IDLE, Pose} from '../components/Character';
import {C, H, OUTLINE, W} from '../theme';
import {GY, MUG, armL, armR, camX, ArmMode, cupTilt, footFlat, hipX, hipY, legL, legR, squash, theta} from './choreo';
import {HERO_LOOK, SC} from './rig';

const COFFEE = '#33200F';

/** The ceramic mug (coral: no other prop in the street is coral except the scarf), in the hand's local frame (origin = hand). The handle ring is around the hand; the tapered body sits out ahead of it. */
const Mug: React.FC<{tilt: number; lean: number}> = ({tilt, lean}) => {
  const x0 = MUG.cx - MUG.w / 2;
  const y0 = MUG.cy - MUG.h / 2;
  const x1 = x0 + MUG.w;
  const y1 = y0 + MUG.h;
  const taper = 7;
  return (
    <g transform={`rotate(${tilt - lean})`}>
      {/* handle */}
      <circle cx={8} cy={6} r={24} fill="none" stroke={C.ink} strokeWidth={17} />
      <circle cx={8} cy={6} r={24} fill="none" stroke={C.coralDeep} strokeWidth={9} />
      {/* body (tapered) */}
      <path d={`M ${x0} ${y0} L ${x1} ${y0} L ${x1 - taper} ${y1 - 8} Q ${x1 - taper} ${y1} ${x1 - taper - 10} ${y1} L ${x0 + taper + 10} ${y1} Q ${x0 + taper} ${y1} ${x0 + taper} ${y1 - 8} Z`} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
      <path d={`M ${x0 + 10} ${y0 + 14} L ${x0 + 10 + 7} ${y1 - 16}`} stroke={C.coralLight} strokeWidth={6} strokeLinecap="round" opacity={0.85} />
      {/* rim + coffee */}
      <ellipse cx={MUG.cx} cy={y0} rx={MUG.w / 2} ry={13} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
      <ellipse cx={MUG.cx} cy={y0 + 1} rx={MUG.w / 2 - 7} ry={9} fill={COFFEE} stroke={C.ink} strokeWidth={3} />
    </g>
  );
};

export const Hero: React.FC<{f: number; camAt?: number; opacity?: number; armMode?: ArmMode}> = ({f, camAt, opacity = 1, armMode = 'up'}) => {
  const th = theta(f);
  const pose: Pose = {
    ...IDLE,
    armL: armL(f, armMode),
    armR: armR(f),
    lean: th,
    tilt: -0.3 * th,
    lookX: 1,
    lookY: 0.15,
    brows: 0.95,
    mouth: 'o',
    legL: legL(f),
    legR: legR(f),
    footFlat: footFlat(f),
    blink: 1,
  };
  const x = hipX(f) - camX(camAt ?? f);
  const yg = hipY(f) + 150 * SC;
  const [sx, sy] = squash(f);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `scale(${sx}, ${sy})`, transformOrigin: `${x}px ${GY}px`, opacity}}>
      <Character look={HERO_LOOK} pose={pose} frame={Math.round(f)} x={x} y={yg} scale={SC} life={0} eyeDarts={false} front="R" shadow={false} holdR={<Mug tilt={cupTilt(f)} lean={th} />} />
    </div>
  );
};
