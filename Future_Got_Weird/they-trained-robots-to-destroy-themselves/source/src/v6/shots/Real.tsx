// V5 REAL ("But a simulator…" → "…kept running anyway").
//   R0  sim foot → real foot in the same close-up: the line art gains its shell, then the floor its material, the
//       warm light comes up and a contact shadow lands; pull back to the real robot at the deck edge
//   R1  close-ups with immediate consequences: knee slack (the joint knocks), an uneven plate under the foot (the sole
//       tilts, the ankle takes it), a noisy sensor (a jittering trace beside the head)
//   R2  a foundry nobody on the team had visited: its measurements are question marks
//   R3  the question marks become dice; they tumble across the lens into the simulation; weight, footing and timing
//       change round to round; every round lands
//   R4  the uncertainty, in one short caption
//   R5  the real rehearsal: second floor → giant airbag (it compresses, the robot sinks, settles)
//   R6  matched crouch: airbag → the deck edge in the messy foundry
//   R7  the booth monitors lose their picture; the robot makes its jump in one continuous move
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {T} from '../cues';
import {Cam, Scene, Layer, Bot, Crew, Chip, mixCam, seg, smooth, easeInOut, easeOut, easeIn, backOut, lerp, toScreen, rnd} from '../../v4/kit/scene';
import {FoundryView5, FD} from '../sets/foundry5';
import {FCOL} from '../../v4/sets/foundry';
import {Splash6} from '../sets/splash6';
import {StageBack, Tower, Pad, Arc, TGT_X} from '../../v4/sets/stage';
import {FilmLight, TripodCam} from '../../v4/sets/props';
import {rig, RPose, Rig} from '../../v4/rig/Robot2D';
import {stand, blend, A} from '../../v4/rig/poses';
import {ms} from '../../v4/rig/geom';
import {makeJump5, J5} from '../rig/jump5';
import {smoothCam, fitIn, creep} from '../kit/cam5';
import {walkStop, STOP_DUR} from '../rig/stop';
import {Barrier, BARRIERS, SetCrew} from '../sets/setdress';
import {S_HK} from './Hook';
import {TRAIN_END, TRAIN_END_POSE, CAM_TOFOOT} from './Train';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {Airbag, CameraIcon} from '../../components/Props';
import {C, F} from '../../theme';

export const REAL_START = TRAIN_END;
export const REAL_END = T('So what does it prove') - 0.1;
const S = S_HK;
const DECK = FD.deck.top, SURF = FD.ladle.surf, TOE_X = FD.deck.edge - 4;

const T_JOINTS = T('Real joints have');
const T_FLOORS = T('floors aren’t perfectly');
const T_SENSORS = T('and sensors are');
const T_NEVER = T('And Figure says this');
const T_FIX = T('A common fix');
const T_WEIGHT = T('Change the weight');
const T_FOOTING = T('the footing');
const T_TIMING = T('the timing');
const T_ROUND = T('a little every round');
const T_DONTKNOW = T('We don’t know which');
const T_ALSO = T('It also rehearsed');
const T_SECOND = T('second floor');
const T_BAGS = T('giant airbags');
const T_DIDGET = T('And the foundry did');
const T_HEAT = T('the heat and electromagnetic');
const T_KNOCKED = T('knocked out cameras');
const T_ELEC = T('other electronics');
const T_KEPT = T('and the policies kept');

// ------------------------------------------------------------------ the real robot at the deck
const REAL_X = 120;
const DX = REAL_X - TRAIN_END_POSE.x, DY = DECK - SURF;
const shift = (p: RPose, dx: number, dy: number): RPose => {
  const m = (q?: {x: number; y: number; pitch?: number}) => (q ? {...q, x: q.x + dx, y: q.y + dy} : undefined);
  return {...p, x: p.x + dx, y: p.y + dy, footN: m(p.footN), footF: m(p.footF), handN: m(p.handN), handF: m(p.handF)};
};
const REAL0 = shift(TRAIN_END_POSE, DX, DY);
const CAM_R0: Cam = {...CAM_TOFOOT, x: CAM_TOFOOT.x + DX, y: CAM_TOFOOT.y + DY};
const R0 = rig(REAL0, S).pts;
const CAM_RMED: Cam = {x: REAL_X + 170, y: 400, z: 1.55};
const CAM_KNEE: Cam = {x: R0.kneeN[0] + 90, y: R0.kneeN[1] - 10, z: 3.4};
const CAM_SOLE: Cam = {x: R0.ankleN[0] + 90, y: DECK - 50, z: 3.4};
const CAM_HEAD: Cam = {x: R0.head[0] + 150, y: R0.head[1] + 30, z: 2.7};
const CAM_RW: Cam = {x: 700, y: 600, z: 0.92};
const T_X0 = REAL_START + 0.08, T_X1 = REAL_START + 0.8;      // the transfer (shell → floor → light → shadow), kept short
const realCamRaw = (t: number): Cam => {
  let c = mixCam(CAM_R0, CAM_RMED, easeInOut(seg(t, T_X1 - 0.05, T_JOINTS - 0.15)));
  c = mixCam(c, CAM_KNEE, easeInOut(seg(t, T_JOINTS - 0.2, T_JOINTS + 0.45)));
  c = mixCam(c, CAM_SOLE, easeInOut(seg(t, T_FLOORS - 0.3, T_FLOORS + 0.3)));
  c = mixCam(c, CAM_HEAD, easeInOut(seg(t, T_SENSORS - 0.3, T_SENSORS + 0.35)));
  c = mixCam(c, CAM_RW, easeInOut(seg(t, T_NEVER - 0.1, T_NEVER + 1.1)));
  c = creep(c, t, T_NEVER + 1.1, DICE0 + 0.4, 0.05, 30);
  return c;
};
const realPose = (t: number): RPose => {
  const p = {...REAL0};
  // knee slack: the pelvis knocks back and forth on planted feet (decaying), the knees take the play
  const sl = seg(t, T_JOINTS + 0.55, T_JOINTS + 1.5);
  if (sl > 0 && sl < 1) {
    const env = Math.sin(Math.PI * sl);
    p.x += Math.sin(sl * 34) * 5 * env;     // V6: horizontal knock only, feet planted, no vertical bob
  }
  // an uneven plate under the near foot: the sole tilts over the seam, the ankle takes it
  const tilt = smooth(seg(t, T_FLOORS + 0.2, T_FLOORS + 0.55)) * (1 - smooth(seg(t, T_NEVER, T_NEVER + 0.6)));
  if (p.footN) p.footN = {...p.footN, y: p.footN.y - 12 * tilt, pitch: 10 * tilt};
  p.rot += -1.2 * tilt;
  return p;
};

// ------------------------------------------------------------------ the unknown foundry (dimensions with "?")
const Dim: React.FC<{x1: number; y1: number; x2: number; y2: number; k: number; lw: number; lab?: string}> = ({x1, y1, x2, y2, k, lw, lab = '?'}) => {
  if (k <= 0) return null;
  const e = easeOut(k);
  const ex = lerp(x1, x2, e), ey = lerp(y1, y2, e);
  const mx = (x1 + ex) / 2, my = (y1 + ey) / 2;
  const vert = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  const tick = (x: number, y: number) => vert ? <line x1={x - 18} y1={y} x2={x + 18} y2={y} stroke="#FFF4D6" strokeWidth={lw * 1.4} /> : <line x1={x} y1={y - 18} x2={x} y2={y + 18} stroke="#FFF4D6" strokeWidth={lw * 1.4} />;
  return (
    <g>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke="#FFF4D6" strokeWidth={lw * 1.4} strokeDasharray={`${lw * 6} ${lw * 4}`} />
      {tick(x1, y1)}{k >= 1 ? tick(x2, y2) : null}
      {k > 0.6 ? (
        <g transform={`translate(${mx} ${my}) scale(${backOut(seg(k, 0.6, 1), 1.8)})`}>
          <circle r={34} fill={C.saffron} stroke={C.ink} strokeWidth={lw * 1.3} />
          <text y={15} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={44} fill={C.ink}>{lab}</text>
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ the dice wipe and the varied rounds
const DICE0 = T_FIX - 0.05, DICE1 = DICE0 + 0.75, DICE_COVER = DICE0 + 0.38;
const Die: React.FC<{x: number; y: number; s: number; rot: number; n: number; col?: string}> = ({x, y, s, rot, n, col = '#FFFFFF'}) => {
  const P: Record<number, [number, number][]> = {1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]};
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-100} y={-100} width={200} height={200} rx={36} fill={col} stroke={C.ink} strokeWidth={12} />
      {P[((n - 1) % 6) + 1].map(([a, b], i) => <circle key={i} cx={a * 52} cy={b * 52} r={18} fill={C.ink} />)}
    </g>
  );
};
const DiceWipe: React.FC<{t: number}> = ({t}) => {
  const u = seg(t, DICE0, DICE1);
  if (u <= 0 || u >= 1) return null;
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const x = lerp(-900, 2900, easeInOut(u)) - i * 520;
        const y = 540 + Math.sin(u * Math.PI * 2 + i) * 60 + (i - 1) * 90;
        return <Die key={i} x={x} y={y} s={3.2} rot={u * 540 + i * 40} n={((Math.floor(u * 8) + i * 2) % 6) + 1} col={[C.paper, C.saffronLight, C.tealLight][i]} />;
      })}
    </g>
  );
};
// the varied rounds: weight / footing / timing applied, then three quick rounds that all land
const VAR = {w: T_WEIGHT + 0.1, f: T_FOOTING + 0.05, tm: T_TIMING + 0.05};
const ROUNDS = [
  {tTO: T_ROUND + 0.35, weight: 1, ice: 0, delay: 0, endX: TGT_X - 20},
  {tTO: T_ROUND + 1.75, weight: 0, ice: 1, delay: 0, endX: TGT_X + 10},
  {tTO: T_ROUND + 3.35, weight: 0.6, ice: 0.5, delay: 1, endX: TGT_X - 4},
].map((r) => ({...r, J: makeJump5({toeX: TOE_X, deckY: DECK, endX: r.endX, endY: SURF, s: S, tReady: r.tTO - 0.75 - 0.3 * r.delay, tPush: r.tTO - 0.3, tTO: r.tTO, apex: (r.weight ? 66 : 80) * S, outcome: 'stick', depth: 1.2 + 0.25 * r.weight, swing: 1.15})}));
const roundAt = (t: number) => (t < ROUNDS[0].J.tReady ? -1 : t < ROUNDS[1].J.tReady - 0.05 ? 0 : t < ROUNDS[2].J.tReady - 0.05 ? 1 : 2);
const READY_V = ROUNDS[0].J.READY;
// V6: a clean baseline round right after the dice ("one perfect world"), so the set never holds an unchanged robot;
// then each variation appears on its word and is tested in the rounds
const R_BASE = makeJump5({toeX: TOE_X, deckY: DECK, endX: TGT_X, endY: SURF, s: S, tReady: DICE1 + 0.1, tPush: DICE1 + 0.55, tTO: DICE1 + 0.85, apex: 80 * S, outcome: 'stick', depth: 1.2, swing: 1.15});
const BASE_RW0 = R_BASE.tEnd + 0.45, BASE_RW1 = BASE_RW0 + 0.3;
/** Die events: it rolls only when a condition changes (weight, footing, timing, each round). */
const DIE_EV: [number, number][] = [[DICE1, 1], [VAR.w, 3], [VAR.f, 5], [VAR.tm, 2], [ROUNDS[0].J.tReady, 6], [ROUNDS[1].J.tReady, 4], [ROUNDS[2].J.tReady, 1]];
const dieAt = (t: number) => {
  let n = 1, roll = 0;
  for (const [t0, face] of DIE_EV) if (t >= t0) { n = face; roll = Math.max(0, 1 - (t - t0) / 0.3); }
  return {n: roll > 0.5 ? ((n + Math.floor(roll * 9)) % 6) + 1 : n, roll};
};
const variedPose = (t: number): RPose => {
  if (t < BASE_RW0) return R_BASE.pose(Math.max(t, R_BASE.tReady)).pose;
  if (t < BASE_RW1) return R_BASE.pose(lerp(BASE_RW0, R_BASE.tReady, easeInOut(seg(t, BASE_RW0, BASE_RW1)))).pose;
  const i = roundAt(t);
  if (i < 0) {
    // the load arrives: a brief knee flex under it (feet planted)
    const flex = Math.sin(Math.PI * seg(t, VAR.w + 0.2, VAR.w + 0.65));
    return {...READY_V, y: READY_V.y + 10 * flex};
  }
  const r = ROUNDS[i];
  // reset between rounds: a short rewind back onto the tower
  const next = ROUNDS[i + 1];
  if (next && t > next.J.tReady - 0.35) return r.J.pose(lerp(next.J.tReady - 0.35, r.J.tReady, easeInOut(seg(t, next.J.tReady - 0.35, next.J.tReady - 0.05)))).pose;
  const p = r.J.pose(t).pose;
  if (r.ice > 0 && t > r.J.tPush && t < r.J.tTO && p.footN) {
    const u = smooth(seg(t, r.J.tPush, r.J.tTO));
    return {...p, footN: {...p.footN, x: p.footN.x - 16 * S * u * r.ice}, armN: A(p.armN.sh + 30 * u, p.armN.el + 20, {grip: 0.3})};
  }
  return p;
};
const weightOn = (t: number) => {
  const i = roundAt(t);
  const applied = smooth(seg(t, VAR.w, VAR.w + 0.3));
  return i < 0 ? applied : ROUNDS[i].weight * (i === 0 ? applied : 1);
};
const iceOn = (t: number) => {
  const i = roundAt(t);
  const applied = smooth(seg(t, VAR.f, VAR.f + 0.3));
  return i < 0 ? applied : i === 0 ? applied * 0.0 + ROUNDS[0].ice : ROUNDS[i].ice;
};
const weightBlock = (k: number, lw: number) => (r: Rig) => {
  if (k <= 0.01) return null;
  const drop = (1 - easeOut(Math.min(1, k))) * -160;
  return (
    <g transform={ms(r.M.torso)}>
      <g transform={`translate(${lerp(-62, -44, r.yaw)} ${-110 + drop})`}>
        <rect x={-40} y={-50} width={56} height={92} rx={8} fill="#3A4A6A" stroke={C.ink} strokeWidth={lw} />
        <rect x={-34} y={-44} width={44} height={20} rx={4} fill="#5B6E92" />
        <text x={-12} y={20} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={30} fill="#FFFFFF">kg</text>
      </g>
    </g>
  );
};
const Stopwatch: React.FC<{x: number; y: number; k: number; t: number; t0: number}> = ({x, y, k, t, t0}) => {
  if (k <= 0) return null;
  const a = Math.max(0, t - t0) * 300;
  return (
    <g transform={`translate(${x} ${y}) scale(${backOut(Math.min(1, k * 2), 1.6)})`}>
      <rect x={-14} y={-96} width={28} height={22} rx={6} fill={C.ink} />
      <circle r={74} fill="#FFFFFF" stroke={C.ink} strokeWidth={9} />
      <path d={`M0 0 L0 -60 A60 60 0 ${a % 360 > 180 ? 1 : 0} 1 ${Math.sin((a * Math.PI) / 180) * 60} ${-Math.cos((a * Math.PI) / 180) * 60} Z`} fill={C.saffronLight} />
      <line x1={0} y1={0} x2={Math.sin((a * Math.PI) / 180) * 58} y2={-Math.cos((a * Math.PI) / 180) * 58} stroke={C.coral} strokeWidth={8} strokeLinecap="round" />
      <circle r={9} fill={C.ink} />
    </g>
  );
};

// ------------------------------------------------------------------ the airbag hall
const HALL = {ledge: 300, floor: 1000, bagX: 860, bagS: 1.45};
const BAG_TOP = HALL.floor - 170 * HALL.bagS;
const HJ: ReturnType<typeof makeJump5> = (() => {
  const spec: J5 = {toeX: TOE_X, deckY: HALL.ledge, endX: HALL.bagX, endY: BAG_TOP + 6, s: S, tReady: 0, tPush: 0, tTO: 0, apex: 60 * S, outcome: 'stick', depth: 1.2, swing: 1.1};
  const Tf = makeJump5(spec).T;
  const tEnd = T_BAGS + 0.05;
  return makeJump5({...spec, tReady: T_SECOND - 0.9, tPush: tEnd - Tf - 0.3, tTO: tEnd - Tf});
})();
/** Airbag contact: the bag compresses under the robot, it sinks in, rebounds a little, settles. */
const bagSquash = (t: number) => {
  const d = t - HJ.tEnd;
  if (d <= 0) return 0;
  return Math.max(0, Math.exp(-d * 3.2) * Math.cos(d * 9) * 0.9 + 0.25 * (1 - Math.exp(-d * 4)));
};
// it walks out along the second-floor ledge to the edge first (whole strides, a stop step onto the take-off mark)
const HALL_WALK = {x0: HJ.READY.footN!.x - 2.25 * 150 * S, ground: HALL.ledge, s: S, n: 2, o: {yaw: 0.75}, t0: T_ALSO - 0.05, t1: HJ.tReady - STOP_DUR - 0.05, ready: HJ.READY};
const hallPose = (t: number): RPose => {
  if (t < HJ.tReady) return walkStop(HALL_WALK, t);
  if (t < HJ.tEnd) return HJ.pose(t).pose;
  const d = t - HJ.tEnd;
  const base = HJ.pose(HJ.tEnd).pose;
  const sq = bagSquash(t);
  const sink = sq * 170 * HALL.bagS * 0.22;                      // = the dent depth under the feet (world)
  const comp = Math.max(0, sq - 0.25) * 34 * S;                  // knees compress at the peak, release on the rebound
  // knees soak it, then the robot settles in a crouch on the bag (feet stay on the bag's surface)
  const crouch = smooth(seg(d, 0, 0.35));
  const fN = base.footN ?? {x: HJ.p1.x, y: BAG_TOP, pitch: 0};
  const r0 = rig(base, S).pts;
  return {...base, x: base.x + 10 * crouch, y: base.y + sink + 60 * S * crouch + comp, rot: base.rot + 18 * crouch, waist: 10 * crouch,
    armN: A(lerp(62, 40, crouch), lerp(30, 50, crouch)), armF: A(lerp(50, 30, crouch), lerp(34, 50, crouch)),
    footN: {x: r0.ankleN[0], y: r0.ankleN[1] + sink, pitch: 0}, footF: {x: r0.ankleF[0], y: r0.ankleF[1] + sink, pitch: 0}, ...(fN ? {} : {})};
};
/** V6 airbag: the bag keeps its shape; the top dents locally under the feet (depth in bag units) and the sides bulge
 * a little. The dent follows bagSquash: deep at contact, a damped rebound, then a shallow settled dip. */
const DENT_W = 78;
const Airbag6: React.FC<{x: number; y: number; s: number; dent: number; dentX: number; lw: number}> = ({x, y, s, dent, dentX, lw}) => {
  const bulge = 1 + 0.035 * Math.min(1, dent / 30);
  const top: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const bx = -200 + i * 10;
    const d = dent * Math.exp(-Math.pow((bx - dentX) / DENT_W, 2));
    top.push(`${bx.toFixed(1)} ${(-170 + d).toFixed(1)}`);
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${s * bulge} ${s})`}>
      <path d={`M -300 0 Q -320 -150 -200 -170 L ${top.join(' L ')} Q 320 -150 300 0 Z`} fill={C.coral} stroke={C.ink} strokeWidth={6 / s} strokeLinejoin="round" />
      {[-150, 0, 150].map((sx) => {
        const d = dent * Math.exp(-Math.pow((sx - dentX) / DENT_W, 2));
        return <path key={sx} d={`M ${sx} ${-160 + d} Q ${sx + 20} ${-80 + d * 0.5} ${sx} 0`} fill="none" stroke={C.coralDeep} strokeWidth={5 / s} />;
      })}
      {dent > 2 ? <path d={`M ${dentX - DENT_W * 1.1} ${-164} Q ${dentX} ${-170 + dent * 1.35} ${dentX + DENT_W * 1.1} ${-164}`} fill="none" stroke="#B8402E" strokeWidth={4 / s} opacity={Math.min(1, dent / 20)} /> : null}
      <rect x={-310} y={-8} width={620} height={16} rx={8} fill={C.coralDeep} stroke={C.ink} strokeWidth={4 / s} />
      {void lw}
    </g>
  );
};
const HallBack: React.FC<{lw: number}> = ({lw}) => (
  <g>
    <rect x={-3000} y={-1500} width={7000} height={2500} fill="#596069" />
    {Array.from({length: 26}, (_, i) => <line key={i} x1={-2000 + i * 200} y1={-1500} x2={-2000 + i * 200} y2={HALL.floor} stroke="#4C525A" strokeWidth={lw * 1.2} />)}
    {[-300, 500, 1300].map((x) => (
      <g key={x}>
        <rect x={x} y={-420} width={300} height={300} rx={6} fill="#AFC4D8" stroke="#1E2329" strokeWidth={lw} />
        <path d={`M${x} -120 L${x + 300} -120 L${x + 640} ${HALL.floor} L${x + 200} ${HALL.floor} Z`} fill="#FFFFFF" opacity={0.05} />
      </g>
    ))}
    <rect x={-3000} y={HALL.floor} width={7000} height={1200} fill="#3A3E44" />
    <line x1={-3000} y1={HALL.floor} x2={4000} y2={HALL.floor} stroke="#1E2329" strokeWidth={lw} />
  </g>
);
const Mezz: React.FC<{lw: number}> = ({lw}) => (
  <g>
    {[-700, 0, 240].map((x) => <rect key={x} x={x - 22} y={HALL.ledge + 50} width={44} height={HALL.floor - HALL.ledge - 50} fill="#7A8088" stroke="#1E2329" strokeWidth={lw} />)}
    <rect x={-1600} y={HALL.ledge} width={1600 + FD.deck.edge} height={50} fill="#8A9097" stroke="#1E2329" strokeWidth={lw} />
    <rect x={-1600} y={HALL.ledge} width={1600 + FD.deck.edge} height={10} fill="#A3A9B0" />
    {Array.from({length: 4}, (_, i) => <path key={i} d={`M${FD.deck.edge - 30 - i * 60} ${HALL.ledge + 14} l30 0 l-14 28 l-30 0 Z`} fill="#F2B632" />)}
    <path d={`M-1600 ${HALL.ledge - 90} L120 ${HALL.ledge - 90} M-1600 ${HALL.ledge - 46} L120 ${HALL.ledge - 46}`} stroke="#E8A928" strokeWidth={lw * 2} />
    {[-1400, -1000, -600, -200, 120].map((x) => <line key={x} x1={x} y1={HALL.ledge - 92} x2={x} y2={HALL.ledge} stroke="#E8A928" strokeWidth={lw * 2} />)}
  </g>
);

/** Head top, raised hand tips, wrists and toes of the robot in the hall (for framing). */
const hallPts = (t: number): [number, number][] => {
  const pp = rig(hallPose(t), S).pts;
  return [[pp.head[0], pp.head[1] - 60 * S], [pp.handN[0], pp.handN[1] - 24 * S], [pp.handF[0], pp.handF[1] - 24 * S], pp.wrN, pp.wrF, pp.toeN, pp.toeF];
};

// ------------------------------------------------------------------ the messy foundry and the jump
const CROUCH_T = T_DIDGET - 0.1;               // matched cut: crouched on the bag → crouched at the deck edge
const J_PAY = (() => {
  const spec: J5 = {toeX: TOE_X, deckY: DECK, endX: TGT_X, endY: SURF, s: S, tReady: 0, tPush: 0, tTO: 0, apex: 84 * S, outcome: 'plunge', depth: 1.2, swing: 1.15};
  const Tf = makeJump5(spec).T;
  const tTO = T_KEPT + 0.15;
  return makeJump5({...spec, tReady: tTO - 1.0, tPush: tTO - 0.3, tTO});
})();
export const PAY_HIT = J_PAY.tEnd;
export const PAY_JUMP = J_PAY;
const messPose = (t: number): RPose => {
  // from the matched crouch: stand up at the edge, wait, then the jump (one continuous move)
  const rise = smooth(seg(t, CROUCH_T + 0.35, CROUCH_T + 1.1));
  if (t < J_PAY.tReady) return blend(J_PAY.K0, J_PAY.READY, rise);
  return J_PAY.pose(t).pose;
};
export const MonitorScreen: React.FC<{x: number; y: number; w: number; h: number; lw: number; state: number; t: number; id: number}> = ({x, y, w, h, lw, state, t, id}) => (
  <g>
    <rect x={x - w / 2 - 10} y={y - h / 2 - 10} width={w + 20} height={h + 20} rx={8} fill="#1E2026" stroke={FCOL.ink} strokeWidth={lw} />
    {state < 0.5 ? (
      <g>
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="#2E4A6E" />
        <rect x={x - w / 2} y={y + h * 0.18} width={w} height={h * 0.32} fill="#3E5E86" />
        <rect x={x - w * 0.18} y={y - h * 0.32} width={w * 0.07} height={h * 0.5} rx={4} fill="#11161C" />
        <ellipse cx={x + w * 0.22} cy={y + h * 0.3} rx={w * 0.2} ry={h * 0.06} fill="#FFB347" />
      </g>
    ) : state < 1.5 ? (
      <g>
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="#8A8F96" />
        {Array.from({length: 46}, (_, i) => <rect key={i} x={x - w / 2 + Math.floor(rnd(i * 13 + Math.floor(t * 30) * 7 + id) * (w - 8))} y={y - h / 2 + Math.floor(rnd(i * 17 + Math.floor(t * 30) * 3 + id) * (h - 5))} width={8} height={5} fill={rnd(i + Math.floor(t * 30)) > 0.5 ? '#FFFFFF' : '#2B2E33'} />)}
      </g>
    ) : (
      <g>
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="#0B0C0F" />
        <text x={x} y={y + 8} textAnchor="middle" fontFamily='"JetBrains Mono", monospace' fontWeight={700} fontSize={Math.round(h * 0.2)} fill={C.coral}>NO SIGNAL</text>
      </g>
    )}
  </g>
);
const CAM_MESS: Cam = {x: 470, y: 520, z: 1.35};
const CAM_MON: Cam = {x: 1240, y: 520, z: 1.25};
const CAM_JUMP: Cam = {x: 600, y: 460, z: 1.2};          // V6: holds the whole leap incl. raised hands
export const CAM_REAL_END: Cam = {x: TGT_X, y: 680, z: 1.4};

// ------------------------------------------------------------------ section
export const Real: React.FC = () => {
  const f = useCurrentFrame() + Math.round(REAL_START * 30);
  const t = f / 30;

  // ============================== R0–R2 (real robot on the deck)
  if (t < DICE_COVER) {
    const cam = t < T_X1 + 0.1 ? realCamRaw(t) : smoothCam(realCamRaw, t, 0.22);
    const lw = 4 / cam.z;
    // V6: the layered handoff lasts ~0.6 s (shell, then the floor and the room light together)
    const shell = smooth(seg(t, T_X0, T_X0 + 0.25));
    const floor = smooth(seg(t, T_X0 + 0.15, T_X0 + 0.4));
    const light = smooth(seg(t, T_X0 + 0.2, T_X0 + 0.6));
    const shadow = smooth(seg(t, T_X0 + 0.45, T_X1));
    const p = realPose(t);
    const r = rig(p, S).pts;
    // the sim world behind (only while the transfer runs), positioned so the avatar coincides with the robot
    const camSim: Cam = {...cam, x: cam.x - DX, y: cam.y - DY};
    const slackK = Math.sin(Math.PI * seg(t, T_JOINTS + 0.5, T_JOINTS + 1.6));
    const kneeS = toScreen(cam, r.kneeN[0], r.kneeN[1]);
    const headS = toScreen(cam, r.head[0], r.head[1]);
    const noise = seg(t, T_SENSORS + 0.25, T_SENSORS + 0.55) * (1 - seg(t, T_NEVER, T_NEVER + 0.3));
    const dimK = (t0: number) => seg(t, t0, t0 + 0.55) * (1 - seg(t, DICE0 - 0.1, DICE0 + 0.2));
    const seam = smooth(seg(t, T_FLOORS - 0.1, T_FLOORS + 0.2)) * (1 - smooth(seg(t, T_NEVER + 0.4, T_NEVER + 1.0)));
    return (
      <Scene bg="#221A21">
        {floor < 1 || light < 1 ? (
          <g opacity={1}>
            <rect width={1920} height={1080} fill="#EEF4FD" />
            <Layer cam={camSim}><StageBack lw={lw} grid={0.4} /><Tower lw={lw} /><Pad lw={lw} /></Layer>
          </g>
        ) : null}
        <g opacity={light}>
          <FoundryView5 cam={cam} t={t} hook={false} id="rlf" glow={light}
            extraBack={<g><FilmLight x={-260} y={FD.deck.top} lw={lw} on={1} aim={16} id="rlA" /><FilmLight x={1440} y={FD.floor} lw={lw} on={1} aim={205} h={560} id="rlB" /></g>}
            behind={(
              <g>
                {seam > 0 ? <path d={`M${R0.ankleN[0] + 6} ${DECK - 16} l14 -${13 * seam} l96 0 l0 ${13 * seam}`} fill="#8E8A92" stroke={C.saffron} strokeWidth={lw * 1.6} strokeLinejoin="round" /> : null}
                {shadow > 0 ? <ellipse cx={(r.ankleN[0] + r.ankleF[0]) / 2 + 12} cy={DECK - 15} rx={70} ry={8} fill="#000" opacity={0.35 * shadow} /> : null}
              </g>
            )}
            deck />
        </g>
        {/* the floor material: the deck strip appears under the foot before the room's light comes up */}
        {floor > 0 && light < 1 ? (
          <g opacity={floor * (1 - light)}>
            <Layer cam={cam}>
              <path d={`M${FD.deck.x0} ${DECK - 16} L${FD.deck.edge - 6} ${DECK - 16} L${FD.deck.edge} ${DECK} L${FD.deck.x0} ${DECK} Z`} fill="#77737C" stroke={FCOL.ink} strokeWidth={lw} />
              <rect x={FD.deck.x0} y={DECK} width={FD.deck.edge - FD.deck.x0} height={34} fill="#5B5860" stroke={FCOL.ink} strokeWidth={lw} />
            </Layer>
          </g>
        ) : null}
        {/* the robot: the avatar's line art gains the F.02 shell in place (same pose, same contact) */}
        <Layer cam={cam}>
          {shell < 1 ? <Bot cam={cam} id="rlS" model="SIM" s={S} pose={p} /> : null}
          {shell > 0 ? <g opacity={shell}><Bot cam={cam} id="rlR" model="F02" s={S} pose={p} /></g> : null}
          {/* the measurements nobody on the team had seen in person */}
          <Dim x1={FD.deck.edge + 40} y1={DECK} x2={FD.deck.edge + 40} y2={FD.floor} k={dimK(T_NEVER + 0.7)} lw={lw} />
          <Dim x1={FD.deck.edge} y1={DECK - 90} x2={FD.ladle.cx - FD.ladle.rx} y2={DECK - 90} k={dimK(T_NEVER + 1.2)} lw={lw} />
          <Dim x1={FD.ladle.cx - FD.ladle.srx} y1={SURF + 130} x2={FD.ladle.cx + FD.ladle.srx} y2={SURF + 130} k={dimK(T_NEVER + 1.7)} lw={lw} />
        </Layer>
        {/* knee play */}
        {slackK > 0 ? (
          <g opacity={slackK}>
            {[-1, 1].map((sd) => <path key={sd} d={`M${kneeS.x + sd * 46} ${kneeS.y - 30} q${sd * 16} 30 0 60`} fill="none" stroke={C.saffron} strokeWidth={8} strokeLinecap="round" />)}
          </g>
        ) : null}
        {/* noisy sensor trace, beside the head */}
        {noise > 0 ? (
          <g transform={`translate(${headS.x + 150} ${headS.y - 60})`} opacity={Math.min(1, noise * 2)}>
            <line x1={-150} y1={60} x2={-10} y2={40} stroke={C.ink} strokeWidth={4} />
            <rect x={-10} y={-10} width={300} height={130} rx={16} fill={C.paper} stroke={C.ink} strokeWidth={5} />
            <path d={'M10 55 ' + Array.from({length: 28}, (_, i) => `L${10 + i * 10} ${55 + (rnd(i * 7 + Math.floor(t * 20) * 3) - 0.5) * 70}`).join(' ')} fill="none" stroke={C.coral} strokeWidth={4} strokeLinejoin="round" />
          </g>
        ) : null}
        <DiceWipeLayer t={t} />
      </Scene>
    );
  }

  // ============================== R3–R4 (the varied simulation)
  if (t < T_ALSO - 0.05) {
    const camRaw = (tt: number): Cam => {
      const pp = rig(variedPose(tt), S).pts;
      const base = mixCam({x: 600, y: 560, z: 1.2}, {x: 580, y: 545, z: 1.25}, seg(tt, DICE_COVER, T_ALSO));
      const fc = fitIn(base, [[pp.head[0], pp.head[1] - 40], [pp.handN[0], pp.handN[1] - 24 * S], [pp.handF[0], pp.handF[1] - 24 * S], pp.toeN, pp.toeF, pp.wrN, pp.wrF, [TGT_X, SURF + 60], [TOE_X - 300, DECK - 260]], {top: 130, bottom: 120, left: 140, right: 140});
      return {...fc, x: fc.x + 45 * smooth(seg(tt, ROUNDS[2].J.tEnd + 0.4, T_ALSO))};   // drifts on under the caption
    };
    const cam = (() => {
      const c = smoothCam(camRaw, t, 0.2);
      const pp = rig(variedPose(t), S).pts;
      return fitIn(c, [[pp.head[0], pp.head[1] - 40], [pp.handN[0], pp.handN[1] - 24 * S], [pp.handF[0], pp.handF[1] - 24 * S], pp.toeN, pp.toeF], {top: 60, bottom: 60, left: 80, right: 80});
    })();
    const lw = 4 / cam.z;
    const p = variedPose(t);
    const w = weightOn(t), ice = iceOn(t);
    const i = roundAt(t);
    const watchK = i < 0 ? seg(t, VAR.tm, VAR.tm + 0.2) : i === 2 ? 1 - seg(t, ROUNDS[2].J.tTO, ROUNDS[2].J.tTO + 0.3) : 0;
    const die = dieAt(t);
    const dieK = seg(t, DICE1 - 0.15, DICE1 + 0.15);
    const baseArc = t < BASE_RW0 ? seg(t, R_BASE.tTO, R_BASE.tEnd) * (1 - seg(t, BASE_RW0 - 0.25, BASE_RW0)) : 0;
    const caption = seg(t, T_DONTKNOW + 0.1, T_DONTKNOW + 0.4) * (1 - seg(t, T_ALSO - 0.4, T_ALSO - 0.1));
    const landPulse = [...ROUNDS.map((r) => r.J), R_BASE].reduce((m, J) => Math.max(m, Math.max(0, 1 - Math.abs(t - J.tEnd - 0.1) / 0.4)), 0);
    return (
      <Scene bg="#EEF4FD" over={<Chip x={96} y={946} lines={['Variations shown are illustrative · Figure hasn’t said which it used']} k={caption} size={30} tone="paper" />}>
        <Layer cam={cam}>
          <StageBack lw={lw} grid={0.45} />
          {i >= 0 ? <Arc pts={ROUNDS[i].J.arc()} k={seg(t, ROUNDS[i].J.tTO, ROUNDS[i].J.tEnd) * (1 - seg(t, ROUNDS[i].J.tEnd + 0.5, ROUNDS[i].J.tEnd + 0.8))} lw={lw} color={C.teal} /> : null}
          {baseArc > 0 ? <Arc pts={R_BASE.arc()} k={baseArc} lw={lw} color={C.blue} /> : null}
          <Tower lw={lw} />
          {ice > 0 ? <path d={`M${TOE_X - 260} ${DECK - 15} L${TOE_X - 2} ${DECK - 15} L${TOE_X + 4} ${DECK} L${TOE_X - 260} ${DECK} Z`} fill="#CFEFFF" stroke="#7FC8E8" strokeWidth={lw} opacity={0.9 * ice} /> : null}
          {ice > 0 ? [0, 1, 2].map((k) => <line key={k} x1={TOE_X - 220 + k * 70} y1={DECK - 12} x2={TOE_X - 190 + k * 70} y2={DECK - 4} stroke="#FFFFFF" strokeWidth={lw * 1.5} opacity={ice} />) : null}
          <Pad lw={lw} pulse={landPulse} />
          <Bot cam={cam} id="rlV" model="SIM" s={S} pose={p} after={{torso: weightBlock(w, 4 / (cam.z * S))}} />
        </Layer>
        <Stopwatch x={toScreen(cam, TOE_X - 250, DECK - 250).x} y={toScreen(cam, TOE_X - 250, DECK - 250).y} k={watchK} t={t} t0={VAR.tm} />
        {dieK > 0 ? <Die x={1730} y={160} s={0.42 * backOut(Math.min(1, dieK * 2), 1.6)} rot={-8 + die.roll * 300} n={die.n} col={C.paper} /> : null}
        <DiceWipeLayer t={t} />
      </Scene>
    );
  }

  // ============================== R5 (airbag rehearsal)
  if (t < CROUCH_T) {
    const p = hallPose(t);
    const r = rig(p, S).pts;
    const camRaw = (tt: number): Cam => {
      const pp = rig(hallPose(tt), S).pts;
      const base: Cam = tt < HJ.tTO ? {x: TOE_X + 80, y: HALL.ledge - 160, z: 1.7} : {x: lerp(TOE_X + 80, HALL.bagX, seg(tt, HJ.tTO, HJ.tEnd)), y: lerp(HALL.ledge - 160, BAG_TOP - 140, easeIn(seg(tt, HJ.tTO, HJ.tEnd))), z: 1.7};
      return fitIn(base, hallPts(tt), {top: 170, bottom: 120, left: 170, right: 170});
    };
    const cam = fitIn(smoothCam(camRaw, t, 0.14), hallPts(t), {top: 70, bottom: 60, left: 80, right: 80});
    const lw = 4 / cam.z;
    const sq = bagSquash(t);
    const d = t - HJ.tEnd;
    void r;
    return (
      <Scene bg="#596069">
        <Layer cam={cam}>
          <HallBack lw={lw} />
          <Mezz lw={lw} />
          <Airbag6 x={HALL.bagX} y={HALL.floor} s={HALL.bagS} dent={sq * 170 * 0.22} dentX={(HJ.p1.x - HALL.bagX) / HALL.bagS} lw={lw} />
          {d > 0 && d < 0.6 ? [-1, 1].map((sx) => <g key={sx}>{[0, 1, 2].map((i) => <path key={i} d={`M${HALL.bagX + sx * (220 + d * 260 + i * 30)} ${BAG_TOP + 40 - i * 26} q${sx * 30} -20 ${sx * 60} 0`} fill="none" stroke="#FFFFFF" strokeWidth={lw * 2} strokeLinecap="round" opacity={1 - d / 0.6} />)}</g>) : null}
          <Bot cam={cam} id="rlH" model="F02" s={S} pose={p} />
        </Layer>
      </Scene>
    );
  }

  // ============================== R6–R7 (the messy foundry, the monitors, the jump)
  const p = messPose(t);
  const camRaw = (tt: number): Cam => {
    // matched crouch: same screen position as the airbag's last frame, then out to the monitors and the jump
    const hp = rig(hallPose(CROUCH_T - 0.001), S).pts.pelvis;
    const hc = smoothCam((u) => {
      const pp = rig(hallPose(u), S).pts;
      return fitIn({x: HALL.bagX, y: BAG_TOP - 140, z: 1.7}, [[pp.head[0], pp.head[1] - 40], pp.toeN, pp.toeF, pp.wrN, pp.wrF], {top: 170, bottom: 120, left: 170, right: 170});
    }, CROUCH_T - 0.001, 0.14);
    const kp = rig(J_PAY.K0, S).pts.pelvis;
    const match: Cam = {x: kp[0] - (hp[0] - hc.x), y: kp[1] - (hp[1] - hc.y), z: hc.z};
    let c = mixCam(match, CAM_MESS, easeInOut(seg(tt, CROUCH_T + 0.3, T_HEAT - 0.2)));
    c = mixCam(c, CAM_MON, easeInOut(seg(tt, T_HEAT - 0.1, T_KNOCKED + 0.1)));
    c = mixCam(c, CAM_JUMP, easeInOut(seg(tt, T_KEPT - 0.35, T_KEPT + 0.35)));
    c = mixCam(c, CAM_REAL_END, easeInOut(seg(tt, J_PAY.tEnd - 0.35, REAL_END)));
    return c;
  };
  const cam = t < CROUCH_T + 0.25 ? camRaw(t) : smoothCam(camRaw, t, 0.18);
  const lw = 4 / cam.z;
  const tHit = t - J_PAY.tEnd;
  const st = J_PAY.pose(t);
  const under = st.phase === 'after' && st.u > 0.62;
  const mon1 = t < T_KNOCKED ? 0 : t < T_KNOCKED + 0.6 ? 1 : 2;
  const mon2 = t < T_ELEC ? 0 : t < T_ELEC + 0.5 ? 1 : 2;
  const haze = seg(t, CROUCH_T, CROUCH_T + 0.8);
  const shimmer = 1 - seg(t, T_KEPT - 0.6, T_KEPT - 0.2);
  const emi = seg(t, T_HEAT + 0.3, T_HEAT + 0.8) * (1 - seg(t, T_KEPT + 0.2, T_KEPT + 0.8));
  const B = FD.booth;
  const spark = (x: number, y: number, t0: number) => t > t0 && t < t0 + 0.6 ? (
    <g>{Array.from({length: 7}, (_, i) => { const a = rnd(i * 5 + 1) * Math.PI * 2; const u = (t - t0) / 0.6; return <line key={i} x1={x + Math.cos(a) * 10 * u} y1={y + Math.sin(a) * 10 * u} x2={x + Math.cos(a) * (20 + 60 * u)} y2={y + Math.sin(a) * (20 + 60 * u) + 40 * u * u} stroke="#FFE08A" strokeWidth={lw * 1.6} strokeLinecap="round" opacity={1 - u} />; })}</g>
  ) : null;
  return (
    <Scene bg="#221A21">
      <FoundryView5 cam={cam} t={t} hook={false} id="rlm" glow={1 + 0.25 * haze} hit={tHit > 0 ? {x: TGT_X, t: tHit} : undefined}
        extraBack={<g><FilmLight x={-260} y={FD.deck.top} lw={lw} on={1} aim={16} id="rmA" /><FilmLight x={1440} y={FD.floor} lw={lw} on={1} aim={205} h={560} id="rmB" /></g>}
        booth={(
          <g>
            <rect x={B.x0 + 30} y={B.y0 + 30} width={B.x1 - B.x0 - 60} height={190} fill="#3A2C30" />
            <MonitorScreen x={B.x0 + 130} y={B.y0 + 125} w={150} h={96} lw={lw} state={mon1} t={t} id={1} />
            <MonitorScreen x={B.x0 + 330} y={B.y0 + 125} w={150} h={96} lw={lw} state={mon2} t={t} id={2} />
            {emi > 0 ? [0, 1].map((k) => <path key={k} d={`M${B.x0 + 60 + k * 200} ${B.y0 + 60} l20 30 l-14 10 l26 34`} fill="none" stroke="#BFE8FF" strokeWidth={lw * 2} opacity={emi * (Math.sin(t * 50 + k * 2) > 0.2 ? 1 : 0.2)} />) : null}
          </g>
        )}
        behind={!under ? <Bot cam={cam} id="rlP" model="F02" s={S} pose={p} clipBelow={st.phase === 'after' ? SURF + 1 : undefined} /> : null}
        inside={<><Splash6 x={TGT_X} t={tHit} lw={lw} part="back" scale={1.1} /><Splash6 x={TGT_X} t={tHit} lw={lw} part="front" scale={1.1} /></>}
        front={(
          <g>
            {BARRIERS.map((x) => <Barrier key={x} x={x} lw={lw} />)}
            <TripodCam x={1180} y={FD.floor} lw={lw} />
            <SetCrew f={f} lookC={t > T_KNOCKED - 0.2 ? 0.95 : 0.5} showA={false} />   {/* clipboard crew stays out of the jump shots (no head at the frame edge) */}
            {spark(B.x0 + 330, B.y0 + 125, T_ELEC)}
            {spark(1180, FD.floor - 400, T_KNOCKED + 0.1)}
            <CameraIcon x={1180} y={FD.floor - 430} s={0.6} broken={seg(t, T_KNOCKED + 0.1, T_KNOCKED + 0.4)} />
          </g>
        )} />
      {/* V6: heat shimmer only in the air just above the ladle (no full-frame overlay), cleared before the jump */}
      {haze > 0 && shimmer > 0 ? (() => {
        const a = toScreen(cam, FD.ladle.cx - FD.ladle.srx * 0.8, SURF - 220), b = toScreen(cam, FD.ladle.cx + FD.ladle.srx * 0.8, SURF - 20);
        return (
          <g opacity={0.55 * haze * shimmer} style={{mixBlendMode: 'screen'}}>
            {Array.from({length: 4}, (_, i) => {
              const y = lerp(b.y, a.y, (i + ((t * 0.6) % 1)) / 4);
              return <path key={i} d={`M${a.x} ${y} Q ${(a.x + b.x) / 2} ${y - 10 + Math.sin(t * 3 + i) * 8} ${b.x} ${y}`} fill="none" stroke="#FFB870" strokeWidth={6} opacity={0.3} />;
            })}
          </g>
        );
      })() : null}
    </Scene>
  );
};

/** The dice wipe drawn over both sides of the cut (screen space). */
const DiceWipeLayer: React.FC<{t: number}> = ({t}) => <DiceWipe t={t} />;
void Crew; void CAST; void IDLE; void easeOut; void C; void Chip;
/** Event times for the sound cue sheet. */
export const REAL_EV = {T_X0, T_X1, DICE0, DICE1, DICE_COVER, ROUNDS, VAR, HJ, CROUCH_T, J_PAY, HALL_WALK, hallPose};
