// His old home: a quiet hallway lit by one window, with the family's photographs hung in order across the decades
// he was away, ending on a memorial portrait (candle, flowers, a black ribbon on the frame). World units: px.
import React from 'react';
import {mix} from '../core/color';
import {clamp, hash} from '../lib';
import {INK, OUT} from './crew';
import {Bust} from './figures';

export const FLOOR = 1560;
export const PHOTOS = [470, 900, 1330];
export const MEMORIAL = {x: 1840, y: 820};
const RED = '#C0392B', BROWN = '#B8743A';
const SKIN_F = '#F2C9A8', SKIN_M = '#F7D9C4';

const Frame: React.FC<{x: number; y: number; w: number; h: number; tone: number; id: string; children: React.ReactNode; ribbon?: boolean}> = ({x, y, w, h, tone, id, children, ribbon}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-w / 2 - 22} y={-h / 2 - 22} width={w + 44} height={h + 44} rx={6} fill={ribbon ? '#2B2B33' : '#8A5A3B'} stroke={INK} strokeWidth={OUT} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={mix('#DCEAF2', '#E9D8B8', tone)} stroke={INK} strokeWidth={3} />
    <clipPath id={`${id}-ph`}><rect x={-w / 2} y={-h / 2} width={w} height={h} /></clipPath>
    <g clipPath={`url(#${id}-ph)`}>
      {children}
      {/* the print yellows with age */}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#C9A66B" opacity={0.28 * tone} />
    </g>
    <path d={`M ${-w / 2 + 10} ${-h / 2 + 30} L ${-w / 2 + 40} ${-h / 2 + 10}`} stroke="#FFF" strokeWidth={6} opacity={0.35} strokeLinecap="round" />
    {ribbon && <path d={`M ${w / 2 - 50} ${-h / 2 - 22} L ${w / 2 + 22} ${-h / 2 - 22} L ${w / 2 + 22} ${-h / 2 + 50} Z`} fill="#111" stroke={INK} strokeWidth={3} />}
  </g>
);

export const Hallway: React.FC<{t: number; id: string; candle?: number}> = ({t, id}) => {
  const fl = 1 + 0.12 * Math.sin(t * 23) + 0.08 * Math.sin(t * 37);
  return (
    <g>
      {/* wall: faded striped wallpaper */}
      <rect x={-1200} y={-600} width={4600} height={FLOOR + 600} fill="#C8B9A4" />
      {Array.from({length: 46}, (_, k) => <rect key={k} x={-1200 + k * 100} y={-600} width={40} height={FLOOR + 600} fill="#BCAB94" />)}
      <rect x={-1200} y={1130} width={4600} height={22} fill="#9C8466" stroke={INK} strokeWidth={3} />
      <rect x={-1200} y={1152} width={4600} height={FLOOR - 1152} fill="#B49C80" />
      {/* window with a light shaft and dust */}
      <g>
        <rect x={-40} y={420} width={260} height={420} rx={8} fill="#E6F2F6" stroke={INK} strokeWidth={OUT} />
        <line x1={90} y1={420} x2={90} y2={840} stroke={INK} strokeWidth={4} />
        <line x1={-40} y1={630} x2={220} y2={630} stroke={INK} strokeWidth={4} />
        <path d={`M -40 840 L 220 840 L 900 ${FLOOR} L 260 ${FLOOR} Z`} fill="#FFF3D6" opacity={0.18} />
        {Array.from({length: 24}, (_, k) => {
          const x = 120 + hash(k * 3.3) * 600 + Math.sin(t * 0.6 + k) * 20, y = 900 + hash(k * 7.1) * 600 - ((t * 14 + k * 30) % 200);
          return <circle key={k} cx={x} cy={y} r={2.5} fill="#FFF6E0" opacity={0.55} />;
        })}
      </g>
      {/* photographs, left to right through the decades */}
      <Frame x={PHOTOS[0]} y={760} w={300} h={240} tone={0.85} id={`${id}-p0`}>
        <g transform="translate(-95 70) scale(0.62)"><Bust skin={SKIN_F} hair="spiky" hairColor={RED} age={0.3} shirt="#2E3F5C" id={`${id}-a0`} /></g>
        <g transform="translate(-10 78) scale(0.58)"><Bust skin={SKIN_M} hair="bob" hairColor={BROWN} age={0.25} shirt="#D3E1F8" id={`${id}-a1`} /></g>
        <g transform="translate(78 64) scale(0.6)"><Bust skin={SKIN_F} hair="spiky" hairColor={RED} age={0} shirt="#FFFFFF" id={`${id}-a2`} /></g>
        <g transform="translate(40 110) scale(0.42)"><Bust skin={SKIN_M} hair="bob" hairColor={RED} age={0} shirt="#FFC744" id={`${id}-a3`} /></g>
      </Frame>
      <Frame x={PHOTOS[1]} y={780} w={260} h={300} tone={0.55} id={`${id}-p1`}>
        <g transform="translate(-62 96) scale(0.66)"><Bust skin={SKIN_F} hair="spiky" hairColor={RED} age={0.62} shirt="#2E3F5C" id={`${id}-b0`} /></g>
        <g transform="translate(18 100) scale(0.62)"><Bust skin={SKIN_M} hair="bob" hairColor={BROWN} age={0.55} shirt="#D3E1F8" id={`${id}-b1`} /></g>
        <g transform="translate(86 108) scale(0.6)"><Bust skin={SKIN_M} hair="bob" hairColor={RED} age={0.12} shirt="#FFC744" id={`${id}-b2`} /></g>
      </Frame>
      <Frame x={PHOTOS[2]} y={760} w={300} h={250} tone={0.25} id={`${id}-p2`}>
        <g transform="translate(-70 80) scale(0.66)"><Bust skin={SKIN_M} hair="bob" hairColor={BROWN} age={0.85} shirt="#EF6B55" id={`${id}-c0`} glasses={1} /></g>
        <g transform="translate(30 76) scale(0.64)"><Bust skin={SKIN_M} hair="bob" hairColor={RED} age={0.5} shirt="#FFC744" id={`${id}-c1`} /></g>
        <g transform="translate(100 112) scale(0.42)"><Bust skin={SKIN_F} hair="spiky" hairColor={RED} age={0} shirt="#1CA7A0" id={`${id}-c2`} /></g>
      </Frame>
      {/* memorial: the last portrait, ribbon, candle, flowers */}
      <Frame x={MEMORIAL.x} y={MEMORIAL.y} w={240} h={290} tone={0.05} id={`${id}-m`} ribbon>
        <rect x={-120} y={-145} width={240} height={290} fill="#D9DDE3" />
        <g transform="translate(0 70) scale(0.95)"><Bust skin={SKIN_M} hair="bob" hairColor={BROWN} age={1} shirt="#EF6B55" id={`${id}-m0`} glasses={1} e={{mouth: 'soft'}} /></g>
      </Frame>
      <g transform={`translate(${MEMORIAL.x} 0)`}>
        <rect x={-230} y={1160} width={460} height={34} rx={6} fill="#6B4630" stroke={INK} strokeWidth={OUT} />
        <rect x={-200} y={1194} width={26} height={FLOOR - 1194} fill="#5A3A28" stroke={INK} strokeWidth={3} />
        <rect x={174} y={1194} width={26} height={FLOOR - 1194} fill="#5A3A28" stroke={INK} strokeWidth={3} />
        {/* candle */}
        <rect x={-150} y={1060} width={44} height={100} rx={6} fill="#FFFBF0" stroke={INK} strokeWidth={3} />
        <ellipse cx={-128} cy={1060 - 24 * fl} rx={9} ry={20 * fl} fill="#FFC744" />
        <ellipse cx={-128} cy={1060 - 18 * fl} rx={4.5} ry={10 * fl} fill="#FFFBF0" />
        <circle cx={-128} cy={1040} r={70} fill="#FFE7A6" opacity={0.13} />
        {/* flowers in a vase */}
        <path d="M 100 1160 L 92 1080 Q 120 1066 148 1080 L 140 1160 Z" fill="#4F7CC9" stroke={INK} strokeWidth={3} />
        {[[-20, -70], [8, -96], [36, -74], [56, -100], [70, -60]].map(([dx, dy], k) => (
          <g key={k}>
            <path d={`M 120 1080 Q ${100 + dx} ${1060 + dy * 0.5} ${100 + dx} ${1080 + dy}`} fill="none" stroke="#3F8A55" strokeWidth={4} />
            <circle cx={100 + dx} cy={1080 + dy} r={13} fill={['#FFFBF0', '#EF6B55', '#FFFBF0', '#FFC744', '#FFFBF0'][k]} stroke={INK} strokeWidth={2.5} />
            <circle cx={100 + dx} cy={1080 + dy} r={4} fill="#E9A91C" />
          </g>
        ))}
      </g>
      {/* floor */}
      <rect x={-1200} y={FLOOR} width={4600} height={900} fill="#8A6246" stroke={INK} strokeWidth={OUT} />
      {Array.from({length: 30}, (_, k) => <line key={k} x1={-1200 + k * 160} y1={FLOOR} x2={-1500 + k * 190} y2={FLOOR + 900} stroke={INK} strokeWidth={3} opacity={0.2} />)}
      {/* dim room: a gentle vignette in world space */}
      <rect x={-1200} y={-600} width={4600} height={FLOOR + 1500} fill="#1A1424" opacity={clamp(0.12)} />
    </g>
  );
};
