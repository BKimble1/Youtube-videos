// The rollout, as a railway line drawn as a timeline (ORIGINAL ILLUSTRATION). Each station is one dated, separately
// identified machine; nothing morphs from one into another. Dates and figures: FOOTAGE_SOURCES.md and
// production/CLAIM_LEDGER.md (JR West 2024 service start; JR East introduction March 2026; JR West single-arm robot
// from October 2026, up to 120 kg; JR West improved humanoid planned for November 2026; ~30% fewer personnel is a
// target). The 2026-11 machine is drawn dashed and labelled planned: on 30 Oct 2026 it is not yet in service.
import React from 'react';
import {add, clamp, easeInOut, easeOut, lerp, V} from '../dc/math';
import {keys, pr, pulse, zkeys, H, W} from '../lib/core';
import {TT} from '../lib/timeline';
import {circ, f, INK, IP, Line, poly, slab} from '../lib/draw';
import {Machine, MachineDefs, MachinePose, SchemeCtx} from '../art/Machine';
import {Cam} from '../art/World';

const tt = TT;
const Y = 620; // the timeline rail
const ST = {w24: 0, e26: 1500, w26a: 2550, today: 2930, w26b: 3300};

const Station: React.FC<{x: number; date: string; who: string; what: string; t: number; t0: number; planned?: boolean; children: React.ReactNode; accent: string}> = ({x, date, who, what, t, t0, planned, children, accent}) => {
  const o = pr(t, t0 - 0.25, t0 + 0.35, easeOut);
  const s = 0.85 + 0.15 * o;
  return (
    <g opacity={o} transform={`translate(${x} ${Y}) scale(${s.toFixed(4)}) translate(${-x} ${-Y})`}>
      {/* post and sign */}
      <Line a={{x, y: Y}} b={{x, y: Y - 90}} w={8} c={INK} />
      <rect x={x - 330} y={Y - 610} width={660} height={520} rx={34} fill={planned ? '#F7FAFC' : '#FFFFFF'} stroke={accent} strokeWidth={8} strokeDasharray={planned ? '26 16' : undefined} />
      <g>{children}</g>
      <rect x={x - 330} y={Y - 186} width={660} height={96} rx={0} fill={accent} opacity={0.12} />
      <text x={x - 300} y={Y - 136} fill={INK} style={{font: '900 40px "Nunito Variable"'}}>{who}</text>
      <text x={x - 300} y={Y - 102} fill="#3A5163" style={{font: '700 25px "Nunito Variable"'}}>{what}</text>
      {/* date on the rail */}
      <rect x={x - 120} y={Y + 34} width={240} height={62} rx={31} fill={accent} />
      <text x={x} y={Y + 76} fill="#FFFFFF" textAnchor="middle" style={{font: '900 32px "Nunito Variable"'}}>{date}</text>
      {planned && (
        <g transform={`rotate(-8 ${x + 190} ${Y - 560})`}>
          <rect x={x + 90} y={Y - 590} width={210} height={56} rx={10} fill="none" stroke={accent} strokeWidth={5} />
          <text x={x + 195} y={Y - 550} textAnchor="middle" fill={accent} style={{font: '900 32px "Nunito Variable"'}}>PLANNED</text>
        </g>
      )}
    </g>
  );
};

/** a small machine portrait inside a card (the shared rig, scaled), with a colour variant per operator */
const Portrait: React.FC<{cx: number; cy: number; k: number; pose: Partial<MachinePose>; west?: boolean; noSaw?: boolean}> = ({cx, cy, k, pose, noSaw, west}) => {
  const p: MachinePose = {
    x: -430, b1: 60, b2: 22, l2: 560,
    claw: {w: {x: 900, y: -980}, a: 60, side: -1}, saw: {w: {x: 920, y: -1050}, a: 50, side: -1},
    open: 0.5, squeeze: 0, run: 0, chain: 0, head: 0, shake: 0, ...pose,
  };
  return (
    <g transform={`translate(${cx} ${cy}) scale(${k}) translate(${-250} ${600})`}>
      <path d="M-700 0 L1300 0" stroke={INK} strokeWidth={8} />
      <SchemeCtx.Provider value={west ? '-w' : ''}>
        <Machine p={p} noSaw={noSaw} />
      </SchemeCtx.Provider>
    </g>
  );
};

export const rolloutCam = (t: number): Cam => ({
  x: keys(t, [[tt.reason, -520], [tt.jrEast - 0.6, ST.e26 - 260], [tt.jrEast + 0.2, ST.e26], [tt.jrWest + 0.2, ST.w24 + 300], [tt.y2024 + 0.5, ST.w24 + 200], [tt.rolling + 0.3, ST.w26b], [tt.reach + 0.3, ST.w26b - 50], [tt.single + 0.2, ST.w26a + 10], [tt.lifting + 0.5, ST.w26a], [tt.goal + 0.5, 1650], [tt.still, 1650]]),
  y: keys(t, [[tt.reason, 560], [tt.jrEast - 0.6, 430], [tt.jrEast + 0.2, 400], [tt.goal, 400], [tt.goal + 0.5, 820]]),
  z: zkeys(t, [[tt.reason, 1.9], [tt.jrEast - 0.6, 1.05], [tt.jrEast + 0.2, 1.0], [tt.jrWest + 0.2, 0.95], [tt.rolling + 0.3, 1.0], [tt.single + 0.2, 1.0], [tt.goal + 0.5, 0.62], [tt.still, 0.6]]),
});

const Person: React.FC<{x: number; y: number; o: number; dim: number}> = ({x, y, o, dim}) => (
  <g opacity={o * (1 - 0.72 * dim)}>
    <path d={circ({x, y: y - 120}, 30)} fill="#F2C9A8" stroke={INK} strokeWidth={5} />
    <path d={`M${x - 34} ${y - 128} C ${x - 34} ${y - 170} ${x + 34} ${y - 170} ${x + 34} ${y - 128} Z`} fill="#FFFFFF" stroke={INK} strokeWidth={5} />
    <path d={`M${x - 44} ${y} C ${x - 44} ${y - 90} ${x + 44} ${y - 90} ${x + 44} ${y} Z`} fill="#F28C28" stroke={INK} strokeWidth={5} />
  </g>
);

export const Rollout: React.FC<{t: number}> = ({t}) => {
  const cam = rolloutCam(t);
  const tr = `translate(${W / 2} ${H / 2}) scale(${cam.z.toFixed(5)}) translate(${f(-cam.x)} ${f(-cam.y)})`;
  const draw = pr(t, tt.reason - 0.2, tt.reason + 1.6);
  const railX0 = -900;
  const railX1 = 4200;
  const reach = pr(t, tt.reach - 0.3, tt.reach + 0.9);
  const lift = pr(t, tt.lifting - 0.3, tt.lifting + 0.9);
  const goalO = pr(t, tt.goal - 0.1, tt.goal + 0.5);
  const fewer = pr(t, tt.fewer, tt.fewer + 0.8);
  // a small maintenance train runs along the timeline to "today"
  const trainX = lerp(-700, ST.today - 130, pr(t, tt.reason - 0.3, tt.goal, (x) => 1 - Math.pow(1 - x, 1.6)));
  return (
    <g>
      <defs>
        <MachineDefs />
        <linearGradient id="r-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EAF4F8" />
          <stop offset="1" stopColor="#D6E6EE" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#r-bg)" />
      <g transform={tr}>
        {/* the rail */}
        <path d={`M${railX0} ${Y + 6} L${railX1} ${Y + 6}`} stroke="#5B6670" strokeWidth={14} strokeLinecap="round" />
        {Array.from({length: 120}, (_, i) => railX0 + i * 46).filter((x) => x < railX1).map((x) => <rect key={x} x={x} y={Y + 12} width={20} height={16} fill="#8A735E" />)}
        {/* gap: the axis is not to scale */}
        <g opacity={draw}>
          <path d={`M${ST.w24 + 650} ${Y - 18} l 24 48 M${ST.w24 + 690} ${Y - 18} l 24 48`} stroke="#EAF4F8" strokeWidth={18} />
          <path d={`M${ST.w24 + 650} ${Y - 18} l 24 48 M${ST.w24 + 690} ${Y - 18} l 24 48`} stroke={INK} strokeWidth={5} />
        </g>
        {/* today */}
        <g opacity={pr(t, tt.rolling, tt.rolling + 0.6)}>
          <Line a={{x: ST.today, y: Y - 40}} b={{x: ST.today, y: Y + 120}} w={6} c="#EF3340" dash="12 10" />
          <text x={ST.today} y={Y + 160} fill="#EF3340" textAnchor="middle" style={{font: '900 30px "Nunito Variable"'}}>TODAY · 30 OCT 2026</text>
        </g>
        <Station x={ST.w24} date="JUL 2024" who="JR WEST" what="a related humanoid machine enters service" t={t} t0={tt.jrWest + 0.2} accent="#2F6FB3">
          <Portrait cx={ST.w24} cy={Y - 300} k={0.24} pose={{}} west />
        </Station>
        <Station x={ST.e26} date="MAR 2026" who="JR EAST" what="introduces this type of machine" t={t} t0={tt.jrEast} accent="#2E8B57">
          <Portrait cx={ST.e26} cy={Y - 300} k={0.24} pose={{}} />
        </Station>
        <Station x={ST.w26a} date="OCT 2026" who="JR WEST" what="single-arm robot · lifts up to 120 kg" t={t} t0={tt.single + 0.1} accent="#2F6FB3">
          <g transform={`translate(${ST.w26a} ${Y - 300}) scale(0.24) translate(-250 600)`}>
            <path d="M-700 0 L1300 0" stroke={INK} strokeWidth={8} />
            <SchemeCtx.Provider value="-w"><Machine p={{x: -430, b1: lerp(48, 58, lift), b2: lerp(10, 18, lift), l2: 600, claw: {w: {x: lerp(820, 860, lift), y: lerp(-720, -900, lift)}, a: 80, side: -1}, saw: {w: {x: 0, y: 0}, a: 0, side: -1}, open: 0.45, squeeze: 0, run: 0, chain: 0, head: 0, shake: 0}} noSaw /></SchemeCtx.Provider>
            {/* the heavy component in the claw */}
            <rect x={lerp(840, 880, lift) - 20} y={lerp(-640, -820, lift)} width={110} height={70} rx={8} fill="url(#m-steel)" stroke={INK} strokeWidth={8} />
          </g>
        </Station>
        <Station x={ST.w26b} date="NOV 2026" who="JR WEST" what="improved humanoid · longer reach" t={t} t0={tt.rolling + 0.3} planned accent="#2F6FB3">
          <g opacity={0.85}>
            <Portrait cx={ST.w26b} cy={Y - 300} k={0.24} pose={{l2: lerp(560, 760, reach), b2: lerp(22, 30, reach)}} west />
          </g>
          {/* reach envelope */}
          <path d={`M${ST.w26b - 230} ${Y - 260} A 300 300 0 0 1 ${ST.w26b + 20} ${Y - 560}`} fill="none" stroke="#2F6FB3" strokeWidth={6} strokeDasharray="14 10" opacity={reach} />
        </Station>
        {/* the maintenance train */}
        <g transform={`translate(${f(trainX)} ${Y - 4})`}>
          <rect x={-120} y={-70} width={240} height={64} rx={16} fill="#F0B429" stroke={INK} strokeWidth={6} />
          <rect x={-96} y={-58} width={60} height={30} rx={6} fill="#9FD3E8" stroke={INK} strokeWidth={4} />
          {[-80, 80].map((x) => <circle key={x} cx={x} cy={0} r={16} fill="#2A2F35" stroke={INK} strokeWidth={4} />)}
        </g>
        {/* the goal: fewer people per job (a target) */}
        <g opacity={goalO}>
          {Array.from({length: 10}, (_, i) => (
            <Person key={i} x={975 + i * 150} y={Y + 470} o={pr(t, tt.goal + i * 0.05, tt.goal + 0.3 + i * 0.05)} dim={i >= 7 ? fewer : 0} />
          ))}
          <text x={1650} y={Y + 580} textAnchor="middle" fill={INK} style={{font: '900 52px "Nunito Variable"'}}>Goal: about 30% fewer people for these jobs</text>
          <text x={1650} y={Y + 640} textAnchor="middle" fill="#3A5163" style={{font: '700 34px "Nunito Variable"'}}>JR West's stated target, not a measured result</text>
        </g>
      </g>
    </g>
  );
};

export {clamp, add, poly, slab, IP, pulse};
