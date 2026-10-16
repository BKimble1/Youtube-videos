// Conceptual cutaway of a cold-gas thruster as Tesla describes it: compressed air in a carbon-wrapped tank, a valve,
// a nozzle. Layout, sizes and positions are not Tesla's (none were shown): labelled as conceptual.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {Arrow, cue, E, FLOW, FLOW_LIGHT, Label, lerp, ramp, rnd, Tag, useT} from './kit';

const T = {
  thrusters: cue('thrusters', 'P11'), compressed: cue('Compressed', 'P11'), spacex: cue('SpaceX', 'P11'),
  fuel: cue('fuel', 'P11'), flame: cue('flame', 'P11'),
};

const Crossed: React.FC<{x: number; y: number; o: number; children: React.ReactNode}> = ({x, y, o, children}) => (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    <circle r={78} fill={C.cream} stroke={C.ink} strokeWidth={5} />
    {children}
    <line x1={-56} y1={-56} x2={56} y2={56} stroke={C.coral} strokeWidth={14} strokeLinecap="round" />
  </g>
);

export const TankDiagram: React.FC<{start: number}> = ({start}) => {
  const t = useT(start);
  const inP = ramp(t, start, start + 0.45, E.out);
  const open = ramp(t, T.compressed - 0.1, T.compressed + 0.3);
  const fuel = ramp(t, T.fuel - 0.2, T.fuel + 0.15, E.back);
  const flame = ramp(t, T.flame - 0.2, T.flame + 0.15, E.back);
  // gas puffs leaving the nozzle (only after the valve opens)
  const puffs = Array.from({length: 26}, (_, i) => {
    const born = T.compressed + 0.1 + i * 0.12;
    const age = t - born;
    if (age < 0 || age > 1.6) return null;
    const u = age / 1.6;
    const x = 1395 + u * 420 + rnd(i) * 30;
    const y = 520 + (rnd(i + 7) - 0.5) * 140 * u;
    return <circle key={i} cx={x} cy={y} r={10 + 26 * u} fill={FLOW_LIGHT} opacity={(1 - u) * 0.85} stroke="#9DB8E8" strokeWidth={2} />;
  });
  const drift = (t - start) * 4;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible', transform: `translateX(${-drift}px) scale(${0.96 + 0.04 * inP})`, transformOrigin: '50% 50%'}}>
        <defs>
          <pattern id="grid2" width={60} height={60} patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={C.paperLine} strokeWidth={2} />
          </pattern>
          <pattern id="weave" width={24} height={24} patternUnits="userSpaceOnUse">
            <rect width={24} height={24} fill="#2E3438" />
            <path d="M 0 12 L 12 0 M 12 24 L 24 12" stroke="#4A5257" strokeWidth={5} />
          </pattern>
        </defs>
        <rect x={-100} y={-100} width={2200} height={1300} fill="url(#grid2)" />
        {/* tank */}
        <g opacity={inP}>
          <rect x={250} y={380} width={620} height={280} rx={140} fill="url(#weave)" stroke={C.ink} strokeWidth={6} />
          <rect x={300} y={404} width={520} height={34} rx={17} fill="rgba(255,255,255,0.12)" />
          {/* compressed air inside: dense particles */}
          {Array.from({length: 46}, (_, i) => (
            <circle key={i} cx={330 + rnd(i) * 460 + Math.sin(t * 3 + i) * 5} cy={430 + rnd(i + 50) * 180 + Math.cos(t * 2.6 + i) * 5} r={8} fill={FLOW_LIGHT} opacity={0.9 - 0.3 * open * rnd(i + 3)} />
          ))}
          {/* pipe, valve, nozzle */}
          <rect x={870} y={505} width={230} height={30} fill="#9AA6AD" stroke={C.ink} strokeWidth={5} />
          <rect x={1100} y={460} width={110} height={120} rx={14} fill={C.blue} stroke={C.ink} strokeWidth={6} />
          <g transform={`translate(1155 460) rotate(${lerp(-40, 40, open)})`}>
            <rect x={-8} y={-90} width={16} height={90} rx={6} fill={C.ink} />
            <circle cx={0} cy={-92} r={14} fill={C.coral} stroke={C.ink} strokeWidth={4} />
          </g>
          <rect x={1210} y={505} width={110} height={30} fill="#9AA6AD" stroke={C.ink} strokeWidth={5} />
          <path d="M 1320 500 L 1400 470 L 1400 570 L 1320 540 Z" fill="#6F7B82" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        </g>
        {puffs}
        {open > 0 && <Arrow x1={1420} y1={520} x2={1700} y2={520} color={FLOW} w={22} opacity={open} />}
        {/* no fuel, no flame */}
        <Crossed x={700} y={850} o={fuel}>
          <rect x={-30} y={-40} width={60} height={80} rx={10} fill={C.coral} stroke={C.ink} strokeWidth={5} />
          <rect x={-12} y={-56} width={24} height={18} fill={C.ink} />
        </Crossed>
        <Crossed x={1220} y={850} o={flame}>
          <path d="M 0 -48 C 28 -18 34 8 22 30 C 12 46 -12 46 -22 30 C -34 8 -20 -14 0 -48 Z" fill="#F29A3A" stroke={C.ink} strokeWidth={5} />
          <path d="M 0 -6 C 10 8 12 18 6 28 C 0 34 -8 30 -8 22 C -8 12 -4 4 0 -6 Z" fill={C.saffron} />
        </Crossed>
      </svg>
      <Tag kind="illustration" text="Conceptual: Tesla's description, simplified" />
      <Label x={560} y={300} text="compressed air · carbon-wrapped tank" size={38} opacity={ramp(t, T.thrusters, T.thrusters + 0.3)} />
      <Label x={1155} y={300} text="valve" size={38} opacity={ramp(t, T.compressed - 0.2, T.compressed + 0.2)} />
      <Label x={1560} y={410} text="cold gas out" size={38} color={C.ink} bg={FLOW_LIGHT} opacity={ramp(t, T.compressed + 0.3, T.compressed + 0.6)} />
      <Label x={960} y={150} text="Developed with help from SpaceX (Tesla)" size={38} bg={C.saffronLight} opacity={ramp(t, T.spacex - 0.4, T.spacex)} />
      <Label x={700} y={975} text="no fuel" size={38} opacity={fuel} />
      <Label x={1220} y={975} text="no flame" size={38} opacity={flame} />
    </AbsoluteFill>
  );
};
