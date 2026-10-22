// V2 shared helpers: approved-audio cue times (the picture is cut to the locked V1 mix), tracking cameras for 2.5D
// scenes whose viewpoint changes, parallax depth layers for microscopic views, backdrops.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cam, Pt, camAt, lerp, inv, eio, clamp, word, toScreen, smooth, rnd, W, H} from '../lib';
import sfx from '../data/sfx_v1.json';
import {K} from '../art/Face';

// effect cue times of the approved mix (audio/sfx_cues.json): picture events land on these
const S = (name: string) => {
  const c = (sfx as {name: string; at: number}[]).find((x) => x.name === name);
  if (!c) throw new Error('missing sfx ' + name);
  return c.at;
};
export const FX = {
  tugEnd: S('motor tug (spans loop seam)'), alive: S('alive impact (low)'), slice: S('section slice open'), dive: S('dive into cell'),
  arrive: S('cell arrival (soft)'), pullBack: S('pull back'), smileMotor: S('smile motor'), tick0: S('anchor tick 0'), tick1: S('anchor tick 1'),
  tick2: S('anchor tick 2'), motorPull: S('motor pull (underneath)'), latch: S('pull latch'), hook2: S('second hook drop'), flex: S('finger flex servo'),
  glint: S('scalpel glint'), incision: S('incision'), tweezers: S('tweezers set'), contact: S('patch contact'), dive2: S('dive into repair'),
  timeJump: S('time jump'), pullBack2: S('pull back to finger'), flex2: S('finger flex servo 2'), clack: S('cutaway clack'), boundary: S('matched boundary'),
  close: S('window close'),
};
const Wd = (w: string, n = 1) => word(w, n).start;
export const CUE2 = {
  robots: Wd("robot's"), skin1: Wd('skin'), alive1: Wd('alive'), human: Wd('human'), then: Wd('then'), mechanical: Wd('mechanical'), face: Wd('face'),
  made: Wd('made'), smile: Wd('smile'), tiny: Wd('tiny'), anchors: Wd('anchors'), hold: Wd('hold'), motors: Wd('motors'), pull: Wd('pull'),
  underneath: Wd('underneath'), but1: Wd('but'), experiment: Wd('experiment'), stranger: Wd('stranger'), cut: Wd('cut'), robotic: Wd('robotic'),
  finger: Wd('finger'), added: Wd('added'), collagen: Wd('collagen'), patch1: Wd('patch'), gave: Wd('gave'), seven: Wd('seven'), days: Wd('days'),
  repair: Wd('repair'), cells2: Wd('cells', 2), into: Wd('into'), patch2: Wd('patch', 2), helping: Wd('helping'), close: Wd('close'), damage: Wd('damage'),
  machine: Wd('machine'), isnt: Wd("isn't"), alive2: Wd('alive', 2), but2: Wd('but', 2), skin4: Wd('skin', 4), wearing: Wd('wearing'), is2: Wd('is', 2),
};

// tracking camera: keys hold a tracked world point (resolved through the current projection), its screen position
// and zoom; interpolating the point (not the camera centre) keeps a subject steady while the viewpoint orbits.
export type TKey = {p: () => Pt; sx: number; sy: number; z: number; r?: number};
export const trackCam = (t: number, keys: [number, TKey, ((x: number) => number)?][]): Cam => {
  const at = (k: TKey) => ({p: k.p(), sx: k.sx, sy: k.sy, z: k.z, r: k.r ?? 0});
  if (t <= keys[0][0]) { const k = at(keys[0][1]); return camAt(k.p, {x: k.sx, y: k.sy}, k.z, k.r); }
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = at(keys[i - 1][1]), b = at(keys[i][1]);
      const e = (keys[i][2] ?? eio)(inv(keys[i - 1][0], keys[i][0], t));
      const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), e));
      // dive-weighted point interpolation (screen motion even across large zoom changes)
      const wa = 1 / a.z, wb = 1 / b.z, wz = 1 / z;
      const k = Math.abs(wa - wb) < 1e-9 ? e : (wa - wz) / (wa - wb);
      return camAt({x: lerp(a.p.x, b.p.x, k), y: lerp(a.p.y, b.p.y, k)}, {x: lerp(a.sx, b.sx, e), y: lerp(a.sy, b.sy, e)}, z, lerp(a.r, b.r, e));
    }
  }
  const k = at(keys[keys.length - 1][1]);
  return camAt(k.p, {x: k.sx, y: k.sy}, k.z, k.r);
};

export const Backdrop2: React.FC<{tone?: number; finger?: boolean}> = ({tone = 0, finger}) => (
  <AbsoluteFill style={{background: finger ? 'radial-gradient(ellipse at 50% 35%, #2A3E47 0%, #0A1216 80%)' : tone > 0.5 ? 'radial-gradient(ellipse at 50% 40%, #13414B 0%, #08242B 70%, #061A20 100%)' : `radial-gradient(ellipse at 50% 38%, #1D2B37 0%, ${K.bg1} 75%)`}} />
);

// depth layers for the microscopic views: soft out-of-focus fibres in front (move faster than the focal layer) and
// dim fibres behind (slower). Positions are derived from the focal layer's own mapping, so they move coherently.
export const Parallax: React.FC<{cam: Cam; m: (u: number, w: number) => Pt; uc: number; wc: number; a: number; id: string; tone?: number}> = ({cam, m, uc, wc, a, id}) => {
  if (a <= 0.01) return null;
  const C = {x: W / 2, y: H / 2};
  const layer = (f: number, seed: number, n: number) => Array.from({length: n}, (_, k) => {
    const w0 = wc + (rnd(seed + k) - 0.5) * 260, u0 = uc - 420 + rnd(seed + 50 + k) * 200;
    const pts = Array.from({length: 9}, (_, i) => {
      const u = u0 + i * 110, w = w0 + 14 * Math.sin(i * 0.9 + k);
      const P = toScreen(cam, m(u, w));
      return {x: C.x + f * (P.x - C.x), y: C.y + f * (P.y - C.y)};
    });
    return pts;
  });
  const fg = layer(1.8, 900, 4), bg = layer(0.55, 300, 7);
  const s = (() => { const p0 = toScreen(cam, m(uc, wc)), p1 = toScreen(cam, m(uc + 10, wc)); return Math.hypot(p1.x - p0.x, p1.y - p0.y) / 10; })();
  return (
    <svg width={W} height={H} style={{position: 'absolute'}}>
      <defs>
        <filter id={`${id}-fg`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={10} /></filter>
        <filter id={`${id}-bg`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={3} /></filter>
      </defs>
      <g filter={`url(#${id}-bg)`} opacity={0.35 * a}>{bg.map((p, k) => <path key={k} d={smooth(p)} fill="none" stroke="#3F8F98" strokeWidth={3.2 * s * 0.55} strokeLinecap="round" />)}</g>
      <g filter={`url(#${id}-fg)`} opacity={0.5 * a}>{fg.map((p, k) => <path key={k} d={smooth(p)} fill="none" stroke="#8FE0E2" strokeWidth={4 * s * 1.8} strokeLinecap="round" />)}</g>
    </svg>
  );
};
export const clampv = clamp;
