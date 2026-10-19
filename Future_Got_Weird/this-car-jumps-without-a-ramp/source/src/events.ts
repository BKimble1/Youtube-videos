// Sound events taken from the animation's own timing (exported to audio/sfx_events.json by tools/export_events.mjs),
// so every effect lands on the frame its action happens.
import {ALL_WORDS, DURATION_S} from './cues';
import {T as TL, LAUNCH_EV, GO_T, DEMO_EV} from './shots/Launch';
import {BEND_T, BEND_BUMPS, T_ENTER, T3} from './shots/Bend';
import {BRAKE_IN, BRAKE_EV, BRAKE_HOLD, T4, roadAt} from './shots/BrakeRough';
import {CABIN_IN, REPLAY_AT, T5} from './shots/Cabin';
import {CALLBACK_EV} from './shots/Callback';
import {CLOSE_EV, TIMES as CT, T7, CLOSE_IN, DRIVE_B} from './shots/Closing';
import {WIPE1, WIPE2} from './Main';

/** Video times a wheel at axle offset `off` (m) crosses a bump peak in the brake scene. */
const wheelHits = (off: number) => {
  const out: {t: number; h: number}[] = [];
  const t0 = BRAKE_IN, t1 = BRAKE_HOLD;
  const dt = 1 / 240;
  const road = (ts: number) => roadAt(BRAKE_EV.xAt(ts) + off);
  let prev = road(BRAKE_EV.sceneT(t0)), rising = false;
  for (let t = t0 + dt; t < t1; t += dt) {
    const ts = BRAKE_EV.sceneT(t);
    const h = road(ts);
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
  hook: {suspension: TL.suspension, launches: TL.launches, take: LAUNCH_EV.hookTake, land: LAUNCH_EV.hookLand, crouch: LAUNCH_EV.hookTake - 1.55},
  launch: {name: TL.name, press1: DEMO_EV.press1, release1: DEMO_EV.release1, press2: DEMO_EV.press2, release2: DEMO_EV.release2, adds: TL.adds, act: DEMO_EV.act, actEnd: DEMO_EV.actEnd,
    during: TL.during, crouch: LAUNCH_EV.crouch, push: LAUNCH_EV.push, take: LAUNCH_EV.take, apex: LAUNCH_EV.apex, land: LAUNCH_EV.land, go: GO_T},
  wipes: [WIPE1, WIPE2],
  corner: {start: BEND_T.start, enter: T_ENTER, front1: BEND_T.front1, here: T3.here, adjusts: T3.adjusts, thisW: T3.thisW, point: T3.point, flatter: T3.flatter, pass: BEND_T.passIn, out: BEND_T.out,
    bumps: BEND_BUMPS.map((b) => ({t: +b.t.toFixed(3), side: b.side, h: b.h}))},
  brake: {in: BRAKE_IN, tb0: BRAKE_EV.tb0, tb1: BRAKE_EV.tb1, active: T4.active, hold: BRAKE_HOLD,
    front: wheelHits(1.45),
    rear: wheelHits(-1.45),
    big: +BRAKE_EV.bigT.toFixed(3)},
  passenger: {in: CABIN_IN, your: T5.your, sideways: T5.sideways, seat: T5.seat, bolster: T5.bolster, replay: REPLAY_AT},
  callback: {in: REPLAY_AT, ...CALLBACK_EV},
  close: {in: CLOSE_IN, brake: CT.insBrake, turn: CT.insTurn, bump: CT.insBump, hop: CT.jumpIn, take: CLOSE_EV.take, land: CLOSE_EV.land, drive: CLOSE_EV.drive, composed: T7.composed, realDrive: DRIVE_B.frame0 / 30},
});
