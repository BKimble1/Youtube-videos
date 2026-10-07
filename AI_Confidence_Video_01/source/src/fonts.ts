import '@fontsource-variable/inter';
import '@fontsource-variable/inter/wght-italic.css';
import '@fontsource-variable/source-serif-4';
import '@fontsource-variable/source-serif-4/wght-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import {continueRender, delayRender} from 'remotion';

// Block rendering until every face we use is loaded, so no frame renders with fallback fonts.
const handle = delayRender('Loading fonts');
const faces = [
  '400 32px "Inter Variable"', '600 32px "Inter Variable"', '800 32px "Inter Variable"', 'italic 400 32px "Inter Variable"',
  '400 32px "Source Serif 4 Variable"', '600 32px "Source Serif 4 Variable"', 'italic 400 32px "Source Serif 4 Variable"',
  '400 32px "JetBrains Mono"', '500 32px "JetBrains Mono"', '700 32px "JetBrains Mono"',
];
Promise.all(faces.map((f) => document.fonts.load(f, 'AaBb 0123 “”’')))
  .then(() => document.fonts.ready)
  .then(() => continueRender(handle))
  .catch((e) => {
    console.error('Font load failed', e);
    continueRender(handle);
  });
