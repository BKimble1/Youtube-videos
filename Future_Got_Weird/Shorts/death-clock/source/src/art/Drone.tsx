// The emergency medical drone (fictional): white body, signal-blue stripe, a cargo pod with a
// heart-pulse mark (no real-world emblem), four arms with edge-on rotor discs, skids and a beacon.
// Drawn through a local->world mapping so pitch never moves the key light.
import React from 'react';
import {PAL} from '../lib/color';
import {add, fmt, mul, P, rot, V} from '../lib/math';
import {Capsule, Glow, Lin, SoftShadow, Sphere} from '../lib/shade';

export type DronePose = {x: number; y: number; s: number; pitch: number; spin: number; beacon: number};

export const Drone: React.FC<{id: string; p: DronePose; shadowY?: number}> = ({id, p, shadowY}) => {
  const W = (x: number, y: number): V => add({x: p.x, y: p.y}, rot(mul({x, y}, p.s), p.pitch));
  const white = '#EEF2F6';
  const farC = '#B9C3CE';
  const rotor = (k: string, c: V, far: boolean) => {
    const ph = p.spin + (far ? 1.3 : 0);
    const bx = Math.cos(ph) * 86 * p.s;
    return (
      <g key={k}>
        <defs>
          <radialGradient id={`${id}-${k}`}>
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.35} />
            <stop offset="0.8" stopColor="#DDE6EE" stopOpacity={0.22} />
            <stop offset="1" stopColor="#DDE6EE" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(96 * p.s)} ry={fmt(13 * p.s)} fill={`url(#${id}-${k})`} transform={`rotate(${fmt(p.pitch)} ${fmt(c.x)} ${fmt(c.y)})`} />
        {/* one blade glint sweeping across the disc */}
        <ellipse cx={fmt(c.x + bx)} cy={fmt(c.y)} rx={fmt(Math.max(3, 40 * p.s * Math.abs(Math.sin(ph))))} ry={fmt(3.5 * p.s)} fill="#FFFFFF" opacity={0.55} transform={`rotate(${fmt(p.pitch)} ${fmt(c.x)} ${fmt(c.y)})`} />
      </g>
    );
  };
  const mFL = W(-150, -70);
  const mFR = W(150, -70);
  const mNL = W(-175, -38);
  const mNR = W(175, -38);
  return (
    <g>
      {shadowY !== undefined && <SoftShadow id={`${id}-sh`} c={{x: p.x + 20, y: shadowY}} rx={240 * p.s} ry={28 * p.s} alpha={0.28} />}
      {/* far arms + motors + rotors */}
      <Capsule id={`${id}-afl`} a={W(-40, -30)} b={mFL} ra={11 * p.s} rb={9 * p.s} color={farC} />
      <Capsule id={`${id}-afr`} a={W(40, -30)} b={mFR} ra={11 * p.s} rb={9 * p.s} color={farC} />
      <Sphere id={`${id}-mfl`} c={mFL} r={16 * p.s} color="#6E7C8C" />
      <Sphere id={`${id}-mfr`} c={mFR} r={16 * p.s} color="#6E7C8C" />
      {rotor('rfl', add(mFL, {x: 0, y: -16 * p.s}), true)}
      {rotor('rfr', add(mFR, {x: 0, y: -16 * p.s}), true)}
      {/* skids */}
      <Capsule id={`${id}-sk1`} a={W(-70, 50)} b={W(-80, 96)} ra={6 * p.s} rb={6 * p.s} color={farC} />
      <Capsule id={`${id}-sk2`} a={W(70, 50)} b={W(80, 96)} ra={6 * p.s} rb={6 * p.s} color={farC} />
      <Capsule id={`${id}-sk3`} a={W(-120, 98)} b={W(120, 98)} ra={7 * p.s} rb={7 * p.s} color="#9AA6B3" spec={0.3} />
      {/* cargo pod */}
      <Lin id={`${id}-pod`} d={`M${P(W(-62, 22))} L${P(W(62, 22))} L${P(W(58, 76))} L${P(W(-58, 76))} Z`} from={W(-62, 22)} to={W(58, 76)} stops={[[0, '#FFFFFF'], [1, '#C7D0DA']]} />
      <path d={`M${P(W(-22, 48))} L${P(W(-8, 48))} L${P(W(-2, 36))} L${P(W(6, 62))} L${P(W(12, 48))} L${P(W(24, 48))}`} fill="none" stroke={PAL.signalDeep} strokeWidth={5 * p.s} strokeLinejoin="round" strokeLinecap="round" />
      {/* body */}
      <Capsule id={`${id}-bd`} a={W(-92, 0)} b={W(92, 0)} ra={42 * p.s} rb={42 * p.s} color={white} spec={0.7} />
      <Capsule id={`${id}-st`} a={W(-86, 14)} b={W(86, 14)} ra={10 * p.s} rb={10 * p.s} color={PAL.signal} spec={0.4} k={0.8} />
      <Sphere id={`${id}-cn`} c={W(-6, -24)} r={34 * p.s} ry={24 * p.s} color="#304A66" spec={0.8} />
      {/* near arms + motors + rotors */}
      <Capsule id={`${id}-anl`} a={W(-50, -10)} b={mNL} ra={13 * p.s} rb={10 * p.s} color={white} spec={0.4} />
      <Capsule id={`${id}-anr`} a={W(50, -10)} b={mNR} ra={13 * p.s} rb={10 * p.s} color={white} spec={0.4} />
      <Sphere id={`${id}-mnl`} c={mNL} r={18 * p.s} color="#5E6C7C" spec={0.5} />
      <Sphere id={`${id}-mnr`} c={mNR} r={18 * p.s} color="#5E6C7C" spec={0.5} />
      {rotor('rnl', add(mNL, {x: 0, y: -18 * p.s}), false)}
      {rotor('rnr', add(mNR, {x: 0, y: -18 * p.s}), false)}
      {/* beacon */}
      <Glow id={`${id}-bg`} c={W(0, -44)} r={80 * p.s} color={PAL.signal} alpha={0.7 * p.beacon} />
      <Sphere id={`${id}-bc`} c={W(0, -44)} r={11 * p.s} color={p.beacon > 0.5 ? '#CFF4FF' : PAL.signal} spec={0.8} />
    </g>
  );
};

/** Top-down drone for the map. */
export const DroneTop: React.FC<{id: string; c: V; s: number; spin: number}> = ({id, c, s, spin}) => {
  const arms = [45, 135, 225, 315];
  return (
    <g>
      <SoftShadow id={`${id}-sh`} c={{x: c.x + 18 * s, y: c.y + 24 * s}} rx={90 * s} ry={90 * s} alpha={0.3} />
      {arms.map((a, i) => {
        const e = add(c, rot({x: 64 * s, y: 0}, a));
        return (
          <g key={i}>
            <Capsule id={`${id}-a${i}`} a={c} b={e} ra={8 * s} rb={7 * s} color="#E7ECF1" />
            <circle cx={fmt(e.x)} cy={fmt(e.y)} r={fmt(34 * s)} fill="#FFFFFF" opacity={0.28} />
            <ellipse cx={fmt(e.x)} cy={fmt(e.y)} rx={fmt(32 * s)} ry={fmt(4 * s)} transform={`rotate(${fmt(spin * 57 + i * 30)} ${fmt(e.x)} ${fmt(e.y)})`} fill="#FFFFFF" opacity={0.7} />
          </g>
        );
      })}
      <Sphere id={`${id}-b`} c={c} r={30 * s} color="#EEF2F6" spec={0.6} />
      <circle cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(12 * s)} fill={PAL.signal} />
    </g>
  );
};
