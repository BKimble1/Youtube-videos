import {useCurrentFrame} from 'remotion';
import {FPS, shot} from './timing';

/** Inside a shot's Sequence: local time t (s), global film time T (s), shot duration, and progress u 0..1. */
export const useShot = (id: string) => {
  const f = useCurrentFrame();
  const s = shot(id);
  const t = f / FPS;
  return {t, T: s.start + t, dur: s.end - s.start, u: Math.min(1, t / (s.end - s.start)), frame: f, start: s.start, end: s.end};
};
