// The clinic room (FGW warm paper look): wall, window light, desk, a large model display and a scan lightbox.
// World is 1920×1080 at z = 1. The big display's screen centre is DISPLAY.{x,y}; its content draws in screen-local
// units (w × h) and is passed in as children.
import React from 'react';
import {C, M} from '../theme';
import {Monitor, MriSlice} from '../art/digital';

export const DISPLAY = {x: 780, y: 450, w: 1040, h: 600};
export const LIGHTBOX = {x: 1360, y: 330};

export const ClinicRoom: React.FC<{t: number; children?: React.ReactNode; lightbox?: number; glow?: number}> = ({t, children, lightbox = 1, glow = 0}) => (
  <g>
    <rect x={-2000} y={-1500} width={6000} height={4000} fill={C.paper} />
    {/* wall panels */}
    {[-1200, -400, 400, 1200, 2000, 2800].map((x, i) => <rect key={i} x={x} y={-1500} width={780} height={2400} fill={i % 2 ? C.paperDeep : C.paper} opacity={0.6} />)}
    {/* window with soft daylight */}
    <g transform="translate(1660 120)">
      <rect x={-150} y={-170} width={300} height={360} rx={12} fill={C.blueLight} stroke={C.ink} strokeWidth={6} />
      <line x1={0} y1={-170} x2={0} y2={190} stroke={C.ink} strokeWidth={5} />
      <line x1={-150} y1={10} x2={150} y2={10} stroke={C.ink} strokeWidth={5} />
      <path d="M -150 190 L -420 980 L 380 980 L 150 190 Z" fill="#FFFFFF" opacity={0.12} />
    </g>
    {/* desk */}
    <rect x={-1200} y={880} width={4400} height={40} rx={10} fill={C.wood} stroke={C.ink} strokeWidth={6} />
    <rect x={-1200} y={920} width={4400} height={900} fill={C.woodDeep} />
    {/* scan lightbox with two illustrative slices */}
    {lightbox > 0.01 && (
      <g transform={`translate(${LIGHTBOX.x} ${LIGHTBOX.y})`} opacity={lightbox}>
        <rect x={-190} y={-130} width={380} height={260} rx={14} fill="#EAF6FA" stroke={C.ink} strokeWidth={6} />
        <g transform="translate(-88 0) scale(0.5)"><MriSlice w={320} h={420} level={0.45} seed={3} frame={false} /></g>
        <g transform="translate(88 0) scale(0.5)"><MriSlice w={320} h={420} level={0.6} seed={5} frame={false} /></g>
      </g>
    )}
    <g transform={`translate(${DISPLAY.x} ${DISPLAY.y})`}>
      <Monitor w={DISPLAY.w} h={DISPLAY.h} id="clinicDisplay" glow={glow}>{children}</Monitor>
    </g>
    {/* desk props */}
    <g transform="translate(1180 880)">
      <rect x={-60} y={-22} width={120} height={22} rx={6} fill={C.coral} stroke={C.ink} strokeWidth={5} />
      <rect x={-50} y={-38} width={100} height={18} rx={6} fill={C.saffron} stroke={C.ink} strokeWidth={5} />
    </g>
    <g transform="translate(260 880)">
      <path d="M -34 0 L -28 -70 L 28 -70 L 34 0 Z" fill="#FFFFFF" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M 28 -54 q 26 4 22 22 q -4 14 -24 12`} fill="none" stroke={C.ink} strokeWidth={5} />
      {t > -1 && <path d={`M -10 -84 q 6 -12 0 -24 M 8 -84 q 6 -12 0 -24`} fill="none" stroke={C.inkMuted} strokeWidth={3} opacity={0.5} />}
    </g>
  </g>
);
export const SCREEN_BG = M.screen;
