// V2 shot boundaries (frame each shot starts), on the locked narration (see production/V2_SHOT_PLAN.md).
export const SHOTS2: [string, number][] = [
  ['A1', 0], // hook: macro, the injector deploys into the silicone on "fire"
  ['A2', 55], // the gloved thumb presses the remote's button
  ['A3', 83], // match cut: button -> the backpack's LED; the signal runs to the coil
  ['A4', 103], // the operator at the bench ("decides when it shoots")
  ['B1', 136], // gloved hands seat the backpack on the living insect
  ['B2', 186], // the insect walks off under the hands
  ['B3', 222], // walking naturally over the lab surface (six legs)
  ['B4', 255], // wiring -> electronics -> antenna: the steering pulse
  ['B5', 283], // the turn
  ['C1', 315], // two insects, two jobs (injector / camera)
  ['C2', 345], // push to the observer's lens
  ['C3', 372], // the camera's POV through the course, following the medic
  ['C4', 430], // the feed becomes the operator's monitor
  ['D1', 466], // the medic lines up on the target
  ['D2', 490], // ECU: coil, line, spring, the injector extends
  ['D3', 512], // section: needle in silicone, delivery
  ['D5', 578], // back to the whole animal and the lab targets
  ['D6', 620], // into a narrow gap ...
  ['E1', 655], // ... the rubble: a future rescue concept
  ['F1', 758], // her face: a sound near the debris
  ['F2', 800], // a crack: antennae, then the head
  ['F3', 828], // she recoils
  ['F4', 856], // the injector visible; fear turns to realization
  ['F5', 891], // close: it approaches her hand (loops into A1)
];
export const FRAMES2 = 936;
export const CUTS2 = SHOTS2.map(([, f]) => f).filter((f) => f > 0);
export const shotRange = (id: string) => {
  const i = SHOTS2.findIndex(([k]) => k === id);
  return {from: SHOTS2[i][1], to: i + 1 < SHOTS2.length ? SHOTS2[i + 1][1] : FRAMES2};
};
