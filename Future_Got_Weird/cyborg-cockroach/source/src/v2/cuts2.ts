// V4 (V3 + polish) shot boundaries (frame each shot starts), on the locked narration (see production/V3_SHOT_PLAN.md). The V2 table
// is in git history (commit adf4e10).
export const SHOTS2: [string, number][] = [
  ['A0', 0], // V4 hook: tight on the launcher at the moment of action (needle, coil glowing, clear target)
  ['AR', 5], // match cut: the gloved thumb drives the remote's red FIRE button home
  ['A1', 11], // back on the launcher: the line parts, the spring launches the injector, impact, track back to the insect
  ['A2', 39], // the operator; he taps the D-pad and the camera tracks along to the insect, which responds at once
  ['A4', 90], // "remote decides": low side view; the insect turns away from the target and walks off
  ['A5', 113], // "when it shoots": rise over the table, the operator guiding it; a foreground block wipes on
  ['B1', 143], // "Scientists strapped a tiny": gloved hands fit the module (high angle)
  ['B2', 187], // "launcher onto a": tight side view of the launcher and its mounting
  ['B3', 209], // "living cockroach,": walking over a textured test surface (tripod gait)
  ['B4', 243], // "then used electrical pulses": the guidance electronics, the pulse to the antenna
  ['B5', 283], // "to steer it.": obstacle course, the turn
  ['C1', 315], // "A second cockroach": two insects, two configurations
  ['C2', 341], // "carries a camera,": push to the observer's lens
  ['C3', 372], // "letting the operator": through the lens, the POV feed
  ['C4', 402], // "watch as the": the feed on the operator's monitor
  ['C5', 424], // "first moves into position.": overhead, the medic heads for the target
  ['D1', 466], // "Once it lines up,": low side view, alignment
  ['DT', 488], // "they": the operator's thumb on the fire button (insert)
  ['D2', 496], // "fire the": ECU, release 16.6 s, launch, impact
  ['D3', 518], // "injector.": brief section: the dose goes in
  ['D5', 544], // "They've demonstrated this on laboratory targets.": rise over the bench to the window light
  ['E1', 619], // "But the plan is to send them": a collapsed building; down to a narrow opening
  ['E2', 655], // "beneath collapsed": follow the insect into a gap too small for a person
  ['E3', 680], // "buildings,": side-tracking under a fallen beam
  ['E4', 700], // "carrying": close on its legs over uneven rubble
  ['E5', 716], // "emergency": the observer's view down a dark passage
  ['E6', 737], // "medicine.": the operator studies the feed and directs the medic
  ['F1', 758], // "So if you're trapped": the trapped survivor; a small shadow moves under the rubble
  ['F2', 793], // "and something starts": the insect emerges from a crack
  ['F3', 818], // "crawling toward you...": she turns, sees it: disgust
  ['F4', 848], // "you might": it crosses a narrow ledge
  ['F5', 873], // "actually want": disgust turns to cautious hope
  ['F6', 892], // "it to get closer.": it comes to the foreground; bold macro; loops into A1
];
export const FRAMES2 = 936;
export const CUTS2 = SHOTS2.map(([, f]) => f).filter((f) => f > 0);
export const shotRange = (id: string) => {
  const i = SHOTS2.findIndex(([k]) => k === id);
  if (i < 0) return {from: FRAMES2, to: FRAMES2}; // a retired shot id: empty
  return {from: SHOTS2[i][1], to: i + 1 < SHOTS2.length ? SHOTS2[i + 1][1] : FRAMES2};
};
