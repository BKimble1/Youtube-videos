// SEQUENCE F, V4 (166.2 – 199.3 s): from the first kills out to the whole tumour, then hunting for what survives.
//  Tumour scale: pulling out of the colony, the whole tumour is seen as a structure — a raised, lobed mass with fibrous
//    septa, a lit rim and the capillaries that feed it — while trained T cells stream in along those capillaries and
//    gather on its boundary, which erodes unevenly where they work (a greying band of dying cells).
//  The visible tumour shrinks to nothing as macrophages clear the remains and healthy cells refill the space. The
//    camera then searches the healed tissue and finds the few resistant survivors (same orange identity and square
//    markers as before); one of them divides, and divides again.
//  Shedding: survivors release fragments of their DNA (a short double helix with the tumour's changed base pair, shown
//    as one orange rung) into the capillary sprout beside them; the camera follows a fragment into the blood, where
//    such fragments are rare among the normal ones.
//  Reading them: a needle draws blood, the sample separates, and the plasma's DNA fragments are read one by one: each
//    fragment's letters are aligned under the reference sequence. At one position a few reads carry the changed base
//    (the tumour is back); later reads add a second change; that change alters the shape of the tumour's surface marker
//    (square → triangle), and a receptor is redesigned until it fits the new shape.
//  Precision attack: in the tissue, the resistant cell's markers change shape and the old T cell loses its grip; a T
//    cell carrying the redesigned receptor steers to it past a healthy cell, docks, and kills it by apoptosis.
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {P as Pt, lerp, smooth, seg, rand, mixHex, clamp01, noise, closedPath} from '../../kit/core';
import {Shot} from '../director';
import {T} from '../time';
import {path, handoff} from '../rig';
import {P} from '../palette';
import {cellAt, nearest, TissueField, TissueBack, Cell2, TCell2, ApoptoticCell, R, TUMOR, HEALTHY, lookMix, Motes, boundary} from '../art/tissue';
import {Capillary, along} from '../art/stroma';
import {BloodTunnel} from '../art/blood';
import {AIBack} from '../art/ai';
import {Protein, POCKET, Molecule, MOL_FIT, Mol, RESIDUES} from '../art/protein';
import {Granules, Synapse} from '../art/immune';
import {Bokeh, Phagocyte, buildLineage, liveCells, LineageCell} from '../art/depth';
import {C0P, tumorMod, TumorMassShade, toTissue, fromTissue, cloneLook} from './A';
import {SITE} from '../art/body';
import {CAPS, SPROUTS} from './B';
import {RtLocal, RT_E0, erodeK} from './E';
import {RESIST, morphPath, MARK_COL} from './F';
import {KILL_OUT} from './D4';

export const tF = {
  sudden: T('Suddenly, the tumor'), fighting: T("It's fighting the body's own defenses."), but: T('But destroying the visible tumor'), half: T('only half the battle.'),
  because: T('Because even a tiny population'), surviving: T('surviving cancer'), back: T('bring the disease back.'), interesting: T('And this is where things get really'),
  cancer: T('Cancer can leave microscopic traces'), dna: T('of its DNA'), blood: T('in the bloodstream.'), analyzing: T('By analyzing these signals,'), aiC: T('AI could help detect'),
  returning: T('signs of a returning tumor,'), tumorE: T('tumor, identify'), changing: T("identify how it's changing,"), guide: T('and guide a new treatment'), before: T('before it grows'),
  control: T('out of control.'), evolving: T('An evolving enemy,'), met: T('met by an evolving defense.'), defense: T('evolving defense.'), breakthrough: T("And that's the breakthrough"),
};
const lift = (t: number, a: number, b: number) => smooth(seg(t, a, b));
const C0 = {x: C0P[0], y: C0P[1]};

// ================================================================================================ the tumour as a structure
const RtF = (a: number, t: number) => (t < tF.but + 0.5 ? RtLocal(a, t) : lerp(RtLocal(a, tF.but + 0.5), 0, lift(t, tF.but + 0.5, tF.because - 0.3)));
const outline = (t: number, k = 1) => closedPath(Array.from({length: 96}, (_, i) => {
  const a = (i / 96) * Math.PI * 2;
  const r = RtF(a, t) * boundary(a) * k;
  return [C0.x + Math.cos(a) * r, C0.y + Math.sin(a) * r] as Pt;
}), 1);
/** the lobes' borders: where the outline turns inward, a fibrous septum runs into the mass */
const SEPTA = (() => {
  const out: number[] = [];
  for (let i = 0; i < 360; i++) {
    const a = (i / 360) * Math.PI * 2, d = 0.01;
    if (boundary(a) < boundary(a - d) && boundary(a) < boundary(a + d)) out.push(a);
  }
  return out;
})();
const TumourStructure: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const Rm = RtF(0, t);
  if (Rm < 250) return null;
  const k = smooth((Rm - 250) / 500);
  const w = Math.max(14, 3 / cam.z);
  return (
    <g opacity={k} pointerEvents="none">
      {/* cast shadow on the lower right, rim light on the upper left: the mass stands out of the sheet */}
      <path d={outline(t, 1.0)} fill="none" stroke="#2A0818" strokeWidth={w * 9} opacity={0.22} transform="translate(60 70)" />
      <path d={outline(t, 0.985)} fill="url(#volSoft)" opacity={0.9} />
      {SEPTA.map((a, i) => {
        const r0 = RtF(a, t) * boundary(a);
        const p0: Pt = [C0.x + Math.cos(a) * r0, C0.y + Math.sin(a) * r0];
        const p1: Pt = [C0.x + Math.cos(a + 0.25) * r0 * 0.45, C0.y + Math.sin(a + 0.25) * r0 * 0.45];
        const c: Pt = [C0.x + Math.cos(a + 0.05) * r0 * 0.75, C0.y + Math.sin(a + 0.05) * r0 * 0.75];
        return (
          <g key={i}>
            <path d={`M ${p0[0]} ${p0[1]} Q ${c[0]} ${c[1]} ${p1[0]} ${p1[1]}`} fill="none" stroke="#3A0A2E" strokeWidth={w * 4} strokeLinecap="round" opacity={0.35} />
            <path d={`M ${p0[0]} ${p0[1]} Q ${c[0]} ${c[1]} ${p1[0]} ${p1[1]}`} fill="none" stroke="#E8B8C8" strokeWidth={w * 1.2} strokeLinecap="round" opacity={0.25} />
          </g>
        );
      })}
      <path d={outline(t, 1.0)} fill="none" stroke={P.tissueLight} strokeWidth={w * 2.2} opacity={0.35} transform="translate(-30 -34)" />
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ the swarm
const SWARM = Array.from({length: 54}, (_, k) => ({deg: (k / 54) * 360 + rand(k) * 6, seed: k + 50, t0: tF.sudden - 0.2 + rand(k * 3) * 2.2}));
const STREAM = CAPS.flatMap((cap, ci) => Array.from({length: 14}, (_, k) => ({cap, ci, k, ph: k / 14 + rand(ci * 31 + k) * 0.05})));
const MACS = Array.from({length: 10}, (_, k) => ({deg: (k / 10) * 360 + 17, seed: k + 90}));

// ------------------------------------------------------------------------------------------------ survivors
const SPR = SPROUTS[0];
const TIP = SPR[SPR.length - 1];
const SURV = [[-60, 120], [140, 40], [40, -90], [-1500, 900], [1300, 700], [-700, -1300], [900, -600]].map(([dx, dy], k) => {
  const base = k < 3 ? [TIP[0] + dx - 30, TIP[1] + dy + 260] : [C0.x + dx, C0.y + dy];
  const n = nearest(base[0], base[1]);
  return {...n, ...cellAt(n.i, n.j), k};
});
const survSet = new Set(SURV.map((s) => `${s.i},${s.j}`));
/** the survivor that grows back: two rounds of division */
const REGROW = buildLineage({x: SURV[0].x, y: SURV[0].y, r: R, seed: SURV[0].seed, axis: 30}, [tF.surviving + 0.2, tF.back + 0.2], -99, 1.05, 'g');
const regrowSet = (() => { const s = new Set<string>(); for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) { const n = nearest(SURV[0].x + di * 60, SURV[0].y + dj * 60); s.add(`${n.i},${n.j}`); } return s; })();
const Markers2: React.FC<{x: number; y: number; seed: number; kind?: number; k?: number; lod: number}> = ({x, y, seed, kind = 1, k = 1, lod}) => (lod < 9 ? null : (
  <g opacity={k}>
    {Array.from({length: 7}, (_, m) => {
      const a = (m / 7) * Math.PI * 2 + seed;
      return <path key={m} d={morphPath(kind, kind, 0, 6)} transform={`translate(${x + Math.cos(a) * R * 0.98} ${y + Math.sin(a) * R * 0.98}) rotate(${(a * 180) / Math.PI})`} fill={MARK_COL[kind]} />;
    })}
  </g>
));

// ------------------------------------------------------------------------------------------------ DNA fragments
/** a short double helix: rungs between two backbones; a tumour fragment carries one changed base pair (orange rung) */
export const Frag: React.FC<{x: number; y: number; s?: number; rot?: number; tumor?: boolean; t: number; glow?: number; alt?: number}> = ({x, y, s = 1, rot = 0, tumor = false, t, glow = 0, alt = 0}) => {
  const L = 70;
  const s1: string[] = [], s2: string[] = [];
  for (let k = 0; k <= 14; k++) {
    const u = k / 14, xx = -L + u * 2 * L;
    s1.push(`${xx.toFixed(1)} ${(14 * Math.sin(u * 9 + t * 2)).toFixed(1)}`);
    s2.push(`${xx.toFixed(1)} ${(14 * Math.sin(u * 9 + t * 2 + 2.4)).toFixed(1)}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {glow > 0.01 && <circle r={110} fill="url(#glowGold)" opacity={glow * 0.6} />}
      {Array.from({length: 7}, (_, k) => {
        const mut = tumor && k === 3;
        return <line key={k} x1={-L + 10 + k * 20} x2={-L + 10 + k * 20} y1={-12} y2={12} stroke={mut ? mixHex(P.payload, '#B58CFF', alt) : '#CFC4CC'} strokeWidth={mut ? 9 : 4} strokeLinecap="round" />;
      })}
      <path d={`M ${s1.join(' L ')}`} fill="none" stroke="#A89AA6" strokeWidth={8} strokeLinecap="round" />
      <path d={`M ${s2.join(' L ')}`} fill="none" stroke="#D8CED6" strokeWidth={8} strokeLinecap="round" />
    </g>
  );
};
const FRAGS = Array.from({length: 9}, (_, k) => ({src: SURV[k % 3], t0: tF.interesting + 0.15 + k * 0.2, seed: k}));
const fragPos = (f: (typeof FRAGS)[0], t: number): Pt => {
  const u = clamp01((t - f.t0) / 2.0);
  const a = -Math.PI / 2 + (rand(f.seed) - 0.5) * 1.2;
  const p0: Pt = [f.src.x + Math.cos(a) * R, f.src.y + Math.sin(a) * R];
  const tgt = along(SPR, 0.92 - 0.06 * rand(f.seed * 3)).p;
  return [lerp(p0[0], tgt[0], smooth(u)) + 30 * noise(t + f.seed, 3) * (1 - u), lerp(p0[1], tgt[1], smooth(u)) + 30 * noise(t + f.seed, 5) * (1 - u)];
};

// ------------------------------------------------------------------------------------------------ tissue camera (tumour scale → clearance → search → into the capillary)
const CAM_T = path([
  {t: KILL_OUT, x: C0.x + 450, y: C0.y - 2850, z: 0.55, rot: 0},
  {t: tF.sudden + 2.6, x: C0.x + 200, y: C0.y - 300, z: 0.17, rot: -1},
  {t: tF.but, x: C0.x - 60, y: C0.y - 80, z: 0.185, rot: -2},
  {t: tF.because - 0.1, x: C0.x + 80, y: C0.y - 300, z: 0.24, rot: -1},
  {t: tF.surviving - 0.2, x: TIP[0] - 60, y: TIP[1] + 300, z: 0.85, rot: 0},
  {t: tF.back + 0.4, x: TIP[0] - 30, y: TIP[1] + 230, z: 1.5, rot: 0.5},
  {t: tF.cancer - 0.4, x: TIP[0], y: TIP[1] + 80, z: 1.75, rot: 1},
  {t: tF.cancer + 0.35, x: TIP[0], y: TIP[1] - 30, z: 4.6, rot: 1},
]);
const TissueF: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const lod = R * cam.z;
  const phase1 = t < tF.but + 0.5;
  const heal = lift(t, tF.but + 0.6, tF.because);
  const regrowCells = t > tF.surviving - 0.5 ? liveCells(REGROW, t) : [];
  const mod = phase1
    ? tumorMod(t, RT_E0, 0.6, (i, j, x, y) => {
      const dx = x - C0.x, dy = y - C0.y;
      const ang = Math.atan2(dy, dx);
      const d = Math.hypot(dx, dy) / boundary(ang);
      const Rl = RtLocal(ang, t);
      if (d < RT_E0 && d > Rl - 120) {
        const k = clamp01((d - Rl + 120) / 240);
        return {look: lookMix(TUMOR, {...TUMOR, fill: '#8A6A86'}, k), bleb: k, shrink: k * 0.6, op: 1 - 0.65 * k, s: 1 - 0.2 * k};
      }
      return null;
    })
    : (i: number, j: number, x: number, y: number) => {
      if (survSet.has(`${i},${j}`) || (regrowCells.length && regrowSet.has(`${i},${j}`) && regrowCells.some((c) => Math.hypot(x - c.x, y - c.y) < R * 1.25))) return {hide: true};
      const dx = x - C0.x, dy = y - C0.y;
      const ang = Math.atan2(dy, dx);
      const d = Math.hypot(dx, dy) / boundary(ang);
      const Rt = RtF(ang, t);
      if (d < Rt - 120) return {look: cloneLook(i, j, 0.6), nucScale: 1.25, irr: 0.06, s: 0.92 + 0.22 * rand(((i * 911) ^ (j * 3571)) & 0xffff), round: 0.4};
      if (d < RT_E0) {
        // starts exactly where the eroding band left off (same look, same translucency), then heals
        const k = clamp01((d - Rt + 120) / 240);
        return {look: lookMix(lookMix(TUMOR, {...TUMOR, fill: '#8A6A86'}, k), HEALTHY, heal), bleb: k * (1 - heal), shrink: 0.6 * k * (1 - heal), op: lerp(1 - 0.65 * k, 1, heal), s: 1 - 0.2 * k * (1 - heal)};
      }
      return null;
    };
  const swarmOn = lift(t, tF.sudden - 0.2, tF.sudden + 0.8) * (1 - lift(t, tF.because - 0.6, tF.because + 0.4));
  const far = 1 - smooth((lod - 6) / 10);   // halos only when the cells are tiny
  const tcLight = mixHex(P.tcellLight, P.immuneGold, 0.5);
  const shedK = lift(t, tF.interesting, tF.interesting + 0.6);
  return (
    <g>
      <TissueBack cam={cam} t={t} farSkip />
      <g transform={camTransform(cam)}>
        <TissueField farSkip cam={cam} t={t} mod={mod} />
        <TumorMassShade Rt={RT_E0} op={0.6 * (1 - lift(cam.z, 0.35, 0.7)) * (1 - lift(t, tF.but + 0.4, tF.but + 1.3))} />
        <TumourStructure t={t} cam={cam} />
        {CAPS.map((c, k) => <Capillary key={k} pts={c} t={t} w={95} lod={cam.z} />)}
        {SPROUTS.map((c, k) => <Capillary key={'s' + k} pts={c} t={t} w={78} lod={cam.z} />)}
        {/* trained T cells carried in by the capillaries */}
        {swarmOn > 0.01 && STREAM.map((s) => {
          const u = ((t * 0.035 + s.ph) % 1 + 1) % 1;
          const q = along(s.cap, u).p;
          if (Math.hypot(q[0] - C0.x, q[1] - C0.y) > 6500) return null;
          return (
            <g key={`st${s.ci}-${s.k}`} opacity={swarmOn}>
              {far > 0.01 && <circle cx={q[0]} cy={q[1]} r={170} fill="url(#glowTeal)" opacity={0.5 * far} />}
              <TCell2 x={q[0]} y={q[1]} r={46} t={t} seed={s.k} dir={0} lod={lod} light={tcLight} act={0.3} />
            </g>
          );
        })}
        {/* …and gathered on the boundary, where it erodes */}
        {swarmOn > 0.01 && SWARM.map((s, k) => {
          const a = (s.deg * Math.PI) / 180;
          const r = RtF(a, t) * boundary(a) + 70 + 30 * Math.sin(t * 2 + k);
          const o = lift(t, s.t0, s.t0 + 0.5) * swarmOn;
          const x = C0.x + Math.cos(a) * r, y = C0.y + Math.sin(a) * r;
          return (
            <g key={'sw' + k} opacity={o}>
              {far > 0.01 && <circle cx={x} cy={y} r={190} fill="url(#glowTeal)" opacity={0.55 * far} />}
              <TCell2 x={x} y={y} r={52} t={t} seed={s.seed} dir={a + Math.PI} lod={lod} act={0.5 + 0.3 * Math.sin(t * 3 + k)} light={tcLight} />
            </g>
          );
        })}
        {/* macrophages clearing the remains as the mass shrinks */}
        {t > tF.but - 0.3 && t < tF.because + 1 && MACS.map((m, k) => {
          const a = (m.deg * Math.PI) / 180;
          const r = (RtF(a, t) * boundary(a) + 260) * (0.9 + 0.1 * Math.sin(t + k));
          const x = C0.x + Math.cos(a) * r, y = C0.y + Math.sin(a) * r;
          const o = lift(t, tF.but - 0.3, tF.but + 0.4) * (1 - lift(t, tF.because, tF.because + 0.8));
          return (
            <g key={'mc' + k} opacity={o}>
              {far > 0.01 && <circle cx={x} cy={y} r={200} fill="url(#glowAi)" opacity={0.35 * far} />}
              <Phagocyte x={x} y={y} r={95} t={t} seed={m.seed} to={a + Math.PI} cup={0.5 + 0.5 * Math.sin(t * 2 + k)} eaten={0.6} dir={a + Math.PI} />
            </g>
          );
        })}
        {/* the survivors: the same resistant identity, found again */}
        {!phase1 && SURV.map((s) => {
          if (s.k === 0 && regrowCells.length) return null;
          const found = lift(t, tF.because + 0.6 + 0.15 * s.k, tF.because + 1.4 + 0.15 * s.k);
          return (
            <g key={'sv' + s.k}>
              <circle cx={s.x} cy={s.y} r={240} fill="url(#glowGold)" opacity={found * Math.max(0.6 * far, 0.45 * (1 - smooth((lod - 30) / 40)))} />
              <Cell2 x={s.x} y={s.y} seed={s.seed} t={t} lod={lod} look={RESIST} nucScale={1.2} irr={0.06} pulse={0.25 * found} />
              <Markers2 x={s.x} y={s.y} seed={s.seed} lod={lod} />
            </g>
          );
        })}
        {regrowCells.map((c) => (
          <g key={c.node.id}>
            <LineageCell c={c} t={t} lod={lod} look={RESIST} pulse={0.2} />
            {c.dividing === 0 && <Markers2 x={c.x} y={c.y} seed={c.node.seed} lod={lod} />}
          </g>
        ))}
        {/* shedding: fragments of their DNA drift into the sprout */}
        {shedK > 0.01 && FRAGS.map((f, k) => t > f.t0 && <Frag key={'fr' + k} x={fragPos(f, t)[0]} y={fragPos(f, t)[1]} s={0.3} rot={k * 40 + t * 30} tumor t={t} glow={0.5} />)}
      </g>
      <Motes cam={cam} t={t} />
      <Bokeh cam={cam} t={t} fill="url(#bokehWarm)" op={smooth((cam.z - 0.4) / 0.6) * 0.8} n={7} size={260} />
    </g>
  );
};

// ================================================================================================ in the blood: rare tumour fragments among normal ones
const CAM_B = (t: number): Cam => ({x: 600 * (t - tF.cancer), y: 0, z: lerp(1.25, 0.66, lift(t, tF.cancer, tF.blood)), rot: 0});
const ROT_B = (t: number) => lerp(90, 0, lift(t, tF.cancer - 0.1, tF.cancer + 1.4));
/** the fragment the camera keeps in view (it is drawn last, by the needle) */
const HERO = (t: number): Pt => [600 * (t - tF.cancer) + 160 + 40 * noise(t, 4), 120 + 30 * noise(t, 9)];
const NEEDLE: [number, number] = [tF.analyzing - 0.45, tF.analyzing + 0.5];
const BloodF: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const frs: React.ReactNode[] = [];
  const S = 230;
  const x0 = cam.x - W / cam.z, x1 = cam.x + W / cam.z;
  for (let i = Math.floor((x0 - t * 900) / S); i <= Math.ceil((x1 - t * 900) / S); i++) {
    const sd = ((i % 503) + 503) % 503 * 7 + 3;
    const x = i * S + rand(sd) * S + t * 900, y = (rand(sd + 1) * 2 - 1) * 440;
    const tumor = sd % 11 === 3;
    frs.push(<Frag key={i} x={x} y={y} s={0.9} rot={rand(sd + 2) * 180 + t * 25} tumor={tumor} t={t} glow={tumor ? 0.6 * lift(t, tF.dna, tF.blood) : 0} />);
  }
  const h = HERO(t);
  const nd = lift(t, NEEDLE[0], NEEDLE[0] + 0.45);
  const draw = lift(t, NEEDLE[0] + 0.4, NEEDLE[1]);
  const r = ROT_B(t), a = (r * Math.PI) / 180;
  const sc = Math.abs(Math.cos(a)) + Math.abs(Math.sin(a)) * (W / H);
  const needleTip: Pt = [h[0] + 30, lerp(-900, -60, nd)];
  return (
    <g transform={`rotate(${r} ${W / 2} ${H / 2}) translate(${W / 2} ${H / 2}) scale(${sc}) translate(${-W / 2} ${-H / 2})`}>
      <BloodTunnel cam={cam} t={t} flow={1100} front={nd > 0.01 && (
        <g>
          {/* the needle's bevel pierces the vessel wall; the flow carries the fragment into it */}
          <path d={`M ${needleTip[0] - 60} ${needleTip[1] - 2000} L ${needleTip[0] - 60} ${needleTip[1] - 80} L ${needleTip[0] + 60} ${needleTip[1]} L ${needleTip[0] + 60} ${needleTip[1] - 2000} Z`} fill="#B8C4CE" stroke="#E8F0F6" strokeWidth={6} />
          <path d={`M ${needleTip[0] - 30} ${needleTip[1] - 2000} L ${needleTip[0] - 30} ${needleTip[1] - 70} L ${needleTip[0] + 30} ${needleTip[1] - 30} L ${needleTip[0] + 30} ${needleTip[1] - 2000} Z`} fill="#5A1420" />
          <rect x={needleTip[0] - 52} y={needleTip[1] - 2000} width={14} height={1900} fill="#FFFFFF" opacity={0.35} />
        </g>
      )}>
        {frs}
        <Frag x={lerp(h[0], needleTip[0], draw)} y={lerp(h[1], needleTip[1] - 200 * draw, draw)} s={1.1} rot={t * 30} tumor t={t} glow={0.9} />
      </BloodTunnel>
    </g>
  );
};

// ================================================================================================ the sample and the read (V5)
// One continuous move: the camera pushes into the separated plasma, where DNA fragments drift; it locks on to one
// tumour fragment, which turns level and unzips into its bases. A: that short read is laid against the reference and
// the changed base lights up; two more fragments carry the same change. B: a later fragment carries a second change;
// everything else steps back and that base is isolated. C: the base becomes the amino acid it alters, which lands on
// the target protein as it turns into view and swells into the pocket. D: the earlier drug runs into the swelling and
// backs off; a molecule redesigned around it seats in the pocket and the pocket closes.
const TUBE: [number, number] = [tF.analyzing + 0.35, tF.aiC - 0.15];
const Tube: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const fillK = lift(t, TUBE[0], TUBE[0] + 0.55);
  const sep = lift(t, TUBE[0] + 0.55, TUBE[1] - 0.1);
  const tubeW = 260, tubeH = 1100;
  const bottom = tubeH / 2;
  const level = lerp(bottom, -tubeH / 2 + 160, fillK);
  const split = lerp(level, 60, sep);
  return (
    <g>
      <rect width={W} height={H} fill="#141A26" />
      <rect width={W} height={H} fill="url(#glowWhite)" opacity={0.05} />
      <g transform={camTransform(cam)}>
        <defs>
          <clipPath id="tubeClip4"><path d={`M ${-tubeW / 2} ${-tubeH / 2} L ${tubeW / 2} ${-tubeH / 2} L ${tubeW / 2} ${tubeH / 2 - tubeW / 2} A ${tubeW / 2} ${tubeW / 2} 0 0 1 ${-tubeW / 2} ${tubeH / 2 - tubeW / 2} Z`} /></clipPath>
        </defs>
        <ellipse cx={0} cy={tubeH / 2 + 40} rx={300} ry={40} fill="#000" opacity={0.35} />
        <g clipPath="url(#tubeClip4)">
          <rect x={-tubeW} y={-tubeH} width={tubeW * 2} height={tubeH * 2} fill="#2A3240" />
          <rect x={-tubeW} y={level} width={tubeW * 2} height={tubeH} fill={P.blood} />
          <rect x={-tubeW} y={level} width={tubeW * 2} height={Math.max(0, split - level)} fill={P.plasma} opacity={sep} />
          <rect x={-tubeW} y={split - 6} width={tubeW * 2} height={14} fill="#F4F0E8" opacity={sep} />
          {sep > 0.4 && TUBE_FR.map((f, k) => <g key={'f' + k} opacity={(sep - 0.4) / 0.6}><Frag x={f[0]} y={f[1]} s={0.32} rot={rand(k) * 180 + t * 20} tumor={k === HERO_K} t={t} glow={k === HERO_K ? 0.6 : 0} /></g>)}
        </g>
        <path d={`M ${-tubeW / 2} ${-tubeH / 2} L ${-tubeW / 2} ${tubeH / 2 - tubeW / 2} A ${tubeW / 2} ${tubeW / 2} 0 0 0 ${tubeW / 2} ${tubeH / 2 - tubeW / 2} L ${tubeW / 2} ${-tubeH / 2}`} fill="none" stroke="#DDE8F4" strokeWidth={10} opacity={0.7} />
        <rect x={-tubeW / 2 + 20} y={-tubeH / 2 + 40} width={26} height={tubeH - 260} rx={13} fill="#FFFFFF" opacity={0.25} />
        <rect x={-tubeW / 2 - 24} y={-tubeH / 2 - 150} width={tubeW + 48} height={170} rx={24} fill="#5A6A82" />
        <rect x={-tubeW / 2 - 24} y={-tubeH / 2 - 150} width={tubeW + 48} height={170} rx={24} fill="url(#vol)" />
      </g>
    </g>
  );
};
// fragments in the settled plasma (tube units); the tumour one is followed
const TUBE_FR: Pt[] = Array.from({length: 12}, (_, k) => [(rand(k * 7) - 0.5) * 260 * 0.7, lerp(-350, 20, rand(k * 9))]);
const HERO_K = 4;
const HT = TUBE_FR[HERO_K];
const heroRot = (t: number) => rand(HERO_K) * 180 + t * 20;
const DIVE: [number, number] = [tF.aiC + 0.1, tF.aiC + 0.4]; // the tube dissolves into the plasma world
const CAM_TU = path([
  {t: TUBE[0] - 0.3, x: 0, y: 160, z: 0.62, rot: -6},
  {t: TUBE[1] - 0.45, x: 0, y: -60, z: 0.85, rot: 0},
  {t: DIVE[0], x: HT[0], y: HT[1], z: 7.5, rot: 0},
  {t: DIVE[1] + 0.05, x: HT[0], y: HT[1], z: 14, rot: 0},
]);
const FR_S = 1 / 0.32; // plasma-world units per tube unit at the hero fragment

// ------------------------------------------------------------------------------------------------ the read world (plasma units; the hero fragment at the origin, s = 1)
const REF7 = 'TCACTGG';
const VA = 3, VB = 5; // the first change (C→T, found in every tumour read) and the later one (G→A)
const COL = 20, ROW = 24;
const colX = (c: number) => -60 + c * COL;
const tR = {
  level: tF.aiC + 0.45, unzip: tF.aiC + 0.75, ref: T('signs of a returning') - 0.05, mark: T('returning tumor,'), more: T('returning tumor,') + 0.25,
  late: tF.changing, markB: tF.changing + 0.45, iso: T("it's changing,") - 0.05, bead: tF.guide - 0.05, land: tF.guide + 0.75, swell: tF.guide + 1.0,
  old: tF.before - 0.25, fresh: tF.before + 0.5, close: tF.before + 1.55,
};
const PROT_C: Pt = [0, 30];
const PS = 0.11; // world units per protein unit
const OUT_P: Pt = (() => { const l = Math.hypot(POCKET[0], POCKET[1]); return [POCKET[0] / l, POCKET[1] / l]; })();
const PERP_P: Pt = [-OUT_P[1], OUT_P[0]];
const alongP = (d: number, side = 0): Pt => [POCKET[0] + OUT_P[0] * d + PERP_P[0] * side, POCKET[1] + OUT_P[1] * d + PERP_P[1] * side];
const molC = (m: Mol): Pt => [m.atoms.reduce((s, a) => s + a[0], 0) / m.atoms.length, m.atoms.reduce((s, a) => s + a[1], 0) / m.atoms.length];
const MS5 = 0.8;
// the residue the change alters: the pocket-lining residue nearest to where the earlier drug's sulfur branch sits
const VAR_K = (() => {
  const c = molC(MOL_FIT), a = MOL_FIT.atoms[7];
  const p: Pt = [POCKET[0] + (a[0] - c[0]) * MS5, POCKET[1] + (a[1] - c[1]) * MS5];
  return RESIDUES.filter((r) => r.lining).reduce((b, r) => (Math.hypot(r.x - p[0], r.y - p[1]) < Math.hypot(b.x - p[0], b.y - p[1]) ? r : b)).k;
})();
const VAR_RES = RESIDUES.find((r) => r.k === VAR_K)!;
const VAR_DIR: Pt = (() => { const dx = VAR_RES.x - POCKET[0], dy = VAR_RES.y - POCKET[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; })();
// redesigned around the swelling: the branch that hit it is gone, a new one points into the free side of the pocket
const MOL_NEW: Mol = {
  atoms: [[0, 0, 0], [90, -40, 0], [170, 10, 1], [150, 100, 0], [60, 120, 0], [-10, 80, 2], [-90, -40, 0], [-170, 0, 1], [-110, 150, 2], [-20, 200, 0]],
  bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [6, 7], [5, 8], [4, 9]],
};
const rotYAt = (t: number) => lerp(-1.05, 0, lift(t, tR.bead - 0.1, tR.swell + 0.3));
const varWorld = (t: number): Pt => {
  const ry = rotYAt(t);
  return [PROT_C[0] + (VAR_RES.x * Math.cos(ry) + VAR_RES.z * 320 * Math.sin(ry)) * PS, PROT_C[1] + VAR_RES.y * PS];
};
const ISO_AT: Pt = [0, 12];
const pocketW: Pt = [PROT_C[0] + POCKET[0] * PS, PROT_C[1] + POCKET[1] * PS];
const RD = path([
  {...handoff(CAM_TU(DIVE[1]), HT, [0, 0], FR_S), t: DIVE[1]},
  {t: tR.unzip + 0.1, x: 0, y: 2, z: 7.2, rot: 0},
  {t: tR.mark, x: 0, y: 10, z: 6.6, rot: 0},
  {t: tR.late + 0.1, x: 4, y: 22, z: 6.0, rot: 0},
  {t: tR.iso + 0.3, x: 2, y: 22, z: 6.1, rot: 0},
  {t: tR.bead + 0.2, x: ISO_AT[0], y: ISO_AT[1], z: 6.6, rot: 0},
  {t: tR.land, x: 8, y: 14, z: 5.4, rot: 0},
  {t: tR.old + 0.1, x: pocketW[0] - 6, y: pocketW[1] + 4, z: 7.4, rot: 0},
  {t: tR.close, x: pocketW[0], y: pocketW[1], z: 9.0, rot: 0},
  {t: tF.evolving, x: pocketW[0], y: pocketW[1], z: 9.6, rot: 0},
]);
const CAM_RD = (t: number): Cam => (t < DIVE[1] ? handoff(CAM_TU(t), HT, [0, 0], FR_S) : RD(t));

const Letter: React.FC<{x: number; y: number; ch: string; col: string; op?: number; s?: number; bold?: boolean}> = ({x, y, ch, col, op = 1, s = 1, bold}) => (
  <text x={x} y={y + 4.6 * s} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={bold ? 800 : 600} fontSize={13 * s} fill={col} opacity={op}>{ch}</text>
);
/** the followed fragment: a short double helix that levels off and unzips; its bases become the read's letters */
const HeroDNA: React.FC<{t: number; rot: number; unzip: number; letters: number; seq: string; glow: number}> = ({t, rot, unzip, letters, seq, glow}) => {
  const amp = 14 * (1 - unzip), off = 12 * unzip;
  const s1: string[] = [], s2: string[] = [];
  for (let k = 0; k <= 28; k++) {
    const u = k / 28, xx = -70 + u * 140;
    s1.push(`${xx.toFixed(1)} ${(-off + amp * Math.sin(u * 9 + t * 2)).toFixed(1)}`);
    s2.push(`${xx.toFixed(1)} ${(off + amp * Math.sin(u * 9 + t * 2 + 2.4)).toFixed(1)}`);
  }
  return (
    <g transform={`rotate(${rot})`}>
      {glow > 0.01 && <circle r={110} fill="url(#glowGold)" opacity={glow * 0.6} />}
      {Array.from({length: 7}, (_, k) => {
        const mut = k === VA;
        return <line key={k} x1={colX(k)} x2={colX(k)} y1={-12 + 4 * unzip} y2={12 - 4 * unzip} stroke={mut ? P.payload : '#CFC4CC'} strokeWidth={mut ? 9 : 4} strokeLinecap="round" opacity={1 - letters} />;
      })}
      <path d={`M ${s1.join(' L ')}`} fill="none" stroke="#A89AA6" strokeWidth={8 - 6 * unzip} strokeLinecap="round" opacity={1 - 0.75 * letters} />
      <path d={`M ${s2.join(' L ')}`} fill="none" stroke="#D8CED6" strokeWidth={8 - 6 * unzip} strokeLinecap="round" opacity={1 - 0.9 * letters} />
      {letters > 0.01 && seq.split('').map((ch, k) => <Letter key={k} x={colX(k)} y={0} ch={ch} col={k === VA ? P.payload : P.aiHot} op={clamp01(letters * 2 - k * 0.12)} bold={k === VA} />)}
    </g>
  );
};
const PlasmaBack: React.FC<{t: number; cam: Cam; dark: number}> = ({t, cam, dark}) => {
  if (dark > 0.99) return null;
  // other fragments and plasma proteins around the followed one, thinning out as the analysis takes over
  const out: React.ReactNode[] = [];
  const S = 150;
  const hw = W / 2 / cam.z + S, hh = H / 2 / cam.z + S;
  for (let j = Math.floor((cam.y - hh) / S); j <= Math.ceil((cam.y + hh) / S); j++)
    for (let i = Math.floor((cam.x - hw) / S); i <= Math.ceil((cam.x + hw) / S); i++) {
      if (i === 0 && j === 0) continue;
      const sd = ((i * 73856093) ^ (j * 19349663)) & 0xffff;
      const x = i * S + (rand(sd) - 0.5) * 90 + 6 * Math.sin(t * 0.7 + sd), y = j * S + (rand(sd + 1) - 0.5) * 90 + 6 * Math.cos(t * 0.6 + sd);
      if (rand(sd + 2) < 0.45) out.push(<Frag key={`f${i},${j}`} x={x} y={y} s={0.75 + 0.3 * rand(sd + 3)} rot={rand(sd + 4) * 180 + t * 18 * (rand(sd + 5) - 0.5)} t={t + i} />);
      else out.push(<circle key={`p${i},${j}`} cx={x} cy={y} r={14 + 16 * rand(sd + 6)} fill="#FFF3D6" opacity={0.35} />);
    }
  return (
    <g opacity={1 - lift(dark, 0.55, 1)}>
      <rect width={W} height={H} fill={mixHex(P.plasma, '#241A12', lift(dark, 0, 0.75))} />
      <rect width={W} height={H} fill="url(#vig)" opacity={0.5} />
      <g transform={camTransform(cam)} opacity={1 - lift(dark, 0, 0.6)}>{out}</g>
    </g>
  );
};
const ReadV5: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const dark = lift(t, tR.unzip - 0.15, tR.ref + 0.2);
  const level = lift(t, tR.level - 0.3, tR.unzip);
  const unzip = lift(t, tR.unzip, tR.unzip + 0.45);
  const letters = lift(t, tR.unzip + 0.3, tR.unzip + 0.75);
  const rot = lerp(heroRot(Math.min(t, tR.level - 0.3)), 0, level);
  // A: the reference comes in above; the changed column lights; two more tumour reads carry the same change
  const ref = lift(t, tR.ref, tR.ref + 0.4);
  const markA = lift(t, tR.mark - 0.05, tR.mark + 0.3);
  const reads = [lift(t, tR.more, tR.more + 0.4), lift(t, tR.more + 0.2, tR.more + 0.6)];
  // B: a later read carries a second change; then everything but that base steps back
  const late = lift(t, tR.late, tR.late + 0.45);
  const markB = lift(t, tR.markB, tR.markB + 0.3);
  const iso = lift(t, tR.iso, tR.iso + 0.45);
  const isoMove = lift(t, tR.iso + 0.15, tR.bead + 0.1);
  // C: the base becomes the residue it changes and lands on the turning protein
  const bead = lift(t, tR.bead, tR.bead + 0.25);
  const fly = lift(t, tR.bead + 0.2, tR.land);
  const prot = lift(t, tR.bead - 0.05, tR.bead + 0.5);
  const swell = lift(t, tR.land - 0.1, tR.swell + 0.35);
  const seqOut = 1 - 0.9 * iso;
  // D: the earlier drug runs into the swollen residue and backs off; the redesigned one seats and the pocket closes
  const oA = lift(t, tR.old, tR.old + 0.5), oHit = Math.exp(-((t - (tR.old + 0.55)) ** 2) / 0.006), oBack = lift(t, tR.old + 0.62, tR.old + 0.95), oFade = lift(t, tR.old + 0.8, tR.old + 1.1);
  const nB = lift(t, tR.fresh, tR.fresh + 0.4), nA = lift(t, tR.fresh + 0.3, tR.fresh + 0.7), nSeat = lift(t, tR.fresh + 0.7, tR.fresh + 1.0);
  const closeK = lift(t, tR.close - 0.3, tR.close + 0.2);
  const oldPos = (() => {
    const home = alongP(760, -120), rim = alongP(300, 0), back = alongP(560, -80);
    const c = molC(MOL_FIT);
    const p: Pt = oBack > 0 ? [lerp(rim[0], back[0], oBack), lerp(rim[1], back[1], oBack)] : [lerp(home[0], rim[0], oA), lerp(home[1], rim[1], oA)];
    return {x: p[0] - c[0] * MS5 + 6 * oHit * Math.sin(t * 60), y: p[1] - c[1] * MS5, rot: lerp(20, 0, oA) + 6 * oHit * Math.sin(t * 45)};
  })();
  const newPos = (() => {
    const home = alongP(620, 140), rim = alongP(240, 0);
    const c = molC(MOL_NEW);
    const seat: Pt = [POCKET[0] - VAR_DIR[0] * 85, POCKET[1] - VAR_DIR[1] * 85];
    const p: Pt = [lerp(lerp(home[0], rim[0], nA), seat[0], nSeat), lerp(lerp(home[1], rim[1], nA), seat[1], nSeat)];
    return {x: p[0] - c[0] * MS5, y: p[1] - c[1] * MS5, rot: lerp(-40, 0, smooth(nA * 0.5 + nSeat * 0.5))};
  })();
  const variant = {k: VAR_K, grow: swell, col: '#B58CFF', hot: oHit};
  const ry = rotYAt(t);
  const pglow = 0.55 * prot * (1 - closeK);
  const vw = varWorld(t);
  const isoP: Pt = [lerp(colX(VB), ISO_AT[0], isoMove), lerp(3 * ROW, ISO_AT[1], isoMove)];
  const beadP: Pt = [lerp(isoP[0], vw[0], smooth(fly)), lerp(isoP[1], vw[1], smooth(fly)) - 18 * Math.sin(fly * Math.PI)];
  const row = (y: number, seq: string, op: number, hl: (k: number) => string | null, dim = false) =>
    seq.split('').map((ch, k) => <Letter key={k} x={colX(k)} y={y} ch={ch} col={hl(k) ?? (dim ? '#5E9FC0' : P.aiHot)} op={op * (hl(k) ? 1 : seqOut)} bold={!!hl(k)} />);
  const rowsIn = 1 + reads[0] + reads[1] + lift(late, 0.5, 1);
  const colBox = (c: number, k: number, col: string) => k > 0.01 && (
    <g opacity={k * seqOut}>
      <rect x={colX(c) - 8.5} y={-ROW - 11} width={17} height={ROW * rowsIn + 22} rx={4} fill={col} opacity={0.1} />
      <rect x={colX(c) - 8.5} y={-ROW - 11} width={17} height={ROW * rowsIn + 22} rx={4} fill="none" stroke={col} strokeWidth={1.2} />
    </g>
  );
  const READ2 = 'TCATTGG', READ_LATE = 'TCATTAG';
  return (
    <g>
      <AIBack cam={cam} t={t} op={0.35} />
      <PlasmaBack t={t} cam={cam} dark={dark} />
      <g transform={camTransform(cam)}>
        {/* the protein turns into view behind the isolated base */}
        {prot > 0.01 && (
          <g transform={`translate(${PROT_C[0]} ${PROT_C[1]}) scale(${PS})`} opacity={prot}>
            <Protein t={t} digital={0.55} pocketGlow={pglow} breathe={1 - 0.8 * closeK} rotY={ry} variant={variant} layer="back" close={closeK} />
            {oA > 0.01 && oFade < 0.99 && <Molecule mol={MOL_FIT} x={oldPos.x} y={oldPos.y} rot={oldPos.rot} s={MS5} digital={0.35} bad={oHit} op={1 - oFade} />}
            {nB > 0.01 && <Molecule mol={MOL_NEW} x={newPos.x} y={newPos.y} rot={newPos.rot} s={MS5} built={nB} digital={0.2 * (1 - nSeat)} glow={0.5 * nSeat * (1 - closeK * 0.5)} />}
            <Protein t={t} digital={0.55} breathe={1 - 0.8 * closeK} rotY={ry} variant={variant} layer="front" close={closeK} />
          </g>
        )}
        {iso < 0.99 && (
          <g opacity={1 - iso}>
            {/* reference above, a thin rule under it */}
            {ref > 0.01 && <g transform={`translate(0 ${-ROW - 30 * (1 - ref)})`} opacity={ref}>{row(0, REF7, 1, () => null, true)}<line x1={-70} x2={70} y1={9} y2={9} stroke={P.aiDim} strokeWidth={0.8} /></g>}
            {reads.map((k, m) => k > 0.01 && <g key={m} transform={`translate(${60 * (1 - k)} ${ROW * (m + 1)})`} opacity={k}>{row(0, READ2, 1, (c) => (c === VA ? P.payload : null))}</g>)}
          </g>
        )}
        {colBox(VA, markA * (1 - iso), P.payload)}
        {colBox(VB, markB * (1 - iso), '#B58CFF')}
        {/* the later fragment arrives and opens into its letters */}
        {late > 0.01 && (late < 0.5 ? (
          <Frag x={lerp(150, 0, late / 0.5)} y={3 * ROW} s={lerp(0.6, 1, late / 0.5)} rot={lerp(30, 0, late / 0.5)} tumor alt={1} t={t} />
        ) : (
          <g transform={`translate(0 ${3 * ROW})`} opacity={1 - iso}>{row(0, READ_LATE, (late - 0.5) / 0.5, (c) => (c === VA ? P.payload : null)).filter((_, k) => k !== VB)}</g>
        ))}
        {/* the hero read stays in its row (row 0) */}
        {iso < 0.99 && <g opacity={1 - iso * 0.95}><HeroDNA t={t} rot={rot} unzip={unzip} letters={letters} seq={READ2} glow={(1 - letters) * 0.9} /></g>}
        {/* the isolated base, then the residue it becomes */}
        {late > 0.5 && bead < 0.99 && <Letter x={isoP[0]} y={isoP[1]} ch="A" col="#B58CFF" s={1 + 1.2 * isoMove} op={clamp01((late - 0.5) * 2) * (1 - bead)} bold />}
        {bead > 0.01 && fly < 0.999 && (
          <g transform={`translate(${beadP[0]} ${beadP[1]})`} opacity={bead * (1 - lift(fly, 0.85, 1))}>
            <circle r={14} fill="url(#glowMut)" opacity={0.5} />
            <circle r={lerp(9, 6, fly)} fill="#B58CFF" />
            <circle r={lerp(9, 6, fly)} fill="url(#vol)" />
          </g>
        )}
      </g>
      <Bokeh cam={cam} t={t} fill="url(#bokehCool)" op={0.22 * dark} n={6} size={240} />
    </g>
  );
};

// ================================================================================================ precision attack (tissue, by the regrown colony)
const RX = (() => { const n = nearest(TIP[0] - 420, TIP[1] + 520); return {...n, ...cellAt(n.i, n.j)}; })();
const HN = (() => { const n = nearest(RX.x - 250, RX.y - 260); return {...n, ...cellAt(n.i, n.j)}; })();     // a healthy cell on the new T cell's way
const T_OLD_AT: Pt = [RX.x + R + 50 - 8, RX.y + 20];
const NEW_FROM: Pt = [RX.x - 700, RX.y - 520];
const NEW_ANG = Math.atan2(NEW_FROM[1] - RX.y, NEW_FROM[0] - RX.x);
const NEW_AT: Pt = [RX.x + Math.cos(NEW_ANG) * (R + 50 - 10), RX.y + Math.sin(NEW_ANG) * (R + 50 - 10)];
const ATT = {grip: tF.evolving + 0.6, lose: tF.evolving + 1.0, arrive: tF.defense + 0.2, lock: tF.defense + 0.45, kill: tF.defense + 0.75};
/** the new T cell steers: drawn toward the target, it brushes past the healthy cell without stopping, then decelerates into contact */
const newPos = (t: number): Pt => {
  const u = lift(t, tF.met - 0.25, ATT.arrive);
  const via: Pt = [HN.x + R + 40, HN.y + 30];
  const a = u < 0.5 ? smooth(u * 2) : 1, b = u < 0.5 ? 0 : smooth((u - 0.5) * 2);
  return [lerp(lerp(NEW_FROM[0], via[0], a), NEW_AT[0], b), lerp(lerp(NEW_FROM[1], via[1], a), NEW_AT[1], b)];
};
export const ATT_PT: Pt = [RX.x, RX.y];
export const ATT_CAM = path([
  {t: tF.evolving, x: RX.x + 60, y: RX.y - 20, z: 3.6, rot: 0},
  {t: tF.evolving + 0.8, x: RX.x + 40, y: RX.y, z: 1.9, rot: 0},
  {t: tF.met + 0.2, x: RX.x - 80, y: RX.y - 60, z: 1.55, rot: 0},
  {t: tF.defense + 0.5, x: RX.x - 40, y: RX.y - 20, z: 1.85, rot: 0},
  {t: tF.breakthrough, x: RX.x - 20, y: RX.y - 10, z: 2.0, rot: 0},
]);
const Attack: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const lod = R * cam.z;
  const morph = lift(t, tF.evolving + 0.05, tF.evolving + 0.6);
  const lose = lift(t, ATT.lose, ATT.lose + 0.6);
  const die = clamp01((t - ATT.kill - 0.2) / 1.7);
  const np = newPos(t);
  const nAng = Math.atan2(RX.y - np[1], RX.x - np[0]);
  const press = 0.2 * lift(t, ATT.arrive - 0.1, ATT.lock);
  const oldP: Pt = [T_OLD_AT[0] + 160 * lose, T_OLD_AT[1] + 90 * lose];
  const oAng = Math.atan2(RX.y - oldP[1], RX.x - oldP[0]);
  const recv = (p: Pt, ang: number, kind: number, n: number, k: number) => Array.from({length: n}, (_, m) => {
    const a = ang + (m - (n - 1) / 2) * 0.32;
    return <path key={m} d={morphPath(kind, kind, 0, 11)} transform={`translate(${p[0] + Math.cos(a) * 50} ${p[1] + Math.sin(a) * 50}) rotate(${(a * 180) / Math.PI + 90})`} fill="none" stroke={P.immuneGold} strokeWidth={4} opacity={k} />;
  });
  return (
    <g>
      <TissueBack cam={cam} t={t} farSkip />
      <g transform={camTransform(cam)}>
        <TissueField farSkip cam={cam} t={t} mod={cam.z > 0.05 ? (i, j) => (i === RX.i && j === RX.j ? {hide: true} : null) : undefined} />
        {SPROUTS.slice(0, 1).map((c, k) => <Capillary key={k} pts={c} t={t} w={78} lod={cam.z} />)}
        {die <= 0 ? <Cell2 x={RX.x} y={RX.y} seed={RX.seed} t={t} lod={lod} look={RESIST} nucScale={1.25} irr={0.07} flat={press > 0.01 ? {a: nAng + Math.PI, d: 0.06} : undefined} /> : <ApoptoticCell x={RX.x} y={RX.y} seed={RX.seed} t={t} die={die} lod={lod} look={RESIST} />}
        {die < 0.3 && Array.from({length: 8}, (_, m) => {
          const a = (m / 8) * Math.PI * 2 + RX.seed;
          return <path key={m} d={morphPath(1, 2, morph, 13)} transform={`translate(${RX.x + Math.cos(a) * R * 0.98} ${RX.y + Math.sin(a) * R * 0.98}) rotate(${(a * 180) / Math.PI + 90})`} fill={mixHex(MARK_COL[1], MARK_COL[2], morph)} stroke="#FFFFFF" strokeWidth={2} opacity={1 - die * 3} />;
        })}
        {/* the old T cell: its square-fitting receptors lose their grip as the marker changes */}
        <TCell2 x={oldP[0]} y={oldP[1]} r={50} t={t} seed={5} dir={oAng + Math.PI * lose} lod={lod} flat={{a: oAng, d: 0.18 * (1 - lose)}} />
        {recv(oldP, oAng, 1, 3, 1 - lose * 0.6)}
        {/* the redesigned T cell */}
        {t > tF.met - 0.5 && (
          <g opacity={lift(t, tF.met - 0.5, tF.met - 0.1)}>
            <Synapse a={np} b={[RX.x, RX.y]} k={lift(t, ATT.lock, ATT.lock + 0.25) * (1 - lift(t, ATT.kill + 0.6, ATT.kill + 1.0))} rA={50} />
            <Granules a={np} b={[RX.x, RX.y]} t={t} t0={ATT.kill} n={8} r={6} />
            <TCell2 x={np[0]} y={np[1]} r={50} t={t} seed={9} dir={nAng} lod={lod} act={0.3 + 0.4 * press * 5} light={mixHex(P.tcellLight, '#B58CFF', 0.35)} flat={press > 0.01 ? {a: nAng, d: press} : undefined} />
            {recv(np, nAng, 2, 3, 1)}
          </g>
        )}
      </g>
      <Motes cam={cam} t={t} />
      <Bokeh cam={cam} t={t} fill="url(#bokehWarm)" op={0.75} n={7} size={250} />
    </g>
  );
};

export const F_TISSUE_CAM = CAM_T;
/** after the kill, one continuous pull-out: cell → tissue → lung → the whole person (the body world continues it) */
export const PULL0 = tF.breakthrough;
export const BODY_PULL = path([
  {...fromTissue(ATT_CAM(PULL0)), t: PULL0},
  {t: PULL0 + 0.8, x: SITE.tumor[0], y: SITE.tumor[1], z: 130, rot: 0},
  {t: PULL0 + 1.55, x: 140, y: -400, z: 3.6, rot: 0},
  {t: PULL0 + 2.35, x: 420, y: -90, z: 0.47, rot: 0},
]);
export const shotsF4: Shot[] = [
  {id: 'F-tissue', t0: KILL_OUT, t1: tF.cancer + 0.4, fade: 0.7, draw: (t) => <TissueF t={t} cam={CAM_T(t)} />},
  {id: 'F-blood', t0: tF.cancer - 0.1, t1: TUBE[0] + 0.05, fade: 0.5, draw: (t) => <BloodF t={t} cam={CAM_B(t)} />},
  {id: 'F-tube', t0: TUBE[0] - 0.3, t1: DIVE[1] + 0.05, fade: 0.3, draw: (t) => <Tube t={t} cam={CAM_TU(t)} />},
  {id: 'F-read', t0: DIVE[0], t1: tF.evolving, fade: DIVE[1] - DIVE[0], draw: (t) => <ReadV5 t={t} cam={CAM_RD(t)} />},
  {id: 'F-attack', t0: tF.evolving, t1: PULL0 + 1.0, draw: (t) => <Attack t={t} cam={t < PULL0 ? ATT_CAM(t) : toTissue(BODY_PULL(t))} />},
];
export const _f4 = {HEALTHY, tipNoop: 0};
