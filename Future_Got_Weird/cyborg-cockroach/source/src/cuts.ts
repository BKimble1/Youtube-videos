// Shot boundaries (frames at 30 fps), placed from the measured narration (data/timeline.json):
//  S01  0.00 hook: launch on "fire" (0.89 s)          S08 12.40 onboard camera -> operator's screen
//  S02  1.90 thumb releases ("And a person")          S09 15.40 mechanism cutaway: lines up, fires ("fire" 16.59)
//  S03  3.40 operator and test bench ("decides")      S10 17.90 target side: delivery, then the fixture ("laboratory")
//  S04  5.00 backpack track -> contact (continuous)   S11 20.60 lab gap, foreground edge ("But the plan")
//  S06  9.10 overhead: pulse, turn ("steer it")       S12 21.83 rubble route ("beneath collapsed buildings")
//  S07 10.50 the second insect and its camera         S13 25.27 survivor level ("So if you're trapped")
//                                                     S14 28.53 recognition; S15 29.70 low approach -> loop
export const SHOT_FRAMES: [string, number][] = [
  ['S01', 0], ['S02', 57], ['S03', 102], ['S04', 150], ['S06', 273], ['S07', 315], ['S08', 372], ['S09', 462],
  ['S10', 537], ['S11', 618], ['S12', 655], ['S13', 758], ['S14', 856], ['S15', 891],
];
export const CUTS = SHOT_FRAMES.map(([, f]) => f).filter((f) => f > 0);
