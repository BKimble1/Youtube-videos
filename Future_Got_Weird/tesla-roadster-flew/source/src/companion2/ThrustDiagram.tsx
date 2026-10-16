// Back to the car, seen from behind (RoadsterRear): gas goes out one way, the car is pushed the other way; an
// off-centre pair (one side up, the other down) makes it roll; the opposite pair stops the roll; both firing down
// push it up and slow its fall. Nozzle positions are conceptual (Tesla showed none). Colour key as everywhere:
// blue = gas out, saffron = push on the car. The roll goes from upside down to upright, as in the demo.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {RoadsterRear, REAR} from './RoadsterRear';
import {ArcArrow, Arrow, cue, E, FLOW, FLOW_LIGHT, FORCE, Label, lerp, ramp, rnd, Tag, track, useT, WEIGHT} from './kit';

const T = {
  gas: cue('Gas', 'P13'), opposite: cue('opposite', 'P13', 0), push: cue('Push', 'P13'), rolls: cue('rolls', 'P13'),
  fire1: cue('Fire', 'P13', 0), stop: cue('stop', 'P13'), fire2: cue('Fire', 'P13', 1), pushedUp: cue('pushed', 'P13', 1),
  slowing: cue('slowing', 'P13'), fall: cue('fall', 'P13', 0, true),
};
const K = 1.08; // rear-view scale
const c1s = T.push + 0.25, c1e = c1s + 1.6, c2s = T.fire1 + 0.15, c2e = c2s + 1.6;
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
const d0 = T.gas + 0.15, d1 = T.opposite + 0.25; // horizontal demo firing
const f0 = T.fire2 + 0.2, f1 = T.fall + 0.3; // both firing down
const rot = (x: number, y: number, deg: number) => {
  const r = (deg * Math.PI) / 180;
  return {x: x * Math.cos(r) - y * Math.sin(r), y: x * Math.sin(r) + y * Math.cos(r)};
};

export const ThrustDiagram: React.FC<{start: number; end: number}> = ({start, end}) => {
  const t = useT(start);
  const roll = rollAt(t);
  const inA = ramp(t, start, start + 0.5, E.out);
  // horizontal drift from the first demo, eased back to centre by a slow camera re-centre
  const xs = 960 + track(t, [[d0, 0], [d1 + 0.4, 70, E.inOut], [c1s, 70], [c1s + 1.2, 0, E.inOut]]);
  // falling speed (px/s on screen as streaks), slowed by the downward firing
  const fallV = 150 * (1 - ramp(t, f0, T.slowing + 0.6, E.out) * 0.75);
  const cy = 520 + track(t, [[start, -10], [end, 20]]);
  const ctr = {x: xs, y: cy};
  const nozzle = (side: 1 | -1) => {
    const p = rot(side * 300 * K, -10 * K, roll);
    return {x: ctr.x + p.x, y: ctr.y + p.y};
  };
  // which nozzles fire, and their gas direction in car-local coordinates
  type Fire = {side: 1 | -1; dir: [number, number]; o: number};
  const fires: Fire[] = [];
  const on = (a: number, b: number) => ramp(t, a, a + 0.12) * (1 - ramp(t, b - 0.12, b));
  if (t > d0 - 0.1 && t < d1 + 0.1) fires.push({side: 1, dir: [1, 0], o: on(d0, d1)});
  if (t > c1s - 0.1 && t < c1e + 0.1) { fires.push({side: 1, dir: [0, -1], o: on(c1s, c1e)}); fires.push({side: -1, dir: [0, 1], o: on(c1s, c1e)}); }
  if (t > c2s - 0.1 && t < c2e + 0.1) { fires.push({side: 1, dir: [0, 1], o: on(c2s, c2e)}); fires.push({side: -1, dir: [0, -1], o: on(c2s, c2e)}); }
  if (t > f0 - 0.1 && t < f1 + 0.1) { fires.push({side: 1, dir: [0, 1], o: on(f0, f1)}); fires.push({side: -1, dir: [0, 1], o: on(f0, f1)}); }
  const streaks = Array.from({length: 26}, (_, i) => {
    const y0 = rnd(i) * 1300;
    const y = ((y0 - (t - start) * fallV * 2.2) % 1300 + 1300) % 1300 - 110;
    return {x: 120 + rnd(i + 40) * 1680, y, len: 40 + rnd(i + 9) * 70};
  });
  // clouds rise past the falling car (one screen height every few seconds), slowing with the fall
  const fallDist = (tt: number) => { // integral of the fall speed (px), for the cloud positions
    const a = Math.min(tt, f0) - start; let d = Math.max(0, a) * 150;
    if (tt > f0) { const n = 12; for (let i = 0; i < n; i++) { const u = f0 + ((tt - f0) * (i + 0.5)) / n; d += (150 * (1 - ramp(u, f0, T.slowing + 0.6, E.out) * 0.75) * (tt - f0)) / n; } }
    return d;
  };
  const rise = fallDist(t) * 1.6;
  const clouds = Array.from({length: 7}, (_, i) => ({x: 140 + rnd(i + 300) * 1640, y: ((rnd(i + 200) * 1500 - rise) % 1500 + 1500) % 1500 - 210, r: 60 + rnd(i + 5) * 70}));
  const rollArc = ramp(t, c1s + 0.3, c1s + 0.7) * (1 - ramp(t, c2e - 0.3, c2e + 0.1));
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#9FC3E8 0%, #C9DDF0 60%, #E6EEF5 100%)'}}>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        {clouds.map((c, i) => <ellipse key={`c${i}`} cx={c.x} cy={c.y} rx={c.r * 2.2} ry={c.r} fill="#FFFFFF" opacity={0.55} />)}
        {streaks.map((s, i) => <line key={i} x1={s.x} y1={s.y} x2={s.x} y2={s.y + s.len} stroke="#6E93C4" strokeWidth={4} strokeLinecap="round" opacity={0.45 * Math.min(1, fallV / 60)} />)}
        <g opacity={inA}>
          <RoadsterRear x={ctr.x} y={ctr.y - REAR.cy * K} k={K} roll={roll} id="td" />
          {/* conceptual nozzles at the two sides (attached to the car) */}
          {([1, -1] as const).map((s) => {
            const n = nozzle(s);
            return <rect key={s} x={n.x - 13} y={n.y - 20} width={26} height={40} rx={6} fill="#3A4348" stroke={C.ink} strokeWidth={4} transform={`rotate(${roll} ${n.x} ${n.y})`} />;
          })}
        </g>
        {fires.map((f, i) => {
          const n = nozzle(f.side);
          const g = rot(f.dir[0], f.dir[1], roll);
          const plume = Array.from({length: 7}, (_, j) => {
            const u = ((t * 3 + j / 7) % 1);
            return <circle key={j} cx={n.x + g.x * (30 + u * 190)} cy={n.y + g.y * (30 + u * 190)} r={10 + u * 28} fill={FLOW_LIGHT} opacity={(1 - u) * 0.7 * f.o} />;
          });
          return (
            <g key={i}>
              {plume}
              <Arrow x1={n.x + g.x * 34} y1={n.y + g.y * 34} x2={n.x + g.x * 210} y2={n.y + g.y * 210} color={FLOW} w={18} opacity={f.o} />
              <Arrow x1={n.x - g.x * 20} y1={n.y - g.y * 20} x2={n.x - g.x * 150} y2={n.y - g.y * 150} color={FORCE} w={22} opacity={f.o} />
            </g>
          );
        })}
        <ArcArrow cx={ctr.x} cy={ctr.y} r={400} a0={-120} a1={-60} color={C.ink} w={14} opacity={rollArc} />
        {/* falling indicator */}
        <g opacity={ramp(t, T.fire2 - 0.6, T.fire2 - 0.2) * (1 - ramp(t, end - 0.4, end))}>
          <Arrow x1={1700} y1={420} x2={1700} y2={420 + fallV * 2.2} color={WEIGHT} w={16} />
        </g>
      </svg>
      <Tag kind="illustration" text="Simplified: nozzle positions are conceptual" />
      {/* key */}
      <div style={{position: 'absolute', right: 48, top: 36, opacity: ramp(t, T.gas, T.gas + 0.4), fontFamily: F.body, fontWeight: 800, fontSize: 28, color: C.ink, background: C.cream, border: `3px solid ${C.ink}`, borderRadius: 18, padding: '10px 18px', lineHeight: 1.5}}>
        <div><span style={{display: 'inline-block', width: 40, height: 14, background: FLOW, border: `2px solid ${C.ink}`, borderRadius: 7, marginRight: 12}} />gas out</div>
        <div><span style={{display: 'inline-block', width: 40, height: 14, background: FORCE, border: `2px solid ${C.ink}`, borderRadius: 7, marginRight: 12}} />push on the car</div>
      </div>
      <Label x={960} y={985} text="One side pushed up, the other down: it rolls" size={38} opacity={ramp(t, T.rolls - 0.6, T.rolls - 0.2) * (1 - ramp(t, T.fire1 - 0.3, T.fire1))} />
      <Label x={960} y={985} text="The opposite pair: the roll stops" size={38} opacity={ramp(t, T.stop - 0.4, T.stop) * (1 - ramp(t, T.fire2 - 0.3, T.fire2))} />
      <Label x={960} y={985} text="Both push up: no turning, the fall slows" size={38} opacity={ramp(t, T.pushedUp - 0.3, T.pushedUp + 0.1) * (1 - ramp(t, end - 0.3, end))} />
      <Label x={1700} y={370} text="falling" size={32} opacity={ramp(t, T.fire2 - 0.6, T.fire2 - 0.2) * (1 - ramp(t, end - 0.4, end))} />
    </AbsoluteFill>
  );
};
