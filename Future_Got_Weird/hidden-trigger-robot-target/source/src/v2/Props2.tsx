// V2 side-view props and arm. Same dimensions as V1 (theme.ts); construction details added so the props read as
// props at close range: rounded tip and blunt bead on the toy blade, grip ridges, a molded cuff and mounting block on
// the model hand. The knife is drawn inside the gripper transform, so it cannot detach from the jaws.
import React from 'react';
import {C, HANDPROP, KNIFE, ROBOT} from '../theme';
import {Pose, solve} from '../rig/kin';

export const ToyKnife2: React.FC<{glint?: number; id?: string}> = ({glint, id = 'k'}) => {
  const {handleBack, handleFront, bladeLen, edgeV, handleH} = KNIFE;
  const tip = handleFront - bladeLen;
  // rounded nose (r ~ 14) and a straight blunt edge; spine at v = -12
  const blade = `M ${handleFront} -12 L ${tip + 34} -12 C ${tip + 8} -12 ${tip - 6} ${edgeV - 22} ${tip - 4} ${edgeV - 10} C ${tip - 3} ${edgeV - 2} ${tip + 4} ${edgeV} ${tip + 16} ${edgeV} L ${handleFront} ${edgeV} Z`;
  const clip = `fgwht2-blade-${id}`;
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <path d={blade} />
        </clipPath>
        <linearGradient id={`${clip}-g`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#FFF8E8" stopOpacity={0} />
          <stop offset="0.5" stopColor="#FFF8E8" stopOpacity={0.7} />
          <stop offset="1" stopColor="#FFF8E8" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={blade} fill={C.blade} stroke={C.bladeDark} strokeWidth={2.5} strokeLinejoin="round" />
      {/* molded parting line and the rounded (blunt) edge bead */}
      <path d={`M ${handleFront - 2} 0 L ${tip + 26} 0`} stroke={C.bladeDark} strokeWidth={1.4} opacity={0.55} />
      <path d={`M ${handleFront - 3} ${edgeV - 3.5} L ${tip + 14} ${edgeV - 3.5}`} stroke="#F7EEDB" strokeWidth={5} strokeLinecap="round" />
      <path d={`M ${handleFront - 3} ${edgeV - 0.8} L ${tip + 14} ${edgeV - 0.8}`} stroke={C.bladeDark} strokeWidth={1.4} opacity={0.6} />
      {glint !== undefined && glint > 0 && glint < 1 && (
        <rect x={tip - 40 + (bladeLen + 120) * glint - 40} y={-20} width={60} height={44} fill={`url(#${clip}-g)`} clipPath={`url(#${clip})`} />
      )}
      {/* handle: rounded, with grip ridges and an end cap */}
      <rect x={handleFront - 6} y={-handleH / 2 - 3} width={10} height={handleH + 6} rx={4} fill={C.handleDark} />
      <rect x={handleFront + 2} y={-handleH / 2} width={handleBack - handleFront - 2} height={handleH} rx={handleH / 2} fill={C.handle} stroke={C.handleDark} strokeWidth={2.5} />
      <rect x={handleFront + 10} y={-handleH / 2 + 4} width={handleBack - handleFront - 24} height={4} rx={2} fill="#6CC28A" opacity={0.6} />
      {[handleFront + 22, handleFront + 34, handleFront + 70, handleFront + 82].map((x) => (
        <line key={x} x1={x} y1={-handleH / 2 + 3} x2={x} y2={handleH / 2 - 3} stroke={C.handleDark} strokeWidth={2} opacity={0.55} />
      ))}
    </g>
  );
};

// Model hand: fingers point left, flat wrist termination on the right inside a molded cuff on a mounting block.
export const ModelHand2: React.FC = () => {
  const finger = (y0: number, x1: number, w: number, tilt: number) => (
    <g transform={`rotate(${tilt} -46 ${y0})`}>
      <rect x={x1} y={y0 - w / 2} width={-46 - x1 + 10} height={w} rx={w / 2} fill={C.hand} stroke={C.handDark} strokeWidth={2.5} />
      <path d={`M ${x1 + (-46 - x1) * 0.42} ${y0 - w / 2 + 3} q -3 ${w / 2 - 3} 0 ${w - 6}`} stroke={C.handDark} strokeWidth={1.6} fill="none" opacity={0.6} />
      <path d={`M ${x1 + (-46 - x1) * 0.72} ${y0 - w / 2 + 3} q -3 ${w / 2 - 3} 0 ${w - 6}`} stroke={C.handDark} strokeWidth={1.6} fill="none" opacity={0.6} />
    </g>
  );
  return (
    <g transform={`translate(${HANDPROP.x} ${HANDPROP.y}) scale(${HANDPROP.scale})`}>
      <ellipse cx={0} cy={47} rx={156} ry={10} fill="#2A3346" opacity={0.45} />
      {/* mounting block with two screws */}
      <rect x={92} y={8} width={78} height={38} rx={7} fill="#4A5874" stroke="#2B3650" strokeWidth={2.5} />
      <rect x={92} y={36} width={78} height={10} rx={4} fill="#36435C" />
      {[108, 154].map((x) => (
        <g key={x}>
          <circle cx={x} cy={22} r={5} fill="#8A97AD" stroke="#2B3650" strokeWidth={1.5} />
          <line x1={x - 3} y1={22} x2={x + 3} y2={22} stroke="#2B3650" strokeWidth={1.5} />
        </g>
      ))}
      {/* wrist, flat termination */}
      <path d="M 40 -38 L 140 -31 L 140 31 L 40 38 Z" fill={C.hand} stroke={C.handDark} strokeWidth={2.5} />
      {/* molded cuff: raised band with seam lines */}
      <rect x={104} y={-38} width={30} height={76} rx={6} fill={C.handLight} stroke={C.handDark} strokeWidth={2.5} />
      <line x1={112} y1={-36} x2={112} y2={36} stroke={C.handDark} strokeWidth={1.4} opacity={0.6} />
      <line x1={126} y1={-36} x2={126} y2={36} stroke={C.handDark} strokeWidth={1.4} opacity={0.6} />
      {/* flat end face */}
      <ellipse cx={141} cy={0} rx={9} ry={30} fill="#FFD6AE" stroke={C.handDark} strokeWidth={2.5} />
      <circle cx={141} cy={0} r={4} fill={C.handDark} opacity={0.55} />
      {finger(-33, -118, 19, 4)}
      {finger(-12, -142, 22, 1)}
      {finger(9, -150, 23, -1)}
      {finger(29, -136, 22, -4)}
      <g transform="rotate(32 -20 36)">
        <rect x={-92} y={25} width={84} height={24} rx={12} fill={C.hand} stroke={C.handDark} strokeWidth={2.5} />
      </g>
      <path d="M -56 -40 C -20 -48 30 -46 52 -38 C 64 -14 64 16 52 40 C 20 48 -26 50 -56 40 C -66 14 -66 -14 -56 -40 Z" fill={C.hand} stroke={C.handDark} strokeWidth={2.5} />
      <path d="M -50 -20 C -10 -30 30 -28 48 -22" stroke={C.handLight} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.55} />
      {/* parting line along the side of the casting */}
      <path d="M 104 -2 L 52 -2 C 20 -2 -20 4 -48 8 L -150 9" stroke={C.handDark} strokeWidth={1.4} fill="none" opacity={0.75} />
      {[-14, 6, 26].map((yy) => (
        <path key={yy} d={`M -44 ${yy - 6} q -6 6 0 12`} stroke={C.handDark} strokeWidth={1.6} fill="none" opacity={0.55} />
      ))}
    </g>
  );
};

const Link: React.FC<{a: {x: number; y: number}; b: {x: number; y: number}; w: number}> = ({a, b, w}) => (
  <g>
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.robotInk} strokeWidth={w + 5} strokeLinecap="round" />
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.robot} strokeWidth={w} strokeLinecap="round" />
    <line x1={a.x} y1={a.y - w * 0.22} x2={b.x} y2={b.y - w * 0.22} stroke="#E6ECF4" strokeWidth={w * 0.18} strokeLinecap="round" opacity={0.7} />
  </g>
);

const Cap: React.FC<{p: {x: number; y: number}; r: number; hot?: number}> = ({p, r, hot = 0}) => (
  <g>
    <circle cx={p.x} cy={p.y} r={r + 2.5} fill={C.robotInk} />
    <circle cx={p.x} cy={p.y} r={r} fill={C.robotMid} />
    <circle cx={p.x} cy={p.y} r={r * 0.78} fill={C.robot} />
    <circle cx={p.x} cy={p.y} r={r * 0.78} fill="none" stroke={C.cyan} strokeWidth={Math.max(2.5, r * 0.09) * (1 + hot)} opacity={0.9} />
    <circle cx={p.x} cy={p.y} r={r * 0.3} fill={C.robotMid} />
  </g>
);

// Gripper + knife in the tool frame (origin = W2, rotated so +y runs along the tool axis).
export const GripperKnife: React.FC<{glint?: number; id?: string}> = ({glint, id}) => (
  <g>
    <rect x={-30} y={-26} width={60} height={34} rx={10} fill={C.robotMid} stroke={C.robotInk} strokeWidth={3} />
    <rect x={-30} y={-12} width={60} height={6} fill={C.cyan} opacity={0.85} />
    <rect x={-24} y={6} width={48} height={8} rx={3} fill={C.robotDark} />
    <rect x={-29} y={12} width={58} height={38} rx={7} fill="#3B4A61" stroke="#232F42" strokeWidth={3} />
    <rect x={-21} y={20} width={42} height={5} rx={2} fill={C.cyanDim} />
    <rect x={-3} y={44} width={18} height={42} rx={5} fill="#2A364A" stroke="#1B2433" strokeWidth={2.5} />
    <g transform={`translate(0 ${ROBOT.GRIP})`}>
      <ToyKnife2 glint={glint} id={id} />
    </g>
    <rect x={-13} y={44} width={18} height={42} rx={5} fill="#4A5A74" stroke="#1B2433" strokeWidth={2.5} />
    <rect x={-9} y={66} width={10} height={14} rx={3} fill="#5D6F8C" />
  </g>
);

// hot: 0..1 highlight on the joint rings (the controller is driving the joints)
export const RobotArm2: React.FC<{pose: Pose; glint?: number; hot?: number; id?: string}> = ({pose, glint, hot = 0, id}) => {
  const j = solve(pose);
  const S = j.S;
  return (
    <g>
      <rect x={S.x - 52} y={ROBOT.baseTop - 14} width={104} height={80} rx={14} fill={C.robotMid} stroke={C.robotInk} strokeWidth={3} />
      <rect x={S.x - 52} y={ROBOT.baseTop + 26} width={104} height={8} fill={C.cyan} opacity={0.85} />
      <Link a={S} b={j.E} w={54} />
      <Cap p={S} r={50} hot={hot} />
      <Link a={j.E} b={j.W1} w={44} />
      <Cap p={j.E} r={42} hot={hot} />
      <Link a={j.W1} b={j.W2} w={36} />
      <Cap p={j.W1} r={32} hot={hot} />
      <g transform={`translate(${j.W2.x} ${j.W2.y}) rotate(${pose.phi - 90})`}>
        <GripperKnife glint={glint} id={id} />
      </g>
    </g>
  );
};
