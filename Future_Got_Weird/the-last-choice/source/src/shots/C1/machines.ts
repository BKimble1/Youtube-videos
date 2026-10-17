// The avenue machines' motion as functions of FILM time, shared by C1–C6 so every cut agrees. The hauler waits behind
// the far-lane wreck, starts on the music accent (M.HIT_HAULER), pulls into the clear lane and rams the burned taxi at
// the gap's narrow point, shoving it west and stopping wedged — the gap is sealed before the Crew gets there.
import {M, shot} from '../../film/timing';
import {clamp, lerp, smooth, seg, easeOut} from '../../kit/math';
import {HAULER, GAP_TAXI} from './avenue';

const RAM = 768 * HAULER.s; // ram tip ahead of the hauler's centre (it faces west)
const TAXI_EAST = GAP_TAXI.x + 628; // the taxi faces west: its rear (east end) is +628
export const CONTACT_X = TAXI_EAST + RAM; // hauler centre at first contact
export const T_CONTACT = shot('C3').start + 0.6;
const ACC = (2 * (HAULER.park - CONTACT_X)) / (T_CONTACT - M.HIT_HAULER) ** 2;
export const SHOVE = 290, SHOVE_DUR = 0.55;

/** Hauler state at film time T: centre x, lane y, distance driven (wheels), ram crush, light level. */
export const hauler = (T: number) => {
  const tau = T - M.HIT_HAULER;
  let x = HAULER.park, d = 0;
  if (tau > 0) {
    const tc = T_CONTACT - M.HIT_HAULER;
    if (tau <= tc) d = 0.5 * ACC * tau * tau;
    else d = HAULER.park - CONTACT_X + SHOVE * easeOut((tau - tc) / SHOVE_DUR);
    x = HAULER.park - d;
  }
  const y = lerp(HAULER.y0, HAULER.y1, smooth(clamp(d / 700)));
  const crush = 0.75 * smooth(seg(T, T_CONTACT, T_CONTACT + SHOVE_DUR));
  const lights = T < M.HIT_HAULER - 0.05 ? 0 : 1;
  return {x, y, d, crush, lights, moving: tau > 0 && T < T_CONTACT + SHOVE_DUR};
};
/** The burned taxi being shoved: shift (west, negative), rear lift, dents. */
export const gapTaxi = (T: number) => {
  const u = easeOut(clamp((T - T_CONTACT) / SHOVE_DUR));
  return {shift: -SHOVE * u, tilt: -9 * smooth(seg(T, T_CONTACT, T_CONTACT + 0.35)) + 3 * smooth(seg(T, T_CONTACT + 0.35, T_CONTACT + 0.9)), dents: 0.6 + 0.4 * u, broken: T < T_CONTACT ? 0.7 : 1};
};

/** Autonomous cars: sensor bars light in sequence, then they roll in behind the hauler to line up. */
export const CARS = [
  {x: 10520, y: 350, lane: 350, variant: 2, on: 0.5, to: 10150, toY: 330, seed: 42, dir: -1 as const},
  {x: 11650, y: 350, lane: 350, variant: 0, on: 0.85, to: 11250, toY: 330, seed: 41, dir: -1 as const},
  {x: 12100, y: -34, lane: -34, variant: 4, on: 1.2, to: 11450, toY: 26, seed: 43, dir: -1 as const},
];
export const car = (i: number, T: number) => {
  const c = CARS[i];
  const t2 = T - shot('C2').start;
  const sensor = smooth(seg(t2, c.on, c.on + 0.12));
  const go = smooth(seg(T, M.HIT_HAULER + 0.25 + i * 0.15, M.HIT_HAULER + 2.6 + i * 0.2));
  return {x: lerp(c.x, c.to, go), y: lerp(c.lane, c.toY, smooth(seg(go, 0.2, 0.8))), sensor, dist: (c.x - lerp(c.x, c.to, go)), lights: sensor, lock: T >= M.HIT_HAULER ? 1 : 0, variant: c.variant, seed: c.seed, dir: c.dir};
};
