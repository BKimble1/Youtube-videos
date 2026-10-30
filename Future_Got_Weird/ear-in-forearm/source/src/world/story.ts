// Story timing: every event is keyed to a measured word time (data/timeline.json, tools/make_narration.py).
import {word, DUR} from '../lib';

const w = (s: string, n = 0) => word(s, n);
export const TM = {
  ear0: w('EAR').start,
  forearm: w('FOREARM.').start,
  she: w('She').start,
  lostEar: w('ear', 1).start,
  crash: w('crash,').start,
  surgeons: w('surgeons').start,
  carved: w('carved').start,
  from: w('from').start,
  replacement: w('replacement').start,
  rib: w('rib').start,
  cartilage: w('cartilage.').start,
  cartilageEnd: w('cartilage.').end,
  they: w('They').start,
  tucked: w('tucked').start,
  beneath: w('beneath').start,
  skin: w('skin,').start,
  where: w('where').start,
  vessels: w('vessels').start,
  formed: w('formed').start,
  aroundIt: w('it.', 1).end,
  months: w('Months').start,
  later: w('later,').start,
  moved: w('moved').start,
  living: w('living').start,
  head: w('head,').start,
  reconnecting: w('reconnecting').start,
  blood2: w('blood', 1).start,
  supply: w('supply').start,
  nerves: w('nerves.').start,
  nervesEnd: w('nerves.').end,
  and2: w('And', 1).start,
  months2: w('MONTHS…', 1).start,
  her: w('her', 4).start,
  right: w('right').start,
  here: w('HERE.').start,
  hereEnd: w('HERE.').end,
  end: DUR,
};

// Derived beats (seconds). Each block is one physical action. V2: the cartilage is cut out of the chest, carried by
// forceps to a surgical tray beside her, carved there, and carried by forceps to the forearm (never shaped in the chest).
export const B = {
  push: [0.0, 0.32] as const, // frame 0 is the ear in extreme close-up; the camera settles, then pulls back
  pulse: [0.0, 0.5] as const, // the ear pushes up under the skin as the film opens
  turn: [0, 0] as const, // V4: no cylindrical turn (it narrowed the ear); the forearm rotates rigidly instead (hook.ts)
  armOff: 2.1, // V6: the forearm is out of frame from here: until the insertion it is the arm before surgery
  crash: [2.2, 2.9] as const, // V6: the crash memory plays on the missing-ear shot itself (she flinches); the narration follows
  // it ("She lost her ear in a crash") while the camera is already on its way to the ribs
  ribWin: [3.55, 3.95] as const, // V6: the chest opens while "She lost her ear in a crash" is still being said
  ident: [3.95, TM.surgeons + 0.15] as const, // the cartilage (not the bone) lights up
  cut: [TM.surgeons + 0.15, TM.replacement + 0.07] as const, // the scalpel traces the block
  lift: [TM.replacement + 0.07, TM.replacement + 0.29] as const, // forceps lift it out
  carry1: [TM.replacement + 0.29, TM.from + 0.5] as const, // carried to the tray
  outline: [TM.from + 0.58, TM.rib + 0.42] as const, // on the tray: cut to the ear outline, offcuts fall away
  grooves: [TM.rib + 0.42, TM.cartilage + 0.42] as const, // the hollows carved
  rim: [TM.cartilage + 0.4, TM.cartilageEnd + 0.15] as const, // the rim cut free
  carry2: [TM.they, TM.beneath + 0.3] as const, // forceps carry the framework to the forearm
  insert: [TM.beneath + 0.3, TM.skin + 0.2] as const, // slid in under the skin edge; the skin settles
  cover: [TM.skin + 0.3, TM.skin + 1.0] as const, // V6: new tissue grows in over the scaffold, under the skin
  vessels: [TM.where + 0.02, TM.aroundIt - 0.2] as const, // the cutaway: vessels grow in the tissue around it
  winClose: [TM.aroundIt - 0.2, TM.months] as const,
  incise: [TM.months, TM.later + 0.37] as const, // the flap is outlined
  raise: [TM.later + 0.37, TM.living] as const, // the living ear is lifted with its vessels
  carry: [TM.living, TM.head] as const, // carried to the head
  seat: [TM.head, TM.reconnecting] as const,
  artery: [TM.reconnecting + 0.12, TM.reconnecting + 0.52] as const,
  vein: [TM.reconnecting + 0.38, TM.reconnecting + 0.78] as const,
  flow: [TM.reconnecting + 0.45, TM.reconnecting + 1.3] as const,
  nerve: [TM.reconnecting + 0.68, TM.reconnecting + 1.02] as const,
  closeUp: [TM.reconnecting + 0.05, TM.reconnecting + 1.2] as const, // V6: a 1 s local cutaway in front of the new ear
  reveal: [TM.reconnecting + 1.1, TM.nerves + 0.05] as const,
  // V5 payoff: from the profile the camera moves down over her neck and shoulder (no ear in frame), the picture takes on
  // a memory grade, and the raised forearm enters in the past, the ear already under its skin: an obvious flashback
  fb: [TM.nerves + 0.05, TM.nerves + 0.3] as const, // V6: the flashback starts right after the reconnection
  fbOut: [TM.here + 0.45, TM.end] as const, // the grade lifts as the final push lands on frame 0's composition
  rewind: [TM.nerves + 0.05, TM.nerves + 0.06] as const, // (the arm's state switch, made out of frame)
};
