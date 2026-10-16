import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F} from '../theme';

export type Word = {w: string; s: number; e: number};
type Chunk = {words: Word[]; s: number; e: number};

/** Group narration words into short caption chunks: break on punctuation, or after `maxWords` / `maxChars`. */
export const chunkWords = (words: Word[], maxWords = 3, maxChars = 18): Chunk[] => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) out.push({words: cur, s: cur[0].s, e: cur[cur.length - 1].e});
    cur = [];
  };
  for (const w of words) {
    const chars = cur.map((x) => x.w).join(' ').length + w.w.length + 1;
    if (cur.length >= maxWords || (cur.length && chars > maxChars)) flush();
    cur.push(w);
    if (/[.?!,:…]$/.test(w.w)) flush();
  }
  flush();
  // each chunk stays up until the next starts (or a short tail after a long pause)
  return out.map((c, i) => ({...c, e: i + 1 < out.length ? Math.min(out[i + 1].s, c.e + 0.6) : c.e + 0.35}));
};

/** Burned-in captions on a cream plate; the word being spoken gets the saffron highlight. */
export const Captions: React.FC<{words: Word[]; y: number; size?: number; maxWords?: number; maxChars?: number; hidden?: (t: number) => boolean}> = ({
  words, y, size = 70, maxWords = 3, maxChars = 18, hidden,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const chunks = React.useMemo(() => chunkWords(words, maxWords, maxChars), [words, maxWords, maxChars]);
  const c = chunks.find((k) => t >= k.s - 0.06 && t < k.e);
  if (!c || (hidden && hidden(t))) return null;
  const pop = interpolate(t, [c.s - 0.06, c.s + 0.06], [0.92, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 0, width, top: y, display: 'flex', justifyContent: 'center', pointerEvents: 'none'}}>
      <div style={{
        transform: `scale(${pop})`, background: C.cream, border: `5px solid ${C.ink}`, borderRadius: size * 0.36,
        padding: `${size * 0.14}px ${size * 0.34}px`, boxShadow: `0 ${size * 0.1}px 0 ${C.shadow}`,
        fontFamily: F.display, fontWeight: 600, fontSize: size, color: C.ink, lineHeight: 1.12, whiteSpace: 'nowrap',
      }}>
        {c.words.map((w, i) => {
          const on = t >= w.s - 0.03 && t < (c.words[i + 1]?.s ?? c.e);
          return (
            <span key={i} style={{
              background: on ? C.saffron : 'transparent', borderRadius: size * 0.18, padding: `0 ${size * 0.08}px`,
              marginRight: i < c.words.length - 1 ? size * 0.14 : 0,
            }}>{w.w}</span>
          );
        })}
      </div>
    </div>
  );
};
