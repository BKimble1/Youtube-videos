import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import type {Sfx} from '../lib/sfx';
import {useG} from '../lib/SceneFrame';
import {at, scene} from '../lib/timeline';
import {E, tw} from '../lib/motion';
import {textWidth} from '../lib/measure';
import {CallbackArt} from '../components/v2s/V13_CallbackArt';

/**
 * V13 · End screen (s48; 10.0 s). v2/SHOTPLAN_V2.md V13: a rebuild of v1 S9_EndCard's idea (read, not imported) to the
 * shot plan's exact layout. Hard cut in on the J4 beat; the element space is clear from the first frame; s48 starts
 * 0.2 s in. Everything settles within 0.4 s and is then still, except one look-and-blink in the callback art in the
 * last 3 s (after "corner").
 *
 * Layout (1920 x 1080; double for 4K), all from END_LAYOUT below:
 *  - background: the channel's warm yellow #FFC744, flat;
 *  - wordmark FUTURE GOT WEIRD (Fredoka 700, GOT in coral, a saffron-deep underline bar), in x 120-900, y 96-260;
 *  - tagline "the strange future, explained" (44 px), x 120-900, y 276-330;
 *  - "watch next" (48 px, ink), x 1000-1500, y 214-270, outside the video element;
 *  - VIDEO ELEMENT GUIDE: a plain lighter panel with soft corners, x 1000-1800, y 290-740, nothing inside;
 *  - SUBSCRIBE ELEMENT GUIDE: a plain lighter disc, centre (430, 600), diameter 300, empty;
 *  - callback art x 640-940, y 560-930 (components/v2s/V13_CallbackArt);
 *  - kept clear: 24 px round both guides; y 950-1080 across the frame (s48's caption).
 */

const SC = scene('V13');
const K = {start: SC.from, end: SC.to, s48: at('s48', 'this'), corner: at('s48', 'corner', 1, 'end')};

export const END_LAYOUT = {
  bg: '#FFC744',
  guide: C.saffronLight,
  wordmark: {x0: 120, x1: 900, y0: 96, y1: 260, size: 112},
  tagline: {x0: 120, y0: 276, y1: 330, size: 44, text: 'the strange future, explained'},
  watchNext: {x0: 1000, y0: 214, y1: 270, size: 48, text: 'watch next'},
  video: {x0: 1000, y0: 290, x1: 1800, y1: 740, r: 30},
  subscribe: {cx: 430, cy: 600, r: 150},
  art: {x0: 640, y0: 560, x1: 940, y1: 930},
  clear: 24,
  captionTop: 950,
};
const L = END_LAYOUT;

/** the 0.4 s settle; then still until the look-and-blink */
const SETTLE = 12;
/** the look-and-blink, in the last 3 s and after the line ends: he looks from the video guide to the viewer, blinks,
 *  and looks back at the guide; then still to the last frame */
const LOOK0 = Math.max(K.end - 90, K.corner + 2);
const LOOK_IN = 6;
const BLINK0 = LOOK0 + LOOK_IN + 12;
const BLINK_DUR = 7; // 2 closing, 2 shut, 3 opening
const LOOK_BACK = BLINK0 + BLINK_DUR - 2;
const LOOK_OUT = 7;
if (!(LOOK0 >= K.end - 90 && LOOK_BACK + LOOK_OUT <= K.end - 20)) throw new Error(`V13: the look-and-blink (${LOOK0}..${LOOK_BACK + LOOK_OUT}) must sit in the last 3 s and end >= 20 frames before ${K.end}`);
if (!(K.s48 - K.start >= 4 && K.s48 - K.start <= 9)) throw new Error(`V13: s48 should start ~0.2 s in (it starts ${K.s48 - K.start} frames in)`);
// the guides keep 24 px clear of everything else: the wordmark, the tagline, "watch next", the art, the caption band
{
  const v = L.video;
  const d = L.subscribe;
  const a = L.art;
  const bad: string[] = [];
  if (!(L.watchNext.y1 <= v.y0 && L.wordmark.x1 + L.clear <= v.x0 && L.tagline.y1 < d.cy - d.r - L.clear)) bad.push('text vs guides');
  if (!(a.x0 >= d.cx + d.r + L.clear && a.x1 + L.clear <= v.x0 && a.y1 <= L.captionTop)) bad.push('art vs guides / caption band');
  if (!(v.y1 + L.clear <= L.captionTop && d.cy + d.r + L.clear <= L.captionTop)) bad.push('guides vs caption band');
  if (bad.length) throw new Error(`V13 layout: ${bad.join('; ')}`);
}

/** One logo landing as the end screen cuts in (the wordmark settles over 0.4 s); the music's resolve carries the rest. */
export const SFX: Sfx[] = [{f: K.start + 1, kind: 'logo_hit', gain: -5, note: 'the wordmark lands (end screen)'}];

const WORDS = ['FUTURE', 'GOT', 'WEIRD'] as const;
const GAP_EM = 0.24;
const BAR_EM = {top: 0.1, h: 0.17, over: 0.08};
const CAP_EM = 0.7; // Fredoka's cap height (measured on the render: see the QA report)

/** The wordmark's font size: 112 px, or less if the one-line mark (plus its bar's overhang) is wider than x 120-900. */
const wordmarkFit = () => {
  const w112 = WORDS.reduce((acc, w) => acc + textWidth(w, `700 112px "Fredoka Variable"`), 0) + 2 * GAP_EM * 112 + 2 * BAR_EM.over * 112;
  const size = Math.min(L.wordmark.size, Math.floor(((L.wordmark.x1 - L.wordmark.x0) / w112) * 112));
  return {size, w112};
};

export const V13EndScreen: React.FC = () => {
  const g = useG();
  const f = g - K.start;
  const {size} = wordmarkFit();
  // vertical: the mark (cap height + bar) centred in y 96-260
  const markH = (CAP_EM + BAR_EM.top + BAR_EM.h) * size;
  const capTop = L.wordmark.y0 + (L.wordmark.y1 - L.wordmark.y0 - markH) / 2;
  const baseline = capTop + CAP_EM * size;
  const x0 = L.wordmark.x0 + BAR_EM.over * size;
  const widths = WORDS.map((w) => textWidth(w, `700 ${size}px "Fredoka Variable"`));
  const xs = widths.map((_, i) => x0 + widths.slice(0, i).reduce((a, b) => a + b, 0) + i * GAP_EM * size);
  const textRight = xs[2] + widths[2];
  // the settle: the wordmark is there on the cut; each word grows 0.94 -> 1 about its centre (staggered 2 frames) and
  // the bar draws on; the tagline and "watch next" fade in quickly; all still by SETTLE
  const wordT = (i: number) => tw(f, i * 2, SETTLE - 4, E.out);
  const barT = tw(f, 1, SETTLE - 2, E.inOut);
  const tagT = tw(f, 2, 6, E.linear);
  const watchT = tw(f, 2, 6, E.linear);
  const peek = tw(f, 0, SETTLE, E.out);
  // the look-and-blink
  const look = Math.min(tw(g, LOOK0, LOOK_IN, E.inOut), 1 - tw(g, LOOK_BACK, LOOK_OUT, E.inOut));
  const u = g - BLINK0;
  const blink = u < 0 || u >= BLINK_DUR ? 1 : u < 2 ? 1 - E.inOut(u / 2) : u < 4 ? 0 : E.inOut((u - 4) / 3);
  const v = L.video;
  const d = L.subscribe;
  return (
    <AbsoluteFill style={{background: L.bg}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        {/* the element guides: plain lighter shapes, nothing inside (layout guides for the owner's YouTube elements) */}
        <rect x={v.x0} y={v.y0} width={v.x1 - v.x0} height={v.y1 - v.y0} rx={v.r} fill={L.guide} />
        <circle cx={d.cx} cy={d.cy} r={d.r} fill={L.guide} />
        {/* the wordmark's underline bar, behind the letters */}
        <rect
          x={L.wordmark.x0}
          y={baseline + BAR_EM.top * size}
          width={(textRight + BAR_EM.over * size - L.wordmark.x0) * barT}
          height={BAR_EM.h * size}
          rx={(BAR_EM.h * size) / 2}
          fill={C.saffronDeep}
          transform={`rotate(-1 ${(L.wordmark.x0 + L.wordmark.x1) / 2} ${baseline + BAR_EM.top * size})`}
        />
        {WORDS.map((w, i) => {
          const t = wordT(i);
          const cx = xs[i] + widths[i] / 2;
          const s = 0.94 + 0.06 * t;
          return (
            <text
              key={w}
              x={xs[i]}
              y={baseline}
              fontFamily={F.display}
              fontWeight={700}
              fontSize={size}
              fill={i === 1 ? C.coral : C.ink}
              
              transform={`translate(${cx} ${baseline}) scale(${s}) translate(${-cx} ${-baseline})`}
            >
              {w}
            </text>
          );
        })}
        <text x={L.watchNext.x0} y={L.watchNext.y1 - 14} fontFamily={F.display} fontWeight={600} fontSize={L.watchNext.size} fill={C.ink} opacity={watchT}>
          {L.watchNext.text}
        </text>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: L.tagline.x0,
          top: L.tagline.y0,
          height: L.tagline.y1 - L.tagline.y0,
          lineHeight: `${L.tagline.y1 - L.tagline.y0}px`,
          fontFamily: F.body,
          fontWeight: 800,
          fontSize: L.tagline.size,
          color: C.inkSoft,
          whiteSpace: 'nowrap',
          opacity: tagT,
        }}
      >
        {L.tagline.text}
      </div>
      <CallbackArt peek={peek} look={look} blink={blink} />
    </AbsoluteFill>
  );
};
