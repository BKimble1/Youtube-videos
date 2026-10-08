import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../../theme';
import {E} from '../../lib/motion';

/**
 * S9.4 · the end card: the channel wordmark (Video 01's Wordmark: FUTURE and WEIRD in ink, GOT in coral, Fredoka 700,
 * a saffron-deep underline bar) and this episode's tagline on warm yellow. Everything sits in the top third, so the
 * lower two thirds stay clear for YouTube's end-screen elements (video tiles, subscribe button).
 *
 * Pure function of its timing props (0..1 each).
 */

const f2 = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const pop = (t: number) => (t <= 0 ? 0.001 : t >= 1 ? 1 : Math.max(0.001, E.back(clamp01(t))));

export const END_CARD = {bg: '#FFC744', wordSize: 132, wordTop: 150, taglineTop: 330};

export type EndCardProps = {
  /** pop of FUTURE, GOT, WEIRD */
  words: [number, number, number];
  /** the underline bar draws on */
  underline: number;
  /** tagline parts: "The strange future," and "explained." */
  tagline: [number, number];
  /** the teal underline under "explained." */
  explainedLine: number;
};

export const EndCard: React.FC<EndCardProps> = ({words, underline, tagline, explainedLine}) => {
  const size = END_CARD.wordSize;
  return (
    <AbsoluteFill style={{background: END_CARD.bg}}>
      {/* wordmark */}
      <div style={{position: 'absolute', left: 0, right: 0, top: END_CARD.wordTop, textAlign: 'center'}}>
        <div style={{display: 'inline-block', position: 'relative', isolation: 'isolate'}}>
          <div style={{fontFamily: F.display, fontWeight: 700, fontSize: size, lineHeight: 1, color: C.ink, letterSpacing: '-0.01em', whiteSpace: 'nowrap'}}>
            {(['FUTURE', 'GOT', 'WEIRD'] as const).map((w, i) => (
              <span key={w} style={{display: 'inline-block', transform: `scale(${f2(pop(words[i]) * 1000) / 1000})`, color: i === 1 ? C.coral : C.ink, marginRight: i < 2 ? size * 0.24 : 0}}>
                {w}
              </span>
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              left: -size * 0.1,
              right: -size * 0.1,
              bottom: -size * 0.12,
              height: size * 0.18,
              background: C.saffronDeep,
              zIndex: -1,
              borderRadius: size * 0.09,
              transform: 'rotate(-1deg)',
              clipPath: `inset(0 ${f2((1 - clamp01(underline)) * 100)}% 0 0)`,
            }}
          />
        </div>
      </div>
      {/* tagline */}
      <div style={{position: 'absolute', left: 0, right: 0, top: END_CARD.taglineTop, textAlign: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 52, color: C.inkSoft, whiteSpace: 'nowrap'}}>
        <span style={{display: 'inline-block', opacity: clamp01(tagline[0]), transform: `translateY(${f2((1 - E.out(clamp01(tagline[0]))) * 14)}px)`}}>The strange future,</span>{' '}
        <span style={{display: 'inline-block', position: 'relative', isolation: 'isolate', color: C.ink, opacity: clamp01(tagline[1]), transform: `translateY(${f2((1 - E.out(clamp01(tagline[1]))) * 14)}px)`}}>
          explained.
          <span
            style={{
              position: 'absolute',
              left: -4,
              right: 10,
              bottom: 2,
              height: 9,
              borderRadius: 5,
              background: C.teal,
              zIndex: -1,
              clipPath: `inset(0 ${f2((1 - clamp01(explainedLine)) * 100)}% 0 0)`,
            }}
          />
        </span>
      </div>
    </AbsoluteFill>
  );
};
