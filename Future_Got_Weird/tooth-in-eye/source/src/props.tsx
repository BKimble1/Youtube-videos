// Surgical instruments, the bench drape, the hospital room behind the patient, and the patient's view.
// Instruments are drawn in scene millimetres from their working tip, pointing along `ang` (degrees, the direction
// from the tip back to the handle), so a shot can place the tip exactly on the implant's projected geometry.
import React from 'react';
import {clamp, hash, lerp} from './lib';
import {W, H} from './lib';

const INK = '#2B2F36';
const steel = (id: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor="#F4F7FA" /><stop offset="0.35" stopColor="#C9D1D9" /><stop offset="0.7" stopColor="#8E99A5" /><stop offset="1" stopColor="#C2CAD2" />
  </linearGradient>
);

/** an oscillating micro-saw: thin blade, neck, handpiece */
export const Saw: React.FC<{id: string; x: number; y: number; ang: number; px: number; buzz: number; t: number}> = ({id, x, y, ang, px, buzz, t}) => {
  const j = buzz > 0 ? Math.sin(t * 2 * Math.PI * 23) * 0.35 * buzz : 0;
  return (
    <g transform={`translate(${x},${y}) rotate(${ang}) rotate(${j * 3})`}>
      <defs>{steel(`${id}s`)}</defs>
      <path d="M-0.4,-2.4 L10,-1.6 L10,1.6 L-0.4,2.4 Z" fill={`url(#${id}s)`} stroke={INK} strokeWidth={1.6 * px} />
      {/* teeth */}
      <path d={`M-0.4,-2.4 ${Array.from({length: 8}, (_, i) => `L-1,${-2.4 + (i + 0.5) * 0.6} L-0.4,${-2.4 + (i + 1) * 0.6}`).join(' ')}`} fill="#AEB7C0" stroke={INK} strokeWidth={1 * px} />
      <path d="M10,-2.4 L22,-2.8 L22,2.8 L10,2.4 Z" fill="#9AA5B1" stroke={INK} strokeWidth={1.6 * px} />
      <rect x={22} y={-5} width={160} height={10} rx={4.5} fill={`url(#${id}s)`} stroke={INK} strokeWidth={2 * px} />
      <rect x={60} y={-5.2} width={12} height={10.4} fill="#3F7FA8" stroke={INK} strokeWidth={1.4 * px} />
    </g>
  );
};

/** a straight handpiece with a cylindrical trephine burr whose diameter is the hole's (3.6 mm) */
export const Drill: React.FC<{id: string; x: number; y: number; ang: number; px: number; spin: number; t: number}> = ({id, x, y, ang, px, spin, t}) => {
  const ph = (t * 40 * spin) % 1;
  return (
    <g transform={`translate(${x},${y}) rotate(${ang})`}>
      <defs>{steel(`${id}s`)}</defs>
      <rect x={0} y={-1.8} width={6} height={3.6} fill={`url(#${id}s)`} stroke={INK} strokeWidth={1.4 * px} />
      {[0, 1, 2, 3].map((k) => {
        const u = ((k / 4 + ph) % 1) * 6;
        return <path key={k} d={`M${u},-1.8 L${Math.min(6, u + 1.6)},1.8`} stroke="#6B7682" strokeWidth={0.35} />;
      })}
      <rect x={6} y={-0.8} width={7} height={1.6} fill="#B8C1CA" stroke={INK} strokeWidth={1.2 * px} />
      <path d="M13,-2.8 L20,-5 L20,5 L13,2.8 Z" fill="#AAB4BE" stroke={INK} strokeWidth={1.4 * px} />
      <rect x={20} y={-5.5} width={150} height={11} rx={5} fill={`url(#${id}s)`} stroke={INK} strokeWidth={2 * px} />
      <rect x={34} y={-5.7} width={10} height={11.4} fill="#E3B341" stroke={INK} strokeWidth={1.2 * px} />
    </g>
  );
};

/** fine forceps holding something at the tip; `open` spreads the tines */
export const Forceps: React.FC<{id: string; x: number; y: number; ang: number; px: number; open: number; gap?: number}> = ({id, x, y, ang, px, open, gap = 1.9}) => {
  const g = gap + open * 2.4;
  return (
    <g transform={`translate(${x},${y}) rotate(${ang})`}>
      <defs>{steel(`${id}s`)}</defs>
      {[-1, 1].map((s) => (
        <path key={s} d={`M0,${s * g} L3,${s * g} L70,${s * (g + 6)} L120,${s * (g + 7.5)} L120,${s * (g + 10)} L70,${s * (g + 8.6)} L3,${s * (g + 1.1)} L0,${s * (g + 0.9)} Z`} fill={`url(#${id}s)`} stroke={INK} strokeWidth={1.5 * px} />
      ))}
    </g>
  );
};

/** a periosteal elevator: flat blade, round shaft */
export const Elevator: React.FC<{id: string; x: number; y: number; ang: number; px: number}> = ({id, x, y, ang, px}) => (
  <g transform={`translate(${x},${y}) rotate(${ang})`}>
    <defs>{steel(`${id}s`)}</defs>
    <path d="M0,-1.8 C2,-2.4 6,-1.6 8,-1 L8,1 C6,1.6 2,2.4 0,1.8 C-0.5,1 -0.5,-1 0,-1.8 Z" fill={`url(#${id}s)`} stroke={INK} strokeWidth={1.5 * px} />
    <rect x={8} y={-1} width={20} height={2} fill="#B8C1CA" stroke={INK} strokeWidth={1.2 * px} />
    <rect x={28} y={-4} width={120} height={8} rx={3.5} fill={`url(#${id}s)`} stroke={INK} strokeWidth={1.8 * px} />
    {Array.from({length: 10}, (_, i) => <line key={i} x1={40 + i * 5} x2={42 + i * 5} y1={-4} y2={4} stroke="#8E99A5" strokeWidth={0.6} />)}
  </g>
);

/** the sterile drape under the bench work (screen space), with a soft lamp pool */
export const Drape: React.FC<{id: string; shift: number}> = ({id, shift}) => (
  <g>
    <defs>
      <linearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#25595F" /><stop offset="1" stopColor="#317077" /></linearGradient>
      <radialGradient id={`${id}l`} cx="0.5" cy="0.45" r="0.55"><stop offset="0" stopColor="#7FC1C4" stopOpacity="0.55" /><stop offset="1" stopColor="#7FC1C4" stopOpacity="0" /></radialGradient>
    </defs>
    <rect x={0} y={0} width={W} height={H} fill={`url(#${id}d)`} />
    {[0, 1, 2, 3, 4].map((i) => {
      const y = 260 + i * 380 + shift * (0.6 + i * 0.1);
      return <path key={i} d={`M-50,${y} C300,${y - 60 + 30 * hash(i)} 700,${y + 70} 1130,${y - 20}`} stroke="#1E4C52" strokeWidth={36} fill="none" opacity={0.35} style={{filter: 'blur(14px)'}} />;
    })}
    <rect x={0} y={0} width={W} height={H} fill={`url(#${id}l)`} />
    {/* fine weave */}
    {Array.from({length: 40}, (_, i) => <line key={i} x1={0} x2={W} y1={i * 48 + (shift % 48)} y2={i * 48 + (shift % 48)} stroke="#3B7E85" strokeWidth={1} opacity={0.18} />)}
  </g>
);

/** the hospital room behind the patient (screen space, soft and out of focus) */
export const Room: React.FC<{id: string; dx: number; dy: number; light: number}> = ({id, dx, dy, light}) => (
  <g>
    <defs>
      <linearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#CFE0DE" /><stop offset="1" stopColor="#9DB8B8" /></linearGradient>
    </defs>
    <rect x={0} y={0} width={W} height={H} fill={`url(#${id}w)`} />
    <g style={{filter: 'blur(10px)'}} transform={`translate(${dx},${dy})`}>
      <rect x={640} y={180} width={420} height={620} rx={10} fill="#F4F8F2" />
      <rect x={660} y={200} width={180} height={580} fill="#E3EEF0" />
      <rect x={860} y={200} width={180} height={580} fill="#E8F1F1" />
      <rect x={60} y={260} width={26} height={1500} fill="#B5C2C6" />
      <rect x={30} y={300} width={86} height={130} rx={18} fill="#E9EEF0" opacity={0.9} />
      <rect x={-40} y={1180} width={1160} height={900} fill="#7F9EA4" opacity={0.5} />
    </g>
    {light !== 1 && <rect x={0} y={0} width={W} height={H} fill={light < 1 ? '#0E1A2E' : '#FFE9C4'} opacity={Math.abs(1 - light) * (light < 1 ? 0.55 : 0.35)} />}
  </g>
);

/** what he sees: a warm room and a woman smiling at him (original character), through the cylinder's limited field */
export const View: React.FC<{id: string; clear: number; bright: number; t: number}> = ({id, clear, bright, t}) => {
  const blur = lerp(60, 0, clear);
  const wave = Math.sin(t * 5) * 4 * clear;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}vig`} cx="0.5" cy="0.46" r="0.62"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.85" /></radialGradient>
        <linearGradient id={`${id}wall`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#E9C9A0" /><stop offset="1" stopColor="#F6E3C6" /></linearGradient>
        <filter id={`${id}bl`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={blur} /></filter>
      </defs>
      <g filter={blur > 0.3 ? `url(#${id}bl)` : undefined}>
        <rect x={0} y={0} width={W} height={H} fill={`url(#${id}wall)`} />
        {/* window with daylight */}
        <rect x={700} y={200} width={330} height={760} rx={8} fill="#FFF9EA" stroke="#B88C62" strokeWidth={14} />
        <line x1={865} x2={865} y1={200} y2={960} stroke="#B88C62" strokeWidth={10} />
        <path d="M720,960 C760,700 820,600 860,400 L1030,380 L1030,960 Z" fill="#CDE6C0" opacity={0.6} />
        {/* a framed picture, a lamp, a plant, the sofa */}
        <rect x={90} y={330} width={220} height={170} fill="#8DA9C4" stroke="#6E4F34" strokeWidth={12} />
        <path d="M110,480 L170,400 L220,450 L260,410 L300,480 Z" fill="#5E7F5A" />
        <path d="M0,1260 L1080,1260 L1080,1920 L0,1920 Z" fill="#A8794F" />
        <rect x={-20} y={1150} width={560} height={300} rx={60} fill="#7E5C8A" />
        <rect x={-20} y={1080} width={520} height={160} rx={60} fill="#8E6B99" />
        <ellipse cx={930} cy={1300} rx={90} ry={30} fill="#7A4E2E" />
        <path d="M930,1290 C880,1150 860,1080 900,1020 M930,1290 C960,1150 1010,1090 990,1010 M930,1290 C930,1170 940,1100 930,1040" stroke="#4E7A44" strokeWidth={26} fill="none" strokeLinecap="round" />
        {/* the woman */}
        <g transform={`translate(560,780)`}>
          <path d="M-210,1200 C-200,820 -150,560 0,540 C150,560 200,820 210,1200 Z" fill="#3E8A6E" stroke="#26473A" strokeWidth={6} />
          <path d="M-60,540 L0,640 L60,540" fill="none" stroke="#2E6E56" strokeWidth={10} />
          <rect x={-44} y={440} width={88} height={120} fill="#A86F4C" />
          <path d="M-150,180 C-170,40 -110,-90 0,-96 C110,-90 170,40 150,180 C160,260 120,320 100,330 C90,250 -90,250 -100,330 C-120,320 -160,260 -150,180 Z" fill="#2F2420" />
          <ellipse cx={0} cy={200} rx={118} ry={150} fill="#B97A55" stroke="#5A3626" strokeWidth={6} />
          {Array.from({length: 18}, (_, i) => {
            const a = (i / 18) * Math.PI * 1.15 + Math.PI * 0.92;
            return <circle key={i} cx={Math.cos(a) * 130} cy={120 + Math.sin(a) * 120} r={36} fill="#2F2420" />;
          })}
          {/* eyes, brows, smile */}
          {[-1, 1].map((s) => (
            <g key={s}>
              <path d={`M${s * 30},150 q${s * 22},-16 ${s * 46},0`} stroke="#2F1E18" strokeWidth={9} fill="none" strokeLinecap="round" />
              <path d={`M${s * 26},116 q${s * 26},-16 ${s * 54},-4`} stroke="#2F2420" strokeWidth={9} fill="none" strokeLinecap="round" />
            </g>
          ))}
          <path d="M-46,248 C-24,282 24,282 46,248 C24,262 -24,262 -46,248 Z" fill="#FFFFFF" stroke="#7A3A30" strokeWidth={6} strokeLinejoin="round" />
          <ellipse cx={-62} cy={220} rx={22} ry={12} fill="#D9846C" opacity={0.5} />
          <ellipse cx={62} cy={220} rx={22} ry={12} fill="#D9846C" opacity={0.5} />
          <path d="M0,170 C-6,200 -12,212 -4,218" stroke="#8C5539" strokeWidth={5} fill="none" />
          {/* a raised hand, waving gently */}
          <g transform={`translate(170,560) rotate(${26 + wave})`}>
            <path d="M0,0 C10,-120 30,-220 40,-300" stroke="#3E8A6E" strokeWidth={70} strokeLinecap="round" fill="none" />
            <ellipse cx={46} cy={-340} rx={46} ry={56} fill="#B97A55" stroke="#5A3626" strokeWidth={6} />
            {[-30, -12, 6, 24].map((x, i) => <rect key={i} x={30 + x} y={-430} width={17} height={62} rx={8} fill="#B97A55" stroke="#5A3626" strokeWidth={5} />)}
          </g>
        </g>
      </g>
      <rect x={0} y={0} width={W} height={H} fill="#000" opacity={clamp(1 - bright)} />
      {/* the low-contrast milky veil of the blind years lifts as it clears */}
      <rect x={0} y={0} width={W} height={H} fill="#C9CCD0" opacity={0.5 * (1 - clear) * bright} />
      <rect x={0} y={0} width={W} height={H} fill={`url(#${id}vig)`} />
    </g>
  );
};
