import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';

/**
 * Text measurement for layouts that need to know where a word sits (a ring drawn round a name, a highlight that has
 * to travel to another document). Fonts are loaded before the first frame is captured (see fonts.ts), but a component
 * may render once before they arrive, so `useFontsReady` holds the frame and re-renders when they are ready.
 */
export const useFontsReady = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('measure: waiting for fonts'));
  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => {
      if (!live) return;
      setReady(true);
      continueRender(handle);
    });
    return () => {
      live = false;
    };
  }, [handle]);
  return ready;
};

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

/** Advance width in px of `text` set in a CSS font shorthand, e.g. '600 54px "Source Serif 4 Variable"'. */
export const textWidth = (text: string, font: string) => {
  const key = font + '|' + text;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return text.length * 0.5 * parseFloat(font.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? '32');
  ctx.font = font;
  const w = ctx.measureText(text).width;
  if (document.fonts.check(font, text)) cache.set(key, w);
  return w;
};
