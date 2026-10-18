// Sound events taken from the animation's own timing (exported to audio/sfx_events.json by tools/export_events.mjs),
// so every effect lands on the frame its action happens.
import {ALL_WORDS, DURATION_S} from './cues';
import {T as TL, LAUNCH_EV, GO_T} from './shots/SideLaunch';
import {CORNER_IN, CORNER_OUT, CORNER_BUMPS, SPEED, FRONT_T} from './shots/FrontCorner';
import {BRAKE_IN, BRAKE_HOLD, BRAKE_EV, roadAt, SLOW_WIN} from './shots/SideBrake';
import {PASS_T} from './shots/FrontPassenger';
import {T as TC, CLOSE_IN, MATCH_T, CLOSE_EV, closeRoad} from './shots/SideClose';

/** Times a wheel at axle offset `off` (m) crosses a bump peak, for a car position x(t) (m). */
const wheelHits = (t0: number, t1: number, xAt: (t: number) => number, road: (x: number) => number, off: number) => {
  const out: {t: number; h: number}[] = [];
  const dt = 1 / 240;
  let prev = road(xAt(t0) + off), rising = false;
  for (let t = t0 + dt; t < t1; t += dt) {
    const h = road(xAt(t) + off);
    if (h > prev) rising = true;
    if (rising && h < prev && prev > 0.012) {
      out.push({t: +(t - dt).toFixed(3), h: +prev.toFixed(3)});
      rising = false;
    }
    prev = h;
  }
  return out;
};

export const EVENTS = () => ({
  duration: DURATION_S,
  words: ALL_WORDS.map((w) => ({w: w.text, s: w.start, e: w.end, b: w.block})),
  hook: {suspension: TL.suspension, launches: TL.launches, take: LAUNCH_EV.hookTake, land: LAUNCH_EV.hookLand, so: TL.so},
  launch: {name: TL.name, press: LAUNCH_EV.press, release: LAUNCH_EV.release, adds: TL.adds, between: TL.between, during: TL.during,
    pushStart: TL.tiresPush + 0.2, take: LAUNCH_EV.take, land: LAUNCH_EV.land, go: GO_T},
  corner: {in: CORNER_IN, out: CORNER_OUT, corner: FRONT_T.corner, here: FRONT_T.here, thisIs: FRONT_T.thisIs, point: FRONT_T.point, flatter: FRONT_T.flatter,
    bumps: CORNER_BUMPS.map((b) => ({t: +((b.s - b.len / 2) / SPEED).toFixed(3), side: b.side, h: b.h}))},
  brake: {in: BRAKE_IN, hold: BRAKE_HOLD, tb0: BRAKE_EV.tb0(), tb1: BRAKE_EV.tb1(),
    // hits are found in scene time and mapped back to video time (the big bump plays in slow motion)
    front: wheelHits(BRAKE_IN, BRAKE_EV.sceneT(BRAKE_HOLD + 1.2), BRAKE_EV.xAt, roadAt, 1.45).map((h) => ({...h, t: +BRAKE_EV.videoT(h.t).toFixed(3)})),
    rear: wheelHits(BRAKE_IN, BRAKE_EV.sceneT(BRAKE_HOLD + 1.2), BRAKE_EV.xAt, roadAt, -1.45).map((h) => ({...h, t: +BRAKE_EV.videoT(h.t).toFixed(3)})),
    slow: SLOW_WIN},
  passenger: {your: PASS_T.your, sideways: PASS_T.sideways, seat: PASS_T.seat, bolster: PASS_T.bolster, bodyCtl: PASS_T.bodyCtl},
  close: {in: CLOSE_IN, match: MATCH_T, builds: TC.builds, take: CLOSE_EV.take, land: CLOSE_EV.land, go: CLOSE_EV.go, stop: CLOSE_EV.stop,
    brake: TC.brake, turn: TC.turn, uneven: TC.uneven, ground: TC.ground,
    front: wheelHits(CLOSE_EV.go, CLOSE_EV.stop + 1, (t) => CLOSE_EV.xAt(t) / 1000, closeRoad, 1.45), rear: wheelHits(CLOSE_EV.go, CLOSE_EV.stop + 1, (t) => CLOSE_EV.xAt(t) / 1000, closeRoad, -1.45)},
});
