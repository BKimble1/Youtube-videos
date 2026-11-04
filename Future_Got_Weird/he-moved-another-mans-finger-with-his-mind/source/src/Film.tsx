// The film: a table of sequences on the measured narration, plus burned-in captions for the review render.
// Each sequence is a pure function of the absolute frame (scenes never hold their own state).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import CUES from './data/cues.json';
import {FPS, T} from './lib/core';
import {FONT_BODY, INK, K} from './art/kit';
import {SCENES} from './shots/scenes';

export const sceneAt = (f: number) => {
  const t = f / FPS;
  let s = SCENES[0];
  for (const sc of SCENES) if (t >= sc.start()) s = sc;
  return s;
};

export const Captions: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const c = (CUES as {start: number; end: number; text: string}[]).find((q) => t >= q.start && t < q.end + 0.25);
  if (!c) return null;
  // the same line breaks as the SRT (two lines max, 42 characters)
  const words = c.text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const nx = (cur + ' ' + w).trim();
    if (nx.length > 42 && cur) { lines.push(cur); cur = w; } else cur = nx;
  }
  lines.push(cur);
  if (lines.length === 2) {
    // even out the two lines
    let best = lines, bs = 1e9;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
      if (Math.max(a.length, b.length) > 42) continue;
      const sc = Math.max(a.length, b.length);
      if (sc < bs) { bs = sc; best = [a, b]; }
    }
    lines.splice(0, 2, ...best);
  }
  const fade = Math.min(1, (t - c.start) / 0.08, (c.end + 0.25 - t) / 0.12);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 46, display: 'flex', justifyContent: 'center', opacity: Math.max(0, fade)}}>
      <div style={{background: 'rgba(22,42,50,0.78)', borderRadius: 18, padding: '10px 30px 12px', maxWidth: 1500, textAlign: 'center'}}>
        {lines.map((l, i) => (
          <div key={i} style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 46, lineHeight: '58px', color: '#FFFFFF', whiteSpace: 'nowrap'}}>{l}</div>
        ))}
      </div>
    </div>
  );
};

export const Frame: React.FC<{f: number; captions?: boolean}> = ({f, captions = true}) => {
  const S = sceneAt(f).C;
  return (
    <AbsoluteFill style={{background: K.paper}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
        <S f={f} />
      </svg>
      {captions && <Captions f={f} />}
    </AbsoluteFill>
  );
};

export const Film: React.FC<{captions?: boolean}> = ({captions = true}) => {
  const f = useCurrentFrame();
  return <Frame f={f} captions={captions} />;
};
export const FilmStill: React.FC<{t: number; captions?: boolean}> = ({t, captions = true}) => <Frame f={Math.round(t * FPS)} captions={captions} />;
export const Sheet: React.FC<{ts: number[]; cols?: number}> = ({ts, cols = 4}) => {
  const rows = Math.ceil(ts.length / cols);
  const w = 1920 / cols, h = w * 9 / 16;
  return (
    <AbsoluteFill style={{background: '#222'}}>
      {ts.map((t, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * w, top: Math.floor(i / cols) * h, width: w, height: h, overflow: 'hidden'}}>
          <div style={{transform: `scale(${1 / cols})`, transformOrigin: '0 0', width: 1920, height: 1080, position: 'relative'}}>
            <Frame f={Math.round(t * FPS)} captions />
          </div>
          <div style={{position: 'absolute', left: 6, top: 4, color: '#fff', fontFamily: 'monospace', fontSize: 18, background: 'rgba(0,0,0,.5)', padding: '0 4px'}}>{t.toFixed(2)}</div>
        </div>
      ))}
      {rows > 0 && null}
    </AbsoluteFill>
  );
};
export {INK, T};
