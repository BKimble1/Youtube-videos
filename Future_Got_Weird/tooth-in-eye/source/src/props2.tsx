// V2 props: the penlight, and what he sees when his sight returns: his own hospital room and his own hands (the same
// skin and the same gown as the patient everywhere else; no other person).
import React from 'react';
import {clamp, hash, lerp, W, H} from './lib';
import {SKIN, SKIN_D} from './profile2';

const INK = '#2B2F36';
/** a penlight, from its lit tip back along `ang` (degrees); `on` lights it and casts its beam forward */
export const Penlight: React.FC<{id: string; x: number; y: number; ang: number; px: number; on: number; beam: number}> = ({id, x, y, ang, px, on, beam}) => (
  <g transform={`translate(${x},${y}) rotate(${ang})`}>
    <defs>
      <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5A6470" /><stop offset="0.4" stopColor="#2C333B" /><stop offset="1" stopColor="#4A535D" /></linearGradient>
      <linearGradient id={`${id}cone`} x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#FFF6D8" stopOpacity="0.55" /><stop offset="1" stopColor="#FFF6D8" stopOpacity="0" /></linearGradient>
    </defs>
    {on > 0 && <path d={`M0,-2.5 L${-beam},-${beam * 0.16 + 2.5} L${-beam},${beam * 0.16 + 2.5} L0,2.5 Z`} fill={`url(#${id}cone)`} opacity={on} />}
    <rect x={0} y={-3} width={90} height={6} rx={2.6} fill={`url(#${id}b)`} stroke={INK} strokeWidth={1.6 * px} />
    <rect x={0} y={-3.2} width={5} height={6.4} rx={1.2} fill="#B9C2CB" stroke={INK} strokeWidth={1.2 * px} />
    <rect x={30} y={-4.2} width={26} height={1.6} rx={0.8} fill="#B9C2CB" />
    <circle cx={-0.2} cy={0} r={2.2} fill={on > 0 ? '#FFFBEA' : '#9BA6B0'} />
  </g>
);

/** his view: the hospital room from his bed, his hands lifting in front of him */
export const View2: React.FC<{id: string; clear: number; bright: number; t: number; hands: number}> = ({id, clear, bright, t, hands}) => {
  const blur = lerp(46, 0, clear);
  const hy = lerp(520, 0, hands) + Math.sin(t * 3.1) * 6 * hands;
  const flex = Math.sin(t * 4.2) * 0.5 + 0.5;
  const hand = (s: number) => (
    // one forearm in the gown sleeve, palm toward him, fingers spread
    <g transform={`translate(${540 + s * 250},${1500 + hy}) scale(${s},1) rotate(${-12})`}>
      <path d="M-120,520 C-110,360 -80,220 -40,120 L70,140 C60,250 40,380 40,520 Z" fill="#A9C6D6" stroke={INK} strokeWidth={5} />
      {Array.from({length: 14}, (_, i) => <path key={i} d={`M${-90 + (i % 4) * 40 + (i > 7 ? 20 : 0)},${200 + Math.floor(i / 4) * 80} l10,16 l-10,16 l-10,-16 Z`} fill="#7FA2B6" opacity={0.7} />)}
      <path d="M-40,120 C-30,60 -20,10 0,-30 C40,-40 70,-20 80,10 C84,60 78,110 70,140 Z" fill={SKIN} stroke={INK} strokeWidth={5} />
      {[[-18, -150, -14], [12, -190, -4], [42, -180, 6], [70, -140, 16]].map(([fx, fy, a], i) => (
        <g key={i} transform={`rotate(${a + (i - 1.5) * 6 * flex} ${fx} -20)`}>
          <rect x={fx - 13} y={fy} width={26} height={-fy + 0} rx={13} fill={SKIN} stroke={INK} strokeWidth={5} />
          <path d={`M${fx - 9},${fy * 0.5} q9,-5 18,0`} stroke={SKIN_D} strokeWidth={3} fill="none" />
        </g>
      ))}
      <g transform={`rotate(${-40 - 10 * flex} -40 70)`}><rect x={-120} y={50} width={90} height={28} rx={14} fill={SKIN} stroke={INK} strokeWidth={5} /></g>
      <path d="M-20,70 C10,80 40,80 60,60" stroke={SKIN_D} strokeWidth={4} fill="none" />
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={`${id}wall`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#B9CFCB" /><stop offset="1" stopColor="#DCE8E2" /></linearGradient>
        <radialGradient id={`${id}vig`} cx="0.5" cy="0.45" r="0.66"><stop offset="0.6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.7" /></radialGradient>
        <filter id={`${id}bl`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={blur} /></filter>
      </defs>
      <g filter={blur > 0.3 ? `url(#${id}bl)` : undefined}>
        <rect x={0} y={0} width={W} height={H} fill={`url(#${id}wall)`} />
        {/* window with blinds and daylight */}
        <rect x={600} y={170} width={420} height={640} rx={10} fill="#FFF8E6" stroke="#9BAFB0" strokeWidth={16} />
        {Array.from({length: 11}, (_, i) => <rect key={i} x={608} y={190 + i * 56} width={404} height={16} fill="#E9E1CC" opacity={0.9} />)}
        <path d="M620,800 L700,520 L780,600 L900,420 L1000,560 L1000,800 Z" fill="#BFD9B4" opacity={0.55} />
        {/* IV pole and bag */}
        <rect x={150} y={150} width={12} height={1300} fill="#AEB8BE" />
        <path d="M110,190 L200,190" stroke="#AEB8BE" strokeWidth={10} />
        <rect x={120} y={210} width={70} height={110} rx={18} fill="#E6F1F4" stroke="#9FB3BA" strokeWidth={5} />
        <path d="M155,320 C150,420 175,520 165,640" stroke="#B7C7CC" strokeWidth={5} fill="none" />
        {/* a picture on the wall, a door */}
        <rect x={250} y={330} width={220} height={160} fill="#9DB6C9" stroke="#6E5A46" strokeWidth={12} />
        <path d="M262,478 L330,400 L380,450 L420,410 L460,478 Z" fill="#6D8F66" />
        <rect x={-40} y={420} width={160} height={900} fill="#C9B79C" stroke="#9C8A70" strokeWidth={10} />
        {/* bedside table: flowers, a glass of water */}
        <rect x={680} y={1020} width={360} height={60} rx={10} fill="#C8A57E" stroke="#8E6C4A" strokeWidth={8} />
        <rect x={700} y={1080} width={320} height={420} fill="#B8946C" stroke="#8E6C4A" strokeWidth={8} />
        <path d="M800,1020 L790,900 L850,900 L840,1020 Z" fill="#CFE3EA" stroke="#8FA9B2" strokeWidth={5} />
        {[[790, 860], [830, 820], [860, 870], [760, 820], [815, 780]].map(([fx, fy], i) => (
          <g key={i}><path d={`M820,900 L${fx},${fy + 20}`} stroke="#5E8A4E" strokeWidth={6} />
            {Array.from({length: 6}, (_, k) => {const a = (k / 6) * Math.PI * 2; return <ellipse key={k} cx={fx + Math.cos(a) * 16} cy={fy + Math.sin(a) * 16} rx={13} ry={9} transform={`rotate(${(a * 180) / Math.PI} ${fx + Math.cos(a) * 16} ${fy + Math.sin(a) * 16})`} fill="#F2C94C" stroke="#C99A2E" strokeWidth={3} />;})}
            <circle cx={fx} cy={fy} r={9} fill="#C9782E" /></g>
        ))}
        <rect x={925} y={930} width={60} height={90} rx={8} fill="rgba(210,235,245,0.7)" stroke="#8FA9B2" strokeWidth={5} />
        {/* the end of the bed and the blanket */}
        <path d="M0,1380 C300,1330 780,1330 1080,1380 L1080,1920 L0,1920 Z" fill="#E7EEF0" stroke="#AFC0C6" strokeWidth={8} />
        <path d="M0,1560 C300,1500 780,1500 1080,1560" stroke="#C9D6DA" strokeWidth={10} fill="none" />
        {hands > 0 && <g>{hand(-1)}{hand(1)}</g>}
      </g>
      <rect x={0} y={0} width={W} height={H} fill="#000" opacity={clamp(1 - bright)} />
      <rect x={0} y={0} width={W} height={H} fill="#C9CCD0" opacity={0.55 * (1 - clear) * bright} />
      <rect x={0} y={0} width={W} height={H} fill={`url(#${id}vig)`} />
    </g>
  );
};
