// The rollout (ORIGINAL ILLUSTRATION). V2: instead of a small moving timeline, the machines themselves stand at a
// large, readable scale on one depot track, each with its own sign; the camera travels along the line in the order
// the narration names them. Chronology is carried by a fixed date rail at the bottom of the frame (JUL 2024 · MAR 2026
// · OCT 2026 · TODAY · NOV 2026), so the narration's order never implies a false sequence. Every machine is a separate
// object with its own sign; nothing morphs. JR West's machines are blue; the November 2026 machine is drawn faded and
// stamped PLANNED (on 30 Oct 2026 it is not yet in service). Dates and figures: production/CLAIM_LEDGER.md.
import React from 'react';
import {add, clamp, easeInOut, easeOut, lerp, mul, V} from '../dc/math';
import {H, keys, pr, pulse, W, zkeys} from '../lib/core';
import {TT} from '../lib/timeline';
import {circ, f, INK, IP, Line, poly, slab} from '../lib/draw';
import {Boom, Claw, ik2, Machine, MachineDefs, machineGeo, MachinePose, SchemeCtx, Truck} from '../art/Machine';
import {Backdrop, Cam, Layer, Track, WorldDefs} from '../art/World';

const tt = TT;
const X = {east: 0, w24: 3300, wNov: 6600, wOct: 9900};
const BLUE = '#2F6FB3';
const GREEN = '#2E8B57';

/** a working machine is never frozen: its arms move and its claw opens and closes slowly */
const live = (p: MachinePose, t: number, ph: number): MachinePose => ({
  ...p,
  claw: {...p.claw, w: {x: p.claw.w.x + 26 * Math.sin(t * 0.9 + ph), y: p.claw.w.y + 30 * Math.sin(t * 0.7 + ph)}},
  saw: {...p.saw, w: {x: p.saw.w.x + 20 * Math.sin(t * 0.6 + ph + 1), y: p.saw.w.y - 24 * Math.sin(t * 0.8 + ph)}},
  open: 0.5 + 0.35 * Math.sin(t * 1.1 + ph),
  head: 5 * Math.sin(t * 0.5 + ph),
});

const basePose = (x0: number, over: Partial<MachinePose> = {}): MachinePose => ({
  x: x0 - 430, b1: 62, b2: 28, l2: 630,
  claw: {w: {x: x0 + 840, y: -1060}, a: 60, side: -1}, saw: {w: {x: x0 + 860, y: -1150}, a: 40, side: -1},
  open: 0.55, squeeze: 0, run: 0, chain: 0, head: 0, shake: 0, ...over,
});

/** a depot sign over each machine (world units; ~60 px type at the travelling zoom) */
const Sign: React.FC<{x: number; who: string; line: string; date: string; accent: string; o: number; planned?: boolean}> = ({x, who, line, date, accent, o, planned}) => (
  <g opacity={o}>
    <Line a={{x: x - 520, y: -40}} b={{x: x - 520, y: -1220}} w={14} c="#4A5560" />
    <rect x={x - 900} y={-1620} width={1560} height={420} rx={40} fill="#FFFFFF" stroke={accent} strokeWidth={14} strokeDasharray={planned ? '60 34' : undefined} />
    <rect x={x - 900} y={-1620} width={420} height={420} rx={40} fill={accent} />
    <text x={x - 690} y={-1380} textAnchor="middle" fill="#FFFFFF" style={{font: '900 110px "Nunito Variable"'}}>{date.split(' ')[0]}</text>
    <text x={x - 690} y={-1270} textAnchor="middle" fill="#FFFFFF" style={{font: '800 80px "Nunito Variable"'}}>{date.split(' ')[1]}</text>
    <text x={x - 440} y={-1440} fill={INK} style={{font: '900 120px "Nunito Variable"'}}>{who}</text>
    <text x={x - 440} y={-1310} fill="#3A5163" style={{font: '800 70px "Nunito Variable"'}}>{line}</text>
    {planned && (
      <g transform={`rotate(-8 ${x + 1010} ${-1380})`}>
        <rect x={x + 750} y={-1450} width={520} height={140} rx={20} fill="#FFFFFF" stroke={accent} strokeWidth={12} />
        <text x={x + 1010} y={-1350} textAnchor="middle" fill={accent} style={{font: '900 92px "Nunito Variable"'}}>PLANNED</text>
      </g>
    )}
  </g>
);

/** JR West's separate single-arm robot: vehicle, boom and ONE heavy arm (no humanoid body), lifting a component */
const SingleArm: React.FC<{x0: number; lift: number}> = ({x0, lift}) => {
  const p = basePose(x0, {b1: 56, b2: lerp(16, 24, lift), l2: 600});
  const g = machineGeo(p);
  const S = add(g.M, {x: 10, y: -40});
  const target = {x: x0 + lerp(1060, 1010, lift), y: lerp(-620, -900, lift)};
  const {E, W: Wr} = ik2(S, target, 260, 240, -1);
  const a = 88;
  const grip = add(Wr, mul({x: Math.cos((a * Math.PI) / 180), y: Math.sin((a * Math.PI) / 180)}, 93));
  return (
    <SchemeCtx.Provider value="-w">
      <g>
        <Truck x={p.x} operator />
        <Boom g={g} />
        <IP d={slab(S, E, 40, 34)} fill="url(#m-body)" ink={4} />
        <IP d={slab(E, Wr, 34, 28)} fill="url(#m-body)" ink={4} />
        <path d={circ(E, 38)} fill="url(#m-joint)" stroke={INK} strokeWidth={4} />
        <path d={circ(S, 50)} fill="url(#m-joint)" stroke={INK} strokeWidth={4} />
        <path d={circ(S, 18)} fill="#9AA7B2" stroke={INK} strokeWidth={2} />
        {/* the heavy component held in the claw */}
        <IP d={poly([add(grip, {x: -120, y: -40}), add(grip, {x: 120, y: -40}), add(grip, {x: 120, y: 90}), add(grip, {x: -120, y: 90})])} fill="url(#m-steel)" ink={5} />
        <IP d={poly([add(grip, {x: -100, y: -10}), add(grip, {x: 100, y: -10}), add(grip, {x: 100, y: 10}), add(grip, {x: -100, y: 10})])} fill="#6E7B86" ink={0} />
        <path d={circ(add(grip, {x: -80, y: 50}), 10)} fill="#C9D2DA" stroke={INK} strokeWidth={3} />
        <path d={circ(add(grip, {x: 80, y: 50}), 10)} fill="#C9D2DA" stroke={INK} strokeWidth={3} />
        <g transform={`translate(${f(Wr.x)} ${f(Wr.y)}) scale(1.5) translate(${f(-Wr.x)} ${f(-Wr.y)})`}>
          <Claw F={{o: Wr, a}} open={0.4} wrap={0.6} wrapR={24} />
        </g>
      </g>
    </SchemeCtx.Provider>
  );
};

export const rolloutCam = (t: number): Cam => ({
  // each stop: arrive, then a slow push toward the machine while it is described; then travel to the next
  x: keys(t, [[tt.reason, X.east + 650], [tt.jrEast - 0.2, X.east + 260], [tt.jrWest + 0.1, X.east + 420], [tt.jrWest + 1.5, X.w24 + 260], [tt.rolling + 0.1, X.w24 + 420], [tt.rolling + 1.5, X.wNov + 300], [tt.single, X.wNov + 460], [tt.single + 1.4, X.wOct + 260], [tt.goal, X.wOct + 420], [tt.goal + 1.0, X.wOct + 340], [tt.still, X.wOct + 420]]),
  y: keys(t, [[tt.reason, -1050], [tt.jrEast - 0.2, -660], [tt.goal, -660], [tt.goal + 1.0, -760], [tt.still, -780]]),
  z: zkeys(t, [[tt.reason, 1.15], [tt.jrEast - 0.2, 0.5], [tt.jrWest + 0.1, 0.56], [tt.jrWest + 0.8, 0.48], [tt.jrWest + 1.5, 0.5], [tt.rolling + 0.1, 0.56], [tt.rolling + 0.8, 0.48], [tt.rolling + 1.5, 0.5], [tt.single, 0.56], [tt.single + 0.7, 0.48], [tt.single + 1.4, 0.5], [tt.goal, 0.55], [tt.goal + 1.0, 0.47], [tt.still, 0.5]]),
})

const Person: React.FC<{x: number; y: number; s: number; dim: number}> = ({x, y, s, dim}) => (
  <g opacity={1 - 0.75 * dim} transform={`translate(${x} ${y}) scale(${s})`}>
    <path d={circ({x: 0, y: -120}, 30)} fill="#F2C9A8" stroke={INK} strokeWidth={5} />
    <path d="M-34 -128 C -34 -170 34 -170 34 -128 Z" fill="#FFFFFF" stroke={INK} strokeWidth={5} />
    <path d="M-44 0 C -44 -90 44 -90 44 0 Z" fill="#F28C28" stroke={INK} strokeWidth={5} />
  </g>
);

/** the date rail: chronology stays fixed at the bottom of the frame whatever the narration's order */
const DATES = [
  {k: 'w24', label: 'JUL 2024', sub: 'JR West', x: 300, c: BLUE},
  {k: 'east', label: 'MAR 2026', sub: 'JR East', x: 760, c: GREEN},
  {k: 'wOct', label: 'OCT 2026', sub: 'JR West', x: 1180, c: BLUE},
  {k: 'wNov', label: 'NOV 2026', sub: 'JR West · planned', x: 1620, c: BLUE},
];
const DateRail: React.FC<{t: number; cur: string; o: number}> = ({cur, o}) => (
  <g opacity={o}>
    <rect x={180} y={952} width={1560} height={110} rx={24} fill="#0E1A24" opacity={0.72} />
    <Line a={{x: 240, y: 990}} b={{x: 1690, y: 990}} w={6} c="#C9D6E0" />
    {/* the axis is not to scale: a break between 2024 and 2026 */}
    <path d="M520 972 l 16 36 M540 972 l 16 36" stroke="#0E1A24" strokeWidth={14} />
    <path d="M520 972 l 16 36 M540 972 l 16 36" stroke="#C9D6E0" strokeWidth={4} />
    {/* today: between October and the planned November machine */}
    <Line a={{x: 1400, y: 966}} b={{x: 1400, y: 1014}} w={5} c="#FF6B6B" dash="8 6" />
    <text x={1400} y={1050} textAnchor="middle" fill="#FF8A8A" style={{font: '900 24px "Nunito Variable"'}}>TODAY · 30 OCT</text>
    {DATES.map((d) => {
      const on = d.k === cur;
      return (
        <g key={d.k}>
          <circle cx={d.x} cy={990} r={on ? 16 : 10} fill={on ? d.c : '#C9D6E0'} stroke="#0E1A24" strokeWidth={3} />
          <text x={d.x} y={978 - 8} textAnchor="middle" fill={on ? '#FFFFFF' : '#9FB2C2'} style={{font: `900 ${on ? 34 : 28}px "Nunito Variable"`}}>{d.label}</text>
          <text x={d.x} y={1040} textAnchor="middle" fill={on ? '#FFFFFF' : '#8EA3B5'} style={{font: `800 ${on ? 24 : 21}px "Nunito Variable"`}}>{d.sub}</text>
        </g>
      );
    })}
  </g>
);

export const Rollout: React.FC<{t: number}> = ({t}) => {
  const cam = rolloutCam(t);
  const reach = pr(t, tt.reach - 0.4, tt.reach + 0.9);
  const lift = pr(t, tt.lifting - 0.2, tt.lifting + 1.2);
  const goalO = pr(t, tt.goal + 0.3, tt.goal + 0.9);
  const fewer = pr(t, tt.fewer, tt.fewer + 0.8);
  const cur = t < tt.jrWest + 0.7 ? 'east' : t < tt.rolling + 0.7 ? 'w24' : t < tt.single + 0.7 ? 'wNov' : 'wOct';
  const sign = (t0: number) => pr(t, t0 - 0.3, t0 + 0.3);
  // the JR East machine at work (the story's machine), the 2024 JR West machine, the planned machine with its reach
  const nov = basePose(X.wNov, {l2: lerp(630, 840, reach), b2: lerp(28, 33, reach), claw: {w: {x: X.wNov + lerp(840, 1040, reach), y: lerp(-1060, -1200, reach)}, a: 40, side: -1}, saw: {w: {x: X.wNov + lerp(860, 1060, reach), y: lerp(-1150, -1290, reach)}, a: 30, side: -1}});
  const novG = machineGeo(nov);
  return (
    <g>
      <defs>
        <WorldDefs />
        <MachineDefs />
      </defs>
      <Backdrop cam={cam} t={t} />
      <Layer cam={cam}>
        <Track x0={-3000} x1={14000} />
        <Machine p={live(basePose(X.east), t, 0)} cabinLight={0.6} />
        <SchemeCtx.Provider value="-w">
          <Machine p={live(basePose(X.w24), t, 1.7)} />
          <g opacity={0.62}>
            <Machine p={nov} />
          </g>
        </SchemeCtx.Provider>
        {/* longer reach: the envelope from the boom foot */}
        <g opacity={reach}>
          <path d={`M ${f(novG.B0.x + 300)} ${f(novG.B0.y)} A 1300 1300 0 0 0 ${f(novG.B0.x + 900)} ${f(novG.B0.y - 1240)}`} fill="none" stroke={BLUE} strokeWidth={16} strokeDasharray="44 30" />
          <text x={novG.B0.x + 1000} y={novG.B0.y - 700} fill={BLUE} stroke="#FFFFFF" strokeWidth={14} paintOrder="stroke" style={{font: '900 90px "Nunito Variable"'}}>longer reach</text>
        </g>
        <SingleArm x0={X.wOct} lift={lift} />
        <g opacity={pr(t, tt.lifting - 0.2, tt.lifting + 0.5)}>
          <text x={X.wOct + 1250} y={-640} fill={BLUE} stroke="#FFFFFF" strokeWidth={14} paintOrder="stroke" style={{font: '900 110px "Nunito Variable"'}}>up to 120 kg</text>
        </g>
        <Sign x={X.east} who="JR EAST" line="introduced this type of machine" date="MAR 2026" accent={GREEN} o={sign(tt.jrEast)} />
        <Sign x={X.w24} who="JR WEST" line="related humanoid machine" date="JUL 2024" accent={BLUE} o={sign(tt.jrWest + 0.6)} />
        <Sign x={X.wNov} who="JR WEST" line="improved humanoid model" date="NOV 2026" accent={BLUE} o={sign(tt.rolling + 0.7)} planned />
        <Sign x={X.wOct} who="JR WEST" line="separate single-arm robot" date="OCT 2026" accent={BLUE} o={sign(tt.single + 0.7)} />
      </Layer>
      <DateRail t={t} cur={cur} o={pr(t, tt.jrEast - 0.4, tt.jrEast + 0.2) * (1 - goalO)} />
      {/* the goal: a target, said so on screen */}
      {goalO > 0.001 && (
        <g opacity={goalO}>
          <rect x={0} y={700} width={W} height={380} fill="#0E1A24" opacity={0.78} />
          {Array.from({length: 10}, (_, i) => (
            <Person key={i} x={420 + i * 120} y={890} s={0.62} dim={i >= 7 ? fewer : 0} />
          ))}
          <text x={W / 2} y={975} textAnchor="middle" fill="#FFFFFF" style={{font: '900 56px "Nunito Variable"'}}>Goal: about 30% fewer people for these jobs</text>
          <text x={W / 2} y={1030} textAnchor="middle" fill="#C9D6E0" style={{font: '800 34px "Nunito Variable"'}}>JR West's stated target, not a measured result</text>
        </g>
      )}
    </g>
  );
};

export {clamp, easeInOut, easeOut, pulse, H, V};
