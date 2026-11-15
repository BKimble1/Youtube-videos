import '@fontsource-variable/nunito';
import '@fontsource-variable/fredoka';
import '@fontsource/jetbrains-mono';
import '@fontsource/noto-serif/greek-500.css';
import '@fontsource/noto-serif/latin-500.css';
import {continueRender, delayRender} from 'remotion';

// Block rendering until every face is loaded, so no frame renders with a fallback font.
const handle = delayRender('Loading fonts');
const faces = ['900 68px "Nunito Variable"', '800 32px "Nunito Variable"', '600 32px "Fredoka Variable"', '500 32px "Fredoka Variable"', '500 32px "Noto Serif"'];
Promise.all(faces.map((f) => document.fonts.load(f, 'AaBb 0123 …’ ΑΒΓΔΕϹΦΩ')))
  .then(() => document.fonts.ready)
  .then(() => continueRender(handle))
  .catch((e) => {
    console.error('Font load failed', e);
    continueRender(handle);
  });
