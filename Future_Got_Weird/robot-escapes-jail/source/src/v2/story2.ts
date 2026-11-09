// V2 timing authority. The narration is the LOCKED V1 master (audio/narration/FGW_Robot_Escapes_Jail_narration_V1.wav,
// sha256 afa5f2cd…, 32.40 s); word times come from its measured alignment (src/data/timeline.json) via T in ../story.
// Every V2 beat is keyed to T. Shot boundaries sit in the pauses between sentences.
import {DUR} from '../lib';
export {T} from '../story';

export const SHOTS2 = {
  H1: [0, 3.4],        // HOOK (dramatization): ECU robot squeezes through the bars, reforms outside, looks at us;
                       //   pull back (cell still locked) on "by MELTING"; push into its chrome face -> full-frame chrome
  LB: [3.4, 13.67],    // LAB (real demo): out of the chrome into the lab: the minifigure-shaped MPTM figure in a tiny cage
                       //   ("locked it inside a tiny cage"); magnet drags it against the bars, rigid -> can't pass
                       //   ("instead of breaking the bars"); AC-field induction heats it -> continuous melt ("It MELTED");
                       //   pool ("liquid metal"); angled overhead: magnet pulls the liquid through the bar gaps ("slipped
                       //   straight through the bars"); it collects outside
  MS: [13.67, 22.56],  // MOLD + SCIENCE: gloved hand collects it, pours into a mold, cools, unmolds the figure (by hand);
                       //   "How?": into its surface -> gallium + magnetic microparticles; melts 29.8 C < body 37 C (heat =
                       //   AC field); "magnets help control its movement": field -> particles -> material moves
  FU: [22.56, 27.9],   // FUTURE: channel / obstacle navigation under magnet -> STOMACH MODEL retrieval (lab demo) ->
                       //   ghost human outline "FUTURE IDEA"
  J1: [27.9, DUR],     // JAIL (dramatization): comedic escalation of security; robot back at the bars -> camera ends on
                       //   frame 0's framing (seamless loop)
} as const;
export type ShotId2 = keyof typeof SHOTS2;
export const SHOT_ORDER2: ShotId2[] = ['H1', 'LB', 'MS', 'FU', 'J1'];
export const shotAt2 = (t: number): ShotId2 => {
  for (const k of SHOT_ORDER2) if (t < SHOTS2[k][1]) return k;
  return 'J1';
};
