// V4 burned-in captions: the channel treatment (glass-climbing V8 / invisibility-shield CaptionsV2: Nunito Black, white
// with a dark stroke, key words in yellow capitals) on the locked narration (tools/make_captions_v3.py →
// data/captions_v3.json). Drawn in screen space, never inside a camera transform. A caption appears whole on its first
// frame (no fade), holds perfectly still, and is gone on the frame it hides. Show and hide fall on whole frames: on a
// cut when one is within two frames, and a caption whose last word has ended hides on the next cut, so a phrase
// never trails into the next shot. Placement is per caption (checked on contact sheets at each caption's start, middle
// and end), with a per-shot change only where a caption spans a cut into a shot that needs a different spot.
import React from 'react';
import CAPS from '../data/captions_v4.json';
import {FPS} from '../lib';
import {SHOTS2, CUTS} from './film4';
import {G_CUTS} from './assist4';

type Cap = {text: string; emph: string[]; start: number; end: number; show: number; hide: number};
const CAPTIONS = (CAPS as {captions: Cap[]}).captions;

const LOW = 1500; // lower third: the game's open ground, chin or shirt in close-ups, desk or lap in the room
const GAP = 935; // the dark band between the mouth panel (ends 880) and the game panel (starts 990) in the split-screen demo
const TOP = 330; // (V4) the versus round: above the action (hands, controllers, Zip and the falling controller are all low or central)
const CHEST = 1250; // the ending: on the chest, clear of the faces, the eyes and the falling controller
/** [first words, centre y, per-shot placements from a cut on: [cut time (s), y]] */
const PLACE: () => [string, number, [number, number][]?][] = () => [
  ['If you put', LOW], ['you can play', LOW], ['with your', LOW], ['Seriously', LOW], ['Watch', LOW],
  ["It's called", LOW], ['And that', LOW], ["It's a", LOW], ['sitting on', LOW],
  ['Move your', GAP], ['your character', GAP, [[CUTS.E1, LOW]]],
  ['Tilt', LOW], ['you AIM', LOW], ['Press', GAP], ['you CLICK', GAP], // (V4) the press demo is a split too
  ['And people', TOP], ['to control', TOP], ['without', LOW], ['But here', LOW], // (V4) the montage: above the monitor, clear of the phone
  ['Close', LOW], ['and nobody', LOW], ['the controller', TOP],
  ['So imagine', TOP], ['to someone', TOP], ['just sitting', TOP],
  ['With their', CHEST],
];

let cache: {cuts: number[]; spans: {i: number; a: number; b: number; y: number; per: [number, number][]}[]} | null = null;
const build = () => {
  if (cache) return cache;
  const cuts = [...SHOTS2.map((s) => s.a), G_CUTS[1], G_CUTS[2]].filter((s) => s > 0).map((s) => Math.ceil(s * FPS - 1e-9)) /* (V4) a shot's first frame is the first frame at or after its start */.sort((p, q) => p - q);
  const snap = (s: number) => {
    const f = s * FPS;
    const c = cuts.find((k) => Math.abs(k - f) <= 2);
    return c ?? Math.round(f);
  };
  const place = PLACE();
  if (place.length !== CAPTIONS.length) throw new Error('caption placement table out of step');
  const spans = CAPTIONS.map((c, i) => {
    const [first, y, per] = place[i];
    if (!c.text.startsWith(first)) throw new Error(`caption table out of step at ${i}: ${c.text}`);
    const a = i === 0 ? 0 : snap(c.show);
    let b = snap(c.hide);
    // a phrase that has been fully spoken leaves on the next cut instead of trailing into the next shot
    const endF = c.end * FPS;
    const cutAfter = cuts.find((k) => k >= endF && k > a && k < b);
    if (cutAfter !== undefined) b = cutAfter;
    return {i, a, b, y, per: (per ?? []).map(([s, py]) => [snap(s), py] as [number, number])};
  });
  for (let k = 1; k < spans.length; k++) if (spans[k].a < spans[k - 1].b) spans[k - 1].b = spans[k].a;
  cache = {cuts, spans};
  return cache;
};

/** the caption showing on a frame, with its placement (exported for QA) */
export const capAt4 = (frame: number) => {
  const s = build().spans.find((q) => frame >= q.a && frame < q.b);
  if (!s) return null;
  let y = s.y;
  for (const [from, py] of s.per) if (frame >= from) y = py;
  return {i: s.i, y, a: s.a, b: s.b, text: CAPTIONS[s.i].text};
};

export const Captions4: React.FC<{frame: number}> = ({frame}) => {
  const a = capAt4(frame);
  if (!a) return null;
  const c = CAPTIONS[a.i];
  const words = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left: 96, width: 888, top: a.y, transform: 'translateY(-50%)', textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span style={{fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 900, fontSize: 66, lineHeight: 1.16, letterSpacing: '0.005em', color: '#FFFFFF',
        WebkitTextStroke: '10px rgba(6,9,14,0.94)', paintOrder: 'stroke fill', textShadow: '0 5px 16px rgba(0,0,0,0.6)'} as React.CSSProperties}>
        {words.map((wd, k) => {
          const key = wd.toLowerCase().replace(/[^a-z']/g, '');
          const hi = c.emph.includes(key);
          return <span key={k} style={{color: hi ? '#FFD84A' : '#FFFFFF'}}>{(hi ? wd.toUpperCase() : wd) + (k < words.length - 1 ? ' ' : '')}</span>;
        })}
      </span>
    </div>
  );
};
