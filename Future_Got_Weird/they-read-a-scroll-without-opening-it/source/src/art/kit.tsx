// Palette, type and the few on-screen labels this episode allows (specimen IDs, "Reconstruction", width guides,
// the translation line). Everything sits in screen space, never inside a camera transform.
import React from 'react';
import CUES from '../data/cues.json';
import {FPS} from '../lib/core';

export const FONT_BODY = '"Nunito Variable", sans-serif';
export const FONT_HEAD = '"Fredoka Variable", sans-serif';
export const FONT_GREEK = '"Noto Serif", serif';

export const K = {
  ink: '#162A32',
  inkSoft: '#3A5163',
  paper: '#F4EDE1', // museum / lab wall
  paperDeep: '#E6DCCB',
  bench: '#C9B79C',
  benchDeep: '#A8937A',
  saffron: '#FFC744',
  saffronDeep: '#E0A21B',
  teal: '#1CA7A0',
  tealDeep: '#0E7F79',
  coral: '#EF6B55',
  coralDeep: '#C94A36',
  green: '#21B883',
  white: '#FFFFFF',
  // the roll
  char: '#2B2522',
  charHi: '#4A3F38',
  charDeep: '#171311',
  // scan views
  scanBg: '#0F1A24',
  scanBg2: '#16263A',
  scanLine: '#C8D2DC',
  scanDim: '#5D6D7C',
  // the virtually unwrapped surface (scholar-facing rendering: grey papyrus, dark ink, black where nothing survives)
  sheet: '#B8AF9F',
  sheetHi: '#CCC4B5',
  sheetLo: '#9E9584',
  inkGreek: '#1B1714',
  void: '#0B0B0C',
  // historical reconstruction
  sepia: '#E9D8B4',
  sepiaDeep: '#C9AE7E',
  sepiaInk: '#5A4325',
};

/** small rounded chip used for specimen IDs and the "Reconstruction" marker */
export const Chip: React.FC<{x: number; y: number; text: string; color?: string; bg?: string; size?: number; opacity?: number; anchor?: 'start' | 'middle' | 'end'; dot?: string}> = ({
  x,
  y,
  text,
  color = K.ink,
  bg = 'rgba(255,255,255,0.92)',
  size = 26,
  opacity = 1,
  anchor = 'start',
  dot,
}) => {
  const w = text.length * size * 0.56 + (dot ? size * 1.1 : 0) + size * 1.1;
  const h = size * 1.6;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - h / 2} width={w} height={h} rx={h / 2} fill={bg} stroke={K.ink} strokeOpacity={0.25} strokeWidth={2} />
      {dot && <circle cx={x0 + size * 0.95} cy={y} r={size * 0.28} fill={dot} />}
      <text x={x0 + size * 0.55 + (dot ? size * 1.0 : 0)} y={y + size * 0.36} fontFamily={FONT_BODY} fontWeight={800} fontSize={size} fill={color}>
        {text}
      </text>
    </g>
  );
};

/** burned-in captions for the review cut (same line breaks as the SRT: two lines max, 42 characters) */
export const Captions: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const c = (CUES as {start: number; end: number; text: string}[]).find((q) => t >= q.start && t < q.end + 0.25);
  if (!c) return null;
  const words = c.text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const nx = (cur + ' ' + w).trim();
    if (nx.length > 42 && cur) {
      lines.push(cur);
      cur = w;
    } else cur = nx;
  }
  lines.push(cur);
  if (lines.length === 2) {
    let best = lines;
    let bs = 1e9;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      if (Math.max(a.length, b.length) > 42) continue;
      const sc = Math.max(a.length, b.length);
      if (sc < bs) {
        bs = sc;
        best = [a, b];
      }
    }
    lines.splice(0, 2, ...best);
  }
  const fade = Math.min(1, (t - c.start) / 0.08, (c.end + 0.25 - t) / 0.12);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 42, display: 'flex', justifyContent: 'center', opacity: Math.max(0, fade)}}>
      <div style={{background: 'rgba(22,42,50,0.80)', borderRadius: 18, padding: '8px 30px 10px', maxWidth: 1500, textAlign: 'center'}}>
        {lines.map((l, i) => (
          <div key={i} style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 44, lineHeight: '56px', color: '#FFFFFF', whiteSpace: 'nowrap'}}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};
