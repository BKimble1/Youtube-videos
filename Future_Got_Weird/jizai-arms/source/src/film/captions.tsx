// Burned-in captions in the channel treatment (Glass Climbing V8 Captions8): Nunito 900, white with a dark stroke,
// emphasised words in saffron capitals. Each caption appears whole on its first word's onset (no fade), holds still,
// and is gone when the next one starts (or 0.35 s after its last word). Phrases are the locked narration, verbatim.
import React from 'react';
import words from '../data/words.json';

type W = {word: string; start: number; end: number};
const WS = (words as {words: W[]}).words;
// [first word index, last word index (inclusive), emphasised words (lower-case, punctuation stripped)]
const GROUPS: [number, number, string[]][] = [];
const PHRASES: [string, string[]][] = [
  ['If you put on this backpack,', ['backpack']],
  ['you can have six arms.', ['six', 'arms']],
  ['Four are robotic,', ['four', 'robotic']],
  ['and someone else can control them.', ['someone', 'else']],
  ['Researchers in Japan built', ['japan']],
  ['JIZAI ARMS,', ['jizai', 'arms']],
  ['a wearable rig with six sockets', ['six', 'sockets']],
  ['for detachable robot limbs.', ['detachable']],
  ['Move a miniature controller,', ['miniature']],
  ['and the full-sized arm follows.', ['follows']],
  ['That means another person', ['another', 'person']],
  ['can move the extra hand on your back', ['extra', 'hand']],
  ['while your real hands stay still.', ['still']],
  ['They even demonstrated', []],
  ['people removing their robotic arms', ['removing']],
  ['and swapping them.', ['swapping']],
  ["So now, borrowing someone's arm", ['borrowing']],
  ["doesn't have to be a figure of speech.", ['figure', 'of', 'speech']],
];
let k = 0;
for (const [text, emph] of PHRASES) {
  const n = text.split(' ').length;
  const got = WS.slice(k, k + n).map((w) => w.word).join(' ');
  if (got !== text) throw new Error(`caption mismatch: "${text}" vs "${got}"`);
  GROUPS.push([k, k + n - 1, emph]);
  k += n;
}
if (k !== WS.length) throw new Error('captions do not cover the narration');

export const CAPS = GROUPS.map(([a, b, emph], i) => ({
  text: WS.slice(a, b + 1).map((w) => w.word).join(' '),
  emph,
  start: WS[a].start,
  end: i + 1 < GROUPS.length ? Math.min(WS[GROUPS[i + 1][0]].start, WS[b].end + 0.35) : WS[b].end + 0.6,
}));
/** caption centre height per caption (px); keeps them off the action */
const Y_DEFAULT = 1700;
const YS: Record<number, number> = {};

export const Captions: React.FC<{t: number}> = ({t}) => {
  // quantise to frames like the renderer does
  const i = CAPS.findIndex((c) => t >= c.start - 1e-6 && t < c.end - 1e-6);
  if (i < 0) return null;
  const c = CAPS[i];
  const ws = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left: 70, width: 940, top: YS[i] ?? Y_DEFAULT, transform: 'translateY(-50%)', textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span
        style={{
          fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif',
          fontWeight: 900,
          fontSize: 70,
          lineHeight: 1.16,
          letterSpacing: '0.005em',
          color: '#FFFFFF',
          WebkitTextStroke: '11px rgba(6,9,14,0.94)',
          paintOrder: 'stroke fill',
          textShadow: '0 5px 16px rgba(0,0,0,0.6)',
        } as React.CSSProperties}
      >
        {ws.map((wd, j) => {
          const key = wd.toLowerCase().replace(/[^a-z']/g, '');
          const hi = c.emph.includes(key);
          return (
            <span key={j} style={{color: hi ? '#FFD84A' : '#FFFFFF'}}>
              {(hi ? wd.toUpperCase() : wd) + (j < ws.length - 1 ? ' ' : '')}
            </span>
          );
        })}
      </span>
    </div>
  );
};
