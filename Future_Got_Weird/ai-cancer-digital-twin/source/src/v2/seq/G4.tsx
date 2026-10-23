// SEQUENCE G, V4 (199.3 – 231.1 s): the idea, its range, its loop, and the cell we started with.
//  Pull-out: from the precision kill, one continuous move out of the lung to the whole person; their digital twin (a
//    computational model, cyan) separates from them.
//  "Cancer isn't one disease": on the twin, tumours light up in five different organs; the camera dives into one and
//    pulls back across five tumours that are built differently (glands, spindle-cell streams, sheets of small round
//    cells, pigmented nests, branching fronds), each with its own surface marker. One universal drug fits none of the
//    markers; molecules designed for each one bind.
//  The loop, as one continuous chain on one tumour: a scan turns the tissue into its model; the model is run forward
//    (where it would grow, where treatment would push it back) and shows its weak region; the camera pushes into that
//    region and becomes the target protein, where a designed molecule seats; the pocket's shape hands over to a T cell
//    that is switched on and multiplies; the T cells ride out into the blood, where a read checks the DNA fragments
//    passing by and flags a tumour fragment.
//  "A different answer for every cancer": pulling back, each tumour resolves in its own way (drug from the inside, T
//    cells from the edge…), the change spreading through it until healthy tissue is left.
//  The single cell: the opening composition, then a turned, closer view; a T cell steers to it, recognises it, kills
//    it, a macrophage clears it away; one retreat (cell → lung, its vessels → the person), ending on the opening framing
//    without the lesion.
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {P as Pt, lerp, smooth, seg, rand, mixHex, clamp01, noise, closedPath} from '../../kit/core';
import {Shot} from '../director';
import {T, TE, DURATION2} from '../time';
import {path, mapCam} from '../rig';
import {P} from '../palette';
import {Body, SITE} from '../art/body';
import {BodyWorld} from '../art/lung';
import {cellAt, TissueField, TissueBack, Cell2, TCell2, ApoptoticCell, DividingCell, R, HEALTHY, TUMOR, CLONES, lookMix, Motes, Look} from '../art/tissue';
import {AIBack, dtBoundary} from '../art/ai';
import {Protein, Molecule, MOL_FIT, POCKET} from '../art/protein';
import {Dendritic, Granules, Synapse, fingerPath} from '../art/immune';
import {BloodTunnel} from '../art/blood';
import {Bokeh, Phagocyte} from '../art/depth';
import {OPEN, OPEN_END, toTissue, fromTissue} from './A';
import {BODY_PULL, PULL0, Frag} from './F4';
import {morphPath} from './F';

const tG = {
  breakthrough: T("And that's the breakthrough"), notOne: T("Cancer isn't one disease"), one: T('with one weakness.'), weakness: TE('with one weakness.'),
  every: T('Every tumor can be different.'), different: TE('Every tumor can be different.'), so: T('So imagine a system'), universal: T('one universal drug.'), drugE: TE('one universal drug.'),
  studies: T('It studies each cancer,'), predicts: T('predicts its behavior,'), designs: T('designs a targeted attack,'), activates: T('activates the immune system,'), watches: T('and watches for anything'),
  survivesE: TE('anything that survives.'), answer: T('A different answer for every cancer.'), remember: T('And remember that single cell'), finding: T('Imagine finding it...'),
  before: T('before it ever has the chance'), tumorE: TE('to become a tumor.'),
};
const lift = (t: number, a: number, b: number) => smooth(seg(t, a, b));
const C0 = cellAt(0, 0);

// ================================================================================================ the person and the twin
const TWIN_X = 840;
const SITES: {p: Pt; spec: number}[] = [
  {p: [0, -785], spec: 2},
  {p: [SITE.tumor[0], SITE.tumor[1]], spec: 0},
  {p: [-96, -168], spec: 3},
  {p: [40, -20], spec: 1},
  {p: [-150, 430], spec: 4},
];
const LUNG_SITE: Pt = [TWIN_X + SITE.tumor[0], SITE.tumor[1]];
const BODY2 = path([
  {...BODY_PULL(PULL0 + 2.35), t: PULL0 + 2.35},
  {t: tG.notOne + 0.25, x: 600, y: -120, z: 0.5, rot: 0},
  {t: tG.one - 0.15, x: TWIN_X + 40, y: -330, z: 0.78, rot: 0},
  {t: tG.weakness - 0.05, x: LUNG_SITE[0], y: LUNG_SITE[1], z: 42, rot: 0},
]);
const bodyCam = (t: number) => (t < PULL0 + 2.35 ? BODY_PULL(t) : BODY2(t));
const BodyG: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const split = lift(t, PULL0 + 1.6, PULL0 + 2.8);
  const ai = lift(t, PULL0 + 1.8, PULL0 + 3.0);
  return (
    <BodyWorld t={t} cam={cam} body={{glow: 0, chest: 1, lesion: 0.5 * (1 - split), healthy: 0.6}}
      back={<g opacity={ai}><AIBack cam={cam} t={t} op={0.6} /></g>}
      front={
        <g>
          <g transform={`translate(${TWIN_X * split} 0)`} opacity={smooth(split * 1.6)}><Body t={t} digital={1} slices={1} /></g>
          {/* tumours in different organs light up on the model, each in its own colour */}
          {SITES.map((s, k) => {
            const on = lift(t, tG.notOne + 0.1 + k * 0.3, tG.notOne + 0.5 + k * 0.3);
            const col = SPEC[s.spec].mark;
            return on > 0.01 && (
              <g key={k} transform={`translate(${TWIN_X + s.p[0]} ${s.p[1]})`} opacity={on * split}>
                <circle r={60} fill="url(#glowWhite)" opacity={0.25} />
                <path d={closedPath(Array.from({length: 9}, (_, i) => { const a = (i / 9) * Math.PI * 2; const r = 16 * (1 + 0.3 * noise(i * 1.3, k)); return [Math.cos(a) * r, Math.sin(a) * r] as Pt; }))} fill={SPEC[s.spec].look.fill} stroke={col} strokeWidth={3} />
              </g>
            );
          })}
        </g>
      } />
  );
};

// ================================================================================================ five tumours, built differently
type Spec = {x: number; y: number; R: number; seed: number; arch: number; look: Look; mark: string; mk: number; bg: string};
const SPEC: Spec[] = [
  {x: 0, y: 0, R: 520, seed: 1.3, arch: 0, look: TUMOR, mark: '#FF5FB3', mk: 0, bg: '#E2A9B4'},
  {x: 1500, y: -240, R: 470, seed: 2.1, arch: 1, look: CLONES[1], mark: '#B58CFF', mk: 2, bg: '#4A2050'},
  {x: 3000, y: 160, R: 500, seed: 3.7, arch: 2, look: CLONES[2], mark: '#FFB03D', mk: 1, bg: '#5A1428'},
  {x: 4500, y: -170, R: 480, seed: 4.4, arch: 3, look: {fill: '#C2783A', light: '#E8A870', deep: '#6E3A14', nuc: '#4A2008', nucDeep: '#2A1004'}, mark: '#5FD6C8', mk: 3, bg: '#E6B4AE'},
  {x: 6000, y: 120, R: 460, seed: 5.2, arch: 4, look: CLONES[3], mark: '#FFE15F', mk: 4, bg: '#2E0E36'},
];
const inside = (s: Spec, x: number, y: number, k = 0.93) => Math.hypot(x, y) < s.R * dtBoundary(Math.atan2(y, x), s.seed) * k;
type SC = {x: number; y: number; r: number; rx: number; ry: number; a: number; kind: number};
/** cells of each architecture, in specimen-local coordinates */
const CELLS: SC[][] = SPEC.map((s) => {
  const out: SC[] = [];
  const sd = Math.floor(s.seed * 100);
  if (s.arch === 0) {           // glands: rings of columnar cells round a lumen
    for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) {
      const gx = i * 190 + (j % 2 ? 95 : 0) + (rand(sd + i * 7 + j * 13) - 0.5) * 40, gy = j * 165 + (rand(sd + i * 11 + j * 5) - 0.5) * 40;
      if (!inside(s, gx, gy, 0.8)) continue;
      out.push({x: gx, y: gy, r: 38, rx: 38, ry: 38, a: 0, kind: 9});
      for (let m = 0; m < 9; m++) { const a = (m / 9) * Math.PI * 2; out.push({x: gx + Math.cos(a) * 62, y: gy + Math.sin(a) * 62, r: 26, rx: 15, ry: 28, a: (a * 180) / Math.PI + 90, kind: 0}); }
    }
  } else if (s.arch === 1) {    // spindle cells in streams
    for (let j = -18; j <= 18; j++) for (let i = -9; i <= 9; i++) {
      const x = i * 66 + (j % 2 ? 33 : 0) + (rand(sd + i * 3 + j * 17) - 0.5) * 16, y = j * 28;
      if (!inside(s, x, y)) continue;
      const a = 30 * Math.sin(x / 260) + 25 * Math.cos(y / 220);
      out.push({x, y, r: 30, rx: 36, ry: 9, a, kind: 1});
    }
  } else if (s.arch === 2) {    // a dense sheet of small round cells
    for (let j = -16; j <= 16; j++) for (let i = -16; i <= 16; i++) {
      const x = i * 34 + (j % 2 ? 17 : 0) + (rand(sd + i * 5 + j * 9) - 0.5) * 8, y = j * 30 + (rand(sd + i * 9 + j * 3) - 0.5) * 8;
      if (!inside(s, x, y)) continue;
      out.push({x, y, r: 15, rx: 15, ry: 15, a: 0, kind: 2});
    }
  } else if (s.arch === 3) {    // nests of large cells with pigment, separated by stroma
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
      const nx = i * 240 + (j % 2 ? 120 : 0) + (rand(sd + i * 7 + j) - 0.5) * 50, ny = j * 210 + (rand(sd + i + j * 7) - 0.5) * 50;
      if (!inside(s, nx, ny, 0.78)) continue;
      for (let m = 0; m < 7; m++) { const a = (m / 6) * Math.PI * 2, d = m === 6 ? 0 : 58; out.push({x: nx + Math.cos(a) * d, y: ny + Math.sin(a) * d, r: 32, rx: 32, ry: 32, a: 0, kind: 3}); }
    }
  } else {                      // branching fronds lined by cells
    for (let f = 0; f < 7; f++) {
      const a0 = (f / 7) * Math.PI * 2 + 0.3;
      for (let u = 0.12; u < 0.86; u += 0.055) {
        const bend = 0.35 * Math.sin(u * 4 + f);
        const r = s.R * u;
        const px = Math.cos(a0 + bend * u) * r, py = Math.sin(a0 + bend * u) * r;
        const nrm = a0 + bend * u + Math.PI / 2;
        out.push({x: px, y: py, r: 22, rx: 22, ry: 22, a: 0, kind: 8});
        [-1, 1].forEach((sg) => out.push({x: px + Math.cos(nrm) * 30 * sg, y: py + Math.sin(nrm) * 30 * sg, r: 13, rx: 13, ry: 13, a: 0, kind: 4}));
      }
    }
  }
  return out;
});
const healthyLook = HEALTHY;
/** state of a specimen cell: 0 tumour, 0.5 dying, 1 healthy (the resolution spreads through each tumour its own way) */
const RES_T = (k: number) => tG.answer - 0.15 + k * 0.18;
const resolve = (k: number, c: SC, s: Spec, t: number) => {
  const d = Math.hypot(c.x, c.y) / s.R;
  const order = k === 0 ? d : k === 1 ? 1 - d : k === 2 ? (c.x / s.R + 1) / 2 : k === 3 ? (c.y / s.R + 1) / 2 : 1 - d;
  return clamp01((t - RES_T(k) - order * 1.1) / 0.7);
};
const SpecCell: React.FC<{c: SC; look: Look; t: number; st: number; seed: number}> = ({c, look, t, st, seed}) => {
  const dying = Math.sin(clamp01(st) * Math.PI);
  const lk = st < 0.5 ? lookMix(look, {...look, fill: '#9A7E92', light: '#C2AABC', deep: '#5E4458'}, dying) : lookMix({...look, fill: '#9A7E92', light: '#C2AABC', deep: '#5E4458'}, healthyLook, (st - 0.5) * 2);
  if (c.kind === 9) return <circle cx={c.x} cy={c.y} r={c.r} fill={mixHex('#F6D8DC', '#F8E2E0', st)} />;
  if (c.kind === 8) return <circle cx={c.x} cy={c.y} r={c.r} fill={mixHex('#F0C8C8', '#F6D4D0', st)} />;
  const sh = 1 - 0.25 * dying;
  return (
    <g transform={`translate(${c.x} ${c.y}) rotate(${c.a + 6 * Math.sin(t * 0.8 + seed)}) scale(${sh})`}>
      <ellipse rx={c.rx} ry={c.ry} fill={lk.deep} />
      <ellipse rx={c.rx * 0.88} ry={c.ry * 0.86} fill={lk.fill} />
      <ellipse rx={c.rx * 0.88} ry={c.ry * 0.86} fill="url(#volSoft)" />
      <ellipse cx={c.kind === 0 ? 0 : 0} cy={c.kind === 0 ? c.ry * 0.45 : 0} rx={c.kind === 1 ? c.rx * 0.38 : c.rx * 0.48} ry={c.kind === 1 ? c.ry * 0.5 : c.kind === 0 ? c.ry * 0.3 : c.ry * 0.48} fill={lk.nuc} />
      {c.kind === 3 && st < 0.5 && [0, 1, 2].map((m) => <circle key={m} cx={(rand(seed + m) - 0.5) * c.r} cy={(rand(seed * 3 + m) - 0.5) * c.r} r={4} fill="#3A1A06" opacity={0.8 * (1 - st * 2)} />)}
    </g>
  );
};
const markerPts = (s: Spec) => Array.from({length: 12}, (_, m) => {
  const a = (m / 12) * Math.PI * 2 + s.seed;
  const r = s.R * dtBoundary(a, s.seed) * 0.99;
  return {a, x: Math.cos(a) * r, y: Math.sin(a) * r};
});
const specShape = (mk: number, r: number) => mk <= 2 ? morphPath(mk, mk, 0, r) : mk === 3 ? `M 0 ${-r * 1.2} L ${r} 0 L 0 ${r * 1.2} L ${-r} 0 Z` : Array.from({length: 10}, (_, i) => { const a = (i / 10) * Math.PI * 2 - Math.PI / 2; const rr = i % 2 ? r * 0.5 : r * 1.2; return `${i ? 'L' : 'M'} ${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`; }).join(' ') + ' Z';
const CS = SPEC[2]; // the tumour the loop is shown on (centre of the group)
const WEAK: Pt = [CS.R * 0.32, -CS.R * 0.26];

const Specimens: React.FC<{t: number; cam: Cam; mode: 'intro' | 'loop' | 'resolve'}> = ({t, cam, mode}) => {
  const sweep = (k: number) => Math.exp(-((t - (tG.every + 0.15 + k * 0.3)) ** 2) / 0.04);
  const scanX = lerp(-CS.R * 1.2, CS.R * 1.2, lift(t, tG.studies + 0.05, tG.predicts - 0.1));
  const digit = mode === 'loop' && t > tG.studies;
  const pred = lift(t, tG.predicts, tG.predicts + 1.1);
  const weakK = lift(t, tG.predicts + 0.4, tG.designs);
  const uni = (k: number) => clamp01((t - (tG.so + 0.35 + k * 0.32)) / 1.6);
  const match = (k: number) => lift(t, tG.universal + 0.05 + k * 0.12, tG.drugE + 0.25 + k * 0.12);
  return (
    <g>
      <rect width={W} height={H} fill="#140A12" />
      <rect width={W} height={H} fill="url(#glowMag)" opacity={0.08} />
      <g transform={camTransform(cam, 0.5)}>{Array.from({length: 14}, (_, k) => <circle key={k} cx={-2000 + k * 800} cy={(k % 2 ? -900 : 860) + 200 * Math.sin(k)} r={380} fill="url(#bokehDeep)" />)}</g>
      <g transform={camTransform(cam)}>
        {SPEC.map((s, k) => {
          const hl = mode === 'intro' ? sweep(k) : 0;
          const d = closedPath(Array.from({length: 64}, (_, i) => { const a = (i / 64) * Math.PI * 2; const r = s.R * dtBoundary(a, s.seed); return [Math.cos(a) * r, Math.sin(a) * r] as Pt; }), 1);
          const resK = mode === 'resolve' ? 1 : 0;
          return (
            <g key={k} transform={`translate(${s.x} ${s.y}) scale(${1 + 0.04 * hl})`}>
              <path d={d} fill="#000" opacity={0.35} transform="translate(30 40)" />
              <path d={d} fill={mixHex(s.bg, '#E8B0AE', resK * resolve(k, {x: 0, y: 0, r: 0, rx: 0, ry: 0, a: 0, kind: 0}, s, t))} />
              {CELLS[k].map((c, i) => <SpecCell key={i} c={c} look={s.look} t={t} st={mode === 'resolve' ? resolve(k, c, s, t) : 0} seed={i + k * 1000} />)}
              <path d={d} fill="url(#volSoft)" opacity={0.7} />
              <path d={d} fill="none" stroke={mixHex(s.look.light, '#FFFFFF', hl)} strokeWidth={10 + 10 * hl} opacity={0.5 + 0.5 * hl} />
              {/* surface markers: each tumour its own shape */}
              {(mode !== 'resolve' || t < RES_T(k) + 0.6) && markerPts(s).map((m, i) => (
                <g key={'m' + i} transform={`translate(${m.x} ${m.y}) rotate(${(m.a * 180) / Math.PI + 90})`} opacity={mode === 'resolve' ? 1 - lift(t, RES_T(k), RES_T(k) + 0.6) : 1}>
                  <path d={specShape(s.mk, 40)} fill={s.mark} stroke="#FFFFFF" strokeWidth={5} />
                </g>
              ))}
              {/* one universal drug: it reaches a marker and does not fit */}
              {mode === 'intro' && uni(k) > 0 && uni(k) < 1 && (() => {
                const m = markerPts(s)[(k * 5) % 12];
                const u = uni(k);
                const out = 1 - Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) + (u > 0.62 ? (u - 0.62) * 1.6 : 0);
                const dd = 110 + 520 * out;
                const x = m.x + Math.cos(m.a) * dd, y = m.y + Math.sin(m.a) * dd;
                return (
                  <g transform={`translate(${x} ${y}) rotate(${(m.a * 180) / Math.PI + 90 + (u > 0.62 ? 40 * (u - 0.62) : 0)}) scale(1.8)`} opacity={1 - lift(u, 0.8, 1)}>
                    <rect x={-20} y={-14} width={40} height={90} rx={14} fill="#8E969E" stroke="#D6DCE2" strokeWidth={4} />
                    <rect x={-24} y={-30} width={48} height={22} rx={8} fill="#B8C0C8" />
                  </g>
                );
              })()}
              {/* molecules designed for this tumour: the socket matches the marker, and they bind */}
              {match(k) > 0.01 && (mode !== 'resolve' || t < RES_T(k) + 0.6) && markerPts(s).filter((_, i) => i % 3 === 0).map((m, i) => {
                const u = match(k);
                const dd = lerp(640, 70, u);
                return (
                  <g key={'g' + i} transform={`translate(${m.x + Math.cos(m.a) * dd} ${m.y + Math.sin(m.a) * dd}) rotate(${(m.a * 180) / Math.PI + 90}) scale(1.6)`} opacity={mode === 'resolve' ? 1 - lift(t, RES_T(k), RES_T(k) + 0.6) : 1}>
                    {u > 0.9 && <circle cy={-10} r={60} fill="url(#glowGold)" opacity={(u - 0.9) * 8} />}
                    <rect x={-20} y={-80} width={40} height={70} rx={12} fill={P.aiGold} />
                    <path d={specShape(s.mk, 30)} transform="translate(0 -6)" fill="none" stroke={P.aiGold} strokeWidth={8} />
                  </g>
                );
              })}
            </g>
          );
        })}
        {/* the loop on one tumour: the scan turns tissue into its model; the model is run forward */}
        {digit && (
          <g transform={`translate(${CS.x} ${CS.y})`}>
            <defs>
              <clipPath id="g4scan"><rect x={-CS.R * 1.4} y={-CS.R * 1.4} width={Math.max(0, scanX + CS.R * 1.4)} height={CS.R * 2.8} /></clipPath>
            </defs>
            <g clipPath="url(#g4scan)">
              <path d={closedPath(Array.from({length: 64}, (_, i) => { const a = (i / 64) * Math.PI * 2; const r = CS.R * dtBoundary(a, CS.seed); return [Math.cos(a) * r, Math.sin(a) * r] as Pt; }), 1)} fill={P.aiBg} stroke={P.ai} strokeWidth={6} />
              {CELLS[2].filter((_, i) => i % 2 === 0).map((c, i) => {
                const weak = Math.hypot(c.x - WEAK[0], c.y - WEAK[1]) < CS.R * 0.3;
                const col = weak ? mixHex(P.ai, P.aiGold, weakK) : rand(i * 7) < 0.3 ? '#36F0C8' : P.ai;
                return <rect key={i} x={c.x - 13} y={c.y - 13} width={26} height={26} rx={4} fill={col} fillOpacity={0.18 + 0.2 * rand(i) + (weak ? 0.35 * weakK : 0)} stroke={col} strokeWidth={2} strokeOpacity={0.8} />;
              })}
            </g>
            {t < tG.predicts + 0.2 && <g><rect x={scanX - 70} y={-CS.R * 1.3} width={70} height={CS.R * 2.6} fill="url(#glowAi)" opacity={0.5} /><rect x={scanX - 4} y={-CS.R * 1.3} width={8} height={CS.R * 2.6} fill={P.aiHot} /></g>}
            {pred > 0.01 && [1, -1].map((dir) => {
              const k = 1 + dir * (dir > 0 ? 0.38 : 0.45) * pred;
              const pts = Array.from({length: 64}, (_, i) => { const a = (i / 64) * Math.PI * 2; const r = CS.R * dtBoundary(a, CS.seed) * k; return [Math.cos(a) * r, Math.sin(a) * r] as Pt; });
              return <path key={dir} d={closedPath(pts, 1)} fill="none" stroke={dir > 0 ? '#FF6B9A' : P.aiHot} strokeWidth={7} strokeDasharray="26 22" opacity={0.85 * pred} />;
            })}
            {weakK > 0.01 && <circle cx={WEAK[0]} cy={WEAK[1]} r={CS.R * 0.36} fill="url(#glowGold)" opacity={0.5 * weakK} />}
          </g>
        )}
      </g>
      <Bokeh cam={cam} t={t} fill="url(#bokehDeep)" op={0.6} n={6} size={300} />
    </g>
  );
};
const SCALE_SPEC = 40;   // specimen units per body unit at the dive
const specFromBody = (t: number) => mapCam(bodyCam(t), LUNG_SITE, [SPEC[0].x, SPEC[0].y], SCALE_SPEC, 0);
const DIVE: [number, number] = [tG.weakness - 0.55, tG.weakness - 0.15];
const GROUP: Pt = [3000, -20];
const SPEC_CAM = path([
  {...specFromBody(DIVE[1]), t: DIVE[1]},
  {t: tG.every + 0.3, x: SPEC[0].x + 40, y: SPEC[0].y, z: 0.68, rot: 0},
  {t: tG.different + 0.15, x: GROUP[0], y: GROUP[1], z: 0.245, rot: 0},
  {t: tG.drugE + 0.05, x: GROUP[0], y: GROUP[1], z: 0.265, rot: 0},
  {t: tG.studies + 0.65, x: CS.x, y: CS.y, z: 0.82, rot: 0},
  {t: tG.predicts + 0.6, x: CS.x + 40, y: CS.y, z: 0.9, rot: 0},
  {t: tG.designs - 0.1, x: CS.x + WEAK[0] * 0.6, y: CS.y + WEAK[1] * 0.6, z: 1.15, rot: 0},
  {t: tG.designs + 0.45, x: CS.x + WEAK[0], y: CS.y + WEAK[1], z: 7, rot: 0},
]);
const specCam = (t: number) => (t < DIVE[1] ? specFromBody(t) : SPEC_CAM(t));

// ------------------------------------------------------------------------------------------------ the target protein (entered from the weak region)
const PRO: [number, number] = [tG.designs + 0.15, tG.activates + 0.3];
const CAM_PRO = path([
  {t: PRO[0], x: POCKET[0], y: POCKET[1], z: 1.6, rot: 0},
  {t: tG.designs + 0.7, x: POCKET[0] - 60, y: POCKET[1] + 40, z: 0.62, rot: 0},
  {t: tG.activates - 0.1, x: POCKET[0] - 20, y: POCKET[1], z: 0.7, rot: 0},
  {t: PRO[1], x: POCKET[0], y: POCKET[1], z: 2.2, rot: 0},
]);
const ProteinG: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const seat = lift(t, tG.designs + 0.35, tG.designs + 1.0);
  const close = lift(t, tG.designs + 0.9, tG.designs + 1.25);
  const mc = [MOL_FIT.atoms.reduce((s, q) => s + q[0], 0) / MOL_FIT.atoms.length, MOL_FIT.atoms.reduce((s, q) => s + q[1], 0) / MOL_FIT.atoms.length];
  const mx = lerp(POCKET[0] + 560, POCKET[0], seat) - mc[0] * 0.8, my = lerp(POCKET[1] - 520, POCKET[1], seat) - mc[1] * 0.8;
  return (
    <g>
      <AIBack cam={cam} t={t} op={0.4} />
      <g transform={camTransform(cam)}>
        <Protein t={t} digital={0.75} pocketGlow={0.5 * (1 - seat)} breathe={1 - 0.8 * close} layer="back" close={close} />
        <Molecule mol={MOL_FIT} x={mx} y={my} s={0.8} rot={lerp(-50, 0, seat) + 18 * (1 - seat) * noise(t * 2, 3)} digital={0.4} />
        <Protein t={t} digital={0.75} breathe={1 - 0.8 * close} layer="front" close={close} />
        {close > 0.5 && <circle cx={POCKET[0]} cy={POCKET[1]} r={300} fill="url(#glowGold)" opacity={0.35 * (close - 0.5) * 2 * (1 - lift(t, tG.activates - 0.3, tG.activates))} />}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ the immune side: switched on, multiplying, moving out
const IMM: [number, number] = [tG.activates - 0.05, tG.watches + 0.45];
const TC0: Pt = [0, 0];
const CAM_IMM = path([
  {t: IMM[0], x: 0, y: 0, z: 4.2, rot: 0},
  {t: tG.activates + 0.55, x: -40, y: 0, z: 1.25, rot: 0},
  {t: tG.watches - 0.1, x: 260, y: 0, z: 1.05, rot: 0},
  {t: IMM[1], x: 900, y: 40, z: 1.0, rot: 0},
]);
const ImmuneG: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const act = lift(t, tG.activates + 0.25, tG.activates + 0.6);
  const div = clamp01((t - (tG.activates + 0.65)) / 1.0);
  const run = lift(t, tG.watches - 0.4, IMM[1]);
  const TL: Look = {fill: P.tcell, light: mixHex(P.tcellLight, P.immuneGold, 0.5), deep: P.tcellDeep, nuc: '#1E5A50', nucDeep: '#0E3A34'};
  return (
    <g>
      <rect width={W} height={H} fill="#0E2436" />
      <g transform={camTransform(cam, 0.6)}>{Array.from({length: 18}, (_, k) => <path key={k} d={`M ${-2400 + k * 300} -1200 Q ${-2200 + k * 300} 0 ${-2400 + k * 300} 1200`} fill="none" stroke="#1E4A62" strokeWidth={12} opacity={0.5} />)}</g>
      <g transform={camTransform(cam)}>
        <Dendritic x={-250} y={20} r={120} t={t} present={1} />
        {div <= 0 ? (
          <TCell2 x={TC0[0] + 40 + 900 * run} y={TC0[1]} r={62} t={t} seed={4} dir={Math.PI} act={act} light={TL.light} flat={{a: Math.PI, d: 0.16 * (1 - run)}} />
        ) : div < 1 ? (
          <g transform={`translate(${900 * run} 0)`}><TCell2 x={TC0[0] + 40} y={0} r={62} t={t} seed={4} dir={0} act={act * (1 - div)} light={TL.light} op={1 - smooth(div * 3)} />
            <g opacity={smooth(div * 3)}><TCellDiv x={TC0[0] + 40} p={div} t={t} look={TL} /></g></g>
        ) : (
          [-1, 1].map((sg) => <TCell2 key={sg} x={TC0[0] + 40 + 900 * run + 60 * sg} y={sg * 52} r={56} t={t} seed={5 + sg} dir={0} act={0.4} light={TL.light} />)
        )}
        {act > 0.01 && div <= 0 && <circle cx={TC0[0] + 40} cy={0} r={78} fill="none" stroke={P.immuneGold} strokeWidth={6} opacity={act * 0.8} />}
        {/* more activated cells join from the node */}
        {[0, 1, 2].map((k) => {
          const u = lift(t, tG.watches - 0.6 + k * 0.15, IMM[1]);
          return u > 0.01 && <TCell2 key={'j' + k} x={-500 + 1400 * u + k * 60} y={-260 + k * 230} r={52} t={t} seed={30 + k} dir={0} act={0.35} light={TL.light} op={Math.min(1, u * 4)} />;
        })}
      </g>
    </g>
  );
};
const TCellDiv: React.FC<{x: number; p: number; t: number; look: Look}> = ({x, p, t, look}) => <DividingCell x={x} y={0} r={62} seed={44} t={t} p={p} axis={90} lod={62} look={look} sepF={0.72} dR={0.84} />;

// ------------------------------------------------------------------------------------------------ watching the blood for anything that survives
const WATCH: [number, number] = [tG.watches + 0.2, tG.answer + 0.15];
const CAM_W = (t: number): Cam => ({x: 500 * (t - WATCH[0]), y: 0, z: lerp(1.15, 0.9, lift(t, WATCH[0], WATCH[1])), rot: 0});
const WATCH_HIT = tG.survivesE - 0.35;
const WatchG: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const frs: React.ReactNode[] = [];
  const S = 260;
  const x0 = cam.x - W / cam.z, x1 = cam.x + W / cam.z;
  for (let i = Math.floor((x0 - t * 700) / S); i <= Math.ceil((x1 - t * 700) / S); i++) {
    const sd = ((i % 503) + 503) % 503 * 7 + 5;
    frs.push(<Frag key={i} x={i * S + rand(sd) * S + t * 700} y={(rand(sd + 1) * 2 - 1) * 420} s={0.85} rot={rand(sd + 2) * 180 + t * 25} t={t} />);
  }
  // the one tumour fragment, read and flagged as it passes the read line
  const hx = cam.x + lerp(700, -200, lift(t, WATCH[0], WATCH[1])), hy = 80;
  const flag = lift(t, WATCH_HIT, WATCH_HIT + 0.3);
  const lineX = cam.x + 150;
  return (
    <BloodTunnel cam={cam} t={t} flow={900} front={
      <g>
        <line x1={lineX} x2={lineX} y1={-520} y2={520} stroke={P.ai} strokeWidth={4} opacity={0.6} />
        <rect x={lineX - 40} y={-520} width={40} height={1040} fill="url(#glowAi)" opacity={0.25} />
        <circle cx={hx} cy={hy} r={120} fill="none" stroke={mixHex(P.ai, P.aiGold, flag)} strokeWidth={6} opacity={lift(t, WATCH_HIT - 0.3, WATCH_HIT)} />
      </g>
    }>
      {frs}
      {[0, 1].map((k) => <TCell2 key={'pt' + k} x={cam.x - 500 + ((t - WATCH[0]) * 160 + k * 700) % 1600} y={-250 + k * 420} r={60} t={t} seed={k + 12} dir={0} act={0.3} light={mixHex(P.tcellLight, P.immuneGold, 0.5)} />)}
      <Frag x={hx} y={hy} s={1.1} rot={t * 30} tumor t={t} glow={flag} />
    </BloodTunnel>
  );
};

// ------------------------------------------------------------------------------------------------ "a different answer for every cancer"
const RESV: [number, number] = [tG.answer - 0.2, tG.remember + 0.05];
const CAM_RES = path([
  {t: RESV[0], x: GROUP[0] - 200, y: GROUP[1], z: 0.36, rot: 0},
  {t: RESV[1], x: GROUP[0], y: GROUP[1], z: 0.27, rot: 0},
]);

// ================================================================================================ the single cell, found in time
const T_RE = tG.remember;
const E_OPEN = toTissue(OPEN(OPEN_END));
const killT = {arrive: tG.finding + 0.55, rec: tG.finding + 0.35, lock: tG.finding + 0.75, kill: tG.finding + 1.05};
const DIE: [number, number] = [killT.kill + 0.15, killT.kill + 1.75];
const MAC = {from: [C0.x - 520, C0.y + 380] as Pt, arrive: DIE[1] - 0.35, eat: DIE[1] + 0.05};
const RET0 = tG.tumorE + 0.15;
const TG = path([
  {...E_OPEN, t: T_RE},
  {t: tG.remember + 1.6, x: C0.x + 40, y: C0.y - 20, z: 2.2, rot: -8},
  {t: tG.finding + 0.2, x: C0.x + 70, y: C0.y - 30, z: 2.7, rot: -14},
  {t: killT.kill + 0.4, x: C0.x + 30, y: C0.y - 10, z: 3.1, rot: -18},
  {t: RET0, x: C0.x - 40, y: C0.y + 20, z: 2.7, rot: -18},
]);
const TCELL_FROM: Pt = [C0.x + 640, C0.y - 340];
const CONTACT_A = Math.atan2(-0.45, 1);
const tcEnd: Pt = [C0.x + Math.cos(CONTACT_A) * (R + 48), C0.y + Math.sin(CONTACT_A) * (R + 48)];
/** the T cell steers in on a curve (drawn toward the cell, correcting its heading) and decelerates into contact */
const tcPos = (t: number): Pt => {
  const k = lift(t, tG.finding - 0.45, killT.arrive);
  const via: Pt = [C0.x + 420, C0.y - 40];
  const a: Pt = [lerp(TCELL_FROM[0], via[0], k), lerp(TCELL_FROM[1], via[1], k)];
  const b: Pt = [lerp(via[0], tcEnd[0], k), lerp(via[1], tcEnd[1], k)];
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
};
const macPos = (t: number): Pt => {
  const k = lift(t, MAC.arrive - 1.0, MAC.arrive);
  const ang = Math.atan2(C0.y - MAC.from[1], C0.x - MAC.from[0]);
  const end: Pt = [C0.x - Math.cos(ang) * 118, C0.y - Math.sin(ang) * 118];
  const sw = lift(t, MAC.eat, MAC.eat + 0.9) * 0.6;
  return [lerp(MAC.from[0], end[0], k) + Math.cos(ang) * 80 * sw, lerp(MAC.from[1], end[1], k) + Math.sin(ang) * 80 * sw];
};
const RET = path([
  {...fromTissue(TG(RET0)), t: RET0},
  {t: RET0 + 0.85, x: SITE.tumor[0], y: SITE.tumor[1], z: 140, rot: -10},
  {t: RET0 + 1.7, x: 100, y: -380, z: 4, rot: -3},
  {t: DURATION2 - 0.7, x: 4, y: -52, z: 0.56, rot: 0},
]);
const tissueCamG = (t: number): Cam => (t < RET0 ? TG(t) : toTissue(RET(t)));
const TissueG: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const lod = R * cam.z;
  const die = clamp01((t - DIE[0]) / (DIE[1] - DIE[0]));
  const pulse = (0.75 + 0.25 * Math.sin(t * 3.2)) * 0.75 * (1 - lift(t, killT.kill, killT.kill + 0.8));
  const tp = tcPos(t);
  const ang = Math.atan2(C0.y - tp[1], C0.x - tp[0]);
  const press = 0.2 * lift(t, killT.arrive - 0.15, killT.lock);
  const rec = lift(t, killT.rec, killT.rec + 0.3) * (1 - lift(t, killT.kill + 0.5, killT.kill + 0.9));
  const leave = lift(t, killT.kill + 0.8, RET0);
  const tpx: Pt = [tp[0] + 140 * leave, tp[1] - 60 * leave];
  const mp = macPos(t);
  const cup = lift(t, MAC.arrive - 0.3, MAC.arrive + 0.2) * (1 - lift(t, MAC.eat + 0.6, MAC.eat + 1.0));
  const eaten = lift(t, MAC.eat, MAC.eat + 0.9);
  return (
    <g>
      <TissueBack cam={cam} t={t} />
      <g transform={camTransform(cam)}>
        <TissueField cam={cam} t={t} mod={(i, j) => (i === 0 && j === 0 ? {hide: true} : null)} />
        <g opacity={1 - eaten}>
          {die <= 0 ? <Cell2 x={C0.x} y={C0.y} seed={C0.seed} t={t} lod={lod} look={lookMix(HEALTHY, TUMOR, 0.2)} pulse={pulse} flat={press > 0.01 ? {a: ang + Math.PI, d: 0.06} : undefined} /> : <ApoptoticCell x={lerp(C0.x, mp[0], eaten * 0.5)} y={lerp(C0.y, mp[1], eaten * 0.5)} seed={C0.seed} t={t} die={die} lod={lod} look={lookMix(HEALTHY, TUMOR, 0.3)} />}
        </g>
        {rec > 0.01 && [-1, 0, 1].map((m) => {
          const cxp = tp[0] + Math.cos(ang) * 48 - Math.sin(ang) * m * 16, cyp = tp[1] + Math.sin(ang) * 48 + Math.cos(ang) * m * 16;
          return <g key={m} transform={`translate(${cxp} ${cyp}) rotate(${(ang * 180) / Math.PI})`} opacity={rec}><path d={fingerPath(m + 1)} transform="translate(8 0) rotate(-90) scale(0.12)" fill={P.neoantigen} /></g>;
        })}
        <Synapse a={tp} b={[C0.x, C0.y]} k={lift(t, killT.lock, killT.lock + 0.25) * (1 - lift(t, killT.kill + 0.6, killT.kill + 0.9))} rA={52} />
        <Granules a={tp} b={[C0.x, C0.y]} t={t} t0={killT.kill} />
        {t > MAC.arrive - 1.2 && <Phagocyte x={mp[0]} y={mp[1]} r={74} t={t} seed={7} to={Math.atan2(C0.y - mp[1], C0.x - mp[0])} cup={cup} eaten={eaten} op={lift(t, MAC.arrive - 1.2, MAC.arrive - 0.8)} dir={Math.atan2(C0.y - mp[1], C0.x - mp[0])} />}
        {t > tG.finding - 0.6 && <TCell2 x={tpx[0]} y={tpx[1]} r={52} t={t} dir={leave > 0.01 ? ang + Math.PI * leave : ang} lod={lod} act={0.5} light={mixHex(P.tcellLight, P.immuneGold, 0.5)} op={lift(t, tG.finding - 0.6, tG.finding - 0.2)} flat={press > 0.01 && leave < 0.05 ? {a: ang, d: press} : undefined} />}
      </g>
      <Motes cam={cam} t={t} />
      <Bokeh cam={cam} t={t} fill="url(#bokehWarm)" op={0.85 * lift(t, T_RE + 0.6, T_RE + 1.6)} n={8} size={280} />
    </g>
  );
};
/** the final image: the healthy person, the circulation softly lit, a warm key light behind the chest */
const EndG: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const vk = lift(t, RET0 + 1.2, RET0 + 2.4);
  return (
    <BodyWorld t={t} cam={cam} body={{glow: 0, chest: 1, lesion: 0, healthy: 1, vessels: 0.55 * vk}}
      back={<g opacity={vk}><ellipse cx={W / 2} cy={H * 0.4} rx={W * 0.32} ry={H * 0.5} fill="url(#glowWhite)" opacity={0.12} /><ellipse cx={W / 2} cy={H * 0.34} rx={W * 0.13} ry={H * 0.22} fill="url(#glowRed)" opacity={0.16} /></g>} />
  );
};

export const shotsG4: Shot[] = [
  {id: 'G-body', t0: PULL0 + 0.8, t1: DIVE[1] + 0.05, fade: 0.4, draw: (t) => <BodyG t={t} cam={bodyCam(t)} />},
  {id: 'G-spec', t0: DIVE[0], t1: PRO[0] + 0.35, fade: DIVE[1] - DIVE[0], draw: (t) => <Specimens t={t} cam={specCam(t)} mode={t < tG.studies - 0.3 ? 'intro' : 'loop'} />},
  {id: 'G-protein', t0: PRO[0], t1: IMM[0] + 0.35, fade: 0.3, draw: (t) => <ProteinG t={t} cam={CAM_PRO(t)} />},
  {id: 'G-immune', t0: IMM[0], t1: WATCH[0] + 0.45, fade: 0.3, draw: (t) => <ImmuneG t={t} cam={CAM_IMM(t)} />},
  {id: 'G-watch', t0: WATCH[0], t1: RESV[0] + 0.45, fade: 0.4, draw: (t) => <WatchG t={t} cam={CAM_W(t)} />},
  {id: 'G-resolve', t0: RESV[0], t1: T_RE, fade: 0.45, draw: (t) => <Specimens t={t} cam={CAM_RES(t)} mode="resolve" />},
  {id: 'G-tissue', t0: T_RE, t1: RET0 + 1.25, draw: (t) => <TissueG t={t} cam={tissueCamG(t)} />},
  {id: 'G-end', t0: RET0 + 0.8, t1: DURATION2 + 1, fade: 0.4, draw: (t) => <EndG t={t} cam={RET(t)} />},
];
export const _g4 = {TC0, Synapse};
