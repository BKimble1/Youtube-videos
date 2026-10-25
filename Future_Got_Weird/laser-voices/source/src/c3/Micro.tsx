// V3 molecular sequence, in the Crew's flat ink style. A section through her head at the ear canal, seen from the
// front as in the room (the transmitter is off to the right): outer ear, canal, eardrum, the little bones and the
// cochlea on the left; the air beside the ear on the right. One continuous micro camera visits five compositions:
//   A "water vapor near your ear": close in the air: a handful of water molecules appear, one by one;
//   B "absorbs its light": along the (invisible, visualised) infrared beam: light packets end in three water
//     molecules in turn; each flashes and starts to vibrate;
//   C "it heats up and expands": wider: the struck molecules and their neighbours run hot and fast; the warm pocket
//     swells and shoves the air out in a ring;
//   D "creating tiny sound waves": back to take in the ear: the pulses repeat; crowded bands of air travel out, into
//     the bowl of the ear and down the canal (the camera follows them);
//   E the eardrum flexes with each one; the little bones answer.
// Then the same move reversed, out to the room. The light is absorbed in the air near her, never by the ear itself.
import React from 'react';
import {INK} from './rig/cast';
import {LISTENER} from './castLV';
import {clamp, lerp, ss, ss5} from './lib';

const hash = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const BY = -40; // the beam's line
const HX0 = 330, HX1 = 1080; // the stretch of air the light heats
const T_POP = 9.15, T_ON = 10.3, T_HEAT = 11.7, T_EXP = 12.35, T_WAVE = 13.26;
const C_SND = 760, WAVE_T = 0.36;
const DRUM_X = -470;
/** the head's skin (x of the surface) at height y */
const surf = (y: number) => -0.00032 * y * y;
// the water molecules, placed: three on the beam (the absorbers, struck in turn from the right), the rest round them
const WATER = [
  {x: 985, y: -52, ab: 10.5}, {x: 765, y: -28, ab: 10.82}, {x: 540, y: -48, ab: 11.14},
  {x: 870, y: -205, ab: 0}, {x: 650, y: 125, ab: 0}, {x: 1095, y: 120, ab: 0}, {x: 430, y: -235, ab: 0}, {x: 355, y: 95, ab: 0}, {x: 1190, y: -250, ab: 0},
  {x: 1300, y: 40, ab: 0}, {x: 250, y: -110, ab: 0},
];
type Air = {x: number; y: number; ph: number; rot: number; o: boolean};
const inEar = (x: number, y: number) => x < 330 && y > -520 && y < 360;
const AIR: Air[] = (() => {
  const out: Air[] = [];
  let i = 0;
  for (let gy = -1100; gy <= 1100; gy += 150)
    for (let gx = 120; gx <= 1700; gx += 150) {
      const x = gx + (hash(i, 1) - 0.5) * 110, y = gy + (hash(i, 2) - 0.5) * 110;
      i++;
      if (x < surf(y) + 60 || inEar(x, y)) continue;
      if (WATER.some((w) => Math.hypot(w.x - x, w.y - y) < 85)) continue;
      out.push({x, y, ph: hash(i, 4) * 6.28, rot: hash(i, 5) * 360, o: hash(i, 3) < 0.25});
    }
  return out;
})();
const CANAL_AIR = Array.from({length: 6}, (_, k) => ({x: -40 - k * 72, y: (hash(k, 9) - 0.5) * 44, ph: hash(k, 10) * 6.28, rot: hash(k, 11) * 360, o: k % 3 === 0}));

/** distance from the heated stretch of the beam, and the unit direction away from it */
const fromBeam = (x: number, y: number) => {
  const cx = clamp(x, HX0, HX1);
  const dx = x - cx, dy = y - BY;
  const d = Math.hypot(dx, dy) || 1;
  return {d, ux: dx / d, uy: dy / d};
};
/** radial shove of the air at distance d: the expansion, then the repeated pressure pulses */
const disp = (d: number, t: number) => {
  const e0 = ss(t, T_EXP, T_EXP + 0.3);
  const reach = (t - T_EXP) * C_SND;
  const shove = e0 * 34 * Math.exp(-Math.max(0, d - 70) / 300) * clamp((reach - d + 90) / 90);
  let w = 0;
  if (t > T_WAVE) {
    const tt = t - T_WAVE - d / C_SND;
    if (tt > 0) w = 13 * Math.sin((tt / WAVE_T) * 2 * Math.PI) * clamp(tt / 0.15) * Math.exp(-d / 1800);
  }
  return shove + w;
};
/** the pressure in the canal (a pulse train arriving at the mouth, running in) at x */
const MOUTH_D = Math.hypot(40 - HX0, 0 - BY);
const canalWave = (x: number, t: number) => {
  const tt = t - T_WAVE - (MOUTH_D + (40 - x)) / C_SND;
  return tt > 0 ? Math.sin((tt / WAVE_T) * 2 * Math.PI) * clamp(tt / 0.15) : 0;
};

/** the micro camera: centre (cx, cy) and zoom, keyed through the five compositions; the reverse move at the end */
const camOf = (t: number) => {
  const keys: [number, number, number, number][] = [
    // t, cx, cy, zoom
    [8.6, 640, -40, 3.2],
    [10.15, 700, -40, 2.35],
    [10.55, 790, -40, 2.25],
    [11.35, 700, -40, 2.1],
    [12.0, 690, -30, 1.3],
    [13.15, 640, -20, 1.15],
    [13.75, 120, -20, 0.74],
    [14.3, -230, 0, 0.92],
    [14.75, -440, 0, 1.55],
    [15.0, -450, 0, 1.6],
    [15.45, 260, -30, 0.55],
  ];
  if (t <= keys[0][0]) return {cx: keys[0][1], cy: keys[0][2], z: keys[0][3]};
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i];
      const u = ss5(t, a[0], b[0]);
      // zoom in log space (constant-rate feel)
      return {cx: lerp(a[1], b[1], u), cy: lerp(a[2], b[2], u), z: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), u))};
    }
  }
  const l = keys[keys.length - 1];
  return {cx: l[1], cy: l[2], z: l[3]};
};

const Water: React.FC<{warm: number; bend: number; L: number; flash: number; pop: number; glow: number}> = ({warm, bend, L, flash, pop, glow}) => {
  const O = mixC('#4F7CC9', '#EF6B55', warm);
  const h = {x: Math.cos(((90 - bend) * Math.PI) / 180) * L, y: Math.sin(((90 - bend) * Math.PI) / 180) * L};
  return (
    <g transform={`scale(${pop.toFixed(3)})`}>
      {glow > 0 && <circle r={40} fill="#FFD9A8" opacity={0.45 * glow} />}
      {flash > 0 && <circle r={28 + 64 * (1 - flash)} fill="none" stroke="#FFC744" strokeWidth={8 * flash} opacity={flash} />}
      <circle cx={h.x} cy={h.y} r={13} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
      <circle cx={-h.x} cy={h.y} r={13} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
      <circle r={22} fill={O} stroke={INK} strokeWidth={4.5} />
      <path d="M -12 -9 A 14 14 0 0 1 4 -16" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.75} />
    </g>
  );
};
const Pair: React.FC<{o: boolean; warm: number}> = ({o, warm}) => {
  const col = mixC(o ? '#BFD8E6' : '#9FB0BA', '#F4A08E', warm * 0.6);
  return (
    <g>
      <circle cx={-11} r={14} fill={col} stroke={INK} strokeWidth={3.5} />
      <circle cx={11} r={14} fill={col} stroke={INK} strokeWidth={3.5} />
    </g>
  );
};

export const Micro: React.FC<{t: number; grow?: number}> = ({t, grow = 1}) => {
  const cam = camOf(t);
  const g = grow;
  const sc = cam.z * (0.3 + 0.7 * g);
  const tf = `translate(540 900) scale(${sc.toFixed(4)}) translate(${(-cam.cx).toFixed(2)} ${(-cam.cy).toFixed(2)})`;
  const skin = LISTENER.skin, skinSh = LISTENER.skinShade, hair = LISTENER.hairColor;
  // ---- the beam (visualised): a pale band from the right with light-wave packets travelling left; it thins away near
  // the ear (the light is taken up by the water in the air)
  const beamOn = t > T_ON;
  const front = 1700 - (t - T_ON) * 2200;
  const xL = Math.max(150, front);
  const heat = ss(t, T_HEAT, T_HEAT + 0.45);
  const pocket = 52 + 110 * ss(t, T_EXP, T_EXP + 0.32) + (t > T_EXP ? 18 * Math.sin(clamp((t - T_EXP) / 0.5) * Math.PI) : 0);
  const packets: React.ReactNode[] = [];
  if (beamOn) {
    const sp = 170, off = ((t - T_ON) * 700) % sp;
    for (let x = 1750 - off; x > xL; x -= sp) {
      // a packet that reaches an absorber after its time is gone (it was taken up)
      const eaten = WATER.slice(0, 3).some((w) => x < w.x && t > w.ab && t < w.ab + 0.9);
      if (eaten && x < 1000) continue;
      const fade = clamp((x - 150) / 200);
      const wv = Array.from({length: 13}, (_, k) => `${k ? 'L' : 'M'} ${(x - 36 + k * 6).toFixed(1)} ${(BY + 9 * Math.sin(k * 1.4 + t * 18)).toFixed(1)}`).join(' ');
      packets.push(<path key={x.toFixed(0)} d={wv} fill="none" stroke="#FF8F78" strokeWidth={4} strokeLinecap="round" opacity={0.9 * fade} />);
    }
  }
  // ---- pressure fronts: the expansion's ring, then the pulse train, as stadium rings round the heated stretch
  const fronts: React.ReactNode[] = [];
  if (t > T_EXP) {
    const ages = [t - T_EXP - 0.05];
    for (let n = 0; n < 14; n++) ages.push(t - T_WAVE - n * WAVE_T);
    ages.forEach((age, n) => {
      if (age < 0) return;
      const r = age * C_SND + 70;
      if (r > 2200) return;
      fronts.push(<rect key={n} x={HX0 - r} y={BY - r} width={HX1 - HX0 + 2 * r} height={2 * r} rx={r} fill="none" stroke="#4F7CC9" strokeWidth={46} opacity={(n === 0 ? 0.3 : 0.24) * Math.exp(-r / 2000)} />);
    });
  }
  const canal: React.ReactNode[] = [];
  for (let n = 0; n < 14; n++) {
    const age = t - T_WAVE - n * WAVE_T - MOUTH_D / C_SND;
    if (age < 0) continue;
    const x = 40 - age * C_SND;
    if (x < DRUM_X) continue;
    canal.push(<rect key={`c${n}`} x={x - 20} y={-140} width={40} height={280} fill="#4F7CC9" opacity={0.28} />);
  }
  const drumAt = (tt: number) => 15 * canalWave(DRUM_X, tt);
  const drum = drumAt(t);
  const earOn = ss(t, T_WAVE + (MOUTH_D + 40 - DRUM_X) / C_SND, T_WAVE + (MOUTH_D + 40 - DRUM_X) / C_SND + 0.2);
  // ---- molecules
  const mol = (x0: number, y0: number, i: number, inCanal = false) => {
    const jx = 10 * Math.sin(t * (1.3 + hash(i, 6)) + i), jy = 10 * Math.cos(t * (1.1 + hash(i, 7)) + i * 1.3);
    if (inCanal) return {x: x0 + jx * 0.4 + 14 * canalWave(x0, t), y: y0 + jy * 0.4, fb: {d: 999, ux: 0, uy: 0}};
    const fb = fromBeam(x0, y0);
    const dd = disp(fb.d, t);
    return {x: x0 + jx + fb.ux * dd, y: y0 + jy + fb.uy * dd, fb};
  };
  const waters = WATER.map((w, i) => {
    const m = mol(w.x, w.y, 100 + i);
    // "water vapor": each pops in (scale up with a little overshoot), one after another
    const tp = T_POP + 0.07 * i;
    const pu = clamp((t - tp) / 0.3);
    const pop = t < tp ? 0 : 1 + 0.3 * Math.sin(pu * Math.PI) * (1 - pu) - (1 - pu) * (1 - pu) * 0.0;
    const sc0 = t < tp ? 0 : Math.min(1, pu * 1.6);
    const absorbed = w.ab > 0 && t > w.ab;
    const warmOwn = absorbed ? ss(t, Math.max(w.ab, T_HEAT), Math.max(w.ab, T_HEAT) + 0.4) : 0;
    const warm = Math.max(warmOwn, m.fb.d < 190 ? 0.55 * heat : 0);
    const flash = absorbed ? clamp(1 - (t - w.ab) / 0.35) : 0;
    const glow = absorbed ? clamp(1 - (t - w.ab) / 0.8) : 0;
    const ag = (absorbed ? 3 + 9 * warm : 0) + (m.fb.d < 200 ? 6 * heat : 0);
    const x = m.x + ag * Math.sin(t * 47 + i), y = m.y + ag * Math.cos(t * 41 + i * 2);
    const bend = 52 + (absorbed ? (7 + 10 * warm) * Math.sin(t * 38 + i) : 0);
    const L = 31 + (absorbed ? (2 + 4 * warm) * Math.sin(t * 52 + i) : 0);
    const rot = hash(i, 5) * 360 + 18 * Math.sin(t * 0.7 + i) + (absorbed ? 30 * warm * Math.sin(t * 13 + i) : 0);
    if (sc0 <= 0) return null;
    return <g key={`w${i}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sc0.toFixed(3)})`}><Water warm={warm} bend={bend} L={L} flash={flash} pop={pop} glow={glow} /></g>;
  });
  const airs = [...AIR.map((a, i) => ({a, i, c: false})), ...CANAL_AIR.map((a, i) => ({a, i: 500 + i, c: true}))].map(({a, i, c}) => {
    const m = mol(a.x, a.y, i, c);
    const warm = !c && m.fb.d < 190 ? heat : 0;
    const ag = !c && m.fb.d < 200 ? 6 * heat : 0;
    const x = m.x + ag * Math.sin(t * 43 + i), y = m.y + ag * Math.cos(t * 37 + i);
    // the air steps back a little while the water is named
    const dim = 1 - 0.4 * ss(t, T_POP, T_POP + 0.3) * (1 - ss(t, 10.4, 11.0));
    return <g key={`a${i}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(a.rot + 20 * Math.sin(t * 0.6 + a.ph)).toFixed(1)})`} opacity={dim}><Pair o={a.o} warm={warm} /></g>;
  });
  // ---- the ear and head, cut (front view): skin edge, hair above, the outer ear standing out to the right, the canal
  // running in to the drum, the bones and cochlea in the bone beyond
  const ys = Array.from({length: 41}, (_, k) => -1600 + k * 80);
  const headPath = `M ${surf(-1600)} -1600 ${ys.map((y) => `L ${surf(y).toFixed(1)} ${y}`).join(' ')} L -2600 1600 L -2600 -1600 Z`;
  const hairPath = `M ${surf(-1600) + 2} -1600 ${ys.filter((y) => y <= -360).map((y) => `L ${(surf(y) + 2).toFixed(1)} ${y}`).join(' ')} L ${surf(-360) + 40} -360 ${ys.filter((y) => y <= -360).reverse().map((y) => `L ${(surf(y) + 44 + 8 * Math.sin(y / 70)).toFixed(1)} ${y}`).join(' ')} Z`;
  const pinna = 'M 0 -470 C 70 -560 250 -560 300 -420 C 345 -300 300 -170 230 -120 C 200 -96 150 -84 120 -70 C 70 -58 40 -60 30 -66 L 30 70 C 70 90 130 110 160 170 C 196 240 160 330 90 340 C 40 346 10 320 0 300 Z';
  const helix = 'M 30 -440 C 90 -510 220 -505 262 -405 C 290 -330 262 -230 210 -185';
  const concha = 'M 40 -66 C 110 -76 160 -110 175 -170 C 190 -250 150 -320 90 -330';
  const canalP = `M 34 -64 C -120 -70 -300 -78 ${DRUM_X} -86 L ${DRUM_X - 22} 84 C -300 78 -120 72 34 66 Z`;
  const drumP = `M ${DRUM_X} -86 Q ${(DRUM_X - 34 - drum).toFixed(1)} -2 ${DRUM_X - 22} 84`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}} opacity={clamp(g * 1.7)}>
      <rect x={0} y={0} width={1080} height={1920} fill="#FBEFD6" />
      <g transform={tf}>
        <defs>
          <clipPath id="c3air"><path d={`M -4000 -4000 L 4000 -4000 L 4000 4000 L -4000 4000 Z ${headPath} ${pinna}`} clipRule="evenodd" /></clipPath>
          <clipPath id="c3canal"><path d={canalP} /></clipPath>
        </defs>
        {/* warm air toward the lamps (a flat band high up) */}
        <rect x={-500} y={-2400} width={3200} height={900} fill="#F7E4C4" />
        <g clipPath="url(#c3air)">
          {fronts}
          {heat > 0 && <rect x={HX0 - pocket} y={BY - pocket} width={HX1 - HX0 + 2 * pocket} height={pocket * 2} rx={pocket} fill="#FFB27A" opacity={0.2 * heat} />}
        </g>
        {/* the head */}
        <path d={headPath} fill="#F0B9A2" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        {/* the bone round the middle and inner ear */}
        <path d={`M ${DRUM_X - 40} -260 C ${DRUM_X - 140} -330 -900 -340 -1000 -240 C -1100 -120 -1080 200 -980 280 C -880 360 ${DRUM_X - 120} 330 ${DRUM_X - 50} 250 C ${DRUM_X - 10} 160 ${DRUM_X - 10} -180 ${DRUM_X - 40} -260 Z`} fill="#FFF3DC" stroke={INK} strokeWidth={6} />
        <path d={hairPath} fill={hair} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <g transform="translate(-800 30) scale(1.55)">
          <path d="M 0 0 m -90 0 a 90 90 0 1 0 180 0 a 72 72 0 1 0 -144 0 a 54 54 0 1 0 108 0 a 36 36 0 1 0 -72 0 a 18 18 0 1 0 36 0" fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" />
          <path d="M 0 0 m -90 0 a 90 90 0 1 0 180 0 a 72 72 0 1 0 -144 0 a 54 54 0 1 0 108 0 a 36 36 0 1 0 -72 0 a 18 18 0 1 0 36 0" fill="none" stroke="#F7C8C0" strokeWidth={20} strokeLinecap="round" />
          {earOn > 0 && [0, 1].map((k) => {
            const ph = (t / WAVE_T + k / 2) % 1;
            return <circle key={k} r={30 + 90 * ph} fill="none" stroke="#FFC744" strokeWidth={8 * (1 - ph)} opacity={earOn * (1 - ph)} />;
          })}
        </g>
        <g transform={`translate(${(DRUM_X - 46 - drum * 0.7).toFixed(1)} -8)`}>
          <path d="M 0 -40 C -30 -60 -60 -40 -64 -10 C -66 10 -40 20 -26 10 C -14 0 -6 -16 0 -40 Z" fill="#FFF6E0" stroke={INK} strokeWidth={5} />
          <path d="M -60 -10 C -86 -20 -104 0 -100 24 C -94 40 -76 36 -70 20 Z" fill="#FFF6E0" stroke={INK} strokeWidth={5} />
          <path d="M -98 10 L -118 26 L -110 50" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
          <path d="M -98 10 L -118 26 L -110 50" fill="none" stroke="#FFF6E0" strokeWidth={8} strokeLinecap="round" />
        </g>
        <path d={canalP} fill="#FBEFD6" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M 34 -64 C -120 -70 -300 -78 ${DRUM_X} -86`} fill="none" stroke={skinSh} strokeWidth={14} transform="translate(0 9)" />
        <path d={`M 34 66 C -120 72 -300 78 ${DRUM_X - 22} 84`} fill="none" stroke={skinSh} strokeWidth={14} transform="translate(0 -9)" />
        <g clipPath="url(#c3canal)">{canal}</g>
        <path d={drumP} fill="none" stroke={INK} strokeWidth={15} strokeLinecap="round" />
        <path d={drumP} fill="none" stroke="#F7C8C0" strokeWidth={8} strokeLinecap="round" />
        {/* the outer ear */}
        <path d={pinna} fill={skin} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d={helix} fill="none" stroke={skinSh} strokeWidth={18} strokeLinecap="round" />
        <path d={concha} fill="none" stroke={skinSh} strokeWidth={12} strokeLinecap="round" />
        {airs}
        {/* the beam, visualised */}
        {beamOn && (
          <g>
            <defs>
              <linearGradient id="c3beamfade" gradientUnits="userSpaceOnUse" x1={150} y1={0} x2={420} y2={0}>
                <stop offset="0" stopColor="#FFC9BC" stopOpacity={0} />
                <stop offset="1" stopColor="#FFC9BC" stopOpacity={1} />
              </linearGradient>
            </defs>
            <rect x={xL} y={BY - 30} width={2600 - xL} height={60} fill="url(#c3beamfade)" opacity={0.42} />
            <line x1={xL} y1={BY} x2={2600} y2={BY} stroke="url(#c3beamfade)" strokeWidth={4} strokeDasharray="18 14" strokeDashoffset={-t * 300} />
            {packets}
          </g>
        )}
        {waters}
      </g>
    </svg>
  );
};
const mixC = (a: string, b: string, u: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * clamp(u)).toString(16).padStart(2, '0')).join('')}`;
};
