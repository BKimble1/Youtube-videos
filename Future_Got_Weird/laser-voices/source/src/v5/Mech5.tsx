// V5 World 3: inside the technology.
//   S9 (15.0..17.75) Mech5: the transmitter in cutaway, from above, locked. The cover slides off. The laser module fires
//   up into a small mirror on a galvanometer motor (a scanning mirror); the mirror tilts back and forth by a few
//   degrees, so the beam leaving the window swings across a narrow arc (reflection doubles the mirror's angle).
//   S10 (17.75..20.0) Sweep5: the same lab in plan view, locked. Slowed right down: the sweep carries the lit air
//   toward the listener at the speed of sound; every point the beam passes gives off a little sound as it is lit; since
//   the source keeps pace with its own sound, all of it arrives at his ear together and stacks up there. A colleague
//   a metre away gets the same fronts one at a time, weak.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, ss, lerp, W, H, kv} from '../v4/core4';
import {INK} from '../v4/rig/cast4';

const K = {bg: '#22323A', grid: '#2B3D45', body: '#2B3138', bodyHi: '#3C444D', cut: '#F2E6C8', hatch: '#C9B98F', pcb: '#2F6F5A', chip: '#1A2228', metal: '#8FA3AD', metalDeep: '#5E727C',
  mirror: '#DDEBF0', teal: '#1CA7A0', ir: '#FFB347', irGlow: '#FF9A2E', irCore: '#FFF3D6', wave: '#BFE9F0', led: '#FFC744'};

// ---------------------------------------------------------------- S9: the cutaway
const BOX = {x0: 190, x1: 910, y0: 520, y1: 1160, wall: 26};
const MIRROR = {x: 430, y: 720, len: 84};
const MODULE = {x: 430, y0: 905, y1: 1110};
const WINDOW_Y = 720;
// the galvo: the mirror tilts +-4 deg about 45 deg (slow motion), the beam swings +-8 deg
export const galvoAngle = (t: number) => 4 * Math.sin((t - 15.5) * 2 * Math.PI * 0.9) * ss(15.45, 15.75, t);
const rot = (x: number, y: number, cx: number, cy: number, deg: number) => {
  const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return {x: cx + (x - cx) * c - (y - cy) * s, y: cy + (x - cx) * s + (y - cy) * c};
};
export const Mech5: React.FC<{t: number}> = ({t}) => {
  const cover = ss(15.08, 15.5, t); // 0 closed .. 1 off
  const g = galvoAngle(t);
  // the incoming beam travels up (-y); the mirror at 45 deg + g sends it left, at 2g from horizontal
  const outDeg = 180 + 2 * g; // direction angle on screen (deg, 0 = +x, y down)
  const od = {x: Math.cos((outDeg * Math.PI) / 180), y: Math.sin((outDeg * Math.PI) / 180)};
  const exitX = BOX.x0 - 6, exitY = MIRROR.y + od.y * ((MIRROR.x - exitX) / -od.x);
  const farX = -40, farY = MIRROR.y + od.y * ((MIRROR.x - farX) / -od.x);
  const on = ss(15.4, 15.6, t);
  const fan = ss(16.3, 16.8, t); // the arc it covers, drawn faintly once it has swept a few times
  const m1 = rot(MIRROR.x - MIRROR.len / 2, MIRROR.y, MIRROR.x, MIRROR.y, -45 + g), m2 = rot(MIRROR.x + MIRROR.len / 2, MIRROR.y, MIRROR.x, MIRROR.y, -45 + g);
  const fanPts = [-8, 8].map((d) => ({x: farX, y: MIRROR.y + Math.tan((d * Math.PI) / 180) * (MIRROR.x - farX)}));
  const fanSpin = (t * 900) % 360;
  return (
    <AbsoluteFill style={{background: K.bg}}>
      <svg width={W} height={H}>
        <defs>
          <pattern id="m5grid" width={60} height={60} patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke={K.grid} strokeWidth={2} /></pattern>
          <pattern id="m5hatch" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1={0} y1={0} x2={0} y2={14} stroke={K.hatch} strokeWidth={4} /></pattern>
          <filter id="m5glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation={6} /></filter>
        </defs>
        <rect width={W} height={H} fill="url(#m5grid)" />
        <g transform="translate(540 870) scale(1.22) translate(-550 -840)">
        {/* the swept arc outside, faint, and the beam (a visualisation) */}
        {fan > 0 && <path d={`M ${MIRROR.x} ${MIRROR.y} L ${fanPts[0].x} ${fanPts[0].y} L ${fanPts[1].x} ${fanPts[1].y} Z`} fill={K.ir} opacity={0.08 * fan} />}
        {on > 0 && (
          <g opacity={on}>
            <line x1={MIRROR.x} y1={MIRROR.y} x2={farX} y2={farY} stroke={K.irGlow} strokeWidth={14} opacity={0.4} filter="url(#m5glow)" />
            <line x1={MIRROR.x} y1={MIRROR.y} x2={farX} y2={farY} stroke={K.ir} strokeWidth={4} />
            <line x1={MIRROR.x} y1={MIRROR.y} x2={farX} y2={farY} stroke={K.irCore} strokeWidth={1.6} />
          </g>
        )}
        {/* housing: floor of the box, then its walls in section (hatched cut faces) */}
        <rect x={BOX.x0} y={BOX.y0} width={BOX.x1 - BOX.x0} height={BOX.y1 - BOX.y0} rx={30} fill="#33424A" stroke={INK} strokeWidth={5} />
        <path d={`M ${BOX.x0} ${BOX.y0 + 30} Q ${BOX.x0} ${BOX.y0} ${BOX.x0 + 30} ${BOX.y0} L ${BOX.x1 - 30} ${BOX.y0} Q ${BOX.x1} ${BOX.y0} ${BOX.x1} ${BOX.y0 + 30} L ${BOX.x1} ${BOX.y1 - 30} Q ${BOX.x1} ${BOX.y1} ${BOX.x1 - 30} ${BOX.y1} L ${BOX.x0 + 30} ${BOX.y1} Q ${BOX.x0} ${BOX.y1} ${BOX.x0} ${BOX.y1 - 30} Z
          M ${BOX.x0 + BOX.wall} ${BOX.y0 + BOX.wall} L ${BOX.x0 + BOX.wall} ${BOX.y1 - BOX.wall} L ${BOX.x1 - BOX.wall} ${BOX.y1 - BOX.wall} L ${BOX.x1 - BOX.wall} ${BOX.y0 + BOX.wall} Z`} fill={K.cut} fillRule="evenodd" stroke={INK} strokeWidth={4} />
        <path d={`M ${BOX.x0} ${BOX.y0 + 30} Q ${BOX.x0} ${BOX.y0} ${BOX.x0 + 30} ${BOX.y0} L ${BOX.x1 - 30} ${BOX.y0} Q ${BOX.x1} ${BOX.y0} ${BOX.x1} ${BOX.y0 + 30} L ${BOX.x1} ${BOX.y1 - 30} Q ${BOX.x1} ${BOX.y1} ${BOX.x1 - 30} ${BOX.y1} L ${BOX.x0 + 30} ${BOX.y1} Q ${BOX.x0} ${BOX.y1} ${BOX.x0} ${BOX.y1 - 30} Z
          M ${BOX.x0 + BOX.wall} ${BOX.y0 + BOX.wall} L ${BOX.x0 + BOX.wall} ${BOX.y1 - BOX.wall} L ${BOX.x1 - BOX.wall} ${BOX.y1 - BOX.wall} L ${BOX.x1 - BOX.wall} ${BOX.y0 + BOX.wall} Z`} fill="url(#m5hatch)" fillRule="evenodd" opacity={0.5} />
        {/* the exit window in the left wall */}
        <rect x={BOX.x0 - 4} y={WINDOW_Y - 40} width={BOX.wall + 8} height={80} fill="#5A3038" stroke={INK} strokeWidth={4} />
        <rect x={BOX.x0 + 2} y={WINDOW_Y - 34} width={6} height={68} fill="#FFFFFF" opacity={0.3} />
        {/* driver board */}
        <rect x={620} y={570} width={250} height={300} rx={10} fill={K.pcb} stroke={INK} strokeWidth={4} />
        {[[650, 600, 70, 50], [740, 600, 100, 60], [650, 690, 50, 50], [720, 700, 120, 40], [660, 780, 180, 50]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx={4} fill={K.chip} stroke={INK} strokeWidth={3} />)}
        {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={640 + i * 38} y1={858} x2={640 + i * 38} y2={868} stroke={K.led} strokeWidth={4} />)}
        <circle cx={850} cy={592} r={9} fill={on > 0.5 ? K.led : '#5A4A20'} stroke={INK} strokeWidth={3} />
        {/* the galvo's drive cable: board -> motor */}
        <path d={`M 620 760 C 560 760 600 720 540 720`} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
        <path d={`M 620 760 C 560 760 600 720 540 720`} fill="none" stroke="#C0392B" strokeWidth={5} strokeLinecap="round" />
        {/* cooling fan */}
        <circle cx={760} cy={1010} r={95} fill="#1E2328" stroke={INK} strokeWidth={4} />
        <g transform={`rotate(${fanSpin} 760 1010)`}>{[0, 72, 144, 216, 288].map((a) => <path key={a} d="M 760 1010 C 790 960 830 950 845 985 C 820 990 795 1000 760 1010 Z" fill={K.metal} stroke={INK} strokeWidth={2.5} transform={`rotate(${a} 760 1010)`} />)}</g>
        <circle cx={760} cy={1010} r={20} fill={K.metalDeep} stroke={INK} strokeWidth={3} />
        {/* the laser module (fires up), with its fins */}
        <rect x={MODULE.x - 40} y={MODULE.y0} width={80} height={MODULE.y1 - MODULE.y0} rx={10} fill="#5E7883" stroke={INK} strokeWidth={4} />
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={MODULE.x - 58} y={MODULE.y0 + 50 + i * 24} width={116} height={10} rx={3} fill={K.metalDeep} stroke={INK} strokeWidth={2} />)}
        <rect x={MODULE.x - 14} y={MODULE.y0 - 14} width={28} height={18} rx={3} fill={K.irGlow} stroke={INK} strokeWidth={3} />
        {/* inside beam: module -> mirror */}
        {on > 0 && <g opacity={on}><line x1={MODULE.x} y1={MODULE.y0 - 12} x2={MIRROR.x} y2={MIRROR.y} stroke={K.irGlow} strokeWidth={12} opacity={0.4} filter="url(#m5glow)" /><line x1={MODULE.x} y1={MODULE.y0 - 12} x2={MIRROR.x} y2={MIRROR.y} stroke={K.ir} strokeWidth={4} /></g>}
        {/* the galvanometer motor and its mirror */}
        <rect x={MIRROR.x + 18} y={MIRROR.y - 34} width={120} height={68} rx={12} fill={K.metal} stroke={INK} strokeWidth={4} />
        <rect x={MIRROR.x + 30} y={MIRROR.y - 34} width={14} height={68} fill={K.metalDeep} />
        <line x1={MIRROR.x} y1={MIRROR.y} x2={MIRROR.x + 22} y2={MIRROR.y} stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <line x1={m1.x} y1={m1.y} x2={m2.x} y2={m2.y} stroke={INK} strokeWidth={18} strokeLinecap="round" />
        <line x1={m1.x} y1={m1.y} x2={m2.x} y2={m2.y} stroke={K.mirror} strokeWidth={11} strokeLinecap="round" />
        {/* the cover: slides off at the start */}
        {cover < 1 && (
          <g transform={`translate(${-cover * 40} ${-cover * 760})`} opacity={1 - ss(0.6, 1, cover)}>
            <rect x={BOX.x0 - 10} y={BOX.y0 - 10} width={BOX.x1 - BOX.x0 + 20} height={BOX.y1 - BOX.y0 + 20} rx={36} fill={K.body} stroke={INK} strokeWidth={5} />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={BOX.x0 + 330 + i * 46} y={BOX.y0 + 60} width={22} height={300} rx={8} fill="#1E2328" />)}
            <rect x={BOX.x0 + 60} y={BOX.y0 + 60} width={200} height={70} rx={8} fill={K.cut} stroke={INK} strokeWidth={3} />
            <rect x={BOX.x0 + 40} y={BOX.y1 - 160} width={BOX.x1 - BOX.x0 - 60} height={22} fill={K.teal} stroke={INK} strokeWidth={3} />
          </g>
        )}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- S10: the plan diagram
const PX = 260; // px per metre
const WIN = {x: 860, y: 760}; // the window (the sweep pivots here)
const EAR = {x: WIN.x - 2.44 * PX, y: 840}; // his left ear, 8 ft away
const R = Math.hypot(EAR.x - WIN.x, EAR.y - WIN.y), BASE = Math.atan2(EAR.y - WIN.y, EAR.x - WIN.x);
const SW = {t0: 18.0, t1: 19.25, a0: 26}; // degrees: the beam starts 26 deg off his ear and sweeps onto it
const C_V = (R * (SW.a0 * Math.PI) / 180) / (SW.t1 - SW.t0); // the sweep's speed along the arc = the (slowed) speed of sound
const angAt = (t: number) => (t < SW.t0 ? SW.a0 : t > SW.t1 ? 0 : SW.a0 * (1 - (t - SW.t0) / (SW.t1 - SW.t0)));
const tipAt = (deg: number) => ({x: WIN.x + R * Math.cos(BASE + (deg * Math.PI) / 180), y: WIN.y + R * Math.sin(BASE + (deg * Math.PI) / 180)});
const COLLEAGUE = {x: EAR.x + 60, y: EAR.y + 300};

const TopPerson: React.FC<{x: number; y: number; face: number; hair: 'spiky' | 'crop'; shirt: string; hairC: string; stripes?: string; scale?: number}> = ({x, y, face, hair, shirt, hairC, stripes, scale = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${face}) scale(${scale})`}>
    <ellipse cx={0} cy={6} rx={92} ry={44} fill={shirt} stroke={INK} strokeWidth={5} />
    {stripes && [-50, -20, 10, 40].map((xx) => <rect key={xx} x={xx} y={-28} width={12} height={70} fill={stripes} opacity={0.9} />)}
    <ellipse cx={0} cy={6} rx={92} ry={44} fill="none" stroke={INK} strokeWidth={5} />
    <ellipse cx={-98} cy={18} rx={22} ry={30} fill="#F2C9A8" stroke={INK} strokeWidth={4} />
    <ellipse cx={98} cy={18} rx={22} ry={30} fill="#F2C9A8" stroke={INK} strokeWidth={4} />
    {hair === 'spiky' && [0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => <path key={a} d="M -16 -34 L 0 -76 L 16 -34 Z" fill={hairC} stroke={INK} strokeWidth={3} transform={`rotate(${a})`} />)}
    <circle cx={0} cy={0} r={46} fill={hairC} stroke={INK} strokeWidth={5} />
    <circle cx={-46} cy={10} r={10} fill="#F2C9A8" stroke={INK} strokeWidth={3} />
    <circle cx={46} cy={10} r={10} fill="#F2C9A8" stroke={INK} strokeWidth={3} />
    <path d="M -10 44 Q 0 58 10 44" fill="#F2C9A8" stroke={INK} strokeWidth={3} />
  </g>
);

export const Sweep5: React.FC<{t: number}> = ({t}) => {
  const a = angAt(t), tip = tipAt(a);
  const n = 14;
  const rings: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const ti = lerp(SW.t0, SW.t1, i / (n - 1));
    if (t < ti) break;
    const p = tipAt(SW.a0 * (1 - i / (n - 1)));
    const r = C_V * (t - ti);
    const op = clamp(1 - r / 700) * 0.85;
    rings.push(<circle key={i} cx={p.x} cy={p.y} r={Math.max(1, r)} fill="none" stroke="#2F8FA8" strokeWidth={5} opacity={op} />);
  }
  // the arrivals: everything meets at his ear at t1
  const meet = clamp(1 - Math.abs(t - SW.t1 - 0.05) / 0.35);
  const after = clamp((t - SW.t1) / 0.6);
  const tick = (i: number) => ({x: WIN.x - i * 0.3048 * PX, y: WIN.y + (EAR.y - WIN.y) * (i / 8)});
  return (
    <AbsoluteFill style={{background: '#D9DDDA'}}>
      <svg width={W} height={H}>
        <defs><filter id="w5blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={10} /></filter></defs>
        {Array.from({length: 20}, (_, i) => <line key={`v${i}`} x1={i * 156 - 60} y1={0} x2={i * 156 - 60} y2={H} stroke="#C7CCC9" strokeWidth={3} />)}
        {Array.from({length: 14}, (_, i) => <line key={`h${i}`} x1={0} y1={i * 156} x2={W} y2={i * 156} stroke="#C7CCC9" strokeWidth={3} />)}
        {/* the floor tape: 8 ft, a tick per foot */}
        <line x1={WIN.x} y1={WIN.y + 40} x2={EAR.x} y2={EAR.y + 40} stroke={INK} strokeWidth={20} strokeLinecap="butt" />
        <line x1={WIN.x} y1={WIN.y + 40} x2={EAR.x} y2={EAR.y + 40} stroke="#FFC744" strokeWidth={14} strokeLinecap="butt" />
        {Array.from({length: 9}, (_, i) => { const p = tick(i); return <line key={i} x1={p.x} y1={p.y + 30} x2={p.x} y2={p.y + 58} stroke={INK} strokeWidth={4} />; })}
        {/* the optical table and the transmitter, from above */}
        <rect x={WIN.x - 20} y={WIN.y - 150} width={250} height={290} rx={10} fill="#55626A" stroke={INK} strokeWidth={5} />
        {Array.from({length: 24}, (_, i) => <circle key={i} cx={WIN.x + 6 + (i % 6) * 40} cy={WIN.y - 128 + Math.floor(i / 6) * 70} r={5} fill="#2B3338" />)}
        <rect x={WIN.x} y={WIN.y - 40} width={150} height={80} rx={10} fill="#2B3138" stroke={INK} strokeWidth={5} />
        <rect x={WIN.x + 20} y={WIN.y - 46} width={110} height={10} fill="#1CA7A0" stroke={INK} strokeWidth={2} />
        <rect x={WIN.x - 8} y={WIN.y - 16} width={12} height={32} fill="#5A3038" stroke={INK} strokeWidth={3} />
        {/* the swept arc (faint) and the beam */}
        <path d={`M ${tipAt(SW.a0).x} ${tipAt(SW.a0).y} A ${R} ${R} 0 0 0 ${EAR.x} ${EAR.y}`} fill="none" stroke="#E0A040" strokeWidth={3} strokeDasharray="8 10" opacity={0.6} />
        <line x1={WIN.x} y1={WIN.y} x2={tip.x} y2={tip.y} stroke={K.irGlow} strokeWidth={12} opacity={0.35} filter="url(#w5blur)" />
        <line x1={WIN.x} y1={WIN.y} x2={tip.x} y2={tip.y} stroke="#F2A93B" strokeWidth={4} strokeDasharray="14 8" strokeDashoffset={-(t * 240) % 22} />
        <circle cx={tip.x} cy={tip.y} r={10} fill="#FFE2A8" stroke="#E08A2A" strokeWidth={3} />
        {/* the sound each lit point gives off, and where it all arrives at once */}
        {rings}
        {meet > 0 && <circle cx={EAR.x} cy={EAR.y} r={40 + 60 * meet} fill="#7FD3E6" opacity={0.7 * meet} filter="url(#w5blur)" />}
        {after > 0 && [0, 1, 2].map((k) => <circle key={k} cx={EAR.x} cy={EAR.y} r={30 + (t - SW.t1) * 420 + k * 26} fill="none" stroke="#2F8FA8" strokeWidth={8 - k * 2} opacity={(1 - after) * 0.9} />)}
        {/* the listener and the colleague, from above */}
        <TopPerson x={EAR.x - 46} y={EAR.y - 10} face={kv(t, [[19.2, 0], [19.4, -12], [20, -8]])} hair="spiky" shirt="#FFFFFF" hairC="#C0392B" stripes="#FFC744" />
        <TopPerson x={COLLEAGUE.x} y={COLLEAGUE.y} face={-30} hair="crop" shirt="#AFC4E6" hairC="#B8743A" scale={0.95} />
      </svg>
    </AbsoluteFill>
  );
};
export {galvoAngle as _g};
