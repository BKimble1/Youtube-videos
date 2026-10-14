import React from 'react';
import {C} from '../theme';
import {joints, RobotPose, RIG, V, rad} from '../lib/robot';

/**
 * The episode's single robot rig, drawn from fixed geometry so the F.02 never changes shape between shots.
 * An original illustration inspired by Figure's F.02 (dark matte body, glossy face plate, visible joint housings,
 * five-finger hands). No logo, no face, no eyes: the face plate stays blank so the drawing never "emotes".
 *
 * Variants share every dimension and differ only in finish:
 *   F02  graphite body, grey joint housings (the real robot in this story)
 *   F03  pale, soft-covered silhouette (the newer model, shown only as a silhouette)
 *   SIM  light-blue simulation body (a virtual robot in a training illustration)
 *   GHOST translucent outline (trails, reference overlays)
 */
export type Finish = 'F02' | 'F03' | 'SIM' | 'GHOST' | 'HOT' | 'HUMAN';

type Pal = {body: string; panel: string; edge: string; far: string; joint: string; jointCore: string; face: string; faceHi: string; ink: string; inkW: number; opacity: number};
const PAL: Record<Finish, Pal> = {
  F02: {body: '#2D333B', panel: '#3C454F', edge: '#68737F', far: '#22272D', joint: '#8C96A1', jointCore: '#2D333B', face: '#0E1318', faceHi: '#7FB3CF', ink: C.ink, inkW: 4, opacity: 1},
  F03: {body: '#E9DFCC', panel: '#DCCFB6', edge: '#F7F0E2', far: '#CDBFA3', joint: '#DCCFB6', jointCore: '#E9DFCC', face: '#3A3F45', faceHi: '#9CB8C8', ink: C.ink, inkW: 4, opacity: 1},
  SIM: {body: '#CFE0F7', panel: '#B9D0F0', edge: '#FFFFFF', far: '#A9C2E8', joint: '#4F7CC9', jointCore: '#CFE0F7', face: '#3A5FA0', faceHi: '#FFFFFF', ink: '#3A5FA0', inkW: 3.5, opacity: 1},
  HOT: {body: '#FF9F2E', panel: '#FFB45C', edge: '#FFE6A0', far: '#E3542A', joint: '#FFD25A', jointCore: '#FF9F2E', face: '#E3542A', faceHi: '#FFF3B8', ink: '#8E3A22', inkW: 4, opacity: 1},
  HUMAN: {body: '#5A4B78', panel: '#5A4B78', edge: '#8C7DB0', far: '#43375E', joint: '#FFFFFF', jointCore: '#FFFFFF', face: '#5A4B78', faceHi: '#5A4B78', ink: C.ink, inkW: 4, opacity: 1},
  GHOST: {body: 'rgba(79,124,201,0.10)', panel: 'rgba(79,124,201,0.06)', edge: 'rgba(255,255,255,0)', far: 'rgba(79,124,201,0.06)', joint: 'rgba(79,124,201,0.35)', jointCore: 'rgba(0,0,0,0)', face: 'rgba(58,95,160,0.25)', faceHi: 'rgba(255,255,255,0)', ink: 'rgba(58,95,160,0.55)', inkW: 3, opacity: 1},
};

const pt = (p: V) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;

/** Closed path of a tapered capsule from a (width wa) to b (width wb), with round ends. */
const capsule = (a: V, b: V, wa: number, wb: number) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L = Math.max(0.001, Math.hypot(dx, dy));
  const nx = -dy / L;
  const ny = dx / L;
  const ra = wa / 2;
  const rb = wb / 2;
  const a1 = {x: a.x + nx * ra, y: a.y + ny * ra};
  const a2 = {x: a.x - nx * ra, y: a.y - ny * ra};
  const b1 = {x: b.x + nx * rb, y: b.y + ny * rb};
  const b2 = {x: b.x - nx * rb, y: b.y - ny * rb};
  return `M ${pt(a1)} L ${pt(b1)} A ${rb} ${rb} 0 0 0 ${pt(b2)} L ${pt(a2)} A ${ra} ${ra} 0 0 0 ${pt(a1)} Z`;
};

/** Map local (forward, up) coordinates in a frame at origin o with pitch ang into world. */
const frame = (o: V, ang: number) => {
  const up = {x: Math.sin(rad(ang)), y: -Math.cos(rad(ang))};
  const fw = {x: Math.cos(rad(ang)), y: Math.sin(rad(ang))};
  return (lx: number, ly: number): V => ({x: o.x + fw.x * lx + up.x * ly, y: o.y + fw.y * lx + up.y * ly});
};
/** Frame along a limb segment with angle a (dir(a) = along the limb): lx = toward the facing side, ly = along the limb. */
const limbFrame = (o: V, a: number) => {
  const along = {x: Math.sin(rad(a)), y: Math.cos(rad(a))};
  const side = {x: Math.cos(rad(a)), y: -Math.sin(rad(a))};
  return (lx: number, ly: number): V => ({x: o.x + side.x * lx + along.x * ly, y: o.y + side.y * lx + along.y * ly});
};
const poly = (f: (x: number, y: number) => V, pts: [number, number][]) => 'M ' + pts.map(([x, y]) => pt(f(x, y))).join(' L ') + ' Z';
/** Smooth closed path through local points (quadratic midpoint smoothing). */
const smooth = (f: (x: number, y: number) => V, pts: [number, number][]) => {
  const P = pts.map(([x, y]) => f(x, y));
  const n = P.length;
  const mid = (i: number) => ({x: (P[i % n].x + P[(i + 1) % n].x) / 2, y: (P[i % n].y + P[(i + 1) % n].y) / 2});
  let d = `M ${pt(mid(0))}`;
  for (let i = 1; i <= n; i++) d += ` Q ${pt(P[i % n])} ${pt(mid(i))}`;
  return d + ' Z';
};

const Seg: React.FC<{a: V; b: V; wa: number; wb: number; fill: string; pal: Pal; edge?: boolean}> = ({a, b, wa, wb, fill, pal, edge = true}) => {
  const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const nx = -(b.y - a.y) / L;
  const ny = (b.x - a.x) / L;
  const o = Math.min(wa, wb) * 0.22;
  return (
    <g>
      <path d={capsule(a, b, wa, wb)} fill={fill} stroke={pal.ink} strokeWidth={pal.inkW} strokeLinejoin="round" />
      {edge && (
        <line x1={a.x + nx * o} y1={a.y + ny * o} x2={b.x + nx * o * 0.9} y2={b.y + ny * o * 0.9} stroke={pal.edge} strokeWidth={3} strokeLinecap="round" opacity={0.55} />
      )}
    </g>
  );
};

const Joint: React.FC<{p: V; r: number; pal: Pal; glow?: number}> = ({p, r: r0, pal, glow = 0}) => {
  const r = pal.joint === '#FFFFFF' ? 5.5 : r0;
  return (
  <g>
    {glow > 0 && <circle cx={p.x} cy={p.y} r={r + 10 + 6 * glow} fill={C.saffron} opacity={0.55 * glow} />}
    <circle cx={p.x} cy={p.y} r={r} fill={pal.joint} stroke={pal.ink} strokeWidth={pal.inkW * 0.8} />
    <circle cx={p.x} cy={p.y} r={r * 0.45} fill={pal.jointCore} />
  </g>
  );
};

/** Side-view hand: palm block along the forearm with curled fingers. */
const Hand: React.FC<{wrist: V; ang: number; pal: Pal; fill: string; fist?: number}> = ({wrist, ang, pal, fill, fist = 0}) => {
  const f = limbFrame(wrist, ang); // ly = along the forearm, away from the elbow; lx = palm front
  const curl = 14 * (1 - fist);
  return (
    <g>
      <path d={smooth(f, [[-12, 2], [12, 2], [14, 26], [8, 34 + curl * 0.4], [-6, 32], [-14, 22]])} fill={fill} stroke={pal.ink} strokeWidth={pal.inkW * 0.85} strokeLinejoin="round" />
      <path d={`M ${pt(f(-8, 24))} Q ${pt(f(0, 30 + curl * 0.3))} ${pt(f(8, 26))}`} fill="none" stroke={pal.ink} strokeWidth={2} opacity={0.7} />
      <path d={capsule(f(12, 10), f(19, 22 - fist * 6), 9, 8)} fill={fill} stroke={pal.ink} strokeWidth={pal.inkW * 0.7} />
    </g>
  );
};

/** Side-view foot: a flat, shoe-like block. */
const Foot: React.FC<{ankle: V; footAng: number; shinAng: number; pal: Pal; fill: string}> = ({ankle, footAng, pal, fill}) => {
  // foot frame: x forward along the sole, y up. Origin at the ankle joint.
  const fw = {x: Math.cos(rad(footAng)), y: -Math.sin(rad(footAng))};
  const up = {x: -Math.sin(rad(footAng)), y: -Math.cos(rad(footAng))};
  const f = (lx: number, ly: number): V => ({x: ankle.x + fw.x * lx + up.x * ly, y: ankle.y + fw.y * lx + up.y * ly});
  return (
    <g>
      <path d={smooth(f, [[-24, 6], [-26, -14], [10, -17], [50, -16], [58, -8], [52, 2], [30, 6], [0, 10]])} fill={fill} stroke={pal.ink} strokeWidth={pal.inkW} strokeLinejoin="round" />
      <path d={`M ${pt(f(-24, -10))} L ${pt(f(52, -11))}`} stroke={pal.edge} strokeWidth={2.5} opacity={0.45} />
    </g>
  );
};

export type RobotProps = {
  pose: RobotPose;
  finish?: Finish;
  /** overall scale about the hip centre */
  scale?: number;
  /** extra opacity */
  opacity?: number;
  /** callouts: highlight a knee actuator, reveal the torso battery */
  glowKnee?: number;
  battery?: number;
  /** clip id (an SVG clipPath defined by the scene), e.g. to hide the part below a molten surface */
  clipId?: string;
  /** shadow ellipse on the ground at this y (world px), or undefined for none */
  groundY?: number;
};

/** Side view. Render inside an <svg> whose coordinates are world px. */
export const RobotSide: React.FC<RobotProps> = ({pose, finish = 'F02', scale = 1, opacity = 1, glowKnee = 0, battery = 0, clipId, groundY}) => {
  const pal = PAL[finish];
  const j = joints(pose);
  const tf = frame(j.hip, j.torsoAng);
  const hf = frame(j.headBase, j.headAng);
  const legW = {th0: 42, th1: 32, sh0: 30, sh1: 24};
  const armW = {u0: 28, u1: 24, f0: 23, f1: 19};
  const farFill = pal.far;
  const leg = (L: typeof j.legN, fill: string, near: boolean) => (
    <g>
      <Seg a={j.hip} b={L.knee} wa={legW.th0} wb={legW.th1} fill={fill} pal={pal} edge={near} />
      <Seg a={L.knee} b={L.ankle} wa={legW.sh0} wb={legW.sh1} fill={fill} pal={pal} edge={near} />
      {/* shin guard plate */}
      {near && finish !== 'GHOST' && finish !== 'HUMAN' && <path d={capsule(limbFrame(L.knee, L.shinAng)(10, 16), limbFrame(L.knee, L.shinAng)(9, 76), 10, 8)} fill={pal.panel} stroke={pal.ink} strokeWidth={2} />}
      <Foot ankle={L.ankle} footAng={L.footAng} shinAng={L.shinAng} pal={pal} fill={fill} />
      {finish !== 'F03' && <Joint p={L.knee} r={near ? 11 : 9} pal={pal} glow={near ? glowKnee : 0} />}
    </g>
  );
  const arm = (A: typeof j.armN, fill: string, near: boolean) => (
    <g>
      <Seg a={j.shoulder} b={A.elbow} wa={armW.u0} wb={armW.u1} fill={fill} pal={pal} edge={near} />
      <Seg a={A.elbow} b={A.wrist} wa={armW.f0} wb={armW.f1} fill={fill} pal={pal} edge={near} />
      <Hand wrist={A.wrist} ang={A.foreAng} pal={pal} fill={fill} fist={pose.hand ?? 0} />
      {finish !== 'F03' && <Joint p={A.elbow} r={near ? 9 : 7.5} pal={pal} />}
    </g>
  );
  // torso profile, local (forward, up) from the hip centre
  const torso: [number, number][] = [
    [-30, -26], [-32, 30], [-41, 96], [-37, 150], [-20, 178], [18, 180], [43, 164], [53, 120], [44, 76], [30, 46], [34, 4], [28, -26], [0, -34],
  ];
  const chest: [number, number][] = [[-8, 154], [36, 158], [46, 120], [36, 90], [-6, 94]];
  const pelvis: [number, number][] = [[-30, -28], [-30, 18], [30, 18], [30, -24], [0, -36]];
  const head: [number, number][] = [[-30, 4], [-34, 40], [-24, 66], [8, 72], [30, 62], [36, 30], [30, 2], [0, -4]];
  const facePlate: [number, number][] = [[18, 8], [34, 12], [38, 36], [32, 62], [16, 64], [22, 36]];
  const shadow = groundY !== undefined ? (
    <ellipse cx={j.hip.x} cy={groundY} rx={Math.max(20, 90 - Math.max(0, groundY - Math.max(j.legN.sole.y, j.legF.sole.y)) * 0.25)} ry={12} fill={C.shadow} />
  ) : null;
  return (
    <g opacity={opacity * pal.opacity} transform={scale !== 1 ? `translate(${pose.x} ${pose.y}) scale(${scale}) translate(${-pose.x} ${-pose.y})` : undefined} clipPath={clipId ? `url(#${clipId})` : undefined}>
      {shadow}
      {/* far side */}
      {arm(j.armF, farFill, false)}
      {leg(j.legF, farFill, false)}
      {/* neck */}
      <Seg a={j.neckBase} b={j.headBase} wa={20} wb={18} fill={pal.panel} pal={pal} edge={false} />
      {/* torso */}
      <path d={smooth(tf, torso)} fill={pal.body} stroke={pal.ink} strokeWidth={pal.inkW} strokeLinejoin="round" />
      {finish !== 'GHOST' && finish !== 'HUMAN' && <path d={smooth(tf, chest)} fill={pal.panel} stroke={pal.ink} strokeWidth={2.5} strokeLinejoin="round" />}
      {finish !== 'GHOST' && finish !== 'HUMAN' && <path d={smooth(tf, pelvis)} fill={pal.panel} stroke={pal.ink} strokeWidth={2.5} strokeLinejoin="round" opacity={0.9} />}
      {finish === 'F02' && <path d={`M ${pt(tf(-24, 60))} Q ${pt(tf(-31, 110))} ${pt(tf(-24, 146))}`} stroke={pal.edge} strokeWidth={3} fill="none" opacity={0.5} />}
      {battery > 0 && (
        <g opacity={battery}>
          <path d={poly(tf, [[-20, 60], [22, 60], [24, 132], [-22, 132]])} fill={C.saffron} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
          <path d={poly(tf, [[-6, 132], [8, 132], [8, 140], [-6, 140]])} fill={C.saffronDeep} stroke={C.ink} strokeWidth={3} />
          <path d={poly(tf, [[2, 112], [-8, 96], [2, 96], [-4, 78], [10, 100], [0, 100]])} fill={C.ink} />
        </g>
      )}
      {/* head */}
      {finish === 'HUMAN' ? (
        <circle cx={hf(2, 36).x} cy={hf(2, 36).y} r={34} fill={pal.body} stroke={pal.ink} strokeWidth={pal.inkW} />
      ) : (
      <path d={smooth(hf, head)} fill={pal.body} stroke={pal.ink} strokeWidth={pal.inkW} strokeLinejoin="round" />
      )}
      {finish !== 'HUMAN' && <path d={smooth(hf, facePlate)} fill={pal.face} stroke={pal.ink} strokeWidth={3} strokeLinejoin="round" />}
      {finish !== 'GHOST' && finish !== 'HUMAN' && <path d={`M ${pt(hf(29, 16))} Q ${pt(hf(35, 34))} ${pt(hf(30, 52))}`} stroke={pal.faceHi} strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={0.75} />}
      {finish === 'F02' && <circle cx={hf(-14, 34).x} cy={hf(-14, 34).y} r={7} fill={pal.panel} stroke={pal.ink} strokeWidth={2.5} />}
      {/* near side */}
      {leg(j.legN, pal.body, true)}
      {finish !== 'F03' && <Joint p={j.hip} r={13} pal={pal} />}
      {arm(j.armN, pal.body, true)}
      {finish !== 'F03' && <Joint p={j.shoulder} r={12} pal={pal} />}
    </g>
  );
};

/* ------------------------------------------------------------------ front / back views */

export type FrontPose = {x: number; y: number; armL: number; armR: number; elL: number; elR: number; legL: number; legR: number; tilt: number};
export const FRONT_STAND: FrontPose = {x: 0, y: 0, armL: 6, armR: 6, elL: 6, elR: 6, legL: 2, legR: 2, tilt: 0};

/**
 * Front (view = 'front') or back (view = 'back') view with the same proportions as the side view. Ground point at
 * (x, y). Used for the identity card, the options board, the line-up, and the over-the-shoulder thumbnail.
 */
export const RobotFront: React.FC<{pose?: Partial<FrontPose>; finish?: Finish; view?: 'front' | 'back'; scale?: number; opacity?: number; battery?: number; glowKnee?: number; shadow?: boolean}> = ({pose: p0 = {}, finish = 'F02', view = 'front', scale = 1, opacity = 1, battery = 0, glowKnee = 0, shadow = true}) => {
  const p = {...FRONT_STAND, ...p0};
  const pal = PAL[finish];
  const hipY = -(RIG.thigh + RIG.shin + RIG.ankleDrop);
  const shY = hipY - RIG.shoulderUp;
  const topY = hipY - RIG.spine;
  const headBase = topY - RIG.neck;
  const legs = [-1, 1].map((s) => {
    const a = (s < 0 ? p.legL : p.legR) * s; // abduction outward
    const hip = {x: s * RIG.hipSpread, y: hipY};
    const knee = {x: hip.x + Math.sin(rad(a)) * RIG.thigh, y: hip.y + Math.cos(rad(a)) * RIG.thigh};
    const ankle = {x: knee.x + Math.sin(rad(a)) * RIG.shin, y: knee.y + Math.cos(rad(a)) * RIG.shin};
    return {s, hip, knee, ankle};
  });
  const arms = [-1, 1].map((s) => {
    const a = (s < 0 ? p.armL : p.armR) * s;
    const e = (s < 0 ? p.elL : p.elR) * s;
    const sh = {x: s * RIG.shoulderSpread, y: shY};
    const elbow = {x: sh.x + Math.sin(rad(a)) * RIG.upper, y: sh.y + Math.cos(rad(a)) * RIG.upper};
    const wrist = {x: elbow.x + Math.sin(rad(a + e)) * RIG.fore, y: elbow.y + Math.cos(rad(a + e)) * RIG.fore};
    return {s, sh, elbow, wrist, ang: a + e};
  });
  const torso = `M ${-58} ${topY + 8} Q ${-74} ${topY + 10} ${-76} ${shY + 18} L ${-52} ${hipY - 70} Q ${-40} ${hipY - 40} ${-44} ${hipY + 10} L ${44} ${hipY + 10} Q ${40} ${hipY - 40} ${52} ${hipY - 70} L ${76} ${shY + 18} Q ${74} ${topY + 10} ${58} ${topY + 8} Q 0 ${topY - 4} ${-58} ${topY + 8} Z`;
  const chest = `M ${-48} ${topY + 22} Q 0 ${topY + 12} ${48} ${topY + 22} L ${40} ${topY + 82} Q 0 ${topY + 94} ${-40} ${topY + 82} Z`;
  return (
    <g transform={`translate(${p.x} ${p.y}) scale(${scale})`} opacity={opacity}>
      {shadow && <ellipse cx={0} cy={4} rx={96} ry={14} fill={C.shadow} />}
      {legs.map((L) => (
        <g key={L.s}>
          <Seg a={L.hip} b={L.knee} wa={42} wb={32} fill={pal.body} pal={pal} />
          <Seg a={L.knee} b={L.ankle} wa={30} wb={24} fill={pal.body} pal={pal} />
          <path d={`M ${L.ankle.x - 26} ${L.ankle.y + 18} Q ${L.ankle.x - 28} ${L.ankle.y - 6} ${L.ankle.x} ${L.ankle.y - 8} Q ${L.ankle.x + 28} ${L.ankle.y - 6} ${L.ankle.x + 26} ${L.ankle.y + 18} Z`} fill={pal.body} stroke={pal.ink} strokeWidth={pal.inkW} strokeLinejoin="round" />
          {finish !== 'F03' && <Joint p={L.knee} r={11} pal={pal} glow={glowKnee} />}
        </g>
      ))}
      <path d={`M ${-40} ${hipY - 6} L ${40} ${hipY - 6} L ${34} ${hipY + 26} Q 0 ${hipY + 40} ${-34} ${hipY + 26} Z`} fill={pal.panel} stroke={pal.ink} strokeWidth={pal.inkW} strokeLinejoin="round" />
      <path d={torso} fill={pal.body} stroke={pal.ink} strokeWidth={pal.inkW} strokeLinejoin="round" />
      {finish !== 'GHOST' && view === 'front' && <path d={chest} fill={pal.panel} stroke={pal.ink} strokeWidth={2.5} strokeLinejoin="round" />}
      {view === 'back' && finish !== 'GHOST' && <path d={`M 0 ${topY + 14} L 0 ${hipY - 10}`} stroke={pal.edge} strokeWidth={3} opacity={0.5} />}
      {view === 'back' && finish !== 'GHOST' && <rect x={-34} y={topY + 34} width={68} height={86} rx={12} fill={pal.panel} stroke={pal.ink} strokeWidth={2.5} />}
      {battery > 0 && (
        <g opacity={battery}>
          <rect x={-30} y={topY + 34} width={60} height={78} rx={8} fill={C.saffron} stroke={C.ink} strokeWidth={3.5} />
          <path d={`M 6 ${topY + 48} L -10 ${topY + 76} L 2 ${topY + 76} L -6 ${topY + 100} L 12 ${topY + 70} L 0 ${topY + 70} Z`} fill={C.ink} />
        </g>
      )}
      {arms.map((A) => (
        <g key={A.s}>
          <Seg a={A.sh} b={A.elbow} wa={28} wb={24} fill={pal.body} pal={pal} />
          <Seg a={A.elbow} b={A.wrist} wa={23} wb={19} fill={pal.body} pal={pal} />
          <path d={capsule(A.wrist, {x: A.wrist.x + Math.sin(rad(A.ang)) * 26, y: A.wrist.y + Math.cos(rad(A.ang)) * 26}, 26, 20)} fill={pal.body} stroke={pal.ink} strokeWidth={pal.inkW * 0.85} />
          {finish !== 'F03' && <Joint p={A.elbow} r={9} pal={pal} />}
          {finish !== 'F03' && <Joint p={A.sh} r={13} pal={pal} />}
        </g>
      ))}
      <rect x={-11} y={headBase} width={22} height={RIG.neck + 6} fill={pal.panel} stroke={pal.ink} strokeWidth={3} />
      <g transform={`rotate(${p.tilt} 0 ${headBase})`}>
        <path d={`M ${-34} ${headBase - 4} Q ${-40} ${headBase - RIG.headH * 0.55} ${-28} ${headBase - RIG.headH + 2} Q 0 ${headBase - RIG.headH - 8} ${28} ${headBase - RIG.headH + 2} Q ${40} ${headBase - RIG.headH * 0.55} ${34} ${headBase - 4} Q 0 ${headBase + 6} ${-34} ${headBase - 4} Z`} fill={pal.body} stroke={pal.ink} strokeWidth={pal.inkW} strokeLinejoin="round" />
        {view === 'front' && (
          <g>
            <path d={`M ${-26} ${headBase - 12} Q ${-30} ${headBase - RIG.headH * 0.55} ${-22} ${headBase - RIG.headH + 10} Q 0 ${headBase - RIG.headH + 2} ${22} ${headBase - RIG.headH + 10} Q ${30} ${headBase - RIG.headH * 0.55} ${26} ${headBase - 12} Q 0 ${headBase - 4} ${-26} ${headBase - 12} Z`} fill={pal.face} stroke={pal.ink} strokeWidth={3} />
            {finish !== 'GHOST' && <path d={`M ${-16} ${headBase - RIG.headH + 16} Q 0 ${headBase - RIG.headH + 10} ${16} ${headBase - RIG.headH + 16}`} stroke={pal.faceHi} strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={0.7} />}
          </g>
        )}
        {view === 'back' && finish !== 'GHOST' && <path d={`M 0 ${headBase - RIG.headH + 4} L 0 ${headBase - 6}`} stroke={pal.edge} strokeWidth={3} fill="none" opacity={0.5} />}
      </g>
    </g>
  );
};
