// Gathers every scene's sound cues (built from the same cue constants as the animation) for tools/collect_sfx.mjs.
import {SFX as s1} from './scenes/S1Cold';
import {SFX as s2} from './scenes/S2Why';
import {SFX as s3} from './scenes/S3Film';
import {SFX as s4} from './scenes/S4Train';
import {SFX as s5} from './scenes/S5Real';
import {SFX as s6} from './scenes/S6Prove';
import {SFX as s7} from './scenes/S7React';
import {BOUNDS} from './Main';
import {NARRATION_END} from './lib/narration';
import {at} from './lib/narration';

export const collect = () => ({
  fps: 30,
  totalFrames: BOUNDS.total,
  sceneStarts: BOUNDS.starts,
  narrationEnd: NARRATION_END,
  mood: {curious: at('Start with the why'), training: at('Now the hard'), prove: at('So what does this prove'), reflect: at('So why is it so'), question: at('Does retiring')},
  cues: [...s1(), ...s2(), ...s3(), ...s4(), ...s5(), ...s6(), ...s7()].sort((a, b) => a.f - b.f),
});
