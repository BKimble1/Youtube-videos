// The film's timing authority: every beat is keyed to a MEASURED word time (data/timeline.json, from the locked
// narration). Times are seconds from frame 0. Never hard-code seconds in a shot: use these (small offsets are fine).
import {DUR, word} from './lib';

const s = (w: string, n = 0) => word(w, n).start;
const e = (w: string, n = 0) => word(w, n).end;

/** key word times (start unless suffixed E = end) */
export const T = {
  // S1 "This robot escaped JAIL… by MELTING."
  jail: s('jail'), jailE: e('jail'), melting: s('melting'), meltingE: e('melting'),
  // S2 "Scientists locked it inside a tiny cage."
  scientists: s('scientists'), locked: s('locked'), tiny: s('tiny'), cage: s('cage'), cageE: e('cage'),
  // S3 "But instead of breaking the bars… It MELTED."
  but: s('but'), breaking: s('breaking'), bars1: s('bars', 0), bars1E: e('bars', 0), it2: s('it', 1), melted: s('melted'), meltedE: e('melted'),
  // S4 "Its entire body turned into liquid metal. Then it slipped straight through the bars."
  its: s('its', 0), entire: s('entire'), liquid: s('liquid'), metalE: e('metal', 0), then1: s('then', 0), slipped: s('slipped'),
  through: s('through'), bars2: s('bars', 1), bars2E: e('bars', 1),
  // S5 "Then scientists collected the metal and molded it back into shape."
  then2: s('then', 1), collected: s('collected'), metal2: s('metal', 1), molded: s('molded'), back: s('back'), shape: s('shape'), shapeE: e('shape'),
  // S6 "How? It's made from a metal that melts near body temperature. And magnets help control its movement."
  how: s('how'), howE: e('how'), made: s('made'), metal3: s('metal', 2), melts: s('melts'), body1: s('body', 1), temperature: s('temperature'),
  temperatureE: e('temperature'), magnets: s('magnets'), control: s('control'), movement: s('movement'), movementE: e('movement'),
  // S7 "Scientists are exploring whether robots like this could one day retrieve objects from inside your body."
  exploring: s('exploring'), robots: s('robots'), oneDay: s('one'), retrieve: s('retrieve'), objects: s('objects'), inside2: s('inside', 1),
  body2: s('body', 2), body2E: e('body', 2),
  // S8 "So apparently… Even prison bars can't stop a robot anymore."
  so: s('so'), apparently: s('apparently'), even: s('even'), prison: s('prison'), bars3: s('bars', 2), cant: s("can't"), stop: s('stop'),
  robot3: s('robot', 1), anymore: s('anymore'), anymoreE: e('anymore'),
  end: DUR,
};

/** shot boundaries [start, end) in seconds. Cuts sit in the pauses between sentences. */
export const SHOTS = {
  S1: [0, 3.24],              // the impossible escape (hook) -> cup falls (whip follows it) -> splash (top-down)
  S2: [3.24, 5.8],            // match cut: splash -> robot head from above, in the cell -> tilt to frontal -> door slams on "cage"
  S3: [5.8, 8.8],             // reach, press, annoyed, heat, collapse on "MELTED"
  S4: [8.8, 13.55],           // liquid: low push, slips through the bars, collects outside; guard stares
  S5: [13.55, 17.02],         // match cut: puddle -> lab collection dish; collected, poured into a mold, cooled, revealed
  S6: [17.02, 22.45],         // "How?": into the metal surface -> science cutaway (gallium, melting point, heat vs magnet)
  S7: [22.45, 27.82],         // field line -> path through a stomach MODEL; object retrieved; future possibility
  S8: [27.82, DUR],           // back in the jail: empty cell, droplet past the guard's foot, eyes -> loops to frame 0
} as const;
export type ShotId = keyof typeof SHOTS;
export const shotAt = (t: number): ShotId => {
  for (const k of Object.keys(SHOTS) as ShotId[]) if (t < SHOTS[k][1]) return k;
  return 'S8';
};
