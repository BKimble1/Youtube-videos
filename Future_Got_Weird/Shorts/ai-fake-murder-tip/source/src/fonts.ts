// Type system: Montserrat ExtraBold (captions, UI labels; 600 for typed UI text) + Barlow Condensed ExtraBold (uppercase headlines).
// Bundled from @fontsource (no network at render). The render is held until both faces are loaded AND verified to differ from the fallback face.
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/barlow-condensed/800.css';
import {cancelRender, continueRender, delayRender} from 'remotion';

export const CAP_FONT = '"Montserrat", sans-serif';
export const HED_FONT = '"Barlow Condensed", sans-serif';

const probe = (font: string, weight = 800) => {
  const c = document.createElement('canvas').getContext('2d')!;
  c.font = `${weight} 100px ${font}, monospace`;
  const a = c.measureText('Mgsw ag').width;
  c.font = `${weight} 100px monospace`;
  const b = c.measureText('Mgsw ag').width;
  return {a, b};
};

if (typeof document !== 'undefined') {
  const handle = delayRender('fgw fonts');
  Promise.all([
    document.fonts.load('800 76px "Montserrat"'),
    document.fonts.load('600 40px "Montserrat"'),
    document.fonts.load('800 150px "Barlow Condensed"'),
  ])
    .then(() => document.fonts.ready)
    .then(() => {
      const ok = document.fonts.check('800 76px "Montserrat"') && document.fonts.check('600 40px "Montserrat"') && document.fonts.check('800 150px "Barlow Condensed"');
      const m = probe('"Montserrat"'), h = probe('"Barlow Condensed"');
      if (!ok || Math.abs(m.a - m.b) < 1 || Math.abs(h.a - h.b) < 1) throw new Error(`fonts not rendering: check=${ok} montserrat=${m.a}/${m.b} barlow=${h.a}/${h.b}`);
      continueRender(handle);
    })
    .catch((e) => cancelRender(e));
}
