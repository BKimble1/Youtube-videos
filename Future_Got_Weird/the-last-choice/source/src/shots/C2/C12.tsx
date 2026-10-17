// C12 — the choice, on the B♭ arrival (M.ARRIVAL). Four cuts inside the shot window:
//   a  close on the friend at the lever: the replacement drone's eye locks (cyan → amber); behind them the breaker's
//      launcher swings down onto them. They see it, and could let go. They look across to the basket.
//   b  the teammate in the basket, held by the carrier, looking back at them.
//   c  the friend: the same small nod as on the street (B3).
//   d  insert: the hand tightens on the lever. The basket docks (sound) under it.
import React from 'react';
import {Frame, Grade, Cam, Layer, layerZoom, smoothCam, inkFor} from '../../kit/cam';
import {useShot} from '../../film/useShot';
import {clamp, keys, lerp, easeInOut, smooth, noise} from '../../kit/math';
import {solve, ActorProps} from '../../rig/actor';
import {HandCU} from '../../rig/HandCU';
import {look, dmg} from '../../film/crew';
import {C} from '../../theme';
import {Breaker, Drone} from '../../mech';
import {Glow} from '../../fx/light';
import {Embers} from '../../fx';
import {CrossingScene, slotsOf, ik} from './scene';
import {crewAt, leverPose, teammateAt, Placed} from './blocking';
import {Drones} from './machines';
import {BEAT, SHOT, breakerAt, droneB, DOCK} from './world';

const S = SHOT.C12.start;
export const C12_CUTS = {b: BEAT.aimed + 0.34, c: BEAT.aimed + 0.89, d: BEAT.aimed + 1.34}; // 102.95, 103.50, 103.95

/** The friend through the shot: the lock, the breaker, the glance, the nod. */
const friendC12 = (T: number): ActorProps => {
  const lockSeen = smooth(clamp((T - (S + 0.5)) / 0.3));
  const fear = smooth(clamp((T - (BEAT.aimed - 0.55)) / 0.3)) * (1 - smooth(clamp((T - (BEAT.aimed + 0.1)) / 0.4)));
  const glance = smooth(clamp((T - (BEAT.aimed + 0.05)) / 0.3));
  const nodT = C12_CUTS.c + 0.08;
  const nod = T > nodT && T < nodT + 0.42 ? Math.sin(((T - nodT) / 0.42) * Math.PI) : 0;
  const yawH = T > C12_CUTS.c ? -8 : lerp(lerp(22, 44, lockSeen), -34, glance);
  const ease = smooth(clamp((T - (BEAT.aimed - 0.3)) / 0.25)) * (1 - glance); // the grip eases: they could let go
  const base = leverPose(T);
  return {
    ...base,
    lean: (base.lean ?? 0) - 4 * ease, drop: (base.drop ?? 0) - 6 * ease,
    head: {yaw: yawH, pitch: 2 + 14 * nod + 8 * ease, roll: -4 * nod},
    face: T > C12_CUTS.c
      ? {mouth: 'soft', brows: -0.1, worry: 0.35, lookX: 0.95, lookY: 0.1 + 0.3 * nod}
      : {mouth: fear > 0.4 ? 'o' : 'grit', brows: -0.6 + 1.0 * fear, worry: 0.8 * fear, lookX: lerp(lerp(0.5, -0.95, lockSeen), 0.95, glance), lookY: 0.4 * ease, open: 0.3},
    breath: 0.8,
  };
};

/** Crew with the friend's C12 performance swapped in. */
const crewC12 = (T: number): Placed[] => crewAt(T).map((q) => (q.key === 'friend' ? {...q, p: friendC12(T)} : q));

const headOf = (p: ActorProps) => solve(p).headC;

/** The breaker and the locking drone behind the friend, cheated into the close frame (their real positions on the
 *  deck are outside it). Placed in world units from the cut's first camera so they sit still behind the friend. */
const Threats: React.FC<{T: number; cam0: Cam}> = ({T, cam0}) => {
  const z0 = cam0.z;
  const W = (sx: number, sy: number) => ({x: cam0.x + (sx - 960) / z0, y: cam0.y + (sy - 540) / z0});
  const k = 1.3 / z0;
  const pod = W(300, 380);
  const bx = pod.x - 40 * k, by = pod.y + 930 * k;
  const b = breakerAt(T);
  const d = droneB(T);
  const dp = W(610 + 30 * Math.sin(T * 1.3), 150 + 12 * Math.sin(T * 2.1));
  return (
    <g>
      <Breaker x={bx} y={by} s={k} dir={1} t={T} ink={3.2 / z0} seed={3} aim={b.aim} lock={b.lock} />
      <Drone x={dp.x} y={dp.y} s={1.0 / z0 * 1.6} t={T} seed={8} ink={3 / z0} face={0.5} look={{x: 0.7, y: 0.6}} lock={d.lock} glow={0.8} />
      <rect x={pod.x - 2000} y={pod.y - 2000} width={2600} height={4000} fill="#2B1B26" opacity={0.0} />
    </g>
  );
};

/** The lever bar's segment through a close-up hand, in the hand's local (rotated) frame: drawn between the palm and
 *  the fingers so the fingers wrap over it. The bar's centre line passes (960, 520) at angle `ang`. */
const barThrough = (hx: number, hy: number, rot: number, ang: number) => {
  const r = (-rot * Math.PI) / 180, vx = 960 - hx, vy = 520 - hy;
  const lx = vx * Math.cos(r) - vy * Math.sin(r), ly = vx * Math.sin(r) + vy * Math.cos(r);
  const da = ((ang - rot) * Math.PI) / 180;
  const x0 = lx - ly * (Math.cos(da) / Math.sin(da));
  const tilt = ang - rot - 90;
  return (
    <g transform={`rotate(${tilt.toFixed(2)} ${x0.toFixed(1)} 0)`}>
      <rect x={x0 - 50} y={-260} width={100} height={520} fill="#5B6670" />
      <line x1={x0 - 50} y1={-260} x2={x0 - 50} y2={260} stroke={C.ink} strokeWidth={8} />
      <line x1={x0 + 50} y1={-260} x2={x0 + 50} y2={260} stroke={C.ink} strokeWidth={8} />
      <rect x={x0 - 42} y={-260} width={22} height={520} fill="#7D8994" opacity={0.7} />
    </g>
  );
};

/** Insert: the friend's hand tightens on the lever bar. Screen-space close-up. */
const HandInsert: React.FC<{T: number}> = ({T}) => {
  const u = clamp((T - C12_CUTS.d) / (SHOT.C12.end - C12_CUTS.d));
  const tight = smooth(clamp((T - (C12_CUTS.d + 0.12)) / 0.24));
  const tremor = noise(T * 22, 4) * 1.2 * tight;
  const skin = look('friend').skin;
  const sleeve = C.teal;
  const ang = -6; // the bar: hauled almost level
  const docked = T > DOCK ? Math.exp(-9 * (T - DOCK)) * Math.sin((T - DOCK) * 70) * 6 : 0; // the dock bump through the lever
  const push = 1 + 0.02 * u;
  return (
    <g transform={`translate(960 540) scale(${push}) translate(-960 -540) translate(0 ${docked.toFixed(2)})`}>
      <defs>
        <radialGradient id="c12dbg" cx="60%" cy="40%" r="80%"><stop offset="0%" stopColor="#7A3A2C" /><stop offset="100%" stopColor="#1E1418" /></radialGradient>
      </defs>
      <rect x={-20} y={-20} width={1960} height={1120} fill="url(#c12dbg)" />
      <Glow x={1500} y={300} r={700} color="#FF9A4A" opacity={0.35} id="c12dg" />
      <Embers x={960} y={1100} w={2000} h={1200} t={T} seed={8} n={22} size={2.2} opacity={0.7} />
      {/* the lever bar and its knob */}
      <g transform={`rotate(${ang} 960 520)`}>
        <rect x={-200} y={470} width={2400} height={100} rx={46} fill={C.ink} />
        <rect x={-200} y={478} width={2400} height={84} rx={40} fill="#5B6670" />
        <rect x={-200} y={486} width={2400} height={22} rx={10} fill="#7D8994" opacity={0.7} />
        <circle cx={250} cy={520} r={118} fill="#E0543E" stroke={C.ink} strokeWidth={9} />
        <circle cx={220} cy={488} r={34} fill="#F08872" opacity={0.7} />
      </g>
      {/* the second hand further along the bar */}
      <HandCU x={1590} y={820} rot={-96} s={2.6} skin={skin} sleeve={sleeve} view="side" side="R" curl={0.95} thumb={0.85} ink={9} dirt={0.4}>{barThrough(1590, 820, -96, ang)}</HandCU>
      {/* the near hand: on the bar, closing hard */}
      <HandCU x={700 + tremor} y={940 + 6 * tight} rot={-92} s={3.6} skin={skin} sleeve={sleeve} cuffTorn view="side" side="R" curl={[lerp(0.42, 1, tight), lerp(0.4, 1, tight), lerp(0.38, 0.98, tight), lerp(0.36, 0.96, tight)]} thumb={lerp(0.3, 0.95, tight)} ink={9} dirt={0.5} scrape={0.6}>{barThrough(700 + tremor, 940 + 6 * tight, -92, ang)}</HandCU>
    </g>
  );
};

export const C12: React.FC = () => {
  const {t, T} = useShot('C12');
  // --- d: the hand insert
  if (T >= C12_CUTS.d) return <Frame bg="#1E1418"><HandInsert T={T} /><Grade vignette={0.5} id="c12dvg" /></Frame>;
  // --- b: the teammate looking back
  if (T >= C12_CUTS.b && T < C12_CUTS.c) {
    const camB = (T: number): Cam => {
      const tp = teammateAt(T).p;
      const h = headOf({...tp, x: tp.x - 36});
      return {x: h.x - 150, y: h.y + 70, z: 2.55};
    };
    const cam = smoothCam(camB, T, 0.15);
    const ink = ik(cam);
    const crew = crewC12(T).map((q) => (q.key === 'teammate' ? {...q, p: {...q.p, x: q.p.x - 36, z: 0.7, zArm: [undefined, -40] as [undefined, number], zHand: [undefined, -30] as [undefined, number], head: {yaw: 70, pitch: 6, roll: 4}, face: {mouth: 'sad' as const, brows: 0.4, worry: 1, lookX: -0.9, lids: 0.2}}} : q));
    return (
      <Frame bg="#2B1B26">
        <CrossingScene T={T} t={t} cam={cam} id="c12b" slots={slotsOf(crew, ink, {air: <Drones T={T} ink={ink} far={false} />})} haze={0.5} />
        <Grade vignette={0.5} id="c12bvg" />
      </Frame>
    );
  }
  // --- a / c: close on the friend
  const sub = T < C12_CUTS.b ? 'a' : 'c';
  const start = sub === 'a' ? S : C12_CUTS.c;
  const camF = (T: number): Cam => {
    const h = headOf(friendC12(T));
    const push = sub === 'a' ? keys(T, [[S, 2.55], [C12_CUTS.b, 2.85, easeInOut]]) : keys(T, [[C12_CUTS.c, 3.0], [C12_CUTS.d, 3.08]]);
    return {x: h.x - 120, y: h.y + 105, z: push};
  };
  const cam = smoothCam(camF, T, 0.12);
  const cam0 = camF(start);
  const ink = ik(cam);
  const slots = slotsOf(crewC12(T), ink, {deckBack: <Threats T={T} cam0={cam0} />});
  return (
    <Frame bg="#2B1B26">
      <CrossingScene T={T} t={t} cam={cam} id={`c12${sub}`} slots={slots} haze={0.4} />
      <Grade vignette={0.5} id={`c12${sub}vg`} />
    </Frame>
  );
};
export {dmg};
