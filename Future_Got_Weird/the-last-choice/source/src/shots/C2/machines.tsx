// Group C2 machines on the shared timeline: the breaker (deck), an escort warden, the drones, the charge and the blast.
import React from 'react';
import {Breaker, breakerMuzzle, Drone, Warden, wardenWalker} from '../../mech';
import {Blast, Charge, Debris, Smoke, Dust} from '../../fx';
import {Sparks as FxSparks} from '../../fx';
import {clamp, keys, lerp, easeOut, smooth} from '../../kit/math';
import {BEAT, BLAST_AT, BREAKER_S, DECK, breakerAt, droneA, droneB, droneFar, SPLIT_X, trolleyX, basketU} from './world';
import {legTop, splitEdges, walkPoint} from '../../sets/city';
import {gantryAt} from './world';

/** Breaker props at T (for drawing and for its muzzle). */
export const breakerProps = (T: number, ink: number) => {
  const b = breakerAt(T);
  return {x: b.x, y: DECK, s: BREAKER_S, dir: 1 as const, t: T, ink, seed: 3, aim: b.aim, dist: b.dist, lock: b.lock, fire: {t0: b.fireT0}, crushed: b.crushed, crushT0: b.crushT0, groundY: DECK};
};

export const BreakerAt: React.FC<{T: number; ink: number}> = ({T, ink}) => <Breaker {...breakerProps(T, ink)} />;

/** The replacement warden from C8 (eye lit), walking the deck behind the Crew with the breaker; it holds at the
 *  breaker's flank (a coordinated pause) while the breaker does the work. */
export const EscortWarden: React.FC<{T: number; ink: number; x0?: number}> = ({T, ink, x0 = 7700}) => {
  const d = keys(T, [[86, 0], [93.0, 1160, easeOut]]);
  const p = wardenWalker(x0, d, 1, DECK, {t: T, s: 0.95, ink, seed: 7, lock: 0, look: {x: 0.6, y: 0.1}, z: -1, glow: 1});
  const scan = T > 93 ? Math.sin((T - 93) * 0.9) * 25 : 0;
  return <Warden {...p} headYaw={scan} />;
};

/** All drones at T: A (smashed by the swinging basket), B (replacement; locks on the friend), two far ones. */
export const Drones: React.FC<{T: number; ink: number; far?: boolean; only?: 'A' | 'B'}> = ({T, ink, far = true, only}) => {
  const a = droneA(T), b = droneB(T);
  return (
    <g>
      {far && [0, 1].map((k) => { const q = droneFar(T, k); return <Drone key={k} x={q.x} y={q.y} s={0.9} t={T} seed={20 + k} ink={ink} face={0.4} look={{x: 0.4, y: 0.6}} />; })}
      {only !== 'B' && <Drone x={a.x} y={a.y} s={1.45} t={T} seed={5} ink={ink} tilt={a.tilt} face={0.7} look={{x: 0.6, y: 0.8}} lock={T > BEAT.depart ? 1 : 0} smash={{t0: a.smashT0, dir: -30, groundY: 40, power: 1.2}} />}
      {only !== 'B' && T > a.smashT0 && <FxSparks x={trolleyX(basketU(T))} y={-2420} t={T} t0={a.smashT0} seed={12} n={18} dir={60} spread={120} speed={[200, 700]} mode="stream" t1={a.smashT0 + 1.4} rate={10} />}
      {only !== 'A' && b.on && <Drone x={b.x} y={b.y} s={1.35} t={T} seed={8} ink={ink} face={-0.5} look={{x: -0.5, y: 0.7}} lock={b.lock} glow={0.6} />}
    </g>
  );
};

/** The charge from the breaker's pod to the walkway, and the blast with its debris, smoke and sparks. */
export const BlastFx: React.FC<{T: number; ink: number}> = ({T, ink}) => {
  const fire = BEAT.blast - 0.3;
  const m = breakerMuzzle(breakerProps(fire, ink));
  const st = gantryAt(T);
  const e = splitEdges(st);
  return (
    <g>
      <Charge x0={m.x} y0={m.y} x1={BLAST_AT.x} y1={BLAST_AT.y} t={T} t0={fire} t1={BEAT.blast} arc={40} size={22} seed={4} />
      <Blast x={BLAST_AT.x} y={BLAST_AT.y} t={T} t0={BEAT.blast} seed={9} size={330} ground={40} debrisMaterial="metal" debrisN={26} ink={ink} dir={-70} />
      {T > BEAT.blast && <Debris x={BLAST_AT.x + 40} y={DECK + 20} t={T} t0={BEAT.blast + 0.05} seed={14} n={16} dir={80} spread={70} speed={[200, 700]} size={[14, 46]} ground={40} material="concrete" ink={ink} />}
      {T > BEAT.sag && e && <Debris x={e.far.x} y={e.far.y + 10} t={T} t0={BEAT.sag} seed={21} n={10} dir={95} spread={40} speed={[60, 260]} size={[8, 26]} ground={40} material="metal" ink={ink} />}
      {T > BEAT.blast && e && <FxSparks x={e.far.x} y={e.far.y} t={T} t0={BEAT.sag} seed={6} n={14} dir={100} spread={60} speed={[150, 500]} />}
      {void walkPoint}{void SPLIT_X}
    </g>
  );
};

/** Collapse effects: dust where the leg and the beam land, sparks at the near leg's base. */
export const CollapseFx: React.FC<{T: number; ink: number}> = ({T, ink}) => {
  if (T < BEAT.lurch) return null;
  const st = gantryAt(T);
  const top = legTop(st);
  return (
    <g>
      <FxSparks x={10200} y={DECK - 20} t={T} t0={BEAT.lurch} seed={31} n={20} dir={-120} spread={120} speed={[300, 900]} />
      <Dust x={10150} y={DECK} t={T} t0={BEAT.lurch + 0.05} size={260} n={8} seed={33} />
      <Dust x={9600} y={DECK} t={T} t0={BEAT.crush} size={620} n={14} seed={35} life={3.2} />
      <Debris x={9700} y={DECK - 120} t={T} t0={BEAT.crush} seed={37} n={22} dir={-100} spread={140} speed={[300, 1100]} size={[12, 40]} ground={DECK} material="panel" ink={ink} />
      <Dust x={10150} y={DECK} t={T} t0={BEAT.slam} size={700} n={14} seed={39} life={3.2} />
      <Debris x={10200} y={DECK - 30} t={T} t0={BEAT.slam} seed={41} n={18} dir={-90} spread={160} speed={[300, 1000]} size={[10, 34]} ground={DECK} material="concrete" ink={ink} />
      <Smoke x={9800} y={DECK - 100} t={T} t0={BEAT.crush} t1={BEAT.crush + 4} rate={4} life={4} vy={-120} size={120} grow={90} color="#4A4044" opacity={0.6} seed={43} />
      {void top}{void clamp}{void lerp}{void smooth}
    </g>
  );
};
