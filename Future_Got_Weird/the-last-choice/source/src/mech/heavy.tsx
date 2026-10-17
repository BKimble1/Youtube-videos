// Heavy machines: the RecoveryArm (tracked crane with a claw) and the Breaker (tracked launcher unit), plus the PoleCam.
// Side views, origin at the ground under the base centre, dir 1 faces screen right. Pure functions of props.
import React from 'react';
import {SYS} from '../theme';
import {V2, clamp, lerp, rnd, f2, pt, polyPath} from '../kit/math';
import {INK, M, SensorEye, Sparks, Fluid, Glow, SysMark, capsule, rrect, jag} from './common';

const Tracks: React.FC<{len: number; h: number; t: number; dist: number; ink: number}> = ({len, h, dist, ink}) => {
  const r = h / 2;
  const n = Math.max(4, Math.floor(len / (r * 1.6)));
  const shoes = Math.floor((len * 2) / 34);
  const off = ((dist % 34) + 34) % 34;
  return (
    <g>
      <path d={rrect(0, -r, len + h, h, r)} fill={M.rubber} stroke={INK} strokeWidth={ink} />
      {Array.from({length: shoes}, (_, k) => {
        const x = -len / 2 - r + ((k * 34 + off) % (len + h));
        return <line key={k} x1={x} y1={-h + 4} x2={x} y2={-h + 14} stroke={M.frame} strokeWidth={6} />;
      })}
      {Array.from({length: n}, (_, k) => {
        const x = lerp(-len / 2, len / 2, k / (n - 1));
        const a = (dist / (r * 0.7)) * (180 / Math.PI);
        return (
          <g key={`w${k}`} transform={`translate(${f2(x)} ${f2(-r)})`}>
            <circle cx={0} cy={0} r={r * 0.68} fill={M.frame} stroke={INK} strokeWidth={ink * 0.7} />
            <g transform={`rotate(${f2(a)})`}><line x1={-r * 0.5} y1={0} x2={r * 0.5} y2={0} stroke={M.hub} strokeWidth={r * 0.12} /></g>
            <circle cx={0} cy={0} r={r * 0.16} fill={M.hub} />
          </g>
        );
      })}
    </g>
  );
};

/** 2-bone IK in 2D: returns elbow for shoulder a → target b with lengths l1, l2; bend +1/-1 picks the side. */
export const ik2d = (a: V2, b: V2, l1: number, l2: number, bend: 1 | -1 = 1) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(l1 + l2 - 0.01, Math.hypot(dx, dy)));
  const base = Math.atan2(dy, dx);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const e = {x: a.x + Math.cos(base - bend * A) * l1, y: a.y + Math.sin(base - bend * A) * l1};
  const end = {x: a.x + Math.cos(base) * d, y: a.y + Math.sin(base) * d};
  return {elbow: e, end};
};

export type RecoveryArmProps = {x: number; y: number; s?: number; dir?: 1 | -1; t: number; ink?: number; seed?: number;
  target: V2; clawAng?: number; open?: number; dist?: number; lock?: number; strain?: number};
/** Tracked recovery crane. target = world point between the claw tips; clawAng = claw pointing direction (deg, 90 =
 *  straight down, in the unflipped frame); open 0 closed .. 1 open. Base ~900 long; boom pivot ~560 above ground. */
export const RecoveryArm: React.FC<RecoveryArmProps> = (p) => {
  const s = p.s ?? 1, d = p.dir ?? 1, ink = (p.ink ?? 4 * s) / s;
  const seed = p.seed ?? 1;
  // work in the local (unscaled, unflipped) frame
  const loc = {x: ((p.target.x - p.x) / s) * d, y: (p.target.y - p.y) / s};
  const shoulder = {x: -60, y: -560};
  const ca = ((p.clawAng ?? 90) * Math.PI) / 180;
  const CLAW = 230, WR = 140;
  const wrist = {x: loc.x - Math.cos(ca) * (CLAW * 0.8 + WR), y: loc.y - Math.sin(ca) * (CLAW * 0.8 + WR)};
  const jit = (p.strain ?? 0) * Math.sin(p.t * 50 + seed) * 3;
  const {elbow, end} = ik2d(shoulder, wrist, 700, 600, 1);
  const wr2 = {x: end.x + Math.cos(ca) * WR, y: end.y + Math.sin(ca) * WR + jit};
  const op = clamp(p.open ?? 0);
  const jaw = (sd: number) => {
    const a = ca + sd * (0.18 + op * 0.55);
    const tip = {x: wr2.x + Math.cos(a) * CLAW, y: wr2.y + Math.sin(a) * CLAW};
    const mid = {x: wr2.x + Math.cos(a - sd * 0.12) * CLAW * 0.6, y: wr2.y + Math.sin(a - sd * 0.12) * CLAW * 0.6};
    const hook = {x: tip.x + Math.cos(ca - sd * 1.6) * 48, y: tip.y + Math.sin(ca - sd * 1.6) * 48};
    return (
      <g key={sd}>
        <path d={`M ${pt(wr2)} Q ${pt(mid)} ${pt(tip)} L ${pt(hook)}`} fill="none" stroke={INK} strokeWidth={40 + ink * 2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M ${pt(wr2)} Q ${pt(mid)} ${pt(tip)} L ${pt(hook)}`} fill="none" stroke={M.frameDark} strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M ${pt(wr2)} Q ${pt(mid)} ${pt(tip)}`} fill="none" stroke={M.hub} strokeWidth={8} strokeLinecap="round" opacity={0.7} />
      </g>
    );
  };
  const cyl = (a: V2, b: V2, k = 0.55) => (
    <g>
      <line x1={a.x} y1={a.y} x2={lerp(a.x, b.x, k)} y2={lerp(a.y, b.y, k)} stroke={M.frameDark} strokeWidth={22} strokeLinecap="round" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={M.hub} strokeWidth={9} strokeLinecap="round" />
    </g>
  );
  return (
    <g transform={`translate(${f2(p.x)} ${f2(p.y)}) scale(${f2(s * d)} ${f2(s)})`}>
      <ellipse cx={0} cy={4} rx={560} ry={24} fill="rgba(10,10,14,0.3)" />
      <Tracks len={880} h={170} t={p.t} dist={(p.dist ?? 0) / s} ink={ink} />
      <path d={polyPath([{x: -430, y: -170}, {x: -430, y: -400}, {x: -360, y: -440}, {x: 300, y: -440}, {x: 420, y: -330}, {x: 440, y: -170}])} fill={M.plate} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      <rect x={-430} y={-250} width={870} height={80} fill={M.frame} stroke={INK} strokeWidth={ink} />
      <SysMark x={140} y={-330} r={36} opacity={0.85} />
      {/* turret */}
      <path d={rrect(-60, -490, 300, 120, 30)} fill={M.plateShade} stroke={INK} strokeWidth={ink} />
      <SensorEye x={70} y={-490} r={28} lock={p.lock} glow={0.5} ink={ink * 0.8} squash={0.55} id={`ra${seed}_${Math.round(p.x)}`} />
      {/* boom and stick with actuators */}
      {cyl({x: shoulder.x + 120, y: shoulder.y + 60}, {x: lerp(shoulder.x, elbow.x, 0.6), y: lerp(shoulder.y, elbow.y, 0.6)})}
      <path d={capsule(shoulder, elbow, 44, 34)} fill={M.plate} stroke={INK} strokeWidth={ink} />
      <line x1={lerp(shoulder.x, elbow.x, 0.15)} y1={lerp(shoulder.y, elbow.y, 0.15) + 10} x2={lerp(shoulder.x, elbow.x, 0.85)} y2={lerp(shoulder.y, elbow.y, 0.85) + 8} stroke={M.plateShade} strokeWidth={8} strokeLinecap="round" />
      {cyl({x: lerp(shoulder.x, elbow.x, 0.75), y: lerp(shoulder.y, elbow.y, 0.75) - 40}, {x: lerp(elbow.x, end.x, 0.3), y: lerp(elbow.y, end.y, 0.3) - 20})}
      <path d={capsule(elbow, end, 32, 24)} fill={M.plate} stroke={INK} strokeWidth={ink} />
      <circle cx={shoulder.x} cy={shoulder.y} r={40} fill={M.joint} stroke={INK} strokeWidth={ink} />
      <circle cx={elbow.x} cy={elbow.y} r={34} fill={M.joint} stroke={INK} strokeWidth={ink} />
      <path d={capsule(end, wr2, 22)} fill={M.frame} stroke={INK} strokeWidth={ink} />
      <circle cx={end.x} cy={end.y} r={24} fill={M.joint} stroke={INK} strokeWidth={ink} />
      {/* claw */}
      <g>
        {[-1, 1].map((sd) => jaw(sd))}
        {[-1, 1].map((sd) => { const a = ca + sd * (0.18 + op * 0.55); const tip = {x: wr2.x + Math.cos(a) * CLAW, y: wr2.y + Math.sin(a) * CLAW}; return <circle key={`t${sd}`} cx={tip.x} cy={tip.y} r={8} fill={M.hub} />; })}
        <circle cx={wr2.x} cy={wr2.y} r={40} fill={M.joint} stroke={INK} strokeWidth={ink} />
        <circle cx={wr2.x} cy={wr2.y} r={12} fill={SYS.sensor} />
      </g>
    </g>
  );
};

export type BreakerProps = {x: number; y: number; s?: number; dir?: 1 | -1; t: number; ink?: number; seed?: number; aim?: number; dist?: number;
  lock?: number; fire?: {t0: number}; crushed?: number; crushT0?: number; groundY?: number};
const POD = {px: 40, py: -930, len: 300};
/** The launcher pod's muzzle in world coordinates (x, y) and the firing direction (deg, screen). */
export const breakerMuzzle = (p: BreakerProps) => {
  const s = p.s ?? 1, d = p.dir ?? 1;
  const a = (-(p.aim ?? 0) * Math.PI) / 180;
  // upper tube mouth (POD.len·0.55 + 75 along the pod, 38 above its axis)
  const fx = POD.len * 0.55 + 80, fy = -38;
  const lx = POD.px + Math.cos(a) * fx - Math.sin(a) * fy, ly = POD.py + Math.sin(a) * fx + Math.cos(a) * fy;
  const ang = d > 0 ? -(p.aim ?? 0) : 180 + (p.aim ?? 0);
  return {x: p.x + lx * s * d, y: p.y + ly * s, ang};
};
/** Heavy tracked launcher unit. aim = pod elevation (deg, up +). fire.t0 → recoil, flash, smoke. crushed 0..1. */
export const Breaker: React.FC<BreakerProps> = (p) => {
  const s = p.s ?? 1, d = p.dir ?? 1, ink = (p.ink ?? 4 * s) / s;
  const seed = p.seed ?? 1;
  const cr = clamp(p.crushed ?? 0);
  const ft = p.fire ? p.t - p.fire.t0 : -1;
  const recoil = ft >= 0 ? (ft < 0.06 ? ft / 0.06 : Math.max(0, 1 - (ft - 0.06) / 0.5)) * 46 : 0;
  const flash = ft >= 0 && ft < 0.16 ? 1 - ft / 0.16 : 0;
  const mastBend = cr * 34;
  const hull: V2[] = [{x: -560, y: -190}, {x: -560, y: -430 + 120 * cr}, {x: -480, y: -500 + 150 * cr}, {x: 360, y: -500 + 170 * cr}, {x: 560, y: -330 + 60 * cr}, {x: 580, y: -190}];
  const aim = p.aim ?? 0;
  return (
    <g>
      <g transform={`translate(${f2(p.x)} ${f2(p.y)}) scale(${f2(s * d)} ${f2(s)})`}>
        <ellipse cx={0} cy={4} rx={680} ry={26} fill="rgba(10,10,14,0.3)" />
        <Tracks len={1080} h={190} t={p.t} dist={(p.dist ?? 0) / s} ink={ink} />
        <path d={polyPath(hull)} fill={M.plate} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
        <path d={polyPath([{x: -560, y: -300}, {x: 572, y: -300}, {x: 580, y: -190}, {x: -560, y: -190}])} fill={M.frame} stroke={INK} strokeWidth={ink} />
        {cr > 0.1 && <polyline points={jag({x: -460, y: -470 + 150 * cr}, {x: 330, y: -480 + 170 * cr}, 10, 30 * cr, seed).map((q) => `${f2(q.x)},${f2(q.y)}`).join(' ')} fill="none" stroke={INK} strokeWidth={ink * 1.3} />}
        {[-300, 0, 260].map((x) => <line key={x} x1={x} y1={-490 + 160 * cr} x2={x} y2={-305} stroke={M.plateShade} strokeWidth={7} />)}
        <SysMark x={-180} y={-390 + 120 * cr} r={40} opacity={0.85 * (1 - cr * 0.6)} />
        {/* mast: a sturdy boom with a hydraulic ram */}
        <g transform={`rotate(${f2(mastBend)} 40 -480)`}>
          <path d={rrect(40, -700, 130, 470, 26)} fill={M.frame} stroke={INK} strokeWidth={ink} />
          <line x1={-60} y1={-500} x2={10} y2={-860} stroke={M.frameDark} strokeWidth={34} strokeLinecap="round" />
          <line x1={-60} y1={-500} x2={-20} y2={-720} stroke={M.hub} strokeWidth={14} strokeLinecap="round" />
          {[-820, -740, -660, -580].map((y) => <line key={y} x1={-18} y1={y} x2={98} y2={y + 26} stroke={M.frameDark} strokeWidth={9} />)}
          {/* pod: a launcher box with two tubes and its own sensor housing */}
          <g transform={`translate(${POD.px} ${POD.py}) rotate(${f2(-aim)}) translate(${f2(-recoil)} 0)`}>
            <path d={rrect(0, 0, POD.len, 170, 20)} fill={M.plate} stroke={INK} strokeWidth={ink} />
            <line x1={-130} y1={40} x2={130} y2={40} stroke={M.plateShade} strokeWidth={7} />
            {[-38, 38].map((ty) => (
              <g key={ty}>
                <path d={rrect(POD.len * 0.55, ty, 150, 58, 14)} fill={M.frameDark} stroke={INK} strokeWidth={ink} />
                <ellipse cx={POD.len * 0.55 + 74} cy={ty} rx={10} ry={26} fill={M.black} stroke={INK} strokeWidth={ink * 0.7} />
                <line x1={POD.len * 0.55 - 50} y1={ty - 22} x2={POD.len * 0.55 + 50} y2={ty - 22} stroke={M.frame} strokeWidth={5} />
              </g>
            ))}
            <path d={rrect(-70, -112, 120, 66, 20)} fill={M.plateShade} stroke={INK} strokeWidth={ink} />
            <SensorEye x={-40} y={-112} r={28} lock={p.lock} glow={0.5} ink={ink * 0.8} squash={0.62} id={`bk${seed}_${Math.round(p.x)}`} />
            {flash > 0 && (
              <g opacity={flash}>
                <Glow x={POD.len * 0.55 + 120} y={-38} r={280} color="#FFD27A" op={0.85} id={`bkf${seed}_${Math.round(p.x)}`} />
                <path d={polyPath(Array.from({length: 14}, (_, k) => { const a = (k / 14) * Math.PI * 2; const rr = k % 2 ? 50 : 170 * (0.7 + 0.5 * rnd(seed + k)); return {x: POD.len * 0.55 + 150 + Math.cos(a) * rr * 1.4, y: -38 + Math.sin(a) * rr * 0.7}; }))} fill="#FFF3C2" />
              </g>
            )}
          </g>
          <circle cx={40} cy={-930} r={34} fill={M.joint} stroke={INK} strokeWidth={ink} />
        </g>
      </g>
      {cr > 0 && p.crushT0 !== undefined && <Sparks t={p.t} t0={p.crushT0} x={p.x} y={p.y - 480 * s} n={30} speed={1000 * s} g={1600 * s} seed={seed * 9} w={5 * s} life={0.9} groundY={p.groundY} />}
      {cr > 0 && p.crushT0 !== undefined && <Fluid t={p.t} t0={p.crushT0 + 0.2} x={p.x + 300 * s * d} y={p.y - 260 * s} dir={d > 0 ? 70 : 110} amt={cr} speed={160 * s} w={12 * s} seed={seed} groundY={p.groundY ?? p.y} pool={clamp((p.t - p.crushT0) / 4)} />}
    </g>
  );
};

/** The breaching charge in flight: origin at its nose, pointing along ang (deg). */
export const Projectile: React.FC<{x: number; y: number; ang: number; s?: number; ink?: number}> = ({x, y, ang, s = 1, ink}) => {
  const k = ink ?? 4 * s;
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(ang)}) scale(${f2(s)})`}>
      <path d="M -260 -10 L -40 -14 L -40 14 L -260 10 Z" fill="#FFE9A6" opacity={0.55} />
      <path d="M -150 -5 L -40 -8 L -40 8 L -150 5 Z" fill="#FFFFFF" opacity={0.8} />
      <path d={rrect(-26, 0, 64, 26, 12)} fill={M.frameDark} stroke={INK} strokeWidth={k / s} />
      <circle cx={2} cy={0} r={6} fill={SYS.lock} />
    </g>
  );
};

export type PoleCamProps = {x: number; y: number; s?: number; t: number; ink?: number; seed?: number; pan?: number; tiltY?: number; lock?: number; look?: V2; height?: number; side?: 1 | -1};
/** Street pole with a pan-mounted camera housing carrying a SensorEye. pan 0 = looking at the viewer, ±90 = profile. */
export const PoleCam: React.FC<PoleCamProps> = (p) => {
  const s = p.s ?? 1, ink = (p.ink ?? 4 * s) / s;
  const H = p.height ?? 1150;
  const side = p.side ?? 1;
  const pan = ((p.pan ?? 0) * Math.PI) / 180;
  const w = 130;
  const vis = Math.abs(Math.sin(pan)) * w * 0.9 + Math.abs(Math.cos(pan)) * 70;
  const ex = Math.sin(pan) * (vis / 2 - 18);
  const sq = clamp(Math.cos(pan), 0.15, 1);
  const camX = side * 150, camY = -H - 10;
  return (
    <g transform={`translate(${f2(p.x)} ${f2(p.y)}) scale(${f2(s)})`}>
      <path d={`M -20 0 L -14 ${-H} L 14 ${-H} L 20 0 Z`} fill={M.frameDark} stroke={INK} strokeWidth={ink} />
      <path d={`M 0 ${-H + 30} L ${camX} ${-H + 30}`} stroke={M.frameDark} strokeWidth={22} strokeLinecap="round" />
      <path d={`M 0 ${-H + 30} L ${camX} ${-H + 30}`} stroke={INK} strokeWidth={22 + ink * 2} strokeLinecap="round" opacity={0} />
      <rect x={camX - 12} y={-H + 30} width={24} height={34} fill={M.frame} stroke={INK} strokeWidth={ink * 0.7} />
      <g transform={`translate(${camX} ${camY + 110})`}>
        <path d={rrect(0, 0, vis, 72, 26)} fill={M.plate} stroke={INK} strokeWidth={ink} />
        <path d={rrect(-Math.sin(pan) * vis * 0.2, -26, vis * 0.6, 12, 5)} fill={M.plateShade} />
        {Math.cos(pan) > -0.2 && <SensorEye x={ex} y={4} r={27} lock={p.lock} look={p.look} glow={0.55} ink={ink * 0.8} squash={sq} id={`pc${p.seed ?? 1}_${Math.round(p.x)}`} />}
      </g>
    </g>
  );
};
void Fluid; void Glow;
