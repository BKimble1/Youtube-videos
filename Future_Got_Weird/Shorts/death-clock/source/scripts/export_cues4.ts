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
import {easeInOut, inv} from '../src/lib/math';
import {musicPlan4, PictureHooks, SensorBeats, soundCues4, SOURCES} from '../src/lib/sound4';
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

/** The frame (fractional) where a rising dent first reaches `frac` of its full depth: the first integer frame at or
 *  past it, then bisection on the (continuous) picture function between that frame and the one before. */
const dentOnset = (dent: (f: number) => number, a: number, b: number, frac = 0.1): number | undefined => {
  let peak = 0;
  for (let f = a; f <= b; f++) peak = Math.max(peak, dent(f));
  if (!(peak > 0)) return undefined;
  const thr = frac * peak;
  for (let f = a + 1; f <= b; f++) {
    if (dent(f) >= thr && dent(f - 1) < thr) {
      let lo = f - 1;
      let hi = f;
      for (let i = 0; i < 30; i++) {
        const m = (lo + hi) / 2;
        if (dent(m) >= thr) hi = m;
        else lo = m;
      }
      return Math.round(hi * 100) / 100;
    }
  }
  return undefined;
};

/** frames over which a picture quantity moves (|change| per frame above eps), within [a, b] */
const moving = (q: (f: number) => number, a: number, b: number, eps = 1e-3): [number, number] | null => {
  const fr: number[] = [];
  for (let f = a + 1; f <= b; f++) if (Math.abs(q(f) - q(f - 1)) > eps) fr.push(f);
  return fr.length ? [fr[0] - 1, fr[fr.length - 1]] : null;
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
    const w = D.WIPE as Record<string, number> | undefined;
    if (w && [w.in0, w.cover, w.out1].every((v) => typeof v === 'number')) {
      hooks.wipe = {in0: w.in0, cover: w.cover, out1: w.out1};
      hooks.origin!.wipe = 'Dispatch.WIPE';
    }
  } else notes.dispatch = `Dispatch.tsx not imported (${disp.err})`;

  // ---- the sensor shot: Journey3 SENSOR_BEATS; the light touch measured with the picture's own press function
  //      (art/Interior portPress on Journey3's stroke = ease(inv(B.port0, B.port1, f)) with PORT_GEO.pressSensor); the
  //      bead exits from Journey3's SENSOR_REL (not exported: read from the source text and cross-checked)
  const j3 = await tryImport('../src/shots/Journey3.tsx');
  const itr = await tryImport('../src/art/Interior.tsx');
  const dvc = await tryImport('../src/art/Device.tsx');
  const j3src = fs.readFileSync(path.resolve(here, '../src/shots/Journey3.tsx'), 'utf8');
  if (j3.m && j3.m.SENSOR_BEATS && typeof j3.m.SENSOR_BEATS === 'object') {
    const sb = j3.m.SENSOR_BEATS as SensorBeats;
    hooks.sensor = {beats: sb};
    hooks.origin!.sensor = 'Journey3.SENSOR_BEATS';
    const press = fn(itr.m?.portPress);
    const PG = dvc.m?.PORT_GEO as Record<string, number> | undefined;
    const SECu = (itr.m?.SEC as Record<string, number> | undefined)?.units;
    const strokeLine = /const stroke = ease\(inv\(B\.port0, B\.port1, f\)\)/.test(j3src) && /PRESS_S = PORT_GEO\.pressSensor \* SEC\.units/.test(j3src);
    if (press && PG && typeof SECu === 'number' && strokeLine) {
      const P = PG.pressSensor * SECu;
      const dent = (f: number) => Number(press(easeInOut(inv(sb.nose0, sb.touch, f)), P));
      hooks.sensor.contact = dentOnset(dent, sb.nose0, sb.touch + 2);
      hooks.origin!.sensorContact = 'Interior.portPress(Journey3 stroke, PORT_GEO.pressSensor) at 10% of the dimple depth';
    } else notes.sensorContact = `light touch not measured (portPress ${!!press}, PORT_GEO ${!!PG}, SEC.units ${typeof SECu}, Journey3 stroke/press lines found ${strokeLine}); using SENSOR_BEATS.touch`;
    const m = j3src.match(/SENSOR_REL: SensorRelease = \{t0: B\.stream0 ([+-]) (\d+), t1: B\.stream1 ([+-]) (\d+), n: (\d+), feed: (\d+), travel: (\d+), vVessel: \d+, heroMerge: B\.heroRing ([+-]) (\d+)\}/);
    if (m) {
      const sg = (s: string, v: string) => (s === '-' ? -1 : 1) * Number(v);
      const t0 = B.stream0 + sg(m[1], m[2]);
      const t1 = B.stream1 + sg(m[3], m[4]);
      const n = Number(m[5]);
      const travel = Number(m[7]);
      const heroMerge = B.heroRing + sg(m[8], m[9]);
      hooks.sensor.beadExits = Array.from({length: n}, (_, k) => t0 + (k * (t1 - t0)) / Math.max(1, n - 1));
      hooks.sensor.heroExit = heroMerge - travel;
      // cross-check with the picture's own release function: each bead must be at the nose tip (feed -> stream) there
      const rs = fn(itr.m?.releaseState);
      if (rs) {
        const rel = {t0, t1, n, feed: Number(m[6]), travel, vVessel: 16, heroMerge};
        const bad = [...hooks.sensor.beadExits.map((f, k) => [k, f]), [-1, hooks.sensor.heroExit]].filter(([k, f]) => {
          const a = rs(rel, k, f - 0.01) as {phase: string};
          const b = rs(rel, k, f + 0.01) as {phase: string};
          return !(a.phase === 'feed' && b.phase === 'stream');
        });
        notes.sensorRelease = bad.length ? `releaseState disagrees for beads ${JSON.stringify(bad)}` : `Journey3 SENSOR_REL {t0 ${t0}, t1 ${t1}, n ${n}, travel ${travel}, heroMerge ${heroMerge}}: every exit is the feed -> stream switch of Interior.releaseState`;
      }
      hooks.origin!.sensorRelease = 'Journey3 SENSOR_REL (source text) + Interior.releaseState check';
    } else notes.sensorRelease = 'Journey3 SENSOR_REL not found in the source text: the bead ticks use the V4 fallback (stream0+2 .. stream1-5, 16 beads)';
  } else notes.sensor = `Journey3 SENSOR_BEATS not imported (${j3.err ?? 'no export'})`;

  // ---- the treatment: Aftermath3 treatState is the picture's mechanism state; the press lands on the frame the nose's
  //      dimple first reads, and every motion the cues follow is checked against the B4 keys they are placed on
  const a3 = await tryImport('../src/shots/Aftermath3.tsx');
  const ts = fn(a3.m?.treatState);
  /** each mechanism motion as the picture moves it, and the cue (id) that has to follow it (checked once the cues exist) */
  const treatChecks: {name: string; moves: [number, number] | null; keys: [number, number]; cue: string; at: 'span' | 'end'}[] = [];
  let slugRows: string[] = [];
  if (ts) {
    const st = (g: number) => ts(g) as {roll: number; shutter: number; stroke: number; dimple: number; head: number; dose?: unknown};
    const T = B4;
    hooks.treat = {contact: dentOnset((g) => st(g).dimple, T.tStroke0, T.tStroke1 + 2)};
    hooks.origin!.treatContact = 'Aftermath3.treatState(g).dimple at 10% of its depth';
    const span = (q: (g: number) => number, a: number, b: number) => moving(q, a - 3, b + 3);
    // the roll to the underside: the swish follows the frames the picture actually turns the case over (V4 continuity:
    // a smoothstep that starts one frame before tRoll0 and rests at the tCut punch-in, not tRoll0..tRoll1)
    const rollSpan = span((g) => st(g).roll, T.tRoll0, Math.max(T.tRoll1, T.tCut));
    if (rollSpan) {
      hooks.treat.roll = rollSpan;
      hooks.origin!.treatRoll = 'Aftermath3.treatState(g).roll (frames it moves)';
    }
    treatChecks.push(
      {name: 'roll', moves: rollSpan, keys: [T.tRoll0, T.tRoll1], cue: 'tilt2', at: 'span'},
      {name: 'shutter open', moves: span((g) => st(g).shutter, T.tShut0, T.tShut1), keys: [T.tShut0, T.tShut1], cue: 'shutter', at: 'span'},
      {name: 'stroke', moves: span((g) => st(g).stroke, T.tStroke0, T.tStroke1), keys: [T.tStroke0, T.tStroke1], cue: 'actuator', at: 'span'},
      {name: 'retract', moves: span((g) => st(g).stroke, T.tRetract0, T.tRetract1), keys: [T.tRetract0, T.tRetract1], cue: 'retract', at: 'span'},
      {name: 'shutter close', moves: span((g) => st(g).shutter, T.tShutClose0, T.tShutClose1), keys: [T.tShutClose0, T.tShutClose1], cue: 'port_close', at: 'end'},
    );
    let slug0 = -1;
    let lumen = -1;
    for (let g = T.tSlug0 - 4; g <= T.treatMatch; g++) {
      if (slug0 < 0 && st(g).head >= 0) slug0 = g;
      if (lumen < 0 && st(g).dose) lumen = g;
    }
    slugRows = [`slug leaves at ${slug0} (tSlug0 ${T.tSlug0})${slug0 === T.tSlug0 ? '' : ' MISMATCH'}`, `slug in the lumen from ${lumen} (tSlugLumen ${T.tSlugLumen})${Math.abs(lumen - T.tSlugLumen) <= 1 ? '' : ' MISMATCH'}`];
  } else notes.treatState = `Aftermath3.treatState not imported (${a3.err ?? 'no export'})`;

  const cues = soundCues4(hooks);
  if (ts) {
    // the cue must start and end within 1 frame of the motion it follows (or, for 'end', sit on the frame it stops)
    const rows = treatChecks.map(({name, moves, keys, cue, at}) => {
      const c = cues.find((q) => q.id === cue);
      const cs: [number, number] | null = c ? [c.f, c.f + Math.round((c.dur ?? 0) * FPS * 1000) / 1000] : null;
      const ok = !!moves && !!cs && (at === 'end' ? Math.abs(cs[0] - moves[1]) <= 1 : Math.abs(cs[0] - moves[0]) <= 1 && Math.abs(cs[1] - moves[1]) <= 1);
      const cueTxt = !cs ? 'missing' : at === 'end' ? `${cs[0]}` : `${cs[0]}-${cs[1]}`;
      return `${name} moves ${moves ? moves.join('-') : 'never'} (keys ${keys.join('-')}), ${cue} ${cueTxt}${ok ? '' : ' MISMATCH'}`;
    });
    notes.treatState = [...rows, ...slugRows].join('; ');
  }
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
