// Story timing: every event is keyed to a measured word time (data/timeline.json, tools/make_narration.py).
import {word, DUR} from '../lib';

const w = (s: string, n = 0) => word(s, n);
export const TM = {
  ear0: w('EAR').start, // 0.96
  forearm: w('FOREARM.').start, // 2.36
  she: w('She').start, // 3.43
  lostEar: w('ear', 1).start, // 3.95
  crash: w('crash,').start, // 4.47
  surgeons: w('surgeons').start, // 5.11
  carved: w('carved').start, // 5.63
  replacement: w('replacement').start, // 5.99
  rib: w('rib').start, // 7.19
  cartilage: w('cartilage.').start, // 7.51
  cartilageEnd: w('cartilage.').end, // 8.05
  tucked: w('tucked').start, // 8.47
  beneath: w('beneath').start, // 8.84
  skin: w('skin,').start, // 9.56
  vessels: w('vessels').start, // 10.60
  formed: w('formed').start, // 11.04
  aroundIt: w('it.', 1).end, // 11.82
  months: w('Months').start, // 12.31
  moved: w('moved').start, // 13.10
  living: w('living').start, // 13.54
  head: w('head,').start, // 14.50
  reconnecting: w('reconnecting').start, // 14.92
  blood2: w('blood', 1).start, // 15.61
  supply: w('supply').start, // 15.93
  nerves: w('nerves.').start, // 16.49
  nervesEnd: w('nerves.').end, // 16.96
  and2: w('And', 1).start, // 17.67
  months2: w('MONTHS…', 1).start, // 18.02
  her: w('her', 4).start, // 18.93
  right: w('right').start, // 19.85
  here: w('HERE.').start, // 20.29
  hereEnd: w('HERE.').end, // 20.71
  end: DUR,
};

// Derived beats (seconds). Each block is one physical action.
export const B = {
  pulse: [0.0, 0.55] as const, // the ear pushes up under the skin as the film opens
  turn: [1.0, 2.5] as const, // she turns her forearm a little
  armOff: 3.9, // the forearm leaves the frame: from here until the insertion it is the arm before surgery
  crash: [TM.crash - 0.04, TM.crash + 0.62] as const,
  ribWin: [TM.surgeons + 0.25, TM.replacement + 0.25] as const, // the chest opens locally on the ribs
  cut: [TM.replacement + 0.35, TM.rib - 0.05] as const, // the scalpel traces the piece
  lift: [TM.rib - 0.05, TM.cartilage + 0.1] as const, // the piece comes up, toward us
  outline: [TM.cartilage + 0.1, TM.cartilageEnd] as const, // the plate is cut to the ear outline
  grooves: [TM.cartilageEnd, TM.tucked] as const, // the hollows are carved
  rim: [TM.tucked, TM.beneath - 0.02] as const, // the rim ridge is cut free
  travel: [TM.beneath - 0.02, TM.skin + 0.06] as const, // the framework is carried to the forearm
  insert: [TM.skin + 0.06, TM.skin + 0.7] as const, // it slides into the skin pocket; the skin settles
  vessels: [TM.vessels - 0.25, TM.aroundIt + 0.05] as const, // the cutaway: vessels grow in the tissue around it
  winClose: [TM.aroundIt + 0.05, TM.months] as const,
  incise: [TM.months, TM.moved - 0.05] as const, // the flap is outlined
  raise: [TM.moved - 0.05, TM.living + 0.15] as const, // the living ear is lifted with its vessels
  carry: [TM.living + 0.15, TM.head + 0.05] as const, // carried to the head
  seat: [TM.head + 0.05, TM.reconnecting + 0.15] as const,
  artery: [TM.blood2 - 0.4, TM.supply + 0.05] as const,
  vein: [TM.supply - 0.1, TM.nerves - 0.02] as const,
  flow: [TM.supply + 0.1, TM.nervesEnd + 0.3] as const,
  nerve: [TM.nerves - 0.05, TM.nervesEnd] as const,
  closeUp: [TM.reconnecting + 0.12, TM.nervesEnd + 0.2] as const, // the local cutaway at the ear's front
  reveal: [TM.nervesEnd + 0.15, TM.months2 + 0.4] as const,
  rewind: [TM.right - 0.25, TM.here + 0.1] as const, // back at the forearm: the ear under the skin again
};
