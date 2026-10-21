// Bundled with esbuild and run in node. Builds the machine-readable edit decision list for V7 FROM THE COMPOSITION'S
// OWN SHOT FUNCTION (evaluated on every frame), the caption windows the caption component actually displays, the
// locked narration's measured phrases and the effect cues. -> production/V7_EDL.json
import fs from 'node:fs';
import {shot7, SHOT_TABLE, INTENTIONAL_REPEATS} from '../source/src/v7/HiddenTriggerV7';
import {captionWindows7 as captionWindows} from '../source/src/v7/Captions7';
import {DURATION3, FPS3} from '../source/src/v3/theme3';
import CAPS7 from '../source/src/data/captions_v7.json';

const frames: {f: number; id: string; name: string; overlay: string; world: boolean; cam: any}[] = [];
for (let f = 0; f < DURATION3; f++) {
  const s = shot7(f / FPS3);
  const id = s.name.split(' ')[0];
  frames.push({f, id, name: s.name, overlay: s.overlay, world: s.world, cam: s.cam});
}
const shots: any[] = [];
for (const fr of frames) {
  const last = shots[shots.length - 1];
  if (last && last.id === fr.id && last.name === fr.name) {
    last.frame_out = fr.f + 1;
    last.camera_out = fr.cam;
  } else shots.push({id: fr.id, name: fr.name, overlay: fr.overlay, world: fr.world, frame_in: fr.f, frame_out: fr.f + 1, camera_in: fr.cam, camera_out: fr.cam});
}
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const cams = (c: any) => ({x: r3(c.x), d: r3(c.d), h: r3(c.h), z: r3(c.z), e: r3(c.e), ay: r3(c.ay)});
const table = Object.fromEntries(SHOT_TABLE.map((s) => [s.id, s]));
const edl = {
  title: 'FGW Hidden Trigger V7',
  composition: 'HiddenTriggerV7',
  entry: 'source/src/index.ts -> Root.tsx -> v7/HiddenTriggerV7.tsx (renders v6/HiddenTriggerV6)',
  fps: FPS3,
  frames: DURATION3,
  duration_s: DURATION3 / FPS3,
  audio: {mix: 'source/public/audio/mix_v6.wav', narration: 'audio/narration/narration_v3_testvoice.wav'},
  intended_order: SHOT_TABLE.map((s) => s.id),
  intentional_repeats: INTENTIONAL_REPEATS,
  shots: shots.map((s) => ({
    id: s.id,
    name: s.name.replace(/^P\d+ /, ''),
    beat: table[s.id]?.beat ?? null,
    declared_captions: table[s.id]?.phrases ?? null,
    edge_captions: table[s.id]?.edge ?? [],
    frame_in: s.frame_in,
    frame_out: s.frame_out,
    t_in: r3(s.frame_in / FPS3),
    t_out: r3(s.frame_out / FPS3),
    overlay: s.overlay,
    world: s.world,
    camera_in: cams(s.camera_in),
    camera_out: cams(s.camera_out),
    components: table[s.id]?.components ?? [],
  })),
  captions: captionWindows().map((w, i) => ({i, text: w.text, measured_start: CAPS7[i].start, end: CAPS7[i].end, window_start: r3(w.start), window_end: r3(w.end)})),
  sfx_cues: JSON.parse(fs.readFileSync('audio/sfx_cues_v6.json', 'utf8')),
};
fs.writeFileSync('production/V7_EDL.json', JSON.stringify(edl, null, 1));
console.log(edl.shots.map((s: any) => `${s.id.padEnd(4)} ${String(s.t_in.toFixed(3)).padStart(6)}-${s.t_out.toFixed(3).padStart(6)}  ${s.name}`).join('\n'));
