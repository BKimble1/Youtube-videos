import '@fontsource-variable/nunito';
import '@fontsource-variable/fredoka';
import {continueRender, delayRender} from 'remotion';

// Block rendering until the caption and game faces are loaded, so no frame renders with a fallback font.
const handle = delayRender('Loading fonts');
const faces = ['900 66px "Nunito Variable"', '700 22px "Fredoka Variable"'];
Promise.all(faces.map((f) => document.fonts.load(f, 'AaBb 0123 …’?')))
  .then(() => document.fonts.ready)
  .then(() => continueRender(handle))
  .catch((e) => {
    console.error('Font load failed', e);
    continueRender(handle);
  });
