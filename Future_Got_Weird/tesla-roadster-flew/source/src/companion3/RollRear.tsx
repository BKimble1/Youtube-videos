// The same moment from behind the car (match cut from the side view): still upside down, falling. Conceptual side
// nozzles (positions are staging, Tesla showed none) fire an off-centre pair: one side pushed up, the other down,
// so the car rolls about its centre of mass; the opposite pair stops it upright; both fire down, pushing it up and
// slowing the fall; the pushes are then laid against the weight (short of it: no hover); the ground arrives and the
// car lands, compressing and settling. Colours: blue = gas out, saffron = push on the car, ink-grey = weight.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';
import {REAR, RoadsterRear} from '../companion2/RoadsterRear';
import {ArcArrow, Arrow, cue, E, FLOW, FLOW_LIGHT, FORCE, lerp, ramp, rnd, settle, useT, WEIGHT} from './kit3';

export const ROLL = {start: 71.6, end: cue('one.', 'R5', 0, true) + 0.38};
const T = {
  push: cue('push', 'R1'), one: cue('One', 'R1'), up: cue('up,', 'R1'), other: cue('other', 'R1'), down: cue('down,', 'R1'), rolls: cue('rolls.', 'R1'),
  fire: cue('Fire', 'R2'), opposite: cue('opposite', 'R2'), stops: cue('stops.', 'R2'),
  aim: cue('aim', 'R3'), gasDown: cue('down.', 'R3'), pushes: cue('pushes', 'R3'), upward: cue('upward', 'R3'), slows: cue('slows', 'R3'),
  hover: cue('hover,', 'R4'), thrust: cue('thrust', 'R4'), match: cue('match', 'R4'), weight: cue('weight.', 'R4'),
};
const K = 0.95;
const ORIGIN_Y = 640; // screen y of the ground point under the car while airborne
const CY = ORIGIN_Y + REAR.cy * K; // centre of mass on screen
// roll: torque, coast, counter-torque (180 degrees in total)
const c1s = T.one + 0.02, c1e = c1s + 1.6, c2s = T.opposite - 0.02, c2e = c2s + 1.6;
const coast = c2s - c1e;
const ALPHA = 180 / (1.6 * 1.6 + 1.6 * coast);
const W1 = ALPHA * 1.6;
const rollAt = (t: number) => {
  if (t <= c1s) return 180;
  if (t <= c1e) return 180 + 0.5 * ALPHA * (t - c1s) ** 2;
  const a1 = 180 + 0.5 * ALPHA * 1.6 ** 2;
  if (t <= c2s) return a1 + W1 * (t - c1e);
  const a2 = a1 + W1 * coast;
  if (t <= c2e) return a2 + W1 * (t - c2s) - 0.5 * ALPHA * (t - c2s) ** 2;
  return 360;
};
// fall speed (screen px/s): growing under gravity, growing much more slowly once both jets push up (still < weight)
const DOWN0 = T.gasDown - 0.25;
const vAt = (t: number) => t < DOWN0 ? lerp(150, 330, ramp(t, ROLL.start, DOWN0, E.linear)) : 330 + 22 * (t - DOWN0);
const LAND = T.weight + 0.45;
const distTo = (t: number) => { // px still to fall before touchdown
  let d = 0; const n = 40;
  if (t >= LAND) return 0;
  for (let i = 0; i < n; i++) { const s = t + ((LAND - t) * (i + 0.5)) / n; d += (vAt(s) * (LAND - t)) / n; }
  return d;
};
const rot = (x: number, y: number, deg: number) => {
  const r = (deg * Math.PI) / 180;
  return {x: x * Math.cos(r) - y * Math.sin(r), y: x * Math.sin(r) + y * Math.cos(r)};
};

export const RollRear: React.FC = () => {
  const t = useT(ROLL.start);
  const roll = rollAt(t);
  const landed = t >= LAND;
  const sq = settle(t, LAND, 0.035, 0.55) + 0.012 * ramp(t, LAND, LAND + 0.15);
  const ground = ORIGIN_Y + distTo(t); // ground line on screen
  const ctr = {x: 960, y: CY};
  const nozzle = (side: 1 | -1) => { const p = rot(side * 292 * K, 22 * K, roll); return {x: ctr.x + p.x, y: ctr.y + p.y}; };
  const nIn = ramp(t, T.push - 0.1, T.push + 0.25, E.back);
  // which nozzles fire, and their gas direction in car-local coordinates (local -y = the car's roof side)
  type Fire = {side: 1 | -1; dir: 1 | -1; o: number; arrow: number; t0: number};
  const fires: Fire[] = [];
  const on = (a: number, b: number) => ramp(t, a, a + 0.1) * (1 - ramp(t, b - 0.1, b));
  // upside down (roll 180) the side +1 nozzle is on the screen's left: its gas goes down, so that side is pushed up;
  // the other side's gas goes up, so it is pushed down: a clockwise turn (roll increasing) about the centre of mass
  if (t > c1s - 0.1 && t < c1e + 0.1) {
    fires.push({side: 1, dir: -1, o: on(c1s, c1e), arrow: ramp(t, T.one, T.one + 0.2), t0: c1s});
    fires.push({side: -1, dir: 1, o: on(c1s, c1e), arrow: ramp(t, T.other, T.other + 0.2), t0: c1s});
  }
  if (t > c2s - 0.1 && t < c2e + 0.1) {
    fires.push({side: 1, dir: 1, o: on(c2s, c2e), arrow: 1, t0: c2s});
    fires.push({side: -1, dir: -1, o: on(c2s, c2e), arrow: 1, t0: c2s});
  }
  const d0 = T.gasDown - 0.25, d1 = LAND + 0.15;
  if (t > d0 - 0.1 && t < d1 + 0.1) {
    const a = ramp(t, T.pushes - 0.1, T.pushes + 0.2) * (1 - ramp(t, T.thrust - 0.4, T.thrust - 0.1));
    fires.push({side: -1, dir: 1, o: on(d0, d1), arrow: a, t0: d0});
    fires.push({side: 1, dir: 1, o: on(d0, d1), arrow: a, t0: d0});
  }
  const weightO = ramp(t, T.pushes - 0.3, T.pushes) * (1 - ramp(t, T.thrust - 0.4, T.thrust - 0.1));
  const compare = ramp(t, T.thrust - 0.35, T.thrust + 0.2, E.out) * (1 - ramp(t, LAND - 0.3, LAND));
  const rollArc = ramp(t, T.rolls - 0.3, T.rolls) * (1 - ramp(t, T.stops - 0.2, T.stops + 0.2));
  // speed streaks and clouds rising past the falling car
  const travel = (() => { let d = 0; const n = 60; for (let i = 0; i < n; i++) { const tt = Math.min(t, LAND); const s = ROLL.start + ((tt - ROLL.start) * (i + 0.5)) / n; d += (vAt(s) * (tt - ROLL.start)) / n; } return d; })();
  // clouds rise past the falling car (nearer ones faster): the fall reads without speed lines
  const clouds = Array.from({length: 9}, (_, i) => { const k = 0.35 + rnd(i + 17) * 0.5; return {x: 120 + rnd(i + 300) * 1680, y: (((rnd(i + 200) * 1800 - travel * k) % 1800) + 1800) % 1800 - 300, r: (50 + rnd(i + 5) * 50) * (0.7 + k)}; });
  const Lt = 130 * K, Lw = 310 * K; // push per nozzle, weight (each push a bit under half the weight)
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#2E3F66 0%, #5B6E9A 55%, #C99A86 88%, #E9B98A 100%)'}}>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        {clouds.map((c, i) => (
          <g key={`c${i}`} opacity={0.4}>
            <ellipse cx={c.x} cy={c.y} rx={c.r * 2.4} ry={c.r * 0.7} fill="#F2E9F0" />
            <ellipse cx={c.x + c.r} cy={c.y - c.r * 0.4} rx={c.r * 1.2} ry={c.r * 0.6} fill="#F2E9F0" />
          </g>
        ))}
        {/* the ground arriving: test-area surface and its horizon haze */}
        {ground < 1300 && (
          <g>
            <rect x={-10} y={ground} width={1940} height={1200} fill="#9C8370" />
            <rect x={-10} y={ground} width={1940} height={10} fill="#7E6A5C" />
            {[40, 110, 220].map((d, i) => <line key={i} x1={-10} y1={ground + d} x2={1930} y2={ground + d} stroke="#8C7564" strokeWidth={3 + i} />)}
            <ellipse cx={960} cy={ground + 6} rx={330 * Math.max(0.3, 1 - (ground - ORIGIN_Y) / 900)} ry={14} fill="rgba(30,24,20,0.35)" />
          </g>
        )}
        {/* gas plumes (behind the car) */}
        {fires.map((f, i) => {
          const n = nozzle(f.side);
          const g = rot(0, f.dir, roll);
          const parts: React.ReactNode[] = [];
          for (let k = 0; k < 9; k++) {
            const u = ((t - f.t0) * 2.6 + k / 9) % 1;
            if (t - f.t0 < u / 2.6) continue;
            let px = n.x + g.x * (24 + u * 230), py = n.y + g.y * (24 + u * 230);
            // gas meeting the ground spreads sideways
            if (py > ground - 4) { const over = py - ground; py = ground - 8 - u * 20; px += Math.sign(n.x - 960) * over * 1.6; }
            parts.push(<circle key={k} cx={px} cy={py} r={9 + u * 30} fill={k % 3 ? FLOW_LIGHT : '#FFFFFF'} opacity={(1 - u) * 0.75 * f.o} />);
          }
          return <g key={i}>{parts}</g>;
        })}
        {/* after touchdown the gas keeps rolling out along the ground */}
        {landed && Array.from({length: 14}, (_, i) => {
          const side = i % 2 ? 1 : -1;
          const u = Math.min(1, (t - LAND) / (1.4 + rnd(i) * 0.6));
          const x = 960 + side * (260 + (80 + rnd(i + 3) * 420) * u);
          const y = ground - 20 - rnd(i + 7) * 40 - 30 * u;
          return <circle key={`b${i}`} cx={x} cy={y} r={30 + 50 * u + rnd(i) * 20} fill={i % 3 ? FLOW_LIGHT : '#FFFFFF'} opacity={0.6 * (1 - u * 0.75)} />;
        })}
        <g transform={`translate(0 ${ORIGIN_Y}) scale(1 ${1 - sq}) translate(0 ${-ORIGIN_Y})`}>
          <RoadsterRear x={960} y={ORIGIN_Y} k={K} roll={roll} id="rr3" />
          {/* conceptual side nozzles, attached to the body */}
          {([1, -1] as const).map((s) => {
            const n = nozzle(s);
            return <rect key={s} x={n.x - 14} y={n.y - 19} width={28} height={38} rx={6} fill="#3A4348" stroke={C.ink} strokeWidth={4} transform={`rotate(${roll} ${n.x} ${n.y}) translate(${n.x} ${n.y}) scale(${nIn}) translate(${-n.x} ${-n.y})`} />;
          })}
        </g>
        {/* gas out (blue) and the push on the car (saffron): opposite, both starting at the nozzle */}
        {fires.map((f, i) => {
          const n = nozzle(f.side);
          const g = rot(0, f.dir, roll);
          const o = f.o * f.arrow;
          return (
            <g key={`a${i}`}>
              <Arrow x1={n.x + g.x * 34} y1={n.y + g.y * 34} x2={n.x + g.x * 190} y2={n.y + g.y * 190} color={FLOW} w={15} opacity={o * 0.95} />
              <Arrow x1={n.x - g.x * 22} y1={n.y - g.y * 22} x2={n.x - g.x * (22 + Lt)} y2={n.y - g.y * (22 + Lt)} color={FORCE} w={20} opacity={o} />
            </g>
          );
        })}
        <ArcArrow cx={ctr.x} cy={ctr.y} r={390} a0={-118} a1={-62} color={C.ink} w={13} opacity={rollArc} />
        {/* weight: from the centre of mass, straight down */}
        <Arrow x1={ctr.x} y1={ctr.y + 40} x2={ctr.x} y2={ctr.y + 40 + Lw} color={WEIGHT} w={18} opacity={weightO} />
        {/* the two pushes laid end to end beside the weight: short of it, so no hover */}
        {compare > 0 && (() => {
          const bx = 1580, top = 360;
          const wy0 = top, wy1 = top + Lw;
          const grow = ramp(t, T.thrust - 0.35, T.thrust + 0.2, E.out);
          const stackTop = wy1 - 2 * Lt * grow;
          return (
            <g opacity={compare}>
              <Arrow x1={bx - 44} y1={wy0} x2={bx - 44} y2={wy1} color={WEIGHT} w={20} />
              <Arrow x1={bx + 44} y1={wy1} x2={bx + 44} y2={wy1 - Lt * grow} color={FORCE} w={22} head={32} />
              <Arrow x1={bx + 44} y1={wy1 - Lt * grow} x2={bx + 44} y2={stackTop} color={FORCE} w={22} head={32} />
              <rect x={bx + 24} y={wy0} width={40} height={Math.max(0, stackTop - wy0)} rx={8} fill="none" stroke={C.ink} strokeWidth={3.5} strokeDasharray="9 7" opacity={ramp(t, T.match - 0.2, T.match + 0.2)} />
            </g>
          );
        })()}
      </svg>
    </AbsoluteFill>
  );
};
