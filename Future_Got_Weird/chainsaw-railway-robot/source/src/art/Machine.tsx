// The railway machine, as an ORIGINAL FGW reconstruction (not traced from any photograph; the source footage could not
// be screened from this environment, so proportions follow the published text descriptions only: a humanoid upper
// body with a camera head and two arms, on a boom rising from a rail-capable maintenance vehicle, operated from a
// cabin on the vehicle). One arm ends in a four-finger claw, the other in a chainsaw.
// World units are centimetres; y is up-negative; the rail top is y = 0. Every joint is a pure function of the pose.
import React from 'react';
import {add, clamp, len, lerp, mul, norm, perp, sub, V} from '../dc/math';
import {angOf, circ, dirOf, f, fpts, fx, Frame, INK, IP, Line, Mat, poly, slab} from '../lib/draw';

export const COL = {
  body: '#E6ECF1',
  panel: '#CDD7E0',
  joint: '#3C4855',
  dark: '#26313B',
  accent: '#EE7A26',
  boom: '#F2B33A',
  truck: '#F0B429',
  truckDark: '#B9801A',
  cabin: '#EAF0F4',
  glass: '#9FD3E8',
  glassDeep: '#5C9DB8',
  rubber: '#2A2F35',
  steel: '#9AA7B2',
  bar: '#C9D2DA',
  chain: '#4A535C',
  lens: '#123447',
};

/** colour scheme: '' = the JR East machine of the main story; '-w' = JR West's separate machines (blue) */
export const SchemeCtx = React.createContext<'' | '-w'>('');
const useU = () => {
  const sfx = React.useContext(SchemeCtx);
  return (name: string) => (['m-truck', 'm-boom', 'm-accent'].includes(name) ? `url(#${name}${sfx})` : `url(#${name})`);
};

export const MachineDefs: React.FC = () => (
  <defs>
    <Mat id="m-truck-w" c="#5B8CC4" k={0.8} />
    <Mat id="m-boom-w" c="#8DB3D9" k={0.8} />
    <Mat id="m-accent-w" c="#2F6FB3" k={0.8} />
    <Mat id="m-body" c={COL.body} k={0.7} />
    <Mat id="m-panel" c={COL.panel} k={0.8} />
    <Mat id="m-joint" c={COL.joint} k={0.9} />
    <Mat id="m-dark" c={COL.dark} k={0.8} />
    <Mat id="m-accent" c={COL.accent} k={0.8} />
    <Mat id="m-boom" c={COL.boom} k={0.8} />
    <Mat id="m-truck" c={COL.truck} k={0.8} />
    <Mat id="m-cabin" c={COL.cabin} k={0.7} />
    <Mat id="m-steel" c={COL.steel} k={0.8} />
    <Mat id="m-bar" c={COL.bar} k={0.6} />
    <linearGradient id="m-glass" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stopColor="#D8F1FA" />
      <stop offset="0.5" stopColor={COL.glass} />
      <stop offset="1" stopColor={COL.glassDeep} />
    </linearGradient>
    <radialGradient id="m-lens" cx="0.38" cy="0.35" r="0.7">
      <stop offset="0" stopColor="#4FA7CF" />
      <stop offset="0.45" stopColor={COL.lens} />
      <stop offset="1" stopColor="#060E14" />
    </radialGradient>
    <radialGradient id="m-cabinlight" cx="0.5" cy="0.45" r="0.65">
      <stop offset="0" stopColor="#FFE7B0" />
      <stop offset="1" stopColor="#E9A95A" />
    </radialGradient>
  </defs>
);

export type ArmPose = {
  /** wrist target (world) */
  w: V;
  /** tool direction (deg) */
  a: number;
  /** elbow side +1/-1 */
  side: number;
};
export type MachinePose = {
  /** truck reference x (front of the driver's cab) */
  x: number;
  /** boom: lower angle (deg above horizontal), upper angle, upper length (telescopic) */
  b1: number;
  b2: number;
  l2: number;
  claw: ArmPose;
  saw: ArmPose;
  /** claw opening 0 closed .. 1 open */
  open: number;
  /** grip squeeze (0..1) adds a little extra closure and a pressure flex */
  squeeze: number;
  /** chainsaw running 0..1 and its chain phase (cm travelled) */
  run: number;
  chain: number;
  /** head pan (deg, small) */
  head: number;
  /** body vibration amplitude (cm) while cutting */
  shake: number;
};

export const DIMS = {
  boomBase: {x: 330, y: -205},
  L1: 520,
  torsoH: 175,
  upper: 172,
  fore: 160,
  shoulderNear: {x: 10, y: -150},
  shoulderFar: {x: 34, y: -162},
};

/** two-bone IK (soft limit); returns the elbow and the reachable wrist */
export const ik2 = (S: V, T: V, l1: number, l2: number, side: number) => {
  const d0 = sub(T, S);
  const L = l1 + l2;
  const d = clamp(len(d0), Math.abs(l1 - l2) + 1, L * 0.995);
  const dir = norm(d0);
  const a = (l1 * l1 + d * d - l2 * l2) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const E = add(add(S, mul(dir, a)), mul(perp(dir), h * side));
  const Wr = add(S, mul(dir, d));
  return {E, W: Wr};
};

export const machineGeo = (p: MachinePose) => {
  const B0 = {x: p.x + DIMS.boomBase.x, y: DIMS.boomBase.y};
  const B1 = add(B0, mul(dirOf(-p.b1), DIMS.L1));
  const B2 = add(B1, mul(dirOf(-p.b2), p.l2));
  // robot mount: the rotator below the torso sits on the boom tip; the torso is levelled
  const M = add(B2, {x: 0, y: -46});
  const sh = {x: Math.sin(p.chain * 0.9) * p.shake, y: Math.cos(p.chain * 1.3) * p.shake * 0.6};
  const T0 = add(M, sh);
  const SN = add(T0, DIMS.shoulderNear);
  const SF = add(T0, DIMS.shoulderFar);
  const armN = ik2(SN, p.claw.w, DIMS.upper, DIMS.fore, p.claw.side);
  const armF = ik2(SF, add(p.saw.w, sh), DIMS.upper, DIMS.fore, p.saw.side);
  const head = add(T0, {x: 14, y: -DIMS.torsoH - 30});
  const clawF: Frame = {o: armN.W, a: p.claw.a};
  const sawF: Frame = {o: armF.W, a: p.saw.a};
  // the claw's grip point (between the finger tips) and the saw's cutting point (along the bar)
  const grip = fx(clawF, {x: 62, y: 0});
  const sawTip = fx(sawF, {x: 150, y: 0});
  const sawCut = fx(sawF, {x: 95, y: 7});
  const cabin = {x: p.x + 70, y: -140};
  return {B0, B1, B2, M: T0, SN, SF, armN, armF, head, clawF, sawF, grip, sawTip, sawCut, cabin};
};
export type MGeo = ReturnType<typeof machineGeo>;

const OUT = 3.2;

/** the claw: palm block + four fingers (two near, two far), each two segments; open 0..1 */
export const Claw: React.FC<{F: Frame; open: number; squeeze?: number; part?: 'all' | 'back' | 'front'; k?: number}> = ({F, open, squeeze = 0, part = 'all', k = 1}) => {
  const u = useU();
  const o = clamp(open - squeeze * 0.08);
  const fingers = (sgn: number, back: boolean) => {
    const base = fx(F, {x: 30, y: sgn * (back ? 9 : 15)});
    const a0 = F.a + sgn * lerp(8, 52, o);
    const m = add(base, mul(dirOf(a0), 30 * k));
    const a1 = a0 - sgn * lerp(30, 6, o);
    const tip = add(m, mul(dirOf(a1), 26 * k));
    const a2 = a1 - sgn * lerp(28, 10, o);
    const nail = add(tip, mul(dirOf(a2), 9 * k));
    const fill = back ? 'url(#m-dark)' : 'url(#m-joint)';
    return (
      <g key={`${sgn}${back}`}>
        <IP d={slab(base, m, 7.5 * k, 6.5 * k)} fill={fill} ink={OUT} />
        <IP d={slab(m, tip, 6.5 * k, 5 * k)} fill={fill} ink={OUT} />
        <IP d={slab(tip, nail, 5 * k, 2.6 * k, 0.6)} fill={back ? COL.dark : COL.accent} ink={OUT * 0.8} />
        <path d={circ(m, 3.6 * k)} fill={COL.steel} stroke={INK} strokeWidth={1.4} />
      </g>
    );
  };
  if (part === 'back') return <g>{fingers(-1, true)}{fingers(1, true)}</g>;
  return (
    <g>
      {part === 'all' && fingers(-1, true)}
      {part === 'all' && fingers(1, true)}
      <IP d={poly(fpts(F, [[-6, -19], [34, -21], [40, -12], [40, 12], [34, 21], [-6, 19]]))} fill="url(#m-body)" ink={OUT} />
      <IP d={poly(fpts(F, [[6, -19], [14, -19], [14, 19], [6, 19]]))} fill={u('m-accent')} ink={1.6} />
      <path d={circ(fx(F, {x: 26, y: 0}), 5)} fill={COL.joint} stroke={INK} strokeWidth={1.6} />
      {fingers(-1, false)}
      {fingers(1, false)}
    </g>
  );
};

/** the chainsaw end effector: motor housing + guide bar + moving chain */
export const Saw: React.FC<{F: Frame; run: number; chain: number}> = ({F, run, chain}) => {
  const u = useU();
  const bar = fpts(F, [[46, -9], [150, -7.5], [158, -4], [160, 0], [158, 4], [150, 7.5], [46, 9]]);
  // chain: dashed path round the bar, offset moves with chain phase
  const cp = fpts(F, [[44, -10.5], [151, -9], [161, -4.8], [163, 0], [161, 4.8], [151, 9], [44, 10.5]]);
  const chainD = 'M' + cp.map((p) => `${f(p.x)} ${f(p.y)}`).join(' L');
  return (
    <g>
      <IP d={poly(bar)} fill="url(#m-bar)" ink={OUT} />
      <path d={chainD} fill="none" stroke={COL.chain} strokeWidth={4.2} strokeDasharray="5 3.2" strokeDashoffset={f(-chain)} strokeLinejoin="round" />
      <path d={chainD} fill="none" stroke="#E8EDF1" strokeWidth={1.1} strokeDasharray="1.6 6.6" strokeDashoffset={f(-chain)} opacity={0.85} />
      {/* bar rivet and nose sprocket */}
      <path d={circ(fx(F, {x: 150, y: 0}), 3.2)} fill={COL.steel} stroke={INK} strokeWidth={1.2} />
      <path d={circ(fx(F, {x: 70, y: 0}), 2.6)} fill={COL.steel} stroke={INK} strokeWidth={1.2} />
      {/* motor housing */}
      <IP d={poly(fpts(F, [[-8, -22], [40, -24], [52, -16], [52, 16], [40, 22], [-8, 20]]))} fill={u('m-accent')} ink={OUT} />
      <IP d={poly(fpts(F, [[2, -14], [36, -15], [36, -4], [2, -4]]))} fill={COL.dark} ink={1.4} />
      {[0, 1, 2, 3].map((i) => (
        <Line key={i} a={fx(F, {x: 6 + i * 8, y: -12})} b={fx(F, {x: 6 + i * 8, y: -6})} w={2} c="#7C8792" />
      ))}
      <IP d={poly(fpts(F, [[2, 4], [36, 4], [36, 15], [2, 14]]))} fill="url(#m-panel)" ink={1.4} />
      <path d={circ(fx(F, {x: 18, y: 9}), 3)} fill={run > 0.05 ? '#7CFC9A' : '#5A6670'} />
    </g>
  );
};

const Arm: React.FC<{S: V; E: V; Wr: V; far?: boolean}> = ({S, E, Wr, far}) => {
  const u = useU();
  const fill = far ? 'url(#m-panel)' : 'url(#m-body)';
  return (
    <g>
      <IP d={slab(S, E, 22, 19)} fill={fill} ink={OUT} />
      <IP d={slab(E, Wr, 18, 15)} fill={fill} ink={OUT} />
      {/* plating seams and an accent band on the forearm */}
      <Line a={add(S, mul(norm(sub(E, S)), 40))} b={add(S, mul(norm(sub(E, S)), 150))} w={1.5} c="#9AA8B5" />
      <IP d={slab(add(E, mul(norm(sub(Wr, E)), 60)), add(E, mul(norm(sub(Wr, E)), 82)), 18.6, 18)} fill={u('m-accent')} ink={1.6} />
      <path d={circ(E, 21)} fill="url(#m-joint)" stroke={INK} strokeWidth={OUT} />
      <path d={circ(E, 8)} fill={COL.steel} stroke={INK} strokeWidth={1.4} />
      <path d={circ(Wr, 16)} fill="url(#m-joint)" stroke={INK} strokeWidth={OUT} />
      <path d={circ(S, 27)} fill="url(#m-joint)" stroke={INK} strokeWidth={OUT} />
      <path d={circ(S, 10)} fill={COL.steel} stroke={INK} strokeWidth={1.4} />
    </g>
  );
};

/** the boom (two sections, the upper one telescopic), from the turntable to the robot's rotator */
export const Boom: React.FC<{g: MGeo}> = ({g}) => {
  const u = useU();
  const {B0, B1, B2, M} = g;
  const d1 = norm(sub(B1, B0));
  const d2 = norm(sub(B2, B1));
  // hazard chevrons on the lower boom
  const chev = [0.25, 0.32, 0.39].map((t, i) => {
    const c = add(B0, mul(sub(B1, B0), t));
    const n = perp(d1);
    return <path key={i} d={poly([add(c, mul(n, 26)), add(c, mul(d1, 14)), add(c, mul(n, -26)), add(add(c, mul(n, -26)), mul(d1, 10)), add(c, mul(d1, 24)), add(add(c, mul(n, 26)), mul(d1, 10))])} fill={COL.dark} opacity={0.85} />;
  });
  return (
    <g>
      <IP d={slab(B0, B1, 30, 26, 0.5)} fill={u('m-boom')} ink={OUT} />
      {chev}
      <IP d={slab(add(B1, mul(d2, -10)), B2, 22, 17, 0.4)} fill={u('m-boom')} ink={OUT} />
      {/* telescopic sleeve */}
      <IP d={slab(add(B1, mul(d2, -16)), add(B1, mul(d2, 170)), 25, 24, 0.3)} fill={u('m-boom')} ink={OUT} />
      <Line a={add(B1, mul(d2, 172))} b={add(B2, mul(d2, -20))} w={1.6} c="#B57E1E" />
      <path d={circ(B1, 30)} fill="url(#m-joint)" stroke={INK} strokeWidth={OUT} />
      <path d={circ(B1, 11)} fill={COL.steel} stroke={INK} strokeWidth={1.5} />
      <path d={circ(B0, 34)} fill="url(#m-joint)" stroke={INK} strokeWidth={OUT} />
      <path d={circ(B0, 12)} fill={COL.steel} stroke={INK} strokeWidth={1.5} />
      {/* levelling rotator under the torso */}
      <IP d={poly([add(M, {x: -40, y: 6}), add(M, {x: 40, y: 6}), add(M, {x: 30, y: 46}), add(M, {x: -30, y: 46})])} fill="url(#m-joint)" ink={OUT} />
      <path d={circ(B2, 20)} fill="url(#m-joint)" stroke={INK} strokeWidth={OUT} />
      <path d={circ(B2, 7)} fill={COL.steel} stroke={INK} strokeWidth={1.4} />
    </g>
  );
};

/** the robot's upper body: torso, head with two camera lenses, shoulders */
export const Torso: React.FC<{g: MGeo; head: number}> = ({g, head}) => {
  const u = useU();
  const T0 = g.M;
  const P0 = (x: number, y: number) => add(T0, {x, y});
  const H0 = g.head;
  const hp = head;
  return (
    <g>
      {/* neck */}
      <IP d={poly([P0(-4, -170), P0(30, -170), P0(28, -192), P0(-2, -192)])} fill="url(#m-joint)" ink={OUT} />
      {/* torso */}
      <IP d={poly([P0(-58, 0), P0(62, 0), P0(74, -60), P0(70, -150), P0(48, -178), P0(-40, -178), P0(-66, -150), P0(-70, -60)])} fill="url(#m-body)" ink={OUT} />
      <IP d={poly([P0(-30, -40), P0(54, -40), P0(60, -128), P0(-24, -136)])} fill="url(#m-panel)" ink={1.8} />
      <IP d={poly([P0(-58, -14), P0(62, -14), P0(63, -2), P0(-58, -2)])} fill={u('m-accent')} ink={1.6} />
      <path d={circ(P0(20, -92), 9)} fill={COL.dark} stroke={INK} strokeWidth={1.6} />
      {/* head: box with a visor and two camera lenses (stereo) */}
      <IP d={poly([add(H0, {x: -36, y: -34}), add(H0, {x: 38, y: -36}), add(H0, {x: 46, y: -14}), add(H0, {x: 44, y: 26}), add(H0, {x: -34, y: 26})])} fill="url(#m-body)" ink={OUT} />
      <IP d={poly([add(H0, {x: 4 + hp, y: -20}), add(H0, {x: 46, y: -20}), add(H0, {x: 46, y: 8}), add(H0, {x: 4 + hp, y: 8})])} fill="url(#m-dark)" ink={1.8} />
      <path d={circ(add(H0, {x: 20 + hp * 0.6, y: -6}), 9)} fill="url(#m-lens)" stroke={INK} strokeWidth={1.6} />
      <path d={circ(add(H0, {x: 38 + hp * 0.6, y: -6}), 7)} fill="url(#m-lens)" stroke={INK} strokeWidth={1.4} />
      <path d={circ(add(H0, {x: 17 + hp * 0.6, y: -9}), 2.6)} fill="#BFF1FF" opacity={0.9} />
      <path d={circ(add(H0, {x: 36 + hp * 0.6, y: -8.5}), 2)} fill="#BFF1FF" opacity={0.9} />
      <Line a={add(H0, {x: -20, y: -34})} b={add(H0, {x: -24, y: -54})} w={2.4} />
      <path d={circ(add(H0, {x: -24, y: -56}), 3)} fill={COL.accent} />
    </g>
  );
};

/** the far (saw) arm is drawn before the torso, the near (claw) arm after it */
export const Robot: React.FC<{p: MachinePose; g: MGeo; noSaw?: boolean; split?: boolean}> = ({p, g, noSaw, split}) => (
  <g>
    {!noSaw && <Arm S={g.SF} E={g.armF.E} Wr={g.armF.W} far />}
    {!noSaw && <Saw F={g.sawF} run={p.run} chain={p.chain} />}
    <Torso g={g} head={p.head} />
    <Arm S={g.SN} E={g.armN.E} Wr={g.armN.W} />
    <Claw F={g.clawF} open={p.open} squeeze={p.squeeze} part={split ? 'front' : 'all'} />
  </g>
);

/** the rail-road maintenance vehicle: driver's cab (left), operator cabin with a large window, turntable */
export const Truck: React.FC<{x: number; cabinLight?: number; operator?: boolean; windowGlow?: number}> = ({x, cabinLight = 0, operator = true, windowGlow = 0}) => {
  const u = useU();
  const X = (dx: number, y: number) => ({x: x + dx, y});
  const wheel = (dx: number, r: number) => (
    <g key={dx}>
      <path d={circ(X(dx, -r - 4), r)} fill={COL.rubber} stroke={INK} strokeWidth={OUT} />
      <path d={circ(X(dx, -r - 4), r * 0.52)} fill="url(#m-steel)" stroke={INK} strokeWidth={1.6} />
      <path d={circ(X(dx, -r - 4), r * 0.16)} fill={COL.dark} />
    </g>
  );
  return (
    <g>
      {/* chassis */}
      <IP d={poly([X(-20, -60), X(820, -60), X(820, -118), X(-20, -118)])} fill="url(#m-dark)" ink={OUT} />
      {/* rail guide wheels (small steel wheels on the rail) */}
      {[40, 760].map((dx) => (
        <g key={dx}>
          <path d={circ(X(dx, -22), 20)} fill="url(#m-steel)" stroke={INK} strokeWidth={OUT} />
          <path d={circ(X(dx, -22), 7)} fill={COL.dark} />
          <IP d={poly([X(dx - 14, -40), X(dx + 14, -40), X(dx + 10, -70), X(dx - 10, -70)])} fill="url(#m-joint)" ink={2} />
        </g>
      ))}
      {wheel(150, 50)}
      {wheel(270, 50)}
      {wheel(600, 50)}
      {wheel(700, 50)}
      {/* deck */}
      <IP d={poly([X(-10, -112), X(830, -112), X(830, -150), X(-10, -150)])} fill={u('m-truck')} ink={OUT} />
      {/* driver's cab */}
      <IP d={poly([X(-30, -150), X(-30, -310), X(10, -350), X(170, -350), X(170, -150)])} fill={u('m-truck')} ink={OUT} />
      <IP d={poly([X(-12, -232), X(-12, -300), X(20, -330), X(80, -330), X(80, -232)])} fill="url(#m-glass)" ink={2.4} />
      <IP d={poly([X(98, -232), X(98, -330), X(152, -330), X(152, -232)])} fill="url(#m-glass)" ink={2.4} />
      <IP d={poly([X(-30, -170), X(170, -170), X(170, -186), X(-30, -186)])} fill={COL.dark} ink={1.4} />
      {/* operator cabin */}
      <IP d={poly([X(190, -150), X(190, -330), X(214, -352), X(330, -352), X(352, -330), X(352, -150)])} fill="url(#m-cabin)" ink={OUT} />
      <IP d={poly([X(206, -206), X(206, -318), X(222, -334), X(336, -334), X(336, -206)])} fill={cabinLight > 0 ? 'url(#m-cabinlight)' : 'url(#m-glass)'} ink={2.6} />
      {cabinLight > 0 && <IP d={poly([X(206, -206), X(206, -318), X(222, -334), X(336, -334), X(336, -206)])} fill="url(#m-glass)" opacity={1 - cabinLight * 0.75} />}
      {operator && (
        <g opacity={0.92}>
          {/* the operator, seen through the window: head, shoulders, raised hands on the controls */}
          <path d={`M${P2(X(250, -206))} C${P2(X(250, -262))} ${P2(X(312, -262))} ${P2(X(312, -206))} Z`} fill="#2F4157" />
          <path d={circ(X(281, -278), 19)} fill="#F2C9A8" stroke={INK} strokeWidth={2} />
          <path d={`M${P2(X(262, -284))} C${P2(X(262, -306))} ${P2(X(300, -306))} ${P2(X(300, -284))} Z`} fill="#3A2A22" />
          <path d={slab(X(298, -238), X(318, -222), 6, 5)} fill="#2F4157" />
          <path d={circ(X(321, -220), 6)} fill="#F2C9A8" stroke={INK} strokeWidth={1.4} />
        </g>
      )}
      {windowGlow > 0 && <path d={poly([X(206, -206), X(206, -318), X(222, -334), X(336, -334), X(336, -206)])} fill="#FFE6A8" opacity={windowGlow * 0.35} />}
      <IP d={poly([X(190, -170), X(352, -170), X(352, -184), X(190, -184)])} fill={u('m-accent')} ink={1.4} />
      {/* turntable and boom foot */}
      <IP d={poly([X(380, -150), X(520, -150), X(500, -190), X(400, -190)])} fill="url(#m-joint)" ink={OUT} />
      <IP d={poly([X(400, -186), X(500, -186), X(470, -226), X(300, -226), X(300, -205)])} fill={u('m-truck')} ink={OUT} />
      {/* rear stabiliser and rail warning lamp */}
      <IP d={poly([X(780, -112), X(820, -112), X(816, -40), X(784, -40)])} fill="url(#m-joint)" ink={2} />
      <path d={circ(X(150, -364), 9)} fill={COL.accent} stroke={INK} strokeWidth={2} />
    </g>
  );
};
const P2 = (p: V) => `${f(p.x)} ${f(p.y)}`;

/** layer: 'all'; or split for wrapping a grip round a branch drawn between: 'base' (vehicle and boom), 'back' (the
 *  claw's far fingers), 'front' (the robot without those fingers) */
export const Machine: React.FC<{p: MachinePose; cabinLight?: number; windowGlow?: number; noSaw?: boolean; operator?: boolean; layer?: 'all' | 'base' | 'back' | 'front'}> = ({p, cabinLight, windowGlow, noSaw, operator, layer = 'all'}) => {
  const g = machineGeo(p);
  if (layer === 'back') return <Claw F={g.clawF} open={p.open} squeeze={p.squeeze} part="back" />;
  if (layer === 'front') return <Robot p={p} g={g} noSaw={noSaw} split />;
  return (
    <g>
      <Truck x={p.x} cabinLight={cabinLight} windowGlow={windowGlow} operator={operator} />
      <Boom g={g} />
      {layer === 'all' && <Robot p={p} g={g} noSaw={noSaw} />}
    </g>
  );
};

export const angBetween = (a: V, b: V) => angOf(sub(b, a));
