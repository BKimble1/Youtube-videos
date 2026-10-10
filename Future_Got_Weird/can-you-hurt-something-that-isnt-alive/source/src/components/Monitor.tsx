import React from 'react';
import {C, F, OUTLINE} from '../theme';

/** Computer monitor cutout with a screen content slot. Used for the cold-open prop and the code reveal. */
export const Monitor: React.FC<{x: number; y: number; w: number; h: number; children?: React.ReactNode}> = ({x, y, w, h, children}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h}}>
    <div style={{position: 'absolute', inset: 0, background: C.cream, border: `${OUTLINE + 2}px solid ${C.ink}`, borderRadius: 26, boxShadow: `10px 12px 0 ${C.shadow}`}} />
    <div style={{position: 'absolute', left: 26, top: 24, right: 26, bottom: 46, overflow: 'hidden', borderRadius: 10, border: `${OUTLINE}px solid ${C.ink}`, background: C.teal}}>
      {children}
    </div>
    <div style={{position: 'absolute', left: w / 2 - 70, top: h - 36, width: 140, height: 30, background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 6}} />
    <div style={{position: 'absolute', left: w / 2 - 150, top: h - 14, width: 300, height: 22, background: C.cream, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 12, fontFamily: F.body}} />
  </div>
);

/**
 * Illustrated screen face (the thumbnail's metaphor). Worried brows and a tear: teaching metaphor, never a measurement.
 * `sad` 0..1 drives the brows and mouth.
 */
export const ScreenFace: React.FC<{sad?: number; w: number; h: number}> = ({sad = 1, w, h}) => (
  <svg width={w} height={h} viewBox="0 0 400 300" style={{position: 'absolute', left: 0, top: 0}}>
    <ellipse cx="128" cy="150" rx="48" ry="56" fill={C.white} stroke={C.ink} strokeWidth="6" />
    <ellipse cx="282" cy="150" rx="48" ry="56" fill={C.white} stroke={C.ink} strokeWidth="6" />
    <circle cx="136" cy="160" r="22" fill={C.ink} />
    <circle cx="290" cy="160" r="22" fill={C.ink} />
    <circle cx="143" cy="152" r="6" fill={C.white} />
    <circle cx="297" cy="152" r="6" fill={C.white} />
    <path d={`M92 ${92 + (1 - sad) * 0} L164 ${112 - sad * 6}`} stroke={C.ink} strokeWidth="9" strokeLinecap="round" />
    <path d={`M236 ${110 - sad * 6} L308 ${92}`} stroke={C.ink} strokeWidth="9" strokeLinecap="round" />
    <path d="M168 232 Q200 214 232 232" fill="none" stroke={C.ink} strokeWidth="8" strokeLinecap="round" transform={`translate(0 ${sad * 6})`} />
    <path d="M318 196 Q326 216 318 226 Q310 216 318 196 Z" fill="#7FC8F0" stroke={C.ink} strokeWidth="4" opacity={sad} />
  </svg>
);

/**
 * The peeled binary covering. `peel` 0 = covering fully on, 1 = gone. It lifts from the left edge and rolls.
 */
export const Covering: React.FC<{peel: number; w: number; h: number}> = ({peel, w, h}) => {
  const left = Math.max(0, Math.min(1, peel)) * w;
  const digits: string[] = [];
  for (let r = 0; r < 9; r++) {
    let row = '';
    for (let c = 0; c < 12; c++) row += ((r * 7 + c * 5 + r * c) % 3 === 0 ? '1' : '0') + ' ';
    digits.push(row);
  }
  return (
    <div style={{position: 'absolute', left, top: 0, width: w - left, height: h, background: C.ink, overflow: 'hidden', fontFamily: F.mono, fontWeight: 700, color: C.cream, fontSize: 40}}>
      <div style={{position: 'absolute', left: 30 - left * 0, top: 40, lineHeight: '64px', letterSpacing: 6, whiteSpace: 'pre'}}>{digits.join('\n')}</div>
      <div style={{position: 'absolute', left: -6, top: 0, width: 46, height: h, background: 'linear-gradient(90deg, #5B6B73, #2C3D45)', opacity: peel > 0 && peel < 1 ? 1 : 0.0}} />
    </div>
  );
};
