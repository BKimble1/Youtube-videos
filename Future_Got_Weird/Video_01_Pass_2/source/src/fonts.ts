import '@fontsource-variable/fredoka';
import '@fontsource-variable/nunito';
import '@fontsource-variable/nunito/wght-italic.css';
import '@fontsource-variable/source-serif-4';
import '@fontsource-variable/source-serif-4/wght-italic.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import {continueRender, delayRender} from 'remotion';

// Block rendering until every face is loaded, so no frame renders with a fallback font.
const handle = delayRender('Loading fonts');
const faces = [
  '400 32px "Fredoka Variable"', '600 32px "Fredoka Variable"', '700 32px "Fredoka Variable"',
  '400 32px "Nunito Variable"', '700 32px "Nunito Variable"', '800 32px "Nunito Variable"', 'italic 400 32px "Nunito Variable"',
  '400 32px "Source Serif 4 Variable"', '600 32px "Source Serif 4 Variable"', 'italic 400 32px "Source Serif 4 Variable"',
  '500 32px "JetBrains Mono"', '700 32px "JetBrains Mono"',
];
Promise.all(faces.map((f) => document.fonts.load(f, 'AaBb 0123 “”’')))
  .then(() => document.fonts.ready)
  .then(() => continueRender(handle))
  .catch((e) => {
    console.error('Font load failed', e);
    continueRender(handle);
  });
