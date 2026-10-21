// High-angle view of the same bench. Projection of a world point (x, depth d, height h above the mat):
//   X = x,  Y = 0.92 d - 0.42 h.  Props sit at d = 0 in the same x positions as the side view.
// The arm is the side-view rig (same solve()) seen through that projection: its plane is d = 0, and the mast stands
// behind the bench (d = MAST_D) joined to the shoulder by a horizontal offset link that the side view hides.
import React from 'react';
import {C, APPLE, HANDPROP, ROBOT, TABLE} from '../theme';
import {Pose, solve, knifeFrame} from '../rig/kin';
import {GripperKnife} from './Props2';
import {C2} from './theme2';

export const KD = 0.92;
export const KH = 0.42;
const MAT_Y = 1250; // side-view y of the mat surface
const MAST_D = -330;
const BENCH = {back: -300, front: 330};
export type OCam = {cx: number; cd: number; z: number; ay: number};
export const oTransform = (c: OCam) => `translate(540 ${c.ay}) scale(${c.z}) translate(${-c.cx} ${-c.cd})`;
export const oScreen = (c: OCam, x: number, Y: number) => ({x: (x - c.cx) * c.z + 540, y: (Y - c.cd) * c.z + c.ay});
const Y = (d: number, h: number) => KD * d - KH * h;

// Apple seen from the high angle, origin = the apple's footprint centre.
export const ApplePlan: React.FC<{shadow?: boolean}> = ({shadow = true}) => {
  const r = APPLE.r;
  const cy = Y(0, MAT_Y - APPLE.y); // body centre
  const top = Y(0, MAT_Y - 1130); // stem dimple
  return (
    <g>
      {shadow && <ellipse cx={14} cy={4} rx={r * 1.02} ry={r * 0.5} fill="#56637A" opacity={0.55} />}
      <circle cx={0} cy={cy} r={r} fill={C.apple} stroke={C.appleDark} strokeWidth={3} />
      <path d={`M ${r * 0.62} ${cy - r * 0.62} A ${r} ${r} 0 0 1 ${-r * 0.2} ${cy + r * 0.98} A ${r * 1.1} ${r * 1.1} 0 0 0 ${r * 0.62} ${cy - r * 0.62} Z`} fill={C.appleDark} opacity={0.45} />
      <ellipse cx={-r * 0.4} cy={cy - r * 0.15} rx={r * 0.17} ry={r * 0.3} fill={C.appleLight} opacity={0.75} transform={`rotate(25 ${-r * 0.4} ${cy - r * 0.15})`} />
      <ellipse cx={0} cy={top} rx={16} ry={9} fill={C.appleDark} opacity={0.7} />
      <path d={`M 0 ${top} q 2 -14 9 -24`} stroke={C.stem} strokeWidth={6} strokeLinecap="round" fill="none" />
      <path d={`M 4 ${top - 6} C 20 ${top - 26} 46 ${top - 22} 54 ${top - 12} C 40 ${top - 2} 18 ${top} 4 ${top - 6} Z`} fill={C.leaf} />
    </g>
  );
};

// Model hand seen from the high angle (back of the hand up), origin = HANDPROP footprint centre.
const HandShape: React.FC<{fill: string; stroke: string; detail?: boolean}> = ({fill, stroke, detail}) => {
  const fingers: [number, number][] = [[-38, -124], [-13, -148], [12, -152], [36, -132]];
  return (
    <g>
      {fingers.map(([d, x1]) => (
        <g key={d}>
          <rect x={x1} y={d * KD - 11} width={-40 - x1} height={22} rx={11} fill={fill} stroke={stroke} strokeWidth={2.5} />
          {detail && <path d={`M ${x1 + (-40 - x1) * 0.45} ${d * KD - 8} q -4 8 0 16 M ${x1 + (-40 - x1) * 0.75} ${d * KD - 8} q -4 8 0 16`} stroke={C.handDark} strokeWidth={1.6} fill="none" opacity={0.6} />}
        </g>
      ))}
      <g transform={`rotate(28 -24 ${48 * KD})`}>
        <rect x={-96} y={48 * KD - 13} width={84} height={26} rx={13} fill={fill} stroke={stroke} strokeWidth={2.5} />
      </g>
      <path d={`M 40 ${-42 * KD} L 140 ${-36 * KD} L 140 ${36 * KD} L 40 ${42 * KD} Z`} fill={fill} stroke={stroke} strokeWidth={2.5} />
      <path d={`M -58 ${-50 * KD} C -20 ${-56 * KD} 32 ${-54 * KD} 56 ${-44 * KD} C 66 ${-16 * KD} 66 ${16 * KD} 56 ${44 * KD} C 22 ${54 * KD} -26 ${56 * KD} -58 ${48 * KD} C -68 ${16 * KD} -68 ${-16 * KD} -58 ${-50 * KD} Z`} fill={fill} stroke={stroke} strokeWidth={2.5} />
      {detail && (
        <>
          {[-38, -13, 12, 36].map((d) => (
            <path key={d} d={`M -50 ${d * KD - 7} q -7 7 0 14`} stroke={C.handDark} strokeWidth={1.8} fill="none" opacity={0.55} />
          ))}
          <path d={`M -46 ${-30 * KD} C -6 ${-38 * KD} 30 ${-36 * KD} 50 ${-30 * KD}`} stroke={C.handLight} strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.55} />
        </>
      )}
    </g>
  );
};

export const HandPlan: React.FC<{shadow?: boolean}> = ({shadow = true}) => {
  const hTop = 80;
  return (
    <g>
      {shadow && <ellipse cx={20} cy={6} rx={176} ry={62} fill="#56637A" opacity={0.5} />}
      {/* mounting block (front face + top) */}
      <rect x={92} y={Y(60, 38)} width={78} height={KH * 38} fill="#36435C" />
      <rect x={92} y={Y(-60, 38)} width={78} height={120 * KD} rx={6} fill="#4A5874" stroke="#2B3650" strokeWidth={2.5} />
      {[108, 154].map((x) => (
        <g key={x}>
          {[-44, 44].map((d) => (
            <circle key={d} cx={x} cy={Y(d, 38)} r={5} fill="#8A97AD" stroke="#2B3650" strokeWidth={1.5} />
          ))}
        </g>
      ))}
      {/* extrusion: the same outline at mat level and part way up, darker, then the lit top surface */}
      <g transform={`translate(0 ${-KH * 8})`}>
        <HandShape fill={C.handDark} stroke={C.handDark} />
      </g>
      <g transform={`translate(0 ${-KH * 40})`}>
        <HandShape fill={C.handDark} stroke={C.handDark} />
      </g>
      <g transform={`translate(0 ${-KH * hTop})`}>
        <HandShape fill={C.hand} stroke={C.handDark} detail />
        {/* molded cuff band and the flat end face */}
        <rect x={104} y={-46 * KD} width={30} height={92 * KD} rx={7} fill={C.handLight} stroke={C.handDark} strokeWidth={2.5} />
        <line x1={112} y1={-44 * KD} x2={112} y2={44 * KD} stroke={C.handDark} strokeWidth={1.5} opacity={0.6} />
        <line x1={126} y1={-44 * KD} x2={126} y2={44 * KD} stroke={C.handDark} strokeWidth={1.5} opacity={0.6} />
        <rect x={136} y={-36 * KD} width={9} height={72 * KD} rx={3} fill="#FFD6AE" stroke={C.handDark} strokeWidth={2} />
      </g>
    </g>
  );
};

const TapeL: React.FC<{x: number; d: number; sx: number; sd: number}> = ({x, d, sx, sd}) => (
  <path d={`M ${x} ${d * KD + sd * 18} L ${x} ${d * KD} L ${x + sx * 18} ${d * KD}`} stroke="#E9A23B" strokeWidth={5} fill="none" opacity={0.85} />
);

export const PlanRing: React.FC<{target: 'apple' | 'hand'; a: number}> = ({target, a}) => {
  if (a <= 0) return null;
  const col = target === 'apple' ? C.cyan : C.amber;
  const x = target === 'apple' ? APPLE.x : HANDPROP.x + 10;
  const rx = target === 'apple' ? 100 : 205;
  const ry = target === 'apple' ? 90 : 96;
  return (
    <g opacity={a}>
      <ellipse cx={x} cy={0} rx={rx} ry={ry} fill={col} opacity={0.2} />
      <ellipse cx={x} cy={0} rx={rx} ry={ry} fill="none" stroke={col} strokeWidth={7} />
    </g>
  );
};

export const OverheadWorld: React.FC<{pose: Pose; ring?: {target: 'apple' | 'hand'; a: number} | null}> = ({pose, ring}) => {
  const j = solve(pose);
  const k = knifeFrame(pose);
  const h = Math.max(0, MAT_Y - k.edgeMid.y);
  const S = ROBOT.shoulder;
  const sY = (y: number) => Y(0, MAT_Y - y); // arm plane d = 0
  const P = (p: {x: number; y: number}) => ({x: p.x, y: sY(p.y)});
  const mastTop = Y(MAST_D, MAT_Y - (ROBOT.baseTop + 40));
  const link = (a: {x: number; y: number}, b: {x: number; y: number}, w: number) => (
    <g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.robotInk} strokeWidth={w + 5} strokeLinecap="round" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.robot} strokeWidth={w} strokeLinecap="round" />
      <line x1={a.x - w * 0.22} y1={a.y} x2={b.x - w * 0.22} y2={b.y} stroke="#E6ECF4" strokeWidth={w * 0.18} strokeLinecap="round" opacity={0.7} />
    </g>
  );
  const cap = (p: {x: number; y: number}, r: number) => (
    <g>
      <ellipse cx={p.x} cy={p.y} rx={r + 2.5} ry={(r + 2.5) * 0.62} fill={C.robotInk} />
      <ellipse cx={p.x} cy={p.y} rx={r} ry={r * 0.62} fill={C.robotMid} />
      <ellipse cx={p.x} cy={p.y} rx={r * 0.78} ry={r * 0.78 * 0.62} fill={C.robot} stroke={C.cyan} strokeWidth={3} />
    </g>
  );
  const Sp = P(S), Ep = P(j.E), W1p = P(j.W1), W2p = P(j.W2);
  const SBack = {x: S.x, y: Y(MAST_D, MAT_Y - S.y)};
  return (
    <g>
      {/* back wall seen from above-front, then the floor gap behind the bench */}
      <rect x={-1400} y={-2400} width={4000} height={2400 + Y(BENCH.back - 140, 0)} fill="url(#fgwht2-wall)" />
      {[-260, 80, 420, 760, 1100].map((x) => (
        <rect key={x} x={x} y={Y(BENCH.back - 140, 1080)} width={300} height={KH * 880} rx={8} fill="none" stroke="#24324E" strokeWidth={3} />
      ))}
      <rect x={-1400} y={Y(BENCH.back - 140, 0)} width={4000} height={Y(BENCH.back, 0) - Y(BENCH.back - 140, 0) + 2} fill="#0B1222" />
      {/* mast behind the bench and the shoulder offset link to the arm plane */}
      <rect x={S.x - 34} y={mastTop} width={68} height={Y(MAST_D, 0) - mastTop + 40} fill={C.slate} stroke="#33445F" strokeWidth={3} />
      {/* bench */}
      <rect x={TABLE.left - 40} y={Y(BENCH.back, 0)} width={TABLE.right - TABLE.left + 80} height={(BENCH.front - BENCH.back) * KD} fill={C2.mat} />
      {Array.from({length: 13}).map((_, i) => (
        <line key={'v' + i} x1={-140 + i * 120} y1={Y(BENCH.back, 0)} x2={-140 + i * 120} y2={Y(BENCH.front, 0)} stroke={C2.matLine} strokeWidth={2} opacity={0.6} />
      ))}
      {Array.from({length: 5}).map((_, i) => (
        <line key={'h' + i} x1={TABLE.left - 40} y1={Y(BENCH.back + 120 * (i + 0.5), 0)} x2={TABLE.right + 40} y2={Y(BENCH.back + 120 * (i + 0.5), 0)} stroke={C2.matLine} strokeWidth={2} opacity={0.5} />
      ))}
      <line x1={TABLE.left - 40} y1={Y(BENCH.back, 0)} x2={TABLE.right + 40} y2={Y(BENCH.back, 0)} stroke={C2.matEdge} strokeWidth={4} />
      <rect x={TABLE.left - 40} y={Y(BENCH.front, 0)} width={TABLE.right - TABLE.left + 80} height={KH * 40} fill="#C9D3DF" />
      <rect x={TABLE.left - 40} y={Y(BENCH.front, 0) + KH * 40} width={TABLE.right - TABLE.left + 80} height={KH * 80} fill={C2.apron} />
      <rect x={-1400} y={Y(BENCH.front, 0) + KH * 120} width={4000} height={2400} fill="url(#fgwht2-floor)" />
      {/* tape marks around both prop positions */}
      {[
        [APPLE.x - 95, -80, 1, 1], [APPLE.x + 95, -80, -1, 1], [APPLE.x - 95, 80, 1, -1], [APPLE.x + 95, 80, -1, -1],
        [HANDPROP.left - 25, -80, 1, 1], [HANDPROP.right + 30, -80, -1, 1], [HANDPROP.left - 25, 80, 1, -1], [HANDPROP.right + 30, 80, -1, -1],
      ].map(([x, d, sx, sd], i) => (
        <TapeL key={i} x={x} d={d} sx={sx} sd={sd} />
      ))}
      {ring && <PlanRing target={ring.target} a={ring.a} />}
      {/* knife/gripper shadow on the mat: offset grows with height */}
      <ellipse cx={k.edgeMid.x + 20 + h * 0.12} cy={6 + h * 0.05} rx={130 - h * 0.08} ry={20} fill="#56637A" opacity={Math.max(0.18, 0.55 - h / 700)} />
      <g transform={`translate(${APPLE.x} 0)`}>
        <ApplePlan />
      </g>
      <g transform={`translate(${HANDPROP.x} 0)`}>
        <HandPlan />
      </g>
      {/* arm: shoulder offset link (behind), then the planar chain through the projection */}
      {link(SBack, Sp, 62)}
      {cap(SBack, 48)}
      {link(Sp, Ep, 54)}
      {cap(Sp, 50)}
      {link(Ep, W1p, 44)}
      {cap(Ep, 42)}
      {link(W1p, W2p, 36)}
      {cap(W1p, 32)}
      <g transform={`translate(${W2p.x} ${W2p.y}) scale(1 ${KH}) rotate(${pose.phi - 90})`}>
        <GripperKnife id="over" />
      </g>
    </g>
  );
};
