import raw from '../data/timeline.json';

export type Word = {w: string; from: number; to: number};
export type Segment = {id: string; scene: string; from: number; to: number; text: string; timing: string; words: Word[]};
export type Scene = {id: string; from: number; to: number};
export type Timeline = {
  fps: number;
  engine: string;
  voice: Record<string, unknown>;
  durationInFrames: number;
  durationSeconds: number;
  scenes: Scene[];
  segments: Segment[];
  cues: Record<string, number>;
};

export const TL = raw as unknown as Timeline;

const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']/g, '');

export const scene = (id: string): Scene => {
  const s = TL.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown scene ${id}`);
  return s;
};

export const seg = (id: string): Segment => {
  const s = TL.segments.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown segment ${id}`);
  return s;
};

/** Global frame where `word` (n-th occurrence) starts inside segment `segId`. */
export const at = (segId: string, word?: string, occurrence = 1, edge: 'start' | 'end' = 'start'): number => {
  const s = seg(segId);
  if (!word) return edge === 'start' ? s.from : s.to;
  const hits = s.words.filter((w) => norm(w.w) === norm(word));
  const h = hits[occurrence - 1];
  if (!h) throw new Error(`Word "${word}" #${occurrence} not found in ${segId}: ${s.text}`);
  return edge === 'start' ? h.from : h.to;
};

export const segEnd = (segId: string) => seg(segId).to;
export const isDraftVoice = () => TL.engine !== 'elevenlabs';
