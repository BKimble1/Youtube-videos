// V4 type system: Montserrat ExtraBold (captions, sentence case) + Barlow Condensed ExtraBold (uppercase headlines, large numbers).
// Bundled from @fontsource (no network at render). The render is held until both faces are loaded AND verified to differ from the fallback face.
import '@fontsource/montserrat/800.css';
import '@fontsource/barlow-condensed/800.css';
import {cancelRender, continueRender, delayRender} from 'remotion';

export const CAP_FONT = '"Montserrat", sans-serif';
export const HED_FONT = '"Barlow Condensed", sans-serif';

const probe = (font: string) => {
  const c = document.createElement('canvas').getContext('2d')!;
  c.font = `800 100px ${font}, monospace`;
  const a = c.measureText('Mgsw ag').width;
  c.font = '800 100px monospace';
  const b = c.measureText('Mgsw ag').width;
  return {a, b};
};

if (typeof document !== 'undefined') {
  const handle = delayRender('v4 fonts');
  Promise.all([document.fonts.load('800 76px "Montserrat"'), document.fonts.load('800 150px "Barlow Condensed"')])
    .then(() => document.fonts.ready)
    .then(() => {
      const ok = document.fonts.check('800 76px "Montserrat"') && document.fonts.check('800 150px "Barlow Condensed"');
      const m = probe('"Montserrat"'), h = probe('"Barlow Condensed"');
      if (!ok || Math.abs(m.a - m.b) < 1 || Math.abs(h.a - h.b) < 1) throw new Error(`V4 fonts not rendering: check=${ok} montserrat=${m.a}/${m.b} barlow=${h.a}/${h.b}`);
      continueRender(handle);
    })
    .catch((e) => cancelRender(e));
}
