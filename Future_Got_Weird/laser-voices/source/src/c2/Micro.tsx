// The microscopic cutaway, in the Crew's flat ink style: the air just outside her left ear at molecule scale, beside a
// cut through her head at the height of the ear canal (seen from above: her face toward the top of the frame; the outer
// ear's flap behind the canal, the tragus in front of it, the canal running in to the eardrum, the little bones and the
// cochlea beyond). Six physical events, each on its phrase:
//   vapor ("water vapor near your ear"): water molecules among the air's nitrogen and oxygen pairs, each one popping in;
//   absorption ("absorbs its light"): the beam's light packets end in the water molecules they reach; each one flashes;
//   heating ("it heats up"): the struck molecules go warm and shake harder; the air along the beam warms;
//   expansion ("and expands"): the warm pocket swells and shoves its neighbours outward;
//   pressure waves ("creating tiny sound waves"): the pulses repeat; crowded bands of molecules travel out from the beam;
//   the ear: the bands run down the canal, push the eardrum in and out; the little bones and the cochlea answer.
// Everything is a function of t; positions come from a fixed hash (identical on every render).
import React from 'react';
import {INK} from './rig/cast';
import {LISTENER} from './castLV';
import {clamp, ss} from './lib';

const hash = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const MB = {y: -30, x0: -900, x1: -70}; // the beam's line (micro units) and the stretch where it heats the air
const T_VAP = 9.15, T_ON = 10.3, V_FRONT = 2600;
const T_HEAT = 11.7, T_EXP = 12.35, T_WAVE = 13.26;
const C_SND = 560, WAVE_T = 0.4;
const DRUM_X = 560;
/** the side of her head (x of the skin) at height y */
const surf = (y: number) => 60 + 0.00042 * y * y;
/** distance and unit direction from the heated stretch of the beam */
const fromBeam = (x: number, y: number) => {
  const cx = clamp(x, MB.x0, MB.x1);
  const dx = x - cx, dy = y - MB.y;
  const d = Math.hypot(dx, dy) || 1;
  return {d, ux: dx / d, uy: dy / d};
};
/** radial displacement of the air at distance d from the beam (px): the expansion shove, then the waves */
const disp = (d: number, t: number) => {
  const e0 = ss(t, T_EXP, T_EXP + 0.32);
  const reach = (t - T_EXP) * C_SND;
  const shove = e0 * 40 * Math.exp(-Math.max(0, d - 60) / 280) * clamp((reach - d + 90) / 90);
  let w = 0;
  if (t > T_WAVE) {
    const tt = t - T_WAVE - d / C_SND;
    if (tt > 0) w = 15 * Math.sin((tt / WAVE_T) * 2 * Math.PI) * clamp(tt / 0.2) * Math.exp(-d / 1500);
  }
  return shove + w;
};
const canalWave = (x: number, t: number) => {
  // the canal mouth (x ~ 60) hears the pulse after travelling from the beam's end
  const tt = t - T_WAVE - (130 + x) / C_SND;
  return tt > 0 ? Math.sin((tt / WAVE_T) * 2 * Math.PI) * clamp(tt / 0.2) : 0;
};

type Mol = {kind: 'w' | 'n' | 'o'; x: number; y: number; ph: number; rot: number; pop: number};
const inPinna = (x: number, y: number) => x > -330 && y > 40 && y < 470 && x > -330 + (470 - y) * 0.0 && x < surf(y) && y > 40 + (60 - x) * 0.45;
const MOLS: Mol[] = (() => {
  const out: Mol[] = [];
  let i = 0;
  for (let gy = -1100; gy < 1100; gy += 112)
    for (let gx = -1100; gx < 60; gx += 112) {
      const x = gx + (hash(i, 1) - 0.5) * 84, y = gy + (hash(i, 2) - 0.5) * 84;
      i++;
      if (x > surf(y) - 40 || inPinna(x, y) || (x > -60 && y > -150 && y < 60)) continue;
      const r = hash(i, 3);
      const nearBeam = Math.abs(y - MB.y) < 230 && x < MB.x1 + 80;
      const kind = nearBeam && r < (Math.abs(y - MB.y) < 130 ? 0.75 : 0.45) ? 'w' : r < 0.1 ? 'w' : r < 0.6 ? 'n' : 'o';
      out.push({kind, x, y, ph: hash(i, 4) * 6.28, rot: hash(i, 5) * 360, pop: T_VAP + (kind === 'w' ? hash(i, 8) * 0.7 : 0)});
    }
  // a few in the canal
  for (let k = 0; k < 7; k++) out.push({kind: k % 3 === 0 ? 'o' : 'n', x: 130 + k * 62, y: (hash(k, 9) - 0.5) * 50, ph: hash(k, 10) * 6.28, rot: hash(k, 11) * 360, pop: 0});
  return out;
})();

/** the micro camera: from the canal mouth (where the room push arrives) out to the air and the beam; at the end along
 *  the canal to the eardrum */
const camOf = (t: number) => {
  const k1 = ss(t, 8.55, 9.7);
  const k2 = ss(t, 13.85, 14.6);
  const cx = 40 + (-190 - 40) * k1 + (360 - -190) * k2;
  const cy = -20 + (-40 - -20) * k1 + (30 - -40) * k2;
  const z = 2.4 + (1.12 - 2.4) * k1 + (1.0 - 1.12) * k2;
  return {cx, cy, z};
};

const Water: React.FC<{warm: number; bend: number; L: number; flash: number; pop: number}> = ({warm, bend, L, flash, pop}) => {
  const O = warm > 0 ? mixC('#4F7CC9', '#EF6B55', warm) : '#4F7CC9';
  const h = {x: Math.cos(((90 - bend) * Math.PI) / 180) * L, y: Math.sin(((90 - bend) * Math.PI) / 180) * L};
  return (
    <g transform={`scale(${pop.toFixed(3)})`}>
      {flash > 0 && <circle r={30 + 70 * (1 - flash)} fill="none" stroke="#FFC744" strokeWidth={9 * flash} opacity={flash} />}
      {warm > 0.05 && <circle r={46} fill="#EF6B55" opacity={0.2 * warm} />}
      <circle cx={h.x} cy={h.y} r={13} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
      <circle cx={-h.x} cy={h.y} r={13} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
      <circle r={22} fill={O} stroke={INK} strokeWidth={4.5} />
      <path d="M -12 -9 A 14 14 0 0 1 4 -16" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.75} />
    </g>
  );
};

export const Micro: React.FC<{t: number; grow?: number}> = ({t, grow = 1}) => {
  const cam = camOf(t);
  const g = grow;
  const sc = cam.z * (0.35 + 0.65 * g);
  const tf = `translate(540 900) scale(${sc.toFixed(4)}) translate(${(-cam.cx).toFixed(2)} ${(-cam.cy).toFixed(2)})`;
  const skin = LISTENER.skin, skinSh = LISTENER.skinShade, hair = LISTENER.hairColor;
  const front = MB.x0 - 400 + (t - T_ON) * V_FRONT;
  const beamOn = t > T_ON;
  const xEnd = Math.min(MB.x1, front);
  const packets: React.ReactNode[] = [];
  if (beamOn) {
    const sp = 130, off = ((t - T_ON) * 900) % sp;
    for (let x = MB.x0 - 400 + off; x < xEnd; x += sp) packets.push(<ellipse key={x.toFixed(1)} cx={x} cy={MB.y} rx={26} ry={9} fill="#FFF1E8" opacity={0.9} />);
  }
  const heat = ss(t, T_HEAT, T_HEAT + 0.4);
  const pocket = 48 + 92 * ss(t, T_EXP, T_EXP + 0.3) + (t > T_EXP ? 16 * Math.sin(clamp((t - T_EXP) / 0.5) * Math.PI) : 0);
  // the wave fronts: stadium rings round the heated stretch, travelling out
  const fronts: React.ReactNode[] = [];
  if (t > T_EXP) {
    const ages = [t - T_EXP - 0.1];
    for (let n = 0; n < 12; n++) ages.push(t - T_WAVE - n * WAVE_T - WAVE_T * 0.25);
    ages.forEach((age, n) => {
      if (age < 0) return;
      const r = age * C_SND + 60;
      if (r > 1700) return;
      const op = (n === 0 ? 0.3 : 0.24) * Math.exp(-r / 1700);
      fronts.push(<rect key={n} x={MB.x0 - r} y={MB.y - r} width={MB.x1 - MB.x0 + 2 * r} height={2 * r} rx={r} fill="none" stroke="#4F7CC9" strokeWidth={44} opacity={op} />);
    });
  }
  // in the canal: bands running in to the drum
  const canal: React.ReactNode[] = [];
  for (let n = 0; n < 12; n++) {
    const age = t - T_WAVE - n * WAVE_T - WAVE_T * 0.25 - 130 / C_SND;
    if (age < 0) continue;
    const x = 60 + age * C_SND;
    if (x > DRUM_X) continue;
    canal.push(<rect key={`c${n}`} x={x - 20} y={-120} width={40} height={240} fill="#4F7CC9" opacity={0.26} />);
  }
  const drumFlex = 15 * canalWave(DRUM_X, t);
  const earOn = ss(t, T_WAVE + (130 + DRUM_X) / C_SND, T_WAVE + (130 + DRUM_X) / C_SND + 0.3);
  const mols = MOLS.map((m, i) => {
    const jx = 12 * Math.sin(t * (1.3 + hash(i, 6)) + m.ph), jy = 12 * Math.cos(t * (1.1 + hash(i, 7)) + m.ph * 1.3);
    const fb = fromBeam(m.x, m.y);
    const inCanal = m.x > 100;
    const near = fb.d < 100;
    const tAbs = T_ON + 0.12 + (m.x - (MB.x0 - 400)) / V_FRONT;
    const absorbed = m.kind === 'w' && near && t > tAbs;
    const warm = absorbed ? ss(t, Math.max(tAbs, T_HEAT), Math.max(tAbs, T_HEAT) + 0.35) : 0;
    const ag = (absorbed ? 3 + 9 * warm : 0) + (fb.d < 150 ? 5 * heat : 0);
    const sx = ag * Math.sin(t * 47 + i), sy = ag * Math.cos(t * 41 + i * 2);
    const dd = inCanal ? 0 : disp(fb.d, t);
    const cw = inCanal ? 14 * canalWave(m.x, t) : 0;
    const x = m.x + jx * (inCanal ? 0.4 : 1) + sx + fb.ux * dd + cw, y = m.y + jy * (inCanal ? 0.4 : 1) + sy + fb.uy * dd;
    const flash = absorbed ? clamp(1 - (t - tAbs) / 0.3) : 0;
    const rot = m.rot + 20 * Math.sin(t * 0.7 + m.ph) + (absorbed ? 40 * warm * Math.sin(t * 13 + i) : 0);
    if (m.kind === 'w') {
      // "water vapor": each water molecule pops (a squash and settle) on the phrase
      const pu = clamp((t - m.pop) / 0.35);
      const pop = t < m.pop ? 1 : 1 + 0.35 * Math.sin(pu * Math.PI) * (1 - pu);
      const bend = 52 + (absorbed ? (6 + 10 * warm) * Math.sin(t * 38 + i) : 0);
      const L = 31 + (absorbed ? (2 + 4 * warm) * Math.sin(t * 52 + i) : 0);
      return <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`}><Water warm={warm} bend={bend} L={L} flash={flash} pop={pop} /></g>;
    }
    // the air molecules step back a little when the water is named
    const col = m.kind === 'n' ? '#9FB0BA' : '#BFD8E6';
    const dim = 1 - 0.35 * ss(t, T_VAP, T_VAP + 0.3) * (1 - ss(t, 10.6, 11.2));
    return (
      <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`} opacity={dim}>
        <circle cx={-11} r={14} fill={col} stroke={INK} strokeWidth={3.5} />
        <circle cx={11} r={14} fill={col} stroke={INK} strokeWidth={3.5} />
      </g>
    );
  });
  // the head, cut at the canal: skin edge, hair on the scalp, the outer-ear flap, the tragus, the canal, the drum
  const ys = Array.from({length: 41}, (_, k) => -1500 + k * 75);
  const headPath = `M ${surf(-1500)} -1500 ${ys.map((y) => `L ${surf(y).toFixed(1)} ${y}`).join(' ')} L 2400 1500 L 2400 -1500 Z`;
  const hairPath = (y0: number, y1: number) => {
    const a = ys.filter((y) => y >= y0 && y <= y1);
    return `M ${surf(y0) - 4} ${y0} ${a.map((y) => `L ${(surf(y) - 4).toFixed(1)} ${y}`).join(' ')} L ${surf(y1) - 4} ${y1} ${a.slice().reverse().map((y) => `L ${(surf(y) - 46).toFixed(1)} ${y}`).join(' ')} Z`;
  };
  const pinna = 'M 70 70 C 10 120 -110 200 -240 300 C -300 345 -330 400 -290 440 C -250 470 -190 440 -120 380 C -40 310 30 250 85 220 Z';
  const tragus = 'M 66 -170 C 10 -160 -40 -130 -46 -95 C -50 -70 -20 -58 66 -60 Z';
  const canalP = `M 66 -60 C 200 -66 380 -70 ${DRUM_X} -78 L ${DRUM_X + 20} 92 C 380 84 200 76 70 70 Z`;
  const drum = `M ${DRUM_X} -78 Q ${DRUM_X + 34 + drumFlex} 6 ${DRUM_X + 20} 92`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}} opacity={clamp(g * 1.6)}>
      <rect x={0} y={0} width={1080} height={1920} fill="#FBEFD6" />
      <g transform={tf}>
        <defs>
          <clipPath id="c2air"><path d={`M -3000 -3000 L 3000 -3000 L 3000 3000 L -3000 3000 Z ${headPath}`} clipRule="evenodd" /></clipPath>
          <clipPath id="c2canal"><path d={canalP} /></clipPath>
        </defs>
        <g clipPath="url(#c2air)">
          {fronts}
          {heat > 0 && <rect x={MB.x0 - pocket - 300} y={MB.y - pocket} width={MB.x1 - MB.x0 + 2 * pocket + 300} height={pocket * 2} rx={pocket} fill="#EF6B55" opacity={0.17 * heat} />}
          {heat > 0 && <rect x={MB.x0 - pocket - 300} y={MB.y - pocket} width={MB.x1 - MB.x0 + 2 * pocket + 300} height={pocket * 2} rx={pocket} fill="none" stroke="#EF6B55" strokeWidth={4} strokeDasharray="2 14" strokeLinecap="round" opacity={0.6 * heat * (1 - ss(t, 13.6, 14.2))} />}
        </g>
        {/* the head */}
        <path d={headPath} fill="#F0B9A2" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d={headPath} fill="none" stroke={skin} strokeWidth={44} transform="translate(22 0)" clipPath="url(#c2head)" />
        <defs><clipPath id="c2head"><path d={headPath} /></clipPath></defs>
        <path d={hairPath(-1500, -260)} fill={hair} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={hairPath(330, 1500)} fill={hair} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* the cochlea and the bones beyond the drum (bone white, ink) */}
        <g transform="translate(800 30) scale(1.5)" opacity={1}>
          <path d="M 0 0 m -90 0 a 90 90 0 1 0 180 0 a 72 72 0 1 0 -144 0 a 54 54 0 1 0 108 0 a 36 36 0 1 0 -72 0 a 18 18 0 1 0 36 0" fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" />
          <path d="M 0 0 m -90 0 a 90 90 0 1 0 180 0 a 72 72 0 1 0 -144 0 a 54 54 0 1 0 108 0 a 36 36 0 1 0 -72 0 a 18 18 0 1 0 36 0" fill="none" stroke="#FFF6E0" strokeWidth={20} strokeLinecap="round" />
          {earOn > 0 && [0, 1].map((k) => {
            const ph = (t / WAVE_T + k / 2) % 1;
            return <circle key={k} r={40 + 120 * ph} fill="none" stroke="#FFC744" strokeWidth={9 * (1 - ph)} opacity={earOn * (1 - ph)} />;
          })}
        </g>
        <g transform={`translate(${DRUM_X + 40 + drumFlex * 0.7} -10)`}>
          <path d="M 0 -40 C 30 -60 60 -40 64 -10 C 66 10 40 20 26 10 C 14 0 6 -16 0 -40 Z" fill="#FFF6E0" stroke={INK} strokeWidth={5} />
          <path d="M 60 -10 C 86 -20 104 0 100 24 C 94 40 76 36 70 20 Z" fill="#FFF6E0" stroke={INK} strokeWidth={5} />
          <path d="M 98 10 L 118 26 L 110 50" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
          <path d="M 98 10 L 118 26 L 110 50" fill="none" stroke="#FFF6E0" strokeWidth={8} strokeLinecap="round" />
        </g>
        {/* the canal: an air passage with skin walls */}
        <path d={canalP} fill="#FBEFD6" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M 66 -60 C 200 -66 380 -70 ${DRUM_X} -78`} fill="none" stroke={skinSh} strokeWidth={14} transform="translate(0 8)" />
        <path d={`M 70 70 C 200 76 380 84 ${DRUM_X + 20} 92`} fill="none" stroke={skinSh} strokeWidth={14} transform="translate(0 -8)" />
        <g clipPath="url(#c2canal)">{canal}</g>
        <path d={drum} fill="none" stroke={INK} strokeWidth={15} strokeLinecap="round" />
        <path d={drum} fill="none" stroke="#F7C8C0" strokeWidth={8} strokeLinecap="round" />
        {/* outer ear and tragus (skin, with the rim's shading) */}
        <path d={pinna} fill={skin} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d="M 40 150 C -40 210 -150 290 -250 370" fill="none" stroke={skinSh} strokeWidth={18} strokeLinecap="round" />
        <path d={tragus} fill={skin} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        {mols}
        {/* the beam: ribbon and packets */}
        {beamOn && (
          <g>
            <rect x={MB.x0 - 700} y={MB.y - 26} width={xEnd - MB.x0 + 700} height={52} fill="#EF6B55" opacity={0.18} />
            <rect x={MB.x0 - 700} y={MB.y - 10} width={xEnd - MB.x0 + 700} height={20} fill="#FF8A72" opacity={0.7} />
            <rect x={MB.x0 - 700} y={MB.y - 3.5} width={xEnd - MB.x0 + 700} height={7} fill="#FFE3DA" opacity={0.95} />
            {packets}
          </g>
        )}
      </g>
    </svg>
  );
};
const mixC = (a: string, b: string, u: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * clamp(u)).toString(16).padStart(2, '0')).join('')}`;
};
