// The bench, as a function of the frame: the spare tile on its rotation stage (181-232), and the glass/brick test
// (866-905, 1064-1171). The pad on the stand carries a small slotted mass from its ring (a modest bench load).
import {ManPose} from '../dc/Man';
import {mixExpr} from '../dc/Head';
import {HandPose, mixHand} from '../dc/Hand';
import {clamp} from '../dc/math';
import {BENCH, BenchState} from '../scenes/Bench';
import {gripOf, PadState, prPad} from './geo';
import {easeOut, keyN, ss} from './climb';
import {H_BAR, H_BAR_OPEN, H_REST, handUV, placeHand} from './rig';
import {EX, P} from './pose';

export const BK = {
  turn0: 181, turn1: 202, // the tile turns to show its face
  lift: 868, slide0: 872, slide1: 892, hover: 900, // "But there's a catch": off the glass, the brick slides into place
  place: 1064, letGo: 1074, slip0: 1080, slip1: 1104, thud: 1106, // "...can't make the same contact"
  grab: 1124, off: 1132, back0: 1134, back1: 1152, press: 1158, seat: 1164,
};
const SLIDE = -220; // carriage travel that brings the brick to the pad

export const benchAt = (f: number): BenchState => {
  const tileTurn = keyN(f, [[BK.turn0, 0], [BK.turn1, 1]]);
  if (f < 800) return {slide: 0, pad: null, hand: null, tileTurn, tileDetail: ss(f, BK.turn1 - 6, BK.turn1 + 10), weight: null};
  const slide = f < BK.back0 ? keyN(f, [[BK.slide0, 0], [BK.slide1, SLIDE]]) : keyN(f, [[BK.back0, SLIDE], [BK.back1, 0]]);
  // the pad: on glass and holding (866), lifted off (868-872), hovering by the brick (892-1064), pressed on and let
  // go (1064-1074), slipping down the brick (1080-1104), taken back, then pressed onto the returned glass (1158-1164)
  const slipY = f < BK.slip0 ? 0 : keyN(f, [[BK.slip0, 0], [BK.slip0 + 4, 9], [BK.slip0 + 8, 11], [BK.slip0 + 12, 30], [BK.slip0 + 15, 38], [BK.slip0 + 18, 41], [BK.slip1, 108, easeOut]]);
  const gap = f < BK.place ? keyN(f, [[BK.lift - 2, 0], [BK.lift + 6, 16], [BK.slide1, 10], [BK.hover, 7]]) : f < BK.grab ? keyN(f, [[BK.place, 7], [BK.place + 4, 0, easeOut]]) : keyN(f, [[BK.off - 4, 0], [BK.off + 2, 18], [BK.press, 10], [BK.seat, 0, easeOut]]);
  const tilt = f < BK.place ? keyN(f, [[BK.lift - 2, 0], [BK.lift + 4, 6], [BK.hover, 2]]) : f < BK.grab ? keyN(f, [[BK.place, 2], [BK.place + 4, 0]]) + (f > BK.slip0 ? keyN(f, [[BK.slip0, 0], [BK.slip1, 5]]) : 0) : keyN(f, [[BK.off - 4, 4], [BK.off + 2, 8], [BK.seat - 2, 0]]);
  const yBack = f >= BK.grab ? keyN(f, [[BK.grab, 108], [BK.off + 2, 90], [BK.press, 0]]) : 0;
  const load = f < BK.lift ? 1 : f < BK.place ? 0 : f < BK.grab ? keyN(f, [[BK.letGo, 0.2], [BK.letGo + 4, 1]]) : keyN(f, [[BK.grab, 1], [BK.off, 0], [BK.seat, 0], [BK.seat + 6, 0.4]]);
  const pad: PadState = {y: BENCH.padY + (f >= BK.grab ? yBack : slipY), z: 0, gap, tilt, load};
  // the hand: on the bar except between letting go and taking it back
  const on = f < BK.letGo || f >= BK.grab;
  let pose: ManPose = P({x: 400, y: -100, s: 1, torso: 12, chest: 6, neck: 4, turn: 0.82, rW: 1, rWx: 250, rWy: -10, rElb: -1, lElb: -1});
  const uv = handUV(H_BAR, 'grip');
  const g = prPad(gripOf(pad));
  if (on) pose = placeHand(pose, 'L', g, 182, uv.u, uv.v);
  else {
    // hovering just off the bar, open, ready to catch
    const away = {x: g.x + 40 + 20 * ss(f, BK.letGo, BK.letGo + 8), y: g.y + 14};
    pose = placeHand(pose, 'L', away, 190, 0.5, 0.05);
  }
  const lHand: HandPose = on ? mixHand(H_BAR_OPEN, H_BAR, f < BK.letGo ? 1 - ss(f, BK.letGo - 4, BK.letGo) : ss(f, BK.grab - 2, BK.grab + 4)) : H_BAR_OPEN;
  const doubt = ss(f, BK.slip0 + 4, BK.slip0 + 14) * (1 - ss(f, BK.press, BK.seat + 6));
  const expr = mixExpr(EX.bench, EX.doubt, doubt);
  const drop = 0;
  return {slide, pad, hand: {pose, on, expr, lHand, rHand: H_REST}, tileTurn: 1, tileDetail: 1, weight: {drop: drop + clamp(0), swing: 0}};
};
