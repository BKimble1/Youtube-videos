// A small, unobtrusive context tag ("LAB DEMONSTRATION", "STYLIZED RECREATION", "EXTERNAL MAGNETIC CONTROL", ...).
// Screen space, HTML (crisp text). Appears with a short slide + fade; keep it inside the Shorts safe area
// (x 40..860, y 120..1450) and away from faces and the key action. Use only where it prevents a misleading impression.
import React from 'react';
import {clamp} from '../lib';

export type TagTone = 'dark' | 'light' | 'warm' | 'field';
const TONES: Record<TagTone, {bg: string; fg: string; dot: string; border: string}> = {
  dark: {bg: 'rgba(11,21,38,0.78)', fg: '#FFFFFF', dot: '#46E6FF', border: 'rgba(255,255,255,0.22)'},
  light: {bg: 'rgba(255,255,255,0.86)', fg: '#13223A', dot: '#0FA3C8', border: 'rgba(19,34,58,0.25)'},
  warm: {bg: 'rgba(11,21,38,0.78)', fg: '#FFFFFF', dot: '#FF8A3D', border: 'rgba(255,138,61,0.45)'},
  field: {bg: 'rgba(11,21,38,0.78)', fg: '#FFFFFF', dot: '#5CC8FF', border: 'rgba(92,200,255,0.45)'},
};

/** visible while t in [t0, t1); fades in/out over `fade` s. (x, y) = the tag's left/centre (or right edge if align='right') */
export const Tag: React.FC<{text: string; t: number; t0: number; t1: number; x: number; y: number; tone?: TagTone; size?: number; align?: 'left' | 'center' | 'right'; fade?: number}> = ({
  text, t, t0, t1, x, y, tone = 'dark', size = 30, align = 'left', fade = 0.18,
}) => {
  const a = clamp((t - t0) / fade) * clamp((t1 - t) / fade);
  if (a <= 0) return null;
  const k = TONES[tone];
  const slide = (1 - clamp((t - t0) / (fade * 1.6))) * 14;
  const tx = align === 'left' ? '0%' : align === 'center' ? '-50%' : '-100%';
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(${tx}, -50%) translateY(${slide}px)`, opacity: a,
      background: k.bg, color: k.fg, border: `2px solid ${k.border}`, borderRadius: 999, padding: `${size * 0.28}px ${size * 0.62}px`,
      fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: size, letterSpacing: '0.06em',
      lineHeight: 1, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: size * 0.35, boxShadow: '0 4px 14px rgba(0,0,0,0.35)'}}>
      <span style={{width: size * 0.32, height: size * 0.32, borderRadius: 999, background: k.dot, display: 'inline-block'}} />
      {text}
    </div>
  );
};
