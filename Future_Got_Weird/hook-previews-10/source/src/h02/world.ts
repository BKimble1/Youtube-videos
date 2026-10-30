// HOOK 02 world and timeline (millimetres, seconds). One continuous take in a flooded concrete test tunnel: the suited
// hissing cockroach walks down a gentle ramp into deeper water, the camera pushes into the oxygen generator, follows the
// gas along the tubes into the thoracic spiracles and the tracheae, then pulls back as the insect walks beneath a fallen
// slab. Event times live here and are mirrored in tools/audio/h02.py.
import WORDS from '../data/h02_words.json';
import {wordAt, Words, ss} from '../shared/lib';
import {Path, PathPose} from './rig/roach';

const W = WORDS as Words;
export const WORD = {
  cockroach: wordAt(W, 'cockroach').start, // 0.90
  diving: wordAt(W, 'diving').start, // 1.62
  suit: wordAt(W, 'suit').start, // 2.06
  kept: wordAt(W, 'kept').start, // 2.71
  underwater: wordAt(W, 'underwater').start, // 3.14
  hours: wordAt(W, 'hours').start, // 4.02
  end: W.speech_end, // 4.57
};

/** event times (s); tools/audio/h02.py mirrors these numbers */
export const EV = {
  orbit: 1.0, // the follow swings round behind the insect: the suit, generator and tubes come into view
  push: 2.45, // continuous push into the generator
  fizz: 2.6, // oxygen bubbles stream off the catalyst sponge
  flow: 2.95, // gas pulses run forward along the four tubes (camera follows them)
  spiracle: WORD.underwater + 0.32, // first pulse reaches the sealed thoracic spiracles (3.46)
  winOpen: 3.42, // cut window opens on the thorax side
  fill: 3.62, // oxygen spreads into the tracheal branches
  fillEnd: WORD.hours + 0.28, // fine branches reached (4.30)
  pull: 4.32, // pull back through the same apparatus
  winClose: 4.38,
  under: 4.9, // the slab above is revealed: the insect is walking beneath it
};

// ------------------------------------------------------------------ ground: a ramp down into deeper water
export const RAMP = {x0: 30, x1: 150, drop: 20};
export const ground = (x: number, _z = 0) => -RAMP.drop * ss(x, RAMP.x0, RAMP.x1);
const slope = (x: number) => (ground(x + 0.5) - ground(x - 0.5)) / 1;
/** the walkway's near edge (beyond it the floor steps down to the deeper tank bottom) */
export const EDGE_Z = 78;
export const BOTTOM_Y = -95;
export const WALL_Z = -320;

// ------------------------------------------------------------------ the walk
export const SPEED = 38; // mm/s (a brisk walk for a 6 cm hisser)
export const S0 = 0; // path distance at t = 0 (body origin at x = 0)
export const sAt = (t: number) => S0 + SPEED * t;
export const PATH: Path = (s: number): PathPose => {
  const x = s;
  return {p: [x, ground(x), 0], yaw: 0, pitch: Math.atan(slope(x))};
};

// ------------------------------------------------------------------ the fallen slab the insect walks beneath
export const SLAB = {xc: 215, hx: 24, y0: 37, y1: 55, z0: -175, z1: 48};

// ------------------------------------------------------------------ the suit (body-frame millimetres)
export const GEN = {x0: -52, x1: -31.5, y: 20.6, r: 5.8}; // the oxygen generator: a clear chamber on the rear abdomen
export const SPIR = {meso: {x: 1.2, th: 0.24}, meta: {x: -5.4, th: 0.2}}; // thoracic spiracles (theta on the plates)
export const SUIT_X1 = -10.5; // front collar of the abdominal suit
