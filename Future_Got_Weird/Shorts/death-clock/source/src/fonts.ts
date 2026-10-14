// Fredoka (the Future Got Weird display face, Video 01 theme) for captions and on-screen labels; Barlow Condensed
// for the device UI. Bundled from @fontsource (no network at render). Rendering waits until both faces are loaded
// and verified to differ from the fallback face.
import '@fontsource-variable/fredoka';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import {cancelRender, continueRender, delayRender} from 'remotion';

export const CAP_FONT = '"Fredoka Variable", sans-serif';
export const CAP_FAMILY = '"Fredoka Variable"';
export const CAP_WEIGHT = 600;
export const UI_FONT = '"Barlow Condensed", sans-serif';

const probe = (font: string, w: number) => {
  const c = document.createElement('canvas').getContext('2d')!;
  c.font = `${w} 100px ${font}, monospace`;
  const a = c.measureText('Mgsw ag 0123').width;
  c.font = `${w} 100px monospace`;
  const b = c.measureText('Mgsw ag 0123').width;
  return Math.abs(a - b);
};

if (typeof document !== 'undefined') {
  const handle = delayRender('fonts');
  Promise.all([
    document.fonts.load('600 70px "Fredoka Variable"'),
    document.fonts.load('600 70px "Barlow Condensed"'),
    document.fonts.load('700 70px "Barlow Condensed"'),
    document.fonts.load('800 70px "Barlow Condensed"'),
  ])
    .then(() => document.fonts.ready)
    .then(() => {
      if (probe('"Fredoka Variable"', 600) < 1 || probe('"Barlow Condensed"', 700) < 1) throw new Error('fonts not rendering');
      continueRender(handle);
    })
    .catch((e) => cancelRender(e));
}
