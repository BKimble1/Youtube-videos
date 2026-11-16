// Word times (s) used by the picture and the sound, all measured on the narration take (src/data/timeline.json).
import {W} from './lib';

export const T = {
  this: W('this', 1), mouth1: W('mouth', 1), you2: W('you', 2), play: W('play'), video1: W('video', 1), games: W('games'), tongue1: W('tongue', 1),
  seriously: W('seriously'), watch: W('watch'), this2: W('this', 2),
  its: W("it's", 1), called: W('called'), mouthpad: W('mouthpad'), and1: W('and', 1), tiny: W('tiny'), gold: W('gold'), square: W('square'),
  its2: W("it's", 2), touchpad: W('touchpad'), sitting1: W('sitting', 1), roof: W('roof'), mouth2: W('mouth', 2),
  move: W('move'), tongue2: W('tongue', 2), character: W('character'), moves: W('moves'),
  tilt: W('tilt'), head: W('head'), you3: W('you', 3), aim: W('aim'),
  press: W('press'), tongue3: W('tongue', 3), up: W('up'), you4: W('you', 4), click: W('click'),
  and2: W('and', 2), thing: W('thing'), people: W('people'), already: W('already'), using: W('using'), control: W('control'), computers: W('computers'),
  phones: W('phones'), without: W('without'), hands: W('hands'),
  but: W('but'), craziest: W('craziest'), part: W('part'), close: W('close'), mouth3: W('mouth', 3), nobody: W('nobody'), see: W('see'), controller: W('controller'),
  so: W('so'), imagine: W('imagine'), losing: W('losing'), game: W('game'), someone: W('someone'), literally: W('literally'), sitting2: W('sitting', 2), there: W('there'),
  with2: W('with', 2), mouth4: W('mouth', 4), shut: W('shut'),
  can: W('can', 1), with1: W('with', 1), even: W('even'), just: W('just'), heres: W("here's"), whos: W("who's"), video2: W('video', 2), and3: W('and', 3), their2: W('their', 2), a2: W('a', 2), called2: W('called'),
};

/** shots fired in the game; each lands just after the word it answers, so no splat covers a word */
export const FIRE = {
  tongue: T.tongue1 + 0.36, // "...with your TONGUE." → splat in the gap before "Seriously"
  watch: T.this2 + 0.3, // "Watch this." → splat after the word
  click: T.click + 0.12, // "you CLICK": the shot leaves on the word (a short, quiet "pew")
  part: T.part + 0.2, // "...the craziest part." → splat after the word
  nobody: T.nobody + 0.27,
  shut: T.shut + 0.32, // "With their mouth SHUT." → the winning splat right after the word
};
