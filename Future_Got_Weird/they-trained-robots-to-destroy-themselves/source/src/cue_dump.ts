// Dev helper: prints every scene's cue frames as seconds (used to write storyboard/storyboard.md).
import {coldCues} from './scenes/S1Cold';
import {whyCues} from './scenes/S2Why';
import {filmCues} from './scenes/S3Film';
import {trainCues} from './scenes/S4Train';
import {realCues} from './scenes/S5Real';
import {proveCues} from './scenes/S6Prove';
import {reactCues} from './scenes/S7React';
const sec = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === 'number').map(([k, v]) => [k, Math.round((v as number) / 3) / 10]));
export const dump = () => ({cold: sec(coldCues() as unknown as Record<string, unknown>), coldJ: sec(coldCues().J as unknown as Record<string, unknown>), why: sec(whyCues()), film: sec(filmCues()), train: sec(trainCues()), real: sec(realCues()), prove: sec(proveCues()), react: sec(reactCues() as unknown as Record<string, unknown>)});
