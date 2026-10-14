// UI-CHIP: one compact attribution/label chip. Slides in, then holds still so it can be read.
import React from 'react';
import {clamp01} from '../engine/math';
import {C, F} from '../../theme';

export const Chip: React.FC<{x: number; y: number; lines: string[]; appear?: number; tone?: 'ink' | 'paper' | 'blue' | 'teal'; size?: number; anchor?: 'left' | 'right'; out?: number}> = ({x, y, lines, appear = 1, tone = 'ink', size = 30, anchor = 'left', out}) => {
  const a = clamp01(appear / 0.35);
  const e = 1 - Math.pow(1 - a, 3);
  const o = out !== undefined ? 1 - clamp01(out / 0.25) : 1;
  const pal = tone === 'ink' ? {bg: '#162A32', fg: '#FAF3DF', bd: '#0B171C'} : tone === 'blue' ? {bg: '#3A5FA0', fg: '#FFFFFF', bd: '#24406F'} : tone === 'teal' ? {bg: C.teal, fg: '#FFFFFF', bd: C.tealDeep} : {bg: C.paper, fg: C.ink, bd: C.ink};
  return (
    <div style={{position: 'absolute', left: anchor === 'left' ? x : undefined, right: anchor === 'right' ? 1920 - x : undefined, top: y, opacity: e * o,
      transform: `translateY(${(1 - e) * 24}px)`, background: pal.bg, color: pal.fg, border: `3px solid ${pal.bd}`, borderRadius: 14,
      padding: '12px 22px', fontFamily: F.body, fontWeight: 800, fontSize: size, letterSpacing: 0.5, lineHeight: 1.25, whiteSpace: 'nowrap', boxShadow: '0 6px 0 rgba(0,0,0,0.25)'}}>
      {lines.map((l, i) => <div key={i} style={i > 0 ? {fontWeight: 700, fontSize: size * 0.8, opacity: 0.85} : undefined}>{l}</div>)}
    </div>
  );
};
