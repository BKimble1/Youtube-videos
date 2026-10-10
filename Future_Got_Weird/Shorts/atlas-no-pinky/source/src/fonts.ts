// Channel font roles: Fredoka display, Nunito body, Source Serif 4 quotes, JetBrains Mono tags. Bundled locally (no network at render).
import '@fontsource-variable/fredoka/index.css';
import '@fontsource-variable/nunito/index.css';
import '@fontsource-variable/source-serif-4/index.css';
import '@fontsource/jetbrains-mono/500.css';
import {cancelRender, continueRender, delayRender} from 'remotion';

const handle = delayRender('fonts');
Promise.all([
  document.fonts.load('700 100px "Fredoka Variable"'),
  document.fonts.load('600 100px "Fredoka Variable"'),
  document.fonts.load('800 40px "Nunito Variable"'),
  document.fonts.load('700 40px "Nunito Variable"'),
  document.fonts.load('500 30px "JetBrains Mono"'),
])
  .then(() => document.fonts.ready)
  .then(() => continueRender(handle))
  .catch((e) => cancelRender(e));
