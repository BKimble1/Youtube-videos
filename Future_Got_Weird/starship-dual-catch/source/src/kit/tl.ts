import timeline from '../data/timeline.json';
import {FPS} from '../theme';

export type Seg = {id: string; act: string; text: string; start: number; end: number};
export const SEGS: Seg[] = timeline.segments as Seg[];
export const TOTAL_S: number = timeline.total;
const byId = new Map(SEGS.map((s) => [s.id, s]));
export const seg = (id: string): Seg => {
  const s = byId.get(id);
  if (!s) throw new Error(`no segment ${id}`);
  return s;
};
// absolute frame of a segment's first / last spoken sample
export const fS = (id: string) => Math.round(seg(id).start * FPS);
export const fE = (id: string) => Math.round(seg(id).end * FPS);
