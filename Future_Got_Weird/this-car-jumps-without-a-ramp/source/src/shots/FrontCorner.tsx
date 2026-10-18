// 0:41–1:11, front view in a left-hand bend (turn centre to screen-right, so the body leans toward screen-left).
// Same car, same road, same speed throughout: first the passive lean, then the actuators oppose it.
import React from 'react';
import {C, F} from '../theme';
import {w} from '../cues';
import {FrontCar, frontBody, TRACK_HALF} from '../car/front';
import {Arrow} from '../car/parts';
import {FCAM, FrontWorld, D_CAR, Bump, bumpUnder} from '../kit/frontworld';
import {Chip, Label} from '../kit/stage';
import {clamp01, easeInOut, easeOut, keys, seg, smooth, win} from '../kit/util';

export const K_BEND = 1 / 70000;
export const SPEED = 14000; // mm/s of road flowing under the car
const W4 = 260; // per-wheel load arrow at rest (mm)

const T = {
  now: w('b3', 'now'),
  corner: w('b3', 'corner'),
  body: w('b3', 'body'),
  lean: w('b3', 'lean'),
  loading: w('b3', 'loading'),
  side: w('b3', 'side'),
  for: w('b3', 'for'),
  lifts: w('b3', 'lifts'),
  here: w('b3', 'here'),
  adjusts: w('b3', 'adjusts'),
  oppose: w('b3', 'oppose'),
  same: w('b3', 'same', 1), // "Same ability to apply force" (the first is "that same car")
  different: w('b3', 'different'),
  job: w('b3', 'job'),
  thisIs: w('b3', 'this'),
  control: w('b3', 'control'),
  point: w('b3', 'point'),
  float: w('b3', 'float'),
  manage: w('b3', 'manage'),
  road: w('b3', 'road'),
  flatter: w('b3', 'flatter'),
  grip: w('b3', 'grip'),
  brake: w('b4', 'brake'),
};
export const FRONT_T = T;
export const CORNER_IN = T.now - 0.35;
export const CORNER_OUT = T.brake - 0.3;

// strips under the wheels while the tyres "deal with the road"
const BUMPS: Bump[] = (() => {
  const out: Bump[] = [];
  const t0 = T.manage - 0.4;
  const seq: [number, -1 | 0 | 1, number][] = [[0.0, -1, 55], [0.55, 1, 45], [1.1, 0, 40], [1.7, -1, 50], [2.25, 1, 55]];
  for (const [dt, side, h] of seq) out.push({s: (t0 + dt) * SPEED, side, h, len: 1200});
  return out;
})();

export const CORNER_BUMPS = BUMPS;
export const FrontCorner: React.FC<{t: number}> = ({t}) => {
  // approach along the bend, then the camera keeps pace; at the end the car comes through the camera
  const dCar = keys(t, [[CORNER_IN - 0.2, 30000], [T.corner - 0.3, D_CAR], [CORNER_OUT - 0.55, D_CAR], [CORNER_OUT + 0.25, 650]], (x) => x);
  const dEase = t < T.corner ? keys(t, [[CORNER_IN - 0.2, 30000], [T.corner - 0.3, D_CAR]], easeOut) : dCar;
  const travel = t * SPEED;
  const sc = FCAM.f / dEase;
  const gy = FCAM.horizon + (FCAM.f * FCAM.h) / dEase;

  // roll: passive lean builds as the car settles into the bend; then the actuators take most of it out
  const passive = 3.6;
  const active = 0.8;
  let roll = keys(t, [[T.corner - 0.6, 0], [T.lean + 0.2, passive * 1.06], [T.lean + 0.9, passive]], easeInOut);
  roll = t > T.adjusts - 0.2 ? keys(t, [[T.adjusts - 0.2, passive], [T.oppose + 0.1, active * 0.9], [T.oppose + 0.6, active]], easeInOut) : roll;
  const wl = bumpUnder(BUMPS, travel, -1), wr = bumpUnder(BUMPS, travel, 1);
  // body only partly follows the wheels over the strips (heave and roll from the difference)
  const dz = 0.12 * (wl + wr) / 2;
  roll += ((0.12 * (wl - wr)) / (2 * TRACK_HALF)) * (180 / Math.PI) * -1;
  const isActive = t > T.here - 0.1;
  const actOn = smooth(seg(t, T.here - 0.3, T.adjusts));
  const forceL = isActive ? 0.9 * actOn : 0;
  const forceR = isActive ? -0.7 * actOn : 0;
  const cutaway = smooth(seg(t, T.loading - 0.5, T.loading + 0.2)) * (1 - smooth(seg(t, CORNER_OUT - 0.9, CORNER_OUT - 0.4)));
  const springGlow = cutaway * clamp01(roll / passive);

  // jump-pattern ghost: both sides push, body lifts evenly (a reminder, not what happens in the bend)
  const jg = win(t, T.for - 0.1, T.here - 0.15, 0.3, 0.35);
  const lift = 150 * easeOut(seg(t, T.for + 0.1, T.lifts + 0.2));
  // float gag
  const fg = win(t, T.point - 0.2, T.manage - 0.2, 0.25, 0.3);
  const floatUp = 520 * easeInOut(seg(t, T.point - 0.1, T.float));

  const ghosts: {roll: number; dz: number; color?: string; opacity?: number}[] = [];
  if (jg > 0) ghosts.push({roll, dz: lift, color: C.tealDeep, opacity: jg});
  const passiveRef = win(t, T.adjusts, T.different, 0.4, 0.5);
  if (passiveRef > 0) ghosts.push({roll: passive, dz: 0, color: C.inkMuted, opacity: passiveRef});
  if (fg > 0) ghosts.push({roll, dz: floatUp, color: C.coral, opacity: fg});

  // per-wheel loads: the outside (screen-left) wheel carries more, passive or active
  const loadVis = Math.max(win(t, T.loading, T.point - 0.3, 0.4, 0.3), win(t, T.manage + 0.2, CORNER_OUT - 0.5, 0.4, 0.3)) * cutaway;
  const corner = clamp01((t - (T.corner - 0.6)) / 1.2);
  const Nl = W4 * (1 + 0.45 * corner), Nr = W4 * (1 - 0.45 * corner);
  const patches = win(t, T.flatter - 0.2, CORNER_OUT - 0.5, 0.3, 0.3);

  const pose = {roll, dz};
  const topL = frontBody(pose, -470, 640), topR = frontBody(pose, 470, 640);
  const gTopL = frontBody({roll, dz: lift}, -470, 640), gTopR = frontBody({roll, dz: lift}, 470, 640);
  const toS = (x: number, y: number) => ({x: FCAM.cx + x * sc, y: gy - y * sc});
  const fp = toS(0, 1800 + floatUp);
  return (
    <g>
      <FrontWorld k={K_BEND} travel={travel} dCar={dEase} bumps={BUMPS} />
      <g transform={`translate(${FCAM.cx} ${gy}) scale(${sc} ${-sc})`}>
        {patches > 0 && [-1, 1].map((s) => <ellipse key={s} cx={s * TRACK_HALF} cy={0} rx={190} ry={70} fill={C.teal} opacity={0.85 * patches} stroke={C.ink} strokeWidth={3 / sc} />)}
        <FrontCar px={sc} roll={roll} dz={dz} wl={wl} wr={wr} cutaway={cutaway} actuator={smooth(seg(t, T.here - 0.6, T.here))} forceL={forceL} forceR={forceR} springGlow={springGlow} ghost={ghosts} id="corner" />
        {/* jump pattern: both actuators push up */}
        {jg > 0 && [gTopL, gTopR].map((p, i) => <Arrow key={i} x={p[0]} y={p[1] + 40} dx={0} dy={260} px={sc} color={C.teal} opacity={jg} />)}
        {/* bend pattern: outside pushes up, inside pulls down */}
        {(() => {
          const a = win(t, T.adjusts - 0.1, T.job + 0.3, 0.3, 0.4);
          if (a <= 0) return null;
          return (
            <g>
              <Arrow x={topL[0]} y={topL[1] + 40} dx={0} dy={260} px={sc} color={C.teal} opacity={a} />
              <Arrow x={topR[0]} y={topR[1] + 300} dx={0} dy={-240} px={sc} color={C.blue} opacity={a} />
            </g>
          );
        })()}
        {/* road on tyres at the contact patches (outside > inside, with or without the lean) */}
        {loadVis > 0 && (
          <g>
            <Arrow x={-TRACK_HALF} y={-Nl - 20} dx={0} dy={Nl} px={sc} color={C.teal} width={16} opacity={loadVis} />
            <Arrow x={TRACK_HALF} y={-Nr - 20} dx={0} dy={Nr} px={sc} color={C.teal} width={16} opacity={loadVis} />
          </g>
        )}
      </g>
      {/* labels */}
      <Chip x={40} y={40} text={isActive ? 'ACTIVE' : 'PASSIVE (FOR COMPARISON)'} opacity={win(t, T.body - 0.2, CORNER_OUT - 0.4, 0.3, 0.3)} />
      <Chip x={40} y={92} text="SIMPLIFIED" opacity={cutaway * 0.95} dark={false} size={22} />
      <Label x={FCAM.cx} y={gy - 1500 * sc - lift * sc} text="JUMP: BOTH SIDES PUSH" color={C.tealLight} size={36} opacity={win(t, T.for, T.here - 0.2, 0.3, 0.3)} />
      <Label x={FCAM.cx} y={gy - 1500 * sc} text="BEND: ONE PUSHES, ONE PULLS" color={C.tealLight} size={36} opacity={win(t, T.adjusts + 0.2, T.job + 0.3, 0.3, 0.3)} />
      <PatternIcons t={t} a={win(t, T.same - 0.1, T.thisIs - 0.1, 0.3, 0.3)} />
      <Label x={FCAM.cx} y={140} text="ACTIVE BODY CONTROL" color={C.saffron} size={56} opacity={win(t, T.thisIs - 0.05, T.point - 0.15, 0.25, 0.3)} scale={0.92 + 0.08 * easeOut(seg(t, T.thisIs - 0.05, T.thisIs + 0.35))} />
      <Label x={fp.x} y={fp.y} text="NOT THE GOAL" color={C.coral} fg={C.white} size={40} opacity={fg * smooth(seg(t, T.float - 0.3, T.float + 0.1))} />
      <Label x={FCAM.cx} y={140} text="TIRES STILL SET THE LIMIT" color={C.white} size={46} opacity={win(t, T.flatter + 0.1, CORNER_OUT - 0.4, 0.3, 0.3)} />
    </g>
  );
};

/** Two small pattern icons: the same actuators, two jobs. */
const PatternIcons: React.FC<{t: number; a: number}> = ({a}) => {
  if (a <= 0.001) return null;
  const icon = (x: number, title: string, left: 1 | -1, right: 1 | -1) => (
    <g transform={`translate(${x} 150)`}>
      <rect x={-150} y={-100} width={300} height={226} rx={26} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <rect x={-95} y={-5} width={190} height={46} rx={14} fill="#D3283A" stroke={C.ink} strokeWidth={4} />
      <path d="M -60 -5 L -40 -38 L 40 -38 L 60 -5 Z" fill="#D3283A" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <rect x={-92} y={38} width={34} height={30} rx={8} fill={C.ink} />
      <rect x={58} y={38} width={34} height={30} rx={8} fill={C.ink} />
      {[[-75, left], [75, right]].map(([ax, d], i) => (
        <g key={i} transform={`translate(${ax} ${d === 1 ? -50 : -78})`}>
          <path d={d === 1 ? 'M 0 -34 L 16 -10 L 6 -10 L 6 12 L -6 12 L -6 -10 L -16 -10 Z' : 'M 0 34 L 16 10 L 6 10 L 6 -12 L -6 -12 L -6 10 L -16 10 Z'} fill={d === 1 ? C.teal : C.blue} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
        </g>
      ))}
      <text x={0} y={108} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={34} fill={C.ink}>{title}</text>
    </g>
  );
  return (
    <g opacity={a}>
      {icon(760, 'JUMP', 1, 1)}
      {icon(1160, 'BEND', 1, -1)}
    </g>
  );
};
