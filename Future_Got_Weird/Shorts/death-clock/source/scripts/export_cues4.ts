// Writes the V4 cue data from the same TypeScript modules the picture uses:
//   audio/v4/cues.json - sound cues, the FROZEN V3 music plan, beat tables (B and B4), countdown, caption windows, and
//   `sources`: which picture key/function each provisional cue read, or which fallback it used.
// The V3 file audio/v3/cues.json is only READ (V3 stays reproducible: tools/build_audio_v4.py rebuilds V3's gain
// envelope from it). Picture modules are imported dynamically, so a missing or half-edited picture file only falls back.
// Run: npx tsx scripts/export_cues4.ts
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chunkWindows} from '../src/lib/captions';
import {B4} from '../src/lib/beats4';
import {countdown3, DEV3} from '../src/lib/device3';
import {HeartSound, musicPlan4, PictureHooks, soundCues4, SOURCES} from '../src/lib/sound4';
import {B, FPS, TOTAL, UNITS, WORDS} from '../src/lib/timeline3';

const here = path.dirname(fileURLToPath(import.meta.url));
const v3 = JSON.parse(fs.readFileSync(path.resolve(here, '../../audio/v3/cues.json'), 'utf8'));
const out = path.resolve(here, '../../audio/v4/cues.json');

type Mod = Record<string, unknown>;
const tryImport = async (rel: string): Promise<{m: Mod | null; err?: string}> => {
  const p = path.resolve(here, rel);
  if (!['', '.ts', '.tsx'].some((x) => fs.existsSync(p + x))) return {m: null, err: 'not present'};
  try {
    return {m: (await import(p)) as Mod};
  } catch (e) {
    return {m: null, err: String(e).split('\n')[0].slice(0, 200)};
  }
};
const fn = (v: unknown) => (typeof v === 'function' ? (v as (...a: unknown[]) => unknown) : null);

/** heart4.ts -> HeartSound. Preferred contract: `export const heartSound4: HeartSound` (or a function returning one).
 * Also accepted: a beat list (numbers, or {f|frame, kind?}) under a few likely names; kinds 'quiver'/'irregular'/'fib'
 * mark the irregular spans, everything else is a regular lub. */
const heartFrom = (m: Mod): {h: HeartSound; how: string} | null => {
  const isHS = (o: unknown): o is HeartSound => !!o && typeof o === 'object' && Array.isArray((o as HeartSound).journey) && Array.isArray((o as HeartSound).settled);
  for (const name of ['heartSound4', 'HEART_SOUND4']) {
    const v = fn(m[name]) ? fn(m[name])!() : m[name];
    if (isHS(v)) return {h: v, how: `heart4.${name}`};
  }
  for (const name of ['HEART4', 'heartBeats4', 'HEART_BEATS', 'BEATS4', 'heartBeats', 'LUBS']) {
    const raw = fn(m[name]) ? fn(m[name])!() : m[name];
    const arr = Array.isArray(raw) ? raw : raw && typeof raw === 'object' && Array.isArray((raw as Mod).beats) ? ((raw as Mod).beats as unknown[]) : null;
    if (!arr) continue;
    const items = arr
      .map((b) => (typeof b === 'number' ? {f: b, kind: 'lub'} : b && typeof b === 'object' ? {f: Number((b as Mod).f ?? (b as Mod).frame), kind: String((b as Mod).kind ?? 'lub')} : null))
      .filter((b): b is {f: number; kind: string} => !!b && Number.isFinite(b.f));
    if (!items.length) continue;
    const irr = (k: string) => /quiver|irreg|fib/i.test(k);
    const lubs = items.filter((b) => !irr(b.kind)).map((b) => b.f);
    const jIrr = items.filter((b) => irr(b.kind) && b.f < B.hold).map((b) => b.f);
    const tIrr = items.filter((b) => irr(b.kind) && b.f >= B.hold).map((b) => b.f);
    const h: HeartSound = {
      journey: lubs.filter((f) => f < B.lethal),
      fib: jIrr.length ? [Math.min(...jIrr), Math.max(...jIrr) + 4] : [B.lethal - 2, B.lethal - 2 + (B.sig0 + 4 - B.lethal)],
      quiver: tIrr.length ? [Math.min(...tIrr), Math.max(...tIrr) + 2] : [B.settleHeart0, B.settleHeart0 + 16],
      settled: lubs.filter((f) => f >= B.settleHeart0),
    };
    return {h, how: `heart4.${name} (beat list adapter)`};
  }
  return null;
};

(async () => {
  // ---- the frozen music plan must equal V3's exactly (music.wav is reused byte for byte)
  const music = musicPlan4();
  const v3m = v3.music as Record<string, number>;
  const bad = Object.keys(v3m).filter((k) => (music as Record<string, number>)[k] !== v3m[k]).concat(Object.keys(music).filter((k) => !(k in v3m)));
  if (bad.length) throw new Error(`musicPlan4 differs from audio/v3/cues.json music: ${bad.join(', ')}`);
  // ---- timeline3 is locked: B must equal the V3 export (the music plan and the countdown read it)
  const movedB = Object.keys(v3.beats).filter((k) => (B as Record<string, number>)[k] !== v3.beats[k]);
  if (movedB.length) throw new Error(`timeline3 B moved since V3 (locked): ${movedB.join(', ')}`);

  // ---- picture hooks
  const hooks: PictureHooks = {origin: {}};
  const notes: Record<string, string> = {};
  const disp = await tryImport('../src/shots/Dispatch.tsx');
  if (disp.m) {
    const D = disp.m;
    const rp = fn(D.rotorPhase);
    const hd = fn(D.hospDrone);
    if (rp) {
      hooks.rotorPhase = (f) => Number(rp(f));
      hooks.origin!.rotorPhase = 'Dispatch.rotorPhase';
    } else if (hd) {
      hooks.rotorPhase = (f) => Number((hd(f) as Mod).spin);
      hooks.origin!.rotorPhase = 'Dispatch.hospDrone(f).spin';
    }
    const dv = fn(D.droneView) ?? fn(D.droneScreen);
    if (dv) {
      hooks.droneView = (f) => {
        const r = dv(f) as Mod | null;
        if (!r) return null;
        const scale = Number(r.scale ?? r.s);
        return Number.isFinite(scale) && Number.isFinite(Number(r.x)) ? {x: Number(r.x), scale} : null;
      };
      hooks.origin!.droneView = fn(D.droneView) ? 'Dispatch.droneView' : 'Dispatch.droneScreen';
    }
    if (typeof D.MAP_END === 'number') {
      hooks.mapEnd = D.MAP_END;
      hooks.origin!.mapEnd = 'Dispatch.MAP_END';
    }
  } else notes.dispatch = `Dispatch.tsx not imported (${disp.err})`;
  const ht = await tryImport('../src/lib/heart4');
  if (ht.m) {
    const r = heartFrom(ht.m);
    if (r) {
      hooks.heart = r.h;
      hooks.origin!.heart = r.how;
    } else notes.heart4 = `present but no recognised export (exports: ${Object.keys(ht.m).join(', ')})`;
  } else notes.heart4 = ht.err ?? 'not present';

  const cues = soundCues4(hooks);
  const ids = new Set<string>();
  for (const c of cues) {
    if (ids.has(c.id)) throw new Error(`duplicate cue id ${c.id}`);
    ids.add(c.id);
    if (!Number.isFinite(c.f) || c.f < 0 || c.f >= TOTAL) throw new Error(`cue ${c.id} frame ${c.f} outside 0..${TOTAL - 1}`);
  }
  const v3ids = new Set((v3.cues as {id: string}[]).map((c) => c.id));
  const data = {
    version: 'v4',
    fps: FPS,
    total_frames: TOTAL,
    beats: B,
    beats4: B4,
    units: UNITS,
    device: DEV3,
    countdown_at: Object.fromEntries([0, B.red, B.count0, B.crit0, B.map0 - 1, B.act0, B.hold, B.callback].map((f) => [f, +countdown3(f).toFixed(3)])),
    music,
    music_frozen_to_v3: true,
    sources: {...SOURCES},
    hook_notes: notes,
    diff_vs_v3: {
      added: cues.filter((c) => !v3ids.has(c.id)).map((c) => c.id),
      removed: [...v3ids].filter((id) => !ids.has(id)),
    },
    cues,
    captions: chunkWindows().map((c) => ({text: c.text, start: +c.start.toFixed(3), end: +c.end.toFixed(3), hl: c.hl ?? null})),
    words: WORDS.length,
  };
  // the captions are locked: they must equal the V3 export
  if (JSON.stringify(data.captions) !== JSON.stringify(v3.captions)) throw new Error('caption windows differ from V3 (locked)');
  fs.mkdirSync(path.dirname(out), {recursive: true});
  fs.writeFileSync(out, JSON.stringify(data, null, 1));
  console.log('wrote', out, cues.length, 'cues;', 'added', data.diff_vs_v3.added.length, 'removed', data.diff_vs_v3.removed.length);
  for (const [k, v] of Object.entries(SOURCES)) console.log(`  ${k}: ${v}`);
  for (const [k, v] of Object.entries(notes)) console.log(`  note ${k}: ${v}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
