// FGW "This Laser Makes You Hear Voices": the one optics room, in metres, and the measured narration.
// Axes: x runs along the optical axis (transmitter exit at x = 0, the listener's ear at x = 2.44, i.e. eight feet),
// y is up, z is lateral (+z toward the camera side of the room, the far wall with the doorway is at z = WALL_Z).
// Every state in the film is a pure function of time in seconds, keyed to the measured words (data/timeline.json).
import tl from './data/timeline.json';
import {v3} from './p3';

export const W = 1080;
export const H = 1920;
export const FPS = tl.fps;
export const FRAMES = tl.frames;
export const DUR = tl.duration;

type Word = {word: string; start: number; end: number};
export const WORDS: Word[] = tl.words as Word[];
export const CAPTIONS = tl.captions as {text: string; emph: string[]; start: number; end: number; show: number; hide: number}[];
export const w = (i: number) => WORDS[i].start;
export const we = (i: number) => WORDS[i].end;

// ---- the plan (metres). The beam height equals the recipient's ear height (both stand on the same floor).
export const BEAM_Y = 1.43;
export const EXIT = v3(0, BEAM_Y, 0); // transmitter exit aperture
export const EAR_X = 2.44; // 8 ft
export const BENCH = {x0: -1.25, x1: 0.42, z0: -0.46, z1: 0.42, y: 0.93};
export const WALL_Z = -2.15; // far wall (with the doorway)
export const RIGHT_X = 3.75; // right-hand wall
export const LEFT_X = -1.7;
export const DOOR = {x0: 2.92, x1: 3.62, h: 2.12}; // doorway in the far wall, right of the listener: a landmark
export const WALK_X = 1.5; // the bystander crosses the axis here (upstream of the ear)
export const ROOM_H = 2.9;
